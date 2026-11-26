# Tối ưu VẼ (GPU) + TẢI — đảo 3D trên điện thoại

Đo: `node tools/perf-gpu.mjs --json=… --out=…` (390×844, DPR 2, UA iPhone → `CFG.isMobile`, chất lượng mặc định điện thoại = mức 1 khoá, 13h,
CPU chậm 4×; 22 điểm × 4 hướng camera; draw call + tam giác gồm cả pass bóng; bộ nhớ GPU đếm byte thật qua hook WebGL (texture + buffer + renderbuffer)).
`--load`: giả lập 4G (9 Mbps, trễ 85 ms, tắt cache). GPU giả lập SwiftShader → ms/khung chỉ để so tương đối.
Mục tiêu: ≤ 150 call (Mượt ≤ 100), ≤ 300k tam giác, tải đầu ≤ 5 s 4G, ≤ 8 MB.

## TRƯỚC (gốc 3998c6b)

| Điểm | call max / tb | call bóng | k tam giác max / tb | texture | GPU MB (tex) | ms/khung tb / p95 |
|---|---|---|---|---|---|---|
| Điểm xuất phát | 207 / 194 | 22 | 655 / 545 | 223 | 206.8 (154.8) | 219 / 286 |
| Cổng trường | 218 / 199 | 26 | 633 / 573 | 255 | 223.2 (168.8) | 218 / 290 |
| Quảng trường | 202 / 190 | 21 | 644 / 536 | 255 | 223.7 (168.8) | 204 / 270 |
| Trong trường | 233 / 220 | 28 | 605 / 526 | 269 | 226 (169) | 225 / 267 |
| Thị trấn | 224 / 198 | 25 | 522 / 403 | 296 | 233.3 (169.6) | 168 / 239 |
| Sân bay | 178 / 154 | 17 | 497 / 304 | 298 | 236.7 (169.4) | 152 / 189 |
| Bờ biển | 170 / 134 | 12 | 365 / 261 | 312 | 244.2 (175.1) | 154 / 226 |
| Làng chài | 180 / 155 | 15 | 341 / 266 | 318 | 242.7 (173.2) | 170 / 225 |
| Hải đăng | 121 / 111 | 13 | 188 / 157 | 322 | 246.6 (175.2) | 140 / 174 |
| Học viện – sân | 252 / 218 | 26 | 619 / 438 | 437 | 368.5 (270.5) | 297 / 368 |
| Học viện – đại sảnh | 211 / 192 | 0 | 487 / 339 | 442 | 372 (270.5) | 236 / 272 |
| Học viện – nội thất | 181 / 174 | 12 | 222 / 196 | 473 | 428.9 (323.2) | 243 / 291 |
| Phố Phép Thuật | 213 / 192 | 0 | 489 / 338 | 478 | 429.2 (323.2) | 247 / 300 |
| Rừng phép thuật | 184 / 149 | 15 | 270 / 192 | 481 | 430.3 (323.5) | 171 / 214 |
| Rừng Thiền | 231 / 218 | 29 | 565 / 393 | 468 | 375.1 (299) | 209 / 290 |
| Rừng Thiên Định | 232 / 169 | 17 | 582 / 334 | 475 | 376.6 (299.5) | 194 / 223 |
| Vùng mới: TP Tương lai | 101 / 92 | 11 | 145 / 132 | 479 | 379.3 (301.6) | 112 / 140 |
| Vùng mới: Làng Cổ | 99 / 92 | 10 | 187 / 155 | 481 | 379.7 (301.7) | 122 / 146 |
| Bay máy bay | 185 / 175 | 16 | 286 / 276 | 491 | 379.7 (302) | 145 / 208 |
| Bay chổi | 139 / 137 | 14 | 237 / 230 | 493 | 380.4 (301.5) | 135 / 171 |
| Ván bay | 217 / 203 | 24 | 480 / 466 | 252 | 208.1 (157.1) | 211 / 314 |
| Trên phà Học viện | 248 / 224 | 22 | 606 / 558 | 371 | 334.8 (256.2) | 214 / 420 |

