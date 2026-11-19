// academy/north.js — SÂN BẮC (mở rộng lâu đài v3): bậc đá nổi trên hồ phía sau lâu đài, nối mép cao nguyên (sau cổng sau).
//  · 2 nửa sân 55 × 90 m (u −176…−121), chừa khe |v| < 6 cho cầu cạn nhiều nhịp vòm ở giữa → lâu đài to rộng thêm ≈ 1/3.
//  · Nửa tây: Cánh Bắc (dãy nhà 21 m dùng chung bộ mô-đun kit.js), Tháp Cú 34 m + đàn cú bay (InstancedMesh), nền cho
//    Tháp Cầu Thang Phép (stairs.js) và lớp thực hành phép ngoài trời (practice.js). Nửa đông: Phố Phép Thuật Mới (pho2.js).
//  · Mặt đi: ctx.groundExtra (chỉ khi người ở gần cao độ sân) · va chạm: hộp ctx.boxes · hiện trong 233 m.
import * as THREE from 'three';
import { Batch } from './geo.js';
import { matV } from '../sample/palette.js';
import { makeKit, instMesh, MERLON, ARCH_GEO, COL } from './kit.js';
import { stoneMaterial, lookChoice } from './castle.js';
import { mat } from '../sample/palette.js';
import { loadModel } from '../models.js';
import { heightLocal, toWorld as tw0 } from './plan.js';

export const NORTH = { u0: -176, u1: -121, gap: 6, hv: 96 };   // 2 nửa: v ∈ [−96, −6] và [6, 96]
export const OWLERY = { u: -170, v: -18, r: 4.2, h: 34 };
const PI = Math.PI;

