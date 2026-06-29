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

Deno.test("writeFiles sets the execute bit when executable is true", async () => {
  if (Deno.build.os === "windows") return;
  const dir = await Deno.makeTempDir();
  const files = [{ path: "bin/run.cmd", content: "echo hi\n", executable: true }];
  await writeFiles(files, dir);
  const mode = (await Deno.stat(`${dir}/bin/run.cmd`)).mode!;
  assertEquals(mode & 0o111, 0o111);
});

Deno.test("checkFiles reports drift when the execute bit is missing", async () => {
  if (Deno.build.os === "windows") return;
  const dir = await Deno.makeTempDir();
  const files = [{ path: "bin/run.cmd", content: "echo hi\n", executable: true }];
  await writeFiles(files, dir);
  assertEquals((await checkFiles(files, dir))[0].status, "ok");

  await Deno.chmod(`${dir}/bin/run.cmd`, 0o644);
  assertEquals((await checkFiles(files, dir))[0].status, "drift");
});
