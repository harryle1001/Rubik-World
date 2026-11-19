// affiliate.js — "Gợi ý cho con": sách/đồ học tập theo môn con đang yếu, CHỈ hiện cho người lớn
// (trang /parent, email tóm tắt tuần, bài Góc phụ huynh). Không bao giờ hiện trong game.
// Danh sách sản phẩm: chủ game sửa ở /admin. Mã affiliate: biến môi trường (mẫu link có {url}) — xem docs/ads.md.
const { safeEq } = require('./pay-gateways');
const env = process.env;
const SUBJECTS = ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Khoa học', 'Sử–Địa'];
const SHOPS = { shopee: 'Shopee', tiki: 'Tiki', fahasa: 'Fahasa', khac: 'Cửa hàng' };
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const NOTE = 'Liên kết giới thiệu: Trường Rubik có thể nhận hoa hồng nhỏ khi bạn mua qua liên kết này, giá với bạn không đổi.';
// gợi ý ban đầu (trang tìm kiếm, chưa gắn mã) — chủ game thay bằng sản phẩm cụ thể ở /admin
const SEED = [
  ['Toán', 'Sách bài tập Toán theo lớp', 'fahasa', 'https://www.fahasa.com/searchengine?q=b%C3%A0i+t%E1%BA%ADp+to%C3%A1n+l%E1%BB%9Bp'],
  ['Toán', 'Thẻ học bảng cửu chương', 'shopee', 'https://shopee.vn/search?keyword=th%E1%BA%BB%20h%E1%BB%8Dc%20b%E1%BA%A3ng%20c%E1%BB%ADu%20ch%C6%B0%C6%A1ng'],
  ['Tiếng Việt', 'Vở luyện viết chữ đẹp', 'tiki', 'https://tiki.vn/search?q=v%E1%BB%9F+luy%E1%BB%87n+vi%E1%BA%BFt+ch%E1%BB%AF+%C4%91%E1%BA%B9p'],
  ['Tiếng Việt', 'Truyện đọc thiếu nhi', 'fahasa', 'https://www.fahasa.com/searchengine?q=truy%E1%BB%87n+thi%E1%BA%BFu+nhi'],
  ['Tiếng Anh', 'Từ điển tranh Anh – Việt cho bé', 'tiki', 'https://tiki.vn/search?q=t%E1%BB%AB+%C4%91i%E1%BB%83n+tranh+anh+vi%E1%BB%87t'],
  ['Khoa học', 'Bách khoa tri thức cho trẻ em', 'fahasa', 'https://www.fahasa.com/searchengine?q=b%C3%A1ch+khoa+tri+th%E1%BB%A9c+tr%E1%BA%BB+em'],
  ['Sử–Địa', 'Bản đồ Việt Nam cho trẻ em', 'shopee', 'https://shopee.vn/search?keyword=b%E1%BA%A3n%20%C4%91%E1%BB%93%20vi%E1%BB%87t%20nam%20cho%20b%C3%A9'],
  ['*', 'Rubik 3×3 cho người mới', 'tiki', 'https://tiki.vn/search?q=rubik+3x3'],
];

