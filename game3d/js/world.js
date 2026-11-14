// world.js — ĐỊA HÌNH, BẦU TRỜI, ÁNH SÁNG, SƯƠNG, NƯỚC, ĐƯỜNG ĐI, CẦU, QUẢNG TRƯỜNG, MÂY, CHIM, ÂM THANH.
// - Hình dáng đồi núi: hàm rawHeight()      - Màu đất/cỏ/đường: hàm terrainColor()
// - Màu trời theo giờ: mảng SKY_KEYS         - Cầu tự sinh ở chỗ đường cắt sông: buildBridges()
// - Tiếng gió/chim/nước: class Ambience
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { STYLE_INFO } from './buildings.js';
import { clamp, lerp, smooth, fbm, rng, segDist, Mesher, U, flatMat } from './utils.js';

const W = CONFIG.world, C = CONFIG.colors, R = CONFIG.river;

// ---------- Bố cục: vị trí khu, vòng sáng, đường đi (tự tính từ CONFIG.AREAS) ----------
function computeLayout() {
  const rand = rng(CONFIG.seed + 7);
  const areas = CONFIG.AREAS.map(a => {
    const info = STYLE_INFO[a.style] || STYLE_INFO.none;
    const len = Math.hypot(a.x, a.z) || 1, fx = -a.x / len, fz = -a.z / len; // hướng nhìn về quảng trường
    const rot = Math.atan2(fx, fz);
    const pd = info.hd + 3.2;
    return Object.assign({ h: 0 }, a, { info, rot, fx, fz, portal: { x: a.x + fx * pd, z: a.z + fz * pd } });
  });
  const paths = [];
  for (const a of areas) {
    const ex = a.portal.x + a.fx * 1.5, ez = a.portal.z + a.fz * 1.5;
    const L = Math.hypot(ex, ez), dx = ex / L, dz = ez / L;
    const sx = dx * (W.plazaRadius - 1), sz = dz * (W.plazaRadius - 1);
    const bend = (rand() - 0.5) * Math.min(14, L * 0.18);
    const mx = (sx + ex) / 2 - dz * bend, mz = (sz + ez) / 2 + dx * bend;
    paths.push({ ax: sx, az: sz, bx: mx, bz: mz, ha: 0, hb: a.h / 2, area: a.id });
    paths.push({ ax: mx, az: mz, bx: a.portal.x, bz: a.portal.z, ha: a.h / 2, hb: a.h, area: a.id });
  }
  return { areas, paths };
}

export function riverDist(x, z) {
  let best = 1e9; const P = R.points;
  for (let i = 0; i < P.length - 1; i++) { const d = segDist(x, z, P[i][0], P[i][1], P[i + 1][0], P[i + 1][1]).d; if (d < best) best = d; }
  return best;
}

