# Chơi thử toàn bộ đảo 3D — `tools/full-playtest.mjs` (phiên HOÀN THIỆN, 26/11/2026)

Bot chơi như học sinh: phím (máy tính) / chạm CDP thật + joystick (điện thoại), bấm đúng nút trên màn hình (kiểm tra nút có bị che), chỉ dịch chuyển tới chỗ **trống ngoài trời** rồi đi bộ thật.
Theo dõi mỗi khung: rơi biển khi đi bộ, đứng trong vật (lưới va chạm chặn ngay tâm người > 0,5 s), nhảy vị trí > 8 m không do dịch chuyển/cửa/mini game, NaN, nhân vật bị khoá sau bước, lỗi console/HTTP. Bước FAIL → ảnh + 3 toast gần nhất.

```
PORT=3400 node server/index.js &
node tools/full-playtest.mjs --size=desk|port|land [--out=thư-mục-ảnh] [--json=kq.json] [--only=walk,npc] [--skip=plane] [--mg=zen,rubik]
```
`desk` 1280×720 · `port` điện thoại dọc 390×844 · `land` điện thoại ngang 844×390.

Ghi chú kịch bản: khách bị Gói Phụ huynh khoá Học viện/tàu/26 mini game (đúng thiết kế) → bot mở khoá trong trình duyệt để thử nội dung. Ví khởi đầu 34 🪙 không đủ mua xe/khinh khí cầu → bot cộng 700 🪙 (như đã chơi kiếm được), mua 🎈 bằng giao diện cửa hàng, rồi mua giấy phép bay/chổi tập/ván bạc qua `eco.buy`. Mưa: **không có nút cho người chơi** (chỉ `weather.set`) — ghi nhận, không thêm tính năng.

## Lỗi đã sửa (mỗi lỗi 1 commit, đã chơi thử lại ca đó)

