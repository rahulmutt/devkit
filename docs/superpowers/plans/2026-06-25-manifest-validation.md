# Manifest Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validate every generated JSON manifest against a per-harness JSON
Schema so a malformed plugin manifest cannot pass the release gate.

**Architecture:** A new `scripts/lib/validate/` module mirrors the existing
`scripts/lib/lint/` linter. It loads best-effort JSON Schema files (one per
manifest), maps each manifest path to its schema, validates the in-memory output
of `renderJson(config)` with `@cfworker/json-schema`, and reports violations. A
coverage self-check fails if any manifest has no schema or any schema is
orphaned. A new `validate-manifests` deno task wires it into the `ci`/release
gate.

**Tech Stack:** Deno, TypeScript, `@cfworker/json-schema` (draft 2020-12),
`@std/assert` for tests.

## Global Constraints

- **Source of truth:** never hand-edit generated files; the validator reads
  `renderJson(config)` output, not files on disk — exact verbatim.
- **Deno-first, minimal deps:** the only new dependency is
  `@cfworker/json-schema` (JSR-native, no `eval`/codegen).
- **In scope:** the 7 JSON manifests from `scripts/lib/render-json.ts` only. The
  pi (`devkit.ts`) and opencode (`devkit.js`) outputs are generated code and are
  explicitly out of JSON-Schema scope.
- **Strict schemas:** every schema sets `additionalProperties: false`, an
  explicit `required` list, and permits the injected `_generated` string field.
- **Mirror existing style:** match `scripts/lib/lint/` structure, `buildReport`
  shape, and deno-fmt formatting (2-space, double quotes, semicolons).
- **Coverage must stay total:** the manifest-path → schema map must cover every
  manifest `renderJson` emits; an unmapped manifest or orphan schema is a hard
  failure.

---

### Task 1: Validation types and report module

**Files:**

- Create: `scripts/lib/validate/types.ts`
- Create: `scripts/lib/validate/report.ts`
- Test: `scripts/lib/validate/report_test.ts`

**Interfaces:**

- Consumes: nothing (leaf module).
- Produces:
  - `ManifestViolation` =
    `{ path: string; instancePath: string; message: string }`
  - `Report` =
    `{ header: string; lines: string[]; summary: string; exitCode: number }`
  - `buildReport(violations: ManifestViolation[], manifestCount: number): Report`

- [ ] **Step 1: Write the failing test**

Create `scripts/lib/validate/report_test.ts`:

```typescript
import { assertEquals } from "@std/assert";
import { buildReport } from "./report.ts";
import type { ManifestViolation } from "./types.ts";

Deno.test("buildReport: clean run exits 0 with conform summary", () => {
  const report = buildReport([], 7);
  assertEquals(report.lines, []);
  assertEquals(report.exitCode, 0);
  assertEquals(report.summary, "✓ all 7 manifests conform");
  assertEquals(report.header, "manifest-validate: 7 manifests checked");
});

Deno.test("buildReport: violations exit 1 and format as path + pointer", () => {
  const violations: ManifestViolation[] = [
    { path: "package.json", instancePath: "/version", message: "bad semver" },
    {
      path: ".codex-plugin/plugin.json",
      instancePath: "",
      message: "missing field",
    },
  ];
  const report = buildReport(violations, 7);
  assertEquals(report.exitCode, 1);
  assertEquals(report.summary, "✗ 2 violations");
  // sorted by path, then instancePath
  assertEquals(report.lines, [
    "  .codex-plugin/plugin.json — missing field",
    "  package.json /version — bad semver",
  ]);
});

Deno.test("buildReport: single violation is singular", () => {
  const report = buildReport(
    [{ path: "package.json", instancePath: "", message: "x" }],
    7,
  );
  assertEquals(report.summary, "✗ 1 violation");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test --allow-read scripts/lib/validate/report_test.ts` Expected: FAIL
— module `./report.ts` / `./types.ts` not found.

- [ ] **Step 3: Create the types module**

Create `scripts/lib/validate/types.ts`:

```typescript
export interface ManifestViolation {
  path: string;
  instancePath: string;
  message: string;
}
```

- [ ] **Step 4: Implement the report module**

Create `scripts/lib/validate/report.ts`:

