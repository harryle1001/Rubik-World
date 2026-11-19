// academy/creatures.js — SINH VẬT KỲ ẢO NGUYÊN BẢN (cảm hứng thần thoại Việt + tự nhiên), low-poly, ≈ 10 draw call tổng:
//  🐉 Rồng Mây Lành — rồng Việt (thời Lý) không cánh, thân 34 đốt uốn hình sin, ngậm ngọc, lượn xoắn quanh tháp thiên văn 89 m (2 call).
//  🕊️ Chim Lạc       — 13 con (trống đồng Đông Sơn) bay đội hình chữ V quanh mái, mỗi 89 s đáp xuống sân Đại Sảnh kiếm ăn (2 call).
//  🐢 Cụ Rùa Vàng    — rùa khổng lồ bơi chậm vòng hồ dưới chân vách, cứ 34 s ngoi lên thở (2 call).
//  🦁 Lân            — lân mẹ + lân con gặm cỏ ở Sân Thảo Mộc, đi lại tránh tường (ctx.boxes) (3 call).
//  🦋 Bướm pha lê    — 21 con chập chờn quanh vườn thảo mộc, đêm cánh sáng rực (1 call; khác đom đóm Points ở atmos.js).
// Lại gần ≤ 8 m: toast giới thiệu + 1 sự thật sinh học/văn hoá thật; nút ❓ câu đố, đúng +13 năng lượng (magic.setMana).
// Hiệu năng: InstancedMesh + xoay khớp bằng ma trận (không skinning); chỉ cập nhật con trong tầm 144 m (rồng, chim: 144–296 m cập nhật thưa).
// Toạ độ: nhóm đặt tại tâm đảo, x cục bộ = v, z cục bộ = u (giống atmos.js).
import * as THREE from 'three';
import { Batch } from './geo.js';
import { matV } from '../sample/palette.js';
import { toon } from '../style.js';
import { PLAT } from './plan.js';

const PI = Math.PI, GOLDEN = PI * (3 - Math.sqrt(5));   // góc vàng ≈ 137,5°
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const Q = (q, choices, a, explain) => ({ q, choices, a, explain });
const NEAR = 8, NEAR2 = 13, LOD = 144, LOD2 = 296, GAIN = 13;

