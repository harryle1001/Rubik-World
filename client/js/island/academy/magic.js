// academy/magic.js — ĐŨA PHÉP & THẦN CHÚ (nguyên bản, tiếng Việt). Mỗi học sinh 1 cây đũa: tự chọn gỗ + màu lõi pha lê.
// - Nhận đũa: Tiệm Đũa Pha Lê cạnh bến thuyền đảo chính, hoặc trong đại sảnh lần đầu tới.
// - Đũa cầm tay phải (bám xương handr của nhân vật people-model). Phép dùng KHẮP thế giới:
//   máy tính: phím 1–9/0 niệm ngay phép số đó (ngắm theo chuột), F niệm phép đang chọn, ⟳ mở vòng phép;
//   điện thoại: chạm ✨ niệm phép đang chọn; giữ/kéo ngón từ ✨ → vòng 8 nút phép, rê tới phép rồi THẢ để niệm.
// - Mỗi phép: cost (năng lượng), cd (hồi chiêu, giây), say (câu hô). Mô-đun khác nghe magic.onCast(fn) (spellbook.js: hô, đồng bộ mạng).
// - Năng lượng phép (mana) chỉ hồi khi trả lời đúng câu hỏi theo môn của phép đang chọn (📚). Không có phép tấn công người chơi.
// - Mỗi phép gắn kiến thức; "mục tiêu" (đèn tắt, tảng đá, cửa khoá…) đăng ký bằng addTarget() → phép tác động khi đứng gần.
import * as THREE from 'three';
import { pickQuestions } from '../quiz-data.js';
import { CFG } from '../config.js';
import { HOUSE } from './houses-data.js';

export const WOODS = [
  { id: 'tre', name: 'Tre', col: '#c9b26a' }, { id: 'thong', name: 'Thông', col: '#a8744a' }, { id: 'soi', name: 'Sồi', col: '#8a5a35' },
  { id: 'mun', name: 'Mun', col: '#2e2622' }, { id: 'hoangdan', name: 'Hoàng đàn', col: '#b5653a' },
];
export const CORES = [
  { id: 'lam', name: 'Lam', col: '#5ac8fa' }, { id: 'luc', name: 'Lục', col: '#4cd964' }, { id: 'hong', name: 'Hồng', col: '#ff6fae' }, { id: 'vang', name: 'Vàng', col: '#ffd34d' },
  { id: 'tim', name: 'Tím', col: '#a78bfa' }, { id: 'do', name: 'Đỏ', col: '#ff5a4e' }, { id: 'trang', name: 'Trắng', col: '#f3f6ff' }, { id: 'cam', name: 'Cam', col: '#ff9f43' },
];
const COST = 13, GAIN = 34, MAXM = 100, REACH = 13, CD = 1.618, PAGE = 8;
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

