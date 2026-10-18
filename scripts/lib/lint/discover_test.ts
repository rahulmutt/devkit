import { expect, test } from "bun:test";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { discoverSkills, parseFrontmatter } from "./discover.ts";

test("parseFrontmatter reads name, description, and body", () => {
  const src =
    "---\nname: foo\ndescription: Use when testing.\n---\n# Body\ntext\n";
  const fm = parseFrontmatter(src);
  expect(fm.hasFrontmatter).toEqual(true);
  expect(fm.name).toEqual("foo");
  expect(fm.description).toEqual("Use when testing.");
  expect(fm.body.includes("# Body")).toEqual(true);
});

test("parseFrontmatter flags a file with no frontmatter", () => {
  const fm = parseFrontmatter("# Just a heading\n");
  expect(fm.hasFrontmatter).toEqual(false);
  expect(fm.name).toEqual("");
  expect(fm.description).toEqual("");
});

test("discoverSkills finds skills, parses them, lists reference files", async () => {
  const dir = await mkdtemp(join(tmpdir(), "devkit-"));
  await mkdir(`${dir}/alpha/references`, { recursive: true });
  await writeFile(
    `${dir}/alpha/SKILL.md`,
    "---\nname: alpha\ndescription: Use when alpha.\n---\nsee references/x.md\n",
  );
  await writeFile(`${dir}/alpha/references/x.md`, "x\n");
  await mkdir(`${dir}/not-a-skill`, { recursive: true });

  const records = await discoverSkills(dir);
  expect(records.length).toEqual(1);
  expect(records[0].name).toEqual("alpha");
  expect(records[0].dir).toEqual("alpha");
  expect(records[0].description).toEqual("Use when alpha.");
  expect(records[0].referenceFiles).toEqual(["x.md"]);
});

test("discoverSkills rethrows a non-NotFound error reading SKILL.md", async () => {
  const dir = await mkdtemp(join(tmpdir(), "devkit-"));
  // SKILL.md present but a directory — readFile fails with a non-NotFound
  // error, which must propagate rather than silently drop the skill.
  await mkdir(`${dir}/alpha/SKILL.md`, { recursive: true });
  await expect(discoverSkills(dir)).rejects.toThrow();
});

test("discoverSkills rethrows a non-NotFound error listing references", async () => {
  const dir = await mkdtemp(join(tmpdir(), "devkit-"));
  await mkdir(`${dir}/alpha`, { recursive: true });
  await writeFile(
    `${dir}/alpha/SKILL.md`,
    "---\nname: alpha\ndescription: Use when alpha.\n---\nbody\n",
  );
  // references present but a file, not a directory — readdir fails with a
  // non-NotFound error, which must propagate rather than be swallowed.
  await writeFile(`${dir}/alpha/references`, "not a dir\n");
  await expect(discoverSkills(dir)).rejects.toThrow();
});