// ---------- nội dung học ----------
const INFO = {
  dragon: { short: 'Rồng Mây Lành', intro: '🐉 <b>Rồng Mây Lành</b> uốn mình quanh tháp thiên văn. Rồng Việt <b>không có cánh</b>, thân uốn khúc như sóng nước, mang mây mưa cho đồng lúa.',
    fact: '📜 Rồng thời Lý (thế kỷ 11–13) có thân uốn hình sin, miệng ngậm ngọc. Người Việt tự hào là <b>con Rồng cháu Tiên</b>.',
    qs: [Q('Truyện "Con Rồng cháu Tiên": mẹ Âu Cơ sinh ra bọc trứng nở ra bao nhiêu người con?', ['100', '50', '12', '1000'], 0, 'Bọc <b>trăm trứng</b> nở 100 người con: 50 theo cha xuống biển, 50 theo mẹ lên núi.'),
      Q('Rồng trong văn hoá Việt gắn với hiện tượng tự nhiên nào?', ['Mây và mưa', 'Động đất', 'Tuyết rơi', 'Bão cát'], 0, 'Cư dân trồng lúa nước mong <b>mưa thuận gió hoà</b>, nên rồng là biểu tượng của mây mưa.')] },
  birds: { short: 'Chim Lạc', intro: '🕊️ Đàn <b>chim Lạc</b> mỏ dài, đuôi dài — loài chim được khắc trên mặt <b>trống đồng Đông Sơn</b> hơn 2.000 năm trước.',
    fact: '🔬 Chim di cư bay đội hình <b>chữ V</b>: con sau đón luồng khí nâng từ đầu cánh con trước nên đỡ mệt. Chúng tìm đường nhờ Mặt Trời, các vì sao và từ trường Trái Đất.',
    qs: [Q('Vì sao đàn chim di cư hay bay theo hình chữ V?', ['Tiết kiệm sức nhờ luồng khí nâng', 'Để vẽ chữ lên trời', 'Vì con đầu đàn bị lạc', 'Để tránh mưa'], 0, 'Đầu cánh mỗi con tạo luồng khí xoáy đi lên — con bay sau "cưỡi" lên đó nên <b>đỡ tốn sức</b>.'),
      Q('Hình chim Lạc được khắc trên cổ vật nổi tiếng nào?', ['Trống đồng Đông Sơn', 'Tháp Rùa', 'Chùa Một Cột', 'Cột cờ Hà Nội'], 0, 'Chim Lạc bay quanh ngôi sao giữa mặt <b>trống đồng Đông Sơn</b> — báu vật của người Việt cổ.')] },
  turtle: { short: 'Cụ Rùa Vàng', intro: '🐢 <b>Cụ Rùa Vàng</b> bơi chậm quanh hồ dưới chân vách, thỉnh thoảng ngoi lên mặt nước.',
    fact: '🔬 Rùa thở bằng <b>phổi</b> nên phải ngoi lên lấy khí. Nhiều loài rùa sống <b>hơn 100 năm</b> — cụ rùa Hồ Gươm từng sống hơn một thế kỷ.',
    qs: [Q('Vì sao rùa phải ngoi lên mặt nước?', ['Để thở bằng phổi', 'Để uống nước mưa', 'Để ngủ', 'Để đẻ trứng trên mặt nước'], 0, 'Rùa là <b>bò sát</b>, thở bằng phổi chứ không có mang như cá.'),
      Q('Truyền thuyết Hồ Gươm: Rùa Vàng nhận lại vật gì từ vua Lê Lợi?', ['Thanh gươm thần', 'Chiếc nỏ thần', 'Viên ngọc quý', 'Chiếc ấn vàng'], 0, 'Thắng giặc Minh xong, vua Lê Lợi <b>trả gươm</b> cho Rùa Vàng — hồ mang tên Hồ Hoàn Kiếm.')] },
  lan: { short: 'Lân', intro: '🦁 <b>Lân</b> hiền lành gặm cỏ ở Sân Thảo Mộc — một sừng, bờm đỏ xanh như lân múa đêm Trung thu.',
    fact: '📜 <b>Tứ linh</b> của người Việt: Long (rồng), Lân, Quy (rùa), Phụng (phượng). 🔬 Thú ăn cỏ như trâu, bò có dạ dày <b>4 ngăn</b> để nhai lại.',
    qs: [Q('"Tứ linh" trong văn hoá Việt gồm những con nào?', ['Long, Lân, Quy, Phụng', 'Hổ, Báo, Sư tử, Gấu', 'Gà, Vịt, Ngan, Ngỗng', 'Chuột, Trâu, Hổ, Mèo'], 0, '<b>Long – Lân – Quy – Phụng</b>: bốn con vật linh thiêng, hay gặp trên mái đình, chùa.'),
      Q('Dạ dày của trâu, bò có mấy ngăn?', ['4 ngăn', '1 ngăn', '2 ngăn', '10 ngăn'], 0, 'Trâu bò có dạ dày <b>4 ngăn</b>: nuốt cỏ vào dạ cỏ rồi ợ lên nhai lại cho nhuyễn.')] },
  bfly: { short: 'Bướm pha lê', intro: '🦋 <b>Bướm pha lê</b> chập chờn quanh vườn thảo mộc — đêm xuống, cánh bướm phát sáng.',
    fact: '🔬 Bướm nếm vị bằng <b>chân</b> và hút mật bằng vòi cuộn như lò xo. Khi bay từ hoa này sang hoa khác, bướm giúp hoa <b>thụ phấn</b>.',
    qs: [Q('Vòng đời của bướm: Trứng → ? → Nhộng → Bướm', ['Sâu', 'Nòng nọc', 'Trứng nữa', 'Chim non'], 0, 'Bướm <b>biến thái hoàn toàn</b>: trứng → sâu → nhộng (kén) → bướm.'),
      Q('Bướm nếm vị thức ăn bằng bộ phận nào?', ['Chân', 'Cánh', 'Râu', 'Đuôi'], 0, 'Chân bướm có các "nụ vị giác": đậu lên lá là biết lá đó có hợp để <b>đẻ trứng</b> không.')] },
};

