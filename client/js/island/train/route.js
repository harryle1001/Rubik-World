// train/route.js — TUYẾN TÀU PHA LÊ (số liệu thuần, không dựng hình, chạy được cả trong Node để kiểm tra).
// Hệ toạ độ tuyến: a = dọc trục từ tâm đảo chính ra Học viện (hướng D), n = ngang (hướng N = trục v của Học viện).
// Lộ trình (≈ 1 300 m): ga đi bờ tây bắc đảo chính (205°) → chạy dọc bờ biển trên kè đá → vòng ra biển trên cầu thấp →
// đảo nhỏ Đồi Thông (rừng thông, leo dốc) → đường hầm xuyên đồi → cầu cạn đá nhiều nhịp vòm vượt eo biển →
// đồi trước Học viện → vượt hồ → ga đến trên cao nguyên (y 34 m), cạnh cánh trái lâu đài.
// Kích thước theo Fibonacci / φ: sân ga 55 m · nhịp vòm 21 m (bờ biển 13 m) · ray dài 13 m · đảo nhỏ bán kính 89 m, đồi 55 m.
import { ACADEMY, PHI } from '../layout.js';

const C = ACADEMY.c, L0 = Math.hypot(C[0], C[1]);
export const D = [C[0] / L0, C[1] / L0];                 // từ đảo chính ra Học viện
export const N = [-D[1], D[0]];                          // ngang (trùng trục v của academy/plan.js)
export const aN = (a, n) => [D[0] * a + N[0] * n, D[1] * a + N[1] * n];
export const toAN = (x, z) => [x * D[0] + z * D[1], x * N[0] + z * N[1]];
const polar = (r, deg) => [r * Math.cos(deg * Math.PI / 180), r * Math.sin(deg * Math.PI / 180)];
// Học viện: (u, v) cục bộ → (a, n): a = |C| − u, n = v
const acad = (u, v) => aN(L0 - u, v);

// ---------- mốc chính ----------
export const GAUGE = 1.435, RAIL_Y = 0.16;               // khổ ray chuẩn; mặt ray cao hơn mặt đá ballast 0,16 m
export const YA = 2.6, YB = 34.85;                       // cao độ mặt ray ở ga đi (kè biển) và ga đến (cao nguyên 34 m)
export const PLAT_H = 0.9, PLAT_W = 5, PLAT_L = 55;      // sân ga cao 0,9 m trên mặt ray, rộng 5 m, dài 55 m
export const B_V = -134;                                  // ga đến: đường ray chạy dọc u ở v = −134 (cách tháp góc 11 m)
export const ISLET = { c: aN(455, -240), r: 89 + 21, hill: aN(507, -236), hr: 70, peak: 47 };   // đảo Đồi Thông

// Điểm điều khiển (thế giới, xz) — đường cong Catmull-Rom qua các điểm
const CTRL = [
  polar(258, 216),                       // 0  đuôi bãi đỗ (chắn cuối ray)
  polar(258, 211),                       // 1
  polar(258, 205),                       // 2  giữa sân ga đi
  polar(258.5, 199),                     // 3  đầu sân ga
  polar(261, 192),                       // 4  dọc bờ biển
  aN(214, -170),                         // 5  rẽ ra biển
  aN(232, -214),                         // 6
  aN(268, -238),                         // 7  cầu thấp vượt biển
  aN(330, -246),                         // 8
  aN(390, -246),                         // 9  lên đảo Đồi Thông (rừng thông)
  aN(450, -242),                         // 10 cửa hầm
  aN(525, -232),                         // 11 trong hầm
  aN(600, -212),                         // 12 ra hầm → cầu cạn
  aN(760, -170),                         // 13 giữa eo biển
  acad(240, -139),                       // 14 tới bờ Học viện
  acad(150, B_V),                        // 15 đồi trước hồ
  acad(60, B_V),                         // 16 qua hồ, chạm mép cao nguyên
  acad(-21, B_V),                        // 17 cuối sân ga đến
  acad(-40, B_V),                        // 18 chắn cuối ray
];

