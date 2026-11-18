// academy/island.js — DỰNG ĐẢO HỌC VIỆN (greybox): địa hình (đồi, vách, hồ, lạch), dốc đá + bến, đường băng, khối lâu đài.
// Chỉ gọi khi người chơi lại gần (index.js); dispose() trả lại bộ nhớ khi đi xa.
import * as THREE from 'three';
import { CFG } from '../config.js';
import { matV, mat } from '../sample/palette.js';
import { Batch } from './geo.js';
import { castleMassing } from './far.js';
import { ROT, C, ISLE, PLAT, QUAY, RUNWAY, heightLocal, toWorld, plateauDist, isleDist, LAKE } from './plan.js';

const COL = {
  sand: new THREE.Color('#d9c8a6'), grass: new THREE.Color('#7fbf5e'), grassD: new THREE.Color('#5a9a48'),
  rock: new THREE.Color('#8a857d'), rockD: new THREE.Color('#6f6a63'), top: new THREE.Color('#a39d92'), bed: new THREE.Color('#b8a98a'),
};

function terrainGeo() {
  const st = CFG.isMobile ? 4.2 : 3.4, U0 = ISLE.u - ISLE.hu - 21, U1 = ISLE.u + ISLE.hu + 21, V = ISLE.hv + 21;
  const nu = Math.ceil((U1 - U0) / st), nv = Math.ceil(2 * V / st), w = nv + 1, H = new Float32Array((nu + 1) * w);
  const pos = new Float32Array((nu + 1) * w * 3), col = new Float32Array((nu + 1) * w * 3), c = new THREE.Color();
  for (let j = 0; j <= nu; j++) for (let i = 0; i <= nv; i++) {
    const u = U0 + j * st, v = -V + i * st, [x, z] = toWorld(u, v), k = j * w + i;
    H[k] = heightLocal(u, v, x, z); pos.set([v, H[k], u], k * 3);
  }
  const at = (j, i) => H[Math.min(nu, Math.max(0, j)) * w + Math.min(nv, Math.max(0, i))];
  for (let j = 0; j <= nu; j++) for (let i = 0; i <= nv; i++) {
    const h = at(j, i), sl = Math.hypot(at(j + 1, i) - at(j - 1, i), at(j, i + 1) - at(j, i - 1)) / (2 * st), u = U0 + j * st, v = -V + i * st;
    if (h < 0.2) c.copy(COL.bed);
    else if (h < 2.2) c.copy(COL.sand);
    else c.copy(COL.grass).lerp(COL.grassD, Math.min(1, (h - 2) / 21));
    if (plateauDist(u, v) < -2) c.copy(COL.top);
    c.lerp(COL.rock, Math.min(1, Math.max(0, (sl - 0.7) * 1.6))); if (sl > 2) c.lerp(COL.rockD, 0.5);
    col.set([c.r, c.g, c.b], (j * w + i) * 3);
  }
  const idx = [];
  for (let j = 0; j < nu; j++) for (let i = 0; i < nv; i++) {
    const a = j * w + i, b = a + w, cc = a + 1, d = b + 1;
    if (Math.max(H[a], H[b], H[cc], H[d]) < -4.5) continue;   // đáy biển sâu: bỏ (không ai thấy)
    idx.push(a, b, cc, cc, b, d);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere(); return g;
}

// dốc đá + bến + lan can + cột đèn (toạ độ cục bộ x = v, z = u)
function quayGeo() {
  const b = new Batch(), u0 = QUAY.u0, u1 = QUAY.u0 + QUAY.w, um = (u0 + u1) / 2, stone = '#9a958c', stoneD = '#7d786f';
  b.box(0, QUAY.v1, QUAY.y - 1.2, QUAY.y, u0, u1 + 3, stone);                                   // bến cập thuyền (nhô ra hồ 3 m)
  const L = -QUAY.v0, rise = QUAY.y_top - QUAY.y, len = Math.hypot(L, rise), ang = Math.atan2(rise, L);
  b.add(new THREE.BoxGeometry(len, 1.2, QUAY.w), stone, -L / 2, (QUAY.y + QUAY.y_top) / 2 - 0.6 / Math.cos(ang), um, 0, 0, -ang);   // dốc đá dài 89 m, dốc 1/φ²
  // lan can thấp phía hồ (0,9 m) theo dốc
  b.add(new THREE.BoxGeometry(len, 0.9, 0.4), stoneD, -L / 2, (QUAY.y + QUAY.y_top) / 2 + 0.45, u1 - 0.2, 0, 0, -ang);
  b.box(0, QUAY.v1, QUAY.y, QUAY.y + 0.9, u1 + 2.8, u1 + 3.2, stoneD);
  // cọc buộc thuyền + cột đèn lồng 3 m (đèn phát sáng: lampGlow riêng)
  for (const v of [3, 13, 21]) b.cyl(v - 1, QUAY.y, u1 + 2.3, 0.18, 0.8, '#6e4a30', 6);
  for (const v of [-55, -21, 2, 19]) { const y = v >= 0 ? QUAY.y : QUAY.y + (QUAY.y_top - QUAY.y) * (-v / L); b.cyl(v, y, u1 - 0.6, 0.09, 3, '#3a3344', 6); }
  return b.build();
}
function lampGeo() {
  const b = new Batch(), u1 = QUAY.u0 + QUAY.w, L = -QUAY.v0;
  for (const v of [-55, -21, 2, 19]) { const y = v >= 0 ? QUAY.y : QUAY.y + (QUAY.y_top - QUAY.y) * (-v / L); b.box(v - 0.22, v + 0.22, y + 3, y + 3.5, u1 - 0.82, u1 - 0.38, '#ffe3a0'); }
  return b.build();
}
// đường băng 233 × 13 m: nhựa, vạch giữa, vạch ngưỡng, đèn mép
function runwayGeo() {
  const b = new Batch(), u = RUNWAY.u, y = RUNWAY.y + 0.02, hl = RUNWAY.hl, hw = RUNWAY.hw;
  b.box(-hl - 1, hl + 1, y - 0.3, y + 0.04, u - hw - 0.8, u + hw + 0.8, '#d6ccbb');
  b.box(-hl, hl, y, y + 0.06, u - hw, u + hw, '#4a4d55');
  for (let v = -hl + 13; v < hl - 13; v += 8) b.box(v, v + 4, y + 0.06, y + 0.08, u - 0.2, u + 0.2, '#f3efe6');
  for (const e of [-hl + 3, hl - 3]) for (let i = -2; i <= 2; i++) if (i) b.box(e - 2, e + 2, y + 0.06, y + 0.08, u + i * 1.3 - 0.3, u + i * 1.3 + 0.3, '#f3efe6');
  for (let v = -hl; v <= hl; v += 21) for (const s of [-1, 1]) b.cyl(v, y, u + s * (hw + 0.5), 0.12, 0.4, '#f2c443', 6);
  // ống gió (hướng gió: bài Địa lý ở bước e)
  b.cyl(-hl + 8, y, u + hw + 5, 0.08, 5, '#3a3344', 6); b.add(new THREE.ConeGeometry(0.5, 2.2, 8, 1, true), '#e0503e', -hl + 9.1, y + 4.7, u + hw + 5, 0, 0, Math.PI / 2);
  return b.build();
}

export function buildIsland(ctx) {
  const group = new THREE.Group(); group.position.set(C[0], 0, C[1]); group.rotation.y = ROT; group.name = 'academy';
  const add = (geo, m, shadow = false) => { const o = new THREE.Mesh(geo, m); o.receiveShadow = true; o.castShadow = shadow; o.matrixAutoUpdate = false; o.updateMatrix(); group.add(o); return o; };
  const land = add(terrainGeo(), matV());
  add(quayGeo(), matV(), true); add(lampGeo(), mat('lampGlow')); add(runwayGeo(), matV());
  const castle = add(castleMassing(10), matV(), true);
  group.updateMatrixWorld(true); ctx.scene.add(group);
  return {
    group, castle, land,
    dispose() { ctx.scene.remove(group); group.traverse(o => o.geometry && o.geometry.dispose()); },
  };
}

// cây thông + đá ven hồ (thêm 1 lần vào bộ instancing chung của terrain.js → không thêm draw call)
export function plantIsland(ctx) {
  const { terrain } = ctx, pines = [], tall = [], rocks = []; let s = 1597;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const N = CFG.isMobile ? 144 : 233;
  for (let k = 0; k < N * 8 && pines.length + tall.length < N; k++) {
    const u = ISLE.u + (rnd() * 2 - 1) * ISLE.hu, v = (rnd() * 2 - 1) * ISLE.hv;
    if (isleDist(u, v) > -13 || plateauDist(u, v) < LAKE + 13) continue;
    if (Math.abs(u - RUNWAY.u) < RUNWAY.hw + 21 && Math.abs(v) < RUNWAY.hl + 21) continue;
    if (u > PLAT.u + PLAT.hu && Math.abs(v) < 34) continue;
    const [x, z] = toWorld(u, v), h = terrain.heightAt(x, z); if (h < 2.6) continue;
    const big = 3.6 + rnd() * 1.6; (rnd() < 0.4 ? tall : pines).push([x, h - 0.2, z, big, rnd() * 6.28]);
  }
  for (let k = 0; k < 400 && rocks.length < 34; k++) {
    const u = ISLE.u + (rnd() * 2 - 1) * ISLE.hu, v = (rnd() * 2 - 1) * ISLE.hv, d = plateauDist(u, v);
    if (d < LAKE - 3 || d > LAKE + 8) continue;
    const [x, z] = toWorld(u, v), h = terrain.heightAt(x, z); if (h < -0.6 || h > 2.5) continue;
    rocks.push([x, h - 0.3, z, 1.6 + rnd() * 2, rnd() * 6.28]);
  }
  terrain.nature.add('pine', pines); terrain.nature.add('pineTall', tall); terrain.nature.add('rockL', rocks);
  for (const [x, , z, sc] of [...pines, ...tall]) ctx.colliders.push({ x, z, r: 0.1 * sc });
  for (const [x, , z, sc] of rocks) ctx.colliders.push({ x, z, r: 0.45 * sc });
}
