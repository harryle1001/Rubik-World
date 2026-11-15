import fs from 'fs'; import path from 'path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const [, , dir, metaFile, outFile] = process.argv;
const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile)) : {};
const out = {};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.glb')).sort()) {
  const name = f.slice(0, -4); const doc = await io.read(path.join(dir, f)); const root = doc.getRoot();
  const b = getBounds(root.getDefaultScene() || root.listScenes()[0]); let tris = 0;
  for (const m of root.listMeshes()) for (const p of m.listPrimitives()) { const i = p.getIndices(); tris += (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3; }
  out[name] = { size: b.max.map((v, i) => +(v - b.min[i]).toFixed(2)), tris: Math.round(tris), kb: +(fs.statSync(path.join(dir, f)).size / 1024).toFixed(1), anim: root.listAnimations().length, source: meta[name]?.source || '', desc: meta[name]?.desc || '' };
}
fs.writeFileSync(outFile, JSON.stringify(out, null, 1)); console.log(Object.keys(out).length);
