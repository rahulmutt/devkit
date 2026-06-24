import { assertEquals } from "@std/assert";
import { checkFiles, writeFiles } from "./files.ts";

Deno.test("checkFiles reports missing then ok after write", async () => {
  const dir = await Deno.makeTempDir();
  const files = [{ path: "a/b.txt", content: "hello\n" }];
  const before = await checkFiles(files, dir);
  assertEquals(before[0].status, "missing");

  await writeFiles(files, dir);
  const after = await checkFiles(files, dir);
  assertEquals(after[0].status, "ok");

  await Deno.writeTextFile(`${dir}/a/b.txt`, "changed\n");
  const drifted = await checkFiles(files, dir);
  assertEquals(drifted[0].status, "drift");
});
