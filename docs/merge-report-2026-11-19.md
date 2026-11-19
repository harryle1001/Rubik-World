# Báo cáo ghép — 2026-11-19

Bản chính: `claude/elegant-archimedes-mdknl3`. Không tạo PR, không force-push, không sửa `client/school/`.

## Đã ghép (theo thứ tự)
| # | Nhánh | Ghi chú xung đột / nối |
|---|---|---|
| 1 | vrm-chars | `houses.js`, CREDITS. Áo choàng **một nguồn**: áo mua ở Phố Phép Thuật (`wear.js`) đổi màu chính áo đồng phục VRM (`fit.setRobe`), không gắn áo thứ hai; áo thưởng Bí mật ẩn khi là VRM. Tư thế lái IK (`ride-pose.js`) chạy trên xương thật của VRM. |
| 2 | brand-loading | sạch |
| 3 | no-2d | `ocean.html` (giữ icon logo + thẻ PWA) |
| 4 | spells-core | sạch |
| 5 | spells-build | `net.js`, CREDITS |
| 6 | brooms | `academy/index.js`, `net.js`, `ocean.js`, `server/index.js` |
| 7 | dragons | `ocean.js`, CREDITS |
| 8 | train-v2 | `net.js`, `server/index.js`, CREDITS |
| 9 | alley-v2 | `alley.js`, `wear.js`, `academy/index.js`, `net.js`, `server/index.js` (giữ 5 chổi có giá của brooms + 6 tiệm mới) |
| 10 | academy-v2 | `academy/index.js`, CREDITS |
| 11 | world-expand | CREDITS |
| 12 | mg-expand | `net.js`, `school-town.js`, `server/index.js`, `.gitignore` (giữ "không còn cửa Sắp mở" của no-2d + nút ✋ Chơi) |
| 13 | game-feel | `ocean.js`, CREDITS |
| 14 | online | **nặng nhất**: online chuyển `/island` sang `server/online.js`. Các tính năng đã ghép (phép, làng, Săn Cầu Vàng, trang phục, mini game, Tàu Pha Lê, Đồng Pha Lê) dời sang file mới `server/island-extras.js`, chạy chung namespace qua `hooks` (gói vị trí trên tàu, thông tin công khai). `net.js` gộp thành một đối tượng `net` (on/send/emit/bubble/sendLook/id). |
| 15 | story | `magic.js`, `quiz.js`, `quick-quiz.js`, `temple.js`, `ocean.js`, `CLAUDE.md` (giữ cả câu theo lớp của mg-expand lẫn học thích ứng `learn.js`) |
| + | destiny-forest | phiên đó tự ghép vào bản chính; mình ghép lại bản chính trước khi push, gỡ dấu xung đột sót trong CREDITS.txt |

## Chưa ghép
- `lighthouse`, `ocean-world`, `animals`, `glider`, `silver-board`: chưa có trên origin lúc kết thúc.
- `parent-plan`, `parent-ads`, `sponsors`, `shop`, `portal-build`: có trên origin nhưng **không nằm trong danh sách được giao** → để nguyên, chờ chủ dự án quyết.

## Nối API
- Vòng phép (spells-core) có đủ: Gọi Chổi! → `ctx.spells.hooks.broom` (brooms.js, không đăng ký phép trùng) · Dựng Lên! → giữ `cast` của `village.js` · Gọi Bạn Bay! (`flyers.js`, có thần chú/hồi chiêu).
- Điểm nhà vẫn qua `ctx.houses.addPoints`.

## Phím đã đổi (do trùng J)
| Chức năng | Cũ | Mới |
|---|---|---|
| Gọi/xuống chổi | J | **J** (giữ) |
| 📖 Bách khoa sinh vật | J | **K** |
| 🪂 Thả dù / bung dù | J | **U** |
| 📔 Sổ tay cốt truyện | J | **Y** |

Bảng phím hiện tại: E tương tác · F đũa · 1–9/0 phép · G ngắm sao · H huýt sáo · I túi đồ · J chổi · K bách khoa · L nhiệm vụ · M bản đồ · N âm thanh · O/Q (chế độ ảnh) · P phượng hoàng **và** bảng FPS · R chuông · T khinh khí cầu · B xe đạp · V đổi kiểu xe · C hạ xuống · U dù · Y sổ tay.

