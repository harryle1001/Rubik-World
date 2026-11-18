// tools/quality-sim.mjs — Mô phỏng bộ chất lượng tự động trên "điện thoại tầm trung" giả lập (Node, không cần trình duyệt).
// Chạy: node tools/quality-sim.mjs
// Mô hình máy: màn 390×844, 60 Hz; GPU ms = bóng đổ(mức) + Mpx × chi phí/Mpx(mức); CPU 9 ms; khung = max(CPU, GPU),
// cảnh nặng nhẹ theo hướng camera (±22 %, chu kỳ 21 s) + nhiễu 6 % + 2 % khung khựng (biên dịch shader, nạp model).
// So sánh bộ cũ (ocean.js trước: xét mỗi 2 s, < 40 hạ mức, > 57 ba lần liên tiếp tăng mức, không có độ phân giải động)
// với autoq.js (mỗi 0,5 s, trung vị, độ phân giải động, vùng trễ 50–57, chờ tăng nhân đôi khi vừa tăng đã hụt).
import { createAutoQ, SK } from '../client/js/island/autoq.js';
const PRL = [1.5, 1.15, 1.0, 0.85], SH = [4, 4, 2, 0], CPX = [40, 40, 30, 28];   // điện thoại: MSAA 2× ở mức 0–1
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const frameMs = (L, pr, t, gpuK) => {
  const mpx = 390 * 844 * pr * pr / 1e6, load = 1 + 0.22 * Math.sin(t * 2 * Math.PI / 21);
  return Math.max(9, (SH[L] + mpx * CPX[L]) * load * gpuK) * (1 + (rnd() - 0.5) * 0.12) * (rnd() < 0.02 ? 4 : 1);
};
function run(kind, gpuK, mode = 'auto', T = 180) {
  let L = 1, k = 0, changes = 0, lvl = 0, late = 0, good = 0, n = 0, sum = 0; const trace = [];
  const aq = createAutoQ({ low: 50, high: 57, prl: PRL }); aq.q.level = 1; if (mode !== 'auto') aq.setMode(mode);
  let acc = [], oldT = 0, oldGood = 0; if (kind === 'old' && mode === 'fast') L = 2;   // bộ cũ: ⚡ Mượt = khoá mức 2
  for (let t = 0; t < T; ) {
    const pr = kind === 'new' ? aq.pr() : PRL[L], ms = frameMs(kind === 'new' ? aq.q.level : L, pr, t, gpuK), fps = Math.min(60, 1000 / ms);
    acc.push(ms); t += ms / 1000; n++; sum += fps; if (fps >= 50) good++;
    if (kind === 'new' && acc.reduce((a, b) => a + b, 0) >= 500) {
      acc.sort((a, b) => a - b); const f = Math.min(60, 1000 / acc[acc.length >> 1]); acc = [];
      const L0 = aq.q.level; if (aq.feed(f, t)) { changes++; if (aq.q.level !== L0) lvl++; if (t > T / 2) late++; trace.push(`${t.toFixed(0)}s→L${aq.q.level}/k${aq.q.k}`); }
    }
    if (kind === 'old' && mode === 'auto' && t - oldT >= 2) {
      const f = Math.min(60, acc.length / (t - oldT)); acc = []; oldT = t; const was = L;
      if (f < 40 && L < 3) { L = Math.min(3, L + (f < 40 / 1.618 ? 2 : 1)); oldGood = 0; }
      else if (f > 57 && L > 0 && L < 3 && ++oldGood >= 3) { L--; oldGood = 0; }
      if (L !== was) { changes++; lvl++; if (t > T / 2) late++; trace.push(`${t.toFixed(0)}s→L${L}`); }
    }
  }
  const st = kind === 'new' ? `L${aq.q.level} pr ${aq.pr().toFixed(2)}` : `L${L} pr ${PRL[L].toFixed(2)}`;
  return { bộ: kind, máy: gpuK, mode, 'FPS TB': +(sum / n).toFixed(1), '% khung ≥50': Math.round(good / n * 100), 'đổi mức': lvl, 'đổi độ phân giải': changes - lvl, 'đổi ở 90 s sau': late, 'cuối': st, 'đầu vết': trace.slice(0, 6).join(' ') };
}
const rows = [];
for (const g of [0.8, 1, 1.3, 1.7]) for (const kind of ['old', 'new']) rows.push(run(kind, g));
for (const g of [1, 1.7, 2.2]) for (const kind of ['old', 'new']) rows.push(run(kind, g, 'fast'));
console.table(rows);
