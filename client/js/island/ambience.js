// ambience.js — Bối cảnh sống động quanh người chơi (nhẹ cho điện thoại, mỗi phần ≤ 1 draw call, chỉ quanh người chơi):
//   đèn sáng dần khi tối (quầng sáng + vũng sáng trên đất) · đom đóm, bồ công anh, lá rơi, bụi nắng (1 Points chạy trên GPU)
//   khói bếp từ ống khói giờ nấu cơm · sương thấp thung lũng lúc bình minh · cá bơi & thỉnh thoảng nhảy khỏi mặt nước
//   xe bánh mì / xe kem chạy vòng quanh trường có tiếng rao · âm thanh tự tổng hợp: chuông chùa, trống trường, gà gáy, ve sầu
//   chỉnh màu hậu kỳ theo giờ + tia nắng · kiến thức tự nhiên hiện đúng lúc (mỗi điều 1 lần)
// Tỷ lệ vàng: bán kính/kích thước theo φ và dãy Fibonacci (layout.js). Mức chất lượng ctx.qualityLevel 0..3 giảm số hạt / tắt hiệu ứng.
import * as THREE from 'three';
import { LIGHTS, CHIMNEYS, GLOW_MATS, Batch } from './decor.js';
import { PHI, FIB, TOWN_Y, RING_ROAD_R, ROAD_W, TEMPLE_C, HOUSE_LOTS, HOUSE_W, LOT_L, LOT_BACK, lotToWorld } from './layout.js';
import { WIND } from './terrain.js';
import { gradientMap } from './style.js';
import { createYardLife } from './yard-life.js';
import { CFG } from './config.js';

const MOTES = [610, 377, 233, 0];            // số hạt theo mức chất lượng (Fibonacci)
const BOX = 34;                              // hạt quấn quanh người chơi trong ô 34 m (Fibonacci)
const SMOKE_N = 13, CHIM_MAX = 8;            // 13 cụm khói / ống khói, tối đa 8 ống gần nhất
const FISH = 13;
const FACT = {
  firefly: '✨ Đom đóm tự phát sáng nhờ phản ứng hoá học trong bụng — gọi là phát quang sinh học, gần như không toả nhiệt.',
  smoke: '🍚 Khói bếp bay thẳng lên vì không khí nóng nhẹ hơn không khí lạnh xung quanh.',
  seed: '🌼 Hạt bồ công anh có chùm lông như chiếc dù nhỏ: gió mang hạt đi thật xa để cây mọc ở chỗ mới.',
  leaf: '🍂 Lá già chuyển vàng vì chất diệp lục (màu xanh) bị phân huỷ, lộ ra sắc tố vàng cam vốn có trong lá.',
  sunset: '🌅 Lúc hoàng hôn, ánh nắng đi xiên qua lớp không khí rất dày: ánh xanh bị tán xạ hết, chỉ còn cam đỏ tới mắt ta.',
  mist: '🌫️ Sương thấp đọng ở thung lũng vì không khí lạnh nặng hơn, đêm về trôi xuống chỗ trũng rồi ngưng tụ thành sương.',
  moon: p => `🌙 Hôm nay là ${p}. Trăng không tự sáng mà phản chiếu ánh Mặt Trời; hình dạng đổi dần, khoảng 29,5 ngày một vòng.`,
  rays: '☀️ Tia nắng lọt qua khe lá thành những vệt sáng thẳng: ánh sáng truyền theo đường thẳng!',
  fish: '🐟 Cá thở bằng mang: mang lọc lấy khí ô-xi hoà tan trong nước.',
  cicada: '🎶 Tiếng ve sầu mùa hè do con ve đực rung màng nhĩ ở bụng, không phải bằng miệng.',
  bell: '🔔 Tiếng chuông lan đi trong không khí dưới dạng sóng âm, khoảng 340 mét mỗi giây.',
  cart: ['🥖 Bánh mì nóng giòn đây! — Men trong bột sinh khí CO₂ làm ổ bánh nở xốp.', '🍦 Kem mát lạnh đây! — Kem tan vì nhận nhiệt từ không khí ấm xung quanh.'],
};
const MOON = ['trăng non', 'trăng lưỡi liềm đầu tháng', 'trăng bán nguyệt đầu tháng', 'trăng khuyết sắp tròn', 'trăng rằm (tròn)', 'trăng khuyết sau rằm', 'trăng bán nguyệt cuối tháng', 'trăng lưỡi liềm cuối tháng'];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const _o = new THREE.Object3D(), _v = new THREE.Vector3(), _c = new THREE.Color(), WHITE = new THREE.Color('#ffffff'), _s2 = new THREE.Vector2();   // dùng lại, không tạo mới mỗi khung

