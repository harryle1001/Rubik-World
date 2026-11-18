// tools/strip-rig.mjs — Tạo file khung xương nhẹ cho người 3D từ hero-rogue.glb (KayKit, CC0):
//  · bỏ mesh/vật liệu/ảnh (game tự dựng thân người — people-model.js — và xoá mesh gốc ngay khi nạp)
//  · bỏ animation không dùng; giải nén meshopt rồi ghi lại KHÔNG MẤT MÁT: kênh không đổi (≈ 80 %) → 2 khung hình
//    (đầu, cuối — giữ nguyên độ dài clip), kênh động giữ đủ khung hình float32, mảng thời gian trùng nhau dùng chung.
// Chạy: node tools/strip-rig.mjs [vào=client/assets/models/hero-rogue.glb] [ra=client/assets/models/hero-rogue-rig.glb]
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { MeshoptDecoder } = await import(require.resolve('three/examples/jsm/libs/meshopt_decoder.module.js'));
await MeshoptDecoder.ready;
const [IN = 'client/assets/models/hero-rogue.glb', OUT = 'client/assets/models/hero-rogue-rig.glb'] = process.argv.slice(2);
const DROP_ANIMS = new Set(['1H_Melee_Attack_Chop', 'Dodge_Forward']);   // không file nào gọi tới (characters.js NAMES, people-model.js)

const glb = fs.readFileSync(IN);
const jsonLen = glb.readUInt32LE(12), J = JSON.parse(glb.subarray(20, 20 + jsonLen).toString('utf8'));
const binOff = 20 + jsonLen + 8, BIN = glb.subarray(binOff, binOff + glb.readUInt32LE(20 + jsonLen));
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

// đọc 1 accessor ra Float32Array (giải nén meshopt nếu có; chỉ hỗ trợ float — đúng với animation/skin của KayKit)
const bvCache = new Map();
function bvBytes(i) {
  if (bvCache.has(i)) return bvCache.get(i);
  const v = J.bufferViews[i], e = v.extensions && v.extensions.EXT_meshopt_compression; let out;
  if (e) { out = new Uint8Array(e.count * e.byteStride); MeshoptDecoder.decodeGltfBuffer(out, e.count, e.byteStride, BIN.subarray(e.byteOffset, e.byteOffset + e.byteLength), e.mode, e.filter); }
  else out = new Uint8Array(BIN.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength));
  bvCache.set(i, out); return out;
}
function readF(ai) {
  const a = J.accessors[ai]; if (a.componentType !== 5126 || a.sparse) throw new Error('accessor ' + ai + ' không phải float thường');
  const n = NC[a.type], v = J.bufferViews[a.bufferView], e = v.extensions && v.extensions.EXT_meshopt_compression;
  const stride = v.byteStride || (e && e.byteStride) || n * 4, bytes = bvBytes(a.bufferView), dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const out = new Float32Array(a.count * n);
  for (let i = 0; i < a.count; i++) for (let k = 0; k < n; k++) out[i * n + k] = dv.getFloat32((a.byteOffset || 0) + i * stride + k * 4, true);
  return { a, n, data: out };
}

// buffer mới: từng accessor float32 liền nhau, mỗi accessor 1 bufferView
const parts = [], accessors = [], bufferViews = []; let len = 0;
function write(arr, type, withMinMax) {
  const b = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength); bufferViews.push({ buffer: 0, byteOffset: len, byteLength: b.length });
  parts.push(b); len += b.length;
  const acc = { bufferView: bufferViews.length - 1, componentType: 5126, count: arr.length / NC[type], type };
  if (withMinMax) { const n = NC[type], mn = [], mx = []; for (let k = 0; k < n; k++) { let lo = Infinity, hi = -Infinity; for (let i = k; i < arr.length; i += n) { lo = Math.min(lo, arr[i]); hi = Math.max(hi, arr[i]); } mn.push(lo); mx.push(hi); } acc.min = mn; acc.max = mx; }
  accessors.push(acc); return accessors.length - 1;
}
const inputIdx = new Map();   // dùng chung mảng thời gian giống hệt nhau
const inputOf = times => { const k = Array.from(times).join(','); if (!inputIdx.has(k)) inputIdx.set(k, write(Float32Array.from(times), 'SCALAR', true)); return inputIdx.get(k); };

let nConst = 0, nDyn = 0;
const anims = J.animations.filter(a => !DROP_ANIMS.has(a.name)).map(an => {
  const samplers = an.samplers.map(s => {
    if (s.interpolation && s.interpolation !== 'LINEAR' && s.interpolation !== 'STEP') throw new Error('nội suy ' + s.interpolation + ' chưa hỗ trợ');
    const t = readF(s.input).data, o = readF(s.output), n = o.n, cnt = t.length;
    let same = true; for (let i = 1; i < cnt && same; i++) for (let k = 0; k < n; k++) if (o.data[i * n + k] !== o.data[k]) { same = false; break; }
    if (same && cnt > 2) { nConst++; const v = new Float32Array(n * 2); v.set(o.data.subarray(0, n), 0); v.set(o.data.subarray(0, n), n); return { input: inputOf([t[0], t[cnt - 1]]), output: write(v, o.a.type), interpolation: s.interpolation || 'LINEAR' }; }
    nDyn++; return { input: inputOf(t), output: write(o.data, o.a.type), interpolation: s.interpolation || 'LINEAR' };
  });
  return { name: an.name, channels: an.channels, samplers };
});
const skins = (J.skins || []).map(s => Object.assign({}, s, s.inverseBindMatrices != null ? { inverseBindMatrices: write(readF(s.inverseBindMatrices).data, 'MAT4') } : {}));
for (const n of J.nodes) { delete n.mesh; delete n.skin; }   // chỉ còn xương (skin giữ lại để GLTFLoader vẫn đánh dấu nút là Bone)

const out = {
  asset: Object.assign({}, J.asset, { extras: { note: 'Khung xương + animation rút từ hero-rogue.glb (KayKit, CC0) bằng tools/strip-rig.mjs' } }),
  scene: J.scene, scenes: J.scenes, nodes: J.nodes, skins, animations: anims, accessors, bufferViews, buffers: [{ byteLength: len }],
};
const pad4 = n => (n + 3) & ~3;
let js = Buffer.from(JSON.stringify(out), 'utf8'); js = Buffer.concat([js, Buffer.alloc(pad4(js.length) - js.length, 0x20)]);
let bin = Buffer.concat(parts); bin = Buffer.concat([bin, Buffer.alloc(pad4(bin.length) - bin.length)]);
const total = 12 + 8 + js.length + 8 + bin.length, h = Buffer.alloc(12);
h.writeUInt32LE(0x46546c67, 0); h.writeUInt32LE(2, 4); h.writeUInt32LE(total, 8);
const ch = (l, type) => { const b = Buffer.alloc(8); b.writeUInt32LE(l, 0); b.writeUInt32LE(type, 4); return b; };
fs.writeFileSync(OUT, Buffer.concat([h, ch(js.length, 0x4e4f534a), js, ch(bin.length, 0x004e4942), bin]));
console.log(`${IN} ${glb.length} B → ${OUT} ${total} B · ${anims.length} animation · kênh hằng ${nConst} / động ${nDyn} · ${accessors.length} accessor`);
