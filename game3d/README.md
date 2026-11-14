# Thế Giới Rubik 3D (dự án riêng)

Game thế giới mở 3D cho học sinh, low poly, chạy trên trình duyệt (cả điện thoại). Không cần cài gì: three.js đã có sẵn trong `lib/`.

- Chạy cùng server của website: `npm start` rồi mở `http://localhost:3000/game3d/`
- Hoặc đưa nguyên thư mục `game3d/` lên bất kỳ host tĩnh nào (cần https hoặc localhost để chạy module JS).

## Sửa ở đâu
| Muốn sửa | Mở file |
|---|---|
| Tốc độ, màu, số lượng cây, vị trí khu, giá đổi khối | `js/config.js` |
| Địa hình, sông, cầu, bầu trời, ánh sáng theo giờ, sương, mây, chim, tiếng gió/chim | `js/world.js` |
| Hình dáng công trình, câu hỏi mini game, phần thưởng | `js/buildings.js` |
| Cây, cỏ, hoa, đá, bướm, chặt cây/cây mọc lại | `js/nature.js` |
| Đèn đường, ghế đá, biển chỉ đường, hàng rào, xe đạp | `js/props.js` |
| Nhân vật, điều khiển, joystick, camera, đạp xe | `js/player.js` |
| Túi đồ, đổi gỗ lấy khối | `js/inventory.js` |
| Xây bằng khối gỗ (xem trước, xoay, đặt, gỡ, lưu) | `js/building-system.js` |
| Vòng sáng ở lối vào, hiện tên khu, chuyển cảnh | `js/portals.js` |
| Nút trên màn hình, vòng lặp, tự giảm chất lượng khi máy chậm | `js/main.js` |
| Giao diện (màu, nút, bảng) | `css/style.css` |

## Thêm khu mới
Thêm 1 dòng vào `AREAS` trong `js/config.js`, ví dụ:
```js
{ id: 'music', name: 'Nhà Âm Nhạc', sub: 'Học Nốt Nhạc', style: 'nordic', game: 'math', x: -20, z: -100 },
```
Vòng sáng, đường đi, cầu (nếu đường cắt sông), đèn đường và biển chỉ đường tự được tạo theo.

## Điều khiển
- Máy tính: WASD/mũi tên đi · Shift chạy · Space nhảy · kéo chuột xoay camera · lăn chuột zoom · F chặt cây · B lên/xuống xe đạp · I túi đồ · X xây (1–8 chọn khối, R xoay, Enter/bấm chuột đặt, Q gỡ).
- Điện thoại: chạm và kéo nửa trái màn hình để đi (joystick ảo) · vuốt nửa phải để xoay camera · chụm 2 ngón để zoom · nút 🏃 Chạy, 🪓 Chặt, 🚲 Lên xe.
