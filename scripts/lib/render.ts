import type { GeneratedFile, MarketplaceConfig } from "./types.ts";
import { renderJson } from "./render-json.ts";
import { renderTemplated } from "./render-templated.ts";

const TEMPLATES_DIR = new URL("../templates", import.meta.url).pathname;

export async function renderAll(
  config: MarketplaceConfig,
): Promise<GeneratedFile[]> {
  return [
    ...renderJson(config),
    ...(await renderTemplated(config, TEMPLATES_DIR)),
  ];
}
