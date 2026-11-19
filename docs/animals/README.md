# Động vật thật trên Đảo Rubik 3D (`client/js/island/wild/`)

**93 trang trong 📔 Sổ tay thiên nhiên – 91 tên khoa học khác nhau** (mục tiêu ≥ 89): 70 loài do hệ `wild/` điều khiển bằng **51 model CC0**
(4,7 MB, nén meshopt, tải lười theo loài) + 23 loài đã có sẵn trong game (thú rừng quanh đền, chim/bướm/vịt của `fauna.js`, sinh vật biển, hươu cao cổ Safari).
Danh sách đầy đủ: [species.md](species.md) · số đo: [perf.md](perf.md) · nguồn model: `client/assets/CREDITS.txt`.

## Chơi thế nào
| Việc | Cách làm |
|---|---|
| Gặp loài mới | Lại gần (≈ 8–13 m), nhìn qua 🔭 ống nhòm hoặc 📷 chụp ảnh → loài được ghi vào 📔 Sổ tay (nút 📔 hoặc phím **X**) |
| 🔭 Ống nhòm | Nút 🔭 / phím **Z**: góc nhìn thứ nhất, zoom 3× · 5× · 8×; đưa dấu ＋ vào con vật để nhận dạng từ xa mà không làm nó sợ |
| 📷 Chụp ảnh | Nút hành động "📷 Chụp ảnh …" (khi ở gần hoặc đang dùng ống nhòm) → ảnh 96 px lưu vào trang của loài |
| 🥕 Cho ăn | Tới sát thú nuôi / thú hiền (bò, ngựa, dê, thỏ, sóc, bồ câu…) → "🥕 Cho … ăn": đàn đó quen hơi, không còn sợ |
| 🛖 Chòi / lều quan sát | Chòi Safari + 3 lều (rừng đền, đầm sen, đồi núi): đứng trong đó thú không bỏ chạy |
| 🧭 Nhiệm vụ nhà sinh vật học nhí | Tab "Nhiệm vụ" trong Sổ tay: tìm 8 loài chim · chụp 13 loài · theo dấu chân 3 lần · đếm đúng 3 đàn · cho 5 loài ăn · quan sát 8 tập tính |
| Mẹo | Đi chậm thì thú ít sợ, chạy thì thú sợ từ xa; ngày/đêm, nắng/mưa và 4 "mùa" (mỗi ngày trong game là 1 mùa) có loài khác nhau |

## Sinh cảnh
Nông trại · rừng (quanh Đền Tri Thức + đất tự nhiên cao, xa phố) · đồi núi · rừng thông trong phố (chỉ loài hiền) · đầm sen/ao hồ/suối Safari ·
đồng cỏ/vườn hoa · Safari (vũng nước cho hà mã, cá sấu) · phố/sân trường · bờ biển · biển gần bờ & biển sâu · bầu trời ·
**2 tảng băng trôi ngoài khơi phía bắc** (Băng Nam Cực: chim cánh cụt · Băng Bắc Cực: gấu trắng, hải cẩu — sổ tay dạy rằng hai loài này không bao giờ gặp nhau ngoài tự nhiên).

## Hành vi (máy trạng thái nhẹ: mỗi con 1 trạng thái + 1 đồng hồ)
- **Theo giờ**: loài ngày ngủ đêm (💤), loài đêm (dơi, ngài, báo đen, ếch, cóc, rắn lục) ngủ/ẩn ban ngày; sói hú gọi bầy lúc đêm; chim săn về tổ ngủ.
- **Kiếm ăn, uống nước** ở suối/vũng/bờ biển gần nhất, **tắm bùn** (trâu, lợn, voi, tê giác, hà mã, lợn rừng), **tắm bụi** (gà, bồ câu, sáo, cu gáy),
  **đào hang / chui hang** (thỏ chạy về hang khi sợ; lợn rừng ủi đất), **leo cây** (sóc, gấu ngựa).
- **Bầy đàn**: cừu, ngựa vằn, hươu đỏ, chim cánh cụt đi theo đầu đàn, con lạc đàn kêu gọi rồi chạy về; **mẹ dẫn con** (gà mái + gà con, vịt + vịt con, voi con, cá voi con).
- **Chim**: làm tổ → **ấp trứng** (ngày 0) → **mớm mồi** cho chim non (ngày 1) → rời tổ (ngày 2); đàn ngỗng trời **bay chữ V** di cư (thu, đông);
  bách thanh **đậu dây điện**; én lượn, **sắp mưa thì bay thấp**; đại bàng/diều hâu/ó cá lượn vòng, bổ nhào.
