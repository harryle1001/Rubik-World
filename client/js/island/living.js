// living.js — Thế giới sống động (nhẹ cho điện thoại, hiệu ứng chạy trên GPU, CPU chỉ lo vài chục vật quanh người chơi):
//   gió có hướng + cơn giật trôi qua đồng cỏ (liên kết weather.js) · cỏ/hoa/bụi rẽ ra quanh người chơi, xe, thú (WIND.uMov)
//   cây rung khi va/nhảy vào + lá rơi (WIND.uShk) · nước bắn khi lội · dấu chân trên cát mờ dần · bướm & chuồn chuồn quanh người chơi
//   đồ vật mới (ghế nhựa, dừa, chai, lon) + nhặt rác ♻️
// Tỷ lệ vàng: số hạt/dấu chân theo dãy Fibonacci, bước chân, bán kính theo φ. Draw call thêm: 3 (hạt, dấu chân, côn trùng).
import * as THREE from 'three';
import { WIND } from './terrain.js';
import { PHI, flatDist, lagoonDist, SPAWN } from './layout.js';
import { CFG } from './config.js';

const W0 = CFG.island.waterLevel, NB = 233, NF = 34, NI = 21;   // hạt (Fibonacci) · dấu chân · côn trùng
const FACT = {
  shake: '🌳 Va vào thân cây làm cành rung, lá già rụng xuống — lá non bám chắc hơn nên ở lại.',
  gust: '💨 Gió giật: không khí dồn từng đợt, nhìn đồng cỏ rạp xuống thành sóng chạy theo hướng gió.',
  splash: '💦 Nước bắn tung: chân đẩy nước đi, nước có quán tính nên văng lên rồi rơi xuống vì trọng lực.',
  print: '👣 Cát ướt giữ dấu chân rõ hơn cát khô — nước làm hạt cát dính vào nhau.',
  litter: '♻️ Chai nhựa cần hàng trăm năm để phân huỷ. Nhặt rác bỏ đúng chỗ là bảo vệ biển và cá!',
  dragon: '🪰 Chuồn chuồn bay thấp là trời sắp mưa — không khí ẩm làm côn trùng nhỏ bay thấp, chuồn chuồn bay theo bắt mồi.',
};

