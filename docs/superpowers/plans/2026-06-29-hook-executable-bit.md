# Hook Executable-Bit Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `hooks/run-hook.cmd` executable so the SessionStart hook stops
failing with `Permission denied` on Unix, and keep it executable through
regeneration and CI.

**Architecture:** `run-hook.cmd` is a Windows/Unix polyglot invoked directly by
the hook configs; on Unix that requires the execute bit. We add an optional
`executable` flag to the generator's `GeneratedFile` pipeline (`writeFiles`
chmods, `checkFiles` detects drift), mark `run-hook.cmd` with it, then set the
git `100755` mode on both the generated file and its template.

**Tech Stack:** Deno (TypeScript), `@std/assert` for tests, git for tracked file
modes.

## Global Constraints

- Runtime: Deno. Tests run via `deno task test`
  (`deno test --allow-read --allow-write`).
- `deno task generate` runs with `--allow-read=. --allow-write=.`;
  `deno task check` runs with `--allow-read=.` only — the check path must not
  require write permission.
- Generated files (`hooks/*`) are produced from `scripts/templates/hooks/*` by
  `scripts/generate.ts`. Never hand-edit generated outputs; edit templates and
  regenerate.
- `chmod`/mode logic must be Windows-safe (guard with
  `Deno.build.os !== "windows"`) so generation does not throw on Windows.
- Only `run-hook.cmd` gets the bit. The `session-start` scripts run via explicit
  `bash` and must stay non-executable.

---

### Task 1: Add `executable` support to the generator write/check pipeline

**Files:**

- Modify: `scripts/lib/types.ts:33`
- Modify: `scripts/lib/files.ts` (`writeFiles`, `checkFiles`)
- Test: `scripts/lib/files_test.ts`

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces: `GeneratedFile` gains optional `executable?: boolean`.
  `writeFiles(files, root)` sets mode `0o755` on files with `executable: true`
  (non-Windows). `checkFiles(files, root)` returns status `"drift"` for an
  `executable: true` file that exists with content matching but the execute bit
  missing (non-Windows).

- [ ] **Step 1: Write the failing tests**

Append to `scripts/lib/files_test.ts`:

```typescript
Deno.test("writeFiles sets the execute bit when executable is true", async () => {
  if (Deno.build.os === "windows") return;
  const dir = await Deno.makeTempDir();
  const files = [{
    path: "bin/run.cmd",
    content: "echo hi\n",
    executable: true,
  }];
  await writeFiles(files, dir);
  const mode = (await Deno.stat(`${dir}/bin/run.cmd`)).mode!;
  assertEquals(mode & 0o111, 0o111);
});

Deno.test("checkFiles reports drift when the execute bit is missing", async () => {
  if (Deno.build.os === "windows") return;
  const dir = await Deno.makeTempDir();
  const files = [{
    path: "bin/run.cmd",
    content: "echo hi\n",
    executable: true,
  }];
  await writeFiles(files, dir);
  assertEquals((await checkFiles(files, dir))[0].status, "ok");

  await Deno.chmod(`${dir}/bin/run.cmd`, 0o644);
  assertEquals((await checkFiles(files, dir))[0].status, "drift");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `deno test --allow-read --allow-write scripts/lib/files_test.ts` Expected:
FAIL — `writeFiles`/`GeneratedFile` do not yet handle `executable` (the
execute-bit assertions fail; type-check error on the `executable` property is
also acceptable as a failure).

- [ ] **Step 3: Add the `executable` field to `GeneratedFile`**

In `scripts/lib/types.ts`, replace line 33:

```typescript
export type GeneratedFile = {
  path: string;
  content: string;
  executable?: boolean;
};
```

- [ ] **Step 4: Implement chmod in `writeFiles` and the mode check in
      `checkFiles`**

In `scripts/lib/files.ts`, replace the whole file with:

```typescript
import { dirname, join } from "jsr:@std/path@^1.0.0";
import type { GeneratedFile } from "./types.ts";

