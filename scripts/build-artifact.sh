#!/usr/bin/env bash
# Đóng gói game 3D thành thư mục tĩnh để đăng lên Claude Artifact (link game).
# Dùng: bash scripts/build-artifact.sh <thư-mục-ra>. Model .glb đổi đuôi .wasm (artifact không phục vụ .glb), three.js lấy từ jsdelivr.
set -e
R=$(cd "$(dirname "$0")/.." && pwd); B=$1; CDN=https://cdn.jsdelivr.net/npm/three@0.169.0
rm -rf $B; mkdir -p $B/js && cp -r $R/client/js/island $R/client/js/ocean.js $B/js/ && cp -r $R/client/assets $R/client/school $B/ && cp $R/client/ocean.html $B/index.html
cd $B
sed -i "s#\"/lib/three/build/three.module.js\"#\"$CDN/build/three.module.js\"#; s#\"/lib/three/examples/jsm/\"#\"$CDN/examples/jsm/\"#; s#src=\"/js/ocean.js\"#src=\"js/ocean.js\"#" index.html
sed -i "s#\`/assets/models/\${name}.glb#\`assets/models/\${name}.wasm#g; s#'/lib/three/examples/jsm/libs/draco/gltf/'#'$CDN/examples/jsm/libs/draco/gltf/'#" js/island/models.js
sed -i "s#'/assets/audio/#'assets/audio/#g" js/island/audio.js; sed -i "s#'/school/index.html?embed=1'#'school/index.html?embed=1'#" js/island/school-town.js
sed -i "s#navigator.serviceWorker.register('/sw.js')#Promise.reject()#" js/ocean.js
for f in assets/models/*.glb; do mv "$f" "${f%.glb}.wasm"; done
rm -f assets/models/student-*.wasm
SHIM='<script>try { localStorage.getItem("x"); } catch (e) { const m = {}; try { Object.defineProperty(window, "localStorage", { value: { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } } }); } catch (e2) {} }</script>'
python3 - "$SHIM" <<'PY'
import sys
s=open('index.html').read(); i=s.find('>', s.find('<head'))+1; open('index.html','w').write(s[:i]+sys.argv[1]+s[i:])
PY
grep -rnE "['\"\`]/(assets|school|lib)/" js index.html | grep -v socket || true
find . -type f | wc -l; du -sh .
