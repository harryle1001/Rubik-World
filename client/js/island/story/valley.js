// story/valley.js — THUNG LŨNG RỒNG (greybox, chương 6): vòng 8 trụ đá cao theo Fibonacci, tổ rồng, Rồng Mây cuộn tròn ngủ trên đồi.
// Rồng dựng bằng khối cơ bản (cầu, nón, hộp, tam giác cánh) gộp 1 hình học tô màu đỉnh → 1 draw call; đá 1 draw call.
// Rồng thở chậm (co giãn) khi ngủ, ngẩng đầu khi thức (chương 6 trở đi). Chỉ hiện khi cách < 233 m.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const paint = (g, col) => { if (g.index) g = g.toNonIndexed(); g.deleteAttribute('uv'); const c = new THREE.Color(col), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) c.toArray(a, i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
const at = (g, x, y, z, ry = 0, rx = 0, rz = 0) => { g.rotateX(rx); g.rotateZ(rz); g.rotateY(ry); g.translate(x, y, z); return g; };

export function createValley(ctx, C) {
  const { scene, terrain } = ctx, root = new THREE.Group(); root.visible = false; scene.add(root);
  const y0 = terrain.heightAt(C[0], C[1]); root.position.set(C[0], y0, C[1]);
  // đá: 8 trụ quanh tâm r 13, cao 2 · 3 · 5 · 8 · 5 · 3 · 2 · 3 (Fibonacci), mặt cắt 6 cạnh
  const H = [2, 3, 5, 8, 5, 3, 2, 3], rocks = [];
  H.forEach((h, i) => { const a = i * Math.PI / 4 + 0.3, x = Math.cos(a) * 13, z = Math.sin(a) * 13; rocks.push(paint(at(new THREE.CylinderGeometry(0.6, 1.1, h, 6), x, terrain.heightAt(C[0] + x, C[1] + z) - y0 + h / 2 - 0.2, z, a), i % 2 ? '#8d8478' : '#a39886')); ctx.colliders.push({ x: C[0] + x, z: C[1] + z, r: 1.1 }); });
  rocks.push(paint(at(new THREE.TorusGeometry(2.1, 0.55, 6, 13), 0, 0.3, 0, 0, Math.PI / 2), '#7d6a52'));   // tổ rồng
  const rockMesh = new THREE.Mesh(mergeGeometries(rocks), new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })); root.add(rockMesh);
  // rồng: thân 8 khúc cầu theo đường xoắn (bán kính giảm dần 1/φ^(k/8)), đầu + mõm + sừng + râu, 2 cánh, vây lưng
  const dragon = new THREE.Group(); dragon.position.set(-5, 0, 3); root.add(dragon);
  const body = [], head = [], BODY = '#e8584a', BELLY = '#ffd36e';
  for (let k = 0; k < 8; k++) {
    const a = k * 0.78, r = 2.6 - k * 0.12, s = 1.1 * Math.pow(0.618, k / 8);
    body.push(paint(at(new THREE.SphereGeometry(s, 8, 6), Math.cos(a) * r, s * 0.9, Math.sin(a) * r), k % 2 ? BODY : '#f06a50'));
    body.push(paint(at(new THREE.ConeGeometry(0.21 * s, 0.6 * s, 4), Math.cos(a) * r, s * 1.85, Math.sin(a) * r), BELLY));   // vây lưng
  }
  body.push(paint(at(new THREE.ConeGeometry(0.34, 1.4, 5), Math.cos(6.4) * 1.6, 0.4, Math.sin(6.4) * 1.6, 0, 0, Math.PI / 2), BELLY));   // đuôi
  const wing = () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 2.6, 0.8, -0.6, 1.6, 0, 1.0, 0, 0, 0, 1.6, 0, 1.0, 2.6, 0.8, -0.6], 3)); g.computeVertexNormals(); return g; };
  body.push(paint(at(wing(), 0.6, 1.6, 0.2, 0.4), '#ffb05a'), paint(at(wing(), -0.6, 1.6, 0.2, Math.PI - 0.4), '#ffb05a'));
  head.push(paint(new THREE.BoxGeometry(1.2, 0.9, 1.1), BODY), paint(at(new THREE.BoxGeometry(0.8, 0.55, 0.8), 0, -0.1, 0.85), BELLY));
  head.push(paint(at(new THREE.ConeGeometry(0.13, 0.7, 5), -0.36, 0.7, -0.2, 0, -0.4), BELLY), paint(at(new THREE.ConeGeometry(0.13, 0.7, 5), 0.36, 0.7, -0.2, 0, -0.4), BELLY));
  head.push(paint(at(new THREE.SphereGeometry(0.11, 6, 4), -0.32, 0.18, 0.56), '#2a1d3c'), paint(at(new THREE.SphereGeometry(0.11, 6, 4), 0.32, 0.18, 0.56), '#2a1d3c'));
  head.push(paint(at(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 4), -0.45, -0.15, 1.3, 0, 1.2), '#ffe9a8'), paint(at(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 4), 0.45, -0.15, 1.3, 0, 1.2), '#ffe9a8'));   // râu rồng
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const bodyM = new THREE.Mesh(mergeGeometries(body), mat), headM = new THREE.Mesh(mergeGeometries(head), mat);
  headM.position.set(2.6, 1.0, 0.3); dragon.add(bodyM, headM); ctx.colliders.push({ x: C[0] - 5, z: C[1] + 3, r: 3.4 });
  // 💤 khi ngủ
  const zc = document.createElement('canvas'); zc.width = zc.height = 64; const zg = zc.getContext('2d'); zg.font = '48px system-ui'; zg.textAlign = 'center'; zg.fillText('💤', 32, 48);
  const zz = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(zc), depthWrite: false })); zz.scale.set(1.3, 1.3, 1); dragon.add(zz);
  let t = 0, lift = 0;
  return {
    root, dragon,
    update(dt, awake) {
      const p = ctx.player.pos, near = Math.hypot(p.x - C[0], p.z - C[1]) < 233 || (ctx.camera.position.distanceTo(root.position) < 233);
      root.visible = near; if (!near) return; t += dt;
      lift += ((awake ? 1 : 0) - lift) * Math.min(1, dt * 1.618);
      bodyM.scale.y = 1 + Math.sin(t * 1.3) * 0.04 * (1 - lift);
      headM.position.y = 1.0 + lift * 1.6 + Math.sin(t * 1.3) * 0.05; headM.rotation.x = -0.3 * (1 - lift) + Math.sin(t) * 0.05 * lift;
      zz.visible = !awake; zz.position.set(3.2, 2.2 + (t % 2) * 0.4, 0.3); zz.material.opacity = 1 - (t % 2) / 2;
    },
  };
}
