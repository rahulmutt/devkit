import { assertEquals } from "@std/assert";
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

Deno.test("short description is clean", () => {
  assertEquals(checkBudget([withDesc("x".repeat(400))]), []);
});

Deno.test("over 500 is a warn", () => {
  const f = checkBudget([withDesc("x".repeat(600))]);
  assertEquals(f.length, 1);
  assertEquals(f[0].level, "warn");
});

Deno.test("over 1024 is an error", () => {
  const f = checkBudget([withDesc("x".repeat(1100))]);
  assertEquals(f.length, 1);
  assertEquals(f[0].level, "error");
});
