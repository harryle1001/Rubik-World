# Đo hiệu năng Đảo 3D ở chế độ điện thoại

Đo bằng `node tools/perf-mobile.mjs --out=thu-muc` (Playwright, 390×844, DPR 2, cảm ứng, UA iPhone → `CFG.isMobile`),
chất lượng khoá mức 1 (mức điện thoại khởi đầu), giờ khoá 13h, trung bình 89 khung. GPU giả lập (SwiftShader) nên FPS
tuyệt đối không phản ánh máy thật — chỉ so sánh draw call, tam giác, dung lượng tải. Ảnh: mỗi thư mục 1 bước.

| Bước | Cổng trường (call / tam giác) | Quảng trường | Sân bay | Ghi chú |
|---|---|---|---|---|
| before | 188 / 732 k | 156 / 524 k | 103 / 273 k | gốc |
| 01-gop-kit | 173 / 721 k | 144 / 524 k | 99 / 274 k | gộp các phần model rải (cây, xe, lều…) thành 1 lưới màu đỉnh |
| 02-bong-lod | 167 / 718 k | 143 / 523 k | 103 / 274 k | điện thoại: vật < 1/φ m không đổ bóng; người xa > 21 m dùng LOD khối (trước 34 m) |
| 03-nan | 175 / 731 k | 146 / 522 k | 98 / 272 k | shader an toàn mediump + chặn NaN/inf (không đổi số call; cổng dao động ±8 do người đi lại) |
| final (sau bước 08) | 167 / 718 k | 144 / 523 k | 102 / 274 k | |

Hướng camera xấu nhất (quay 8 hướng mỗi điểm): gốc **226** call → cuối **204** (≤ 233 ở mọi hướng).

## Kiểm tra NaN (`node tools/nan-test.mjs`, máy tính, bloom bật)
Chèn 1 vật xuất NaN trước camera: **trước** sửa 100 % điểm ảnh đen (bloom lan NaN cả màn hình) · **sau** 1,7 % (chỉ đúng chỗ vật lỗi).

## Tải lần đầu (`node tools/perf-mobile.mjs --net=4g --load-only`, giả lập 4G 9 Mbps · trễ 85 ms)

| Bước | Dung lượng qua mạng | Khung 3D đầu tiên | Trường sẵn sàng (vào chơi được) |
|---|---|---|---|
| before | 6 475 KB | 9,0 s | 17,0 s |
| 04-nen-server (brotli/gzip) | 2 455 KB | 7,5 s | 13,0 s |

Mạng yếu (`--net=3g`, 1,6 Mbps · 150 ms):

| Bước | Dung lượng tới lúc vào chơi | Khung 3D đầu tiên | Trường sẵn sàng |
|---|---|---|---|
| 04-nen-server | 2 520 KB | 12,7 s | 41,5 s |
| 05-tai-luoi-thu (thú nạp sau khi trường sẵn sàng) | 1 791 KB | 10,4 s | 37,7 s |
| 06-rig-nhe (hero-rogue-rig.glb 911 → 119 KB qua mạng) | 1 019 KB | 11,6 s | 36,7 s |
| ~~07-truong-2d-tai-luoi~~ | đã hoàn lại: chỉ sửa đảo 3D, không sửa game 2D (client/school/) | | |

| 08-sw-hoan (service worker đăng ký sau khi trường sẵn sàng) | 2 222 KB, SW 0 KB (trước: SW tải ngầm 2 167 KB / 126 file) · iframe 4 788 KB | 11,2 s | **39,7 s** |

4G cuối: khung 3D đầu tiên 7,3 s · trường sẵn sàng **13,4 s** (gốc 17,0 s). Phần chậm còn lại: iframe trường 2D tải ~4,8 MB (sách, piano) — ngoài phạm vi đảo 3D.

> Ghi chú đo: giả lập mạng của Chromium không áp cho service worker, và file SW phục vụ từ bộ nhớ đệm tính 0 KB →
> cột dung lượng các bước 01–07 thiếu phần SW tải ngầm (~2,1 MB) và thời gian các bước đó còn lạc quan; từ bước 08 SW
> không tải gì trước lúc vào chơi nên số đo phản ánh đúng băng thông thật.

