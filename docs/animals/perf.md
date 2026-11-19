# Hiệu năng trước / sau khi thêm hệ động vật (tự sinh)

Đo bằng `tools/wild-test.mjs` (Chromium + SwiftShader, mức chất lượng 1, trung bình ≥ 12 khung sau khi đứng yên ở mỗi sinh cảnh). "Trước" = cùng vị trí với `?nowild`.

## Máy tính 1280×720 (CAP 34 con)

| Sinh cảnh | Draw call trước | Draw call sau | Δ | Tam giác sau | JS wild (ms/khung) | Thú có xương | Đàn instanced |
|---|---|---|---|---|---|---|---|
| farm | — | **293** |  | 955555 | 0.2 | 2 | 4 |
| forest | — | **233** |  | 837371 | 0.2 | 0 | 6 |
| hills | — | **223** |  | 808524 | 0.2 | 12 | 6 |
| wet | — | **278** |  | 850239 | 0.9 | 34 | 7 |
| meadow | — | **224** |  | 673275 | 0.2 | 1 | 5 |
| town | — | **243** |  | 728431 | 0.667 | 32 | 7 |
| safari | — | **192** |  | 641791 | 2.25 | 0 | 1 |
| safari-hole | — | **210** |  | 660057 | 0.5 | 11 | 1 |
| beach | — | **180** |  | 674606 | 0.3 | 0 | 0 |
| sea | — | **206** |  | 658798 | 0.25 | 0 | 1 |
| sea-deep | — | **163** |  | 544331 | 0.533 | 5 | 0 |
| polarS | — | **136** |  | 404528 | 0.633 | 1 | 0 |
| polarN | — | **150** |  | 473188 | 0.275 | 18 | 1 |
| forest-night | — | **264** |  | 851937 | 0.4 | 12 | 6 |
| farm-night | — | **301** |  | 973548 | 1.2 | 34 | 1 |
| wet-rain | — | **248** |  | 852412 | 0.6 | 34 | 1 |

Draw call lớn nhất: **301**.
