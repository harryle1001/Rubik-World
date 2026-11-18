// academy/plan.js — MẶT BẰNG ĐẢO HỌC VIỆN PHA LÊ (số liệu thuần, không dựng hình).
// Hệ toạ độ cục bộ của đảo: u = hướng về đảo chính (mặt tiền lâu đài, bến thuyền), v = ngang (vuông góc u).
// Mọi kích thước theo Fibonacci / φ:  đảo 466 × 466 m (bo góc 89) · cao nguyên 178 × 288 m, cao 34 m · hồ rộng 55 m ·
// lạch vào hồ rộng 34 m · dốc đá lên cao nguyên dài 89 m (dốc 34/89 = 1/φ²) · đường băng 233 × 13 m.
import { ACADEMY, PHI } from '../layout.js';
import { fbm } from '../terrain.js';

export { PHI };
export const C = ACADEMY.c;                                   // tâm đảo (thế giới)
const fx = -C[0] / Math.hypot(C[0], C[1]), fz = -C[1] / Math.hypot(C[0], C[1]);
export const F = [fx, fz];                                    // trục u (thế giới): từ tâm đảo nhìn về đảo chính
export const S = [fz, -fx];                                   // trục v (thế giới)
export const ROT = Math.atan2(fx, fz);                        // group.rotation.y: x cục bộ = v, z cục bộ = u
export const toWorld = (u, v) => [C[0] + u * F[0] + v * S[0], C[1] + u * F[1] + v * S[1]];
export const toLocal = (x, z) => { const dx = x - C[0], dz = z - C[1]; return [dx * F[0] + dz * F[1], dx * S[0] + dz * S[1]]; };

// ---------- số đo chính (m) ----------
export const PLAT = { u: -34, hu: 89, hv: 144, r: 21, y: 34 };          // cao nguyên đặt lâu đài (hình chữ nhật bo góc)
export const ISLE = { u: -34, hu: 233, hv: 233, r: 89 };                // mép đảo
export const LAKE = 55;                                                  // hồ bao quanh cao nguyên (bề rộng)
export const LAKE_Y = -3;                                                // đáy hồ
export const INLET = 17;                                                 // nửa bề rộng lạch thông ra biển (34 m)
export const QUAY = { u0: PLAT.u + PLAT.hu, w: 8, v0: -89, v1: 21, y: 1.6, y_top: PLAT.y };   // bến + dốc đá men chân vách (u ∈ [u0, u0+w])
export const DOCK = [QUAY.u0 + QUAY.w + 5, 10];                          // chỗ thuyền cập bến (u, v)
export const RUNWAY = { u: ISLE.u - ISLE.hu + 45, hw: 6.5, hl: 116.5, y: 5 };   // đường băng 233 × 13 m chạy theo trục v, sau lâu đài
export const CASTLE = { u0: -106, u1: 38, hv: 116.5 };                   // khung lâu đài 144 × 233 m (233/144 ≈ φ)

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
// khoảng cách có dấu tới hình chữ nhật bo góc (nửa cạnh hu × hv, bo r)
export function sdRR(u, v, hu, hv, r) {
  const qx = Math.abs(u) - hu + r, qz = Math.abs(v) - hv + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - r;
}
export const plateauDist = (u, v) => sdRR(u - PLAT.u, v, PLAT.hu, PLAT.hv, PLAT.r);
export const isleDist = (u, v) => sdRR(u - ISLE.u, v, ISLE.hu, ISLE.hv, ISLE.r);
export const R_BOUND = Math.hypot(ISLE.hu + Math.abs(ISLE.u), ISLE.hv) + 21;   // bán kính bao (để lọc nhanh)

// Dốc đá + bến: độ cao mặt đi (null nếu ngoài dải)
export function quayY(u, v) {
  if (u < QUAY.u0 - 0.2 || u > QUAY.u0 + QUAY.w || v < QUAY.v0 || v > QUAY.v1) return null;
  return v >= 0 ? QUAY.y : lerp(QUAY.y, PLAT.y, -v / -QUAY.v0);
}

