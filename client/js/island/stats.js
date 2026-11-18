// stats.js — Nút 📊 (phím P) bật/tắt bảng thông số: FPS, thời gian khung (trung bình / chậm nhất), draw call, tam giác,
// geometry / texture / shader, bộ nhớ JS, mức chất lượng, độ phân giải, số người đang vẽ. Lưu trạng thái bật trên máy.
// Bật: đếm renderer.info cộng dồn cả khung (mọi pass của post-processing); tắt: trả lại autoReset như cũ, không tốn gì.
const KEY = 'island.stats';

export function createStats(ctx) {
  const { renderer } = ctx;
  const css = document.createElement('style');
  css.textContent = `#bStats{padding:5px 10px;border-radius:13px;border:2px solid #fff5;background:#1b1626aa;color:#fff;font:700 13px/1.3 system-ui;cursor:pointer}
#bStats[aria-pressed=true]{background:#ffc23e;color:#231600;border-color:#ffc23e}
#statsBox{position:fixed;z-index:44;left:max(12px,env(safe-area-inset-left));top:89px;min-width:178px;max-width:calc(100vw - 89px);box-sizing:border-box;padding:8px 13px;border-radius:13px;
 background:#0b0f1ce0;border:1px solid #ffffff24;color:#dfe6ff;font:600 12px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;pointer-events:none;box-shadow:0 8px 21px #0006}
#statsBox b{color:#fff;font-size:21px;font-weight:800}#statsBox .k{opacity:.6}#statsBox .g{color:#7ee08a}#statsBox .y{color:#ffd36e}#statsBox .r{color:#ff7b6b}
@media (max-width:600px){#bStats .lbl{display:none}#statsBox{font-size:11px}}
#statsBox canvas{display:block;width:100%;height:34px;margin:5px 0 3px;border-radius:5px;background:#ffffff0d}`;
  document.head.appendChild(css);
  const row = document.getElementById('chipRow');
  const btn = document.createElement('button'); btn.id = 'bStats'; btn.title = 'Thông số FPS (phím P)'; btn.innerHTML = '📊<span class="lbl"> FPS</span>'; btn.style.order = 2;
  (row || document.body).appendChild(btn);
  const box = document.createElement('div'); box.id = 'statsBox'; box.hidden = true; document.body.appendChild(box);
  box.innerHTML = '<div class="hd"></div><canvas width="178" height="34"></canvas><div class="bd"></div>';
  const hd = box.querySelector('.hd'), bd = box.querySelector('.bd'), cv = box.querySelector('canvas'), g = cv.getContext('2d');
  const place = () => { const r = (row || btn).getBoundingClientRect(); box.style.top = Math.round(r.bottom + 8) + 'px'; };   // ngay dưới hàng chip
  addEventListener('resize', () => on && place());
  let on = false; try { on = localStorage.getItem(KEY) === '1'; } catch (e) {}
  const hist = new Float32Array(89); let hi = 0;
  const set = v => {
    on = v; box.hidden = !v; if (v) place(); btn.setAttribute('aria-pressed', v); renderer.info.autoReset = !v; if (v) renderer.info.reset();
    try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {}
  };
  btn.onclick = () => set(!on);
  addEventListener('keydown', e => { if ((e.code === 'KeyP' || e.code === 'F3') && !e.repeat && !/INPUT|TEXTAREA/.test(document.activeElement && document.activeElement.tagName)) { e.preventDefault(); set(!on); } });
  set(on);

  let last = performance.now(), acc = 0, n = 0, worst = 0, showT = 0;
  // gọi mỗi khung SAU khi vẽ
  function frame() {
    const now = performance.now(), ms = now - last; last = now;
    if (!on) return;
    acc += ms; n++; worst = Math.max(worst, ms); hist[hi++ % hist.length] = ms;
    const inf = renderer.info, calls = inf.render.calls, tris = inf.render.triangles; inf.reset();
    if ((showT += ms) < 377) return; place();   // cập nhật chữ ~2,6 lần/giây
    const avg = acc / n, fps = 1000 / avg, cl = fps >= 55 ? 'g' : fps >= 30 ? 'y' : 'r';
    const mem = performance.memory ? (performance.memory.usedJSHeapSize / 1048576).toFixed(0) + ' MB' : '—';
    const people = (ctx.townPeople || []).filter(e => e.a).length;
    hd.innerHTML = `<b class="${cl}">${fps.toFixed(0)}</b> FPS <span class="k">· ${avg.toFixed(1)} ms (chậm nhất ${worst.toFixed(0)})</span>`;
    bd.innerHTML = `<span class="k">Draw call</span> ${calls}<br><span class="k">Tam giác</span> ${(tris / 1000).toFixed(0)}k<br>` +
      `<span class="k">Geometry / Texture</span> ${inf.memory.geometries} / ${inf.memory.textures}<br><span class="k">Shader</span> ${inf.programs ? inf.programs.length : '—'}<br>` +
      `<span class="k">Bộ nhớ JS</span> ${mem}<br><span class="k">Chất lượng</span> mức ${ctx.qualityLevel || 0} · ${renderer.getPixelRatio().toFixed(2)}×<br><span class="k">Người đang vẽ</span> ${people}`;
    // biểu đồ thời gian khung: vạch 16,7 ms (60 FPS) và 33,3 ms (30 FPS)
    const W = cv.width, H = cv.height; g.clearRect(0, 0, W, H);
    g.fillStyle = '#ffffff22'; g.fillRect(0, H - H * 16.7 / 50, W, 1); g.fillRect(0, H - H * 33.3 / 50, W, 1);
    for (let i = 0; i < hist.length; i++) { const v = hist[(hi + i) % hist.length]; if (!v) continue; const h = Math.min(H, H * v / 50); g.fillStyle = v < 18 ? '#7ee08a' : v < 34 ? '#ffd36e' : '#ff7b6b'; g.fillRect(i * W / hist.length, H - h, W / hist.length - 0.5, h); }
    acc = n = worst = showT = 0;
  }
  return { frame, set, get on() { return on; } };
}
