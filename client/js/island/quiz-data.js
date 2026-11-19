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
  // Biển (rương kho báu dưới đáy biển — treasure.js). hint: gợi ý khi trả lời sai (không lộ đáp án)
  bien: {
    name: 'Biển', icon: '🌊',
    questions: [
      { q: 'Cá heo thở bằng gì?', choices: ['Mang', 'Phổi', 'Da', 'Vây'], a: 1, hint: 'Cá heo phải ngoi lên mặt nước để lấy hơi qua lỗ trên đỉnh đầu.', explain: 'Cá heo là động vật có vú, thở bằng phổi.' },
      { q: 'Cá thở bằng gì?', choices: ['Phổi', 'Mang', 'Mũi', 'Da'], a: 1, hint: 'Hai bên đầu cá có những khe mở ra đóng vào liên tục.', explain: 'Mang cá lọc khí ô-xi hoà tan trong nước.' },
      { q: 'Sao biển mất một cánh thì sao?', choices: ['Mọc lại cánh mới', 'Chết ngay', 'Biến thành cá', 'Không bơi được nữa'], a: 0, hint: 'Sao biển có khả năng "tái sinh" rất giỏi.', explain: 'Sao biển có thể mọc lại cánh bị mất.' },
      { q: 'Rạn san hô được tạo nên bởi gì?', choices: ['Đá núi lửa', 'Những con polyp nhỏ xíu', 'Rong biển', 'Cát vàng'], a: 1, hint: 'San hô là động vật, sống thành quần thể rất đông.', explain: 'Hàng nghìn con polyp san hô tiết ra đá vôi, xây nên rạn san hô.' },
      { q: 'Đại dương nào lớn nhất thế giới?', choices: ['Đại Tây Dương', 'Ấn Độ Dương', 'Thái Bình Dương', 'Bắc Băng Dương'], a: 2, hint: 'Biển Đông của Việt Nam thông ra đại dương này.', explain: 'Thái Bình Dương rộng hơn tất cả đất liền trên Trái Đất cộng lại.' },
      { q: 'Nước biển che phủ khoảng bao nhiêu bề mặt Trái Đất?', choices: ['Khoảng 1/10', 'Khoảng 1/2', 'Khoảng 7/10', 'Toàn bộ'], a: 2, hint: 'Nhìn từ vũ trụ, Trái Đất là "hành tinh xanh".', explain: 'Khoảng 71% bề mặt Trái Đất là biển và đại dương.' },
      { q: 'Vì sao túi ni-lông trôi trên biển nguy hiểm cho rùa biển?', choices: ['Rùa tưởng là sứa nên ăn phải', 'Túi làm nước ấm lên', 'Túi giúp rùa bơi nhanh', 'Không nguy hiểm gì'], a: 0, hint: 'Món ăn yêu thích của rùa biển trông trong suốt, lềnh bềnh.', explain: 'Rùa nhầm túi ni-lông với sứa, nuốt phải sẽ bị nghẹn, tắc ruột.' },
      { q: 'Trên bãi tắm cắm cờ đỏ nghĩa là gì?', choices: ['Được bơi thoải mái', 'Nguy hiểm, không xuống nước', 'Có bán kem', 'Có cá heo'], a: 1, hint: 'Màu đỏ giống đèn giao thông bảo em phải làm gì?', explain: 'Cờ đỏ: sóng to, dòng chảy mạnh — tuyệt đối không xuống nước.' },
      { q: 'Bị dòng nước cuốn ra xa bờ, em nên làm gì?', choices: ['Bơi ngược thẳng vào bờ thật mạnh', 'Bình tĩnh bơi song song với bờ, vẫy tay gọi cứu', 'Lặn xuống đáy', 'Cố đứng yên'], a: 1, hint: 'Bơi ngược dòng sẽ rất nhanh mệt; hãy thoát ra khỏi luồng nước trước.', explain: 'Bơi song song bờ để thoát khỏi dòng chảy xa bờ, rồi mới bơi vào và gọi người giúp.' },
      { q: 'Bạch tuộc có mấy xúc tu?', choices: ['6', '8', '10', '12'], a: 1, hint: 'Tên tiếng Anh "octopus" có "octo" nghĩa là số này.', explain: 'Bạch tuộc có 8 xúc tu với hàng trăm giác hút.' },
      { q: 'Con vật lớn nhất từng sống trên Trái Đất là?', choices: ['Khủng long bạo chúa', 'Voi châu Phi', 'Cá voi xanh', 'Cá mập trắng'], a: 2, hint: 'Nó sống dưới biển và là động vật có vú.', explain: 'Cá voi xanh dài tới khoảng 30 m, nặng hơn cả khủng long lớn nhất.' },
      { q: 'Chai nhựa vứt ra biển cần bao lâu mới phân huỷ?', choices: ['Vài ngày', 'Vài tháng', 'Hàng trăm năm', 'Một tuần'], a: 2, hint: 'Nhựa rất bền, lâu hơn cả một đời người rất nhiều.', explain: 'Chai nhựa cần hàng trăm năm để phân huỷ — hãy mang rác về, đừng để lại bãi biển.' },
      { q: 'Cá hề sống chung với loài nào?', choices: ['Hải quỳ', 'Cá mập', 'Sứa', 'Rùa biển'], a: 0, hint: 'Loài này trông như bông hoa có nhiều xúc tu.', explain: 'Cá hề trú trong xúc tu hải quỳ, hai bên giúp đỡ nhau.' },
      { q: 'Thủy triều lên xuống chủ yếu do đâu?', choices: ['Gió thổi', 'Lực hút của Mặt Trăng', 'Cá voi bơi', 'Núi lửa'], a: 1, hint: 'Hãy nhìn lên bầu trời đêm.', explain: 'Lực hấp dẫn của Mặt Trăng (và Mặt Trời) kéo nước biển dâng lên, hạ xuống.' },
      { q: 'Bị sứa đốt, việc nên làm đầu tiên là gì?', choices: ['Chà cát lên vết đốt', 'Lên bờ, báo người lớn, rửa bằng nước biển', 'Gãi thật mạnh', 'Bôi bùn lên'], a: 1, hint: 'Chà xát sẽ làm các tế bào châm vỡ ra thêm.', explain: 'Lên bờ, nhờ người lớn giúp, rửa nhẹ bằng nước biển, không chà xát.' },
      { q: 'Trước khi xuống bơi, em cần làm gì?', choices: ['Ăn thật no', 'Khởi động và có người lớn trông', 'Bơi một mình ra xa', 'Nhảy từ chỗ thật cao'], a: 1, hint: 'An toàn là trên hết: cơ thể sẵn sàng và có người bên cạnh.', explain: 'Khởi động tránh chuột rút; luôn bơi ở nơi có người lớn hoặc cứu hộ.' },
      { q: 'Cá ngựa có điều gì đặc biệt?', choices: ['Cá bố mang thai và đẻ con', 'Biết bay', 'Sống trên cạn', 'Có 4 chân'], a: 0, hint: 'Điều đặc biệt này liên quan tới "bố" cá ngựa.', explain: 'Cá ngựa bố giữ trứng trong túi bụng cho tới khi cá con chào đời.' },
      { q: 'Rừng ngập mặn ven biển có ích gì?', choices: ['Chắn sóng, giữ đất, là nhà của tôm cá', 'Làm nước biển mặn hơn', 'Không có ích gì', 'Chỉ để lấy củi'], a: 0, hint: 'Rễ cây đước, cây mắm chằng chịt dưới nước.', explain: 'Rừng ngập mặn chắn sóng bão, giữ đất bờ biển và nuôi dưỡng tôm cá con.' },
      { q: 'Vì sao nước biển có vị mặn?', choices: ['Có nhiều muối khoáng hoà tan', 'Do cá thải ra', 'Do nước mưa', 'Do cát biển'], a: 0, hint: 'Phơi nước biển dưới nắng, thứ còn lại là gì?', explain: 'Sông suối mang muối khoáng ra biển; nước bốc hơi, muối ở lại.' },
      { q: 'Rùa biển cái đẻ trứng ở đâu?', choices: ['Dưới đáy biển', 'Trên bãi cát', 'Trong rạn san hô', 'Trên cây'], a: 1, hint: 'Trứng rùa cần hơi ấm của nắng mới nở được.', explain: 'Rùa cái bò lên bãi cát, đào hố đẻ trứng rồi lấp cát lại.' },
      { q: 'Khi lặn ngắm san hô, em nên làm gì?', choices: ['Bẻ một ít về làm kỷ niệm', 'Không chạm, không giẫm lên san hô', 'Cho cá ăn bánh mì', 'Đứng lên san hô nghỉ'], a: 1, hint: 'San hô là sinh vật sống, lớn rất chậm.', explain: 'San hô mỗi năm chỉ lớn vài cm — chạm hay giẫm lên đều làm san hô chết.' },
    ],
  },
  // Ví dụ thêm môn: tienganh: { name: 'Tiếng Anh', icon: '🔤', questions: [ { q: '"Apple" nghĩa là gì?', choices: ['Quả táo', 'Con mèo', 'Ngôi nhà', 'Cái cây'], a: 0, explain: 'apple = quả táo' } ] },
};

// Ngân hàng chung + học thích ứng (learn.js) đăng ký provider: môn nào provider trả câu thì dùng câu đó (có q.done(ok) để ghi kết quả)
let provider = null;
export const setProvider = f => { provider = f; };
// Lấy n câu ngẫu nhiên từ các môn được chọn
export function pickQuestions(subjects, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const P = provider && provider(subjects[i % subjects.length]); if (P) { out.push(P); continue; }
    const S = SUBJECTS[subjects[i % subjects.length]];
    const pool = S.questions.filter(q => !out.includes(q));
    const q = S.make && (!pool.length || Math.random() < 0.5) ? S.make() : pool[Math.floor(Math.random() * pool.length)];
    out.push(Object.assign({ subject: S.name, icon: S.icon }, q));
  }
  return out;
}
