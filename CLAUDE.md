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
- `client/` website + game 2D (Phaser) + đảo 3D (`ocean.html`, `js/island/`).
- `client/js/island/sea/` thế giới đại dương: đội tàu thuyền theo tuyến (`fleet.js`), Làng chài Vịnh Én (`village.js`), ngư dân & câu cá (`folk.js`), lái buồm/ca nô/đi phà (`pilot.js`), cá heo – cá voi – sương – giông (`wild.js`); số liệu bố cục ở `site.js`.
- `server/index.js` Express + Socket.io (namespace `/island` cho đảo 3D).
- `client/assets/` model .glb, âm thanh; nguồn ghi trong `client/assets/CREDITS.txt` (chỉ dùng tài nguyên CC0).
- `.claude/skills/` skill dùng chung: `lowpoly-style`, `open-world-lowpoly` (giới hạn tam giác, instancing, fog, chunk).
- `docs/` quy trình Blender → .glb, checklist App Store.

## Tiết kiệm token (chủ dự án yêu cầu)
- Ưu tiên lấy sẵn, miễn phí: model 3D CC0 (Quaternius, KayKit, Kenney, Poly Pizza lọc CC0), texture/HDRI CC0 (Poly Haven, ambientCG), shader/hiệu ứng mã nguồn mở giấy phép MIT/CC0 (three.js examples, thư viện npm) — ghi nguồn vào client/assets/CREDITS.txt.
- Chỉ viết code mới khi không có sẵn; viết ngắn, sửa đúng chỗ, không viết lại cả file. Không dựng hình bằng code khi đã có model CC0 thay được.
