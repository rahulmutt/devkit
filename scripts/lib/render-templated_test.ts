import { assertEquals, assertStringIncludes } from "@std/assert";
import { renderTemplated } from "./render-templated.ts";
import { config } from "../../marketplace.config.ts";

const TEMPLATES = new URL("../templates", import.meta.url).pathname;

Deno.test("emits gemini, pi, opencode bootstraps", async () => {
  const files = await renderTemplated(config, TEMPLATES);
  const paths = files.map((f) => f.path);
  for (
    const p of [
      "GEMINI.md",
      ".pi/extensions/devkit.ts",
      ".opencode/plugins/devkit.js",
      ".opencode/INSTALL.md",
    ]
  ) {
    assertEquals(paths.includes(p), true, `missing ${p}`);
  }
});

Deno.test("pi extension references the bootstrap skill", async () => {
  const files = await renderTemplated(config, TEMPLATES);
  const pi = files.find((f) => f.path === ".pi/extensions/devkit.ts")!;
  assertStringIncludes(pi.content, "using-devkit");
});
