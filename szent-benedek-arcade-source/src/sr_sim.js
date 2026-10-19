// =====================================================================
//  SERVER ROOM PANIC — simulation (pure game logic, no drawing, no DOM)
//  Units are tiles (1 tile = 1 metre-ish). A 3D renderer can reuse this
//  module unchanged: it only needs to draw state.grid / devices / player.
// =====================================================================
const SRSim = (() => {
  const COLS = 32, ROWS = 16;
  const DAY_LEN = 120;           // seconds for 8:00 -> 14:00
  const HOURS = 6;
  const PLAYER_R = 0.32;
  const PLAYER_SPEED = 6.2;      // tiles / s
  const REACH = 0.62;            // max distance from player edge to a device rect

  // per device type: base fix time (s), health drain (%/s), points, part needed
  const TYPES = {
    server:  { fix: 2.0, drain: 1.6, pts: 150, part: 'fan',     mini: 'hold' },
    switch:  { fix: 1.3, drain: 1.3, pts: 120, part: 'cable',   mini: 'spin' },
    wifi:    { fix: 1.5, drain: 1.1, pts: 120, part: 'antenna', mini: 'timing' },
    pc:      { fix: 1.6, drain: 0.8, pts: 100, part: 'usb',     mini: 'combo' },
    printer: { fix: 1.2, drain: 0.6, pts: 80,  part: 'paper',   mini: 'mash' }
  };
  const PARTS = ['fan', 'cable', 'antenna', 'usb', 'paper'];

  // difficulty: break interval at start/end of the day (s), drain multiplier,
  // fix-time multiplier, seconds until a broken device turns critical, devices
  // breaking at each bell, mini-game settings, carry capacity (parts mode)
  const DIFF = {
    easy:   { int0: 9.0, int1: 6.0, drain: 0.14, fixMul: 0.8,  crit: 25, rush: 2, mash: 6,  spin: 1.5, combo: 3, zone: 0.30, needle: 0.8,  hits: 2, cap: 2, wrongReset: false },
    normal: { int0: 7.5, int1: 4.6, drain: 0.20, fixMul: 1.0,  crit: 20, rush: 2, mash: 8,  spin: 2.0, combo: 4, zone: 0.22, needle: 1.0,  hits: 2, cap: 1, wrongReset: true },
    hard:   { int0: 7.4, int1: 4.7, drain: 0.24, fixMul: 1.15, crit: 16, rush: 3, mash: 10, spin: 2.5, combo: 5, zone: 0.17, needle: 1.25, hits: 2, cap: 1, wrongReset: true },
    insane: { int0: 6.6, int1: 4.2, drain: 0.24, fixMul: 1.3,  crit: 14, rush: 3, mash: 12, spin: 3.0, combo: 6, zone: 0.13, needle: 1.5,  hits: 3, cap: 1, wrongReset: true }
  };
  // modes that take longer per fix get fewer breakdowns so they stay comparable
  const MODE_INT = { simple: 1.0, mini: 1.2, parts: 2.0 };
  // ...and fewer simultaneous breakdowns at each bell
  const MODE_RUSH = { simple: 0, mini: 0, parts: -1 };
  // what breaks at each bell: 9 log-in rush (PCs), 10 test printing, 11 IT lesson (PCs), 12 lunch Wi-Fi, 13 random
  const RUSH_PREF = { 9: 'pc', 10: 'printer', 11: 'pc', 12: 'wifi', 13: null };

  // ---------- seeded random ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // ---------- map generation ----------
  // grid values: 0 floor, 1 wall, 2 object
  const SPAWN = { c: 16, r: 14 };
  function generateMap(rand, mode) {
    const ri = (a, b) => a + Math.floor(rand() * (b - a + 1));
    for (let attempt = 0; attempt < 400; attempt++) {
      const grid = [];
      for (let r = 0; r < ROWS; r++) {
        grid.push([]);
        for (let c = 0; c < COLS; c++) grid[r].push(r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1 ? 1 : 0);
      }
      const objs = [];     // placed objects (for spacing checks)
      const devices = [];
      const bins = [];
      const decor = [];
      // area kept clear around the entrance
      const reserved = { c: SPAWN.c - 2, r: SPAWN.r - 2, w: 5, h: 3 };
      const overlaps = (a, b, m) => a.c - m < b.c + b.w && a.c + a.w + m > b.c && a.r - m < b.r + b.h && a.r + a.h + m > b.r;

      function place(w, h, needAccess) {
        for (let tries = 0; tries < 60; tries++) {
          const rect = { c: ri(1, COLS - 1 - w), r: ri(1, ROWS - 1 - h), w, h };
          if (overlaps(rect, reserved, 0)) continue;
          if (objs.some(o => overlaps(rect, o, 1))) continue;
          // access side: a row above or below that is inside the room
          let side = rand() < 0.5 ? 'down' : 'up';
          const ok = s => s === 'down' ? rect.r + h <= ROWS - 2 : rect.r - 1 >= 1;
          if (needAccess && !ok(side)) side = side === 'down' ? 'up' : 'down';
          if (needAccess && !ok(side)) continue;
          rect.side = side;
          objs.push(rect);
          for (let r = rect.r; r < rect.r + h; r++) for (let c = rect.c; c < rect.c + w; c++) grid[r][c] = 2;
          return rect;
        }
        return null;
      }

      let fail = false;
      let id = 0;
      const addDev = (type, c, r, w, h, side) => devices.push({ id: id++, type, c, r, w, h, side, status: 'ok', brokenT: 0, prog: 0, cooldown: 0 });
      // server rack rows
      const rows = ri(2, 3);
      for (let i = 0; i < rows && !fail; i++) {
        const k = ri(3, 5), rect = place(k, 1, true);
        if (!rect) { fail = true; break; }
        for (let j = 0; j < k; j++) addDev('server', rect.c + j, rect.r, 1, 1, rect.side);
      }
      const singles = [['switch', 2], ['wifi', 2], ['printer', 2]];
      for (const [type, n] of singles) for (let i = 0; i < n && !fail; i++) {
        const rect = place(1, 1, true);
        if (!rect) { fail = true; break; }
        addDev(type, rect.c, rect.r, 1, 1, rect.side);
      }
      const desks = ri(4, 5);
      for (let i = 0; i < desks && !fail; i++) {
        const rect = place(2, 1, true);
        if (!rect) { fail = true; break; }
        addDev('pc', rect.c, rect.r, 2, 1, rect.side);
      }
      if (mode === 'parts' && !fail) {
        // two shelf units holding the five part types
        const order = PARTS.slice().sort(() => rand() - 0.5);
        const split = [order.slice(0, 3), order.slice(3)];
        for (const parts of split) {
          const rect = place(parts.length, 1, true);
          if (!rect) { fail = true; break; }
          parts.forEach((p, j) => bins.push({ part: p, c: rect.c + j, r: rect.r, w: 1, h: 1, side: rect.side }));
        }
      }
      // a few plants / cabinets for looks (they also block movement)
      const nDecor = ri(2, 4);
      for (let i = 0; i < nDecor && !fail; i++) {
        const rect = place(1, 1, false);
        if (rect) decor.push({ kind: rand() < 0.6 ? 'plant' : 'cabinet', c: rect.c, r: rect.r });
      }
      if (fail) continue;

      // every device and bin must be reachable from the entrance
      const dist = bfs(grid, SPAWN.c, SPAWN.r);
      const reachable = o => accessTiles(grid, o).some(([c, r]) => dist[r][c] >= 0);
      if (!devices.every(reachable) || !bins.every(reachable)) continue;
      return { grid, devices, bins, decor, attempts: attempt + 1 };
    }
    throw new Error('map generation failed');
  }

  function bfs(grid, sc, sr) {
    const dist = grid.map(row => row.map(() => -1));
    const q = [[sc, sr]]; dist[sr][sc] = 0;
    for (let i = 0; i < q.length; i++) {
      const [c, r] = q[i];
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc, nr = r + dr;
        if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS) continue;
        if (grid[nr][nc] !== 0 || dist[nr][nc] >= 0) continue;
        dist[nr][nc] = dist[r][c] + 1;
        q.push([nc, nr]);
      }
    }
    return dist;
  }
  // free tiles touching an object (any side)
  function accessTiles(grid, o) {
    const out = [];
    for (let c = o.c - 1; c <= o.c + o.w; c++) for (let r = o.r - 1; r <= o.r + o.h; r++) {
      const inside = c >= o.c && c < o.c + o.w && r >= o.r && r < o.r + o.h;
      const corner = (c === o.c - 1 || c === o.c + o.w) && (r === o.r - 1 || r === o.r + o.h);
      if (inside || corner) continue;
      if (r >= 0 && c >= 0 && r < ROWS && c < COLS && grid[r][c] === 0) out.push([c, r]);
    }
    return out;
  }

  // ---------- state ----------
  function create(opts) {
    const seed = opts.seed !== undefined ? opts.seed : Math.floor(Math.random() * 1e9);
    const rand = mulberry32(seed);
    const mode = opts.mode || 'simple', diff = opts.diff || 'normal';
    const map = generateMap(rand, mode);
    return {
      seed, rand, mode, diff, cfg: DIFF[diff],
      grid: map.grid, devices: map.devices, bins: map.bins, decor: map.decor,
      t: 0, health: 100, score: 0, fixes: 0, over: false, won: false,
      nextBreak: 2.0, hour: 0, rushQueue: [],
      player: { x: SPAWN.c + 0.5, y: SPAWN.r + 0.5, dir: -Math.PI / 2, moving: false },
      inv: [],             // carried parts (parts mode)
      mini: null,          // active mini-game (mini mode)
      target: null,        // what the player would interact with
      lastFixT: -10, streak: 0
    };
  }

  // ---------- helpers ----------
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  function rectDist(px, py, o) {
    const dx = Math.max(o.c - px, 0, px - (o.c + o.w));
    const dy = Math.max(o.r - py, 0, py - (o.r + o.h));
    return Math.hypot(dx, dy);
  }
  function blocked(s, c, r) { return r < 0 || c < 0 || r >= ROWS || c >= COLS || s.grid[r][c] !== 0; }
  function movePlayer(s, dx, dy) {
    const p = s.player;
    // move one axis at a time and push out of blocked tiles
    p.x += dx; collide(s, p, 'x', dx);
    p.y += dy; collide(s, p, 'y', dy);
  }
  function collide(s, p, axis, d) {
    const R = PLAYER_R;
    const c0 = Math.floor(p.x - R), c1 = Math.floor(p.x + R), r0 = Math.floor(p.y - R), r1 = Math.floor(p.y + R);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      if (!blocked(s, c, r)) continue;
      // circle vs tile
      const nx = clamp(p.x, c, c + 1), ny = clamp(p.y, r, r + 1);
      const ddx = p.x - nx, ddy = p.y - ny, dd = Math.hypot(ddx, ddy);
      if (dd >= R) continue;
      if (axis === 'x') { if (d > 0) p.x = c - R - 1e-4; else if (d < 0) p.x = c + 1 + R + 1e-4; else if (dd > 0) { p.x += ddx / dd * (R - dd); } }
      else { if (d > 0) p.y = r - R - 1e-4; else if (d < 0) p.y = r + 1 + R + 1e-4; else if (dd > 0) { p.y += ddy / dd * (R - dd); } }
    }
  }
  function breakDevice(s, d, ev) {
    d.status = 'broken'; d.brokenT = 0; d.prog = 0;
    ev.push({ type: 'break', dev: d });
  }
  function fixDevice(s, d, ev) {
    d.status = 'ok'; d.cooldown = 8; d.prog = 0;
    const quick = Math.max(0, Math.round(60 - 6 * d.brokenT));
    s.streak = s.t - s.lastFixT < 5 ? s.streak + 1 : 1;
    s.lastFixT = s.t;
    const streakBonus = Math.min(s.streak - 1, 5) * 20;
    const pts = TYPES[d.type].pts + quick + streakBonus;
    s.score += pts; s.fixes++;
    s.health = Math.min(100, s.health + 2);
    ev.push({ type: 'fixed', dev: d, pts, quick, streak: s.streak });
    if (s.mini && s.mini.dev === d) s.mini = null;
  }
  function inRange(s, o) { return rectDist(s.player.x, s.player.y, o) <= PLAYER_R + REACH; }
  function nearest(s, list) {
    let best = null, bd = Infinity;
    for (const o of list) {
      if (!inRange(s, o)) continue;
      const cx = o.c + o.w / 2, cy = o.r + o.h / 2, dd = Math.hypot(cx - s.player.x, cy - s.player.y);
      if (dd < bd) { bd = dd; best = o; }
    }
    return best;
  }
  const brokenList = s => s.devices.filter(d => d.status === 'broken');

  // ---------- mini-games ----------
  const BTNS = ['A', 'B', 'X', 'Y'];
  function startMini(s, d, ev) {
    const c = s.cfg, kind = TYPES[d.type].mini;
    const m = { dev: d, kind, t: 0, prog: 0, shake: 0 };
    if (kind === 'combo') { m.seq = []; for (let i = 0; i < c.combo; i++) m.seq.push(BTNS[Math.floor(s.rand() * 4)]); m.idx = 0; }
    if (kind === 'spin') { m.angle = null; m.acc = 0; m.need = c.spin * Math.PI * 2; m.lastKey = null; }
    if (kind === 'timing') { m.needle = 0; m.dir = 1; m.zone = 0.2 + s.rand() * 0.6; m.hits = 0; }
    s.mini = m;
    ev.push({ type: 'miniStart', kind, dev: d });
  }
  function stepMini(s, dt, inp, ev) {
    const m = s.mini, c = s.cfg, d = m.dev;
    m.t += dt; m.shake = Math.max(0, m.shake - dt);
    if (d.status !== 'broken') { s.mini = null; return; }
    // cancel: B (except in the combo, where B is a button of the code -> stick cancels)
    const stickHard = Math.hypot(inp.mx, inp.my) > 0.75;
    if ((m.kind !== 'combo' && inp.bP) || (m.kind === 'combo' && stickHard && m.t > 0.3)) {
      s.mini = null; ev.push({ type: 'miniCancel' }); return;
    }
    const fixT = TYPES[d.type].fix * c.fixMul;
    if (m.kind === 'hold') {
      if (inp.aHeld) d.prog += dt / fixT;
    } else if (m.kind === 'mash') {
      if (inp.aP && m.t > 0.05) { d.prog += 1 / c.mash; ev.push({ type: 'miniHit' }); }
      d.prog = Math.max(0, d.prog - 0.12 * dt);
    } else if (m.kind === 'spin') {
      const mag = Math.hypot(inp.sx, inp.sy);
      if (mag > 0.5) {
        const a = Math.atan2(inp.sy, inp.sx);
        if (m.angle !== null) {
          let da = a - m.angle;
          while (da > Math.PI) da -= 2 * Math.PI;
          while (da < -Math.PI) da += 2 * Math.PI;
          if (Math.abs(da) < Math.PI / 2) m.acc += Math.abs(da);
        }
        m.angle = a;
      } else m.angle = null;
      // keyboard fallback: alternate arrow keys, each change = quarter turn
      if (inp.dirP) { if (m.lastKey && m.lastKey !== inp.dirP) m.acc += Math.PI / 2; m.lastKey = inp.dirP; }
      d.prog = Math.min(1, m.acc / m.need);
    } else if (m.kind === 'combo') {
      const p = inp.btnP;
      if (p && m.t > 0.15) {
        if (p === m.seq[m.idx]) { m.idx++; ev.push({ type: 'miniHit' }); }
        else { m.shake = 0.3; ev.push({ type: 'miniMiss' }); if (c.wrongReset) m.idx = 0; }
        d.prog = m.idx / m.seq.length;
      }
    } else if (m.kind === 'timing') {
      m.needle += m.dir * c.needle * 2 * dt;
      if (m.needle > 1) { m.needle = 2 - m.needle; m.dir = -1; }
      if (m.needle < 0) { m.needle = -m.needle; m.dir = 1; }
      if (inp.aP && m.t > 0.15) {
        if (Math.abs(m.needle - m.zone) <= c.zone / 2) {
          m.hits++; ev.push({ type: 'miniHit' });
          m.zone = 0.15 + s.rand() * 0.7;
        } else { m.hits = Math.max(0, m.hits - 1); m.shake = 0.3; ev.push({ type: 'miniMiss' }); }
        d.prog = m.hits / c.hits;
      }
    }
    if (d.prog >= 1) fixDevice(s, d, ev);
  }

  // ---------- main step ----------
  // inp: { mx, my (movement -1..1), aHeld, aP, bP, btnP ('A'|'B'|'X'|'Y'|null), sx, sy (stick), dirP ('l'|'r'|'u'|'d'|null) }
  function step(s, dt, inp) {
    const ev = [];
    if (s.over) return ev;
    const c = s.cfg;
    s.t += dt;

    // --- the school day: bells and breakdowns ---
    const hour = Math.min(HOURS, Math.floor(s.t / (DAY_LEN / HOURS)));
    if (hour > s.hour) {
      s.hour = hour;
      if (hour < HOURS) {
        ev.push({ type: 'bell', hour: 8 + hour });
        const n = Math.max(1, c.rush + MODE_RUSH[s.mode]);
        for (let i = 0; i < n; i++) s.rushQueue.push({ at: s.t + i * 0.6, pref: RUSH_PREF[8 + hour] });
      }
    }
    const ok = () => s.devices.filter(d => d.status === 'ok' && d.cooldown <= 0);
    while (s.rushQueue.length && s.rushQueue[0].at <= s.t) {
      const q = s.rushQueue.shift();
      let cand = ok();
      // the bell's theme (e.g. everyone printing at once) picks the device type when possible
      const pref = cand.filter(d => d.type === q.pref);
      if (pref.length) cand = pref;
      if (cand.length) breakDevice(s, cand[Math.floor(s.rand() * cand.length)], ev);
    }
    s.nextBreak -= dt;
    if (s.nextBreak <= 0) {
      const f = s.t / DAY_LEN;
      const base = (c.int0 + (c.int1 - c.int0) * f) * MODE_INT[s.mode];
      s.nextBreak = base * (0.7 + s.rand() * 0.6);
      const cand = ok(); if (cand.length) breakDevice(s, cand[Math.floor(s.rand() * cand.length)], ev);
    }

    // --- device timers & health ---
    let drain = 0;
    for (const d of s.devices) {
      d.cooldown = Math.max(0, d.cooldown - dt);
      if (d.status !== 'broken') continue;
      const wasCrit = d.brokenT >= c.crit;
      d.brokenT += dt;
      if (!wasCrit && d.brokenT >= c.crit) ev.push({ type: 'critical', dev: d });
      drain += TYPES[d.type].drain * (d.brokenT >= c.crit ? 2 : 1);
    }
    s.health -= drain * c.drain * dt;
    if (s.health <= 0) { s.health = 0; s.over = true; s.won = false; ev.push({ type: 'gameOver' }); return ev; }
    if (s.t >= DAY_LEN) {
      s.over = true; s.won = true;
      s.dayBonus = Math.round(s.health) * 30;
      s.score += s.dayBonus;
      ev.push({ type: 'dayEnd', bonus: s.dayBonus });
      return ev;
    }

    // --- player ---
    const p = s.player;
    if (s.mini) {
      p.moving = false;
      stepMini(s, dt, inp, ev);
      s.target = s.mini ? s.mini.dev : null;
      return ev;
    }
    let mx = inp.mx, my = inp.my;
    const mag = Math.hypot(mx, my);
    if (mag > 1) { mx /= mag; my /= mag; }
    p.moving = mag > 0.15;
    if (p.moving) {
      p.dir = Math.atan2(my, mx);
      const sp = PLAYER_SPEED * Math.min(1, mag);
      // sub-steps keep collision solid at low frame rates
      const n = Math.ceil(sp * dt / 0.1);
      for (let i = 0; i < n; i++) movePlayer(s, mx * sp * dt / n, my * sp * dt / n);
    }

    // --- interaction ---
    const broken = brokenList(s);
    if (s.mode === 'simple') {
      const d = nearest(s, broken);
      s.target = d;
      if (d && inp.aHeld) {
        d.prog += dt / (TYPES[d.type].fix * c.fixMul);
        if (d.prog >= 1) fixDevice(s, d, ev);
      }
    } else if (s.mode === 'mini') {
      const d = nearest(s, broken);
      s.target = d;
      if (d && inp.aP) startMini(s, d, ev);
    } else { // parts
      const d = nearest(s, broken);
      const b = nearest(s, s.bins);
      // prefer the device when we're holding its part, otherwise whatever is closer
      let tgt = null;
      if (d && s.inv.includes(TYPES[d.type].part)) tgt = d;
      else if (b && d) tgt = rectDist(p.x, p.y, b) < rectDist(p.x, p.y, d) ? b : d;
      else tgt = b || d;
      s.target = tgt;
      if (inp.bP && s.inv.length) { const dropped = s.inv.pop(); ev.push({ type: 'drop', part: dropped }); }
      if (tgt && tgt.part !== undefined) { // a shelf bin
        if (inp.aP) {
          if (s.inv.includes(tgt.part)) ev.push({ type: 'already', part: tgt.part });
          else {
            s.inv.push(tgt.part);
            if (s.inv.length > c.cap) s.inv.shift();
            ev.push({ type: 'pick', part: tgt.part });
          }
        }
      } else if (tgt) { // a broken device
        const need = TYPES[tgt.type].part;
        if (s.inv.includes(need)) {
          if (inp.aHeld) {
            tgt.prog += dt / (0.6 * c.fixMul);
            if (tgt.prog >= 1) { s.inv.splice(s.inv.indexOf(need), 1); fixDevice(s, tgt, ev); }
          }
        } else if (inp.aP) ev.push({ type: 'needPart', part: need, dev: tgt });
      }
    }
    return ev;
  }

  return { create, step, TYPES, PARTS, DIFF, DAY_LEN, HOURS, COLS, ROWS, PLAYER_R, PLAYER_SPEED, REACH, bfs, accessTiles, rectDist, inRange };
})();
if (typeof module !== 'undefined') module.exports = SRSim;
