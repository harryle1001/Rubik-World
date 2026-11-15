// sealife.js — Thế giới biển quanh Đảo Rubik: 6 vùng biển (vịnh nông, rạn san hô, rừng tảo bẹ, hang đá, xác tàu, vùng sâu phát sáng),
//   đàn cá (bơi bằng vertex shader, 0 CPU), cá hề quanh hải quỳ, sứa phát sáng co bóp, rùa biển, cá đuối, cua, cá heo nhảy khỏi mặt nước.
//   "Bách khoa biển": đến gần 1 loài bấm E → thẻ kiến thức (13 loài — số Fibonacci), lưu localStorage 'island.sealife'.
// Hiệu năng: mỗi vùng ≤ 3 draw call (gộp geometry: tĩnh / lay theo nước / phát sáng), chỉ bật trong ~55 m quanh camera khi ở dưới nước
//   hoặc nhìn gần mặt nước; mọi sinh vật là InstancedMesh (cá 2, sứa 1, rùa 1, đuối 1, cua 1, cá heo 1). Máy yếu: giảm số cá/sứa.
// Hợp đồng: chỉ ĐỌC ctx.underwater / ctx.dive (phiên lặn), mực nước CFG.island.waterLevel, đáy biển terrain.heightAt.
// Tỷ lệ vàng: bán kính vùng 21 m, số lượng theo dãy Fibonacci, vật trang trí xếp theo xoắn ốc hoa hướng dương (góc vàng 137,5°).
import * as THREE from 'three';
import { Batch } from './decor.js';
import { PHI, PI, FIB, LAGOON, WORLD } from './layout.js';
import { CFG } from './config.js';
import { gradientMap } from './style.js';
import { loadModel, scatterModel } from './models.js';
import { KIT } from './kit.js';

export const GOLDEN = 2 * PI / (PHI * PHI);   // góc vàng ≈ 137,5°
const ZR = 21, ACT = 55, W = CFG.island.waterLevel, LOW = CFG.isMobile;
const SAVE = 'island.sealife';

// 13 loài trong Bách khoa biển (r: khoảng cách bấm E)
export const SPECIES = [
  { id: 'cahe', icon: '🐠', name: 'Cá hề', r: 3, fact: 'Cá hề sống chung với hải quỳ: lớp nhớt trên da giúp cá không bị xúc tu đốt, đổi lại cá xua đuổi kẻ thù của hải quỳ.' },
  { id: 'haiquy', icon: '🌺', name: 'Hải quỳ', r: 2.6, fact: 'Hải quỳ trông như bông hoa nhưng là động vật! Xúc tu có tế bào châm để bắt mồi nhỏ.' },
  { id: 'sanho', icon: '🪸', name: 'San hô', r: 2.6, fact: 'San hô là quần thể của hàng nghìn con polyp nhỏ xíu. Rạn san hô chiếm chưa tới 1% đáy biển nhưng là nhà của khoảng 1/4 số loài sinh vật biển.' },
  { id: 'dancan', icon: '🐟', name: 'Đàn cá', r: 5, fact: 'Cá bơi theo đàn để an toàn: cả đàn đổi hướng cùng lúc làm kẻ săn mồi bị rối mắt. Cá thở bằng mang, lọc ô-xi hoà tan trong nước.' },
  { id: 'rua', icon: '🐢', name: 'Rùa biển', r: 4, fact: 'Rùa biển thở bằng phổi và nín thở được rất lâu. Rùa cái quay về đúng bãi biển nơi nó nở ra để đẻ trứng.' },
  { id: 'caduoi', icon: '🪁', name: 'Cá đuối', r: 5, fact: 'Cá đuối manta có sải vây tới 7 m, lượn trong nước như cánh diều và ăn sinh vật phù du nhỏ li ti.' },
  { id: 'caheo', icon: '🐬', name: 'Cá heo', r: 13, fact: 'Cá heo là động vật có vú, thở bằng phổi qua lỗ thở trên đỉnh đầu, "nói chuyện" bằng tiếng huýt và tiếng lách cách.' },
  { id: 'sua', icon: '🪼', name: 'Sứa', r: 3.4, fact: 'Sứa không có não, không có tim, cơ thể khoảng 95% là nước. Nhiều loài tự phát sáng. Gặp sứa: đừng chạm vào!' },
  { id: 'cua', icon: '🦀', name: 'Cua', r: 2.6, fact: 'Cua bò ngang vì khớp chân gập sang hai bên. Bộ xương nằm bên ngoài (vỏ cứng) nên cua phải lột xác để lớn lên.' },
  { id: 'saobien', icon: '⭐', name: 'Sao biển', r: 2.2, fact: 'Sao biển không phải là cá! Mất một cánh, sao biển có thể mọc lại cánh mới.' },
  { id: 'caugai', icon: '🦔', name: 'Cầu gai', r: 2.2, fact: 'Cầu gai (nhím biển) dùng hàng trăm chân ống nhỏ để bò và gặm tảo. Gai rất nhọn — đừng giẫm lên!' },
  { id: 'taobe', icon: '🌿', name: 'Tảo bẹ', r: 3, fact: 'Tảo bẹ có thể dài thêm hơn nửa mét mỗi ngày, tạo thành "rừng dưới biển" che chở cho cá và nhiều sinh vật.' },
  { id: 'cobien', icon: '🌱', name: 'Cỏ biển', r: 2.6, fact: 'Cỏ biển là cây có hoa sống dưới nước: nhả ô-xi, giữ cát và là bãi ăn của rùa biển, bò biển.' },
];

