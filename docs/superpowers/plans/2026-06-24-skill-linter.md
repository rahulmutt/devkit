# Skill Linter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Deno skill linter that enforces skill-content invariants
(frontmatter, description budget, reference-link integrity, using-devkit
registry sync) and wire it into the existing release gate.

**Architecture:** A standalone entrypoint `scripts/lint-skills.ts` plus small
pure check modules under `scripts/lib/lint/`, mirroring the generator's shape
(thin entrypoint + `lib/` modules, each with a `_test.ts`). A `discover` module
does the only filesystem reads and produces in-memory `SkillRecord`s; every
check is a pure function `(records, …) => Finding[]` so it tests against
synthetic fixtures. Errors fail the release gate; warnings print but pass.

**Tech Stack:** Deno 2.1.4, TypeScript, `@std/assert`, `@std/path` (both already
in `deno.json` imports). No new dependencies.

## Global Constraints

- Runtime is **Deno**; no Node-only APIs. Use `Deno.readDir`,
  `Deno.readTextFile`, `Deno.makeTempDir`.
- **No new dependencies.** Only `@std/assert` (mapped) and
  `jsr:@std/path@^1.0.0` (as used in `scripts/lib/files.ts`).
- Tests use `Deno.test` + `@std/assert`, matching `scripts/lib/*_test.ts`.
- Finding levels: `error` fails the release gate (exit 1); `warn` prints only
  (exit 0).
- Description budget: **warn > 500 chars**, **error > 1024 chars**.
- Reference link extraction must handle **both** styles in the skills: markdown
  links `](references/NAME.EXT)` and bare prose mentions `references/NAME.EXT`,
  for **any** extension (`.md`, `.toml`, `.nix`).
- Harness→reference-stem map encodes the known mismatch:
  `claude → claude-code-tools`; every other harness → `<harness>-tools`.
- Run `deno fmt` before committing each task so generated/source formatting
  stays clean.

---

### Task 1: Types and skill discovery

**Files:**

- Create: `scripts/lib/lint/types.ts`
- Create: `scripts/lib/lint/discover.ts`
- Test: `scripts/lib/lint/discover_test.ts`

**Interfaces:**

- Consumes: nothing (first task).
- Produces:
  - `interface SkillRecord { name: string; dir: string; description: string; hasFrontmatter: boolean; body: string; referenceFiles: string[] }`
  - `interface Finding { level: "error" | "warn"; skill: string; message: string }`
  - `function parseFrontmatter(src: string): { hasFrontmatter: boolean; name: string; description: string; body: string }`
  - `function discoverSkills(skillsDir: string): Promise<SkillRecord[]>` —
    sorted by `dir`, skips dirs without `SKILL.md`.

- [ ] **Step 1: Write the failing test**

```ts
// scripts/lib/lint/discover_test.ts
import { assertEquals } from "@std/assert";
import { discoverSkills, parseFrontmatter } from "./discover.ts";

Deno.test("parseFrontmatter reads name, description, and body", () => {
  const src =
    "---\nname: foo\ndescription: Use when testing.\n---\n# Body\ntext\n";
  const fm = parseFrontmatter(src);
  assertEquals(fm.hasFrontmatter, true);
  assertEquals(fm.name, "foo");
  assertEquals(fm.description, "Use when testing.");
  assertEquals(fm.body.includes("# Body"), true);
});

Deno.test("parseFrontmatter flags a file with no frontmatter", () => {
  const fm = parseFrontmatter("# Just a heading\n");
  assertEquals(fm.hasFrontmatter, false);
  assertEquals(fm.name, "");
  assertEquals(fm.description, "");
});

Deno.test("discoverSkills finds skills, parses them, lists reference files", async () => {
  const dir = await Deno.makeTempDir();
  await Deno.mkdir(`${dir}/alpha/references`, { recursive: true });
  await Deno.writeTextFile(
    `${dir}/alpha/SKILL.md`,
    "---\nname: alpha\ndescription: Use when alpha.\n---\nsee references/x.md\n",
  );
  await Deno.writeTextFile(`${dir}/alpha/references/x.md`, "x\n");
  await Deno.mkdir(`${dir}/not-a-skill`, { recursive: true });

  const records = await discoverSkills(dir);
  assertEquals(records.length, 1);
  assertEquals(records[0].name, "alpha");
  assertEquals(records[0].dir, "alpha");
  assertEquals(records[0].description, "Use when alpha.");
  assertEquals(records[0].referenceFiles, ["x.md"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test scripts/lib/lint/discover_test.ts --allow-read --allow-write`
