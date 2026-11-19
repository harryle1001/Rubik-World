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
  tea: {
    who: 'Bà Cú Mèo', kind: 'student-female-a', look: adult('#7a4a6a', '#3a2a33', { hair: '#e8e8e8' }), subj: 'khoahoc',
    lines: ['Ngồi xuống đây cháu, trà sen vừa pha. Bà kể chuyện cho mà nghe!', 'Con cú nhà bà tên Mun, con mèo tên Mướp — hai đứa thân nhau lắm.', 'Uống trà phải chờ nguội bớt, nóng quá bỏng lưỡi đấy cháu.'],
    stories: [
      ['Sự tích trầu cau', 'Ngày xưa hai anh em thương nhau, người anh hoá thành <b>cây cau</b>, người em hoá <b>tảng đá vôi</b>, người vợ hoá <b>dây trầu</b>. Từ đó miếng trầu là đầu câu chuyện, tượng trưng cho tình nghĩa.'],
      ['Vì sao lá trà xanh?', 'Lá trà chứa <b>diệp lục</b> giúp cây quang hợp. Khi sao khô nhanh, lá giữ màu xanh (trà xanh); khi để lên men, lá chuyển nâu đỏ (hồng trà).'],
      ['Cú đêm Mun', 'Cú quay đầu được gần <b>270°</b> vì mắt cú không đảo được trong hốc. Lông cánh cú có viền tơ mềm nên bay <b>gần như không tiếng động</b>.'],
      ['Thánh Gióng', 'Cậu bé làng Gióng ăn bảy nong cơm, lớn vụt lên, cưỡi ngựa sắt nhổ tre đánh giặc Ân rồi bay về trời ở núi <b>Sóc Sơn</b>.'],
    ],
    qs: [Q('🍵', 'Nước sôi ở bao nhiêu độ C (ở mực nước biển)?', ['100 °C', '50 °C', '0 °C', '200 °C'], 'Nước tinh khiết sôi ở <b>100 °C</b> khi áp suất bình thường.'),
      Q('🦉', 'Cú thường đi săn vào lúc nào?', ['Ban đêm', 'Giữa trưa', 'Chỉ sáng sớm', 'Không bao giờ săn'], 'Cú là loài <b>săn đêm</b>.'),
      Q('🌿', 'Lá cây có màu xanh nhờ chất gì?', ['Diệp lục', 'Muối', 'Đường', 'Sắt'], '<b>Diệp lục</b> hấp thụ ánh sáng để quang hợp.')],
  },
  map: {
    who: 'Ông La Bàn', kind: 'student-male-a', look: adult('#3a5a6b', '#2a2a33', { hair: '#8a8a8a' }), subj: 'khoahoc',
    lines: ['Kim la bàn luôn chỉ về phương Bắc vì Trái Đất như một thanh nam châm khổng lồ.', 'Việt Nam hình chữ S, có hơn 3.000 km bờ biển đấy cháu.', 'Mặt Trời mọc ở đằng Đông, lặn đằng Tây — mất la bàn vẫn tìm được hướng!'],
    qs: [Q('🧭', 'Kim la bàn chỉ về hướng nào?', ['Hướng Bắc', 'Hướng Nam', 'Hướng Tây', 'Hướng lên trời'], 'Đầu kim nhiễm từ quay về <b>phương Bắc</b> của Trái Đất.'),
      Q('🗺️', 'Thủ đô của Việt Nam là thành phố nào?', ['Hà Nội', 'Đà Nẵng', 'Huế', 'Cần Thơ'], 'Thủ đô là <b>Hà Nội</b>.'),
      Q('🌏', 'Đại dương lớn nhất Trái Đất là?', ['Thái Bình Dương', 'Đại Tây Dương', 'Ấn Độ Dương', 'Bắc Băng Dương'], '<b>Thái Bình Dương</b> rộng nhất, Việt Nam nằm bên bờ biển Đông của nó.'),
      Q('🏔️', 'Đỉnh núi cao nhất Việt Nam là?', ['Phan Xi Păng', 'Bà Đen', 'Bạch Mã', 'Lang Biang'], '<b>Phan Xi Păng</b> (≈ 3.143 m) ở dãy Hoàng Liên Sơn.'),
      Q('☀️', 'Buổi sáng em đứng nhìn về phía Mặt Trời mọc. Sau lưng em là hướng nào?', ['Tây', 'Đông', 'Bắc', 'Nam'], 'Mặt Trời mọc ở Đông → sau lưng là <b>Tây</b>.')],
  },
  clock: {
    who: 'Cụ Tích Tắc', kind: 'student-male-a', look: adult('#6b5a2a', '#2a2433', { hair: '#f0f0f0' }), subj: 'toan',
    lines: ['Tích tắc, tích tắc… 1 giờ có 60 phút, 1 phút có 60 giây.', 'Kim ngắn chỉ giờ, kim dài chỉ phút — nhìn kim ngắn trước nhé!', 'Một ngày có 24 giờ: Trái Đất tự quay đúng một vòng đấy.'],
    qs: [Q('🕒', 'Kim ngắn chỉ số 3, kim dài chỉ số 12. Đồng hồ chỉ mấy giờ?', ['3 giờ', '12 giờ 15', '3 giờ 30', '12 giờ 3'], 'Kim dài ở 12 là đúng giờ, kim ngắn ở 3 → <b>3 giờ</b>.'),
      Q('🕡', 'Kim ngắn nằm giữa số 6 và 7, kim dài chỉ số 6. Mấy giờ?', ['6 giờ 30', '7 giờ 30', '6 giờ 6', '12 giờ 30'], 'Kim dài ở số 6 = 30 phút → <b>6 giờ 30</b>.'),
      Q('⏱️', '1 giờ bằng bao nhiêu phút?', ['60 phút', '100 phút', '24 phút', '30 phút'], '<b>1 giờ = 60 phút</b>.'),
      Q('🕘', 'Kim dài chỉ số 3 là bao nhiêu phút?', ['15 phút', '3 phút', '30 phút', '45 phút'], 'Mỗi số cách nhau 5 phút: 3 × 5 = <b>15 phút</b>.'),
      Q('🌙', 'Em đi ngủ lúc 21 giờ. Theo cách nói buổi tối đó là mấy giờ?', ['9 giờ tối', '11 giờ tối', '7 giờ tối', '1 giờ sáng'], '21 − 12 = <b>9 giờ tối</b>.')],
  },
  fire: {
    who: 'Cô Lửa Hồng', kind: 'student-female-a', look: adult('#b8432a', '#2a2433', { hair: '#3a2a20' }), subj: 'khoahoc',
    lines: ['Pháo hoa ở đây là pháo phép an toàn: không lửa thật, không nổ to — chỉ có màu!', 'Màu pháo hoa thật đến từ kim loại: muối đồng cho xanh lục, stronti cho đỏ, natri cho vàng.', 'Nhớ nhé: pháo thật, lửa, diêm — tuyệt đối không tự nghịch khi không có người lớn.'],
    qs: [Q('🎆', 'Pháo hoa màu vàng có muối của kim loại nào?', ['Natri', 'Đồng', 'Stronti', 'Kali'], 'Muối <b>natri</b> (như muối ăn) cháy cho ánh vàng cam.'),
      Q('🧯', 'Thấy đám cháy nhỏ, việc đầu tiên em nên làm là?', ['Gọi người lớn và tránh xa, gọi 114', 'Lại gần xem', 'Đổ dầu vào', 'Trốn vào tủ'], 'Báo ngay <b>người lớn</b>, tránh xa và gọi cứu hoả <b>114</b>.'),
      Q('🔥', 'Lửa cần chất khí nào để cháy?', ['Ô-xi', 'Ni-tơ', 'Hê-li', 'Hơi nước'], 'Sự cháy cần <b>ô-xi</b> — vì vậy trùm chăn ướt dập được lửa nhỏ.'),
      Q('🟢', 'Muối đồng khi cháy cho ngọn lửa màu gì?', ['Xanh lục', 'Đỏ thẫm', 'Vàng', 'Trắng'], 'Đồng cho lửa <b>xanh lục</b> — thí nghiệm "thử màu ngọn lửa".')],
  },
  music: {
    who: 'Chú Đàn Bầu', kind: 'student-male-a', look: adult('#2a4a6b', '#2a2433', { hair: '#2a2020' }), subj: 'khoahoc',
    lines: ['Đàn ở đây biết hát! Gảy thử một dây xem nào.', 'Âm thanh là dao động: dây càng căng, càng ngắn thì tiếng càng cao.', 'Đàn bầu Việt Nam chỉ có một dây mà chơi được cả bài hát đấy.'],
    qs: [Q('🎵', 'Âm thanh truyền đi được nhờ đâu?', ['Dao động của không khí (sóng âm)', 'Ánh sáng', 'Nam châm', 'Điện'], 'Vật dao động làm <b>không khí</b> rung, truyền thành sóng âm tới tai.'),
      Q('🎸', 'Dây đàn căng hơn thì tiếng đàn thế nào?', ['Cao hơn', 'Trầm hơn', 'Không đổi', 'Tắt hẳn'], 'Dây <b>căng hơn</b> rung nhanh hơn → tiếng <b>cao</b> hơn.'),
      Q('🎼', 'Có mấy nốt nhạc cơ bản: Đô, Rê, Mi, Pha, Son, La, Si?', ['7', '5', '8', '12'], '<b>7 nốt</b> cơ bản, rồi lặp lại ở quãng tám cao hơn.'),
      Q('🪕', 'Nhạc cụ nào là nhạc cụ dân tộc Việt Nam chỉ có một dây?', ['Đàn bầu', 'Đàn piano', 'Kèn trumpet', 'Trống jazz'], '<b>Đàn bầu</b> — một dây, đổi cao độ bằng cần rung.')],
  },
  oldbook: {
    who: 'Bà Mọt Sách', kind: 'student-female-a', look: adult('#4a3a2a', '#2a2433', { hair: '#bdbdbd' }), subj: 'toan',
    lines: ['Sách cũ ở đây biết bay — cuốn nào bay lại gần là nó chọn cháu đấy!', 'Mỗi cuốn sách cũ giấu một câu đố. Mua về, mở túi đồ mà giải nhé.', 'Giữ sách cẩn thận: không gập gáy, không viết bậy, đọc xong để lên giá.'],
    books: [
      ['Sách Đố Số', 'Câu đố mới: dãy số 2, 4, 8, 16, … số tiếp theo?', Q('🔢', 'Dãy số 2, 4, 8, 16, … số tiếp theo là?', ['32', '20', '24', '18'], 'Mỗi số gấp đôi số trước: 16 × 2 = <b>32</b>.')],
      ['Sách Đố Hình', 'Câu đố mới về hình học: hình nào có 3 cạnh?', Q('🔺', 'Hình có 3 cạnh, 3 góc gọi là hình gì?', ['Hình tam giác', 'Hình vuông', 'Hình tròn', 'Hình thoi'], 'Ba cạnh, ba góc là <b>hình tam giác</b>.')],
      ['Sách Đố Chữ', 'Câu đố chữ: “Có cánh mà chẳng biết bay…”', Q('🔤', '“Không cánh mà bay khắp nơi, đưa tin muôn chốn cho người xa xôi” là gì?', ['Lá thư', 'Con chim', 'Đám mây', 'Cái quạt'], 'Đó là <b>lá thư</b> — nay ta có thư điện tử nữa!')],
      ['Sách Đố Sao', 'Câu đố thiên văn: hành tinh nào gần Mặt Trời nhất?', Q('🪐', 'Hành tinh nào gần Mặt Trời nhất?', ['Sao Thuỷ', 'Trái Đất', 'Sao Hoả', 'Sao Mộc'], '<b>Sao Thuỷ</b> gần Mặt Trời nhất, một năm ở đó chỉ 88 ngày.')],
    ],
    qs: [Q('📚', 'Một giá sách có 5 ngăn, mỗi ngăn 8 cuốn. Có bao nhiêu cuốn?', ['40', '13', '45', '35'], '5 × 8 = <b>40</b> cuốn.'),
      Q('📖', 'Cuốn sách dày 120 trang, em đã đọc 45 trang. Còn bao nhiêu trang?', ['75', '85', '65', '165'], '120 − 45 = <b>75</b> trang.')],
  },
  night: {
    who: 'Cô Đom Đóm', kind: 'student-female-a', look: adult('#3a2a6b', '#1f1a33', { hair: '#2a2040' }), subj: 'khoahoc',
    lines: ['Chào mừng đến Hẻm Đêm! Ở đây lúc nào cũng có sao, đừng sợ nhé.', 'Đom đóm phát sáng nhờ phản ứng hoá học trong bụng — ánh sáng lạnh, không nóng chút nào.', 'Nhìn kìa: chòm Bắc Đẩu giống cái gáo múc nước, chỉ đường về sao Bắc Cực.'],
    qs: [Q('✨', 'Đom đóm phát sáng nhờ đâu?', ['Phản ứng hoá học trong cơ thể', 'Pin nhỏ', 'Nuốt ánh trăng', 'Lửa trong bụng'], 'Chất <b>luciferin</b> phản ứng với ô-xi tạo ánh sáng lạnh.'),
      Q('⭐', 'Ngôi sao gần Trái Đất nhất là?', ['Mặt Trời', 'Sao Bắc Cực', 'Sao Hôm', 'Mặt Trăng'], '<b>Mặt Trời</b> là một ngôi sao! (Sao Hôm thật ra là Sao Kim.)'),
      Q('🌑', 'Vì sao ban đêm trời tối?', ['Nơi em ở quay lưng lại Mặt Trời', 'Mặt Trời tắt', 'Mây che hết', 'Mặt Trăng che Mặt Trời'], 'Trái Đất tự quay: nửa <b>quay lưng</b> Mặt Trời là đêm.')],
  },
  bank: {
    who: 'Ông Thủ Kho', kind: 'student-male-a', look: adult('#2c4a3e', '#1f2a2a', { hair: '#9a9a9a' }), subj: 'toan',
    lines: ['Kho báu chỉ mở cho ai giải đúng phép tính. Mỗi ngày 8 lượt, mỗi lượt 5 đồng vàng!', 'Tiết kiệm từng đồng nhỏ, lâu dần thành kho to — có công mài sắt, có ngày nên kim.', 'Muốn mua đũa, áo choàng hay thú cưng? Giải toán ở đây kiếm đồng vàng trước đã nào.'],
    qs: [],
  },
};

