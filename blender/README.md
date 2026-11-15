# Nhân vật trong Blender

`nhan-vat.blend` có đủ 15 nhân vật, trông giống hệt trong game: 12 học sinh để người chơi chọn, thêm cô giáo mặc áo dài, thầy giáo và bác bảo vệ.

- Mỗi nhân vật có 1 bộ xương (armature) và nằm trong 1 collection riêng, đặt tên theo nhân vật.
- Có sẵn 16 animation (KayKit, đã chỉnh theo dáng mới) trong Action Editor: Idle, Walking_A, Running_A, Jump_Idle, Cheer, Sit_Chair, Head_No…
- Nhân vật dáng Zelda dựng bằng khối low-poly (client/js/island/people-model.js), màu theo đỉnh (Color Attribute), mỗi khối gắn cứng vào 1 xương.

## Mở và sửa
1. Cài Blender 4.2 trở lên (miễn phí: blender.org).
2. Mở `blender/nhan-vat.blend`. Ảnh xem trước: `nhan-vat-preview.png`.
3. Sửa màu: chọn mesh, vào Vertex Paint để tô lại, hoặc sửa Material.
4. Sửa dáng: vào Edit Mode. Giữ dưới 3.000 tam giác mỗi nhân vật để chạy mượt trên điện thoại.
5. Sửa xong, lưu file rồi gửi lại cho Claude để đưa vào game.

## Tạo lại file (cho lập trình viên)
1. Chạy server: `node server/index.js`
2. Xuất nhân vật ra .glb: `node scripts/blender/export-chars.js`. File .glb nằm trong `chars/`.
3. Dựng file .blend bằng Blender (hoặc gói `bpy`):
   `blender -b -P scripts/blender/mkblend.py -- blender/nhan-vat.blend`
