# Va chạm chung — nhân vật không xuyên cây, ghế đá, cột đèn… (collide.js)

Lỗi chủ dự án báo: nhân vật đi **xuyên** cây, ghế đá và nhiều loại vật thể.

## 1. Rà soát hệ va chạm cũ

| Cơ chế cũ | Ai dùng | Ghi chú |
|---|---|---|
| `ctx.colliders` (vòng tròn x, z, r) | terrain.js (cây, đá lớn, gốc, khúc gỗ), plaza, ga tàu, đền, yard-life, easter-eggs, hải đăng, làng chài, zen, destiny… | mỗi file tự đẩy tay; bụi `colR = 0` → đi xuyên |
| `ctx.boxes` (hộp AABB + top) | nhà/tường school-town, school-interior `solid()`, zone-east, sân bay, regions t1, cổng | chỉ tường/nhà lớn |
| `ctx.grid` (physics.js) | lưới 8 m tra nhanh 2 loại trên | |

**Nguồn vật thể CHƯA đăng ký va chạm** (đi xuyên được trước khi sửa):
- Toàn bộ đồ `placeKit` (InstancedMesh KayKit/Kenney): ghế `prop_bench`, đèn `prop_lantern`/`prop_light_apron`, hàng rào `fence_simple`/`fence_picket_low`, sạp `prop_stall_*`, thùng rác `prop_bin`, bồn cây `prop_planter`, biển chỉ đường, ô bãi biển, thùng hàng/thùng phuy, lều, xe đỗ (xe đạp, máy kéo, xe tải, cứu hoả…), khúc gỗ, bồn/bụi sân trường — ở thị trấn, sân trường, bãi biển, nông trại, sân bay, cắm trại, vùng mới (regions t2), hải đăng, Học viện.
- Đồ dựng gộp bằng `Batch` (merged mesh): ghế đá + bồn phượng sân trường (zone-school.js), ghế đá/cột cờ/cột đèn trong town-buildings, đồ trang trí Phố Phép Thuật, làng chài, tàu, Rừng Thiên Định, làng phù thuỷ xây nhà (academy/build.js).
- Bụi cây terrain (`bush`, `berry`: colR = 0).

## 2. Cơ chế chung mới — `client/js/island/collide.js`

- **Không cần từng file đăng ký.** Mỗi φ/2 s quét cảnh; Mesh/InstancedMesh **đứng yên qua 2 lần quét** được lập chỉ mục 1 lần: chỉ lấy **mặt đứng** (pháp tuyến nghiêng > 45°) → thân cây/cột/chân ghế/hàng rào chặn, **tán cây/mái/mặt ghế không chặn**.
- **Lưới không gian theo chunk 16 m, ô 0,25 m**, mỗi ô ≤ 2 khoảng độ cao `[lo, hi]` (Int16). Chunk chỉ **nạp trong 40 m quanh người chơi, gỡ khi xa > 72 m** (≈ 1 MB); InstancedMesh đăng ký **theo từng instance matrix**.
- Luật chặn (so với chân người, nền đích): vật cao **≤ 0,3 m** (cỏ, hoa, nấm, gờ) → đi qua; đáy vật cao hơn **1,4 m** (tán, đèn treo, mái hiên) → đi dưới; còn lại chặn. Nhảy lên cao thì vượt được vật thấp. Bậc thềm/sàn đã có mặt đỡ (groundExtra/hộp) vẫn bước lên như cũ.
- **Trượt dọc** vật cản (đẩy vòng tròn thân người R = 0,35 m ra khỏi ô), chia bước ≤ 0,25 m; khe hẹp hơn thân người → đứng lại, không chen; đã lấn (vừa lên/xuống xe, dịch chuyển) → không lún sâu thêm, tự đẩy ra 2 cm/bước.
- **Vật động tự loại:** đổi vị trí ở 3 lần quét liên tiếp (người, xe chạy, thuyền, chim, cá), SkinnedMesh, `person-*`, mesh gắn xương, nhân vật chính, viền toon, vật trong suốt/nước. Vật bị ẩn rồi hiện lại không đổi chỗ → đăng ký lại ngay. Cây/đá/bụi terrain (`nature-*`, đổi bản sao theo khoảng cách) dùng vòng tròn cũ; bụi nay có lõi chặn.
- Dùng ở: `player.js` (đi, chạy, xe đạp, thú cưỡi — cùng vòng va chạm), `silver-board.js` (ván bay khi sát đất ≤ 2,6 m), **camera** (`camClear`: tia điểm nhìn → camera dừng trước thân cây/cột chạm xuống gần điểm nhìn). NPC đi bộ: chưa nối (có sẵn `ctx.collide.blocked(x, z, y)` để dùng sau).

