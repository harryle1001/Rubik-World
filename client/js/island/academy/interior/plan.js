// academy/interior/plan.js — MẶT BẰNG NỘI THẤT LÂU ĐÀI HỌC VIỆN PHA LÊ (số liệu thuần, không dựng hình).
// Nội thất là "không gian phép" đặt cao 1597 m trên đảo học viện (ngoài tầm cắt xa 296 m của camera → không vẽ chồng thế giới,
// thế giới cũng không vẽ chồng vào đây). Cửa phép ở đại sảnh / cổng chính / ban công tháp thiên văn đưa người chơi ra vào.
// Toạ độ mặt bằng: x 0..89 (tây → đông), z 0..55 (bắc → nam), lưới 1 m; khung 89 × 55 (89/55 ≈ φ). Tầng cao FH = 8 m.
// Tầng: −2 kho bí mật · −1 hầm (bếp, ngục, hầm rượu) · 0 trệt (sảnh đón, tiền sảnh, hành lang chính) · 1 thư viện, phòng tranh ·
//       2 khí cụ, phòng ngủ khách, tầng lửng thư viện · 3 hiệu trưởng, thiên văn, 4 phòng nhà Tứ Linh · 4 đỉnh tháp chính (ra mái).
// Khối chính: giếng cầu thang trung tâm 21 × 21 (x 34..55, z 17..38) · hành lang vòng 5 m quanh giếng · hành lang chính (trục)
//   z 25..30 chạy suốt chiều dài · 2 tháp cầu thang xoắn 9 × 9 ở 2 đầu trục (tây: tầng −1..3, đông = tháp chính: 0..4).
export const W = 89, D = 55, FH = 8, OY = 1597, LV0 = -2, LV1 = 4;
export const ZERO = [44.5, 27.5];                       // tâm mặt bằng = tâm giếng cầu thang = gốc toạ độ cục bộ
// kiểu ô: void = ngoài nhà · solid = khối đặc · hole = lỗ sàn (lan can) · room/corr/tower = đi được
// g: nhóm nối liền (cùng nhóm → không xây tường giữa) · c: màu sàn
const R = (name, kind, c, g) => ({ name, kind, c, g });
export const REG = {
  corr: R('Hành lang', 'corr', '#8d857a', 'corr'), hall: R('Hành lang chính', 'corr', '#8d857a', 'corr'), well: R('Đáy giếng cầu thang', 'corr', '#6f6a62', 'corr'),
  shaft: R('Giếng cầu thang', 'hole'), hole: R('', 'hole'), solid: R('', 'solid'),
  twW: R('Tháp Xoắn Tây', 'tower', '#7f7a73', 'twW'), twE: R('Tháp Chính', 'tower', '#7f7a73', 'twE'),
  // tầng hầm
  vault: R('Kho Bí Mật', 'room', '#5d5650'), kitchen: R('Bếp Lớn', 'room', '#9a7a5a'), cellar: R('Hầm Rượu Nho', 'room', '#6e5a48'),
  secretB: R('Lối Bí Mật', 'room', '#5d5650'), dungeon: R('Ngục Tối Cũ', 'room', '#5f5a55'), herbs: R('Kho Thảo Dược', 'room', '#7d6e58'), boiler: R('Lò Sưởi Ngầm', 'room', '#6a5a50'),
  // tầng trệt
  lobby: R('Sảnh Đón', 'room', '#b3aca0'), foyer: R('Tiền Sảnh', 'room', '#a39b8f'), trophy: R('Phòng Truyền Thống', 'room', '#8a6a4a'),
  common: R('Phòng Sinh Hoạt Chung', 'room', '#7a4a3a'), class0: R('Lớp Học Tầng Trệt', 'room', '#9a8a70'), clock: R('Phòng Đồng Hồ Pha Lê', 'room', '#6f7f8f'),
  // tầng 1
  library: R('Thư Viện', 'room', '#7a5a3a'), gallery: R('Phòng Tranh', 'room', '#8a5a5a'), maps: R('Phòng Bản Đồ Cổ', 'room', '#7a6a4a'),
  class1: R('Lớp Học Tầng 1', 'room', '#9a8a70'), music: R('Phòng Nhạc', 'room', '#6a5a7a'), class1b: R('Lớp Học Tầng 1B', 'room', '#9a8a70'),
  // tầng 2
  libG: R('Tầng Lửng Thư Viện', 'room', '#7a5a3a'), instr: R('Phòng Khí Cụ', 'room', '#5a6a7a'), guest1: R('Phòng Ngủ Khách 1', 'room', '#6a4a5a'),
  guest2: R('Phòng Ngủ Khách 2', 'room', '#4a5a6a'), guest3: R('Phòng Ngủ Khách 3', 'room', '#5a6a4a'), potion: R('Phòng Pha Chế', 'room', '#5a7a6a'), study: R('Phòng Tự Học', 'room', '#7a6a5a'),
  // tầng 3
  office: R('Phòng Hiệu Trưởng', 'room', '#6a3a4a'), mirror: R('Phòng Gương Bí Mật', 'room', '#4a4a6a'), astro: R('Phòng Thiên Văn', 'room', '#2f3a5a'),
  hLong: R('Phòng Nhà Long', 'room', '#3a6a5a'), hLan: R('Phòng Nhà Lân', 'room', '#8a6a2a'), hQuy: R('Phòng Nhà Quy', 'room', '#3a4a7a'), hPhung: R('Phòng Nhà Phụng', 'room', '#8a3a3a'), lounge: R('Phòng Chờ Tầng 3', 'room', '#7a6a5a'),
  top: R('Đỉnh Tháp Chính', 'tower', '#7f7a73', 'twE'),
};
// khối dùng lại
const SHAFT = [34, 17, 55, 38], RING = [29, 12, 60, 43], SPINE = [9, 25, 80, 30], TW = [0, 23, 9, 32], TE = [80, 23, 89, 32];
const core = (shaftKind = 'shaft') => [['corr', ...RING], ['hall', ...SPINE], [shaftKind, ...SHAFT]];
// cửa: [x, z, trục, rộng] — trục 'x': cửa nằm trên đường z = z (tường chạy dọc x), mở trong x ± rộng/2; 'z': đường x = x
const dX = (x, z, w = 3) => [x, z, 'x', w], dZ = (x, z, w = 3) => [x, z, 'z', w];
// cầu thang thẳng: [x0, z0, x1, z1, hướng lên ('+x' '-x' '+z' '-z'), tầng chân, số tầng leo (±1)]
// tháp xoắn: { c: [x, z], k0, k1 (tầng thấp/cao), door: góc cửa (rad, 0 = +z nam, π/2 = +x đông) }
export const TOWERS = [
  { id: 'twW', rect: TW, c: [4.5, 27.5], k0: -1, k1: 3, door: Math.PI / 2 },
  { id: 'twE', rect: TE, c: [84.5, 27.5], k0: 0, k1: 4, door: -Math.PI / 2 },
];
// giếng cầu thang chuyển động: 4 nhịp (tầng −1→0, 0→1, 1→2, 2→3), dài 21 m, rộng 3,4 m; xoay 90° mỗi 13 s
export const SHAFT_DEF = { rect: SHAFT, hl: 10.5, hw: 1.7, k0: -1, k1: 3, beat: 13, turn: 3 };

