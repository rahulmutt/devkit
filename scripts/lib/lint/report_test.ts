import { assertEquals } from "@std/assert";
import { buildReport } from "./report.ts";
import type { Finding } from "./types.ts";

Deno.test("clean run passes with exit 0", () => {
  const r = buildReport([], 4);
  assertEquals(r.exitCode, 0);
  assertEquals(r.header, "skill-lint: 4 skills checked");
  assertEquals(r.summary, "✓ all checks passed");
  assertEquals(r.lines, []);
});

Deno.test("any error sets exit 1 and summary counts", () => {
  const findings: Finding[] = [
    { level: "warn", skill: "b", message: "warn msg" },
    { level: "error", skill: "a", message: "err msg" },
  ];
  const r = buildReport(findings, 2);
  assertEquals(r.exitCode, 1);
  assertEquals(r.summary, "✗ 1 error, 1 warn");
  assertEquals(r.lines.length, 2);
  assertEquals(r.lines[0].includes("a"), true); // sorted by skill: a before b
});

Deno.test("only warnings keep exit 0", () => {
  const r = buildReport([{ level: "warn", skill: "a", message: "w" }], 1);
  assertEquals(r.exitCode, 0);
  assertEquals(r.summary, "✗ 0 errors, 1 warn");
});
