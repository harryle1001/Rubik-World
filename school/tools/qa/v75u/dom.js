const {chromium} = require('playwright');
(async () => { const b = await chromium.launch();
  for(const [n, w, h, t] of [['phone', 390, 844, true], ['desk', 1440, 900, false]]){
    const ctx = await b.newContext({viewport:{width:w, height:h}, hasTouch:t, isMobile:t}); const p = await ctx.newPage();
    await p.addInitScript(() => { try { localStorage.setItem('truong-v75u', JSON.stringify({v:1, t:1, lay:{phone:{}, land:{}, desk:{}}, play:{}})); } catch(e){} });
    await p.goto('http://localhost:8792/index.html'); await p.waitForFunction(() => typeof window.__dbg === 'function', null, {timeout:90000}); await p.waitForTimeout(2500);
    if(await p.isVisible('#lgName').catch(() => false)){ await p.fill('#lgName', 'v75u_dom_' + n); await p.fill('#lgPass', 'qa12345'); await p.click('#lgNew'); await p.waitForTimeout(1500); if(await p.isVisible('#crDone').catch(() => false)){ await p.click('#crDone'); await p.waitForTimeout(1500); } }
    await p.waitForTimeout(2000);
    const r = await p.evaluate(() => { const tree = (e, d) => { if(!e || d > 3) return ''; const cs = getComputedStyle(e); if(cs.display === 'none') return ''; const rc = e.getBoundingClientRect();
        let s = '  '.repeat(d) + e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : '') + ` ${Math.round(rc.width)}x${Math.round(rc.height)} fs${cs.fontSize} ${cs.display}/${cs.flexDirection}` + (e.children.length ? '' : ' "' + (e.textContent || '').trim().slice(0, 30) + '"') + '\n';
        for(const c of e.children) s += tree(c, d + 1); return s; };
      return ['#prof', '#mentor', '#v41Col', '#stage > .hud', '#quick', '#mtrack', '#mlog'].map(q => '== ' + q + '\n' + tree(document.querySelector(q), 0)).join(''); });
    console.log('##### ' + n + '\n' + r); await ctx.close(); }
  await b.close(); })();
