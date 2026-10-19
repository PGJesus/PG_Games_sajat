// ---------- shared language ----------
// Each game has its own text table; tr() looks there first, then in the shared one.
const CORE_TXT = {
  hu: {
    padOn: 'Kontroller csatlakoztatva', padOff: 'Kontroller: nyomj meg rajta egy gombot',
    langItem: 'NYELV: MAGYAR', soundOn: 'HANG: BE', soundOff: 'HANG: KI',
    langDesc: 'Váltás angolra (balra/jobbra is működik).', soundDesc: 'Hangeffektek be/ki.',
    diffItem: 'NEHÉZSÉG', easy: 'KÖNNYŰ', normal: 'NORMÁL', hard: 'NEHÉZ', insane: 'ŐRÜLT',
    paused: 'SZÜNET', resume: 'FOLYTATÁS', restart: 'ÚJRAKEZDÉS', menu: 'FŐMENÜ',
    padLost: 'A kontroller lecsatlakozott!',
    newHigh: 'ÚJ REKORD! Add meg a neved:',
    nameHint: 'FEL/LE: betű   BALRA/JOBBRA: hely   A: tovább',
    again: 'újra', toMenu: 'főmenü', back: 'vissza', select: 'kiválaszt',
    empty: 'Még nincs eredmény', boardTitle: 'RANGLISTA', board: 'RANGLISTA',
    toLauncher: 'VISSZA A JÁTÉKVÁLASZTÓHOZ', toLauncherDesc: 'Másik játék választása.',
    cta: 'Tetszett? Tanulj informatikát a Szent Benedekben!',
    school: 'Kiskunfélegyházi Szent Benedek PG · Informatika',
    arcadeTitle: 'SZENT BENEDEK ARCADE', arcadeSub: 'Válassz játékot!',
    play: 'játék', fullscreen: 'F: teljes képernyő'
  },
  en: {
    padOn: 'Controller connected', padOff: 'Controller: press any button on it',
    langItem: 'LANGUAGE: ENGLISH', soundOn: 'SOUND: ON', soundOff: 'SOUND: OFF',
    langDesc: 'Switch to Hungarian (left/right works too).', soundDesc: 'Sound effects on/off.',
    diffItem: 'DIFFICULTY', easy: 'EASY', normal: 'NORMAL', hard: 'HARD', insane: 'INSANE',
    paused: 'PAUSED', resume: 'RESUME', restart: 'RESTART', menu: 'MAIN MENU',
    padLost: 'Controller disconnected!',
    newHigh: 'NEW HIGH SCORE! Enter your name:',
    nameHint: 'UP/DOWN: letter   LEFT/RIGHT: move   A: next',
    again: 'play again', toMenu: 'main menu', back: 'back', select: 'select',
    empty: 'No scores yet', boardTitle: 'LEADERBOARD', board: 'LEADERBOARD',
    toLauncher: 'BACK TO GAME SELECT', toLauncherDesc: 'Pick another game.',
    cta: 'Liked it? Study IT at Szent Benedek!',
    school: 'Szent Benedek PG, Kiskunfélegyháza · IT',
    arcadeTitle: 'SZENT BENEDEK ARCADE', arcadeSub: 'Pick a game!',
    play: 'play', fullscreen: 'F: fullscreen'
  }
};
let lang = store.get('lang', 'hu'); if (!CORE_TXT[lang]) lang = 'hu';
let GAME_TXT = null; // set by the active game
function tr(k) {
  if (GAME_TXT && GAME_TXT[lang] && GAME_TXT[lang][k] !== undefined) return GAME_TXT[lang][k];
  if (CORE_TXT[lang][k] !== undefined) return CORE_TXT[lang][k];
  return k;
}
function toggleLang() { lang = lang === 'hu' ? 'en' : 'hu'; store.set('lang', lang); }
function toggleMute() { muted = !muted; store.set('muted', muted); ensureAudio(); }

// ---------- shared constants ----------
const DIFF_KEYS = ['easy', 'normal', 'hard', 'insane'];
const DIFF_COL = { easy: '#7dff9b', normal: '#4fd8ff', hard: '#ffb347', insane: '#ff4d6d' };
const NAME_CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-';
const BTN = { A: '#5cb531', B: '#e0393e', X: '#2f7fe0', Y: '#f0c419' };