Expected: FAIL — `Module not found "discover.ts"`.

- [ ] **Step 3: Write the types module**

```ts
// scripts/lib/lint/types.ts
export interface SkillRecord {
  name: string;
  dir: string;
  description: string;
  hasFrontmatter: boolean;
  body: string;
  referenceFiles: string[];
}

export interface Finding {
  level: "error" | "warn";
  skill: string;
  message: string;
}
```

- [ ] **Step 4: Write the discover module**

```ts
// scripts/lib/lint/discover.ts
import { join } from "jsr:@std/path@^1.0.0";
import type { SkillRecord } from "./types.ts";

interface ParsedFrontmatter {
  hasFrontmatter: boolean;
  name: string;
  description: string;
  body: string;
}

export function parseFrontmatter(src: string): ParsedFrontmatter {
  const match = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { hasFrontmatter: false, name: "", description: "", body: src };
  }
  const [, fm, body] = match;
  return {
    hasFrontmatter: true,
    name: fieldValue(fm, "name"),
    description: fieldValue(fm, "description"),
    body,
  };
}

function fieldValue(fm: string, key: string): string {
  const line = fm.split("\n").find((l) => l.startsWith(`${key}:`));
  return line ? line.slice(key.length + 1).trim() : "";
}

export async function discoverSkills(
  skillsDir: string,
): Promise<SkillRecord[]> {
  const records: SkillRecord[] = [];
  for await (const entry of Deno.readDir(skillsDir)) {
    if (!entry.isDirectory) continue;
    const dir = entry.name;
    let src: string;
    try {
      src = await Deno.readTextFile(join(skillsDir, dir, "SKILL.md"));
    } catch {
      continue;
    }
    const fm = parseFrontmatter(src);
    records.push({
      name: fm.name,
      dir,
      description: fm.description,
      hasFrontmatter: fm.hasFrontmatter,
      body: fm.body,
      referenceFiles: await listReferenceFiles(
        join(skillsDir, dir, "references"),
      ),
    });
  }
  records.sort((a, b) => a.dir.localeCompare(b.dir));
  return records;
}

async function listReferenceFiles(refsDir: string): Promise<string[]> {
  const files: string[] = [];
  try {
    for await (const entry of Deno.readDir(refsDir)) {
      if (entry.isFile) files.push(entry.name);
    }
  } catch {
    // no references directory — fine
  }
  return files.sort();
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `deno test scripts/lib/lint/discover_test.ts --allow-read --allow-write`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
deno fmt scripts/lib/lint/
git add scripts/lib/lint/types.ts scripts/lib/lint/discover.ts scripts/lib/lint/discover_test.ts
git commit -m "feat: skill linter discovery + types"
```

---

### Task 2: Frontmatter check

**Files:**

- Create: `scripts/lib/lint/frontmatter.ts`
- Test: `scripts/lib/lint/frontmatter_test.ts`

**Interfaces:**

- Consumes: `SkillRecord`, `Finding` from `./types.ts`.
- Produces: `function checkFrontmatter(records: SkillRecord[]): Finding[]`.

- [ ] **Step 1: Write the failing test**

