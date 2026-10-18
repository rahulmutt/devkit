// scripts/lib/lint/commits.ts
// Conventional Commits subject check for `mise run lint-commits`. Allowed types
// come from release-please-config.json so the list has one source.

import { exec } from "../exec.ts";

export interface Commit {
  sha: string;
  subject: string;
}

const HEADER = /^([a-z]+)(\([\w./-]+\))?!?: \S/;
const REVERT = /^Revert ".+"$/;
const MALFORMED = "not `type(scope)!: summary`";

export function allowedTypes(config: {
  "changelog-sections": { type: string }[];
}): string[] {
  return config["changelog-sections"].map((s) => s.type);
}

export function checkSubject(
  subject: string,
  types: readonly string[],
): string | null {
  if (REVERT.test(subject)) return null;
  const match = HEADER.exec(subject);
  if (!match) return MALFORMED;
  if (!types.includes(match[1])) {
    return `unknown type "${match[1]}" (allowed: ${types.join(", ")})`;
  }
  return null;
}

export function lintCommits(
  commits: readonly Commit[],
  types: readonly string[],
): string[] {
  const problems: string[] = [];
  for (const { sha, subject } of commits) {
    const reason = checkSubject(subject, types);
    if (reason) problems.push(`${sha.slice(0, 7)} ${subject}: ${reason}`);
  }
  return problems;
}

export function parseLog(output: string): Commit[] {
  return output
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => {
      const tab = line.indexOf("\t");
      return { sha: line.slice(0, tab), subject: line.slice(tab + 1) };
    });
}

export async function commitsInRange(
  base: string,
  cwd: string,
): Promise<Commit[]> {
  const { code, stdout, stderr } = await exec(
    "git",
    ["log", "--no-merges", "--format=%H%x09%s", `${base}..HEAD`],
    cwd,
  );
  if (code !== 0) {
    throw new Error(`git log ${base}..HEAD failed: ${stderr.trim()}`);
  }
  return parseLog(stdout);
}