| # | Mức | Lỗi (tìm bằng bot) | Sửa | File |
|---|---|---|---|---|
| 1 | 🔴 kẹt | Thoát **Đua ván bạc** vẫn bị gắn trên ván (mất cột nút, 🏫 Đến trường/dịch chuyển hỏng) — lỗi báo từ 20/11 | ván do cuộc đua gọi ra → cất khi thoát | `mg/sport/board-race.js` |
| 2 | 🔴 kẹt | Mở mini game (☰ → 🎮) **giữa đoạn dẫn chuyện** → thanh điện ảnh che ✕ Thoát, kẹt trong game (Vườn thiền…) | ẩn ☰ khi đang chiếu; `mg.start` từ chối + lời nhắc | `mg/host.js`, `ocean.html` |
| 3 | 🔴 kẹt | **Không đi bộ vào được lâu đài Học viện**: chân tường rêu (0,43 m tường thành, 0,95 m dãy nhà) chạy liền qua mọi khe cổng/lối cửa | chỉ dựng dưới đoạn có tường | `academy/kit.js` |
| 4 | 🔴 kẹt | **Không lên được hải đăng**: 21 bậc đá bị va chạm chặn (nhìn trước theo bán kính thấy mép bậc thứ 2 > 0,3 m) | ô có mặt đỡ ngay tại chỗ → không chặn; tấm mỏng ≤ 0,3 m dày cao ≤ 0,6 m → bước qua | `collide.js` |
| 5 | 🔴 kẹt | Đầu 21 bậc đá có rãnh sâu 0,35 m dài 1 m + vách dốc | bỏ rãnh ở đầu bậc | `lighthouse/plan.js` |
| 6 | 🔴 kẹt | Trong tháp hải đăng kẹt ở **bậc 6/144**: biển số bậc, khung cửa sổ gắn tường bị gộp với bậc thành tường giả | đồ gắn tường không vào lưới va chạm | `lighthouse/build.js` |
| 7 | 🔴 kẹt | **Kẹt giữa cổng trường**: dây cờ treo 4,6 m bị gộp với gờ bậc thành bức tường giả 1,2–4,9 m | ô đủ 2 khoảng: không gộp qua khe > 1,8 m, bỏ phần treo cao | `collide.js` |
| 8 | 🔴 xuyên | Máy chậm **đi xuyên cây** lúc mới vào game (hàng chờ ~500 vật, ngân sách cố định/khung → ~68 s mới chặn) | ngân sách theo thời gian thật, hàng chờ dài ×3, InstancedMesh xếp theo bản sao gần nhất, chunk cạnh người ưu tiên (→ 33–41 s máy ảo) | `collide.js` |
| 9 | 🔴 kẹt | Cỏ biển 0,56 m, **rèm dây leo** lối bí mật Rừng Thiên Định bị coi là vật chặn | cỏ/hoa/dương xỉ/dây leo/rêu không chặn | `collide.js` |
| 10 | 🟠 giao diện | **Điện thoại ngang**: bảng đăng nhập cao hơn màn, nút *Chơi khách* ngoài màn, không cuộn được | bảng cuộn được, gọn khi màn thấp | `account-hud.js` |
| 11 | 🟠 giao diện | Máy tính 720 px: cột nút phải tràn khỏi màn (⭐ ra ngoài, 🪽 đè thông báo chương) | canh trên, nút 44 px; ≤ 640 px thành 2 cột | `ocean.html` |
| 12 | 🟠 giao diện | Máy tính: 📷 chồng 🎒 | 📷 trên đầu cột | `ocean.html` |
| 13 | 🟠 giao diện | Nút clip mở đầu bị kiểu `.btns` của HUD đè (cắt chữ "Bỏ qua") | lớp riêng `.ibtns` | `intro.js` |
| 14 | 🟠 giao diện | Điện thoại ngang: lời nhắc (toast) đè nút 💬/📷 và nhãn hành động | lên giữa phía trên | `ocean.html` |
| 15 | 🟠 giao diện | Điện thoại ngang: nút ✨ phép trùng chỗ 📷, đè nút hành động | dời lên trên nút Chạy | `academy/magic.js` |
| 16 | 🟠 giao diện | Nút HUD phép (📚 +34, 🔊, 🤝) cao 26 px — khó chạm | tối thiểu 34 px | `academy/magic.js` |
| 17 | 🟠 giao diện | Thẻ Lễ chọn Nhà/"Chúc mừng…" không có ✕ | ✕ chung cho thẻ nhà | `academy/houses.js` |
| 18 | 🟡 | Đại sảnh: lễ chọn nhà của NPC bắn toast mỗi 5 s, đè lời nhắc | 1 lần/34 s | `academy/life.js` |
| 19 | 🟡 | Bấm 🎈 khi chưa đứng vững: im lặng | báo lý do | `vehicles.js` |
| 20 | 🟡 console | Lỗi `reading 'isReady'` lúc tải (three `compileAsync` gặp vật liệu bị huỷ) | tự chờ biên dịch, bỏ vật liệu không còn chương trình | `ocean.js` |

Kiểm lại không hỏng chỗ khác: `tools/collide-test.mjs` **40/40** (không xuyên vật) sau các sửa va chạm.

## Bảng ca — lượt chạy cuối (26/11, sau ghép nhánh chung)

**Máy tính 25/29 · Điện thoại dọc 25/29 · Điện thoại ngang 26/29.** Trước khi sửa (lượt đầu): máy tính ~13/29, mini game có 6 game kẹt khi thoát, điện thoại ngang không vào được game (nút *Chơi khách* ngoài màn).
**Chưa đạt yêu cầu "3 lượt liên tiếp đều PASS"** — các ca còn đỏ ở mục dưới.

