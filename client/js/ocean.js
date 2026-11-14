// ocean.js — Điểm khởi động Đảo Rubik 3D (kiểu Zelda low-poly). Các phần nằm trong client/js/island/.
import * as THREE from 'three';
import { CFG } from './island/config.js';
import { toon, addOutline } from './island/style.js';
import { createSky } from './island/sky.js';
import { createPost } from './island/post.js';
import { createTerrain } from './island/terrain.js';

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

const terrain = createTerrain(scene);
// Nhân vật mẫu (bước 3 sẽ thay bằng nhân vật điều khiển được)
const hero = new THREE.Group();
const add = (g, c, x, y, z) => { const m = new THREE.Mesh(g, toon(c)); m.position.set(x, y, z); m.castShadow = true; hero.add(m); return m; };
add(new THREE.CapsuleGeometry(0.4, 0.6, 4, 10), '#3d7bd9', 0, 1.0, 0);
add(new THREE.SphereGeometry(0.38, 16, 12), '#f2c9a0', 0, 1.85, 0);
add(new THREE.ConeGeometry(0.42, 0.5, 12), '#3fa34d', 0, 2.25, -0.05);
addOutline(hero); scene.add(hero); hero.position.set(0, terrain.heightAt(0, 10), 10);
camera.position.set(0, hero.position.y + 7, 24); camera.lookAt(0, hero.position.y + 1, 5);

addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); post.setSize(innerWidth, innerHeight); });
const clock = new THREE.Clock();
window.__island = { scene, camera, renderer, sky, post, terrain, hero };
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  hero.rotation.y += dt * 0.5;
  terrain.update(dt, clock.elapsedTime, hero.position);
  sky.update(dt, camera, hero.position);
  post.render();
});
