// tools/parent-flow-test.mjs — Kiểm thử trọn luồng Gói Phụ huynh ở CHẾ ĐỘ GIẢ LẬP (không cần khoá cổng thanh toán).
// Chạy: DATA_DIR=/tmp/rubik-test PORT=3311 ADMIN_KEY=TESTKEY node server/index.js &   rồi   node tools/parent-flow-test.mjs [--url=http://localhost:3311] [--shots=thu/muc]
// Kiểm tra: con đăng ký → con làm câu hỏi (socket 'learn') → phụ huynh đăng ký → liên kết bằng mã → dùng thử → mua gói (MoMo, ZaloPay, VNPay giả lập
// + chuyển khoản VietQR chủ game xác nhận) → IPN thành công → con mở khoá (/api/me + sự kiện 'plan') → báo cáo tuần có số liệu;
// IPN chữ ký sai / sai số tiền bị từ chối; phụ huynh khác KHÔNG xem được dữ liệu của con; xoá tài khoản con. --shots: ảnh trang phụ huynh (máy tính + điện thoại).
import { createRequire } from 'module';
import crypto from 'crypto';
const require = createRequire(import.meta.url);
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const B = arg('url') || 'http://localhost:3311', SHOTS = arg('shots'), ADMIN = process.env.ADMIN_KEY || 'TESTKEY';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✅', m); } else { fail++; console.log('  ❌', m); } };
const j = async (path, { body, method, tok, admin, headers } = {}) => {
  const r = await fetch(B + path, { method: method || (body ? 'POST' : 'GET'), redirect: 'manual', headers: Object.assign({ 'Content-Type': 'application/json' }, tok ? { Authorization: 'Bearer ' + tok } : {}, admin ? { 'x-admin-key': admin } : {}, headers || {}), body: body ? JSON.stringify(body) : undefined });
  const t = await r.text(); let d; try { d = JSON.parse(t); } catch (e) { d = { text: t }; } return Object.assign(d || {}, { status: r.status, location: r.headers.get('location') });
};
const sfx = crypto.randomBytes(2).toString('hex');
console.log('1) Học sinh tạo tài khoản & học');
const kid = await j('/api/auth/register', { body: { name: 'Bé Na ' + sfx, pass: 'na123456' } });
ok(kid.token && kid.user.plan && kid.user.plan.on === false, 'con có tài khoản, đang ở gói miễn phí');
const kid2 = await j('/api/auth/register', { body: { name: 'Bé Bin ' + sfx, pass: 'bin12345' } });
// câu trả lời qua socket.io (dùng client của chính server trong Chromium để giống game thật)
const { chromium, devices } = require('playwright');
const browser = await chromium.launch();
const pg = await browser.newPage(); await pg.goto(B + '/api/health');
const learned = await pg.evaluate(async ({ B, tok }) => {
  await new Promise((res, rej) => { const s = document.createElement('script'); s.src = B + '/socket.io/socket.io.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  const so = io(B + '/island', { auth: { token: tok }, transports: ['websocket'] }); window.__so = so; window.__plans = [];
  so.on('plan', p => window.__plans.push(p));
  await new Promise(r => so.on('connect', r)); so.emit('join', { hue: 120 }); await new Promise(r => so.on('hello', r));
  const Q = [['Toán', 1, 'Bảng nhân 7'], ['Toán', 1, 'Bảng nhân 7'], ['Toán', 0, 'Phân số'], ['Toán', 0, 'Phân số'], ['Toán', 0, 'Phân số'], ['Tiếng Anh', 1], ['Tiếng Anh', 1], ['Tiếng Anh', 0], ['Biển', 1], ['Biển', 1], ['Học viện', 0], ['Tiếng Việt', 1], ['Tiếng Việt', 1], ['lsdl', 0], ['Lịch sử', 1]];
  for (const [s, okk, t] of Q) { so.emit('learn', { s, ok: !!okk, t }); await new Promise(r => setTimeout(r, 650)); }
  return Q.length;
}, { B, tok: kid.token });
ok(learned === 15, 'con trả lời 15 câu (5 môn)');

console.log('2) Phụ huynh đăng ký & liên kết');
ok((await j('/api/family/register', { body: { login: 'me.na' + sfx + '@example.com', pass: 'matkhau123' } })).status === 400, 'thiếu xác nhận người lớn/đồng ý → từ chối');
const par = await j('/api/family/register', { body: { login: 'me.na' + sfx + '@example.com', pass: 'matkhau123', name: 'Mẹ Na', adult: true, consent: true } });
ok(par.token, 'phụ huynh có tài khoản');
const other = await j('/api/family/register', { body: { login: '09' + String(Date.now()).slice(-8), pass: 'khac12345', adult: true, consent: true } });
const code = await j('/api/link-code', { body: {}, tok: kid.token });
ok(/^[A-Z0-9]{6}$/.test(code.code), 'con tạo mã liên kết ' + code.code);
ok((await j('/api/family/link', { body: { code: code.code }, tok: par.token })).status === 400, 'liên kết thiếu đồng ý của phụ huynh → từ chối');
ok((await j('/api/family/link', { body: { code: 'ZZZZZZ', consent: true }, tok: par.token })).status === 404, 'mã sai → từ chối');
const link = await j('/api/family/link', { body: { code: code.code, consent: true }, tok: par.token });
ok(link.trial && link.me.kids[0].plan.on && link.me.kids[0].plan.kind === 'trial', 'liên kết xong → con được dùng thử 7 ngày');
const uid = link.me.kids[0].uid;
ok((await j('/api/family/link', { body: { code: code.code, consent: true }, tok: other.token })).status === 404, 'mã đã dùng không dùng lại được');

console.log('3) Bảo vệ dữ liệu');
ok((await j(`/api/family/kids/${uid}/report`, { tok: other.token })).status === 404, 'phụ huynh khác KHÔNG xem được báo cáo của con');
ok((await j(`/api/family/kids/${uid}/limit`, { body: { limitMin: 1 }, tok: other.token })).status === 404, 'phụ huynh khác KHÔNG đổi được giới hạn giờ');
ok((await j(`/api/family/kids/${uid}/delete`, { body: { pass: 'khac12345' }, tok: other.token })).status === 404, 'phụ huynh khác KHÔNG xoá được tài khoản con');
ok((await j(`/api/family/kids/${kid2.user.id}/report`, { tok: par.token })).status === 404, 'phụ huynh không xem được bé chưa liên kết');
ok((await j('/api/family/me')).status === 401, 'không đăng nhập → 401');
const oMe = await j('/api/family/me', { tok: other.token }); ok(oMe.me.kids.length === 0 && !JSON.stringify(oMe).includes('Bé Na'), '/me của phụ huynh khác không chứa tên con');
ok((await j('/api/admin/summary', { admin: 'SAI' })).status === 401, '/admin sai mã → 401');

console.log('4) Hết dùng thử → khoá; mua gói qua cổng giả lập');
// tua nhanh: đặt hết hạn dùng thử bằng API chủ game không có → mô phỏng bằng giấy phép? dùng cách thật: liên kết con thứ 2 không trial, thử báo cáo
const code2 = await j('/api/link-code', { body: {}, tok: kid2.token });
await j('/api/family/link', { body: { code: code2.code, consent: true }, tok: other.token });
for (const gw of ['momo', 'zalopay', 'vnpay']) {
  const co = await j('/api/family/checkout', { body: { plan: 'month', gateway: gw }, tok: other.token });
  ok(co.order && co.order.status === 'pending' && /\/pay\/sim\//.test(co.payUrl || ''), `${gw}: tạo đơn ${co.order && co.order.id}, chuyển tới cổng giả lập`);
  const sim = await fetch(co.payUrl).then(r => r.text()); ok(sim.includes('GIẢ LẬP'), `${gw}: trang cổng giả lập hiện`);
  const post = await fetch(co.payUrl, { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: gw === 'vnpay' ? 'r=fail' : 'r=ok' });
  const ord = await j('/api/family/orders/' + co.order.id, { tok: other.token });
  if (gw === 'vnpay') ok(ord.order.status === 'failed', 'vnpay: người dùng huỷ → đơn thất bại, chưa mở gói'); else ok(ord.order.status === 'paid' && post.status === 302, `${gw}: IPN có chữ ký hợp lệ → đơn ĐÃ THANH TOÁN`);
}
console.log('5) IPN giả mạo bị từ chối');
const co = await j('/api/family/checkout', { body: { plan: 'family', gateway: 'momo' }, tok: par.token });
const fakeMomo = { partnerCode: 'MOMOSIM', orderId: co.order.id, requestId: co.order.id, amount: co.order.amount, orderInfo: 'x', orderType: 'momo_wallet', transId: '1', resultCode: 0, message: 'ok', payType: 'qr', responseTime: Date.now(), extraData: '', signature: 'a'.repeat(64) };
ok((await j('/pay/ipn/momo', { body: fakeMomo })).status === 400, 'MoMo: chữ ký sai → 400');
ok((await j('/pay/ipn/zalopay', { body: { data: JSON.stringify({ app_trans_id: '261119_' + co.order.id, amount: co.order.amount, zp_trans_id: 1 }), mac: 'b'.repeat(64) } })).return_code === -1, 'ZaloPay: mac sai → return_code -1');
ok((await j('/pay/ipn/vnpay?' + new URLSearchParams({ vnp_TmnCode: 'VNPSIM01', vnp_TxnRef: co.order.id, vnp_Amount: co.order.amount * 100, vnp_ResponseCode: '00', vnp_TransactionStatus: '00', vnp_SecureHash: 'c'.repeat(128) }))).RspCode === '97', 'VNPay: checksum sai → RspCode 97');
ok((await j('/api/family/orders/' + co.order.id, { tok: par.token })).order.status === 'pending', 'đơn vẫn chờ (không bị kích hoạt bởi IPN giả)');
console.log('6) Thanh toán thật (giả lập) gói gia đình → con mở khoá');
await fetch(co.payUrl, { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'r=ok' });
const paid = await j('/api/family/orders/' + co.order.id, { tok: par.token });
ok(paid.order.status === 'paid' && paid.me.kids[0].plan.kind === 'paid', 'đơn gia đình đã thanh toán, con chuyển sang ⭐ Gói Phụ huynh');
const me = await j('/api/me', { tok: kid.token }); ok(me.user.plan.on && me.user.plan.kind === 'paid', 'con: /api/me báo đã mở khoá');
await new Promise(r => setTimeout(r, 300));
const pushed = await pg.evaluate(() => window.__plans.map(p => p.kind)); ok(pushed.includes('trial') && pushed.includes('paid'), 'con nhận sự kiện socket "plan" (dùng thử → trả phí) ngay trong game');
console.log('7) Chuyển khoản VietQR + chủ game đối soát');
const bk = await j('/api/admin/coupons', { body: { code: 'TET' + sfx.toUpperCase(), pct: 21, max: 5 }, admin: ADMIN });
const q = await j('/api/family/quote', { body: { plan: 'year', coupon: 'TET' + sfx }, tok: par.token }); ok(q.amount === Math.round(499000 * 0.79), 'mã giảm giá 21% → ' + q.amount + 'đ');
const ck = await j('/api/family/checkout', { body: { plan: 'year', gateway: 'bank', coupon: 'TET' + sfx }, tok: par.token });
ok(ck.bank && ck.bank.qr.includes('img.vietqr.io') && ck.bank.memo.startsWith('RUBIK '), 'VietQR: có ảnh QR + nội dung ' + (ck.bank && ck.bank.memo));
const sum = await j('/api/admin/summary', { admin: ADMIN }); ok(sum.pending.some(o => o.id === ck.order.id), '/admin thấy đơn chờ đối soát');
await j(`/api/admin/orders/${ck.order.id}/confirm`, { body: { ref: 'FT123' }, admin: ADMIN });
const after = await j('/api/family/me', { tok: par.token }); ok(after.me.orders.find(o => o.id === ck.order.id).status === 'paid' && after.me.sub.until > Date.now() + 390 * 864e5, 'chủ game xác nhận → gia hạn cộng dồn (> 390 ngày)');
const sum2 = await j('/api/admin/summary', { admin: ADMIN }); ok(sum2.revenue >= 79000 * 2 + 799000 + q.amount && sum2.outbox.some(m => /Biên nhận/.test(m.subject)), `doanh thu ${sum2.revenue}đ, biên nhận nằm trong hộp thư`);
console.log('8) Báo cáo tuần');
const rep = await j(`/api/family/kids/${uid}/report`, { tok: par.token });
const R = rep.report; ok(R && R.total.n === 15, `báo cáo: ${R && R.total.n} câu, đúng ${R && R.total.ok}`);
ok(R && ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Khoa học', 'Sử–Địa'].every(s => R.subjects.find(x => x.subject === s).n > 0), 'đủ 5 môn có số liệu');
ok(R && R.weak.some(w => /Phân số/.test(w.topic)), 'chủ đề yếu: ' + (R && R.weak.map(w => w.topic).join(', ')));
const lim = await j(`/api/family/kids/${uid}/limit`, { body: { limitMin: 55 }, tok: par.token }); ok(lim.me.kids[0].limitMin === 55, 'đặt giới hạn 55 phút/ngày');
const tk = await j(`/api/family/kids/${uid}/tasks`, { body: { title: 'Luyện phân số', subject: 'Toán', kind: 'ok', n: 8 }, tok: par.token }); ok(tk.me.kids[0].tasks.length === 1, 'giao nhiệm vụ học');
const kt = await j('/api/tasks', { tok: kid.token }); ok(kt.tasks.some(t => t.cls.includes('Bố mẹ')), 'con thấy nhiệm vụ bố mẹ giao trong game');

if (SHOTS) {
  console.log('9) Ảnh trang phụ huynh');
  const fs = require('fs'); fs.mkdirSync(SHOTS, { recursive: true });
  for (const [nm, opt] of [['desktop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 }], ['mobile', devices['iPhone 13']]]) {
    const c = await browser.newContext(opt); const p = await c.newPage();
    await p.goto(B + '/parent'); await p.screenshot({ path: `${SHOTS}/parent-login-${nm}.png`, fullPage: nm === 'mobile' });
    await p.evaluate(t => localStorage.setItem('rubik.parentToken', t), par.token); await p.goto(B + '/parent?v=1#order=' + co.order.id);
    await p.waitForSelector('canvas#c2'); await p.waitForTimeout(1800);
    await p.screenshot({ path: `${SHOTS}/parent-dashboard-${nm}.png`, fullPage: true });
    await p.click('[data-p="year"]'); await p.waitForTimeout(300); await p.screenshot({ path: `${SHOTS}/parent-checkout-${nm}.png` });
    await c.close();
  }
  const c = await browser.newContext({ viewport: { width: 1280, height: 800 } }); const p = await c.newPage(); await p.goto(B + '/admin'); await p.fill('#key', ADMIN); await p.click('#bKey'); await p.waitForTimeout(1500); await p.screenshot({ path: `${SHOTS}/admin-desktop.png`, fullPage: true }); await c.close();
  const s = await browser.newContext({ viewport: { width: 1280, height: 800 } }); const q2 = await s.newPage(); const co2 = await j('/api/family/checkout', { body: { plan: 'month', gateway: 'zalopay' }, tok: other.token }); await q2.goto(co2.payUrl); await q2.screenshot({ path: `${SHOTS}/pay-sim.png` }); await s.close();
}
console.log('10) Xoá tài khoản & dữ liệu của con');
ok((await j(`/api/family/kids/${uid}/delete`, { body: { pass: 'sai' }, tok: par.token })).status === 401, 'sai mật khẩu phụ huynh → không xoá');
const del = await j(`/api/family/kids/${uid}/delete`, { body: { pass: 'matkhau123' }, tok: par.token });
ok(del.me && del.me.kids.length === 0 && (await j('/api/me', { tok: kid.token })).status === 401, 'đã xoá tài khoản con, phiên đăng nhập của con bị huỷ');
ok((await j('/api/auth/login', { body: { name: 'Bé Na ' + sfx, pass: 'na123456' } })).status === 404, 'tài khoản con không còn trên server');
await browser.close();
console.log(`\nKẾT QUẢ: ${pass} đạt, ${fail} lỗi`); process.exit(fail ? 1 : 0);
