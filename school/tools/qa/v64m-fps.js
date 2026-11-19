// v64m: đo FPS khi mở bản đồ lớn (kéo/zoom) và khi đi bộ (minimap chạy), bản Puny (on) và bản cũ (off).
// node tools/qa/v64m-fps.js <w> <h> <touch 0|1> [chậm CPU=1]
const {openGame, login} = require('./qa-lib');
(async () => { const [w, h, t, rate] = process.argv.slice(2);
  const {b, p, logs} = await openGame({w:+w, h:+h, touch:t === '1'}); await login(p);
  if(+rate > 1){ const s = await p.context().newCDPSession(p); await s.send('Emulation.setCPUThrottlingRate', {rate:+rate}); }
  await p.waitForTimeout(4000);
  const fps = ms => p.evaluate(ms => new Promise(r => { let n = 0, worst = 0, last = performance.now(); const t0 = last; const f = () => { const now = performance.now(); worst = Math.max(worst, now - last); last = now; n++; if(now - t0 < ms) requestAnimationFrame(f); else r({fps:Math.round(n*1000/(now - t0)), worst:Math.round(worst)}); }; requestAnimationFrame(f); }), ms);
  const out = {};
  for(const on of [true, false]){
    await p.evaluate(on => window.__dbg(`V64M.on = ${on}; v32MapOpen(); MAP.z = .05; 1`), on); await p.waitForTimeout(800);
    const pan = p.evaluate(() => new Promise(r => { let k = 0; const id = setInterval(() => { window.__dbg('MAP.cx += 120; MAP.z *= ' + (k % 40 < 20 ? 1.03 : .97)); if(++k > 150) { clearInterval(id); r(); } }, 16); }));
    out[(on ? 'puny' : 'cu') + '_map'] = await fps(2500); await pan;
    await p.evaluate(() => window.__dbg('v32MapClose(); 1'));
    await p.keyboard.down('ArrowRight'); await p.waitForTimeout(300); out[(on ? 'puny' : 'cu') + '_walk'] = await fps(2500); await p.keyboard.up('ArrowRight');
    await p.keyboard.down('ArrowLeft'); await p.waitForTimeout(2800); await p.keyboard.up('ArrowLeft');
  }
  await p.evaluate(() => window.__dbg('V64M.on = true; 1'));
  console.log(w + 'x' + h, JSON.stringify(out), 'dbg', JSON.stringify(await p.evaluate(() => window.__dbg('V64M.dbg'))));
  console.log('logs', JSON.stringify(logs.filter(l => !/GL Driver|v61l: danh sách FILES/.test(l.s))).slice(0, 1500)); await b.close(); })();
