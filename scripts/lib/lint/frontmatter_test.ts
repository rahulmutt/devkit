import { expect, test } from "bun:test";
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

test("clean record yields no findings", () => {
  expect(checkFrontmatter([rec({})])).toEqual([]);
});

test("missing frontmatter is one error", () => {
  const f = checkFrontmatter([
    rec({ hasFrontmatter: false, name: "", description: "" }),
  ]);
  expect(f.length).toEqual(1);
  expect(f[0].level).toEqual("error");
});

test("name not matching directory is an error", () => {
  const f = checkFrontmatter([rec({ name: "beta", dir: "alpha" })]);
  expect(f.length).toEqual(1);
  expect(f[0].level).toEqual("error");
});

test("empty description is an error", () => {
  const f = checkFrontmatter([rec({ description: "" })]);
  expect(f.some((x) => x.level === "error")).toEqual(true);
});

test("description not starting with 'Use when' is a warn", () => {
  const f = checkFrontmatter([rec({ description: "Helps with alpha." })]);
  expect(f.length).toEqual(1);
  expect(f[0].level).toEqual("warn");
});
