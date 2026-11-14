// terrain.js — Đảo: đồi lượn sóng, bãi cát, nước có bọt ở bờ, cây & đá (InstancedMesh), cỏ lay theo gió.
// - Hình dáng đảo: rawHeight()   - Màu đất: colorAt()   - Số lượng cây/đá/cỏ: CFG.counts (config.js)
import * as THREE from 'three';
import { CFG } from './config.js';
import { gradientMap, toon } from './style.js';

// ---------- noise ----------
const hash = (x, y) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function noise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
export const fbm = (x, y) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { s += a * noise(x * f + i * 31, y * f - i * 17); a *= 0.5; f *= 2.02; } return s / 0.9375; };
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
let seed = CFG.seed; export const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// Uniform dùng chung cho gió và cỏ rẽ
export const WIND = { uTime: { value: 0 }, uPlayer: { value: new THREE.Vector3(0, -99, 0) } };

const R = CFG.island.radius;
// Độ cao: đảo tròn hơi méo, đồi thoải ở giữa, ra rìa chìm xuống biển
export function rawHeight(x, z) {
  const ang = Math.atan2(z, x), r = Math.hypot(x, z);
  const edge = R * (0.85 + 0.25 * fbm(Math.cos(ang) * 2 + 5, Math.sin(ang) * 2 + 5));
  const land = 1 - smooth(edge * 0.75, edge, r);
  const hills = 2.2 + fbm(x * 0.025, z * 0.025) * 9 + Math.max(0, fbm(x * 0.012 + 9, z * 0.012) - 0.55) * 30;
  const plaza = 1 - smooth(10, 22, Math.hypot(x, z - 10)); // khoảng đất phẳng cho người chơi xuất phát
  const h = hills * (1 - plaza * 0.85) + plaza * 0.85 * 2.5;
  return h * land - 6 * (1 - land);
}

