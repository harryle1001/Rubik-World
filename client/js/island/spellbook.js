// spellbook.js — PHÉP THUẬT KHẮP THẾ GIỚI (đũa phép của academy/magic.js dùng ở mọi nơi, không chỉ Học viện).
// - HÔ THẦN CHÚ: mỗi lần niệm, nhân vật hô tên phép (Web Speech API, giọng vi-VN; 🔊/🔇 tắt bật). Không có giọng tiếng Việt →
//   chỉ âm hiệu ứng tổng hợp (audio.js 'magic') + chữ bay lên trên đầu. Tia sáng + hạt theo màu nhà Tứ Linh.
// - Phép nguyên bản tiếng Việt (an toàn trẻ em: KHÔNG có phép tấn công/làm hại người chơi):
//   🪶 Bay Lên! (vật/NPC lơ lửng, theo đũa, thả ra rơi bằng vật lý physics.js) · 🤝 Nâng Bạn! (chỉ bạn đã bật "cho bạn nâng", hạ nhẹ)
//   ☀️ Sáng Lên! · 🔓 Mở Ra! · 🌱 Mọc Lên! (hoa mọc quanh chỗ ngắm) · 🌬️ Gọi Gió! (đẩy vật nhẹ) · 🧊 Đóng Băng Nước (cầu băng tạm)
//   🧹 Gọi Chổi! (hook ctx.spells.hooks.broom) · 🏗️ Dựng Lên! (hook ctx.spells.hooks.build) — session khác làm chổi / xây nhà.
// - Chủ game (mã chủ game của server, ☰ → 🗝️) có 🧥 áo choàng tàng hình: người khác không thấy, chỉ gợn sóng mờ khi lại gần.
// - Mạng (net.js): hiệu ứng phép + vật bay + cầu băng + hoa đồng bộ cho người cùng đảo; bản link tĩnh chơi một mình vẫn chạy.
// - API: ctx.spells.register({ id, name, icon, say, cast(api), remote?(data, caster), cost?, cd?, order?, learn?, subjects? })
//   trong cast: api.aim (điểm ngắm), api.fw (hướng), api.share = {…} → người khác nhận remote(data, caster). Trả về false = không dùng được.
// Hiệu năng: hạt dùng chung 1 Points (magic.js), hoa 2 InstancedMesh, băng 1 InstancedMesh, tia 1 Mesh; không cấp phát mỗi khung.
import * as THREE from 'three';
import { CFG } from './config.js';

const PHI = 1.618, W = CFG.island.waterLevel, G = CFG.player.gravity;
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const UP = new THREE.Vector3(0, 1, 0);
const css = `
.spFly{position:fixed;left:0;top:0;z-index:25;pointer-events:none;font:800 21px system-ui;color:#fff;white-space:nowrap;text-shadow:0 0 8px var(--c,#ffe3a0),0 2px 3px #000;transform:translate(-50%,-100%);will-change:transform,opacity}
#mgk button[aria-pressed=true]{background:#3a2a6a;border-color:#ffe3a0}
`;