// Đố mẹo mở cổng Hẻm Đêm (vui, không đánh đố khó)
export const GATE_RIDDLES = [
  Q('🚪', 'Cái gì càng lấy đi nhiều thì càng to ra?', ['Cái hố', 'Quả bóng', 'Cái bánh', 'Cái áo'], 'Đào đất càng nhiều, <b>cái hố</b> càng to!'),
  Q('🌙', 'Cái gì của em mà người khác dùng nhiều hơn em?', ['Tên của em', 'Cái bút', 'Đôi dép', 'Cái cặp'], 'Mọi người gọi <b>tên em</b> nhiều hơn em tự gọi!'),
  Q('🕯️', 'Cái gì lúc mua thì đen, lúc dùng thì đỏ, lúc bỏ đi thì xám?', ['Hòn than', 'Quả cà chua', 'Cây nến', 'Chiếc lá'], '<b>Than</b>: đen khi mua, cháy đỏ khi dùng, thành tro xám!'),
  Q('🔑', 'Cái gì có cổ mà không có đầu, có tay mà không có ngón?', ['Cái áo', 'Cái chai', 'Con rối', 'Cái ghế'], '<b>Cái áo</b> có cổ áo, tay áo!'),
  Q('🌧️', 'Cái gì đi thì nằm, đứng cũng nằm, nhưng nằm lại đứng?', ['Bàn chân', 'Cái ghế', 'Con rắn', 'Cái thang'], 'Đi, đứng thì <b>bàn chân</b> nằm sát đất; nằm thì bàn chân lại dựng đứng!'),
];
