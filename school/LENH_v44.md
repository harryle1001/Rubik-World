# LỆNH NÂNG CẤP v44: Trường Rubik của Hà Quân (bản 2D)

Áp dụng cho **bản 2D**: thư mục `school/` và web haquanrubikschool.netlify.app. Không đụng bản 3D.
Mỗi SESSION là một phiên làm việc riêng: dán đúng phần session đó cùng phần **QUY TẮC CHUNG** vào phiên mới.

---

## QUY TẮC CHUNG (dán kèm mọi session)

- **Sửa nhỏ, đúng chỗ.**
  - Không xoá tính năng, mini game hay dữ liệu cũ.
  - Giữ nguyên các khoá lưu: tài khoản, tiền, level, nhà, cài đặt.
- **Code mới** đặt trong file EXT riêng: `js/ext/v44-*.js`, đăng ký vào danh sách FILES trong `index.html`, gọi init trong `js/main.js`.
- **Tiết kiệm token:**
  - Không đọc cả file lớn; tìm theo tên hàm (grep).
  - Không in code dài vào chat.
  - Ảnh và âm thanh lấy từ nguồn miễn phí CC0 (Kenney, OpenGameArt CC0, Pixabay…), ghi vào `assets/CREDITS.txt`.
- **Phong cách game:** indie, chill, vừa học vừa chơi.
  - Nhịp chậm rãi, nhẹ nhàng, không vội.
  - Nhạc và tiếng thiên nhiên êm dịu.
- **Bố cục:** dùng tỷ lệ vàng (1 : 1.618) khi chia khu, đặt kiến trúc và chia khung giao diện.
- **Chữ dễ đọc cho người cận:**
  - Font Nunito hoặc Be Vietnam Pro, đậm 700, cỡ tối thiểu 16px trên điện thoại.
  - Tương phản cao; không dùng font pixel cho đoạn chữ dài (font pixel chỉ dùng cho tiêu đề ngắn).
  - Mỗi câu ngắn, kèm icon. Chữ dài thì gấp lại, bấm "Xem thêm" mới mở.
- **Điện thoại chỉ dùng cảm ứng:** không có phím A/B, không D-pad.
- **Kiểm tra trước khi giao:**
  - Thử ở 3 cỡ màn hình: 390×844, 844×390, 1440×900.
  - Không có lỗi trong console.
  - Đo FPS trước và sau mỗi thay đổi về hình vẽ.
- **Quy trình duyệt:**
  - Làm xong mỗi phần thì gửi ảnh chụp trước/sau, khoanh đỏ chỗ đã sửa, kèm danh sách thay đổi ngắn bằng tiếng Việt.
  - **Chờ chủ game duyệt** rồi mới xuất file và up lên Netlify.
  - Commit vào GitHub, không ghi tên model trong commit.

---

## SESSION 1: Mini game toàn màn hình (chung cho mọi mini game)

Ảnh tham chiếu: game Bay khinh khí cầu.

- Mọi mini game tràn viền, phủ hết màn hình.
- **Thanh trên cùng**, mỏng và trong suốt, chỉ có 4 thứ:
  - bên trái: nút chọn chế độ dạng icon (ví dụ ☀️ Bay ngày / 🌇 Bay hoàng hôn);
  - ở giữa: số liệu chính của game (ví dụ "Quãng đường · ★ · Gas");
  - bên phải: nút **?** (bấm mới hiện hướng dẫn) và nút **✕** (thoát).
- **Bỏ:**
  - các nút và chữ hướng dẫn bên dưới khung game;
  - lời hướng dẫn tự bật lên khi vào game;
  - nút "Tạm dừng" dạng chữ (thay bằng icon ⏸ trên thanh trên cùng);
  - khung avatar ở góc dưới.
- **Màn kết thúc:** hiện kết quả ngay trên khung game, kèm nút **"Play again"** bằng tiếng Anh. Nút này chỉ xuất hiện khi game kết thúc.
- Nền, màu và font **đồng bộ** giữa tất cả mini game.
- **Khinh khí cầu:** bay chậm, từ từ, mượt và chill hơn. Giảm trọng lực và tốc độ cuộn, thêm quán tính.

## SESSION 2: Menu, HUD và cách di chuyển

- **Lỗi menu bị che (hình 1):** sửa thanh menu bị che mất.
- **Bỏ nút Coach** (icon mũ tốt nghiệp) ở góc trái. Muốn chat thì bấm vào nhân vật Coach Ru trong game.
- **Bỏ nút Boat và Fly** ở cột phải:
  - Chỉ được bay khinh khí cầu khi tới **Khu khinh khí cầu**: một bãi tròn, các khinh khí cầu xếp thành vòng.
  - Muốn đi thuyền thì ra bến.
