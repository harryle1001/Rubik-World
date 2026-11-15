// treasure.js — 13 rương kho báu (số Fibonacci) dưới đáy biển: vịnh nông → rạn san hô → tảo bẹ → xác tàu → hang đá → vùng sâu.
//   Rương phát sáng + bong bóng (1 Points chạy trên GPU). Đến gần bấm E → câu đố biển (quiz-data.js, môn 'bien'):
//   đúng → nắp mở, đồng xu/ngọc bay ra, thêm vật phẩm vào túi đồ (island.inventory, như temple.js); sai → gợi ý, thử lại.
//   Mở rương thứ 3, 5, 8, 13 (Fibonacci) → bình dưỡng khí lớn hơn ×(1 + 1/φ³) (ctx.dive.maxOxygen nếu phiên lặn có; ctx.treasure.o2Mult).
//   Mảnh bản đồ trên bãi cát vịnh nông chỉ đường tới rương đầu tiên; có bản đồ → la bàn chỉ rương gần nhất. HUD "🧰 x/13" mở Sổ biển.
// Lưu tiến độ: localStorage 'island.treasure'. Vị trí rương: ctx.sealife.slots (sealife.js).
import * as THREE from 'three';
import { Batch } from './decor.js';
import { PHI, FIB, PI, LAGOON, blocked } from './layout.js';
import { CFG } from './config.js';
import { gradientMap } from './style.js';
import { pickQuestions } from './quiz-data.js';

