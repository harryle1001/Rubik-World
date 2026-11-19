// ocean-water.js — Mặt biển: tổng 5 sóng Gerstner (bước sóng 21/φⁱ m, biên độ A₀/φⁱ, hướng lệch π/φ⁴), lưới vòng đồng tâm đi theo camera
// (dày gần – thưa xa, 1 draw call), màu theo độ sâu, Fresnel phản chiếu trời, vệt nắng/trăng lấp lánh, bọt bờ + bọt đỉnh sóng, sóng vỗ bờ,
// nhìn từ dưới nước lên (cửa sổ Snell ~48,6°). waveHeight(x, z, t) dùng ĐÚNG công thức của shader để thuyền/người nổi khớp sóng.
import * as THREE from 'three';
import { CFG } from './config.js';
import { PHI } from './layout.js';

const G = 9.81, N_MAX = 5, GOLD = Math.PI * (3 - Math.sqrt(5));   // góc vàng 137,5°
const L0 = 21, A0 = 0.3, TH0 = 0.62;                                // sóng lừng chính: 21 m (Fibonacci), cao 0,3 m
// Sóng i: λ = 21/φⁱ (21 · 13 · 8 · 5 · 3 m), A = 0,3/φⁱ (cùng độ dốc kA ≈ 0,09), hướng lệch theo dãy {i/φ} trong quạt π/φ² (không đối xứng → không lộ ô cờ), độ nhọn Σ Q·k·A = 1/φ
export const WAVES = Array.from({ length: N_MAX }, (_, i) => {
  const L = L0 / PHI ** i, k = 2 * Math.PI / L, A = A0 / PHI ** i, th = TH0 + ((i / PHI) % 1 - 0.5) * Math.PI / PHI ** 2;
  return { dx: Math.cos(th), dz: Math.sin(th), k, A, w: Math.sqrt(G * k), q: (1 / PHI) / (N_MAX * k * A), ph: i * GOLD, L };
});
const FADE = 8;                                      // sóng ngắn tắt dần khi xa camera hơn 8λ (tránh nhiễu răng cưa ở lưới thưa)
// biên độ theo độ sâu: gần bờ/vịnh sóng nhỏ, biển khơi (≥ 13 m Fibonacci) sóng đủ lớn
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const depthAtt = d => 0.12 + 0.88 * ss(0.3, 13, d);