const css = `
#mgk{position:fixed;left:max(12px,env(safe-area-inset-left));top:calc(max(12px,env(safe-area-inset-top)) + 52px);z-index:26;display:flex;gap:6px;align-items:center;font:700 13px system-ui;color:#f7ecd0}
@media (pointer:coarse){#mgkName,#mgkPick{display:none}}
#mgk .bar{width:89px;height:10px;border-radius:6px;background:#0007;overflow:hidden;border:1px solid #fff5}#mgk .bar i{display:block;height:100%;background:linear-gradient(90deg,#7fd3ff,#ffe3a0)}
#mgk button{border:1px solid #fff6;background:#1b1626cc;color:#fff;border-radius:14px;padding:4px 9px;font:700 13px system-ui}
#mgCard{position:fixed;left:50%;bottom:calc(max(12px,env(safe-area-inset-bottom)) + 76px);transform:translateX(-50%);z-index:27;width:min(92vw,377px);background:#141022ee;color:#f7ecd0;border:1px solid #ffe3a066;border-radius:16px;padding:12px 14px;font:600 14px/1.45 system-ui;box-shadow:0 8px 30px #0006}
#mgCard h4{margin:0 0 6px;font:800 15px system-ui;color:#ffe3a0}#mgCard .ch{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}
#mgCard button{border:1px solid #fff4;background:#2a2340;color:#fff;border-radius:10px;padding:8px 6px;font:700 14px system-ui}
#mgCard button.ok{background:#2c6455}#mgCard button.no{background:#7a2e2e}#mgCard .dots{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
#mgCard .dots button{width:34px;height:34px;border-radius:50%;padding:0}#mgCard .dots button[aria-pressed=true]{outline:3px solid #ffe3a0}
#mgCard .row{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}#mgCard .row button[aria-pressed=true]{background:#5a4a2a;border-color:#ffe3a0}
#bSpell{position:fixed;z-index:26;right:calc(max(16px,env(safe-area-inset-right)) + 180px);bottom:max(18px,env(safe-area-inset-bottom));width:70px;height:70px;border-radius:50%;border:2px solid #ffe3a0aa;background:radial-gradient(#3a2a6a,#1b1626cc);color:#fff;font-size:28px;touch-action:none;-webkit-user-select:none;user-select:none}@media (pointer:fine){#bSpell{display:none}}body.rs-modal #bSpell{display:none}
#mgRing{position:fixed;z-index:28;pointer-events:none;inset:0}#mgRing button{position:absolute;width:47px;height:47px;margin:-23px;border-radius:50%;border:2px solid #ffe3a0aa;background:#1b1626ee;color:#fff;font:700 20px/1 system-ui;pointer-events:auto;padding:0;transition:transform .12s}
#mgRing button.hi{transform:scale(1.272);border-color:#fff;background:#3a2a6a}#mgRing button.cur{border-color:#ffe3a0;box-shadow:0 0 13px #ffe3a0aa}#mgRing button.low{opacity:.5}
#mgRing button i,#bSpell i{position:absolute;inset:0;border-radius:50%;background:conic-gradient(#000a calc(var(--cd,0)*1turn),#0000 0);pointer-events:none}#mgRing kbd{position:absolute;right:-4px;top:-6px;font:700 10px system-ui;background:#ffe3a0;color:#231600;border-radius:6px;padding:0 3px}
#mgRing .lbl{position:absolute;transform:translate(-50%,-50%);font:800 13px system-ui;color:#ffe3a0;text-shadow:0 1px 3px #000;white-space:nowrap}
#bSpell{overflow:visible}#bSpell b{position:absolute;left:50%;bottom:100%;transform:translateX(-50%);margin-bottom:2px;font:700 11px system-ui;white-space:nowrap;text-shadow:0 1px 2px #000;pointer-events:none}
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
  const NP = 144, pPos = new Float32Array(NP * 3), pCol = new Float32Array(NP * 3), parts = Array.from({ length: NP }, () => ({ life: 0, v: new THREE.Vector3(), p: new THREE.Vector3() }));
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const dot = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, '#fff'); r.addColorStop(0.382, '#ffffffaa'); r.addColorStop(1, '#fff0'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();   // hạt tròn mềm (không còn ô vuông)
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ map: dot, size: 0.34, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  pts.frustumCulled = false; scene.add(pts);
  let pi = 0; const pc = new THREE.Color();
  function burst(from, dir, col, n = 21, speed = 8, spread = 0.35) {
    pc.set(col);
    for (let k = 0; k < n; k++) { const P = parts[pi = (pi + 1) % NP]; P.life = 0.6 + Math.random() * 0.5; P.p.copy(from); P.v.copy(dir).multiplyScalar(speed * (0.5 + Math.random() * 0.6)).add(vA.set(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).multiplyScalar(speed * spread)); P.r = pc.r; P.g = pc.g; P.b = pc.b; }
  }
  function updParts(dt) {
    for (let i = 0, j = 0; i < NP; i++, j += 3) {   // ghi thẳng vào mảng đệm (không tạo mảng/màu mới mỗi khung)
      const P = parts[i]; if (P.life > 0) { P.life -= dt; P.v.multiplyScalar(1 - dt * 1.6); P.v.y += dt * 0.8; P.p.addScaledVector(P.v, dt); }
      const a = Math.max(0, Math.min(1, P.life * 2)), on = P.life > 0;
      pPos[j] = on ? P.p.x : 0; pPos[j + 1] = on ? P.p.y : -999; pPos[j + 2] = on ? P.p.z : 0; if (P.r !== undefined) { pCol[j] = P.r * a; pCol[j + 1] = P.g * a; pCol[j + 2] = P.b * a; }
    }
    pg.attributes.position.needsUpdate = pg.attributes.color.needsUpdate = true;
  }
  const coreCol = () => st.wand ? CORES.find(c => c.id === st.wand.core).col : '#ffe3a0';
  const fxCol = () => { const h = ctx.houses && ctx.houses.houseId && ctx.houses.houseId(); return (h && HOUSE[h] && HOUSE[h].col) || coreCol(); };   // hạt/tia theo màu nhà Tứ Linh (chưa có nhà: màu lõi đũa)

  // ---------- HUD: thanh năng lượng, phép đang chọn, nạp năng lượng ----------
  const hud = document.createElement('div'); hud.id = 'mgk'; hud.hidden = true;
  hud.innerHTML = '<span id="mgkName"></span><span class="bar"><i></i></span><span id="mgkVal"></span><button id="mgkRe">📚 +34</button><button id="mgkPick">⟳</button>';
  document.body.appendChild(hud);
  const bar = hud.querySelector('.bar i');
  const bSpell = document.createElement('button'); bSpell.id = 'bSpell'; bSpell.innerHTML = '✨<b></b><i></i>'; const bLbl = bSpell.querySelector('b'), bCd = bSpell.querySelector('i'); bSpell.hidden = true; document.body.appendChild(bSpell);   // điện thoại: cùng hàng, bên trái cụm Chạy/Nhảy (ô trên dành cho nút ✋ bAct)
  const avail = s => !s.unlocked || s.unlocked();
  const list = () => spells.filter(avail).sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
  const cur = () => spells.find(s => s.id === st.spell && avail(s)) || list()[0];
  const cds = {}; const cdOf = s => s.cd ?? CD; const costOf = s => s.cost ?? COST;
  function refresh() {
    const s = cur(); hud.hidden = !st.wand || document.body.classList.contains('rs-modal'); bSpell.hidden = !st.wand;
    hud.querySelector('#mgkName').textContent = s ? `${s.icon} ${s.name}` : ''; bSpell.firstChild.textContent = s ? s.icon : '✨'; bLbl.textContent = s ? s.name : '';
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
    { const ord = q.choices.map((_, i) => i).sort(() => Math.random() - 0.5); q = { ...q, choices: ord.map(i => q.choices[i]), a: ord.indexOf(q.a) }; }   // xáo đáp án
    const c = openCard(`<h4>${title}</h4><div>${q.icon ? q.icon + ' ' : ''}${q.q}</div><div class="ch">${q.choices.map((t, i) => `<button data-i="${i}">${t}</button>`).join('')}</div><div style="text-align:right;margin-top:6px"><button data-x>Đóng</button></div>`);
    c.dataset.a = q.a;   // (kiểm thử tự động)
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
        ctx.toast(was ? '🪄 Đã đổi đũa mới!' : `🪄 Đũa <b>${WOODS.find(x => x.id === w).name}</b> lõi pha lê <b>${CORES.find(x => x.id === c).name}</b> là của em! ${CFG.isMobile ? 'Bấm ✨ để niệm phép.' : 'Phím <b>F</b> để niệm phép, <b>1–9</b> niệm nhanh, chuột để nhắm.'}`, 6000);
      }
    };
  }

  // ---------- vòng phép: tối đa 8 nút (nhiều hơn → nút ⋯ sang trang), kéo ngón để chọn, thả để niệm ----------
  let ring = null, page = 0, placeT = 0;
  function openRing(anchor, { castOnPick = false, a0, a1 } = {}) {
    closeRing(); const all = list(); if (!all.length) return;
    if (a0 === undefined) { const up = anchor.getBoundingClientRect().top > innerHeight / 2; a0 = Math.PI; a1 = up ? 0 : 2 * Math.PI; }   // nút ở nửa dưới: vòng mở lên trên, nửa trên: mở xuống
    const pages = all.length > PAGE ? Math.ceil(all.length / (PAGE - 1)) : 1; page %= pages;
    const items = pages > 1 ? [...all.slice(page * (PAGE - 1), page * (PAGE - 1) + PAGE - 1), { id: '_more', icon: '⋯', name: `trang ${(page + 1) % pages + 1}` }] : all;
    ring = document.createElement('div'); ring.id = 'mgRing'; document.body.appendChild(ring); ring.castOnPick = castOnPick; ring.anchor = anchor; ring.opts = { a0, a1 };
    const r = anchor.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = 110;   // 110 ≈ 68·φ
    ring.cx = cx; ring.cy = cy; ring.btns = [];
    const lbl = document.createElement('div'); lbl.className = 'lbl'; lbl.style.left = cx + 'px'; lbl.style.top = cy - R - 47 + 'px'; ring.appendChild(lbl); ring.lbl = lbl;
    if (a1 > Math.PI || cy - R - 47 < 13) lbl.style.top = cy + R + 47 + 'px';
    items.forEach((s, i) => {
      const a = a0 + (items.length > 1 ? i / (items.length - 1) : 0.5) * (a1 - a0), b = document.createElement('button');
      const x = Math.min(innerWidth - 26, Math.max(26, cx + Math.cos(a) * R)), y = Math.min(innerHeight - 26, Math.max(26, cy - Math.sin(a) * R));
      b.style.left = x + 'px'; b.style.top = y + 'px'; b.s = s; b.ax = x; b.ay = y;
      const k = all.indexOf(s); b.innerHTML = `${s.icon}<i></i>${!CFG.isMobile && k >= 0 && k < 10 ? `<kbd>${(k + 1) % 10}</kbd>` : ''}`;
      if (s.id === (cur() || {}).id) b.classList.add('cur');
      b.onclick = e => { e.stopPropagation(); pick(b); }; b.onpointerenter = () => hiAt(x, y); ring.appendChild(b); ring.btns.push(b);
    });
    paintRing(); setTimeout(() => addEventListener('pointerdown', onOut), 0);
  }
  function paintRing() { if (!ring) return; for (const b of ring.btns) { const s = b.s; if (s.id === '_more') continue; b.querySelector('i').style.setProperty('--cd', (cds[s.id] || 0) / cdOf(s)); b.classList.toggle('low', st.mana < costOf(s)); } }
  function hiAt(x, y) {   // nút gần ngón tay nhất (theo khoảng cách tới nút, ngón phải rời tâm ≥ 34 px)
    if (!ring) return null; let best = null, bd = 55 * 55;
    if (Math.hypot(x - ring.cx, y - ring.cy) > 34) for (const b of ring.btns) { const d = (b.ax - x) ** 2 + (b.ay - y) ** 2; if (d < bd) { bd = d; best = b; } }
    for (const b of ring.btns) b.classList.toggle('hi', b === best);
    ring.lbl.innerHTML = best ? (best.s.id === '_more' ? '⋯ Thêm phép' : `${best.s.icon} ${best.s.say || best.s.name}`) : 'Rê tới phép rồi thả ✨';
    return best;
  }
  function pick(b) {
    if (b.s.id === '_more') { page++; openRing(ring.anchor, { castOnPick: ring.castOnPick, ...ring.opts }); return; }
    const c = ring.castOnPick; closeRing(); select(b.s.id, c); if (c) cast();
  }
  const onOut = e => { if (ring && !ring.contains(e.target) && e.target !== bSpell && e.target !== pickBtn) closeRing(); };
  function closeRing() { if (ring) { ring.remove(); ring = null; removeEventListener('pointerdown', onOut); } }
  function select(id, quiet) { const s = spells.find(x => x.id === id); if (!s || !avail(s)) return; const ch = st.spell !== id; st.spell = id; save('academy.spell', id); refresh(); if (!quiet && ch) ctx.toast(`${s.icon} Phép <b>${s.name}</b>: ${s.learn || ''}`, 3500); }
  const pickBtn = hud.querySelector('#mgkPick');
  pickBtn.onclick = () => { if (ring) return closeRing(); openRing(pickBtn); hiAt(-99, -99); };
  // ✨ điện thoại: chạm = niệm; giữ 1/φ³ s hoặc kéo > 21 px = mở vòng; rê tới phép, thả = niệm; thả ở giữa = huỷ
  let press = null;
  bSpell.addEventListener('pointerdown', e => {
    e.preventDefault(); try { bSpell.setPointerCapture(e.pointerId); } catch (er) {}
    press = { x: e.clientX, y: e.clientY, t: setTimeout(() => { if (press && !ring) { openRing(bSpell, { castOnPick: true }); hiAt(e.clientX, e.clientY); } }, 236) };
  });
  bSpell.addEventListener('pointermove', e => {
    if (!press) return;
    if (!ring && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 21) { clearTimeout(press.t); openRing(bSpell, { castOnPick: true }); }
    hiAt(e.clientX, e.clientY);
  });
  const release = (e, cancel) => {
    if (!press) return; clearTimeout(press.t); const was = press; press = null;
    if (!ring) { if (!cancel) cast(); return; }
    const b = cancel ? null : hiAt(e.clientX, e.clientY);
    if (b) pick(b); else if (Math.hypot(e.clientX - was.x, e.clientY - was.y) > 21) closeRing();   // giữ yên rồi thả: vòng vẫn mở để chạm chọn
  };
  bSpell.addEventListener('pointerup', e => release(e)); bSpell.addEventListener('pointercancel', e => release(e, true));
  // máy tính: chuột nhắm (vị trí con trỏ trên màn hình), 1–9/0 niệm phép số đó, F niệm phép đang chọn
  const mouse = { x: 0, y: 0, ok: false };
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { mouse.x = e.clientX; mouse.y = e.clientY; mouse.ok = e.target && e.target.tagName === 'CANVAS'; } });
  addEventListener('keydown', e => {
    if (!st.wand || player.frozen || e.repeat || /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName) || document.body.classList.contains('rs-modal')) return;
    if (e.code === 'KeyF') cast();
    if (/^Digit\d$/.test(e.code)) { const n = +e.code.slice(5), s = list()[(n + 9) % 10]; if (s) { select(s.id, true); cast(); } }
  });

  // ---------- niệm phép ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), aimP = new THREE.Vector3(), rp = new THREE.Vector3(), W = CFG.island.waterLevel;
  const hooks = [];
  function aimAt() {   // điểm ngắm trên mặt đất/mặt nước: theo chuột (máy tính) hoặc giữa màn hình (điện thoại)
    const useMouse = !CFG.isMobile && mouse.ok;
    ndc.set(useMouse ? mouse.x / innerWidth * 2 - 1 : 0, useMouse ? -(mouse.y / innerHeight * 2 - 1) : 0.05);
    ray.setFromCamera(ndc, ctx.camera); const o = ray.ray.origin, d = ray.ray.direction;
    for (let t = 2; t < 89; t += 0.5) { rp.copy(o).addScaledVector(d, t); const g = Math.max(ctx.terrain.heightAt(rp.x, rp.z), ctx.groundExtra ? ctx.groundExtra(rp.x, rp.z, rp.y) : -99, W); if (rp.y <= g) { rp.y = g; if (rp.distanceTo(player.pos) > 2) return aimP.copy(rp); break; } }
    return aimP.copy(player.pos).addScaledVector(fw.set(d.x, 0, d.z).normalize(), 13).setY(player.pos.y + 1);
  }
  function cast() {
    if (!st.wand || player.vehicle) return; const s = cur(); if (!s) return;
    if (cds[s.id] > 0) { ctx.toast(`⏳ ${s.icon} <b>${s.name}</b> đang hồi phép: ${cds[s.id].toFixed(1)} giây`, 1600); return; }
    if (st.mana < costOf(s)) { ctx.toast('🔋 Hết năng lượng phép! Bấm <b>📚 +34</b> và trả lời đúng 1 câu để nạp.', 3500); return; }
    cds[s.id] = cdOf(s); player.emote && player.emote('interact');
    const aim = aimAt().clone(); fw.set(aim.x - player.pos.x, 0, aim.z - player.pos.z); if (fw.lengthSq() < 1e-4) ctx.camera.getWorldDirection(fw).setY(0); fw.normalize();
    player.setRot && player.setRot(Math.atan2(fw.x, fw.z));
    // mục tiêu gần nhất của phép này, trước mặt (±60°), trong tầm 13 m
    let best = null, bd = 89;
    for (const T of targets) {
      if (T.spell !== s.id || (T.done && T.done())) continue;
      const dx = T.pos.x - player.pos.x, dz = T.pos.z - player.pos.z, d = Math.hypot(dx, dz), dy = Math.abs(T.pos.y - player.pos.y);
      if (d < Math.min(bd, T.reach || REACH) && dy < 13 && (d < 2.5 || (dx * fw.x + dz * fw.z) / d > 0.5)) { bd = d; best = T; }
    }
    setMana(st.mana - costOf(s)); ctx.sfx && ctx.sfx('magic');
    const from = tipW.clone(), to = best ? best.pos.clone() : aim, dir = to.clone().sub(from).normalize(), col = fxCol();
    burst(from, dir, col, 21, best ? Math.min(13, bd * 1.6) : 8, 0.25);
    const api = { ask, toast: ctx.toast, burst, color: col, player, from, dir, aim: to, fw: fw.clone(), spell: s, target: best, share: null };
    let ok = true;
    if (best) best.onCast(api); else if (s.cast) ok = s.cast(api) !== false; else ctx.toast(`${s.icon} Phép bay đi… nhưng gần đây không có gì để <b>${s.name.toLowerCase()}</b>. ${s.hint || ''}`, 3000);
    if (!ok) { cds[s.id] = 0.3; setMana(st.mana + costOf(s)); }   // phép không dùng được ở đây (vd. Đóng băng xa nước): trả lại năng lượng
    for (const h of hooks) { try { h(s, api, ok); } catch (e) { console.warn(e); } }
  }
  function update(dt) {
    for (const k in cds) if (cds[k] > 0) cds[k] = Math.max(0, cds[k] - dt);
    placeWand(); updParts(dt); paintRing(); { const c = cur(); bCd.style.setProperty('--cd', c ? (cds[c.id] || 0) / cdOf(c) : 0); }
    for (const s of spells) s.update && s.update(dt);
    const hide = !st.wand || !!player.vehicle || document.body.classList.contains('rs-modal'); if (hud.hidden !== hide) hud.hidden = hide; if (bSpell.hidden !== hide) bSpell.hidden = hide;
    if (!hide && (placeT -= dt) <= 0) { placeT = 1; const q = document.getElementById('questHud'), b = q && q.getClientRects().length ? q.getBoundingClientRect().bottom : 0; hud.style.top = Math.max(b + 8, 120) + 'px'; }   // ngay dưới bảng nhiệm vụ (trái trên), không chồng thanh trên / ô Rubik góc dưới
  }
  refresh();
  return {
    update, chooseWand, ask, burst, refresh, select,
    setWand(wood, core) { st.wand = { wood: wood || (st.wand && st.wand.wood) || 'thong', core: core || (st.wand && st.wand.core) || 'lam' }; save('academy.wand', st.wand); paint(); refresh(); },   // Phố Phép Thuật: mua gỗ/lõi mới
    get wand() { return st.wand; },
    get hasWand() { return !!st.wand; }, get mana() { return st.mana; }, setMana,
    addSpell(s) { const k = spells.findIndex(x => x.id === s.id); if (k >= 0) spells[k] = s; else spells.push(s); refresh(); return s; },
    getSpell: id => spells.find(s => s.id === id), get list() { return list(); }, onCast(fn) { hooks.push(fn); }, cast, openRing, closeRing, hud, fxCol, aimAt,
    cooldown: id => cds[id] || 0, addTarget(T) { targets.add(T); return T; }, removeTarget(T) { targets.delete(T); },
    get tip() { return tipW; }, get targets() { return targets; }, get spell() { return cur(); },
  };
}