## Lỗi do ghép đã sửa (commit "Sửa sau ghép: …")
- Server: `me.r`, `me.s` bị nuốt vào chú thích (nhánh brooms, alley-v2, mg-expand cùng lỗi) → người khác không xoay hướng. Đã sửa.
- Thiếu `server/island-extras.js` trong commit ghép online (server không khởi động) → đã thêm, kiểm bằng bản clone sạch.
- `net.on` bỏ qua sự kiện mà net.js đã tự nghe (`look`, `mg`, `hello`…) → đã sửa.
- Thoát mini game lỗi khi NPC là VRM (vật liệu dạng mảng) → đã sửa.
- Draw call điện thoại ở sân Học viện vượt 233 → NPC anime VRM tự co theo draw call thật (đo 1 khung/giây), đoàn tàu Pha Lê không vẽ khi ngoài khung nhìn / xa hơn 377 m.
- `scripts/build-artifact.sh`: gói VRM (đổi đuôi `.wasm`, chỉ 8 mẫu dùng trong game), `js/vendor` (three-vrm), `icons`; vá đường dẫn tuyệt đối còn lại (âm thanh tàu, texture, chess.js qua CDN).

## Kiểm thử (Playwright + SwiftShader, 1280×720 và 390×844)
- `node --check` toàn bộ file đổi; `node server/index.js` chạy (SQLite `data/rubik.db`).
- Không `pageerror` / console error ở cả hai cỡ màn hình.
- Đạt: màn tải xoắn ốc vàng + "Design by Dreamlabs.vn"; nhân vật VRM hiện; vòng phép + "Sáng Lên!"; "Gọi Chổi!" → cưỡi chổi; Tàu Pha Lê ngồi ghế; Phố Phép Thuật, lâu đài, Sân Bắc, 2 sân chổi, làng; máy bay + 🪂 nhảy dù rồi chạm đất; 3 mini game (rubik, zen, coach) vào/thoát; 2 máy thấy nhau, đồng bộ phép/trang phục/mini game/tàu.
- Nút điện thoại: không chồng nhau khi đi bộ / cưỡi chổi / lái máy bay / nhảy dù.
- Draw call điện thoại (mức chất lượng 1): cổng trường **197–219**; sân Học viện **166–217** sau khi ổn định.
- Bản đóng gói artifact: chạy tĩnh, VRM nạp được.

## Còn tồn
- Sân Học viện trên điện thoại: vài giây đầu sau khi dịch chuyển tới có thể lên ~260 draw call rồi tự hạ (bộ co VRM giảm 1 nhân vật/giây).
- Tam giác ở cổng trường điện thoại ~630–680 nghìn (chưa có ngưỡng được giao, nhưng cao).
- Trùng tên/khu: có **2 "Sân Bay Chổi"** (`pitch.js` của brooms trên hồ đông, `broom.js` của academy-v2 trên vách đông — không đè nhau) và **2 "Thung Lũng Rồng"** (dragons trên đảo Học viện, `story/valley.js` của Chương 6). Nên gộp hoặc đổi tên.
- Phím P dùng cho cả phượng hoàng và bảng FPS (có từ trước); M dùng cho bản đồ đảo, bản đồ nội thất, bản đồ rừng (theo ngữ cảnh).
- Đoạn dẫn chuyện mở đầu (story) bật ngay sau hướng dẫn; đã có chặn khi đang mini game / hộp thoại, chưa thử hết với mọi phương tiện.
- Áo choàng một nguồn và tư thế lái VRM mới kiểm bằng chạy không lỗi + ảnh tổng thể, **chưa soi ảnh cận** từng xe / từng màu áo.
- Chổi phải hạ chạm đất mới xuống được (thiết kế của vehicles.js) — bấm 🧹 giữa không trung chỉ hiện nhắc.
- Bản artifact không có server: `/api/health` và `socket.io` trả 404 (chơi một mình vẫn chạy).
- `tools/smoke-test.mjs` chưa bấm "Chơi khách" của màn đăng nhập mới nên báo sai; kịch bản thử dùng trong lần ghép này không lưu trong repo.