// ---------- hình khối (hướng tới +z, đáy y = 0 nếu đứng đất) ----------
const tris = pts => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3)); g.computeVertexNormals(); return g; };
export function dragonSeg() {   // 1 đốt thân: trụ 6 cạnh nằm dọc z + bụng vàng nhạt + vây lưng
  const b = new Batch();
  b.add(new THREE.CylinderGeometry(1, 1, 1.9, 6), '#2f8f6a', 0, 0, 0, 0, PI / 2);
  b.box(-0.62, 0.62, -1.02, -0.62, -0.95, 0.95, '#efe0a8');
  b.add(new THREE.ConeGeometry(0.36, 1.0, 4), '#f2c443', 0, 1.2, -0.2, 0, -0.55);
  return b.build();
}
export function dragonHead() {
  const b = new Batch(), J = '#2f8f6a', G = '#f2c443';
  b.box(-0.9, 0.9, -0.6, 0.8, -1.0, 1.0, J);                                 // sọ
  b.box(-0.66, 0.66, -0.55, 0.25, 0.9, 2.5, J);                              // mõm
  b.box(-0.7, 0.7, 0.25, 0.5, 1.0, 2.6, G);                                  // môi trên cong vàng
  b.box(-0.55, 0.55, -0.95, -0.7, 0.6, 2.2, '#c0392b');                      // hàm dưới (miệng đỏ)
  b.add(new THREE.OctahedronGeometry(0.5, 0), '#fff6d0', 0, -0.45, 2.75);   // ngọc ngậm
  for (const s of [-1, 1]) {
    b.add(new THREE.ConeGeometry(0.18, 2.0, 5), '#e8d7a0', s * 0.5, 1.3, -0.9, s * 0.2, -1.0);   // sừng ngả sau
    b.box(s * 0.92 - 0.12, s * 0.92 + 0.12, 0.2, 0.55, 0.45, 0.85, '#fdfaf0');                   // mắt
    b.box(s * 0.96 - 0.08, s * 0.96 + 0.08, 0.28, 0.48, 0.55, 0.75, '#1b1626');
    b.add(new THREE.CylinderGeometry(0.05, 0.03, 3.4, 4), G, s * 1.6, -0.35, 1.1, 0, PI / 2 + 0.25, s * 0.5);   // râu dài
    b.add(new THREE.ConeGeometry(0.3, 1.3, 4), '#d9542e', s * 0.75, 0.3, -1.3, 0, -1.2, -s * 0.5);              // bờm lửa hai bên
  }
  b.add(new THREE.ConeGeometry(0.4, 1.6, 4), '#d9542e', 0, 0.75, -1.5, 0, -1.2);
  return b.build();
}
function birdBody() {   // chim Lạc: mình thon, cổ dài, mỏ dài, mào, đuôi 3 dải dài
  const b = new Batch(), W = '#efe6d2', B = '#b8863b';
  b.add(new THREE.OctahedronGeometry(0.5, 0), W, 0, 0, 0, 0, 0, 0, 0.75, 0.7, 1.7);
  b.add(new THREE.CylinderGeometry(0.08, 0.13, 1.0, 5), W, 0, 0.42, 0.95, 0, 0.75);
  b.add(new THREE.OctahedronGeometry(0.22, 0), W, 0, 0.8, 1.35, 0, 0, 0, 1, 1, 1.3);
  b.add(new THREE.ConeGeometry(0.07, 1.2, 4), B, 0, 0.76, 2.05, 0, PI / 2);
  b.add(new THREE.ConeGeometry(0.07, 0.6, 4), '#c0392b', 0, 1.02, 1.1, 0, -1.0);
  for (const r of [-0.2, 0, 0.2]) b.box(-0.04, 0.04, -0.015, 0.015, -2.6, -0.6, B), b.list[b.list.length - 1].rotateX(-0.3).rotateY(r);   // đuôi vểnh nhẹ
  for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.035, 0.035, 1.25, 4), '#8a6a3a', s * 0.15, -0.88, -0.38, 0, 0.3);   // chân ngả sau
  return b.build();
}
function birdWing() {   // cánh: gốc trắng, đầu cánh đồng thau
  const b = new Batch();
  b.add(tris([[0, 0, 0.45], [1.3, 0, 0.35], [0, 0, -0.5], [1.3, 0, 0.35], [1.3, 0, -0.55], [0, 0, -0.5]]), '#f3ead8');
  b.add(tris([[1.3, 0, 0.35], [2.5, 0, -0.1], [1.3, 0, -0.55]]), '#b8863b');
  return b.build();
}
function turtleBody() {
  const b = new Batch(), G = '#d9a83c';
  b.add(new THREE.SphereGeometry(1, 10, 5, 0, PI * 2, 0, PI / 2), G, 0, 0, 0, 0, 0, 0, 2.1, 1.15, 2.6);   // mai
  b.add(new THREE.CylinderGeometry(1, 1, 0.32, 10), '#e8d08a', 0, -0.12, 0, 0, 0, 0, 2.15, 1, 2.65);      // yếm + viền mai
  for (const [x, z] of [[0, 0], [0, 1.1], [0, -1.1], [0.95, 0.5], [-0.95, 0.5], [0.95, -0.6], [-0.95, -0.6]]) b.add(new THREE.CylinderGeometry(0.42, 0.5, 0.2, 6), '#a87a24', x, 1.08 - (x * x * 0.11 + z * z * 0.07), z);   // vảy mai
  b.add(new THREE.CylinderGeometry(0.32, 0.4, 0.9, 6), '#9c8a4a', 0, 0.12, 2.75, 0, PI / 2 - 0.25);         // cổ
  b.add(new THREE.SphereGeometry(0.55, 7, 5), '#a89552', 0, 0.38, 3.35, 0, 0, 0, 0.95, 0.8, 1.25);         // đầu
  for (const s of [-1, 1]) b.box(s * 0.46 - 0.07, s * 0.46 + 0.07, 0.42, 0.6, 3.55, 3.72, '#1b1626');
  b.add(new THREE.ConeGeometry(0.22, 0.8, 5), '#9c8a4a', 0, 0, -2.75, 0, -PI / 2);
  return b.build();
}
const flipperGeo = () => { const b = new Batch(); b.add(new THREE.BoxGeometry(1.7, 0.16, 0.75), '#9c8a4a', 0.85, 0, 0); return b.build(); };
function lanBody() {
  const b = new Batch(), G = '#e0b24a';
  b.box(-0.5, 0.5, 0.95, 1.75, -1.0, 1.0, G);                                 // mình
  b.box(-0.42, 0.42, 0.85, 1.0, -0.9, 0.9, '#f3e6c0');                        // bụng
  for (let k = 0; k < 5; k++) b.add(new THREE.ConeGeometry(0.16, 0.36, 4), '#3f9f6a', 0, 1.9, 0.8 - k * 0.4);   // vảy gai lưng xanh
  for (const s of [-1, 0, 1]) b.add(new THREE.ConeGeometry(0.2, 0.9, 5), s ? '#d9542e' : '#f2c443', s * 0.16, 1.85, -1.3, 0, -1.0, -s * 0.35);   // đuôi bờm
  return b.build();
}
function lanHead() {   // gốc ở cổ; đầu to, mõm đỏ, 1 sừng, bờm đỏ–xanh, râu cằm trắng
  const b = new Batch();
  b.add(new THREE.CylinderGeometry(0.28, 0.36, 0.6, 6), '#e0b24a', 0, 0.15, 0.2, 0, 0.9);
  b.box(-0.48, 0.48, 0.05, 0.85, 0.2, 1.05, '#e0b24a');
  b.box(-0.38, 0.38, 0.05, 0.5, 1.0, 1.5, '#c0392b');
  b.box(-0.3, 0.3, -0.15, 0.05, 0.9, 1.35, '#f3e6c0');
  for (const s of [-1, 1]) {
    b.box(s * 0.3 - 0.13, s * 0.3 + 0.13, 0.55, 0.8, 0.98, 1.1, '#fdfaf0'); b.box(s * 0.3 - 0.07, s * 0.3 + 0.07, 0.6, 0.75, 1.07, 1.12, '#1b1626');
    b.add(new THREE.ConeGeometry(0.12, 0.35, 4), '#d9542e', s * 0.42, 0.98, 0.4, 0, 0, -s * 0.5);   // tai
  }
  b.add(new THREE.ConeGeometry(0.11, 0.62, 5), '#3f9f6a', 0, 1.1, 0.75, 0, 0.45);                 // 1 sừng
  for (let k = 0; k < 6; k++) { const a = -1.3 + k * 0.52; b.add(new THREE.ConeGeometry(0.2, 0.85, 4), k % 2 ? '#3f9f6a' : '#d9542e', Math.sin(a) * 0.5, 0.45 + Math.cos(a) * 0.45, 0.05, 0, -1.5 + Math.cos(a) * 0.3, -a * 0.6); }   // bờm
  b.add(new THREE.ConeGeometry(0.14, 0.55, 4), '#fdfaf0', 0, -0.32, 1.15, 0, PI);                 // râu cằm
  return b.build();
}
const lanLeg = () => { const b = new Batch(); b.box(-0.14, 0.14, -0.86, 0, -0.14, 0.14, '#e0b24a'); b.box(-0.16, 0.16, -0.98, -0.82, -0.17, 0.17, '#4a3424'); return b.build(); };
const bflyWing = () => tris([[0, 0, 0.02], [0.52, 0, 0.36], [0.46, 0, -0.04], [0, 0, -0.02], [0.4, 0, -0.08], [0.3, 0, -0.4]]);

