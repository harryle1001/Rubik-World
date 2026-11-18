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

## Render: hậu kỳ, MSAA, mưa/trời, chất lượng tự động (`node tools/perf-passes.mjs [--quick]`)
Điện thoại 390×844 DPR 2, cổng trường, ngày 13h nắng · đêm 22h mưa, chất lượng khoá. ms/khung chạy tự do trên GPU giả lập
(SwiftShader ≈ 50–100× chậm hơn máy thật) → chỉ so sánh tương đối; nhiễu ±3 %.
Chi phí gốc (bớt từng phần, mức 1): MSAA 2× **331 ms (~48 %)** · pass chỉnh màu ~100 · bóng đổ ~74 · trời/mây/mưa/sương < nhiễu.

| Bước | Mức 1 ngày | Mức 1 đêm mưa | Mức 2 (⚡ cũ) ngày | Mức 2 đêm mưa | Ảnh |
|---|---|---|---|---|---|
| gốc | 691 | 689 | 304 | 309 | |
| 01 gộp hậu kỳ 1 pass (chỉnh màu + ACES + sRGB) | 591 | 591 | 294 | 304 | `render/01-gop-pass/so-sanh.jpg` |
| 02 mưa đúng số hạt theo mức + trời bỏ sao ban ngày | 612 | 606 | 305 | 307 | `render/02-mua-troi/so-sanh.jpg` (trong nhiễu) |
| 04 điện thoại mức 1 không MSAA (khi GPU không có MSAA rẻ) | **387** | **413** | | | `render/04-msaa-dien-thoai/so-sanh.jpg` |

Mức 1 điện thoại: **691 → 387 ms/khung (−44 %)**, ảnh gần như không đổi màu; mất MSAA → răng cưa nhẹ ở mép mảnh.

03 Chất lượng tự động (`client/js/island/autoq.js`, mô phỏng `node tools/quality-sim.mjs` → `render/03-chat-luong-tu-dong/mo-phong.txt`):
độ phân giải động φ^(−k/8) (1 → 1/φ), đo trung vị mỗi 0,5 s, vùng trễ 50–57 FPS, chờ tăng ×2 khi vừa tăng đã hụt.

| Điện thoại tầm trung giả lập, 3 phút | % khung ≥ 50 FPS cũ → mới | Đổi mức (khựng) cũ → mới |
|---|---|---|
| Tự động, máy chuẩn | 73 → 89 % | 18 → 0 |
| Tự động, máy nặng 1,3× | 77 → 86 % | 19 → 0 |
| ⚡ Mượt, máy nặng 1,7× | 53 → 92 % | 0 → 0 |
| ⚡ Mượt, máy nặng 2,2× | 5 → 85 % (39 → 55 FPS TB) | 0 → 0 |
