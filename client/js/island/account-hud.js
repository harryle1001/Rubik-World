// account-hud.js — Lớp HUD đăng nhập của đảo 3D (thay hộp đăng nhập của game 2D trong iframe trước đây).
// Chip góc phải trên: 👤 tên · Lv · 🪙 xu → bấm mở bảng: Đăng nhập / Tạo tài khoản / Chơi khách, ô "Lưu đăng nhập".
// Đã lưu đăng nhập → vào thẳng. Kích thước theo φ: bo góc 13/21, đệm 13/21, chữ 13/16/21.
import { createAccount } from './data/account.js';

export function createAccountHud(ctx) {
  const acc = ctx.account = createAccount();
  const css = document.createElement('style');
  css.textContent = `#accChip{padding:5px 13px;border-radius:13px;border:2px solid #fff5;background:#1b1626aa;color:#fff;font:700 13px/1.3 system-ui;cursor:pointer;max-width:62vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#accChip b{color:#ffd36e}
#accBox{position:fixed;inset:0;z-index:40;display:grid;place-items:center;background:#0a1222b3;padding:13px}
#accBox .card{width:min(100%,377px);box-sizing:border-box;background:#fff8ec;color:#3a2a1a;border-radius:21px;padding:21px;border-top:8px solid #f0a23a;box-shadow:0 13px 34px #0008;font:16px/1.5 system-ui}
#accBox h3{margin:0 0 8px;font-size:21px}#accBox p{margin:0 0 13px;font-size:13px;opacity:.75}
#accBox label{display:block;font:700 13px system-ui;margin:8px 0 3px}
#accBox input[type=text],#accBox input[type=password]{width:100%;box-sizing:border-box;padding:10px 13px;border-radius:13px;border:2px solid #d9c6a3;background:#fff;font:600 16px system-ui;color:#3a2a1a}
#accBox .rem{display:flex;gap:8px;align-items:center;margin:13px 0;font:600 13px system-ui;cursor:pointer}
#accBox .row{display:flex;gap:8px;flex-wrap:wrap}#accBox .row button{flex:1 1 30%;padding:12px 8px;border-radius:13px;border:2px solid transparent;background:#efe3cc;color:#3a2a1a;font:800 15px system-ui;cursor:pointer}
#accBox .row button.pri{background:#f0a23a;color:#2a1a0a}#accBox .msg{min-height:21px;margin:8px 0 0;color:#b23a2a;font:700 13px system-ui}
#accBox .stat{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:13px 0}#accBox .stat div{background:#f3e6cc;border-radius:13px;padding:8px 13px;font:700 13px system-ui}#accBox .stat b{display:block;font-size:21px}
body.rs-modal #accChip,body.mg-on #accChip{display:none}`;
  document.head.appendChild(css);
  const row = document.getElementById('chipRow') || (() => { const r = document.createElement('div'); r.id = 'chipRow'; document.body.appendChild(r); const st = document.createElement('style'); st.textContent = `#chipRow{position:fixed;z-index:26;left:max(12px,env(safe-area-inset-left));top:calc(max(12px,env(safe-area-inset-top)) + 47px);display:flex;flex-wrap:wrap;gap:8px;max-width:calc(100vw - 80px);pointer-events:none}#chipRow>*{pointer-events:auto}body.rs-modal #chipRow,body.mg-on #chipRow{display:none}`; document.head.appendChild(st); return r; })();
  const chip = document.createElement('div'); chip.id = 'accChip'; chip.style.order = 1; chip.setAttribute('role', 'button'); chip.tabIndex = 0; row.appendChild(chip);
  const box = document.createElement('div'); box.id = 'accBox'; box.hidden = true; document.body.appendChild(box);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const render = () => {
    const p = acc.profile;
    chip.innerHTML = p ? `${acc.guest ? '🙂' : '👤'} ${esc(acc.name)} · Lv ${p.level} · 🪙 <b>${p.money | 0}</b>` : '👤 Đăng nhập';
    if (p && !acc.guest) { ctx.playerName = acc.name; try { localStorage.setItem('island.name', acc.name); } catch (e) {} }
  };
  acc.onChange(render);
  const close = () => { box.hidden = true; ctx.player && (ctx.player.frozen = false); };
  const open = () => {
    const p = acc.profile;
    if (p && !acc.guest) {
      const items = Object.keys(p.inv || {}).length;
      box.innerHTML = `<div class="card"><h3>👤 ${esc(acc.name)}</h3><p>Tài khoản lưu trên máy này${acc.migrated ? ' (đã chuyển từ Trường Rubik 2D)' : ''}.</p>
        <div class="stat"><div>Cấp độ<b>${p.level}</b></div><div>Xu<b>🪙 ${p.money | 0}</b></div><div>Kinh nghiệm<b>${p.exp | 0}/${acc.needExp(p.level)}</b></div><div>Vật phẩm<b>🎒 ${items}</b></div></div>
        <div class="row"><button class="pri" data-a="close">Chơi tiếp</button><button data-a="out">Đăng xuất</button></div></div>`;
    } else {
      box.innerHTML = `<div class="card"><h3>🏝️ Đảo Rubik</h3><p>Đăng nhập để lưu cấp độ, xu và đồ của bạn. Đừng dùng mật khẩu thật ở nơi khác nhé.</p>
        <label for="accName">Tên đăng nhập</label><input type="text" id="accName" maxlength="20" autocomplete="username" value="${esc(acc.lastName())}">
        <label for="accPass">Mật khẩu</label><input type="password" id="accPass" maxlength="40" autocomplete="current-password">
        <label class="rem"><input type="checkbox" id="accRem" checked> Lưu đăng nhập (lần sau vào thẳng)</label>
        <div class="row"><button class="pri" data-a="in">Đăng nhập</button><button data-a="new">Tạo tài khoản</button><button data-a="guest">Chơi khách</button></div>
        <div class="msg" aria-live="polite"></div></div>`;
      setTimeout(() => { const n = box.querySelector('#accName'); (n.value ? box.querySelector('#accPass') : n).focus(); }, 50);
    }
    box.hidden = false; ctx.player && (ctx.player.frozen = true);
  };
  box.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' && box.querySelector('#accPass')) box.querySelector('[data-a=in]').click(); if (e.key === 'Escape') close(); });
  box.addEventListener('keyup', e => e.stopPropagation());
  box.addEventListener('click', async e => {
    const a = e.target.dataset && e.target.dataset.a; if (!a) { if (e.target === box && acc.profile) close(); return; }
    const msg = box.querySelector('.msg'), v = id => (box.querySelector(id) || {}).value || '', rem = !!(box.querySelector('#accRem') || {}).checked;
    if (a === 'close') return close();
    if (a === 'out') { acc.logout(); ctx.toast && ctx.toast('Đã đăng xuất.'); return open(); }
    if (a === 'guest') { acc.playGuest(); close(); ctx.toast && ctx.toast('🙂 Đang chơi khách — bấm 👤 để đăng nhập lưu tiến độ'); return; }
    msg.textContent = '…'; const err = await (a === 'in' ? acc.login(v('#accName'), v('#accPass'), rem) : acc.register(v('#accName'), v('#accPass'), rem));
    if (err) { msg.textContent = err; return; }
    close(); ctx.sfx && ctx.sfx('ok'); ctx.toast && ctx.toast(`👋 Chào ${esc(acc.name)}!${rem ? ' Đã lưu đăng nhập trên máy này.' : ''}`);
  });
  chip.onclick = open; chip.onkeydown = e => { if (e.key === 'Enter') open(); };
  // vào game: đã "Lưu đăng nhập" → vào thẳng; chưa → mở bảng đăng nhập (có nút Chơi khách)
  if (acc.resume()) setTimeout(() => ctx.toast && ctx.toast(`👋 Chào mừng ${esc(acc.name)} quay lại!`), 1500);
  else { render(); setTimeout(open, 600); }
  render();
  return { open, account: acc };
}
