import { dirname, join } from "jsr:@std/path@^1.0.0";
import type { GeneratedFile } from "./types.ts";

const WINDOWS = Deno.build.os === "windows";

export async function writeFiles(
  files: GeneratedFile[],
  root: string,
): Promise<string[]> {
  const written: string[] = [];
  for (const f of files) {
    const full = join(root, f.path);
    await Deno.mkdir(dirname(full), { recursive: true });
    await Deno.writeTextFile(full, f.content);
    if (f.executable && !WINDOWS) await Deno.chmod(full, 0o755);
    written.push(f.path);
  }
  return written;
}

export type CheckResult = { path: string; status: "ok" | "drift" | "missing" };

export async function checkFiles(
  files: GeneratedFile[],
  root: string,
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  for (const f of files) {
    const full = join(root, f.path);
    let actual: string | null = null;
    let mode: number | null = null;
    try {
      actual = await Deno.readTextFile(full);
      mode = (await Deno.stat(full)).mode;
    } catch {
      actual = null;
    }
    if (actual === null) results.push({ path: f.path, status: "missing" });
    else if (actual !== f.content) {
      results.push({ path: f.path, status: "drift" });
    } else if (
      f.executable && !WINDOWS && mode !== null && (mode & 0o111) === 0
    ) {
      results.push({ path: f.path, status: "drift" });
    } else results.push({ path: f.path, status: "ok" });
  }
  return results;
}
