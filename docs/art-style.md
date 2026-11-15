# Đảo Rubik 3D — Hướng dẫn phong cách (dùng chung cho mọi phiên)

Mục tiêu: đẹp như game "đảo nhiệt đới ấm áp" (cozy island): cát hồng-kem, biển xanh ngọc, gỗ ấm, cây dừa, mái ngói cam/đỏ đất, màu pastel dịu. Nhìn từ camera xa (nhân vật nhỏ), cảnh phải đọc rõ hình khối.

## Bảng màu (ưu tiên, tránh màu gắt bão hoà)
- Cát `#f3d6a8` · cát ướt `#e8c391` · cỏ `#8fcf6a` / `#6fb85a` · cỏ tối `#4f9a4a`
- Gỗ `#b9824f` / `#8a5a34` · đá `#d8cfbf` / `#a9a297` · ngói `#d9683f` / `#b9502f`
- Tường pastel: kem `#fbf1de`, hồng `#f6c7c0`, xanh bạc hà `#bfe6d6`, xanh trời `#c7def2`, vàng bơ `#f7e3a1`
- Biển nông `#46e3c6` → sâu `#1688b0`; điểm nhấn: đỏ `#e8453c`, vàng `#f5c518`
- Viền: mảnh, màu nâu tím đậm (không đen thuần).

## Tài sản 3D
- Ưu tiên model CC0 trong `client/assets/models/kit/` qua `kit.js` (placeKit). Model mới: chỉ CC0, ghi nguồn vào `client/assets/CREDITS.txt`, nén meshopt (gltf-transform), < 150 KB/model.
- Dựng bằng code (decor.js Batch) chỉ cho phần nối/khung (nền, vỉa hè, cầu tàu) hoặc khi không có model phù hợp; bo cạnh/ghép nhiều khối, không để hộp trơn.

## Ngân sách hiệu năng (điện thoại)
- Draw call của khu đang nhìn (không kể nhân vật): < 80. Mọi vật lặp lại: InstancedMesh (placeKit) hoặc gộp geometry.
- Chi tiết nhỏ: DetailGrid (decor.js) — chỉ hiện trong ~60 m, không đổ bóng.
- Công trình nhỏ < 1.500 tam giác; cây/đá < 300. Không thêm đèn thật (dùng màu phát sáng). Texture ≤ 512 px.
- Đo bằng renderer.info (autoReset=false, reset trước mỗi khung) — báo trước/sau.

## Quy tắc làm việc
- Chỉ sửa file/khu được giao (xem phân công trong commit/nhắn của phiên chính). Không đổi `layout.js` (vị trí các khu).
- Giữ va chạm (`ctx.boxes`), cửa mini game (`town.doors`), `ctx.decks` hoạt động như cũ.
- Mỗi tính năng 1 commit tiếng Việt, kèm ảnh chụp ban ngày (cận + toàn cảnh).
