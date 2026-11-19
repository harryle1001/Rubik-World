// mg/board/chess.js — CỜ VUA KHỔNG LỒ ở công viên cờ: bàn 8×8, ô φ² ≈ 2,618 m → cạnh bàn ≈ 21 m (Fibonacci).
// Quân cờ toon tự dựng (tiện tròn LatheGeometry + khối, có mắt), cao từ 1,6 m (Tốt) đến 3,2 m (Vua) — gấp đôi = φ²·… dễ nhận.
// Người chơi (quân trắng) đứng trên bàn: đi tới quân, đẩy quân nhảy sang ô mới; ông Tư (quân đen) làm y như vậy.
// Học: chọn quân → hiện cách đi + ô đi được; ký hiệu nước đi (e4, Nf3…), nhãn a–h / 1–8 quanh bàn; 💡 gợi ý; AI dễ/vừa.
// Luật: thư viện chess.js (MIT, /lib/chess.js — đã có sẵn trong dự án).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PHI, to3 } from '../../layout.js';
import { quickQuiz } from '../quick-quiz.js';

const C = PHI * PHI, TOP = 0.3;           // cạnh ô, mặt bàn
const NAME = { p: 'Tốt', n: 'Mã', b: 'Tượng', r: 'Xe', q: 'Hậu', k: 'Vua' };
const TIP = { p: 'Tốt đi thẳng 1 ô (nước đầu được 2 ô), ăn chéo 1 ô. Lên tới hàng cuối → phong Hậu!', n: 'Mã đi hình chữ L: 2 ô thẳng + 1 ô ngang, nhảy qua đầu quân khác.', b: 'Tượng đi chéo bao xa cũng được, luôn ở ô cùng màu.', r: 'Xe đi ngang hoặc dọc bao xa cũng được.', q: 'Hậu mạnh nhất = Xe + Tượng: ngang, dọc, chéo.', k: 'Vua đi 1 ô mọi hướng. Nhập thành: Vua đi 2 ô về phía Xe.' };
const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const H = { p: 1.6, n: 2.2, b: 2.5, r: 2.1, q: 2.9, k: 3.2 };
const sqPos = sq => [(sq.charCodeAt(0) - 97 - 3.5) * C, (3.5 - (+sq[1] - 1)) * C];

