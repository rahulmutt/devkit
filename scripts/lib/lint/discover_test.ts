import { assertEquals } from "@std/assert";
import { discoverSkills, parseFrontmatter } from "./discover.ts";

Deno.test("parseFrontmatter reads name, description, and body", () => {
  const src =
    "---\nname: foo\ndescription: Use when testing.\n---\n# Body\ntext\n";
  const fm = parseFrontmatter(src);
  assertEquals(fm.hasFrontmatter, true);
  assertEquals(fm.name, "foo");
  assertEquals(fm.description, "Use when testing.");
  assertEquals(fm.body.includes("# Body"), true);
});

Deno.test("parseFrontmatter flags a file with no frontmatter", () => {
  const fm = parseFrontmatter("# Just a heading\n");
  assertEquals(fm.hasFrontmatter, false);
  assertEquals(fm.name, "");
  assertEquals(fm.description, "");
});

Deno.test("discoverSkills finds skills, parses them, lists reference files", async () => {
  const dir = await Deno.makeTempDir();
  await Deno.mkdir(`${dir}/alpha/references`, { recursive: true });
  await Deno.writeTextFile(
    `${dir}/alpha/SKILL.md`,
    "---\nname: alpha\ndescription: Use when alpha.\n---\nsee references/x.md\n",
  );
  await Deno.writeTextFile(`${dir}/alpha/references/x.md`, "x\n");
  await Deno.mkdir(`${dir}/not-a-skill`, { recursive: true });

  const records = await discoverSkills(dir);
  assertEquals(records.length, 1);
  assertEquals(records[0].name, "alpha");
  assertEquals(records[0].dir, "alpha");
  assertEquals(records[0].description, "Use when alpha.");
  assertEquals(records[0].referenceFiles, ["x.md"]);
});
