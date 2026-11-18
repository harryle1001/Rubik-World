// talk.js — DỮ LIỆU HỘI THOẠI 3D (chỉ dữ liệu, không vẽ): tính cách + lời thoại + câu đố/nhiệm vụ nhỏ của 21 bạn & thầy cô,
// lời người dân theo việc đang làm, chủ trò mini game (2–3 câu + 1 câu hỏi đúng chủ đề), thời khoá biểu 3D.
// Dùng bởi teacher-quiz.js (bong bóng thoại) và lessons.js (tiết học). Khoá theo id người của trường (state-agents 2D = data/people.js 3D).
//
// NGUỒN DỮ LIỆU NGƯỜI/BẢN ĐỒ: schoolSource(ctx) — ưu tiên lớp dữ liệu 3D riêng (ctx.schoolData.RS, nhánh claude/up-standalone:
// client/js/island/data/index.js → createSchoolData), nếu chưa có thì đọc window.RS của iframe trường 2D (ctx.school.RS).
// Hai nguồn cùng hình dạng (agents, npcs, R, regionAt, doors) → chuyển nguồn chỉ cần gán ctx.schoolData, không sửa module khác.
export const schoolSource = ctx => (ctx.schoolData && ctx.schoolData.RS) || (ctx.school && ctx.school.RS) || null;

