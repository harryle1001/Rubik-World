// loader.js — Chỉ báo đang tải: khối Rubik 3×3 xoay (CSS 3D, không tốn WebGL) ở góc trái dưới, kèm tên việc & thanh tiến độ.
// Hiện mỗi khi có gì đang tải (model/texture qua THREE.DefaultLoadingManager, fetch: âm thanh, dữ liệu…, hoặc việc tự báo
// bằng ctx.loading.begin/end/track), tải xong → mờ dần rồi tắt.
// Lúc vào game: màn che tối (veil) phủ thế giới tới khi nhân vật + thị trấn + shader sẵn sàng → không thấy giật, không thấy
// nhân vật tạm đổi sang nhân vật học sinh. Kích thước theo Fibonacci/φ: khối 34 px, đệm 8/13, bo 21, nhịp xoay 1,618 s/bước.
import * as THREE from 'three';

const COL = { U: '#f7f5ef', D: '#ffd23f', F: '#2fbf71', B: '#3d7bff', R: '#ef4b4b', L: '#ff8a2b' }, INNER = '#141019';
const S = 11;   // cạnh 1 khối nhỏ (px) → khối Rubik 33 px

function cubeHTML() {
  let h = '';
  for (const y of [-1, 0, 1]) {
    h += `<div class="ly ly${y + 1}">`;
    for (const x of [-1, 0, 1]) for (const z of [-1, 0, 1]) {
      const f = (name, show, tr) => `<i style="background:${show ? COL[name] : INNER};transform:${tr} translateZ(${S / 2}px)"></i>`;
      h += `<b style="transform:translate3d(${x * S}px,${y * S}px,${z * S}px)">` +
        f('F', z === 1, '') + f('B', z === -1, 'rotateY(180deg)') + f('R', x === 1, 'rotateY(90deg)') + f('L', x === -1, 'rotateY(-90deg)') +
        f('U', y === -1, 'rotateX(90deg)') + f('D', y === 1, 'rotateX(-90deg)') + '</b>';
    }
    h += '</div>';
  }
  return h;
}