export function createSpellbook(ctx, magic) {
  const { scene, player } = ctx;
  if (!magic) return { register() {}, update() {} };
  const st = { voice: load('spells.voice', true), liftOk: load('spells.liftOk', false), cloak: false, admin: false };
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), col = new THREE.Color();
  const net = () => ctx.net && ctx.net.connected ? ctx.net : null;
  const ground = (x, z, y = 99) => Math.max(ctx.terrain.heightAt(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, y) : -99);

  // ---------- HÔ THẦN CHÚ ----------
  const synth = window.speechSynthesis; let viVoice = null;
  const pickVoice = () => { try { viVoice = (synth.getVoices() || []).find(v => /^vi/i.test(v.lang)) || null; } catch (e) {} };
  if (synth) { pickVoice(); synth.addEventListener && synth.addEventListener('voiceschanged', pickVoice); }
  function speak(text, vol = 1) {
    if (!st.voice || !synth || !viVoice || !text) return false;
    try { synth.cancel(); const u = new SpeechSynthesisUtterance(text.replace(/!/g, '')); u.voice = viVoice; u.lang = viVoice.lang; u.rate = 1.08; u.pitch = 1.272; u.volume = vol; synth.speak(u); return true; } catch (e) { return false; }
  }
  // chữ bay lên trên đầu: 3 thẻ DOM dùng lại, vị trí chiếu từ thế giới ra màn hình mỗi khung
  const flies = Array.from({ length: 3 }, () => { const d = document.createElement('div'); d.className = 'spFly'; d.hidden = true; document.body.appendChild(d); return { d, t: 0, p: new THREE.Vector3(), who: null }; });
  let fi = 0;
  function flyText(text, color, who) { const F = flies[fi = (fi + 1) % flies.length]; F.d.textContent = text; F.d.style.setProperty('--c', color); F.t = 1.618; F.who = who; F.d.hidden = false; }
  function updFlies(dt) {
    for (const F of flies) {
      if (F.t <= 0) continue; F.t -= dt; if (F.t <= 0) { F.d.hidden = true; continue; }
      const root = F.who === 'me' ? player.pos : F.who && F.who.h ? F.who.h.root.position : null; if (!root) { F.d.hidden = true; F.t = 0; continue; }
      const k = 1 - F.t / 1.618; F.p.copy(root).y += 2.3 + k * 1.3; F.p.project(ctx.camera);
      if (F.p.z > 1) { F.d.style.opacity = 0; continue; }
      F.d.style.opacity = Math.min(1, F.t * 2); F.d.style.transform = `translate(${(F.p.x + 1) / 2 * innerWidth}px,${(1 - F.p.y) / 2 * innerHeight}px) translate(-50%,-100%) scale(${1 + k * 0.272})`;
    }
  }
  // ---------- tia sáng: 1 mesh trụ kéo dài từ đầu đũa tới điểm ngắm, mờ dần 1/φ² s ----------
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.07, 1, 6, 1, true).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  beam.frustumCulled = false; beam.visible = false; scene.add(beam); let beamT = 0;
  function shoot(from, to, color) {
    tmp.subVectors(to, from); const L = Math.min(34, tmp.length()); if (L < 0.2) return;
    beam.position.copy(from); beam.quaternion.setFromUnitVectors(UP, tmp.normalize()); beam.scale.set(1, L, 1); beam.material.color.set(color); beamT = 0.382; beam.visible = true;
    magic.burst(tmp2.copy(from).addScaledVector(tmp, L), UP, color, 13, 3, 1);
  }

  // ---------- 🪶 BAY LÊN: vật vật lý / người trong thị trấn lơ lửng, đi theo đũa ----------
  const floats = [];   // { kind:'body'|'npc', o, t, caster }
  const HOLD = 5.5;
  function nearestFloatable(from, fw, aim) {
    let best = null, bs = 1e9;
    const score = (p) => { const dx = p.x - player.pos.x, dz = p.z - player.pos.z, d = Math.hypot(dx, dz); if (d > 13 || d < 0.3) return 1e9; const c = (dx * fw.x + dz * fw.z) / d; if (c < 0.5 && d > 2.2) return 1e9; return Math.min(d * (1.5 - c), Math.hypot(p.x - aim.x, p.z - aim.z) * 0.618); };
    for (const b of (ctx.physics && ctx.physics.bodies) || []) { if (b.dead || floats.some(f => f.o === b)) continue; const s = score(b.pos); if (s < bs) { bs = s; best = { kind: 'body', o: b }; } }
    for (const e of ctx.townPeople || []) { if (!e.a || !e.hero || !e.hero.model.visible || floats.some(f => f.o === e)) continue; const s = score(e.hero.model.position) + 1; if (s < bs) { bs = s; best = { kind: 'npc', o: e }; } }
    return best;
  }
  const bodyKey = b => ({ k: b.kind, h: [+b.home.x.toFixed(1), +b.home.z.toFixed(1)] });
  const findBody = d => { let best = null, bd = 1.5; for (const b of (ctx.physics && ctx.physics.bodies) || []) if (b.kind === d.k && !b.dead) { const e = Math.hypot(b.home.x - d.h[0], b.home.z - d.h[1]); if (e < bd) { bd = e; best = b; } } return best; };
  function startFloat(f, caster) {
    if (floats.length >= 5) floats.shift(); f.t = HOLD; f.caster = caster; f.y0 = 0; f.ph = Math.random() * 6; floats.push(f);
    if (f.kind === 'npc') f.o.floatY = 0;
  }
  const casterPos = (c, out) => c === 'me' ? out.copy(player.pos) : c && c.h ? out.copy(c.h.root.position) : null;
  const casterRot = c => c === 'me' ? player.rot : c ? c.r : 0;
  function updFloats(dt) {
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i]; f.t -= dt; const t = performance.now() / 1000;
      if (f.kind === 'body') {
        const b = f.o; if (b.dead) { floats.splice(i, 1); continue; }
        if (f.t <= 0) { const r = casterRot(f.caster); b.vel.set(Math.sin(r) * 3, 1.5, Math.cos(r) * 3); b.sleep = false; floats.splice(i, 1); continue; }   // thả ra: rơi bằng trọng lực thật
        if (!casterPos(f.caster, tmp)) { floats.splice(i, 1); continue; }
        const r = casterRot(f.caster); tmp.x += Math.sin(r) * 2.6; tmp.z += Math.cos(r) * 2.6; tmp.y += 1.9 + Math.sin(t * 2.6 + f.ph) * 0.15;
        tmp2.subVectors(tmp, b.pos).multiplyScalar(3.4); if (tmp2.lengthSq() > 81) tmp2.setLength(9);
        b.vel.lerp(tmp2, Math.min(1, dt * 5)); b.vel.y += G * dt; b.sleep = false; b.still = 0;   // bù trọng lực của bước vật lý kế tiếp
        if (Math.random() < dt * 8) magic.burst(b.pos, UP, magic.fxCol(), 1, 0.6, 1);
      } else {
        const e = f.o, m = e.hero && e.hero.model; if (!m) { floats.splice(i, 1); continue; }
        const goal = f.t > 0.9 ? 1.6 + Math.sin(t * 2.6 + f.ph) * 0.13 : 0; e.floatY += (goal - e.floatY) * Math.min(1, dt * (f.t > 0.9 ? 2.6 : 3.4));
        m.position.y += e.floatY; m.rotation.y += dt * 0.8 * Math.min(1, e.floatY);
        if (f.t <= 0 && e.floatY < 0.03) { e.floatY = 0; floats.splice(i, 1); }
      }
    }
  }

  // ---------- 🌱 MỌC LÊN: hoa mọc quanh điểm ngắm (2 InstancedMesh: thân + bông) ----------
  const NF = 89, stemG = new THREE.CylinderGeometry(0.025, 0.035, 0.5, 5).translate(0, 0.25, 0), bloomG = new THREE.IcosahedronGeometry(0.13, 0).scale(1, 0.55, 1).translate(0, 0.52, 0);
  const stems = new THREE.InstancedMesh(stemG, new THREE.MeshLambertMaterial({ color: '#4f9a3c' }), NF), blooms = new THREE.InstancedMesh(bloomG, new THREE.MeshLambertMaterial({ color: '#ffffff' }), NF);
  for (const m of [stems, blooms]) { m.count = 0; m.frustumCulled = false; scene.add(m); }
  const flowers = Array.from({ length: NF }, () => ({ t: -1, x: 0, y: 0, z: 0, s: 1, r: 0 })); let flI = 0, flAlive = 0;
  const PETAL = ['#ff6fae', '#ffd34d', '#ffffff', '#a78bfa', '#ff9f43', '#5ac8fa', '#ff5a4e'];
  function growAt(x, z, seed) {
    let n = 0;
    for (let k = 0; k < 8; k++) {   // 8 bông theo góc vàng 137,5°
      const a = k * 2.39996 + seed, r = 0.4 + Math.sqrt(k) * 0.62, fx = x + Math.cos(a) * r, fz = z + Math.sin(a) * r, gy = ground(fx, fz);
      if (gy < W + 0.05) continue;
      const F = flowers[flI = (flI + 1) % NF]; Object.assign(F, { t: 0, x: fx, y: gy, z: fz, s: 0.8 + ((k * 7 + seed * 13) % 5) / 8, r: a, life: 89 });
      blooms.setColorAt(flI, col.set(PETAL[(k + Math.floor(seed * 10)) % PETAL.length])); n++;
    }
    if (blooms.instanceColor) blooms.instanceColor.needsUpdate = true;
    return n;
  }
  const om = new THREE.Object3D();
  const zero = (...ms) => { om.scale.setScalar(0); om.updateMatrix(); for (const m of ms) for (let i = 0; i < m.instanceMatrix.count; i++) m.setMatrixAt(i, om.matrix); };   // ô chưa dùng: thu nhỏ 0 (không hiện ở gốc toạ độ)
  zero(stems, blooms);
  function updFlowers(dt) {
    let alive = 0;
    for (let i = 0; i < NF; i++) {
      const F = flowers[i]; if (F.t < 0) { if (flAlive) { om.scale.setScalar(0); om.updateMatrix(); stems.setMatrixAt(i, om.matrix); blooms.setMatrixAt(i, om.matrix); } continue; }
      F.t += dt; if (F.t > F.life) { F.t = -1; continue; } alive++;
      const k = Math.min(1, F.t / 1.3), e = 1 - (1 - k) ** 3, out = Math.min(1, (F.life - F.t) / 3), s = F.s * e * out;
      om.position.set(F.x, F.y, F.z); om.rotation.set(0, F.r, Math.sin(F.t * 1.3 + F.r) * 0.08); om.scale.set(s, s, s); om.updateMatrix(); stems.setMatrixAt(i, om.matrix); blooms.setMatrixAt(i, om.matrix);
    }
    if (alive || flAlive) { stems.count = blooms.count = NF; stems.instanceMatrix.needsUpdate = blooms.instanceMatrix.needsUpdate = true; }
    if (!alive) stems.count = blooms.count = 0; flAlive = alive;
  }

  // ---------- 🌬️ GỌI GIÓ: đẩy vật nhẹ trong hình nón trước mặt ----------
  function windFrom(p, fwx, fwz) {
    let n = 0;
    for (const b of (ctx.physics && ctx.physics.bodies) || []) {
      if (b.dead) continue; const dx = b.pos.x - p.x, dz = b.pos.z - p.z, d = Math.hypot(dx, dz); if (d > 13 || d < 0.1) continue;
      if ((dx * fwx + dz * fwz) / d < 0.64) continue;   // nón ±50°
      const k = (1 - d / 13) * 11 / Math.sqrt(Math.max(0.05, b.K.m)); b.vel.x += fwx * Math.min(13, k); b.vel.z += fwz * Math.min(13, k); b.vel.y += Math.min(4, k * 0.3); b.sleep = false; b.still = 0; n++;
    }
    for (let k = 0; k < 4; k++) magic.burst(tmp.set(p.x + fwx * k * 2, p.y + 1 + k * 0.2, p.z + fwz * k * 2), tmp2.set(fwx, 0.08, fwz), '#e8f6ff', 8, 13, 0.18);
    return n;
  }

  // ---------- 🧊 ĐÓNG BĂNG NƯỚC: cầu băng tạm qua mặt nước (đi được nhờ ctx.groundExtra) ----------
  const NI = 144, iceM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.5, 1.05), new THREE.MeshLambertMaterial({ color: '#cdefff', transparent: true, opacity: 0.86, emissive: '#3a6f8a', emissiveIntensity: 0.25 }), NI);
  iceM.count = 0; iceM.frustumCulled = false; iceM.receiveShadow = true; scene.add(iceM); zero(iceM);
  const bridges = [];   // { x, z, dx, dz, len, w, t, life, i0, n }
  const ICE_TOP = W + 0.3, ICE_LIFE = 34; let iceI = 0;
  function planBridge(x, z, dx, dz) {   // tìm nước trong 8 m trước mặt, cầu dài tới bờ bên kia (tối đa 34 m)
    let s0 = -1;
    for (let s = 0; s <= 8; s += 0.5) if (ctx.terrain.heightAt(x + dx * s, z + dz * s) < W - 0.15) { s0 = Math.max(0, s - 1.5); break; }
    if (s0 < 0) return null;
    let s1 = s0 + 34; for (let s = s0 + 3; s <= s0 + 34; s += 0.5) if (ctx.terrain.heightAt(x + dx * s, z + dz * s) > W + 0.1) { s1 = s + 1.5; break; }
    return { x: x + dx * s0, z: z + dz * s0, dx, dz, len: s1 - s0 };
  }
  function buildBridge(B) {
    if (bridges.length >= 3) dropBridge(bridges[0]);
    const n = Math.min(Math.ceil(B.len), 55); Object.assign(B, { w: 1.3, t: 0, life: ICE_LIFE, i0: iceI, n, warned: false }); iceI = (iceI + n) % NI; bridges.push(B);
    for (let k = 0; k < n; k++) iceM.setColorAt((B.i0 + k) % NI, col.set(k % 3 ? '#d8f4ff' : '#bfe8ff'));
    if (iceM.instanceColor) iceM.instanceColor.needsUpdate = true;
  }
  function dropBridge(B) { const k = bridges.indexOf(B); if (k >= 0) bridges.splice(k, 1); om.scale.setScalar(0); om.updateMatrix(); for (let j = 0; j < B.n; j++) iceM.setMatrixAt((B.i0 + j) % NI, om.matrix); iceM.instanceMatrix.needsUpdate = true; }
  const iceY = B => ICE_TOP - Math.max(0, 5 - (B.life - B.t)) * 0.13;   // 5 s cuối: băng tan, chìm dần (người trên cầu chuyển sang bơi — an toàn)
  const prevExtra = ctx.groundExtra;
  ctx.groundExtra = (x, z, y) => {
    let h = prevExtra ? prevExtra(x, z, y) : -99;
    for (const B of bridges) { const rx = x - B.x, rz = z - B.z, along = rx * B.dx + rz * B.dz, side = Math.abs(rx * B.dz - rz * B.dx); if (along > -0.3 && along < Math.min(B.n, B.t * 21) && side < B.w) h = Math.max(h, iceY(B)); }
    return h;
  };
  function updIce(dt) {
    if (!bridges.length) return;
    for (let i = bridges.length - 1; i >= 0; i--) {
      const B = bridges[i]; B.t += dt; if (B.t > B.life) { dropBridge(B); continue; }
      if (!B.warned && B.life - B.t < 5 && B.mine) { B.warned = true; ctx.toast('🧊 Cầu băng sắp tan! Băng gặp nắng ấm (trên 0 °C) sẽ chảy thành nước.', 4000); }
      const y = iceY(B), grow = Math.min(B.n, B.t * 21);
      for (let k = 0; k < B.n; k++) {
        const s = k < grow ? Math.min(1, grow - k) : 0, wob = Math.sin(k * 1.7) * 0.06;
        om.position.set(B.x + B.dx * (k + 0.5), y - 0.25, B.z + B.dz * (k + 0.5)); om.rotation.set(0, Math.atan2(B.dx, B.dz) + wob, 0); om.scale.set(B.w * 2 * s, s, s); om.updateMatrix(); iceM.setMatrixAt((B.i0 + k) % NI, om.matrix);
      }
    }
    iceM.count = NI; iceM.instanceMatrix.needsUpdate = true;
  }

  // ---------- 🤝 NÂNG BẠN: được nâng lên cao vài giây rồi hạ xuống nhẹ nhàng ----------
  let lifted = null;   // { t, y }
  function getLifted(by) {
    if (lifted || player.vehicle) return; lifted = { t: 0, y: 0, dur: 5.5 }; ctx.toast(`🤝 <b>${by || 'Một bạn'}</b> niệm <b>Nâng Bạn!</b> — em bay lên nhẹ nhàng rồi sẽ hạ xuống an toàn.`, 4000);
    magic.burst(player.pos.clone().setY(player.pos.y + 0.5), UP, '#ffe3a0', 21, 3, 1);
  }
  function updLifted(dt) {
    if (!lifted) return; lifted.t += dt; const L = lifted, g = ground(player.pos.x, player.pos.z, player.pos.y + 0.5);
    const goal = L.t < L.dur ? 3.4 + Math.sin(L.t * 2.6) * 0.15 : 0; L.y += (goal - L.y) * Math.min(1, dt * (L.t < L.dur ? 1.6 : 1.3));
    if (player.vehicle || (L.t > L.dur && L.y < 0.04)) { player.hover = null; lifted = null; return; }
    player.hover = g + L.y; if (Math.random() < dt * 5) magic.burst(tmp.copy(player.pos), UP, '#ffe3a0', 2, 1, 1);
  }

  // ---------- 🧥 ÁO CHOÀNG TÀNG HÌNH: gợn sóng mờ (shader nhỏ, chỉ hiện khi lại gần) ----------
  const rippleMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { t: { value: 0 }, a: { value: 0 } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; varying float vY; uniform float t; void main(){ vec3 p = position; p += normal * sin(position.y * 9.0 + t * 4.0) * 0.03; vec4 mv = modelViewMatrix * vec4(p,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vY = position.y; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying vec3 vN; varying vec3 vV; varying float vY; uniform float t; uniform float a; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.6); float w = 0.5 + 0.5 * sin(vY * 13.0 - t * 5.0); gl_FragColor = vec4(vec3(0.75,0.88,1.0) * f * (0.55 + 0.45 * w) * a, 1.0); }',
  });
  const rippleGeo = new THREE.CapsuleGeometry(0.42, 1.0, 4, 10).translate(0, 0.95, 0);
  const ripples = new Map();   // id → mesh
  const ripple = id => { let m = ripples.get(id); if (!m) { m = new THREE.Mesh(rippleGeo, rippleMat.clone()); m.frustumCulled = false; scene.add(m); ripples.set(id, m); } return m; };
  function updCloak(dt) {
    const t = performance.now() / 1000;
    if (ctx.net) for (const [id, o] of ctx.net.others) {
      const hid = !!o.cloak; if (o.h.root.visible === hid) o.h.root.visible = !hid;
      if (!hid) { const m = ripples.get(id); if (m) m.visible = false; continue; }
      const d = o.h.root.position.distanceTo(player.pos), m = ripple(id), a = Math.max(0, 1 - d / 8) * 0.55;
      m.visible = a > 0.01; m.position.copy(o.h.root.position); m.material.uniforms.t.value = t; m.material.uniforms.a.value = a;
    }
    for (const [id, m] of ripples) if (id !== 'me' && !(ctx.net && ctx.net.others.has(id))) { scene.remove(m); m.material.dispose(); ripples.delete(id); }
    const me = st.cloak ? ripple('me') : ripples.get('me');
    if (me) { me.visible = st.cloak; me.position.copy(player.pos); me.material.uniforms.t.value = t; me.material.uniforms.a.value = 0.8; }
  }

  // ---------- đăng ký / bổ sung phép ----------
  const remotes = {};
  function register(def) {
    const s = magic.getSpell(def.id);
    const S = Object.assign(s || { subjects: ['khoahoc'], learn: '' }, def);
    if (def.remote) remotes[def.id] = def.remote;
    return magic.addSpell(S);
  }
  const patch = (id, def) => { const s = magic.getSpell(id); if (s) { if (def.cast && s.cast) delete def.cast; Object.assign(s, def); if (def.remote) remotes[id] = def.remote; } else register({ id, ...def }); };
  patch('light', { name: 'Sáng lên', say: 'Sáng Lên!', order: 1, cd: 2.6 });
  patch('lift', { name: 'Bay lên', say: 'Bay Lên!', order: 0, cd: 2.6, learn: 'làm vật lơ lửng rồi thả cho trọng lực kéo xuống (Vật lý).',
    cast(api) {
      const f = nearestFloatable(api.from, api.fw, api.aim); if (!f) { api.toast('🪶 Không có đồ vật nào gần để <b>Bay Lên</b>. Thử nhắm vào quả bóng, thùng gỗ, hòn đá hoặc một người bạn trong thị trấn.', 3500); return false; }
      startFloat(f, 'me'); const p = f.kind === 'body' ? f.o.pos : f.o.hero.model.position; api.aim = p.clone();
      api.share = f.kind === 'body' ? { b: bodyKey(f.o) } : { n: f.o.a.id };
      api.toast(f.kind === 'body' ? '🪶 <b>Bay Lên!</b> Vật lơ lửng theo đũa em. Hết phép, <b>trọng lực</b> kéo nó rơi xuống.' : '🪶 <b>Bay Lên!</b> Bạn ấy lơ lửng cười khúc khích rồi được hạ xuống nhẹ nhàng.', 3500);
    },
    remote(d, c) { if (d.b) { const b = findBody(d.b); if (b) startFloat({ kind: 'body', o: b }, c); } else if (d.n != null) { const e = (ctx.townPeople || []).find(x => x.a && x.a.id === d.n); if (e) startFloat({ kind: 'npc', o: e }, c); } } });
  patch('unlock', { name: 'Mở ra', say: 'Mở Ra!', order: 6, cd: 2.6 });
  patch('grow', { name: 'Mọc lên', say: 'Mọc Lên!', order: 2, cd: 3.4,
    cast(api) {
      const seed = Math.random() * 6, n = growAt(api.aim.x, api.aim.z, seed); if (!n) { api.toast('🌱 Hoa không mọc trên mặt nước — hãy nhắm vào đất nhé!', 3000); return false; }
      api.share = { p: [+api.aim.x.toFixed(2), +api.aim.z.toFixed(2)], s: +seed.toFixed(3) };
      api.toast('🌱 <b>Mọc Lên!</b> Cây cần <b>ánh sáng, nước, không khí và đất</b> để lớn. Hoa xếp theo góc vàng 137,5° giống hạt hướng dương!', 4500);
    }, remote(d) { if (d.p) growAt(d.p[0], d.p[1], d.s || 0); } });
  patch('wind', { name: 'Gọi gió', say: 'Gọi Gió!', order: 3, cd: 2.6,
    cast(api) { const n = windFrom(player.pos, api.fw.x, api.fw.z); api.share = { f: [+api.fw.x.toFixed(3), +api.fw.z.toFixed(3)] }; api.toast(`🌬️ <b>Gọi Gió!</b> ${n ? 'Gió đẩy đồ vật bay đi — vật càng nhẹ bay càng xa.' : 'Gió là không khí chuyển động, đi từ nơi áp suất cao tới nơi áp suất thấp.'}`, 3500); },
    remote(d, c) { if (d.f && casterPos(c, tmp)) windFrom(tmp.clone(), d.f[0], d.f[1]); } });
  patch('stars', { name: 'Soi sao', say: 'Soi Sao!', order: 9, unlocked: () => !!(ctx.academy && ctx.academy.loaded) });
  register({ id: 'freeze', name: 'Đóng băng nước', icon: '🧊', say: 'Đóng Băng Nước!', order: 4, cost: 21, cd: 8, subjects: ['khoahoc'], learn: 'biến mặt nước thành cầu băng tạm (nước đông đặc ở 0 °C).',
    cast(api) {
      const B = planBridge(player.pos.x, player.pos.z, api.fw.x, api.fw.z); if (!B) { api.toast('🧊 Hãy đứng ở <b>bờ nước</b> và nhìn ra mặt nước để niệm <b>Đóng Băng Nước</b>.', 3500); return false; }
      B.mine = true; buildBridge(B); api.aim = new THREE.Vector3(B.x + B.dx * 3, ICE_TOP, B.z + B.dz * 3);
      api.share = { s: [+B.x.toFixed(2), +B.z.toFixed(2), +B.dx.toFixed(3), +B.dz.toFixed(3), +B.len.toFixed(1)] };
      api.toast(`🧊 <b>Đóng Băng Nước!</b> Cầu băng dài ${Math.round(B.len)} m, tan sau ${ICE_LIFE} giây. Băng <b>nhẹ hơn nước</b> nên nổi — vì vậy hồ đóng băng từ mặt xuống.`, 5000);
    }, remote(d) { if (d.s) buildBridge({ x: d.s[0], z: d.s[1], dx: d.s[2], dz: d.s[3], len: Math.min(34, d.s[4]) }); } });
  register({ id: 'liftfriend', name: 'Nâng bạn', icon: '🤝', say: 'Nâng Bạn!', order: 5, cost: 13, cd: 8, subjects: ['khoahoc'], learn: 'nâng một người bạn (đã cho phép) bay lên vài giây.',
    cast(api) {
      const N = net(); if (!N) { api.toast('🤝 <b>Nâng Bạn</b> cần chơi trực tuyến cùng bạn bè (đang chơi một mình).', 3500); return false; }
      let best = null, bd = 13;
      for (const [id, o] of N.others) { if (o.cloak) continue; const p = o.h.root.position, d = p.distanceTo(player.pos); if (d < bd && (d < 2.5 || ((p.x - player.pos.x) * api.fw.x + (p.z - player.pos.z) * api.fw.z) / d > 0.5)) { bd = d; best = [id, o]; } }
      if (!best) { api.toast('🤝 Không có bạn nào ở gần trước mặt (trong 13 m).', 3000); return false; }
      if (!best[1].liftOk) { api.toast(`🤝 <b>${best[1].name}</b> chưa bật <b>🤝 Cho bạn nâng mình</b> — phải được bạn đồng ý mới nâng được nhé!`, 4000); return false; }
      N.send('liftReq', { to: best[0] }); api.aim = best[1].h.root.position.clone().setY(best[1].h.root.position.y + 1);
      api.toast(`🤝 <b>Nâng Bạn!</b> ${best[1].name} bay lên rồi sẽ hạ xuống nhẹ nhàng.`, 3000);
    } });
  const hookOr = (key, msg) => api => { const h = ctx.spells.hooks[key]; if (typeof h === 'function') return h(api); window.dispatchEvent(new CustomEvent('spell:' + key, { detail: api })); api.toast(msg, 3500); };
  register({ id: 'broom', name: 'Gọi chổi', icon: '🧹', say: 'Gọi Chổi!', order: 7, cost: 8, cd: 5, learn: 'gọi chổi bay tới (sắp có).', cast: hookOr('broom', '🧹 <b>Gọi Chổi!</b> Chổi bay đang được các thầy cô chế tạo — sắp có nhé!') });
  register({ id: 'build', name: 'Dựng lên', icon: '🏗️', say: 'Dựng Lên!', order: 8, cost: 8, cd: 5, learn: 'mở chế độ xây nhà (sắp có).', cast: hookOr('build', '🏗️ <b>Dựng Lên!</b> Chế độ xây nhà sắp mở — chuẩn bị ý tưởng ngôi nhà mơ ước nhé!') });

  // ---------- sau mỗi lần niệm: hô, tia sáng, gửi mạng ----------
  magic.onCast((s, api, ok) => {
    if (!ok) return;
    const say = s.say || s.name + '!'; flyText(`${s.icon} ${say}`, api.color, 'me'); speak(say);
    shoot(api.from, api.aim || api.from, api.color);
    const N = net(); if (N) N.send('spell', { s: s.id, a: [+api.aim.x.toFixed(2), +api.aim.y.toFixed(2), +api.aim.z.toFixed(2)], c: api.color, x: api.share || undefined });
  });

  // ---------- HUD: 🔊 giọng hô, 🤝 cho bạn nâng ----------
  const hud = magic.hud;
  const bVoice = document.createElement('button'); bVoice.title = 'Giọng hô thần chú'; const paintV = () => { bVoice.textContent = st.voice ? '🔊' : '🔇'; bVoice.setAttribute('aria-pressed', st.voice); }; paintV();
  bVoice.onclick = () => { st.voice = !st.voice; save('spells.voice', st.voice); paintV(); ctx.toast(st.voice ? (viVoice ? '🔊 Nhân vật sẽ hô to tên phép.' : '🔊 Máy chưa có giọng tiếng Việt — em sẽ nghe âm phép thuật và thấy chữ bay lên.') : '🔇 Đã tắt giọng hô thần chú.', 3000); };
  const bLift = document.createElement('button'); bLift.title = 'Cho bạn nâng mình (phép Nâng Bạn)'; const paintL = () => { bLift.textContent = st.liftOk ? '🤝✓' : '🤝'; bLift.setAttribute('aria-pressed', st.liftOk); }; paintL();
  bLift.onclick = () => { st.liftOk = !st.liftOk; save('spells.liftOk', st.liftOk); paintL(); const N = net(); N && N.send('perm', { liftOk: st.liftOk }); ctx.toast(st.liftOk ? '🤝 Đã bật: bạn bè được dùng <b>Nâng Bạn!</b> nâng em lên (hạ xuống an toàn).' : '🤝 Đã tắt: không ai nâng được em.', 3500); };
  hud.append(bVoice, bLift);

  // ---------- chủ game: đăng nhập mã + áo choàng ----------
  const menu = document.getElementById('moreMenu');
  const bAdmin = document.createElement('button'); bAdmin.textContent = '🗝️ Chủ game'; bAdmin.hidden = true;
  const bCloak = document.createElement('button'); bCloak.hidden = true; const paintC = () => { bCloak.textContent = st.cloak ? '🧥 Áo tàng hình: BẬT' : '🧥 Áo choàng tàng hình'; };
  if (menu) menu.append(bAdmin, bCloak);
  bAdmin.onclick = () => { const N = net(); if (!N) return ctx.toast('🗝️ Cần kết nối server để đăng nhập chủ game.', 3000); const k = prompt('Nhập mã chủ game:'); if (k) { try { sessionStorage.setItem('spells.admin', k); } catch (e) {} N.send('admin', { key: k.trim() }); } };
  bCloak.onclick = () => { const N = net(); if (!N || !st.admin) return; st.cloak = !st.cloak; paintC(); N.send('cloak', { on: st.cloak }); ctx.toast(st.cloak ? '🧥 <b>Áo choàng tàng hình</b> đã bật: người khác không thấy em (chỉ gợn sóng mờ khi lại gần).' : '🧥 Đã cởi áo choàng: mọi người lại thấy em.', 4000); };
  paintC();

  // ---------- mạng ----------
  if (ctx.net && ctx.net.on) {
    const N = ctx.net;
    N.on('connect', () => {
      bAdmin.hidden = false; st.admin = false; st.cloak = false; paintC(); bCloak.hidden = true;
      N.send('perm', { liftOk: st.liftOk }); let k = null; try { k = sessionStorage.getItem('spells.admin'); } catch (e) {} if (k) N.send('admin', { key: k, quiet: true });
    });
    N.on('disconnect', () => { bAdmin.hidden = bCloak.hidden = true; st.cloak = false; });
    N.on('admin', d => {
      st.admin = !!(d && d.ok); bCloak.hidden = !st.admin; bAdmin.hidden = st.admin;
      if (!st.admin) { try { sessionStorage.removeItem('spells.admin'); } catch (e) {} }
      if (!d || !d.quiet) ctx.toast(st.admin ? '🗝️ Đã đăng nhập <b>chủ game</b>. Mở ☰ để mặc <b>🧥 áo choàng tàng hình</b>.' : '🗝️ Mã chủ game không đúng.', 3500);
    });
    N.on('lifted', d => getLifted(d && d.name));
    N.on('spell', d => {
      const o = d && N.others.get(d.id); if (!o || !d.a) return; const s = magic.getSpell(d.s);
      tmp.copy(o.h.root.position).y += 1.25; tmp2.set(d.a[0], d.a[1], d.a[2]); const c = /^#[0-9a-f]{6}$/i.test(d.c) ? d.c : '#ffe3a0';
      if (!o.cloak) { magic.burst(tmp, tmp2.clone().sub(tmp).normalize(), c, 13, 6, 0.25); shoot(tmp, tmp2, c); if (s) { flyText(`${s.icon} ${s.say || s.name}`, c, o); if (o.h.root.position.distanceTo(player.pos) < 13) speak(s.say || s.name, 0.618); } }
      if (d.x && remotes[d.s]) { try { remotes[d.s](d.x, o); } catch (e) { console.warn(e); } }
    });
  }

  function update(dt) {
    if (beamT > 0) { beamT -= dt; beam.material.opacity = Math.max(0, beamT / 0.382) * 0.9; if (beamT <= 0) beam.visible = false; }
    updFlies(dt); updFloats(dt); updFlowers(dt); updIce(dt); updLifted(dt); updCloak(dt);
  }
  const api = { register, update, speak, flyText, hooks: {}, growAt, windFrom, get bridges() { return bridges; }, get floats() { return floats; }, getLifted, get state() { return st; } };
  return api;
}
