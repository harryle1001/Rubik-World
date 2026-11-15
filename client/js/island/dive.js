// dive.js — Bơi & lặn biển: bơi trên mặt nước (nổi theo sóng), lặn xuống đáy, dưỡng khí, bong bóng, bọt nước,
// góc nhìn dưới nước (sương lam theo độ sâu, mặt nước nhìn từ dưới có "cửa sổ Snell", vệt nắng, caustics trên đáy), âm thanh dưới nước.
// Phím: Q / Shift lặn xuống · Space nổi lên · nút 🤿 / ⬆ trên điện thoại. Hết dưỡng khí → tự nổi lên (an toàn, không "chết").
// Đặt ctx.underwater (camera dưới nước), ctx.dive = { swimming, diving, depth, oxygen 0..1, maxOxygen (giây) }; phát 'island:underwater'.
import * as THREE from 'three';
import { CFG } from './config.js';
import { PHI } from './layout.js';
import { WIND } from './terrain.js';
import { T, damp } from './motion.js';

const W = CFG.island.waterLevel, P = CFG.player;
const SWIM_IN = 0.9, SWIM_OUT = 0.75;            // vào/ra trạng thái bơi theo độ sâu (trễ để không chập chờn)
const SPEED = P.walk / PHI;                      // bơi chậm hơn đi bộ 1/φ (≈ 3,4 m/s)
const VSPD = PHI ** 2;                           // lặn/nổi ≈ 2,6 m/s
const CAM_DIVE = 8, CAM_SWIM = 13;               // khoảng cách camera (Fibonacci) khi lặn / bơi
const FOG_DEEP = 21;                             // sâu 21 m (Fibonacci) thì sương tối hẳn
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;

// Texture caustics 128 px (Worley F2−F1, lặp liền mạch) → mạng vệt sáng lung linh
function causticTex() {
  const N = 128, G = 6, pts = [], d = new Uint8Array(N * N * 4);
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) pts.push([(i + Math.random()) / G, (j + Math.random()) / G]);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = (x + 0.5) / N, v = (y + 0.5) / N, ci = Math.floor(u * G), cj = Math.floor(v * G); let f1 = 9, f2 = 9;
    for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) {
      const ii = (ci + a + G) % G, jj = (cj + b + G) % G, p = pts[jj * G + ii], px = p[0] + Math.floor((ci + a) / G), py = p[1] + Math.floor((cj + b) / G);
      const dx = u - px, dy = v - py, dd = Math.sqrt(dx * dx + dy * dy); if (dd < f1) { f2 = f1; f1 = dd; } else if (dd < f2) f2 = dd;
    }
    const e = Math.pow(clamp(1 - (f2 - f1) * G * 2.2, 0, 1), 3) * 255, k = (y * N + x) * 4; d[k] = d[k + 1] = d[k + 2] = e; d[k + 3] = 255;
  }
  const t = new THREE.DataTexture(d, N, N); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true; return t;
}

