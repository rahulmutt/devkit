import { dirname, join } from "jsr:@std/path@^1.0.0";
import type { GeneratedFile } from "./types.ts";

export async function writeFiles(
  files: GeneratedFile[],
  root: string,
): Promise<string[]> {
  const written: string[] = [];
  for (const f of files) {
    const full = join(root, f.path);
    await Deno.mkdir(dirname(full), { recursive: true });
    await Deno.writeTextFile(full, f.content);
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
    try {
      actual = await Deno.readTextFile(full);
    } catch {
      actual = null;
    }
    if (actual === null) results.push({ path: f.path, status: "missing" });
    else if (actual !== f.content) {
      results.push({ path: f.path, status: "drift" });
    } else results.push({ path: f.path, status: "ok" });
  }
  return results;
}
