const {chromium} = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport:{width:1440,height:900}});
  const p = await ctx.newPage();
  await p.goto('http://localhost:8792/index.html');
  await p.waitForFunction(() => typeof window.__dbg === 'function', null, {timeout:90000});
  await p.waitForTimeout(2500);
  if(await p.isVisible('#lgName').catch(() => false)){ await p.fill('#lgName', 'v75u_s2'); await p.fill('#lgPass', 'qa12345'); await p.click('#lgNew'); await p.waitForTimeout(1500);
    if(await p.isVisible('#crDone').catch(() => false)){ await p.click('#crDone'); await p.waitForTimeout(1500); } }
  await p.waitForTimeout(2000);
  const r = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('#stage > *[id], body > *[id]').forEach(e => {
      const cs = getComputedStyle(e); if(cs.position !== 'fixed' && cs.position !== 'absolute') return;
      const rc = e.getBoundingClientRect();
      out.push(e.id + ' | ' + e.parentElement.id + ' | ' + cs.position + ' z' + cs.zIndex + ' ' + Math.round(rc.width) + 'x' + Math.round(rc.height) + ' ' + (cs.display === 'none' || e.hidden ? 'HID' : '') + ' | ' + (e.innerText || '').replace(/\s+/g, ' ').slice(0, 40));
    });
    return out;
  });
  console.log(r.join('\n'));
  await b.close();
})();
