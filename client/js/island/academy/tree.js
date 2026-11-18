// academy/tree.js — CÂY CỔ THỤ BIẾT NÓI ở khuôn viên: mặt trên thân cây, cành cử động, hỏi đáp kiến thức.
// Khung cắm sẵn (index.js đã nối): create(ctx, magic, { toWorld, toLocal, L, Y }) → { build(), unbuild(), update(dt, t) }.
// build(): dựng khi đảo học viện được tải (lại gần < 351 m); unbuild(): giải phóng khi đi xa; update(): mỗi khung khi đảo đã tải.
// Quy tắc: NGUYÊN BẢN (không tên/nhân vật/sinh vật/bố cục của Harry Potter/Hogwarts) · φ/Fibonacci · ít draw call (instancing) · mượt điện thoại.
import * as THREE from 'three';

export function create(ctx, magic, { toWorld, toLocal, L, Y }) {
  let g = null;
  return {
    build() { g = new THREE.Group(); g.name = 'academy-tree'; ctx.scene.add(g); },
    unbuild() { if (!g) return; ctx.scene.remove(g); g.traverse(o => o.geometry && o.geometry.dispose()); g = null; },
    update(dt, t) {},
  };
}
