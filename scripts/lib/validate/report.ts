import type { ManifestViolation } from "./types.ts";

export interface Report {
  header: string;
  lines: string[];
  summary: string;
  exitCode: number;
}

export function buildReport(
  violations: ManifestViolation[],
  manifestCount: number,
): Report {
  // Deterministic, locale-independent ordering (paths are machine identifiers).
  const cmp = (x: string, y: string) => (x < y ? -1 : x > y ? 1 : 0);
  const sorted = [...violations].sort((a, b) =>
    cmp(a.path, b.path) || cmp(a.instancePath, b.instancePath)
  );
  const lines = sorted.map((v) =>
    `  ${v.path}${v.instancePath ? ` ${v.instancePath}` : ""} — ${v.message}`
  );
  const header = `manifest-validate: ${manifestCount} manifests checked`;
  const summary = violations.length === 0
    ? `✓ all ${manifestCount} manifests conform`
    : `✗ ${plural(violations.length, "violation")}`;

  return { header, lines, summary, exitCode: violations.length === 0 ? 0 : 1 };
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
