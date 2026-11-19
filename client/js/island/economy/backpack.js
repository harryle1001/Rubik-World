// economy/backpack.js — 🎒 CẶP SÁCH (nút 🎒 cột phải / phím B hoặc I): 4 NGĂN
//   👕 Đồ mặc: áo choàng, mũ, kính, khăn, giày, ba lô, đũa — chạm để mặc/tháo, hoặc KÉO thẻ lên nhân vật; xem trước ngay trên
//      nhân vật VRM (camera "phòng thay đồ" quay ra trước mặt, đẩy nhân vật lên phần màn hình phía trên tấm cặp — φ: 38,2% / 61,8%)
//   🚲 Phương tiện: đã mở khoá mới gọi ra được (xe đạp các kiểu, khinh khí cầu, máy bay, chổi, Ván Bạc Bay, thú cưỡi đã thuần phục)
//   💎 Vật phẩm: đồ nhặt được (số lượng, mô tả = 1 điều học được), Đọc/Ngắm, bán lại lấy 🪙; sức chứa cặp + nâng cấp
//   🐾 Thú cưng: dắt theo / cất
// Mặc đồ: cape/hat/pet/broom dùng academy/wear.js; kính/khăn/mũ VRM qua hồ sơ nhân vật (vrm/avatar.js); giày (tô màu lưới giày VRM)
// và ba lô (khối đơn giản — chưa có model CC0 phù hợp) lưu ở profile.wx.
import * as THREE from 'three';
import { ITEM, ITEMS, BIKE_NAMES } from './catalog.js';
import { ic, priceHtml } from './wallet.js';
import { loadAvatar, saveAvatar } from '../vrm/avatar.js';

const TABS = [['wear', '👕', 'Đồ mặc'], ['ride', '🚲', 'Phương tiện'], ['loot', '💎', 'Vật phẩm'], ['pet', '🐾', 'Thú cưng']];
const SLOTS = [['cape', 'Áo choàng'], ['hat', 'Mũ'], ['glasses', 'Kính'], ['scarf', 'Khăn'], ['shoes', 'Giày'], ['pack', 'Ba lô']];
export const SHEET_CSS = `.ecoSheet{position:fixed;z-index:41;left:0;right:0;bottom:0;height:61.8vh;max-height:610px;display:flex;flex-direction:column;background:#fff8ec;color:#2e2418;border-radius:21px 21px 0 0;box-shadow:0 -8px 34px #0006;font:15px/1.4 system-ui;padding:13px 13px 0;box-sizing:border-box;touch-action:pan-y}
@media (min-width:900px){.ecoSheet{left:auto;top:0;height:auto;max-height:none;width:420px;border-radius:21px 0 0 21px}}
.ecoSheet .hd{display:flex;align-items:center;gap:8px;margin-bottom:8px}.ecoSheet .hd h3{margin:0;font:800 21px system-ui;flex:1;white-space:nowrap}
.ecoSheet .wl{display:flex;gap:8px;font:800 15px system-ui}.ecoSheet .wl span{display:flex;align-items:center;gap:3px;background:#f3e6cc;border-radius:13px;padding:3px 8px}
.ecoSheet .x{width:42px;height:42px;border-radius:50%;border:0;background:#efe3cc;font:800 18px system-ui;cursor:pointer;flex:none}
.ecoSheet .tb{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:8px}.ecoSheet .tb button{border:2px solid transparent;background:#f3e6cc;border-radius:13px;padding:5px 2px;font:800 12px system-ui;color:#5a4630;cursor:pointer;min-height:47px}
.ecoSheet .tb button i{display:block;font-style:normal;font-size:21px;line-height:1.1}.ecoSheet .tb button.on{background:#fff;border-color:#f0a23a;color:#2e2418}
.ecoSheet .bd{flex:1;overflow-y:auto;min-height:0;padding-bottom:8px;-webkit-overflow-scrolling:touch}
.ecoSheet .sec{font:800 12px system-ui;letter-spacing:.06em;text-transform:uppercase;color:#9a8466;margin:8px 0 5px}
.ecoSheet .gr{display:grid;grid-template-columns:repeat(auto-fill,minmax(89px,1fr));gap:8px}
.ecoSheet .cd{position:relative;background:#fff;border:2px solid #eadbbd;border-radius:13px;padding:8px 5px 5px;text-align:center;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:none;min-height:89px;box-sizing:border-box}
.ecoSheet .cd .e{font-size:34px;line-height:1.1;display:block}.ecoSheet .cd .n{display:block;font:700 12px/1.25 system-ui;margin-top:3px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.ecoSheet .cd .sw{position:absolute;left:5px;top:5px;width:13px;height:13px;border-radius:50%;box-shadow:0 0 0 2px #fff,0 0 0 3px #0002}
.ecoSheet .cd .bg{position:absolute;right:4px;top:4px;background:#2c8f82;color:#fff;border-radius:8px;padding:1px 5px;font:800 11px system-ui}
.ecoSheet .cd.on{border-color:#2c8f82;background:#e6f6f1}.ecoSheet .cd.sel{box-shadow:0 0 0 3px #f0a23a}.ecoSheet .cd.add{border-style:dashed;color:#9a8466;background:#fbf3e3}
.ecoSheet .cd .pr{display:flex;align-items:center;justify-content:center;gap:3px;font:800 13px system-ui;margin-top:3px}.ecoSheet .cd.own .pr{color:#2c8f82}
.ecoSheet .dt{position:sticky;bottom:0;background:#fff8ec;border-top:1px solid #eadbbd;padding:8px 0 max(13px,env(safe-area-inset-bottom));display:flex;gap:8px;align-items:center}
.ecoSheet .dt .t{flex:1;min-width:0;font:600 13px/1.35 system-ui}.ecoSheet .dt .t b{font-size:15px;display:block}
.ecoSheet .dt button,.ecoSheet .btn{border:0;border-radius:13px;padding:10px 13px;font:800 14px system-ui;background:#efe3cc;color:#2e2418;cursor:pointer;min-height:42px;white-space:nowrap}
.ecoSheet .dt button.pri,.ecoSheet .btn.pri{background:#f0a23a;color:#2a1a0a}.ecoSheet .dt button.gem{background:#ff5fa8;color:#fff}
.ecoSheet .capb{height:8px;border-radius:5px;background:#efe3cc;overflow:hidden;margin:5px 0 8px}.ecoSheet .capb i{display:block;height:100%;background:linear-gradient(90deg,#3fb8a8,#f0a23a)}
.ecoSheet .hint{font:600 12px system-ui;color:#9a8466;margin:5px 0}
.ecoDrag{position:fixed;z-index:70;pointer-events:none;font-size:42px;transform:translate(-50%,-50%) scale(1.13);filter:drop-shadow(0 5px 8px #0005)}`;
const CSS = `#bBag{font-size:21px}`;

