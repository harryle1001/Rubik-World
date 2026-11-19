// economy/shop.js — 🛒 CỬA HÀNG: đồ mặc · phương tiện · thú cưng (giá 🪙 đồng vàng, đồ đặc biệt chỉ 💎) + ngăn 💎 Kim cương hồng.
// Mở: nút 🛒 trong cặp, chạm ví 🪙/💎 trên HUD, quầy 🛒 trước cổng Trường Rubik, nút "Cửa hàng lớn" ở các tiệm Phố Phép Thuật.
// An toàn trẻ em: không hộp quà may rủi; món nào cũng thấy rõ giá và hình. Nạp 💎 CHỈ sau cổng phụ huynh (phép nhân người lớn
// tính nhẩm được), gói hiện GIÁ TIỀN THẬT (đồng) trước khi trả; người lớn trả trên trang của cổng MoMo/ZaloPay/VNPay (server/billing.js).
import * as THREE from 'three';
import { ITEM, ITEMS } from './catalog.js';
import { ic, priceHtml, vnd } from './wallet.js';
import { SPAWN } from '../layout.js';

const TABS = [['wear', '👕', 'Đồ mặc'], ['ride', '🚲', 'Phương tiện'], ['pet', '🐾', 'Thú cưng'], ['gem', '💎', 'Kim cương']];
const CSS = `#ecoShop .cd.lock{opacity:.92}#ecoShop .gemc{background:linear-gradient(135deg,#fff0f7,#ffe1ef);border-color:#ffb3d6}
#ecoShop .pk{display:flex;align-items:center;gap:13px;background:#fff;border:2px solid #ffc7e0;border-radius:13px;padding:13px;margin-bottom:8px;cursor:pointer}#ecoShop .pk.sel{border-color:#ff5fa8;box-shadow:0 0 0 3px #ff5fa833}
#ecoShop .pk b{font:900 21px system-ui;display:flex;align-items:center;gap:5px;flex:1}#ecoShop .pk .vnd{font:900 16px system-ui;color:#c8166b}
#ecoShop .gw{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}#ecoShop .gw button{flex:1 1 40%;border:2px solid #eadbbd;background:#fff;border-radius:13px;padding:8px;font:700 13px system-ui;cursor:pointer}#ecoShop .gw button.sel{border-color:#ff5fa8;background:#fff0f7}
#ecoShop .gate{text-align:center;padding:13px 0}#ecoShop .gate input{width:144px;padding:10px;border-radius:13px;border:2px solid #d9c6a3;font:800 21px system-ui;text-align:center}
#ecoShop .note{font:600 12px/1.5 system-ui;color:#7a6a58;background:#f3e6cc;border-radius:13px;padding:8px 13px;margin:8px 0}`;

