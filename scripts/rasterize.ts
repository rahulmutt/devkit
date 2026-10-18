// Rasterize the source SVG icon to a PNG the harness manifests reference.
// Run with: `mise run rasterize`. Re-run whenever assets/devkit.svg changes.
//
// Uses @resvg/resvg-js (pinned in scripts/package.json and bun.lock), so the PNG
// reproduces from the SVG without any system tool (rsvg-convert/ImageMagick).
import { readFile, writeFile } from "node:fs/promises";
import { Resvg } from "@resvg/resvg-js";

const ROOT = new URL("../", import.meta.url);
const SVG = new URL("assets/devkit.svg", ROOT);
const PNG = new URL("assets/app-icon.png", ROOT);
const SIZE = 512;

const svg = await readFile(SVG, "utf8");
const resvg = new Resvg(svg, { fitTo: { mode: "width", value: SIZE } });
const png = resvg.render().asPng();
await writeFile(PNG, png);

console.log(
  `✓ wrote assets/app-icon.png (${SIZE}x${SIZE}, ${png.length} bytes)`,
);
