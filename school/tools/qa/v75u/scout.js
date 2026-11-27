// v75u: liệt kê các khối giao diện đang hiện trên màn chơi (để lập danh sách khai báo)
const {chromium} = require('playwright');
const VP = {phone:{w:390,h:844,touch:true}, land:{w:844,h:390,touch:true}, desk:{w:1440,h:900}};
const vpn = process.argv[2] || 'phone', OUT = process.argv[3] || '/tmp/scout';
(async () => {
  const b = await chromium.launch(); const v = VP[vpn];
  const ctx = await b.newContext({viewport:{width:v.w,height:v.h}, hasTouch:!!v.touch, isMobile:!!v.touch, deviceScaleFactor:1});
  const p = await ctx.newPage(); const logs = [];
  p.on('console', m => { if(/error|warning/.test(m.type())) logs.push(m.text().slice(0,200)); });
  p.on('pageerror', e => logs.push('PE ' + e.message));
  await p.goto('http://localhost:8792/index.html' + (process.argv[4] || ''));
  await p.waitForFunction(() => typeof window.__dbg === 'function', null, {timeout:90000});
  await p.waitForTimeout(2500);
  if(await p.isVisible('#lgName').catch(() => false)){ await p.fill('#lgName', 'v75u_' + vpn); await p.fill('#lgPass', 'qa12345'); await p.click('#lgNew'); await p.waitForTimeout(1500);
    if(await p.isVisible('#crDone').catch(() => false)){ await p.click('#crDone'); await p.waitForTimeout(1500); } }
  const go = p.getByText('Vào game', {exact:true}); if(await go.isVisible().catch(() => false)){ await go.click(); await p.waitForTimeout(1200); }
  await p.evaluate(() => window.__dbg("try{ for(let i=0;i<4;i++) if(openModal) hideModal() }catch(e){} 1"));
  await p.waitForTimeout(3000);
  await p.evaluate(() => window.__dbg("try{ v70eClose() }catch(e){} 1")); await p.waitForTimeout(800);
  await p.screenshot({path:OUT + '_' + vpn + '.png'});
  const r = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('body *').forEach(e => {
      const cs = getComputedStyle(e); if(cs.position !== 'fixed' && cs.position !== 'absolute') return;
      if(cs.display === 'none' || cs.visibility === 'hidden') return;
      const rc = e.getBoundingClientRect(); if(rc.width < 8 || rc.height < 8) return;
      if(rc.right < 0 || rc.bottom < 0 || rc.left > innerWidth || rc.top > innerHeight) return;
      // bỏ nếu cha cũng fixed/absolute (chỉ lấy khối ngoài cùng)
      let q = e.parentElement, inner = false; while(q && q !== document.body){ const c2 = getComputedStyle(q); if((c2.position === 'fixed' || c2.position === 'absolute') && q.id !== 'stage' && !q.classList.contains('stage')) { inner = true; break; } q = q.parentElement; }
      if(inner) return;
      out.push({tag:e.tagName, id:e.id, cls:String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className).slice(0,60), pos:cs.position, z:cs.zIndex, x:Math.round(rc.left), y:Math.round(rc.top), w:Math.round(rc.width), h:Math.round(rc.height), par:(e.parentElement.id || e.parentElement.className || e.parentElement.tagName).toString().slice(0,30), t:(e.innerText || '').replace(/\s+/g,' ').slice(0,50)});
    });
    return out;
  });
  console.log(JSON.stringify(r, null, 0).replace(/\},\{/g, '}\n{'));
  console.log('LOGS', logs.join('\n'));
  await b.close();
})();
