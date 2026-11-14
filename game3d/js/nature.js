// nature.js — CÂY, CỎ, HOA, ĐÁ, BƯỚM. Dùng InstancedMesh: mỗi loại cây chỉ 2 draw call dù có hàng trăm cây.
// - Hình dáng từng loại cây: TREE_SHAPES (thông, phong đỏ, tre, dừa, anh đào, bụi)
// - Chỗ mọc của từng loại: hàm biome()
// - Chặt cây / cây đổ / mọc lại: chop(), updateTrees()
// - Số lượng: CONFIG.trees.counts, CONFIG.grass, CONFIG.flowers, CONFIG.rocks
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { Mesher, windMaterial, flatMat, rng, smooth, clamp } from './utils.js';

// Thân cây cong: trụ nhiều đốt, đẩy lệch dần theo chiều cao
function bentTrunk(r0, r1, h, bend, seg = 6, rows = 5) {
  const g = new THREE.CylinderGeometry(r1, r0, h, seg, rows); g.translate(0, h / 2, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const t = p.getY(i) / h; p.setX(i, p.getX(i) + bend * t * t); }
  return g;
}
const ico = (r, d = 0) => new THREE.IcosahedronGeometry(r, d);

// Mỗi loại cây: trunk(m) vẽ thân, leaves(m) vẽ tán (nhiều lớp, màu đậm ở dưới, sáng ở ngọn)
const TREE_SHAPES = {
  pine: {
    trunk: m => m.add(bentTrunk(0.32, 0.18, 2.4, 0.15), '#6b4a2c'),
    leaves: m => { const L = [[2.2, 2.6, 1.6], [1.75, 2.3, 2.9], [1.25, 2.0, 4.1], [0.75, 1.6, 5.2]]; L.forEach(([r, h, y], i) => m.add(new THREE.ConeGeometry(r, h, 7), i % 2 ? '#2f6b45' : '#2a5f40', { p: [0.06 * i, y + h / 2 - 0.3, 0], r: [0, i * 0.5, 0], top: '#4f9a5c' })); },
    tint: [0.03, 0.12, 0.1], r: 0.45, h: 6.5,
  },
  maple: {
    trunk: m => { m.add(bentTrunk(0.35, 0.2, 3.0, 0.4), '#5e3f28'); m.add(bentTrunk(0.14, 0.08, 1.4, 0.3), '#5e3f28', { p: [0.25, 2.2, 0], r: [0, 0, -0.7] }); },
    leaves: m => { [[0, 4.0, 0, 1.9], [1.2, 3.5, 0.4, 1.3], [-1.0, 3.6, -0.3, 1.4], [0.2, 4.9, -0.2, 1.3], [0.3, 3.4, -1.1, 1.2]].forEach(([x, y, z, r], i) => m.add(ico(r), i % 2 ? '#c2412a' : '#d8562e', { p: [x + 0.4, y, z], s: [1, 0.85, 1], top: '#f08a3a' })); },
    tint: [0.04, 0.12, 0.08], r: 0.45, h: 5.8,
  },
  bamboo: {
    trunk: m => {
      for (let i = 0; i < 7; i++) {
        const a = i * 2.4, rr = 0.25 + (i % 3) * 0.3, h = 5 + (i * 37 % 5) * 0.6, b = 0.35 + (i % 2) * 0.3, bx = Math.cos(a) * rr, bz = Math.sin(a) * rr;
        m.add(bentTrunk(0.09, 0.07, h, b, 5, 6), '#8fb04a', { p: [bx, 0, bz], r: [0, a, 0], top: '#b5cc62' });
        for (let k = 1; k < 5; k++) { const t = k / 5, off = b * t * t; m.add(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 5), '#6f8f36', { p: [bx + off * Math.cos(a), t * h, bz - off * Math.sin(a)] }); }
      }
    },
    leaves: m => { for (let i = 0; i < 12; i++) { const a = i * 2.1, y = 3.2 + (i % 4) * 0.7, rr = 0.5 + (i % 3) * 0.25; m.add(new THREE.ConeGeometry(0.35, 1.5, 4), i % 2 ? '#6fa043' : '#88b84e', { p: [Math.cos(a) * rr, y, Math.sin(a) * rr], r: [Math.sin(a) * 1.2, a, Math.cos(a) * 1.2], s: [1, 1, 0.3] }); } },
    tint: [0.03, 0.1, 0.08], r: 0.6, h: 6,
  },
  palm: {
    trunk: m => { m.add(bentTrunk(0.3, 0.2, 6.2, 1.4, 6, 8), '#9a7a52', { top: '#b79464' }); for (let k = 1; k < 9; k++) { const t = k / 9; m.add(new THREE.TorusGeometry(0.26 - t * 0.07, 0.05, 3, 6), '#7d6040', { p: [1.4 * t * t, t * 6.2, 0], r: [Math.PI / 2, 0, 0] }); } },
    leaves: m => { for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; m.add(new THREE.ConeGeometry(0.45, 3.4, 4), i % 2 ? '#3f8f3c' : '#56a445', { p: [1.4 + Math.cos(a) * 1.4, 5.7, Math.sin(a) * 1.4], r: [Math.sin(a) * -1.9, 0, Math.cos(a) * 1.9], s: [1, 1, 0.22], top: '#7cc35a' }); } for (let i = 0; i < 3; i++) m.add(ico(0.26), '#6b4a2a', { p: [1.4 + Math.cos(i * 2) * 0.3, 5.9, Math.sin(i * 2) * 0.3] }); },
    tint: [0.03, 0.1, 0.08], r: 0.4, h: 7,
  },
  sakura: {
    trunk: m => { m.add(bentTrunk(0.3, 0.17, 2.6, -0.5), '#5a3a33'); m.add(bentTrunk(0.13, 0.07, 1.6, 0.3), '#5a3a33', { p: [-0.35, 1.9, 0], r: [0.5, 0, 0.6] }); },
    leaves: m => { [[0, 3.4, 0, 1.7], [1.1, 3.0, 0.5, 1.2], [-1.2, 3.2, 0.3, 1.3], [-0.2, 4.2, -0.5, 1.3], [0.6, 3.0, -1.0, 1.1], [-0.6, 2.7, 1.0, 1.0]].forEach(([x, y, z, r], i) => m.add(ico(r), i % 2 ? '#f2a6c0' : '#f7bdd0', { p: [x - 0.5, y, z], s: [1, 0.78, 1], top: '#ffe0ea' })); },
    tint: [0.03, 0.08, 0.06], r: 0.4, h: 5,
  },
  bush: {
    trunk: m => m.add(new THREE.CylinderGeometry(0.1, 0.14, 0.4, 5), '#5e3f28', { p: [0, 0.2, 0] }),
    leaves: m => { [[0, 0.75, 0, 0.9], [0.65, 0.55, 0.2, 0.62], [-0.55, 0.6, -0.15, 0.68], [0.1, 0.5, 0.6, 0.55]].forEach(([x, y, z, r], i) => m.add(ico(r), i % 2 ? '#4c8a3a' : '#5d9a45', { p: [x, y, z], s: [1, 0.85, 1], top: '#86bf5c' })); },
    tint: [0.05, 0.12, 0.1], r: 0.7, h: 1.5, small: true,
  },
};

