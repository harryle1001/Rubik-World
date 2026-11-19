// destiny-plan.js — BỐ CỤC "RỪNG THIÊN ĐỊNH" (số liệu thuần, không dựng hình — chạy được cả trong Node để kiểm tra).
// Khối núi đá ẩn ngoài vịnh phía bắc Rừng Thiền, sau lưng cụ Rùa: KHÔNG có trên bản đồ M cho tới khi tìm ra.
//   · Cao nguyên rừng rậm (42 × 64 m, cao 8 m): lối mòn bí mật — khe đá phủ dây leo → ngã ba Mặt Trời → bãi sương đèn đá →
//     ngã ba Rêu → trảng cổ thụ → cầu khỉ.
//   · Thung lũng tròn (bán kính trong 34 m, vách cao 15 m): hang đom đóm → cây Thiên Định, hồ gương, thác 3 tầng, đền đá, vườn thiền.
// Tỷ lệ vàng: bán kính 34 · 55/φ, đỉnh vách 13 + 2 m, cao nguyên 8 m, bậc đá/đèn cách nhau theo Fibonacci, tổng lối mòn ≈ 233 m.
// terrain.js gọi destinyHeight() ở cuối rawHeight(); world-map.js gọi destinyAt() để giấu vùng đất khi chưa khám phá.
export const PHI = (1 + Math.sqrt(5)) / 2;
export const O = [-180, -280];                                             // tâm thung lũng (thế giới)
export const BOWL = { rin: 34, wall: 38, crest: 42, out: 46, floor: 5, top: 15 };
export const PLAT = { x0: -126, x1: -84, z0: -322, z1: -258, y: 8, r: 4 }; // cao nguyên lối mòn
export const RAMP = { x: -112, z0: -258, z1: -272, hw: 3.4, y0: 0.9 };     // khe dốc từ mặt nước lên cao nguyên (cửa bí mật)
export const LAKE = { x: -182, z: -301, r: 11, bed: 3.9, y: 4.55 };        // hồ gương
export const CAVE = { z: -297, x0: -137, x1: -150, hw: 4.1, y0: 8, y1: 5 };  // hang đom đóm xuyên vách (đông → tây)
export const TREE = [O[0], O[1]];                                          // cây Thiên Định
export const FALL = { x: -181, z: -315.5 };                                // chân thác 3 tầng (vách bắc)
export const STONES = [[-100.3, -241.6], [-112, -257.2]];                  // đá bước qua lạch: bãi cụ Rùa → cửa khe
// Lối mòn (tim đường, thế giới)
export const F1 = [-112, -278], F2 = [-112, -308];                         // 2 ngã ba đố hướng
export const LANTERNS = [[-101, -279], [-92, -284], [-101, -290], [-91, -296], [-100, -302], [-103, -307.5]];   // đèn đá trong bãi sương
export const FOG = { x0: -107.2, x1: -86, z0: -311.5, z1: -274.5, in: [-105, -278], out: [-106.5, -308] };
export const BRIDGE = [[-125.4, -297], [-140.4, -297]];                    // cầu khỉ vượt vực
// cổng sương ở cuối mỗi nhánh sai: [x, z, về x, về z, hướng nhìn]
export const MIST = [
  [-112, -286.5, F1[0], F1[1] + 4.5, Math.PI], [-121, -278, F1[0], F1[1] + 4.5, Math.PI],
  [-112, -317, F2[0] + 3.2, F2[1], -Math.PI / 2], [-121.5, -308, F2[0] + 3.2, F2[1], -Math.PI / 2]];