// ---------- Catmull-Rom (centripetal) thuần, lấy mẫu đều theo chiều dài ----------
function catmull(P, t) {
  const n = P.length - 1, f = Math.min(n - 1e-9, Math.max(0, t * n)), i = Math.floor(f), u = f - i;
  const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n, i + 2)];
  const d = (a, b) => Math.max(1e-4, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])));
  const t0 = 0, t1 = t0 + d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3), tt = t1 + (t2 - t1) * u;
  const L = (a, b, ta, tb) => [0, 1].map(k => ((tb - tt) * a[k] + (tt - ta) * b[k]) / (tb - ta));
  const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
  const B1 = [0, 1].map(k => ((t2 - tt) * A1[k] + (tt - t0) * A2[k]) / (t2 - t0)), B2 = [0, 1].map(k => ((t3 - tt) * A2[k] + (tt - t1) * A3[k]) / (t3 - t1));
  return [0, 1].map(k => ((t2 - tt) * B1[k] + (tt - t1) * B2[k]) / (t2 - t1));
}
export const STEP = 1;                                         // mẫu 1 m
const raw = [], rawS = [0], ctrlS = [];
{
  const M = 6000;
  for (let k = 0; k <= M; k++) raw.push(catmull(CTRL, k / M));
  for (let k = 1; k <= M; k++) rawS.push(rawS[k - 1] + Math.hypot(raw[k][0] - raw[k - 1][0], raw[k][1] - raw[k - 1][1]));
  for (let i = 0; i < CTRL.length; i++) ctrlS.push(rawS[Math.round(i / (CTRL.length - 1) * M)]);
}
export const LEN = rawS[rawS.length - 1];
export const NS = Math.floor(LEN / STEP) + 1;
export const X = new Float32Array(NS), Z = new Float32Array(NS), TX = new Float32Array(NS), TZ = new Float32Array(NS), Y = new Float32Array(NS);
{
  let j = 0;
  for (let i = 0; i < NS; i++) {
    const s = i * STEP; while (j < rawS.length - 2 && rawS[j + 1] < s) j++;
    const f = (s - rawS[j]) / (rawS[j + 1] - rawS[j] || 1);
    X[i] = raw[j][0] + (raw[j + 1][0] - raw[j][0]) * f; Z[i] = raw[j][1] + (raw[j + 1][1] - raw[j][1]) * f;
  }
  for (let i = 0; i < NS; i++) { const a = Math.max(0, i - 1), b = Math.min(NS - 1, i + 1), dx = X[b] - X[a], dz = Z[b] - Z[a], l = Math.hypot(dx, dz) || 1; TX[i] = dx / l; TZ[i] = dz / l; }
}
export const S_CTRL = ctrlS;

// ---------- mốc theo chiều dài s ----------
const sOf = i => ctrlS[i];
export const S_A = sOf(2);                                // giữa sân ga đi
export const S_A0 = S_A - PLAT_L / 2, S_A1 = S_A + PLAT_L / 2;
export const S_B1 = sOf(17), S_B0 = S_B1 - PLAT_L, S_B = (S_B0 + S_B1) / 2;
export const S_END = sOf(18);
// Hồ sơ dốc: phẳng ở ga đi, leo dần qua đảo Đồi Thông (≈ 4,6 %), cầu cạn leo nhẹ (≈ 2,9 %), phẳng ở cao nguyên
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const PROF = [[0, YA], [sOf(6), YA], [sOf(12), 21], [sOf(16) - 13, YB], [LEN, YB]];
export function yAt(s) {
  let k = 0; while (k < PROF.length - 2 && PROF[k + 1][0] <= s) k++;
  const [s0, y0] = PROF[k], [s1, y1] = PROF[k + 1], t = Math.min(1, Math.max(0, (s - s0) / (s1 - s0)));
  // đoạn leo: tuyến tính, bo cong 21 m ở hai đầu (đổi dốc êm)
  const lin = y0 + (y1 - y0) * t, ease = y0 + (y1 - y0) * smooth(0, 1, t);
  return lin + (ease - lin) * Math.max(0, 1 - Math.min(s - s0, s1 - s) / 21);
}
for (let i = 0; i < NS; i++) Y[i] = yAt(i * STEP);

// tra cứu theo s (nội suy)
export function at(s, out = {}) {
  const f = Math.min(NS - 1.001, Math.max(0, s / STEP)), i = Math.floor(f), t = f - i;
  out.x = X[i] + (X[i + 1] - X[i]) * t; out.z = Z[i] + (Z[i + 1] - Z[i]) * t; out.y = Y[i] + (Y[i + 1] - Y[i]) * t;
  out.tx = TX[i] + (TX[i + 1] - TX[i]) * t; out.tz = TZ[i] + (TZ[i + 1] - TZ[i]) * t; const l = Math.hypot(out.tx, out.tz) || 1; out.tx /= l; out.tz /= l;
  return out;
}
// điểm gần nhất trên tuyến (tìm thô mỗi 8 m rồi tinh) → { s, d (khoảng cách ngang có dấu: + bên trái chiều đi), y }
export function nearest(x, z, s0 = 0, s1 = LEN) {
  let best = 1e18, bi = 0;
  for (let i = Math.max(0, Math.floor(s0 / STEP)); i < Math.min(NS, s1 / STEP); i += 8) { const d = (X[i] - x) ** 2 + (Z[i] - z) ** 2; if (d < best) { best = d; bi = i; } }
  for (let i = Math.max(0, bi - 8); i <= Math.min(NS - 1, bi + 8); i++) { const d = (X[i] - x) ** 2 + (Z[i] - z) ** 2; if (d < best) { best = d; bi = i; } }
  const dx = x - X[bi], dz = z - Z[bi];
  return { s: bi * STEP, d: dx * -TZ[bi] + dz * TX[bi], along: dx * TX[bi] + dz * TZ[bi], y: Y[bi], dist: Math.sqrt(best) };
}

