# Đề xuất header cache cho repo web (harryle1001/RubikSchool2D) — v61l

Thêm vào `netlify.toml` của repo web (đường dẫn tính từ thư mục được publish; nếu game nằm trong thư mục con thì thêm tiền tố):

```toml
# file có hash trong tên: nội dung không bao giờ đổi → cache 1 năm, không hỏi lại máy chủ
[[headers]]
  for = "/dist/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/js/vendor/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# trang chính và service worker: luôn hỏi lại (304 nếu không đổi) → bản mới có hiệu lực ngay
[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"
```

Ghi chú
- Netlify mặc định đã nén brotli/gzip và dùng HTTP/2; không cần bật thêm.
- `js/**` (đường dự phòng tải từng file) giữ mặc định `max-age=0, must-revalidate` — KHÔNG đặt immutable vì tên file không có hash.
- Kể cả khi chưa sửa `netlify.toml`, service worker (`sw.js`) đã tự cache `dist/*.<hash>.*`, `js/vendor/`, three.js r128 nên lần mở lại không tải lại bundle.
- Cơ chế cập nhật: build mới → hash mới → `index.html` trỏ tên mới → tải bản mới; `sw.js` mới xoá cache phiên bản cũ.
- Mỗi lần deploy: chạy `school/tools/build/node build.js` trước, rồi copy `index.html`, `sw.js`, `dist/`, `js/` sang repo web.
