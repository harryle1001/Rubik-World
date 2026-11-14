// ocean.js — Điểm khởi động Đảo Rubik 3D (kiểu Zelda low-poly). Các phần nằm trong client/js/island/.
import * as THREE from 'three';
import { CFG } from './island/config.js';
import { createSky } from './island/sky.js';
import { createPost } from './island/post.js';
import { createTerrain } from './island/terrain.js';
import { createPlayer } from './island/player.js';

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
const player = ctx.player = createPlayer(ctx);

addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); post.setSize(innerWidth, innerHeight); });
const clock = new THREE.Clock();
window.__island = ctx; Object.assign(ctx, { sky, post });
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  player.update(dt);
  terrain.update(dt, clock.elapsedTime, player.pos);
  sky.update(dt, camera, player.pos);
  post.render();
});
