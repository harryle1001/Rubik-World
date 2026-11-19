// economy/catalog.js — DANH MỤC HÀNG HOÁ dùng chung client + server (server/economy.js đọc file này để kiểm giá — chỉ dữ liệu, không import).
// Tiền tệ: 🪙 ĐỒNG VÀNG (kiếm khi chơi) · 💎 KIM CƯƠNG HỒNG (chỉ có khi bố mẹ nạp qua cổng phụ huynh hoặc chủ game tặng).
// Giá theo dãy Fibonacci; chơi đủ là mua được đa số đồ bằng đồng vàng — món 💎 chỉ là đồ trang trí đặc biệt, không mạnh hơn.
// Không có hộp quà may rủi: mọi món đều thấy rõ giá và biết chắc mình nhận được gì.
// tab: wear (đồ mặc) · ride (phương tiện) · pet (thú cưng) · loot (vật phẩm nhặt được: sell = giá bán lại)
export const START_GOLD = 34;           // tài khoản mới
export const FREE = ['bike-0'];          // tặng sẵn: Xe đạp đi học
export const CAP0 = 21;                  // sức chứa cặp ban đầu (ô), nâng bằng đồng vàng
export const CAP_UP = [{ cap: 34, gold: 55 }, { cap: 55, gold: 144 }, { cap: 89, gold: 377 }];
const W = (id, slot, icon, name, gold, desc, x = {}) => ({ id, tab: 'wear', slot, icon, name, price: { gold }, desc, ...x });
const R = (id, kind, icon, name, price, desc, x = {}) => ({ id, tab: 'ride', kind, icon, name, price, desc, ...x });
const L = (id, icon, name, sell, desc, kind = 'nl') => ({ id, tab: 'loot', icon, name, sell, desc, kind });
export const BIKE_NAMES = ['Xe đạp đi học', 'Xích lô', 'Xe omafiets', 'Xe chở hàng bakfiets', 'Xe mamachari', 'Xe khung đen cổ điển', 'Xe đua đường trường', 'Xe leo núi', 'Xe BMX', 'Xe đạp đôi tandem',
  'Xe penny-farthing', 'Xe kéo rickshaw', 'Xe đạp nằm', 'Xe fat bike', 'Xe đạp gấp', 'Xe cruiser bãi biển', 'Xe fixie', 'Xe đạp tre', 'Xe velomobile', 'Xe đạp một bánh'];
