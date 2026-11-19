// billing.js — GÓI PHỤ HUYNH + tài khoản phụ huynh + báo cáo học tập + chủ game (/admin).
// Mô hình: miễn phí = đảo, Trường Rubik, một phần mini game, chương 1–2; gói (tháng / năm / gia đình 2–4 con) mở toàn bộ.
// Dùng thử 7 ngày (mỗi con 1 lần, bắt đầu khi phụ huynh liên kết). Giá/ngày/số con cấu hình bằng biến môi trường (PRICE_MONTH…).
// An toàn trẻ em & Nghị định 13/2023: dữ liệu của con chỉ phụ huynh đã liên kết (bằng mã do con tạo, hết hạn 30 phút)
// mới xem được; ghi nhận sự đồng ý của phụ huynh (thời điểm, phiên bản chính sách); phụ huynh xoá được tài khoản & dữ liệu của con.
// Thanh toán chỉ trên trang phụ huynh (người lớn đăng nhập) — trong game không có nút mua, chỉ lời mời "nhờ bố mẹ".
const crypto = require('crypto');
const { GATEWAYS, safeEq } = require('./pay-gateways');
const env = process.env;
const POLICY_VER = '2026-11';
const DAY = 864e5;
const PLANS = {
  month: { id: 'month', name: 'Gói tháng', price: +env.PRICE_MONTH || 79000, days: +env.DAYS_MONTH || 30, seats: 1 },
  year: { id: 'year', name: 'Gói năm', price: +env.PRICE_YEAR || 499000, days: +env.DAYS_YEAR || 365, seats: 1 },
  family: { id: 'family', name: 'Gói gia đình (2–4 con)', price: +env.PRICE_FAMILY || 799000, days: +env.DAYS_FAMILY || 365, seats: +env.FAMILY_SEATS || 4 },
};
// 💎 gói kim cương hồng (đồ trang trí đặc biệt trong game): GEM_PACKS="số_kim_cương:giá_đồng,…" — giá tiền thật hiện rõ trước khi trả
const GEM_PACKS = (env.GEM_PACKS || '21:10000,55:22000,144:49000').split(',').map(s => s.split(':').map(Number)).filter(([g, p]) => g > 0 && p >= 1000).map(([gems, price]) => ({ id: 'gem-' + gems, gems, price }));
const TRIAL_DAYS = env.TRIAL_DAYS != null ? +env.TRIAL_DAYS : 7, MAX_KIDS = 4;
// nội dung miễn phí (client/js/island/premium.js đọc từ /api/me): mini game miễn phí & số chương cốt truyện miễn phí
const FREE = { chapters: +env.FREE_CHAPTERS || 2, mg: (env.FREE_MG || 'rubik,caro,fishing,fishing-boat,garden,library,reader-books,royal-library,quiz').split(',').map(s => s.trim()).filter(Boolean) };
const SUBJECTS = ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Khoa học', 'Sử–Địa'];
const fold = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
function subjectOf(raw) {   // gom tên môn tự do của các trò (VD "Biển", "Học viện", "Bảng nhân") về 5 môn của báo cáo
  const s = fold(raw);
  if (/tieng anh|english|\banh\b/.test(s)) return 'Tiếng Anh';
  if (/toan|so hoc|phep|nhan|chia|cong|tru|hinh hoc|phan so|math|tinh/.test(s)) return 'Toán';
  if (/tieng viet|van|chinh ta|doc hieu|tu vung|ngu phap|tho/.test(s)) return 'Tiếng Việt';
  if (/lich su|\bsu\b|dia|lsdl|ban do|quoc gia|thu do/.test(s)) return 'Sử–Địa';
  if (/khoa hoc|bien|sinh|vat ly|hoa|thien van|tu nhien|dien|mach|cay|dong vat|hoc vien|phep thuat|sao|trai dat/.test(s)) return 'Khoa học';
  return 'Khác';
}
const vnDay = t => new Date(t + 7 * 36e5).toISOString().slice(0, 10);
const weekStart = (off = 0) => { const v = new Date(Date.now() + 7 * 36e5); const dow = (v.getUTCDay() + 6) % 7; v.setUTCHours(0, 0, 0, 0); return v.getTime() - 7 * 36e5 - dow * DAY - off * 7 * DAY; };   // thứ Hai 00:00 giờ VN (UTC ms)
const money = n => Number(n).toLocaleString('vi-VN') + 'đ';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const clean = (s, n) => String(s || '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, n);

module.exports = function setupBilling(app, api, o) {
  const { db, express, rateLimit, ADMIN_KEY, user, save, hashPass, checkPass, rnd, sha, code6, deleteUser, push, usedMin, taskProgress } = o;
  // ---------- chỉ mục ----------
  const byLogin = new Map(), kidParents = new Map(), byLic = new Map();
  const linkKid = (pid, uid) => { if (!kidParents.has(uid)) kidParents.set(uid, new Set()); kidParents.get(uid).add(pid); };
  for (const p of db.all('parents')) { byLogin.set(p.login, p); for (const k of p.kids || []) linkKid(p.id, k); }
  for (const l of db.all('licenses')) byLic.set(l.code, l);
  const parent = id => db.get('parents', id);
  const normLogin = s => { s = String(s || '').trim().toLowerCase(); if (/^[^\s@]{1,64}@[^\s@]+\.[a-z]{2,}$/.test(s)) return s; const d = s.replace(/[\s.\-()]/g, '').replace(/^\+?84/, '0'); return /^0\d{9}$/.test(d) ? d : null; };
  const isEmail = s => s.includes('@');

  // ---------- quyền dùng gói của 1 học sinh ----------
  function entitlement(u) {
    const now = Date.now(), out = { on: false, kind: null, until: 0, free: FREE, trialDays: TRIAL_DAYS, linked: (kidParents.get(u.id) || new Set()).size };
    const best = (kind, until) => { if (until > now && until > out.until) Object.assign(out, { on: true, kind, until }); };
    best('gift', u.giftUntil || 0);
    if (u.license) { const l = db.get('licenses', u.license); if (l) best('school', l.until); }
    for (const pid of kidParents.get(u.id) || []) { const p = parent(pid), s = p && p.sub; if (s && s.until > now && (p.kids || []).indexOf(u.id) < (PLANS[s.plan] || PLANS.month).seats) best('paid', s.until); }
    if (!out.on) best('trial', u.trialUntil || 0);
    return out;
  }
  const notifyKid = uid => { const u = user(uid); if (u) push(uid, 'plan', entitlement(u)); };

  // ---------- email (nodemailer, SMTP_URL) · không cấu hình → hộp thư giả lập trong /admin ----------
  let mailer = null;
  if (env.SMTP_URL) { try { mailer = require('nodemailer').createTransport(env.SMTP_URL); } catch (e) { console.error('[mail] SMTP_URL lỗi:', e.message); } }
  const FROM = env.MAIL_FROM || 'Trường Rubik <no-reply@truongrubik.vn>';
  async function mail(to, subject, html) {
    if (!to || !isEmail(to)) return false;   // phụ huynh đăng ký bằng SĐT: chỉ nhắn qua Zalo OA khi đã cấu hình
    const body = `<div style="font:16px/1.618 system-ui,sans-serif;color:#2e2418;max-width:610px;margin:auto"><div style="background:#1b1626;color:#fff;padding:13px 21px;border-radius:13px 13px 0 0;font-weight:800">🏫 Trường Rubik · Phụ huynh</div><div style="background:#fff;padding:21px;border:1px solid #e6dccb;border-top:0;border-radius:0 0 13px 13px">${html}</div><p style="font-size:13px;color:#7a6a58">Email tự động — không trả lời. Tắt email tóm tắt tuần trong trang Phụ huynh.</p></div>`;
    if (mailer) { try { await mailer.sendMail({ from: FROM, to, subject, html: body }); return true; } catch (e) { console.error('[mail] gửi lỗi:', e.message); return false; } }
    const id = rnd(6); db.put('outbox', id, { id, at: Date.now(), to, subject, html: body });
    const all = db.all('outbox').sort((a, b) => b.at - a.at); for (const m of all.slice(55)) db.del('outbox', m.id);
    console.log(`[mail:giả lập] → ${to.replace(/^(.).*(@.*)$/, '$1***$2')}: ${subject}`); return true;
  }
  async function zalo(p, text) {   // Zalo OA: để sẵn chỗ nối (ZALO_OA_TOKEN + ZALO_OA_TEMPLATE); chưa cấu hình → bỏ qua
    if (!env.ZALO_OA_TOKEN || !p.zaloUid) return false;
    try { await fetch('https://openapi.zalo.me/v3.0/oa/message/cs', { method: 'POST', headers: { 'Content-Type': 'application/json', access_token: env.ZALO_OA_TOKEN }, body: JSON.stringify({ recipient: { user_id: p.zaloUid }, message: { text: text.slice(0, 2000) } }) }); return true; } catch (e) { return false; }
  }

  // ---------- phụ huynh: đăng ký / đăng nhập ----------
  const fam = express.Router();
  fam.use(express.json({ limit: '20kb' }));
  const authLimit = rateLimit({ windowMs: 15 * 60e3, limit: 34, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Thử quá nhiều lần, vui lòng đợi vài phút.' } });
  const wrap = f => (req, res) => Promise.resolve(f(req, res)).catch(e => { console.error('[family]', e); res.status(500).json({ error: 'Lỗi máy chủ.' }); });
  const newSession = p => { const tok = rnd(32), h = sha(tok); db.put('psessions', h, { h, pid: p.id, exp: Date.now() + 30 * DAY }); return tok; };
  const pauth = (req, res, next) => {
    const tok = (req.headers.authorization || '').replace(/^Bearer\s+/i, ''), s = tok && db.get('psessions', sha(tok));
    if (!s || s.exp < Date.now()) { if (s) db.del('psessions', sha(tok)); return res.status(401).json({ error: 'Cần đăng nhập phụ huynh.' }); }
    const p = parent(s.pid); if (!p) return res.status(401).json({ error: 'Cần đăng nhập phụ huynh.' }); req.parent = p; next();
  };
  const kidOf = (req, res) => { const p = req.parent, uid = String(req.params.uid || ''); if (!(p.kids || []).includes(uid) || !user(uid)) { res.status(404).json({ error: 'Không thấy tài khoản của con.' }); return null; } return user(uid); };
  const plansPub = () => Object.values(PLANS).map(p => ({ id: p.id, name: p.name, price: p.price, days: p.days, seats: p.seats }));
  const gwPub = () => Object.values(GATEWAYS).map(g => ({ id: g.id, name: g.name, icon: g.icon, mode: g.mode() }));
  const kidRow = (p, u) => ({ uid: u.id, name: u.name, plan: entitlement(u), seat: (p.kids || []).indexOf(u.id), todayMin: usedMin(u), limitMin: u.limitMin || 0, level: u.progress && u.progress.profile ? u.progress.profile.level || 1 : 1, last: (u.stats && u.stats.last) || 0, tasks: (u.ptasks || []).map(t => Object.assign({}, t, { done: taskProgress(u, t) })) });
  const meOut = p => ({ id: p.id, login: p.login, name: p.name, email: isEmail(p.login) ? p.login : p.email || '', notify: p.notify || { weekly: true }, sub: p.sub || null, created: p.created,
    kids: (p.kids || []).map(user).filter(Boolean).map(u => kidRow(p, u)), plans: plansPub(), gateways: gwPub(), trialDays: TRIAL_DAYS, maxKids: MAX_KIDS,
    orders: db.all('orders').filter(x => x.pid === p.id).sort((a, b) => b.created - a.created).slice(0, 21).map(orderPub) });

  fam.get('/config', (req, res) => res.json({ plans: plansPub(), gateways: gwPub(), trialDays: TRIAL_DAYS, policy: POLICY_VER, free: FREE }));
  fam.post('/register', authLimit, wrap(async (req, res) => {
    const b = req.body || {}, login = normLogin(b.login), pass = String(b.pass || '');
    if (!login) return res.status(400).json({ error: 'Nhập email hoặc số điện thoại (10 số) hợp lệ.' });
    if (pass.length < 8 || pass.length > 72) return res.status(400).json({ error: 'Mật khẩu cần 8–72 ký tự.' });
    if (!b.adult || !b.consent) return res.status(400).json({ error: 'Vui lòng xác nhận bạn là người lớn (≥ 18 tuổi) và đồng ý Chính sách bảo mật & Điều khoản.' });
    if (byLogin.has(login)) return res.status(409).json({ error: 'Email/SĐT này đã có tài khoản phụ huynh. Hãy đăng nhập.' });
    const p = { id: rnd(8), login, name: clean(b.name, 40), hash: await hashPass(pass), created: Date.now(), kids: [], sub: null, notify: { weekly: true }, consent: { at: Date.now(), ver: POLICY_VER, terms: true } };
    byLogin.set(login, p); db.put('parents', p.id, p);
    mail(isEmail(login) ? login : '', 'Chào mừng đến Trường Rubik', `<p>Xin chào${p.name ? ' ' + esc(p.name) : ''},</p><p>Tài khoản phụ huynh đã sẵn sàng. Bước tiếp theo: trong game, con bấm <b>👤 → 👪 Mã liên kết phụ huynh</b> rồi đọc 6 ký tự cho bạn nhập ở trang Phụ huynh.</p><p>Mỗi con được <b>dùng thử miễn phí ${TRIAL_DAYS} ngày</b> toàn bộ nội dung sau khi liên kết.</p>`);
    res.json({ token: newSession(p), me: meOut(p) });
  }));
  const fails = new Map();
  fam.post('/login', authLimit, wrap(async (req, res) => {
    const b = req.body || {}, p = byLogin.get(normLogin(b.login) || '');
    const f = p && fails.get(p.id); if (f && f.n >= 8 && Date.now() - f.t < 15 * 60e3) return res.status(429).json({ error: 'Sai nhiều lần, vui lòng đợi 15 phút.' });
    if (!p || !(await checkPass(String(b.pass || ''), p.hash))) { if (p) fails.set(p.id, { n: (f ? f.n : 0) + 1, t: Date.now() }); return res.status(401).json({ error: 'Sai email/SĐT hoặc mật khẩu.' }); }
    fails.delete(p.id); res.json({ token: newSession(p), me: meOut(p) });
  }));
  fam.post('/logout', (req, res) => { const t = (req.headers.authorization || '').replace(/^Bearer\s+/i, ''); if (t) db.del('psessions', sha(t)); res.json({ ok: true }); });
  fam.get('/me', pauth, (req, res) => res.json({ me: meOut(req.parent) }));
  fam.post('/notify', pauth, (req, res) => { const p = req.parent, b = req.body || {}; p.notify = { weekly: !!b.weekly }; if (b.email !== undefined) { const e = normLogin(b.email); if (b.email && (!e || !isEmail(e))) return res.status(400).json({ error: 'Email chưa đúng.' }); p.email = e || ''; } db.put('parents', p.id, p); res.json({ me: meOut(p) }); });
  fam.delete('/me', pauth, wrap(async (req, res) => {   // xoá tài khoản phụ huynh (tuỳ chọn xoá luôn tài khoản các con)
    const p = req.parent, b = req.body || {}; if (!(await checkPass(String(b.pass || ''), p.hash))) return res.status(401).json({ error: 'Sai mật khẩu.' });
    for (const uid of p.kids || []) { const s = kidParents.get(uid); if (s) s.delete(p.id); const u = user(uid); if (b.kids && u) deleteUser(u); else notifyKid(uid); }
    for (const s of db.all('psessions')) if (s.pid === p.id) db.del('psessions', s.h);
    byLogin.delete(p.login); db.del('parents', p.id);
    for (const x of db.all('orders')) if (x.pid === p.id) { x.pid = 'deleted'; x.login = ''; db.put('orders', x.id, x); }   // giữ chứng từ kế toán, bỏ thông tin cá nhân
    res.json({ ok: true });
  }));

  // ---------- 💎 kim cương hồng: đơn tạo trong game SAU cổng phụ huynh, người lớn trả trên trang của cổng thanh toán ----------
  const gemLimit = rateLimit({ windowMs: 15 * 60e3, limit: 13, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Thử lại sau ít phút nhé.' } });
  api.get('/gems/packs', (req, res) => res.json({ packs: GEM_PACKS, gateways: gwPub() }));
  api.post('/gems/checkout', o.auth, gemLimit, wrap(async (req, res) => {
    const u = req.user, b = req.body || {}, P = GEM_PACKS.find(p => p.id === b.pack), G = GATEWAYS[b.gateway];
    if (!P || !G) return res.status(400).json({ error: 'Chọn gói kim cương và cách thanh toán.' });
    let transfer; do transfer = code6(); while (db.all('orders').some(x => x.transfer === transfer));
    const x = { id: 'G' + Date.now().toString(36).toUpperCase() + rnd(2).toUpperCase(), kind: 'gems', uid: u.id, pid: 'kid:' + u.id, login: u.name, plan: 'gems', gems: P.gems, base: P.price, amount: P.price, gateway: G.id, status: 'pending', created: Date.now(), transfer, info: `Kim cuong hong x${P.gems}` };
    const B = baseUrl(req), urls = { ret: gw => `${B}/pay/return/${gw}?order=${x.id}`, ipn: gw => `${B}/pay/ipn/${gw}`, sim: q => `${B}/pay/sim/${q.id}` };
    let r; try { r = await G.create(x, urls, req.ip); } catch (e) { console.error('[pay]', e.message); return res.status(502).json({ error: 'Cổng thanh toán đang bận, thử lại sau nhé.' }); }
    db.put('orders', x.id, x); res.json(Object.assign({ order: orderPub(x), mode: G.mode() }, r));
  }));
  api.get('/gems/orders/:id', o.auth, (req, res) => { const x = db.get('orders', req.params.id); if (!x || x.uid !== req.user.id) return res.status(404).json({ error: 'Không thấy đơn.' }); res.json({ order: orderPub(x), wallet: o.eco ? o.eco.out(o.eco.wallet(req.user)) : null }); });

  // ---------- liên kết con: con tạo mã trong game (hết hạn 30 phút), phụ huynh nhập + đồng ý ----------
  api.post('/link-code', o.auth, (req, res) => {
    const u = req.user; for (const c of db.all('linkcodes')) if (c.uid === u.id || c.exp < Date.now()) db.del('linkcodes', c.code);
    let code; do code = code6(); while (db.get('linkcodes', code));
    db.put('linkcodes', code, { code, uid: u.id, exp: Date.now() + 30 * 60e3 }); res.json({ code, exp: Date.now() + 30 * 60e3 });
  });
  fam.post('/link', pauth, (req, res) => {
    const p = req.parent, b = req.body || {}, c = db.get('linkcodes', String(b.code || '').trim().toUpperCase());
    if (!c || c.exp < Date.now()) return res.status(404).json({ error: 'Mã liên kết không đúng hoặc đã hết hạn (30 phút). Nhờ con tạo mã mới trong game: 👤 → 👪.' });
    if (!b.consent) return res.status(400).json({ error: 'Cần xác nhận bạn là cha/mẹ/người giám hộ và đồng ý cho con dùng dịch vụ.' });
    const u = user(c.uid); if (!u) return res.status(404).json({ error: 'Không thấy tài khoản.' });
    p.kids = p.kids || []; if (!p.kids.includes(u.id)) { if (p.kids.length >= MAX_KIDS) return res.status(400).json({ error: `Tối đa ${MAX_KIDS} con cho 1 tài khoản phụ huynh.` }); p.kids.push(u.id); }
    db.del('linkcodes', c.code); linkKid(p.id, u.id);
    let trial = false; if (!u.trialUntil && TRIAL_DAYS > 0) { u.trialUntil = Date.now() + TRIAL_DAYS * DAY; trial = true; }
    u.consent = { by: p.id, at: Date.now(), ver: POLICY_VER }; save(u); db.put('parents', p.id, p); notifyKid(u.id);
    res.json({ me: meOut(p), trial });
  });
  fam.delete('/kids/:uid', pauth, (req, res) => { const u = kidOf(req, res); if (!u) return; const p = req.parent; p.kids = p.kids.filter(x => x !== u.id); const s = kidParents.get(u.id); if (s) s.delete(p.id); db.put('parents', p.id, p); notifyKid(u.id); res.json({ me: meOut(p) }); });
  fam.post('/kids/:uid/delete', pauth, wrap(async (req, res) => {   // XOÁ tài khoản & toàn bộ dữ liệu của con (bắt buộc theo NĐ 13/2023)
    const u = kidOf(req, res); if (!u) return; const p = req.parent;
    if (!(await checkPass(String((req.body || {}).pass || ''), p.hash))) return res.status(401).json({ error: 'Sai mật khẩu phụ huynh.' });
    for (const pid of kidParents.get(u.id) || []) { const q = parent(pid); if (q) { q.kids = (q.kids || []).filter(x => x !== u.id); db.put('parents', q.id, q); } }
    kidParents.delete(u.id); for (const c of db.all('linkcodes')) if (c.uid === u.id) db.del('linkcodes', c.code);
    deleteUser(u); res.json({ me: meOut(p) });
  }));
  fam.post('/kids/:uid/limit', pauth, (req, res) => { const u = kidOf(req, res); if (!u) return; u.limitMin = Math.max(0, Math.min(600, Math.round(+(req.body || {}).limitMin) || 0)); save(u); push(u.id, 'limit', { limitMin: u.limitMin, usedMin: usedMin(u) }); res.json({ me: meOut(req.parent) }); });
  fam.post('/kids/:uid/tasks', pauth, (req, res) => {
    const u = kidOf(req, res); if (!u) return; const b = req.body || {};
    const t = { id: rnd(4), title: clean(b.title, 60) || 'Nhiệm vụ của bố mẹ', subject: SUBJECTS.includes(b.subject) ? b.subject : '*', kind: b.kind === 'ok' ? 'ok' : 'n', n: Math.max(1, Math.min(200, Math.round(+b.n) || 10)), at: Date.now(), by: 'parent' };
    u.ptasks = (u.ptasks || []).concat(t).slice(-13); save(u); push(u.id, 'toast', `👪 Bố mẹ giao nhiệm vụ mới: ${t.title}`); res.json({ me: meOut(req.parent) });
  });
  fam.delete('/kids/:uid/tasks/:tid', pauth, (req, res) => { const u = kidOf(req, res); if (!u) return; u.ptasks = (u.ptasks || []).filter(t => t.id !== req.params.tid); save(u); res.json({ me: meOut(req.parent) }); });

  // ---------- BÁO CÁO HỌC TẬP theo tuần ----------
  function report(u, off = 0) {
    const t0 = weekStart(off), days = [], s = u.stats || { days: {} }, bySub = Object.fromEntries([...SUBJECTS, 'Khác'].map(k => [k, [0, 0]])), topics = {};
    for (let i = 0; i < 7; i++) {
      const d = vnDay(t0 + i * DAY), v = (s.days || {})[d] || { ms: 0, n: 0, ok: 0, subj: {} };
      days.push({ d, min: Math.round(v.ms / 60000), n: v.n, ok: v.ok });
      for (const [raw, [n, ok]] of Object.entries(v.subj || {})) { const g = subjectOf(raw); bySub[g][0] += n; bySub[g][1] += ok; const k = fold(raw) === fold(g) ? g + ' (chung)' : g + ' · ' + raw; topics[k] = topics[k] || [0, 0]; topics[k][0] += n; topics[k][1] += ok; }
      for (const [raw, [n, ok]] of Object.entries(v.top || {})) { const k = subjectOf(raw.split('|')[0]) + ' · ' + raw.split('|').pop(); topics[k] = topics[k] || [0, 0]; topics[k][0] += n; topics[k][1] += ok; }
    }
    const tot = days.reduce((a, d) => ({ min: a.min + d.min, n: a.n + d.n, ok: a.ok + d.ok }), { min: 0, n: 0, ok: 0 });
    const weak = Object.entries(topics).filter(([, [n]]) => n >= 3).map(([k, [n, ok]]) => ({ topic: k, n, ok, pct: Math.round(ok / n * 100) })).filter(x => x.pct < 70).sort((a, b) => a.pct - b.pct).slice(0, 5);
    const pr = u.progress && u.progress.profile || {};
    const ach = [];
    if (pr.level) ach.push(`⭐ Cấp ${pr.level}`); if (pr.house && pr.house.id) ach.push(`🏠 Nhà ${({ long: 'Thanh Long', phung: 'Chu Phượng', lan: 'Kỳ Lân', quy: 'Huyền Quy' })[pr.house.id] || pr.house.id} · ${pr.house.pts | 0} điểm tuần`);
    const playDays = days.filter(d => d.min > 0).length; if (playDays >= 5) ach.push(`🔥 Học đều ${playDays}/7 ngày`);
    if (tot.n >= 21 && tot.ok / tot.n >= 0.8) ach.push('🎯 Trả lời đúng ≥ 80%');
    for (const t of u.ptasks || []) if (taskProgress(u, t) >= t.n) ach.push(`✅ Hoàn thành: ${t.title}`);
    if (u.ev && u.ev.pts) ach.push(`🎪 Sự kiện cuối tuần: ${u.ev.pts} điểm`);
    return { name: u.name, from: vnDay(t0), to: vnDay(t0 + 6 * DAY), days, total: tot, subjects: SUBJECTS.concat('Khác').map(k => ({ subject: k, n: bySub[k][0], ok: bySub[k][1] })).filter(x => x.subject !== 'Khác' || x.n), weak, achievements: ach, limitMin: u.limitMin || 0, plan: entitlement(u) };
  }
  fam.get('/kids/:uid/report', pauth, (req, res) => {
    const u = kidOf(req, res); if (!u) return; const e = entitlement(u);
    if (!e.on) return res.status(402).json({ error: 'Báo cáo học tập thuộc Gói Phụ huynh (hoặc trong thời gian dùng thử).', locked: true, preview: { name: u.name, todayMin: usedMin(u) } });
    res.json({ report: report(u, Math.max(0, Math.min(8, +req.query.week || 0))) });
  });
  const reportHtml = r => `<h2 style="margin:0 0 8px">📊 Tuần ${r.from.slice(8)}/${r.from.slice(5, 7)} – ${r.to.slice(8)}/${r.to.slice(5, 7)}: ${esc(r.name)}</h2>
    <p>⏱️ <b>${r.total.min} phút</b> chơi & học · ✏️ <b>${r.total.n} câu</b> (đúng ${r.total.ok}${r.total.n ? ', ' + Math.round(r.total.ok / r.total.n * 100) + '%' : ''})</p>
    <table style="border-collapse:collapse;width:100%;font-size:14px">${r.subjects.map(s => `<tr><td style="padding:5px 8px;border-bottom:1px solid #eee">${s.subject}</td><td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:right">${s.n} câu</td><td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:right">${s.n ? Math.round(s.ok / s.n * 100) + '% đúng' : '—'}</td></tr>`).join('')}</table>
    ${r.weak.length ? `<p style="margin-top:13px"><b>Cần luyện thêm:</b> ${r.weak.map(w => esc(w.topic) + ` (${w.pct}%)`).join(', ')}</p>` : ''}${r.achievements.length ? `<p><b>Thành tích:</b> ${r.achievements.map(esc).join(' · ')}</p>` : ''}`;

  // ---------- mua gói ----------
  function orderPub(x) { return { id: x.id, plan: x.plan, planName: (PLANS[x.plan] || {}).name || x.info || x.plan, amount: x.amount, base: x.base, coupon: x.coupon || null, gateway: x.gateway, status: x.status, created: x.created, paidAt: x.paidAt || 0, transfer: x.gateway === 'bank' ? 'RUBIK ' + x.transfer : null, until: x.until || 0 }; }
  function priceFor(plan, code) {
    const P = PLANS[plan]; let amount = P.price, c = null;
    if (code) { c = db.get('coupons', String(code).trim().toUpperCase()); if (!c || (c.until && c.until < Date.now()) || (c.max && (c.used | 0) >= c.max) || (c.plans && c.plans.length && !c.plans.includes(plan))) return { error: 'Mã giảm giá không dùng được.' }; amount = Math.max(1000, Math.round(amount * (100 - (c.pct | 0)) / 100) - (c.off | 0)); }
    return { amount, coupon: c && c.code };
  }
  const baseUrl = req => (env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  fam.post('/quote', pauth, (req, res) => { const b = req.body || {}; if (!PLANS[b.plan]) return res.status(400).json({ error: 'Gói không có.' }); const q = priceFor(b.plan, b.coupon); if (q.error) return res.status(400).json(q); res.json(q); });
  fam.post('/checkout', pauth, wrap(async (req, res) => {
    const p = req.parent, b = req.body || {}, P = PLANS[b.plan], G = GATEWAYS[b.gateway];
    if (!P || !G) return res.status(400).json({ error: 'Chọn gói và cách thanh toán.' });
    if (!(p.kids || []).length) return res.status(400).json({ error: 'Hãy liên kết tài khoản của con trước khi mua gói.' });
    const q = priceFor(P.id, b.coupon); if (q.error) return res.status(400).json(q);
    let transfer; do transfer = code6(); while (db.all('orders').some(x => x.transfer === transfer));
    const x = { id: 'R' + Date.now().toString(36).toUpperCase() + rnd(2).toUpperCase(), pid: p.id, login: p.login, plan: P.id, base: P.price, amount: q.amount, coupon: q.coupon || null, gateway: G.id, status: 'pending', created: Date.now(), transfer, info: P.name.replace(/[()–]/g, '').replace(/\s+/g, ' ') };
    const B = baseUrl(req), urls = { ret: gw => `${B}/pay/return/${gw}?order=${x.id}`, ipn: gw => `${B}/pay/ipn/${gw}`, sim: o => `${B}/pay/sim/${o.id}` };
    let r; try { r = await G.create(x, urls, req.ip); } catch (e) { console.error('[pay]', e.message); return res.status(502).json({ error: 'Cổng thanh toán đang bận, vui lòng thử lại hoặc chọn cách khác.' }); }
    db.put('orders', x.id, x); res.json(Object.assign({ order: orderPub(x), mode: G.mode() }, r));
  }));
  fam.get('/orders/:id', pauth, (req, res) => { const x = db.get('orders', req.params.id); if (!x || x.pid !== req.parent.id) return res.status(404).json({ error: 'Không thấy đơn.' }); res.json({ order: orderPub(x), me: meOut(req.parent) }); });

  // kích hoạt gói (idempotent) — gọi từ IPN đã xác thực chữ ký hoặc chủ game xác nhận chuyển khoản
  async function fulfill(x, txn, by) {
    if (x.status === 'paid') return 'dup';
    if (x.kind === 'gems') return fulfillGems(x, txn, by);
    const p = parent(x.pid), P = PLANS[x.plan]; x.status = 'paid'; x.paidAt = Date.now(); x.txn = txn || null; x.by = by;
    if (p) {
      const now = Date.now(), cur = p.sub && p.sub.until > now ? p.sub.until : now;
      p.sub = { plan: P.seats >= ((PLANS[p.sub && p.sub.plan] || {}).seats || 0) ? P.id : p.sub.plan, until: cur + P.days * DAY, since: (p.sub && p.sub.since) || now, last: x.id }; p.reminded = 0;
      x.until = p.sub.until; db.put('parents', p.id, p);
      for (const k of p.kids || []) notifyKid(k);
      mail(isEmail(p.login) ? p.login : p.email, `Biên nhận thanh toán ${x.id} — ${P.name}`, `<p>Cảm ơn bạn đã ủng hộ Trường Rubik! 💛</p><table style="font-size:15px">${[['Mã đơn', x.id], ['Gói', P.name], ['Số tiền', money(x.amount) + (x.coupon ? ` (mã ${esc(x.coupon)}, giá gốc ${money(x.base)})` : '')], ['Cổng', GATEWAYS[x.gateway].name], ['Mã giao dịch', esc(x.txn || '—')], ['Thời điểm', new Date(x.paidAt + 7 * 36e5).toISOString().replace('T', ' ').slice(0, 16) + ' (giờ VN)'], ['Hiệu lực đến', vnDay(p.sub.until)]].map(([k, v]) => `<tr><td style="padding:3px 13px 3px 0;color:#7a6a58">${k}</td><td><b>${v}</b></td></tr>`).join('')}</table><p>Gói <b>không tự gia hạn</b>. Chúng tôi sẽ nhắc trước 3 ngày khi sắp hết hạn.</p><p style="font-size:13px;color:#7a6a58">Cần hoá đơn GTGT hoặc hoàn tiền: trả lời trong 7 ngày qua trang Phụ huynh → Hỗ trợ.</p>`);
    }
    if (x.coupon) { const c = db.get('coupons', x.coupon); if (c) { c.used = (c.used | 0) + 1; db.put('coupons', c.code, c); } }
    db.put('orders', x.id, x); return 'ok';
  }
  // 💎 đơn kim cương: cộng vào ví của con (server/economy.js) + biên nhận gửi các phụ huynh đã liên kết
  function fulfillGems(x, txn, by) {
    x.status = 'paid'; x.paidAt = Date.now(); x.txn = txn || null; x.by = by; db.put('orders', x.id, x);
    if (o.eco) o.eco.grantGems(x.uid, x.gems, x.id);
    for (const pid of kidParents.get(x.uid) || []) { const p = parent(pid); if (p) mail(isEmail(p.login) ? p.login : p.email, `Biên nhận ${x.id} — ${x.gems} kim cương hồng`, `<p>Cảm ơn bạn đã ủng hộ Trường Rubik! 💛</p><p>Đơn <b>${esc(x.id)}</b>: <b>${x.gems} 💎 kim cương hồng</b> cho tài khoản của con — <b>${money(x.amount)}</b> (${GATEWAYS[x.gateway].name}).</p><p style="font-size:13px;color:#7a6a58">Kim cương chỉ dùng đổi đồ trang trí đặc biệt; không có vật phẩm may rủi. Cần hoàn tiền: trả lời trong 7 ngày.</p>`); }
    return 'ok';
  }
  async function onIpn(gw, payload) {   // → { code: 'ok'|'bad'|'notfound'|'amount'|'dup'|'failed' }
    const v = GATEWAYS[gw].verify(payload); if (v.bad) return { code: 'bad' };
    const x = db.get('orders', v.orderId); if (!x || x.gateway !== gw) return { code: 'notfound' };
    if (v.amount !== x.amount) return { code: 'amount' };
    if (x.status === 'paid') return { code: 'dup' };
    if (!v.paid) { x.status = 'failed'; db.put('orders', x.id, x); return { code: 'failed' }; }
    return { code: await fulfill(x, v.txn, gw) };
  }
  const pay = express.Router();
  pay.use(express.json({ limit: '20kb' }), express.urlencoded({ extended: false, limit: '20kb' }));
  pay.post('/ipn/momo', wrap(async (req, res) => { const r = await onIpn('momo', req.body); if (r.code === 'bad') return res.status(400).json({ error: 'invalid signature' }); res.status(204).end(); }));
  pay.post('/ipn/zalopay', wrap(async (req, res) => { const r = await onIpn('zalopay', req.body); res.json(r.code === 'bad' ? { return_code: -1, return_message: 'mac not equal' } : { return_code: r.code === 'dup' ? 2 : 1, return_message: r.code === 'dup' ? 'already processed' : 'success' }); }));
  pay.get('/ipn/vnpay', wrap(async (req, res) => { const r = await onIpn('vnpay', req.query); res.json({ ok: { RspCode: '00', Message: 'Confirm Success' }, failed: { RspCode: '00', Message: 'Confirm Success' }, bad: { RspCode: '97', Message: 'Invalid Checksum' }, notfound: { RspCode: '01', Message: 'Order not found' }, dup: { RspCode: '02', Message: 'Order already confirmed' }, amount: { RspCode: '04', Message: 'Invalid amount' } }[r.code]); }));
  pay.get('/return/:gw', (req, res) => { const id = String(req.query.order || req.query.orderId || req.query.vnp_TxnRef || '').replace(/[^\w]/g, '').slice(0, 40), x = db.get('orders', id);
    if (x && x.kind === 'gems') return res.type('html').send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Trường Rubik</title><body style="margin:0;background:#f6f0e4;font:16px/1.618 system-ui;display:grid;place-items:center;min-height:100vh;padding:16px;box-sizing:border-box;text-align:center"><div style="background:#fff;border-radius:21px;padding:34px;max-width:377px"><div style="font-size:55px">${x.status === 'paid' ? '💎' : '⏳'}</div><h2>${x.status === 'paid' ? 'Đã nhận thanh toán' : 'Đang chờ xác nhận'}</h2><p>Đơn ${esc(x.id)} · ${esc(x.info)} · <b>${money(x.amount)}</b></p><p>Bố mẹ có thể đóng trang này và quay lại game — kim cương tự vào ví của bé.</p></div></body>`);
    res.redirect(302, '/parent#order=' + id); });   // trang kết quả hỏi trạng thái đơn ở server (chỉ IPN kích hoạt gói)
  // trang giả lập cổng thanh toán (chỉ khi cổng ở chế độ 'sim')
  pay.get('/sim/:id', (req, res) => {
    const x = db.get('orders', req.params.id); if (!x || !GATEWAYS[x.gateway] || GATEWAYS[x.gateway].mode() !== 'sim' || x.gateway === 'bank') return res.status(404).send('Không có đơn giả lập.');
    const G = GATEWAYS[x.gateway];
    res.type('html').send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Giả lập ${G.name}</title><meta name="robots" content="noindex">
<body style="margin:0;background:#f6f0e4;font:16px/1.618 system-ui;display:grid;place-items:center;min-height:100vh;padding:16px;box-sizing:border-box"><div style="background:#fff;border-radius:21px;padding:34px;max-width:377px;width:100%;box-shadow:0 8px 34px #0002;text-align:center">
<div style="font-size:13px;font-weight:800;color:#c8502c;letter-spacing:1px">CHẾ ĐỘ GIẢ LẬP — KHÔNG TRỪ TIỀN THẬT</div><h2 style="margin:8px 0">${G.icon} ${G.name}</h2><p>Đơn <b>${esc(x.id)}</b><br>${esc(x.kind === 'gems' ? x.info : PLANS[x.plan].name)}<br><b style="font-size:34px">${money(x.amount)}</b></p>
<form method="post"><button name="r" value="ok" style="width:100%;padding:13px;border:0;border-radius:13px;background:#3fb8a8;color:#fff;font:800 16px system-ui;margin-bottom:8px;cursor:pointer">✅ Thanh toán thành công</button><button name="r" value="fail" style="width:100%;padding:13px;border:0;border-radius:13px;background:#efe3cc;font:800 16px system-ui;cursor:pointer">❌ Huỷ / thất bại</button></form>
<p style="font-size:13px;color:#7a6a58">Nút bấm gửi một IPN có chữ ký giống hệt cổng thật tới máy chủ (đi qua đúng bước kiểm tra chữ ký).</p></div></body>`);
  });
  pay.post('/sim/:id', wrap(async (req, res) => {
    const x = db.get('orders', req.params.id); if (!x || !GATEWAYS[x.gateway] || GATEWAYS[x.gateway].mode() !== 'sim' || x.gateway === 'bank') return res.status(404).send('Không có đơn giả lập.');
    const ok = (req.body || {}).r === 'ok', B = baseUrl(req), G = GATEWAYS[x.gateway];
    if (!ok && x.gateway === 'zalopay') { x.status = 'failed'; db.put('orders', x.id, x); }   // ZaloPay không gọi callback khi thất bại
    else {   // gửi IPN thật qua HTTP tới chính máy chủ này (như cổng gọi về)
      const b = G.simIpn(x, ok);
      if (x.gateway === 'vnpay') await fetch(`${B}/pay/ipn/vnpay?` + new URLSearchParams(b)).catch(() => onIpn('vnpay', b));
      else await fetch(`${B}/pay/ipn/${x.gateway}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).catch(() => onIpn(x.gateway, b));
    }
    res.redirect(302, `/pay/return/${x.gateway}?order=${x.id}`);
  }));
  app.use('/pay', pay);

  // ---------- giấy phép trường học (B2B): học sinh nhập mã của trường ----------
  api.post('/license/join', o.auth, (req, res) => {
    const l = byLic.get(String((req.body || {}).code || '').trim().toUpperCase()); if (!l || l.until < Date.now()) return res.status(404).json({ error: 'Mã trường không đúng hoặc đã hết hạn.' });
    const u = req.user; if (u.license !== l.id) { if ((l.used | 0) >= l.seats) return res.status(400).json({ error: 'Trường đã dùng hết số suất học sinh.' }); l.used = (l.used | 0) + 1; db.put('licenses', l.id, l); u.license = l.id; save(u); }
    res.json({ ok: true, plan: entitlement(u) });
  });

  // ---------- chủ game /admin (ADMIN_KEY) ----------
  const adm = express.Router();
  adm.use(express.json({ limit: '20kb' }), rateLimit({ windowMs: 15 * 60e3, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
  adm.use((req, res, next) => safeEq(String(req.headers['x-admin-key'] || '').trim().toUpperCase(), String(ADMIN_KEY).toUpperCase()) ? next() : res.status(401).json({ error: 'Sai mã chủ game.' }));
  adm.post('/gems', (req, res) => {   // chủ game tặng kim cương hiếm: { name, gems }
    const b = req.body || {}, n = Math.max(1, Math.min(377, b.gems | 0)), u = db.all('users').find(x => x.lname === String(b.name || '').trim().toLowerCase());
    if (!u || !o.eco) return res.status(404).json({ error: 'Không thấy học sinh.' }); o.eco.grantGems(u.id, n, 'gift'); res.json({ ok: true });
  });
  adm.get('/summary', (req, res) => {
    const now = Date.now(), orders = db.all('orders'), paid = orders.filter(x => x.status === 'paid'), users = db.all('users').filter(u => u.role !== 'teacher');
    const byMonth = {}; for (const x of paid) { const m = vnDay(x.paidAt).slice(0, 7); byMonth[m] = (byMonth[m] || 0) + x.amount; }
    const byPlan = {}; for (const x of paid) byPlan[x.plan] = (byPlan[x.plan] || 0) + x.amount;
    const kinds = { paid: 0, trial: 0, school: 0, gift: 0, free: 0 }; for (const u of users) { const e = entitlement(u); kinds[e.on ? e.kind : 'free']++; }
    res.json({ revenue: paid.reduce((a, x) => a + x.amount, 0), byMonth, byPlan, kinds, students: users.length, parents: db.all('parents').length,
      pending: orders.filter(x => x.status === 'pending' && x.gateway === 'bank').sort((a, b) => b.created - a.created).map(x => Object.assign(orderPub(x), { login: x.login })),
      recent: orders.sort((a, b) => b.created - a.created).slice(0, 34).map(x => Object.assign(orderPub(x), { login: x.login })), gateways: gwPub(), plans: plansPub(), mailer: mailer ? 'smtp' : 'giả lập',
      coupons: db.all('coupons'), licenses: db.all('licenses'), outbox: mailer ? [] : db.all('outbox').sort((a, b) => b.at - a.at).slice(0, 13).map(m => ({ at: m.at, to: m.to, subject: m.subject, html: m.html })) });
  });
  adm.post('/orders/:id/:op', wrap(async (req, res) => {
    const x = db.get('orders', req.params.id); if (!x) return res.status(404).json({ error: 'Không thấy đơn.' });
    if (req.params.op === 'confirm') { const r = await fulfill(x, clean((req.body || {}).ref, 40) || 'chuyen-khoan', 'admin'); return res.json({ ok: true, r }); }
    if (req.params.op === 'reject' && x.status === 'pending') { x.status = 'cancelled'; db.put('orders', x.id, x); return res.json({ ok: true }); }
    res.status(400).json({ error: 'Không làm được.' });
  }));
  adm.post('/grant', (req, res) => {   // cấp gói thủ công: cho phụ huynh (email/SĐT) hoặc cho 1 học sinh (tên đăng nhập)
    const b = req.body || {}, days = Math.max(1, Math.min(3650, Math.round(+b.days) || 30)), login = normLogin(b.login), p = login && byLogin.get(login);
    if (p) { const cur = p.sub && p.sub.until > Date.now() ? p.sub.until : Date.now(); p.sub = { plan: PLANS[b.plan] ? b.plan : 'family', until: cur + days * DAY, since: Date.now(), last: 'admin' }; db.put('parents', p.id, p); for (const k of p.kids || []) notifyKid(k); return res.json({ ok: true, to: 'parent', until: p.sub.until }); }
    const u = db.all('users').find(u => u.lname === String(b.login || '').trim().toLowerCase()); if (!u) return res.status(404).json({ error: 'Không thấy phụ huynh/học sinh.' });
    u.giftUntil = Math.max(Date.now(), u.giftUntil || 0) + days * DAY; save(u); notifyKid(u.id); res.json({ ok: true, to: 'student', until: u.giftUntil });
  });
  adm.post('/coupons', (req, res) => {
    const b = req.body || {}, code = String(b.code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 21); if (code.length < 4) return res.status(400).json({ error: 'Mã 4–21 ký tự (chữ, số).' });
    const c = { code, pct: Math.max(0, Math.min(90, Math.round(+b.pct) || 0)), off: Math.max(0, Math.round(+b.off) || 0), max: Math.max(0, Math.round(+b.max) || 0), used: 0, until: b.until ? Date.parse(b.until) + DAY - 1 : 0, plans: Array.isArray(b.plans) ? b.plans.filter(x => PLANS[x]) : [] };
    if (!c.pct && !c.off) return res.status(400).json({ error: 'Cần % hoặc số tiền giảm.' }); db.put('coupons', code, c); res.json({ ok: true, coupon: c });
  });
  adm.delete('/coupons/:code', (req, res) => { db.del('coupons', req.params.code); res.json({ ok: true }); });
  adm.post('/licenses', (req, res) => {
    const b = req.body || {}, school = clean(b.school, 80); if (!school) return res.status(400).json({ error: 'Cần tên trường.' });
    let code; do code = code6(); while (byLic.has(code));
    const l = { id: rnd(6), school, code, seats: Math.max(1, Math.min(10000, Math.round(+b.seats) || 30)), used: 0, until: b.until ? Date.parse(b.until) + DAY - 1 : Date.now() + 365 * DAY, contact: clean(b.contact, 80), price: Math.max(0, Math.round(+b.price) || 0), created: Date.now() };
    db.put('licenses', l.id, l); byLic.set(code, l); res.json({ ok: true, license: l });
  });
  adm.delete('/licenses/:id', (req, res) => { const l = db.get('licenses', req.params.id); if (l) { byLic.delete(l.code); db.del('licenses', l.id); } res.json({ ok: true }); });

  app.use('/api/family', fam);
  app.use('/api/admin', adm);

  // ---------- việc định kỳ: nhắc gia hạn trước 3 ngày · tóm tắt tuần tối Chủ nhật (20:00 giờ VN) ----------
  async function cron() {
    const now = Date.now(), v = new Date(now + 7 * 36e5), wkKey = vnDay(weekStart());
    for (const p of db.all('parents')) {
      const to = isEmail(p.login) ? p.login : p.email;
      if (p.sub && p.sub.until > now && p.sub.until - now < 3 * DAY && p.reminded !== p.sub.until) {
        p.reminded = p.sub.until; db.put('parents', p.id, p);
        mail(to, 'Gói Trường Rubik sắp hết hạn', `<p>Gói <b>${esc((PLANS[p.sub.plan] || {}).name)}</b> của gia đình sẽ hết hạn ngày <b>${vnDay(p.sub.until)}</b>.</p><p>Gói không tự trừ tiền. Nếu muốn con tiếp tục học toàn bộ nội dung, vào trang Phụ huynh → <b>Gia hạn</b>. Nếu không, con vẫn chơi được phần miễn phí.</p>`);
        zalo(p, `Gói Trường Rubik hết hạn ngày ${vnDay(p.sub.until)}. Gia hạn tại trang Phụ huynh nếu muốn.`);
      }
      if (v.getUTCDay() === 0 && v.getUTCHours() >= 20 && (p.notify || { weekly: true }).weekly && p.weekly !== wkKey && (p.kids || []).length) {
        p.weekly = wkKey; db.put('parents', p.id, p);
        const reps = (p.kids || []).map(user).filter(u => u && entitlement(u).on).map(u => reportHtml(report(u)));
        if (reps.length) mail(to, 'Tóm tắt học tập tuần này', reps.join('<hr style="border:0;border-top:1px solid #eee;margin:21px 0">') + '<p>Xem biểu đồ chi tiết ở trang Phụ huynh.</p>');
      }
    }
  }
  setInterval(() => cron().catch(e => console.error('[cron]', e)), 30 * 60e3).unref(); setTimeout(() => cron().catch(() => {}), 13e3).unref();

  return { entitlement, report, onIpn, fulfill, cron, PLANS };
};
module.exports.subjectOf = subjectOf;
