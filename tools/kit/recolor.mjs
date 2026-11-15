// node recolor.mjs in.glb out.glb x0 y0 x1 y1 #hex  — tô lại 1 vùng (tỉ lệ 0..1) của texture bảng màu, giữ độ sáng tương đối
import fs from 'fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const [, , inp, out, ...rest] = process.argv;
const hex = rest.pop(), [x0, y0, x1, y1] = rest.map(Number), tc = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const doc = await io.read(inp);
for (const t of doc.getRoot().listTextures()) {
  const { data, info } = await sharp(Buffer.from(t.getImage())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height; let ref = 0, n = 0;
  const X0 = Math.round(x0 * W), X1 = Math.round(x1 * W), Y0 = Math.round(y0 * H), Y1 = Math.round(y1 * H);
  for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) { const i = (y * W + x) * 4; ref += data[i] + data[i + 1] + data[i + 2]; n++; }
  ref /= n;
  for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) { const i = (y * W + x) * 4, k = (data[i] + data[i + 1] + data[i + 2]) / ref; for (let c = 0; c < 3; c++) data[i + c] = Math.min(255, Math.round(tc[c] * k)); }
  t.setImage(await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer());
}
await io.write(out, doc); console.log('ok', out, fs.statSync(out).size);
