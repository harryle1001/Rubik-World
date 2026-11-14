# Quy trình Blender → .glb cho Đảo Rubik 3D

## 1. Làm model trong Blender
- **Low-poly: dưới 5.000 tam giác/model** (xem ở Overlays → Statistics). Cây, đá nên dưới 500.
- Kích thước thật: 1 đơn vị = 1 mét. Gốc (origin) đặt ở **đáy** model (chỗ chạm đất), mặt trước quay về **-Y** trong Blender (thành +Z trong game).
- **1 texture duy nhất 512–1024px** (atlas). Model low-poly kiểu toon chỉ cần màu phẳng: dùng bảng màu nhỏ (palette) rồi UV vào ô màu.
- Vật liệu: Principled BSDF, chỉ dùng Base Color (game tự đổi sang toon).
- Trước khi xuất: chọn model → **Object → Apply → All Transforms**, và **Apply** hết Modifier (Mirror, Subdivision, Bevel…).
- Xoá object thừa (camera, đèn).

## 2. Xuất .glb
File → Export → glTF 2.0:
- Format: **glTF Binary (.glb)**
- Include: Selected Objects
- Transform: +Y Up
- Geometry: Apply Modifiers ✔, UVs ✔, Normals ✔, Vertex Colors nếu có
- Compression: tắt (nén ở bước sau)

Lưu vào `client/assets/models/ten-model.glb` (tên không dấu, nối bằng gạch ngang).

## 3. Nén bằng gltf-transform
```bash
# Meshopt (khuyên dùng: giải nén nhanh trên điện thoại)
npx @gltf-transform/cli meshopt in.glb client/assets/models/ten-model.glb
# hoặc Draco (file nhỏ hơn nữa, giải nén chậm hơn một chút)
npx @gltf-transform/cli draco in.glb client/assets/models/ten-model.glb
# texture: thu nhỏ về 1024 và đổi sang webp
npx @gltf-transform/cli resize in.glb out.glb --width 1024 --height 1024
npx @gltf-transform/cli webp out.glb out.glb
# xem số tam giác, dung lượng
npx @gltf-transform/cli inspect client/assets/models/ten-model.glb
```
Hoặc chạy `npm run models:compress` để nén mọi file trong thư mục bằng Meshopt.

## 4. Dùng trong game
```js
import { loadModel, scatterModel } from './island/models.js';
const den = await loadModel('den');              // 1 bản
scene.add(den);
await scatterModel(scene, 'da', [[x, y, z, scale, rotY], ...]);  // nhiều bản, InstancedMesh
```
Loader đã hỗ trợ sẵn Draco và Meshopt. Model mẫu tự tạo bằng script: `tools/blender/make_assets.py`.