// 6 vùng biển; góc đặt nối tiếp nhau theo góc vàng (vòng quanh đảo không trùng nhau). chests: số rương kho báu trong vùng (tổng 13)
export const ZONES = [
  { id: 'lagoon', name: 'Vịnh nông', icon: '🏖️', chests: 2, n: 89 },
  { id: 'reef', name: 'Rạn san hô xanh ngọc', icon: '🪸', ang: PI, depth: 2.5, out: 13, chests: 3, n: 144 },
  { id: 'kelp', name: 'Rừng tảo bẹ', icon: '🌿', ang: PI + GOLDEN, depth: 4, out: 13, chests: 2, n: 89 },
  { id: 'wreck', name: 'Xác tàu đắm', icon: '⚓', ang: PI + 3 * GOLDEN, depth: 4.5, out: 21, chests: 2, n: 55 },
  { id: 'cave', name: 'Hang đá', icon: '🪨', ang: PI + 2 * GOLDEN, depth: 4.5, out: 21, chests: 2, n: 55 },
  { id: 'deep', name: 'Vùng sâu phát sáng', icon: '✨', ang: PI + 4 * GOLDEN, depth: 5, out: 89, chests: 2, n: 89 },
];
const ITEMS = {   // tỷ lệ các loại vật trang trí theo chủ đề vùng
  lagoon: { grass: 45, shell: 15, star: 12, rock: 10, brain: 6, urchin: 5, anem: 3, fan: 4 },
  reef: { branch: 22, brain: 14, table: 8, fan: 10, anem: 6, grass: 14, rock: 8, star: 6, urchin: 5, shell: 7 },
  kelp: { kelp: 45, rock: 20, urchin: 12, grass: 10, star: 8, shell: 5 },
  cave: { rock: 40, fan: 15, anem: 10, brain: 10, urchin: 10, star: 8, shell: 7 },
  wreck: { rock: 20, grass: 20, fan: 12, branch: 12, shell: 12, star: 10, urchin: 8, plank: 6 },
  deep: { glow: 34, rock: 30, fan: 10, urchin: 8, tube: 18 },
};
const CORAL = ['#ff7f6e', '#ff9fc4', '#ffd36e', '#b18cff', '#6fe0d0', '#ff6b4a', '#f5c518'];
const GLOWC = ['#5ff2ff', '#ff5fd2', '#b6ff5f', '#8f9bff'];

function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash3 = (x, y, z, s) => { const v = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + s) * 43758.5453; return v - Math.floor(v); };
function rockGeo(seed, detail = 0) {   // đá méo: đỉnh trùng nhau dịch cùng 1 lượng (hash theo toạ độ) → khối liền, mặt phẳng low-poly
  const g = new THREE.IcosahedronGeometry(1, detail), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 0.78 + 0.34 * hash3(Math.round(x * 100), Math.round(y * 100), Math.round(z * 100), seed); p.setXYZ(i, x * n, y * n, z * n); }
  return g;
}
const _q = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3();
function stick(b, x0, y0, z0, x1, y1, z1, r, col, seg = 5) {   // khúc trụ nối 2 điểm (cành san hô, thân tảo)
  _d.set(x1 - x0, y1 - y0, z1 - z0); const L = _d.length(); _q.setFromUnitVectors(_up, _d.normalize());
  const g = new THREE.CylinderGeometry(r * 0.72, r, L, seg).applyQuaternion(_q).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  b.push(g, col);
}

// Vá vertex shader của MeshToonMaterial (giữ ánh sáng toon + sương mù), dùng chung đồng hồ uTime
const U = { uTime: { value: 0 } };
function patch(mat, key, decl, vert, normal) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = U.uTime;
    let v = 'uniform float uTime;\n' + decl + '\n' + sh.vertexShader;
    if (normal) v = v.replace('#include <beginnormal_vertex>', normal);
    sh.vertexShader = v.replace('#include <begin_vertex>', vert.includes('vec3 transformed') ? vert : '#include <begin_vertex>\n' + vert);
  };
  mat.customProgramCacheKey = () => 'sea-' + key;
  return mat;
}
const toonV = (o = {}) => new THREE.MeshToonMaterial(Object.assign({ vertexColors: true, gradientMap }, o));

