// v71d: FPS 3 cỡ màn hình, đứng yên + đi bộ 8 giây. node tools/qa/v71d-fps.js [q]
const L = require('./v69q-lib.js'); const q = process.argv[2] || '';
const fps = (p, ms) => p.evaluate(ms => new Promise(res => { let n = 0, last = performance.now(), t0 = last, slow = 0; const f = t => { n++; if(t - last > 25) slow++; last = t; if(t - t0 < ms) requestAnimationFrame(f); else res({avg:Math.round(n*1000/(t - t0)), slow}); }; requestAnimationFrame(f); }), ms);
(async () => { const b = await require('playwright').chromium.launch(); const out = {};
  for(const vp of ['phone', 'land', 'desk']){ const {p, logs} = await L.open(vp, {browser:b, q}); await L.login(p); await p.waitForTimeout(3000);
    const idle = await fps(p, 8000); await p.keyboard.down('ArrowDown'); const walk = await fps(p, 8000); await p.keyboard.up('ArrowDown');
    out[vp] = {idle, walk, err:logs.filter(l => !/v61l: danh sách FILES/.test(l.s)).length}; await p.context().close(); }
  console.log(q || '(thường)', JSON.stringify(out)); await b.close(); })();
