import { assertEquals } from "@std/assert";
import { buildReport } from "./report.ts";
import type { ManifestViolation } from "./types.ts";

Deno.test("buildReport: clean run exits 0 with conform summary", () => {
  const report = buildReport([], 7);
  assertEquals(report.lines, []);
  assertEquals(report.exitCode, 0);
  assertEquals(report.summary, "✓ all 7 manifests conform");
  assertEquals(report.header, "manifest-validate: 7 manifests checked");
});

Deno.test("buildReport: violations exit 1 and format as path + pointer", () => {
  const violations: ManifestViolation[] = [
    { path: "package.json", instancePath: "/version", message: "bad semver" },
    {
      path: ".codex-plugin/plugin.json",
      instancePath: "",
      message: "missing field",
    },
  ];
  const report = buildReport(violations, 7);
  assertEquals(report.exitCode, 1);
  assertEquals(report.summary, "✗ 2 violations");
  // sorted by path, then instancePath
  assertEquals(report.lines, [
    "  .codex-plugin/plugin.json — missing field",
    "  package.json /version — bad semver",
  ]);
});

Deno.test("buildReport: single violation is singular", () => {
  const report = buildReport(
    [{ path: "package.json", instancePath: "", message: "x" }],
    7,
  );
  assertEquals(report.summary, "✗ 1 violation");
});
