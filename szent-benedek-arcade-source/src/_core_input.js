// ---------- input (keyboard + gamepad) ----------
const keyDown = new Set();
const keyTapped = new Set(); // keys pressed since the last poll (catches very short taps)
let typed = [];
let lastInputT = performance.now();
const KB = {
  up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'],
  a: ['Space', 'Enter'], b: ['Backspace'], x: ['KeyX'], y: ['KeyY'], start: ['Escape', 'KeyP']
};
addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Tab'].includes(e.code)) e.preventDefault();
  keyDown.add(e.code); keyTapped.add(e.code);
  if (!e.repeat && e.key && e.key.length === 1) typed.push(e.key);
  lastInputT = performance.now();
  ensureAudio();
  if (e.code === 'KeyF' && !e.repeat && !App.blockHotkeys()) toggleFullscreen();
});
addEventListener('keyup', e => keyDown.delete(e.code));
addEventListener('blur', () => keyDown.clear());
addEventListener('pointerdown', () => { ensureAudio(); lastInputT = performance.now(); });
function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => { });
    else document.exitFullscreen().catch(() => { });
  } catch (e) { }
}

let padIndex = -1;
function getPad() {
  let ps = [];
  try { ps = navigator.getGamepads ? navigator.getGamepads() : []; } catch (e) { return null; }
  if (padIndex >= 0 && ps[padIndex] && ps[padIndex].connected) return ps[padIndex];
  for (const p of ps) if (p && p.connected) { padIndex = p.index; return p; }
  padIndex = -1;
  return null;
}
function rumble(ms, mag) {
  const p = getPad();
  try {
    if (p && p.vibrationActuator && p.vibrationActuator.playEffect)
      p.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: mag, weakMagnitude: mag }).catch(() => { });
  } catch (e) { }
}

const I = { cur: {}, prev: {}, rep: {}, fire: {}, pad: false, padWas: false };
const DIRS = ['up', 'down', 'left', 'right'];
function pollInput(dt) {
  I.prev = I.cur;
  const c = {};
  for (const a in KB) c[a] = KB[a].some(k => keyDown.has(k) || keyTapped.has(k));
  keyTapped.clear();
  I.lx = 0; I.ly = 0;
  const p = getPad();
  I.padWas = I.pad;
  I.pad = !!p;
  if (p) {
    const b = i => !!(p.buttons[i] && p.buttons[i].pressed);
    const ax = p.axes || [];
    const lx = ax[0] || 0, ly = ax[1] || 0;
    I.lx = lx; I.ly = ly;
    c.a = c.a || b(0);
    c.b = c.b || b(1);
    c.x = c.x || b(2); c.y = c.y || b(3);
    c.start = c.start || b(9);
    c.view = b(8);
    c.up = c.up || b(12) || ly < -0.6;
    c.down = c.down || b(13) || ly > 0.6;
    c.left = c.left || b(14) || lx < -0.6;
    c.right = c.right || b(15) || lx > 0.6;
    let any = false;
    for (let i = 0; i < p.buttons.length; i++) if (p.buttons[i] && p.buttons[i].pressed) { any = true; break; }
    if (any || Math.abs(lx) > 0.6 || Math.abs(ly) > 0.6) { lastInputT = performance.now(); ensureAudio(); }
  }
  I.cur = c;
  for (const d of DIRS) {
    if (c[d]) {
      const r0 = I.rep[d] || 0, r1 = r0 + dt;
      I.rep[d] = r1;
      I.fire[d] = !I.prev[d] || (r1 > 0.4 && Math.floor((r1 - 0.4) / 0.11) > Math.floor(Math.max(0, r0 - 0.4) / 0.11));
    } else { I.rep[d] = 0; I.fire[d] = false; }
  }
}
const pressed = a => !!I.cur[a] && !I.prev[a];
const held = a => !!I.cur[a];
const nav = d => !!I.fire[d];
