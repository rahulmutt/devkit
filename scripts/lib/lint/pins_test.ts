import { assertEquals } from "@std/assert";
import { fromFileUrl, join } from "@std/path";
import { pinDrift, type PinSource } from "./pins.ts";

const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);

Deno.test("matching pins and tag references are not drift", () => {
  assertEquals(
    pinDrift([
      { path: "x.md", text: `uses: actions/checkout@${SHA_A} # v7.0.1` },
      {
        path: "y.yml",
        text:
          `- uses: actions/checkout@${SHA_A} # v7.0.1\n- uses: jdx/mise-action@v5`,
      },
    ]),
    [],
  );
});

Deno.test("the same action pinned to a different sha or version is drift", () => {
  const problems = pinDrift([
    { path: "x.md", text: `actions/checkout@${SHA_A} # v7.0.1` },
    { path: "y.yml", text: `actions/checkout@${SHA_B} # v7.0.2` },
    {
      path: "z.md",
      text:
        `jdx/mise-action@${SHA_A} # v5.1.1 and jdx/mise-action@${SHA_A} # v5.1.2`,
    },
  ]);
  assertEquals(problems.length, 2);
  assertEquals(
    problems[0].startsWith("actions/checkout pinned differently"),
    true,
  );
  assertEquals(
    problems[1].startsWith("jdx/mise-action pinned differently"),
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
    for await (const e of Deno.readDir(dir)) {
      const p = join(dir, e.name);
      if (e.isDirectory && recurse) out.push(...await collect(p, ext, recurse));
      else if (e.isFile && p.endsWith(ext)) {
        out.push({ path: p, text: await Deno.readTextFile(p) });
      }
    }
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) throw e;
  }
  return out;
}

Deno.test("action pins in skill docs and workflows agree", async () => {
  const root = fromFileUrl(new URL("../../../", import.meta.url));
  const sources = [
    ...await collect(join(root, "skills"), ".md", true),
    ...await collect(join(root, ".github/workflows"), ".yml", false),
  ];
  assertEquals(
    sources.some((s) => s.path.includes(".github/workflows")),
    true,
    "expected at least one workflow file",
  );
  assertEquals(pinDrift(sources), []);
});
