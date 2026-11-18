// sky.js — Trời gradient, núi/đảo xa in trong sương + biển xa lấp lánh (vẽ ngay trên vòm, 0 draw call), mây vẽ tay xa (1 draw call instancing), quầng bình minh/hoàng hôn, mặt trời, trăng có pha theo lịch thật, sao lấp lánh, Ngân Hà, sương mù xa, ánh sáng theo giờ (ngày đêm), mây trôi.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CFG } from './config.js';
import { toon } from './style.js';

const PHI = (1 + Math.sqrt(5)) / 2, CLOUD_R = 200;

// [giờ, đỉnh trời, chân trời, màu nắng, cường độ nắng, cường độ trời (hemi)]
// Bảng 4 thời điểm mẫu (docs/style-guide.md): 8h30 trong trẻo · 13h không cháy · 17h40 vàng đào (không cam gắt) · 22h lam dịu + trăng.
// Nắng ấm ↔ trời (hemi) mát: bóng đổ mang sắc lam nhạt như tranh màu nước. Cường độ nắng trưa ≤ φ, trời ≈ 1/φ² … 1/φ.
const KEYS = [
  [0, '#1a2a5e', '#3a5288', '#b4c6ff', 0.46, 0.68],   // đêm: lam ánh trăng, đủ sáng để thấy thế giới (không chói như ngày)
  [4, '#1c2c62', '#41598f', '#b4c6ff', 0.47, 0.69],     // 4h: vẫn đêm, chân trời bắt đầu ửng lam
  [5, '#2a3b78', '#9c7fa6', '#d9b8d6', 0.5, 0.66],      // rạng đông: chân trời tím hồng
  [5.5, '#3a4d8c', '#eaa38e', '#ffb796', 0.6, 0.68],    // 5h30: hồng cam, sáng hơn đêm (không tụt sáng)
  [6, '#4a66ae', '#f6b996', '#ffc39a', 0.78, 0.6],
  [6.4, '#5677c0', '#f4cdb0', '#ffd2a6', 0.95, 0.54],   // bình minh: hồng đào nhạt
  [8, '#4a95e2', '#cfe6f2', '#ffe8c8', 1.26, 0.62],     // sáng sớm trong trẻo: nắng vàng mật nhẹ (không gắt), trời hắt nhiều hơn → bớt phẳng
  [10, '#3f8ee0', '#c8e4f4', '#fff2de', 1.45, 0.6],
  [14, '#3b89dd', '#c9e5f5', '#fff2de', 1.5, 0.56],     // trưa: nắng ≈ φ − 1/φ³, không trắng cháy
  [16.5, '#4b88d4', '#efe0c6', '#ffe6c0', 1.4, 0.6],
  [17.6, '#6687c6', '#f2d8bc', '#ffe0bc', 1.15, 0.7],    // giờ vàng: vàng đào, trời hắt mạnh (≈ 1/φ + 1/φ⁴ ·…) → bóng dài không đen

  [18.4, '#46559a', '#ecab90', '#ffb894', 0.75, 0.56],
  [19.6, '#22336a', '#5a6194', '#b0bdff', 0.4, 0.55],
  [24, '#1a2a5e', '#3a5288', '#b4c6ff', 0.46, 0.68],
].map(k => [k[0], new THREE.Color(k[1]), new THREE.Color(k[2]), new THREE.Color(k[3]), k[4], k[5]]);

