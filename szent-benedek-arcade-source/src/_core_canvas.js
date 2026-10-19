// ---------- canvas & scaling ----------
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
let K = 1;
function resize() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  const dpr = window.devicePixelRatio || 1;
  cv.style.width = Math.floor(W * s) + 'px';
  cv.style.height = Math.floor(H * s) + 'px';
  cv.width = Math.max(1, Math.round(W * s * dpr));
  cv.height = Math.max(1, Math.round(H * s * dpr));
  K = cv.width / W;
}
addEventListener('resize', resize);
resize();

// ---------- helpers ----------
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
function hsh(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function pickWeighted(list) {
  let sum = 0; for (const [, w] of list) sum += w;
  let r = Math.random() * sum;
  for (const [k, w] of list) { r -= w; if (r <= 0) return k; }
  return list[0][0];
}
function rr(x, y, w, h, r) { // rounded rect path
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
const FONT = '"Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif';
const MONO = 'Consolas, "Cascadia Mono", "Courier New", monospace';
function txt(s, x, y, size, color, align = 'center', weight = '700', font = FONT) {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}
function glowTxt(s, x, y, size, color, glow, align = 'center', weight = '800', font = FONT) {
  ctx.save();
  ctx.shadowColor = glow; ctx.shadowBlur = 18;
  txt(s, x, y, size, color, align, weight, font);
  ctx.restore();
}

// ---------- storage (safe) ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem('packetrunner_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('packetrunner_' + k, JSON.stringify(v)); } catch (e) { } }
};
