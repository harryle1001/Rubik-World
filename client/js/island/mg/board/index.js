// mg/board/index.js — NHÓM 1: cờ vua, cờ caro, cờ vây, Rubik (đăng ký vào ctx.miniGames; khung chung ở ../host.js)
import { startRubik } from './rubik.js';
import { startChess, chessSpot } from './chess.js';
export function register(ctx) {
  const G = ctx.miniGames = ctx.miniGames || {};
  G.rubik = { name: '🧊 Phòng Rubik 3D', radius: 8, start: startRubik };
  G.chess = { name: '♟️ Cờ vua khổng lồ', radius: 15, spot: chessSpot, start: startChess };   // bàn 8 ô × φ² ≈ 21 m (Fibonacci)
}
