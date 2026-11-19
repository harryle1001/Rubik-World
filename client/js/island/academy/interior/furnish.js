// academy/interior/furnish.js — BÀY ĐỒ từng phòng. Đồ có sẵn model CC0 (client/assets/models/kit/: Kenney Furniture Kit, Quaternius…,
// xem CREDITS.txt) → instancing qua placeKit; đồ không có model (giường, lò sưởi, vạc, quả địa cầu, đồng hồ, kính thiên văn) → khối greybox gộp.
// furnish(k, y, B) → { kit: { tên model: [[x, y, z, scale, rotY], …] } } và vẽ khối vào B.stone / B.glow (toạ độ mặt bằng, y tuyệt đối).
import * as THREE from 'three';

const PI = Math.PI, H = PI / 2;
const WOOD = '#6e4a30', WOODL = '#a8744a', GOLD = '#c9a24a', IRON = '#3a3a44';
const HOUSE = { hLong: ['#2f7a5a', '🐉'], hLan: ['#c9962a', '🦁'], hQuy: ['#2f4f9a', '🐢'], hPhung: ['#b8323a', '🦅'] };

export function furnish(k, y, B) {
  const kit = {}, S = B.stone, G = B.glow;
  const put = (name, x, z, s = 1, ry = 0, dy = 0) => (kit[name] = kit[name] || []).push([x, y + dy, z, s, ry]);
  // barrel/barrels: gốc model lệch (2, 1,5) đơn vị → bù theo tỷ lệ
  // thùng rượu nằm (không có model CC0 phù hợp → khối): thân gỗ, 2 đai sắt, mặt thùng, giá kê
  const cask = (x, z, s = 7, dy = 0) => { const r = 0.11 * s, L = 0.24 * s, yc = y + r + 0.18 + dy; S.add(new THREE.CylinderGeometry(r, r, L, 12), '#8a5a38', x, yc, z, 0, 0, H); for (const e of [-0.3, 0.3]) S.add(new THREE.CylinderGeometry(r * 1.04, r * 1.04, 0.1, 12), IRON, x + e * L, yc, z, 0, 0, H); S.add(new THREE.CircleGeometry(r * 0.9, 12), '#a8744a', x + L / 2 + 0.01, yc, z, H); if (!dy) S.add(new THREE.BoxGeometry(L * 0.7, 0.36, r * 1.5), WOOD, x, y + 0.18, z); };
  const casks = (x, z, s = 5) => { cask(x - 0.12 * s, z, s); cask(x + 0.12 * s, z, s); cask(x, z, s, 0.2 * s); };
  const row = (n, x0, z0, x1, z1, f) => { for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); f(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, i); } };
  // kệ sách cao nhiều tầng: chồng 3 kệ scale 2 (4 × 4,9 m), mặt trước theo ry
  const tallShelf = (x, z, ry, tiers = 3, s = 2) => { for (let i = 0; i < tiers; i++) put('furn_bookshelf_full', x, z, s, ry, 0.2 + i * 1.64); };
  const fireplace = (x, z, ry, w = 4) => { const g = new THREE.Group(); const b = new THREE.BoxGeometry(w, 3.2, 1.2); S.add(b, '#6f6a62', x, y + 1.6, z, ry); S.add(new THREE.BoxGeometry(w + 0.6, 0.35, 1.5), '#5a554e', x, y + 3.3, z, ry); G.add(new THREE.BoxGeometry(w * 0.55, 1.2, 0.2), '#ff9a3a', x + Math.sin(ry) * 0.55, y + 0.7, z + Math.cos(ry) * 0.55, ry); void g; };
  const bed = (x, z, ry, col) => { const s = Math.sin(ry), c = Math.cos(ry); S.add(new THREE.BoxGeometry(2.2, 0.55, 3.2), WOOD, x, y + 0.28, z, ry); S.add(new THREE.BoxGeometry(2.0, 0.25, 2.6), col, x + s * 0.25, y + 0.68, z + c * 0.25, ry); S.add(new THREE.BoxGeometry(1.4, 0.22, 0.6), '#f3efe6', x - s * 1.15, y + 0.7, z - c * 1.15, ry); S.add(new THREE.BoxGeometry(2.2, 1.6, 0.15), WOOD, x - s * 1.6, y + 0.8, z - c * 1.6, ry); for (const q of [-1, 1]) for (const e of [-1.55, 1.55]) S.add(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 5), WOODL, x + c * q * 1.0 + s * e, y + 1.2, z - s * q * 1.0 + c * e); };
  const cauldron = (x, z) => { S.add(new THREE.CylinderGeometry(0.75, 0.55, 0.9, 10), IRON, x, y + 0.65, z); G.add(new THREE.CircleGeometry(0.62, 10).rotateX(-H), '#7dff9a', x, y + 1.08, z); G.add(new THREE.ConeGeometry(0.35, 0.3, 6), '#ff8a3a', x, y + 0.15, z); };
  const globe = (x, z, r = 0.55, h = 1.1) => { S.add(new THREE.CylinderGeometry(0.08, 0.3, h, 6), WOOD, x, y + h / 2, z); S.add(new THREE.SphereGeometry(r, 10, 7), '#3f7fa8', x, y + h + r, z); S.add(new THREE.TorusGeometry(r + 0.08, 0.03, 4, 16), GOLD, x, y + h + r, z, 0, 0.4); };
  const scope = (x, z, ry, L = 2.6) => { S.add(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 5), WOOD, x, y + 0.7, z); S.add(new THREE.CylinderGeometry(0.16, 0.22, L, 8), GOLD, x, y + 1.6, z, ry, 1.0); };
  const orrery = (x, z, h = 2.2) => { S.add(new THREE.CylinderGeometry(0.1, 0.35, h, 6), GOLD, x, y + h / 2, z); G.add(new THREE.SphereGeometry(0.5, 10, 7), '#ffd27a', x, y + h + 0.5, z); [1.3, 2.1, 2.9, 3.7].forEach((r, i) => { S.add(new THREE.TorusGeometry(r, 0.025, 3, 28), GOLD, x, y + h + 0.5, z, 0, H + 0.12 * i); G.add(new THREE.SphereGeometry(0.16 + i * 0.05, 8, 6), ['#9fd0ff', '#ff9a7a', '#a0ffb0', '#e0c0ff'][i], x + Math.cos(i * 2.1) * r, y + h + 0.5 + Math.sin(i * 2.1) * r * 0.12, z + Math.sin(i * 2.1) * r); }); };
  const banner = (x, z, ry, col, h = 4) => { S.add(new THREE.BoxGeometry(1.6, h, 0.06), col, x, y + 6.8 - h / 2, z, ry); S.add(new THREE.ConeGeometry(0.8, 0.7, 3).scale(1, 1, 0.08), col, x - Math.sin(ry) * 0, y + 6.8 - h - 0.3, z, ry, PI); S.add(new THREE.CylinderGeometry(0.05, 0.05, 2, 5), GOLD, x, y + 6.85, z, ry, 0, H); };
  const crystal = (x, z, s = 1, col = '#bfe9ff') => { G.add(new THREE.OctahedronGeometry(0.45 * s), col, x, y + 0.5 * s, z, 0, 0, 0, 1, 1.8, 1); };
  const chalk = (x, z, ry) => { put('school_chalkboard', x, z, 1.6, ry, 1.0); put('furn_table', x + Math.sin(ry) * 3.4, z + Math.cos(ry) * 3.4, 0.9, ry); put('furn_chair', x + Math.sin(ry) * 1.9, z + Math.cos(ry) * 1.9, 1, ry); };
  const chandelier = (x, z, r = 1.6) => { S.add(new THREE.TorusGeometry(r, 0.06, 4, 16), GOLD, x, y + 6.0, z, 0, H); S.add(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 4), IRON, x, y + 6.8, z); for (let i = 0; i < 8; i++) { const a = i / 8 * 2 * PI; G.add(new THREE.ConeGeometry(0.09, 0.26, 5), '#ffc35a', x + Math.cos(a) * r, y + 6.2, z + Math.sin(a) * r); } };

  switch (k) {
    case -2: {   // KHO BÍ MẬT: rương báu, chum, tượng, pha lê
      row(5, 12, 52, 26, 52, (x, z, i) => put('chest', x, z, 1.6, PI));
      row(3, 26, 40, 26, 48, (x, z) => put('chest', x, z, 1.6, -H));
      for (const [x, z] of [[12, 40], [16, 44], [20, 40], [24, 44], [14, 48], [22, 48]]) put('prop_urn', x, z, 3);
      put('prop_statue', 12, 38, 2.2, PI / 4); put('prop_statue', 27, 38, 2.2, -PI / 4);
      for (let i = 0; i < 13; i++) crystal(11 + (i * 7) % 17, 39 + (i * 5) % 14, 0.8 + (i % 3) * 0.4, ['#bfe9ff', '#e6b0ff', '#a0ffcf'][i % 3]);
      put('prop_trophy', 20, 47, 2); put('prop_trophy', 17, 50, 1.6, 1); put('prop_trophy', 23, 50, 1.6, -1);
      break;
    }
    case -1: {
      // Bếp Lớn
      fireplace(14.5, 0.9, 0, 8); put('prop_fire_basket', 14.5, 1.4, 4);
      row(2, 7, 9, 22, 9, (x, z) => put('furn_table_long', x, z, 1.3, H)); row(2, 7, 17, 22, 17, (x, z) => put('furn_table_long', x, z, 1.3, H));
      for (const z of [9, 17]) row(4, 4, z - 1.9, 25, z - 1.9, (x, zz) => put('furn_stool', x, zz, 1.2)), row(4, 4, z + 1.9, 25, z + 1.9, (x, zz) => put('furn_stool', x, zz, 1.2));
      row(4, 1.2, 4, 1.2, 21, (x, z) => put('furn_kitchen_table', x, z, 1, H)); row(3, 27.8, 4, 27.8, 20, (x, z) => put('furn_cabinet', x, z, 1.1, -H));
      for (const [x, z] of [[11.5, 23.4], [14.5, 23.4], [24, 1.6]]) cask(x, z, 7); put('prop_crate_bottles', 26.5, 23, 1.4, 0.3); put('prop_crate_bottles', 23, 23.4, 1.4); put('prop_pot_large', 3, 2.2, 3);
      cauldron(22, 3); cauldron(7, 3);
      // Hầm Rượu Nho: hàng thùng lớn
      for (let z = 33; z < 54; z += 3.4) { cask(12, z, 8); cask(26, z, 8); }
      row(3, 17, 36, 21, 36, (x, z) => casks(x, z, 6)); row(3, 17, 47, 21, 47, (x, z) => casks(x, z, 6)); put('prop_crate_bottles', 19, 52.5, 1.6); put('prop_lantern_hanging', 19, 41.5, 2, 0, 5.5);
      // Lối Bí Mật + Ngục Tối Cũ (song sắt)
      put('prop_lantern_hanging', 4.5, 36.5, 2, 0, 5.2);
      for (const cx of [63, 69, 75, 81, 87]) { row(5, cx - 2.4, 18, cx + 2.4, 18, (x, z) => put('fence_iron', x, z + 0.35, 2.6)); S.add(new THREE.BoxGeometry(0.4, 7.6, 18), '#6f6a62', cx + 3, y + 3.8, 9); }
      for (const cx of [63, 75, 87]) { put('furn_stool', cx, 6, 1); put('crate', cx + 1.2, 3, 2.4, 0.4); }
      put('prop_lantern_hanging', 72, 21.5, 2, 0, 5.4); put('prop_statue_head', 81, 4, 2.4, PI);
      // Kho Thảo Dược
      row(4, 62, 31, 78, 31, (x, z) => put('furn_shelf_big', x, z, 1.6, 0, 0)); row(4, 62, 31, 78, 31, (x, z) => put('prop_urn', x, z + 0.4, 2.2, 0, 0.62));
      for (const [x, z] of [[63, 52], [77, 52], [63, 40], [77, 40]]) put('plant_qt_plant', x, z, 1.4, x);
      row(2, 66, 45, 74, 45, (x, z) => put('furn_table', x, z, 1.2)); for (const [x, z] of [[66, 45], [74, 45]]) put('prop_pot_large', x, z, 2.4, 0, 1.2);
      // Lò Sưởi Ngầm
      for (const x of [38, 44.5, 51]) { S.add(new THREE.CylinderGeometry(1.6, 1.9, 5.5, 10), '#4a4440', x, y + 2.75, 6); G.add(new THREE.BoxGeometry(1.4, 1.0, 0.2), '#ff7a2a', x, y + 1.2, 7.85); S.add(new THREE.CylinderGeometry(0.4, 0.4, 2.2, 6), '#3a3430', x, y + 6.5, 6); }
      // Đáy giếng: vòng rune
      G.add(new THREE.RingGeometry(6.4, 6.9, 34).rotateX(-H), '#7fd8ff', 44.5, y + 0.03, 27.5); G.add(new THREE.RingGeometry(2.6, 2.9, 21).rotateX(-H), '#e6b0ff', 44.5, y + 0.03, 27.5);
      break;
    }
    case 0: {
      // Sảnh Đón: tượng 2 bên cửa, cây, đèn cột, thảm
      put('prop_statue', 49.5, 51.8, 2.6, PI); put('prop_statue', 56.5, 51.8, 2.6, PI);
      for (const [x, z] of [[31, 44.5], [58, 44.5], [58, 53.5]]) put('plant_qt_plant', x, z, 1.3, x);
      for (const x of [48, 58]) put('prop_lantern', x, 45.4, 2.6); S.add(new THREE.BoxGeometry(6, 0.03, 9), '#7a3040', 53, y + 0.02, 49);
      chandelier(53, 49, 2.1);
      // Tiền Sảnh (cửa ra Đại sảnh): cột, ghế dài, cờ
      for (const x of [33, 39, 50, 56]) put('column', x, 6, 5);
      put('furn_couch', 33, 10.2, 1, PI); put('furn_couch', 56, 10.2, 1, PI); banner(40.5, 0.4, 0, '#7a3040'); banner(48.5, 0.4, 0, '#2f4f9a');
      // Phòng Truyền Thống: tủ + cúp + tượng
      row(4, 4, 1, 25, 1, (x, z) => { put('furn_cabinet', x, z, 1.2); put('prop_trophy', x - 0.5, z, 1.6, 0, 1.2); put('prop_trophy', x + 0.6, z, 1.3, 0.5, 1.2); });
      row(3, 1, 6, 1, 20, (x, z) => { put('furn_cabinet', x, z, 1.2, H); put('prop_trophy', x, z, 1.8, H, 1.2); });
      put('prop_statue', 14.5, 12, 3, 0); put('furn_rug', 14.5, 12, 2.4); for (const [x, z] of [[9, 18], [20, 18]]) put('prop_lantern', x, z, 2.2);
      // Phòng Sinh Hoạt Chung: lò sưởi, sofa, ghế bành, thảm, kệ sách
      fireplace(74.5, 0.9, 0, 5); put('furn_rug', 74.5, 8, 2.2);
      put('furn_couch', 74.5, 12, 1.3, PI); put('furn_armchair', 69, 7, 1.2, H); put('furn_armchair', 80, 7, 1.2, -H); put('furn_table_low', 74.5, 7.5, 1.1);
      put('furn_couch', 64, 20, 1.2, H); put('furn_couch', 85, 20, 1.2, -H); put('furn_table_round', 74.5, 18.5, 1.0);
      row(3, 88.4, 4, 88.4, 16, (x, z) => put('furn_bookshelf_full', x, z, 1.6, -H)); put('furn_lamp', 62, 3, 1.2); put('furn_lamp', 87, 23, 1.2);
      // Lớp Học Tầng Trệt (điểm neo 'class0': phòng trống chờ dựng lớp)
      chalk(14.5, 54.5, PI);
      // Phòng Đồng Hồ Pha Lê: mặt đồng hồ lớn + con lắc
      G.add(new THREE.CircleGeometry(4.2, 34), '#e8f6ff', 70, y + 4.2, 54.6, PI); S.add(new THREE.TorusGeometry(4.4, 0.25, 4, 34), GOLD, 70, y + 4.2, 54.5, PI);
      for (let i = 0; i < 12; i++) { const a = i / 12 * 2 * PI; S.add(new THREE.BoxGeometry(0.18, 0.6, 0.06), '#2a2236', 70 + Math.sin(a) * 3.6, y + 4.2 + Math.cos(a) * 3.6, 54.45, PI, 0, -a); }
      S.add(new THREE.BoxGeometry(0.16, 3.2, 0.06), '#2a2236', 70, y + 5.6, 54.4, PI); S.add(new THREE.BoxGeometry(2.4, 0.16, 0.06), '#2a2236', 71.1, y + 4.2, 54.4, PI);
      S.add(new THREE.CylinderGeometry(0.05, 0.05, 3.4, 4), GOLD, 70, y + 2.3, 53.6); S.add(new THREE.CylinderGeometry(0.6, 0.6, 0.15, 12), GOLD, 70, y + 0.6, 53.6, 0, H);
      row(2, 62, 32, 78, 32, (x, z) => put('furn_bookshelf_full', x, z, 1.6, 0)); put('furn_armchair', 64, 46, 1.2, H); put('furn_armchair', 76, 46, 1.2, -H);
      break;
    }
    case 1: {
      // THƯ VIỆN (cao 2 tầng): kệ cao 3 tầng quanh tường, 4 dãy kệ đứng giữa, bàn đọc dài, đèn
      for (let x = 3; x < 27; x += 4.2) tallShelf(x, 0.3, 0);
      for (let z = 3; z < 20; z += 4.2) tallShelf(0.3, z, H);
      for (let z = 9; z < 23; z += 4.2) tallShelf(28.7, z, -H);
      tallShelf(12.5, 24.7, PI);
      for (const z of [6, 12, 18]) { tallShelf(8, z, 0, 2); tallShelf(8, z, PI, 2); tallShelf(21, z, 0, 2); tallShelf(21, z, PI, 2); }
      for (const z of [9, 15]) { put('furn_table_long', 14.5, z, 1.2, H); for (const s of [-1, 1]) row(3, 12, z + s * 1.6, 17, z + s * 1.6, (x, zz) => put('furn_chair', x, zz, 1, s > 0 ? PI : 0)); put('furn_book_set', 13.5, z, 1.6, 0.4, 1.2); put('furn_book_set', 16, z, 1.6, -0.3, 1.2); }
      for (const [x, z] of [[11, 4], [18, 4], [11, 21], [18, 21]]) put('furn_lamp', x, z, 1.3);
      put('furn_rug', 14.5, 12, 2.6, H);
      // Phòng Tranh: ghế ngắm tranh, tượng (tường để trống cho tranh động — điểm neo 'gal_*')
      put('furn_couch', 52, 49, 1.1, -H); put('prop_statue', 34, 54, 2.4, PI); put('prop_statue', 58, 54, 2.4, PI); chandelier(52, 49);
      // Phòng Bản Đồ Cổ: bàn bản đồ + quả địa cầu
      put('furn_table_long', 40, 6, 1.3, 0); put('furn_table_long', 50, 6, 1.3, 0); globe(36, 3); globe(55, 9, 0.7, 1.2);
      S.add(new THREE.BoxGeometry(3.4, 0.03, 1.8), '#e8d8a8', 40, y + 1.33, 6, 0.1); S.add(new THREE.BoxGeometry(3.4, 0.03, 1.8), '#d8c898', 50, y + 1.33, 6, -0.1);
      row(3, 33, 11.5, 56, 11.5, (x, z) => put('furn_shelf_big', x, z, 1.6, PI));
      // Phòng Nhạc
      put('music_drums', 8, 40, 1.6, 0.5); put('music_guitar_classic', 14, 34, 2, 0, 0); put('music_trumpet', 20, 44, 2.4, 0, 1.0); put('furn_table_small', 20, 44, 1);
      S.add(new THREE.BoxGeometry(4.2, 1.1, 1.6), '#1a1a22', 22, y + 1.0, 52); S.add(new THREE.BoxGeometry(4.2, 0.05, 0.4), '#f3efe6', 22, y + 1.58, 51.3); for (const x of [20.3, 23.7]) S.add(new THREE.BoxGeometry(0.2, 0.9, 1.4), '#1a1a22', x, y + 0.45, 52);
      row(4, 4, 49, 16, 49, (x, z) => put('furn_stool', x, z, 1.1)); row(3, 1.2, 36, 1.2, 52, (x, z) => put('furn_cabinet', x, z, 1.1, H));
      // Lớp học tầng 1 (trống, điểm neo)
      chalk(74.5, 0.5, 0); chalk(70, 54.5, PI);
      break;
    }
    case 2: {
      // Tầng lửng thư viện: kệ quanh tường, ghế bành bên lan can
      for (let x = 3; x < 27; x += 4.2) tallShelf(x, 0.3, 0, 2);
      for (let z = 3; z < 20; z += 4.2) tallShelf(0.3, z, H, 2);
      for (let z = 3; z < 23; z += 4.2) tallShelf(28.7, z, -H, 2);
      put('furn_armchair', 3.2, 22, 1.1, PI * 0.75); put('furn_armchair', 26, 3, 1.1, -PI / 4); put('furn_lamp', 25.5, 22, 1.2);
      // Phòng Khí Cụ: bàn khí cụ, quả cầu, kính thiên văn, đồng hồ cát, la bàn lớn
      row(3, 64, 6, 85, 6, (x, z) => put('furn_table', x, z, 1.1)); row(3, 64, 17, 85, 17, (x, z) => put('furn_table', x, z, 1.1));
      globe(64, 6, 0.4, 1.1 + 0.6); globe(85, 17, 0.45, 1.7); scope(74.5, 6, 0.6); orrery(74.5, 12, 1.4);
      for (const [x, z] of [[85, 6], [64, 17], [74.5, 17]]) { S.add(new THREE.ConeGeometry(0.3, 0.5, 8), '#e8d8a8', x, y + 1.35, z, 0, PI); S.add(new THREE.ConeGeometry(0.3, 0.5, 8), '#e8d8a8', x, y + 1.85, z); G.add(new THREE.SphereGeometry(0.08, 6, 4), '#9fe6ff', x, y + 1.55, z); }
      row(4, 62, 24.5, 87, 24.5, (x, z) => put('furn_cabinet', x, z, 1.1, PI)); put('prop_workbench', 87, 3, 6, -H);
      // Phòng ngủ khách ×3
      for (const [x, col] of [[3.5, '#8a3a5a'], [10.5, '#8a3a5a']]) { bed(x, 52, 0, col); put('furn_table_small', x + 2, 54, 0.6); }
      for (const [x, col] of [[18, '#2f5a8a'], [25, '#2f5a8a']]) bed(x, 52, 0, col);
      put('furn_rug', 7, 43, 1.8); put('furn_cabinet', 1, 40, 1.1, H); put('furn_lamp', 13, 33, 1.1); put('furn_rug', 21.5, 43, 1.8); put('furn_cabinet', 28, 40, 1.1, -H); put('furn_chair', 16, 33, 1, 0.6);
      bed(66, 52, 0, '#3a7a4a'); bed(74, 52, 0, '#3a7a4a'); put('furn_rug', 70, 43, 2); put('furn_armchair', 78, 34, 1.1, -H); put('furn_lamp', 62, 33, 1.1);
      // Phòng Pha Chế (điểm neo lớp 'potion'): vạc + bàn
      for (const [x, z] of [[34, 47], [40, 47], [49, 47], [55, 47], [37, 52], [52, 52]]) cauldron(x, z); row(3, 31, 54.4, 58, 54.4, (x, z) => { put('furn_shelf_big', x, z, 1.8, PI); put('prop_urn', x - 0.6, z - 0.2, 2, 0, 0.6); put('prop_urn', x + 0.6, z - 0.2, 2, 1, 0.6); });
      // Phòng Tự Học
      for (const x of [35, 44.5, 54]) { put('furn_table', x, 6, 1.1); put('furn_chair', x - 1.6, 6, 1, H); put('furn_chair', x + 1.6, 6, 1, -H); put('furn_lamp', x, 1.2, 1.0); }
      break;
    }
    case 3: {
      // PHÒNG HIỆU TRƯỞNG: bàn lớn, ghế bành, kệ sách tường tây (có giá xoay bí mật), chân dung, quả cầu, sào chim
      put('furn_table_long', 76, 9, 1.4, 0); put('furn_armchair', 76, 5.6, 1.2, 0); put('furn_chair', 74.5, 12.6, 1, PI); put('furn_chair', 77.5, 12.6, 1, PI);
      for (const z of [1.8, 10, 14.2, 18.4]) tallShelf(60.6, z, H, 3, 1.6);
      put('furn_rug', 76, 11, 2.6); globe(84, 4, 0.6, 1.2); orrery(68, 18, 1.2); put('furn_couch', 76, 23, 1.2, PI); put('furn_lamp', 87, 1.5, 1.3); put('furn_lamp', 66, 1.5, 1.3);
      for (const x of [66, 71, 81, 86]) put('furn_picture', x, 0.3, 1.8, 0, 5.2);
      S.add(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 5), GOLD, 84, y + 1.1, 12); S.add(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 4), GOLD, 84, y + 2.2, 12, 0, 0, H); G.add(new THREE.SphereGeometry(0.28, 8, 6), '#ff7a3a', 84.3, y + 2.5, 12);   // sào chim lửa
      // Phòng Gương Bí Mật
      for (let i = 0; i < 8; i++) G.add(new THREE.ConeGeometry(0.08, 0.24, 5), '#ffc35a', 50 + (i % 4) * 2.6, y + 0.9 + (i > 3 ? 0.4 : 0), 6 + (i > 3 ? 3 : 0));
      put('furn_rug', 54, 6, 1.8);
      // PHÒNG THIÊN VĂN: trần sao, mô hình hệ mặt trời, kính thiên văn lớn, bản đồ sao
      for (let i = 0; i < 89; i++) G.add(new THREE.OctahedronGeometry(0.06 + (i % 5) * 0.025), i % 7 ? '#ffffff' : '#ffe3a0', 1 + (i * 37 % 27), y + 7.5, 1 + (i * 53 % 23));
      orrery(14.5, 12.5, 2.4); scope(4, 4, PI / 4, 3.4); scope(25, 21, -PI * 0.75, 3.4);
      row(3, 6, 24.6, 24, 24.6, (x, z) => put('furn_picture', x, z, 2.4, PI, 4.6)); put('furn_table_round', 23, 5, 1); put('furn_book_set', 23, 5, 1.6, 0, 1.0);
      // 4 PHÒNG NHÀ TỨ LINH (điểm neo 'house_*'): cờ màu nhà, lò sưởi, sofa
      for (const [id, x0, x1] of [['hLong', 0, 14], ['hLan', 14, 29], ['hQuy', 60, 70], ['hPhung', 70, 80]]) {
        const [col] = HOUSE[id], cx = (x0 + x1) / 2;
        banner(cx, 54.6, PI, col, 4.6); fireplace(x0 + 0.9, 46, H, 3.6);
        put('furn_couch', cx, 42, 1, PI); put('furn_armchair', cx - 2.4, 48, 1, H * 0.5); put('furn_armchair', cx + 2.4, 48, 1, -H * 0.5); put('furn_rug', cx, 46, 1.6);
        G.add(new THREE.OctahedronGeometry(0.5), col, cx, y + 4.6, 54.2, 0, 0, 0, 1, 1.4, 0.3);
      }
      // Phòng Chờ Tầng 3
      put('furn_couch', 38.5, 3, 1.2); put('plant_qt_plant', 31, 2, 1.2); put('plant_qt_plant', 46, 2, 1.2, 2);
      break;
    }
    case 4: {   // đỉnh tháp chính
      scope(86.5, 24.5, -PI * 0.8, 3); put('furn_stool', 85, 30, 1.1);
      break;
    }
  }
  return { kit };
}
