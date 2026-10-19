// =====================================================================
//  PACKET RUNNER
// =====================================================================
const PacketRunner = (() => {
const GROUND = 600;               // y of the ground surface
const PX = 280;                   // player's x on screen
const PW = 44, PH = 44, PHS = 24; // player width, height, sliding height
const GRAV = 2600, JUMP = 900, JUMP_CUT = 350, FASTFALL = 4200;
const RACE_LEN = 49500;           // race distance in px (~1.5 min on Normal)
const RACE_BONUS_BASE = 150;      // seconds; time bonus = (base - time) * 100
const BOARD_SIZE = 10;

// ---------- difficulty levels ----------
// e*: endless speed (base, max, time constant), r*: race speed (start, top)
// dRamp: seconds until max difficulty (endless), dOff: starting difficulty
// space: spacing multiplier between patterns, feat: min difficulty for each new feature
// fw: weight multiplier of new features
const DIFFS = {
  easy:   { lives: 4, eBase: 380, eMax: 720,  eTau: 55, rBase: 420, rTop: 600, dRamp: 140, dOff: 0,    space: 1.15, fw: 1.0, laserH: 105, laserOn: 0.9, laserP: 2.0,
            feat: { tunnel: 0.15, stairs: 0.3 } },
  normal: { lives: 3, eBase: 420, eMax: 900,  eTau: 37, rBase: 460, rTop: 680, dRamp: 80,  dOff: 0,    space: 1.0,  fw: 1.2, laserH: 115, laserOn: 1.0, laserP: 1.9,
            feat: { mover: 0.2, tunnel: 0.15, stairs: 0.3, laser: 0.45 } },
  hard:   { lives: 3, eBase: 480, eMax: 1000, eTau: 32, rBase: 520, rTop: 780, dRamp: 60,  dOff: 0.2,  space: 0.93, fw: 1.5, laserH: 122, laserOn: 1.15, laserP: 1.9,
            feat: { mover: 0.1, tunnel: 0.05, stairs: 0.15, laser: 0.25 } },
  insane: { lives: 3, eBase: 540, eMax: 1100, eTau: 26, rBase: 580, rTop: 880, dRamp: 40,  dOff: 0.35, space: 0.87, fw: 1.8, laserH: 125, laserOn: 1.25, laserP: 1.85,
            feat: { mover: 0, tunnel: 0, stairs: 0, laser: 0.1 } }
};
let diffI = 1; // Normal by default
const curDiff = () => DIFF_KEYS[diffI];

// ---------- language ----------
const TXT = {
  hu: {
    subtitle: 'Juttasd el az adatcsomagot az iskola szerverére!',
    school: 'Kiskunfélegyházi Szent Benedek PG · Informatika',
    endless: 'VÉGTELEN MÓD', endlessDesc: '3 életed van, és egyre gyorsul. Meddig bírod?',
    race: 'VERSENY A SZERVERHEZ', raceDesc: 'Érj el az iskola szerveréig minél gyorsabban!',
    board: 'RANGLISTA', boardDesc: 'A legjobb eredmények ezen a gépen.',
    langItem: 'NYELV: MAGYAR', langDesc: 'Váltás angolra (balra/jobbra is működik).',
    soundOn: 'HANG: BE', soundOff: 'HANG: KI', soundDesc: 'Hangeffektek be/ki.',
    jump: 'ugrás', slide: 'csúszás', pause: 'szünet', select: 'kiválaszt', back: 'vissza',
    padOn: 'Kontroller csatlakoztatva', padOff: 'Kontroller: nyomj meg rajta egy gombot',
    paused: 'SZÜNET', resume: 'FOLYTATÁS', restart: 'ÚJRAKEZDÉS', menu: 'FŐMENÜ',
    padLost: 'A kontroller lecsatlakozott!',
    score: 'PONT', bits: 'BIT', time: 'IDŐ', dist: 'ÁTKÜLDVE', lives: 'ÉLET',
    gameOver: 'KAPCSOLAT MEGSZAKADT', finished: 'CSOMAG KÉZBESÍTVE!',
    newHigh: 'ÚJ REKORD! Add meg a neved:',
    nameHint: 'FEL/LE: betű   BALRA/JOBBRA: hely   A: tovább',
    again: 'újra', toMenu: 'főmenü',
    cta: 'Tetszett? Tanulj informatikát a Szent Benedekben!',
    hit_lag: 'LAG SPIKE!', hit_fire: 'TŰZFAL!', hit_virus: 'VÍRUS!', hit_fall: 'CSOMAGVESZTÉS!',
    cause_lag: 'Egy lag spike állított meg.', cause_fire: 'Fennakadtál a tűzfalon.',
    cause_virus: 'Elkapott egy vírus.', cause_fall: 'Elvesztél a hálózatban (404).',
    shield: 'VÍRUSIRTÓ PAJZS!', magnet: 'WI-FI MÁGNES!', shieldUsed: 'PAJZS ELHASZNÁLVA',
    server: 'ISKOLAI SZERVER', empty: 'Még nincs eredmény', timeBonus: 'Időbónusz',
    go: 'RAJT!', boardTitle: 'RANGLISTA', kb: 'KB',
    tip: 'Tipp: tartsd nyomva az A-t a nagyobb ugráshoz!',
    diffItem: 'NEHÉZSÉG', easy: 'KÖNNYŰ', normal: 'NORMÁL', hard: 'NEHÉZ', insane: 'ŐRÜLT',
    diffDesc_easy: 'Lassabb tempó, 4 élet, csak alap akadályok.',
    diffDesc_normal: 'Az igazi élmény. Ezzel érdemes kezdeni!',
    diffDesc_hard: 'Gyorsabb, sűrűbb, minden trükkös pályaelemmel.',
    diffDesc_insane: 'Csak a legjobbaknak. Tényleg.',
    hit_laser: 'LÉZER-TŰZFAL!', hit_tunnel: 'BEAKADTÁL A KÁBELEKBE!',
    cause_laser: 'Átégetett a lézer-tűzfal.', cause_tunnel: 'Beakadtál a kábelalagútban.',
    boardHint: 'BALRA/JOBBRA: nehézség'
  },
  en: {
    subtitle: 'Deliver the data packet to the school server!',
    school: 'Szent Benedek PG, Kiskunfélegyháza · IT',
    endless: 'ENDLESS MODE', endlessDesc: '3 lives and it keeps getting faster. How long can you last?',
    race: 'RACE TO THE SERVER', raceDesc: 'Reach the school server as fast as you can!',
    board: 'LEADERBOARD', boardDesc: 'Best scores on this computer.',
    langItem: 'LANGUAGE: ENGLISH', langDesc: 'Switch to Hungarian (left/right works too).',
    soundOn: 'SOUND: ON', soundOff: 'SOUND: OFF', soundDesc: 'Sound effects on/off.',
    jump: 'jump', slide: 'slide', pause: 'pause', select: 'select', back: 'back',
    padOn: 'Controller connected', padOff: 'Controller: press any button on it',
    paused: 'PAUSED', resume: 'RESUME', restart: 'RESTART', menu: 'MAIN MENU',
    padLost: 'Controller disconnected!',
    score: 'SCORE', bits: 'BITS', time: 'TIME', dist: 'SENT', lives: 'LIVES',
    gameOver: 'CONNECTION LOST', finished: 'PACKET DELIVERED!',
    newHigh: 'NEW HIGH SCORE! Enter your name:',
    nameHint: 'UP/DOWN: letter   LEFT/RIGHT: move   A: next',
    again: 'play again', toMenu: 'main menu',
    cta: 'Liked it? Study IT at Szent Benedek!',
    hit_lag: 'LAG SPIKE!', hit_fire: 'FIREWALL!', hit_virus: 'VIRUS!', hit_fall: 'PACKET LOSS!',
    cause_lag: 'A lag spike stopped you.', cause_fire: 'Blocked by the firewall.',
    cause_virus: 'You caught a virus.', cause_fall: 'Lost in the network (404).',
    shield: 'ANTIVIRUS SHIELD!', magnet: 'WI-FI MAGNET!', shieldUsed: 'SHIELD USED',
    server: 'SCHOOL SERVER', empty: 'No scores yet', timeBonus: 'Time bonus',
    go: 'GO!', boardTitle: 'LEADERBOARD', kb: 'KB',
    tip: 'Tip: hold A to jump higher!',
    diffItem: 'DIFFICULTY', easy: 'EASY', normal: 'NORMAL', hard: 'HARD', insane: 'INSANE',
    diffDesc_easy: 'Slower pace, 4 lives, basic obstacles only.',
    diffDesc_normal: 'The real deal. Start here!',
    diffDesc_hard: 'Faster, denser, with every tricky map feature.',
    diffDesc_insane: 'For the very best only. Seriously.',
    hit_laser: 'LASER FIREWALL!', hit_tunnel: 'STUCK IN THE CABLES!',
    cause_laser: 'The laser firewall burned you.', cause_tunnel: 'You got stuck in the cable tunnel.',
    boardHint: 'LEFT/RIGHT: difficulty'
  }
};
let bitCombo = 0, bitComboT = 0;
const sfx = {
  jump() { tone(330, 660, 0.12, 'square', 0.045); },
  slide() { noise(0.12, 0.05); },
  bit() { const f = 1100 * Math.pow(1.06, Math.min(bitCombo, 12)); tone(f, f * 1.5, 0.06, 'triangle', 0.06); },
  hit() { noise(0.3, 0.14); tone(240, 50, 0.32, 'sawtooth', 0.08); },
  shieldBreak() { tone(900, 300, 0.25, 'triangle', 0.08); },
  power() { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.09, 'square', 0.045, i * 0.06)); },
  select() { tone(620, 620, 0.04, 'square', 0.035); },
  confirm() { tone(520, 1040, 0.1, 'square', 0.05); },
  tick() { tone(440, 440, 0.12, 'square', 0.05); },
  go() { tone(880, 880, 0.3, 'square', 0.06); },
  win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, f, 0.14, 'square', 0.05, i * 0.1)); },
  over() { [440, 349, 262, 196].forEach((f, i) => tone(f, f * 0.98, 0.2, 'square', 0.05, i * 0.16)); }
};

