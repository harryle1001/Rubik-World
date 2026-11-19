// academy/hall-magic.js — ĐẠI SẢNH PHÉP (v4): "bên trong rộng hơn bên ngoài".
//  · Khi camera ở trong sảnh: tường vươn lên 210 m (21 m × 10), mái ngoài ẩn, trần trời (wonders.js) dời lên đỉnh; ra ngoài: mọi thứ như cũ.
//  · Thay tranh bằng kiến trúc phép: cửa sổ hoa hồng kính màu sau bục giáo viên (13 cánh + 8 cánh + nhụy), hoa hồng thứ hai ở 89 m,
//    cửa sổ nhọn kính màu 3 tầng (21 · 55 · 89 m) hai bên, cột Gothic + đai rune phát sáng, 3 ban công lơ lửng, 4 cờ nhà dài 34 m,
//    3 đèn chùm pha lê xoay, 3 vòng rune, 34 sách bay vòng, 144 nến bay (điện thoại 55), bụi sao lấp lánh.
//  · Nắng xuyên kính: 7 dải sáng màu (cộng màu) từ hoa hồng xuống sàn + 13 đốm màu trên sàn trôi theo giờ; sáng theo ban ngày, tắt ban đêm.
// Draw call khi ở trong sảnh ≈ 12; ngoài sảnh = 0.
import * as THREE from 'three';
import { Batch } from './geo.js';
import { stoneMaterial, lookChoice } from './castle.js';
import { COL } from './kit.js';
import { CFG } from '../config.js';

const PI = Math.PI, GLASS = ['#ff5a4a', '#ffc23a', '#5ab0ff', '#9a6aff', '#4ad890', '#ff7ad0', '#ffffff'];

