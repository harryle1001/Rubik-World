// academy/forest.js — RỪNG PHÉP THUẬT (thuỳ đất phía tây đảo Học viện, sau Tháp Gió): nền rừng, cổng đá cổ, đường mòn đèn lồng,
// cây cổ thụ khổng lồ (model CC0 Quaternius qua terrain.nature), nấm phát sáng + hoa đổi màu + đèn lồng (Kenney CC0, placeKit),
// dây leo, sương tím, đom đóm. Hồ + sinh vật + bí mật: forest-lake.js, forest-life.js, forest-secrets.js (cắm qua plug()).
// Chunk riêng: dựng khi cách mép rừng < 233 m, dỡ khi > 377 m. Toạ độ: nhóm đặt ở gốc thế giới (x = C0 + v, z = C1 + u).
// Tỷ lệ φ/Fibonacci: rừng r 144 · hồ r 34 · đường dạo r 39,5 rộng 5 · đèn 13 m/cây · cổ thụ 8 cây cao 34–55 m · nấm 55 · hoa 89.
import * as THREE from 'three';
import { CFG } from '../config.js';
import { matV } from '../sample/palette.js';
import { toon } from '../style.js';
import { placeKit } from '../kit.js';
import { Batch } from './geo.js';
import { terrainGeo, GRID } from './island.js';
import { FOREST, CLIFF, lakeAt, forestDist, toWorld, toLocal, PLAT } from './plan.js';
import { L as CL } from './castle.js';

const FL = FOREST.lake, M = CFG.isMobile, GA = Math.PI * (3 - Math.sqrt(5));
const LOAD = 233, UNLOAD = 377;
export const FOREST_NAME = 'Rừng Phép Thuật';
// đường mòn từ cổng đá tới đường dạo quanh hồ (u, v)
export const GATE_PATH = [[-34, -252], [-27, -276], [-41, -306], [-30, -330], [-34, -349]];
const soft = c0 => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, c0); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); };
export const glowTex = soft('#ffffff');

