// economy.js — VÍ của học sinh trên máy chủ: 🪙 đồng vàng + 💎 kim cương hồng + đồ đã mở khoá + sức chứa cặp.
// Máy chủ là nguồn sự thật khi có mạng: client báo đồng vàng kiếm được (giới hạn tốc độ), MUA hàng thì máy chủ trừ tiền theo
// giá trong client/js/island/economy/catalog.js (đọc thẳng file dữ liệu đó — client không tự đặt giá được).
// 💎 chỉ tăng khi: phụ huynh thanh toán gói kim cương (server/billing.js gọi grantGems) hoặc chủ game tặng (/api/admin/gems).
// Hồ sơ gửi lên qua PUT /progress bị ghi đè số dư bằng ví ở đây (chống sửa localStorage để tăng tiền).
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = path.join(__dirname, '..', 'client', 'js', 'island', 'economy', 'catalog.js');
function loadCatalog() {   // file ES module chỉ có dữ liệu: bỏ chữ export rồi chạy trong vm cô lập
  const code = fs.readFileSync(SRC, 'utf8').replace(/^export\s+/gm, '') + '\n;({ ITEMS, FREE, START_GOLD, CAP0, CAP_UP })';
  return vm.runInNewContext(code, {}, { timeout: 500 });
}
const C = loadCatalog(), ITEM = Object.fromEntries(C.ITEMS.map(x => [x.id, x]));
// chống gian lận cơ bản: đồng vàng kiếm được tối đa 377 / 10 phút và 2584 / ngày (chơi rất chăm cũng không chạm tới)
const EARN_WIN = 10 * 60e3, EARN_MAX = 377, EARN_DAY = 2584;

module.exports = function setupEconomy(api, o) {
  const { auth, save, user, push } = o;
  const day = () => new Date(Date.now() + 7 * 36e5).toISOString().slice(0, 10);
  function wallet(u) {
    if (!u.wallet) {   // lần đầu: chuyển "xu" cũ trong hồ sơ thành đồng vàng (1 xu = 1 đồng vàng), giữ đồ đã có
      const p = (u.progress && u.progress.profile) || {};
      u.wallet = { gold: Number.isFinite(+p.money) ? Math.max(0, Math.min(99999, p.money | 0)) : C.START_GOLD, gems: 0, own: [...new Set([...(Array.isArray(p.own) ? p.own.filter(id => ITEM[id] && !(ITEM[id].price || {}).gem) : []), ...C.FREE])], cap: C.CAP0, earn: [], log: [] };
      save(u);
    }
    const w = u.wallet; w.own = w.own || []; w.cap = w.cap || C.CAP0; w.gems = w.gems | 0;
    return w;
  }
  const out = w => ({ gold: w.gold | 0, gems: w.gems | 0, own: w.own.slice(), cap: w.cap });
  const log = (w, e) => { w.log = (w.log || []).concat([{ t: Date.now(), ...e }]).slice(-89); };
  // áp ví lên hồ sơ (sau PUT /progress) — số dư & đồ trả tiền do máy chủ quyết
  function apply(u) {
    const w = wallet(u), p = u.progress && u.progress.profile; if (!p) return;
    p.money = w.gold; p.gems = w.gems; p.cap = w.cap; p.own = w.own.slice();
  }

  api.get('/wallet', auth, (req, res) => res.json({ wallet: out(wallet(req.user)) }));
  // client báo thay đổi đồng vàng: d > 0 kiếm được (giới hạn tốc độ), d < 0 tiêu ở cửa tiệm Phố Phép Thuật (giá động, có câu đố)
  api.post('/wallet/sync', auth, (req, res) => {
    const u = req.user, w = wallet(u), d = Math.round(+((req.body || {}).d) || 0); let capped = 0;
    if (d > 0) {
      const now = Date.now(); w.earn = (w.earn || []).filter(e => now - e.t < EARN_WIN);
      const win = w.earn.reduce((s, e) => s + e.n, 0), today = w.eday === day() ? w.etoday | 0 : 0;
      const ok = Math.max(0, Math.min(d, EARN_MAX - win, EARN_DAY - today)); capped = d - ok;
      if (ok) { w.earn.push({ t: now, n: ok }); w.gold += ok; w.eday = day(); w.etoday = today + ok; }
      if (capped) log(w, { k: 'cap', n: capped });
    } else if (d < 0) { w.gold = Math.max(0, w.gold + d); log(w, { k: 'spend', n: d }); }
    save(u); res.json({ wallet: out(w), capped });
  });
  // mua theo danh mục: máy chủ kiểm giá, trừ tiền, ghi đồ đã có
  api.post('/wallet/buy', auth, (req, res) => {
    const u = req.user, w = wallet(u), b = req.body || {}, id = String(b.id || '');
    if (id.startsWith('cap-')) {   // nâng sức chứa cặp
      const k = C.CAP_UP.findIndex(x => x.cap > w.cap); const up = C.CAP_UP[k];
      if (!up) return res.status(400).json({ error: 'Cặp đã to nhất rồi!' });
      if (w.gold < up.gold) return res.status(400).json({ error: `Cần ${up.gold} đồng vàng.`, wallet: out(w) });
      w.gold -= up.gold; w.cap = up.cap; log(w, { k: 'cap-up', cap: up.cap, gold: up.gold }); save(u); return res.json({ wallet: out(w) });
    }
    const it = ITEM[id]; if (!it || !it.price) return res.status(404).json({ error: 'Không có món này.' });
    if (w.own.includes(id)) return res.json({ wallet: out(w), already: true });
    const cur = b.cur === 'gem' ? 'gem' : 'gold', price = it.price[cur];
    if (!(price >= 0) || it.price[cur] == null) return res.status(400).json({ error: cur === 'gem' ? 'Món này mua bằng đồng vàng.' : 'Món đặc biệt này chỉ đổi bằng kim cương hồng.' });
    const bal = cur === 'gem' ? w.gems : w.gold; if (bal < price) return res.status(400).json({ error: cur === 'gem' ? 'Chưa đủ kim cương hồng.' : 'Chưa đủ đồng vàng.', wallet: out(w) });
    if (cur === 'gem') w.gems -= price; else w.gold -= price;
    w.own.push(id); log(w, { k: 'buy', id, [cur]: price }); save(u); res.json({ wallet: out(w) });
  });
  // gọi từ billing.js khi đơn kim cương đã thanh toán (IPN có chữ ký) hoặc chủ game tặng
  function grantGems(uid, n, why) {
    const u = user(uid); if (!u) return false; const w = wallet(u);
    w.gems = Math.min(99999, (w.gems | 0) + Math.max(0, n | 0)); log(w, { k: 'gems', n, why }); save(u);
    if (push) push(uid, 'wallet', Object.assign(out(w), { got: { gems: n, why } }));
    return true;
  }
  return { wallet, apply, grantGems, out, ITEM };
};
