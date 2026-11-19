# Rừng Thiên Định — khu rừng ẩn

Khối núi đá ngoài vịnh phía **bắc Rừng Thiền**, ngay sau lưng cụ Rùa. **Không có trên bản đồ M** cho tới khi người chơi đặt chân vào thung lũng.

| File | Việc |
|---|---|
| `client/js/island/destiny-plan.js` | Bố cục + hàm độ cao (thuần số, chạy được trong Node). `terrain.js` gọi `destinyHeight()` ở cuối `rawHeight()`. |
| `client/js/island/zone-destiny.js` | Dựng hình + logic (lối mòn, câu đố, thung lũng, sinh vật, cổng đá). `ocean.js`: `createDestiny(ctx)` + `destiny.update(dt, t)`. |
| `client/js/island/destiny-ui.js` | Tiến độ (máy + tài khoản), bảng lời ước, bài hít thở, màn sương, ảnh chữ bia đá. |
| `tools/destiny-test.mjs` | Playwright: đi trọn lối mòn bằng phím thật, thử nhánh sai, lời ước, 8 bí mật, cổng đá, đo draw call, chụp ảnh. |

## Manh mối (rải ở đảo chính)
1. **Bia khắc đá** cạnh lối đá sau Đền Tri Thức: mũi tên Bắc, 13 chấm đá trên sóng, rèm dây leo, cây toả sáng.
2. **Cụ Rùa** (bãi tây bắc) kể thêm một câu đố: “Mười ba viên đá nổi giữa lạch, rèm dây leo che cửa đá…”.
3. **Đom đóm ban đêm** chạy thành dòng từ bia khắc xuống bãi cụ Rùa, qua đá bước, tới cửa khe.
4. **Chuông gió** treo ở cửa khe: lại gần càng nghe rõ (trong 34 m).

## Lối mòn (≈ 188 m từ bãi cụ Rùa, ≈ 260 m từ bia khắc)
13 đá bước qua lạch → **khe đá phủ dây leo** (2 mảng dây leo giả bên cạnh) → khe dốc → **Ngã ba Mặt Trời** (la bàn đá: Mặt Trời mọc hướng Đông → đi Đông) →
**bãi sương** (đi theo 6 đèn đá + tiếng chim; rời dãy đèn > 6,2 m thì sương đưa về đầu bãi) → **Ngã ba Rêu** (rêu mọc mặt Bắc thân cây → quay lưng, đi Nam) →
trảng cổ thụ → **cầu khỉ** vượt vực → **hang đom đóm** (nấm phát quang). Nhánh sai ở 2 ngã ba: cổng sương đưa vòng lại ngã ba kèm lời giải thích.

## Thung lũng (bán kính 34 m, vách 15 m)
Cây **Thiên Định** phát sáng (bệ đá: gửi lời ước / mục tiêu học tập — lưu `profile.destiny`, buộc dải lụa vàng lên cành) · 5 bia danh ngôn ·
**hồ gương** + **thác 3 tầng** · đền đá rêu phong · vườn đá thiền (xoắn ốc 1·1·2·3·5) · **ghế thiền**: hít 5 s – thở 8 s × 5 nhịp = 65 s ·
hươu trắng, công xoè đuôi, 13 bướm phát sáng, đom đóm, tia nắng xuyên tán · **8 bí mật nhỏ** · **cổng đá** ⇄ sân trước Đền Tri Thức (mở sau khi khám phá).

Thưởng: danh hiệu **Người tìm đường** (+21 xu) · đủ 8 bí mật: **Người giữ rừng** (+34 xu) · đọc đủ 5 bia +13 xu · tĩnh tâm +8 xu.

## Tỷ lệ vàng
Bán kính 34 · vách 13 + 2 m · cao nguyên 8 m · 13 đá bước · 5 rễ + 5 cành + 13 quả đèn · 5 bia cách 72° · 8 cổ thụ, 34 cây đỉnh vách · chuông 5 ống dài theo φ ·
thở 5/8 s · lời ước tối đa 144 ký tự · cỡ chữ/bo góc 8·13·21·34 · đuôi công 13 lông.

## Hiệu năng
Tĩnh: 2 lưới gộp + DetailGrid ô 34 m · cây/bụi/đá dùng chung InstancedMesh của terrain (LOD sẵn) · bụi rậm, đá lát, dây leo, sương, tia nắng, bướm, lụa: mỗi loại 1 InstancedMesh ·
đom đóm 1 Points · cả khu ẩn khi cách > 190 m. Số đo: xem `tools/destiny-test.mjs` (in draw call từng điểm).

## Gỡ lỗi
`__island.destiny.st.reset()` xoá tiến độ · `.discover()` · `.findSecret('lotus')` · `.ui.speed = 13` tua nhanh bài thở.
