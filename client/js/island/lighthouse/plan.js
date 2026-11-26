// lighthouse/plan.js — HẢI ĐĂNG MŨI SÓNG: số đo (φ, Fibonacci, π) + độ cao đảo đá + mặt đi (bến gỗ, bậc đá, cầu thang xoắn 144 bậc).
// Hệ toạ độ cục bộ: gốc = chân tháp; e hướng về đảo chính (cửa tháp, bến thuyền); n vuông góc. Góc th = atan2(n, e).
// Tháp cao 34 m: thân 144 bậc × 0,18 m = 25,92 m (sọc đỏ–trắng cao 8·5·5·3·3·2 m), buồng đèn 5 m, chóp 3 m; chân rộng 2×5 m, đỉnh 2×5/φ m.
// Cầu thang: 34 bậc/vòng → mỗi vòng lên 6,12 m; sàn các tầng ở bậc 34 · 68 · 102, buồng đèn + ban công ở bậc 144.
import { LIGHTHOUSE, PHI } from '../layout.js';
import { fbm } from '../terrain.js';

const TAU = Math.PI * 2, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
export const C = LIGHTHOUSE.c;
const CR = Math.hypot(C[0], C[1]);
export const E = [-C[0] / CR, -C[1] / CR], N = [-E[1], E[0]];
export const ROT = Math.atan2(-E[1], E[0]);   // nhóm mesh: +x cục bộ = e, +z = n
export const toLocal = (x, z) => { const dx = x - C[0], dz = z - C[1]; return [dx * E[0] + dz * E[1], dx * N[0] + dz * N[1]]; };
export const toWorld = (e, n) => [C[0] + e * E[0] + n * N[0], C[1] + e * E[1] + n * N[1]];
export const R_BOUND = 55, Y0 = 5;            // bán kính bao (Fibonacci) · cao độ mặt bằng đỉnh đảo (Fibonacci)

export const T = { H: 34, R0: 5, R1: 5 / PHI, WALL: 0.45, RISE: 0.18, STEPS: 144, PER: 34, SW: 1.2, DOOR_W: 1.5, DOOR_H: 2.6, GAL: 1.6, LANT: 5, BANDS: [8, 5, 5, 3, 3, 2] };
T.DECK = T.STEPS * T.RISE; T.DTH = TAU / T.PER; T.A0 = 1.5 * T.DTH; T.PITCH = T.PER * T.RISE;
T.GA = T.A0 + (T.STEPS % T.PER + (T.PER - 6)) / 2 * T.DTH;   // cửa ra ban công: giữa lối đi vòng quanh thấu kính (nhìn ra biển khơi)
export const FLOORS = [0, 34, 68, 102].map(i => i * T.RISE);
export const rOut = y => T.R0 + (T.R1 - T.R0) * clamp(y / T.DECK, 0, 1), rIn = y => rOut(y) - T.WALL;
const mod = a => ((a % TAU) + TAU) % TAU, angd = (a, b) => { const d = mod(a - b); return d > Math.PI ? d - TAU : d; };
export const stepAngle = i => T.A0 + (i + 0.5) * T.DTH;   // góc giữa bậc i (0…143)
// bậc cao nhất có mặt ≤ lim tại góc th (−1: không có)
function stepAt(th, lim) { let best = -1; for (let i = Math.floor(mod(th - T.A0) / T.DTH); i < T.STEPS; i += T.PER) { if ((i + 1) * T.RISE <= lim) best = i; else break; } return best; }
/** số bậc đang đứng (0 = sàn) — để đếm bậc trên HUD */
export function stepNo(e, n, yr) { const r = Math.hypot(e, n); if (r > rOut(yr) || r < rIn(yr) - T.SW - 0.3) return Math.round(yr / T.RISE); return stepAt(Math.atan2(n, e), yr + 0.1) + 1; }
const floorAt = lim => { for (let k = FLOORS.length - 1; k >= 0; k--) if (FLOORS[k] <= lim) return FLOORS[k]; return 0; };

/** Mặt đỡ trong/trên tháp theo toạ độ cục bộ, yr = cao độ chân so với nền tháp. Trả về cao độ (so với nền) hoặc null nếu ngoài tháp.
 *  Tường, lan can, bệ thấu kính = khối đặc cao (không bước lên được) → người chơi bị chặn như vật thật. */
