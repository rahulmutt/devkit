import { Validator } from "@cfworker/json-schema";
import type { GeneratedFile } from "../types.ts";
import type { ManifestViolation } from "./types.ts";

// Manifest path -> schema file stem under ./schemas/.
// Must cover every JSON manifest renderAll() emits (checkCoverage enforces this).
export const MANIFEST_SCHEMAS: Record<string, string> = {
  ".claude-plugin/marketplace.json": "claude-marketplace",
  ".claude-plugin/plugin.json": "claude-plugin",
  ".codex-plugin/plugin.json": "codex-plugin",
  ".cursor-plugin/plugin.json": "cursor-plugin",
  ".kimi-plugin/plugin.json": "kimi-plugin",
  "gemini-extension.json": "gemini-extension",
  "package.json": "package",
  "hooks/hooks.json": "hooks",
  "hooks/hooks-codex.json": "hooks",
  "hooks/hooks-cursor.json": "hooks",
};

// The validator's scope is every JSON file the generator emits. Filtering by
// extension keeps coverage self-maintaining: a new .json manifest with no
// schema is caught by checkCoverage's "no schema mapped" failure.
export function jsonManifests(files: GeneratedFile[]): GeneratedFile[] {
  return files.filter((f) => f.path.endsWith(".json"));
}

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

  const emitted = new Set(manifests.map((m) => m.path));
  for (const path of Object.keys(MANIFEST_SCHEMAS)) {
    if (!emitted.has(path)) {
      violations.push({
        path,
        instancePath: "",
        message: "mapped manifest is no longer emitted by the generator",
      });
    }
  }

  return violations;
}

export function validateManifest(
  manifest: GeneratedFile,
  schema: unknown,
): ManifestViolation[] {
  // Precondition: manifest.content is valid JSON. Every caller feeds
  // renderJson/renderAll output, which is produced by JSON.stringify, so this
  // holds for the gate. A non-JSON content would throw here rather than report
  // a violation — acceptable given the closed, generator-controlled input set.
  const validator = new Validator(schema as object, "2020-12", false);
  const result = validator.validate(JSON.parse(manifest.content));
  if (result.valid) return [];
  return [...result.errors].map((e) => ({
    path: manifest.path,
    // @cfworker reports a URI-fragment location ("#", "#/version"); strip the
    // leading "#" to a plain RFC 6901 JSON Pointer ("" for root, "/version").
    instancePath: e.instanceLocation.replace(/^#/, ""),
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
