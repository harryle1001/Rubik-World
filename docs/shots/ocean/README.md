# Mặt biển (ocean-water.js) — ảnh & số đo

Ảnh 960×600 (Chromium swiftshader): bờ ban ngày · khơi · nhìn xuống nước nông (caustics đáy cát) · hoàng hôn (vệt nắng) · đêm · dưới nước (cửa sổ Snell, dive.js).

| Đo (desktop, 640×400, swiftshader) | Bản chính (nước phẳng) | Biển mới |
|---|---|---|
| Draw call trước cổng trường | 305 | 305 (không đổi) |
| Draw call mặt nước | 1 | 1 (+1 đáy biển nối dài) |
| Tam giác mặt nước | 2 | 15 753 (điện thoại ~5 900: 55 cạnh) |
| Thời gian vẽ riêng mặt nước | 3,3 ms | ≈ 10–11 ms (CPU giả lập; GPU thật nhẹ hơn nhiều) |
| Lỗi console | 0 | 0 |

Điện thoại / mức chất lượng ≥ 2: 3 sóng thay vì 5, shader `LOW` (bỏ bọt đỉnh sóng, lấp lánh, 2 lớp gợn nhỏ).
