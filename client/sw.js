// Service worker: chỉ cache Đảo Rubik 3D (game duy nhất; game 2D lưu trữ không được cache) → mở nhanh, offline có trang thân thiện.
const CACHE = 'dao-rubik-v4';
// Đảo 3D: file nạp sẵn; model .glb, three.js, bộ giải nén Draco được cache khi dùng lần đầu
const ISLAND = ['/ocean.html', '/js/ocean.js', ...['config', 'style', 'sky', 'post', 'terrain', 'player', 'models', 'quiz-data', 'temple', 'audio', 'net', 'characters', 'animals', 'school-town', 'layout', 'data/index', 'data/map', 'data/people', 'data/clock', 'data/account', 'mg/host'].map(n => `/js/island/${n}.js`),
  '/lib/three/build/three.module.js', ...['den', 'rua', 'da'].map(n => `/assets/models/${n}.glb`),
  ...['postprocessing/EffectComposer', 'postprocessing/RenderPass', 'postprocessing/UnrealBloomPass', 'postprocessing/ShaderPass', 'postprocessing/OutputPass', 'postprocessing/MaskPass', 'postprocessing/Pass',
    'shaders/CopyShader', 'shaders/LuminosityHighPassShader', 'shaders/OutputShader', 'loaders/GLTFLoader', 'loaders/DRACOLoader', 'libs/meshopt_decoder.module', 'utils/BufferGeometryUtils', 'libs/draco/gltf/draco_wasm_wrapper'].map(n => `/lib/three/examples/jsm/${n}.js`),
  '/lib/three/examples/jsm/libs/draco/gltf/draco_decoder.wasm', '/lib/three/examples/jsm/utils/SkeletonUtils.js',
  ...['student-male-a', 'animal-deer', 'animal-fox', 'animal-shiba', 'animal-cat', 'animal-frog', 'animal-crab', 'prop-campfire', 'prop-tent', 'prop-log', 'prop-crystal', 'prop-flower-red', 'prop-mushroom-red', 'prop-stump'].map(n => `/assets/models/${n}.glb`),
  ...['amb-wave1', 'amb-wave2', 'amb-birds', 'amb-fire', 'step-sandl1', 'step-sandr1', 'step-leaves01', 'step-leaves02', 'step-wood01', 'step-wood02', 'step-stone01', 'sfx-dash', 'sfx-land', 'sfx-level-up', 'sfx-gem', 'sfx-coin', 'sfx-ui'].map(n => `/assets/audio/${n}.mp3`)]; // nhạc nền (lớn) và nhân vật khác được cache khi dùng lần đầu
const SHELL = ['/', '/offline.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png'];   // '/' = ocean.html (server.js)
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.concat(ISLAND))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if(e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/socket.io/') || url.pathname.startsWith('/school/')) return; // live game traffic never cached
  if(e.request.mode === 'navigate'){ e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('/ocean.html')).then(r => r || caches.match('/offline.html')))); return; }
  e.respondWith(caches.match(e.request).then(hit => { const net = fetch(e.request).then(r => { if(r.ok){ const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); } return r; }).catch(() => hit); return hit || net; }));
});
