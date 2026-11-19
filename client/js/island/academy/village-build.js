// academy/village-build.js — CHẾ ĐỘ XÂY của phép "Dựng Lên!": chọn mảnh ở bảng, chạm vào lô → đũa chiếu tia, mảnh bay vào chỗ
// (lấp lánh + hô thần chú), lưới bắt điểm 3,4 m, 5 tầng; xoay, xoá, hoàn tác; nhà gợi ý 1 chạm; thử thách kiến trúc.
// Học tập: mảnh tốn 💎 đá pha lê — kiếm bằng câu đố (magic.ask) và thử thách diện tích / chu vi / đối xứng / tỷ lệ vàng.
// Điện thoại: chạm nhanh (< 0,35 s, lệch < 13 px) = đặt; kéo = xoay camera như thường; nút ≥ 44 px.
import * as THREE from 'three';
import { PIECES, BY_ID, CATS, RUBIK, LEVELS, MAX_PIECES, pieceMatrix, pieceBox, edgeDir } from './village-pieces.js';
import { VILLAGE as V } from './plan.js';
import { challenges } from './village-data.js';

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const CSS = `
#vb{position:fixed;left:50%;transform:translateX(-50%);bottom:max(8px,env(safe-area-inset-bottom));z-index:27;width:min(100vw - 16px,610px);background:#141022ee;color:#f7ecd0;border:1px solid #ffe3a066;border-radius:16px;padding:8px;font:700 13px system-ui;box-shadow:0 8px 30px #0007;box-sizing:border-box;-webkit-user-select:none;user-select:none}
#vb .tabs,#vb .act{display:flex;gap:5px;flex-wrap:wrap}#vb .tabs button{flex:1;min-height:34px}
#vb .pal{display:flex;gap:6px;overflow-x:auto;padding:7px 0;scrollbar-width:thin}
#vb button{border:1px solid #fff4;background:#2a2340;color:#fff;border-radius:11px;font:700 13px system-ui;min-height:44px;min-width:44px;padding:4px 8px;touch-action:manipulation}
#vb .pal button{flex:none;width:68px;height:68px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;font-size:11px;line-height:1.1}#vb .pal button b{font-size:26px}#vb .pal button i{font-style:normal;color:#9fe6ff}
#vb button[aria-pressed=true]{background:#5a4a2a;border-color:#ffe3a0}#vb button.on{background:#7a2e2e;border-color:#ff9a9a}
#vb .act{justify-content:space-between}#vb .act button{flex:1 1 auto}#vb .gem{color:#9fe6ff}
#vbSay{position:fixed;left:50%;top:34%;transform:translate(-50%,-50%);z-index:28;pointer-events:none;font:900 34px Georgia,serif;color:#ffe3a0;text-shadow:0 0 13px #a78bfa,0 3px 0 #3a2a6a;opacity:0;transition:opacity .2s,transform .6s}
#vbSay.go{opacity:1;transform:translate(-50%,-80%)}
body.vb-on #mgCard{bottom:calc(var(--vbh,190px) + 16px);max-height:calc(100vh - var(--vbh,190px) - 34px);overflow:auto;box-sizing:border-box}
body.vb-on .btns,body.vb-on #bAct,body.vb-on #bSpell,body.vb-on #lessonChip{display:none!important}
@media (max-width:420px){#vb .pal button{width:60px;height:62px}#vb button{font-size:12px;padding:4px 6px}}`;

