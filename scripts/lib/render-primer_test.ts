import { assertEquals, assertStringIncludes, assertThrows } from "@std/assert";
import {
  renderPrimer,
  renderSkillIndex,
  spliceRegion,
} from "./render-primer.ts";
import type { SkillRecord } from "./lint/types.ts";

const SKILLS = new URL("../../skills", import.meta.url).pathname;

function record(dir: string, description: string): SkillRecord {
  return {
    name: dir,
    dir,
    description,
    hasFrontmatter: true,
    body: "",
    referenceFiles: [],
  };
}

Deno.test("skill index lists every skill but the bootstrap, from frontmatter", () => {
  const index = renderSkillIndex(
    [
      record("alpha", "Use when doing alpha things."),
      record("using-devkit", "Use when starting."),
      record("beta", "Use when doing beta things."),
    ],
    "using-devkit",
  );
  assertEquals(
    index,
    "- **alpha** — Use when doing alpha things.\n" +
      "- **beta** — Use when doing beta things.\n",
  );
});

Deno.test("spliceRegion replaces only the text between the markers", () => {
  const src =
    "head\n<!-- BEGIN GENERATED: x -->\nold\n<!-- END GENERATED: x -->\ntail\n";
  assertEquals(
    spliceRegion(src, "x", "new\n"),
    "head\n<!-- BEGIN GENERATED: x -->\nnew\n<!-- END GENERATED: x -->\ntail\n",
  );
});

Deno.test("spliceRegion fails loudly when the markers are missing", () => {
  assertThrows(() => spliceRegion("no markers here", "x", "new\n"));
});

Deno.test("the real primer is regenerated with every skill's description", async () => {
  const [file] = await renderPrimer(SKILLS, "using-devkit");
  assertEquals(file.path, "skills/using-devkit/SKILL.md");
  assertStringIncludes(file.content, "- **developer-environment** — Use when");
});
