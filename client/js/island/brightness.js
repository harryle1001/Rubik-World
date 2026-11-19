// brightness.js — Nút ☀️ chỉnh độ sáng trong game (thanh trượt + phím [ ]), lưu trên máy.
// Nhân vào độ phơi sáng (toneMappingExposure) mà post.js đặt sẵn; buổi tối tự sáng thêm một chút cho dễ nhìn.
const KEY = 'island.bright', PHI = 1.618;

export function createBrightness(ctx) {
  const { renderer } = ctx, base = renderer.toneMappingExposure || 1;
  let v = 1; try { v = +localStorage.getItem(KEY) || 1; } catch (e) {}
  v = Math.min(PHI, Math.max(1 / PHI, v));

  const css = document.createElement('style');
  css.textContent = `#bBright{font-size:15px}
#brightBox{position:fixed;z-index:29;right:max(12px,env(safe-area-inset-right));top:calc(max(12px,env(safe-area-inset-top)) + 55px);box-sizing:border-box;width:min(calc(100vw - 24px),377px);
 display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:16px;background:#101a2ecc;color:#f2f4ff;font:600 14px system-ui;box-shadow:0 6px 18px #0006}
#brightBox input{flex:1;min-width:0;accent-color:#ffc23e}#brightBox span{min-width:3.2em;text-align:right;font-variant-numeric:tabular-nums}
body.rs-modal #brightBox{display:none}
@media (max-height:500px) and (orientation:landscape){#brightBox{right:auto;left:max(12px,env(safe-area-inset-left));top:calc(max(12px,env(safe-area-inset-top)) + 76px)}}
#brightBox{flex-wrap:wrap}#qMode,#tMode{display:flex;gap:6px;width:100%}#tMode button,#qMode button{flex:1;padding:6px 8px;border-radius:12px;border:1px solid #fff4;background:#ffffff14;color:#f2f4ff;font:600 13px system-ui}
#tMode button[aria-pressed=true],#qMode button[aria-pressed=true]{background:#ffc23e;color:#231600;border-color:#ffc23e}`;
  document.head.appendChild(css);
  const btn = document.createElement('button'); btn.id = 'bBright'; btn.title = 'Độ sáng, giờ trong ngày & chất lượng hình ([ ])'; btn.textContent = '☀️ Ánh sáng & giờ';
  (document.getElementById('moreMenu') || document.querySelector('.topbtns') || document.body).appendChild(btn);
  const box = document.createElement('div'); box.id = 'brightBox'; box.hidden = true;
  box.innerHTML = `🌙<input id="brightRange" type="range" min="${(1 / PHI).toFixed(3)}" max="${PHI}" step="0.01" aria-label="Độ sáng">☀️<span></span>
  <div id="tMode" role="group" aria-label="Giờ trong ngày"><button data-t="real">⏱ Thật</button><button data-t="8.5">🌅 Sáng</button><button data-t="12.5">☀️ Trưa</button><button data-t="17">🌇 Chiều</button><button data-t="20.5">🌙 Tối</button></div>
  <div id="qMode" role="group" aria-label="Chất lượng hình"><button data-q="fast">⚡ Mượt</button><button data-q="auto">Tự động</button><button data-q="pretty">✨ Đẹp</button><button id="bTut" title="Xem lại hướng dẫn chơi">❓</button></div>`;
  document.body.appendChild(box);
  const range = box.querySelector('input'), label = box.querySelector('span');
  // chế độ hình: Mượt (mức 2–3: không MSAA/bloom/tia nắng, độ phân giải động giữ ≥ 50 FPS) · Tự động (theo FPS) · Đẹp (khoá mức 0)
  const QK = 'island.qmode'; let qmode = 'auto'; try { qmode = localStorage.getItem(QK) || 'auto'; } catch (e) {}
  const setQ = (m, save = true) => {
    qmode = m; for (const b of box.querySelectorAll('#qMode button')) b.setAttribute('aria-pressed', b.dataset.q === m);
    if (ctx.setQualityMode) ctx.setQualityMode(m);
    if (save) try { localStorage.setItem(QK, m); } catch (e) {}
  };
  const shut = () => setTimeout(() => { box.hidden = true; }, 377);   // chọn xong tự đóng (sau 0,377 s để thấy nút sáng lên)
  box.querySelector('#qMode').addEventListener('click', e => { const m = e.target.dataset && e.target.dataset.q; if (m) { setQ(m); shut(); } });
  box.querySelector('#bTut').onclick = () => { box.hidden = true; ctx.tutorial && ctx.tutorial.show(); };   // ❓ xem lại hướng dẫn (tutorial.js)
  setTimeout(() => setQ(qmode, false), 0);
  // giờ trong ngày: Thật (theo đồng hồ trường) hoặc khoá Sáng/Trưa/Chiều/Tối
  const TK = 'island.tmode'; let tmode = 'real'; try { tmode = localStorage.getItem(TK) || 'real'; } catch (e) {}
  const setT = (m, save = true) => {
    tmode = m; for (const b of box.querySelectorAll('#tMode button')) b.setAttribute('aria-pressed', b.dataset.t === m);
    if (ctx.sky) ctx.sky.state.lock = m === 'real' ? null : +m;
    if (save) try { localStorage.setItem(TK, m); } catch (e) {}
  };
  box.querySelector('#tMode').addEventListener('click', e => { const m = e.target.dataset && e.target.dataset.t; if (m) { setT(m); shut(); } });
  setTimeout(() => setT(tmode, false), 0);   // ctx.setQuality được tạo ở cuối ocean.js

  const set = (nv, save = true) => {
    v = Math.min(PHI, Math.max(1 / PHI, nv)); range.value = v; label.textContent = Math.round(v * 100) + '%';
    if (save) try { localStorage.setItem(KEY, v.toFixed(2)); } catch (e) {}
  };
  set(v, false);
  range.addEventListener('input', () => set(+range.value));
  btn.onclick = () => { box.hidden = !box.hidden; };
  addEventListener('pointerdown', e => { if (!box.hidden && !box.contains(e.target) && e.target !== btn) box.hidden = true; }, true);   // chạm ra ngoài → đóng
  addEventListener('keydown', e => {
    if (e.code === 'BracketLeft') { set(v - 0.05); box.hidden = false; }
    else if (e.code === 'BracketRight') { set(v + 0.05); box.hidden = false; }
  });

  // mỗi khung: phơi sáng = gốc × mức người chơi chọn × bù đêm (đêm sáng thêm tối đa 1/φ³ ≈ 0,24: đã có ánh trời lam, giữ đêm dịu)
  function update() {
    const night = ctx.sky ? ctx.sky.state.night : 0;
    renderer.toneMappingExposure = base * v * (1 + night * 0.38);   // đêm sáng bù 1/φ² để vẫn thấy cảnh vật
  }
  return { update, get value() { return v; }, set };
}
