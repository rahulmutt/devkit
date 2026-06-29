import { assertEquals } from "@std/assert";
import { renderJson } from "./render-json.ts";
import { config } from "../../marketplace.config.ts";

function find(files: { path: string; content: string }[], p: string) {
  const f = files.find((x) => x.path === p);
  if (!f) throw new Error(`missing ${p}`);
  return JSON.parse(f.content);
}

Deno.test("all JSON manifests agree on version and plugin name", () => {
  // The canonical version is single-sourced in marketplace.config.ts (bumped
  // by release-please). Assert every manifest matches that source rather than a
  // frozen literal, so this stays green across releases — agreement with the
  // source is the invariant this test exists to protect.
  const expected = config.plugin.version;
  const files = renderJson(config);
  const claudeMkt = find(files, ".claude-plugin/marketplace.json");
  assertEquals(claudeMkt.plugins[0].version, expected);
  assertEquals(claudeMkt.plugins[0].name, "devkit");

  for (
    const p of [
      ".claude-plugin/plugin.json",
      ".codex-plugin/plugin.json",
      ".cursor-plugin/plugin.json",
      ".kimi-plugin/plugin.json",
      "gemini-extension.json",
      "package.json",
    ]
  ) {
    assertEquals(find(files, p).version, expected, `${p} version`);
  }
});

Deno.test("codex and kimi carry skills path and interface", () => {
  const files = renderJson(config);
  const codex = find(files, ".codex-plugin/plugin.json");
  assertEquals(codex.skills, "./skills/");
  assertEquals(codex.interface.displayName, "Devkit");
  const kimi = find(files, ".kimi-plugin/plugin.json");
  assertEquals(kimi.sessionStart.skill, "using-devkit");
});
