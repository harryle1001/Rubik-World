// economy/wallet.js — VÍ của người chơi: 🪙 ĐỒNG VÀNG (kiếm khi chơi) + 💎 KIM CƯƠNG HỒNG (chỉ nạp qua cổng phụ huynh / chủ game tặng),
// đồ đã mở khoá (profile.own), cặp vật phẩm nhặt được (profile.bag, giới hạn sức chứa profile.cap).
// Có máy chủ + tài khoản: máy chủ giữ số dư (server/economy.js) — mua hàng hỏi máy chủ, đồng vàng kiếm được báo lên (giới hạn tốc độ).
// Không có máy chủ / khách: lưu trong hồ sơ trên máy như trước. "Xu" cũ = đồng vàng (cùng trường profile.money, không mất gì).
// HUD: chip ví ở hàng chip góc trên (🪙 · 💎, SVG riêng), đồng/kim cương bay vào ví + âm thanh khi nhận.
import { ITEM, ITEMS, FREE, CAP0, CAP_UP, START_GOLD, GEM_PACKS } from './catalog.js';

// ---------- biểu tượng SVG (1 sprite dùng chung, gradient không bị mất khi ẩn) ----------
const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<radialGradient id="ecoG" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#fff7c8"/><stop offset=".42" stop-color="#ffd23f"/><stop offset="1" stop-color="#c47f0c"/></radialGradient>
<linearGradient id="ecoP" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#ffd0e6"/><stop offset=".5" stop-color="#ff5fa8"/><stop offset="1" stop-color="#c8166b"/></linearGradient>
<symbol id="ic-gold" viewBox="0 0 34 34"><circle cx="17" cy="17" r="15.5" fill="url(#ecoG)" stroke="#9a5f06" stroke-width="1.6"/><circle cx="17" cy="17" r="11.2" fill="none" stroke="#b97a0c" stroke-width="1.3" opacity=".75"/><path d="M17 8.4l2.4 6.2 6.2 2.4-6.2 2.4L17 25.6l-2.4-6.2L8.4 17l6.2-2.4z" fill="#fff3b0" stroke="#b97a0c" stroke-width=".8" stroke-linejoin="round"/></symbol>
<symbol id="ic-gem" viewBox="0 0 34 34"><path d="M9 4.5h16l7.5 9.5L17 31.5 1.5 14z" fill="url(#ecoP)" stroke="#a3195b" stroke-width="1.4" stroke-linejoin="round"/><path d="M1.5 14h31M9 4.5l4 9.5 4-9.5 4 9.5 4-9.5M13 14l4 17.5 4-17.5" fill="none" stroke="#ffe1ef" stroke-width="1" opacity=".8"/><path d="M10.5 7l-3 5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".95"/></symbol>
</defs></svg>`;
export const ic = (k, s = 18) => `<svg class="ecoIc" width="${s}" height="${s}" aria-hidden="true"><use href="#ic-${k === 'gem' ? 'gem' : 'gold'}"/></svg>`;
export const priceHtml = (p, s = 16) => p ? (p.gem != null ? `${ic('gem', s)}<b>${p.gem}</b>` : `${ic('gold', s)}<b>${p.gold}</b>`) : '';
export const vnd = n => Number(n).toLocaleString('vi-VN') + ' ₫';

const CSS = `#ecoWallet{order:0;display:flex;align-items:center;gap:8px;height:34px;padding:0 13px 0 8px;border-radius:21px;border:2px solid #fff5;background:#1b1626cc;color:#fff;font:800 15px/1 system-ui;cursor:pointer;white-space:nowrap}
#ecoWallet span{display:flex;align-items:center;gap:5px}#ecoWallet span+span{padding-left:8px;border-left:1px solid #fff3}#ecoWallet .gm b{color:#ffb3d6}#ecoWallet .gd b{color:#ffd36e}
.ecoIc{flex:none;vertical-align:-3px;filter:drop-shadow(0 1px 1px #0005)}
.ecoFly{position:fixed;left:0;top:0;z-index:60;pointer-events:none;width:21px;height:21px}
@keyframes ecoPulse{0%{transform:scale(1)}38%{transform:scale(1.13)}100%{transform:scale(1)}}#ecoWallet.pulse{animation:ecoPulse .382s}`;

export function createWallet(ctx) {
  const acc = ctx.account;
  document.body.insertAdjacentHTML('afterbegin', SPRITE);
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const row = document.getElementById('chipRow');
  const chip = document.createElement('div'); chip.id = 'ecoWallet'; chip.setAttribute('role', 'button'); chip.title = 'Ví: đồng vàng · kim cương hồng (bấm để mở cửa hàng)';
  (row || document.body).prepend(chip);
  chip.onclick = () => ctx.shop && ctx.shop.open();
  const P = () => acc.profile;
  let packs = GEM_PACKS, gateways = null;

  // ---------- chuẩn hoá hồ sơ (chuyển dữ liệu cũ) ----------
  function norm() {
    const p = P(); if (!p) return;
    if (!Number.isFinite(+p.money)) p.money = START_GOLD;
    p.gems = p.gems | 0; p.cap = p.cap || CAP0; p.bag = p.bag || {};
    if (!Array.isArray(p.own)) {   // lần đầu: tặng xe đạp cơ bản + giữ đồ đang dùng (kính/mũ/khăn của nhân vật, chổi/áo đã mua)
      p.own = [...FREE];
      try { const a = JSON.parse(localStorage.getItem('island.avatar') || 'null') || acc.avatar || {}; if (a.glasses === 'round') p.own.push('glass-round'); if (a.glasses === 'square') p.own.push('glass-square'); if (a.scarf) p.own.push('scarf-fibo'); if (a.hat) p.own.push('hat-tim'); } catch (e) {}
      const s = +(localStorage.getItem('island.bike') || 0); if (s > 0) p.own.push('bike-' + s);   // kiểu xe đang đạp dở
    }
    for (const f of FREE) if (!p.own.includes(f)) p.own.push(f);
  }
  const owns = id => { const p = P(); if (FREE.includes(id)) return true; return !!(p && p.own && p.own.includes(id)) || !!(ctx.wear && ctx.wear.own && ctx.wear.own(id)); };
  const gold = () => (P() ? P().money | 0 : 0), gems = () => (P() ? P().gems | 0 : 0);
  const online = () => !!(acc.cloud && acc.online);

  // ---------- HUD ----------
  let shown = { g: -1, m: -1 };
  function render() {
    const p = P(); chip.hidden = !p; if (!p) return;
    if (shown.g === gold() && shown.m === gems()) return; shown = { g: gold(), m: gems() };
    chip.innerHTML = `<span class="gd">${ic('gold', 21)}<b>${gold()}</b></span><span class="gm">${ic('gem', 21)}<b>${gems()}</b></span>`;
  }
  // đồng vàng / kim cương bay từ nhân vật vào ví (tung theo góc vàng 137,5° rồi hút vào chip)
  function fly(kind, n, from, silent) {
    const t = chip.querySelector(kind === 'gem' ? '.gm' : '.gd'), r = t && t.getBoundingClientRect(); if (!r || !r.width) return;
    let sx = innerWidth / 2, sy = innerHeight * 0.55;
    if (from) [sx, sy] = from; else if (ctx.player && ctx.camera) { const v = ctx.player.pos.clone(); v.y += 1.6; v.project(ctx.camera); sx = (v.x + 1) / 2 * innerWidth; sy = (1 - v.y) / 2 * innerHeight; }
    const tx = r.left + 8, ty = r.top + r.height / 2 - 10, k = Math.min(13, Math.max(3, n | 0));
    for (let i = 0; i < k; i++) {
      const e = document.createElement('div'); e.className = 'ecoFly'; e.innerHTML = ic(kind, 21); document.body.appendChild(e);
      const a = i * 2.39996, d = 21 + (i % 3) * 13, mx = sx + Math.cos(a) * d, my = sy + Math.sin(a) * d - 21;
      const an = e.animate([{ transform: `translate(${sx}px,${sy}px) scale(.4)`, opacity: 0 }, { transform: `translate(${mx}px,${my}px) scale(1.15) rotate(${kind === 'gem' ? 0 : 180}deg)`, opacity: 1, offset: 0.3 }, { transform: `translate(${tx}px,${ty}px) scale(.7)`, opacity: 0.9 }],
        { duration: 618 + i * 55, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
      an.onfinish = () => { e.remove(); if (i === k - 1) { chip.classList.remove('pulse'); void chip.offsetWidth; chip.classList.add('pulse'); } };
    }
    if (!silent) ctx.sfx && ctx.sfx(kind === 'gem' ? 'gem' : 'coin');
  }

  // ---------- máy chủ ----------
  let pend = 0, syncT = 0, busy = false;
  const fromServer = (w, animate) => {
    const p = P(); if (!p || !w) return;
    const dg = (w.gems | 0) - (p.gems | 0);
    p.money = (w.gold | 0) + pend; p.gems = w.gems | 0; p.cap = w.cap || p.cap;
    p.own = [...new Set([...(p.own || []), ...(w.own || [])])];
    acc.save(); render(); if (animate && dg > 0) fly('gem', dg); acc.changed();
  };
  async function sync() {
    if (!online() || busy || !pend) return; busy = true; const d = pend; pend = 0;
    const r = await acc.api('/wallet/sync', { d }); busy = false;
    if (r.wallet) fromServer(r.wallet); else pend += d;
    if (pend) syncT = setTimeout(sync, 3000);
  }
  // mọi nơi cộng/trừ đồng vàng đều qua acc.addCoins → ghi lại để báo máy chủ
  const add0 = acc.addCoins;
  acc.addCoins = n => { const ok = add0(n); if (ok && n && online()) { pend += n; clearTimeout(syncT); syncT = setTimeout(sync, 1618); } return ok; };
  async function pull() {
    if (!online()) return; const r = await acc.api('/wallet'); if (r.wallet) { pend = 0; fromServer(r.wallet); }
    const k = await acc.api('/gems/packs'); if (k.packs) { packs = k.packs; gateways = k.gateways; }
  }
  let who = null;
  acc.onChange(() => { norm(); render(); const n = acc.profile && acc.name; if (n !== who) { who = n; if (n) pull(); } });
  if (ctx.net && ctx.net.on) ctx.net.on('wallet', w => { fromServer(w, true); if (w.got && w.got.gems) ctx.toast(`${ic('gem')} Bố mẹ đã nạp <b>${w.got.gems} kim cương hồng</b>! Cảm ơn bố mẹ nhé 💛`, 5500); });

  // ---------- mua ----------
  // id trong catalog, cur 'gold' | 'gem' → { ok, error }
  async function buy(id, cur) {
    const p = P(); if (!p) return { error: 'Hãy đăng nhập hoặc chơi khách để có ví.' };
    const it = ITEM[id]; if (!it || !it.price) return { error: 'Không có món này.' };
    if (owns(id)) return { ok: true, already: true };
    cur = cur || (it.price.gem != null ? 'gem' : 'gold'); const price = it.price[cur];
    if (price == null) return { error: cur === 'gem' ? 'Món này mua bằng đồng vàng.' : 'Món đặc biệt này chỉ đổi bằng kim cương hồng.' };
    if ((cur === 'gem' ? gems() : gold()) < price) return { error: cur === 'gem' ? 'Chưa đủ kim cương hồng — nhờ bố mẹ nạp qua cổng phụ huynh nhé.' : `Chưa đủ đồng vàng (cần ${price}, em có ${gold()}). Học, làm nhiệm vụ, chơi mini game, khám phá để kiếm thêm!` };
    if (online()) {
      if (pend) { clearTimeout(syncT); await sync(); }
      const r = await acc.api('/wallet/buy', { id, cur }); if (r.error) { if (r.wallet) fromServer(r.wallet); return { error: r.error }; }
      fromServer(r.wallet);
    } else {
      if (cur === 'gem') return { error: 'Kim cương hồng cần tài khoản và kết nối máy chủ.' }; p.money -= price;
      p.own.push(id); acc.save();
    }
    grant(it); render(); acc.changed();
    ctx.sfx && ctx.sfx('ok'); return { ok: true };
  }
  // đồ mặc / thú cưng / chổi dùng chung kho của academy/wear.js (Phố Phép Thuật) → đồng bộ để cả hai nơi đều thấy
  function grant(it) {
    const W = ctx.wear; if (!W) return;
    const slot = it.tab === 'pet' ? 'pet' : it.kind === 'broom' && it.id !== 'board-bac' ? 'broom' : it.slot === 'cape' || it.slot === 'hat' ? it.slot : null;
    if (slot && !W.own(it.id)) W.give(slot, it.id);
  }
  // ---------- cặp: vật phẩm nhặt được ----------
  const bagCount = () => Object.values((P() && P().bag) || {}).reduce((s, n) => s + n, 0);
  const cap = () => (P() && P().cap) || CAP0;
  function addLoot(id, n = 1) {
    const p = P(); if (!p || !ITEM[id]) return 0;
    const room = Math.max(0, cap() - bagCount()), k = Math.min(n, room); if (!k) return 0;
    p.bag[id] = (p.bag[id] | 0) + k; acc.save(); acc.changed(); return k;
  }
  function takeLoot(id, n = 1) { const p = P(); if (!p || (p.bag[id] | 0) < n) return false; p.bag[id] -= n; if (!p.bag[id]) delete p.bag[id]; acc.save(); return true; }
  function sell(id, n = 1) {
    const it = ITEM[id]; if (!it || !it.sell) return 0; n = Math.min(n, (P().bag[id] | 0)); if (!n || !takeLoot(id, n)) return 0;
    acc.addCoins(it.sell * n); return it.sell * n;
  }
  const nextCap = () => CAP_UP.find(x => x.cap > cap()) || null;
  async function upgradeCap() {
    const up = nextCap(); if (!up) return { error: 'Cặp đã to nhất rồi!' };
    if (gold() < up.gold) return { error: `Cần ${up.gold} đồng vàng để nới cặp.` };
    if (online()) { if (pend) await sync(); const r = await acc.api('/wallet/buy', { id: 'cap-' + up.cap }); if (r.error) return { error: r.error }; fromServer(r.wallet); }
    else { P().money -= up.gold; P().cap = up.cap; acc.save(); }
    render(); acc.changed(); ctx.sfx && ctx.sfx('ok'); return { ok: true, cap: up.cap };
  }
  // ---------- 💎 nạp kim cương: chỉ sau cổng phụ huynh; tạo đơn → người lớn trả ở trang của cổng thanh toán ----------
  async function checkout(pack, gateway) {
    if (!online()) return { error: 'Cần tài khoản và kết nối máy chủ để bố mẹ nạp kim cương.' };
    const r = await acc.api('/gems/checkout', { pack, gateway }); if (r.error) return r;
    const id = r.order.id, t0 = Date.now();
    const poll = async () => { if (Date.now() - t0 > 15 * 60e3) return; const o = await acc.api('/gems/orders/' + id); if (o.order && o.order.status === 'paid') return o.wallet && fromServer(o.wallet, true); if (o.order && o.order.status === 'failed') return ctx.toast('💳 Đơn kim cương chưa thanh toán xong.', 3500); setTimeout(poll, 3000); };
    setTimeout(poll, 3000); return r;
  }
  // khoá: bấm vào đồ chưa mở → mời ra cửa hàng
  function locked(id) {
    const it = ITEM[id]; ctx.sfx && ctx.sfx('ui');
    ctx.toast(`🔒 <b>${it ? it.name : 'Món này'}</b> chưa mở khoá — mở ở <b>🛒 Cửa hàng</b> (${it && it.price ? priceHtml(it.price, 14) : ''})`, 3500);
    ctx.shop && ctx.shop.open(it && it.tab, id);
  }
  norm(); render();
  const self = { owns, buy, gold, gems, fly, render, addLoot, takeLoot, sell, bagCount, cap, nextCap, upgradeCap, checkout, locked, pull, ITEMS, ITEM,
    get packs() { return packs; }, get gateways() { return gateways; }, get online() { return online(); } };
  ctx.eco = self;
  return self;
}
