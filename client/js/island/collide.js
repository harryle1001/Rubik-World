// collide.js — Lưới va chạm CHUNG cho mọi vật tĩnh (cây, ghế đá, cột đèn, hàng rào, sạp, đồ nội thất, tượng, đá…).
// Không cần từng file đăng ký: quét cảnh mỗi φ s, mesh/InstancedMesh nào ĐỨNG YÊN qua 2 lần quét thì "vẽ" các MẶT ĐỨNG
// (pháp tuyến nghiêng > 45°) của nó vào lưới ô 0,25 m (chunk 16 m, nạp dần theo khoảng cách người chơi, gỡ khi vật biến mất/di chuyển).
// Mỗi ô giữ ≤ 2 khoảng độ cao [lo, hi] → biết vật thấp (bước qua), vật treo cao (đi bên dưới), thân cây (chặn) mà tán cây trên đầu không chặn.
// Dùng: player.js (đi/chạy/xe đạp/thú cưỡi), silver-board.js (ván sát đất), camera (không chui vào thân cây/cột).
// Rẻ: tra 3×3–4×4 ô quanh nhân vật, không cấp phát mỗi khung; vẽ lưới chia nhỏ ≤ BUDGET ms/khung, vật gần trước.
import * as THREE from 'three';
import { CFG } from './config.js';
import { isOutlineMat } from './style.js';

export const CS = 0.25;                 // cạnh ô (m)
const CN = 64, CM = CS * CN, Q = 32;    // ô/chunk · cạnh chunk (16 m) · lượng tử độ cao 1/32 m (Int16)
export const LOW = 0.4, HEAD = 1.4;     // vật/mép cao ≤ 0,4 m trên chân: bước qua · đáy vật cao hơn đầu 1,4 m: đi dưới
const GAP = 1.7 * Q, SCAN = 1.618, BUDGET = CFG.isMobile ? 0.25 : 0.5;   // ms/khung cho việc nền (lập chỉ mục, vẽ chunk)
// nature-*: cây/đá/bụi của terrain.js đổi bản sao theo khoảng cách người chơi → đã có collider tròn riêng (terrain.js), không quét
const SKIP_NAME = /^(ground|seafloor|ocean|sky|nature-)|water/i, EMPTY_LO = 32767, EMPTY_HI = -32768;
const ck = (ci, cj) => (ci + 32768) * 65536 + (cj + 32768);

