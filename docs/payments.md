# Thanh toán Gói Phụ huynh — hướng dẫn cho chủ game

Code đã tích hợp sẵn MoMo, ZaloPay, VNPay và chuyển khoản VietQR (`server/pay-gateways.js`, `server/billing.js`).
**Chưa có khoá thì mọi cổng chạy CHẾ ĐỘ GIẢ LẬP** (trang `/pay/sim/...`, không trừ tiền thật) để thử toàn luồng.
Có khoá → tự chuyển sang **sandbox** của cổng; thêm `PAY_ENV=production` → tiền thật.

## 1. Việc cần làm trước (giấy tờ chung)
Các cổng chỉ ký hợp đồng với **doanh nghiệp hoặc hộ kinh doanh** có tài khoản ngân hàng cùng tên:
- Giấy chứng nhận đăng ký doanh nghiệp / hộ kinh doanh (ngành nghề có "xuất bản phần mềm" hoặc "cung cấp dịch vụ trực tuyến", "giáo dục").
- CCCD người đại diện pháp luật; tài khoản ngân hàng đứng tên doanh nghiệp/hộ.
- Website đang chạy (tên miền riêng, HTTPS) có: mô tả dịch vụ + bảng giá (trang `/parent`), **Chính sách bảo mật** (`/privacy`), **Điều khoản** gồm chính sách hoàn tiền (`/terms`), thông tin liên hệ.
- Thông báo website TMĐT với Bộ Công Thương (online.gov.vn) — các cổng thường yêu cầu trước khi lên production.
- Game có người chơi trực tuyến: tìm hiểu thêm quy định về trò chơi điện tử G1–G4 (NĐ 147/2024) — nếu xếp là "phần mềm giáo dục" thì thủ tục đơn giản hơn; nên hỏi luật sư.

## 2. MoMo (ví MoMo, QR, thẻ ATM/Visa qua `payWithMethod`)
1. Đăng ký: https://business.momo.vn → "Cổng thanh toán" → nộp hồ sơ. Môi trường test có ngay ở https://developers.momo.vn.
2. Lấy khoá tại **M4B → Thông tin tích hợp**: `Partner Code`, `Access Key`, `Secret Key`.
3. Biến môi trường: `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY` (tuỳ chọn `MOMO_REQUEST_TYPE=captureWallet` nếu chỉ muốn ví).
4. IPN: `https://<tên-miền>/pay/ipn/momo` (code tự gửi ipnUrl trong mỗi đơn, không cần khai riêng).

## 3. ZaloPay
1. Đăng ký: https://zalopay.vn/doanh-nghiep → "Cổng thanh toán". Tài liệu: https://docs.zalopay.vn.
2. Lấy tại **Merchant Portal → Thông tin ứng dụng**: `AppID`, `Key1`, `Key2`.
3. Biến môi trường: `ZALOPAY_APP_ID`, `ZALOPAY_KEY1`, `ZALOPAY_KEY2`.
4. Callback: `https://<tên-miền>/pay/ipn/zalopay` (gửi kèm đơn).

## 4. VNPay (QR ngân hàng, thẻ ATM nội địa, Visa/Master)
1. Đăng ký: https://vnpay.vn → "Cổng thanh toán VNPAY" (hoặc qua ngân hàng đối tác). Sandbox: https://sandbox.vnpayment.vn/devreg.
2. VNPay gửi email: `vnp_TmnCode`, `vnp_HashSecret`.
3. Biến môi trường: `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`.
4. **Bắt buộc** gửi VNPay cấu hình IPN URL: `https://<tên-miền>/pay/ipn/vnpay` (VNPay không đọc từ đơn).

## 5. Chuyển khoản VietQR (không cần hợp đồng, đối soát tay)
- Biến môi trường: `VIETQR_BANK_BIN` (mã BIN ngân hàng, VD Vietcombank 970436, Techcombank 970407, MB 970422, ACB 970416), `VIETQR_ACCOUNT_NO`, `VIETQR_ACCOUNT_NAME` (KHÔNG DẤU, IN HOA), `VIETQR_BANK_NAME`.
- Phụ huynh quét QR có sẵn số tiền + nội dung `RUBIK XXXXXX`. Mở `/admin` → **Đối soát chuyển khoản**, so sao kê → **Xác nhận** → gói kích hoạt + email biên nhận.

## 6. Biến môi trường khác (Render → service → Environment)
| Biến | Ý nghĩa | Mặc định |
|---|---|---|
| `PUBLIC_URL` | địa chỉ web (dùng cho returnUrl/IPN), VD `https://truongrubik.vn` | lấy từ request |
| `PAY_ENV` | `production` = tiền thật | sandbox |
| `PAY_MODE` | `sim` = ép giả lập dù đã có khoá | — |
| `PRICE_MONTH` / `PRICE_YEAR` / `PRICE_FAMILY` | giá (đồng) | 79000 / 499000 / 799000 |
| `FAMILY_SEATS`, `TRIAL_DAYS` | số con gói gia đình, ngày dùng thử | 4, 7 |
| `FREE_MG`, `FREE_CHAPTERS` | mini game & số chương miễn phí | xem `server/billing.js` |
| `SMTP_URL`, `MAIL_FROM` | gửi email (VD `smtps://user:pass@smtp.gmail.com:465`, Zoho, SendGrid, Brevo…) | hộp thư giả lập trong /admin |
| `ZALO_OA_TOKEN` | Zalo OA (để sẵn chỗ nối) | tắt |
| `ADMIN_KEY` | mã vào `/admin` | Render tự sinh |

Trên Render: **Dashboard → truong-rubik → Environment → Add Environment Variable** → Save (tự deploy lại). Khoá bí mật **không** đưa vào git.

## 7. Thử trước khi bật thật
```bash
DATA_DIR=/tmp/rubik-test PORT=3311 ADMIN_KEY=TESTKEY node server/index.js &
node tools/parent-flow-test.mjs --shots=/tmp/shots     # 46 bước: đăng ký → liên kết → mua → IPN → mở khoá → báo cáo, IPN giả bị từ chối
```
Có khoá sandbox: mua thử bằng thẻ test của từng cổng (trên trang tài liệu của cổng), xem đơn chuyển "Đã thanh toán" ở `/parent` và `/admin`.

## 8. Nguyên tắc (không đổi)
- Không lưu số thẻ; người mua nhập ở trang của cổng. Gói **không tự gia hạn**; nhắc email trước 3 ngày.
- Chỉ IPN có chữ ký hợp lệ (hoặc chủ game xác nhận chuyển khoản) mới kích hoạt gói; trang trả về chỉ hiển thị.
- Trong game không có nút mua/quảng cáo/lootbox; lời mời chỉ dẫn tới trang phụ huynh sau cổng phụ huynh.
