// =====================================================================
//  SERVER ROOM PANIC — top-down renderer, menus and controls
//  (all game rules live in SRSim; this file only draws and reads input)
// =====================================================================
const ServerRoom = (() => {
  const TS = 40, OY = 80;                 // tile size in px, map offset (HUD above)
  const MODES = ['simple', 'mini', 'parts'];
  const T = SRSim.TYPES;

  const TXT = {
    hu: {
      title: 'SZERVERTEREM-PÁNIK', subtitle: 'Tartsd életben a suli hálózatát 8:00-tól 14:00-ig!',
      start: 'INDÍTÁS', startDesc: 'Kezdődik a tanítási nap!',
      modeItem: 'JAVÍTÁS', simple: 'EGYSZERŰ', mini: 'MINIJÁTÉKOK', parts: 'ALKATRÉSZEK',
      modeDesc_simple: 'Menj oda és tartsd nyomva az A-t.',
      modeDesc_mini: 'Minden eszköznek saját minijátéka van.',
      modeDesc_parts: 'Hozd a polcról a megfelelő alkatrészt!',
      diffDesc_easy: 'Ritkábban romlik el valami. 2 alkatrészt vihetsz.',
      diffDesc_normal: 'Az igazi élmény. Ezzel érdemes kezdeni!',
      diffDesc_hard: 'Sűrűbb hibák, rövidebb türelem.',
      diffDesc_insane: 'Csak a legjobbaknak. Tényleg.',
      boardDesc: 'A legjobb eredmények ezen a gépen.', boardHint: 'BALRA/JOBBRA: nehézség',
      dev_server: 'SZERVER', dev_switch: 'SWITCH', dev_wifi: 'WI-FI ROUTER', dev_pc: 'GÉP', dev_printer: 'NYOMTATÓ',
      prob_server: 'Túlmelegedett!', prob_switch: 'Kihúzott kábel!', prob_wifi: 'Nincs jel!', prob_pc: 'Kékhalál!', prob_printer: 'Papírelakadás!',
      part_fan: 'VENTILÁTOR', part_cable: 'KÁBEL', part_antenna: 'ANTENNA', part_usb: 'VÍRUSIRTÓ', part_paper: 'PAPÍR',
      bell_9: '9:00 Becsöngettek: mindenki egyszerre jelentkezik be!',
      bell_10: '10:00 Dolgozatírás: mindenki egyszerre nyomtat!',
      bell_11: '11:00 Informatikaóra: teljes gőzzel megy a gépterem!',
      bell_12: '12:00 Ebédszünet: mindenki a Wi-Fi-n lóg!',
      bell_13: '13:00 Utolsó óra, kitartás!',
      dayStart: '8:00 Kezdődik a nap!',
      health: 'HÁLÓZAT', score: 'PONT', fixes: 'JAVÍTVA', hand: 'KÉZBEN',
      brief_goal: 'A HÁLÓZAT csík fogy, amíg valami rossz. Ha elfogy, vége. Bírd ki 14:00-ig!',
      brief_simple: 'Menj oda az elromlott eszközhöz, és tartsd nyomva az A-t, amíg megjavul.',
      brief_parts: 'Vedd fel a polcról a megfelelő alkatrészt (A), vidd oda, és tartsd nyomva az A-t. B: eldobás.',
      brief_mini_server: 'Szerver: tartsd nyomva az A-t', brief_mini_switch: 'Switch: pörgesd a bal kart',
      brief_mini_printer: 'Nyomtató: nyomkodd az A-t', brief_mini_pc: 'Gép: üsd be a gombkombót',
      brief_mini_wifi: 'Wi-Fi: nyomd az A-t, ha a mutató a zöldben van',
      brief_move: 'Mozgás: bal kar / nyilak', brief_start: 'A: kezdés', brief_back: 'B: vissza',
      m_hold: 'TARTSD NYOMVA!', m_mash: 'NYOMKODD!', m_spin: 'PÖRGESD A BAL KART!', m_spinKb: '(billentyűzeten: ← → felváltva)',
      m_combo: 'ÜSD BE A KÓDOT!', m_timing: 'NYOMD, HA ZÖLDBEN VAN!', m_cancel: 'mégse', m_cancelStick: 'kar: mégse',
      need: 'Ide ez kell:', already: 'Ez már nálad van!', dropped: 'Eldobva',
      crit: 'KRITIKUS!', quick: 'GYORS!', streak: 'SOROZAT',
      won: 'VÉGE A TANÍTÁSI NAPNAK!', lost: 'LEÁLLT A SULI HÁLÓZATA!',
      lostSub: 'Túl sok minden romlott el egyszerre.', wonSub: 'A suli hálózata túlélte a napot!',
      dayBonus: 'Napzáró bónusz', endTime: 'Leállás ideje'
    },
    en: {
      title: 'SERVER ROOM PANIC', subtitle: 'Keep the school network alive from 8:00 to 14:00!',
      start: 'START', startDesc: 'The school day begins!',
      modeItem: 'FIXING', simple: 'SIMPLE', mini: 'MINI-GAMES', parts: 'PARTS',
      modeDesc_simple: 'Walk up and hold A.',
      modeDesc_mini: 'Every device has its own mini-game.',
      modeDesc_parts: 'Bring the right part from the shelf!',
      diffDesc_easy: 'Things break less often. You can carry 2 parts.',
      diffDesc_normal: 'The real deal. Start here!',
      diffDesc_hard: 'More breakdowns, less patience.',
      diffDesc_insane: 'For the very best only. Seriously.',
      boardDesc: 'Best scores on this computer.', boardHint: 'LEFT/RIGHT: difficulty',
      dev_server: 'SERVER', dev_switch: 'SWITCH', dev_wifi: 'WI-FI ROUTER', dev_pc: 'PC', dev_printer: 'PRINTER',
      prob_server: 'Overheating!', prob_switch: 'Cable unplugged!', prob_wifi: 'No signal!', prob_pc: 'Bluescreen!', prob_printer: 'Paper jam!',
      part_fan: 'FAN', part_cable: 'CABLE', part_antenna: 'ANTENNA', part_usb: 'ANTIVIRUS', part_paper: 'PAPER',
      bell_9: '9:00 Bell: everyone logs in at once!',
      bell_10: '10:00 Test day: everyone prints at once!',
      bell_11: '11:00 IT lesson: the computer lab is running flat out!',
      bell_12: '12:00 Lunch break: everyone is on the Wi-Fi!',
      bell_13: '13:00 Last lesson, hang in there!',
      dayStart: '8:00 The day begins!',
      health: 'NETWORK', score: 'SCORE', fixes: 'FIXED', hand: 'HOLDING',
      brief_goal: 'The NETWORK bar drains while things are broken. If it runs out, it\'s over. Survive until 14:00!',
      brief_simple: 'Walk up to the broken device and hold A until it\'s fixed.',
      brief_parts: 'Grab the right part from the shelf (A), bring it over and hold A. B: drop.',
      brief_mini_server: 'Server: hold A', brief_mini_switch: 'Switch: spin the left stick',
      brief_mini_printer: 'Printer: mash A', brief_mini_pc: 'PC: enter the button combo',
      brief_mini_wifi: 'Wi-Fi: press A when the needle is in the green',
      brief_move: 'Move: left stick / arrows', brief_start: 'A: start', brief_back: 'B: back',
      m_hold: 'HOLD IT!', m_mash: 'MASH IT!', m_spin: 'SPIN THE LEFT STICK!', m_spinKb: '(keyboard: ← → alternately)',
      m_combo: 'ENTER THE CODE!', m_timing: 'PRESS IN THE GREEN!', m_cancel: 'cancel', m_cancelStick: 'stick: cancel',
      need: 'This needs:', already: 'You already have it!', dropped: 'Dropped',
      crit: 'CRITICAL!', quick: 'QUICK!', streak: 'STREAK',
      won: 'SCHOOL DAY SURVIVED!', lost: 'THE SCHOOL NETWORK WENT DOWN!',
      lostSub: 'Too much broke at once.', wonSub: 'The school network made it through the day!',
      dayBonus: 'End-of-day bonus', endTime: 'Went down at'
    }
  };

  // ---------- sounds ----------
  const sfx = {
    select() { tone(620, 620, 0.04, 'square', 0.035); },
    confirm() { tone(520, 1040, 0.1, 'square', 0.05); },
    alarm() { tone(880, 880, 0.08, 'square', 0.04); tone(660, 660, 0.08, 'square', 0.04, 0.1); },
    crit() { tone(300, 200, 0.18, 'sawtooth', 0.05); },
    fix() { [660, 880, 1320].forEach((f, i) => tone(f, f, 0.07, 'triangle', 0.06, i * 0.05)); },
    bell() { tone(988, 988, 0.5, 'sine', 0.08); tone(784, 784, 0.6, 'sine', 0.08, 0.35); },
    pick() { tone(500, 900, 0.07, 'triangle', 0.06); },
    wrong() { tone(160, 120, 0.2, 'sawtooth', 0.06); },
    hit() { tone(900, 1200, 0.05, 'square', 0.04); },
    miss() { noise(0.12, 0.06); },
    over() { [440, 349, 262, 196].forEach((f, i) => tone(f, f * 0.98, 0.2, 'square', 0.05, i * 0.16)); },
    win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, f, 0.14, 'square', 0.05, i * 0.1)); },
    step() { tone(120, 90, 0.03, 'triangle', 0.02); }
  };

  // ---------- state ----------
  let scene = 'title', menuI = 0, sceneT = 0, padLostMsg = false;
  let modeI = 0, diffI = 1, boardDiffI = 1;
  let S = null;              // simulation state
  let floorCv = null;        // pre-rendered static map
  let fx = null;             // particles, floating texts, banners
  let result = null;
  let demo = null;           // background simulation on menus
  const curMode = () => MODES[modeI], curDiff = () => DIFF_KEYS[diffI];
  const boardKey = (mode, diff) => `sr_${mode}_${diff}`;

  function newFx() { return { parts: [], texts: [], banner: null, shake: 0, vign: 0, stepT: 0 }; }

  function prepare() {
    S = SRSim.create({ mode: curMode(), diff: curDiff() });
    floorCv = renderFloor(S);
    fx = newFx();
  }
  function startDay() {
    scene = 'play'; sceneT = 0; padLostMsg = false;
    fx.banner = { text: tr('dayStart'), t: 2.5 };
    sfx.bell();
  }

  // ---------- coordinates ----------
  const sx = x => x * TS, sy = y => OY + y * TS;

  // ---------- static floor ----------
  function renderFloor(s) {
    const c = makeCanvas(W, H - OY), g = c.getContext('2d');
    for (let r = 0; r < SRSim.ROWS; r++) for (let col = 0; col < SRSim.COLS; col++) {
      const x = col * TS, y = r * TS, v = s.grid[r][col];
      if (v === 1) {
        g.fillStyle = '#1a2047'; g.fillRect(x, y, TS, TS);
        g.fillStyle = '#252d63'; g.fillRect(x, y, TS, 6);
      } else {
        const alt = (r + col) % 2 === 0;
        g.fillStyle = alt ? '#161d3d' : '#141a37'; g.fillRect(x, y, TS, TS);
        g.strokeStyle = 'rgba(120,150,220,0.10)'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, TS - 1, TS - 1);
        // perforated raised-floor tiles here and there
        if ((r * 7 + col * 13) % 5 === 0) {
          g.fillStyle = 'rgba(120,150,220,0.10)';
          for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) g.fillRect(x + 8 + i * 7, y + 8 + j * 7, 2, 2);
        }
      }
    }
    // entrance in the bottom wall
    const dx = 15 * TS, dy = (SRSim.ROWS - 1) * TS;
    g.fillStyle = '#3a2a1a'; g.fillRect(dx, dy + 4, TS * 2, TS - 8);
    g.strokeStyle = '#8a6a40'; g.lineWidth = 2; g.strokeRect(dx + 2, dy + 6, TS * 2 - 4, TS - 12);
    g.fillStyle = '#c9a060'; g.fillRect(dx + TS - 2, dy + 8, 4, TS - 16);
    // cable trays on the floor between racks (decoration)
    // decor
    for (const o of s.decor) {
      const x = o.c * TS, y = o.r * TS;
      if (o.kind === 'plant') {
        g.fillStyle = '#5a3a24'; g.beginPath(); g.arc(x + 20, y + 20, 13, 0, 7); g.fill();
        g.fillStyle = '#2f9e4f';
        for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.beginPath(); g.ellipse(x + 20 + Math.cos(a) * 8, y + 20 + Math.sin(a) * 8, 9, 5, a, 0, 7); g.fill(); }
        g.fillStyle = '#45c46a'; g.beginPath(); g.arc(x + 20, y + 20, 6, 0, 7); g.fill();
      } else {
        g.fillStyle = '#3b4266'; g.fillRect(x + 4, y + 4, TS - 8, TS - 8);
        g.strokeStyle = '#596190'; g.lineWidth = 2; g.strokeRect(x + 4, y + 4, TS - 8, TS - 8);
        g.beginPath(); g.moveTo(x + 4, y + 20); g.lineTo(x + TS - 4, y + 20); g.stroke();
      }
    }
    // school logo painted on the floor near the entrance
    if (logoReady) { g.globalAlpha = 0.08; g.drawImage(logo, 14 * TS, 10.5 * TS, 4 * TS, 4 * TS); g.globalAlpha = 1; }
    return c;
  }

  // ---------- icons ----------
  function icon(kind, x, y, s, col = '#ffffff') {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 24, s / 24);
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    switch (kind) {
      case 'fan': case 'server': // thermometer for server, fan blades for the part
        if (kind === 'server') {
          ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(0, 4); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 7, 4, 0, 7); ctx.fill();
          ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, -9, 3, Math.PI, 0); ctx.stroke();
        } else {
          for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate(i * 2.094); ctx.beginPath(); ctx.ellipse(0, -5, 3.5, 6, 0.4, 0, 7); ctx.fill(); ctx.restore(); }
          ctx.beginPath(); ctx.arc(0, 0, 9.5, 0, 7); ctx.stroke();
        }
        break;
      case 'cable': case 'switch':
        ctx.beginPath(); ctx.moveTo(-9, 6); ctx.bezierCurveTo(-9, -4, 2, 6, 2, -2); ctx.stroke();
        ctx.fillRect(0, -9, 7, 7);
        ctx.fillRect(2, -12, 1.5, 3); ctx.fillRect(5, -12, 1.5, 3);
        break;
      case 'antenna': case 'wifi':
        for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(0, 6, i * 4.5, -Math.PI * 0.8, -Math.PI * 0.2); ctx.stroke(); }
        ctx.beginPath(); ctx.arc(0, 6, 2, 0, 7); ctx.fill();
        break;
      case 'usb': case 'pc':
        if (kind === 'pc') {
          ctx.strokeRect(-9, -8, 18, 13); ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(0, 9); ctx.moveTo(-5, 9); ctx.lineTo(5, 9); ctx.stroke();
          ctx.font = '900 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(':(', 0, -1.5);
        } else {
          ctx.fillRect(-4, -4, 8, 13); ctx.strokeRect(-3, -10, 6, 6);
        }
        break;
      case 'paper': case 'printer':
        if (kind === 'printer') {
          ctx.strokeRect(-9, -3, 18, 9); ctx.strokeRect(-6, -9, 12, 6);
          ctx.beginPath(); ctx.moveTo(-5, 6); ctx.lineTo(-3, 11); ctx.lineTo(1, 7); ctx.lineTo(5, 11); ctx.stroke();
        } else {
          ctx.strokeRect(-6, -9, 12, 17); ctx.lineWidth = 1.5;
          for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-3, -4 + i * 4); ctx.lineTo(3, -4 + i * 4); ctx.stroke(); }
        }
        break;
    }
    ctx.restore();
  }
  const PART_COL = { fan: '#7fd4ff', cable: '#ffd84d', antenna: '#c58bff', usb: '#7dff9b', paper: '#ffffff' };

  // ---------- devices ----------
  function facing(d) { return d.side === 'down' ? 1 : -1; } // front of the device: +1 = toward bottom of screen
  function drawDevice(d, time) {
    const x = sx(d.c), y = sy(d.r), w = d.w * TS, h = d.h * TS;
    const broken = d.status === 'broken';
    const crit = broken && d.brokenT >= S.cfg.crit;
    const blink = Math.floor(time * 6 + d.id) % 2 === 0;
    const front = facing(d);
    if (d.type === 'server') {
      ctx.fillStyle = '#0d1330'; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
      ctx.fillStyle = broken ? (blink ? '#5a1622' : '#3a1020') : '#1d2754'; ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
      // front panel strip with LEDs
      const fy = front > 0 ? y + h - 12 : y + 4;
      ctx.fillStyle = '#0a0f26'; ctx.fillRect(x + 5, fy, w - 10, 8);
      for (let i = 0; i < 4; i++) {
        const on = broken ? blink : Math.sin(time * (3 + i * 1.7) + d.id * 2) > 0;
        ctx.fillStyle = on ? (broken ? '#ff3b5c' : i === 3 ? '#ffb347' : '#5dffa0') : '#1b2a5c';
        ctx.fillRect(x + 8 + i * 7, fy + 2, 4, 4);
      }
      ctx.strokeStyle = 'rgba(120,150,220,0.25)'; ctx.lineWidth = 1;
      for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x + 6, y + 6 + i * 8 + (front > 0 ? 0 : 8)); ctx.lineTo(x + w - 6, y + 6 + i * 8 + (front > 0 ? 0 : 8)); ctx.stroke(); }
    } else if (d.type === 'switch') {
      ctx.fillStyle = '#2a3260'; ctx.fillRect(x + 4, y + 6, w - 8, h - 12);
      ctx.strokeStyle = '#4a5596'; ctx.lineWidth = 2; ctx.strokeRect(x + 4, y + 6, w - 8, h - 12);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = broken && i === 2 ? '#000' : '#0a0f26'; ctx.fillRect(x + 8 + i * 6, y + 16, 4, 6);
        ctx.fillStyle = ['#e0393e', '#f0c419', '#5cb531', '#2f7fe0'][i];
        if (!(broken && i === 2)) ctx.fillRect(x + 8 + i * 6, y + (front > 0 ? 22 : 10), 3, 6);
      }
      if (broken) {
        ctx.strokeStyle = '#5cb531'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x + 22, y + 22); ctx.quadraticCurveTo(x + 34, y + 44 + Math.sin(time * 5) * 4, x + 44, y + 34); ctx.stroke();
      }
    } else if (d.type === 'wifi') {
      ctx.fillStyle = '#e8ecf5'; rr(x + 8, y + 14, w - 16, h - 24, 4); ctx.fill();
      ctx.fillStyle = '#2a3260'; ctx.fillRect(x + 10, y + 6, 3, 12); ctx.fillRect(x + w - 13, y + 6, 3, 12);
      ctx.fillStyle = broken ? (blink ? '#ff3b5c' : '#5a1622') : '#5dffa0'; ctx.fillRect(x + 14, y + 22, 4, 3);
      if (!broken) {
        ctx.strokeStyle = 'rgba(93,255,160,0.5)'; ctx.lineWidth = 2;
        const k = (time * 1.5 + d.id) % 1;
        ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, 10 + k * 22, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
      }
    } else if (d.type === 'pc') {
      // desk + monitor + chair on the front side
      ctx.fillStyle = '#5a4630'; ctx.fillRect(x + 2, y + 4, w - 4, h - 8);
      ctx.fillStyle = '#6e5639'; ctx.fillRect(x + 2, y + 4, w - 4, 4);
      const my = front > 0 ? y + 9 : y + h - 21;
      ctx.fillStyle = '#0a0f1e'; ctx.fillRect(x + w / 2 - 18, my, 36, 12);
      ctx.fillStyle = broken ? '#2f62e0' : '#13306a'; ctx.fillRect(x + w / 2 - 16, my + 2, 32, 8);
      if (broken) txt(':(', x + w / 2, my + 6, 8, '#ffffff', 'center', '900');
      else { ctx.fillStyle = 'rgba(79,216,255,0.6)'; ctx.fillRect(x + w / 2 - 12, my + 4, 10 + Math.sin(time * 2 + d.id) * 4, 2); }
      ctx.fillStyle = '#2a2a33'; ctx.fillRect(x + w / 2 - 10, front > 0 ? y + 24 : y + 8, 20, 6); // keyboard
      const cy = front > 0 ? y + h + 8 : y - 8;
      ctx.fillStyle = '#30365a'; ctx.beginPath(); ctx.arc(x + w / 2, cy, 9, 0, 7); ctx.fill();
    } else if (d.type === 'printer') {
      ctx.fillStyle = '#c8ccd8'; rr(x + 5, y + 7, w - 10, h - 14, 4); ctx.fill();
      ctx.fillStyle = '#8a90a6'; ctx.fillRect(x + 9, y + 15, w - 18, 6);
      ctx.fillStyle = broken ? (blink ? '#ff3b5c' : '#5a1622') : '#5dffa0'; ctx.fillRect(x + w - 13, y + 11, 4, 3);
      ctx.fillStyle = '#ffffff';
      const py = front > 0 ? y + h - 10 : y + 2;
      if (broken) { ctx.save(); ctx.translate(x + w / 2, py + 4); ctx.rotate(Math.sin(time * 6) * 0.2); ctx.fillRect(-9, -5, 18, 10); ctx.restore(); }
      else ctx.fillRect(x + 12, py, w - 24, 6);
    }
    if (crit) {
      ctx.strokeStyle = blink ? '#ff3b5c' : 'rgba(255,59,92,0.4)'; ctx.lineWidth = 3;
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    }
  }
  function drawBin(b, time) {
    const x = sx(b.c), y = sy(b.r);
    ctx.fillStyle = '#3b3020'; ctx.fillRect(x + 2, y + 2, TS - 4, TS - 4);
    ctx.fillStyle = '#5a4a30'; ctx.fillRect(x + 2, y + 2, TS - 4, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; rr(x + 6, y + 9, TS - 12, TS - 15, 4); ctx.fill();
    icon(b.part, x + TS / 2, y + TS / 2 + 3, 20, PART_COL[b.part]);
  }
  // bubble above a broken device: problem icon + patience ring + fix progress
  function drawBubble(d, time) {
    const cx = sx(d.c + d.w / 2);
    const crit = d.brokenT >= S.cfg.crit;
    const k = Math.min(1, d.brokenT / S.cfg.crit);
    const bob = Math.sin(time * 4 + d.id) * 2;
    const r = crit ? 19 : 16;
    const below = sy(d.r) - 24 - r - 8 < OY + 4;   // top row: put the bubble under the device
    const by = (below ? sy(d.r + d.h) + 24 : sy(d.r) - 24) + bob;
    ctx.save();
    ctx.shadowColor = crit ? '#ff3b5c' : 'rgba(0,0,0,0.6)'; ctx.shadowBlur = crit ? 16 : 6;
    ctx.fillStyle = crit ? (Math.floor(time * 6) % 2 ? '#ff3b5c' : '#8a1426') : '#0c1230';
    ctx.beginPath(); ctx.arc(cx, by, r, 0, 7); ctx.fill();
    ctx.restore();
    // patience ring: yellow -> red
    const col = `hsl(${Math.round(50 - 50 * k)},100%,55%)`;
    ctx.strokeStyle = col; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, by, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - k)); ctx.stroke();
    if (S.mode === 'parts') icon(T[d.type].part, cx, by, 18, PART_COL[T[d.type].part]);
    else icon(d.type, cx, by, 18, '#ffffff');
    if (d.prog > 0) {
      ctx.strokeStyle = '#5dffa0'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(cx, by, r + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, d.prog)); ctx.stroke();
    }
    ctx.fillStyle = crit ? '#ff3b5c' : '#0c1230';
    const tip = below ? -1 : 1;
    ctx.beginPath(); ctx.moveTo(cx - 5, by + tip * (r - 1)); ctx.lineTo(cx + 5, by + tip * (r - 1)); ctx.lineTo(cx, by + tip * (r + 7)); ctx.fill();
  }

  // ---------- player ----------
  function drawPlayer(time) {
    const p = S.player, x = sx(p.x), y = sy(p.y);
    const walk = p.moving ? Math.sin(time * 14) : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 15, 11, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = `rgba(79,216,255,${0.45 + 0.2 * Math.sin(time * 4)})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 19, 0, 7); ctx.stroke();
    ctx.save(); ctx.translate(x, y); ctx.rotate(p.dir + Math.PI / 2);
    // feet
    ctx.fillStyle = '#1b1f2e';
    ctx.beginPath(); ctx.ellipse(-6, -2 + walk * 6, 4, 6, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(6, -2 - walk * 6, 4, 6, 0, 0, 7); ctx.fill();
    // body (school navy hoodie) and arms
    ctx.fillStyle = '#2b3f8f'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 10, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd84d'; ctx.fillRect(-14, -1, 28, 2.5);
    ctx.fillStyle = '#2b3f8f';
    ctx.beginPath(); ctx.arc(-13, -3 - walk * 4, 4.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(13, -3 + walk * 4, 4.5, 0, 7); ctx.fill();
    // head
    ctx.fillStyle = '#f2c9a0'; ctx.beginPath(); ctx.arc(0, -1, 8, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a2416'; ctx.beginPath(); ctx.arc(0, 1, 8, 0.15 * Math.PI, 0.85 * Math.PI, true); ctx.fill();
    ctx.restore();
    // carried parts float above the head
    S.inv.forEach((part, i) => {
      const ix = x + (i - (S.inv.length - 1) / 2) * 30, iy = y - 34 + Math.sin(time * 5 + i) * 2;
      ctx.fillStyle = 'rgba(6,10,32,0.85)'; ctx.beginPath(); ctx.arc(ix, iy, 13, 0, 7); ctx.fill();
      ctx.strokeStyle = PART_COL[part]; ctx.lineWidth = 2; ctx.stroke();
      icon(part, ix, iy, 16, PART_COL[part]);
    });
  }

  function drawTargetHint(time) {
    const o = S.target;
    if (!o || S.mini) return;
    const x = sx(o.c), y = sy(o.r), w = o.w * TS, h = o.h * TS;
    ctx.save();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -time * 30;
    ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
    ctx.restore();
    const bx = x + w + 12, by = y + h / 2;
    drawPadBtn(bx, by, 'A', BTN.A, 11);
  }

  // ---------- fx ----------
  function burst(x, y, n, colors, spd = 160, size = 5, life = 0.7, grav = 0) {
    for (let i = 0; i < n && fx.parts.length < 500; i++) {
      const a = Math.random() * Math.PI * 2, s = (0.3 + Math.random() * 0.7) * spd;
      fx.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (0.6 + Math.random() * 0.4), max: life, c: colors[i % colors.length], s: size * (0.5 + Math.random() * 0.5), g: grav });
    }
  }
  function floatText(str, x, y, color, size = 22) { fx.texts.push({ str, x, y, color, size, life: 1.3 }); }
  function updateFx(dt, time) {
    for (const p of fx.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.life -= dt; }
    fx.parts = fx.parts.filter(p => p.life > 0);
    for (const t of fx.texts) { t.y -= 34 * dt; t.life -= dt; }
    fx.texts = fx.texts.filter(t => t.life > 0);
    if (fx.banner) { fx.banner.t -= dt; if (fx.banner.t <= 0) fx.banner = null; }
    fx.shake = Math.max(0, fx.shake - dt);
    // smoke from overheating servers, sparks from critical devices
    if (S) for (const d of S.devices) {
      if (d.status !== 'broken') continue;
      const cx = sx(d.c + d.w / 2), cy = sy(d.r + d.h / 2);
      if (d.type === 'server' && Math.random() < dt * 10) fx.parts.push({ x: cx + (Math.random() - 0.5) * 20, y: cy, vx: (Math.random() - 0.5) * 20, vy: -30 - Math.random() * 20, life: 1.2, max: 1.2, c: 'rgba(160,170,190,0.5)', s: 8 + Math.random() * 6, g: 0 });
      if (d.brokenT >= S.cfg.crit && Math.random() < dt * 6) burst(cx, cy, 2, ['#ffd84d', '#ff7b39'], 120, 3, 0.4, 200);
    }
  }
  function drawFx() {
    for (const p of fx.parts) { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.c; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }
    ctx.globalAlpha = 1;
    for (const t of fx.texts) { ctx.globalAlpha = Math.min(1, t.life); glowTxt(t.str, t.x, t.y, t.size, t.color, t.color, 'center', '900'); }
    ctx.globalAlpha = 1;
  }

  // ---------- HUD ----------
  function clockStr(t) {
    const hrs = 8 + t / (SRSim.DAY_LEN / SRSim.HOURS);
    const h = Math.floor(hrs), m = Math.floor((hrs - h) * 60);
    return `${h}:${String(m).padStart(2, '0')}`;
  }
  function drawHUD(time) {
    ctx.fillStyle = '#070b20'; ctx.fillRect(0, 0, W, OY);
    ctx.fillStyle = 'rgba(79,216,255,0.35)'; ctx.fillRect(0, OY - 2, W, 2);
    // clock + day progress
    glowTxt(clockStr(Math.min(S.t, SRSim.DAY_LEN)), 24, 30, 36, '#ffffff', '#4fd8ff', 'left', '900', MONO);
    const bx = 24, bw = 300, by = 58;
    ctx.fillStyle = '#141c4d'; rr(bx, by, bw, 10, 5); ctx.fill();
    ctx.fillStyle = '#4fd8ff'; rr(bx, by, Math.max(10, bw * Math.min(1, S.t / SRSim.DAY_LEN)), 10, 5); ctx.fill();
    for (let hr = 0; hr <= SRSim.HOURS; hr++) {
      const tx = bx + bw * hr / SRSim.HOURS;
      ctx.fillStyle = '#cfe9ff'; ctx.fillRect(tx - 1, by - 3, 2, 16);
      txt(String(8 + hr), tx, by - 10, 11, '#8fb6ff', 'center', '700');
    }
    // network health
    const hx = 400, hw = 420, hy = 30;
    txt(tr('health'), hx, 14, 13, '#8fb6ff', 'left', '800');
    const hp = S.health / 100;
    ctx.fillStyle = '#141c4d'; rr(hx, hy - 6, hw, 26, 8); ctx.fill();
    const hcol = hp > 0.6 ? '#5dffa0' : hp > 0.3 ? '#ffd84d' : '#ff3b5c';
    ctx.fillStyle = hcol; rr(hx, hy - 6, Math.max(16, hw * hp), 26, 8); ctx.fill();
    txt(Math.ceil(S.health) + '%', hx + hw / 2, hy + 7, 18, '#0a0f26', 'center', '900', MONO);
    // currently broken counts as small icons
    const broken = S.devices.filter(d => d.status === 'broken');
    broken.slice(0, 10).forEach((d, i) => {
      const ix = hx + 12 + i * 28, iy = 66;
      ctx.fillStyle = d.brokenT >= S.cfg.crit ? '#ff3b5c' : '#2a1a3a'; ctx.beginPath(); ctx.arc(ix, iy, 10, 0, 7); ctx.fill();
      icon(d.type, ix, iy, 13, '#ffffff');
    });
    // score
    txt(tr('score'), W - 24, 14, 13, '#8fb6ff', 'right', '800');
    txt(String(S.score), W - 24, 40, 30, '#ffd84d', 'right', '900', MONO);
    txt(`${tr('fixes')}: ${S.fixes}`, W - 24, 66, 14, '#cfe9ff', 'right', '700');
    txt(`${tr(S.mode)} · ${tr(S.diff)}`, W - 200, 66, 13, DIFF_COL[S.diff], 'right', '800');
    // parts carried
    if (S.mode === 'parts') {
      txt(tr('hand'), 870, 14, 13, '#8fb6ff', 'left', '800');
      for (let i = 0; i < S.cfg.cap; i++) {
        const ix = 890 + i * 44, iy = 48;
        ctx.fillStyle = 'rgba(6,10,32,0.9)'; rr(ix - 18, iy - 18, 36, 36, 8); ctx.fill();
        ctx.strokeStyle = 'rgba(79,216,255,0.4)'; ctx.lineWidth = 2; ctx.stroke();
        if (S.inv[i]) icon(S.inv[i], ix, iy, 22, PART_COL[S.inv[i]]);
      }
    }
  }

  // ---------- mini-game overlay ----------
  function drawMini(time) {
    const m = S.mini; if (!m) return;
    const c = S.cfg;
    const pw = 520, ph = 150, px = W / 2 - pw / 2;
    const py = sy(S.player.y) > OY + (H - OY) / 2 ? OY + 16 : H - ph - 22; // keep it away from the player
    const shake = m.shake > 0 ? Math.sin(time * 80) * 8 * m.shake / 0.3 : 0;
    ctx.save(); ctx.translate(shake, 0);
    panel(px, py, pw, ph, 0.92);
    const titleKey = { hold: 'm_hold', mash: 'm_mash', spin: 'm_spin', combo: 'm_combo', timing: 'm_timing' }[m.kind];
    txt(tr('dev_' + m.dev.type) + ' · ' + tr(titleKey), W / 2, py + 24, 20, '#ffffff', 'center', '900');
    const d = m.dev;
    if (m.kind === 'hold' || m.kind === 'mash') {
      drawPadBtn(px + 60, py + 82, 'A', BTN.A, 24 + (m.kind === 'mash' ? Math.abs(Math.sin(time * 18)) * 3 : 0));
      ctx.fillStyle = '#141c4d'; rr(px + 110, py + 70, pw - 150, 26, 8); ctx.fill();
      ctx.fillStyle = '#5dffa0'; rr(px + 110, py + 70, Math.max(16, (pw - 150) * Math.min(1, d.prog)), 26, 8); ctx.fill();
    } else if (m.kind === 'spin') {
      const cx = px + 90, cy = py + 85, r = 38;
      ctx.strokeStyle = '#141c4d'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
      ctx.strokeStyle = '#5dffa0'; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, d.prog)); ctx.stroke();
      const a = m.angle !== null ? m.angle : time * 3;
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, 9, 0, 7); ctx.fill();
      txt('↻', cx, cy + 2, 26, '#8fb6ff', 'center', '900');
      txt(tr('m_spinKb'), px + 300, py + 70, 15, '#8fb6ff', 'center', '600');
      ctx.fillStyle = '#141c4d'; rr(px + 160, py + 90, pw - 200, 20, 8); ctx.fill();
      ctx.fillStyle = '#5dffa0'; rr(px + 160, py + 90, Math.max(14, (pw - 200) * Math.min(1, d.prog)), 20, 8); ctx.fill();
    } else if (m.kind === 'combo') {
      const n = m.seq.length, gap = 64, x0 = W / 2 - (n - 1) * gap / 2;
      m.seq.forEach((b, i) => {
        const done = i < m.idx, cur = i === m.idx;
        ctx.globalAlpha = done ? 0.3 : 1;
        drawPadBtn(x0 + i * gap, py + 82, b, BTN[b], cur ? 25 + Math.sin(time * 10) * 2 : 20);
        if (done) txt('✓', x0 + i * gap, py + 82, 26, '#5dffa0', 'center', '900');
        ctx.globalAlpha = 1;
      });
    } else if (m.kind === 'timing') {
      const bx = px + 40, bw = pw - 80, by = py + 70;
      ctx.fillStyle = '#141c4d'; rr(bx, by, bw, 30, 8); ctx.fill();
      ctx.fillStyle = 'rgba(93,255,160,0.85)'; ctx.fillRect(bx + bw * (m.zone - c.zone / 2), by, bw * c.zone, 30);
      const nx = bx + bw * m.needle;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(nx - 3, by - 8, 6, 46);
      for (let i = 0; i < c.hits; i++) {
        ctx.fillStyle = i < m.hits ? '#5dffa0' : '#141c4d';
        ctx.beginPath(); ctx.arc(W / 2 - (c.hits - 1) * 14 + i * 28, by + 52, 8, 0, 7); ctx.fill();
      }
    }
    // cancel hint
    if (m.kind === 'combo') txt(tr('m_cancelStick'), px + pw - 14, py + ph - 14, 14, '#8fb6ff', 'right', '600');
    else { drawPadBtn(px + pw - 90, py + ph - 16, 'B', BTN.B, 10); txt(tr('m_cancel'), px + pw - 76, py + ph - 15, 14, '#8fb6ff', 'left', '600'); }
    ctx.restore();
  }

  // ---------- full game frame ----------
  function drawWorld(time) {
    let ox = 0, oy = 0;
    if (fx.shake > 0) { ox = (Math.random() - 0.5) * 10 * fx.shake; oy = (Math.random() - 0.5) * 10 * fx.shake; }
    ctx.save(); ctx.translate(ox, oy);
    ctx.drawImage(floorCv, 0, OY, W, H - OY);
    for (const b of S.bins) drawBin(b, time);
    for (const d of S.devices) drawDevice(d, time);
    drawTargetHint(time);
    drawPlayer(time);
    for (const d of S.devices) if (d.status === 'broken') drawBubble(d, time);
    drawFx();
    ctx.restore();
    // low-health warning vignette
    if (S.health < 30 && !S.over) {
      const a = (0.25 + 0.2 * Math.sin(time * 6)) * (1 - S.health / 30);
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85);
      g.addColorStop(0, 'rgba(255,0,40,0)'); g.addColorStop(1, `rgba(255,0,40,${a})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    drawHUD(time);
    drawMini(time);
    if (fx.banner) {
      ctx.globalAlpha = Math.min(1, fx.banner.t * 2);
      panel(W / 2 - 430, OY + 14, 860, 50, 0.9);
      txt(fx.banner.text, W / 2, OY + 40, 22, '#ffd84d', 'center', '800');
      ctx.globalAlpha = 1;
    }
  }

  // ---------- input -> simulation intent ----------
  function intent() {
    let mx = I.lx, my = I.ly;
    if (Math.hypot(mx, my) < 0.22) {
      mx = (held('right') ? 1 : 0) - (held('left') ? 1 : 0);
      my = (held('down') ? 1 : 0) - (held('up') ? 1 : 0);
    }
    const btnP = pressed('a') ? 'A' : pressed('b') ? 'B' : pressed('x') ? 'X' : pressed('y') ? 'Y' : null;
    let dirP = null;
    if (Math.hypot(I.lx, I.ly) < 0.3) dirP = pressed('left') ? 'l' : pressed('right') ? 'r' : pressed('up') ? 'u' : pressed('down') ? 'd' : null;
    return { mx, my, aHeld: held('a'), aP: pressed('a'), bP: pressed('b'), btnP, sx: I.lx, sy: I.ly, dirP };
  }

  function handleEvents(ev) {
    for (const e of ev) {
      const d = e.dev;
      const cx = d ? sx(d.c + d.w / 2) : 0, cy = d ? sy(d.r) : 0;
      switch (e.type) {
        case 'break': sfx.alarm(); floatText(tr('prob_' + d.type), cx, cy - 40, '#ffb3c0', 18); break;
        case 'critical': sfx.crit(); rumble(150, 0.5); floatText(tr('crit'), cx, cy - 46, '#ff3b5c', 20); break;
        case 'fixed':
          sfx.fix(); rumble(80, 0.25);
          burst(cx, cy + 20, 26, ['#5dffa0', '#4fd8ff', '#ffffff'], 220, 6, 0.8);
          floatText('+' + e.pts, cx, cy - 30, '#ffd84d', 26);
          if (e.quick >= 30) floatText(tr('quick'), cx, cy - 58, '#7dff9b', 16);
          if (e.streak >= 2) floatText(`${tr('streak')} ×${e.streak}`, cx, cy - 78, '#c58bff', 16);
          break;
        case 'bell': sfx.bell(); fx.banner = { text: tr('bell_' + e.hour), t: 3.2 }; break;
        case 'pick': sfx.pick(); floatText(tr('part_' + e.part), sx(S.player.x), sy(S.player.y) - 50, PART_COL[e.part], 16); break;
        case 'already': sfx.wrong(); floatText(tr('already'), sx(S.player.x), sy(S.player.y) - 50, '#ffb347', 16); break;
        case 'drop': sfx.select(); floatText(tr('dropped'), sx(S.player.x), sy(S.player.y) - 50, '#8fb6ff', 14); break;
        case 'needPart': sfx.wrong(); floatText(`${tr('need')} ${tr('part_' + e.part)}`, cx, cy - 50, PART_COL[e.part], 18); break;
        case 'miniStart': sfx.select(); break;
        case 'miniHit': sfx.hit(); break;
        case 'miniMiss': sfx.miss(); rumble(100, 0.4); break;
        case 'miniCancel': sfx.select(); break;
        case 'gameOver': sfx.over(); rumble(400, 1); fx.shake = 0.6; break;
        case 'dayEnd': sfx.win(); sfx.bell(); break;
      }
    }
  }

  function updatePlay(dt, time) {
    if (pressed('start')) { scene = 'pause'; menuI = 0; sfx.select(); return; }
    if (I.padWas && !I.pad) { scene = 'pause'; menuI = 0; padLostMsg = true; return; }
    const ev = SRSim.step(S, dt, intent());
    handleEvents(ev);
    updateFx(dt, time);
    if (S.player.moving) { fx.stepT += dt; if (fx.stepT > 0.28) { fx.stepT = 0; sfx.step(); } }
    if (S.over) { scene = 'ending'; sceneT = 0; }
  }

  function finish() {
    const r = { mode: S.mode, diff: S.diff, won: S.won, score: S.score, fixes: S.fixes, health: Math.round(S.health), bonus: S.dayBonus || 0, t: S.t, savedId: null };
    result = r;
    const key = boardKey(r.mode, r.diff);
    if (boardQualifies(key, r.score)) { nameEntry.start(); scene = 'name'; }
    else scene = 'over';
    sceneT = 0;
  }

  // ---------- menus ----------
  const TITLE_ITEMS = ['start', 'mode', 'diff', 'board', 'lang', 'sound', 'launcher'];
  function updateTitle(dt) {
    stepDemo(dt);
    if (nav('up')) { menuI = (menuI + TITLE_ITEMS.length - 1) % TITLE_ITEMS.length; sfx.select(); }
    if (nav('down')) { menuI = (menuI + 1) % TITLE_ITEMS.length; sfx.select(); }
    if (pressed('b')) { sfx.select(); App.go('launcher'); return; }
    const it = TITLE_ITEMS[menuI];
    const L = nav('left'), R = nav('right'), A = pressed('a');
    if (it === 'mode' && (L || R || A)) { modeI = (modeI + (L ? 2 : 1)) % 3; sfx.select(); }
    else if (it === 'diff' && (L || R || A)) { diffI = (diffI + (L ? 3 : 1)) % 4; sfx.select(); }
    else if (it === 'lang' && (L || R || A)) { toggleLang(); sfx.select(); }
    else if (it === 'sound' && (L || R || A)) { toggleMute(); sfx.confirm(); }
    else if (A) {
      if (it === 'start') { prepare(); scene = 'brief'; sfx.confirm(); }
      else if (it === 'board') { boardDiffI = diffI; scene = 'board'; sfx.confirm(); }
      else if (it === 'launcher') { sfx.select(); App.go('launcher'); }
    }
  }
  function updateBrief() {
    if (sceneT > 0.3 && pressed('a')) startDay();
    else if (pressed('b')) { scene = 'title'; sfx.select(); }
  }
  function updateBoard(dt) {
    stepDemo(dt);
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
      else if (it === 'restart') { prepare(); scene = 'brief'; }
      else { scene = 'title'; menuI = 0; sfx.select(); }
    }
  }
  function updateOver(dt) {
    stepDemo(dt);
    if (sceneT > 1.0) {
      if (pressed('a')) { prepare(); scene = 'brief'; sfx.confirm(); return; }
      if (pressed('b') || pressed('start')) { scene = 'title'; menuI = 0; sfx.select(); return; }
    }
    if (performance.now() - lastInputT > 45000) { scene = 'title'; menuI = 0; diffI = 1; }
  }

  // a calm background "attract mode" room on the menus
  function stepDemo(dt) {
    if (!demo) { demo = { s: SRSim.create({ mode: 'simple', diff: 'easy' }), t: 0 }; demo.floor = renderFloor(demo.s); }
    demo.t += dt;
    const d = demo.s;
    // a lazy auto-pilot: wander toward broken devices
    const b = d.devices.find(x => x.status === 'broken');
    let mx = 0, my = 0, a = false;
    if (b) {
      const tx = b.c + b.w / 2, ty = b.r + (b.side === 'down' ? b.h + 0.5 : -0.5);
      const dx = tx - d.player.x, dy = ty - d.player.y, dd = Math.hypot(dx, dy);
      if (dd > 0.4) { mx = dx / dd * 0.6; my = dy / dd * 0.6; } else a = true;
      if (SRSim.inRange(d, b)) a = true;
    }
    SRSim.step(d, dt, { mx, my, aHeld: a, aP: false, bP: false, btnP: null, sx: 0, sy: 0, dirP: null });
    d.health = 100;
    if (d.over || demo.t > 100) demo = null;
  }
  function drawDemoBackdrop(time) {
    if (!demo) stepDemo(0);
    const keepS = S, keepF = floorCv, keepFx = fx;
    S = demo.s; floorCv = demo.floor; fx = fx || newFx();
    ctx.drawImage(floorCv, 0, OY, W, H - OY);
    for (const d of S.devices) drawDevice(d, time);
    drawPlayer(time);
    for (const d of S.devices) if (d.status === 'broken') drawBubble(d, time);
    S = keepS; floorCv = keepF; fx = keepFx;
    ctx.fillStyle = '#070b20'; ctx.fillRect(0, 0, W, OY);
    dim(0.62);
  }

  function drawTitle(time) {
    drawDemoBackdrop(time);
    if (logoReady) { ctx.save(); ctx.shadowColor = '#4fd8ff'; ctx.shadowBlur = 25; ctx.drawImage(logo, W / 2 - 60, 12, 120, 120); ctx.restore(); }
    glowTxt(tr('title'), W / 2, 178, 62, '#ffffff', '#ff3b5c', 'center', '900');
    txt(tr('subtitle'), W / 2, 226, 22, '#cfe9ff', 'center', '600');
    txt(tr('school'), W / 2, 256, 17, '#8fb6ff', 'center', '600');
    const md = curMode(), dk = curDiff();
    const labels = {
      start: tr('start'), mode: `${tr('modeItem')}: ${tr(md)}`, diff: `${tr('diffItem')}: ${tr(dk)}`,
      board: tr('board'), lang: tr('langItem'), sound: muted ? tr('soundOff') : tr('soundOn'), launcher: tr('toLauncher')
    };
    const descs = {
      start: tr('startDesc'), mode: tr('modeDesc_' + md), diff: tr('diffDesc_' + dk), board: tr('boardDesc'),
      lang: tr('langDesc'), sound: tr('soundDesc'), launcher: tr('toLauncherDesc')
    };
    TITLE_ITEMS.forEach((it, i) => {
      const y = 304 + i * 40, sel = i === menuI;
      if (sel) {
        const pulse = 0.5 + 0.5 * Math.sin(time * 6);
        ctx.fillStyle = `rgba(79,216,255,${0.16 + 0.08 * pulse})`; rr(W / 2 - 250, y - 17, 500, 34, 10); ctx.fill();
        ctx.strokeStyle = '#4fd8ff'; ctx.lineWidth = 2; ctx.stroke();
        txt('▶', W / 2 - 228, y + 1, 18, '#4fd8ff', 'center', '900');
      }
      if (it === 'mode' || it === 'diff' || (sel && (it === 'lang' || it === 'sound'))) {
        txt('◀', W / 2 - 185, y + 1, 14, sel ? '#ffffff' : '#8fb6ff'); txt('▶', W / 2 + 185, y + 1, 14, sel ? '#ffffff' : '#8fb6ff');
      }
      const col = it === 'diff' ? DIFF_COL[dk] : it === 'mode' ? '#ffd84d' : sel ? '#ffffff' : '#9fb3e0';
      txt(labels[it], W / 2, y + 1, sel ? 23 : 20, col, 'center', sel ? '900' : '700');
    });
    txt(descs[TITLE_ITEMS[menuI]], W / 2, 600, 19, '#ffd84d', 'center', '600');
    drawPadBtn(W / 2 - 60, 648, 'A', BTN.A); txt(tr('select'), W / 2 - 40, 649, 18, '#cfe9ff', 'left', '600');
    drawPadBtn(W / 2 + 60, 648, 'B', BTN.B); txt(tr('back'), W / 2 + 80, 649, 18, '#cfe9ff', 'left', '600');
    drawPadStatus(694);
  }

  function drawBrief(time) {
    // the real (new) map, dimmed, behind the instructions
    ctx.drawImage(floorCv, 0, OY, W, H - OY);
    for (const b of S.bins) drawBin(b, time);
    for (const d of S.devices) drawDevice(d, time);
    drawPlayer(time);
    drawHUD(time);
    dim(0.6);
    const px = W / 2 - 400, py = 120, pw = 800, ph = 470;
    panel(px, py, pw, ph, 0.94);
    glowTxt(`${tr(S.mode)} · ${tr(S.diff)}`, W / 2, py + 40, 30, '#ffffff', '#4fd8ff', 'center', '900');
    txt(tr('brief_goal'), W / 2, py + 86, 18, '#ffd84d', 'center', '700');
    let y = py + 140;
    if (S.mode === 'mini') {
      for (const type of ['server', 'switch', 'printer', 'pc', 'wifi']) {
        ctx.fillStyle = '#141c4d'; ctx.beginPath(); ctx.arc(px + 90, y, 18, 0, 7); ctx.fill();
        icon(type, px + 90, y, 22, '#ffffff');
        txt(tr('brief_mini_' + type), px + 124, y + 1, 20, '#ffffff', 'left', '700');
        y += 50;
      }
    } else {
      txt(tr(S.mode === 'simple' ? 'brief_simple' : 'brief_parts'), W / 2, y, 20, '#ffffff', 'center', '700');
      y += 50;
      // device -> problem (and part) legend
      for (const type of ['server', 'switch', 'printer', 'pc', 'wifi']) {
        ctx.fillStyle = '#141c4d'; ctx.beginPath(); ctx.arc(px + 150, y, 17, 0, 7); ctx.fill();
        icon(type, px + 150, y, 20, '#ffffff');
        txt(`${tr('dev_' + type)}: ${tr('prob_' + type)}`, px + 182, y + 1, 18, '#cfe9ff', 'left', '600');
        if (S.mode === 'parts') {
          const part = T[type].part;
          txt('→', px + 520, y + 1, 20, '#8fb6ff', 'center', '900');
          icon(part, px + 556, y, 20, PART_COL[part]);
          txt(tr('part_' + part), px + 580, y + 1, 18, PART_COL[part], 'left', '800');
        }
        y += 44;
      }
    }
    txt(tr('brief_move'), W / 2, py + ph - 70, 17, '#8fb6ff', 'center', '600');
    drawPadBtn(W / 2 - 90, py + ph - 30, 'A', BTN.A, 15); txt(tr('brief_start'), W / 2 - 68, py + ph - 29, 20, '#ffffff', 'left', '800');
    drawPadBtn(W / 2 + 60, py + ph - 30, 'B', BTN.B, 15); txt(tr('brief_back'), W / 2 + 82, py + ph - 29, 20, '#cfe9ff', 'left', '600');
  }

  function drawBoardList(mode, diff, x, y, highlightId, w = 360) {
    const b = boardGet(boardKey(mode, diff));
    txt(tr(mode), x, y, 22, '#ffd84d', 'center', '900');
    if (!b.length) { txt(tr('empty'), x, y + 50, 17, '#8fb6ff', 'center', '600'); return; }
    b.forEach((e, i) => {
      const yy = y + 40 + i * 30, hl = e.id === highlightId;
      if (hl) { ctx.fillStyle = 'rgba(255,216,77,0.18)'; rr(x - w / 2 + 10, yy - 14, w - 20, 28, 6); ctx.fill(); }
      const col = hl ? '#ffd84d' : i === 0 ? '#ffffff' : '#cfe9ff';
      txt(`${i + 1}.`, x - w / 2 + 50, yy, 17, col, 'right', '700', MONO);
      txt(String(e.n), x - w / 2 + 62, yy, 18, col, 'left', '800', MONO);
      txt(String(e.s), x + w / 2 - 24, yy, 18, col, 'right', '800', MONO);
    });
  }
  function drawBoardScene(time) {
    drawDemoBackdrop(time);
    glowTxt(tr('boardTitle'), W / 2, 56, 48, '#ffffff', '#4fd8ff', 'center', '900');
    const bd = DIFF_KEYS[boardDiffI];
    txt('◀', W / 2 - 130, 106, 18, '#ffffff'); txt('▶', W / 2 + 130, 106, 18, '#ffffff');
    txt(tr(bd), W / 2, 106, 26, DIFF_COL[bd], 'center', '900');
    MODES.forEach((m, i) => {
      const x = 230 + i * 410;
      panel(x - 190, 136, 380, 470, 0.7);
      drawBoardList(m, bd, x, 168, null, 380);
    });
    txt(tr('boardHint'), W / 2 - 60, 650, 18, '#8fb6ff', 'right', '600');
    drawPadBtn(W / 2 + 10, 650, 'B', BTN.B); txt(tr('back'), W / 2 + 30, 651, 20, '#cfe9ff', 'left', '600');
  }

  function drawPause(time) {
    drawWorld(time);
    dim(0.65);
    glowTxt(tr('paused'), W / 2, 220, 64, '#ffffff', '#4fd8ff', 'center', '900');
    if (padLostMsg) txt(tr('padLost'), W / 2, 280, 24, '#ffb347', 'center', '700');
    PAUSE_ITEMS.forEach((it, i) => {
      const y = 350 + i * 56, sel = i === menuI;
      if (sel) { ctx.fillStyle = 'rgba(79,216,255,0.2)'; rr(W / 2 - 180, y - 22, 360, 44, 10); ctx.fill(); ctx.strokeStyle = '#4fd8ff'; ctx.lineWidth = 2; ctx.stroke(); }
      txt(tr(it), W / 2, y + 1, sel ? 28 : 24, sel ? '#fff' : '#9fb3e0', 'center', sel ? '900' : '700');
    });
    drawPadStatus(620);
  }

  function drawResultHeader() {
    const r = result;
    glowTxt(r.won ? tr('won') : tr('lost'), W / 2, 62, 46, r.won ? '#7dff9b' : '#ff6b81', r.won ? '#2ad16b' : '#ff3b5c', 'center', '900');
    txt(r.won ? tr('wonSub') : tr('lostSub'), W / 2, 104, 19, r.won ? '#bfffd6' : '#ffb3c0', 'center', '600');
    glowTxt(String(r.score), W / 2, 158, 60, '#ffffff', '#4fd8ff', 'center', '900', MONO);
    txt(`${tr(r.mode)} · ${tr(r.diff)}`, W / 2 + 300, 158, 18, DIFF_COL[r.diff], 'left', '900');
    const line = r.won
      ? `${tr('fixes')}: ${r.fixes}   ·   ${tr('health')}: ${r.health}%   ·   ${tr('dayBonus')}: ${r.bonus}`
      : `${tr('fixes')}: ${r.fixes}   ·   ${tr('endTime')}: ${clockStr(r.t)}`;
    txt(line, W / 2, 204, 18, '#cfe9ff', 'center', '600', MONO);
  }
  function drawName(time) {
    drawDemoBackdrop(time);
    drawResultHeader();
    nameEntry.draw(time, sceneT, 400);
  }
  function drawOver(time) {
    drawDemoBackdrop(time);
    drawResultHeader();
    panel(W / 2 - 230, 236, 460, 380, 0.75);
    drawBoardList(result.mode, result.diff, W / 2, 264, result.savedId, 460);
    glowTxt(tr('cta'), W / 2, 646, 24, '#ffd84d', '#ff9f00', 'center', '800');
    ctx.globalAlpha = sceneT > 1.0 ? 1 : 0.4;
    drawPadBtn(W / 2 - 170, 690, 'A', BTN.A); txt(tr('again'), W / 2 - 150, 691, 19, '#cfe9ff', 'left', '600');
    drawPadBtn(W / 2 + 50, 690, 'B', BTN.B); txt(tr('toMenu'), W / 2 + 70, 691, 19, '#cfe9ff', 'left', '600');
    ctx.globalAlpha = 1;
  }

  // ---------- module interface ----------
  function update(dt, time) {
    sceneT += dt;
    const prev = scene;
    if (scene === 'title') updateTitle(dt);
    else if (scene === 'brief') updateBrief(dt);
    else if (scene === 'board') updateBoard(dt);
    else if (scene === 'play') updatePlay(dt, time);
    else if (scene === 'pause') updatePause(dt);
    else if (scene === 'ending') { updateFx(dt, time); if (sceneT > 2.0) finish(); }
    else if (scene === 'name') {
      stepDemo(dt);
      const name = nameEntry.update(sceneT, sfx);
      if (name) { result.savedId = boardSave(boardKey(result.mode, result.diff), name, result.score, result.fixes); scene = 'over'; sfx.confirm(); }
    }
    else if (scene === 'over') updateOver(dt);
    if (scene !== prev) sceneT = 0;
  }
  function draw(time) {
    if (scene === 'title') drawTitle(time);
    else if (scene === 'brief') drawBrief(time);
    else if (scene === 'board') drawBoardScene(time);
    else if (scene === 'play') drawWorld(time);
    else if (scene === 'pause') drawPause(time);
    else if (scene === 'ending') {
      drawWorld(time);
      ctx.globalAlpha = Math.min(1, sceneT / 1.5); dim(0.5); ctx.globalAlpha = 1;
      glowTxt(S.won ? tr('won') : tr('lost'), W / 2, H / 2, 54, S.won ? '#7dff9b' : '#ff6b81', S.won ? '#2ad16b' : '#ff3b5c', 'center', '900');
    }
    else if (scene === 'name') drawName(time);
    else if (scene === 'over') drawOver(time);
    document.body.style.cursor = scene === 'play' ? 'none' : 'default';
  }
  function enter() { scene = 'title'; menuI = 0; sceneT = 0; }
  function onHide() { if (scene === 'play') { scene = 'pause'; menuI = 0; } }

  window.__sr = { get scene() { return scene; }, get S() { return S; }, set mode(i) { modeI = i; }, set diff(i) { diffI = i; }, prepare, startDay };
  return {
    enter, update, draw, onHide, blockHotkeys: () => scene === 'name', txt: TXT,
    card: { title: { hu: 'SZERVERTEREM-PÁNIK', en: 'SERVER ROOM PANIC' }, hu: 'Javítsd meg, ami elromlik, mielőtt leáll a suli hálózata!', en: 'Fix whatever breaks before the school network goes down!' }
  };
})();
App.register('server', ServerRoom);
