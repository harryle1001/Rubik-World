// academy/magic.js — ĐŨA PHÉP & THẦN CHÚ (nguyên bản, tiếng Việt). Mỗi học sinh 1 cây đũa: tự chọn gỗ + màu lõi pha lê.
// - Nhận đũa: Tiệm Đũa Pha Lê cạnh bến thuyền đảo chính, hoặc trong đại sảnh lần đầu tới.
// - Đũa cầm tay phải (bám xương handr của nhân vật people-model). Phép: phím F (máy tính) / nút ✨ (điện thoại); chọn phép: phím 1–6,
//   giữ nút ✨ (hoặc chạm ⟳) để mở vòng chọn phép.
// - Năng lượng phép (mana) chỉ hồi khi trả lời đúng câu hỏi theo môn của phép đang chọn (📚). Không có phép tấn công người chơi.
// - Mỗi phép gắn kiến thức; "mục tiêu" (đèn tắt, tảng đá, cửa khoá…) đăng ký bằng addTarget() → phép tác động khi đứng gần.
import * as THREE from 'three';
import { pickQuestions } from '../quiz-data.js';
import { CFG } from '../config.js';

export const WOODS = [
  { id: 'tre', name: 'Tre', col: '#c9b26a' }, { id: 'thong', name: 'Thông', col: '#a8744a' }, { id: 'soi', name: 'Sồi', col: '#8a5a35' },
  { id: 'mun', name: 'Mun', col: '#2e2622' }, { id: 'hoangdan', name: 'Hoàng đàn', col: '#b5653a' },
];
export const CORES = [
  { id: 'lam', name: 'Lam', col: '#5ac8fa' }, { id: 'luc', name: 'Lục', col: '#4cd964' }, { id: 'hong', name: 'Hồng', col: '#ff6fae' }, { id: 'vang', name: 'Vàng', col: '#ffd34d' },
  { id: 'tim', name: 'Tím', col: '#a78bfa' }, { id: 'do', name: 'Đỏ', col: '#ff5a4e' }, { id: 'trang', name: 'Trắng', col: '#f3f6ff' }, { id: 'cam', name: 'Cam', col: '#ff9f43' },
];
const COST = 13, GAIN = 34, MAXM = 100, REACH = 13;
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

const css = `
#mgk{position:fixed;left:max(12px,env(safe-area-inset-left));top:calc(max(12px,env(safe-area-inset-top)) + 52px);z-index:26;display:flex;gap:6px;align-items:center;font:700 13px system-ui;color:#f7ecd0}
@media (max-width:610px){#mgk{top:calc(max(12px,env(safe-area-inset-top)) + 80px)}}
#mgk .bar{width:89px;height:10px;border-radius:6px;background:#0007;overflow:hidden;border:1px solid #fff5}#mgk .bar i{display:block;height:100%;background:linear-gradient(90deg,#7fd3ff,#ffe3a0)}
#mgk button{border:1px solid #fff6;background:#1b1626cc;color:#fff;border-radius:14px;padding:4px 9px;font:700 13px system-ui}
#mgCard{position:fixed;left:50%;bottom:calc(max(12px,env(safe-area-inset-bottom)) + 76px);transform:translateX(-50%);z-index:27;width:min(92vw,377px);background:#141022ee;color:#f7ecd0;border:1px solid #ffe3a066;border-radius:16px;padding:12px 14px;font:600 14px/1.45 system-ui;box-shadow:0 8px 30px #0006}
#mgCard h4{margin:0 0 6px;font:800 15px system-ui;color:#ffe3a0}#mgCard .ch{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}
#mgCard button{border:1px solid #fff4;background:#2a2340;color:#fff;border-radius:10px;padding:8px 6px;font:700 14px system-ui}
#mgCard button.ok{background:#2c6455}#mgCard button.no{background:#7a2e2e}#mgCard .dots{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
#mgCard .dots button{width:34px;height:34px;border-radius:50%;padding:0}#mgCard .dots button[aria-pressed=true]{outline:3px solid #ffe3a0}
#mgCard .row{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}#mgCard .row button[aria-pressed=true]{background:#5a4a2a;border-color:#ffe3a0}
#bSpell{background:radial-gradient(#3a2a6acc,#1b1626cc)!important;font-size:26px!important}
#mgRing{position:fixed;z-index:28;pointer-events:none}#mgRing button{position:absolute;width:55px;height:55px;margin:-27px;border-radius:50%;border:2px solid #ffe3a0;background:#1b1626ee;color:#fff;font:700 11px system-ui;pointer-events:auto}
`;