export function createShop(ctx) {
  const eco = ctx.eco, acc = ctx.account, pl = ctx.player;
  const st0 = document.createElement('style'); st0.textContent = CSS; document.head.appendChild(st0);
  let el = null, tab = 'wear', sel = null, gateOk = 0, pack = null, gw = null, msg = '';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const forSale = t => ITEMS.filter(it => it.tab === t && it.price && !(it.id === 'bike-0'));

  function bodyHtml() {
    if (tab === 'gem') return gemHtml();
    const L = forSale(tab), groups = tab === 'wear' ? [['cape', 'Áo choàng'], ['hat', 'Mũ'], ['glasses', 'Kính'], ['scarf', 'Khăn'], ['shoes', 'Giày'], ['pack', 'Ba lô']] : tab === 'ride' ? [['bike', 'Xe đạp khắp thế giới'], ['broom', 'Chổi bay & ván bay'], ['balloon', 'Khinh khí cầu'], ['plane', 'Máy bay']] : [[null, 'Thú cưng']];
    let h = `<div class="hint">Giá bằng ${ic('gold', 14)} đồng vàng — kiếm khi học, làm nhiệm vụ, chơi mini game, khám phá. Món ${ic('gem', 14)} là đồ trang trí đặc biệt.</div>`;
    for (const [k, name] of groups) {
      const G = L.filter(it => k == null || it.slot === k || it.kind === k || (k === 'broom' && it.kind === 'board')); if (!G.length) continue;
      h += `<div class="sec">${name}</div><div class="gr">` + G.map(it => { const own = eco.owns(it.id); return `<div class="cd ${own ? 'own' : 'lock'} ${it.price.gem != null ? 'gemc' : ''}${sel === it.id ? ' sel' : ''}" data-id="${it.id}">${it.col ? `<i class="sw" style="background:${it.col}"></i>` : ''}<span class="e">${it.icon}</span><span class="n">${esc(it.name)}</span><span class="pr">${own ? '✓ Đã có' : priceHtml(it.price, 14)}</span></div>`; }).join('') + '</div>';
    }
    return h;
  }
  function gemHtml() {
    const packs = eco.packs;
    if (Date.now() - gateOk > 600e3) return `<div class="gate"><div style="font-size:55px">${ic('gem', 55)}</div><h3 style="margin:5px 0">Kim cương hồng</h3><p>Em đang có <b>${eco.gems()}</b> ${ic('gem', 16)}. Kim cương dùng đổi đồ trang trí đặc biệt (áo choàng Hồng Pha Lê, ba lô Pha Lê…).<br><b>Chỉ bố mẹ</b> mới nạp được kim cương.</p>
      <button class="btn pri" data-a="gate">👪 Nhờ bố mẹ nạp</button><div class="note">Đồng vàng 🪙 kiếm khi chơi là đủ mua <b>hầu hết</b> đồ trong game. Không có hộp quà may rủi.</div></div>`;
    if (!eco.online) return `<div class="note">Bố mẹ ơi, để nạp kim cương bé cần <b>tài khoản</b> (👤 góc trên → Tạo tài khoản) và máy có kết nối mạng.</div>`;
    const G = (eco.gateways || [{ id: 'momo', name: 'Ví MoMo', icon: '🟣' }, { id: 'vnpay', name: 'VNPay', icon: '🔴' }]).filter(g => g.id !== 'bank');
    return `<div class="hint">👪 <b>Dành cho bố mẹ</b> — chọn gói, giá đã gồm thuế:</div>${packs.map(p => `<div class="pk${pack === p.id ? ' sel' : ''}" data-pack="${p.id}"><b>${ic('gem', 28)} ${p.gems}</b><span class="vnd">${vnd(p.price)}</span></div>`).join('')}
      <div class="sec">Thanh toán qua</div><div class="gw">${G.map(g => `<button data-gw="${g.id}" class="${gw === g.id ? 'sel' : ''}">${g.icon} ${esc(g.name)}${g.mode === 'sim' ? ' · giả lập' : ''}</button>`).join('')}</div>
      <div class="note">Mua một lần, <b>không tự gia hạn</b>, không trừ tiền định kỳ. Kim cương chỉ đổi đồ trang trí, không có vật phẩm may rủi. Biên nhận gửi tới email phụ huynh đã liên kết. Hoàn tiền trong 7 ngày nếu bé lỡ bấm.</div>${msg ? `<div class="note" style="background:#ffe1ef">${msg}</div>` : ''}`;
  }
  function detailHtml() {
    if (tab === 'gem') { const p = eco.packs.find(x => x.id === pack); return Date.now() - gateOk <= 600e3 && eco.online ? `<div class="t"><b>${p ? `${p.gems} kim cương hồng` : 'Chọn một gói'}</b>${p ? `Số tiền thật: <b>${vnd(p.price)}</b>` : ''}</div><button class="gem" data-a="pay"${p && gw ? '' : ' disabled style="opacity:.5"'}>💳 Thanh toán ${p ? vnd(p.price) : ''}</button>` : ''; }
    const it = ITEM[sel]; if (!it) return '';
    const own = eco.owns(it.id), cur = it.price.gem != null ? 'gem' : 'gold', bal = cur === 'gem' ? eco.gems() : eco.gold(), short = bal < it.price[cur];
    return `<div class="t"><b>${it.icon} ${esc(it.name)}</b>${esc(it.desc)}</div>` + (own ? `<button class="pri" data-a="use">${it.tab === 'ride' ? 'Gọi ra' : it.tab === 'pet' ? 'Dắt theo' : 'Mặc thử'}</button>`
      : `<button class="${cur === 'gem' ? 'gem' : 'pri'}" data-a="buy"${short ? ' style="opacity:.62"' : ''}>${cur === 'gem' ? 'Đổi' : 'Mua'} ${priceHtml(it.price, 16)}</button>`);
  }
  function render() {
    if (!el) return;
    el.querySelector('.wl').innerHTML = `<span>${ic('gold', 18)}${eco.gold()}</span><span>${ic('gem', 18)}${eco.gems()}</span>`;
    el.querySelectorAll('.tb button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
    const bd = el.querySelector('.bd'), top = bd.scrollTop; bd.innerHTML = bodyHtml(); bd.scrollTop = top;
    const dt = el.querySelector('.dt'); dt.innerHTML = detailHtml(); dt.hidden = !dt.innerHTML;
    const s = sel && bd.querySelector(`[data-id="${sel}"]`); if (s && open.scroll) { s.scrollIntoView({ block: 'center' }); open.scroll = false; }
  }
  function open(t, id) {
    if (!acc.profile) { ctx.toast('🛒 Hãy đăng nhập hoặc chơi khách để mua sắm nhé!', 3000); return; }
    if (t === 'loot') t = 'wear'; if (t) tab = t; sel = id || null; open.scroll = !!id; msg = '';
    if (ctx.backpack && ctx.backpack.isOpen) ctx.backpack.close();
    if (!el) {
      el = document.createElement('div'); el.className = 'ecoSheet'; el.id = 'ecoShop';
      el.innerHTML = `<div class="hd"><h3>🛒 Cửa hàng</h3><div class="wl"></div><button class="x" data-a="bag" title="Cặp sách">🎒</button><button class="x" data-a="x" title="Đóng (Esc)">✕</button></div>
        <div class="tb">${TABS.map(([k, i, n]) => `<button data-t="${k}"><i>${i}</i>${n}</button>`).join('')}</div><div class="bd"></div><div class="dt"></div>`;
      document.body.appendChild(el); document.body.classList.add('rs-modal', 'eco-open'); pl.frozen = true;
      el.addEventListener('keydown', e => e.stopPropagation()); el.addEventListener('click', onClick);
      ctx.sfx && ctx.sfx('ui');
    }
    render();
  }
  function close() { if (!el) return; el.remove(); el = null; document.body.classList.remove('rs-modal', 'eco-open'); pl.frozen = false; }
  // cổng phụ huynh: phép nhân 2 chữ số (người lớn tính nhẩm được, trẻ nhỏ khó đoán)
  function gate() {
    const a = 12 + Math.floor(Math.random() * 13), b = 13 + Math.floor(Math.random() * 8), bd = el.querySelector('.bd');
    bd.innerHTML = `<div class="gate"><div style="font-size:55px">🔐</div><h3 style="margin:5px 0">Dành cho bố mẹ</h3><p>Em đưa máy cho bố mẹ nhé! Bố mẹ trả lời giúp:</p><p style="font-size:21px"><b>${a} × ${b} = ?</b></p><input id="ecoGate" inputmode="numeric" maxlength="4" autocomplete="off"><p class="hint" id="ecoGateMsg"></p><button class="btn pri" data-a="gateok">Tiếp tục</button> <button class="btn" data-a="gateno">Huỷ</button></div>`;
    el.querySelector('.dt').hidden = true;
    const inp = bd.querySelector('#ecoGate'); setTimeout(() => inp.focus(), 50);
    const ok = () => { if (+inp.value === a * b) { gateOk = Date.now(); pack = pack || (eco.packs[1] || eco.packs[0]).id; gw = gw || 'momo'; render(); } else { bd.querySelector('#ecoGateMsg').textContent = 'Chưa đúng. Hãy nhờ bố mẹ nhé!'; inp.value = ''; setTimeout(() => el && render(), 1618); } };
    gate.ok = ok; inp.onkeydown = e => { if (e.key === 'Enter') ok(); };
  }
  async function onClick(e) {
    const b = e.target.closest('button,[data-id],[data-pack]'); if (!b || b.disabled) return;
    if (b.dataset.t) { tab = b.dataset.t; sel = null; msg = ''; ctx.sfx && ctx.sfx('ui'); return render(); }
    if (b.dataset.id) { sel = b.dataset.id; ctx.sfx && ctx.sfx('ui'); return render(); }
    if (b.dataset.pack) { pack = b.dataset.pack; return render(); }
    if (b.dataset.gw) { gw = b.dataset.gw; return render(); }
    const a = b.dataset.a;
    if (a === 'x') return close();
    if (a === 'bag') { close(); return ctx.backpack && ctx.backpack.open(tab === 'gem' ? 'wear' : tab); }
    if (a === 'gate') return gate();
    if (a === 'gateok') return gate.ok && gate.ok();
    if (a === 'gateno') return render();
    if (a === 'pay') {
      b.disabled = true; msg = '⏳ Đang tạo đơn…'; render();
      const r = await eco.checkout(pack, gw);
      if (r.error) { msg = '⚠️ ' + esc(r.error); return render(); }
      msg = `✅ Đơn <b>${esc(r.order.id)}</b> — ${vnd(r.order.amount)}. Bố mẹ hoàn tất thanh toán ở trang vừa mở; kim cương tự vào ví khi cổng thanh toán xác nhận.${r.qr ? `<br><img src="${esc(r.qr)}" alt="QR" style="width:144px;margin-top:8px">` : ''}`;
      if (r.payUrl) window.open(r.payUrl, '_blank', 'noopener'); return render();
    }
    if (a === 'buy') {
      const it = ITEM[sel]; const r = await eco.buy(sel);
      if (r.error) { ctx.toast((it && it.price.gem != null ? ic('gem', 14) : ic('gold', 14)) + ' ' + r.error, 4000); if (it && it.price.gem != null && /bố mẹ/.test(r.error)) { tab = 'gem'; } return render(); }
      ctx.toast(`🎉 Đã mở khoá <b>${it.icon} ${it.name}</b>! Xem trong 🎒 Cặp sách.`, 3500); pl.emote && pl.emote('cheer');
      const s = el.querySelector(`[data-id="${sel}"]`), r2 = s && s.getBoundingClientRect(); if (r2) burst(r2.left + r2.width / 2, r2.top + r2.height / 2, it.icon);
      return render();
    }
    if (a === 'use') { const it = ITEM[sel]; close(); if (ctx.backpack) { ctx.backpack.open(it.tab); } return; }
  }
  // pháo giấy nhỏ khi mở khoá (không hộp quà may rủi — chỉ là hiệu ứng vui)
  function burst(x, y, icon) {
    for (let i = 0; i < 13; i++) {
      const e = document.createElement('div'); e.className = 'ecoFly'; e.style.fontSize = '21px'; e.textContent = i % 3 ? '✨' : icon; document.body.appendChild(e);
      const a = i * 2.39996, d = 34 + (i % 5) * 13;
      e.animate([{ transform: `translate(${x}px,${y}px) scale(.5)`, opacity: 1 }, { transform: `translate(${x + Math.cos(a) * d}px,${y + Math.sin(a) * d - 21}px) scale(1.2)`, opacity: 0 }], { duration: 618 + i * 21, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => e.remove();
    }
  }
  addEventListener('keydown', e => { if (e.key === 'Escape' && el) close(); });
  acc.onChange(() => { if (el) render(); });

  // ---------- quầy 🛒 trước cổng Trường Rubik (model quầy hàng Kenney CC0 có sẵn: prop_stall_red) ----------
  const KX = SPAWN[0] + 8, KZ = SPAWN[1] + 13;
  import('../models.js').then(({ loadModel }) => loadModel('alley/stall-red')).then(m => {
    if (!m) return; const y = ctx.terrain.heightAt(KX, KZ); m.position.set(KX, y, KZ); m.rotation.y = Math.atan2(SPAWN[0] - KX, SPAWN[1] - KZ); m.scale.setScalar(1.618); ctx.scene.add(m);
    ctx.colliders && ctx.colliders.push({ x: KX, z: KZ, r: 1.3 });
    const c = document.createElement('canvas'); c.width = 256; c.height = 96; const g = c.getContext('2d'); g.fillStyle = '#f0a23a'; g.beginPath(); g.roundRect(4, 4, 248, 88, 21); g.fill(); g.fillStyle = '#2a1a0a'; g.font = '800 44px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🛒 Cửa hàng', 128, 50);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false })); sp.scale.set(2.6, 0.97, 1); sp.position.set(KX, y + 3.4, KZ); ctx.scene.add(sp);
  }).catch(() => {});
  function update() {
    if (el || pl.vehicle) return; const p = pl.pos;
    if ((p.x - KX) ** 2 + (p.z - KZ) ** 2 < 4.2 ** 2) ctx.offer('🛒 Cửa hàng Trường Rubik', () => open('wear'), 8);
  }
  const self = { open, close, update, render, get isOpen() { return !!el; }, kiosk: [KX, KZ] };
  ctx.shop = self;
  return self;
}
