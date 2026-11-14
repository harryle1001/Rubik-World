// quiz-data.js — Ngân hàng câu đố. THÊM MÔN MỚI: thêm 1 khoá vào SUBJECTS theo mẫu bên dưới.
// Mỗi câu: { q: câu hỏi, choices: [4 đáp án], a: vị trí đáp án đúng (0-3), explain: giải thích ngắn }
// Môn có thể có thêm make(): hàm tự sinh câu hỏi mới (dùng cho toán).
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const numQ = (q, ans, explain) => { const s = new Set([ans]); while (s.size < 4) { const v = ans + ri(-5, 5); if (v >= 0) s.add(v); } const choices = [...s].sort(() => Math.random() - 0.5); return { q, choices: choices.map(String), a: choices.indexOf(ans), explain }; };

export const SUBJECTS = {
  toan: {
    name: 'Toán', icon: '➗',
    make() {
      const t = ri(0, 4), a = ri(3, 9), b = ri(2, 9);
      if (t === 0) return numQ(`Cổng có ${a} hàng đá, mỗi hàng ${b} viên. Có bao nhiêu viên đá?`, a * b, `${a} × ${b} = ${a * b}`);
      if (t === 1) return numQ(`Có ${a * b} quả táo chia đều cho ${a} bạn. Mỗi bạn được mấy quả?`, b, `${a * b} : ${a} = ${b}`);
      if (t === 2) { const x = ri(20, 80), y = ri(5, x - 5); return numQ(`Rùa đi được ${x} bước, rồi lùi lại ${y} bước. Rùa còn cách chỗ cũ bao nhiêu bước?`, x - y, `${x} − ${y} = ${x - y}`); }
      if (t === 3) return numQ(`Mảnh vườn hình vuông cạnh ${a} m. Chu vi là bao nhiêu mét?`, a * 4, `Chu vi hình vuông = cạnh × 4 = ${a} × 4 = ${a * 4} m`);
      return numQ(`Dãy số: ${b}, ${b + a}, ${b + 2 * a}, ${b + 3 * a}, … Số tiếp theo là?`, b + 4 * a, `Mỗi số hơn số trước ${a}, nên số tiếp theo là ${b + 3 * a} + ${a} = ${b + 4 * a}`);
    },
    questions: [],
  },
  khoahoc: {
    name: 'Khoa học', icon: '🔬',
    questions: [
      { q: 'Nước sôi ở bao nhiêu độ C (ở mực nước biển)?', choices: ['50 °C', '100 °C', '0 °C', '200 °C'], a: 1, explain: 'Nước sôi ở 100 °C và đông đặc thành đá ở 0 °C.' },
      { q: 'Cây xanh nhả ra khí gì khi quang hợp?', choices: ['Khí cacbonic', 'Khí ôxi', 'Khí nitơ', 'Hơi muối'], a: 1, explain: 'Cây dùng ánh sáng, nước và khí cacbonic để tạo chất dinh dưỡng và nhả ra ôxi.' },
      { q: 'Vì sao có ngày và đêm?', choices: ['Mặt Trời tắt', 'Trái Đất tự quay quanh trục', 'Mặt Trăng che', 'Mây che'], a: 1, explain: 'Nửa Trái Đất quay về phía Mặt Trời là ngày, nửa kia là đêm.' },
      { q: 'Rùa biển thở bằng gì?', choices: ['Mang', 'Phổi', 'Da', 'Vây'], a: 1, explain: 'Rùa biển thở bằng phổi nên phải ngoi lên mặt nước lấy không khí.' },
      { q: 'Vật nào sau đây bị nam châm hút?', choices: ['Cây bút chì gỗ', 'Chiếc đinh sắt', 'Tờ giấy', 'Cục tẩy'], a: 1, explain: 'Nam châm hút các vật làm bằng sắt, thép.' },
      { q: 'Âm thanh truyền được qua môi trường nào?', choices: ['Chỉ không khí', 'Rắn, lỏng và khí', 'Chỉ nước', 'Chân không'], a: 1, explain: 'Âm thanh truyền qua chất rắn, lỏng, khí nhưng không truyền được trong chân không.' },
      { q: 'Hành tinh nào lớn nhất Hệ Mặt Trời?', choices: ['Trái Đất', 'Sao Hỏa', 'Sao Mộc', 'Sao Kim'], a: 2, explain: 'Sao Mộc lớn tới mức chứa được hơn 1.000 Trái Đất.' },
      { q: 'Nước biển mặn vì có nhiều chất gì?', choices: ['Đường', 'Muối', 'Cát', 'Dầu'], a: 1, explain: 'Sông suối mang muối khoáng ra biển; nước bốc hơi đi, muối ở lại.' },
      { q: 'Bộ phận nào của cây hút nước?', choices: ['Lá', 'Hoa', 'Rễ', 'Quả'], a: 2, explain: 'Rễ có lông hút để hút nước và muối khoáng từ đất.' },
      { q: 'Cầu vồng xuất hiện khi nào?', choices: ['Ánh nắng chiếu qua giọt mưa', 'Trời tối', 'Có gió mạnh', 'Có tuyết'], a: 0, explain: 'Giọt nước tách ánh sáng trắng thành 7 màu.' },
    ],
  },
  // Ví dụ thêm môn: tienganh: { name: 'Tiếng Anh', icon: '🔤', questions: [ { q: '"Apple" nghĩa là gì?', choices: ['Quả táo', 'Con mèo', 'Ngôi nhà', 'Cái cây'], a: 0, explain: 'apple = quả táo' } ] },
};

// Lấy n câu ngẫu nhiên từ các môn được chọn
export function pickQuestions(subjects, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const S = SUBJECTS[subjects[i % subjects.length]];
    const pool = S.questions.filter(q => !out.includes(q));
    const q = S.make && (!pool.length || Math.random() < 0.5) ? S.make() : pool[Math.floor(Math.random() * pool.length)];
    out.push(Object.assign({ subject: S.name, icon: S.icon }, q));
  }
  return out;
}
