// terrain.js — Đảo: đồi lượn sóng, bãi cát, nước có bọt ở bờ, cây & đá (InstancedMesh), cỏ lay theo gió.
// - Hình dáng đảo: rawHeight()   - Màu đất: vòng lặp màu đỉnh   - Cây/đá/hoa: model kit (NATURE)   - Số lượng cây/đá/cỏ: CFG.counts (config.js)
import * as THREE from 'three';
import { CFG } from './config.js';
import { gradientMap, toon } from './style.js';
import { LAND, WORLD, FLAT, rectDist, SPAWN, ISLAND_R, TEMPLE_C, blocked, flatDist, lagoonDist, roadDist, houseAt, ROAD_W } from './layout.js';
import { loadModel } from './models.js';
import { createOceanWater } from './ocean-water.js';
import { PLAZA } from './sample/plaza.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------- noise ----------
const hash = (x, y) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function noise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
export const fbm = (x, y) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { s += a * noise(x * f + i * 31, y * f - i * 17); a *= 0.5; f *= 2.02; } return s / 0.9375; };
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
let seed = CFG.seed; export const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// Uniform dùng chung cho gió và cỏ rẽ
export const WIND = { uTime: { value: 0 }, uPlayer: { value: new THREE.Vector3(0, -99, 0) }, uWind: { value: 0 }, // uWind 0..1: gió mạnh (weather.js)
  uGust: { value: new THREE.Vector4(0.93, 0.37, 0, 0) },   // living.js: xy hướng gió · z cơn giật 0..1 · w pha dải gió
  uMov: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, -99, 0, 0)) },   // living.js: người chơi/xe/thú làm cỏ rẽ (xyz, bán kính)
  uShk: { value: Array.from({ length: 4 }, () => new THREE.Vector4(0, 0, 0, -99)) },   // living.js: cây bị va/rung (x, z, biên độ, lúc bắt đầu)
  uSeason: { value: new THREE.Vector3() } };   // weather.js: x thu (lá vàng cam) · y đông (lá nhạt sương giá) · z xuân (xanh non)
// GLSL dùng chung: gió có hướng + cơn giật trôi qua đồng cỏ, rẽ cỏ quanh vật di chuyển, cây rung khi bị va (đổi thế giới → hệ bản sao)
// màu theo mùa: chỉ đổi phần xanh lá (độ "xanh" = g vượt r, b) → thân gỗ, hoa, đá giữ nguyên (dùng chung cho mặt đất ở weather.js)
export const SEASON_GLSL = `uniform vec3 uSeason;
  vec3 seasonCol(vec3 c, float k){ float g = clamp((c.g - max(c.r, c.b)) * 5., 0., 1.);
    c = mix(c, vec3(c.g * 1.35, c.g * .8, c.b * .4), g * uSeason.x * k);
    c = mix(c, mix(vec3(dot(c, vec3(.3, .59, .11))), vec3(.84, .9, .94), .4), g * uSeason.y * k);
    return mix(c, c * vec3(1.03, 1.08, .94), g * uSeason.z); }`;