export function createSealife(ctx) {
  const { scene, terrain, camera } = ctx; const H = (x, z) => terrain.heightAt(x, z);
  const rand = mulberry(CFG.seed * 1618);
  const found = (() => { try { return JSON.parse(localStorage.getItem(SAVE) || '{}'); } catch (e) { return {}; } })();
  const spots = {}; for (const s of SPECIES) spots[s.id] = [];   // vị trí tĩnh để bấm E
  const inWorld = (x, z, m) => x > WORLD.x0 + m && x < WORLD.x1 - m && z > WORLD.z0 + m && z < WORLD.z1 - m;

  // ---------- Tâm các vùng: đi theo tia từ tâm đảo ra tới chỗ đủ sâu, rồi ra thêm "out" mét ----------
  for (const Z of ZONES) {
    if (Z.id === 'lagoon') { Z.x = LAGOON.x; Z.z = LAGOON.z + LAGOON.r / (PHI * PHI); Z.r = LAGOON.r / PHI; }
    else {
      const c = Math.cos(Z.ang), s = Math.sin(Z.ang); let hit = 0, last = 150;
      for (let r = 150; r < 480; r += 2) { if (!inWorld(c * r, s * r, ZR + 3)) break; last = r; if (!hit && H(c * r, s * r) < W - Z.depth) hit = r; }
      const r = Math.min(hit ? hit + Z.out : last, last); Z.x = c * r; Z.z = s * r; Z.r = ZR;
    }
    Z.y = H(Z.x, Z.z); Z.slots = []; Z.group = new THREE.Group(); Z.group.name = 'sea-' + Z.id; Z.group.visible = false; scene.add(Z.group);
  }

  // ---------- Chỗ đặt rương (treasure.js đọc): rải theo góc vàng, đáy phải ngập nước ----------
  for (const Z of ZONES) {
    const off = Z.id === 'cave' || Z.id === 'wreck' ? 1 : 0;   // hang/xác tàu: rương đầu nằm trong hang / cạnh thân tàu (đặt bên dưới)
    for (let k = off, tries = 0; Z.slots.length < Z.chests - off && tries < 60; k++, tries++) {
      const r = Z.r * (0.38 + 0.5 * ((k * 0.618) % 1)), a = k * GOLDEN + Z.x, x = Z.x + Math.cos(a) * r, z = Z.z + Math.sin(a) * r, h = H(x, z);
      if (h < W - 1.3 && inWorld(x, z, 2)) Z.slots.push({ x, y: h, z, ry: rand() * 6.28, zone: Z });
    }
  }
  const nearSlot = (Z, x, z, m = 1.9) => Z.slots.some(s => (s.x - x) ** 2 + (s.z - z) ** 2 < m * m);

  // ---------- Vật liệu ----------
  const matStatic = toonV({ side: THREE.DoubleSide });
  const matSway = patch(toonV({ side: THREE.DoubleSide }), 'sway', 'attribute float aSway;',
    'transformed.x += sin(uTime*1.3 + position.x*.4 + position.z*.3) * aSway * .42; transformed.z += cos(uTime*1.1 + position.x*.3 - position.z*.2) * aSway * .3;');
  const matGlow = new THREE.MeshBasicMaterial({ vertexColors: true });

  // ---------- Đáy biển trang trí: mỗi vùng 3 lô gộp (tĩnh / lay / phát sáng) ----------
  const anemones = [];
  function pick(table) { let s = 0; for (const k in table) s += table[k]; let v = rand() * s; for (const k in table) { v -= table[k]; if (v <= 0) return k; } return 'rock'; }
  function rock(b, x, y, z, s, col, sy = 1 / PHI) { b.push(rockGeo(rand() * 100), col, x, y + s * sy * 0.45, z, rand() * 6.28, 0, 0, s, s * sy, s * (0.8 + rand() * 0.4)); }
  function place(Z, kind, x, z, st, sw, gl) {
    const y = H(x, z), depth = W - y, c = CORAL[Math.floor(rand() * CORAL.length)], s = 0.7 + rand() * 0.6;
    const deep = Z.id === 'deep';
    switch (kind) {
      case 'rock': rock(st, x, y, z, (0.6 + rand() * 1.4) * (Z.id === 'cave' ? 1.6 : 1), deep ? '#3e4a5a' : (rand() < 0.5 ? '#a9a297' : '#8d8a86')); break;
      case 'brain': st.push(new THREE.IcosahedronGeometry(0.5, 1), c, x, y + 0.12 * s, z, 0, 0, 0, s, s / PHI, s); spots.sanho.push([x, y + 0.3, z]); break;
      case 'table': stick(st, x, y, z, x, y + 0.5 * s, z, 0.09 * s, '#e8b18a'); st.push(new THREE.CylinderGeometry(0.75 * s, 0.6 * s, 0.12, 9), c, x, y + 0.56 * s, z); spots.sanho.push([x, y + 0.5, z]); break;
      case 'branch': {   // san hô cành: thân + 5 cành mở theo góc vàng, đầu cành tròn
        const h0 = 0.35 * s; stick(st, x, y, z, x, y + h0, z, 0.08 * s, c);
        for (let k = 0; k < 5; k++) { const a = k * GOLDEN + rand(), t = 0.5 + rand() * 0.4, L = (0.5 + rand() * 0.4) * s, ex = x + Math.cos(a) * Math.sin(t) * L, ez = z + Math.sin(a) * Math.sin(t) * L, ey = y + h0 + Math.cos(t) * L;
          stick(st, x, y + h0 * 0.8, z, ex, ey, ez, 0.06 * s, c); st.push(new THREE.IcosahedronGeometry(0.07 * s, 0), c, ex, ey, ez); }
        spots.sanho.push([x, y + 0.5, z]); break; }
      case 'fan': sw.push(new THREE.CircleGeometry(0.75 * s, 8, 0, PI), deep ? '#7a4fd0' : (rand() < 0.5 ? '#b14fd0' : '#e8453c'), x, y, z, rand() * 6.28); spots.sanho.push([x, y + 0.5, z]); break;
      case 'anem': {   // hải quỳ: đế + 13 xúc tu (lay theo nước) → có cá hề
        st.push(new THREE.CylinderGeometry(0.22, 0.28, 0.25, 7), '#c4507a', x, y + 0.12, z);
        for (let k = 0; k < 13; k++) { const a = k * GOLDEN, r = 0.06 + 0.16 * Math.sqrt(k / 13); sw.push(new THREE.ConeGeometry(0.04, 0.42, 3), rand() < 0.5 ? '#ff9fc4' : '#ffd0e4', x + Math.cos(a) * r, y + 0.42, z + Math.sin(a) * r, 0, Math.cos(a) * 0.4, Math.sin(a) * 0.4); }
        spots.haiquy.push([x, y + 0.4, z]); anemones.push({ x, y: y + 0.65, z, Z }); break; }
      case 'grass': { const n = 5 + Math.floor(rand() * 4); for (let k = 0; k < n; k++) { const a = rand() * 6.28, r = rand() * 0.3, h = 0.35 + rand() * 0.6; sw.push(new THREE.ConeGeometry(0.05, h, 3), rand() < 0.5 ? '#5fae5a' : '#7cc56a', x + Math.cos(a) * r, y + h / 2, z + Math.sin(a) * r, rand() * 3, (rand() - 0.5) * 0.4); } spots.cobien.push([x, y + 0.3, z]); break; }
      case 'kelp': {   // tảo bẹ: 2 tấm lá chéo nhau cao gần tới mặt nước (chia đoạn để lay mềm)
        const h = Math.max(1.5, depth * (0.55 + rand() * 0.35)), col = rand() < 0.5 ? '#6b8f2a' : '#8aa83a';
        for (const ry of [0, PI / 2]) sw.push(new THREE.PlaneGeometry(0.42, h, 1, 6).translate(0, h / 2, 0), col, x, y, z, ry + rand() * 0.4);
        stick(st, x, y, z, x, y + 0.3, z, 0.06, '#5a6b22'); spots.taobe.push([x, y + h * 0.4, z]); break; }
      case 'star': { const col = ['#ff8a4c', '#e8453c', '#f5c518'][Math.floor(rand() * 3)], r0 = rand() * 6.28;
        for (let k = 0; k < 5; k++) { const a = r0 + k * 2 * PI / 5; st.push(new THREE.ConeGeometry(0.07, 0.3, 3), col, x + Math.cos(a) * 0.13, y + 0.03, z + Math.sin(a) * 0.13, -a + PI / 2, PI / 2, 0, 1, 1, 0.45); }
        spots.saobien.push([x, y + 0.1, z]); break; }
      case 'urchin': { st.push(new THREE.IcosahedronGeometry(0.13, 0), '#3a2440', x, y + 0.1, z);
        for (let k = 0; k < 8; k++) { const a = k * GOLDEN, t = Math.acos(1 - 2 * (k + 0.5) / 8); _d.set(Math.sin(t) * Math.cos(a), Math.abs(Math.cos(t)), Math.sin(t) * Math.sin(a)); stick(st, x, y + 0.1, z, x + _d.x * 0.3, y + 0.1 + _d.y * 0.3, z + _d.z * 0.3, 0.018, '#2a1830', 3); }
        spots.caugai.push([x, y + 0.15, z]); break; }
      case 'shell': st.push(new THREE.ConeGeometry(0.09, 0.2, 6), rand() < 0.5 ? '#f6e2c8' : '#f6c7c0', x, y + 0.06, z, rand() * 6, PI / 2 - 0.3); break;
      case 'plank': st.push(new THREE.BoxGeometry(0.25, 0.06, 1.6 + rand()), '#6b4a2e', x, y + 0.1, z, rand() * 6.28, (rand() - 0.5) * 0.5, (rand() - 0.5) * 0.3); break;
      case 'glow': { const n = 3 + Math.floor(rand() * 3), col = GLOWC[Math.floor(rand() * GLOWC.length)];   // cụm ống phát sáng
        for (let k = 0; k < n; k++) { const a = rand() * 6.28, r = rand() * 0.4, h = 0.4 + rand() * 1.1, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; stick(st, px, y, pz, px, y + h, pz, 0.05, '#2c3446'); gl.push(new THREE.IcosahedronGeometry(0.1, 0), col, px, y + h, pz); }
        spots.sanho.push([x, y + 0.6, z]); break; }
      case 'tube': { const col = GLOWC[Math.floor(rand() * GLOWC.length)]; gl.push(new THREE.IcosahedronGeometry(0.4, 1), col, x, y + 0.1, z, 0, 0, 0, s, s / (PHI * PHI), s); rock(st, x, y, z, 0.8, '#2c3446'); break; }
    }
  }
  function sway(mesh) {   // trọng số lay: càng cao khỏi đáy càng lay mạnh
    const p = mesh.geometry.attributes.position, a = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) a[i] = Math.pow(Math.min(1, Math.max(0, (p.getY(i) - H(p.getX(i), p.getZ(i))) / 5)), 1.2);
    mesh.geometry.setAttribute('aSway', new THREE.BufferAttribute(a, 1));
  }

  for (const Z of ZONES) {
    const st = new Batch('sea-' + Z.id), sw = new Batch('sea-sway'), gl = new Batch('sea-glow');
    const radial = [Z.x / (Math.hypot(Z.x, Z.z) || 1), Z.z / (Math.hypot(Z.x, Z.z) || 1)], perp = [-radial[1], radial[0]];
    if (Z.id === 'cave') {   // hang đá: vòm 21 tảng đá (3 vòng × 7), lối vào nhìn về đảo; 5 cột đá cao theo Fibonacci
      const RA = Math.min(3.6, (W - Z.y) * 0.62);
      for (let s = -1; s <= 1; s++) for (let k = 0; k <= 6; k++) { const th = k / 6 * PI, x = Z.x + perp[0] * Math.cos(th) * RA + radial[0] * s * 2.4, z = Z.z + perp[1] * Math.cos(th) * RA + radial[1] * s * 2.4;
        rock(st, x, Z.y + Math.sin(th) * RA * 0.85 - 0.6, z, 1.5 + rand() * 0.4, rand() < 0.5 ? '#8d8a86' : '#76726c', 0.9); }
      Z.slots.unshift({ x: Z.x, y: Z.y, z: Z.z, ry: Math.atan2(radial[0], radial[1]), zone: Z, note: 'trong hang' });
      [2, 3, 5, 3, 2].forEach((fh, k) => { const a = k * GOLDEN + 1, r = 9 + k * 2, x = Z.x + Math.cos(a) * r, z = Z.z + Math.sin(a) * r, y0 = H(x, z), top = Math.min(fh, (W - y0) * 0.8);
        for (let yy = 0, s = 1.3; yy < top; yy += s * 0.62, s *= 0.9) rock(st, x + (rand() - 0.5) * 0.3, y0 + yy, z + (rand() - 0.5) * 0.3, s, '#8d8a86', 0.7); });
    }
    if (Z.id === 'wreck') {   // xác tàu: thuyền buồm cổ (kit CC0) nằm nghiêng, ván vỡ, mỏ neo, thùng gỗ
      const yaw = Math.atan2(perp[0], perp[1]) + 0.4, s = 1.3, Hs = 9.96 * s, roll = Math.acos(Math.min(1, ((W - Z.y) * 0.85 + 0.9 * s) / Hs));
      loadModel(KIT + 'boat_pirate_small').then(m => { if (!m) return; m.scale.setScalar(s); m.position.set(Z.x, Z.y - 0.9 * s, Z.z); m.rotation.set(0.12, yaw, roll, 'YXZ'); m.traverse(o => { if (o.isMesh) { o.castShadow = false; o.material = o.material.clone(); o.material.color.multiplyScalar(0.78); } }); Z.group.add(m); });
      const dx = Math.cos(yaw), dz = -Math.sin(yaw);   // phía boong (sườn tàu nghiêng)
      Z.slots.unshift({ x: Z.x + dx * 3.2, y: H(Z.x + dx * 3.2, Z.z + dz * 3.2), z: Z.z + dz * 3.2, ry: yaw, zone: Z, note: 'cạnh khoang tàu' });
      const ax = Z.x - dx * 6 + Math.sin(yaw) * 4, az = Z.z - dz * 6 + Math.cos(yaw) * 4, ay = H(ax, az);   // mỏ neo
      st.group(ax, ay, az, rand() * 6.28, () => { st.cyl(0.07, 0.07, 1.6, 0, 0.1, 0, '#5b5550', 6, 0, 0, 0.5); st.push(new THREE.TorusGeometry(0.45, 0.06, 4, 8, PI), '#5b5550', -0.45, 0.25, 0, 0, 0, PI + 0.5); st.push(new THREE.TorusGeometry(0.16, 0.04, 4, 8), '#5b5550', 0.62, 1.55, 0, 0, 0, 0.5); });
      const br = []; for (let k = 0; k < 3; k++) { const a = rand() * 6.28, r = 6 + rand() * 4, x = Z.x + Math.cos(a) * r, z = Z.z + Math.sin(a) * r; br.push([x, H(x, z) - 0.1, z, 2.6, rand() * 6.28]); }
      scatterModel(Z.group, KIT + 'barrels', br).then(l => l.forEach(m => { m.castShadow = false; }));
    }
    if (Z.id === 'lagoon') {   // vịnh nông: thuyền chèo nhỏ chìm một nửa trong cát
      const a = 2.2, x = Z.x + Math.cos(a) * 9, z = Z.z + Math.sin(a) * 9;
      if (H(x, z) < W - 1) scatterModel(Z.group, KIT + 'boat_row_small', [[x, H(x, z) - 0.35, z, 1.8, 0.7]]).then(l => l.forEach(m => { m.castShadow = false; }));
    }
    const n = Math.round(Z.n * (LOW ? 1 / PHI : 1)), rad = Z.id === 'lagoon' ? LAGOON.r * 0.9 : Z.r * 1.15;
    for (let i = 0; i < n; i++) {   // xoắn ốc hoa hướng dương (Vogel): r ∝ √i, góc = i·góc vàng
      const r = rad * Math.sqrt((i + 0.5) / n), a = i * GOLDEN + (rand() - 0.5) * 0.3, x = Z.x + Math.cos(a) * r + (rand() - 0.5), z = Z.z + Math.sin(a) * r + (rand() - 0.5);
      if (H(x, z) > W - 0.8 || nearSlot(Z, x, z) || !inWorld(x, z, 1)) continue;
      if (Z.id === 'cave' && Math.hypot(x - Z.x, z - Z.z) < 5) continue;   // giữ trống lòng hang
      place(Z, pick(ITEMS[Z.id]), x, z, st, sw, gl);
    }
    const a = st.mesh(matStatic, false), b = sw.mesh(matSway, false), c = gl.mesh(matGlow, false);
    if (b) sway(b);
    for (const m of [a, b, c]) if (m) { m.receiveShadow = false; Z.group.add(m); }
  }

  // ---------- Đàn cá: toàn bộ chuyển động trong vertex shader (quỹ đạo hình số 8 Lissajous, vẫy đuôi) ----------
  const schools = [];   // { home, rx, rz, sp, ph, n, col, size, clown }
  const school = (Z, n, col, size, rMul = 1, yUp = 0.5) => {
    const rx = Z.r * (0.35 + rand() * 0.3) * rMul, rz = Z.r * (0.25 + rand() * 0.25) * rMul, sp = (0.9 + rand() * 0.6) / Math.max(3, rx), ph = rand() * 6.28;
    let floor = -99; for (let k = 0; k < 8; k++) { const t = k / 8 * 6.28; floor = Math.max(floor, H(Z.x + rx * Math.sin(t), Z.z + rz * Math.sin(2 * t) * 0.5)); }
    const y = Math.min(W - 1.3, floor + 1.4 + (W - 1.3 - floor - 1.4) * yUp * rand());
    schools.push({ home: new THREE.Vector3(Z.x, y, Z.z), rx, rz, sp, ph, n: Math.round(n * (LOW ? 1 / PHI : 1)), col, size, Z });
  };
  const z0 = n => ZONES.find(z => z.id === n);
  school(z0('lagoon'), 13, '#c9d6df', 0.26); school(z0('lagoon'), 8, '#ffd23f', 0.22, 0.6);
  school(z0('reef'), 21, '#ffd23f', 0.3); school(z0('reef'), 13, '#2f6bff', 0.34); school(z0('reef'), 13, '#ff7f9a', 0.26, 0.7);
  school(z0('kelp'), 21, '#c9d6df', 0.36, 1, 0.8); school(z0('kelp'), 8, '#3fa9f5', 0.3, 0.6);
  school(z0('wreck'), 21, '#9fb0bd', 0.42, 1, 0.7); school(z0('cave'), 13, '#ffb03a', 0.3, 0.8); school(z0('deep'), 8, '#7fe3ff', 0.34);
  const clowns = anemones.filter(a => a.Z.id === 'reef' || a.Z.id === 'lagoon').slice(0, 5).map(a => ({ home: new THREE.Vector3(a.x, a.y, a.z), rx: 0.55, rz: 0.55, sp: 1.3, ph: rand() * 6.28, n: 3, col: '#ffffff', size: 0.2, clown: true, Z: a.Z }));
  const fishBody = (clown) => {
    const b = new Batch('fish'), body = clown ? '#ff7a1a' : '#ffffff';
    b.push(new THREE.IcosahedronGeometry(0.5, 1), body, 0, 0, 0, 0, 0, 0, 0.32, 0.56, 1);
    b.push(new THREE.ConeGeometry(0.32, 0.4, 3), body, 0, 0, -0.62, 0, PI / 2, 0, 0.2, 1, 1);
    b.push(new THREE.ConeGeometry(0.16, 0.26, 3), body, 0, 0.3, -0.05, 0, -0.5, 0, 0.22, 1, 1);
    for (const s of [-1, 1]) b.push(new THREE.IcosahedronGeometry(0.06, 0), '#1b1626', s * 0.13, 0.08, 0.34);
    if (clown) for (const zz of [0.18, -0.2]) b.push(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 8), '#ffffff', 0, 0, zz, 0, PI / 2, 0, 0.34, 1, 0.6);
    return b.mesh(null).geometry;
  };
  const matFish = patch(toonV(), 'fish', `attribute vec3 aHome; attribute vec4 aOrb; attribute vec4 aOff;
    vec3 fishC(float t){ return aHome + vec3(aOrb.x * sin(t), .6 * sin(t * 1.618), aOrb.y * sin(2. * t) * .5); }`,
    `vec3 p = position * aOff.w; p.x += sin(uTime * (7. + aOrb.z * 30.) + aOff.z * 9.) * .16 * max(0., -position.z + .1) * aOff.w;
     vec3 o = aOff.xyz + vec3(sin(uTime * 1.3 + aOff.z * 5.) * .15, sin(uTime * 1.7 + aOff.x * 4.) * .1, 0.);
     vec3 transformed = fC + fR * (o.x + p.x) + fU * (o.y + p.y) + fF * (o.z + p.z);`,
    `float ft = uTime * aOrb.z + aOrb.w; vec3 fC = fishC(ft); vec3 fF = normalize(fishC(ft + .05) - fC + vec3(1e-4, 0., 0.));
     vec3 fR = normalize(cross(vec3(0., 1., 0.), fF)); vec3 fU = cross(fF, fR);
     vec3 objectNormal = fR * normal.x + fU * normal.y + fF * normal.z;`);
  function fishMesh(list, clown) {
    const fish = []; for (const S of list) for (let k = 0; k < S.n; k++) fish.push({ S, k });
    fish.sort((a, b) => a.k - b.k);   // xếp theo thứ tự trong đàn → giảm count (máy yếu) bớt cá ở cuối mỗi đàn
    const N = fish.length, g = fishBody(clown), aH = new Float32Array(N * 3), aO = new Float32Array(N * 4), aF = new Float32Array(N * 4);
    const m = new THREE.InstancedMesh(g, matFish, N), c = new THREE.Color();
    fish.forEach(({ S, k }, i) => {
      aH.set([S.home.x, S.home.y, S.home.z], i * 3); aO.set([S.rx, S.rz, S.sp, S.ph], i * 4);
      const rr = clown ? 0.25 : Math.sqrt(k) * S.size * 1.6, a = k * GOLDEN;   // xếp đàn theo xoắn ốc vàng (đầu đàn ở giữa)
      aF.set([Math.cos(a) * rr, (rand() - 0.5) * rr * 0.6, Math.sin(a) * rr - (clown ? 0 : k * 0.04), S.size * (0.85 + rand() * 0.3)], i * 4);
      m.setColorAt(i, c.set(S.col).offsetHSL((rand() - 0.5) * 0.03, 0, (rand() - 0.5) * 0.08));
    });
    g.setAttribute('aHome', new THREE.InstancedBufferAttribute(aH, 3)); g.setAttribute('aOrb', new THREE.InstancedBufferAttribute(aO, 4)); g.setAttribute('aOff', new THREE.InstancedBufferAttribute(aF, 4));
    m.frustumCulled = false; m.visible = false; m.name = 'sea-fish'; m.userData.full = N; scene.add(m); return m;
  }
  const fishM = fishMesh(schools, false), clownM = fishMesh(clowns, true);
  const schoolC = (S, out) => { const t = U.uTime.value * S.sp + S.ph; return out.set(S.home.x + S.rx * Math.sin(t), S.home.y + 0.6 * Math.sin(t * 1.618), S.home.z + S.rz * Math.sin(2 * t) * 0.5); };

  // ---------- Sứa phát sáng: co bóp + trôi trong shader, cộng màu (additive) ----------
  const jellies = [];
  const jz = { deep: 13, reef: 3, kelp: 2, wreck: 3 };
  for (const id in jz) { const Z = z0(id); for (let k = 0; k < Math.round(jz[id] * (LOW ? 1 / PHI : 1)); k++) { const a = k * GOLDEN + rand(), r = Z.r * Math.sqrt((k + 0.5) / jz[id]) * 0.9, x = Z.x + Math.cos(a) * r, z = Z.z + Math.sin(a) * r, f = H(x, z);
    jellies.push({ x, y: f + 1.5 + (W - 2.3 - f - 1.5) * rand(), z, ph: rand() * 6.28, sp: 0.8 + rand() * 0.5, s: 0.35 + rand() * 0.35, col: GLOWC[k % 4] }); } }
  const jellyGeo = (() => {
    const b = new Batch('jelly'); b.push(new THREE.SphereGeometry(0.5, 10, 4, 0, PI * 2, 0, PI / 2), '#ffffff');
    b.push(new THREE.ConeGeometry(0.09, 0.8, 4), '#bbbbbb', 0, -0.4, 0, 0, PI);
    for (let k = 0; k < 5; k++) { const a = k * 2 * PI / 5; b.push(new THREE.ConeGeometry(0.035, 1.3, 3), '#888888', Math.cos(a) * 0.3, -0.65, Math.sin(a) * 0.3, 0, PI); }
    return b.mesh(null).geometry;
  })();
  const jellyU = { uTime: U.uTime, uGlow: { value: 0.7 } };
  const jellyM = new THREE.InstancedMesh(jellyGeo, new THREE.ShaderMaterial({
    uniforms: jellyU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `uniform float uTime; attribute vec3 aHome; attribute vec4 aJ; attribute vec3 aCol; attribute vec3 color; varying vec3 vC;
      void main(){ float ph = uTime * aJ.y + aJ.x, pulse = sin(ph * 2.); vec3 p = position;
        if (p.y > -.02) { p.xz *= 1. + .18 * pulse; p.y *= 1. - .16 * pulse; } else { p.x += sin(ph * 1.5 + p.y * 3.) * .12 * -p.y; p.z += cos(ph * 1.3 + p.y * 2.5) * .1 * -p.y; }
        vec3 w = aHome + vec3(sin(ph * .21) * 1.5, sin(ph * .5) * .8, cos(ph * .17) * 1.5) + p * aJ.z;
        vC = aCol * color.r * (p.y > -.02 ? .55 + .25 * (1. - pulse) : .35); gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.); }`,
    fragmentShader: 'uniform float uGlow; varying vec3 vC; void main(){ gl_FragColor = vec4(vC * uGlow, 1.); }',
  }), Math.max(1, jellies.length));
  {
    const N = jellies.length, aH = new Float32Array(N * 3), aJ = new Float32Array(N * 4), aC = new Float32Array(N * 3), c = new THREE.Color();
    jellies.forEach((j, i) => { aH.set([j.x, j.y, j.z], i * 3); aJ.set([j.ph, j.sp, j.s, 0], i * 4); c.set(j.col); aC.set([c.r, c.g, c.b], i * 3); });
    jellyGeo.setAttribute('aHome', new THREE.InstancedBufferAttribute(aH, 3)); jellyGeo.setAttribute('aJ', new THREE.InstancedBufferAttribute(aJ, 4)); jellyGeo.setAttribute('aCol', new THREE.InstancedBufferAttribute(aC, 3));
    jellyM.count = N; jellyM.frustumCulled = false; jellyM.visible = false; jellyM.renderOrder = 6; jellyM.name = 'sea-jelly'; scene.add(jellyM);
  }
  const jellyPos = (j, out) => { const ph = U.uTime.value * j.sp + j.ph; return out.set(j.x + Math.sin(ph * 0.21) * 1.5, j.y + Math.sin(ph * 0.5) * 0.8, j.z + Math.cos(ph * 0.17) * 1.5); };

  // ---------- Rùa biển, cá đuối, cá heo (vẫy vây trong shader), cua (CPU, vài con) ----------
  const geo = fn => { const b = new Batch('sea-animal'); fn(b); return b.mesh(null).geometry; };
  const turtleG = geo(b => {
    b.push(new THREE.IcosahedronGeometry(0.6, 1), '#7a8f4a', 0, 0.05, 0, 0, 0, 0, 1, 0.36, 1.25); b.push(new THREE.IcosahedronGeometry(0.6, 1), '#e8d9a8', 0, -0.04, 0, 0, 0, 0, 0.9, 0.15, 1.1);
    b.push(new THREE.IcosahedronGeometry(0.2, 0), '#a8b878', 0, 0.04, 0.9, 0, 0, 0, 1, 0.8, 1.2);
    for (const s of [-1, 1]) { b.push(new THREE.BoxGeometry(1, 0.06, 0.32), '#93a86a', s * 0.95, 0, 0.35, s * 0.45); b.push(new THREE.BoxGeometry(0.4, 0.05, 0.22), '#93a86a', s * 0.45, 0, -0.75, -s * 0.5); }
  });
  const rayG = geo(b => {
    b.push(new THREE.ConeGeometry(1, 0.22, 4), '#3b4258', 0, 0.06, 0, 0, 0, 0, 1.6, 1, 1); b.push(new THREE.ConeGeometry(1, 0.08, 4), '#e8eef2', 0, -0.02, 0, 0, PI, 0, 1.5, 1, 0.95);
    b.push(new THREE.ConeGeometry(0.05, 1.6, 3), '#2b3044', 0, 0, -1.7, 0, -PI / 2);
    for (const s of [-1, 1]) b.push(new THREE.ConeGeometry(0.08, 0.35, 3), '#3b4258', s * 0.32, 0, 1.0, 0, PI / 2);
  });
  const dolphinG = geo(b => {
    b.push(new THREE.IcosahedronGeometry(0.5, 1), '#7d93a8', 0, 0, 0, 0, 0, 0, 0.62, 0.6, 2.2); b.push(new THREE.IcosahedronGeometry(0.5, 1), '#d9e2ea', 0, -0.08, 0.1, 0, 0, 0, 0.5, 0.42, 1.8);
    b.push(new THREE.ConeGeometry(0.12, 0.4, 6), '#7d93a8', 0, -0.04, 1.25, 0, PI / 2); b.push(new THREE.ConeGeometry(0.22, 0.45, 3), '#6d8398', 0, 0.42, -0.1, 0, -0.6, 0, 0.25, 1, 1);
    b.push(new THREE.BoxGeometry(0.9, 0.05, 0.3), '#6d8398', 0, 0, -1.25);
    for (const s of [-1, 1]) { b.push(new THREE.BoxGeometry(0.35, 0.04, 0.18), '#6d8398', s * 0.32, -0.15, 0.35, s * 0.6, 0, s * 0.4); b.push(new THREE.IcosahedronGeometry(0.05, 0), '#1b1626', s * 0.22, 0.08, 0.78); }
  });
  const crabG = geo(b => {
    b.push(new THREE.IcosahedronGeometry(0.2, 0), '#e8453c', 0, 0.1, 0, 0, 0, 0, 1.3, 0.55, 1);
    for (const s of [-1, 1]) { b.push(new THREE.IcosahedronGeometry(0.09, 0), '#f06a4c', s * 0.3, 0.12, 0.2, 0, 0, 0, 1, 0.7, 1.3); b.push(new THREE.IcosahedronGeometry(0.03, 0), '#1b1626', s * 0.07, 0.22, 0.15);
      for (const zz of [-0.1, 0, 0.1]) b.push(new THREE.BoxGeometry(0.24, 0.03, 0.03), '#c63a32', s * 0.3, 0.05, zz, 0, 0, s * 0.45); }
  });
  const matTurtle = patch(toonV(), 'turtle', '', 'transformed.y += sin(uTime * 2.4 + float(gl_InstanceID) * 1.7) * max(0., abs(position.x) - .5) * .6;');
  const matRay = patch(toonV(), 'ray', '', 'float rw = max(0., abs(position.x) - .25); transformed.y += sin(uTime * 1.8 - abs(position.x) * 1.2 + float(gl_InstanceID) * 2.) * rw * .4; transformed.x += sin(uTime * 2. + float(gl_InstanceID)) * .25 * max(0., -position.z - .7);');
  const matDolphin = patch(toonV(), 'dolphin', '', 'transformed.y += sin(uTime * 7. + float(gl_InstanceID) * 2.) * max(0., -position.z - .5) * .22;');
  const mk = (g, m, n, name) => { const im = new THREE.InstancedMesh(g, m, n); im.frustumCulled = false; im.visible = false; im.name = name; scene.add(im); return im; };
  const swimmers = [   // bơi vòng quanh tâm vùng
    { kind: 'rua', Z: z0('lagoon'), r: 9, y: 0.9, v: 0.7 }, { kind: 'rua', Z: z0('reef'), r: 13, y: 2, v: 0.8 }, { kind: 'rua', Z: z0('kelp'), r: 11, y: 2.4, v: 0.75 },
    { kind: 'caduoi', Z: z0('deep'), r: 13, y: 1.3, v: 1.1 }, { kind: 'caduoi', Z: z0('cave'), r: 15, y: 1.6, v: 1 },
  ].map((s, i) => Object.assign(s, { ph: i * GOLDEN, pos: new THREE.Vector3(), dir: i % 2 ? 1 : -1 }));
  const turtleM = mk(turtleG, matTurtle, 3, 'sea-turtle'), rayM = mk(rayG, matRay, 2, 'sea-ray');
  const crabs = []; for (const [id, n] of [['reef', 5], ['lagoon', 3], ['wreck', 3], ['cave', 2]]) { const Z = z0(id); for (let k = 0; k < n; k++) { for (let t = 0; t < 13; t++) { const a = rand() * 6.28, r = 3 + rand() * Z.r * 0.8, x = Z.x + Math.cos(a) * r, z = Z.z + Math.sin(a) * r; if (H(x, z) < W - 0.8) { crabs.push({ x, z, ry: rand() * 6.28, ph: rand() * 6.28, pos: new THREE.Vector3(x, H(x, z), z), Z }); break; } } } }
  const crabM = mk(crabG, toonV(), crabs.length, 'sea-crab');
  const dolphins = [0, 1, 2].map(i => ({ ph: i * 0.29, off: (i - 1) * 2.2, pos: new THREE.Vector3() })); const dolM = mk(dolphinG, matDolphin, 3, 'sea-dolphin');
  let dHome = null, dT = 0, dSplash = [0, 0, 0];

  // ---------- Cập nhật ----------
  const _o = new THREE.Object3D(), _v = new THREE.Vector3(), _w = new THREE.Vector3();
  let T = 0, active = [];
  const flag = () => { try { localStorage.setItem(SAVE, JSON.stringify(found)); } catch (e) {} };
  function discover(s) {
    const isNew = !found[s.id]; if (isNew) { found[s.id] = Date.now(); flag(); }
    const n = Object.keys(found).length;
    ctx.toast(`📘 <b>Bách khoa biển${isNew ? ` · loài mới ${n}/${SPECIES.length}` : ''}</b><br>${s.icon} <b>${s.name}</b><br><small>${s.fact}</small>`, 8000);
    if (isNew) { ctx.sfx && ctx.sfx('ok'); if (n === SPECIES.length) setTimeout(() => ctx.toast('🏅 <b>Nhà sinh vật biển nhí!</b> Bạn đã khám phá đủ 13 loài — 13 là một số Fibonacci.', 8000), 8200); }
    api.onDiscover && api.onDiscover(s, n);
  }
  function update(dt) {
    T += dt; U.uTime.value = T;
    const cam = camera.position, p = ctx.player.pos, under = !!ctx.underwater || cam.y < W - 0.1, q = ctx.qualityLevel || 0;
    // bật vùng gần camera: dưới nước (55 m) hoặc nhìn gần mặt nước (vịnh/từ thuyền)
    active = [];
    for (const Z of ZONES) { const d = Math.hypot(cam.x - Z.x, cam.z - Z.z) - Z.r; const on = under ? d < ACT : cam.y < 13 && d < 34; Z.group.visible = on; if (on) active.push(Z); }
    const any = active.length > 0;
    fishM.visible = clownM.visible = jellyM.visible = turtleM.visible = rayM.visible = crabM.visible = any;
    if (any) {
      fishM.count = q >= 2 ? Math.round(fishM.userData.full / PHI) : fishM.userData.full;
      jellyU.uGlow.value = 0.62 + 0.38 * (ctx.sky ? ctx.sky.state.night : 0);
      let ti = 0, ri = 0;
      for (const s of swimmers) {
        const a = T * s.v / s.r * s.dir + s.ph, Z = s.Z; s.pos.set(Z.x + Math.cos(a) * s.r, 0, Z.z + Math.sin(a) * s.r);
        s.pos.y = Math.min(W - 0.9, H(s.pos.x, s.pos.z) + s.y + Math.sin(T * 0.4 + s.ph) * 0.4);
        _o.position.copy(s.pos); _o.rotation.set(0, a + (s.dir > 0 ? 0 : PI), Math.sin(T * 0.7 + s.ph) * 0.12, 'YXZ'); _o.scale.setScalar(s.kind === 'rua' ? 1.1 : 1.3); _o.updateMatrix();
        if (s.kind === 'rua') turtleM.setMatrixAt(ti++, _o.matrix); else rayM.setMatrixAt(ri++, _o.matrix);
      }
      turtleM.instanceMatrix.needsUpdate = rayM.instanceMatrix.needsUpdate = true;
      crabs.forEach((c, i) => {   // cua bò ngang qua lại, thỉnh thoảng đứng nghỉ
        const k = Math.sin(T * 0.6 + c.ph), m = Math.max(-1, Math.min(1, k * 1.6)) * 0.9;
        const x = c.x + Math.cos(c.ry) * m, z = c.z - Math.sin(c.ry) * m; c.pos.set(x, H(x, z), z);
        _o.position.copy(c.pos); _o.rotation.set(0, c.ry, Math.abs(k) < 0.6 ? Math.sin(T * 14 + i) * 0.05 : 0); _o.scale.setScalar(0.8); _o.updateMatrix(); crabM.setMatrixAt(i, _o.matrix);
      });
      crabM.instanceMatrix.needsUpdate = true;
    }
    // cá heo: tìm vùng nước sâu gần người chơi (thấy từ bờ / thuyền), bơi vòng, lần lượt nhảy khỏi mặt nước
    dT -= dt;
    if (dT <= 0) { dT = 5; if (!dHome || Math.hypot(dHome.x - p.x, dHome.z - p.z) > 70 || Math.hypot(dHome.x - p.x, dHome.z - p.z) < 13) {
      dHome = null; for (let k = 0; k < 13; k++) { const a = rand() * 6.28, r = 21 + rand() * 34, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r; if (H(x, z) < W - 4 && H(x + 13, z) < W - 3 && H(x - 13, z) < W - 3 && H(x, z + 13) < W - 3 && H(x, z - 13) < W - 3) { dHome = { x, z }; break; } } } }
    dolM.visible = !!dHome && q < 3 && (ctx.sky ? ctx.sky.state.night < 0.7 : true);
    if (dolM.visible) {
      dolphins.forEach((d, i) => {
        const a = T * 0.11 + d.ph, R = 13 + d.off, x = dHome.x + Math.cos(a) * R, z = dHome.z + Math.sin(a) * R, c = (T * 0.13 + d.ph * 1.7) % 1;
        let y = -0.8, pitch = Math.sin(T * 1.5 + i) * 0.08;
        if (c < 0.1) { const k = c / 0.1; y = -0.8 + Math.sin(k * PI) * 2.6; pitch = (0.5 - k) * 2.4; if (k > 0.92 && !dSplash[i]) { dSplash[i] = 1; if (Math.hypot(x - p.x, z - p.z) < 40) ctx.sfx && ctx.sfx('splash'); } } else dSplash[i] = 0;
        d.pos.set(x, y, z); _o.position.copy(d.pos); _o.rotation.set(-pitch, a + PI, 0, 'YXZ'); _o.scale.setScalar(1.2); _o.updateMatrix(); dolM.setMatrixAt(i, _o.matrix);
      });
      dolM.instanceMatrix.needsUpdate = true;
    }
    // Bách khoa biển: loài gần nhất trong tầm bấm (nút E, ưu tiên thấp hơn rương)
    api.near = null; if (!any && !dolM.visible) return;
    let best = null, bd = 1e9; const test = (s, x, y, z) => { const d = (x - p.x) ** 2 + (y - p.y) ** 2 + (z - p.z) ** 2; if (d < s.r * s.r && d < bd) { bd = d; best = s; } };
    const S = id => SPECIES.find(s => s.id === id);
    if (any) {
      for (const s of SPECIES) for (const sp of spots[s.id]) test(s, sp[0], sp[1], sp[2]);
      for (const sc of schools) { schoolC(sc, _v); test(S('dancan'), _v.x, _v.y, _v.z); }
      for (const sc of clowns) { schoolC(sc, _v); test(S('cahe'), _v.x, _v.y, _v.z); }
      for (const j of jellies) { jellyPos(j, _w); test(S('sua'), _w.x, _w.y, _w.z); }
      for (const s of swimmers) test(S(s.kind), s.pos.x, s.pos.y, s.pos.z);
      for (const c of crabs) test(S('cua'), c.pos.x, c.pos.y, c.pos.z);
    }
    if (dolM.visible) for (const d of dolphins) { const s = S('caheo'), dd = (d.pos.x - p.x) ** 2 + (d.pos.z - p.z) ** 2; if (dd < s.r * s.r && dd < bd) { bd = dd; best = s; } }
    api.near = best;
    if (best) ctx.offer(`📘 ${best.icon} ${found[best.id] ? best.name : 'Khám phá: ' + best.name}`, () => discover(best), -1);
  }
  const api = { update, ZONES, SPECIES, found, discover, near: null, fish: fishM, jellies: jellyM, get active() { return active; },
    slots: ZONES.flatMap(Z => Z.slots.slice(0, Z.chests)) };
  return api;
}