export function towerGround(e, n, yr) {
  const r = Math.hypot(e, n); if (r > T.R0 + 0.1 || yr < -1.5) return null;
  const th = Math.atan2(n, e), lim = yr + 1.0, D = T.DECK;
  if (lim >= D) {   // ----- tầng đỉnh: buồng đèn + ban công tròn -----
    const ri = T.R1 - T.WALL;
    if (r < 1.0) return D + 2.6;                                           // bệ + thấu kính Fresnel
    if (r < ri - T.SW) return D;
    if (r < ri) {                                                          // lối đi vòng; phía trên 14 bậc cuối là ô cầu thang
      const i0 = Math.floor(mod(th - T.A0) / T.DTH), i = i0 <= 7 ? 136 + i0 : i0 >= 28 ? 102 + i0 : -1;
      if (i < 0) return D;
      const top = (i + 1) * T.RISE; return i <= 135 && yr > top + 1.5 ? D + 1.3 : top;   // lan can quanh ô cầu thang
    }
    if (r <= T.R1 + 0.05) return Math.abs(angd(th, T.GA)) < 0.27 ? D : D + T.LANT;      // vách kính; cửa ra ban công
    if (r < T.R1 + T.GAL - 0.15) return D;
    if (r < T.R1 + T.GAL + 0.05) return D + 1.2;                           // lan can ban công
    return null;
  }
  const ro = rOut(Math.max(0, yr)), ri = ro - T.WALL;
  if (r > ro + 0.05) return null;
  if (r > ri) return yr < T.DOOR_H - 0.3 && e > 0 && Math.abs(n) < T.DOOR_W / 2 - 0.1 ? 0 : D;   // tường (cửa ở hướng e)
  const rs = ri - T.SW;
  if (r < rs - 0.25) return floorAt(lim);                                   // sàn tròn giữa các tầng
  const i = stepAt(th, lim), st = i >= 0 ? (i + 1) * T.RISE : 0;
  if (r >= rs) return st;                                                   // vành cầu thang (dưới gầm vòng đầu là nền)
  const fl = floorAt(yr + 0.75);                                            // dải lan can giữa cầu thang và sàn: chỉ hở ở chiếu nghỉ
  return Math.abs(st - fl) <= 0.75 ? (st + fl) / 2 : Math.max(st, floorAt(yr + 0.3)) + 1.3;
}

// ---------- đảo đá ----------
export const PIER = { e0: 24.6, e1: 46, hw: 1.5, y: 1.2 };                  // bến gỗ dài 21 m (Fibonacci), rộng 3 m
export const STAIR = { e0: 15.55, e1: 25, hw: 1.3, n: 21 };                // 21 bậc đá từ bến lên mặt bằng
STAIR.tread = (STAIR.e1 - STAIR.e0) / STAIR.n; STAIR.rise = (Y0 - PIER.y) / STAIR.n;
export const CRAG = { e: -19, n: 9, r: 8, h: 8 };                          // mỏm đá cao 8 m phía biển khơi (chỗ hải âu đậu)
/** bậc đá + bến gỗ: cao độ tuyệt đối hoặc null */
export function pathY(e, n) {
  if (Math.abs(n) > PIER.hw) return null;
  if (e >= STAIR.e1 - 0.4 && e <= PIER.e1) return PIER.y;
  if (Math.abs(n) <= STAIR.hw && e >= STAIR.e0 && e < STAIR.e1) return Math.min(Y0, PIER.y + Math.ceil((STAIR.e1 - e) / STAIR.tread) * STAIR.rise);
  return null;
}
export const edgeR = a => 30 + 3 * Math.sin(a * 3 + 1.2) + 10 * (fbm(Math.cos(a) * 1.7 + 11, Math.sin(a) * 1.7 + 4) - 0.5);   // mép đảo 24…36 m
/** độ cao đảo đá theo toạ độ cục bộ */
export function isleH(e, n) {
  const r = Math.hypot(e, n); if (r > 46) return -6;
  const d = r - edgeR(Math.atan2(n, e)), land = 1 - smooth(-11, 4, d), nz = fbm(e * 0.13 + 40, n * 0.13 - 9);
  let h = (Y0 + 0.2 + (nz - 0.5) * 6 * smooth(17, 25, r)) * land - 6 * (1 - land);
  if (r < 23) h = lerp(Y0, h, smooth(17, 23, r));                           // mặt bằng phẳng quanh tháp, nhà, vườn
  const dc = Math.hypot(e - CRAG.e, n - CRAG.n); if (dc < CRAG.r + 5) h = Math.max(h, lerp(CRAG.h + nz * 1.6, h, smooth(CRAG.r - 4, CRAG.r + 5, dc)));
  if (e > STAIR.e0 && Math.abs(n) < 3.4) {   // (trước: e0 − 1 → đầu bậc có rãnh sâu 0,35 m, vướng vách dốc → kẹt không lên được tháp)                              // rãnh bậc đá xuống bến: đất thấp hơn mặt bậc 0,35 m
    const cut = lerp(Y0, PIER.y - 1.2, clamp((e - STAIR.e0) / (STAIR.e1 - STAIR.e0), 0, 1.4)) - 0.35;
    h = Math.min(h, lerp(cut, h, smooth(1.9, 3.4, Math.abs(n))));
  }
  return h;
}
export function heightAt(x, z) { const [e, n] = toLocal(x, z); return isleH(e, n); }
