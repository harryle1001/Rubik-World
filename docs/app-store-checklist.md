# Phát hành app Đảo Rubik (iOS/Android) — checklist

App được bọc bằng **Capacitor 8**. Mọi file game (three.js, model, âm thanh) nằm sẵn trong app nên chơi được khi không có mạng. Có mạng thì tự nối multiplayer tới server.

## 1. Build
```bash
npm install
ISLAND_SERVER=https://<server-cua-ban> npm run app:build   # đóng gói vào www/ + cap sync
npm run app:android    # mở Android Studio (cần Android SDK)
npm run app:ios        # mở Xcode (cần máy Mac)
```
- Nếu không đặt `ISLAND_SERVER`, app dùng `https://truong-rubik.onrender.com` (tên dịch vụ trong `render.yaml`). **Hãy kiểm tra lại địa chỉ này trước khi build.**
- Server đã cho phép (CORS) `capacitor://localhost` (iOS) và `https://localhost` (Android). Muốn thêm tên miền khác: đặt biến môi trường `PUBLIC_ORIGIN`.
- App ID: `vn.truongrubik.island` (sửa trong `capacitor.config.json` **trước** lần nộp đầu tiên; sau đó không đổi được).
- Icon, màn hình chờ: dùng `npx @capacitor/assets generate` với ảnh gốc 1024×1024 đặt trong `assets/`.

## 2. Apple App Store — Kids Category
- [ ] Đăng ký Apple Developer (99 USD/năm), tạo app trên App Store Connect, chọn **Kids Category** và độ tuổi (5 và dưới / 6–8 / 9–11).
- [ ] **Không** có quảng cáo của bên thứ ba, **không** dùng SDK phân tích hay theo dõi bên thứ ba (Guideline 1.3, 5.1.4). Hiện app không có cái nào; giữ nguyên như vậy.
- [ ] **Cổng phụ huynh (parental gate)** trước mọi link ra ngoài app, mua hàng hoặc xin quyền. Hiện đảo không có link ngoài; nếu thêm nút về website, phải chặn bằng câu đố dành cho người lớn (ví dụ: "Nhập số: bảy mươi hai").
- [ ] Không có mua hàng trong app (IAP). Nếu thêm sau này thì phải đặt sau cổng phụ huynh.
- [ ] **Chính sách quyền riêng tư** có URL công khai, điền vào App Store Connect (bản nháp ở `docs/privacy-policy.md`).
- [ ] App Privacy ("nhãn dinh dưỡng"): khai **Không thu thập dữ liệu gắn với danh tính**. Biệt danh ngẫu nhiên và vị trí trong game chỉ gửi lên server khi đang chơi, không lưu lại.
- [ ] Không dùng Sign in with Apple hay đăng nhập: không bắt trẻ nhập email hay tên thật.
- [ ] Ảnh chụp màn hình cho iPhone 6.7" và 6.5", iPad 12.9" (nếu hỗ trợ iPad). Video giới thiệu (tuỳ chọn).
- [ ] Mô tả app nói rõ nội dung học tập (Toán, Khoa học), không có chat.
- [ ] Kiểm thử bằng TestFlight trên máy thật (iPhone đời cũ: kiểm tra FPS; game tự giảm chất lượng).

## 3. Google Play — Families Policy
- [ ] Đăng ký Play Console (25 USD một lần), điền **Target audience and content**: chọn nhóm tuổi trẻ em, tham gia chương trình **Designed for Families**.
- [ ] Data safety form: khai giống phần App Privacy của Apple.
- [ ] Tuân thủ Families Policy: không có SDK quảng cáo hay phân tích chưa được chứng nhận, không thu thập mã định danh thiết bị (AAID).
- [ ] Build `.aab` đã ký (Android Studio: Build → Generate Signed Bundle), `targetSdkVersion` theo yêu cầu mới nhất của Play.

## 4. Kiểm duyệt chat và tương tác giữa người chơi
- [x] **Đảo 3D hiện không có chat.** Người chơi chỉ thấy nhau di chuyển và thấy biệt danh. Đây là cách an toàn nhất cho Kids Category.
- [ ] Biệt danh: hiện là "Bạn nhỏ + số" ngẫu nhiên. Nếu cho trẻ tự đặt tên thì phải: lọc từ cấm (tiếng Việt và tiếng Anh), giới hạn 18 ký tự, không cho nhập số điện thoại hay địa chỉ. Tốt nhất là chọn tên ghép từ danh sách có sẵn.
- [ ] Game 2D lưu trữ (`client/world-2d.html`, không còn liên kết) **có chat tự do**, nên **không đưa vào app trẻ em** khi chưa có các biện pháp sau:
  - chỉ dùng câu chat soạn sẵn ("Chào bạn!", "Cùng giải đố nhé!"), hoặc
  - bộ lọc từ cấm ở server, nút báo cáo và chặn, giới hạn tần suất (server đã giới hạn), lưu nhật ký để người lớn xem lại, và
  - có người kiểm duyệt cùng quy trình xử lý báo cáo trong 24 giờ.
- [ ] Server: giới hạn tần suất gửi (đã có, 20 lần/giây cho vị trí), làm sạch dữ liệu đầu vào (đã có `clean()`), dùng HTTPS/WSS.

## 5. Trước khi nộp
- [ ] Chạy thử trên ít nhất 1 iPhone, 1 iPad và 1 máy Android tầm trung.
- [ ] Bật chế độ máy bay: đảo vẫn chơi được, hiện "⚪ Chơi một mình".
- [ ] Kiểm tra âm thanh chỉ bật sau lần chạm đầu tiên và có nút tắt.
- [ ] Hoàn tất điều khoản pháp lý: chính sách quyền riêng tư, thông tin liên hệ của nhà phát triển, và đồng ý của phụ huynh nếu sau này có tính năng thu thập dữ liệu.