```ts
// scripts/lib/lint/frontmatter_test.ts
import { assertEquals } from "@std/assert";
import { checkFrontmatter } from "./frontmatter.ts";
import type { SkillRecord } from "./types.ts";

function rec(over: Partial<SkillRecord>): SkillRecord {
  return {
    name: "alpha",
    dir: "alpha",
    description: "Use when alpha.",
    hasFrontmatter: true,
    body: "",
    referenceFiles: [],
    ...over,
  };
}

Deno.test("clean record yields no findings", () => {
  assertEquals(checkFrontmatter([rec({})]), []);
});

Deno.test("missing frontmatter is one error", () => {
  const f = checkFrontmatter([
    rec({ hasFrontmatter: false, name: "", description: "" }),
  ]);
  assertEquals(f.length, 1);
  assertEquals(f[0].level, "error");
});

Deno.test("name not matching directory is an error", () => {
  const f = checkFrontmatter([rec({ name: "beta", dir: "alpha" })]);
  assertEquals(f.length, 1);
  assertEquals(f[0].level, "error");
});

Deno.test("empty description is an error", () => {
  const f = checkFrontmatter([rec({ description: "" })]);
  assertEquals(f.some((x) => x.level === "error"), true);
});

Deno.test("description not starting with 'Use when' is a warn", () => {
  const f = checkFrontmatter([rec({ description: "Helps with alpha." })]);
  assertEquals(f.length, 1);
  assertEquals(f[0].level, "warn");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test scripts/lib/lint/frontmatter_test.ts --allow-read` Expected:
FAIL — `Module not found "frontmatter.ts"`.

- [ ] **Step 3: Write the implementation**

```ts
// scripts/lib/lint/frontmatter.ts
import type { Finding, SkillRecord } from "./types.ts";

export function checkFrontmatter(records: SkillRecord[]): Finding[] {
  const findings: Finding[] = [];
  for (const r of records) {
    const id = r.name || r.dir;
    if (!r.hasFrontmatter) {
      findings.push({
        level: "error",
        skill: id,
        message: "no YAML frontmatter block",
      });
      continue;
    }
    if (!r.name) {
      findings.push({
        level: "error",
        skill: r.dir,
        message: "frontmatter name is missing or empty",
      });
    } else if (r.name !== r.dir) {
      findings.push({
        level: "error",
        skill: r.dir,
        message:
          `frontmatter name "${r.name}" does not match directory "${r.dir}"`,
      });
    }
    if (!r.description) {
      findings.push({
        level: "error",
        skill: id,
        message: "frontmatter description is missing or empty",
      });
    } else if (!r.description.startsWith("Use when")) {
      findings.push({
        level: "warn",
        skill: id,
        message: 'description does not start with "Use when"',
      });
    }
  }
  return findings;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `deno test scripts/lib/lint/frontmatter_test.ts --allow-read` Expected:
PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
deno fmt scripts/lib/lint/
git add scripts/lib/lint/frontmatter.ts scripts/lib/lint/frontmatter_test.ts
git commit -m "feat: skill linter frontmatter check"
```

---

### Task 3: Description budget check

**Files:**

- Create: `scripts/lib/lint/budget.ts`
- Test: `scripts/lib/lint/budget_test.ts`

**Interfaces:**

- Consumes: `SkillRecord`, `Finding` from `./types.ts`.
- Produces: `function checkBudget(records: SkillRecord[]): Finding[]`, plus
  exported consts `WARN_OVER = 500`, `ERROR_OVER = 1024`.

- [ ] **Step 1: Write the failing test**

```ts
// scripts/lib/lint/budget_test.ts
import { assertEquals } from "@std/assert";
import { checkBudget } from "./budget.ts";
import type { SkillRecord } from "./types.ts";

function withDesc(description: string): SkillRecord {
  return {
    name: "a",
    dir: "a",
    description,
    hasFrontmatter: true,
    body: "",
    referenceFiles: [],
  };
}

Deno.test("short description is clean", () => {
  assertEquals(checkBudget([withDesc("x".repeat(400))]), []);
});

Deno.test("over 500 is a warn", () => {
  const f = checkBudget([withDesc("x".repeat(600))]);
  assertEquals(f.length, 1);
  assertEquals(f[0].level, "warn");
});

Deno.test("over 1024 is an error", () => {
  const f = checkBudget([withDesc("x".repeat(1100))]);
  assertEquals(f.length, 1);
  assertEquals(f[0].level, "error");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test scripts/lib/lint/budget_test.ts --allow-read` Expected: FAIL —
