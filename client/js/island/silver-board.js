// silver-board.js — VÁN BẠC BAY (thiết kế nguyên bản): tấm ván lướt hình giọt nước thuôn dài, mặt bạc như gương phản chiếu bầu trời,
// viền phát sáng theo màu nhà / màu tự chọn. Gọi bằng nút 🏄 (phím U): đứng tư thế lướt sóng, bay là là mặt đất/mặt nước và lên cao được,
// nghiêng ván khi cua, lướt biển để lại vệt nước bạc, bay cao để lại vệt sáng, nhào lộn (Q lộn vòng · Z xoay 360°).
// Tỷ lệ: dài φ² ≈ 2,6 m · lơ lửng 1/φ m · tốc độ 21 → 34 m/s · leo 8 m/s · trần 144 m · vệt 34 đốt · bụi nước 34 hạt (Fibonacci).
// Rẻ cho điện thoại: 1 hình ván dùng chung, gương = envMap 64×32 vẽ từ màu trời (không chụp lại cảnh), cả ván + vệt + bụi = 4 draw call.
import * as THREE from 'three';
import { T, damp, dampV3, ease } from './motion.js';
import { CFG } from './config.js';
import { PHI } from './layout.js';
import { ridePose, rideReset } from './ride-pose.js';
import { HOUSE } from './academy/houses-data.js';

const HOV = 1 / PHI, V_CRUISE = 21, V_BOOST = 34, CLIMB = 8, CEIL = 144, RANGE = 440, STANCE = -1.1, CROUCH = 0.13;
// màu viền + vệt sáng: mở khoá bằng điểm cúp đua ván (🥇 3 · 🥈 2 · 🥉 1 mỗi đường)
export const BOARD_COLORS = [
  { id: 'house', name: 'Màu nhà', col: null, need: 0 }, { id: 'moon', name: 'Bạc trăng', col: '#bfe6ff', need: 0 },
  { id: 'jade', name: 'Ngọc biển', col: '#3fe0b8', need: 1 }, { id: 'gold', name: 'Vàng φ', col: '#ffd24a', need: 2 },
  { id: 'rose', name: 'Hồng san hô', col: '#ff6fa8', need: 3 }, { id: 'violet', name: 'Tím pha lê', col: '#a98bff', need: 5 },
  { id: 'rainbow', name: 'Cầu vồng', col: 'rainbow', need: 8 },
];
// thẻ kiến thức (hiện đúng lúc người chơi vừa trải nghiệm hiện tượng)
export const CARDS = {
  mirror: ['🪞 Phản xạ ánh sáng', 'Mặt ván nhẵn bóng như <b>gương</b>: tia sáng tới bật lại với <b>góc phản xạ = góc tới</b>, nên em thấy cả bầu trời và mây in trên ván.'],
  inertia: ['🧊 Quán tính', 'Thả ga rồi mà ván <b>vẫn trôi tiếp</b>: mọi vật có xu hướng giữ nguyên chuyển động — đó là <b>quán tính</b>. Muốn dừng phải có lực hãm (kéo cần về sau).'],
  centri: ['🌀 Lực hướng tâm', 'Khi cua, ván <b>nghiêng vào trong</b> để có lực kéo về tâm vòng cua (<b>lực hướng tâm</b>). Cua càng nhanh, càng gấp thì lực cần càng lớn: F = m·v²/r.'],
};
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
export const cupPoints = () => Object.values(load('sb.cups', {})).reduce((s, p) => s + Math.max(0, 4 - p), 0);

// ván hình giọt nước: mũi tròn (+z), đuôi nhọn, mũi hơi vểnh
function boardGeo() {
  const g = new THREE.SphereGeometry(1, 21, 13); g.rotateX(Math.PI / 2);
  const p = g.attributes.position, L = PHI * PHI, Wd = 0.42;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = Math.max(-1, Math.min(1, p.getZ(i))), r = Math.sqrt(Math.max(1e-6, 1 - z * z)), s = (z + 1) / 2;
    const w = Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(s, 1.5))), 0.75);
    p.setXYZ(i, x / r * Wd * w, y / r * 0.05 * Math.sqrt(w) + 0.34 * Math.max(0, s - 0.62) ** 2, (s - 0.45) * L);
  }
  g.computeVertexNormals(); return g;
}

