# Assets

- `devkit.svg` — the source icon (hand-authored vector, brand color `#2E7D5B`).
- `app-icon.png` — rasterized from `devkit.svg` for harnesses that need a PNG.

## Regenerate the PNG

`app-icon.png` is generated from `devkit.svg` — re-run this whenever the SVG
changes. The default path needs no system tools (it uses `@resvg/resvg-js`,
pinned in `deno.lock`):

```bash
deno task rasterize   # writes assets/app-icon.png at 512x512
```

Alternatively, with a system rasterizer:

```bash
rsvg-convert -w 512 -h 512 assets/devkit.svg -o assets/app-icon.png
# or
magick -background none assets/devkit.svg -resize 512x512 assets/app-icon.png
```
