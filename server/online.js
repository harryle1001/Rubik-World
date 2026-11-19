// online.js — Chơi online cho cả trường: tài khoản (scrypt + token), đồng bộ tiến độ, bạn bè bằng mã 6 ký tự,
// biểu cảm + câu nói có sẵn (KHÔNG chat tự do), nhóm & lời mời, chặn/báo cáo, công cụ chủ game, sự kiện cuối tuần,
// bảng điểm 4 nhà Tứ Linh, lớp học của giáo viên, giới hạn giờ chơi do phụ huynh đặt.
// An toàn trẻ em: không email/SĐT/tên thật; tên lọc từ xấu & dãy số dài; mọi giao tiếp là mã số câu mẫu do server định nghĩa.
const crypto = require('crypto');
const { openStore } = require('./db');

// ---------- nội dung giao tiếp an toàn (server là nguồn duy nhất) — 13 câu mẫu, 8 biểu cảm (Fibonacci) ----------
const PHRASES = ['Xin chào! 👋', 'Cảm ơn bạn! 🙏', 'Đi cùng mình nhé!', 'Đợi mình với! ⏳', 'Theo mình nào! ➡️', 'Giỏi quá! 👏', 'Đồng ý! ✅',
  'Để lần sau nhé 🙂', 'Chơi mini game không? 🎮', 'Lên tàu nào! 🚂', 'Đua chổi bay nhé! 🧹', 'Cố lên! 💪', 'Tạm biệt! 👋'];
const EMOTES = ['👋', '😄', '😂', '😮', '😢', '❤️', '👍', '🎉'];
const REASONS = ['Tên không hay', 'Làm phiền / đi theo mãi', 'Gian lận', 'Lý do khác'];
const KINDS = { party: 'vào nhóm', come: 'đến chỗ bạn ấy', mg: 'chơi mini game', ship: 'lên tàu', broom: 'đua chổi bay' };
const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const BAD = /(đ[iị]t|đụ|lồn|cặc|buồi|đéo|\bngu\b|thầy|\bcô\b)/i, BAD_A = /(\bdit|djt|\bdm\b|\bdcm|vcl|\bvl\b|clm|\bdu ?ma|fuck|shit|bitch|sex|porn|admin|chu ?game|giao ?vien|moderator|\bmod\b)/i;
const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
const WEEK = 7 * 864e5, OFF = 4 * 864e5, wk = (t = Date.now()) => Math.floor((t + OFF) / WEEK);   // giống academy/houses.js (tuần bắt đầu thứ Hai)
const vn = (t = Date.now()) => new Date(t + 7 * 36e5), day = t => vn(t).toISOString().slice(0, 10);
const HOUSES = ['long', 'phung', 'lan', 'quy'];
const subjectOf = s => require('./billing').subjectOf(s);

const rnd = n => crypto.randomBytes(n).toString('hex');
const code6 = () => Array.from(crypto.randomBytes(6), b => CODE_CH[b % 32]).join('');
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
const scrypt = (pass, salt) => new Promise((res, rej) => crypto.scrypt(String(pass), salt, 32, { N: 16384, r: 8, p: 1 }, (e, k) => e ? rej(e) : res(k.toString('hex'))));
async function hashPass(pass) { const salt = rnd(16); return `sc1$${salt}$${await scrypt(pass, salt)}`; }
async function checkPass(pass, stored) {
  const [v, salt, h] = String(stored || '').split('$'); if (v !== 'sc1' || !salt || !h) return false;
  const k = Buffer.from(await scrypt(pass, salt), 'hex'), H = Buffer.from(h, 'hex'); return k.length === H.length && crypto.timingSafeEqual(k, H);
}
function nameError(name) {
  if (!/^[\p{L}\p{N}_.\- ]{3,20}$/u.test(name)) return 'Tên đăng nhập cần 3–20 ký tự (chữ, số, dấu cách, _ . -).';
  if (/\d{6,}/.test(name.replace(/[\s._-]/g, ''))) return 'Tên không được chứa dãy số dài (đừng dùng số điện thoại, ngày sinh).';
  if (BAD.test(name) || BAD_A.test(fold(name))) return 'Tên này không dùng được. Hãy chọn tên khác thật dễ thương nhé!';
  return null;
}

