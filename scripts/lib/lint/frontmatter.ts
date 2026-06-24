import type { Finding, SkillRecord } from "./types.ts";

export function checkFrontmatter(records: SkillRecord[]): Finding[] {
  const findings: Finding[] = [];
  for (const r of records) {
    const id = r.name || r.dir;
    if (!r.hasFrontmatter) {
      findings.push({
        level: "error",
        skill: id,
        message: "no YAML frontmatter block",
      });
      continue;
    }
    if (!r.name) {
      findings.push({
        level: "error",
        skill: r.dir,
        message: "frontmatter name is missing or empty",
      });
    } else if (r.name !== r.dir) {
      findings.push({
        level: "error",
        skill: r.dir,
        message:
          `frontmatter name "${r.name}" does not match directory "${r.dir}"`,
      });
    }
    if (!r.description) {
      findings.push({
        level: "error",
        skill: id,
        message: "frontmatter description is missing or empty",
      });
    } else if (!r.description.startsWith("Use when")) {
      findings.push({
        level: "warn",
        skill: id,
        message: 'description does not start with "Use when"',
      });
    }
  }
  return findings;
}
