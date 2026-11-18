// v61f · Dựng ảnh duyệt REVIEW_v61_fps.png từ tools/qa/out/fps-before + fps-after (chạy fps.js trước)
// Dùng (từ school/): node tools/qa/fps_review.js [before] [after]
const fs = require('fs'), path = require('path');
const {chromium} = require('playwright');
const A = process.argv[2] || 'before', B = process.argv[3] || 'after', OUT = path.join(__dirname, 'out');
const VPN = {phone:'📱 390×844 (cảm ứng)', land:'📱 844×390 (cảm ứng)', desk:'🖥 1440×900'};
const load = (t, k) => JSON.parse(fs.readFileSync(path.join(OUT, 'fps-' + t, k + '.json'), 'utf8'));
const esc = s => String(s).replace(/[&<>]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;'}[c]));
const fn = s => esc(String(s).replace(/ @.*? (\d+ms)$/, ' $1').replace(/^(\S+) @(\S+?):\d+ (\d+ms)$/, '$1 ($2) $3'));
const why = w => { const f = w.incl.find(s => !/^(frame|render|v46Render|extUpdate|v54q|\(ẩn danh\) @ext\/v54q)/.test(s)) || w.self[0] || ''; return fn(f); };

const D = Object.keys(VPN).map(k => ({k, a:load(A, k), b:load(B, k)}));
const rows = D.map(({k, a, b}) => `<tr><td>${VPN[k]}</td><td>${a.avg}</td><td class=g>${b.avg}</td><td>${a.min}</td><td class=g>${b.min}</td><td>${a.long50}<br><small>${(a.long50/a.frames*100).toFixed(0)}% khung</small></td><td class=g>${b.long50}<br><small>${(b.long50/b.frames*100).toFixed(0)}% khung</small></td><td>${a.long100}<br><small>${(a.long100/a.frames*100).toFixed(0)}%</small></td><td class=g>${b.long100}<br><small>${(b.long100/b.frames*100).toFixed(0)}%</small></td><td>${Math.round(a.worst[0].ms)}</td><td class=g>${Math.round(b.worst[0].ms)}</td><td>${a.consoleLogs.length} / ${b.consoleLogs.length}</td></tr>`).join('');
const worst = D.map(({k, a, b}) => `<div class=wk><h3>${VPN[k]} · 10 chỗ khựng nặng nhất</h3><div class=two>
  <ol class=bad>${a.worst.map(w => `<li><b>${w.ms} ms</b> ${esc(w.tag)}<br><small>${why(w)}</small></li>`).join('')}</ol>
  <ol class=ok>${b.worst.map(w => `<li><b>${w.ms} ms</b> ${esc(w.tag)}<br><small>${why(w)}</small></li>`).join('')}</ol></div></div>`).join('');
const data = JSON.stringify(D.map(({k, a, b}) => ({k, n:VPN[k], a:a.hist, b:b.hist})));

const html = `<!doctype html><meta charset=utf-8><style>
body{margin:0;background:#0f1530;color:#eef2ff;font:600 15px 'Be Vietnam Pro',Nunito,system-ui,sans-serif;width:1600px}
.wrap{padding:28px 34px}h1{font-size:30px;margin:0 0 4px}h2{font-size:20px;margin:22px 0 8px;color:#ffd23f}h3{font-size:16px;margin:6px 0}
p.s{margin:0 0 14px;opacity:.85;font-weight:600}
table{border-collapse:collapse;width:100%;font-size:16px}td,th{border:1px solid #2c376b;padding:6px 8px;text-align:center}th{background:#1c2655}td:first-child{text-align:left}
td.g{color:#7dffa8;font-weight:800}.leg span{display:inline-block;margin-right:18px}.leg i{display:inline-block;width:14px;height:14px;border-radius:3px;margin-right:6px;vertical-align:-2px}
.ch{background:#151d42;border-radius:10px;padding:8px 12px;margin:8px 0}canvas{display:block}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}ol{margin:0;padding:8px 10px 8px 34px;border-radius:10px;font-size:13px;line-height:1.35}ol li{margin:3px 0}ol.bad{background:#3a1830}ol.ok{background:#14382a}small{opacity:.8;font-weight:600}
.notes{background:#151d42;border-radius:10px;padding:10px 16px;line-height:1.55}.notes li{margin:2px 0}
.cols{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}.hd{display:flex;justify-content:space-between;align-items:baseline}
</style><div class=wrap>
<div class=hd><h1>⚡ v61f · Chống khựng hình — TRƯỚC / SAU</h1><span>CPU chậm ×4 (giống điện thoại) · Playwright + Profiler</span></div>
<p class=s>Lộ trình Robo v54q (40 khu, 14 cửa, 22 mini game, 6 phương tiện, giờ & mùa) + giờ trôi nhanh, zoom nhanh, hành tinh 🌍, góc nhìn thứ 3 🎥, máy bay bám đuôi ✈️, chỉ đường dấu chân 👣, thông báo.</p>
<table><tr><th>Màn hình</th><th colspan=2>FPS trung bình<br>trước → sau</th><th colspan=2>FPS thấp nhất (0,5 s)</th><th colspan=2>Số khung &gt; 50 ms</th><th colspan=2>Số khung &gt; 100 ms</th><th colspan=2>Khung dài nhất (ms)</th><th>Lỗi console</th></tr>${rows}</table>
<h2>📈 Thời gian từng khung hình (ms, trục log) — đỏ: TRƯỚC · xanh: SAU · vạch 50 ms</h2>
<div id=charts></div>
<h2>🐢 10 chỗ khựng nặng nhất (trái: TRƯỚC · phải: SAU) và hàm gây ra</h2><div class=cols>${worst}</div>
<h2>📝 Đã sửa</h2><ul class=notes>
<li>🍂 <b>Đổi mùa</b> (v49 đổi mùa ngẫu nhiên mỗi 6 giờ; đổi giờ / ngày–đêm cũng đổi mùa): trước dựng lại nền cũ + ~40 miếng nền khu (getImageData) + ảnh toàn cảnh 2048² + 6 ô nền 1024² trong <u>một</u> khung (≈2–3 giây). Giờ vẫn vẽ cache mùa cũ, dựng cache mới từng phần (≤ 8 ms/khung), làm nóng canvas mới rồi đổi một lần. Hình giống hệt (khác 0,01–0,06% điểm ảnh do người, nước chuyển động).</li>
<li>🗺 <b>Ảnh toàn cảnh</b> bị xoá vì đổi mẫu nhà / sân bay / biển: dựng lại theo 8 dải, vẫn hiện ảnh cũ trong lúc chờ. <b>Ô nền 1024²</b>: tối đa 1 ô mỗi khung (trước 6 ô khi mới vào).</li>
<li>♟ <b>Bàn cờ NPC</b>: chọn nước bằng chess.js mất 100–500 ms một lần → giờ thử 2 nước mỗi khung, cùng cách chọn nước.</li>
<li>✨ <b>Bầu trời sao</b> (30 000 chấm, ~350 ms khi lần đầu bay khinh khí cầu / nhìn lên trời): dựng sẵn từng phần lúc rảnh, cùng thuật toán.</li>
<li>🎥 <b>Góc nhìn thứ 3</b>: khung đầu dựng 4 ô nền + 2 cache khu → giờ 1 + 1 mỗi khung.</li>
<li>🛍 <b>Cửa hàng</b>: đọc kích thước các thẻ một lần (trước dàn trang lại mỗi món), vẽ 6 ảnh xem trước ngay, phần còn lại dần mỗi khung.</li>
<li>Còn lại: <i>buildNorth / buildGround</i> (~120–180 ms ở CPU ×4) chạy 1 lần mỗi lần đổi mùa — chủ yếu là JS, chia dải không nhanh hơn. FPS trung bình ở 1440×900 thấp vì trình duyệt thử vẽ canvas bằng phần mềm (không GPU); trên máy thật nhẹ hơn nhiều.</li>
</ul></div>
<script>const D=${data};const host=document.getElementById('charts');
D.forEach(d=>{const box=document.createElement('div');box.className='ch';box.innerHTML='<h3>'+d.n+'</h3>';const c=document.createElement('canvas');c.width=1500;c.height=170;box.appendChild(c);host.appendChild(box);
const g=c.getContext('2d'),W=c.width,H=c.height,L=v=>H-8-(Math.log10(Math.max(8,v))-Math.log10(8))/(Math.log10(3200)-Math.log10(8))*(H-16);
g.strokeStyle='#2c376b';g.fillStyle='#8a96c8';g.font='12px sans-serif';[16,33,50,100,250,1000,3000].forEach(v=>{const y=L(v);g.beginPath();g.moveTo(34,y);g.lineTo(W,y);g.stroke();g.fillText(v,2,y+4)});
g.strokeStyle='#ffd23f';g.setLineDash([6,4]);g.beginPath();g.moveTo(34,L(50));g.lineTo(W,L(50));g.stroke();g.setLineDash([]);
// cột tối đa theo nhóm điểm ảnh để thấy rõ đỉnh
const peak=(h,col)=>{const n=h.length,px=W-36;g.fillStyle=col;for(let x=0;x<px;x++){const a=Math.floor(x/px*n),b=Math.max(a+1,Math.floor((x+1)/px*n));let m=0;for(let i=a;i<b;i++)m=Math.max(m,h[i]);if(m>0){const y=L(m);g.fillRect(36+x,y,1,H-8-y)}}};
peak(d.a,'rgba(255,90,110,.75)');peak(d.b,'rgba(80,230,150,.85)');});</script>`;

(async () => {
  const f = path.join(OUT, 'review_v61.html'); fs.writeFileSync(f, html);
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1600, height:900}, deviceScaleFactor:1});
  await p.goto('file://' + f); await p.waitForTimeout(400);
  await p.screenshot({path:path.join(__dirname, '..', '..', 'REVIEW_v61_fps.png'), fullPage:true}); await b.close();
  console.log('xong REVIEW_v61_fps.png');
})();
