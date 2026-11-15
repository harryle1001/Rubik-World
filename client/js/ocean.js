// ocean.js — Điểm khởi động Đảo Rubik 3D (kiểu Zelda low-poly). Các phần nằm trong client/js/island/.
import * as THREE from 'three';
import { CFG } from './island/config.js';
import { createSky } from './island/sky.js';
import { createPost } from './island/post.js';
import { createTerrain } from './island/terrain.js';
import { createPlayer } from './island/player.js';
import { scatterModel } from './island/models.js';
import { createTemples } from './island/temple.js';
import { createAudio } from './island/audio.js';
import { createNet } from './island/net.js';
import { createAnimals } from './island/animals.js';
import { createSchoolTown } from './island/school-town.js';
import { createWorldMap } from './island/world-map.js';
import { SPAWN, landDist } from './island/layout.js';
import { createVehicles } from './island/vehicles.js';
import { createAircraft } from './island/aircraft.js';
import { KINDS } from './island/characters.js';
import { loadModel } from './island/models.js';

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
let pr = Math.min(devicePixelRatio, CFG.quality.maxPixelRatio); renderer.setPixelRatio(pr);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.2, 500);
const sky = createSky(scene);
const post = createPost(renderer, scene, camera);

const terrain = createTerrain(scene);
const ctx = { scene, camera, renderer, terrain, colliders: terrain.colliders };
// Nút hành động dùng chung (E hoặc nút giữa màn hình): mỗi khung hình các phần gọi ctx.offer(nhãn, hàm, độ ưu tiên)
{
  const act = document.getElementById('bAct'); let best = null, cur = null;
  ctx.offer = (label, fn, pri = 0) => { if (!best || pri > best.pri) best = { label, fn, pri }; };
  ctx.flushOffer = () => { cur = best; best = null; act.hidden = !cur || ctx.player.frozen; if (cur && act.textContent !== cur.label) act.textContent = cur.label; };
  act.onclick = () => cur && cur.fn();
  addEventListener('keydown', e => { if (e.code === 'KeyE' && cur && !ctx.player.frozen) cur.fn(); });
}
// thông báo ngắn
ctx.toast = (t, ms = 3000) => { const el = document.getElementById('info'); el.innerHTML = t; el.style.opacity = 1; clearTimeout(ctx._tt); ctx._tt = setTimeout(() => el.style.opacity = 0, ms); };
// tên & màu áo người chơi (lưu trên máy)
ctx.playerName = localStorage.getItem('island.name') || ('Bạn nhỏ ' + Math.floor(100 + Math.random() * 900)); localStorage.setItem('island.name', ctx.playerName);
ctx.hue = +(localStorage.getItem('island.hue') || Math.floor(Math.random() * 360)); localStorage.setItem('island.hue', ctx.hue);
ctx.heroKind = KINDS[Math.floor(ctx.hue / 30) % KINDS.length]; // học sinh (12 kiểu) theo màu đã chọn
const player = ctx.player = createPlayer(ctx);

// Model Blender (.glb): đá (Draco) và rùa (Meshopt) rải trên bãi cát
{
  const beach = [], rocks = [];
  for (let i = 0; i < 400 && (beach.length < 6 || rocks.length < 24); i++) {
    const a = Math.random() * 6.283, r = 40 + Math.random() * 45, x = Math.cos(a) * r, z = Math.sin(a) * r, h = terrain.heightAt(x, z);
    if (h > 0.25 && h < 1.2 && landDist(x, z) > 4) (beach.length < 6 && i % 3 === 0 ? beach : rocks).push([x, h, z, 0.6 + Math.random() * 0.9, Math.random() * 6.28]);
  }
  scatterModel(scene, 'rua', beach); scatterModel(scene, 'da', rocks);
  for (const [x, , z, s] of rocks) ctx.colliders.push({ x, z, r: 0.6 * s });
}

const audio = ctx.audio = createAudio(ctx);
const temples = createTemples(ctx);
const net = ctx.net = createNet(ctx);
const animals = ctx.animals = createAnimals(ctx);
ctx.sky = sky;
const school = createSchoolTown(ctx);
const worldMap = ctx.worldMap = createWorldMap(ctx); // bản đồ: phím M / nút 🗺️
const vehicles = createVehicles(ctx);
const aircraft = ctx.aircraft = createAircraft(ctx); // sân bay, máy bay cổ điển, đàn chim
document.getElementById('bSchool').onclick = () => school.goSchool();
// Vào game: đứng trước cổng trường (giữa thế giới), camera nhìn về phía cổng
player.teleport(SPAWN[0], SPAWN[1]); player.pos.y = Math.max(player.pos.y, 1.2); player.cam.yaw = -Math.PI / 2;
document.getElementById('bMenu').onclick = () => school.menu();

