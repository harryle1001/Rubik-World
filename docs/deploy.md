# Đưa Trường Rubik lên mạng cho cả trường

Chỉ cần **tạo tài khoản và bấm**. Không phải gõ lệnh, không cần khoá API.
Server đã có sẵn: HTTPS + WebSocket, nén Brotli/Gzip, cache file tĩnh, giới hạn tốc độ, mật khẩu băm scrypt,
lưu dữ liệu bền (Postgres hoặc SQLite).

---

## Cách 1 — Render.com (khuyên dùng, dễ nhất)

1. Vào <https://render.com> → **Get Started** → đăng nhập bằng **GitHub**.
2. Cho Render quyền đọc repo `rubik-world` khi được hỏi.
3. Bấm **New +** → **Blueprint** → chọn repo `rubik-world`, nhánh `main` (hoặc nhánh có code mới nhất).
4. Render đọc file `render.yaml` và hiện 2 thứ sẽ tạo:
   - `truong-rubik` (server game)
   - `truong-rubik-db` (cơ sở dữ liệu Postgres)
   → Bấm **Apply**. Đợi 3–5 phút đến khi trạng thái là **Live**.
5. Mở link dạng `https://truong-rubik.onrender.com` → game chạy. Đảo 3D: thêm `/ocean.html`.
6. Lấy các mã bí mật: vào service `truong-rubik` → tab **Environment**:
   - `ADMIN_KEY` — **mã chủ game** (bật công cụ kiểm duyệt trong game, mục 👥 → 🛡️ Chủ game). Giữ kín.
   - `TEACHER_CODE` — **mã giáo viên**: chỉ đưa cho thầy cô để tạo tài khoản ở `/teacher`.

### Lưu ý gói miễn phí của Render
| Việc | Miễn phí | Nên dùng khi cả trường chơi |
|---|---|---|
| Server | "ngủ" sau 15 phút không ai vào, lần đầu mở chậm ~50 giây | gói **Starter** (~7 USD/tháng): luôn thức |
| Postgres | **hết hạn sau 30 ngày** (bị xoá dữ liệu) | gói **Basic** (~6 USD/tháng) |

Đổi gói: vào từng service → **Settings** → **Instance Type** / **Plan** → chọn gói → **Save**.
Muốn Postgres miễn phí lâu dài: tạo DB ở <https://neon.tech> (miễn phí), copy chuỗi `postgresql://…`,
dán vào biến `DATABASE_URL` của service `truong-rubik` (tab Environment → Edit → Save, server tự khởi động lại).

### Tên miền riêng (tuỳ chọn)
Service → **Settings** → **Custom Domains** → **Add** → nhập `game.tentruong.edu.vn` → làm theo hướng dẫn thêm bản ghi CNAME ở nơi mua tên miền. HTTPS tự cấp.

---

## Cách 2 — Railway.app

1. Vào <https://railway.app> → đăng nhập bằng GitHub.
2. **New Project** → **Deploy from GitHub repo** → chọn `rubik-world`. Railway tự thấy `Dockerfile`.
3. Bấm vào service → **Variables** → **New Variable**, thêm:
   - `ADMIN_KEY` = một chuỗi bí mật bạn tự nghĩ (8+ ký tự)
   - `TEACHER_CODE` = mã cho giáo viên
4. Lưu dữ liệu bền — chọn **một** trong hai:
   - **Volume (SQLite):** chuột phải service → **Attach Volume** → Mount path: `/data`.
   - **Postgres:** trong project bấm **+ New** → **Database** → **PostgreSQL**; rồi ở service game thêm biến `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`.
5. **Settings** → **Networking** → **Generate Domain** → có link `https://…up.railway.app`.

---

## Cách 3 — Fly.io (có sẵn `fly.toml`, máy chủ ở Singapore)

