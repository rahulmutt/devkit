import { join } from "jsr:@std/path@^1.0.0";
import type { GeneratedFile, MarketplaceConfig } from "./types.ts";
import { renderTemplate, templateVars } from "./templates.ts";

// (path under templatesDir) -> (output path in repo) -> executable?
const HOOK_FILES: Array<[string, string, boolean?]> = [
  ["hooks/session-start", "hooks/session-start"],
  ["hooks/session-start-codex", "hooks/session-start-codex"],
  ["hooks/run-hook.cmd", "hooks/run-hook.cmd", true],
  ["hooks/hooks.json", "hooks/hooks.json"],
  ["hooks/hooks-codex.json", "hooks/hooks-codex.json"],
  ["hooks/hooks-cursor.json", "hooks/hooks-cursor.json"],
];

const STATIC_FILES: Array<[string, (name: string) => string]> = [
  ["GEMINI.md", () => "GEMINI.md"],
  ["pi/extensions/devkit.ts", (n) => `.pi/extensions/${n}.ts`],
  ["opencode/plugins/devkit.js", (n) => `.opencode/plugins/${n}.js`],
  ["opencode/INSTALL.md", () => ".opencode/INSTALL.md"],
];

export async function renderTemplated(
  config: MarketplaceConfig,
  templatesDir: string,
): Promise<GeneratedFile[]> {
  const vars = templateVars(config);
  const out: GeneratedFile[] = [];
  for (const [src, dest, executable] of HOOK_FILES) {
    const text = await Deno.readTextFile(join(templatesDir, src));
    const file: GeneratedFile = { path: dest, content: renderTemplate(text, vars) };
    if (executable) file.executable = true;
    out.push(file);
  }
  for (const [src, destFn] of STATIC_FILES) {
    const text = await Deno.readTextFile(join(templatesDir, src));
    out.push({
      path: destFn(config.plugin.name),
      content: renderTemplate(text, vars),
    });
  }
  return out;
}
