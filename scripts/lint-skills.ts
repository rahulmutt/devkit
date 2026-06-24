// scripts/lint-skills.ts
import { discoverSkills } from "./lib/lint/discover.ts";
import { checkFrontmatter } from "./lib/lint/frontmatter.ts";
import { checkBudget } from "./lib/lint/budget.ts";
import { checkLinks } from "./lib/lint/links.ts";
import { checkRegistry } from "./lib/lint/registry.ts";
import { buildReport } from "./lib/lint/report.ts";
import { config } from "../marketplace.config.ts";

const ROOT = new URL("../", import.meta.url).pathname;

async function main() {
  const records = await discoverSkills(`${ROOT}skills`);
  const primer = records.find((r) => r.dir === config.bootstrapSkill);
  if (!primer) {
    console.error(
      `skill-lint: bootstrap skill "${config.bootstrapSkill}" not found`,
    );
    Deno.exit(1);
  }

  const findings = [
    ...checkFrontmatter(records),
    ...checkBudget(records),
    ...checkLinks(records),
    ...checkRegistry(records, primer, config.harnesses, config.bootstrapSkill),
  ];

  const report = buildReport(findings, records.length);
  console.log(report.header);
  if (report.lines.length > 0) {
    console.error("");
    for (const line of report.lines) console.error(line);
    console.error("");
  }
  console.log(report.summary);
  Deno.exit(report.exitCode);
}

await main();
