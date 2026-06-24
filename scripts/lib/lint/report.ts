import type { Finding } from "./types.ts";

export interface Report {
  header: string;
  lines: string[];
  summary: string;
  exitCode: number;
}

export function buildReport(findings: Finding[], skillCount: number): Report {
  const sorted = [...findings].sort((a, b) =>
    a.skill.localeCompare(b.skill) || rank(a.level) - rank(b.level)
  );
  const lines = sorted.map((f) =>
    `  ${f.level.padEnd(5)}  ${f.skill.padEnd(20)} ${f.message}`
  );

  const errors = findings.filter((f) => f.level === "error").length;
  const warns = findings.filter((f) => f.level === "warn").length;
  const header = `skill-lint: ${skillCount} skills checked`;
  const summary = errors === 0 && warns === 0
    ? "✓ all checks passed"
    : `✗ ${plural(errors, "error")}, ${plural(warns, "warn")}`;

  return { header, lines, summary, exitCode: errors > 0 ? 1 : 0 };
}

function rank(level: "error" | "warn"): number {
  return level === "error" ? 0 : 1;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
