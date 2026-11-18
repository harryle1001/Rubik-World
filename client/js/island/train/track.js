// train/track.js — DỰNG TUYẾN: nền ballast + ray, kè/cầu vòm thấp ven biển (nhịp 13 m), cầu cạn đá nhiều nhịp vòm (21 m),
// đường hầm xuyên đồi + 2 cổng hầm, địa hình đảo Đồi Thông (rừng thông dùng instancing chung → 0 draw call thêm).
// Chia khúc 144 m (Fibonacci): mỗi khúc 1 mesh kết cấu (luôn vẽ, sương che xa) + 1 mesh tà vẹt (chỉ vẽ trong 144 m = LOD).
import * as THREE from 'three';
import { CFG } from '../config.js';
import { Batch } from '../academy/geo.js';
import { matV } from '../sample/palette.js';
import { NS, STEP, LEN, X, Z, TX, TZ, Y, at, TUNNEL, RAIL_Y, GAUGE, ISLET, ISLET_BOUND, isletHeight, isletNatural } from './route.js';

export const CHUNK = 144, DETAIL_D = 144;
const COL = {
  ballast: '#8a857d', rail: '#5a5266', sleeper: '#6e4a30', stone: '#bdb2a0', stoneD: '#948a7b', stoneL: '#d6ccbb',
  tunnel: '#4a4450', portal: '#9a958c', sand: '#d9c8a6', grass: '#7fbf5e', grassD: '#5a9a48', rock: '#8a857d', bed: '#b8a98a',
};
const _m = new THREE.Matrix4(), _r = new THREE.Matrix4(), _p = new THREE.Matrix4(), _v = new THREE.Vector3(), _q = new THREE.Quaternion();
const box = (w, h, l) => new THREE.BoxGeometry(w, h, l);
// đặt hình theo tuyến: tâm ở s, lệch ngang lat (+ trái), cao y; xoay theo hướng tuyến (yaw) và độ dốc (pitch, tuỳ chọn)
function along(b, geo, col, s, lat, y, pitch = true) {
  const p = at(s), s0 = Math.max(0, s - 1), s1 = Math.min(LEN, s + 1), slope = pitch ? (at(s1).y - at(s0).y) / (s1 - s0) : 0;
  const g = geo.index ? geo.toNonIndexed() : geo;
  _r.makeRotationX(-Math.atan(slope)); _p.makeRotationY(Math.atan2(p.tx, p.tz));
  _m.makeTranslation(p.x - p.tz * lat, y, p.z + p.tx * lat).multiply(_p).multiply(_r);
  g.applyMatrix4(_m); b.add(g, col); return b;
}
export const inTunnel = s => s > TUNNEL.s0 && s < TUNNEL.s1;

// ---------- địa hình đảo Đồi Thông ----------
function isletGeo() {
  const st = CFG.isMobile ? 4.2 : 3.4, R = ISLET_BOUND, [cx, cz] = ISLET.c, n = Math.ceil(2 * R / st), w = n + 1;
  const pos = new Float32Array(w * w * 3), col = new Float32Array(w * w * 3), H = new Float32Array(w * w), c = new THREE.Color(), cs = {};
  for (const k in COL) cs[k] = new THREE.Color(COL[k]);
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const x = cx - R + i * st, z = cz - R + j * st, k = j * w + i; H[k] = isletHeight(x, z); pos.set([x, H[k], z], k * 3); }
  const hAt = (j, i) => H[Math.min(n, Math.max(0, j)) * w + Math.min(n, Math.max(0, i))];
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
    const h = hAt(j, i), sl = Math.hypot(hAt(j, i + 1) - hAt(j, i - 1), hAt(j + 1, i) - hAt(j - 1, i)) / (2 * st);
    if (h < 0.2) c.copy(cs.bed); else if (h < 2.4) c.copy(cs.sand); else c.copy(cs.grass).lerp(cs.grassD, Math.min(1, (h - 2) / 34));
    c.lerp(cs.rock, Math.min(1, Math.max(0, (sl - 0.7) * 1.4)));
    col.set([c.r, c.g, c.b], (j * w + i) * 3);
  }
  const idx = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * w + i, b = a + w, cc = a + 1, d = b + 1; if (Math.max(H[a], H[b], H[cc], H[d]) < -4.5) continue; idx.push(a, b, cc, cc, b, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere(); return g;
}

