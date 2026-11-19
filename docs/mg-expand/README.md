# Mini game 3D — chơi thử, sửa, mở rộng (claude/mg-expand)

Đo: `node tools/mg-test.mjs [--mobile] [--only=caro,chess] [--shots=thư/mục]` (Playwright + SwiftShader → chỉ so tương đối).
"Đi bộ" = draw call khi đi ngoài thế giới; "Riêng" = draw call của khu chơi (bật − tắt api.root); "Rò 2" = geometry/texture còn lại sau lần vào–thoát thứ 2 (có nhiễu do thế giới nạp chunk).

## 1. Sửa lỗi + tối ưu

| Lỗi / chỗ chán | Nguyên nhân | Sửa |
|---|---|---|
| Rò texture mỗi lần vào (cờ vua 7, cờ vây 5, Rubik 4, đua thú 5) | mỗi NPC có `Skeleton` → bone texture riêng, host không dispose | host dispose skeleton + vật liệu chi tiết của NPC |
| Lỗi console `isReady` (patin) | `warm()` gọi `compileAsync` khi cảnh đổi, thoát game dispose vật liệu giữa chừng | không warm khi đang chơi mini game |
| Cột đèn / khung thành giữa bàn caro | cột mảnh nằm trong khối gộp `town-eastC` (r = 33 m) → không ẩn được, 55 tia dò lọt | findSpot thêm lưới đỉnh 4 m của khối gộp; caro/cờ vây bán kính 8 → 10 m (bàn 14,6 m) |
| Đường đua trên cầu cạn 13 m giữa rừng | runner luôn dựng cầu cạn | host tìm hành lang đất 23 × 89 m (`rect`), đường sát đất trên nền đắp; không có chỗ mới lùi về cầu cạn |
| Xưởng Mỹ thuật: cây, hoa, vệt đường xuyên sàn | cây/cỏ terrain tự xếp lại mỗi khi đi (ghi đè việc ẩn), cây to r ≥ 5 không ẩn | terrain `nature.skip` + DetailGrid `skip` né khu chơi; ẩn cả vật to có tâm trong khu; sàn xưởng cao 6 cm |
| Cột sáng pha lê nhiệm vụ lọt khung chơi | quests.js vẽ mọi lúc | ẩn khi đang chơi |

| Game | Đi bộ | Trước (call / riêng / rò 2) | Sau (call / riêng / rò 2) |
|---|---|---|---|
| rubik | 356→359 | 366 / 29 / 5g 4t | 300 / 15 / 1g 0t |
| caro | | 156 / – / 1g 1t | 126 / 10 / 1g 0t |
| go | | 113 / 2 / 1g 5t | 119 / 1 / 0g 0t |
| chess | | 103 / 19 / 0g 7t | 121 / 9 / 0g 2t |
| art-music | | 214 / 65 / 0g 1t | 153 / 43 / 0g 0t |
| reader | | 145 / 13 / 0g 3t | 169 / 13 / 0g 0t |
| skate | | 122 / 24 / 1g 1t | 143 / 17 / 0g 0t |
| patin | | 141 / 8 / 2g 2t + lỗi console | 123 / 15 / 0g 0t |
| animal-race | | 101 / 15 / 0g 5t | 134 / 14 / 0g 0t |
| (19 game khác) | | ≤ 168 | ≤ 177, rò 0–1 texture |

Mọi game khi chơi ≤ draw call lúc đi bộ (≈ 359). JS của khu chơi (mg.update) 0,1–2,8 ms/khung. Ảnh: `fix-before-after.jpg`.

Thêm: tìm chỗ đặt khu chơi bị khoá luồng chính lâu (caro 45 s sau khi thêm lưới đỉnh → lọc đỉnh mặt đất, dò lưới trước 55 tia: caro 0,77 s, cờ vua 6,4 → 0,76 s, Rubik 3,9 → 0,93 s trên Chromium máy tính); NPC nạp xong sau khi thoát → lỗi `S null` (sửa).

## 2. Mở rộng (mg/meta.js — gắn vào host, mọi game có ngay)