export function createDive(ctx) {
  const { scene, camera, terrain } = ctx, pl = ctx.player;
  const surf = (x, z) => terrain.waveHeight ? terrain.waveHeight(x, z, WIND.uTime.value) : W;   // mặt nước (theo sóng nếu phiên biển có)
  const floorAt = (x, z) => Math.max(terrain.heightAt(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, 99) : -99);
  const S = ctx.dive = {
    swimming: false, diving: false, depth: 0, oxygen: 1, maxOxygen: 21,   // maxOxygen: 21 s (Fibonacci) — nâng cấp bằng ống thở/bình khí sau
    speed: SPEED, camAdd: 0, ceil: 99,
  };
  ctx.underwater = false;
  let vV = 0, forceUp = false, lowWarned = false, tipShown = false, pitch = 0, bob = 0, sinceSplash = 9;
  const pitchSt = { v: 0 }, ySt = { v: 0 }, ceilSt = { v: 0 };

  // ---------- Điều khiển ----------
  const keys = new Set(), held = { down: false, up: false };
  addEventListener('keydown', e => { if (!/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) keys.add(e.code); });
  addEventListener('keyup', e => keys.delete(e.code)); addEventListener('blur', () => keys.clear());
  const ui = id => document.getElementById(id);
  const hold = (id, k) => { const b = ui(id); if (!b) return; b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); held[k] = true; }); for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => { held[k] = false; }); };
  hold('bDive', 'down'); hold('bSurf', 'up');
  const wantDown = () => held.down || keys.has('KeyQ') || keys.has('ShiftLeft') || keys.has('ShiftRight');
  const wantUp = () => held.up || keys.has('Space');

  // ---------- HUD ----------
  const o2 = ui('o2'), o2f = ui('o2f');
  let uiKey = '';
  function setUI() {
    const k = `${S.swimming}|${S.diving}`; if (k === uiKey) return; uiKey = k;
    const V = pl.vehicle;
    if (ui('bDive')) ui('bDive').hidden = !S.swimming;
    if (ui('bSurf')) ui('bSurf').hidden = !S.diving;
    if (!V) { ui('bJump').hidden = ui('bRun').hidden = S.swimming; }
  }
  function hud(dt) {
    if (!o2) return;
    const show = S.diving || S.oxygen < 0.999; o2.classList.toggle('on', show);
    o2f.style.transform = `scaleX(${S.oxygen.toFixed(3)})`;
    o2.classList.toggle('low', S.diving && S.oxygen < 1 / PHI ** 3);
  }

  // ---------- Bong bóng khí + bọt nước (1 Points, 1 draw call) ----------
  const NB = 89, bg = new THREE.BufferGeometry(), bp = new Float32Array(NB * 3), bl = new Float32Array(NB), bk = new Float32Array(NB), bv = new Float32Array(NB * 3);
  bg.setAttribute('position', new THREE.BufferAttribute(bp, 3)); bg.setAttribute('life', new THREE.BufferAttribute(bl, 1)); bg.setAttribute('kind', new THREE.BufferAttribute(bk, 1));
  const bubbles = new THREE.Points(bg, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    vertexShader: 'attribute float life, kind; varying float vL, vK; void main(){ vL = life; vK = kind; vec4 mv = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mv; gl_PointSize = mix(70., 150. * (1.5 - life * 0.5), kind) / -mv.z * step(0.001, life); }',
    fragmentShader: 'varying float vL, vK; void main(){ float d = length(gl_PointCoord - .5); float ring = smoothstep(.5, .4, d) * (.3 + .7 * smoothstep(.22, .42, d)) + smoothstep(.2, .05, length(gl_PointCoord - vec2(.36, .34))) * .8; float foam = smoothstep(.5, .12, d); vec3 c = mix(vec3(.82, .97, 1.), vec3(1.), vK); gl_FragColor = vec4(c, mix(ring * .85, foam * .75 * vL, vK) * min(1., vL * 3.)); }',
  }));
  bubbles.frustumCulled = false; scene.add(bubbles); let bi = 0, bubT = 0, foamT = 0;
  const emit = (x, y, z, kind, vx, vy, vz) => { const i = bi++ % NB; bp.set([x, y, z], i * 3); bv.set([vx, vy, vz], i * 3); bl[i] = 1; bk[i] = kind; };
  const splash = (n, x, z, up) => { const y = surf(x, z) + 0.05; for (let k = 0; k < n; k++) { const a = Math.random() * 6.283, r = Math.random(); emit(x, y, z, 1, Math.cos(a) * (1 + r * 2), up * (0.5 + Math.random()), Math.sin(a) * (1 + r * 2)); } };

  // ---------- Mặt nước nhìn từ dưới lên (cửa sổ Snell: nhìn gần thẳng đứng thấy trời sáng, xiên thì phản xạ toàn phần) ----------
  const UU = { uFog: { value: new THREE.Color() }, uSky: { value: new THREE.Color() }, uSun: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uTime: WIND.uTime, uFar: { value: 34 } };
  const under = new THREE.Mesh(new THREE.PlaneGeometry(220, 220, 1, 1).rotateX(Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: UU, fog: false,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
    fragmentShader: `uniform vec3 uFog, uSky, uSun, uSunDir; uniform float uTime, uFar; varying vec3 vW;
      void main(){ vec3 V = normalize(vW - cameraPosition);
        float rip = sin(vW.x * 1.3 + uTime * 1.1) * sin(vW.z * 1.1 - uTime * 0.9) + 0.5 * sin((vW.x - vW.z) * 2.3 + uTime * 1.7);
        float win = smoothstep(0.6, 0.74, V.y + rip * 0.025);                       // góc tới hạn ≈ 48,6° (cos ≈ 0,66)
        vec3 c = mix(uFog * 1.25, uSky * (1.05 + rip * 0.06), win);
        c += uSun * pow(max(dot(V, uSunDir), 0.), 18.) * win * 1.4;
        c = mix(c, uFog, smoothstep(uFar * 0.3, uFar, length(vW - cameraPosition)) * (1. - win * 0.6));
        gl_FragColor = vec4(c, 1.); }`,
  }));
  under.visible = false; under.frustumCulled = false; scene.add(under);

  // ---------- Caustics: lưới 34×34 (Fibonacci) ôm theo đáy biển quanh người chơi, cộng sáng (additive) ----------
  const CN = 34, CS = PHI, cGeo = new THREE.PlaneGeometry(CN * CS, CN * CS, CN - 1, CN - 1).rotateX(-Math.PI / 2), cPos = cGeo.attributes.position;
  const cDep = new Float32Array(cPos.count); cGeo.setAttribute('dep', new THREE.BufferAttribute(cDep, 1));
  const CU = { uTex: { value: causticTex() }, uTime: WIND.uTime, uA: { value: 1 }, uFar: { value: 34 } };
  const caustic = new THREE.Mesh(cGeo, new THREE.ShaderMaterial({
    uniforms: CU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: 'attribute float dep; varying vec3 vW; varying float vD; void main(){ vD = dep; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
    fragmentShader: `uniform sampler2D uTex; uniform float uTime, uA, uFar; varying vec3 vW; varying float vD;
      void main(){ vec2 p = vW.xz;
        float a = texture2D(uTex, p * 0.21 + vec2(uTime * 0.03, uTime * 0.019)).r, b = texture2D(uTex, p * 0.16 - vec2(uTime * 0.024, -uTime * 0.027)).r;
        float k = min(a, b) * 0.9 + a * b * 0.35;
        float fade = smoothstep(0.25, 1.2, vD) * (1. - smoothstep(4., 24., vD)) * (1. - smoothstep(uFar * 0.35, uFar * 0.9, length(vW - cameraPosition)));
        gl_FragColor = vec4(vec3(0.75, 1., 0.95) * k * fade * uA, 1.); }`,
  }));
  caustic.visible = false; caustic.frustumCulled = false; caustic.renderOrder = 1; scene.add(caustic);
  const cAt = new THREE.Vector2(1e9, 1e9);
  function relayCaustic(x, z) {   // dựng lại độ cao lưới khi người chơi đi xa > 8 m
    const sx = Math.round(x / CS) * CS, sz = Math.round(z / CS) * CS; cAt.set(sx, sz);
    for (let i = 0; i < cPos.count; i++) { const px = cPos.getX(i) + sx, pz = cPos.getZ(i) + sz, h = floorAt(px, pz); cPos.setY(i, h + 0.04); cDep[i] = W - h; }
    caustic.position.set(sx, 0, sz); cPos.needsUpdate = true; cGeo.attributes.dep.needsUpdate = true;
  }

  // ---------- Vệt nắng xiên từ mặt nước (8 dải billboard, InstancedMesh → 1 draw call) ----------
  const NR = 8, rayGeo = new THREE.PlaneGeometry(1, 1).translate(0, -0.5, 0);
  const RU = { uTime: WIND.uTime, uA: { value: 0 }, uLean: { value: new THREE.Vector3() }, uCol: { value: new THREE.Color('#d6fff4') } };
  const rays = new THREE.InstancedMesh(rayGeo, new THREE.ShaderMaterial({
    uniforms: RU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
    vertexShader: `uniform vec3 uLean; varying vec2 vUv; varying float vF, vS;
      void main(){ vec3 c = (modelMatrix * instanceMatrix * vec4(0., 0., 0., 1.)).xyz; float w = length(instanceMatrix[0].xyz), h = length(instanceMatrix[1].xyz);
        vec3 t = cameraPosition - c; t.y = 0.; vec3 r = normalize(vec3(t.z, 0., -t.x) + 1e-4);
        vec3 p = c + r * position.x * w * (1. - position.y * 0.6) + vec3(0., position.y * h, 0.) - uLean * position.y * h;
        vUv = vec2(position.x + .5, -position.y); vS = c.x * 0.37 + c.z * 0.61;
        float d = length(p - cameraPosition); vF = smoothstep(1.5, 6., d) * (1. - smoothstep(18., 34., d));
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); }`,
    fragmentShader: `uniform float uTime, uA; uniform vec3 uCol; varying vec2 vUv; varying float vF, vS;
      void main(){ float s = sin(3.1416 * vUv.x); float a = pow(1. - vUv.y, 1.618) * s * s * (0.55 + 0.45 * sin(uTime * 0.7 + vS)) * vF * uA;
        gl_FragColor = vec4(uCol * a, 1.); }`,
  }), NR);
  rays.visible = false; rays.frustumCulled = false; rays.renderOrder = 2; scene.add(rays);
  const rayPos = Array.from({ length: NR }, () => new THREE.Vector3(1e9, 0, 0)), _m = new THREE.Matrix4();
  function placeRays(px, pz) {
    for (let i = 0; i < NR; i++) {
      const r = rayPos[i]; if (Math.hypot(r.x - px, r.z - pz) < 26) continue;
      const a = Math.random() * 6.283, d = 4 + Math.random() * 18; r.set(px + Math.cos(a) * d, W, pz + Math.sin(a) * d);
      _m.makeScale(0.8 + Math.random() * 2.2, 13 + Math.random() * 8, 1).setPosition(r); rays.setMatrixAt(i, _m);
    }
    rays.instanceMatrix.needsUpdate = true;
  }

  // ---------- Âm thanh dưới nước: lọc thấp toàn bộ âm thanh + tiếng ù nhẹ tự tổng hợp ----------
  let lp = null, hum = null, humG = null;
  function audioUnder(on) {
    const L = ctx.audio && ctx.audio.listener; if (!L) return;
    const ac = L.context;
    if (!lp) { lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 0.7; }
    if (on) { try { L.setFilter(lp); } catch (e) {} } else if (L.getFilter()) { try { L.removeFilter(); } catch (e) {} }
    if (on && !hum && ac.state === 'running') {   // tiếng ù: nhiễu nâu 2 s lặp
      const n = ac.sampleRate * 2, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); let last = 0;
      for (let i = 0; i < n; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
      hum = ac.createBufferSource(); hum.buffer = b; hum.loop = true; humG = ac.createGain(); humG.gain.value = 0;
      hum.connect(humG); humG.connect(L.getInput()); hum.start();
    }
    if (humG) humG.gain.setTargetAtTime(on ? 0.22 : 0, ac.currentTime, 0.4);
  }

  // ---------- Vật lý bơi/lặn: player.js gọi thay cho trọng lực. Trả về true nếu đang bơi ----------
  S.step = (dt, g) => {
    const p = pl.pos, V = pl.vehicle;
    if (V || pl.frozen && !S.swimming) { S.swimming = S.diving = false; return false; }
    const sy = surf(p.x, p.z), depth = sy - g; S.depth = Math.max(0, sy - p.y);
    if (!S.swimming) {
      if (depth < SWIM_IN || p.y > sy - 0.15) return false;
      S.swimming = true; vV = 0; ySt.v = 0;
      if (pl.vy < -4 || sinceSplash > 1) { splash(pl.vy < -4 ? 21 : 8, p.x, p.z, pl.vy < -4 ? 3 : 1.2); ctx.sfx && ctx.sfx('land'); }
      sinceSplash = 0;
      if (!tipShown) { tipShown = true; ctx.toast && ctx.toast(`🏊 Đang bơi! ${CFG.isMobile ? 'Giữ 🤿 để lặn, ⬆ để nổi' : 'Giữ Q/Shift để lặn, Space để nổi'}.<br>🦺 Ngoài đời, chỉ bơi khi có người lớn và áo phao nhé!`, 5500); }
    } else if (depth < SWIM_OUT && !S.diving) { S.swimming = false; return false; }   // lên bờ: đi bộ lại
    // giới hạn trong phạm vi bản đồ
    p.x = clamp(p.x, -320, 335); p.z = clamp(p.z, -320, 320);
    const low = g + 0.35;   // không xuyên đáy
    if (!S.diving) {
      if (wantDown() && !forceUp && S.oxygen > 0.1 && depth > 1.6) { S.diving = true; vV = -VSPD * 0.6; ctx.sfx && ctx.sfx('jump'); splash(5, p.x, p.z, 0.8); }
      else {   // nổi trên mặt: bơi nằm ngang (đầu nhô lên), đứng yên thì đạp nước (người thẳng, chỉ đầu trên mặt nước)
        const s = clamp(pl.speed / (SPEED * 0.6), 0, 1), ty = Math.max(low, sy - lerp(1.35, 0.3, s));
        p.y = damp(p.y, ty, ySt, T.soft, dt); return true;
      }
    }
    // đang lặn: giữ lặn → xuống, giữ nổi (hoặc hết khí) → lên, thả tay → lơ lửng (hơi nổi)
    const tv = forceUp ? VSPD * 1.2 : wantUp() ? VSPD : wantDown() ? -VSPD : 0.18;
    vV += (tv - vV) * (1 - Math.exp(-dt * PHI ** 3)); p.y += vV * dt;
    if (p.y < low) { p.y = low; vV = Math.max(0, vV); }
    if (p.y >= sy - 0.3 && vV >= 0) {   // trồi lên mặt nước
      p.y = sy - 0.3; S.diving = false; forceUp = false; vV = 0; ySt.v = 0; splash(8, p.x, p.z, 1.5);
    }
    if (S.diving && depth < SWIM_OUT) { S.diving = false; }
    return true;
  };

  // ---------- Mỗi khung hình (sau ambience): dưỡng khí, tư thế, hiệu ứng, góc nhìn dưới nước ----------
  const fogC = new THREE.Color(), shallow = new THREE.Color('#39c6b8'), deep = new THREE.Color('#0a3557'), night = new THREE.Color('#06152a'), _c = new THREE.Color();
  let saved = null;
  S.update = dt => {
    const p = pl.pos, t = WIND.uTime.value; sinceSplash += dt;
    if (pl.vehicle) S.swimming = S.diving = false;
    // dưỡng khí: giảm khi lặn, hồi nhanh (~3 s) khi nổi; hết → tự nổi lên
    if (S.diving) {
      S.oxygen = Math.max(0, S.oxygen - dt / S.maxOxygen);
      if (S.oxygen < 1 / PHI ** 3 && !lowWarned) { lowWarned = true; ctx.toast && ctx.toast('🫧 Sắp hết dưỡng khí — Nổi lên thở nào!', 2600); }
      if (S.oxygen <= 0 && !forceUp) { forceUp = true; ctx.toast && ctx.toast('🫧 Hết dưỡng khí: tự nổi lên mặt nước để thở.', 2600); }
    } else { S.oxygen = Math.min(1, S.oxygen + dt / 3); if (S.oxygen > 1 / PHI) lowWarned = false; }
    setUI(); hud(dt);

    // camera: lặn → gần (8 m), bơi → 13 m; trần camera dưới mặt nước khi lặn (không ló lên trên)
    const cd = pl.cam.dist; S.camAdd = S.diving ? CAM_DIVE - cd : S.swimming ? Math.min(cd, CAM_SWIM) - cd : 0;
    if (S.diving) { if (S.ceil > 50) { S.ceil = camera.position.y; ceilSt.v = 0; } S.ceil = damp(S.ceil, W - 0.45, ceilSt, T.slow, dt); } else S.ceil = 99;

    // tư thế: nằm ngang khi bơi, chúc đầu khi lặn xuống, ngửa lên khi nổi; nhấp nhô nhẹ
    const sw = clamp(pl.speed / (SPEED * 0.6), 0, 1);
    const tp = !S.swimming ? 0 : S.diving ? 1.45 - clamp(vV / VSPD, -1, 1) * 0.45 : lerp(0.18, 1.3, sw);
    pitch = damp(pitch, tp, pitchSt, T.soft, dt); bob += dt * (1.6 + sw * 2.4);
    const hero = pl.hero, body = pl.root.children[0];
    if (pitch > 0.01) {   // xoay quanh hông (cao 0,9 m) thay vì quanh bàn chân
      const roll = S.swimming ? Math.sin(bob) * 0.12 * sw : 0, cy = 0.9;
      const oy = (S.swimming && !S.diving ? Math.sin(bob * 0.5) * 0.04 : 0) + cy - cy * Math.cos(pitch), oz = -cy * Math.sin(pitch);
      if (hero) { const m = hero.model; m.rotation.x = pitch; m.rotation.z = roll; m.position.y += oy; m.position.z += oz; }
      body.rotation.x = pitch; body.rotation.z = roll; body.position.y += oy; body.position.z = oz;
    } else if (body.position.z) { body.position.z = 0; body.rotation.z = 0; }

    // bong bóng khi lặn, bọt nước khi bơi
    if (S.diving && (bubT -= dt) <= 0) { bubT = 0.25 + Math.random() * 0.5; const n = 1 + (Math.random() * 3 | 0), hx = p.x + Math.sin(pl.rot) * 0.8, hz = p.z + Math.cos(pl.rot) * 0.8; for (let k = 0; k < n; k++) emit(hx + (Math.random() - .5) * 0.2, p.y + 0.4 + k * 0.15, hz + (Math.random() - .5) * 0.2, 0, 0, 1.1 + Math.random() * 0.6, 0); }
    if (S.swimming && !S.diving && pl.speed > 0.6 && (foamT -= dt) <= 0) { foamT = 0.07; const bx = p.x - Math.sin(pl.rot) * 0.6, bz = p.z - Math.cos(pl.rot) * 0.6; emit(bx + (Math.random() - .5) * 0.6, surf(bx, bz) + 0.04, bz + (Math.random() - .5) * 0.6, 1, (Math.random() - .5) * 0.8, 0, (Math.random() - .5) * 0.8); }
    for (let i = 0; i < NB; i++) if (bl[i] > 0) {
      const j = i * 3; bp[j] += bv[j] * dt; bp[j + 1] += bv[j + 1] * dt; bp[j + 2] += bv[j + 2] * dt;
      if (bk[i] === 0) { bp[j] += Math.sin(t * 7 + i) * 0.004; bl[i] -= dt * 0.12; if (bp[j + 1] > surf(bp[j], bp[j + 2]) - 0.05) bl[i] = 0; }
      else { bv[j + 1] -= 9 * dt; const sy = surf(bp[j], bp[j + 2]) + 0.04; if (bp[j + 1] < sy) { bp[j + 1] = sy; bv[j + 1] = 0; bv[j] *= 0.96; bv[j + 2] *= 0.96; } bl[i] -= dt * 0.8; }
      if (bl[i] < 0) bl[i] = 0;
    }
    bg.attributes.position.needsUpdate = bg.attributes.life.needsUpdate = bg.attributes.kind.needsUpdate = true;

    // ---------- Góc nhìn dưới nước ----------
    const cs = surf(camera.position.x, camera.position.z), uw = camera.position.y < cs - 0.05;
    if (uw !== ctx.underwater) {
      ctx.underwater = uw; dispatchEvent(new CustomEvent('island:underwater', { detail: uw }));
      under.visible = caustic.visible = rays.visible = uw; audioUnder(uw);
      const G = ctx.post && ctx.post.grade;
      if (uw) { saved = { amt: G ? G.uAmt.value : 0, far: camera.far }; cAt.set(1e9, 1e9); for (const r of rayPos) r.x = 1e9; }
      else if (saved) { if (G) G.uAmt.value = saved.amt; camera.far = saved.far; camera.updateProjectionMatrix(); }
    }
    if (!uw) return;
    const sky = ctx.sky, nt = sky ? sky.state.night : 0, day = 1 - nt;
    const d = Math.max(0, cs - camera.position.y), k = clamp(d / FOG_DEEP, 0, 1);
    fogC.copy(shallow).lerp(deep, Math.pow(k, 0.7)).lerp(night, nt * 0.85);
    const F = scene.fog; F.color.copy(fogC); F.near = 0.5; F.far = lerp(40, 25, k) * (1 - nt * 0.3);
    if (sky) { sky.U.uTop.value.copy(fogC); sky.U.uHor.value.copy(fogC); sky.U.uSunCol.value.setRGB(0, 0, 0); sky.U.uNight.value = 0; }
    UU.uFog.value.copy(fogC); UU.uFar.value = F.far;
    const far = Math.ceil(F.far + 8); if (camera.far !== far) { camera.far = far; camera.updateProjectionMatrix(); }   // cắt xa theo sương → bớt draw call
    UU.uSky.value.copy(shallow).lerp(_c.set('#e8fffb'), 0.55 * (1 - k)).multiplyScalar(lerp(1, 0.35, nt)).lerp(fogC, k * 0.6);
    if (sky) { UU.uSunDir.value.copy(sky.state.sunDir); UU.uSun.value.copy(sky.sun.color).multiplyScalar(day * (1 - k)); }
    under.position.set(camera.position.x, cs - 0.02, camera.position.z);
    if (Math.abs(p.x - cAt.x) > 8 || Math.abs(p.z - cAt.y) > 8) relayCaustic(p.x, p.z);
    CU.uA.value = day * (0.55 + 0.45 * (1 - k)); CU.uFar.value = F.far;
    placeRays(p.x, p.z); RU.uA.value = 0.22 * day * (1 - k * 0.7);
    if (sky) RU.uLean.value.set(sky.state.sunDir.x, 0, sky.state.sunDir.z).multiplyScalar(-0.35 / Math.max(0.3, sky.state.sunDir.y));
    // chỉnh màu hậu kỳ (dùng pass màu sẵn có): ngả lam-ngọc, giảm bão hoà, vignette đậm hơn khi sâu
    const G = ctx.post && ctx.post.grade;
    if (G) {
      G.uGain.value.set(0.82, 0.98, 1.02).multiplyScalar(lerp(1.05, 0.8, k)); G.uLift.value.set(0.0, 0.012, 0.025).multiplyScalar(1 - k);
      G.uSat.value = lerp(0.95, 0.78, k); G.uCon.value = 1.0; G.uAmt.value = lerp(0.3, 0.5, k); G.uRays.value = 0.5 * day * (1 - k);
    }
  };
  return S;
}
