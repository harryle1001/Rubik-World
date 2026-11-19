// tools/vrm-slim.mjs — Rút gọn VRM (0.x/1.0) mà KHÔNG làm mất phần mở rộng VRM
// (gltf-transform xoá extension lạ nên không dùng trực tiếp được).
// Giữ nguyên mọi chỉ số node/mesh/material/texture; chỉ thay dữ liệu bufferView:
//  - texture: thu về tối đa --tex px (PNG nếu có trong suốt, JPEG nếu không)
//  - tam giác: meshoptimizer simplify theo --ratio (giữ viền, bỏ qua lưới có morph khi --keep-morph)
// Chạy: node tools/vrm-slim.mjs in.vrm out.vrm --tex=512 --ratio=0.5 [--keep-morph]
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sharp = require('sharp');
const { MeshoptSimplifier } = require('meshoptimizer');

const [, , IN, OUT, ...opt] = process.argv;
const arg = (k, d) => { const a = opt.find(o => o.startsWith('--' + k + '=')); return a ? +a.split('=')[1] : d; };
const TEX = arg('tex', 1024), RATIO = arg('ratio', 1), KEEP_MORPH = opt.includes('--keep-morph');

const glb = fs.readFileSync(IN);
const jlen = glb.readUInt32LE(12), json = JSON.parse(glb.subarray(20, 20 + jlen).toString('utf8'));
const binStart = 20 + jlen + 8, bin = glb.subarray(binStart, binStart + glb.readUInt32LE(20 + jlen));
const views = json.bufferViews.map(v => bin.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength));
const useCount = new Map();
json.accessors.forEach(a => a.bufferView != null && useCount.set(a.bufferView, (useCount.get(a.bufferView) || 0) + 1));
const setView = (i, buf) => { views[i] = buf; json.bufferViews[i].byteLength = buf.length; delete json.bufferViews[i].byteStride; };
const addView = buf => { json.bufferViews.push({ buffer: 0, byteLength: buf.length }); views.push(buf); return json.bufferViews.length - 1; };

// 1) Texture
for (const img of json.images || []) {
  if (img.bufferView == null) continue;
  const src = sharp(views[img.bufferView]), m = await src.metadata();
  let alpha = false;
  if (m.hasAlpha) { const s = await sharp(views[img.bufferView]).stats(); alpha = s.channels[3] && s.channels[3].min < 250; }
  const p = sharp(views[img.bufferView]).resize({ width: Math.min(TEX, m.width), height: Math.min(TEX, m.height), fit: 'inside' });
  const out = alpha ? await p.png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer() : await p.flatten().jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  setView(img.bufferView, out); img.mimeType = alpha ? 'image/png' : 'image/jpeg';
}

// 2) Tam giác
await MeshoptSimplifier.ready;
const readAcc = (a, Type) => {
  const v = json.bufferViews[a.bufferView], buf = views[a.bufferView], n = { 5125: 4, 5123: 2, 5121: 1, 5126: 4 }[a.componentType];
  const comps = { SCALAR: 1, VEC3: 3 }[a.type], stride = v.byteStride || n * comps, out = new Type(a.count * comps);
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  for (let i = 0; i < a.count; i++) for (let c = 0; c < comps; c++) {
    const o = (a.byteOffset || 0) + i * stride + c * n;
    out[i * comps + c] = a.componentType === 5126 ? dv.getFloat32(o, true) : n === 4 ? dv.getUint32(o, true) : n === 2 ? dv.getUint16(o, true) : dv.getUint8(o);
  }
  return out;
};
let before = 0, after = 0;
if (RATIO < 1) for (const mesh of json.meshes) for (const pr of mesh.primitives) {
  if (pr.indices == null || (pr.mode ?? 4) !== 4) continue;
  const ia = json.accessors[pr.indices]; before += ia.count / 3;
  if (KEEP_MORPH && pr.targets && pr.targets.length) { after += ia.count / 3; continue; }
  const idx = readAcc(ia, Uint32Array), pos = readAcc(json.accessors[pr.attributes.POSITION], Float32Array);
  const target = Math.max(3, Math.floor(idx.length * RATIO / 3) * 3);
  const [res] = MeshoptSimplifier.simplify(idx, pos, 3, target, 0.02, ['LockBorder']);
  const out = Buffer.from(new Uint32Array(res).buffer);
  if (useCount.get(ia.bufferView) === 1) setView(ia.bufferView, out); else ia.bufferView = addView(out);
  ia.byteOffset = 0; ia.componentType = 5125; ia.count = res.length; delete ia.min; delete ia.max;
  after += res.length / 3;
}

