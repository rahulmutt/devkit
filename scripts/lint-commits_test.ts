// scripts/lint-commits_test.ts
import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import { exec } from "./lib/exec.ts";

const SCRIPT = fileURLToPath(new URL("./lint-commits.ts", import.meta.url));

async function run(...args: string[]) {
  return await exec(process.execPath, [SCRIPT, ...args]);
}

test("lint-commits without a base exits 2 with usage", async () => {
  const r = await run();
  expect(r.code).toEqual(2);
  expect(r.stderr).toContain("usage: lint-commits");
});

test("lint-commits with an unknown base exits 2 without a stack trace", async () => {
  const r = await run("origin/nope");
  expect(r.code).toEqual(2);
  expect(r.stderr).toMatch(/^lint-commits: git log origin\/nope\.\.HEAD failed/);
  expect(r.stderr.includes("    at ")).toEqual(false);
});

test("lint-commits on an empty range exits 0 and says so", async () => {
  const r = await run("HEAD");
  expect(r.code).toEqual(0);
  expect(r.stdout).toContain("0 commit(s) checked");
});

test("lint-commits rejects a base that looks like an option", async () => {
  const r = await run("--output=/tmp/x");
  expect(r.code).toEqual(2);
  expect(r.stderr).toMatch(/^lint-commits: base ref must not start with "-"/);
  expect(r.stderr.includes("    at ")).toEqual(false);
});
