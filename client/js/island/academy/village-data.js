// academy/village-data.js — "NHÀ GỢI Ý" 1 chạm + THỬ THÁCH KIẾN TRÚC (diện tích, chu vi, đối xứng, tỷ lệ vàng) của Làng Phù Thuỷ Nhỏ.
// Mảnh = [id, i, j, k, r, c] (xem village-pieces.js). Lô 6 × 10 ô; mặt tiền (cửa) quay về −z (phía hồ, nhìn lên lâu đài).
import { PHI } from '../layout.js';
import { VILLAGE } from './plan.js';
const NI = VILLAGE.ni, NJ = VILLAGE.nj;

// hộp nhà chữ nhật [i0..i1] × [j0..j1], fl tầng; cửa giữa mặt trước; cửa sổ xen kẽ; mái: 'gable' (2 mái dốc, rộng 2 ô) | 'point'
function house(P, { i0, i1, j0, j1, fl = 1, wall = 'wall', top = 'wallw', roof = 'point', door = Math.floor((i0 + i1) / 2) }) {
  for (let k = 0; k < fl; k++) {
    const w = k ? top : wall;
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) P.push(['floor', i, j, k, 0, 0]);
    for (let i = i0; i <= i1; i++) {
      P.push([k === 0 && i === door ? 'door' : (k > 0 && (i - i0) % 2 === 0) ? 'window' : w, i, j0, k, 2, 0]);
      P.push([(i - i0) % 2 === 1 ? 'window' : w, i, j1, k, 0, 0]);
    }
    for (let j = j0; j <= j1; j++) { const win = (j - j0) % 2 === 1; P.push([win ? 'window' : w, i0, j, k, 3, 0]); P.push([win ? 'window' : w, i1, j, k, 1, 0]); }
  }
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++)
    P.push(roof === 'gable' && i1 - i0 === 1 ? ['roof', i, j, fl, i === i0 ? 3 : 1, 0] : ['roofp', i, j, fl, 0, 0]);
  return P;
}
const garden = P => {
  for (let i = 0; i < NI; i++) P.push(['fence', i, 0, 0, 2, 0]);
  for (let j = 0; j < NJ; j++) { P.push(['fence', 0, j, 0, 3, 0]); P.push(['fence', NI - 1, j, 0, 1, 0]); }
  P.push(['tree', 0, NJ - 1, 0, 0, 0], ['tree', NI - 1, NJ - 1, 0, 0, 0], ['lamp', 1, 0, 0, 0, 0], ['lamp', NI - 2, 0, 0, 0, 0], ['bush', 0, 1, 0, 0, 0], ['bush', NI - 1, 1, 0, 0, 0]);
  return P;
};
export const TEMPLATES = [
  { id: 'cozy', name: 'Nhà nhỏ ấm cúng', icon: '🏡', make: () => { const P = garden([]); house(P, { i0: 2, i1: 3, j0: 3, j1: 5, roof: 'gable' }); P.push(['table', 2, 4, 0, 0, 0], ['chair', 3, 4, 0, 1, 0], ['shelf', 2, 5, 0, 2, 0]); return P; } },
  { id: 'golden', name: 'Nhà tỷ lệ vàng 3 × 5', icon: '✨', make: () => { const P = garden([]); house(P, { i0: 1, i1: 3, j0: 2, j1: 6, fl: 2, door: 2 }); P.push(['sofa', 1, 3, 0, 1, 0], ['shelf', 3, 6, 0, 2, 0], ['table', 2, 4, 0, 0, 0]); return P; } },
  { id: 'tower', name: 'Lâu đài tháp phép', icon: '🏰', make: () => { const P = garden([]); house(P, { i0: 2, i1: 3, j0: 3, j1: 6, fl: 2, roof: 'gable' }); for (const [i, j] of [[1, 2], [4, 2]]) for (let k = 0; k < 3; k++) P.push(['tower', i, j, k, 0, 0]); P.push(['stairs', 1, 5, 0, 0, 0]); return P; } },
  { id: 'rubik', name: 'Nhà khối Rubik', icon: '🧊', make: () => { const P = garden([]); for (let k = 0; k < 3; k++) for (let i = 2; i <= 4; i++) for (let j = 3; j <= 5; j++) if (k < 2 || (i + j) % 2 === 0) if (!(k === 0 && i === 3 && j === 3)) P.push(['cube', i, j, k, 0, (i + j + k) % 6]); return P; } },
];

