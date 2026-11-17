// Generates simple placeholder brand assets (lime square + dark triangle) with no dependencies.
// Replace the files in ./assets with real artwork before store submission:  node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const crcTable = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const t = Buffer.from(type); const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const c = Buffer.alloc(4); c.writeUInt32BE(crc(Buffer.concat([t, data]))); return Buffer.concat([len, t, data, c]); };

function png(w, h, pixel) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x++) { const [r, g, b, a] = pixel(x, y); raw.set([r, g, b, a], y * (w * 4 + 1) + 1 + x * 4); }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const LIME = [198, 255, 61, 255], DARK = [10, 18, 0, 255], NAVY = [8, 11, 18, 255], CLEAR = [0, 0, 0, 0];
// triangle with apex at top centre, base at bottom, scaled by `s` (fraction of canvas)
const tri = (size, s) => (x, y) => {
  const cx = size / 2, top = size * (0.5 - s * 0.5), bot = size * (0.5 + s * 0.5), half = (size * s) / 2;
  if (y < top || y > bot) return false;
  const t = (y - top) / (bot - top); return Math.abs(x - cx) <= half * t;
};

mkdirSync(new URL('../assets/', import.meta.url), { recursive: true });
const out = (name, buf) => writeFileSync(new URL(`../assets/${name}`, import.meta.url), buf);
const S = 1024;
out('icon.png', png(S, S, (x, y) => (tri(S, 0.5)(x, y) ? DARK : LIME)));
out('adaptive-icon.png', png(S, S, (x, y) => (tri(S, 0.38)(x, y) ? DARK : LIME))); // Android crops the edges, so keep the mark small
out('splash-icon.png', png(512, 512, (x, y) => (tri(512, 0.55)(x, y) ? LIME : CLEAR)));
out('favicon.png', png(48, 48, (x, y) => (tri(48, 0.55)(x, y) ? DARK : LIME)));
void NAVY;
console.log('assets written to apps/mobile/assets');
