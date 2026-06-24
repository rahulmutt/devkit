import type { Finding, SkillRecord } from "./types.ts";
import type { Harness } from "../types.ts";

const REGISTRY = "<registry>";
const REFERENCE_STEM: Record<string, string> = { claude: "claude-code-tools" };

export function stemFor(harness: string): string {
  return REFERENCE_STEM[harness] ?? `${harness}-tools`;
}

export function checkRegistry(
  records: SkillRecord[],
  usingDevkit: SkillRecord,
  harnesses: Harness[],
  bootstrapSkill: string,
): Finding[] {
  const findings: Finding[] = [];
  const body = usingDevkit.body;

  for (const r of records) {
    if (r.dir === bootstrapSkill) continue;
    if (!body.includes(`**${r.dir}**`)) {
      findings.push({
        level: "error",
        skill: REGISTRY,
        message:
          `skill "${r.dir}" not listed in ${bootstrapSkill} (expected **${r.dir}**)`,
      });
    }
  }

  const refFiles = new Set(usingDevkit.referenceFiles);
  for (const h of harnesses) {
    const file = `${stemFor(h)}.md`;
    if (!refFiles.has(file)) {
      findings.push({
        level: "error",
        skill: REGISTRY,
        message: `harness "${h}" has no references/${file}`,
      });
    }
    if (!body.includes(`references/${file}`)) {
      findings.push({
        level: "error",
        skill: REGISTRY,
        message:
          `harness "${h}" missing its invoke-mapping row (references/${file})`,
      });
    }
  }

  const expected = new Set(harnesses.map((h) => `${stemFor(h)}.md`));
  for (const file of usingDevkit.referenceFiles) {
    if (file.endsWith("-tools.md") && !expected.has(file)) {
      findings.push({
        level: "warn",
        skill: REGISTRY,
        message: `references/${file} is a tool-ref for no configured harness`,
      });
    }
  }

  return findings;
}
