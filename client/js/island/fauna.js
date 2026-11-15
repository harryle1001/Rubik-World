// fauna.js — Sinh vật nhỏ theo đàn, vẽ bằng InstancedMesh (mỗi loài chỉ vài lần vẽ, rất nhẹ cho điện thoại):
//   - Hải âu: bay vòng trên cao theo đàn, vỗ cánh rồi lượn.
//   - Chim sẻ: nhảy lò cò mổ thóc dưới đất; người chơi lại gần (< 5 m) → cả đàn bay tán loạn rồi đáp lại chỗ khác.
//   - Bướm: bay chập chờn quanh hoa / bãi cỏ.
//   - Vịt: vịt mẹ bơi ven bờ, đàn vịt con nối đuôi theo sau; người chơi lại gần → cả đàn bơi ra xa.
//   - Chuồn chuồn: bay vụt rồi đứng yên giữa không trung (bay lượn) ven nước.
//   (Cá nhảy và đom đóm do ambience.js vẽ — dùng chung, không vẽ trùng.) Cánh trái/phải chung 1 InstancedMesh; sinh vật nhỏ không đổ bóng.
// Chỉ cập nhật đàn trong ACTIVE mét quanh người chơi; đàn xa bị ẩn. Hình khối tự dựng (không cần file model).
import * as THREE from 'three';
import { toon, gradientMap } from './style.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CFG } from './config.js';
import { LAND, TEMPLE_C } from './layout.js';
import { T, dampAngle } from './motion.js';

