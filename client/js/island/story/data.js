// story/data.js — CỐT TRUYỆN CHÍNH "KHỐI RUBIK PHA LÊ" (chỉ dữ liệu, nguyên bản).
// Bà Mù Màu (phản diện hài, không đáng sợ) lỡ tay làm vỡ Khối Rubik Pha Lê — viên ngọc giữ màu của cả thế giới — 8 mảnh văng khắp nơi,
// thế giới nhạt dần. Em cùng Coach Ru (rồi Cú Thần) đi qua 8 vùng, mỗi chương 1 mảnh. Nhiệm vụ làm lần lượt (luôn biết việc tiếp theo).
// Số nhiệm vụ 3 → 5, số câu hỏi 2 · 3 · 3 · 5 · 3 · 5 · 5 · 8, thưởng XP theo Fibonacci 21 → 610 (tiến dần).
// task: talk (nói chuyện) · quiz (thử thách kiến thức, learn.askSet) · collect (nhặt n vật) · goto (tới nơi) · cond (kỹ năng game: lặn, bay, phép, mini game…) · cast (niệm phép lên n mục tiêu)
// at: [x, z] hoặc (ctx) → [x, z]; r: bán kính tới nơi (m). Mảnh pha lê hiện ở shard sau khi xong mọi nhiệm vụ.
import { toWorld, FOREST, QUAY, CASTLE_L } from '../academy/plan.js';

export const WHO = {
  ru: { n: 'Coach Ru', i: '🧢' }, cu: { n: 'Cú Thần Pha Lê', i: '🦉' }, mu: { n: 'Bà Mù Màu', i: '👵' }, me: { n: 'Em', i: '🙂' },
  thu: { n: 'Bà Thủ Thư', i: '📚' }, rua: { n: 'Bà Rùa Biển', i: '🐢' }, rong: { n: 'Rồng Mây', i: '🐉' }, su: { n: 'Sư Đền Tri Thức', i: '⛩️' },
};
export const VALLEY = [-80, 207];                          // Thung lũng Rồng: đồi giữa Safari và Học viện Hoa Phượng
const HALL = c => toWorld((CASTLE_L.hall.u0 + CASTLE_L.hall.u1) / 2, 0);
const YARD = c => toWorld(CASTLE_L.hall.u1 + 13, 0);      // sân trước đại sảnh
const QUAYP = c => toWorld(QUAY.u0 + 2.5, 10);
const FGATE = c => toWorld(FOREST.gate[0], FOREST.gate[1]);
const FLAKE = c => toWorld(FOREST.lake.u, FOREST.lake.v + FOREST.lake.ring + 3);
const PIER = c => (c.academy && c.academy.pier ? c.academy.pier.end : [-203, -203]);
const near = (c, at, r) => { const p = c.player.pos; return Math.hypot(p.x - at[0], p.z - at[1]) < r; };

