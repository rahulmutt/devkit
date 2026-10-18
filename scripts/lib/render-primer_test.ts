import { expect, test } from "bun:test";
import { join } from "node:path";
import * as prettier from "prettier";
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

test("skill index lists every skill but the bootstrap, from frontmatter", () => {
  const index = renderSkillIndex(
    [
      record("alpha", "Use when doing alpha things."),
      record("using-devkit", "Use when starting."),
      record("beta", "Use when doing beta things."),
    ],
    "using-devkit",
  );
  expect(index).toEqual(
    "- **alpha** — Use when doing alpha things.\n" +
      "- **beta** — Use when doing beta things.\n",
  );
});

test("spliceRegion replaces only the text between the markers", () => {
  const src =
    "head\n<!-- BEGIN GENERATED: x -->\nold\n<!-- END GENERATED: x -->\ntail\n";
  expect(spliceRegion(src, "x", "new\n")).toEqual(
    "head\n<!-- BEGIN GENERATED: x -->\nnew\n<!-- END GENERATED: x -->\ntail\n",
  );
});

test("spliceRegion fails loudly when the markers are missing", () => {
  expect(() => spliceRegion("no markers here", "x", "new\n")).toThrow();
});

test("the real primer is regenerated with every skill's description", async () => {
  const [file] = await renderPrimer(SKILLS, "using-devkit");
  expect(file.path).toEqual("skills/using-devkit/SKILL.md");
  expect(file.content).toContain("- **developer-environment** — Use when");
});

test("renderPrimer output is a Prettier fixed point", async () => {
  const [file] = await renderPrimer(SKILLS, "using-devkit");
  const filepath = join(SKILLS, "using-devkit", "SKILL.md");
  const options = { ...(await prettier.resolveConfig(filepath)), filepath };
  expect(await prettier.format(file.content, options)).toBe(file.content);
});
