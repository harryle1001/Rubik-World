// config.js — Thông số của Đảo Rubik 3D. Muốn chỉnh tốc độ, màu, số lượng cây… sửa ở đây.
const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && innerWidth < 1100);

export const CFG = {
  isMobile,
  seed: 7,
  quality: {
    maxPixelRatio: isMobile ? 1.5 : 2,  // giới hạn pixelRatio (máy tính 2: sắc nét)
    shadowSize: isMobile ? 1024 : 2048,
    shadowRange: 40,
    msaa: isMobile ? 2 : 4,             // khử răng cưa MSAA trong hậu kỳ (GPU điện thoại dạng tile: 2x rẻ)
    bloom: !isMobile, bloomStrength: 0.22, bloomRadius: 0.45, bloomThreshold: 0.9,   // điện thoại: tắt bloom cho mượt
    vignette: 0.2,
    exposure: 0.92, saturation: 1.04, contrast: 1.06, warmth: 0.015,   // chỉnh màu hậu kỳ (ấm, tươi nhẹ)
    lowFps: 40, highFps: 57,            // tự giảm / tăng chất lượng theo FPS
  },
  time: { dayLengthSec: 480, startHour: 10.5 },
  island: { radius: 70, size: 220, segments: isMobile ? 110 : 150, waterLevel: 0 },
  counts: { trees: isMobile ? 140 : 220, pines: isMobile ? 70 : 110, rocks: 90, grass: isMobile ? 7000 : 14000 },
  clearings: [[0, 10, 16], [0, -6, 13]], // [x, z, bán kính]: chỗ không mọc cây/cỏ (bãi xuất phát, đền)
  player: { walk: 5.5, run: 9.5, jump: 7.5, gravity: 22 },
  camera: { distance: 15, height: 2.6, pitch: 0.62, follow: 7 },   // camera xa + cao: nhân vật nhỏ, thấy toàn cảnh
  toon: { steps: [0.42, 0.62, 0.82, 1.0] },   // 4 bậc sáng mềm của MeshToonMaterial (bóng không quá tối)
  outline: { thickness: 0.022, color: '#3d2b3f' },   // viền mảnh, nâu tím đậm (không đen thuần)
};
