// train/consist.js — ĐOÀN TÀU PHA LÊ (greybox): đầu máy + toa than + 4 toa khách. Mỗi toa 1 mesh gộp (tô màu đỉnh).
// Đặt toa theo tuyến bằng 2 giá chuyển hướng (trước/sau) → toa ôm đúng đường cong và dốc.
import * as THREE from 'three';
import { Batch } from '../academy/geo.js';
import { matV, mat } from '../sample/palette.js';
import { at, LEN } from './route.js';

// chiều dài thân (m) — đầu máy 10,5 · toa than 5 · toa khách 8 (Fibonacci) · khoảng nối 0,8
export const CARS = [{ kind: 'loco', len: 10.5 }, { kind: 'tender', len: 5 }, ...[0, 1, 2, 3].map(i => ({ kind: 'coach', len: 8, i }))];
export const GAP = 0.8, FLOOR = 1.1, WIDTH = 2.6;
let off = 0; for (const c of CARS) { c.off = off + c.len / 2; off += c.len + GAP; }   // c.off: tâm toa cách đầu tàu (m)
export const TRAIN_LEN = off - GAP;

function locoGeo() {
  const b = new Batch(), G = '#2f5a46', K = '#2a2630', B = '#d4a24a';
  b.box(-1.3, 1.3, 0.6, 1.1, -5.25, 5.25, K);                 // khung gầm
  b.add(new THREE.CylinderGeometry(0.95, 0.95, 6.4, 12), G, 0, 2.05, 1.4, 0, Math.PI / 2);   // nồi hơi
  b.cyl(0, 2.9, 4.0, 0.32, 1.4, K, 8); b.cyl(0, 4.2, 4.0, 0.42, 0.25, B, 8);                       // ống khói + vành đồng
  b.box(-1.3, 1.3, 1.1, 3.6, -5.2, -2.2, G); b.box(-1.45, 1.45, 3.6, 3.85, -5.4, -2.0, K);            // buồng lái + mái
  b.add(new THREE.OctahedronGeometry(0.34), '#9fe8ff', 0, 2.05, 4.7);                                // pha lê đầu tàu
  return b.build();
}
function tenderGeo() { const b = new Batch(); b.box(-1.3, 1.3, 0.6, 1.1, -2.5, 2.5, '#2a2630'); b.box(-1.25, 1.25, 1.1, 2.9, -2.4, 2.4, '#2f5a46'); b.box(-1.0, 1.0, 2.9, 3.3, -2.0, 2.0, '#2a2630'); return b.build(); }
function coachGeo() { const b = new Batch(); b.box(-1.3, 1.3, 0.6, FLOOR, -4, 4, '#2a2630'); b.box(-1.3, 1.3, FLOOR, 3.4, -4, 4, '#8a5a3a'); b.box(-1.4, 1.4, 3.4, 3.7, -4.1, 4.1, '#6e4a30'); return b.build(); }
function coachGlow() { const b = new Batch(); for (const sd of [-1, 1]) for (let k = 0; k < 5; k++) b.box(sd * 1.31 - 0.01, sd * 1.31 + 0.01, 1.9, 2.95, -3.2 + k * 1.6 - 0.45, -3.2 + k * 1.6 + 0.45, '#ffe3a0'); return b.build(); }

export function createConsist(ctx) {
  const group = new THREE.Group(); group.name = 'train-consist';
  const geo = { loco: locoGeo(), tender: tenderGeo(), coach: coachGeo() }, gl = coachGlow(), mv = matV(), mg = mat('lampGlow');
  const cars = CARS.map(c => {
    const o = new THREE.Group(); const m = new THREE.Mesh(geo[c.kind], mv); m.castShadow = true; m.receiveShadow = true; o.add(m);
    if (c.kind === 'coach') o.add(new THREE.Mesh(gl, mg));
    group.add(o); return { ...c, o };
  });
  ctx.scene.add(group);
  const pF = {}, pR = {};
  // sHead: vị trí đầu tàu trên tuyến; dir: +1 chạy về phía s tăng (đi Học viện), −1 về đảo chính
  function place(sHead, dir, t = 0) {
    for (const c of cars) {
      const sc = sHead - dir * c.off, h = c.len * 0.32;
      at(Math.min(LEN, Math.max(0, sc + dir * h)), pF); at(Math.min(LEN, Math.max(0, sc - dir * h)), pR);
      const dx = pF.x - pR.x, dz = pF.z - pR.z, dy = pF.y - pR.y, l = Math.hypot(dx, dz) || 1;
      c.o.position.set((pF.x + pR.x) / 2, (pF.y + pR.y) / 2, (pF.z + pR.z) / 2);
      c.o.rotation.set(-Math.atan2(dy, l), Math.atan2(dx, dz), 0, 'YXZ');
      c.s = sc;
    }
  }
  return { group, cars, place };
}
