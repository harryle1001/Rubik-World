# Báo cáo giật lag — Đảo Rubik 3D (chế độ điện thoại)

Đo ngày 18/11/2026 bằng `node tools/perf-tour.mjs` (Playwright, 390×844, DPR 2, UA iPhone → `CFG.isMobile`,
chất lượng **mức 1** = mức điện thoại khởi đầu, khoá; 13h trừ khi ghi khác). Mỗi điểm: chờ ổn định rồi lấy trung bình 55 khung.

> **Lưu ý đọc số:** máy đo không có GPU, vẽ bằng phần mềm (SwiftShader) → 98,7 % thời gian khung là "vẽ" (profile CPU),
> ms/khung tuyệt đối chậm hơn điện thoại thật hàng trăm lần. Chỉ dùng **so sánh giữa các điểm**. ms/khung ở đây tỉ lệ
> gần đúng với tam giác + draw call (tải GPU). Thời gian JS/khung là số thật (CPU máy đo, điện thoại chậm hơn ~3–5 lần).

## 1. Bảng đo 10 điểm

| Điểm | ms/khung (tương đối) | Draw call (pass bóng) | Tam giác | Đèn (đổ bóng) | JS ms/khung | Shader mới khi tới | Nguyên nhân chính |
|---|---|---|---|---|---|---|---|
| Cổng trường | 998 | 173 (38) | 723 k | 2 (1) | 3,33 | **100** | khối gộp lớn vẽ 3 lần (thân + viền + bóng); biên dịch shader lần đầu |
| Quảng trường | 733 | 144 (37) | 521 k | 2 (1) | 1,72 | 2 | như cổng, ít khối hơn |
| Khu trường (sân trong) | 832 | **208 (65)** | 654 k | 2 (1) | 2,51 | 8 | nhiều vật đổ bóng nhất; `school.update` 1,6 ms, đỉnh **77 ms** |
| Thị trấn Đà Lạt | 602 | 130 (43) | 361 k | 2 (1) | 2,36 | 0 | `school.update` 1,4 ms (NPC) |
| Sân bay | 541 | 105 (21) | 274 k | 2 (1) | 1,20 | 2 | nhẹ |
| Bờ biển | 730 | 130 (10) | 472 k | 2 (1) | 1,25 | 1 | nhìn ra biển xa: nước + địa hình |
| Lặn biển | 426 | 56 (7) | 107 k | 2 (1) | 1,62 | 5 | nhẹ nhất; shader dưới nước biên dịch lần đầu |
| Đêm mưa (cổng trường) | 1350* | 177 (41) | 723 k | 2 (1) | 2,39 | 8 | *đo tách: đêm/mưa chỉ ±10 % — số cao do chậm dần theo thời gian (mục 3) |
| Khinh khí cầu (trên cổng, cao 8 m) | 1193 | 180 (38) | 727 k | 2 (1) | 1,88 | 2 | nhìn từ trên thấy cả khu trường |
| Bay máy bay | 516 | 109 (22) | 188 k | 2 (1) | 2,48 | 1 | nhẹ; `physics` 0,87 ms khi bay |

Đèn: cả đảo chỉ có 2 đèn thật (mặt trời/trăng đổ bóng + đèn trời) — đèn không phải vấn đề.

## 2. TOP 5 chỗ giật nhất + cách sửa

| # | Chỗ giật | Bằng chứng | Cách sửa (chỉ phần 3D) | Cải thiện dự kiến |
|---|---|---|---|---|
| 1 | **Khựng khi tới khu mới / lần đầu thấy vật** (biên dịch shader) | Vào game: 100 shader biên dịch ở cổng. Đi vòng 3 phút: 93 → **200** chương trình shader. Mỗi shader trên điện thoại tốn ~20–100 ms → khựng 0,2–2 s mỗi khi tới khu/đổi đêm/lặn | Gộp biến thể vật liệu (cùng toon nhưng khác `receiveShadow`, `fog`, `side`, màu đỉnh…) → mục tiêu ≤ 89 chương trình; gọi `compileAsync` lại (gộp, 1 lần/vài giây) mỗi khi khu/model nạp xong, gồm cả biến thể đêm/mưa/dưới nước | Hết phần lớn các cú khựng 0,2–2 s khi đi khám phá |
| 2 | **Cổng trường + khu trường + khinh khí cầu trên trường** (nặng GPU nhất) | 654–727 k tam giác, 173–208 call, 38–65 call bóng; gấp 2–2,7 lần sân bay. Khối gộp cả khu (`town-school` 36 k, `gate-body` 31 k tam giác) vẽ 3 lần: thân + viền (inverted hull) + bóng | Chia khối gộp lớn theo ô 55 m để camera/bóng cắt bỏ phần ngoài khung; viền chỉ cho phần ≤ 34 m; chi tiết phẳng không đổ bóng | Tam giác −30 % (~720 k → ~500 k), thời gian vẽ khu trường −20–25 % |
| 3 | **Chậm dần theo thời gian chơi** | Cùng 1 cảnh: 861 → 943 ms sau vài phút; sau 3 phút đi: vật thể 3 245 → 3 539, geometry 160 → 264, texture 22 → 76, danh sách `perf.js` 211 → **658** | Gỡ/ẩn hẳn khu ở xa (hiện chỉ nạp thêm, không bao giờ gỡ); `perf.js` xét khoảng cách xoay vòng 1/8 danh sách mỗi khung | Giữ FPS ổn định khi chơi lâu (không tụt 10 %+) |
| 4 | **Khựng 77 ms ở khu trường/thị trấn** | `school.update` trung bình 1,4–1,6 ms, 1 khung đỉnh 77 ms (đồng bộ dữ liệu trường) | Chia việc nặng của `school-town.js`/`town-people.js` ra nhiều khung; chỉ cập nhật NPC trong tầm nhìn | Bỏ cú giật 77 ms; JS khu trường −1 ms/khung |
| 5 | **Giật định kỳ ~2 s** (perf.js) | `perf.update` 1,8 ms/khung ở cổng; quét toàn cảnh 3 245 vật mỗi 2 s (lần đầu 34 ms) | Đăng ký vật khi tạo thay vì quét cả cảnh; quét thưa (8 s) + xoay vòng | JS −1,5 ms/khung ở cổng, bỏ nhịp giật 2 s |

