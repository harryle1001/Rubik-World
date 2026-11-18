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

## Nhân vật (`node tools/perf-actors.mjs --out=thu-muc [--only=...] [--prof=điểm]`, điện thoại mức 1)

Người chơi, học sinh/thầy cô/NPC, thú, người chơi khác, sân chơi dân gian. Đếm: draw call cả khung, SkinnedMesh vẽ ở lượt chính
và lượt bóng, số `AnimationMixer.update`/khung và ms, ms JS/khung của các phần nhân vật. 2 cảnh **cố định** để so chính xác
(cảnh thật dao động ±10 call do người đi lại): 21 người đứng yên trước camera 3 → 34 m (mô phỏng trường tạm dừng) · 14 thú trước camera 3 → 30 m.
Số "trước" của cảnh cố định đo trên code gốc (f970041) bằng cùng công cụ (`before-co-dinh/`).

| Cảnh | Draw call | Skinned vẽ / bóng | Mixer ms/khung | JS nhân vật ms/khung |
|---|---|---|---|---|
| Đám đông cố định (8 người vẽ đầy đủ) | 200 → **188** | 25,7 / 11,6 → **14,7 / 10,9** | 0,54 → **0,25** | 1,49 → 1,42 |
| Thú cố định (14 con) | 332 → **173** | 117 / 74 → **23 / 9** | 0,26 → 0,23 | 0,96 → 0,89 |
| Quảng trường (thật) | 235 → 223 | 30,4 → 21,4 | 0,75 → 0,36 | 1,78 → 1,39 |
| Sân trường giờ ra chơi (thật) | 247 → 241 | 33,4 → 21,3 | 0,62 → 0,28 | 1,62 → 1,19 |
| Rừng có thú (thật, thú ở ngẫu nhiên) | 173 → 156 | 4 → 7,1 | 0,25 → 0,18 | 0,96 → 0,85 |
| Biển rạn san hô (cá/chim đã instancing sẵn) | 117 → 114 | 7 → 3 | 0,06 → 0,04 | 0,73 → 0,67 |

Các bước (mỗi bước 1 commit, ảnh trong `docs/perf/actors/<bước>`):
1. `01-gop-chi-tiet` — người: thân + mắt/miệng/khuy gộp 1 SkinnedMesh (viền vẫn theo hình thân): 2 → 1 lần vẽ/người.
2. `02-lod-nhan-vat` — LOD chung (characters.js `actorLod`, `stepAnim`): viền < 13 m, bóng < 21 m, animation mỗi khung < 13 m,
   1/2 khung < 21 m, 1/4 xa hơn; tối đa 13 người vẽ đầy đủ (còn lại hình khối 1 draw call chung); chọn người gần 0,25 s/lần.
   Áp cho người thị trấn, thú, người chơi khác (net.js), sân chơi dân gian.
3. `03-cat-track` — clip người 123 → 24 track (bỏ track hằng + xương không biến dạng), dáng giống hệt; màu hình khối LOD tính 1 lần.
4. `04-gop-thu` — thú Quaternius: 4–7 SkinnedMesh/con (mỗi vật liệu 1 lưới) gộp 1 lưới màu đỉnh (models.js `mergeSkinned`).

CPU profile (`--prof`) cho thấy JS nhân vật chỉ ~1 ms/khung trên máy đo; phần lớn khung là GPU (draw call + đỉnh skinning),
nên lợi chính là bớt lần vẽ SkinnedMesh (mỗi lần vẽ skinned trên điện thoại tốn hơn mesh thường). Draw call còn lại chủ yếu là cảnh vật.