export function createNature(ctx, world) {
  const { scene } = ctx; const rand = rng(CONFIG.seed + 11);
  const half = CONFIG.world.playRadius;
  const areas = world.layout.areas;
  const freeSpot = (x, z, pad) => {
    if (Math.hypot(x, z) < CONFIG.world.plazaRadius + 4 + pad) return false;
    for (const a of areas) if (Math.hypot(x - a.x, z - a.z) < a.info.flat + 2 + pad) return false;
    if (world.pathInfo(x, z).d < CONFIG.world.pathWidth + pad) return false;
    const h = world.groundAt(x, z); if (h < CONFIG.world.waterLevel + 0.35) return false;
    return true;
  };

  // Mỗi loại cây thích mọc ở đâu (điểm càng cao càng hay mọc)
  function biome(type, x, z) {
    const r = Math.hypot(x, z), h = world.groundAt(x, z), rd = world.riverDist(x, z);
    switch (type) {
      case 'pine': return smooth(55, 105, r) + smooth(3, 9, h) * 0.6;
      case 'maple': return 0.5 + 0.5 * Math.sin(x * 0.03 + z * 0.02);
      case 'bamboo': return (1 - smooth(6, 20, rd)) * 1.2 + (Math.hypot(x + 42, z - 84) < 30 ? 0.8 : 0);
      case 'palm': return (1 - smooth(5, 16, rd)) + (Math.hypot(x - 58, z - 8) < 22 ? 0.6 : 0);
      case 'sakura': return (1 - smooth(16, 45, Math.hypot(x, z + 64))) * 1.2 + (1 - smooth(14, 32, r)) * 0.8;
      default: return 0.7;
    }
  }

  // ---------- Cây ----------
  const trees = []; const types = {};
  const _o = new THREE.Object3D(), _c = new THREE.Color();
  for (const [type, count] of Object.entries(CONFIG.trees.counts)) {
    const S = TREE_SHAPES[type]; const list = [];
    let tries = 0;
    while (list.length < count && tries++ < count * 60) {
      const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * (half - 4), x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (rand() > biome(type, x, z)) continue;
      if (!freeSpot(x, z, S.small ? 0 : 1)) continue;
      let ok = true; for (const t of trees) if ((t.x - x) ** 2 + (t.z - z) ** 2 < (S.small ? 3 : 7)) { ok = false; break; } if (!ok) continue;
      const t = { type, i: list.length, x, z, y: world.groundAt(x, z) - 0.1, s: 0.8 + rand() * 0.45, ry: rand() * Math.PI * 2, tint: [(rand() - 0.5) * S.tint[0], (rand() - 0.5) * S.tint[1], (rand() - 0.5) * S.tint[2]], state: 'alive', t: 0, fallDir: 0 };
      list.push(t); trees.push(t);
    }
    const tm = new Mesher(); S.trunk(tm); const lm = new Mesher(); S.leaves(lm);
    const trunk = new THREE.InstancedMesh(tm.geometry(), windMaterial({}, 0.012, 1), list.length);
    const leaves = new THREE.InstancedMesh(lm.geometry(), windMaterial({}, type === 'bamboo' || type === 'palm' ? 0.03 : 0.022, 1.5), list.length);
    trunk.castShadow = leaves.castShadow = true; trunk.receiveShadow = leaves.receiveShadow = true;
    for (const t of list) { setTreeMatrix(t, trunk, leaves, 1, 0, 0); _c.setRGB(1, 1, 1).offsetHSL(t.tint[0], t.tint[1], t.tint[2]); leaves.setColorAt(t.i, _c); trunk.setColorAt(t.i, _c.setRGB(1, 1, 1).offsetHSL(0, 0, t.tint[2])); }
    trunk.computeBoundingSphere(); leaves.computeBoundingSphere();
    scene.add(trunk, leaves);
    types[type] = { trunk, leaves, list };
    for (const t of list) { t.col = { x: t.x, z: t.z, r: S.r * t.s, off: false }; ctx.colliders.push(t.col); }
  }
  function setTreeMatrix(t, trunk, leaves, grow, tiltX, tiltZ, shake = 0) {
    _o.position.set(t.x, t.y, t.z);
    _o.rotation.set(tiltX + shake * 0.6, t.ry, tiltZ + shake);
    _o.rotation.order = 'YXZ';
    const s = Math.max(0.0001, t.s * grow); _o.scale.set(s, s, s); _o.updateMatrix();
    trunk.setMatrixAt(t.i, _o.matrix); leaves.setMatrixAt(t.i, _o.matrix);
  }

  // ---------- Chặt cây: rung → đổ → biến mất → mọc lại ----------
  function nearestTree(p, maxD = CONFIG.trees.chopDistance) {
    let best = null, bd = maxD;
    for (const t of trees) { if (t.state !== 'alive') continue; const d = Math.hypot(t.x - p.x, t.z - p.z) - TREE_SHAPES[t.type].r * t.s; if (d < bd) { bd = d; best = t; } }
    return best;
  }
  function chop(t, from) {
    if (!t || t.state !== 'alive') return false;
    t.state = 'shake'; t.t = 0; t.fallDir = Math.atan2(t.x - from.x, t.z - from.z);
    ctx.sfx && ctx.sfx('chop');
    return true;
  }
  const logs = []; const logGeo = (() => { const m = new Mesher(); m.add(new THREE.CylinderGeometry(0.2, 0.2, 0.9, 6), '#9b6a3c', { r: [0, 0, Math.PI / 2] }); m.add(new THREE.CylinderGeometry(0.21, 0.21, 0.02, 6), '#e0b884', { p: [0.46, 0, 0], r: [0, 0, Math.PI / 2] }); return m.geometry(); })();
  const logMat = flatMat();
  function dropItems(t) {
    const [item, n] = CONFIG.trees.drops[t.type];
    for (let i = 0; i < n; i++) {
      const mesh = new THREE.Mesh(logGeo, logMat); mesh.castShadow = true;
      if (item === 'coconut') { mesh.geometry = cocoGeo; }
      if (item === 'bamboo') mesh.scale.set(1.2, 0.5, 0.5);
      mesh.position.set(t.x, t.y + 1.2 + i * 0.3, t.z);
      const a = rand() * Math.PI * 2, sp = 1.5 + rand() * 1.5;
      logs.push({ mesh, item, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, vy: 4 + rand() * 2, age: 0 });
      scene.add(mesh);
    }
  }
  const cocoGeo = (() => { const m = new Mesher(); m.add(ico(0.25), '#6b4a2a'); return m.geometry(); })();

  function updateTrees(dt) {
    const dirty = new Set();
    for (const t of trees) {
      if (t.state === 'alive') continue;
      const T = types[t.type]; t.t += dt; dirty.add(T);
      if (t.state === 'shake') {
        setTreeMatrix(t, T.trunk, T.leaves, 1, 0, 0, Math.sin(t.t * 40) * 0.05 * (1 - t.t / 0.6));
        if (t.t > 0.6) { t.state = 'fall'; t.t = 0; }
      } else if (t.state === 'fall') {
        const k = Math.min(1, t.t / 1.1), ang = k * k * 1.5;
        const dx = Math.sin(t.fallDir), dz = Math.cos(t.fallDir);
        setTreeMatrix(t, T.trunk, T.leaves, 1, dz * ang, -dx * ang);
        if (k >= 1) { t.state = 'gone'; t.t = 0; t.col.off = true; dropItems(t); setTreeMatrix(t, T.trunk, T.leaves, 0, 0, 0); ctx.sfx && ctx.sfx('thud'); }
      } else if (t.state === 'gone') {
        if (t.t > CONFIG.trees.respawnSec) { t.state = 'grow'; t.t = 0; }
      } else if (t.state === 'grow') {
        const k = Math.min(1, t.t / 3); setTreeMatrix(t, T.trunk, T.leaves, 1 - (1 - k) ** 3, 0, 0);
        if (k >= 1) { t.state = 'alive'; t.col.off = false; }
      }
    }
    for (const T of dirty) { T.trunk.instanceMatrix.needsUpdate = true; T.leaves.instanceMatrix.needsUpdate = true; }
    // gỗ rơi ra: nảy xuống đất rồi bay vào túi
    const p = ctx.player.pos;
    for (let i = logs.length - 1; i >= 0; i--) {
      const L = logs[i]; L.age += dt; const m = L.mesh;
      if (L.age < 1.2) {
        L.vy -= 18 * dt; m.position.x += L.vx * dt; m.position.z += L.vz * dt; m.position.y += L.vy * dt;
        const g = world.groundAt(m.position.x, m.position.z) + 0.2; if (m.position.y < g) { m.position.y = g; L.vy *= -0.35; L.vx *= 0.6; L.vz *= 0.6; }
        m.rotation.y += dt * 4;
      } else {
        const k = Math.min(1, (L.age - 1.2) * 2.5); m.position.lerp(new THREE.Vector3(p.x, p.y + 1.2, p.z), k * 0.35); m.scale.multiplyScalar(0.94);
        if (L.age > 1.8 || m.position.distanceTo(p) < 0.8) { scene.remove(m); logs.splice(i, 1); ctx.inventory.add(L.item, 1, true); }
      }
    }
  }

  // ---------- Cỏ (chia ô, ô ở xa thì ẩn) ----------
  const grassChunks = [];
  {
    const m = new Mesher();
    for (let i = 0; i < 3; i++) { const a = i * 1.05; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.11, 0, 0, 0.11, 0, 0, 0.02, 0.5, 0], 3)); m.add(g, '#5f8f36', { r: [0, a, (i - 1) * 0.25], top: '#c4d86a' }); }
    const geo = m.geometry(); const mat = windMaterial({ side: THREE.DoubleSide }, 0.25, 0);
    const CH = CONFIG.grass.chunk, n = Math.ceil((half * 2) / CH);
    const buckets = new Map();
    let placed = 0, tries = 0;
    while (placed < CONFIG.grass.count && tries++ < CONFIG.grass.count * 6) {
      const x = (rand() * 2 - 1) * half, z = (rand() * 2 - 1) * half;
      if (Math.hypot(x, z) > half) continue;
      if (Math.hypot(x, z) < CONFIG.world.plazaRadius + 1) continue;
      if (world.pathInfo(x, z).d < CONFIG.world.pathWidth * 0.55) continue;
      const h = world.groundAt(x, z); if (h < CONFIG.world.waterLevel + 0.3 || h > 9) continue;
      let skip = false; for (const a of areas) if (Math.hypot(x - a.x, z - a.z) < a.info.hw + 1.5 && a.info.hw > 0) { skip = true; break; } if (skip) continue;
      const key = Math.floor((x + half) / CH) + ',' + Math.floor((z + half) / CH);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push([x, h, z, 0.7 + rand() * 0.8, rand() * 6.28, rand()]); placed++;
    }
    for (const [key, arr] of buckets) {
      const im = new THREE.InstancedMesh(geo, mat, arr.length);
      let cx = 0, cz = 0;
      arr.forEach(([x, y, z, s, r, c], i) => { _o.position.set(x, y - 0.03, z); _o.rotation.set(0, r, 0); _o.scale.set(s, s * (0.8 + c * 0.6), s); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix); im.setColorAt(i, _c.setRGB(1, 1, 1).offsetHSL((c - 0.5) * 0.04, 0, (c - 0.5) * 0.12)); cx += x; cz += z; });
      im.computeBoundingSphere(); im.receiveShadow = true;
      scene.add(im); grassChunks.push({ im, x: cx / arr.length, z: cz / arr.length });
    }
  }

  // ---------- Hoa (mọc thành bụi quanh quảng trường, ven đường, gần các khu) ----------
  const flowerChunks = [];
  {
    const m = new Mesher();
    m.add(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 3), '#4f8a3c', { p: [0, 0.2, 0] });
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; m.add(new THREE.CircleGeometry(0.09, 4), '#ffffff', { p: [Math.cos(a) * 0.08, 0.42, Math.sin(a) * 0.08], r: [-Math.PI / 2 + 0.3, 0, a] }); }
    m.add(ico(0.045), '#ffd23a', { p: [0, 0.45, 0] });
    const geo = m.geometry(), mat = windMaterial({ side: THREE.DoubleSide }, 0.2, 0);
    const pal = CONFIG.colors.flowers.map(c => new THREE.Color(c));
    const centers = [];
    for (let i = 0; i < 70; i++) {
      let x, z;
      if (i < 14) { const a = (i / 14) * Math.PI * 2; x = Math.cos(a) * (CONFIG.world.plazaRadius + 2.5); z = Math.sin(a) * (CONFIG.world.plazaRadius + 2.5); }
      else if (i < 40) { const p = world.layout.paths[i % world.layout.paths.length]; const t = rand(); const side = rand() < 0.5 ? -1 : 1; const L = Math.hypot(p.bx - p.ax, p.bz - p.az); x = p.ax + (p.bx - p.ax) * t + (-(p.bz - p.az) / L) * side * (CONFIG.world.pathWidth + 1.5); z = p.az + (p.bz - p.az) * t + ((p.bx - p.ax) / L) * side * (CONFIG.world.pathWidth + 1.5); }
      else { const a = rand() * 6.28, r = 20 + rand() * 90; x = Math.cos(a) * r; z = Math.sin(a) * r; }
      centers.push([x, z, pal[i % pal.length]]);
    }
    const buckets = new Map(); const per = Math.round(CONFIG.flowers.count / centers.length);
    for (const [cx, cz, col] of centers) for (let k = 0; k < per; k++) {
      const a = rand() * 6.28, r = Math.sqrt(rand()) * 2.2, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      if (world.pathInfo(x, z).d < CONFIG.world.pathWidth * 0.6 || Math.hypot(x, z) < CONFIG.world.plazaRadius + 0.6) continue;
      const h = world.groundAt(x, z); if (h < CONFIG.world.waterLevel + 0.3) continue;
      const key = Math.floor(cx / 40) + ',' + Math.floor(cz / 40);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push([x, h, z, 0.8 + rand() * 0.6, rand() * 6.28, rand() < 0.8 ? col : pal[Math.floor(rand() * pal.length)]]);
    }
    for (const arr of buckets.values()) {
      const im = new THREE.InstancedMesh(geo, mat, arr.length); let cx = 0, cz = 0;
      arr.forEach(([x, y, z, s, r, col], i) => { _o.position.set(x, y, z); _o.rotation.set(0, r, 0); _o.scale.setScalar(s); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix); im.setColorAt(i, col); cx += x; cz += z; });
      im.computeBoundingSphere(); scene.add(im); flowerChunks.push({ im, x: cx / arr.length, z: cz / arr.length });
    }
    ctx.flowerSpots = centers.map(c => [c[0], c[1]]);
  }

  // ---------- Đá ----------
  {
    const m = new Mesher(); m.add(new THREE.DodecahedronGeometry(1, 0), '#8f8a80', { top: '#b3ad9f' });
    const im = new THREE.InstancedMesh(m.geometry(), flatMat(), CONFIG.rocks.count); let n = 0;
    for (let tries = 0; n < CONFIG.rocks.count && tries < 3000; tries++) {
      const near = rand() < 0.35; const a = rand() * 6.28;
      let x, z; if (near) { const P = CONFIG.river.points, k = Math.floor(rand() * (P.length - 1)), t = rand(); x = P[k][0] + (P[k + 1][0] - P[k][0]) * t + (rand() - 0.5) * 16; z = P[k][1] + (P[k + 1][1] - P[k][1]) * t + (rand() - 0.5) * 16; }
      else { const r = 15 + Math.sqrt(rand()) * (half - 15); x = Math.cos(a) * r; z = Math.sin(a) * r; }
      if (!freeSpot(x, z, -1)) continue;
      const big = rand() < 0.18, s = big ? 1.1 + rand() * 1.2 : 0.25 + rand() * 0.5;
      _o.position.set(x, world.groundAt(x, z) + s * 0.15, z); _o.rotation.set(rand(), rand() * 6, rand() * 0.5); _o.scale.set(s * (1 + rand() * 0.4), s * (0.55 + rand() * 0.35), s); _o.updateMatrix();
      im.setMatrixAt(n, _o.matrix); im.setColorAt(n, _c.setRGB(1, 1, 1).offsetHSL(0, -0.02, (rand() - 0.5) * 0.12)); n++;
      if (big) ctx.colliders.push({ x, z, r: s * 0.9 });
    }
    im.count = n; im.castShadow = im.receiveShadow = true; im.computeBoundingSphere(); scene.add(im);
  }

  // ---------- Bướm (chỉ bay gần người chơi) ----------
  const NB = CONFIG.isMobile ? 14 : 24;
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.1, 0, 0, -0.12, 0.22, 0.0, 0.05, 0, 0, -0.12, 0.2, 0, -0.2, 0.22, 0, 0.05], 3));
  const bm = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const bL = new THREE.InstancedMesh(wg, bm, NB), bR = new THREE.InstancedMesh(wg, bm, NB); bL.frustumCulled = bR.frustumCulled = false;
  const bfly = []; const bcol = ['#ffd166', '#ff9fb2', '#9fd8ff', '#ffffff', '#ffb35c'];
  for (let i = 0; i < NB; i++) { bfly.push({ ph: rand() * 10, sp: 0.6 + rand() * 0.6, ax: 0, az: 0, ok: false }); const c = new THREE.Color(bcol[i % bcol.length]); bL.setColorAt(i, c); bR.setColorAt(i, c); }
  scene.add(bL, bR);
  function updateButterflies(t) {
    const p = ctx.player.pos, spots = ctx.flowerSpots;
    const vis = world.state.day > 0.35; bL.visible = bR.visible = vis; if (!vis) return;
    bfly.forEach((b, i) => {
      if (!b.ok || Math.hypot(b.ax - p.x, b.az - p.z) > 45) { // gán lại bụi hoa gần người chơi
        let best = null, bd = 1e9; for (let k = 0; k < spots.length; k++) { const s = spots[(k + i * 7) % spots.length]; const d = Math.hypot(s[0] - p.x, s[1] - p.z) + rand() * 25; if (d < bd) { bd = d; best = s; } }
        if (best) { b.ax = best[0] + (rand() - 0.5) * 4; b.az = best[1] + (rand() - 0.5) * 4; b.ok = true; }
      }
      const tt = t * b.sp + b.ph;
      const x = b.ax + Math.sin(tt * 0.9) * 2.2 + Math.sin(tt * 2.3) * 0.4, z = b.az + Math.cos(tt * 0.7) * 2.2, y = world.groundAt(x, z) + 0.8 + Math.sin(tt * 1.7) * 0.4;
      const flap = Math.sin(t * 22 + i) * 1.1, head = Math.atan2(Math.cos(tt * 0.9), -Math.sin(tt * 0.7));
      for (const [im, s] of [[bL, -1], [bR, 1]]) { _o.position.set(x, y, z); _o.rotation.set(0, head, 0); _o.rotateZ(flap * s); _o.scale.set(s * 0.6, 0.6, 0.6); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix); }
    });
    bL.instanceMatrix.needsUpdate = bR.instanceMatrix.needsUpdate = true;
  }

  // ---------- Cập nhật mỗi khung hình: ẩn cỏ/hoa ở xa, chặt cây, bướm ----------
  let lod = 0;
  function update(dt, t) {
    updateTrees(dt);
    updateButterflies(t);
    if ((lod += dt) > 0.25) {
      lod = 0; const p = ctx.player.pos;
      const gd = CONFIG.grass.viewDist + CONFIG.grass.chunk * 0.7, fd = CONFIG.flowers.viewDist + 25;
      for (const c of grassChunks) c.im.visible = Math.hypot(c.x - p.x, c.z - p.z) < gd;
      for (const c of flowerChunks) c.im.visible = Math.hypot(c.x - p.x, c.z - p.z) < fd;
    }
  }

  return { update, nearestTree, chop, trees };
}
