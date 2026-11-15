// mg/board/index.js — NHÓM 1: cờ vua, cờ caro, cờ vây, Rubik (đăng ký vào ctx.miniGames; khung chung ở ../host.js)
import { startRubik } from './rubik.js';
export function register(ctx) {
  const G = ctx.miniGames = ctx.miniGames || {};
  G.rubik = { name: '🧊 Phòng Rubik 3D', radius: 8, start: startRubik };
}
// chess.js (cờ vua khổng lồ) đã viết nhưng CHƯA kiểm thử → chưa đăng ký, cửa cờ vua vẫn mở bản 2D. Khi xong: G.chess = { name: '♟️ Cờ vua khổng lồ', radius: 15, spot: chessSpot, start: startChess } (cần thêm host.findSpot)
