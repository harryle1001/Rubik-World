// train/sound.js — ÂM THANH TỔNG HỢP (Web Audio, không dùng tệp): xình xịch theo nhịp bánh, lạch cạch mối ray 13 m,
// còi hơi 3 nốt (hợp âm Đô trưởng hơi lệch như còi thật), tiếng xả hơi khi dừng. Nghe nhỏ dần theo khoảng cách,
// trong toa / trong hầm thì trầm và vang hơn (lọc thông thấp).
export function createTrainSound(ctx) {
  const A = () => { const L = ctx.audio && ctx.audio.listener; return L && ctx.audio.on && L.context.state === 'running' ? L : null; };
  let bus = null, lp = null, noiseBuf = null;
  function ensure(L) {
    if (bus) return true;
    const ac = L.context; bus = ac.createGain(); lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000;
    bus.connect(lp).connect(L.getInput());
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  const env = (g, t, a, peak, rel) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0008, t + a + rel); };
  function noise(t, dur, type, f, q, peak, a = 0.005) {
    const L = A(); if (!L || !ensure(L)) return; const ac = L.context;
    const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noiseBuf; s.loop = true;
    fl.type = type; fl.frequency.value = f; fl.Q.value = q; env(g, t, a, peak, dur);
    s.connect(fl).connect(g).connect(bus); s.start(t, Math.random() * 0.5); s.stop(t + a + dur + 0.05);
  }
  let vol = 1, inside = 0;
  return {
    // gọi mỗi khung hình: khoảng cách camera → đầu máy, camera trong toa/hầm
    mix(dist, inCar, inTunnel) {
      const L = A(); if (!L || !ensure(L)) return; const t = L.context.currentTime;
      vol = Math.min(1, 21 / Math.max(8, dist)) * (inTunnel ? 1.6 : 1); inside = inCar ? 1 : 0;
      bus.gain.setTargetAtTime(vol, t, 0.1); lp.frequency.setTargetAtTime(inCar ? 1300 : inTunnel ? 2600 : 9000, t, 0.2);
    },
    chuff(speed) {   // 1 nhát hơi: tiếng "xịch" (nhiễu dải giữa) + "phù" trầm
      const L = A(); if (!L) return; const t = L.context.currentTime, k = Math.max(0.25, 1 - speed / 14);
      noise(t, 0.16 + 0.22 * k, 'bandpass', 520 + Math.random() * 260, 0.9, 0.42 * k + 0.1);
      noise(t, 0.12 + 0.2 * k, 'lowpass', 260, 0.7, 0.28 * k);
    },
    clack(gapSec) {   // bánh trước–sau giá chuyển hướng qua mối ray: "cạch… cạch"
      const L = A(); if (!L) return; const t = L.context.currentTime;
      for (const d of [0, Math.min(0.4, gapSec)]) { noise(t + d, 0.05, 'bandpass', 2400, 3, 0.16); noise(t + d, 0.08, 'lowpass', 180, 1, 0.22); }
    },
    whistle(len = 1.4) {   // còi hơi: 3 sóng răng cưa (hợp âm C–E–G hơi lệch), lọc dải, rung nhẹ, hơi nhiễu
      const L = A(); if (!L || !ensure(L)) return; const ac = L.context, t = ac.currentTime;
      const fl = ac.createBiquadFilter(), g = ac.createGain(); fl.type = 'bandpass'; fl.frequency.value = 1100; fl.Q.value = 1.2;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16, t + 0.12); g.gain.setValueAtTime(0.16, t + len - 0.25); g.gain.exponentialRampToValueAtTime(0.0008, t + len + 0.3);
      fl.connect(g).connect(bus);
      for (const f of [523.25, 659.25 * 1.004, 783.99 * 0.997]) {
        const o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 0.94, t); o.frequency.linearRampToValueAtTime(f, t + 0.18);
        lfo.frequency.value = 5.5; lg.gain.value = f * 0.004; lfo.connect(lg).connect(o.frequency);
        o.connect(fl); o.start(t); o.stop(t + len + 0.35); lfo.start(t); lfo.stop(t + len + 0.35);
      }
      noise(t, len, 'highpass', 3500, 0.7, 0.05, 0.1);
    },
    hiss(len = 1.6) { const L = A(); if (!L) return; noise(L.context.currentTime, len, 'highpass', 2000, 0.5, 0.18, 0.05); },   // xả hơi
  };
}
