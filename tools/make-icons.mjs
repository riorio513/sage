// One-off build helper: rasterizes public/icons/leaf.svg into the PNG sizes
// the PWA manifest needs. Requires `sharp` (installed temporarily as a
// devDependency) — not imported anywhere in src/, so it never reaches the
// shipped bundle.
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(here, "..", "public", "icons", "leaf.svg");
const svg = readFileSync(svgPath);

const targets = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
];

for (const { file, size } of targets) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(path.join(here, "..", "public", "icons", file));
  console.log("wrote", file);
}

// Maskable: keep the leaf inside the safe zone (~80% of canvas) with the
// same background color, since OS masks can crop to a circle/squircle.
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#eef3ea"/>
  <g transform="translate(10 10) scale(0.8)">
    <path d="M50 18 C68 22 78 36 76 54 C74 70 60 80 50 82 C40 80 26 70 24 54 C22 36 32 22 50 18 Z" fill="#4b6b4f"/>
    <path d="M50 22 C50 40 50 64 50 80" stroke="#eef3ea" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M50 36 C44 40 38 42 33 42" stroke="#eef3ea" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M50 50 C57 54 63 56 68 56" stroke="#eef3ea" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M50 64 C45 68 40 70 36 70" stroke="#eef3ea" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;
await sharp(Buffer.from(maskableSvg), { density: 384 }).resize(512, 512).png().toFile(path.join(here, "..", "public", "icons", "icon-maskable-512.png"));
console.log("wrote icon-maskable-512.png");
