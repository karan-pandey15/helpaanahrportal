// Generates the PWA icon set from the square brand mark (logo-c.svg) into
// public/. Re-run with `node scripts/generate-pwa-icons.mjs` if the logo changes.
import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const svg = readFileSync(
  path.join(root, "src/assets/images/logo/logo-c.svg"),
);
const outDir = path.join(root, "public");
mkdirSync(outDir, { recursive: true });

const BG = "#111112"; // brand dark — fills the rounded corners so icons are full-bleed

const targets = [
  { name: "pwa-64x64.png", size: 64 },
  { name: "pwa-192x192.png", size: 192 },
  { name: "pwa-512x512.png", size: 512 },
  { name: "maskable-512x512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

for (const t of targets) {
  // High density so the 32px SVG rasterizes crisply at large sizes.
  await sharp(svg, { density: 1200 })
    .resize(t.size, t.size, { fit: "contain", background: BG })
    .flatten({ background: BG })
    .png()
    .toFile(path.join(outDir, t.name));
  console.log("generated", t.name);
}