// do: { type:'quiz', subj } · { type:'find', item, name, ask, thanks } · { type:'letter', to, ask, thanks } · { type:'guide', place }
// place = id khu trong R (bản đồ trường) — câu hỏi "đi hướng nào?" tính từ vị trí thật của khu so với người chơi.
export const PERSONA = {
  // ----- thầy cô & nhân viên (8) -----
  ha: { mood: 'hiền, kiên nhẫn', lines: ['Chào em! Cô Hà dạy Rubik đây.', 'Khối Rubik 3×3 có 6 mặt, mỗi mặt 9 ô vuông nhỏ.', 'Giải Rubik cần nhớ thứ tự các bước — giống học Toán vậy!'], do: { type: 'quiz', subj: 'toan' } },
  xuan: { mood: 'nhanh nhẹn, thích sáng chế', lines: ['A, em đến đúng lúc quá!', 'Cô đang làm đèn LED cho lớp lắp ráp điện…', 'mà để quên hộp pin đâu mất rồi.'], do: { type: 'find', item: '🔋', name: 'hộp pin', ask: 'Em tìm giúp cô hộp pin quanh đây nhé?', thanks: 'Cảm ơn em! Pin cung cấp điện, mạch kín thì đèn mới sáng.' } },
  nam: { mood: 'nghiêm, tốt bụng', lines: ['Chú Nam bảo vệ chào cháu!', 'Sang đường nhớ nhìn trái, nhìn phải rồi mới đi.', 'Chú đố cháu biết đường trong trường nào!'], do: { type: 'guide', place: 'field' } },
  mic: { mood: 'vui vẻ, chăm chỉ', lines: ['Mic đây! Sáng nào Mic cũng điểm danh lúc 7 giờ 15.', 'Sổ điểm danh hôm nay xong rồi,', 'nhưng Mic còn phải trông cổng.'], do: { type: 'letter', to: 'ngoc', ask: 'Em mang sổ điểm danh tới cô Ngọc giúp Mic nhé?', thanks: 'Cô nhận được sổ rồi. Em làm việc rất chu đáo!' } },
  ngoc: { mood: 'điềm đạm, hay đi dự giờ', lines: ['Chào em, cô Ngọc đây.', 'Cô vừa dự giờ lớp Tiếng Việt, các bạn đọc rất hay.', 'Em thử trả lời câu này của cô nhé!'], do: { type: 'quiz', subj: 'tv' } },
  lai: { mood: 'cẩn thận, ngăn nắp', lines: ['Cô Lai văn thư chào em.', 'Mỗi ngày cô viết báo cáo và gửi thư cho các phòng.', 'Hôm nay có một lá thư gửi chú Nam bảo vệ.'], do: { type: 'letter', to: 'nam', ask: 'Em đưa thư này cho chú Nam giúp cô được không?', thanks: 'Chú nhận thư rồi, cảm ơn cháu nhé!' } },
  haquan: { mood: 'tò mò, mê quay phim', lines: ['Hà Quân đây! Anh quay video cả trường.', 'Ôi, thẻ nhớ máy quay rơi đâu mất rồi…', 'Không có nó là không lưu được đoạn phim nào!'], do: { type: 'find', item: '💾', name: 'thẻ nhớ', ask: 'Em tìm giúp anh thẻ nhớ quanh đây nhé?', thanks: 'Tìm thấy rồi! Một thẻ nhớ chứa được hàng trăm đoạn phim đấy.' } },
  hung: { mood: 'từng trải, mê biển', lines: ['Chú Hưng lái tàu ngầm đây.', 'Dưới biển có rạn san hô — nhà của rất nhiều loài cá.', 'Đi biển nhớ mặc áo phao nhé!'], do: { type: 'quiz', subj: 'kh' } },
  // ----- 13 bạn học sinh -----
  khang: { mood: 'sôi nổi, mê bóng đá', lines: ['Ê, chào bạn! Mình là Khang.', 'Chiều nay đội mình đá bóng mà…', 'quả bóng lăn đi đâu mất tiêu rồi!'], do: { type: 'find', item: '⚽', name: 'quả bóng', ask: 'Bạn tìm giúp mình quả bóng nha?', thanks: 'Hay quá! Bóng đá mỗi đội 11 người, bạn vào đội mình nhé!' } },
  minh: { mood: 'chăm học, giỏi Toán', lines: ['Chào bạn, mình là Minh.', 'Mình vừa giải xong Rubik trong 2 phút!', 'Mình đố bạn một bài Toán nhé?'], do: { type: 'quiz', subj: 'toan' } },
  quan: { mood: 'hài hước, tốt bụng', lines: ['Hi! Quân đây.', 'Mình mới viết thiệp chúc mừng sinh nhật Minh,', 'nhưng ngại đưa tận tay quá…'], do: { type: 'letter', to: 'minh', ask: 'Bạn đưa thiệp này cho Minh giúp mình nha?', thanks: 'Ôi, thiệp của Quân à? Cảm ơn bạn nhiều nhé!' } },
  triet: { mood: 'gương mẫu, sao đỏ', lines: ['Chào bạn, mình là Triết, sao đỏ của lớp.', 'Sao đỏ nhắc các bạn xếp hàng, giữ vệ sinh.', 'Bạn có biết đường trong trường không?'], do: { type: 'guide', place: 'hall' } },
  thinh: { mood: 'mơ mộng, thích thiên nhiên', lines: ['Chào bạn! Thịnh đây.', 'Mình đang đếm xem có bao nhiêu loài chim trên đảo.', 'Bạn trả lời giúp mình câu này nhé!'], do: { type: 'quiz', subj: 'kh' } },
  bminh: { mood: 'nhút nhát, khéo tay', lines: ['À… chào bạn, mình là Bách Minh.', 'Gió thổi bay mất cái mũ của mình rồi…', 'Mẹ mới mua cho mình đấy.'], do: { type: 'find', item: '🧢', name: 'cái mũ', ask: 'Bạn tìm giúp mình cái mũ được không?', thanks: 'Cảm ơn bạn! Gió là không khí chuyển động, gió mạnh thổi bay cả mũ.' } },
  uyen: { mood: 'lớp trưởng, quyết đoán', lines: ['Chào bạn! Mình là Mỹ Uyên, lớp trưởng.', 'Mình gom xong bài tập của cả lớp rồi,', 'cần nộp cho cô Xuân trước giờ học.'], do: { type: 'letter', to: 'xuan', ask: 'Bạn mang tập bài này tới cô Xuân giúp mình nhé?', thanks: 'Cô nhận bài rồi. Cảm ơn em đã giúp lớp trưởng!' } },
  thien: { mood: 'thích kể chuyện lịch sử', lines: ['Chào bạn, Anh Thiện đây.', 'Mình mê nghe chuyện các vua Hùng và Hai Bà Trưng.', 'Đố bạn câu Lịch sử – Địa lý nè!'], do: { type: 'quiz', subj: 'lsdl' } },
  pbach: { mood: 'mê đọc truyện', lines: ['Chào bạn! Phạm Bách đây.', 'Mình vừa đọc xong "Dế Mèn phiêu lưu ký".', 'Bạn thử câu Tiếng Việt này nhé!'], do: { type: 'quiz', subj: 'tv' } },
  hbach: { mood: 'hơi đãng trí', lines: ['Ơ, chào bạn. Hoàng Bách đây.', 'Mình làm rơi hộp bút trên đường đi học…', 'Trong đó có cả cây bút mực mới!'], do: { type: 'find', item: '✏️', name: 'hộp bút', ask: 'Bạn tìm giúp mình hộp bút nha?', thanks: 'Cảm ơn bạn! Lần sau mình sẽ kéo khoá cặp cẩn thận.' } },
  nminh: { mood: 'thích câu cá', lines: ['Chào bạn! Nhật Minh đây.', 'Cuối tuần mình hay ra hồ câu cá với bố.', 'Bạn có biết hồ câu ở đâu không?'], do: { type: 'guide', place: 'pond' } },
  binh: { mood: 'nhanh trí, thích thử thách', lines: ['Yo! Khải Bình đây.', 'Mình tính nhẩm nhanh nhất lớp đấy!', 'Thử đấu một câu Toán với mình nào!'], do: { type: 'quiz', subj: 'toan' } },
  bich: { mood: 'dịu dàng, hay giúp bạn', lines: ['Chào bạn, mình là Bích.', 'Mình làm tặng cô Hà một bông hoa giấy,', 'nhưng cô đang bận dạy.'], do: { type: 'letter', to: 'ha', ask: 'Bạn mang hoa giấy tới cô Hà giúp mình nhé?', thanks: 'Hoa đẹp quá! Cô cảm ơn Bích và em nhé.' } },
};
// người dân / khách (RS.npcs, theo việc đang làm): 2–3 câu + hỏi đường (khách mới tới đảo hay hỏi đường)
export const KIND_PERSONA = {
  swim: { lines: ['Nước biển hôm nay mát lắm!', 'Nhớ bơi ở chỗ có cờ báo an toàn nhé.'], do: { type: 'quiz', subj: 'kh' } },
  surf: { lines: ['Sóng đẹp quá!', 'Sóng biển do gió thổi trên mặt nước tạo ra đấy.'], do: { type: 'quiz', subj: 'kh' } },
  sun: { lines: ['Chào cháu! Cô là khách du lịch.', 'Cô mới tới đảo lần đầu, đẹp quá!', 'Mà cô bị lạc đường rồi…'], do: { type: 'guide', place: 'beach' } },
  bike: { lines: ['Đạp xe quanh đảo thích lắm!', 'Đạp xe vừa khoẻ vừa không khói bụi.'], do: { type: 'guide', place: 'field' } },
  camp: { lines: ['Bọn mình đang cắm trại!', 'Tối nay sẽ ngắm sao.'], do: { type: 'guide', place: 'lake' } },
  picnic: { lines: ['Cả nhà bác đi dã ngoại.', 'Ăn xong nhớ nhặt rác bỏ vào thùng nhé!'], do: { type: 'guide', place: 'giantchess' } },
  fishing: { lines: ['Suỵt… cá sắp cắn câu rồi.', 'Câu cá phải kiên nhẫn cháu ạ.'], do: { type: 'quiz', subj: 'kh' } },
  walk: { lines: ['Chào cháu, đi dạo buổi này dễ chịu quá.', 'Bác muốn ghé chơi một chỗ mà quên đường.'], do: { type: 'guide', place: 'rubikpark' } },
  kite: { lines: ['Diều bay cao chưa kìa!', 'Diều bay được là nhờ gió đẩy lên.'], do: { type: 'quiz', subj: 'kh' } },
};
const SUBJ = ['toan', 'tv', 'kh', 'lsdl'];
const hash = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
// Người không có trong bảng: lời chào theo vai + câu đố môn cố định theo tên
const GENERIC = { teacher: ['Chào em!', 'Hôm nay em học bài chưa?'], student: ['Chào bạn!', 'Ra chơi rồi, vui ghê!'], adult: ['Chào cháu!', 'Trời hôm nay đẹp nhỉ.'] };
export function personaOf(n) {
  return (n.id && PERSONA[n.id]) || (n.kind && KIND_PERSONA[n.kind]) || { lines: GENERIC[n.role] || GENERIC.adult, do: { type: 'quiz', subj: SUBJ[hash(n.name) % 4] } };
}
// Tên khu cho câu hỏi dẫn đường
export const PLACES = { field: 'Sân bóng đá', hall: 'Hội trường lớn', pond: 'Hồ câu thư giãn', beach: 'Bãi biển', lake: 'Hồ cá Koi', giantchess: 'Quảng trường cờ vua khổng lồ', rubikpark: 'Tượng đài Rubik', farm: 'Nông trại' };

