# Học sinh phù thuỷ Tứ Linh — nhân vật anime VRM trong đảo 3D (chờ duyệt)

Nhánh `claude/vrm-chars`. Mẫu (CC0, pixiv/VRoid): nữ **Victoria Rubin** (tóc buộc — mặc định), **Vivi** (tóc bob), **Sendagaya Shino** (tóc dài);
nam **HairSample Male**; thầy giáo **Sakurada Fumiriya**. (Lần 2: bỏ Shibu, thêm Victoria + Vivi theo góp ý "nữ đeo khăn xấu, vỡ nét".) Giấy phép: [../vrm-preview/LICENSES.md](../vrm-preview/LICENSES.md), `client/assets/CREDITS.txt`.
Chỉ sửa đảo 3D (`client/js/island/…`), không đụng `client/school/`.

## Ảnh đề xuất
| Ảnh | Nội dung |
|---|---|
| `long-nam.jpg` · `long-nu.jpg` | 🐉 Nhà Long — đỏ son / vàng |
| `phung-nam.jpg` · `phung-nu.jpg` | 🦚 Nhà Phụng — lam / bạc |
| `lan-nam.jpg` · `lan-nu.jpg` | 🦄 Nhà Lân — lục / đồng |
| `quy-nam.jpg` · `quy-nu.jpg` | 🐢 Nhà Quy — tím / ngọc |
| `hoc-vien-4-nha.jpg` | 4 nhà (8 bạn) đứng cùng nhau ở **sân Luyện Đũa, Học viện Pha Lê** — trong đảo thật, chế độ điện thoại |
| `thay-giao.jpg` | Thầy giáo Học viện (Fumiriya + áo choàng xanh than viền vàng, mũ chóp, đũa) — 2 biến thể |
| `tao-nhan-vat.jpg` | Trình tạo nhân vật trên điện thoại 390×844 (2 trạng thái: nữ Phụng → nam Lân + mũ chóp) |
| `dao-di-bo.jpg` · `dao-xe-dap.jpg` | Người chơi (Victoria, Nhà Phụng, kính tròn) đi bộ / đạp xe ở quảng trường Trường Rubik |
| `8-kieu-toc.jpg` | **8 kiểu tóc ghép** trên cùng thân Victoria: dài thẳng · buộc lệch · bob búi · ngắn kẹp · bob mái bằng · tém xù · nam tém · nam mái dài |
| `da-dang-10-ban.jpg` | 10 bạn phối ngẫu nhiên thân × tóc × màu tóc/mắt/da × kính × mũ × nhà × chiều cao (bộ mobile, như NPC) |
| `truoc-sau-net.jpg` | Độ nét: bản cũ (texture PNG gom 256 màu, Shino) ↔ bản mới (WebP đủ màu, Victoria) |
| `truoc-sau-di-bo.jpg` · `truoc-sau-xe-dap.jpg` · `truoc-sau-npc.jpg` | So sánh **trước (chibi) / sau (anime)** cùng vị trí, cùng giờ |

## Thiết kế đồng phục (nguyên bản, không phải Harry Potter)
- **Áo choàng dài xẻ trước** màu đậm của nhà (không phải áo đen), viền trước + gấu + cổ tay màu thứ 2 của nhà, tay áo loe,
  **mũ trùm hạ sau gáy**. Gấu áo ở 1/φ từ gối xuống mắt cá; khe cổ chữ V khép dần tới eo.
- **Nơ cổ / cà vạt gốc của VRoid** (sắc nét) giữ lại và **đổi màu theo nhà** (Shino: nơ màu nhà); nam: cà vạt 2 màu dựng thêm.
- **Khăn quàng sọc Fibonacci 8:1:2:1:5** nay là **tuỳ chọn** (mặc định tắt), làm lại mềm: vòng cổ mảnh + 2 đuôi ống dẹt ôm ngực, tua rua.
- Mẫu mặc **váy liền** (Victoria, Vivi): cắt váy gốc dưới eo, áo choàng **khép vạt trước** + váy xếp ly 24 nếp màu nhà bên trong → không đâm xuyên.
- **mũ chóp nhọn** (cao 1/φ³ chiều cao người, chóp cong ra sau, dải màu viền),
  **đũa gỗ** đầu pha lê màu nhà, **kính tròn / vuông** gọng màu kim loại của nhà (vàng · bạc · đồng · ngọc).
- Không sẹo, không huy hiệu, không chữ/biểu tượng nhà trên áo; Nhà Long dùng đỏ son + vàng của Tứ Linh (không đỏ thẫm–vàng sọc đều).
- Thầy cô: áo choàng xanh than viền vàng, không khăn; ở Trường Rubik thầy giáo mặc gile + cà vạt gốc của Fumiriya.
  Học sinh Trường Rubik (ngoài Học viện): đồng phục VRoid gốc + **khăn quàng đỏ**.

