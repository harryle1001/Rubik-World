// v61l · kiểm tra tính năng chính trên bản gói (hoặc từng file) ở 3 cỡ màn hình + FPS + lỗi console.
// Dùng: QA_URL='http://localhost:8763/index.html?bundle' node tools/build/feat.js [nhãn]
const {chromium} = require('playwright');
const {openGame, login} = require('../qa/qa-lib');
const VPS = {phone:{w:390, h:844, touch:true}, land:{w:844, h:390, touch:true}, desk:{w:1440, h:900}};
const D = (p, c) => p.evaluate(c => window.__dbg(c), c);
const fps = p => p.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if(performance.now() - t0 < 3000) requestAnimationFrame(f); else r(Math.round(n*1000/(performance.now() - t0))); }; requestAnimationFrame(f); }));
(async () => {
  const b = await chromium.launch(process.env.HTTPS_PROXY ? {proxy:{server:process.env.HTTPS_PROXY, bypass:'localhost,127.0.0.1'}} : {});
  const out = {};
  for(const k of Object.keys(VPS)){
    const {ctx, p, logs} = await openGame(VPS[k], {browser:b}); const R = out[k] = {};
    try {
      R.bundle = await p.evaluate(() => !!document.querySelector('script[src*="dist/game."]'));
      await login(p); R.login = await D(p, '!!(PLAYER && PROF)');
      R.fpsWorld = await fps(p);
      // đi lại
      const x0 = await D(p, 'PLAYER.x');
      if(VPS[k].touch){ const c = await p.$('#world'), bb = await c.boundingBox(); const cx = bb.x + bb.width/2, cy = bb.y + bb.height/2;
        await p.touchscreen.tap(cx, cy).catch(() => {}); await p.mouse.move(cx, cy); }
      await p.keyboard.down('ArrowRight'); await p.waitForTimeout(1200); await p.keyboard.up('ArrowRight');
      if(VPS[k].touch && Math.abs(await D(p, 'PLAYER.x') - x0) < 5){ await D(p, 'PLAYER.x += 0; PLAYER.tx = PLAYER.x + 200; PLAYER.ty = PLAYER.y; try{ goTo && 0 }catch(e){}'); }
      R.walk = Math.round(await D(p, 'PLAYER.x') - x0);
      // góc nhìn thứ 3
      R.v60t = await D(p, 'try{ v60tSet(true, true); V60T.on }catch(e){ "ERR " + e.message }'); await p.waitForTimeout(1500); R.fps3rd = await fps(p);
      await D(p, 'try{ v60tSet(false, true) }catch(e){}');
      // hành tinh (thu nhỏ hết cỡ)
      R.planet = await D(p, 'try{ followCam = false; cam.z = v56pZMin(); clampCam && clampCam(); cam.z }catch(e){ "ERR " + e.message }'); await p.waitForTimeout(2000); R.fpsPlanet = await fps(p);
      await D(p, 'try{ backToPlayer() }catch(e){}'); await p.waitForTimeout(800);
      // Rubik 3D (three.js tải lười)
      await D(p, 'openRubik()'); await p.waitForFunction(() => typeof THREE !== 'undefined', null, {timeout:15000}).catch(() => {});
      await p.waitForTimeout(1200); R.rubik = await D(p, `typeof THREE !== "undefined" && !document.getElementById("mRubik").hidden && String(openModal && (openModal.id || openModal)) === "mRubik"`);
      await D(p, 'try{ closeModal(openModal) }catch(e){}'); await p.waitForTimeout(400);
      // học viện phép thuật
      R.magic = await D(p, 'try{ v50Open(); V50.open }catch(e){ "ERR " + e.message }'); await p.waitForTimeout(1500); R.fpsMagic = await fps(p);
      await D(p, 'try{ v50Close && v50Close() }catch(e){ try{ V50.root.hidden = true; V50.open = false; document.body.classList.remove("v50on") }catch(_){} }'); await p.waitForTimeout(400);
      // sách lớn (tải lười) + piano thật (tải lười)
      R.book = await p.evaluate(() => window.__dbg('(async()=>{ const m = TEXT_META[0]; const t = await bookText(m.id); return t ? t.length : 0 })()'));
      await D(p, 'openMusic("piano")'); await p.waitForFunction(() => window.__dbg('PS.ready'), null, {timeout:20000}).catch(() => {}); R.piano = await D(p, 'PS.ready + " " + Object.keys(PS.buf).length');
      await D(p, 'try{ closeModal(openModal) }catch(e){}');
      // máy bay
      R.plane = await D(p, 'typeof v51pBoard === "function"');
    } catch(e){ R.err = e.message.slice(0, 200); }
    R.console = logs.filter(l => !/willReadFrequently|AudioContext|GPU stall due to ReadPixels/.test(l.s)).map(l => l.t + ': ' + l.s.slice(0, 160));
    console.log(k, JSON.stringify(R)); await ctx.close();
  }
  await b.close();
})();