Tải 4G (tắt cache): khung 3D đầu 12.4 s · vào chơi được 13.3 s · 250 file · 2751 KB qua mạng (JS 1861 KB, glb 890 KB).


## SAU (nhánh claude/opt-gpu) — trước → sau

Ảnh cùng góc: `docs/perf/gpu/so-sanh.jpg` (hàng T = trước, S = sau), từng ảnh trong `gpu/truoc/` và `gpu/sau/`.

| Điểm | call tb (max) | k tam giác tb (max) | GPU MB (texture MB) | ms/khung tb |
|---|---|---|---|---|
| Điểm xuất phát | 194 (207) → **191 (205)** | 545 (655) → **445 (537)** | 206.8 (154.8) → **112.2 (62.2)** | 219 → 216 |
| Cổng trường | 199 (218) → **199 (206)** | 573 (633) → **469 (522)** | 223.2 (168.8) → **115.1 (62.2)** | 218 → 203 |
| Quảng trường | 190 (202) → **185 (198)** | 536 (644) → **427 (523)** | 223.7 (168.8) → **115.5 (62.2)** | 204 → 193 |
| Trong trường | 220 (233) → **220 (236)** | 526 (605) → **441 (519)** | 226 (169) → **117.5 (62.4)** | 225 → 214 |
| Thị trấn | 198 (224) → **183 (223)** | 403 (522) → **315 (419)** | 233.3 (169.6) → **125.3 (63)** | 168 → 152 |
| Sân bay | 154 (178) → **139 (162)** | 304 (497) → **193 (344)** | 236.7 (169.4) → **128.7 (62.8)** | 152 → 141 |
| Bờ biển | 134 (170) → **113 (150)** | 261 (365) → **168 (271)** | 244.2 (175.1) → **134.7 (67)** | 154 → 127 |
| Làng chài | 155 (180) → **137 (163)** | 266 (341) → **176 (239)** | 242.7 (173.2) → **133.7 (65.1)** | 170 → 144 |
| Hải đăng | 111 (121) → **84 (95)** | 157 (188) → **96 (119)** | 246.6 (175.2) → **137.7 (67.1)** | 140 → 107 |
| Học viện – sân | 218 (252) → **170 (200)** | 438 (619) → **347 (537)** | 368.5 (270.5) → **200.8 (106.7)** | 297 → 255 |
| Học viện – đại sảnh | 192 (211) → **160 (177)** | 339 (487) → **284 (434)** | 372 (270.5) → **189.3 (89.3)** | 236 → 208 |
| Học viện – nội thất | 174 (181) → **115 (122)** | 196 (222) → **134 (160)** | 428.9 (323.2) → **204.7 (100.6)** | 243 → 208 |
| Phố Phép Thuật | 192 (213) → **157 (173)** | 338 (489) → **282 (437)** | 429.2 (323.2) → **205.2 (100.6)** | 247 → 200 |
| Rừng phép thuật | 149 (184) → **111 (140)** | 192 (270) → **125 (168)** | 430.3 (323.5) → **206.6 (100.9)** | 171 → 134 |
| Rừng Thiền | 218 (231) → **199 (207)** | 393 (565) → **290 (437)** | 375.1 (299) → **155.3 (79.6)** | 209 → 165 |
| Rừng Thiên Định | 169 (232) → **142 (207)** | 334 (582) → **229 (444)** | 376.6 (299.5) → **156.8 (80.2)** | 194 → 163 |
| Vùng mới: TP Tương lai | 92 (101) → **73 (76)** | 132 (145) → **88 (92)** | 379.3 (301.6) → **158.1 (80.5)** | 112 → 114 |
| Vùng mới: Làng Cổ | 92 (99) → **67 (73)** | 155 (187) → **89 (101)** | 379.7 (301.7) → **158.3 (80.5)** | 122 → 112 |
| Bay máy bay | 175 (185) → **156 (163)** | 276 (286) → **174 (178)** | 379.7 (302) → **158.2 (80.8)** | 145 → 130 |
| Bay chổi | 137 (139) → **106 (116)** | 230 (237) → **130 (148)** | 380.4 (301.5) → **159.1 (80.5)** | 135 → 122 |
| Ván bay | 203 (217) → **193 (198)** | 466 (480) → **357 (358)** | 208.1 (157.1) → **159.3 (80.8)** | 211 → 183 |
| Trên phà Học viện | 224 (248) → **182 (222)** | 558 (606) → **456 (541)** | 334.8 (256.2) → **179.4 (107.2)** | 214 → 162 |
| **Trung bình 22 điểm** | 172 → **149** | 346 → **260** | 315 → **155** | |

