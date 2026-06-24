import type { Finding, SkillRecord } from "./types.ts";

export const WARN_OVER = 500;
export const ERROR_OVER = 1024;

export function checkBudget(records: SkillRecord[]): Finding[] {
  const findings: Finding[] = [];
  for (const r of records) {
    const len = r.description.length;
    const id = r.name || r.dir;
    if (len > ERROR_OVER) {
      findings.push({
        level: "error",
        skill: id,
        message: `description is ${len} chars (max ${ERROR_OVER})`,
      });
    } else if (len > WARN_OVER) {
      findings.push({
        level: "warn",
        skill: id,
        message: `description is ${len} chars (target <=${WARN_OVER})`,
      });
    }
  }
  return findings;
}
