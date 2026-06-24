import { join } from "jsr:@std/path@^1.0.0";
import type { GeneratedFile, MarketplaceConfig } from "./types.ts";
import { renderTemplate, templateVars } from "./templates.ts";

// (path under templatesDir) -> (output path in repo)
const HOOK_FILES: Array<[string, string]> = [
  ["hooks/session-start", "hooks/session-start"],
  ["hooks/session-start-codex", "hooks/session-start-codex"],
  ["hooks/run-hook.cmd", "hooks/run-hook.cmd"],
  ["hooks/hooks.json", "hooks/hooks.json"],
  ["hooks/hooks-codex.json", "hooks/hooks-codex.json"],
  ["hooks/hooks-cursor.json", "hooks/hooks-cursor.json"],
];

export async function renderTemplated(
  config: MarketplaceConfig,
  templatesDir: string,
): Promise<GeneratedFile[]> {
  const vars = templateVars(config);
  const out: GeneratedFile[] = [];
  for (const [src, dest] of HOOK_FILES) {
    const text = await Deno.readTextFile(join(templatesDir, src));
    out.push({ path: dest, content: renderTemplate(text, vars) });
  }
  return out;
}
