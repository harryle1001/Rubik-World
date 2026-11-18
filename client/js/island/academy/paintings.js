// academy/paintings.js — TRANH BIẾT CỬ ĐỘNG: 20 khung tranh (16 chân dung nhà khoa học / danh nhân + 4 phong cảnh Việt Nam)
// treo trong đại sảnh (7), thư viện (5) và hành lang quanh Sân Đại Sảnh (8). Nhân vật chớp mắt, quay đầu nhìn theo em,
// vẫy tay, đổi tư thế; phong cảnh có mây trôi, sóng vỗ, thác đổ, sao nhấp nháy. Lại gần ≤ 5 m: tranh "thức dậy", chào,
// kể 1 điều thú vị và đố 1 câu (Toán · Khoa học · Lịch sử · Địa lý) — đúng +13 năng lượng phép. Đêm: tranh sáng nhẹ.
// Hiệu năng: 2 draw call (khung gộp 1 mesh + tranh InstancedMesh), 1 texture atlas canvas 2048 × 1144;
// chỉ vẽ lại ô của tranh trong 21 m (≤ 2 ô/khung, 5–9 khung/giây), tải lên GPU đúng ô đó (copyTextureToTexture).
// Tỷ lệ: chân dung 1,3 × 2,1 m (φ) · phong cảnh 3,4 × 2,1 · 2,6 × 1,6 · tranh lớn đại sảnh 5,5 × 3,4 · viền 13 / 21 cm · ô atlas 256 × 414 (φ).
import * as THREE from 'three';
import { Batch } from './geo.js';
import { matV } from '../sample/palette.js';

const PHI = 1.618, AW = 2048, AH = 1144;
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const Q = (q, choices, explain) => ({ q, choices, a: 0, explain });
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const _c = new THREE.Color();
const shade = (hex, f) => '#' + _c.set(hex).multiplyScalar(f).getHexString();

