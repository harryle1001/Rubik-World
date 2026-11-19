// mg/quiz.js — Ngân hàng câu hỏi ngắn dùng chung cho mini game 3D (1 câu ≤ 1 dòng, 3 đáp án, có lời giải thích).
// quiz(topic, level) → { q, a, choices, why }   topic: 'math' | 'vocab' | 'science' | 'geo' | 'mix'
import * as THREE from 'three';
import { mathQ, pick } from './sport/kit.js';

const T = (q, a, w1, w2, why = '') => ({ q, a, wrong: [w1, w2], why });
export const BANK = {
  vocab: [
    T('“apple” là gì?', 'quả táo', 'quả cam', 'quả chuối'), T('“dog” là gì?', 'con chó', 'con mèo', 'con gà'), T('“book” là gì?', 'quyển sách', 'cái bút', 'cái bàn'),
    T('“school” là gì?', 'trường học', 'bệnh viện', 'công viên'), T('“red” là màu gì?', 'màu đỏ', 'màu xanh', 'màu vàng'), T('“sun” là gì?', 'mặt trời', 'mặt trăng', 'ngôi sao'),
    T('“water” là gì?', 'nước', 'lửa', 'gió'), T('“fish” là gì?', 'con cá', 'con chim', 'con rùa'), T('“happy” nghĩa là?', 'vui vẻ', 'buồn bã', 'mệt mỏi'),
    T('“fast” nghĩa là?', 'nhanh', 'chậm', 'cao'), T('“tree” là gì?', 'cái cây', 'bông hoa', 'hòn đá'), T('“teacher” là ai?', 'giáo viên', 'bác sĩ', 'nông dân'),
    T('“Con mèo” tiếng Anh?', 'cat', 'cow', 'cap'), T('“Số mười” tiếng Anh?', 'ten', 'two', 'tea'), T('“Màu xanh dương”?', 'blue', 'green', 'black'),
    T('“Bóng đá” tiếng Anh?', 'football', 'basketball', 'volleyball'), T('“Mưa” tiếng Anh?', 'rain', 'snow', 'wind'), T('“Ngôi nhà” tiếng Anh?', 'house', 'horse', 'mouse'),
  ],
  science: [
    T('Nước sôi ở bao nhiêu độ C?', '100', '50', '0', 'Ở mực nước biển nước sôi ở 100 °C, đông đá ở 0 °C.'),
    T('Cây hút khí gì để quang hợp?', 'CO₂', 'O₂', 'N₂', 'Cây hút khí các-bô-níc (CO₂) và nhả ô-xy (O₂).'),
    T('Hành tinh gần Mặt Trời nhất?', 'Sao Thủy', 'Sao Kim', 'Trái Đất', 'Thứ tự: Thủy, Kim, Trái Đất, Hỏa, Mộc, Thổ, Thiên Vương, Hải Vương.'),
    T('Người có bao nhiêu xương (lớn)?', '206', '106', '306', 'Người trưởng thành có 206 xương; em bé mới sinh có gần 300 xương.'),
    T('Cá thở bằng gì?', 'mang', 'phổi', 'da', 'Mang lọc ô-xy hoà tan trong nước.'),
    T('Không khí nóng thì…?', 'bay lên', 'chìm xuống', 'đứng yên', 'Khí nóng nhẹ hơn khí lạnh nên bay lên — vì thế khinh khí cầu bay được!'),
    T('Trái Đất quay quanh Mặt Trời mất?', '1 năm', '1 ngày', '1 tháng', 'Trái Đất tự quay 1 vòng mất 1 ngày, quay quanh Mặt Trời mất 1 năm.'),
    T('Nam châm hút vật nào?', 'đinh sắt', 'cục tẩy', 'que gỗ', 'Nam châm hút sắt, niken, coban.'),
    T('Âm thanh truyền được trong…?', 'không khí', 'chân không', 'không nơi nào', 'Ngoài vũ trụ là chân không nên không nghe được âm thanh.'),
    T('Cầu vồng có mấy màu?', '7', '5', '9', 'Đỏ, cam, vàng, lục, lam, chàm, tím.'),
    T('Tuyết là nước ở thể…?', 'rắn', 'lỏng', 'khí', 'Băng, tuyết là thể rắn; hơi nước là thể khí.'),
    T('Con vật nào là động vật có vú?', 'cá voi', 'cá mập', 'cá chép', 'Cá voi thở bằng phổi và nuôi con bằng sữa.'),
    T('Ma sát lớn giúp…?', 'phanh xe dừng lại', 'trượt nhanh hơn', 'bay cao hơn', 'Ván trượt, giày patin cần ít ma sát; phanh cần nhiều ma sát.'),
    T('Mặt Trăng tự phát sáng không?', 'không', 'có', 'chỉ ban ngày', 'Mặt Trăng phản chiếu ánh sáng Mặt Trời.'),
  ],
  geo: [
    T('Thủ đô của Việt Nam?', 'Hà Nội', 'Huế', 'Đà Nẵng'), T('Sông dài nhất thế giới?', 'sông Nin', 'sông Hồng', 'sông Mê Kông', 'Sông Nin ở châu Phi dài khoảng 6 650 km.'),
    T('Đỉnh núi cao nhất Việt Nam?', 'Fansipan', 'Bà Đen', 'Bạch Mã', 'Fansipan cao 3 143 m — “nóc nhà Đông Dương”.'),
    T('Đại dương lớn nhất?', 'Thái Bình Dương', 'Đại Tây Dương', 'Ấn Độ Dương'), T('Việt Nam ở châu lục nào?', 'châu Á', 'châu Âu', 'châu Phi'),
    T('Núi cao nhất thế giới?', 'Everest', 'Fansipan', 'Phú Sĩ', 'Everest cao 8 849 m, ở dãy Himalaya.'), T('Vịnh Hạ Long ở tỉnh nào?', 'Quảng Ninh', 'Khánh Hoà', 'Kiên Giang'),
    T('Hướng Mặt Trời mọc?', 'Đông', 'Tây', 'Bắc'), T('Nước có hình chữ S?', 'Việt Nam', 'Nhật Bản', 'Ý'),
  ],
};
let provider = null;   // learn.js: ngân hàng chung + thích ứng cho vocab/science/geo (câu có done(ok))
export const setQuizProvider = f => { provider = f; };
export function quiz(topic = 'math', level = 1) {
  if (topic === 'mix') topic = pick(['math', 'math', 'vocab', 'science', 'geo']);
  const P = topic !== 'math' && provider && provider(topic); if (P) return P;
  if (topic === 'math') { const m = mathQ(level); return { q: m.q + ' = ?', a: String(m.a), choices: m.choices.map(String), why: `${m.q} = ${m.a}` }; }
  const t = pick(BANK[topic] || BANK.science);
  return { q: t.q, a: t.a, choices: [t.a, ...t.wrong].sort(() => Math.random() - 0.5), why: t.why || `Đáp án: ${t.a}` };
}
// Hiện 3 nút đáp án ở thanh dưới của host; fn(đúng?, đáp án chọn) — gọi 1 lần rồi tự xoá nút
export function askBar(api, Q, fn, keep = []) {
  api.hud.clearBar(); let done = false;
  Q.choices.forEach((c, i) => api.hud.button(c, () => { if (done) return; done = true; api.hud.clearBar(); keep.forEach(k => k()); Q.done && Q.done(c === Q.a); fn(c === Q.a, c); }));
  return { answer: i => { if (!done && Q.choices[i] != null) { done = true; api.hud.clearBar(); keep.forEach(k => k()); Q.done && Q.done(Q.choices[i] === Q.a); fn(Q.choices[i] === Q.a, Q.choices[i]); } }, get done() { return done; } };
}
// Bảng 3D: câu hỏi (dòng trên) + 3 ô đáp án màu đỏ/vàng/xanh — 1 canvas, 1 draw call. board(w) → { mesh, draw(Q, hi?) }
export function board(w) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 320; const k = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 320 / 1024), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));
  const draw = (Q, hi = -1) => { k.clearRect(0, 0, 1024, 320); k.fillStyle = 'rgba(27,22,38,.92)'; k.beginPath(); k.roundRect(8, 8, 1008, 130, 40); k.fill(); k.fillStyle = '#ffd36e'; k.font = 'bold 72px system-ui'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(Q.q, 512, 76, 980);
    Q.choices.forEach((c, i) => { const x = 8 + i * 339; k.globalAlpha = hi < 0 || hi === i ? 1 : 0.35; k.fillStyle = ['#e8453c', '#f2b134', '#3fa36b'][i]; k.beginPath(); k.roundRect(x, 152, 330, 160, 34); k.fill(); k.fillStyle = '#fff'; k.font = 'bold 76px system-ui'; k.fillText(c, x + 165, 236, 310); }); k.globalAlpha = 1; tex.needsUpdate = true; };
  return { mesh, draw };
}
