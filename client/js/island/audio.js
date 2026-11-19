// audio.js — Âm thanh nhập vai: mỗi nơi một âm thanh riêng phát ra đúng chỗ (THREE.PositionalAudio), tiếng bước chân đổi theo mặt đất.
// - Thêm nơi phát âm thanh lặp:  ctx.addSoundZone({ file, x, y, z, ref, vol, when })      when: 'day' | 'night' | 'school' | undefined
// - Thêm âm thanh thỉnh thoảng (chim, hải âu, chuông…): ctx.addSoundSpot({ files, x, y, z, ref, vol, every:[giây_min, giây_max], when })
// - Mặt đất dưới chân: ctx.surfaceAt(x, z) → 'grass' | 'sand' | 'wood' | 'stone' | 'gravel' | 'mud' (school-town.js có thể thay)
// - Nhạc nền theo khu: ctx.addMusicZone({ file, x, z, r })  — vào khu nào nghe nhạc khu đó, chuyển mượt
// - Tắt/bật tiếng: phím N · bảng 🎚️ trong menu ☰: nhạc / hiệu ứng / giọng nói (3 bus GainNode). File: client/assets/audio/ (CREDITS.txt)
// - Nhạc thích ứng: hoạt động (bay/tàu/phép thuật/mini game) › khu › ngày-đêm, crossfade; lớp nhịp tổng hợp tăng theo cường độ hành động; gió khi bay; chuông ra chơi
import * as THREE from 'three';
import { ACADEMY, EXTRA } from './layout.js';

const KEY = 'island.sound', DIR = '/assets/audio/', ACTIVE = 55; // chỉ phát nguồn trong bán kính ACTIVE m (nhẹ máy)
const STEPS = { grass: ['step-leaves01', 'step-leaves02'], sand: ['step-sandl1', 'step-sandr1', 'step-sandl2', 'step-sandr2'], wood: ['step-wood01', 'step-wood02', 'step-wood03'], stone: ['step-stone01', 'step-stonel1', 'step-stoner1'], gravel: ['step-gravel'], mud: ['step-mud02'] };
const STEP_VOL = { grass: 0.35, sand: 0.55, wood: 0.75, stone: 0.6, gravel: 0.5, mud: 0.5 };
const SFX = { jump: ['sfx-dash'], land: ['sfx-land'], open: ['sfx-level-up'], win: ['sfx-gem', 'sfx-coin'], ui: ['sfx-ui'], ok: ['sfx-confirm'], coin: ['sfx-coin'] };
// Âm thanh tổng hợp bằng Web Audio (không cần file): chuông xe đạp, mái chèo khua nước, lửa khinh khí cầu
const noiseBurst = (ac, out, dur, type, freq, vol, q = 1) => { const n = ac.sampleRate * dur | 0, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime; s.buffer = b; f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.15); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(f).connect(g).connect(out); s.start(t); };
const SYNTH = {
  bell: (ac, out) => { for (const t0 of [0, 0.16]) for (const [f, v] of [[2350, 0.22], [3480, 0.1], [5900, 0.04]]) { const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + t0; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.001, t + 0.8); o.connect(g).connect(out); o.start(t); o.stop(t + 0.85); } },
  splash: (ac, out) => noiseBurst(ac, out, 0.4, 'bandpass', 900 + Math.random() * 400, 0.35, 0.8),
  burner: (ac, out) => noiseBurst(ac, out, 0.9, 'lowpass', 420, 0.45),
  bad: (ac, out) => { const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime; o.type = 'triangle'; o.frequency.setValueAtTime(330, t); o.frequency.exponentialRampToValueAtTime(196, t + 0.32); g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.38); o.connect(g).connect(out); o.start(t); o.stop(t + 0.4); },   // trả lời sai (mini game)
  // phép thuật: chuỗi chuông lấp lánh ngũ cung đi lên · cửa gỗ kẽo kẹt · vút gió
  magic: (ac, out) => { [0, 2, 4, 7, 9, 12].forEach((s, i) => { const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * 0.055; o.type = 'triangle'; o.frequency.value = 1047 * 2 ** (s / 12); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6); o.connect(g).connect(out); o.start(t); o.stop(t + 0.65); }); },
  door: (ac, out) => { const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter(), t = ac.currentTime; o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t); o.frequency.linearRampToValueAtTime(140, t + 0.5); o.frequency.linearRampToValueAtTime(80, t + 0.9); f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 6; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.08); g.gain.exponentialRampToValueAtTime(0.001, t + 1); o.connect(f).connect(g).connect(out); o.start(t); o.stop(t + 1.05); },
  whoosh: (ac, out) => noiseBurst(ac, out, 0.5, 'bandpass', 1400, 0.3, 1.4),
};
const VOL = { jump: 0.3, land: 0.5, open: 0.7, win: 0.7, ui: 0.4, ok: 0.5 };