// ---------- Hình quân cờ (màu theo đỉnh, dùng chung, không dispose) ----------
const geoCache = new Map();
function paint(g, col) { g = g.index ? g : g; const c = new THREE.Color(col), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) c.toArray(a, i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; }
function pieceGeo(t, side) {
  const key = t + side; if (geoCache.has(key)) return geoCache.get(key);
  const body = side === 'w' ? '#f4ead2' : '#3d3550', acc = side === 'w' ? '#e0b44a' : '#9a7ad6', h = H[t], parts = [];
  const lathe = (pts, col) => parts.push(paint(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y * h)), 12), col));
  const add = (g, col, x, y, z, rx = 0) => { g.rotateX(rx); g.translate(x, y, z); parts.push(paint(g, col)); };
  // chân đế chung (tỷ lệ theo chiều cao)
  lathe([[0.001, 0], [0.62, 0], [0.64, 0.05], [0.5, 0.1], [0.36, 0.16]], acc);
  if (t === 'p') { lathe([[0.36, 0.16], [0.26, 0.3], [0.2, 0.55], [0.32, 0.6], [0.001, 0.62]], body); add(new THREE.SphereGeometry(0.36, 12, 8), body, 0, h * 0.78, 0); }
  if (t === 'r') { lathe([[0.36, 0.16], [0.34, 0.75], [0.46, 0.8], [0.46, 0.95], [0.001, 0.95]], body); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; add(new THREE.BoxGeometry(0.24, 0.22, 0.24), acc, Math.cos(a) * 0.32, h * 0.95 + 0.1, Math.sin(a) * 0.32); } }
  if (t === 'n') { lathe([[0.36, 0.16], [0.3, 0.45], [0.001, 0.47]], body); const nk = new THREE.BoxGeometry(0.46, 0.95, 0.5); nk.rotateX(0.35); nk.translate(0, h * 0.62, 0.05); parts.push(paint(nk, body)); add(new THREE.BoxGeometry(0.4, 0.36, 0.7), body, 0, h * 0.8, -0.32); add(new THREE.BoxGeometry(0.1, 0.22, 0.1), acc, 0.13, h * 0.95, 0.1); add(new THREE.BoxGeometry(0.1, 0.22, 0.1), acc, -0.13, h * 0.95, 0.1); add(new THREE.BoxGeometry(0.12, 0.7, 0.18), acc, 0, h * 0.68, 0.32); }
  if (t === 'b') { lathe([[0.36, 0.16], [0.24, 0.45], [0.3, 0.5], [0.3, 0.55], [0.2, 0.57], [0.3, 0.66], [0.28, 0.82], [0.12, 0.92], [0.001, 0.95]], body); add(new THREE.SphereGeometry(0.1, 8, 6), acc, 0, h * 0.97, 0); add(new THREE.BoxGeometry(0.05, 0.3, 0.42), acc, 0, h * 0.8, 0, 0.6); }
  if (t === 'q') { lathe([[0.36, 0.16], [0.24, 0.5], [0.34, 0.56], [0.22, 0.6], [0.4, 0.86], [0.001, 0.86]], body); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; add(new THREE.SphereGeometry(0.09, 6, 4), acc, Math.cos(a) * 0.36, h * 0.88, Math.sin(a) * 0.36); } add(new THREE.SphereGeometry(0.13, 8, 6), acc, 0, h * 0.92, 0); }
  if (t === 'k') { lathe([[0.36, 0.16], [0.26, 0.5], [0.36, 0.56], [0.24, 0.6], [0.38, 0.84], [0.001, 0.84]], body); add(new THREE.BoxGeometry(0.12, 0.42, 0.12), acc, 0, h * 0.84 + 0.2, 0); add(new THREE.BoxGeometry(0.34, 0.12, 0.12), acc, 0, h * 0.84 + 0.26, 0); }
  // mắt toon (nhìn về phía đối thủ: −z cục bộ)
  const ey = t === 'n' ? h * 0.83 : t === 'p' ? h * 0.8 : h * (t === 'r' ? 0.72 : 0.68), ez = t === 'n' ? -0.62 : t === 'p' ? -0.3 : t === 'r' ? -0.36 : -0.27, ex = t === 'n' ? 0.13 : 0.12;
  for (const s of [-1, 1]) { add(new THREE.SphereGeometry(0.085, 8, 6), '#ffffff', s * ex, ey, ez); add(new THREE.SphereGeometry(0.05, 6, 4), '#1d1b22', s * ex, ey, ez - 0.05); }
  const g = mergeGeometries(parts.map(p => p.index ? p.toNonIndexed() : p)); g.computeVertexNormals(); g.userData.shared = true; geoCache.set(key, g); return g;
}

