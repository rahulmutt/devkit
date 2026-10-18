import { expect, test } from "bun:test";
import { renderJson } from "./render-json.ts";
import { config } from "../../marketplace.config.ts";

function find(files: { path: string; content: string }[], p: string) {
  const f = files.find((x) => x.path === p);
  if (!f) throw new Error(`missing ${p}`);
  return JSON.parse(f.content);
}

test("all JSON manifests agree on version and plugin name", () => {
  // The canonical version is single-sourced in marketplace.config.ts (bumped
  // by release-please). Assert every manifest matches that source rather than a
  // frozen literal, so this stays green across releases — agreement with the
  // source is the invariant this test exists to protect.
  const expected = config.plugin.version;
  const files = renderJson(config);
  const claudeMkt = find(files, ".claude-plugin/marketplace.json");
  expect(claudeMkt.plugins[0].version).toEqual(expected);
  expect(claudeMkt.plugins[0].name).toEqual("devkit");

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
    expect(find(files, p).version, `${p} version`).toEqual(expected);
  }
});

test("codex and kimi carry skills path and interface", () => {
  const files = renderJson(config);
  const codex = find(files, ".codex-plugin/plugin.json");
  expect(codex.skills).toEqual("./skills/");
  expect(codex.interface.displayName).toEqual("Devkit");
  const kimi = find(files, ".kimi-plugin/plugin.json");
  expect(kimi.sessionStart.skill).toEqual("using-devkit");
});