export function createBuilder(ctx, magic, V0) {
  const { lot, geos, S } = V0;
  const st = { open: false, cat: 'nha', id: 'floor', rot: 0, col: 3, k: 0, erase: false, hist: [], seed: load('village.seed', 0), done: load('village.done', {}) };
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  // ---------- đá pha lê 💎 (hồ sơ tài khoản nếu có, không thì máy) ----------
  const prof = () => ctx.account && ctx.account.profile;
  const gems = () => { const p = prof(); if (p) { if (p.crystals == null) p.crystals = load('village.crystals', 34); return p.crystals; } return load('village.crystals', 34); };
  const setGems = n => { n = Math.max(0, Math.round(n)); const p = prof(); if (p) { p.crystals = n; ctx.account.save && ctx.account.save(); } save('village.crystals', n); refresh(); };
  const addGems = (n, why) => { setGems(gems() + n); if (why) ctx.toast(`💎 <b>+${n} đá pha lê</b> — ${why}`, 3500); };

  // ---------- cảnh: bóng mảnh (ghost), lưới ô, mảnh đang bay ----------
  const ghost = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: '#9fe6ff', transparent: true, opacity: 0.35, depthWrite: false })); ghost.visible = false; ghost.renderOrder = 3;
  const gridPts = []; for (let i = 0; i <= V.ni; i++) gridPts.push(i * S, 0, 0, i * S, 0, V.ll); for (let j = 0; j <= V.nj; j++) gridPts.push(0, 0, j * S, V.lw, 0, j * S);
  const grid = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(gridPts, 3)), new THREE.LineBasicMaterial({ color: '#ffe3a0', transparent: true, opacity: 0.55 })); grid.visible = false;
  ctx.scene.add(ghost, grid);
  const flying = [];   // { m, from, to, t }

  // ---------- giao diện ----------
  let el = null, say = null;
  function panel() {
    el = document.createElement('div'); el.id = 'vb';
    el.innerHTML = `<div class="tabs">${CATS.map(([id, n]) => `<button data-cat="${id}">${n}</button>`).join('')}</div><div class="pal"></div>
<div class="act"><button data-a="rot" title="Xoay (R)">⟳ Xoay</button><button data-a="col">🎨 Màu</button><button data-a="dn" title="Tầng dưới (Q)">⬇</button><button data-a="lv" disabled>Tầng 1</button><button data-a="up" title="Tầng trên (E)">⬆</button>
<button data-a="er" title="Xoá (X)">🧽 Xoá</button><button data-a="undo" title="Hoàn tác (Z)">↶</button><button data-a="tpl">🏠 Mẫu</button><button data-a="ch">🏆</button><button data-a="gem" class="gem">💎 0</button><button data-a="x" title="Thoát (Esc)">✖</button></div>`;
    document.body.appendChild(el);
    el.addEventListener('pointerdown', e => e.stopPropagation());
    el.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.cat) { st.cat = b.dataset.cat; const f = PIECES.find(p => p.cat === st.cat); if (f) st.id = f.id; st.erase = false; return refresh(); }
      if (b.dataset.id) { st.id = b.dataset.id; st.erase = false; return refresh(); }
      act(b.dataset.a);
    };
    say = document.createElement('div'); say.id = 'vbSay'; say.textContent = '✨ Dựng Lên!'; document.body.appendChild(say);
  }
  function act(a) {
    if (a === 'rot') { st.rot = (st.rot + 1) & 3; ctx.sfx && ctx.sfx('ui'); }
    else if (a === 'col') st.col = (st.col + 1) % RUBIK.length;
    else if (a === 'up') st.k = Math.min(LEVELS - 1, st.k + 1);
    else if (a === 'dn') st.k = Math.max(0, st.k - 1);
    else if (a === 'er') st.erase = !st.erase;
    else if (a === 'undo') undo();
    else if (a === 'tpl') return templates();
    else if (a === 'ch') return challengeCard();
    else if (a === 'gem') return earn();
    else if (a === 'x') return close();
    refresh();
  }
  function refresh() {
    if (!el) return;
    const p = BY_ID[st.id];
    el.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-pressed', b.dataset.cat === st.cat));
    const pal = el.querySelector('.pal'), want = PIECES.filter(x => x.cat === st.cat).map(x => x.id).join();
    if (pal.dataset.k !== want) { pal.dataset.k = want; pal.innerHTML = PIECES.filter(x => x.cat === st.cat).map(x => `<button data-id="${x.id}"><b>${x.icon}</b>${x.name}<i>💎${x.cost}</i></button>`).join(''); }
    pal.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', !st.erase && b.dataset.id === st.id));
    const q = s => el.querySelector(`[data-a="${s}"]`);
    q('lv').textContent = `Tầng ${st.k + 1}`; q('er').classList.toggle('on', st.erase); q('gem').textContent = `💎 ${gems()}`;
    q('col').hidden = !p.color; q('col').style.background = p.color ? RUBIK[st.col] : ''; q('col').style.color = p.color && st.col < 2 ? '#222' : '';
    q('rot').disabled = !(p.rot || p.kind === 'edge'); q('undo').disabled = !st.hist.length;
    grid.position.set(lot.x, lot.y + st.k * S + 0.06, lot.z);
    document.body.style.setProperty('--vbh', el.offsetHeight + 'px');
  }
  function card(html, onClick) {
    document.getElementById('mgCard')?.remove();
    const c = document.createElement('div'); c.id = 'mgCard'; c.innerHTML = html; document.body.appendChild(c);
    c.addEventListener('pointerdown', e => e.stopPropagation());
    c.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.x !== undefined) return c.remove(); onClick(b, c); };
    return c;
  }
  function shout(text = '✨ Dựng Lên!') { say.textContent = text; say.classList.remove('go'); void say.offsetWidth; say.classList.add('go'); clearTimeout(say._t); say._t = setTimeout(() => say.classList.remove('go'), 700); }

  // ---------- đặt / xoá / hoàn tác ----------
  // ô "chỗ" để 2 mảnh không chồng nhau: nền | đồ giữa ô | cạnh (cạnh chung của 2 ô quy về 1)
  const slot = pc => {
    const [id, i, j, k, r] = pc, p = BY_ID[id];
    if (p.kind === 'edge') { if (r === 1 && i + 1 < V.ni) return `e${i + 1},${j},${k},3`; if (r === 0 && j + 1 < V.nj) return `e${i},${j + 1},${k},2`; return `e${i},${j},${k},${r}`; }
    return (id === 'floor' ? 'f' : 'c') + `${i},${j},${k}`;
  };
  function place(pc, fromTap) {
    const p = BY_ID[pc[0]];
    if (lot.pieces.length >= MAX_PIECES) return ctx.toast(`🏡 Lô đã đủ ${MAX_PIECES} mảnh — xoá bớt để xây tiếp nhé.`, 3000);
    const key = slot(pc), old = lot.pieces.find(q => slot(q) === key);
    if (old && old[0] === pc[0] && old[4] === pc[4] && old[5] === pc[5]) return;
    const refund = old ? BY_ID[old[0]].cost : 0;
    if (gems() + refund < p.cost) { ctx.toast(`💎 Cần <b>${p.cost} đá pha lê</b> cho ${p.name}. Bấm <b>💎</b> để giải đố kiếm thêm!`, 3500); return; }
    if (old) lot.pieces.splice(lot.pieces.indexOf(old), 1);
    lot.pieces.push(pc); setGems(gems() + refund - p.cost); st.hist.push({ add: pc, del: old });
    if (st.hist.length > 89) st.hist.shift();
    fly(pc); if (fromTap) shout(p.big ? '✨ Dựng Lên!' : ['✨ Dựng Lên!', '✨ Lên nào!', '✨ Vào chỗ!'][Math.floor(Math.random() * 3)]);
    V0.changed(); refresh();
  }
  function remove(pc) { const k = lot.pieces.indexOf(pc); if (k < 0) return; lot.pieces.splice(k, 1); setGems(gems() + BY_ID[pc[0]].cost); st.hist.push({ del: pc }); sparkle(pc, '#ff9a9a'); ctx.sfx && ctx.sfx('ui'); V0.changed(); refresh(); }
  function undo() {
    const h = st.hist.pop(); if (!h) return;
    if (h.snap) { lot.pieces.length = 0; lot.pieces.push(...h.snap); setGems(gems() + h.refund); }
    else {
      if (h.add) { const k = lot.pieces.indexOf(h.add); if (k >= 0) lot.pieces.splice(k, 1); setGems(gems() + BY_ID[h.add[0]].cost); }
      if (h.del) { lot.pieces.push(h.del); setGems(gems() - BY_ID[h.del[0]].cost); }
    }
    ctx.toast('↶ Đã hoàn tác.', 1500); V0.changed(); refresh();
  }
  const W = new THREE.Vector3(), B = new THREE.Box3();
  function sparkle(pc, col) { pieceBox(pc, geos, B); B.getCenter(W).add(new THREE.Vector3(lot.x, lot.y, lot.z)); magic.burst && magic.burst(W.clone(), new THREE.Vector3(0, 1, 0), col, 21, 3, 1); }
  function fly(pc) {
    const G = geos[pc[0]]; if (!G) return;
    const m = new THREE.Mesh(G.body || G, new THREE.MeshToonMaterial({ vertexColors: true, color: BY_ID[pc[0]].color ? RUBIK[pc[5]] : '#ffffff', transparent: true, opacity: 0.9 }));
    const to = new THREE.Matrix4().makeTranslation(lot.x, lot.y, lot.z).multiply(pieceMatrix(pc)), tp = new THREE.Vector3().setFromMatrixPosition(to);
    const from = (magic.tip && magic.hasWand ? magic.tip.clone() : ctx.player.pos.clone().setY(ctx.player.pos.y + 1.4));
    m.matrixAutoUpdate = false; m.matrix.copy(to); ctx.scene.add(m); (lot.flying = lot.flying || new Set()).add(pc);
    flying.push({ m, to, tp, from, t: 0, pc });
    magic.burst && magic.burst(from.clone(), tp.clone().sub(from).normalize(), '#ffe3a0', 13, Math.min(13, from.distanceTo(tp) * 1.6), 0.15);
    ctx.sfx && ctx.sfx('magic');
  }
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
  function stepFly(dt) {
    for (let n = flying.length - 1; n >= 0; n--) {
      const f = flying[n]; f.t += dt / 0.55; const t = Math.min(1, f.t), e = 1 - (1 - t) ** 3;
      f.to.decompose(_p, _q, _s); _p.lerpVectors(f.from, f.tp, e); _p.y += Math.sin(t * Math.PI) * 2.1; _s.setScalar(0.2 + 0.8 * e);
      f.m.matrix.compose(_p, _q, _s);
      if (t >= 1) { ctx.scene.remove(f.m); f.m.material.dispose(); flying.splice(n, 1); lot.flying.delete(f.pc); sparkle(f.pc, '#ffe3a0'); V0.changed(true); }
    }
  }

  // ---------- chạm → tia từ camera ----------
  const ray = new THREE.Raycaster(), nd = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  function aim(cx, cy) {
    nd.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(nd, ctx.camera);
    if (st.erase) {   // mảnh gần nhất trúng tia
      let best = null, bd = 1e9; const o = ray.ray.origin.clone().sub(_p.set(lot.x, lot.y, lot.z)), r2 = new THREE.Ray(o, ray.ray.direction);
      for (const pc of lot.pieces) { pieceBox(pc, geos, B); if (B.isEmpty()) continue; B.expandByScalar(0.1); const h = r2.intersectBox(B, hit); if (h) { const d = h.distanceTo(o); if (d < bd) { bd = d; best = pc; } } }
      return best ? { del: best } : null;
    }
    plane.constant = -(lot.y + st.k * S); if (!ray.ray.intersectPlane(plane, hit)) return null;
    const lx = hit.x - lot.x, lz = hit.z - lot.z, i = Math.floor(lx / S), j = Math.floor(lz / S);
    if (i < 0 || j < 0 || i >= V.ni || j >= V.nj) return null;
    const p = BY_ID[st.id]; let r = st.rot;
    if (p.kind === 'edge') { const fx = lx / S - i - 0.5, fz = lz / S - j - 0.5; r = Math.abs(fx) > Math.abs(fz) ? (fx > 0 ? 1 : 3) : (fz > 0 ? 0 : 2); }
    return { pc: [st.id, i, j, st.k, r, p.color ? st.col : 0] };
  }
  function showGhost(a) {
    ghost.visible = !!a; if (!a) return;
    pieceBox(a.del || a.pc, geos, B); if (B.isEmpty()) { const [, i, j, k] = a.pc; B.set(_p.set(i * S, k * S, j * S), new THREE.Vector3((i + 1) * S, (k + 1) * S, (j + 1) * S)); }
    B.getSize(_s); B.getCenter(_p); ghost.scale.copy(_s.addScalar(0.08)); ghost.position.copy(_p).add(W.set(lot.x, lot.y, lot.z));
    ghost.material.color.set(a.del ? '#ff6b6b' : '#9fe6ff');
  }
  const cv = ctx.renderer.domElement; let down = null;
  cv.addEventListener('pointerdown', e => { if (st.open) down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }; });
  cv.addEventListener('pointerup', e => {
    if (!st.open || !down || down.id !== e.pointerId) return; const d = down; down = null;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 13 || performance.now() - d.t > 350) return;
    const a = aim(e.clientX, e.clientY); if (!a) return;
    if (a.del) remove(a.del); else place(a.pc, true);
    showGhost(e.pointerType === 'mouse' ? aim(e.clientX, e.clientY) : null);
  });
  cv.addEventListener('pointermove', e => { if (st.open && e.pointerType === 'mouse' && !down) showGhost(aim(e.clientX, e.clientY)); });
  addEventListener('keydown', e => {
    if (!st.open || /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName)) return;
    const k = { KeyR: 'rot', KeyQ: 'dn', KeyE: 'up', KeyX: 'er', KeyZ: 'undo', Escape: 'x' }[e.code]; if (k) { e.preventDefault(); e.stopImmediatePropagation(); act(k); }
  }, true);

  // ---------- nhà gợi ý · thử thách · kiếm đá ----------
  function templates() {
    card(`<h4>🏠 Nhà gợi ý — 1 chạm (miễn phí)</h4><p>Chọn một mẫu, rồi sửa theo ý em. Mảnh đang có sẽ được hoàn lại 💎.</p><div class="ch">${V0.templates.map((t, k) => `<button data-t="${k}">${t.icon} ${t.name}</button>`).join('')}</div><div class="ch"><button class="no" data-x>Đóng</button></div>`, (b, c) => {
      const T = V0.templates[+b.dataset.t]; if (!T) return; c.remove();
      const refund = lot.pieces.reduce((s, p) => s + BY_ID[p[0]].cost, 0);
      st.hist.push({ snap: lot.pieces.slice(), refund: -refund });
      lot.pieces.length = 0; lot.pieces.push(...T.make()); setGems(gems() + refund); shout('✨ Dựng Lên!');
      for (let n = 0; n < Math.min(13, lot.pieces.length); n++) fly(lot.pieces[Math.floor(Math.random() * lot.pieces.length)]);
      ctx.toast(`${T.icon} <b>${T.name}</b> đã mọc lên! Thử thêm tầng, đổi cửa sổ, trồng cây…`, 4000); V0.changed(); refresh();
    });
  }
  function challengeCard() {
    const L = challenges(st.seed), P = lot.pieces;
    card(`<h4>🏆 Thử thách kiến trúc</h4>${L.map(c => `<p>${c.icon} <b>${c.title}</b> ${st.done[c.id] ? '✅' : `<span class="gem">+${c.id === 'area' && st.done.area0 ? 5 : c.reward} 💎</span>`}<br><small>${c.text}</small></p>`).join('')}<div class="ch"><button class="ok" data-c>✔ Kiểm tra công trình</button><button class="no" data-x>Đóng</button></div>`, (b, c) => {
      if (b.dataset.c === undefined) return; c.remove(); let got = 0;
      for (const ch of L) {
        if (st.done[ch.id] || !ch.check(P)) continue;
        const n = ch.id === 'area' && st.done.area0 ? 5 : ch.reward; got += n;
        if (ch.id === 'area') { st.done.area0 = 1; st.seed++; save('village.seed', st.seed); } else st.done[ch.id] = 1;
        ctx.toast(`${ch.icon} <b>Hoàn thành: ${ch.title}!</b>`, 3000);
      }
      save('village.done', st.done);
      if (got) { addGems(got, 'thử thách kiến trúc'); shout('🏆 Tuyệt vời!'); magic.setMana && magic.setMana(Math.min(100, magic.mana + 13)); }
      else ctx.toast('🔍 Chưa đạt thử thách nào. Đọc kỹ gợi ý: đếm số ô (diện tích) và số cạnh ô quanh nền (chu vi) nhé!', 5000);
    });
  }
  function earn() { magic.ask(['toan', 'khoahoc'], () => { addGems(5, 'trả lời đúng!'); ctx.sfx && ctx.sfx('ok'); }, '💎 Trả lời đúng để nhận 5 đá pha lê'); }

  // ---------- mở / đóng ----------
  let camPrev = null;
  function open() {
    if (st.open) return; st.open = true; panel(); document.body.classList.add('vb-on'); grid.visible = true;
    const c = ctx.player.cam; camPrev = { dist: c.dist, pitch: c.pitch }; c.dist = 21; c.pitch = 0.72;
    shout('✨ Dựng Lên!'); magic.burst && magic.burst(ctx.player.pos.clone().setY(ctx.player.pos.y + 1.6), new THREE.Vector3(0, 1, 0), '#a78bfa', 34, 4, 1);
    ctx.toast('🏗️ <b>Chế độ xây</b>: chọn mảnh rồi <b>chạm vào lô</b> — mảnh bay vào chỗ! Kéo để xoay camera, ⬆⬇ đổi tầng. Mảnh lớn tốn 💎.', 6000);
    if (!V0.ready) ctx.toast('⏳ Đang chuẩn bị mảnh xây…', 2500);
    if (!load('village.gift', 0)) { save('village.gift', 1); setTimeout(() => ctx.toast('🎁 Thầy cô tặng em <b>34 💎 đá pha lê</b> để bắt đầu. Hết đá thì bấm 💎 giải đố hoặc làm 🏆 thử thách!', 6000), 6200); }
    refresh();
  }
  function close() {
    if (!st.open) return; st.open = false; document.body.classList.remove('vb-on'); el && el.remove(); say && say.remove(); el = say = null; ghost.visible = grid.visible = false;
    document.getElementById('mgCard')?.remove(); if (camPrev) Object.assign(ctx.player.cam, camPrev);
  }
  function update(dt) {
    stepFly(dt);
    if (st.open) { const p = ctx.player.pos; if (p.x < lot.x - 13 || p.x > lot.x + V.lw + 13 || p.z < lot.z - 13 || p.z > lot.z + V.ll + 13 || ctx.player.vehicle) { close(); ctx.toast('🏗️ Đã ra khỏi lô đất — thoát chế độ xây.', 2500); } }
  }
  return { open, close, update, place, remove, undo, act, get active() { return st.open; }, get gems() { return gems(); }, setGems, st };
}
