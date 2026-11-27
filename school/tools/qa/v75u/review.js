// v75u: chụp ảnh duyệt Studio giao diện (trước / đang kéo / sau / tải lại / bảng Studio / Cách chơi / ☰ Menu) rồi ghép có vòng đỏ đánh số
// node tools/qa/v75u/review.js [phone,land,desk] [?bundle]  → school/REVIEW_v75u_<cỡ>.png
const fs = require('fs'), path = require('path');
const {chromium} = require('playwright');
const VP = {phone:{w:390,h:844,touch:true,vi:'Điện thoại dọc 390×844'}, land:{w:844,h:390,touch:true,vi:'Điện thoại ngang 844×390'}, desk:{w:1440,h:900,vi:'Máy tính 1440×900'}};
const LIST = (process.argv[2] || 'phone,land,desk').split(','), Q = process.argv[3] || '';
const URL = 'http://localhost:8792/index.html' + Q, ROOT = path.join(__dirname, '..', '..', '..'), OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, {recursive:true});
const QUIET = '#v70sDlg,#v70sCard,#v70sPill,#v70eAch,#v59gTip,.v59gTip,#v70ePanel{display:none!important}';
async function shoot(b, vpn){
  const v = VP[vpn], ctx = await b.newContext({viewport:{width:v.w, height:v.h}, hasTouch:!!v.touch, isMobile:!!v.touch, deviceScaleFactor:2});
  const p = await ctx.newPage(), logs = [], M = {vp:vpn, w:v.w, h:v.h, shots:{}};
  p.on('console', m => { if(/error|warning/.test(m.type()) && !/AudioContext|favicon|404|v61l/.test(m.text())) logs.push(m.text().slice(0, 300)); });
  p.on('pageerror', e => logs.push('PAGEERROR ' + e.message));
  const boot = async () => { await p.waitForFunction(() => typeof window.__dbg === 'function', null, {timeout:90000}); await p.waitForFunction(() => !document.getElementById('rsBoot'), null, {timeout:60000}).catch(() => {}); await p.waitForTimeout(2500);
    if(await p.isVisible('#lgName').catch(() => false)){ await p.fill('#lgName', 'Hà Quân ' + vpn); await p.fill('#lgPass', 'qa12345'); await p.click('#lgNew'); await p.waitForTimeout(1500);
      if(await p.isVisible('#lgName').catch(() => false)){ await p.click('#lgGo'); await p.waitForTimeout(1500); }
      if(await p.isVisible('#crDone').catch(() => false)){ await p.click('#crDone'); await p.waitForTimeout(1500); } }
    const go = p.getByText('Vào game', {exact:true}); if(await go.isVisible().catch(() => false)){ await go.click(); await p.waitForTimeout(1200); }
    await p.addStyleTag({content:QUIET}); await p.evaluate(() => window.__dbg("try{ for(let i=0;i<4;i++) if(openModal) hideModal() }catch(e){} try{ v70eClose() }catch(e){} try{ clock = 600; weather = 'nang'; autoWeather = false }catch(e){} 1")); await p.waitForTimeout(1800); };
  const R = s => p.evaluate(s => { const e = document.querySelector(s); if(!e || !e.getClientRects().length) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }, s);
  const snap = async (n, rings) => { await p.screenshot({path:path.join(OUT, vpn + '_' + n + '.png')}); M.shots[n] = rings; };
  const drag = async (fr, dx, dy) => { const r = await R(fr); if(!r) return; const x = r[0] + Math.min(r[2]/2, 30), y = r[1] + Math.min(r[3]/2, 20);
    await p.mouse.move(x, y); await p.mouse.down(); for(let i = 1; i <= 14; i++){ await p.mouse.move(x + dx*i/14, y + dy*i/14); await p.waitForTimeout(16); } await p.mouse.up(); await p.waitForTimeout(250); };
  await p.goto(URL); await boot();
  const b0 = {mini:await R('#mini'), prof:await R('#prof'), book:await R('#v70sIc'), col:await R('#v41Col'), mlog:await R('#mlog'), fab:await R('#v75uFab')};
  await snap('a', [{r:b0.fab, t:'Nút 🎛️ Studio giao diện cố định trên màn chơi (bấm hoặc phím U trên máy tính) — mở ngay, không tải lại trang'}, {r:b0.mini, t:'Bản đồ tròn ở chỗ gốc'}, {r:b0.prof, t:'Thẻ người chơi ở chỗ gốc'}]);
  await p.click('#v75uFab'); await p.waitForTimeout(400);
  await snap('p', [{r:await R('[data-go]'), t:'“✋ Bật chế độ kéo-thả” — ghi rõ đang sửa cho kiểu màn nào (mỗi kiểu lưu riêng)'}, {r:await R('.v75uRow[data-b="prof"]'), t:'Danh sách khối: 👁 ẩn/hiện · 📥 dời vào ☰ Menu · ↩️ về mặc định từng khối'}]);
  await p.click('[data-go]'); await p.waitForTimeout(500);
  const W = v.w, H = v.h;
  if(vpn === 'land') await drag('.v75uFr[data-k="mini"]', -W*.42, H*.42); else await drag('.v75uFr[data-k="mini"]', -(W - 120), H*.45);
  await drag('.v75uFr[data-k="prof"]', 0, H*.25);
  await p.focus('.v75uFr[data-k="col"]'); await p.waitForTimeout(120); await p.click('#v75uAct [data-q="h"]'); await p.waitForTimeout(200);
  const mk = (await p.$('.v75uFr[data-k="bookbtn"]')) ? 'bookbtn' : 'mlog'; await p.focus(`.v75uFr[data-k="${mk}"]`); await p.waitForTimeout(120); await p.click('#v75uAct [data-q="m"]'); await p.waitForTimeout(200);
  await p.focus('.v75uFr[data-k="mini"]'); await p.waitForTimeout(150);
  const rz = await R('.v75uFr[data-k="mini"] .v75uRz');
  if(rz){ await p.mouse.move(rz[0] + 16, rz[1] + 16); await p.mouse.down(); for(let i = 1; i <= 8; i++){ await p.mouse.move(rz[0] + 16 + 4*i, rz[1] + 16 + 4*i); await p.waitForTimeout(16); } await p.mouse.up(); await p.waitForTimeout(250); }
  await snap('b', [{r:await R('.v75uFr[data-k="mini"]'), t:'Mọi khối có khung nét đứt + tên; kéo để dời (hít vào mép và đường tỷ lệ vàng 0.382 · 0.5 · 0.618, không thì bắt lưới 8px)'},
    {r:await R('.v75uFr[data-k="mini"] .v75uRz'), t:'Chấm vàng ở góc: kéo để đổi cỡ (61.8%–161.8%, không cho tràn màn / che quá 38% màn)'},
    {r:await R('.v75uFr[data-k="col"]'), t:'Khối đã ẩn hiện khung đỏ mờ — chọn lại để “🙈 Hiện lại”'},
    {r:await R('#v75uAct'), t:'Thanh của khối đang chọn: 👁 Ẩn · 📥 Vào menu · − + cỡ · ↩️ Mặc định'},
    {r:await R('#v75uBar'), t:'✓ Xong (lưu) · 👁 Xem trước (thoát kéo-thả) · 📋 Danh sách · ↩️ Mặc định toàn bộ · ⇅ đổi chỗ thanh'}]);
  await p.click('#v75uBar [data-a="done"]'); await p.waitForTimeout(700);
  const a1 = {mini:await R('#mini'), prof:await R('#prof')};
  await snap('c', [{r:a1.mini, t:'Bản đồ tròn đã dời chỗ và phóng to'}, {r:a1.prof, t:'Thẻ người chơi đã dời xuống — nút ☰ và cột nút không bị kéo theo'}, {r:b0.col, t:'Cột nút tròn Đèn/Xe đạp/Máy bay/Hành tinh đã ẩn'}, {r:mk === 'bookbtn' ? b0.book : b0.mlog, t:(mk === 'bookbtn' ? 'Nút Sổ Hành trình' : 'Nhật ký') + ' đã dời vào ☰ Menu'}]);
  await p.evaluate(() => window.__dbg('v32MenuToggle(true); 1')); await p.waitForTimeout(800);
  const tiles = await p.evaluate(() => [...document.querySelectorAll('#v32Menu .v39tile')].map((x, i) => [i, x.textContent.trim()]).filter(x => /Studio|📌/.test(x[1])).map(x => x[0]));
  const tr = []; for(const i of tiles){ tr.push(await p.evaluate(i => { const e = document.querySelectorAll('#v32Menu .v39tile')[i]; e.scrollIntoView({block:'center'}); const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }, i)); }
  await p.waitForTimeout(300); for(let i = 0; i < tiles.length; i++) tr[i] = await p.evaluate(i => { const e = document.querySelectorAll('#v32Menu .v39tile')[i]; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }, tiles[i]);
  await snap('m', [{r:tr[0], t:'Ô “🎛️ Studio giao diện” trong ☰ Menu'}, {r:tr[1], t:'Khối đã “dời vào menu” thành ô 📌 — bấm là mở/hiện tạm'}]);
  await p.evaluate(() => window.__dbg('v32MenuToggle(false); 1')); await p.waitForTimeout(300);
  await p.click('#v75uFab'); await p.click('[data-t="play"]'); await p.waitForTimeout(300); await p.click('[data-k="spd"][data-v="1.25"]'); await p.waitForTimeout(200);
  await snap('q', [{r:await R('[data-t="play"]'), t:'Bảng “🎮 Cách chơi” — mỗi tuỳ chọn áp dụng ngay'}, {r:await R('.v75uRow:nth-child(1)'), t:'Tốc độ đi · độ nhạy vuốt · phóng to camera · dẫn đường 👣 · chạm cửa tự đi tới · cỡ chữ · độ rõ bảng · âm lượng · đồ hoạ (v70f) · nhịp chill (v53v)'}]);
  await p.evaluate(() => { const c = document.querySelector('#v75uBody'); c.scrollTop = c.scrollHeight; }); await p.waitForTimeout(200);
  await snap('q2', [{r:await R('[data-rp]'), t:'↩️ Về mặc định cách chơi'}, {r:await R('[data-rg="alpha"]'), t:'Thanh kéo: độ rõ của bảng / âm lượng nhanh'}]);
  await p.click('#v75uPanel [data-x]');
  M.fps = await p.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if(performance.now() - t0 < 3000) requestAnimationFrame(f); else r(Math.round(n/((performance.now() - t0)/1000))); }; requestAnimationFrame(f); }));
  await p.reload(); await boot(); await p.waitForTimeout(1500);
  const rl = await R('#mini'), rp = await R('#prof'), near = (u, v) => !!u && !!v && Math.abs(u[0] - v[0]) <= 8 && Math.abs(u[1] - v[1]) <= 8; M.keep = near(rl, a1.mini) && near(rp, a1.prof); M.diff = {mini:[a1.mini, rl], prof:[a1.prof, rp]};
  await snap('r', [{r:rl, t:'Tải lại trang: bố cục vẫn giữ (lưu theo máy + kiểu màn + hồ sơ người chơi)'}]);
  M.logs = logs; await ctx.close(); return M;
}
function page(M){
  let num = 0; const notes = [];
  const pic = (n, label, s) => { const rs = (M.shots[n] || []).filter(q => q && q.r).map(q => { num++; notes.push([num, q.t]); const [x, y, w, h] = q.r, pad = 8;
      return `<div class="ring" style="left:${(x - pad)*s}px;top:${(y - pad)*s}px;width:${(w + 2*pad)*s}px;height:${(h + 2*pad)*s}px"><b>${num}</b></div>`; }).join('');
    const src = 'data:image/png;base64,' + fs.readFileSync(path.join(OUT, M.vp + '_' + n + '.png')).toString('base64');
    return `<figure><div class="im" style="width:${M.w*s}px;height:${M.h*s}px"><img src="${src}" style="width:${M.w*s}px">${rs}</div><figcaption>${label}</figcaption></figure>`; };
  const s = M.vp === 'phone' ? .9 : M.vp === 'land' ? .62 : .42;
  const row1 = [['a', 'A · Trước khi sắp xếp'], ['b', 'B · Đang kéo-thả'], ['c', 'C · Sau khi bấm ✓ Xong'], ['r', 'D · Tải lại trang']].map(([n, l]) => pic(n, l, s)).join('');
  const row2 = [['p', 'E · Studio: tab Sắp xếp'], ['q', 'F · Tab Cách chơi'], ['q2', 'G · Cuối tab Cách chơi'], ['m', 'H · ☰ Menu']].map(([n, l]) => pic(n, l, s)).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap" rel="stylesheet"><style>
body{margin:0;background:#f6f4ee;font:700 18px/1.45 Nunito,sans-serif;color:#1d2433;display:inline-block;padding:0 0 26px}
h1{margin:0;padding:26px 34px 4px;font-size:36px;font-weight:900}.sub{padding:0 34px 13px;color:#5a6378;font-size:19px}
.row{display:flex;gap:21px;padding:8px 34px;align-items:flex-start}
figure{margin:0}.im{position:relative;border-radius:13px;overflow:hidden;box-shadow:0 6px 21px rgba(0,0,0,.18)}.im img{display:block}
figcaption{padding:8px 4px 0;font-size:19px;font-weight:800}
.ring{position:absolute;border:4px solid #e53935;border-radius:50%;box-shadow:0 0 0 2px #fff;box-sizing:border-box}
.ring b{position:absolute;left:-13px;top:-13px;width:30px;height:30px;border-radius:50%;background:#e53935;color:#fff;display:grid;place-items:center;font-size:17px;border:2px solid #fff}
ol{margin:13px 34px 0;padding:0;list-style:none;columns:2;column-gap:34px;max-width:${4*M.w*s + 63}px}li{break-inside:avoid;margin:0 0 8px;display:flex;gap:10px}
li b{flex:none;width:30px;height:30px;border-radius:50%;background:#e53935;color:#fff;display:grid;place-items:center;font-size:16px}
</style></head><body><h1>🎛️ v75u · Studio giao diện — ${VP[M.vp].vi}</h1>
<div class="sub">Người chơi tự sắp xếp bảng chữ, nút, minimap; ẩn hoặc dời vào ☰ Menu; chỉnh cách chơi. FPS khi chơi ≈ ${M.fps} · tải lại giữ bố cục: ${M.keep ? 'có ✓' : 'KHÔNG ✗'} · lỗi console: ${M.logs.length}</div>
<div class="row">${row1}</div><div class="row">${row2}</div><ol>${notes.map(([n, t]) => `<li><b>${n}</b><span>${t}</span></li>`).join('')}</ol></body></html>`;
}
(async () => {
  const b = await chromium.launch(); const res = [];
  for(const vpn of LIST){ const M = await shoot(b, vpn); res.push({vp:vpn, fps:M.fps, keep:M.keep, diff:M.diff, logs:M.logs});
    const html = path.join(OUT, vpn + '.html'); fs.writeFileSync(html, page(M));
    const ctx = await b.newContext({viewport:{width:800, height:600}, deviceScaleFactor:1}); const p = await ctx.newPage(); await p.goto('file://' + html); await p.waitForTimeout(1200);
    const out = path.join(ROOT, 'REVIEW_v75u_' + vpn + '.png'); await p.locator('body').screenshot({path:out}); await ctx.close(); }
  console.log(JSON.stringify(res)); await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
