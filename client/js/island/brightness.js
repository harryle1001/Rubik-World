// brightness.js — Nút ☀️ chỉnh độ sáng trong game (thanh trượt + phím [ ]), lưu trên máy.
// Nhân vào độ phơi sáng (toneMappingExposure) mà post.js đặt sẵn; buổi tối tự sáng thêm một chút cho dễ nhìn.
const KEY = 'island.bright', PHI = 1.618;

export function createBrightness(ctx) {
  const { renderer } = ctx, base = renderer.toneMappingExposure || 1;
  let v = 1; try { v = +localStorage.getItem(KEY) || 1; } catch (e) {}
  v = Math.min(PHI, Math.max(1 / PHI, v));

  const css = document.createElement('style');
  css.textContent = `#bBright{font-size:15px}
#brightBox{position:fixed;z-index:27;left:max(12px,env(safe-area-inset-left));top:calc(max(12px,env(safe-area-inset-top)) + 46px);
 display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:16px;background:#101a2ecc;color:#f2f4ff;font:600 14px system-ui;box-shadow:0 6px 18px #0006}
#brightBox input{width:min(52vw,220px);accent-color:#ffc23e}#brightBox span{min-width:3.2em;text-align:right;font-variant-numeric:tabular-nums}
body.rs-modal #brightBox{display:none}`;
  document.head.appendChild(css);
  const btn = document.createElement('button'); btn.id = 'bBright'; btn.title = 'Độ sáng ([ ])'; btn.textContent = '☀️ Sáng';
  (document.querySelector('.topbtns') || document.body).appendChild(btn);
  const box = document.createElement('div'); box.id = 'brightBox'; box.hidden = true;
  box.innerHTML = `🌙<input id="brightRange" type="range" min="${(1 / PHI).toFixed(3)}" max="${PHI}" step="0.01" aria-label="Độ sáng">☀️<span></span>`;
  document.body.appendChild(box);
  const range = box.querySelector('input'), label = box.querySelector('span');

  const set = (nv, save = true) => {
    v = Math.min(PHI, Math.max(1 / PHI, nv)); range.value = v; label.textContent = Math.round(v * 100) + '%';
    if (save) try { localStorage.setItem(KEY, v.toFixed(2)); } catch (e) {}
  };
  set(v, false);
  range.addEventListener('input', () => set(+range.value));
  btn.onclick = () => { box.hidden = !box.hidden; };
  addEventListener('keydown', e => {
    if (e.code === 'BracketLeft') { set(v - 0.05); box.hidden = false; }
    else if (e.code === 'BracketRight') { set(v + 0.05); box.hidden = false; }
  });

  // mỗi khung: phơi sáng = gốc × mức người chơi chọn × bù đêm (đêm sáng thêm tối đa 1/φ³ ≈ 0,24: đã có ánh trời lam, giữ đêm dịu)
  function update() {
    const night = ctx.sky ? ctx.sky.state.night : 0;
    renderer.toneMappingExposure = base * v * (1 + night / PHI ** 3);
  }
  return { update, get value() { return v; }, set };
}