`Module not found "budget.ts"`.

- [ ] **Step 3: Write the implementation**

```ts
// scripts/lib/lint/budget.ts
import type { Finding, SkillRecord } from "./types.ts";

export const WARN_OVER = 500;
export const ERROR_OVER = 1024;

export function checkBudget(records: SkillRecord[]): Finding[] {
  const findings: Finding[] = [];
  for (const r of records) {
    const len = r.description.length;
    const id = r.name || r.dir;
    if (len > ERROR_OVER) {
      findings.push({
        level: "error",
        skill: id,
        message: `description is ${len} chars (max ${ERROR_OVER})`,
      });
    } else if (len > WARN_OVER) {
      findings.push({
        level: "warn",
        skill: id,
        message: `description is ${len} chars (target <=${WARN_OVER})`,
      });
    }
  }
  return findings;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `deno test scripts/lib/lint/budget_test.ts --allow-read` Expected: PASS (3
tests).

- [ ] **Step 5: Commit**

```bash
deno fmt scripts/lib/lint/
git add scripts/lib/lint/budget.ts scripts/lib/lint/budget_test.ts
git commit -m "feat: skill linter description budget check"
```

---

### Task 4: Reference-link integrity check

**Files:**

- Create: `scripts/lib/lint/links.ts`
- Test: `scripts/lib/lint/links_test.ts`

**Interfaces:**

- Consumes: `SkillRecord`, `Finding` from `./types.ts`.
- Produces:
  - `function referencedFiles(body: string): string[]` — extracts mentioned
    reference filenames (any extension), de-duplicated and sorted.
  - `function checkLinks(records: SkillRecord[]): Finding[]`.

**Note:** The regex `/references\/([\w-]+(?:\.[\w-]+)+)/g` requires an
extension, so it matches `decision-tree.md`, `mise.toml`, and `devenv.nix`,
ignores a bare `references/`, and stops before a trailing sentence period.

- [ ] **Step 1: Write the failing test**

```ts
// scripts/lib/lint/links_test.ts
import { assertEquals } from "@std/assert";
import { checkLinks, referencedFiles } from "./links.ts";
import type { SkillRecord } from "./types.ts";

function rec(over: Partial<SkillRecord>): SkillRecord {
  return {
    name: "a",
    dir: "a",
    description: "Use when a.",
    hasFrontmatter: true,
    body: "",
    referenceFiles: [],
    ...over,
  };
}

Deno.test("referencedFiles captures markdown links, prose, and non-md extensions", () => {
  const body =
    "See [`references/x.md`](references/x.md) and `references/mise.toml` and references/devenv.nix.";
  assertEquals(referencedFiles(body), ["devenv.nix", "mise.toml", "x.md"]);
});

Deno.test("a mentioned-but-missing reference is an error", () => {
  const f = checkLinks([
    rec({ body: "see references/gone.md", referenceFiles: [] }),
  ]);
  assertEquals(f.length, 1);
  assertEquals(f[0].level, "error");
});

Deno.test("an unmentioned reference file is a warn (orphan)", () => {
  const f = checkLinks([
    rec({ body: "no links here", referenceFiles: ["orphan.md"] }),
  ]);
  assertEquals(f.length, 1);
  assertEquals(f[0].level, "warn");
});