// ---------- kết cấu một khúc [s0, s1) ----------
// ground(x, z): độ cao địa hình thật (đảo chính + đảo nhỏ + Học viện) để hạ trụ cầu chạm đất
function buildChunk(s0, s1, ground) {
  const st = new Batch(), dt = new Batch();
  const deckTop = s => at(s).y - RAIL_Y - 0.45;        // mặt dưới ballast = mặt cầu
  const gAt = s => { const p = at(s); return Math.min(ground(p.x, p.z), ground(p.x - p.tz * 2, p.z + p.tx * 2), ground(p.x + p.tz * 2, p.z - p.tx * 2)); };
  const SEG = 4;
  for (let s = s0; s < s1; s += SEG) {
    const sm = Math.min(s + SEG / 2, LEN - 0.01), p = at(sm), len = Math.min(SEG, LEN - s) + 0.04;
    if (len <= 0.05) break;
    // ballast hình thang (đáy 3,4 m) + 2 ray
    along(st, box(3.4, 0.45, len), COL.ballast, sm, 0, p.y - RAIL_Y - 0.225);
    for (const sd of [-1, 1]) along(st, box(0.08, 0.16, len), COL.rail, sm, sd * GAUGE / 2, p.y - 0.08);
    const h = p.y - gAt(sm);
    if (inTunnel(sm)) {
      // ống hầm: 2 vách + vòm 3 mảnh (mặt trong tối), bề rộng lòng 5,6 m, cao 5,5 m
      for (const sd of [-1, 1]) {
        along(st, box(0.6, 4, len), COL.tunnel, sm, sd * 3.1, p.y - 0.6 + 2, false);
        const g = box(0.6, 2.6, len); g.rotateZ(sd * 0.62); along(st, g, COL.tunnel, sm, sd * 2.25, p.y + 4.4, false);
      }
      along(st, box(2.2, 0.6, len), COL.tunnel, sm, 0, p.y + 5.3, false);
      if (Math.round(sm) % 21 < SEG) along(st, box(0.3, 0.3, 0.5), '#ffe3a0', sm, 2.7, p.y + 3, false);   // đèn hầm (màu sáng, không phải nguồn sáng)
    } else if (h > 1.2) {
      // mặt cầu đá (dày 1,2 m) + lan can 0,9 m
      along(st, box(4.6, 1.2, len), COL.stoneL, sm, 0, deckTop(sm) - 0.6);
      for (const sd of [-1, 1]) along(st, box(0.4, 0.9, len), COL.stone, sm, sd * 2.1, deckTop(sm) + 0.45);
    }
  }
  // trụ + vòm: nhịp 21 m trên cầu cạn (cao > 13 m), 13 m ở cầu thấp ven biển
  let s = Math.ceil(s0 / 13) * 13;
  while (s < s1) {
    const h = at(s).y - gAt(s), span = h > 13 ? 21 : 13;
    if (!inTunnel(s) && h > 1.2) {
      const top = deckTop(s) - 1.2, bot = gAt(s) - 2, pw = span === 21 ? 3.4 : 2.1, pd = 5.2, y = (top + bot) / 2;
      // trụ (thon dần: phần đế rộng hơn φ lần)
      along(st, box(pd, top - bot, pw), COL.stone, s, 0, y, false);
      along(st, box(pd + 0.8, Math.min(8, top - bot), pw * 1.618), COL.stoneD, s, 0, bot + Math.min(8, top - bot) / 2, false);
      // vòm bán nguyệt tới trụ kế tiếp: lát cắt dọc (10 lát), mỗi lát lấp từ cung vòm lên mặt cầu
      const sn = s + span, hn = sn < LEN ? at(sn).y - gAt(sn) : 0;
      if (sn < LEN && !inTunnel(sn) && hn > 1.2) {
        const r = (span - pw) / 2, K = span === 21 ? 10 : 7, topN = deckTop(sn) - 1.2, spring = Math.min(top, topN) - r - 0.6;
        if (spring > Math.max(gAt(s), gAt(sn)) - 1) {
          for (let k = 0; k < K; k++) {
            const a0 = Math.PI * k / K, a1 = Math.PI * (k + 1) / K, xm = (Math.cos(a0) + Math.cos(a1)) / 2, ym = Math.min(Math.sin(a0), Math.sin(a1));
            const ss = s + span / 2 - xm * r, w = Math.abs(Math.cos(a1) - Math.cos(a0)) * r + 0.05, yb = spring + ym * r, yt = deckTop(ss) - 1.2;
            if (yt - yb > 0.05) along(st, box(pd - 0.4, yt - yb, w), COL.stone, ss, 0, (yt + yb) / 2, false);
          }
          // khối dưới chân vòm (từ đất lên chân vòm) khi trụ thấp không đủ
        } else {
          const sm2 = s + span / 2, yt = deckTop(sm2) - 1.2, yb = Math.max(bot, gAt(sm2) - 1);
          if (yt - yb > 0.1) along(st, box(pd - 0.4, yt - yb, span - pw + 0.1), COL.stoneD, sm2, 0, (yt + yb) / 2, false);   // nền đắp kín
        }
      }
    }
    s += 13;   // bước kiểm tra 13 m; nhịp 21 m bỏ qua bước kế tiếp
    if (span === 21) s += 8;
  }
  // cổng hầm (2 đầu): mặt đá rộng 21 m, cao 11 m, lòng vòm 5,6 × 6 m
  for (const sp of [TUNNEL.s0, TUNNEL.s1]) if (sp >= s0 && sp < s1) {
    const p = at(sp), y0 = p.y - 1;
    for (const sd of [-1, 1]) along(st, box(7.7, 12, 2), COL.portal, sp, sd * 6.65, y0 + 6, false);
    along(st, box(5.6, 5.4, 2), COL.portal, sp, 0, y0 + 6.6 + 2.7, false);
    along(st, box(22, 0.7, 2.6), COL.stoneD, sp, 0, y0 + 12.2, false);
  }
  // tà vẹt (LOD gần): mỗi 0,65 m
  for (let s2 = Math.ceil(s0 / 0.65) * 0.65; s2 < Math.min(s1, LEN); s2 += 0.65) { const p = at(s2); along(dt, box(2.6, 0.14, 0.24), COL.sleeper, s2, 0, p.y - RAIL_Y - 0.03); }
  return { st: st.build(), dt: dt.build() };
}

