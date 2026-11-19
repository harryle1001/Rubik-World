# Nội thất lâu đài Học viện Pha Lê

Code: `client/js/island/academy/interior/` — `plan.js` (mặt bằng, số liệu thuần) · `build.js` (dựng 1 tầng) · `core.js` (giếng cầu thang xoay + tháp xoắn, luôn hiện) · `furnish.js` (bày đồ, model CC0 `models/kit/`) · `index.js` (vào/ra, tải tầng, mặt đi, va chạm, API).

**Cách hoạt động:** nội thất là "không gian phép" cao 1597 m trên đảo học viện (ngoài tầm cắt xa 296 m của camera → không vẽ chồng thế giới). Cửa phép (cửa gỗ viền sáng xanh) ở **Đại sảnh** (tường sau, cạnh bục), **sân trước** (mặt trong dãy cổng chính, phía tây cổng) và **ban công tháp thiên văn** đưa người chơi ra vào (mờ 0,3 s). Chỉ tầng đang đứng ± 1 được dựng và vẽ; các tầng xa quanh giếng thay bằng "bóng tầng" 1 mesh.

Khung 89 × 55 m (89/55 ≈ φ), tầng cao 8 m, lưới 1 m. Toạ độ mặt bằng: x 0..89 tây → đông, z 0..55 bắc → nam.

## Bản đồ tầng

```
 Tầng 4  ─ Đỉnh Tháp Chính ──────────────────── cửa ra Ban công tháp thiên văn (mái)
 Tầng 3  │ Thiên Văn │ Chờ │ Gương bí mật ║ Hiệu Trưởng (giá sách xoay → Gương) │
         │ Long │ Lân │      [giếng]      │ Quy │ Phụng │   (4 phòng nhà Tứ Linh)
 Tầng 2  │ Tầng lửng Thư viện │ Tự Học │ Khí Cụ │
         │ Ngủ khách 1 │ 2 │ [giếng] │ Pha Chế │ Ngủ khách 3 │
 Tầng 1  │ THƯ VIỆN (cao 2 tầng) ║ Bản Đồ Cổ │ Lớp Học 1 │      (giá sách xoay: Thư viện → Bản Đồ Cổ)
         │ Phòng Nhạc │ [giếng] │ Phòng Tranh (đầu cầu thang đá) │ Lớp Học 1B │
 Tầng 0  │ Truyền Thống │ Tiền Sảnh (cửa → Đại sảnh) │ Sinh Hoạt Chung │
         │ Lớp Học Trệt │ [giếng] │ Sảnh Đón + cầu thang đá lớn (cửa → sân trước) │ Đồng Hồ Pha Lê │
 Tầng −1 │ Bếp Lớn │ Lò Sưởi Ngầm │ Ngục Tối Cũ │
         │ Lối bí mật ║ Hầm Rượu Nho │ [đáy giếng] │ Kho Thảo Dược │   (tường hầm rượu mở → bậc đá xuống)
 Tầng −2 │ KHO BÍ MẬT (rương, pha lê) │
```

Mọi tầng: **hành lang chính** có hàng cột vòm + thảm đỏ chạy suốt (z 25..30), **hành lang vòng** quanh giếng (ban công).
Tháp Xoắn Tây (tầng −1..3) ở đầu tây hành lang chính · Tháp Chính (tầng 0..4) ở đầu đông.

## Cầu thang

- **Giếng cầu thang trung tâm** 21 × 21 m: 4 nhịp cầu thang bay (−1→0, 0→1, 1→2, 2→3), dài 21 m, 25 bậc, xoay 90° quanh trục giữa giếng theo nhịp 13 s (đứng 10 s, xoay 3 s; 4 nhịp thuận rồi 4 nhịp ngược). Nhịp tính theo đồng hồ thật → mọi người chơi thấy giống nhau. Đứng trên bậc được chở theo, lan can giữ không rơi; ban công có cổng phép chỉ mở khi đầu nhịp áp sát; rơi trong giếng/tháp → "phép lông vũ" làm chậm rơi.
- **Tháp xoắn**: 21 bậc / vòng / tầng, cột giữa, cửa mỗi tầng.
- **Cầu thang đá lớn** ở Sảnh Đón (tầng 0 → Phòng Tranh tầng 1) · **bậc đá hẹp** trong Lối bí mật (tầng −1 → Kho Bí Mật).

## Lối bí mật (3)

| Chỗ | Cách mở | Dẫn tới |
|---|---|---|
| Thư Viện, tường đông (tầng 1) | giá sách xoay | Phòng Bản Đồ Cổ |
| Hầm Rượu Nho, tường tây (tầng −1) | bức tường trượt xuống | Lối bí mật → Kho Bí Mật (tầng −2) |
| Phòng Hiệu Trưởng, tường tây (tầng 3) | giá sách xoay | Phòng Gương → gương phép đưa tới Tầng lửng Thư viện |

Đã tìm lối nào được nhớ trong `localStorage['academy.secrets']`.

## API điểm neo cho phần khác (`ctx.academy.anchors`, `ctx.academy.interior`)

```js
const I = ctx.academy.interior;
I.anchors                       // [{ id, kind, k (tầng), x, z (mặt bằng), face (rad, hướng nhìn vào phòng), room, roomName, floorName, pos: [x, y, z] thế giới, size }]
I.byKind('painting', 1)         // kind: painting (tường treo tranh) · classroom (phòng trống) · house (phòng nhà Tứ Linh) · magic · npc
I.attach('gal_n0', mesh)        // gắn vật vào điểm neo: gốc tại điểm neo, +z = nhìn vào phòng; tự ẩn/hiện + dựng lại theo tầng
I.onFloorBuilt((k, group) => {}) // mỗi khi tầng k được dựng: group dùng toạ độ mặt bằng (x 0..89, z 0..55, y tuyệt đối)
I.toWorld(x, z, k)              // mặt bằng → thế giới
I.enter('hall' | 'gate' | 'balcony'), I.inside, I.level, I.floorsInfo(), I.secrets(), I.shaft
```

Điểm neo tranh trùng cửa tự bị bỏ. Hiệu năng: điện thoại 390×844 đo 76–122 draw call trong các phòng (giới hạn 233).
