// pay-gateways.js — Tích hợp cổng thanh toán Việt Nam theo tài liệu API chính thức (không SDK đóng; chỉ HMAC của node:crypto):
//   • MoMo  v2  /v2/gateway/api/create (captureWallet | payWithMethod) — chữ ký HMAC-SHA256(secretKey), IPN trả HTTP 204
//   • ZaloPay v2 /v2/create — mac HMAC-SHA256(key1), callback mac HMAC-SHA256(key2), trả {return_code:1}
//   • VNPay 2.1.0 vpcpay.html — vnp_SecureHash HMAC-SHA512(hashSecret) trên query đã sắp xếp, IPN trả {RspCode:'00'}
//   • VietQR (chuyển khoản ngân hàng) — ảnh QR img.vietqr.io, chủ game đối soát thủ công ở /admin
// Khoá đọc từ biến môi trường. Chế độ mỗi cổng: 'live' (PAY_ENV=production + có khoá) · 'sandbox' (có khoá, máy chủ test của cổng)
// · 'sim' (không có khoá hoặc PAY_MODE=sim): trang giả lập nội bộ /pay/sim/:id ký IPN bằng khoá giả lập → đi đúng đường xác thực chữ ký.
// KHÔNG nhận/lưu số thẻ: người mua nhập thẻ/ví ở trang của cổng.
const crypto = require('crypto');
const env = process.env;
const hmac = (alg, key, s) => crypto.createHmac(alg, key).update(s, 'utf8').digest('hex');
const safeEq = (a, b) => { const A = Buffer.from(String(a || '')), B = Buffer.from(String(b || '')); return A.length === B.length && A.length > 0 && crypto.timingSafeEqual(A, B); };
const simKey = () => 'sim_' + crypto.randomBytes(16).toString('hex');   // khoá giả lập: sinh mới mỗi lần chạy, không bao giờ dùng thật
const live = () => env.PAY_ENV === 'production';
const forceSim = () => env.PAY_MODE === 'sim';
const vnTime = (t = Date.now()) => new Date(t + 7 * 36e5).toISOString().replace(/[-:T]/g, '').slice(0, 14);   // yyyyMMddHHmmss giờ VN

