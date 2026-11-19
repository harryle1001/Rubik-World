// premium.js — Khoá nội dung NHẸ NHÀNG của Gói Phụ huynh (server/billing.js quyết định quyền dùng).
// Nội dung khoá vẫn THẤY được; chạm vào thì hiện lời mời "Nhờ bố mẹ mở khoá" (mỗi tính năng 1 lần / 3 phút, còn lại chỉ 1 dòng nhắc).
// Trong game KHÔNG có nút mua, KHÔNG quảng cáo: chỉ sau CỔNG PHỤ HUYNH (câu hỏi người lớn) mới hiện địa chỉ trang Phụ huynh + mã liên kết.
// Dùng: if (ctx.premium && !ctx.premium.allow('academy')) return;   · tính năng: academy, magic, dragon, broom, board, glider, mg (opts.key), chapter (opts.n)
// Không có máy chủ (app chạy offline) → mở hết (chưa bán trong app). φ: thẻ 377 px, bo 21, chữ 13/16/21, biểu tượng 55.
const FEAT = {
  academy: ['🏰', 'Học viện Pha Lê', 'Lâu đài phép thuật bên kia biển: lớp học phép, rừng bí mật, phố phép thuật.'],
  magic: ['🪄', 'Phép thuật', 'Niệm phép bằng đũa thần: mỗi phép là một câu đố khoa học.'],
  dragon: ['🐉', 'Rồng & phượng hoàng', 'Thuần phục và cưỡi thú bay huyền thoại.'],
  broom: ['🧹', 'Chổi bay', 'Bay lượn khắp đảo trên cây chổi thần.'], board: ['🛹', 'Ván bay', 'Lướt ván bay trên mặt biển và mái nhà.'], glider: ['🪁', 'Diều lượn', 'Thả mình theo gió từ đỉnh núi.'],
  mg: ['🎮', 'Mini game', 'Toàn bộ mini game học tập của đảo.'], chapter: ['📖', 'Cốt truyện', 'Các chương tiếp theo của câu chuyện Đảo Rubik.'],
};
const DEF_FREE = { chapters: 2, mg: ['rubik', 'caro', 'fishing', 'fishing-boat', 'garden', 'library', 'reader-books', 'royal-library', 'quiz'] };