// Độ cao địa hình theo toạ độ cục bộ (u, v); x, z thế giới chỉ dùng cho nhiễu
export function heightLocal(u, v, x, z) {
  const dI = isleDist(u, v);
  if (dI > 34) return -6;
  const n = fbm(x * 0.021, z * 0.021), n2 = fbm(x * 0.008 + 7, z * 0.008 - 3);
  const land = 1 - smooth(-21, 8, dI);
  const hill = 2.6 + n * 13 + Math.max(0, n2 - 0.5) * 34;
  let h = hill * land - 6 * (1 - land);
  // đường băng: bãi phẳng cao 5 m (bo 13 m)
  const ru = Math.abs(u - RUNWAY.u) - RUNWAY.hw - 3, rv = Math.abs(v) - RUNWAY.hl - 8, rd = Math.hypot(Math.max(ru, 0), Math.max(rv, 0));
  if (rd < 21) h = lerp(RUNWAY.y, h, smooth(0, 21, rd));
  // hồ quanh cao nguyên + vách đá + mặt cao nguyên
  const dP = plateauDist(u, v);
  if (dP < 89) {
    h = lerp(LAKE_Y, h, smooth(LAKE, 89, dP));
    const ch = 1 - smooth(INLET, INLET + 8, Math.abs(v));                // lạch thông biển phía trước
    if (u > PLAT.u + PLAT.hu && ch > 0) h = lerp(h, LAKE_Y, ch);
    if (dP < 5) h = lerp(PLAT.y + n * 0.6, LAKE_Y, smooth(0, 5, dP));
  } else if (u > 0 && Math.abs(v) < INLET + 8) h = lerp(h, LAKE_Y - 2, 1 - smooth(INLET, INLET + 8, Math.abs(v)));
  const q = quayY(u, v); if (q !== null) h = q - 0.3;                    // dốc/bến: mặt đá riêng (groundExtra), đất thấp hơn 0,3 m
  return h;
}
export function heightAt(x, z) { const [u, v] = toLocal(x, z); return heightLocal(u, v, x, z); }

// ---------- khối lâu đài (greybox, dùng chung cho bóng xa và bước dựng khối) ----------
// tháp: [u, v, bán kính, cao thân, cao mái]; cánh nhà: [u0, u1, v0, v1, cao tường, cao mái]
const H = PLAT.y;
export const TOWERS = [
  [-72, 0, 8, 89, 21],                                                  // tháp thiên văn (cao nhất 89 m)
  [38, -116.5, 6.5, 55, 13], [38, 116.5, 6.5, 55, 13], [-106, -116.5, 6.5, 55, 13], [-106, 116.5, 6.5, 55, 13],   // 4 tháp góc 55 m
  [38, -21, 5, 34, 8], [38, 21, 5, 34, 8], [-34, -116.5, 5, 34, 8], [-34, 116.5, 5, 34, 8],                      // 4 tháp 34 m: cổng + 2 bên
];
export const WINGS = [
  [30, 38, -116.5, 116.5, 21, 8],      // dãy mặt tiền
  [-106, -98, -116.5, 116.5, 21, 8],   // dãy sau
  [-106, 38, -116.5, -108.5, 21, 8],   // dãy trái
  [-106, 38, 108.5, 116.5, 21, 8],     // dãy phải
  [-31.5, -10.5, -17, 17, 21, 13],     // đại sảnh 34 × 21 × 21 m
  [-55, 30, -40, -32, 13, 5],          // dãy ngăn sân trong 1–2
  [-55, 30, 32, 40, 13, 5],            // dãy ngăn sân trong 2–3
  [-98, -55, -108.5, 108.5, 13, 5],    // dãy thư viện / phòng học phía sau
];
export const BASE_Y = H;
