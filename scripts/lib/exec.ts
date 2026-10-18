import { execFile } from "node:child_process";

export type ExecResult = { code: number; stdout: string; stderr: string };

// Run a command to completion and report its exit code and output as strings.
// A non-zero exit is a result, not an exception; only failing to spawn rejects.
export function exec(
  cmd: string,
  args: string[],
  cwd?: string,
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd, encoding: "utf8" }, (err, stdout, stderr) => {
      if (err && typeof err.code !== "number") reject(err);
      else resolve({ code: err ? (err.code as number) : 0, stdout, stderr });
    });
  });
}
