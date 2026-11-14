// ocean.js — Điểm khởi động Đảo Rubik 3D (kiểu Zelda low-poly). Các phần nằm trong client/js/island/.
import * as THREE from 'three';
import { CFG } from './island/config.js';
import { toon, addOutline } from './island/style.js';
import { createSky } from './island/sky.js';
import { createPost } from './island/post.js';

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
let pr = Math.min(devicePixelRatio, CFG.quality.maxPixelRatio); renderer.setPixelRatio(pr);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.2, 500);
camera.position.set(0, 6, 14); camera.lookAt(0, 2, 0);
const sky = createSky(scene);
const post = createPost(renderer, scene, camera);

// --- Cảnh mẫu bước 1 (sẽ thay bằng địa hình thật ở bước 2) ---
const ground = new THREE.Mesh(new THREE.CylinderGeometry(30, 32, 2, 24), toon('#7cc35a')); ground.position.y = -1; ground.receiveShadow = true; scene.add(ground);
const hero = new THREE.Group();
const add = (g, c, x, y, z) => { const m = new THREE.Mesh(g, toon(c)); m.position.set(x, y, z); m.castShadow = true; hero.add(m); return m; };
add(new THREE.CapsuleGeometry(0.4, 0.6, 4, 10), '#3d7bd9', 0, 1.0, 0);
add(new THREE.SphereGeometry(0.38, 16, 12), '#f2c9a0', 0, 1.85, 0);
add(new THREE.ConeGeometry(0.42, 0.5, 12), '#3fa34d', 0, 2.25, -0.05);
addOutline(hero); scene.add(hero);
for (let i = 0; i < 8; i++) { const t = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 0), toon('#3f9a4a')); t.position.set(Math.cos(i) * 9, 2.2, Math.sin(i) * 9); t.castShadow = true; scene.add(t); }

addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); post.setSize(innerWidth, innerHeight); });
const clock = new THREE.Clock();
window.__island = { scene, camera, renderer, sky, post };
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  hero.rotation.y += dt * 0.5;
  sky.update(dt, camera, hero.position);
  post.render();
});