export const CHAPTERS = [
  { id: 1, name: 'Mảnh Trắng', region: 'Trường Rubik', icon: '🏫', col: '#f4f6ff', subj: 'Toán', xp: 21, sao: 5, title: 'Học trò Rubik',
    intro: [['ru', 'Chào em! Tôi là Coach Ru, huấn luyện viên Rubik của trường.'], ['mu', 'Hí hí! Khối Rubik Pha Lê đẹp quá, cho bà mượn ngắm tí… Ối! Rơi mất rồi!'], ['ru', 'Khối Pha Lê giữ màu cho cả thế giới. Nó vỡ thành 8 mảnh — mọi thứ đang nhạt dần kìa!'], ['ru', 'Đi nào! Mảnh đầu tiên ở ngay quảng trường cổng trường. Cứ theo mũi tên vàng nhé.']],
    tasks: [
      { type: 'talk', who: 'ru', at: [-62, 13], r: 4, text: 'Gặp Coach Ru ở cổng trường', lines: [['ru', 'Muốn ghép lại khối Rubik, mình phải giỏi đếm, giỏi tính.'], ['ru', 'Tới tượng Rubik, giải đố toán của tôi nhé!']] },
      { type: 'quiz', who: 'ru', at: [-68, 4], s: ['toan'], n: 2, need: 1, text: 'Giải đố Toán của Coach Ru ở tượng Rubik' },
      { type: 'collect', at: [-75, 9], n: 3, spread: 15, icon: '💧', col: '#9ad8ff', text: 'Nhặt 3 giọt màu quanh quảng trường' },
    ],
    shard: [-86, 9], outro: [['ru', 'Mảnh Trắng đây rồi! Màu trắng là tổng của mọi màu ánh sáng đấy.'], ['mu', 'Hừm… để bà xem các em tìm được mấy mảnh nào! Bà trốn ở thị trấn đây!'], ['ru', 'Mảnh tiếp theo ở phố. Đi thôi!']] },

  { id: 2, name: 'Mảnh Vàng', region: 'Thị trấn', icon: '🏘️', col: '#ffd23f', subj: 'Tiếng Việt', xp: 34, sao: 8, title: 'Nhà thám hiểm phố',
    intro: [['ru', 'Bà Mù Màu đi qua Phố Đà Lạt, các chữ cái trên biển hiệu rơi hết!'], ['ru', 'Tìm lại 3 chữ cái màu, rồi tới Thư viện nhờ Bà Thủ Thư.']],
    tasks: [
      { type: 'collect', at: [0, -223], n: 3, spread: 21, icon: '🔤', labels: ['M', 'À', 'U'], col: '#ffd23f', text: 'Tìm 3 chữ cái M · À · U ở Phố Đà Lạt' },
      { type: 'quiz', who: 'thu', at: [158, -158], s: ['tv'], n: 3, need: 2, text: 'Giải câu đố Tiếng Việt ở Thư viện', lines: [['thu', 'Ghép được chữ “MÀU” rồi à? Giỏi quá! Giờ đến câu đố chữ nghĩa của bà.']] },
      { type: 'cond', at: [223, 0], r: 0, text: 'Chơi 1 mini game ở khu Thể thao (gặp chủ trò, bấm E)', test: c => !!c.mgActive, hint: 'Mini game nào cũng được: đá bóng, bắn bóng rổ, đua xe…' },
    ],
    shard: [205, -12], outro: [['ru', 'Mảnh Vàng — màu của nắng!'], ['mu', 'Bà chỉ muốn thế giới… bớt chói mắt thôi mà! Bà ra biển hóng gió đây.'], ['ru', 'Ra biển phía tây! Nhớ hít thật sâu trước khi lặn.']] },
];

let EGG = () => 0;
export const setEggCounter = f => { EGG = f; };
const eggCount = () => EGG();

// Kỹ năng: 1 điểm / lần lên cấp. Mỗi kỹ năng 3 bậc, cần cấp tối thiểu (Fibonacci 2 · 3 · 5).
export const SKILLS = [
  { id: 'run', i: '🏃', n: 'Chân Gió', d: t => `Chạy nhanh hơn ${[0, 8, 13, 21][t]} %` },
  { id: 'glide', i: '🪶', n: 'Lướt Gió', d: t => t ? `Giữ nút Nhảy trên không để lướt lâu hơn (×${[1, 1.6, 2.6, 4.2][t]})` : 'Giữ Nhảy để bay lướt' },
  { id: 'lung', i: '🐬', n: 'Phổi Cá Heo', d: t => `Lặn lâu ${[21, 34, 55, 89][t]} giây` },
  { id: 'mana', i: '✨', n: 'Pha Lê Phép', d: t => `Trả lời đúng: +${[0, 8, 13, 21][t]} năng lượng phép` },
  { id: 'ride', i: '🚲', n: 'Tay Lái Gió', d: t => `Xe, ngựa, thuyền nhỏ nhanh hơn ${[0, 8, 13, 21][t]} %` },
];
export const SKILL_LV = [2, 3, 5];
export const TITLES_EXTRA = [
  { id: 'mem', n: 'Siêu trí nhớ', d: 'Nhớ chắc 13 câu (ôn đúng nhiều lần)', test: L => L.known >= 13 },
  { id: 'rev', n: 'Chăm ôn bài', d: 'Ôn lại đúng 5 câu từng sai', test: (L, P) => (P.revOk | 0) >= 5 },
  { id: 'all', n: 'Ham học 5 môn', d: 'Trả lời đúng ít nhất 1 câu mỗi môn', test: L => ['toan', 'tv', 'kh', 'lsdl', 'ta'].every(s => L[s].ok > 0) },
];
