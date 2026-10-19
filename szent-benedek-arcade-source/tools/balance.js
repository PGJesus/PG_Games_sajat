const S = require('../src/sr_sim.js');
const { makeBot, botInput } = require('./bot.js');
const N = +process.argv[2] || 40;
const opts = process.argv[3] ? JSON.parse(process.argv[3]) : {};
const rows = [];
for (const mode of ['simple', 'mini', 'parts']) for (const diff of ['easy', 'normal', 'hard', 'insane']) {
  let win = 0, hp = 0, score = 0, fixes = 0, maxB = 0, endT = 0, gens = 0;
  for (let i = 0; i < N; i++) {
    const s = S.create({ mode, diff, seed: 1000 + i });
    gens += 0;
    const bot = makeBot(opts);
    let mb = 0, rs = 7 + i;
    const rand = () => { rs = (rs * 16807) % 2147483647; return rs / 2147483647; };
    while (!s.over) { S.step(s, 1 / 60, botInput(s, bot, 1 / 60, rand)); mb = Math.max(mb, s.devices.filter(d => d.status === 'broken').length); }
    if (s.won) win++;
    hp += s.health; score += s.score; fixes += s.fixes; maxB += mb; endT += s.t;
  }
  rows.push({ mode, diff, win: (win / N * 100).toFixed(0) + '%', hp: (hp / N).toFixed(0), score: (score / N).toFixed(0), fixes: (fixes / N).toFixed(1), maxBroken: (maxB / N).toFixed(1), endT: (endT / N).toFixed(0) });
}
console.table(rows);
