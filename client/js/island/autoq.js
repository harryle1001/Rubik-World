// autoq.js — Bộ chọn chất lượng tự động (thuần logic, không đụng three → tools/quality-sim.mjs chạy thử được trên Node).
// Trạng thái = mức (0..3) + bậc độ phân giải động k: pixelRatio = prl[mức] × φ^(−k/8), k = 0..8 (1 → 1/φ).
// feed(fps, t) gọi mỗi 0,5 s với FPS trung vị (1 khung khựng do biên dịch shader/nạp model không làm hạ). Vùng trễ [low, high):
//  · hạ: 2 lần đo liên tiếp (1 s) < low → giảm độ phân giải một bậc; chạm đáy → hạ mức (giữ gần đúng pixelRatio, mức mới rẻ hơn);
//    < low/φ² (≈ 19 FPS) → hạ mức ngay.
//  · tăng: ≥ high liên tục upWait giây → tăng độ phân giải / lên mức. Vừa tăng mà < 5 s sau đã phải hạ → upWait ×2 (tối đa 89 s,
//    Fibonacci) → không dao động lên xuống; ổn định 34 s thì upWait về lại 3 s. Không lên lại từ mức 3 (bật bóng đổ = biên dịch lại mọi shader).
//  · chế độ: 'auto' (mức 0–3) · 'fast' ⚡ Mượt (mức 2–3) · 'pretty' ✨ Đẹp (khoá mức 0, đủ độ phân giải). Trả true khi có thay đổi.
export const SK = Array.from({ length: 9 }, (_, k) => 1.618 ** (-k / 8));

// step: số bậc độ phân giải hạ mỗi lần (điện thoại 2 → chạm đáy sau ~4 s thay vì ~8 s) · crit: FPS < low/crit → hạ mức ngay (điện thoại φ ≈ 31 FPS)
export function createAutoQ({ low = 50, high = 57, prl, step = 1, crit: CK = 2.618 }) {
  const q = { level: 0, k: 0, mode: 'auto' };
  let bad = 0, upT = 0, upWait = 3, lastUp = -1e9, stableT = 0, settle = 0;
  const pr = () => prl[q.level] * SK[q.k];
  const keepPR = L => { const want = pr() / prl[L]; let k = 0; for (let i = 0; i < SK.length; i++) if (Math.abs(SK[i] - want) < Math.abs(SK[k] - want)) k = i; return k; };
  const setLevel = L => { q.k = keepPR(L); q.level = L; };
  function feed(fps, t) {
    if (q.mode === 'pretty') return false;
    if (settle > 0) { settle--; return false; }   // lần đo ngay sau khi đổi: còn lẫn khung khựng do cấp phát lại
    if (fps < low) {
      upT = 0; stableT = 0; const crit = fps < low / CK;
      if (++bad < (crit ? 1 : 2)) return false; bad = 0;
      if (t - lastUp < 5) upWait = Math.min(89, upWait * 2);
      if (crit && q.level < 3) setLevel(q.level + 1);
      else if (q.k < SK.length - 1) q.k = Math.min(SK.length - 1, q.k + step);
      else if (q.level < 3) setLevel(q.level + 1);
      else return false;
      settle = 1; return true;
    }
    bad = 0; if ((stableT += 0.5) > 34) upWait = 3;
    if (fps < high) { upT = 0; return false; }   // vùng trễ: giữ nguyên
    if ((upT += 0.5) < upWait) return false; upT = 0;
    if (q.k > 0) q.k--;
    else if (q.level > (q.mode === 'fast' ? 2 : 0) && q.level < 3) setLevel(q.level - 1);
    else return false;
    lastUp = t; settle = 1; return true;
  }
  function setMode(m, start = 1) {
    const prev = q.mode; q.mode = m; bad = upT = 0; upWait = 3;
    if (m === 'pretty') { q.level = 0; q.k = 0; } else if (m === 'fast') { q.level = Math.max(2, q.level); q.k = 0; }
    else if (prev !== 'auto' && q.level !== 3) { q.level = start; q.k = 0; }   // rời Mượt/Đẹp: thử lại mức khởi đầu, chậm thì tự hạ
  }
  return { q, feed, setMode, pr, get upWait() { return upWait; } };
}
