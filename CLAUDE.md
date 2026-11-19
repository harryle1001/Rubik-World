# Rubik-World — quy tắc làm việc cho Claude

## Cách làm tính năng lớn
1. **Lên kế hoạch trước (chế độ plan):** chia tính năng thành các bước nhỏ, ví dụ: địa hình → điều khiển nhân vật → load chunk → rải cây/NPC. Đưa kế hoạch cho chủ dự án duyệt rồi mới viết code hàng loạt.
2. **Greybox trước, làm đẹp sau:** dựng thử bằng khối cơ bản (hộp, cầu, trụ) để kiểm tra vật lý, tỷ lệ bản đồ và lối chơi; chỉ nạp model 3D và hiệu ứng khi khung đã chạy đúng.
3. **Mỗi tính năng một commit:** chạy thử (có ảnh chụp màn hình) rồi commit riêng. Không sửa lan sang file đang chạy ổn định nếu không cần. Sau mỗi tính năng lớn, chủ dự án có thể gõ `/clear` để làm mới ngữ cảnh: đọc lại file này và lịch sử git để nắm tiến độ.

## Tỷ lệ vàng (bắt buộc)
- Áp φ ≈ 1,618 (hằng PHI trong client/js/island/layout.js), dãy Fibonacci và π vào mọi thiết kế: kiến trúc, lô đất, khoảng cách, nhân vật, camera, HUD, cỡ chữ, hiệu ứng.

## Phong cách trả lời
- Tiếng Việt, ngắn gọn, đi thẳng vào việc; chỉ sửa đúng phần cần sửa.
- Game cho học sinh: ưu tiên chạy mượt trên điện thoại, nội dung học lồng vào lối chơi, phù hợp lứa tuổi.

## Bản đồ dự án
- `client/` đảo 3D (`ocean.html`, `js/island/`) — game duy nhất, mở ở `/`. Game 2D (`client/school/`, `world-2d.html`) chỉ lưu trữ, không liên kết.
- `client/js/island/story/` cốt truyện 8 chương "Khối Rubik Pha Lê" (data.js nội dung, index.js nhiệm vụ/dẫn đường/đoạn dẫn chuyện, journal.js cấp độ-kỹ năng-danh hiệu-📔 sổ tay, valley.js Thung lũng Rồng); `learn.js` ngân hàng câu hỏi chung + học thích ứng (mọi nơi hỏi câu đều qua đây).
- `client/js/island/economy/` ví 🪙 đồng vàng (kiếm khi chơi) · 💎 kim cương hồng (chỉ nạp qua cổng phụ huynh), 🎒 cặp sách 4 ngăn (B/I), 🛒 cửa hàng, ✨ nhặt đồ; `catalog.js` = giá dùng chung client + `server/economy.js` (máy chủ giữ số dư). Không lootbox.
- `server/index.js` Express + Socket.io (namespace `/island` cho đảo 3D).
- `client/assets/` model .glb, âm thanh; nguồn ghi trong `client/assets/CREDITS.txt` (chỉ dùng tài nguyên CC0).
- `.claude/skills/` skill dùng chung: `lowpoly-style`, `open-world-lowpoly` (giới hạn tam giác, instancing, fog, chunk).
- `docs/` quy trình Blender → .glb, checklist App Store.

## Tiết kiệm token (chủ dự án yêu cầu)
- Ưu tiên lấy sẵn, miễn phí: model 3D CC0 (Quaternius, KayKit, Kenney, Poly Pizza lọc CC0), texture/HDRI CC0 (Poly Haven, ambientCG), shader/hiệu ứng mã nguồn mở giấy phép MIT/CC0 (three.js examples, thư viện npm) — ghi nguồn vào client/assets/CREDITS.txt.
- Chỉ viết code mới khi không có sẵn; viết ngắn, sửa đúng chỗ, không viết lại cả file. Không dựng hình bằng code khi đã có model CC0 thay được.
