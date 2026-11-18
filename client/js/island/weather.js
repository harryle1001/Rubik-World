// weather.js — Thời tiết: nắng, mây nhiều, mưa, giông (chớp + sấm), sương mù buổi sớm, gió, cầu vồng sau mưa.
// - Mọi giá trị (mây, mưa, gió, sương, độ ướt) chuyển mượt về giá trị đích của kiểu thời tiết hiện tại.
// - Mưa: 1 LineSegments chạy hoàn toàn trên GPU quanh camera (1 draw call, không tốn CPU); số hạt giảm theo ctx.qualityLevel.
// - Mặt đất ướt sẫm màu + vũng nước loang gợn sóng: vá shader các nền đất (MeshToonMaterial màu theo đỉnh).
// - Âm thanh mưa/gió/sấm tự tổng hợp bằng Web Audio (không dùng file).
// - Gỡ lỗi: ctx.weather.set('clear' | 'cloudy' | 'rain' | 'storm' | 'fog') · ?weather=rain trên URL
import * as THREE from 'three';
import { WIND } from './terrain.js';

// đích của từng kiểu: c mây · r mưa · w gió · f sương · bolt sét
const TYPES = {
  clear:  { c: 0.05, r: 0, w: 0.1, f: 0 },
  cloudy: { c: 0.65, r: 0, w: 0.45, f: 0.05 },
  rain:   { c: 0.85, r: 0.75, w: 0.5, f: 0.25 },
  storm:  { c: 1, r: 1, w: 1, f: 0.35, bolt: true },
  fog:    { c: 0.3, r: 0, w: 0, f: 1 },
};
const NEXT = { clear: [['clear', 3], ['cloudy', 5]], cloudy: [['rain', 4], ['clear', 3], ['storm', 2]], rain: [['clear', 5], ['cloudy', 2], ['storm', 2]], storm: [['rain', 6], ['clear', 3]], fog: [['clear', 1]] };
const FACT = {
  cloudy: '☁️ Mây là hơi nước bốc lên cao, gặp lạnh ngưng tụ thành vô số giọt nước li ti.',
  rain: '🌧️ Giọt nước trong mây nhập lại lớn dần, nặng quá thì rơi xuống thành mưa.',
  storm: '⚡ Mây tích điện → có sấm chớp. Đếm số giây từ lúc thấy chớp đến lúc nghe sấm, nhân 340 m là ra khoảng cách tới tia sét!',
  fog: '🌫️ Sương mù: buổi sớm se lạnh, hơi nước sát mặt đất ngưng tụ thành giọt nhỏ lơ lửng.',
  clear: '☀️ Trời quang: nắng làm nước ao hồ bốc hơi — vòng tuần hoàn của nước lại bắt đầu.',
  rainbow: '🌈 Cầu vồng có 7 màu (đỏ, cam, vàng, lục, lam, chàm, tím) do ánh sáng mặt trời bị khúc xạ qua giọt nước.',
  wind: '🍃 Gió là không khí chuyển động: chỗ nóng không khí bay lên, không khí mát tràn tới thế chỗ.',
};
const NAME = { clear: '☀️ Nắng đẹp', cloudy: '☁️ Trời nhiều mây', rain: '🌧️ Trời mưa', storm: '⛈️ Giông bão', fog: '🌫️ Sương mù' };
const DROPS = [3200, 2200, 1400, 700]; // số hạt mưa theo mức chất lượng
const lerp = (a, b, k) => a + (b - a) * k;