// ---------- MoMo ----------
const momo = {
  id: 'momo', name: 'Ví MoMo', icon: '🟣',
  cfg() { const k = { partnerCode: env.MOMO_PARTNER_CODE, accessKey: env.MOMO_ACCESS_KEY, secretKey: env.MOMO_SECRET_KEY }; return k.partnerCode && k.accessKey && k.secretKey && !forceSim() ? k : (this._sim = this._sim || { partnerCode: 'MOMOSIM', accessKey: simKey(), secretKey: simKey(), sim: true }); },
  mode() { const c = this.cfg(); return c.sim ? 'sim' : live() ? 'live' : 'sandbox'; },
  host() { return live() ? 'https://payment.momo.vn' : 'https://test-payment.momo.vn'; },
  createRaw: p => `accessKey=${p.accessKey}&amount=${p.amount}&extraData=${p.extraData}&ipnUrl=${p.ipnUrl}&orderId=${p.orderId}&orderInfo=${p.orderInfo}&partnerCode=${p.partnerCode}&redirectUrl=${p.redirectUrl}&requestId=${p.requestId}&requestType=${p.requestType}`,
  ipnRaw: (b, accessKey) => `accessKey=${accessKey}&amount=${b.amount}&extraData=${b.extraData}&message=${b.message}&orderId=${b.orderId}&orderInfo=${b.orderInfo}&orderType=${b.orderType}&partnerCode=${b.partnerCode}&payType=${b.payType}&requestId=${b.requestId}&responseTime=${b.responseTime}&resultCode=${b.resultCode}&transId=${b.transId}`,
  async create(order, urls) {
    const c = this.cfg();
    const p = { partnerCode: c.partnerCode, accessKey: c.accessKey, requestId: order.id, amount: order.amount, orderId: order.id, orderInfo: order.info, redirectUrl: urls.ret('momo'), ipnUrl: urls.ipn('momo'), requestType: env.MOMO_REQUEST_TYPE || 'payWithMethod', extraData: '' };
    p.signature = hmac('sha256', c.secretKey, this.createRaw(p));
    if (c.sim) return { payUrl: urls.sim(order) };
    const r = await fetch(this.host() + '/v2/gateway/api/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ lang: 'vi' }, p)) }).then(r => r.json());
    if (r.resultCode !== 0 || !r.payUrl) throw new Error('MoMo: ' + (r.message || r.resultCode));
    return { payUrl: r.payUrl, qr: r.qrCodeUrl || null };
  },
  // IPN (POST JSON): trả { ok, orderId, amount, txn, paid } hoặc { bad:true } khi sai chữ ký
  verify(b) {
    const c = this.cfg(); if (!b || !b.signature) return { bad: true };
    if (b.partnerCode !== c.partnerCode || !safeEq(hmac('sha256', c.secretKey, this.ipnRaw(b, c.accessKey)), b.signature)) return { bad: true };
    return { ok: true, orderId: String(b.orderId), amount: +b.amount, txn: String(b.transId), paid: +b.resultCode === 0 };
  },
  simIpn(order, paid) {   // bản IPN y như MoMo gửi, ký bằng khoá giả lập
    const c = this.cfg(), b = { partnerCode: c.partnerCode, orderId: order.id, requestId: order.id, amount: order.amount, orderInfo: order.info, orderType: 'momo_wallet', transId: String(Date.now()), resultCode: paid ? 0 : 1006, message: paid ? 'Successful.' : 'Transaction denied by user.', payType: 'qr', responseTime: Date.now(), extraData: '' };
    b.signature = hmac('sha256', c.secretKey, this.ipnRaw(b, c.accessKey)); return b;
  },
};

// ---------- ZaloPay ----------
const zalopay = {
  id: 'zalopay', name: 'ZaloPay', icon: '🔵',
  cfg() { const k = { appId: env.ZALOPAY_APP_ID, key1: env.ZALOPAY_KEY1, key2: env.ZALOPAY_KEY2 }; return k.appId && k.key1 && k.key2 && !forceSim() ? k : (this._sim = this._sim || { appId: '2553', key1: simKey(), key2: simKey(), sim: true }); },
  mode() { const c = this.cfg(); return c.sim ? 'sim' : live() ? 'live' : 'sandbox'; },
  host() { return live() ? 'https://openapi.zalopay.vn' : 'https://sb-openapi.zalopay.vn'; },
  transId: order => vnTime(order.created).slice(2, 8) + '_' + order.id,   // yymmdd_xxx theo quy định ZaloPay
  async create(order, urls) {
    const c = this.cfg(), p = { app_id: +c.appId, app_user: 'ph_' + order.pid.slice(0, 8), app_trans_id: this.transId(order), app_time: Date.now(), amount: order.amount,
      item: JSON.stringify([{ itemid: order.plan, itemname: order.info, itemprice: order.amount, itemquantity: 1 }]), embed_data: JSON.stringify({ redirecturl: urls.ret('zalopay'), preferred_payment_method: [] }),
      description: `Truong Rubik - ${order.info} #${order.id}`, bank_code: '', callback_url: urls.ipn('zalopay') };
    p.mac = hmac('sha256', c.key1, [p.app_id, p.app_trans_id, p.app_user, p.amount, p.app_time, p.embed_data, p.item].join('|'));
    if (c.sim) return { payUrl: urls.sim(order) };
    const r = await fetch(this.host() + '/v2/create', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(p).toString() }).then(r => r.json());
    if (r.return_code !== 1 || !r.order_url) throw new Error('ZaloPay: ' + (r.sub_return_message || r.return_message));
    return { payUrl: r.order_url, qr: r.qr_code || null };
  },
  verify(b) {   // callback POST JSON { data: "<json>", mac, type }
    const c = this.cfg(); if (!b || typeof b.data !== 'string' || !b.mac || !safeEq(hmac('sha256', c.key2, b.data), b.mac)) return { bad: true };
    let d; try { d = JSON.parse(b.data); } catch (e) { return { bad: true }; }
    return { ok: true, orderId: String(d.app_trans_id || '').split('_').slice(1).join('_'), amount: +d.amount, txn: String(d.zp_trans_id), paid: true };   // ZaloPay chỉ gọi callback khi đã thanh toán thành công
  },
  simIpn(order) { const c = this.cfg(), data = JSON.stringify({ app_id: +c.appId, app_trans_id: this.transId(order), app_time: order.created, app_user: 'ph_' + order.pid.slice(0, 8), amount: order.amount, embed_data: '{}', item: '[]', zp_trans_id: Date.now(), server_time: Date.now(), channel: 38, merchant_user_id: '', user_fee_amount: 0, discount_amount: 0 }); return { data, mac: hmac('sha256', c.key2, data), type: 1 }; },
};

