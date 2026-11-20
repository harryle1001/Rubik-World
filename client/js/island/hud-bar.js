// hud-bar.js — Dải HUD gọn 1 hàng trên cùng (cao 34 px, Fibonacci) + 1 viên nhiệm vụ thu gọn: màn hình giữa (vùng nhân vật) để trống.
//   Dải: 📖 bí mật · 🧰 kho báu · 🪙/💎 ví · 🕰 giờ · Lv — chạm từng mục mở bảng của nó. Mục ít dùng (🏫, 🗺️, 👥, 😊, 📊, sổ tay…) vào menu ☰.
//   Viên 📜: việc cốt truyện kế tiếp + khoảng cách + mũi tên theo hướng camera + 📋 nhiệm vụ ngày; chạm → mở chi tiết (ô cốt truyện + ô nhiệm vụ), tự thu sau 8 s.
//   Không dựng lại các module: chỉ chuyển nút có sẵn vào dải/menu và đổi kiểu bằng CSS (các module vẫn tự cập nhật nội dung).
import { PHI } from './layout.js';

const CSS = `#hudBar{position:fixed;z-index:26;left:max(8px,env(safe-area-inset-left));top:max(8px,env(safe-area-inset-top));display:flex;align-items:center;height:34px;max-width:calc(100vw - 55px - env(safe-area-inset-left) - env(safe-area-inset-right));box-sizing:border-box;border-radius:17px;background:#140f22b8;border:1px solid #ffffff38;box-shadow:0 3px 13px #0003;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);overflow:hidden}
#hudBar>*{position:static!important;flex:0 1 auto;min-width:0;height:34px;box-sizing:border-box;margin:0!important;padding:0 8px!important;border:0!important;border-radius:0!important;background:none!important;box-shadow:none!important;color:#fff;font:700 13px/1 system-ui!important;display:flex!important;align-items:center;gap:3px;white-space:nowrap;overflow:hidden;cursor:pointer;-webkit-tap-highlight-color:transparent;max-width:none!important;text-shadow:0 1px 2px #0008}
#hudBar>*+*{border-left:1px solid #ffffff26!important}#hudBar>[hidden]{display:none!important}
#hudBar i{font-style:normal;font-size:16px;line-height:1}#hudBar small,#hudBar .lb,#hudBar .cmp,#hudBar .nm,#hudBar .lx{display:none!important}#hudBar .tx{display:flex}#hudBar b{font-size:13px}
#hudBar #ecoWallet{gap:5px}#hudBar #ecoWallet span+span{padding-left:5px}#hudBar .ecoIc{width:16px;height:16px}#hudBar #lessonChip b{color:#ffd36e}
@media (max-width:379px){#hudBar>*{padding:0 4px!important;font-size:12px!important}#hudBar i{font-size:14px}#hudBar .ecoIc{width:14px;height:14px}#hudBar #ecoWallet{gap:3px}#hudBar #ecoWallet span{gap:3px}}
#bMore{top:max(8px,env(safe-area-inset-top))!important;right:max(8px,env(safe-area-inset-right))!important;width:34px;height:34px!important;min-width:34px!important;border-width:1px!important;background:#140f22b8!important;font-size:18px!important}
#bMore[aria-expanded=true]{background:#f0a23a!important}
#moreMenu{top:calc(max(8px,env(safe-area-inset-top)) + 42px)!important;right:max(8px,env(safe-area-inset-right))!important;max-height:calc(100dvh - 63px);overflow-y:auto;flex-direction:column!important;flex-wrap:nowrap!important;padding:8px!important;background:#101a2ee6!important}
#moreMenu>*{position:static!important;display:flex!important;align-items:center;gap:5px;width:auto!important;min-height:42px;height:auto!important;box-sizing:border-box;padding:0 21px!important;border-radius:21px!important;border:2px solid #fff6!important;background:#ffffff14!important;color:#fff!important;font:700 15px system-ui!important;text-align:left;white-space:nowrap;cursor:pointer}#moreMenu>[hidden]{display:none!important}
#moreMenu>*{justify-content:flex-start!important}#moreMenu i{font-style:normal}#moreMenu .lb{display:inline!important}#moreMenu .lbl{display:none!important}#moreMenu small{display:none}#moreMenu [data-lbl]::after{content:attr(data-lbl);font-weight:700}
@media (max-height:500px) and (orientation:landscape){#moreMenu{flex-direction:row!important;flex-wrap:wrap!important;width:min(610px,calc(100vw - 89px));align-content:flex-start}}
.topbtns:empty{display:none}#chipRow{display:none!important}
#hudPill{position:fixed;z-index:26;left:max(8px,env(safe-area-inset-left));top:calc(max(8px,env(safe-area-inset-top)) + 39px);display:flex;align-items:center;gap:5px;height:26px;max-width:min(calc(100vw - 89px),377px);box-sizing:border-box;padding:0 8px 0 5px;border-radius:13px;background:#2a1d3cc4;border:1px solid #ffd23f80;color:#fff;font:700 12px/1 system-ui;text-shadow:0 1px 2px #0008;cursor:pointer;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
#hudPill .tx{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}#hudPill .ds{color:#ffe9a8;white-space:nowrap}#hudPill .q{white-space:nowrap;opacity:.9;padding-left:5px;border-left:1px solid #fff3}
#hudPill .ar{display:inline-flex;width:16px;height:16px;flex:none;transition:transform .382s}#hudPill .ar svg{width:16px;height:16px}
#hudPill.ready{border-color:#ffd23f;animation:qPulse 1.618s ease-in-out infinite}
#hudPanel{position:fixed;z-index:27;left:max(8px,env(safe-area-inset-left));top:calc(max(8px,env(safe-area-inset-top)) + 70px);display:none;flex-direction:column;gap:5px;width:min(233px,calc(100vw - 89px));max-height:calc(100dvh - 233px);overflow-y:auto}
body.hudOpen #hudPanel{display:flex}#hudPanel>#questHud,#hudPanel>#stHud{position:static!important;width:auto!important;top:auto!important}
body.rs-modal #hudBar,body.mg-on #hudBar,body.st-cut #hudBar,body.rs-modal #hudPill,body.mg-on #hudPill,body.st-cut #hudPill,body.rs-modal #hudPanel,body.mg-on #hudPanel,body.st-cut #hudPanel{display:none!important}`;
const ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5l5.5 7.5H10v5.5H6V9H2.5z" fill="#ffd23f" stroke="#5a3a00" stroke-width="1"/></svg>';

