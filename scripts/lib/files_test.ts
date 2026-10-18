import { expect, test } from "bun:test";
import { chmod, mkdtemp, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkFiles, writeFiles } from "./files.ts";

test("checkFiles reports missing then ok after write", async () => {
  const dir = await mkdtemp(join(tmpdir(), "devkit-"));
  const files = [{ path: "a/b.txt", content: "hello\n" }];
  const before = await checkFiles(files, dir);
  expect(before[0].status).toEqual("missing");

  await writeFiles(files, dir);
  const after = await checkFiles(files, dir);
  expect(after[0].status).toEqual("ok");

  await writeFile(`${dir}/a/b.txt`, "changed\n");
  const drifted = await checkFiles(files, dir);
  expect(drifted[0].status).toEqual("drift");
});

test("writeFiles sets the execute bit when executable is true", async () => {
  if (process.platform === "win32") return;
  const dir = await mkdtemp(join(tmpdir(), "devkit-"));
  const files = [
    {
      path: "bin/run.cmd",
      content: "echo hi\n",
      executable: true,
    },
  ];
  await writeFiles(files, dir);
  const mode = (await stat(`${dir}/bin/run.cmd`)).mode!;
  expect(mode & 0o111).toEqual(0o111);
});

test("checkFiles reports drift when the execute bit is missing", async () => {
  if (process.platform === "win32") return;
  const dir = await mkdtemp(join(tmpdir(), "devkit-"));
  const files = [
    {
      path: "bin/run.cmd",
      content: "echo hi\n",
      executable: true,
    },
  ];
  await writeFiles(files, dir);
  expect((await checkFiles(files, dir))[0].status).toEqual("ok");

  await chmod(`${dir}/bin/run.cmd`, 0o644);
  expect((await checkFiles(files, dir))[0].status).toEqual("drift");
});
