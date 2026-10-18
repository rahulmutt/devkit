import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as prettier from "prettier";
import { renderAll } from "./lib/render.ts";
import { config } from "../marketplace.config.ts";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const IGNORE_PATH = join(ROOT, ".prettierignore");

/** The text up to and including the closing `---` frontmatter line. */
function frontmatter(text: string): string {
  const m = /^---\n[\s\S]*?\n---(?=\n|$)/.exec(text);
  if (!m) throw new Error("no frontmatter");
  return m[0];
}

test("skill frontmatter is a Prettier fixed point", async () => {
  const skillsDir = join(ROOT, "skills");
  const names = readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  let checked = 0;
  for (const name of names) {
    const abs = join(skillsDir, name, "SKILL.md");
    let input: string;
    try {
      input = readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    const resolved = (await prettier.resolveConfig(abs)) ?? {};
    const output = await prettier.format(input, { ...resolved, filepath: abs });
    expect(frontmatter(output), `frontmatter changed: ${abs}`).toBe(
      frontmatter(input),
    );
    checked++;
  }
  expect(checked).toBeGreaterThan(0);
});

test("every generated file is Prettier-ignored or a Prettier fixed point", async () => {
  const files = await renderAll(config);
  expect(files.length).toBeGreaterThan(0);
  for (const f of files) {
    const abs = join(ROOT, f.path);
    const info = await prettier.getFileInfo(abs, { ignorePath: IGNORE_PATH });
    // Prettier itself skips ignored files and files with no parser.
    if (info.ignored || !info.inferredParser) continue;
    const resolved = (await prettier.resolveConfig(abs)) ?? {};
    const out = await prettier.format(f.content, { ...resolved, filepath: abs });
    expect(out, `not a Prettier fixed point: ${f.path}`).toBe(f.content);
  }
});
