// Rasterize the source SVG icon to a PNG the harness manifests reference.
// Run with: `deno task rasterize`. Re-run whenever assets/devkit.svg changes.
//
// Uses @resvg/resvg-js (deno caches the dep + deno.lock pins it), so the PNG
// reproduces from the SVG without any system tool (rsvg-convert/ImageMagick).
import { Resvg } from "npm:@resvg/resvg-js@2.6.2";

const ROOT = new URL("../", import.meta.url);
const SVG = new URL("assets/devkit.svg", ROOT);
const PNG = new URL("assets/app-icon.png", ROOT);
const SIZE = 512;

const svg = await Deno.readTextFile(SVG);
const resvg = new Resvg(svg, { fitTo: { mode: "width", value: SIZE } });
const png = resvg.render().asPng();
await Deno.writeFile(PNG, png);

console.log(
  `✓ wrote assets/app-icon.png (${SIZE}x${SIZE}, ${png.length} bytes)`,
);
