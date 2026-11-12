# The Rubik School — cấu trúc file

`index.html` chỉ còn giao diện (HTML) và một bộ nạp nhỏ. Bộ nạp tải các file `js/` **theo đúng thứ tự trong danh sách FILES**, ghép lại và chạy như MỘT chương trình, nên mọi biến/hàm dùng chung như trước.

| Thư mục / file | Nội dung |
|---|---|
| `css/style.css` | Toàn bộ giao diện (CSS) |
| `js/core/` | Thế giới, trạng thái, nhân vật, sự kiện, thời tiết, camera, vòng lặp game |
| `js/map.js` | Vẽ bản đồ, biển, bầu trời, công viên |
| `js/ui/` | Nút, nhạc nền, nhiệm vụ, thông báo, cửa sổ |
| `js/games/` | Từng trò chơi: cờ vua, Rubik 3D, câu cá, arcade, caro/cờ vây, vẽ & nhạc, thư viện, thế vận hội, Rubik Lab, đọc sách… |
| `js/shop.js`, `js/shop-mall-market.js` | Tài khoản, level, cửa hàng, trung tâm thương mại, chợ |
| `js/world/`, `js/player/` | Khu vực mới, nông trại, phố nhà; điều khiển nhân vật, tự đi |
| `js/online.js` | Sảnh online, game 2 người |
| `js/ext/vNN-*.js` | Các bản nâng cấp v16 → v35 |
| `js/npc-hosts.js` | NPC mời chơi trước mỗi khu (v36) |
| `js/data/` | Dữ liệu lớn: tiếng piano, kho sách |
| `js/main.js` | Khởi động game (luôn đứng CUỐI danh sách) |

**Thêm tính năng mới:** tạo file mới trong `js/` (ví dụ `js/ext/v37-ten.js`) chứa hàm `v37Init()`, thêm tên file vào danh sách FILES trong `index.html` ngay TRƯỚC `'js/main.js'`, rồi gọi `try { v37Init(); } catch(e){ console.warn('v37', e); }` trong `js/main.js` sau v36.
