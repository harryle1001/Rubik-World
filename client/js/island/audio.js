// audio.js — Nhạc nền (ngày/đêm) + âm thanh 3D (rừng có chim và gió, sóng biển) bằng THREE.PositionalAudio,
// cùng hiệu ứng ngắn (bước chân, nhảy, tiếp đất, mở cổng, nhận quà).
// File nằm ở client/assets/audio/ (nguồn: client/assets/CREDITS.txt). Thiếu file thì tự tổng hợp âm thay thế.
import * as THREE from 'three';

const KEY = 'island.sound', DIR = '/assets/audio/';
const SFX = { step: ['step-sandl1', 'step-sandr1', 'step-sandl2', 'step-sandr2'], stone: ['step-stonel1', 'step-stoner1'], jump: ['sfx-dash'], land: ['sfx-land'], open: ['sfx-level-up'], win: ['sfx-gem', 'sfx-coin'], ui: ['sfx-ui'], ok: ['sfx-confirm'] };
const VOL = { step: 0.35, stone: 0.35, jump: 0.35, land: 0.5, open: 0.8, win: 0.8, ui: 0.5, ok: 0.6 };

export function createAudio(ctx) {
  const { camera, scene, terrain } = ctx;
  const listener = new THREE.AudioListener(); camera.add(listener);
  let on = true; try { on = localStorage.getItem(KEY) !== '0'; } catch (e) {}
  let ready = false; const loader = new THREE.AudioLoader(), buf = {};
  const load = n => buf[n] || (buf[n] = new Promise(res => loader.load(DIR + n + '.mp3', res, undefined, () => res(null))));
  const dayMusic = new THREE.Audio(listener), nightMusic = new THREE.Audio(listener);

  async function init() {
    if (ready) return; ready = true;
    const [day, night, forest, w1, w2] = await Promise.all(['music-day', 'music-night', 'amb-forest', 'amb-wave1', 'amb-wave2'].map(load));
    for (const [a, b] of [[dayMusic, day], [nightMusic, night]]) if (b) { a.setBuffer(b); a.setLoop(true); a.setVolume(0); a.play(); }
    const place = (b, x, y, z, ref, vol) => { if (!b) return; const a = new THREE.PositionalAudio(listener); a.panner.panningModel = 'equalpower'; a.setBuffer(b); a.setLoop(true); a.setRefDistance(ref); a.setRolloffFactor(1.6); a.setVolume(vol); a.offset = Math.random() * b.duration * 0.8; const o = new THREE.Object3D(); o.position.set(x, y, z); o.add(a); scene.add(o); a.play(); return a; };
    // sóng: 8 điểm quanh bờ
    for (let i = 0; i < 8; i++) { const ang = i / 8 * Math.PI * 2; let r = 35; while (r < 110 && terrain.heightAt(Math.cos(ang) * r, Math.sin(ang) * r) > 0) r += 2; place(i % 2 ? w1 : w2, Math.cos(ang) * r, 0.5, Math.sin(ang) * r, 7, 0.9); }
    // rừng (chim hót + gió lá): 5 chỗ nhiều cây
    let best = []; for (let k = 0; k < 400; k++) { const x = (Math.random() - 0.5) * 110, z = (Math.random() - 0.5) * 110, h = terrain.heightAt(x, z); if (h < 2) continue; const n = ctx.colliders.filter(c => Math.abs(c.x - x) < 10 && Math.abs(c.z - z) < 10).length; best.push([n, x, h, z]); }
    best.sort((a, b) => b[0] - a[0]); const picked = [];
    for (const p of best) { if (picked.length >= 5) break; if (picked.every(q => Math.hypot(q[1] - p[1], q[3] - p[3]) > 30)) picked.push(p); }
    for (const [, x, h, z] of picked) place(forest, x, h + 4, z, 12, 0.8);
    Object.values(SFX).flat().forEach(load); // tải trước hiệu ứng ngắn
  }
  const start = () => { if (!on) return; listener.context.resume(); init(); };
  addEventListener('pointerdown', start, { once: true }); addEventListener('keydown', start, { once: true });

  const btn = document.getElementById('bSound');
  const setBtn = () => { if (btn) btn.textContent = on ? '🔊' : '🔇'; }; setBtn();
  if (btn) btn.onclick = () => { on = !on; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {} setBtn(); if (on) start(); listener.setMasterVolume(on ? 1 : 0); };
  if (!on) listener.setMasterVolume(0);

  // Hiệu ứng ngắn: ctx.sfx('step' | 'jump' | 'land' | 'open' | 'win' | 'ui' | 'ok')
  ctx.sfx = async kind => {
    if (!on || listener.context.state !== 'running') return;
    const list = SFX[kind]; if (!list) return;
    const b = await load(list[Math.floor(Math.random() * list.length)]);
    const ac = listener.context;
    if (!b) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 660; g.gain.setValueAtTime(0.12, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25); o.connect(g).connect(listener.getInput()); o.start(); o.stop(ac.currentTime + 0.3); return; }
    const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = b; s.playbackRate.value = 0.92 + Math.random() * 0.16; g.gain.value = VOL[kind] ?? 0.5;
    s.connect(g).connect(listener.getInput()); s.start();
  };

  function update(dt, night) {
    if (!ready) return;
    // chuyển nhạc ngày ↔ đêm mượt
    if (dayMusic.buffer) dayMusic.setVolume(0.35 * (1 - night));
    if (nightMusic.buffer) nightMusic.setVolume(0.45 * night);
  }
  return { update, listener, start, get on() { return on; }, get ready() { return ready; } };
}
