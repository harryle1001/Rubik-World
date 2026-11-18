// layout.js — BỐ CỤC THẾ GIỚI HÌNH TRÒN: Trường Rubik ở tâm (người chơi xuất hiện trước cổng), 8 khu xếp đều trên
// một vòng tròn quanh trường (góc 2π/8), vòng nhà ở có sân vườn ngay quanh trường, biển bao ngoài.
// Bản đồ 2D của trường được cắt thành 4 khối (A–D) và đặt lại quanh tâm; các khu E–K chỉ có ở bản 3D.
//
// ===== HẰNG SỐ ĐỂ CHỦ DỰ ÁN CHỈNH =====
export const PHI = (1 + Math.sqrt(5)) / 2;   // tỷ lệ vàng φ ≈ 1,618
export const PI = Math.PI;                    // số π ≈ 3,1416
export const FIB = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];   // dãy Fibonacci: 2 số liền nhau chia cho nhau ≈ φ
export const ISLAND_R = 305;                  // bán kính đảo (m)
export const RING = 223;                      // bán kính vòng các khu (m) — tâm khu k ở góc -π/2 + k·2π/8
export const ZONES_N = 8;
// Vòng nhà ở quanh trường
export const RING_ROAD_R = 92;                // tâm đường vòng quanh trường (m) → chu vi 2πR
export const ROAD_W = 5;                      // bề rộng đường (Fibonacci)
export const LOT_W = 21, LOT_L = 34;          // lô đất: mặt tiền 21 m × sâu 34 m (34/21 ≈ φ)
export const HOUSE_W = LOT_W / PHI;           // nhà ≈ lô/φ: rộng ≈ 13 m
export const HOUSE_D = HOUSE_W / PHI;         // sâu ≈ 8 m (13/8 ≈ φ)
export const LOT_BACK = 5;                    // khoảng lùi sau nhà (Fibonacci) → sân trước dài 21 m
export const LOT_R0 = RING_ROAD_R + ROAD_W / 2 + 3;   // mép trong của lô (giáp lề đường)
export const LOTS_N = 16;                     // số lô trên vòng: cách nhau đúng 2π/16, mỗi khoảng giữa 2 đường hướng tâm có 2 lô
export const LAGOON_R = 34;                   // hồ bán nguyệt phía nam trường (bán kính, Fibonacci)

export const S = 0.05, TOWN_Y = 1.2, FLAT = TOWN_Y - 0.15;
export const zoneAngle = k => -PI / 2 + k * 2 * PI / ZONES_N;   // k = 0 bắc (B), 1 đông bắc (C), 2 đông (D)… theo chiều kim đồng hồ khi nhìn từ trên
const polar = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
const rectAt = ([cx, cz], w, d) => [cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2];

// Khối cắt từ bản đồ 2D: x2/y2 = khoảng 2D, c = tâm 3D của khối (o = góc trên-trái được tính từ c)
export const BLOCKS = [
  { id: 'A', name: 'Trường Rubik',            x2: [-240, 2636], y2: [-560, 1000], c: [0, 0] },               // tâm thế giới
  { id: 'B', name: 'Đồi thông & Phố Đà Lạt',  x2: [2636, 5200], y2: [-560, 760],  c: polar(RING, zoneAngle(0)) },
  { id: 'C', name: 'Thư viện & Phố mua sắm',  x2: [5200, 7800], y2: [-560, 760],  c: polar(RING, zoneAngle(1)) },
  { id: 'D', name: 'Thể thao & Rubik Kart',   x2: [7800, 10400], y2: [-560, 760], c: polar(RING, zoneAngle(2)) },
];
for (const b of BLOCKS) { const w = (b.x2[1] - b.x2[0]) * S, d = (b.y2[1] - b.y2[0]) * S; b.o = [b.c[0] - w / 2, b.c[1] - d / 2]; b.r = [b.o[0], b.o[1], b.o[0] + w, b.o[1] + d]; } // r = [x0,z0,x1,z1]

