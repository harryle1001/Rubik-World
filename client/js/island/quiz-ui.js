// quiz-ui.js — KHUNG CÂU HỎI CHUNG cho mọi nơi trong đảo 3D (học thích ứng, thầy cô, mini game, hải đăng, học viện, rương…).
//   Câu hỏi nằm NGAY TRÊN các nút đáp án, cùng một khối ở nửa dưới màn hình (tôn trọng safe-area); ngang điện thoại → dạt phải, chừa nhân vật.
//   Nút ✕ góc khung + Esc: đóng ngay, nhả khoá di chuyển, không phạt (Promise trả null). Phím 1–9 chọn, Enter = nút tiếp.
//   qcard(o) → Promise<{ ok, k, alt } | null>, kèm .pick(i) (chọn bằng code: cổng/làn) và .close().
//   o: { title, ava, chip, dots, head (html nút thêm ở đầu), onHead(el), q (HTML), choices (HTML), a (chỉ số đúng, −1 = chưa biết),
//        explain, retry (sai → thử lại), instant (chọn là đóng, game tự báo), next ('Tiếp ▶' | false = tự đóng sau ms), alt (nút phụ sau khi trả lời),
//        ms [đúng, sai], tag (closeQ(tag) chỉ đóng khung cùng nhãn), onPick(ok,k) → html thêm (vd thưởng), lock (player: đóng băng khi mở), onClose (bấm ✕/Esc), tone ('board'), colors [..] }
// φ: rộng 377 (Fibonacci), lề 13, bo 21, chữ 13/17, nút cao ≥ 48 (44 + viền), khe 8, đáy max(13, safe-area) .
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export { esc };
const CSS = `
#rwQ{position:fixed;left:50%;bottom:max(13px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:61;box-sizing:border-box;width:min(377px,calc(100vw - 26px));max-height:min(61.8vh,calc(100vh - 89px));overflow:auto;overscroll-behavior:contain;
 background:#fffaf0f7;color:#3a2a1a;border-radius:21px;padding:8px 13px 13px;font:14px/1.45 system-ui,sans-serif;box-shadow:0 8px 34px #0006;border:2px solid #f0a23a;text-align:left;-webkit-user-select:none;user-select:none}
#rwQ.board{background:#24463af5;color:#f4f1e6;border-color:#a8784a}
#rwQ button{cursor:pointer;font-family:system-ui,sans-serif;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
#rwQ .hd{display:flex;align-items:center;gap:5px;font-size:13px;min-height:34px}#rwQ .hd>span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#rwQ .hd .chip{border:0;border-radius:13px;background:#f3e3c3;font-weight:800;font-size:12px;min-height:30px;padding:0 8px;color:#5a3a12}
#rwQ .qx{flex:none;width:34px;height:34px;margin:0 -5px 0 3px;border-radius:50%;border:0;background:#3a2a1a1a;font:900 16px system-ui;color:#5a4a3a}#rwQ.board .qx{background:#fff3;color:#fff}
#rwQ .dots{font-size:11px;letter-spacing:3px;opacity:.6}
#rwQ .qq{font-size:17px;line-height:1.38;font-weight:700;margin:3px 0 8px}
#rwQ .ch{display:grid;grid-template-columns:1fr 1fr;gap:8px}#rwQ .ch.one{grid-template-columns:1fr}
#rwQ .ch button{min-height:48px;padding:5px 8px;border-radius:13px;border:2px solid transparent;background:#f1e6cf;font-weight:700;font-size:15px;line-height:1.25;color:#3a2a1a;text-align:center}
#rwQ .ch button i{font-style:normal;opacity:.45;margin-right:4px;font-size:12px}
#rwQ .ch button.ok{background:#c9efc9;border-color:#3fa36b}#rwQ .ch button.bad{background:#ffd0c8;border-color:#d2553f}#rwQ .ch button:disabled{opacity:1;color:#3a2a1a}
#rwQ .ex{margin:8px 0 0;font-size:13px;line-height:1.45}
#rwQ .row{display:grid;grid-template-columns:1.618fr 1fr;gap:8px;margin-top:8px}#rwQ .row.one{grid-template-columns:1fr}
#rwQ .row button{min-height:44px;border:0;border-radius:21px;background:#f0a23a;color:#2a1a0a;font-weight:800;font-size:15px}#rwQ .row .b2{background:#e8dcc6;color:#5a4a3a}
@media (orientation:landscape) and (max-height:500px){#rwQ{left:auto;right:max(13px,env(safe-area-inset-right));transform:none;bottom:max(8px,env(safe-area-inset-bottom));width:min(377px,52vw);max-height:calc(100vh - 21px);padding:5px 8px 8px}
 #rwQ .qq{font-size:15px;margin:2px 0 5px}#rwQ .ch{gap:5px}#rwQ .ch button{min-height:44px;font-size:14px}#rwQ .hd{min-height:30px}}`;
