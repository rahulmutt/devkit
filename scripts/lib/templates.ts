import type { MarketplaceConfig } from "./types.ts";

export function renderTemplate(
  text: string,
  vars: Record<string, string>,
): string {
  const out = text.replace(/\{\{(\w+)\}\}/g, (_m, key) => {
    if (!(key in vars)) {
      throw new Error(`unresolved template token: {{${key}}}`);
    }
    return vars[key];
  });
  const leftover = out.match(/\{\{(\w+)\}\}/);
  if (leftover) throw new Error(`unresolved template token: ${leftover[0]}`);
  return out;
}

export function templateVars(c: MarketplaceConfig): Record<string, string> {
  return {
    pluginName: c.plugin.name,
    displayName: c.interface.displayName,
    version: c.plugin.version,
    bootstrapSkill: c.bootstrapSkill,
    description: c.plugin.description,
    ownerName: c.owner.name,
    ownerEmail: c.owner.email,
    homepage: c.plugin.homepage,
    repository: c.plugin.repository,
  };
}