- 🎚️ **Cấp độ Dễ / Vừa / Khó**: chip trên thanh host (cờ vua/caro/vây dùng nút riêng, chung khoá `mg.<key>.level`). Cấp độ đẩy câu hỏi khó hơn (QZ.lv), đường đua nhanh hơn ×0,85/1/1,18 + vật cản dày hơn; thưởng xu theo cấp.
- 📘 **Câu hỏi theo lớp 1–9**: quiz.js / quick-quiz.js lấy 38–62 % câu từ `data/quiz-bank.json` theo lớp em chọn (`island.grade`), cấp độ đẩy ±1 lớp; chưa chọn lớp → lớp 2/4/6 theo cấp.
- 🏆 **Bảng xếp hạng**: "📱 Máy này" (localStorage, top 8) + "🏫 Toàn trường" (server `/island` `mgScore`/`mgTop`, top 13 mỗi game, lưu `data/mg-top.json`).
- 🏅 **13 huy hiệu** (lần đầu, 5/13 game, 34 ván, kỷ lục, mức Khó, 21/89 câu đúng, chơi cùng bạn, kỳ thủ, vận động viên, nghệ sĩ, 3 ngày nhiệm vụ) — +5 xu +3 điểm nhà mỗi huy hiệu.
- 📋 **3 nhiệm vụ mini game mỗi ngày** (cùng đề cho cả trường theo ngày): chơi game X, trả lời đúng 5 câu, chơi 3 game / mức Vừa+. +8 xu +5 điểm nhà mỗi việc, xong cả 3 thêm 21 xu. Xem ở 📚 Menu trường và thẻ 🏆.
- 🪙🏰 **Thưởng mỗi ván**: xu = cấp độ (+2 nếu kỷ lục), điểm nhà Tứ Linh = cấp độ (ngoài ⭐ sao cũ).
- 🤝 **2 người**: bạn khác (net.js) lại gần người đang chơi (≤ 8 m) → nút "✋ Chơi cùng …" → chủ khu "✓ Đồng ý" → bạn vào **đúng khu chơi của chủ** (gửi anchor), đấu điểm trực tiếp (chip 🤝 điểm bạn, thẻ kết quả so điểm). Cờ caro: đấu lượt thật (chủ X, bạn O, nước đi qua mạng, Nhi làm trọng tài). Thoát → bạn được báo. Server giới hạn 21 tin/giây.
- 👀 Người qua đường: bảng tên người đang chơi thêm "🎮 tên game"; nhân vật hiện đúng chỗ trong khu chơi.

Thử 2 người: `node tools/mg-duo.mjs --shots=…` → 7/7 bước ✅, không lỗi console (`after/duo-*.png`).

Số đo sau khi gắn lớp mở rộng (đi bộ 362 draw call máy tính / 305 điện thoại 390×844): mọi game ≤ lúc đi bộ (máy tính 77–290, điện thoại 87–276), rò lần 2 ≈ 0, không lỗi console.
mg.update lúc chơi 0,03–1,6 ms/khung; lần vào đầu có 1 khung ~96 ms (tính hình cầu bao lần đầu), các lần sau không khung nào > 8 ms (ẩn vật thế giới bỏ qua cụm instancing ngoài khu, chạy lại 4 thay vì 6 lần).
Model của game vẫn tải lười (props.js nạp khi vào game, không nạp sẵn). Ảnh: `expand-after.jpg`.

## 3. Biển báo & bản đồ (mg/signs.js)

- Biển gỗ "🎮 tên game" cạnh cửa mỗi mini game (24 biển), lệch khỏi cửa theo pháp tuyến tường, mặt chữ quay ra đường. Gộp 2 draw call cho mọi biển (khối gỗ màu theo đỉnh + 1 atlas chữ 1024²), ẩn khi đang chơi.
- Lại gần biển / cửa: nút **✋ Chơi <tên game>** (trước: "🚪 tên cửa").
- Bản đồ M: biểu tượng 🎮 + tên từng mini game.