const WIND_GLSL = `uniform float uTime, uWind; uniform vec3 uPlayer; uniform vec4 uGust; uniform vec4 uMov[6]; uniform vec4 uShk[4];
  ${SEASON_GLSL}
  vec3 toL(vec3 w){ vec3 c0 = instanceMatrix[0].xyz; return vec3(dot(w, c0), dot(w, instanceMatrix[1].xyz), dot(w, instanceMatrix[2].xyz)) / max(dot(c0, c0), 1e-6); }   // instance ẩn (tỉ lệ 0) → không chia cho 0 (NaN)
  vec2 windOff(vec3 ip){ vec2 d = uGust.xy;
    float fl = sin(uTime*1.7 + ip.x*0.35 + ip.z*0.27)*0.7 + sin(uTime*3.3 + ip.x)*0.3;
    float gust = uGust.z * smoothstep(0.1, 1., sin(dot(ip.xz, d)*0.1 - uTime*1.618 - uGust.w));
    return d * (fl*(1. + uWind*1.6) + uWind*(1.2 + 0.6*sin(uTime*0.9 + ip.x*0.06)) + gust*2.6) + vec2(d.y, -d.x) * fl * 0.3; }
  vec3 movPush(vec3 ip){ vec3 o = vec3(0.); for (int i = 0; i < 6; i++){ vec4 m = uMov[i]; vec2 dd = ip.xz - m.xz; float L = length(dd);
    float k = (1. - smoothstep(0.15*m.w, m.w, L)) * step(abs(ip.y - m.y), 1.5) * step(0.01, m.w); o.xz += dd / (L + 1e-3) * k; o.y = max(o.y, k); } return o; }
  vec2 shake(vec3 ip){ vec2 o = vec2(0.); for (int i = 0; i < 4; i++){ vec4 s = uShk[i]; float e = uTime - s.w;
    o += vec2(sin(e*13.), cos(e*10.7)) * s.z * exp(-e*2.6) * step(0., e) * (1. - smoothstep(0.4, 2.6, length(ip.xz - s.xy))); } return o; }
`;

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
  // cỏ theo bảng màu docs/style-guide.md (grass #7fbf5e · grassD #5a9a48, bão hoà ≤ 0,62) — kiểu vẽ tay: đỉnh đồi sáng ấm, chân/khe tối mát
  const cSand = new THREE.Color('#f3d6a8'), cWet = new THREE.Color('#e8c391'), cG1 = new THREE.Color('#72ad58'), cG2 = new THREE.Color('#7fbf5e'), cG3 = new THREE.Color('#5a9a48'), cMeadow = new THREE.Color('#a7c172');
  const cTop = new THREE.Color('#b9c47e'), cCool = new THREE.Color('#4d8659'), cSoil = new THREE.Color('#a9845c'), cStone = new THREE.Color('#ad9a82');
  const cRock = new THREE.Color('#b3aa9b'), cDeep = new THREE.Color('#e6cc9a'), c = new THREE.Color();
  const cWeed = new THREE.Color('#7f9a4c'), cReef = new THREE.Color('#a89a86'), cAbyss = new THREE.Color('#5f8290');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = H[Math.round((z - WORLD.z0) / step) * (NX + 1) + Math.round((x - WORLD.x0) / step)];
    pos.setY(i, h);
    c.copy(cG1).lerp(cG2, fbm(x * 0.05, z * 0.05));
    const patch = fbm(x * 0.018 + 40, z * 0.018 - 13);
    c.lerp(cG3, smooth(0.55, 0.78, patch) * 0.55).lerp(cMeadow, smooth(0.6, 0.85, 1 - patch) * 0.35);   // mảng cỏ đậm (rừng) / đồng cỏ sáng
    { // địa thế: cao độ (đỉnh sáng ấm) + lồi/lõm so với xung quanh ~8 m (sống đồi sáng, khe/chân dốc tối mát)
      const rel = h - (heightAt(x + 8, z) + heightAt(x - 8, z) + heightAt(x, z + 8) + heightAt(x, z - 8)) / 4, th = smooth(FLAT + 1.5, 19, h);
      c.lerp(cTop, Math.min(0.62, th * 0.5 + smooth(0.15, 1.6, rel) * 0.3));
      c.lerp(cCool, Math.min(0.5, smooth(-0.15, -1.6, rel) * 0.42 + (1 - th) * smooth(FLAT + 0.6, FLAT + 4, h) * 0.12));
    }
    if (!(flatDist(x, z) < 3 && lagoonDist(x, z) > 4)) {   // thị trấn & đường: cỏ, không phải cát
      c.lerp(cSand, 1 - smooth(W + 0.7, W + 1.7, h));
      c.lerp(cWet, 1 - smooth(W + 0.05, W + 0.6, h));      // dải cát ướt sát mép nước
    }
    if (h < W - 0.05) {   // đáy biển: cát ướt → cát đáy → thảm rong / đá ngầm → vùng sâu tối dần
      const d = W - h;
      c.copy(cWet).lerp(cDeep, smooth(0.05, 1.5, d));
      c.lerp(cWeed, smooth(0.58, 0.72, fbm(x * 0.045 + 70, z * 0.045 - 30)) * smooth(1, 2.6, d) * 0.75);
      c.lerp(cReef, smooth(0.62, 0.8, fbm(x * 0.08 - 20, z * 0.08 + 50)) * smooth(0.5, 1.6, d) * 0.6);
      c.lerp(cAbyss, smooth(2.6, 6.5, d) * 0.7);
    }
    { // mép đồi dốc: đất nâu ấm → đá kem ấm (không còn mảng xám lộ)
      const sl = slopeAt(x, z), n = fbm(x * 0.09 - 11, z * 0.09 + 23);
      c.lerp(h < W - 0.05 ? cRock : cSoil, smooth(0.7, 1.15, sl) * (0.55 + 0.3 * n));
      if (h >= W - 0.05) c.lerp(cStone, smooth(1.15, 1.7, sl) * (0.45 + 0.4 * (1 - n)));
    }
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const groundMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap });
  // đáy biển: gợn cát (sóng cát song song bờ) + vân sáng khúc xạ (caustics) lay động dưới nước nông — chỉ vài phép sin/điểm ảnh
  groundMat.onBeforeCompile = sh => {   // highp: toạ độ thế giới tới ±335 m × 4,2 — mediump mất chính xác
    sh.uniforms.uTime = WIND.uTime;
    sh.vertexShader = 'varying highp vec3 vWp;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vWp = (modelMatrix * vec4(transformed, 1.)).xyz;');
    sh.fragmentShader = 'uniform highp float uTime; varying highp vec3 vWp;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float sd = ${W.toFixed(2)} - vWp.y;
      if (sd < -0.3) {   // đất liền: nét cọ dài theo 2 hướng + mảng màu lớn ngả vàng ấm/lam mát (pN của style.js, toạ độ highp)
        highp vec2 q = vPaintW.xz;
        float st1 = pN(vec3(dot(q, vec2(0.83, 0.55)) * 0.32, dot(q, vec2(-0.55, 0.83)) * 1.9, 3.1));
        float st2 = pN(vec3(dot(q, vec2(0.26, -0.97)) * 0.5, dot(q, vec2(0.97, 0.26)) * 2.6, 8.7));
        float gm = smoothstep(0.015, 0.08, diffuseColor.g - max(diffuseColor.r, diffuseColor.b));   // chỉ vùng cỏ
        float pat = pN(vec3(q * 0.045, 1.7)) * 0.7 + pN(vec3(q * 0.13, 5.3)) * 0.3;
        diffuseColor.rgb *= 1. + gm * (0.16 * (st1 - 0.5) + 0.1 * (st2 - 0.5));
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.1, 1.02, 0.78), gm * smoothstep(0.5, 0.8, pat) * 0.6);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.86, 0.95, 1.08), gm * (1. - smoothstep(0.2, 0.48, pat)) * 0.5);
      }
      if (sd > 0.03) {
        vec2 q = vWp.xz;
        float rip = sin(dot(q, vec2(0.62, 0.79)) * 4.2 + sin(dot(q, vec2(-0.79, 0.62)) * 0.7) * 1.8);
        diffuseColor.rgb *= 1. - 0.06 * rip * smoothstep(0.03, 0.4, sd) * (1. - smoothstep(3., 6., sd));
        vec2 p = q * 0.55;
        float c1 = abs(sin(p.x + sin(p.y * 1.3 + uTime * 0.9) * 1.4 + uTime * 0.6) + sin(p.y * 1.1 + sin(p.x * 0.8 - uTime * 0.7) * 1.3 - uTime * 0.5));
        float c2 = abs(sin(p.x * 1.618 - p.y * 0.9 + sin(p.y * 1.7 - uTime) * 1.1 + uTime * 0.8));
        float cs = (1. - smoothstep(0., 0.35, c1)) + (1. - smoothstep(0., 0.25, c2)) * 0.6;
        diffuseColor.rgb += vec3(0.32, 0.36, 0.3) * cs * smoothstep(0.05, 0.5, sd) * (1. - smoothstep(1.5, 5., sd));
      }`);
  };
  groundMat.customProgramCacheKey = () => 'seabed-paint';
  // chia thành ô 89×89 mắt lưới (Fibonacci, ~196 m; ô to hơn → ít draw call hơn) (dùng chung thuộc tính đỉnh, chỉ khác chỉ mục) → camera loại bỏ (frustum culling) phần ngoài khung hình;
  // trước đây 1 mesh ~190k tam giác luôn được vẽ toàn bộ
  const ground = new THREE.Group(); ground.name = 'ground'; scene.add(ground);
  { const gm = groundMat, TS = 89, n = NX + 1, bb = new THREE.Box3(), v = new THREE.Vector3();
    for (let tz = 0; tz < NZ; tz += TS) for (let tx = 0; tx < NX; tx += TS) {
      const ex = Math.min(NX, tx + TS), ez = Math.min(NZ, tz + TS), idx = []; bb.makeEmpty();
      for (let iz = tz; iz < ez; iz++) for (let ix = tx; ix < ex; ix++) { const a = iz * n + ix, b = a + n, c = b + 1, d = a + 1; idx.push(a, b, d, b, c, d); }
      for (let iz = tz; iz <= ez; iz++) for (let ix = tx; ix <= ex; ix++) bb.expandByPoint(v.fromBufferAttribute(pos, iz * n + ix));
      const tg = new THREE.BufferGeometry(); for (const k of ['position', 'normal', 'color']) tg.setAttribute(k, g.attributes[k]);
      tg.setIndex(idx); tg.boundingBox = bb.clone(); tg.boundingSphere = bb.getBoundingSphere(new THREE.Sphere());
      const m = new THREE.Mesh(tg, gm); m.receiveShadow = true; m.name = 'ground'; ground.add(m);
    } }

  // đáy biển nối dài ra khơi ngoài lưới địa hình (lặn xa bờ không thấy khoảng trống) — 1 mặt phẳng, thấp hơn đáy sâu nhất 0,3 m
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1597, 1597).rotateX(-Math.PI / 2), new THREE.MeshToonMaterial({ color: new THREE.Color('#e6cc9a').lerp(cAbyss, 0.7), gradientMap }));
  floor.position.set(CX, -6.3, CZ); floor.receiveShadow = true; floor.name = 'seafloor'; floor.visible = false; scene.add(floor);
  addEventListener('island:underwater', e => { floor.visible = e.detail; });   // chỉ vẽ khi lặn (trên mặt nước: nước sâu đục, không thấy) → không tốn draw call

  // ---------- Nước: bản đồ độ cao (độ sâu) cho shader nước + cá + hạt ----------
  const TS = 256, hd = new Uint8Array(TS * TS);
  for (let j = 0; j < TS; j++) for (let i = 0; i < TS; i++) hd[j * TS + i] = Math.max(0, Math.min(255, Math.round((heightAt(WORLD.x0 + (i + 0.5) / TS * SX, WORLD.z0 + (j + 0.5) / TS * SZ) + 8) * 12)));
  const hTex = new THREE.DataTexture(hd, TS, TS, THREE.RedFormat); hTex.magFilter = hTex.minFilter = THREE.LinearFilter; hTex.needsUpdate = true;
  // sóng Gerstner + lưới theo camera: ocean-water.js
  const ocean = createOceanWater(scene, { heightAt, hTex, WORLD, SX, SZ, W, WIND }), waterMat = ocean.mat;

  // ---------- Vật liệu lay theo gió (cây, cỏ) ----------
  function windy(mat, amp, push = 0) {
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, WIND);
      sh.vertexShader = WIND_GLSL + sh.vertexShader.replace('#include <color_vertex>', '#include <color_vertex>\n#ifdef USE_COLOR\n vColor = seasonCol(vColor, .618);\n#endif').replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 ip = (modelMatrix * instanceMatrix * vec4(0.,0.,0.,1.)).xyz, c0 = instanceMatrix[0].xyz;
        float hh = max(position.y, 0.);
        vec2 wo = windOff(ip); transformed += toL(vec3(wo.x, 0., wo.y)) * length(c0) * ${amp.toFixed(3)} * hh;
        ${push ? `vec3 mp = movPush(ip); transformed += toL(vec3(mp.x, 0., mp.z)) * hh * 0.9; transformed.y -= mp.y * hh * 0.35;` : ''}`);
    };
    mat.customProgramCacheKey = () => 'windy' + amp + push;
    return mat;
  }

  // chỗ đặt cây/đá: trên cạn, không quá dốc, tránh bãi xuất phát
  // không bao giờ mọc trong khu, lô đất, đường, hồ, sân đền (layout.js: blocked) — lề 4 m
  const clear = (x, z, m = 4) => !blocked(x, z, m) && Math.hypot(x - PLAZA.x, z - PLAZA.z) > PLAZA.R + 3 + m;   // không mọc trên quảng trường
  // 40% dồn vào rừng quanh đền (khu I), còn lại rải khắp đảo
  const spot = (minH = W + 1.4, m = 4) => { for (let k = 0; k < 40; k++) { const forest = rand() < 0.4, a = rand() * 6.283, r = forest ? 18 + Math.sqrt(rand()) * 62 : Math.sqrt(rand()) * R * 1.02, x = (forest ? TEMPLE_C[0] : 0) + Math.cos(a) * r, z = (forest ? TEMPLE_C[1] : 0) + Math.sin(a) * r, h = heightAt(x, z); if (h > minH && slopeAt(x, z) < 0.9 && clear(x, z, m)) return [x, h, z]; } return null; };
  const trunks = [];   // [x, y, z, tỷ lệ] mọi cây có gió (living.js: rung cây, lá rơi)
  const plants = [];   // [x, z, bán kính, loại] — để kiểm tra không mọc trùng kiến trúc
  const colliders = [];
  const o = new THREE.Object3D(), tint = new THREE.Color();
  // ---------- Thiên nhiên bằng model CC0 (Quaternius Ultimate Nature: cây, bụi, đá, hoa, dương xỉ, cỏ cụm, gốc cây, khúc gỗ) ----------
  // Mỗi loại = 1 InstancedMesh "gần" (model đủ chi tiết, đổ bóng nếu là cây) + 1 InstancedMesh "xa" (bản LOD ít tam giác, không đổ bóng).
  // Chia lại gần/xa/ẩn khi người chơi đi > 3 m hoặc camera quay > 0,21 rad: chỉ giữ vật trong hình nón nhìn của camera
  // (+ vòng 13 m quanh người chơi cho bóng đổ) → không vẽ cây sau lưng, kể cả ở pass bóng; số draw call không đổi.
  const lodSets = [], KS = {};
  const NAT = { add: (k, l) => addNature(k, l), skip: null, relayout: () => { for (const S of lodSets) S.relayout(S.last); } };
  const pick = a => a[Math.floor(rand() * a.length)];
  const view = { x: 0, z: 0, dx: 0, dz: -1, cos: -2, yaw: 0, on: false };   // hình nón nhìn (mặt phẳng XZ), cos < -1 → tắt lọc
  function kitSet(kind, items = []) {
    const def = NATURE[kind], mat = natureMat(def.wind || 0, def.push || 0);
    const lodOK = def.far && def.type !== 'rock';   // cây: tầng thứ 3 > 89 m dùng khối giản lược (lowGeo)
    const set = { kind, items, near: null, far: null, lod: null, lodGeo: null, cap: 0, at: new THREE.Vector3(1e9, 0, 0), last: new THREE.Vector3(0, 0, 10) };
    const mk = (geo, shadow, mt = mat) => { const m = new THREE.InstancedMesh(geo, mt, set.cap); m.castShadow = shadow; m.receiveShadow = true; m.name = 'nature-' + kind; scene.add(m); return m; };
    set.build = () => {
      if (!set.geo || !items.length) return;
      if (set.cap >= items.length) return set.relayout(set.last);
      for (const m of [set.near, set.far, set.lod]) if (m) { scene.remove(m); m.dispose(); }
      set.cap = Math.ceil(items.length * 1.1); set.near = mk(set.geo, !!def.shadow); set.far = def.far ? mk(set.lodGeo || set.geo, false) : null;
      set.lod = lodOK ? mk(set.low || (set.low = lowGeo(set.geo, def.type)), false, natureMat(0, 0)) : null; set.relayout(set.last);
    };
    const fill = (m, idx) => {
      for (let j = 0; j < idx.length; j++) { const q = items[idx[j]]; m.setMatrixAt(j, q.m); m.setColorAt(j, q.c); } m.count = idx.length; m.visible = idx.length > 0;
      m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
      if (idx.length) m.computeBoundingSphere();   // hình cầu bao của các vật đang hiện → camera tự cắt cả mesh khi ra ngoài khung hình
    };
    set.relayout = p => {
      set.last.copy(p); if (!set.near) return;
      // bay cao (> 21 m): bụi, hoa, nấm, sỏi, gốc cây chỉ còn vài điểm ảnh → ẩn hết (cây, đá lớn giữ nguyên)
      const dNear = def.dist === 'tree' ? state.treeDist : state.high ? 0 : def.dist === 'grass' ? state.grassDist : def.dist === 'flower' ? state.grassDist * 0.75 : def.dist, dFar = scene.fog ? scene.fog.far + 20 : 400, a = set._a || (set._a = []), b = set._b || (set._b = []), c = set._c || (set._c = []);
      a.length = b.length = c.length = 0; const n2 = dNear * dNear, f2 = dFar * dFar, l2 = set.lod ? LOD_D * LOD_D : 1e12;   // dùng lại mảng, so bình phương khoảng cách (không tạo rác mỗi lần)
      // tắt bóng đổ (chất lượng 3) → gần/xa như nhau: gộp hết vào 1 mesh, đỡ 1 draw call mỗi loại
      const one = !state.shadows, V = view, r0 = def.r * 8 + 13, r02 = r0 * r0;
      for (let k = 0; k < items.length; k++) {
        const e = items[k].m.elements, x = e[12], z = e[14], dx = x - p.x, dz = z - p.z, d = dx * dx + dz * dz;
        if (NAT.skip && NAT.skip(x, z, def.r * 6)) continue;   // khu mini game đang chơi (mg/host.js): không mọc cây/cỏ trong sân chơi
        if (d > r02 && V.cos > -1) { const ex = x - V.x, ez = z - V.z, L = Math.hypot(ex, ez) || 1; if ((ex * V.dx + ez * V.dz) / L < V.cos) continue; }   // ngoài hình nón nhìn
        if (d < n2) a.push(k); else if (set.far && d < f2) (d > l2 ? c : one ? a : b).push(k);
      }
      fill(set.near, a); if (set.far) fill(set.far, b); if (set.lod) fill(set.lod, c);
    };
    Promise.all([kitGeo(kind), def.lod ? kitGeo(kind, true) : null]).then(([g, l]) => { set.geo = g; set.lodGeo = l; set.build(); });
    lodSets.push(set); KS[kind] = set; return set;
  }
  // thêm vật: [x, y, z, tỷ lệ, xoay, màu (tô lên phần lá/hoa/đá)] — dùng được từ file khác qua terrain.nature.add()
  function addNature(kind, list) {
    const set = KS[kind] || kitSet(kind), def = NATURE[kind];
    for (const [x, y, z, s, ry, col] of list) { if (def.wind && /tree|pine|palm/.test(def.type)) trunks.push([x, y, z, s]); o.position.set(x, y, z); o.rotation.set(0, ry ?? rand() * 6.28, 0); o.scale.setScalar(s); o.updateMatrix(); set.items.push({ m: o.matrix.clone(), c: new THREE.Color(col || pick(def.tints)).offsetHSL(0, 0, (rand() - 0.5) * 0.06) }); }
    set.build(); return set;
  }
  // cây 3 cỡ (nhỏ · vừa · lớn, lệch nhau ≈ φ^½) + lệch ngẫu nhiên nhẹ; 34% cây có tầng thấp (dương xỉ/bụi/cỏ cụm) quanh gốc → mép rừng tự nhiên
  const under = { fern: [], bush: [], tuft: [] }, TIER = [0.1, 0.5, 0.9];
  const plant = (kind, n, sMin, sMax, colR, minH, m = 4) => {
    const list = [], tall = /tree|pine|palm/.test(NATURE[kind].type);
    for (let i = 0; i < n; i++) {
      const p = spot(minH, m); if (!p) continue;
      const s = tall ? sMin * 0.85 + (sMax * 1.12 - sMin * 0.85) * Math.min(1, Math.max(0, pick(TIER) + (rand() - 0.5) * 0.16)) : sMin + rand() * (sMax - sMin);
      if (colR) colliders.push({ x: p[0], z: p[2], r: colR * s }); plants.push([p[0], p[2], NATURE[kind].r * s, NATURE[kind].type]); list.push([p[0], p[1] - 0.08, p[2], s]);
      if (tall && rand() < 0.34) for (let k = 0; k < 1 + (rand() < 0.5); k++) {
        const a = rand() * 6.283, d = 1.6 + rand() * 1.8, x = p[0] + Math.cos(a) * d, z = p[2] + Math.sin(a) * d, h = heightAt(x, z);
        if (h > W + 1 && clear(x, z, 1)) { const u = rand(); (u < 0.45 ? under.fern : u < 0.7 ? under.bush : under.tuft).push([x, h - 0.05, z, u < 0.7 ? 2.2 + rand() * 1.4 : 2.0 + rand()]); }
      }
    }
    addNature(kind, list);
  };
  // cây tán tròn/xum xuê (3 kiểu) + bạch dương, ít cây lá cam làm điểm nhấn; thông 2 kiểu — tỷ lệ = cỡ model cũ (~1.2–1.6 m gốc)
  const nT = CFG.counts.trees, nP = CFG.counts.pines;
  plant('oak', Math.round(nT * 0.27), 4.0, 5.6, 0.1); plant('fat', Math.round(nT * 0.27), 4.2, 5.6, 0.1); plant('round', Math.round(nT * 0.24), 3.0, 4.0, 0.1);
  plant('birch', Math.round(nT * 0.16), 3.0, 4.2, 0.08); plant('autumn', Math.round(nT * 0.04), 3.2, 4.2, 0.1);
  plant('pine', Math.round(nP * 0.55), 3.2, 4.6, 0.1); plant('pineTall', Math.round(nP * 0.45), 3.4, 4.8, 0.08);
  // đá: to (có va chạm), dựng đứng, sỏi ven bờ
  plant('rockL', Math.round(CFG.counts.rocks * 0.45), 1.6, 3.6, 0.45, W - 0.3, 2); plant('rockT', Math.round(CFG.counts.rocks * 0.2), 1.4, 2.6, 0.4, W - 0.2, 2);
  plant('pebbles', Math.round(CFG.counts.rocks * 0.6), 2.0, 3.5, 0, W - 0.4, 2);
  // tầng thấp: bụi, bụi quả, cụm hoa, dương xỉ, cỏ cụm, nấm, gốc cây, khúc gỗ (không đổ bóng, chỉ hiện gần) — lấp khoảng trống giữa các khu
  plant('bush', CFG.isMobile ? 260 : 420, 2.4, 4.2, 0); plant('berry', CFG.isMobile ? 40 : 70, 2.4, 3.4, 0); plant('flowers', CFG.isMobile ? 360 : 600, 1.8, 2.6, 0);
  plant('fern', CFG.isMobile ? 160 : 280, 2.2, 3.4, 0); plant('tuft', CFG.isMobile ? 380 : 700, 2.0, 3.2, 0); plant('mushrooms', 90, 2.2, 3.2, 0);
  plant('stump', 40, 2.4, 3.2, 0.3); plant('log', 28, 2.0, 2.8, 0.5);
  for (const k of Object.keys(under)) addNature(k, under[k]);

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
    list.forEach(([x, y, z], i) => { o.position.set(x, y - 0.02, z); o.rotation.set(0, rand() * 6.28, 0); const s = 0.8 + rand() * 0.7; o.scale.set(s, s * (0.7 + rand() * 0.6), s); o.updateMatrix(); m.setMatrixAt(i, o.matrix); m.setColorAt(i, tint.setHSL(0.24 + rand() * 0.06, 0.42, 0.46 + rand() * 0.16)); /* hợp màu cỏ mới (bão hoà ≤ 0,62) */ cx += x; cz += z; });
    m.computeBoundingSphere(); m.receiveShadow = true; scene.add(m); grass.push({ m, x: cx / list.length, z: cz / list.length });
  }

  let lodT = 0, viewT = 0; const lodQ = []; const state = { grassDist: CFG.isMobile ? 45 : 65, treeDist: CFG.isMobile ? 34 : 44, shadows: true, high: false, camera: null };
  const _d = new THREE.Vector3();
  // hình nón nhìn từ camera (ocean.js gán state.camera); nhìn gần thẳng đứng / bay cao → tắt lọc
  function aim(player) {
    const cam = state.camera; if (!cam) return false;
    cam.getWorldDirection(_d); const L = Math.hypot(_d.x, _d.z), was = view.cos;
    if (Math.abs(_d.y) > 0.8 || L < 0.3 || cam.position.y - player.y > 34) { view.cos = -2; return was > -1; }
    const half = Math.atan(Math.tan(cam.fov * Math.PI / 360) * cam.aspect) + 0.55, yaw = Math.atan2(_d.x, _d.z);
    const turned = was < -1 || Math.abs(Math.atan2(Math.sin(yaw - view.yaw), Math.cos(yaw - view.yaw))) > 0.21;
    if (!turned) return false;
    view.dx = _d.x / L; view.dz = _d.z / L; view.x = cam.position.x - view.dx * 5; view.z = cam.position.z - view.dz * 5; view.yaw = yaw; view.cos = Math.cos(Math.min(half, Math.PI)); return true;
  }
  function update(dt, t, player) {
    WIND.uTime.value = t; ocean.update();
    if (player) WIND.uPlayer.value.copy(player);
    if (player && (viewT += dt) > 0.1) { viewT = 0; if (aim(player)) for (const L of lodSets) if (!L.queued) { L.queued = true; lodQ.push(L); } }   // quay camera → xếp hàng chia lại (mỗi khung 1 loại)
    if ((lodT += dt) > 0.4 && player) {
      lodT = 0; const high = player.y - Math.max(heightAt(player.x, player.z), W) > 21;   // bay cao 21 m (Fibonacci): cỏ, hoa… không còn thấy
      const flip = high !== state.high; state.high = high;
      for (const c of grass) c.m.visible = !high && Math.hypot(c.x - player.x, c.z - player.z) < state.grassDist;
      for (const L of lodSets) if (!L.queued && (flip || L.at.distanceToSquared(player) > 9)) { L.queued = true; lodQ.push(L); }
    }
    // chia lại gần/xa: mỗi khung 1 loại (trước: cả 14 loại × hàng nghìn vật trong 1 khung → khựng khi đi bộ)
    for (let i = 0; i < 3 && lodQ.length && player; i++) { const L = lodQ.shift(); L.queued = false; L.at.copy(player); L.relayout(player); }
  }
  state.relayoutAll = p => { for (const L of lodSets) L.relayout(p, state.treeDist); };
  return { heightAt, slopeAt, update, colliders, ground, waterMat, waveHeight: ocean.waveHeight, waveNormal: ocean.waveNormal, water: ocean, state, plants, trunks, nature: NAT };
}

