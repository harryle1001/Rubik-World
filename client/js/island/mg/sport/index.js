// index.js — Nhóm 2 mini game 3D Thể thao: Olympics (5 môn), Arcade (Rubik Kart, ném rổ, bắn bóng phép tính), Câu cá (bờ + thuyền).
// Đăng ký vào ctx.miniGames theo khuôn chung (mg/host.js): { key: { name, start(ctx, opts) → { update(dt), dispose() } } }.
// Nếu chưa có host: ctx.playMini(key, opts) tự chạy game (update gọi ngay trước khi vẽ mỗi khung hình) — dùng để tự kiểm tra.
import { olympics } from './olympics.js';
import { arcade } from './arcade.js';
import { fishing } from './fishing.js';
import { races } from './races.js';
import { shots } from './shots.js';
import { balloon } from './balloon.js';

export function register(ctx) {
  const G = ctx.miniGames = ctx.miniGames || {};
  Object.assign(G, olympics, arcade, fishing, races, shots, balloon);
  if (!ctx.playMini) ctx.playMini = (key, opts = {}) => {
    const def = G[key]; if (!def) return null;
    if (ctx._mgCur) ctx._mgCur.stop();
    let last = performance.now(), live = true, game = null;
    const orig = ctx.post.render;
    const stop = () => { if (!live) return; live = false; try { game && game.dispose(); } catch (e) { console.error(e); } ctx.post.render = orig; ctx._mgCur = null; };
    ctx.post.render = () => { const t = performance.now(), dt = Math.min(0.05, (t - last) / 1000); last = t; if (live && game) game.update(dt); orig.call(ctx.post); };
    game = def.start(ctx, Object.assign({}, opts, { onExit: stop }));
    ctx._mgCur = { key, game, stop }; return game;
  };
  return G;
}