export function createLoader(ctx) {
  const css = document.createElement('style');
  css.textContent = `
#ldr{position:fixed;z-index:45;left:max(13px,env(safe-area-inset-left));bottom:max(13px,env(safe-area-inset-bottom));display:flex;align-items:center;gap:13px;
 padding:8px 16px 8px 10px;border-radius:21px;background:linear-gradient(135deg,#1b1626e6,#241c38d9);border:1px solid #ffffff2a;box-shadow:0 8px 21px #0007,inset 0 1px 0 #ffffff1c;
 color:#f2f0ff;font:600 13px/1.3 system-ui;pointer-events:none;opacity:0;transform:translateY(8px) scale(.96);transition:opacity .62s ease,transform .62s cubic-bezier(.2,.9,.3,1.2)}
#ldr.on{opacity:1;transform:none}
#ldr .stage{width:34px;height:34px;perspective:210px;flex:none;position:relative}
#ldr .stage::after{content:'';position:absolute;inset:-8px;border-radius:50%;background:radial-gradient(#ffd36e55,transparent 62%);animation:ldrGlow 1.618s ease-in-out infinite alternate;z-index:-1}
#ldr .rk{position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d;animation:ldrSpin 13s linear infinite}
#ldr .ly{position:absolute;transform-style:preserve-3d}
#ldr .ly0{animation:ldrTurn 6.472s infinite}#ldr .ly1{animation:ldrTurn 6.472s -2.157s infinite reverse}#ldr .ly2{animation:ldrTurn 6.472s -4.315s infinite}
#ldr b{position:absolute;transform-style:preserve-3d}
#ldr i{position:absolute;left:${-S / 2}px;top:${-S / 2}px;width:${S}px;height:${S}px;box-sizing:border-box;border:1.4px solid ${INNER};border-radius:2.5px;backface-visibility:hidden}
#ldr .tx{display:flex;flex-direction:column;gap:5px;min-width:0}
#ldr .t1{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:55vw;letter-spacing:.01em}
#ldr .t1 small{opacity:.62;font-weight:600;margin-left:5px;font-variant-numeric:tabular-nums}
#ldr .bar{width:89px;height:3px;border-radius:2px;background:#ffffff1f;overflow:hidden}
#ldr .bar u{display:block;height:100%;width:100%;border-radius:2px;background:linear-gradient(90deg,#ff8a2b,#ffd23f,#2fbf71,#3d7bff);transform-origin:left;transform:scaleX(.05);transition:transform .38s ease}
@keyframes ldrSpin{from{transform:rotateX(-28deg) rotateY(0)}to{transform:rotateX(-28deg) rotateY(360deg)}}
@keyframes ldrTurn{0%,13%{transform:rotateY(0)}25%,38%{transform:rotateY(90deg)}50%,63%{transform:rotateY(180deg)}75%,88%{transform:rotateY(270deg)}100%{transform:rotateY(360deg)}}
#ldr .ly{animation-timing-function:cubic-bezier(.62,0,.38,1)}
@keyframes ldrGlow{from{opacity:.35;transform:scale(.9)}to{opacity:.9;transform:scale(1.1)}}
#veil{position:fixed;inset:0;z-index:24;pointer-events:none;background:radial-gradient(ellipse at 50% 38%,#2c3a74 0%,#141a33 62%,#0b0e1c 100%);opacity:1;transition:opacity 1.3s ease}
#veil.off{opacity:0}
#veil .ttl{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);text-align:center;color:#f2f0ff;font:800 34px/1.2 system-ui;letter-spacing:.04em;text-shadow:0 3px 21px #0008}
#veil .ttl small{display:block;font:600 13px system-ui;letter-spacing:.21em;opacity:.62;margin-top:8px;text-transform:uppercase}
@media (prefers-reduced-motion:reduce){#ldr .rk,#ldr .ly,#ldr .stage::after{animation-duration:30s}}`;
  document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'ldr'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
  el.innerHTML = `<div class="stage"><div class="rk">${cubeHTML()}</div></div><div class="tx"><div class="t1">Đang tải…</div><div class="bar"><u></u></div></div>`;
  document.body.appendChild(el);
  const veil = document.createElement('div'); veil.id = 'veil'; veil.innerHTML = '<div class="ttl">🧩 Đảo Rubik<small>Học mà chơi · chơi mà học</small></div>';
  document.body.appendChild(veil);
  const t1 = el.querySelector('.t1'), bar = el.querySelector('.bar u');

  // ---- đếm việc đang tải ----
  const jobs = new Map(); let seq = 0, done = 0, total = 0, hideT = 0, lastLabel = 'Đang tải…';
  const NAME = u => { const f = String(u).split('?')[0].split('/').pop() || ''; return /\.glb$/.test(f) ? 'Mô hình 3D' : /\.(mp3|ogg|wav|m4a)$/.test(f) ? 'Âm thanh' : /\.(png|jpe?g|webp|ktx2)$/.test(f) ? 'Hình ảnh' : /\.js$/.test(f) ? 'Dữ liệu' : 'Dữ liệu'; };
  const render = () => {
    const n = jobs.size;
    if (n) {
      clearTimeout(hideT); el.classList.add('on');
      const label = [...jobs.values()].pop() || lastLabel; lastLabel = label;
      t1.innerHTML = `${label}<small>${Math.min(done, total)}/${total}</small>`;
      bar.style.transform = `scaleX(${Math.max(0.05, total ? done / total : 0)})`;
    } else {
      bar.style.transform = 'scaleX(1)'; t1.innerHTML = `Xong<small>${total}/${total}</small>`;
      clearTimeout(hideT); hideT = setTimeout(() => { el.classList.remove('on'); setTimeout(() => { if (!jobs.size) { done = total = 0; } }, 700); }, 610);
    }
  };
  const begin = (label = 'Đang tải…') => { const id = ++seq; jobs.set(id, label); total++; render(); return id; };
  const end = id => { if (!jobs.has(id)) return; jobs.delete(id); done++; render(); };
  const track = (label, p) => { const id = begin(label); Promise.resolve(p).finally(() => end(id)); return p; };

  // model / texture / file của three (GLTFLoader, TextureLoader… dùng DefaultLoadingManager)
  const M = THREE.DefaultLoadingManager, mIds = new Map();
  M.itemStart = (orig => function (url) { mIds.set(url, (mIds.get(url) || []).concat(begin(NAME(url)))); return orig.call(this, url); })(M.itemStart);
  M.itemEnd = (orig => function (url) { const a = mIds.get(url); if (a && a.length) end(a.shift()); return orig.call(this, url); })(M.itemEnd);
  M.itemError = (orig => function (url) { const a = mIds.get(url); if (a && a.length) end(a.shift()); return orig.call(this, url); })(M.itemError);
  // fetch (âm thanh, sách, dữ liệu…) — bỏ qua socket.io / gói nhỏ chạy nền
  const f0 = window.fetch.bind(window);
  window.fetch = (u, o) => { const url = typeof u === 'string' ? u : (u && u.url) || ''; if (/socket\.io|\/__/.test(url)) return f0(u, o); const id = begin(NAME(url)); return f0(u, o).finally(() => end(id)); };

  // ---- màn che lúc vào game ----
  let veilUp = true;
  const lift = () => { if (!veilUp) return; veilUp = false; veil.classList.add('off'); setTimeout(() => veil.remove(), 1400); };
  setTimeout(lift, 34000);   // lưới an toàn: máy rất chậm vẫn vào được

  return { begin, end, track, lift, get busy() { return jobs.size > 0; }, get veil() { return veilUp; } };
}
