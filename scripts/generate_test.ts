import { assertEquals, assertStringIncludes } from "@std/assert";
import { renderAll } from "./lib/render.ts";
import { config } from "../marketplace.config.ts";

const TEMPLATES = new URL("./templates", import.meta.url).pathname;

Deno.test("every JSON manifest agrees on version", async () => {
  const files = await renderAll(config);
  const versions = files
    // Exclude manifests that carry no version field: the hooks manifests, and
    // release-please-config.json (its versions live inside extra-files, not a
    // top-level `version`/`plugins[0].version`).
    .filter((f) =>
      f.path.endsWith(".json") && !f.path.endsWith("hooks.json") &&
      !f.path.endsWith("hooks-codex.json") &&
      !f.path.endsWith("hooks-cursor.json") &&
      f.path !== "release-please-config.json"
    )
    .map((f) => {
      const o = JSON.parse(f.content);
      return o.version ?? o.plugins?.[0]?.version;
    });
  for (const v of versions) assertEquals(v, config.plugin.version);
});

Deno.test("bootstrap injectors reference the configured bootstrap skill", async () => {
  const files = await renderAll(config);
  for (
    const p of [
      "hooks/session-start",
      ".pi/extensions/devkit.ts",
      ".opencode/plugins/devkit.js",
      "GEMINI.md",
    ]
  ) {
    const f = files.find((x) => x.path === p)!;
    assertStringIncludes(
      f.content,
      config.bootstrapSkill,
      `${p} must reference ${config.bootstrapSkill}`,
    );
  }
});

Deno.test("no generated file contains an unresolved template token", async () => {
  const files = await renderAll(config);
  for (const f of files) {
    assertEquals(
      /\{\{\w+\}\}/.test(f.content),
      false,
      `${f.path} has an unresolved token`,
    );
  }
});

Deno.test("committed files match the generator output (no drift)", async () => {
  const { checkFiles } = await import("./lib/files.ts");
  const root = new URL("../", import.meta.url).pathname;
  const files = await renderAll(config);
  const bad = (await checkFiles(files, root)).filter((r) => r.status !== "ok");
  assertEquals(bad, [], `drift: ${JSON.stringify(bad)}`);
});

// Silence unused-var lint for TEMPLATES if not referenced above.
void TEMPLATES;