export function createMagic(ctx) {
  const { scene, player } = ctx;
  const st = { wand: load('academy.wand', null), mana: load('academy.mana', 55), spell: load('academy.spell', 'light') };
  const spells = [];     // { id, name, icon, subjects, learn, cast?(api) fallback, unlocked?() }
  const targets = new Set();
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  // ---------- đũa ----------
  const wand = new THREE.Group(); wand.visible = false; scene.add(wand);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.016, 0.36, 6).translate(0, 0.18, 0), new THREE.MeshToonMaterial({ color: '#a8744a' }));
  const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.025), new THREE.MeshBasicMaterial({ color: '#5ac8fa' })); tip.position.y = 0.37;
  wand.add(shaft, tip);
  const paint = () => { if (!st.wand) return; shaft.material.color.set(WOODS.find(w => w.id === st.wand.wood).col); tip.material.color.set(CORES.find(c => c.id === st.wand.core).col); };
  paint();
  const vH = new THREE.Vector3(), vA = new THREE.Vector3(), vD = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), fw = new THREE.Vector3(), tipW = new THREE.Vector3();
  function placeWand() {
    const hero = player.hero; wand.visible = !!st.wand && !player.vehicle;
    if (!wand.visible) return;
    const hand = hero && hero.model.getObjectByName('handr'), arm = hero && hero.model.getObjectByName('lowerarmr');
    fw.set(Math.sin(player.rot), 0, Math.cos(player.rot));
    if (hand && arm) { hand.getWorldPosition(vH); arm.getWorldPosition(vA); vD.subVectors(vH, vA).normalize().multiplyScalar(0.5).addScaledVector(fw, 0.6).addScaledVector(up, 0.25).normalize(); }
    else { vH.copy(player.pos).addScaledVector(fw, 0.3).add(vA.set(Math.cos(player.rot) * -0.25, 1.0, -Math.sin(player.rot) * -0.25)); vD.copy(fw).addScaledVector(up, 0.3).normalize(); }
    wand.position.copy(vH); wand.quaternion.setFromUnitVectors(up, vD);
    tip.getWorldPosition(tipW); tip.rotation.y += 0.05;
  }

  // ---------- hạt sáng (1 draw call) ----------
  const NP = 55, pPos = new Float32Array(NP * 3), pCol = new Float32Array(NP * 3), parts = Array.from({ length: NP }, () => ({ life: 0, v: new THREE.Vector3(), p: new THREE.Vector3() }));
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.22, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  pts.frustumCulled = false; scene.add(pts);
  let pi = 0; const pc = new THREE.Color();
  function burst(from, dir, col, n = 21, speed = 8, spread = 0.35) {
    pc.set(col);
    for (let k = 0; k < n; k++) { const P = parts[pi = (pi + 1) % NP]; P.life = 0.6 + Math.random() * 0.5; P.p.copy(from); P.v.copy(dir).multiplyScalar(speed * (0.5 + Math.random() * 0.6)).add(vA.set(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).multiplyScalar(speed * spread)); P.c = pc.clone(); }
  }
  function updParts(dt) {
    parts.forEach((P, i) => {
      if (P.life > 0) { P.life -= dt; P.v.multiplyScalar(1 - dt * 1.6); P.v.y += dt * 0.8; P.p.addScaledVector(P.v, dt); }
      const a = Math.max(0, Math.min(1, P.life * 2)); pPos.set(P.life > 0 ? [P.p.x, P.p.y, P.p.z] : [0, -999, 0], i * 3); if (P.c) pCol.set([P.c.r * a, P.c.g * a, P.c.b * a], i * 3);
    });
    pg.attributes.position.needsUpdate = pg.attributes.color.needsUpdate = true;
  }
  const coreCol = () => st.wand ? CORES.find(c => c.id === st.wand.core).col : '#ffe3a0';

  // ---------- HUD: thanh năng lượng, phép đang chọn, nạp năng lượng ----------
  const hud = document.createElement('div'); hud.id = 'mgk'; hud.hidden = true;
  hud.innerHTML = '<span id="mgkName"></span><span class="bar"><i></i></span><span id="mgkVal"></span><button id="mgkRe">📚 +34</button><button id="mgkPick">⟳</button>';
  document.body.appendChild(hud);
  const bar = hud.querySelector('.bar i');
  const btns = document.querySelector('.btns'), bSpell = document.createElement('button'); bSpell.id = 'bSpell'; bSpell.textContent = '✨'; bSpell.hidden = true; btns && btns.prepend(bSpell);
  const cur = () => spells.find(s => s.id === st.spell && avail(s)) || spells.find(avail);
  const avail = s => !s.unlocked || s.unlocked();
  function refresh() {
    const s = cur(); hud.hidden = !st.wand || document.body.classList.contains('rs-modal'); bSpell.hidden = !st.wand;
    hud.querySelector('#mgkName').textContent = s ? `${s.icon} ${s.name}` : '';
    hud.querySelector('#mgkVal').textContent = Math.round(st.mana); bar.style.width = st.mana + '%';
  }
  const setMana = m => { st.mana = Math.max(0, Math.min(MAXM, m)); save('academy.mana', st.mana); refresh(); };

  // ---------- thẻ nhỏ (câu hỏi, chọn đũa) — không che màn hình ----------
  let card = null;
  function closeCard() { if (card) { card.remove(); card = null; } }
  function openCard(html) { closeCard(); card = document.createElement('div'); card.id = 'mgCard'; card.innerHTML = html; document.body.appendChild(card); return card; }
  /** hỏi 1 câu: q = { q, choices, a, explain } hoặc tên môn; onRight() khi đúng */
  function ask(q, onRight, title = '📚 Trả lời đúng để nạp năng lượng phép') {
    if (typeof q === 'string' || Array.isArray(q)) q = pickQuestions([].concat(q), 1)[0];
    const c = openCard(`<h4>${title}</h4><div>${q.icon ? q.icon + ' ' : ''}${q.q}</div><div class="ch">${q.choices.map((t, i) => `<button data-i="${i}">${t}</button>`).join('')}</div><div style="text-align:right;margin-top:6px"><button data-x>Đóng</button></div>`);
    c.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.x !== undefined) return closeCard();
      const i = +b.dataset.i; if (Number.isNaN(i) || c.dataset.done) return; c.dataset.done = 1;
      const ok = i === q.a; b.classList.add(ok ? 'ok' : 'no'); c.querySelector(`[data-i="${q.a}"]`).classList.add('ok');
      ctx.sfx && ctx.sfx(ok ? 'coin' : 'no');
      c.insertAdjacentHTML('beforeend', `<div style="margin-top:6px">${ok ? '✅ Chính xác! ' : '💡 '}${q.explain || ''}</div>`);
      if (ok) setTimeout(() => { closeCard(); onRight && onRight(); }, 1400); else setTimeout(closeCard, 3400);
    };
  }
  function recharge() { const s = cur(); ask(s ? s.subjects : ['khoahoc', 'toan'], () => { setMana(st.mana + GAIN); ctx.toast(`✨ +${GAIN} năng lượng phép!`, 1800); }); }
  hud.querySelector('#mgkRe').onclick = recharge;

  function chooseWand(first) {
    let w = (st.wand && st.wand.wood) || 'thong', c = (st.wand && st.wand.core) || 'lam';
    const el = openCard(`<h4>🪄 ${first ? 'Chọn cây đũa của riêng em' : 'Đổi đũa phép'}</h4>
      <div>Gỗ thân đũa:</div><div class="row">${WOODS.map(x => `<button data-w="${x.id}">${x.name}</button>`).join('')}</div>
      <div>Lõi pha lê:</div><div class="dots">${CORES.map(x => `<button data-c="${x.id}" title="${x.name}" style="background:${x.col}"></button>`).join('')}</div>
      <div style="display:flex;gap:6px;justify-content:flex-end"><button data-x>Để sau</button><button class="ok" data-go>✨ Nhận đũa</button></div>`);
    const mark = () => { for (const b of el.querySelectorAll('[data-w]')) b.setAttribute('aria-pressed', b.dataset.w === w); for (const b of el.querySelectorAll('[data-c]')) b.setAttribute('aria-pressed', b.dataset.c === c); };
    mark();
    el.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.w) w = b.dataset.w; if (b.dataset.c) c = b.dataset.c; mark();
      if (b.dataset.x !== undefined) closeCard();
      if (b.dataset.go !== undefined) {
        const was = !!st.wand; st.wand = { wood: w, core: c }; save('academy.wand', st.wand); paint(); closeCard(); refresh();
        burst(player.pos.clone().setY(player.pos.y + 1.2), up, CORES.find(x => x.id === c).col, 34, 3, 1);
        ctx.toast(was ? '🪄 Đã đổi đũa mới!' : `🪄 Đũa <b>${WOODS.find(x => x.id === w).name}</b> lõi pha lê <b>${CORES.find(x => x.id === c).name}</b> là của em! ${CFG.isMobile ? 'Bấm ✨ để niệm phép.' : 'Phím <b>F</b> để niệm phép, <b>1–6</b> đổi phép.'}`, 6000);
      }
    };
  }

  // ---------- vòng chọn phép ----------
  let ring = null;
  function openRing(anchor) {
    closeRing(); const list = spells.filter(avail); if (!list.length) return;
    ring = document.createElement('div'); ring.id = 'mgRing'; document.body.appendChild(ring);
    const r = anchor.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = 89;
    list.forEach((s, i) => {
      const a = Math.PI + (i / Math.max(1, list.length - 1)) * (Math.PI / 2) * (list.length > 1 ? 1 : 0), b = document.createElement('button');
      b.style.left = cx + Math.cos(a) * R + 'px'; b.style.top = cy - Math.sin(a) * R + 'px'; b.innerHTML = `${s.icon}<br>${s.name}`;
      b.onclick = () => { select(s.id); closeRing(); }; ring.appendChild(b);
    });
    setTimeout(() => addEventListener('pointerdown', onOut, { once: true }), 0);
  }
  const onOut = e => { if (ring && !ring.contains(e.target)) closeRing(); };
  function closeRing() { if (ring) { ring.remove(); ring = null; } }
  function select(id) { const s = spells.find(x => x.id === id); if (!s || !avail(s)) return; st.spell = id; save('academy.spell', id); refresh(); ctx.toast(`${s.icon} Phép <b>${s.name}</b>: ${s.learn}`, 3500); }
  hud.querySelector('#mgkPick').onclick = () => openRing(hud.querySelector('#mgkPick'));
  let holdT = null;
  bSpell.addEventListener('pointerdown', e => { e.preventDefault(); holdT = setTimeout(() => { holdT = null; openRing(bSpell); }, 420); });
  bSpell.addEventListener('pointerup', () => { if (holdT) { clearTimeout(holdT); holdT = null; cast(); } });
  addEventListener('keydown', e => {
    if (!st.wand || player.frozen || /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName)) return;
    if (e.code === 'KeyF') cast();
    const n = +e.key; if (n >= 1 && n <= 6) { const list = spells.filter(avail); if (list[n - 1]) select(list[n - 1].id); }
  });

  // ---------- niệm phép ----------
  let cd = 0;
  function cast() {
    if (!st.wand || cd > 0 || player.vehicle) return; const s = cur(); if (!s) return;
    if (st.mana < COST) { ctx.toast('🔋 Hết năng lượng phép! Bấm <b>📚 +34</b> và trả lời đúng 1 câu để nạp.', 3500); return; }
    cd = 0.6; player.emote && player.emote('interact');
    ctx.camera.getWorldDirection(fw); fw.y = 0; fw.normalize();   // ngắm theo hướng camera (điện thoại: xoay màn hình là ngắm)
    player.setRot && player.setRot(Math.atan2(fw.x, fw.z));
    // mục tiêu gần nhất của phép này, trước mặt (±60°), trong tầm 13 m
    let best = null, bd = REACH;
    for (const T of targets) {
      if (T.spell !== s.id || (T.done && T.done())) continue;
      const dx = T.pos.x - player.pos.x, dz = T.pos.z - player.pos.z, d = Math.hypot(dx, dz), dy = Math.abs(T.pos.y - player.pos.y);
      if (d < bd && dy < 13 && (d < 2.5 || (dx * fw.x + dz * fw.z) / d > 0.5)) { bd = d; best = T; }
    }
    setMana(st.mana - COST); ctx.sfx && ctx.sfx('magic');
    const from = tipW.clone(), dir = best ? best.pos.clone().sub(from).normalize() : fw.clone().addScaledVector(up, 0.2).normalize();
    burst(from, dir, coreCol(), 21, best ? Math.min(13, bd * 1.6) : 8, 0.25);
    const api = { ask, toast: ctx.toast, burst, color: coreCol(), player, from, dir };
    if (best) best.onCast(api); else if (s.cast) s.cast(api); else ctx.toast(`${s.icon} Phép bay đi… nhưng gần đây không có gì để <b>${s.name.toLowerCase()}</b>. ${s.hint || ''}`, 3000);
  }

  function update(dt) {
    cd = Math.max(0, cd - dt); placeWand(); updParts(dt);
    for (const s of spells) s.update && s.update(dt);
    const hide = !st.wand || !!player.vehicle || document.body.classList.contains('rs-modal'); if (hud.hidden !== hide) hud.hidden = hide; if (bSpell.hidden !== hide) bSpell.hidden = hide;
  }
  refresh();
  return {
    update, chooseWand, ask, burst, refresh, select,
    get hasWand() { return !!st.wand; }, get mana() { return st.mana; }, setMana,
    addSpell(s) { spells.push(s); refresh(); }, addTarget(T) { targets.add(T); return T; }, removeTarget(T) { targets.delete(T); },
    get tip() { return tipW; }, get targets() { return targets; }, get spell() { return cur(); },
  };
}
