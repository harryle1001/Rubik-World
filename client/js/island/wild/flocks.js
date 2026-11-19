// wild/flocks.js — Đàn sinh vật nhỏ vẽ bằng InstancedMesh từ model CC0 có xương ("skinned instancing đơn giản"):
// nướng 2 tư thế của animation (cánh lên / cánh xuống, đuôi trái / phải) thành 2 lưới tĩnh; mỗi con mỗi khung chọn 1 trong 2 lưới
// theo nhịp riêng → cả đàn vỗ cánh lệch pha mà chỉ tốn 2 draw call, không tính xương trên CPU/GPU.
// Kiểu đàn (S.k): f chim nhỏ dưới đất (mổ, nhảy, tắm bụi, giật mình bay) · air: chim én lượn · v bay chữ V (di cư)
//                 p đậu dây điện · i côn trùng quanh hoa / quanh đèn (đêm) · sc đàn cá
import * as THREE from 'three';
import { loadAnimated } from '../models.js';
import { gradientMap } from '../style.js';

const BAD = /tpose|t pose|pose$|die|death|dying|dead|attack|reset|old_/i;
const baked = new Map();
export function bake(name) {   // → { geos: [A, B], rest, vcol, color }
  if (!baked.has(name)) baked.set(name, loadAnimated('wild/' + name, true).then(g => {
    if (!g) return null;
    const root = g.scene; let mesh = null; root.traverse(o => { if (!mesh && o.isMesh && !o.userData.outline) mesh = o; });
    const clips = g.animations.filter(c => !BAD.test(c.name)), clip = clips.find(c => /fly|flap|hover|swim/i.test(c.name)) || clips[0];
    const mixer = clip && new THREE.AnimationMixer(root); if (clip) mixer.clipAction(clip).play();
    const v = new THREE.Vector3(), geos = [], src = mesh.geometry, P = src.attributes.position;
    for (const t of clip ? [0.02, 0.52] : [0]) {
      if (clip) mixer.setTime(clip.duration * t);
      root.updateMatrixWorld(true); if (mesh.isSkinnedMesh) mesh.skeleton.update();
      const out = new Float32Array(P.count * 3);
      for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); if (mesh.isSkinnedMesh) mesh.applyBoneTransform(i, v); v.applyMatrix4(mesh.matrixWorld); out[i * 3] = v.x; out[i * 3 + 1] = v.y; out[i * 3 + 2] = v.z; }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(out, 3));
      if (src.attributes.color) geo.setAttribute('color', src.attributes.color.clone());
      if (src.index) geo.setIndex(src.index.clone());
      geos.push(geo);
    }
    // chuẩn hoá: tâm về gốc, chiều lớn nhất = 1 (cùng phép biến đổi cho mọi tư thế)
    geos[0].computeBoundingBox(); const b = geos[0].boundingBox, c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3()), k = 1 / (Math.max(s.x, s.y, s.z) || 1);
    const span = geos.map(g2 => { g2.translate(-c.x, -c.y, -c.z).scale(k, k, k); g2.computeVertexNormals(); g2.computeBoundingBox(); const q = g2.boundingBox.getSize(new THREE.Vector3()); return q.x + q.z; });
    return { geos, rest: span.length > 1 && span[1] < span[0] ? 1 : 0, vcol: !!src.attributes.color, color: mesh.material.color.clone(), h: s.y * k };
  }));
  return baked.get(name);
}

