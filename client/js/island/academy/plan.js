// academy/plan.js — MẶT BẰNG ĐẢO HỌC VIỆN PHA LÊ (số liệu thuần, không dựng hình).
// Hệ toạ độ cục bộ của đảo: u = trục nam (+z, mặt tiền lâu đài, lạch + bến thuyền), v = trục đông (+x).
// Mọi kích thước theo Fibonacci / φ:  đảo 466 × 466 m (bo góc 89) · cao nguyên 178 × 288 m, vách đá dựng đứng 55 m sát hồ ·
// hồ rộng 55 m · lạch vào hồ rộng 34 m · đường mòn gấp khúc khắc vào vách (2 nhánh 89 + 76 m, dốc ≈ 1/π) · đường băng 233 × 13 m ·
// cầu cạn nhiều nhịp vòm từ đường băng lên cổng sau (nhịp 13 m, 89 + 77 m).
//
// KÍCH THƯỚC CHÍNH LÂU ĐÀI (m) — chi tiết ở CASTLE_L / TOWERS bên dưới:
//   khung 233 × 144 (233/144 ≈ φ) · dãy bao cao 21, dày 8 · dãy ngăn cao 13 → 3 sân (Luyện Đũa · Đại Sảnh · Thảo Mộc)
//   tháp chính (thiên văn) 89 + mái 21, ban công 55 · 8 tháp phụ tròn 55 / 34 / 21, mái nón nhọn cao r·φ³
//   đại sảnh 34 × 21 × 21 (+ mái 13) · thư viện 13 × 34 × 21 · nhà kính vòm 21 × 13 · sân luyện đũa r 21
//   khối mái chồng lớp: nhà cổng 34, cánh đông 34, dãy sau 34, tháp góc nhỏ 34 · cầu có mái 89 sang Tháp Gió (21)
//   tường thành cao 5 (răng cưa 1,3 m, cách 2,1 m) quanh mép vách, 8 tháp canh thấp 13 (r 3,4)
import { ACADEMY, PHI } from '../layout.js';
import { fbm } from '../terrain.js';

export { PHI };
export const C = ACADEMY.c;                                   // tâm đảo (thế giới)
// Lâu đài đặt thẳng trục thế giới (u = +z nam, v = +x đông): mặt tiền nhìn về phía nam, đảo chính ở đông nam → từ thuyền/máy bay
// thấy lâu đài chéo 3/4 (hai mặt cùng lúc, bóng dáng dày hơn); va chạm tường dùng hộp thẳng trục ctx.boxes.
export const F = [0, 1];                                      // trục u (thế giới)
export const S = [1, 0];                                      // trục v (thế giới)
export const ROT = 0;                                         // group.rotation.y: x cục bộ = v, z cục bộ = u
export const toWorld = (u, v) => [C[0] + u * F[0] + v * S[0], C[1] + u * F[1] + v * S[1]];
export const toLocal = (x, z) => { const dx = x - C[0], dz = z - C[1]; return [dx * F[0] + dz * F[1], dx * S[0] + dz * S[1]]; };

