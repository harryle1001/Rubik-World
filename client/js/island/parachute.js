// parachute.js — 🪂 THẢ DÙ từ máy bay: nhảy ra → rơi tự do (gió đẩy, camera bám) → bung dù lượn (joystick lái hướng, kéo lùi = phanh)
// → tiếp đất nhẹ ở bất cứ đâu (đất, sàn, mái nhà, sân lâu đài, mặt biển). Máy bay tự lái về đường băng gần nhất (aircraft.js eject()).
// Thử thách "nhảy dù trúng đích": bãi đáp tròn (bán kính Fibonacci 3 · 8 · 13 m) ở các vùng (ctx.chuteTargets) → 1–3 ⭐.
// Tự chứa: ocean.js gọi createParachute(ctx) và chute.update(dt) ngay sau aircraft.update.
import * as THREE from 'three';
import { T, dampV3 } from './motion.js';
import { CFG } from './config.js';
import { Batch } from './academy/geo.js';
import { matV } from './sample/palette.js';

const G = 9.8, TERM = 34, OPEN_T = 0.8, RINGS = [13, 8, 3], BEST_KEY = 'rs.chute.best';

export function createParachute(ctx) {
  const { scene, camera, player, terrain } = ctx, W = CFG.island.waterLevel, mobile = CFG.isMobile;
  // ---------- nút 🪂 (điện thoại: ô trái cột nút, 84 px; máy tính: góc phải dưới + phím J) ----------
  const css = document.createElement('style');
  css.textContent = `#bChute{position:fixed;z-index:27;right:calc(max(16px,env(safe-area-inset-right)) + 97px);bottom:max(18px,env(safe-area-inset-bottom));width:84px;height:84px;border-radius:50%;border:3px solid #fff;background:#e0503ee6;color:#fff;font:800 13px/1.15 system-ui;touch-action:none;-webkit-user-select:none;user-select:none;box-shadow:0 5px 13px #0006;cursor:pointer}
#bChute i{display:block;font-style:normal;font-size:30px;line-height:1}#bChute.open{background:#3f8a73e6}
@media (pointer:fine){#bChute{right:max(16px,env(safe-area-inset-right));bottom:calc(max(13px,env(safe-area-inset-bottom)) + 89px);width:89px;height:89px}}body.rs-modal #bChute{display:none}`;
  document.head.appendChild(css);
  const btn = document.createElement('button'); btn.id = 'bChute'; btn.hidden = true; document.body.appendChild(btn);
  const setBtn = (on, open) => { if (btn.hidden === !on && btn._o === open) return; btn.hidden = !on; btn._o = open; btn.className = open ? 'open' : ''; btn.innerHTML = `<i>🪂</i>${open ? 'Bung dù' : 'Thả dù'}${mobile ? '' : ' (J)'}`; };
  const keys = new Set(); addEventListener('keydown', e => { keys.add(e.code); if (e.code === 'KeyJ' && !e.repeat) press(); }); addEventListener('keyup', e => keys.delete(e.code)); addEventListener('blur', () => keys.clear());
  btn.addEventListener('pointerdown', e => { e.preventDefault(); press(); });

  // ---------- dù cánh vòm 9 ô màu Rubik + dây ----------
  const canopy = new THREE.Group(); canopy.visible = false; scene.add(canopy);
  {
    const b = new Batch(), R0 = 5, COLS = ['#d8433a', '#f08a2a', '#f2c443', '#f3efe6', '#3fa36b', '#3d6fb0', '#f3efe6', '#f2c443', '#d8433a'];
    for (let k = -4; k <= 4; k++) { const a = k * 0.16; b.add(new THREE.BoxGeometry(0.98, 0.3, 2.6), COLS[k + 4], Math.sin(a) * R0, Math.cos(a) * R0 - R0 + 4.6, 0, 0, 0, -a); }
    for (const k of [-4, -2, 0, 2, 4]) for (const zz of [-1, 1]) { const a = k * 0.16, x = Math.sin(a) * R0, y = Math.cos(a) * R0 - R0 + 4.45, L = Math.hypot(x, y - 1.3, zz); const ln = new THREE.CylinderGeometry(0.015, 0.015, L, 3); ln.translate(0, L / 2, 0); ln.rotateX(Math.PI / 2); ln.lookAt(new THREE.Vector3(x, y - 1.3, zz)); b.add(ln, '#3a3344', 0, 1.3, 0); }
    const m = new THREE.Mesh(b.build(), matV()); m.castShadow = true; canopy.add(m);
  }
  // ---------- bãi đáp trúng đích ----------
  const H = (x, z) => Math.max(terrain.heightAt(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, 999) : -99);
  let targets = [], tMesh = null;
  function buildTargets() {
    targets = (ctx.chuteTargets || []).map(t => ({ ...t, y: Math.max(H(t.p[0], t.p[1]), W) }));
    const b = new Batch(), beam = new Batch();
    for (const t of targets) {
      RINGS.forEach((r, i) => b.add(new THREE.CircleGeometry(r, 34), i % 2 ? '#f3efe6' : '#d8433a', t.p[0], t.y + 0.06 + i * 0.02, t.p[1], 0, -Math.PI / 2));
      beam.cyl(t.p[0], t.y, t.p[1], 0.8, 89, '#ffe3a0', 8);
    }
    tMesh = new THREE.Group(); tMesh.name = 'chute-targets';
    tMesh.add(new THREE.Mesh(b.build(), matV()), new THREE.Mesh(beam.build(), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.32, depthWrite: false })));
    tMesh.visible = false; scene.add(tMesh);
  }
  let best = 0; try { best = +localStorage.getItem(BEST_KEY) || 0; } catch (e) {}

  // ---------- trạng thái ----------
  let S = null; const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), camV = new THREE.Vector3(), lookV = new THREE.Vector3(), tmp = new THREE.Vector3(), q = new THREE.Quaternion(), eu = new THREE.Euler(0, 0, 0, 'YXZ');
  const hideRun = on => { for (const id of ['bRun', 'bJump']) { const b = document.getElementById(id); if (b) b.hidden = on; } const vb = document.querySelector('.vbtns'); if (vb) vb.style.display = on ? 'none' : ''; };
  function press() {
    if (S) { if (S.phase === 'free' && S.t > 0.5) openChute(); return; }
    const A = ctx.aircraft; if (!A || !A.flying || A.phase !== 'fly') return;
    const o = A.eject(); if (!o) return;
    if (!tMesh) buildTargets(); tMesh.visible = true;
    S = { phase: 'free', t: 0, open: 0, yaw: o.yaw, p: new THREE.Vector3(o.x, o.y - 1.6, o.z), v: new THREE.Vector3(Math.sin(o.yaw) * o.spd * 0.5, 2, Math.cos(o.yaw) * o.spd * 0.5), sway: 0 };
    player.vehicle = { speed: 0, turn: 0, accel: 4, fly: true, lift: 0, maxAlt: 999, anim: 'jump', seat: 0, seatZ: 0, camAdd: 0, chute: true };
    camPos.copy(camera.position); camLook.copy(S.p); camV.set(0, 0, 0); lookV.set(0, 0, 0); hideRun(true);
    const nt = nearest(S.p.x, S.p.z);
    ctx.toast(`🪂 <b>Nhảy!</b> Rơi tự do… bấm <b>🪂 Bung dù</b> (dù tự bung khi còn 55 m).<br>🎯 Bãi đáp gần nhất: <b>${nt ? nt.t.name : '—'}</b>${nt ? ` · cách ${Math.round(nt.d)} m` : ''} — trúng tâm 3 m được ⭐⭐⭐`, 6000);
    ctx.sfx && ctx.sfx('jump');
  }
  function openChute() { if (!S || S.phase !== 'free') return; S.phase = 'canopy'; S.open = 0; canopy.visible = true; ctx.sfx && ctx.sfx('ui'); ctx.toast(mobile ? '🪂 Dù đã bung! <b>Joystick</b> ⬅➡ lái hướng · ⬆ bay nhanh · ⬇ kéo phanh (chậm, rơi ít)' : '🪂 Dù đã bung! <b>A/D</b> lái hướng · <b>W</b> bay nhanh · <b>S</b> kéo phanh', 4500); }
  const nearest = (x, z) => { let b = null; if (!targets.length && ctx.chuteTargets) buildTargets(); for (const t of targets) { const d = Math.hypot(t.p[0] - x, t.p[1] - z); if (!b || d < b.d) b = { t, d }; } return b; };
  // mặt đáp: đất, sàn (groundExtra), nóc hộp nhà/tường (ctx.grid), mặt biển
  function floorAt(x, z, y) {
    let f = Math.max(terrain.heightAt(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, y) : -99);
    const L = ctx.grid ? ctx.grid.near(x, z).boxes : (ctx.boxes || []);
    for (const B of L) if (B.top > f && B.top <= y + 0.5 && x > B.x0 && x < B.x1 && z > B.z0 && z < B.z1) f = B.top;
    return { f: Math.max(f, W), water: f < W - 0.3 };
  }
  function land(fl) {
    const p = S.p; S = null; canopy.visible = false; tMesh && (tMesh.visible = false); hideRun(false);
    player.vehicle = null; player.teleport(p.x, p.z, fl.f); player.root.quaternion.identity(); player.cam.pitch = 0.3;
    if (fl.water) { ctx.toast('🌊 Đáp xuống biển! Bơi vào bờ nhé (nút 🤿 để lặn).', 4000); return; }
    ctx.sfx && ctx.sfx('land'); player.emote && player.emote('cheer');
    const nt = nearest(p.x, p.z);
    if (nt && nt.d <= RINGS[0]) {
      const st = nt.d <= RINGS[2] ? 3 : nt.d <= RINGS[1] ? 2 : 1;
      if (st > best) { best = st; try { localStorage.setItem(BEST_KEY, st); } catch (e) {} }
      ctx.reward && ctx.reward(st, `Nhảy dù trúng đích ${nt.t.name}`);
      ctx.toast(`🎯 Đáp cách tâm <b>${nt.d.toFixed(1)} m</b> ở ${nt.t.name} ${'⭐'.repeat(st)}${'☆'.repeat(3 - st)}<br>💡 Dù lớn tạo <b>lực cản không khí</b> chống lại trọng lực → rơi chậm từ ~120 km/h xuống ~15 km/h.`, 7000);
    } else ctx.toast(`🪂 Tiếp đất an toàn!${nt ? ` Bãi đáp gần nhất: <b>${nt.t.name}</b> (cách ${Math.round(nt.d)} m) — lần sau nhắm vòng đỏ trắng để nhận ⭐.` : ''}`, 5000);
  }

  function update(dt) {
    const A = ctx.aircraft;
    if (!S) { setBtn(!!(A && A.flying && A.phase === 'fly' && A.plane && A.plane.group.position.y - Math.max(terrain.heightAt(A.plane.group.position.x, A.plane.group.position.z), W) > 21), false); return; }
    setBtn(S.phase === 'free', true);
    S.t += dt; const inp = player.input; let ix = inp.x, iz = inp.z;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1; if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) iz -= 1; if (keys.has('KeyS') || keys.has('ArrowDown')) iz += 1;
    ix = Math.max(-1, Math.min(1, ix)); iz = Math.max(-1, Math.min(1, iz));
    const w = ctx.weather && ctx.weather.cur ? ctx.weather.cur.w || 0 : 0.3, wa = performance.now() / 1000 * 0.03, wx = Math.cos(wa) * (0.6 + w * 3), wz = Math.sin(wa) * (0.6 + w * 3);   // gió (m/s)
    const P = S.p, V = S.v, fx = Math.sin(S.yaw), fz = Math.cos(S.yaw);
    const fl = floorAt(P.x, P.z, P.y);
    if (S.phase === 'free') {
      V.y = Math.max(-TERM, V.y - G * dt);                                            // rơi tự do, sức cản giới hạn ~34 m/s (≈ 120 km/h)
      S.yaw -= ix * 1.3 * dt;
      const hs = 4 - iz * 3; V.x += ((fx * hs + wx) - V.x) * Math.min(1, dt * 0.8); V.z += ((fz * hs + wz) - V.z) * Math.min(1, dt * 0.8);
      if ((S.t > 2.6 && P.y - fl.f < 55) || P.y - fl.f < 34 || S.t > 13) openChute();
    } else {
      S.open = Math.min(1, S.open + dt / OPEN_T);
      const brake = Math.max(0, iz), fast = Math.max(0, -iz), fwd = 7 + fast * 4 - brake * 3.5, sink = 3.4 + fast * 1.6 - brake * 1.3;
      S.yaw -= ix * 0.95 * dt; S.sway += (ix * 0.35 - S.sway) * Math.min(1, dt * 2.5);
      const k = Math.min(1, dt * (0.6 + S.open * 2));
      V.x += ((fx * fwd + wx * 0.8) - V.x) * k; V.z += ((fz * fwd + wz * 0.8) - V.z) * k; V.y += (-sink - V.y) * k;
    }
    P.addScaledVector(V, dt);
    // kiểm tra va vào vách/nhà khi rơi xuống: chạm mặt (đất, sàn, mái) → tiếp đất
    const f2 = floorAt(P.x, P.z, P.y + 1);
    if (P.y <= f2.f + 0.02) { P.y = f2.f; land(f2); return; }
    // nhân vật: rơi tự do nằm sấp, dang tay; dưới dù đứng thẳng, đung đưa
    if (S.phase === 'free') eu.set(1.25, S.yaw, Math.sin(S.t * 3) * 0.1); else eu.set(0.05, S.yaw, -S.sway * 0.6);
    q.setFromEuler(eu); player.pos.copy(P); player.root.position.copy(P); player.root.quaternion.copy(q);
    if (S.phase === 'canopy') { canopy.position.copy(P); canopy.position.y += 0.9; canopy.rotation.set(0, S.yaw, -S.sway); const sc = 0.2 + 0.8 * (1 - (1 - S.open) ** 3); canopy.scale.set(sc, 0.6 + sc * 0.4, sc); }
    // camera: rơi tự do — sau lưng, cao, nhìn xuống mặt đất; dưới dù — sau lưng, thấy cả vòm dù và bãi đáp
    const free = S.phase === 'free', D = free ? 9 : 13, Hh = free ? 7 : 5.5;
    tmp.set(P.x - fx * D, P.y + Hh, P.z - fz * D); tmp.y = Math.max(tmp.y, floorAt(tmp.x, tmp.z, tmp.y).f + 1.5);
    dampV3(camPos, tmp, camV, T.soft, dt); camera.position.copy(camPos);
    dampV3(camLook, tmp.set(P.x + fx * (free ? 4 : 8), P.y - (free ? 8 : 3), P.z + fz * (free ? 4 : 8)), lookV, T.quick, dt); camera.lookAt(camLook);
    if ((S.hud = (S.hud || 0) - dt) <= 0) { S.hud = 0.5; const nt = nearest(P.x, P.z); const h = document.getElementById('info'); if (h && S.t > 6.5 && S.phase === 'canopy' && nt && nt.d < 233 && !S.told) { S.told = true; ctx.toast(`🎯 ${nt.t.name}: cách <b>${Math.round(nt.d)} m</b> · độ cao <b>${Math.round(P.y - fl.f)} m</b> — lái về cột sáng vàng!`, 4000); } }
  }
  return { update, press, open: openChute, get active() { return !!S; }, get phase() { return S ? S.phase : 'none'; }, get targets() { return targets; } };
}
