// shop-data.js — Danh mục mặc định của Cửa hàng Rubik World (đồ thật cho phụ huynh) + vật phẩm độc quyền đổi bằng mã.
// Chủ dự án sửa giá/tồn kho/ảnh trong /admin (lưu ở data/shop.json); file này chỉ là dữ liệu khởi tạo lần đầu.
// Giá theo VNĐ. Ảnh mặc định: SVG minh hoạ trong client/shop/img/ (thay bằng ảnh chụp thật khi nhập hàng).
const CATS = [
  ['rubik', 'Khối Rubik'], ['sach', 'Sách bài tập & truyện'], ['nha', 'Đồ 4 nhà Tứ Linh'], ['sticker', 'Sticker'], ['combo', 'Combo quà'],
];
// Vật phẩm trong game nhận được khi nhập mã in trên thẻ/hộp (id trùng client: wear.js / brooms.js / village-pieces.js)
const REWARDS = {
  'cape-hoangkim': { kind: 'cape', name: 'Áo choàng Hoàng Kim Rubik', icon: '🧥' },
  'pet-nai': { kind: 'pet', name: 'Thú cưng Nai Sao', icon: '🦌' },
  'broom-cauvong': { kind: 'broom', name: 'Chổi Cầu Vồng', icon: '🧹' },
  'rubik-vang': { kind: 'item', name: 'Khối Rubik Vàng (đặt trong nhà)', icon: '🏆' },
};
const P = (id, cat, name, price, stock, desc, reward, img) => ({ id, cat, name, price, stock, desc, reward, img: img || `/shop/img/${id}.svg`, active: true });
const PRODUCTS = [
  P('rubik-2x2', 'rubik', 'Khối Rubik 2×2 Mini', 89000, 50, 'Khối 2×2 xoay trơn, góc bo tròn an toàn, vừa tay bé 6+. Kèm thẻ hướng dẫn giải 3 bước.', 'rubik-vang', '/shop/img/rubik-2.svg'),
  P('rubik-3x3', 'rubik', 'Khối Rubik 3×3 Tiêu Chuẩn', 129000, 80, 'Khối 3×3 nam châm định vị, miếng dán in chìm không bong. Kèm sách nhỏ "Giải Rubik 7 bước".', 'rubik-vang', '/shop/img/rubik-3.svg'),
  P('rubik-4x4', 'rubik', 'Khối Rubik 4×4 Revenge', 219000, 30, 'Thử thách tiếp theo sau 3×3: luyện tư duy không gian và trí nhớ thuật toán.', 'broom-cauvong', '/shop/img/rubik-4.svg'),
  P('megaminx', 'rubik', 'Megaminx 12 mặt', 259000, 20, 'Khối 12 mặt ngũ giác — bài học hình học không gian sống động (khối mười hai mặt đều).', 'broom-cauvong', '/shop/img/megaminx.svg'),
  P('sach-bai-tap', 'sach', 'Sách bài tập Toán Rubik (lớp 2–5)', 79000, 100, '89 bài toán vui về số, hình và quy luật Fibonacci, có lời giải. Khổ A5, 96 trang.', 'cape-hoangkim', '/shop/img/sach.svg'),
  P('truyen-dao-rubik', 'sach', 'Truyện tranh "Phiêu lưu Đảo Rubik"', 69000, 100, 'Truyện tranh màu 64 trang: các bạn nhỏ khám phá Học viện Pha Lê và giải mật mã bằng toán.', 'pet-nai', '/shop/img/truyen.svg'),
  P('ao-long', 'nha', 'Áo thun nhà Thanh Long', 159000, 40, 'Áo cotton 100% in logo nhà Thanh Long. Size 4–14 tuổi (ghi size trong ô ghi chú).', 'cape-hoangkim', '/shop/img/ao-long.svg'),
  P('ao-phung', 'nha', 'Áo thun nhà Chu Tước', 159000, 40, 'Áo cotton 100% in logo nhà Chu Tước. Size 4–14 tuổi (ghi size trong ô ghi chú).', 'cape-hoangkim', '/shop/img/ao-phung.svg'),
  P('ao-lan', 'nha', 'Áo thun nhà Kỳ Lân', 159000, 40, 'Áo cotton 100% in logo nhà Kỳ Lân. Size 4–14 tuổi (ghi size trong ô ghi chú).', 'cape-hoangkim', '/shop/img/ao-lan.svg'),
  P('ao-quy', 'nha', 'Áo thun nhà Huyền Quy', 159000, 40, 'Áo cotton 100% in logo nhà Huyền Quy. Size 4–14 tuổi (ghi size trong ô ghi chú).', 'cape-hoangkim', '/shop/img/ao-quy.svg'),
  P('khan-tu-linh', 'nha', 'Khăn quàng 4 nhà Tứ Linh', 99000, 60, 'Khăn len mềm, chọn màu nhà trong ô ghi chú (Long đỏ · Phụng lam · Lân lục · Quy tím).', 'cape-hoangkim', '/shop/img/khan.svg'),
  P('huy-hieu', 'nha', 'Bộ 4 huy hiệu Tứ Linh', 59000, 120, 'Huy hiệu cài áo kim loại, men màu, ghim khoá an toàn.', 'pet-nai', '/shop/img/huy-hieu.svg'),
  P('sticker', 'sticker', 'Bộ sticker Đảo Rubik (34 hình)', 39000, 200, 'Sticker vinyl chống nước: khối Rubik, rồng, chổi bay, linh vật 4 nhà.', 'pet-nai', '/shop/img/sticker.svg'),
  P('combo-nhap-mon', 'combo', 'Combo Nhập Môn: Rubik 3×3 + Sách bài tập + Sticker', 219000, 30, 'Tiết kiệm 28.000đ. Kèm 1 thẻ mã quà "Khối Rubik Vàng".', 'rubik-vang', '/shop/img/combo.svg'),
  P('combo-hoc-vien', 'combo', 'Combo Học Viện: Rubik 2×2 + 3×3 + Áo nhà + Huy hiệu', 399000, 20, 'Hộp quà sinh nhật. Kèm 1 thẻ mã quà "Chổi Cầu Vồng".', 'broom-cauvong', '/shop/img/combo.svg'),
];
module.exports = { CATS, REWARDS, PRODUCTS };
