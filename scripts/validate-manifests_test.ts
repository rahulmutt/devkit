import { assertEquals } from "@std/assert";
import { buildValidationReport } from "./validate-manifests.ts";

Deno.test("validate-manifests: real config produces a clean, exit-0 report", async () => {
  const report = await buildValidationReport();
  assertEquals(report.exitCode, 0);
  assertEquals(report.summary, "✓ all 10 manifests conform");
  assertEquals(report.lines, []);
});