// Các khu chỉ có ở bản 3D (đất bằng ở cao độ TOWN_Y; sea: trên mặt biển; wild: giữ đồi rừng tự nhiên)
export const EXTRA = [
  { id: 'E', name: 'Làng nổi trên biển',  r: rectAt(polar(404, zoneAngle(3)), 110, 68), sea: true },   // ngoài khơi, sau sân bay
  { id: 'K', name: 'Sân bay Cánh Diều',   r: rectAt(polar(RING, zoneAngle(3)), 120, 42) },              // chỗ trống trên bờ hướng đông nam
  { id: 'F', name: 'Công viên Safari',    r: rectAt(polar(RING, zoneAngle(4)), 110, 100) },
  { id: 'G', name: 'Học viện Hoa Phượng', r: rectAt(polar(RING, zoneAngle(5)), 120, 70) },
  { id: 'H', name: 'Resort Biển Xanh',    r: rectAt(polar(RING, zoneAngle(6)), 125, 60) },
  { id: 'I', name: 'Rừng & Đền Tri Thức', r: rectAt(polar(RING, zoneAngle(7)), 90, 90), wild: true },
];
export const TEMPLE_C = polar(RING, zoneAngle(7));        // tâm Đền Tri Thức (khu I)
export const LAND = [...BLOCKS.map(b => b.r), ...EXTRA.filter(e => !e.sea && !e.wild).map(e => e.r)];
export const WORLD = { x0: -335, x1: 350, z0: -335, z1: 335 };   // phạm vi lưới địa hình

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const blockOf2D = x => BLOCKS.find(b => x < b.x2[1]) || BLOCKS[BLOCKS.length - 1];

// ===== VÒNG NHÀ Ở: 16 lô đất cách đều 2π/16, lệch π/16 so với 8 đường hướng tâm =====
// Hệ toạ độ của lô: gốc = tâm lô, +z (v) hướng về tâm thế giới (phía đường vòng), u ngang mặt tiền.
export const LOTS = [];
for (let j = 0; j < LOTS_N; j++) {
  const a = -PI / 2 + PI / LOTS_N + j * 2 * PI / LOTS_N, rc = LOT_R0 + LOT_L / 2, [cx, cz] = polar(rc, a);
  const ry = Math.atan2(-Math.cos(a), -Math.sin(a));       // xoay để +z cục bộ nhìn về tâm
  LOTS.push({ j, a, cx, cz, ry, cos: Math.cos(ry), sin: Math.sin(ry), house: null });
}
export const lotToWorld = (L, u, v) => [L.cx + u * L.cos + v * L.sin, L.cz - u * L.sin + v * L.cos];
export const worldToLot = (L, x, z) => { const dx = x - L.cx, dz = z - L.cz; return [dx * L.cos - dz * L.sin, dx * L.sin + dz * L.cos]; };
export const HOUSE_V1 = -LOT_L / 2 + LOT_BACK + HOUSE_D;  // mặt tiền nhà (v), sân trước dài LOT_L/2 - HOUSE_V1 ≈ 21 m
// lô của nhà thứ i (bỏ trống 3 lô cạnh đại lộ phía tây và phía đông làm vườn cộng đồng)
const SPARE = [7, 8, 0];
export const HOUSE_LOTS = LOTS.filter(L => !SPARE.includes(L.j));
export const GARDEN_LOTS = LOTS.filter(L => SPARE.includes(L.j));
// Nhà ở 2D (RS.HOUSES) → lô đất 3D. Gọi 1 lần khi dữ liệu trường đã tải.
let HOUSES = [];
export function setHouses(list) { HOUSES = (list || []).slice(0, HOUSE_LOTS.length); HOUSES.forEach((h, i) => { HOUSE_LOTS[i].house = h; h.lot = HOUSE_LOTS[i]; }); }
const houseAt2 = (x, y) => { const m = 40; let best = null, bd = 1e9; for (const h of HOUSES) if (x > h.x - m && x < h.x + h.w + m && y > h.y - m && y < h.y + h.h + m) { const d = Math.abs(x - h.x - h.w / 2) + Math.abs(y - h.y - h.h / 2); if (d < bd) { bd = d; best = h; } } return best; };

