// motion.js — Toán chuyển động mượt dùng chung (không tạo đối tượng mới mỗi khung hình).
//   - smoothDt: làm mượt dt khi FPS dao động (giới hạn bước).
//   - damp / dampAngle: lò xo giảm chấn tới hạn (critically damped, kiểu SmoothDamp) cho số, góc, Vector3.
// Thời gian đáp ứng chọn theo φ: 1/φ³ ≈ 0,236 s, 1/φ⁴ ≈ 0,146 s, 1/φ⁵ ≈ 0,090 s…
import { PHI } from './layout.js';

export const T = { fast: 1 / PHI ** 5, quick: 1 / PHI ** 4, soft: 1 / PHI ** 3, slow: 1 / PHI ** 2, lazy: 1 / PHI };
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
export { wrap as wrapAngle };

// dt ổn định: lọc rung nhỏ của đồng hồ (±5 ms quanh nhịp màn hình) để chuyển động đều; khung trễ thật (rớt FPS) thì dùng đúng dt
// để thế giới không chậm lại so với thời gian thật; giới hạn bước ≤ 1/20 s (máy quá chậm thì chậm lại thay vì nhảy cóc).
export function createDt() {
  let s = 1 / 60;
  return raw => { raw = Math.min(Math.max(raw, 1 / 240), 1 / 20); s = Math.abs(raw - s) > 0.005 ? raw : s + (raw - s) * 0.3; return s; };
}

// Lò xo giảm chấn tới hạn: trả về giá trị mới, cập nhật vận tốc st.v (st = { v: 0 }). st: đối tượng giữ trạng thái.
export function damp(cur, target, st, smooth, dt, maxSpeed = Infinity) {
  const w = 2 / Math.max(1e-4, smooth), x = w * dt, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  let ch = cur - target; const mc = maxSpeed * smooth; if (ch > mc) ch = mc; else if (ch < -mc) ch = -mc;
  const tg = cur - ch, tmp = (st.v + w * ch) * dt; st.v = (st.v - w * tmp) * e;
  let out = tg + (ch + tmp) * e;
  if ((target - cur > 0) === (out > target)) { out = target; st.v = (out - target) / dt; }
  return out;
}
export function dampAngle(cur, target, st, smooth, dt, maxSpeed) { return damp(cur, cur + wrap(target - cur), st, smooth, dt, maxSpeed); }

// Vector3 (vel: Vector3 giữ vận tốc) — ghi đè cur
export function dampV3(cur, target, vel, smooth, dt) {
  const w = 2 / Math.max(1e-4, smooth), x = w * dt, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  for (const k of ['x', 'y', 'z']) {
    const ch = cur[k] - target[k], tmp = (vel[k] + w * ch) * dt; vel[k] = (vel[k] - w * tmp) * e; cur[k] = target[k] + (ch + tmp) * e;
  }
  return cur;
}
// hệ số làm mượt hàm mũ không phụ thuộc FPS
export const ease = (rate, dt) => 1 - Math.exp(-rate * dt);