| Ca | Máy tính 1280×720 | Dọc 390×844 | Ngang 844×390 |
|---|---|---|---|
| `load` Mở game  | ✅ | ✅ | ✅ |
| `guest` Bảng tài khoản → Chơi khách | ✅ | ✅ | ✅ |
| `intro` Clip mở đầu → bấm Bỏ qua ⏭ | ✅ | ✅ | ✅ |
| `avatar` Tạo nhân vật  | ✅ | ✅ | ✅ |
| `walk` Đi bộ từ cổng vào sân trường bằng joystick/phím  | ✅ | ✅ | ✅ |
| `npc` Nói chuyện NPC → trả lời câu hỏi → bấm ✕ | ✅ | ✅ | ✅ |
| `mg` Mọi mini game: vào  | ✅ | ✅ | ✅ |
| `shop` Cặp sách 🎒 → 🛒 Cửa hàng → mua 1 món bằng vàng → ✕ | ✅ | ✅ | ✅ |
| `bike` Xe đạp 🚲: lên, đạp 4 s, xuống | ✅ | ✅ | ✅ |
| `balloon` Khinh khí cầu: lên, bay cao, bay tới, hạ, rời | ✅ | ✅ | ✅ |
| `plane` Máy bay: lên → cất cánh → bay qua Học viện → nút đỏ nhảy ra → diều lượ | ✅ | ✅ | ✅ |
| `broom` Chổi 🧹: gọi, bay lên, bay tới, hạ, xuống | ✅ | ✅ | ✅ |
| `board` Ván bạc 🏄: lên, lướt, xuống | ✅ | ✅ | ✅ |
| `boat` Thuyền: lên thuyền buồm/ca nô ở làng chài, lái, lên bờ | ✅ | ✅ | ✅ |
| `train` Tàu Pha Lê: lên tàu ở ga đảo Rubik → tới ga Học viện → xuống tàu | ❌ | ❌ | ✅ |
| `academy` Học viện: đi bộ tới cổng lâu đài → sân → Đại sảnh → nhận đũa → vào tro | ❌ | ❌ | ❌ |
| `house` Lễ chọn Nhà  | ✅ | ✅ | ✅ |
| `class` Lớp học Học viện: tới cửa lớp → vào → ✕ Thoát | ✅ | ❌ | ✅ |
| `alley` Phố Phép Thuật: đi bộ dạo phố | ✅ | ✅ | ✅ |
| `forest` Rừng Học viện → hồ trong rừng | ✅ | ✅ | ✅ |
| `destiny` Rừng Thiên Định  | ❌ | ❌ | ❌ |
| `lighthouse` Hải đăng: thuyền ra đảo đá → vào tháp → leo 144 bậc lên đỉnh | ❌ | ✅ | ✅ |
| `village` Làng chài Vịnh Én: đi bộ dọc cầu tàu | ✅ | ✅ | ✅ |
| `spell` Vòng phép: mở vòng ✨ → chọn 1 phép → phép được thi triển | ✅ | ✅ | ✅ |
| `map` Bản đồ M: mở → ✕ đóng | ✅ | ✅ | ✅ |
| `time` Đổi giờ ☀️  | ✅ | ✅ | ✅ |
| `photo` 📷 Chụp ảnh con vật  | ✅ | ✅ | ❌ |
| `save` Lưu → tải lại trang → Chơi khách → tiến độ còn nguyên | ✅ | ✅ | ✅ |
| `ui` Rà giao diện lần cuối: nút chồng / tràn / chữ cắt / nút nhỏ | ✅ | ✅ | ✅ |

Mini game: **35/35 vào–chơi–✕ Thoát** ở cả 3 cỡ màn hình (6 lớp Học viện + Đua ván bạc không có trong menu 🎮 → vào bằng `mg.start` qua cửa).
Không lỗi console/HTTP ở các ca đạt. Không ca nào ghi nhận đi xuyên vật / rơi biển khi đi bộ trên đất liền.

## Lỗi còn lại (chưa xong — cần phiên sau)