// ---------- đảo Đồi Thông: địa hình giải tích (không lưới) ----------
function hash(i, j) { let h = (i * 374761393 + j * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, z) {
  const i = Math.floor(x), j = Math.floor(z), u = x - i, v = z - j, su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
  const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
  return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
}
const fbm2 = (x, z) => vnoise(x, z) * 0.6 + vnoise(x * 2.1 + 5, z * 2.1 - 3) * 0.28 + vnoise(x * 4.3 - 7, z * 4.3 + 1) * 0.12;
export const ISLET_BOUND = ISLET.r + 34;
const S_IS0 = sOf(7), S_IS1 = sOf(13);                    // đoạn tuyến có thể chạm đảo nhỏ (tìm gần nhất trong khoảng này)
// độ cao đồi gốc (dùng để tự tìm đoạn hầm)
function isletBase(x, z) {
  const d = Math.hypot(x - ISLET.c[0], z - ISLET.c[1]);
  if (d > ISLET_BOUND) return -6;
  const n = fbm2(x * 0.034, z * 0.034), land = 1 - smooth(ISLET.r - 34, ISLET.r + 5, d + (n - 0.5) * 21);
  const dh = Math.hypot(x - ISLET.hill[0], z - ISLET.hill[1]), hill = ISLET.peak * Math.pow(Math.max(0, 1 - (dh / ISLET.hr) ** 2), 1.3);
  return (2.4 + n * 6 + hill * (0.85 + n * 0.3)) * land - 6 * (1 - land);
}
// Hầm: đoạn tuyến mà đồi tự nhiên cao hơn mặt ray ≥ 8 m (tự tìm, liền một đoạn dài nhất)
export const TUNNEL = (() => {
  let best = null, cur = null;
  for (let s = S_IS0; s < S_IS1; s += 1) {
    const p = at(s);
    const over = isletBase(p.x, p.z) - p.y > 8;
    if (over) { if (!cur) cur = [s, s]; cur[1] = s; } else if (cur) { if (!best || cur[1] - cur[0] > best[1] - best[0]) best = cur; cur = null; }
  }
  if (cur && (!best || cur[1] - cur[0] > best[1] - best[0])) best = cur;
  return best ? { s0: best[0] + 3, s1: best[1] - 3 } : { s0: -1, s1: -1 };
})();
// đồi tự nhiên + mỏm đá ôm 2 cổng hầm (vách đứng ở mặt cổng, đồi phía sau cao hơn cổng 13 m)
const PORT = [TUNNEL.s0, TUNNEL.s1].map((s, k) => ({ p: at(s), out: k ? 1 : -1 }));
export function isletNatural(x, z) {
  let h = isletBase(x, z); if (h <= -5.9 && Math.hypot(x - ISLET.c[0], z - ISLET.c[1]) > ISLET.r) return h;
  for (const { p, out } of PORT) {
    const dx = x - p.x, dz = z - p.z, al = (dx * p.tx + dz * p.tz) * out, lat = dx * -p.tz + dz * p.tx;   // al > 0: phía ngoài cổng
    if (al > 3 || al < -34 || Math.abs(lat) > 34) continue;
    const hb = p.y + 13 - 0.8 * Math.max(0, Math.hypot(Math.min(0, al) * 0.6, lat) - 7) - Math.max(0, al) * 8;
    h = Math.max(h, hb);
  }
  return h;
}
export const CUT_W = 4.2;                                 // nửa bề rộng nền đường (xẻ đồi / đắp nền)
// độ cao đảo nhỏ có xẻ tuyến: dọc tuyến (ngoài hầm) hạ/đắp về mặt ballast, chuyển dần ra địa hình tự nhiên trong 13 m
export function isletHeight(x, z) {
  const h0 = isletNatural(x, z); if (h0 <= -5.9) return h0;
  const q = nearest(x, z, S_IS0, S_IS1); if (q.dist > CUT_W + 21) return h0;
  if (q.s > TUNNEL.s0 - 1 && q.s < TUNNEL.s1 + 1) return h0;            // trong hầm: đồi giữ nguyên phía trên
  const bed = q.y - RAIL_Y - 0.45, k = smooth(CUT_W, CUT_W + 13, Math.abs(q.d));
  if (h0 > bed) return bed + (h0 - bed) * k;                              // xẻ: vách dốc 13 m
  return bed - h0 < 3 ? bed + (h0 - bed) * smooth(CUT_W, CUT_W + 13, Math.abs(q.d)) : h0;   // đắp thấp (< 3 m); cao hơn: để cầu đỡ
}
export { PHI };
