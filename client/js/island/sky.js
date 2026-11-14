// sky.js — Trời gradient, mặt trời/trăng, sao, sương mù xa, ánh sáng theo giờ (ngày đêm), mây trôi.
import * as THREE from 'three';
import { CFG } from './config.js';
import { toon } from './style.js';

// [giờ, đỉnh trời, chân trời, màu nắng, cường độ nắng, cường độ trời (hemi)]
const KEYS = [
  [0, '#0c1433', '#26335f', '#8fa6ff', 0.25, 0.35],
  [5.5, '#2a3a74', '#e49a7a', '#ffb07a', 0.45, 0.5],
  [8, '#3f8ee0', '#bfe6f6', '#fff2d6', 1.5, 0.85],
  [13, '#2f80dc', '#b4e0f7', '#fffaf0', 1.7, 0.9],
  [16.5, '#4f88d4', '#ffd9a4', '#ffd08a', 1.5, 0.8],
  [18.4, '#3b4a8c', '#ff9466', '#ff8a52', 0.9, 0.6],
  [19.6, '#151d48', '#5a4478', '#b49cff', 0.3, 0.4],
  [24, '#0c1433', '#26335f', '#8fa6ff', 0.25, 0.35],
].map(k => [k[0], new THREE.Color(k[1]), new THREE.Color(k[2]), new THREE.Color(k[3]), k[4], k[5]]);

export function createSky(scene) {
  const U = { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSun: { value: new THREE.Vector3() }, uSunCol: { value: new THREE.Color() }, uNight: { value: 0 } };
  const dome = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: U,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 uTop, uHor, uSun, uSunCol; uniform float uNight; varying vec3 vD;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.99,78.23,37.72)))*43758.55); }
      void main(){ vec3 d = normalize(vD);
        vec3 c = mix(uHor, uTop, pow(smoothstep(-0.05, 0.7, d.y), 0.75));
        float s = max(dot(d, uSun), 0.); c += uSunCol * (smoothstep(0.9985, 0.9992, s) * 1.6 + pow(s, 30.) * 0.25);
        vec3 cell = floor(d * 240.); c += step(0.9975, h(cell)) * uNight * smoothstep(0.05, 0.3, d.y);
        gl_FragColor = vec4(c, 1.); }`,
  }));
  dome.renderOrder = -1; dome.frustumCulled = false; scene.add(dome);

  const hemi = new THREE.HemisphereLight('#cfe8ff', '#6a7a4a', 0.8); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff', 1.5); sun.castShadow = true;
  const r = CFG.quality.shadowRange; Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 1, far: 200 });
  sun.shadow.mapSize.set(CFG.quality.shadowSize, CFG.quality.shadowSize); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);
  scene.fog = new THREE.Fog('#bfe6f6', 110, 380);

  // Mây: cụm khối tròn toon trắng trôi chậm
  const clouds = new THREE.Group(); scene.add(clouds);
  const cm = toon('#ffffff', { fog: false, emissive: '#ffffff', emissiveIntensity: 0.25 });
  const blob = new THREE.IcosahedronGeometry(1, 1);
  for (let i = 0; i < 14; i++) {
    const g = new THREE.Group(), n = 3 + (i % 3);
    for (let k = 0; k < n; k++) { const m = new THREE.Mesh(blob, cm); const s = 3 + Math.random() * 3; m.scale.set(s, s * 0.6, s); m.position.set(k * 4 - n * 2, Math.random(), Math.random() * 3); g.add(m); }
    const a = Math.random() * 6.28, d = 60 + Math.random() * 150; g.position.set(Math.cos(a) * d, 45 + Math.random() * 25, Math.sin(a) * d); g.userData.v = 1 + Math.random() * 1.5;
    clouds.add(g);
  }

  const state = { hour: CFG.time.startHour, night: 0, sunDir: new THREE.Vector3() };
  function apply() {
    const h = state.hour; let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] <= h) i++;
    const A = KEYS[i], B = KEYS[i + 1], t = (h - A[0]) / (B[0] - A[0]);
    U.uTop.value.copy(A[1]).lerp(B[1], t); U.uHor.value.copy(A[2]).lerp(B[2], t);
    sun.color.copy(A[3]).lerp(B[3], t); sun.intensity = A[4] + (B[4] - A[4]) * t; hemi.intensity = A[5] + (B[5] - A[5]) * t;
    hemi.color.copy(U.uHor.value).lerp(U.uTop.value, 0.5);
    scene.fog.color.copy(U.uHor.value);
    const a = ((h - 6) / 12) * Math.PI, el = Math.sin(a);
    U.uSun.value.set(Math.cos(a) * 0.8, el, 0.45).normalize();
    state.sunDir.copy(el > 0 ? U.uSun.value : U.uSun.value.clone().negate()); state.sunDir.y = Math.max(state.sunDir.y, 0.15); state.sunDir.normalize();
    U.uSunCol.value.copy(sun.color);
    state.night = Math.min(1, Math.max(0, (0.1 - el) / 0.25)); U.uNight.value = state.night;
    cm.emissiveIntensity = 0.1 + 0.3 * (1 - state.night);
  }
  apply();

  function update(dt, cam, target) {
    state.hour = (state.hour + dt / CFG.time.dayLengthSec * 24) % 24; apply();
    dome.position.copy(cam.position);
    sun.target.position.copy(target); sun.position.copy(target).addScaledVector(state.sunDir, 80);
    for (const c of clouds.children) { c.position.x += c.userData.v * dt; if (c.position.x > 220) c.position.x = -220; }
  }
  return { update, state, sun, hemi };
}
