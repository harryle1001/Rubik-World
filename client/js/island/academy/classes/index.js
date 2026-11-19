// classes/index.js — LỚP HỌC PHÉP THUẬT của Học viện Pha Lê: 6 mini game 3–5 phút chơi tại chỗ (khung mg/host.js).
//  ✨ Bùa Chú Ánh Sáng (Vật lý: phản xạ, tán sắc, khúc xạ)   · sân giữa, cạnh dãy ngăn tây
//  🧪 Pha Chế (Hoá học an toàn: trộn màu, chất tan, phân số)  · sân Thảo Mộc
//  🔷 Biến Hình (Hình học: khối, đối xứng, chu vi/diện tích)   · sân giữa, cạnh dãy ngăn đông
//  🔭 Thiên Văn (Mặt Trăng theo lịch thật, chòm sao, hành tinh) · đài nổi trên ban công tháp thiên văn
//  🦊 Sinh Vật Phép Thuật (chăm sóc, chuỗi thức ăn)            · sân Luyện Đũa
//  🌱 3 Nhà kính mái vòm (quang hợp, vòng đời cây, thu hoạch nguyên liệu cho Pha Chế) · sân Thảo Mộc
// Mỗi lớp 1 file; file này: đăng ký ctx.miniGames, dựng cửa lớp + nhà kính trong thế giới (gộp Batch → ít draw call).
import * as THREE from 'three';
import { Batch } from '../geo.js';
import { matV } from '../../sample/palette.js';
import { label, PHI } from './common.js';
import { startLight } from './light.js';
import { startBrew } from './brew.js';
import { startShape } from './shape.js';
//import { startAstro } from './astro.js';
//import { startCreature } from './creature.js';
//import { startHerb, domeStatus } from './herb.js';
const startAstro = null, startHerb = null, domeStatus = null;   // (tạm) lớp còn lại thêm ở các commit sau

// lớp: [khoá, tên, tâm phòng (u, v), cửa (u, v, pháp tuyến nu, nv), hàm chơi]
const ROOMS = [
  ['cls-light', '✨ Lớp Bùa Chú Ánh Sáng', [-30, -20], [-30, -31.8, 0, 1], startLight],
  ['cls-shape', '🔷 Lớp Biến Hình', [-30, 20], [-30, 31.8, 0, -1], startShape],
  ['cls-brew', '🧪 Lớp Pha Chế', [-52, 54], [-52, 40.2, 0, 1], startBrew],
  //['cls-creature', '🦊 Lớp Sinh Vật Phép Thuật', [-45, -54], [-45, -40.2, 0, -1], startCreature],
];
export const DOMES = [[14, 50], [14, 71], [14, 92]];   // 3 nhà kính mái vòm r 5 (u, v), cách nhau 21 m
const DOME_R = 5;

