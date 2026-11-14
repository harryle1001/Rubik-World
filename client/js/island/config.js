// config.js — Thông số của Đảo Rubik 3D. Muốn chỉnh tốc độ, màu, số lượng cây… sửa ở đây.
const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && innerWidth < 1100);

export const CFG = {
  isMobile,
  seed: 7,
  quality: {
    maxPixelRatio: 1.5,                 // giới hạn pixelRatio
    shadowSize: isMobile ? 1024 : 2048,
    shadowRange: 40,
    bloom: true, bloomStrength: 0.35, bloomRadius: 0.5, bloomThreshold: 0.82,
    vignette: 0.35,
    lowFps: 40, highFps: 57,            // tự giảm / tăng chất lượng theo FPS
  },
  time: { dayLengthSec: 480, startHour: 15.5 },
  island: { radius: 70, size: 220, segments: isMobile ? 110 : 150, waterLevel: 0 },
  counts: { trees: isMobile ? 140 : 220, pines: isMobile ? 70 : 110, rocks: 90, grass: isMobile ? 7000 : 14000 },
  clearings: [[0, 10, 16], [0, -6, 13]], // [x, z, bán kính]: chỗ không mọc cây/cỏ (bãi xuất phát, đền)
  player: { walk: 5.5, run: 9.5, jump: 7.5, gravity: 22 },
  camera: { distance: 8, height: 2.4, pitch: 0.35, follow: 7 },
  toon: { steps: [0.35, 0.7, 1.0] },   // 3 bậc sáng của MeshToonMaterial
  outline: { thickness: 0.035, color: '#1b1626' },
};
