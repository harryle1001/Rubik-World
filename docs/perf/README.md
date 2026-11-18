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

## Phương tiện (`node tools/perf-vehicles.mjs`, điện thoại 390×844 · DPR 2 · mức 1 · 13h · 233 khung/kịch bản)

Lái tự động: cất cánh · bay thấp 21 m qua thị trấn · bay cao 83 m · xe đạp qua thị trấn · thuyền ra biển · khinh khí cầu (lên 43–55 m) · lặn.
GPU giả lập chạy ~2 khung/s nên đo theo số khung (dt bị kẹp 1/20 s); JS ms là của máy đo (điện thoại chậm hơn ~5 lần).
"Shader lúc vẽ" = số lần `linkProgram` xảy ra bên trong `post.render` (mỗi lần khựng 50–200 ms trên điện thoại).

| Kịch bản | Gốc: call / tam giác / shader lúc vẽ / khung giật | Cuối: call / tam giác / shader lúc vẽ / khung giật |
|---|---|---|
| Cất cánh | 94 / 192k / 5 / 0 | 95 / 191k / **0** / 0 |
| Bay thấp | 159 / 511k / 5 / 0 | **149 / 487k / 0** / 0 |
| Bay cao | 138 / 465k / 5 / 0 | **131 / 418k / 0** / 0 |
| Xe đạp | 185 / 624k / 9 / 1 | 175 / 612k / **0 / 0** |
| Thuyền | 180 / 526k / 2 / 0 | 176 / 526k / **0** / 0 |
| Khinh khí cầu¹ | 188 / 663k / 2 / 0 | 182 / 647k / **0** / 0 |
| Lặn | 52 / 70k / 9 / 1 | 52 / 70k / **0** / 1 (lúc xuống nước tạo 13 geometry + 1 texture) |

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
| 07 | bước biên dịch trước tải sẵn mọi texture lên GPU (`initTexture`) | xe đạp qua thị trấn: khung giật 1 → 0 (trước: +9 geo +1 tex, render 194 ms) |

Còn lại: lặn — dive.js tạo geometry/texture lúc xuống nước lần đầu (1 khung ~130 ms giả lập); ngoài phạm vi phương tiện: thị trấn 3D cấp phát 40–90 KB/khung (GC); tải geometry lần đầu khi tới khu mới; skyshow thỉnh thoảng 7–17 ms/khung.

## CPU / JS (`node tools/perf-cpu.mjs`, CPU chậm 4×, 30 s đi bộ + 30 s chạy quanh quảng trường, mức 1, 13h)
GPU giả lập nên đo phần JS trên luồng chính (đảo 3D + three, self time từ profile CDP). Số trong `docs/perf/cpu/*.json`.

| Chỉ số (ms/khung, CPU 4×) | gốc (daed9fa) | cuối |
|---|---|---|
| JS đảo 3D + three | 31,0 | **26,4** |
| tính ma trận (updateMatrixWorld…) | 7,15 | 4,97 |
| vẽ phía CPU (post.render) | 29,2 | 24,3 |
| người thị trấn (school) | 3,15 | 2,13 |
| khung JS > 50 ms / 60 s | 25 | 13 |
| getProgram (đổi shader do vật liệu dùng chung) | 209 ms/60 s | 117 ms/60 s |
| rò texture khi qua cửa trường | 1 / cửa | 0 |

Còn lại ngoài phạm vi đảo 3D: iframe trường 2D (`client/school/`, chess.js) cấp phát ~46 MB / 60 s trên cùng heap
→ phần lớn số lần GC của trang (minor 6–42, major 6–10 tuỳ số ván cờ NPC đang chơi) và ~2 s CPU / 60 s.
