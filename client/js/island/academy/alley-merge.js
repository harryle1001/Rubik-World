// academy/alley-merge.js — GỘP MODEL CC0 TĨNH THÀNH ÍT DRAW CALL cho Phố Phép Thuật.
// mergeModels(list, root) — list: Map(tên model → [{ m: Matrix4, c: Color }]) (hoặc { geo: BufferGeometry, col } cho hình phụ trợ).
// Mọi phần dùng chung 1 texture (vd. colormap Kenney Fantasy Town) → 1 lưới; phần không texture → 1 lưới màu đỉnh.
// Màu nhuộm từng bản sao + màu vật liệu gốc → thuộc tính màu đỉnh; toạ độ UV đã nhân sẵn phép biến đổi texture (meshopt).
// opts.shadow(tên) → true: lưới đổ bóng riêng (tường/mái), còn lại không đổ bóng. Trả về mảng Mesh đã thêm vào root.
import * as THREE from 'three';
import { loadModel } from '../models.js';

const hashCv = document.createElement('canvas'); hashCv.width = hashCv.height = 8;
function texKey(map) {                       // nhận dạng ảnh texture bằng 8×8 điểm ảnh (texture trùng nhau giữa các file .glb)
  if (map.userData.mk) return map.userData.mk;
  let k = 'u' + map.uuid;
  try { const g = hashCv.getContext('2d', { willReadFrequently: true }); g.clearRect(0, 0, 8, 8); g.drawImage(map.image, 0, 0, 8, 8); k = (map.image.width || 0) + ':' + Array.from(g.getImageData(0, 0, 8, 8).data).join(','); } catch (e) {}
  return (map.userData.mk = k);
}

export async function mergeModels(list, root, opts = {}) {
  const names = [...list.keys()], srcs = await Promise.all(names.map(n => (list.get(n).geo ? null : loadModel(n))));
  const groups = new Map();                   // khoá → { mat, parts: [{ geo, mw, items, base, uvm }] }
  const add = (key, mat, part) => { if (!groups.has(key)) groups.set(key, { mat, parts: [] }); groups.get(key).parts.push(part); };
  names.forEach((name, i) => {
    const L = list.get(name), sh = opts.shadow ? !!opts.shadow(name) : false;
    if (L.geo) { add('flat' + sh, null, { geo: L.geo, mw: new THREE.Matrix4(), items: L.items, base: new THREE.Color(L.col || '#fff'), sh }); return; }
    const src = srcs[i]; if (!src) return;
    src.updateMatrixWorld(true);
    if (L.fit) {                              // L.fit = chiều cao mong muốn (m): chuẩn hoá cỡ, đặt đáy model ở gốc, tâm giữa
      const b = new THREE.Box3().setFromObject(src), k = L.fit / Math.max(1e-4, b.max.y - b.min.y), c = b.getCenter(new THREE.Vector3());
      src.position.set(-c.x * k, -b.min.y * k, -c.z * k); src.scale.setScalar(k); src.updateMatrixWorld(true);
    }
    src.traverse(o => {
      if (!o.isMesh) return;
      const mat = o.material, map = mat.map;
      let uvm = null; if (map) { map.updateMatrix(); uvm = map.matrix.clone(); }
      add((map ? 'tex' + texKey(map) : 'flat') + sh, map ? mat : null, { name, geo: o.geometry, mw: o.matrixWorld.clone(), items: L, base: mat.color.clone(), uvm, sh });
    });
  });
  const out = [], M = new THREE.Matrix4(), N = new THREE.Matrix3(), v = new THREE.Vector3(), n = new THREE.Vector3(), uv = new THREE.Vector3(), col = new THREE.Color();
  for (const [key, G] of groups) {
    let nv = 0, ni = 0;
    for (const p of G.parts) { const c = p.geo.attributes.position.count, k = p.geo.index ? p.geo.index.count : c; nv += c * p.items.length; ni += k * p.items.length; }
    if (!nv) continue;
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), clr = new Float32Array(nv * 3), uvs = G.mat ? new Float32Array(nv * 2) : null;
    const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    let ov = 0, oi = 0;
    for (const p of G.parts) {
      const P = p.geo.attributes.position, VC = p.geo.attributes.color, Nn = p.geo.attributes.normal, U = p.geo.attributes.uv, I = p.geo.index, cnt = P.count;
      for (const it of p.items) {
        M.multiplyMatrices(it.m, p.mw); N.getNormalMatrix(M);
        col.copy(p.base); if (it.c) col.multiply(it.c);
        for (let j = 0; j < cnt; j++) {
          const o3 = (ov + j) * 3; v.fromBufferAttribute(P, j).applyMatrix4(M); pos[o3] = v.x; pos[o3 + 1] = v.y; pos[o3 + 2] = v.z;
          if (Nn) { n.fromBufferAttribute(Nn, j).applyMatrix3(N).normalize(); nor[o3] = n.x; nor[o3 + 1] = n.y; nor[o3 + 2] = n.z; }
          if (VC) { clr[o3] = col.r * VC.getX(j); clr[o3 + 1] = col.g * VC.getY(j); clr[o3 + 2] = col.b * VC.getZ(j); } else { clr[o3] = col.r; clr[o3 + 1] = col.g; clr[o3 + 2] = col.b; }
          if (uvs && U) { uv.set(U.getX(j), U.getY(j), 1); if (p.uvm) uv.applyMatrix3(p.uvm); uvs[(ov + j) * 2] = uv.x; uvs[(ov + j) * 2 + 1] = uv.y; }
        }
        if (I) for (let j = 0; j < I.count; j++) idx[oi + j] = I.getX(j) + ov; else for (let j = 0; j < cnt; j++) idx[oi + j] = ov + j;
        oi += I ? I.count : cnt; ov += cnt;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(clr, 3));
    if (uvs) geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeBoundingSphere();
    let mat;
    if (G.mat) { mat = G.mat.clone(); mat.color.set(0xffffff); const t = G.mat.map.clone(); t.userData.own = 1; t.offset.set(0, 0); t.repeat.set(1, 1); t.rotation = 0; t.center.set(0, 0); t.updateMatrix(); t.needsUpdate = true; mat.map = t; }
    else mat = opts.flatMat ? opts.flatMat() : new THREE.MeshLambertMaterial();
    mat.vertexColors = true;
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'alley-merged-' + (G.mat ? 'tex' : 'flat') + (G.parts[0].sh ? '-sh' : ''); mesh.userData.models = [...new Set(G.parts.map(p => p.name))];
    mesh.castShadow = G.parts[0].sh; mesh.receiveShadow = true; mesh.matrixAutoUpdate = false;
    root.add(mesh); out.push(mesh);
  }
  return out;
}