Deno.test("all references mentioned and present is clean", () => {
  const f = checkLinks([
    rec({ body: "see references/x.md", referenceFiles: ["x.md"] }),
  ]);
  assertEquals(f, []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test scripts/lib/lint/links_test.ts --allow-read` Expected: FAIL —
`Module not found "links.ts"`.

- [ ] **Step 3: Write the implementation**

```ts
// scripts/lib/lint/links.ts
import type { Finding, SkillRecord } from "./types.ts";

export function referencedFiles(body: string): string[] {
  const re = /references\/([\w-]+(?:\.[\w-]+)+)/g;
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) found.add(m[1]);
  return [...found].sort();
}

export function checkLinks(records: SkillRecord[]): Finding[] {
  const findings: Finding[] = [];
  for (const r of records) {
    const id = r.name || r.dir;
    const mentioned = referencedFiles(r.body);
    const present = new Set(r.referenceFiles);
    for (const ref of mentioned) {
      if (!present.has(ref)) {
        findings.push({
          level: "error",
          skill: id,
          message: `references/${ref} linked but not found`,
        });
      }
    }
    const mentionedSet = new Set(mentioned);
    for (const file of r.referenceFiles) {
      if (!mentionedSet.has(file)) {
        findings.push({
          level: "warn",
          skill: id,
          message: `references/${file} exists but is never mentioned`,
        });
      }
    }
  }
  return findings;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `deno test scripts/lib/lint/links_test.ts --allow-read` Expected: PASS (4
tests).

- [ ] **Step 5: Commit**

```bash
deno fmt scripts/lib/lint/
git add scripts/lib/lint/links.ts scripts/lib/lint/links_test.ts
git commit -m "feat: skill linter reference-link check"
```

---

### Task 5: using-devkit registry check

**Files:**

- Create: `scripts/lib/lint/registry.ts`
- Test: `scripts/lib/lint/registry_test.ts`

**Interfaces:**

- Consumes: `SkillRecord`, `Finding` from `./types.ts`; `Harness` from
  `../types.ts`.
- Produces:
  - `function stemFor(harness: string): string` —
    `claude → "claude-code-tools"`, else `"<harness>-tools"`.
  - `function checkRegistry(records: SkillRecord[], usingDevkit: SkillRecord, harnesses: Harness[], bootstrapSkill: string): Finding[]`
    — findings use skill id `"<registry>"`.

- [ ] **Step 1: Write the failing test**

```ts
// scripts/lib/lint/registry_test.ts
import { assertEquals } from "@std/assert";
import { checkRegistry, stemFor } from "./registry.ts";
import type { SkillRecord } from "./types.ts";

function skill(dir: string): SkillRecord {
  return {
    name: dir,
    dir,
    description: "Use when " + dir,
    hasFrontmatter: true,
    body: "",
    referenceFiles: [],
  };
}

const PRIMER = (body: string, refs: string[]): SkillRecord => ({
  name: "using-devkit",
  dir: "using-devkit",
  description: "Use when starting.",
  hasFrontmatter: true,
  body,
  referenceFiles: refs,
});

Deno.test("stemFor maps claude specially", () => {
  assertEquals(stemFor("claude"), "claude-code-tools");
  assertEquals(stemFor("codex"), "codex-tools");
});

Deno.test("fully wired registry is clean", () => {
  const records = [skill("using-devkit"), skill("alpha")];
  const body =
    "**alpha** does things. references/claude-code-tools.md references/codex-tools.md";
  const primer = PRIMER(body, ["claude-code-tools.md", "codex-tools.md"]);
  const f = checkRegistry(records, primer, ["claude", "codex"], "using-devkit");
  assertEquals(f, []);
});

Deno.test("skill absent from primer is an error", () => {
  const records = [skill("using-devkit"), skill("alpha")];
  const primer = PRIMER("references/claude-code-tools.md", [
    "claude-code-tools.md",
  ]);
  const f = checkRegistry(records, primer, ["claude"], "using-devkit");
  assertEquals(
    f.some((x) => x.level === "error" && x.message.includes("alpha")),
    true,
  );
});

Deno.test("harness missing its tool-ref file is an error", () => {
  const records = [skill("using-devkit")];
  const primer = PRIMER("references/codex-tools.md", []);
  const f = checkRegistry(records, primer, ["codex"], "using-devkit");
  assertEquals(
    f.some((x) => x.level === "error" && x.message.includes("codex-tools.md")),
    true,
  );
});

Deno.test("stale tool-ref for an unconfigured harness is a warn", () => {
  const records = [skill("using-devkit")];
  const body = "references/claude-code-tools.md references/codex-tools.md";
  const primer = PRIMER(body, ["claude-code-tools.md", "codex-tools.md"]);
  const f = checkRegistry(records, primer, ["claude"], "using-devkit");
  assertEquals(
    f.some((x) => x.level === "warn" && x.message.includes("codex-tools.md")),
    true,
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test scripts/lib/lint/registry_test.ts --allow-read` Expected: FAIL —
`Module not found "registry.ts"`.

- [ ] **Step 3: Write the implementation**

```ts
// scripts/lib/lint/registry.ts
import type { Finding, SkillRecord } from "./types.ts";
import type { Harness } from "../types.ts";

const REGISTRY = "<registry>";
const REFERENCE_STEM: Record<string, string> = { claude: "claude-code-tools" };

export function stemFor(harness: string): string {
  return REFERENCE_STEM[harness] ?? `${harness}-tools`;
}

export function checkRegistry(
  records: SkillRecord[],
  usingDevkit: SkillRecord,
  harnesses: Harness[],
  bootstrapSkill: string,
): Finding[] {
  const findings: Finding[] = [];
  const body = usingDevkit.body;

  for (const r of records) {
    if (r.dir === bootstrapSkill) continue;
    if (!body.includes(`**${r.dir}**`)) {
      findings.push({
        level: "error",
        skill: REGISTRY,
        message:
          `skill "${r.dir}" not listed in ${bootstrapSkill} (expected **${r.dir}**)`,
      });
    }
  }

  const refFiles = new Set(usingDevkit.referenceFiles);
  for (const h of harnesses) {
    const file = `${stemFor(h)}.md`;
    if (!refFiles.has(file)) {
      findings.push({
        level: "error",
        skill: REGISTRY,
        message: `harness "${h}" has no references/${file}`,
      });
    }
    if (!body.includes(`references/${file}`)) {
      findings.push({
        level: "error",
        skill: REGISTRY,
        message:
          `harness "${h}" missing its invoke-mapping row (references/${file})`,
      });
    }
  }

  const expected = new Set(harnesses.map((h) => `${stemFor(h)}.md`));
  for (const file of usingDevkit.referenceFiles) {
    if (file.endsWith("-tools.md") && !expected.has(file)) {
      findings.push({
        level: "warn",
        skill: REGISTRY,
        message: `references/${file} is a tool-ref for no configured harness`,
      });
    }
  }

  return findings;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `deno test scripts/lib/lint/registry_test.ts --allow-read` Expected: PASS
(5 tests).

- [ ] **Step 5: Commit**

```bash
deno fmt scripts/lib/lint/
git add scripts/lib/lint/registry.ts scripts/lib/lint/registry_test.ts
git commit -m "feat: skill linter using-devkit registry check"
```

---

### Task 6: Report builder

**Files:**

- Create: `scripts/lib/lint/report.ts`
- Test: `scripts/lib/lint/report_test.ts`

**Interfaces:**

- Consumes: `Finding` from `./types.ts`.
- Produces:
  - `interface Report { header: string; lines: string[]; summary: string; exitCode: number }`
  - `function buildReport(findings: Finding[], skillCount: number): Report` —
    `lines` sorted by skill then errors-before-warns; `exitCode` 1 iff any
    error.

- [ ] **Step 1: Write the failing test**

```ts
// scripts/lib/lint/report_test.ts
import { assertEquals } from "@std/assert";
import { buildReport } from "./report.ts";
import type { Finding } from "./types.ts";

Deno.test("clean run passes with exit 0", () => {
  const r = buildReport([], 4);
  assertEquals(r.exitCode, 0);
  assertEquals(r.header, "skill-lint: 4 skills checked");
  assertEquals(r.summary, "✓ all checks passed");
  assertEquals(r.lines, []);
});

Deno.test("any error sets exit 1 and summary counts", () => {
  const findings: Finding[] = [
    { level: "warn", skill: "b", message: "warn msg" },
    { level: "error", skill: "a", message: "err msg" },
  ];
  const r = buildReport(findings, 2);
  assertEquals(r.exitCode, 1);
  assertEquals(r.summary, "✗ 1 error, 1 warn");
  assertEquals(r.lines.length, 2);
  assertEquals(r.lines[0].includes("a"), true); // sorted by skill: a before b
});

Deno.test("only warnings keep exit 0", () => {
  const r = buildReport([{ level: "warn", skill: "a", message: "w" }], 1);
  assertEquals(r.exitCode, 0);
  assertEquals(r.summary, "✗ 0 errors, 1 warn");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test scripts/lib/lint/report_test.ts --allow-read` Expected: FAIL —
`Module not found "report.ts"`.

- [ ] **Step 3: Write the implementation**

```ts
// scripts/lib/lint/report.ts
import type { Finding } from "./types.ts";

export interface Report {
  header: string;
  lines: string[];
  summary: string;
  exitCode: number;
}

export function buildReport(findings: Finding[], skillCount: number): Report {
  const sorted = [...findings].sort((a, b) =>
    a.skill.localeCompare(b.skill) || rank(a.level) - rank(b.level)
  );
  const lines = sorted.map((f) =>
    `  ${f.level.padEnd(5)}  ${f.skill.padEnd(20)} ${f.message}`
  );

  const errors = findings.filter((f) => f.level === "error").length;
  const warns = findings.filter((f) => f.level === "warn").length;
  const header = `skill-lint: ${skillCount} skills checked`;
  const summary = errors === 0 && warns === 0
    ? "✓ all checks passed"
    : `✗ ${plural(errors, "error")}, ${plural(warns, "warn")}`;

  return { header, lines, summary, exitCode: errors > 0 ? 1 : 0 };
}

function rank(level: "error" | "warn"): number {
  return level === "error" ? 0 : 1;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `deno test scripts/lib/lint/report_test.ts --allow-read` Expected: PASS (3
tests).

- [ ] **Step 5: Commit**

```bash
deno fmt scripts/lib/lint/
git add scripts/lib/lint/report.ts scripts/lib/lint/report_test.ts
git commit -m "feat: skill linter report builder"
```

---

### Task 7: Entrypoint, wiring, and integration smoke test

**Files:**

- Create: `scripts/lint-skills.ts`
- Create: `scripts/lint-skills_test.ts`
- Modify: `deno.json` (add `lint-skills` task, extend `typecheck` and `ci`)

**Interfaces:**

- Consumes: `discoverSkills` (Task 1), `checkFrontmatter` (Task 2),
  `checkBudget` (Task 3), `checkLinks` (Task 4), `checkRegistry` (Task 5),
  `buildReport` (Task 6), and `config` from `../marketplace.config.ts`.
- Produces: the `lint-skills` CLI and the `deno task lint-skills` task in the
  release-gate chain.

- [ ] **Step 1: Write the failing integration test**

```ts
// scripts/lint-skills_test.ts
import { assertEquals } from "@std/assert";
import { discoverSkills } from "./lib/lint/discover.ts";
import { checkFrontmatter } from "./lib/lint/frontmatter.ts";
import { checkBudget } from "./lib/lint/budget.ts";
import { checkLinks } from "./lib/lint/links.ts";
import { checkRegistry } from "./lib/lint/registry.ts";
import { config } from "../marketplace.config.ts";

Deno.test("the real skills tree has zero lint errors", async () => {
  const root = new URL("../", import.meta.url).pathname;
  const records = await discoverSkills(`${root}skills`);
  const primer = records.find((r) => r.dir === config.bootstrapSkill)!;
  const findings = [
    ...checkFrontmatter(records),
    ...checkBudget(records),
    ...checkLinks(records),
    ...checkRegistry(records, primer, config.harnesses, config.bootstrapSkill),
  ];
  const errors = findings.filter((f) => f.level === "error");
  assertEquals(errors, [], `lint errors: ${JSON.stringify(errors)}`);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test scripts/lint-skills_test.ts --allow-read` Expected: FAIL — the
modules resolve, but this fails only if the real tree has errors; if it already
passes, proceed (the entrypoint is still missing for the next steps). To force
the red state first, confirm the entrypoint does not yet exist:
`test ! -f scripts/lint-skills.ts && echo MISSING`.

- [ ] **Step 3: Write the entrypoint**

```ts
// scripts/lint-skills.ts
import { discoverSkills } from "./lib/lint/discover.ts";
import { checkFrontmatter } from "./lib/lint/frontmatter.ts";
import { checkBudget } from "./lib/lint/budget.ts";
import { checkLinks } from "./lib/lint/links.ts";
import { checkRegistry } from "./lib/lint/registry.ts";
import { buildReport } from "./lib/lint/report.ts";
import { config } from "../marketplace.config.ts";

const ROOT = new URL("../", import.meta.url).pathname;

async function main() {
  const records = await discoverSkills(`${ROOT}skills`);
  const primer = records.find((r) => r.dir === config.bootstrapSkill);
  if (!primer) {
    console.error(
      `skill-lint: bootstrap skill "${config.bootstrapSkill}" not found`,
    );
    Deno.exit(1);
  }

  const findings = [
    ...checkFrontmatter(records),
    ...checkBudget(records),
    ...checkLinks(records),
    ...checkRegistry(records, primer, config.harnesses, config.bootstrapSkill),
  ];

  const report = buildReport(findings, records.length);
  console.log(report.header);
  if (report.lines.length > 0) {
    console.error("");
    for (const line of report.lines) console.error(line);
    console.error("");
  }
  console.log(report.summary);
  Deno.exit(report.exitCode);
}

await main();
```

- [ ] **Step 4: Run the entrypoint and the test**

Run: `deno run --allow-read=. scripts/lint-skills.ts` Expected: prints
`skill-lint: 4 skills checked` then `✓ all checks passed`, exit 0.

Run: `deno test scripts/lint-skills_test.ts --allow-read` Expected: PASS (1
test).

- [ ] **Step 5: Wire into `deno.json`**

In `scripts/lint-skills` add the task and extend `typecheck` and `ci`. The tasks
block becomes:

```json
"lint-skills": "deno run --allow-read=. scripts/lint-skills.ts",
"typecheck": "deno check scripts/generate.ts scripts/rasterize.ts scripts/lint-skills.ts marketplace.config.ts",
"ci": "deno task fmt-check && deno task lint && deno task typecheck && deno task check && deno task lint-skills && deno task test"
```

(Add the `lint-skills` line alongside the other tasks; replace the existing
`typecheck` and `ci` lines with the versions above.)

- [ ] **Step 6: Run the full release gate**

Run: `deno task ci` Expected: all stages pass, ending with the test summary —
`lint-skills` prints `✓ all checks passed` in the chain.

- [ ] **Step 7: Commit**

```bash
deno fmt scripts/ deno.json
git add scripts/lint-skills.ts scripts/lint-skills_test.ts deno.json
git commit -m "feat: wire skill linter into the release gate"
```

---

## Self-Review

**Spec coverage:**

- Architecture (standalone entrypoint + `lib/lint/` modules,
  `SkillRecord`/`Finding` shapes, exit semantics) → Tasks 1–7.
- frontmatter.ts rules → Task 2.
- budget.ts (warn 500 / error 1024) → Task 3.
- links.ts (both link styles, any extension, missing=error, orphan=warn) →
  Task 4.
- registry.ts (skill listed, harness tool-ref + mapping row, stale=warn,
  `claude` stem map) → Task 5.
- Report format + exit semantics → Task 6, entrypoint in Task 7.
- Testing (per-check unit fixtures, discover temp-dir test, integration smoke
  test) → Tasks 1–7.
- Wiring (`lint-skills` task, into `ci` → `mise run release` → pre-commit +
  Actions) → Task 7.

All spec sections map to a task. No gaps.

**Placeholder scan:** No TBD/TODO; every code step shows full code; commands
have expected output. Clean.

**Type consistency:** `SkillRecord` and `Finding` are defined once (Task 1) and
consumed unchanged everywhere. Function names (`discoverSkills`,
`checkFrontmatter`, `checkBudget`, `referencedFiles`/`checkLinks`,
`stemFor`/`checkRegistry`, `buildReport`) are used identically in their tests
and in the Task 7 entrypoint. `stemFor`'s `claude → claude-code-tools` map
matches the spec.