export function create(ctx, magic, { toWorld, toLocal, L, Y }) {
  const G = ctx.miniGames = ctx.miniGames || {};
  const yawTo = (dx, dz) => Math.atan2(-dx, -dz);   // xoay root để phía -z cục bộ (bảng đen) nhìn theo (dx, dz)
  for (const [key, name, [u, v], [du, dv], fn] of ROOMS) {
    const [x, z] = toWorld(u, v), [wx, wz] = toWorld(du, dv), d = Math.hypot(wx - x, wz - z);
    G[key] = { name, group: 'academy', radius: 8, spot: () => [x, z, yawTo((wx - x) / d, (wz - z) / d)], start: (c, o) => fn(c || ctx, o) };
  }
  // thiên văn: đài nổi ở mép ban công phía nam tháp thiên văn (−z cục bộ hướng ra ngoài tháp)
  const A = L.astro;
  if (startAstro) { const [x, z] = toWorld(A.u + A.deck - 0.6, A.v), [cx, cz] = toWorld(A.u, A.v), d = Math.hypot(x - cx, z - cz);
    G['cls-astro'] = { name: '🔭 Lớp Thiên Văn trên tháp', group: 'academy', radius: 5, spot: () => [x, z, yawTo((x - cx) / d, (z - cz) / d)], start: (c, o) => startAstro(c || ctx, o) }; }
  if (startHerb) G['cls-herb'] = { name: '🌱 Nhà kính Thảo Dược', group: 'academy', radius: DOME_R,
    spot: (c, door) => { const [u, v] = DOMES[(door && door.dome) || 0], [x, z] = toWorld(u, v), [x2, z2] = toWorld(u - 1, v); return [x, z, yawTo(x2 - x, z2 - z)]; },
    start: (c, o) => startHerb(c || ctx, { ...o, world: built }) };

  // ---------- cửa lớp + nhà kính trong thế giới ----------
  let built = null;
  const W = (u, v, y = Y) => { const [x, z] = toWorld(u, v); return new THREE.Vector3(x, y, z); };
  function build() {
    const g = new THREE.Group(); g.name = 'academy-classes'; ctx.scene.add(g);
    const b = new Batch(), glass = new Batch(), doors = [];
    const addDoor = (u, v, nu, nv, text, start) => {
      const [x, z] = toWorld(u, v), [x2, z2] = toWorld(u + nu, v + nv), o = new THREE.Object3D();
      o.position.set(x, Y, z); o.rotation.y = Math.atan2(x2 - x, z2 - z); o.updateMatrix();   // mặt trước cửa (+z cục bộ) nhìn ra sân
      const put = (geo, col) => { geo.applyMatrix4(o.matrix); b.add(geo, col); };
      put(new THREE.BoxGeometry(2.6, 4.2, 0.2).translate(0, 2.1, 0.12), '#4a3424');
      put(new THREE.ConeGeometry(1.84, 1.3, 4).rotateY(Math.PI / 4).scale(1, 1, 0.11).translate(0, 4.85, 0.12), '#4a3424');
      for (const sx of [-1.38, 1.38]) put(new THREE.BoxGeometry(0.16, 4.4, 0.26).translate(sx, 2.2, 0.12), '#ffd36e');
      const s = label(text, 4.6); s.position.set(x, Y + 6.2, z); g.add(s);
      const p = W(u + nu * 2, v + nv * 2); doors.push({ p, text, start });
    };
    for (const [key, name, , [du, dv, nu, nv]] of ROOMS) addDoor(du, dv, nu, nv, '🚪 ' + name.replace(/^\P{L}+/u, ''), () => ctx.mg.start(key, { x: 0, z: 0, n: name }));
    if (startAstro) addDoor(A.u + A.r + 0.2, A.v, 1, 0, '🚪 Lớp Thiên Văn (trên tháp)', () => ctx.mg.start('cls-astro', { x: 1, z: 0, n: 'Thiên Văn' }));
    // nhà kính: bệ đá + 8 sườn vòm (cung tròn) + vòm kính bán cầu + cửa; gộp 3 nhà kính vào 2 mesh
    const labels = [];
    if (startHerb) DOMES.forEach(([u, v], i) => {
      const [x, z] = toWorld(u, v);
      b.cyl(x, Y - 0.2, z, DOME_R + 0.3, 0.5, '#b3aca0', 21);
      for (let k = 0; k < 8; k++) b.add(new THREE.TorusGeometry(DOME_R, 0.07, 4, 13, Math.PI), '#e8eef7', x, Y + 0.3, z, k * Math.PI / 8);
      b.add(new THREE.TorusGeometry(DOME_R, 0.09, 4, 21).rotateX(Math.PI / 2), '#e8eef7', x, Y + 0.3 + DOME_R / PHI, z, 0, 0, 0, 1 / PHI * 1.27, 1, 1 / PHI * 1.27);
      glass.add(new THREE.SphereGeometry(DOME_R, 21, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#bfe6ff', x, Y + 0.3, z);
      const s = label(`🌱 Nhà kính ${i + 1}`, 4.2, '#c8f5b0'); s.position.set(x, Y + DOME_R + 1.6, z); g.add(s); labels.push(s);
      doors.push({ p: W(u + DOME_R + 1.2, v), text: `🌱 Vào Nhà kính ${i + 1}`, start: () => ctx.mg.start('cls-herb', { x: x + 1, z, n: 'Nhà kính ' + (i + 1), dome: i }), dome: i });
    });
    const m1 = new THREE.Mesh(b.build(), matV()); m1.castShadow = m1.receiveShadow = true;
    const m2 = new THREE.Mesh(glass.build(), new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }));
    g.add(m1, m2);
    let tl = 0;
    built = {
      g, glassMesh: m2,
      update(dt) {
        if ((tl -= dt) < 0) { tl = 5; labels.forEach((s, i) => { const st = domeStatus(i); if (s.userData.t !== st) { s.userData.t = st; const n = label(`🌱 Nhà kính ${i + 1} · ${st}`, 4.2, '#c8f5b0'); s.material.map.dispose(); s.material.map = n.material.map; } }); }
        if (ctx.mgActive || ctx.player.vehicle) return;
        const pp = ctx.player.pos; if (Math.abs(pp.y - Y) > 2) return;
        for (const d of doors) if (Math.hypot(pp.x - d.p.x, pp.z - d.p.z) < 3.4) { ctx.offer(d.text, d.start, 8); break; }
      },
    };
    return built;
  }
  function unbuild() { if (!built) return; ctx.scene.remove(built.g); built.g.traverse(o => { o.geometry && o.geometry.dispose(); if (o.material && o.material.map) o.material.map.dispose(); }); built = null; }
  return { build, unbuild, update(dt) { built && built.update(dt); } };
}
