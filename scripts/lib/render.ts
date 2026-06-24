import type { GeneratedFile, MarketplaceConfig } from "./types.ts";
import { renderJson } from "./render-json.ts";

export function renderAll(config: MarketplaceConfig): GeneratedFile[] {
  return [
    ...renderJson(config),
    // templated bootstraps added in Tasks 5-6
  ];
}
