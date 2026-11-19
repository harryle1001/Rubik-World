#!/usr/bin/env bash
# Đóng gói "Đảo Rubik – Mini" cho cổng game (Poki, CrazyGames, GameDistribution): thư mục tĩnh tự chứa (three.js chép vào lib/,
# đường dẫn tương đối, không server, không link ngoài), model .glb để riêng từng file → chỉ tải khi cần (tải lười).
# Dùng: bash scripts/build-portal.sh [thư-mục-ra=dist/portal]  → dist/portal/{poki,crazygames,gamedistribution}/ + 3 file .zip
# Xem docs/portals.md.
set -e
R=$(cd "$(dirname "$0")/.." && pwd); OUT=${1:-$R/dist/portal}; B=$OUT/_base
NM=$R/node_modules; TMP=$(mktemp -d)
pkg() { # thư viện npm: node_modules nếu có, không thì npm pack (không cài vào dự án)
  if [ -d "$NM/$1" ]; then echo "$NM/$1"; else (cd $TMP && npm pack -q "$1@$2" >/dev/null && mkdir -p $1 && tar xzf $1-*.tgz -C $1 && echo "$TMP/$1/package"); fi; }
THREE=$(pkg three 0.169.0); CHESS=$(pkg chess.js 0.10.3)
rm -rf $OUT; mkdir -p $B/js $B/lib/three/build $B/lib/three/examples/jsm/libs
cp -r $R/client/js/island $R/client/js/ocean.js $R/client/js/vendor $B/js/
cp $R/client/ocean.html $B/index.html; cp -r $R/client/icons $B/
# three.js: bản rút gọn + các addon dùng tới (loaders/postprocessing kéo theo shaders, utils)
cp $THREE/build/three.module.min.js $B/lib/three/build/three.module.js
for d in loaders postprocessing shaders utils geometries math; do cp -r $THREE/examples/jsm/$d $B/lib/three/examples/jsm/; done
cp $THREE/examples/jsm/libs/meshopt_decoder.module.js $B/lib/three/examples/jsm/libs/; cp -r $THREE/examples/jsm/libs/draco $B/lib/three/examples/jsm/libs/
rm -rf $B/lib/three/examples/jsm/libs/draco/{draco_decoder.js,draco_encoder.js,README.md} $B/lib/three/examples/jsm/libs/draco/gltf/draco_encoder.js
cp $CHESS/chess.js $B/lib/chess.js
# tài nguyên: model + âm thanh + texture + VRM (VRM chỉ tải khi chạm trình tạo nhân vật / NPC gần)
mkdir -p $B/assets; cp -r $R/client/assets/{models,audio,tex,vrm,CREDITS.txt} $B/assets/
cd $B
# đường dẫn tuyệt đối → tương đối (cổng game phục vụ trong thư mục con trên CDN của họ)
sed -i 's#"/lib/three/#"./lib/three/#g; s#src="/js/#src="js/#; s#href="/icons/#href="icons/#g; s#href="/assets/#href="assets/#g; /rel="manifest"/s#<link rel="manifest" href="/manifest.webmanifest">##' index.html
grep -rlE "['\"\`]/(assets|lib|icons)/" js | xargs sed -i -E "s#(['\"\`])/(assets|lib|icons)/#\1\2/#g"
sed -i "s#navigator.serviceWorker.register('/sw.js')#Promise.reject()#" js/ocean.js
# ---- bản Mini: chơi một mình (net offline), khách tự động, lớp portal/mini.js ----
python3 - <<'PY'
import re
def patch(p, a, b):
    s = open(p).read(); assert a in s, (p, a); open(p, 'w').write(s.replace(a, b, 1))
patch('js/ocean.js', "import { createBrooms } from './island/brooms.js';", "import { createBrooms } from './island/brooms.js';\nimport { createMini } from './island/portal/mini.js';")
patch('js/ocean.js', "import { createNet } from './island/net.js';\n", "")
patch('js/ocean.js', "const net = ctx.net = createNet(ctx);", "const net = ctx.net = { update() {}, others: new Map(), send() {}, on() {}, sock: null, connected: false };   // [Mini] chơi một mình, không server")
patch('js/ocean.js', "document.getElementById('bSchool').onclick", "ctx.mini = createMini(ctx);   // [Mini] chương 1 + SDK cổng game + song ngữ\ndocument.getElementById('bSchool').onclick")
patch('js/island/account-hud.js', "else { render(); setTimeout(open, 600); }", "else { render(); acc.playGuest(); }   // [Mini] không đăng nhập")
patch('js/island/loader.js', '<a class="dlc" href="https://dreamlabs.vn" target="_blank" rel="noopener">Design by Dreamlabs.vn</a>', '<span class="dlc">Design by Dreamlabs.vn</span>')
patch('index.html', '<title>Đảo Rubik 3D</title>', '<title>Đảo Rubik – Mini</title>')
PY
rm -f js/island/net.js
LEFT=$(grep -rnE "['\"\`]/(assets|lib|icons|js|socket\.io)/" js index.html | grep -v '^\s*//' || true); [ -z "$LEFT" ] || { echo "còn đường dẫn tuyệt đối:"; echo "$LEFT"; }
rm -rf $TMP
echo "base: $(find . -type f | wc -l) file, $(du -sh . | cut -f1)"
# ---- 3 bản theo cổng: chỉ khác cấu hình window.PORTAL trong index.html ----
FULL_URL=${FULL_URL:-https://truong-rubik.onrender.com}; GD_GAME_ID=${GD_GAME_ID:-YOUR_GD_GAME_ID}
SHIM='<script>try{localStorage.getItem("x")}catch(e){const m={};try{Object.defineProperty(window,"localStorage",{value:{getItem:k=>k in m?m[k]:null,setItem:(k,v)=>{m[k]=String(v)},removeItem:k=>{delete m[k]},clear:()=>{for(const k in m)delete m[k]}}})}catch(e2){}}</script>'
cd $OUT
for T in poki crazygames gamedistribution; do
  cp -r _base $T
  CONF="<script>window.ISLAND_MINI=1;window.PORTAL={target:'$T',gdId:'$GD_GAME_ID',fullUrl:'$FULL_URL'};</script>$SHIM"
  python3 -c "import sys;p=sys.argv[1];s=open(p).read();i=s.find('>',s.find('<head'))+1;open(p,'w').write(s[:i]+sys.argv[2]+s[i:])" $T/index.html "$CONF"
  rm -f $T.zip; (cd $T && zip -qr9 ../$T.zip .)
  echo "$T: $(find $T -type f | wc -l) file, $(du -sh $T | cut -f1), zip $(du -h $T.zip | cut -f1)"
done
# bản chạy thường (không SDK) để thử/đăng web riêng
cp -r _base none; python3 -c "import sys;p=sys.argv[1];s=open(p).read();i=s.find('>',s.find('<head'))+1;open(p,'w').write(s[:i]+sys.argv[2]+s[i:])" none/index.html "<script>window.ISLAND_MINI=1;window.PORTAL={target:'none',fullUrl:'$FULL_URL'};</script>$SHIM"
rm -rf _base