export function createCollide(ctx) {
  const chunks = new Map(), dirty = new Set(), byKey = new Map(), src = new Map(), dead = new WeakSet(), local = new WeakMap();
  let scanId = 0, clipKey = -1, lastKey = -1, lastCh = null;
  const _m = new THREE.Matrix4(), _w = new THREE.Matrix4(), stack = [];

  // ---------- ghi 1 đoạn độ cao vào ô (x, z) ----------
  function mark(x, z, y0, y1) {
    const ci = Math.floor(x / CS), cj = Math.floor(z / CS), key = ck(ci >> 6, cj >> 6);
    if (key !== clipKey) return;
    if (key !== lastKey) { lastKey = key; lastCh = chunks.get(key); } const ch = lastCh; if (!ch) return;
    const a = ch.a, i = (((cj & 63) << 6) | (ci & 63)) << 2;
    let lo = Math.floor(y0 * Q), hi = Math.ceil(y1 * Q); lo = lo < -32000 ? -32000 : lo > 32000 ? 32000 : lo; hi = hi < -32000 ? -32000 : hi > 32000 ? 32000 : hi;
    if (a[i] > a[i + 1]) { a[i] = lo; a[i + 1] = hi; ch.n++; return; }
    if (lo <= a[i + 1] + GAP && hi >= a[i] - GAP) { if (lo < a[i]) a[i] = lo; if (hi > a[i + 1]) a[i + 1] = hi; return; }
    if (a[i + 2] > a[i + 3]) { a[i + 2] = lo; a[i + 3] = hi; return; }
    const j = Math.abs(lo - a[i + 2]) < Math.abs(lo - a[i]) ? i + 2 : i; if (lo < a[j]) a[j] = lo; if (hi > a[j + 1]) a[j + 1] = hi;
  }
  // cạnh tam giác chiếu xuống mặt phẳng ngang, mỗi bước ≤ ½ ô; mỗi bước ghi khoảng độ cao cạnh đi qua
  function edge(ax, ay, az, bx, by, bz) {
    const dx = bx - ax, dy = by - ay, dz = bz - az, n = Math.max(1, Math.ceil(Math.sqrt(dx * dx + dz * dz) / (CS * 0.5)));
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, y0 = ay + dy * k / n, y1 = ay + dy * (k + 1) / n; mark(ax + dx * t, az + dz * t, y0 < y1 ? y0 : y1, y0 < y1 ? y1 : y0); }
  }
  function tri(ax, ay, az, bx, by, bz, cx, cy, cz) {
    const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l2 = nx * nx + ny * ny + nz * nz;
    if (l2 < 1e-12 || ny * ny > 0.5 * l2) return;   // mặt gần nằm ngang (sàn, mặt ghế, tán phẳng): không chặn
    const y0 = Math.min(ay, by, cy), y1 = Math.max(ay, by, cy); if (y1 - y0 < 0.03) return;
    { const x0 = Math.min(ax, bx, cx), x1 = Math.max(ax, bx, cx), z0 = Math.min(az, bz, cz), z1 = Math.max(az, bz, cz), ci = Math.floor(clipKey / 65536) - 32768, cj = clipKey % 65536 - 32768;
      if (x1 < ci * CM - CS || x0 > (ci + 1) * CM + CS || z1 < cj * CM - CS || z0 > (cj + 1) * CM + CS) return; }
    edge(ax, ay, az, bx, by, bz); edge(bx, by, bz, cx, cy, cz); edge(cx, cy, cz, ax, ay, az);
  }
  // tam giác mặt đứng của 1 geometry (toạ độ cục bộ) — chỉ cho InstancedMesh (geometry nhỏ, dùng chung mọi bản sao)
  function localTris(g) {
    let L = local.get(g); if (L) return L;
    const p = g.attributes.position, ix = g.index, n = ((ix ? ix.count : p.count) / 3) | 0, out = [];
    for (let t = 0; t < n; t++) {
      const a = ix ? ix.getX(t * 3) : t * 3, b = ix ? ix.getX(t * 3 + 1) : t * 3 + 1, c = ix ? ix.getX(t * 3 + 2) : t * 3 + 2;
      const ax = p.getX(a), ay = p.getY(a), az = p.getZ(a), bx = p.getX(b), by = p.getY(b), bz = p.getZ(b), cx = p.getX(c), cy = p.getY(c), cz = p.getZ(c);
      const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az, nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l2 = nx * nx + ny * ny + nz * nz;
      if (l2 < 1e-14 || ny * ny > 0.7 * l2) continue;
      out.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    }
    L = new Float32Array(out); local.set(g, L); return L;
  }
  // ---------- 1 nguồn = 1 Mesh hoặc 1 InstancedMesh ----------
  // lập chỉ mục 1 lần: chunk → danh sách tam giác (Mesh) / bản sao (InstancedMesh) chạm chunk đó; vẽ thật chỉ khi chunk được nạp
  const V = new Float32Array(9);
  function vert(p, e, i, k) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); V[k] = e[0] * x + e[4] * y + e[8] * z + e[12]; V[k + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; V[k + 2] = e[2] * x + e[6] * y + e[10] * z + e[14]; }
  function loadTri(g, e, t) { const ix = g.index, p = g.attributes.position; for (let k = 0; k < 3; k++) vert(p, e, ix ? ix.getX(t * 3 + k) : t * 3 + k, k * 3); }
  function addB(s, key, v) { let b = s.b.get(key); if (!b) { s.b.set(key, b = []); let S = byKey.get(key); if (!S) byKey.set(key, S = new Set()); S.add(s); } b.push(v); }
  function indexStep(s, until) {   // trả true khi xong
    const o = s.o, g = o.geometry;
    if (o.isInstancedMesh) {
      const bb = g.boundingBox, hy = bb.max.y - bb.min.y, r0 = Math.hypot(bb.max.x - bb.min.x, bb.max.z - bb.min.z) / 2, cx = (bb.max.x + bb.min.x) / 2, cz = (bb.max.z + bb.min.z) / 2;
      if (!localTris(g).length) return true;
      for (; s.ti < o.count; s.ti++) {
        o.getMatrixAt(s.ti, _m); _w.multiplyMatrices(o.matrixWorld, _m); const e = _w.elements, sy = Math.hypot(e[4], e[5], e[6]), sx = Math.hypot(e[0], e[1], e[2]);
        if (hy * sy < LOW * 0.75) continue;   // cỏ, hoa, nấm nhỏ: đi qua
        const x = e[0] * cx + e[8] * cz + e[12], z = e[2] * cx + e[10] * cz + e[14], r = r0 * sx + CS;
        for (let i = Math.floor((x - r) / CM); i <= Math.floor((x + r) / CM); i++) for (let j = Math.floor((z - r) / CM); j <= Math.floor((z + r) / CM); j++) addB(s, ck(i, j), s.ti);
        if ((s.ti & 31) === 31 && performance.now() > until) { s.ti++; return false; }
      }
      return true;
    }
    const e = o.matrixWorld.elements, n = (((g.index ? g.index.count : g.attributes.position.count) / 3) | 0);
    for (; s.ti < n; s.ti++) {
      loadTri(g, e, s.ti);
      const ux = V[3] - V[0], uy = V[4] - V[1], uz = V[5] - V[2], vx = V[6] - V[0], vy = V[7] - V[1], vz = V[8] - V[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l2 = nx * nx + ny * ny + nz * nz;
      if (l2 < 1e-12 || ny * ny > 0.5 * l2 || Math.max(V[1], V[4], V[7]) - Math.min(V[1], V[4], V[7]) < 0.03) continue;
      const x0 = Math.min(V[0], V[3], V[6]) - CS, x1 = Math.max(V[0], V[3], V[6]) + CS, z0 = Math.min(V[2], V[5], V[8]) - CS, z1 = Math.max(V[2], V[5], V[8]) + CS;
      for (let i = Math.floor(x0 / CM); i <= Math.floor(x1 / CM); i++) for (let j = Math.floor(z0 / CM); j <= Math.floor(z1 / CM); j++) addB(s, ck(i, j), s.ti);
      if ((s.ti & 255) === 255 && performance.now() > until) { s.ti++; return false; }
    }
    return true;
  }
  // vẽ phần của nguồn s nằm trong chunk key (job.p: vị trí trong danh sách)
  function rasterStep(jb, until) {
    const s = jb.s, o = s.o, g = o.geometry, list = s.b.get(jb.key); if (!list) return true;
    clipKey = jb.key; lastKey = -1;
    if (o.isInstancedMesh) {
      const L = localTris(g), nT = L.length;
      for (; jb.p < list.length; jb.p++) {
        o.getMatrixAt(list[jb.p], _m); _w.multiplyMatrices(o.matrixWorld, _m); const e = _w.elements;
        for (let b = 0; b < nT; b += 9) {
          for (let k = 0; k < 9; k += 3) { const x = L[b + k], y = L[b + k + 1], z = L[b + k + 2]; V[k] = e[0] * x + e[4] * y + e[8] * z + e[12]; V[k + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; V[k + 2] = e[2] * x + e[6] * y + e[10] * z + e[14]; }
          tri(V[0], V[1], V[2], V[3], V[4], V[5], V[6], V[7], V[8]);
        }
        if (performance.now() > until) { jb.p++; clipKey = -1; return false; }
      }
    } else {
      const e = o.matrixWorld.elements;
      for (; jb.p < list.length; jb.p++) {
        loadTri(g, e, list[jb.p]); tri(V[0], V[1], V[2], V[3], V[4], V[5], V[6], V[7], V[8]);
        if ((jb.p & 127) === 127 && performance.now() > until) { jb.p++; clipKey = -1; return false; }
      }
    }
    clipKey = -1; return true;
  }

  // ---------- quét cảnh: tìm mesh tĩnh mới, gỡ mesh đã mất/di chuyển ----------
  const solid = m => m && m.visible !== false && !isOutlineMat(m) && !(m.transparent && (m.depthWrite === false || m.opacity < 0.6));
  const sig = o => { const e = o.matrixWorld.elements; return e[0] * 3.1 + e[2] * 5.3 + e[5] * 7.7 + e[12] * 11.3 + e[13] * 13.1 + e[14] * 17.9 + (o.isInstancedMesh ? o.instanceMatrix.version * 19.7 + o.count * 23.3 : 0); };
  function unregister(s) {
    for (const key of s.b.keys()) { const S = byKey.get(key); if (S) { S.delete(s); if (!S.size) byKey.delete(key); } if (chunks.has(key)) dirty.add(key); }
    s.b.clear(); s.state = 0; s.ti = 0;
  }
  function scan() {
    scanId++; const skipRoot = ctx.player && ctx.player.root;
    stack.length = 0; stack.push(ctx.scene);
    while (stack.length) {
      const o = stack.pop();
      if (!o.visible || o === skipRoot || o.isBone || o.isSkinnedMesh || o.userData.outline || o.userData.noCollide || dead.has(o) || SKIP_NAME.test(o.name)) continue;
      for (let i = 0; i < o.children.length; i++) stack.push(o.children[i]);
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.position || (Array.isArray(o.material) ? !o.material.every(solid) : !solid(o.material))) continue;
      if (o.isInstancedMesh && o.count === 0) continue;
      let s = src.get(o); const sg = sig(o);
      if (!s) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); src.set(o, s = { o, sg, seen: scanId, state: 0, moves: 0, b: new Map(), ti: 0 }); continue; }
      s.seen = scanId;
      if (s.sg !== sg) {   // vừa di chuyển / đổi bản sao (cây nạp theo ô đất…): gỡ rồi đăng ký lại; đổi ở 3 lần quét LIÊN TIẾP → vật động (người, xe, thuyền, chim…) bỏ hẳn
        s.sg = sg; if (s.state) unregister(s); if (++s.moves >= 3) { dead.add(o); src.delete(o); } continue;
      }
      s.moves = 0;
      if (s.state === 0) { s.state = 1; s.ti = 0; pending.push(s); }   // đứng yên qua 2 lần quét → lập chỉ mục
    }
    for (const s of src.values()) if (s.seen !== scanId) { if (s.state) unregister(s); src.delete(s.o); }   // đã gỡ khỏi cảnh / bị ẩn
    // nguồn chờ lập chỉ mục: gần người chơi trước
    const P = ctx.player && ctx.player.pos;
    if (P && pending.length > 1) { for (const q of pending) { const e = q.o.matrixWorld.elements, g = q.o.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
      q.d = q.o.isInstancedMesh ? 0 : Math.max(0, Math.hypot(e[12] + g.boundingSphere.center.x - P.x, e[14] + g.boundingSphere.center.z - P.z) - g.boundingSphere.radius * Math.hypot(e[0], e[1], e[2])); }
      pending.sort((a, b) => a.d - b.d); }
  }
  // nạp chunk trong BUILD m quanh người chơi (gần trước), bỏ chunk xa hơn DROP m
  const BUILD = 40, DROP = 72, want = [];
  function plan() {
    const P = ctx.player && ctx.player.pos; if (!P) return;
    for (const [key, ch] of chunks) { const i = Math.floor(key / 65536) - 32768, j = key % 65536 - 32768; if (Math.hypot((i + 0.5) * CM - P.x, (j + 0.5) * CM - P.z) > DROP) { chunks.delete(key); dirty.delete(key); if (ch === lastCh) { lastKey = -1; lastCh = null; } } }
    want.length = 0; const r = Math.ceil(BUILD / CM), pi = Math.floor(P.x / CM), pj = Math.floor(P.z / CM);
    for (let i = pi - r; i <= pi + r; i++) for (let j = pj - r; j <= pj + r; j++) {
      const key = ck(i, j), d = Math.hypot(Math.max(0, Math.abs((i + 0.5) * CM - P.x) - CM / 2), Math.max(0, Math.abs((j + 0.5) * CM - P.z) - CM / 2));
      if (d <= BUILD && (!chunks.has(key) || dirty.has(key))) want.push(Math.floor(d * 16) * 1e10 + key);
    }
    want.sort((a, b) => a - b);
  }
  let bjob = null; const pending = [];
  function newChunk(key) { const a = new Int16Array(CN * CN * 4); for (let i = 0; i < a.length; i += 2) { a[i] = EMPTY_LO; a[i + 1] = EMPTY_HI; } const ch = { a, n: 0 }; chunks.set(key, ch); if (key === lastKey) lastCh = ch; return ch; }
  function work(budget) {
    const until = performance.now() + budget;
    while (performance.now() < until) {
      if (bjob) {   // đang nạp 1 chunk: vẽ lần lượt các nguồn chạm chunk
        if (bjob.i >= bjob.list.length) { bjob = null; continue; }
        const jb = bjob.list[bjob.i]; if (jb.s.state !== 2 || rasterStep(jb, until)) bjob.i++;
        continue;
      }
      if (pending.length) {   // nguồn mới: lập chỉ mục; chunk đã nạp mà nguồn chạm tới → đánh dấu dựng lại
        const s = pending[0]; if (s.state !== 1) { pending.shift(); continue; }
        if (indexStep(s, until)) { s.state = 2; pending.shift(); for (const key of s.b.keys()) if (chunks.has(key)) dirty.add(key); }
        continue;
      }
      let key = -1; while (want.length) { const w = want.shift(), k = w % 1e10; if (!chunks.has(k) || dirty.has(k)) { key = k; break; } }
      if (key < 0) return;
      dirty.delete(key); newChunk(key);
      const S = byKey.get(key); bjob = { i: 0, list: S ? [...S].filter(s => s.state === 2).map(s => ({ s, key, p: 0 })) : [] };
    }
  }
  // ---------- tra cứu ----------
  const cellAt = (ci, cj) => { const ch = chunks.get(ck(ci >> 6, cj >> 6)); return ch && ch.n ? ch.a : null; };
  const idx = (ci, cj) => (((cj & 63) << 6) | (ci & 63)) << 2;
  // ô (ci, cj) có chặn thân người đứng ở chân y, nền đích g không? (vật thấp ≤ LOW trên nền: bước qua; đáy cao hơn đầu: đi dưới)
  function cellBlocks(a, i, y, g) {
    const base = (y > g ? y : g) * Q + LOW * Q, head = (y + HEAD) * Q;
    return (a[i] <= a[i + 1] && a[i + 1] > base && a[i] < head) || (a[i + 2] <= a[i + 3] && a[i + 3] > base && a[i + 2] < head);
  }
  const out = { x: 0, z: 0, hit: false };
  // đẩy vòng tròn bán kính R (tâm nx, nz) ra khỏi các ô chặn; ô đã chồng lên vị trí cũ (ox, oz) thì bỏ qua (vừa lên/xuống xe, dịch chuyển: tự thoát ra được)
  function resolve(ox, oz, nx, nz, y, R, gAt) {
    out.hit = false; let g = null;
    for (let pass = 0; pass < 3; pass++) {
      const i0 = Math.floor((nx - R) / CS), i1 = Math.floor((nx + R) / CS), j0 = Math.floor((nz - R) / CS), j1 = Math.floor((nz + R) / CS); let moved = false;
      for (let cj = j0; cj <= j1; cj++) for (let ci = i0; ci <= i1; ci++) {
        const a = cellAt(ci, cj); if (!a) continue; const i = idx(ci, cj); if (a[i] > a[i + 1] && a[i + 2] > a[i + 3]) continue;
        const x0 = ci * CS, z0 = cj * CS, qx = nx < x0 ? x0 : nx > x0 + CS ? x0 + CS : nx, qz = nz < z0 ? z0 : nz > z0 + CS ? z0 + CS : nz;
        let dx = nx - qx, dz = nz - qz, d2 = dx * dx + dz * dz; if (d2 >= R * R) continue;
        if (g === null) g = gAt ? gAt(nx, nz, y) : y;
        if (!cellBlocks(a, i, y, g)) continue;
        // vị trí cũ đã chồng ô (vừa lên/xuống xe, dịch chuyển): không cho lún sâu thêm, đi ra thì được
        const px = ox < x0 ? x0 : ox > x0 + CS ? x0 + CS : ox, pz = oz < z0 ? z0 : oz > z0 + CS ? z0 + CS : oz, dO = Math.sqrt((ox - px) ** 2 + (oz - pz) ** 2), Rc = dO < R - 0.02 ? dO : R;
        let d = Math.sqrt(d2); if (d >= Rc - 1e-4) continue;
        if (d < 1e-5) { if (Rc < 1e-3) continue; dx = nx - (x0 + CS / 2); dz = nz - (z0 + CS / 2); d = Math.hypot(dx, dz) || 1; d2 = 0; }
        const k = d2 ? (Rc - d) / d : (Rc + CS) / d; nx += dx * k; nz += dz * k; out.hit = moved = true;
      }
      if (!moved) break;
    }
    out.x = nx; out.z = nz; return out;
  }
  // chặn tại điểm (x, z) với chân y? (NPC, ván bay…)
  function blocked(x, z, y, g = y) { const ci = Math.floor(x / CS), cj = Math.floor(z / CS), a = cellAt(ci, cj); return !!a && cellBlocks(a, idx(ci, cj), y, g); }
  // camera: đi dọc tia điểm nhìn → camera, gặp ô có vật đứng chạm xuống gần điểm nhìn (thân cây, cột, tường) → trả khoảng cách an toàn
  function camClear(px, py, pz, dx, dy, dz, dist) {
    for (let t = 0.75; t < dist; t += CS * 0.75) {
      const x = px + dx * t, y = py + dy * t, z = pz + dz * t, ci = Math.floor(x / CS), cj = Math.floor(z / CS), a = cellAt(ci, cj); if (!a) continue;
      const i = idx(ci, cj), yq = y * Q, lim = (py + 0.5) * Q, m = 0.2 * Q;
      if ((a[i] <= a[i + 1] && a[i] < lim && yq > a[i] - m && yq < a[i + 1] + m) || (a[i + 2] <= a[i + 3] && a[i + 2] < lim && yq > a[i + 2] - m && yq < a[i + 3] + m)) return Math.max(0.5, t - 0.35);
    }
    return dist;
  }
  let nextScan = 0, nextPlan = 0;
  function update() {   // theo đồng hồ thật (không theo dt bị kẹp khi khung chậm)
    const now = performance.now();
    if (now >= nextScan) { nextScan = now + (nextScan ? SCAN * 1000 : 500); scan(); return; }
    if (now >= nextPlan) { nextPlan = now + 250; plan(); }
    work(BUDGET);
  }
  const stats = () => { let n = 0, q = 0, idx = 0; for (const s of src.values()) { if (s.state === 2) n++; else if (s.state === 1) q++; for (const b of s.b.values()) idx += b.length; } return { chunks: chunks.size, sources: n, queued: q, idx, want: want.length, kb: chunks.size * CN * CN * 8 / 1024 | 0 }; };
  const debugSrc = o => { const s = src.get(o); return s ? { state: s.state, moves: s.moves, keys: s.b.size, dead: dead.has(o) } : { none: true, dead: dead.has(o) }; };
  return { debugSrc, update, resolve, blocked, camClear, stats, scan, work, plan, cellAt, idx, CS, LOW, HEAD };
}
