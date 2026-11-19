# Sửa lỗi nghiêm trọng (chơi thật trên điện thoại) — số đo trước/sau

Đo bằng `node tools/perf-tour.mjs` (điện thoại giả lập 390×844, DPR 2, UA iPhone → `CFG.isMobile`, chất lượng khoá mức 1, 13h)
và `node tools/perf-cpu.mjs --sec=30` (CPU chậm 4×, đi bộ 30 s + chạy vòng quảng trường). GPU giả lập SwiftShader → ms/khung tuyệt
đối không phản ánh máy thật (mọi khung > 100 ms vì GPU chạy bằng CPU); so sánh draw call, lưới có xương, JS, GC.

## 1. "Đang đi tới trường thì bị bay ra biển"
**Nguyên nhân:** thuyền Học viện, thuyền liên vùng, máy bay, dù, tàu đặt lại `player.pos` **mỗi khung** theo phương tiện. Bấm
🏫 Đến trường (hoặc "tới chỗ bạn") giữa chuyến chỉ dịch chuyển 1 khung rồi bị kéo ngược ra giữa biển. Xe/thuyền/khinh khí cầu/chổi
dịch chuyển mà vẫn gắn phương tiện. `tools/ride-warp-test.mjs`: **trước** đang trên thuyền Học viện bấm 🏫 → vẫn ở giữa biển, cách
cổng 369 m · **sau** báo "tới nơi rồi bấm lại"; khinh khí cầu/chổi → xuống ngay, đứng ở cổng (cách 0 m, trên đất liền).
Đi bộ thật (`tools/walk-test.mjs`, WASD + joystick, 10 659 khung quanh trường): không bước nhảy > 5 m ngoài 🏫, không NaN, không đứng trên nước.
Thêm lưới an toàn: vị trí NaN/ngoài ±2,9 km → về chỗ đứng vững gần nhất trên đất liền; teleport bỏ qua toạ độ NaN.

Kèm: server sập lúc khởi động (`require('./island-extras')` thiếu file sau lần ghép trước) → khôi phục `server/island-extras.js`.

## 2. "Joystick bị kẹt"
**Nguyên nhân:** (a) joystick chỉ nhả khi có pointerup/pointercancel — đổi tab/app, thông báo hệ thống, iOS mất touchend → nhân vật
đi mãi, chạm mới ở nửa trái thành xoay camera; (b) thoát mini game ném lỗi khi khu chơi có nhân vật VRM (material dạng mảng) →
thoát dở, người chơi bị khoá đứng im. `tools/touch-test.mjs` (CDP touch thật, 9 ca): **trước** ca chuyển tab kẹt `z = −1`, ca mini
game đi được 0 m · **sau** 9/9 ca joystick trở lại bình thường.

## 3. "Giật lag liên tục"
**Thủ phạm:** nhân vật VRM của NPC (tính năng mới ghép): mỗi bạn VRM ≈ 12–16 lưới có xương (draw call + pass bóng + cập nhật xương
trên CPU); điện thoại cho tới 5 bạn trong 21 m → +~80 call, và mỗi lần bạn mới lại gần phải parse VRM (khựng). Sửa (vrm-npc.js):
điện thoại tối đa **2** bạn VRM trong **13 m**, viền VRM chỉ khi ở gần, kho giữ 2×MAX+1 bản đã parse (đi qua lại không parse lại),
nạp thưa ≥ 3 s/lần. Chất lượng tự động (autoq.js) trên điện thoại hạ nhanh hơn: 2 bậc độ phân giải/lần, < low/φ FPS → hạ mức ngay.

| Điểm | Draw call | Call bóng | Tam giác | Lưới có xương | VRM NPC | JS ms/khung |
|---|---|---|---|---|---|---|
| Cổng trường | 207 → **207** | 20 → 22 | 665 k → 664 k | 69 → **41** | 3 → 1 | 3.66 → 3.22 |
| Quảng trường | 236 → **218** | 33 → 24 | 707 k → 675 k | 95 → **53** | 5 → 2 | 6.22 → 3.86 |
| Khu trường (sân trong) | 243 → **221** | 28 → 24 | 695 k → 669 k | 60 → **44** | 2 → 1 | 5.26 → 2.76 |
| Thị trấn Đà Lạt | 172 → **178** | 14 → 13 | 590 k → 595 k | 27 → **33** | 0 → 0 | 4.19 → 3.86 |
| Sân bay | 162 → **164** | 11 → 11 | 539 k → 543 k | 16 → **19** | 0 → 0 | 2.7 → 2.65 |
| Bờ biển | 142 → **146** | 4 → 5 | 519 k → 524 k | 16 → **19** | 0 → 0 | 2.02 → 2.1 |
| Lặn biển | 123 → **127** | 4 → 4 | 336 k → 341 k | 16 → **19** | 0 → 0 | 2.02 → 2.31 |
| Đêm mưa (cổng trường) | 198 → **207** | 22 → 23 | 645 k → 653 k | 17 → **20** | 0 → 0 | 2.5 → 2.51 |
| Khinh khí cầu | 245 → **214** | 24 → 25 | 685 k → 653 k | 83 → **26** | 4 → 0 | 7.35 → 3.89 |
| Học viện Pha Lê | 119 → **122** | 7 → 7 | 288 k → 294 k | 16 → **19** | 0 → 0 | 7.48 → 6.41 |
| Bay chổi (cổng trường) | 266 → **226** | 29 → 26 | 710 k → 663 k | 98 → **43** | 5 → 1 | 7.21 → 6.76 |
| Bay máy bay | 133 → **132** | 11 → 11 | 446 k → 444 k | 0 → **0** | 0 → 0 | 3.35 → 4.38 |

Mục tiêu ≤ 233 draw call: **trước** vượt ở 4 điểm (quảng trường 236, sân trong 243, khinh khí cầu 245, bay chổi 266) · **sau** tối đa 226.

CPU đi bộ (`perf-cpu`, CPU chậm 4×, 30 s):

| | JS/khung p95 | JS/khung max | khung JS > 100 ms | GC nhỏ / lớn | normalizeSkinWeights (parse VRM) |
|---|---|---|---|---|---|
| trước | 204 ms | 526 ms | 23 | 44 / 10 | 698 ms |
| sau | 129 ms | 410 ms | 32* | 26 / 8 | 407 ms |

\* chạy dài hơn (101 so với 89 khung) do khung nhanh hơn; ước tính ở CPU không bị làm chậm: JS/khung p95 ≈ 129 / 4 ≈ 32 ms (chưa đo trên máy thật).
Còn lại: tới Học viện bằng dịch chuyển tức thời biên dịch ~40 shader ngay khung đầu (đi thuyền thì đã biên dịch trước trong 5 s/lần).
