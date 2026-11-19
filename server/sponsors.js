// sponsors.js — NHÀ TÀI TRỢ: cấu hình cho đảo 3D (/api/sp/config), quản trị (/api/sp/admin, mã ADMIN_KEY), logo, lịch chạy.
// An toàn trẻ em (Luật Quảng cáo 2012 & Luật Trẻ em 2016): chỉ ngành hàng phù hợp trẻ, chặn từ khoá cấm, phải DUYỆT mới lên đảo,
// sửa nội dung → về "chờ duyệt"; link chỉ https và chỉ hiện sau cổng phụ huynh (client). Không lưu dữ liệu người chơi.
// Kho: db (SQLite/Postgres) — bộ sưu tập sp_sponsors, sp_logos, sp_book (lịch chạy), sp_stats (báo cáo gộp, phần 3).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CATS = { sach: 'Sách & truyện', dodung: 'Đồ dùng học tập', giaoduc: 'Giáo dục / lớp học', dochoi: 'Đồ chơi trí tuệ', thuvien: 'Thư viện', baotang: 'Bảo tàng / khoa học', vanhoa: 'Văn hoá – nghệ thuật thiếu nhi', thethao: 'Thể thao thiếu nhi' };
// từ khoá cấm (Luật Quảng cáo đ.7; quảng cáo hướng tới trẻ em): rượu bia, thuốc lá, cờ bạc, vay, sữa thay thế sữa mẹ < 24 tháng, thuốc, TPCN, hẹn hò…
const BANNED = /(rượu|ruou|\bbia\b|beer|wine|thuốc lá|thuoc la|vape|shisha|cá cược|ca cuoc|cờ bạc|co bac|casino|xổ số|xo so|lô đề|lo de|game bài|game bai|nổ hũ|no hu|đánh bạc|vay\b|tín dụng|tin dung|cầm đồ|sữa công thức|sua cong thuc|thuốc\b|thực phẩm chức năng|tpcn|giảm cân|mỹ phẩm|hẹn hò|hen ho|dating|vũ khí|vu khi|súng|sung\b|crypto|tiền ảo|đa cấp)/i;
const DAY = 864e5, vnDay = (t = Date.now()) => new Date(t + 7 * 3600e3).toISOString().slice(0, 10);   // ngày theo giờ Việt Nam
const clean = (s, n) => String(s ?? '').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, n);
const safeEq = (a, b) => { const A = Buffer.from(String(a || '')), B = Buffer.from(String(b || '')); return A.length === B.length && A.length > 0 && crypto.timingSafeEqual(A, B); };

