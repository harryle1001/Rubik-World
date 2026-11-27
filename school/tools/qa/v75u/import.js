// v75u: thử nhập bố cục JSON (trang Claude) bằng v75uApplyLayout và bằng V75U_PRESET (chặn file preset), rồi xuất ngược lại
const {chromium} = require('playwright');
const J = {ver:1, savedAt:'2026-11-27T00:00:00Z', screens:{doc:{w:390, h:844, blocks:[{id:'mini', x:8, y:420, w:114, h:114, hidden:false, inMenu:false}, {id:'prof', x:102, y:6, w:280, h:90}, {id:'v41Col', hidden:true}, {id:'v70sIc', inMenu:true}, {id:'toast', x:45, y:760, w:300, h:44}]},
  pc:{w:1440, h:900, blocks:[{id:'mini', x:8, y:742, w:150, h:150}]}}, play:{speed:1.25, swipe:1.6, zoom:1, font:18, alpha:.9, gfx:'1', pace:'chill', steps:false, autodoor:true}};
(async () => {
  const b = await chromium.launch(), out = {};
  for(const mode of ['fn', 'preset']){
    const ctx = await b.newContext({viewport:{width:390, height:844}, hasTouch:true, isMobile:true, deviceScaleFactor:1});
    if(mode === 'preset') await ctx.route(/v75u-preset\.js/, r => r.fulfill({status:200, contentType:'application/javascript', body:'const V75U_PRESET = ' + JSON.stringify(J) + ';'}));
    const p = await ctx.newPage(), logs = []; p.on('pageerror', e => logs.push(e.message)); p.on('console', m => { if(m.type() === 'error') logs.push(m.text()); });
    await p.goto('http://localhost:8792/index.html'); await p.waitForFunction(() => typeof window.__dbg === 'function', null, {timeout:90000}); await p.waitForTimeout(2500);
    if(await p.isVisible('#lgName').catch(() => false)){ await p.fill('#lgName', 'v75u_imp_' + mode); await p.fill('#lgPass', 'qa12345'); await p.click('#lgNew'); await p.waitForTimeout(1500);
      if(await p.isVisible('#crDone').catch(() => false)){ await p.click('#crDone'); await p.waitForTimeout(1500); } }
    await p.evaluate(() => window.__dbg("try{ for(let i=0;i<4;i++) if(openModal) hideModal() }catch(e){} try{ v70eClose() }catch(e){} 1")); await p.waitForTimeout(1500);
    if(mode === 'fn') await p.evaluate(j => window.__v75u.v75uApplyLayout(j), J);
    await p.waitForTimeout(1500);
    const R = s => p.evaluate(s => { const e = document.querySelector(s); if(!e || !e.getClientRects().length) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }, s);
    out[mode] = {mini:await R('#mini'), prof:await R('#prof'), col:await R('#v41Col'), book:await R('#v70sIc'), play:await p.evaluate(() => window.__v75u.V75U.S.play),
      exp:await p.evaluate(() => window.__v75u.v75uExportLayout().screens.doc.blocks.filter(b => /mini|prof|v41Col|v70sIc/.test(b.id))), logs};
    await ctx.close(); }
  console.log(JSON.stringify(out)); await b.close();
})();
