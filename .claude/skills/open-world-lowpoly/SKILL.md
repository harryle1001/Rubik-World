---
name: open-world-lowpoly
description: Quy chuẩn xây dựng game thế giới mở phong cách Low Poly, tối ưu hóa địa hình, chunk loading và asset 3D.
---

# Nguyên tắc kiến trúc Open World Low Poly

1. **Quản lý bản đồ (World Streaming):**
   - Chia bản đồ thành các Chunk kích thước cố định (ví dụ 64x64m).
   - Chỉ load các Chunk trong bán kính tầm nhìn quanh người chơi, giải phóng bộ nhớ với các Chunk ở xa.
   - Sử dụng Procedural Generation (Simplex/Perlin Noise) để sinh địa hình đồi núi, sông hồ đồng nhất theo Seed.

2. **Đồ họa & Vật liệu Low Poly:**
   - Sử dụng Flat Shading (đổ bóng phẳng) để làm nổi bật các mảng khối đa giác.
   - Không dùng texture nặng; ưu tiên Vertex Colors hoặc một bảng màu (Color Palette Texture) duy nhất cho toàn bộ asset để giảm Draw Calls.
   - Giới hạn số lượng triangle: Cây cối/đá (< 300 tris), Công trình nhỏ (< 1,500 tris), Nhân vật (< 2,500 tris).

3. **Tối ưu hiệu năng (Optimization):**
   - Bắt buộc dùng GPU Instancing / MultiMesh cho cây cỏ, đá và các vật thể lặp lại số lượng lớn.
   - Luôn bật Distance Fog (sương mù theo khoảng cách) để che đi ranh giới load Chunk và tạo chiều sâu không gian.
   - Áp dụng Object Pooling cho NPC, quái vật và hiệu ứng.