// ---------- Chủ trò mini game: khoá game (mg/host.js DOOR_KEYS) → người dẫn + 2–3 câu + 1 câu hỏi (đáp án đúng ở c[a]) ----------
const Q = (q, c, a, e) => ({ q, c, a, e });
export const GAME_INTRO = {
  rubik: { host: 'Cô Lan', lines: ['Chào mừng em tới Phòng Rubik 3D!', 'Mỗi lần xoay, một mặt quay 90° — tức là 1/4 vòng.'], q: Q('Xoay một mặt Rubik 4 lần, mỗi lần 90°. Tổng cộng bao nhiêu độ?', ['360°', '180°', '270°', '90°'], 0, '4 × 90° = 360° = 1 vòng tròn, mặt Rubik về đúng chỗ cũ.') },
  chess: { host: 'Thầy Đức', lines: ['Cờ vua rèn trí nhớ và sự kiên nhẫn.', 'Bàn cờ có 8 hàng và 8 cột.'], q: Q('Bàn cờ vua có bao nhiêu ô?', ['64 ô', '32 ô', '81 ô', '48 ô'], 0, '8 × 8 = 64 ô: 32 ô trắng và 32 ô đen.') },
  caro: { host: 'Bạn trọng tài', lines: ['Cờ caro dễ chơi mà khó thắng!', 'Nhớ chặn đầu đối thủ nhé.'], q: Q('Cờ caro thắng khi có mấy quân liền một hàng?', ['5 quân', '3 quân', '4 quân', '6 quân'], 0, 'Xếp 5 quân liền nhau theo hàng ngang, dọc hoặc chéo là thắng.') },
  go: { host: 'Ông Tư', lines: ['Cờ vây là trò chơi bao vây lãnh thổ.', 'Quân đen luôn đi trước.'], q: Q('Bàn cờ vây tiêu chuẩn có bao nhiêu đường ngang?', ['19', '8', '10', '15'], 0, 'Bàn cờ vây chuẩn có 19 × 19 đường kẻ.') },
  olympics: { host: 'Thầy thể dục', lines: ['Thế vận hội Rubik có 5 môn thi!', 'Khởi động kỹ trước khi chạy nhé.'], q: Q('Lá cờ Thế vận hội (Olympic) có mấy vòng tròn?', ['5 vòng', '4 vòng', '6 vòng', '3 vòng'], 0, '5 vòng tròn đan nhau tượng trưng cho 5 châu lục đoàn kết.') },
  fishing: { host: 'Bác câu cá', lines: ['Câu cá cần kiên nhẫn cháu ạ.', 'Cá còn nhỏ thì thả lại hồ cho cá lớn lên.'], q: Q('Cá thở bằng bộ phận nào?', ['Mang', 'Phổi', 'Da', 'Vây'], 0, 'Cá lấy khí ôxi hoà tan trong nước qua mang.') },
  'fishing-boat': { host: 'Chú lái thuyền', lines: ['Lên thuyền phải mặc áo phao nhé!', 'Ngoài biển có cá to lắm.'], q: Q('Nước biển có vị gì?', ['Mặn', 'Ngọt', 'Chua', 'Đắng'], 0, 'Nước biển mặn vì có muối hoà tan, chủ yếu là muối ăn.') },
  library: { host: 'Cô Thư', lines: ['Thư viện có hàng nghìn cuốn sách.', 'Đọc sách giúp em giỏi Tiếng Việt hơn.'], q: Q('"Dế Mèn phiêu lưu ký" là tác phẩm của nhà văn nào?', ['Tô Hoài', 'Nam Cao', 'Kim Lân', 'Nguyễn Du'], 0, 'Nhà văn Tô Hoài viết "Dế Mèn phiêu lưu ký" năm 1941.') },
  reader: { host: 'Người Thầy Ánh Sáng', lines: ['Chào em, hôm nay ta cùng nghe đọc truyện.', 'Nghe kỹ để kể lại cho bạn nhé.'], q: Q('Từ nào là từ chỉ sự vật?', ['Quyển sách', 'Chạy', 'Đẹp', 'Nhanh'], 0, '"Quyển sách" là sự vật; "chạy" chỉ hoạt động; "đẹp, nhanh" chỉ đặc điểm.') },
  music: { host: 'Chị Mai', lines: ['Phòng nhạc có piano, guitar và trống.', 'Âm nhạc giúp mình vui và nhớ bài lâu hơn.'], q: Q('Có bao nhiêu nốt nhạc cơ bản (Đô, Rê, Mi…)?', ['7 nốt', '5 nốt', '8 nốt', '12 nốt'], 0, '7 nốt: Đô – Rê – Mi – Pha – Son – La – Si.') },
  art: { host: 'Cô hoạ sĩ', lines: ['Hôm nay mình vẽ tranh phong cảnh!', 'Pha màu đúng là tranh sẽ sinh động.'], q: Q('Trộn màu vàng với màu xanh lam được màu gì?', ['Xanh lá cây', 'Tím', 'Cam', 'Hồng'], 0, 'Vàng + xanh lam = xanh lá cây. Đỏ + vàng = cam.') },
  'art-music': { host: 'Chị Mai', lines: ['Xưởng này vừa vẽ tranh vừa chơi nhạc.', 'Em thích vẽ hay hát hơn?'], q: Q('Trộn màu đỏ với màu vàng được màu gì?', ['Cam', 'Tím', 'Xanh lá', 'Nâu'], 0, 'Đỏ + vàng = cam; đỏ + xanh lam = tím.') },
  football: { host: 'Huấn luyện viên', lines: ['Bóng đá cần cả đội phối hợp.', 'Chuyền bóng cho bạn là bí quyết thắng.'], q: Q('Một đội bóng đá sân lớn có bao nhiêu cầu thủ trên sân?', ['11', '7', '9', '5'], 0, '11 cầu thủ, trong đó có 1 thủ môn.') },
  basketball: { host: 'Huấn luyện viên', lines: ['Ném rổ cần nhìn kỹ và nhún chân.', 'Ném xa thì được nhiều điểm hơn!'], q: Q('Cú ném vào rổ từ ngoài vạch 3 điểm được mấy điểm?', ['3 điểm', '2 điểm', '1 điểm', '4 điểm'], 0, 'Ngoài vạch 3 điểm: 3 điểm; trong vạch: 2 điểm; ném phạt: 1 điểm.') },
  skate: { host: 'Anh trượt ván', lines: ['Trượt ván vui nhưng phải an toàn.', 'Ngã là chuyện bình thường, đứng dậy thử lại!'], q: Q('Khi trượt ván, em cần đội gì để bảo vệ đầu?', ['Mũ bảo hiểm', 'Mũ lưỡi trai', 'Khăn quàng', 'Kính râm'], 0, 'Mũ bảo hiểm bảo vệ đầu khi ngã; nên đeo cả bảo vệ gối, khuỷu tay.') },
  patin: { host: 'Chị patin', lines: ['Patin giúp em giữ thăng bằng giỏi hơn.', 'Hơi khuỵu gối để không bị ngã.'], q: Q('Khi trượt patin, em cần đội gì để bảo vệ đầu?', ['Mũ bảo hiểm', 'Mũ len', 'Băng đô', 'Kính bơi'], 0, 'Luôn đội mũ bảo hiểm và đeo bảo vệ gối, khuỷu tay khi trượt.') },
  ski: { host: 'Chú trượt tuyết', lines: ['Sân tuyết lạnh lắm, mặc ấm nhé!', 'Tuyết rơi khi trời rất lạnh.'], q: Q('Tuyết là nước ở thể nào?', ['Thể rắn', 'Thể lỏng', 'Thể khí', 'Không phải nước'], 0, 'Hơi nước đông lại dưới 0 °C thành tinh thể băng — đó là tuyết (thể rắn).') },
  kart: { host: 'Trọng tài đua xe', lines: ['Đua xe phải giữ làn đường!', 'Ngoài đường thật thì nhớ luật giao thông.'], q: Q('Đèn giao thông màu nào báo phải dừng lại?', ['Đỏ', 'Xanh', 'Vàng', 'Trắng'], 0, 'Đèn đỏ: dừng lại; đèn vàng: chậm lại; đèn xanh: được đi.') },
  'animal-race': { host: 'Bác nuôi thú', lines: ['Các bạn thú đã sẵn sàng!', 'Mỗi con vật chạy nhanh chậm khác nhau.'], q: Q('Con vật nào chạy nhanh nhất trên cạn?', ['Báo săn', 'Voi', 'Rùa', 'Bò'], 0, 'Báo săn chạy được khoảng 100 km/giờ trong quãng ngắn.') },
  balloon: { host: 'Chú phi công khinh khí cầu', lines: ['Khinh khí cầu bay lên rất êm.', 'Chú đốt lửa để làm nóng không khí trong khí cầu.'], q: Q('Vì sao khinh khí cầu bay lên được?', ['Không khí nóng nhẹ hơn không khí lạnh', 'Nhờ cánh quạt', 'Nhờ nam châm', 'Vì gió thổi từ dưới'], 0, 'Không khí nóng nở ra, nhẹ hơn không khí lạnh xung quanh nên đẩy khí cầu lên.') },
  arcade: { host: 'Anh chủ khu trò chơi', lines: ['Khu trò chơi có cả bắn bóng phép tính!', 'Tính nhẩm nhanh là thắng.'], q: Q('7 × 8 bằng bao nhiêu?', ['56', '54', '48', '63'], 0, '7 × 8 = 56 (mẹo: 5, 6, 7, 8 → 56 = 7 × 8).') },
  academy: { host: 'Cô Xuân', lines: ['Học viện có pin, dây điện và bóng đèn.', 'Hôm nay mình lắp mạch cho đèn sáng!'], q: Q('Muốn bóng đèn sáng, mạch điện phải như thế nào?', ['Mạch kín', 'Mạch hở', 'Đứt dây', 'Không cần pin'], 0, 'Dòng điện chỉ chạy khi mạch kín: pin → dây → đèn → quay về pin.') },
  telescope: { host: 'Chú thiên văn', lines: ['Kính viễn vọng giúp nhìn rõ các vì sao.', 'Trời tối, không mây là ngắm đẹp nhất.'], q: Q('Hành tinh nào gần Mặt Trời nhất?', ['Sao Thủy', 'Sao Kim', 'Trái Đất', 'Sao Hỏa'], 0, 'Thứ tự từ Mặt Trời: Thủy, Kim, Trái Đất, Hỏa, Mộc, Thổ, Thiên Vương, Hải Vương.') },
  zen: { host: 'Sư thầy', lines: ['Ngồi thẳng lưng, thả lỏng vai.', 'Hít vào chậm… thở ra chậm…'], q: Q('Hít thở chậm và sâu giúp em điều gì?', ['Bình tĩnh, tập trung hơn', 'Chạy nhanh hơn', 'Cao lên', 'Đói bụng hơn'], 0, 'Thở chậm giúp tim đập đều, đầu óc bình tĩnh và tập trung học tốt hơn.') },
  garden: { host: 'Bác làm vườn', lines: ['Vườn này trồng rau, hoa và cây ăn quả.', 'Tưới nước buổi sáng hoặc chiều mát nhé.'], q: Q('Cây xanh cần gì để quang hợp?', ['Ánh sáng, nước và khí cacbonic', 'Chỉ cần đất', 'Bóng tối', 'Muối'], 0, 'Lá cây dùng ánh sáng, nước, khí cacbonic để tạo chất dinh dưỡng và nhả khí ôxi.') },
};

