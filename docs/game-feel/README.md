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

## 2. Cảm giác game (`js/island/feel.js`)
- Vệt gió khi bay ≥ 21 m/s: 89 đoạn thẳng trong không gian camera, chạy trên GPU — **+1 draw call, chỉ khi bay nhanh** (ẩn hẳn khi đi bộ).
- Rung camera (xoay nhẹ, tắt dần) khi tiếp đất từ cao; 📳 rung điện thoại tuỳ chọn (bảng 🎚️, mặc định tắt).
- Xu 🪙 tung theo góc vàng rồi bay vào chip xu, chữ +XP, "Lên cấp" — tự bắt mọi lần cộng xu/XP qua `account.onChange`.
- Màn chuyển tối-mở (~0,4 s) khi camera nhảy xa (vào nhà, lên tầng), vào/ra mini game; tên vùng kiểu điện ảnh (khung đen + chữ serif, hợp âm rải khi vùng mới).
- Bụi khi chạy (player.js) và nước bắn khi lội (living.js) đã có sẵn — giữ nguyên.
![](2-ten-vung-xp.png) ![](2-vet-gio.png)

## 3. Hình ảnh
- Nước: mây trôi phản chiếu theo tia phản xạ (uniform `uCloudR`, dày theo độ mây của thời tiết) — `ocean-water.js`, `weather.js`.
- Đã có sẵn, giữ nguyên: bóng mây trôi trên mặt đất (weather.js), cầu vồng sau mưa (weather.js), sao băng ban đêm (easter-eggs.js, skyshow.js), đom đóm (ambience.js).
- ⚡ Mượt (mức ≥ 2): tắt mây phản chiếu và bóng mây (trước chỉ tắt ở mức 3).
- Đo ⚡ Mượt tại cổng trường: 213 draw call (trước 214) — 0 draw call thêm.
![](3-may-phan-chieu.png)

## 4. Chế độ chụp ảnh 📷 (`js/island/photo.js`, menu ☰ hoặc phím O)
- Dừng thời gian (ocean.js bỏ qua mọi cập nhật thế giới, chỉ vẽ), camera xoay quanh tự do: kéo/chụm/lăn chuột, WASD dời, Q/E lên-xuống.
- 7 bộ lọc (Gốc, Rực rỡ, Ấm áp, Mát lạnh, Hoài cổ, Đen trắng, Điện ảnh) chỉnh thẳng uniform hậu kỳ → ảnh lưu đúng màu lọc.
- 🙈 Ẩn nút (chạm để hiện lại), 📸 lưu PNG về máy: khung viền 1/φ⁶, dải chữ = viền·φ², logo game + tên vùng + ngày + tên người chơi; tiếng màn trập, chớp sáng.
- 0 draw call thêm. Thoát: ✖ hoặc Esc.
![](4-che-do-chup.png) ![](4-anh-luu.png)

## 5. Thời tiết như bản 2D + theo mùa (`weather.js`, `terrain.js`)
- Thêm: 🌦️ mưa phùn · 💨 trời nổi gió · 🥵 nắng nóng · 🧊 mưa đá · ❄️ tuyết (phủ trắng nền, mái; tan ~2 phút) · 🌨️ bão tuyết — dùng lại hạt mưa (đổi tốc độ rơi, độ dài vệt, màu, chao lượn), mỗi kiểu kèm 1 câu kiến thức.
- Thời tiết chọn theo mùa thật (tỷ lệ như bản 2D; tuyết chỉ mùa đông). Lá cây, cỏ, nền đổi màu: xuân xanh non · thu vàng cam · đông nhạt sương giá.
- 0 draw call thêm. Gỡ lỗi: `?weather=snow&season=dong`, `__island.weather.setSeason('thu')`.
![](5-tuyet-mua-dong.png)
