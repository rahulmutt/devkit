// scripts/lint-commits.ts
import { fromFileUrl } from "@std/path";
import {
  allowedTypes,
  type Commit,
  commitsInRange,
  lintCommits,
} from "./lib/lint/commits.ts";

const ROOT = fromFileUrl(new URL("../", import.meta.url));

async function main() {
  const base = Deno.args[0];
  if (!base) {
    console.error("usage: lint-commits <base-ref>   (e.g. origin/main)");
    Deno.exit(2);
  }
  if (base.startsWith("-")) {
    console.error('lint-commits: base ref must not start with "-"');
    Deno.exit(2);
  }
  let types: string[];
  try {
    types = allowedTypes(
      JSON.parse(
        await Deno.readTextFile(`${ROOT}release-please-config.json`),
      ),
    );
  } catch (e) {
    console.error(
      `lint-commits: cannot read release-please-config.json: ${
        (e as Error).message
      }`,
    );
    Deno.exit(2);
  }
  let commits: Commit[];
  try {
    commits = await commitsInRange(base, ROOT);
  } catch (e) {
    console.error(`lint-commits: ${(e as Error).message}`);
    Deno.exit(2);
  }
  const problems = lintCommits(commits, types);
  for (const line of problems) console.error(line);
  console.log(
    `lint-commits: ${commits.length} commit(s) checked against ${base}, ${problems.length} problem(s)`,
  );
  Deno.exit(problems.length > 0 ? 1 : 0);
}

await main();
