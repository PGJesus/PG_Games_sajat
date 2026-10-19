// ---------- audio ----------
let actx = null, master = null, muted = !!store.get('muted', false);
function ensureAudio() {
  try {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      actx = new AC();
      master = actx.createGain(); master.gain.value = 0.8; master.connect(actx.destination);
    }
    if (actx.state === 'suspended') actx.resume().catch(() => { });
  } catch (e) { }
}
function canPlay() { return !muted && actx && actx.state === 'running'; }
function tone(f1, f2, dur, type = 'square', vol = 0.06, delay = 0) {
  if (!canPlay()) return;
  const t0 = actx.currentTime + delay;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f1, t0);
  if (f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(master);
  o.start(t0); o.stop(t0 + dur + 0.03);
}
let noiseBuf = null;
function noise(dur, vol = 0.1) {
  if (!canPlay()) return;
  if (!noiseBuf) {
    noiseBuf = actx.createBuffer(1, actx.sampleRate * 0.5, actx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = actx.createBufferSource(), g = actx.createGain();
  s.buffer = noiseBuf;
  g.gain.setValueAtTime(vol, actx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
  s.connect(g); g.connect(master);
  s.start(); s.stop(actx.currentTime + dur);
}