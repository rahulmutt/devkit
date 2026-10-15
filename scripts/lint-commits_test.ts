// scripts/lint-commits_test.ts
import { assertEquals, assertMatch, assertStringIncludes } from "@std/assert";
import { fromFileUrl } from "@std/path";

const SCRIPT = fromFileUrl(new URL("./lint-commits.ts", import.meta.url));

async function run(...args: string[]) {
  const { code, stdout, stderr } = await new Deno.Command(Deno.execPath(), {
    args: ["run", "--allow-read", "--allow-run=git", SCRIPT, ...args],
  }).output();
  const dec = new TextDecoder();
  return { code, stdout: dec.decode(stdout), stderr: dec.decode(stderr) };
}

Deno.test("lint-commits without a base exits 2 with usage", async () => {
  const r = await run();
  assertEquals(r.code, 2);
  assertStringIncludes(r.stderr, "usage: lint-commits");
});

Deno.test("lint-commits with an unknown base exits 2 without a stack trace", async () => {
  const r = await run("origin/nope");
  assertEquals(r.code, 2);
  assertMatch(r.stderr, /^lint-commits: git log origin\/nope\.\.HEAD failed/);
  assertEquals(r.stderr.includes("    at "), false);
});

Deno.test("lint-commits on an empty range exits 0 and says so", async () => {
  const r = await run("HEAD");
  assertEquals(r.code, 0);
  assertStringIncludes(r.stdout, "0 commit(s) checked");
});
