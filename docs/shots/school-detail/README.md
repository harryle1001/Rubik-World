# Trường Rubik chi tiết (nhánh claude/school-detail)

Ảnh: máy tính 1280×720 và điện thoại 390×844 (`*-mobile.jpg`), không lỗi console.

| Thư mục | Nội dung |
|---|---|
| `1-noi-that/` | Toà học tập 3 tầng (vào qua cửa Văn phòng): sảnh, thư viện, cầu thang, lớp 5B, thí nghiệm, âm nhạc, máy tính |
| `2-tiet-hoc/` | Tiết học theo thời khoá biểu đúng phòng: cô đứng bảng, 13 bạn ngồi bàn, câu đố tại chỗ; giờ trưa ở căng tin |
| `3-san-truong/` | Vườn rau học sinh trồng (tưới → thu hoạch ⭐), nhà xe đạp, toàn cảnh sân |
| `4-hieu-nang/` | Điểm đo draw call |

## Draw call (renderer.info, 1 khung)

| Điểm | Gốc (66f40f5) máy tính / điện thoại | Sau máy tính / điện thoại |
|---|---|---|
| Cổng trường | 344 / 182 | 346 / 183 |
| Sân chào cờ | 248 / 204 | 252 / 210 |
| Cửa Văn phòng | 209 / 203 | 215 / 204 |
| Vườn trường | 176 / 140 | 196 / 166 |
| Trong lớp 5A có tiết (14 người) | — | 90 / 64 |
| Căng tin giờ trưa | — | 80 / 70 |

Điện thoại ≤ 233 mọi điểm. Trong toà chỉ vẽ tầng đang đứng (đảo ở ngoài tầm nhìn 296 m); dựng từng tầng 25–50 ms
(tầng 1 khi bước qua cửa, tầng 2–3 lúc rảnh). Vườn + nhà xe: 1 nhóm, ẩn khi xa > 89 m.
