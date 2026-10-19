// Headless "good player" bot used to balance Server Room Panic.
const S = require('../src/sr_sim.js');
function distField(s, o) {
  const dist = s.grid.map(r => r.map(() => -1)), q = [];
  for (const [c, r] of S.accessTiles(s.grid, o)) { dist[r][c] = 0; q.push([c, r]); }
  for (let i = 0; i < q.length; i++) {
    const [c, r] = q[i];
    for (const [dc, dr] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nc = c + dc, nr = r + dr;
      if (nr < 0 || nc < 0 || nr >= S.ROWS || nc >= S.COLS || s.grid[nr][nc] !== 0 || dist[nr][nc] >= 0) continue;
      dist[nr][nc] = dist[r][c] + 1; q.push([nc, nr]);
    }
  }
  return dist;
}
function makeBot(opts = {}) { return { goalDev: null, goal: null, field: null, think: 0, react: opts.react ?? 0.35, speed: opts.speed ?? 0.9, err: opts.err ?? 0.07, timer: 0, pressT: 0, ang: 0, cache: new Map() }; }
function field(s, bot, o) { if (!bot.cache.has(o)) bot.cache.set(o, distField(s, o)); return bot.cache.get(o); }
function botInput(s, bot, dt, rand = Math.random) {
  const inp = { mx: 0, my: 0, aHeld: false, aP: false, bP: false, btnP: null, sx: 0, sy: 0, dirP: null };
  const p = s.player, c = s.cfg;
  bot.timer += dt;
  if (s.mini) {
    const m = s.mini;
    if (m.kind === 'hold') inp.aHeld = true;
    else if (m.kind === 'mash') { if (bot.timer - bot.pressT > 0.13) { inp.aP = true; bot.pressT = bot.timer; } }
    else if (m.kind === 'spin') { bot.ang += 1.5 * 2 * Math.PI * dt; inp.sx = Math.cos(bot.ang); inp.sy = Math.sin(bot.ang); }
    else if (m.kind === 'combo') { if (bot.timer - bot.pressT > 0.38) { bot.pressT = bot.timer; inp.btnP = rand() < bot.err ? 'BAXY'[Math.floor(rand()*4)] === m.seq[m.idx] ? 'A' : 'BAXY'[Math.floor(rand()*4)] : m.seq[m.idx]; } }
    else if (m.kind === 'timing') { if (bot.timer - bot.pressT > 0.3 && Math.abs(m.needle - m.zone) < c.zone / 2 * 0.75) { bot.pressT = bot.timer; if (rand() < 0.85) inp.aP = true; } }
    return inp;
  }
  // choose a device to go for
  bot.think -= dt;
  const broken = s.devices.filter(d => d.status === 'broken');
  if (bot.goalDev && bot.goalDev.status !== 'broken') { bot.goalDev = null; bot.think = bot.react; }
  if ((!bot.goalDev || bot.think <= 0) && broken.length && bot.think <= 0) {
    let best = null, bs = -1;
    const pc = Math.floor(p.x), pr = Math.floor(p.y);
    for (const d of broken) {
      const f = field(s, bot, d); const dd = f[pr] && f[pr][pc] >= 0 ? f[pr][pc] : 30;
      const sc = (S.TYPES[d.type].drain * (d.brokenT > c.crit * 0.7 ? 2 : 1) + 0.4) / (dd + 4);
      if (sc > bs) { bs = sc; best = d; }
    }
    if (best !== bot.goalDev && bot.goalDev && bot.goalDev.prog > 0) best = bot.goalDev; // finish what we started
    bot.goalDev = best; bot.think = 0.6;
  }
  if (!bot.goalDev) return inp;
  let goal = bot.goalDev;
  if (s.mode === 'parts') {
    const need = S.TYPES[goal.type].part;
    if (!s.inv.includes(need)) goal = s.bins.find(b => b.part === need);
  }
  if (S.inRange(s, goal) && s.target === goal) {
    if (s.mode === 'simple') inp.aHeld = true;
    else if (s.mode === 'mini') { if (bot.timer - bot.pressT > 0.2) { inp.aP = true; bot.pressT = bot.timer; } }
    else if (goal.part !== undefined) { if (bot.timer - bot.pressT > 0.25) { inp.aP = true; bot.pressT = bot.timer; } }
    else inp.aHeld = true;
    return inp;
  }
  // walk down the distance field
  const f = field(s, bot, goal);
  const pc = Math.floor(p.x), pr = Math.floor(p.y);
  let tx = p.x, ty = p.y;
  if (f[pr][pc] === 0 || f[pr][pc] < 0) {
    // on an access tile (or odd spot): step toward the object's centre
    tx = goal.c + goal.w / 2; ty = goal.r + goal.h / 2;
    if (f[pr][pc] < 0) { tx = pc + 0.5; ty = pr + 0.5; }
  } else {
    let bd = f[pr][pc], bn = null;
    for (const [dc, dr] of [[1,0],[-1,0],[0,1],[0,-1]]) { const v = f[pr + dr] && f[pr + dr][pc + dc]; if (v >= 0 && v < bd) { bd = v; bn = [pc + dc, pr + dr]; } }
    if (bn) { tx = bn[0] + 0.5; ty = bn[1] + 0.5; }
  }
  const dx = tx - p.x, dy = ty - p.y, dd = Math.hypot(dx, dy);
  if (dd > 0.02) { inp.mx = dx / dd * bot.speed; inp.my = dy / dd * bot.speed; }
  return inp;
}
module.exports = { makeBot, botInput };