function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

const binTile = (() => {
  const c = makeCanvas(W, GROUND), g = c.getContext('2d');
  g.font = `600 16px ${MONO}`;
  g.textAlign = 'center';
  for (let col = 0; col < 54; col++) {
    const x = col * 24 + 12;
    const start = rint(-10, 12), len = rint(4, 18);
    for (let r = start; r < start + len; r++) {
      const a = 0.03 + 0.09 * (1 - (r - start) / len);
      g.fillStyle = `rgba(90,200,255,${a})`;
      g.fillText(Math.random() < 0.5 ? '0' : '1', x, r * 22 + 20);
    }
  }
  return c;
})();

const pcbTile = (() => {
  const w = 512, h = H - GROUND, c = makeCanvas(w, h), g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, '#13205a'); grd.addColorStop(1, '#070b22');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(80,190,255,0.18)'; g.lineWidth = 2;
  for (let i = 0; i < 14; i++) {
    let x = rint(0, w), y = rint(14, h - 8);
    g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 3; s++) {
      const dx = rint(30, 90);
      if (Math.random() < 0.5) { x += dx; } else { x += dx; y += (Math.random() < 0.5 ? -1 : 1) * rint(10, 24); y = clamp(y, 10, h - 6); }
      g.lineTo(x, y);
    }
    g.stroke();
    g.fillStyle = 'rgba(120,220,255,0.35)';
    g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill();
  }
  // chips
  for (let i = 0; i < 3; i++) {
    const x = rint(20, w - 80), y = rint(30, h - 50);
    g.fillStyle = 'rgba(5,8,25,0.8)'; g.fillRect(x, y, 60, 34);
    g.strokeStyle = 'rgba(80,190,255,0.25)'; g.strokeRect(x, y, 60, 34);
    g.fillStyle = 'rgba(160,180,220,0.35)';
    for (let k = 0; k < 6; k++) { g.fillRect(x + 4 + k * 10, y - 4, 4, 4); g.fillRect(x + 4 + k * 10, y + 34, 4, 4); }
  }
  return c;
})();

