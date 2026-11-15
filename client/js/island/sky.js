// sky.js — Trời gradient 3 tầng, mặt trời/trăng, sao, sương mù xa, ánh sáng theo giờ (ngày đêm), mây trôi.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CFG } from './config.js';

// [giờ, đỉnh trời, chân trời, màu nắng, cường độ nắng, cường độ trời (hemi)]
const KEYS = [
  [0, '#0d1638', '#2a3766', '#8fa6ff', 0.25, 0.4],
  [5.5, '#33447e', '#f0a988', '#ffb784', 0.5, 0.55],
  [7.5, '#4f9be6', '#ffe1c2', '#ffd9a8', 1.3, 0.8],
  [10, '#3e8fe3', '#cfeefa', '#fff0d2', 1.7, 0.85],
  [14, '#3a8ae0', '#c8eaf9', '#ffedc8', 1.75, 0.85],
  [16.5, '#4f8ad6', '#ffe0b0', '#ffd394', 1.6, 0.8],
  [18.4, '#3d4c8e', '#ff9a6c', '#ff8f58', 1.0, 0.65],
  [19.6, '#161f4a', '#5c467c', '#b49cff', 0.3, 0.45],
  [24, '#0d1638', '#2a3766', '#8fa6ff', 0.25, 0.4],
].map(k => [k[0], new THREE.Color(k[1]), new THREE.Color(k[2]), new THREE.Color(k[3]), k[4], k[5]]);

// Uniform dùng chung: nước (terrain.js) đọc độ sáng trời + màu chân trời để phản chiếu
export const SKY_U = { uLight: { value: 1 }, uSkyHor: { value: new THREE.Color('#cfeefa') }, uSunDir: { value: new THREE.Vector3(0, 1, 0) } };

