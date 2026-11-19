// portal/i18n.js — Bộ chữ tiếng Anh cơ bản cho bản Mini: dịch nhãn HUD/nút/thông báo hay gặp bằng cách thay cụm từ trong DOM
// (MutationObserver, gom theo khung hình). Nội dung bài học/câu đố giữ tiếng Việt (ghi rõ trong mô tả cổng). Ngôn ngữ: ?lang=en|vi,
// lựa chọn đã lưu (localStorage 'mini.lang'), rồi ngôn ngữ trình duyệt (vi → Việt, còn lại → Anh).
const KEY = 'mini.lang';
const get = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
export let LANG = new URLSearchParams(location.search).get('lang') || get() || (/^vi/i.test(navigator.language || '') ? 'vi' : 'en');
if (LANG !== 'vi') LANG = 'en';
document.documentElement.lang = LANG;

// cụm dài trước, cụm ngắn sau (sắp theo độ dài khi dựng)
const EN = {
  'Dịch chuyển tới cổng Trường Rubik': 'Teleport to Rubik School gate', 'Đến trường': 'To school', 'Đảo Rubik 3D': 'Rubik Island 3D', 'Đảo Rubik': 'Rubik Island',
  'Trường Rubik': 'Rubik School', 'Mini game': 'Mini games', 'Ánh sáng': 'Light', 'Độ sáng': 'Brightness', 'Chạy': 'Run', 'Nhảy': 'Jump', 'Lặn': 'Dive', 'Nổi': 'Surface',
  'Tăng tốc': 'Boost', 'Xe đạp': 'Bike', 'Khinh khí cầu': 'Hot-air balloon', 'Chổi bay': 'Flying broom', 'Bản đồ': 'Map',
  'Bí mật': 'Secrets', 'Sổ bí mật': 'Secret book', 'Kho báu': 'Treasure', 'Nhiệm vụ': 'Quests', 'Đăng nhập': 'Sign in', 'Chơi lại': 'Play again', 'Thoát': 'Exit',
  'Hoàn thành!': 'Completed!', 'Kỷ lục mới!': 'New record!', 'Kỷ lục': 'Best', 'Gợi ý': 'Hint', 'Đóng': 'Close', 'Tiếp tục': 'Continue', 'Bỏ qua': 'Skip', 
  'Hiểu rồi!': 'Got it!', 'Mượt': 'Smooth', 'Tự động': 'Auto', 'Đẹp': 'Pretty', 'Dữ liệu': 'Data', 'Đang tải…': 'Loading…', 'Đang tải': 'Loading', 'Dựng thế giới': 'Building the world',
  'Chuẩn bị hình ảnh': 'Preparing graphics', 'Bật âm thanh': 'Sound on', 'Tắt âm thanh': 'Sound off', 'Chúc em khám phá vui!': 'Have fun exploring!',
  'Tan học': 'After school', 'Giờ học': 'Class time', 'Ra chơi': 'Break', 'Bấm': 'Press', 'Chạm nút': 'Tap', 'Chạm': 'Tap', 'Nói chuyện': 'Talk', 'Cưỡi': 'Ride',
  'Xuống xe': 'Get off', 'Đúng rồi': 'Correct', 'Sai rồi': 'Not quite', 'Thử lại': 'Try again', 'Câu hỏi': 'Question',
  'Phép thuật': 'Spells', 'Đũa phép': 'Wand', 'Thần chú': 'Spell', 'Khu cờ vua': 'Chess park', 'Cờ caro': 'Tic-tac-toe', 'Cờ vua': 'Chess', 'Thư viện': 'Library',
  'Hội trường': 'Hall', 'Khu vườn': 'Garden', 'Phòng Rubik': 'Rubik room', 'Lắp mạch điện': 'Build a circuit', 'Đua khinh khí cầu': 'Balloon race', 'Học viện': 'Academy',
  'Người chơi': 'Player', 'Lượt của em': 'Your turn', 'Thắng': 'Win', 'Thua': 'Lose', 'Hoà': 'Draw', 'Điểm': 'Score', 'Thời gian': 'Time', 'Khách': 'Guest',
};
const PAIRS = Object.entries(EN).sort((a, b) => b[0].length - a[0].length);
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RX = new RegExp('(?<![\\p{L}])(?:' + PAIRS.map(([k]) => esc(k)).join('|') + ')(?![\\p{L}])', 'gu');   // nguyên từ (không thay giữa chữ)
export const tr = s => (LANG === 'en' && s && /[À-ỹ]|[a-z]/i.test(s)) ? s.replace(RX, m => EN[m] || m) : s;

const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT']);
function walk(n) {
  if (n.nodeType === 3) { const v = n.nodeValue, t = tr(v); if (t !== v) n.nodeValue = t; return; }
  if (n.nodeType !== 1 || SKIP.has(n.tagName) || n.closest?.('[data-noi18n]')) return;
  if (n.title) { const t = tr(n.title); if (t !== n.title) n.title = t; }
  for (let c = n.firstChild; c; c = c.nextSibling) walk(c);
}
export function startI18n() {
  if (LANG !== 'en') return;
  document.title = 'Rubik Island – Mini';
  walk(document.body);
  const q = new Set(); let raf = 0;
  new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') q.add(m.target); else for (const a of m.addedNodes) q.add(a); }
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; for (const n of q) if (n.isConnected) walk(n); q.clear(); }); })
    .observe(document.body, { childList: true, subtree: true, characterData: true });
}
export function setLang(l) { try { localStorage.setItem(KEY, l); } catch (e) {} location.reload(); }