module.exports = async function setupOnline(app, io, { ADMIN_KEY, express, rateLimit }) {
  const db = await openStore();
  console.log('[online] lưu dữ liệu bằng', db.backend);
  // chỉ mục tên đăng nhập & mã bạn bè
  const byName = new Map(), byCode = new Map(), byClassCode = new Map();
  for (const u of db.all('users')) { byName.set(u.lname, u); byCode.set(u.code, u); }
  for (const c of db.all('classes')) byClassCode.set(c.code, c);
  const user = id => db.get('users', id);
  const save = u => db.put('users', u.id, u);
  const ensureStats = u => (u.stats = u.stats || { subj: {}, days: {}, last: 0 });
  const today = u => { const s = ensureStats(u), d = day(); return (s.days[d] = s.days[d] || { ms: 0, n: 0, ok: 0, subj: {} }); };
  const usedMin = u => Math.floor(((u.stats && u.stats.days[day()] || {}).ms || 0) / 60000);
  const timeLeft = u => (u.limitMin > 0 ? u.limitMin - usedMin(u) : Infinity);
  const self = u => ({ id: u.id, name: u.name, role: u.role, code: u.code, classes: (u.classes || []).map(id => { const c = db.get('classes', id); return c && { id, name: c.name }; }).filter(Boolean),
    limitMin: u.limitMin || 0, usedMin: usedMin(u), progress: u.progress || null, plan: billing ? billing.entitlement(u) : null });
  let billing = null, eco = null;   // Gói Phụ huynh (server/billing.js) gắn ở cuối hàm

  // ---------- REST ----------
  const api = express.Router();
  api.use(express.json({ limit: '300kb' }));
  const authLimit = rateLimit({ windowMs: 15 * 60e3, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Thử quá nhiều lần, đợi vài phút nhé.' } });   // cả lớp chung 1 IP trường → nới
  api.use(rateLimit({ windowMs: 60e3, limit: 600, standardHeaders: 'draft-7', legacyHeaders: false }));
  const fails = new Map();   // khoá tạm 5 phút sau 8 lần sai mật khẩu của 1 tài khoản
  function newSession(u) { const tok = rnd(32), h = sha(tok); db.put('sessions', h, { h, uid: u.id, exp: Date.now() + 60 * 864e5 }); return tok; }
  function fromToken(tok) {
    if (!tok || typeof tok !== 'string') return null; const s = db.get('sessions', sha(tok)); if (!s) return null;
    if (s.exp < Date.now()) { db.del('sessions', sha(tok)); return null; } const u = user(s.uid); return u && !u.banned ? u : null;
  }
  const auth = (req, res, next) => { const u = fromToken((req.headers.authorization || '').replace(/^Bearer\s+/i, '')); if (!u) return res.status(401).json({ error: 'Cần đăng nhập.' }); req.user = u; next(); };
  const teacher = (req, res, next) => req.user.role === 'teacher' ? next() : res.status(403).json({ error: 'Chỉ tài khoản giáo viên.' });
  const wrap = f => (req, res) => Promise.resolve(f(req, res)).catch(e => { console.error(e); res.status(500).json({ error: 'Lỗi máy chủ.' }); });

  api.get('/health', (req, res) => res.json({ ok: true, db: db.backend.split(':')[0], phrases: PHRASES, emotes: EMOTES, reasons: REASONS }));
  api.post('/auth/register', authLimit, wrap(async (req, res) => {
    const b = req.body || {}, name = String(b.name || '').trim().replace(/\s+/g, ' '), pass = String(b.pass || '');
    const err = nameError(name); if (err) return res.status(400).json({ error: err });
    if (pass.length < 6 || pass.length > 64) return res.status(400).json({ error: 'Mật khẩu cần 6–64 ký tự.' });
    if (pass.toLowerCase() === name.toLowerCase()) return res.status(400).json({ error: 'Mật khẩu đừng giống tên đăng nhập nhé.' });
    const role = b.role === 'teacher' ? 'teacher' : 'student';
    if (role === 'teacher' && process.env.TEACHER_CODE && String(b.teacherCode || '') !== process.env.TEACHER_CODE) return res.status(403).json({ error: 'Mã giáo viên chưa đúng (hỏi chủ game).' });
    if (byName.has(name.toLowerCase())) return res.status(409).json({ error: 'Tên này đã có người dùng. Hãy chọn tên khác.' });
    let code; do code = code6(); while (byCode.has(code));
    const u = { id: rnd(8), name, lname: name.toLowerCase(), hash: await hashPass(pass), role, code, created: Date.now(), friends: [], reqs: [], blocked: [], classes: [], limitMin: 0, progress: null, stats: { subj: {}, days: {}, last: 0 } };
    if (b.progress && typeof b.progress === 'object' && JSON.stringify(b.progress).length < 280000) u.progress = { profile: b.progress.profile || null, ls: b.progress.ls || {}, at: Date.now() };   // khách → tài khoản: giữ tiến độ
    byName.set(u.lname, u); byCode.set(code, u); save(u);
    res.json({ token: newSession(u), user: self(u) });
  }));
  api.post('/auth/login', authLimit, wrap(async (req, res) => {
    const b = req.body || {}, u = byName.get(String(b.name || '').trim().replace(/\s+/g, ' ').toLowerCase());
    if (!u) return res.status(404).json({ error: 'Không tìm thấy tài khoản này. Hãy bấm "Tạo tài khoản".' });
    const f = fails.get(u.id); if (f && f.n >= 8 && Date.now() - f.t < 5 * 60e3) return res.status(429).json({ error: 'Sai nhiều lần quá, đợi 5 phút rồi thử lại nhé.' });
    if (!(await checkPass(String(b.pass || ''), u.hash))) { fails.set(u.id, { n: (f && Date.now() - f.t < 5 * 60e3 ? f.n : 0) + 1, t: Date.now() }); return res.status(401).json({ error: 'Sai mật khẩu.' }); }
    fails.delete(u.id);
    if (u.banned) return res.status(403).json({ error: 'Tài khoản đang bị khoá. Hãy hỏi thầy cô hoặc chủ game.' });
    res.json({ token: newSession(u), user: self(u) });
  }));
  api.post('/auth/logout', (req, res) => { const t = (req.headers.authorization || '').replace(/^Bearer\s+/i, ''); if (t) db.del('sessions', sha(t)); res.json({ ok: true }); });
  api.get('/me', auth, (req, res) => res.json({ user: self(req.user) }));
  api.delete('/me', auth, wrap(async (req, res) => {   // quyền xoá dữ liệu (phụ huynh / học sinh): cần mật khẩu
    const u = req.user; if (!(await checkPass(String((req.body || {}).pass || ''), u.hash))) return res.status(401).json({ error: 'Sai mật khẩu.' });
    deleteUser(u); res.json({ ok: true });
  }));
  function deleteUser(u) {   // xoá tài khoản + toàn bộ dữ liệu (tiến độ, thống kê học, phiên đăng nhập, báo cáo do em gửi)
    for (const f of u.friends || []) { const o = user(f); if (o) { o.friends = o.friends.filter(x => x !== u.id); save(o); } }
    for (const o of db.all('users')) if ((o.reqs || []).includes(u.id)) { o.reqs = o.reqs.filter(x => x !== u.id); save(o); }
    for (const r of db.all('reports')) if (r.fromUid === u.id) db.del('reports', r.id);
    for (const s of db.all('sessions')) if (s.uid === u.id && s.h) db.del('sessions', s.h);
    byName.delete(u.lname); byCode.delete(u.code); db.del('users', u.id); kick(u.id, 'deleted');
  }
  api.put('/progress', auth, (req, res) => {
    const b = req.body || {}; if (JSON.stringify(b).length > 280000) return res.status(413).json({ error: 'Dữ liệu quá lớn.' });
    const ls = {}; for (const [k, v] of Object.entries(b.ls || {})) if (/^(island|academy|mg|rs)\./.test(k) && typeof v === 'string') ls[k] = v;
    req.user.progress = { profile: b.profile && typeof b.profile === 'object' ? b.profile : null, ls, at: +b.at || Date.now() }; if (eco) eco.apply(req.user); save(req.user);
    res.json({ ok: true, at: req.user.progress.at });
  });
  // học sinh vào lớp bằng mã; xem nhiệm vụ học được giao
  api.post('/class/join', auth, (req, res) => {
    const c = byClassCode.get(String((req.body || {}).code || '').trim().toUpperCase()); if (!c) return res.status(404).json({ error: 'Mã lớp không đúng.' });
    const u = req.user; u.classes = u.classes || []; if (!u.classes.includes(c.id)) { if (u.classes.length >= 5) return res.status(400).json({ error: 'Em đã ở 5 lớp rồi.' }); u.classes.push(c.id); save(u); }
    res.json({ ok: true, user: self(u) });
  });
  api.get('/tasks', auth, (req, res) => {
    const out = []; for (const id of req.user.classes || []) { const c = db.get('classes', id); if (c) for (const t of c.tasks || []) out.push(Object.assign({ cls: c.name }, t, { done: taskProgress(req.user, t) })); }
    for (const t of req.user.ptasks || []) out.push(Object.assign({ cls: '👪 Bố mẹ giao' }, t, { done: taskProgress(req.user, t) }));
    res.json({ tasks: out });
  });
  function taskProgress(u, t) {
    let n = 0; const d0 = day(t.at), days = (u.stats && u.stats.days) || {};
    for (const [d, v] of Object.entries(days)) if (d >= d0) n += t.subject === '*' ? (t.kind === 'ok' ? v.ok : v.n) : t.by === 'parent' ? Object.entries(v.subj).filter(([k]) => subjectOf(k) === t.subject).reduce((a, [, x]) => a + x[t.kind === 'ok' ? 1 : 0], 0) : ((v.subj[t.subject] || [0, 0])[t.kind === 'ok' ? 1 : 0]);
    return Math.min(n, t.n);
  }
  // ---------- giáo viên ----------
  const myClass = (req, res) => { const c = db.get('classes', req.params.id); if (!c || c.teacher !== req.user.id) { res.status(404).json({ error: 'Không thấy lớp.' }); return null; } return c; };
  const studentRow = (u, c) => {
    const s = u.stats || { subj: {}, days: {} }, days = Object.entries(s.days || {}), last7 = days.filter(([d]) => d >= day(Date.now() - 6 * 864e5));
    return { id: u.id, name: u.name, last: s.last || 0, todayMin: usedMin(u), weekMin: Math.round(last7.reduce((a, [, v]) => a + v.ms, 0) / 60000), limitMin: u.limitMin || 0,
      subj: s.subj, level: u.progress && u.progress.profile ? u.progress.profile.level || 1 : 1, house: u.progress && u.progress.profile && u.progress.profile.house ? u.progress.profile.house.id : null,
      tasks: (c.tasks || []).map(t => taskProgress(u, t)) };
  };
  api.get('/teacher/classes', auth, teacher, (req, res) => res.json({ classes: db.all('classes').filter(c => c.teacher === req.user.id).map(c => ({ id: c.id, name: c.name, code: c.code, n: db.all('users').filter(u => (u.classes || []).includes(c.id)).length })) }));
  api.post('/teacher/classes', auth, teacher, (req, res) => {
    const name = String((req.body || {}).name || '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 40); if (!name) return res.status(400).json({ error: 'Cần tên lớp.' });
    if (db.all('classes').filter(c => c.teacher === req.user.id).length >= 21) return res.status(400).json({ error: 'Tối đa 21 lớp.' });
    let code; do code = code6(); while (byClassCode.has(code));
    const c = { id: rnd(6), name, code, teacher: req.user.id, tasks: [], created: Date.now() }; db.put('classes', c.id, c); byClassCode.set(code, c); res.json({ class: c });
  });
  api.get('/teacher/classes/:id', auth, teacher, (req, res) => { const c = myClass(req, res); if (!c) return; res.json({ class: c, students: db.all('users').filter(u => (u.classes || []).includes(c.id)).map(u => studentRow(u, c)) }); });
  api.delete('/teacher/classes/:id', auth, teacher, (req, res) => { const c = myClass(req, res); if (!c) return; for (const u of db.all('users')) if ((u.classes || []).includes(c.id)) { u.classes = u.classes.filter(x => x !== c.id); save(u); } byClassCode.delete(c.code); db.del('classes', c.id); res.json({ ok: true }); });
  api.post('/teacher/classes/:id/tasks', auth, teacher, (req, res) => {
    const c = myClass(req, res); if (!c) return; const b = req.body || {};
    const t = { id: rnd(4), title: String(b.title || '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 60) || 'Nhiệm vụ học', subject: String(b.subject || '*').slice(0, 24), kind: b.kind === 'ok' ? 'ok' : 'n', n: Math.max(1, Math.min(200, Math.round(+b.n) || 10)), at: Date.now() };
    c.tasks = (c.tasks || []).concat(t).slice(-21); db.put('classes', c.id, c); res.json({ class: c });
  });
  api.delete('/teacher/classes/:id/tasks/:tid', auth, teacher, (req, res) => { const c = myClass(req, res); if (!c) return; c.tasks = (c.tasks || []).filter(t => t.id !== req.params.tid); db.put('classes', c.id, c); res.json({ class: c }); });
  api.delete('/teacher/classes/:id/students/:uid', auth, teacher, (req, res) => { const c = myClass(req, res); if (!c) return; const u = user(req.params.uid); if (u) { u.classes = (u.classes || []).filter(x => x !== c.id); save(u); } res.json({ ok: true }); });
  // ---------- phụ huynh: đăng nhập bằng tài khoản của con, đặt giới hạn phút/ngày (khoá bằng mã PIN phụ huynh) ----------
  api.get('/parent', auth, (req, res) => { const u = req.user, s = u.stats || { subj: {}, days: {} }; res.json({ name: u.name, limitMin: u.limitMin || 0, hasPin: !!u.pin, usedMin: usedMin(u), subj: s.subj, days: Object.fromEntries(Object.entries(s.days).slice(-14).map(([d, v]) => [d, Math.round(v.ms / 60000)])) }); });
  api.post('/parent/limit', auth, wrap(async (req, res) => {
    const u = req.user, b = req.body || {};
    if (u.pin && !(await checkPass(String(b.pin || ''), u.pin))) return res.status(401).json({ error: 'Mã PIN phụ huynh chưa đúng.' });
    if (!u.pin && !/^\d{4,8}$/.test(String(b.newPin || ''))) return res.status(400).json({ error: 'Lần đầu: đặt mã PIN phụ huynh 4–8 chữ số.' });
    if (b.newPin && /^\d{4,8}$/.test(String(b.newPin))) u.pin = await hashPass(String(b.newPin));
    u.limitMin = Math.max(0, Math.min(600, Math.round(+b.limitMin) || 0)); save(u); notifyLimit(u); res.json({ ok: true, limitMin: u.limitMin });
  }));
  // ---------- sự kiện & bảng xếp hạng (công khai: chỉ tên đăng nhập + điểm) ----------
  api.get('/events', (req, res) => res.json(board()));
  app.use('/api', api);

  function board() {
    const w = wk(), houses = Object.fromEntries(HOUSES.map(h => [h, 0])), top = [], hunters = [];
    for (const u of db.all('users')) {
      const h = u.progress && u.progress.profile && u.progress.profile.house;
      if (h && HOUSES.includes(h.id) && h.week === w) { houses[h.id] += Math.min(5000, h.pts | 0); }
      const p = u.progress && u.progress.profile; if (p) top.push({ name: u.name, level: p.level | 0, exp: p.exp | 0, house: h && h.id || null });
      if (u.ev && u.ev.week === w && u.ev.pts) hunters.push({ name: u.name, pts: u.ev.pts, house: h && h.id || null });
    }
    top.sort((a, b) => b.level - a.level || b.exp - a.exp); hunters.sort((a, b) => b.pts - a.pts);
    const rk = EV.raceDay === raceKey() ? [...EV.race.entries()].sort((a, b) => a[1].ms - b[1].ms).slice(0, 13).map(([, v]) => v) : [];
    return { week: w, houses, top: top.slice(0, 13), hunters: hunters.slice(0, 13), race: rk, event: evPublic() };
  }

  // ---------- sự kiện cuối tuần: thứ Bảy săn kho báu (vòng mới mỗi 30 phút), Chủ nhật giải bay chổi ----------
  const EV = { kind: null, seed: 0, n: 13, claimed: new Set(), ends: 0, forced: null, raceDay: '', race: new Map() };
  const raceKey = () => (EV.forced === 'race' ? 'forced-' + day() : day());
  function evPublic() { return { kind: EV.kind, seed: EV.seed, n: EV.n, claimed: [...EV.claimed], ends: EV.ends }; }
  function evTick() {
    const d = vn().getUTCDay(), always = process.env.EVENT_ALWAYS;
    let kind = EV.forced || (always === 'race' ? 'race' : always ? 'treasure' : d === 6 ? 'treasure' : d === 0 ? 'race' : null);
    let seed = EV.seed, ends = EV.ends;
    if (kind === 'treasure') { const slot = Math.floor(Date.now() / 18e5); seed = slot; ends = (slot + 1) * 18e5; }
    else if (kind === 'race') { seed = +day().replace(/-/g, ''); ends = vn().setUTCHours(24, 0, 0, 0) - 7 * 36e5; if (EV.raceDay !== raceKey()) { EV.raceDay = raceKey(); EV.race = new Map(); } }
    if (kind !== EV.kind || seed !== EV.seed) { EV.kind = kind; EV.seed = seed; EV.ends = ends; EV.claimed = new Set(); island.emit('ev', evPublic()); }
  }

  // ---------- Socket.io /island ----------
  const island = io.of('/island'), islanders = new Map(), byUid = new Map(), parties = new Map();
  const num = (v, lo, hi) => (Number.isFinite(+v) ? Math.max(lo, Math.min(hi, +v)) : 0);
  const hooks = {};   // server/island-extras.js gắn thêm: hooks.m (gói vị trí trên tàu), hooks.pub (trang phục, áo choàng tàng hình…)
  const pub = m => Object.assign({ id: m.id, name: m.name, hue: m.hue, x: m.x, y: m.y, z: m.z, r: m.r, s: 0, acc: !!m.uid }, hooks.pub ? hooks.pub(m) : null);
  const sockOf = uid => { const sid = byUid.get(uid); return sid && island.sockets.get(sid); };
  function kick(uid, why) { const s = sockOf(uid); if (s) { s.emit(why); setTimeout(() => s.disconnect(true), 500); } }
  function notifyLimit(u) { const s = sockOf(u.id); if (s) s.emit('limit', { limitMin: u.limitMin || 0, usedMin: usedMin(u) }); }
  const blocks = (a, b) => !!(a && b && ((a.u && b.uid && (a.u.blocked || []).includes(b.uid)) || a.blockSids.has(b.id)));
  const visibleTo = (viewer, m) => !m.hidden && !blocks(viewer, m) && !blocks(m, viewer);
  function friendsOf(m) {
    if (!m.u) return { list: [], reqs: [] };
    const row = id => { const o = user(id), sid = byUid.get(id), om = sid && islanders.get(sid); return o && { uid: id, name: o.name, online: !!(om && !om.hidden), sid: om && !om.hidden ? sid : null }; };
    return { code: m.u.code, list: (m.u.friends || []).map(row).filter(Boolean), reqs: (m.u.reqs || []).map(row).filter(Boolean) };
  }
  const pushFriends = uid => { const s = sockOf(uid); if (s) s.emit('friends', friendsOf(islanders.get(s.id))); };
  function pushParty(p) { const list = [...p.members].map(uid => { const sid = byUid.get(uid), m = sid && islanders.get(sid); return m && { uid, name: m.name, sid }; }).filter(Boolean); for (const it of list) island.to(it.sid).emit('party', { pid: p.id, leader: p.leader, members: list }); }
  function leaveParty(m) {
    const p = m.party && parties.get(m.party); m.party = null; if (!p) return; p.members.delete(m.uid);
    if (!p.members.size) return parties.delete(p.id); if (p.leader === m.uid) p.leader = [...p.members][0]; pushParty(p);
  }
  function addPlay(m) {   // cộng giờ chơi hôm nay, kiểm tra giới hạn phụ huynh
    if (!m.u) return; const now = Date.now(), dt = Math.min(now - m.tick, 120e3); m.tick = now; const t = today(m.u); t.ms += dt; m.u.stats.last = now; db.touch('users', m.u.id);
    if (timeLeft(m.u) <= 0 && !m.timeup) { m.timeup = true; const s = island.sockets.get(m.id); if (s) { s.emit('timeup', { limitMin: m.u.limitMin }); setTimeout(() => s.disconnect(true), 1500); } }
  }

  island.use((socket, next) => { const u = fromToken(socket.handshake.auth && socket.handshake.auth.token); socket.data.u = u; next(); });
  island.on('connection', socket => {
    let me = null, last = 0, lastSay = 0, lastLearn = 0, lastAct = 0;
    const u = socket.data.u;
    const slow = (ms = 400) => { const n = Date.now(); if (n - lastAct < ms) return true; lastAct = n; return false; };
    const toast = t => socket.emit('toast', t);
    socket.on('join', d => {
      if (me) return;
      if (u && timeLeft(u) <= 0) { socket.emit('timeup', { limitMin: u.limitMin }); return setTimeout(() => socket.disconnect(true), 1500); }
      if (u) { const old = sockOf(u.id); if (old) old.disconnect(true); }   // 1 tài khoản = 1 kết nối
      me = { id: socket.id, uid: u ? u.id : null, u, name: u ? u.name : 'Khách ' + (100 + (parseInt(sha(socket.id).slice(0, 4), 16) % 900)), hue: num(d && d.hue, 0, 360), x: 0, y: 0, z: 10, r: 0, s: 0,
        admin: !!(d && typeof d.adminKey === 'string' && ADMIN_KEY && d.adminKey.trim().toUpperCase() === ADMIN_KEY.toUpperCase()), hidden: false, blockSids: new Set(), party: null, tick: Date.now() };
      islanders.set(socket.id, me); if (u) byUid.set(u.id, socket.id);
      const others = [...islanders.values()].filter(p => p.id !== socket.id && visibleTo(me, p));
      socket.emit('hello', { me: { id: me.id, name: me.name, acc: !!u, admin: me.admin }, players: others.map(pub), phrases: PHRASES, emotes: EMOTES, reasons: REASONS,
        blocked: [], limit: u ? { limitMin: u.limitMin || 0, usedMin: usedMin(u) } : null, ev: evPublic() });
      for (const o of islanders.values()) if (o !== me && visibleTo(o, me)) island.to(o.id).emit('joined', pub(me));
      if (u) { socket.emit('friends', friendsOf(me)); for (const f of u.friends || []) pushFriends(f); }
      if (d && d.adminKey && !me.admin) toast('🔑 Mã chủ game không đúng.');
    });
    socket.on('m', d => {
      const now = Date.now(); if (!me || !d || now - last < 50) return; last = now; // tối đa 20 lần/giây
      me.x = num(d.x, -3000, 3000); me.y = num(d.y, -60, 500); me.z = num(d.z, -3000, 3000); me.r = num(d.r, -10, 10); me.s = num(d.s, 0, 40);
      if (me.hidden) return;
      const pkt = [me.id, +me.x.toFixed(2), +me.y.toFixed(2), +me.z.toFixed(2), +me.r.toFixed(2), +me.s.toFixed(1)];
      if (hooks.m) hooks.m(socket.id, d, pkt);
      if (!me.blockSids.size && !(u && u.blocked && u.blocked.length)) socket.broadcast.volatile.emit('m', pkt);
      else for (const o of islanders.values()) if (o !== me && visibleTo(o, me)) island.to(o.id).volatile.emit('m', pkt);
    });
    // biểu cảm & câu nói có sẵn: chỉ gửi SỐ THỨ TỰ, server kiểm tra trong danh sách → không thể gõ chữ tự do
    socket.on('say', d => {
      const now = Date.now(); if (!me || !d || now - lastSay < 1200) return; lastSay = now;
      const t = d.t === 'e' ? 'e' : 'p', i = d.i | 0; if (i < 0 || i >= (t === 'e' ? EMOTES : PHRASES).length) return;
      for (const o of islanders.values()) if (visibleTo(o, me) || o === me) island.to(o.id).emit('say', { id: me.id, t, i });
    });
    // học tập: mỗi câu trả lời → thống kê theo môn (cho giáo viên, phụ huynh, nhiệm vụ học)
    socket.on('learn', d => {
      const now = Date.now(); if (!me || !u || !d || now - lastLearn < 600) return; lastLearn = now;
      const s = String(d.s || 'Khác').replace(/[<>\u0000-\u001f]/g, '').slice(0, 24) || 'Khác', ok = !!d.ok, st = ensureStats(u), t = today(u);
      const a = st.subj[s] = st.subj[s] || [0, 0]; a[0]++; if (ok) a[1]++;
      const b = t.subj[s] = t.subj[s] || [0, 0]; b[0]++; if (ok) b[1]++; t.n++; if (ok) t.ok++;
      const tp = String(d.t || '').replace(/[<>|\u0000-\u001f]/g, '').slice(0, 34); if (tp) { t.top = t.top || {}; if (Object.keys(t.top).length < 89 || t.top[s + '|' + tp]) { const c = t.top[s + '|' + tp] = t.top[s + '|' + tp] || [0, 0]; c[0]++; if (ok) c[1]++; } }   // chủ đề (tuỳ trò gửi) → "chủ đề yếu" trong báo cáo
      const keys = Object.keys(st.days); if (keys.length > 60) for (const k of keys.sort().slice(0, keys.length - 60)) delete st.days[k];
      db.touch('users', u.id);
    });
    // ---------- bạn bè ----------
    socket.on('friend', d => {
      if (!me || !d || slow()) return; if (!u) return toast('👤 Hãy đăng nhập tài khoản để kết bạn nhé.');
      const o = d.uid ? user(d.uid) : null;
      if (d.op === 'add') {
        const t = byCode.get(String(d.code || '').trim().toUpperCase()); if (!t) return toast('🔎 Không có bạn nào có mã này.');
        if (t.id === u.id) return toast('🙂 Đây là mã của chính em.'); if ((u.friends || []).includes(t.id)) return toast(`🤝 Em và ${t.name} đã là bạn.`);
        if ((t.blocked || []).includes(u.id) || (u.blocked || []).includes(t.id)) return toast('🚫 Không thể kết bạn.');
        if ((u.friends || []).length >= 89) return toast('Danh sách bạn đã đầy (89).');
        if ((u.reqs || []).includes(t.id)) return accept(t);
        t.reqs = [...new Set([...(t.reqs || []), u.id])].slice(-34); save(t); pushFriends(t.id); toast(`📨 Đã gửi lời mời kết bạn tới ${t.name}.`);
      } else if (d.op === 'accept' && o && (u.reqs || []).includes(o.id)) accept(o);
      else if (d.op === 'decline' && o) { u.reqs = (u.reqs || []).filter(x => x !== o.id); save(u); pushFriends(u.id); }
      else if (d.op === 'remove' && o) { u.friends = (u.friends || []).filter(x => x !== o.id); o.friends = (o.friends || []).filter(x => x !== u.id); save(u); save(o); pushFriends(u.id); pushFriends(o.id); }
    });
    function accept(o) {
      u.reqs = (u.reqs || []).filter(x => x !== o.id); o.reqs = (o.reqs || []).filter(x => x !== u.id);
      u.friends = [...new Set([...(u.friends || []), o.id])]; o.friends = [...new Set([...(o.friends || []), u.id])]; save(u); save(o);
      pushFriends(u.id); pushFriends(o.id); toast(`🤝 ${o.name} và em đã là bạn!`); const s = sockOf(o.id); if (s) s.emit('toast', `🤝 ${u.name} đã đồng ý kết bạn!`);
    }
    // ---------- nhóm & lời mời (chỉ giữa bạn bè / cùng nhóm) ----------
    const friendly = o => o && o.uid && u && ((u.friends || []).includes(o.uid) || (me.party && me.party === o.party));
    socket.on('invite', d => {
      if (!me || !d || slow(1500)) return; if (!u) return toast('👤 Đăng nhập để mời bạn nhé.');
      const kind = Object.prototype.hasOwnProperty.call(KINDS, d.kind) ? d.kind : null; if (!kind) return;
      let targets;
      if (d.to === 'party') { const p = me.party && parties.get(me.party); targets = p ? [...p.members].filter(x => x !== u.id).map(x => islanders.get(byUid.get(x))).filter(Boolean) : []; }
      else targets = [islanders.get(byUid.get(d.to))].filter(o => o && friendly(o));
      if (!targets.length) return toast('🙂 Chưa có bạn nào đang online để mời.');
      let pid = null;
      if (kind === 'party') { if (!me.party) { pid = rnd(4); parties.set(pid, { id: pid, leader: u.id, members: new Set([u.id]) }); me.party = pid; pushParty(parties.get(pid)); } pid = me.party; if (parties.get(pid).members.size >= 8) return toast('👥 Nhóm đã đủ 8 bạn.'); }
      for (const o of targets) if (visibleTo(o, me)) island.to(o.id).emit('invite', { kind, label: KINDS[kind], from: me.name, sid: me.id, pid, x: me.x, y: me.y, z: me.z });
      toast(`📨 Đã mời ${targets.length > 1 ? targets.length + ' bạn' : targets[0].name} ${KINDS[kind]}.`);
    });
    socket.on('party', d => {
      if (!me || !u || !d || slow()) return;
      if (d.op === 'join') { const p = parties.get(d.pid), lead = p && islanders.get(byUid.get(p.leader)); if (!p || !friendly(lead) && !(u.friends || []).some(f => p.members.has(f))) return toast('Nhóm không còn nữa.'); if (p.members.size >= 8) return toast('👥 Nhóm đã đủ 8 bạn.'); if (me.party !== p.id) leaveParty(me); me.party = p.id; p.members.add(u.id); pushParty(p); }
      else if (d.op === 'leave') { leaveParty(me); socket.emit('party', null); }
    });
    // ---------- chặn & báo cáo ----------
    socket.on('block', d => {
      if (!me || !d || slow()) return; const o = islanders.get(d.sid); if (!o || o === me) return;
      me.blockSids.add(o.id);
      if (u && o.uid) { u.blocked = [...new Set([...(u.blocked || []), o.uid])].slice(-144); u.friends = (u.friends || []).filter(x => x !== o.uid); const ou = user(o.uid); if (ou) { ou.friends = (ou.friends || []).filter(x => x !== u.id); save(ou); pushFriends(ou.id); } save(u); pushFriends(u.id); }
      socket.emit('left', o.id); island.to(o.id).emit('left', me.id); toast(`🚫 Đã chặn ${o.name}. Hai bạn sẽ không thấy nhau nữa.`);
    });
    socket.on('report', d => {
      if (!me || !d || slow(3000)) return; const o = islanders.get(d.sid); if (!o) return;
      const r = { id: rnd(6), at: Date.now(), from: me.name, fromUid: me.uid, target: o.name, targetUid: o.uid, reason: REASONS[d.reason | 0] || REASONS[3], pos: [Math.round(o.x), Math.round(o.z)] };
      db.put('reports', r.id, r); toast('🛡️ Cảm ơn em! Chủ game sẽ xem báo cáo này.');
      for (const a of islanders.values()) if (a.admin) island.to(a.id).emit('toast', `🛡️ Báo cáo mới: ${r.target} — ${r.reason}`);
    });
    // ---------- công cụ chủ game ----------
    socket.on('admin', d => {
      if (!me || !me.admin || !d) return; const o = d.sid && islanders.get(d.sid);
      if (d.op === 'hide') { me.hidden = !!d.on; if (me.hidden) socket.broadcast.emit('left', me.id); else for (const x of islanders.values()) if (x !== me && visibleTo(x, me)) island.to(x.id).emit('joined', pub(me)); toast(me.hidden ? '👻 Đang tàng hình.' : '👀 Đã hiện hình.'); }
      else if (d.op === 'gate' && o) { island.to(o.id).emit('goGate'); toast(`🏝️ Đã đưa ${o.name} về cổng.`); }
      else if (d.op === 'ban' && o && o.uid) { const ou = user(o.uid); ou.banned = true; save(ou); kick(o.uid, 'banned'); toast(`🔒 Đã khoá tài khoản ${o.name}.`); }
      else if (d.op === 'unban') { const ou = byName.get(String(d.name || '').trim().toLowerCase()); if (ou) { ou.banned = false; save(ou); toast(`🔓 Đã mở khoá ${ou.name}.`); } else toast('Không thấy tài khoản.'); }
      else if (d.op === 'reports') socket.emit('reports', db.all('reports').sort((a, b) => b.at - a.at).slice(0, 34));
      else if (d.op === 'clearReport') db.del('reports', String(d.id));
      else if (d.op === 'event') { EV.forced = ['treasure', 'race'].includes(d.kind) ? d.kind : null; EV.seed = -1; evTick(); toast(EV.kind ? `🎪 Bắt đầu sự kiện: ${EV.kind === 'race' ? 'Giải bay chổi' : 'Săn kho báu'}` : '🎪 Đã tắt sự kiện (về lịch cuối tuần).'); }
    });
    // ---------- sự kiện ----------
    socket.on('ev', d => {
      if (!me || !d || slow(800)) return;
      if (d.op === 'claim' && EV.kind === 'treasure') {
        const id = d.id | 0; if (id < 0 || id >= EV.n || EV.claimed.has(id)) return;
        if (Math.hypot(num(d.x, -1800, 1800) - me.x, num(d.z, -1800, 1800) - me.z) > 6) return toast('🧭 Lại gần rương hơn nữa nhé!');
        EV.claimed.add(id); island.emit('evClaim', { id, by: me.name });
        socket.emit('reward', { coins: 21, house: 8, why: 'Săn kho báu' });
        if (u) { if (!u.ev || u.ev.week !== wk()) u.ev = { week: wk(), pts: 0 }; u.ev.pts += 8; save(u); }
      } else if (d.op === 'race' && EV.kind === 'race') {
        const ms = Math.round(+d.ms); if (!(ms >= 15000 && ms <= 600000)) return;
        const key = me.uid || me.id, best = EV.race.get(key);
        if (!best || ms < best.ms) { EV.race.set(key, { name: me.name, ms }); toast(`🧹 Kỷ lục mới của em: ${(ms / 1000).toFixed(1)} giây!`); }
        socket.emit('reward', { coins: 13, house: 5, why: 'Về đích giải bay chổi' });
        if (u) { if (!u.ev || u.ev.week !== wk()) u.ev = { week: wk(), pts: 0 }; u.ev.pts += 5; save(u); }
      }
    });
    socket.on('disconnect', () => {
      if (!me) return; addPlay(me); leaveParty(me); islanders.delete(socket.id);
      if (u && byUid.get(u.id) === socket.id) { byUid.delete(u.id); for (const f of u.friends || []) pushFriends(f); }
      island.emit('left', socket.id);
    });
  });
  setInterval(() => { for (const m of islanders.values()) addPlay(m); evTick(); }, 30e3).unref();
  evTick();
  // ---------- Gói Phụ huynh, trang /parent, /admin, cổng thanh toán (server/billing.js) ----------
  const push = (uid, ev, data) => { const s = sockOf(uid); if (s) s.emit(ev, data); };
  eco = require('./economy')(api, { auth, user, save, push });   // 🪙 đồng vàng · 💎 kim cương hồng · đồ mở khoá (server/economy.js)
  billing = require('./billing')(app, api, { db, express, rateLimit, ADMIN_KEY, auth, user, save, hashPass, checkPass, rnd, sha, code6, deleteUser, push, usedMin, taskProgress, eco });
  return { db, island, islanders, hooks, billing };
};
