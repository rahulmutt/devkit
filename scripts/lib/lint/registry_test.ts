import { expect, test } from "bun:test";
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

test("stemFor maps claude specially", () => {
  expect(stemFor("claude")).toEqual("claude-code-tools");
  expect(stemFor("codex")).toEqual("codex-tools");
});

test("fully wired registry is clean", () => {
  const records = [skill("using-devkit"), skill("alpha")];
  const body =
    "**alpha** does things. references/claude-code-tools.md references/codex-tools.md";
  const primer = PRIMER(body, ["claude-code-tools.md", "codex-tools.md"]);
  const f = checkRegistry(records, primer, ["claude", "codex"], "using-devkit");
  expect(f).toEqual([]);
});

test("skill absent from primer is an error", () => {
  const records = [skill("using-devkit"), skill("alpha")];
  const primer = PRIMER("references/claude-code-tools.md", [
    "claude-code-tools.md",
  ]);
  const f = checkRegistry(records, primer, ["claude"], "using-devkit");
  expect(f.some((x) => x.level === "error" && x.message.includes("alpha"))).toEqual(true);
});

test("harness missing its tool-ref file is an error", () => {
  const records = [skill("using-devkit")];
  const primer = PRIMER("references/codex-tools.md", []);
  const f = checkRegistry(records, primer, ["codex"], "using-devkit");
  expect(f.some((x) => x.level === "error" && x.message.includes("codex-tools.md"))).toEqual(true);
});

test("stale tool-ref for an unconfigured harness is a warn", () => {
  const records = [skill("using-devkit")];
  const body = "references/claude-code-tools.md references/codex-tools.md";
  const primer = PRIMER(body, ["claude-code-tools.md", "codex-tools.md"]);
  const f = checkRegistry(records, primer, ["claude"], "using-devkit");
  expect(f.some((x) => x.level === "warn" && x.message.includes("codex-tools.md"))).toEqual(true);
});