// ---------- số đo chính (m) ----------
export const PLAT = { u: -34, hu: 89, hv: 144, r: 21, y: 55 };          // cao nguyên đặt lâu đài (hình chữ nhật bo góc)
export const ISLE = { u: -34, hu: 233, hv: 233, r: 89 };                // mép đảo
export const LAKE = 55;                                                  // hồ bao quanh cao nguyên (bề rộng)
export const LAKE_Y = -3;                                                // đáy hồ
export const INLET = 17;                                                 // nửa bề rộng lạch thông ra biển (34 m)
// bến + đường mòn gấp khúc: nhánh 1 men chân vách (u ∈ [u0, u0+w], v 0 → v0), chiếu nghỉ 8 m, nhánh 2 khắc vào vách (u ∈ [u0−w, u0], v v0 → v2)
export const QUAY = { u0: PLAT.u + PLAT.hu, w: 8, v0: -89, v1: 21, v2: -13, land: 8, y: 1.6, y_top: PLAT.y };
QUAY.ymid = QUAY.y + (QUAY.y_top - QUAY.y) * 89 / (89 + QUAY.v2 - QUAY.v0);   // độ cao chiếu nghỉ (2 nhánh cùng dốc)
export const DOCK = [QUAY.u0 + QUAY.w + 5, 10];                          // chỗ thuyền cập bến (u, v)
export const RUNWAY = { u: ISLE.u - ISLE.hu + 45, hw: 6.5, hl: 116.5, y: 5 };   // đường băng 233 × 13 m chạy theo trục v, sau lâu đài
export const CASTLE = { u0: -106, u1: 38, hv: 116.5 };                   // khung lâu đài 144 × 233 m (233/144 ≈ φ)
// mặt bằng lâu đài (dùng ở castle.js / kit.js)
export const CASTLE_L = {
  box: CASTLE, H: 21, T: 8,                                  // cao dãy nhà, dày dãy
  gate: 5.5, back: 4,                                        // nửa bề rộng cổng chính (11 m) · cổng sau (8 m)
  pass: 5,                                                   // nửa bề rộng lối giữa các sân
  hall: { u0: -89, u1: -55, v0: -10.5, v1: 10.5, h: 21, door: 3 },   // đại sảnh 34 × 21 × 21
  library: { u0: -98, u1: -85, v0: 55, v1: 89, h: 21 },              // thư viện 13 × 34
  green: { u0: -21, u1: 0, v0: 68, v1: 81 },                         // nhà kính 21 × 13
  yard: { u: -8, v: -74, r: 21 },                                    // sân luyện đũa (tròn r 21)
  astro: { u: -80, v: -74, r: 8, h1: 55, r2: 6, h: 89, roof: 21, deck: 10.5 },   // tháp chính (thiên văn)
  bridge: { u: -55, w: 2.5, v0: -116.5, v1: -205.5, tower: [-55, -211, 6.5] },  // cầu có mái 89 m + Tháp Gió
  // khối chồng lớp trên dãy nhà [u0, u1, v0, v1, cao đỉnh tường, cao mái]: bóng mái nhiều cấp
  masses: [[29, 39, -8.5, 8.5, 34, 13], [-63, -21, 108, 117, 34, 8], [-106.5, -97.5, -34, 34, 34, 8], [-106.5, -97.5, 68, 102, 29, 8], [29.5, 38.5, -102, -68, 29, 8]],
  // tháp góc nhỏ trên nóc: [u, v, r, cao đỉnh]
  turrets: [[30.5, -34, 2.6, 34], [30.5, 34, 2.6, 34], [-98.5, -36, 2.6, 34], [-98.5, 36, 2.6, 34], [-20, 116.5, 2.1, 29], [-64, 116.5, 2.1, 29], [8, -116.5, 2.1, 29]],
  // tường thành quanh mép vách (thụt 8 m): u ∈ [u0, u1], v ∈ ±hv; cổng trước |v| < 5,5, cổng sau |v| < 4, khe cầu có mái
  curtain: { u0: -115, u1: 46, hv: 136, h: 5, t: 1.5 },
};
// 8 tháp phụ: [u, v, r, cao thân] — 55 / 34 / 21 (Fibonacci), mái nón nhọn cao r·φ³
export const TOWERS = [
  [38, -116.5, 6.5, 55], [38, 116.5, 6.5, 55], [-106, 116.5, 6.5, 55], [-106, -116.5, 5.5, 34],
  [-34, -116.5, 5, 34], [38, -12, 4.2, 21], [38, 12, 4.2, 21], [-34, 116.5, 4.2, 21],
].map(t => [...t, t[2] * PHI ** 3]);
// 8 tháp canh thấp trên tường thành: [u, v]
export const WATCH = { r: 3.4, h: 13, at: [[46, -136], [46, 136], [-115, -136], [-115, 136], [46, -10], [46, 10], [-115, -8], [-115, 8]] };
// cầu cạn nhiều nhịp vòm: đường băng → cổng sau. Nhánh A dọc v tại u = VIA.uA (v vA0 → 0), nhánh B dọc u tại v = 0 (u uA → mép vách)
export const VIA = { uA: -200, vA0: -89, uB1: PLAT.u - PLAT.hu, w: 2.5, span: 13 };

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
// khoảng cách có dấu tới hình chữ nhật bo góc (nửa cạnh hu × hv, bo r)
export function sdRR(u, v, hu, hv, r) {
  const qx = Math.abs(u) - hu + r, qz = Math.abs(v) - hv + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - r;
}
export const plateauDist = (u, v) => sdRR(u - PLAT.u, v, PLAT.hu, PLAT.hv, PLAT.r);
export const isleDist0 = (u, v) => sdRR(u - ISLE.u, v, ISLE.hu, ISLE.hv, ISLE.r);

