// v74r: gộp số đo trước/sau (các lượt F{off,on}{1..3} của v74r-prof.js trong /tmp/v74r) → bảng ảnh REVIEW_v74r_bang.png
const fs = require('fs'), D = '/tmp/v74r';
const rd = f => { try { return JSON.parse(fs.readFileSync(D + '/' + f, 'utf8')); } catch(e){ return null; } };
const avg = a => a.reduce((s, v) => s + v, 0)/a.length;
const rows = [];
for(const [vp, x] of [['land', 4], ['desk', 1]]){
  const g = t => [1, 2, 3].map(r => rd(`F${t}${r}-${vp}-x${x}.json`)).filter(Boolean).map(o => o.frames);
  const A = g('off'), B = g('on'); if(!A.length || !B.length) continue;
  const m = (L, k) => +avg(L.map(f => f[k])).toFixed(1), mx = (L, k) => Math.max(...L.map(f => f[k]));
  rows.push({vp:vp === 'land' ? '844×390 · CPU ×4 · Vừa · đi dọc bản đồ 40 s' : '1440×900 · CPU ×1 · Cao · đi dọc bản đồ 30 s', n:A.length,
    fps:[m(A, 'fps'), m(B, 'fps')], gt50:[m(A, 'gt50'), m(B, 'gt50')], gt100:[m(A, 'gt100'), m(B, 'gt100')], max:[mx(A, 'max'), mx(B, 'max')], p95:[m(A, 'p95'), m(B, 'p95')], runs:[A.map(f => f.fps), B.map(f => f.fps)]});
}
const prof = (f, k) => { const o = rd(f); return o ? o[k].top.slice(0, 10) : []; };
const before = {desk:prof('before-desk-x1.json', 'all'), land:prof('before-land-x4.json', 'all')};
const pct = (a, b) => (b >= a ? '+' : '') + Math.round((b - a)/a*100) + '%';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const html = `<!doctype html><meta charset=utf8><style>body{margin:0;padding:24px;background:#0f1424;color:#eef;font:16px system-ui,sans-serif;width:1180px}h1{font-size:24px;margin:0 0 6px}p{margin:4px 0 14px;color:#aab}
table{border-collapse:collapse;width:100%;margin:8px 0 20px}td,th{border:1px solid #2c3550;padding:7px 10px;text-align:left}th{background:#1b2340}td.n{text-align:right;font-variant-numeric:tabular-nums}.g{color:#7dffa0;font-weight:700}h2{font-size:18px;margin:14px 0 4px}code{color:#ffd27a}</style>
<h1>v74r · Độ mượt khi chơi — số trước / sau</h1><p>Chromium headless không GPU · Playwright · tài khoản mới · cùng lộ trình cố định (300 đv/s) · mỗi cấu hình ${rows[0] ? rows[0].n : 0} cặp chạy xen kẽ (trước = <code>?v74roff</code>), lấy trung bình.</p>
<table><tr><th>Cấu hình</th><th>FPS TB</th><th>Khung &gt; 50 ms</th><th>Khung &gt; 100 ms</th><th>p95 (ms)</th><th>Khung dài nhất (ms)</th></tr>
${rows.map(r => `<tr><td>${r.vp}</td><td class=n>${r.fps[0]} → <b class=g>${r.fps[1]}</b> (${pct(r.fps[0], r.fps[1])})</td><td class=n>${r.gt50[0]} → <b class=g>${r.gt50[1]}</b> (${pct(r.gt50[0], r.gt50[1])})</td><td class=n>${r.gt100[0]} → <b class=g>${r.gt100[1]}</b></td><td class=n>${r.p95[0]} → ${r.p95[1]}</td><td class=n>${r.max[0]} → ${r.max[1]}</td></tr>`).join('')}
</table>
<p>Từng lượt FPS: ${rows.map(r => r.vp.split(' ·')[0] + ' trước ' + r.runs[0].join(' / ') + ' · sau ' + r.runs[1].join(' / ')).join(' — ')}</p>
<h2>Trước khi sửa: hàm tốn nhất theo self-time (CPU profile CDP)</h2>
<table><tr><th>1440×900 Cao</th><th>%</th><th>844×390 CPU ×4</th><th>%</th></tr>
${Array.from({length:10}, (_, i) => `<tr><td>${esc((before.desk[i] || [''])[0])}</td><td class=n>${(before.desk[i] || [])[2] ?? ''}</td><td>${esc((before.land[i] || [''])[0])}</td><td class=n>${(before.land[i] || [])[2] ?? ''}</td></tr>`).join('')}</table>
<h2>Đã sửa (js/ext/v74r-perf.js)</h2><p>1) Nền: bỏ 3 lớp bị ô nền che kín (biển sâu, ảnh biển xa phóng to, ảnh toàn cảnh) — chỉ khi mọi ô đã sẵn; giống từng điểm ảnh.<br>
2) Bàn cờ NPC: chọn nước ở Web Worker (cùng thuật toán), dự phòng trên luồng chính có ngân sách 1,2 ms/khung và bỏ phép tính chiếu hết trùng.<br>
3) Bật nướng trước ô nền sắp tới của v72p (có sẵn nhưng chưa bật) + làm nóng trước bộ đệm khu/toà nhà sắp vào màn hình.<br>4) Giải mã sẵn ảnh nhân vật / bộ ô bằng img.decode().</p>`;
(async () => { const b = await require('playwright').chromium.launch(), p = await b.newPage({viewport:{width:1228, height:800}, deviceScaleFactor:1});
  await p.setContent(html); await p.screenshot({path:__dirname + '/../../REVIEW_v74r_bang.png', fullPage:true}); await b.close();
  console.log(JSON.stringify(rows, null, 1)); })();