// ---------- VNPay ----------
const vnEnc = s => encodeURIComponent(String(s)).replace(/%20/g, '+');   // giống mẫu Node.js chính thức của VNPay (sortObject + qs encode:false)
const vnSign = (params, secret) => hmac('sha512', secret, Object.keys(params).filter(k => k !== 'vnp_SecureHash' && k !== 'vnp_SecureHashType' && params[k] !== '' && params[k] != null).sort().map(k => vnEnc(k) + '=' + vnEnc(params[k])).join('&'));
const vnpay = {
  id: 'vnpay', name: 'VNPay (QR · thẻ ATM · Visa)', icon: '🔴',
  cfg() { const k = { tmn: env.VNPAY_TMN_CODE, secret: env.VNPAY_HASH_SECRET }; return k.tmn && k.secret && !forceSim() ? k : (this._sim = this._sim || { tmn: 'VNPSIM01', secret: simKey(), sim: true }); },
  mode() { const c = this.cfg(); return c.sim ? 'sim' : live() ? 'live' : 'sandbox'; },
  host() { return env.VNPAY_URL || (live() ? 'https://pay.vnpay.vn/vpcpay.html' : 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'); },
  async create(order, urls, ip) {
    const c = this.cfg(), p = { vnp_Version: '2.1.0', vnp_Command: 'pay', vnp_TmnCode: c.tmn, vnp_Amount: order.amount * 100, vnp_CurrCode: 'VND', vnp_TxnRef: order.id, vnp_OrderInfo: `Thanh toan ${order.info} ${order.id}`,
      vnp_OrderType: 'other', vnp_Locale: 'vn', vnp_ReturnUrl: urls.ret('vnpay'), vnp_IpAddr: (ip || '127.0.0.1').replace(/^::ffff:/, ''), vnp_CreateDate: vnTime(order.created), vnp_ExpireDate: vnTime(order.created + 15 * 60e3) };
    if (c.sim) return { payUrl: urls.sim(order) };
    const q = Object.keys(p).sort().map(k => vnEnc(k) + '=' + vnEnc(p[k])).join('&');
    return { payUrl: this.host() + '?' + q + '&vnp_SecureHash=' + vnSign(p, c.secret) };
  },
  verify(q) {   // IPN: GET ?vnp_...&vnp_SecureHash=
    const c = this.cfg(); if (!q || !q.vnp_SecureHash) return { bad: true };
    const p = {}; for (const [k, v] of Object.entries(q)) if (k.startsWith('vnp_')) p[k] = v;
    if (p.vnp_TmnCode !== c.tmn || !safeEq(vnSign(p, c.secret), String(q.vnp_SecureHash).toLowerCase())) return { bad: true };
    return { ok: true, orderId: String(p.vnp_TxnRef), amount: Math.round(+p.vnp_Amount / 100), txn: String(p.vnp_TransactionNo), paid: p.vnp_ResponseCode === '00' && p.vnp_TransactionStatus === '00' };
  },
  simIpn(order, paid) { const c = this.cfg(), p = { vnp_TmnCode: c.tmn, vnp_Amount: String(order.amount * 100), vnp_BankCode: 'NCB', vnp_CardType: 'ATM', vnp_OrderInfo: `Thanh toan ${order.info} ${order.id}`, vnp_PayDate: vnTime(), vnp_ResponseCode: paid ? '00' : '24', vnp_TransactionNo: String(Date.now()).slice(-8), vnp_TransactionStatus: paid ? '00' : '02', vnp_TxnRef: order.id }; p.vnp_SecureHash = vnSign(p, c.secret); return p; },
};

// ---------- Chuyển khoản ngân hàng VietQR (đối soát thủ công) ----------
const bank = {
  id: 'bank', name: 'Chuyển khoản ngân hàng (VietQR)', icon: '🏦',
  cfg() { return { bin: env.VIETQR_BANK_BIN || '970436', acc: env.VIETQR_ACCOUNT_NO || '0000000000', accName: env.VIETQR_ACCOUNT_NAME || 'TAI KHOAN DEMO', bankName: env.VIETQR_BANK_NAME || 'Vietcombank', sim: !env.VIETQR_ACCOUNT_NO } },
  mode() { return this.cfg().sim ? 'sim' : 'live'; },
  async create(order) {
    const c = this.cfg(), memo = 'RUBIK ' + order.transfer;
    return { bank: { qr: `https://img.vietqr.io/image/${c.bin}-${c.acc}-compact2.png?amount=${order.amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(c.accName)}`, acc: c.acc, accName: c.accName, bankName: c.bankName, memo, amount: order.amount, demo: c.sim } };
  },
};

const GATEWAYS = { momo, zalopay, vnpay, bank };
module.exports = { GATEWAYS, hmac, vnSign, safeEq };
