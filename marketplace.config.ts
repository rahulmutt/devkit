import type { MarketplaceConfig } from "./scripts/lib/types.ts";

export const config: MarketplaceConfig = {
  marketplace: {
    name: "devkit-marketplace",
    description: "Developer-workflow skills for AI coding agents",
  },
  plugin: {
    name: "devkit",
    version: "0.3.0", // x-release-please-version
    description:
      "Engineering-discipline skills for AI coding agents: pinned dev environments, test strategy, clean code, security, and navigable repos",
    homepage: "https://github.com/rahulmutt/devkit",
    repository: "https://github.com/rahulmutt/devkit",
    license: "MIT",
    keywords: [
      "skills",
      "mise",
      "devenv",
      "developer-environment",
      "testing",
      "clean-code",
      "security",
      "documentation",
    ],
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
