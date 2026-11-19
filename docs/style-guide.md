# Bộ quy chuẩn khu mẫu "Cổng trường + Quảng trường"

Khu mẫu (~60 × 60 m quanh `SPAWN`/`GATE3` trong `layout.js`) là chuẩn cho mọi khu sau. Khu mới phải theo đúng file này;
muốn lệch chuẩn thì sửa file này trước (một commit riêng). Bổ sung cho `docs/art-style.md` (nguyên tắc chung) và skill `open-world-lowpoly`.

φ = 1,618 · 1/φ = 0,618 · 1/φ² = 0,382 · 1/φ³ = 0,236 · 1/φ⁴ = 0,146 · Fibonacci 1 2 3 5 8 13 21 34 55 89 144 · π.

---

## 1. Bảng màu — `client/js/island/sample/palette.js`

Không pha màu mới trong file khu. Lấy `mat('tên')` (vật liệu toon dùng chung) hoặc `PAL.tên.color` (tô màu đỉnh cho khối gộp + `matV()`).
Cần sáng/tối hơn thì dùng `shade('tên', k)`.

| Nhóm | Tên | Hex | Dùng cho |
|---|---|---|---|
| Đá kem (chủ đạo) | `stoneCream` · `stoneCreamL` · `stoneCreamD` | `#efe3c8` · `#f7efdc` · `#d9c8a6` | tường, cột, vòm · phào/gờ · chân tường, mặt dưới vòm |
| Đá xám ấm | `stoneWarm` · `stoneWarmL` · `stoneWarmD` | `#bdb2a0` · `#d6ccbb` · `#948a7b` | bậc, bệ, đế cột · gạch lát · mạch lát, viền bồn |
| Ngói đỏ đất | `roof` · `roofL` · `roofD` | `#c45a3a` · `#d77352` · `#93402a` | mái · mặt hứng nắng · bờ nóc, diềm |
| Gỗ | `wood` · `woodD` | `#a8744a` · `#6e4a30` | cánh cửa, ghế · nẹp, dầm |
| Cửa chớp | `shutter` · `shutterD` · `glass` | `#3f8a73` · `#2c6455` · `#8fb9cc` | cửa sổ chớp kiểu Đông Dương · kính |
| Cây cỏ | `grass` · `grassD` · `leaf` · `leafD` | `#7fbf5e` · `#5a9a48` · `#4f9a4a` · `#357040` | thảm cỏ · tán lá, hàng rào cây |
| Hoa | `flowerRed` · `flowerPink` · `flowerYellow` · `flowerWhite` | `#e0503e` · `#ee93a8` · `#f2c443` · `#f6f1e6` | cụm 3 · 5 · 8 bông |
| Kim loại | `iron` · `ironL` · `brass` · `lampGlow` | `#3a3344` · `#5a5266` · `#d4a24a` · `#ffe3a0` | cột đèn, hàng rào · đồng thau · bóng đèn |
| Rubik | `rubikR/G/B/Y/O/W` | `#d8433a` … `#f3efe6` | tượng Rubik, điểm nhấn |
| Khác | `plaster` · `ink` | `#f3ead6` · `#3d2b3f` | trần hiên · chữ, viền |

**Tỷ lệ diện tích trên một công trình:** đá kem 61,8 % (1/φ) · đá xám 23,6 % (1/φ³) · ngói 14,6 % (1/φ⁴).
Vàng φ (`brass`) ≤ 1/13 khung hình. Độ bão hoà ≤ 0,62; màu sáng nhất ≤ `#f7efdc` (không trắng tinh → không cháy lúc trưa).

## 2. Vật liệu

