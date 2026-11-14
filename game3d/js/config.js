// config.js — MỌI THÔNG SỐ CỦA GAME nằm ở đây.
// Muốn đổi tốc độ, màu, số lượng cây, vị trí công trình… chỉ cần sửa file này.
// THÊM KHU MỚI: thêm 1 dòng vào mảng AREAS bên dưới (vòng sáng, đường đi, đèn, biển chỉ đường tự tạo theo).

const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && innerWidth < 1100);

export const CONFIG = {
  isMobile,
  seed: 20261114,

  // ---------- Thế giới ----------
  world: {
    size: 280,            // cạnh bản đồ (m)
    segments: isMobile ? 150 : 190, // độ chi tiết địa hình
    playRadius: 122,      // bán kính được đi
    plazaRadius: 13,      // quảng trường giữa
    waterLevel: -0.6,
    pathWidth: 3.4,
  },

  // Sông: các điểm (x, z) nối nhau; đường đi cắt sông sẽ tự có cầu
  river: { width: 6.5, bank: 5, depth: 2.4, points: [[-150, 38], [-90, 50], [-40, 42], [5, 50], [50, 40], [95, 52], [150, 44]] },

  // ---------- Các khu (công trình + mini game) ----------
  // style: kiểu kiến trúc (nordic | pagoda | castle | greenhouse | observatory | stilt | sundial | null = chỉ có vòng sáng)
  // game : mini game trong buildings.js (math | history | english | biology | planets | geo | clock)
  // h    : độ cao nền khu (m)
  AREAS: [
    { id: 'nordic',      name: 'Nhà Gỗ Bắc Âu',     sub: 'Xưởng Mộc Toán Học',      style: 'nordic',      game: 'math',    x: -56, z: -24 },
    { id: 'pagoda',      name: 'Đình Làng Việt',    sub: 'Câu Đố Lịch Sử',          style: 'pagoda',      game: 'history', x: 0,   z: -64 },
    { id: 'castle',      name: 'Lâu Đài Hiệp Sĩ',   sub: 'Thử Thách Tiếng Anh',     style: 'castle',      game: 'english', x: 60,  z: -46 },
    { id: 'greenhouse',  name: 'Nhà Kính Xanh',     sub: 'Phòng Thí Nghiệm Cây',    style: 'greenhouse',  game: 'biology', x: -64, z: 18 },
    { id: 'sundial',     name: 'Đồng Hồ Mặt Trời',  sub: 'Học Xem Giờ',             style: 'sundial',     game: 'clock',   x: 58,  z: 8 },
    { id: 'stilt',       name: 'Nhà Sàn Tây Bắc',   sub: 'Khám Phá Địa Lý',         style: 'stilt',       game: 'geo',     x: -42, z: 84 },
    { id: 'observatory', name: 'Tháp Thiên Văn',    sub: 'Hệ Mặt Trời',             style: 'observatory', game: 'planets', x: 40,  z: 86, h: 4 },
  ],

  // ---------- Nhân vật & camera ----------
  player: {
    walkSpeed: 6.0,       // = 1.5 lần tốc độ cũ (4.0)
    runMul: 1.7,          // nhân khi giữ nút Chạy / Shift
    bikeMul: 2.5,         // nhân khi đi xe đạp
    turnSpeed: 12,
    radius: 0.45,
    stepUp: 0.55,
    spawn: [0, 9],
  },
  camera: { distance: 9, minDist: 4, maxDist: 16, height: 2.2, pitch: 0.38, follow: 8, fov: 60 },

  // ---------- Cây cối ----------
  trees: {
    // số lượng mỗi loại (điện thoại tự giảm 25%)
    counts: { pine: 80, maple: 50, bamboo: 30, palm: 20, sakura: 34, bush: 90 },
    chopDistance: 3.0,
    respawnSec: 90,       // thời gian cây mọc lại
    drops: { pine: ['wood', 3], maple: ['wood', 4], bamboo: ['bamboo', 4], palm: ['coconut', 2], sakura: ['wood', 3], bush: ['wood', 1] },
  },
  grass: { count: isMobile ? 9000 : 18000, chunk: 36, viewDist: isMobile ? 48 : 70 },
  flowers: { count: isMobile ? 1400 : 2400, viewDist: isMobile ? 60 : 85 },
  rocks: { count: 110 },

  // ---------- Đồ vật ----------
  props: {
    lampSpacing: 15,      // khoảng cách đèn đường
    benchSpacing: 34,
    bikes: [[6, 16], [-52, -12], [50, 0], [-6, 70]], // vị trí xe đạp đỗ
  },
  // Hàng rào: mỗi dòng là một đường gấp khúc [[x,z],...]
  fences: [
    [[-74, 8], [-74, 30], [-52, 30]],
    [[-28, 72], [-28, 96], [-56, 96]],
    [[70, -30], [80, -30], [80, -62]],
  ],

  // ---------- Thời gian trong ngày ----------
  time: { dayLengthSec: 600, startHour: 16.6 }, // 10 phút = 1 ngày, bắt đầu lúc nắng chiều

  // ---------- Bảng màu (ấm, hài hoà) ----------
  colors: {
    grassA: '#79b04a', grassB: '#b2cc5c', grassDry: '#c9b765', path: '#d8bf8c', sand: '#e2cf9c', rock: '#8f8a80', cliff: '#a39a86',
    water: '#3f9fb0', waterDeep: '#1f5f7a', foam: '#e8f6f0',
    plaza: '#efe6d2', plazaRing: '#d6c6a2',
    flowers: ['#ff8fa3', '#ffd166', '#f7f3e3', '#c39bff', '#ff9f5a', '#ff6b6b'],
  },

  // ---------- Xây dựng: các loại khối và giá đổi ----------
  // cost: { wood | bamboo: số lượng }
  BLOCKS: [
    { id: 'cube',   name: 'Khối vuông',  icon: '🟫', cost: { wood: 2 } },
    { id: 'floor',  name: 'Tấm sàn',     icon: '▭',  cost: { wood: 1 } },
    { id: 'wall',   name: 'Tường',       icon: '🧱', cost: { wood: 2 } },
    { id: 'slope',  name: 'Mái nghiêng', icon: '◢',  cost: { wood: 2 } },
    { id: 'pillar', name: 'Cột',         icon: '┃',  cost: { wood: 1 } },
    { id: 'stairs', name: 'Cầu thang',   icon: '𝄜',  cost: { wood: 3 } },
    { id: 'door',   name: 'Cửa',         icon: '🚪', cost: { wood: 3 } },
    { id: 'fence',  name: 'Hàng rào',    icon: '⧺',  cost: { bamboo: 2 } },
  ],
  build: { reach: 2.2, maxBlocks: 1500 },

  // ---------- Hiệu năng ----------
  quality: {
    pixelRatio: isMobile ? 1.25 : 1.75,
    shadowSize: isMobile ? 1024 : 2048,
    shadowRange: isMobile ? 34 : 48, // bóng đổ chỉ tính quanh nhân vật
    farView: 300,
  },

  // Khoá lưu localStorage
  save: { inv: 'game3d.inventory.v1', blocks: 'game3d.blocks.v1', sound: 'game3d.sound' },
};

if (isMobile) for (const k in CONFIG.trees.counts) CONFIG.trees.counts[k] = Math.round(CONFIG.trees.counts[k] * 0.75);
