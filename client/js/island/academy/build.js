// academy/build.js — 🧊 ĐỒNG PHA LÊ: dùng phép tạo KHỐI VUÔNG PHA LÊ, xếp như ghép hình để xây nhà cao, tháp, lâu đài.
// Đồng cỏ phía nam đảo Học viện: 10 lô 21 × 21 ô (1 ô = 1 m), cao tối đa 34 tầng, mỗi người nhận 1 lô; lưu trên server
// (data/builds.json, net 'build:*'), mọi người cùng thấy; chỉ chủ lô sửa được. Không có mạng → chơi một mình, lưu trên máy.
// Mỗi khối tốn 1 năng lượng phép (phá khối hoàn 1); hết năng lượng → trả lời đúng 1 câu đố để nạp. Mẫu dựng sẵn (nhà, tháp,
// lâu đài, khối Rubik) đặt dần từng khối, kèm phép tính số khối (dài × rộng × cao).
// Hình: mỗi lô 1 InstancedMesh hộp 1 m (texture pha lê vẽ canvas, màu theo instanceColor) → ≤ 10 draw call, ẩn lô ngoài 89 m.
import * as THREE from 'three';
import { heightLocal } from './plan.js';

const W = 21, H = 34, MAXB = 2584, NP = 10, U0 = 150, V0 = 46, GAP = 2, COST = 1;
export const BUILD_SITE = { u0: U0 - 3, u1: U0 + 2 * W + GAP + 3, v0: V0 - 3, v1: V0 + 5 * W + 4 * GAP + 3 };   // island.js: không trồng cây ở đây
export const CRYSTAL = ['#f2f6ff', '#ff4b5c', '#ff9a3c', '#ffd84d', '#3ddc84', '#4aa8ff', '#a98bff', '#ff7ac8'];   // 6 màu Rubik + tím, hồng
const NAMES = ['Trắng', 'Đỏ', 'Cam', 'Vàng', 'Lục', 'Lam', 'Tím', 'Hồng'];
const plotUV = i => [U0 + Math.floor(i / 5) * (W + GAP), V0 + (i % 5) * (W + GAP)];   // góc lô (u, v) — 2 hàng × 5 lô
const idxOf = (i, j, k) => i + j * W + k * W * W, cellOf = n => [n % W, Math.floor(n / W) % W, Math.floor(n / (W * W))];

// ---------- mẫu dựng sẵn: danh sách [x, y, z, màu] (x dọc v, z dọc u, y tầng) ----------
function box(out, x0, y0, z0, x1, y1, z1, c, hollow = true) {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++)
    if (!hollow || x === x0 || x === x1 || z === z0 || z === z1) out.push([x, y, z, c]);
}
export const TEMPLATES = [
  { id: 'rubik', name: '🧊 Khối Rubik 3×3×3', make() { const o = []; for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) for (let z = 0; z < 3; z++) o.push([x, y, z, 1 + ((x + y * 2 + z * 3) % 6)]); return o; }, fact: 'Khối lập phương cạnh 3 có <b>3 × 3 × 3 = 27</b> khối nhỏ — 3 lập phương (3³).' },
  { id: 'house', name: '🏠 Nhà nhỏ 5×5', make() { const o = []; box(o, 0, 0, 0, 4, 2, 4, 4); for (const p of [[2, 0, 0], [2, 1, 0]]) { const k = o.findIndex(b => b[0] === p[0] && b[1] === p[1] && b[2] === p[2]); if (k >= 0) o.splice(k, 1); }
      for (let y = 0; y < 3; y++) for (let x = y; x <= 4 - y; x++) for (let z = 0; z <= 4; z++) if (x === y || x === 4 - y) o.push([x, 3 + y, z, 2]); return o; }, fact: 'Tường nhà là hình hộp rỗng: chu vi 5 × 4 − 4 = <b>16</b> khối mỗi tầng; mái dốc xếp bậc thang.' },
  { id: 'tower', name: '🗼 Tháp canh 3×3', make() { const o = []; box(o, 0, 0, 0, 2, 10, 2, 6); o.splice(o.findIndex(b => b[0] === 1 && b[1] === 0 && b[2] === 0), 1);
      for (const [x, z] of [[0, 0], [2, 0], [0, 2], [2, 2]]) o.push([x, 11, z, 7]); return o; }, fact: 'Tháp 3 × 3 cao 11 tầng: mỗi tầng 8 khối (rỗng giữa) → <b>8 × 11 = 88</b> khối, thêm 4 răng cưa trên đỉnh.' },
  { id: 'castle', name: '🏰 Lâu đài mini 13×13', make() { const o = []; box(o, 0, 0, 0, 12, 3, 12, 1);
      for (const x of [5, 6, 7]) for (const y of [0, 1, 2]) { const k = o.findIndex(b => b[0] === x && b[1] === y && b[2] === 0); if (k >= 0) o.splice(k, 1); }
      for (let x = 0; x <= 12; x += 2) for (const z of [0, 12]) o.push([x, 4, z, 1]); for (let z = 2; z <= 10; z += 2) for (const x of [0, 12]) o.push([x, 4, z, 1]);
      for (const [x, z] of [[0, 0], [10, 0], [0, 10], [10, 10]]) { box(o, x, 0, z, x + 2, 7, z + 2, 6); for (const [a, b] of [[0, 0], [2, 0], [0, 2], [2, 2]]) o.push([x + a, 8, z + b, 2]); }
      const seen = new Set(); return o.filter(b => { const k = b.slice(0, 3).join(); if (seen.has(k)) return false; seen.add(k); return true; }); },
    fact: 'Lâu đài = 4 bức tường hình hộp + 4 tháp góc 3 × 3. Đếm thử: mỗi tháp 8 khối × 8 tầng = <b>64</b> khối!' },
];

function crystalTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 64, 64); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, '#e4e8ee'); gr.addColorStop(1, '#b8c0cc'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 4; g.strokeRect(2, 2, 60, 60);               // viền vát sáng
  g.strokeStyle = 'rgba(80,100,130,.35)'; g.lineWidth = 2; g.strokeRect(7, 7, 50, 50);
  g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(12, 12); g.lineTo(30, 12); g.lineTo(12, 30); g.fill();   // mặt cắt lấp lánh
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export function create(ctx, magic, { toWorld, toLocal }) {
  let intro = false, built = null, mode = false, color = 1, removing = false, ui = null, queue = [], qT = 0, mine = -1, online = false;
  const plots = Array.from({ length: NP }, () => ({ name: null, blocks: new Map() }));   // blocks: idx → màu (1..8)
  const key = (() => { try { let k = localStorage.getItem('build.key'); if (!k) { k = Array.from(crypto.getRandomValues(new Uint8Array(13)), b => (b % 36).toString(36)).join(''); localStorage.setItem('build.key', k); } return k; } catch (e) { return 'offline' + Math.random().toString(36).slice(2, 12); } })();
  const myName = () => (ctx.account && !ctx.account.guest && ctx.account.name) || ctx.playerName || 'Bạn nhỏ';
  // Y0: mặt đất thấp nhất cả đồng (tầng 0); khối ở tầng k: đáy = Y0 + k
  let Y0 = 0;
  const gyAt = (x, z) => { const [u, v] = toLocal(x, z); return heightLocal(u, v, x, z); };
  const origin = i => { const [u, v] = plotUV(i), [x, z] = toWorld(u, v); return [Math.round(x), Math.round(z)]; };   // góc lô làm tròn về lưới 1 m

  // ---------- mạng ----------
  const local = { load() { try { const d = JSON.parse(localStorage.getItem('build.local')); if (d) { plots[0].name = myName(); plots[0].blocks = new Map(d); mine = 0; } } catch (e) {} }, save() { if (online) return; try { localStorage.setItem('build.local', JSON.stringify([...plots[0].blocks])); } catch (e) {} } };
  if (ctx.net && ctx.net.on) {
    ctx.net.on('connect', () => ctx.net.emit('build:hello', { key }));
    ctx.net.on('build:all', d => { online = true; d.plots.forEach((p, i) => { if (!plots[i]) return; plots[i].name = p.name; plots[i].blocks = new Map(Object.entries(p.blocks).map(([a, b]) => [+a, b])); }); mine = d.mine; for (let i = 0; i < NP; i++) refresh(i); });
    ctx.net.on('build:plot', ([i, name]) => { plots[i].name = name; plots[i].blocks.clear(); refresh(i); });
    ctx.net.on('build:mine', i => { mine = i; ctx.toast(`🧊 Lô <b>${i + 1}</b> là của em! Bấm <b>🧊 Xây</b> để tạo khối pha lê.`, 5000); refresh(i); });
    ctx.net.on('build:fix', ([i, blocks]) => { if (!plots[i]) return; plots[i].blocks = new Map(Object.entries(blocks).map(([a, b]) => [+a, b])); refresh(i); });
    ctx.net.on('build:set', ([i, list]) => { const P = plots[i]; if (!P) return; for (const [n, c] of list) c ? P.blocks.set(n, c) : P.blocks.delete(n); refresh(i); });
    setTimeout(() => { if (ctx.net.emit('build:hello', { key })) return; if (!online) local.load(); }, 1500);
  } else local.load();

  // ---------- dựng ----------
  function build() {
    const g = new THREE.Group(); g.name = 'academy-build'; ctx.scene.add(g);
    Y0 = Infinity; for (let i = 0; i < NP; i++) { const [x, z] = origin(i); for (let a = 0; a <= W; a += 3) for (let b = 0; b <= W; b += 3) Y0 = Math.min(Y0, gyAt(x + a, z + b)); }
    Y0 = Math.floor(Y0);
    const geo = new THREE.BoxGeometry(1, 1, 1), mat = new THREE.MeshPhongMaterial({ map: crystalTex(), shininess: 89, specular: 0x8899aa, emissive: 0x0a0d12 });
    const meshes = [], boxes = [];
    for (let i = 0; i < NP; i++) { const m = new THREE.InstancedMesh(geo, mat, MAXB); m.count = 0; m.name = 'build-plot-' + i; m.castShadow = m.receiveShadow = true; m.frustumCulled = true; g.add(m); meshes.push(m); boxes.push([]); }
    // viền lô: cột pha lê nhỏ ở 4 góc + vạch nền (1 LineSegments)
    const lp = [], posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.16, 1.6, 6), new THREE.MeshPhongMaterial({ color: 0xbfd8ff, emissive: 0x334466 }), NP * 4); let pi = 0;
    const M = new THREE.Matrix4();
    for (let i = 0; i < NP; i++) {
      const [x, z] = origin(i), cs = [[0, 0], [W, 0], [W, W], [0, W]];
      cs.forEach(([a, b], k) => { const [c, d] = cs[(k + 1) % 4]; lp.push(x + a, gyAt(x + a, z + b) + 0.06, z + b, x + c, gyAt(x + c, z + d) + 0.06, z + d); posts.setMatrixAt(pi++, M.makeTranslation(x + a, gyAt(x + a, z + b) + 0.8, z + b)); });
    }
    const lines = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)), new THREE.LineBasicMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.8 }));
    g.add(lines, posts);
    // bảng tên chủ lô (sprite, chỉ hiện khi lại gần)
    const tags = Array.from({ length: NP }, (_, i) => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false })); const [x, z] = origin(i); s.position.set(x + W / 2, gyAt(x + W / 2, z) + 3.2, z - 0.3); s.scale.set(4, 1, 1); s.userData.c = c; g.add(s); return s; });
    // khung ngắm (xanh: đặt · đỏ: phá)
    const ghost = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.03, 1.03, 1.03)), new THREE.LineBasicMaterial({ color: 0x7dffb0, depthTest: false, transparent: true })); ghost.renderOrder = 9; ghost.visible = false; g.add(ghost);
    built = { g, meshes, boxes, tags, ghost, mat };
    for (let i = 0; i < NP; i++) refresh(i);
  }
  function unbuild() {
    if (!built) return; setMode(false);
    for (const L of built.boxes) for (const b of L) { const k = ctx.boxes.indexOf(b); if (k >= 0) ctx.boxes.splice(k, 1); }
    ctx.scene.remove(built.g); built.g.traverse(o => { if (o.isInstancedMesh) o.dispose(); }); built = null;
  }
  const col = new THREE.Color(), M4 = new THREE.Matrix4();
  function refresh(i) {
    if (!built) return; const P = plots[i], m = built.meshes[i], [x, z] = origin(i); let n = 0;
    const tops = new Map();                                   // va chạm: mỗi cột 1 hộp, cao tới hết chồng khối liền từ khối thấp nhất
    for (const [idx, c] of P.blocks) { if (n >= MAXB) break; const [a, b, k] = cellOf(idx); m.setMatrixAt(n, M4.makeTranslation(x + a + 0.5, Y0 + k + 0.5, z + b + 0.5)); m.setColorAt(n, col.set(CRYSTAL[c - 1])); n++; const q = a + b * W; (tops.get(q) || tops.set(q, []).get(q)).push(k); }
    m.count = n; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.computeBoundingSphere();
    for (const b of built.boxes[i]) { const k = ctx.boxes.indexOf(b); if (k >= 0) ctx.boxes.splice(k, 1); }
    built.boxes[i] = [];
    for (const [q, ks] of tops) { ks.sort((a, b) => a - b); let t = ks[0]; for (const k of ks) if (k <= t + 1) t = Math.max(t, k); const a = q % W, b = Math.floor(q / W), bx = { x0: x + a, x1: x + a + 1, z0: z + b, z1: z + b + 1, top: Y0 + t + 1, build: true }; built.boxes[i].push(bx); ctx.boxes.push(bx); }
    const tc = built.tags[i].userData.c, g2 = tc.getContext('2d'), w = 250; g2.clearRect(0, 0, 256, 64); g2.fillStyle = i === mine ? 'rgba(40,90,70,.85)' : 'rgba(27,22,38,.75)'; g2.beginPath(); g2.roundRect(3, 6, w, 52, 24); g2.fill();
    g2.fillStyle = '#fff'; g2.font = 'bold 26px system-ui'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText(`Lô ${i + 1} · ${P.name || 'còn trống'}${P.blocks.size ? ' · ' + P.blocks.size + '🧊' : ''}`, 128, 33, 236);
    built.tags[i].material.map.needsUpdate = true;
  }

  // ---------- ngắm: DDA qua lưới khối + dò mặt đất ----------
  function plotAt(x, z) { for (let i = 0; i < NP; i++) { const [px, pz] = origin(i); if (x >= px && x < px + W && z >= pz && z < pz + W) return [i, Math.floor(x - px), Math.floor(z - pz)]; } return null; }
  const occ = (X, Y, Z) => { const p = plotAt(X + 0.5, Z + 0.5); if (!p) return 0; const k = Y - Y0; if (k < 0 || k >= H) return 0; return plots[p[0]].blocks.get(idxOf(p[1], p[2], k)) || 0; };
  function aim() {
    const o = ctx.camera.position, d = new THREE.Vector3(); ctx.camera.getWorldDirection(d);
    const pp = ctx.player.pos, skip = o.distanceTo(pp) * 0.7;              // ngắm từ camera, bỏ đoạn sau lưng nhân vật
    let X = Math.floor(o.x), Y = Math.floor(o.y), Z = Math.floor(o.z), last = null;
    const st = [Math.sign(d.x), Math.sign(d.y), Math.sign(d.z)], tD = [Math.abs(1 / d.x), Math.abs(1 / d.y), Math.abs(1 / d.z)];
    const tM = [(st[0] > 0 ? X + 1 - o.x : o.x - X) * tD[0], (st[1] > 0 ? Y + 1 - o.y : o.y - Y) * tD[1], (st[2] > 0 ? Z + 1 - o.z : o.z - Z) * tD[2]];
    let t = 0, ground = null;
    for (let s = 0; s < 120 && t < 21 + skip; s++) {
      const a = tM[0] < tM[1] ? (tM[0] < tM[2] ? 0 : 2) : (tM[1] < tM[2] ? 1 : 2), t1 = tM[a];
      for (let q = t; q < t1 && !ground; q += 0.25) { const px = o.x + d.x * q, pz = o.z + d.z * q, py = o.y + d.y * q; if (q > skip && py < gyAt(px, pz)) ground = new THREE.Vector3(px, py, pz); }
      if (ground) break;
      last = [X, Y, Z]; t = t1; tM[a] += tD[a]; if (a === 0) X += st[0]; else if (a === 1) Y += st[1]; else Z += st[2];
      if (t > skip && occ(X, Y, Z)) return { hit: [X, Y, Z], place: last };
    }
    if (!ground) {                                           // camera nhìn ngang/lên trời: lấy ô mặt đất ngay trước mặt nhân vật (2 m)
      const f = new THREE.Vector3(d.x, 0, d.z).normalize(); if (!f.lengthSq()) return null;
      ground = pp.clone().addScaledVector(f, 2);
      for (let q = 0; q < 8; q++) { const c = [Math.floor(ground.x), Math.floor(gyAt(ground.x, ground.z) + 0.35 - Y0) + Y0 + q, Math.floor(ground.z)]; if (!occ(...c)) return { hit: q ? [c[0], c[1] - 1, c[2]] : null, place: c }; }
      return null;
    }
    const gx = Math.floor(ground.x), gz = Math.floor(ground.z), gk = Math.floor(gyAt(gx + 0.5, gz + 0.5) - Y0 + 0.35);
    return { hit: null, place: [gx, Y0 + Math.max(0, gk), gz] };
  }
  const toCell = ([X, Y, Z]) => { const p = plotAt(X + 0.5, Z + 0.5); if (!p) return null; const k = Y - Y0; return k >= 0 && k < H ? { p: p[0], idx: idxOf(p[1], p[2], k) } : null; };

  // ---------- đặt / phá (kèm năng lượng phép) ----------
  function needWand() {
    if (magic.hasWand) return false;
    ctx.toast('🪄 Cần <b>đũa phép</b> để tạo khối pha lê — nhận miễn phí ở <b>Tiệm Đũa Pha Lê</b> (Phố Phép Thuật).', 5000); return true;
  }
  let asking = 0;
  function needMana(n = COST) {
    if (magic.mana >= n) return false;
    if (performance.now() < asking) return true; asking = performance.now() + 8000;   // đang hỏi: chờ (sai thì 8 s sau hỏi câu khác)
    magic.ask(['toan', 'khoahoc'], () => { magic.setMana(magic.mana + 34); asking = 0; ctx.toast('✨ +34 năng lượng phép — xây tiếp nào!', 2500); }, '🧊 Hết năng lượng phép — trả lời đúng để nạp +34');
    return true;
  }
  function send(i, list) {
    if (!list.length) return;
    const P = plots[i]; for (const [n, c] of list) c ? P.blocks.set(n, c) : P.blocks.delete(n); refresh(i);
    if (online) ctx.net.emit('build:set', list); else local.save();
  }
  function act(remove) {
    if (mine < 0) return ctx.toast('🧊 Em chưa có lô đất — đi tới một lô <b>còn trống</b> trên Đồng Pha Lê và bấm nhận nhé.', 4500);
    if (needWand()) return;
    const A = aim(); if (!A) return;
    if (remove) {
      const c = A.hit && toCell(A.hit); if (!c) return;
      if (c.p !== mine) return ctx.toast('🙅 Đây là lô của bạn khác — chỉ chủ lô mới phá được.', 2500);
      send(mine, [[c.idx, 0]]); magic.setMana(Math.min(100, magic.mana + COST)); ctx.sfx && ctx.sfx('pop');
    } else {
      const c = toCell(A.place); if (!c) return ctx.toast('🧊 Khối phải nằm trong lô đất, cao tối đa 34 tầng.', 2500);
      if (c.p !== mine) return ctx.toast('🙅 Đây là lô của bạn khác — xây trong lô của em nhé.', 2500);
      if (plots[mine].blocks.size >= MAXB) return ctx.toast(`🧊 Lô đã đủ ${MAXB} khối rồi!`, 2500);
      if (needMana()) return;
      magic.setMana(magic.mana - COST); send(mine, [[c.idx, color]]);
      const [X, Y, Z] = A.place; magic.burst(new THREE.Vector3(X + 0.5, Y + 0.5, Z + 0.5), new THREE.Vector3(0, 1, 0), CRYSTAL[color - 1], 8, 2, 1); ctx.sfx && ctx.sfx('magic');
    }
  }
  function stamp(T, at) {                                   // at = [a, b]: ô trong lô của em (bỏ qua ngắm)
    if (mine < 0 || needWand()) return act(false);
    let c0;
    if (at) { const [x, z] = origin(mine); c0 = { p: mine, idx: idxOf(at[0], at[1], Math.max(0, Math.floor(gyAt(x + at[0] + 0.5, z + at[1] + 0.5) - Y0 + 0.35))) }; }
    else { const A = aim(); if (!A) return ctx.toast('🧊 Nhìn xuống mặt đất trong lô của em để chọn chỗ đặt mẫu.', 3000); c0 = toCell(A.place); } if (!c0 || c0.p !== mine) return ctx.toast('🧊 Chọn chỗ trong lô của em nhé.', 2500);
    const [a0, b0, k0] = cellOf(c0.idx), list = [];
    for (const [x, y, z, c] of T.make()) { const a = a0 + x, b = b0 + z, k = k0 + y; if (a < 0 || a >= W || b < 0 || b >= W || k >= H) return ctx.toast(`📐 Mẫu ${T.name} không vừa chỗ này — lùi vào giữa lô thêm chút.`, 3500); list.push([idxOf(a, b, k), c]); }
    queue = list.filter(([n]) => !plots[mine].blocks.has(n));
    ctx.toast(`${T.name}: cần <b>${queue.length}</b> khối = ${queue.length} năng lượng phép. ${T.fact}`, 7000);
  }

  // ---------- giao diện ----------
  const CSS = `#bdBtn{position:fixed;right:12px;top:calc(env(safe-area-inset-top) + 118px);z-index:26;width:42px;height:42px;border-radius:50%;border:1px solid #fff5;background:#1b1626cc;color:#fff;font-size:20px;line-height:40px;padding:0}#bdBtn.on{background:#2c6455}
#bdUI{position:fixed;left:50%;bottom:calc(max(12px,env(safe-area-inset-bottom)) + 8px);transform:translateX(-50%);z-index:27;display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center;max-width:min(94vw,560px);background:#141022e6;border:1px solid #bfe0ff55;border-radius:16px;padding:8px 10px;font:700 13px system-ui;color:#eaf3ff}
#bdUI i{width:26px;height:26px;border-radius:7px;border:2px solid #fff4;cursor:pointer}#bdUI i.on{border-color:#fff;transform:scale(1.15)}
#bdUI button{border:1px solid #fff4;background:#2a2340;color:#fff;border-radius:10px;padding:7px 10px;font:700 13px system-ui;min-height:36px}#bdUI button.on{background:#7a2a3a}
#bdX{position:fixed;left:50%;top:50%;width:13px;height:13px;margin:-7px 0 0 -7px;border:2px solid #fff;border-radius:50%;z-index:25;pointer-events:none;box-shadow:0 0 4px #000a}`;
  let btn = null, cross = null;
  function setMode(on) {
    mode = on; if (btn) btn.classList.toggle('on', on);
    if (!on) { if (ui) ui.remove(); if (cross) cross.remove(); ui = cross = null; if (built) built.ghost.visible = false; return; }
    cross = document.createElement('div'); cross.id = 'bdX'; document.body.appendChild(cross);
    ui = document.createElement('div'); ui.id = 'bdUI';
    ui.innerHTML = CRYSTAL.map((c, i) => `<i data-c="${i + 1}" title="${NAMES[i]}" style="background:${c}" class="${i + 1 === color ? 'on' : ''}"></i>`).join('') +
      `<button data-a="put">🧊 Đặt</button><button data-a="del">⛏️ Phá</button><button data-a="tpl">📐 Mẫu</button><button data-a="x">✖</button>`;
    ui.onclick = e => {
      const t = e.target; e.stopPropagation();
      if (t.dataset.c) { color = +t.dataset.c; ui.querySelectorAll('i').forEach(x => x.classList.toggle('on', +x.dataset.c === color)); return; }
      const a = t.dataset.a; if (!a) return; ctx.sfx && ctx.sfx('ui');
      if (a === 'put') act(false); else if (a === 'del') act(true); else if (a === 'x') setMode(false);
      else if (a === 'tpl') { const box = document.createElement('div'); box.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;width:100%;justify-content:center'; box.innerHTML = TEMPLATES.map((T, i) => `<button data-t="${i}">${T.name}</button>`).join(''); box.onclick = ev => { const b = ev.target.closest('button'); if (b) { stamp(TEMPLATES[+b.dataset.t]); box.remove(); } ev.stopPropagation(); }; ui.appendChild(box); }
    };
    document.body.appendChild(ui);
    ctx.toast(CFG_TOUCH() ? '🧊 Ngắm vòng tròn giữa màn hình → <b>Đặt</b> / <b>Phá</b>. Mỗi khối 1 năng lượng phép.' : '🧊 Ngắm vòng tròn giữa màn hình: <b>chuột trái</b> đặt khối, <b>chuột phải</b> phá. Phím <b>1–8</b> đổi màu.', 5000);
  }
  const CFG_TOUCH = () => matchMedia('(pointer:coarse)').matches;
  let down = null;
  addEventListener('pointerdown', e => { if (mode && e.target.tagName === 'CANVAS') down = [e.clientX, e.clientY, e.button]; });
  addEventListener('pointerup', e => { if (!mode || !down || e.target.tagName !== 'CANVAS' || CFG_TOUCH()) return; const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]); const b = down[2]; down = null; if (moved < 6) act(b === 2 || e.shiftKey); });
  addEventListener('contextmenu', e => { if (mode && e.target.tagName === 'CANVAS') e.preventDefault(); });
  addEventListener('keydown', e => { if (!mode || /INPUT|TEXTAREA/.test(document.activeElement?.tagName)) return; const n = +e.key; if (n >= 1 && n <= 8) { color = n; if (ui) ui.querySelectorAll('i').forEach(x => x.classList.toggle('on', +x.dataset.c === color)); } if (e.key === 'Escape') setMode(false); });

  function update(dt) {
    if (!built) return;
    const pp = ctx.player.pos, [u, v] = toLocal(pp.x, pp.z), near = u > U0 - 34 && u < U0 + 2 * W + GAP + 34 && v > V0 - 34 && v < V0 + 5 * W + 4 * GAP + 34;
    if (!btn && document.body) { const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); btn = document.createElement('button'); btn.id = 'bdBtn'; btn.title = 'Xây khối pha lê'; btn.textContent = '🧊'; btn.onclick = () => setMode(!mode); document.body.appendChild(btn); }
    if (btn) btn.style.display = near ? '' : 'none';
    if (near && !intro) { intro = true; try { if (!localStorage.getItem('build.seen')) { localStorage.setItem('build.seen', '1'); ctx.toast('🧊 <b>Đồng Pha Lê</b>: nhận 1 lô đất trống, dùng phép tạo <b>khối vuông pha lê</b> (1 năng lượng/khối) để xây nhà cao, tháp, lâu đài. Bạn bè cùng thấy công trình của em!', 9000); } } catch (e) {} }
    if (!near && mode) setMode(false);
    // ẩn lô xa, bảng tên chỉ hiện gần
    for (let i = 0; i < NP; i++) { const [x, z] = origin(i), d = Math.hypot(pp.x - x - W / 2, pp.z - z - W / 2); built.meshes[i].visible = d < 89 + W; built.tags[i].visible = d < 34; }
    const night = ctx.sky && ctx.sky.state ? Math.min(1, ctx.sky.state.night * 1.4) : 0; built.mat.emissive.setRGB(0.04 + night * 0.05, 0.05 + night * 0.07, 0.07 + night * 0.12);   // đêm: khối pha lê ánh sáng lam nhẹ
    // nhận lô: đứng trong 1 lô trống
    const at = plotAt(pp.x, pp.z);
    if (at && mine < 0 && !plots[at[0]].name && !ctx.player.vehicle) ctx.offer(`🧊 Nhận Lô ${at[0] + 1} để xây`, () => { if (online) ctx.net.emit('build:claim', { p: at[0], name: myName() }); else { mine = 0; plots[0].name = myName(); refresh(0); ctx.toast('🧊 Chơi một mình (không có mạng): em xây ở <b>Lô 1</b>, lưu trên máy.', 4000); } }, 7);
    // khung ngắm
    if (mode) {
      const A = aim(), gh = built.ghost; gh.visible = !!A;
      if (A) { const c = A.hit && removingHint() ? A.hit : A.place; gh.position.set(c[0] + 0.5, c[1] + 0.5, c[2] + 0.5); gh.material.color.set(A.hit && removingHint() ? 0xff6070 : 0x7dffb0); }
    }
    // mẫu: đặt dần 8 khối / 0,5 s (16/giây, server cho ≤ 34)
    if (queue.length && (qT += dt) > 0.5) {
      qT = 0; if (needMana()) return;                          // hết năng lượng: tạm dừng, giải đố xong tự xây tiếp
      const n = Math.min(8, queue.length, Math.floor(magic.mana / COST)), part = queue.splice(0, n);
      magic.setMana(magic.mana - n * COST); send(mine, part);
      if (!queue.length) ctx.toast('🏗️ Xong! Đi vòng quanh ngắm công trình của em nào.', 3000);
    }
  }
  const removingHint = () => false;
  return (ctx.build = { build, unbuild, update, get plots() { return plots; }, get mine() { return mine; }, get queue() { return queue.length; }, templates: TEMPLATES, origin, act, stamp, setMode, aim });
}