// ---------- Thời khoá biểu 3D (Thứ 2 … Thứ 6; Thứ 7 sự kiện, Chủ nhật nghỉ) ----------
// Tiết 1 giữ như game 2D (nhóm A Rubik / nhóm B lắp ráp điện, mở bằng cửa lớp); tiết 2–4 là môn văn hoá học ngay trong lớp 3D.
// Giờ (phút trong ngày): 45 phút/tiết, ra chơi 30 phút. Phòng: id khu trong R của bản đồ trường.
export const PERIODS = [[450, 495, 'Tiết 1'], [495, 540, 'Tiết 2'], [570, 615, 'Tiết 3'], [615, 660, 'Tiết 4']];
export const BREAKS = [[390, 450, 'Đến trường · điểm danh'], [540, 570, 'Ra chơi'], [660, 780, 'Ăn trưa & ngủ trưa'], [780, 870, 'Câu lạc bộ'], [870, 960, 'Giờ ra biển'], [960, 1050, 'Tan học']];
export const TIMETABLE = [   // index = thứ (0 = Thứ 2)
  ['rubikdien', 'toan', 'tv', 'kh'],
  ['rubikdien', 'tv', 'toan', 'lsdl'],
  ['rubikdien', 'toan', 'kh', 'tv'],
  ['rubikdien', 'tv', 'lsdl', 'toan'],
  ['rubikdien', 'toan', 'tv', 'lsdl'],
];
export const LESSON = {
  rubikdien: { name: 'Rubik / Lắp ráp điện', icon: '🧊', room: null },
  toan: { name: 'Toán', icon: '➗', room: 'rubik', teacher: 'Cô Hà' },
  tv: { name: 'Tiếng Việt', icon: '📖', room: 'hall', teacher: 'Cô Ngọc' },
  kh: { name: 'Khoa học', icon: '🔬', room: 'elec', teacher: 'Cô Xuân' },
  lsdl: { name: 'Lịch sử – Địa lý', icon: '🌏', room: 'hall', teacher: 'Cô Ngọc' },
};
export const ROOM_NAME = { rubik: 'Lớp Rubik', hall: 'Hội trường lớn', elec: 'Lớp lắp ráp điện' };