export function createNorth(ctx, magic, { Y, toWorld, toLocal }) {
  const N = NORTH;
  let G = null, boxes = [], owls = null, ow = [];
  const inN = (u, v) => u > N.u0 && u < N.u1 && Math.abs(v) > N.gap && Math.abs(v) < N.hv;
  const prev = ctx.groundExtra;
  ctx.groundExtra = (x, z, y) => { const h = prev ? prev(x, z, y) : -99; if (!G || (y !== undefined && y < Y - 3)) return h; const [u, v] = toLocal(x, z); return inN(u, v) ? Math.max(h, Y) : h; };
  const ground = (u, v) => { const [x, z] = tw0(u, v); return heightLocal(u, v, x, z); };
  function build() {
    if (G) return;
    G = new THREE.Group(); G.name = 'academy-north'; G.position.set(...[toWorld(0, 0)[0], 0, toWorld(0, 0)[1]]);
    const B = { wall: new Batch(), glow: new Batch(), glass: new Batch(), win: new Batch(), det: new Batch() }; B.roof = B.wall;
    const K = makeKit(B, { Y, ground }), w = B.wall;
    for (const s of [-1, 1]) {
      const v0 = s > 0 ? N.gap : -N.hv, v1 = s > 0 ? N.hv : -N.gap;
      w.box(v0, v1, Y - 2.5, Y, N.u0, N.u1, '#8d857a');                                              // mặt sân lát đá
      w.box(v0, v1, Y - 0.02, Y + 0.04, N.u0 + 1, N.u1 - 1, '#b3aca0');
      for (let u = N.u0 + 6; u < N.u1 - 4; u += 13) for (let v = v0 + 6; v < v1 - 3; v += 13) w.cyl(v, -4, u, 1.3, Y - 2.5 + 4, COL.wallD, 8);   // trụ đỡ xuống đáy hồ
      // lan can + va chạm: mép ngoài (u0), 2 cạnh v
      const rail = (a0, a1, f, axis) => { if (axis === 'v') { w.box(a0, a1, Y, Y + 1.1, f - 0.3, f + 0.3, COL.wallD); K.solid(f - 0.3, f + 0.3, a0, a1, Y + 1.1); } else { w.box(f - 0.3, f + 0.3, Y, Y + 1.1, a0, a1, COL.wallD); K.solid(a0, a1, f - 0.3, f + 0.3, Y + 1.1); } };
      rail(v0, v1, N.u0 + 0.3, 'v'); rail(N.u0, N.u1 - 2, s > 0 ? N.hv - 0.3 : -N.hv + 0.3, 'u'); rail(N.u0, N.u1 - 7, s > 0 ? N.gap + 0.3 : -N.gap - 0.3, 'u');
    }
    // Cánh Bắc: dãy 66 × 8 m cao 21 + khối mái chồng + Tháp Cú
    K.range(N.u0 + 1, N.u0 + 9, -N.hv + 1, -30, 21, 8, [[-70, -64]], 8, -1);
    K.mass(N.u0 + 1, N.u0 + 9, -92, -76, 29, 8);
    K.tower(OWLERY.u, OWLERY.v, OWLERY.r, OWLERY.h, OWLERY.r * 1.618 ** 3, COL.roofG, true);
    w.cyl(OWLERY.v, Y + OWLERY.h - 4, OWLERY.u, OWLERY.r * 1.35, 0.4, COL.wood, 12);                 // gờ đậu cho cú
    for (let k = 0; k < 8; k++) { const a = k / 8 * 2 * PI; w.box(OWLERY.v + Math.cos(a) * (OWLERY.r + 0.6) - 0.5, OWLERY.v + Math.cos(a) * (OWLERY.r + 0.6) + 0.5, Y + OWLERY.h - 4.6, Y + OWLERY.h - 3.6, OWLERY.u + Math.sin(a) * (OWLERY.r + 0.6) - 0.5, OWLERY.u + Math.sin(a) * (OWLERY.r + 0.6) + 0.5, COL.wood); }   // ổ cú
    const look = lookChoice(), stone = stoneMaterial(look);
    const add = (geo, m, sh = true) => { const o = new THREE.Mesh(geo, m); o.castShadow = sh; o.receiveShadow = true; o.matrixAutoUpdate = false; G.add(o); return o; };
    add(B.wall.build(), stone); add(B.det.build(), stone);
    const win = add(B.win.build(), new THREE.MeshBasicMaterial({ color: '#3a4250', vertexColors: true, toneMapped: false }), false); G.userData.win = win;
    add(B.glow.build(), mat('lampGlow'), false);
    if (K.inst.merlon.length) G.add(instMesh(MERLON, COL.wallD, K.inst.merlon, stone));
    if (K.inst.arch.length) G.add(instMesh(ARCH_GEO, COL.wall, K.inst.arch, stone));
    boxes = K.boxes.map(b => { const [x0, z0] = toWorld(b.u0, b.v0), [x1, z1] = toWorld(b.u1, b.v1); return { x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), top: b.top }; });
    (ctx.boxes = ctx.boxes || []).push(...boxes);
    // đàn cú: 21 con (đại bàng Quaternius CC0 thu nhỏ, tô nâu) — 13 quanh Tháp Cú, 8 bay vòng lớn quanh lâu đài
    loadModel('kit/qn_eagle').then(m => {
      if (!m || !G) return; let mesh = null; m.traverse(o => { if (o.isMesh && !mesh) mesh = o; }); if (!mesh) return;
      const geo = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld); const mt = mesh.material.clone(); mt.color = new THREE.Color('#b08a5a');
      owls = new THREE.InstancedMesh(geo, mt, 21); owls.frustumCulled = false; G.add(owls);
      for (let i = 0; i < 21; i++) ow.push(i < 13 ? { c: [OWLERY.u, OWLERY.v], r: 6 + (i % 5) * 3.4, y: Y + 21 + (i * 7) % 21, sp: 0.35 + (i % 4) * 0.1, ph: i * 0.9, s: 0.75 } : { c: [-34, 0], r: 89 + (i % 3) * 21, y: Y + 34 + (i % 4) * 8, sp: 0.06 + (i % 3) * 0.02, ph: i * 1.3, s: 0.9 });
    });
    ctx.scene.add(G);
  }
  function unbuild() {
    if (!G) return; ctx.scene.remove(G); G.traverse(o => { if (o.isMesh && !o.isInstancedMesh) o.geometry.dispose(); });
    for (const b of boxes) { const i = ctx.boxes.indexOf(b); if (i >= 0) ctx.boxes.splice(i, 1); } boxes = []; G = null; owls = null; ow = [];
  }
  const o3 = new THREE.Object3D(); let mailT = -99;
  function update(dt, t) {
    if (!G) return; const cam = ctx.camera.position, [cu, cv] = toLocal(cam.x, cam.z);
    G.visible = Math.hypot(cu + 148, cv) < 233 + 55 && cam.y < 600 && (cu < -92 || cam.y > Y + 21 || Math.abs(cv) > 150); if (!G.visible) return;
    const n = ctx.sky && ctx.sky.state ? ctx.sky.state.night || 0 : 0; G.userData.win.material.color.set('#3a4250').lerp(new THREE.Color('#ffffff'), Math.min(1, Math.max(0, (n - 0.12) / 0.5)));
    if (owls) { ow.forEach((w, i) => { const a = t * w.sp * (i % 2 ? 1 : -1) + w.ph, u = w.c[0] + Math.cos(a) * w.r, v = w.c[1] + Math.sin(a) * w.r; o3.position.set(v, w.y + Math.sin(t * 1.7 + i) * 1.3, u); o3.rotation.set(0, Math.atan2(Math.cos(a), -Math.sin(a)) * (i % 2 ? 1 : -1) + (i % 2 ? 0 : PI), Math.sin(t * 9 + i) * 0.12); o3.scale.set(w.s, w.s * (0.85 + Math.abs(Math.sin(t * 9 + i)) * 0.3), w.s); o3.updateMatrix(); owls.setMatrixAt(i, o3.matrix); }); owls.instanceMatrix.needsUpdate = true; }
    const p = ctx.player.pos, [u, v] = toLocal(p.x, p.z);
    if (Math.hypot(u - OWLERY.u, v - OWLERY.v) < OWLERY.r + 3 && Math.abs(p.y - Y) < 2) ctx.offer('🦉 Gửi thư cú', () => {
      if (t - mailT < 8) return; mailT = t; ctx.sfx && ctx.sfx('magic');
      ctx.toast('🦉 Một chú cú sà xuống nhận thư! 🔬 Cú săn mồi ban đêm nhờ <b>mắt to</b> và <b>tai lệch</b> hai bên (nghe được hướng tiếng động); lông mềm giúp bay <b>không tiếng động</b>.', 7000);
      setTimeout(() => magic.ask('khoahoc', () => { ctx.account && ctx.account.addCoins(2); ctx.toast('🦉 Cú mang về <b>thư khen</b> của thầy cô: +2 🪙', 3500); }, '🦉 Cú đố em trước khi bay'), 7200);
    }, 8);
  }
  return { build, unbuild, update, inN };
}
