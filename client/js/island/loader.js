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

// Đường xoắn ốc vàng: 8 ô Fibonacci (1,1,2,3,5,8,13,21) trong khung 34×21, mỗi ô 1 cung ¼ tròn; khối Rubik isometric (2 kiểu
// mặt → đủ 6 màu) bay vào xếp dọc 4 cung ngoài, cỡ khối ∝ bán kính (tăng theo φ). Tiến độ tải = nét vàng chạy dọc xoắn.
export const CREDIT = '<a class="dlc" href="https://dreamlabs.vn" target="_blank" rel="noopener">Design by Dreamlabs.vn</a>';
const SQ = [[24, 15, 1], [25, 15, 1], [24, 13, 2], [21, 13, 3], [21, 16, 5], [26, 13, 8], [21, 0, 13], [0, 0, 21]];
const CE = [[25, 15], [25, 15], [24, 15], [24, 16], [26, 16], [26, 13], [21, 13], [21, 21]];
function spiralHTML() {
  const PHI = 1.618, n = v => +v.toFixed(3), pt = (k, fr) => { const a = Math.PI - (k + fr) * Math.PI / 2, r = SQ[k][2]; return [CE[k][0] + r * Math.cos(a), CE[k][1] + r * Math.sin(a)]; };
  let d = `M${pt(0, 0).map(n)}`; SQ.forEach((q, k) => { d += `A${q[2]} ${q[2]} 0 0 0 ${pt(k, 1).map(n)}`; });
  const hw = 0.5, e = hw / Math.cos(Math.PI / 6), hh = e / 2, T = -hh - e / 2;
  const face = (o, u, v, cols) => { let s = ''; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const g = .1, a = (i + g) / 3, b = (i + 1 - g) / 3, c = (j + g) / 3, dd = (j + 1 - g) / 3,
    p = (x, y) => `${n(o[0] + u[0] * x + v[0] * y)},${n(o[1] + u[1] * x + v[1] * y)}`; s += `<polygon fill="${COL[cols]}" points="${p(a, c)} ${p(b, c)} ${p(b, dd)} ${p(a, dd)}"/>`; } return s; };
  const cube = (id, t, l, r) => `<g id="${id}"><polygon fill="${INNER}" points="0,${n(T - .04)} ${n(hw + .04)},${n(T + hh)} ${n(hw + .04)},${n(T + hh + e)} 0,${n(-T + .04)} ${n(-hw - .04)},${n(T + hh + e)} ${n(-hw - .04)},${n(T + hh)}"/>` +
    face([0, T], [hw, hh], [-hw, hh], t) + face([-hw, T + hh], [hw, hh], [0, e], l) + face([0, T + 2 * hh], [hw, -hh], [0, e], r) + '</g>';
  let cubes = '', i = 0;
  for (let k = 4; k < 8; k++) for (let j = 0; j < 4; j++, i++) {
    const fr = (j + 0.5) / 4, [x, y] = pt(k, fr), s = 0.3 * SQ[k][2] * Math.pow(PHI, fr - 0.5), dx = (x - 24.8) * 1.618 / s, dy = (y - 15.2) * 1.618 / s;
    cubes += `<g transform="translate(${n(x)} ${n(y)}) scale(${n(s)})"><g class="fly" style="--d:${n(0.382 + i * 0.1)}s;--dx:${n(dx)}px;--dy:${n(dy)}px;--r:${(i % 2 ? 1 : -1) * 144}deg"><use href="#rk${i % 2 ? 'B' : 'A'}" class="wob"/></g></g>`;
  }
  const sq = SQ.map((q, k) => `<rect class="sq" style="--d:${n(1.618 - k * 0.15)}s" x="${q[0]}" y="${q[1]}" width="${q[2]}" height="${q[2]}"/>`).join('');
  return `<svg viewBox="-4 -4 42 29" aria-hidden="true"><defs>${cube('rkA', 'U', 'F', 'R')}${cube('rkB', 'D', 'B', 'L')}</defs>
<g fill="none" stroke-linecap="round"><g stroke="#e8c36a" stroke-opacity=".16" stroke-width=".06">${sq}</g>
<path id="vsp" d="${d}" stroke="#e8c36a" stroke-opacity=".28" stroke-width=".12"/><path id="vsh" d="${d}" pathLength="100" stroke="#fff3c4" stroke-opacity=".5" stroke-width=".16"/>
<path id="vpg" d="${d}" pathLength="100" stroke="#f6d47a" stroke-width=".3"/></g>${cubes}
<g id="vhd"><circle r=".9" fill="#f6d47a" fill-opacity=".25"/><circle r=".36" fill="#fff8e0"/></g>
<text id="vpc" x="24.8" y="14.4" text-anchor="middle" dominant-baseline="central" font-size="2.1" font-weight="800" font-family="system-ui" fill="#fff8e0" stroke="#0b0f24" stroke-width=".5" paint-order="stroke">0%</text></svg>`;
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
#veil{position:fixed;inset:0;z-index:35;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:21px;padding:0 13px 13vh;box-sizing:border-box;
 background:radial-gradient(ellipse at 50% 38%,#1d2a5c 0%,#0e1430 55%,#05070f 100%);opacity:1;transition:opacity 1.3s ease}
#veil.off{opacity:0}body.veil-on #ldr{visibility:hidden}
#veil svg{width:min(86vw,89vh,610px);height:auto;overflow:visible}
#veil .ttl{display:flex;align-items:center;gap:13px;color:#f2f0ff;font:800 clamp(26px,5.5vw,34px)/1.2 system-ui;letter-spacing:.04em;text-shadow:0 3px 21px #0008}
#veil .ttl img{width:1.618em;height:1.618em;border-radius:.38em;box-shadow:0 5px 21px #0009}
#veil .ttl small{display:block;font:600 13px system-ui;letter-spacing:.21em;opacity:.62;margin-top:5px;text-transform:uppercase}
#veil .fly{animation:vFly 1.618s cubic-bezier(.16,1,.3,1) var(--d) both}
#veil .wob{transform-box:fill-box;transform-origin:center;animation:vWob 3.236s ease-in-out calc(var(--d) + 1.618s) infinite alternate}
#veil .sq{opacity:0;animation:vIn 1.618s ease var(--d) forwards}
#vsh{stroke-dasharray:8 92;animation:vSh 4.236s linear 1s infinite}
#vpg{stroke-dasharray:100;stroke-dashoffset:100;transition:stroke-dashoffset .62s cubic-bezier(.2,.8,.3,1)}
@keyframes vFly{from{transform:translate(var(--dx),var(--dy)) rotate(var(--r)) scale(.2);opacity:0}to{transform:none;opacity:1}}
@keyframes vWob{from{transform:rotate(-8deg) scale(.94)}to{transform:rotate(8deg) scale(1.04)}}
@keyframes vIn{to{opacity:1}}@keyframes vSh{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}
.dlc{position:absolute;left:max(13px,env(safe-area-inset-left));bottom:max(8px,env(safe-area-inset-bottom));pointer-events:auto;color:#fff;opacity:.6;font:500 11px/1.6 system-ui;letter-spacing:.08em;text-decoration:none;transition:opacity .38s}
.dlc:hover,.dlc:focus-visible{opacity:.9}
@media (prefers-reduced-motion:reduce){#veil .fly,#veil .wob,#veil .sq,#vsh{animation:none!important;opacity:1}}
@media (prefers-reduced-motion:reduce){#ldr .rk,#ldr .ly,#ldr .stage::after{animation-duration:30s}}`;
  document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'ldr'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
  el.innerHTML = `<div class="stage"><div class="rk">${cubeHTML()}</div></div><div class="tx"><div class="t1">Đang tải…</div><div class="bar"><u></u></div></div>`;
  document.body.appendChild(el);
  const veil = document.createElement('div'); veil.id = 'veil'; veil.innerHTML = spiralHTML() +
    '<div class="ttl"><img src="/icons/logo.svg" alt=""><div>Đảo Rubik<small>Học mà chơi · chơi mà học</small></div></div>' + CREDIT;
  document.body.appendChild(veil); document.body.classList.add('veil-on');
  const pg = veil.querySelector('#vpg'), pct = veil.querySelector('#vpc'), hd = veil.querySelector('#vhd'), sp = veil.querySelector('#vsp'), pgLen = sp.getTotalLength();
  let pk = 0;
  const setPct = p => { pk = Math.max(pk, p); pg.style.strokeDashoffset = 100 - pk * 100; pct.textContent = Math.round(pk * 100) + '%';
    const q = sp.getPointAtLength(pgLen * pk); hd.setAttribute('transform', `translate(${q.x.toFixed(2)} ${q.y.toFixed(2)})`); };
  const t1 = el.querySelector('.t1'), bar = el.querySelector('.bar u');

  // ---- đếm việc đang tải ----
  let veilUp = true;
  const jobs = new Map(); let seq = 0, done = 0, total = 0, hideT = 0, lastLabel = 'Đang tải…';
  const NAME = u => { const f = String(u).split('?')[0].split('/').pop() || ''; return /\.glb$/.test(f) ? 'Mô hình 3D' : /\.(mp3|ogg|wav|m4a)$/.test(f) ? 'Âm thanh' : /\.(png|jpe?g|webp|ktx2)$/.test(f) ? 'Hình ảnh' : /\.js$/.test(f) ? 'Dữ liệu' : 'Dữ liệu'; };
  const render = () => {
    const n = jobs.size; if (veilUp) setPct(Math.min(0.99, total ? done / total : 0));
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
  const lift = () => { if (!veilUp) return; setPct(1); veilUp = false; veil.classList.add('off'); document.body.classList.remove('veil-on'); setTimeout(() => veil.remove(), 1400); };
  setTimeout(lift, 34000);   // lưới an toàn: máy rất chậm vẫn vào được

  return { begin, end, track, lift, get busy() { return jobs.size > 0; }, get veil() { return veilUp; } };
}
