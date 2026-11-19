// sea/wild.js — SINH VẬT MẶT BIỂN & THỜI TIẾT BIỂN:
//   🐬 đàn cá heo nhảy theo mũi thuyền người chơi (hoặc theo phà) · 🐋 cá voi phun nước xa xa · 🕊️ hải âu bay theo ghe đang kéo lưới ·
//   🐢 rùa biển ngoi lên thở gần giàn rong · 🌫️ sương sớm trên vịnh (5–7 h) · ⛈️ giông: sóng cao thêm (ocean state.amp), thuyền về bến (fleet.js).
//   Mỗi loại 1 draw call, chỉ hiện khi có mặt. Hình dựng bằng khối gộp (không có model CC0 cá heo/cá voi/hải âu trong kho).
import * as THREE from 'three';
import { CFG } from '../config.js';
import { Batch } from '../academy/geo.js';
import { matV } from '../sample/palette.js';
import { loadModel } from '../models.js';
import { PHI, BAY, toW, SEAWEED } from './site.js';

const MOB = CFG.isMobile, ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const FACT = {
  dolphin: '🐬 <b>Cá heo</b> thích bơi trước mũi thuyền để "cưỡi" con sóng do thuyền đẩy ra — đỡ tốn sức mà lại vui! Cá heo là thú, thở bằng phổi.',
  whale: '🐋 Xa xa có <b>cá voi phun nước</b>! Đó là hơi thở ấm từ phổi gặp không khí mát nên ngưng thành cột sương, cao tới 9 m.',
  gull: '🕊️ <b>Hải âu</b> bay theo ghe đánh cá để chờ cá vụn. Ngư dân nhìn đàn chim là biết chỗ có cá.',
  turtle: '🐢 <b>Rùa biển</b> phải ngoi lên mặt nước để thở. Rùa hay ăn cỏ biển, rong — đừng xả rác kẻo rùa ăn nhầm túi ni-lông.',
  mist: '🌫️ <b>Sương sớm trên biển</b>: đêm lạnh, hơi nước sát mặt biển ngưng thành hạt li ti. Nắng lên là sương tan.',
  storm: '⛈️ <b>Biển động!</b> Gió giật làm sóng cao lên, ghe thuyền chạy về bến tránh gió. Trời giông không được ra khơi.',
  sunset: '🌇 <b>Hoàng hôn làng chài</b>: ghe về bến, lên đèn. Mặt Trời xuống thấp, ánh sáng đi xuyên lớp khí dày nên ngả màu cam đỏ.',
};

function dolphinGeo() {
  const b = new Batch(), G = '#5f7f9c', L = '#dfe8ee';
  b.add(new THREE.SphereGeometry(1, 9, 6), G, 0, 0, 0, 0, 0, 0, 0.3, 0.3, 1.05);            // thân
  b.add(new THREE.SphereGeometry(1, 8, 5), L, 0, -0.1, 0.1, 0, 0, 0, 0.24, 0.2, 0.85);       // bụng sáng
  b.add(new THREE.ConeGeometry(0.11, 0.42, 6), G, 0, -0.03, 1.15, 0, Math.PI / 2, 0);        // mỏ
  b.add(new THREE.ConeGeometry(0.16, 0.9, 5), G, 0, 0, -1.15, 0, -Math.PI / 2, 0);           // cuống đuôi
  b.add(new THREE.BoxGeometry(0.06, 0.34, 0.4), G, 0, 0.36, -0.05, 0, -0.5, 0);              // vây lưng
  for (const s of [-1, 1]) { b.add(new THREE.BoxGeometry(0.36, 0.04, 0.2), G, s * 0.3, -0.16, 0.35, 0, 0, s * -0.5); b.add(new THREE.BoxGeometry(0.42, 0.04, 0.24), G, s * 0.2, 0, -1.62, s * 0.5, 0, 0); }
  return b.build();
}
function gullGeo() {
  const b = new Batch();
  b.add(new THREE.SphereGeometry(1, 5, 4), '#f6f6f2', 0, 0, 0, 0, 0, 0, 0.09, 0.08, 0.26);
  for (const s of [-1, 1]) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.12, s * 0.62, 0.2, 0.02, 0, 0, -0.1, 0, 0, -0.1, s * 0.62, 0.2, 0.02, 0, 0, 0.12], 3)); g.computeVertexNormals(); b.add(g, '#d9dde3'); }
  return b.build();
}
function whaleGeo() {
  const b = new Batch(), D = '#2b3f55';
  b.add(new THREE.SphereGeometry(1, 10, 6), D, 0, -0.9, 0, 0, 0, 0, 2.0, 1.5, 6.5);          // lưng nhô khỏi mặt nước
  b.add(new THREE.BoxGeometry(0.2, 0.7, 1.0), D, 0, 0.55, -2.2, 0, -0.4, 0);
  return b.build();
}