// ---------- RỪNG PHÉP THUẬT: thuỳ đất phía tây, sau Tháp Gió (r 144) + hồ r 34 sâu 6 m (đảo nhỏ r 6,5, đường dạo vòng r 37–42) ----------
// góc θ quanh tâm hồ: 0 = nam (+u), π/2 = đông (+v, về cổng/Tháp Gió), −π/2 = tây (thác), π = bắc (bến thuyền)
export const FOREST = { u: -34, v: -377, r: 144, gate: [-34, -255], lake: { u: -34, v: -390, r: 34, bed: -6, ring: 39.5, rw: 2.5 } };
const FL = FOREST.lake;
export const lakeAt = (th, r) => [FL.u + Math.cos(th) * r, FL.v + Math.sin(th) * r];
export const CLIFF = { th: -Math.PI / 2, r: 58, top: 21, cr: 11 };                 // vách thác nước: đỉnh 21 m, mép vách cách tâm hồ 47 m
export const forestDist = (u, v) => Math.hypot(u - FOREST.u, v - FOREST.v) - FOREST.r;
export const isleDist = (u, v) => Math.min(isleDist0(u, v), forestDist(u, v));
export const R_BOUND = Math.hypot(FOREST.u - ISLE.u, FOREST.v) + FOREST.r + 21;   // bán kính bao (để lọc nhanh) — tính cả thuỳ rừng
// độ cao thuỳ rừng (−99 nếu ngoài)
export function forestH(u, v, x, z) {
  const dF = forestDist(u, v) + fbm(x * 0.013 + 3, z * 0.013) * 13 - 6; if (dF > 34) return -99;
  const n = fbm(x * 0.021, z * 0.021), land = 1 - smooth(-21, 8, dF);
  let h = (3.4 + n * 8) * land - 6 * (1 - land);
  const r = Math.hypot(u - FL.u, v - FL.v);
  if (r < FL.r + 21) h = lerp(1.6, h, smooth(FL.r + 8, FL.r + 21, r));                       // bờ phẳng + đường dạo
  if (r < FL.r + 3) h = lerp(FL.bed, 1.6, smooth(FL.r - 8, FL.r + 3, r));                    // lòng hồ sâu 6 m (= đáy biển chung, dive.js lặn được)
  if (r < 13) h = Math.max(h, lerp(1.6, FL.bed, smooth(5, 13, r)));                          // đảo nhỏ giữa hồ
  const [cu, cv] = lakeAt(CLIFF.th, CLIFF.r), dc = Math.hypot(u - cu, v - cv);
  if (dc < CLIFF.cr + 8) h = Math.max(h, CLIFF.top * (1 - smooth(CLIFF.cr - 2, CLIFF.cr + 2, dc)) + n * 1.3);   // vách đá dựng
  if (Math.abs(u - FL.u) < 4 && v < FL.v - FL.r + 3 && v > FL.v - CLIFF.r + CLIFF.cr - 1) h = Math.min(h, lerp(-1.4, h, smooth(1.6, 4, Math.abs(u - FL.u))));   // suối từ chân thác ra hồ
  return h;
}

// Dốc đá + bến: độ cao mặt đi (null nếu ngoài dải)
export function quayY(u, v) {
  const Q = QUAY;
  if (u >= Q.u0 - 0.2 && u <= Q.u0 + Q.w && v >= Q.v0 && v <= Q.v1) return v >= 0 ? Q.y : lerp(Q.y, Q.ymid, v / Q.v0);        // nhánh 1
  if (u >= Q.u0 - Q.w && u <= Q.u0 + Q.w && v >= Q.v0 - Q.land && v < Q.v0) return Q.ymid;                                       // chiếu nghỉ
  if (u >= Q.u0 - Q.w && u < Q.u0 - 0.2 && v >= Q.v0 && v <= Q.v2) return lerp(Q.ymid, Q.y_top, (v - Q.v0) / (Q.v2 - Q.v0));   // nhánh 2 (khắc vào vách)
  return null;
}

// Độ cao địa hình theo toạ độ cục bộ (u, v); x, z thế giới chỉ dùng cho nhiễu
export function heightLocal(u, v, x, z) {
  const hF = v < -144 ? forestH(u, v, x, z) : -99;
  const dI = isleDist0(u, v);
  if (dI > 34) return Math.max(-6, hF);
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
  return Math.max(h, hF);
}
export function heightAt(x, z) { const [u, v] = toLocal(x, z); return heightLocal(u, v, x, z); }

export const BASE_Y = PLAT.y;

// ---------- 4 NHÀ TỨ LINH (houses.js) — dời vị trí chỉ cần sửa ở đây ----------
// lối vào bí mật ở 4 góc sân (sát mặt trong dãy bao, gần 4 tháp góc): [u, v, hướng mặt (rad, 0 = +u)]
// phòng sinh hoạt chung = "không gian phép" ngay trên lối vào, cao POCKET m (dịch chuyển vào/ra như cầu thang tháp thiên văn)
// phòng 21 × 13 × 8 m (21/13 ≈ 13/8 ≈ φ); tải hình khi cách lối vào < 89 m
export const HOUSE_AT = {
  long: [21, -108.5, Math.PI / 2],     // sân tây, góc trước — cánh cửa đá
  quy: [-89, -108.5, Math.PI / 2],     // sân tây, góc sau — thác nước
  phung: [21, 108.5, -Math.PI / 2],    // sân đông, góc trước — bức tranh đố toán
  lan: [-70, 108.5, -Math.PI / 2],     // sân đông, góc sau — cây cổ thụ
};
export const HOUSE_ROOM = { y: 233, w: 21, d: 13, h: 8, load: 89 };
// Đại sảnh: quả cầu Tứ Linh (lễ chọn nhà) ở lối giữa trước bục; 4 đồng hồ cát pha lê 2 bên bục; 4 cờ nhà trên tường sau
export const HALL_HOUSE = { orb: [CASTLE_L.hall.u0 + 6.5, 0], glass: [[CASTLE_L.hall.u0 + 3, -7.9], [CASTLE_L.hall.u0 + 6, -7.9], [CASTLE_L.hall.u0 + 3, 7.9], [CASTLE_L.hall.u0 + 6, 7.9]], banner: [-7, -2.6, 2.6, 7] };