## 3. Tự kiểm tra — `tools/collide-test.mjs`

`node server/index.js &` rồi `node tools/collide-test.mjs docs/shots/collide [--mobile] [--n=34]`

Mỗi ca: dịch chuyển cách vật 3,2 m (hướng có đường trống, mặt phẳng), **chạy thẳng vào tâm vật 2,4 s**, rồi **đi vòng ra sau vật** (qua 1 điểm bên hông). Đo mỗi khung khoảng hở nhỏ nhất từ tâm người tới vật chặn **dọc cả đoạn đi giữa 2 khung** (bắt "nhảy cóc"). Đạt khi: không xuyên (hở ≥ 0,05), không lấn (hở ≥ R − 0,05 = 0,30 m), không kẹt cứng (thử 8 hướng, có hướng đi được), không lỗi console.

| Chế độ | Ca thử | Đạt | Loại vật (13) | Khu (~15 ô 60 m) | Lỗi console |
|---|---|---|---|---|---|
| Máy tính 1280×800 | 34 | **33** | ghế, ghế đá, cây, đá, bụi, đèn, biển chỉ đường, thùng rác, bồn cây, sạp, lều, xe đỗ, khúc gỗ | sân trường, thị trấn, công viên, nông trại, bãi biển, khu cắm trại, sân bay… | 0 |
| Điện thoại 390×844 | 34 | **33** | (12 loại tương tự) | ~15 | 0 |

Một lần chạy máy tính trước đó (ngưỡng bước qua 0,4 m, chưa có luật "khe hẹp"): **34/34**.

**Không ca nào xuyên qua vật.** Ca chưa đạt duy nhất (cả 2 chế độ, cùng 1 chỗ): thùng rác sân trường (−1,4; 10,8) đặt cách trụ cổng 0,5 m (hẹp hơn thân người 0,7 m). Trụ có hộp chính xác cũ (`ctx.boxes`), nhân vật dừng cách **mặt trụ thật** đúng 0,35 m, nhưng cách **ô lưới lượng tử 0,25 m** của trụ 0,15 m → test tính là "lấn". Không phải xuyên.

Ảnh: `docs/shots/collide/*.png` (máy tính) và `*-mobile.png` (điện thoại) — nhân vật dừng sát ghế, thùng rác, đèn, lều, cây… Kết quả chi tiết từng ca: `result.json`, `result-mobile.json`.

### Chi phí JS/khung (điện thoại, chỉ phần collide.js = phần thêm vào)

| | đứng yên | đi bộ 8 s (nạp chunk mới) |
|---|---|---|
| tra va chạm + camera / khung | 0,014 ms | 0,009 ms |
| việc nền (quét + lập chỉ mục + vẽ chunk) / giây | 1,2 ms/s | 4,1 ms/s |
| **quy về 60 khung/s** | **≈ 0,03 ms** | **≈ 0,08 ms** |

Máy thử không GPU chỉ chạy 5–10 khung/s nên việc nền định kỳ dồn vào ít khung (số "mỗi khung" thô: 0,19 / 0,43 ms); quy đổi theo giây cho máy thật 60 khung/s. Trần cứng: việc nền ≤ **0,25 ms/khung** trên điện thoại (0,5 ms máy tính), tra cứu không cấp phát bộ nhớ → tổng ≤ +0,3 ms/khung. Bộ nhớ: ~35–42 chunk ≈ 1,1–1,3 MB + chỉ mục ~0,42 triệu số.

Hạn chế đã biết: vật xuất hiện lần đầu cần ~0,8–1,6 s mới chặn (đủ xa vì vùng/đồ nạp từ 89–144 m); vật cao 0,3 m – STEP chặn chứ chưa "đứng lên" được (trừ khi đã có mặt đỡ); ô 0,25 m làm vật mảnh "dày" thêm tối đa 0,25 m.
