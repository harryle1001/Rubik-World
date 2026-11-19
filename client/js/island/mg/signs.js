// mg/signs.js — BIỂN GỖ "🎮 tên game" cạnh cửa mỗi mini game 3D trong thế giới mở + nút ✋ khi lại gần + chấm 🎮 trên bản đồ M (ctx.mgSigns).
// Mọi biển gộp thành 2 lần vẽ: 1 khối gỗ (màu theo đỉnh) + 1 tấm chữ dùng chung 1 texture atlas 1024² (ô 512 × 64, tối đa 32 biển).
// Biển đặt lệch khỏi cửa theo pháp tuyến mặt tường gần nhất (không chắn lối vào), mặt chữ quay ra đường.
// φ: biển rộng 3,2 m, cao chữ 0,5 m, cột 2,1 m (≈ 1,3 φ), lệch cửa 1,618 m.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PHI, TOWN_Y } from '../layout.js';
import { gradientMap } from '../style.js';

export function createSigns(ctx, host) {
  const G = ctx.miniGames, seen = new Set(), list = [];
  for (const k of Object.keys(G)) { const g = G[k]; if (g.group === 'academy' || seen.has(g)) continue; const q = host.doorOf(k); if (!q) continue; seen.add(g); list.push({ k, q, n: (g.name || k).replace(/^\P{L}+/u, '').trim() }); if (list.length >= 32) break; }
  if (!list.length) return null;
  // ---------- atlas chữ ----------
  const cv = document.createElement('canvas'); cv.width = cv.height = 1024; const c = cv.getContext('2d');
  c.textAlign = 'center'; c.textBaseline = 'middle';
  list.forEach((s, i) => { const x = (i % 2) * 512, y = Math.floor(i / 2) * 64; c.fillStyle = '#5a3a1e'; c.fillRect(x, y, 512, 64); c.fillStyle = '#ffe9b8'; c.font = 'bold 36px system-ui'; c.fillText('🎮 ' + s.n, x + 256, y + 33, 492); });
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  // ---------- đặt biển ----------
  const wood = [], text = [], col = new THREE.Color(), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  const paint = (g, hex) => { col.set(hex); const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) col.toArray(a, i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
  list.forEach((s, i) => {
    const { x, z } = s.q; let nx = 0, nz = 1, bd = 1e9;   // pháp tuyến ra ngoài của nhà gần nhất
    for (const b of ctx.boxes || []) { const dx = Math.max(b.x0 - x, 0, x - b.x1), dz = Math.max(b.z0 - z, 0, z - b.z1), d = dx * dx + dz * dz; if (d < bd && d < 25) { bd = d;
      const e = [[x - b.x0, -1, 0], [b.x1 - x, 1, 0], [z - b.z0, 0, -1], [b.z1 - z, 0, 1]].sort((p, q) => Math.abs(p[0]) - Math.abs(q[0]))[0]; nx = e[1]; nz = e[2]; } }
    const tx = -nz, tz = nx, sx = x + nx * PHI + tx * 2.2, sz = z + nz * PHI + tz * 2.2, y = Math.max(TOWN_Y, ctx.terrain.heightAt(sx, sz)), yaw = Math.atan2(nx, nz);
    s.x = sx; s.z = sz; s.y = y; s.nx = nx; s.nz = nz;
    m4.compose(new THREE.Vector3(sx, y, sz), q4.setFromAxisAngle(up, yaw), new THREE.Vector3(1, 1, 1));
    for (const px of [-1.45, 1.45]) wood.push(paint(new THREE.BoxGeometry(0.13, 2.1, 0.13).translate(px, 1.05, 0), '#6b4a2b').applyMatrix4(m4));
    wood.push(paint(new THREE.BoxGeometry(3.2, 0.62, 0.09).translate(0, 1.82, 0), '#8a5a34').applyMatrix4(m4));
    const u0 = (i % 2) / 2, v1 = 1 - Math.floor(i / 2) / 16, v0 = v1 - 1 / 16, p = new THREE.PlaneGeometry(3.04, 0.38).translate(0, 1.82, 0.05), uv = p.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) * 0.5, v0 + uv.getY(k) / 16);
    text.push(p.applyMatrix4(m4));
    ctx.colliders && ctx.colliders.push({ x: sx, z: sz, r: 0.3 });
  });
  const W = new THREE.Mesh(mergeGeometries(wood.map(g => g.index ? g.toNonIndexed() : g)), new THREE.MeshToonMaterial({ vertexColors: true, gradientMap }));
  const T = new THREE.Mesh(mergeGeometries(text), new THREE.MeshBasicMaterial({ map: tex }));
  W.castShadow = true; W.name = T.name = 'mg-signs'; ctx.scene.add(W, T);
  ctx.mgSigns = list;
  let t = 0, near = null;
  return {
    update(dt) {   // lại gần biển (≤ 2,6 m) → nút ✋ Chơi
      W.visible = T.visible = !ctx.mgActive; if (ctx.mgActive) return;
      if ((t -= dt) <= 0) { t = 0.2; near = null; const p = ctx.player.pos; for (const s of list) if (Math.abs(s.x - p.x) + Math.abs(s.z - p.z) < 2.6 && Math.abs(s.y - p.y) < 3) { near = s; break; } }
      if (near && ctx.offer) ctx.offer('✋ Chơi ' + near.n, () => ctx.school.enter(near.q), 3);   // offer phải gọi mỗi khung
    },
  };
}
