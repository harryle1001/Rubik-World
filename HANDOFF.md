# HANDOFF — Đảo Rubik 3D (cập nhật 27/11/2026)

Tài liệu tổng hợp để làm tiếp trên **Claude Code máy tính**. Đọc file này + `CLAUDE.md` trước khi làm.

## 1. Lấy code về máy
```bash
git clone https://github.com/harryle1001/Rubik-World.git
cd Rubik-World
git checkout claude/elegant-archimedes-mdknl3     # NHÁNH CHÍNH — mọi thứ đã ghép ở đây
npm install
PORT=3000 node server/index.js                     # mở http://localhost:3000
```
- Bản chơi thử trực tuyến (artifact v26): https://claude.ai/artifact/TBKNZ3mhwEwU2cQoJxy8jk
- Đóng gói artifact: `bash scripts/build-artifact.sh <thư-mục>` (glb → pack*.wasm, vrm → .wasm).
- `main` đã cũ, chưa ghép. Muốn đổi nhánh chính thành `main` thì ghép `claude/elegant-archimedes-mdknl3` vào.

## 2. Đã có trong nhánh chính
- **Thế giới:** đảo 3D (trường, thị trấn, quảng trường, sân bay, bờ biển), Học viện Pha Lê (4 nhà Tứ Linh, lớp học, cầu thang di chuyển, tranh, rừng + hồ), Phố Phép Thuật, Rừng Thiền, Rừng Thiên Định, Hải đăng Mũi Sóng (tháp 34 m), Làng chài Vịnh Én, đại dương (tàu thuyền, cá heo, cá voi, giông), vùng mở rộng.
- **Di chuyển:** xe đạp, khinh khí cầu (T), máy bay + nhảy dù/diều lượn, chổi (J), rồng, ván bạc bay (U) + đua ván, thuyền/ca nô/phà, Tàu Pha Lê v2.
- **Lối chơi:** cốt truyện 8 chương "Khối Rubik Pha Lê" (Y = sổ tay), phép thuật (vòng phép), xây nhà bằng phép, ~26 mini game, khung câu hỏi chung (`learn.js`), động vật + 📷 chụp nhanh, sổ thiên nhiên.
- **Nhân vật:** VRM anime (Shino/Victoria/Vivi, HairSample Male, thầy Fumiriya) + đồng phục phù thủy tự thiết kế; clip mở đầu ngủ gật trong lớp.
- **Kinh tế:** 🪙 vàng (kiếm khi chơi), 💎 kim cương hồng (chỉ nạp qua cổng phụ huynh), 🎒 cặp 4 ngăn, 🛒 cửa hàng. Không lootbox.
- **Giao diện:** HUD gọn 1 hàng trên cùng, va chạm chung (`collide.js`), logo + màn tải xoắn ốc vàng, "Design by Dreamlabs.vn".
- **Online:** Express + Socket.io (`server/`), hướng dẫn Render ở `docs/deploy.md`.

## 3. Tối ưu 26/11 (3 session, đã ghép)
| Hạng mục | Kết quả | Báo cáo |
|---|---|---|
| Đồ hoạ GPU | bộ nhớ GPU giảm ~½ (VD 207→112 MB), tam giác −20–40 %, draw call Học viện 218→170 | `docs/perf/opt-gpu.md` |
| CPU / bộ nhớ | JS/khung Học viện 102→73 ms, khựng >100 ms 144→29; rò bộ nhớ Học viện↔thị trấn +302→+48 MB | `docs/perf/opt-cpu.md` |
| Chơi thử toàn bộ | 20 lỗi đã sửa; đạt 25/29 (máy tính), 25/29 (dọc), 26/29 (ngang) | `docs/full-playtest.md` |

## 4. Việc còn lại (ưu tiên từ trên xuống)
1. **5 ca playtest còn đỏ** (`node tools/full-playtest.mjs --size=desk|port|land`): `academy` (vào trong lâu đài), `destiny` (Rừng Thiên Định), `train` (máy tính + dọc), `lighthouse` (máy tính), `class` (dọc). Cần xác định lỗi game hay lỗi kịch bản bot.
2. Draw call vài khu vẫn > 150 (mục tiêu ≤ 150, mượt ≤ 100) — xem `docs/perf/opt-gpu.md`.
3. Câu hỏi chủ dự án cần chốt: **Chổi Tập Bay (21 🪙) có cho miễn phí không?**
4. **Nhánh kiếm tiền chưa ghép** (chờ chủ dự án quyết): `claude/parent-plan`, `claude/sponsors`, `claude/shop`, `claude/parent-ads`, `claude/portal-build` (Poki/CrazyGames).
5. Deploy Render (cần tài khoản chủ dự án) · đăng ký HKD · App Store sau (`docs/app-store-checklist.md`).
6. Bot chơi thử hằng ngày 6:47 sáng (giờ VN) đẩy báo cáo lên `claude/daily-playtest`.

## 5. Công cụ kiểm thử
| Lệnh | Dùng để |
|---|---|
| `node tools/full-playtest.mjs --size=desk` | chơi thử toàn bộ (29 ca) |
| `node tools/perf-gpu.mjs --out=…` | đo draw call / tam giác / bộ nhớ GPU |
| `node tools/perf-opt-cpu.mjs --out=… [--leak]` | đo CPU, khựng, rò bộ nhớ |
| `node tools/collide-test.mjs docs/shots/collide [--mobile]` | va chạm (40/40) |
| `node tools/hud-test.mjs docs/shots/hud-compact sau` | bố cục HUD |
| `node tools/board-test.mjs <thư-mục> [--mobile]` | ván bạc + đua |

Trên máy có GPU thật, số ms/khung mới đúng (máy ảo cloud dùng SwiftShader chỉ so tương đối).

## 6. Quy tắc giữ nguyên
- Chỉ tài nguyên CC0/MIT, ghi nguồn `client/assets/CREDITS.txt`; không dùng tên/thiết kế có bản quyền (Harry Potter, Zelda, Marvel…).
- An toàn trẻ em: không chat tự do, không quảng cáo trong game, thanh toán/link ngoài chỉ sau cổng phụ huynh.
- Tỷ lệ vàng φ, greybox trước, mỗi tính năng 1 commit có ảnh chụp.
