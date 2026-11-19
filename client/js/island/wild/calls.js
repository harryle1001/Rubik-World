// wild/calls.js — Tiếng kêu từng loài, TỔNG HỢP bằng WebAudio (không cần file → 0 KB tải thêm, không vướng giấy phép).
// Mỗi tiếng = vài "nốt": [dạng sóng, tần số đầu → cuối (Hz), độ dài (s), số lần lặp, khoảng nghỉ, rung (Hz), lọc thông thấp (Hz)].
// Nối vào AudioListener của game (audio.js) nên theo nút 🔊 bật/tắt chung; âm lượng giảm theo khoảng cách tới người chơi.
// Vài loài dùng file CC0 có sẵn của game (chó sủa, cừu kêu, hải âu…): xem MP3.
const R = {   // w, f0, f1, d, n, gap, trem, lp, vol
  chirp: ['sine', 2600, 3600, 0.07, 3, 0.07, 0, 0, 0.5], tweet: ['sine', 3200, 2300, 0.09, 4, 0.05, 0, 0, 0.45], song: ['sine', 1800, 3400, 0.14, 5, 0.06, 18, 0, 0.45],
  coo: ['sine', 420, 340, 0.32, 3, 0.16, 0, 900, 0.6], caw: ['sawtooth', 620, 480, 0.2, 3, 0.14, 0, 1800, 0.4], screech: ['sawtooth', 2400, 1500, 0.5, 1, 0, 28, 4200, 0.3],
  quack: ['sawtooth', 380, 300, 0.11, 4, 0.07, 0, 1500, 0.45], honk: ['square', 300, 380, 0.18, 2, 0.12, 0, 1300, 0.35], crow: ['sawtooth', 520, 900, 0.9, 1, 0, 9, 2400, 0.4],
  moo: ['sawtooth', 120, 92, 1.3, 1, 0, 0, 520, 0.7], neigh: ['sawtooth', 1100, 380, 0.9, 1, 0, 14, 2600, 0.35], oink: ['square', 190, 140, 0.12, 2, 0.1, 0, 700, 0.45],
  baa: ['sawtooth', 430, 390, 0.7, 1, 0, 11, 1400, 0.4], hum: ['sine', 260, 200, 0.6, 1, 0, 6, 700, 0.5], bark: ['square', 420, 260, 0.1, 2, 0.12, 0, 1500, 0.45],
  growl: ['sawtooth', 85, 62, 1.0, 1, 0, 24, 380, 0.75], roar: ['sawtooth', 140, 70, 1.5, 1, 0, 30, 520, 0.8], howl: ['sine', 340, 560, 1.9, 1, 0, 5, 1400, 0.5],
  bellow: ['sawtooth', 210, 150, 1.2, 1, 0, 8, 800, 0.55], trumpet: ['sawtooth', 430, 640, 0.8, 1, 0, 20, 2200, 0.45], squeak: ['sine', 2900, 2500, 0.06, 2, 0.07, 0, 0, 0.35],
  croak: ['square', 95, 80, 0.16, 3, 0.2, 0, 480, 0.6], hiss: ['noise', 0, 0, 0.7, 1, 0, 0, 5200, 0.25], buzz: ['sawtooth', 190, 205, 0.7, 1, 0, 0, 900, 0.22],
  whale: ['sine', 150, 330, 2.4, 1, 0, 3, 700, 0.6],
};
const MP3 = { bark: 'sfx-dog', baa: 'sfx-sheep', chirp: 'sfx-chirp' };

export function createCalls(ctx) {
  const listener = ctx.audio && ctx.audio.listener; let noise = null, last = 0; const buf = {};
  const ac = () => listener && listener.context;
  function play(kind, dist = 0, pitch = 1) {
    const a = ac(), r = R[kind]; if (!a || !r || a.state !== 'running' || (ctx.audio && !ctx.audio.on)) return false;
    const now = a.currentTime; if (now - last < 0.9) return false; last = now;   // không chồng tiếng: tối đa ~1 tiếng/giây
    const vol = r[8] * Math.min(1, 9 / (9 + dist)) ** 1.3; if (vol < 0.02) return false;
    const out = a.createGain(); out.gain.value = vol; out.connect(listener.getInput());
    if (MP3[kind]) {   // file CC0 có sẵn (nạp 1 lần, lần sau phát ngay)
      if (buf[kind] === undefined) { buf[kind] = null; fetch(`/assets/audio/${MP3[kind]}.mp3`).then(x => x.arrayBuffer()).then(b => a.decodeAudioData(b)).then(b => { buf[kind] = b; }).catch(() => { buf[kind] = false; }); }
      if (buf[kind]) { const s = a.createBufferSource(); s.buffer = buf[kind]; s.playbackRate.value = pitch; s.connect(out); s.start(); return true; }
      if (buf[kind] === null) return false;
    }
    const [w, f0, f1, d, n, gap, trem, lp] = r; let dst = out;
    if (lp) { const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; f.connect(out); dst = f; }
    for (let i = 0; i < n; i++) {
      const t0 = now + i * (d + gap), g = a.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(1, t0 + Math.min(0.03, d * 0.3)); g.gain.setValueAtTime(1, t0 + d * 0.6); g.gain.linearRampToValueAtTime(0, t0 + d); g.connect(dst);
      let src;
      if (w === 'noise') {
        if (!noise) { noise = a.createBuffer(1, a.sampleRate, a.sampleRate); const ch = noise.getChannelData(0); for (let k = 0; k < ch.length; k++) ch[k] = Math.random() * 2 - 1; }
        src = a.createBufferSource(); src.buffer = noise;
      } else {
        src = a.createOscillator(); src.type = w; src.frequency.setValueAtTime(f0 * pitch, t0); src.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * pitch), t0 + d);
        if (trem) { const lfo = a.createOscillator(), lg = a.createGain(); lfo.frequency.value = trem; lg.gain.value = f0 * pitch * 0.06; lfo.connect(lg); lg.connect(src.frequency); lfo.start(t0); lfo.stop(t0 + d); }
      }
      src.connect(g); src.start(t0); src.stop(t0 + d + 0.02);
    }
    return true;
  }
  return { play, has: k => !!R[k] };
}
