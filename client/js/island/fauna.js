// fauna.js — Sinh vật nhỏ theo đàn, vẽ bằng InstancedMesh (mỗi loài chỉ vài lần vẽ, rất nhẹ cho điện thoại):
//   - Hải âu: bay vòng trên cao theo đàn, vỗ cánh rồi lượn.
//   - Chim sẻ: nhảy lò cò mổ thóc dưới đất; người chơi lại gần (< 5 m) → cả đàn bay tán loạn rồi đáp lại chỗ khác.
//   - Bướm: bay chập chờn quanh hoa / bãi cỏ.
//   - Cá: thỉnh thoảng nhảy lên khỏi mặt nước gần bờ.
// Chỉ cập nhật đàn trong ACTIVE mét quanh người chơi; đàn xa bị ẩn. Hình khối tự dựng (không cần file model).
import * as THREE from 'three';
import { toon } from './style.js';
import { CFG } from './config.js';
import { LAND, TEMPLE_C } from './layout.js';

const ACTIVE = 70;
export const FAUNA_INFO = {
  gull: { id: 'gull', name: 'Hải âu', fact: 'Hải âu uống được nước biển: tuyến muối trên mắt giúp chúng thải muối ra ngoài.' },
  sparrow: { id: 'sparrow', name: 'Chim sẻ', fact: 'Chim sẻ "tắm" bằng cát bụi để làm sạch lông và đuổi bọ.' },
  butterfly: { id: 'butterfly', name: 'Bướm', fact: 'Bướm nếm vị bằng chân: đậu lên hoa là biết hoa có mật hay không.' },
  fish: { id: 'fish', name: 'Cá', fact: 'Cá thở bằng mang: mang lấy khí ô-xi hoà tan trong nước.' },
};

// Hình khối: thân + 2 cánh riêng (cánh xoay quanh trục dọc thân để vỗ)
function birdGeos(len, span, wingW) {
  const body = new THREE.ConeGeometry(len * 0.18, len, 5).rotateX(Math.PI / 2);                    // mũi hướng +z
  const wing = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, wingW * 0.5), new THREE.Vector3(span, 0, 0), new THREE.Vector3(0, 0, -wingW * 0.5)]);
  wing.setIndex([0, 1, 2, 2, 1, 0]); wing.computeVertexNormals();
  const wingL = wing.clone().scale(-1, 1, 1); return { body, wingR: wing, wingL };
}

