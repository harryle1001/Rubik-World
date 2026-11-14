// audio.js — Âm thanh nhập vai: mỗi nơi một âm thanh riêng phát ra đúng chỗ (THREE.PositionalAudio), tiếng bước chân đổi theo mặt đất.
// - Thêm nơi phát âm thanh lặp:  ctx.addSoundZone({ file, x, y, z, ref, vol, when })      when: 'day' | 'night' | 'school' | undefined
// - Thêm âm thanh thỉnh thoảng (chim, hải âu, chuông…): ctx.addSoundSpot({ files, x, y, z, ref, vol, every:[giây_min, giây_max], when })
// - Mặt đất dưới chân: ctx.surfaceAt(x, z) → 'grass' | 'sand' | 'wood' | 'stone' | 'gravel' | 'mud' (school-town.js có thể thay)
// - Nhạc nền theo khu: ctx.addMusicZone({ file, x, z, r })  — vào khu nào nghe nhạc khu đó, chuyển mượt
// - Tắt/bật tiếng: phím M. File: client/assets/audio/ (nguồn: client/assets/CREDITS.txt)
import * as THREE from 'three';

const KEY = 'island.sound', DIR = '/assets/audio/', ACTIVE = 55; // chỉ phát nguồn trong bán kính ACTIVE m (nhẹ máy)
const STEPS = { grass: ['step-leaves01', 'step-leaves02'], sand: ['step-sandl1', 'step-sandr1', 'step-sandl2', 'step-sandr2'], wood: ['step-wood01', 'step-wood02', 'step-wood03'], stone: ['step-stone01', 'step-stonel1', 'step-stoner1'], gravel: ['step-gravel'], mud: ['step-mud02'] };
const STEP_VOL = { grass: 0.35, sand: 0.55, wood: 0.75, stone: 0.6, gravel: 0.5, mud: 0.5 };
const SFX = { jump: ['sfx-dash'], land: ['sfx-land'], open: ['sfx-level-up'], win: ['sfx-gem', 'sfx-coin'], ui: ['sfx-ui'], ok: ['sfx-confirm'] };
const VOL = { jump: 0.3, land: 0.5, open: 0.7, win: 0.7, ui: 0.4, ok: 0.5 };

export function createAudio(ctx) {
  const { camera, scene, terrain } = ctx;
  const listener = new THREE.AudioListener(); camera.add(listener);
  let on = true; try { on = localStorage.getItem(KEY) !== '0'; } catch (e) {}
  let ready = false; const loader = new THREE.AudioLoader(), buf = {};
  const load = n => buf[n] || (buf[n] = new Promise(res => loader.load(DIR + n + '.mp3', res, undefined, () => res(null))));
  const dayMusic = new THREE.Audio(listener), nightMusic = new THREE.Audio(listener);
  const zones = [], spots = [], musics = [];
  const isOn = (when, st) => !when || (when === 'day' ? st.night < 0.5 : when === 'night' ? st.night >= 0.5 : when === 'school' ? st.night < 0.5 && st.school : true);

  ctx.addSoundZone = z => { zones.push(Object.assign({ y: 1, ref: 6, vol: 0.8, a: null }, z)); };
  ctx.addMusicZone = m => { musics.push(Object.assign({ r: 25, vol: 0.32, a: null, w: 0 }, m)); };
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
  addEventListener('keydown', e => { if (e.code === 'KeyM') setOn(!on); });
  if (!on) listener.setMasterVolume(0);

  const make = (b, x, y, z, ref, vol, loop) => { const a = new THREE.PositionalAudio(listener); a.panner.panningModel = 'equalpower'; a.setBuffer(b); a.setLoop(loop); a.setRefDistance(ref); a.setRolloffFactor(1.8); a.setMaxDistance(ACTIVE); a.setVolume(vol); const o = new THREE.Object3D(); o.position.set(x, y, z); o.add(a); scene.add(o); return a; };

  // Hiệu ứng ngắn: ctx.sfx('jump' | 'land' | 'open' | 'win' | 'ui' | 'ok' | 'step')
  ctx.sfx = async kind => {
    if (!on || listener.context.state !== 'running') return;
    let list = SFX[kind], vol = VOL[kind] ?? 0.5;
    if (kind === 'step') { const p = ctx.player.pos, s = ctx.surfaceAt(p.x, p.z, p.y); list = STEPS[s] || STEPS.grass; vol = STEP_VOL[s] ?? 0.4; }
    if (!list) return;
    const b = await load(list[Math.floor(Math.random() * list.length)]); if (!b) return;
    const ac = listener.context, s = ac.createBufferSource(), g = ac.createGain(); s.buffer = b; s.playbackRate.value = 0.9 + Math.random() * 0.2; g.gain.value = vol;
    s.connect(g).connect(listener.getInput()); s.start();
  };

  let zoneT = 0;
  function update(dt, st) {
    if (!ready) return;
    const p = ctx.player.pos;
    if (nightMusic.buffer) nightMusic.setVolume(0.22 * st.night);
    // nhạc theo khu: khu nhỏ (gần nhất) thắng khu lớn; chuyển mượt
    let best = null, bs = Infinity; for (const m of musics) { const d = Math.hypot(m.x - p.x, m.z - p.z); if (d < m.r && m.r < bs) { bs = m.r; best = m; } }
    for (const m of musics) {
      const want = m === best ? m.vol * (1 - st.night * 0.85) : 0; m.w += (want - m.w) * Math.min(1, dt * 0.6);
      if (m.w > 0.01 && !m.a && !m.loading) { m.loading = true; load(m.file).then(b => { m.loading = false; if (!b) return; m.a = new THREE.Audio(listener); m.a.setBuffer(b); m.a.setLoop(true); m.a.setVolume(0); m.a.play(); }); }
      if (m.a) { m.a.setVolume(m.w); if (m.w < 0.005 && m !== best) { m.a.stop(); m.a = null; } }
    }
    // vùng âm thanh lặp: chỉ bật khi ở gần và đúng thời điểm (ngày/đêm/giờ học)
    if ((zoneT -= dt) <= 0) {
      zoneT = 0.5;
      for (const z of zones) {
        const near = Math.hypot(z.x - p.x, z.z - p.z) < ACTIVE && isOn(z.when, st);
        if (near && !z.a && !z.loading) { z.loading = true; load(z.file).then(b => { z.loading = false; if (!b) return; z.a = make(b, z.x, z.y, z.z, z.ref, 0, true); z.a.offset = Math.random() * b.duration * 0.8; z.a.play(); }); }
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
  return { update, listener, start, get on() { return on; }, get ready() { return ready; }, setOn, get music() { return musics.filter(m => m.w > 0.05).map(m => m.file + ':' + m.w.toFixed(2)).join(' '); } };
}
