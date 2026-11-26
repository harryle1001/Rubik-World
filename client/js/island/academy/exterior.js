// academy/exterior.js — NGOẠI THẤT CHI TIẾT LÂU ĐÀI (đợt v2). Chỉ đặt model CC0 + tương tác, không dựng lại lâu đài:
//  · máng xối đầu rồng đá (Quaternius Dragon, tô màu đá) trên 4 mặt dãy bao · đuốc gắn tường + cờ 4 nhà (KayKit Dungeon) quanh cổng, sân, đại sảnh
//  · cầu kéo gỗ + xích sắt ở cổng chính, khung cổng sắt (lưới song) kéo lên · lối đi trên tường thành mặt trước + 2 cầu thang đá (13 bậc, dốc 1/φ²)
//  · vườn tượng 2 dãy ở Sân Đại Sảnh (tượng trên bệ, bờ giậu, ghế đá, đèn, cột KayKit) · đồng hồ mặt trời (bóng kim theo giờ thật của trời)
// Va chạm: hộp ctx.boxes (bậc, bệ, cầu kéo, lan can răng cưa). Hiện trong 144 m quanh lâu đài (LOD như castle.js).
import * as THREE from 'three';
import { Batch } from './geo.js';
import { matV, mat } from '../sample/palette.js';
import { placeKit } from '../kit.js';
import { toon } from '../style.js';
import { C, CASTLE_L as L, WATCH } from './plan.js';
import { freeAll } from '../free.js';

const PHI = 1.618, PI = Math.PI;
const STONE = '#8f8a82', STONE_D = '#6f6a62', WOOD = '#6e4a30', IRON = '#34343c';

