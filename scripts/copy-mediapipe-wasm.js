/**
 * Copies MediaPipe Tasks Vision WASM runtime files into public/mediapipe/wasm/
 * so they are served as static assets — no CDN needed, works fully offline.
 * Run automatically via `postinstall` in package.json.
 */

const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "node_modules", "@mediapipe", "tasks-vision", "wasm");
const dest = path.join(__dirname, "..", "public", "mediapipe", "wasm");

if (!fs.existsSync(src)) {
  console.warn("[copy-mediapipe-wasm] Source not found — skipping:", src);
  process.exit(0);
}

fs.mkdirSync(dest, { recursive: true });

const files = fs.readdirSync(src);
for (const file of files) {
  fs.copyFileSync(path.join(src, file), path.join(dest, file));
}

console.log(`[copy-mediapipe-wasm] Copied ${files.length} files to public/mediapipe/wasm/`);
