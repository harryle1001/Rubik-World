// brooms.js — 🧹 CHỔI BAY: phương tiện cưỡi được ở khắp đảo (đăng ký qua ctx.vehicles.register, dùng chung điều khiển bay).
// Gọi chổi: nút 🧹 (cột phương tiện) / phím J · phép "Gọi Chổi!" nếu có ctx.spells.register. Bay: WASD/joystick hướng,
// Space/⬆ lên · C/⬇ xuống · Shift/Nhanh tăng tốc · chạm đất bấm E/🧹 để xuống. Độ cao tối đa 55 m trên mặt đất / nóc nhà.
// Không xuyên nhà: tra ctx.boxes như aircraft.js (roofAt) — chạm tường thì trượt dọc tường, bay trên nóc thì đậu được.
// Tư thế: dáng ngồi ghế (people-model) + xoay 2 cánh tay ra trước nắm cán; áo choàng (màu áo mua / màu nhà) bay phần phật theo tốc độ.
// Hình chổi: model CC0 "Medieval Tools Pack" (assets/models/alley/broom.glb, CREDITS.txt) tô màu theo loại; 1 draw call / chổi.
import * as THREE from 'three';
import { loadModel } from './models.js';
import { PHI } from './layout.js';
import { CFG } from './config.js';
import { CAPES } from './academy/wear.js';
import { toWorld, BASE_Y } from './academy/plan.js';

// Loại chổi (tốc độ m/s theo Fibonacci). id trùng wear.js BROOMS (mua ở Xưởng Chổi Bay — Phố Phép Thuật); 'broom-tap' miễn phí.
export const BROOM_TYPES = [
  { id: 'broom-tap', name: 'Chổi Tập Bay', col: '#b98a5a', speed: 8, boost: PHI, climb: 5, fact: 'Chổi dành cho người mới: chậm, êm, dễ lái.' },
  { id: 'broom', name: 'Chổi bay gỗ sồi', col: '#9a6a3e', speed: 13, boost: PHI, climb: 8, fact: 'Gỗ sồi cứng và bền — cán chổi thẳng giúp bay thăng bằng.' },
  { id: 'broom-tre', name: 'Chổi Tre Gió Lộng', col: '#9cb85a', speed: 17, boost: PHI, climb: 10, fact: 'Tre rỗng ruột nên nhẹ mà vẫn chắc — bay nhanh hơn chổi gỗ.' },
  { id: 'broom-vang', name: 'Chổi bay cán vàng', col: '#e0b040', speed: 21, boost: PHI, climb: 13, fact: 'Cán mạ vàng, lông chổi chải thẳng: lướt gió rất nhanh.' },
  { id: 'broom-sao', name: 'Chổi Sao Băng', col: '#8a7cff', speed: 21, boost: 2, climb: 13, fact: 'Nhanh nhất học viện: tăng tốc gấp đôi như sao băng vụt qua bầu trời.' },
  { id: 'board-bac', name: 'Ván Bạc Bay', col: '#dfe6f0', speed: 21, boost: PHI, climb: 13, board: true, fact: 'Bạc phản xạ ánh sáng tốt nhất trong mọi kim loại — tấm ván sáng loáng giữa trời.' },   // 💎 đồ đặc biệt (model ván trượt Kenney CC0)
];
export const BROOM = Object.fromEntries(BROOM_TYPES.map(b => [b.id, b]));
const HOVER = 0.82, ALT = 55, ALT_CAP = 233, GAP = 0.45;   // chổi lơ lửng 0,82 m · tối đa 55 m trên mặt đất · trần 233 m

// Chổi (group) — dùng cho người chơi, chổi đặt sẵn và NPC của môn Săn Cầu Vàng (academy/pitch.js)
export function makeBroomMesh(type) {
  const g = new THREE.Group(), T = BROOM[type] || BROOM_TYPES[0];
  const inner = new THREE.Group(); inner.position.set(0, HOVER, -0.12); inner.rotation.x = -0.07; g.add(inner);   // mũi chổi hơi ngóc lên
  loadModel(T.board ? 'kit/sport_skateboard' : 'alley/broom').then(m => {
    if (!m) return; m.position.set(0, 0, 0); m.scale.setScalar(T.board ? 1.3 : 1.6); m.rotation.set(0, T.board ? Math.PI / 2 : Math.PI, 0);   // cán hướng ra trước (+z), lông chổi phía sau; ván: mũi ra trước
    if (T.board) { inner.rotation.x = 0; m.position.y = -0.62; }
    m.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.set(T.col).lerp(new THREE.Color('#ffffff'), 0.35); if (T.board) { o.material.metalness = 0.62; o.material.roughness = 0.24; } o.castShadow = true; } });
    inner.add(m);
  });
  if (type === 'broom-sao') {   // đuôi sao lấp lánh (1 mesh nhỏ)
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), new THREE.MeshBasicMaterial({ color: '#d8d0ff' })); s.position.set(0, 0.02, -1.05); inner.add(s);
  }
  g.userData.inner = inner;
  return g;
}

