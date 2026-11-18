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