Đạt mục tiêu (hướng xấu nhất): ≤ 150 call **7/22** điểm (trước 4/22) · ≤ 300k tam giác **9/22** (trước 7/22).

### Tải lần đầu (4G 9 Mbps · 85 ms, tắt cache; mốc theo đồng hồ trang)
| | Trước | Sau |
|---|---|---|
| Đảo dựng (module JS xong) | 5,7 s | 5,6 s |
| Trường sẵn sàng | 7,5 s | 7,4 s |
| Vào chơi được (màn che mở; dao động theo thời gian biên dịch shader) | 8,8–12,3 s | 8,7–12 s |
| Dung lượng tới lúc vào chơi | 5,5–7,9 MB (VRM 3,8–5,3 MB tranh băng thông nếu màn che mở chậm) | **5,4 MB** (VRM tải sau khi vào chơi) |

## Đã làm (mỗi bước 1 commit)
1. **Texture** (`gltf-tex.js`): gộp ảnh trùng nội dung giữa các .glb (1 atlas 1024² từng nằm trong 18 file), điện thoại ≤ 512 px (cả VRM WebP), biển chữ canvas ≥ 1 M điểm ảnh ½ (vẽ lại tự động khi file gốc cập nhật). Texture GPU 155–323 MB → 62–107 MB.
2. **perf.js + split.js**: khối gộp tĩnh bán kính ≥ 89 m chia ô 89–233 m (≤ 6 ô) để khung hình/pass bóng cắt được; ẩn InstancedMesh 0 bản sao, bộ rải khắp đảo khi bản sao gần nhất xa, hạt (Points) đang "cất" dưới đất.
3. **Mặt đất LOD** (`terrain.js`): ô xa > 21 m (điện thoại) vẽ lưới thưa 2× (¼ tam giác), mép ô quạt đủ đỉnh → không hở.
4. **VRM**: người chơi trên điện thoại dùng bộ `mobile` (½ tam giác); tải VRM chờ màn che mở.

Đã thử & bỏ (số đo không tốt hơn): ô mặt đất 34 mắt lưới (thêm ~8 call), chia khối gộp từ 34 m (thêm 10–20 call ở khu dày), `modulepreload` toàn bộ module (DOM xong 5,5–5,7 s như cũ).

## Còn lại (chưa đạt)
- Khu trường/quảng trường/Rừng Thiền/Học viện sân: 180–236 call, 420–540k tam giác hướng xấu nhất. Phần lớn là **nhiều lưới riêng gần người chơi** (nhà, cổng 62k tam giác, viền toon) + nhân vật VRM (~23 call/người) + ~30 InstancedMesh cây/đồ rải — cần gộp theo vật liệu trong từng file khu (ngoài phạm vi sửa an toàn tự động) hoặc atlas cho VRM.
- Tải 4G ~9–12 s: ~254 module JS + 136 file .glb qua HTTP/1.1 (6 kết nối) — cần đóng gói JS (bundler) / HTTP/2 ở máy chủ thật, và tách nạp model theo vùng.
- Ghi chú đo: lượt `van-bay` → `tren-tau` liên tiếp gây lỗi trang do chính công cụ đặt `player.vehicle = null` khi đang cưỡi ván (không phải lỗi game); `tren-tau` đo riêng.