## Phương tiện (`node tools/perf-vehicles.mjs`, điện thoại 390×844 · DPR 2 · mức 1 · 13h · 233 khung/kịch bản)

Lái tự động: cất cánh · bay thấp 21 m qua thị trấn · bay cao 83 m · xe đạp qua thị trấn · thuyền ra biển · khinh khí cầu (lên 43–55 m) · lặn.
GPU giả lập chạy ~2 khung/s nên đo theo số khung (dt bị kẹp 1/20 s); JS ms là của máy đo (điện thoại chậm hơn ~5 lần).
"Shader lúc vẽ" = số lần `linkProgram` xảy ra bên trong `post.render` (mỗi lần khựng 50–200 ms trên điện thoại).

| Kịch bản | Gốc: call / tam giác / shader lúc vẽ / khung giật | Cuối: call / tam giác / shader lúc vẽ / khung giật |
|---|---|---|
| Cất cánh | 94 / 192k / 5 / 0 | 95 / 191k / **0** / 0 |
| Bay thấp | 159 / 511k / 5 / 0 | **149 / 487k / 0** / 0 |
| Bay cao | 138 / 465k / 5 / 0 | **131 / 418k / 0** / 0 |
| Xe đạp | 185 / 624k / 9 / 1 | 181 / 620k / **0** / 1 (tải geometry lần đầu) |
| Thuyền | 180 / 526k / 2 / 0 | 176 / 526k / **0** / 0 |
| Khinh khí cầu¹ | 188 / 663k / 2 / 0 | 182 / 647k / **0** / 0 |
| Lặn | 52 / 70k / 9 / 1 | 52 / 69k / **0** / 1 (tải geometry lần đầu) |

¹ số gốc khinh khí cầu đo sau bước 02 (lượt gốc đầu chưa cất lên được).

| Bước | Thay đổi | Trước → sau |
|---|---|---|
| 01 | `compileAsync` chạy với render target hậu kỳ (khoá shader gồm không gian màu + tone mapping của đích vẽ: trước biên dịch cho canvas → vô ích) + lặp ở 8 s, 21 s | shader lúc vẽ 2–9 → 0–1 mỗi kịch bản |
| — | trải đều việc chia lại cây gần/xa nhiều khung | **bỏ**: chỉ tốn ≤ 0,9 ms/khung, không phải nguyên nhân giật |
| 02 | > 21 m: ẩn cỏ, hoa, bụi, nấm, sỏi; vật nhỏ ẩn sớm hơn 1/φ | bay cao 140 → 132 call, 466k → 446k; bay thấp 155 → 150 |
| 03 | điện thoại > 21 m: sương kéo gần dần còn 1/√φ (mặt cắt xa giữ 296 m: cắt gần hơn thủng vòm trời) | bay cao 132 → 130, 446k → 419k; bay thấp 504k → 489k; khinh khí cầu 188 → 182 |
| 04 | perf.js quét cảnh 377 nút/khung thay vì cả cảnh 1 khung mỗi 2 s | perf max/khung bay thấp 5,1 → 0,6 ms |
| 05 | phương tiện không cấp phát mỗi khung (offer, quỹ đạo AI, hàm lên xe/bờ, vệt nước, xương chân xe đạp tìm 1 lần) | trong nhiễu đo: tổng cấp phát ~250 KB/khung chủ yếu từ thị trấn (`school` 40–90 KB) + render |
| 06 | âm thanh động cơ: bộ đệm lặp 1/3 s thay 1 s | aircraft max/khung khi âm thanh bật 13,3 → 5,4 ms |

Còn lại (ngoài phạm vi phương tiện): thị trấn 3D cấp phát 40–90 KB/khung (GC); tải geometry lần đầu khi tới khu mới; skyshow thỉnh thoảng 7–17 ms/khung.