let el = null, cur = null;
function mount() {
  if (el) return;
  const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s);
  el = document.createElement('div'); el.id = 'rwQ'; el.hidden = true; el.setAttribute('role', 'dialog'); document.body.appendChild(el);
  ['pointerdown', 'touchstart', 'mousedown', 'wheel'].forEach(t => el.addEventListener(t, e => e.stopPropagation(), { passive: true }));   // chạm khung không xoay camera / không bắn
  addEventListener('keydown', e => {
    if (!cur || /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName)) return;
    const c = cur;
    if (e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); c.close(true); return; }
    if (/^[1-9]$/.test(e.key)) { const b = el.querySelector(`.ch [data-k="${+e.key - 1}"]`); if (b && !b.disabled) { e.stopImmediatePropagation(); b.click(); } return; }
    if (e.code === 'Enter' || e.code === 'NumpadEnter') { const b = el.querySelector('.row .b1'); if (b) { e.preventDefault(); e.stopImmediatePropagation(); b.click(); } }
  }, true);
}
export const isOpen = () => !!cur;
/** đóng khung đang mở (không gọi onClose) */
export function closeQ(tag) { if (cur && (!tag || cur.tag === tag)) cur.close(false); }

export function qcard(o) {
  mount(); if (cur) cur.close(false);
  let res, tm = 0, done = false, frz = null; const P = new Promise(r => (res = r));
  const lock = o.lock || null; if (lock) { frz = lock.frozen; lock.frozen = true; }
  const self = cur = {
    tag: o.tag,
    close(user) {
      if (cur !== self) return; cur = null; clearTimeout(tm); el.hidden = true; el.innerHTML = ''; if (lock) lock.frozen = frz;
      if (user && o.onClose) try { o.onClose(); } catch (e) { console.warn(e); }
      res(null);
    },
  };
  const finish = v => { if (cur !== self) return; cur = null; clearTimeout(tm); el.hidden = true; el.innerHTML = ''; if (lock) lock.frozen = frz; res(v); };
  const ch = o.choices || [], long = ch.some(c => String(c).replace(/<[^>]+>/g, '').length > 21);
  el.className = o.tone || '';
  el.innerHTML = `<div class="hd">${o.ava || '❓'}<span><b>${o.title || 'Câu hỏi'}</b>${o.chip ? ' · ' + o.chip : ''}</span>${o.head || ''}<button class="qx" aria-label="Đóng">✕</button></div>
${o.dots ? `<div class="dots">${o.dots}</div>` : ''}<div class="qq">${o.q}</div><div class="ch${long || ch.length < 2 ? ' one' : ''}">${ch.map((t, k) => `<button type="button" data-k="${k}"${o.colors ? ` style="border-color:${o.colors[k]}"` : ''}><i>${k + 1}</i>${t}</button>`).join('')}</div>`;
  el.dataset.a = o.a ?? -1;   // (kiểm thử tự động)
  el.querySelector('.qx').onclick = () => self.close(true);
  if (o.onHead) o.onHead(el);
  let first = true;
  const pick = k => {
    if (done || cur !== self || ch[k] == null) return;
    const btns = el.querySelectorAll('.ch button'), ok = o.a == null || o.a < 0 ? true : k === o.a;
    if (o.instant) { done = true; o.onPick && o.onPick(ok, k); finish({ ok, k }); return; }
    if (!ok && o.retry) {
      btns[k].className = 'bad'; btns[k].disabled = true;
      const more = first && o.onPick ? o.onPick(false, k) : ''; first = false;
      let ex = el.querySelector('.ex'); if (!ex) { ex = document.createElement('p'); ex.className = 'ex'; el.appendChild(ex); }
      ex.innerHTML = `💡 <b>Chưa đúng</b>, thử lại nhé!${o.hint ? ' ' + o.hint : ''}${more || ''}`; return;
    }
    done = true;
    btns.forEach((b, j) => { b.disabled = true; if (j === o.a) b.className = 'ok'; else if (j === k) b.className = 'bad'; });
    const more = o.onPick ? o.onPick(first ? ok : null, k) || '' : '';
    const ans = o.a >= 0 ? ch[o.a] : '';
    el.querySelector('.ex')?.remove();
    el.insertAdjacentHTML('beforeend', `<p class="ex">${ok ? `✅ <b>Chính xác!</b>${more ? ' ' + more : ''}` : `💡 <b>Chưa đúng.</b>${ans ? ` Đáp án: <b>${ans}</b>.` : ''}${more ? ' ' + more : ''}`} ${o.explain || ''}</p>`);
    if (o.next === false) { const ms = o.ms || [900, 2600]; tm = setTimeout(() => finish({ ok, k }), ok ? ms[0] : ms[1]); return; }
    el.insertAdjacentHTML('beforeend', `<div class="row${o.alt ? '' : ' one'}"><button class="b1">${o.next || 'Tiếp ▶'}</button>${o.alt ? `<button class="b2">${o.alt}</button>` : ''}</div>`);
    el.querySelector('.b1').onclick = () => finish({ ok, k });
    const b2 = el.querySelector('.b2'); if (b2) b2.onclick = () => finish({ ok, k, alt: true });
    el.scrollTop = el.scrollHeight;
  };
  el.querySelectorAll('.ch button').forEach(b => b.onclick = e => { e.stopPropagation(); pick(+b.dataset.k); });
  el.hidden = false; el.scrollTop = 0;
  P.pick = pick; P.close = () => self.close(false); P.el = el;
  return P;
}
