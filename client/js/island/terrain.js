// terrain.js — Đảo: đồi lượn sóng, bãi cát, nước có bọt ở bờ, cây & đá (InstancedMesh), cỏ lay theo gió.
// - Hình dáng đảo: rawHeight()   - Màu đất: vòng lặp màu đỉnh   - Cây/đá/hoa: model kit (NATURE)   - Số lượng cây/đá/cỏ: CFG.counts (config.js)
import * as THREE from 'three';
import { CFG } from './config.js';
import { gradientMap, toon } from './style.js';
import { LAND, WORLD, FLAT, rectDist, SPAWN, ISLAND_R, TEMPLE_C, blocked, flatDist, lagoonDist, roadDist, houseAt, ROAD_W } from './layout.js';
import { loadModel } from './models.js';
import { PLAZA } from './sample/plaza.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------- noise ----------
const hash = (x, y) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function noise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
export const fbm = (x, y) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { s += a * noise(x * f + i * 31, y * f - i * 17); a *= 0.5; f *= 2.02; } return s / 0.9375; };
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
let seed = CFG.seed; export const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// Uniform dùng chung cho gió và cỏ rẽ
export const WIND = { uTime: { value: 0 }, uPlayer: { value: new THREE.Vector3(0, -99, 0) }, uWind: { value: 0 } }; // uWind 0..1: gió mạnh (weather.js)

const R = ISLAND_R;   // bán kính đảo theo bố cục hình tròn (layout.js)
// Độ cao: đảo tròn hơi méo, đồi thoải giữa các khu, ra rìa chìm xuống biển
export function rawHeight(x, z) {
  const ang = Math.atan2(z, x), r = Math.hypot(x, z);
  const edge = R * (0.85 + 0.25 * fbm(Math.cos(ang) * 2 + 5, Math.sin(ang) * 2 + 5));
  const land = 1 - smooth(edge * 0.75, edge, r);
  const hills = 2.2 + fbm(x * 0.02, z * 0.02) * 9 + Math.max(0, fbm(x * 0.01 + 9, z * 0.01) - 0.55) * 30;
  const h = hills;
  let out = h * land - 6 * (1 - land);
  // các khu quanh đảo (layout.js): đất bằng trong khu, đồi thấp + bãi cát ở viền, nối liền nhau thành 1 vùng đất
  { const ds = Math.hypot(x - SPAWN[0], z - SPAWN[1]); if (ds < 32) out = Math.min(out, FLAT + (out - FLAT) * smooth(12, 32, ds)); }   // không để đồi che cổng trường lúc vào game
  let d = 1e9; for (const r of LAND) d = Math.min(d, rectDist(r, x, z));
  if (d < 40) {
    const n = fbm(x * 0.03 + 3, z * 0.03 - 7), m = 1 - smooth(13, 20 + 9 * n, d);
    const zh = (FLAT + n * 7 * smooth(3, 13, d) * smooth(14, 40, Math.hypot(x - SPAWN[0], z - SPAWN[1]))) * m - 6 * (1 - m);   // đồi thấp dần gần điểm xuất phát (không che tầm nhìn)
    out = Math.max(out, zh);
    const w = 1 - smooth(0, 5, d); out = out + (FLAT - out) * w;
  }
  // đĩa thị trấn quanh trường (đường vòng, lô đất) và các đường hướng tâm: đất bằng
  { const f = flatDist(x, z); if (f < 14) out = out + (FLAT - out) * (1 - smooth(0, 14, f)); }
  // sân Đền Tri Thức (khu I): bãi phẳng trên đồi rừng
  { const dt = Math.hypot(x - TEMPLE_C[0], z - TEMPLE_C[1]); if (dt < 30) out = out + (3 - out) * (1 - smooth(14, 30, dt)); }
  // hồ bán nguyệt phía nam trường
  { const ld = lagoonDist(x, z); if (ld < 6) { const t = smooth(-1, 8, -ld); out = Math.min(out, FLAT * (1 - t) - 2.6 * t); } }
  return out;
}

