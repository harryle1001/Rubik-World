// node process.mjs list.tsv outDir  — list.tsv: srcPath \t outName \t source \t desc
import fs from 'fs'; import path from 'path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, flatten, join, weld, textureCompress, meshopt, unpartition, getBounds, palette } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';

await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const [, , listFile, outDir, maxTex = '512'] = process.argv;
const rows = fs.readFileSync(listFile, 'utf8').split('\n').filter(l => l.trim() && !l.startsWith('#')).map(l => l.split('\t'));
const meta = fs.existsSync(path.join(outDir, '_meta.json')) ? JSON.parse(fs.readFileSync(path.join(outDir, '_meta.json'))) : {};
for (const [src, name, source, desc] of rows) {
  try {
    const doc = await io.read(src);
    const root = doc.getRoot();
    for (const a of root.listAnimations()) a.dispose();
    for (const s of root.listSkins()) s.dispose();
    await doc.transform(dedup(), flatten(), join({ keepNamed: false }), weld(), prune(),
      textureCompress({ encoder: sharp, resize: [+maxTex, +maxTex], targetFormat: 'png' }),
      dedup(), prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }), unpartition());
    root.listBuffers().slice(1).forEach(b => b.dispose());
    const scene = root.getDefaultScene() || root.listScenes()[0];
    const b = getBounds(scene);
    let tris = 0;
    for (const m of root.listMeshes()) for (const p of m.listPrimitives()) { const i = p.getIndices(); tris += (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3; }
    const tex = root.listTextures().map(t => { const s = t.getSize(); return s ? s.join('x') : '?'; });
    const out = path.join(outDir, name + '.glb');
    await io.write(out, doc);
    const bytes = fs.statSync(out).size;
    meta[name] = { size: b.max.map((v, i) => +(v - b.min[i]).toFixed(2)), tris: Math.round(tris), kb: +(bytes / 1024).toFixed(1), mats: root.listMaterials().length, tex, source, desc };
    console.log((bytes > 150 * 1024 ? 'BIG ' : 'ok  ') + name, meta[name].size.join('x'), meta[name].tris, meta[name].kb + 'KB', tex.join(','));
  } catch (e) { console.log('ERR', name, src, e.message); }
}
fs.writeFileSync(path.join(outDir, '_meta.json'), JSON.stringify(meta, null, 1));