export function createTerrain(scene) {
  const S = CFG.island.size, N = CFG.island.segments, step = S / N, half = S / 2, W = CFG.island.waterLevel;
  const H = new Float32Array((N + 1) * (N + 1));
  for (let iz = 0; iz <= N; iz++) for (let ix = 0; ix <= N; ix++) H[iz * (N + 1) + ix] = rawHeight(-half + ix * step, -half + iz * step);
  const heightAt = (x, z) => {
    const gx = Math.min(N - 0.001, Math.max(0, (x + half) / step)), gz = Math.min(N - 0.001, Math.max(0, (z + half) / step));
    const ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz, n = N + 1;
    const a = H[iz * n + ix], b = H[(iz + 1) * n + ix], c = H[(iz + 1) * n + ix + 1], d = H[iz * n + ix + 1];
    return fx + fz <= 1 ? a + (d - a) * fx + (b - a) * fz : c + (b - c) * (1 - fx) + (d - c) * (1 - fz);
  };
  const slopeAt = (x, z) => Math.hypot(heightAt(x + 1, z) - heightAt(x - 1, z), heightAt(x, z + 1) - heightAt(x, z - 1)) / 2;

  // ---------- Mặt đất (toon, màu theo độ cao/độ dốc) ----------
  const g = new THREE.PlaneGeometry(S, S, N, N); g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3);
  const cSand = new THREE.Color('#ecd9a0'), cG1 = new THREE.Color('#6fbf4a'), cG2 = new THREE.Color('#9bd256'), cRock = new THREE.Color('#9a9488'), cDeep = new THREE.Color('#c8b27a'), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = H[Math.round((z + half) / step) * (N + 1) + Math.round((x + half) / step)];
    pos.setY(i, h);
    c.copy(cG1).lerp(cG2, fbm(x * 0.06, z * 0.06));
    c.lerp(cSand, 1 - smooth(W + 0.6, W + 1.6, h));
    if (h < W - 0.5) c.copy(cDeep);
    c.lerp(cRock, smooth(0.9, 1.5, slopeAt(x, z)) * 0.9);
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const ground = new THREE.Mesh(g, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap })); ground.receiveShadow = true; ground.name = 'ground';
  scene.add(ground);

  // ---------- Nước: màu theo độ sâu + bọt trắng ở bờ (đọc bản đồ độ cao, không cần depth texture) ----------
  const TS = 256, hd = new Uint8Array(TS * TS);
  for (let j = 0; j < TS; j++) for (let i = 0; i < TS; i++) hd[j * TS + i] = Math.max(0, Math.min(255, Math.round((heightAt(-half + (i + 0.5) / TS * S, -half + (j + 0.5) / TS * S) + 8) * 12)));
  const hTex = new THREE.DataTexture(hd, TS, TS, THREE.RedFormat); hTex.magFilter = hTex.minFilter = THREE.LinearFilter; hTex.needsUpdate = true;
  const waterMat = new THREE.ShaderMaterial({
    transparent: true, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uH: { value: null }, uHalf: { value: half }, uShallow: { value: new THREE.Color('#5fd3d6') }, uDeep: { value: new THREE.Color('#1f6fa8') }, uLight: { value: 1 } }]),
    vertexShader: `varying vec3 vW;
#include <fog_pars_vertex>
      void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
#include <fog_vertex>
      }`,
    fragmentShader: `uniform sampler2D uH; uniform float uHalf; uniform vec3 uShallow, uDeep; uniform float uLight; uniform float uTime; varying vec3 vW;
#include <fog_pars_fragment>
      void main(){
        vec2 uv = (vW.xz + uHalf) / (uHalf*2.);
        float h = (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) ? -8. : texture2D(uH, uv).r * 255. / 12. - 8.;
        float depth = max(0., -h);
        vec3 c = mix(uShallow, uDeep, smoothstep(0.3, 5., depth));
        c = mix(c, uDeep*0.8, step(3.5, depth)*0.35);             // dải màu kiểu toon
        float wave = sin(depth*5. - uTime*1.6 + sin(vW.x*0.3+uTime)*0.6);
        float foam = step(depth, 0.35) + step(0.75, wave) * (1. - smoothstep(0.4, 1.4, depth));
        float sparkle = step(0.985, sin(vW.x*1.7 + uTime*1.3)*sin(vW.z*1.9 - uTime*1.1));
        c = mix(c, vec3(1.), clamp(foam, 0., 1.)*0.85) + sparkle*0.25;
        gl_FragColor = vec4(c * uLight, mix(0.75, 0.95, smoothstep(0., 3., depth)));
#include <fog_fragment>
      }`,
  });
  waterMat.uniforms.uH.value = hTex; waterMat.uniforms.uTime = WIND.uTime;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(900, 900).rotateX(-Math.PI / 2), waterMat); water.position.y = W; scene.add(water);

  // ---------- Vật liệu lay theo gió (cây, cỏ) ----------
  function windy(mat, amp, push = 0) {
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, WIND);
      sh.vertexShader = 'uniform float uTime; uniform vec3 uPlayer;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 ip = (modelMatrix * instanceMatrix * vec4(0.,0.,0.,1.)).xyz;
        float hh = max(position.y, 0.);
        float sw = sin(uTime*1.8 + ip.x*0.35 + ip.z*0.27)*0.7 + sin(uTime*3.4 + ip.x)*0.3;
        transformed.x += sw * ${amp.toFixed(3)} * hh; transformed.z += sw * ${(amp * 0.6).toFixed(3)} * hh;
        ${push ? `vec2 d = ip.xz - uPlayer.xz; float L = length(d); float k = (1. - smoothstep(0.2, 1.4, L)) * step(abs(ip.y - uPlayer.y), 1.5);
        vec2 dl = normalize(vec2(dot(d, instanceMatrix[0].xz), dot(d, instanceMatrix[2].xz)) + 1e-4); // hướng rẽ trong hệ của ngọn cỏ
        transformed.xz += dl * k * hh * 0.9; transformed.y -= k * hh * 0.35;` : ''}`);
    };
    mat.customProgramCacheKey = () => 'windy' + amp + push;
    return mat;
  }

  // chỗ đặt cây/đá: trên cạn, không quá dốc, tránh bãi xuất phát
  const spot = (minH = W + 1.4) => { for (let k = 0; k < 40; k++) { const a = rand() * 6.283, r = Math.sqrt(rand()) * R * 1.05, x = Math.cos(a) * r, z = Math.sin(a) * r, h = heightAt(x, z); if (h > minH && slopeAt(x, z) < 0.9 && Math.hypot(x, z - 10) > 16) return [x, h, z]; } return null; };
  const colliders = [];
  const o = new THREE.Object3D(), tint = new THREE.Color();
  function instanced(parts, count, place) {
    const meshes = parts.map(([geo, mat]) => { const m = new THREE.InstancedMesh(geo, mat, count); m.castShadow = m.receiveShadow = true; scene.add(m); return m; });
    let n = 0;
    for (let i = 0; i < count; i++) { const p = place(); if (!p) continue; const [x, y, z, s, col] = p; o.position.set(x, y, z); o.rotation.set(0, rand() * 6.28, 0); o.scale.setScalar(s); o.updateMatrix(); for (const m of meshes) { m.setMatrixAt(n, o.matrix); m.setColorAt(n, tint.setHSL(0, 0, 1).offsetHSL((rand() - 0.5) * 0.04, 0, (rand() - 0.5) * 0.12)); } n++; }
    for (const m of meshes) { m.count = n; m.computeBoundingSphere(); }
    return meshes;
  }
  // Cây tròn (thân + tán 3 khối), cây thông, đá
  const trunk = new THREE.CylinderGeometry(0.18, 0.28, 2.2, 6).translate(0, 1.1, 0);
  const crown = (() => { const parts = [[0, 2.9, 0, 1.3], [0.7, 2.5, 0.3, 0.9], [-0.6, 2.6, -0.2, 0.95]].map(([x, y, z, r]) => new THREE.IcosahedronGeometry(r, 1).translate(x, y, z)); return mergeGeos(parts); })();
  const pine = mergeGeos([new THREE.ConeGeometry(1.4, 2.4, 7).translate(0, 2.2, 0), new THREE.ConeGeometry(1.05, 2, 7).translate(0, 3.4, 0), new THREE.ConeGeometry(0.7, 1.6, 7).translate(0, 4.5, 0)]);
  const trunkMat = toon('#7a5236'), leafMat = windy(new THREE.MeshToonMaterial({ color: '#4fae47', gradientMap }), 0.018), pineMat = windy(new THREE.MeshToonMaterial({ color: '#2f7d4a', gradientMap }), 0.014);
  const place = (sMin, sMax, colR) => () => { const p = spot(); if (!p) return null; const s = sMin + rand() * (sMax - sMin); colliders.push({ x: p[0], z: p[2], r: colR * s }); return [p[0], p[1] - 0.1, p[2], s]; };
  instanced([[trunk, trunkMat], [crown, leafMat]], CFG.counts.trees, place(0.8, 1.4, 0.4));
  instanced([[trunk, trunkMat], [pine, pineMat]], CFG.counts.pines, place(0.9, 1.5, 0.4));
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  instanced([[rockGeo, toon('#a7a29a')]], CFG.counts.rocks, () => { const p = spot(W - 0.3); if (!p) return null; const s = 0.3 + rand() * 1.1; if (s > 0.8) colliders.push({ x: p[0], z: p[2], r: s * 0.9 }); return [p[0], p[1] + s * 0.1, p[2], s]; });

  // ---------- Cỏ: chia ô, ô xa thì ẩn (LOD) ----------
  const blade = (() => { const geos = []; for (let i = 0; i < 3; i++) { const b = new THREE.BufferGeometry(); b.setAttribute('position', new THREE.Float32BufferAttribute([-0.07, 0, 0, 0.07, 0, 0, 0, 0.55, 0], 3)); b.setAttribute('color', new THREE.Float32BufferAttribute([0.25, 0.5, 0.2, 0.25, 0.5, 0.2, 0.75, 0.95, 0.45], 3)); b.rotateY(i * 1.05); b.translate((i - 1) * 0.06, 0, 0); geos.push(b); } const m = mergeGeos(geos); m.computeVertexNormals(); return m; })();
  const grassMat = windy(new THREE.MeshToonMaterial({ vertexColors: true, gradientMap, side: THREE.DoubleSide }), 0.22, 1);
  const chunks = new Map(), CH = 24;
  for (let i = 0; i < CFG.counts.grass; i++) {
    const a = rand() * 6.283, r = Math.sqrt(rand()) * R, x = Math.cos(a) * r, z = Math.sin(a) * r, h = heightAt(x, z);
    if (h < W + 1.0 || slopeAt(x, z) > 0.8) continue;
    const k = Math.floor(x / CH) + ',' + Math.floor(z / CH); if (!chunks.has(k)) chunks.set(k, []); chunks.get(k).push([x, h, z]);
  }
  const grass = [];
  for (const list of chunks.values()) {
    const m = new THREE.InstancedMesh(blade, grassMat, list.length); let cx = 0, cz = 0;
    list.forEach(([x, y, z], i) => { o.position.set(x, y - 0.02, z); o.rotation.set(0, rand() * 6.28, 0); const s = 0.8 + rand() * 0.7; o.scale.set(s, s * (0.7 + rand() * 0.6), s); o.updateMatrix(); m.setMatrixAt(i, o.matrix); m.setColorAt(i, tint.setHSL(0.28 + rand() * 0.05, 0.5, 0.5 + rand() * 0.2)); cx += x; cz += z; });
    m.computeBoundingSphere(); m.receiveShadow = true; scene.add(m); grass.push({ m, x: cx / list.length, z: cz / list.length });
  }

  let lodT = 0; const state = { grassDist: CFG.isMobile ? 45 : 65 };
  function update(dt, t, player) {
    WIND.uTime.value = t;
    if (player) WIND.uPlayer.value.copy(player);
    if ((lodT += dt) > 0.3 && player) { lodT = 0; for (const c of grass) c.m.visible = Math.hypot(c.x - player.x, c.z - player.z) < state.grassDist; }
  }
  return { heightAt, slopeAt, update, colliders, ground, waterMat, state };
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
