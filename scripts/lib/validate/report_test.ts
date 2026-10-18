import { expect, test } from "bun:test";
import { buildReport } from "./report.ts";
import type { ManifestViolation } from "./types.ts";

test("buildReport: clean run exits 0 with conform summary", () => {
  const report = buildReport([], 7);
  expect(report.lines).toEqual([]);
  expect(report.exitCode).toEqual(0);
  expect(report.summary).toEqual("✓ all 7 manifests conform");
  expect(report.header).toEqual("manifest-validate: 7 manifests checked");
});

test("buildReport: violations exit 1 and format as path + pointer", () => {
  const violations: ManifestViolation[] = [
    { path: "package.json", instancePath: "/version", message: "bad semver" },
    {
      path: ".codex-plugin/plugin.json",
      instancePath: "",
      message: "missing field",
    },
  ];
  const report = buildReport(violations, 7);
  expect(report.exitCode).toEqual(1);
  expect(report.summary).toEqual("✗ 2 violations");
  // sorted by path, then instancePath
  expect(report.lines).toEqual([
    "  .codex-plugin/plugin.json — missing field",
    "  package.json /version — bad semver",
  ]);
});

test("buildReport: single violation is singular", () => {
  const report = buildReport(
    [{ path: "package.json", instancePath: "", message: "x" }],
    7,
  );
  expect(report.summary).toEqual("✗ 1 violation");
});
