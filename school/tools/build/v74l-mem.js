// v74l · đo bộ nhớ khi chơi: JS heap (sau GC) + tổng điểm ảnh canvas còn sống (MB = w*h*4), mỗi phút 1 mẫu.
// Dùng (chế độ từng file, cần window.__dbg): node tools/build/serve.js . 8761  rồi
//   node tools/build/v74l-mem.js http://localhost:8761/index.html [phút=5] [zones|play] [w=390] [h=844] [deviceMemory]
// zones = cứ 2 giây dịch chuyển tới một khu khác, thỉnh thoảng vào nhà / mở mini game / ra hành tinh (đổi khu liên tục).
const {chromium} = require('playwright');
const url = process.argv[2], MIN = +process.argv[3] || 5, MODE = process.argv[4] || 'zones', W = +process.argv[5] || 390, H = +process.argv[6] || 844, DM = process.argv[7];
(async () => {
  const b = await chromium.launch({args:['--enable-precise-memory-info', '--js-flags=--expose-gc']});
  const ctx = await b.newContext({viewport:{width:W, height:H}, isMobile:W < 900, hasTouch:W < 900});
  const p = await ctx.newPage(), c = await ctx.newCDPSession(p); const errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('crash', () => console.error('PAGE CRASH')); p.on('close', () => console.error('PAGE CLOSE')); p.on('console', m => { if(m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  await p.addInitScript(dm => {
    if(dm) Object.defineProperty(navigator, 'deviceMemory', {get:() => +dm});
    const L = window.__cv = []; const ce = Document.prototype.createElement;
    Document.prototype.createElement = function(t){ const e = ce.apply(this, arguments); if(String(t).toLowerCase() === 'canvas') L.push(new WeakRef(e)); return e; };
    if(window.OffscreenCanvas){ const O = window.OffscreenCanvas; window.OffscreenCanvas = function(w, h){ const o = new O(w, h); L.push(new WeakRef(o)); return o; }; window.OffscreenCanvas.prototype = O.prototype; }
  }, DM || null);
  await p.goto(url); await p.waitForFunction(() => typeof window.__dbg === 'function', null, {timeout:60000});
  await p.waitForSelector('#lgName', {state:'visible', timeout:60000});
  await p.fill('#lgName', 'mem' + Date.now() % 1e6); await p.fill('#lgPass', 'qa12345'); await p.click('#lgNew');
  await p.waitForSelector('#crDone', {state:'visible', timeout:20000}); await p.click('#crDone'); await p.waitForTimeout(1500);
  for(let i = 0; i < 4; i++) await p.evaluate(() => window.__dbg('try{ if(openModal) hideModal() }catch(e){}')).catch(() => {});
  const D = s => p.evaluate(s => window.__dbg(s), s);
  const sample = async t => {
    await c.send('HeapProfiler.collectGarbage'); await p.waitForTimeout(300); await c.send('HeapProfiler.collectGarbage');
    const h = await c.send('Runtime.getHeapUsage');
    const cv = await p.evaluate(() => { let px = 0, n = 0; window.__cv = window.__cv.filter(r => { const e = r.deref(); if(!e) return false; px += e.width*e.height; n++; return true; }); return {MB:+(px*4/1e6).toFixed(1), n}; });
    const g = await D('({t0:V46T.L0.size, t1:V46T.L1.size, tilesMB:+((V46T.L0.size + V46T.L1.size + (typeof V72P!=="undefined"&&V72P.pool?V72P.pool.length:0))*V46T.TS*V46T.TS*4/1e6).toFixed(1), pool:(typeof V72P!=="undefined"&&V72P.pool?V72P.pool.length:0), cap:(typeof V72P!=="undefined"?V72P.cap.join("/"):""), v74l:(typeof V74L!=="undefined"?V74L.stat:null)})').catch(() => ({}));
    return {min:t, heapMB:+(h.usedSize/1e6).toFixed(1), canvasMB:cv.MB, canvases:cv.n, ...g};
  };
  const out = [await sample(0)]; const t0 = Date.now(); let k = 0;
  while(Date.now() - t0 < MIN*60000){
    k++;
    if(MODE === 'zones'){
      await D(`(() => { try { const Z = V46.Z.filter(z => !z.flip), z = Z[Math.floor(Math.random()*Z.length)], n = z.n; v54qTeleNew((n.x0 + n.x1)/2, n.y1 + 60); backToPlayer(); } catch(e){ return e.message } })()`).catch(() => {});
      if(k % 7 === 0) await D(`try { openShop(); } catch(e){}`).catch(() => {});
      if(k % 7 === 1) await D(`try { if(openModal) hideModal(); } catch(e){}`).catch(() => {});
      if(k % 11 === 0) await D(`try { followCam = false; cam.z = v56pZMin(); clampCam(); } catch(e){}`).catch(() => {});
      if(k % 11 === 2) await D(`try { cam.z = 1; backToPlayer(); followCam = true; } catch(e){}`).catch(() => {});
      await p.keyboard.down(['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'][k % 4]); await p.waitForTimeout(1700); await p.keyboard.up(['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'][k % 4]);
    } else { await p.keyboard.down(['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'][k % 4]); await p.waitForTimeout(3000); await p.keyboard.up(['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'][k % 4]); }
    const m = Math.floor((Date.now() - t0)/60000); if(m > out.length - 1) out.push(await sample(m));
  }
  if(out[out.length - 1].min < MIN) out.push(await sample(MIN));
  console.log(JSON.stringify({url, mode:MODE, vp:W + 'x' + H, dm:DM || 'auto', samples:out, errs:errs.slice(0, 8)}));
  await b.close();
})();
