import { expect, test } from "bun:test";
import { checkBudget } from "./budget.ts";
import type { SkillRecord } from "./types.ts";

function withDesc(description: string): SkillRecord {
  return {
    name: "a",
    dir: "a",
    description,
    hasFrontmatter: true,
    body: "",
    referenceFiles: [],
  };
}

test("short description is clean", () => {
  expect(checkBudget([withDesc("x".repeat(400))])).toEqual([]);
});

test("over 500 is a warn", () => {
  const f = checkBudget([withDesc("x".repeat(600))]);
  expect(f.length).toEqual(1);
  expect(f[0].level).toEqual("warn");
});

test("over 1024 is an error", () => {
  const f = checkBudget([withDesc("x".repeat(1100))]);
  expect(f.length).toEqual(1);
  expect(f[0].level).toEqual("error");
});