// 2D → 3D (điểm ngoài khối được kẹp vào mép khối; điểm trong/sát 1 nhà ở → đúng chỗ trong lô đất của nhà đó)
export function to3(x, y, hintX = x) {
  const h = HOUSES.length && houseAt2(x, y);
  if (h) { const u = (x - h.x - h.w / 2) / h.w * HOUSE_W, dy = y - h.y - h.h, v = HOUSE_V1 + (dy > 0 ? dy * S : dy / h.h * HOUSE_D); return lotToWorld(h.lot, clamp(u, -HOUSE_W / 2 - 2, HOUSE_W / 2 + 2), v); }
  const b = blockOf2D(hintX); const cx = clamp(x, b.x2[0], b.x2[1]), cy = clamp(y, b.y2[0], b.y2[1]);
  return [b.o[0] + (cx - b.x2[0]) * S, b.o[1] + (cy - b.y2[0]) * S];
}
// 3D → 2D (null nếu không thuộc khối nào)
export function to2(x, z) {
  for (const b of BLOCKS) { const r = b.r; if (x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3]) return [b.x2[0] + (x - b.o[0]) / S, b.y2[0] + (z - b.o[1]) / S]; }
  return null;
}
// khoảng cách tới khu đất gần nhất (0 nếu ở trong)
export const rectDist = (r, x, z) => Math.hypot(Math.max(r[0] - x, 0, x - r[2]), Math.max(r[1] - z, 0, z - r[3]));
export function landDist(x, z) { let d = 1e9; for (const r of LAND) d = Math.min(d, rectDist(r, x, z)); return d; }
export const inLand = (x, z, m = 0) => landDist(x, z) <= m;