export function createAmbience(ctx) {
  const { scene, camera, renderer, terrain, sky } = ctx;
  const Q = () => ctx.qualityLevel || 0;
  const wU = terrain.waterMat.uniforms;
  const scaleU = { value: 600 };     // đổi kích thước điểm (m) → pixel
  const updScale = () => { const s = _s2; renderer.getDrawingBufferSize(s); scaleU.value = s.y / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)); };

  // ---------- Nối nước với bầu trời (phản chiếu chân trời, lấp lánh nắng) ----------
  wU.uSunW.value = sky.U.uSun.value; wU.uSkyH.value = sky.U.uHor.value; if (sky.U.uSeaTint) wU.uSeaTint.value = sky.U.uSeaTint.value; wU.uSunC.value = sky.U.uSunCol.value;
  if (wU.uSkyT) { wU.uSkyT.value = sky.U.uTop.value; wU.uMoon.value = sky.U.uMoon.value; wU.uNight = sky.U.uNight; }   // ocean-water.js: trời đỉnh, trăng

  // ---------- Đèn: quầng sáng + vũng sáng dưới chân đèn (chỉ hiện khi tối) ----------
  const L = { n: -1, halo: null, pool: null, night: { value: 0 } };
  const haloMat = new THREE.ShaderMaterial({
    uniforms: { uN: L.night, uScale: scaleU }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: `uniform float uScale; varying float vF; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv;
      gl_PointSize = 2.6 * uScale / -mv.z; vF = 1. - smoothstep(60., 144., -mv.z); }`,
    fragmentShader: `uniform float uN; varying float vF; void main(){ vec2 p = gl_PointCoord - .5; float d = dot(p, p) * 4.;
      gl_FragColor = vec4(vec3(1., .78, .45) * (exp(-d * 5.) * 0.9 + exp(-d * 40.) * 0.8) * uN * vF, 1.); }`,
  });
  const poolMat = new THREE.ShaderMaterial({
    uniforms: { uN: L.night }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: 'varying vec2 vU; void main(){ vU = uv - .5; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.); }',
    fragmentShader: 'uniform float uN; varying vec2 vU; void main(){ float d = length(vU) * 2.; gl_FragColor = vec4(vec3(1., .72, .4) * pow(max(0., 1. - d), 2.) * 0.42 * uN, 1.); }',
  });
  function buildLights() {
    L.n = LIGHTS.length; if (L.halo) { scene.remove(L.halo, L.pool); L.halo.geometry.dispose(); L.pool.dispose(); }
    if (!L.n) return;
    L.halo = new THREE.Points(new THREE.BufferGeometry().setFromPoints(LIGHTS), haloMat); L.halo.frustumCulled = false; L.halo.renderOrder = 2;
    L.pool = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), poolMat, L.n); L.pool.frustumCulled = false;
    const R = 2 * PHI * PHI;   // vũng sáng đường kính 2φ² ≈ 5,2 m
    LIGHTS.forEach((p, i) => {
      let g = terrain.heightAt(p.x, p.z); if (ctx.groundExtra) g = Math.max(g, ctx.groundExtra(p.x, p.z, p.y - 1));
      if (p.y - g > 6 || p.y < g) g = p.y - 2.4;   // đèn trên mái / ban công: đặt vũng ước lượng
      _o.position.set(p.x, g + 0.04, p.z); _o.rotation.set(0, 0, 0); _o.scale.set(R, 1, R); _o.updateMatrix(); L.pool.setMatrixAt(i, _o.matrix);
    });
    scene.add(L.halo, L.pool);
  }

  // ---------- Hạt sống: đom đóm (đêm) · bồ công anh, lá rơi, bụi nắng (ngày) — 1 Points, chuyển động hoàn toàn trên GPU ----------
  const MU = { uP: { value: new THREE.Vector3() }, uT: { value: 0 }, uNight: { value: 0 }, uDay: { value: 1 }, uSunny: { value: 1 }, uWind: { value: 0 }, uScale: scaleU,
    uH: wU.uH, uMin: wU.uMin, uSize: wU.uSize };
  const NM = MOTES[0], ma = new Float32Array(NM * 4);
  for (let i = 0; i < NM; i++) ma.set([Math.random(), Math.random(), Math.random(), i % 4], i * 4);   // 4 loại xen kẽ → giảm số hạt vẫn đủ loại
  const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NM * 3), 3)); mg.setAttribute('a', new THREE.BufferAttribute(ma, 4));
  const motes = new THREE.Points(mg, new THREE.ShaderMaterial({
    uniforms: MU, transparent: true, depthWrite: false, fog: false,
    vertexShader: `uniform vec3 uP; uniform float uT, uNight, uDay, uSunny, uWind, uScale; uniform sampler2D uH; uniform vec2 uMin, uSize; attribute vec4 a;
      varying vec4 vC; varying float vK, vR;
      void main(){ const float S = ${BOX}.; float k = a.w, ph = a.z * 6.2832;
        vec2 xz = uP.xz + (fract(a.xy - uP.xz / S + .5) - .5) * S;
        float g = texture2D(uH, (xz - uMin) / uSize).r * 255. / 12. - 8., y, sz, al; vec3 col; vR = 0.;
        vec2 wd = vec2(1., .4) * (.3 + uWind);
        if (k < .5) {        // đom đóm: lượn thấp, nhấp nháy
          xz += vec2(sin(uT * .7 + ph * 3.), cos(uT * .53 + ph * 5.)) * 1.3; y = g + .4 + 1.6 * fract(a.z * 7.) + sin(uT * 1.1 + ph) * .3;
          al = uNight * smoothstep(.45, 1., sin(uT * (1.3 + a.z) + ph * 9.)) * step(.6, g); sz = .3; col = vec3(1.6, 2.2, .6);
        } else if (k < 1.5) { // bồ công anh: bay lên chậm, trôi theo gió
          float l = fract(uT * .035 + a.z); xz += wd * l * 13.; y = g + .3 + l * 5. + sin(uT + ph) * .3;
          al = uDay * smoothstep(0., .1, l) * smoothstep(1., .8, l) * step(1.15, g) * .9; sz = .1; col = vec3(1.);
        } else if (k < 2.5) { // lá rơi: lắc lư rơi xuống
          float l = fract(uT * .06 + a.z); y = g + 5. * (1. - l); xz += vec2(sin(uT * 2. + ph) * .8, cos(uT * 1.7 + ph) * .5) + wd * l * 5.;
          al = uDay * smoothstep(0., .08, l) * smoothstep(1., .92, l) * step(1.15, g); sz = .2; vR = uT * 3. + ph;
          col = mix(vec3(.95, .55, .15), vec3(.6, .78, .22), fract(a.z * 13.));
        } else {             // bụi nắng: lơ lửng lấp lánh
          y = g + .5 + 3. * fract(a.z * 3.) + sin(uT * .3 + ph) * .4; xz += vec2(sin(uT * .2 + ph), cos(uT * .17 + ph)) * .6;
          al = uDay * uSunny * .55 * (.5 + .5 * sin(uT * 2. + ph * 7.)); sz = .06; col = vec3(1.3, 1.2, .9);
        }
        vec4 mv = viewMatrix * vec4(xz.x, y, xz.y, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = max(1.5, sz * uScale / -mv.z);
        vC = vec4(col, al * (1. - smoothstep(S * .3, S * .5, length(xz - uP.xz)))); vK = k; }`,
    fragmentShader: `varying vec4 vC; varying float vK, vR; void main(){ vec2 p = gl_PointCoord - .5;
        if (vK > 1.5 && vK < 2.5) { float c = cos(vR), s = sin(vR); p = mat2(c, -s, s, c) * p; if (abs(p.x) * 1.7 + abs(p.y) > .45) discard; gl_FragColor = vC; return; }
        float d = dot(p, p) * 4.; if (d > 1.) discard; gl_FragColor = vec4(vC.rgb, vC.a * (1. - d)); }`,
  }));
  motes.frustumCulled = false; motes.renderOrder = 3; scene.add(motes);

  // ---------- Khói bếp: ống khói gần người chơi, giờ nấu cơm (sáng, trưa, chiều tối) ----------
  const SU = { uT: MU.uT, uScale: scaleU, uWind: MU.uWind, uA: { value: 0 }, uLight: { value: new THREE.Color() } };
  const sg = new THREE.BufferGeometry(), sp = new Float32Array(CHIM_MAX * SMOKE_N * 3), sph = new Float32Array(CHIM_MAX * SMOKE_N);
  for (let i = 0; i < sph.length; i++) sph[i] = (i % SMOKE_N) / SMOKE_N + Math.random() * 0.05;
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('ph', new THREE.BufferAttribute(sph, 1));
  const smoke = new THREE.Points(sg, new THREE.ShaderMaterial({
    uniforms: SU, transparent: true, depthWrite: false,
    vertexShader: `uniform float uT, uScale, uWind; attribute float ph; varying float vA;
      void main(){ float l = fract(uT * .09 + ph); vec3 p = position + vec3(1., 0., .4) * l * l * (1.5 + 4. * uWind) + vec3(sin(uT * .8 + ph * 20.) * .3 * l, l * 6.5, 0.);
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = (.5 + l * 2.2) * uScale / -mv.z;
        vA = smoothstep(0., .08, l) * (1. - l); }`,
    fragmentShader: 'uniform float uA; uniform vec3 uLight; varying float vA; void main(){ vec2 p = gl_PointCoord - .5; float d = dot(p, p) * 4.; if (d > 1.) discard; gl_FragColor = vec4(uLight, (1. - d) * vA * uA * .45); }',
  }));
  smoke.frustumCulled = false; smoke.visible = false; scene.add(smoke);
  let chimT = 0, smokeA = 0;
  // bếp củi sau mỗi nhà (sân sau, khoảng lùi LOT_BACK): bếp đất + nồi + củi — 1 mesh gộp; khói bốc từ nồi
  const STOVE = [], SRC = () => CHIMNEYS.concat(STOVE); let stoves = null;
  function buildStoves() {
    const b = new Batch('bep');
    for (const Lt of HOUSE_LOTS) {
      if (!Lt.house) continue; const [x, z] = lotToWorld(Lt, HOUSE_W / 2 - 1, -LOT_L / 2 + LOT_BACK / 2), y = TOWN_Y;
      b.group(x, y, z, Lt.ry || 0, () => {
        b.box(0.9, 0.5, 0.62, 0, 0, 0, '#a0522d'); b.box(0.3, 0.2, 0.05, 0, 0.08, 0.31, '#2b1d14');      // bếp đất, cửa lò
        b.cyl(0.22, 0.17, 0.3, 0, 0.5, 0, '#2f2f33', 8); b.cyl(0.24, 0.24, 0.04, 0, 0.8, 0, '#3b3b40', 8);  // nồi cơm
        for (let k = 0; k < 3; k++) b.cyl(0.05, 0.05, 0.8, 0.75, 0.05 + k * 0.1, -0.1 + k * 0.08, '#7a5236', 5, 0.2 * k, 0, Math.PI / 2); // bó củi
      });
      ctx.colliders.push({ x, z, r: 0.6 }); STOVE.push(new THREE.Vector3(x, y + 0.85, z));
      // dây phơi quần áo: 2 cọc tre + dây, áo quần treo bay theo gió (mesh riêng bên dưới)
      b.group(x, y, z, Lt.ry || 0, () => { for (const u of LINE_U) b.cyl(0.04, 0.05, LINE_H + 0.1, u, 0, LINE_V, '#c9a45c', 5); b.box(LINE_U[1] - LINE_U[0], 0.02, 0.02, (LINE_U[0] + LINE_U[1]) / 2, LINE_H, LINE_V, '#e8e2d0'); });
      clothes(x, y, z, Lt.ry || 0);
    }
    const m = b.mesh(new THREE.MeshLambertMaterial({ vertexColors: true }), false); if (m) { m.receiveShadow = false; scene.add(m); }
    if (CL.pos.length) {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(CL.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(CL.nor, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(CL.col, 3)); g.setAttribute('flap', new THREE.Float32BufferAttribute(CL.flap, 1));
      const cm = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap, side: THREE.DoubleSide });
      cm.onBeforeCompile = sh => {   // vạt áo càng xa dây càng bay mạnh; gió to (weather) → bay phần phật
        Object.assign(sh.uniforms, WIND);
        sh.vertexShader = 'uniform float uTime, uWind; attribute float flap;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
          float fw = sin(uTime * (3.2 + uWind * 4.) + position.x * 1.9 + position.z * 1.3 + flap * 2.) * (0.05 + uWind * 0.16) + uWind * 0.22 + 0.04;
          transformed += objectNormal * fw * flap; transformed.y += abs(fw) * flap * 0.25;`);
      };
      cm.customProgramCacheKey = () => 'clothes';
      const cmesh = new THREE.Mesh(g, cm); cmesh.castShadow = true; cmesh.frustumCulled = false; scene.add(cmesh);
    }
    return m;
  }
  // áo quần trên dây: lưới 2×3 ô, trên cùng gắn dây (flap 0) → dưới cùng bay tự do (flap 1)
  const LINE_U = [-9.6, -2.4], LINE_V = -1.3, LINE_H = 1.9, CL = { pos: [], nor: [], col: [], flap: [] };
  const CLOTH = [[0.62, 0.68, '#f4f4f0'], [0.5, 0.82, '#2b4f8c'], [0.8, 0.28, '#e8392f'], [0.58, 0.62, '#9fd3ea'], [0.44, 0.78, '#3b3f4a'], [0.6, 0.6, '#ffd36e']];   // áo trắng, quần xanh, khăn quàng đỏ…
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _n3 = new THREE.Matrix3();
  function clothes(x, y, z, ry) {
    _m4.compose(_v.set(x, y, z), _q.setFromAxisAngle(_v.clone().set(0, 1, 0), ry), new THREE.Vector3(1, 1, 1)); _n3.getNormalMatrix(_m4);
    let u = LINE_U[0] + 0.5, k = Math.floor(Math.abs(x * 7 + z * 3)) % CLOTH.length;
    while (u < LINE_U[1] - 0.6) {
      const [w, h, col] = CLOTH[k++ % CLOTH.length]; _c.set(col);
      const g = new THREE.PlaneGeometry(w, h, 2, 3).toNonIndexed().translate(u + w / 2, LINE_H - h / 2, LINE_V);
      const P = g.attributes.position, N = g.attributes.normal;
      for (let i = 0; i < P.count; i++) {
        CL.flap.push((LINE_H - P.getY(i)) / h);
        _v.fromBufferAttribute(P, i).applyMatrix4(_m4); CL.pos.push(_v.x, _v.y, _v.z);
        _v.fromBufferAttribute(N, i).applyMatrix3(_n3).normalize(); CL.nor.push(_v.x, _v.y, _v.z); CL.col.push(_c.r, _c.g, _c.b);
      }
      u += w + 0.25 + (k % 3) * 0.12;
    }
  }
  function pickChimneys(p) {
    const near = SRC().map(c => [c.distanceToSquared(p), c]).filter(q => q[0] < 89 * 89).sort((a, b) => a[0] - b[0]).slice(0, CHIM_MAX);
    for (let i = 0; i < CHIM_MAX * SMOKE_N; i++) { const c = near[Math.floor(i / SMOKE_N)]; if (c) sp.set([c[1].x, c[1].y + 0.1, c[1].z], i * 3); else sp.set([0, -999, 0], i * 3); }
    sg.attributes.position.needsUpdate = true; sg.setDrawRange(0, near.length * SMOKE_N); return near.length;
  }

  // ---------- Sương thấp: 3 lớp mặt phẳng ở độ cao cố định → đồi nhô lên, thung lũng & mặt hồ chìm trong sương ----------
  const mistU = { uA: { value: 0 }, uT: MU.uT, uP: MU.uP, uCol: { value: new THREE.Color() } };
  const mistG = []; for (const h of [0.5, 1.3, 2.4]) mistG.push(new THREE.PlaneGeometry(144, 144).rotateX(-Math.PI / 2).translate(0, h, 0));
  const mistGeo = new THREE.BufferGeometry(); { const pos = []; for (const g of mistG) { const nn = g.index ? g.toNonIndexed() : g; pos.push(...nn.attributes.position.array); } mistGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); }
  const mist = new THREE.Mesh(mistGeo, new THREE.ShaderMaterial({
    uniforms: mistU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: 'varying highp vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uA; uniform highp float uT; uniform vec3 uP, uCol; varying highp vec3 vW;
      void main(){ vec2 q = vW.xz * .06 + vec2(uT * .02, uT * .013) + vW.y * 3.;
        float n = .55 + .45 * sin(q.x + sin(q.y * 1.3) * 1.7) * sin(q.y * .9 + sin(q.x * .8) * 2.);
        float edge = 1. - smoothstep(34., 72., length(vW.xz - uP.xz));
        float nearCam = smoothstep(1.5, 8., length(vW - cameraPosition));
        gl_FragColor = vec4(uCol, uA * n * edge * nearCam * .2); }`,
  }));
  mist.frustumCulled = false; mist.visible = false; mist.renderOrder = 4; scene.add(mist);

  // ---------- Cá: bơi vòng dưới nước trong gần người chơi, thỉnh thoảng 1 con nhảy lên ----------
  const fishGeo = (() => { const b = new Batch('fish'); b.push(new THREE.ConeGeometry(0.09, 0.34, 5).rotateX(Math.PI / 2), '#ffffff'); b.push(new THREE.ConeGeometry(0.08, 0.14, 3).rotateX(-Math.PI / 2), '#ffffff', 0, 0, -0.22, 0, 0, 0, 0.25, 1, 1); const g = b.mesh(null).geometry; g.deleteAttribute('color'); return g; })();
  // vẽ sau mặt nước, bóng cá sẫm hơi trong → nhìn như đang bơi dưới làn nước trong
  const fish = new THREE.InstancedMesh(fishGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.6, depthWrite: false }), FISH); fish.frustumCulled = false; fish.visible = false; fish.renderOrder = 5; scene.add(fish);
  const fl = Array.from({ length: FISH }, (_, i) => ({ x: 0, z: 0, y: -0.3, r: 1 + Math.random() * 2, ph: Math.random() * 6.28, v: (0.4 + Math.random() * 0.5) * (i % 2 ? 1 : -1), jump: -1 }));
  ['#1d4f5c', '#c4602a', '#245a66', '#16404a', '#d08a2a'].forEach((c, i) => { for (let k = i; k < FISH; k += 5) fish.setColorAt(k, _c.set(c)); });
  let fishHome = null, fishT = 0, jumpT = 8;
  function findWater(p) { for (let k = 0; k < 24; k++) { const a = Math.random() * 6.28, r = 4 + Math.random() * 9, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r, h = terrain.heightAt(x, z); if (h < -0.5 && h > -4) return [x, z, h]; } return null; }

  // ---------- Xe bánh mì & xe kem chạy quanh đường vòng (1 InstancedMesh) ----------
  const cartGeo = (() => {
    const b = new Batch('cart');
    b.box(1.6, 0.8, 0.9, 0, 0.35, 0, '#ffffff'); b.box(1.62, 0.12, 0.92, 0, 0.75, 0, '#e8d2a8');
    for (const s of [-1, 1]) b.cyl(0.26, 0.26, 0.08, -0.4, 0.26, s * 0.48, '#2b2633', 8, 0, Math.PI / 2);
    b.cyl(0.03, 0.03, 1.6, 0, 0.87, 0, '#8a8a8a', 5); b.cone(1.1, 0.5, 0, 2.3, 0, '#ffffff', 8);   // dù che
    b.box(0.08, 0.08, 0.9, 0.95, 0.7, 0, '#6b4a2b');                                              // tay đẩy
    b.cyl(0.17, 0.2, 0.7, 1.35, 0.55, 0, '#3f6fb0', 6); b.cyl(0.12, 0.12, 0.62, 1.35, 0, 0, '#3b3f4a', 6); b.ball(0.17, 1.35, 1.42, 0, '#f2c9a0'); b.cone(0.3, 0.2, 1.35, 1.56, 0, '#e8d2a8', 8); // người bán, nón lá
    const g = b.mesh(null).geometry; return g;
  })();
  const carts = new THREE.InstancedMesh(cartGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), 2); carts.castShadow = true; carts.frustumCulled = false; scene.add(carts);
  carts.setColorAt(0, _c.set('#f2a64e')); carts.setColorAt(1, _c.set('#8fd3f0'));
  const CR = RING_ROAD_R + ROAD_W / 4;   // làn bên phải đường vòng
  const cartS = [{ a: 0.4, v: 1.3 / CR, stop: 0 }, { a: 0.4 + Math.PI, v: -1.1 / CR, stop: 0 }];

  // ---------- Âm thanh tự tổng hợp (Web Audio, không cần file) ----------
  let A = null;
  function snd() {
    const Lst = ctx.audio && ctx.audio.listener; if (!Lst || Lst.context.state !== 'running' || !ctx.audio.on) return null; if (A) return A;
    const ac = Lst.context, out = Lst.getInput();
    const pan = (x, y, z, ref = 8) => { const p = ac.createPanner(); p.panningModel = 'equalpower'; p.distanceModel = 'inverse'; p.refDistance = ref; p.rolloffFactor = 1.4; p.maxDistance = 400; p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z; p.connect(out); return p; };
    const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    // ve sầu: nhiễu lọc dải cao, rung biên độ ~45 Hz, lặp — to nhỏ theo giờ trưa
    const cs = ac.createBufferSource(); cs.buffer = nb; cs.loop = true; const cf = ac.createBiquadFilter(); cf.type = 'bandpass'; cf.frequency.value = 5200; cf.Q.value = 6;
    const am = ac.createGain(); am.gain.value = 0.5; const lfo = ac.createOscillator(); lfo.frequency.value = 45; const lg = ac.createGain(); lg.gain.value = 0.5; lfo.connect(lg).connect(am.gain);
    const cg = ac.createGain(); cg.gain.value = 0; cs.connect(cf).connect(am).connect(cg).connect(out); cs.start(); lfo.start();
    const cartPan = [pan(0, 1.5, 0, 6), pan(0, 1.5, 0, 6)];
    A = { ac, out, pan, nb, cicada: cg, cartPan };
    return A;
  }
  const tone = (dst, f, t, dur, vol, type = 'sine', f2) => { const o = A.ac.createOscillator(), g = A.ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, t + dur); o.connect(g).connect(dst); o.start(t); o.stop(t + dur + 0.05); };
  const SND = {
    // chuông chùa: các họa âm không đều, ngân dài
    bell(x, y, z) { const d = A.pan(x, y, z, 26), t = A.ac.currentTime; for (const [f, v, dur] of [[110, 0.5, 7], [264, 0.3, 5], [432, 0.18, 3.5], [611, 0.1, 2.5], [890, 0.05, 1.6]]) tone(d, f, t, dur, v); },
    // trống trường: 3 tiếng "tùng" trầm
    drum(x, y, z, n = 3) { const d = A.pan(x, y, z, 30), t0 = A.ac.currentTime; for (let i = 0; i < n; i++) { const t = t0 + i * 0.62; tone(d, 120, t, 0.7, 0.9, 'sine', 48); const s = A.ac.createBufferSource(), f = A.ac.createBiquadFilter(), g = A.ac.createGain(); s.buffer = A.nb; f.type = 'lowpass'; f.frequency.value = 400; g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18); s.connect(f).connect(g).connect(d); s.start(t, Math.random()); s.stop(t + 0.2); } },
    // gà gáy "ò ó o o": sóng răng cưa qua 2 bộ lọc giọng, cao độ lên xuống
    rooster(x, y, z) {
      const d = A.pan(x, y, z, 14), t = A.ac.currentTime, o = A.ac.createOscillator(), g = A.ac.createGain(), f1 = A.ac.createBiquadFilter(), f2 = A.ac.createBiquadFilter(), mix = A.ac.createGain();
      o.type = 'sawtooth'; f1.type = f2.type = 'bandpass'; f1.frequency.value = 1100; f2.frequency.value = 2600; f1.Q.value = f2.Q.value = 5; mix.gain.value = 0.9;
      const pts = [[0, 520], [0.18, 700], [0.45, 760], [0.7, 900], [1.2, 880], [1.55, 620]]; for (const [dt, f] of pts) o.frequency.linearRampToValueAtTime(f, t + dt);
      g.gain.setValueAtTime(0, t); for (const [dt, v] of [[0.03, 0.35], [0.17, 0.12], [0.22, 0.35], [0.66, 0.2], [0.72, 0.4], [1.4, 0.3], [1.6, 0]]) g.gain.linearRampToValueAtTime(v, t + dt);
      o.connect(g); g.connect(f1).connect(mix); g.connect(f2).connect(mix); mix.connect(d); o.start(t); o.stop(t + 1.7);
    },
    // tiếng rao của xe: 5 nốt ngũ cung leng keng
    jingle(i) { const d = A.cartPan[i], t = A.ac.currentTime, base = i ? 784 : 659; [0, 2, 4, 2, 7].forEach((s, k) => tone(d, base * Math.pow(2, s / 12), t + k * 0.2, 0.35, 0.22, 'triangle')); },
    plop(x, y, z) { const d = A.pan(x, y, z, 5), t = A.ac.currentTime; tone(d, 900, t, 0.18, 0.4, 'sine', 300); const s = A.ac.createBufferSource(), f = A.ac.createBiquadFilter(), g = A.ac.createGain(); s.buffer = A.nb; f.type = 'bandpass'; f.frequency.value = 1500; g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3); s.connect(f).connect(g).connect(d); s.start(t, Math.random()); s.stop(t + 0.32); },
  };
  ctx.ambienceSfx = (k, ...a) => { if (snd() && SND[k]) SND[k](...a); };   // gỡ lỗi: __island.ambienceSfx('rooster', x, y, z)

  // ---------- Kiến thức đúng lúc: mỗi điều 1 lần, cách nhau ≥ 55 giây ----------
  const told = new Set(); let factT = 20;
  const fact = (k, txt) => { if (told.has(k) || factT > 0 || !ctx.toast) return; told.add(k); factT = 55; ctx.toast(txt || FACT[k], 7000); };
  const yard = createYardLife(ctx, fact);   // học sinh nhảy dây, đá cầu ở quảng trường trước cổng trường

  // ---------- Cập nhật ----------
  const st = { lastH: sky.state.hour, school: undefined, bellT: 20, roosterDay: -1, jingleT: [4, 9] };
  let t = 0, lightT = 0;
  const night0 = new THREE.Color('#0b1430'), warm = new THREE.Color('#ffb070'), cool = new THREE.Color('#8fa8ff');
  function update(dt) {
    t += dt; factT -= dt;
    const p = ctx.player.pos, q = Q(), S = sky.state, h = S.hour, night = S.night, day = 1 - night, W = ctx.weather ? ctx.weather.cur : { c: 0, r: 0, w: 0, f: 0 };
    updScale(); MU.uT.value = t; MU.uP.value.copy(p); MU.uWind.value = W.w;
    const dusk = h >= 12 ? smooth(17.4, 19.2, h) : 1 - smooth(5.4, 6.8, h);   // 0 ngày … 1 tối (đèn bật từ chạng vạng, tắt khi sáng hẳn)
    const lit = Math.max(night, Math.min(1, dusk));

    // đèn
    if ((lightT -= dt) <= 0) { lightT = 2; if (LIGHTS.length !== L.n) buildLights(); if (!stoves && HOUSE_LOTS.some(l => l.house)) stoves = buildStoves() || true; }   // nhà được gán sau khi trường tải xong
    L.night.value = lit * (q >= 3 ? 0.6 : 1);
    if (L.halo) { L.halo.visible = L.pool.visible = lit > 0.02; L.pool.visible = L.pool.visible && q < 3; }
    for (const m of GLOW_MATS) m.color.setScalar(0.7 + 1.1 * lit);
    wU.uLight.value = (0.3 + 0.7 * day) * (0.75 + 0.25 * Math.min(1, sky.hemi.intensity / 0.85));   // nước tối dần theo đêm

    // hạt
    const nM = MOTES[q]; motes.visible = nM > 0; mg.setDrawRange(0, nM);
    MU.uNight.value = night * (1 - W.r); MU.uDay.value = day * (1 - W.r * 0.9); MU.uSunny.value = (1 - W.c) * (1 - S.low * 0.3);
    if (night > 0.8 && W.r < 0.2) fact('firefly');
    else if (day > 0.9 && W.r < 0.1 && t > 40) fact(Math.random() < 0.5 ? 'seed' : 'leaf');

    // khói bếp
    const cook = smooth(5.6, 6.0, h) * (1 - smooth(7.0, 7.5, h)) + smooth(10.4, 10.8, h) * (1 - smooth(12.0, 12.5, h)) + smooth(16.4, 16.8, h) * (1 - smooth(19.0, 19.6, h));
    smokeA += ((q < 3 ? cook * (1 - W.r * 0.7) : 0) - smokeA) * Math.min(1, dt * 0.5);
    if ((chimT -= dt) <= 0) { chimT = 2.5; smoke.userData.n = smokeA > 0.01 ? pickChimneys(p) : 0; }
    smoke.visible = smokeA > 0.01 && smoke.userData.n > 0; SU.uA.value = smokeA;
    SU.uLight.value.copy(sky.hemi.color).multiplyScalar(0.55 + 0.45 * Math.min(1, sky.hemi.intensity)).lerp(WHITE, 0.4 * day);
    if (smoke.visible && smokeA > 0.6) fact('smoke');

    // sương thấp: bình minh (5h–8h30) + sương mù của thời tiết
    const dawn = smooth(4.6, 5.6, h) * (1 - smooth(7.4, 8.6, h));
    const mA = q >= 2 ? 0 : Math.min(1, dawn * 0.85 + W.f * 0.7) * (1 - W.r * 0.5);
    mist.visible = mA > 0.02; mistU.uA.value = mA; mist.position.set(p.x, 0, p.z); mistU.uCol.value.copy(scene.fog.color).lerp(WHITE, 0.35 * day);
    if (mA > 0.5) fact('mist');

    // cá
    fishT -= dt;
    if (fishT <= 0) { fishT = 3; if (!fishHome || Math.hypot(fishHome[0] - p.x, fishHome[1] - p.z) > 26) fishHome = findWater(p); }
    fish.visible = !!fishHome && q < 3 && day > 0.2;
    if (fish.visible) {
      const [hx, hz, hh] = fishHome;
      if ((jumpT -= dt) <= 0) { jumpT = 8 + Math.random() * 13; const f = fl[Math.floor(Math.random() * FISH)]; f.jump = 0; }
      fl.forEach((f, i) => {
        const a = t * f.v + f.ph, ox = hx + Math.cos(i * 2.4) * 2.5, oz = hz + Math.sin(i * 2.4) * 2.5;
        let x = ox + Math.cos(a) * f.r, z = oz + Math.sin(a) * f.r, y = Math.max(hh + 0.2, -0.16 - (i % 3) * 0.1), pitch = 0;
        if (f.jump >= 0) { f.jump += dt / 0.9; const k = f.jump; y = -0.2 + Math.sin(k * Math.PI) * 1.1; pitch = (0.5 - k) * 2; if (k > 1) { f.jump = -1; if (A) SND.plop(x, 0, z); fact('fish'); } else if (k < 0.05 && A) SND.plop(x, 0, z); }
        _o.position.set(x, y, z); _o.rotation.set(pitch, a + (f.v > 0 ? 0 : Math.PI), Math.sin(t * 9 + i) * 0.15, 'YXZ'); _o.scale.setScalar(PHI * (0.8 + (i % 4) * 0.15)); _o.updateMatrix(); fish.setMatrixAt(i, _o.matrix);
      });
      fish.instanceMatrix.needsUpdate = true;
    }

    // xe bánh mì, xe kem
    const A2 = snd();
    cartS.forEach((c, i) => {
      if (c.stop > 0) c.stop -= dt; else { c.a += c.v * dt; if (Math.random() < dt / 40) c.stop = 5 + Math.random() * 8; }   // thỉnh thoảng dừng bán
      const x = Math.cos(c.a) * CR, z = Math.sin(c.a) * CR, dir = c.a + Math.sign(c.v) * Math.PI / 2;
      _o.position.set(x, TOWN_Y, z); _o.rotation.set(0, -dir + Math.PI, 0); _o.scale.setScalar(1); _o.updateMatrix(); carts.setMatrixAt(i, _o.matrix);
      const d = Math.hypot(x - p.x, z - p.z);
      if (A2) { const pn = A2.cartPan[i]; pn.positionX.value = x; pn.positionZ.value = z; pn.positionY.value = TOWN_Y + 1.5; if ((st.jingleT[i] -= dt) <= 0) { st.jingleT[i] = 7 + Math.random() * 5; if (d < 55 && day > 0.3) SND.jingle(i); } }
      if (d < 8 && day > 0.3) fact('cart' + i, FACT.cart[i]);
    });
    carts.instanceMatrix.needsUpdate = true; carts.visible = day > 0.15 || dusk < 0.8;

    // âm thanh theo giờ
    if (A2) {
      const cic = smooth(9.5, 11, h) * (1 - smooth(15.5, 17, h)) * (1 - W.r) * (1 - W.c * 0.6);
      if (Math.abs(cic - (st.cic ?? -1)) > 0.01) { st.cic = cic; A2.cicada.gain.setTargetAtTime(cic * 0.035, A2.ac.currentTime, 1.5); }   // chỉ khi đổi (hằng số 1,5 s)
      if (cic > 0.7 && t > 60) fact('cicada');
      // chuông chùa: mỗi 34–55 giây khi ở trong ~200 m, ban ngày và chiều tối
      if ((st.bellT -= dt) <= 0) { st.bellT = 34 + Math.random() * 21; const d = Math.hypot(TEMPLE_C[0] - p.x, TEMPLE_C[1] - p.z); if (d < 200 && (h > 4.5 && h < 21)) { SND.bell(TEMPLE_C[0], 8, TEMPLE_C[1]); if (d < 60) fact('bell'); } }
      // trống trường khi bắt đầu/kết thúc giờ học
      if (st.school !== undefined && st.school !== !!ctx.schoolHours && Math.hypot(p.x, p.z) < 260) SND.drum(0, TOWN_Y + 3, 0);
      // gà gáy lúc rạng sáng (1 lần mỗi ngày, ở nhà gần nhất)
      if (h > 5.2 && h < 6.6 && st.roosterDay !== S.day && SRC().length) { st.roosterDay = S.day; const c = SRC().reduce((b, c) => (c.distanceToSquared(p) < b.distanceToSquared(p) ? c : b)); SND.rooster(c.x, c.y + 0.5, c.z); }
    }
    st.school = !!ctx.schoolHours;
    yard.update(dt, t, day, W);

    // trăng, hoàng hôn, tia nắng
    if (night > 0.9 && W.c < 0.5) fact('moon', FACT.moon(MOON[Math.round(S.moonPhase * 8) % 8]));
    if (S.low > 0.6 && day > 0.4 && W.c < 0.5) fact('sunset');
    grade(S, W, q, day, night);
  }

  // ---------- Chỉnh màu hậu kỳ theo giờ + tia nắng ----------
  const sunNDC = new THREE.Vector3();
  function grade(S, W, q, day, night) {
    const G = ctx.post && ctx.post.grade; if (!G) return;
    const golden = S.low * day;
    // làm nét: luôn nhẹ; mạnh hơn khi máy đang vẽ dưới độ phân giải màn hình (pixelRatio bị hạ) → hết nhoè
    if (G.uSharp) G.uSharp.value = Math.min(0.62, 0.2 + 0.55 * Math.max(0, devicePixelRatio / renderer.getPixelRatio() - 1));
    // gain: sáng ấm lúc giờ vàng, lam nhạt ban đêm; lift: nâng vùng tối một chút về phía lam (đêm không đen kịt)
    _c.setRGB(1, 1, 1).lerp(warm, golden * 0.22).lerp(cool, night * 0.25); G.uGain.value.set(_c.r, _c.g, _c.b).multiplyScalar(1 + golden * 0.04);
    _c.copy(night0).multiplyScalar(night * 0.6 + 0.08 * W.f); G.uLift.value.set(_c.r, _c.g, _c.b);
    G.uSat.value = q >= 2 ? 1 : 1.06 + golden * 0.1 - night * 0.22 - W.c * 0.08 - W.r * 0.1; G.uCon.value = q >= 2 ? 1 : 1.04 - W.f * 0.08;
    // tia nắng (12 mẫu/điểm ảnh): chỉ chất lượng cao nhất (điện thoại: chỉ ở ✨ Đẹp), mặt trời trên trời và gần khung hình
    sunNDC.copy(sky.U.uSun.value).multiplyScalar(300).add(camera.position).project(camera);
    const front = sunNDC.z < 1, onScr = Math.max(Math.abs(sunNDC.x), Math.abs(sunNDC.y));
    const rays = q === 0 && (!CFG.isMobile || ctx.qualityMode === 'pretty') && front && sky.U.uSun.value.y > 0.02 ? (1 - smooth(1.0, 1.8, onScr)) * day * (1 - W.c * 0.8) * (1 - W.r) * (0.35 + golden * 0.5) : 0;
    G.uRays.value += (rays - G.uRays.value) * 0.1; G.uSunUV.value.set(sunNDC.x * 0.5 + 0.5, sunNDC.y * 0.5 + 0.5); G.uAsp.value = camera.aspect;
    G.uRayCol.value.copy(sky.sun.color).lerp(WHITE, 0.3);
    if (G.uRays.value > 0.25 && onScr < 0.6) fact('rays');
  }
  return { update, motes, smoke, mist, fish, carts, lights: L, stoves: STOVE, yard };
}
