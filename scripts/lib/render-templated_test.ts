import { expect, test } from "bun:test";
import { renderTemplated } from "./render-templated.ts";
import { config } from "../../marketplace.config.ts";

const TEMPLATES = new URL("../templates", import.meta.url).pathname;

test("emits gemini, pi, opencode bootstraps", async () => {
  const files = await renderTemplated(config, TEMPLATES);
  const paths = files.map((f) => f.path);
  for (const p of [
    "GEMINI.md",
    ".pi/extensions/devkit.ts",
    ".opencode/plugins/devkit.js",
    ".opencode/INSTALL.md",
  ]) {
    expect(paths.includes(p), `missing ${p}`).toEqual(true);
  }
});

test("pi extension references the bootstrap skill", async () => {
  const files = await renderTemplated(config, TEMPLATES);
  const pi = files.find((f) => f.path === ".pi/extensions/devkit.ts")!;
  expect(pi.content).toContain("using-devkit");
});

test("run-hook.cmd is marked executable, session-start is not", async () => {
  const files = await renderTemplated(config, TEMPLATES);
  const cmd = files.find((f) => f.path === "hooks/run-hook.cmd")!;
  expect(cmd.executable).toEqual(true);
  const session = files.find((f) => f.path === "hooks/session-start")!;
  expect(session.executable ?? false).toEqual(false);
});