// ---------- nội dung: chân dung (nguyên bản, vẽ cách điệu low-poly) ----------
// hair: topknot | wig | wild | bun | curly | short | side · hat: mu (mũ cánh chuồn) | khan (khăn đóng) · beard: long | goatee | full | stache
// cloth: ao | coat | lab | dress | toga · prop: đồ vật cầm trên tay · bg: [tối, sáng] · fx: nền đặc biệt
const PEOPLE = [
  { name: 'Chu Văn An', yrs: '1292 – 1370', skin: '#e6b48a', hair: 'topknot', hc: '#cfcac0', beard: ['long'], bc: '#ece8df', cloth: 'ao', cc: '#2f3f66', trim: '#d4a24a', prop: 'book', pc: '#7a3b2e', bg: ['#2a3a30', '#56705c'],
    hi: 'Chào trò nhỏ! Ta là thầy giáo Chu Văn An.', fact: 'Ta từng dạy ở <b>Quốc Tử Giám</b> — được coi là trường đại học đầu tiên của Việt Nam (lập năm 1076).',
    q: Q('🏛️ Văn Miếu – Quốc Tử Giám ở thành phố nào?', ['Hà Nội', 'Huế', 'Đà Nẵng', 'Cần Thơ'], 'Văn Miếu – Quốc Tử Giám ở <b>Hà Nội</b>, có 82 tấm bia tiến sĩ đặt trên lưng rùa đá.') },
  { name: 'Isaac Newton', yrs: '1643 – 1727', skin: '#f0c8a8', hair: 'wig', hc: '#dcd6ca', cloth: 'coat', cc: '#5a2630', tie: 'cravat', prop: 'apple', bg: ['#2c2236', '#6a5478'],
    hi: 'Xin chào! Ta là Isaac Newton.', fact: 'Ta chiếu ánh sáng trắng qua <b>lăng kính</b> và thấy nó tách ra thành 7 màu cầu vồng!',
    q: Q('🍎 Lực nào làm quả táo rơi xuống đất?', ['Lực hấp dẫn (trọng lực)', 'Lực ma sát', 'Lực từ của nam châm', 'Lực đẩy của gió'], 'Trái Đất hút mọi vật về phía nó — đó là <b>lực hấp dẫn</b>.') },
  { name: 'Lương Thế Vinh', yrs: '1441 – 1496', skin: '#e3b086', hat: 'mu', hair: 'short', hc: '#1f1c1c', beard: ['stache', 'goatee'], bc: '#2a2522', cloth: 'ao', cc: '#7a2e2a', trim: '#d4a24a', prop: 'abacus', bg: ['#3a2a1e', '#7a5a3c'],
    hi: 'Chào em! Ta là Trạng Lường Lương Thế Vinh.', fact: 'Ta viết sách toán <b>"Đại thành toán pháp"</b>. Muốn biết tờ giấy dày bao nhiêu, ta đo cả xấp rồi chia cho số tờ!',
    q: Q('📏 Một xấp 100 tờ giấy dày 1 cm. Mỗi tờ dày bao nhiêu?', ['0,1 mm', '1 mm', '0,01 mm', '1 cm'], '1 cm = 10 mm; 10 mm : 100 = <b>0,1 mm</b>.') },
  { name: 'Marie Curie', yrs: '1867 – 1934', skin: '#f2cfb4', hair: 'bun', hc: '#6b4a35', cloth: 'dress', cc: '#26262e', prop: 'flask', bg: ['#1e2630', '#4b5d6e'],
    hi: 'Chào em, nhà khoa học nhí!', fact: 'Ta là người đầu tiên đoạt <b>2 giải Nobel</b> ở 2 môn khác nhau: Vật lý và Hoá học.',
    q: Q('🧪 Nước tinh khiết sôi ở bao nhiêu độ C (ở mực nước biển)?', ['100 °C', '50 °C', '0 °C', '200 °C'], 'Nước sôi ở <b>100 °C</b> và đông thành đá ở 0 °C.') },
  { name: 'Nguyễn Trãi', yrs: '1380 – 1442', skin: '#e0ac82', hat: 'khan', hc: '#1f1c1c', beard: ['stache', 'long'], bc: '#2b2724', cloth: 'ao', cc: '#3f5f4f', trim: '#d4a24a', prop: 'scroll', bg: ['#3a2c1e', '#7a6446'],
    hi: 'Chào cháu! Ta là Nguyễn Trãi.', fact: 'Ta viết <b>"Bình Ngô đại cáo"</b> và <b>"Dư địa chí"</b> — cuốn sách địa lý về đất nước ta.',
    q: Q('📜 "Bình Ngô đại cáo" ra đời sau thắng lợi của cuộc khởi nghĩa nào?', ['Khởi nghĩa Lam Sơn', 'Khởi nghĩa Tây Sơn', 'Khởi nghĩa Hai Bà Trưng', 'Khởi nghĩa Bà Triệu'], 'Khởi nghĩa <b>Lam Sơn</b> do Lê Lợi lãnh đạo; Nguyễn Trãi là quân sư.') },
  { name: 'Albert Einstein', yrs: '1879 – 1955', skin: '#efc4a2', hair: 'wild', hc: '#f1efe9', beard: ['stache'], bc: '#e9e6df', cloth: 'coat', cc: '#5b5f6a', prop: 'chalk', bg: ['#1c2e25', '#2f4a3c'], fx: 'board',
    hi: 'Ha! Chào em, ta là Albert Einstein.', fact: 'Ánh sáng nhanh nhất vũ trụ: khoảng <b>300 000 km mỗi giây</b> — đi quanh Trái Đất hơn 7 vòng chỉ trong 1 giây!',
    q: Q('☀️ Ánh sáng Mặt Trời tới Trái Đất mất khoảng bao lâu?', ['8 phút', '8 giây', '8 giờ', '8 ngày'], 'Mặt Trời cách ta khoảng 150 triệu km, ánh sáng đi mất <b>khoảng 8 phút</b>.') },
  { name: 'Lê Quý Đôn', yrs: '1726 – 1784', skin: '#e4b289', hat: 'mu', hair: 'short', hc: '#1f1c1c', beard: ['stache', 'goatee'], bc: '#26221f', cloth: 'ao', cc: '#2e4f7a', trim: '#d4a24a', prop: 'book', pc: '#2e5a4a', bg: ['#33261c', '#6e5440'],
    hi: 'Chào em! Ta là nhà bác học Lê Quý Đôn.', fact: 'Ta viết <b>"Vân đài loại ngữ"</b> — như một cuốn bách khoa về trời, đất, cây cỏ và con người.',
    q: Q('⛰️ Đỉnh núi cao nhất Việt Nam là đỉnh nào?', ['Phan Xi Păng', 'Bà Đen', 'Ngọc Linh', 'Tây Côn Lĩnh'], '<b>Phan Xi Păng</b> (3 143 m) ở dãy Hoàng Liên Sơn, được gọi là "nóc nhà Đông Dương".') },
  { name: 'Galileo Galilei', yrs: '1564 – 1642', skin: '#ecbf9c', hair: 'side', hc: '#8a7a6a', beard: ['full'], bc: '#8a6248', cloth: 'coat', cc: '#2b2b33', tie: 'collar', prop: 'scope', bg: ['#0f1430', '#2c3566'], fx: 'jupiter',
    hi: 'Buona sera! Ta là Galileo.', fact: 'Năm 1610 ta hướng kính thiên văn lên trời và thấy <b>4 mặt trăng</b> quay quanh Sao Mộc — xem nền tranh này!',
    q: Q('🪐 Hành tinh lớn nhất trong hệ Mặt Trời là?', ['Sao Mộc', 'Trái Đất', 'Sao Hỏa', 'Sao Thủy'], '<b>Sao Mộc</b> to đến mức chứa vừa hơn 1 000 Trái Đất.') },
  { name: 'Hải Thượng Lãn Ông', yrs: '1720 – 1791', skin: '#dfaa80', hair: 'topknot', hc: '#d8d3ca', beard: ['stache', 'long'], bc: '#ece8df', cloth: 'ao', cc: '#6e5a3a', trim: '#c9a24a', prop: 'herb', bg: ['#22382a', '#587a52'],
    hi: 'Chào cháu ngoan! Ta là thầy thuốc Lãn Ông.', fact: 'Ta viết bộ sách y học <b>"Hải Thượng y tông tâm lĩnh"</b> và luôn dạy: phòng bệnh hơn chữa bệnh.',
    q: Q('🍊 Loại quả nào giàu vitamin C, giúp cơ thể khoẻ, ít ốm?', ['Cam', 'Bánh quy', 'Thịt mỡ', 'Kẹo ngọt'], 'Cam, bưởi, ổi… giàu <b>vitamin C</b>, giúp tăng sức đề kháng.') },
  { name: 'Ada Lovelace', yrs: '1815 – 1852', skin: '#f4d3bd', hair: 'curly', hc: '#3a2a22', cloth: 'dress', cc: '#5a3d78', prop: 'card', bg: ['#221f34', '#55507a'],
    hi: 'Chào em! Ta là Ada Lovelace.', fact: 'Ta viết các bước tính cho <b>chiếc máy tính đầu tiên</b> — nhiều người gọi ta là lập trình viên đầu tiên.',
    q: Q('💻 Máy tính lưu mọi thứ bằng hệ nhị phân, chỉ dùng hai chữ số nào?', ['0 và 1', '1 và 2', '0 và 9', '5 và 10'], 'Hệ nhị phân chỉ có <b>0 và 1</b> — như công tắc tắt / bật.') },
  { name: 'Archimedes', yrs: '~287 – 212 TCN', skin: '#d9a47a', hair: 'short', laurel: 1, hc: '#bdb8ae', beard: ['full'], bc: '#cfcac0', cloth: 'toga', cc: '#efe8d8', trim: '#b0503a', prop: 'crown', bg: ['#2a4558', '#6a8ea0'],
    hi: 'Eureka! Chào em, ta là Archimedes.', fact: 'Đang tắm, ta nhận ra vật nhúng trong nước được nước <b>đẩy lên</b> — mừng quá, ta reo "Eureka!" (Tìm ra rồi!).',
    q: Q('⛵ Vì sao con thuyền nổi được trên mặt nước?', ['Nước đẩy thuyền lên', 'Thuyền nhẹ như lông chim', 'Gió giữ thuyền lại', 'Cá đỡ thuyền'], 'Nước đẩy vật lên bằng <b>lực đẩy Ác-si-mét</b>; thân thuyền rỗng chiếm nhiều chỗ nước nên được đẩy mạnh.') },
  { name: 'Tôn Thất Tùng', yrs: '1912 – 1982', skin: '#e6b590', hair: 'short', hc: '#3a3532', glasses: 1, cloth: 'lab', cc: '#f2f2ee', tie: 'tie', prop: 'stetho', bg: ['#203a40', '#4f7a80'],
    hi: 'Chào em! Ta là bác sĩ Tôn Thất Tùng.', fact: 'Ta tìm ra cách mổ gan nhanh và an toàn — thế giới gọi là <b>"phương pháp Tôn Thất Tùng"</b>.',
    q: Q('🩺 Cơ quan nào lớn nhất bên trong cơ thể người?', ['Gan', 'Tim', 'Thận', 'Dạ dày'], '<b>Gan</b> nặng khoảng 1,5 kg, giúp lọc chất độc và tiêu hoá chất béo.') },
  { name: 'Charles Darwin', yrs: '1809 – 1882', skin: '#f0c6a6', hair: 'side', hc: '#e9e6df', beard: ['full'], bc: '#ecebe6', big: 1, cloth: 'coat', cc: '#2f2a26', tie: 'collar', prop: 'bird', bg: ['#22382c', '#5f8a5e'],
    hi: 'Chào nhà thám hiểm nhỏ! Ta là Darwin.', fact: 'Ta đi tàu Beagle vòng quanh thế giới 5 năm và thấy <b>chim sẻ mỗi đảo có mỏ khác nhau</b>.',
    q: Q('🐦 Quần đảo Galápagos nằm ở đại dương nào?', ['Thái Bình Dương', 'Đại Tây Dương', 'Ấn Độ Dương', 'Bắc Băng Dương'], 'Galápagos ở <b>Thái Bình Dương</b>, ngoài khơi Ê-cu-a-đo.') },
  { name: 'Lương Định Của', yrs: '1920 – 1975', skin: '#e2b089', hair: 'short', hc: '#1f1c1c', glasses: 1, cloth: 'coat', cc: '#4f5a46', tie: 'collar', prop: 'rice', bg: ['#4a4a22', '#9a9446'],
    hi: 'Chào em! Ta là nhà nông học Lương Định Của.', fact: 'Ta lai tạo nhiều <b>giống lúa năng suất cao</b> để bà con nông dân có thêm thóc gạo.',
    q: Q('🌾 Vùng nào là "vựa lúa" lớn nhất Việt Nam?', ['Đồng bằng sông Cửu Long', 'Tây Nguyên', 'Tây Bắc', 'Duyên hải Nam Trung Bộ'], '<b>Đồng bằng sông Cửu Long</b> làm ra hơn một nửa sản lượng lúa cả nước.') },
  { name: 'Pythagoras', yrs: '~570 – 495 TCN', skin: '#d8a37a', hair: 'short', hc: '#e3ded5', beard: ['full'], bc: '#ece8df', cloth: 'toga', cc: '#f2ecdf', trim: '#3a6aa0', prop: 'tri', bg: ['#3e2a1e', '#9a6a46'],
    hi: 'Chào em! Ta là Pythagoras, người yêu những con số.', fact: 'Trong tam giác vuông: <b>a² + b² = c²</b> — bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông.',
    q: Q('📐 Tam giác vuông có hai cạnh góc vuông 3 cm và 4 cm. Cạnh huyền dài bao nhiêu?', ['5 cm', '7 cm', '6 cm', '12 cm'], '3² + 4² = 9 + 16 = 25 = 5² → cạnh huyền <b>5 cm</b>.') },
  { name: 'Alexandre Yersin', yrs: '1863 – 1943', skin: '#f0c6a6', hair: 'short', hc: '#6a5544', beard: ['full'], bc: '#7a6450', cloth: 'lab', cc: '#f2f2ee', tie: 'collar', prop: 'micro', bg: ['#1f3a46', '#4f7a86'],
    hi: 'Chào em! Ta là bác sĩ Yersin, người yêu Nha Trang.', fact: 'Ta tìm ra <b>vi khuẩn gây bệnh dịch hạch</b> (1894) và tìm ra cao nguyên nơi có thành phố Đà Lạt ngày nay.',
    q: Q('🌲 Thành phố Đà Lạt thuộc tỉnh nào?', ['Lâm Đồng', 'Khánh Hoà', 'Đắk Lắk', 'Gia Lai'], 'Đà Lạt thuộc <b>Lâm Đồng</b>, cao khoảng 1 500 m nên mát quanh năm.') },
];
// ---------- phong cảnh ----------
const SCENES = [
  { name: 'Vịnh Hạ Long', kind: 'bay', hi: '🌊 Sóng vỗ rì rào… Chào mừng em tới Vịnh Hạ Long!', fact: 'Vịnh có gần <b>2 000 hòn đảo đá vôi</b> và là Di sản thiên nhiên thế giới.',
    q: Q('🌊 Vịnh Hạ Long thuộc tỉnh nào?', ['Quảng Ninh', 'Hải Phòng', 'Thanh Hoá', 'Nghệ An'], 'Vịnh Hạ Long thuộc tỉnh <b>Quảng Ninh</b>.') },
  { name: 'Thác Bản Giốc', kind: 'fall', hi: '💦 Ào ào… Chào em! Đây là thác Bản Giốc ở Cao Bằng.', fact: 'Thác nằm trên biên giới Việt – Trung, là một trong những <b>thác nước đẹp nhất Đông Nam Á</b>.',
    q: Q('☁️ Hơi nước bay lên cao gặp lạnh sẽ tạo thành gì?', ['Mây', 'Đá', 'Cát', 'Lửa'], 'Hơi nước ngưng tụ thành <b>mây</b>, mưa rơi xuống sông suối, chảy qua thác — đó là vòng tuần hoàn của nước.') },
  { name: 'Ruộng bậc thang', kind: 'terrace', hi: '🌾 Mây trôi qua núi… Chào em!', fact: 'Đồng bào vùng núi phía Bắc xẻ sườn núi thành <b>ruộng bậc thang</b>; mùa lúa chín vàng như những bậc thang khổng lồ.',
    q: Q('⛰️ Vì sao người ta làm ruộng bậc thang trên sườn núi?', ['Giữ nước và chống xói mòn đất', 'Để làm đường đi', 'Để trang trí cho đẹp', 'Vì lúa thích leo núi'], 'Mỗi bậc giữ lại nước và đất màu, <b>chống xói mòn</b> khi mưa lớn.') },
  { name: 'Sông Mê Kông đêm trăng', kind: 'river', hi: '🌙 Đêm trăng trên sông… Chào em!', fact: 'Sông Mê Kông chảy qua <b>6 nước</b>; vào Việt Nam chia nhiều nhánh nên gọi là sông <b>Cửu Long</b> ("chín rồng").',
    q: Q('🛶 Sông Mê Kông đổ ra biển nào?', ['Biển Đông', 'Biển Đỏ', 'Biển Đen', 'Địa Trung Hải'], 'Sông Mê Kông đổ ra <b>Biển Đông</b> qua các cửa sông ở miền Tây Nam Bộ.') },
];

