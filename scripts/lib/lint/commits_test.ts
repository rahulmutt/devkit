// scripts/lib/lint/commits_test.ts
import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "../exec.ts";
import {
  allowedTypes,
  checkSubject,
  commitsInRange,
  lintCommits,
  parseLog,
} from "./commits.ts";

const TYPES = ["feat", "fix", "docs", "chore", "test", "ci"];

test("accepts conventional and revert subjects", () => {
  for (const s of [
    "feat: add csv export",
    "fix(ci-pipelines): pin checkout",
    "feat(scripts/lib)!: drop legacy flag",
    "docs(specs): add the commits-and-releases skill design",
    "chore(main): release 0.3.0",
    'Revert "feat: add csv export"',
  ]) {
    expect(checkSubject(s, TYPES), s).toEqual(null);
  }
});

test("rejects malformed subjects with a reason", () => {
  expect(checkSubject("update stuff", TYPES)).toEqual(
    "not `type(scope)!: summary`",
  );
  expect(checkSubject("Feat: add x", TYPES)).toEqual(
    "not `type(scope)!: summary`",
  );
  expect(checkSubject("feat:add x", TYPES)).toEqual(
    "not `type(scope)!: summary`",
  );
  expect(checkSubject("feat: ", TYPES)).toEqual("not `type(scope)!: summary`");
  expect(checkSubject("fixup! feat: add x", TYPES)).toEqual(
    "not `type(scope)!: summary`",
  );
  expect(checkSubject("wip(x): y", TYPES)).toEqual(
    'unknown type "wip" (allowed: feat, fix, docs, chore, test, ci)',
  );
});

test("lintCommits formats one line per bad commit", () => {
  const problems = lintCommits(
    [
      { sha: "0123456789abcdef", subject: "feat: fine" },
      { sha: "fedcba9876543210", subject: "update stuff" },
    ],
    TYPES,
  );
  expect(problems).toEqual([
    "fedcba9 update stuff: not `type(scope)!: summary`",
  ]);
});

test("parseLog splits sha and subject on the first tab", () => {
  expect(parseLog("abc\tfeat: a\tb\ndef\tfix: c\n")).toEqual([
    { sha: "abc", subject: "feat: a\tb" },
    { sha: "def", subject: "fix: c" },
  ]);
});

test("allowedTypes reads the generated release-please config", async () => {
  const path = fileURLToPath(
    new URL("../../../release-please-config.json", import.meta.url),
  );
  const types = allowedTypes(JSON.parse(await readFile(path, "utf8")));
  for (const t of ["feat", "fix", "docs", "chore", "test", "ci"]) {
    expect(types.includes(t), t).toEqual(true);
  }
});

async function git(cwd: string, ...args: string[]): Promise<string> {
  const { code, stdout, stderr } = await exec(
    "git",
    [
      "-c",
      "user.name=t",
      "-c",
      "user.email=t@example.com",
      "-c",
      "commit.gpgsign=false",
      ...args,
    ],
    cwd,
  );
  if (code !== 0) throw new Error(stderr);
  return stdout.trim();
}

async function repoWithBranch(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "devkit-"));
  await git(dir, "init", "-q", "-b", "main");
  await git(dir, "commit", "-q", "--allow-empty", "-m", "chore: base");
  await git(dir, "switch", "-q", "-c", "side");
  await git(dir, "commit", "-q", "--allow-empty", "-m", "feat: side work");
  await git(dir, "switch", "-q", "main");
  await git(dir, "commit", "-q", "--allow-empty", "-m", "fix: main work");
  await git(dir, "switch", "-q", "-c", "topic");
  await git(dir, "merge", "-q", "--no-ff", "-m", "Merge branch 'side'", "side");
  await git(dir, "commit", "-q", "--allow-empty", "-m", "update stuff");
  return dir;
}

test("commitsInRange skips merge commits", async () => {
  const dir = await repoWithBranch();
  try {
    const subjects = (await commitsInRange("main", dir))
      .map((c) => c.subject)
      .sort();
    expect(subjects).toEqual(["feat: side work", "update stuff"]);
  } finally {
    await rm(dir, { recursive: true });
  }
});

test("commitsInRange returns nothing for an empty range", async () => {
  const dir = await repoWithBranch();
  try {
    expect(await commitsInRange("topic", dir)).toEqual([]);
  } finally {
    await rm(dir, { recursive: true });
  }
});

test("commitsInRange throws on an unknown base", async () => {
  const dir = await repoWithBranch();
  try {
    await expect(commitsInRange("origin/nope", dir)).rejects.toThrow(
      "git log origin/nope..HEAD failed",
    );
  } finally {
    await rm(dir, { recursive: true });
  }
});
