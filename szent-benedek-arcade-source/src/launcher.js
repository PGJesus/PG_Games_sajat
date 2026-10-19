// =====================================================================
//  LAUNCHER — pick a game, then you land in that game's own menu
// =====================================================================
const Launcher = (() => {
  const GAMES = ['packet', 'server'];
  let sel = 0, t0 = 0;
  const lsfx = {
    move() { tone(620, 620, 0.04, 'square', 0.035); },
    go() { tone(520, 1040, 0.12, 'square', 0.05); }
  };
  function enter() { t0 = 0; }
  function update(dt) {
    t0 += dt;
    if (nav('left') || nav('up')) { sel = (sel + GAMES.length - 1) % GAMES.length; lsfx.move(); }
    if (nav('right') || nav('down')) { sel = (sel + 1) % GAMES.length; lsfx.move(); }
    if (pressed('y')) { toggleLang(); lsfx.move(); }
    if (pressed('x')) { toggleMute(); lsfx.move(); }
    if (pressed('a') && t0 > 0.25) { lsfx.go(); App.go(GAMES[sel]); }
  }

  // tiny animated previews, drawn inside a card (cx, cy = card centre)
  function previewPacket(x, y, w, h, time) {
    ctx.save(); ctx.beginPath(); rr(x, y, w, h, 10); ctx.clip();
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#050817'); g.addColorStop(1, '#16205a');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    const gy = y + h - 40;
    ctx.fillStyle = '#13205a'; ctx.fillRect(x, gy, w, 40);
    ctx.fillStyle = '#4fd8ff'; ctx.fillRect(x, gy - 2, w, 3);
    const period = 1.6, ph = (time % period) / period;
    // spike scrolling toward the packet
    const sx = x + w - ph * (w + 60);
    ctx.fillStyle = '#ff5b6b';
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(sx + i * 16, gy); ctx.lineTo(sx + i * 16 + 8, gy - 20); ctx.lineTo(sx + i * 16 + 16, gy); ctx.fill(); }
    // jump when the spike is close
    const px = x + 70;
    const d = sx - px;
    let jy = 0;
    if (d < 70 && d > -70) { const k = (70 - d) / 140; jy = Math.sin(k * Math.PI) * 60; }
    ctx.fillStyle = '#5fe0ff'; rr(px, gy - 34 - jy, 34, 34, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px + 23, gy - 20 - jy, 4.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(px + 30, gy - 20 - jy, 4, 0, 7); ctx.fill();
    for (let i = 0; i < 4; i++) {
      const bx = x + ((i * 97 - time * 120) % w + w) % w;
      txt(i % 2 ? '1' : '0', bx, y + 40 + (i % 2) * 30, 20, '#ffd84d', 'center', '800', MONO);
    }
    ctx.restore();
  }
  function previewServer(x, y, w, h, time) {
    ctx.save(); ctx.beginPath(); rr(x, y, w, h, 10); ctx.clip();
    ctx.fillStyle = '#10162e'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(120,150,220,0.12)'; ctx.lineWidth = 1;
    for (let gx = x; gx < x + w; gx += 24) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke(); }
    for (let gy = y; gy < y + h; gy += 24) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke(); }
    // racks
    for (let i = 0; i < 6; i++) {
      const rx = x + 30 + i * 46, ry = y + 30;
      const broken = i === Math.floor(time / 1.2) % 6;
      ctx.fillStyle = '#1d2754'; ctx.fillRect(rx, ry, 36, 36);
      ctx.fillStyle = broken && Math.floor(time * 6) % 2 ? '#ff3b5c' : '#5dffa0';
      ctx.fillRect(rx + 6, ry + 6, 6, 4); ctx.fillRect(rx + 16, ry + 6, 6, 4);
      if (broken) { ctx.fillStyle = 'rgba(255,59,92,0.25)'; ctx.fillRect(rx - 3, ry - 3, 42, 42); txt('!', rx + 18, ry - 14, 20, '#ff3b5c', 'center', '900'); }
    }
    // desks
    for (let i = 0; i < 3; i++) {
      const dx = x + 40 + i * 95, dy = y + h - 60;
      ctx.fillStyle = '#5a4630'; ctx.fillRect(dx, dy, 60, 26);
      ctx.fillStyle = i === 1 ? '#2f62e0' : '#0b1020'; ctx.fillRect(dx + 18, dy + 4, 24, 12);
    }
    // technician running between them
    const tx = x + 40 + (Math.sin(time * 1.3) * 0.5 + 0.5) * (w - 80), ty = y + h / 2 + 10;
    ctx.fillStyle = '#2b3f8f'; ctx.beginPath(); ctx.arc(tx, ty, 11, 0, 7); ctx.fill();
    ctx.fillStyle = '#f2c9a0'; ctx.beginPath(); ctx.arc(tx, ty, 6, 0, 7); ctx.fill();
    ctx.restore();
  }

  function draw(time) {
    // background: soft grid + binary glow
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#050817'); g.addColorStop(1, '#141c4d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(79,216,255,0.06)'; ctx.lineWidth = 1;
    const off = (time * 20) % 40;
    for (let x = -40 + off; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = -40 + off; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    if (logoReady) {
      ctx.save(); ctx.shadowColor = '#4fd8ff'; ctx.shadowBlur = 25;
      ctx.drawImage(logo, W / 2 - 60, 14, 120, 120); ctx.restore();
    }
    glowTxt(tr('arcadeTitle'), W / 2, 168, 52, '#ffffff', '#4fd8ff', 'center', '900');
    txt(tr('school'), W / 2, 206, 19, '#8fb6ff', 'center', '600');
    txt(tr('arcadeSub'), W / 2, 240, 24, '#ffd84d', 'center', '800');

    GAMES.forEach((name, i) => {
      const m = App.mods[name];
      const cw = 470, ch = 330, cx = W / 2 + (i === 0 ? -260 : 260), x = cx - cw / 2, y = 268;
      const s = i === sel;
      const lift = s ? -6 - Math.sin(time * 4) * 2 : 0;
      ctx.save(); ctx.translate(0, lift);
      if (s) { ctx.shadowColor = '#4fd8ff'; ctx.shadowBlur = 30; }
      ctx.fillStyle = s ? 'rgba(20,34,90,0.95)' : 'rgba(10,16,48,0.85)'; rr(x, y, cw, ch, 16); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = s ? '#4fd8ff' : 'rgba(79,216,255,0.25)'; ctx.lineWidth = s ? 3 : 2; rr(x, y, cw, ch, 16); ctx.stroke();
      if (name === 'packet') previewPacket(x + 20, y + 20, cw - 40, 170, time);
      else previewServer(x + 20, y + 20, cw - 40, 170, time);
      txt(typeof m.card.title === 'string' ? m.card.title : m.card.title[lang], cx, y + 224, 30, s ? '#ffffff' : '#9fb3e0', 'center', '900');
      // wrap description to two lines
      const words = m.card[lang].split(' ');
      ctx.font = `600 18px ${FONT}`;
      let line = '', lines = [];
      for (const wd of words) { const tst = line ? line + ' ' + wd : wd; if (ctx.measureText(tst).width > cw - 50) { lines.push(line); line = wd; } else line = tst; }
      lines.push(line);
      lines.slice(0, 2).forEach((l, k) => txt(l, cx, y + 262 + k * 24, 18, '#cfe9ff', 'center', '600'));
      if (s) { drawPadBtn(cx - 40, y + ch - 2, 'A', BTN.A, 15); txt(tr('play'), cx - 18, y + ch - 1, 18, '#fff', 'left', '800'); }
      ctx.restore();
    });

    // bottom hints
    const hy = 648;
    txt('◀ ▶', W / 2 - 330, hy, 20, '#cfe9ff', 'center', '900');
    drawPadBtn(W / 2 - 180, hy, 'Y', BTN.Y); txt(tr('langItem'), W / 2 - 160, hy + 1, 17, '#cfe9ff', 'left', '600');
    drawPadBtn(W / 2 + 90, hy, 'X', BTN.X); txt(muted ? tr('soundOff') : tr('soundOn'), W / 2 + 110, hy + 1, 17, '#cfe9ff', 'left', '600');
    txt(tr('fullscreen'), W / 2 + 330, hy + 1, 15, '#8fb6ff', 'left', '600');
    drawPadStatus(694);
    document.body.style.cursor = 'default';
  }
  return { enter, update, draw, txt: null };
})();
App.register('launcher', Launcher);
