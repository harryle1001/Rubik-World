// academy/atmos.js — "PHÉP THUẬT KHẮP NƠI": đom đóm/hạt sáng lơ lửng, sương trôi quanh chân vách và mặt hồ, cú bay quanh tháp,
// tia nắng xuyên mây ban ngày. Mỗi loại 1 draw call; toạ độ cục bộ của đảo (x = v, z = u). Gắn vào nhóm đảo → tải/dỡ cùng đảo.
import * as THREE from 'three';
import { CFG } from '../config.js';
import { PLAT } from './plan.js';
import { L } from './castle.js';

const Y = PLAT.y;
const soft = (inner = '#ffffff') => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, inner); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); };

export function createAtmos(ctx, group) {
  const night = () => (ctx.sky && ctx.sky.state ? ctx.sky.state.night || 0 : 0);
  let s = 34; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  // ---------- đom đóm / hạt sáng ----------
  const NF = CFG.isMobile ? 89 : 144, fp = new Float32Array(NF * 3), seed = [];
  for (let i = 0; i < NF; i++) {
    const inLake = i % 3 === 0;
    const u = inLake ? PLAT.u + (r() * 2 - 1) * (PLAT.hu + 34) : L.box.u0 + r() * (L.box.u1 - L.box.u0), v = inLake ? (r() * 2 - 1) * (PLAT.hv + 34) : (r() * 2 - 1) * L.box.hv;
    seed.push([v, inLake ? 0.6 + r() * 3 : Y + 0.6 + r() * 7, u, r() * 6.28, 0.3 + r() * 0.6]);
  }
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
  const fmat = new THREE.PointsMaterial({ size: 0.32, map: soft('#fff6c8'), color: '#ffe9a0', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const flies = new THREE.Points(fg, fmat); flies.frustumCulled = false; group.add(flies);
  // ---------- sương trôi: vòng quanh chân vách + mặt hồ ----------
  const NM = 21, mist = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: soft('rgba(240,244,248,1)'), color: '#eef2f5', transparent: true, opacity: 0.34, depthWrite: false, side: THREE.DoubleSide }), NM);
  const ms = Array.from({ length: NM }, (_, i) => ({ a: i / NM * Math.PI * 2, rr: 0.92 + r() * 0.3, y: i % 3 ? 1.6 + r() * 4 : 13 + r() * 13, sz: 34 + r() * 34, sp: (r() - 0.5) * 0.02 }));
  mist.frustumCulled = false; group.add(mist);
  // ---------- cú bay quanh tháp thiên văn ----------
  const wing = new THREE.BufferGeometry(); wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.35, -0.9, 0.05, -0.15, 0, 0, -0.3, 0, 0, 0.35, 0, 0, -0.3, 0.9, 0.05, -0.15], 3)); wing.computeVertexNormals();
  const NO = 5, owls = new THREE.InstancedMesh(wing, new THREE.MeshBasicMaterial({ color: '#3a2e28', side: THREE.DoubleSide }), NO); owls.frustumCulled = false; group.add(owls);
  // ---------- tia nắng xuyên mây (ban ngày) ----------
  const rayTex = (() => { const c = document.createElement('canvas'); c.width = 32; c.height = 128; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,240,200,0)'); gr.addColorStop(0.4, 'rgba(255,240,200,.55)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 128); const h = g.createLinearGradient(0, 0, 32, 0); return new THREE.CanvasTexture(c); })();
  const rays = new THREE.Group(), rmat = new THREE.MeshBasicMaterial({ map: rayTex, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
  for (const [v, u, rot] of [[-40, -10, 0.3], [55, -40, -0.25], [0, 30, 0.1]]) for (const k of [0, Math.PI / 2]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(21, 144), rmat); m.position.set(v, Y + 55, u); m.rotation.set(0, k, rot); rays.add(m); }
  group.add(rays);
  const o = new THREE.Object3D();
  return {
    update(dt, t) {
      const n = night();
      // đom đóm: bay lượn chậm, ban đêm sáng hơn
      for (let i = 0; i < NF; i++) { const [x, y, z, ph, sp] = seed[i]; fp[i * 3] = x + Math.sin(t * sp + ph) * 2.6; fp[i * 3 + 1] = y + Math.sin(t * sp * 1.7 + ph * 2) * 0.8; fp[i * 3 + 2] = z + Math.cos(t * sp * 0.8 + ph) * 2.6; }
      fg.attributes.position.needsUpdate = true; fmat.opacity = 0.35 + 0.65 * n; fmat.size = 0.26 + 0.14 * n;
      // sương: trôi vòng quanh cao nguyên
      ms.forEach((m, i) => { m.a += m.sp * dt; const ru = (PLAT.hu + 21) * m.rr, rv = (PLAT.hv + 21) * m.rr; o.position.set(Math.cos(m.a) * rv, m.y, PLAT.u + Math.sin(m.a) * ru); o.rotation.set(0, m.a * 3, 0); o.scale.set(m.sz, 1, m.sz * 0.618); o.updateMatrix(); mist.setMatrixAt(i, o.matrix); });
      mist.instanceMatrix.needsUpdate = true; mist.material.opacity = 0.26 + 0.14 * n;
      // cú: vòng tròn bán kính 21–34 m quanh tháp 89 m, vỗ cánh (co giãn sải cánh)
      const A = L.astro;
      for (let i = 0; i < NO; i++) { const a = t * (0.21 + i * 0.03) + i * 1.26, R = 21 + i * 3.4; o.position.set(A.v + Math.cos(a) * R, Y + 58 + i * 4 + Math.sin(t + i) * 1.5, A.u + Math.sin(a) * R); o.rotation.set(0, -a, 0.35); o.scale.set(1.6 + Math.sin(t * 7 + i) * 0.5, 1.6, 1.6); o.updateMatrix(); owls.setMatrixAt(i, o.matrix); }
      owls.instanceMatrix.needsUpdate = true;
      rays.visible = n < 0.4; rmat.opacity = 0.16 * (1 - n / 0.4);
    },
  };
}