// ===== ĐƯỜNG: đường vòng quanh trường + 8 đường hướng tâm nối ra 8 khu =====
const A = BLOCKS[0].r;
const ZONE_RECT = k => { const id = 'BCDKFGHI'[k]; const b = BLOCKS.find(q => q.id === id); return b ? b.r : EXTRA.find(e => e.id === id).r; };
// mỗi đường hướng tâm: từ mép khối A tới mép khu (đi theo tia góc zoneAngle(k))
export const RADIALS = Array.from({ length: ZONES_N }, (_, k) => {
  const a = zoneAngle(k), c = Math.cos(a), s = Math.sin(a), r = ZONE_RECT(k);
  let r0 = 0, r1 = RING; while (r0 < RING && rectDist(A, c * r0, s * r0) === 0) r0 += 0.5;
  r1 = r0; while (r1 < RING && rectDist(r, c * r1, s * r1) > 0) r1 += 0.5;
  if (EXTRA.find(e => e.id === 'BCDKFGHI'[k])?.wild) r1 = RING - 17;   // đường vào rừng dừng ở sân trước đền
  return { k, a, c, s, r0, r1 };
});
// khoảng cách tới tim đường gần nhất (đường vòng hoặc đường hướng tâm)
export function roadDist(x, z) {
  let d = Math.abs(Math.hypot(x, z) - RING_ROAD_R);
  for (const R of RADIALS) { const t = clamp(x * R.c + z * R.s, R.r0, R.r1); d = Math.min(d, Math.hypot(x - R.c * t, z - R.s * t)); }
  return d;
}
// có nằm trong lô đất nào (kể cả sân vườn) không → trả về lô
export function lotAt(x, z, m = 0) { for (const L of LOTS) { const [u, v] = worldToLot(L, x, z); if (Math.abs(u) < LOT_W / 2 + m && Math.abs(v) < LOT_L / 2 + m) return L; } return null; }
// nền nhà (trong lô) có trùng điểm không
export function houseAt(x, z, m = 0) { for (const L of HOUSE_LOTS) { const [u, v] = worldToLot(L, x, z); if (Math.abs(u) < HOUSE_W / 2 + m && v > -LOT_L / 2 + LOT_BACK - m && v < HOUSE_V1 + m) return L; } return null; }
// hồ bán nguyệt phía nam trường
export const LAGOON = { x: 0, z: A[3], r: LAGOON_R };
export const lagoonDist = (x, z) => z < LAGOON.z ? 1e9 : Math.hypot(x - LAGOON.x, z - LAGOON.z) - LAGOON.r;
// đất bằng ở cao độ TOWN_Y ngoài các khu (đường, lô đất) — terrain.js làm phẳng, school-town.js cho đứng đúng cao độ
export const onFlat = (x, z, m = 0) => roadDist(x, z) < ROAD_W / 2 + m || !!lotAt(x, z, m) || !!meadowAt(x, z, m) || pathDist(x, z) < PATH_W / 2 + m;
// khoảng cách tới vùng làm phẳng (0 = ở trong): đĩa thị trấn quanh trường + dải đường hướng tâm
export const TOWN_DISC = LOT_R0 + LOT_L + 8;
export function flatDist(x, z) {
  let d = Math.max(0, Math.hypot(x, z) - TOWN_DISC);
  for (const R of RADIALS) { const t = clamp(x * R.c + z * R.s, R.r0, R.r1); d = Math.min(d, Math.max(0, Math.hypot(x - R.c * t, z - R.s * t) - ROAD_W / 2 - 1)); }
  for (const M of MEADOWS) d = Math.min(d, Math.max(0, Math.hypot(x - M.x, z - M.z) - M.r - 1));
  d = Math.min(d, Math.max(0, pathDist(x, z) - PATH_W / 2 - 1));
  return d;
}
// VƯỜN TRÒN (π) ở bãi cỏ giữa thị trấn và các khu: 8 vườn ở góc giữa 2 đường hướng tâm (zoneAngle + π/8),
// bán kính MEADOW_R = 8 m (Fibonacci), đặt ở vòng gần nhất còn trống (không chạm khu, lô, đường)
export const MEADOW_R = 8;
export const MEADOWS = [];
for (let k = 0; k < ZONES_N; k++) {
  const a = zoneAngle(k) + PI / ZONES_N;
  for (const r of [152, 146, 160, 168, 140, 176]) {
    const [x, z] = polar(r, a), m = MEADOW_R + 3;
    if (landDist(x, z) > m && !lotAt(x, z, m) && roadDist(x, z) > ROAD_W / 2 + m && Math.hypot(x, z) < ISLAND_R * 0.78 && Math.hypot(x - TEMPLE_C[0], z - TEMPLE_C[1]) > 30 + m) { MEADOWS.push({ k, a, x, z, r: MEADOW_R }); break; }
  }
}
export const meadowAt = (x, z, m = 0) => MEADOWS.find(q => Math.hypot(x - q.x, z - q.z) < q.r + m);
// lối mòn nối mỗi vườn tròn ra đường hướng tâm gần nhất (không có đường cụt)
const segDist = (x, z, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1); return Math.hypot(x - ax - dx * t, z - az - dz * t); };
for (const M of MEADOWS) {
  let best = null; for (const R of RADIALS) { const t = clamp(M.x * R.c + M.z * R.s, R.r0, R.r1), d = Math.hypot(M.x - R.c * t, M.z - R.s * t); if (!best || d < best.d) best = { d, x: R.c * t, z: R.s * t }; }
  const ux = (best.x - M.x) / best.d, uz = (best.z - M.z) / best.d;
  M.path = { ax: M.x + ux * M.r * 0.7, az: M.z + uz * M.r * 0.7, bx: best.x - ux * ROAD_W / 2, bz: best.z - uz * ROAD_W / 2, ry: Math.atan2(ux, uz) };
}
export const PATH_W = 1.6;
export const pathDist = (x, z) => { let d = 1e9; for (const M of MEADOWS) d = Math.min(d, segDist(x, z, M.path.ax, M.path.az, M.path.bx, M.path.bz)); return d; };
// VÙNG CẤM TRỒNG CÂY/ĐÁ/HOA ngẫu nhiên: trong khu, lô đất, đường (+ lề), hồ, sân đền, vườn tròn
export function blocked(x, z, m = 0) {
  if (meadowAt(x, z, m) || pathDist(x, z) < PATH_W / 2 + m + 0.5) return true;
  if (landDist(x, z) <= m) return true;
  if (lotAt(x, z, m)) return true;
  if (roadDist(x, z) < ROAD_W / 2 + m + 1) return true;
  if (lagoonDist(x, z) < m + 2) return true;
  if (Math.hypot(x - TEMPLE_C[0], z - TEMPLE_C[1]) < 16 + m) return true;
  return false;
}

// Cổng trường & điểm xuất phát
export const GATE2 = [26, 400];
export const GATE3 = to3(...GATE2);
export const SPAWN = [GATE3[0] - 7, GATE3[1]];

// ===== HỌC VIỆN PHA LÊ: đảo riêng ngoài khơi hướng tây bắc (sau Rừng & Đền Tri Thức) =====
// Khoảng nước giữa 2 bờ 610 m (Fibonacci) → tâm đảo cách tâm thế giới ISLAND_R + 610 + 233 ≈ 1 148 m. Chi tiết: academy/plan.js
export const ACADEMY = (() => { const ang = zoneAngle(7), r = ISLAND_R + 610 + 233; return { ang, r, c: polar(r, ang), name: 'Học viện Pha Lê' }; })();
