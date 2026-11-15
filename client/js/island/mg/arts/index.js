// mg/arts/index.js — Đăng ký mini game 3D nhóm 3 (Mỹ thuật & Âm nhạc · Thư viện · Đài thiên văn) vào ctx.miniGames.
// Khuôn chung (mg/host.js): ctx.miniGames[key] = { name, start(ctx, opts) → { update(dt), dispose() } }.
import { startArtMusic } from './art-music.js';
import { startLibrary } from './library.js';

export function register(ctx) {
  const G = ctx.miniGames = ctx.miniGames || {};
  G['art-music'] = { name: '🎨 Xưởng Mỹ thuật & Âm nhạc', group: 'arts', start: (c, o) => startArtMusic(c || ctx, o) };
  G['library'] = { name: '📚 Thư viện Hoàng gia', group: 'arts', start: (c, o) => startLibrary(c || ctx, o) };
  G['reader-books'] = G['royal-library'] = G['library'];   // cửa đọc sách / thư viện hoàng gia dùng chung thư viện 3D
  return G;
}