export function createWild(ctx, { fleet, pilot, village }) {
  const { scene, terrain, camera } = ctx, pl = ctx.player, waveY = terrain.waveHeight;
  const told = new Set(); const once = (k, ms = 6500) => { if (told.has(k)) return false; told.add(k); ctx.toast(FACT[k], ms); return true; };
  const _o = new THREE.Object3D(), _m = new THREE.Matrix4();
  const mat = () => matV().clone();

  // ---------- cá heo theo thuyền ----------
  const ND = 3, dol = new THREE.InstancedMesh(dolphinGeo(), mat(), ND); dol.frustumCulled = false; dol.visible = false; dol.name = 'sea-dolphins'; scene.add(dol);
  const pod = Array.from({ length: ND }, (_, i) => ({ side: i % 2 ? 1 : -1, lat: 3.4 + i * 1.3, fwd: 3 - i * 2.2, ph: i * 1.31, wet: true }));
  let podK = 0, podT = 13, sailT = 0;
  // ---------- cá voi phun nước ----------
  const whale = new THREE.Mesh(whaleGeo(), mat()); whale.visible = false; whale.name = 'sea-whale'; scene.add(whale);
  const NS = 34, sg = new THREE.BufferGeometry(), sp = new Float32Array(NS * 3), sa = new Float32Array(NS); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('a', new THREE.BufferAttribute(sa, 1));
  const spout = new THREE.Points(sg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uPx: { value: 400 } },
    vertexShader: 'attribute float a; uniform float uPx; varying float vA; void main(){ vA = a; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(uPx * 0.9 * (1.4 - a) / -mv.z, 1.5, 21.); }',
    fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(1., 1., 1., smoothstep(.5, .1, d) * vA * .75); }' }));
  spout.frustumCulled = false; spout.visible = false; scene.add(spout);
  const W = { on: false, t: 0, x: 0, z: 0, h: 0, wait: 34 + Math.random() * 34, blow: 0 };
  // ---------- hải âu theo ghe ----------
  const NGU = MOB ? 8 : 13, gulls = new THREE.InstancedMesh(gullGeo(), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), NGU); gulls.frustumCulled = false; gulls.visible = false; gulls.name = 'sea-gulls'; scene.add(gulls);
  const flock = Array.from({ length: NGU }, (_, i) => ({ a: i * 2.399, r: 4 + (i % 5) * 1.6, y: 4 + (i % 4) * 1.3, sp: (0.5 + (i % 3) * 0.14) * (i % 2 ? 1 : -1), ph: i * 1.7 }));
  const gc = new THREE.Vector3(BAY.O[0], 0, BAY.O[1]); let gTarget = null, gT = 0;
  // ---------- rùa biển ngoi lên thở ----------
  const turtles = []; const tc = toW(SEAWEED.u - 16, SEAWEED.v - 6);
  if (!MOB || true) for (let i = 0; i < 2; i++) loadModel('rua').then(m => { if (!m) return; m.scale.setScalar(0.85 + i * 0.25); m.traverse(o => { if (o.isMesh) o.castShadow = false; }); m.visible = false; scene.add(m); turtles.push({ m, a: i * 3.1, r: 7 + i * 5, ph: i * 2 }); });
  // ---------- sương sớm: 13 tấm mềm quay về camera, trôi chậm trên vịnh ----------
  const NM = MOB ? 8 : 13, mq = new THREE.PlaneGeometry(1, 1), mgeo = new THREE.InstancedBufferGeometry(); mgeo.index = mq.index; mgeo.setAttribute('position', mq.attributes.position); mgeo.setAttribute('uv', mq.attributes.uv);
  const mA = new Float32Array(NM * 4); for (let i = 0; i < NM; i++) { const [x, z] = toW(-10 + ((i * 37) % 90), -70 + ((i * 53) % 140)); mA.set([x, 1.2 + (i % 3) * 0.9, z, 26 + (i % 4) * 9], i * 4); }
  mgeo.setAttribute('aP', new THREE.InstancedBufferAttribute(mA, 4)); mgeo.instanceCount = NM;
  const MU = { uK: { value: 0 }, uT: { value: 0 }, uCol: { value: new THREE.Color('#ffffff') } };
  const mist = new THREE.Mesh(mgeo, new THREE.ShaderMaterial({ uniforms: MU, transparent: true, depthWrite: false,
    vertexShader: 'attribute vec4 aP; uniform float uT; varying vec2 vUv; void main(){ vUv = uv; vec3 c = aP.xyz; c.x += sin(uT * 0.05 + aP.z) * 6.; vec4 mv = viewMatrix * vec4(c, 1.); mv.xy += position.xy * vec2(aP.w, aP.w * 0.22); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform float uK; uniform vec3 uCol; varying vec2 vUv; void main(){ vec2 q = (vUv - .5) * 2.; float a = smoothstep(1., 0., length(q * vec2(1., 1.25))); gl_FragColor = vec4(uCol, a * a * uK * 0.27); }' }));
  mist.frustumCulled = false; mist.visible = false; mist.renderOrder = 3; mist.name = 'sea-mist'; scene.add(mist);

  const water = terrain.water; let amp = 1, stormTold = false;
  function update(dt, t) {
    const p = pl.pos, S = ctx.sky.state, hr = S.hour, cur = ctx.vehicles && ctx.vehicles.current, onBoat = cur && pilot.boats.includes(cur), aboard = pilot.aboard;
    const depth = -terrain.heightAt(p.x, p.z), far = scene.fog ? scene.fog.far : 300;
    // ----- giông: sóng to dần -----
    const stormy = fleet.stormy; amp += ((stormy ? 1.38 : 1) - amp) * Math.min(1, dt * 0.2); water.state.amp = amp;
    if (stormy && !stormTold && Math.hypot(p.x, p.z) > 200) { stormTold = true; ctx.toast(FACT.storm, 6000); } if (!stormy) stormTold = false;

    // ----- cá heo -----
    const bsp = aboard ? fleet.ferry.sp : pl.speed, hx = aboard ? Math.sin(fleet.ferry.h) : Math.sin(pl.rot), hz = aboard ? Math.cos(fleet.ferry.h) : Math.cos(pl.rot);
    const can = (onBoat || aboard) && depth > 4 && bsp > 3 && !stormy && S.night < 0.7;
    sailT = can ? sailT + dt : Math.max(0, sailT - dt * 2);
    if (can && sailT > podT) podK = Math.min(1, podK + dt * 0.5); else if (!can || sailT < 1) podK = Math.max(0, podK - dt * 0.4);
    if (podK <= 0 && dol.visible) { dol.visible = false; podT = 8 + Math.random() * 21; }
    if (podK > 0) {
      if (!dol.visible) { dol.visible = true; once('dolphin'); ctx.dexAdd && void 0; }
      const lead = aboard ? 9 : 0;
      pod.forEach((d, i) => {
        const cyc = ((t * 0.42 + d.ph) % 1), jump = cyc < 0.36, tau = cyc / 0.36;                    // 0,36 chu kỳ trên không
        const f = d.fwd + lead + Math.sin(t * 0.7 + d.ph) * 1.5, x = p.x + hx * f + hz * d.side * d.lat, z = p.z + hz * f - hx * d.side * d.lat;
        const y = waveY(x, z) + (jump ? Math.sin(tau * Math.PI) * 1.7 : -0.45) - (1 - podK) * 2.5, pitch = jump ? -Math.cos(tau * Math.PI) * 0.9 : 0;
        _o.position.set(x, y, z); _o.rotation.set(pitch, Math.atan2(hx, hz), 0, 'YXZ'); _o.scale.setScalar(1.25); _o.updateMatrix(); dol.setMatrixAt(i, _o.matrix);
        if (jump !== !d.wet) { d.wet = !jump; fleet.puff(x + hx * (jump ? -0.5 : 1.4), z + hz * (jump ? -0.5 : 1.4), 0, 0, 0.9, 0.9, 1.6); if (!jump && i === 0) ctx.sfx && ctx.sfx('splash'); }
      });
      dol.instanceMatrix.needsUpdate = true;
    }

    // ----- cá voi phun nước xa xa -----
    if (!W.on) {
      if ((W.wait -= dt) <= 0) {
        W.wait = 55 + Math.random() * 89;
        const out = Math.hypot(p.x, p.z) > 225 && S.night < 0.6 && !stormy && !ctx.underwater;
        if (out) for (let k = 0; k < 21; k++) {   // chọn điểm ngoài khơi, trong tầm sương: ưu tiên trước mặt camera, không có biển thì thử quanh
          const a = Math.atan2(camera.position.x - p.x, camera.position.z - p.z) + Math.PI + (Math.random() - 0.5) * (k < 8 ? 1.6 : 6.28), d = Math.min(far * 0.72, 150 + Math.random() * 60), x = p.x + Math.sin(a) * d, z = p.z + Math.cos(a) * d;
          if (terrain.heightAt(x, z) < -5 && Math.hypot(x, z) > 390 && Math.hypot(x - 286, z - 286) > 110) { Object.assign(W, { on: true, t: 0, x, z, h: a + Math.PI / 2, blow: 0 }); whale.visible = spout.visible = true; break; }
        }
      }
    } else {
      W.t += dt; const T = 13, s = W.t * 1.3, x = W.x + Math.sin(W.h) * s, z = W.z + Math.cos(W.h) * s, rise = Math.min(1, W.t / 2) * Math.min(1, (T - W.t) / 2.5);
      whale.position.set(x, waveY(x, z) - 1.3 + rise * 1.25, z); whale.rotation.set(W.t > T - 3 ? (W.t - (T - 3)) * 0.25 : 0, W.h, 0, 'YXZ');
      // 3 lần phun: mỗi lần 2,5 s
      const bt = (W.t - 1.5) % 3.4, blowing = W.t > 1.5 && W.t < T - 3 && bt < 2.5;
      spout.material.uniforms.uPx.value = ctx.renderer.getDrawingBufferSize(_v2).y * 0.5;
      for (let i = 0; i < NS; i++) { const k = (i / NS + (blowing ? bt * 0.6 : 0)) % 1, hgt = blowing ? Math.sin(Math.min(1, bt / 0.5) * Math.PI / 2) : 0, sx2 = Math.sin(i * 2.4) * k * 1.2, sz2 = Math.cos(i * 1.7) * k * 1.2; sp[i * 3] = x + Math.sin(W.h) * 2.2 + sx2; sp[i * 3 + 1] = whale.position.y + 0.6 + k * 6.5 * hgt - k * k * 1.5; sp[i * 3 + 2] = z + Math.cos(W.h) * 2.2 + sz2; sa[i] = blowing ? (1 - k) * Math.min(1, (2.5 - bt) / 0.6) : 0; }
      sg.attributes.position.needsUpdate = true; sg.attributes.a.needsUpdate = true;
      if (blowing && bt < 0.1 && Math.hypot(x - p.x, z - p.z) < far) { if (once('whale')) ctx.sfx && ctx.sfx('whoosh'); }
      if (W.t > T) { W.on = false; whale.visible = spout.visible = false; }
    }

    // ----- hải âu: theo ghe đang kéo lưới / đang về bến gần người chơi nhất; sáng sớm lượn trên chợ cá -----
    if ((gT -= dt) <= 0) {
      gT = 2; gTarget = null; let bd = 233;
      for (const v of fleet.byKind.ghe || []) if ((v.working || v.sp > 1) && v.d < bd) { bd = v.d; gTarget = v; }
      if (!gTarget && village.market && Math.hypot(p.x - BAY.O[0], p.z - BAY.O[1]) < 144) gTarget = 'market';
      const show = !!gTarget && S.night < 0.5 && !stormy; if (gulls.visible !== show) gulls.visible = show;
    }
    if (gulls.visible) {
      const tx = gTarget === 'market' ? BAY.O[0] - BAY.D[0] * 4 - BAY.T[0] * 8 : gTarget.x, tz = gTarget === 'market' ? BAY.O[1] - BAY.D[1] * 4 - BAY.T[1] * 8 : gTarget.z;
      gc.x += (tx - gc.x) * Math.min(1, dt * 0.9); gc.z += (tz - gc.z) * Math.min(1, dt * 0.9);
      for (let i = 0; i < NGU; i++) {
        const g = flock[i], a = g.a + t * g.sp, flap = Math.sin(t * 9 + g.ph), glide = Math.sin(t * 0.6 + g.ph) > 0.3;
        _o.position.set(gc.x + Math.cos(a) * g.r, g.y + 1.5 + Math.sin(t * 0.8 + g.ph) * 0.8, gc.z + Math.sin(a) * g.r); _o.rotation.set(0, -a + (g.sp > 0 ? 0 : Math.PI), Math.sin(t * 0.5 + g.ph) * 0.25 * Math.sign(g.sp), 'YXZ');
        _o.scale.set(1.5, 1.5 * (glide ? 0.6 : flap), 1.5); _o.updateMatrix(); gulls.setMatrixAt(i, _o.matrix);
      }
      gulls.instanceMatrix.needsUpdate = true;
      if (gTarget !== 'market' && gTarget.d < 55) once('gull');
    }

    // ----- rùa -----
    const td = Math.hypot(p.x - tc[0], p.z - tc[1]);
    for (const q of turtles) {
      const on = td < 110 && S.night < 0.8; if (q.m.visible !== on) q.m.visible = on; if (!on) continue;
      const a = q.a + t * 0.07, x = tc[0] + Math.cos(a) * q.r, z = tc[1] + Math.sin(a * 1.3) * q.r * 0.7, up = Math.max(0, Math.sin(t * 0.35 + q.ph));   // ngoi lên – lặn xuống
      q.m.position.set(x, waveY(x, z) - 0.42 + up * 0.3, z); q.m.rotation.set(-up * 0.25, Math.atan2(-Math.sin(a) * q.r, Math.cos(a * 1.3) * 1.3 * q.r * 0.7), 0, 'YXZ');
      if (Math.hypot(x - p.x, z - p.z) < 9) once('turtle');
    }

    // ----- sương sớm -----
    const vd = Math.hypot(p.x - BAY.O[0], p.z - BAY.O[1]), rain = ctx.weather && ctx.weather.cur ? ctx.weather.cur.r : 0;
    const mk = Math.max(0, Math.min(1, (hr - 4.6) / 0.6, (7.4 - hr) / 0.9)) * (vd < 190 ? 1 : 0) * (1 - Math.min(1, rain * 3));
    MU.uK.value += (mk - MU.uK.value) * Math.min(1, dt * 0.5); const mv = MU.uK.value > 0.01; if (mist.visible !== mv) mist.visible = mv;
    if (mv) { MU.uT.value = t; MU.uCol.value.setRGB(1, 0.96, 0.9).lerp(_c.set('#9fb0c8'), S.night * 0.7); if (vd < 60 && MU.uK.value > 0.6) once('mist'); }
    if (hr > 17.3 && hr < 18.4 && vd < 60 && !stormy) once('sunset');
  }
  const _v2 = new THREE.Vector2(), _c = new THREE.Color();
  return { update, dol, whale, gulls, mist, turtles, debug: { W, whale: () => { W.wait = 0; }, pod: () => { podT = 0; sailT = 99; } } };
}
export { PHI, ZERO };
