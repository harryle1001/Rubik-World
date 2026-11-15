// sky.js — Trời gradient, quầng bình minh/hoàng hôn, mặt trời, trăng có pha theo lịch thật, sao lấp lánh, Ngân Hà, sương mù xa, ánh sáng theo giờ (ngày đêm), mây trôi.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CFG } from './config.js';
import { toon } from './style.js';

// [giờ, đỉnh trời, chân trời, màu nắng, cường độ nắng, cường độ trời (hemi)]
const KEYS = [
  [0, '#14204a', '#34467a', '#a9bcff', 0.3, 0.6],
  [5.5, '#2a3a74', '#e49a7a', '#ffb07a', 0.45, 0.5],
  [6.4, '#5b80c8', '#ffc59a', '#ffc690', 1.0, 0.66],     // bình minh: chân trời hồng cam
  [8, '#4f9be6', '#ffe6c8', '#ffe2b4', 1.35, 0.8],     // sáng sớm ấm
  [10, '#3e8fe3', '#cfeefa', '#fff0d2', 1.7, 0.85],
  [14, '#3a8ae0', '#c8eaf9', '#ffedc8', 1.75, 0.85],   // trưa: nắng vàng ấm, không trắng gắt
  [16.5, '#4f8ad6', '#ffe0b0', '#ffd394', 1.6, 0.8],
  [17.6, '#5574bf', '#ffb57a', '#ffb066', 1.25, 0.72],  // giờ vàng

  [18.4, '#3b4a8c', '#ff9466', '#ff8a52', 0.9, 0.6],
  [19.6, '#1b2656', '#5e4a80', '#b49cff', 0.35, 0.55],
  [24, '#14204a', '#34467a', '#a9bcff', 0.3, 0.6],
].map(k => [k[0], new THREE.Color(k[1]), new THREE.Color(k[2]), new THREE.Color(k[3]), k[4], k[5]]);

