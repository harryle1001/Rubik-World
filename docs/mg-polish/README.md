# Mini game 3D — đo trước/sau (claude/mg-polish)
Đo bằng Playwright + Chromium headless (SwiftShader, nên chỉ so sánh tương đối). "Game" = draw call riêng của khu chơi (bật − tắt api.root). "Rò lần 2" = geometry/texture còn lại sau lần vào–thoát thứ 2.

| Game | Trước | Sau |
|---|---|---|
| Cờ vua | 78 draw call riêng, 73 mesh; AI tính liền 0,5–2 s (khựng hình) | 39 draw call, 42 mesh (32 quân → 1 BatchedMesh); AI nhường khung giữa các nước gốc |
| Xưởng Mỹ thuật & Âm nhạc | rò 41 texture/lần vào | rò 1 |
| Thư viện | rò 13 texture/lần vào | rò 0 |
| Kính thiên văn | sân không hiện (lỗi chú thích), la bàn 8 mesh + 8 texture | sân hiện, la bàn 1 mesh + 1 texture |
| Olympics / Câu cá / Arcade | chip điểm ghi innerHTML mỗi khung; tạo mảng 99 số mỗi lần khối trồi | chỉ ghi khi chữ đổi; mảng tính sẵn |
| Cờ vua/caro/vây/Rubik/Thiên văn | đồng hồ ghi DOM mỗi khung | ghi khi đổi giây |

Ảnh điện thoại 390×844: `*-m.png` trong thư mục này. Không lỗi console.
