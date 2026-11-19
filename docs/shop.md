# Cửa hàng Rubik World — hướng dẫn cho chủ dự án

Cửa hàng bán **đồ thật cho phụ huynh** (khối Rubik, sách, đồ 4 nhà Tứ Linh, sticker, combo). Mỗi món kèm **thẻ mã quà**; con nhập mã trong game để nhận vật phẩm độc quyền. Trẻ em không mua gì trong game: Tủ kính Rubik ở Phố Phép Thuật chỉ hiện lời nhắn "Nhờ bố mẹ xem cửa hàng" + mã QR.

| Trang | Ai dùng | Ghi chú |
|---|---|---|
| `/shop` | Phụ huynh | Cổng phụ huynh (phép nhân viết bằng chữ) → danh mục → giỏ → đặt hàng |
| `/shop/don.html` | Phụ huynh | Xem lại đơn (lưu trên máy đã đặt, hoặc link trong email) |
| `/shop/chinh-sach.html` | Mọi người | Giao hàng, đổi trả 7 ngày, thanh toán, bảo mật, mã quà, **thông tin người bán** |
| `/admin` | Chủ shop | Đăng nhập bằng `ADMIN_KEY` (cùng mã chủ game) |

## 1. Trước khi bán thật (làm 1 lần)

1. **Điền thông tin người bán** ở mục 7 `client/shop/chinh-sach.html` (tên hộ KD/doanh nghiệp, MST, địa chỉ, hotline, email). Website bán hàng phải **thông báo với Bộ Công Thương** (online.gov.vn) — làm trước khi mở bán.
2. Đặt biến môi trường trên máy chủ (Render: Dashboard › Environment):

| Biến | Ý nghĩa |
|---|---|
| `ADMIN_KEY` | Mã vào `/admin` — đặt chuỗi dài, bí mật |
| `PUBLIC_ORIGIN` | Ví dụ `https://rubikworld.vn` — dùng cho mã QR và link trong email |
| `TRUST_PROXY=1` | Khi chạy sau proxy (Render) để giới hạn dò mã theo đúng IP |
| `SHOP_PAY_MODE` | `mock` = thanh toán giả lập (chỉ để thử) · `off` = tắt online, chỉ COD/chuyển khoản |
| `SHOP_BANK_ID`, `SHOP_BANK_ACC`, `SHOP_BANK_NAME` | Ngân hàng (mã VietQR, vd `VCB`), số TK, tên chủ TK → hiện mã VietQR có sẵn số tiền + nội dung = mã đơn |
| `SHOP_SHIP_FEE`, `SHOP_FREE_SHIP` | Phí giao (mặc định 30000) và mức miễn phí (500000) |
| `RESEND_API_KEY`, `SHOP_MAIL_FROM` | Gửi email xác nhận qua Resend. Không đặt → email ghi vào `data/shop-mail.log` |
| `GHN_TOKEN`, `GHN_SHOP_ID` | (tuỳ chọn) nút "GHN" trong /admin tạo vận đơn tự động |
| `GHTK_TOKEN`, `SHOP_PICK_*` | (tuỳ chọn) như trên cho GHTK; `SHOP_PICK_NAME/TEL/ADDRESS/PROVINCE/DISTRICT` là điểm lấy hàng |

3. **Cổng MoMo / ZaloPay / VNPay**: chưa có nhánh tích hợp sẵn, nên hiện chỉ có provider `mock`. Khi ký hợp đồng cổng, thêm 1 provider trong `PAY_PROVIDERS` (`server/shop.js`): `create(order)` trả `{ url }` tới cổng, thêm route IPN của cổng gọi `markPaid(order, 'momo')`. Khoá bí mật để trong biến môi trường.
4. Dữ liệu nằm ở `data/shop.json` (đơn có thông tin cá nhân — **không commit**, đã có trong `.gitignore`). Sao lưu file này định kỳ. Lưu ý: Render gói free không giữ ổ đĩa giữa các lần deploy → dùng gói có Persistent Disk trước khi bán thật.

## 2. Nhập hàng, đặt giá, tồn kho (`/admin` › Sản phẩm & tồn kho)

