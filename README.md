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
- `client/js/world.js`: vẽ từng khu như một trang riêng, gồm mây cá voi và mây sóng, vệ tinh, đại bàng, vẹt và cảnh bắn tên lửa.
- `client/js/ui.js`: các bảng HTML (cửa hàng chọn màu, vườn, cờ vua, kính viễn vọng, piano, vẽ tranh).
- `client/js/main.js`: đăng nhập, kết nối socket, `ZoneScene` của Phaser.
- `public/assets/`: chỗ để ảnh và âm thanh riêng (phục vụ tại `/assets`).
- `data/players.json`: tiến trình người chơi, lưu theo tên.

## Điều khiển
Mũi tên/WASD: di chuyển · E hoặc bấm chuột: tương tác · Enter: chat · Esc: đóng bảng.
