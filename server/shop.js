// shop.js — CỬA HÀNG ĐỒ THẬT (cho phụ huynh) + MÃ ĐỔI QUÀ trong game. Gắn vào Express ở server/index.js.
// Dữ liệu: data/shop.json (sản phẩm, đơn hàng, mã quà đã băm) — có thông tin cá nhân người mua → không commit (.gitignore).
// Thanh toán: COD · chuyển khoản (VietQR nếu cấu hình) · cổng online qua PAY_PROVIDERS (hiện có 'mock' giả lập để thử;
//   MoMo/ZaloPay/VNPay: thêm provider cùng giao diện create(order) → { url }). Email: Resend API nếu có khoá, không thì ghi data/shop-mail.log.
// Giao hàng: xuất CSV theo mẫu GHN/GHTK + hook tạo vận đơn (chỉ chạy khi có GHN_TOKEN/GHTK_TOKEN).
const fs = require('fs'), path = require('path'), crypto = require('crypto'), express = require('express');
const { CATS, REWARDS, PRODUCTS } = require('./shop-data');
const qrcode = require('../client/shop/lib/qrcode.js');

module.exports = function mountShop(app, { ROOT, adminKey }) {
  const FILE = path.join(ROOT, 'data', 'shop.json'), MAIL_LOG = path.join(ROOT, 'data', 'shop-mail.log');
  let S = { products: PRODUCTS, orders: [], codes: {}, batches: {}, seq: 0 };
  try { S = Object.assign(S, JSON.parse(fs.readFileSync(FILE, 'utf8'))); } catch (e) {}
  let dirty = false; const save = () => { dirty = true; };
  setInterval(() => { if (!dirty) return; dirty = false; fs.mkdir(path.dirname(FILE), { recursive: true }, () => fs.writeFile(FILE + '.tmp', JSON.stringify(S), e => !e && fs.rename(FILE + '.tmp', FILE, () => {}))); }, 1500);

  const env = process.env, SHIP_FEE = +env.SHOP_SHIP_FEE || 30000, FREE_SHIP = +env.SHOP_FREE_SHIP || 500000;
  const PAY_MODE = env.SHOP_PAY_MODE || 'mock';   // 'mock' (thử nghiệm) | 'off' | tên cổng thật khi đã gắn
  const clean = (s, n) => String(s == null ? '' : s).replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, n);
  const json = express.json({ limit: '32kb' });
  if (env.TRUST_PROXY) app.set('trust proxy', isNaN(+env.TRUST_PROXY) ? env.TRUST_PROXY : +env.TRUST_PROXY);   // sau proxy (Render…): TRUST_PROXY=1
  const ipOf = req => req.ip || '?';   // không tin X-Forwarded-For tự khai (tránh lách giới hạn dò mã)
  // giới hạn tốc độ đơn giản: key → { n, t } trong cửa sổ win ms
  const buckets = new Map();
  const limited = (key, max, win) => { const now = Date.now(), b = buckets.get(key); if (!b || now - b.t > win) { buckets.set(key, { n: 0, t: now }); return false; } return b.n >= max; };
  const hit = key => { const b = buckets.get(key); if (b) b.n++; };
  setInterval(() => { const now = Date.now(); for (const [k, b] of buckets) if (now - b.t > 3600e3) buckets.delete(k); }, 600e3);
  const isAdmin = req => { const k = String(req.headers['x-admin-key'] || ''); return !!k && crypto.timingSafeEqual(Buffer.from(crypto.createHash('sha256').update(k.trim().toUpperCase()).digest()), Buffer.from(crypto.createHash('sha256').update(adminKey().toUpperCase()).digest())); };
  const admin = (req, res, next) => {
    const ip = ipOf(req); if (limited('adm:' + ip, 13, 600e3)) return res.status(429).json({ err: 'Thử sai quá nhiều, đợi 10 phút.' });
    if (!isAdmin(req)) { hit('adm:' + ip); return res.status(401).json({ err: 'Sai mã chủ game (ADMIN_KEY).' }); }
    next();
  };
  const pubProduct = p => ({ id: p.id, cat: p.cat, name: p.name, price: p.price, stock: Math.max(0, p.stock | 0), desc: p.desc, img: p.img, reward: p.reward && REWARDS[p.reward] ? REWARDS[p.reward].name : null });
  const money = n => (n | 0).toLocaleString('vi-VN') + 'đ';
  const PAY_NAME = { cod: 'Thanh toán khi nhận hàng (COD)', bank: 'Chuyển khoản ngân hàng', online: 'Thanh toán online' };
  const STATUS = { moi: 'Mới đặt', 'da-tt': 'Đã thanh toán', 'dang-giao': 'Đang giao', 'da-giao': 'Đã giao', huy: 'Đã huỷ' };

  // ---------- email xác nhận ----------
  async function mail(to, subject, text) {
    if (!to) return;
    if (env.RESEND_API_KEY && env.SHOP_MAIL_FROM) {
      try { await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: env.SHOP_MAIL_FROM, to: [to], subject, text }) }); return; } catch (e) { console.warn('[shop] gửi email lỗi:', e.message); }
    }
    fs.mkdir(path.dirname(MAIL_LOG), { recursive: true }, () => fs.appendFile(MAIL_LOG, `--- ${new Date().toISOString()} → ${to}\n${subject}\n${text}\n`, () => {}));
  }
  const orderText = o => [`Mã đơn: ${o.id}`, ...o.items.map(i => `• ${i.name} × ${i.qty} = ${money(i.price * i.qty)}`), `Phí giao: ${money(o.ship)}`, `Tổng cộng: ${money(o.total)}`, `Thanh toán: ${PAY_NAME[o.pay]}`, `Giao tới: ${o.name} · ${o.phone} · ${o.address}, ${o.province}`, '', 'Mỗi sản phẩm kèm thẻ mã quà — con nhập trong game (Phố Phép Thuật › Tủ kính Rubik) để nhận vật phẩm độc quyền.', 'Chính sách đổi trả 7 ngày: ' + (env.PUBLIC_ORIGIN || '') + '/shop/chinh-sach.html'].join('\n');

  // ---------- thanh toán ----------
  const PAY_PROVIDERS = {
    mock: { create: o => ({ url: `/shop/pay.html?id=${o.id}&t=${o.token}` }) },
    // momo / zalopay / vnpay: create(o) ký yêu cầu bằng khoá bí mật trong biến môi trường rồi trả { url } của cổng; thêm route IPN để gọi markPaid().
  };
  function markPaid(o, via) { if (o.paid) return; o.paid = { at: Date.now(), via }; if (o.status === 'moi') o.status = 'da-tt'; save(); mail(o.email, `[Rubik World] Đã nhận thanh toán đơn ${o.id}`, 'Cảm ơn bố mẹ! Chúng tôi đã nhận thanh toán và sẽ đóng gói trong 1–2 ngày làm việc.\n\n' + orderText(o)); }
  function bankInfo(o) {
    if (!env.SHOP_BANK_ID || !env.SHOP_BANK_ACC) return { note: 'Shop sẽ gọi điện/nhắn tin gửi số tài khoản trong giờ hành chính.', content: o.id };
    const q = new URLSearchParams({ amount: o.total, addInfo: o.id, accountName: env.SHOP_BANK_NAME || '' });
    return { bank: env.SHOP_BANK_ID, acc: env.SHOP_BANK_ACC, holder: env.SHOP_BANK_NAME || '', content: o.id, qr: `https://img.vietqr.io/image/${encodeURIComponent(env.SHOP_BANK_ID)}-${encodeURIComponent(env.SHOP_BANK_ACC)}-compact2.png?${q}` };
  }
  const pubOrder = o => ({ id: o.id, at: o.at, items: o.items, ship: o.ship, total: o.total, pay: o.pay, payName: PAY_NAME[o.pay], status: o.status, statusName: STATUS[o.status], paid: !!o.paid, tracking: o.tracking || null, bank: o.pay === 'bank' && !o.paid ? bankInfo(o) : null, payUrl: o.pay === 'online' && !o.paid && PAY_PROVIDERS[PAY_MODE] ? PAY_PROVIDERS[PAY_MODE].create(o).url : null });

  // ---------- API công khai (trang /shop) ----------
  app.get('/api/shop/catalog', (req, res) => res.json({ cats: CATS, products: S.products.filter(p => p.active).map(pubProduct), shipFee: SHIP_FEE, freeShip: FREE_SHIP, online: PAY_MODE !== 'off' && !!PAY_PROVIDERS[PAY_MODE], mock: PAY_MODE === 'mock' }));
  app.post('/api/shop/order', json, (req, res) => {
    const ip = ipOf(req); if (limited('ord:' + ip, 8, 3600e3)) return res.status(429).json({ err: 'Bạn đặt quá nhiều đơn trong 1 giờ. Vui lòng gọi hotline.' });
    const d = req.body || {};
    if (d.parent !== true) return res.status(400).json({ err: 'Chỉ phụ huynh (người đủ 18 tuổi) được đặt hàng.' });
    const name = clean(d.name, 60), phone = clean(d.phone, 15).replace(/[^\d+]/g, ''), email = clean(d.email, 80), address = clean(d.address, 200), province = clean(d.province, 60), note = clean(d.note, 300);
    if (name.length < 2 || !/^(\+?84|0)\d{9,10}$/.test(phone) || address.length < 8 || province.length < 2) return res.status(400).json({ err: 'Vui lòng nhập đủ họ tên, số điện thoại Việt Nam và địa chỉ giao hàng.' });
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ err: 'Email chưa đúng.' });
    const pay = ['cod', 'bank', 'online'].includes(d.pay) ? d.pay : 'cod';
    if (pay === 'online' && (PAY_MODE === 'off' || !PAY_PROVIDERS[PAY_MODE])) return res.status(400).json({ err: 'Thanh toán online đang tạm đóng, vui lòng chọn COD hoặc chuyển khoản.' });
    const items = [];
    for (const it of (Array.isArray(d.items) ? d.items : []).slice(0, 34)) {
      const p = S.products.find(x => x.id === it.id && x.active), qty = Math.floor(+it.qty);
      if (!p || !(qty >= 1 && qty <= 21)) return res.status(400).json({ err: 'Giỏ hàng có sản phẩm không hợp lệ.' });
      if ((p.stock | 0) < qty) return res.status(409).json({ err: `“${p.name}” chỉ còn ${Math.max(0, p.stock | 0)} sản phẩm.` });
      items.push({ id: p.id, name: p.name, price: p.price, qty });
    }
    if (!items.length) return res.status(400).json({ err: 'Giỏ hàng trống.' });
    hit('ord:' + ip);
    for (const it of items) S.products.find(x => x.id === it.id).stock -= it.qty;   // giữ hàng ngay khi đặt
    const sub = items.reduce((s, i) => s + i.price * i.qty, 0), ship = sub >= FREE_SHIP ? 0 : SHIP_FEE;
    const now = new Date(), id = 'RW' + now.toISOString().slice(2, 10).replace(/-/g, '') + String(++S.seq % 10000).padStart(4, '0');
    const o = { id, token: crypto.randomBytes(12).toString('hex'), at: Date.now(), items, sub, ship, total: sub + ship, pay, status: 'moi', name, phone, email, address, province, note, paid: null, tracking: null };
    S.orders.push(o); save();
    mail(email, `[Rubik World] Xác nhận đơn hàng ${id}`, 'Cảm ơn bố mẹ đã đặt hàng tại Cửa hàng Rubik World!\n\n' + orderText(o));
    res.json({ id, token: o.token, order: pubOrder(o) });
  });
  const findOrder = req => S.orders.find(o => o.id === String(req.params.id) && o.token === String(req.query.t || (req.body && req.body.t) || ''));
  app.get('/api/shop/order/:id', (req, res) => { const o = findOrder(req); o ? res.json(pubOrder(o)) : res.status(404).json({ err: 'Không tìm thấy đơn.' }); });
  app.post('/api/shop/pay/mock/:id', json, (req, res) => {   // CHỈ khi SHOP_PAY_MODE=mock: giả lập cổng báo đã trả tiền
    if (PAY_MODE !== 'mock') return res.status(403).json({ err: 'Thanh toán giả lập đã tắt.' });
    const o = findOrder(req); if (!o || o.pay !== 'online' || o.status === 'huy') return res.status(404).json({ err: 'Không tìm thấy đơn.' });
    markPaid(o, 'mock'); res.json(pubOrder(o));
  });
  // Mã QR tới trang cửa hàng (tủ kính trong game hiện cho phụ huynh quét bằng điện thoại)
  app.get('/api/shop/qr.svg', (req, res) => {
    const base = env.PUBLIC_ORIGIN || `${req.protocol}://${req.get('host')}`, q = qrcode(0, 'M'); q.addData(base + '/shop'); q.make();
    res.type('image/svg+xml').set('Cache-Control', 'public, max-age=3600').send(q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }));
  });

  // ---------- MÃ ĐỔI QUÀ ----------
  const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // 32 ký tự, bỏ I/O/0/1 dễ nhầm → 12 ký tự = 60 bit, không thể dò
  const norm = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const hashCode = c => crypto.createHash('sha256').update('rw-gift|' + c).digest('hex');
  const newCode = () => Array.from(crypto.randomBytes(12), b => ABC[b & 31]).join('');
  const fmt = c => c.match(/.{4}/g).join('-');
  const cors = (req, res, next) => { const o = req.headers.origin; if (o && /^(capacitor|https?):\/\/localhost(:\d+)?$/.test(o)) { res.set({ 'Access-Control-Allow-Origin': o, 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' }); } if (req.method === 'OPTIONS') return res.sendStatus(204); next(); };
  app.options('/api/redeem', cors);
  app.post('/api/redeem', cors, json, (req, res) => {
    const ip = ipOf(req);
    if (limited('rd:' + ip, 8, 3600e3) || limited('rd:*', 144, 60e3)) return res.status(429).json({ err: 'Em nhập sai nhiều lần quá. Đợi 1 tiếng rồi nhờ bố mẹ kiểm tra lại mã trên thẻ nhé!' });
    const c = norm(req.body && req.body.code), who = clean(req.body && req.body.name, 20) || 'Khách';
    const rec = c.length === 12 && S.codes[hashCode(c)];
    if (!rec) { hit('rd:' + ip); hit('rd:*'); return res.status(404).json({ err: 'Mã chưa đúng. Kiểm tra lại từng chữ trên thẻ nhé (không có chữ O và I).' }); }
    if (rec.used) { hit('rd:' + ip); return res.status(409).json({ err: 'Mã này đã được dùng rồi. Mỗi mã chỉ dùng được 1 lần.' }); }
    rec.used = { at: Date.now(), by: who }; save();
    res.json({ reward: rec.r, ...REWARDS[rec.r] });
  });

  // ---------- QUẢN LÝ (/admin, cần ADMIN_KEY trong header x-admin-key) ----------
  app.get('/api/admin/shop', admin, (req, res) => {
    const batches = Object.entries(S.batches).map(([id, b]) => ({ id, ...b, used: Object.values(S.codes).filter(c => c.b === id && c.used).length }));
    res.json({ cats: CATS, rewards: REWARDS, products: S.products, orders: S.orders.slice().reverse().slice(0, 377).map(o => ({ ...o, token: undefined, statusName: STATUS[o.status], payName: PAY_NAME[o.pay] })), batches, status: STATUS, ship: { ghn: !!env.GHN_TOKEN, ghtk: !!env.GHTK_TOKEN } });
  });
  app.put('/api/admin/shop/product', admin, json, (req, res) => {
    const d = req.body || {}, id = clean(d.id, 40).toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!id || !CATS.some(c => c[0] === d.cat)) return res.status(400).json({ err: 'Thiếu mã sản phẩm hoặc danh mục.' });
    let p = S.products.find(x => x.id === id); if (!p) S.products.push(p = { id });
    Object.assign(p, { cat: d.cat, name: clean(d.name, 90) || id, price: Math.max(0, Math.round(+d.price || 0)), stock: Math.max(0, Math.round(+d.stock || 0)), desc: clean(d.desc, 600), img: /^(\/|https:\/\/)[^\s"'<>]*$/.test(d.img || '') ? d.img : `/shop/img/${id}.svg`, reward: REWARDS[d.reward] ? d.reward : null, active: d.active !== false });
    save(); res.json(p);
  });
  app.delete('/api/admin/shop/product/:id', admin, (req, res) => { S.products = S.products.filter(p => p.id !== req.params.id); save(); res.json({ ok: true }); });
  app.post('/api/admin/shop/order/:id', admin, json, (req, res) => {
    const o = S.orders.find(x => x.id === req.params.id), d = req.body || {}; if (!o) return res.status(404).json({ err: 'Không có đơn.' });
    if (d.status && STATUS[d.status] && d.status !== o.status) {
      if (d.status === 'huy' && o.status !== 'huy') for (const it of o.items) { const p = S.products.find(x => x.id === it.id); if (p) p.stock += it.qty; }   // huỷ → trả lại kho
      if (o.status === 'huy' && d.status !== 'huy') for (const it of o.items) { const p = S.products.find(x => x.id === it.id); if (p) p.stock -= it.qty; }
      o.status = d.status;
      if (d.status === 'dang-giao') mail(o.email, `[Rubik World] Đơn ${o.id} đang được giao`, `Đơn hàng đã giao cho đơn vị vận chuyển${o.tracking ? ' — mã vận đơn ' + o.tracking : ''}.\n\n` + orderText(o));
    }
    if (d.paid === true) markPaid(o, 'admin'); if (d.paid === false) o.paid = null;
    if (d.tracking !== undefined) o.tracking = clean(d.tracking, 40) || null;
    save(); res.json({ ok: true });
  });
  // Xuất đơn cho đơn vị giao hàng: CSV (UTF-8 BOM, mở được bằng Excel) theo cột phổ biến của file nhập GHN / GHTK
  app.get('/api/admin/shop/orders.csv', admin, (req, res) => {
    const st = String(req.query.status || 'da-tt,moi').split(','), ghtk = req.query.to === 'ghtk';
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const head = ghtk ? ['Mã đơn', 'Tên người nhận', 'Số điện thoại', 'Địa chỉ', 'Tỉnh/Thành', 'Sản phẩm', 'Khối lượng (g)', 'Tiền thu hộ', 'Giá trị hàng', 'Ghi chú']
      : ['Mã đơn riêng', 'Họ tên người nhận', 'Số điện thoại', 'Địa chỉ', 'Tỉnh/Thành phố', 'Tên sản phẩm', 'Khối lượng (gram)', 'Tiền thu hộ (COD)', 'Giá trị hàng hoá', 'Ghi chú'];
    const rows = S.orders.filter(o => st.includes(o.status)).map(o => [o.id, o.name, o.phone, o.address, o.province, o.items.map(i => `${i.name} x${i.qty}`).join('; '), 233 * o.items.reduce((s, i) => s + i.qty, 0), o.pay === 'cod' && !o.paid ? o.total : 0, o.sub, o.note].map(q).join(','));
    res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="don-hang-${ghtk ? 'ghtk' : 'ghn'}-${new Date().toISOString().slice(0, 10)}.csv"` }).send('﻿' + [head.map(q).join(','), ...rows].join('\r\n'));
  });
  // Hook tạo vận đơn: chỉ gọi API thật khi có khoá trong biến môi trường; không có thì báo để chủ shop tải CSV lên trang đối tác
  app.post('/api/admin/shop/order/:id/ship', admin, json, async (req, res) => {
    const o = S.orders.find(x => x.id === req.params.id), to = (req.body && req.body.to) === 'ghtk' ? 'ghtk' : 'ghn'; if (!o) return res.status(404).json({ err: 'Không có đơn.' });
    const cod = o.pay === 'cod' && !o.paid ? o.total : 0, w = 233 * o.items.reduce((s, i) => s + i.qty, 0);
    try {
      if (to === 'ghn' && env.GHN_TOKEN && env.GHN_SHOP_ID) {
        const r = await fetch((env.GHN_API || 'https://online-gateway.ghn.vn/shiip/public-api') + '/v2/shipping-order/create', { method: 'POST', headers: { Token: env.GHN_TOKEN, ShopId: env.GHN_SHOP_ID, 'Content-Type': 'application/json' }, body: JSON.stringify({ payment_type_id: 2, required_note: 'CHOXEMHANGKHONGTHU', client_order_code: o.id, to_name: o.name, to_phone: o.phone, to_address: `${o.address}, ${o.province}`, cod_amount: cod, weight: w, length: 21, width: 13, height: 8, service_type_id: 2, items: o.items.map(i => ({ name: i.name, quantity: i.qty, price: i.price })) }) }).then(r => r.json());
        if (r && r.data && r.data.order_code) { o.tracking = r.data.order_code; o.status = 'dang-giao'; save(); return res.json({ ok: true, tracking: o.tracking }); }
        return res.status(502).json({ err: 'GHN báo lỗi: ' + ((r && r.message) || 'không rõ') });
      }
      if (to === 'ghtk' && env.GHTK_TOKEN) {
        const r = await fetch((env.GHTK_API || 'https://services.giaohangtietkiem.vn') + '/services/shipment/order', { method: 'POST', headers: { Token: env.GHTK_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ products: o.items.map(i => ({ name: i.name, quantity: i.qty, weight: 0.233 })), order: { id: o.id, name: o.name, tel: o.phone, address: o.address, province: o.province, district: '', ward: 'Khác', hamlet: 'Khác', pick_money: cod, value: o.sub, pick_name: env.SHOP_PICK_NAME || '', pick_tel: env.SHOP_PICK_TEL || '', pick_address: env.SHOP_PICK_ADDRESS || '', pick_province: env.SHOP_PICK_PROVINCE || '', pick_district: env.SHOP_PICK_DISTRICT || '' } }) }).then(r => r.json());
        if (r && r.success && r.order) { o.tracking = r.order.label; o.status = 'dang-giao'; save(); return res.json({ ok: true, tracking: o.tracking }); }
        return res.status(502).json({ err: 'GHTK báo lỗi: ' + ((r && r.message) || 'không rõ') });
      }
    } catch (e) { return res.status(502).json({ err: 'Không gọi được đơn vị giao hàng: ' + e.message }); }
    res.status(400).json({ err: `Chưa cấu hình khoá ${to.toUpperCase()} (xem docs/shop.md). Hãy tải CSV và nhập trên trang ${to.toUpperCase()}.` });
  });
  // Tạo mã hàng loạt: trả mã gốc 1 LẦN DUY NHẤT (server chỉ giữ bản băm) → chủ shop lưu file CSV để in thẻ
  app.post('/api/admin/shop/codes', admin, json, (req, res) => {
    const d = req.body || {}, r = d.reward, n = Math.floor(+d.count);
    if (!REWARDS[r] || !(n >= 1 && n <= 2584)) return res.status(400).json({ err: 'Chọn vật phẩm và số lượng 1–2584.' });
    const id = 'L' + Date.now().toString(36).toUpperCase(), out = [];
    while (out.length < n) { const c = newCode(), h = hashCode(c); if (S.codes[h]) continue; S.codes[h] = { r, b: id }; out.push(fmt(c)); }
    S.batches[id] = { reward: r, count: n, note: clean(d.note, 80), at: Date.now() }; save();
    res.json({ batch: id, reward: REWARDS[r].name, codes: out });
  });
};
