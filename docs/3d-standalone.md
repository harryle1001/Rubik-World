# Đảo Rubik 3D chạy độc lập (không còn iframe 2D)

Trước đây `school-town.js` tạo 1 iframe ẩn `/school/index.html?embed=1` (cả game 2D Phaser/canvas chạy ngầm)
rồi đọc `window.RS`. Nay 3D có lớp dữ liệu riêng `client/js/island/data/` — dữ liệu được **sao chép** từ 2D
(không import code 2D). Game 2D (`client/school/`) giữ nguyên, vẫn chạy riêng.

## Kiểm kê chỗ 3D dùng iframe / RS

| Dữ liệu | Dùng ở đâu (trước) | Chuyển sang |
|---|---|---|
| Iframe `/school/index.html?embed=1`, chờ `contentWindow.RS` | `school-town.js` (tạo iframe, `waitRS`) | **Xoá**. `build()` chạy ngay khi tạo thị trấn |
| `RS.R` (vùng/phòng: toạ độ, tường, cửa `dw/din/dout`, tên) | `school-town.js`, `town-buildings.js`, `zone-school.js`, `zone-north.js`, `zone-east.js`, `world-map.js` | `data/map.js` → `R` |
| `RS.regionAt(x, y)` | `school-town.js` (màu nền, tiếng bước chân), `town-buildings.js`, `world-map.js` | `data/map.js` → `regionAt` (sao chép `ROOM_ORDER` + luật) |
| `RS.doors()` (77 cửa: `n, x, y, host`) | `school-town.js` (vòng sáng, E), `town-buildings.js`, `zone-east.js` (cửa “Nhà của…”), `mg/host.js` (khoá game theo `d.n`) | `data/map.js` → `DOORS` (giữ nguyên tên `n` để `doorKey()` khớp) |
| `RS.GATE`, `RS.HOUSES` | `school-town.js` (`setHouses`), `zone-school.js`, `sample/gate.js` | `data/map.js` → `GATE`, `HOUSES` |
| Hằng số bản đồ `LAKE, LOTUS, POND, GBOARD, RMON, FLAG, LAMPS, TREES, FOREST_TREES, TENTS, DALAT, BOOTH, CHESS_T, MUSIC_SPOTS, TRAIL, FOREST_GATES` | `town-buildings.js` (`readExtra(win)`), `zone-north.js` (`RS.FOREST_TREES`) | `data/map.js` (đã tính sẵn — rừng thông/nhà Đà Lạt sinh ngẫu nhiên có hạt giống cố định) |
| `RS.R.field` (sân bóng) qua `document.querySelector('iframe')` | `physics.js` (đặt quả bóng) | `data/map.js` → `R.field` |
| `RS.clock` (phút trong ngày) → giờ bầu trời | `school-town.js` | `data/clock.js` (giờ thật trên máy; nút ☀️ khoá giờ thì đồng hồ theo giờ khoá) |
| `#hudClock`, `#hudPeriod` của iframe → `ctx.schoolHours` | `school-town.js` | `data/clock.js` → `period()`, `isSchoolHours()`, chip đồng hồ HUD 3D |
| `RS.agents` (8 thầy cô/nhân viên + 13 học sinh = 21) + lịch đi lại | `town-people.js`, `world-map.js` | `data/people.js` (danh sách + lịch theo tiết, đi qua cửa lớp) |
| `RS.npcs`, `RS.npcShown` (khách bơi, lướt sóng, đạp xe, câu cá, picnic…) | `town-people.js`, `world-map.js` | `data/people.js` |
| `RS.enterDoor(d)` (mở bảng mini game 2D) | `school-town.js` | Có bản 3D (`mg/host.js`) → mở 3D; chưa có → thông báo **“Sắp mở”** |
| `RS.btn2D('hMenu')` (Menu trường 2D) | `school-town.js` (`📚 Menu trường`) | Bảng menu 3D: danh sách mini game 3D đã có (dịch chuyển tới cửa) |
| Kiểm tra modal trong iframe (`isModal`, `pointer-events`) | `school-town.js` | **Xoá** (không còn bảng 2D) |
| Đăng nhập / tài khoản / xu / vật phẩm (`truong-accounts-v1`, hộp `#mLogin` 2D) | 2D tự chọn “Chỉ xem” khi nhúng | `data/account.js` (localStorage `island.*`, PBKDF2, chuyển dữ liệu cũ) + HUD `account-hud.js` |
| `ctx.school.win.Chess` (thư viện cờ của iframe) | `mg/board/chess.js` | Không sửa `mg/*`: hàm đã tự tải `/lib/chess.js` khi không có iframe |
| `world-map.js` chờ `ctx.school.RS` | `world-map.js` | `ctx.school.RS` = lớp tương thích (`data/index.js`) chỉ đọc từ `data/` |

## Lớp dữ liệu `client/js/island/data/`
- `map.js` — hằng số bản đồ, `R`, `regionAt`, `HOUSES`, `GATE`, `DOORS` (+ các mảng cây, lều, nhà Đà Lạt…).
- `people.js` — 21 bạn & thầy cô (tên, vai trò, màu áo), lịch theo tiết, mô phỏng đi lại đơn giản theo đường qua cửa; khách NPC.
- `clock.js` — giờ học (thời khoá biểu như 2D), đồng hồ trường, `period()`, tên tiết.
- `account.js` — đăng ký/đăng nhập/khách, “Lưu đăng nhập”, xu & vật phẩm; khoá `island.accounts`; lần đầu tự chép tài khoản cũ từ `truong-accounts-v1`.
- `index.js` — gom lại thành đối tượng giống `RS` cũ (cho các module dựng 3D không phải sửa nhiều).

Server (`server/index.js`) không có API tài khoản REST (chỉ Socket.io cho đa người chơi) → tài khoản lưu trên máy như bản 2D.

## Số đo (Playwright, Chromium headless, 1280×800, server cục bộ)

| | Trước (có iframe) | Sau |
|---|---|---|
| Thời gian tới khi thị trấn dựng xong | 13,8 s | _xem cuối file_ |
| Số request | 256 | |
| Dung lượng tải | 15,8 MB | |
| JS heap | 199 MB | |
| Iframe | 1 | |