// ---------- vẽ canvas (low-poly phẳng) ----------
let k = null;   // context 2D của atlas
const poly = (pts, col) => { k.fillStyle = col; k.beginPath(); k.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) k.lineTo(pts[i], pts[i + 1]); k.closePath(); k.fill(); };
const ell = (x, y, rx, ry, col, rot = 0) => { k.fillStyle = col; k.beginPath(); k.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); k.fill(); };
const line = (pts, col, w) => { k.strokeStyle = col; k.lineWidth = w; k.beginPath(); k.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) k.lineTo(pts[i], pts[i + 1]); k.stroke(); };
const rng = s => () => (s = (s * 16807) % 2147483647) / 2147483647;

function prepPerson(p, i) {
  const r = rng(i * 977 + 13);
  p.sk = [p.skin, shade(p.skin, 0.82), shade(p.skin, 0.68)];
  p.cl = [p.cc, shade(p.cc, 0.74), shade(p.cc, 1.18)];
  p.tris = [];   // nền: mảng tam giác low-poly
  for (let y = 0; y < 372; y += 62) for (let x = -20; x < 276; x += 59) {
    const j = () => (r() - 0.5) * 30, a = [x + j(), y + j()], b = [x + 59 + j(), y + j()], c = [x + j(), y + 62 + j()], d = [x + 59 + j(), y + 62 + j()];
    const f = 0.85 + r() * 0.3, col = _c.set(p.bg[0]).lerp(new THREE.Color(p.bg[1]), clamp(1 - y / 372 + (r() - 0.5) * 0.3, 0, 1)).multiplyScalar(f).getStyle();
    p.tris.push([[...a, ...b, ...c], col], [[...b, ...d, ...c], shade(col, 0.9)]);
  }
  p.stars = Array.from({ length: 21 }, () => [r() * 256, r() * 200, r() * 6]);
}
function prepScene(s, i) {
  const r = rng(i * 389 + 7);
  s.R = Array.from({ length: 34 }, () => r());
}

