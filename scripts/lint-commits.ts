// scripts/lint-commits.ts
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  allowedTypes,
  type Commit,
  commitsInRange,
  lintCommits,
} from "./lib/lint/commits.ts";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

async function main() {
  const base = process.argv[2];
  if (!base) {
    console.error("usage: lint-commits <base-ref>   (e.g. origin/main)");
    process.exit(2);
  }
  if (base.startsWith("-")) {
    console.error('lint-commits: base ref must not start with "-"');
    process.exit(2);
  }
  let types: string[];
  try {
    types = allowedTypes(
      JSON.parse(
        await readFile(`${ROOT}release-please-config.json`, "utf8"),
      ),
    );
  } catch (e) {
    console.error(
      `lint-commits: cannot read release-please-config.json: ${
        (e as Error).message
      }`,
    );
    process.exit(2);
  }
  let commits: Commit[];
  try {
    commits = await commitsInRange(base, ROOT);
  } catch (e) {
    console.error(`lint-commits: ${(e as Error).message}`);
    process.exit(2);
  }
  const problems = lintCommits(commits, types);
  for (const line of problems) console.error(line);
  console.log(
    `lint-commits: ${commits.length} commit(s) checked against ${base}, ${problems.length} problem(s)`,
  );
  process.exit(problems.length > 0 ? 1 : 0);
}

await main();
