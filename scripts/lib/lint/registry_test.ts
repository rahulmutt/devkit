import { assertEquals } from "@std/assert";
import { checkRegistry, stemFor } from "./registry.ts";
import type { SkillRecord } from "./types.ts";

function skill(dir: string): SkillRecord {
  return {
    name: dir,
    dir,
    description: "Use when " + dir,
    hasFrontmatter: true,
    body: "",
    referenceFiles: [],
  };
}

const PRIMER = (body: string, refs: string[]): SkillRecord => ({
  name: "using-devkit",
  dir: "using-devkit",
  description: "Use when starting.",
  hasFrontmatter: true,
  body,
  referenceFiles: refs,
});

Deno.test("stemFor maps claude specially", () => {
  assertEquals(stemFor("claude"), "claude-code-tools");
  assertEquals(stemFor("codex"), "codex-tools");
});

Deno.test("fully wired registry is clean", () => {
  const records = [skill("using-devkit"), skill("alpha")];
  const body =
    "**alpha** does things. references/claude-code-tools.md references/codex-tools.md";
  const primer = PRIMER(body, ["claude-code-tools.md", "codex-tools.md"]);
  const f = checkRegistry(records, primer, ["claude", "codex"], "using-devkit");
  assertEquals(f, []);
});

Deno.test("skill absent from primer is an error", () => {
  const records = [skill("using-devkit"), skill("alpha")];
  const primer = PRIMER("references/claude-code-tools.md", [
    "claude-code-tools.md",
  ]);
  const f = checkRegistry(records, primer, ["claude"], "using-devkit");
  assertEquals(
    f.some((x) => x.level === "error" && x.message.includes("alpha")),
    true,
  );
});

Deno.test("harness missing its tool-ref file is an error", () => {
  const records = [skill("using-devkit")];
  const primer = PRIMER("references/codex-tools.md", []);
  const f = checkRegistry(records, primer, ["codex"], "using-devkit");
  assertEquals(
    f.some((x) => x.level === "error" && x.message.includes("codex-tools.md")),
    true,
  );
});

Deno.test("stale tool-ref for an unconfigured harness is a warn", () => {
  const records = [skill("using-devkit")];
  const body = "references/claude-code-tools.md references/codex-tools.md";
  const primer = PRIMER(body, ["claude-code-tools.md", "codex-tools.md"]);
  const f = checkRegistry(records, primer, ["claude"], "using-devkit");
  assertEquals(
    f.some((x) => x.level === "warn" && x.message.includes("codex-tools.md")),
    true,
  );
});
