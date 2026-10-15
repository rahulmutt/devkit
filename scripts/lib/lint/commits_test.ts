// scripts/lib/lint/commits_test.ts
import { assertEquals, assertRejects } from "@std/assert";
import { fromFileUrl } from "@std/path";
import {
  allowedTypes,
  checkSubject,
  commitsInRange,
  lintCommits,
  parseLog,
} from "./commits.ts";

const TYPES = ["feat", "fix", "docs", "chore", "test", "ci"];

Deno.test("accepts conventional and revert subjects", () => {
  for (
    const s of [
      "feat: add csv export",
      "fix(ci-pipelines): pin checkout",
      "feat(scripts/lib)!: drop legacy flag",
      "docs(specs): add the commits-and-releases skill design",
      "chore(main): release 0.3.0",
      'Revert "feat: add csv export"',
    ]
  ) {
    assertEquals(checkSubject(s, TYPES), null, s);
  }
});

Deno.test("rejects malformed subjects with a reason", () => {
  assertEquals(
    checkSubject("update stuff", TYPES),
    "not `type(scope)!: summary`",
  );
  assertEquals(
    checkSubject("Feat: add x", TYPES),
    "not `type(scope)!: summary`",
  );
  assertEquals(
    checkSubject("feat:add x", TYPES),
    "not `type(scope)!: summary`",
  );
  assertEquals(checkSubject("feat: ", TYPES), "not `type(scope)!: summary`");
  assertEquals(
    checkSubject("fixup! feat: add x", TYPES),
    "not `type(scope)!: summary`",
  );
  assertEquals(
    checkSubject("wip(x): y", TYPES),
    'unknown type "wip" (allowed: feat, fix, docs, chore, test, ci)',
  );
});

Deno.test("lintCommits formats one line per bad commit", () => {
  const problems = lintCommits([
    { sha: "0123456789abcdef", subject: "feat: fine" },
    { sha: "fedcba9876543210", subject: "update stuff" },
  ], TYPES);
  assertEquals(problems, [
    "fedcba9 update stuff: not `type(scope)!: summary`",
  ]);
});

Deno.test("parseLog splits sha and subject on the first tab", () => {
  assertEquals(parseLog("abc\tfeat: a\tb\ndef\tfix: c\n"), [
    { sha: "abc", subject: "feat: a\tb" },
    { sha: "def", subject: "fix: c" },
  ]);
});

Deno.test("allowedTypes reads the generated release-please config", async () => {
  const path = fromFileUrl(
    new URL("../../../release-please-config.json", import.meta.url),
  );
  const types = allowedTypes(JSON.parse(await Deno.readTextFile(path)));
  for (const t of ["feat", "fix", "docs", "chore", "test", "ci"]) {
    assertEquals(types.includes(t), true, t);
  }
});

async function git(cwd: string, ...args: string[]): Promise<string> {
  const { code, stdout, stderr } = await new Deno.Command("git", {
    args: [
      "-c",
      "user.name=t",
      "-c",
      "user.email=t@example.com",
      "-c",
      "commit.gpgsign=false",
      ...args,
    ],
    cwd,
  }).output();
  if (code !== 0) throw new Error(new TextDecoder().decode(stderr));
  return new TextDecoder().decode(stdout).trim();
}

async function repoWithBranch(): Promise<string> {
  const dir = await Deno.makeTempDir();
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

Deno.test("commitsInRange skips merge commits", async () => {
  const dir = await repoWithBranch();
  try {
    const subjects = (await commitsInRange("main", dir)).map((c) => c.subject)
      .sort();
    assertEquals(subjects, ["feat: side work", "update stuff"]);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("commitsInRange returns nothing for an empty range", async () => {
  const dir = await repoWithBranch();
  try {
    assertEquals(await commitsInRange("topic", dir), []);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("commitsInRange throws on an unknown base", async () => {
  const dir = await repoWithBranch();
  try {
    await assertRejects(
      () => commitsInRange("origin/nope", dir),
      Error,
      "git log origin/nope..HEAD failed",
    );
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
