// v74q: ghép ảnh duyệt school/REVIEW_v74q_*.png từ kết quả check.js + vài ảnh chụp thêm. Chạy: node tools/qa/v74q/compose.js (từ school/)
const C = require('../check.js'); const {chromium} = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../../..'), OUT = path.join(__dirname, 'out'), b64 = f => 'data:image/' + (f.endsWith('.png') ? 'png' : 'jpeg') + ';base64,' + fs.readFileSync(f).toString('base64');
// FPS đo tay khi tìm lỗi clip (máy tính 1440×900, đứng yên, trình duyệt không GPU)
const FPS = {before:[58.8, 45.2, 26.8, 18], after:[38, 58.4, 60.4, 54.8]};
(async () => {
  const srv = await C.up(); const b = await chromium.launch(); const shots = {};
  { const {p, ctx} = await C.openPage(b, 'phone'); await C.login(p, 'rv' + Math.random().toString(36).slice(2, 6)); await p.addStyleTag({content:C.QUIET}); await C.dbg(p, C.HELP);
    await C.dbg(p, 'try{ v70eClose() }catch(e){} v70sBook(); 1'); await p.waitForTimeout(700); shots.book = await p.screenshot({type:'png'}); await C.dbg(p, "document.getElementById('v70sBook').hidden = true; 1");
    await C.dbg(p, 'v53cOpen("fire"); 1'); await p.waitForTimeout(700); shots.fire = await p.screenshot({type:'png'}); await p.evaluate(() => window.__H.close(''));
    await C.dbg(p, 'try{ v70eClose() }catch(e){} try{ v54qForceClose() }catch(e){} v54qTele(...v46ToOld(...v46Gate())); 1'); await p.waitForTimeout(900); await C.dbg(p, 'try{ v70eClose() }catch(e){} 1');
    await p.addStyleTag({content:'#v70ePanel{display:none!important}'}); await C.dbg(p, 'v73aSpeedStart(); 1'); await p.waitForTimeout(2500); console.log('bay:', await C.dbg(p, 'V51P.on'), 'nút v70eGo hiện:', await p.evaluate(() => { const e = document.getElementById("v70eGo"); return !!e && !e.hidden; })); shots.fly = await p.screenshot({type:'png'}); await ctx.close(); }
  { const ctx = await b.newContext({viewport:{width:1280, height:1500}}); const p = await ctx.newPage(); await p.goto('file://' + path.join(ROOT, 'tools/qa/report.html')); await p.waitForTimeout(1500);
    shots.rep = await p.screenshot({type:'png'}); await ctx.close(); }
  const R = JSON.parse(fs.readFileSync(path.join(__dirname, 'last.json'), 'utf8')), RB = fs.existsSync(path.join(__dirname, 'last-bundle.json')) ? JSON.parse(fs.readFileSync(path.join(__dirname, 'last-bundle.json'), 'utf8')) : null;
  const cnt = (X, s) => X ? X.issues.filter(i => i.sev === s).length : '-';
  const bar = (L, col) => L.map((v, i) => `<div class="b"><i style="height:${v*3}px;background:${col}"></i><span>${v}</span><small>phút ${i}</small></div>`).join('');
  const img = (buf, cap) => `<figure><img src="data:image/png;base64,${buf.toString('base64')}"><figcaption>${cap}</figcaption></figure>`;
  const page = `<!doctype html><meta charset=utf-8><link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap" rel=stylesheet><style>
body{margin:0;background:#141a2e;color:#f3efe2;font:18px Nunito,sans-serif;padding:28px;width:1544px}h1{margin:0 0 6px;font-size:34px}h2{font-size:22px;margin:0 0 10px;color:#ffd23f}p{margin:0 0 14px;color:#c9c3b0}
.row{display:flex;gap:22px;align-items:flex-start;margin-bottom:22px}.card{background:#1f2742;border-radius:18px;padding:18px 20px}.chart{display:flex;gap:16px;align-items:flex-end;height:220px;padding-top:10px}
.b{display:flex;flex-direction:column;align-items:center;gap:4px;width:56px}.b i{display:block;width:40px;border-radius:6px 6px 0 0}.b span{font-weight:900}.b small{font-size:16px;color:#c9c3b0}
figure{margin:0}figure img{width:300px;border-radius:14px;display:block;border:3px solid #2e3a60}figcaption{font-size:16px;margin-top:6px;max-width:300px}.n{font-size:40px;font-weight:900}.k{display:flex;gap:18px}.k div{background:#141a2e;border-radius:12px;padding:8px 16px;text-align:center}
</style><h1>🤖 v74q · Ổn định & kiểm tra tự động</h1><p>node tools/qa/check.js — 3 cỡ màn hình · 74 khu · 69 mini game & bảng · lưu/tải hồ sơ · FPS. Bản từng file và bản gói đều chạy.</p>
<div class="row"><div class="card"><h2>Lỗi nặng đã sửa: FPS tụt dần khi chơi lâu</h2><p>Canvas ảnh đệm khu (v46ZoneCache) bị chồng vùng cắt clip() mãi → càng chơi càng chậm.</p>
<div class="row" style="margin:0"><div><b>Trước</b><div class="chart">${bar(FPS.before, '#e0533a')}</div></div><div><b>Sau v74q</b><div class="chart">${bar(FPS.after, '#3fbf6f')}</div></div></div></div>
<div class="card"><h2>Kết quả lượt kiểm cuối</h2><div class="k"><div><div class="n">${cnt(R, 'high')}</div>Nặng<br><small>từng file</small></div><div><div class="n">${cnt(RB, 'high')}</div>Nặng<br><small>bản gói</small></div><div><div class="n">${cnt(R, 'mid')}/${cnt(RB, 'mid')}</div>Vừa</div><div><div class="n">${cnt(R, 'low')}/${cnt(RB, 'low')}</div>Nhẹ</div></div>
<p style="margin-top:14px">Init chạy không lỗi: ${Object.values(R.vp).map(V => V.init.filter(x => x.ok).length + '/' + V.init.length).join(' · ')}<br>Lưu → tải lại: ${Object.values(R.vp).map(V => V.save && Object.values(V.save.check).every(Boolean) && !V.save.diffs.length ? '✅' : '❌').join(' ')} (tiền, đồ, công lương, truyện, cây)<br>
FPS sau chơi lâu (máy tính): ${R.vp.desk && R.vp.desk.fps && R.vp.desk.fps.soak ? R.vp.desk.fps.soak.fps : '-'}${RB && RB.vp.desk && RB.vp.desk.fps.soak ? ' · bản gói ' + RB.vp.desk.fps.soak.fps : ''}</p></div></div>
<div class="row">${img(shots.book, '📖 Hành trình: 6 mảnh & gợi ý lên 16px (3 cột trên điện thoại)')}${img(shots.fire, '🚒 Trạm cứu hoả: “Fire Station · ☎️ 114” 16px')}${img(shots.fly, '✈️ Đang bay: nút Bảng vàng/Lễ hội không còn nằm dưới cần lái')}
<figure><img src="data:image/png;base64,${shots.rep.toString('base64')}" style="width:520px"><figcaption>tools/qa/report.html</figcaption></figure></div>`;
  const ctx = await b.newContext({viewport:{width:1600, height:900}}); const p = await ctx.newPage(); await p.setContent(page); await p.waitForTimeout(1200);
  await p.screenshot({path:path.join(ROOT, 'REVIEW_v74q_tongket.png'), fullPage:true});
  // ảnh từng khu (điện thoại + máy tính) từ out/
  const Z = vp => (R.vp[vp] && R.vp[vp].zones || []).map(z => `<figure style="width:${vp === 'phone' ? 92 : 190}px"><img src="${b64(path.join(OUT, z.img))}" style="width:100%;border-width:2px"><figcaption style="font-size:16px;line-height:1.2">${z.name}</figcaption></figure>`).join('');
  await p.setContent(`<!doctype html><meta charset=utf-8><link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;900&display=swap" rel=stylesheet><style>body{margin:0;background:#141a2e;color:#f3efe2;font:16px Nunito,sans-serif;padding:24px;width:1552px}h1{font-size:28px;margin:0 0 12px}.g{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px}figure{margin:0}img{border-radius:8px;border:2px solid #2e3a60;display:block}</style>
    <h1>🗺 Tất cả khu — máy tính 1440×900</h1><div class="g">${Z('desk')}</div>`); await p.waitForTimeout(800);
  await p.screenshot({path:path.join(ROOT, 'REVIEW_v74q_khu.png'), fullPage:true});
  await b.close(); if(srv) srv.kill(); console.log('đã ghi REVIEW_v74q_tongket.png, REVIEW_v74q_khu.png');
})();