```typescript
import type { ManifestViolation } from "./types.ts";

export interface Report {
  header: string;
  lines: string[];
  summary: string;
  exitCode: number;
}

export function buildReport(
  violations: ManifestViolation[],
  manifestCount: number,
): Report {
  const sorted = [...violations].sort((a, b) =>
    a.path.localeCompare(b.path) || a.instancePath.localeCompare(b.instancePath)
  );
  const lines = sorted.map((v) =>
    `  ${v.path}${v.instancePath ? ` ${v.instancePath}` : ""} — ${v.message}`
  );
  const header = `manifest-validate: ${manifestCount} manifests checked`;
  const summary = violations.length === 0
    ? `✓ all ${manifestCount} manifests conform`
    : `✗ ${plural(violations.length, "violation")}`;

  return { header, lines, summary, exitCode: violations.length === 0 ? 0 : 1 };
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `deno test --allow-read scripts/lib/validate/report_test.ts` Expected: PASS
(3 tests).

- [ ] **Step 6: Format and commit**

```bash
deno fmt scripts/lib/validate/types.ts scripts/lib/validate/report.ts scripts/lib/validate/report_test.ts
git add scripts/lib/validate/types.ts scripts/lib/validate/report.ts scripts/lib/validate/report_test.ts
git commit -m "feat: manifest-validate types and report module"
```

---

### Task 2: Schemas and core validator

**Files:**

- Create: `scripts/lib/validate/schemas/claude-marketplace.json`
- Create: `scripts/lib/validate/schemas/claude-plugin.json`
- Create: `scripts/lib/validate/schemas/codex-plugin.json`
- Create: `scripts/lib/validate/schemas/cursor-plugin.json`
- Create: `scripts/lib/validate/schemas/kimi-plugin.json`
- Create: `scripts/lib/validate/schemas/gemini-extension.json`
- Create: `scripts/lib/validate/schemas/package.json`
- Create: `scripts/lib/validate/validate.ts`
- Modify: `deno.json` (add `@cfworker/json-schema` to `imports`)
- Test: `scripts/lib/validate/validate_test.ts`

**Interfaces:**

- Consumes: `GeneratedFile` from `scripts/lib/types.ts`
  (`{ path: string; content: string }`); `ManifestViolation` from `./types.ts`;
  `renderJson` from `../render-json.ts`; `config` from `marketplace.config.ts`.
- Produces:
  - `MANIFEST_SCHEMAS: Record<string, string>` — manifest path → schema file
    stem.
  - `loadSchemas(): Promise<Map<string, unknown>>` — stem → parsed schema.
  - `checkCoverage(manifests: GeneratedFile[], schemas: Map<string, unknown>): ManifestViolation[]`
  - `validateManifest(manifest: GeneratedFile, schema: unknown): ManifestViolation[]`
  - `validateAll(manifests: GeneratedFile[]): Promise<ManifestViolation[]>`

- [ ] **Step 1: Add the dependency to `deno.json` imports**

Modify `deno.json` `imports` block to add the validator (keep existing entries):

```jsonc
"imports": {
  "@std/assert": "jsr:@std/assert@^1.0.0",
  "@std/path": "jsr:@std/path@^1.0.0",
  "@cfworker/json-schema": "npm:@cfworker/json-schema@^4.0.0"
},
```

- [ ] **Step 2: Write the failing test**

Create `scripts/lib/validate/validate_test.ts`:

```typescript
import { assertEquals } from "@std/assert";
import {
  checkCoverage,
  MANIFEST_SCHEMAS,
  validateAll,
  validateManifest,
} from "./validate.ts";
import { renderJson } from "../render-json.ts";
import { config } from "../../../marketplace.config.ts";
import type { GeneratedFile } from "../types.ts";

Deno.test("validateAll: the real config's manifests all conform", async () => {
  const violations = await validateAll(renderJson(config));
  assertEquals(violations, []);
});

Deno.test("validateManifest: missing required field is a violation", () => {
  const schema = {
    type: "object",
    required: ["name"],
    properties: { name: { type: "string" } },
  };
  const m: GeneratedFile = { path: "x.json", content: "{}" };
  const v = validateManifest(m, schema);
  assertEquals(v.length >= 1, true);
  assertEquals(v[0].path, "x.json");
});

Deno.test("validateManifest: wrong type is a violation", () => {
  const schema = {
    type: "object",
    properties: { name: { type: "string" } },
  };
  const m: GeneratedFile = { path: "x.json", content: '{"name":123}' };
  assertEquals(validateManifest(m, schema).length >= 1, true);
});

