import { loadConfig } from "./lib/config.ts";
import { renderAll } from "./lib/render.ts";
import { checkFiles, writeFiles } from "./lib/files.ts";

const ROOT = new URL("../", import.meta.url).pathname;

async function main() {
  const check = Deno.args.includes("--check");
  const config = loadConfig();
  const files = renderAll(config);

  if (check) {
    const results = await checkFiles(files, ROOT);
    const bad = results.filter((r) => r.status !== "ok");
    if (bad.length === 0) {
      console.log(`✓ all ${results.length} generated files in sync`);
      return;
    }
    console.error("✗ generated files out of sync:");
    for (const r of bad) console.error(`  ${r.status.padEnd(8)} ${r.path}`);
    console.error("\nRun `deno task generate` to regenerate.");
    Deno.exit(1);
  }

  const written = await writeFiles(files, ROOT);
  console.log(`✓ wrote ${written.length} files`);
}

await main();
