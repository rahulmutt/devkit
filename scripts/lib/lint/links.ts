import type { Finding, SkillRecord } from "./types.ts";

export function referencedFiles(body: string): string[] {
  const re = /references\/([\w-]+(?:\.[\w-]+)+)/g;
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) found.add(m[1]);
  return [...found].sort();
}

export function checkLinks(records: SkillRecord[]): Finding[] {
  const findings: Finding[] = [];
  for (const r of records) {
    const id = r.name || r.dir;
    const mentioned = referencedFiles(r.body);
    const present = new Set(r.referenceFiles);
    for (const ref of mentioned) {
      if (!present.has(ref)) {
        findings.push({
          level: "error",
          skill: id,
          message: `references/${ref} linked but not found`,
        });
      }
    }
    const mentionedSet = new Set(mentioned);
    for (const file of r.referenceFiles) {
      if (!mentionedSet.has(file)) {
        findings.push({
          level: "warn",
          skill: id,
          message: `references/${file} exists but is never mentioned`,
        });
      }
    }
  }
  return findings;
}