const WINDOWS = Deno.build.os === "windows";

export async function writeFiles(
  files: GeneratedFile[],
  root: string,
): Promise<string[]> {
  const written: string[] = [];
  for (const f of files) {
    const full = join(root, f.path);
    await Deno.mkdir(dirname(full), { recursive: true });
    await Deno.writeTextFile(full, f.content);
    if (f.executable && !WINDOWS) await Deno.chmod(full, 0o755);
    written.push(f.path);
  }
  return written;
}

export type CheckResult = { path: string; status: "ok" | "drift" | "missing" };

export async function checkFiles(
  files: GeneratedFile[],
  root: string,
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  for (const f of files) {
    const full = join(root, f.path);
    let actual: string | null = null;
    let mode: number | null = null;
    try {
      actual = await Deno.readTextFile(full);
      mode = (await Deno.stat(full)).mode;
    } catch {
      actual = null;
    }
    if (actual === null) results.push({ path: f.path, status: "missing" });
    else if (actual !== f.content) {
      results.push({ path: f.path, status: "drift" });
    } else if (
      f.executable && !WINDOWS && mode !== null && (mode & 0o111) === 0
    ) {
      results.push({ path: f.path, status: "drift" });
    } else results.push({ path: f.path, status: "ok" });
  }
  return results;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `deno test --allow-read --allow-write scripts/lib/files_test.ts` Expected:
PASS — all tests in the file, including the two new ones and the existing
`checkFiles reports missing then ok after write`.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/types.ts scripts/lib/files.ts scripts/lib/files_test.ts
git commit -m "feat(generate): support executable bit in generated-file pipeline"
```

---

### Task 2: Mark `run-hook.cmd` executable and set the git mode

**Files:**

- Modify: `scripts/lib/render-templated.ts:6-13,28-31`
- Test: `scripts/lib/render-templated_test.ts`
- Modify (git mode only): `hooks/run-hook.cmd`,
  `scripts/templates/hooks/run-hook.cmd`

**Interfaces:**

- Consumes: `GeneratedFile.executable` from Task 1.
- Produces: the `renderTemplated` output entry for `hooks/run-hook.cmd` has
  `executable: true`; all other entries omit it.

- [ ] **Step 1: Write the failing test**

Append to `scripts/lib/render-templated_test.ts`:

```typescript
Deno.test("run-hook.cmd is marked executable, session-start is not", async () => {
  const files = await renderTemplated(config, TEMPLATES);
  const cmd = files.find((f) => f.path === "hooks/run-hook.cmd")!;
  assertEquals(cmd.executable, true);
  const session = files.find((f) => f.path === "hooks/session-start")!;
  assertEquals(session.executable ?? false, false);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `deno test --allow-read --allow-write scripts/lib/render-templated_test.ts`
Expected: FAIL — `cmd.executable` is `undefined`, not `true`.

- [ ] **Step 3: Carry an executable flag through `HOOK_FILES`**

In `scripts/lib/render-templated.ts`, replace the `HOOK_FILES` declaration
(lines 6-13) with a third tuple element for the executable flag:

```typescript
// (path under templatesDir) -> (output path in repo) -> executable?
const HOOK_FILES: Array<[string, string, boolean?]> = [
  ["hooks/session-start", "hooks/session-start"],
  ["hooks/session-start-codex", "hooks/session-start-codex"],
  ["hooks/run-hook.cmd", "hooks/run-hook.cmd", true],
  ["hooks/hooks.json", "hooks/hooks.json"],
  ["hooks/hooks-codex.json", "hooks/hooks-codex.json"],
  ["hooks/hooks-cursor.json", "hooks/hooks-cursor.json"],
];
```

Then replace the hook-files loop (lines 28-31) so the flag flows into the
output:

```typescript
for (const [src, dest, executable] of HOOK_FILES) {
  const text = await Deno.readTextFile(join(templatesDir, src));
  const file: GeneratedFile = {
    path: dest,
    content: renderTemplate(text, vars),
  };
  if (executable) file.executable = true;
  out.push(file);
}
```

`GeneratedFile` is already imported on line 2
(`import type { GeneratedFile, MarketplaceConfig }`), so no new import is
needed.

- [ ] **Step 4: Run the test to verify it passes**

Run: `deno test --allow-read --allow-write scripts/lib/render-templated_test.ts`
Expected: PASS — all tests in the file, including the new one.

- [ ] **Step 5: Regenerate and set the git modes**

Regenerate (this chmods the on-disk `hooks/run-hook.cmd` to 755), then record
`100755` in git for both the generated file and its template:

```bash
deno task generate
git update-index --chmod=+x hooks/run-hook.cmd scripts/templates/hooks/run-hook.cmd
chmod +x scripts/templates/hooks/run-hook.cmd
git add scripts/lib/render-templated.ts scripts/lib/render-templated_test.ts hooks/run-hook.cmd scripts/templates/hooks/run-hook.cmd
```

- [ ] **Step 6: Verify both copies are mode 100755 in git**

Run: `git ls-files -s hooks/run-hook.cmd scripts/templates/hooks/run-hook.cmd`
Expected: both lines start with `100755`.

- [ ] **Step 7: Verify the full pipeline is in sync**

Run: `deno task check` Expected: `✓ all N generated files in sync` (no
`drift`/`missing`). This now also confirms the execute bit is present, since
`checkFiles` reports `drift` if it is missing.

- [ ] **Step 8: Commit**

```bash
git commit -m "fix(hooks): make run-hook.cmd executable so the Unix hook runs"
```

---

### Task 3: Full CI gate

**Files:** none (verification only).

**Interfaces:**

- Consumes: all changes from Tasks 1-2.
- Produces: nothing.

- [ ] **Step 1: Run the full CI task**

Run: `deno task ci` Expected: PASS — `fmt-check`, `lint`, `typecheck`, `check`,
`validate-manifests`, `lint-skills`, and `test` all succeed. (If `fmt-check`
complains, run `deno task fmt`, re-stage, and amend the relevant commit.)

- [ ] **Step 2: Confirm the original symptom is gone (manual)**

Confirm the wrapper now runs directly under a POSIX shell without the
execute-bit error:

```bash
hooks/run-hook.cmd session-start </dev/null
```

Expected: it executes the `session-start` script via `bash` (no
`Permission denied`). Any non-zero exit from `session-start` itself is unrelated
to this fix — the absence of `Permission denied` is what we are verifying.

---

## Self-Review

**Spec coverage:**

- Spec fix item 1 (git `+x` on both `run-hook.cmd` copies) → Task 2, Steps 5-6.
- Spec fix item 2 (generator preserves the bit via `GeneratedFile.executable` +
  `writeFiles` chmod + `render-templated` mark) → Task 1 (Steps 3-4) and Task 2
  (Step 3).
- Spec fix item 3 (`checkFiles` mode-aware) → Task 1, Step 4, with regression
  coverage in Step 1 and live verification in Task 2, Step 7.
- Spec testing section (files_test additions, render-templated mark, manual mode
  check) → Task 1 Step 1, Task 2 Step 1, Task 2 Step 6 / Task 3 Step 2.
- Spec out-of-scope (session-start scripts stay non-executable) → enforced by
  the second assertion in Task 2, Step 1.

**Placeholder scan:** No TBD/TODO/"handle edge cases" placeholders; every code
step shows complete code and every command lists expected output.

**Type consistency:** `GeneratedFile.executable?: boolean` defined in Task 1
Step 3 is the same property read in `writeFiles`/`checkFiles` (Task 1 Step 4)
and written in `render-templated.ts` (Task 2 Step 3) and asserted in tests
(`cmd.executable`). `checkFiles` continues to return the existing
`"ok" | "drift" | "missing"` status union — no new status value introduced.
