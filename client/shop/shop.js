// shop.js — Cửa hàng Rubik World: cổng phụ huynh, danh mục, giỏ hàng (localStorage), đặt hàng, xem đơn. Không thư viện.
(() => {
  const $ = id => document.getElementById(id), vnd = n => (n | 0).toLocaleString('vi-VN') + 'đ';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const ss = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  const ls = { get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const toast = t => { const el = $('toast'); if (!el) return; el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2600); };
  const api = (u, body) => fetch(u, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}).then(async r => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.err || 'Lỗi kết nối, thử lại sau.'); return j; });

  // ---------- CỔNG PHỤ HUYNH: phép nhân viết bằng chữ (trẻ nhỏ khó đọc & tính), qua rồi nhớ trong phiên ----------
  const W = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const word = n => n < 10 ? W[n] : 'mười' + (n % 10 ? ' ' + (n % 10 === 5 ? 'lăm' : W[n % 10]) : '');
  function gate(done) {
    if (ss.get('rw.parent') === '1') return done();
    const g = $('gate'); if (!g) return done();
    const a = 12 + Math.floor(Math.random() * 8), b = 3 + Math.floor(Math.random() * 7);
    $('gq').textContent = `${word(a)[0].toUpperCase() + word(a).slice(1)} nhân ${word(b)} bằng bao nhiêu?`;
    g.hidden = false; $('ga').focus();
    $('gf').onsubmit = e => { e.preventDefault(); if (+$('ga').value.trim() === a * b) { ss.set('rw.parent', '1'); g.hidden = true; done(); } else { $('ge').textContent = 'Chưa đúng. Vui lòng nhờ bố mẹ trả lời.'; $('ga').value = ''; } };
  }
  window.RW = { gate, api, vnd, esc, toast, payBlock };   // payBlock: khai báo function bên dưới (được hoist)

  // ---------- trang danh mục ----------
  if (!$('grid')) return;
  let CAT = null, cat = 'all', cart = ls.get('rw.cart') || {};
  const prod = id => CAT && CAT.products.find(p => p.id === id);
  const saveCart = () => { ls.set('rw.cart', cart); const n = Object.values(cart).reduce((s, q) => s + q, 0); $('cartN').textContent = n; $('cartN').hidden = !n; };
  function render() {
    $('cats').innerHTML = [['all', 'Tất cả'], ...CAT.cats].map(([id, n]) => `<button class="btn ${cat === id ? 'on' : ''}" data-c="${id}">${esc(n)}</button>`).join('');
    const list = CAT.products.filter(p => cat === 'all' || p.cat === cat);
    $('grid').innerHTML = list.map(p => `<article class="card"><div class="ph"><img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy" width="400" height="400">${p.stock <= 0 ? '<span class="tag">Hết hàng</span>' : ''}</div>
      <div class="body"><h3>${esc(p.name)}</h3><p class="d">${esc(p.desc)}</p>${p.reward ? `<span class="gift">🎁 Kèm mã quà: ${esc(p.reward)}</span>` : ''}
      <div class="row"><div><div class="price">${vnd(p.price)}</div><div class="stock ${p.stock > 0 && p.stock < 8 ? 'low' : ''}">${p.stock > 0 ? (p.stock < 8 ? `Chỉ còn ${p.stock}` : 'Còn hàng') : 'Tạm hết'}</div></div>
      <button class="btn pri" data-add="${esc(p.id)}" ${p.stock > 0 ? '' : 'disabled'}>Thêm vào giỏ</button></div></div></article>`).join('') || '<p>Chưa có sản phẩm.</p>';
  }
  $('cats').onclick = e => { const b = e.target.closest('[data-c]'); if (b) { cat = b.dataset.c; render(); } };
  $('grid').onclick = e => { const b = e.target.closest('[data-add]'); if (!b) return; const p = prod(b.dataset.add); if (!p) return; cart[p.id] = Math.min(p.stock, (cart[p.id] || 0) + 1); saveCart(); toast('Đã thêm ' + p.name); };

  // ---------- ngăn kéo: giỏ → thông tin giao hàng → kết quả ----------
  const open = on => { $('drawer').classList.toggle('on', on); $('scrim').classList.toggle('on', on); document.body.style.overflow = on ? 'hidden' : ''; };
  $('cartBtn').onclick = () => { showCart(); open(true); };
  $('dClose').onclick = $('scrim').onclick = () => open(false);
  addEventListener('keydown', e => { if (e.key === 'Escape') open(false); });
  const totals = () => { const sub = Object.entries(cart).reduce((s, [id, q]) => s + (prod(id) ? prod(id).price * q : 0), 0); const ship = !sub || sub >= CAT.freeShip ? 0 : CAT.shipFee; return { sub, ship, total: sub + ship }; };
  const sumHtml = () => { const t = totals(); return `<div class="sum"><span>Tạm tính</span><span>${vnd(t.sub)}</span></div><div class="sum"><span>Phí giao hàng</span><span>${t.ship ? vnd(t.ship) : 'Miễn phí'}</span></div><div class="sum t"><span>Tổng cộng</span><span>${vnd(t.total)}</span></div>`; };
  function showCart() {
    for (const id of Object.keys(cart)) if (!prod(id) || cart[id] <= 0) delete cart[id]; saveCart();
    $('dTitle').textContent = 'Giỏ hàng';
    const ids = Object.keys(cart);
    $('dIn').innerHTML = ids.length ? ids.map(id => { const p = prod(id); return `<div class="line"><img src="${esc(p.img)}" alt=""><div class="n">${esc(p.name)}<br><b>${vnd(p.price)}</b></div><span class="qty"><button data-q="${esc(id)}" data-d="-1" aria-label="Bớt">−</button>${cart[id]}<button data-q="${esc(id)}" data-d="1" aria-label="Thêm">+</button></span></div>`; }).join('') : '<p>Giỏ hàng đang trống.</p>';
    $('dFoot').innerHTML = ids.length ? sumHtml() + `<button class="btn gold" style="width:100%" id="toCo">Đặt hàng</button>` : '';
    $('dIn').onclick = e => { const b = e.target.closest('[data-q]'); if (!b) return; const p = prod(b.dataset.q); cart[p.id] = Math.max(0, Math.min(p.stock, cart[p.id] + +b.dataset.d)); showCart(); };
    if (ids.length) $('toCo').onclick = checkout;
  }
  function checkout() {
    const f = ls.get('rw.ship') || {};
    $('dTitle').textContent = 'Thông tin giao hàng';
    $('dIn').innerHTML = `<form class="co" id="co" novalidate>
      <label for="cName">Họ tên người nhận</label><input id="cName" autocomplete="name" value="${esc(f.name)}" required>
      <label for="cPhone">Số điện thoại</label><input id="cPhone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(f.phone)}" required>
      <label for="cEmail">Email (nhận xác nhận đơn)</label><input id="cEmail" type="email" autocomplete="email" value="${esc(f.email)}">
      <label for="cAddr">Địa chỉ (số nhà, đường, phường/xã, quận/huyện)</label><input id="cAddr" autocomplete="street-address" value="${esc(f.address)}" required>
      <label for="cProv">Tỉnh / Thành phố</label><input id="cProv" autocomplete="address-level1" value="${esc(f.province)}" required>
      <label for="cNote">Ghi chú (size áo, màu khăn, giờ nhận…)</label><textarea id="cNote"></textarea>
      <label>Thanh toán</label><div class="pays">
        <label><input type="radio" name="pay" value="cod" checked><span>💵 Trả tiền khi nhận hàng (COD)<small>Kiểm tra hàng rồi thanh toán cho shipper.</small></span></label>
        <label><input type="radio" name="pay" value="bank"><span>🏦 Chuyển khoản ngân hàng<small>Quét mã VietQR sau khi đặt, ghi nội dung là mã đơn.</small></span></label>
        ${CAT.online ? `<label><input type="radio" name="pay" value="online"><span>💳 Thanh toán online${CAT.mock ? ' <b>(giả lập để thử)</b>' : ''}<small>Ví điện tử / thẻ qua cổng thanh toán.</small></span></label>` : ''}
      </div>
      <label class="check" style="margin-top:21px"><input type="checkbox" id="cParent"><span>Tôi là phụ huynh/người giám hộ (đủ 18 tuổi) và đồng ý <a href="/shop/chinh-sach.html" target="_blank">chính sách mua hàng & bảo mật</a>.</span></label>
      <div class="err" id="cErr"></div></form>`;
    $('dFoot').innerHTML = sumHtml() + `<div style="display:flex;gap:8px"><button class="btn" id="back">‹ Giỏ</button><button class="btn gold" style="flex:1" id="send">Xác nhận đặt hàng</button></div>`;
    $('back').onclick = showCart;
    $('send').onclick = async () => {
      const v = id => $(id).value.trim(), body = { name: v('cName'), phone: v('cPhone'), email: v('cEmail'), address: v('cAddr'), province: v('cProv'), note: v('cNote'), pay: (document.querySelector('[name=pay]:checked') || {}).value, parent: $('cParent').checked, items: Object.entries(cart).map(([id, qty]) => ({ id, qty })) };
      if (!body.parent) return ($('cErr').textContent = 'Vui lòng xác nhận bạn là phụ huynh.');
      ls.set('rw.ship', { name: body.name, phone: body.phone, email: body.email, address: body.address, province: body.province });
      $('send').disabled = true; $('cErr').textContent = '';
      try {
        const r = await api('/api/shop/order', body);
        const mine = ls.get('rw.orders') || []; mine.unshift({ id: r.id, t: r.token }); ls.set('rw.orders', mine.slice(0, 21));
        cart = {}; saveCart(); load(); done(r.order, r.token);
      } catch (e) { $('cErr').textContent = e.message; $('send').disabled = false; }
    };
  }
  function done(o, t) {
    $('dTitle').textContent = 'Đặt hàng thành công';
    $('dIn').innerHTML = `<p style="font-size:42px;margin:0">🎉</p><h3>Cảm ơn bố mẹ!</h3><p>Mã đơn <b>${esc(o.id)}</b> · Tổng <b>${vnd(o.total)}</b>.<br>Shop sẽ gọi xác nhận trong giờ hành chính. ${o.pay === 'cod' ? 'Thanh toán khi nhận hàng.' : ''}</p>${payBlock(o, t)}<p class="note">🎁 Trong hộp có thẻ mã quà. Cho con nhập mã ở <b>Phố Phép Thuật › Tủ kính Rubik</b> trong game để nhận vật phẩm độc quyền.</p>`;
    $('dFoot').innerHTML = `<a class="btn" style="display:block;text-align:center;text-decoration:none" href="/shop/don.html?id=${encodeURIComponent(o.id)}&t=${t}">Xem đơn hàng</a>`;
  }
  function payBlock(o, t) {
    if (o.payUrl) return `<a class="btn gold" style="display:block;text-align:center;text-decoration:none" href="${esc(o.payUrl)}">💳 Thanh toán ${vnd(o.total)}</a>`;
    if (o.bank) return o.bank.qr ? `<div class="note" style="text-align:center"><img src="${esc(o.bank.qr)}" alt="Mã VietQR" style="width:100%;max-width:280px;border-radius:8px"><br>${esc(o.bank.bank)} · ${esc(o.bank.acc)} · ${esc(o.bank.holder)}<br>Nội dung: <b>${esc(o.bank.content)}</b></div>` : `<p class="note">${esc(o.bank.note)} Nội dung chuyển khoản: <b>${esc(o.bank.content)}</b></p>`;
    return '';
  }
  const load = () => api('/api/shop/catalog').then(c => { CAT = c; $('freeShip').textContent = vnd(c.freeShip); render(); saveCart(); }).catch(e => { $('grid').innerHTML = `<p class="err">${esc(e.message)}</p>`; });
  gate(load);
})();