// ---------- đường đi ----------
/** điểm trên hình chữ nhật bo góc nửa cạnh A (u) × B (v), bo r, theo độ dài cung s → [u, v] */
function rrPoint(s, A, B, r) {
  const a = A - r, b = B - r, q = PI / 2 * r, arc = (cu, cv, ang) => [cu + r * Math.cos(ang), cv + r * Math.sin(ang)];
  const seg = [[2 * b, k => [A, -b + k]], [q, k => arc(a, b, k / r)], [2 * a, k => [a - k, B]], [q, k => arc(-a, b, PI / 2 + k / r)],
    [2 * b, k => [-A, b - k]], [q, k => arc(-a, -b, PI + k / r)], [2 * a, k => [-a + k, -B]], [q, k => arc(a, -b, PI * 1.5 + k / r)]];
  const P = seg.reduce((t, x) => t + x[0], 0); s = ((s % P) + P) % P;
  for (const [len, f] of seg) { if (s <= len) return f(s); s -= len; }
  return [A, -b];
}

const _o = new THREE.Object3D(), _m = new THREE.Matrix4(), _l = new THREE.Matrix4(), _n = new THREE.Matrix4(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _v = new THREE.Vector3();
const loc = (x, y, z, rx, ry, rz, s = 1) => _n.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), _s.set(s, s, s));
const placeO = (x, y, z, pitch, yaw, s = 1) => { _o.position.set(x, y, z); _o.rotation.set(pitch, yaw, 0, 'YXZ'); _o.scale.setScalar(s); _o.updateMatrix(); return _o.matrix; };

