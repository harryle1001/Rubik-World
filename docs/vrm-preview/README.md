# Duyệt nhân vật anime (VRM) — thay chibi KayKit?

Trạng thái: **chỉ xem thử, chưa gắn vào game.** Trang: `/vrm-preview.html` (chạy `npm start`).
Tham số: `?set=full|mobile&anim=idle|walk&compare=1&only=<id>&view=front|face&light=soft`. Giấy phép: [LICENSES.md](LICENSES.md).

Kỹ thuật: @pixiv/three-vrm 3.5.5 (MToon = đổ bóng toon + viền, tóc/váy mềm bằng SpringBone), ánh sáng như `sky.js` (hemi + nắng, ACES),
đứng + đi bộ viết thủ tục trên xương chuẩn hoá VRM (chạy cho mọi mẫu). Rút gọn bằng `tools/vrm-slim.mjs` (giữ nguyên VRM — gltf-transform xoá extension VRM nên không dùng thẳng được):
- **full**: texture ≤1024, nén meshopt, giữ nguyên tam giác.
- **mobile**: texture ≤512, giảm ~½ tam giác (meshopt simplify, giữ viền; bỏ qua lưới có morph biểu cảm), nén meshopt.

## Bảng mẫu
| id | Mẫu | Giấy phép | Gốc | ▲ full | KB full | ▲ mobile | KB mobile | Cao | Giống Genshin? |
|---|---|---|---|---|---|---|---|---|---|
| shino | Sendagaya Shino | CC0 | 14,7 MB | 31 211 | 2 146 | 17 183 | 1 565 | 1,54 | ★★★★ mặt anime, tóc dài mềm, đồng phục — rất hợp học sinh |
| shibu | Sendagaya Shibu | CC0 | 16,6 MB | 34 395 | 2 176 | 18 767 | 1 594 | 1,51 | ★★★★ như Shino, tóc ngắn + kẹp tóc |
| vita | Vita | CC0 | 14,0 MB | 26 130 | 1 862 | 14 636 | 1 396 | 1,59 | ★★★★★ tóc bạc, mắt 2 màu, trang phục fantasy — giống Genshin nhất, nhưng hở vai |
| vivi | Vivi | CC0 | 17,7 MB | 25 834 | 2 019 | 14 870 | 1 430 | 1,31 | ★★★★ dáng nhỏ, váy xanh lá kiểu Mondstadt — hợp HS tiểu học |
| hair-f | HairSample Female | CC0 | 17,1 MB | 27 068 | 1 735 | 15 380 | 1 334 | 1,54 | ★★★ tai mèo + váy trắng, dễ thương |
| sample-a | AvatarSample A | điều khoản VRoid | 14,7 MB | 24 854 | 1 863 | 15 028 | 1 364 | 1,47 | ★★★ tóc nâu, áo khoác — thường ngày |
| fumiriya | Sakurada Fumiriya | CC0 | 18,9 MB | 39 548 | 2 398 | 21 352 | 1 705 | 1,80 | ★★★★ nam cao, đồng phục gile — hợp **thầy giáo / HS lớn** |
| hair-m | HairSample Male | CC0 | 18,0 MB | 24 858 | 1 772 | 14 176 | 1 311 | 1,67 | ★★★★ nam tóc đen, áo hoodie — hợp **học sinh nam** |
| seed-san | Seed-san | VRM PL 1.0 (ghi tên) | 10,7 MB | 45 058 | 2 506 | 28 237 | 2 011 | 1,45 | ★★ phong cách sci-fi, có cánh tay máy — ít hợp |
| olivia | 100Avatars Olivia | CC0 | 1,6 MB | 3 888 | 347 | 3 888 | 309 | 1,44 | ★ low-poly, không phải anime — chỉ làm phương án dự phòng NPC rất xa |
| *(hiện tại)* | KayKit chibi | CC0 | — | 2 836 | — | — | — | 1,60 | chibi khối |

So sánh: VRM nặng **~10× tam giác** và **~5–7× dung lượng** so với chibi hiện tại; mỗi nhân vật VRoid có **65–131 primitive** (mỗi lọn tóc một primitive, 14–17 vật liệu) → 65–131 draw call/người: **bắt buộc gộp lưới theo vật liệu** (cùng skeleton) khi tích hợp để còn ~15 draw call.

Ảnh: `group.jpg` (cả nhóm, đứng), `group-walk-mobile.jpg` (đi bộ, bộ mobile), `compare-kaykit.jpg` (đứng cạnh chibi), `<id>-front.jpg` + `<id>-face.jpg` từng mẫu,
`shino-face-mobile.jpg` / `shino-front-mobile.jpg` (so bản mobile với `shino-face.jpg` bản full — gần như không khác ở cự ly chơi).

## Gợi ý 3 mẫu tốt nhất
1. **Học sinh nữ: Sendagaya Shino** (CC0) — đồng phục sẵn, mặt anime đẹp, tóc dài có SpringBone; Shibu làm biến thể tóc ngắn.
2. **Học sinh nam: HairSample Male** (CC0) — trẻ, gọn, áo hoodie dễ thay màu nhà; nhẹ nhất trong nhóm nam (24,9k▲).
3. **Thầy cô: Sakurada Fumiriya** (CC0) — dáng cao 1,8 m, gile + cà vạt nghiêm túc. (Cô giáo: Shino/AvatarSample A thay áo dài + kéo cao ~φ⁻¹ tỉ lệ đầu.)
Vita giống Genshin nhất nhưng trang phục hở vai → nên dùng cho NPC phép thuật/linh vật sau khi chỉnh áo, không dùng làm học sinh mặc định.

## Kế hoạch tích hợp (chờ duyệt)
1. **Người chơi**: VRM bộ *full* (texture 1024, ~2 MB), SpringBone tóc/váy bật; nạp sau màn chính (lazy), giữ chibi làm bản dự phòng khi máy yếu.
2. **NPC**: LOD theo khoảng cách nhịp φ — < 8 m: VRM *mobile* (SpringBone tắt khi > 5 m); 8–21 m: VRM mobile không cập nhật biểu cảm/xương phụ; > 21 m: impostor/chibi.
   Tối đa ~5 VRM cùng lúc trên điện thoại (~90k▲), còn lại chibi.
3. **Animation**: chuyển 14 clip KayKit sang VRM bằng retarget theo xương humanoid (three-vrm `VRMHumanBoneName`) hoặc dùng VRMA; giữ tốc độ bước chân hiện có.
4. **Tuỳ chỉnh**: đổi màu áo/váy/cà vạt theo **nhà Tứ Linh** bằng cách nhân màu `litFactor` của vật liệu MToon tên áo (không cần texture mới);
   đổi tóc = bật/tắt lưới tóc từ các mẫu CC0 (HairSample_Female/Male có sẵn nhiều kiểu); màu tóc/mắt qua `litFactor`/`shadeColorFactor`.
5. **Hiệu năng**: gộp primitive cùng vật liệu (tóc, áo) ngay khi nạp; chép three-vrm vào dự án (bỏ CDN), dùng `VRMUtils.combineSkeletons`, chia sẻ texture giữa biến thể; đo FPS máy thật trước khi bật mặc định.
6. Bước tiếp theo nếu duyệt: thay model người chơi trên 1 nhánh riêng, chụp ảnh trong đảo thật, đo FPS điện thoại.