// --- chân dung 256 × 414 (khung hình 372, bảng tên 42) ---
function drawPerson(p, st, t) {
  k.fillStyle = p.bg[0]; k.fillRect(0, 0, 256, 372); for (const [pts, col] of p.tris) poly(pts, col);
  if (p.fx === 'board') {   // bảng đen
    k.fillStyle = '#1c2a22'; k.fillRect(12, 16, 232, 150); k.strokeStyle = '#6e4a30'; k.lineWidth = 6; k.strokeRect(12, 16, 232, 150);
    k.fillStyle = 'rgba(240,240,230,.86)'; k.font = 'bold 34px Georgia, serif'; k.textAlign = 'left'; k.fillText('E = mc²', 22, 58);
    k.font = '17px Georgia, serif'; k.fillText('c ≈ 300 000 km/s', 150 - 128, 150); k.fillText('π ≈ 3,1416', 168, 110);
  } else if (p.fx === 'jupiter') {   // trời sao + Sao Mộc và 4 mặt trăng quay
    for (const [x, y, ph] of p.stars) { k.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(t * 1.7 + ph)); ell(x, y, 1.6, 1.6, '#fff6d8'); }
    k.globalAlpha = 1; ell(200, 64, 23, 21, '#d9a46a'); k.fillStyle = '#b07a48'; k.fillRect(178, 58, 44, 4); k.fillRect(180, 70, 40, 3);
    for (let m = 0; m < 4; m++) { const a = t * (0.9 - m * 0.18) + m * 1.7; ell(200 + Math.cos(a) * (32 + m * 10), 64 + Math.sin(a) * 4, 2.6, 2.6, '#f1efe9'); }
  }
  const hx = st.hx, cx = 128 + hx * 5, cy = 150, fx = cx + hx * 10, rx = 46, ry = 57, S = p.sk, Cl = p.cl;
  // tóc phía sau (tóc giả, tóc xoăn)
  if (p.hair === 'wig') for (const s of [-1, 1]) for (let j = 0; j < 4; j++) ell(cx + s * (44 + j * 3) - hx * 4, cy - 6 + j * 24, 21, 17, j % 2 ? shade(p.hc, 0.88) : p.hc);
  if (p.hair === 'curly') for (const s of [-1, 1]) for (let j = 0; j < 3; j++) ell(cx + s * 48 - hx * 4, cy + 4 + j * 17, 11, 10, j % 2 ? shade(p.hc, 1.2) : p.hc);
  // thân + áo
  poly([14, 372, 30, 270, 84, 240, 128, 236, 172, 240, 226, 270, 242, 372], Cl[0]);
  poly([128, 236, 172, 240, 226, 270, 242, 372, 128, 372], Cl[1]);
  poly([cx - 18, 196, cx + 18, 196, cx + 20, 244, cx - 20, 244], S[1]);   // cổ
  if (p.cloth === 'ao') { poly([cx - 30, 238, cx, 300, cx + 30, 238, cx + 18, 238, cx, 276, cx - 18, 238], p.trim); poly([cx - 18, 238, cx, 276, cx + 18, 238], '#f3eee2'); line([cx + 30, 238, cx - 34, 372], p.trim, 4); }
  else if (p.cloth === 'coat' || p.cloth === 'lab') {
    poly([cx - 26, 240, cx, 320, cx + 26, 240], p.cloth === 'lab' ? '#bcd3e6' : '#f3efe6');
    poly([cx - 26, 240, cx - 6, 320, cx - 40, 268], Cl[2]); poly([cx + 26, 240, cx + 6, 320, cx + 40, 268], Cl[1]);
    if (p.tie === 'tie') poly([cx - 5, 246, cx + 5, 246, cx + 8, 300, cx, 312, cx - 8, 300], '#7a2e2a');
    if (p.tie === 'cravat') { ell(cx - 6, 254, 12, 9, '#fbf8f0'); ell(cx + 6, 254, 12, 9, '#efe9dc'); ell(cx, 270, 9, 12, '#fbf8f0'); }
    if (p.tie === 'collar') poly([cx - 22, 238, cx, 252, cx + 22, 238, cx + 16, 248, cx, 262, cx - 16, 248], '#f3efe6');
  } else if (p.cloth === 'dress') { poly([cx - 22, 236, cx + 22, 236, cx + 15, 252, cx - 15, 252], '#f3efe6'); ell(cx, 262, 5, 5, '#d4a24a'); }
  else if (p.cloth === 'toga') { poly([30, 270, 84, 240, 110, 240, 242, 340, 242, 372, 210, 372], p.trim); poly([60, 258, 84, 240, 104, 240, 230, 336, 222, 352], shade(p.cc, 0.9)); }
  // tai
  for (const s of [-1, 1]) ell(cx + s * (rx - 1) - hx * 5, cy + 6, 8, 13, S[1]);
  // đầu low-poly 10 cạnh: nửa sáng / nửa tối
  const H = []; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, sn = Math.sin(a); H.push(cx + Math.cos(a) * rx * (sn > 0.3 ? 0.82 : 1), cy + sn * ry); }
  poly(H, S[0]); poly([H[0], H[1], H[2], H[3], H[4], H[5], H[6], H[7], H[8], H[9], H[10], H[11], fx + 2, cy + ry, fx + 2, cy - ry], S[1]);
  poly([fx - 30, cy + 14, fx - 14, cy + 22, fx - 22, cy + 40], S[0]);   // gò má sáng
  // tóc trước / mũ
  if (p.hair === 'side') { for (const s of [-1, 1]) ell(cx + s * 42 - hx * 3, cy - 12, 12, 22, p.hc); }
  else if (p.hair === 'wild') { const sp = []; for (let i = 0; i <= 12; i++) { const a = Math.PI + i / 12 * Math.PI, rr = (i % 2 ? 62 : 72) + Math.sin(t * 2 + i) * 2; sp.push(cx + Math.cos(a) * rr * 1.08, cy - 14 + Math.sin(a) * rr); } sp.push(cx + 56, cy + 10, cx + 40, cy - 22, cx - 40, cy - 22, cx - 56, cy + 10); poly(sp, p.hc); }
  else if (p.hair && !p.hat) { k.fillStyle = p.hc; k.beginPath(); k.ellipse(cx + hx * 3, cy - 22, rx + 3, ry * 0.68, 0, Math.PI * 0.98, Math.PI * 2.02); k.fill(); poly([cx - rx - 2, cy - 18, cx - rx + 6, cy + 4, cx - rx + 14, cy - 20], p.hc); poly([cx + rx + 2, cy - 18, cx + rx - 6, cy + 4, cx + rx - 14, cy - 20], p.hc); }
  if (p.hair === 'topknot' && !p.hat) ell(cx + hx * 4, cy - 70, 15, 13, shade(p.hc, 0.92));
  if (p.hair === 'bun') ell(cx + hx * 2, cy - 72, 21, 15, shade(p.hc, 0.9));
  if (p.laurel) for (let i = 0; i < 9; i++) { const a = Math.PI * (1.08 + i * 0.105); ell(cx + Math.cos(a) * 46, cy - 26 + Math.sin(a) * 34, 7, 3.6, '#5f8a3e', a + 1.2); }
  if (p.hat === 'mu') {   // mũ cánh chuồn: chóp tròn + 2 cánh rung rinh
    const w = Math.sin(t * 6) * (st.awake ? 0.18 : 0.04);
    for (const s of [-1, 1]) { k.save(); k.translate(cx + s * 30, cy - 52); k.rotate(s * (0.12 + w)); ell(s * 34, 0, 34, 10, '#1d1b22'); ell(s * 34, -2, 28, 5, '#2e2b36'); k.restore(); }
    k.fillStyle = '#1d1b22'; k.beginPath(); k.ellipse(cx + hx * 2, cy - 40, rx + 4, 42, 0, Math.PI, Math.PI * 2); k.fill(); k.fillRect(cx - rx - 4 + hx * 2, cy - 42, rx * 2 + 8, 12);
    ell(cx + hx * 2, cy - 64, 22, 16, '#26232c'); line([cx - rx - 4 + hx * 2, cy - 32, cx + rx + 4 + hx * 2, cy - 32], '#d4a24a', 3);
  } else if (p.hat === 'khan') {   // khăn đóng
    k.fillStyle = '#26232c'; k.beginPath(); k.ellipse(cx + hx * 2, cy - 30, rx + 6, 34, 0, Math.PI, Math.PI * 2); k.fill(); k.fillRect(cx - rx - 6 + hx * 2, cy - 32, rx * 2 + 12, 14);
    for (let j = 0; j < 4; j++) line([cx - rx - 2 + hx * 2, cy - 22 - j * 9, cx + rx + 2 + hx * 2, cy - 30 - j * 9], '#3a3644', 3);
  }
  // mắt (chớp) + lông mày
  const look = clamp(hx * 3, -3, 3), ey = cy - 4, br = st.awake ? -15 : -12;
  for (const s of [-1, 1]) {
    const ex = fx + s * 17;
    if (st.blink) line([ex - 7, ey + 1, ex + 7, ey + 1], '#3a2a22', 2.6);
    else { ell(ex, ey, 8, 5.6, '#fbf7ef'); ell(ex + look, ey + 0.5, 3.6, 3.8, '#2a1f1a'); ell(ex + look + 1.2, ey - 1, 1.2, 1.2, '#fff'); }
    line([ex - 9, ey + br + s * 0, ex + 8, ey + br - 2], p.hat ? '#2a2220' : shade(p.hc, 0.8), 3.4);
  }
  if (p.glasses) { k.strokeStyle = '#2a2a2a'; k.lineWidth = 2.4; for (const s of [-1, 1]) { k.beginPath(); k.ellipse(fx + s * 17, ey, 12, 10, 0, 0, Math.PI * 2); k.stroke(); } line([fx - 5, ey, fx + 5, ey], '#2a2a2a', 2.4); }
  poly([fx + 1, cy + 2, fx + 8, cy + 22, fx - 4, cy + 22], S[2]);   // mũi
  for (const s of [-1, 1]) { k.globalAlpha = 0.22; ell(fx + s * 26, cy + 22, 9, 6, '#e0606a'); k.globalAlpha = 1; }
  // râu + miệng (nói khi thức)
  const B = p.beard || [], my = cy + 34;
  if (B.includes('full')) { const bw = p.big ? 1.25 : 1; poly([cx - 45, cy + 2, cx - 40 * bw, cy + 40, cx - 18, cy + 62 * bw, fx, cy + 74 * bw, cx + 18, cy + 62 * bw, cx + 40 * bw, cy + 40, cx + 45, cy + 2, cx + 36, cy + 22, fx + 18, cy + 44, fx, cy + 48, fx - 18, cy + 44, cx - 36, cy + 22], p.bc); }
  if (B.includes('long')) poly([fx - 13, my + 8, fx + 13, my + 8, fx + 6, my + 74, fx, my + 88, fx - 6, my + 74], p.bc);
  if (B.includes('goatee')) poly([fx - 8, my + 9, fx + 8, my + 9, fx, my + 30], p.bc);
  const open = st.talk ? (0.5 + 0.5 * Math.sin(t * 15)) * st.talk : 0;
  if (open > 0.08) ell(fx, my + 2, 8, 2 + open * 6, '#6a2a2a'); else { k.strokeStyle = '#7a3a34'; k.lineWidth = 2.6; k.beginPath(); k.arc(fx, my - 6, 9, 0.25 * Math.PI, 0.75 * Math.PI); k.stroke(); }
  if (B.includes('stache')) poly([fx - 18, my + 2, fx, my - 6, fx + 18, my + 2, fx + 12, my + 5, fx, my - 1, fx - 12, my + 5], p.bc);
  if (p.prop === 'stetho') line([cx - 22, 244, cx - 26, 290, cx, 318, cx + 22, 290, cx + 22, 244], '#4a4a52', 3.4);
  // tay + đồ vật (tư thế: nghỉ · nâng · vẫy · reo)
  const P = st.pose === 'wave' ? [212 + Math.sin(t * 9) * 13, 196, 224, 262] : st.pose === 'cheer' ? [198, 118 + Math.sin(t * 12) * 6, 222, 210] : st.pose === 'lift' ? [176, 276, 216, 300] : [160, 322, 210, 326];
  for (let i = 0; i < 4; i++) st.arm[i] += (P[i] - st.arm[i]) * 0.55;
  const [hx2, hy, ex2, ey2] = st.arm;
  k.lineCap = 'round'; k.lineJoin = 'round'; line([190, 268, ex2, ey2, hx2, hy], Cl[1], 24); line([190, 268, ex2, ey2, hx2, hy], Cl[0], 17);
  drawProp(p, hx2, hy, t, st);
  ell(hx2, hy, 10.5, 10, S[0]); ell(hx2 + 3, hy + 2, 6, 5, S[1]);
  k.lineCap = 'butt';
  // bảng tên
  k.fillStyle = '#2a1f18'; k.fillRect(0, 372, 256, 42); k.fillStyle = '#c9a24a'; k.fillRect(0, 372, 256, 2);
  k.textAlign = 'center'; k.fillStyle = '#ffe3a0'; k.font = 'bold 19px Georgia, serif'; k.fillText(p.name, 128, 393, 244);
  k.font = '12px Georgia, serif'; k.fillStyle = '#d9c49a'; k.fillText(p.yrs, 128, 408);
}
function drawProp(p, x, y, t, st) {
  const pr = p.prop;
  if (pr === 'book') { k.save(); k.translate(x - 14, y - 4); k.rotate(-0.25); k.fillStyle = p.pc; k.fillRect(-22, -16, 44, 32); k.fillStyle = '#f3eee2'; k.fillRect(-20, -13, 40, 4); k.fillStyle = '#d4a24a'; k.fillRect(-4, -8, 8, 16); k.restore(); }
  else if (pr === 'apple') { ell(x - 4, y - 18, 13, 12, '#c8302c'); ell(x - 8, y - 22, 4, 3, '#e86a5e'); line([x - 4, y - 29, x - 2, y - 36], '#5a3a22', 2.4); ell(x + 4, y - 34, 6, 3, '#5f9a3e', -0.5); }
  else if (pr === 'flask') { const g = 0.6 + 0.4 * Math.sin(t * 3); poly([x - 6, y - 50, x + 6, y - 50, x + 6, y - 32, x + 20, y - 4, x - 20, y - 4, x - 6, y - 32], 'rgba(210,235,240,.75)'); k.globalAlpha = g; poly([x - 13, y - 18, x + 13, y - 18, x + 20, y - 4, x - 20, y - 4], '#6cf2c2'); for (let b = 0; b < 3; b++) ell(x - 5 + b * 5, y - 22 - ((t * 20 + b * 9) % 26), 2, 2, '#c8fff0'); k.globalAlpha = 1; }
  else if (pr === 'scope') { k.save(); k.translate(x, y); k.rotate(-2.2); k.fillStyle = '#b08a3a'; k.fillRect(-4, -7, 76, 14); k.fillStyle = '#6e4a30'; k.fillRect(30, -9, 10, 18); k.fillStyle = '#d4a24a'; k.fillRect(66, -9, 8, 18); k.restore(); }
  else if (pr === 'abacus') { k.fillStyle = '#6e4a30'; k.fillRect(x - 34, y - 26, 48, 34); k.fillStyle = '#e9d8b0'; k.fillRect(x - 30, y - 22, 40, 26); for (let r = 0; r < 4; r++) { line([x - 30, y - 18 + r * 7, x + 10, y - 18 + r * 7], '#6e4a30', 1.4); for (let b = 0; b < 3; b++) ell(x - 26 + b * 6 + (st.awake && r === (Math.floor(t * 2) % 4) ? 12 : 0), y - 18 + r * 7, 3, 2.6, '#7a2e2a'); } }
  else if (pr === 'scroll') { k.fillStyle = '#efe4c4'; k.fillRect(x - 34, y - 30, 30, 50); ell(x - 19, y - 30, 17, 4, '#c9a86a'); ell(x - 19, y + 20, 17, 4, '#c9a86a'); for (let r = 0; r < 4; r++) line([x - 14 - r * 6, y - 22, x - 14 - r * 6, y + 12], '#5a4a3a', 1.6); }
  else if (pr === 'chalk') { k.fillStyle = '#f6f4ec'; k.fillRect(x - 3, y - 20, 6, 14); if (st.awake) for (let b = 0; b < 4; b++) { k.globalAlpha = 0.5; ell(x + Math.sin(t * 7 + b) * 8, y - 24 - b * 5, 1.6, 1.6, '#fff'); } k.globalAlpha = 1; }
  else if (pr === 'herb') { for (let j = -1; j <= 1; j++) { line([x, y, x + j * 12, y - 38], '#3e6a2a', 2.4); ell(x + j * 13, y - 40, 6, 13, j ? '#5f9a3e' : '#7fb84e', j * 0.4); } }
  else if (pr === 'card') { k.save(); k.translate(x - 8, y - 22); k.rotate(-0.12); k.fillStyle = '#e9dcb8'; k.fillRect(-28, -18, 52, 34); k.fillStyle = '#3a2a22'; for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) if ((r * 7 + c) % 3) k.fillRect(-24 + c * 7, -13 + r * 7, 3, 4); k.restore(); }
  else if (pr === 'crown') { poly([x - 22, y - 10, x - 22, y - 34, x - 12, y - 22, x, y - 38, x + 12, y - 22, x + 22, y - 34, x + 22, y - 10], '#e8b83a'); ell(x, y - 22, 3, 3, '#c8302c'); }
  else if (pr === 'micro') { k.fillStyle = '#2a2a33'; k.fillRect(x - 32, y + 12, 40, 8); k.fillRect(x - 6, y - 30, 8, 44); k.save(); k.translate(x - 12, y - 30); k.rotate(-0.4); k.fillStyle = '#4a4a55'; k.fillRect(-6, -22, 12, 34); k.fillStyle = '#d4a24a'; k.fillRect(-7, -24, 14, 5); k.restore(); }
  else if (pr === 'stetho') { ell(x - 2, y - 14, 9, 9, '#8a8a95'); ell(x - 2, y - 14, 5, 5, '#d0d0d8'); }
  else if (pr === 'bird') { const f = Math.sin(t * (st.awake ? 14 : 3)) * 0.7; ell(x - 4, y - 22, 14, 10, '#8a6040'); ell(x + 8, y - 30, 8, 7, '#7a5236'); poly([x + 14, y - 32, x + 22, y - 29, x + 14, y - 27], '#3a3030'); ell(x + 10, y - 32, 1.6, 1.6, '#111'); k.save(); k.translate(x - 6, y - 26); k.rotate(-0.4 - f); ell(-10, 0, 12, 5, '#6a4428'); k.restore(); }
  else if (pr === 'rice') { for (let j = 0; j < 5; j++) { const a = -1.9 + j * 0.16, ex = x + Math.cos(a) * 56, ey = y + Math.sin(a) * 56; line([x, y, ex, ey], '#9a8a3a', 2); for (let g = 0; g < 5; g++) ell(ex - g * 4 * Math.cos(a) + 3, ey - g * 4 * Math.sin(a), 2.6, 4, '#e8c050', a); } }
  else if (pr === 'tri') { poly([x - 40, y + 6, x + 6, y + 6, x - 40, y - 34], '#a8744a'); line([x - 40, y + 6, x + 6, y + 6, x - 40, y - 34, x - 40, y + 6], '#4a3424', 2.4); k.fillStyle = '#2a1f18'; k.font = 'bold 13px Georgia'; k.textAlign = 'center'; k.fillText('3', x - 46, y - 10); k.fillText('4', x - 17, y + 20); k.fillText('5', x - 12, y - 18); }
}