Theo dõi thêm (chưa đo được trên máy không GPU): bộ tự chỉnh chất lượng xét mỗi 2 s và tăng lại sau 6 s tốt; mỗi lần
đổi mức 1↔2 cấp phát lại shadow map, MSAA và bố trí lại cỏ/cây → máy tầm trung có thể dao động và khựng liên tục.
Đề xuất: chỉ tăng lại sau 21 s ổn định, không đổi MSAA khi chuyển 1↔2.

Không phải nguyên nhân: đêm và mưa (đo tách ±10 %), số đèn (2), lặn/bay/sân bay (nhẹ nhất).

## 3. Thứ tự đề xuất sửa
1 (shader) → 5 (perf.js, nhanh, ít rủi ro) → 4 (school.update) → 2 (chia khối gộp) → 3 (gỡ khu xa). Mỗi bước 1 commit, đo lại bằng `tools/perf-tour.mjs`.

## 4. Sau khi sửa (cùng kịch bản `tools/perf-tour.mjs`)

| Điểm | ms/khung (tương đối) | Draw call (bóng) | Tam giác | JS ms/khung | Shader mới khi tới |
|---|---|---|---|---|---|
| Cổng trường | 998 → **819** | 173 (38) → 168 (35) | 723 k → **666 k** | 3,33 → **1,50** | 100 → **50** |
| Quảng trường | 733 → 563 | 144 (37) → 140 (33) | 521 k → 467 k | 1,72 → 1,24 | 2 → 1 |
| Khu trường | 832 → 691 | 208 (65) → 198 (57) | 654 k → 584 k | 2,51 → 1,67 | 8 → 1 |
| Thị trấn Đà Lạt | 602 → 440 | 130 (43) → 100 (20) | 361 k → 285 k | 2,36 → 0,75 | 0 → 0 |
| Sân bay | 541 → 425 | 105 (21) → 97 (19) | 274 k → 267 k | 1,20 → 0,91 | 2 → 0 |
| Bờ biển | 730 → 590 | 130 (10) → 138 (16) | 472 k → 473 k | 1,25 → 0,85 | 1 → 0 |
| Lặn biển | 426 → 333 | 56 (7) → 51 (6) | 107 k → 82 k | 1,62 → 1,16 | 5 → 0 |
| Đêm mưa (cổng) | 1350 → 911 | 177 (41) → 169 (37) | 723 k → 660 k | 2,39 → 1,12 | 8 → 0 |
| Khinh khí cầu | 1193 → 935 | 180 (38) → 180 (35) | 727 k → 674 k | 1,88 → 1,47 | 2 → 1 |
| Bay máy bay | 516 → 451 | 109 (22) → 102 (20) | 188 k → 175 k | 2,48 → 1,24 | 1 → 0 |

Kết quả từng mục: (1) shader biên dịch đúng biến thể trước → đi vòng 5 khu 205 → 145 chương trình, gần như hết biên dịch khi tới
khu mới · (5) đỉnh JS perf.js 36 → ~5 ms · (4) dựng nhân vật dồn 1 lúc 30 → 10–13 ms, nhãn cửa không tạo texture mới ·
(2) chỉ đạt −8–20 % tam giác (bóng đổ chia ô); chia cả thân/viền làm tăng draw call nên bỏ · (3) không phải rò vật thể; rò thật là
texture xương của người bị đổi khỏi pool (+22–34 texture/vòng → 0).
ms/khung giảm cả ở chỗ ít đổi (sân bay −21 %) → một phần do dao động máy đo; tin cậy hơn là tam giác, draw call, JS, shader.
Chưa làm: bộ tự chỉnh chất lượng (mức 1↔2) — chưa đo được trên máy không GPU.
