import { expect, test } from "bun:test";
import { renderReleaseConfig } from "./render-release.ts";

function parsed() {
  const files = renderReleaseConfig();
  expect(files.length).toEqual(1);
  expect(files[0].path).toEqual("release-please-config.json");
  return JSON.parse(files[0].content);
}

test("release config lists all 8 version-bearing files", () => {
  const extra = parsed().packages["."]["extra-files"];
  expect(extra.length).toEqual(8);
  const paths = extra.map((e: { path: string }) => e.path).sort();
  expect(paths).toEqual([
    ".claude-plugin/marketplace.json",
    ".claude-plugin/plugin.json",
    ".codex-plugin/plugin.json",
    ".cursor-plugin/plugin.json",
    ".kimi-plugin/plugin.json",
    "gemini-extension.json",
    "marketplace.config.ts",
    "package.json",
  ]);
});

test("marketplace.json updates the nested plugins[0].version", () => {
  const extra = parsed().packages["."]["extra-files"];
  const mkt = extra.find((e: { path: string }) =>
    e.path === ".claude-plugin/marketplace.json"
  );
  expect(mkt.jsonpath).toEqual("$.plugins[0].version");
});

test("marketplace.config.ts uses the generic updater", () => {
  const extra = parsed().packages["."]["extra-files"];
  const ts = extra.find((e: { path: string }) =>
    e.path === "marketplace.config.ts"
  );
  expect(ts.type).toEqual("generic");
});

test("release config carries no _generated marker", () => {
  // release-please schema-validates this file and rejects unknown root keys,
  // so the usual generated marker must be absent.
  expect("_generated" in parsed()).toEqual(false);
});