Deno.test("validateManifest: bad enum is a violation", () => {
  const schema = {
    type: "object",
    properties: { cap: { enum: ["Read", "Write"] } },
  };
  const m: GeneratedFile = { path: "x.json", content: '{"cap":"Delete"}' };
  assertEquals(validateManifest(m, schema).length >= 1, true);
});

Deno.test("validateManifest: bad semver pattern is a violation", () => {
  const schema = {
    type: "object",
    properties: { version: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+" } },
  };
  const m: GeneratedFile = { path: "x.json", content: '{"version":"1.0"}' };
  assertEquals(validateManifest(m, schema).length >= 1, true);
});

Deno.test("validateManifest: stray field fails additionalProperties", () => {
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: { name: { type: "string" } },
  };
  const m: GeneratedFile = {
    path: "x.json",
    content: '{"name":"a","extra":1}',
  };
  assertEquals(validateManifest(m, schema).length >= 1, true);
});

Deno.test("checkCoverage: unmapped manifest is a violation", () => {
  const v = checkCoverage(
    [{ path: "totally-unknown.json", content: "{}" }],
    new Map([["package", {}]]),
  );
  assertEquals(v.some((x) => x.message.includes("no schema mapped")), true);
});

Deno.test("checkCoverage: missing schema file is a violation", () => {
  const v = checkCoverage(
    [{ path: ".codex-plugin/plugin.json", content: "{}" }],
    new Map(), // no schemas loaded
  );
  assertEquals(v.some((x) => x.message.includes("codex-plugin.json")), true);
});

Deno.test("checkCoverage: orphan schema is a violation", () => {
  const schemas = new Map<string, unknown>();
  for (const stem of Object.values(MANIFEST_SCHEMAS)) schemas.set(stem, {});
  schemas.set("ghost", {}); // not referenced by any manifest
  const v = checkCoverage(renderJsonPaths(), schemas);
  assertEquals(v.some((x) => x.message.includes("orphan")), true);
});