export function createWorld(ctx) {
  const { scene } = ctx;
  const layout = computeLayout();
  const S = W.size, N = W.segments, step = S / N, half = S / 2;

  function pathInfo(x, z) {
    let d = 1e9, h = 0;
    for (const p of layout.paths) { const r = segDist(x, z, p.ax, p.az, p.bx, p.bz); if (r.d < d) { d = r.d; h = lerp(p.ha, p.hb, r.t); } }
    return { d, h };
  }

  // Độ cao "thô" (tính bằng công thức) — dùng để dựng lưới địa hình
  function rawHeight(x, z) {
    const r = Math.hypot(x, z);
    const amp = 1.4 + 7.5 * smooth(30, 118, r);
    let h = (fbm(x * 0.011 + 3, z * 0.011 - 7) - 0.28) * amp * 1.7 + (fbm(x * 0.05, z * 0.05) - 0.5) * 0.8;
    h += smooth(108, 138, r) * (16 + 16 * fbm(x * 0.025, z * 0.025)); // núi vòng quanh làm ranh giới
    // làm phẳng quảng trường, các khu, đường đi
    h = lerp(h, 0, 1 - smooth(W.plazaRadius, W.plazaRadius + 12, r));
    for (const a of layout.areas) { const d = Math.hypot(x - a.x, z - a.z); h = lerp(h, a.h, 1 - smooth(a.info.flat, a.info.flat + 12, d)); }
    const p = pathInfo(x, z); h = lerp(h, p.h, (1 - smooth(W.pathWidth * 0.6, W.pathWidth * 0.6 + 7, p.d)) * 0.92);
    // khoét lòng sông
    const rd = riverDist(x, z), rm = 1 - smooth(R.width * 0.5, R.width * 0.5 + R.bank, rd);
    h = Math.min(h, lerp(h, -R.depth, rm));
    return h;
  }

  // ---------- Lưới địa hình ----------
  const H = new Float32Array((N + 1) * (N + 1));
  for (let iz = 0; iz <= N; iz++) for (let ix = 0; ix <= N; ix++) H[iz * (N + 1) + ix] = rawHeight(-half + ix * step, -half + iz * step);

  // Độ cao đúng theo tam giác của lưới (khớp với hình hiển thị) — dùng cho nhân vật đứng
  function groundAt(x, z) {
    const gx = clamp((x + half) / step, 0, N - 0.001), gz = clamp((z + half) / step, 0, N - 0.001);
    const ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz, n = N + 1;
    const a = H[iz * n + ix], b = H[(iz + 1) * n + ix], c = H[(iz + 1) * n + ix + 1], d = H[iz * n + ix + 1];
    return fx + fz <= 1 ? a + (d - a) * fx + (b - a) * fz : c + (b - c) * (1 - fx) + (d - c) * (1 - fz);
  }

  const cGrassA = new THREE.Color(C.grassA), cGrassB = new THREE.Color(C.grassB), cDry = new THREE.Color(C.grassDry), cPath = new THREE.Color(C.path),
    cSand = new THREE.Color(C.sand), cRock = new THREE.Color(C.rock), cCliff = new THREE.Color(C.cliff), cPlaza = new THREE.Color(C.plaza), cRing = new THREE.Color(C.plazaRing),
    cBed = new THREE.Color('#6f7f5a'), tmp = new THREE.Color();
  const rj = rng(CONFIG.seed);
  function terrainColor(x, z, h, slope, out) {
    out.copy(cGrassA).lerp(cGrassB, fbm(x * 0.045, z * 0.045));
    out.lerp(cDry, smooth(0.55, 0.8, fbm(x * 0.02 + 40, z * 0.02)) * 0.6);
    const rd = riverDist(x, z);
    out.lerp(cSand, 1 - smooth(R.width * 0.5 + 1, R.width * 0.5 + R.bank + 2, rd));
    if (h < W.waterLevel) out.lerp(cBed, 0.6);
    out.lerp(cCliff, smooth(0.45, 0.9, slope));
    out.lerp(cRock, smooth(7, 15, h) * 0.85);
    const p = pathInfo(x, z); out.lerp(tmp.copy(cPath).offsetHSL(0, 0, (fbm(x * 0.3, z * 0.3) - 0.5) * 0.08), (1 - smooth(W.pathWidth * 0.42, W.pathWidth * 0.62, p.d)) * (h > W.waterLevel + 0.2 ? 1 : 0));
    const r = Math.hypot(x, z);
    if (r < W.plazaRadius + 0.5) { const ring = Math.abs(Math.sin(r * 1.1)) > 0.85 || (r > W.plazaRadius - 1.2); out.copy(ring ? cRing : cPlaza); }
    const j = (rj() - 0.5) * 0.05; out.offsetHSL(0, 0, j);
    return out;
  }

  const geo = new THREE.PlaneGeometry(S, S, N, N); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), cc = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const ix = Math.round((x + half) / step), iz = Math.round((z + half) / step), n = N + 1;
    const h = H[iz * n + ix]; pos.setY(i, h);
    const hx = H[iz * n + Math.min(ix + 1, N)] - H[iz * n + Math.max(ix - 1, 0)], hz = H[Math.min(iz + 1, N) * n + ix] - H[Math.max(iz - 1, 0) * n + ix];
    const slope = clamp(Math.hypot(hx, hz) / (step * 2) / 1.2, 0, 1);
    terrainColor(x, z, h, slope, cc); col[i * 3] = cc.r; col[i * 3 + 1] = cc.g; col[i * 3 + 2] = cc.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.deleteAttribute('uv'); geo.computeVertexNormals();
  const terrain = new THREE.Mesh(geo, flatMat()); terrain.receiveShadow = true; terrain.name = 'terrain';
  scene.add(terrain);

  // ---------- Nước lấp lánh ----------
  const waterMat = new THREE.ShaderMaterial({
    transparent: true, fog: true, depthWrite: false,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uTime: U.uTime, uShallow: { value: new THREE.Color(C.water) }, uDeep: { value: new THREE.Color(C.waterDeep) }, uSun: { value: new THREE.Color('#fff2c8') }, uDay: { value: 1 },
    }]),
    vertexShader: `varying vec3 vW; #include <fog_pars_vertex>
      void main(){ vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; vec4 mvPosition = viewMatrix*w; gl_Position=projectionMatrix*mvPosition; #include <fog_vertex> }`.replace(/#include <(\w+)>/g, m => '\n' + m + '\n'),
    fragmentShader: `uniform float uTime; uniform vec3 uShallow; uniform vec3 uDeep; uniform vec3 uSun; uniform float uDay; varying vec3 vW; #include <fog_pars_fragment>
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      void main(){
        vec2 p = vW.xz*0.35;
        float w = n(p + vec2(uTime*0.35, uTime*0.2)) * 0.6 + n(p*2.3 - vec2(uTime*0.5, -uTime*0.3)) * 0.4;
        vec3 c = mix(uDeep, uShallow, 0.45 + 0.4*w);
        float s = pow(n(vW.xz*1.6 + vec2(uTime*0.9, uTime*0.7)) * n(vW.xz*2.1 - uTime*0.6), 6.0) * 9.0;
        c += uSun * s * (0.35 + 0.65*uDay);
        c *= 0.35 + 0.65*uDay;
        gl_FragColor = vec4(c, 0.86);
        #include <fog_fragment>
      }`.replace(/#include <(\w+)>/g, m => '\n' + m + '\n'),
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(S, S, 1, 1).rotateX(-Math.PI / 2), waterMat);
  water.position.y = W.waterLevel; water.renderOrder = 1; scene.add(water);

  // ---------- Cầu (tự đặt ở chỗ đường cắt sông) ----------
  const bridges = [];
  function buildBridges() {
    const m = new Mesher(), wood = '#8a5a34', woodL = '#a87445', stone = '#9a9184';
    for (const p of layout.paths) {
      const L = Math.hypot(p.bx - p.ax, p.bz - p.az), n = Math.ceil(L / 0.5); let t0 = -1, t1 = -1;
      for (let i = 0; i <= n; i++) { const t = i / n, x = lerp(p.ax, p.bx, t), z = lerp(p.az, p.bz, t); if (riverDist(x, z) < R.width * 0.5 + R.bank * 0.7) { if (t0 < 0) t0 = t; t1 = t; } }
      if (t0 < 0) continue;
      const ext = 2.5 / L; t0 = Math.max(0, t0 - ext); t1 = Math.min(1, t1 + ext);
      const ax = lerp(p.ax, p.bx, t0), az = lerp(p.az, p.bz, t0), bx = lerp(p.ax, p.bx, t1), bz = lerp(p.az, p.bz, t1);
      const len = Math.hypot(bx - ax, bz - az), dx = (bx - ax) / len, dz = (bz - az) / len, ry = Math.atan2(dx, dz);
      const base = Math.max(groundAt(ax, az), groundAt(bx, bz), W.waterLevel + 0.6) + 0.12, arch = Math.min(1.2, len * 0.06);
      const br = { ax, az, dx, dz, len, base, arch, half: 1.75 }; bridges.push(br);
      const yAt = u => base + arch * Math.sin(Math.PI * clamp(u / len, 0, 1));
      for (let u = 0.25; u < len; u += 0.55) {
        const x = ax + dx * u, z = az + dz * u, y = yAt(u);
        m.add(new THREE.BoxGeometry(3.4, 0.16, 0.5), (Math.floor(u / 0.55) % 2 ? wood : woodL), { p: [x, y - 0.08, z], r: [0, ry, 0] });
      }
      for (const side of [-1, 1]) {
        const ox = dz * side * 1.65, oz = -dx * side * 1.65;
        for (let u = 0; u <= len + 0.01; u += len / Math.max(3, Math.round(len / 2.4))) {
          const x = ax + dx * u + ox, z = az + dz * u + oz, y = yAt(u);
          m.add(new THREE.BoxGeometry(0.18, 1.0, 0.18), wood, { p: [x, y + 0.45, z] });
          m.add(new THREE.BoxGeometry(0.4, Math.max(0.5, y - W.waterLevel + 1.2), 0.4), stone, { p: [x, (y + W.waterLevel - 1.2) / 2, z], r: [0, ry, 0] });
        }
        const segs = 8;
        for (let i = 0; i < segs; i++) {
          const u0 = (i / segs) * len, u1 = ((i + 1) / segs) * len, y0 = yAt(u0) + 0.95, y1 = yAt(u1) + 0.95;
          const x = ax + dx * (u0 + u1) / 2 + ox, z = az + dz * (u0 + u1) / 2 + oz, sl = Math.hypot(u1 - u0, y1 - y0);
          m.add(new THREE.BoxGeometry(0.12, 0.12, sl), woodL, { p: [x, (y0 + y1) / 2, z], r: [-Math.atan2(y1 - y0, u1 - u0), ry, 0] });
        }
      }
    }
    if (!m.empty) { const mesh = new THREE.Mesh(m.geometry(), flatMat({ side: THREE.DoubleSide })); mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh); }
  }
  buildBridges();

  function bridgeHeight(x, z) {
    for (const b of bridges) {
      const rx = x - b.ax, rz = z - b.az, u = rx * b.dx + rz * b.dz, v = Math.abs(-rx * b.dz + rz * b.dx);
      if (u >= -0.3 && u <= b.len + 0.3 && v < b.half) return b.base + b.arch * Math.sin(Math.PI * clamp(u / b.len, 0, 1));
    }
    return null;
  }
  // Độ cao chỗ nhân vật đứng (đất hoặc mặt cầu). null = không đi được (nước sâu)
  function walkHeight(x, z) {
    const bh = bridgeHeight(x, z); if (bh != null) return bh;
    const g = groundAt(x, z); return g < W.waterLevel + 0.15 ? null : g;
  }

  // ---------- Quảng trường + đài phun nước ----------
  const fountain = (() => {
    const m = new Mesher(), st = '#cfc3a8', st2 = '#b3a68a';
    m.add(new THREE.CylinderGeometry(4.2, 4.5, 0.7, 10), st2, { p: [0, 0.35, 0] });
    m.add(new THREE.CylinderGeometry(3.6, 3.6, 0.72, 10), '#7aa6a8', { p: [0, 0.38, 0] });
    m.add(new THREE.CylinderGeometry(0.55, 0.8, 2.2, 8), st, { p: [0, 1.3, 0] });
    m.add(new THREE.CylinderGeometry(1.7, 0.6, 0.45, 10), st, { p: [0, 2.4, 0] });
    m.add(new THREE.CylinderGeometry(0.25, 0.35, 1.0, 6), st2, { p: [0, 3.0, 0] });
    m.add(new THREE.IcosahedronGeometry(0.35, 0), '#e3d7ba', { p: [0, 3.6, 0] });
    const mesh = new THREE.Mesh(m.geometry(), flatMat()); mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh);
    const wd = new THREE.Mesh(new THREE.CircleGeometry(3.55, 20).rotateX(-Math.PI / 2), waterMat); wd.position.y = 0.66; scene.add(wd);
    // tia nước
    const n = 220, g = new THREE.BufferGeometry(), arr = new Float32Array(n * 3), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) seed[i] = Math.random();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: '#e9fbff', size: 0.16, transparent: true, opacity: 0.85, depthWrite: false }));
    scene.add(pts);
    return { update(t) { for (let i = 0; i < n; i++) { const k = (t * 0.55 + seed[i]) % 1, a = seed[i] * 40, r = 0.4 + k * 1.6; arr[i * 3] = Math.cos(a) * r; arr[i * 3 + 1] = 3.7 + k * 1.6 - k * k * 3.6; arr[i * 3 + 2] = Math.sin(a) * r; } g.attributes.position.needsUpdate = true; } };
  })();
  ctx.colliders.push({ x: 0, z: 0, r: 4.6 });

  // ---------- Bầu trời gradient + mặt trời + sao ----------
  const skyU = { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uBot: { value: new THREE.Color('#d9c7a5') }, uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color() }, uNight: { value: 0 } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(CONFIG.quality.farView * 0.9, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform vec3 uTop, uHor, uBot, uSunDir, uSunCol; uniform float uNight; varying vec3 vD;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
      void main(){
        vec3 d = normalize(vD); float y = d.y;
        vec3 c = y > 0. ? mix(uHor, uTop, pow(smoothstep(0., 0.75, y), 0.7)) : mix(uHor, uBot, smoothstep(0., -0.25, y));
        float sd = max(dot(d, uSunDir), 0.);
        c += uSunCol * (pow(sd, 1400.) * 1.2 + pow(sd, 24.) * 0.22 + pow(sd, 3.) * 0.07) * (1. - uNight*0.6);
        vec3 cell = floor(d * 260.); float st = step(0.9975, h(cell)) * smoothstep(0.05, 0.3, y);
        c += st * uNight * (0.6 + 0.4*sin(h(cell+1.)*50. + uSunDir.x*400.));
        gl_FragColor = vec4(c, 1.);
      }`,
  }));
  sky.renderOrder = -1; scene.add(sky);

  // ---------- Ánh sáng ----------
  const hemi = new THREE.HemisphereLight('#cfe3f5', '#8a7a50', 0.8); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffd9a0', 1.6);
  sun.castShadow = true;
  const sr = CONFIG.quality.shadowRange;
  Object.assign(sun.shadow.camera, { left: -sr, right: sr, top: sr, bottom: -sr, near: 1, far: 220 });
  sun.shadow.mapSize.set(CONFIG.quality.shadowSize, CONFIG.quality.shadowSize);
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.05; sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  scene.fog = new THREE.Fog('#f2d2a6', 70, CONFIG.quality.farView * 0.8);

  // Màu trời theo giờ: [giờ, đỉnh trời, chân trời, màu nắng, cường độ nắng, trời (hemi), đất (hemi), cường độ hemi, sương]
  const SKY_KEYS = [
    [0, '#0b1430', '#25315c', '#9fb4ff', 0.22, '#33427a', '#1a1f2a', 0.42, '#1f2a4c'],
    [5.2, '#1c2a5a', '#7d6a8e', '#ffb27a', 0.3, '#6f7fb0', '#3a3530', 0.5, '#7d6a8e'],
    [6.4, '#4a6fb0', '#f4b089', '#ffbf8a', 0.9, '#a7b8dc', '#6b5a4a', 0.65, '#e9b996'],
    [8.5, '#4f93d8', '#c2e1f1', '#fff1d6', 1.55, '#bcd9f5', '#7b8a55', 0.75, '#cfe3ea'],
    [12, '#3d86d6', '#b6dcf2', '#fffaf0', 1.75, '#c4e0fa', '#84935a', 0.8, '#cbe3ee'],
    [15.2, '#4b8bd4', '#e8dcc0', '#ffe2b0', 1.7, '#d4d8c4', '#8a8054', 0.78, '#ead8b8'],
    [17, '#5b86c8', '#ffcf98', '#ffc47c', 1.6, '#e2c7a6', '#8a7048', 0.72, '#f2cd9e'],
    [18.3, '#3f4f8e', '#ff9468', '#ff8a52', 0.95, '#b48ea2', '#5a4a40', 0.6, '#e49c80'],
    [19.4, '#1c2452', '#6b4a7c', '#b49cff', 0.3, '#5a5a8c', '#2a2630', 0.48, '#4a3f66'],
    [24, '#0b1430', '#25315c', '#9fb4ff', 0.22, '#33427a', '#1a1f2a', 0.42, '#1f2a4c'],
  ].map(k => [k[0], new THREE.Color(k[1]), new THREE.Color(k[2]), new THREE.Color(k[3]), k[4], new THREE.Color(k[5]), new THREE.Color(k[6]), k[7], new THREE.Color(k[8])]);

  const state = { hour: CONFIG.time.startHour, night: 0, day: 1, sunDir: new THREE.Vector3() };
  function applySky() {
    const h = state.hour; let i = 0; while (i < SKY_KEYS.length - 2 && SKY_KEYS[i + 1][0] <= h) i++;
    const A = SKY_KEYS[i], B = SKY_KEYS[i + 1], t = smooth(0, 1, (h - A[0]) / (B[0] - A[0]));
    skyU.uTop.value.copy(A[1]).lerp(B[1], t); skyU.uHor.value.copy(A[2]).lerp(B[2], t);
    sun.color.copy(A[3]).lerp(B[3], t); sun.intensity = lerp(A[4], B[4], t);
    hemi.color.copy(A[5]).lerp(B[5], t); hemi.groundColor.copy(A[6]).lerp(B[6], t); hemi.intensity = lerp(A[7], B[7], t);
    scene.fog.color.copy(A[8]).lerp(B[8], t);
    skyU.uBot.value.copy(scene.fog.color).multiplyScalar(0.85);
    // mặt trời mọc 6h, lặn 18h (ban đêm ánh trăng ở phía đối diện)
    const a = ((h - 6) / 12) * Math.PI, el = Math.sin(a);
    const day = el > -0.02;
    const ang = day ? a : a + Math.PI;
    state.sunDir.set(Math.cos(ang) * 0.85, Math.max(Math.sin(ang), 0.12), 0.5).normalize();
    skyU.uSunDir.value.set(Math.cos(a) * 0.85, Math.sin(a), 0.5).normalize();
    skyU.uSunCol.value.copy(sun.color);
    state.night = 1 - smooth(-0.12, 0.1, el);
    state.day = 1 - state.night;
    skyU.uNight.value = state.night;
    waterMat.uniforms.uDay.value = 0.35 + 0.65 * state.day; waterMat.uniforms.uSun.value.copy(sun.color);
  }

  // ---------- Mây trôi ----------
  const clouds = new THREE.Group(); scene.add(clouds);
  const cloudMat = new THREE.MeshLambertMaterial({ flatShading: true, vertexColors: true, fog: false, emissive: '#ffffff', emissiveIntensity: 0.35 });
  const crand = rng(CONFIG.seed + 3);
  for (let i = 0; i < 16; i++) {
    const m = new Mesher(), k = 3 + Math.floor(crand() * 4);
    for (let j = 0; j < k; j++) { const s = 3 + crand() * 4; m.add(new THREE.IcosahedronGeometry(s, 0), '#e9e4f2', { p: [j * 4.2 - k * 2 + crand() * 2, crand() * 2, crand() * 4 - 2], s: [1, 0.62, 1], top: '#ffffff' }); }
    const c = new THREE.Mesh(m.geometry(), cloudMat);
    const a = crand() * Math.PI * 2, r = 60 + crand() * 160;
    c.position.set(Math.cos(a) * r, 55 + crand() * 30, Math.sin(a) * r); c.userData.v = 1.2 + crand() * 1.6; c.scale.setScalar(0.8 + crand() * 0.8);
    clouds.add(c);
  }

  // ---------- Chim bay (cánh trái/phải là 2 InstancedMesh) ----------
  const flocks = [[20, -30, 45, 26], [-50, 40, 35, 30], [60, 50, 50, 34]].map((f, i) => ({ cx: f[0], cz: f[1], r: f[2], y: f[3], sp: 0.12 + i * 0.03, n: 6 }));
  const nb = flocks.reduce((s, f) => s + f.n, 0);
  const wingG = new THREE.BufferGeometry(); wingG.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.25, 0, 0, -0.25, 0.9, 0, -0.1], 3)); wingG.computeVertexNormals();
  const birdMat = new THREE.MeshBasicMaterial({ color: '#3b3640', side: THREE.DoubleSide });
  const wingL = new THREE.InstancedMesh(wingG, birdMat, nb), wingR = new THREE.InstancedMesh(wingG, birdMat, nb);
  wingL.frustumCulled = wingR.frustumCulled = false; scene.add(wingL, wingR);
  const _o = new THREE.Object3D();
  function updateBirds(t) {
    let k = 0; const vis = state.day > 0.3; wingL.visible = wingR.visible = vis; if (!vis) return;
    for (const f of flocks) for (let i = 0; i < f.n; i++, k++) {
      const a = t * f.sp + i * 0.13, rr = f.r + Math.sin(i * 2.1) * 4;
      const x = f.cx + Math.cos(a) * rr + Math.sin(i * 3.7) * 2, z = f.cz + Math.sin(a) * rr, y = f.y + Math.sin(t * 0.7 + i) * 1.5;
      const flap = Math.sin(t * 9 + i * 1.7) * 0.6;
      for (const [im, s] of [[wingL, -1], [wingR, 1]]) {
        _o.position.set(x, y, z); _o.rotation.set(0, -a, 0); _o.rotateZ(flap * s); _o.scale.set(s, 1, 1); _o.updateMatrix(); im.setMatrixAt(k, _o.matrix);
      }
    }
    wingL.instanceMatrix.needsUpdate = wingR.instanceMatrix.needsUpdate = true;
  }

  // ---------- Âm thanh môi trường (WebAudio, không cần file) ----------
  const audio = new Ambience(ctx, () => state);

  function update(dt, t) {
    state.hour = (state.hour + (dt / CONFIG.time.dayLengthSec) * 24) % 24;
    applySky();
    const pp = ctx.player ? ctx.player.pos : new THREE.Vector3();
    sky.position.copy(ctx.camera.position);
    sun.position.copy(pp).addScaledVector(state.sunDir, 90); sun.target.position.copy(pp);
    // chống "rung bóng": làm tròn theo ô shadow map
    const texel = (sr * 2) / CONFIG.quality.shadowSize; sun.target.position.x = Math.round(pp.x / texel) * texel; sun.target.position.z = Math.round(pp.z / texel) * texel;
    sun.position.copy(sun.target.position).addScaledVector(state.sunDir, 90);
    for (const c of clouds.children) { c.position.x += c.userData.v * dt; if (c.position.x > 230) c.position.x = -230; }
    cloudMat.emissiveIntensity = 0.12 + 0.3 * state.day;
    cloudMat.color.copy(hemi.color).lerp(sun.color, 0.3);
    fountain.update(t);
    updateBirds(t);
    audio.update(dt, pp);
  }
  applySky();

  return { layout, groundAt, walkHeight, bridgeHeight, rawHeight, pathInfo, riverDist, terrain, state, update, audio, bridges, waterMat };
}

// ---------- Âm thanh: gió, chim hót ban ngày, dế ban đêm, tiếng nước gần sông ----------
class Ambience {
  constructor(ctx, getState) {
    this.ctx = ctx; this.getState = getState; this.ac = null; this.nextChirp = 2;
    try { this.on = localStorage.getItem(CONFIG.save.sound) !== '0'; } catch (e) { this.on = true; }
  }
  start() {
    if (this.ac || !this.on) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ac = this.ac = new AC();
    this.master = ac.createGain(); this.master.gain.value = 0.55; this.master.connect(ac.destination);
    const buf = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate), d = buf.getChannelData(0);
    let b = 0; for (let i = 0; i < d.length; i++) { b = (b + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = b * 3.5; } // tiếng ồn nâu
    const mk = (f, type, q) => { const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = ac.createGain(); g.gain.value = 0; s.connect(fl).connect(g).connect(this.master); s.start(0, Math.random() * 2); return { g, fl }; };
    this.wind = mk(500, 'bandpass', 0.6); this.water = mk(900, 'lowpass', 0.4);
  }
  toggle() {
    this.on = !this.on; try { localStorage.setItem(CONFIG.save.sound, this.on ? '1' : '0'); } catch (e) {}
    if (this.on) { this.start(); this.ac && this.ac.resume(); } else if (this.ac) this.ac.suspend();
    return this.on;
  }
  chirp(night) {
    const ac = this.ac, t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.connect(g).connect(this.master); g.gain.value = 0;
    if (!night) {
      const f = 2400 + Math.random() * 2200, n = 2 + Math.floor(Math.random() * 4); o.type = 'sine';
      for (let i = 0; i < n; i++) { const s = t + i * 0.13; o.frequency.setValueAtTime(f, s); o.frequency.exponentialRampToValueAtTime(f * (1.2 + Math.random() * 0.4), s + 0.07); g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(0.05, s + 0.02); g.gain.linearRampToValueAtTime(0, s + 0.1); }
      o.start(t); o.stop(t + n * 0.13 + 0.1);
    } else {
      o.type = 'triangle'; o.frequency.value = 4300 + Math.random() * 400;
      for (let i = 0; i < 6; i++) { const s = t + i * 0.05; g.gain.setValueAtTime(0.018, s); g.gain.setValueAtTime(0, s + 0.025); }
      o.start(t); o.stop(t + 0.35);
    }
  }
  update(dt, p) {
    if (!this.ac || !this.on || this.ac.state !== 'running') return;
    const st = this.getState(), t = this.ac.currentTime;
    const gust = 0.05 + 0.04 * Math.sin(t * 0.23) + 0.03 * Math.sin(t * 0.71);
    this.wind.g.gain.setTargetAtTime(gust, t, 0.5); this.wind.fl.frequency.setTargetAtTime(380 + gust * 3000, t, 0.8);
    const rd = riverDist(p.x, p.z); this.water.g.gain.setTargetAtTime(0.12 * (1 - smooth(4, 30, rd)), t, 0.4);
    U.uWind.value = 0.7 + gust * 6;
    this.nextChirp -= dt;
    if (this.nextChirp <= 0) { this.chirp(st.night > 0.6); this.nextChirp = st.night > 0.6 ? 0.8 + Math.random() * 1.6 : 1 + Math.random() * 3.5; }
  }
}