export function createHudBar(ctx) {
  const $ = id => document.getElementById(id), menu = $('moreMenu'), more = $('bMore');
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const bar = document.createElement('div'); bar.id = 'hudBar'; document.body.appendChild(bar);
  const pill = document.createElement('div'); pill.id = 'hudPill'; pill.setAttribute('role', 'button'); pill.title = 'Nhiệm vụ (chạm để xem chi tiết)';
  pill.innerHTML = `<span class="tx"></span><span class="ds"></span><i class="ar">${ARROW}</i><span class="q"></span>`; document.body.appendChild(pill);
  const panel = document.createElement('div'); panel.id = 'hudPanel'; document.body.appendChild(panel);
  const LBL = { bMap: 'Bản đồ', bNat: 'Sổ tay thiên nhiên', bBino: 'Ống nhòm', bStats: 'Thông số FPS' };
  const toMenu = (el, lbl) => { if (!el || !menu || el.parentNode === menu || el.style.display === 'none') return; if (lbl || LBL[el.id]) el.dataset.lbl = ' ' + (lbl || LBL[el.id]); menu.insertBefore(el, menu.firstChild); };
  // dải: theo thứ tự đã hẹn; mục chưa có (module tắt) thì bỏ qua
  const BAR = ['bEggs', 'bSea', 'ecoWallet', 'lessonChip', 'clockChip', 'accChip'];
  const fill = () => {
    for (const id of BAR) { const e = $(id); if (e && e.parentNode !== bar && e.style.display !== 'none') bar.appendChild(e); }
    const row = $('chipRow'); if (row) for (const e of [...row.children]) toMenu(e, e.classList.contains('soChip') ? (/Bạn bè/.test(e.title) ? 'Bạn bè' : 'Biểu cảm') : '');
    const tb = document.querySelector('.topbtns'); if (tb) for (const e of [...tb.children].reverse()) toMenu(e);
    toMenu($('bMap'));
    for (const id of ['stHud', 'questHud']) { const e = $(id); if (e && e.parentNode !== panel) id === 'stHud' ? panel.prepend(e) : panel.appendChild(e); }
  };
  fill();
  // module tạo nút muộn (sau khi dải đã dựng): chuyển tiếp
  const mo = new MutationObserver(() => fill());
  for (const el of [$('chipRow'), document.querySelector('.topbtns')]) if (el) mo.observe(el, { childList: true });
  mo.observe(document.body, { childList: true });

  const cam = $('bCam'); if (cam && !cam.onclick) cam.onclick = () => ctx.photo && ctx.photo.enter();   // không có hệ thú hoang: 📷 = chụp ảnh thường
  // viên nhiệm vụ: mở chi tiết khi chạm, tự thu sau 8 s (chạm vào bảng thì đếm lại)
  let openT = 0;
  const setOpen = on => { document.body.classList.toggle('hudOpen', on); openT = on ? 8 : 0; ctx.sfx && ctx.sfx('ui'); };
  pill.onclick = () => setOpen(!document.body.classList.contains('hudOpen'));
  panel.addEventListener('pointerdown', () => { openT = 8; });
  addEventListener('pointerdown', e => { if (document.body.classList.contains('hudOpen') && !panel.contains(e.target) && !pill.contains(e.target)) setOpen(false); }, true);

  const tx = pill.querySelector('.tx'), ds = pill.querySelector('.ds'), ar = pill.querySelector('.ar'), qq = pill.querySelector('.q');
  let last = '', lastA = 1e9;
  const tick = () => {
    if (openT > 0 && (openT -= 0.2) <= 0) setOpen(false);
    const N = ctx.storyNav, p = ctx.player && ctx.player.pos, q = $('questHud'), qs = q && q.querySelector('.hd span');
    const qt = qs ? qs.textContent.replace(/^\S+\s*/u, '').replace(/Nhiệm vụ · /, '').replace('Xong hôm nay ', '') : '';
    let t = N ? '📜 ' + N.text : '📋 Nhiệm vụ hằng ngày', d = '';
    if (N && N.tgt && p) {
      const dx = N.tgt[0] - p.x, dz = N.tgt[1] - p.z, m = Math.hypot(dx, dz), yaw = ctx.player.cam ? ctx.player.cam.yaw : 0;
      d = m < 1000 ? Math.round(m) + ' m' : (m / 1000).toFixed(1).replace('.', ',') + ' km';
      // mũi tên theo màn hình: hướng tới đích so với hướng camera nhìn (lên = phía trước)
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
      const a = Math.round(Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz) * 180 / Math.PI / 5) * 5;
      if (a !== lastA) { ar.style.transform = `rotate(${a}deg)`; lastA = a; }
    }
    ar.style.display = d ? '' : 'none';
    const k = t + '|' + d + '|' + qt;
    if (k !== last) { last = k; tx.textContent = t; ds.textContent = d; qq.textContent = qt ? '📋 ' + qt : ''; qq.style.display = qt && N ? '' : 'none'; if (!N && qt) tx.textContent = '📋 ' + qt; }
    pill.hidden = !N && !qt; pill.classList.toggle('ready', !!(q && q.classList.contains('ready')));
  };
  setInterval(tick, 200); tick();
  return { bar, pill, panel, PHI };
}