// Lối ra thế giới: kind = nơi tới ngoài lâu đài (index.js tra toạ độ thật). at: [x, z] cửa trên mặt bằng, face: hướng vào trong (rad)
export const EXITS = [
  { id: 'hall', k: 0, at: [44.5, 0.6], face: 0, label: '🚪 Ra Đại sảnh', sign: 'Đại Sảnh ⟶' },
  { id: 'gate', k: 0, at: [53, 54.4], face: Math.PI, label: '🚪 Ra sân trước (cổng chính)', sign: 'Cổng Chính ⟶' },
  { id: 'balcony', k: 4, at: [84.5, 31.4], face: Math.PI, label: '🚪 Ra ban công tháp thiên văn (mái)', sign: 'Ban Công & Mái ⟶' },
];

export const FLOORS = {
  [-2]: {
    name: 'Tầng hầm sâu',
    paint: [['vault', 0, 36, 29, 55]],
    doors: [],
    stairs: [],
  },
  [-1]: {
    name: 'Tầng hầm',
    paint: [['solid', 0, 0, 89, 55], ...core('well'), ['kitchen', 0, 0, 29, 25], ['cellar', 9, 30, 29, 55], ['secretB', 0, 35, 9, 55], ['hole', 1, 38, 8, 51],
      ['solid', 29, 0, 60, 12], ['boiler', 34, 3, 55, 12], ['dungeon', 60, 0, 89, 25], ['herbs', 60, 30, 80, 55], ['twW', ...TW]],
    doors: [dX(19, 25, 5), dX(19, 30), dX(70, 25, 5), dX(70, 30), dX(44.5, 12), dZ(9, 27.5), dX(4.5, 38, 7)],
    // tường hầm rượu mở được → lối bí mật xuống kho (x = 9, z 40..43)
    secret: [{ id: 'cellarWall', type: 'wall', line: [9, 41.5, 'z', 3], hint: '🧱 Viên gạch này lỏng… gõ thử 3 lần', toast: '🧱 Bức tường trượt xuống! <b>Lối bí mật</b> dẫn xuống <b>Kho Bí Mật</b>.' }],
    stairs: [[1, 38, 8, 51, '-z', -2, 1]],   // bậc đá hẹp: chân ở tầng −2 (z 51), lên tới tầng −1 (z 38)
  },
  [0]: {
    name: 'Tầng trệt',
    paint: [['solid', 0, 0, 89, 55], ...core(), ['foyer', 29, 0, 60, 12], ['lobby', 29, 43, 60, 55], ['trophy', 0, 0, 29, 25], ['common', 60, 0, 89, 25],
      ['class0', 0, 30, 29, 55], ['clock', 60, 30, 80, 55], ['solid', 80, 32, 89, 55], ['twW', ...TW], ['twE', ...TE]],
    doors: [dX(44.5, 12, 7), dX(44.5, 43, 8), dX(19, 25, 5), dX(70, 25, 5), dX(19, 30), dX(70, 30), dZ(9, 27.5), dZ(80, 27.5)],
    stairs: [[33, 46, 46, 53, '+x', 0, 1]],   // cầu thang đá lớn ở sảnh: 13 m, rộng 7 m, lên tầng 1
  },
  [1]: {
    name: 'Tầng 1',
    paint: [['solid', 0, 0, 89, 55], ...core(), ['maps', 29, 0, 60, 12], ['gallery', 29, 43, 60, 55], ['hole', 33, 46, 46, 53], ['library', 0, 0, 29, 25],
      ['music', 0, 30, 29, 55], ['class1', 60, 0, 89, 25], ['class1b', 60, 30, 80, 55], ['solid', 80, 32, 89, 55], ['twW', ...TW], ['twE', ...TE]],
    doors: [dX(44.5, 12), dX(44.5, 43, 8), dX(19, 25, 5), dX(70, 25), dX(19, 30), dX(70, 30), dZ(9, 27.5), dZ(80, 27.5), dZ(46, 49.5, 7)],
    secret: [{ id: 'libShelf', type: 'shelf', line: [29, 6, 'z', 2.6], hint: '📚 Cuốn sách đỏ nhô ra… kéo thử', toast: '📚 Giá sách xoay! Lối tắt sang <b>Phòng Bản Đồ Cổ</b>.' }],
    stairs: [],
  },
  [2]: {
    name: 'Tầng 2',
    paint: [['solid', 0, 0, 89, 55], ...core(), ['study', 29, 0, 60, 12], ['potion', 29, 43, 60, 55], ['libG', 0, 0, 29, 25], ['hole', 6, 5, 23, 19],
      ['guest1', 0, 30, 14, 55], ['guest2', 14, 30, 29, 55], ['instr', 60, 0, 89, 25], ['guest3', 60, 30, 80, 55], ['solid', 80, 32, 89, 55], ['twW', ...TW], ['twE', ...TE]],
    doors: [dX(44.5, 12), dX(44.5, 43), dX(19, 25, 5), dX(70, 25), dX(7, 30), dX(21.5, 30), dX(70, 30), dZ(9, 27.5), dZ(80, 27.5)],
    stairs: [],
  },
  [3]: {
    name: 'Tầng 3',
    paint: [['solid', 0, 0, 89, 55], ...core(), ['lounge', 29, 0, 48, 12], ['mirror', 48, 0, 60, 12], ['solid', 29, 43, 60, 55], ['astro', 0, 0, 29, 25],
      ['hLong', 0, 30, 14, 55], ['hLan', 14, 30, 29, 55], ['office', 60, 0, 89, 25], ['hQuy', 60, 30, 70, 55], ['hPhung', 70, 30, 80, 55], ['solid', 80, 32, 89, 55], ['twW', ...TW], ['twE', ...TE]],
    doors: [dX(38.5, 12), dX(19, 25, 5), dX(75, 25, 3), dX(7, 30), dX(21.5, 30), dX(65, 30), dX(75, 30), dZ(9, 27.5), dZ(80, 27.5)],
    secret: [{ id: 'officeShelf', type: 'shelf', line: [60, 6, 'z', 2.6], hint: '📖 Giá sách của thầy Hiệu trưởng có rãnh mòn dưới chân…', toast: '📖 Giá sách xoay! Phòng Gương Bí Mật — gương đưa em tới <b>Tầng lửng Thư viện</b>.' }],
    stairs: [],
  },
  [4]: {
    name: 'Đỉnh tháp chính',
    paint: [['top', ...TE]],
    doors: [],
    stairs: [],
  },
};
// gương phép trong Phòng Gương Bí Mật → tầng lửng thư viện (lối tắt)
export const MIRROR = { k: 3, at: [56, 2.6], to: { k: 2, at: [14.5, 22.5] }, label: '🪞 Bước vào gương phép' };

