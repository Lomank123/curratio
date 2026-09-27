// Renders src/assets/icon.svg into the PNG sizes Chrome needs (public/icon-*.png).
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const svg = await readFile(new URL('../src/assets/icon.svg', import.meta.url));
for (const size of [16, 32, 48, 128]) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(new URL(`../public/icon-${size}.png`, import.meta.url).pathname);
}
