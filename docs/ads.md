# Thu nhập phụ từ phụ huynh — quảng cáo & liên kết giới thiệu

Nguyên tắc: **không làm phiền trẻ.** Quảng cáo và liên kết giới thiệu chỉ ở trang dành cho người lớn:

| Trang | Quảng cáo | Gợi ý cho con (affiliate) |
|---|---|---|
| `/`, `/play`, `/ocean.html` (game) | ❌ không bao giờ | ❌ |
| `/gioi-thieu` | 1 khung (cuối trang) | — |
| `/blog`, `/blog/<bài>` | danh sách 1 · trong bài tối đa 2 (sau đoạn 5 nếu bài dài + cuối bài) | khi tag bài trùng tên môn |
| `/parent` | 1 khung cuối trang, **ẩn nếu đã mua gói** | theo môn con yếu |
| Email tóm tắt tuần | ❌ | theo môn con yếu (cần `PUBLIC_URL`) |

Kiểm tra game sạch quảng cáo: `sh tools/check-no-ads.sh`.

## 1. Google AdSense (mặc định TẮT)
1. Cần tên miền riêng (VD `daorubik.vn`) và đã có nội dung: trang `/gioi-thieu` + vài bài `/blog`. Đặt `PUBLIC_URL=https://daorubik.vn`.
2. Đăng ký tại adsense.google.com bằng tài khoản Google của chủ dự án (người lớn, ≥ 18 tuổi), thêm trang web `daorubik.vn`.
3. Lấy mã nhà xuất bản dạng `ca-pub-1234567890123456` → đặt biến môi trường **`ADSENSE_CLIENT`** trên Render (tab Environment). Server tự:
   - chèn khung quảng cáo có nhãn “Quảng cáo”, chỉ nạp script **sau khi người lớn bấm “Đồng ý quảng cáo”**, luôn **không cá nhân hoá**;
   - phục vụ `/ads.txt` (`google.com, pub-…, DIRECT, f08c47fec0942fa0`).
4. (Tuỳ chọn) Tạo đơn vị quảng cáo hiển thị “Responsive” → đặt **`ADSENSE_SLOT`** = số data-ad-slot. Không đặt thì dùng Auto ads cho khung đó.
5. Trong AdSense → Quyền riêng tư & nhắn tin: có thể bật thông báo đồng ý của Google cho khách EU; ở Việt Nam hộp đồng ý của trang (Nghị định 13/2023) đã đủ.
6. Cài đặt nội dung → **chặn danh mục nhạy cảm** (hẹn hò, cờ bạc, rượu bia, thuốc lá, chính trị…). Trang hướng tới phụ huynh nhưng nói về trẻ em, nên chặn càng chặt càng tốt.
7. Tắt quảng cáo: xoá `ADSENSE_CLIENT` rồi deploy lại.

Mạng khác (Adtima, Eclick…): thay thẻ trong `adSlot()` ở `server/site.js` và URL script trong `client/site/site.js`; giữ nguyên cơ chế đồng ý.

## 2. Liên kết giới thiệu (affiliate)
Danh sách “Gợi ý cho con” quản lý ở **/admin → 🎁 Gợi ý cho con**: môn, tên sản phẩm, cửa hàng, link sản phẩm gốc. Bật/tắt, xem lượt bấm. Link luôn đi qua `/go/<id>` (đếm lượt, không ghi người bấm) rồi chuyển sang link affiliate.

Mã affiliate đặt bằng biến môi trường — **mẫu link có `{url}`** (link gốc được mã hoá thay vào):

| Biến | Ví dụ |
|---|---|
| `AFF_SHOPEE` | `https://s.shopee.vn/an_redir?origin_link={url}&affiliate_id=<ID>&sub_id=rubik` |
| `AFF_TIKI` | `https://go.isclix.com/deep_link/<PUBLISHER_ID>/<CAMPAIGN_ID>?url={url}` (qua Accesstrade) |
| `AFF_FAHASA` | `https://go.isclix.com/deep_link/<PUBLISHER_ID>/<CAMPAIGN_ID>?url={url}` (qua Accesstrade) |

Chưa đặt biến → link gốc (vẫn chạy, chưa tính hoa hồng). /admin hiện cửa hàng nào đã gắn mã.

### Đăng ký
- **Shopee Affiliate**: affiliate.shopee.vn → đăng ký cá nhân (CCCD, tài khoản ngân hàng, kênh: website). Duyệt xong lấy Affiliate ID; có thể dùng công cụ “Custom link” để kiểm tra mẫu link.
- **Accesstrade** (Tiki, Fahasa và nhiều sàn khác): pub.accesstrade.vn → đăng ký publisher, khai báo website, tham gia chiến dịch Tiki/Fahasa → mục **Deep link** lấy mẫu `go.isclix.com/deep_link/...` và thay phần url bằng `{url}`.
- **Tiki/Fahasa** chương trình riêng (nếu có) cũng dùng được — chỉ cần mẫu link có `{url}`.
- Hoa hồng phải kê khai thuế thu nhập cá nhân; giữ sao kê từ các nền tảng.

### Quy tắc nội dung
- Luôn ghi “Liên kết giới thiệu” (đã có sẵn), dùng `rel="sponsored nofollow"`.
- Chỉ gợi ý sách/đồ học tập phù hợp lứa tuổi; không đồ chơi may rủi, không đồ ăn vặt, không sản phẩm cho người lớn.
- Không bao giờ hiện trong game hay gửi cho tài khoản trẻ.

## 3. Biến môi trường tóm tắt
`ADSENSE_CLIENT`, `ADSENSE_SLOT`, `AFF_SHOPEE`, `AFF_TIKI`, `AFF_FAHASA`, `PUBLIC_URL` (bắt buộc cho link trong email), `CONTACT_EMAIL` (nút “Liên hệ giấy phép trường” ở /gioi-thieu).