// ĐIỂM NEO cho các phần khác (tranh động, lớp học, phòng nhà, phép thuật): ctx.academy.anchors
// kind: painting (tường treo tranh) · classroom (phòng trống chờ dựng lớp) · house (phòng sinh hoạt nhà) · magic (chỗ đặt hiệu ứng) · npc (chỗ đứng)
// pos: [x, z] mặt bằng; face: hướng nhìn vào phòng (rad, 0 = +z); size: [rộng, cao] chỗ trống trên tường (painting)
const A = (id, kind, k, x, z, face, room, extra = {}) => ({ id, kind, k, x, z, face, room, ...extra });
export const ANCHORS = [
  // tranh: hành lang chính mỗi tầng (tường bắc + nam), Phòng tranh, Sảnh đón, cầu thang
  ...[-1, 0, 1, 2, 3].flatMap(k => [12.5, 26, 61.6, 78.2].flatMap(x => [A(`p${k}_${x}n`, 'painting', k, x, 25.3, 0, 'hall', { size: [2.6, 3.4] }), A(`p${k}_${x}s`, 'painting', k, x, 29.7, Math.PI, 'hall', { size: [2.6, 3.4] })])),
  ...[32.5, 37, 52, 56.5].map((x, i) => A(`gal_n${i}`, 'painting', 1, x, 43.3, 0, 'gallery', { size: [3.4, 4.2] })),
  ...[47, 51, 55].map((z, i) => A(`gal_e${i}`, 'painting', 1, 59.7, z - 2, -Math.PI / 2, 'gallery', { size: [3.4, 4.2] })),
  A('lobby_w', 'painting', 0, 29.3, 49, Math.PI / 2, 'lobby', { size: [3.4, 5.5] }), A('lobby_e', 'painting', 0, 59.7, 49, -Math.PI / 2, 'lobby', { size: [3.4, 5.5] }),
  A('foyer_w', 'painting', 0, 29.3, 6, Math.PI / 2, 'foyer', { size: [2.6, 4.2] }), A('foyer_e', 'painting', 0, 59.7, 6, -Math.PI / 2, 'foyer', { size: [2.6, 4.2] }),
  // lớp học trống (session lớp học dựng bàn ghế/hoạt động): tâm phòng, cửa
  A('class0', 'classroom', 0, 14.5, 42.5, 0, 'class0', { size: [29, 25] }), A('class1', 'classroom', 1, 74.5, 12.5, Math.PI, 'class1', { size: [29, 25] }),
  A('class1b', 'classroom', 1, 70, 42.5, 0, 'class1b', { size: [20, 25] }), A('potion', 'classroom', 2, 44.5, 49, 0, 'potion', { size: [31, 12] }),
  // phòng sinh hoạt 4 nhà Tứ Linh (tầng 3)
  A('house_long', 'house', 3, 7, 42.5, 0, 'hLong', { house: 'Long' }), A('house_lan', 'house', 3, 21.5, 42.5, 0, 'hLan', { house: 'Lân' }),
  A('house_quy', 'house', 3, 65, 42.5, 0, 'hQuy', { house: 'Quy' }), A('house_phung', 'house', 3, 75, 42.5, 0, 'hPhung', { house: 'Phụng' }),
  // chỗ đặt hiệu ứng phép / NPC
  A('well_center', 'magic', -1, 44.5, 27.5, 0, 'well'), A('lobby_center', 'magic', 0, 44.5, 49, 0, 'lobby'), A('library_center', 'magic', 1, 14.5, 12.5, 0, 'library'),
  A('astro_dome', 'magic', 3, 14.5, 12.5, 0, 'astro'), A('vault_chest', 'magic', -2, 20, 47, 0, 'vault'), A('clock_face', 'magic', 0, 70, 30.4, 0, 'clock'),
  A('npc_lobby', 'npc', 0, 52, 47, -Math.PI / 2, 'lobby'), A('npc_library', 'npc', 1, 22, 20, Math.PI, 'library'), A('npc_kitchen', 'npc', -1, 14, 8, 0, 'kitchen'),
  A('npc_office', 'npc', 3, 80, 8, Math.PI / 2, 'office'),
];