## Kỹ thuật
- `client/js/vendor/three-vrm.module.min.js` — @pixiv/three-vrm 3.5.5 (MIT) chép vào dự án, không CDN.
- **Độ nét:** file VRM làm lại từ bản gốc bằng `tools/vrm-slim.mjs --hq --meshopt`: texture **WebP đủ màu** (EXT_texture_webp) thay PNG gom 256 màu
  (nguyên nhân tóc/mắt vỡ nét), lọc dị hướng ×8. Nhẹ hơn cả trước: full 1,4–1,8 MB, mobile 1,2–1,5 MB/mẫu.
- **Đa dạng (lần 3):** `vrm/vrm-hair.js` ghép **kiểu tóc** giữa 9 mẫu VRoid CC0 (cùng khung đầu, xương `HairJoint-*`): tách lưới tóc + cây xương tóc +
  thông số SpringBone của mẫu cho tóc (nạp 1 lần/mẫu), nhân bản cho từng người, canh theo tâm 2 mắt và tỉ lệ khoảng cách mắt, tạo lại lò xo tóc
  va chạm với đầu/thân mẫu nhận. 8 kiểu dùng được (bỏ tai mèo của Vita; HairSample Female tai dính liền tóc → không dùng).
  3 thân nữ × 6 kiểu tóc nữ, 1 thân nam × 4 kiểu tóc nam, + 8 màu tóc, 6 màu mắt, 3 màu da, kính, mũ, 4 nhà, chiều cao ±6% → NPC ít khi trùng nhau.
  Trình tạo nhân vật có hàng **Kiểu tóc** (lọc theo nam/nữ). Mặt vẫn chung khuôn VRoid (muốn khác mặt: tự tạo bằng VRoid Studio).
- `vrm/vrm-core.js` nạp VRM (bộ `full` cho người chơi, `mobile` cho NPC), **gộp primitive cùng vật liệu**
  (tóc VRoid 46–114 primitive → 1; thân 4 → 1): HairSample Male 131 → 15 lưới, Shino 67 → 18. Texture tóc + mống mắt chuyển xám 1 lần/mẫu
  → **đổi màu tóc/mắt/da bằng litFactor** (MToon `color` + `shadeColorFactor`); texture dùng chung giữa các bản sao cùng mẫu.
- `vrm/vrm-outfit.js` dựng đồng phục **bằng code** (không có phụ kiện CC0 khớp xương VRoid): đo lát cắt thân của chính mẫu theo chiều cao
  → áo vừa mọi mẫu. 3 vật liệu MToon: thân áo (litFactor = màu nhà đậm, có viền), viền/sọc/kính (litFactor = màu thứ 2), gỗ đũa.
  Gắn xương VRM: thân trên theo ngực/bụng, **vạt trước theo đùi (50%)**, **vạt sau treo 4 SpringBone** (VRMSpringBoneJoint) có va chạm
  capsule ống chân; tóc dài va chạm capsule lưng áo (không xuyên vào trong áo). Đổi nhà = đổi 2 litFactor, không dựng lại.
- `vrm/vrm-anim.js` **retarget 14 animation KayKit** đang dùng (Idle, Walking_A, Running_A, Jump_Start/Idle/Land, Sit_Chair, Sit_Floor_Idle,
  Cheer = vẫy/reo, Interact, PickUp, Use_Item = vung đũa, Hit_A, Head_No) sang xương humanoid chuẩn hoá VRM
  (q = R_cha · q · R_xương⁻¹, đảo x/z cho VRM 0.x, vị trí hông × tỉ lệ cao hông). Ngón tay khép nhẹ để cầm đũa. Cưỡi xe/chổi/thú dùng
  Sit_Chair như cũ; đạp xe: `vehicles.js` xoay xương đùi qua bí danh `upperlegl/r` → xoay xương đùi thật của VRM.
- `vrm/vrm-hero.js` trả về đối tượng **cùng giao diện người chibi** (`model, anim.play/update, set, height, outlines, head…`) → code cũ
  (driveHero, drivePlayer, emote, actorLod, stepAnim, lookAtTarget, magic.js đũa, houses.js) chạy nguyên; bí danh xương KayKit
  (`head, chest, handr, lowerarmr, upperlegl/r`). Chớp mắt + mắt cười khi reo bằng biểu cảm VRM.
- `vrm/player-vrm.js` **người chơi VRM full, nạp sau khi màn che mở** (không chậm lúc vào game); máy yếu (≤ 2 GB RAM / ≤ 2 nhân, `?low`,
  `?novrm`) hoặc chọn "Chibi" → giữ chibi. Lễ chọn nhà xong → áo đổi màu tại chỗ.