// --- phong cảnh: toạ độ chuẩn 414 × 256 (bảng tên 24 px ở đáy) ---
function sky(c0, c1, h) { const g = k.createLinearGradient(0, 0, 0, h); g.addColorStop(0, c0); g.addColorStop(1, c1); k.fillStyle = g; k.fillRect(0, 0, 414, h); }
function cloud(x, y, s, col = 'rgba(255,255,255,.9)') { ell(x, y, 26 * s, 10 * s, col); ell(x - 16 * s, y + 3 * s, 16 * s, 8 * s, col); ell(x + 18 * s, y + 2 * s, 18 * s, 8 * s, col); }
function drawScene(s, t) {
  const R = s.R;
  if (s.kind === 'bay') {
    sky('#7fc2e6', '#e8f2ea', 150); ell(330, 46, 16, 16, '#fff4c8');
    for (let i = 0; i < 4; i++) cloud(((t * (5 + i * 2) + R[i] * 520) % 520) - 60, 26 + i * 15, 0.7 + R[i + 4] * 0.5);
    const karst = (x, w, h, c, base) => { poly([x, base, x + w * 0.1, base - h * 0.7, x + w * 0.3, base - h, x + w * 0.55, base - h * 0.92, x + w * 0.8, base - h * 0.6, x + w, base], c); poly([x + w * 0.55, base - h * 0.92, x + w * 0.8, base - h * 0.6, x + w, base, x + w * 0.5, base], shade(c, 0.82)); };
    for (let i = 0; i < 6; i++) karst(R[8 + i] * 380 - 20, 40 + R[14 + i] * 30, 50 + R[20 + i] * 30, '#8fb0a6', 150);
    for (let i = 0; i < 4; i++) karst(i * 110 - 30 + R[26 + i] * 40, 70 + R[i] * 30, 80 + R[30 + i % 4] * 50, '#3f6a4a', 160);
    k.fillStyle = '#2f7f9a'; k.fillRect(0, 150, 414, 82);
    for (let r = 0; r < 6; r++) { const y = 158 + r * 13, a = 1.5 + r * 0.7, pts = []; for (let x = 0; x <= 414; x += 18) pts.push(x, y + Math.sin(x * 0.05 + t * 2.2 + r * 1.3) * a); line(pts, r % 2 ? '#5aa8c0' : '#8cd0de', 2 + r * 0.3); }
    const bx = 240 + Math.sin(t * 0.25) * 60, by = 182 + Math.sin(t * 1.7) * 2.5;   // thuyền buồm cánh dơi
    k.save(); k.translate(bx, by); k.rotate(Math.sin(t * 1.3) * 0.04);
    poly([-34, 0, 34, 0, 26, 10, -26, 10], '#6e4a30');
    for (let j = 0; j < 3; j++) { const sx = -18 + j * 18; poly([sx, -2, sx, -44 + j * 4, sx + 16, -36 + j * 4, sx + 14, -2], j === 1 ? '#c8642e' : '#b0502a'); for (let l = 1; l < 4; l++) line([sx, -2 - l * 10, sx + 15, -2 - l * 9], '#7a3a1e', 1); }
    k.restore();
  } else if (s.kind === 'fall') {
    sky('#a6d6ee', '#eef6ea', 120); for (let i = 0; i < 3; i++) cloud(((t * (4 + i * 2) + R[i] * 520) % 520) - 60, 22 + i * 14, 0.6 + R[i + 3] * 0.4);
    poly([0, 110, 60, 50, 130, 80, 200, 40, 280, 76, 350, 46, 414, 90, 414, 232, 0, 232], '#4f8a4a'); poly([200, 40, 280, 76, 350, 46, 414, 90, 414, 232, 240, 232], '#3f7a3e');
    const tiers = [[60, 92, 120], [150, 120, 160], [250, 100, 150], [330, 116, 170]];   // 4 dòng thác: [x, đỉnh, chân]
    for (const [x, y0, y1] of tiers) {
      poly([x - 30, y0 - 6, x + 30, y0 - 6, x + 36, y1, x - 36, y1], '#6e6a5e');
      k.fillStyle = '#cfeaf2'; k.fillRect(x - 22, y0, 44, y1 - y0);
      for (let j = 0; j < 9; j++) { const yy = y0 + ((t * 70 + j * 17 + x) % (y1 - y0)); line([x - 20 + j * 5, yy, x - 20 + j * 5, yy + 10], '#ffffff', 2); }
      for (let j = 0; j < 4; j++) ell(x - 24 + j * 16, y1 + 2, 12 + Math.sin(t * 4 + j + x) * 3, 6, 'rgba(255,255,255,.85)');
    }
    k.fillStyle = '#4fa6b8'; k.fillRect(0, 176, 414, 56);
    for (let r = 0; r < 4; r++) { const pts = []; for (let x = 0; x <= 414; x += 18) pts.push(x, 186 + r * 12 + Math.sin(x * 0.06 - t * 3 + r) * 2); line(pts, '#9ad6e2', 2); }
    for (let i = 0; i < 6; i++) { const x = 20 + i * 74 + R[10 + i] * 20; poly([x, 178, x + 9, 150, x + 18, 178], '#2f5a2e'); }
    const bx = 120 + Math.sin(t * 0.3) * 70; poly([bx - 18, 206, bx + 18, 206, bx + 12, 213, bx - 12, 213], '#8a5a30'); line([bx - 4, 206, bx + 10, 190], '#5a3a22', 2);
  } else if (s.kind === 'terrace') {
    sky('#f2d9a0', '#f7efd8', 140); ell(80, 50, 18, 18, '#fff1c0');
    poly([0, 120, 90, 40, 170, 90, 260, 30, 340, 80, 414, 50, 414, 232, 0, 232], '#7a9a6a'); poly([260, 30, 340, 80, 414, 50, 414, 232, 300, 232], '#6a8a5a');
    for (let r = 0; r < 9; r++) { const y = 96 + r * 15, pts = [0, 232]; for (let x = 0; x <= 414; x += 23) pts.push(x, y + Math.sin(x * 0.018 + r * 0.9) * 10 - Math.cos(x * 0.011) * 6); pts.push(414, 232); poly(pts, r % 3 === 0 ? '#e8c050' : r % 3 === 1 ? '#c8b040' : '#a8b84a'); }
    for (let r = 1; r < 9; r++) { const y = 96 + r * 15, pts = []; for (let x = 0; x <= 414; x += 23) pts.push(x, y + Math.sin(x * 0.018 + r * 0.9) * 10 - Math.cos(x * 0.011) * 6); line(pts, 'rgba(90,70,30,.5)', 1.4); }
    poly([300, 130, 330, 112, 360, 130], '#6e4a30'); k.fillStyle = '#a8744a'; k.fillRect(306, 130, 48, 16);   // nhà sàn
    for (let i = 0; i < 4; i++) cloud(((t * (7 + i * 3) + R[i] * 560) % 560) - 70, 70 + i * 26, 0.9 + R[i + 4] * 0.6, 'rgba(255,255,255,.72)');
    for (let i = 0; i < 3; i++) { const bx = ((t * 18 + R[12 + i] * 400) % 470) - 30, by = 36 + i * 9, f = Math.sin(t * 8 + i) * 4; line([bx - 7, by - f, bx, by, bx + 7, by - f], '#3a3030', 1.8); }
  } else {
    sky('#0d1638', '#33406e', 140);
    for (let i = 0; i < 30; i++) { k.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.3 + i * 2.1)); ell((R[i] * 977) % 414, (R[(i + 7) % 34] * 613) % 120, 1.4, 1.4, '#fff8dc'); }
    k.globalAlpha = 1; ell(300, 42, 17, 17, '#fff4c8'); ell(306, 38, 14, 14, '#0f1a40');
    k.fillStyle = '#1a2a2a'; k.fillRect(0, 128, 414, 14);
    k.fillStyle = '#233a5a'; k.fillRect(0, 140, 414, 92);
    for (let j = 0; j < 9; j++) { const w = 18 + Math.sin(t * 3 + j * 1.7) * 9; k.globalAlpha = 0.7; k.fillStyle = '#fff1b0'; k.fillRect(300 - w / 2 + Math.sin(t * 2 + j) * 3, 146 + j * 9, w, 2.4); } k.globalAlpha = 1;
    for (let r = 0; r < 4; r++) { const pts = []; for (let x = 0; x <= 414; x += 18) pts.push(x, 160 + r * 17 + Math.sin(x * 0.05 + t * 1.6 + r) * 1.6); line(pts, '#3a5a80', 1.6); }
    const palm = (x, h, sgn) => { line([x, 140, x + sgn * 10, 140 - h * 0.5, x + sgn * 6, 140 - h], '#141a1a', 5); for (let f = 0; f < 6; f++) { const a = f / 6 * Math.PI * 2 + Math.sin(t * 1.2 + x) * 0.12; line([x + sgn * 6, 140 - h, x + sgn * 6 + Math.cos(a) * 26, 140 - h + Math.sin(a) * 10 + 8], '#141a1a', 3); } };
    palm(30, 90, 1); palm(70, 70, -1); palm(390, 84, -1);
    const bx = ((t * 14) % 520) - 50, by = 196 + Math.sin(t * 1.5) * 1.5;   // xuồng + đèn lồng
    poly([bx - 26, by, bx + 26, by, bx + 18, by + 7, bx - 18, by + 7], '#1a1414'); line([bx + 8, by, bx + 8, by - 22], '#1a1414', 2);
    k.globalAlpha = 0.75 + 0.25 * Math.sin(t * 6); ell(bx + 8, by - 24, 5, 6, '#ffb84a'); k.globalAlpha = 0.25; ell(bx + 8, by - 24, 14, 14, '#ffb84a'); k.globalAlpha = 1;
    for (let i = 0; i < 7; i++) { k.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4 + i * 3); ell(40 + i * 52 + Math.sin(t + i) * 10, 118 + Math.cos(t * 0.8 + i) * 8, 1.8, 1.8, '#d8ff8a'); } k.globalAlpha = 1;
  }
  k.fillStyle = '#2a1f18'; k.fillRect(0, 232, 414, 24); k.fillStyle = '#c9a24a'; k.fillRect(0, 232, 414, 2);
  k.textAlign = 'center'; k.fillStyle = '#ffe3a0'; k.font = 'bold 15px Georgia, serif'; k.fillText(s.name, 207, 250, 400);
}

