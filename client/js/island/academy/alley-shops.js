// academy/alley-shops.js — LỜI THOẠI + CÂU ĐỐ RIÊNG của 8 cửa hàng Phố Phép Thuật (nguyên bản, tiếng Việt, hợp lứa tuổi học sinh).
// Mỗi tiệm: chủ tiệm (who, ngoại hình NPC), 3 câu thoại xoay vòng, môn câu đố (subj) + 3 câu riêng (đáp án đúng đứng đầu, magic.ask tự xáo).
const Q = (icon, q, choices, explain) => ({ icon, q, choices, a: 0, explain });
const adult = (shirt, pants, extra = {}) => ({ role: 'adult', shirt, pants, hat: null, ...extra });

export const SHOP_TALK = {
  wand: {
    who: 'Cụ Pha Lê', kind: 'student-male-a', look: adult('#3a3f6b', '#2a2433', { hair: '#d8d8d8' }), subj: 'khoahoc',
    lines: ['Mỗi cây đũa chọn một chủ nhân — nhưng lõi pha lê thì cháu được chọn màu!', 'Pha lê sáng lấp lánh vì ánh sáng bị bẻ cong khi đi qua nó đấy.', 'Đũa tốt không làm phép thay cháu đâu, chỉ giúp cháu tập trung thôi.'],
    qs: [Q('🔬', 'Ánh sáng trắng đi qua lăng kính tách thành mấy màu chính?', ['7 màu', '3 màu', '2 màu', '12 màu'], 'Đỏ, cam, vàng, lục, lam, chàm, tím — <b>7 màu</b> như cầu vồng.'),
      Q('🔬', 'Kim cương và than chì đều được tạo từ nguyên tố nào?', ['Các-bon', 'Sắt', 'Đồng', 'Ô-xi'], 'Cùng là <b>các-bon</b>, chỉ khác cách sắp xếp nguyên tử.'),
      Q('🌳', 'Gỗ cây được tạo nên chủ yếu từ đâu?', ['Khí các-bô-níc và nước cây hấp thụ', 'Chỉ từ đất', 'Từ ánh trăng', 'Từ đá'], 'Cây quang hợp biến <b>các-bô-níc + nước</b> thành chất làm nên thân gỗ.')],
  },
  sweet: {
    who: 'Cô Đường Phèn', kind: 'student-female-a', look: adult('#e07a9a', '#5a2a3a'), subj: 'toan',
    lines: ['Kẹo Nổ Lách Tách mới ra lò! Ăn xong năng lượng phép tăng vù vù.', 'Bánh Mây nhẹ tới mức phải giữ chặt không nó bay mất.', 'Ăn ngọt xong nhớ súc miệng, đánh răng nhé — sâu răng không có phép nào chữa nhanh đâu!'],
    qs: [Q('🧁', 'Một khay có 4 hàng, mỗi hàng 6 chiếc bánh. Có tất cả bao nhiêu chiếc?', ['24', '10', '20', '28'], '4 × 6 = <b>24</b> chiếc bánh.'),
      Q('🍬', 'Có 30 viên kẹo chia đều cho 5 bạn. Mỗi bạn được mấy viên?', ['6', '5', '7', '25'], '30 : 5 = <b>6</b> viên.'),
      Q('🦷', 'Vì sao ăn nhiều đồ ngọt dễ bị sâu răng?', ['Vi khuẩn ăn đường tạo ra a-xít làm mòn men răng', 'Vì đường rất cứng', 'Vì kẹo có màu', 'Vì ăn vào buổi tối'], 'Vi khuẩn trong miệng biến đường thành <b>a-xít</b>, làm mòn men răng.')],
  },
  book: {
    who: 'Thầy Giấy Dó', kind: 'student-male-a', look: adult('#5a4a2a', '#2a2433', { hair: '#3a2a20' }), subj: 'khoahoc',
    lines: ['Suỵt… sách ở đây hay bay lượn, cháu đi nhẹ chân kẻo chúng giật mình.', 'Giấy dó làm từ vỏ cây dó, bền cả trăm năm đấy.', 'Đọc một cuốn sách là được sống thêm một cuộc đời!'],
    books: [
      ['Bầu trời có gì?', 'Mặt Trời là một <b>ngôi sao</b>. Ánh sáng của nó mất khoảng <b>8 phút</b> để tới Trái Đất. Mặt Trăng không tự phát sáng mà <b>phản chiếu</b> ánh Mặt Trời.'],
      ['Nước đi đâu?', '<b>Vòng tuần hoàn của nước</b>: nước bốc hơi → ngưng tụ thành mây → mưa rơi xuống → chảy ra sông, biển rồi lại bốc hơi.'],
      ['Chữ viết của người Việt', 'Người Việt từng dùng <b>chữ Hán</b>, rồi <b>chữ Nôm</b>; chữ <b>Quốc ngữ</b> dùng bảng chữ cái La-tinh được phổ biến rộng từ đầu thế kỷ 20.'],
      ['Con số vàng φ', 'Tỉ lệ vàng <b>φ ≈ 1,618</b> xuất hiện trong dãy <b>Fibonacci</b> 1, 1, 2, 3, 5, 8, 13… (số sau chia số trước ≈ φ), trong vỏ ốc và cách hạt hướng dương xếp vòng.'],
    ],
    qs: [Q('📖', 'Giấy dó truyền thống được làm từ đâu?', ['Vỏ cây dó', 'Lá chuối', 'Đất sét', 'Lông gà'], 'Nghề làm <b>giấy dó</b> dùng vỏ cây dó giã nhuyễn, xeo thành tờ.'),
      Q('🔢', 'Số tiếp theo của dãy Fibonacci 1, 1, 2, 3, 5, 8, … là số nào?', ['13', '11', '10', '16'], 'Mỗi số bằng tổng hai số trước: 5 + 8 = <b>13</b>.'),
      Q('🌙', 'Mặt Trăng sáng vào ban đêm là vì sao?', ['Phản chiếu ánh sáng Mặt Trời', 'Tự phát sáng', 'Có đèn bên trong', 'Do sao chiếu vào'], 'Mặt Trăng <b>phản chiếu</b> ánh Mặt Trời.')],
  },
  herb: {
    who: 'Bà Lá Lốt', kind: 'student-female-a', look: adult('#4f7a3a', '#3a3324', { hair: '#cfcfcf' }), subj: 'khoahoc',
    lines: ['Thảo dược tươi đây! Bạc hà mát, lá lốt thơm, mật ong rừng ngọt lịm.', 'Cây thuốc quý nhưng phải hỏi người lớn và thầy thuốc trước khi dùng nhé cháu.', 'Ong hút mật hoa, lại giúp hoa thụ phấn — đôi bạn cùng có lợi.'],
    qs: [Q('🐝', 'Ong giúp cây làm việc gì khi bay từ hoa này sang hoa khác?', ['Thụ phấn', 'Tưới nước', 'Bón phân', 'Cắt tỉa lá'], 'Ong mang phấn hoa đi, giúp hoa <b>thụ phấn</b> để kết quả.'),
      Q('🌿', 'Bộ phận nào của cây hút nước và muối khoáng từ đất?', ['Rễ', 'Hoa', 'Quả', 'Lá'], '<b>Rễ</b> hút nước và muối khoáng, thân đưa lên lá.'),
      Q('🌱', 'Hạt nảy mầm cần những điều kiện nào?', ['Nước, không khí, nhiệt độ thích hợp', 'Chỉ cần bóng tối', 'Chỉ cần muối', 'Không cần gì'], 'Hạt cần <b>đủ nước, không khí và nhiệt độ thích hợp</b>.')],
  },
  pet: {
    who: 'Chú Lông Vũ', kind: 'student-male-a', look: adult('#7a5a3a', '#2f3a2a'), subj: 'khoahoc',
    lines: ['Cú nhà chú đang ngủ ngày — cú là loài săn đêm mà. Mấy bé mèo, cún thì thức cả ngày!', 'Nuôi thú cưng là nhận một người bạn: nhớ cho ăn, cho uống, chơi cùng nó mỗi ngày.', 'Ếch nhỏ hồi bé là nòng nọc bơi dưới nước, lớn lên mới nhảy lên bờ đấy.'],
    qs: [Q('🦉', 'Vì sao cú săn mồi giỏi vào ban đêm?', ['Mắt to nhìn rõ trong tối và tai rất thính', 'Vì cú phát sáng', 'Vì cú không ngủ bao giờ', 'Vì cú bơi giỏi'], 'Cú có <b>mắt to</b>, <b>tai thính</b>, bay rất êm.'),
      Q('🐸', 'Nòng nọc lớn lên thành con gì?', ['Ếch', 'Cá', 'Rắn', 'Rùa'], 'Nòng nọc mọc chân, rụng đuôi → thành <b>ếch</b>.'),
      Q('🐶', 'Loài nào sau đây là động vật có vú?', ['Chó', 'Cá chép', 'Ếch', 'Thằn lằn'], '<b>Chó</b> đẻ con và nuôi con bằng sữa — động vật có vú.')],
  },
  broom: {
    who: 'Bác Cán Tre', kind: 'student-male-a', look: adult('#8a5a35', '#3a3344', { hair: '#5a4030' }), subj: 'toan',
    lines: ['Chổi ở đây để trang trí và chụp ảnh thôi — bay thật thì phải tốt nghiệp đã!', 'Một cây chổi tốt cần cán thẳng: bác đo bằng thước, sai một li là đi một dặm.', 'Gió thổi từ biển vào đất liền ban ngày, ban đêm thì ngược lại — người bay nào cũng phải thuộc.'],
    qs: [Q('📏', 'Cán chổi dài 1 m 30 cm. Đổi ra xăng-ti-mét là bao nhiêu?', ['130 cm', '13 cm', '103 cm', '1300 cm'], '1 m = 100 cm → 100 + 30 = <b>130 cm</b>.'),
      Q('🧹', 'Bác bó 5 bó chổi, mỗi bó 8 cây. Tất cả có bao nhiêu cây?', ['40', '13', '35', '45'], '5 × 8 = <b>40</b> cây.'),
      Q('📐', 'Hình chữ nhật dài 8 m, rộng 5 m có chu vi bao nhiêu?', ['26 m', '40 m', '13 m', '21 m'], '(8 + 5) × 2 = <b>26 m</b>.')],
  },
  robe: {
    who: 'Cô Kim Chỉ', kind: 'student-female-a', look: adult('#5b3a8e', '#2a2433'), subj: 'khoahoc',
    lines: ['Áo choàng may vừa người, mũ chóp nhọn hợp mọi kiểu tóc!', 'Áo len giữ ấm vì sợi len giữ lại lớp không khí — không khí dẫn nhiệt kém lắm.', 'Thử màu lam đêm xem nào — hợp đi ngắm sao trên tháp thiên văn đấy.'],
    qs: [Q('🧶', 'Vì sao mặc áo len thấy ấm?', ['Sợi len giữ lớp không khí dẫn nhiệt kém', 'Vì len tự nóng lên', 'Vì len có điện', 'Vì len màu sẫm'], 'Lớp <b>không khí</b> giữa các sợi len cách nhiệt, giữ hơi ấm cơ thể.'),
      Q('☀️', 'Trời nắng gắt nên mặc áo màu gì cho mát?', ['Màu sáng', 'Màu đen', 'Màu đỏ sẫm', 'Màu tím than'], 'Màu <b>sáng</b> phản xạ ánh nắng, ít hấp thụ nhiệt.'),
      Q('🐛', 'Sợi tơ tằm do con gì nhả ra?', ['Con tằm', 'Con nhện', 'Con ong', 'Con sâu đo'], 'Tằm ăn lá dâu, nhả <b>tơ</b> làm kén.')],
  },
  bank: {
    who: 'Ông Thủ Kho', kind: 'student-male-a', look: adult('#2c4a3e', '#1f2a2a', { hair: '#9a9a9a' }), subj: 'toan',
    lines: ['Kho báu chỉ mở cho ai giải đúng phép tính. Mỗi ngày 8 lượt, mỗi lượt 5 xu!', 'Tiết kiệm từng xu nhỏ, lâu dần thành kho to — có công mài sắt, có ngày nên kim.', 'Muốn mua đũa, áo choàng hay thú cưng? Giải toán ở đây kiếm xu trước đã nào.'],
    qs: [],
  },
};
