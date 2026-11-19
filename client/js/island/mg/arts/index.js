// mg/arts/index.js — Đăng ký mini game 3D nhóm 3 (Mỹ thuật & Âm nhạc · Thư viện · Đài thiên văn) vào ctx.miniGames.
// Khuôn chung (mg/host.js): ctx.miniGames[key] = { name, start(ctx, opts) → { update(dt), dispose() } }.
import { startArtMusic } from './art-music.js';
import { startLibrary } from './library.js';
import { startTelescope } from './telescope.js';
import { startHall } from './hall.js';

export function register(ctx) {
  const G = ctx.miniGames = ctx.miniGames || {};
  // cửa Phòng nhạc / Vẽ tranh của trường 2D mở xưởng 3D (trước đây khoá 'art-music' không khớp cửa nào)
  G['art-music'] = { name: '🎨 Xưởng Mỹ thuật & Âm nhạc', group: 'arts', radius: 16, doors: [/^Phòng nhạc|Chị Mai · Phòng nhạc/, /Vẽ tranh/], start: (c, o) => startArtMusic(c || ctx, o) };
  G['library'] = { name: '📚 Thư viện Hoàng gia', group: 'arts', radius: 14, start: (c, o) => startLibrary(c || ctx, o) };
  G.music = G.art = G['art-music'];   // khoá cửa trong DOOR_KEYS (host.js): Phòng nhạc → music, Vẽ tranh → art
  G['reader-books'] = G['royal-library'] = G['library'];   // cửa đọc sách / thư viện hoàng gia dùng chung thư viện 3D
  G['telescope'] = { name: '🔭 Đài thiên văn', group: 'arts', radius: 8, start: startTelescope };   // cửa "Kính viễn vọng"
  G.reader = { name: '🎤 Hội trường Người Thầy Ánh Sáng', group: 'arts', radius: 13, start: startHall };   // cửa Hội trường: nghe kể chuyện danh nhân + 3 câu hỏi
  return G;
}
