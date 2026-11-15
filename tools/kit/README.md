# tools/kit — quy trình chuẩn hoá model cho `client/assets/models/kit/`

Cài (ngoài repo): `npm i @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer sharp`; Blender dạng thư viện: `pip install bpy` (Python 3.13).

1. FBX/OBJ/.blend → GLB: `python blend2glb.py in.fbx out.glb …`
2. Chuẩn hoá: `node process.mjs list.tsv outDir 128` — mỗi dòng TSV: `src  tên  nguồn  mô-tả  [tỉ lệ giản lược]  [fit, vd y1.2 = cao 1.2 m]`; `STRIP=1` bỏ normal/ORM map. Gộp mesh, texture ≤ N px, nén Meshopt, ghi `_meta.json`.
3. Đổi màu bảng màu (vd mái ngói cam): `node recolor.mjs in.glb out.glb x0 y0 x1 y1 '#d9683f'`.
4. Model tự dựng: `python make_props.py -- outDir`.
5. Catalog: `node measure.mjs <kitDir> _meta.json kitmeta.json && python3 catalog.py kitmeta.json <repo>` → `docs/kit-catalog.md`, `client/tools/kit-list.json`; ảnh: chạy server rồi `node shot.cjs "http://localhost:3000/tools/kit-preview.html?cols=16&cell=140" docs/shots/assets/catalog.png`.
