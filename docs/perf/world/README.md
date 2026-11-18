# Đo thế giới 3D (cây, cỏ, hoa, đá, địa hình, nước, bóng đổ, sương) — chế độ điện thoại

`node tools/perf-world.mjs --out=docs/perf/world/<bước> --json=docs/perf/world/<bước>.json` (390×844, DPR 2, UA iPhone → `CFG.isMobile`,
chất lượng khoá mức 1, 13h, trung bình 55 khung). **sh** = draw call của pass bóng đổ · **js** = ms JS/khung ngoài lúc vẽ ·
**gpu** = ms vẽ + chờ GPU (SwiftShader chạy bằng CPU → chỉ so tương đối, dao động ±15 %; người/thú đi lại làm số call dao động ±10).

Số: call (sh) · nghìn tam giác · js ms · gpu ms

| Bước | Cổng trường | Quảng trường | Thị trấn | Rừng/đồi | Bờ biển |
|---|---|---|---|---|---|
| before | 179 (40) · 749 · 7,7 · 1061 | 141 (37) · 522 · 1,9 · 820 | 146 (35) · 432 · 1,8 · 668 | 161 (56) · 338 · 1,6 · 549 | 85 (22) · 206 · 1,8 · 500 |
| 01-lod-hoa | 174 (38) · 723 · 5,7 · 1213 | 144 (37) · 520 · 2,2 · 873 | 146 (35) · 428 · 1,6 · 715 | 145 (42) · 291 · 1,9 · 631 | 100 (34) · 192 · 1,6 · 493 |
| 02-bong-thua | 152 (19) · 652 · 6,4 · 1180 | 125 (18) · 454 · 1,5 · 590 | 127 (14) · 362 · 1,1 · 418 | 126 (21) · 269 · 1,2 · 375 | 71 (10) · 171 · 1,0 · 314 |

Nguyên nhân giật tìm được (trong phạm vi):
1. Chia gần/xa cho 14 loại cây/đá/hoa chạy cùng 1 khung, mỗi loại duyệt hàng nghìn vật (Math.hypot, forEach, mảng mới) → khựng mỗi 3 m đi bộ.
2. Hoa: cụm 6 bông × 76 tam giác hiện tới 45 m → 44 k tam giác trong 1 call ở rừng.
3. Bóng đổ vẽ lại mỗi khung (rừng 56 call pass bóng).
4. Cây xa (40–316 m) vẽ đủ model 50–230 tam giác dù chìm trong sương.
