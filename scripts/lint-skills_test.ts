// scripts/lint-skills_test.ts
import { assertEquals } from "@std/assert";
import { discoverSkills } from "./lib/lint/discover.ts";
import { checkFrontmatter } from "./lib/lint/frontmatter.ts";
import { checkBudget } from "./lib/lint/budget.ts";
import { checkLinks } from "./lib/lint/links.ts";
import { checkRegistry } from "./lib/lint/registry.ts";
import { config } from "../marketplace.config.ts";

Deno.test("the real skills tree has zero lint errors", async () => {
  const root = new URL("../", import.meta.url).pathname;
  const records = await discoverSkills(`${root}skills`);
  const primer = records.find((r) => r.dir === config.bootstrapSkill)!;
  const findings = [
    ...checkFrontmatter(records),
    ...checkBudget(records),
    ...checkLinks(records),
    ...checkRegistry(records, primer, config.harnesses, config.bootstrapSkill),
  ];
  const errors = findings.filter((f) => f.level === "error");
  assertEquals(errors, [], `lint errors: ${JSON.stringify(errors)}`);
});
