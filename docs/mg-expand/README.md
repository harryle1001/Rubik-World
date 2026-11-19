# Mini game 3D — chơi thử, sửa, mở rộng (claude/mg-expand)

Đo: `node tools/mg-test.mjs [--mobile] [--only=caro,chess] [--shots=thư/mục]` (Playwright + SwiftShader → chỉ so tương đối).
"Đi bộ" = draw call khi đi ngoài thế giới; "Riêng" = draw call của khu chơi (bật − tắt api.root); "Rò 2" = geometry/texture còn lại sau lần vào–thoát thứ 2 (có nhiễu do thế giới nạp chunk).

## 1. Sửa lỗi + tối ưu

| Lỗi / chỗ chán | Nguyên nhân | Sửa |
|---|---|---|
| Rò texture mỗi lần vào (cờ vua 7, cờ vây 5, Rubik 4, đua thú 5) | mỗi NPC có `Skeleton` → bone texture riêng, host không dispose | host dispose skeleton + vật liệu chi tiết của NPC |
| Lỗi console `isReady` (patin) | `warm()` gọi `compileAsync` khi cảnh đổi, thoát game dispose vật liệu giữa chừng | không warm khi đang chơi mini game |
| Cột đèn / khung thành giữa bàn caro | cột mảnh nằm trong khối gộp `town-eastC` (r = 33 m) → không ẩn được, 55 tia dò lọt | findSpot thêm lưới đỉnh 4 m của khối gộp; caro/cờ vây bán kính 8 → 10 m (bàn 14,6 m) |
| Đường đua trên cầu cạn 13 m giữa rừng | runner luôn dựng cầu cạn | host tìm hành lang đất 23 × 89 m (`rect`), đường sát đất trên nền đắp; không có chỗ mới lùi về cầu cạn |
| Xưởng Mỹ thuật: cây, hoa, vệt đường xuyên sàn | cây/cỏ terrain tự xếp lại mỗi khi đi (ghi đè việc ẩn), cây to r ≥ 5 không ẩn | terrain `nature.skip` + DetailGrid `skip` né khu chơi; ẩn cả vật to có tâm trong khu; sàn xưởng cao 6 cm |
| Cột sáng pha lê nhiệm vụ lọt khung chơi | quests.js vẽ mọi lúc | ẩn khi đang chơi |

| Game | Đi bộ | Trước (call / riêng / rò 2) | Sau (call / riêng / rò 2) |
|---|---|---|---|
| rubik | 356→359 | 366 / 29 / 5g 4t | 300 / 15 / 1g 0t |
| caro | | 156 / – / 1g 1t | 126 / 10 / 1g 0t |
| go | | 113 / 2 / 1g 5t | 119 / 1 / 0g 0t |
| chess | | 103 / 19 / 0g 7t | 121 / 9 / 0g 2t |
| art-music | | 214 / 65 / 0g 1t | 153 / 43 / 0g 0t |
| reader | | 145 / 13 / 0g 3t | 169 / 13 / 0g 0t |
| skate | | 122 / 24 / 1g 1t | 143 / 17 / 0g 0t |
| patin | | 141 / 8 / 2g 2t + lỗi console | 123 / 15 / 0g 0t |
| animal-race | | 101 / 15 / 0g 5t | 134 / 14 / 0g 0t |
| (19 game khác) | | ≤ 168 | ≤ 177, rò 0–1 texture |

Mọi game khi chơi ≤ draw call lúc đi bộ (≈ 359). JS của khu chơi (mg.update) 0,1–2,8 ms/khung. Ảnh: `fix-before-after.jpg`.