export function createAudio(ctx) {
  const { camera, scene, terrain } = ctx;
  const listener = new THREE.AudioListener(); camera.add(listener);
  // Bảng âm lượng: 3 bus (nhạc / hiệu ứng / giọng nói) → bảng 🎚️ trong menu ☰ (lưu trên máy)
  const AC = listener.context, mix = { music: 1, sfx: 1, voice: 1 }; try { Object.assign(mix, JSON.parse(localStorage.getItem('island.mix') || '{}')); } catch (e) {}
  const bus = {}; for (const k in mix) { bus[k] = AC.createGain(); bus[k].gain.value = mix[k]; bus[k].connect(listener.getInput()); }
  const route = (a, k) => { a.gain.disconnect(); a.gain.connect(bus[k]); return a; };
  const VOICE = /children|crowd/;   // tiếng người (học sinh, đám đông) đi bus giọng nói
  let on = true; try { on = localStorage.getItem(KEY) !== '0'; } catch (e) {}
  let ready = false; const loader = new THREE.AudioLoader(), buf = {};
  const load = n => buf[n] || (buf[n] = new Promise(res => loader.load(DIR + n + '.mp3', res, undefined, () => res(null))));
  const nightMusic = route(new THREE.Audio(listener), 'music');
  const zones = [], spots = [], musics = [];
  const isOn = (when, st) => !when || (when === 'day' ? st.night < 0.5 : when === 'night' ? st.night >= 0.5 : when === 'school' ? st.night < 0.5 && st.school : true);

  ctx.addSoundZone = z => { zones.push(Object.assign({ y: 1, ref: 6, vol: 0.8, a: null }, z)); };
  ctx.addMusicZone = m => { musics.push(Object.assign({ r: 25, vol: 0.32 }, m)); };   // night: file nhạc riêng ban đêm của khu
  ctx.addSoundSpot = s => { spots.push(Object.assign({ y: 2, ref: 8, vol: 0.7, every: [4, 10], t: Math.random() * 5, a: null }, s)); };
  ctx.surfaceAt = ctx.surfaceAt || ((x, z) => { const h = terrain.heightAt(x, z); return h < 1.3 ? 'sand' : terrain.slopeAt(x, z) > 0.9 ? 'gravel' : 'grass'; });

  // ---------- Âm thanh của đảo ----------
  for (let i = 0; i < 10; i++) { // sóng vỗ quanh bờ + hải âu
    const ang = i / 10 * Math.PI * 2; let r = 35; while (r < 110 && terrain.heightAt(Math.cos(ang) * r, Math.sin(ang) * r) > 0) r += 2;
    const x = Math.cos(ang) * r, z = Math.sin(ang) * r;
    ctx.addSoundZone({ file: i % 2 ? 'amb-wave1' : 'amb-wave2', x, y: 0.5, z, ref: 6, vol: 0.9 });
    if (i % 3 === 0) ctx.addSoundSpot({ files: ['sfx-gull1', 'sfx-gull2'], x, y: 8, z, ref: 12, vol: 0.5, every: [8, 20], when: 'day' });
  }
  { // rừng: chim ban ngày, dế ban đêm (5 chỗ nhiều cây nhất)
    const best = []; for (let k = 0; k < 400; k++) { const x = (Math.random() - 0.5) * 120, z = (Math.random() - 0.5) * 120, h = terrain.heightAt(x, z); if (h < 2) continue; best.push([ctx.colliders.filter(c => Math.abs(c.x - x) < 10 && Math.abs(c.z - z) < 10).length, x, h, z]); }
    best.sort((a, b) => b[0] - a[0]); const picked = []; for (const p of best) { if (picked.length >= 6) break; if (picked.every(q => Math.hypot(q[1] - p[1], q[3] - p[3]) > 25)) picked.push(p); }
    picked.forEach(([, x, h, z], i) => {
      ctx.addSoundZone({ file: i % 2 ? 'amb-birds' : 'amb-birds2', x, y: h + 5, z, ref: 9, vol: 0.7, when: 'day' });
      ctx.addSoundZone({ file: 'amb-crickets', x, y: h + 1, z, ref: 9, vol: 0.6, when: 'night' });
      ctx.addSoundSpot({ files: ['sfx-chirp'], x, y: h + 6, z, ref: 7, vol: 0.5, every: [6, 15], when: 'day' });
    });
  }
  // nhạc theo khu trên đảo (CC0, phong cách êm dịu/phiêu lưu)
  ctx.addMusicZone({ file: 'bgm-home', x: 4, z: 12, r: 18 });          // bãi xuất phát, khu cắm trại
  ctx.addMusicZone({ file: 'bgm-temple', x: 0, z: -6, r: 13, vol: 0.28 }); // Đền Tri Thức
  ctx.addMusicZone({ file: 'bgm-meadow', x: 30, z: 25, r: 45 });       // đồi cỏ, rừng của đảo
  ctx.addMusicZone({ file: 'bgm-meadow', x: -30, z: 20, r: 40 });
  ctx.addMusicZone({ file: 'bgm-beach', x: 0, z: 0, r: 999, vol: 0.22 }); // nền chung của đảo (bờ biển)
  // Học viện Pha Lê: nhạc phép thuật (ngày) / trăng huyền ảo (đêm) · Làng nổi & Đền Tri Thức: âm hưởng ngũ cung phương Đông (OpenGameArt CC0)
  ctx.addMusicZone({ file: 'bgm-academy', night: 'bgm-magic-night', x: ACADEMY.c[0], z: ACADEMY.c[1], r: 233, vol: 0.3 });
  for (const [id, file] of [['E', 'bgm-village'], ['I', 'bgm-temple-ethnic']]) { const e = EXTRA.find(q => q.id === id); if (e) ctx.addMusicZone({ file, x: (e.r[0] + e.r[2]) / 2, z: (e.r[1] + e.r[3]) / 2, r: Math.max(e.r[2] - e.r[0], e.r[3] - e.r[1]) * 0.618 + 13, vol: 0.28 }); }
  ctx.addSoundZone({ file: 'amb-fire', x: 7, y: 0.5 + terrain.heightAt(7, 14), z: 14, ref: 2.5, vol: 1 });           // lửa trại
  ctx.addSoundSpot({ files: ['sfx-bell1', 'sfx-bell2'], x: 0, y: 4 + terrain.heightAt(0, -8), z: -8, ref: 6, vol: 0.55, every: [5, 11] }); // chuông gió ở đền
  ctx.addSoundSpot({ files: ['sfx-bee'], x: 6, y: terrain.heightAt(6, -1) + 1, z: -1, ref: 3, vol: 0.4, every: [6, 12], when: 'day' }); // ong quanh pha lê hoa

  async function init() {
    if (ready) return; ready = true;
    const night = await load('music-night'); if (night) { nightMusic.setBuffer(night); nightMusic.setLoop(true); nightMusic.setVolume(0); nightMusic.play(); }
    Object.values(STEPS).flat().concat(Object.values(SFX).flat()).forEach(load); // tải trước
  }
  const start = () => { if (!on) return; if (listener.context.state !== 'running') listener.context.resume(); init(); };
  addEventListener('pointerdown', start); addEventListener('keydown', start); // bật ở mọi lần chạm (trình duyệt chỉ cho phát âm thanh sau khi người chơi chạm)
  const setOn = v => { on = v; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {} if (on) start(); listener.setMasterVolume(on ? 1 : 0); ctx.toast && ctx.toast(on ? '🔊 Bật âm thanh' : '🔇 Tắt âm thanh', 1200); };
  addEventListener('keydown', e => { if (e.code === 'KeyN') setOn(!on); });
  if (!on) listener.setMasterVolume(0);

  const make = (b, x, y, z, ref, vol, loop, file = '') => { const a = route(new THREE.PositionalAudio(listener), VOICE.test(file) ? 'voice' : 'sfx'); a.panner.panningModel = 'equalpower'; a.setBuffer(b); a.setLoop(loop); a.setRefDistance(ref); a.setRolloffFactor(1.8); a.setMaxDistance(ACTIVE); a.setVolume(vol); const o = new THREE.Object3D(); o.position.set(x, y, z); o.add(a); scene.add(o); return a; };

  // Hiệu ứng ngắn: ctx.sfx('jump' | 'land' | 'open' | 'win' | 'ui' | 'ok' | 'step' | 'bell' | 'splash' | 'burner' | 'magic' | 'door' | 'whoosh')
  ctx.sfx = async kind => {
    if (!on || listener.context.state !== 'running') return;
    if (SYNTH[kind]) return SYNTH[kind](listener.context, bus.sfx);
    let list = SFX[kind], vol = VOL[kind] ?? 0.5;
    if (kind === 'step') { const p = ctx.player.pos; if (p.y < 0.35 && terrain.heightAt(p.x, p.z) < 0.15) return noiseBurst(listener.context, bus.sfx, 0.25, 'bandpass', 700 + Math.random() * 500, 0.22, 0.9); const s = ctx.surfaceAt(p.x, p.z, p.y); list = STEPS[s] || STEPS.grass; vol = STEP_VOL[s] ?? 0.4; }   // lội nước: tiếng lõm bõm
    if (!list) return;
    const b = await load(list[Math.floor(Math.random() * list.length)]); if (!b) return;
    const ac = listener.context, s = ac.createBufferSource(), g = ac.createGain(); s.buffer = b; s.playbackRate.value = 0.9 + Math.random() * 0.2; g.gain.value = vol;
    s.connect(g).connect(bus.sfx); s.start();
  };

  // Nốt nhạc gõ (đàn đá / marimba tổng hợp): f Hz, vol 0..1 — nhạc nước học viện
  ctx.note = (f, vol = 0.1, dur = 0.7) => {
    if (!on || listener.context.state !== 'running' || vol < 0.004) return;
    const ac = listener.context, t = ac.currentTime + 0.01;
    for (const [m, v] of [[1, 1], [4, 0.18]]) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = f * m; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0005, t + dur / m); o.connect(g).connect(bus.sfx); o.start(t); o.stop(t + dur + 0.05); }
  };

  // Huýt sáo (tổng hợp): semis = các nốt tính theo nửa cung so với nốt gốc, mỗi thú cưỡi một giai điệu riêng
  ctx.whistle = (semis, base = 1175) => {
    if (!on || listener.context.state !== 'running') return;
    const ac = listener.context, o = ac.createOscillator(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain(), t0 = ac.currentTime + 0.02;
    lfo.frequency.value = 6; lg.gain.value = 14; lfo.connect(lg).connect(o.frequency); o.connect(g).connect(bus.sfx);
    g.gain.setValueAtTime(0, t0); o.frequency.setValueAtTime(base * 2 ** (semis[0] / 12) * 0.9, t0);
    let t = t0; semis.forEach((s, i) => { const f = base * 2 ** (s / 12), d = i === semis.length - 1 ? 0.38 : 0.19; o.frequency.exponentialRampToValueAtTime(f, t + 0.05); g.gain.setTargetAtTime(0.16, t, 0.012); g.gain.setTargetAtTime(0.06, t + d - 0.05, 0.02); t += d; });
    g.gain.setTargetAtTime(0, t, 0.04); o.start(t0); lfo.start(t0); o.stop(t + 0.3); lfo.stop(t + 0.3);
  };

  // ---------- nhạc thích ứng: trạng thái + nguồn tổng hợp ----------
  const tracks = {}, ACT_MUSIC = { fly: 'bgm-explore', train: 'bgm-explore', magic: 'bgm-academy' };
  let layer = null, layerW = 0, wind = null, bellT = 3, lastPd = null, magicT = -1e9;
  const activity = () => { const V = ctx.player.vehicle; if (ctx.mg && ctx.mg.active) return 'mg'; if (ctx.train && ctx.train.ride.state.aboard) return 'train'; if (V && V.fly) return 'fly'; if (performance.now() - magicT < 13000) return 'magic'; return V ? 'ride' : 'explore'; };
  ctx.musicActivity = activity;
  { const f = ctx.sfx; ctx.sfx = k => { if (k === 'magic') magicT = performance.now(); return f(k); }; }
  // vòng nhịp 89 BPM (Fibonacci), 2 ô nhịp: trống trầm phách 1·3, lắc (shaker) móc đơn, trống gỗ nhẹ — dựng 1 lần bằng OfflineAudioContext
  function pulseLayer() {
    const g = AC.createGain(); g.gain.value = 0; g.connect(bus.music);
    const sr = 22050, beat = 60 / 89, len = Math.round(sr * beat * 8), oc = new OfflineAudioContext(1, len, sr), nb = oc.createBuffer(1, sr, sr), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const hit = (t, f0, f1, d, v, type = 'sine') => { const o = oc.createOscillator(), e = oc.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d); e.gain.setValueAtTime(v, t); e.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(e).connect(oc.destination); o.start(t); o.stop(t + d); };
    const shk = (t, v) => { const s = oc.createBufferSource(), f = oc.createBiquadFilter(), e = oc.createGain(); s.buffer = nb; f.type = 'highpass'; f.frequency.value = 6000; e.gain.setValueAtTime(v, t); e.gain.exponentialRampToValueAtTime(0.001, t + 0.06); s.connect(f).connect(e).connect(oc.destination); s.start(t); s.stop(t + 0.07); };
    for (let b = 0; b < 8; b++) { const t = b * beat; if (b % 2 === 0) hit(t, 110, 42, 0.32, 0.9); else hit(t, 330, 260, 0.09, 0.22, 'triangle'); shk(t, 0.18); shk(t + beat / 2, 0.32); if (b === 7) hit(t + beat / 2, 220, 180, 0.08, 0.2, 'triangle'); }
    oc.startRendering().then(buf => { const s = AC.createBufferSource(); s.buffer = buf; s.loop = true; s.connect(g); s.start(); });
    return { gain: g.gain };
  }
  function windLoop() {
    const n = AC.sampleRate * 2, b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0); let l = 0; for (let i = 0; i < n; i++) { l = l * 0.97 + (Math.random() * 2 - 1) * 0.03; d[i] = l * 6; }
    const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = b; s.loop = true; f.type = 'bandpass'; f.Q.value = 0.7; g.gain.value = 0; s.connect(f).connect(g).connect(bus.sfx); s.start();
    return { gain: g.gain, f };
  }
  // chuông điện trường học: "reng" rung nhanh ~1,6 s phát ra từ sân trường (PannerNode theo vị trí 3D)
  function schoolBell() {
    if (!on || AC.state !== 'running') return;
    const pn = AC.createPanner(); pn.panningModel = 'equalpower'; pn.refDistance = 34; pn.rolloffFactor = 1.2; pn.maxDistance = 600; pn.positionX.value = 0; pn.positionY.value = 9; pn.positionZ.value = 0; pn.connect(bus.sfx);
    const t = AC.currentTime, am = AC.createGain(), lfo = AC.createOscillator(), lg = AC.createGain(), g = AC.createGain(); lfo.frequency.value = 21; lg.gain.value = 0.5; am.gain.value = 0.5; lfo.connect(lg).connect(am.gain);
    for (const [f, v] of [[1318, 0.3], [2637, 0.12], [3951, 0.05]]) { const o = AC.createOscillator(); o.frequency.value = f; const og = AC.createGain(); og.gain.value = v; o.connect(og).connect(am); o.start(t); o.stop(t + 2.7); }
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.9, t + 0.02); g.gain.setValueAtTime(0.9, t + 2.4); g.gain.exponentialRampToValueAtTime(0.001, t + 2.7); am.connect(g).connect(pn); lfo.start(t); lfo.stop(t + 2.7);
    ctx.toast && ctx.toast('🔔 Reng reng! ' + (ctx.school.clock.period() === 'rachoi' ? 'Giờ ra chơi rồi!' : 'Hết giờ ra chơi, vào lớp thôi!'), 4000);
  }
  ctx.schoolBell = schoolBell;
  let zoneT = 0;
  const vol = (a, v) => { if (Math.abs(v - (a._v ?? -1)) > 1e-3) { a._v = v; a.setVolume(v); } };
  function update(dt, st) {
    if (!ready) return;
    const p = ctx.player.pos;
    // THREE.Audio.setVolume = 1 sự kiện setTargetAtTime mỗi lần gọi → chỉ gọi khi âm lượng đổi thật (trước: mỗi khung, hàng đợi tự động hoá AudioParam phình ra)
    if (nightMusic.buffer) vol(nightMusic, 0.22 * st.night);
    // NHẠC THÍCH ỨNG: hoạt động (bay/tàu/phép thuật) > khu (khu nhỏ thắng khu lớn) · ngày/đêm · crossfade ~φ² s giữa các bản
    const act = activity(), V = ctx.player.vehicle, sp0 = ctx.moveSpeed ?? ctx.player.speed, sp = Number.isFinite(sp0) ? sp0 : 0;
    let best = null, bs = Infinity; for (const m of musics) { const d = Math.hypot(m.x - p.x, m.z - p.z); if (d < m.r && m.r < bs) { bs = m.r; best = m; } }
    let file = null, want = 0, nightMul = 1;
    if (ACT_MUSIC[act]) { file = ACT_MUSIC[act]; want = 0.3; nightMul = 0.4; }
    else if (best) { if (best.night && st.night > 0.5) { file = best.night; want = best.vol; nightMul = 0; } else { file = best.file; want = best.vol * (1 - st.night * 0.85); } }
    if (nightMusic.buffer) vol(nightMusic, 0.22 * st.night * nightMul);
    if (file && !tracks[file]) tracks[file] = { w: 0, a: null };
    for (const k in tracks) {
      const T = tracks[k], tw = k === file ? want : 0; T.w += (tw - T.w) * Math.min(1, dt * 0.618);
      if (T.w > 0.01 && !T.a && !T.loading) { T.loading = true; load(k).then(b => { T.loading = false; if (!b) return; T.a = route(new THREE.Audio(listener), 'music'); T.a.setBuffer(b); T.a.setLoop(true); T.a.setVolume(0); T.a.play(); }); }
      if (T.a) { vol(T.a, T.w); if (T.w < 0.005 && k !== file) { T.a.stop(); T.a = null; delete tracks[k]; } }
    }
    // lớp nhịp (trống nhẹ tổng hợp) tăng dần theo cường độ hành động: chạy nhanh, đạp xe, bay, mini game
    const inten = act === 'mg' ? 1 : act === 'fly' ? 0.75 : act === 'magic' ? 0.6 : V ? 0.5 + Math.min(0.3, sp / 40) : Math.min(1, sp / 9.5) * 0.45;
    layerW += (inten * (1 - st.night * 0.5) - layerW) * Math.min(1, dt * 0.382);
    if (layerW > 0.02 && !layer) layer = pulseLayer();
    if (layer) layer.gain.setTargetAtTime(layerW * 0.11, AC.currentTime, 0.3);
    // gió vù vù khi bay (to theo tốc độ) — nhiễu lọc dải, 1 nguồn lặp
    const fw = V && V.fly ? Math.min(1, sp / 34) : 0;
    if (fw > 0.01 && !wind) wind = windLoop();
    if (wind) { wind.gain.setTargetAtTime(fw * 0.32, AC.currentTime, 0.25); wind.f.frequency.setTargetAtTime(500 + fw * 900, AC.currentTime, 0.3); }
    // chuông trường: vào giờ ra chơi và hết giờ ra chơi (đồng hồ trường data/clock.js)
    if ((bellT -= dt) <= 0) { bellT = 1; const ck = ctx.school && ctx.school.clock, pd = ck && ck.period(); if (pd && lastPd && pd !== lastPd && (pd === 'rachoi' || lastPd === 'rachoi')) schoolBell(); lastPd = pd; }
    // vùng âm thanh lặp: chỉ bật khi ở gần và đúng thời điểm (ngày/đêm/giờ học)
    if ((zoneT -= dt) <= 0) {
      zoneT = 0.5;
      for (const z of zones) {
        const near = Math.hypot(z.x - p.x, z.z - p.z) < ACTIVE && isOn(z.when, st);
        if (near && !z.a && !z.loading) { z.loading = true; load(z.file).then(b => { z.loading = false; if (!b) return; z.a = make(b, z.x, z.y, z.z, z.ref, 0, true, z.file); z.a.offset = Math.random() * b.duration * 0.8; z.a.play(); }); }
        if (z.a) { const want = near ? z.vol : 0; const v = z.a.getVolume(); z.a.setVolume(v + (want - v) * 0.5); if (!near && v < 0.02 && z.a.isPlaying) { z.a.stop(); z.a.parent.removeFromParent(); z.a = null; } }
      }
    }
    // âm thanh thỉnh thoảng
    for (const s of spots) {
      if ((s.t -= dt) > 0) continue; s.t = s.every[0] + Math.random() * (s.every[1] - s.every[0]);
      if (Math.hypot(s.x - p.x, s.z - p.z) > ACTIVE * 0.8 || !isOn(s.when, st)) continue;
      load(s.files[Math.floor(Math.random() * s.files.length)]).then(b => { if (!b) return; if (!s.a) s.a = make(b, s.x, s.y, s.z, s.ref, s.vol, false); else s.a.setBuffer(b); if (s.a.isPlaying) s.a.stop(); s.a.setPlaybackRate(0.9 + Math.random() * 0.2); s.a.play(); });
    }
  }
  // ---------- Bảng âm lượng 🎚️ (menu ☰): nhạc · hiệu ứng · giọng nói + rung điện thoại ----------
  {
    const css = document.createElement('style');
    css.textContent = `#mixBox{position:fixed;z-index:29;right:max(12px,env(safe-area-inset-right));top:calc(max(12px,env(safe-area-inset-top)) + 55px);width:min(calc(100vw - 24px),377px);box-sizing:border-box;padding:13px 16px;border-radius:16px;background:#101a2ee6;color:#f2f4ff;font:600 14px system-ui;box-shadow:0 6px 18px #0006;display:grid;grid-template-columns:auto 1fr 2.6em;gap:8px 10px;align-items:center}
#mixBox input[type=range]{accent-color:#ffc23e;min-width:0}#mixBox span{text-align:right;font-variant-numeric:tabular-nums}#mixBox label{grid-column:1/-1;display:flex;gap:8px;align-items:center}body.rs-modal #mixBox{display:none}`;
    document.head.appendChild(css);
    const btn = document.createElement('button'); btn.id = 'bMix'; btn.textContent = '🎚️ Âm thanh'; btn.title = 'Âm lượng nhạc, hiệu ứng, giọng nói (N: tắt/bật)';
    (document.getElementById('moreMenu') || document.body).appendChild(btn);
    const box = document.createElement('div'); box.id = 'mixBox'; box.hidden = true;
    const ROWS = [['music', '🎵 Nhạc'], ['sfx', '💥 Hiệu ứng'], ['voice', '🗣️ Giọng nói']];
    box.innerHTML = ROWS.map(([k, n]) => `${n}<input type="range" min="0" max="1" step="0.01" data-k="${k}" aria-label="${n}"><span></span>`).join('') + '<label><input type="checkbox" id="mixVib"> 📳 Rung điện thoại khi nhận thưởng, tiếp đất</label><label><input type="checkbox" id="mixOn"> 🔊 Bật âm thanh (phím N)</label>';
    document.body.appendChild(box);
    const show = () => { for (const r of box.querySelectorAll('input[type=range]')) { r.value = mix[r.dataset.k]; r.nextElementSibling.textContent = Math.round(mix[r.dataset.k] * 100); } box.querySelector('#mixOn').checked = on; box.querySelector('#mixVib').checked = ctx.vibrateOn ? ctx.vibrateOn() : false; };
    box.addEventListener('input', e => { const r = e.target, k = r.dataset && r.dataset.k; if (!k) return; mix[k] = +r.value; bus[k].gain.setTargetAtTime(mix[k], AC.currentTime, 0.05); r.nextElementSibling.textContent = Math.round(mix[k] * 100); try { localStorage.setItem('island.mix', JSON.stringify(mix)); } catch (er) {} });
    box.querySelector('#mixOn').onchange = e => setOn(e.target.checked);
    box.querySelector('#mixVib').onchange = e => { ctx.setVibrate && ctx.setVibrate(e.target.checked); };
    btn.onclick = () => { show(); box.hidden = !box.hidden; };
    addEventListener('pointerdown', e => { if (!box.hidden && !box.contains(e.target) && e.target !== btn) box.hidden = true; }, true);
  }
  ctx.voiceVol = () => (on ? mix.voice : 0);   // lời đọc (nếu có TTS) dùng mức giọng nói
  return { update, listener, start, get on() { return on; }, get ready() { return ready; }, setOn, get music() { return Object.keys(tracks).map(k => k + ':' + tracks[k].w.toFixed(2)).join(' ') + ' · ' + activity() + ' · nhịp ' + layerW.toFixed(2); }, bus, mix };
}
