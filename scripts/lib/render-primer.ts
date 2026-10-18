import { readFile } from "node:fs/promises";
import { join } from "node:path";
import * as prettier from "prettier";
import type { GeneratedFile } from "./types.ts";
import type { SkillRecord } from "./lint/types.ts";
import { discoverSkills } from "./lint/discover.ts";

// The bootstrap primer's skill index is rendered from each skill's frontmatter
// description, so the routing text agents see at session start can't drift
// from the descriptions that drive triggering.
const REGION = "skill index";

export function renderSkillIndex(
  records: SkillRecord[],
  bootstrapSkill: string,
): string {
  return records
    .filter((r) => r.dir !== bootstrapSkill)
    .map((r) => `- **${r.dir}** — ${r.description}\n`)
    .join("");
}

export function spliceRegion(
  src: string,
  region: string,
  content: string,
): string {
  const begin = `<!-- BEGIN GENERATED: ${region} -->\n`;
  const end = `<!-- END GENERATED: ${region} -->`;
  const start = src.indexOf(begin);
  const stop = src.indexOf(end);
  if (start === -1 || stop < start) {
    throw new Error(`missing "${region}" generated-region markers`);
  }
  return src.slice(0, start + begin.length) + content + src.slice(stop);
}

export async function renderPrimer(
  skillsDir: string,
  bootstrapSkill: string,
): Promise<GeneratedFile[]> {
  const path = join(skillsDir, bootstrapSkill, "SKILL.md");
  const src = await readFile(path, "utf8");
  const index = renderSkillIndex(
    await discoverSkills(skillsDir),
    bootstrapSkill,
  );
  return [
    {
      path: `skills/${bootstrapSkill}/SKILL.md`,
      content: await formatMarkdown(spliceRegion(src, REGION, index), path),
    },
  ];
}

// Run the primer through Prettier so the generated region is already wrapped
// the way the formatter wants it — otherwise `generate` and `fmt` fight.
async function formatMarkdown(src: string, filepath: string): Promise<string> {
  const config = await prettier.resolveConfig(filepath);
  return await prettier.format(src, { ...config, filepath });
}