export function createSky(scene) {
  const U = { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSun: { value: new THREE.Vector3() }, uSunCol: { value: new THREE.Color() }, uNight: { value: 0 } };
  const dome = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: U,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 uTop, uHor, uSun, uSunCol; uniform float uNight; varying vec3 vD;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.99,78.23,37.72)))*43758.55); }
      void main(){ vec3 d = normalize(vD);
        float y = max(d.y, 0.);
        vec3 mid = mix(uHor, uTop, 0.45);
        vec3 c = mix(uHor, mid, smoothstep(0.0, 0.18, y));           // dải sáng mờ sát chân trời
        c = mix(c, uTop, smoothstep(0.12, 0.85, y));                 // lên đỉnh đậm dần
        c = mix(c, uHor * 0.92, smoothstep(0.0, -0.25, d.y));        // dưới chân trời (sau biển)
        float s = max(dot(d, uSun), 0.);
        c += uSunCol * (smoothstep(0.9984, 0.9991, s) * 1.4 + pow(s, 12.) * 0.18 + pow(s, 3.) * 0.06 * (1. - y));   // đĩa mặt trời + quầng ấm
        vec3 cell = floor(d * 240.); c += step(0.9975, h(cell)) * uNight * smoothstep(0.05, 0.3, d.y);
        gl_FragColor = vec4(c, 1.); }`,
  }));
  dome.renderOrder = -1; dome.frustumCulled = false; scene.add(dome);

  const hemi = new THREE.HemisphereLight('#d6ecff', '#c2ad7e', 1.0); scene.add(hemi);   // dưới đất hắt ánh ấm (cát/cỏ)
  const sun = new THREE.DirectionalLight('#fff0d2', 2.0); sun.castShadow = true;
  const r = CFG.quality.shadowRange; Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 1, far: 200 });
  sun.shadow.mapSize.set(CFG.quality.shadowSize, CFG.quality.shadowSize); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05;
  scene.add(sun, sun.target);
  scene.fog = new THREE.Fog('#cfeefa', 150, 400);
  const GROUND_DAY = new THREE.Color('#c2ad7e'), GROUND_NIGHT = new THREE.Color('#2a2f4a');

  // Mây: cụm phồng đáy phẳng, trắng sữa, mặt dưới hơi xanh tím (MeshBasic tô màu theo đỉnh: rẻ, mềm, không cần ánh sáng)
  const clouds = new THREE.Group(); scene.add(clouds);
  const cm = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, transparent: true, opacity: 0.96 });
  const blob = new THREE.IcosahedronGeometry(1, 2), cTop = new THREE.Color('#ffffff'), cBot = new THREE.Color('#d9e3f2'), cc = new THREE.Color();
  for (let i = 0; i < 16; i++) {
    const n = 4 + (i % 3), parts = [];   // gộp các khối của 1 đám mây thành 1 mesh (ít draw call)
    for (let k = 0; k < n; k++) {
      const s = 2.6 + Math.random() * 3.2 * (1 - Math.abs(k - (n - 1) / 2) / n), g = blob.clone();
      const p = g.attributes.position; for (let j = 0; j < p.count; j++) if (p.getY(j) < 0) p.setY(j, p.getY(j) * 0.25);   // đáy phẳng
      parts.push(g.scale(s * 1.2, s * 0.75, s).translate(k * 3.6 - n * 1.8, Math.random() * 0.8, (Math.random() - 0.5) * 3));
    }
    const geo = mergeGeometries(parts), p = geo.attributes.position, nrm = geo.attributes.normal, col = new Float32Array(p.count * 3);
    for (let j = 0; j < p.count; j++) { cc.copy(cBot).lerp(cTop, Math.min(1, Math.max(0, nrm.getY(j) * 0.6 + 0.55))); col.set([cc.r, cc.g, cc.b], j * 3); }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const g = new THREE.Mesh(geo, cm);
    const a = Math.random() * 6.28, d = 70 + Math.random() * 160; g.position.set(Math.cos(a) * d, 50 + Math.random() * 25, Math.sin(a) * d); g.userData.v = 0.8 + Math.random() * 1.2;
    clouds.add(g);
  }
  const state = { hour: CFG.time.startHour, night: 0, sunDir: new THREE.Vector3() };
  function apply() {
    const h = state.hour; let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] <= h) i++;
    const A = KEYS[i], B = KEYS[i + 1], t = (h - A[0]) / (B[0] - A[0]);
    U.uTop.value.copy(A[1]).lerp(B[1], t); U.uHor.value.copy(A[2]).lerp(B[2], t);
    sun.color.copy(A[3]).lerp(B[3], t); sun.intensity = A[4] + (B[4] - A[4]) * t; hemi.intensity = A[5] + (B[5] - A[5]) * t;
    hemi.color.copy(U.uHor.value).lerp(U.uTop.value, 0.35);
    scene.fog.color.copy(U.uHor.value).lerp(U.uTop.value, 0.15);   // sương mù = màu trời nhạt
    SKY_U.uSkyHor.value.copy(U.uHor.value); SKY_U.uLight.value = Math.min(1, 0.35 + hemi.intensity * 0.62);
    const a = ((h - 6) / 12) * Math.PI, el = Math.sin(a);
    U.uSun.value.set(Math.cos(a) * 0.8, el, 0.45).normalize();
    state.sunDir.copy(el > 0 ? U.uSun.value : U.uSun.value.clone().negate()); state.sunDir.y = Math.max(state.sunDir.y, 0.15); state.sunDir.normalize();
    U.uSunCol.value.copy(sun.color);
    state.night = Math.min(1, Math.max(0, (0.1 - el) / 0.25)); U.uNight.value = state.night;
    hemi.groundColor.copy(GROUND_DAY).lerp(GROUND_NIGHT, state.night);
    cm.color.setScalar(1 - 0.72 * state.night).lerp(sun.color, 0.12 * (1 - state.night));
    SKY_U.uSunDir.value.copy(state.sunDir);
  }
  apply();

  function update(dt, cam, target) {
    const slow = state.hour > 9 && state.hour < 16.5 ? 0.6 : 1;   // giờ đẹp ban ngày trôi chậm hơn
    state.hour = (state.hour + slow * dt / CFG.time.dayLengthSec * 24) % 24; apply();
    dome.position.copy(cam.position);
    sun.target.position.copy(target); sun.position.copy(target).addScaledVector(state.sunDir, 80);
    for (const c of clouds.children) { c.position.x += c.userData.v * dt; if (c.position.x > 220) c.position.x = -220; }
  }
  return { update, state, sun, hemi };
}