export function buildTrack(ctx, ground) {
  const group = new THREE.Group(); group.name = 'train-track';
  const chunks = [];
  for (let s0 = 0; s0 < LEN; s0 += CHUNK) {
    const { st, dt } = buildChunk(s0, Math.min(LEN, s0 + CHUNK), ground);
    const a = new THREE.Mesh(st, matV()); a.castShadow = a.receiveShadow = true;
    const b = new THREE.Mesh(dt, matV()); b.receiveShadow = true;
    for (const o of [a, b]) { o.matrixAutoUpdate = false; group.add(o); }
    const c = at(Math.min(LEN, s0 + CHUNK / 2)); chunks.push({ st: a, dt: b, c: new THREE.Vector3(c.x, c.y, c.z), r: st.boundingSphere.radius });
  }
  const isle = new THREE.Mesh(isletGeo(), matV()); isle.receiveShadow = isle.castShadow = true; isle.matrixAutoUpdate = false; isle.name = 'islet';
  group.add(isle); ctx.scene.add(group);
  const cam = new THREE.Vector3();
  // LOD: tà vẹt chỉ vẽ khi khúc nằm trong 144 m quanh camera
  function update() { ctx.camera.getWorldPosition(cam); for (const c of chunks) c.dt.visible = c.c.distanceTo(cam) - c.r < DETAIL_D; }
  return { group, chunks, isle, update };
}

// cây thông + đá trên đảo Đồi Thông (instancing chung của terrain.js)
export function plantIslet(ctx, nearest) {
  const { terrain } = ctx, pines = [], tall = [], rocks = []; let sd = 2584;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const N = CFG.isMobile ? 89 : 144, [cx, cz] = ISLET.c;
  for (let k = 0; k < N * 10 && pines.length + tall.length < N; k++) {
    const a = rnd() * 6.283, r = Math.sqrt(rnd()) * (ISLET.r - 21), x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r, h = isletHeight(x, z);
    if (h < 3 || nearest(x, z).dist < 9) continue;
    if (isletNatural(x, z) - h > 2) continue;   // không mọc trên vách xẻ
    (rnd() < 0.45 ? tall : pines).push([x, h - 0.2, z, 3.4 + rnd() * 1.8, rnd() * 6.28]);
  }
  for (let k = 0; k < 300 && rocks.length < 21; k++) {
    const a = rnd() * 6.283, r = ISLET.r - 34 + rnd() * 30, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r, h = isletHeight(x, z);
    if (h < -0.8 || h > 3 || nearest(x, z).dist < 6) continue; rocks.push([x, h - 0.3, z, 1.4 + rnd() * 2.2, rnd() * 6.28]);
  }
  terrain.nature.add('pine', pines); terrain.nature.add('pineTall', tall); terrain.nature.add('rockL', rocks);
  for (const [x, , z, s] of [...pines, ...tall]) ctx.colliders.push({ x, z, r: 0.1 * s });
}
export { NS, STEP, X, Z, TX, TZ, Y };
