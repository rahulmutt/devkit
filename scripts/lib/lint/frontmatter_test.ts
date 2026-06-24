import { assertEquals } from "@std/assert";
import { checkFrontmatter } from "./frontmatter.ts";
import type { SkillRecord } from "./types.ts";

function rec(over: Partial<SkillRecord>): SkillRecord {
  return {
    name: "alpha",
    dir: "alpha",
    description: "Use when alpha.",
    hasFrontmatter: true,
    body: "",
    referenceFiles: [],
    ...over,
  };
}

Deno.test("clean record yields no findings", () => {
  assertEquals(checkFrontmatter([rec({})]), []);
});

Deno.test("missing frontmatter is one error", () => {
  const f = checkFrontmatter([
    rec({ hasFrontmatter: false, name: "", description: "" }),
  ]);
  assertEquals(f.length, 1);
  assertEquals(f[0].level, "error");
});

Deno.test("name not matching directory is an error", () => {
  const f = checkFrontmatter([rec({ name: "beta", dir: "alpha" })]);
  assertEquals(f.length, 1);
  assertEquals(f[0].level, "error");
});

Deno.test("empty description is an error", () => {
  const f = checkFrontmatter([rec({ description: "" })]);
  assertEquals(f.some((x) => x.level === "error"), true);
});

Deno.test("description not starting with 'Use when' is a warn", () => {
  const f = checkFrontmatter([rec({ description: "Helps with alpha." })]);
  assertEquals(f.length, 1);
  assertEquals(f[0].level, "warn");
});