module.exports = function sponsors(app, { db, express, rateLimit, ADMIN_KEY, ROOT }) {
  const SLOTS = JSON.parse(fs.readFileSync(path.join(ROOT, 'client', 'sponsors', 'slots.json'), 'utf8'));
  const slotOf = id => SLOTS.find(s => s.id === id);

  // ---------- kiểm tra nội dung (dùng khi lưu & khi duyệt) ----------
  function problems(sp) {
    const out = [], txt = [sp.name, sp.msg, sp.about, ...(sp.quest || []).flatMap(q => [q.q, ...q.a, q.explain])].join(' \n ');
    if (!sp.name) out.push('Thiếu tên.'); if (!CATS[sp.cat]) out.push('Ngành hàng không thuộc danh sách phù hợp trẻ em.');
    const m = txt.match(BANNED); if (m) out.push(`Có từ không phù hợp trẻ em: "${m[0]}".`);
    if (sp.link && !/^https:\/\/[^\s]+$/.test(sp.link)) out.push('Link phải bắt đầu bằng https://');
    if (sp.quest && sp.quest.length && sp.quest.length !== 3) out.push('Nhiệm vụ tài trợ cần đúng 3 câu đố.');
    if (!sp.logo) out.push('Chưa có logo.');
    return out;
  }
  function parse(b, old = {}) {
    const quest = Array.isArray(b.quest) ? b.quest.slice(0, 3).map(q => ({ q: clean(q && q.q, 144), a: (Array.isArray(q && q.a) ? q.a : []).slice(0, 4).map(x => clean(x, 55)).filter(Boolean), c: Math.max(0, q && q.c | 0), s: clean(q && q.s, 21) || 'Khác', explain: clean(q && q.explain, 144) })).filter(q => q.q && q.a.length >= 2 && q.c < q.a.length) : [];
    return { ...old, name: clean(b.name, 34), cat: CATS[b.cat] ? b.cat : '', color: /^#[0-9a-f]{6}$/i.test(b.color) ? b.color : '#2c8f82', msg: clean(b.msg, 55), about: clean(b.about, 144),
      link: clean(b.link, 233), quest, reward: Math.min(5, Math.max(1, b.reward | 0 || 3)), contact: clean(b.contact, 89), note: clean(b.note, 233) };
  }
  const pubSp = sp => ({ id: sp.id, name: sp.name, cat: sp.cat, color: sp.color, msg: sp.msg, about: sp.about, link: sp.link || undefined, quest: sp.quest, reward: sp.reward,
    logo: sp.logo ? `/api/sp/logo/${sp.id}?v=${sp.logo}` : undefined, logoNight: sp.logoNight ? `/api/sp/logo/${sp.id}-n?v=${sp.logoNight}` : undefined });
  // lịch chạy đang hiệu lực hôm nay (mỗi vị trí 1 nhà tài trợ đã duyệt)
  function live(day = vnDay()) {
    const list = [], used = new Map();
    for (const b of db.all('sp_book')) {
      const sp = db.get('sp_sponsors', b.sp); if (!sp || sp.status !== 'approved' || b.from > day || b.to < day || !slotOf(b.slot) || list.some(x => x.slot === b.slot)) continue;
      list.push({ slot: b.slot, sp: sp.id }); used.set(sp.id, sp);
    }
    return { list, sponsors: [...used.values()] };
  }

  // ---------- công khai: cấu hình cho đảo + logo ----------
  app.get('/api/sp/config', (req, res) => { const L = live(); res.set('Cache-Control', 'public, max-age=300'); res.json({ v: 1, slots: SLOTS.map(({ id, name, zone, kind }) => ({ id, name, zone, kind })), sponsors: L.sponsors.map(pubSp), list: L.list }); });
  app.get('/api/sp/logo/:id', (req, res) => {
    const L = db.get('sp_logos', String(req.params.id)); if (!L) return res.status(404).end();
    res.set('Cache-Control', 'public, max-age=604800, immutable'); res.set('X-Content-Type-Options', 'nosniff'); res.type(L.type).send(Buffer.from(L.b64, 'base64'));
  });

  // ---------- đếm gộp ẩn danh từ đảo: chỉ số theo ngày × nhà tài trợ × vị trí (không IP, không id người chơi) ----------
  const K = { i: 21, v: 8, o: 8, qs: 5, qd: 3 };   // trần mỗi lô / vị trí (chống thổi phồng)
  app.post('/api/sp/hit', rateLimit({ windowMs: 60e3, limit: 13, standardHeaders: 'draft-7', legacyHeaders: false }), express.json({ limit: '4kb' }), (req, res) => {
    const b = req.body && typeof req.body.b === 'object' ? req.body.b : null; if (!b) return res.status(400).end();
    const day = vnDay(), L = new Map(live(day).list.map(x => [x.slot, x.sp]));
    for (const [slot, c] of Object.entries(b).slice(0, 16)) {
      const sp = L.get(slot); if (!sp || !c || typeof c !== 'object') continue;
      const id = `${day}|${sp}|${slot}`, row = db.get('sp_stats', id) || { day, sp, slot, i: 0, v: 0, o: 0, qs: 0, qd: 0 };
      let any = false; for (const k in K) { const n = Math.min(K[k], Math.max(0, c[k] | 0)); if (n) { row[k] += n; any = true; } }
      if (any) db.put('sp_stats', id, row);
    }
    res.status(204).end();
  });
  function report(sp, from, to) {
    const rows = db.all('sp_stats').filter(r => (!sp || r.sp === sp) && r.day >= from && r.day <= to).sort((a, b) => a.day.localeCompare(b.day) || a.slot.localeCompare(b.slot));
    const tot = { i: 0, v: 0, o: 0, qs: 0, qd: 0 }, bySlot = {}, byDay = {};
    for (const r of rows) for (const k in tot) { tot[k] += r[k]; (bySlot[r.slot] = bySlot[r.slot] || { i: 0, v: 0, o: 0, qs: 0, qd: 0 })[k] += r[k]; (byDay[r.day] = byDay[r.day] || { i: 0, v: 0, o: 0, qs: 0, qd: 0 })[k] += r[k]; }
    return { rows, tot, bySlot, byDay };
  }

  // ---------- quản trị (x-admin-key) ----------
  const adm = express.Router();
  adm.use(express.json({ limit: '400kb' }), rateLimit({ windowMs: 15 * 60e3, limit: 377, standardHeaders: 'draft-7', legacyHeaders: false }));
  adm.use((req, res, next) => safeEq(String(req.headers['x-admin-key'] || '').trim().toUpperCase(), String(ADMIN_KEY).toUpperCase()) ? next() : res.status(401).json({ error: 'Sai mã chủ game.' }));
  const state = () => ({ slots: SLOTS, cats: CATS, today: vnDay(), sponsors: db.all('sp_sponsors').sort((a, b) => b.at - a.at).map(sp => ({ ...sp, problems: problems(sp), logoUrl: sp.logo ? `/api/sp/logo/${sp.id}?v=${sp.logo}` : null, logoNightUrl: sp.logoNight ? `/api/sp/logo/${sp.id}-n?v=${sp.logoNight}` : null })),
    book: db.all('sp_book').sort((a, b) => a.slot.localeCompare(b.slot) || a.from.localeCompare(b.from)), live: live().list });
  adm.get('/', (req, res) => res.json(state()));
  adm.post('/sponsor', (req, res) => {
    const b = req.body || {}, old = b.id ? db.get('sp_sponsors', String(b.id)) : null; if (b.id && !old) return res.status(404).json({ error: 'Không thấy nhà tài trợ.' });
    const sp = parse(b, old || { id: crypto.randomBytes(5).toString('hex'), created: Date.now() });
    const changed = !old || ['name', 'cat', 'color', 'msg', 'about', 'link', 'reward'].some(k => old[k] !== sp[k]) || JSON.stringify(old.quest) !== JSON.stringify(sp.quest);
    if (changed) sp.status = 'pending';   // sửa nội dung → duyệt lại
    sp.at = Date.now(); db.put('sp_sponsors', sp.id, sp); res.json({ ok: true, id: sp.id, ...state() });
  });
  adm.post('/sponsor/:id/logo', (req, res) => {
    const sp = db.get('sp_sponsors', req.params.id); if (!sp) return res.status(404).json({ error: 'Không thấy nhà tài trợ.' });
    const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String((req.body || {}).data || '')); if (!m) return res.status(400).json({ error: 'Logo phải là ảnh PNG/JPEG/WebP.' });
    if (m[2].length > 380e3) return res.status(400).json({ error: 'Logo quá lớn (tối đa ~280 KB, 512 px).' });
    const night = !!(req.body || {}).night, h = crypto.createHash('sha1').update(m[2]).digest('hex').slice(0, 10);
    db.put('sp_logos', sp.id + (night ? '-n' : ''), { type: m[1], b64: m[2] }); sp[night ? 'logoNight' : 'logo'] = h; sp.status = 'pending'; sp.at = Date.now(); db.put('sp_sponsors', sp.id, sp); res.json({ ok: true, ...state() });
  });
  adm.post('/sponsor/:id/status', (req, res) => {
    const sp = db.get('sp_sponsors', req.params.id); if (!sp) return res.status(404).json({ error: 'Không thấy nhà tài trợ.' });
    const to = ['approved', 'paused', 'rejected', 'pending'].includes((req.body || {}).status) ? req.body.status : null; if (!to) return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
    if (to === 'approved') { const p = problems(sp); if (p.length) return res.status(400).json({ error: 'Chưa duyệt được: ' + p.join(' ') }); sp.approvedAt = Date.now(); }
    sp.status = to; sp.reviewNote = clean((req.body || {}).note, 233); db.put('sp_sponsors', sp.id, sp); res.json({ ok: true, ...state() });
  });
  adm.delete('/sponsor/:id', (req, res) => {
    const id = String(req.params.id); db.del('sp_sponsors', id); db.del('sp_logos', id); db.del('sp_logos', id + '-n');
    for (const b of db.all('sp_book')) if (b.sp === id) db.del('sp_book', b.id); res.json({ ok: true, ...state() });
  });
  adm.post('/book', (req, res) => {
    const b = req.body || {}, slot = slotOf(b.slot), sp = db.get('sp_sponsors', String(b.sp || '')), d = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '') ? s : null, from = d(b.from), to = d(b.to);
    if (!slot || !sp || !from || !to || from > to) return res.status(400).json({ error: 'Chọn vị trí, nhà tài trợ và khoảng ngày hợp lệ.' });
    const clash = db.all('sp_book').find(x => x.slot === slot.id && !(x.to < from || x.from > to)); if (clash) { const o = db.get('sp_sponsors', clash.sp); return res.status(409).json({ error: `Trùng lịch với ${o ? o.name : 'nhà tài trợ khác'} (${clash.from} → ${clash.to}).` }); }
    const days = Math.round((Date.parse(to) - Date.parse(from)) / DAY) + 1, id = crypto.randomBytes(4).toString('hex');
    db.put('sp_book', id, { id, slot: slot.id, sp: sp.id, from, to, price: Math.round(slot.price * days / 30 / 1000) * 1000, at: Date.now() }); res.json({ ok: true, ...state() });
  });
  adm.delete('/book/:id', (req, res) => { db.del('sp_book', String(req.params.id)); res.json({ ok: true, ...state() }); });
  adm.get('/report', (req, res) => {
    const d = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '') ? s : null, to = d(req.query.to) || vnDay(), from = d(req.query.from) || vnDay(Date.parse(to) - 29 * DAY), spId = clean(req.query.sp, 21);
    const sp = spId && db.get('sp_sponsors', spId), R = report(spId, from, to), name = id => (slotOf(id) || {}).name || id;
    if (req.query.fmt !== 'csv') return res.json({ from, to, sp: sp ? { id: sp.id, name: sp.name } : null, ...R, slotNames: Object.fromEntries(SLOTS.map(s => [s.id, s.name])) });
    const q = v => `"${String(v).replace(/"/g, '""')}"`, spName = id => (db.get('sp_sponsors', id) || {}).name || id;
    const lines = [['Ngày', 'Nhà tài trợ', 'Vị trí', 'Lượt hiển thị (≥1 s)', 'Lượt ghé (≤8 m)', 'Mở thẻ thông tin', 'Bắt đầu nhiệm vụ', 'Hoàn thành nhiệm vụ'].map(q).join(',')];
    for (const r of R.rows) lines.push([r.day, spName(r.sp), name(r.slot), r.i, r.v, r.o, r.qs, r.qd].map(q).join(','));
    lines.push(['Tổng', sp ? sp.name : 'Tất cả', '', R.tot.i, R.tot.v, R.tot.o, R.tot.qs, R.tot.qd].map(q).join(','));
    res.set('Content-Disposition', `attachment; filename="bao-cao-tai-tro-${spId || 'tat-ca'}-${from}-${to}.csv"`); res.type('text/csv; charset=utf-8').send('\ufeff' + lines.join('\r\n'));
  });
  app.use('/api/sp/admin', adm);
  app.get('/admin/sponsors', (req, res) => res.sendFile(path.join(ROOT, 'client', 'admin-sponsors.html')));
  return { live, SLOTS, CATS, adm, state, report };
};