// ---------- logo ----------
const logo = new Image();
let logoReady = false;
logo.onload = () => { logoReady = true; };
logo.src = 'data:image/png;base64,__LOGO_B64__';
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ---------- shared drawing helpers ----------
function drawPadBtn(x, y, label, color, r = 13) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.stroke();
  txt(label, x, y + 1, r * 1.1, '#fff', 'center', '900');
}
function panel(x, y, w, h, a = 0.55) {
  ctx.fillStyle = `rgba(6,10,32,${a})`; rr(x, y, w, h, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(79,216,255,0.35)'; ctx.lineWidth = 2; ctx.stroke();
}
function dim(a) { ctx.fillStyle = `rgba(4,7,22,${a})`; ctx.fillRect(0, 0, W, H); }
function drawPadStatus(y) {
  const on = I.pad;
  ctx.font = `600 17px ${FONT}`;
  const s = on ? tr('padOn') : tr('padOff');
  const w = ctx.measureText(s).width + 20;
  ctx.fillStyle = on ? '#5dffa0' : '#ffb347';
  ctx.beginPath(); ctx.arc(W / 2 - w / 2, y, 6, 0, 7); ctx.fill();
  txt(s, W / 2 - w / 2 + 14, y + 1, 17, on ? '#bfffd6' : '#ffd9a8', 'left', '600');
}
function fmtTime(t) {
  const m = Math.floor(t / 60), s = t - m * 60;
  return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
}

// ---------- shared leaderboard storage ----------
const BOARD_N = 10;
function boardGet(key) { const b = store.get(key, []); return Array.isArray(b) ? b : []; }
function boardQualifies(key, score) { const b = boardGet(key); return score > 0 && (b.length < BOARD_N || score > b[b.length - 1].s); }
function boardSave(key, name, score, extra) {
  const b = boardGet(key);
  const entry = { n: name, s: score, x: extra, id: Date.now() };
  b.push(entry);
  b.sort((p, q) => q.s - p.s);
  store.set(key, b.slice(0, BOARD_N));
  return entry.id;
}

// ---------- shared 3-letter name entry ----------
// usage: nameEntry.start(); each frame nameEntry.update(sceneT) -> returns name string when confirmed
const nameEntry = {
  arr: [0, 0, 0], pos: 0,
  start() {
    const last = String(store.get('lastName', 'AAA'));
    this.arr = [0, 1, 2].map(i => Math.max(0, NAME_CH.indexOf(last[i] || 'A')));
    this.pos = 0;
  },
  update(sceneT, sfx) {
    if (sceneT < 0.8) return null;
    for (const ch of typed) {
      const u = ch.toUpperCase(), i = NAME_CH.indexOf(u);
      if (i >= 0 && /[A-Z0-9]/.test(u)) { this.arr[this.pos] = i; this.pos = Math.min(2, this.pos + 1); sfx.select(); }
    }
    if (nav('up')) { this.arr[this.pos] = (this.arr[this.pos] + 1) % NAME_CH.length; sfx.select(); }
    if (nav('down')) { this.arr[this.pos] = (this.arr[this.pos] + NAME_CH.length - 1) % NAME_CH.length; sfx.select(); }
    if (nav('left')) { this.pos = Math.max(0, this.pos - 1); sfx.select(); }
    if (nav('right')) { this.pos = Math.min(2, this.pos + 1); sfx.select(); }
    if (pressed('b')) { this.pos = Math.max(0, this.pos - 1); sfx.select(); }
    if (pressed('a')) {
      if (this.pos < 2) { this.pos++; sfx.select(); }
      else { const name = this.arr.map(i => NAME_CH[i]).join(''); store.set('lastName', name); return name; }
    }
    return null;
  },
  draw(time, sceneT, y = 410) {
    glowTxt(tr('newHigh'), W / 2, y - 110, 32, '#ffd84d', '#ffb000', 'center', '900');
    for (let i = 0; i < 3; i++) {
      const x = W / 2 - 120 + i * 120, sel = i === this.pos;
      ctx.fillStyle = sel ? 'rgba(79,216,255,0.25)' : 'rgba(6,10,32,0.7)';
      rr(x - 45, y - 55, 90, 110, 12); ctx.fill();
      ctx.strokeStyle = sel ? '#4fd8ff' : 'rgba(79,216,255,0.3)'; ctx.lineWidth = sel ? 3 : 2; ctx.stroke();
      txt(NAME_CH[this.arr[i]], x, y + 4, 70, '#fff', 'center', '900', MONO);
      if (sel) { const b = Math.sin(time * 8) * 3; txt('▲', x, y - 72 - b, 20, '#4fd8ff'); txt('▼', x, y + 76 + b, 20, '#4fd8ff'); }
    }
    txt(tr('nameHint'), W / 2, y + 130, 19, '#cfe9ff', 'center', '600');
    ctx.globalAlpha = sceneT < 0.8 ? 0.5 : 1;
    drawPadBtn(W / 2 - 30, y + 190, 'A', BTN.A, 15);
    txt('OK', W / 2 - 8, y + 191, 20, '#fff', 'left', '800');
    ctx.globalAlpha = 1;
  }
};

// ---------- app: switches between the launcher and the games ----------
// A game module provides: enter(), update(dt), draw(time), optional onHide(), blockHotkeys(), txt
const App = {
  mods: {}, cur: null, name: '',
  register(name, mod) { this.mods[name] = mod; },
  go(name) {
    this.name = name; this.cur = this.mods[name];
    GAME_TXT = this.cur.txt || null;
    this.cur.enter();
  },
  blockHotkeys() { return !!(this.cur && this.cur.blockHotkeys && this.cur.blockHotkeys()); }
};

let lastT = performance.now();
function mainFrame(now) {
  let dt = (now - lastT) / 1000;
  lastT = now;
  if (!(dt > 0)) dt = 0;
  dt = Math.min(dt, 1 / 30);
  pollInput(dt);
  const time = now / 1000;
  App.cur.update(dt, time);
  typed = [];
  ctx.setTransform(K, 0, 0, K, 0, 0);
  ctx.clearRect(0, 0, W, H);
  App.cur.draw(time);
  requestAnimationFrame(mainFrame);
}
document.addEventListener('visibilitychange', () => { if (document.hidden && App.cur && App.cur.onHide) App.cur.onHide(); });
window.addEventListener('gamepadconnected', () => { lastInputT = performance.now(); });