export function createSky(scene) {
  const U = { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSun: { value: new THREE.Vector3() }, uSunCol: { value: new THREE.Color() }, uNight: { value: 0 },
    uMoon: { value: new THREE.Vector3(0, -1, 0) }, uPhase: { value: 0.5 }, uTime: { value: 0 } };
  const dome = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: U,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 uTop, uHor, uSun, uSunCol, uMoon; uniform float uNight, uPhase, uTime; varying vec3 vD;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.99,78.23,37.72)))*43758.55); }
      void main(){ vec3 d = normalize(vD);
        float y = max(d.y, 0.);
        vec3 c = mix(uHor, mix(uHor, uTop, 0.45), smoothstep(0.0, 0.18, y));   // dải sáng mờ sát chân trời
        c = mix(c, uTop, smoothstep(0.12, 0.85, y));                          // lên đỉnh đậm dần (3 tầng)
        c = mix(c, uHor * 0.92, smoothstep(0.0, -0.25, d.y));
        float s = max(dot(d, uSun), 0.);
        // quầng bình minh/hoàng hôn: dải sáng ấm ôm chân trời phía mặt trời (mặt trời càng thấp càng rộng)
        float low = smoothstep(-0.22, 0.02, uSun.y) * (1. - smoothstep(0.05, 0.4, uSun.y));
        c += uSunCol * (pow(s, 5.) * 0.6 * low * exp(-max(d.y, 0.) * 5.) + pow(s, 30.) * 0.25);
        c += uSunCol * smoothstep(0.9985, 0.9992, s) * 1.6 * step(-0.03, uSun.y);
        c += uSunCol * pow(s, 3.) * 0.06 * (1. - y) * step(-0.03, uSun.y);   // quầng ấm rộng quanh mặt trời
        // sao lấp lánh + dải Ngân Hà mờ
        vec3 cell = floor(d * 240.); float r = h(cell), up = smoothstep(0.05, 0.3, d.y);
        c += step(0.9975, r) * uNight * up * (0.55 + 0.45 * sin(uTime * (1.5 + r * 6.) + r * 50.));
        float mw = exp(-pow(dot(d, normalize(vec3(0.35, 0.25, -0.9))) * 5., 2.)) * (0.65 + 0.35 * sin(d.x * 23. + sin(d.z * 17.) * 2.) * sin(d.y * 19. - d.z * 11.));
        c += vec3(0.07, 0.065, 0.11) * mw * uNight * up;
        // trăng có pha: chỗ sáng = phần được Mặt Trời chiếu (pha 0 trăng non · 0.5 trăng tròn)
        float m = dot(d, uMoon);
        c += vec3(0.55, 0.62, 0.8) * pow(max(m, 0.), 60.) * 0.35 * smoothstep(-0.05, 0.05, uMoon.y) * uNight * (0.2 + 0.8 * sin(uPhase * 3.1416)); // quầng trăng
        if (m > 0.989) {
          vec3 rt = normalize(cross(uMoon, vec3(0., 1., 0.))), u2 = cross(rt, uMoon);
          vec2 p = vec2(dot(d, rt), dot(d, u2)) / 0.045; float L = length(p);
          float pa = uPhase * 6.2832, lit = smoothstep(-0.08, 0.08, dot(vec3(p, sqrt(max(0., 1. - L * L))), vec3(sin(pa), 0., -cos(pa))));
          float crater = 0.85 + 0.15 * h(floor(vec3(p * 5., 1.)));
          float vis = smoothstep(-0.05, 0.05, uMoon.y) * (0.25 + 0.75 * uNight);
          c = mix(c, mix(c + vec3(0.03), vec3(0.97, 0.95, 0.86) * crater, lit), (1. - smoothstep(0.92, 1., L)) * vis);
          c += vec3(0.5, 0.55, 0.7) * pow(max(m, 0.), 900.) * 0.25 * vis * (0.3 + 0.7 * sin(uPhase * 3.1416));
        }
        gl_FragColor = vec4(c, 1.); }`,
  }));
  dome.renderOrder = -1; dome.frustumCulled = false; scene.add(dome);

  const hemi = new THREE.HemisphereLight('#d6ecff', '#c2ad7e', 0.8);   // đất hắt ánh ấm (cát/cỏ) thay vì xanh rêu tối scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff0d2', 1.7); sun.castShadow = true;
  const r = CFG.quality.shadowRange; Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 1, far: 200 });
  sun.shadow.mapSize.set(CFG.quality.shadowSize, CFG.quality.shadowSize); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05;
  scene.add(sun, sun.target);
  scene.fog = new THREE.Fog('#cfeefa', 150, 400);

  const GROUND_DAY = new THREE.Color('#c2ad7e'), GROUND_NIGHT = new THREE.Color('#2a2f4a');
  // Mây: cụm phồng đáy phẳng, mặt dưới hơi xanh tím (màu theo đỉnh), trôi chậm
  const clouds = new THREE.Group(); scene.add(clouds);
  const cm = toon('#ffffff', { fog: false, emissive: '#ffffff', emissiveIntensity: 0.25, vertexColors: true });
  const blob = new THREE.IcosahedronGeometry(1, 2), cTop = new THREE.Color('#ffffff'), cBot = new THREE.Color('#d9e3f2'), cc = new THREE.Color();
  for (let i = 0; i < 14; i++) {
    const n = 4 + (i % 3), parts = [];   // gộp các khối của 1 đám mây thành 1 mesh (ít draw call)
    for (let k = 0; k < n; k++) {
      const s = 2.6 + Math.random() * 3.2 * (1 - Math.abs(k - (n - 1) / 2) / n), g = blob.clone(), p = g.attributes.position;
      for (let j = 0; j < p.count; j++) if (p.getY(j) < 0) p.setY(j, p.getY(j) * 0.25);   // đáy phẳng
      parts.push(g.scale(s * 1.2, s * 0.75, s).translate(k * 3.6 - n * 1.8, Math.random() * 0.8, (Math.random() - 0.5) * 3));
    }
    const geo = mergeGeometries(parts); geo.computeVertexNormals();
    const nrm = geo.attributes.normal, col = new Float32Array(nrm.count * 3);
    for (let j = 0; j < nrm.count; j++) { cc.copy(cBot).lerp(cTop, Math.min(1, Math.max(0, nrm.getY(j) * 0.6 + 0.55))); col.set([cc.r, cc.g, cc.b], j * 3); }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const g = new THREE.Mesh(geo, cm);
    const a = Math.random() * 6.28, d = 60 + Math.random() * 150; g.position.set(Math.cos(a) * d, 45 + Math.random() * 25, Math.sin(a) * d); g.userData.v = 1 + Math.random() * 1.5;
    clouds.add(g);
  }

  const state = { hour: CFG.time.startHour, night: 0, sunDir: new THREE.Vector3(), day: 4, moonPhase: 0.5, low: 0, cloudTint: new THREE.Color('#fff') }; // day: ngày thứ mấy (đổi pha trăng)
  const PHASES = 8, pink = new THREE.Color('#ffb3c8'), nightCloud = new THREE.Color('#7d86b8'), _w = new THREE.Color();
  // Pha trăng THỰC theo lịch: 0 = trăng non, 0,5 = trăng tròn (rằm), 1 = hết tháng âm lịch
  const SYNODIC = 29.530588853, NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
  const realMoonPhase = () => { const d = (Date.now() - NEW_MOON) / 864e5; return ((d / SYNODIC) % 1 + 1) % 1; };
  const MOON_COL = new THREE.Color('#c8d6ff');
  function apply() {
    const h = state.hour; let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] <= h) i++;
    const A = KEYS[i], B = KEYS[i + 1], t = (h - A[0]) / (B[0] - A[0]);
    U.uTop.value.copy(A[1]).lerp(B[1], t); U.uHor.value.copy(A[2]).lerp(B[2], t);
    sun.color.copy(A[3]).lerp(B[3], t); sun.intensity = A[4] + (B[4] - A[4]) * t; hemi.intensity = A[5] + (B[5] - A[5]) * t;
    hemi.color.copy(U.uHor.value).lerp(U.uTop.value, 0.35);
    scene.fog.color.copy(U.uHor.value).lerp(U.uTop.value, 0.15);   // sương mù = màu trời nhạt
    hemi.groundColor.copy(GROUND_DAY).lerp(GROUND_NIGHT, Math.min(1, Math.max(0, (0.1 - Math.sin(((h - 6) / 12) * Math.PI)) / 0.25)));
    const a = ((h - 6) / 12) * Math.PI, el = Math.sin(a);
    U.uSun.value.set(Math.cos(a) * 0.8, el, 0.45).normalize();
    state.sunDir.copy(el > 0 ? U.uSun.value : U.uSun.value.clone().negate()); state.sunDir.y = Math.max(state.sunDir.y, 0.15); state.sunDir.normalize();
    U.uSunCol.value.copy(sun.color);
    state.night = Math.min(1, Math.max(0, (0.1 - el) / 0.25)); U.uNight.value = state.night;
    // trăng: lệch khỏi mặt trời một góc = pha × 2π (trăng tròn đối diện mặt trời), mỗi ngày đổi 1/8 vòng
    state.moonPhase = realMoonPhase(); const am = a - state.moonPhase * Math.PI * 2;
    U.uMoon.value.set(Math.cos(am) * 0.8, Math.sin(am), 0.45).normalize(); U.uPhase.value = state.moonPhase;
    state.moonLit = (1 - Math.cos(state.moonPhase * Math.PI * 2)) / 2;                 // 0 trăng non → 1 trăng tròn
    const moonUp = Math.min(1, Math.max(0, U.uMoon.value.y / 0.15));
    if (state.night > 0.5 && moonUp > 0) {
      const k = (state.night - 0.5) * 2 * moonUp;
      state.sunDir.lerp(U.uMoon.value, k); state.sunDir.y = Math.max(state.sunDir.y, 0.2); state.sunDir.normalize();
      sun.color.lerp(MOON_COL, k); sun.intensity += k * (0.25 + 0.75 * state.moonLit);    // trăng tròn sáng rõ cảnh vật
      hemi.intensity += k * 0.25 * state.moonLit;
    }
    // mây nhuộm hồng cam lúc mặt trời thấp, xanh tím ban đêm
    state.low = Math.max(0, 1 - Math.abs(el - 0.05) / 0.3);
    state.cloudTint.set('#fff').lerp(_w.copy(sun.color).lerp(pink, 0.35), state.low * 0.8).lerp(nightCloud, state.night * 0.7);
    cm.emissive.copy(state.cloudTint); cm.emissiveIntensity = 0.1 + 0.3 * (1 - state.night);
  }
  apply();

  let prevH = state.hour;
  function update(dt, cam, target) {
    const slow = state.hour > 9 && state.hour < 16.5 ? 0.6 : 1;   // giờ đẹp ban ngày trôi chậm hơn
    state.hour += slow * dt / CFG.time.dayLengthSec * 24; if (state.hour >= 24) state.hour -= 24;
    if (state.hour < prevH - 12) state.day++; prevH = state.hour; U.uTime.value += dt; apply();   // qua nửa đêm (kể cả khi trường đặt giờ) → sang ngày mới
    dome.position.copy(cam.position);
    sun.target.position.copy(target); sun.position.copy(target).addScaledVector(state.sunDir, 80);
    for (const c of clouds.children) { c.position.x += c.userData.v * dt; if (c.position.x > 220) c.position.x = -220; }
  }
  return { update, state, sun, hemi, U, clouds, cloudMat: cm }; // U/clouds/cloudMat: weather.js chỉnh theo thời tiết
}