// tường rừng rậm (không đi xuyên được): các đoạn thẳng [x0, z0, x1, z1]
const P0 = PLAT.x0 + 1.6, P1 = PLAT.x1 - 1.6, Q0 = PLAT.z0 + 1.6, Q1 = PLAT.z1 - 1.6;
export const WALLS = [
  // viền cao nguyên (chừa khe dốc phía nam và đầu cầu phía tây)
  [P0, Q1, RAMP.x - 4.4, Q1], [RAMP.x + 4.4, Q1, P1, Q1], [P1, Q1, P1, Q0], [P1, Q0, P0, Q0], [P0, Q0, P0, BRIDGE[0][1] - 2.2], [P0, BRIDGE[0][1] + 2.2, P0, Q1],
  // hành lang từ khe dốc lên ngã ba 1
  [-116.4, Q1, -116.4, -276.2], [-107.6, Q1, -107.6, -276],
  // ngã ba 1: ô 8 × 8 m quanh F1 — cửa đông (đúng), bắc + tây (sai)
  [-116.4, -279.8, -116.4, -290], [-116.4, -290, -107.6, -290], [-107.6, -290, -107.6, -280],
  [-116.4, -282, -114.2, -282], [-109.8, -282, -107.6, -282],
  [P0, -274, -116.4, -274], [P0, -282, -116.4, -282],
  // bãi sương (đông): vách tây x = −107,6
  [-107.6, -290, -107.6, -305.6], [-107.6, -310.4, -107.6, Q0],
  [-107.6, -274.2, P1, -274.2],
  // ngã ba 2: ô quanh F2 — cửa nam (đúng), bắc + tây (sai)
  [-116.4, -312, -116.4, Q0], [-116.4, -312, -114.2, -312], [-109.8, -312, -107.6, -312],
  [-116.4, -312, -116.4, -310], [-116.4, -306, -116.4, -304], [P0, -312, -116.4, -312], [P0, -304, -114.2, -304], [-109.8, -304, -107.6, -304],
];
// lối đi chính (để rải rêu, dọn cây, đom đóm dẫn đường, đo chiều dài, kiểm thử tự động đi theo)
export const TRAIL = [
  STONES[0], STONES[1], [RAMP.x, RAMP.z1], F1, [F1[0] + 4.4, F1[1]], FOG.in, ...LANTERNS, FOG.out, [F2[0] + 2, F2[1]], F2, [F2[0], F2[1] + 6], [-113, -299],
  [-119, -297], BRIDGE[0], BRIDGE[1], [CAVE.x0 - 2, CAVE.z], [CAVE.x1, CAVE.z], [-158, -293], [-168, -286], [O[0] + 6.5, O[1] - 1]];
// manh mối ngoài đảo chính: bia khắc đá cạnh lối đá sau Đền → đom đóm dẫn xuống bãi cụ Rùa
export const CARVING = [-146.5, -188.5];
export const GUIDE = [CARVING, [-140, -204], [-128, -220], [-114, -231], [-103, -238.5], STONES[0], STONES[1], [RAMP.x, RAMP.z0 - 5]];
export const PORTAL_IN = [-158.5, -268.5];                                 // cổng đá trong thung lũng
export const PORTAL_OUT = [-151.5, -139.5];                                // cổng đá ở sân trước Đền Tri Thức (mở sau khi khám phá)

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const bump = (x, z) => 0.5 * Math.sin(x * 0.37 + z * 0.11) * Math.cos(z * 0.29 - x * 0.07) + 0.3 * Math.sin(x * 0.83 - z * 0.61);
// khoảng cách có dấu tới cao nguyên (chữ nhật bo góc): âm = bên trong
export function platDist(x, z) {
  const hx = (PLAT.x1 - PLAT.x0) / 2 - PLAT.r, hz = (PLAT.z1 - PLAT.z0) / 2 - PLAT.r, qx = Math.abs(x - (PLAT.x0 + PLAT.x1) / 2) - hx, qz = Math.abs(z - (PLAT.z0 + PLAT.z1) / 2) - hz;
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - PLAT.r;
}
export const bowlR = (x, z) => Math.hypot(x - O[0], z - O[1]);
// có thuộc khối núi ẩn không (m: nới rộng) — bản đồ dùng để giấu
export const destinyAt = (x, z, m = 0) => x > -232 - m && x < -78 + m && z < -250 + m && (platDist(x, z) < m + 3 || bowlR(x, z) < BOWL.out + m);
export const inBowl = (x, z, m = 0) => bowlR(x, z) < BOWL.rin + m;
export const onPlateau = (x, z, m = 0) => platDist(x, z) < m;