export function createFauna(ctx) {
  const { scene, terrain } = ctx, mob = CFG.isMobile, o = new THREE.Object3D(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const groups = [], kinds = {};
  const rand = (a, b) => a + Math.random() * (b - a);
  const landPt = (cond, tries = 80) => { for (let k = 0; k < tries; k++) { const r = LAND[(Math.random() * LAND.length) | 0], useIsland = Math.random() < 0.4; const x = useIsland ? TEMPLE_C[0] + rand(-60, 60) : rand(r[0], r[2]), z = useIsland ? TEMPLE_C[1] + rand(-60, 60) : rand(r[1], r[3]); if (cond(terrain.heightAt(x, z), x, z)) return [x, z]; } return null; };

  function kind(key, parts, n) { // parts: [[geo, color], …] → mỗi phần 1 InstancedMesh
    const meshes = parts.map(([geo, col]) => { const m = new THREE.InstancedMesh(geo, toon(col, { side: THREE.DoubleSide }), n); m.castShadow = key !== 'butterfly'; m.frustumCulled = false; for (let i = 0; i < n; i++) m.setMatrixAt(i, zero); scene.add(m); return m; });
    return (kinds[key] = { meshes, n, used: 0 });
  }
  const put = (K, i, x, y, z, yaw, roll = 0, flap = 0, s = 1) => { // thân + 2 cánh (flap: góc cánh)
    o.position.set(x, y, z); o.rotation.set(0, yaw, roll); o.scale.setScalar(s); o.updateMatrix(); K.meshes[0].setMatrixAt(i, o.matrix);
    if (K.meshes.length > 1) { o.rotation.set(0, yaw, roll + flap, 'YXZ'); o.updateMatrix(); K.meshes[1].setMatrixAt(i, o.matrix); o.rotation.set(0, yaw, roll - flap, 'YXZ'); o.updateMatrix(); K.meshes[2].setMatrixAt(i, o.matrix); }
  };
  const hide = (K, i) => K.meshes.forEach(m => m.setMatrixAt(i, zero));

  // ---------- Hải âu ----------
  { const G = birdGeos(0.5, 0.75, 0.32), n = mob ? 12 : 20, K = kind('gull', [[G.body, '#f4f4f0'], [G.wingR, '#c9ced6'], [G.wingL, '#c9ced6']], n);
    for (let gi = 0; gi < n / 4; gi++) { const c = landPt(h => h < -1) || [rand(-150, 250), rand(-150, 150)]; groups.push({ type: 'gull', K, cx: c[0], cz: c[1], members: Array.from({ length: 4 }, (_, k) => ({ i: K.used++, a: Math.random() * 6.28, r: rand(6, 14), h: rand(12, 20), sp: rand(0.25, 0.4) * (k % 2 ? 1 : -1), ph: Math.random() * 6 })), drift: Math.random() * 6.28 }); } }
  // ---------- Chim sẻ ----------
  { const G = birdGeos(0.16, 0.16, 0.1), n = mob ? 24 : 36, K = kind('sparrow', [[G.body, '#8a5a34'], [G.wingR, '#6b4a2b'], [G.wingL, '#6b4a2b']], n);
    for (let gi = 0; gi < n / 6; gi++) { const c = landPt(h => h > 0.9 && h < 4); if (!c) continue; groups.push({ type: 'sparrow', K, cx: c[0], cz: c[1], state: 'ground', t: 0, members: Array.from({ length: 6 }, () => ({ i: K.used++, x: c[0] + rand(-2, 2), z: c[1] + rand(-2, 2), y: 0, vy: 0, yaw: Math.random() * 6.28, hop: Math.random() * 2, fx: 0, fz: 0 })) }); } }
  // ---------- Bướm ----------
  { const wing = new THREE.CircleGeometry(0.09, 5).translate(0.09, 0, 0).rotateX(-Math.PI / 2), body = new THREE.CylinderGeometry(0.012, 0.012, 0.12, 3).rotateX(Math.PI / 2), n = mob ? 18 : 30;
    const cols = ['#ffd23f', '#ff8a2b', '#7fd1ff', '#ff6fae', '#ffffff'], K = kind('butterfly', [[body, '#2a2a38'], [wing, '#ffd23f'], [wing.clone().scale(-1, 1, 1), '#ffd23f']], n);
    const colAttr = new Float32Array(n * 3), c = new THREE.Color(); for (let i = 0; i < n; i++) { c.set(cols[i % cols.length]); colAttr.set([c.r, c.g, c.b], i * 3); }
    for (const m of K.meshes.slice(1)) m.instanceColor = new THREE.InstancedBufferAttribute(colAttr, 3), m.material = toon('#ffffff', { side: THREE.DoubleSide });
    for (let gi = 0; gi < n / 3; gi++) { const p = landPt(h => h > 1.4 && h < 6); if (!p) continue; groups.push({ type: 'butterfly', K, cx: p[0], cz: p[1], members: Array.from({ length: 3 }, () => ({ i: K.used++, ph: Math.random() * 100, r: rand(0.8, 2.2), sp: rand(0.5, 0.9) })) }); } }
  // ---------- Cá nhảy ----------
  { const body = new THREE.ConeGeometry(0.09, 0.42, 5).rotateX(Math.PI / 2).scale(0.6, 1, 1), tail = new THREE.ConeGeometry(0.08, 0.14, 3).rotateX(Math.PI / 2).translate(0, 0, -0.26).scale(0.2, 1, 1), n = mob ? 6 : 10;
    const K = kind('fish', [[body, '#5aa8d8'], [tail, '#3a7fb8'], [tail, '#3a7fb8']], n);
    for (let gi = 0; gi < n; gi++) { const p = landPt(h => h < -0.6 && h > -4, 200); if (!p) continue; groups.push({ type: 'fish', K, cx: p[0], cz: p[1], members: [{ i: K.used++, t: -rand(0, 6), yaw: Math.random() * 6.28 }] }); } }

  const v = new THREE.Vector3();
  function update(dt, time) {
    const p = ctx.player.pos, dirty = new Set();
    for (const g of groups) {
      const far = Math.hypot(g.cx - p.x, g.cz - p.z) > ACTIVE + (g.type === 'gull' ? 40 : 0);
      if (far) { if (!g.hidden) { g.members.forEach(m => hide(g.K, m.i)); g.hidden = true; dirty.add(g.K); } continue; }
      g.hidden = false; dirty.add(g.K);
      if (g.type === 'gull') {
        g.drift += dt * 0.05; g.cx += Math.cos(g.drift) * dt * 1.2; g.cz += Math.sin(g.drift) * dt * 1.2;
        for (const m of g.members) {
          m.a += m.sp * dt; const x = g.cx + Math.cos(m.a) * m.r, z = g.cz + Math.sin(m.a) * m.r, y = m.h + Math.sin(time * 0.7 + m.ph) * 1.2;
          const yaw = Math.atan2(-Math.sin(m.a) * Math.sign(m.sp), Math.cos(m.a) * Math.sign(m.sp)) , glide = Math.sin(time * 0.4 + m.ph) > 0.2; // lượn ~nửa thời gian
          put(g.K, m.i, x, y, z, yaw, -0.35 * Math.sign(m.sp), glide ? 0.08 : Math.sin(time * 9 + m.ph) * 0.6);
        }
      } else if (g.type === 'sparrow') {
        const d = Math.hypot(g.cx - p.x, g.cz - p.z);
        if (g.state === 'ground' && d < 5) { // giật mình bay tán loạn
          g.state = 'fly'; g.t = rand(2.5, 4); const a = Math.atan2(g.cz - p.z, g.cx - p.x); const nc = landPt(h => h > 0.9 && h < 4) || [g.cx, g.cz];
          const tx = g.cx + Math.cos(a) * 14, tz = g.cz + Math.sin(a) * 14; g.cx = Math.hypot(nc[0] - g.cx, nc[1] - g.cz) < 40 ? nc[0] : tx; g.cz = Math.hypot(nc[0] - g.cx, nc[1] - g.cz) < 40 ? nc[1] : tz;
          for (const m of g.members) { m.fx = g.cx + rand(-2, 2); m.fz = g.cz + rand(-2, 2); m.vy = rand(4, 6); }
        }
        for (const m of g.members) {
          const gy = terrain.heightAt(m.x, m.z);
          if (g.state === 'fly') { // bay vòng cung tới chỗ mới
            const dx = m.fx - m.x, dz = m.fz - m.z, L = Math.hypot(dx, dz); m.yaw = Math.atan2(dx, dz);
            if (L > 0.3) { const st = Math.min(L, 7 * dt); m.x += dx / L * st; m.z += dz / L * st; }
            m.y = Math.max(0, m.y + m.vy * dt); m.vy -= 3.2 * dt; if (L < 0.5 && m.vy < 0 && m.y <= 0.02) m.y = 0;
            put(g.K, m.i, m.x, gy + m.y + 0.08, m.z, m.yaw, 0, Math.sin(time * 28 + m.i) * 0.9);
          } else { // nhảy lò cò, mổ thóc
            m.hop -= dt; if (m.hop <= 0) { m.hop = rand(0.4, 1.6); m.vy = 1.6; m.yaw += rand(-1.2, 1.2); }
            m.y = Math.max(0, m.y + m.vy * dt); m.vy -= 9 * dt; if (m.y > 0) { m.x += Math.sin(m.yaw) * dt * 0.6; m.z += Math.cos(m.yaw) * dt * 0.6; }
            if (Math.hypot(m.x - g.cx, m.z - g.cz) > 3) m.yaw = Math.atan2(g.cx - m.x, g.cz - m.z);
            const peck = m.y === 0 && Math.sin(time * 6 + m.i) > 0.7 ? 0.4 : 0;
            o.position.set(m.x, gy + m.y + 0.08, m.z); o.rotation.set(peck, m.yaw, 0, 'YXZ'); o.scale.setScalar(1); o.updateMatrix();
            g.K.meshes[0].setMatrixAt(m.i, o.matrix); g.K.meshes[1].setMatrixAt(m.i, o.matrix); g.K.meshes[2].setMatrixAt(m.i, o.matrix);
          }
        }
        if (g.state === 'fly' && (g.t -= dt) <= 0) g.state = 'ground';
      } else if (g.type === 'butterfly') {
        for (const m of g.members) {
          const t = time * m.sp + m.ph, x = g.cx + Math.sin(t) * m.r + Math.sin(t * 2.3) * 0.4, z = g.cz + Math.cos(t * 0.8) * m.r, y = terrain.heightAt(x, z) + 0.7 + Math.sin(t * 3.1) * 0.35;
          const yaw = Math.atan2(Math.cos(t) * m.r, -Math.sin(t * 0.8) * m.r * 0.8);
          put(g.K, m.i, x, y, z, yaw, 0, 0.2 + Math.abs(Math.sin(time * 14 + m.ph)) * 1.1);
        }
      } else if (g.type === 'fish') {
        const m = g.members[0]; m.t += dt;
        if (m.t < 0) { hide(g.K, m.i); continue; }
        const T = 1.1; if (m.t > T) { m.t = -rand(3, 8); m.yaw = Math.random() * 6.28; hide(g.K, m.i); continue; }
        const k = m.t / T, x = g.cx + Math.sin(m.yaw) * (k - 0.5) * 2.4, z = g.cz + Math.cos(m.yaw) * (k - 0.5) * 2.4, y = 4 * 1.1 * k * (1 - k) - 0.2;
        o.position.set(x, y, z); o.rotation.set(-(1 - 2 * k) * 1.1, m.yaw, 0, 'YXZ'); o.scale.setScalar(1); o.updateMatrix();
        g.K.meshes[0].setMatrixAt(m.i, o.matrix); o.rotation.y += Math.sin(time * 30) * 0.3; o.updateMatrix(); g.K.meshes[1].setMatrixAt(m.i, o.matrix); g.K.meshes[2].setMatrixAt(m.i, zero);
      }
    }
    for (const K of dirty) K.meshes.forEach(m => m.instanceMatrix.needsUpdate = true);
  }
  // cho bản đồ: vị trí đại diện của mỗi đàn
  const markers = groups.map(g => ({ S: FAUNA_INFO[g.type], g, root: { position: v.clone() } }));
  const sync = () => markers.forEach(mk => { const g = mk.g, m = g.members[0]; mk.root.position.set(g.type === 'sparrow' ? m.x : g.cx, 0, g.type === 'sparrow' ? m.z : g.cz); });
  return { update, markers: () => (sync(), markers) };
}