const ACTIVE = 70;
export const FAUNA_INFO = {
  gull: { id: 'gull', name: 'Hải âu', fact: 'Hải âu uống được nước biển: tuyến muối trên mắt giúp chúng thải muối ra ngoài.' },
  sparrow: { id: 'sparrow', name: 'Chim sẻ', fact: 'Chim sẻ "tắm" bằng cát bụi để làm sạch lông và đuổi bọ.' },
  butterfly: { id: 'butterfly', name: 'Bướm', fact: 'Bướm nếm vị bằng chân: đậu lên hoa là biết hoa có mật hay không.' },
  fish: { id: 'fish', name: 'Cá', fact: 'Cá thở bằng mang: mang lấy khí ô-xi hoà tan trong nước.' },
  duck: { id: 'duck', name: 'Vịt', fact: 'Lông vịt có lớp dầu chống thấm nước, nên vịt bơi cả ngày mà không bị ướt lông.' },
  dragonfly: { id: 'dragonfly', name: 'Chuồn chuồn', fact: 'Chuồn chuồn có mắt kép gồm hàng chục nghìn mắt nhỏ, nhìn được gần như mọi hướng.' },
  firefly: { id: 'firefly', name: 'Đom đóm', fact: 'Đom đóm phát sáng nhờ phản ứng hoá học trong bụng, ánh sáng gần như không nóng.' },
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

  function kind(key, parts, n) { // parts: [[geo, color, số bản/con], …] → mỗi phần 1 InstancedMesh (cánh: 2 bản/con, trái = lật gương)
    const meshes = parts.map(([geo, col, k = 1]) => { const m = new THREE.InstancedMesh(geo, toon(col, { side: THREE.DoubleSide }), n * k); m.userData.k = k; m.castShadow = false; m.frustumCulled = false; for (let i = 0; i < n * k; i++) m.setMatrixAt(i, zero); scene.add(m); return m; });
    return (kinds[key] = { meshes, n, used: 0 });
  }
  const put = (K, i, x, y, z, yaw, roll = 0, flap = 0, s = 1) => { // thân + 2 cánh (flap: góc cánh)
    o.position.set(x, y, z); o.rotation.set(0, yaw, roll); o.scale.setScalar(s); o.updateMatrix(); K.meshes[0].setMatrixAt(i, o.matrix);
    if (K.meshes.length > 1) { o.rotation.set(0, yaw, roll + flap, 'YXZ'); o.updateMatrix(); K.meshes[1].setMatrixAt(i * 2, o.matrix); o.rotation.set(0, yaw, roll - flap, 'YXZ'); o.scale.set(-s, s, s); o.updateMatrix(); K.meshes[1].setMatrixAt(i * 2 + 1, o.matrix); }
  };
  const hide = (K, i) => K.meshes.forEach(m => { const k = m.userData.k || 1; for (let j = 0; j < k; j++) m.setMatrixAt(i * k + j, zero); });

  // ---------- Hải âu ----------
  { const G = birdGeos(0.5, 0.75, 0.32), n = mob ? 12 : 20, K = kind('gull', [[G.body, '#f4f4f0'], [G.wingR, '#c9ced6', 2]], n);
    for (let gi = 0; gi < n / 4; gi++) { const c = landPt(h => h < -1) || [rand(-150, 250), rand(-150, 150)]; groups.push({ type: 'gull', K, cx: c[0], cz: c[1], members: Array.from({ length: 4 }, (_, k) => ({ i: K.used++, a: Math.random() * 6.28, r: rand(6, 14), h: rand(12, 20), sp: rand(0.25, 0.4) * (k % 2 ? 1 : -1), ph: Math.random() * 6 })), drift: Math.random() * 6.28 }); } }
  // ---------- Chim sẻ ----------
  { const G = birdGeos(0.16, 0.16, 0.1), n = mob ? 24 : 36, K = kind('sparrow', [[G.body, '#8a5a34'], [G.wingR, '#6b4a2b', 2]], n);
    for (let gi = 0; gi < n / 6; gi++) { const c = landPt(h => h > 0.9 && h < 4); if (!c) continue; groups.push({ type: 'sparrow', K, cx: c[0], cz: c[1], state: 'ground', t: 0, members: Array.from({ length: 6 }, () => ({ i: K.used++, x: c[0] + rand(-2, 2), z: c[1] + rand(-2, 2), y: 0, vy: 0, yaw: Math.random() * 6.28, hop: Math.random() * 2, fx: 0, fz: 0 })) }); } }
  // ---------- Bướm ----------
  { const wing = new THREE.CircleGeometry(0.09, 5).translate(0.09, 0, 0).rotateX(-Math.PI / 2), body = new THREE.CylinderGeometry(0.012, 0.012, 0.12, 3).rotateX(Math.PI / 2), n = mob ? 18 : 30;
    const cols = ['#ffd23f', '#ff8a2b', '#7fd1ff', '#ff6fae', '#ffffff'], K = kind('butterfly', [[body, '#2a2a38'], [wing, '#ffd23f', 2]], n);
    const colAttr = new Float32Array(n * 6), c = new THREE.Color(); for (let i = 0; i < n; i++) { c.set(cols[i % cols.length]); colAttr.set([c.r, c.g, c.b, c.r, c.g, c.b], i * 6); }
    for (const m of K.meshes.slice(1)) m.instanceColor = new THREE.InstancedBufferAttribute(colAttr, 3), m.material = toon('#ffffff', { side: THREE.DoubleSide });
    for (let gi = 0; gi < n / 3; gi++) { const p = landPt(h => h > 1.4 && h < 6); if (!p) continue; groups.push({ type: 'butterfly', K, cx: p[0], cz: p[1], members: Array.from({ length: 3 }, () => ({ i: K.used++, ph: Math.random() * 100, r: rand(0.8, 2.2), sp: rand(0.5, 0.9) })) }); } }
  // ---------- Vịt: 1 hình (thân + đầu + mỏ, màu theo đỉnh) → 1 lần vẽ; vịt con = cùng hình, nhỏ hơn, tô vàng ----------
  { const part = (g, col) => { const c = new THREE.Color(col), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); g.deleteAttribute('uv'); return g; };
    const geo = mergeGeometries([
      part(new THREE.SphereGeometry(0.2, 7, 5).scale(0.85, 0.62, 1.25).translate(0, 0.1, 0), '#ffffff'),
      part(new THREE.SphereGeometry(0.11, 6, 4).translate(0, 0.3, 0.2), '#ffffff'),
      part(new THREE.ConeGeometry(0.045, 0.12, 4).rotateX(Math.PI / 2).scale(1.3, 0.5, 1).translate(0, 0.28, 0.33), '#f59a23'),
      part(new THREE.ConeGeometry(0.07, 0.14, 4).rotateX(-Math.PI / 2 - 0.5).translate(0, 0.17, -0.25), '#ffffff'),
    ].map(g => g.toNonIndexed()));
    const n = mob ? 15 : 25, m = new THREE.InstancedMesh(geo, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap }), n); m.castShadow = true; m.frustumCulled = false;
    const col = new Float32Array(n * 3); for (let i = 0; i < n; i++) col.set(i % 5 ? [1, 0.86, 0.3] : [0.96, 0.96, 0.92], i * 3); m.instanceColor = new THREE.InstancedBufferAttribute(col, 3);
    for (let i = 0; i < n; i++) m.setMatrixAt(i, zero); scene.add(m); const K = kinds.duck = { meshes: [m], n, used: 0 };
    for (let gi = 0; gi < n / 5; gi++) { const p = landPt((h, x, z) => h < -0.5 && h > -2.5 && terrain.heightAt(x + 4, z) < 0.2 && terrain.heightAt(x - 4, z) < 0.2, 300); if (!p) continue;
      groups.push({ type: 'duck', K, cx: p[0], cz: p[1], hx: p[0], hz: p[1], yaw: Math.random() * 6.28, ky: { v: 0 }, trail: [], members: Array.from({ length: 5 }, (_, k) => ({ i: K.used++, x: p[0], z: p[1], yaw: 0, s: k ? 0.55 : 1 })) }); } }
  // ---------- Chuồn chuồn: thân dài + 2 cặp cánh trong suốt ----------
  { const body = new THREE.CylinderGeometry(0.02, 0.012, 0.32, 4).rotateX(Math.PI / 2), wing = new THREE.PlaneGeometry(0.3, 0.055).rotateX(-Math.PI / 2), wings = mergeGeometries([wing.clone().translate(0.15, 0, 0.05), wing.clone().translate(-0.15, 0, 0.05), wing.clone().translate(0.13, 0, -0.02), wing.clone().translate(-0.13, 0, -0.02)]);
    const n = mob ? 12 : 20, K = kind('dragonfly', [[body, '#2fb7c8']], n);
    const wm = new THREE.InstancedMesh(wings, new THREE.MeshBasicMaterial({ color: '#dff6ff', transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }), n); wm.frustumCulled = false; for (let i = 0; i < n; i++) wm.setMatrixAt(i, zero); scene.add(wm); K.meshes.push(wm);
    for (let gi = 0; gi < n / 2; gi++) { const p = landPt(h => h > 0.25 && h < 1.6, 200); if (!p) continue; groups.push({ type: 'dragonfly', K, cx: p[0], cz: p[1], members: Array.from({ length: 2 }, () => ({ i: K.used++, x: p[0], y: 1, z: p[1], tx: p[0], ty: 1, tz: p[1], t: 0, yaw: 0 })) }); } }
  const v = new THREE.Vector3();
  function update(dt, time) {
    const p = ctx.player.pos, dirty = new Set();
    for (const k in kinds) kinds[k].live = 0;
    for (const g of groups) {
      const far = Math.hypot(g.cx - p.x, g.cz - p.z) > ACTIVE + (g.type === 'gull' ? 40 : 0);
      if (far) { if (!g.hidden) { g.members.forEach(m => hide(g.K, m.i)); g.hidden = true; dirty.add(g.K); } continue; }
      g.hidden = false; dirty.add(g.K); g.K.live++;
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
            const dx = m.fx - m.x, dz = m.fz - m.z, L = Math.hypot(dx, dz); if (L > 0.3) m.yt = Math.atan2(dx, dz);
            m.yaw = dampAngle(m.yaw, m.yt ?? m.yaw, m.ky || (m.ky = { v: 0 }), T.fast, dt, 12); // quay đầu mượt khi cất cánh
            if (L > 0.3) { const st = Math.min(L, 7 * dt); m.x += dx / L * st; m.z += dz / L * st; }
            m.y = Math.max(0, m.y + m.vy * dt); m.vy -= 3.2 * dt; if (L < 0.5 && m.vy < 0 && m.y <= 0.02) m.y = 0;
            put(g.K, m.i, m.x, gy + m.y + 0.08, m.z, m.yaw, 0, Math.sin(time * 28 + m.i) * 0.9);
          } else { // nhảy lò cò, mổ thóc
            m.hop -= dt; if (m.hop <= 0) { m.hop = rand(0.4, 1.6); m.vy = 1.6; m.yt = (m.yt ?? m.yaw) + rand(-1.2, 1.2); }
            m.yaw = dampAngle(m.yaw, m.yt ?? m.yaw, m.ky || (m.ky = { v: 0 }), T.fast, dt, 12);
            m.y = Math.max(0, m.y + m.vy * dt); m.vy -= 9 * dt; if (m.y > 0) { m.x += Math.sin(m.yaw) * dt * 0.6; m.z += Math.cos(m.yaw) * dt * 0.6; }
            if (Math.hypot(m.x - g.cx, m.z - g.cz) > 3) m.yt = Math.atan2(g.cx - m.x, g.cz - m.z);
            const peck = m.y === 0 && Math.sin(time * 6 + m.i) > 0.7 ? 0.4 : 0;
            o.position.set(m.x, gy + m.y + 0.08, m.z); o.rotation.set(peck, m.yaw, 0, 'YXZ'); o.scale.setScalar(1); o.updateMatrix();
            g.K.meshes[0].setMatrixAt(m.i, o.matrix); g.K.meshes[1].setMatrixAt(m.i * 2, o.matrix); o.scale.set(-1, 1, 1); o.updateMatrix(); g.K.meshes[1].setMatrixAt(m.i * 2 + 1, o.matrix); // cánh xếp
          }
        }
        if (g.state === 'fly' && (g.t -= dt) <= 0) g.state = 'ground';
      } else if (g.type === 'butterfly') {
        for (const m of g.members) {
          const t = time * m.sp + m.ph, x = g.cx + Math.sin(t) * m.r + Math.sin(t * 2.3) * 0.4, z = g.cz + Math.cos(t * 0.8) * m.r, y = terrain.heightAt(x, z) + 0.7 + Math.sin(t * 3.1) * 0.35;
          const yaw = Math.atan2(Math.cos(t) * m.r, -Math.sin(t * 0.8) * m.r * 0.8);
          put(g.K, m.i, x, y, z, yaw, 0, 0.2 + Math.abs(Math.sin(time * 14 + m.ph)) * 1.1);
        }
      } else if (g.type === 'duck') { // vịt mẹ dẫn đầu, vịt con đi theo vệt của mẹ
        const lead = g.members[0], dp = Math.hypot(lead.x - p.x, lead.z - p.z), scared = dp < 5;
        if (!g.goal || Math.hypot(g.goal[0] - lead.x, g.goal[1] - lead.z) < 1 || scared && !g.fleeing) {
          let gx = g.hx, gz = g.hz;
          for (let k = 0; k < 12; k++) { const a = scared ? Math.atan2(lead.z - p.z, lead.x - p.x) + rand(-0.6, 0.6) : Math.random() * 6.28, r = scared ? 7 : rand(3, 9), x = lead.x + Math.cos(a) * r, z = lead.z + Math.sin(a) * r, h = terrain.heightAt(x, z); if (h < -0.4 && Math.hypot(x - g.hx, z - g.hz) < 18) { gx = x; gz = z; break; } }
          g.goal = [gx, gz]; g.fleeing = scared;
        }
        if (!scared) g.fleeing = false;
        const want = Math.atan2(g.goal[0] - lead.x, g.goal[1] - lead.z); g.yaw = dampAngle(g.yaw, want, g.ky, T.slow, dt, 3);
        const sp = g.fleeing ? 1.4 : 0.45; lead.x += Math.sin(g.yaw) * sp * dt; lead.z += Math.cos(g.yaw) * sp * dt; lead.yaw = g.yaw;
        g.cx = lead.x; g.cz = lead.z;
        g.trail.unshift(lead.x, lead.z); if (g.trail.length > 2000) g.trail.length = 2000;
        let acc = 0, ti = 0;
        for (let k = 1; k < g.members.length; k++) { // mỗi vịt con cách con trước ~0,55 m dọc theo vệt bơi
          const m = g.members[k]; let need = 0.55 + (k === 1 ? 0.15 : 0);
          while (ti + 3 < g.trail.length && need > 0) { const d = Math.hypot(g.trail[ti + 2] - g.trail[ti], g.trail[ti + 3] - g.trail[ti + 1]); need -= d; acc += d; ti += 2; }
          const tx = g.trail[ti] ?? lead.x, tz = g.trail[ti + 1] ?? lead.z; if (Math.hypot(tx - m.x, tz - m.z) > 0.01) m.yaw = Math.atan2(tx - m.x, tz - m.z); m.x = tx; m.z = tz;
        }
        for (const m of g.members) { o.position.set(m.x, Math.sin(time * 2.2 + m.i) * 0.03 - 0.06 * m.s, m.z); o.rotation.set(Math.sin(time * 1.7 + m.i) * 0.06, m.yaw, 0, 'YXZ'); o.scale.setScalar(m.s); o.updateMatrix(); g.K.meshes[0].setMatrixAt(m.i, o.matrix); }
      } else if (g.type === 'dragonfly') { // bay vụt tới điểm mới rồi lượn đứng yên
        for (const m of g.members) {
          m.t -= dt;
          if (m.t <= 0) { m.t = rand(0.8, 2.6); m.tx = g.cx + rand(-3, 3); m.tz = g.cz + rand(-3, 3); m.ty = terrain.heightAt(m.tx, m.tz) + rand(0.6, 1.6); }
          const k = 1 - Math.exp(-dt * 6), dx = m.tx - m.x, dz = m.tz - m.z; if (Math.abs(dx) + Math.abs(dz) > 0.05) m.yaw = Math.atan2(dx, dz);
          m.x += dx * k; m.z += dz * k; m.y += (m.ty - m.y) * k;
          o.position.set(m.x, m.y + Math.sin(time * 9 + m.i) * 0.02, m.z); o.rotation.set(0, m.yaw, 0); o.scale.setScalar(1); o.updateMatrix(); g.K.meshes[0].setMatrixAt(m.i, o.matrix);
          o.scale.set(1, 1, 0.6 + Math.abs(Math.sin(time * 45 + m.i)) * 0.4); o.updateMatrix(); g.K.meshes[1].setMatrixAt(m.i, o.matrix); // cánh rung
        }

      }
    }
    for (const K of dirty) K.meshes.forEach(m => m.instanceMatrix.needsUpdate = true);
    for (const k in kinds) { const K = kinds[k], on = K.live > 0; if (K.meshes[0].visible !== on) K.meshes.forEach(m => m.visible = on); }   // loài không có đàn nào gần → không tốn draw call
  }
  // cho bản đồ: vị trí đại diện của mỗi đàn
  const markers = groups.map(g => ({ S: FAUNA_INFO[g.type], g, root: { position: v.clone() } }));
  const sync = () => markers.forEach(mk => { const g = mk.g, m = g.members[0]; mk.root.position.set(g.type === 'sparrow' ? m.x : g.cx, 0, g.type === 'sparrow' ? m.z : g.cz); });
  return { update, markers: () => (sync(), markers) };
}