// Độ cao khối núi ẩn: trả về độ cao mới (hoặc out nếu ngoài vùng)
export function destinyHeight(x, z, out) {
  if (x > -76 || x < -234 || z > -246) return out;
  let h = -99, inside = false;
  const dP = platDist(x, z);
  if (dP < 4) {
    let hp = PLAT.y + bump(x, z) * 0.45 * smooth(0, -5, dP) - (PLAT.y + 4) * smooth(0, 3.2, dP);
    // khe dốc (cửa bí mật): rãnh cắt vào vách nam, dốc đều từ mặt nước lên cao nguyên
    const dx = Math.abs(x - RAMP.x);
    if (dx < RAMP.hw + 1.6 && z > RAMP.z1 - 1 && z < RAMP.z0 + 4) {
      const t = Math.min(1, Math.max(0, (RAMP.z0 - z) / (RAMP.z0 - RAMP.z1))), hr = z > RAMP.z0 ? RAMP.y0 - (z - RAMP.z0) * 1.3 : mix(RAMP.y0, PLAT.y, t);
      hp = mix(hp, Math.min(hp, hr) + (z > RAMP.z0 ? Math.max(0, hr - hp) : 0), 1 - smooth(RAMP.hw, RAMP.hw + 1.6, dx));
    }
    h = hp; inside = dP <= 0;
  }
  const r = bowlR(x, z);
  if (r < BOWL.out + 1) {
    const B = BOWL; let hb;
    if (r < B.wall) {
      let fl = B.floor + 0.9 * (1 - smooth(0, 9, r)) + bump(x, z) * 0.18;                  // gò thấp giữa thung lũng (gốc cây Thiên Định)
      const dl = Math.hypot(x - LAKE.x, z - LAKE.z); fl = mix(LAKE.bed, fl, smooth(LAKE.r - 2.6, LAKE.r + 0.6, dl));
      fl = mix(LAKE.bed + 0.1, fl, smooth(2.2, 4.2, Math.hypot(x - FALL.x, z - FALL.z - 2.2)));                                   // vực nước chân thác   // lòng hồ gương
      hb = fl + (B.top - B.floor) * smooth(B.rin, B.wall, r);
    } else if (r < B.crest) hb = B.top + 1.2 * Math.sin((r - B.wall) / (B.crest - B.wall) * Math.PI) + bump(x * 1.7, z * 1.7) * 0.7;
    else hb = B.top - (B.top + 4) * smooth(B.crest, B.out, r);
    // hang xuyên vách đông: rãnh dốc từ đầu cầu khỉ (8 m) xuống đáy thung lũng (5 m)
    const dz = Math.abs(z - CAVE.z);
    if (dz < CAVE.hw + 2.2 && x < CAVE.x0 + 1.5 && x > CAVE.x1 - 3) {
      const t = Math.min(1, Math.max(0, (CAVE.x0 - 2 - x) / (CAVE.x0 - 2 - CAVE.x1))), yc = mix(CAVE.y0, CAVE.y1, t);
      hb = mix(hb, Math.min(hb, yc), 1 - smooth(CAVE.hw, CAVE.hw + 2.2, dz));
    }
    if (hb > h) h = hb; if (r <= B.out) inside = true;
  }
  if (h < -90) return out;
  return inside ? h : Math.max(out, h);
}
// tổng chiều dài lối mòn (m)
export const TRAIL_LEN = TRAIL.reduce((s, p, i) => i ? s + Math.hypot(p[0] - TRAIL[i - 1][0], p[1] - TRAIL[i - 1][1]) : 0, 0);
