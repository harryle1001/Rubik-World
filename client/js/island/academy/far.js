// academy/far.js — BÓNG LÂU ĐÀI TRONG SƯƠNG (lớp cảnh xa) + khối lâu đài greybox.
// Thế giới chỉ vẽ tới 296 m (sương đặc). Để thấy lâu đài từ ~1 km mà không tăng tầm nhìn cả game:
// một mesh bóng (~3 k tam giác, 1–2 draw call) được "kéo" về cách camera 233 m (Fibonacci, trong mặt cắt xa 296 m) và
// thu nhỏ đúng tỷ lệ khoảng cách (cùng góc nhìn, cùng hình chiếu) → nhìn y như vật thật ở xa.
// Màu = màu sương pha tối, càng xa càng nhạt (phối cảnh không khí); lại gần 377 → 296 m thì tan vào sương, khối thật hiện ra.
import * as THREE from 'three';
import { Batch } from './geo.js';
import { TOWERS, WINGS, BASE_Y, C, ROT, PLAT, heightLocal, toWorld, ISLE } from './plan.js';

const NEAR = 296, PULL = 233, FAR = 1597;   // camera.far = 296 (sương đặc) → kéo bóng về 233 m (Fibonacci) cho chắc nằm trong
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** khối lâu đài greybox theo plan.js (toạ độ cục bộ: x = v, z = u) */
export function castleMassing(seg = 8) {
  const b = new Batch(), Y = BASE_Y;
  b.box(-PLAT.hv + 8, PLAT.hv - 8, Y - 2, Y + 0.2, PLAT.u - PLAT.hu + 8, PLAT.u + PLAT.hu - 8, '#9a958c');   // nền đá cao nguyên
  for (const [u0, u1, v0, v1, h, rh] of WINGS) { b.box(v0, v1, Y, Y + h, u0, u1, '#a9a49c'); b.gable(v0 - 0.6, v1 + 0.6, u0 - 0.6, u1 + 0.6, Y + h, rh, '#4d5560'); }
  for (const [u, v, r, h, rh] of TOWERS) { b.cyl(v, Y, u, r, h, '#b3aea6', seg); b.cone(v, Y + h, u, r * 1.236, rh, '#465060', seg); }
  return b.build();
}

/** gò đảo thô (lưới 21 m) cho bóng xa */
function moundGeo() {
  const st = 21, U0 = ISLE.u - ISLE.hu - 21, U1 = ISLE.u + ISLE.hu + 21, V = ISLE.hv + 21, nu = Math.ceil((U1 - U0) / st), nv = Math.ceil(2 * V / st);
  const pos = [], idx = [];
  for (let j = 0; j <= nu; j++) for (let i = 0; i <= nv; i++) {
    const u = U0 + j * st, v = -V + i * st, [x, z] = toWorld(u, v);
    pos.push(v, Math.max(-2, heightLocal(u, v, x, z)), u);
  }
  const w = nv + 1;
  for (let j = 0; j < nu; j++) for (let i = 0; i < nv; i++) { const a = j * w + i, bb = a + w, c = a + 1, d = bb + 1; idx.push(a, bb, c, c, bb, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const ng = g.toNonIndexed(); ng.computeVertexNormals(); ng.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(ng.attributes.position.count * 3).fill(0.82), 3));
  return ng;
}

// tô sáng/tối theo hướng mặt (nắng chiều từ tây nam) → bóng có khối, không phẳng như giấy
function shadeByNormal(g) {
  const n = g.attributes.normal, c = g.attributes.color, L = new THREE.Vector3(-0.5, 0.62, 0.6).normalize();
  for (let i = 0; i < n.count; i++) { const k = 0.78 + 0.22 * Math.max(0, n.getX(i) * L.x + n.getY(i) * L.y + n.getZ(i) * L.z); c.setXYZ(i, k, k, k); }
  return g;
}

export function createFar(ctx) {
  const { scene, camera } = ctx;
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false });
  const castle = new THREE.Mesh(shadeByNormal(castleMassing(6)), mat), mound = new THREE.Mesh(shadeByNormal(moundGeo()), mat);
  const g = new THREE.Group(); g.add(castle, mound); g.rotation.y = ROT; g.name = 'academy-far';
  for (const m of [castle, mound]) { m.frustumCulled = false; m.matrixAutoUpdate = false; m.updateMatrix(); }
  scene.add(g);
  const C3 = new THREE.Vector3(C[0], 0, C[1]), d3 = new THREE.Vector3(), sil = new THREE.Color(), slate = new THREE.Color('#3e4656');
  const self = { group: g, dist: 1e9, moundOn: true };
  self.update = () => {
    const cam = camera.position, fog = scene.fog;
    d3.subVectors(C3, cam); const d = Math.hypot(d3.x, d3.z); self.dist = d;
    if (d < NEAR || !fog) { g.visible = false; return; }
    g.visible = true; mound.visible = self.moundOn;
    const s = Math.min(1, PULL / d); g.position.copy(cam).addScaledVector(d3, s); g.scale.setScalar(s);
    // phối cảnh không khí: 296 m tan hẳn vào sương → 377 m rõ nhất → xa dần nhạt lại (tối đa 1/φ)
    const k = 1 - (1 - (0.38 + 0.24 * smooth(377, FAR, d))) * smooth(NEAR, 377, d);
    sil.copy(fog.color).multiplyScalar(0.56).lerp(slate, 0.38); mat.color.copy(sil).lerp(fog.color, k);
  };
  return self;
}