export function createPremium(ctx) {
  const acc = ctx.account, shown = new Map();
  let plan = null, gateOk = 0;
  const cur = () => plan || (acc.user && acc.user.plan) || null;
  const P = {
    on() { if (acc.online === false) return true; const p = cur(); return !!(p && p.on); },
    free() { const p = cur(); return (p && p.free) || DEF_FREE; },
    plan: cur,
    // true = được dùng; false = đã hiện lời mời (người gọi dừng lại)
    allow(feature, opts = {}) {
      if (P.on()) return true;
      if (feature === 'mg' && P.free().mg.includes(opts.key)) return true;
      if (feature === 'chapter' && (opts.n | 0) <= P.free().chapters) return true;
      invite(feature, opts); return false;
    },
    invite,
  };
  const css = document.createElement('style');
  css.textContent = `#pmBox{position:fixed;inset:0;z-index:45;display:grid;place-items:center;background:#0a1222b3;padding:13px}
#pmBox .card{width:min(100%,377px);box-sizing:border-box;background:#fff8ec;color:#3a2a1a;border-radius:21px;padding:21px;border-top:8px solid #c9a24a;box-shadow:0 13px 34px #0008;font:16px/1.5 system-ui;text-align:center}
#pmBox .big{font-size:55px;line-height:1.2}#pmBox h3{margin:5px 0 8px;font-size:21px}#pmBox p{margin:0 0 13px;font-size:15px}#pmBox small{font-size:13px;opacity:.75}
#pmBox button{width:100%;padding:13px;border-radius:13px;border:0;font:800 16px system-ui;cursor:pointer;margin-top:8px;background:#efe3cc;color:#3a2a1a}#pmBox button.pri{background:#f0a23a;color:#2a1a0a}
#pmBox input{width:100%;box-sizing:border-box;padding:13px;border-radius:13px;border:2px solid #d9c6a3;font:800 21px system-ui;text-align:center}
#pmBox .code{font:900 34px/1.3 ui-monospace,monospace;letter-spacing:8px;background:#fff;border-radius:13px;padding:8px;margin:8px 0}#pmBox .msg{min-height:21px;color:#b23a2a;font:700 13px system-ui}`;
  document.head.appendChild(css);
  const box = document.createElement('div'); box.id = 'pmBox'; box.hidden = true; document.body.appendChild(box);
  const close = () => { box.hidden = true; ctx.player && (ctx.player.frozen = false); };
  const openBox = html => { box.innerHTML = `<div class="card">${html}</div>`; box.hidden = false; ctx.player && (ctx.player.frozen = true); };
  box.addEventListener('keydown', e => e.stopPropagation()); box.addEventListener('keyup', e => e.stopPropagation());
  box.addEventListener('click', e => { if (e.target === box) close(); });

  function invite(feature, opts = {}) {
    const [ic, name, desc] = FEAT[feature] || FEAT.mg, label = opts.name || name, now = Date.now();
    if (now - (shown.get(feature) || 0) < 180e3) { ctx.toast && ctx.toast(`${ic} <b>${label}</b> mở khi bố mẹ bật Gói Phụ huynh 💛`, 2600); return; }
    shown.set(feature, now); ctx.sfx && ctx.sfx('ui');
    const p = cur(), trialOver = p && p.kind === null && acc.user && acc.user.plan && acc.user.plan.linked;
    openBox(`<div class="big">${ic}✨</div><h3>${label}</h3><p>${desc}</p><p><small>${trialOver ? 'Thời gian dùng thử đã hết.' : `Bố mẹ liên kết tài khoản là em được <b>dùng thử ${(p && p.trialDays) || 7} ngày</b> toàn bộ!`} Phần miễn phí vẫn chơi thoải mái nhé.</small></p>
      <button class="pri" data-a="ask">👪 Nhờ bố mẹ mở khoá</button><button data-a="no">Để sau</button>`);
    box.querySelector('[data-a=ask]').onclick = gate; box.querySelector('[data-a=no]').onclick = close;
  }
  // CỔNG PHỤ HUYNH: phép nhân 2 chữ số (người lớn tính nhẩm được, trẻ nhỏ khó đoán) — qua cổng mới thấy địa chỉ web & mã liên kết
  function gate() {
    if (Date.now() - gateOk < 600e3) return parentInfo();
    const a = 12 + Math.floor(Math.random() * 13), b = 13 + Math.floor(Math.random() * 8);
    openBox(`<div class="big">🔐</div><h3>Dành cho bố mẹ</h3><p>Em đưa máy cho bố mẹ nhé! Bố mẹ trả lời giúp:</p><p style="font-size:21px"><b>${a} × ${b} = ?</b></p><input id="pmAns" inputmode="numeric" maxlength="4" autocomplete="off"><div class="msg"></div><button class="pri" data-a="ok">Tiếp tục</button><button data-a="no">Huỷ</button>`);
    const inp = box.querySelector('#pmAns'); setTimeout(() => inp.focus(), 50);
    const ok = () => { if (+inp.value === a * b) { gateOk = Date.now(); parentInfo(); } else { box.querySelector('.msg').textContent = 'Chưa đúng. Hãy nhờ bố mẹ nhé!'; inp.value = ''; setTimeout(close, 1618); } };
    box.querySelector('[data-a=ok]').onclick = ok; inp.onkeydown = e => { if (e.key === 'Enter') ok(); }; box.querySelector('[data-a=no]').onclick = close;
  }
  async function parentInfo() {
    const url = location.origin + '/parent';
    if (!acc.cloud) { openBox(`<div class="big">👪</div><h3>Chào bố mẹ!</h3><p>Bé đang chơi <b>khách</b>. Hãy cùng bé <b>tạo tài khoản</b> (👤 góc trên), sau đó mở trang Phụ huynh:</p><p><b>${url.replace(/^https?:\/\//, '')}</b></p><button class="pri" data-a="go">Mở trang Phụ huynh</button><button data-a="no">Đóng</button>`); }
    else {
      openBox(`<div class="big">👪</div><h3>Chào bố mẹ!</h3><p>1) Mở <b>${url.replace(/^https?:\/\//, '')}</b> và tạo tài khoản phụ huynh.<br>2) Nhập mã liên kết của bé:</p><div class="code" id="pmCode">…</div><small id="pmExp">Mã dùng trong 30 phút.</small><p style="margin-top:13px"><small>Không quảng cáo · không vật phẩm may rủi · gói không tự gia hạn.</small></p><button class="pri" data-a="go">Mở trang Phụ huynh</button><button data-a="no">Đóng</button>`);
      const r = await acc.api('/link-code', {}); const el = box.querySelector('#pmCode'); if (el) el.textContent = r.code || '—'; if (!r.code && box.querySelector('#pmExp')) box.querySelector('#pmExp').textContent = r.error || 'Chưa lấy được mã, thử lại sau.';
    }
    box.querySelector('[data-a=go]').onclick = () => { window.open(url, '_blank', 'noopener'); close(); };
    box.querySelector('[data-a=no]').onclick = close;
  }
  P.parentGate = gate;   // account-hud.js: nút "👪 Mã liên kết phụ huynh"
  // server báo đổi quyền (phụ huynh vừa thanh toán / liên kết / hết hạn)
  if (ctx.net && ctx.net.on) ctx.net.on('plan', e => { const was = P.on(); plan = e; if (acc.user) acc.user.plan = e; if (!was && e && e.on) { ctx.toast && ctx.toast(e.kind === 'trial' ? '🎁 Bố mẹ đã liên kết! Em được dùng thử toàn bộ đảo — Học viện Pha Lê đang chờ!' : '🎉 Bố mẹ đã mở khoá Gói Phụ huynh! Cảm ơn bố mẹ nhé 💛', 5500); ctx.sfx && ctx.sfx('ok'); } });
  acc.onChange(() => { if (!acc.cloud) plan = null; });
  return P;
}
