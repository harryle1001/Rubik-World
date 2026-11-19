// feel.js — "Cảm giác game" (juice): vệt gió khi bay nhanh · rung camera khi tiếp đất cao · đồng vàng bay vào HUD + chữ +XP · rung điện thoại
//   (tuỳ chọn, bảng 🎚️) · màn chuyển mượt khi vào/ra nhà, mini game, dịch chuyển xa · tên vùng mới hiện kiểu điện ảnh (khung đen trên/dưới).
//   (Bụi khi chạy: player.js · nước bắn khi lội: living.js — đã có, không làm trùng.) Thêm tối đa 1 draw call (vệt gió, chỉ khi bay nhanh).
import * as THREE from 'three';
import { BLOCKS, EXTRA, PHI } from './layout.js';

const VK = 'island.vibrate', SEEN = 'island.regions';
const N_STREAK = 89;   // Fibonacci

export function createFeel(ctx) {
  const { camera, scene, player } = ctx;
  // ---------- rung điện thoại (mặc định tắt) ----------
  let vib = false; try { vib = localStorage.getItem(VK) === '1'; } catch (e) {}
  ctx.vibrateOn = () => vib;
  ctx.setVibrate = v => { vib = !!v; try { localStorage.setItem(VK, vib ? '1' : '0'); } catch (e) {} if (vib) ctx.vibrate(34); };
  ctx.vibrate = p => { if (vib && navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} };

  // ---------- DOM: lớp hiệu ứng HUD ----------
  const css = document.createElement('style');
  css.textContent = `#fxLayer{position:fixed;inset:0;pointer-events:none;z-index:28;overflow:hidden}
.fxCoin{position:absolute;left:0;top:0;font-size:21px;will-change:transform,opacity;filter:drop-shadow(0 2px 3px #0008)}
.fxPop{position:absolute;left:50%;top:50%;transform:translate(-50%,0);font:900 26px/1 system-ui;color:#ffe27a;text-shadow:0 2px 0 #7a4a00,0 0 13px #ffb30088;white-space:nowrap;animation:fxPop 1.618s cubic-bezier(.2,.8,.3,1) forwards}
.fxPop.xp{color:#9ff0ff;text-shadow:0 2px 0 #134a66,0 0 13px #3cd0ff88}.fxPop.lv{font-size:34px;color:#fff;text-shadow:0 2px 0 #a8326a,0 0 21px #ff6fb5}
@keyframes fxPop{0%{opacity:0;transform:translate(-50%,13px) scale(.6)}14%{opacity:1;transform:translate(-50%,0) scale(1.15)}24%{transform:translate(-50%,0) scale(1)}75%{opacity:1}100%{opacity:0;transform:translate(-50%,-55px) scale(1)}}
#fxVeil{position:fixed;inset:0;background:#0b0f1c;opacity:0;pointer-events:none;z-index:40;transition:opacity .236s ease-out}
.fxBar{position:fixed;left:0;right:0;height:9vh;background:#000;z-index:25;pointer-events:none;transition:transform .618s cubic-bezier(.4,0,.2,1)}
#fxBarT{top:0;transform:translateY(-100%)}#fxBarB{bottom:0;transform:translateY(100%)}body.fxCine #fxBarT,body.fxCine #fxBarB{transform:none}
#fxRegion{position:fixed;left:0;right:0;top:32%;text-align:center;z-index:31;pointer-events:none;color:#fff;opacity:0;transition:opacity .618s}
#fxRegion small{display:block;font:600 13px/1 system-ui;letter-spacing:.38em;text-transform:uppercase;color:#ffe2a8;margin-bottom:10px}
#fxRegion b{display:inline-block;font:700 clamp(26px,6.18vw,47px)/1.15 Georgia,'Times New Roman',serif;letter-spacing:.03em;text-shadow:0 3px 13px #000a;padding:0 21px 10px;border-bottom:1px solid #ffe2a8aa}
body.fxCine #fxRegion{opacity:1}body.rs-modal #fxRegion,body.fxPhoto #fxRegion,body.fxPhoto .fxBar{display:none}`;
  document.head.appendChild(css);
  const layer = document.createElement('div'); layer.id = 'fxLayer'; document.body.appendChild(layer);
  const veil = document.createElement('div'); veil.id = 'fxVeil'; document.body.appendChild(veil);
  for (const id of ['fxBarT', 'fxBarB']) { const b = document.createElement('div'); b.id = id; b.className = 'fxBar'; document.body.appendChild(b); }
  const reg = document.createElement('div'); reg.id = 'fxRegion'; document.body.appendChild(reg);

  // ---------- đồng vàng bay vào ví HUD + chữ +XP ----------
  const v3 = new THREE.Vector3();
  const playerScreen = () => { v3.copy(player.pos); v3.y += 1.6; v3.project(camera); return [(v3.x + 1) / 2 * innerWidth, (1 - v3.y) / 2 * innerHeight]; };
  function pop(text, cls = '') { const e = document.createElement('div'); e.className = 'fxPop ' + cls; e.textContent = text; layer.appendChild(e); setTimeout(() => e.remove(), 1700); }
  function coins(n) {
    if (ctx.eco) return ctx.eco.fly('gold', n, null, true);   // ví 🪙/💎 (economy/wallet.js)
    const t = document.getElementById('accChip'), r = t && t.getBoundingClientRect(); if (!r || !r.width) return;
    const [sx, sy] = playerScreen(), tx = r.right - 21, ty = r.top + r.height / 2, k = Math.min(13, Math.max(3, n));
    for (let i = 0; i < k; i++) {
      const e = document.createElement('div'); e.className = 'fxCoin'; e.textContent = '🪙'; layer.appendChild(e);
      const a = i * 2.39996, d = 21 + (i % 3) * 13, mx = sx + Math.cos(a) * d, my = sy + Math.sin(a) * d - 21;   // tung ra theo góc vàng rồi hút vào chip xu
      const an = e.animate([{ transform: `translate(${sx}px,${sy}px) scale(.4)`, opacity: 0 }, { transform: `translate(${mx}px,${my}px) scale(1.1)`, opacity: 1, offset: 0.3 }, { transform: `translate(${tx}px,${ty}px) scale(.7)`, opacity: 0.9 }],
        { duration: 618 + i * 55, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
      an.onfinish = () => { e.remove(); if (i === k - 1 && t.animate) t.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.13)' }, { transform: 'scale(1)' }], { duration: 236 }); };
    }
  }
  // tự bắt mọi lần cộng đồng vàng / kinh nghiệm / lên cấp (data/account.js) → không phải sửa từng nơi thưởng
  const reward0 = ctx.reward;   // thưởng ⭐ kiểu cũ ctx.reward(số sao, ghi chú) của teacher-quiz.js: giữ nguyên, không ghi đè mất
  ctx.reward = (o = {}, note) => { if (typeof o === 'number') { reward0 && reward0(o, note); return; } if (o.coins) { coins(o.coins); pop('+' + o.coins + ' 🪙'); } if (o.xp) setTimeout(() => pop('+' + o.xp + ' XP', 'xp'), o.coins ? 380 : 0); ctx.vibrate([21, 34, 21]); };
  let last = null;
  const watch = acc => {
    const p = acc.profile; if (!p) { last = null; return; }
    const now = { m: p.money | 0, e: p.exp | 0, l: p.level | 0 };
    if (last && acc.name === last.n) {
      const dm = now.m - last.m, dl = now.l - last.l, de = dl > 0 ? now.e + 1 : now.e - last.e;
      if (dm > 0) { coins(dm); pop('+' + dm + ' 🪙'); ctx.sfx && ctx.sfx('coin'); }
      if (de > 0) setTimeout(() => pop('+' + de + ' XP', 'xp'), dm > 0 ? 380 : 0);
      if (dl > 0) setTimeout(() => { pop('⭐ Lên cấp ' + now.l + '!', 'lv'); ctx.sfx && ctx.sfx('open'); }, 760);
      if (dm > 0 || de > 0) ctx.vibrate(dl > 0 ? [34, 55, 34, 55, 89] : [21, 34, 21]);
    }
    last = Object.assign(now, { n: acc.name });
  };
  const hook = setInterval(() => { if (!ctx.account) return; clearInterval(hook); ctx.account.onChange(watch); watch(ctx.account); }, 500);

  // ---------- vệt gió khi bay nhanh: 89 đoạn thẳng trong không gian camera, chạy trên GPU (1 draw call, ẩn khi không bay) ----------
  const ga = new Float32Array(N_STREAK * 2 * 4);
  for (let i = 0; i < N_STREAK; i++) { const a = i * 2.39996, r = 0.9 + (i * 0.618 % 1) * 2.2, ph = Math.random(); for (let e = 0; e < 2; e++) ga.set([Math.cos(a) * r, Math.sin(a) * r * 0.62, ph, e], (i * 2 + e) * 4); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N_STREAK * 6), 3)); sg.setAttribute('a', new THREE.BufferAttribute(ga, 4));
  const SU = { uT: { value: 0 }, uOp: { value: 0 }, uLen: { value: 2 } };
  const streak = new THREE.LineSegments(sg, new THREE.ShaderMaterial({ uniforms: SU, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute vec4 a; uniform float uT, uLen; varying float vA;
      void main(){ float L = 21., z = mod(a.z * L + uT, L); vec3 p = vec3(a.xy * (1. + z * .13), -z - 1.3 + a.w * uLen); vA = (1. - a.w * .9) * smoothstep(0., 3., z) * smoothstep(L, L - 5., z);
        gl_Position = projectionMatrix * vec4(p, 1.); }`,
    fragmentShader: 'uniform float uOp; varying float vA; void main(){ gl_FragColor = vec4(vec3(.92,.97,1.), vA * uOp); }' }));
  streak.frustumCulled = false; streak.visible = false; streak.renderOrder = 999; scene.add(streak);

  // ---------- tên vùng (khu chính có tên + đảo khác qua ctx.zoneAt) ----------
  const regionAt = (x, z) => { const zr = BLOCKS.find(b => x > b.r[0] && x < b.r[2] && z > b.r[1] && z < b.r[3]) || EXTRA.find(e => x > e.r[0] && x < e.r[2] && z > e.r[1] && z < e.r[3]); return zr ? zr.name : ctx.zoneAt ? ctx.zoneAt(x, z) : null; };
  ctx.regionAt = regionAt;
  let seen = {}; try { seen = JSON.parse(localStorage.getItem(SEEN) || '{}'); } catch (e) {}
  let curReg = undefined, candReg = null, candT = 0, cineT = 0;
  function cinema(name) {
    const first = !seen[name]; seen[name] = 1; try { localStorage.setItem(SEEN, JSON.stringify(seen)); } catch (e) {}
    reg.innerHTML = `<small>${first ? '✦ Vùng mới khám phá ✦' : 'Bạn đang ở'}</small><b></b>`; reg.querySelector('b').textContent = name;
    document.body.classList.add('fxCine'); cineT = first ? 4.236 : 2.618;
    if (first && ctx.note) [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => ctx.note(f, 0.07, 1.3), i * 144));   // hợp âm rải chào vùng mới
  }

  // ---------- cập nhật ----------
  let vyPrev = 0, shake = 0, t = 0, veilT = 0, mgPrev = null, inPrev = null; let mv = 0; const lastP = new THREE.Vector3().copy(player.pos), lastCam = new THREE.Vector3().copy(camera.position), q = new THREE.Quaternion(), e3 = new THREE.Euler();
  const transition = () => { veil.style.transition = 'none'; veil.style.opacity = 1; veilT = 0.146; };
  function update(dt) {
    t += dt;
    // màn chuyển: camera nhảy xa (vào nhà, lên tầng, dịch chuyển) hoặc vào/ra mini game, toà nhà → che tối rồi mở dần (~0,4 s)
    const mgk = ctx.mgActive || null, ink = ctx.indoor ? ctx.indoor.floor : null;
    if (camera.position.distanceToSquared(lastCam) > 21 * 21 || mgk !== mgPrev || ink !== inPrev) transition();
    mgPrev = mgk; inPrev = ink; lastCam.copy(camera.position);
    if (veilT > 0 && (veilT -= dt) <= 0) { veil.style.transition = 'opacity .382s ease-out'; veil.style.opacity = 0; }
    // rung camera khi tiếp đất từ trên cao (xoay nhẹ, không dời vị trí → không lẫn với camera bám nhân vật)
    const vy = player.vy, p = player.pos;
    if (vyPrev < -10 && vy > -0.5 && !player.vehicle && ctx.terrain.heightAt(p.x, p.z) > 0.2) { const k = Math.min(1, (-vyPrev - 10) / 13); shake = Math.max(shake, 0.009 + k * 0.022); ctx.vibrate(Math.round(21 + k * 34)); }
    vyPrev = vy;
    if (shake > 1e-4 && !ctx.photoMode) {
      e3.set(Math.sin(t * 61) * shake, Math.sin(t * 47 + 1.3) * shake * 0.618, Math.sin(t * 73 + 2.1) * shake * 0.382); camera.quaternion.multiply(q.setFromEuler(e3)); shake *= Math.exp(-dt * 13);
    }
    // vệt gió: bay nhanh (máy bay, khinh khí cầu, chổi…) ≥ 21 m/s
    // tốc độ thật theo vị trí (máy bay tự dời nhân vật, player.speed = 0) → ctx.moveSpeed dùng chung (audio.js: gió, lớp nhịp)
    if (dt > 0) { const d = Math.hypot(p.x - lastP.x, p.y - lastP.y, p.z - lastP.z) / dt; mv += ((d > 200 ? mv : d) - mv) * Math.min(1, dt * 5); } lastP.copy(p); if (!Number.isFinite(mv)) mv = 0; ctx.moveSpeed = mv;
    const V = player.vehicle, sp = mv, want = V && V.fly && !ctx.photoMode ? Math.min(1, Math.max(0, (sp - 21) / 21)) : 0;
    SU.uOp.value += (want * 0.55 - SU.uOp.value) * Math.min(1, dt * 3); streak.visible = SU.uOp.value > 0.01;
    if (streak.visible) { SU.uT.value += dt * (13 + sp * 0.618); SU.uLen.value = 0.8 + Math.min(3, sp / 21); }
    // vùng mới: giữ ổn định 1 s rồi mới hiện (không nháy khi đi dọc mép)
    if (cineT > 0 && (cineT -= dt) <= 0) document.body.classList.remove('fxCine');
    if ((candT -= dt) <= 0) {
      candT = 0.5; const r = ctx.indoor || ctx.mgActive ? curReg : regionAt(p.x, p.z);
      if (r !== curReg) { if (r === candReg) { if (curReg !== undefined && r && !document.querySelector('#tut:not([hidden])') && !document.body.classList.contains('rs-modal')) cinema(r); curReg = r; } candReg = r; } else candReg = r;
    }
  }
  return { update, pop, coins, transition, cinema, regionAt, streak };
}