// LOD cây xa (> 89 m, Fibonacci; style-guide §5 "55–144 m: hình khối + màu"): tán = khối 20 mặt (cây tròn) / chóp 6 cạnh (thông),
// thân = trụ 5 cạnh, cỡ và màu lấy từ hộp bao + màu trung bình phần lá (tint = 1) / thân (tint = 0) của model gốc → ~40 tam giác thay 50–230
const LOD_D = 89;
function lowGeo(src, type) {
  const P = src.attributes.position, C = src.attributes.color, T = src.attributes.tint, parts = [];
  for (const t of [1, 0]) {
    const bb = new THREE.Box3(), v = new THREE.Vector3(), col = [0, 0, 0]; let n = 0;
    for (let i = 0; i < P.count; i++) if ((T.getX(i) > 0.5) === !!t) { bb.expandByPoint(v.fromBufferAttribute(P, i)); col[0] += C.getX(i); col[1] += C.getY(i); col[2] += C.getZ(i); n++; }
    if (!n) continue;
    const sz = bb.getSize(new THREE.Vector3()), ct = bb.getCenter(new THREE.Vector3());
    let g = t ? (type === 'pine' ? new THREE.ConeGeometry(0.5, 1, 6, 1) : new THREE.IcosahedronGeometry(0.5, 0)) : new THREE.CylinderGeometry(0.5, 0.5, 1, 5, 1, true);
    g = g.toNonIndexed(); g.deleteAttribute('uv'); g.scale(t ? sz.x : sz.x * 0.618, sz.y, t ? sz.z : sz.z * 0.618).translate(ct.x, ct.y, ct.z); g.computeVertexNormals();
    const k = g.attributes.position.count; g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(k * 3).map((_, j) => col[j % 3] / n), 3));
    g.setAttribute('tint', new THREE.BufferAttribute(new Float32Array(k).fill(t), 1)); parts.push(g);
  }
  const g = mergeGeometries(parts); g.computeBoundingSphere(); return g;
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