- Mọi khối: `MeshToonMaterial` 4 bậc (`CFG.toon.steps`) qua `mat()`/`toon()`. Không dùng `MeshStandardMaterial` (tốn, lệch phong cách).
- Kim loại/kính: không có phản chiếu; dùng emissive rất nhẹ (sẵn trong `mat('brass'|'glass')`).
- Phát sáng (đèn, cửa sổ đêm): `mat('lampGlow')`; không thêm `PointLight`/`SpotLight` (đèn thật duy nhất: nắng/trăng + trời).
- Texture ≤ 512 px, chỉ cho chữ/biển; lọc dị hướng tự động (`post.js`). Không dùng texture cho màu trơn.
- Viền: `addOutline()` (style.js) dày theo khoảng cách; chỉ cho vật có hình khối rõ (nhà, cột, nhân vật), không cho cỏ/hoa/đá nhỏ.

## 3. Tỷ lệ φ cho kiến trúc

| Thành phần | Quy tắc | Ví dụ khu mẫu |
|---|---|---|
| Tường | cao tầng 3,4 m ≈ 2φ + 1/φ; mặt tiền rộng : cao = φ | nhà 13 × 8 m (13/8 ≈ φ) |
| Cửa đi | cao : rộng = φ²: 1 (≈ 2,618) → 2,1 × 0,8 m (đơn) · 2,6 × 1,6 m (đôi) | |
| Cửa sổ | cao : rộng = φ; bệ cửa cao 0,9 m; khoảng cách tâm = rộng × φ² | 1,3 × 0,8 m, tâm cách 2,1 m |
| Vòm cổng | cao chân vòm : rộng lòng vòm = φ; vòm bán nguyệt (π) | |
| Cột | cao : rộng = 8 (Fibonacci) cột vuông; đế + mũ = 1/φ³ chiều cao | |
| Mái | dốc atan(1/φ) ≈ 31,7°; đua mái = 1/φ³ chiều rộng nhà | |
| Bậc thềm | cao 0,15 m · sâu 0,15 φ² ≈ 0,38 m; số bậc 3 · 5 · 8 | |
| Phào/gờ | dày 1/φ⁴ tầng; nhô 1/φ⁵ | |
| Lô đất / quảng trường | `layout.js` (PHI, FIB); vòng tròn lát đồng tâm bán kính theo Fibonacci | |

## 4. Độ bo cạnh (bevel)

- Khối kiến trúc lớn (≥ 2 m): vát 0,08 m (1/φ⁵ ≈ 0,09) — 1 đoạn, không bo tròn nhiều đoạn.
- Khối vừa (0,5–2 m: bệ, ghế, cột đèn): vát 0,03–0,05 m.
- Khối nhỏ (< 0,5 m): không vát; dựa vào viền + toon.
- Tuyệt đối không để hộp trơn 6 mặt cho phần nhìn gần (≤ 21 m): ghép ít nhất đế + thân + mũ.

## 5. Mật độ chi tiết theo khoảng cách (LOD)

| Vùng (từ camera) | Hiện gì | Kỹ thuật |
|---|---|---|
| 0–21 m | đủ chi tiết: phào, nẹp, hoa, đá lát, viền | `DetailGrid` (decor.js), không đổ bóng chi tiết nhỏ |
| 21–55 m | khối chính + mái + cửa; bỏ hoa/đá nhỏ | gộp geometry, instancing |
| 55–144 m | hình khối + màu; tắt viền vật nhỏ | 1 mesh/công trình |
| 144–296 m | bóng dáng trong sương | sương `CFG.view` (144 → 296 m) |
| > 296 m | không vẽ (camera.far) | |

## 6. Ngân sách mỗi khu (đo ở góc camera lúc vào game)

- Draw call của khu (không kể nhân vật, trời): **≤ 55** (Fibonacci); toàn khung hình khi đứng ở khu: **≤ 300** (máy tính), mục tiêu điện thoại ≤ 233.
- Tam giác mỗi khu ≤ 89 000; công trình nhỏ ≤ 1 500; cây/đá ≤ 300.
- Vật liệu khác nhau mỗi khu ≤ 21 (dùng `mat()` dùng chung → tự gộp).
- Khu mẫu đo được: **300 draw call · 542 k tam giác** cả khung hình (trước khi chỉnh: 307 · 600 k).

## 7. Ánh sáng & hậu kỳ (không chỉnh riêng từng khu)

