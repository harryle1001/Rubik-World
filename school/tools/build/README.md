# tools/build — đóng gói game 2D cho web (v61l)

## Chạy
```bash
cd school/tools/build
npm i            # lần đầu: cài esbuild (chỉ dùng lúc build)
node build.js    # ~8 giây
```
Kết quả:
- `school/dist/game.<hash>.js` — cả 136 file `js/` theo đúng thứ tự FILES, chạy chung MỘT scope như bộ nạp cũ, kèm chess.js (`js/vendor/`).
  Rút gọn an toàn: bỏ khoảng trắng/chú thích, **không đổi tên biến** (các file gán lại hàm của nhau theo tên).
  `js/ext/v32-phone-ui.js`, `js/ext/v46/minimap.js` giữ nguyên văn vì `v55s-sea.js` đọc mã nguồn `mapDraw` bằng `toString()`.
- `school/dist/books.<hash>.json`, `school/dist/piano.<hash>.json` — dữ liệu lớn, tải lười.
- `school/index.html` — cập nhật khối `<!--v61l-build-->…<!--/v61l-build-->` (tên bundle, chữ ký FILES).
- `school/sw.js` — service worker phiên bản mới (từ `sw.template.js`).

Build tự kiểm tra: `const/let` trùng tên giữa các file (báo lỗi, dừng), cú pháp bản gói.

## Khi nào phải build lại
Mỗi lần sửa bất kỳ file trong `js/` hoặc danh sách FILES, **trước khi đưa lên web**. Quên build:
- đổi danh sách FILES → web tự tải từng file (chậm nhưng đúng) và in cảnh báo `v61l:` trong console;
- chỉ sửa nội dung file → web vẫn chạy bản gói CŨ. Vì vậy luôn build rồi mới copy lên repo web.

## Đưa lên web (repo RubikSchool2D)
Copy cả `index.html`, `sw.js`, `dist/` (và `js/` để dự phòng). Header cache đề xuất: `NETLIFY_HEADERS.md`.

## Công cụ đo
- `node serve.js <thư-mục> [cổng]` — máy chủ thử giống Netlify (brotli, ETag/304, `max-age=0, must-revalidate`).
- `node perf.js <url> [nhãn] [w] [h]` — 4G giả lập (150 ms, 1,5 MB/s) + CPU ×4; in số yêu cầu, MB, thời điểm màn chờ / đăng nhập / chơi được, lần mở 1 và 2.
  Dùng địa chỉ `http://127.0.0.2:<cổng>/` để chạy như web thật (bản gói + service worker); `localhost` là chế độ dev (từng file).
- `node linemap.js <dòng>` — đổi số dòng trong `rubik-school-game.js` (chế độ từng file) về file nguồn.

## v74l — mở nhanh hơn + bộ nhớ gọn
- **Tách hàm lạnh**: `v74l-cold.json` liệt kê ~1 300 hàm không được gọi lúc mở game / đi khắp đảo (đo bằng `v74l-cover.js`).
  build.js chỉ giữ "vỏ" cùng tên trong bản gói (`function f(){return __v74lZ(id).apply(this,arguments)}`), thân hàm nằm ở
  `dist/lazy.<hash>.json` — tải ngay khi bản gói bắt đầu chạy, dịch bằng eval trực tiếp trong scope chung ở lần gọi đầu
  (thấy mọi tên như cũ, `this`/`arguments` giữ nguyên). Bản gói ~915 → ~525 KB brotli. Hàm mới thêm sau lần đo luôn nằm trong
  bản gói (an toàn). Muốn đo lại: `node serve.js ../.. 8762` rồi `node v74l-cover.js http://localhost:8762/index.html` (~5 phút).
  Cần acorn: có sẵn bên trong Node (build.js tự chạy lại với `--expose-internals`); thiếu thì bỏ qua bước này.
- **Danh mục sách** (`BOOKS`, `PICBOOKS` ~570 KB) → `dist/cat.<hash>.json`, nạp lúc rảnh sau màn đăng nhập (js/ext/v74l-load.js).
- **Bảng băm ảnh/css** `dist/assets.<hash>.json` → service worker: ảnh không đổi thì không hỏi lại máy chủ; trang chính + css lấy từ
  cache rồi hỏi lại ở nền (ETag), đổi thì báo trang (còn ở màn chờ → tự tải lại).
- **Ảnh**: `python3 v74l-png.py ../../assets` nén lại PNG không mất chất lượng (kiểm tra từng điểm ảnh RGBA), −65% dung lượng.
- Đo: `NET=fast3g|4g CPU=4 node v74l-perf.js <url>` (tốc độ mở, lần 1 + lần 2) · `node v74l-mem.js <url> [phút] [zones|play]` (heap + canvas).