// hoa chỉ hiện gần camera: 3/4 tầm cỏ (điện thoại 34 m, Fibonacci), cụm 4 bông (máy tính 6) — trước: 45 m × 6 bông = ~44 k tam giác ở rừng
// ---------- Model CC0 cho thiên nhiên (client/assets/models/kit/qn_*.glb — Quaternius Ultimate Nature, xem CREDITS.txt) ----------
// Vai trò từng phần theo TÊN vật liệu trong .glb → màu nền + có nhận màu riêng từng bản sao (tint) không.
// Lá/đá/cánh hoa để trắng (tint 1) → màu lấy từ bảng tints (3 sắc, theo sample/palette.js); thân/gỗ giữ màu gỗ.
const MATROLE = {
  Green: ['#ffffff', 1], DarkGreen: ['#c9d8c2', 1], Rock: ['#ffffff', 1], Wood: ['#8a5a34', 0], LightWood: ['#c49a6c', 0],
  White: ['#efe6d6', 0], Black: ['#4a3a3f', 0], Berry: ['#e0503e', 0], Coconuts: ['#8a6a3a', 0],
  Yellow: ['#f2c443', 0], Cyan: ['#ffffff', 1], Pink: ['#ffffff', 1], Mushroom_Top: ['#e0503e', 0], Mushroom_Bottom: ['#f3ead6', 0],
  // model cũ (kit Kenney) — nấm
  default: ['#ffffff', 1],
};
const ROLE = { cap: ['#ffffff', 1], stalk: ['#fbf1de', 0] };
// 3 sắc mỗi loại (palette.js: leaf #4f9a4a · leafD #357040 · grass #7fbf5e · flowerRed #e0503e …), cây đỏ chỉ dùng làm điểm nhấn
const LEAF = ['#6aae55', '#5a9f4c', '#7cb860'], PINE = ['#3f8a55', '#4a9a5a', '#357a4c'];
// h: chiều cao (m) của model ở tỷ lệ 1 → giữ nguyên ý nghĩa tham số tỷ lệ mà các file khu đang truyền vào (model cũ cao bao nhiêu thì model mới cao bấy nhiêu).
// w: thay cho h — khớp theo bề ngang lớn nhất (đá, khúc gỗ). lod: bản ít tam giác cho vùng xa.
export const NATURE = {
  oak:      { type: 'tree', r: 0.35, model: 'qn_tree_d', lod: 'qn_tree_d_lod', h: 1.23, tints: LEAF, wind: 0.035, shadow: true, far: true, dist: 'tree' },
  fat:      { type: 'tree', r: 0.35, model: 'qn_tree_b', lod: 'qn_tree_b_lod', h: 1.15, tints: ['#7cb860', '#6aae55', '#86c066'], wind: 0.03, shadow: true, far: true, dist: 'tree' },
  round:    { type: 'tree', r: 0.35, model: 'qn_tree_c', lod: 'qn_tree_c_lod', h: 1.5, tints: ['#5a9f4c', '#4f9a4a', '#6aae55'], wind: 0.03, shadow: true, far: true, dist: 'tree' },
  phuong:   { type: 'tree', r: 0.35, model: 'qn_tree_a', lod: 'qn_tree_a_lod', h: 1.25, tints: ['#e0503e', '#e8653f', '#d8463a'], wind: 0.035, shadow: true, far: true, dist: 'tree' },
  autumn:   { type: 'tree', r: 0.35, model: 'qn_tree_a', lod: 'qn_tree_a_lod', h: 1.4, tints: ['#e8963a', '#f2b443', '#d9763a'], wind: 0.035, shadow: true, far: true, dist: 'tree' },
  birch:    { type: 'tree', r: 0.3, model: 'qn_birch_a', lod: 'qn_birch_a_lod', h: 1.5, tints: ['#8fbf5e', '#7cb860', '#9ccb6a'], wind: 0.04, shadow: true, far: true, dist: 'tree' },
  pine:     { type: 'pine', r: 0.3, model: 'qn_pine_a', lod: 'qn_pine_a_lod', h: 1.55, tints: PINE, wind: 0.02, shadow: true, far: true, dist: 'tree' },
  pineTall: { type: 'pine', r: 0.25, model: 'qn_pine_c', lod: 'qn_pine_c_lod', h: 1.6, tints: PINE, wind: 0.02, shadow: true, far: true, dist: 'tree' },
  palm:     { type: 'palm', r: 0.15, model: 'qn_palm_c', h: 1.36, tints: ['#5aa64a', '#4f9a45', '#66b052'], wind: 0.04, shadow: true, far: true, dist: 'tree' },
  palmB:    { type: 'palm', r: 0.15, model: 'qn_palm_a', h: 1.36, tints: ['#5aa64a', '#4f9a45', '#66b052'], wind: 0.04, shadow: true, far: true, dist: 'tree' },
  rockL:    { type: 'rock', r: 0.45, model: 'qn_rock_moss_f', w: 1.0, sy: 0.55, tints: ['#b9b0a1', '#aaa293', '#c2b9aa'], shadow: true, far: true, dist: 'tree' },
  rockT:    { type: 'rock', r: 0.45, model: 'qn_rock_a', h: 1.0, tints: ['#b9b0a1', '#a9a297'], shadow: true, far: true, dist: 'tree' },
  pebbles:  { type: 'rock', r: 0.3, model: 'qn_rock_c', w: 0.3, sy: 0.6, tints: ['#c2b9aa', '#a9a297', '#d0c7b8'], copies: 4, spread: 0.35, dist: 55 },
  bush:     { type: 'bush', r: 0.3, model: 'qn_bush_a', w: 0.4, tints: ['#5a9f4c', '#4f9a4a', '#6aae55', '#357a4c'], copies: 2, spread: 0.25, wind: 0.05, push: 0.5, dist: 55 },
  berry:    { type: 'bush', r: 0.3, model: 'qn_bush_berry', w: 0.4, tints: ['#5a9f4c', '#4f9a4a'], wind: 0.05, push: 0.5, dist: 60 },
  flowers:  { type: 'flower', r: 0.3, model: 'qn_flowers', h: 0.3, tints: ['#ee93a8', '#f2c443', '#f6f1e6', '#c9a3ff', '#e0503e'], copies: CFG.isMobile ? 4 : 5, spread: 0.4, wind: 0.12, push: 1, dist: 'flower' },
  fern:     { type: 'plant', r: 0.3, model: 'qn_plant_a', h: 0.32, tints: ['#5a9f4c', '#6aae55', '#4f9a4a'], copies: 3, spread: 0.35, wind: 0.08, push: 0.8, dist: 'grass' },
  tuft:     { type: 'plant', r: 0.25, model: 'qn_grass_b', h: 0.3, tints: ['#7fbf5e', '#6aae55', '#8cc66a'], copies: 4, spread: 0.3, wind: 0.14, push: 1, dist: 'grass' },
  mushrooms:{ type: 'plant', r: 0.2, model: 'mushroom_red', parts: ['cap', 'stalk'], tints: ['#e0503e', '#f07a3a', '#c9864f'], copies: 3, spread: 0.25, dist: 45 },
  stump:    { type: 'plant', r: 0.25, model: 'qn_stump', w: 0.37, tints: ['#6aae55'], dist: 60 },
  log:      { type: 'plant', r: 0.5, model: 'qn_log', w: 1.0, tints: ['#6aae55'], dist: 60 },
};
const geoCache = new Map();
// Gộp các phần của model thành 1 geometry có màu theo đỉnh + thuộc tính 'tint' (phần nào nhận màu riêng của từng bản sao)
export function kitGeo(kind, lod = false) {
  const ck = kind + (lod ? ':lod' : ''); if (geoCache.has(ck)) return geoCache.get(ck);
  const def = NATURE[kind];
  const p = loadModel('kit/' + (lod ? def.lod : def.model)).then(src => {
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
      const [hex, t] = def.parts ? (ROLE[def.parts[i++]] || MATROLE.default) : (MATROLE[m.material.name] || MATROLE.default); c.set(hex); const n = g.attributes.position.count;
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).map((_, j) => [c.r, c.g, c.b][j % 3]), 3));
      g.setAttribute('tint', new THREE.BufferAttribute(new Float32Array(n).fill(t), 1));
      parts.push(g);
    });
    let geo = mergeGeometries(parts);
    if (def.h || def.w) {   // khớp cỡ model mới với cỡ model cũ (cùng tham số tỷ lệ)
      geo.computeBoundingBox(); const s = new THREE.Vector3(); geo.boundingBox.getSize(s);
      const k = def.h ? def.h / s.y : def.w / Math.max(s.x, s.z); geo.scale(k, k * (def.sy || 1), k);
    }
    if (def.copies) {   // cụm nhiều bản nhỏ (hoa, sỏi, bụi, cỏ): 1 bản sao = cả cụm → ít draw call
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
  geoCache.set(ck, p); return p;
}
// Vật liệu toon dùng màu theo đỉnh; màu riêng từng bản sao chỉ tô lên phần 'tint' (lá, hoa, đá) — thân cây giữ màu gỗ.
// wind: lay theo gió (tăng theo độ cao); push: rẽ ra khi người chơi đi qua (hoa, cỏ)
const natCache = new Map();
export function natureMat(wind = 0, push = 0) {
  const key = wind + ':' + push; if (natCache.has(key)) return natCache.get(key);
  const mat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap });
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, WIND);
    sh.vertexShader = 'attribute float tint;\n' + WIND_GLSL + sh.vertexShader
      .replace('#include <color_vertex>', `vColor = vec3(1.); vColor *= color;
        #ifdef USE_INSTANCING_COLOR
          vColor *= mix(vec3(1.), instanceColor.xyz, tint);
        #endif
        vColor = mix(vColor, seasonCol(vColor, 1.), tint);`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 ip = (modelMatrix * instanceMatrix * vec4(0.,0.,0.,1.)).xyz;
        ${wind ? `float hh = max(position.y, 0.); hh *= hh;
        vec2 wo = windOff(ip) * ${wind.toFixed(3)} + shake(ip) * ${(wind * 1.618).toFixed(3)}; transformed += toL(vec3(wo.x, 0., wo.y)) * length(instanceMatrix[0].xyz) * hh;` : ''}
        ${push ? `vec3 mp = movPush(ip); transformed += toL(vec3(mp.x, 0., mp.z)) * max(position.y, 0.) * ${(0.7 * push).toFixed(3)}; transformed.y -= mp.y * max(position.y, 0.) * 0.4;` : ''}`);
  };
  mat.customProgramCacheKey = () => 'nature' + key;
  natCache.set(key, mat); return mat;
}
