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
  const sorted = [...violations].sort((a, b) =>
    a.path.localeCompare(b.path) || a.instancePath.localeCompare(b.instancePath)
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
