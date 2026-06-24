import type { MarketplaceConfig } from "./types.ts";
import { config } from "../../marketplace.config.ts";

export function validateConfig(c: MarketplaceConfig): void {
  const req: Array<[string, unknown]> = [
    ["marketplace.name", c.marketplace?.name],
    ["plugin.name", c.plugin?.name],
    ["plugin.version", c.plugin?.version],
    ["plugin.description", c.plugin?.description],
    ["owner.name", c.owner?.name],
    ["owner.email", c.owner?.email],
    ["bootstrapSkill", c.bootstrapSkill],
  ];
  for (const [path, val] of req) {
    if (typeof val !== "string" || val.trim() === "") {
      throw new Error(`config field "${path}" must be a non-empty string`);
    }
  }
  if (!/^\d+\.\d+\.\d+/.test(c.plugin.version)) {
    throw new Error(`plugin.version "${c.plugin.version}" is not semver`);
  }
  if (c.harnesses.length !== 7) {
    throw new Error(`expected 7 harnesses, got ${c.harnesses.length}`);
  }
}

export function loadConfig(): MarketplaceConfig {
  validateConfig(config);
  return config;
}