export function createOceanWater(scene, { heightAt, hTex, WORLD, SX, SZ, W, WIND }) {
  const state = { waveN: CFG.isMobile ? 3 : 5, amp: 1 };
  const wa = WAVES.map(v => new THREE.Vector4(v.dx, v.dz, v.k, v.A)), wb = WAVES.map(v => new THREE.Vector4(v.w, v.q, v.ph, v.L));
  const U = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uH: { value: null }, uMin: { value: new THREE.Vector2(WORLD.x0, WORLD.z0) }, uSize: { value: new THREE.Vector2(SX, SZ) },
    uShallow: { value: new THREE.Color('#46e3c6') }, uDeep: { value: new THREE.Color('#1688b0') }, uLight: { value: 1 },
    uSunW: { value: new THREE.Vector3(0, 1, 0) }, uSunC: { value: new THREE.Color('#fff') }, uSkyH: { value: new THREE.Color('#bfe6f6') },   // ambience.js nối với bầu trời
    uSkyT: { value: new THREE.Color('#5a9fe6') }, uSeaTint: { value: new THREE.Color('#1f7fa8') }, uMoon: { value: new THREE.Vector3(0, -1, 0) }, uNight: { value: 0 },
    uPlayer: { value: null }, uCloudR: { value: 0 }, uWaveN: { value: state.waveN }, uAmp: { value: 1 },
    uWA: { value: wa }, uWB: { value: wb },
  }]);
  const DEPTH = `uniform sampler2D uH; uniform vec2 uMin, uSize;
    float depthAt(vec2 p){ vec2 uv = (p - uMin) / uSize; if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) return 8.; return max(0., 8. - texture2D(uH, uv).r * 255. / 12.); }`;
  const mat = new THREE.ShaderMaterial({
    defines: {}, transparent: true, fog: true, depthWrite: false,   // không ghi độ sâu: cá dưới nước (ambience.js) vẫn vẽ lên được
    uniforms: U,
    vertexShader: `${DEPTH}
      uniform highp float uTime; uniform float uWaveN, uAmp; uniform vec4 uWA[${N_MAX}], uWB[${N_MAX}];
      varying highp vec3 vW; varying vec3 vN; varying float vCrest;
#include <fog_pars_vertex>
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.); vec2 p = w.xz;
        float att = (0.12 + 0.88 * smoothstep(0.3, 13., depthAt(p))) * uAmp, dist = length(p - cameraPosition.xz);
        vec3 d = vec3(0.), n = vec3(0., 1., 0.); float amp = 0.;
        for (int i = 0; i < ${N_MAX}; i++) {
          if (float(i) >= uWaveN) break;
          vec4 a = uWA[i], b = uWB[i];
          float A = a.w * att * (1. - smoothstep(b.w * ${FADE}., b.w * ${FADE * 2}., dist));
          float f = a.z * dot(a.xy, p) - b.x * uTime + b.z, S = sin(f), C = cos(f), QA = b.y * A;
          d += vec3(QA * a.x * C, A * S, QA * a.y * C);
          n -= vec3(a.x * a.z * A * C, b.y * a.z * A * S, a.y * a.z * A * C);
          amp += A;
        }
        w.xyz += d; vW = w.xyz; vN = n; vCrest = d.y / max(amp, 1e-3);
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
      }`,
    fragmentShader: `${DEPTH}
      uniform vec3 uShallow, uDeep, uSunW, uSunC, uSkyH, uSkyT, uPlayer, uMoon, uSeaTint; uniform float uLight, uNight, uCloudR; uniform highp float uTime;
      varying highp vec3 vW; varying vec3 vN; varying float vCrest;
#include <fog_pars_fragment>
      void main(){
        float depth = depthAt(vW.xz), dist = length(cameraPosition - vW), t = uTime;
        vec2 q = vW.xz; vec3 V = normalize(cameraPosition - vW);
        float det = 1. - smoothstep(21., 89., dist);                       // gợn nhỏ chỉ vẽ ở gần (21–89 m, Fibonacci)
        // gợn nhỏ: 3 sóng lăn tăn theo các hướng lệch góc vàng (không trùng trục x/z)
        vec2 g1 = vec2(0.81, 0.59), g2 = vec2(-0.43, 0.9), g3 = vec2(0.99, -0.13);
#ifdef LOW
        vec3 N = normalize(vN + det * vec3(g1.x, 0., g1.y) * cos(dot(q, g1) * 1.9 - t * 2.3) * 0.07);
#else
        vec3 N = normalize(vN + det * vec3(g1.x, 0., g1.y) * cos(dot(q, g1) * 1.9 - t * 2.3) * 0.06
                              + det * vec3(g2.x, 0., g2.y) * cos(dot(q, g2) * 2.9 - t * 2.9) * 0.045
                              + det * vec3(g3.x, 0., g3.y) * cos(dot(q, g3) * 4.7 - t * 3.6) * 0.03);
#endif
        float sunUp = smoothstep(-0.02, 0.08, uSunW.y);
#ifdef UNDER
        {
          // nhìn từ dưới lên: trong "cửa sổ Snell" (góc < 48,6°) thấy trời sáng; ngoài cửa sổ: phản xạ toàn phần màu nước sâu
          float cs = abs(dot(N, V)), win = smoothstep(0.6, 0.72, cs);
          vec3 sky = mix(uSkyH, uSkyT, 0.45) * 1.15 + uSunC * pow(max(dot(-V, uSunW), 0.), 24.) * 1.4 * sunUp;
          vec3 tir = mix(uDeep * 0.5, uShallow * 0.75, 1. - smoothstep(0.5, 4., depth));
          float sh = (1. - smoothstep(0., 0.07, abs(sin(dot(q, vec2(0.81, 0.59)) * 1.3 + sin(dot(q, vec2(-0.43, 0.9)) * 0.9 + t) * 1.6 + t * 0.7)))) * det * 0.35;   // vân sáng lung linh dạng sợi
          vec3 c = mix(tir, sky, win) + vec3(0.25, 0.35, 0.35) * sh * (0.4 + 0.6 * win);
          gl_FragColor = vec4(c * uLight, 0.92);
        }
#include <fog_fragment>
#else
        float NdV = clamp(dot(N, V), 0., 1.);
        vec3 c = mix(uShallow, uDeep, smoothstep(0.3, 5., depth));
        c = mix(c, uDeep * 0.72, smoothstep(5., 8., depth) * 0.55);         // biển khơi sẫm dần
        float ca = depth > 3. ? 0. : sin(q.x * 0.9 + t * 0.8) * sin(q.y * 0.8 - t * 0.6) + sin((q.x + q.y) * 0.45 + t * 0.5);
        c += vec3(0.1, 0.16, 0.12) * smoothstep(1.0, 1.7, ca) * (1. - smoothstep(0.4, 3., depth));   // vân sáng đáy nước nông
        c += vec3(0.04, 0.16, 0.13) * max(vCrest, 0.) * smoothstep(1., 5., depth);   // ánh xanh ngọc xuyên qua đỉnh sóng
        // phản chiếu bầu trời (Fresnel Schlick): nhìn xiên thấy trời, nhìn thẳng xuống thấy nước
        vec3 R = reflect(-V, N); R.y = abs(R.y);
        vec3 sky = mix(uSkyH, uSkyT, smoothstep(0.02, 0.6, R.y));
        if (uCloudR > 0.01) {   // mây trôi phản chiếu trên mặt nước (chiếu theo tia phản xạ lên vòm trời, gió đẩy chậm)
          vec2 cu = R.xz / (R.y + 0.12) * 0.09 + vec2(t * 0.012, t * 0.005);
          float cn = sin(cu.x * 2.3 + sin(cu.y * 1.7) * 1.6) * sin(cu.y * 2.9 + sin(cu.x * 1.3) * 2.1) + 0.5 * sin(cu.x * 5.1 - cu.y * 3.7);
          sky = mix(sky, mix(vec3(1.), uSkyH, 0.35) * (1. - uNight * 0.85), smoothstep(0.15, 0.95, cn) * smoothstep(0.02, 0.2, R.y) * uCloudR);
        }
        float fres = 0.04 + 0.96 * pow(clamp(1. - NdV, 0., 1.), 5.);   // kẹp: NdV > 1 do sai số → pow(số âm) = NaN
        c = mix(c, sky, min(fres * 0.9, 0.85));
        // bọt: viền sát bờ, dải sóng vỗ chạy dần vào bờ, gợn quanh chân (chỉ tính ở nước nông) · bọt đỉnh sóng (chỉ ở khơi, gần camera)
        float foam = 0.;
        if (depth < 2.6) {
          float br = sin(q.x * 0.37 + sin(q.y * 0.29) * 2.) * sin(q.y * 0.41 - q.x * 0.13);   // làm đứt quãng dải bọt
          foam = step(depth, 0.3) * (0.75 + 0.25 * br);
          float run = fract(depth * 0.618 + t * 0.21 + br * 0.08);           // pha giảm dần theo độ sâu → dải bọt chạy vào bờ
          foam += smoothstep(0.8, 0.95, run) * (1. - smoothstep(0.95, 1., run)) * (1. - smoothstep(0.6, 2.6, depth)) * smoothstep(-0.4, 0.4, br + 0.2);
          float surge = 0.5 + 0.5 * sin(t * 0.9 + q.x * 0.045 + q.y * 0.035);   // đợt sóng dâng rồi rút, để lại viền bọt
          foam += smoothstep(0.14, 0., abs(depth - 0.25 - surge * 0.9)) * (1. - smoothstep(1.1, 1.5, depth)) * (0.4 + 0.6 * step(0.5, fract(q.x * 0.7 + q.y * 0.5 + t * 0.2)));
          float pd = length(q - uPlayer.xz);
          if (pd < 2.6 && uPlayer.y < 0.55 && uPlayer.y > -1.6) foam += smoothstep(0.7, 1., sin(pd * 5.5 - t * 4.5)) * (1. - smoothstep(0.4, 2.6, pd)) * 0.8;
        }
#ifndef LOW
        else if (depth > 3. && dist < 144. && vCrest > 0.35) {
          float cap = sin(dot(q, g1) * 0.9 + sin(dot(q, g2) * 0.37) * 2. + t * 0.6) * sin(dot(q, g3) * 0.53 - t * 0.4);
          foam = smoothstep(0.6, 0.9, vCrest + cap * 0.2) * smoothstep(0.6, 1., cap) * smoothstep(3., 8., depth) * 0.8 * (1. - smoothstep(55., 144., dist));
        }
#endif
        foam = clamp(foam, 0., 1.);
        c = mix(c, vec3(1.), foam * 0.88);
        c *= uLight;
        // nắng: điểm chói + vệt sáng dài trên mặt biển (rõ lúc hoàng hôn) + lấp lánh gần
        float gl = 0.;
#ifndef LOW
        if (dist < 144.) gl = step(0.986, sin(q.x * 2.7 + t * 2.1) * sin(q.y * 3.1 - t * 1.7)) * (1. - smoothstep(34., 144., dist)) * (1. - foam);
#endif
        if (sunUp > 0.) {
          float sd = max(dot(R, uSunW), 0.);
          c += uSunC * (pow(sd, 420.) * 2.4 + pow(sd, 36.) * 0.2 + gl * pow(sd, 5.) * 1.3) * sunUp;
        }
        if (uNight > 0.01) {   // trăng: vệt sáng bạc ban đêm
          float md = max(dot(R, uMoon), 0.) * smoothstep(-0.05, 0.1, uMoon.y);
          c += vec3(0.75, 0.82, 1.) * (pow(md, 300.) * 1.6 + pow(md, 28.) * 0.14 + gl * pow(md, 6.) * 0.5) * uNight;
        }
#ifndef LOW
        if (det > 0.) c += step(0.993, sin(q.x * 1.7 + t * 1.3) * sin(q.y * 1.9 - t * 1.1)) * 0.25 * det * uLight;
#endif
        float alpha = mix(0.4, 0.96, smoothstep(0., 3.4, depth));            // nước nông trong: thấy cát đáy
        alpha = max(mix(alpha, 1., fres * 0.6), foam * 0.92);
        gl_FragColor = vec4(c, alpha);
#ifdef USE_FOG
        {   // biển xa: tan vào màu biển-sương (khớp phần biển vẽ trên vòm trời, sky.js) thay vì xám nhạt; vệt nắng lấp lánh vẫn hiện tới chân trời
          float ff = smoothstep(fogNear, fogFar, vFogDepth);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(fogColor, uSeaTint, 0.382), ff);
          if (sunUp > 0.) { float sd = max(dot(R, uSunW), 0.), tw = step(0.93, sin(q.x * 0.73 + t * 1.9) * sin(q.y * 0.61 - t * 1.6));
            gl_FragColor.rgb += uSunC * pow(sd, 9.) * (0.12 + tw * 0.9) * ff * sunUp * uLight; }
        }
#endif
#endif
      }`,
  });
  U.uH.value = hTex; U.uTime = WIND.uTime; U.uPlayer = WIND.uPlayer;

  // ---------- Lưới vòng đồng tâm: bán kính tăng theo cấp số φ (khoảng cách vòng ∝ bán kính ∝ khoảng cách đỉnh theo góc) ----------
  const AS = CFG.isMobile ? 55 : 89, RMAX = 610, C0 = 1.2;                 // 610 m (Fibonacci) > tầm sương mù
  const m = AS * Math.log(PHI) / (2 * Math.PI), NR = Math.ceil(m * Math.log(1 + RMAX / C0) / Math.log(PHI));
  const pos = [0, 0, 0], idx = [];
  for (let j = 1; j <= NR; j++) {
    const r = Math.min(RMAX, C0 * (PHI ** (j / m) - 1));
    for (let i = 0; i < AS; i++) { const a = i / AS * Math.PI * 2; pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); }
  }
  const at = (j, i) => j === 0 ? 0 : 1 + (j - 1) * AS + (i % AS);
  for (let j = 0; j < NR; j++) for (let i = 0; i < AS; i++) {
    if (j === 0) { idx.push(0, at(1, i + 1), at(1, i)); continue; }
    const a = at(j, i), b = at(j, i + 1), c = at(j + 1, i), d = at(j + 1, i + 1); idx.push(a, b, c, b, d, c);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, mat); mesh.position.y = W; mesh.frustumCulled = false; mesh.name = 'ocean';
  // đi theo camera; trong/dưới nước: đổi mặt vẽ (chỉ mặt trên khi ở trên, chỉ mặt dưới khi lặn)
  mesh.onBeforeRender = (r, s, cam) => {
    mesh.position.x = cam.position.x; mesh.position.z = cam.position.z; mesh.updateMatrixWorld();
    const under = cam.position.y < waveHeight(cam.position.x, cam.position.z);
    mat.side = under ? THREE.BackSide : THREE.FrontSide;
    if (!!mat.defines.UNDER !== under) { if (under) mat.defines.UNDER = 1; else delete mat.defines.UNDER; mat.needsUpdate = true; }   // 2 chương trình riêng: shader trên mặt nước không phải gánh nhánh dưới nước
  };
  scene.add(mesh);
  addEventListener('island:underwater', e => { mesh.visible = !e.detail; });   // lặn: dive.js vẽ mặt nước nhìn từ dưới (cửa sổ Snell) — không vẽ chồng 2 lớp

  // ---------- Độ cao sóng tại (x, z) — cùng công thức shader (bỏ phần tắt dần theo khoảng cách camera) ----------
  function disp(x, z, t, att, out) {
    out[0] = out[1] = out[2] = 0;
    for (let i = 0; i < state.waveN; i++) {
      const v = WAVES[i], A = v.A * att, f = v.k * (v.dx * x + v.dz * z) - v.w * t + v.ph, C = Math.cos(f), QA = v.q * A;
      out[0] += QA * v.dx * C; out[1] += A * Math.sin(f); out[2] += QA * v.dz * C;
    }
    return out;
  }
  const _d = [0, 0, 0];
  const depth = (x, z) => (x < WORLD.x0 || x > WORLD.x1 || z < WORLD.z0 || z > WORLD.z1) ? 8 : Math.min(8, Math.max(0, -heightAt(x, z)));
  function waveHeight(x, z, t = WIND.uTime.value) {
    const att = depthAtt(depth(x, z)) * U.uAmp.value;
    let px = x, pz = z;   // Gerstner dịch đỉnh theo phương ngang → tìm điểm gốc có đỉnh dịch tới (x, z): lặp 2 lần là đủ
    for (let k = 0; k < 2; k++) { disp(px, pz, t, att, _d); px = x - _d[0]; pz = z - _d[2]; }
    return W + disp(px, pz, t, att, _d)[1];
  }
  // pháp tuyến mặt sóng (để thuyền nghiêng theo sóng)
  function waveNormal(x, z, t = WIND.uTime.value, out = new THREE.Vector3()) {
    const e = 0.5, hx = waveHeight(x + e, z, t) - waveHeight(x - e, z, t), hz = waveHeight(x, z + e, t) - waveHeight(x, z - e, t);
    return out.set(-hx, 2 * e, -hz).normalize();
  }
  // mức chất lượng 0..3 (ocean.js): máy yếu dùng 3 sóng; gió mạnh (weather.js → WIND.uWind) sóng cao thêm tới φ lần
  // máy yếu (điện thoại / mức ≥ 2): 3 sóng, bỏ bọt đỉnh sóng, lấp lánh và 2 lớp gợn nhỏ (shader LOW)
  function setQuality(L) {
    const low = L >= 2 || CFG.isMobile; state.waveN = low ? 3 : 5; U.uWaveN.value = state.waveN;
    if (!!mat.defines.LOW !== low) { if (low) mat.defines.LOW = 1; else delete mat.defines.LOW; mat.needsUpdate = true; }
  }
  setQuality(0);
  function update() { U.uAmp.value = state.amp * (1 + (PHI - 1) * WIND.uWind.value); }
  return { mat, mesh, waveHeight, waveNormal, setQuality, update, state };
}