function setupAff(app, { db, express, ADMIN_KEY }) {
  if (!db.get('affmeta', 'seed')) { SEED.forEach(([subject, title, shop, url], i) => db.put('aff', 'a' + i, { id: 'a' + i, subject, title, shop, url, on: true, clicks: 0, at: Date.now() })); db.put('affmeta', 'seed', { at: Date.now() }); }
  // link cuối: mẫu affiliate theo cửa hàng (AFF_SHOPEE / AFF_TIKI / AFF_FAHASA), VD https://go.isclix.com/deep_link/<mã>?url={url}
  const tpl = shop => env['AFF_' + String(shop).toUpperCase()] || '';
  const outUrl = it => { const t = tpl(it.shop); return t && t.includes('{url}') ? t.replace('{url}', encodeURIComponent(it.url)) : it.url; };
  const items = () => db.all('aff').filter(x => x.on && /^https:\/\//.test(x.url));
  const weekSeed = () => Math.floor(Date.now() / (7 * 864e5));
  function picks(subjects, n = 3) {   // ưu tiên môn yếu; thiếu thì thêm gợi ý chung ('*'); xoay vòng theo tuần
    const want = subjects.filter(s => SUBJECTS.includes(s)), all = items(), out = [];
    const rot = a => { const k = a.length ? weekSeed() % a.length : 0; return a.slice(k).concat(a.slice(0, k)); };
    for (const s of want) for (const it of rot(all.filter(x => x.subject === s))) if (out.length < n && !out.includes(it) && out.filter(o => o.subject === s).length < 2) out.push(it);
    if (want.length) for (const it of rot(all.filter(x => x.subject === '*'))) if (out.length < n) out.push(it);
    return out.slice(0, n).map(it => ({ id: it.id, subject: it.subject, title: it.title, shop: SHOPS[it.shop] || it.shop, href: '/go/' + it.id }));
  }
  const weakSubjects = r => [...new Set([...(r.weak || []).map(w => String(w.topic).split(' · ')[0].replace(/ \(chung\)$/, '')),
    ...(r.subjects || []).filter(s => s.n >= 3 && s.ok / s.n < 0.7).map(s => s.subject)])];
  const card = (p, base = '') => `<a href="${esc(base + p.href)}" rel="sponsored nofollow noopener" target="_blank" style="display:block;padding:13px 21px;border:2px solid #e6dccb;border-radius:13px;margin:8px 0;color:#2e2418;text-decoration:none;background:#fff"><b>${esc(p.title)}</b><br><small style="color:#7a6a58">${p.subject === '*' ? 'Gợi ý chung' : 'Môn ' + esc(p.subject)} · ${esc(p.shop)} ↗</small></a>`;
  const block = (list, base = '', title = '🎁 Gợi ý cho con') => (list.length ? `<div class="aff" style="margin-top:21px"><h3 style="margin:0 0 5px">${title}</h3>${list.map(p => card(p, base)).join('')}<p style="font-size:12px;color:#7a6a58;margin:5px 0 0">🔗 ${NOTE}</p></div>` : '');

  // bấm link → đếm lượt rồi chuyển sang cửa hàng (không lưu thông tin người bấm)
  app.get('/go/:id', (req, res) => {
    const it = db.get('aff', req.params.id); if (!it || !it.on || !/^https:\/\//.test(it.url)) return res.status(404).send('Liên kết không còn.');
    it.clicks = (it.clicks | 0) + 1; db.put('aff', it.id, it); res.set('X-Robots-Tag', 'noindex'); res.redirect(302, outUrl(it));
  });
  // quản trị: /api/admin/aff (mã chủ game)
  const r = express.Router();
  r.use(express.json({ limit: '10kb' }), (req, res, next) => (safeEq(String(req.headers['x-admin-key'] || '').trim().toUpperCase(), String(ADMIN_KEY).toUpperCase()) ? next() : res.status(401).json({ error: 'Sai mã chủ game.' })));
  r.get('/', (req, res) => res.json({ items: db.all('aff').sort((a, b) => b.at - a.at), subjects: SUBJECTS, shops: SHOPS, tagged: Object.keys(SHOPS).filter(s => tpl(s)) }));
  r.post('/', (req, res) => {
    const b = req.body || {}, url = String(b.url || '').trim();
    if (!/^https:\/\/[^\s]+$/.test(url) || url.length > 600) return res.status(400).json({ error: 'Link phải bắt đầu bằng https://' });
    const id = b.id && db.get('aff', b.id) ? b.id : 'x' + Date.now().toString(36), old = db.get('aff', id) || { clicks: 0, at: Date.now() };
    const it = Object.assign(old, { id, subject: SUBJECTS.includes(b.subject) ? b.subject : '*', title: String(b.title || '').trim().slice(0, 80) || 'Gợi ý', shop: SHOPS[b.shop] ? b.shop : 'khac', url, on: b.on !== false });
    db.put('aff', id, it); res.json({ ok: true, item: it });
  });
  r.delete('/:id', (req, res) => { db.del('aff', req.params.id); res.json({ ok: true }); });
  app.use('/api/admin/aff', r);

  const api = {
    picks, weakSubjects,
    forReport: rep => picks(weakSubjects(rep)),
    emailHtml: rep => (env.PUBLIC_URL ? block(picks(weakSubjects(rep)), env.PUBLIC_URL.replace(/\/$/, ''), '🎁 Gợi ý cho con (theo phần cần luyện)') : ''),
    blogBlock: tags => block(picks((tags || []).filter(t => SUBJECTS.includes(t)), 2)),
  };
  module.exports.current = api;
  return api;
}
module.exports = setupAff;
module.exports.current = null;
module.exports.NOTE = NOTE;
