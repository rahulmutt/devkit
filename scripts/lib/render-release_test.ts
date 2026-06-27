import { assertEquals } from "@std/assert";
import { renderReleaseConfig } from "./render-release.ts";

function parsed() {
  const files = renderReleaseConfig();
  assertEquals(files.length, 1);
  assertEquals(files[0].path, "release-please-config.json");
  return JSON.parse(files[0].content);
}

Deno.test("release config lists all 8 version-bearing files", () => {
  const extra = parsed().packages["."]["extra-files"];
  assertEquals(extra.length, 8);
  const paths = extra.map((e: { path: string }) => e.path).sort();
  assertEquals(paths, [
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

Deno.test("marketplace.json updates the nested plugins[0].version", () => {
  const extra = parsed().packages["."]["extra-files"];
  const mkt = extra.find((e: { path: string }) =>
    e.path === ".claude-plugin/marketplace.json"
  );
  assertEquals(mkt.jsonpath, "$.plugins[0].version");
});

Deno.test("marketplace.config.ts uses the generic updater", () => {
  const extra = parsed().packages["."]["extra-files"];
  const ts = extra.find((e: { path: string }) =>
    e.path === "marketplace.config.ts"
  );
  assertEquals(ts.type, "generic");
});

Deno.test("release config carries no _generated marker", () => {
  // release-please schema-validates this file and rejects unknown root keys,
  // so the usual generated marker must be absent.
  assertEquals("_generated" in parsed(), false);
});
