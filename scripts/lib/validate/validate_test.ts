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