- **Di chuyển chỉ bằng kéo (joystick):**
  - Bỏ hẳn chế độ chạm vào đâu thì nhân vật đi tới đó.
  - Sửa lỗi tự chạm làm nhân vật đứng im (hình 6).
- **Xe đạp:**
  - Không cho chạy xuống nước (hình 7).
  - Hết lag khi đi gần bờ biển.
- **Đường đi (hình 8):**
  - Mọi con đường đều đi qua được; chỉ chặn ở nhà, cây và tường công trình.
  - **Bỏ hết hàng rào.**
  - Thiết kế lại lối đi mở, thông thoáng, nối liền thành một mạng thống nhất.
- **Chữ trên bản đồ (hình 3):**
  - Giảm chữ, mỗi bảng tên chỉ còn tên khu kèm icon; tên NPC chỉ hiện khi lại gần.
  - Dùng font dễ đọc theo QUY TẮC CHUNG.
- **Vào thẳng mini game (hình 4 → hình 5):** bấm "Chạm để vào" ở công trình nào thì **mở thẳng mini game đó**, không hiện menu chọn nữa. Ví dụ bảng "Toán nhanh" mở Toán nhanh luôn.
- **Đèn dầu:** thêm nút nhỏ 🏮 để cầm lên hoặc cất đèn dầu.

## SESSION 3: Coach Ru phiên bản mới

- Chỉ còn **khung chat** gọn và chuyên nghiệp, giống ứng dụng AI. Hỏi bất cứ điều gì cũng được.
- **Tính cách:**
  - Thầy giáo nam, giọng trầm, hài hước, hay ghẹo học sinh cho vui.
  - Luôn vui vẻ dù học sinh nói gì; hay hỏi lại để các em suy nghĩ.
  - Tự giới thiệu là "nhà vô địch Olympia số 1", nói vui, không bịa thành tích thật.
- **Giọng nói:**
  - Đọc tiếng Việt bằng TTS của artifact; chọn giọng nam, chỉnh cao độ thấp và tốc độ chậm vừa.
  - Thiết bị không có giọng nam thì dùng giọng sẵn có và báo nhẹ cho người chơi.
- **Câu đố:** Coach Ru đố, ai giải đúng được thưởng tiền nhiều hơn mức thường (vẫn có trần mỗi ngày để giữ cân bằng).
- **Giữ an toàn trẻ em:**
  - Không hỏi thông tin cá nhân, không đóng vai bác sĩ.
  - Gặp chủ đề buồn hay nguy hiểm thì khuyên các em nói với bố mẹ hoặc thầy cô.

## SESSION 4: Nông trại, sở thú, cưỡi thú và trái tim ❤️

- **Sửa nhà nông trại bị lỗi (hình 2).** Vẽ lại một **trang trại thật lớn**:
  - cổng to mở rộng;
  - phía trước là **sở thú** nuôi nhiều loài.
- **Cho thú ăn:** đi tới gần con vật thì hiện nút **"Cho ăn"**. Cho ăn xong được EXP và **trái tim ❤️**.
- **Cưỡi thú:** chạm vào bất kỳ con vật nào để cưỡi; có nút xuống.
- **Trái tim ❤️:**
  - Là đơn vị mới, tích luỹ giống EXP.
  - Dùng để mua **vật phẩm đặc biệt** ở cửa hàng.
  - Kiếm được khi làm việc tốt quanh trường (nhặt rác, tưới cây, giúp NPC) và khi giúp đỡ bạn bè.

## SESSION 5: Ao, câu cá và cờ các nước

- **Ao và câu cá:**
  - Bấm vào **bất kỳ cái ao nào** cũng được câu cá và cho cá ăn.
  - Vẽ lại mini game câu cá sống động, chill, có **nhân vật của mình ngồi câu**.
  - Có nhiều loại cá khác nhau.
- **Cờ các nước:**
  - Trải dài hơn, mỗi lá cờ cách nhau xa hơn.
  - Chạm vào một lá cờ thì được hỏi một câu về nước đó; trả lời đúng được tiền và EXP.
  - Mỗi ngày mỗi người chỉ được hỏi một lần.

## SESSION 6: Thiền, âm nhạc, nghệ thuật

- **Vườn thiền:**
  - Mọi người ngồi thiền yên lặng.
  - Tiếng thiên nhiên nhẹ nhàng, du dương, yên bình.
  - Thay ngôi nhà mái đổ bằng **ngôi đền Phật**.
- **Nhạc nền:** thêm nhiều bản nhạc nhẹ (nhạc CC0 hoặc nhạc tạo bằng code). Mỗi khu một nhạc nền riêng.
- **Khu vẽ tranh:**
  - Mở ra hoà vào thiên nhiên, không bị 4 bức tường bao quanh.
  - Nhiều học sinh đang ngồi vẽ hơn.