// Đồ trang trí (Quaternius/Kenney CC0): khu cắm trại cạnh bãi xuất phát, hoa, nấm, gốc cây, pha lê quanh đền
{
  const put = (name, x, z, s = 1, ry = 0) => loadModel(name).then(m => { if (!m) return; m.position.set(x, terrain.heightAt(x, z), z); m.scale.setScalar(s); m.rotation.y = ry; scene.add(m); });
  put('prop-campfire', 7, 14, 1.2); put('prop-tent', 11, 17, 2.2, -2.3); put('prop-log', 5.2, 16, 1.2, 0.4); put('prop-log', 8.8, 11.6, 1.2, 1.9);
  ctx.colliders.push({ x: 7, z: 14, r: 0.8 }, { x: 11, z: 17, r: 1.6 });
  for (const [x, z] of [[-6, -1], [6, -1], [-4.5, -12], [4.5, -12]]) put('prop-crystal', x, z, 1.4, x);
  const rnd = () => { for (let k = 0; k < 30; k++) { const a = Math.random() * 6.283, r = 14 + Math.random() * 45, x = Math.cos(a) * r, z = Math.sin(a) * r; if (terrain.heightAt(x, z) > 1.5 && terrain.slopeAt(x, z) < 0.6) return [x, z]; } return null; };
  const tf = (n, sMin, sMax) => Array.from({ length: n }, rnd).filter(Boolean).map(([x, z]) => [x, terrain.heightAt(x, z), z, sMin + Math.random() * (sMax - sMin), Math.random() * 6.28]);
  scatterModel(scene, 'prop-flower-red', tf(60, 0.6, 1.1)); scatterModel(scene, 'prop-mushroom-red', tf(30, 0.5, 0.9));
  const stumps = tf(12, 0.9, 1.3); scatterModel(scene, 'prop-stump', stumps); for (const [x, , z] of stumps) ctx.colliders.push({ x, z, r: 0.5 });
}


addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); post.setSize(innerWidth, innerHeight); });
const clock = new THREE.Clock();
window.__island = ctx; Object.assign(ctx, { sky, post });
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!ctx.freeCam) player.update(dt); // freeCam: camera tự do để gỡ lỗi
  terrain.update(dt, clock.elapsedTime, player.pos);
  temples.update(dt, clock.elapsedTime);
  audio.update(dt, { night: sky.state.night, school: !!ctx.schoolHours });
  net.update(dt);
  animals.update(dt);
  school.update(dt, clock.elapsedTime);
  vehicles.update(dt);
  aircraft.update(dt, clock.elapsedTime);
  sky.update(dt, camera, player.pos);
  ctx.flushOffer();
  if (!worldMap.open) post.render(); // bản đồ che kín màn hình → không cần vẽ 3D
  worldMap.update();
  quality(dt);
});

// ---------- Tự giảm/tăng chất lượng theo FPS ----------
// mức 0: đầy đủ · 1: tắt bloom, giảm độ phân giải · 2: cỏ/cây chi tiết gần hơn, bóng nhỏ · 3: tắt bóng đổ
let qLevel = 0, qT = performance.now(), qFrames = 0, qGood = 0;
const base = { pr, grass: terrain.state.grassDist, tree: terrain.state.treeDist };
function applyQuality() {
  const L = qLevel;
  pr = [base.pr, Math.min(base.pr, 1.15), 1.0, 0.85][L]; renderer.setPixelRatio(pr); post.setSize(innerWidth, innerHeight);
  post.bloom.enabled = CFG.quality.bloom && L === 0;
  terrain.state.grassDist = base.grass * (L >= 2 ? 0.6 : 1); terrain.state.treeDist = base.tree * (L >= 2 ? 0.7 : 1); terrain.state.relayoutAll(player.pos);
  const ss = L >= 2 ? 512 : CFG.quality.shadowSize; if (sky.sun.shadow.mapSize.x !== ss) { sky.sun.shadow.mapSize.set(ss, ss); sky.sun.shadow.map?.dispose(); sky.sun.shadow.map = null; }
  if (renderer.shadowMap.enabled !== (L < 3)) { renderer.shadowMap.enabled = L < 3; scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => m.needsUpdate = true); }); }
  ctx.qualityLevel = L;
}
function quality(dt) {
  qFrames++; const el = (performance.now() - qT) / 1000; if (el < 3) return;
  const fps = qFrames / el; qFrames = 0; qT = performance.now(); ctx.fps = Math.round(fps);
  if (fps < CFG.quality.lowFps && qLevel < 3) { qLevel++; qGood = 0; applyQuality(); }
  else if (fps > CFG.quality.highFps && qLevel > 0 && ++qGood >= 3) { qLevel--; qGood = 0; applyQuality(); }
}
if (new URLSearchParams(location.search).has('low')) { qLevel = 2; applyQuality(); } // ?low: bắt đầu ở chất lượng thấp

// ---------- Cache để mở nhanh/offline ----------
if ('serviceWorker' in navigator && !window.ISLAND_SERVER) navigator.serviceWorker.register('/sw.js').catch(() => {});
