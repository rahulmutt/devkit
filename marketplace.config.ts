import type { MarketplaceConfig } from "./scripts/lib/types.ts";

export const config: MarketplaceConfig = {
  marketplace: {
    name: "devkit-marketplace",
    description: "Developer-workflow skills for AI coding agents",
  },
  plugin: {
    name: "devkit",
    version: "0.2.0", // x-release-please-version
    description:
      "Developer-environment skills for AI coding agents: install tools with mise, fall back to devenv.nix",
    homepage: "https://github.com/rahulmutt/devkit",
    repository: "https://github.com/rahulmutt/devkit",
    license: "MIT",
    keywords: ["mise", "devenv", "developer-environment", "skills", "tooling"],
  },
  owner: { name: "Rahul Muttineni", email: "rahulmutt@gmail.com" },
  bootstrapSkill: "using-devkit",
  harnesses: ["claude", "codex", "cursor", "gemini", "kimi", "pi", "opencode"],
  interface: {
    displayName: "Devkit",
    category: "Coding",
    brandColor: "#2E7D5B",
    logo: "./assets/app-icon.png",
    composerIcon: "./assets/devkit.svg",
  },
};
