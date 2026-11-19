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
  // tệp CC0 (CREDITS.txt): tiếng máy hơi nước lặp, ly đặt xuống bàn, nĩa chạm đĩa, chuông ga
  const bufs = {}, file = n => { const L = A(); if (!L) return null; if (!bufs[n]) bufs[n] = fetch(`/assets/audio/${n}.mp3`).then(r => r.arrayBuffer()).then(a => L.context.decodeAudioData(a)).catch(() => null); return bufs[n]; };
  function play(n, vol = 0.5, rate = 1, toBus = false) { const L = A(); if (!L || !ensure(L)) return; file(n).then(b => { if (!b) return; const ac = L.context, s = ac.createBufferSource(), g = ac.createGain(); s.buffer = b; s.playbackRate.value = rate; g.gain.value = vol; s.connect(g).connect(toBus ? bus : L.getInput()); s.start(); }); }
  let eng = null, engG = null;
  function engine(speed) {   // vòng lặp máy hơi nước: to + nhanh dần theo tốc độ, tắt khi tàu đứng
    const L = A(); if (!L || !ensure(L)) return; const ac = L.context, t = ac.currentTime;
    if (!eng && speed > 0.2) { eng = 'loading'; file('amb-train-engine').then(b => { if (!b) { eng = null; return; } eng = ac.createBufferSource(); eng.buffer = b; eng.loop = true; engG = ac.createGain(); engG.gain.value = 0; eng.connect(engG).connect(bus); eng.start(); }); }
    if (eng && eng !== 'loading') { engG.gain.setTargetAtTime(speed > 0.2 ? Math.min(0.5, 0.12 + speed * 0.025) : 0, t, 0.4); eng.playbackRate.setTargetAtTime(0.75 + Math.min(0.6, speed * 0.035), t, 0.4); }
  }
  // thông báo ga: chuông "ding–dong" + dòng chữ lớn + đọc bằng giọng tiếng Việt (nếu máy có)
  const ann = document.createElement('div');
  ann.style.cssText = 'position:fixed;left:50%;top:34%;transform:translateX(-50%);z-index:28;max-width:min(92vw,610px);padding:10px 18px;border-radius:16px;background:#0f1a2ae6;color:#ffe3a0;font:700 clamp(15px,4vw,21px)/1.45 system-ui;text-align:center;pointer-events:none;opacity:0;transition:opacity .6s';
  document.body.appendChild(ann); let annT = 0;
  function announce(text, say) {
    ann.innerHTML = '📢 ' + text; ann.style.opacity = 1; clearTimeout(annT); annT = setTimeout(() => { ann.style.opacity = 0; }, 6500);
    play('sfx-bell1', 0.5, 1); setTimeout(() => play('sfx-bell1', 0.45, 0.8), 420);
    try { if (say && ctx.audio && ctx.audio.on !== false && 'speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(say); u.lang = 'vi-VN'; u.rate = 0.95; const v = speechSynthesis.getVoices().find(v => /^vi/i.test(v.lang)); if (v) { u.voice = v; setTimeout(() => speechSynthesis.speak(u), 1100); } } } catch (e) {}
  }
  return {
    engine, announce, cup: () => { play('sfx-cup', 0.6, 0.95 + Math.random() * 0.1); setTimeout(() => play('sfx-dish', 0.35, 1.1), 260); },
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