// 3) Nén meshopt từng bufferView đỉnh/chỉ số (--meshopt): bufferView trỏ vào buffer 1 (fallback rỗng),
//    dữ liệu nén nằm ở buffer 0 (BIN). Cần GLTFLoader.setMeshoptDecoder khi nạp.
const MESHOPT = opt.includes('--meshopt'), comp = new Map();
if (MESHOPT) {
  const { MeshoptEncoder } = require('meshoptimizer'); await MeshoptEncoder.ready;
  const info = new Map(), bad = new Set(), idxOf = new Set(json.meshes.flatMap(m => m.primitives.map(p => p.indices)).filter(i => i != null));
  const SZ = { 5126: 4, 5125: 4, 5123: 2, 5122: 2, 5121: 1, 5120: 1 }, NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  json.accessors.forEach((a, ai) => {
    if (a.sparse) { if (a.bufferView != null) bad.add(a.bufferView); [a.sparse.indices.bufferView, a.sparse.values.bufferView].forEach(v => bad.add(v)); }
    if (a.bufferView == null) return;
    const v = json.bufferViews[a.bufferView], el = SZ[a.componentType] * NC[a.type], stride = v.byteStride || el;
    const isIdx = idxOf.has(ai), k = { stride: isIdx ? SZ[a.componentType] : stride, count: isIdx ? a.count : Math.floor(v.byteLength / stride), isIdx };
    if (info.has(a.bufferView)) { const o = info.get(a.bufferView); if (o.stride !== k.stride || o.isIdx !== isIdx) bad.add(a.bufferView); } else info.set(a.bufferView, k);
  });
  for (const [vi, k] of info) {
    if (bad.has(vi)) continue;
    const src = new Uint8Array(views[vi].buffer, views[vi].byteOffset, views[vi].byteLength);
    let enc, mode;
    if (k.isIdx) { if (k.count % 3 || k.count * k.stride !== src.length) continue; enc = MeshoptEncoder.encodeIndexBuffer(src, k.count, k.stride); mode = 'TRIANGLES'; }
    else { if (k.stride % 4 || k.stride > 256 || k.count * k.stride !== src.length) continue; enc = MeshoptEncoder.encodeVertexBufferLevel(src, k.count, k.stride, 2, 0); mode = 'ATTRIBUTES'; }   // v0: bộ giải mã của three 0.169
    comp.set(vi, { enc: Buffer.from(enc), stride: k.stride, count: k.count, mode });
  }
}

// 4) Ghép lại GLB
let off = 0, foff = 0; const parts = [];
const put = b => { const pad = (4 - (off % 4)) % 4; if (pad) { parts.push(Buffer.alloc(pad)); off += pad; } const at = off; parts.push(b); off += b.length; return at; };
views.forEach((b, i) => {
  const bv = json.bufferViews[i], c = comp.get(i);
  if (!c) { bv.buffer = 0; bv.byteOffset = put(b); return; }
  foff += (4 - (foff % 4)) % 4; bv.buffer = 1; bv.byteOffset = foff; foff += b.length;
  bv.extensions = { EXT_meshopt_compression: { buffer: 0, byteOffset: put(c.enc), byteLength: c.enc.length, byteStride: c.stride, count: c.count, mode: c.mode } };
});
const newBin = Buffer.concat(parts, off), binPad = Buffer.alloc((4 - (newBin.length % 4)) % 4);
json.buffers = [{ byteLength: newBin.length + binPad.length }];
if (comp.size) {
  json.buffers.push({ byteLength: foff, extensions: { EXT_meshopt_compression: { fallback: true } } });
  for (const k of ['extensionsUsed', 'extensionsRequired']) json[k] = [...new Set([...(json[k] || []), 'EXT_meshopt_compression'])];
}
let js = Buffer.from(JSON.stringify(json)); js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
const head = Buffer.alloc(12), jh = Buffer.alloc(8), bh = Buffer.alloc(8);
const total = 12 + 8 + js.length + 8 + newBin.length + binPad.length;
head.write('glTF', 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(total, 8);
jh.writeUInt32LE(js.length, 0); jh.write('JSON', 4); bh.writeUInt32LE(newBin.length + binPad.length, 0); bh.write('BIN\0', 4);
fs.writeFileSync(OUT, Buffer.concat([head, jh, js, bh, newBin, binPad]));
console.log(JSON.stringify({ in: IN.split('/').pop(), kb: Math.round(total / 1024), tris: RATIO < 1 ? [Math.round(before), Math.round(after)] : null }));