// vệt ruy băng n đốt (1 draw call): đốt mới đẩy vào đầu, mờ dần theo thứ tự + tuổi
function makeTrail(mat, n = 34) {
  const pos = new Float32Array(n * 6), col = new Float32Array(n * 8), idx = [];
  for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 4)); g.setIndex(idx);
  const uv = new Float32Array(n * 4); for (let i = 0; i < n; i++) { uv[i * 4] = 0; uv[i * 4 + 2] = 1; uv[i * 4 + 1] = uv[i * 4 + 3] = i / n; } g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));   // u ngang vệt: vệt nước dùng ảnh 2 mép bọt
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3;
  const R = Array.from({ length: n }, () => ({ x: 0, y: -999, z: 0, rx: 1, rz: 0, w: 0, r: 0, g: 0, b: 0, a: 0, life: 0, grow: 0 }));
  let lx = 1e9, lz = 0, ly = 0, fresh = true;
  return {
    mesh,
    // x, y, z: đuôi ván · (rx, rz): hướng ngang · w: nửa bề rộng · c: màu · grow: loang rộng theo tuổi (vệt nước)
    feed(x, y, z, rx, rz, w, c, a, grow, dt) {
      if (fresh) { fresh = false; for (const q of R) { q.x = x; q.y = y; q.z = z; q.life = 0; } }   // vệt mới: gom mọi đốt về đuôi ván (không kéo dải từ chỗ cũ)
      if ((x - lx) ** 2 + (z - lz) ** 2 + (y - ly) ** 2 > 0.36) { const last = R.pop(); R.unshift(last); lx = x; lz = z; ly = y; }
      const h = R[0]; h.x = x; h.y = y; h.z = z; h.rx = rx; h.rz = rz; h.w = w; h.r = c.r; h.g = c.g; h.b = c.b; h.a = a; h.life = 1; h.grow = grow;
      for (let i = 0; i < n; i++) {
        const q = R[i]; if (i) q.life = Math.max(0, q.life - dt * 0.9);
        const k = q.life * (1 - i / n) ** 2 * q.a, ww = q.grow ? q.w * (1 + (1 - q.life) * 2 + i / n * 5) : q.w * (1 - i / n), o = i * 6, c = i * 8;
        pos[o] = q.x - q.rx * ww; pos[o + 1] = q.y; pos[o + 2] = q.z - q.rz * ww; pos[o + 3] = q.x + q.rx * ww; pos[o + 4] = q.y; pos[o + 5] = q.z + q.rz * ww;
        col[c] = col[c + 4] = q.r; col[c + 1] = col[c + 5] = q.g; col[c + 2] = col[c + 6] = q.b; col[c + 3] = col[c + 7] = k;
      }
      g.attributes.position.needsUpdate = g.attributes.color.needsUpdate = true;
    },
    clear() { fresh = true; lx = 1e9; col.fill(0); g.attributes.color.needsUpdate = true; },
  };
}

