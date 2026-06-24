# Assets

- `devkit.svg` — the source icon (hand-authored vector, brand color `#2E7D5B`).
- `app-icon.png` — rasterized from `devkit.svg` for harnesses that need a PNG.

## Regenerate the PNG

With a rasterizer available (e.g. `rsvg-convert`, installed via the
developer-environment skill):

```bash
rsvg-convert -w 512 -h 512 assets/devkit.svg -o assets/app-icon.png
```

Or with ImageMagick:

```bash
magick -background none assets/devkit.svg -resize 512x512 assets/app-icon.png
```
