# Game feel — ghi chú đo & ảnh

Đo bằng Chromium headless (SwiftShader, chỉ so sánh tương đối), chế độ ⚡ Mượt, 12:30, trời quang, cổng trường.
Trước khi sửa: draw call trung vị 214 (mức 3).

## 1. Âm nhạc thích ứng & âm thanh 3D (`js/island/audio.js`)
- 3 bus GainNode: 🎵 nhạc · 💥 hiệu ứng · 🗣️ giọng nói (tiếng học sinh/đám đông) — bảng 🎚️ trong menu ☰, lưu trên máy.
- Nhạc: hoạt động (✈️ bay / 🚂 tàu / ✨ phép thuật) › khu › ngày-đêm, crossfade; Học viện Pha Lê: nhạc phép thuật (ngày) + "Rising Moon" (đêm); Làng nổi, Đền Tri Thức: ngũ cung phương Đông (CC0, CREDITS.txt).
- Lớp nhịp 89 BPM tổng hợp (OfflineAudioContext, dựng 1 lần) to dần theo cường độ: chạy, đạp xe, bay, mini game.
- Gió vù vù khi bay (theo tốc độ), chuông điện trường lúc vào/hết giờ ra chơi (PannerNode tại sân trường).
- 0 draw call thêm.
![](1-am-thanh.png)