- `sky.js` KEYS: 8h30 trong trẻo (nắng `#fff1dc` 1,35–1,5) · 13h nắng 1,5 (không cháy) · 17h40 vàng đào `#ffe0bc` · 22h lam dịu + trăng theo lịch thật.
- Đèn trời (hemi) lam pha trắng → bóng đổ mát, nắng ấm. Sương = đúng màu chân trời.
- Hậu kỳ: ACES, MSAA 4x máy tính · 2x điện thoại (độ phân giải tối đa 2 · 1,5), bloom 0,18 (ngưỡng 0,92), vignette 1/φ⁴. Không thêm pass mới cho từng khu.
- Camera (player.js): cách 8,5 m (gần nhất 5 m), ngẩng atan(1/φ³) ≈ 13,3°, nhìn cao φ² m, FOV 50° (màn dọc tới 72°).

## 8. Cách chụp kiểm tra (bắt buộc trước mỗi commit khu)

1. `node server/index.js`, mở `http://localhost:3000/` (đảo 3D) bằng Playwright (Chromium có sẵn, cờ `--use-angle=swiftshader`); nếu bảng tài khoản `#accBox` hiện thì bấm **"Chơi khách"**.
2. Khoá chất lượng cao: `__island.quality = () => {}`.
3. Khoá giờ: `Object.defineProperty(__island.sky.state, 'hour', { get: () => H, set() {}, configurable: true })` với H = 8.5 · 13 · 17.67 · 22.
4. Mỗi giờ chụp 2 góc, cùng vị trí trước/sau:
   - **Người chơi lúc vào game:** `player.teleport(x, z)`, `player.cam.yaw = …` (khu mẫu: `teleport(-65.6, 9)`, yaw −π/2), chờ 2,5 s.
   - **Chéo trên cao:** bọc `player.update` rồi đặt `camera.position` cao 26 m, lệch 30 m chéo, `lookAt` tâm khu.
5. Chụp thêm ảnh 1:1 (vùng 400 × 300 giữa màn) và một ảnh điện thoại 390 × 844 DPR 2 để chứng minh độ nét.
6. Đo draw call: `renderer.info.autoReset = false`, reset trước mỗi lần `post.render`, đọc `info.render.calls/triangles`.
7. Kiểm tra: không lỗi console; phím M; nút ☀️; máy bay `__island.aircraft.board(__island.aircraft.planes[0])` → ~20 s `phase === 'fly'`.
8. Tự chấm ≥ 9/10 theo: hình khối đọc rõ ở 21 m · màu đúng bảng · không cháy/không bệt · viền đều · draw call trong ngân sách.

Ảnh khu mẫu: `docs/shots/sample-look/` (trước/sau, 4 giờ, 1:1, điện thoại).

## 9. Ngoại lệ: Học viện Pha Lê (đảo lâu đài, `client/js/island/academy/`)

Lâu đài Gothic dùng bảng màu và vật liệu riêng. Mọi quy tắc khác của file này vẫn giữ nguyên.

| Nhóm | Hex | Dùng cho |
|---|---|---|
| Đá xám phong hoá | `#9f9a92` · tối `#7f7a73` · chân tường rêu `#6f7466` | tường, tháp, trụ chống, chân tường |
| Mái đá phiến · đồng xanh | `#3f4a56` · `#4f6f66` | mái nón tháp cao (≥ 55 m) · tháp thấp, cầu có mái |
| Cửa sổ | ngày `#2a3440` (kính tối) → đêm `#ffd98a` (ánh nến) | hàng trăm ô kính nhọn, sáng dần theo `sky.state.night` |
| Gỗ · nến | `#6e4a30` · `#a8744a` · `#f6f1e6` | bàn dài, kệ sách, nến bay |

