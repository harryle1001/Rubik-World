// Đo tốc độ tải: 4G giả lập (150 ms, 1,5 MB/s) + CPU chậm ×4. In 1 dòng JSON.
// Dùng: node tools/build/perf.js <url> [nhãn] [w=390] [h=844]
const {chromium} = require('playwright');
const url = process.argv[2], tag = process.argv[3] || 'run', W = +process.argv[4] || 390, H = +process.argv[5] || 844;
const NET = {offline:false, latency:150, downloadThroughput:1.5e6, uploadThroughput:0.75e6};
async function visit(ctx){
  const p = await ctx.newPage(), c = await ctx.newCDPSession(p);
  await c.send('Network.enable'); await c.send('Network.emulateNetworkConditions', NET); await c.send('Emulation.setCPUThrottlingRate', {rate:4});
  let n = 0, bytes = 0; const errs = [];
  c.on('Network.requestWillBeSent', () => n++); c.on('Network.loadingFinished', e => bytes += e.encodedDataLength);
  p.on('console', m => { if(m.type() === 'error' || m.type() === 'warning'){ const s = m.text(); if(!/AudioContext/.test(s)) errs.push(s.slice(0, 200)); } });
  p.on('pageerror', e => errs.push('pageerror ' + e.message.slice(0, 200)));
  await p.addInitScript(() => {
    const M = window.__perf = {};
    const vis = el => { if(!el) return false; const r = el.getBoundingClientRect(); if(r.width < 2 || r.height < 2) return false; const cs = getComputedStyle(el); if(cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < .5) return false; const t = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2); return !!t && (t === el || el.contains(t) || t.contains(el)); };
    // "chơi được" = sau khi hiện đăng nhập, có 1 giây liền không khung hình nào bị treo > 200 ms (chạm là phản hồi ngay)
    let last = 0, calm = 0;
    function tick(ts){
      if(!M.ran && window.__RS_RAN) M.ran = performance.now(); if(!M.fonts && document.fonts && document.fonts.status === 'loaded' && M.ran) M.fonts = performance.now(); if(!M.drawn && window.v61lDrawn && window.v61lDrawn()) M.drawn = performance.now();
      if(!M.splash){ const s = document.getElementById('cv-cover'); if(s && vis(s)) M.splash = performance.now(); }
      if(!M.login && vis(document.getElementById('lgName'))){ M.login = performance.now(); calm = M.login; }
      if(M.login && !M.play){ if(ts - last > 200) calm = performance.now(); else if(performance.now() - calm > 1000) M.play = calm; }
      last = ts; if(!M.play) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
  await p.goto(url, {waitUntil:'commit', timeout:120000});
  await p.waitForFunction(() => window.__perf && window.__perf.play, null, {timeout:120000, polling:200});
  const m = await p.evaluate(() => ({...window.__perf, fcp:(performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime}));
  await p.waitForTimeout(1500);
  const out = {req:n, MB:+(bytes/1e6).toFixed(2), fcp:Math.round(m.fcp || 0), splash:Math.round(m.splash || 0), login:Math.round(m.login), play:Math.round(m.play), ran:Math.round(m.ran||0), fonts:Math.round(m.fonts||0), drawn:Math.round(m.drawn||0), errs};
  await p.close(); return out;
}
(async () => {
  const b = await chromium.launch({proxy:process.env.HTTPS_PROXY ? {server:process.env.HTTPS_PROXY, bypass:'localhost,127.0.0.1,127.0.0.2'} : undefined});
  const ctx = await b.newContext({viewport:{width:W, height:H}, ignoreHTTPSErrors:true, isMobile:W < 900, hasTouch:W < 900});
  const first = await visit(ctx), second = await visit(ctx);
  console.log(JSON.stringify({tag, vp:W + 'x' + H, first, second}));
  await b.close();
})();
