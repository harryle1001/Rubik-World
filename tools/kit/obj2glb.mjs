// node obj2glb.mjs list.tsv srcDir outDir — OBJ+MTL (màu phẳng, không texture, vd Quaternius Ultimate Nature) → GLB nhẹ cho kit.
// list.tsv: tênNguồn \t tênRa \t số tam giác tối đa \t ghi chú. Cài (ngoài repo): @gltf-transform/core@4 functions@4 extensions@4 meshoptimizer.
// Mỗi vật liệu (Kd) = 1 primitive tên theo vật liệu (terrain.js gán vai trò lá/gỗ/đá theo tên). Giản lược bằng meshopt (gộp đỉnh theo vị trí,
// giữ mép giữa các vật liệu), pháp tuyến phẳng (low-poly), đáy y = 0, tâm XZ = 0, nén Meshopt. Ghi _meta.json (kích thước, tam giác, KB).
import fs from 'fs'; import path from 'path';
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshopt, dedup, prune } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
await MeshoptEncoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const [, , listFile, srcDir, outDir] = process.argv;
const rows = fs.readFileSync(listFile, 'utf8').split('\n').filter(l => l.trim() && !l.startsWith('#')).map(l => l.split('\t'));
const metaFile = path.join(outDir, '_meta.json'), meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile)) : {};

function readObj(name) {
  const obj = fs.readFileSync(path.join(srcDir, name + '.obj'), 'utf8'), mtl = fs.readFileSync(path.join(srcDir, name + '.mtl'), 'utf8');
  const kd = {}; let cur = null;
  for (const l of mtl.split('\n')) { const p = l.trim().split(/\s+/); if (p[0] === 'newmtl') cur = p[1]; else if (p[0] === 'Kd' && cur) kd[cur] = p.slice(1, 4).map(Number); }
  const V = [], mats = new Map(); let m = 'default';
  for (const l of obj.split('\n')) {
    const p = l.trim().split(/\s+/);
    if (p[0] === 'v') V.push(p.slice(1, 4).map(Number));
    else if (p[0] === 'usemtl') m = p[1];
    else if (p[0] === 'f') { if (!mats.has(m)) mats.set(m, []); const ids = p.slice(1).map(s => +s.split('/')[0] - 1); for (let i = 1; i + 1 < ids.length; i++) mats.get(m).push(ids[0], ids[i], ids[i + 1]); }
  }
  return { V, mats, kd };
}

for (const [src, name, maxTris, note] of rows) {
  const { V, mats, kd } = readObj(src);
  const pos = new Float32Array(V.flat());
  let total = 0; for (const t of mats.values()) total += t.length / 3;
  const ratio = Math.min(1, +maxTris / total);
  // bao: đáy y=0, tâm XZ
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (const v of V) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], v[k]); mx[k] = Math.max(mx[k], v[k]); }
  const off = [-(mn[0] + mx[0]) / 2, -mn[1], -(mn[2] + mx[2]) / 2];
  const doc = new Document(), buf = doc.createBuffer(), mesh = doc.createMesh(name);
  let tris = 0;
  for (const [mName, idx0] of mats) {
    // gộp đỉnh trùng vị trí (OBJ đã chia sẵn theo pháp tuyến) rồi giản lược
    const key = new Map(), remap = new Uint32Array(idx0.length), P = [];
    idx0.forEach((v, i) => { const k = V[v].map(a => a.toFixed(5)).join(','); if (!key.has(k)) { key.set(k, P.length / 3); P.push(...V[v]); } remap[i] = key.get(k); });
    const p32 = new Float32Array(P);
    let idx = remap;
    if (ratio < 1) {
      const target = Math.max(12, Math.floor(idx.length * ratio / 3) * 3);
      [idx] = MeshoptSimplifier.simplify(idx, p32, 3, target, 0.08, []);
      if (idx.length > target * 1.3) [idx] = MeshoptSimplifier.simplifySloppy(idx, p32, 3, null, target, 0.2);
    }
    if (!idx.length) continue;
    // bỏ gộp → pháp tuyến phẳng từng mặt
    const n = idx.length, po = new Float32Array(n * 3), no = new Float32Array(n * 3);
    for (let t = 0; t < n; t += 3) {
      const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
      const A = [p32[a], p32[a + 1], p32[a + 2]], B = [p32[b], p32[b + 1], p32[b + 2]], C = [p32[c], p32[c + 1], p32[c + 2]];
      const u = B.map((x, k) => x - A[k]), w = C.map((x, k) => x - A[k]);
      const nn = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], L = Math.hypot(...nn) || 1;
      [A, B, C].forEach((P3, j) => { for (let k = 0; k < 3; k++) { po[(t + j) * 3 + k] = P3[k] + off[k]; no[(t + j) * 3 + k] = nn[k] / L; } });
    }
    tris += n / 3;
    const mat = doc.createMaterial(mName).setBaseColorFactor([...(kd[mName] || [1, 1, 1]), 1]).setRoughnessFactor(1).setMetallicFactor(0);
    const prim = doc.createPrimitive().setMaterial(mat)
      .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(po).setBuffer(buf))
      .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(no).setBuffer(buf));
    mesh.addPrimitive(prim);
  }
  doc.createScene().addChild(doc.createNode(name).setMesh(mesh));
  await doc.transform(dedup(), prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  const out = path.join(outDir, name + '.glb'); await io.write(out, doc);
  meta[name] = { size: mx.map((v, i) => +(v - mn[i]).toFixed(2)), tris, kb: +(fs.statSync(out).size / 1024).toFixed(1), mats: [...mats.keys()], source: 'Quaternius Ultimate Nature Pack (CC0) — ' + src, desc: note || '' };
  console.log(name.padEnd(22), String(tris).padStart(5), 'tam giác', meta[name].kb, 'KB', JSON.stringify(meta[name].size), meta[name].mats.join('/'));
}
fs.writeFileSync(metaFile, JSON.stringify(meta, null, 1));