const SAVE = 'island.treasure', INV = 'island.inventory', W = CFG.island.waterLevel;
const load = k => { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch (e) { return {}; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const LOOT = [   // mỗi rương: 1 vật phẩm + đồng xu theo dãy Fibonacci
  { id: 'ngoc-trai', icon: '🦪', name: 'Ngọc trai' }, { id: 'oc-xa-cu', icon: '🐚', name: 'Vỏ ốc xà cừ' }, { id: 'ngoc-lam', icon: '🔷', name: 'Ngọc lam biển' },
  { id: 'la-ban', icon: '🧭', name: 'La bàn cổ' }, { id: 'sao-vang', icon: '⭐', name: 'Sao biển vàng' },
];
const O2_AT = [3, 5, 8, 13], O2_STEP = 1 + 1 / PHI ** 3;   // +23,6% mỗi bậc
const DIRS = ['Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc', 'Bắc', 'Đông Bắc'];   // -z là hướng bắc
const dirName = (dx, dz) => DIRS[((Math.round(Math.atan2(dz, dx) / (PI / 4)) % 8) + 8) % 8];

export function createTreasure(ctx) {
  const { scene, terrain, camera } = ctx, sea = ctx.sealife, slots = sea.slots, N = slots.length;
  const S = Object.assign({ open: {}, map: 0 }, load(SAVE));
  const opened = () => Object.keys(S.open).length;
  const o2Level = () => O2_AT.filter(n => opened() >= n).length;

  // ---------- Rương: thân + nắp = 2 InstancedMesh (nắp xoay quanh bản lề phía sau) ----------
  const CW = 1.3, CD = CW / PHI, CH = CD / PHI;   // rộng 1,3 m · sâu = rộng/φ · cao thân = sâu/φ
  const mat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap, emissive: '#3a2a10', emissiveIntensity: 0.35 });
  const bodyG = (() => { const b = new Batch('chest'); b.box(CW, CH, CD, 0, 0, 0, '#a8692e'); b.box(CW + 0.02, 0.06, CD + 0.02, 0, CH - 0.06, 0, '#f2c14e');
    for (const s of [-1, 1]) b.box(0.1, CH + 0.01, CD + 0.03, s * CW * 0.32, 0, 0, '#f2c14e'); b.box(0.16, 0.2, 0.05, 0, CH - 0.24, CD / 2 + 0.02, '#ffd76a');
    b.box(CW - 0.12, 0.04, CD - 0.12, 0, CH - 0.02, 0, '#3a2414'); return b.mesh(null).geometry; })();
  const lidG = (() => { const b = new Batch('lid');
    b.push(new THREE.CylinderGeometry(CD / 2, CD / 2, CW, 9, 1, false, 0, PI), '#c27a35', 0, 0, CD / 2, 0, 0, PI / 2, 1, 1, 1);
    for (const s of [-1, 1]) b.push(new THREE.CylinderGeometry(CD / 2 + 0.02, CD / 2 + 0.02, 0.1, 9, 1, false, 0, PI), '#f2c14e', s * CW * 0.32, 0, CD / 2, 0, 0, PI / 2);
    const g = b.mesh(null).geometry; g.scale(1, 0.75, 1); return g; })();
  const body = new THREE.InstancedMesh(bodyG, mat, N), lid = new THREE.InstancedMesh(lidG, mat, N);
  body.name = 'sea-chest'; lid.name = 'sea-chest-lid'; body.frustumCulled = lid.frustumCulled = false; scene.add(body, lid);
  const _o = new THREE.Object3D(), _m = new THREE.Matrix4(), _h = new THREE.Matrix4();
  const C = slots.map((s, i) => {
    _o.position.set(s.x, s.y - 0.08, s.z); _o.rotation.set((Math.sin(i * 7) * 0.06), s.ry, Math.cos(i * 5) * 0.06, 'YXZ'); _o.scale.setScalar(1); _o.updateMatrix();
    body.setMatrixAt(i, _o.matrix);
    return { i, s, m: _o.matrix.clone(), ang: S.open[i] ? 1.9 : 0, target: S.open[i] ? 1.9 : 0, pos: new THREE.Vector3(s.x, s.y + 0.5, s.z) };
  });
  const setLid = c => { _h.makeTranslation(0, CH, -CD / 2).multiply(_m.makeRotationX(-c.ang)); lid.setMatrixAt(c.i, _h.premultiply(c.m)); };
  C.forEach(setLid); lid.instanceMatrix.needsUpdate = true;

  // ---------- Quầng sáng + bong bóng trên mỗi rương, ánh sáng mảnh bản đồ (1 Points, chuyển động trên GPU) ----------
  const BUB = FIB[5];   // 8 bong bóng / rương
  const NP = N * (1 + BUB) + 1, pPos = new Float32Array(NP * 3), pK = new Float32Array(NP * 4);
  C.forEach((c, i) => { pPos.set([c.s.x, c.s.y + 0.6, c.s.z], i * 3); pK.set([0, Math.random(), i, 1], i * 4);
    for (let k = 0; k < BUB; k++) { const j = N + i * BUB + k; pPos.set([c.s.x + (Math.random() - 0.5) * 0.8, c.s.y + 0.7, c.s.z + (Math.random() - 0.5) * 0.5], j * 3); pK.set([1, Math.random(), i, 1], j * 4); } });
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pg.setAttribute('aK', new THREE.BufferAttribute(pK, 4));
  const pU = { uTime: { value: 0 }, uScale: { value: 600 }, uTop: { value: W } };
  const pts = new THREE.Points(pg, new THREE.ShaderMaterial({ uniforms: pU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uTime, uScale, uTop; attribute vec4 aK; varying float vA, vK;
      void main(){ vec3 p = position; float s; vK = aK.x;
        if (aK.x > .5) { float c = fract(uTime * .22 * (.7 + aK.y) + aK.y * 7.); p.y += c * 5.; p.x += sin(c * 12. + aK.y * 20.) * .15; vA = aK.w * (1. - c) * step(p.y, uTop - .1); s = .1 + aK.y * .1; }
        else { vA = aK.w * (.55 + .25 * sin(uTime * 2. + aK.y * 6.)); s = 2.6; }
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = min(256., s * uScale / -mv.z); }`,
    fragmentShader: `varying float vA, vK;
      void main(){ float d = length(gl_PointCoord - .5); float a = vK > .5 ? (smoothstep(.5, .4, d) - smoothstep(.36, .2, d) * .75) * vA : pow(smoothstep(.5, 0., d), 2.) * vA;
        vec3 c = vK > .5 ? vec3(.85, .97, 1.) : vec3(1., .82, .4); gl_FragColor = vec4(c * a, a); }` }));
  pts.frustumCulled = false; pts.name = 'sea-chest-glow'; scene.add(pts);
  const setOn = (i, on) => { pK[i * 4 + 3] = on; for (let k = 0; k < BUB; k++) pK[(N + i * BUB + k) * 4 + 3] = on ? 1 : 0.25; pg.attributes.aK.needsUpdate = true; };
  C.forEach(c => S.open[c.i] && setOn(c.i, 0.12));

  // ---------- Đồng xu / ngọc bay ra khi mở (34 hạt, chỉ hiện lúc mở) ----------
  const NB = FIB[8], bPos = new Float32Array(NB * 3), bCol = new Float32Array(NB * 3), bV = [];
  for (let k = 0; k < NB; k++) { new THREE.Color(k % 3 ? '#ffd23f' : (k % 2 ? '#7fe3ff' : '#ff8fd8')).toArray(bCol, k * 3); bV.push(new THREE.Vector3()); }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(bPos, 3)); bg.setAttribute('color', new THREE.BufferAttribute(bCol, 3));
  const dot = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 2, 16, 16, 15); gr.addColorStop(0, '#fff'); gr.addColorStop(0.45, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
  const burst = new THREE.Points(bg, new THREE.PointsMaterial({ size: 0.34, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  burst.visible = false; burst.frustumCulled = false; scene.add(burst); let burstT = 0;
  function pop(c) { burstT = 1.6; burst.visible = true; for (let k = 0; k < NB; k++) { bPos.set([c.s.x, c.s.y + 0.7, c.s.z], k * 3); const a = k * 2.39996, r = 0.6 + Math.random() * 1.2; bV[k].set(Math.cos(a) * r, 2.2 + Math.random() * 2, Math.sin(a) * r); } }

  // ---------- Mảnh bản đồ kho báu trên bãi cát vịnh nông ----------
  const first = C[0], map = { pos: null, mesh: null };
  {
    let best = null, bd = 1e9;
    for (let k = 0; k < 600; k++) { const a = k * 2.39996, r = 8 + Math.sqrt(k) * 2.4, x = LAGOON.x + Math.cos(a) * r, z = LAGOON.z + Math.sin(a) * r, h = terrain.heightAt(x, z);
      if (h > W + 0.25 && h < W + 1.4 && !blocked(x, z, 1)) { const d = Math.hypot(x - first.s.x, z - first.s.z); if (d < bd) { bd = d; best = [x, h, z]; } } }
    if (best) {
      map.pos = new THREE.Vector3(...best);
      const b = new Batch('treasure-map'); b.group(best[0], best[1], best[2], Math.random() * 6, () => {
        b.push(new THREE.CylinderGeometry(0.07, 0.07, 0.62, 8), '#f3e2b8', 0, 0.07, 0, 0, 0, PI / 2); b.push(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 8), '#e8453c', 0, 0.07, 0, 0, 0, PI / 2);
        b.box(0.05, 0.5, 0.05, 0.42, 0, 0.1, '#8a5a34'); b.box(0.24, 0.16, 0.02, 0.42, 0.36, 0.11, '#f3e2b8'); b.box(0.06, 0.06, 0.025, 0.42, 0.41, 0.12, '#e8453c'); });
      map.mesh = b.mesh(new THREE.MeshToonMaterial({ vertexColors: true, gradientMap }), true); map.mesh.visible = !S.map; scene.add(map.mesh);
      pPos.set([best[0], best[1] + 0.7, best[2]], (NP - 1) * 3); pK.set([0, 0.5, -1, S.map ? 0 : 1], (NP - 1) * 4); pg.attributes.position.needsUpdate = true; pg.attributes.aK.needsUpdate = true;
    }
  }

  // ---------- Túi đồ (dùng chung island.inventory với temple.js) ----------
  const inv = () => load(INV);
  const showInv = v => { const el = document.getElementById('inv'); if (el) el.textContent = Object.values(v).map(i => `${i.icon} ${i.n}`).join('  '); };
  const give = (id, icon, n = 1) => { const v = inv(); v[id] = v[id] || { icon, n: 0 }; v[id].n += n; save(INV, v); showInv(v); };

  // ---------- Giao diện: bảng câu đố, Sổ biển, nút HUD ----------
  const css = document.createElement('style'); css.textContent = `
#seaQuiz,#seaBook{position:fixed;inset:0;z-index:30;display:grid;place-items:center;background:#06243acc;padding:13px}
#seaQuiz .card,#seaBook .card{width:min(100%,540px);max-height:88vh;overflow:auto;background:#f2fbff;color:#123247;border-radius:21px;padding:16px 18px;border-top:8px solid #1688b0;text-align:center;font:15px/1.5 system-ui}
#seaQuiz .sub{margin:0;font-weight:700;opacity:.65;font-size:13px}#seaQuiz h3{font-size:19px;margin:8px 0 13px}#seaQuiz .ch{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#seaQuiz button,#seaBook button{padding:13px 10px;border-radius:13px;border:2px solid transparent;background:#d6eef7;font:700 15px system-ui;color:#123247}
#seaQuiz button.ok{background:#c9efc9;border-color:#3fa36b}#seaQuiz button.bad{background:#ffd0c8;border-color:#d2553f;opacity:.7}#seaQuiz .ex{min-height:1.5em;margin:10px 0 0}
#seaQuiz .go,#seaBook .x{width:100%;margin-top:8px;background:#46e3c6}#seaQuiz .later{width:100%;margin-top:8px;background:transparent;opacity:.7;font-size:13px}
#seaBook h3{margin:0 0 8px;font-size:21px}#seaBook ul{padding:0;margin:0;text-align:left}#seaBook li{list-style:none;padding:7px 10px;margin:5px 0;border-radius:13px;background:#e3f1f7}#seaBook li.ok{background:#dcf5e4}#seaBook li small{display:block;opacity:.8;font-size:13px}
#seaBook .bar{height:8px;border-radius:5px;background:#d6eef7;margin:4px 0 10px;overflow:hidden}#seaBook .bar i{display:block;height:100%;background:linear-gradient(90deg,#46e3c6,#1688b0)}
@media(max-width:420px){#seaQuiz .ch{grid-template-columns:1fr}}`;
  document.head.appendChild(css);
  const quiz = document.createElement('div'); quiz.id = 'seaQuiz'; quiz.hidden = true; document.body.appendChild(quiz);
  const book = document.createElement('div'); book.id = 'seaBook'; book.hidden = true; document.body.appendChild(book);
  const hud = document.createElement('button'); hud.id = 'bSea'; hud.title = 'Sổ biển: rương kho báu & Bách khoa biển';
  (document.querySelector('.topbtns') || document.body).appendChild(hud);
  const busy = () => !quiz.hidden || !book.hidden;
  const freeze = on => { ctx.player.frozen = on; if (ctx.dive) ctx.dive.paused = on; };

  function ask(c) {
    const q = pickQuestions(['bien'], 1)[0]; freeze(true); quiz.hidden = false; ctx.sfx && ctx.sfx('ui');
    quiz.innerHTML = `<div class="card"><p class="sub">🧰 Rương kho báu số ${c.i + 1} · ${c.s.zone.icon} ${c.s.zone.name}</p><h3>${q.q}</h3>
      <div class="ch">${q.choices.map((t, k) => `<button data-k="${k}">${t}</button>`).join('')}</div><p class="ex">Trả lời đúng để mở rương nhé!</p><button class="later">Để sau</button></div>`;
    const close = () => { quiz.hidden = true; freeze(false); };
    quiz.querySelector('.later').onclick = close;
    quiz.querySelectorAll('.ch button').forEach(b => b.onclick = () => {
      const k = +b.dataset.k, ex = quiz.querySelector('.ex');
      if (k !== q.a) { b.className = 'bad'; b.disabled = true; ex.innerHTML = `💡 <b>Gợi ý:</b> ${q.hint || 'Đọc kỹ câu hỏi rồi thử lại nhé!'} Thử lại nào!`; ctx.sfx && ctx.sfx('ui'); return; }
      quiz.querySelectorAll('.ch button').forEach((x, j) => { x.disabled = true; if (j === q.a) x.className = 'ok'; });
      ex.innerHTML = `✅ <b>Chính xác!</b> ${q.explain}<br><button class="go">🎁 Mở rương</button>`;
      quiz.querySelector('.later').remove();
      ex.querySelector('.go').onclick = () => { close(); openChest(c); };
    });
  }
  function openChest(c) {
    S.open[c.i] = Date.now(); save(SAVE, S); c.target = 1.9; setOn(c.i, 0.12); pop(c);
    const n = opened(), L = LOOT[c.i % LOOT.length], coins = FIB[2 + (c.i % 8)];
    give(L.id, L.icon); give('xu', '🪙', coins);
    let msg = `🧰 <b>Rương ${n}/${N}</b>: ${L.icon} ${L.name} + 🪙 ${coins} đồng xu cổ!`;
    if (O2_AT.includes(n)) { msg += `<br>🫧 <b>Bình dưỡng khí lớn hơn!</b> Lặn được lâu hơn ${Math.round((O2_STEP - 1) * 100)}%.`; applyO2(); }
    if (n === N) msg += '<br>🏆 <b>Thợ lặn φ!</b> Bạn đã tìm đủ 13 rương — 13 là một số Fibonacci.';
    ctx.toast(msg, 7000); ctx.sfx && ctx.sfx('win'); ctx.player.emote && ctx.player.emote('cheer'); label();
  }
  function pickMap() {
    S.map = 1; save(SAVE, S); give('ban-do', '🗺️'); map.mesh.visible = false; pK[(NP - 1) * 4 + 3] = 0; pg.attributes.aK.needsUpdate = true;
    const dx = first.s.x - map.pos.x, dz = first.s.z - map.pos.z, d = Math.round(Math.hypot(dx, dz));
    ctx.toast(`🗺️ <b>Mảnh bản đồ kho báu!</b><br>"Đi về phía <b>${dirName(dx, dz)}</b> chừng <b>${d} m</b>, lặn xuống đáy ${first.s.zone.name}: rương phát sáng, có bong bóng nổi lên."<br><small>Có bản đồ: nút 🧰 chỉ hướng rương gần nhất. 13 rương giấu khắp đáy biển!</small>`, 9000);
    ctx.sfx && ctx.sfx('ok'); label();
  }
  // nâng cấp dưỡng khí: đọc/ghi ctx.dive.maxOxygen nếu phiên lặn có; luôn công bố hệ số ở ctx.treasure.o2Mult
  let o2Applied = -1;
  function applyO2() {
    api.o2Mult = O2_STEP ** o2Level(); const d = ctx.dive; if (!d || !d.maxOxygen) return;
    if (d._o2Base == null) d._o2Base = d.maxOxygen; d.maxOxygen = d._o2Base * api.o2Mult; o2Applied = o2Level();
  }
  function nearest() { let best = null, bd = 1e9; const p = ctx.player.pos; for (const c of C) if (!S.open[c.i]) { const d = Math.hypot(c.s.x - p.x, c.s.z - p.z); if (d < bd) { bd = d; best = c; } } return best && { c: best, d: bd }; }
  function label() {
    let t = `🧰 ${opened()}/${N}`; const nr = S.map && nearest();
    if (nr && nr.d > 3 && nr.d < 233) t += ` · 🧭 ${dirName(nr.c.s.x - ctx.player.pos.x, nr.c.s.z - ctx.player.pos.z)} ${Math.round(nr.d)} m`;
    if (hud.textContent !== t) hud.textContent = t;
  }
  function openBook() {
    const sp = sea.SPECIES, f = sea.found, nf = sp.filter(s => f[s.id]).length;
    book.innerHTML = `<div class="card"><h3>🌊 Sổ biển</h3><b>🧰 Rương kho báu ${opened()}/${N}</b><div class="bar"><i style="width:${opened() / N * 100}%"></i></div>
      <ul>${sea.ZONES.map(Z => { const list = C.filter(c => c.s.zone === Z), k = list.filter(c => S.open[c.i]).length; return `<li class="${k === list.length ? 'ok' : ''}">${Z.icon} <b>${Z.name}</b> — ${k}/${list.length} rương</li>`; }).join('')}</ul>
      ${S.map ? '' : '<p><small>💡 Tìm <b>mảnh bản đồ</b> trên bãi cát cạnh vịnh nông phía nam trường để biết rương đầu tiên ở đâu.</small></p>'}
      <p><small>🫧 Dưỡng khí: ×${(O2_STEP ** o2Level()).toFixed(2)} (mở rương thứ 3, 5, 8, 13 để tăng)</small></p>
      <b>📘 Bách khoa biển ${nf}/${sp.length}</b><div class="bar"><i style="width:${nf / sp.length * 100}%"></i></div>
      <ul>${sp.map(s => f[s.id] ? `<li class="ok">${s.icon} <b>${s.name}</b><small>${s.fact}</small></li>` : `<li>❓ <b>???</b><small>Lặn tới gần sinh vật biển rồi bấm E để khám phá.</small></li>`).join('')}</ul>
      <button class="x">Đóng sổ</button></div>`;
    book.hidden = false; freeze(true); book.querySelector('.x').onclick = () => { book.hidden = true; freeze(false); };
  }
  hud.onclick = () => book.hidden ? openBook() : (book.hidden = true, freeze(false));
  addEventListener('keydown', e => { if (e.code === 'Escape' && !book.hidden) { book.hidden = true; freeze(false); } });
  sea.onDiscover = () => label();

  // ---------- Cập nhật ----------
  let T = 0, lT = 0;
  function update(dt) {
    T += dt; pU.uTime.value = T; pU.uScale.value = innerHeight * ctx.renderer.getPixelRatio() / (2 * Math.tan(camera.fov * PI / 360));
    const cam = camera.position, p = ctx.player.pos, under = !!ctx.underwater || cam.y < W - 0.1;
    // rương chỉ vẽ khi ở dưới nước / nhìn gần mặt nước (2 draw call + 1 Points)
    let near = 1e9; for (const c of C) near = Math.min(near, Math.hypot(c.s.x - cam.x, c.s.z - cam.z));
    const show = (under && near < 89) || (cam.y < 13 && near < 34); body.visible = lid.visible = show;
    pts.visible = show || (!!map.mesh && !S.map && Math.hypot(map.pos.x - cam.x, map.pos.z - cam.z) < 89);
    let moved = false; for (const c of C) if (c.ang !== c.target) { c.ang += (c.target - c.ang) * Math.min(1, dt * 3); if (Math.abs(c.target - c.ang) < 0.01) c.ang = c.target; setLid(c); moved = true; }
    if (moved) lid.instanceMatrix.needsUpdate = true;
    if (burstT > 0) { burstT -= dt; for (let k = 0; k < NB; k++) { bV[k].y -= dt * 2.4; bV[k].multiplyScalar(1 - dt * 0.6); bPos[k * 3] += bV[k].x * dt; bPos[k * 3 + 1] += bV[k].y * dt; bPos[k * 3 + 2] += bV[k].z * dt; } bg.attributes.position.needsUpdate = true; if (burstT <= 0) burst.visible = false; }
    if (ctx.dive && ctx.dive.maxOxygen && o2Applied !== o2Level()) applyO2();
    if ((lT -= dt) <= 0) { lT = 0.5; label(); }
    if (busy()) return;
    // nút E: rương gần nhất (≤ 3 m, tính cả độ sâu) · mảnh bản đồ
    let tc = null, td = 9; for (const c of C) if (!S.open[c.i]) { const d = c.pos.distanceToSquared(p); if (d < td) { td = d; tc = c; } }
    if (tc) ctx.offer('🧰 Mở rương kho báu', () => ask(tc), 2);
    else if (map.mesh && !S.map && Math.hypot(map.pos.x - p.x, map.pos.z - p.z) < 2.2 && Math.abs(map.pos.y - p.y) < 2) ctx.offer('🗺️ Nhặt mảnh bản đồ', pickMap, 2);
  }
  const api = { update, chests: C, state: S, o2Mult: O2_STEP ** o2Level(), get opened() { return opened(); }, ask, openBook, map };
  label();
  return api;
}