function renderJsonPaths(): GeneratedFile[] {
  return renderJson(config);
}
```

- [ ] **Step 3: Run test to verify it fails**

Run:
`deno test --allow-read --allow-write scripts/lib/validate/validate_test.ts`
Expected: FAIL — module `./validate.ts` not found.

- [ ] **Step 4: Create the seven schema files**

Create `scripts/lib/validate/schemas/claude-plugin.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "devkit/claude-plugin",
  "x-provenance": "best-effort",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "_generated",
    "name",
    "version",
    "description",
    "author",
    "homepage",
    "repository",
    "license",
    "keywords"
  ],
  "$defs": {
    "author": {
      "type": "object",
      "additionalProperties": false,
      "required": ["name", "email"],
      "properties": {
        "name": { "type": "string", "minLength": 1 },
        "email": { "type": "string", "format": "email" }
      }
    }
  },
  "properties": {
    "_generated": { "type": "string" },
    "name": { "type": "string", "minLength": 1 },
    "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+([-+].+)?$" },
    "description": { "type": "string", "minLength": 1 },
    "author": { "$ref": "#/$defs/author" },
    "homepage": { "type": "string", "format": "uri" },
    "repository": { "type": "string", "format": "uri" },
    "license": { "type": "string", "minLength": 1 },
    "keywords": { "type": "array", "items": { "type": "string" } }
  }
}
```

Create `scripts/lib/validate/schemas/claude-marketplace.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "devkit/claude-marketplace",
  "x-provenance": "best-effort",
  "type": "object",
  "additionalProperties": false,
  "required": ["_generated", "name", "description", "owner", "plugins"],
  "$defs": {
    "author": {
      "type": "object",
      "additionalProperties": false,
      "required": ["name", "email"],
      "properties": {
        "name": { "type": "string", "minLength": 1 },
        "email": { "type": "string", "format": "email" }
      }
    }
  },
  "properties": {
    "_generated": { "type": "string" },
    "name": { "type": "string", "minLength": 1 },
    "description": { "type": "string", "minLength": 1 },
    "owner": { "$ref": "#/$defs/author" },
    "plugins": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["name", "description", "version", "source", "author"],
        "properties": {
          "name": { "type": "string", "minLength": 1 },
          "description": { "type": "string", "minLength": 1 },
          "version": {
            "type": "string",
            "pattern": "^\\d+\\.\\d+\\.\\d+([-+].+)?$"
          },
          "source": { "const": "./" },
          "author": { "$ref": "#/$defs/author" }
        }
      }
    }
  }
}
```

Create `scripts/lib/validate/schemas/codex-plugin.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "devkit/codex-plugin",
  "x-provenance": "best-effort",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "_generated",
    "name",
    "version",
    "description",
    "author",
    "homepage",
    "repository",
    "license",
    "keywords",
    "skills",
    "hooks",
    "interface"
  ],
  "$defs": {
    "author": {
      "type": "object",
      "additionalProperties": false,
      "required": ["name", "email"],
      "properties": {
        "name": { "type": "string", "minLength": 1 },
        "email": { "type": "string", "format": "email" }
      }
    },
    "interface": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "displayName",
        "shortDescription",
        "longDescription",
        "developerName",
        "category",
        "capabilities",
        "websiteURL",
        "brandColor",
        "composerIcon",
        "logo"
      ],
      "properties": {
        "displayName": { "type": "string", "minLength": 1 },
        "shortDescription": { "type": "string", "minLength": 1 },
        "longDescription": { "type": "string", "minLength": 1 },
        "developerName": { "type": "string", "minLength": 1 },
        "category": { "type": "string", "minLength": 1 },
        "capabilities": {
          "type": "array",
          "items": { "enum": ["Interactive", "Read", "Write"] }
        },
        "websiteURL": { "type": "string", "format": "uri" },
        "brandColor": { "type": "string", "pattern": "^#[0-9A-Fa-f]{6}$" },
        "composerIcon": { "type": "string", "pattern": "^\\./.+" },
        "logo": { "type": "string", "pattern": "^\\./.+" }
      }
    }
  },
  "properties": {
    "_generated": { "type": "string" },
    "name": { "type": "string", "minLength": 1 },
    "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+([-+].+)?$" },
    "description": { "type": "string", "minLength": 1 },
    "author": { "$ref": "#/$defs/author" },
    "homepage": { "type": "string", "format": "uri" },
    "repository": { "type": "string", "format": "uri" },
    "license": { "type": "string", "minLength": 1 },
    "keywords": { "type": "array", "items": { "type": "string" } },
    "skills": { "const": "./skills/" },
    "hooks": { "const": "./hooks/hooks-codex.json" },
    "interface": { "$ref": "#/$defs/interface" }
  }
}
```

Create `scripts/lib/validate/schemas/cursor-plugin.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "devkit/cursor-plugin",
  "x-provenance": "best-effort",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "_generated",
    "name",
    "version",
    "description",
    "author",
    "homepage",
    "repository",
    "license",
    "keywords",
    "displayName",
    "skills",
    "hooks"
  ],
  "$defs": {
    "author": {
      "type": "object",
      "additionalProperties": false,
      "required": ["name", "email"],
      "properties": {
        "name": { "type": "string", "minLength": 1 },
        "email": { "type": "string", "format": "email" }
      }
    }
  },
  "properties": {
    "_generated": { "type": "string" },
    "name": { "type": "string", "minLength": 1 },
    "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+([-+].+)?$" },
    "description": { "type": "string", "minLength": 1 },
    "author": { "$ref": "#/$defs/author" },
    "homepage": { "type": "string", "format": "uri" },
    "repository": { "type": "string", "format": "uri" },
    "license": { "type": "string", "minLength": 1 },
    "keywords": { "type": "array", "items": { "type": "string" } },
    "displayName": { "type": "string", "minLength": 1 },
    "skills": { "const": "./skills/" },
    "hooks": { "const": "./hooks/hooks-cursor.json" }
  }
}
```

Create `scripts/lib/validate/schemas/kimi-plugin.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "devkit/kimi-plugin",
  "x-provenance": "best-effort",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "_generated",
    "name",
    "version",
    "description",
    "author",
    "homepage",
    "repository",
    "license",
    "keywords",
    "skills",
    "sessionStart",
    "interface"
  ],
  "$defs": {
    "author": {
      "type": "object",
      "additionalProperties": false,
      "required": ["name", "email"],
      "properties": {
        "name": { "type": "string", "minLength": 1 },
        "email": { "type": "string", "format": "email" }
      }
    },
    "interface": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "displayName",
        "shortDescription",
        "longDescription",
        "developerName",
        "category",
        "capabilities",
        "websiteURL",
        "brandColor",
        "composerIcon",
        "logo"
      ],
      "properties": {
        "displayName": { "type": "string", "minLength": 1 },
        "shortDescription": { "type": "string", "minLength": 1 },
        "longDescription": { "type": "string", "minLength": 1 },
        "developerName": { "type": "string", "minLength": 1 },
        "category": { "type": "string", "minLength": 1 },
        "capabilities": {
          "type": "array",
          "items": { "enum": ["Interactive", "Read", "Write"] }
        },
        "websiteURL": { "type": "string", "format": "uri" },
        "brandColor": { "type": "string", "pattern": "^#[0-9A-Fa-f]{6}$" },
        "composerIcon": { "type": "string", "pattern": "^\\./.+" },
        "logo": { "type": "string", "pattern": "^\\./.+" }
      }
    }
  },
  "properties": {
    "_generated": { "type": "string" },
    "name": { "type": "string", "minLength": 1 },
    "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+([-+].+)?$" },
    "description": { "type": "string", "minLength": 1 },
    "author": { "$ref": "#/$defs/author" },
    "homepage": { "type": "string", "format": "uri" },
    "repository": { "type": "string", "format": "uri" },
    "license": { "type": "string", "minLength": 1 },
    "keywords": { "type": "array", "items": { "type": "string" } },
    "skills": { "const": "./skills/" },
    "sessionStart": {
      "type": "object",
      "additionalProperties": false,
      "required": ["skill"],
      "properties": { "skill": { "type": "string", "minLength": 1 } }
    },
    "interface": { "$ref": "#/$defs/interface" }
  }
}
```

Create `scripts/lib/validate/schemas/gemini-extension.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "devkit/gemini-extension",
  "x-provenance": "best-effort",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "_generated",
    "name",
    "description",
    "version",
    "contextFileName"
  ],
  "properties": {
    "_generated": { "type": "string" },
    "name": { "type": "string", "minLength": 1 },
    "description": { "type": "string", "minLength": 1 },
    "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+([-+].+)?$" },
    "contextFileName": { "const": "GEMINI.md" }
  }
}
```

Create `scripts/lib/validate/schemas/package.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "devkit/package",
  "x-provenance": "best-effort",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "_generated",
    "name",
    "version",
    "description",
    "license",
    "author",
    "homepage",
    "repository"
  ],
  "properties": {
    "_generated": { "type": "string" },
    "name": { "type": "string", "minLength": 1 },
    "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+([-+].+)?$" },
    "description": { "type": "string", "minLength": 1 },
    "license": { "type": "string", "minLength": 1 },
    "author": { "type": "string", "minLength": 1 },
    "homepage": { "type": "string", "format": "uri" },
    "repository": { "type": "string", "format": "uri" }
  }
}
```

- [ ] **Step 5: Implement the validator**

Create `scripts/lib/validate/validate.ts`:

```typescript
import { Validator } from "@cfworker/json-schema";
import type { GeneratedFile } from "../types.ts";
import type { ManifestViolation } from "./types.ts";

