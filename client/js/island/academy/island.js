// academy/island.js — DỰNG ĐẢO HỌC VIỆN (greybox): địa hình (đồi, vách, hồ, lạch), dốc đá + bến, đường băng, khối lâu đài.
// Chỉ gọi khi người chơi lại gần (index.js); dispose() trả lại bộ nhớ khi đi xa.
import * as THREE from 'three';
import { CFG } from '../config.js';
import { matV, mat } from '../sample/palette.js';
import { Batch } from './geo.js';
import { buildCastle } from './castle.js';
import { ROT, C, ISLE, PLAT, QUAY, RUNWAY, heightLocal, toWorld, plateauDist, isleDist, LAKE, quayY } from './plan.js';

const COL = {
  sand: new THREE.Color('#d9c8a6'), grass: new THREE.Color('#7fbf5e'), grassD: new THREE.Color('#5a9a48'),
  rock: new THREE.Color('#77736d'), rockD: new THREE.Color('#5a5752'), moss: new THREE.Color('#5f7352'), top: new THREE.Color('#a39d92'), bed: new THREE.Color('#b8a98a'),
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
    c.lerp(COL.rock, Math.min(1, Math.max(0, (sl - 0.7) * 1.6))); if (sl > 2) { c.lerp(COL.rockD, 0.5); const m = Math.sin(u * 0.37 + v * 0.23) * Math.sin(h * 0.61); if (m > 0.3) c.lerp(COL.moss, 0.55); }   // vách phong hoá, mảng rêu
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

// bến + đường mòn gấp khúc lên vách (nhánh 1 men chân vách, chiếu nghỉ, nhánh 2 khắc vào vách) + lan can + cột đèn (x = v, z = u)
const LAMPS = [[-55, 1], [-21, 1], [2, 1], [19, 1], [-70, 2], [-40, 2]];   // [v, nhánh]
function quayGeo(boxes) {
  const Q = QUAY, b = new Batch(), u0 = Q.u0, u1 = Q.u0 + Q.w, stone = '#9a958c', stoneD = '#7d786f';
  b.box(0, Q.v1, Q.y - 1.2, Q.y, u0, u1 + 3, stone);                                          // bến cập thuyền (nhô ra hồ 3 m)
  const ramp = (va, vb, ya, yb, ua, ub, rail) => {                                             // dải dốc đều từ (va, ya) tới (vb, yb)
    const L = Math.abs(vb - va), len = Math.hypot(L, yb - ya), ang = Math.atan2(yb - ya, vb - va), vm = (va + vb) / 2, ym = (ya + yb) / 2;
    b.add(new THREE.BoxGeometry(len, 1.2, ub - ua), stone, vm, ym - 0.6 / Math.cos(ang), (ua + ub) / 2, 0, 0, ang);
    if (rail != null) b.add(new THREE.BoxGeometry(len, 0.9, 0.4), stoneD, vm, ym + 0.45, rail, 0, 0, ang);   // lan can 0,9 m phía vực
  };
  ramp(0, Q.v0, Q.y, Q.ymid, u0, u1, u1 - 0.2);                                                // nhánh 1: v 0 → −89
  b.box(Q.v0 - Q.land, Q.v0, -4, Q.ymid, u0, u1, stoneD); b.box(Q.v0 - Q.land, Q.v0, Q.ymid - 1.2, Q.ymid, u0 - Q.w, u0, stone);   // chiếu nghỉ (trụ đá từ đáy hồ)
  b.box(Q.v0 - Q.land - 0.4, Q.v0 - Q.land, Q.ymid, Q.ymid + 0.9, u0 - Q.w, u1, stoneD); b.box(Q.v0 - Q.land, Q.v0, Q.ymid, Q.ymid + 0.9, u1 - 0.4, u1, stoneD);
  ramp(Q.v0, Q.v2, Q.ymid, Q.y_top, u0 - Q.w, u0, u0 - 0.2);                                  // nhánh 2 khắc vào vách: v −89 → −13
  b.box(0, Q.v1, Q.y, Q.y + 0.9, u1 + 2.8, u1 + 3.2, stoneD);
  const yAt = v => quayY(v < Q.v0 ? u0 : u0 + 1, v), y2 = v => quayY(u0 - 1, v);
  for (let v = Q.v0; v < Q.v2 - 0.1; v += 8) {                                                // tường chắn đất phía trong nhánh 2 + va chạm lan can
    const e = Math.min(Q.v2, v + 8), lo = y2(v), hi = y2(e);
    b.box(v, e, lo - 0.5, PLAT.y + 0.4, u0 - Q.w - 0.8, u0 - Q.w, stoneD);
    boxes.push({ u0: u0 - 0.4, u1: u0, v0: v, v1: e, top: hi + 0.9 });
  }
  for (let v = Q.v0; v < -0.1; v += 8) boxes.push({ u0: u1 - 0.4, u1: u1, v0: v, v1: Math.min(0, v + 8), top: yAt(v) + 0.9 });   // lan can nhánh 1
  for (const v of [3, 13, 21]) b.cyl(v - 1, Q.y, u1 + 2.3, 0.18, 0.8, '#6e4a30', 6);           // cọc buộc thuyền
  for (const [v, k] of LAMPS) { const u = k === 1 ? u1 - 0.6 : u0 - 0.6, y = k === 1 ? yAt(v) : y2(v); b.cyl(v, y, u, 0.09, 3, '#3a3344', 6); }   // cột đèn lồng 3 m
  return b.build();
}
function lampGeo() {
  const b = new Batch(), Q = QUAY, u1 = Q.u0 + Q.w;
  for (const [v, k] of LAMPS) { const u = k === 1 ? u1 - 0.6 : Q.u0 - 0.6, y = quayY(k === 1 ? Q.u0 + 1 : Q.u0 - 1, v); b.box(v - 0.22, v + 0.22, y + 3, y + 3.5, u - 0.22, u + 0.22, '#ffe3a0'); }
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

// mỏm đá lởm chởm dọc chân vách (1 InstancedMesh): vách 55 m nhìn dựng đứng, bóng đổ gãy khúc
function cragMesh() {
  const geo = new THREE.IcosahedronGeometry(1, 0), n = geo.attributes.position.count, col = new Float32Array(n * 3), c = new THREE.Color('#6a6660');
  for (let i = 0; i < n; i++) { const k = 0.85 + 0.15 * Math.sin(i * 2.3); col.set([c.r * k, c.g * k, c.b * k], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const list = [], o = new THREE.Object3D(); let s = 233; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const P = 2 * (2 * PLAT.hu + 2 * PLAT.hv), N = 144;
  for (let k = 0; k < N; k++) {
    let t = (k + rnd() * 0.6) / N * P, u, v;                                                    // chạy quanh chu vi cao nguyên
    if (t < 2 * PLAT.hv) { u = PLAT.u + PLAT.hu; v = -PLAT.hv + t; } else if ((t -= 2 * PLAT.hv) < 2 * PLAT.hu) { v = PLAT.hv; u = PLAT.u + PLAT.hu - t; }
    else if ((t -= 2 * PLAT.hu) < 2 * PLAT.hv) { u = PLAT.u - PLAT.hu; v = PLAT.hv - t; } else { t -= 2 * PLAT.hv; v = -PLAT.hv; u = PLAT.u - PLAT.hu + t; }
    const cu = Math.max(PLAT.u - PLAT.hu + PLAT.r, Math.min(PLAT.u + PLAT.hu - PLAT.r, u)), cv = Math.max(-PLAT.hv + PLAT.r, Math.min(PLAT.hv - PLAT.r, v));
    const d = Math.hypot(u - cu, v - cv) || 1, nu = (u - cu) / d, nv = (v - cv) / d;                // pháp tuyến ra ngoài (góc bo)
    if (d > PLAT.r * 0.7 && d < PLAT.r * 1.5) { u = cu + nu * PLAT.r; v = cv + nv * PLAT.r; }
    if (u > PLAT.u + PLAT.hu - 3 && v > QUAY.v0 - QUAY.land - 5 && v < QUAY.v1 + 21) continue;     // chừa đường mòn + bến + lạch
    const off = 0.3 + rnd() * 1.6, h = 13 + rnd() * 34, r = 3 + rnd() * 3.4;
    o.position.set(v + nv * off, -3 + h * 0.42, u + nu * off); o.rotation.set(rnd() * 0.3, rnd() * 6.28, rnd() * 0.3); o.scale.set(r, h * 0.5, r * 0.8); o.updateMatrix(); list.push(o.matrix.clone());
  }
  const m = new THREE.InstancedMesh(geo, matV(), list.length); list.forEach((mx, i) => m.setMatrixAt(i, mx)); m.castShadow = m.receiveShadow = true; m.computeBoundingSphere(); return m;
}

export function buildIsland(ctx) {
  const group = new THREE.Group(); group.position.set(C[0], 0, C[1]); group.rotation.y = ROT; group.name = 'academy';
  const add = (geo, m, shadow = false) => { const o = new THREE.Mesh(geo, m); o.receiveShadow = true; o.castShadow = shadow; o.matrixAutoUpdate = false; o.updateMatrix(); group.add(o); return o; };
  const land = add(terrainGeo(), matV());
  const castle = buildCastle(ctx); group.add(castle.group); group.add(cragMesh());
  const qb = []; add(quayGeo(qb), matV(), true); add(lampGeo(), mat('lampGlow')); add(runwayGeo(), matV());
  for (const b of qb) { const [x0, z0] = toWorld(b.u0, b.v0), [x1, z1] = toWorld(b.u1, b.v1); castle.boxes.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), top: b.top }); }
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
