// audio.js — Nhạc nền êm + âm thanh 3D (gió, sóng nước, chim) bằng THREE.PositionalAudio.
// Âm thanh tự tổng hợp bằng OfflineAudioContext (không cần file). Muốn dùng file thật: thay buffer bằng AudioLoader.
import * as THREE from 'three';
import { CFG } from './config.js';

const KEY = 'island.sound';
const SR = 22050;
async function render(sec, build) { const oc = new OfflineAudioContext(1, Math.ceil(SR * sec), SR); build(oc); return oc.startRendering(); }
const noiseSrc = (oc, sec) => { const b = oc.createBuffer(1, SR * sec, SR), d = b.getChannelData(0); let last = 0; for (let i = 0; i < d.length; i++) { last = (last + 0.04 * (Math.random() * 2 - 1)) / 1.04; d[i] = last * 4; } const s = oc.createBufferSource(); s.buffer = b; return s; };

// Nhạc nền 16 giây: hợp âm êm (C – Am – F – G) + vài nốt ngũ cung
const music = () => render(16, oc => {
  const out = oc.createGain(); out.gain.value = 0.16; out.connect(oc.destination);
  const chords = [[261.6, 329.6, 392, 493.9], [220, 261.6, 329.6, 392], [174.6, 220, 261.6, 329.6], [196, 246.9, 293.7, 392]];
  chords.forEach((ch, i) => ch.forEach(f => { const o = oc.createOscillator(), g = oc.createGain(); o.type = 'triangle'; o.frequency.value = f / 2; const t = i * 4; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18, t + 1.2); g.gain.linearRampToValueAtTime(0, t + 4.2); o.connect(g).connect(out); o.start(t); o.stop(t + 4.3); }));
  const penta = [523.3, 587.3, 659.3, 784, 880]; let seed = 3;
  for (let k = 0; k < 14; k++) { seed = (seed * 9301 + 49297) % 233280; const f = penta[seed % 5], t = 0.6 + k * 1.1, o = oc.createOscillator(), g = oc.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 1.4); o.connect(g).connect(out); o.start(t); o.stop(t + 1.5); }
});
const filtered = (sec, type, f, q, lfo) => render(sec, oc => { const s = noiseSrc(oc, sec), fl = oc.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = oc.createGain(); g.gain.value = 1; if (lfo) { for (let t = 0; t < sec; t += 1) g.gain.setValueAtTime(0.5 + 0.5 * Math.sin(t * lfo), t); } s.connect(fl).connect(g).connect(oc.destination); s.start(); });
const chirp = () => render(1.2, oc => { const f = 2600 + Math.random() * 1500; for (let i = 0; i < 4; i++) { const o = oc.createOscillator(), g = oc.createGain(), t = i * 0.16; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.4, t + 0.08); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5, t + 0.02); g.gain.linearRampToValueAtTime(0, t + 0.12); o.connect(g).connect(oc.destination); o.start(t); o.stop(t + 0.14); } });

export function createAudio(ctx) {
  const { camera, scene, terrain } = ctx;
  const listener = new THREE.AudioListener(); camera.add(listener);
  let on = localStorage.getItem(KEY) !== '0', ready = false;
  const bg = new THREE.Audio(listener), sources = [], birds = [];

  async function init() {
    if (ready) return; ready = true;
    const [mus, wind, wave, ch1, ch2] = await Promise.all([music(), filtered(6, 'bandpass', 450, 0.7, 0.9), filtered(6, 'lowpass', 700, 0.5, 1.3), chirp(), chirp()]);
    bg.setBuffer(mus); bg.setLoop(true); bg.setVolume(0.55); bg.play();
    const place = (buf, x, y, z, ref, vol) => { const a = new THREE.PositionalAudio(listener); a.panner.panningModel = 'equalpower'; a.setBuffer(buf); a.setLoop(true); a.setRefDistance(ref); a.setRolloffFactor(1.4); a.setVolume(vol); const o = new THREE.Object3D(); o.position.set(x, y, z); o.add(a); scene.add(o); a.play(); sources.push(a); return a; };
    // sóng nước: 8 điểm quanh bờ; gió: 3 đỉnh đồi
    for (let i = 0; i < 8; i++) { const ang = i / 8 * Math.PI * 2; let r = 40; while (r < 100 && terrain.heightAt(Math.cos(ang) * r, Math.sin(ang) * r) > 0) r += 2; place(wave, Math.cos(ang) * r, 0.5, Math.sin(ang) * r, 8, 0.9); }
    let hills = []; for (let k = 0; k < 300; k++) { const x = (Math.random() - 0.5) * 120, z = (Math.random() - 0.5) * 120; hills.push([terrain.heightAt(x, z), x, z]); } hills.sort((a, b) => b[0] - a[0]);
    for (const [h, x, z] of hills.slice(0, 3)) place(wind, x, h + 3, z, 20, 0.7);
    // chim: 4 nguồn dời theo người chơi, hót ngẫu nhiên ban ngày
    for (let i = 0; i < 4; i++) { const a = new THREE.PositionalAudio(listener); a.panner.panningModel = 'equalpower'; a.setBuffer(i % 2 ? ch1 : ch2); a.setRefDistance(6); a.setVolume(0.5); const o = new THREE.Object3D(); o.add(a); scene.add(o); birds.push({ a, o, next: 1 + Math.random() * 4 }); }
  }
  const start = () => { if (!on) return; listener.context.resume(); init(); };
  addEventListener('pointerdown', start, { once: true }); addEventListener('keydown', start, { once: true });

  const btn = document.getElementById('bSound');
  const setBtn = () => { if (btn) btn.textContent = on ? '🔊' : '🔇'; }; setBtn();
  if (btn) btn.onclick = () => { on = !on; localStorage.setItem(KEY, on ? '1' : '0'); setBtn(); if (on) start(); listener.setMasterVolume(on ? 1 : 0); };
  if (!on) listener.setMasterVolume(0);

  // hiệu ứng ngắn (mở cổng, nhận quà)
  ctx.sfx = kind => {
    if (!on) return; const ac = listener.context, t = ac.currentTime;
    const notes = kind === 'win' ? [523, 659, 784, 1046] : kind === 'open' ? [392, 523, 659] : [660];
    notes.forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; g.gain.setValueAtTime(0, t + i * 0.1); g.gain.linearRampToValueAtTime(0.15, t + i * 0.1 + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.5); o.connect(g).connect(listener.getInput()); o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.6); });
  };

  function update(dt, night) {
    if (!ready) return;
    const p = ctx.player.pos;
    for (const b of birds) {
      b.next -= dt;
      if (b.next <= 0) {
        b.next = 2 + Math.random() * 5;
        if (night > 0.5 || b.a.isPlaying) continue;
        const ang = Math.random() * 6.28, r = 8 + Math.random() * 18; b.o.position.set(p.x + Math.cos(ang) * r, p.y + 5, p.z + Math.sin(ang) * r);
        b.a.setPlaybackRate(0.85 + Math.random() * 0.4); b.a.play();
      }
    }
    bg.setVolume(0.55 * (1 - night * 0.4));
  }
  return { update, listener, start, get on() { return on; }, get ready() { return ready; } };
}
