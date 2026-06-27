import type { GeneratedFile } from "./types.ts";

// release-please consumes and schema-validates this config itself, and rejects
// unknown root keys — so unlike the per-harness manifests it deliberately does
// NOT carry a `_generated` marker. It stays single-sourced here; the drift
// check (`deno task check`) guards it against hand edits.
const CONFIG = {
  $schema:
    "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "release-type": "simple",
  "bump-minor-pre-major": true,
  "bump-patch-for-minor-pre-major": false,
  "include-component-in-tag": false,
  "changelog-sections": [
    { type: "feat", section: "Features" },
    { type: "fix", section: "Bug Fixes" },
    { type: "perf", section: "Performance" },
    { type: "refactor", section: "Refactors" },
    { type: "docs", section: "Documentation" },
    { type: "chore", section: "Chores", hidden: true },
    { type: "test", section: "Tests", hidden: true },
    { type: "ci", section: "Continuous Integration", hidden: true },
    { type: "build", section: "Build System", hidden: true },
    { type: "style", section: "Styles", hidden: true },
  ],
  packages: {
    ".": {
      "extra-files": [
        { type: "json", path: "package.json", jsonpath: "$.version" },
        { type: "json", path: "gemini-extension.json", jsonpath: "$.version" },
        {
          type: "json",
          path: ".claude-plugin/plugin.json",
          jsonpath: "$.version",
        },
        {
          type: "json",
          path: ".claude-plugin/marketplace.json",
          jsonpath: "$.plugins[0].version",
        },
        {
          type: "json",
          path: ".codex-plugin/plugin.json",
          jsonpath: "$.version",
        },
        {
          type: "json",
          path: ".cursor-plugin/plugin.json",
          jsonpath: "$.version",
        },
        {
          type: "json",
          path: ".kimi-plugin/plugin.json",
          jsonpath: "$.version",
        },
        { type: "generic", path: "marketplace.config.ts" },
      ],
    },
  },
};

export function renderReleaseConfig(): GeneratedFile[] {
  return [{
    path: "release-please-config.json",
    content: JSON.stringify(CONFIG, null, 2) + "\n",
  }];
}
