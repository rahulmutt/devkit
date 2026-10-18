import { expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { pinDrift, type PinSource } from "./pins.ts";

const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);

test("matching pins and tag references are not drift", () => {
  expect(
    pinDrift([
      { path: "x.md", text: `uses: actions/checkout@${SHA_A} # v7.0.1` },
      {
        path: "y.yml",
        text: `- uses: actions/checkout@${SHA_A} # v7.0.1\n- uses: jdx/mise-action@v5`,
      },
    ]),
  ).toEqual([]);
});

test("the same action pinned to a different sha or version is drift", () => {
  const problems = pinDrift([
    { path: "x.md", text: `actions/checkout@${SHA_A} # v7.0.1` },
    { path: "y.yml", text: `actions/checkout@${SHA_B} # v7.0.2` },
    {
      path: "z.md",
      text: `jdx/mise-action@${SHA_A} # v5.1.1 and jdx/mise-action@${SHA_A} # v5.1.2`,
    },
  ]);
  expect(problems.length).toEqual(2);
  expect(problems[0].startsWith("actions/checkout pinned differently")).toEqual(
    true,
  );
  expect(problems[1].startsWith("jdx/mise-action pinned differently")).toEqual(
    true,
  );
});

async function collect(
  dir: string,
  ext: string,
  recurse: boolean,
): Promise<PinSource[]> {
  const out: PinSource[] = [];
  try {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory() && recurse)
        out.push(...(await collect(p, ext, recurse)));
      else if (e.isFile() && p.endsWith(ext)) {
        out.push({ path: p, text: await readFile(p, "utf8") });
      }
    }
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
  return out;
}

test("action pins in skill docs and workflows agree", async () => {
  const root = fileURLToPath(new URL("../../../", import.meta.url));
  const sources = [
    ...(await collect(join(root, "skills"), ".md", true)),
    ...(await collect(join(root, ".github/workflows"), ".yml", false)),
  ];
  expect(
    sources.some((s) => s.path.includes(".github/workflows")),
    "expected at least one workflow file",
  ).toEqual(true);
  expect(pinDrift(sources)).toEqual([]);
});
