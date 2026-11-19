// academy/houses-data.js — 4 NHÀ TỨ LINH của Học viện Pha Lê (nguyên bản, theo Tứ Linh Việt Nam: Long · Lân · Quy · Phụng).
// Số liệu thuần: tên, màu, linh vật, câu hỏi tính cách (không đúng/sai), câu đố toán ở lối vào, nhiệm vụ nhà.
export const HOUSES = [
  { id: 'long', name: 'Nhà Long', beast: 'Rồng', icon: '🐉', elem: 'Lửa', elIcon: '🔥', col: '#c8302c', col2: '#e8b84a', trait: 'dũng cảm', motto: 'Lửa trong tim, dám làm điều đúng.', door: 'Cánh cửa đá' },
  { id: 'phung', name: 'Nhà Phụng', beast: 'Phượng hoàng', icon: '🦚', elem: 'Gió', elIcon: '🌬️', col: '#3a6fc4', col2: '#c9d3e0', trait: 'trí tuệ', motto: 'Gió mang tri thức bay xa.', door: 'Bức tranh biết đố' },
  { id: 'lan', name: 'Nhà Lân', beast: 'Kỳ lân', icon: '🦄', elem: 'Đất', elIcon: '🌱', col: '#3f8a4c', col2: '#c08a4a', trait: 'tốt bụng, chăm chỉ', motto: 'Đất nuôi cây, chăm chỉ nuôi tài.', door: 'Cây cổ thụ' },
  { id: 'quy', name: 'Nhà Quy', beast: 'Rùa thần', icon: '🐢', elem: 'Nước', elIcon: '💧', col: '#7a4fb0', col2: '#3fb8a8', trait: 'kiên nhẫn, khôn ngoan', motto: 'Nước chảy đá mòn.', door: 'Thác nước' },
];
export const HOUSE = Object.fromEntries(HOUSES.map(h => [h.id, h]));

// câu hỏi tính cách: mỗi câu 4 lựa chọn ứng với 4 nhà (thứ tự long, phung, lan, quy); lễ chọn nhà hỏi 5 câu ngẫu nhiên trong 8 câu
export const SORT_Q = [
  ['Trên đường tới trường, em thấy một chú mèo kẹt trên cây. Em sẽ…', ['Leo lên cứu ngay!', 'Nghĩ mẹo: dùng thang hoặc đồ ăn dụ xuống', 'Gọi các bạn cùng giúp một tay', 'Bình tĩnh quan sát, chỉ đường cho mèo tự xuống']],
  ['Món quà em thích nhất là…', ['Bộ đồ phiêu lưu: đèn pin, la bàn, dây thừng', 'Hộp đồ chơi lắp ráp thật khó', 'Túi hạt giống để tự trồng cây', 'Bể cá nhỏ để chăm mỗi ngày']],
  ['Một ngày được tự do, em sẽ…', ['Đi khám phá hang động, leo núi', 'Đọc sách, giải câu đố', 'Giúp bố mẹ làm vườn, nấu ăn', 'Ngồi câu cá, ngắm mây trôi']],
  ['Gặp một bài toán khó, em…', ['Thử ngay nhiều cách khác nhau', 'Vẽ sơ đồ, tìm quy luật', 'Rủ bạn cùng học, cùng nghĩ', 'Đọc lại thật chậm từng dòng']],
  ['Nếu được một phép thuật, em chọn…', ['Bay qua miệng núi lửa', 'Đọc hết mọi cuốn sách trong nháy mắt', 'Làm cây cối nở hoa', 'Thở dưới nước, trò chuyện với cá']],
  ['Lớp tổ chức văn nghệ, em…', ['Xung phong lên diễn đầu tiên', 'Viết kịch bản thật hay', 'Chuẩn bị đạo cụ, giúp mọi người', 'Đứng sau cánh gà nhắc lời, giữ nhịp cả lớp']],
  ['Trời mưa to, em thích…', ['Chạy ra nghịch mưa', 'Tìm hiểu vì sao có cầu vồng', 'Mang ô cho bạn chưa có', 'Ngồi bên cửa sổ nghe mưa rơi']],
  ['Có bạn mới vào lớp, em…', ['Chạy tới bắt chuyện trước', 'Đố bạn một câu đố vui', 'Chia bánh cho bạn', 'Để ý xem bạn cần gì rồi giúp nhẹ nhàng']],
];
export const SORT_N = 5;

// câu đố toán ở lối vào (mỗi lần mở sinh mới, vừa sức tiểu học – THCS)
const R = n => Math.floor(Math.random() * n);
export function mathRiddle() {
  const k = R(6);
  let q, a;
  if (k === 0) { const x = 3 + R(7), y = 3 + R(7); q = `${x} × ${y} = ?`; a = x * y; }
  else if (k === 1) { const f = [1, 1]; while (f.length < 9) f.push(f[f.length - 1] + f[f.length - 2]); const s = R(4); q = `Dãy Fibonacci: ${f.slice(s, s + 5).join(', ')}, … số tiếp theo?`; a = f[s + 5]; }
  else if (k === 2) { const x = 2 + R(8), n = 2 + R(8), y = 5 + R(20); q = `Số nào vào ô trống? ▢ × ${x} + ${y} = ${x * n + y}`; a = n; }
  else if (k === 3) { const c = 13 + R(21), b = 5 + R(8); q = `Có ${c} viên pha lê, chia đều cho ${b} bạn thì dư mấy viên?`; a = c % b; }
  else if (k === 4) { const s = 2 + R(9); q = `Hình vuông cạnh ${s} m có chu vi bao nhiêu mét?`; a = 4 * s; }
  else { const h = 1 + R(3), m = [15, 30, 45][R(3)]; q = `Một tiết học bắt đầu lúc 7 giờ, kéo dài ${h} giờ ${m} phút. Tan lúc mấy giờ mấy phút? (đáp án: số phút sau 7 giờ)`; a = h * 60 + m; }
  const set = new Set([a]); while (set.size < 4) { const d = a + (R(2) ? 1 : -1) * (1 + R(Math.max(3, Math.round(a / 5)))); if (d >= 0) set.add(d); }
  return { icon: '🧮', q, choices: [...set].map(String), a: 0, explain: `Đáp án: <b>${a}</b>.` };
}
// lời mời của từng lối vào
export const DOOR_SAY = {
  long: '🪨 Những vảy rồng khắc trên cánh cửa đá bừng sáng: <i>"Trả lời đúng, cửa sẽ mở!"</i>',
  phung: '🖼️ Chim phượng trong tranh nghiêng đầu: <i>"Muốn vào, hãy giải câu đố của ta!"</i>',
  lan: '🌳 Cây cổ thụ khẽ rung lá: <i>"Giải câu đố, hốc cây sẽ mở lối."</i>',
  quy: '🌊 Thác nước rì rầm thành tiếng: <i>"Đáp đúng, nước sẽ rẽ đôi."</i>',
};
// nhiệm vụ nhà trong ngày (bảng tin trong phòng sinh hoạt chung): [khoá, mô tả, cần, điểm thưởng]
export const TASKS = [
  ['ask', '📚 Trả lời đúng 3 câu hỏi phép (nạp năng lượng, cây đa, tranh…)', 3, 21],
  ['star', '⭐ Nhận 2 sao từ thầy cô hoặc mini game', 2, 21],
  ['riddle', '🧮 Giải 1 câu đố ở lối vào nhà', 1, 13],
];
export const PTS = { star: 8, ask: 3, riddle: 5 };   // điểm nhà mỗi lần