- **Khu âm nhạc mở rộng:**
  - Có khu riêng cho piano, violin, kèn trumpet, sáo, saxophone.
  - Có **sân khấu opera**: dàn nhạc giao hưởng học sinh, người chỉ huy vung đũa, khán giả học sinh ngồi nghe.

## SESSION 7: Mini game thể thao và xe tăng

- **Trượt tuyết:**
  - 5 map leo núi, mỗi map một chế độ.
  - Mỗi map có tuyết, địa hình và hình dạng núi khác nhau.
  - Toàn màn hình.
- **Bóng đá:**
  - Đấu 3 đánh 3, sân rộng hơn.
  - Sút được vào khung thành: vuốt để chạy, chạm để chuyền hoặc sút, giữ lâu để sút mạnh.
- **Xe tăng:**
  - Vuốt về hướng nào thì xe tăng đi hướng đó.
  - Map lớn hơn, có chướng ngại vật.
  - Có 5 xe tăng, mỗi chiếc khác hình dáng và màu sắc, thật đẹp.

## SESSION 8: Rubik và cờ vua

- **Mini game Rubik:**
  - Tràn viền như các game khác.
  - Bấm **"Giải giúp"** thì khối Rubik **tự xoay từng bước** ngay trên màn hình, mũi tên chỉ tầng đang xoay; có nút bước tiếp và bước lùi.
  - Lịch sử nước đi lưu và hiện ở dưới.
- **Khu Rubik:**
  - Gộp **Tượng đài Rubik** và **Khu Rubik** thành một.
  - Vẽ lại thành **biểu tượng của trường**: pho tượng khối Rubik lớn trưng trước đại sảnh.
- **Cờ vua:**
  - Vẽ lại bàn cờ vua bị lỗi.
  - Bấm vào Khu cờ vua là chơi cờ vua luôn.

## SESSION 9: Đấu trường online (1 đến 4 người)

- Có mục **"Tất cả game"**: chọn game rồi **tạo phòng**.
- Người khác thấy danh sách phòng và bấm vào để tham gia.
- Đủ người thì **chủ phòng bấm "Bắt đầu"**.
- Game nào cũng chơi được với 1, 2, 3 hoặc 4 người.
- Thiếu người thì máy điền vào chỗ trống.

## SESSION 10: Cửa hàng xe đạp và đồ vật

- Vẽ lại **tất cả mẫu xe đạp** và vật phẩm trong cửa hàng cho đẹp: xe đạp pixel art đẹp, nhiều kiểu.
- Dùng nguồn ảnh miễn phí hoặc tự vẽ bằng code.
- Tiết kiệm chi phí: vẽ một mẫu chuẩn thật đẹp trước, sau đó mới làm các biến thể màu.

## SESSION 11: Bản đồ, bố cục và kiến trúc nhà

- **Bản đồ tròn có thể sắp xếp:**
  - Phóng to cả thế giới.
  - Kéo thả để chia khu và dời công trình bằng chuột hoặc ngón tay, ngay trên màn hình.
  - Bấm **Lưu** thì game tự dời từng chỗ.
  - Có nút **Sao chép bố cục** để gửi Claude, đặt cố định cho mọi người.
- **Kiến trúc nhà:**
  - Làm thật đẹp **một mẫu nhà chuẩn** theo tỷ lệ vàng, sau đó nhân rộng ra các kiểu khác.

## SESSION 12: Lâu đài trường Rubik và phép thuật tốt

- **Lâu đài:**
  - Vẽ khu **Rubik School** thành một **lâu đài trường học cổ tích** (cảm hứng trường phép thuật).
  - Kiến trúc tự thiết kế, không dùng tên, huy hiệu hay hình ảnh có bản quyền của phim hoặc truyện nào.
  - Có tháp, cầu, đại sảnh; tượng Rubik đứng trước đại sảnh.
- **Đũa thần:** học sinh cầm đũa để làm **phép tốt**:
  - nâng đồ vật lên;
  - điều khiển đồ vật lơ lửng;
  - làm hoa nở;
  - thắp đèn;
  - gọi bướm;
  - sửa đồ bị hỏng;
  - tưới cây;
  - tạo cầu vồng.
- Phép chỉ dùng để giúp đỡ và làm đẹp, không có phép tấn công.

## SESSION 13: Thế Giới Mở 3D (làm sau, ở session riêng)

- Thế Giới Mở 3D chưa xong. Làm tiếp ở session riêng sau khi bản 2D ổn định.
- Ngọn hải đăng:
  - dời ra một hòn đảo nhỏ giữa biển để đèn chiếu rộng hơn;
  - quay chậm hơn.
