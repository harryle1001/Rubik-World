// v64s: chụp nhiều cảnh (ẩn giao diện). TRƯỚC: QA_URL=...index.html?nov64s
// node _shots.js outdir w h touch "pre-code" name:x:y:z ...
const {openGame, login} = require('./qa-lib');
(async () => { const [dir, w, h, t, pre, ...shots] = process.argv.slice(2);
  const {b, p, logs} = await openGame({w:+w, h:+h, touch:t === '1'}); await login(p);
  await p.evaluate(c => window.__dbg(c), `clock=600; weather='nang'; autoWeather=false; ${pre||''}; 1`);
  await p.addStyleTag({content:'#stage>*:not(#world){visibility:hidden!important} .app>*:not(#stage){visibility:hidden!important}'});
  for(const s of shots){ const [n, x, y, z, code] = s.split(':');
    await p.evaluate(a => window.__dbg(`PLAYER.x=V46L.CX+${a[0]}+V46E; PLAYER.y=V46L.CY+${a[1]}; PLAYER._z=null; PLAYER.v46p=null; ${a[3]||''}; 1`), [+x, +y, +z, code]);
    await p.waitForTimeout(700);
    await p.evaluate(a => window.__dbg(`followCam=false; cam.x=V46L.CX+${a[0]}; cam.y=V46L.CY+${a[1]}-30; cam.z=${a[2]}; 1`), [+x, +y, +z]);
    await p.waitForTimeout(1800); await p.screenshot({path:dir + '/' + n + '.png'}); }
  console.log('logs', JSON.stringify(logs.filter(l => !/v61l: danh/.test(l.s)).slice(0,6))); await b.close(); })();
