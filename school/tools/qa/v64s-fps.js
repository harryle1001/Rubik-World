// v64s: đo FPS khi đi bộ trong khu trường. node tools/qa/v64s-fps.js <phone|land|desk> <cpu=4> [query]
const {openGame, login} = require('./qa-lib');
const VPS = {phone:{w:390, h:844, touch:true}, land:{w:844, h:390, touch:true}, desk:{w:1440, h:900}};
(async () => { const [vpn, rate, q] = process.argv.slice(2); const vp = VPS[vpn || 'phone'];
  if(q) process.env.QA_URL = 'http://localhost:8754/index.html?' + q;
  const {b, p, logs} = await openGame(vp); await login(p);
  await p.evaluate(() => window.__dbg(`clock=600; weather='nang'; autoWeather=false; PLAYER.x=V46L.CX-200+V46E; PLAYER.y=V46L.CY+420; PLAYER._z=null; PLAYER.v46p=null; cam.z=1; 1`));
  await p.waitForTimeout(4000); console.log('start', await p.evaluate(() => window.__dbg('JSON.stringify(v46Pos(PLAYER).map(v=>Math.round(v-5600)))')));
  const cdp = await p.context().newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', {rate:+rate || 4});
  const res = await p.evaluate(() => new Promise(done => { const T = []; let last = performance.now(), t0 = last; const dirs = ['right', 'up', 'left', 'down', 'right', 'up'];
    const step = now => { T.push(now - last); last = now; const k = Math.floor((now - t0)/1500); window.__dbg(`keys.up=keys.down=keys.left=keys.right=false; keys['${dirs[Math.min(5, k)]}']=true; 1`);
      if(now - t0 < 9000) requestAnimationFrame(step); else { window.__dbg('keys.up=keys.down=keys.left=keys.right=false; 1'); done(T); } };
    requestAnimationFrame(step); }));
  const fr = res.slice(5), avg = fr.reduce((s, v) => s + v, 0)/fr.length, srt = fr.slice().sort((a, b) => a - b);
  console.log(JSON.stringify({vp:vpn, cpu:+rate || 4, q:q || '', frames:fr.length, fps:+(1000/avg).toFixed(1), p50:+srt[Math.floor(srt.length*.5)].toFixed(1), p95:+srt[Math.floor(srt.length*.95)].toFixed(1), max:+srt[srt.length - 1].toFixed(1), over50:fr.filter(v => v > 50).length}));
  const pos = await p.evaluate(() => window.__dbg('JSON.stringify(v46Pos(PLAYER).map(v=>Math.round(v-5600)))')); console.log('pos', pos);
  console.log('logs', JSON.stringify(logs.filter(l => !/v61l: danh/.test(l.s)).slice(0, 5))); await b.close(); })();
