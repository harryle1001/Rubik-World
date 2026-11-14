// build-app.js — Đóng gói Đảo Rubik 3D vào thư mục www/ cho Capacitor (app iOS/Android).
// Chạy: ISLAND_SERVER=https://ten-server-cua-ban npm run app:build   (server dùng cho multiplayer)
// Mọi file (three.js, model, âm thanh) nằm sẵn trong app nên chơi được khi không có mạng.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'www');
const SERVER = process.env.ISLAND_SERVER || 'https://truong-rubik.onrender.com';
fs.rmSync(OUT, { recursive: true, force: true });
const copy = (from, to) => fs.cpSync(path.join(ROOT, from), path.join(OUT, to), { recursive: true });
copy('client', '');
for (const f of ['build/three.module.js', 'examples/jsm/postprocessing', 'examples/jsm/shaders', 'examples/jsm/loaders/GLTFLoader.js', 'examples/jsm/loaders/DRACOLoader.js', 'examples/jsm/libs/meshopt_decoder.module.js', 'examples/jsm/libs/draco/gltf', 'examples/jsm/utils/BufferGeometryUtils.js'])
  copy(path.join('node_modules/three', f), path.join('lib/three', f));
copy('node_modules/socket.io/client-dist/socket.io.min.js', 'lib/socket.io.min.js');
// trang mở đầu của app = đảo 3D; gắn địa chỉ server multiplayer
let html = fs.readFileSync(path.join(ROOT, 'client/ocean.html'), 'utf8');
html = html.replace('<script type="importmap">', `<script>window.ISLAND_SERVER = ${JSON.stringify(SERVER)};</script>\n<script type="importmap">`);
fs.writeFileSync(path.join(OUT, 'index.html'), html);
fs.rmSync(path.join(OUT, 'sw.js')); // app đã có sẵn file, không cần service worker
console.log('Đã đóng gói vào www/ · server multiplayer:', SERVER);
