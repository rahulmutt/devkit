import { expect, test } from "bun:test";
import { buildValidationReport } from "./validate-manifests.ts";

test("validate-manifests: real config produces a clean, exit-0 report", async () => {
  const report = await buildValidationReport();
  expect(report.exitCode).toEqual(0);
  expect(report.summary).toEqual("✓ all 11 manifests conform");
  expect(report.lines).toEqual([]);
});
