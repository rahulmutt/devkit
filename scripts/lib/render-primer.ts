import { join } from "@std/path";
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
  const src = await Deno.readTextFile(path);
  const index = renderSkillIndex(
    await discoverSkills(skillsDir),
    bootstrapSkill,
  );
  return [{
    path: `skills/${bootstrapSkill}/SKILL.md`,
    content: await formatMarkdown(spliceRegion(src, REGION, index)),
  }];
}

// Run the primer through `deno fmt` so the generated region is already wrapped
// the way the formatter wants it — otherwise `generate` and `fmt` fight.
async function formatMarkdown(src: string): Promise<string> {
  const proc = new Deno.Command("deno", {
    args: ["fmt", "--ext", "md", "-"],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  }).spawn();
  const writer = proc.stdin.getWriter();
  await writer.write(new TextEncoder().encode(src));
  await writer.close();
  const { success, stdout, stderr } = await proc.output();
  if (!success) {
    throw new Error(`deno fmt failed: ${new TextDecoder().decode(stderr)}`);
  }
  return new TextDecoder().decode(stdout);
}