export function createLiving(ctx) {
  const { scene, terrain, camera, renderer } = ctx, pl = ctx.player, told = new Set(), now = () => WIND.uTime.value;
  const fact = (k, ms = 4800) => { if (told.has(k) || !ctx.toast) return; told.add(k); ctx.toast(FACT[k], ms); };
  const Q = () => ctx.qualityLevel || 0;
  const scaleU = { value: 600 }, updScale = () => { const s = new THREE.Vector2(); renderer.getDrawingBufferSize(s); scaleU.value = s.y / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)); };

  // ---------- Gió: hướng xoay chậm, cơn giật theo thời tiết ----------
  const wind = { ang: 0.38, g: 0, gT: 3, gA: 0, ph: 0 };
  function updWind(dt) {
    const w = ctx.weather ? ctx.weather.cur.w : 0.2;
    wind.ang += Math.sin(now() * 0.013) * dt * 0.02 * (1 + w * 3);   // hướng gió đổi dần (bão: đổi nhanh hơn)
    if ((wind.gT -= dt) <= 0) { wind.gT = (8 - w * 5) * (0.5 + Math.random() * PHI); wind.gA = 0.25 + w * 0.75 * Math.random() + w * 0.3; }   // đợt giật mới
    wind.g += ((wind.gT > 2 ? wind.gA : 0) - wind.g) * Math.min(1, dt * 1.2);
    const G = WIND.uGust.value; G.set(Math.cos(wind.ang), Math.sin(wind.ang), Math.min(1, wind.g), G.w);
    if (wind.g > 0.7 && w > 0.4) fact('gust');
  }

  // ---------- Vật di chuyển làm cỏ rẽ: người chơi (+xe) + thú gần ----------
  const MOV = WIND.uMov.value;
  function updMovers() {
    const p = pl.pos, V = pl.vehicle, fly = V && (V.fly || V.water);
    MOV[0].set(p.x, fly ? -99 : p.y, p.z, V ? PHI + 0.3 : 1.4);
    let k = 1; const an = ctx.animals && ctx.animals.list;
    if (an) for (const A of an) { if (k >= MOV.length) break; const q = A.root && A.root.position; if (!q || (q.x - p.x) ** 2 + (q.z - p.z) ** 2 > 900) continue; MOV[k++].set(q.x, q.y, q.z, 0.9); }
    for (; k < MOV.length; k++) MOV[k].w = 0;
  }

  // ---------- Hạt (lá rơi, giọt nước, bụi): vòng đệm 233 hạt, chuyển động trên GPU, CPU chỉ ghi lúc sinh ----------
  const a0 = new Float32Array(NB * 4).fill(-99), a1 = new Float32Array(NB * 4);
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NB * 3), 3));
  const A0 = new THREE.BufferAttribute(a0, 4).setUsage(THREE.DynamicDrawUsage), A1 = new THREE.BufferAttribute(a1, 4).setUsage(THREE.DynamicDrawUsage);
  bg.setAttribute('a0', A0); bg.setAttribute('a1', A1);
  const BU = { uT: WIND.uTime, uScale: scaleU, uLight: { value: 1 }, uG: WIND.uGust };
  const burst = new THREE.Points(bg, new THREE.ShaderMaterial({
    uniforms: BU, transparent: true, depthWrite: false,
    vertexShader: `uniform float uT, uScale, uLight; uniform vec4 uG; attribute vec4 a0, a1; varying vec4 vC; varying float vK, vR;
      void main(){ float e = uT - a0.w, k = a1.w, life = k < .5 ? 5. : k < 1.5 ? .9 : 1.3; vec3 p = a0.xyz; float sz, al; vec3 col; vR = 0.; vK = k;
        if (k < .5) {        // lá: rơi chậm, lắc lư, trôi theo gió
          float ph = fract(a1.x * 7.3) * 6.28; p += vec3(a1.x, 0., a1.z) * min(e, .6) + vec3(uG.x, 0., uG.y) * e * (.4 + uG.z);
          p.y -= e * 1.15; p.x += sin(e * 2.6 + ph) * .55; p.z += cos(e * 2.1 + ph) * .35; vR = e * 3.4 + ph; sz = .2;
          col = mix(vec3(.47, .72, .25), vec3(.93, .63, .2), fract(a1.y * 13.)); al = smoothstep(0., .1, e) * (1. - smoothstep(life - .6, life, e));
        } else if (k < 1.5) { // giọt nước: văng lên rồi rơi
          p += a1.xyz * e; p.y -= 11. * e * e; sz = .085; col = vec3(.85, .95, 1.); al = .85 * (1. - smoothstep(life * .6, life, e));
        } else {             // bụi: phồng ra, bay lên chậm
          p += a1.xyz * e * .6; p.y += e * .4; sz = .35 + e * .6; col = vec3(.86, .78, .62); al = .35 * (1. - smoothstep(0., life, e));
        }
        al *= step(0., e) * step(e, life);
        vec4 mv = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = al > 0. ? max(1.5, sz * uScale / -mv.z) : 0.;
        vC = vec4(col * uLight, al); }`,
    fragmentShader: `varying vec4 vC; varying float vK, vR; void main(){ vec2 p = gl_PointCoord - .5;
        if (vK < .5) { float c = cos(vR), s = sin(vR); p = mat2(c, -s, s, c) * p; if (abs(p.x) * 1.618 + abs(p.y) > .45) discard; gl_FragColor = vC; return; }
        float d = dot(p, p) * 4.; if (d > 1.) discard; gl_FragColor = vec4(vC.rgb, vC.a * (1. - d * (vK > 1.5 ? 1. : .3))); }`,
  }));
  burst.frustumCulled = false; burst.renderOrder = 3; scene.add(burst);
  let bi = 0, bLo = NB, bHi = -1;
  function emit(x, y, z, vx, vy, vz, kind) {
    const i = bi++ % NB; a0.set([x, y, z, now()], i * 4); a1.set([vx, vy, vz, kind], i * 4); bLo = Math.min(bLo, i); bHi = Math.max(bHi, i);
  }
  const R = () => Math.random() - 0.5;
  const leaves = (x, y, z, n, r) => { for (let i = 0; i < n; i++) { const a = i * 2.39996, d = r * Math.sqrt((i + 0.5) / n); emit(x + Math.cos(a) * d, y + R() * 1.2, z + Math.sin(a) * d, R() * 1.2, Math.random(), R() * 1.2, 0); } };   // góc vàng 137,5°
  const splash = (x, z, n, s) => { for (let i = 0; i < n; i++) { const a = i * 2.39996; emit(x, W0 + 0.05, z, Math.cos(a) * s * (0.4 + Math.random()), s * (1.6 + Math.random() * 1.6), Math.sin(a) * s * (0.4 + Math.random()), 1); } };
  const dust = (x, y, z, n) => { for (let i = 0; i < n; i++) emit(x + R() * 0.5, y + 0.1, z + R() * 0.5, R() * 1.4, 0, R() * 1.4, 2); };

  // ---------- Cây rung: tra cứu thân cây theo ô 8 m ----------
  const cells = new Map(); let nTr = -1;
  const ck = (x, z) => Math.floor(x / 8) * 7919 + Math.floor(z / 8);
  function indexTrees() { cells.clear(); nTr = terrain.trunks.length; terrain.trunks.forEach((t, i) => { const k = ck(t[0], t[2]); if (!cells.has(k)) cells.set(k, []); cells.get(k).push(i); }); }
  const SH = WIND.uShk.value, cool = new Map(); let si = 0;
  function shakeTree(i, amp) {
    const t = terrain.trunks[i]; if ((cool.get(i) || 0) > now()) return; cool.set(i, now() + 1.3);
    SH[si++ % SH.length].set(t[0], t[2], amp, now());
    leaves(t[0], t[1] + t[3] * 1.15, t[2], Math.round(5 + amp * 8), t[3] * 0.45);   // 5..13 lá từ tán
    fact('shake');
  }
  function nearTrees(x, z, rad, fn) {
    if (terrain.trunks.length !== nTr) indexTrees();
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { const L = cells.get(ck(x + di * 8, z + dj * 8)); if (L) for (const i of L) { const t = terrain.trunks[i], d = Math.hypot(t[0] - x, t[2] - z); if (d < rad + t[3] * 0.1) fn(i, d); } }
  }

  // ---------- Dấu chân trên cát: 34 vết, mờ dần trong 21 giây ----------
  const fG = new THREE.CircleGeometry(0.11, 8).scale(0.62, 1, 1).rotateX(-Math.PI / 2);   // vết bầu dục rộng/dài = 1/φ
  const fBirth = new THREE.InstancedBufferAttribute(new Float32Array(NF).fill(-99), 1).setUsage(THREE.DynamicDrawUsage); fG.setAttribute('aB', fBirth);
  const foot = new THREE.InstancedMesh(fG, new THREE.ShaderMaterial({
    uniforms: { uT: WIND.uTime, uLight: BU.uLight }, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
    vertexShader: 'uniform float uT; attribute float aB; varying float vA; void main(){ vA = (1. - smoothstep(8., 21., uT - aB)) * step(aB, uT); gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.); }',
    fragmentShader: 'uniform float uLight; varying float vA; void main(){ if (vA < .01) discard; gl_FragColor = vec4(vec3(.55, .42, .28) * uLight, vA * .42); }',
  }), NF);
  foot.frustumCulled = false; foot.count = NF; scene.add(foot);
  for (let i = 0; i < NF; i++) foot.setMatrixAt(i, new THREE.Matrix4().makeTranslation(0, -99, 0));
  const _o = new THREE.Object3D(); let fi = 0, stride = 0, side = 1;
  const sandAt = (x, z, h) => h > W0 + 0.02 && h < W0 + 1.7 && !(flatDist(x, z) < 3 && lagoonDist(x, z) > 4);
  function footprint(x, z, rot) {
    const ox = Math.cos(rot) * 0.13 * side, oz = -Math.sin(rot) * 0.13 * side; side = -side;
    const px = x + ox, pz = z + oz; _o.position.set(px, terrain.heightAt(px, pz) + 0.03, pz); _o.rotation.set(0, rot, 0); _o.updateMatrix();
    const i = fi++ % NF; foot.setMatrixAt(i, _o.matrix); foot.instanceMatrix.needsUpdate = true; fBirth.array[i] = now(); fBirth.needsUpdate = true;
  }

  // ---------- Bướm (trên cỏ, ban ngày) & chuồn chuồn (trên nước nông) quanh người chơi — chuyển động trên GPU ----------
  const wU = terrain.waterMat.uniforms;
  const iG = new THREE.BufferGeometry(); iG.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.1, 1, 0.06, 0.25, 0.85, 0, -0.3, 0, 0, 0.1, -0.85, 0, -0.3, -1, 0.06, 0.25, 0, 0.02, 0.35, 0.03, 0, -0.55, -0.03, 0, -0.55], 3));
  const iSeed = new Float32Array(NI); for (let i = 0; i < NI; i++) iSeed[i] = (i * 0.618034) % 1; iG.setAttribute('aS', new THREE.InstancedBufferAttribute(iSeed, 1));
  const IU = { uT: WIND.uTime, uP: { value: new THREE.Vector3() }, uDay: { value: 1 }, uH: wU.uH, uMin: wU.uMin, uSize: wU.uSize, uLight: BU.uLight };
  const bugs = new THREE.InstancedMesh(iG, new THREE.ShaderMaterial({
    uniforms: IU, side: THREE.DoubleSide,
    vertexShader: `uniform float uT, uDay; uniform vec3 uP; uniform sampler2D uH; uniform vec2 uMin, uSize; attribute float aS; varying vec3 vC;
      void main(){ const float S = 34.; float id = float(gl_InstanceID), ph = aS * 6.2832, dr = step(.62, aS);   // ~38% là chuồn chuồn
        vec2 c = uP.xz + (fract(vec2(aS * 7.31, aS * 3.17) - uP.xz / S + .5) - .5) * S;
        float g = texture2D(uH, (c - uMin) / uSize).r * 255. / 12. - 8.;
        float ok = dr > .5 ? step(-1.6, g) * step(g, .15) : step(1.2, g);   // chuồn chuồn: nước nông · bướm: đất cao
        vec2 o = dr > .5 ? vec2(sin(uT * .9 + ph) * 3. + sin(uT * 2.7 + ph * 3.) * .6, cos(uT * .7 + ph) * 3.) : vec2(sin(uT * .5 + ph) * 2.2, cos(uT * .63 + ph * 2.) * 2.2);
        vec2 v = dr > .5 ? vec2(cos(uT * .9 + ph), -sin(uT * .7 + ph)) : vec2(cos(uT * .5 + ph), -sin(uT * .63 + ph * 2.));
        float y = max(g, 0.) + (dr > .5 ? .7 + sin(uT * 1.3 + ph) * .15 : .8 + sin(uT * 2. + ph) * .35);
        float flap = dr > .5 ? .35 + .65 * abs(sin(uT * 40. + ph)) : .2 + .8 * abs(sin(uT * 13. + ph));
        vec3 p = position; float wing = step(.04, abs(p.x)); p.y += wing * abs(p.x) * (flap - .5) * 1.2; p.x *= mix(1., flap, wing * (1. - dr) );
        p *= (dr > .5 ? vec3(.5, .5, .55) : vec3(.16, .16, .18)) * ok * uDay;
        float a = atan(v.x, v.y); p.xz = mat2(cos(a), sin(a), -sin(a), cos(a)) * p.xz;
        vec3 w = vec3(c.x + o.x, y, c.y + o.y) + p;
        vC = dr > .5 ? mix(vec3(.2, .55, .9), vec3(.25, .8, .7), aS) : mix(mix(vec3(1., .82, .25), vec3(1., .55, .78), step(.3, aS)), vec3(1.), step(.5, aS));
        vC *= 1. - .35 * (1. - wing);
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.); }`,
    fragmentShader: 'uniform float uLight; varying vec3 vC; void main(){ gl_FragColor = vec4(vC * uLight, 1.); }',
  }), NI);
  bugs.frustumCulled = false; scene.add(bugs);
  const I4 = new THREE.Matrix4(); for (let i = 0; i < NI; i++) bugs.setMatrixAt(i, I4);

  // ---------- Đồ vật mới (physics.js): ghế nhựa, dừa, chai, lon + nhặt rác ----------
  const ph = ctx.physics; let picked = +(localStorage.getItem('island.litter') || 0);
  if (ph) {
    const [sx, sz] = SPAWN, put = (k, x, z) => { const N = ctx.grid.near(x, z); if (N.boxes.some(B => x > B.x0 - 0.6 && x < B.x1 + 0.6 && z > B.z0 - 0.6 && z < B.z1 + 0.6) || terrain.heightAt(x, z) < W0 - 0.1) return; ph.add(k, x, z); };
    // bãi xuất phát: 2 ghế nhựa + 3 quả dừa cạnh thùng gỗ, 1 lon nước
    put('chair', sx - 6.5, sz - 3); put('chair', sx - 7.4, sz - 2.2); for (let i = 0; i < 3; i++) put('fruit', sx - 2 + i * 0.5, sz + 5 + i * 0.3); put('can', sx + 2.5, sz + 2);
    // bờ biển: rác trôi dạt (chai, lon) + dừa rụng — vị trí theo góc vàng
    let n = 0; for (let i = 0; i < 400 && n < 21; i++) {
      const a = i * 2.39996, r = 50 + (i * 13.7) % 45, x = Math.cos(a) * r, z = Math.sin(a) * r, h = terrain.heightAt(x, z);
      if (h < 0.2 || h > 1.2 || terrain.slopeAt(x, z) > 0.5) continue; put(['bottle', 'can', 'fruit'][n % 3], x, z); n++;
    }
  }
  function litter() {
    if (!ph || pl.vehicle) return; const p = pl.pos; let best = null, bd = 1.7;
    for (const b of ph.bodies) { if (b.dead || (b.kind !== 'bottle' && b.kind !== 'can')) continue; const d = Math.hypot(b.pos.x - p.x, b.pos.z - p.z); if (d < bd) { bd = d; best = b; } }
    if (best) ctx.offer('♻️ Nhặt rác', () => {
      ph.remove(best); picked++; localStorage.setItem('island.litter', picked); ctx.sfx && ctx.sfx('coin'); pl.emote && pl.emote('pick');
      ctx.toast(picked === 8 ? '🏆 <b>Thành tựu: Bạn của biển</b> — đã nhặt 8 món rác! (8 là số Fibonacci 🌀)' : `♻️ Đã nhặt ${picked} món rác<br><small>${FACT.litter}</small>`, 4200);
    }, 2);
  }

  // ---------- Mỗi khung hình ----------
  const prev = new THREE.Vector3().copy(pl.pos); let wasWet = false, splT = 0, scT = 0, vyPrev = 0;
  function update(dt) {
    if (dt <= 0) return;
    const p = pl.pos, V = pl.vehicle, q = Q(), t = now(), day = 1 - (ctx.sky ? ctx.sky.state.night : 0), W = ctx.weather ? ctx.weather.cur : { r: 0, c: 0 };
    updScale(); updWind(dt); updMovers();
    BU.uLight.value = (0.35 + 0.65 * day) * (1 - 0.25 * W.c);
    const dx = p.x - prev.x, dz = p.z - prev.z, mv = Math.hypot(dx, dz), sp = mv / dt, vy = (p.y - prev.y) / dt; prev.copy(p);
    const fly = V && (V.fly || V.water), onGround = pl.grounded && !fly;

    // cây: đi/chạy/đạp xe va vào thân · nhảy xuống gần cây · bóng/đá bay vào thân
    if ((scT -= dt) <= 0 && !fly) {
      scT = 0.1;
      nearTrees(p.x, p.z, 0.75, (i, d) => { if (sp > 1.4) shakeTree(i, Math.min(1, 0.35 + sp / 12)); });
      if (onGround && vyPrev < -5) nearTrees(p.x, p.z, 2.6, i => shakeTree(i, 0.9));   // vừa đáp đất mạnh
      if (ph) for (const b of ph.bodies) if (!b.sleep && !b.dead && b.vel.lengthSq() > 16) nearTrees(b.pos.x, b.pos.z, b.K.r + 0.3, i => shakeTree(i, 0.6));
    }
    vyPrev = onGround ? 0 : vy;

    // nước: lội → giọt bắn theo bước, nhảy/ngã xuống → bắn tung toé
    const wet = !fly && p.y < W0 + 0.55 && p.y > W0 - 1.6 && terrain.heightAt(p.x, p.z) < W0 + 0.1;
    if (wet && !wasWet && Math.abs(vy) > 3) { splash(p.x, p.z, 21, 1.4); fact('splash'); }
    else if (wet && sp > 1.2 && (splT -= dt) <= 0) { splT = 0.13 - Math.min(0.06, sp * 0.006); splash(p.x + dx / mv * 0.3, p.z + dz / mv * 0.3, q >= 2 ? 2 : 3, 0.6 + sp * 0.06); if (sp > 4) fact('splash'); }
    wasWet = wet;
    if (ph) for (const b of ph.bodies) if (!b.sleep && !b.dead && b.vel.y < -3 && b.pos.y - b.K.r < W0 && b.pos.y - b.K.r - b.vel.y * dt >= W0) splash(b.pos.x, b.pos.z, 8, 1);

    // dấu chân trên cát (đi bộ, không trong nước)
    if (onGround && !V && !wet && sp > 0.5 && (stride += mv) > 0.72) {
      stride = 0; const h = terrain.heightAt(p.x, p.z);
      if (sandAt(p.x, p.z, h) && Math.abs(p.y - h) < 0.2) { footprint(p.x, p.z, pl.rot); if (h < W0 + 0.6) fact('print'); }
    }
    // xe đạp chạy nhanh trên đất → bụi
    if (V && !fly && sp > 6 && onGround && Math.random() < dt * 8 && W.r < 0.2) dust(p.x, p.y, p.z, 1);

    // côn trùng
    IU.uP.value.copy(p); IU.uDay.value = q >= 3 ? 0 : day * (1 - W.r);
    bugs.visible = IU.uDay.value > 0.01;
    if (W.c > 0.6 && W.r < 0.1 && day > 0.5) fact('dragon');

    litter();
    if (bHi >= bLo) { for (const A of [A0, A1]) { A.clearUpdateRanges(); A.addUpdateRange(bLo * 4, (bHi - bLo + 1) * 4); A.needsUpdate = true; } bLo = NB; bHi = -1; }
  }
  return { update, emit, leaves, splash, dust, shakeTree, wind, burst, foot, bugs, get litter() { return picked; } };
}