export function create(ctx, magic, { toWorld, toLocal, L, Y }) {
  const C0 = toWorld(0, 0), A = L.astro;
  const night = () => (ctx.sky && ctx.sky.state ? ctx.sky.state.night || 0 : 0);
  const hAt = (u, v) => { const [x, z] = toWorld(u, v); return ctx.terrain.heightAt(x, z); };
  const blocked = (u, v, m) => { const [x, z] = toWorld(u, v); for (const b of ctx.boxes || []) if (b.top > Y + 0.6 && x > b.x0 - m && x < b.x1 + m && z > b.z0 - m && z < b.z1 + m) return true; for (const c of ctx.colliders || []) if (!c.lan && Math.abs(c.x - x) < c.r + m && Math.abs(c.z - z) < c.r + m && Math.hypot(c.x - x, c.z - z) < c.r + m) return true; return false; };   // tường + vật tròn (cây đa…)
  const HERB = { u0: -92, u1: 24, v0: 46, v1: 102 };   // Sân Thảo Mộc (sân đông)
  let seed = 55; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const spot = (m, tries = 34) => { for (let i = 0; i < tries; i++) { const u = HERB.u0 + rnd() * (HERB.u1 - HERB.u0), v = HERB.v0 + rnd() * (HERB.v1 - HERB.v0); if (!blocked(u, v, m)) return [u, v]; } return [-34, 60]; };
  const clear = (u0, v0, u1, v1, m) => { const n = Math.ceil(Math.hypot(u1 - u0, v1 - v0)); for (let i = 1; i <= n; i++) if (blocked(u0 + (u1 - u0) * i / n, v0 + (v1 - v0) * i / n, m)) return false; return true; };
  const info = Object.fromEntries(Object.keys(INFO).map(k => [k, { ...INFO[k], met: false, k: 0, cool: 0 }]));

  let g = null, S = null, clock = 0, frame = 0, slowDt = 0;
  function build() {
    g = new THREE.Group(); g.name = 'academy-creatures'; g.position.set(C0[0], 0, C0[1]); ctx.scene.add(g);
    const inst = (geo, mtl, n, shadow) => { const m = new THREE.InstancedMesh(geo, mtl, n); m.frustumCulled = false; m.castShadow = !!shadow; g.add(m); return m; };
    // 🐉 rồng
    const ND = 34, dBody = inst(dragonSeg(), matV(), ND), dHead = new THREE.Mesh(dragonHead(), matV()); dHead.matrixAutoUpdate = false; g.add(dHead);
    // 🕊️ chim Lạc
    const NB = 13, wingMat = toon('#ffffff', { vertexColors: true, side: THREE.DoubleSide });
    const bBody = inst(birdBody(), matV(), NB), bWing = inst(birdWing(), wingMat, NB * 2);
    const GC = [-13, 13], gsp = Array.from({ length: NB }, (_, k) => { const a = k * GOLDEN, r = 3.4 * Math.sqrt(k + 1); const u = GC[0] + Math.cos(a) * r, v = GC[1] + Math.sin(a) * r; return [u, v, hAt(u, v)]; });   // xếp kiểu hoa hướng dương
    const birds = Array.from({ length: NB }, () => ({ p: new THREE.Vector3(), yaw: 0, pitch: 0, init: false }));
    // 🐢 rùa
    const tBody = new THREE.Mesh(turtleBody(), matV()); tBody.matrixAutoUpdate = false; g.add(tBody);
    const tFlip = inst(flipperGeo(), matV(), 4);
    // 🦁 lân mẹ + lân con
    const lBody = inst(lanBody(), matV(), 2, true), lHead = inst(lanHead(), matV(), 2), lLeg = inst(lanLeg(), matV(), 8, true);
    const lans = [1, 0.72].map(sc => { const [u, v] = spot(2.6); const c = { x: 0, z: 0, r: 1.3 * sc, lan: true }; ctx.colliders && ctx.colliders.push(c); return { u, v, yaw: rnd() * 6.28, tu: u, tv: v, mode: 'graze', timer: 2 + rnd() * 5, ph: 0, walk: 0, sc, col: c, y: hAt(u, v) }; });
    // 🦋 bướm
    const NF = 21, fMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, opacity: 0.92, depthWrite: false, toneMapped: false });
    const fWing = inst(bflyWing(), fMat, NF * 2), FCOL = ['#33d6ff', '#a066ff', '#ff4fb8', '#ffd23a', '#4dffa0'].map(c => new THREE.Color(c));
    const flies = Array.from({ length: NF }, (_, i) => { const [u, v] = spot(1); fWing.setColorAt(i * 2, FCOL[i % 5]); fWing.setColorAt(i * 2 + 1, FCOL[i % 5]); return { u, v, y: hAt(u, v), ph: rnd() * 6.28, r: 1.6 + rnd() * 1.8 }; });
    fWing.instanceColor.needsUpdate = true;
    S = { ND, dBody, dHead, ds: rnd() * 500, NB, bBody, bWing, gsp, birds, tBody, tFlip, ts: PLAT.hv - PLAT.r - 40, lBody, lHead, lLeg, lans, NF, fWing, fMat, flies };
    clock = 0; frame = 0;
  }
  function unbuild() {
    if (!g) return;
    if (S && ctx.colliders) for (const l of S.lans) { const k = ctx.colliders.indexOf(l.col); if (k >= 0) ctx.colliders.splice(k, 1); }
    ctx.scene.remove(g); g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.isInstancedMesh) o.dispose(); });
    S && S.fMat.dispose(); g = null; S = null;
  }

  // ---------- từng loài ----------
  const dPath = (s, out) => { const R = 17 + 2.6 * Math.sin(s * 0.021), a = s / 17; return out.set(A.v + Math.cos(a) * R, Y + 58 + 21 * Math.sin(s * 0.0137) + 1.6 * Math.sin(s * 0.3), A.u + Math.sin(a) * R); };
  function upDragon(dt) {
    S.ds += dt * 8.9;
    for (let i = 0; i < S.ND; i++) {
      const s = S.ds - i * 1.6, k = i / (S.ND - 1); let sc = 1.25 * (1 - 0.8 * Math.pow(k, 1.3)); if (i < 3) sc *= 0.78 + i * 0.08;
      dPath(s, _o.position); _o.lookAt(dPath(s + 0.6, _v)); _o.scale.set(sc, sc, 1); _o.updateMatrix(); S.dBody.setMatrixAt(i, _o.matrix);
    }
    S.dBody.instanceMatrix.needsUpdate = true;
    dPath(S.ds + 1.6, _o.position); _o.lookAt(dPath(S.ds + 2.6, _v)); _o.scale.setScalar(1.15); _o.updateMatrix(); S.dHead.matrix.copy(_o.matrix);
  }
  const FL = { u: -21, v: 21, ru: 55, rv: 80 };
  function upBirds(dt, T) {
    const a = T * 0.075, cu = FL.u + Math.sin(a) * FL.ru, cv = FL.v + Math.cos(a) * FL.rv;
    let fu = Math.cos(a) * FL.ru, fv = -Math.sin(a) * FL.rv; const fl = Math.hypot(fu, fv); fu /= fl; fv /= fl;
    const c = T % 89, w = c < 55 ? 0 : c < 63 ? sm(55, 63, c) : c < 84 ? 1 : 1 - sm(84, 89, c), wh = sm(0, 0.7, w), wv = sm(0.3, 1, w), fold = sm(0.85, 1, w);
    for (let k = 0; k < S.NB; k++) {
      const rank = Math.ceil(k / 2), side = k % 2 ? 1 : -1, B = S.birds[k], [gu, gv, gy] = S.gsp[k];
      const u = cu - fu * rank * 5.5 - fv * side * rank * 4.4, v = cv - fv * rank * 5.5 + fu * side * rank * 4.4, y = Y + 50 + 3 * Math.sin(T * 0.4) - rank * 0.3 + Math.sin(T * 1.3 + k) * 0.4;
      const pu = u + (gu - u) * wh, pv = v + (gv - v) * wh, py = y + (gy + 1.68 - y) * wv;
      if (B.init && dt > 0) { const dx = pv - B.p.x, dz = pu - B.p.z, hs = Math.hypot(dx, dz) / dt; if (hs > 0.4) { B.yaw = Math.atan2(dx, dz); B.pitch = Math.max(-0.5, Math.min(0.5, -Math.atan2(py - B.p.y, Math.hypot(dx, dz)) * 0.6)); } }
      B.p.set(pv, py, pu); B.init = true;
      const pitch = B.pitch * (1 - fold) + fold * (-0.3 + 0.9 * Math.pow(Math.max(0, Math.sin(T * 1.7 + k * 2)), 8)), yaw = B.yaw + fold * Math.sin(T * 0.3 + k) * 0.8;
      _m.copy(placeO(pv, py, pu, pitch, yaw, 1.15)); S.bBody.setMatrixAt(k, _m);
      const flap = (0.15 + 0.6 * Math.sin(T * 4.2 + k * 0.7) * (0.35 + 0.65 * sm(-0.3, 0.3, Math.sin(T * 0.5 + k)))) * (1 - wv * 0.7), ang = flap * (1 - fold) - 0.1 * fold, ws = 1 - 0.6 * fold;
      for (const s of [1, -1]) S.bWing.setMatrixAt(k * 2 + (s > 0 ? 0 : 1), _l.copy(_m).multiply(loc(s * 0.25, 0.2, 0.15, 0, 0, s > 0 ? ang : PI - ang, ws)));
    }
    S.bBody.instanceMatrix.needsUpdate = S.bWing.instanceMatrix.needsUpdate = true;
  }
  const TA = PLAT.hu + 17, TB = PLAT.hv + 17, TR = PLAT.r + 17;
  function upTurtle(dt, T) {
    S.ts += dt * 1.3;
    const [u, v] = rrPoint(S.ts, TA, TB, TR), [u2, v2] = rrPoint(S.ts + 1, TA, TB, TR), yaw = Math.atan2(v2 - v, u2 - u);
    const ph = (T % 34) / 34, surf = sm(0, 0.15, ph) * (1 - sm(0.4, 0.55, ph)), y = -2.3 + 1.5 * surf;
    _m.copy(placeO(v, y, u + PLAT.u, -0.06 * surf + Math.sin(T * 0.7) * 0.03, yaw, 1.6)); S.tBody.matrix.copy(_m); S.tPos = [v, y, u + PLAT.u];
    [[1, 1.7, 1.5, 1], [-1, 1.7, 1.5, 1], [1, 1.5, -1.6, 0.7], [-1, 1.5, -1.6, 0.7]].forEach(([s, x, z, k], i) => {
      const f = Math.sin(T * 1.6 + (z > 0 ? 0 : PI)) * 0.45;
      S.tFlip.setMatrixAt(i, _l.copy(_m).multiply(loc(s * x, 0.08, z, 0, f * 0.8 * s, s > 0 ? f * 0.6 : PI - f * 0.6, k)));
    });
    S.tFlip.instanceMatrix.needsUpdate = true;
  }
  const HIP = [[1, 0.75, 0], [-1, 0.75, PI], [1, -0.75, PI], [-1, -0.75, 0]];   // [bên, z, pha] — chéo cặp
  function upLan(dt, T) {
    S.lans.forEach((l, i) => {
      if (l.mode === 'walk') {
        const du = l.tu - l.u, dv = l.tv - l.v, d = Math.hypot(du, dv), want = Math.atan2(dv, du);
        let dy = Math.atan2(Math.sin(want - l.yaw), Math.cos(want - l.yaw)); l.yaw += Math.sign(dy) * Math.min(Math.abs(dy), 1.6 * dt);
        const sp = Math.abs(dy) < 0.6 ? 1.3 * l.sc : 0.2, nu = l.u + Math.cos(l.yaw) * sp * dt, nv = l.v + Math.sin(l.yaw) * sp * dt;
        if (blocked(nu, nv, 1.4 * l.sc)) { l.mode = 'graze'; l.timer = 3 + Math.random() * 5; }
        else { l.u = nu; l.v = nv; l.ph += dt * sp * 3.4; l.walk = Math.min(1, l.walk + dt * 3); }
        if (d < 1) { l.mode = 'graze'; l.timer = 5 + Math.random() * 8; }
      } else {
        l.walk = Math.max(0, l.walk - dt * 3); l.timer -= dt;
        if (l.timer <= 0) {
          let ok = false;
          for (let k = 0; k < 8 && !ok; k++) { const [u, v] = i && Math.random() < 0.7 ? [S.lans[0].u + (Math.random() - 0.5) * 8, S.lans[0].v + (Math.random() - 0.5) * 8] : spot(2.2, 3); if (u > HERB.u0 && u < HERB.u1 && v > HERB.v0 && v < HERB.v1 && !blocked(u, v, 2) && clear(l.u, l.v, u, v, 1.4)) { l.tu = u; l.tv = v; ok = true; } }   // lân con hay theo mẹ
          if (ok) l.mode = 'walk'; else l.timer = 1 + Math.random() * 2;
        }
      }
      const [x, z] = toWorld(l.u, l.v); l.col.x = x; l.col.z = z; l.y = ctx.terrain.heightAt(x, z);
      const bob = Math.abs(Math.sin(l.ph)) * 0.06 * l.walk;   // l.yaw đo trong (u, v): tiến (cos, sin) → khung x = v, z = u: rotation.y = l.yaw
      _m.copy(placeO(l.v, l.y + bob * l.sc, l.u, 0, l.yaw, l.sc)); S.lBody.setMatrixAt(i, _m);
      const hp = l.walk > 0.5 ? 0.15 + 0.08 * Math.sin(l.ph * 2) : 0.95 * (1 - l.walk) + 0.12 * Math.sin(T * 5 + i) * (1 - l.walk);
      S.lHead.setMatrixAt(i, _l.copy(_m).multiply(loc(0, 1.55, 0.95, hp, 0, 0)));
      HIP.forEach(([s, hz, ph], k) => S.lLeg.setMatrixAt(i * 4 + k, _l.copy(_m).multiply(loc(s * 0.32, 0.95, hz, Math.sin(l.ph + ph) * 0.45 * l.walk, 0, 0))));
    });
    S.lBody.instanceMatrix.needsUpdate = S.lHead.instanceMatrix.needsUpdate = S.lLeg.instanceMatrix.needsUpdate = true;
  }
  const fPos = (f, T, out) => out.set(f.v + Math.cos(T * 0.53 + f.ph * 1.3) * f.r, f.y + 1 + 0.65 * (1 + Math.sin(T * 0.71 + f.ph)) + 0.2 * Math.sin(T * 6 + f.ph), f.u + Math.sin(T * 0.37 + f.ph) * f.r);
  function upFlies(dt, T) {
    const n = night(), glow = n > 0.3; S.fMat.color.setScalar(0.75 + 0.6 * n); S.fMat.fog = !glow; if (S.fMat.blending !== (glow ? THREE.AdditiveBlending : THREE.NormalBlending)) { S.fMat.blending = glow ? THREE.AdditiveBlending : THREE.NormalBlending; S.fMat.needsUpdate = true; }   // đêm: cánh tự sáng, không bị sương phủ
    S.flies.forEach((f, i) => {
      const p = fPos(f, T, _a), q = fPos(f, T + 0.1, _b), yaw = Math.atan2(q.x - p.x, q.z - p.z);
      _m.copy(placeO(p.x, p.y, p.z, 0, yaw, 0.89 + 0.34 * n)); const a = 0.25 + Math.abs(Math.sin(T * 11 + f.ph)) * 1.0;
      S.fWing.setMatrixAt(i * 2, _l.copy(_m).multiply(loc(0, 0, 0, 0, 0, a))); S.fWing.setMatrixAt(i * 2 + 1, _l.copy(_m).multiply(loc(0, 0, 0, 0, 0, PI - a)));
    });
    S.fWing.instanceMatrix.needsUpdate = true;
  }

  // ---------- lại gần: giới thiệu + câu đố ----------
  function meet(pl) {
    const P = _v.set(pl.x - C0[0], pl.y, pl.z - C0[1]); let best = null, bd = 1e9;
    const test = (key, d) => { const I = info[key]; if (d > NEAR2) I.met = false; if (d < bd) { bd = d; best = key; } };
    { let d = 1e9; for (let i = 0; i < S.ND; i += 3) { S.dBody.getMatrixAt(i, _m); d = Math.min(d, _p.setFromMatrixPosition(_m).distanceTo(P)); } _p.setFromMatrixPosition(S.dHead.matrix); test('dragon', Math.min(d, _p.distanceTo(P))); }
    { let d = 1e9; for (const B of S.birds) d = Math.min(d, B.p.distanceTo(P)); test('birds', d); }
    if (S.tPos) test('turtle', Math.hypot(S.tPos[0] - P.x, S.tPos[2] - P.z, Math.max(0, S.tPos[1] - P.y - 2)));
    test('lan', Math.min(...S.lans.map(l => Math.hypot(l.v - P.x, l.u - P.z, l.y - P.y))));
    { let d = 1e9; for (const f of S.flies) d = Math.min(d, fPos(f, clock, _a).distanceTo(P)); test('bfly', d); }
    if (!best || bd > NEAR) return;
    const I = info[best];
    if (!I.met) { I.met = true; ctx.toast(`${I.intro}<br>${I.fact}`, 8000); }
    if (clock > I.cool) ctx.offer(`❓ Câu đố của ${I.short}`, () => magic.ask(I.qs[I.k++ % I.qs.length], () => { magic.setMana(magic.mana + GAIN); I.cool = clock + 55; ctx.toast(`✨ ${I.short} khen em giỏi! +${GAIN} năng lượng phép.`, 2600); }, `❓ ${I.short} đố em`), 6);
  }

  function update(dt) {
    if (!g || !S) return;
    dt = Math.min(dt, 0.1); clock += dt; frame++; const T = clock;
    const cam = ctx.camera.position, cx = cam.x - C0[0], cz = cam.z - C0[1], dist = (x, z) => Math.hypot(x - cx, z - cz);
    g.visible = Math.hypot(cx, cz) < 296 + 89 + 144;
    if (!g.visible) return;
    // rồng + chim: bóng dáng lớn → 144–296 m vẫn cập nhật thưa (1/4 khung), xa hơn đứng yên
    slowDt += dt; const slow = frame % 4 === 0;
    const dd = dist(A.v, A.u), db = dist(FL.v, FL.u);
    if (dd < LOD || (dd < LOD2 && slow)) upDragon(dd < LOD ? dt : slowDt);
    if (db < LOD + 89 || (db < LOD2 + 89 && slow)) upBirds(db < LOD + 89 ? dt : slowDt, T);
    if (slow) slowDt = 0;
    const tn = S.tPos ? dist(S.tPos[0], S.tPos[2]) : 0, tOn = tn < LOD; S.tBody.visible = S.tFlip.visible = tOn; if (tOn || !S.tPos) upTurtle(dt, T);
    const hc = dist((HERB.v0 + HERB.v1) / 2, (HERB.u0 + HERB.u1) / 2), hOn = hc < LOD;
    S.lBody.visible = S.lHead.visible = S.lLeg.visible = S.fWing.visible = hOn;
    if (hOn) { upLan(dt, T); upFlies(dt, T); }
    const pl = ctx.player; if (pl && !(ctx.ferry && ctx.ferry.riding) && !pl.vehicle && !(ctx.aircraft && ctx.aircraft.flying)) meet(pl.pos);
  }
  const api = { build, unbuild, update: (dt, t) => update(dt, t), get state() { return S; }, get clock() { return clock; }, set clock(v) { clock = v; } };
  ctx.academyCreatures = api;   // (gỡ lỗi / kiểm thử tự động)
  return api;
}
