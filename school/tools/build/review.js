// v61l · dựng ảnh duyệt school/REVIEW_v61_load.png từ kết quả perf.js (mỗi dòng 1 JSON) + ảnh màn chờ.
// Dùng: node tools/build/review.js <perf.txt> <splash.png>
const fs = require('fs'), path = require('path'), {chromium} = require('playwright');
const rows = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n').map(l => JSON.parse(l));
const splash = 'data:image/png;base64,' + fs.readFileSync(process.argv[3]).toString('base64');
const get = (tag, vp) => rows.find(r => r.tag === tag && r.vp === vp);
const VPS = ['390x844', '844x390', '1440x900'];
const s = ms => (ms/1000).toFixed(1).replace('.', ',') + ' s';
const B = get('before', '390x844'), A = get('after', '390x844');
const METRICS = [['Màn hình chờ hiện', r => r.first.splash], ['Đăng nhập hiện', r => r.first.login], ['Chơi được', r => r.first.play], ['Mở lần 2 · đăng nhập', r => r.second.login], ['Mở lần 2 · chơi được', r => r.second.play]];
const max = Math.max(...METRICS.map(([, f]) => f(B)));
const bars = METRICS.map(([n, f]) => { const b = f(B), a = f(A);
  return `<div class="g"><div class="n">${n}</div><div class="row"><i class="b" style="width:${b/max*100}%"></i><em>${s(b)}</em></div><div class="row"><i class="a" style="width:${Math.max(.6, a/max*100)}%"></i><em><b>${s(a)}</b></em></div></div>`; }).join('');
const tbl = VPS.map(v => { const b = get('before', v), a = get('after', v); if(!b || !a) return '';
  return `<tr><td>${v.replace('x', '×')}</td><td>${b.first.req} → <b>${a.first.req}</b></td><td>${b.first.MB.toString().replace('.', ',')} → <b>${a.first.MB.toString().replace('.', ',')}</b> MB</td><td>${s(b.first.login)} → <b>${s(a.first.login)}</b></td><td>${s(b.first.play)} → <b>${s(a.first.play)}</b></td><td>${s(b.second.login)} → <b>${s(a.second.login)}</b></td><td>${a.first.errs.length + a.second.errs.length}</td></tr>`; }).join('');
const html = `<!doctype html><meta charset=utf-8><style>
body{margin:0;background:#fcfcfb;color:#0b0b0b;font:600 17px Nunito,'Be Vietnam Pro',system-ui,sans-serif;width:1600px}
.w{padding:36px 44px;display:grid;grid-template-columns:1fr 330px;gap:40px}
h1{font-size:34px;margin:0 0 4px}.sub{color:#52514e;margin:0 0 22px;font-size:17px}
.leg{display:flex;gap:22px;margin:0 0 14px;color:#52514e}.leg span:before{content:'';display:inline-block;width:14px;height:14px;border-radius:3px;margin-right:7px;vertical-align:-2px;background:var(--c)}
.g{margin:0 0 14px}.n{font-weight:800;margin:0 0 5px}.row{display:flex;align-items:center;gap:10px;height:24px;margin:0 0 3px}
.row i{display:block;height:18px;border-radius:0 4px 4px 0}.b{background:#eb6834}.a{background:#2a78d6}.row em{font-style:normal;color:#52514e;white-space:nowrap}.row b{color:#0b0b0b}
table{border-collapse:collapse;width:100%;margin-top:20px;font-size:16px}td,th{padding:8px 10px;border-bottom:1px solid #e4e3df;text-align:left}th{color:#52514e;font-weight:700}
ul{margin:18px 0 0;padding-left:22px;line-height:1.5}li{margin:0 0 4px}
.ph{border-radius:22px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.18);border:6px solid #111}.ph img{display:block;width:100%}.cap{color:#52514e;margin-top:10px;font-size:16px}
</style><div class=w><div>
<h1>v61l · Tải trang nhanh hơn</h1><p class=sub>Điện thoại 390×844 · 4G giả lập (trễ 150 ms, 1,5 MB/s) · CPU chậm ×4 · máy chủ thử giống Netlify (brotli, ETag)</p>
<div class=leg><span style="--c:#eb6834">Trước (137 file JS + CDN)</span><span style="--c:#2a78d6">Sau (1 bundle + tải lười)</span></div>
${bars}
<table><tr><th>Màn hình</th><th>Yêu cầu</th><th>Tải về (lần 1)</th><th>Đăng nhập hiện</th><th>Chơi được</th><th>Lần 2 · đăng nhập</th><th>Lỗi console</th></tr>${tbl}</table>
<ul>
<li>📦 136 file JS → <b>1 bundle</b> <code>dist/game.&lt;hash&gt;.js</code> (rút gọn an toàn, không đổi tên biến), chess.js đóng kèm.</li>
<li>📚 Sách 4,2 MB + 🎹 piano 1,7 MB tách ra <code>dist/*.json</code>, chỉ tải khi mở thư viện / đàn. 🧊 three.js tải lúc rảnh hoặc khi mở Rubik 3D.</li>
<li>🖼 Ảnh toàn cảnh đảo dựng dần giữa các khung hình; khung đầu dựng tối đa 1 ô nền → bớt treo.</li>
<li>⚡ Màn chờ có logo + thanh tiến độ hiện ngay ~0,3 s; font tải song song với code.</li>
<li>♻️ Service worker cache file có hash; build mới = tên mới → luôn cập nhật. Dự phòng: tải từng file như cũ.</li>
<li>✅ Robo QA (68 bước mini game + xe): trước/sau như nhau, 0 lỗi console. Đăng nhập, đi lại, máy bay, Rubik 3D, học viện phép thuật, góc nhìn thứ 3, hành tinh, sách, piano: chạy ở cả 3 cỡ.</li>
<li>⚠️ Chưa đạt hẳn mục tiêu “chơi được ≤ 4 s / mở lại ≤ 1,5 s” trên máy đo này (máy này chậm hơn ~1,4× máy đo 9,2 s của chủ game). Phần còn lại là khởi tạo thế giới (~2,7 s CPU ×4: dựng đường, nhà, cây theo bộ sinh ngẫu nhiên có thứ tự) — không dời được mà không đổi bản đồ.</li></ul></div>
<div><div class=ph><img src="${splash}"></div><div class=cap>Màn chờ mới (hiện sau ~0,3 s): logo, tên game, thanh tiến độ “Đang tải…”, thay cho trang “Đang tải…” chữ trơn.</div></div></div>`;
(async () => { const b = await chromium.launch(), p = await b.newPage({viewport:{width:1600, height:900}, deviceScaleFactor:2});
  await p.setContent(html); await p.waitForTimeout(300);
  await p.screenshot({path:path.join(__dirname, '../../REVIEW_v61_load.png'), fullPage:true}); await b.close(); console.log('ok'); })();
