// layout.js — BỐ CỤC THẾ GIỚI: trường Rubik ở giữa (người chơi xuất hiện trước cổng), các khu rải quanh đảo, biển bao ngoài.
// Bản đồ 2D của trường được cắt thành 4 khối (A–D) và đặt lại quanh cổng; thêm 4 khu mới chỉ có ở bản 3D (E–H).
// Đổi vị trí 1 khu: sửa o (gốc 3D của góc trên-trái khối 2D) hoặc rect của khu mới.
export const S = 0.05, TOWN_Y = 1.2, FLAT = TOWN_Y - 0.15;

// Khối cắt từ bản đồ 2D: x2/y2 = khoảng 2D, o = toạ độ 3D của điểm (x2[0], y2[0])
export const BLOCKS = [
  { id: 'A', name: 'Trường Rubik',            x2: [-240, 2636], y2: [-560, 1000], o: [50, -38] },   // lớp học, sân, công viên trí tuệ, nhà ở, bãi biển
  { id: 'B', name: 'Đồi thông & Phố Đà Lạt',  x2: [2636, 5200], y2: [-560, 760],  o: [0, -132] },
  { id: 'C', name: 'Thư viện & Phố mua sắm',  x2: [5200, 7800], y2: [-560, 760],  o: [140, -132] },
  { id: 'D', name: 'Thể thao & Rubik Kart',   x2: [7800, 10400], y2: [-560, 760], o: [214, -30] },
];
for (const b of BLOCKS) b.r = [b.o[0], b.o[1], b.o[0] + (b.x2[1] - b.x2[0]) * S, b.o[1] + (b.y2[1] - b.y2[0]) * S]; // [x0,z0,x1,z1]

// 4 khu mới quanh đảo (3D): đất bằng ở cao độ TOWN_Y (trừ làng nổi: trên mặt biển)
export const EXTRA = [
  { id: 'F', name: 'Công viên Safari',        r: [-205, -55, -95, 45] },
  { id: 'G', name: 'Học viện Hoa Phượng',     r: [-160, -165, -40, -95] },
  { id: 'H', name: 'Resort Biển Xanh',        r: [205, 52, 330, 112] },
  { id: 'K', name: 'Sân bay Cánh Diều',       r: [80, 58, 200, 100] },
  { id: 'E', name: 'Làng nổi trên biển',      r: [-55, 92, 55, 160], sea: true },
];
export const LAND = [...BLOCKS.map(b => b.r), ...EXTRA.filter(e => !e.sea).map(e => e.r)];
export const WORLD = { x0: -240, x1: 370, z0: -200, z1: 190 };   // phạm vi lưới địa hình

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const blockOf2D = x => BLOCKS.find(b => x < b.x2[1]) || BLOCKS[BLOCKS.length - 1];
// 2D → 3D (điểm ngoài khối được kẹp vào mép khối)
export function to3(x, y, hintX = x) {
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

// Cổng trường & điểm xuất phát
export const GATE2 = [26, 400];
export const GATE3 = to3(...GATE2);
export const SPAWN = [GATE3[0] - 7, GATE3[1]];