export function createBackpack(ctx) {
  const eco = ctx.eco, acc = ctx.account, pl = ctx.player;
  const st0 = document.createElement('style'); st0.textContent = SHEET_CSS + CSS; document.head.appendChild(st0);
  // nút 🎒 đầu cột phương tiện (bên phải, ngón cái với tới)
  const col = document.querySelector('.vbtns'); let btn = null;
  if (col) { btn = document.createElement('button'); btn.id = 'bBag'; btn.title = 'Cặp sách (B / I)'; btn.textContent = '🎒'; col.insertBefore(btn, document.getElementById('bBike')); btn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); toggle(); }); }
  let el = null, tab = 'wear', sel = null, saveCam = null;
  const P = () => acc.profile, wx = () => (P() ? (P().wx = P().wx || {}) : {});
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // ---------- đang mặc gì ----------
  const look = () => loadAvatar(ctx);
  function worn(it) {
    const W = ctx.wear, L = look();
    if (it.slot === 'cape' || it.slot === 'hat') return !!(W && W.eq[it.slot] === it.id);
    if (it.slot === 'glasses') return L.glasses === it.v;
    if (it.slot === 'scarf') return !!L.scarf;
    if (it.tab === 'pet') return !!(W && W.eq.pet === it.id);
    return wx()[it.slot] === it.id;
  }
  function wear(it, on) {
    const W = ctx.wear, L = look(); let rebuild = false;
    if (it.slot === 'cape' && W) W.equip('cape', on ? it.id : null);
    else if (it.slot === 'hat') { if (W) W.equip('hat', on ? it.id : null); else setHat(on); }
    else if (it.slot === 'glasses') { L.glasses = on ? it.v : 'none'; rebuild = true; }
    else if (it.slot === 'scarf') { L.scarf = on; rebuild = true; }
    else if (it.tab === 'pet' && W) W.equip('pet', on ? it.id : null);
    else { wx()[it.slot] = on ? it.id : null; acc.save(); dressExtra(true); }
    if (rebuild) { saveAvatar(ctx, L); ctx.onAvatar && ctx.onAvatar(L); }
    ctx.sfx && ctx.sfx(on ? 'ok' : 'ui'); pl.emote && on && pl.emote('cheer');
  }
  // mũ chóp của nhân vật VRM theo đồ đang đội (academy/wear.js gọi khi mặc/tháo mũ ở bất kỳ đâu)
  function setHat(on) { const L = look(); if (!!L.hat === on) return; L.hat = on; saveAvatar(ctx, L); ctx.onAvatar && ctx.onAvatar(L); }
  ctx.onWearHat = setHat;
  // giày (tô màu lưới giày VRM) + ba lô (khối đơn giản gắn ngực, phía lưng)
  let packObj = null, heroRef = null, shoeMats = null;
  function dressExtra(force) {
    const h = pl.hero; if (!h || (!force && h === heroRef)) return; heroRef = h;
    const sid = wx().shoes, S = sid && ITEM[sid];
    if (h.isVrm) h.model.traverse(o => { if (o.isMesh && o.userData.vrmKind === 'shoes') for (const m of [].concat(o.material)) { if (!m.userData.c0) m.userData.c0 = m.color.clone(); m.color.copy(S ? new THREE.Color(S.col) : m.userData.c0); } });
    if (packObj) { packObj.removeFromParent(); packObj = null; }
    const B = wx().pack && ITEM[wx().pack]; if (!B) return;
    const g = new THREE.Group(), mat = new THREE.MeshToonMaterial({ color: B.col }), dark = new THREE.MeshToonMaterial({ color: new THREE.Color(B.col).multiplyScalar(0.62) });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.36, 0.13), mat), flap = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.14, 0.142), dark), pocket = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.13, 0.05), dark);
    flap.position.y = 0.12; pocket.position.set(0, -0.07, -0.085); g.add(body, flap, pocket); g.traverse(o => o.isMesh && (o.castShadow = true));
    const root = pl.root, bone = (h.vrm && h.vrm.humanoid && (h.vrm.humanoid.getRawBoneNode('upperChest') || h.vrm.humanoid.getRawBoneNode('chest'))) || h.model.getObjectByName('chest') || h.model.getObjectByName('spine');
    root.updateMatrixWorld(true);
    const hp = h.head ? root.worldToLocal(h.head.getWorldPosition(new THREE.Vector3())) : new THREE.Vector3(0, 1.3, 0), H = hp.y || 1.3;
    g.position.set(0, H * 0.72, -0.17); g.scale.setScalar(H / 1.4); root.add(g); root.updateMatrixWorld(true); if (bone) bone.attach(g);
    packObj = g;
  }

  // ---------- phòng thay đồ: camera trước mặt, nhân vật lên 38,2% trên ----------
  // camera đặt thẳng trước mặt (3/4 góc nghiêng 0,62 rad) mỗi khung, nhìn vào giữa người; dời khung hình để cả người nằm gọn
  // trong 38,2% phía trên tấm cặp (điện thoại) hoặc bên trái bảng cặp (máy tính). Đóng cặp → player.js tự hoà camera về quỹ đạo.
  let dressing = false;
  function dressCam(on) {
    const C = ctx.camera; if (!C) return; dressing = on;
    if (!on) return C.clearViewOffset();
    if (innerWidth < 900) C.setViewOffset(innerWidth, innerHeight, 0, innerHeight * 0.31, innerWidth, innerHeight);
    else C.setViewOffset(innerWidth, innerHeight, 210, 0, innerWidth, innerHeight);
  }
  const _c = new THREE.Vector3();
  function aimCam() {
    const C = ctx.camera, p = pl.pos, r = pl.rot + 0.62, D = innerWidth < 900 ? 5.5 : 4.4;
    _c.set(p.x + Math.sin(r) * D, p.y + 1.3, p.z + Math.cos(r) * D); C.position.lerp(_c, saveCam ? 0.2 : 1); saveCam = 1; C.lookAt(p.x, p.y + 0.85, p.z);
  }

  // ---------- danh sách từng ngăn ----------
  const card = (it, extra = '', cls = '') => `<div class="cd ${cls}" data-id="${it.id}">${it.col ? `<i class="sw" style="background:${it.col}"></i>` : ''}<span class="e">${it.icon}</span><span class="n">${esc(it.name)}</span>${extra}</div>`;
  const addCard = (t, label) => `<div class="cd add" data-shop="${t}"><span class="e">🛒</span><span class="n">${label}</span></div>`;
  function bodyHtml() {
    const own = it => eco.owns(it.id);
    if (tab === 'wear') {
      let h = '<div class="hint">Chạm để mặc / tháo — hoặc <b>kéo thẻ</b> lên nhân vật.</div>';
      for (const [slot, name] of SLOTS) { const L = ITEMS.filter(it => it.slot === slot && own(it)); if (L.length) h += `<div class="sec">${name}</div><div class="gr">${L.map(it => card(it, worn(it) ? '<span class="bg">✓ Đang mặc</span>' : '', worn(it) ? 'on' : '')).join('')}</div>`; }
      if (ctx.magic && ctx.magic.hasWand) h += `<div class="sec">Đũa phép</div><div class="gr">${card({ id: 'wand', icon: '🪄', name: 'Đũa phép của em' })}</div>`;
      return h + `<div class="sec">Thêm đồ mới</div><div class="gr">${addCard('wear', 'Cửa hàng đồ mặc')}</div>`;
    }
    if (tab === 'ride') {
      const L = ITEMS.filter(it => it.tab === 'ride' && own(it)), M = ctx.mounts ? ctx.mounts.beasts.filter(v => ctx.mounts.tamed.has(v.id)) : [];
      let h = '<div class="hint">Chạm để gọi ra. Phương tiện mới mở khoá ở 🛒 Cửa hàng.</div><div class="sec">Đã mở khoá</div><div class="gr">' + L.map(it => card(it)).join('') + '</div>';
      if (M.length) h += `<div class="sec">Thú cưỡi đã thuần phục</div><div class="gr">${M.map(v => `<div class="cd" data-mount="${v.id}"><span class="e">${v.emoji}</span><span class="n">${esc(v.name)}</span></div>`).join('')}</div>`;
      return h + `<div class="sec">Mở khoá thêm</div><div class="gr">${addCard('ride', 'Xe, chổi, khinh khí cầu…')}</div>`;
    }
    if (tab === 'loot') {
      const bag = (P() && P().bag) || {}, n = eco.bagCount(), c = eco.cap(), up = eco.nextCap();
      let h = `<div style="display:flex;justify-content:space-between;align-items:center;font:800 13px system-ui"><span>🎒 Sức chứa: ${n}/${c} món</span>${up ? `<button class="btn" data-a="cap" style="min-height:34px;padding:5px 10px">Nới cặp → ${up.cap} (${priceHtml({ gold: up.gold }, 14)})</button>` : '<span>Cặp to nhất ✓</span>'}</div><div class="capb"><i style="width:${Math.min(100, n / c * 100)}%"></i></div>`;
      const L = Object.keys(bag).filter(id => ITEM[id] && bag[id] > 0);
      h += L.length ? `<div class="gr">${L.map(id => card(ITEM[id], `<span class="bg">×${bag[id]}</span>`)).join('')}</div>` : '<div class="hint">Cặp còn trống — đi dạo quanh đảo, thấy vật lấp lánh ✨ thì đi qua hoặc bấm ✋ để nhặt nhé!</div>';
      if (ctx.bag && ctx.bag.open) h += `<div class="sec">Đồ phép thuật</div><div class="gr"><div class="cd" data-a="magicbag"><span class="e">✨</span><span class="n">Túi phép thuật (pháo hoa, nhạc cụ, sách…)</span></div></div>`;
      return h;
    }
    const L = ITEMS.filter(it => it.tab === 'pet' && own(it));
    return '<div class="hint">Chọn một bạn nhỏ đi theo em khắp đảo.</div><div class="gr">' + L.map(it => card(it, worn(it) ? '<span class="bg">✓ Đi cùng</span>' : '', worn(it) ? 'on' : '')).join('') + addCard('pet', 'Nhận nuôi thêm') + '</div>';
  }
  function detailHtml() {
    if (!sel) return '';
    if (sel === 'wand') return `<div class="t"><b>🪄 Đũa phép</b>Mỗi phép là một câu đố khoa học. Phím F để niệm phép.</div><button class="pri" data-a="wave">✨ Vẫy đũa</button>`;
    if (sel.startsWith('m:')) { const v = ctx.mounts.beasts.find(b => b.id === sel.slice(2)); return v ? `<div class="t"><b>${v.emoji} ${esc(v.name)}</b>Huýt sáo gọi bạn đồng hành tới.</div><button class="pri" data-a="mount">🎶 Gọi</button>` : ''; }
    const it = ITEM[sel]; if (!it) return '';
    if (it.tab === 'wear' || it.tab === 'pet') { const on = worn(it); return `<div class="t"><b>${it.icon} ${esc(it.name)}</b>${esc(it.desc)}</div><button class="${on ? '' : 'pri'}" data-a="wear">${it.tab === 'pet' ? (on ? 'Cất' : 'Dắt theo') : (on ? 'Tháo' : 'Mặc')}</button>`; }
    if (it.tab === 'ride') return `<div class="t"><b>${it.icon} ${esc(it.name)}</b>${esc(it.desc)}</div><button class="pri" data-a="ride">${it.kind === 'plane' ? '🛫 Tới sân bay' : 'Gọi ra'}</button>`;
    const n = (P().bag || {})[it.id] | 0;
    return `<div class="t"><b>${it.icon} ${esc(it.name)} ×${n}</b>💡 ${esc(it.desc)}</div><button data-a="sell1">Bán 1 · ${priceHtml({ gold: it.sell }, 14)}</button>${n > 1 ? `<button class="pri" data-a="sellall">Bán hết · ${priceHtml({ gold: it.sell * n }, 14)}</button>` : ''}`;
  }
  function render() {
    if (!el) return;
    el.querySelector('.wl').innerHTML = `<span>${ic('gold', 18)}${eco.gold()}</span><span>${ic('gem', 18)}${eco.gems()}</span>`;
    el.querySelectorAll('.tb button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
    const bd = el.querySelector('.bd'), top = bd.scrollTop; bd.innerHTML = bodyHtml(); bd.scrollTop = top;
    if (sel) { const c = bd.querySelector(`[data-id="${sel}"],[data-mount="${sel.slice(2)}"]`); if (c) c.classList.add('sel'); }
    const dt = el.querySelector('.dt'); dt.innerHTML = detailHtml(); dt.hidden = !dt.innerHTML;
  }
  function open(t) {
    if (!P()) { ctx.toast('🎒 Hãy đăng nhập hoặc chơi khách để có cặp sách nhé!', 3000); return; }
    if (t) tab = t; if (el) return render();
    if (pl.vehicle) ctx.vehicles && ctx.vehicles.current && !ctx.vehicles.current.mode.fly && ctx.vehicles.dismount();
    el = document.createElement('div'); el.className = 'ecoSheet'; el.id = 'ecoBag';
    el.innerHTML = `<div class="hd"><h3>🎒 Cặp sách</h3><div class="wl"></div><button class="x" data-a="shop" title="Cửa hàng">🛒</button><button class="x" data-a="x" title="Đóng (Esc)">✕</button></div>
      <div class="tb">${TABS.map(([k, i, n]) => `<button data-t="${k}"><i>${i}</i>${n}</button>`).join('')}</div><div class="bd"></div><div class="dt"></div>`;
    document.body.appendChild(el); document.body.classList.add('rs-modal', 'eco-open'); pl.frozen = true; sel = null;
    el.addEventListener('keydown', e => e.stopPropagation());
    el.addEventListener('click', onClick); el.addEventListener('pointerdown', onDown);
    dressCam(true); render(); ctx.sfx && ctx.sfx('ui');
  }
  function close() {
    if (!el) return; el.remove(); el = null; dressCam(false);
    document.body.classList.remove('rs-modal', 'eco-open'); pl.frozen = false;
  }
  const toggle = t => (el ? close() : open(t));
  async function act(a) {
    const it = ITEM[sel];
    if (a === 'wear' && it) { wear(it, !worn(it)); return render(); }
    if (a === 'ride' && it) {
      close(); await new Promise(r => setTimeout(r, 200));   // chờ 1–2 khung để nhân vật đứng vững lại (grounded) sau khi mở khoá di chuyển
      if (it.kind === 'bike') return ctx.vehicles.toggleBike(it.style);
      if (it.kind === 'balloon') return ctx.vehicles.toggleBalloon();
      if (it.kind === 'broom') return ctx.brooms && ctx.brooms.summon(it.id);
      if (it.kind === 'plane' && ctx.aircraft) { const p = ctx.aircraft.planes.find(q => q.parked) || ctx.aircraft.planes[0]; if (p) { const g = p.group.position; pl.teleport(g.x + 4, g.z + 2); ctx.toast('🛫 Tới <b>Sân bay Cánh Diều</b> — lại gần máy bay, bấm <b>E</b> để lái!', 4000); } }
      return;
    }
    if (a === 'mount') { const v = ctx.mounts.beasts.find(b => b.id === sel.slice(2)); close(); return v && ctx.mounts.call(v); }
    if (a === 'wave') { close(); const m = ctx.magic; ctx.sfx && ctx.sfx('magic'); pl.emote && pl.emote('interact'); if (m && m.burst) { const p = pl.pos; m.burst(p.clone().setY(p.y + 1.3), new THREE.Vector3(0, 1, 0), '#9fd8ff', 34, 4, 1); } return; }
    if ((a === 'sell1' || a === 'sellall') && it) { const n = a === 'sell1' ? 1 : (P().bag[it.id] | 0); const g = eco.sell(it.id, n); if (g) ctx.toast(`💰 Bán ${n} ${it.icon} ${it.name} → +${g} ${ic('gold', 14)}`, 2500); if (!(P().bag[it.id] > 0)) sel = null; return render(); }
    if (a === 'cap') { const r = await eco.upgradeCap(); ctx.toast(r.error ? '🎒 ' + r.error : `🎒 Cặp đã nới rộng: chứa được <b>${r.cap}</b> món!`, 3000); return render(); }
  }
  function onClick(e) {
    const b = e.target.closest('button,[data-id],[data-shop],[data-mount],[data-a]'); if (!b || dragged) return;
    if (b.dataset.t) { tab = b.dataset.t; sel = null; ctx.sfx && ctx.sfx('ui'); return render(); }
    const a = b.dataset.a;
    if (a === 'x') return close();
    if (a === 'shop') { close(); return ctx.shop && ctx.shop.open(tab === 'loot' ? 'wear' : tab); }
    if (a === 'magicbag') { close(); return ctx.bag.open(); }
    if (b.dataset.shop) { close(); return ctx.shop && ctx.shop.open(b.dataset.shop); }
    if (b.dataset.mount) { sel = 'm:' + b.dataset.mount; return render(); }
    if (b.dataset.id) { const id = b.dataset.id; if (sel === id && ITEM[id] && (ITEM[id].tab === 'wear' || ITEM[id].tab === 'pet')) { wear(ITEM[id], !worn(ITEM[id])); return render(); } sel = id; ctx.sfx && ctx.sfx('ui'); return render(); }
    if (a) act(a);
  }
  // kéo thẻ đồ mặc ra khỏi cặp (lên nhân vật) để mặc
  let drag = null, dragged = false;
  function onDown(e) {
    const c = e.target.closest('.cd[data-id]'); dragged = false; if (!c || tab !== 'wear') return; const it = ITEM[c.dataset.id]; if (!it) return;
    drag = { it, x: e.clientX, y: e.clientY, g: null };
    const move = ev => {
      if (!drag) return; const d = Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y);
      if (!drag.g && d > 13) { drag.g = document.createElement('div'); drag.g.className = 'ecoDrag'; drag.g.textContent = it.icon; document.body.appendChild(drag.g); }
      if (drag.g) { drag.g.style.left = ev.clientX + 'px'; drag.g.style.top = ev.clientY + 'px'; }
    };
    const up = ev => {
      removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      if (drag && drag.g) { drag.g.remove(); dragged = true; setTimeout(() => (dragged = false), 50); const r = el && el.getBoundingClientRect(); if (r && (ev.clientY < r.top || ev.clientX < r.left)) { sel = it.id; wear(it, true); render(); } }
      drag = null;
    };
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  }
  addEventListener('keydown', e => {
    if (e.repeat || /INPUT|TEXTAREA/.test(document.activeElement?.tagName)) return;
    if (e.key === 'Escape' && el) return close();
    if ((e.code === 'KeyB' || e.code === 'KeyI') && (el || !document.body.classList.contains('rs-modal'))) toggle();
  });
  acc.onChange(() => { if (el) render(); });
  function update() { dressExtra(false); if (el && dressing) aimCam(); else saveCam = null; }
  const self = { open, close, toggle, update, render, get isOpen() { return !!el; } };
  ctx.backpack = self;
  return self;
}