export function create(ctx, magic, { toWorld, toLocal, L, Y }) {
  const solved = load('academy.paintings', []);
  PEOPLE.forEach(prepPerson); SCENES.forEach(prepScene);
  const O = toWorld(0, 0), Fu = toWorld(1, 0), Fv = toWorld(0, 1);
  const du = [Fu[0] - O[0], Fu[1] - O[1]], dv = [Fv[0] - O[0], Fv[1] - O[1]];   // hướng u, v trong thế giới
  const CC = toWorld(-34, 0);   // tâm lâu đài
  let B = null;

  // ---------- vị trí treo: [phòng, trục mặt tường, toạ độ mặt tường, hướng pháp tuyến, toạ độ dọc tường, cao tâm, rộng, cao, loại] ----------
  function slots() {
    const Hh = L.hall, ht = 1.6, Lb = L.library, lt = 1.2, X = L.box, fu = X.u1 - L.T, a0 = X.u0 + L.T, S = [];
    const add = (room, axis, f, n, a, y, w, h, kind, dark = 0) => S.push({ room, axis, f, n, a, y: Y + y, w, h, kind, dark });
    for (const u of [-80, -72, -64]) { add('hall', 'v', Hh.v0 + ht, 1, u, 3.4, 1.3, 2.1, 'p'); add('hall', 'v', Hh.v1 - ht, -1, u, 3.4, 1.3, 2.1, 'p'); }
    add('hall', 'u', Hh.u0 + ht, 1, 0, 8.1, 5.5, 3.4, 'L');                                         // tranh lớn sau bục giáo viên
    for (const v of [62, 72, 82]) add('lib', 'u', Lb.u0 + lt, 1, v, 5.6, 1.3, 2.1, 'p', 1);         // trên bàn đọc
    add('lib', 'v', Lb.v0 + lt, 1, (Lb.u0 + Lb.u1) / 2, 7.6, 1.3, 2.1, 'p', 1); add('lib', 'v', Lb.v1 - lt, -1, (Lb.u0 + Lb.u1) / 2, 7.6, 1.3, 2.1, 'p', 1);   // trên kệ sách
    for (const [kk, sg] of [[10, 1], [16, 1], [24, 1], [10, -1], [24, -1]]) add('cor', 'v', -32 * sg, sg, a0 + 10.1 + 4.2 * kk, 2.75, 1.3, 2.1, 'p');   // giữa 2 cửa sổ dãy ngăn
    add('cor', 'v', 32, -1, a0 + 10.1 + 4.2 * 16, 2.75, 3.4, 2.1, 'l');
    add('cor', 'u', fu, -1, -13.3, 2.45, 2.6, 1.6, 'l'); add('cor', 'u', fu, -1, 13.3, 2.45, 2.6, 1.6, 'l');   // dưới cửa sổ dãy mặt tiền
    return S;
  }

  function build() {
    const g = new THREE.Group(); g.name = 'academy-paintings'; ctx.scene.add(g);
    const cv = document.createElement('canvas'); cv.width = AW; cv.height = AH; k = cv.getContext('2d');
    const atlas = new THREE.CanvasTexture(cv); atlas.flipY = false; atlas.colorSpace = THREE.SRGBColorSpace; atlas.generateMipmaps = false; atlas.minFilter = THREE.LinearFilter;
    const S = slots(), list = [], fb = new Batch();
    let pi = 0, li = 1, lx = 512;
    for (const s of S) {
      // ô atlas: chân dung 256 × 414 (2 hàng × 8) · tranh lớn 512 × 316 · phong cảnh 414 × 256 (hàng dưới)
      let cell, data, land = s.kind !== 'p';
      if (!land) { cell = { x: (pi % 8) * 256, y: Math.floor(pi / 8) * 414, w: 256, h: 414 }; data = PEOPLE[pi++]; }
      else if (s.kind === 'L') { cell = { x: 0, y: 828, w: 512, h: 316 }; data = SCENES[0]; }
      else { cell = { x: lx, y: 828, w: 414, h: 256 }; lx += 414; data = SCENES[li++]; }
      const [ux, uz] = s.axis === 'u' ? du : dv, nx = ux * s.n, nz = uz * s.n;
      const base = s.axis === 'u' ? toWorld(s.f, s.a) : toWorld(s.a, s.f);
      const ry = Math.atan2(nx, nz);
      const P = { ...s, cell, data, land, id: land ? 'L:' + data.name : data.name, x: base[0] + nx * 0.06, z: base[1] + nz * 0.06, nx, nz, rx: Math.cos(ry), rz: -Math.sin(ry), ry,
        st: { hx: 0, hxT: 0, arm: [160, 322, 210, 326], pose: 'rest', talk: 0, awake: 0, blink: 0 }, next: 0, greetAt: -99, wakeT: -99, poseT: 13 + Math.random() * 21, blinkT: Math.random() * 4, seed: Math.random() * 9 };
      list.push(P);
      // khung: gỗ + gờ đồng thau, viền 13 cm (tranh lớn 21 cm), sâu 12 cm
      const b = s.kind === 'L' ? 0.21 : 0.13, d = 0.12, W2 = s.w / 2, H2 = s.h / 2, wood = list.length % 2 ? '#6e4a30' : '#4a3424', brass = '#c9a24a';
      const piece = (w, h, dd, x, y, z, col) => fb.add(new THREE.BoxGeometry(w, h, dd).translate(x, y, z), col, base[0], s.y, base[1], ry);
      piece(s.w + 2 * b, b, d, 0, H2 + b / 2, d / 2, wood); piece(s.w + 2 * b, b, d, 0, -H2 - b / 2, d / 2, wood);
      piece(b, s.h, d, -W2 - b / 2, 0, d / 2, wood); piece(b, s.h, d, W2 + b / 2, 0, d / 2, wood);
      const lp = b / PHI / PHI;   // gờ đồng thau trong
      piece(s.w + 2 * lp, lp, d + 0.02, 0, H2 + lp / 2, d / 2, brass); piece(s.w + 2 * lp, lp, d + 0.02, 0, -H2 - lp / 2, d / 2, brass);
      piece(lp, s.h, d + 0.02, -W2 - lp / 2, 0, d / 2, brass); piece(lp, s.h, d + 0.02, W2 + lp / 2, 0, d / 2, brass);
      piece(b * PHI * 2, b * PHI, d * 0.8, 0, H2 + b * 1.3, d / 2, brass);   // chóp trang trí
      piece(s.w, s.h, 0.02, 0, 0, 0.01, '#2a1f18');                          // tấm lưng
    }
    // tranh: InstancedMesh 1 tấm phẳng, mỗi bản đọc 1 ô atlas (aRect) + độ sáng tự phát (aGlow)
    const n = list.length, rect = new Float32Array(n * 4), glow = new Float32Array(n);
    const geo = new THREE.PlaneGeometry(1, 1);
    const aRect = new THREE.InstancedBufferAttribute(rect, 4), aGlow = new THREE.InstancedBufferAttribute(glow, 1); aGlow.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aRect', aRect); geo.setAttribute('aGlow', aGlow);
    const m = new THREE.MeshLambertMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff });
    m.onBeforeCompile = sh => {
      sh.vertexShader = 'attribute vec4 aRect;\nattribute float aGlow;\nvarying float vGlow;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n vMapUv = vec2(aRect.x + uv.x * aRect.z, aRect.y + (1.0 - uv.y) * aRect.w);\n vEmissiveMapUv = vMapUv;\n vGlow = aGlow;');
      sh.fragmentShader = 'varying float vGlow;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance *= vGlow;');
    };
    const im = new THREE.InstancedMesh(geo, m, n), o = new THREE.Object3D();
    list.forEach((P, i) => {
      o.position.set(P.x, P.y, P.z); o.rotation.set(0, P.ry, 0); o.scale.set(P.w, P.h, 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
      rect.set([P.cell.x / AW, P.cell.y / AH, P.cell.w / AW, P.cell.h / AH], i * 4); glow[i] = 0.12; P.i = i;
      drawCell(P, 0);
    });
    im.computeBoundingSphere(); im.name = 'academy-paintings-canvas';
    const fm = new THREE.Mesh(fb.build(), matV()); fm.name = 'academy-paintings-frames';
    g.add(fm, im);
    B = { g, list, atlas, aGlow, glow, im, fm, cv, box: new THREE.Box2(new THREE.Vector2(), new THREE.Vector2()), pos: new THREE.Vector2(), cur: null };
  }

  function drawCell(P, t) {
    const c = P.cell; k.save(); k.translate(c.x, c.y); k.beginPath(); k.rect(0, 0, c.w, c.h); k.clip();
    if (P.land) { k.scale(c.w / 414, c.h / 256); drawScene(P.data, t); } else drawPerson(P.data, P.st, t);
    k.restore();
  }
  function upload(P) {
    const c = P.cell, r = ctx.renderer;
    if (!r) return;
    B.box.min.set(c.x, c.y); B.box.max.set(c.x + c.w, c.y + c.h); B.pos.set(c.x, c.y);
    r.copyTextureToTexture(B.atlas, B.atlas, B.box, B.pos);
  }

  function greet(P, t, again) {
    const s = P.st, D = P.data; P.greetAt = t; P.wakeT = t + 8; s.waveT = t + 2.6; s.talkT = t + 5; P.next = 0;
    ctx.toast(`🖼️ <b>${D.name}</b>: “${again ? 'Em muốn nghe lại à? Được thôi!' : D.hi}” 💡 ${D.fact}`, 7000);
    ctx.sfx && ctx.sfx('magic');
  }

  function update(dt, t) {
    if (!B) return;
    const cam = ctx.camera.position, vis = Math.hypot(cam.x - CC[0], cam.z - CC[1]) < 233;
    B.g.visible = vis; if (!vis) return;
    const pp = ctx.player.pos, night = ctx.sky && ctx.sky.state ? ctx.sky.state.night || 0 : 0;
    let best = null, bd = 5, dirty = false;
    for (const P of B.list) {
      const dx = pp.x - P.x, dz = pp.z - P.z, d = Math.hypot(dx, dz), s = P.st; P.d = d;
      if (d < bd && dx * P.nx + dz * P.nz > 0.2 && Math.abs(pp.y - P.y) < 9) { bd = d; best = P; }
      // trạng thái hoạt hình
      s.awake = t < P.wakeT ? 1 : 0;
      s.talk = t < (s.talkT || 0) ? 1 : 0;
      if (t > P.blinkT) { s.blink = 1; if (t > P.blinkT + 0.21) { s.blink = 0; P.blinkT = t + 2.6 + Math.random() * 3.4; } }
      if (t > P.poseT) P.poseT = t + 13 + Math.random() * 21, s.liftT = t + 3;
      s.pose = t < (s.cheerT || 0) ? 'cheer' : t < (s.waveT || 0) ? 'wave' : t < (s.liftT || 0) ? 'lift' : 'rest';
      s.hxT = s.awake ? clamp((dx * P.rx + dz * P.rz) / 2.6, -1, 1) : Math.sin(t * 0.23 + P.seed) * Math.max(0, Math.sin(t * 0.11 + P.seed * 3)) * 0.8;
      // ban đêm sáng nhẹ; thư viện tối luôn hơi sáng; tranh đang thức sáng thêm
      const gT = (P.dark ? 0.3 : 0.12) + night * 0.42 + s.awake * 0.21, gi = B.glow[P.i];
      if (Math.abs(gT - gi) > 0.005) { B.glow[P.i] = gi + (gT - gi) * Math.min(1, dt * 3); dirty = true; }
    }
    if (dirty) B.aGlow.needsUpdate = true;
    // vẽ lại ≤ 2 ô / khung, chỉ tranh trong 21 m
    for (let n = 0; n < 2; n++) {
      let pick = null; for (const P of B.list) if (P.d < 21 && t >= P.next && (!pick || P.next < pick.next)) pick = P;
      if (!pick) break;
      const s = pick.st, dd = Math.min(0.3, t - (pick.lastT || t)); pick.lastT = t;
      s.hx += (s.hxT - s.hx) * Math.min(1, dd * 4 + 0.15);
      drawCell(pick, t); upload(pick);
      pick.next = t + (s.awake ? 0.11 : pick.land ? 0.15 : 0.19);
    }
    // thức dậy + hỏi
    if (ctx.player.vehicle) return;
    if (best !== B.cur) { B.cur = best; if (best && t - best.greetAt > 21) greet(best, t); }
    if (best) {
      const P = best, done = solved.includes(P.id), short = P.land ? 'bức tranh' : P.data.name;
      ctx.offer(done ? `💬 Nghe ${short} kể chuyện` : `❓ Câu đố của ${short}`, () => {
        if (done) return greet(P, performance.now() / 1000, true);
        P.wakeT = performance.now() / 1000 + 21;
        magic.ask(P.data.q, () => {
          if (!solved.includes(P.id)) { solved.push(P.id); save('academy.paintings', solved); }
          magic.setMana(magic.mana + 13); const n = performance.now() / 1000; P.st.cheerT = n + 3; P.st.talkT = n + 3; P.wakeT = n + 8; P.next = 0;
          ctx.toast(`🖼️ <b>${P.data.name}</b> reo lên: “Giỏi lắm!” ✨ +13 năng lượng phép. (Đã giải ${solved.length}/${B.list.length} bức tranh)`, 4500);
        }, `🖼️ ${P.data.name} đố em`);
      }, 7);
    }
  }

  function unbuild() {
    if (!B) return; ctx.scene.remove(B.g);
    B.fm.geometry.dispose(); B.im.geometry.dispose(); B.im.material.dispose(); B.im.dispose(); B.atlas.dispose(); B.cv.width = B.cv.height = 1;
    B = null; k = null;
  }
  return { build, unbuild, update };
}