export function createWeather(ctx) {
  const { scene, camera, sky } = ctx;
  const cur = { c: 0, r: 0, w: 0, f: 0, wet: 0, bow: 0 }, st = { type: 'clear', t: 120, flash: 0, boltT: 6, bowT: 0, told: new Set() };
  const fogBase = { near: scene.fog.near, far: scene.fog.far }, grey = new THREE.Color('#8a94a3'), fogGrey = new THREE.Color('#c9d1d8'), white = new THREE.Color('#ffffff');

  // ---------- Mưa: hạt mưa quấn quanh camera, rơi trên GPU ----------
  const N = DROPS[0], a = new Float32Array(N * 2 * 4);
  for (let i = 0; i < N; i++) { const x = Math.random(), z = Math.random(), ph = Math.random(), th = Math.random(); const tq = Math.floor(th * 100) * 2; a.set([x, z, ph, tq], i * 8); a.set([x, z, ph, tq + 1], i * 8 + 4); } // w: ngưỡng(0..99)*2 + (0 đầu / 1 đuôi)
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 2 * 3), 3)); rg.setAttribute('a', new THREE.BufferAttribute(a, 4));
  const RU = { uCam: { value: new THREE.Vector3() }, uTime: { value: 0 }, uRain: { value: 0 }, uWind: { value: new THREE.Vector2() }, uLight: { value: 1 } };
  const rain = new THREE.LineSegments(rg, new THREE.ShaderMaterial({
    uniforms: RU, transparent: true, depthWrite: false, fog: false,
    vertexShader: `uniform vec3 uCam; uniform float uTime, uRain; uniform vec2 uWind; attribute vec4 a; varying float vA;
      void main(){ const float S = 34., H = 22.; float tail = mod(a.w, 2.), th = floor(a.w * .5 + .001) / 100.;
        float fall = fract(a.z - uTime * 0.85);                    // 0..1 trong 1 chu kỳ rơi (~18 m/s)
        vec3 p = vec3(uCam.x + (fract(a.x - uCam.x / S + .5) - .5) * S, uCam.y + (fall - .45) * H, uCam.z + (fract(a.y - uCam.z / S + .5) - .5) * S);
        p.xz += uWind * (fall - .5) * 4.;
        p.y += tail * 0.7; p.xz -= uWind * tail * 0.18;            // vệt mưa nghiêng theo gió
        vA = step(th, uRain) * (0.25 + 0.75 * tail) * smoothstep(0., .15, fall);
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); }`,
    fragmentShader: 'uniform float uLight; varying float vA; void main(){ gl_FragColor = vec4(vec3(0.78,0.84,0.94) * uLight, vA * 0.65); }',
  }));
  rain.frustumCulled = false; rain.visible = false; scene.add(rain);

  // ---------- Tia sét (đường gấp khúc, chỉ hiện 0.2 giây) ----------
  const boltG = new THREE.BufferGeometry(), bp = new Float32Array(16 * 3); boltG.setAttribute('position', new THREE.BufferAttribute(bp, 3));
  const bolt = new THREE.Line(boltG, new THREE.LineBasicMaterial({ color: '#f4f0ff', fog: false, transparent: true })); bolt.frustumCulled = false; bolt.visible = false; scene.add(bolt);

  // ---------- Cầu vồng: vòng cung 42° quanh điểm đối diện mặt trời ----------
  const BOW_D = 300, BOW_R = BOW_D * Math.tan(42 * Math.PI / 180);
  const bowMat = new THREE.ShaderMaterial({
    uniforms: { uA: { value: 0 }, uR: { value: BOW_R } }, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform float uA, uR; varying vec2 vP;
      vec3 hue(float h){ return clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1., 0., 1.); }
      void main(){ float t = (length(vP) - uR * 0.94) / (uR * 0.07);   // 0 = mép trong (tím) .. 1 = mép ngoài (đỏ)
        float edge = smoothstep(0., .15, t) * smoothstep(1., .85, t) * smoothstep(-0.02*uR, 0.25*uR, vP.y);
        gl_FragColor = vec4(hue(0.78 * (1. - t)) * edge * uA * 0.55, 1.); }`,
  });
  const bow = new THREE.Mesh(new THREE.RingGeometry(BOW_R * 0.94, BOW_R * 1.01, 72, 1, 0, Math.PI), bowMat);
  bow.frustumCulled = false; bow.visible = false; bow.renderOrder = 1; scene.add(bow);

  // ---------- Mặt đất ướt + vũng nước (vá shader nền đất) ----------
  const WET = { uWet: { value: 0 }, uRainNow: { value: 0 }, uWT: WIND.uTime, uCloudSh: { value: 0 } }; // uCloudSh: bóng mây trôi trên mặt đất
  const patched = new Set(); let scanT = 0, scans = 0;
  function patchGrounds() {
    scene.traverse(o => {
      const m = o.material; if (!o.isMesh || o.isInstancedMesh || !m || !m.isMeshToonMaterial || !m.vertexColors || patched.has(m) || m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile) return;
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); if (o.geometry.boundingSphere.radius < 18) return;
      patched.add(m);
      m.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, WET);
        sh.vertexShader = 'varying highp vec3 vWP; varying float vUp;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.)).xyz; vUp = normalize(mat3(modelMatrix) * objectNormal).y;');
        sh.fragmentShader = 'uniform float uWet, uRainNow, uCloudSh; uniform highp float uWT; varying highp vec3 vWP; varying float vUp;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
          if (uCloudSh > 0.01) {   // bóng mây: vệt tối mềm trôi theo gió
            vec2 cq = vWP.xz * 0.018 + vec2(uWT * 0.035, uWT * 0.012);
            float cn = sin(cq.x * 1.7 + sin(cq.y * 1.3) * 1.9) * sin(cq.y * 1.9 + sin(cq.x * 0.9) * 2.2);
            diffuseColor.rgb *= 1. - uCloudSh * smoothstep(0.25, 0.6, cn);
          }
          if (uWet > 0.01 && vUp > 0.6) {   // chỉ mặt hướng lên (nền, sân, mái), tường không đọng nước
            float n = sin(vWP.x*0.47 + sin(vWP.z*0.31)*2.1) * sin(vWP.z*0.43 + sin(vWP.x*0.29)*2.3);
            float pud = smoothstep(0.9 - uWet*0.2, 0.93 - uWet*0.2, n*0.5+0.5);
            vec2 q = fract(vWP.xz * 0.6) - 0.5; float rip = sin(length(q) * 38. - uWT * 9. + floor(vWP.x*0.6)*3.7 + floor(vWP.z*0.6)*5.1) * uRainNow;
            diffuseColor.rgb *= 1. - 0.18 * uWet;
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.3, 0.37, 0.46) + rip * 0.035, pud * 0.85 * smoothstep(0.85, 0.97, vUp));
          }`);
      };
      m.customProgramCacheKey = () => 'wet'; m.needsUpdate = true;
    });
  }

  // ---------- Âm thanh tổng hợp: mưa, gió (vòng lặp nhiễu), sấm ----------
  let snd = null;
  function sound() {
    const L = ctx.audio && ctx.audio.listener; if (!L || L.context.state !== 'running') return null;
    if (snd) return snd;
    const ac = L.context, out = L.getInput(), len = ac.sampleRate * 3, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    let br = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; br = (br + 0.02 * w) / 1.02; d[i] = w * 0.6 + br * 3; } // trắng + nâu
    const loop = (type, f, q) => { const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = buf; s.loop = true; s.loopStart = 0; fl.type = type; fl.frequency.value = f; fl.Q.value = q; g.gain.value = 0; s.connect(fl).connect(g).connect(out); s.start(0, Math.random() * 2); return { g, fl }; };
    snd = { ac, out, rain: loop('bandpass', 2600, 0.5), rainLow: loop('lowpass', 500, 0.7), wind: loop('lowpass', 380, 4) };
    return snd;
  }
  function thunder(delay, dist) {
    const S = sound(); if (!S) return; const { ac, out } = S, t = ac.currentTime + delay, n = ac.sampleRate * 4 | 0, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    let br = 0; for (let i = 0; i < n; i++) { br = (br + 0.05 * (Math.random() * 2 - 1)) / 1.05; d[i] = br * 6 * (1 + 0.6 * Math.sin(i / ac.sampleRate * 9)); }
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), v = Math.max(0.25, 1 - dist / 900);
    s.buffer = b; f.type = 'lowpass'; f.frequency.value = 160 + 500 * v; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.9 * v, t + 0.05); g.gain.exponentialRampToValueAtTime(0.35 * v, t + 0.8); g.gain.exponentialRampToValueAtTime(0.001, t + 3.8);
    s.connect(f).connect(g).connect(out); s.start(t);
  }

  // ---------- Đổi kiểu thời tiết ----------
  function set(type, quiet) {
    if (!TYPES[type]) return; const was = st.type; st.type = type; st.t = 70 + Math.random() * 80;
    if ((was === 'rain' || was === 'storm') && (type === 'clear' || type === 'cloudy')) st.bowT = 45; // mưa tạnh → có thể có cầu vồng
    if (quiet || !ctx.toast) return;
    ctx.toast(`${NAME[type]}<br><small>${FACT[type]}</small>`, 6000);
  }
  function pick() {
    const h = sky.state.hour; if (st.type === 'clear' && h > 4.8 && h < 7.5 && Math.random() < 0.7) return 'fog'; // sương sớm
    const list = NEXT[st.type]; let s = list.reduce((a, [, w]) => a + w, 0) * Math.random(); for (const [k, w] of list) if ((s -= w) <= 0) return k; return 'clear';
  }
  const q = new URLSearchParams(location.search).get('weather'); if (TYPES[q]) { set(q, true); Object.assign(cur, TYPES[q]); }

  // ---------- Mỗi khung hình (gọi SAU sky.update) ----------
  const tmp = new THREE.Vector3(), anti = new THREE.Vector3();
  function update(dt, t) {
    if ((st.t -= dt) <= 0) set(pick());
    const T = TYPES[st.type], k = Math.min(1, dt / 8), kr = Math.min(1, dt / 5);
    cur.c = lerp(cur.c, T.c, k); cur.r = lerp(cur.r, T.r, kr); cur.w = lerp(cur.w, T.w, k); cur.f = lerp(cur.f, T.f, Math.min(1, dt / 12));
    cur.wet = cur.r > 0.15 ? Math.min(1, cur.wet + dt / 25 * cur.r) : Math.max(0, cur.wet - dt / 90);
    const L = ctx.qualityLevel || 0, S = sky, day = 1 - S.state.night;

    // ánh sáng & màu trời (sky.js vừa đặt theo giờ, ở đây chỉ phủ thêm thời tiết)
    S.sun.intensity *= 1 - 0.6 * cur.c; S.hemi.intensity *= 1 + 0.15 * cur.c * day; // trời âm u: nắng yếu nhưng ánh sáng tán xạ từ mây bù lại (không quá tối cho trẻ)
    S.U.uTop.value.lerp(grey, cur.c * 0.6 * day); S.U.uHor.value.lerp(grey, cur.c * 0.45 * day); S.U.uSunCol.value.multiplyScalar(1 - cur.c * 0.9);
    S.cloudMat.color.copy(S.state.cloudTint).multiplyScalar(1 - cur.c * 0.45); S.cloudMat.emissiveIntensity *= 1 - cur.c * 0.6;
    const nVis = Math.round(5 + cur.c * 9); S.clouds.children.forEach((c, i) => { c.visible = i < nVis; c.position.x += cur.w * 5 * dt; });
    // sương mù: kéo gần + màu xám nhạt
    scene.fog.near = lerp(lerp(fogBase.near, 45, cur.c * 0.5 + cur.r * 0.3), 6, cur.f); scene.fog.far = lerp(lerp(fogBase.far, 200, cur.r), 75, cur.f);
    scene.fog.color.lerp(fogGrey, Math.max(cur.f * 0.8, cur.r * 0.4) * day);

    // gió → cây cỏ lay mạnh hơn
    WIND.uWind.value = cur.w;
    if (cur.w > 0.6 && !st.told.has('wind')) { st.told.add('wind'); ctx.toast && st.type !== 'storm' && ctx.toast(FACT.wind, 5000); }

    // mưa
    rain.visible = cur.r > 0.01; RU.uRain.value = cur.r; RU.uTime.value = t; RU.uCam.value.copy(camera.position); RU.uLight.value = 0.45 + 0.55 * day;
    RU.uWind.value.set(WIND.uGust.value.x, WIND.uGust.value.y).multiplyScalar(cur.w * 2.2 * (1 + WIND.uGust.value.z * 0.5)); // hướng gió + cơn giật (living.js) rg.setDrawRange(0, DROPS[L] * 2);
    WET.uWet.value = cur.wet; WET.uRainNow.value = cur.r; WET.uCloudSh.value = (ctx.qualityLevel || 0) >= 3 ? 0 : day * (1 - S.state.low * 0.6) * (0.1 + cur.c * 0.22) * (1 - cur.r * 0.8);
    if ((scanT -= dt) <= 0 && scans < 25) { scanT = 3; scans++; patchGrounds(); } // nền thị trấn dựng sau → quét vài lần

    // giông: chớp lóe + sấm đến muộn theo khoảng cách (ánh sáng nhanh hơn âm thanh)
    if (T.bolt && cur.c > 0.8 && (st.boltT -= dt) <= 0) {
      st.boltT = 4 + Math.random() * 9; st.flash = 1;
      const ang = Math.random() * 6.283, dist = 120 + Math.random() * 220, bx = camera.position.x + Math.cos(ang) * dist, bz = camera.position.z + Math.sin(ang) * dist;
      for (let i = 0; i < 16; i++) { const y = 90 - i * 6; bp.set([bx + (Math.random() - 0.5) * 10 + i * 0.6, y, bz + (Math.random() - 0.5) * 10], i * 3); }
      boltG.attributes.position.needsUpdate = true; bolt.visible = true;
      thunder(dist / 340, dist);
    }
    if (st.flash > 0) {
      const f = st.flash * (0.6 + 0.4 * Math.sin(st.flash * 40)); S.hemi.intensity += f * 2.2; S.U.uTop.value.lerp(white, f * 0.5); S.U.uHor.value.lerp(white, f * 0.6);
      st.flash = Math.max(0, st.flash - dt * 4); if (st.flash < 0.6) bolt.visible = false;
    }

    // cầu vồng: sau mưa, khi mặt trời còn cao và trời đã quang
    const sunUp = S.U.uSun.value.y > 0.05; // (thật ra cầu vồng chỉ thấy khi mặt trời thấp < 42°; ở đây nâng cung lên cho dễ thấy)
    if (st.bowT > 0) st.bowT -= dt;
    const wantBow = st.bowT > 0 && sunUp && cur.r < 0.25 && cur.c < 0.7 ? 1 : 0;
    cur.bow = lerp(cur.bow, wantBow, Math.min(1, dt / 4));
    bow.visible = cur.bow > 0.01;
    if (bow.visible) {
      anti.copy(S.U.uSun.value).negate(); anti.y = Math.max(anti.y, -0.3); anti.normalize(); bow.position.copy(camera.position).addScaledVector(anti, BOW_D); bow.lookAt(camera.position); bowMat.uniforms.uA.value = cur.bow * day;
      if (cur.bow > 0.6 && !st.told.has('bow')) { st.told.add('bow'); ctx.toast && ctx.toast(FACT.rainbow, 7000); }
    }
    if (st.bowT <= 0) st.told.delete('bow');

    // âm thanh
    const A = sound();
    if (A) {
      const now = A.ac.currentTime, p = ctx.player && ctx.player.pos, under = p && ctx.grid && ctx.grid.near(p.x, p.z).boxes.some(b => p.x > b.x0 && p.x < b.x1 && p.z > b.z0 && p.z < b.z1 && b.top > p.y + 1.5) ? 0.5 : 1; // dưới mái: tiếng mưa nhỏ hơn
      A.rain.g.gain.setTargetAtTime(cur.r * 0.22 * under, now, 0.4); A.rainLow.g.gain.setTargetAtTime(cur.r * 0.12, now, 0.4);
      A.wind.g.gain.setTargetAtTime(cur.w * cur.w * 0.18 * (0.7 + 0.3 * Math.sin(t * 0.7)), now, 0.5); A.wind.fl.frequency.setTargetAtTime(260 + 260 * cur.w + 120 * Math.sin(t * 0.43), now, 0.5);
    }
  }
  return { update, set, cur, st, get type() { return st.type; } };
}