export function createTerrain(scene) {
  // lưới chữ nhật phủ cả đảo lẫn các khu (WORLD trong layout.js)
  const step = CFG.isMobile ? 2.8 : 2.2, SX = WORLD.x1 - WORLD.x0, SZ = WORLD.z1 - WORLD.z0, NX = Math.round(SX / step), NZ = Math.round(SZ / step), W = CFG.island.waterLevel;
  const CX = (WORLD.x0 + WORLD.x1) / 2, CZ = (WORLD.z0 + WORLD.z1) / 2, half = 0;
  const H = new Float32Array((NX + 1) * (NZ + 1));
  for (let iz = 0; iz <= NZ; iz++) for (let ix = 0; ix <= NX; ix++) H[iz * (NX + 1) + ix] = rawHeight(WORLD.x0 + ix * step, WORLD.z0 + iz * step);
  const heightAt = (x, z) => {
    const gx = Math.min(NX - 0.001, Math.max(0, (x - WORLD.x0) / step)), gz = Math.min(NZ - 0.001, Math.max(0, (z - WORLD.z0) / step));
    const ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz, n = NX + 1;
    const a = H[iz * n + ix], b = H[(iz + 1) * n + ix], c = H[(iz + 1) * n + ix + 1], d = H[iz * n + ix + 1];
    return fx + fz <= 1 ? a + (d - a) * fx + (b - a) * fz : c + (b - c) * (1 - fx) + (d - c) * (1 - fz);
  };
  const slopeAt = (x, z) => Math.hypot(heightAt(x + 1, z) - heightAt(x - 1, z), heightAt(x, z + 1) - heightAt(x, z - 1)) / 2;

  // ---------- Mặt đất (toon, màu theo độ cao/độ dốc) ----------
  const g = new THREE.PlaneGeometry(SX, SZ, NX, NZ); g.rotateX(-Math.PI / 2); g.translate(CX, 0, CZ);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3);
  // bảng màu docs/art-style.md: cát hồng-kem, cát ướt, cỏ tươi có mảng sáng/tối, đá ấm
  const cSand = new THREE.Color('#f3d6a8'), cWet = new THREE.Color('#e8c391'), cG1 = new THREE.Color('#63ab50'), cG2 = new THREE.Color('#84c362'), cG3 = new THREE.Color('#4f9a4a'), cMeadow = new THREE.Color('#9fcf6c');
  const cRock = new THREE.Color('#b3aa9b'), cDeep = new THREE.Color('#e6cc9a'), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = H[Math.round((z - WORLD.z0) / step) * (NX + 1) + Math.round((x - WORLD.x0) / step)];
    pos.setY(i, h);
    c.copy(cG1).lerp(cG2, fbm(x * 0.05, z * 0.05));
    const patch = fbm(x * 0.018 + 40, z * 0.018 - 13);
    c.lerp(cG3, smooth(0.55, 0.78, patch) * 0.55).lerp(cMeadow, smooth(0.6, 0.85, 1 - patch) * 0.35);   // mảng cỏ đậm (rừng) / đồng cỏ sáng
    if (!(flatDist(x, z) < 3 && lagoonDist(x, z) > 4)) {   // thị trấn & đường: cỏ, không phải cát
      c.lerp(cSand, 1 - smooth(W + 0.7, W + 1.7, h));
      c.lerp(cWet, 1 - smooth(W + 0.05, W + 0.6, h));      // dải cát ướt sát mép nước
    }
    if (h < W - 0.05) c.copy(cDeep).lerp(cWet, smooth(-3, -0.05, h) * 0.5);
    c.lerp(cRock, smooth(0.9, 1.5, slopeAt(x, z)) * 0.85);
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  // chia thành ô 44×44 mắt lưới (dùng chung thuộc tính đỉnh, chỉ khác chỉ mục) → camera loại bỏ (frustum culling) phần ngoài khung hình;
  // trước đây 1 mesh ~190k tam giác luôn được vẽ toàn bộ
  const ground = new THREE.Group(); ground.name = 'ground'; scene.add(ground);
  { const gm = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap }), TS = 44, n = NX + 1, bb = new THREE.Box3(), v = new THREE.Vector3();
    for (let tz = 0; tz < NZ; tz += TS) for (let tx = 0; tx < NX; tx += TS) {
      const ex = Math.min(NX, tx + TS), ez = Math.min(NZ, tz + TS), idx = []; bb.makeEmpty();
      for (let iz = tz; iz < ez; iz++) for (let ix = tx; ix < ex; ix++) { const a = iz * n + ix, b = a + n, c = b + 1, d = a + 1; idx.push(a, b, d, b, c, d); }
      for (let iz = tz; iz <= ez; iz++) for (let ix = tx; ix <= ex; ix++) bb.expandByPoint(v.fromBufferAttribute(pos, iz * n + ix));
      const tg = new THREE.BufferGeometry(); for (const k of ['position', 'normal', 'color']) tg.setAttribute(k, g.attributes[k]);
      tg.setIndex(idx); tg.boundingBox = bb.clone(); tg.boundingSphere = bb.getBoundingSphere(new THREE.Sphere());
      const m = new THREE.Mesh(tg, gm); m.receiveShadow = true; m.name = 'ground'; ground.add(m);
    } }

  // ---------- Nước: màu theo độ sâu + bọt trắng ở bờ (đọc bản đồ độ cao, không cần depth texture) ----------
  const TS = 256, hd = new Uint8Array(TS * TS);
  for (let j = 0; j < TS; j++) for (let i = 0; i < TS; i++) hd[j * TS + i] = Math.max(0, Math.min(255, Math.round((heightAt(WORLD.x0 + (i + 0.5) / TS * SX, WORLD.z0 + (j + 0.5) / TS * SZ) + 8) * 12)));
  const hTex = new THREE.DataTexture(hd, TS, TS, THREE.RedFormat); hTex.magFilter = hTex.minFilter = THREE.LinearFilter; hTex.needsUpdate = true;
  const waterMat = new THREE.ShaderMaterial({
    transparent: true, fog: true, depthWrite: false,   // không ghi độ sâu: cá dưới nước (ambience.js) vẫn vẽ lên được
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uH: { value: null }, uMin: { value: new THREE.Vector2(WORLD.x0, WORLD.z0) }, uSize: { value: new THREE.Vector2(SX, SZ) }, uShallow: { value: new THREE.Color('#46e3c6') }, uDeep: { value: new THREE.Color('#1688b0') }, uLight: { value: 1 }, uSunW: { value: new THREE.Vector3(0, 1, 0) }, uSunC: { value: new THREE.Color('#fff') }, uSkyH: { value: new THREE.Color('#bfe6f6') }, uPlayer: { value: null } }]), // uSun*/uSkyH: ambience.js nối với bầu trời
    vertexShader: `varying vec3 vW;
#include <fog_pars_vertex>
      void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
#include <fog_vertex>
      }`,
    fragmentShader: `uniform sampler2D uH; uniform vec2 uMin, uSize; uniform vec3 uShallow, uDeep, uSunW, uSunC, uSkyH, uPlayer; uniform float uLight; uniform float uTime; varying vec3 vW;
#include <fog_pars_fragment>
      void main(){
        vec2 uv = (vW.xz - uMin) / uSize;
        float h = (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) ? -8. : texture2D(uH, uv).r * 255. / 12. - 8.;
        float depth = max(0., -h);
        vec3 c = mix(uShallow, uDeep, smoothstep(0.3, 5., depth));
        c = mix(c, uDeep*0.8, step(3.5, depth)*0.35);             // dải màu kiểu toon
        float ca = sin(vW.x*0.9 + uTime*0.8) * sin(vW.z*0.8 - uTime*0.6) + sin((vW.x + vW.z)*0.45 + uTime*0.5);
        c += vec3(0.1, 0.16, 0.12) * smoothstep(1.0, 1.7, ca) * (1. - smoothstep(0.4, 3., depth));   // vân sáng đáy nước nông
        float wave = sin(depth*5. - uTime*1.6 + sin(vW.x*0.3+uTime)*0.6);
        float foam = step(depth, 0.35) + step(0.75, wave) * (1. - smoothstep(0.4, 1.4, depth));
        float sparkle = step(0.993, sin(vW.x*1.7 + uTime*1.3)*sin(vW.z*1.9 - uTime*1.1));
        // sóng vỗ bờ: từng đợt sóng dâng lên rồi rút, để lại viền bọt trắng
        float surge = 0.5 + 0.5 * sin(uTime * 0.9 + vW.x * 0.045 + vW.z * 0.035);
        foam += smoothstep(0.14, 0., abs(depth - 0.25 - surge * 0.9)) * (1. - smoothstep(1.1, 1.5, depth)) * (0.4 + 0.6 * step(0.5, fract(vW.x * 0.7 + vW.z * 0.5 + uTime * 0.2)));
        // gợn tròn quanh chân khi lội nước
        float pd = length(vW.xz - uPlayer.xz), wade = step(uPlayer.y, 0.55) * step(-1.6, uPlayer.y);
        foam += smoothstep(0.7, 1., sin(pd * 5.5 - uTime * 4.5)) * (1. - smoothstep(0.4, 2.6, pd)) * wade * 0.8;
        // phản chiếu: chân trời phản lên mặt nước khi nhìn xiên + lấp lánh nắng
        vec3 V = normalize(cameraPosition - vW), N = normalize(vec3(sin(vW.x * 0.9 + uTime * 1.3) * 0.06 + sin(vW.z * 1.7 - uTime) * 0.04, 1., sin(vW.z * 0.8 - uTime * 1.1) * 0.06));
        float fres = pow(1. - max(V.y, 0.), 4.);
        c = mix(c, uSkyH, fres * 0.45);
        c += uSunC * pow(max(dot(reflect(-uSunW, N), V), 0.), 90.) * 0.9 * step(0.02, uSunW.y);
        c = mix(c, vec3(1.), clamp(foam, 0., 1.)*0.85) + sparkle*0.25;
        gl_FragColor = vec4(c * uLight, max(mix(0.52, 0.95, smoothstep(0., 2.8, depth)), clamp(foam, 0., 1.) * 0.9));   // nông: trong thấy cát
#include <fog_fragment>
      }`,
  });
  waterMat.uniforms.uH.value = hTex; waterMat.uniforms.uTime = WIND.uTime; waterMat.uniforms.uPlayer = WIND.uPlayer;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600).rotateX(-Math.PI / 2), waterMat); water.position.y = W; scene.add(water);

  // ---------- Vật liệu lay theo gió (cây, cỏ) ----------
  function windy(mat, amp, push = 0) {
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, WIND);
      sh.vertexShader = 'uniform float uTime; uniform vec3 uPlayer; uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 ip = (modelMatrix * instanceMatrix * vec4(0.,0.,0.,1.)).xyz;
        float hh = max(position.y, 0.);
        float sw = (sin(uTime*1.8 + ip.x*0.35 + ip.z*0.27)*0.7 + sin(uTime*3.4 + ip.x)*0.3) * (1. + uWind*1.6) + uWind*(1.2 + 0.6*sin(uTime*0.9 + ip.x*0.06));
        transformed.x += sw * ${amp.toFixed(3)} * hh; transformed.z += sw * ${(amp * 0.6).toFixed(3)} * hh;
        ${push ? `vec2 d = ip.xz - uPlayer.xz; float L = length(d); float k = (1. - smoothstep(0.2, 1.4, L)) * step(abs(ip.y - uPlayer.y), 1.5);
        vec2 dl = normalize(vec2(dot(d, instanceMatrix[0].xz), dot(d, instanceMatrix[2].xz)) + 1e-4); // hướng rẽ trong hệ của ngọn cỏ
        transformed.xz += dl * k * hh * 0.9; transformed.y -= k * hh * 0.35;` : ''}`);
    };
    mat.customProgramCacheKey = () => 'windy' + amp + push;
    return mat;
  }

  // chỗ đặt cây/đá: trên cạn, không quá dốc, tránh bãi xuất phát
  // không bao giờ mọc trong khu, lô đất, đường, hồ, sân đền (layout.js: blocked) — lề 4 m
  const clear = (x, z, m = 4) => !blocked(x, z, m) && Math.hypot(x - PLAZA.x, z - PLAZA.z) > PLAZA.R + 3 + m;   // không mọc trên quảng trường
  // 40% dồn vào rừng quanh đền (khu I), còn lại rải khắp đảo
  const spot = (minH = W + 1.4, m = 4) => { for (let k = 0; k < 40; k++) { const forest = rand() < 0.4, a = rand() * 6.283, r = forest ? 18 + Math.sqrt(rand()) * 62 : Math.sqrt(rand()) * R * 1.02, x = (forest ? TEMPLE_C[0] : 0) + Math.cos(a) * r, z = (forest ? TEMPLE_C[1] : 0) + Math.sin(a) * r, h = heightAt(x, z); if (h > minH && slopeAt(x, z) < 0.9 && clear(x, z, m)) return [x, h, z]; } return null; };
  const plants = [];   // [x, z, bán kính, loại] — để kiểm tra không mọc trùng kiến trúc
  const colliders = [];
  const o = new THREE.Object3D(), tint = new THREE.Color();
  // ---------- Thiên nhiên bằng model kit CC0 (cây, bụi, đá, hoa, nấm, gốc cây, khúc gỗ) ----------
  // Mỗi loại = 1 InstancedMesh "gần" (đổ bóng nếu là cây) + tuỳ chọn 1 InstancedMesh "xa" (không đổ bóng).
  // Cứ 0.4 giây (khi người chơi đi > 3 m) chia lại vật nào gần/xa/ẩn; số draw call không đổi.
  const lodSets = [], KS = {};
  const pick = a => a[Math.floor(rand() * a.length)];
  function kitSet(kind, items = []) {
    const def = NATURE[kind], mat = natureMat(def.wind || 0, def.push || 0);
    const set = { kind, items, near: null, far: null, cap: 0, at: new THREE.Vector3(1e9, 0, 0), last: new THREE.Vector3(0, 0, 10) };
    const mk = (geo, shadow) => { const m = new THREE.InstancedMesh(geo, mat, set.cap); m.castShadow = shadow; m.receiveShadow = true; m.frustumCulled = false; m.name = 'nature-' + kind; scene.add(m); return m; };
    set.build = () => {
      if (!set.geo || !items.length) return;
      if (set.cap >= items.length) return set.relayout(set.last);
      for (const m of [set.near, set.far]) if (m) { scene.remove(m); m.dispose(); }
      set.cap = Math.ceil(items.length * 1.1); set.near = mk(set.geo, !!def.shadow); set.far = def.far ? mk(set.geo, false) : null; set.relayout(set.last);
    };
    const fill = (m, idx) => { idx.forEach((k, j) => { m.setMatrixAt(j, items[k].m); m.setColorAt(j, items[k].c); }); m.count = idx.length; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; };
    set.relayout = p => {
      set.last.copy(p); if (!set.near) return;
      const dNear = def.dist === 'tree' ? state.treeDist : def.dist === 'grass' ? state.grassDist : def.dist, dFar = scene.fog ? scene.fog.far + 20 : 400, a = [], b = [];
      items.forEach((q, k) => { const d = Math.hypot(q.m.elements[12] - p.x, q.m.elements[14] - p.z); if (d < dNear) a.push(k); else if (set.far && d < dFar) b.push(k); });
      fill(set.near, a); if (set.far) fill(set.far, b);
    };
    kitGeo(kind).then(g => { set.geo = g; set.build(); });
    lodSets.push(set); KS[kind] = set; return set;
  }
  // thêm vật: [x, y, z, tỷ lệ, xoay, màu (tô lên phần lá/hoa/đá)] — dùng được từ file khác qua terrain.nature.add()
  function addNature(kind, list) {
    const set = KS[kind] || kitSet(kind), def = NATURE[kind];
    for (const [x, y, z, s, ry, col] of list) { o.position.set(x, y, z); o.rotation.set(0, ry ?? rand() * 6.28, 0); o.scale.setScalar(s); o.updateMatrix(); set.items.push({ m: o.matrix.clone(), c: new THREE.Color(col || pick(def.tints)).offsetHSL(0, 0, (rand() - 0.5) * 0.06) }); }
    set.build(); return set;
  }
  const plant = (kind, n, sMin, sMax, colR, minH, m = 4) => { const list = []; for (let i = 0; i < n; i++) { const p = spot(minH, m); if (!p) continue; const s = sMin + rand() * (sMax - sMin); if (colR) colliders.push({ x: p[0], z: p[2], r: colR * s }); plants.push([p[0], p[2], NATURE[kind].r * s, NATURE[kind].type]); list.push([p[0], p[1] - 0.08, p[2], s]); } addNature(kind, list); };
  // cây tán tròn (3 kiểu) và cây thông (2 kiểu) — tỷ lệ theo kích thước model kit (~1.2–1.6 m gốc)
  const nT = CFG.counts.trees, nP = CFG.counts.pines;
  plant('oak', Math.round(nT * 0.3), 4.0, 5.6, 0.1); plant('fat', Math.round(nT * 0.35), 4.2, 5.6, 0.1); plant('round', Math.round(nT * 0.35), 3.4, 4.6, 0.1);
  plant('pine', Math.round(nP * 0.6), 3.4, 4.8, 0.1); plant('pineTall', Math.round(nP * 0.4), 3.6, 5.0, 0.08);
  // đá: to (có va chạm), dựng đứng, sỏi ven bờ
  plant('rockL', Math.round(CFG.counts.rocks * 0.45), 1.6, 3.6, 0.45, W - 0.3, 2); plant('rockT', Math.round(CFG.counts.rocks * 0.2), 1.4, 2.6, 0.4, W - 0.2, 2);
  plant('pebbles', Math.round(CFG.counts.rocks * 0.6), 2.0, 3.5, 0, W - 0.4, 2);
  // tầng thấp: bụi, cụm hoa, nấm, gốc cây, khúc gỗ (không đổ bóng, chỉ hiện gần)
  plant('bush', CFG.isMobile ? 260 : 420, 2.4, 4.2, 0); plant('flowers', CFG.isMobile ? 360 : 600, 1.8, 2.6, 0); plant('mushrooms', 90, 2.2, 3.2, 0);
  plant('stump', 40, 2.4, 3.2, 0.3); plant('log', 28, 2.0, 2.8, 0.5);

  // ---------- Cỏ: chia ô, ô xa thì ẩn (LOD) ----------
  const blade = (() => { const geos = []; for (let i = 0; i < 3; i++) { const b = new THREE.BufferGeometry(); b.setAttribute('position', new THREE.Float32BufferAttribute([-0.07, 0, 0, 0.07, 0, 0, 0, 0.55, 0], 3)); b.setAttribute('color', new THREE.Float32BufferAttribute([0.25, 0.5, 0.2, 0.25, 0.5, 0.2, 0.75, 0.95, 0.45], 3)); b.rotateY(i * 1.05); b.translate((i - 1) * 0.06, 0, 0); geos.push(b); } const m = mergeGeos(geos); m.computeVertexNormals(); return m; })();
  const grassMat = windy(new THREE.MeshToonMaterial({ vertexColors: true, gradientMap, side: THREE.DoubleSide }), 0.22, 1);
  const chunks = new Map(), CH = 24;
  for (let i = 0; i < CFG.counts.grass; i++) {
    const a = rand() * 6.283, r = Math.sqrt(rand()) * R, x = Math.cos(a) * r, z = Math.sin(a) * r, h = heightAt(x, z);
    if (h < W + 1.0 || slopeAt(x, z) > 0.8 || LAND.some(r => rectDist(r, x, z) < 2) || roadDist(x, z) < ROAD_W / 2 + 0.6 || houseAt(x, z, 0.6) || lagoonDist(x, z) < 1 || Math.hypot(x - TEMPLE_C[0], z - TEMPLE_C[1]) < 9 || Math.hypot(x - PLAZA.x, z - PLAZA.z) < PLAZA.R + 0.8) continue;
    const k = Math.floor(x / CH) + ',' + Math.floor(z / CH); if (!chunks.has(k)) chunks.set(k, []); chunks.get(k).push([x, h, z]);
  }
  const grass = [];
  for (const list of chunks.values()) {
    const m = new THREE.InstancedMesh(blade, grassMat, list.length); let cx = 0, cz = 0;
    list.forEach(([x, y, z], i) => { o.position.set(x, y - 0.02, z); o.rotation.set(0, rand() * 6.28, 0); const s = 0.8 + rand() * 0.7; o.scale.set(s, s * (0.7 + rand() * 0.6), s); o.updateMatrix(); m.setMatrixAt(i, o.matrix); m.setColorAt(i, tint.setHSL(0.25 + rand() * 0.06, 0.5, 0.52 + rand() * 0.2)); cx += x; cz += z; });
    m.computeBoundingSphere(); m.receiveShadow = true; scene.add(m); grass.push({ m, x: cx / list.length, z: cz / list.length });
  }

  let lodT = 0; const state = { grassDist: CFG.isMobile ? 45 : 65, treeDist: CFG.isMobile ? 40 : 55 };
  function update(dt, t, player) {
    WIND.uTime.value = t;
    if (player) WIND.uPlayer.value.copy(player);
    if ((lodT += dt) > 0.4 && player) {
      lodT = 0; for (const c of grass) c.m.visible = Math.hypot(c.x - player.x, c.z - player.z) < state.grassDist;
      for (const L of lodSets) if (L.at.distanceToSquared(player) > 9) { L.at.copy(player); L.relayout(player, state.treeDist); }
    }
  }
  state.relayoutAll = p => { for (const L of lodSets) L.relayout(p, state.treeDist); };
  return { heightAt, slopeAt, update, colliders, ground, waterMat, state, plants, nature: { add: addNature } };
}

// Gộp nhiều geometry (cùng thuộc tính) thành 1
export function mergeGeos(list) {
  const geos = list.map(g => (g.index ? g.toNonIndexed() : g));
  const attrs = Object.keys(geos[0].attributes).filter(k => geos.every(g => g.attributes[k]));
  const out = new THREE.BufferGeometry();
  for (const k of attrs) { const size = geos[0].attributes[k].itemSize; const arr = new Float32Array(geos.reduce((s, g) => s + g.attributes[k].count * size, 0)); let o = 0; for (const g of geos) { arr.set(g.attributes[k].array, o); o += g.attributes[k].array.length; } out.setAttribute(k, new THREE.BufferAttribute(arr, size)); }
  if (!out.attributes.normal) out.computeVertexNormals();
  return out;
}

// ---------- Model kit cho thiên nhiên (client/assets/models/kit, CC0 — xem CREDITS.txt) ----------
// parts: vai trò từng phần của model (theo thứ tự trong file .glb) → màu nền + có nhận màu riêng từng cây (tint) không
const ROLE = {
  leaf: ['#ffffff', 1], wood: ['#8a5a34', 0], woodIn: ['#e2c59a', 0], stone: ['#ffffff', 1], moss: ['#7fb85a', 0], stoneLt: ['#efe8da', 0],
  stem: ['#5aa04a', 0], petal: ['#ffffff', 1], cap: ['#ffffff', 1], stalk: ['#fbf1de', 0],
};
const LEAF = ['#7cc35e', '#6fb85a', '#8fcf6a', '#5faa4e'], PINE = ['#3f8f55', '#4a9a5a', '#367f4c'];
export const NATURE = {
  oak:      { type: 'tree', r: 0.35, model: 'tree_oak', parts: ['leaf', 'wood'], tints: LEAF, wind: 0.035, shadow: true, far: true, dist: 'tree' },
  fat:      { type: 'tree', r: 0.35, model: 'tree_fat', parts: ['leaf', 'wood'], tints: ['#7cc35e', '#8fcf6a', '#6fb85a'], wind: 0.03, shadow: true, far: true, dist: 'tree' },
  round:    { type: 'tree', r: 0.35, model: 'tree_dark', parts: ['wood', 'leaf'], tints: ['#5faa4e', '#4f9a4a', '#6fb85a'], wind: 0.03, shadow: true, far: true, dist: 'tree' },
  pine:     { type: 'pine', r: 0.3, model: 'tree_pine', parts: ['leaf', 'wood'], tints: PINE, wind: 0.02, shadow: true, far: true, dist: 'tree' },
  pineTall: { type: 'pine', r: 0.25, model: 'tree_pine_tall', parts: ['wood', 'leaf'], tints: PINE, wind: 0.02, shadow: true, far: true, dist: 'tree' },
  palm:     { type: 'palm', r: 0.15, model: 'tree_palm', parts: ['leaf', 'wood'], tints: ['#5cbf4a', '#4fae47', '#6cc456'], wind: 0.04, shadow: true, far: true, dist: 'tree' },
  rockL:    { type: 'rock', r: 0.45, model: 'rock_large', parts: ['stone', 'moss'], tints: ['#b9b0a1', '#aaa293', '#c2b9aa'], shadow: true, far: true, dist: 'tree' },
  rockT:    { type: 'rock', r: 0.45, model: 'rock_tall', parts: ['stone', 'moss', 'stoneLt'], tints: ['#b9b0a1', '#a9a297'], shadow: true, far: true, dist: 'tree' },
  pebbles:  { type: 'rock', r: 0.3, model: 'rock_small', parts: ['moss', 'stone'], tints: ['#c2b9aa', '#a9a297', '#d0c7b8'], copies: 4, spread: 0.35, dist: 55 },
  bush:     { type: 'bush', r: 0.3, model: 'bush_large', parts: ['leaf'], tints: ['#6fb85a', '#5faa4e', '#7cc35e', '#4f9a4a'], copies: 2, spread: 0.25, wind: 0.05, dist: 70 },
  flowers:  { type: 'flower', r: 0.3, model: 'flower_red', parts: ['stem', 'petal'], tints: ['#ff8fa8', '#ffd35a', '#ffffff', '#c9a3ff', '#ff7a5c'], copies: 6, spread: 0.45, wind: 0.12, push: 1, dist: 'grass' },
  mushrooms:{ type: 'plant', r: 0.2, model: 'mushroom_red', parts: ['cap', 'stalk'], tints: ['#e8453c', '#f07a3a', '#c9864f'], copies: 3, spread: 0.25, dist: 45 },
  stump:    { type: 'plant', r: 0.25, model: 'stump', parts: ['wood', 'woodIn'], tints: ['#ffffff'], dist: 60 },
  log:      { type: 'plant', r: 0.5, model: 'log', parts: ['wood', 'woodIn'], tints: ['#ffffff'], dist: 60 },
};
const geoCache = new Map();
// Gộp các phần của model thành 1 geometry có màu theo đỉnh + thuộc tính 'tint' (phần nào nhận màu riêng của từng bản sao)
export function kitGeo(kind) {
  if (geoCache.has(kind)) return geoCache.get(kind);
  const def = NATURE[kind];
  const p = loadModel('kit/' + def.model).then(src => {
    if (!src) return null;
    src.updateMatrixWorld(true); const parts = []; let i = 0; const c = new THREE.Color();
    src.traverse(m => {
      if (!m.isMesh) return;
      let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      for (const k of Object.keys(g.attributes)) {   // model nén meshopt: số nguyên chuẩn hoá → đổi sang Float32 trước khi biến đổi
        if (k !== 'position' && k !== 'normal') { g.deleteAttribute(k); continue; }
        const a = g.attributes[k], f = new Float32Array(a.count * 3); for (let j = 0; j < a.count; j++) f.set([a.getX(j), a.getY(j), a.getZ(j)], j * 3);
        g.setAttribute(k, new THREE.BufferAttribute(f, 3));
      }
      g.applyMatrix4(m.matrixWorld);
      const [hex, t] = ROLE[def.parts[i++] || 'stone'] || ROLE.stone; c.set(hex); const n = g.attributes.position.count;
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).map((_, j) => [c.r, c.g, c.b][j % 3]), 3));
      g.setAttribute('tint', new THREE.BufferAttribute(new Float32Array(n).fill(t), 1));
      parts.push(g);
    });
    let geo = mergeGeometries(parts);
    if (def.copies) {   // cụm nhiều bản nhỏ (hoa, sỏi, bụi, nấm): 1 bản sao = cả cụm → ít draw call
      const list = [], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(); let r = 1;
      const rr = () => (r = (r * 16807) % 2147483647) / 2147483647;
      for (let k = 0; k < def.copies; k++) {
        const a = k / def.copies * 6.28 + rr(), d = k ? def.spread * (0.5 + rr() * 0.6) : 0, s = 0.65 + rr() * 0.5;
        m4.compose(new THREE.Vector3(Math.cos(a) * d, 0, Math.sin(a) * d), q.setFromEuler(e.set(0, rr() * 6.28, 0)), sc.setScalar(k ? s : 1));
        list.push(geo.clone().applyMatrix4(m4));
      }
      geo = mergeGeometries(list);
    }
    geo.computeBoundingSphere(); return geo;
  });
  geoCache.set(kind, p); return p;
}
// Vật liệu toon dùng màu theo đỉnh; màu riêng từng bản sao chỉ tô lên phần 'tint' (lá, hoa, đá) — thân cây giữ màu gỗ.
// wind: lay theo gió (tăng theo độ cao); push: rẽ ra khi người chơi đi qua (hoa, cỏ)
const natCache = new Map();
export function natureMat(wind = 0, push = 0) {
  const key = wind + ':' + push; if (natCache.has(key)) return natCache.get(key);
  const mat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap });
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, WIND);
    sh.vertexShader = 'attribute float tint; uniform float uTime; uniform vec3 uPlayer; uniform float uWind;\n' + sh.vertexShader
      .replace('#include <color_vertex>', `vColor = vec3(1.); vColor *= color;
        #ifdef USE_INSTANCING_COLOR
          vColor *= mix(vec3(1.), instanceColor.xyz, tint);
        #endif`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        ${wind ? `vec3 ip = (modelMatrix * instanceMatrix * vec4(0.,0.,0.,1.)).xyz;
        float hh = max(position.y, 0.); hh *= hh;
        float sw = (sin(uTime*1.6 + ip.x*0.35 + ip.z*0.27)*0.7 + sin(uTime*3.1 + ip.x)*0.3) * (1. + uWind*1.6) + uWind*(1.2 + 0.6*sin(uTime*0.9 + ip.x*0.06));
        transformed.x += sw * ${wind.toFixed(3)} * hh; transformed.z += sw * ${(wind * 0.6).toFixed(3)} * hh;` : ''}
        ${push ? `vec2 d = ip.xz - uPlayer.xz; float k = (1. - smoothstep(0.3, 1.6, length(d))) * step(abs(ip.y - uPlayer.y), 1.5);
        transformed.y -= k * max(position.y, 0.) * 0.5;` : ''}`);
  };
  mat.customProgramCacheKey = () => 'nature' + key;
  natCache.set(key, mat); return mat;
}