async function getChess(ctx) {
  if (window.Chess) return window.Chess;
  await new Promise((res, rej) => { const s = document.createElement('script'); s.src = '/lib/chess.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  return window.Chess;
}

// ---------- AI: tìm kiếm alpha-beta nông + bảng vị trí đơn giản (khuyến khích ra quân, chiếm trung tâm) ----------
const PV = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
function evalBoard(g) {
  let s = 0; const B = g.board();
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const p = B[i][j]; if (!p) continue; const cen = 3.5 - Math.max(Math.abs(i - 3.5), Math.abs(j - 3.5)), adv = p.color === 'w' ? 7 - i : i;
    let v = PV[p.type] + (p.type === 'n' || p.type === 'b' ? cen * 8 : p.type === 'p' ? adv * 6 + cen * 3 : p.type === 'k' ? -cen * 6 : cen * 2); s += p.color === 'w' ? v : -v; }
  return s;
}
function search(g, d, a, b, max, q) {
  if (d === 0 || g.game_over()) { if (g.in_checkmate()) return max ? -99999 - d : 99999 + d; if (g.game_over()) return 0; return q ? quiet(g, a, b, max, 2) : evalBoard(g); }
  const ms = g.moves(); ms.sort((x, y) => (y.includes('x') ? 1 : 0) - (x.includes('x') ? 1 : 0));
  for (const m of ms) { g.move(m); const v = search(g, d - 1, a, b, !max, q); g.undo(); if (max) { if (v > a) a = v; } else if (v < b) b = v; if (a >= b) break; }
  return max ? a : b;
}
// mức khó: ở lá chỉ xét tiếp nước ĂN QUÂN (tối đa 2 lớp) → không "treo" quân vô cớ
function quiet(g, a, b, max, n) {
  const sp = evalBoard(g); if (!n) return sp;
  if (max) { if (sp >= b) return sp; if (sp > a) a = sp; } else { if (sp <= a) return sp; if (sp < b) b = sp; }
  for (const m of g.moves()) { if (!m.includes('x')) continue; g.move(m); const v = quiet(g, a, b, !max, n - 1); g.undo(); if (max) { if (v > a) a = v; } else if (v < b) b = v; if (a >= b) break; }
  return max ? a : b;
}
// Tìm nước tốt nhất, mỗi nước gốc 1 lượt (nhường khung hình giữa các lượt): trước đây tính liền 0,5–2 s → khựng hình trên điện thoại
async function bestMove(g, depth, noise, q = false) {
  const max = g.turn() === 'w'; let best = null, bv = max ? -1e9 : 1e9;
  for (const m of g.moves({ verbose: true })) { g.move(m); const v = search(g, depth - 1, -1e9, 1e9, !max, q) + (Math.random() - 0.5) * noise; g.undo(); if (max ? v > bv : v < bv) { bv = v; best = m; } if (depth > 1) await new Promise(r => setTimeout(r, 0)); }
  return best;
}
const LV = { easy: [1, 260], medium: [2, 40], hard: [2, 0, true] };   // độ sâu, nhiễu (cho trẻ: Dễ hay sơ hở), quiescence

export function chessSpot(ctx) {   // khu chơi cạnh công viên cờ khổng lồ (bắc trường)
  const [px, pz] = to3(340, -280), [x, z] = ctx.mg.findSpot(px, pz, 15);
  return [x, z, Math.atan2(x - px, z - pz)];
}

export function startChess(ctx, { api }) {
  const { root, hud, me } = api, M = api.mat;
  let level = (() => { try { return localStorage.getItem('mg.chess.level') || 'easy'; } catch (e) { return 'easy'; } })();
  // ---------- Bàn cờ ----------
  const frame = new THREE.Mesh(new THREE.BoxGeometry(8 * C + 1.6, 0.26, 8 * C + 1.6), M('#7a5230')); frame.position.y = 0.13; frame.receiveShadow = true; root.add(frame);
  const tile = new THREE.BoxGeometry(C, 0.1, C), light = new THREE.InstancedMesh(tile, M('#f1e4c6'), 32), dark = new THREE.InstancedMesh(tile, M('#5f8f5a'), 32);
  { const o = new THREE.Object3D(); let a = 0, b = 0; for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) { const [x, z] = sqPos(String.fromCharCode(97 + f) + (r + 1)); o.position.set(x, TOP - 0.05, z); o.updateMatrix(); ((f + r) % 2 ? light : dark).setMatrixAt((f + r) % 2 ? a++ : b++, o.matrix); } }
  light.receiveShadow = dark.receiveShadow = true; root.add(light, dark);
  { // nhãn a–h, 1–8 trên viền gỗ
    const cv = document.createElement('canvas'); cv.width = cv.height = 1024; const k = cv.getContext('2d'), u = 1024 / (8 * C + 1.6);
    k.fillStyle = '#ffe9b8'; k.font = 'bold 34px system-ui'; k.textAlign = 'center'; k.textBaseline = 'middle';
    for (let i = 0; i < 8; i++) { const p = 512 + (i - 3.5) * C * u; k.fillText(String.fromCharCode(97 + i), p, 1024 - 0.4 * u); k.fillText(String.fromCharCode(97 + i), p, 0.4 * u); k.fillText(8 - i, 0.4 * u, p); k.fillText(8 - i, 1024 - 0.4 * u, p); }
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(8 * C + 1.6, 8 * C + 1.6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false })); lab.position.y = 0.265; root.add(lab);
  }
  // đánh dấu: ô đang chọn, nước vừa đi, ô đi được (InstancedMesh có màu)
  const marks = new THREE.InstancedMesh(new THREE.CircleGeometry(C * 0.3, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, depthWrite: false }), 40); marks.count = 0; root.add(marks);
  const _o = new THREE.Object3D(), _c = new THREE.Color();
  function setMarks(list) { marks.count = list.length; list.forEach(([sq, col, s = 1], i) => { const [x, z] = sqPos(sq); _o.position.set(x, TOP + 0.02, z); _o.scale.setScalar(s); _o.updateMatrix(); marks.setMatrixAt(i, _o.matrix); marks.setColorAt(i, _c.set(col)); }); marks.instanceMatrix.needsUpdate = true; if (marks.instanceColor) marks.instanceColor.needsUpdate = true; }
  // ---------- Quân cờ ----------
  // tất cả quân trong 1 BatchedMesh (1 lần vẽ, trước: 32 mesh + 32 bóng); mỗi quân là 1 Object3D "bóng ma" để tween, đồng bộ ma trận mỗi khung
  const pmat = M('#ffffff', { vertexColors: true }), pieces = new Map(), dead = { w: 0, b: 0 }, tweens = [], ghosts = new Set();
  const gid = {}; let nv = 0; for (const t of 'pnbrqk') for (const sd of 'wb') nv += pieceGeo(t, sd).attributes.position.count;
  const batch = new THREE.BatchedMesh(48, nv, 0, pmat); batch.castShadow = true; batch.frustumCulled = false; root.add(batch);
  for (const t of 'pnbrqk') for (const sd of 'wb') gid[t + sd] = batch.addGeometry(pieceGeo(t, sd));
  function makePiece(t, side, sq) { const m = new THREE.Object3D(); m.userData = { t, side, id: batch.addInstance(gid[t + side]) }; const [x, z] = sqPos(sq); m.position.set(x, TOP, z); m.rotation.y = side === 'w' ? 0 : Math.PI; ghosts.add(m); pieces.set(sq, m); return m; }
  const dropPiece = m => { if (ghosts.delete(m)) batch.deleteInstance(m.userData.id); };
  const tween = (dur, fn) => new Promise(res => tweens.push({ t: 0, dur, fn, res }));
  const wait = s => tween(s, () => {});
  async function hop(m, to, high) {
    const [x0, z0] = [m.position.x, m.position.z], [x1, z1] = sqPos(to), d = Math.hypot(x1 - x0, z1 - z0) / C, hh = high ? 3 : 0.6 + d * 0.25;
    await tween(0.35 + d * 0.07, k => { const e = k < 0.5 ? 2 * k * k : 1 - (2 - 2 * k) ** 2 / 2; m.position.set(x0 + (x1 - x0) * e, TOP + Math.sin(Math.PI * k) * hh, z0 + (z1 - z0) * e); m.scale.set(1, 1 + Math.sin(Math.PI * k) * 0.12, 1); });
    api.sfx('land'); await tween(0.18, k => { const s = Math.sin(Math.PI * k) * 0.18; m.scale.set(1 + s, 1 - s, 1 + s); }); m.scale.set(1, 1, 1);
  }
  async function knockOut(m) {   // quân bị ăn: bay vòng ra hàng bên ngoài bàn
    const side = m.userData.side, n = dead[side]++, x1 = (side === 'w' ? 1 : -1) * (4 * C + 2.1), z1 = (n % 8 - 3.5) * C * 0.75 * (side === 'w' ? -1 : 1), y1 = n >= 8 ? 0 : 0;
    const x0 = m.position.x, z0 = m.position.z; api.sfx('jump');
    await tween(0.7, k => { m.position.set(x0 + (x1 - x0) * k, TOP + Math.sin(Math.PI * k) * 5 + (y1 - TOP) * k, z0 + (z1 - z0) * k); m.rotation.z = k * Math.PI * 2; m.scale.setScalar(1 - 0.38 * k); });
    m.rotation.z = 0;
  }
  // ---------- Luật + lượt ----------
  let secShown = -1, G = null, sel = null, busy = true, last = null, score = 0, t0 = 0, over = false, hint = null;
  const actors = { w: me, b: null }, fans = [];
  const standAt = (sq, side) => { const [x, z] = sqPos(sq); return [x + 0.55 * C * (side === 'w' ? 1 : -1), z + 0.5 * C * (side === 'w' ? 1 : -1)]; };
  async function play(mv) {
    busy = true; sel = null; setMarks(last ? [[last.from, '#ffd36e', 1.6], [last.to, '#ffd36e', 1.6]] : []);
    const side = mv.color, A = actors[side], m = pieces.get(mv.from);
    if (A) { const [x, z] = standAt(mv.from, side); await A.walkTo(x, z); A.face(...sqPos(mv.from)); A.emote('interact'); await wait(0.45); }
    const cap = mv.flags.includes('e') ? mv.to[0] + mv.from[1] : mv.captured ? mv.to : null;
    if (cap && pieces.get(cap)) { const v = pieces.get(cap); pieces.delete(cap); knockOut(v); if (side === 'w') { score += VAL[mv.captured]; hud.score(score); fans.forEach(f => f.emote('cheer')); fans[0] && fans[0].say(['Hay quá!', 'Ăn quân rồi!', 'Tuyệt!'][(Math.random() * 3) | 0]); } else me.emote('no'); }
    pieces.delete(mv.from); pieces.set(mv.to, m); await hop(m, mv.to, mv.piece === 'n');
    if (mv.flags.includes('k') || mv.flags.includes('q')) { const rk = mv.flags.includes('k'), rf = (rk ? 'h' : 'a') + mv.from[1], rt = (rk ? 'f' : 'd') + mv.from[1], rm = pieces.get(rf); pieces.delete(rf); pieces.set(rt, rm); await hop(rm, rt, false); }
    if (mv.promotion) { dropPiece(m); const q = makePiece(mv.promotion, side, mv.to); q.scale.setScalar(0.01); await tween(0.4, k => q.scale.setScalar(Math.max(0.01, k * 1.15 - Math.sin(Math.PI * k) * 0.05))); q.scale.setScalar(1); hud.msg('👑 Tốt phong Hậu!', 2200); }
    if (A) { const [x, z] = standAt(mv.to, side); A.walkTo(x, z); }
    last = mv; setMarks([[mv.from, '#ffd36e', 1.6], [mv.to, '#ffd36e', 1.6]]);
    const san = mv.san;
    if (G.in_checkmate()) return finish(side === 'w');
    if (G.game_over()) return finish(null);
    if (G.in_check()) { (actors[side] || me).say('Chiếu!'); hud.msg(`${side === 'w' ? 'Bạn' : 'Ông Tư'} đi ${san} — <b>Chiếu tướng!</b> ${side === 'w' ? '' : 'Hãy cứu Vua: chạy, chặn hoặc ăn quân đang chiếu.'}`, 3500); }
    else hud.msg(`${side === 'w' ? 'Bạn' : 'Ông Tư'}: ${NAME[mv.piece]} ${mv.from} → ${mv.to} <small>(${san})</small>`, 2500);
    if (side === 'w') setTimeout(aiTurn, 300); else busy = false;
  }
  function aiTurn() {
    if (over || !G) return;
    if (actors.b) actors.b.say(['Để ông nghĩ…', 'Hừm…', 'À ha!'][(Math.random() * 3) | 0], 1500);
    setTimeout(async () => { if (over || !G) return; const L = LV[level] || LV.easy, mv = await bestMove(G, L[0], L[1], L[2]); if (!mv || over || !G) return; G.move(mv); play(mv); }, 600);
  }
  function finish(win) {
    over = true; busy = true; const t = Math.round(performance.now() / 1000 - t0);
    if (win) { me.emote('cheer'); fans.forEach(f => f.emote('cheer')); actors.b && actors.b.emote('no'); actors.b && actors.b.say('Cháu giỏi lắm!'); }
    else if (win === false) { actors.b && actors.b.emote('cheer'); me.emote('no'); }
    setTimeout(() => api.end(win ? { score: 100 + score * 5 + Math.max(0, 300 - t) / 10 | 0, title: '♚ Chiếu hết! Bạn thắng!', text: `Bạn ăn ${score} điểm quân trong ${Math.floor(t / 60)} phút ${t % 60} giây. Cờ vua rèn tư duy logic: luôn nghĩ trước 1–2 nước!` }
      : win === false ? { score: null, save: false, title: 'Ông Tư thắng ván này', text: 'Không sao! Mẹo: ra Mã, Tượng sớm, nhập thành để giữ Vua an toàn, và kiểm tra quân nào đang bị đe doạ trước khi đi.' }
        : { score: 50 + score, title: '🤝 Hoà cờ', text: 'Hết nước đi hợp lệ hoặc không đủ quân chiếu hết. Hoà cũng là một kết quả đẹp!' }), 1600);
  }
  // ---------- Chạm ô ----------
  const plane = new THREE.Plane(), _p = new THREE.Vector3();
  function squareAt(e) {
    plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), root.localToWorld(new THREE.Vector3(0, TOP, 0)));
    if (!api.ray(e).ray.intersectPlane(plane, _p)) return null; root.worldToLocal(_p);
    const f = Math.floor(_p.x / C + 4), r = Math.floor(4 - _p.z / C); return f >= 0 && f < 8 && r >= 0 && r < 8 ? String.fromCharCode(97 + f) + (r + 1) : null;
  }
  function tap(e) {
    if (busy || over || !G || G.turn() !== 'w') return; const sq = squareAt(e); if (!sq) return;
    const p = G.get(sq);
    if (sel) { const mv = G.moves({ square: sel, verbose: true }).find(m => m.to === sq); if (mv) { if (mv.promotion) mv.promotion = 'q'; G.move({ from: mv.from, to: mv.to, promotion: 'q' }); hint = null; play(G.history({ verbose: true }).slice(-1)[0]); return; } }
    if (p && p.color === 'w') {
      sel = sq; const ms = G.moves({ square: sq, verbose: true }); api.sfx('ui');
      setMarks([[sq, '#4fc3ff', 1.7], ...ms.map(m => [m.to, m.captured ? '#ff5a4a' : '#7ee07a', m.captured ? 1.5 : 1])]);
      hud.msg(`<b>${NAME[p.type]}</b> ${sq}: ${TIP[p.type]}${ms.length ? '' : '<br>(Quân này đang bị chặn, chưa đi được)'}`, 0);
    } else if (p) hud.msg(`Đó là ${NAME[p.type]} đen của ông Tư. Chọn quân <b>trắng</b> của bạn trước nhé.`, 2500);
    else { sel = null; setMarks(last ? [[last.from, '#ffd36e', 1.6], [last.to, '#ffd36e', 1.6]] : []); }
  }
  // ---------- HUD ----------
  const lvBtns = [['easy', '🙂 Dễ'], ['medium', '🤔 Vừa'], ['hard', '🔥 Khó']].map(([lv, t]) => { const b = hud.button(t, () => { if (level === lv) return; level = lv; try { localStorage.setItem('mg.chess.level', lv); } catch (e) {} api.restart(); }); b.classList.toggle('on', level === lv); return b; });
  hud.button('💡 Gợi ý', async () => { if (busy || over || !G) return; busy = true; const ok = await quickQuiz(api, ['toan'], '💡 Trả lời đúng để mở gợi ý'); if (!ok || over || !G) { busy = false; return; } const mv = await bestMove(G, 2, 0); busy = false; if (!mv) return; hint = mv; sel = null; setMarks([[mv.from, '#4fc3ff', 1.7], [mv.to, '#b48cff', 1.7]]); hud.msg(`💡 Thử: <b>${NAME[mv.piece]} ${mv.from} → ${mv.to}</b> (${mv.san})`, 3500); });
  hud.button('↩ Đi lại', () => {
    if (busy || over || !G || G.history().length < 2) return; G.undo(); G.undo(); sel = null; last = null; setMarks([]);
    for (const m of [...ghosts]) dropPiece(m); pieces.clear(); dead.w = dead.b = 0; build(); hud.msg('Đã đi lại 1 nước.', 1500);
  });
  function build() { const B = G.board(); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const p = B[i][j]; if (p) makePiece(p.type, p.color, String.fromCharCode(97 + j) + (8 - i)); } }
  // ---------- Nhân vật ----------
  me.place(...standAt('e2', 'w'), Math.PI); me.face(0, 0);
  api.actor('student-male-c', { name: 'Ông Tư', height: 1.62, look: { role: 'adult', shirt: '#c9a46a', pants: '#4a3a2a', glasses: true } }).then(a => { if (!a) return; actors.b = a; a.place(...standAt('e7', 'b'), 0); a.face(0, 0); a.say('Chào cháu! Đấu một ván nhé?', 3000); });
  [['student-female-b', -4.6, 1], ['student-male-a', -4.6, -1], ['student-female-d', 4.6, 0]].forEach(([k, s, o], i) => api.actor(k, {}).then(a => { if (!a) return; fans.push(a); a.place(s * C + Math.sign(s) * 1.4, o * C * 1.6, 0); a.face(0, o * C * 1.6); if (i === 0) a.say('Cố lên!'); }));
  const port = innerWidth < innerHeight;   // điện thoại dọc: lùi xa để thấy trọn bàn 21 m
  api.cam.x = 0; api.cam.y = 0; api.cam.z = port ? -1 : 2; api.cam.yaw = 0; api.cam.pitch = port ? 1.2 : 0.95; api.cam.dist = port ? 42 : 34; api.orbit = true;
  hud.msg('Đang bày quân…', 0);
  getChess(ctx).then(Chess => {
    if (!Chess) { hud.msg('Không tải được luật cờ (chess.js).', 0); return; }
    G = new Chess(); build(); busy = false; t0 = performance.now() / 1000;
    hud.score(0); hud.msg(`Bạn cầm quân <b>trắng</b>, đi trước. Chạm một quân để xem cách đi. (${{ easy: 'Mức dễ', medium: 'Mức vừa', hard: 'Mức khó' }[level]})`, 4500);
  }).catch(() => hud.msg('Không tải được luật cờ (chess.js).', 0));
  return {
    tap,
    update(dt) {
      for (let i = tweens.length - 1; i >= 0; i--) { const w = tweens[i]; w.t += dt; const k = Math.min(1, w.t / w.dur); w.fn(k); if (k >= 1) { tweens.splice(i, 1); w.res(); } }
      if (G && !over && t0) { const s = performance.now() / 1000 - t0 | 0; if (s !== secShown) hud.time(secShown = s); }
      if (sel && pieces.get(sel)) { const m = pieces.get(sel); m.position.y = TOP + Math.abs(Math.sin(performance.now() / 180)) * 0.35; }
      for (const [sq, m] of pieces) if (sq !== sel && !tweens.length) m.position.y = TOP;
      for (const m of ghosts) { m.updateMatrix(); batch.setMatrixAt(m.userData.id, m.matrix); }
    },
    dispose() { tweens.length = 0; over = true; G = null; },
  };
}
