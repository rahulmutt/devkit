// Action pins (`owner/action@<sha> # vX.Y.Z`) are copied into skill docs,
// where Renovate can't bump them. This flags any action pinned two ways.
// After a Renovate bump in .github/workflows, update the same pin in
// skills/ci-pipelines/SKILL.md and references/github-actions.md.

export interface PinSource {
  path: string;
  text: string;
}

const PIN = /([\w.-]+\/[\w./-]+)@([0-9a-f]{40})\s+#\s+(v[\w.-]+)/g;

export function pinDrift(sources: PinSource[]): string[] {
  const seen = new Map<string, Map<string, string[]>>();
  for (const { path, text } of sources) {
    for (const [, action, sha, version] of text.matchAll(PIN)) {
      const pins = seen.get(action) ?? new Map<string, string[]>();
      const pin = `${sha} # ${version}`;
      pins.set(pin, [...(pins.get(pin) ?? []), path]);
      seen.set(action, pins);
    }
  }
  const problems: string[] = [];
  for (const [action, pins] of [...seen].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    if (pins.size > 1) {
      const detail = [...pins].map(
        ([pin, paths]) => `${pin} (${paths.join(", ")})`,
      );
      problems.push(`${action} pinned differently: ${detail.join("; ")}`);
    }
  }
  return problems;
}
