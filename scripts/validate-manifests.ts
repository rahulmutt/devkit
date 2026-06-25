// scripts/validate-manifests.ts
import { renderAll } from "./lib/render.ts";
import { jsonManifests, validateAll } from "./lib/validate/validate.ts";
import { buildReport, type Report } from "./lib/validate/report.ts";
import { config } from "../marketplace.config.ts";

export async function buildValidationReport(): Promise<Report> {
  const manifests = jsonManifests(await renderAll(config));
  const violations = await validateAll(manifests);
  return buildReport(violations, manifests.length);
}

if (import.meta.main) {
  const report = await buildValidationReport();
  console.log(report.header);
  if (report.lines.length > 0) {
    console.error("");
    for (const line of report.lines) console.error(line);
    console.error("");
  }
  console.log(report.summary);
  Deno.exit(report.exitCode);
}
