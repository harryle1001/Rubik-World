#!/usr/bin/env bash
# Đóng gói Đảo Rubik 3D (game duy nhất — không chép game 2D lưu trữ client/school/) thành thư mục tĩnh để đăng lên Claude Artifact (link game).
# Dùng: bash scripts/build-artifact.sh <thư-mục-ra>. Model .glb đổi đuôi .wasm (artifact không phục vụ .glb), three.js lấy từ jsdelivr.
set -e
R=$(cd "$(dirname "$0")/.." && pwd); B=$1; CDN=https://cdn.jsdelivr.net/npm/three@0.169.0
rm -rf $B; mkdir -p $B/js && cp -r $R/client/js/island $R/client/js/vendor $R/client/js/ocean.js $B/js/ && cp -r $R/client/icons $B/icons && cp -r $R/client/assets $B/ && cp $R/client/ocean.html $B/index.html
cd $B
sed -i "/rel=\"preload\" href=\"\/assets\/models\//d" index.html
sed -i "s#\"/lib/three/build/three.module.js\"#\"$CDN/build/three.module.js\"#; s#\"/lib/three/examples/jsm/\"#\"$CDN/examples/jsm/\"#; s#src=\"/js/ocean.js\"#src=\"js/ocean.js\"#" index.html
sed -i "s#'/lib/three/examples/jsm/libs/draco/gltf/'#'$CDN/examples/jsm/libs/draco/gltf/'#" js/island/models.js
# Gộp mọi model .glb thành vài gói ≤ 14 MB (artifact giới hạn số file và không phục vụ .glb), models.js đọc theo chỉ mục
python3 - <<'PY'
import os, json
root='assets/models'; files=sorted(os.path.join(d,f) for d,_,fs in os.walk(root) for f in fs if f.endswith('.glb'))
idx={}; packs=[]; cur=bytearray(); LIM=14*1024*1024
for p in files:
    b=open(p,'rb').read()
    if cur and len(cur)+len(b)>LIM: packs.append(cur); cur=bytearray()
    idx[os.path.relpath(p,root)[:-4]]=[len(packs),len(cur),len(b)]; cur+=b; os.remove(p)
if cur: packs.append(cur)
for i,pk in enumerate(packs): open(f'{root}/pack{i}.wasm','wb').write(pk)
json.dump(idx,open(f'{root}/pack.json','w'))
for d,_,fs in list(os.walk(root,topdown=False)):
    if not os.listdir(d): os.rmdir(d)
src=open('js/island/models.js').read()
helper='''
// [bản đóng gói] model nằm trong các gói assets/models/pack*.wasm, chỉ mục pack.json
const PACK = { idx: null, bufs: {} };
function packLoad(name, onLoad, _p, onErr) {
  (PACK.idx ||= fetch('assets/models/pack.json').then(r => r.json())).then(idx => {
    const e = idx[name]; if (!e) throw new Error('không có ' + name);
    return (PACK.bufs[e[0]] ||= fetch('assets/models/pack' + e[0] + '.wasm').then(r => r.arrayBuffer())).then(b => loader.parse(b.slice(e[1], e[1] + e[2]), '', onLoad, onErr));
  }).catch(onErr);
}
'''
src=src.replace("const cache = new Map();", helper+"const cache = new Map();",1)
src=src.replace("loader.load(`/assets/models/${name}.glb`,","packLoad(name,")
assert 'loader.load(`/assets' not in src and src.count('packLoad(name,')==3, 'patch models.js failed'
open('js/island/models.js','w').write(src)
PY
sed -i "s#'/assets/audio/#'assets/audio/#g" js/island/audio.js;
# Nhân vật anime VRM: chỉ gói mẫu dùng trong game (vrm-core.js BASES + vrm-hair.js HAIRS), đổi đuôi .vrm → .wasm (artifact không phục vụ .vrm), đường dẫn tương đối
for f in assets/vrm/*/*.vrm; do case "$(basename $f .vrm)" in victoria|vivi|shino|hair-m|fumiriya|shibu|dshibu|vita) mv "$f" "${f%.vrm}.wasm";; *) rm "$f";; esac; done
sed -i 's#`/assets/vrm/${set}/${id}.vrm`#`assets/vrm/${set}/${id}.wasm`#g; s#'"'"'/assets/vrm/'"'"'#'"'"'assets/vrm/'"'"'#' js/island/vrm/vrm-core.js
grep -q 'assets/vrm/${set}/${id}.wasm' js/island/vrm/vrm-core.js || { echo "LỖI: chưa vá đường dẫn VRM trong vrm-core.js"; exit 1; }
# đường dẫn tuyệt đối còn lại (âm thanh tàu, texture, logo, chess.js) → tương đối / CDN
grep -rlE "['\"\`]/(assets|icons)/" js index.html | xargs sed -i -E "s#(['\"\`])/(assets|icons)/#\1\2/#g"
sed -i "s#'/lib/chess.js'#'https://cdn.jsdelivr.net/npm/chess.js@0.10.3/chess.min.js'#" js/island/mg/board/chess.js
sed -i "s#navigator.serviceWorker.register('/sw.js')#Promise.reject()#" js/ocean.js
SHIM='<script>try { localStorage.getItem("x"); } catch (e) { const m = {}; try { Object.defineProperty(window, "localStorage", { value: { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } } }); } catch (e2) {} }</script>'
python3 - "$SHIM" <<'PY'
import sys
s=open('index.html').read(); i=s.find('>', s.find('<head'))+1; open('index.html','w').write(s[:i]+sys.argv[1]+s[i:])
PY
grep -rnE "['\"\`]/(assets|lib)/" js index.html | grep -v socket || true
find . -type f | wc -l; du -sh .
