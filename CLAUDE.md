# Rubik-World — quy tắc làm việc cho Claude

## Cách làm tính năng lớn
1. **Lên kế hoạch trước (chế độ plan):** chia tính năng thành các bước nhỏ, ví dụ: địa hình → điều khiển nhân vật → load chunk → rải cây/NPC. Đưa kế hoạch cho chủ dự án duyệt rồi mới viết code hàng loạt.
2. **Greybox trước, làm đẹp sau:** dựng thử bằng khối cơ bản (hộp, cầu, trụ) để kiểm tra vật lý, tỷ lệ bản đồ và lối chơi; chỉ nạp model 3D và hiệu ứng khi khung đã chạy đúng.
3. **Mỗi tính năng một commit:** chạy thử (có ảnh chụp màn hình) rồi commit riêng. Không sửa lan sang file đang chạy ổn định nếu không cần. Sau mỗi tính năng lớn, chủ dự án có thể gõ `/clear` để làm mới ngữ cảnh: đọc lại file này và lịch sử git để nắm tiến độ.

## Phong cách trả lời
- Tiếng Việt, ngắn gọn, đi thẳng vào việc; chỉ sửa đúng phần cần sửa.
- Game cho học sinh: ưu tiên chạy mượt trên điện thoại, nội dung học lồng vào lối chơi, phù hợp lứa tuổi.

## Bản đồ dự án
- `client/` website + game 2D (Phaser) + đảo 3D (`ocean.html`, `js/island/`).
- `server/index.js` Express + Socket.io (namespace `/island` cho đảo 3D).
- `client/assets/` model .glb, âm thanh; nguồn ghi trong `client/assets/CREDITS.txt` (chỉ dùng tài nguyên CC0).
- `.claude/skills/` skill dùng chung: `lowpoly-style`, `open-world-lowpoly` (giới hạn tam giác, instancing, fog, chunk).
- `docs/` quy trình Blender → .glb, checklist App Store.