export function createHallMagic(ctx, { Y, toWorld, toLocal, L, getCastle }) {
  const H = L.hall, t = 1.6, TOP = Y + H.h * 10, MOB = CFG.isMobile;
  const v0 = H.v0 + t, v1 = H.v1 - t, u0 = H.u0 + t, u1 = H.u1 - t, uc = (H.u0 + H.u1) / 2;
  let G = null, inside = false, glassM = null, beams = null, spots = null, books = null, wax = null, flame = null, rings = [], chand = [], motes = null, ceil = null, ceilY = 0;
  const N = MOB ? 55 : 144, rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(144);
  function build() {
    if (G) return; const c = toWorld(0, 0); G = new THREE.Group(); G.name = 'academy-hall-magic'; G.position.set(c[0], 0, c[1]); G.visible = false;
    const s = new Batch(), gl = new Batch();
    // tường trong 21 → 210 m + cột + đai rune
    s.box(v0 - 0.6, v0, Y + H.h - 0.5, TOP, u0, u1, COL.wall); s.box(v1, v1 + 0.6, Y + H.h - 0.5, TOP, u0, u1, COL.wall);
    s.box(v0, v1, Y + H.h - 0.5, TOP, u0 - 0.6, u0, COL.wall); s.box(v0, v1, Y + H.h - 0.5, TOP, u1, u1 + 0.6, COL.wall);
    for (const v of [v0 + 0.5, v1 - 0.5]) for (let u = u0 + 2.5; u < u1 - 1; u += 5.5) {
      s.cyl(v, Y, u, 0.55, TOP - Y, COL.wallD, 8);
      for (let y = Y + 21; y < TOP; y += 34) { s.cyl(v, y, u, 0.8, 0.6, '#b3aca0', 8); gl.add(new THREE.TorusGeometry(0.72, 0.06, 4, 13).rotateX(PI / 2), '#7fd8ff', v, y + 0.9, u); }
    }
    // cửa sổ nhọn kính màu (3 tầng) hai bên
    for (const [y0, hh] of [[Y + 24, 26], [Y + 58, 26], [Y + 92, 47]]) for (const [v, sg] of [[v0 + 0.02, 1], [v1 - 0.02, -1]]) for (let u = u0 + 5.25; u < u1 - 2; u += 5.5) {
      const k = Math.floor(u * 3 + y0) % GLASS.length;
      for (let j = 0; j < 5; j++) gl.add(new THREE.PlaneGeometry(1.9, hh / 5 - 0.15), GLASS[(k + j) % 6], v + sg * 0.01, y0 + (j + 0.5) * hh / 5, u, sg * PI / 2);
      gl.add(new THREE.ConeGeometry(0.95, 2.4, 4).rotateY(PI / 4).scale(1, 1, 0.05).rotateY(PI / 2), '#ffd27a', v + sg * 0.02, y0 + hh + 1.2, u);
    }
    // cửa sổ hoa hồng sau bục (thay tranh lớn) + hoa hồng thứ hai ở 89 m
    const rose = (y, R) => {
      const x = u0 + 0.03; s.add(new THREE.TorusGeometry(R + 0.35, 0.35, 6, 34), '#c9c2b4', 0, y, x, PI / 2 * 0);
      for (let i = 0; i < 13; i++) { const a0 = i / 13 * 2 * PI; gl.add(new THREE.RingGeometry(R * 0.55, R, 3, 1, a0 + 0.03, 2 * PI / 13 - 0.06), GLASS[i % 6], 0, y, x + 0.01); s.add(new THREE.BoxGeometry(0.16, R * 0.47, 0.12), '#c9c2b4', Math.cos(a0) * R * 0.77, y + Math.sin(a0) * R * 0.77, x + 0.03, 0, 0, a0 - PI / 2); }
      for (let i = 0; i < 8; i++) { const a0 = i / 8 * 2 * PI; gl.add(new THREE.RingGeometry(R * 0.22, R * 0.53, 2, 1, a0 + 0.04, PI / 4 - 0.08), GLASS[(i + 3) % 6], 0, y, x + 0.01); }
      gl.add(new THREE.CircleGeometry(R * 0.2, 13), '#fff3d0', 0, y, x + 0.012);
    };
    rose(Y + 13.5, 6.5); rose(Y + 89, 7.8);
    // ban công lơ lửng 3 tầng (khung chữ nhật dọc tường) + cờ nhà dài 34 m
    for (const y of [Y + 55, Y + 89, Y + 144]) { s.box(v0, v1, y - 0.4, y, u0, u0 + 2, '#8d857a'); s.box(v0, v1, y - 0.4, y, u1 - 2, u1, '#8d857a'); s.box(v0, v0 + 2, y - 0.4, y, u0, u1, '#8d857a'); s.box(v1 - 2, v1, y - 0.4, y, u0, u1, '#8d857a'); for (const [a, b] of [[v0 + 2, u0 + 2], [v1 - 2, u1 - 2]]) gl.add(new THREE.BoxGeometry(Math.abs(v1 - v0) - 4, 0.08, 0.08), '#ffd27a', 0, y + 1, a === v0 + 2 ? u0 + 2 : u1 - 2); }
    [['#c8302c', -5.2], ['#3a6fc4', -1.8], ['#3f8a4c', 1.8], ['#7a4fb0', 5.2]].forEach(([col, v]) => { s.box(v - 1.3, v + 1.3, Y + 110, Y + 144, u1 - 0.25, u1 - 0.15, col); s.box(v - 1.4, v + 1.4, Y + 143.6, Y + 144.2, u1 - 0.3, u1 - 0.1, '#c9a24a'); gl.add(new THREE.OctahedronGeometry(0.9).scale(1, 1.3, 0.15), '#ffd27a', v, Y + 130, u1 - 0.32); });
    const stone = stoneMaterial(lookChoice());
    const sm = new THREE.Mesh(s.build(), stone); sm.matrixAutoUpdate = false; G.add(sm);
    glassM = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, side: THREE.DoubleSide }); G.add(new THREE.Mesh(gl.build(), glassM));
    // dải nắng màu + đốm màu trên sàn (cộng màu, không ghi chiều sâu)
    const add = (geo, n) => { const m = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), n); m.frustumCulled = false; G.add(m); return m; };
    beams = add(new THREE.CylinderGeometry(0.9, 1.6, 1, 8, 1, true).translate(0, -0.5, 0), 7); spots = add(new THREE.CircleGeometry(1.2, 13).rotateX(-PI / 2), 13); spots.material.opacity = 0.42;
    const cc = new THREE.Color(); for (let i = 0; i < 13; i++) { spots.setColorAt(i, cc.set(GLASS[i % 6])); if (i < 7) beams.setColorAt(i, cc.set(GLASS[i % 6])); }
    // đèn chùm pha lê, vòng rune, sách bay, nến bay, bụi sao
    for (const y of [Y + 34, Y + 55, Y + 89]) { const b = new Batch(); for (let i = 0; i < 13; i++) { const a = i / 13 * 2 * PI; b.add(new THREE.OctahedronGeometry(0.42), GLASS[i % 6], Math.cos(a) * 3.4, -Math.abs(Math.sin(i * 1.7)) * 1.2, Math.sin(a) * 3.4, 0, 0, 0, 1, 1.8, 1); } b.add(new THREE.TorusGeometry(3.4, 0.08, 4, 21).rotateX(PI / 2), '#ffd27a'); b.add(new THREE.SphereGeometry(0.7, 10, 8), '#fff3d0', 0, 0.3, 0);
      const m = new THREE.Mesh(b.build(), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })); m.position.set(0, y, uc); G.add(m); chand.push(m); }
    for (const [y, r, col] of [[Y + 13, 9, '#9fe6ff'], [Y + 70, 8, '#e6b0ff'], [Y + 120, 8.5, '#ffd27a']]) { const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.12, 4, 55), new THREE.MeshBasicMaterial({ color: col, toneMapped: false, transparent: true, opacity: 0.7 })); m.position.set(0, y, uc); m.rotation.x = PI / 2; G.add(m); rings.push(m); }
    books = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.1, 0.7), new THREE.MeshToonMaterial({ color: '#ffffff' }), 34); for (let i = 0; i < 34; i++) books.setColorAt(i, cc.set(['#c84a3a', '#3a6fc4', '#e0b040', '#3f8a4c', '#8a4fb0'][i % 5])); books.frustumCulled = false; G.add(books);
    wax = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.09, 0.4, 6), new THREE.MeshToonMaterial({ color: '#f6f1e6' }), N); flame = new THREE.InstancedMesh(new THREE.ConeGeometry(0.07, 0.2, 6), new THREE.MeshBasicMaterial({ color: '#ffc35a', toneMapped: false }), N);
    wax.userData.c = Array.from({ length: N }, () => ({ v: v0 + 1 + rnd() * (v1 - v0 - 2), u: u0 + 2 + rnd() * (u1 - u0 - 4), y: Y + 12 + rnd() ** 1.6 * 190, ph: rnd() * 6.3 }));
    for (const m of [wax, flame]) { m.frustumCulled = false; G.add(m); }
    { const P = new Float32Array(233 * 3); for (let i = 0; i < 233; i++) P.set([v0 + rnd() * (v1 - v0), Y + 3 + rnd() * (TOP - Y), u0 + rnd() * (u1 - u0)], i * 3); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); motes = new THREE.Points(g, new THREE.PointsMaterial({ color: '#fff3d0', size: 0.18, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })); motes.frustumCulled = false; G.add(motes); }
    ctx.scene.add(G);
  }
  function unbuild() { if (!G) return; setInside(false); ctx.scene.remove(G); G.traverse(o => { if (o.geometry) o.geometry.dispose(); }); G = null; rings = []; chand = []; ceil = null; }
  function setInside(v) {
    if (v === inside) return; inside = v; if (G) G.visible = v; ctx.shadowHold = v;
    const castle = getCastle(); if (castle && castle.hallRoof) castle.hallRoof.visible = !v;
    if (!ceil) { ceil = ctx.scene.getObjectByName('hall-sky-ceiling'); if (ceil) ceilY = ceil.position.y; }
    if (ceil) { ceil.position.y = v ? TOP - 0.2 : ceilY; ceil.scale.set(1, 1, 1); }
    if (v && !setInside.told) { setInside.told = true; ctx.toast('✨ Ngước lên! Đại sảnh được yểm <b>phép không gian</b>: bên trong cao <b>210 m</b> — gấp 10 lần bên ngoài. Khi nắng xuyên <b>cửa sổ hoa hồng</b>, kính màu tách ánh sáng thành nhiều màu in xuống sàn. 🔬 Kính màu chỉ cho ánh sáng cùng màu với nó đi qua!', 8000); }
  }
  const o = new THREE.Object3D();
  function update(dt, tt) {
    if (!G) return; const cam = ctx.camera.position, [cu, cv] = toLocal(cam.x, cam.z);
    setInside(cu > H.u0 + 0.5 && cu < H.u1 - 0.3 && Math.abs(cv) < H.v1 - 0.3 && cam.y > Y - 2 && cam.y < TOP);
    if (!inside) return;
    const sky = ctx.sky && ctx.sky.state, night = sky ? sky.night || 0 : 0, hr = sky ? sky.hour : 12, day = Math.max(0, 1 - night * 1.6), cloud = ctx.weather && ctx.weather.cur ? ctx.weather.cur.c || 0 : 0, sun = day * (1 - cloud * 0.6);
    glassM.color.setScalar(0.35 + 0.65 * Math.max(day, 0.25));
    // nắng xuyên kính: dải sáng từ hoa hồng (u0, Y+13,5) xuống sàn trước bục; đốm màu trôi theo giờ
    beams.visible = spots.visible = sun > 0.05; beams.material.opacity = 0.1 * sun; spots.material.opacity = 0.45 * sun;
    const drift = (hr - 12) / 6;
    for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.36, sx = Math.sin(a) * 3.2, tu = u0 + 9 + (i % 3) * 3.4 + drift * 2, tv = sx * 2.2 + drift * 3, from = new THREE.Vector3(sx, Y + 13.5 + Math.cos(a) * 3.2, u0 + 0.2), to = new THREE.Vector3(tv, Y + 0.1, tu), d = to.clone().sub(from);
      o.position.copy(from); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), d.clone().normalize()); o.scale.set(1, d.length(), 1); o.updateMatrix(); beams.setMatrixAt(i, o.matrix); }
    o.quaternion.identity();
    for (let i = 0; i < 13; i++) { const a = i / 13 * 2 * PI; o.position.set(Math.sin(a + drift) * 4.2 + drift * 3, Y + 0.14, u0 + 11 + Math.cos(a) * 3.6 + drift * 2); o.scale.setScalar(0.8 + 0.3 * Math.sin(tt * 0.7 + i)); o.updateMatrix(); spots.setMatrixAt(i, o.matrix); }
    beams.instanceMatrix.needsUpdate = spots.instanceMatrix.needsUpdate = true;
    // phép chuyển động
    chand.forEach((m, i) => { m.rotation.y = tt * (0.1 + i * 0.05) * (i % 2 ? -1 : 1); m.position.y = [Y + 34, Y + 55, Y + 89][i] + Math.sin(tt * 0.5 + i) * 0.6; });
    rings.forEach((m, i) => { m.rotation.z = tt * 0.13 * (i % 2 ? -1 : 1); m.rotation.x = PI / 2 + Math.sin(tt * 0.3 + i) * 0.08; });
    for (let i = 0; i < 34; i++) { const a = tt * 0.25 + i / 34 * 2 * PI, r = 6 + (i % 3) * 1.6; o.position.set(Math.sin(a) * r * 0.55, Y + 21 + (i % 7) * 5 + Math.sin(tt + i) * 0.8, uc + Math.cos(a) * r); o.rotation.set(Math.sin(tt * 2 + i) * 0.3, -a, Math.cos(tt * 2.3 + i) * 0.4); o.scale.set(1, 1 + Math.abs(Math.sin(tt * 6 + i)) * 0.5, 1); o.updateMatrix(); books.setMatrixAt(i, o.matrix); }
    books.instanceMatrix.needsUpdate = true; o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1);
    wax.userData.c.forEach((c, i) => { const y = c.y + Math.sin(tt * 0.8 + c.ph) * 0.4; o.position.set(c.v, y, c.u); o.updateMatrix(); wax.setMatrixAt(i, o.matrix); o.position.y = y + 0.3; o.updateMatrix(); flame.setMatrixAt(i, o.matrix); });
    wax.instanceMatrix.needsUpdate = flame.instanceMatrix.needsUpdate = true;
    motes.rotation.y = 0; motes.position.y = Math.sin(tt * 0.2) * 2;
  }
  return { build, unbuild, update, get inside() { return inside; } };
}
