# Lộ trình cho AI agent nâng cấp game (chạy mỗi đêm)

Agent đọc file này mỗi lần chạy, làm **1 việc** ở đầu mục "Việc tiếp theo", rồi chuyển việc đó xuống "Nhật ký" (ghi ngày, kết quả, số đo). Chủ dự án có thể thêm, xoá hoặc sắp xếp lại việc ở đây bất cứ lúc nào: agent luôn làm theo thứ tự trong file.

## Quy tắc
- Đọc CLAUDE.md trước. Mỗi lần chỉ làm 1 việc nhỏ, xong trọn vẹn, có ảnh chụp kiểm tra.
- Không làm hỏng thứ đang chạy tốt: chạy thử trước khi ghép (vào game trước cổng trường, máy bay cất cánh, bản đồ M, cửa vào mini game, không lỗi console).
- Điện thoại phải mượt: không để draw call trước cổng trường tăng; mục tiêu < 150.
- Chỉ tài nguyên CC0, ghi client/assets/CREDITS.txt. Không nhạc/nhân vật có bản quyền. An toàn cho trẻ em (không chat tự do).
- Nội dung học lồng vào lối chơi, hợp lứa tuổi học sinh.

## Việc tiếp theo
1. Camera thứ 3 cao hơn, nhìn xa hơn, mượt hơn (kéo xoay, tự né tường); giữ ổn định khi chạy trên điện thoại.
2. Hiệu năng điện thoại: giảm draw call trước cổng trường xuống < 150 (gộp mesh, tắt bóng vật nhỏ, LOD người ở xa).
3. Cập nhật Xưởng Nhân Vật (https://claude.ai/artifact/Gkr6gn9gZRPL6dtLym67Fr) sang nhân vật dáng Zelda mới (people-model.js).
4. Nhiệm vụ học tập: bảng nhiệm vụ hằng ngày (đi tới 3 khu, trả lời 3 câu đố của thầy cô, thu thập 5 viên pha lê) có phần thưởng.
5. Thầy cô và NPC hỏi đố theo môn (Toán, Tiếng Việt, Khoa học, Lịch sử – Địa lý) khi bấm E nói chuyện.
6. Sự kiện theo giờ: chào cờ sáng thứ Hai, giờ ra chơi có học sinh chơi đá cầu, tối có đèn lồng.
7. Âm thanh: tiếng mưa trên mái, tiếng động cơ máy bay thu thật (CC0), nhạc theo thời tiết.
8. Thêm phương tiện: thuyền buồm đi giữa các đảo, xe buýt trường chạy theo đường vòng.
9. Hướng dẫn chơi lần đầu (3 bước ngắn, có thể bỏ qua) cho học sinh nhỏ tuổi.
10. Kiểm tra tổng thể: tìm lỗi (rơi khỏi bản đồ, kẹt tường, nút không bấm được) và sửa.

## Nhật ký
- 2026-11-15: Tạo lộ trình. Bản hiện tại: sân bay + máy bay cổ điển, nhân vật dáng Zelda, vật lý, thời tiết, quy hoạch tỷ lệ vàng + π.