- `vrm/vrm-npc.js` **NPC học sinh + thầy cô** (mọi chỗ gọi `loadHero` — thị trấn, sân trường, lớp học, tàu, Học viện…) qua 1 hook,
  không sửa code NPC: < 5 m VRM mobile đủ (SpringBone, biểu cảm, ánh mắt, đũa) · 5–21 m **lite** (chỉ xương chính, ẩn ánh mắt/kẻ mắt/đũa,
  không viền khi xa) · > 21 m chibi · **tối đa 5 VRM trên điện thoại** (8 máy tính), gần nhất trước, trễ ±2 m; VRM tháo ra được giữ lại dùng lại.
  Bóng đổ VRM chỉ < 13 m. Tải trước file mobile sau khi vào game (bỏ qua khi mạng 2G/3G hoặc tiết kiệm dữ liệu).
- `vrm/creator.js` + `vrm/avatar.js` **trình tạo nhân vật** (☰ → 🎨 Nhân vật): mẫu, nhà, tóc (8), mắt (6), da (3), kính, mũ, anime/chibi;
  lưu `profile.avatar` (data/account.js) hoặc máy khi chơi khách. Đã có nhà từ Quả cầu Tứ Linh → khoá chọn nhà, áo theo nhà thật.

## Đo trên chế độ điện thoại (390×844, DPR 2, UA iPhone, `tools/perf-mobile.mjs --wait-vrm`, chất lượng khoá mức 1)
Máy đo dùng GPU giả lập (SwiftShader, CPU) → **FPS/ms chỉ để so tương đối**, cần đo lại trên điện thoại thật. Draw call/tam giác là số thật.

| Điểm | Trước (chibi, `?novrm`) | Sau (anime: người chơi + NPC gần) | Chênh |
|---|---|---|---|
| Cổng trường (5 NPC VRM) | 158 draw call · 585 k▲ · 4,0 ms | 195 draw call · 651 k▲ · 7,4 ms | +37 · +65 k▲ |
| Quảng trường (5 NPC VRM) | 136 · 419 k▲ · 4,6 ms | 184 · 510 k▲ · 6,7 ms | +48 · +91 k▲ |
| Sân bay (chỉ người chơi) | 115 · 295 k▲ · 3,5 ms | 140 · 349 k▲ · 5,0 ms | +25 · +54 k▲ |

(▲ gồm cả lượt vẽ viền + bóng.) **1 nhân vật** (trang `vrm-chars.html`, không bóng): người chơi bộ full có viền **24 draw call (nam) / 26 (nữ)**,
44–52 k▲ kể cả viền; NPC mobile **lite** (5–21 m) **14 draw call (nam) / 16 (nữ)** — đạt mục tiêu ~15 —, 16,5–19,4 k▲. Chibi cũ: 2 draw call, ~2,8 k▲.
Tam giác model: Victoria 28 k (full), Vivi 26 k, Shino 31 k / 17 k (mobile), HairSample Male 25 k / 14 k, Fumiriya 40 k / 21 k; đồng phục +3,3–4,5 k▲.

**Thời gian tải:** khung 3D đầu tiên / trường sẵn sàng **không đổi** (2,2–2,5 s / 2,3–2,7 s; 3,37 MB như cũ) vì VRM nạp sau.
Người chơi VRM xuất hiện sau ~5,2–5,7 s kể từ khi màn che mở trên máy đo (tải 1,8–2,2 MB + parse + dựng áo; máy thật nhanh hơn nhiều vì
GPU thật), mỗi NPC mobile ~0,25–0,4 s parse (1,3–1,7 MB/mẫu, tải 1 lần). three-vrm +155 KB (≈ 45 KB nén).
**Không lỗi console** ở cả 2 lượt đo và mọi lượt chụp ảnh.

## Còn chờ chủ dự án duyệt / bước sau
1. Duyệt màu + kiểu đồng phục 4 nhà (đặc biệt Nhà Long đỏ–vàng: có muốn chuyển sang đỏ son + **xanh ngọc** cho khác hẳn không?).
2. Đo FPS trên 1–2 điện thoại thật (Android tầm trung, iPhone 11+); nếu < 50 FPS: hạ tối đa 3 VRM, tắt viền người chơi khi chạy.
3. Bạn online (net.js) hiện dùng VRM theo kiểu chibi của bạn đó — gửi `profile.avatar` qua Socket.io để thấy đúng nhân vật bạn tự tạo.
4. Xoá các mẫu xem thử không dùng (vita, vivi, seed-san, sample-a, olivia, hair-f) khỏi bản app để nhẹ gói cài (~16 MB).