- Mỗi dòng là 1 sản phẩm: sửa tên, mô tả, giá (đồng), tồn kho, danh mục, **mã quà kèm theo**, bật/tắt "Bán" rồi bấm 💾.
- Dòng trống cuối bảng để **thêm sản phẩm mới** (mã sản phẩm: chữ thường không dấu, gạch nối, vd `rubik-5x5`).
- **Ảnh**: ảnh hiện tại là hình minh hoạ SVG tạm. Chụp ảnh thật (vuông 1:1, ≥ 800 px, nền sáng), bỏ vào `client/shop/img/` (vd `rubik-3x3.jpg`) hoặc dùng link `https://…`, rồi sửa ô ảnh.
- Tồn kho **tự trừ khi khách đặt**, tự cộng lại khi đơn chuyển sang "Đã huỷ". Hết hàng → nút "Thêm vào giỏ" tự khoá.
- Giá đề xuất ban đầu ở `server/shop-data.js` chỉ dùng cho lần chạy đầu (khi chưa có `data/shop.json`).

## 3. Mã quà (`/admin` › Mã đổi quà)

1. Chọn vật phẩm (Áo choàng Hoàng Kim · Nai Sao · Chổi Cầu Vồng · Khối Rubik Vàng) + số mã + ghi chú lô → **Tạo mã**.
2. **Tải ngay file CSV** — đây là lần duy nhất thấy mã gốc (server chỉ giữ bản băm SHA-256, lộ dữ liệu cũng không lộ mã).
3. In mã lên thẻ/hộp (mỗi sản phẩm 1 mã, dạng `XXXX-XXXX-XXXX`, không có chữ O/I/số 0/1 để khỏi nhầm). Giữ file CSV kín như tiền mặt.
4. Bảng lô cho biết mỗi lô đã dùng bao nhiêu mã. Khách báo mã lỗi/đã dùng → tạo 1 mã mới gửi lại.

Chống dò mã: 12 ký tự ngẫu nhiên (≈ 10¹⁸ khả năng), mỗi IP chỉ được sai 8 lần/giờ, toàn hệ thống tối đa 144 lần sai/phút; mỗi mã dùng 1 lần.

Trong game: Phố Phép Thuật › chân tháp phụ › **Tủ kính Rubik** › ô "Có thẻ mã quà trong hộp?". Vật phẩm nhận được không bán bằng xu; sau khi nhận có thể bật/tắt ở tiệm Áo Choàng, Tiệm Thú Cưng, Xưởng Chổi; Khối Rubik Vàng là màu thứ 7 của khối Rubik trong **Dựng Lên!** ở nhà mình.

## 4. Xử lý đơn hằng ngày (`/admin` › Đơn hàng)

1. Đơn mới: trạng thái **Mới đặt**. Gọi/nhắn khách xác nhận (đặc biệt đơn COD).
2. Chuyển khoản: đối chiếu nội dung = mã đơn → bấm **Đánh dấu đã trả** (khách nhận email). Online: tự chuyển **Đã thanh toán**.
3. Đóng gói: nhớ bỏ **thẻ mã quà** đúng loại vào hộp.
4. Giao hàng — 2 cách:
   - Bấm **⬇ CSV cho GHN / GHTK** (đơn Mới đặt + Đã thanh toán) rồi tải lên trang tạo đơn hàng loạt của hãng (cột có thể cần khớp lại theo mẫu Excel mới nhất của hãng). Nhập mã vận đơn vào ô "mã vận đơn".
   - Hoặc (đã cấu hình khoá) bấm nút **GHN/GHTK** trên dòng đơn → tự tạo vận đơn, điền mã, chuyển "Đang giao", gửi email.
5. Giao xong → **Đã giao**. Huỷ đơn → **Đã huỷ** (tồn kho tự cộng lại; đơn đã trả tiền thì hoàn tiền theo chính sách).

## 5. Thử toàn bộ luồng trên máy

```bash
ADMIN_KEY=TESTKEY SHOP_PAY_MODE=mock node server/index.js &
node tools/shop-test.mjs shots            # đặt hàng → thanh toán giả lập → đơn trong /admin → nhập mã trong game
node tools/shop-test.mjs shots --mobile
```
Ảnh mẫu: `docs/shots/shop/`.