- **Săn mồi không máu me**: sói → hươu đỏ, hổ → lợn rừng, sư tử → ngựa vằn, gấu trắng → hải cẩu, diều hâu → gà, cá mập → đàn cá ngừ:
  rình → rượt → con mồi LUÔN nhanh hơn và chạy thoát → thú săn đứng thở, kèm lời giải thích.
- **Với người chơi**: nhút nhát bỏ chạy (bán kính tuỳ loài, nhân theo tốc độ người chơi), tò mò lại gần (dê, chó, vượn cáo, chim cánh cụt), cho ăn được.
- **Thời tiết / mùa**: mưa → ếch cóc ra kêu, côn trùng ẩn, thú đứng trú; chim én (xuân–hạ), ngỗng trời (thu–đông), ó cá, cá voi lưng gù, bướm theo mùa.
- **Tiếng kêu từng loài**: tổng hợp bằng WebAudio (`calls.js`, 0 KB) + 3 file CC0 có sẵn (chó, cừu, chim).

## Hiệu năng
- Mỗi loài 1 model dùng chung; thú có xương đã gộp thành 1 lưới/con; viền + bóng chỉ khi gần; animation cập nhật 1/2–1/4 khung khi xa.
- Chim nhỏ, côn trùng, đàn cá: **InstancedMesh nướng 2 tư thế** của animation (`flocks.js`) → 2 draw call/đàn, không tính xương.
- Chỉ sinh nhóm trong 46 m (điện thoại) / 60 m (máy tính) quanh người chơi, huỷ khi ra xa hơn 13 m nữa; nhóm gần nhất được ưu tiên.
- **Tối đa 21 con có xương cùng lúc trên điện thoại** (34 trên máy tính), tính cả thú của `animals.js` đang hiện; tối đa 5 (8) đàn instanced.
- Điện thoại (390×844, đo sau khi ghép nhánh chính): **nhiều nhất 224 draw call** (rừng đền ban đêm; giới hạn 233), JS của hệ ≤ 0,45 ms/khung; thú wild trên điện thoại không vẽ viền, thú nhỏ không đổ bóng.
- Số đo từng sinh cảnh: xem [perf.md](perf.md) (cột "trước" đo ở lần chạy khác nên lệch theo trạng thái LOD/cây cỏ; bảng máy tính đo trước khi ghép nhánh chính). Tắt hệ để so sánh: thêm `?nowild` vào URL.

## Tự kiểm tra
`PORT=3111 node server/index.js &` rồi `node tools/wild-test.mjs [--mobile] [--nowild] [--fast]` (dịch chuyển tới 14 sinh cảnh, sáng/đêm/mưa, chụp ảnh cận,
đo draw call + ms JS, mở ống nhòm / sổ tay / nhiệm vụ, bắt lỗi console) → ảnh `d-*.jpg` (1280×720), `m-*.jpg` (390×844) trong thư mục này. Kết quả lần cuối: không lỗi console ở cả hai cỡ màn hình; `tools/smoke-test.mjs --mobile` ✅. `node tools/wild-doc.mjs` sinh lại 2 bảng.

## Giới hạn đã biết (nói thẳng)
- 10 model không có animation (gấu, hổ/sư tử/báo, tê giác, hà mã, lạc đà, hải cẩu, bò biển, bạch tuộc, cá mập đầu búa, bách thanh): chỉ nhún/lắc theo bước.
- 19 loài dùng chung model với loài khác (10 loài chim nhỏ chung 1 model chim; trâu ← bò; sơn dương ← dê; sư tử, báo đen ← hổ; gấu ngựa, gấu trắng ← gấu…), phân biệt bằng màu, cỡ, sinh cảnh, tập tính.
- "Mùa" là quy ước (mỗi ngày trong game = 1 mùa) vì game chưa có hệ thống mùa thật.
- Danh sách chờ model CC0 (cò, cú, công, vẹt, khỉ, tê tê, rái cá…): cuối [species.md](species.md).