export function createExterior(ctx, { Y, toLocal }) {
  let G = null, boxes = [], cols = [], glow = null, shadow = null, kitMs = [];
  const SD = [-14, 13];   // đồng hồ mặt trời (u, v) — Sân Đại Sảnh, cạnh đài phun nước
  const B = (u0, u1, v0, v1, top) => boxes.push({ x0: C[0] + v0, x1: C[0] + v1, z0: C[1] + u0, z1: C[1] + u1, top });

  function build() {
    if (G) return;
    G = new THREE.Group(); G.name = 'academy-exterior'; G.position.set(C[0], 0, C[1]);
    const b = new Batch(), kit = {}, put = (n, u, y, v, s = 1, ry = 0) => (kit[n] = kit[n] || []).push([v, y, u, s, ry]);
    const { box: X } = L, Cw = L.curtain;
    // ---------- máng xối đầu rồng: nhô ra mặt ngoài dãy bao, cao 15,5 m, cách 21 m ----------
    const garg = [];
    for (let v = -X.hv + 13; v <= X.hv - 13; v += 21) { if (Math.abs(v) > L.gate + 3) garg.push([X.u1 + 0.5, v, 0]); garg.push([X.u0 - 0.5, v, PI]); }
    for (let u = X.u0 + 13; u <= X.u1 - 13; u += 21) { garg.push([u, -X.hv - 0.5, -PI / 2]); garg.push([u, X.hv + 0.5, PI / 2]); }
    for (const [u, v, ry] of garg) put('qn_dragon', u, Y + 14.6, v, 0.55, ry);
    // ---------- đuốc gắn tường + cờ nhà ----------
    const torch = [], T = (u, v, ry, y = Y + 2.9) => { torch.push([u, v, ry, y]); put('kk_torch_mounted', u, y, v, 1.2, ry); };
    for (const s of [-1, 1]) { T(X.u1 + 0.05, s * (L.gate + 1.6), 0); T(L.hall.u1 + 0.05, s * (L.hall.door + 1.4), 0); }
    for (let v = 17; v < Cw.hv - 8; v += 13) for (const s of [-1, 1]) T(Cw.u1 - Cw.t - 0.05, s * v, PI, Y + 2.4);           // mặt trong tường thành (lối dải trước)
    for (let u = -47; u < 26; u += 13) for (const s of [-1, 1]) T(u, s * 31.95, s > 0 ? -PI / 2 : PI / 2);                     // 2 dãy ngăn quay vào Sân Đại Sảnh
    const BAN = ['red', 'blue', 'green', 'yellow'];
    [-12.5, -8.6, 8.6, 12.5].forEach((v, i) => put('kk_banner_patternA_' + BAN[i], X.u1 + 0.12, Y + 12.4, v, 1.3, 0));
    [-8.3, -5.4, 5.4, 8.3].forEach((v, i) => put('kk_banner_patternA_' + BAN[i], L.hall.u1 + 0.12, Y + 9.6, v, 1.2, 0));
    // ---------- cầu kéo + xích + khung cổng sắt (kéo lên) ----------
    const u0 = X.u1, u1 = Cw.u1 - Cw.t - 0.2, hw = L.gate - 0.9;
    b.box(-hw, hw, Y, Y + 0.25, u0, u1, WOOD); for (let u = u0 + 0.6; u < u1; u += 0.9) b.box(-hw, hw, Y + 0.25, Y + 0.27, u - 0.04, u + 0.04, '#4a3020');   // ván + khe ván
    for (const s of [-1, 1]) { b.box(s * hw - 0.12, s * hw + 0.12, Y, Y + 0.5, u0, u1, IRON); const p0 = new THREE.Vector3(s * hw, Y + 0.5, u1 - 0.3), p1 = new THREE.Vector3(s * (hw + 0.3), Y + 10.5, u0 + 0.3), d = p1.clone().sub(p0), n = 21;
      for (let k = 0; k < n; k++) { const q = p0.clone().addScaledVector(d, (k + 0.5) / n); b.add(new THREE.TorusGeometry(0.16, 0.045, 3, 6), IRON, q.x, q.y, q.z, k % 2 ? PI / 2 : 0, Math.atan2(d.z, d.y)); } }
    B(u0, u1, -hw, hw, Y + 0.25);
    for (let v = -L.gate + 0.3; v <= L.gate - 0.3; v += 0.62) { b.box(v - 0.06, v + 0.06, Y + 9.4, Y + 13, u0 + 0.2, u0 + 0.32, IRON); b.add(new THREE.ConeGeometry(0.09, 0.4, 4), IRON, v, Y + 9.2, u0 + 0.26, 0, PI); }
    for (const y of [Y + 10, Y + 11.4, Y + 12.7]) b.box(-L.gate, L.gate, y - 0.07, y + 0.07, u0 + 0.14, u0 + 0.38, IRON);
    // ---------- lối đi trên tường thành mặt trước + 2 cầu thang 13 bậc ----------
    const wt = Y + Cw.h, ui = Cw.u1 - Cw.t;
    for (const s of [-1, 1]) {
      for (let k = 0; k < 13; k++) { const va = s * (34 - k), vb = s * (33 - k), top = Y + (k + 1) * Cw.h / 13; b.box(Math.min(va, vb), Math.max(va, vb), Y, top, ui - 1.8, ui, STONE); B(ui - 1.8, ui, Math.min(va, vb), Math.max(va, vb), top); }
      b.box(s > 0 ? 20.6 : -21, s > 0 ? 21 : -20.6, Y, wt, ui - 1.8, ui, STONE_D);   // chiếu nghỉ
      const segs = s > 0 ? [[WATCH.r + 10, Cw.hv - WATCH.r]] : [[-126.5 + 0.7, -10 - WATCH.r]];
      for (const [a0, a1] of segs) { const v0 = s > 0 ? a0 : a0, v1 = s > 0 ? a1 : a1; B(Cw.u1 - 0.6, Cw.u1 + 0.05, Math.min(v0, v1), Math.max(v0, v1), wt + 1.35); }   // lan can răng cưa (không rơi xuống vách)
    }
    // ---------- vườn tượng: 2 dãy ở Sân Đại Sảnh (v = ±24) ----------
    let n = 0;
    for (const s of [-1, 1]) for (let u = 22; u >= -40; u -= 8.5) {
      const v = s * 24, k = n++ % 3;
      if (k === 0) { b.box(v - 0.8, v + 0.8, Y, Y + 1.05, u - 0.8, u + 0.8, STONE); b.box(v - 0.95, v + 0.95, Y + 1.05, Y + 1.2, u - 0.95, u + 0.95, STONE_D); put('prop_statue', u, Y + 1.2, v, 1.9, s > 0 ? -PI / 2 : PI / 2); B(u - 0.95, u + 0.95, v - 0.95, v + 0.95, Y + 1.2 + 2.5); }
      else if (k === 1) { put('plant_hedge_large', u, Y, v + s * 0.4, 3, 0); put('qn_flowers', u + 2.2, Y, v - s * 1.6, 1.2, u); put('qn_flowers', u - 2.2, Y, v - s * 1.6, 1.1, -u); cols.push({ x: C[0] + v + s * 0.4, z: C[1] + u, r: 1.2 }); }
      else { put('prop_bench', u, Y, v - s * 0.8, 2, s > 0 ? -PI / 2 : PI / 2); put('prop_lantern', u + 1.9, Y, v + s * 0.6, 2.1); put('prop_lantern', u - 1.9, Y, v + s * 0.6, 2.1); }
    }
    for (const s of [-1, 1]) for (const u of [27.5, -45.5]) { put('kk_pillar_decorated', u, Y, s * 24, 1.1); cols.push({ x: C[0] + s * 24, z: C[1] + u, r: 0.8 }); }
    // ---------- đồng hồ mặt trời ----------
    const [su, sv] = SD;
    b.cyl(sv, Y, su, 1.6, 0.3, STONE_D, 21); b.cyl(sv, Y + 0.3, su, 0.45, 0.8, STONE, 8); b.cyl(sv, Y + 1.1, su, 1.05, 0.12, '#c9c2b4', 24);
    for (let h = 6; h <= 18; h++) { const a = (h - 12) * PI / 12, r = 0.88; b.box(-0.025, 0.025, Y + 1.22, Y + 1.25, -0.11, 0.11, h % 3 ? '#5a5248' : '#2a2236'); b.list[b.list.length - 1].rotateY(-a).translate(sv - Math.sin(a) * r, 0, su - Math.cos(a) * r); }
    { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.05, 0, 0.6, -0.75, 0, 0, -0.85, 0, 0, 0.05, 0, 0, -0.85, 0, 0.6, -0.75], 3)); g.computeVertexNormals(); b.add(g, '#c9a24a', sv, Y + 1.22, su); }   // kim (chĩa Bắc = −u)
    B(su - 1.1, su + 1.1, sv - 1.1, sv + 1.1, Y + 1.22);
    // gộp + đặt
    const m = new THREE.Mesh(b.build(), matV()); m.castShadow = m.receiveShadow = true; m.matrixAutoUpdate = false; G.add(m);
    const sg = new THREE.PlaneGeometry(0.07, 0.95).rotateX(-PI / 2).translate(0, 0, -0.5); shadow = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ color: '#2a2430', transparent: true, opacity: 0.55, depthWrite: false })); shadow.position.set(sv, Y + 1.24, su); G.add(shadow);
    // ánh lửa đuốc ban đêm: 1 InstancedMesh
    glow = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 6, 4), mat('lampGlow'), torch.length); const o = new THREE.Object3D();
    torch.forEach(([u, v, ry, y], i) => { o.position.set(v + Math.sin(ry) * 0.34, y + 1.02, u + Math.cos(ry) * 0.34); o.updateMatrix(); glow.setMatrixAt(i, o.matrix); }); glow.frustumCulled = false; G.add(glow);
    const stoneDragon = toon('#8a857c');
    for (const [name, list] of Object.entries(kit)) placeKit(G, name, list, { shadow: name !== 'qn_flowers' }).then(ims => { if (!G) return; for (const im of ims) { if (name === 'qn_dragon') im.material = stoneDragon; im.matrixAutoUpdate = false; kitMs.push(im); } });
    ctx.scene.add(G); (ctx.boxes = ctx.boxes || []).push(...boxes); ctx.colliders.push(...cols);
  }
  function unbuild() {
    if (!G) return; ctx.scene.remove(G);
    freeAll(G);
    for (const arr of [[ctx.boxes, boxes], [ctx.colliders, cols]]) for (const x of arr[1]) { const i = arr[0].indexOf(x); if (i >= 0) arr[0].splice(i, 1); }
    G = null; boxes = []; cols = []; kitMs = [];
  }
  const hc = [C[0], C[1] - 30];
  function update(dt, t) {
    if (!G) return; const cam = ctx.camera.position, near = Math.hypot(cam.x - hc[0], cam.z - hc[1]) < 144 + 89 && cam.y < 600;
    G.visible = near; if (!near) return;
    const sky = ctx.sky && ctx.sky.state, hr = sky ? sky.hour : 12, night = sky ? sky.night || 0 : 0;
    glow.visible = night > 0.25;
    shadow.visible = hr > 6 && hr < 18 && night < 0.3; shadow.rotation.y = -(hr - 12) * PI / 12 + PI;   // bóng ngược phía Mặt Trời: trưa chỉ Bắc
    const p = ctx.player.pos, [u, v] = toLocal(p.x, p.z);
    if (Math.hypot(u - SD[0], v - SD[1]) < 3 && Math.abs(p.y - Y) < 2) ctx.offer('☀️ Đọc đồng hồ mặt trời', () => {
      if (!shadow.visible) return ctx.toast('🌙 Đồng hồ mặt trời <b>không chạy ban đêm</b> — cần có nắng mới có bóng! Ngày xưa người ta dùng đồng hồ nước, đồng hồ cát khi trời tối.', 6000);
      const h = Math.floor(hr), mm = Math.round((hr - h) * 60 / 5) * 5;
      ctx.toast(`☀️ Bóng kim chỉ khoảng <b>${h} giờ ${mm ? mm + ' phút' : ''}</b>. 🔬 Trái Đất quay quanh trục từ Tây sang Đông nên Mặt Trời "đi" trên trời → bóng kim xoay đều <b>15° mỗi giờ</b> (360° : 24 giờ). Buổi trưa bóng ngắn nhất.`, 7000);
    }, 7);
  }
  return { build, unbuild, update };
}
