import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { SkillRecord } from "./types.ts";

interface ParsedFrontmatter {
  hasFrontmatter: boolean;
  name: string;
  description: string;
  body: string;
}

export function parseFrontmatter(src: string): ParsedFrontmatter {
  const match = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { hasFrontmatter: false, name: "", description: "", body: src };
  }
  const [, fm, body] = match;
  return {
    hasFrontmatter: true,
    name: fieldValue(fm, "name"),
    description: fieldValue(fm, "description"),
    body,
  };
}

function fieldValue(fm: string, key: string): string {
  const line = fm.split("\n").find((l) => l.startsWith(`${key}:`));
  return line ? line.slice(key.length + 1).trim() : "";
}

export async function discoverSkills(
  skillsDir: string,
): Promise<SkillRecord[]> {
  const records: SkillRecord[] = [];
  for (const entry of await readdir(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = entry.name;
    let src: string;
    try {
      src = await readFile(join(skillsDir, dir, "SKILL.md"), "utf8");
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw e;
    }
    const fm = parseFrontmatter(src);
    records.push({
      name: fm.name,
      dir,
      description: fm.description,
      hasFrontmatter: fm.hasFrontmatter,
      body: fm.body,
      referenceFiles: await listReferenceFiles(
        join(skillsDir, dir, "references"),
      ),
    });
  }
  records.sort((a, b) => a.dir.localeCompare(b.dir));
  return records;
}

async function listReferenceFiles(refsDir: string): Promise<string[]> {
  const files: string[] = [];
  try {
    for (const entry of await readdir(refsDir, { withFileTypes: true })) {
      if (entry.isFile()) files.push(entry.name);
    }
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    // no references directory — fine
  }
  return files.sort();
}