| Ca | Hiện tượng | Nhận định |
|---|---|---|
| `academy` (cả 3) | Vào được lâu đài (7 tầng) nhưng bot không tới được chân cầu thang đá ở Sảnh đón (y ≈ 1589–1597, cần tới tầng 1 ≈ 1605) | Bot đi thẳng, chưa tìm đường qua cửa/phòng trong lâu đài; "cầu thang xoay" ở giếng giữa đổi lối theo giờ. Cần thêm điểm dẫn đường theo `interior/plan.js` (cửa `dX/dZ`). Chưa thấy lỗi game. |
| `destiny` (cả 3) | Kẹt quanh đá bước qua lạch / cửa đông Ngã ba Mặt Trời; bot rơi xuống lạch | Đi đúng tim lối thì qua được (đã thử riêng: đá bước → khe dốc lên y 3,25 m). Cửa đông giữa 2 bụi rào r = 1,3 m chỉ rộng ~1,4 m — **nên xem lại cho trẻ dùng joystick** (nới khe hoặc giảm bán kính bụi rào). Khi va vào mép vòng va chạm, luật "chốt cuối" đứng lại chỗ cũ thay vì trượt. |
| `lighthouse` (máy tính) | Leo tới ~5,6 m / 25,9 m (bậc ~31) rồi kẹt ở mép trong cầu thang sát sàn gác tầng 1 | Điện thoại dọc **đạt** (leo tới đỉnh). Ô va chạm ở mép trong (lan can/dầm sàn gác, cao hơn bậc 0,33 m) chặn khi đi lệch vào trong — nên cho dầm sàn gác `noCollide` hoặc nới 0,06 m dung sai. |
| `train` (máy tính, dọc) | Lượt cuối: không có 🚂 ở sân ga trong 4 phút (tàu chạy theo lịch máy chủ, đang ở ga kia) / lên tàu nhưng không ngồi thì không đi cùng | Lượt trước đạt (tới ga Học viện, xuống tàu). Đã thêm bước ngồi ghế; cần chạy lại. |
| `class` (dọc) | Không thấy nút vào lớp tại cửa (đang: không có nút nào) | Lượt khác đạt; nghi lớp học chưa dựng xong (LOD) khi vừa dịch chuyển từ phòng nhà. |
| `photo` (ngang) | Không có con vật trong tầm 📷 ở 10 điểm ngẫu nhiên | Phụ thuộc giờ/thời tiết (đêm + mưa vừa bật ở ca trước). |

## Lỗi hiệu năng (ghi cho 2 phiên Tối ưu, không tự sửa sâu)
- Lưới va chạm (`collide.js`) cần ~33–41 s (máy ảo điện thoại) để lập chỉ mục ~500 vật quanh trường sau khi vào game; trong lúc đó vật xa chưa chặn. Đã tăng ngân sách theo thời gian thật + ưu tiên gần, **Tối ưu 2/3** nên xem chi phí thật trên điện thoại (`tools/collide-test.mjs` đo ms/khung).
- Máy ảo đôi khi vẽ ra màn hình xanh trơn khi 3 trình duyệt chạy song song (nghi mất ngữ cảnh WebGL do tải CPU) — **Tối ưu 1/3** theo dõi nếu gặp trên máy thật.

## Rà giao diện điện thoại (lần cuối)
- Ca `ui` đạt cả 3 cỡ: không nút chồng nút, không nút tràn mép/ngoài vùng an toàn, không chữ bị cắt, nút chạm ≥ 30 px (trừ dải HUD trên cùng theo thiết kế 34 px).
- Bảng có ✕: bản đồ, cặp sách, cửa hàng, thẻ nhà (mới thêm), câu hỏi, thoại NPC, mini game, sổ tay ảnh. Trình tạo nhân vật dùng nút *Huỷ*.
- Phản hồi chạm: mọi nút bấm bằng sự kiện chạm thật (CDP), giao diện đổi trong khung kế tiếp; chưa đo ms chính xác trên máy thật (máy ảo 3–10 khung/s).

