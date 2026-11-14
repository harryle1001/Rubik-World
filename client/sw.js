// Service worker: caches the game shell so the app opens instantly and shows a friendly page when offline.
const CACHE = 'truong-rubik-v3';
// Đảo 3D: file nạp sẵn; model .glb, three.js, bộ giải nén Draco được cache khi dùng lần đầu
const ISLAND = ['/ocean.html', '/js/ocean.js', ...['config', 'style', 'sky', 'post', 'terrain', 'player', 'models', 'quiz-data', 'temple', 'audio', 'net', 'characters', 'animals', 'school-town'].map(n => `/js/island/${n}.js`),
  '/lib/three/build/three.module.js', ...['den', 'rua', 'da'].map(n => `/assets/models/${n}.glb`),
  ...['postprocessing/EffectComposer', 'postprocessing/RenderPass', 'postprocessing/UnrealBloomPass', 'postprocessing/ShaderPass', 'postprocessing/OutputPass', 'postprocessing/MaskPass', 'postprocessing/Pass',
    'shaders/CopyShader', 'shaders/LuminosityHighPassShader', 'shaders/OutputShader', 'loaders/GLTFLoader', 'loaders/DRACOLoader', 'libs/meshopt_decoder.module', 'utils/BufferGeometryUtils', 'libs/draco/gltf/draco_wasm_wrapper'].map(n => `/lib/three/examples/jsm/${n}.js`),
  '/lib/three/examples/jsm/libs/draco/gltf/draco_decoder.wasm', '/lib/three/examples/jsm/utils/SkeletonUtils.js',
  ...['hero-knight', 'animal-deer', 'animal-fox', 'animal-shiba', 'animal-cat', 'animal-frog', 'animal-crab', 'prop-campfire', 'prop-tent', 'prop-log', 'prop-crystal', 'prop-flower-red', 'prop-mushroom-red', 'prop-stump'].map(n => `/assets/models/${n}.glb`),
  ...['amb-forest', 'amb-wave1', 'amb-wave2', 'step-sandl1', 'step-sandr1', 'step-sandl2', 'step-sandr2', 'sfx-dash', 'sfx-land', 'sfx-level-up', 'sfx-gem', 'sfx-coin', 'sfx-ui'].map(n => `/assets/audio/${n}.mp3`)]; // nhạc nền (lớn) và nhân vật khác được cache khi dùng lần đầu
const SHELL = ['/', '/index.html', '/offline.html', '/css/style.css', '/js/shared.js', '/js/avatar.js', '/js/world.js', '/js/ui.js', '/js/extras.js', '/js/editor.js', '/js/main.js', '/js/pwa.js',
  '/lib/phaser.min.js', '/lib/chess.js', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.concat(ISLAND))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if(e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/socket.io/')) return; // live game traffic never cached
  if(e.request.mode === 'navigate'){ e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('/')).then(r => r || caches.match('/offline.html')))); return; }
  e.respondWith(caches.match(e.request).then(hit => { const net = fetch(e.request).then(r => { if(r.ok){ const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); } return r; }).catch(() => hit); return hit || net; }));
});
