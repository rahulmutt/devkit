import { expect, test } from "bun:test";
import { buildReport } from "./report.ts";
import type { Finding } from "./types.ts";

test("clean run passes with exit 0", () => {
  const r = buildReport([], 4);
  expect(r.exitCode).toEqual(0);
  expect(r.header).toEqual("skill-lint: 4 skills checked");
  expect(r.summary).toEqual("✓ all checks passed");
  expect(r.lines).toEqual([]);
});

test("any error sets exit 1 and summary counts", () => {
  const findings: Finding[] = [
    { level: "warn", skill: "b", message: "warn msg" },
    { level: "error", skill: "a", message: "err msg" },
  ];
  const r = buildReport(findings, 2);
  expect(r.exitCode).toEqual(1);
  expect(r.summary).toEqual("✗ 1 error, 1 warn");
  expect(r.lines.length).toEqual(2);
  expect(r.lines[0].includes("a")).toEqual(true); // sorted by skill: a before b
});

test("only warnings keep exit 0", () => {
  const r = buildReport([{ level: "warn", skill: "a", message: "w" }], 1);
  expect(r.exitCode).toEqual(0);
  expect(r.summary).toEqual("✗ 0 errors, 1 warn");
});
