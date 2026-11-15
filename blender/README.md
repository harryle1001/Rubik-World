# Nhân vật trong Blender

`nhan-vat.blend` có đủ 15 nhân vật, trông giống hệt trong game: 12 học sinh để người chơi chọn, thêm cô giáo mặc áo dài, thầy giáo và bác bảo vệ.

- Mỗi nhân vật có 1 bộ xương (armature) và nằm trong 1 collection riêng, đặt tên theo nhân vật.
- Có sẵn khoảng 30 animation của mỗi nhân vật trong Action Editor: idle, walk, sprint, jump, sit, emote-yes…
- Áo sơ mi trắng và quần xanh được tô bằng màu theo đỉnh (Color Attribute). Khăn quàng, cặp, nơ, kính là các khối nhỏ gắn vào xương.

## Mở và sửa
1. Cài Blender 4.2 trở lên (miễn phí: blender.org).
2. Mở `blender/nhan-vat.blend`. Ảnh xem trước: `nhan-vat-preview.png`.
3. Sửa màu: chọn mesh, vào Vertex Paint để tô lại, hoặc sửa Material.
4. Sửa dáng: vào Edit Mode. Giữ dưới 1.500 tam giác mỗi nhân vật để chạy mượt trên điện thoại.
5. Sửa xong, lưu file rồi gửi lại cho Claude để đưa vào game.

## Tạo lại file (cho lập trình viên)
1. Chạy server: `node server/index.js`
2. Xuất nhân vật ra .glb: `node scripts/blender/export-chars.js`. File .glb nằm trong `chars/`.
3. Dựng file .blend bằng Blender (hoặc gói `bpy`):
   `blender -b -P scripts/blender/mkblend.py -- blender/nhan-vat.blend`
