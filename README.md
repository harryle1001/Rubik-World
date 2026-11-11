# Thế giới Trường Rubik · Multiplayer

Game web nhiều người chơi thời gian thực: **Node.js + Express + Socket.io + Phaser 3**.

```bash
npm install
npm start          # http://localhost:3000
npm run dev        # tự khởi động lại server khi sửa code
```

Mở 2 tab (hoặc 2 máy cùng mạng) vào cùng địa chỉ để thấy nhau di chuyển.

## Cấu trúc
- `server/index.js`: Express phục vụ client, Socket.io đồng bộ người chơi, sao, xu, vườn, mua hàng, cờ vua (server quyết định kết quả).
- `client/js/shared.js`: dữ liệu dùng chung cho server và client (khu vực, lối ra, cửa hàng, cây trồng).
- `client/js/avatar.js`: vẽ nhân vật, 8 mẫu xe đạp và mũ (dùng cho Phaser và canvas xem trước).
- `client/js/world.js`: vẽ từng khu như một trang riêng, gồm mây cá voi và mây sóng, vệ tinh, đại bàng, vẹt, cảnh bắn tên lửa và nông trại cộng sinh (đàn cừu tự lùa theo chó chăn cừu).
- `client/js/ui.js`: các bảng HTML (cửa hàng chọn màu, vườn, cờ vua, kính viễn vọng, piano, vẽ tranh).
- `client/js/extras.js`: cần điều khiển cảm ứng, bản đồ nhỏ, Người Thầy Ánh Sáng ở mỗi khu, âm thanh môi trường tạo bằng WebAudio.
- `client/js/main.js`: đăng nhập, kết nối socket, `ZoneScene` của Phaser.
- `public/assets/`: chỗ để ảnh và âm thanh riêng (phục vụ tại `/assets`).
- `data/players.json`: tiến trình người chơi, lưu theo tên.

## Điều khiển
Mũi tên/WASD: di chuyển · E hoặc bấm chuột: tương tác · Enter: chat · Esc: đóng bảng · M: bật/tắt bản đồ nhỏ.

Trên điện thoại/máy tính bảng: cần điều khiển ở góc trái dưới, nút **E** ở góc phải dưới, nút **Chat** để mở khung chat.

## Tính năng thêm
- **Người Thầy Ánh Sáng**: mỗi khu chính (lớp học, năng khiếu, thể thao, gym, công viên, nông trại, đồi thiên văn) có một người thầy hiền hậu. Bấm E để nghe lời dạy (theo tinh thần Đức Phật, Chúa Jesus, ca dao tục ngữ Việt) và mẹo chơi.
- **Âm thanh môi trường** tạo bằng WebAudio, không cần file: chim hót trong rừng/công viên/nông trại, sóng biển, dế kêu trên đồi, tiếng phòng yên tĩnh trong nhà. Nút "Âm thanh" để bật/tắt (được ghi nhớ).
- **Bản đồ nhỏ** dưới bảng xếp hạng: vùng đi được, lối ra (vàng), bạn (chấm vàng), người khác (chấm trắng).
- **Tìm bạn**: bấm vào tên người đang online trong bảng xếp hạng để biết họ đang ở khu nào.

## Cài như app trên điện thoại (web app / PWA)
Game là một web app: có icon, mở toàn màn hình, tải nhanh nhờ bộ nhớ đệm, và hiện trang chờ khi mất mạng.
- **iPhone:** mở trang bằng Safari, bấm Chia sẻ, chọn "Thêm vào Màn hình chính" (nút "📲 Cài app" trong game có hướng dẫn).
- **Android / máy tính (Chrome, Edge):** bấm "📲 Cài app" trong game.
- Web app chỉ cài được khi trang chạy qua **https** (hoặc `localhost`). Cách dễ nhất là đưa lên Render: New, chọn Blueprint, chọn repo này (đã có `render.yaml`).
- Gói miễn phí của Render không giữ file khi server khởi động lại, nên `data/` (người chơi, đồ trang trí) có thể mất. Muốn giữ lâu dài hãy gắn ổ đĩa (Disk) hoặc dùng gói trả phí.

## Chế độ Sửa (chỉ chủ game)
- Khi chạy server, cửa sổ dòng lệnh in ra **mã chủ game**. Mã được lưu ở `data/admin.json`, file này không đưa lên git. Bạn cũng có thể tự đặt mã bằng biến môi trường `ADMIN_KEY`.
- Ở màn hình đăng nhập, mở "🔑 Tôi là chủ game" và nhập mã. Chỉ khi mã đúng, nút **✏️ Sửa** mới hiện ra.
- Trong chế độ Sửa có 3 phần:
  - **Trang trí:** đặt cây, hoa, ghế, đèn, tượng, đài phun nước, bảng có chữ… Kéo để dời, chọn rồi Xóa.
  - **Tên & bảng chỉ dẫn:** đổi tên khu và chữ trên các bảng chỉ đường.
  - **Giá cửa hàng:** chỉnh giá từng món.
- Mọi người chơi thấy thay đổi ngay. Máy chủ kiểm tra mã ở **mọi** lệnh sửa, người khác không sửa được dù có tự mở nút. Dữ liệu lưu ở `data/world.json`.