// Áo choàng phần phật: mặt phẳng 6 đoạn, vertex shader lượn sóng theo thời gian + tốc độ (không cấp phát mỗi khung)
export function makeCape(col, w = 0.44, l = 0.74) {
  const geo = new THREE.PlaneGeometry(w, l, 2, 6).translate(0, -l / 2, 0);
  const U = { uT: { value: 0 }, uS: { value: 0 } };
  const mat = new THREE.MeshToonMaterial({ color: col, side: THREE.DoubleSide });
  mat.onBeforeCompile = sh => {
    sh.uniforms.uT = U.uT; sh.uniforms.uS = U.uS;
    sh.vertexShader = 'uniform float uT; uniform float uS;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float t = clamp(-position.y / ${l.toFixed(3)}, 0., 1.);
      float lift = t * (0.12 + uS * 1.1);                                   // gió đẩy vạt áo bay ra sau
      float wave = sin(uT * (5. + uS * 9.) - t * 7. + position.x * 4.) * t * (0.035 + uS * 0.11);
      transformed.z -= sin(lift) * ${l.toFixed(3)} * t + wave;
      transformed.y += (1. - cos(lift)) * ${l.toFixed(3)} * t;
      transformed.x *= 1. + t * 0.3;`);
  };
  mat.customProgramCacheKey = () => 'cape-flutter';
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.castShadow = true; m.userData.U = U;
  return m;
}

// Xoay 2 cánh tay ra trước nắm cán chổi (gọi SAU anim.update). root: group nhân vật (trục ngang = x của root).
const _q = new THREE.Quaternion(), _w = new THREE.Quaternion(), _ax = new THREE.Vector3();
export function holdPose(model, root, k = 1) {
  if (!model) return;
  root.getWorldQuaternion(_w);
  const rot = (name, x, z) => {
    const C = model.userData.hpB || (model.userData.hpB = {}), b = C[name] || (C[name] = model.getObjectByName(name)); if (!b) return;
    // xương không có track animation (track hằng đã cắt) không được mixer đặt lại mỗi khung → trả về dáng gốc trước khi xoay, tránh cộng dồn
    const H = b.userData.hp || (b.userData.hp = { base: b.quaternion.clone(), set: new THREE.Quaternion(0, 0, 0, 0) });
    if (b.quaternion.equals(H.set)) b.quaternion.copy(H.base); else H.base.copy(b.quaternion);
    const W = b.getWorldQuaternion(new THREE.Quaternion()).invert();
    if (x) { _ax.set(1, 0, 0).applyQuaternion(_w).applyQuaternion(W); b.quaternion.multiply(_q.setFromAxisAngle(_ax, x * k)); }
    if (z) { _ax.set(0, 0, 1).applyQuaternion(_w).applyQuaternion(W); b.quaternion.multiply(_q.setFromAxisAngle(_ax, z * k)); }
    H.set.copy(b.quaternion);
  };
  rot('upperarml', -1.05, -0.32); rot('upperarmr', -1.05, 0.32);   // cánh tay đưa ra trước, khép vào giữa
  rot('lowerarml', -0.35, 0); rot('lowerarmr', -0.35, 0);
  rot('spine', 0.22, 0);                                            // rướn người về trước
}

export function createBrooms(ctx) {
  const V = ctx.vehicles, pl = ctx.player, { terrain, scene } = ctx, W = CFG.island.waterLevel;
  // 🔒 chổi / Ván Bạc Bay mở khoá ở 🛒 Cửa hàng (economy/) hoặc Xưởng Chổi Bay; chổi đặt sẵn ở Sân Đại Sảnh ai cũng cưỡi thử được
  const own = id => ctx.eco ? ctx.eco.owns(id) : id === 'broom-tap' || !!(ctx.wear && ctx.wear.own && ctx.wear.own(id));
  let pick = null;
  const chosen = () => { const e = pick || (ctx.wear && ctx.wear.eq && ctx.wear.eq.broom); if (e && BROOM[e] && own(e)) return e; return [...BROOM_TYPES].reverse().map(b => b.id).find(own) || null; };
  const ground = (x, z) => Math.max(terrain.heightAt(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, 999) : -99, W);
  function roofAt(x, z, m) {   // như aircraft.js: nóc hộp cao nhất trong bán kính m
    const L = ctx.grid ? ctx.grid.near(x, z).boxes : (ctx.boxes || []); let top = -99;
    for (let i = 0; i < L.length; i++) { const B = L[i]; if (B.top > top && x > B.x0 - m && x < B.x1 + m && z > B.z0 - m && z < B.z1 + m) top = B.top; }
    return top;
  }
  let cape = null, capeCol = null, altWarn = 0, t = 0;
  const prev = new THREE.Vector3();
  const capeColor = () => {
    const c = ctx.wear && ctx.wear.eq && ctx.wear.eq.cape, C = c && CAPES.find(x => x.id === c);
    if (C) return C.col; const h = ctx.houses && ctx.houses.houseId && ctx.houses.houseId(); return h ? ({ long: '#c8302c', phung: '#3a6fc4', lan: '#3f8a4c', quy: '#7a4fb0' })[h] : '#5b3a8e';
  };
  function wearCape() {
    const hero = pl.hero; if (!hero) return;
    const col = capeColor(); if (cape && capeCol === col) { cape.visible = true; return; }
    if (cape) { cape.removeFromParent(); cape.geometry.dispose(); cape.material.dispose(); }
    capeCol = col; cape = makeCape(col);
    const root = pl.root, head = hero.model.getObjectByName('head'), chest = hero.model.getObjectByName('chest') || hero.model.getObjectByName('spine');
    root.updateMatrixWorld(true);
    const hp = head ? root.worldToLocal(head.getWorldPosition(new THREE.Vector3())) : new THREE.Vector3(0, 1.3, 0);
    cape.position.set(0, hp.y - 0.1, hp.z - 0.17); root.add(cape); root.updateMatrixWorld(true); if (chest) chest.attach(cape);
  }

  // một cây chổi cưỡi được (đặt sẵn hoặc gọi tới)
  function make(type) {
    const T = BROOM[type] || BROOM_TYPES[0], group = makeBroomMesh(type);
    const v = { type: 'broom', kind: type, name: T.name, group, r: 2.4, far: 89, side: 1.3, takeoff: 0.8,
      label: T.board ? `🛹 Lướt ${T.name}` : `🧹 Cưỡi ${T.name}`, bye: T.board ? '🛹 Xuống ván' : '🧹 Xuống chổi',
      hello: `${T.board ? '🛹' : '🧹'} <b>${T.name}</b> — ${T.fact}<br><small>Bay: <b>WASD</b>/cần điều khiển · <b>Space/⬆</b> lên · <b>C/⬇</b> xuống · <b>Shift/Nhanh</b> tăng tốc · chạm đất bấm <b>E</b> để xuống</small>`,
      mode: { speed: T.speed, boost: T.boost, turn: 2.6, accel: 1.6, fly: true, climb: T.climb, lift: 0, maxAlt: ALT, anim: T.board ? 'idle' : 'drive', seat: T.board ? HOVER - 0.5 : HOVER + 0.05, seatZ: 0.02, camAdd: 2.5 },
      onMount() { prev.copy(pl.pos); wearCape(); ctx.sfx && ctx.sfx('ok'); },
      onDismount() { if (cape) cape.visible = false; if (v.temp) v.gone = 1.6; },
      tick(dt, sp, st) {
        const M = pl.vehicle, p = pl.pos; if (!M) return;
        // độ cao tối đa: 55 m trên mặt đất/nóc nhà (hạ trần từ từ khi bay ra khỏi vách cao)
        const gnd = Math.max(ground(p.x, p.z), roofAt(p.x, p.z, 1)), want = Math.min(ALT_CAP, gnd + ALT);
        M.maxAlt = Math.max(want, Math.min(M.maxAlt, p.y) - dt * 8);
        if (p.y > M.maxAlt - 0.5 && st.lift > 0.5 && t > altWarn) { altWarn = t + 8; ctx.toast(`🧹 Chổi chỉ bay cao tối đa <b>${ALT} m</b> trên mặt đất — không khí loãng, lạnh lắm!`, 2600); }
        // không xuyên nhà: chạm cạnh hộp → đẩy ra phía vừa tới; ở trên nóc → đậu lên nóc
        const L = ctx.grid ? ctx.grid.near(p.x, p.z).boxes : (ctx.boxes || []);
        for (let i = 0; i < L.length; i++) {
          const b = L[i]; if (p.y >= b.top || p.x < b.x0 - GAP || p.x > b.x1 + GAP || p.z < b.z0 - GAP || p.z > b.z1 + GAP) continue;
          if (prev.y >= b.top - 0.6) { p.y = b.top; pl.vy = Math.max(0, pl.vy); continue; }
          const inX = prev.x > b.x0 - GAP && prev.x < b.x1 + GAP, inZ = prev.z > b.z0 - GAP && prev.z < b.z1 + GAP;
          if (!inX) p.x = prev.x < b.x0 ? b.x0 - GAP : b.x1 + GAP; else if (!inZ) p.z = prev.z < b.z0 ? b.z0 - GAP : b.z1 + GAP;
          else { const a = [p.x - b.x0, b.x1 - p.x, p.z - b.z0, b.z1 - p.z], k = a.indexOf(Math.min(...a)); if (k === 0) p.x = b.x0 - GAP; else if (k === 1) p.x = b.x1 + GAP; else if (k === 2) p.z = b.z0 - GAP; else p.z = b.z1 + GAP; }
          pl.vel.multiplyScalar(0.6);
        }
        if (p.y < ground(p.x, p.z) + 3) for (const c of (ctx.grid ? ctx.grid.near(p.x, p.z).cols : ctx.colliders)) { const dx = p.x - c.x, dz = p.z - c.z, rr = c.r + 0.4, d = Math.hypot(dx, dz); if (d < rr && d > 1e-3) { p.x = c.x + dx / d * rr; p.z = c.z + dz / d * rr; } }
        prev.copy(p);
        // tư thế: nghiêng vào cua, chúi mũi khi lao xuống / ngóc khi bay lên; tay nắm cán
        pl.root.rotation.z = st.lean * 1.3; pl.root.rotation.x = THREE.MathUtils.clamp(-pl.vy * 0.035, -0.3, 0.3) + (st.fast ? 0.06 : 0);
        const hero = pl.hero; if (hero && !T.board) holdPose(hero.model, pl.root);
        group.userData.inner.position.y = HOVER + (st.grounded ? Math.sin(t * 2.4) * 0.03 : Math.sin(t * 1.3) * 0.05);
        if (cape) { const U = cape.userData.U; U.uT.value = t; U.uS.value += (Math.min(1, sp / 21) - U.uS.value) * Math.min(1, dt * 3); }
      } };
    return v;
  }
  const park = (type, x, z, ry, y) => { const v = make(type); v.group.position.set(x, y ?? ground(x, z), z); v.group.rotation.y = ry; return V.register(v); };

  // chổi đặt sẵn: giá chổi ở Sân Đại Sảnh Học viện (5 loại, mũi hướng ra cổng) — ai cũng cưỡi thử được
  BROOM_TYPES.filter(b => !b.board).forEach((b, i) => { const [x, z] = toWorld(13, -21 + i * 10.5); park(b.id, x, z, 0, BASE_Y + 0.6); });

  // gọi chổi (nút 🧹 / phím G / phép): lên chổi đang chọn; đang cưỡi chổi → xuống
  function summon(type0) {
    if (typeof type0 === 'string') { if (!own(type0)) return ctx.eco && ctx.eco.locked(type0); pick = type0; }
    if (V.riding === 'broom') return V.dismount();
    if (V.current) return ctx.toast('🚶 Xuống phương tiện đang đi trước đã', 2200);
    if (pl.frozen || (ctx.dive && ctx.dive.swimming)) return ctx.toast('🌊 Lên bờ rồi mới gọi chổi nhé', 2200);
    const type = chosen(); if (!type) return ctx.eco ? ctx.eco.locked('broom-tap') : null;
    const v = make(type); v.temp = true;
    v.group.position.copy(pl.pos); v.group.rotation.set(0, pl.rot, 0); V.register(v); V.mount(v);
    if (type === 'broom-tap' && !own('broom')) setTimeout(() => ctx.toast('🧹 Mua chổi nhanh hơn ở <b>Xưởng Chổi Bay</b> — Phố Phép Thuật (Học viện Pha Lê)', 3500), 5800);
  }
  const btn = document.getElementById('bBroom');
  if (btn) btn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); summon(); });
  addEventListener('keydown', e => { if (e.repeat || ctx.freeCam || ctx.mapOpen || document.body.classList.contains('rs-modal') || /INPUT|TEXTAREA/.test(document.activeElement?.tagName)) return; if (e.code === 'KeyJ') summon(); });
  if (ctx.spells && ctx.spells.hooks) ctx.spells.hooks.broom = () => summon();   // sau ghép: phép "Gọi Chổi!" có sẵn trong vòng phép (spellbook.js) gọi vào đây
  else if (ctx.spells && ctx.spells.register) ctx.spells.register({ id: 'goi-choi', name: 'Gọi Chổi!', icon: '🧹', cast: summon });

  // chổi tạm (gọi tới) biến mất sau khi xuống 1,6 s; chổi đặt sẵn đứng chờ
  function update(dt) {
    t += dt;
    if (btn) btn.textContent = V.riding === 'broom' ? '🚶' : '🧹';
    for (let i = V.all.length - 1; i >= 0; i--) { const v = V.all[i]; if (v.type !== 'broom' || v === V.current) continue;
      if (v.gone !== undefined && (v.gone -= dt) <= 0) { scene.remove(v.group); V.all.splice(i, 1); continue; }
      if (v.group.visible && v.group.userData.inner) v.group.userData.inner.position.y = HOVER + Math.sin(t * 2 + v.group.position.x) * 0.06; }
  }
  return { update, make, park, summon, chosen, own, roofAt, ground };
}