export function createForest(ctx) {
  const { scene, player, terrain } = ctx, H = (u, v) => { const [x, z] = toWorld(u, v); return terrain.heightAt(x, z); };
  const night = () => (ctx.sky && ctx.sky.state ? ctx.sky.state.night || 0 : 0);
  let s = 377; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const curve = new THREE.CatmullRomCurve3(GATE_PATH.map(([u, v]) => new THREE.Vector3(v, 0, u)));
  const pathPts = curve.getSpacedPoints(55).map(p => [p.z, p.x]);                         // [u, v]
  const pathDist = (u, v) => { let d = 1e9; for (const [a, b] of pathPts) d = Math.min(d, (a - u) ** 2 + (b - v) ** 2); return Math.sqrt(d); };
  const lakeR = (u, v) => Math.hypot(u - FL.u, v - FL.v);
  const [cu, cv] = lakeAt(CLIFF.th, CLIFF.r), cliffD = (u, v) => Math.hypot(u - cu, v - cv);
  const plugs = []; let F = null, planted = false, greeted = false, inside = false;

  // ---------- trồng cây (1 lần, vào bộ instancing chung của terrain.js: có LOD + cắt theo khung nhìn, không thêm draw call) ----------
  const giants = [];   // [x, y, z, cao]
  function plant() {
    s = 610; const tints = ['#9b7fd4', '#7a6fd0', '#6fc7c0', '#e59ac9', '#5fae8c', '#8fd1a8'], add = {}, cols = ctx.colliders;
    const put = (kind, u, v, sc, col) => { const [x, z] = toWorld(u, v), y = H(u, v) - 0.3; (add[kind] = add[kind] || []).push([x, y, z, sc, rnd() * 6.28, col]); cols.push({ x, z, r: (kind === 'pine' ? 0.1 : 0.13) * sc }); return [x, y, z]; };
    for (let i = 0; i < 8; i++) {   // 8 cổ thụ khổng lồ theo góc vàng quanh hồ, tránh vách thác + đường mòn
      for (let k = 0; k < 21; k++) {
        const a = i * GA + k * 0.3, r = 62 + (i % 3) * 13 + rnd() * 8, u = FL.u + Math.cos(a) * r, v = FL.v + Math.sin(a) * r;
        if (forestDist(u, v) > -21 || cliffD(u, v) < 21 || pathDist(u, v) < 13) continue;
        const sc = 26 + (i % 3) * 8, p = put(i % 2 ? 'round' : 'oak', u, v, sc, tints[i % tints.length]); giants.push([...p, sc * (i % 2 ? 1.5 : 1.23)]); break;
      }
    }
    const N = M ? 89 : 144;
    for (let k = 0; k < N * 6 && Object.values(add).reduce((a, b) => a + b.length, 0) < N + giants.length; k++) {
      const a = rnd() * 6.283, r = Math.sqrt(rnd()) * FOREST.r, u = FOREST.u + Math.cos(a) * r, v = FOREST.v + Math.sin(a) * r;
      if (forestDist(u, v) > -13 || lakeR(u, v) < FL.ring + 13 || cliffD(u, v) < CLIFF.cr + 4 || pathDist(u, v) < 6) continue;
      if (H(u, v) < 2) continue;
      const q = rnd(), kind = q < 0.34 ? 'oak' : q < 0.6 ? 'round' : q < 0.8 ? 'birch' : 'pine';
      put(kind, u, v, (kind === 'pine' ? 4.2 : 5.5) + rnd() * 4, tints[Math.floor(rnd() * tints.length)]);
    }
    for (const k in add) terrain.nature.add(k, add[k]);
    const ferns = [], tufts = [];
    for (let k = 0; k < (M ? 144 : 233); k++) { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * (FOREST.r - 21), u = FOREST.u + Math.cos(a) * r, v = FOREST.v + Math.sin(a) * r, [x, z] = toWorld(u, v), y = H(u, v); if (y < 1.8 || lakeR(u, v) < FL.ring + 4 || pathDist(u, v) < 3) continue; (k % 2 ? ferns : tufts).push([x, y, z, 2.6 + rnd() * 2, rnd() * 6.28, k % 3 ? '#5a9f4c' : '#7a6fd0']); }
    terrain.nature.add('fern', ferns); terrain.nature.add('tuft', tufts);
  }

  // ---------- dải đường mòn bám đất (1 lưới) ----------
  function stripGeo(list, w, col) {   // list: các polyline [[u,v],…]
    const P = [], C = [], I = [], c = new THREE.Color();
    for (const pts of list) {
      const o = P.length / 3;
      for (let i = 0; i < pts.length; i++) {
        const [u, v] = pts[i], [u1, v1] = pts[Math.min(pts.length - 1, i + 1)], [u0, v0] = pts[Math.max(0, i - 1)], du = u1 - u0, dv = v1 - v0, L = Math.hypot(du, dv) || 1;
        for (const sgn of [-1, 1]) { const uu = u - dv / L * w * sgn, vv = v + du / L * w * sgn; P.push(vv, H(uu, vv) + 0.07, uu); c.set(col).offsetHSL(0, 0, ((i * 7 + (sgn > 0 ? 3 : 0)) % 5 - 2) * 0.012); C.push(c.r, c.g, c.b); }
        if (i) { const a = o + (i - 1) * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals(); return g;
  }

  function build() {
    if (F) return;
    if (!planted) { plant(); planted = true; }
    s = 987;
    const group = new THREE.Group(); group.name = 'academy-forest';
    // nền: dải lưới tiếp nối lưới đảo (mép v = −GRID.V)
    const st = GRID.st, vMin = FOREST.v - FOREST.r - 34, nv = Math.ceil((-GRID.V - vMin) / st), j0 = Math.floor((FOREST.u - FOREST.r - 34 - GRID.U0) / st), nu = Math.ceil((2 * FOREST.r + 68) / st);
    const tg = terrainGeo(-GRID.V - nv * st, nv, GRID.U0 + j0 * st, nu), land = new THREE.Mesh(tg, matV()); land.receiveShadow = true;
    land.position.set(toWorld(0, 0)[0], 0, toWorld(0, 0)[1]);   // lưới ở hệ cục bộ (x = v, z = u) → dời về tâm đảo
    group.add(land);
    // đường mòn: nhánh cổng → hồ + vòng quanh hồ (bỏ đoạn qua suối chân thác — có cầu gỗ)
    const ring = []; for (let k = 0; k <= 89; k++) { const a = k / 89 * Math.PI * 2 - Math.PI / 2 + 0.11; if (a > Math.PI * 1.5 - 0.11) break; ring.push(lakeAt(a, FL.ring)); }
    const paths = new THREE.Mesh(stripGeo([pathPts, ring], FL.rw, '#b9a27c'), matV()); paths.receiveShadow = true; paths.position.set(toWorld(0, 0)[0], 0, toWorld(0, 0)[1]); group.add(paths);
    // cổng đá cổ: 2 trụ + xà đá + đá chóp, phủ rêu; chữ cổ khắc phát sáng (1 lưới riêng)
    const [gu, gv] = FOREST.gate, gy = H(gu, gv), b = new Batch(), rune = new Batch(), sto = '#8d887d', stoD = '#6d6a62', moss = '#5f7a52';
    for (const sd of [-1, 1]) {
      const v0 = gv, u0 = gu + sd * 4.2;
      b.box(v0 - 0.8, v0 + 0.8, gy - 1, gy + 5.5, u0 - 0.8, u0 + 0.8, sto); b.box(v0 - 1, v0 + 1, gy - 1, gy + 0.6, u0 - 1, u0 + 1, stoD);
      b.box(v0 - 0.84, v0 + 0.84, gy + 3.4, gy + 4.1, u0 - 0.84, u0 + 0.84, moss);
      for (let k = 0; k < 3; k++) rune.box(v0 + 0.82, v0 + 0.9, gy + 1 + k * 0.9, gy + 1.5 + k * 0.9, u0 - 0.25, u0 + 0.25, '#8ff7ff');
      ctx.colliders.push({ x: toWorld(u0, v0)[0], z: toWorld(u0, v0)[1], r: 1.1 });
    }
    b.box(gv - 1, gv + 1, gy + 5.5, gy + 6.6, gu - 6, gu + 6, sto); b.box(gv - 1.05, gv + 1.05, gy + 5.6, gy + 5.9, gu - 6.1, gu + 6.1, moss);
    b.add(new THREE.OctahedronGeometry(0.9, 0), '#b8a0ff', gv, gy + 7.6, gu);
    rune.box(gv + 1.0, gv + 1.08, gy + 5.75, gy + 6.35, gu - 3.4, gu + 3.4, '#c9a3ff');
    const gm = new THREE.Mesh(b.build(), matV()); gm.castShadow = true; gm.position.set(toWorld(0, 0)[0], 0, toWorld(0, 0)[1]); group.add(gm);
    const runeMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6 }), rm = new THREE.Mesh(rune.build(), runeMat); rm.position.copy(gm.position); group.add(rm);
    {
      const c = document.createElement('canvas'); c.width = 512; c.height = 96; const k = c.getContext('2d');
      k.font = 'bold 42px system-ui'; k.fillStyle = 'rgba(27,22,48,.8)'; k.beginPath(); k.roundRect(16, 12, 480, 72, 30); k.fill(); k.fillStyle = '#d9c8ff'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('🌲 Rừng Phép Thuật', 256, 49, 460);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false })); sp.scale.set(8.1, 1.5, 1); const [x, z] = toWorld(gu, gv + 1.2); sp.position.set(x, gy + 9.2, z); group.add(sp);
    }
    // đèn lồng cột (Kenney CC0) dọc đường mòn + quanh hồ; quầng sáng ban đêm = 1 Points
    const lamps = [], glowP = [];
    const lamp = (u, v) => { const [x, z] = toWorld(u, v), y = H(u, v); lamps.push([x, y - 0.05, z, 1.9, rnd() * 6.28]); glowP.push(x, y + 2.75, z); };
    for (let i = 3; i < pathPts.length - 2; i += 5) { const [u, v] = pathPts[i], [u1, v1] = pathPts[i + 1], du = u1 - u, dv = v1 - v, L = Math.hypot(du, dv) || 1, sd = (i / 5) % 2 ? 1 : -1; lamp(u - dv / L * 3.6 * sd, v + du / L * 3.6 * sd); }
    for (let k = 0; k < 21; k++) { const a = k / 21 * Math.PI * 2; if (Math.abs(a - Math.PI * 1.5) < 0.2) continue; const [u, v] = lakeAt(a, FL.ring + FL.rw + 1.2); lamp(u, v); }
    placeKit(group, 'prop_lantern', lamps, { shadow: false });
    const glowMat = new THREE.PointsMaterial({ size: 2.1, map: glowTex, color: '#ffd27a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
    const glowG = new THREE.BufferGeometry(); glowG.setAttribute('position', new THREE.Float32BufferAttribute(glowP, 3)); const glow = new THREE.Points(glowG, glowMat); group.add(glow);
    // nấm phát sáng khổng lồ (Kenney CC0 mushroom_red, cao 1–2 m): 2 màu = 2 draw call; vật liệu riêng có emissive theo đêm
    const mush = [[], []];
    for (let k = 0; k < (M ? 34 : 55); k++) {
      let u, v; const g0 = giants[k % Math.max(1, giants.length)];
      if (g0 && k % 3) { const [lu, lv] = toLocal(g0[0], g0[2]), a = rnd() * 6.28, r = 4 + rnd() * 8; u = lu + Math.cos(a) * r; v = lv + Math.sin(a) * r; }
      else { const i = Math.floor(rnd() * pathPts.length), [pu, pv] = pathPts[i], sd = rnd() < 0.5 ? -1 : 1; u = pu + sd * (3.6 + rnd() * 4); v = pv + (rnd() - 0.5) * 4; }
      const [x, z] = toWorld(u, v); mush[k % 2].push([x, H(u, v) - 0.05, z, 4 + rnd() * 4.5, rnd() * 6.28]);
    }
    const glowMush = [];
    mush.forEach((list, i) => placeKit(group, 'mushroom_red', list, { shadow: false }).then(ims => ims.forEach(im => { const m = im.material.clone(); m.color.set(i ? '#d9a8ff' : '#a8f0ff'); m.emissive = new THREE.Color(i ? '#b35cff' : '#2fd6ff'); m.emissiveIntensity = 0; im.material = m; glowMush.push(m); })));
    // hoa đổi màu khi lại gần (Kenney CC0 plant_flower_purple): màu từng bông = instanceColor
    const fl = [];
    for (let k = 0; k < (M ? 55 : 89); k++) {
      const onRing = k % 2, a = rnd() * 6.283;
      let u, v; if (onRing) [u, v] = lakeAt(a, FL.ring + (rnd() < 0.5 ? -FL.rw - 0.8 : FL.rw + 0.8 + rnd() * 3)); else { const [pu, pv] = pathPts[Math.floor(rnd() * pathPts.length)], sd = rnd() < 0.5 ? -1 : 1; u = pu + sd * (FL.rw + 0.6 + rnd() * 2.5); v = pv + (rnd() - 0.5) * 3; }
      if (cliffD(u, v) < CLIFF.cr + 3 || Math.abs(u - FL.u) < 5 && v < FL.v - FL.r) continue;
      const [x, z] = toWorld(u, v); fl.push([x, H(u, v) - 0.03, z, 3.4 + rnd() * 1.6, rnd() * 6.28]);
    }
    let flowers = null; const fcol = fl.map(() => ({ h: 0, on: 0 }));
    placeKit(group, 'plant_flower_purple', fl, { shadow: false }).then(ims => { flowers = ims; const c = new THREE.Color(1, 1, 1); for (const im of ims) { for (let i = 0; i < fl.length; i++) im.setColorAt(i, c); im.instanceColor.needsUpdate = true; } });
    // dây leo rủ từ tán cổ thụ (1 InstancedMesh, đung đưa nhẹ khi ở gần)
    const vb = new Batch(); vb.box(-0.05, 0.05, -1, 0, -0.05, 0.05, '#3f7a45'); for (let k = 0; k < 5; k++) vb.add(new THREE.OctahedronGeometry(0.14, 0), k % 2 ? '#6fbf6a' : '#8fd1a8', (k % 2 ? 0.1 : -0.1), -0.15 - k * 0.19, 0, 0, 0, 0, 1, 1.6, 0.5);
    const vines = [], NV = M ? 34 : 55;
    for (let k = 0; k < NV && giants.length; k++) { const [x, y, z, h] = giants[k % giants.length], a = k * GA, r = h * (0.13 + rnd() * 0.15); vines.push({ x: x + Math.cos(a) * r, y: y + h * (0.42 + rnd() * 0.12), z: z + Math.sin(a) * r, len: 3 + rnd() * 5, ph: rnd() * 6.28 }); }
    const vineM = new THREE.InstancedMesh(vb.build(), toon('#ffffff', { vertexColors: true }), Math.max(1, vines.length)); vineM.count = vines.length; group.add(vineM);
    const o = new THREE.Object3D(), setVines = t => { vines.forEach((q, i) => { o.position.set(q.x, q.y, q.z); o.rotation.set(Math.sin(t * 0.9 + q.ph) * 0.08, q.ph, Math.cos(t * 0.7 + q.ph) * 0.08); o.scale.set(1, q.len, 1); o.updateMatrix(); vineM.setMatrixAt(i, o.matrix); }); vineM.instanceMatrix.needsUpdate = true; };
    setVines(0); vineM.computeBoundingSphere();
    // sương tím trôi thấp (InstancedMesh tấm phẳng) + đom đóm (Points)
    const NM = 13, mist = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: soft('rgba(214,196,255,1)'), color: '#cdb8ff', transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide }), NM);
    const ms = Array.from({ length: NM }, (_, i) => ({ a: i * GA, r: i % 2 ? FL.r * (0.4 + rnd() * 0.6) : FL.ring + 8 + rnd() * 55, y: i % 2 ? 0.9 + rnd() * 1.5 : 2.6 + rnd() * 3, sz: 21 + rnd() * 21, sp: (rnd() - 0.5) * 0.03 }));
    mist.frustumCulled = false; group.add(mist);
    const NF = M ? 89 : 144, fp = new Float32Array(NF * 3), seed = [];
    for (let i = 0; i < NF; i++) { const a = rnd() * 6.283, r = i % 3 ? FL.ring + rnd() * 34 : rnd() * FL.r, [u, v] = lakeAt(a, r), [x, z] = toWorld(u, v); seed.push([x, Math.max(0.5, H(u, v)) + 0.6 + rnd() * 3.4, z, rnd() * 6.28, 0.3 + rnd() * 0.6]); }
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
    const fmat = new THREE.PointsMaterial({ size: 0.34, map: glowTex, color: '#d8ff9a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const flies = new THREE.Points(fg, fmat); flies.frustumCulled = false; group.add(flies);
    scene.add(group);
    F = { group, glowMat, glowMush, runeMat, mist, ms, fp, fg, fmat, seed, setVines, fl, fcol, get flowers() { return flowers; }, lampPts: glowP };
    for (const p of plugs) p.build && p.build(F);
  }
  function unbuild() {
    if (!F) return; for (const p of plugs) p.unbuild && p.unbuild();
    scene.remove(F.group); F.group.traverse(o => { if (o.geometry && !o.isInstancedMesh) o.geometry.dispose(); }); F = null;
  }

  // ---------- cầu thang Tháp Gió ⇄ cổng rừng; tên vùng ----------
  const [tu, tv, tr] = CL.bridge.tower, Y = PLAT.y;
  const prevZone = ctx.zoneAt;
  ctx.zoneAt = (x, z) => { const [u, v] = toLocal(x, z); return forestDist(u, v) < -8 ? FOREST_NAME : prevZone ? prevZone(x, z) : null; };
  const toGate = () => { const [x, z] = toWorld(FOREST.gate[0], FOREST.gate[1] - 8); player.teleport(x, z, H(FOREST.gate[0], FOREST.gate[1] - 8) + 0.2); player.cam.yaw = Math.atan2(1, 0); player.snapCamera && player.snapCamera(); };
  const c3 = new THREE.Color(), WHITE = new THREE.Color(1, 1, 1), o = new THREE.Object3D();
  function update(dt, t) {
    const p = player.pos, [u, v] = toLocal(p.x, p.z), d = forestDist(u, v);
    if (!F && d < LOAD) build(); else if (F && d > UNLOAD) unbuild();
    if (!player.vehicle && !(ctx.ferry && ctx.ferry.riding)) {
      if (Math.hypot(u - tu, v - tv) < tr + 3.4 && p.y > Y - 3) ctx.offer('🌲 Xuống Rừng Phép Thuật (cầu thang Tháp Gió)', toGate, 8);
      else if (Math.hypot(u - FOREST.gate[0], v - FOREST.gate[1]) < 6.5 && p.y < 21) ctx.offer('🗼 Lên Tháp Gió (về lâu đài)', () => { const [x, z] = toWorld(tu, tv + tr + 2.5); player.teleport(x, z, Y + 0.2); }, 8);
    }
    const now = d < -8; if (now && !inside && !greeted) { greeted = true; ctx.toast('🌲 <b>Rừng Phép Thuật</b> — cây cổ thụ, nấm phát sáng, hoa đổi màu… Đi theo đường đèn lồng tới <b>hồ</b>. Có <b>13 bí mật</b> đang chờ em!', 6500); } inside = now;
    if (!F) return;
    const n = night();
    F.glowMat.opacity = 0.15 + 0.85 * n; F.runeMat.opacity = 0.45 + 0.5 * n * (0.8 + 0.2 * Math.sin(t * 2.1));
    for (const m of F.glowMush) m.emissiveIntensity = 0.12 + 0.9 * n * (0.85 + 0.15 * Math.sin(t * 1.3));
    if (d > 89) { for (const q of plugs) q.update && q.update(dt, t, F, d); return; }
    // sương + đom đóm + dây leo
    const [lx, lz] = toWorld(FL.u, FL.v);
    F.ms.forEach((m, i) => { m.a += m.sp * dt; o.position.set(lx + Math.sin(m.a) * m.r, m.y, lz + Math.cos(m.a) * m.r); o.rotation.set(0, m.a * 2, 0); o.scale.set(m.sz, 1, m.sz * 0.618); o.updateMatrix(); F.mist.setMatrixAt(i, o.matrix); });
    F.mist.instanceMatrix.needsUpdate = true; F.mist.material.opacity = 0.2 + 0.18 * n;
    for (let i = 0; i < F.seed.length; i++) { const [x, y, z, ph, sp] = F.seed[i]; F.fp[i * 3] = x + Math.sin(t * sp + ph) * 2.6; F.fp[i * 3 + 1] = y + Math.sin(t * sp * 1.7 + ph * 2) * 0.8; F.fp[i * 3 + 2] = z + Math.cos(t * sp * 0.8 + ph) * 2.6; }
    F.fg.attributes.position.needsUpdate = true; F.fmat.opacity = 0.25 + 0.75 * n;
    F.setVines(t);
    // hoa đổi màu: bông trong 5 m quanh người chơi chuyển dần sang cầu vồng, đi xa thì về màu cũ
    const fls = F.flowers;
    if (fls) {
      let dirty = false;
      for (let i = 0; i < F.fl.length; i++) {
        const [x, , z] = F.fl[i], q = F.fcol[i], near = Math.abs(x - p.x) < 5 && Math.abs(z - p.z) < 5 && Math.hypot(x - p.x, z - p.z) < 5, tg = near ? 1 : 0;
        if (q.on === tg && !near) continue;
        q.on += Math.sign(tg - q.on) * Math.min(Math.abs(tg - q.on), dt * 1.6); q.h = (q.h + dt * 0.21) % 1;
        c3.setHSL((q.h + i * 0.13) % 1, 0.85, 0.62).lerp(WHITE, 1 - q.on); for (const im of fls) im.setColorAt(i, c3); dirty = true;
        if (near && !q.seen) { q.seen = true; ctx.forestFlowers = (ctx.forestFlowers || 0) + 1; }
      }
      if (dirty) for (const im of fls) im.instanceColor.needsUpdate = true;
    }
    for (const q of plugs) q.update && q.update(dt, t, F, d);
  }
  return { update, plug(p) { plugs.push(p); if (F && p.build) p.build(F); }, get F() { return F; }, H, pathPts, giants, rnd };
}
