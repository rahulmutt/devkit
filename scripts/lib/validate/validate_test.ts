import { expect, test } from "bun:test";
import {
  checkCoverage,
  jsonManifests,
  MANIFEST_SCHEMAS,
  validateAll,
  validateManifest,
} from "./validate.ts";
import { renderAll } from "../render.ts";
import { config } from "../../../marketplace.config.ts";
import type { GeneratedFile } from "../types.ts";

test("validateAll: the real config's manifests all conform", async () => {
  const violations = await validateAll(jsonManifests(await renderAll(config)));
  expect(violations).toEqual([]);
});

test("validateManifest: missing required field is a violation", () => {
  const schema = {
    type: "object",
    required: ["name"],
    properties: { name: { type: "string" } },
  };
  const m: GeneratedFile = { path: "x.json", content: "{}" };
  const v = validateManifest(m, schema);
  expect(v.length >= 1).toEqual(true);
  expect(v[0].path).toEqual("x.json");
  // Fails for the right reason: the missing property is flagged at the root.
  expect(v.some((x) => x.instancePath === "")).toEqual(true);
});

test("validateManifest: wrong type is a violation", () => {
  const schema = {
    type: "object",
    properties: { name: { type: "string" } },
  };
  const m: GeneratedFile = { path: "x.json", content: '{"name":123}' };
  expect(
    validateManifest(m, schema).some((x) => x.instancePath === "/name"),
  ).toEqual(true);
});

test("validateManifest: bad enum is a violation", () => {
  const schema = {
    type: "object",
    properties: { cap: { enum: ["Read", "Write"] } },
  };
  const m: GeneratedFile = { path: "x.json", content: '{"cap":"Delete"}' };
  expect(
    validateManifest(m, schema).some((x) => x.instancePath === "/cap"),
  ).toEqual(true);
});

test("validateManifest: bad semver pattern is a violation", () => {
  const schema = {
    type: "object",
    properties: { version: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+" } },
  };
  const m: GeneratedFile = { path: "x.json", content: '{"version":"1.0"}' };
  expect(
    validateManifest(m, schema).some((x) => x.instancePath === "/version"),
  ).toEqual(true);
});

test("validateManifest: stray field fails additionalProperties", () => {
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: { name: { type: "string" } },
  };
  const m: GeneratedFile = {
    path: "x.json",
    content: '{"name":"a","extra":1}',
  };
  expect(
    validateManifest(m, schema).some((x) => x.instancePath === "/extra"),
  ).toEqual(true);
});

test("checkCoverage: unmapped manifest is a violation", () => {
  const v = checkCoverage(
    [{ path: "totally-unknown.json", content: "{}" }],
    new Map([["package", {}]]),
  );
  expect(v.some((x) => x.message.includes("no schema mapped"))).toEqual(true);
});

test("checkCoverage: missing schema file is a violation", () => {
  const v = checkCoverage(
    [{ path: ".codex-plugin/plugin.json", content: "{}" }],
    new Map(), // no schemas loaded
  );
  expect(v.some((x) => x.message.includes("codex-plugin.json"))).toEqual(true);
});

test("checkCoverage: orphan schema is a violation", async () => {
  const schemas = new Map<string, unknown>();
  for (const stem of Object.values(MANIFEST_SCHEMAS)) schemas.set(stem, {});
  schemas.set("ghost", {}); // not referenced by any manifest
  const v = checkCoverage(await allJsonManifests(), schemas);
  expect(v.some((x) => x.message.includes("orphan"))).toEqual(true);
});

test("checkCoverage: a mapped manifest no longer emitted is a violation", () => {
  const schemas = new Map<string, unknown>();
  for (const stem of Object.values(MANIFEST_SCHEMAS)) schemas.set(stem, {});
  // Only one of the mapped manifests is actually emitted.
  const v = checkCoverage([{ path: "package.json", content: "{}" }], schemas);
  expect(v.some((x) => x.message.includes("no longer emitted"))).toEqual(true);
});

async function allJsonManifests(): Promise<GeneratedFile[]> {
  return jsonManifests(await renderAll(config));
}
