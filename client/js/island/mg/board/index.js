// mg/board/index.js — NHÓM 1: cờ vua, cờ caro, cờ vây, Rubik (đăng ký vào ctx.miniGames; khung chung ở ../host.js)
import { startRubik } from './rubik.js';
import { startChess, chessSpot } from './chess.js';
import { startCaro } from './caro.js';
import { startGo } from './go.js';
export function register(ctx) {
  const G = ctx.miniGames = ctx.miniGames || {};
  G.rubik = { name: '🧊 Phòng Rubik 3D', radius: 8, start: startRubik };
  G.caro = { name: '❌⭕ Cờ caro khổng lồ', radius: 10, start: startCaro };   // bàn 13 × 13 (Fibonacci) rộng 14,6 m → khu chơi 8·√φ ≈ 10 m (góc bàn không chạm tường/cột đèn)
  G.go = { name: '⚫⚪ Cờ vây 9 × 9', radius: 10, start: startGo };   // bàn 9 ô × φ m ≈ 13 m
  G.chess = { name: '♟️ Cờ vua khổng lồ', radius: 15, spot: chessSpot, start: startChess };   // bàn 8 ô × φ² ≈ 21 m (Fibonacci)
}