const _o = new THREE.Object3D(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0), rnd = (a, b) => a + Math.random() * (b - a);
// Tạo đàn: api { meshes, members, update(dt, time, env), dispose() }
export async function makeFlock(ctx, G, RY) {
  const S = G.S, B = await bake(S.m); if (!B) return null;
  const n = G.n, mat = new THREE.MeshToonMaterial({ vertexColors: B.vcol, color: B.vcol ? '#ffffff' : B.color, gradientMap, side: THREE.DoubleSide });
  if (S.t) mat.color.multiply(new THREE.Color(S.t));
  const meshes = B.geos.map(g => { const m = new THREE.InstancedMesh(g, mat, n); m.frustumCulled = false; m.castShadow = false; m.userData.wild = S; for (let i = 0; i < n; i++) m.setMatrixAt(i, ZERO); ctx.scene.add(m); return m; });
  const two = meshes.length > 1, ry = RY || 0, terrain = ctx.terrain, k = S.k, size = S.s;
  const put = (i, pose, x, y, z, yaw, pitch = 0, roll = 0, sc = 1) => {
    _o.position.set(x, y, z); _o.rotation.set(pitch, yaw + ry, roll, 'YXZ'); _o.scale.setScalar(size * sc); _o.updateMatrix();
    meshes[two ? pose : 0].setMatrixAt(i, _o.matrix); if (two) meshes[1 - pose].setMatrixAt(i, ZERO); M[i].wy = y;
  };
  const flap = (m, time, rate) => ((time * rate + m.ph) % 1) < 0.5 ? 0 : 1;
  const gy = (x, z) => G.floorY != null ? G.floorY : Math.max(terrain.heightAt(x, z), 0);
  const M = Array.from({ length: n }, (_, i) => ({ i, ph: Math.random(), x: G.hx + rnd(-2, 2), z: G.hz + rnd(-2, 2), y: 0, vy: 0, yaw: rnd(0, 6.28), hop: rnd(0, 2), a: rnd(0, 6.28), r: rnd(0.6, 1), sp: rnd(0.8, 1.2), t: rnd(0, 3) }));
  const F = { meshes, members: M, S, cx: G.hx, cz: G.hz, cy: 0, state: 'ground', t: 0, seenFlush: false };
  const half = B.h * size * 0.5;

  // ---- chim nhỏ dưới đất: nhảy lò cò mổ thóc, tắm bụi, người lại gần thì cả đàn bay vụt sang chỗ khác rồi đáp ----
  function ground(dt, time, env) {
    const p = env.p, d = Math.hypot(F.cx - p.x, F.cz - p.z), dust = S.beh && S.beh.includes('dust');
    if (F.state === 'ground' && d < S.shy * env.shyK && !env.fedT) {
      F.state = 'fly'; F.t = rnd(2.6, 3.6); const a = Math.atan2(F.cz - p.z, F.cx - p.x) + rnd(-0.7, 0.7), L = rnd(9, 14); let nx = F.cx + Math.cos(a) * L, nz = F.cz + Math.sin(a) * L;
      if (Math.hypot(nx - G.hx, nz - G.hz) > 22 || terrain.heightAt(nx, nz) < 0.3) { nx = G.hx + rnd(-4, 4); nz = G.hz + rnd(-4, 4); }
      F.cx = nx; F.cz = nz; for (const m of M) { m.fx = nx + rnd(-1.6, 1.6); m.fz = nz + rnd(-1.6, 1.6); m.vy = rnd(3.5, 5.5); }
      env.say && env.say(S, d);
    }
    for (const m of M) {
      const g0 = gy(m.x, m.z), N = G.nest;
      if (N && m.i === 0 && F.state === 'ground' && G.nestPh < 2) {   // tổ: ngày 0 chim mẹ nằm ấp · ngày 1 bay đi bay về mớm mồi cho chim non
        if (G.nestPh === 0) { m.x = N.x; m.z = N.z; put(0, B.rest, N.x, N.y + 0.1 + half * 0.7, N.z, m.ph * 6); continue; }
        const c = (time * 0.9 + m.ph * 7) % 7, u = c < 2.5 ? c / 2.5 : c < 4 ? 1 : 1 - (c - 4) / 3, e = u * u * (3 - 2 * u), x = F.cx + (N.x - F.cx) * e, z = F.cz + (N.z - F.cz) * e, y0 = g0 + half, y = y0 + (N.y + 0.14 + half - y0) * e + Math.sin(u * Math.PI) * 1.2;
        m.x = x; m.z = z; put(0, c >= 2.5 && c < 4 ? B.rest : flap(m, time, 6), x, y, z, Math.atan2((c < 4 ? 1 : -1) * (N.x - F.cx), (c < 4 ? 1 : -1) * (N.z - F.cz)), c >= 2.5 && c < 4 ? 0.5 + Math.sin(time * 9) * 0.2 : 0); continue;
      }
      if (F.state === 'fly') {
        const dx = m.fx - m.x, dz = m.fz - m.z, L = Math.hypot(dx, dz); if (L > 0.3) { m.yaw = Math.atan2(dx, dz); const st = Math.min(L, 6.5 * dt); m.x += dx / L * st; m.z += dz / L * st; }
        m.y = Math.max(0, m.y + m.vy * dt); m.vy -= 3 * dt; if (L < 0.5 && m.y <= 0.02) m.y = 0;
        put(m.i, m.y > 0.02 ? flap(m, time, 6) : B.rest, m.x, g0 + m.y + half, m.z, m.yaw, m.vy > 0 ? -0.3 : 0.15);
      } else {
        m.hop -= dt; if (m.hop <= 0) { m.hop = rnd(0.5, 1.8); m.vy = 1.5; m.yaw += rnd(-1.2, 1.2); m.bath = dust && Math.random() < 0.25 ? rnd(1.5, 3) : 0; }
        if (m.bath > 0) m.bath -= dt;
        m.y = Math.max(0, m.y + m.vy * dt); m.vy -= 9 * dt; if (m.y > 0) { m.x += Math.sin(m.yaw) * dt * 0.6; m.z += Math.cos(m.yaw) * dt * 0.6; }
        if (Math.hypot(m.x - F.cx, m.z - F.cz) > 2.6) m.yaw = Math.atan2(F.cx - m.x, F.cz - m.z);
        const peck = m.y === 0 && Math.sin(time * 6 + m.i * 1.7) > 0.6 ? 0.55 : 0, bath = m.bath > 0;   // tắm bụi: nằm rạp, lắc mình, vẩy cánh
        put(m.i, bath ? flap(m, time, 5) : B.rest, m.x, g0 + m.y + half * (bath ? 0.7 : 1), m.z, m.yaw, peck, bath ? Math.sin(time * 16 + m.i) * 0.5 : 0);
      }
    }
    if (F.state === 'fly' && (F.t -= dt) <= 0) { F.state = 'ground'; for (const m of M) { m.y = 0; m.vy = 0; } }
  }
  // ---- chim én: lượn vòng trên cao; trời sắp mưa bay sát mặt đất ("én bay thấp mưa ngập bờ ao") ----
  function air(dt, time, env) {
    const alt = env.rainSoon ? 1.6 : 7;
    for (const m of M) {
      m.a += dt * m.sp * 0.9; const R = 6 + m.r * 9, x = G.hx + Math.cos(m.a) * R + Math.sin(m.a * 2.3 + m.ph * 6) * 3, z = G.hz + Math.sin(m.a) * R * 0.8 + Math.cos(m.a * 1.7) * 3;
      const y = gy(x, z) + alt + Math.sin(m.a * 3 + m.ph * 9) * (env.rainSoon ? 0.5 : 2.2), yaw = Math.atan2(-Math.sin(m.a) * R, Math.cos(m.a) * R * 0.8);
      m.x = x; m.z = z; put(m.i, flap(m, time, 5.5), x, y, z, yaw, 0, -0.5);
    }
    F.cx = M[0].x; F.cz = M[0].z; F.cy = alt;
  }
  // ---- bay theo đội hình chữ V (ngỗng trời di cư): G.fly = { x, z, dx, dz, alt } do wildlife.js đặt, bay thẳng qua bầu trời ----
  function vee(dt, time) {
    const f = G.fly; if (!f) { for (const m of M) put(m.i, 0, 0, -99, 0, 0, 0, 0, 0); return; }
    f.x += f.dx * dt * 9; f.z += f.dz * dt * 9; const yaw = Math.atan2(f.dx, f.dz), px = -f.dz, pz = f.dx;
    M.forEach((m, j) => { const row = Math.ceil(j / 2), side = j === 0 ? 0 : j % 2 ? 1 : -1, x = f.x - f.dx * row * 2.2 + px * side * row * 1.6, z = f.z - f.dz * row * 2.2 + pz * side * row * 1.6;
      m.x = x; m.z = z; put(m.i, flap(m, time, 2.2), x, f.alt + Math.sin(time * 1.3 + j) * 0.4, z, yaw); });
    F.cx = f.x; F.cz = f.z; F.cy = f.alt;
  }
  // ---- đậu dây điện: đứng thành hàng trên dây; thỉnh thoảng 1 con bay một vòng rồi về chỗ; người tới gần → bay hết, lát sau về ----
  function perch(dt, time, env) {
    const w = G.wire, p = env.p, d = Math.hypot(G.hx - p.x, G.hz - p.z);
    if (F.state === 'ground' && d < S.shy * env.shyK) { F.state = 'fly'; F.t = rnd(7, 10); env.say && env.say(S, d); }
    if (F.state === 'fly' && (F.t -= dt) <= 0 && d > S.shy * env.shyK + 3) F.state = 'ground';
    M.forEach((m, j) => {
      const u = (j + 1) / (n + 1), sx = w.x0 + (w.x1 - w.x0) * u, sz = w.z0 + (w.z1 - w.z0) * u, sy = w.y - Math.sin(u * Math.PI) * 0.18 + half;
      if (F.state === 'ground' && !m.loop && (m.t -= dt) < 0) { m.t = rnd(9, 22); m.loop = 1e-3; }
      const away = F.state === 'fly' || m.loop > 0;
      if (away) { m.loop = F.state === 'fly' ? (m.loop || 1e-3) : m.loop + dt / 5; if (m.loop >= 1) m.loop = 0; }
      m.k = (m.k || 0) + ((away ? 1 : 0) - (m.k || 0)) * Math.min(1, dt * 1.6);   // 0 = trên dây, 1 = đang lượn
      const a = time * 0.9 * m.sp + m.ph * 6, R = 4 + m.r * 5, ax = G.hx + Math.cos(a) * R, az = G.hz + Math.sin(a) * R, ay = w.y + 2 + Math.sin(a * 2) * 1.2;
      const x = sx + (ax - sx) * m.k, y = sy + (ay - sy) * m.k, z = sz + (az - sz) * m.k;
      put(m.i, m.k > 0.06 ? flap(m, time, 5) : B.rest, x, y, z, m.k > 0.06 ? Math.atan2(-Math.sin(a), Math.cos(a)) : w.yaw + (j % 2 ? 0 : Math.PI), 0, 0);
      m.x = x; m.z = z;
    });
  }
  // ---- côn trùng: bướm chập chờn quanh hoa, ong bay đi bay về tổ, ngài lượn quanh đèn ban đêm ----
  function insects(dt, time) {
    const lamp = S.lamp, hive = /bee|hornet/.test(S.m);
    for (const m of M) {
      const t = time * m.sp * (hive ? 1.5 : 1) + m.ph * 40, R = (lamp ? 0.5 + m.r * 0.9 : 0.8 + m.r * 2.4);
      const x = G.hx + Math.sin(t) * R + Math.sin(t * 2.3) * 0.4, z = G.hz + Math.cos(t * 0.8) * R, base = lamp ? 2.6 : 0.5 + m.r * 0.6;
      const y = gy(x, z) + base + Math.sin(t * 3.1) * 0.3, yaw = Math.atan2(Math.cos(t) * R, -Math.sin(t * 0.8) * R * 0.8);
      m.x = x; m.z = z; put(m.i, flap(m, time, hive ? 9 : 3.2), x, y, z, yaw, 0, Math.sin(t * 5) * 0.15);
    }
  }
  // ---- đàn cá: bơi vòng dưới mặt nước, cả đàn đổi hướng cùng lúc; cá mập lại gần (G.scare) thì tản ra ----
  function school(dt, time, env) {
    const depth = G.depth || 1.2, sc = G.scare > 0 ? 2.2 : 1; if (G.scare > 0) G.scare -= dt;
    F.a = (F.a || 0) + dt * 0.25 * S.sp / 2 * sc; const ccx = G.hx + Math.cos(F.a) * 6, ccz = G.hz + Math.sin(F.a) * 6;
    for (const m of M) {
      const t = F.a * 2 + m.ph * 6.28, R = (1 + m.r * 2.2) * sc, x = ccx + Math.cos(t) * R, z = ccz + Math.sin(t) * R * 0.7;
      const y = -depth + Math.sin(time * 0.7 + m.ph * 9) * 0.3, yaw = Math.atan2(-Math.sin(t) * R, Math.cos(t) * R * 0.7);
      m.x = x; m.z = z; put(m.i, flap(m, time, 2.4 * sc), x, y, z, yaw);
    }
    F.cx = ccx; F.cz = ccz; F.cy = -depth;
  }
  const step = k === 'v' ? vee : k === 'p' ? perch : k === 'i' ? insects : k === 'sc' ? school : S.air ? air : ground;
  F.update = (dt, time, env) => { step(dt, time, env); for (const m of meshes) m.instanceMatrix.needsUpdate = true; };
  F.show = v => { for (const m of meshes) m.visible = v; };
  F.dispose = () => { for (const m of meshes) ctx.scene.remove(m); };
  return F;
}