export function createSky(scene) {
  const U = { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSun: { value: new THREE.Vector3() }, uSunCol: { value: new THREE.Color() }, uNight: { value: 0 },
    uMoon: { value: new THREE.Vector3(0, -1, 0) }, uPhase: { value: 0.5 }, uTime: { value: 0 },
    uSeaTint: { value: new THREE.Color('#1f7fa8') }, uMtnF: { value: new THREE.Color('#7f8fc0') }, uMtnN: { value: new THREE.Color('#4f7f8c') }, uMtn: { value: 1 } };
  const dome = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: U,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 uTop, uHor, uSun, uSunCol, uMoon, uSeaTint, uMtnF, uMtnN; uniform float uNight, uPhase, uMtn; uniform highp float uTime; varying vec3 vD;
      // hash nhỏ gọn (số luôn < ~40, không dùng sin×43758) → điện thoại mediump không mất sao / không tràn số
      float h(highp vec3 p){ p = fract(p * 0.1031); p += dot(p, p.yzx + 19.19); return fract((p.x + p.y) * p.z); }
      float h1(float i){ return fract(sin(i * 12.9898 + 4.1) * 437.585); }
      // núi xa: bao hình chuông quanh góc phương vị c (rộng w) — phương vị quấn vòng ±π
      float bump(float az, float c, float w){ float x = mod(az - c + 3.14159, 6.28318) - 3.14159; x /= w; return max(0., 1. - x * x); }
      // sườn gãy khúc kiểu low-poly: nội suy thẳng giữa các đỉnh ngẫu nhiên (n đỉnh / vòng)
      float ridge(float az, float n, float sd){ float u = (az + 3.14159) / 6.28318 * n, i = floor(u); return mix(h1(mod(i, n) + sd), h1(mod(i + 1., n) + sd), fract(u)); }
      void main(){ vec3 d = normalize(vD);
        float y = max(d.y, 0.);
        vec3 c = mix(uHor, mix(uHor, uTop, 0.45), smoothstep(0.0, 0.18, y));   // dải sáng mờ sát chân trời
        c = mix(c, uTop, smoothstep(0.12, 0.85, y));                          // lên đỉnh đậm dần (3 tầng)
        // biển xa dưới chân trời: lam ngọc pha sương (khớp màu cuối sương của mặt nước ocean-water.js) + vệt nắng lấp lánh về phía mặt trời
        float bel = 1. - smoothstep(-0.004, 0.0, d.y);   // (cạnh smoothstep phải tăng dần: ngược thứ tự là không xác định)
        vec3 sea = mix(uHor, uSeaTint, 0.44 + 0.18 * smoothstep(0., 0.15, -d.y));
        float sg = pow(max(dot(normalize(vec3(d.x, -d.y, d.z)), uSun), 0.), 13.) * step(-0.03, uSun.y);
        float tw = step(0.9, h(floor(vec3(d.x * 610., d.y * 2584., d.z * 610.)) + floor(uTime * 5.)));
        sea += uSunCol * sg * (0.18 + tw * 0.9) * (1. - uNight);
        c = mix(c, sea, bel);
        float s = max(dot(d, uSun), 0.);
        // quầng bình minh/hoàng hôn: dải sáng ấm ôm chân trời phía mặt trời (mặt trời càng thấp càng rộng)
        float low = smoothstep(-0.22, 0.02, uSun.y) * (1. - smoothstep(0.05, 0.4, uSun.y));
        c += uSunCol * (pow(s, 5.) * 0.6 * low * exp(-max(d.y, 0.) * 5.) + pow(s, 30.) * 0.25);
        c += uSunCol * smoothstep(0.9985, 0.9992, s) * 1.6 * step(-0.03, uSun.y);
        c += uSunCol * pow(s, 3.) * 0.06 * (1. - y) * step(-0.03, uSun.y);   // quầng ấm rộng quanh mặt trời
        // sao lấp lánh + dải Ngân Hà mờ — chỉ tính khi có đêm (uniform → cả màn hình cùng nhánh: ban ngày bỏ hẳn ~20 phép tính/điểm ảnh)
        if (uNight > 0.004 && d.y > 0.05) {
          vec3 cell = floor(d * 240.); float r = h(cell), up = smoothstep(0.05, 0.3, d.y);
          c += step(0.9975, r) * uNight * up * (0.55 + 0.45 * sin(uTime * (1.5 + r * 6.) + r * 50.));
          float mk = dot(d, normalize(vec3(0.35, 0.25, -0.9))) * 5., mw = exp(-mk * mk) * (0.65 + 0.35 * sin(d.x * 23. + sin(d.z * 17.) * 2.) * sin(d.y * 19. - d.z * 11.));
          c += vec3(0.07, 0.065, 0.11) * mw * uNight * up;
        }
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
        // đảo/núi xa in trong sương: 2 lớp (núi cao lam tím mờ · đảo thấp lam lục đậm hơn), chân núi tan vào sương.
        // Chừa trống hướng TÂY BẮC (phương vị −3π/4 ± 0,45) cho đảo Học viện Pha Lê (~1148 m).
        if (uMtn > 0.01 && d.y < 0.06) {
          float az = atan(d.z, d.x);
          float hF = max(max(bump(az, 0.35, 0.30) * 0.040, bump(az, 1.45, 0.22) * 0.030), max(max(bump(az, 2.55, 0.34) * 0.046, bump(az, -0.75, 0.25) * 0.034), max(bump(az, -1.55, 0.17) * 0.022, bump(az, 3.06, 0.2) * 0.026)));
          float hN = max(max(bump(az, 0.95, 0.12) * 0.017, bump(az, 2.08, 0.09) * 0.012), max(max(bump(az, -0.32, 0.1) * 0.014, bump(az, -1.12, 0.07) * 0.01), bump(az, 2.92, 0.08) * 0.011));
          hF *= 0.55 + 0.45 * ridge(az, 233., 0.); hN *= 0.5 + 0.5 * ridge(az, 377., 7.);
          float y = d.y + 0.003, base = smoothstep(-0.003, -0.001, d.y), inF = smoothstep(hF, hF - 0.0012, y) * step(1e-4, hF) * base, inN = smoothstep(hN, hN - 0.001, y) * step(1e-4, hN) * base;   // chỉ trên mặt biển
          float sunSide = sign(mod(atan(uSun.z, uSun.x) - az + 3.14159, 6.28318) - 3.14159);
          float lit = step(0., (ridge(az + 0.004, 233., 0.) - ridge(az, 233., 0.)) * sunSide);   // mặt sườn hướng nắng sáng hơn một bậc
          vec3 mF = mix(uHor, uMtnF * (0.94 + 0.12 * lit), 0.42 * smoothstep(0., hF * 0.8 + 1e-4, y) + 0.08);
          vec3 mN = mix(uHor, uMtnN, 0.5 * smoothstep(-0.002, hN * 0.7 + 1e-4, y) + 0.1);
          c = mix(c, mF, inF * uMtn); c = mix(c, mN, inN * uMtn);
        }
        gl_FragColor = vec4(c, 1.); }`,
  }));
  dome.scale.setScalar(1 / PHI);   // bán kính 400/φ ≈ 247 m < mặt cắt xa (CFG.view.far)
  dome.renderOrder = -1; dome.frustumCulled = false; scene.add(dome);

  const hemi = new THREE.HemisphereLight('#d6ecff', '#c2ad7e', 0.56);   // ánh trời (lam) + đất hắt ấm (cát/cỏ): làm mềm bóng đổ
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff0d2', 1.7); sun.castShadow = true;
  const r = CFG.quality.shadowRange; Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 1, far: 200 });
  sun.shadow.camera.layers.enable(1);   // layer 1: mảnh 'chỉ đổ bóng' của khối gộp lớn (decor.js shadowCells)
  sun.shadow.mapSize.set(CFG.quality.shadowSize, CFG.quality.shadowSize); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05;
  scene.add(sun, sun.target);
  scene.fog = new THREE.Fog('#cfeefa', CFG.view.fogNear, CFG.view.far);

  const GROUND_DAY = new THREE.Color('#c2ad7e'), GROUND_NIGHT = new THREE.Color('#2a2f4a'), WHITE = new THREE.Color('#fff'), NIGHT_FILL = new THREE.Color('#5a6eae');
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

  // Mây xa vẽ tay: billboard quay về camera, 1 InstancedBufferGeometry = 1 draw call. Vị trí tính trong shader (bám camera như vòm trời,
  // bán kính 144–233 m Fibonacci, trôi vòng rất chậm) → JS không phải cập nhật gì mỗi khung. Dáng: 5 múi tròn đáy phẳng, viền nét cọ gợn,
  // 3 bậc màu kiểu toon (đáy tím lam · giữa · đỉnh sáng), viền bạc phía mặt trời; càng sát chân trời càng tan vào sương.
  const NB = CFG.isMobile ? 13 : 21, GOLD = Math.PI * (3 - Math.sqrt(5));
  const fg = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1)); fg.instanceCount = NB;
  const aC = new Float32Array(NB * 4), aS = new Float32Array(NB * 4);
  for (let i = 0; i < NB; i++) {
    const f = (i / PHI) % 1, r = 144 + 89 * f, w = 34 + 34 * ((i * 0.382) % 1);
    aC.set([i * GOLD, r, 14 + 55 * ((i * 0.618 + f * 0.3) % 1) * (r / 233), w], i * 4);   // phương vị, bán kính, độ cao, bề rộng
    aS.set([i * 1.7 + 0.3, 0.34 + 0.16 * ((i * 0.236) % 1), (0.0021 + 0.0013 * f) * (i % 3 ? 1 : -1) * 0.5 + 0.0026, 0], i * 4);   // hạt giống, dẹt, tốc độ góc
  }
  fg.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 4)); fg.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4));
  const FU = { uTime: U.uTime, uSun: U.uSun, uSunCol: U.uSunCol, uHor: U.uHor, uTop: U.uTop, uNight: U.uNight, uLit: { value: null }, uShade: { value: new THREE.Color() }, uA: { value: 1 } };
  const farClouds = new THREE.Mesh(fg, new THREE.ShaderMaterial({
    uniforms: FU, transparent: true, depthWrite: false, fog: false,
    vertexShader: `attribute vec4 aC, aS; uniform float uTime; uniform vec3 uSun; varying vec2 vQ; varying float vEl, vSun, vSeed, vAsp;
      void main(){ float az = aC.x + uTime * aS.z;
        vec3 ctr = cameraPosition + vec3(cos(az) * aC.y, 0., sin(az) * aC.y); ctr.y = cameraPosition.y * 0.5 + aC.z;
        vec4 mv = viewMatrix * vec4(ctr, 1.); mv.xy += position.xy * vec2(aC.w, aC.w * aS.y);
        gl_Position = projectionMatrix * mv;
        vec3 dir = normalize(ctr - cameraPosition); vEl = dir.y; vSun = max(dot(dir, uSun), 0.);
        vQ = vec2(position.x, position.y * aS.y); vSeed = aS.x; vAsp = aS.y; }`,
    fragmentShader: `uniform vec3 uSunCol, uHor, uLit, uShade; uniform float uNight, uA; varying vec2 vQ; varying float vEl, vSun, vSeed, vAsp;
      float hs(float k){ return fract(sin(vSeed * 7.31 + k * 3.17) * 437.585); }
      void main(){ vec2 q = vQ; float b = -vAsp * 0.28, d = -1.;
        for (int k = 0; k < 5; k++) { float fk = float(k), x = (fk - 2.) * 0.165 + (hs(fk) - 0.5) * 0.06;
          float r = vAsp * (0.24 + 0.2 * hs(fk + 9.)) * (1. - abs(fk - 2.) * 0.16);
          d = max(d, r - length(q - vec2(x, b + r * 0.55))); }
        d = min(d, q.y - b);                                                        // đáy phẳng
        d += 0.006 * sin(q.x * 47. + vSeed) * sin(q.y * 41. - vSeed);              // viền gợn như nét cọ
        float a = smoothstep(0., 0.01, d) * uA * (1. - 0.382 * uNight); if (a < 0.01) discard;   // đêm: mây mờ hơn, nhường sao
        float t = (q.y - b) / (vAsp * 0.62);
        vec3 c = mix(uShade, uLit, smoothstep(0.26, 0.32, t) * 0.55 + smoothstep(0.6, 0.66, t) * 0.45);   // 3 bậc toon
        c *= 0.97 + 0.03 * sin(q.x * 23. + q.y * 31. + vSeed);                      // vân cọ
        c += uSunCol * (1. - smoothstep(0., 0.035, d)) * pow(vSun, 4.) * 0.5 * (1. - uNight);   // viền bạc phía mặt trời
        c = mix(uHor, c, 0.38 + 0.62 * smoothstep(0.03, 0.3, vEl));                // sát chân trời tan vào sương
        gl_FragColor = vec4(c, a); }`,
  }));
  farClouds.frustumCulled = false; farClouds.renderOrder = -0.55; farClouds.userData.n = NB; scene.add(farClouds);

  const state = { hour: CFG.time.startHour, night: 0, sunDir: new THREE.Vector3(), day: 4, moonPhase: 0.5, low: 0, cloudTint: new THREE.Color('#fff') }; // day: ngày thứ mấy (đổi pha trăng)
  const PHASES = 8, pink = new THREE.Color('#ffb3c8'), nightCloud = new THREE.Color('#7d86b8'), _w = new THREE.Color();
  // Pha trăng THỰC theo lịch: 0 = trăng non, 0,5 = trăng tròn (rằm), 1 = hết tháng âm lịch
  const SYNODIC = 29.530588853, NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
  const realMoonPhase = () => { const d = (Date.now() - NEW_MOON) / 864e5; return ((d / SYNODIC) % 1 + 1) % 1; };
  const MOON_COL = new THREE.Color('#c8d6ff');
  // sáng sớm: trời hắt ấm (đào nhạt) · chiều: trời hắt tím oải hương → bóng ngả tím, không xám/đen; đất hắt ấm theo nắng sáng
  const AM_SKY = new THREE.Color('#ffd9c2'), PM_SKY = new THREE.Color('#cbb8ee'), AM_GROUND = new THREE.Color('#d8b383'), SHADE_DAY = new THREE.Color('#b9b2e0'), SEA_DAY = new THREE.Color('#1f7fa8'), SEA_NIGHT = new THREE.Color('#0c2140');
  const bell = (x, c, w) => Math.max(0, 1 - ((x - c) / w) ** 2);
  function apply() {
    const h = state.hour; let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] <= h) i++;
    const A = KEYS[i], B = KEYS[i + 1], t = (h - A[0]) / (B[0] - A[0]);
    U.uTop.value.copy(A[1]).lerp(B[1], t); U.uHor.value.copy(A[2]).lerp(B[2], t);
    sun.color.copy(A[3]).lerp(B[3], t); sun.intensity = A[4] + (B[4] - A[4]) * t; hemi.intensity = A[5] + (B[5] - A[5]) * t;
    scene.fog.color.copy(U.uHor.value);   // sương = đúng màu chân trời của vòm → vật ở xa tan liền vào trời, không có vệt nối
    hemi.groundColor.copy(GROUND_DAY).lerp(AM_GROUND, 0.5 * bell(h, 8, 3)).lerp(GROUND_NIGHT, Math.min(1, Math.max(0, (0.1 - Math.sin(((h - 6) / 12) * Math.PI)) / 0.25)));
    const a = ((h - 6) / 12) * Math.PI, el = Math.sin(a);
    U.uSun.value.set(Math.cos(a) * 0.8, el, 0.45).normalize();
    state.sunDir.copy(el > 0 ? U.uSun.value : U.uSun.value.clone().negate()); state.sunDir.y = Math.max(state.sunDir.y, 0.27); state.sunDir.normalize();   // nắng thấp: bóng dài tối đa ≈ 3,6 lần vật (không phủ đen nửa khung)
    U.uSunCol.value.copy(sun.color);
    state.night = Math.min(1, Math.max(0, (0.1 - el) / 0.25)); U.uNight.value = state.night;
    // ánh trời = trung bình vòm trời pha trắng (lam mát cả lúc hoàng hôn → nắng ấm/bóng mát); đêm: lam ánh trăng dịu
    hemi.color.copy(U.uTop.value).lerp(U.uHor.value, 0.5).lerp(WHITE, 0.38).lerp(AM_SKY, 0.382 * bell(h, 8, 2.6)).lerp(PM_SKY, 0.3 * bell(h, 17.6, 1.6)).lerp(NIGHT_FILL, state.night);
    U.uSeaTint.value.copy(SEA_DAY).lerp(SEA_NIGHT, state.night);
    // trăng: lệch khỏi mặt trời một góc = pha × 2π (trăng tròn đối diện mặt trời), mỗi ngày đổi 1/8 vòng
    state.moonPhase = realMoonPhase(); const am = a - state.moonPhase * Math.PI * 2;
    U.uMoon.value.set(Math.cos(am) * 0.8, Math.sin(am), 0.45).normalize(); U.uPhase.value = state.moonPhase;
    state.moonLit = (1 - Math.cos(state.moonPhase * Math.PI * 2)) / 2;                 // 0 trăng non → 1 trăng tròn
    const moonUp = Math.min(1, Math.max(0, U.uMoon.value.y / 0.15));
    if (state.night > 0.5 && moonUp > 0) {
      const k = (state.night - 0.5) * 2 * moonUp;
      state.sunDir.lerp(U.uMoon.value, k); state.sunDir.y = Math.max(state.sunDir.y, 0.2); state.sunDir.normalize();
      sun.color.lerp(MOON_COL, k); sun.intensity += k * (0.15 + 0.4 * state.moonLit);    // trăng sáng rõ cảnh vật nhưng vẫn là đêm (sao/trăng nổi)
      hemi.intensity += k * 0.12 * state.moonLit;
    }
    // mây nhuộm hồng cam lúc mặt trời thấp, xanh tím ban đêm
    state.low = Math.max(0, 1 - Math.abs(el - 0.05) / 0.3);
    state.cloudTint.setRGB(1, 1, 1).lerp(_w.copy(sun.color).lerp(pink, 0.35), state.low * 0.8).lerp(nightCloud, state.night * 0.7);
    cm.emissive.copy(state.cloudTint); cm.emissiveIntensity = 0.1 + 0.3 * (1 - state.night);
    FU.uShade.value.copy(SHADE_DAY).lerp(U.uTop.value, 0.3).lerp(state.cloudTint, 0.3 * state.low).lerp(nightCloud, state.night).multiplyScalar(1 - 0.55 * state.night);
  }
  FU.uLit.value = cm.color;   // weather.js làm tối màu mây khi trời âm u → mây xa tối theo
  apply();

  // state.real: giờ thật (tự trôi / đồng hồ trường ghi vào) · state.lock: giờ người chơi chọn · state.hour: giờ đang hiển thị
  // Đổi giờ (nút Sáng/Trưa/Chiều/Tối, về Thật) → tua dần trong φ giây: trời, nắng, sương, đèn đều chuyển mượt
  state.real = state.hour;
  let prevH = state.hour, tw = null;
  function update(dt, cam, target) {
    const slow = state.real > 9 && state.real < 16.5 ? 0.6 : 1;   // giờ đẹp ban ngày trôi chậm hơn
    state.real = (state.real + slow * dt / CFG.time.dayLengthSec * 24) % 24;
    const goal = state.lock != null ? state.lock : state.real, gap = d => { d = ((d % 24) + 24) % 24; return d > 12 ? d - 24 : d; };
    if (!tw && Math.abs(gap(goal - state.hour)) > 0.25) tw = { from: state.hour, t: 0 };
    if (tw) {
      tw.t += dt; const x = Math.min(1, tw.t / PHI), e = x * x * (3 - 2 * x);
      state.hour = ((tw.from + gap(goal - tw.from) * e) % 24 + 24) % 24; if (x >= 1) tw = null;
    } else state.hour = goal;
    if (state.hour < prevH - 12) state.day++; prevH = state.hour; U.uTime.value += dt; apply();   // qua nửa đêm (kể cả khi trường đặt giờ) → sang ngày mới
    dome.position.copy(cam.position);
    U.uMtn.value = Math.min(1, Math.max(0, (scene.fog.far - 150) / 130)) * (1 - 0.5 * state.night);   // sương mù/mưa (weather.js kéo sương gần) → núi xa khuất
    sun.target.position.copy(target); sun.position.copy(target).addScaledVector(state.sunDir, 80);
    // mây trôi theo gió, quấn quanh người chơi trong ô ±200 m → luôn nằm trong tầm nhìn (≤ CFG.view.far), không bị cắt
    for (const c of clouds.children) {
      c.position.x += c.userData.v * dt;
      const dx = c.position.x - cam.position.x, dz = c.position.z - cam.position.z;
      if (dx > CLOUD_R) c.position.x -= 2 * CLOUD_R; else if (dx < -CLOUD_R) c.position.x += 2 * CLOUD_R;
      if (dz > CLOUD_R) c.position.z -= 2 * CLOUD_R; else if (dz < -CLOUD_R) c.position.z += 2 * CLOUD_R;
    }
  }
  return { update, state, sun, hemi, U, clouds, cloudMat: cm, farClouds, farU: FU }; // U/clouds/cloudMat: weather.js chỉnh theo thời tiết
}