Fly cần cài công cụ `flyctl` (gõ vài lệnh) — chỉ dùng nếu đã quen:
```
fly launch --copy-config --no-deploy
fly volumes create rubik_data --size 1 --region sin
fly secrets set ADMIN_KEY=ma-bi-mat TEACHER_CODE=ma-giao-vien
fly deploy
```

---

## Sau khi lên mạng: việc của chủ game

1. **Thử ngay:** mở link trên 2 điện thoại → tạo 2 tài khoản → mục **👥** → nhập **mã bạn bè** của nhau → đồng ý → thử 😊 biểu cảm, câu nói mẫu, "Mời vào nhóm".
2. **Giáo viên:** mở `https://<link>/teacher` → **Tạo tài khoản giáo viên** (cần `TEACHER_CODE`) → **Tạo lớp** → đọc **mã lớp 6 ký tự** cho học sinh. Học sinh vào game → 👥 → **Lớp** → nhập mã.
3. **Phụ huynh:** mở `https://<link>/teacher` → tab **Phụ huynh** → đăng nhập bằng tài khoản của con → đặt số phút chơi mỗi ngày + mã PIN phụ huynh.
4. **Kiểm duyệt:** trong game → 👥 → **🛡️ Chủ game** → nhập `ADMIN_KEY` → xem báo cáo, tàng hình, đưa người chơi về cổng, khoá tài khoản.
5. **Sự kiện:** tự chạy theo lịch — **Thứ Bảy**: săn kho báu (vòng mới mỗi 30 phút); **Chủ nhật**: giải bay chổi. Chủ game có thể bật thử bất kỳ lúc nào ở mục 🛡️.

## An toàn trẻ em (đã làm sẵn)
- **Không chat tự do:** chỉ 8 biểu cảm + 13 câu nói có sẵn; server chỉ nhận *số thứ tự* câu nói.
- **Không thu thông tin cá nhân:** không email, không số điện thoại, không ngày sinh. Tên đăng nhập bị lọc từ xấu và dãy số dài.
- Kết bạn phải **cả hai đồng ý** (mã 6 ký tự). Lời mời chỉ từ bạn bè/cùng nhóm.
- **Chặn** (hai bên không thấy nhau nữa) và **báo cáo** gửi về chủ game.
- Phụ huynh đặt **giới hạn giờ chơi/ngày** và có thể **xoá tài khoản** của con (trang /teacher → Phụ huynh).
- Mật khẩu băm **scrypt** + muối riêng; phiên đăng nhập bằng token ngẫu nhiên (server chỉ lưu bản băm), hết hạn sau 60 ngày.

## Biến môi trường
| Biến | Ý nghĩa |
|---|---|
| `ADMIN_KEY` | Mã chủ game (bắt buộc đặt khi chạy thật) |
| `TEACHER_CODE` | Mã tạo tài khoản giáo viên (bỏ trống = ai cũng tạo được — không nên) |
| `DATABASE_URL` | Postgres; bỏ trống → SQLite trong `DATA_DIR` |
| `DATA_DIR` | Thư mục dữ liệu (mặc định `./data`; Docker: `/data`) |
| `FORCE_HTTPS` | `1` = chuyển http → https |
| `PUBLIC_ORIGIN` | Tên miền được phép kết nối Socket.io từ nơi khác (app Capacitor đã được phép sẵn) |
| `EVENT_ALWAYS` | Chỉ để thử: `1` = luôn có săn kho báu, `race` = luôn có giải bay chổi |

## Gói Phụ huynh & thanh toán
- Trang phụ huynh: `/parent` · chủ game: `/admin` (nhập `ADMIN_KEY`) · văn bản: `/privacy`, `/terms` (đọc từ `docs/privacy-policy.md`, `docs/terms.md`).
- Khoá cổng thanh toán, giá gói, SMTP: xem **docs/payments.md**. Chưa đặt khoá → chế độ giả lập (an toàn để thử).
- Kiểm thử trọn luồng: `node tools/parent-flow-test.mjs` (server chạy ở cổng 3311, `ADMIN_KEY=TESTKEY`).