const BIKE_GOLD = [0, 34, 21, 34, 21, 21, 55, 34, 34, 55, 55, 34, 55, 34, 21, 21, 34, 34, 89, 55];
export const ITEMS = [
  // ---------- (a) ĐỒ MẶC ----------
  W('cape-do', 'cape', '🧥', 'Áo choàng Đỏ thẫm', 21, 'Áo choàng phù thuỷ may vừa người.', { col: '#9b2335' }),
  W('cape-lam', 'cape', '🧥', 'Áo choàng Lam đêm', 21, 'Hợp đi ngắm sao trên tháp thiên văn.', { col: '#24346b' }),
  W('cape-luc', 'cape', '🧥', 'Áo choàng Lục rừng', 21, 'Màu của rừng thông Đồi Thông.', { col: '#2f6b45' }),
  W('cape-tim', 'cape', '🧥', 'Áo choàng Tím sao', 21, 'Thêu chòm sao nhỏ ở vạt áo.', { col: '#5b3a8e' }),
  W('cape-vang', 'cape', '🧥', 'Áo choàng Vàng nghệ', 21, 'Sáng như nắng sớm.', { col: '#c9962a' }),
  W('cape-den', 'cape', '🧥', 'Áo choàng Đen tuyền', 21, 'Bí ẩn như bầu trời đêm.', { col: '#26232b' }),
  W('cape-hong', 'cape', '🧥', 'Áo choàng Hồng Pha Lê', 0, 'Đồ đặc biệt: ánh hồng như kim cương.', { col: '#d0508a', price: { gem: 34 } }),
  W('hat-tim', 'hat', '🎩', 'Mũ chóp Tím sao', 13, 'Mũ chóp nhọn, cao đúng 1/φ³ chiều cao người.', { col: '#6b4aa8' }),
  W('hat-lam', 'hat', '🎩', 'Mũ chóp Lam đêm', 13, 'Mũ chóp nhọn màu trời đêm.', { col: '#2a3f7a' }),
  W('hat-do', 'hat', '🎩', 'Mũ chóp Đỏ thẫm', 13, 'Mũ chóp nhọn màu đỏ thẫm.', { col: '#8e2433' }),
  W('glass-round', 'glasses', '👓', 'Kính tròn', 21, 'Gọng tròn như kính của nhà thiên văn.', { v: 'round' }),
  W('glass-square', 'glasses', '🤓', 'Kính vuông', 21, 'Gọng vuông chững chạc.', { v: 'square' }),
  W('scarf-fibo', 'scarf', '🧣', 'Khăn sọc Fibonacci', 34, 'Sọc rộng theo tỉ lệ 5:1:2:1:3 — không phải sọc đều đâu!'),
  W('shoe-do', 'shoes', '👟', 'Giày đỏ chạy nhanh', 13, 'Đôi giày màu đỏ tươi.', { col: '#d23a3a' }),
  W('shoe-lam', 'shoes', '👟', 'Giày lam biển', 13, 'Màu xanh như biển Đảo Rubik.', { col: '#2f7fd0' }),
  W('shoe-vang', 'shoes', '👢', 'Ủng vàng đi mưa', 21, 'Lội nước thoải mái.', { col: '#f2c14e' }),
  W('bag-cam', 'pack', '🎒', 'Ba lô cam', 21, 'Ba lô đeo lưng đi học.', { col: '#f08a24' }),
  W('bag-xanh', 'pack', '🎒', 'Ba lô xanh lá', 21, 'Ba lô đeo lưng màu lá non.', { col: '#3fa36b' }),
  W('bag-pha-le', 'pack', '💼', 'Ba lô Pha Lê', 0, 'Đồ đặc biệt: lấp lánh ánh hồng.', { col: '#ff7ab8', price: { gem: 21 } }),
  // ---------- (b) PHƯƠNG TIỆN ----------
  ...BIKE_NAMES.map((n, i) => R('bike-' + i, 'bike', i === 19 ? '🛞' : '🚲', n, { gold: BIKE_GOLD[i] }, i ? 'Xe đạp khắp thế giới — mỗi kiểu kèm một điều thú vị.' : 'Quà tặng khi vào đảo: chiếc xe đạp đầu tiên của em!', { style: i })),
  R('ride-balloon', 'balloon', '🎈', 'Khinh khí cầu', { gold: 89 }, 'Bay lên ngắm toàn cảnh đảo. Phím T.'),
  R('ride-plane', 'plane', '✈️', 'Bằng lái máy bay', { gold: 144 }, 'Lái máy bay cổ điển ở Sân bay Cánh Diều.'),
  R('broom-tap', 'broom', '🧹', 'Chổi Tập Bay', { gold: 21 }, 'Chậm, êm, dễ lái — dành cho người mới. Phím J.'),
  R('broom', 'broom', '🧹', 'Chổi bay gỗ sồi', { gold: 34 }, 'Gỗ sồi chắc, bay 13 m/s.'),
  R('broom-tre', 'broom', '🧹', 'Chổi Tre Gió Lộng', { gold: 55 }, 'Tre rỗng ruột nên nhẹ, bay 17 m/s.'),
  R('broom-vang', 'broom', '🧹', 'Chổi bay cán vàng', { gold: 89 }, 'Lướt gió 21 m/s.'),
  R('broom-sao', 'broom', '🌠', 'Chổi Sao Băng', { gold: 144 }, 'Tăng tốc gấp đôi như sao băng.'),
  R('board-bac', 'board', '🏄', 'Ván bạc bay', { gold: 233 }, 'Lướt là là mặt biển, nhào lộn trên không (phím U). Bạc phản xạ ánh sáng tốt nhất trong mọi kim loại.'),
  // ---------- (d) THÚ CƯNG ----------
  { id: 'pet-meo', tab: 'pet', icon: '🐱', name: 'Mèo mướp', price: { gold: 21 }, desc: 'Mèo ngủ tới 13–16 giờ mỗi ngày!' },
  { id: 'pet-cun', tab: 'pet', icon: '🐶', name: 'Cún Shiba', price: { gold: 21 }, desc: 'Giống chó cổ của Nhật Bản.' },
  { id: 'pet-cao', tab: 'pet', icon: '🦊', name: 'Cáo nhỏ', price: { gold: 34 }, desc: 'Cáo nghe được tiếng chuột chạy dưới lớp tuyết.' },
  { id: 'pet-ech', tab: 'pet', icon: '🐸', name: 'Ếch xanh', price: { gold: 13 }, desc: 'Hồi bé là nòng nọc bơi dưới nước.' },
  { id: 'pet-cu', tab: 'pet', icon: '🦉', name: 'Cú mèo nhỏ', price: { gold: 34 }, desc: 'Bay lượn theo vai em.' },
  // ---------- (c) VẬT PHẨM NHẶT ĐƯỢC ----------
  L('shell', '🐚', 'Vỏ sò', 2, 'Vỏ sò được làm từ can-xi các-bô-nát — chất giống đá vôi.'),
  L('conch', '🐚', 'Ốc xà cừ', 5, 'Lớp xà cừ óng ánh vì ánh sáng phản xạ qua nhiều lớp mỏng.'),
  L('pearl', '⚪', 'Ngọc trai', 13, 'Trai bọc hạt cát bằng nhiều lớp xà cừ mà thành ngọc.', 'gem'),
  L('crystal', '🔷', 'Pha lê xanh', 8, 'Pha lê thiên nhiên là thạch anh — có 6 mặt bên.', 'gem'),
  L('ruby', '🔴', 'Hồng ngọc', 13, 'Hồng ngọc đỏ nhờ một chút nguyên tố crôm.', 'gem'),
  L('amber', '🟠', 'Hổ phách', 8, 'Hổ phách là nhựa cây hoá thạch hàng triệu năm.', 'gem'),
  L('herb', '🌿', 'Lá thuốc', 2, 'Lá cây làm thức ăn nhờ quang hợp.'),
  L('mushroom', '🍄', 'Nấm rừng', 3, 'Nấm không phải thực vật: nấm không có diệp lục.'),
  L('flower', '🌸', 'Hoa dại', 2, 'Hoa có màu sặc sỡ để mời ong, bướm tới thụ phấn.'),
  L('feather', '🪶', 'Lông chim', 3, 'Lông chim rỗng ruột nên rất nhẹ.'),
  L('wood', '🪵', 'Khúc gỗ', 2, 'Vòng gỗ: mỗi năm cây thêm một vòng.'),
  L('stone', '🪨', 'Đá cuội', 1, 'Đá cuội tròn nhẵn vì nước suối mài hàng nghìn năm.'),
  L('book', '📘', 'Sách cũ', 5, 'Sách in đầu tiên ở Việt Nam bằng ván khắc gỗ.', 'book'),
  L('scroll', '📜', 'Cuộn giấy dó', 5, 'Giấy dó làm từ vỏ cây dó, bền cả trăm năm.', 'book'),
  L('map-piece', '🗺️', 'Mảnh bản đồ', 8, 'Bản đồ luôn có hướng Bắc ở phía trên.', 'quest'),
  L('key-old', '🗝️', 'Chìa khoá cổ', 13, 'Chìa khoá đồng — đồng là kim loại dẫn điện tốt.', 'quest'),
];
export const ITEM = Object.fromEntries(ITEMS.map(x => [x.id, x]));
// gói kim cương: cấu hình thật ở server (biến môi trường GEM_PACKS); đây chỉ là mặc định để hiển thị khi chưa hỏi được server
export const GEM_PACKS = [{ id: 'gem-21', gems: 21, price: 10000 }, { id: 'gem-55', gems: 55, price: 22000 }, { id: 'gem-144', gems: 144, price: 49000 }];
