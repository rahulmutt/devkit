import { expect, test } from "bun:test";
import { checkLinks, referencedFiles } from "./links.ts";
import type { SkillRecord } from "./types.ts";

function rec(over: Partial<SkillRecord>): SkillRecord {
  return {
    name: "a",
    dir: "a",
    description: "Use when a.",
    hasFrontmatter: true,
    body: "",
    referenceFiles: [],
    ...over,
  };
}

test("referencedFiles captures markdown links, prose, and non-md extensions", () => {
  const body =
    "See [`references/x.md`](references/x.md) and `references/mise.toml` and references/devenv.nix.";
  expect(referencedFiles(body)).toEqual(["devenv.nix", "mise.toml", "x.md"]);
});

test("a mentioned-but-missing reference is an error", () => {
  const f = checkLinks([
    rec({ body: "see references/gone.md", referenceFiles: [] }),
  ]);
  expect(f.length).toEqual(1);
  expect(f[0].level).toEqual("error");
});

test("an unmentioned reference file is a warn (orphan)", () => {
  const f = checkLinks([
    rec({ body: "no links here", referenceFiles: ["orphan.md"] }),
  ]);
  expect(f.length).toEqual(1);
  expect(f[0].level).toEqual("warn");
});

test("all references mentioned and present is clean", () => {
  const f = checkLinks([
    rec({ body: "see references/x.md", referenceFiles: ["x.md"] }),
  ]);
  expect(f).toEqual([]);
});
