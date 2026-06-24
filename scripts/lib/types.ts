export type Harness =
  | "claude" | "codex" | "cursor" | "gemini" | "kimi" | "pi" | "opencode";

export interface MarketplaceConfig {
  marketplace: { name: string; description: string };
  plugin: {
    name: string;
    version: string;
    description: string;
    homepage: string;
    repository: string;
    license: string;
    keywords: string[];
  };
  owner: { name: string; email: string };
  bootstrapSkill: string;
  harnesses: Harness[];
  interface: {
    displayName: string;
    category: string;
    brandColor: string;
    logo: string;
    composerIcon: string;
  };
}

export type GeneratedFile = { path: string; content: string };