- **Hình khối:** mái nón tháp cao = bán kính × φ³; tháp chính 89 m, tháp góc 55 m, tháp nhỏ 34 m. Dọc nóc mái có tháp nhọn nhỏ, mỗi chiếc cách nhau 34 m, để bóng dáng lởm chởm.
- **Texture (chỉ ở đây):** vân đá + rêu vẽ bằng canvas 512 px (không tải file ngoài), chiếu tam diện theo toạ độ thế giới. Chỉ phủ lên màu xám (độ bão hoà thấp), không phủ lên gỗ. Phương án A = toon thuần như cả game, B = toon + vân đá. Chọn bằng `?castle=a|b` (lưu `academy.look`).
- **Ánh sáng:** vẫn không dùng `PointLight`. Cửa sổ, nến và đèn lồng tự phát sáng bằng vật liệu emissive. Ánh trăng xanh lạnh tương phản với cửa sổ vàng ấm.
- **Phép thuật khắp nơi:** đom đóm/hạt sáng (Points, 1 draw call), sương hồ (InstancedMesh 21 tấm, 1 draw call), cờ đuôi nheo, cú bay quanh tháp. Mỗi thứ chỉ tốn 1 draw call.
- **LOD:** < 144 m vẽ đủ chi tiết (trụ chống, tháp nhọn, cờ, cửa sổ tháp) · 144–296 m chỉ còn khối chính + cửa sổ · > 296 m bóng xa (`far.js`, có đốm cửa sổ ban đêm).
- **Ngân sách:** đứng trong lâu đài ≤ 233 draw call cả khung hình (điện thoại), tam giác lâu đài ≤ 144 k.

## 10. Ngoại lệ: Hải đăng Mũi Sóng (đảo đá tây nam, `client/js/island/lighthouse/`)

Mọi quy tắc khác của file này giữ nguyên; chỉ lệch ở các điểm sau.

| Nhóm | Hex | Dùng cho |
|---|---|---|
| Đá biển xám tím | `#8d8790` · tối `#5f5a66` · sáng `#aaa4a6` · rêu `#6f7f5a` | mặt đảo đá (cùng tông với đá kit `rock_shore_*`), chân đá ướt, mảng rêu sát nước |
| Sọc tháp | `rubikR` `#d8433a` · `stoneCreamL` `#f7efdc` | 6 sọc đỏ–trắng cao 8 · 5 · 5 · 3 · 3 · 2 m (Fibonacci, tổng 26 m) |
| Kính | cửa sổ ngày `#2a3440` → đêm `#ffd98a` · thấu kính `#bfeee6` | ô cửa sổ sáng dần theo `sky.state.night`; thấu kính Fresnel phát sáng khi đèn bật |

- **Số đo:** tháp 34 m = thân 144 bậc × 0,18 m (25,92 m) + buồng đèn 5 m + chóp 3 m; chân rộng 2 × 5 m, đỉnh 2 × 5/φ m; cầu thang 34 bậc/vòng; sàn ở bậc 34 · 68 · 102; ban công rộng φ m; bến gỗ 21 m, 21 bậc đá; đảo cách bờ 233 m; đèn quay 13 s/vòng (chớp 6,5 s); thuyền 21 s.
- **Trong tháp:** vật liệu "trong nhà" = toon + cộng sáng `uLift` (0,3 ngày → 0,38 đêm), không nhận bóng đổ; vẫn không dùng `PointLight`.
- **Camera trong tháp:** vỏ tháp không chặn camera; khi người ở trong thân tháp mà camera ở ngoài lớp trát thì ẩn vỏ → nhìn "cắt lớp" (thấy cầu thang xoắn và các tầng).
- **Chùm sáng:** 2 nón cộng màu (`AdditiveBlending`, không sương) + 1 quầng sprite; ở xa > 296 m cả đèn + bóng tháp được kéo về 233 m và thu nhỏ đúng tỷ lệ (như `academy/far.js`), bị đồi che thì ẩn.
- **Bọt sóng:** 1 dải lưới bám đường mép nước + vòng quanh đá ngầm, shader riêng (1 draw call), đỉnh bám theo `terrain.waveHeight`.
- **Ngân sách đo được:** đứng trên đảo 66–106 draw call cả khung hình (điện thoại, ngân sách 233) · 99–135 (máy tính); khi ở xa chỉ còn 4 draw call (bóng tháp, 2 chùm sáng, quầng).