// Manifest path -> schema file stem under ./schemas/.
// Must cover every manifest renderJson() emits (checkCoverage enforces this).
export const MANIFEST_SCHEMAS: Record<string, string> = {
  ".claude-plugin/marketplace.json": "claude-marketplace",
  ".claude-plugin/plugin.json": "claude-plugin",
  ".codex-plugin/plugin.json": "codex-plugin",
  ".cursor-plugin/plugin.json": "cursor-plugin",
  ".kimi-plugin/plugin.json": "kimi-plugin",
  "gemini-extension.json": "gemini-extension",
  "package.json": "package",
};

const SCHEMA_DIR = new URL("./schemas/", import.meta.url);

export async function loadSchemas(): Promise<Map<string, unknown>> {
  const schemas = new Map<string, unknown>();
  for await (const entry of Deno.readDir(SCHEMA_DIR)) {
    if (!entry.isFile || !entry.name.endsWith(".json")) continue;
    const stem = entry.name.slice(0, -".json".length);
    const text = await Deno.readTextFile(new URL(entry.name, SCHEMA_DIR));
    schemas.set(stem, JSON.parse(text));
  }
  return schemas;
}

export function checkCoverage(
  manifests: GeneratedFile[],
  schemas: Map<string, unknown>,
): ManifestViolation[] {
  const violations: ManifestViolation[] = [];
  const knownStems = new Set(Object.values(MANIFEST_SCHEMAS));

  for (const m of manifests) {
    const stem = MANIFEST_SCHEMAS[m.path];
    if (!stem) {
      violations.push({
        path: m.path,
        instancePath: "",
        message: "no schema mapped for this manifest",
      });
      continue;
    }
    if (!schemas.has(stem)) {
      violations.push({
        path: m.path,
        instancePath: "",
        message: `schema file "${stem}.json" not found`,
      });
    }
  }

  for (const stem of schemas.keys()) {
    if (!knownStems.has(stem)) {
      violations.push({
        path: `schemas/${stem}.json`,
        instancePath: "",
        message: "orphan schema: no manifest maps to it",
      });
    }
  }

  return violations;
}