const bitSprites = {};
for (const ch of ['0', '1']) {
  const c = makeCanvas(64, 64), g = c.getContext('2d');
  g.shadowColor = '#ffcc33'; g.shadowBlur = 14;
  g.font = `800 34px ${MONO}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#ffd84d'; g.fillText(ch, 32, 34);
  g.shadowBlur = 0; g.fillStyle = '#fff6c8'; g.fillText(ch, 32, 34);
  bitSprites[ch] = c;
}

let skyGrad = null;
function sky() {
  if (!skyGrad) {
    skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND);
    skyGrad.addColorStop(0, '#050817');
    skyGrad.addColorStop(1, '#16205a');
  }
  return skyGrad;
}

// ---------- game state ----------
let scene = 'title';        // title | board | play | pause | name | over
let menuI = 0, sceneT = 0, padLostMsg = false;
let G = null;
let demoCam = 0;            // background scroll on menus

function newGame(mode) {
  const diff = curDiff(), cfg = DIFFS[diff];
  G = {
    mode, diff, cfg, t: 0, count: 3.0, goT: 0, speed: 0, speedMul: 1, dist: 0,
    bits: 0, lives: cfg.lives, maxLives: cfg.lives, shield: 0, magnet: 0, inv: 0,
    obs: [], gaps: [], plats: [], items: [], parts: [], texts: [],
    nextX: 1150, nextPowT: 12, lastPat: '', finalBits: false,
    shake: 0, dead: 0, done: false, doneT: 0, finalT: 0, cause: '',
    p: { x: 0, b: GROUND, vy: 0, on: true, slide: false, coyote: 0, buf: 0, squash: 0, hidden: false, trail: 0 },
    cam: -PX
  };
  scene = 'play'; sceneT = 0; padLostMsg = false;
  sfx.confirm();
}

function speedFor() {
  const c = G.cfg;
  if (G.mode === 'race') return c.rBase + (c.rTop - c.rBase) * Math.min(1, G.t / 80);
  return c.eBase + (c.eMax - c.eBase) * (1 - Math.exp(-G.t / c.eTau));
}
function difficulty() {
  const c = G.cfg;
  if (G.mode === 'race') return Math.min(1, c.dOff + (G.p.x / RACE_LEN) * 1.15);
  return Math.min(1, c.dOff + G.t / c.dRamp);
}

// ---------- level generation ----------
function addBit(x, y) { G.items.push({ kind: 'bit', x, y, got: false, ch: Math.random() < 0.5 ? '0' : '1', ph: Math.random() * 6 }); }
function arcBits(cx, sp, n = 5) {
  // bits along the ideal jump arc, apex centred over cx
  const T = 2 * JUMP / GRAV;
  for (let k = 1; k <= n; k++) {
    const t = T * k / (n + 1);
    addBit(cx + sp * (t - T / 2), GROUND - (JUMP * t - GRAV * t * t / 2) - PH / 2);
  }
}
function lineBits(x, y, n, gap) { for (let k = 0; k < n; k++) addBit(x + k * gap, y); }
function addSpike(x, w) { G.obs.push({ kind: 'lag', x, w, t: GROUND - 26, bt: GROUND, ix: 6 }); }
function addFire(x, h) { G.obs.push({ kind: 'fire', x, w: 40, t: GROUND - h, bt: GROUND, ix: 4, h }); }
function addVirus(x, tall) {
  G.obs.push({ kind: 'virus', x, w: 56, t: tall ? GROUND - 150 : GROUND - 86, bt: GROUND - 32, ix: 6, tall, ph: Math.random() * 6 });
}

// --- new map features ---
function setMover(o, t) { o.cy = GROUND - 73 + 47 * Math.sin(t * o.om + o.ph); o.t = o.cy - 20; o.bt = o.cy + 20; }
function addMover(x) {
  // virus moving up and down: low -> jump over, middle -> slide under, high -> run under
  const o = { kind: 'virus', mover: true, x, w: 56, ix: 8, ph: Math.random() * 6, om: 2 * Math.PI / 1.8, cy: 0, t: 0, bt: 0 };
  setMover(o, G.t);
  G.obs.push(o);
}
function addTunnel(x, n) {
  // low cable duct: you must hold slide all the way through (built from segments so standing up keeps hurting)
  for (let i = 0; i < n; i++) G.obs.push({ kind: 'tunnel', x: x + i * 120, w: 120, t: GROUND - 300, bt: GROUND - 34, ix: 0, first: i === 0, last: i === n - 1 });
  lineBits(x - 90, GROUND - 14, Math.floor((n * 120 + 60) / 40), 40);
  return x + n * 120;
}
function setLaser(o, t) { const m = ((t + o.ph) % o.P + o.P) % o.P; o.on = m < o.onT; o.warn = !o.on && o.P - m < 0.3; }
function addLaser(x) {
  // blinking laser: when ON it needs a precise full jump, when OFF you just run through
  const c = G.cfg;
  const o = { kind: 'laser', x, w: 14, t: GROUND - c.laserH, bt: GROUND, ix: 0, ph: Math.random() * c.laserP, P: c.laserP, onT: c.laserOn, on: false, warn: false };
  setLaser(o, G.t);
  G.obs.push(o);
}
function airDist(sp, h0, h1) {
  // horizontal distance of a full jump taking off at height h0 and landing at height h1
  const peak = JUMP * JUMP / (2 * GRAV);
  const fall = Math.max(0, h0 + peak - h1);
  return sp * (JUMP / GRAV + Math.sqrt(2 * fall / GRAV));
}
function addStairs(x, sp, n) {
  // wide 404 gap with small platforms: each platform is placed where a full jump
  // from the last third of the previous one lands, so the route is always possible
  let px = x - 40, ph = 0;
  const wMin = G.diff === 'easy' ? 160 : 120, wMax = G.diff === 'easy' ? 190 : 160;
  for (let i = 0; i < n; i++) {
    const h = i === 0 ? rint(40, 90) : clamp(ph + rint(-50, 60), 40, 125);
    const w = rint(wMin, wMax);
    const x1 = px + airDist(sp, ph, h) - w * 0.45;
    G.plats.push({ x: x1, w, y: GROUND - h });
    lineBits(x1 + w / 2 - 20, GROUND - h - 30, 2, 40);
    px = x1 + w - 40; ph = h;
  }
  const gapEnd = px + airDist(sp, ph, 0) * 0.45 + 40;
  G.gaps.push({ x1: x, x2: gapEnd });
  return gapEnd;
}

let forcePat = null; // testing hook
function spawnPattern() {
  const d = difficulty();
  const c = G.cfg;
  const sp = Math.max(440, speedFor());
  const x = G.nextX;
  const fw = key => (c.feat[key] !== undefined && d >= c.feat[key]) ? 1.6 * c.fw : 0;
  const pats = [
    ['spike', 3], ['fire', 2], ['virus', 2], ['tall', d > 0.08 ? 2 : 0], ['gap', 2], ['plat', 1.4],
    ['dspike', d > 0.25 ? 2.5 * d : 0], ['combo', d > 0.4 ? 2.4 * d : 0], ['gapfire', d > 0.6 ? 1.5 * d : 0],
    ['wave', 0.9 * (1 - d) + 0.3],
    ['mover', fw('mover')], ['tunnel', fw('tunnel')], ['stairs', fw('stairs')], ['laser', fw('laser')]
  ].map(([k, w]) => [k, k === G.lastPat ? w * 0.3 : w]);
  const k = forcePat || pickWeighted(pats);
  G.lastPat = k;
  let end = x;
  switch (k) {
    case 'spike': { const w = rint(40, 60 + 70 * d); addSpike(x, w); arcBits(x + w / 2, sp); end = x + w; break; }
    case 'fire': { const h = rint(56, 70 + 24 * d); addFire(x, h); arcBits(x + 20, sp); end = x + 40; break; }
    case 'virus': { addVirus(x, false); end = x + 56; break; }
    case 'tall': { addVirus(x, true); lineBits(x - 60, GROUND - 14, 5, 34); end = x + 56; break; }
    case 'gap': { const w = rint(110, 130 + 80 * d); G.gaps.push({ x1: x, x2: x + w }); arcBits(x + w / 2, sp); end = x + w; break; }
    case 'plat': {
      const L = rint(320, 520), y = GROUND - 128;
      G.plats.push({ x, w: L, y });
      lineBits(x + 40, y - 24, Math.floor((L - 60) / 44), 44);
      if (d > 0.3) addSpike(x + 70, L - 140);
      end = x + L; break;
    }
    case 'dspike': {
      const w1 = rint(40, 70), w2 = rint(40, 70);
      addSpike(x, w1); arcBits(x + w1 / 2, sp);
      const x2 = x + w1 + sp * rnd(0.95, 1.1);
      addSpike(x2, w2); arcBits(x2 + w2 / 2, sp);
      end = x2 + w2; break;
    }
    case 'combo': {
      const w = rint(40, 70);
      addSpike(x, w); arcBits(x + w / 2, sp);
      const vx = x + w + sp * (1.05 - 0.1 * d);
      addVirus(vx, true);
      end = vx + 56; break;
    }
    case 'gapfire': {
      const gw = rint(110, 150);
      G.gaps.push({ x1: x, x2: x + gw }); arcBits(x + gw / 2, sp);
      const fx = x + gw + sp * 1.0;
      addFire(fx, rint(56, 80)); arcBits(fx + 20, sp);
      end = fx + 40; break;
    }
    case 'wave': {
      for (let i = 0; i < 9; i++) addBit(x + i * 46, GROUND - 40 - Math.sin(i / 8 * Math.PI) * 90);
      end = x + 8 * 46; break;
    }
    case 'mover': { addMover(x); end = x + 56; break; }
    case 'tunnel': {
      const n = { easy: 3, normal: rint(3, 5), hard: rint(4, 6), insane: rint(5, 7) }[G.diff];
      end = addTunnel(x, n); break;
    }
    case 'stairs': {
      const n = { easy: 2, normal: rint(2, 3), hard: 3, insane: rint(3, 4) }[G.diff];
      end = addStairs(x, speedFor(), n); break; // exact speed: the platform spacing depends on it
    }
    case 'laser': { addLaser(x); arcBits(x + 7, sp); end = x + 14; break; }
  }
  const gap = (sp * (0.85 + Math.random() * 0.65 * (1 - 0.6 * d)) + 60) * c.space;
  if (G.t + 2 >= G.nextPowT && k !== 'wave') {
    G.nextPowT = G.t + rnd(18, 28);
    G.items.push({ kind: Math.random() < 0.55 ? 'shield' : 'magnet', x: end + gap * 0.5, y: GROUND - 95, got: false, ph: 0 });
  } else if (Math.random() < 0.35 && k !== 'wave') {
    lineBits(end + gap * 0.3, GROUND - 22, 4, 36);
  }
  G.nextX = end + gap;
}

function generate() {
  const lim = G.mode === 'race' ? RACE_LEN - 1300 : Infinity;
  while (G.nextX < G.cam + W + 700 && G.nextX < lim) spawnPattern();
  if (G.mode === 'race' && !G.finalBits && G.nextX >= lim) {
    G.finalBits = true;
    const sx = Math.max(G.nextX, lim);
    for (let i = 0; i < 14; i++) addBit(sx + i * 50, GROUND - 30 - Math.abs(Math.sin(i / 3.5)) * 60);
  }
}

function cleanup() {
  const L = G.cam - 300;
  G.obs = G.obs.filter(o => o.x + o.w > L);
  G.gaps = G.gaps.filter(g => g.x2 > L);
  G.plats = G.plats.filter(p => p.x + p.w > L);
  G.items = G.items.filter(i => !i.got && i.x > L);
  G.parts = G.parts.filter(p => p.life > 0);
  G.texts = G.texts.filter(t => t.life > 0);
}

// ---------- particles / floating text ----------
function burst(x, y, n, colors, spd = 300, size = 5, grav = 600) {
  for (let i = 0; i < n && G.parts.length < 400; i++) {
    const a = Math.random() * Math.PI * 2, s = rnd(0.3, 1) * spd;
    G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - spd * 0.3, life: rnd(0.4, 0.9), max: 0.9, c: colors[i % colors.length], s: rnd(size * 0.5, size), g: grav });
  }
}
function addText(str, x, y, color) { G.texts.push({ str, x, y, color, life: 1.1 }); }
function updateFx(dt) {
  for (const p of G.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.life -= dt; }
  for (const t of G.texts) { t.y -= 50 * dt; t.life -= dt; }
  G.shake = Math.max(0, G.shake - dt);
}

// ---------- gameplay ----------
function overGap(L, R) { for (const g of G.gaps) if (L >= g.x1 && R <= g.x2) return true; return false; }

function hurt(kind) {
  const p = G.p;
  const cx = p.x + PW / 2, cy = p.b - PH / 2;
  if (G.shield > 0) {
    G.shield = 0; G.inv = 1.0;
    sfx.shieldBreak(); rumble(120, 0.4);
    burst(cx, cy, 24, ['#7fd4ff', '#ffffff'], 350, 5);
    addText(tr('shieldUsed'), cx, cy - 50, '#7fd4ff');
    return false;
  }
  G.inv = 1.6; G.shake = 0.35;
  sfx.hit(); rumble(260, 1.0);
  burst(cx, cy, 30, ['#ff4d6d', '#ffb347', '#ffffff'], 380, 6);
  addText(tr('hit_' + kind), cx, cy - 50, '#ff6b81');
  if (G.mode === 'endless') {
    G.lives--;
    G.speedMul = 0.55;
    if (G.lives <= 0) {
      G.dead = 1.4; G.cause = kind; p.hidden = true;
      burst(cx, cy, 60, ['#4fd8ff', '#ffffff', '#ff4d6d'], 520, 7);
      sfx.over();
      return true;
    }
  } else {
    G.speedMul = 0.35;
  }
  return false;
}

function fallIntoGap() {
  const p = G.p;
  const died = hurt('fall');
  if (died) return;
  // respawn on safe ground: clear hazards just around the player
  const a = p.x - 200, b = p.x + 900;
  G.gaps = G.gaps.filter(g => g.x2 < a || g.x1 > b);
  G.obs = G.obs.filter(o => o.x + o.w < p.x - 50 || o.x > b);
  if (G.nextX < b) G.nextX = b;
  p.b = GROUND; p.vy = 0; p.on = true;
  burst(p.x + PW / 2, GROUND - 22, 20, ['#4fd8ff', '#ffffff'], 250, 4);
}

function stepPhys(h, jumpPressed) {
  const p = G.p;
  G.speedMul = Math.min(1, G.speedMul + 0.55 * h);
  G.speed = speedFor() * G.speedMul;
  const dx = G.speed * h;
  p.x += dx; G.dist += dx;

  if (jumpPressed) p.buf = 0.13;
  p.buf -= h; p.coyote -= h;
  const jh = held('a') || held('y') || held('up');
  const sl = held('b') || held('x') || held('down');

  if (p.buf > 0 && (p.on || p.coyote > 0)) {
    p.vy = -JUMP; p.on = false; p.coyote = 0; p.buf = 0;
    sfx.jump();
    burst(p.x + PW / 2, p.b, 6, ['#9be7ff'], 120, 3, 300);
  }
  if (!jh && p.vy < -JUMP_CUT) p.vy = -JUMP_CUT;

  const wasSlide = p.slide;
  p.slide = sl;
  if (p.slide && !wasSlide && p.on) sfx.slide();

  p.vy += (GRAV + (sl && !p.on && p.vy > -200 ? FASTFALL : 0)) * h;
  const prevB = p.b;
  p.b += p.vy * h;
  const wasOn = p.on;
  p.on = false;
  const L = p.x + 8, R = p.x + PW - 8;
  if (p.vy >= 0) {
    const impact = p.vy;
    for (const pl of G.plats) {
      if (R > pl.x && L < pl.x + pl.w && prevB <= pl.y + 0.5 && p.b >= pl.y) { p.b = pl.y; p.vy = 0; p.on = true; break; }
    }
    if (!p.on && prevB <= GROUND + 0.5 && p.b >= GROUND && !overGap(L, R)) { p.b = GROUND; p.vy = 0; p.on = true; }
    if (p.on && !wasOn && impact > 500) { p.squash = 1; burst(p.x + PW / 2, p.b, 5, ['#9be7ff'], 100, 3, 200); }
  }
  if (wasOn && !p.on && p.vy >= 0) p.coyote = 0.09;
  p.squash = Math.max(0, p.squash - h * 6);

  // fell into a gap ("packet loss")
  if (p.b > GROUND + 6 && (p.b > GROUND + 60 || !overGap(L, R))) { fallIntoGap(); return; }

  // obstacles
  G.inv -= h;
  if (G.inv <= 0) {
    const hh = p.slide ? PHS : PH;
    const bl = p.x + 7, br = p.x + PW - 7, bt = p.b - hh + 6, bb = p.b - 3;
    for (const o of G.obs) {
      if (o.hit || (o.kind === 'laser' && !o.on)) continue;
      if (br > o.x + o.ix && bl < o.x + o.w - o.ix && bb > o.t && bt < o.bt) {
        o.hit = true;
        hurt(o.kind);
        break;
      }
    }
  }

  // pickups
  const hh = p.slide ? PHS : PH;
  const pcx = p.x + PW / 2, pcy = p.b - hh / 2;
  for (const it of G.items) {
    if (it.got) continue;
    if (G.magnet > 0 && it.kind === 'bit') {
      const ddx = pcx - it.x, ddy = pcy - it.y, dd = Math.hypot(ddx, ddy);
      if (dd < 280 && dd > 1) { it.x += ddx / dd * 1100 * h; it.y += ddy / dd * 1100 * h; }
    }
    if (Math.abs(it.x - pcx) < 32 && Math.abs(it.y - pcy) < hh / 2 + 18) {
      it.got = true;
      if (it.kind === 'bit') {
        G.bits++;
        bitCombo = bitComboT > 0 ? bitCombo + 1 : 0; bitComboT = 0.6;
        sfx.bit();
        burst(it.x, it.y, 4, ['#ffd84d'], 120, 3, 0);
      } else {
        if (it.kind === 'shield') G.shield = 1; else G.magnet = 10;
        sfx.power(); rumble(80, 0.3);
        addText(tr(it.kind), it.x, it.y - 30, it.kind === 'shield' ? '#7fd4ff' : '#c58bff');
        burst(it.x, it.y, 18, ['#ffffff', it.kind === 'shield' ? '#7fd4ff' : '#c58bff'], 260, 5, 0);
      }
    }
  }
  bitComboT -= h;
  if (G.magnet > 0) G.magnet -= h;

  // race finish
  if (G.mode === 'race' && !G.done && p.x + PW >= RACE_LEN) {
    G.done = true; G.finalT = G.t; p.hidden = true;
    sfx.win(); rumble(300, 0.6);
    burst(RACE_LEN, p.b - 22, 80, ['#4fd8ff', '#ffd84d', '#7dff9b', '#ffffff'], 600, 7, 500);
  }
}

function updateDynamic() {
  for (const o of G.obs) {
    if (o.mover) setMover(o, G.t);
    else if (o.kind === 'laser') setLaser(o, G.t);
  }
}

function updatePlay(dt) {
  if (pressed('start') && !G.dead && !G.done) { scene = 'pause'; menuI = 0; sfx.select(); return; }
  if (I.padWas && !I.pad && !G.dead && !G.done) { scene = 'pause'; menuI = 0; padLostMsg = true; return; }
  G.cam = G.p.x - PX;

  if (G.count > 0) {
    const before = Math.ceil(G.count);
    G.count -= dt;
    if (G.count <= 0) { G.goT = 0.8; sfx.go(); }
    else if (Math.ceil(G.count) !== before) sfx.tick();
    generate();
    updateDynamic();
    updateFx(dt);
    return;
  }
  G.goT -= dt;

  if (G.dead > 0) { G.dead -= dt; updateFx(dt); if (G.dead <= 0) endGame(false); return; }
  if (G.done) {
    G.doneT += dt;
    updateFx(dt);
    if (Math.random() < 0.3) burst(RACE_LEN + rnd(0, 240), GROUND - rnd(80, 340), 3, ['#4fd8ff', '#ffd84d', '#7dff9b'], 200, 5, 300);
    if (G.doneT > 2.2) endGame(true);
    return;
  }

  G.t += dt;
  updateDynamic();
  const jp = pressed('a') || pressed('y') || pressed('up');
  const n = Math.max(1, Math.ceil(dt / (1 / 240)));
  for (let i = 0; i < n; i++) {
    stepPhys(dt / n, i === 0 && jp);
    if (G.dead > 0 || G.done) break;
  }
  G.cam = G.p.x - PX;
  // trail
  if (!G.p.hidden) {
    G.p.trail += dt;
    while (G.p.trail > 0.02) {
      G.p.trail -= 0.02;
      const hh = G.p.slide ? PHS : PH;
      G.parts.push({ x: G.p.x + 2, y: G.p.b - rnd(4, hh - 4), vx: -rnd(40, 120), vy: rnd(-20, 20), life: 0.35, max: 0.35, c: G.shield > 0 ? '#9fdcff' : '#4fd8ff', s: rnd(2, 5), g: 0 });
    }
  }
  generate();
  cleanup();
  updateFx(dt);
}

// ---------- scores ----------
// one leaderboard per mode AND difficulty
const boardKey = (mode, diff) => `board2_${mode}_${diff}`;
function board(mode, diff) { const b = store.get(boardKey(mode, diff), []); return Array.isArray(b) ? b : []; }
function qualifies(mode, diff, score) { const b = board(mode, diff); return score > 0 && (b.length < BOARD_SIZE || score > b[b.length - 1].s); }
function saveScore(mode, diff, name, score, extra) {
  const b = board(mode, diff);
  const entry = { n: name, s: score, x: extra, id: Date.now() };
  b.push(entry);
  b.sort((p, q) => q.s - p.s);
  store.set(boardKey(mode, diff), b.slice(0, BOARD_SIZE));
  return entry.id;
}
function fmtTime(t) {
  const m = Math.floor(t / 60), s = t - m * 60;
  return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
}

let result = null;
const NAME_CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-';
let nameArr = [0, 0, 0], namePos = 0;

function endGame(win) {
  const r = { mode: G.mode, diff: G.diff, win, bits: G.bits, cause: G.cause };
  if (G.mode === 'endless') {
    r.score = Math.floor(G.dist / 20) + G.bits * 10;
    r.extra = Math.floor(G.dist / 100);
  } else {
    r.time = G.finalT;
    r.bonus = Math.max(0, Math.round((RACE_BONUS_BASE - r.time) * 100));
    r.score = r.bonus + G.bits * 10;
    r.extra = Math.round(r.time * 10) / 10;
  }
  r.savedId = null;
  result = r;
  sceneT = 0;
  if (qualifies(r.mode, r.diff, r.score)) {
    const last = String(store.get('lastName', 'AAA'));
    nameArr = [0, 1, 2].map(i => Math.max(0, NAME_CH.indexOf(last[i] || 'A')));
    namePos = 0;
    scene = 'name';
  } else scene = 'over';
}

// ---------- scene updates ----------
const TITLE_ITEMS = ['endless', 'race', 'diff', 'board', 'lang', 'sound', 'launcher'];
let boardDiffI = 1;
function updateTitle(dt) {
  demoCam += 260 * dt;
  if (nav('up')) { menuI = (menuI + TITLE_ITEMS.length - 1) % TITLE_ITEMS.length; sfx.select(); }
  if (nav('down')) { menuI = (menuI + 1) % TITLE_ITEMS.length; sfx.select(); }
  const item = TITLE_ITEMS[menuI];
  if (item === 'diff') {
    if (nav('left')) { diffI = (diffI + 3) % 4; sfx.select(); }
    if (nav('right') || pressed('a')) { diffI = (diffI + 1) % 4; sfx.select(); }
    return;
  }
  if (pressed('b')) { sfx.select(); App.go('launcher'); return; }
  const lr = nav('left') || nav('right');
  if (pressed('a') || (lr && (item === 'lang' || item === 'sound'))) {
    if (item === 'launcher') { sfx.select(); App.go('launcher'); return; }
    if (item === 'endless') newGame('endless');
    else if (item === 'race') newGame('race');
    else if (item === 'board') { boardDiffI = diffI; scene = 'board'; sceneT = 0; sfx.confirm(); }
    else if (item === 'lang') { toggleLang(); sfx.select(); }
    else if (item === 'sound') { toggleMute(); sfx.confirm(); }
  }
}
function updateBoard(dt) {
  demoCam += 260 * dt;
  if (nav('left')) { boardDiffI = (boardDiffI + 3) % 4; sfx.select(); }
  if (nav('right')) { boardDiffI = (boardDiffI + 1) % 4; sfx.select(); }
  if (sceneT > 0.2 && (pressed('a') || pressed('b') || pressed('start'))) { scene = 'title'; sfx.select(); }
}
const PAUSE_ITEMS = ['resume', 'restart', 'menu'];
function updatePause() {
  if (nav('up')) { menuI = (menuI + 2) % 3; sfx.select(); }
  if (nav('down')) { menuI = (menuI + 1) % 3; sfx.select(); }
  if (pressed('start') || pressed('b')) { scene = 'play'; padLostMsg = false; return; }
  if (pressed('a')) {
    const it = PAUSE_ITEMS[menuI];
    if (it === 'resume') { scene = 'play'; padLostMsg = false; }
    else if (it === 'restart') newGame(G.mode);
    else { scene = 'title'; menuI = 0; sfx.select(); }
  }
}
function updateName(dt) {
  demoCam += 260 * dt;
  if (sceneT < 0.8) { typed = []; return; }
  for (const ch of typed) {
    const u = ch.toUpperCase();
    const i = NAME_CH.indexOf(u);
    if (i >= 0 && /[A-Z0-9]/.test(u)) { nameArr[namePos] = i; namePos = Math.min(2, namePos + 1); sfx.select(); }
  }
  if (nav('up')) { nameArr[namePos] = (nameArr[namePos] + 1) % NAME_CH.length; sfx.select(); }
  if (nav('down')) { nameArr[namePos] = (nameArr[namePos] + NAME_CH.length - 1) % NAME_CH.length; sfx.select(); }
  if (nav('left')) { namePos = Math.max(0, namePos - 1); sfx.select(); }
  if (nav('right')) { namePos = Math.min(2, namePos + 1); sfx.select(); }
  if (pressed('b')) { namePos = Math.max(0, namePos - 1); sfx.select(); }
  if (pressed('a')) {
    if (namePos < 2) { namePos++; sfx.select(); }
    else {
      const name = nameArr.map(i => NAME_CH[i]).join('');
      store.set('lastName', name);
      result.savedId = saveScore(result.mode, result.diff, name, result.score, result.extra);
      scene = 'over'; sceneT = 0; sfx.confirm();
    }
  }
}
function updateOver(dt) {
  demoCam += 260 * dt;
  if (sceneT > 1.0) {
    if (pressed('a')) { newGame(result.mode); return; }
    if (pressed('b') || pressed('start')) { scene = 'title'; menuI = 0; sfx.select(); return; }
  }
  // left alone for 45 s (visitor walked away): back to the title, reset to Normal
  if (performance.now() - lastInputT > 45000) { scene = 'title'; menuI = 0; diffI = 1; }
}

// ---------- drawing: world ----------
function drawBackground(cam, time) {
  ctx.fillStyle = sky(); ctx.fillRect(0, 0, W, GROUND);
  // big faint school logo, far away
  if (logoReady) {
    ctx.save(); ctx.globalAlpha = 0.07;
    const lx = 860 - ((cam * 0.02) % (W + 500) + (W + 500)) % (W + 500) + 500;
    ctx.drawImage(logo, lx, 40, 300, 300);
    ctx.restore();
  }
  // binary rain
  const ox = -(((cam * 0.15) % W) + W) % W;
  const oy = (time * 18) % 22;
  ctx.drawImage(binTile, ox, oy - 22, W, GROUND); ctx.drawImage(binTile, ox + W, oy - 22, W, GROUND);
  // server racks (parallax)
  const rc = cam * 0.45, step = 300;
  const i0 = Math.floor(rc / step) - 1;
  for (let i = i0; i < i0 + 7; i++) {
    const r = hsh(i);
    const x = i * step - rc + r * 60;
    const h = 200 + hsh(i + 99) * 190, w = 120 + hsh(i + 7) * 50;
    const y = GROUND - h;
    ctx.fillStyle = '#0d1640'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#1e2c6e'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    const units = Math.floor(h / 26);
    for (let u = 0; u < units; u++) {
      const uy = y + 8 + u * 26;
      ctx.fillStyle = '#121d52'; ctx.fillRect(x + 8, uy, w - 16, 18);
      for (let l = 0; l < 3; l++) {
        const on = Math.sin(time * (2 + hsh(i * 13 + u * 3 + l) * 6) + hsh(i + u + l) * 9) > 0.2;
        ctx.fillStyle = on ? (l === 2 ? '#ffb347' : '#5dffa0') : '#1b2a5c';
        ctx.fillRect(x + w - 16 - l * 9, uy + 7, 5, 4);
      }
    }
  }
  // vignette toward ground
  const fog = ctx.createLinearGradient(0, GROUND - 160, 0, GROUND);
  fog.addColorStop(0, 'rgba(10,16,48,0)'); fog.addColorStop(1, 'rgba(10,16,48,0.55)');
  ctx.fillStyle = fog; ctx.fillRect(0, GROUND - 160, W, 160);
}

function drawGround(cam, gaps, time) {
  const tw = pcbTile.width;
  const ox = -((cam % tw) + tw) % tw;
  for (let x = ox; x < W; x += tw) ctx.drawImage(pcbTile, x, GROUND, tw, H - GROUND);
  ctx.fillStyle = '#4fd8ff'; ctx.fillRect(0, GROUND - 2, W, 3);
  ctx.fillStyle = 'rgba(79,216,255,0.18)'; ctx.fillRect(0, GROUND + 1, W, 6);
  for (const g of gaps) {
    const x = g.x1 - cam, w = g.x2 - g.x1;
    if (x > W || x + w < 0) continue;
    const grd = ctx.createLinearGradient(0, GROUND, 0, H);
    grd.addColorStop(0, '#000'); grd.addColorStop(1, '#0a0410');
    ctx.fillStyle = grd; ctx.fillRect(x, GROUND - 3, w, H - GROUND + 3);
    ctx.fillStyle = '#ff3b5c'; ctx.fillRect(x - 2, GROUND - 2, 3, H - GROUND); ctx.fillRect(x + w - 1, GROUND - 2, 3, H - GROUND);
    ctx.globalAlpha = 0.35 + 0.15 * Math.sin(time * 4);
    txt('404', x + w / 2, GROUND + 60, 30, '#ff3b5c', 'center', '800', MONO);
    ctx.globalAlpha = 1;
  }
}

function drawPlat(pl, cam, time) {
  const x = pl.x - cam;
  if (x > W || x + pl.w < 0) return;
  ctx.fillStyle = '#0b1440'; rr(x, pl.y, pl.w, 16, 4); ctx.fill();
  ctx.strokeStyle = '#4fd8ff'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#4fd8ff';
  const n = Math.floor(pl.w / 30);
  for (let i = 0; i < n; i++) {
    const a = 0.25 + 0.75 * Math.max(0, Math.sin(time * 8 - i * 0.6));
    ctx.globalAlpha = a; ctx.fillRect(x + 10 + i * 30, pl.y + 6, 12, 4);
  }
  ctx.globalAlpha = 1;
}

function drawVirusBall(cx, cy, r, time, ph) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(time * 1.5 + ph);
  ctx.strokeStyle = '#6dff6d'; ctx.lineWidth = 4;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); ctx.lineTo(Math.cos(a) * (r + 6), Math.sin(a) * (r + 6)); ctx.stroke();
    ctx.fillStyle = '#b6ff6d'; ctx.beginPath(); ctx.arc(Math.cos(a) * (r + 7), Math.sin(a) * (r + 7), 3, 0, 7); ctx.fill();
  }
  ctx.restore();
  const g = ctx.createRadialGradient(cx - 6, cy - 6, 3, cx, cy, r);
  g.addColorStop(0, '#9dff7a'); g.addColorStop(1, '#1f9e3a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
  // angry eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(cx - 8, cy - 2, 6, 7, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 6, cy - 2, 6, 7, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#d1002f';
  ctx.beginPath(); ctx.arc(cx - 10, cy, 3, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 4, cy, 3, 0, 7); ctx.fill();
  ctx.strokeStyle = '#0d3d17'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx - 15, cy - 11); ctx.lineTo(cx - 3, cy - 6); ctx.moveTo(cx + 13, cy - 11); ctx.lineTo(cx + 1, cy - 6); ctx.stroke();
}

function drawObstacle(o, cam, time) {
  const x = o.x - cam;
  if (x > W + 50 || x + o.w < -50) return;
  if (o.kind === 'lag') {
    const n = Math.max(2, Math.round(o.w / 20)), sw = o.w / n;
    const g = ctx.createLinearGradient(0, o.t, 0, GROUND);
    g.addColorStop(0, '#ffd166'); g.addColorStop(1, '#ff3b5c');
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      ctx.moveTo(x + i * sw, GROUND); ctx.lineTo(x + i * sw + sw / 2, o.t - 4); ctx.lineTo(x + (i + 1) * sw, GROUND);
    }
    ctx.fill();
    if (o.w >= 80) txt('LAG', x + o.w / 2, o.t - 18, 14, '#ff8fa3', 'center', '800', MONO);
  } else if (o.kind === 'fire') {
    const h = GROUND - o.t;
    ctx.fillStyle = '#6e1a1a'; ctx.fillRect(x, o.t, o.w, h);
    ctx.strokeStyle = '#b8432d'; ctx.lineWidth = 2;
    for (let r = 0; r * 14 < h; r++) {
      const yy = o.t + r * 14;
      ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + o.w, yy); ctx.stroke();
      const off = r % 2 ? 0 : 10;
      for (let c = off; c < o.w; c += 20) { ctx.beginPath(); ctx.moveTo(x + c, yy); ctx.lineTo(x + c, Math.min(yy + 14, GROUND)); ctx.stroke(); }
    }
    for (let i = 0; i < 3; i++) {
      const fh = 18 + 10 * Math.sin(time * 12 + i * 2 + o.x);
      ctx.fillStyle = i === 1 ? '#ffd166' : '#ff7b39';
      ctx.beginPath(); ctx.moveTo(x + i * 13, o.t); ctx.quadraticCurveTo(x + i * 13 + 7, o.t - fh, x + i * 13 + 14, o.t); ctx.fill();
    }
  } else if (o.kind === 'virus' && o.mover) {
    // track showing the range it moves in
    ctx.strokeStyle = 'rgba(197,139,255,0.55)'; ctx.lineWidth = 3; ctx.setLineDash([5, 7]);
    ctx.beginPath(); ctx.moveTo(x + 28, GROUND - 142); ctx.lineTo(x + 28, GROUND - 4); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(197,139,255,0.8)';
    ctx.beginPath(); ctx.moveTo(x + 20, GROUND - 146); ctx.lineTo(x + 36, GROUND - 146); ctx.lineTo(x + 28, GROUND - 156); ctx.fill();
    drawVirusBall(x + 28, o.cy, 20, time, o.ph);
  } else if (o.kind === 'tunnel') {
    const top = GROUND - 300, bot = o.bt;
    ctx.fillStyle = '#18204d'; ctx.fillRect(x, top, o.w + 1, bot - top);
    // bundled cables
    const cols = ['#e0393e', '#f0c419', '#5cb531', '#2f7fe0', '#c58bff'];
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = cols[i]; ctx.lineWidth = 7;
      const yy = bot - 22 - i * 9;
      ctx.beginPath(); ctx.moveTo(x, yy + Math.sin((o.x) / 60 + i) * 3);
      ctx.quadraticCurveTo(x + o.w / 2, yy + Math.sin((o.x + 60) / 60 + i) * 6, x + o.w, yy + Math.sin((o.x + 120) / 60 + i) * 3);
      ctx.stroke();
    }
    ctx.fillStyle = '#0f163a';
    for (let yy = top + 20; yy < bot - 70; yy += 40) ctx.fillRect(x + 6, yy, o.w - 12, 22);
    // hazard stripe on the lower edge
    ctx.save(); ctx.beginPath(); ctx.rect(x, bot - 8, o.w + 1, 8); ctx.clip();
    ctx.fillStyle = '#f0c419'; ctx.fillRect(x, bot - 8, o.w + 1, 8);
    ctx.fillStyle = '#111';
    for (let s = -20; s < o.w + 20; s += 20) { ctx.beginPath(); ctx.moveTo(x + s, bot); ctx.lineTo(x + s + 10, bot - 8); ctx.lineTo(x + s + 20, bot - 8); ctx.lineTo(x + s + 10, bot); ctx.fill(); }
    ctx.restore();
    if (o.first) {
      ctx.fillStyle = '#4fd8ff'; ctx.fillRect(x - 3, top, 4, bot - top);
      drawPadBtn(x + 30, top - 30, 'B', BTN.B, 16);
      txt('↓', x + 58, top - 29, 24, '#ffffff', 'center', '900');
    }
    if (o.last) { ctx.fillStyle = '#4fd8ff'; ctx.fillRect(x + o.w - 1, top, 4, bot - top); }
  } else if (o.kind === 'laser') {
    const cx = x + 7;
    // emitter (sunk into the ground) and tip
    ctx.fillStyle = '#2a2f4a'; ctx.fillRect(cx - 13, GROUND - 6, 26, 14);
    ctx.fillStyle = o.on ? '#ff3b5c' : o.warn ? '#ffb347' : '#5a3040';
    ctx.fillRect(cx - 9, GROUND - 10, 18, 5);
    if (o.on) {
      ctx.save();
      ctx.shadowColor = '#ff3b5c'; ctx.shadowBlur = 20;
      ctx.fillStyle = 'rgba(255,59,92,0.35)'; ctx.fillRect(cx - 7, o.t, 14, GROUND - 10 - o.t);
      ctx.fillStyle = '#ffd0d8'; ctx.fillRect(cx - 2, o.t, 4, GROUND - 10 - o.t);
      ctx.restore();
      ctx.fillStyle = '#ff3b5c'; ctx.beginPath(); ctx.arc(cx, o.t, 6 + Math.sin(time * 30) * 1.5, 0, 7); ctx.fill();
    } else {
      ctx.strokeStyle = o.warn && Math.floor(time * 20) % 2 ? 'rgba(255,179,71,0.9)' : 'rgba(255,59,92,0.25)';
      ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(cx, GROUND - 10); ctx.lineTo(cx, o.t); ctx.stroke(); ctx.setLineDash([]);
    }
    // height marker so players can see how high they must jump
    ctx.strokeStyle = 'rgba(255,59,92,0.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 10, o.t); ctx.lineTo(cx + 10, o.t); ctx.stroke();
  } else if (o.kind === 'virus') {
    const bob = Math.sin(time * 5 + o.ph) * 3;
    if (o.tall) {
      drawVirusBall(x + 28, o.bt - 30 + bob, 22, time, o.ph);
      drawVirusBall(x + 28, o.t + 30 - bob, 22, time, o.ph + 1);
      ctx.strokeStyle = 'rgba(109,255,109,0.5)'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.moveTo(x + 28, o.t + 52); ctx.lineTo(x + 28, o.bt - 48); ctx.stroke(); ctx.setLineDash([]);
    } else {
      drawVirusBall(x + 28, o.bt - 28 + bob, 22, time, o.ph);
    }
  }
}

function drawItem(it, cam, time) {
  const x = it.x - cam;
  if (x < -40 || x > W + 40) return;
  const bob = Math.sin(time * 4 + it.ph) * 4;
  if (it.kind === 'bit') {
    ctx.drawImage(bitSprites[it.ch], x - 22, it.y - 22 + bob, 44, 44);
  } else if (it.kind === 'shield') {
    const y = it.y + bob;
    ctx.save(); ctx.shadowColor = '#7fd4ff'; ctx.shadowBlur = 16;
    ctx.fillStyle = '#1b4fa0'; ctx.strokeStyle = '#bfe8ff'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - 22); ctx.lineTo(x + 18, y - 14); ctx.lineTo(x + 16, y + 6); ctx.quadraticCurveTo(x + 10, y + 18, x, y + 24);
    ctx.quadraticCurveTo(x - 10, y + 18, x - 16, y + 6); ctx.lineTo(x - 18, y - 14); ctx.closePath();
    ctx.fill(); ctx.stroke(); ctx.restore();
    txt('AV', x, y + 1, 14, '#ffffff', 'center', '800');
  } else {
    const y = it.y + bob;
    ctx.save(); ctx.shadowColor = '#c58bff'; ctx.shadowBlur = 16;
    ctx.fillStyle = '#3a1a6e'; ctx.beginPath(); ctx.arc(x, y, 22, 0, 7); ctx.fill();
    ctx.strokeStyle = '#e2c6ff'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(x, y + 9, i * 6, -Math.PI * 0.78, -Math.PI * 0.22); ctx.stroke(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y + 9, 2.5, 0, 7); ctx.fill();
    ctx.lineCap = 'butt';
  }
}

function drawPacket(sx, bottom, slide, squash, vy, onGround, dist, alpha, shield, time) {
  const h0 = slide ? PHS : PH;
  const w = PW + squash * 8 + (slide ? 8 : 0), h = h0 - squash * 6;
  const bob = onGround && !slide ? -Math.abs(Math.sin(dist / 38)) * 3 : 0;
  const x = sx - (w - PW) / 2, y = bottom - h + bob;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(onGround ? 0 : clamp(vy / 3000, -0.25, 0.25));
  ctx.translate(-w / 2, -h / 2);
  ctx.shadowColor = '#4fd8ff'; ctx.shadowBlur = 18;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#8ff0ff'); g.addColorStop(1, '#1d8fd6');
  ctx.fillStyle = g; rr(0, 0, w, h, 8); ctx.fill();
  ctx.shadowBlur = 0;
  // header stripe (packet header)
  ctx.fillStyle = 'rgba(10,40,90,0.55)'; rr(0, 0, w, Math.min(10, h * 0.35), 6); ctx.fill();
  ctx.fillStyle = '#ffd84d'; ctx.fillRect(5, 3, 8, 3); ctx.fillRect(16, 3, 5, 3);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; rr(0, 0, w, h, 8); ctx.stroke();
  // eyes
  const ey = slide ? h * 0.55 : h * 0.52;
  const blink = (Math.floor(time * 10) % 37) === 0;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(w - 17, ey, 5, blink ? 1 : 6.5, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(w - 6.5, ey, 4.5, blink ? 1 : 6, 0, 0, 7); ctx.fill();
  if (!blink) {
    ctx.fillStyle = '#0a1a3a';
    ctx.beginPath(); ctx.arc(w - 15, ey + 1, 2.8, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(w - 5, ey + 1, 2.5, 0, 7); ctx.fill();
  }
  ctx.restore();
  if (shield) {
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.2 * Math.sin(time * 6);
    ctx.strokeStyle = '#9fdcff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(sx + PW / 2, bottom - h0 / 2, PW * 0.9, h0 * 0.5 + 18, 0, 0, 7); ctx.stroke();
    ctx.globalAlpha *= 0.25; ctx.fillStyle = '#7fd4ff'; ctx.fill();
    ctx.restore();
  }
}

function drawServer(cam, time, done) {
  const x = RACE_LEN - cam;
  if (x > W + 40 || x + 260 < 0) return;
  const w = 250, h = 380, y = GROUND - h;
  ctx.save();
  ctx.shadowColor = done ? '#7dff9b' : '#4fd8ff'; ctx.shadowBlur = 30;
  ctx.fillStyle = '#111c4e'; rr(x, y, w, h, 10); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = done ? '#7dff9b' : '#4fd8ff'; ctx.lineWidth = 3; rr(x, y, w, h, 10); ctx.stroke();
  for (let u = 0; u < 4; u++) {
    const uy = y + 214 + u * 38;
    ctx.fillStyle = '#0a1238'; ctx.fillRect(x + 14, uy, w - 28, 28);
    for (let l = 0; l < 6; l++) {
      const on = done ? Math.sin(time * 12 + l + u) > -0.3 : Math.sin(time * (3 + l) + u * 2) > 0;
      ctx.fillStyle = on ? (done ? '#7dff9b' : '#4fd8ff') : '#1b2a5c';
      ctx.fillRect(x + w - 30 - l * 14, uy + 11, 8, 6);
    }
  }
  // port the packet enters
  ctx.fillStyle = '#000'; ctx.fillRect(x - 4, GROUND - 56, 14, 56);
  ctx.fillStyle = done ? '#7dff9b' : '#ffd84d'; ctx.fillRect(x - 6, GROUND - 58, 4, 58);
  if (logoReady) ctx.drawImage(logo, x + w / 2 - 80, y + 18, 160, 160);
  txt(tr('server'), x + w / 2, y + 196, 17, '#cfe9ff', 'center', '800');
}

function drawFx(cam) {
  for (const p of G.parts) {
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    ctx.fillStyle = p.c;
    ctx.fillRect(p.x - cam - p.s / 2, p.y - p.s / 2, p.s, p.s);
  }
  ctx.globalAlpha = 1;
  for (const t of G.texts) {
    ctx.globalAlpha = clamp(t.life, 0, 1);
    glowTxt(t.str, t.x - cam, t.y, 26, t.color, t.color, 'center', '900');
  }
  ctx.globalAlpha = 1;
}

function drawGame(time) {
  let sx = 0, sy = 0;
  if (G.shake > 0) { sx = rnd(-8, 8) * G.shake * 2; sy = rnd(-8, 8) * G.shake * 2; }
  ctx.save(); ctx.translate(sx, sy);
  const cam = G.cam;
  drawBackground(cam, time);
  drawGround(cam, G.gaps, time);
  if (G.mode === 'race') drawServer(cam, time, G.done);
  for (const pl of G.plats) drawPlat(pl, cam, time);
  for (const o of G.obs) drawObstacle(o, cam, time);
  for (const it of G.items) if (!it.got) drawItem(it, cam, time);
  const p = G.p;
  if (!p.hidden) {
    const alpha = G.inv > 0 && Math.floor(G.inv * 14) % 2 === 0 ? 0.35 : 1;
    drawPacket(p.x - cam, p.b, p.slide, p.squash, p.vy, p.on, G.dist, alpha, G.shield > 0, time);
  }
  drawFx(cam);
  ctx.restore();
  drawHUD(time);
}

// ---------- HUD ----------
function drawPadBtn(x, y, label, color, r = 13) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.stroke();
  txt(label, x, y + 1, r * 1.1, '#fff', 'center', '900');
}
const BTN = { A: '#5cb531', B: '#e0393e', X: '#2f7fe0', Y: '#f0c419' };

function panel(x, y, w, h, a = 0.55) {
  ctx.fillStyle = `rgba(6,10,32,${a})`; rr(x, y, w, h, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(79,216,255,0.35)'; ctx.lineWidth = 2; ctx.stroke();
}

function drawHUD(time) {
  const p = G.p;
  if (G.mode === 'endless') {
    const score = Math.floor(G.dist / 20) + G.bits * 10;
    panel(20, 18, 300, 92);
    txt(tr('score'), 40, 40, 15, '#8fb6ff', 'left', '700');
    txt(String(score), 40, 74, 38, '#ffffff', 'left', '900', MONO);
    txt(tr('lives'), 196 + (G.maxLives * 26 - 6) / 2, 40, 15, '#8fb6ff', 'center', '700');
    for (let i = 0; i < G.maxLives; i++) {
      const lx = 196 + i * 26, ly = 62;
      ctx.fillStyle = i < G.lives ? '#4fd8ff' : 'rgba(79,216,255,0.15)';
      rr(lx, ly, 20, 20, 5); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    panel(W - 250, 18, 230, 92);
    txt(tr('bits'), W - 230, 40, 15, '#8fb6ff', 'left', '700');
    ctx.drawImage(bitSprites['1'], W - 238, 54, 40, 40);
    txt(String(G.bits), W - 190, 74, 32, '#ffd84d', 'left', '900', MONO);
    txt(`${Math.floor(G.dist / 100)} ${tr('kb')}`, W - 40, 40, 15, '#cfe9ff', 'right', '700', MONO);
  } else {
    panel(20, 18, 230, 92);
    txt(tr('bits'), 40, 40, 15, '#8fb6ff', 'left', '700');
    ctx.drawImage(bitSprites['1'], 32, 54, 40, 40);
    txt(String(G.bits), 80, 74, 32, '#ffd84d', 'left', '900', MONO);
    panel(W - 250, 18, 230, 92);
    txt(tr('time'), W - 230, 40, 15, '#8fb6ff', 'left', '700');
    txt(fmtTime(G.done ? G.finalT : G.t), W - 230, 74, 34, '#ffffff', 'left', '900', MONO);
    // progress bar to the server
    const bx = 330, bw = W - 660, by = 52;
    const f = clamp(p.x / RACE_LEN, 0, 1);
    panel(bx - 20, 18, bw + 40, 92);
    txt(tr('server'), bx + bw, 36, 13, '#8fb6ff', 'right', '700');
    ctx.fillStyle = '#0b1440'; rr(bx, by + 6, bw, 14, 7); ctx.fill();
    const pg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    pg.addColorStop(0, '#1d8fd6'); pg.addColorStop(1, '#7dff9b');
    ctx.fillStyle = pg; rr(bx, by + 6, Math.max(14, bw * f), 14, 7); ctx.fill();
    ctx.fillStyle = '#4fd8ff'; rr(bx + bw * f - 9, by + 2, 18, 22, 5); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#1b2a5c'; ctx.fillRect(bx + bw - 6, by - 2, 12, 30);
    ctx.strokeStyle = '#7dff9b'; ctx.strokeRect(bx + bw - 6, by - 2, 12, 30);
    txt(Math.floor(f * 100) + '%', bx, 36, 13, '#cfe9ff', 'left', '700', MONO);
  }
  // difficulty badge
  txt(tr(G.diff), W - 30, 130, 16, DIFF_COL[G.diff], 'right', '900');
  // power-up indicators
  let px = 30;
  if (G.shield > 0) { panel(px - 10, 122, 150, 38, 0.5); txt('🛡 ' + (lang === 'hu' ? 'PAJZS' : 'SHIELD'), px + 65, 141, 16, '#9fdcff', 'center', '800'); px += 160; }
  if (G.magnet > 0) {
    panel(px - 10, 122, 150, 38, 0.5);
    txt((lang === 'hu' ? 'MÁGNES ' : 'MAGNET ') + Math.ceil(G.magnet) + 's', px + 65, 141, 16, '#e2c6ff', 'center', '800');
  }
  // countdown
  if (G.count > 0) {
    const n = Math.ceil(G.count), fr = G.count - Math.floor(G.count);
    glowTxt(String(n), W / 2, H / 2 - 60, 120 + fr * 40, '#ffffff', '#4fd8ff', 'center', '900');
    txt(tr(G.diff), W / 2, H / 2 - 150, 26, DIFF_COL[G.diff], 'center', '900');
    txt(tr('tip'), W / 2, H / 2 + 40, 22, '#cfe9ff', 'center', '600');
    drawControlsHint(H / 2 + 86);
  } else if (G.goT > 0) {
    ctx.globalAlpha = clamp(G.goT / 0.8, 0, 1);
    glowTxt(tr('go'), W / 2, H / 2 - 60, 120, '#7dff9b', '#2ad16b', 'center', '900');
    ctx.globalAlpha = 1;
  }
  if (G.done) {
    glowTxt(tr('finished'), W / 2, H / 2 - 120, 64, '#7dff9b', '#2ad16b', 'center', '900');
  }
}

function drawControlsHint(y) {
  ctx.font = `600 18px ${FONT}`;
  const parts = [
    ['A', BTN.A, '/ SPACE ' + tr('jump')],
    ['B', BTN.B, '/ ↓ ' + tr('slide')],
    ['≡', '#555c78', 'START / ESC ' + tr('pause')]
  ];
  let total = 0;
  const widths = parts.map(([, , s]) => { ctx.font = `600 18px ${FONT}`; const w = ctx.measureText(s).width; total += 30 + w + 34; return w; });
  let x = W / 2 - total / 2 + 13;
  parts.forEach(([l, c, s], i) => {
    drawPadBtn(x, y, l, c, 13);
    txt(s, x + 20, y + 1, 18, '#cfe9ff', 'left', '600');
    x += 30 + widths[i] + 34;
  });
}

// ---------- drawing: menus ----------
function dim(a) { ctx.fillStyle = `rgba(4,7,22,${a})`; ctx.fillRect(0, 0, W, H); }

function drawMenuBackdrop(time) {
  drawBackground(demoCam, time);
  drawGround(demoCam, [], time);
  // a demo packet running along
  drawPacket(PX, GROUND, false, 0, 0, true, demoCam, 1, false, time);
  dim(0.55);
}

function drawPadStatus(y) {
  const on = I.pad;
  ctx.fillStyle = on ? '#5dffa0' : '#ffb347';
  ctx.beginPath(); ctx.arc(W / 2 - (on ? 120 : 190), y, 6, 0, 7); ctx.fill();
  txt(on ? tr('padOn') : tr('padOff'), W / 2 - (on ? 106 : 176), y + 1, 17, on ? '#bfffd6' : '#ffd9a8', 'left', '600');
}

function drawTitle(time) {
  drawMenuBackdrop(time);
  if (logoReady) {
    ctx.save(); ctx.shadowColor = '#4fd8ff'; ctx.shadowBlur = 25;
    ctx.drawImage(logo, W / 2 - 72, 14, 144, 144);
    ctx.restore();
  }
  glowTxt('PACKET RUNNER', W / 2, 212, 70, '#ffffff', '#4fd8ff', 'center', '900');
  txt(tr('subtitle'), W / 2, 260, 23, '#cfe9ff', 'center', '600');
  txt(tr('school'), W / 2, 290, 18, '#8fb6ff', 'center', '600');
  const dk = curDiff();
  const labels = {
    endless: tr('endless'), race: tr('race'), diff: `${tr('diffItem')}: ${tr(dk)}`, board: tr('board'),
    lang: tr('langItem'), sound: muted ? tr('soundOff') : tr('soundOn'), launcher: tr('toLauncher')
  };
  const descs = { endless: tr('endlessDesc'), race: tr('raceDesc'), diff: tr('diffDesc_' + dk), board: tr('boardDesc'), lang: tr('langDesc'), sound: tr('soundDesc'), launcher: tr('toLauncherDesc') };
  TITLE_ITEMS.forEach((it, i) => {
    const y = 328 + i * 38, sel = i === menuI;
    if (sel) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 6);
      ctx.fillStyle = `rgba(79,216,255,${0.16 + 0.08 * pulse})`; rr(W / 2 - 250, y - 17, 500, 34, 10); ctx.fill();
      ctx.strokeStyle = '#4fd8ff'; ctx.lineWidth = 2; ctx.stroke();
      txt('▶', W / 2 - 228, y + 1, 18, '#4fd8ff', 'center', '900');
    }
    if (it === 'diff' || (sel && (it === 'lang' || it === 'sound'))) {
      txt('◀', W / 2 - 175, y + 1, 14, sel ? '#ffffff' : '#8fb6ff'); txt('▶', W / 2 + 175, y + 1, 14, sel ? '#ffffff' : '#8fb6ff');
    }
    const col = it === 'diff' ? DIFF_COL[dk] : sel ? '#ffffff' : '#9fb3e0';
    txt(labels[it], W / 2, y + 1, sel ? 23 : 20, col, 'center', sel ? '900' : '700');
  });
  txt(descs[TITLE_ITEMS[menuI]], W / 2, 604, 19, '#ffd84d', 'center', '600');
  drawControlsHint(656);
  drawPadStatus(696);
}

function drawBoardList(mode, diff, x, y, highlightId) {
  const b = board(mode, diff);
  txt(mode === 'endless' ? tr('endless') : tr('race'), x, y, 24, '#4fd8ff', 'center', '900');
  if (!b.length) { txt(tr('empty'), x, y + 60, 18, '#8fb6ff', 'center', '600'); return; }
  b.forEach((e, i) => {
    const yy = y + 44 + i * 30, hl = e.id === highlightId;
    if (hl) { ctx.fillStyle = 'rgba(255,216,77,0.18)'; rr(x - 200, yy - 14, 400, 28, 6); ctx.fill(); }
    const col = hl ? '#ffd84d' : i === 0 ? '#ffffff' : '#cfe9ff';
    txt(`${i + 1}.`, x - 170, yy, 18, col, 'right', '700', MONO);
    txt(String(e.n), x - 150, yy, 19, col, 'left', '800', MONO);
    const extra = mode === 'endless' ? `${e.x} ${tr('kb')}` : fmtTime(Number(e.x) || 0);
    txt(extra, x + 30, yy, 16, '#8fb6ff', 'center', '600', MONO);
    txt(String(e.s), x + 180, yy, 19, col, 'right', '800', MONO);
  });
}

function drawBoardScene(time) {
  drawMenuBackdrop(time);
  dim(0.3);
  glowTxt(tr('boardTitle'), W / 2, 56, 50, '#ffffff', '#4fd8ff', 'center', '900');
  const bd = DIFF_KEYS[boardDiffI];
  txt('◀', W / 2 - 130, 108, 18, '#ffffff'); txt('▶', W / 2 + 130, 108, 18, '#ffffff');
  txt(tr(bd), W / 2, 108, 26, DIFF_COL[bd], 'center', '900');
  panel(70, 140, 540, 460, 0.6); panel(670, 140, 540, 460, 0.6);
  drawBoardList('endless', bd, 340, 172, null);
  drawBoardList('race', bd, 940, 172, null);
  txt(tr('boardHint'), W / 2 - 60, 650, 18, '#8fb6ff', 'right', '600');
  drawPadBtn(W / 2 + 10, 650, 'B', BTN.B); txt(tr('back'), W / 2 + 30, 651, 20, '#cfe9ff', 'left', '600');
}

function drawPause(time) {
  drawGame(time);
  dim(0.65);
  glowTxt(tr('paused'), W / 2, 200, 64, '#ffffff', '#4fd8ff', 'center', '900');
  if (padLostMsg) txt(tr('padLost'), W / 2, 260, 24, '#ffb347', 'center', '700');
  PAUSE_ITEMS.forEach((it, i) => {
    const y = 330 + i * 56, sel = i === menuI;
    if (sel) { ctx.fillStyle = 'rgba(79,216,255,0.2)'; rr(W / 2 - 180, y - 22, 360, 44, 10); ctx.fill(); ctx.strokeStyle = '#4fd8ff'; ctx.lineWidth = 2; ctx.stroke(); }
    txt(tr(it), W / 2, y + 1, sel ? 28 : 24, sel ? '#fff' : '#9fb3e0', 'center', sel ? '900' : '700');
  });
  drawPadStatus(600);
}

function drawResultHeader() {
  const r = result;
  const title = r.win ? tr('finished') : tr('gameOver');
  glowTxt(title, W / 2, 70, 54, r.win ? '#7dff9b' : '#ff6b81', r.win ? '#2ad16b' : '#ff3b5c', 'center', '900');
  if (!r.win && r.cause) txt(tr('cause_' + r.cause), W / 2, 116, 20, '#ffb3c0', 'center', '600');
  txt(tr(r.diff), W / 2 + 330, 170, 22, DIFF_COL[r.diff], 'left', '900');
  glowTxt(String(r.score), W / 2, 170, 64, '#ffffff', '#4fd8ff', 'center', '900', MONO);
  let line;
  if (r.mode === 'endless') line = `${tr('dist')}: ${r.extra} ${tr('kb')}   ·   ${tr('bits')}: ${r.bits} × 10`;
  else line = `${tr('time')}: ${fmtTime(r.time)}   ·   ${tr('timeBonus')}: ${r.bonus}   ·   ${tr('bits')}: ${r.bits} × 10`;
  txt(line, W / 2, 216, 19, '#cfe9ff', 'center', '600', MONO);
}

function drawName(time) {
  drawMenuBackdrop(time);
  drawResultHeader();
  glowTxt(tr('newHigh'), W / 2, 300, 32, '#ffd84d', '#ffb000', 'center', '900');
  for (let i = 0; i < 3; i++) {
    const x = W / 2 - 120 + i * 120, y = 410, sel = i === namePos;
    ctx.fillStyle = sel ? 'rgba(79,216,255,0.25)' : 'rgba(6,10,32,0.7)';
    rr(x - 45, y - 55, 90, 110, 12); ctx.fill();
    ctx.strokeStyle = sel ? '#4fd8ff' : 'rgba(79,216,255,0.3)'; ctx.lineWidth = sel ? 3 : 2; ctx.stroke();
    txt(NAME_CH[nameArr[i]], x, y + 4, 70, '#fff', 'center', '900', MONO);
    if (sel) {
      const b = Math.sin(time * 8) * 3;
      txt('▲', x, y - 72 - b, 20, '#4fd8ff'); txt('▼', x, y + 76 + b, 20, '#4fd8ff');
    }
  }
  txt(tr('nameHint'), W / 2, 540, 19, '#cfe9ff', 'center', '600');
  if (sceneT < 0.8) { ctx.globalAlpha = 0.5; }
  drawPadBtn(W / 2 - 30, 600, 'A', BTN.A, 15);
  txt('OK', W / 2 - 8, 601, 20, '#fff', 'left', '800');
  ctx.globalAlpha = 1;
}

function drawOver(time) {
  drawMenuBackdrop(time);
  drawResultHeader();
  panel(W / 2 - 260, 250, 520, 360, 0.6);
  drawBoardList(result.mode, result.diff, W / 2, 276, result.savedId);
  glowTxt(tr('cta'), W / 2, 642, 24, '#ffd84d', '#ff9f00', 'center', '800');
  ctx.globalAlpha = sceneT > 1.0 ? 1 : 0.4;
  drawPadBtn(W / 2 - 170, 690, 'A', BTN.A); txt(tr('again'), W / 2 - 150, 691, 19, '#cfe9ff', 'left', '600');
  drawPadBtn(W / 2 + 50, 690, 'B', BTN.B); txt(tr('toMenu'), W / 2 + 70, 691, 19, '#cfe9ff', 'left', '600');
  ctx.globalAlpha = 1;
}

// ---------- module interface ----------
function update(dt) {
  sceneT += dt;
  const prevScene = scene;
  if (scene === 'title') updateTitle(dt);
  else if (scene === 'board') updateBoard(dt);
  else if (scene === 'play') updatePlay(dt);
  else if (scene === 'pause') updatePause(dt);
  else if (scene === 'name') updateName(dt);
  else if (scene === 'over') updateOver(dt);
  if (scene !== prevScene) sceneT = 0;
}
function draw(time) {
  if (scene === 'title') drawTitle(time);
  else if (scene === 'board') drawBoardScene(time);
  else if (scene === 'play') drawGame(time);
  else if (scene === 'pause') drawPause(time);
  else if (scene === 'name') drawName(time);
  else if (scene === 'over') drawOver(time);
  document.body.style.cursor = scene === 'play' ? 'none' : 'default';
}
function enter() { scene = 'title'; menuI = 0; sceneT = 0; }
function onHide() { if (scene === 'play' && G && !G.dead && !G.done) { scene = 'pause'; menuI = 0; } }

window.__pr = {
  get scene() { return scene; }, get G() { return G; }, newGame, RACE_LEN,
  set force(k) { forcePat = k; }, set diff(i) { diffI = i; }, get diff() { return diffI; }
};
return { enter, update, draw, onHide, blockHotkeys: () => scene === 'name', txt: TXT,
  // shown on the launcher card
  card: { title: 'PACKET RUNNER', hu: 'Ugrálós futójáték: juttasd el az adatcsomagot a suli szerverére!', en: 'Runner: deliver the data packet to the school server!' } };
})();
App.register('packet', PacketRunner);
