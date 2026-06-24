import { assertEquals } from "@std/assert";
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

Deno.test("referencedFiles captures markdown links, prose, and non-md extensions", () => {
  const body =
    "See [`references/x.md`](references/x.md) and `references/mise.toml` and references/devenv.nix.";
  assertEquals(referencedFiles(body), ["devenv.nix", "mise.toml", "x.md"]);
});

Deno.test("a mentioned-but-missing reference is an error", () => {
  const f = checkLinks([
    rec({ body: "see references/gone.md", referenceFiles: [] }),
  ]);
  assertEquals(f.length, 1);
  assertEquals(f[0].level, "error");
});

Deno.test("an unmentioned reference file is a warn (orphan)", () => {
  const f = checkLinks([
    rec({ body: "no links here", referenceFiles: ["orphan.md"] }),
  ]);
  assertEquals(f.length, 1);
  assertEquals(f[0].level, "warn");
});

Deno.test("all references mentioned and present is clean", () => {
  const f = checkLinks([
    rec({ body: "see references/x.md", referenceFiles: ["x.md"] }),
  ]);
  assertEquals(f, []);
});