export function createSilverBoard(ctx) {
  const { scene, camera, terrain, player } = ctx, W = CFG.island.waterLevel, mobile = CFG.isMobile;
  const ground = (x, z) => Math.max(terrain.heightAt(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, 999) : -99);
  function roofAt(x, z, m = 1.5) {
    const L = ctx.grid ? ctx.grid.near(x, z).boxes : (ctx.boxes || []); let top = -99;
    for (let i = 0; i < L.length; i++) { const B = L[i]; if (B.top > top && x > B.x0 - m && x < B.x1 + m && z > B.z0 - m && z < B.z1 + m) top = B.top; }
    return top;
  }
  const floorAt = (x, z) => Math.max(ground(x, z), W, roofAt(x, z));

  // ---------- gương: envMap 64×32 vẽ từ màu trời hiện tại (đỉnh trời → chân trời → biển) + mặt trời + vài cụm mây ----------
  const mirror = new THREE.MeshPhongMaterial({ color: '#d3dbe4', specular: '#ffffff', shininess: 144, reflectivity: 0.82, combine: THREE.MixOperation });
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 32; const k2 = cv.getContext('2d');
  let envSig = '', envT = 0;
  function refreshEnv() {
    const U = ctx.sky && ctx.sky.U, st = ctx.sky && ctx.sky.state; if (!U) return;
    const top = U.uTop.value, hor = U.uHor.value, sd = st.sunDir, q = c => (Math.round(c.r * 21) * 441 + Math.round(c.g * 21) * 21 + Math.round(c.b * 21));
    const sig = q(top) + ':' + q(hor) + ':' + Math.round(sd.y * 13) + ':' + Math.round(Math.atan2(sd.z, sd.x) * 5); if (sig === envSig) return; envSig = sig;
    const hx = c => '#' + c.getHexString(), g = k2.createLinearGradient(0, 0, 0, 32), sea = hor.clone().lerp(new THREE.Color('#1c6f95'), 0.62);
    g.addColorStop(0, hx(top)); g.addColorStop(0.36, hx(top.clone().lerp(hor, 0.5))); g.addColorStop(0.5, hx(hor.clone().lerp(new THREE.Color('#fff'), 0.25)));
    g.addColorStop(0.53, hx(sea)); g.addColorStop(1, hx(sea.clone().multiplyScalar(0.45)));
    k2.fillStyle = g; k2.fillRect(0, 0, 64, 32);
    const day = 1 - (st.night || 0); k2.fillStyle = `rgba(255,255,255,${0.55 * day})`;
    for (const [u, v, a, b] of [[9, 9, 7, 2], [27, 6, 5, 1.5], [44, 10, 8, 2.2], [58, 7, 4, 1.4], [35, 12, 6, 1.2]]) { k2.beginPath(); k2.ellipse(u, v, a, b, 0, 0, 6.3); k2.fill(); }
    if (sd.y > -0.05) { const u = (0.5 + Math.atan2(sd.z, sd.x) / 6.2832) * 64, v = (0.5 - Math.asin(Math.max(-1, Math.min(1, sd.y))) / Math.PI) * 32, rg = k2.createRadialGradient(u, v, 0, u, v, 7); rg.addColorStop(0, '#fffbe0'); rg.addColorStop(0.3, 'rgba(255,240,190,.8)'); rg.addColorStop(1, 'rgba(255,240,190,0)'); k2.fillStyle = rg; k2.fillRect(u - 7, v - 7, 14, 14); }
    const old = mirror.envMap, tex = new THREE.CanvasTexture(cv); tex.mapping = THREE.EquirectangularReflectionMapping; tex.colorSpace = THREE.SRGBColorSpace;
    mirror.envMap = tex; if (!old) mirror.needsUpdate = true; else old.dispose();
  }

  // ---------- hình ván: mặt gương + viền sáng (cùng hình, phình ngang 15 %, dẹt ½ → chỉ lộ ở mép) ----------
  const geo = boardGeo();
  function makeBoard(col = '#bfe6ff') {
    const g = new THREE.Group(), rimMat = new THREE.MeshBasicMaterial({ color: col }), rim = new THREE.Mesh(geo, rimMat), top = new THREE.Mesh(geo, mirror);
    rim.scale.set(1.15, 0.55, 1.05); top.castShadow = true; g.add(rim, top); g.userData.rim = rimMat; return g;
  }
  const trailMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  // vệt nước: 2 mép bọt trắng, giữa trong (ảnh 32×1) → rẽ nước hình chữ V loang dần
  const wc = document.createElement('canvas'); wc.width = 32; wc.height = 1; { const k = wc.getContext('2d'), g = k.createLinearGradient(0, 0, 32, 0); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.13, 'rgba(255,255,255,.12)'); g.addColorStop(0.5, 'rgba(255,255,255,.04)'); g.addColorStop(0.87, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(255,255,255,.95)'); k.fillStyle = g; k.fillRect(0, 0, 32, 1); }
  const wakeTex = new THREE.CanvasTexture(wc); wakeTex.generateMipmaps = false; wakeTex.minFilter = THREE.LinearFilter;   // không mipmap: nhìn xa vẫn giữ 2 mép bọt, giữa trong
  const wakeMat = new THREE.MeshBasicMaterial({ vertexColors: true, map: wakeTex, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  // tư thế lướt sóng (IK sau animation): 2 chân trước–sau dọc ván, 2 tay dang giữ thăng bằng, thân nghiêng theo cua
  const feet = [new THREE.Vector3(0.24, 0.07, 0.02), new THREE.Vector3(-0.24, 0.07, -0.02)], hands = [new THREE.Vector3(0.52, 0.8, 0.14), new THREE.Vector3(-0.5, 0.7, -0.06)];
  function pose(hero, ref, lean = 0.12, sway = 0) {
    if (!hero) return; const H = (hero.height || 1.25) / 1.25;
    hands[0].set(0.52 * H, (0.8 + sway * 0.1) * H - CROUCH, 0.14); hands[1].set(-0.5 * H, (0.7 - sway * 0.1) * H - CROUCH, -0.06);
    feet[0].x = 0.24 * H; feet[1].x = -0.24 * H;
    ridePose(hero, ref, { foot: ref, feet, hand: ref, hands, lean });
  }

  const rig = new THREE.Group(); rig.rotation.order = 'YXZ'; rig.visible = false; scene.add(rig);
  const deck = makeBoard(); rig.add(deck);
  const stance = new THREE.Object3D(); stance.rotation.y = STANCE; rig.add(stance);
  const trail = makeTrail(trailMat); trail.mesh.visible = false; scene.add(trail.mesh);
  // bụi nước bắn khi lướt biển
  const NS = 34, sp = new Float32Array(NS * 3).fill(-999), sv = new Float32Array(NS * 3), sl = new Float32Array(NS); let si = 0;
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const dot = document.createElement('canvas'); dot.width = dot.height = 16; { const k = dot.getContext('2d'), g = k.createRadialGradient(8, 8, 0, 8, 8, 8); g.addColorStop(0, '#fff'); g.addColorStop(0.5, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = g; k.fillRect(0, 0, 16, 16); }
  const spray = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#f2faff', size: 0.18, map: new THREE.CanvasTexture(dot), transparent: true, opacity: 0.8, depthWrite: false })); spray.frustumCulled = false; spray.visible = false; scene.add(spray);

  // ---------- màu ----------
  let styleI = Math.min(BOARD_COLORS.length - 1, load('sb.style', 0) | 0); const glow = new THREE.Color(), tc = new THREE.Color(), SILVER = new THREE.Color('#eef8ff');
  const unlocked = i => cupPoints() >= BOARD_COLORS[i].need;
  if (!unlocked(styleI)) styleI = 0;
  function glowNow(t) {
    const c = BOARD_COLORS[styleI];
    if (c.col === 'rainbow') return glow.setHSL((t * 0.2) % 1, 0.9, 0.6);
    if (c.col) return glow.set(c.col);
    const id = ctx.houses && ctx.houses.houseId && ctx.houses.houseId();
    return id && HOUSE[id] ? glow.set(HOUSE[id].col).lerp(tc.set('#fff'), 0.21) : glow.setHSL((ctx.hue || 200) / 360, 0.95, 0.55);
  }
  function nextColor() {
    for (let k = 1; k <= BOARD_COLORS.length; k++) { const i = (styleI + k) % BOARD_COLORS.length; if (unlocked(i)) { styleI = i; break; } }
    save('sb.style', styleI); const nx = BOARD_COLORS.find((c, i) => !unlocked(i));
    say(`🎨 Viền ván: <b>${BOARD_COLORS[styleI].name}</b>` + (nx ? ` · 🔒 ${nx.name}: cần ${nx.need} điểm cúp đua ván (đang có ${cupPoints()})` : ' · đã mở hết màu!'), 3500);
    return BOARD_COLORS[styleI];
  }

  // ---------- điều khiển ----------
  const keys = new Set(), held = { up: false, down: false, boost: false };
  const css = document.createElement('style'); css.textContent = `#sbCtl{position:fixed;right:max(13px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));display:none;grid-template-columns:repeat(3,55px);gap:8px;z-index:27}
#sbCtl button{width:55px;height:55px;border-radius:50%;border:2px solid #fff8;background:#1b1626aa;color:#fff;font:700 21px system-ui;touch-action:none;-webkit-user-select:none;user-select:none;padding:0}
#sbCtl .b{background:#d8632acc}#sbCtl .u{background:#3d8f4acc}#sbCtl .d{background:#3d6fb0cc}#sbCtl .x{font-size:15px}
body.sb-on #sbCtl{display:grid}body.sb-on .btns,body.sb-on .vbtns{display:none!important}@media (pointer:fine){body.sb-on #sbCtl{display:none}}
#sbHud{position:fixed;top:calc(max(12px,env(safe-area-inset-top)) + 89px);left:50%;transform:translateX(-50%);z-index:26;padding:6px 13px;border-radius:16px;background:#0f1a2acc;color:#eaf6ff;font:700 13px system-ui;display:none;white-space:nowrap;border:1px solid #bfe6ff55;cursor:pointer}
body.sb-on #sbHud{display:block}body.mg-on #sbHud{display:none!important}body.mg-on #sbCtl .b,body.mg-on #sbCtl .x{visibility:hidden}body.sb-lobby #sbCtl{display:none!important}
@media (pointer:coarse){body.sb-on #bAct{bottom:calc(max(16px,env(safe-area-inset-bottom)) + 134px)}#sbHud{left:auto;right:max(12px,env(safe-area-inset-right));transform:none;top:calc(max(12px,env(safe-area-inset-top)) + 134px)}}`; document.head.appendChild(css);
  const ctl = document.createElement('div'); ctl.id = 'sbCtl';
  ctl.innerHTML = '<button data-k="flip" title="Lộn vòng (Q)">🔄</button><button data-k="spin" title="Xoay 360° (Z)">🌀</button><button data-k="off" class="x" title="Xuống ván (U)">✕🏄</button><button data-k="down" class="d" title="Hạ thấp (C)">⬇</button><button data-k="up" class="u" title="Bay lên (Space)">⬆</button><button data-k="boost" class="b" title="Tăng tốc (Shift)">🚀</button>';
  document.body.appendChild(ctl);
  for (const b of ctl.children) {
    const k = b.dataset.k;
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (k in held) held[k] = true; else if (k === 'off') toggle(); else trick(k); });
    if (k in held) for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, () => { held[k] = false; });
  }
  const hud = document.createElement('div'); hud.id = 'sbHud'; hud.title = 'Chạm để đổi màu viền ván'; document.body.appendChild(hud); hud.onclick = () => nextColor();
  let bBtn = document.getElementById('bBoard');
  if (!bBtn) { bBtn = document.createElement('button'); bBtn.id = 'bBoard'; bBtn.textContent = '🏄'; bBtn.title = 'Ván bạc bay (U)'; const vb = document.querySelector('.vbtns'); vb && vb.appendChild(bBtn); }
  bBtn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); toggle(); });
  const racing = () => ctx.mgActive === 'board-race';
  const say = (t, ms) => { if (!ctx.mgActive) ctx.toast(t, ms); };
  addEventListener('keydown', e => {
    keys.add(e.code); if (e.repeat || (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName))) return;
    if (e.code === 'KeyU') { if (!racing() && !ctx.mapOpen && (on || !document.body.classList.contains('rs-modal'))) toggle(); }
    else if (on && e.code === 'KeyQ') trick('flip'); else if (on && e.code === 'KeyZ') trick('spin');
  });
  addEventListener('keyup', e => keys.delete(e.code)); addEventListener('blur', () => { keys.clear(); held.up = held.down = held.boost = false; });

  // ---------- âm thanh: gió (nhiễu qua lọc thông dải, to và cao dần theo tốc độ) + ngân kim loại (3 sin tỉ lệ chuông 1 : 2,76 : 5,4) ----------
  let snd = null;
  function initSound() {
    const L = ctx.audio && ctx.audio.listener; if (!L || L.context.state !== 'running') return;
    const ac = L.context, out = L.getInput(), buf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(); src.buffer = buf; src.loop = true; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.8; const wind = ac.createGain(); wind.gain.value = 0; src.connect(bp).connect(wind).connect(out); src.start();
    const hum = ac.createGain(); hum.gain.value = 0; hum.connect(out);
    const oscs = [1, 2.76, 5.4].map((r, i) => { const o = ac.createOscillator(); o.frequency.value = 233 * r; const g = ac.createGain(); g.gain.value = [1, 0.3, 0.1][i]; o.connect(g).connect(hum); o.start(); return o; });
    snd = { ac, out, wind, bp, hum, oscs };
  }
  function ping(f = 1597) {   // tiếng "keng" pha lê khi gọi ván / nhào lộn
    if (!snd) return; const { ac, out } = snd, t = ac.currentTime, g = ac.createGain(); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.8); g.connect(out);
    for (const r of [1, 2.76]) { const o = ac.createOscillator(); o.frequency.value = f * r; o.connect(g); o.start(t); o.stop(t + 0.82); }
  }

  // ---------- trạng thái ----------
  const P = new THREE.Vector3(), camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), camV = new THREE.Vector3(), lookV = new THREE.Vector3(), tmp = new THREE.Vector3();
  const ySt = { v: 0 }; let on = false, yaw = 0, spd = 0, roll = 0, pitch = 0, ty = 0, vyNow = 0, tk = null, appear = 1, landing = false, kickT = 0, time = 0, hudT = 0, fovAdd = 0, baseFov = camera.fov, bT = false;
  let coastT = 0, turnT = 0, rideT = 0, lastThr = 0, tricks = 0;
  const S = { hold: false, free: false, noBoost: false, assistY: null, steer: null, auto: null, onTrick: null, camBack: 1 };
  const cards = load('sb.cards', []);
  function card(id) {
    if (cards.includes(id) || ctx.mgActive) return; cards.push(id); save('sb.cards', cards);
    ctx.toast(`📘 <b>Thẻ kiến thức ${cards.length}/3 · ${CARDS[id][0]}</b><br>${CARDS[id][1]}`, 9000); ctx.sfx && ctx.sfx('open');
    ctx.reward && ctx.reward(1, 'Thẻ kiến thức ván bạc: ' + CARDS[id][0].replace(/^\S+ /, ''));
  }

  function summon(force) {
    if (on) return true;
    if (!force && ctx.eco && !ctx.eco.owns('board-bac')) { ctx.eco.locked('board-bac'); return false; }   // 🔒 mở khoá ở 🛒 Cửa hàng (economy/); đua ván (mini game) vẫn mượn ván miễn phí
    if (player.vehicle) { ctx.toast('🚶 Xuống phương tiện đang đi trước đã, rồi gọi ván nhé!', 2500); return false; }
    if (!force && (player.frozen || ctx.freeCam || document.body.classList.contains('rs-modal'))) return false;   // đang mở bảng / đoạn dẫn chuyện / chụp ảnh
    if (!force && ctx.dive && ctx.dive.diving) { ctx.toast('🤿 Đang lặn — nổi lên mặt nước rồi gọi ván nhé!', 2500); return false; }
    on = true; yaw = player.rot || 0; spd = 0; roll = pitch = 0; tk = null; landing = false; appear = 0; ySt.v = 0; kickT = 0; rideT = 0; bT = false;
    P.copy(player.pos); P.y = Math.max(P.y, floorAt(P.x, P.z)) + HOV; ty = P.y;
    player.vehicle = { speed: 0, turn: 0, accel: 4, fly: true, lift: 0, maxAlt: 9999, anim: 'idle', seat: 0, seatZ: 0, camAdd: 0, plane: true, board: true };
    camPos.copy(camera.position); camLook.copy(P); camV.set(0, 0, 0); lookV.set(0, 0, 0); baseFov = ctx.mgActive ? baseFov : camera.fov; fovAdd = 0;
    rig.visible = trail.mesh.visible = spray.visible = true; trail.clear(); document.body.classList.add('sb-on'); refreshEnv(); if (!snd) initSound(); ping();
    say(mobile ? '🏄 <b>Ván bạc bay!</b> Cần gạt: ⬆ lướt tới · ⬅➡ cua · ⬇ hãm · nút <b>⬆⬇</b> lên/xuống · <b>🚀</b> tăng tốc · <b>🔄 🌀</b> nhào lộn'
      : '🏄 <b>Ván bạc bay!</b> <b>W/S</b> lướt tới/hãm · <b>A/D</b> cua · <b>Space/C</b> lên/xuống · <b>Shift</b> tăng tốc · <b>Q</b> lộn vòng · <b>Z</b> xoay 360° · <b>U</b> xuống ván', 8000);
    ctx.net && ctx.net.emit && ctx.net.emit('sb', { on: 1, c: '#' + glowNow(0).getHexString() });
    return true;
  }
  function finish() {
    if (!on) return; on = false; landing = false; rig.visible = trail.mesh.visible = spray.visible = false; sp.fill(-999); sg.attributes.position.needsUpdate = true;
    document.body.classList.remove('sb-on'); held.up = held.down = held.boost = false;
    rideReset(player.hero); player.vehicle = null;
    const g = ground(P.x, P.z), y = Math.max(g, roofAt(P.x, P.z, 0.2), g < W ? W - 0.6 : -99);
    player.teleport(P.x, P.z, Math.max(y, Math.min(P.y - HOV, y + 1))); player.setRot && player.setRot(yaw); player.cam.yaw = yaw + Math.PI; player.root.quaternion.identity(); player.root.rotation.y = yaw;
    if (snd) { const t = snd.ac.currentTime; snd.wind.gain.setTargetAtTime(0, t, 0.1); snd.hum.gain.setTargetAtTime(0, t, 0.1); }
    ctx.net && ctx.net.emit && ctx.net.emit('sb', { on: 0 });
  }
  function leave() {
    if (!on || racing()) return;
    if (P.y - floorAt(P.x, P.z) > 2.6) { landing = true; say('🏄 Đang hạ ván xuống thấp…', 2000); } else finish();
  }
  function toggle() { ctx.audio && ctx.audio.start && ctx.audio.start(); if (on) leave(); else summon(); }
  function trick(kind = 'flip') {
    if (!on || tk || S.hold) return false; tk = { kind, t: 0, dur: kind === 'flip' ? 0.8 : 1 / PHI }; tricks++; ping(kind === 'flip' ? 1318 : 1760);
    S.onTrick && S.onTrick(kind); if (tricks === 1) say('✨ Nhào lộn đẹp lắm! <b>🔄 lộn vòng</b> và <b>🌀 xoay 360°</b> — trong cuộc đua, nhào lộn được cộng tốc.', 3500);
    return true;
  }

  // ---------- mô phỏng ----------
  function sim(dt) {
    time += dt; if (!snd) initSound();
    let ix = player.input.x, iz = player.input.z, up = held.up || keys.has('Space'), dn = held.down || keys.has('KeyC'), boost = held.boost || keys.has('ShiftLeft') || keys.has('ShiftRight') || player.input.run;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1; if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) iz -= 1; if (keys.has('KeyS') || keys.has('ArrowDown')) iz += 1;
    if (S.auto) { const a = S.auto(dt); if (a) { ix = a.x || 0; iz = a.z || 0; boost = !!a.boost; up = !!a.up; dn = !!a.down; } }
    ix = Math.max(-1, Math.min(1, ix)); iz = Math.max(-1, Math.min(1, iz));
    const cut = !racing() && !!ctx.freeCam;   // đoạn dẫn chuyện / chế độ chụp ảnh tự đặt camera: ván đứng yên, không ghi đè camera
    if (S.hold || landing || cut || (!racing() && document.body.classList.contains('rs-modal'))) { ix = 0; iz = landing ? 1 : 0; boost = up = dn = false; }
    if (S.noBoost) boost = false;   // khi đua: chỉ tăng tốc nhờ cổng, mũi tên, nhào lộn, đáp án đúng
    kickT = Math.max(0, kickT - dt); if (kickT > 0) boost = true;
    // ga: đẩy cần tới = tăng tốc mượt (quán tính) · thả = trôi chậm dần · kéo lùi = hãm
    const thr = Math.max(0, -iz, boost ? 1 : 0), want = S.hold ? 0 : thr * (boost ? V_BOOST : V_CRUISE);
    spd += (want - spd) * ease(iz > 0.2 ? 1.6 : want > spd ? (kickT > 0 ? 2.1 : 0.9) : 0.34, dt);
    // mép vùng bay: vòng dần về đảo (trừ khi đang đua hoặc trong hành lang Học viện)
    const rC = Math.hypot(P.x, P.z), edge = S.free ? 0 : Math.min(1, Math.max(0, (rC - RANGE) / 89));
    if (edge > 0 && !(ctx.flyZones || []).some(f => f(P.x, P.z))) {
      let d = Math.atan2(-P.x, -P.z) - yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); ix = ix * (1 - edge) - Math.max(-1, Math.min(1, d * 1.5)) * edge;
      if (!bT) { bT = true; say('🧭 Phía trước là biển khơi xa: ván đang vòng về đảo.', 3000); }
    } else if (rC < RANGE - 21) bT = false;
    if (S.steer != null && Math.abs(ix) < 0.15) { let d = S.steer - yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); ix = -Math.max(-0.5, Math.min(0.5, d * 1.2)); }   // trợ lái nhẹ khi đua (thả cần)
    const sf = Math.min(1, spd / V_CRUISE);
    yaw -= ix * (1.9 - 0.7 * Math.min(1, spd / V_BOOST)) * dt;
    roll += (ix * 0.62 * (0.3 + 0.7 * sf) - roll) * ease(5, dt);
    const fx = Math.sin(yaw), fz = Math.cos(yaw);
    P.x += fx * spd * dt; P.z += fz * spd * dt;
    // sát đất (≤ 2,6 m): không xuyên thân cây, cột, tường thấp… (lưới chung collide.js), chia bước ≤ 0,25 m
    if (ctx.collide && P.y - floorAt(P.x, P.z) < 2.6) { const L = spd * dt, n = Math.max(1, Math.ceil(L / 0.25)); let x = P.x - fx * L, z = P.z - fz * L;
      for (let k = 0; k < n; k++) { const r = ctx.collide.resolve(x, z, x + fx * L / n, z + fz * L / n, P.y - 0.3, 0.45, null); x = r.x; z = r.z; if (r.hit) spd *= 0.96; } P.x = x; P.z = z; }
    // độ cao: bám mặt đất/mặt nước khi lướt thấp, giữ độ cao khi bay; không bao giờ xuyên đất hay nhà (nhìn trước theo tốc độ)
    const la = Math.max(3, spd * 0.25), fl = Math.max(floorAt(P.x, P.z), floorAt(P.x + fx * la, P.z + fz * la), floorAt(P.x + fx * la * 2.2, P.z + fz * la * 2.2)), minY = fl + HOV;
    if (S.assistY != null) ty += (Math.max(S.assistY + (up ? 3 : dn ? -3 : 0), minY) - ty) * ease(3, dt);
    else {
      if (up) ty += CLIMB * (boost ? PHI : 1) * dt; if (dn) ty -= CLIMB * (boost ? PHI : 1) * dt; if (landing) ty -= 13 * dt;
      if (!up && !dn && ty - minY < 2.6) ty += (minY - ty) * ease(2.5, dt);
    }
    ty = Math.max(minY, Math.min(W + CEIL, ty));
    const py = P.y; P.y = damp(P.y, ty, ySt, 0.21, dt); if (P.y < fl + 0.21) { P.y = fl + 0.21; ySt.v = Math.max(0, ySt.v); }
    vyNow = (P.y - py) / Math.max(dt, 1e-3);
    pitch += (Math.max(-0.5, Math.min(0.5, Math.atan2(vyNow, Math.max(spd, 8)))) + (want - spd) * 0.004 - pitch) * ease(4, dt);
    if (landing && P.y - fl < 1.3 && spd < 3) return finish();
    if (tk) { tk.t += dt; if (tk.t >= tk.dur) tk = null; }
    appear = Math.min(1, appear + dt / 0.382);
    // thẻ kiến thức theo trải nghiệm
    rideT += dt; if (rideT > 8) card('mirror');
    if (thr < 0.1 && lastThr >= 0.1 && spd > 12) coastT = 1.3; lastThr = thr; if (coastT > 0 && (coastT -= dt) <= 0 && spd > 6) card('inertia');
    turnT = Math.abs(ix) > 0.7 && spd > 14 ? turnT + dt : 0; if (turnT > 1) card('centri');
    apply(dt);
    // camera thứ 3 bám đuôi: lò xo giảm chấn, lùi xa + FOV rộng dần theo tốc độ
    const s34 = Math.min(1, spd / V_BOOST), D = (6.2 + s34 * 4.2) * S.camBack, H = 2.4 + s34 * 0.8 + Math.max(0, -pitch) * 3;
    tmp.set(P.x - fx * D, P.y + H, P.z - fz * D); tmp.y = Math.max(tmp.y, ground(tmp.x, tmp.z) + 1.2, roofAt(tmp.x, tmp.z, 1) + 1.2, W + 0.6);
    dampV3(camPos, tmp, camV, T.soft, dt); if (!cut) camera.position.copy(camPos);
    dampV3(camLook, tmp.set(P.x + fx * (4 + s34 * 6), P.y + 1 + pitch * 3, P.z + fz * (4 + s34 * 6)), lookV, T.quick, dt); if (!cut) camera.lookAt(camLook);
    fovAdd += (s34 * 13 + (kickT > 0 ? 5 : 0) - fovAdd) * ease(2, dt); if (!cut) { camera.fov = baseFov + fovAdd; camera.updateProjectionMatrix(); }
    player.cam.yaw = yaw + Math.PI;
    // âm thanh
    if (snd) { const t = snd.ac.currentTime; snd.wind.gain.setTargetAtTime(0.015 + 0.15 * s34 ** 1.5, t, 0.12); snd.bp.frequency.setTargetAtTime(380 + spd * 45, t, 0.12); snd.hum.gain.setTargetAtTime(0.008 + 0.018 * s34, t, 0.15); for (let i = 0; i < 3; i++) snd.oscs[i].frequency.setTargetAtTime(233 * [1, 2.76, 5.4][i] * (1 + s34 * 0.13), t, 0.2); }
    // vệt: lướt sát biển → vệt nước bạc loang trên mặt nước + bụi nước; còn lại → vệt sáng màu viền
    const gh = ground(P.x, P.z), skim = gh < W && P.y - W < 2.2, c = glowNow(time), rx = -fz, rz = fx, tx = P.x - fx * 1.15, tz = P.z - fz * 1.15;
    deck.userData.rim.color.copy(c);
    trail.mesh.material = skim ? wakeMat : trailMat;
    if (skim) trail.feed(P.x - fx * 0.4, W + 0.14, P.z - fz * 0.4, rx, rz, 0.3 + sf * 0.2, SILVER, 0.3 + 0.6 * sf, 1, dt);
    else trail.feed(tx, P.y + 0.02, tz, rx, rz, 0.22, c, 0.12 + 0.5 * s34, 0, dt);
    if (skim && spd > 5) for (let k = 0; k < 2; k++) { const o = si * 3, s = k ? 1 : -1; sp[o] = tx + rx * s * 0.3; sp[o + 1] = W + 0.15; sp[o + 2] = tz + rz * s * 0.3; sv[o] = rx * s * (1 + Math.random() * 2) - fx * spd * 0.1; sv[o + 1] = 1.5 + Math.random() * 2.5 * sf; sv[o + 2] = rz * s * (1 + Math.random() * 2) - fz * spd * 0.1; sl[si] = 0.6; si = (si + 1) % NS; }
    for (let i = 0; i < NS; i++) if (sl[i] > 0) { const o = i * 3; sl[i] -= dt; sv[o + 1] -= 9 * dt; sp[o] += sv[o] * dt; sp[o + 1] += sv[o + 1] * dt; sp[o + 2] += sv[o + 2] * dt; if (sl[i] <= 0 || sp[o + 1] < W) sp[o + 1] = -999; }
    sg.attributes.position.needsUpdate = true;
    if ((hudT -= dt) <= 0) { hudT = 0.25; const ht = `🏄 ${Math.round(P.y - Math.max(gh, W))} m · ${Math.round(spd * 3.6)} km/h${mobile ? '' : ' · 🎨'}`; if (hud.textContent !== ht) hud.textContent = ht; }
    if ((envT -= dt) <= 0) { envT = 5; refreshEnv(); }
  }
  // đặt ván + người lên đúng tư thế (gọi lại được sau khi phần khác ghi đè nhân vật, vd. host mini game)
  function apply(dt = 0) {
    if (!on) return;
    const u = tk ? tk.t / tk.dur : 0, e = u * u * (3 - 2 * u), flip = tk && tk.kind === 'flip' ? e * 6.2832 : 0, spin = tk && tk.kind === 'spin' ? e * 6.2832 : 0, hop = tk ? Math.sin(u * Math.PI) * (tk.kind === 'flip' ? 1.3 : 0.5) : 0;
    const bob = Math.sin(time * 2.1) * 0.05 * (1 - Math.min(1, spd / 13));
    rig.position.set(P.x, P.y + hop + bob, P.z); rig.rotation.set(-pitch - flip, yaw + spin, roll); rig.scale.setScalar(0.2 + 0.8 * appear); rig.updateMatrixWorld(true);
    player.pos.copy(P); player.root.position.copy(rig.position); player.root.quaternion.copy(rig.quaternion);
    const h = player.hero; if (h) { h.model.position.set(0, 0.07 - CROUCH, 0); h.model.rotation.set(0, STANCE, 0); pose(h, stance, 0.12 + Math.abs(roll) * 0.3, roll * 1.6); }
  }

  function update(dt) {
    if (on) { sim(dt); if (on && !racing() && spd < 8 && !landing && !player.frozen && ctx.miniGames && ctx.miniGames['board-race']) ctx.offer('🏁 Đua ván bạc', () => ctx.mg.start('board-race', null), 6); }
  }

  // phép gọi ván (đũa phép Học viện): chỉ thêm khi có hệ thống phép
  const spell = { id: 'board', name: 'Gọi ván bạc', icon: '🏄', say: 'Gọi Ván!', order: 7.5, cost: 8, cd: 5, subjects: ['khoahoc'], learn: 'gọi tấm ván bạc bay tới chân em (Vật lý: quán tính, phản xạ ánh sáng).', hint: 'Đứng chỗ thoáng rồi vẩy đũa.', cast: () => summon() };
  if (ctx.spells && ctx.spells.register) ctx.spells.register(spell); else if (ctx.magic && ctx.magic.addSpell) ctx.magic.addSpell(spell);

  // người chơi khác đang cưỡi ván (server chuyển tiếp 'sb'): gắn 1 tấm ván dưới chân nhân vật của họ
  const remote = new Map();   // id → { on, c, k, p, f, board }
  if (ctx.net && ctx.net.on) ctx.net.on('sb', ([id, d]) => {
    const r = remote.get(id) || {}; Object.assign(r, d); r.t = performance.now(); remote.set(id, r); const o = ctx.net.others.get(id); if (!o) return;
    if (r.on && !r.board) { r.board = makeBoard(r.c || '#bfe6ff'); r.board.position.y = 0.02; o.h.root.add(r.board); } else if (r.board) { r.board.visible = !!r.on; if (r.c) r.board.userData.rim.color.set(r.c); }
  });

  const api = {
    update, apply, summon, leave, finish, toggle, trick, nextColor, makeBoard, makeTrail: () => makeTrail(trailMat), pose, floorAt, remote, S,
    pos: P, kick: s => { kickT = Math.max(kickT, s); }, slow: f => { spd *= f; },
    place(x, y, z, yw) { P.set(x, y, z); ty = y; ySt.v = 0; if (yw != null) yaw = yw; spd = 0; tk = null; trail.clear(); const fx = Math.sin(yaw), fz = Math.cos(yaw); camPos.set(x - fx * 8, y + 3, z - fz * 8); camLook.copy(P); camV.set(0, 0, 0); lookV.set(0, 0, 0); },
    get riding() { return on; }, get yaw() { return yaw; }, set yaw(v) { yaw = v; }, get speed() { return spd; }, set speed(v) { spd = v; }, get tricks() { return tricks; },
    get color() { return BOARD_COLORS[styleI]; }, get glow() { return glowNow(time); }, get draws() { return 4; },
  };
  return api;
}
