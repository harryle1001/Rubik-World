// v75u: kéo-thả thật ở 1 cỡ màn → tải lại → kiểm bố cục còn giữ; ảnh trước/sau + bảng Cách chơi
const {chromium} = require('playwright');
const VP = {phone:{w:390,h:844,touch:true}, land:{w:844,h:390,touch:true}, desk:{w:1440,h:900}};
const vpn = process.argv[2] || 'phone', OUT = process.argv[3] || '/tmp/v75u', Q = process.argv[4] || '';
const URL = 'http://localhost:8792/index.html' + Q;
(async () => {
  const b = await chromium.launch(); const v = VP[vpn];
  const ctx = await b.newContext({viewport:{width:v.w,height:v.h}, hasTouch:!!v.touch, isMobile:!!v.touch, deviceScaleFactor:1});
  const p = await ctx.newPage(); const logs = [];
  p.on('console', m => { if(/error|warning/.test(m.type()) && !/AudioContext|favicon|404/.test(m.text())) logs.push(m.type() + ': ' + m.text().slice(0,300)); });
  p.on('pageerror', e => logs.push('PAGEERROR ' + e.message + ' ' + String(e.stack).slice(0, 300)));
  const boot = async () => {
    await p.waitForFunction(() => typeof window.__dbg === 'function', null, {timeout:90000});
    await p.waitForFunction(() => !document.getElementById('rsBoot'), null, {timeout:60000}).catch(() => {});
    await p.waitForTimeout(2500);
    if(await p.isVisible('#lgName').catch(() => false)){ await p.fill('#lgName', 'v75u_' + vpn); await p.fill('#lgPass', 'qa12345');
      await p.click('#lgNew'); await p.waitForTimeout(1500);
      if(await p.isVisible('#lgName').catch(() => false)){ await p.click('#lgGo'); await p.waitForTimeout(1500); }
      if(await p.isVisible('#crDone').catch(() => false)){ await p.click('#crDone'); await p.waitForTimeout(1500); } }
    const go = p.getByText('Vào game', {exact:true}); if(await go.isVisible().catch(() => false)){ await go.click(); await p.waitForTimeout(1200); }
    await p.evaluate(() => window.__dbg("try{ for(let i=0;i<4;i++) if(openModal) hideModal() }catch(e){} try{ v70eClose() }catch(e){} 1"));
    await p.waitForTimeout(1500);
  };
  const rect = s => p.evaluate(s => { const e = document.querySelector(s); if(!e || !e.getClientRects().length) return null; const r = e.getBoundingClientRect(); return {x:Math.round(r.left), y:Math.round(r.top), w:Math.round(r.width), h:Math.round(r.height)}; }, s);
  const drag = async (fr, dx, dy) => { const r = await rect(fr); if(!r) return 'no ' + fr; const x = r.x + Math.min(r.w/2, 30), y = r.y + Math.min(r.h/2, 20);
    await p.mouse.move(x, y); await p.mouse.down(); for(let i = 1; i <= 12; i++){ await p.mouse.move(x + dx*i/12, y + dy*i/12); await p.waitForTimeout(16); } await p.mouse.up(); await p.waitForTimeout(250); return 'ok'; };
  await p.goto(URL); await boot();
  const R = {vp:vpn};
  await p.screenshot({path:`${OUT}_${vpn}_0truoc.png`});
  R.before = {mini:await rect('#mini'), prof:await rect('#prof'), fab:await rect('#v75uFab'), col:await rect('#v41Col'), mentor:await rect('#mentor')};
  // mở Studio bằng nút cố định
  await p.click('#v75uFab'); await p.waitForTimeout(400);
  R.panelOpen = await p.isVisible('#v75uPanel');
  await p.screenshot({path:`${OUT}_${vpn}_1studio.png`});
  await p.click('[data-go]'); await p.waitForTimeout(500);
  R.frames = await p.evaluate(() => [...document.querySelectorAll('.v75uFr')].map(f => f.dataset.k + (f.classList.contains('ghost') ? '(mờ)' : '')));
  await p.screenshot({path:`${OUT}_${vpn}_2keo.png`});
  // kéo minimap sang trái-dưới, thẻ người chơi xuống giữa
  const W = v.w, H = v.h;
  R.d1 = vpn === 'land' ? await drag('.v75uFr[data-k="mini"]', -W*.42, H*.42) : await drag('.v75uFr[data-k="mini"]', -(W - 120), H*.45);
  R.d2 = await drag('.v75uFr[data-k="prof"]', 0, H*.25);
  // chọn cột nút tròn → ẩn ; nút sổ hành trình → vào menu
  await p.focus('.v75uFr[data-k="col"]'); await p.waitForTimeout(150); await p.click('#v75uAct [data-q="h"]'); await p.waitForTimeout(200);
  if(await p.$('.v75uFr[data-k="bookbtn"]')){ await p.focus('.v75uFr[data-k="bookbtn"]'); await p.waitForTimeout(150); await p.click('#v75uAct [data-q="m"]'); await p.waitForTimeout(200); }
  else if(await p.$('.v75uFr[data-k="mlog"]')){ await p.focus('.v75uFr[data-k="mlog"]'); await p.waitForTimeout(150); await p.click('#v75uAct [data-q="m"]'); await p.waitForTimeout(200); }
  // phóng to minimap bằng chấm góc
  await p.focus('.v75uFr[data-k="mini"]'); await p.waitForTimeout(150);
  const rz = await rect('.v75uFr[data-k="mini"] .v75uRz');
  if(rz){ await p.mouse.move(rz.x + 16, rz.y + 16); await p.mouse.down(); for(let i = 1; i <= 8; i++){ await p.mouse.move(rz.x + 16 + 4*i, rz.y + 16 + 4*i); await p.waitForTimeout(16); } await p.mouse.up(); await p.waitForTimeout(200); }
  await p.screenshot({path:`${OUT}_${vpn}_3dangkeo.png`});
  await p.click('#v75uBar [data-a="done"]'); await p.waitForTimeout(600);
  R.after = {mini:await rect('#mini'), prof:await rect('#prof'), col:await rect('#v41Col'), book:await rect('#v70sIc'), mlog:await rect('#mlog')};
  await p.screenshot({path:`${OUT}_${vpn}_4sau.png`});
  // menu ☰ có ô Studio + ô khối đã dời vào
  await p.evaluate(() => window.__dbg('v32MenuToggle(true); 1')); await p.waitForTimeout(700);
  R.menu = await p.evaluate(() => [...document.querySelectorAll('#v32Menu .v39tile')].map(x => x.textContent.trim()).filter(x => /Studio|📌/.test(x)));
  await p.screenshot({path:`${OUT}_${vpn}_4bmenu.png`});
  await p.evaluate(() => window.__dbg('v32MenuToggle(false); 1')); await p.waitForTimeout(300);
  // bảng cách chơi
  await p.keyboard.press('KeyU').catch(() => {}); await p.waitForTimeout(300);
  if(!(await p.isVisible('#v75uPanel'))) await p.click('#v75uFab');
  await p.click('[data-t="play"]'); await p.waitForTimeout(300);
  await p.click('[data-k="spd"][data-v="1.25"]'); await p.click('[data-k="guide"][data-v="none"]'); await p.waitForTimeout(200);
  await p.screenshot({path:`${OUT}_${vpn}_5cachchoi.png`});
  R.play = await p.evaluate(() => window.__v75u.V75U.S.play);
  await p.click('#v75uPanel [data-x]');
  // FPS ~ 2 giây
  R.fps = await p.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if(performance.now() - t0 < 2000) requestAnimationFrame(f); else r(Math.round(n/((performance.now() - t0)/1000))); }; requestAnimationFrame(f); }));
  // tải lại trang: giữ bố cục?
  await p.reload(); await boot(); await p.waitForTimeout(1500);
  R.reload = {mini:await rect('#mini'), prof:await rect('#prof'), col:await rect('#v41Col'), book:await rect('#v70sIc'), mlog:await rect('#mlog')};
  await p.screenshot({path:`${OUT}_${vpn}_6tailai.png`});
  R.logs = logs;
  console.log(JSON.stringify(R, null, 1));
  await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
