// config.js — Thông số của Đảo Rubik 3D. Muốn chỉnh tốc độ, màu, số lượng cây… sửa ở đây.
const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && innerWidth < 1100);

export const CFG = {
  isMobile,
  seed: 7,
  quality: {
    maxPixelRatio: isMobile ? 1.5 : 2,  // điện thoại tối đa 1,5 (màn 2–3x mà vẽ đủ điểm ảnh rất nặng); máy tính 2
    shadowSize: isMobile ? 1024 : 2048,
    shadowRange: isMobile ? 34 : 40,   // điện thoại 34 m (Fibonacci): ít vật đổ bóng hơn, bóng nét hơn
    msaa: isMobile ? 2 : 4,             // khử răng cưa MSAA (điện thoại 2x, máy tính 4x) trong render target hậu kỳ (máy yếu: tự giảm 2 → 0)
    bloom: !isMobile, bloomStrength: 0.18, bloomRadius: 0.382, bloomThreshold: 0.92,  // bloom tinh tế: chỉ đèn/mặt trời toả, bán kính 1/φ² (điện thoại tắt cho mượt)
    vignette: 0.146,                    // 1/φ⁴: viền tối rất nhẹ, không làm mờ
    exposure: 0.86, saturation: 1.14, contrast: 1.1, warmth: 0.015,   // chỉnh màu hậu kỳ (ấm, tươi nhẹ)
    anisotropy: isMobile ? 8 : 16,      // lọc dị hướng cho texture (chữ biển, nền) nét khi nhìn xiên
    lowFps: 40, highFps: 57,            // tự giảm / tăng chất lượng theo FPS
  },
  time: { dayLengthSec: 480, startHour: 10.5 },
  island: { radius: 70, size: 220, segments: isMobile ? 110 : 150, waterLevel: 0 },
  counts: { trees: isMobile ? 140 : 220, pines: isMobile ? 70 : 110, rocks: 90, grass: isMobile ? 7000 : 14000 },
  clearings: [[0, 10, 16], [0, -6, 13]], // [x, z, bán kính]: chỗ không mọc cây/cỏ (bãi xuất phát, đền)
  player: { walk: 5.5, run: 9.5, jump: 7.5, gravity: 22 },
  // tầm nhìn: sương bắt đầu 144 m (Fibonacci), đặc hẳn ở 144·φ^1,5 ≈ 296 m = mặt cắt xa của camera (vật khuất hẳn trong sương thì không vẽ)
  view: { fogNear: 144, far: 296 },
  camera: { distance: 15, height: 2.6, pitch: 0.62, follow: 7 },   // camera xa + cao: nhân vật nhỏ, thấy toàn cảnh
  toon: { steps: [0.42, 0.62, 0.82, 1.0] },   // 4 bậc sáng mềm của MeshToonMaterial (bóng không quá tối)
  outline: { thickness: 0.022, ref: 13, color: '#3d2b3f' },   // viền mảnh nâu tím; dày theo khoảng cách (chuẩn ở 13 m) → đều nét trên màn hình
};
