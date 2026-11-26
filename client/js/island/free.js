// free.js — trả bộ nhớ GPU khi dỡ một khu/nhóm (vật đã gỡ mà chưa dispose: JS dọn được nhưng GPU giữ mãi).
// freeTex: mọi texture trong vật liệu/uniform của nhóm, trừ texture dùng chung (userData.shared: bộ đệm model, gradientMap toon).
// Lỡ dispose texture còn dùng ở nơi khác vẫn an toàn: three tự tải lại lên GPU lần vẽ sau.
export function freeTex(root) {
  if (!root) return;
  const seen = new Set();
  root.traverse(o => {
    const ms = o.material; if (!ms) return;
    for (const m of Array.isArray(ms) ? ms : [ms]) {
      if (!m || seen.has(m)) continue; seen.add(m);
      const drop = t => { if (t && t.isTexture && !seen.has(t) && !t.userData.shared && !t.isRenderTargetTexture) { seen.add(t); t.dispose(); } };
      for (const k in m) drop(m[k]);
      if (m.uniforms) for (const k in m.uniforms) drop(m.uniforms[k] && m.uniforms[k].value);
    }
  });
}

// dỡ cả nhóm: lưới (trừ lưới dùng chung: userData.shared — bộ đệm model, người) + texture xương + texture như trên
export function freeAll(root) {
  if (!root) return;
  root.traverse(o => { const g = o.geometry; if (g && g.isBufferGeometry && !g.userData.shared) g.dispose(); if (o.isSkinnedMesh && o.skeleton && o.skeleton.boneTexture) o.skeleton.dispose(); });   // + texture xương (máy có texture xương)
  freeTex(root);
}