export function validateManifest(
  manifest: GeneratedFile,
  schema: unknown,
): ManifestViolation[] {
  const validator = new Validator(schema as object, "2020-12", false);
  const result = validator.validate(JSON.parse(manifest.content));
  if (result.valid) return [];
  return [...result.errors].map((e) => ({
    path: manifest.path,
    instancePath: e.instanceLocation,
    message: e.error,
  }));
}

export async function validateAll(
  manifests: GeneratedFile[],
): Promise<ManifestViolation[]> {
  const schemas = await loadSchemas();
  const violations = checkCoverage(manifests, schemas);
  for (const m of manifests) {
    const stem = MANIFEST_SCHEMAS[m.path];
    const schema = stem ? schemas.get(stem) : undefined;
    if (schema) violations.push(...validateManifest(m, schema));
  }
  return violations;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run:
`deno test --allow-read --allow-write scripts/lib/validate/validate_test.ts`
Expected: PASS (9 tests). The first test proves the real config's manifests
conform.

- [ ] **Step 7: Format and commit**

```bash
deno fmt deno.json scripts/lib/validate/schemas scripts/lib/validate/validate.ts scripts/lib/validate/validate_test.ts
git add deno.json deno.lock scripts/lib/validate/schemas scripts/lib/validate/validate.ts scripts/lib/validate/validate_test.ts
git commit -m "feat: per-harness manifest schemas and validator core"
```

---

### Task 3: Entry point

**Files:**

- Create: `scripts/validate-manifests.ts`
- Test: `scripts/validate-manifests_test.ts`

**Interfaces:**

- Consumes: `renderJson` from `./lib/render-json.ts`; `validateAll` from
  `./lib/validate/validate.ts`; `buildReport` from `./lib/validate/report.ts`;
  `Report` type from `./lib/validate/report.ts`; `config` from
  `../marketplace.config.ts`.
- Produces:
  - `buildValidationReport(): Promise<Report>` — pure orchestration, no
    `Deno.exit`, importable by tests.
  - An executable script (guarded by `import.meta.main`) that prints the report
    and exits `0` when all manifests conform and `1` otherwise.

The entry point is split into an exported `buildValidationReport()` and an
`import.meta.main` guard so the test can assert the exit code **in-process** (no
subprocess, so it runs under the existing `deno test --allow-read
--allow-write`
task without needing `--allow-run`).

- [ ] **Step 1: Write the failing test**

Create `scripts/validate-manifests_test.ts`:

```typescript
import { assertEquals } from "@std/assert";
import { buildValidationReport } from "./validate-manifests.ts";

Deno.test("validate-manifests: real config produces a clean, exit-0 report", async () => {
  const report = await buildValidationReport();
  assertEquals(report.exitCode, 0);
  assertEquals(report.summary, "✓ all 7 manifests conform");
  assertEquals(report.lines, []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test --allow-read --allow-write scripts/validate-manifests_test.ts`
Expected: FAIL — module `./validate-manifests.ts` not found.

- [ ] **Step 3: Implement the entry point**

Create `scripts/validate-manifests.ts`:

```typescript
// scripts/validate-manifests.ts
import { renderJson } from "./lib/render-json.ts";
import { validateAll } from "./lib/validate/validate.ts";
import { buildReport, type Report } from "./lib/validate/report.ts";
import { config } from "../marketplace.config.ts";

export async function buildValidationReport(): Promise<Report> {
  const manifests = renderJson(config);
  const violations = await validateAll(manifests);
  return buildReport(violations, manifests.length);
}

if (import.meta.main) {
  const report = await buildValidationReport();
  console.log(report.header);
  if (report.lines.length > 0) {
    console.error("");
    for (const line of report.lines) console.error(line);
    console.error("");
  }
  console.log(report.summary);
  Deno.exit(report.exitCode);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `deno test --allow-read --allow-write scripts/validate-manifests_test.ts`
Expected: PASS (1 test). The "exit 1 on bad input" path is covered by the
`buildReport` unit test (Task 1) and the `validateAll` violation tests (Task 2).

- [ ] **Step 5: Format and commit**

```bash
deno fmt scripts/validate-manifests.ts scripts/validate-manifests_test.ts
git add scripts/validate-manifests.ts scripts/validate-manifests_test.ts
git commit -m "feat: validate-manifests entry point"
```

---

### Task 4: Wire into the release gate

**Files:**

- Modify: `deno.json` (`tasks` block: add `validate-manifests`, extend `ci` and
  `typecheck`)
- Modify: `README.md` (Development section: note the new gate step)

**Interfaces:**

- Consumes: the `validate-manifests` script from Task 3.
- Produces: `deno task validate-manifests` and its inclusion in `deno task ci`
  (hence `mise run release`, pre-commit, and CI).

- [ ] **Step 1: Add the task and extend `ci` + `typecheck`**

In `deno.json`, modify the `tasks` block. Add the new task after `lint-skills`:

```jsonc
"lint-skills": "deno run --allow-read=. scripts/lint-skills.ts",
"validate-manifests": "deno run --allow-read=. scripts/validate-manifests.ts",
```

Extend `typecheck` to include the new entry point:

```jsonc
"typecheck": "deno check scripts/generate.ts scripts/rasterize.ts scripts/lint-skills.ts scripts/validate-manifests.ts marketplace.config.ts",
```

Extend `ci` to run validation right after `check`:

```jsonc
"ci": "deno task fmt-check && deno task lint && deno task typecheck && deno task check && deno task validate-manifests && deno task lint-skills && deno task test",
```

- [ ] **Step 2: Format the edited config so fmt-check passes**

`deno.json` was re-edited in Step 1; the README is edited in Step 5. The
validate-module files were already formatted in their own tasks.

Run: `deno fmt deno.json` Expected: reformats `deno.json` if needed. (README is
formatted in Step 5 below.)

- [ ] **Step 3: Run the new task directly**

Run: `deno task validate-manifests` Expected output:

```
manifest-validate: 7 manifests checked
✓ all 7 manifests conform
```

Exit code 0.

- [ ] **Step 4: Run the full release gate**

Run: `deno task ci` Expected: every step passes — `fmt-check`, `lint`,
`typecheck`, `check`, `validate-manifests`, `lint-skills`, `test` — ending with
the test summary all green.

- [ ] **Step 5: Update the README Development section**

In `README.md`, the Development section lists individual gate steps:
`mise run fmt`, `fmt-check`, `lint`, `typecheck`, `check`, `test`. Update that
sentence to include the new step so the gate is documented:

Find:

```markdown
Individual steps are also available: `mise run fmt`, `fmt-check`, `lint`,
`typecheck`, `check`, `test`.
```

Replace with:

```markdown
Individual steps are also available: `mise run fmt`, `fmt-check`, `lint`,
`typecheck`, `check`, `validate-manifests`, `lint-skills`, `test`.
```

- [ ] **Step 6: Format and commit**

```bash
deno fmt deno.json README.md
git add deno.json README.md
git commit -m "feat: wire manifest validation into the release gate"
```

---

## Notes for the implementer

- **`@cfworker/json-schema` API:** `new Validator(schema, "2020-12", false)` —
  the third arg `false` disables short-circuiting so all errors are reported,
  not just the first. `validator.validate(instance)` returns
  `{ valid: boolean, errors: OutputUnit[] }`; each `OutputUnit` has
  `instanceLocation` (a JSON Pointer like `/version`) and `error` (the message).
  The `npm:` import fetches on first run and updates `deno.lock` — commit the
  lock change (Task 2, Step 7).
- **Why validate `renderJson(config)` and not files on disk:** `deno task check`
  already guarantees disk equals rendered output, so validating the in-memory
  render is equivalent and keeps the validator self-contained and unit-testable.
- **Schemas are best-effort and ours to maintain.** Each carries
  `"x-provenance": "best-effort"`. Because `additionalProperties: false`, a
  genuinely-new field a harness adds must be added to the schema before it can
  ship — this strictness is intended (it catches our own typos).
- **pi/opencode are intentionally not covered** by JSON-Schema validation; they
  are generated code, covered by `typecheck`/generation. This boundary is
  stated, not silent.