// ---------- phân tích công trình cho thử thách ----------
// nền tầng trệt → hình chữ nhật đặc? trả { w, d, area, per } (w theo i, d theo j) hoặc null
export function floorRect(P) {
  const cells = P.filter(p => p[0] === 'floor' && p[3] === 0); if (!cells.length) return null;
  const I = cells.map(p => p[1]), J = cells.map(p => p[2]), i0 = Math.min(...I), i1 = Math.max(...I), j0 = Math.min(...J), j1 = Math.max(...J);
  const w = i1 - i0 + 1, d = j1 - j0 + 1, set = new Set(cells.map(p => p[1] + ',' + p[2]));
  return { i0, i1, j0, j1, w, d, area: set.size, per: 2 * (w + d), solid: set.size === w * d };
}
const EDGE = new Set(['wall', 'wallw', 'door', 'window', 'fence']);
// tường (tầng trệt) phủ kín chu vi của nền chữ nhật?
export function walled(P, R) {
  const has = new Set(P.filter(p => EDGE.has(p[0]) && p[3] === 0).map(p => p[1] + ',' + p[2] + ',' + p[4]));
  for (let i = R.i0; i <= R.i1; i++) if (!has.has(`${i},${R.j0},2`) || !has.has(`${i},${R.j1},0`)) return false;
  for (let j = R.j0; j <= R.j1; j++) if (!has.has(`${R.i0},${j},3`) || !has.has(`${R.i1},${j},1`)) return false;
  return true;
}
// đối xứng gương qua trục giữa lô (i ↔ NI−1−i): mọi mảnh có mảnh "soi gương" cùng loại
const mirR = r => (r === 1 ? 3 : r === 3 ? 1 : r);
export function symmetric(P) {
  if (P.length < 8) return false;
  const key = p => p[0] + ',' + p[1] + ',' + p[2] + ',' + p[3] + (EDGE.has(p[0]) ? ',' + p[4] : '');
  const all = new Set(P.map(key));
  return P.every(p => all.has(key([p[0], NI - 1 - p[1], p[2], p[3], mirR(p[4])])));
}
// nền chữ nhật có tỷ lệ cạnh dài / cạnh ngắn gần φ (2 số Fibonacci liền nhau: 2×3, 3×5, 5×8)
export const golden = R => R && R.solid && Math.min(R.w, R.d) >= 2 && Math.abs(Math.max(R.w, R.d) / Math.min(R.w, R.d) - PHI) < 0.13;

const DIMS = [[2, 3], [3, 4], [2, 5], [3, 5], [4, 4], [2, 4], [3, 3], [4, 5]];
/** thử thách: { id, icon, title, text, check(P) → true/false, reward } — 'area' có số đo ngẫu nhiên (seed) */
export function challenges(seed = 0) {
  const [a, b] = DIMS[seed % DIMS.length], A = a * b, Pm = 2 * (a + b);
  return [
    { id: 'area', icon: '📐', reward: 13, title: `Diện tích ${A} ô, chu vi ${Pm} cạnh`, text: `Lát <b>nền</b> tầng trệt thành hình chữ nhật có <b>diện tích ${A} ô vuông</b> và <b>chu vi ${Pm} cạnh ô</b>. Gợi ý: tìm 2 số có tích ${A} và tổng ${Pm / 2}.`, check: P => { const R = floorRect(P); return !!R && R.solid && R.area === A && R.per === Pm; } },
    { id: 'wall', icon: '🧱', reward: 21, title: 'Tường bao đủ chu vi', text: 'Dựng <b>tường/cửa/cửa sổ</b> phủ kín <b>chu vi</b> nền chữ nhật tầng trệt. Số mảnh tường cần đúng bằng chu vi = 2 × (dài + rộng).', check: P => { const R = floorRect(P); return !!R && R.solid && walled(P, R); } },
    { id: 'sym', icon: '🦋', reward: 21, title: 'Ngôi nhà đối xứng', text: 'Xây sao cho lô đất <b>đối xứng gương</b> qua đường giữa (trái ↔ phải giống hệt nhau), ít nhất 8 mảnh. Con bướm, lá cây, khuôn mặt cũng đối xứng đấy!', check: symmetric },
    { id: 'phi', icon: '✨', reward: 34, title: 'Tỷ lệ vàng φ ≈ 1,618', text: 'Lát nền chữ nhật có <b>dài : rộng ≈ 1,618</b> — dùng 2 số <b>Fibonacci</b> liền nhau: 2 × 3, <b>3 × 5</b> hay 5 × 8. Đền Parthenon và nhiều toà nhà đẹp dùng tỷ lệ này.', check: P => golden(floorRect(P)) },
  ];
}
