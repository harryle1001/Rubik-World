// v74r: đo độ mượt + CPU profile (CDP) khi đi dọc bản đồ theo lộ trình cố định (dịch người chơi theo thời gian → lần nào cũng như nhau).
// node tools/qa/v74r-prof.js <desk|land|phone> [cpu=1] [q=2] [sec=40] [tag] [url-query]
// In: FPS TB, p95, số khung >50/>100 ms, top hàm theo self-time (cả lượt) và top hàm trong các khung > 50 ms.
const L = require('./v69q-lib.js'), fs = require('fs');
const [vp = 'desk', cpu = '1', q = '2', sec = '40', tag = 'run', qs = ''] = process.argv.slice(2);
// lộ trình (toạ độ đảo, tâm 0,0): cổng → đông → bắc → tây → nam → đông nam
const ROUTE = [[0, 150], [3000, 150], [3000, -2500], [-1500, -2500], [-1500, 2500], [2500, 2500]];
(async () => {
  const b = await require('playwright').chromium.launch();
  const ctx = await b.newContext({viewport:{width:L.VPS[vp].w, height:L.VPS[vp].h}, hasTouch:!!L.VPS[vp].touch, isMobile:!!L.VPS[vp].touch, deviceScaleFactor:1});
  await ctx.addInitScript(q => { try { localStorage.setItem('truong-v70f-gfx', JSON.stringify({q:+q, auto:false})); } catch(e){} }, q);
  const {p, logs} = await L.open(vp, {browser:b, ctx, q:qs}); await L.login(p); await p.waitForTimeout(4000);
  const cdp = await ctx.newCDPSession(p);
  if(+cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', {rate:+cpu});
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {interval:200});
  await p.waitForTimeout(1500);
  await cdp.send('Profiler.start');
  const res = await p.evaluate(([R, ms, SP]) => new Promise(done => {
    // dấu mốc thời gian để căn khung hình với mẫu profile
    function v74rMarkFn(){ const t = performance.now(); while(performance.now() - t < 4){} return t; }
    const mark = v74rMarkFn();
    const seg = []; let tot = 0; for(let i = 1; i < R.length; i++){ const d = Math.hypot(R[i][0] - R[i-1][0], R[i][1] - R[i-1][1]); seg.push(d); tot += d; }
    const sp = SP || tot/(ms/1000), T = []; let t0 = null, last = null;
    const P = window.__dbg('PLAYER'), E = window.__dbg('V46E'), C = window.__dbg('[V46L.CX, V46L.CY]');
    const step = now => {
      if(t0 == null){ t0 = last = now; }
      T.push([last, now - last]); last = now;
      let s = (now - t0)/1000*sp, i = 0; while(i < seg.length - 1 && s > seg[i]){ s -= seg[i]; i++; } const u = Math.min(1, s/seg[i]);
      const x = R[i][0] + (R[i+1][0] - R[i][0])*u, y = R[i][1] + (R[i+1][1] - R[i][1])*u;
      P.x = E + C[0] + x; P.y = C[1] + y; P._z = null; P.v46t = null; P.moving = true; P.dir = R[i+1][0] < R[i][0] ? -1 : 1; P.walk = (P.walk || 0) + .3;
      if(now - t0 < ms) requestAnimationFrame(step); else done({mark, T});
    };
    requestAnimationFrame(step);
  }), [ROUTE, +sec*1000, +(process.env.SPEED || 300)]);
  const {profile} = await cdp.send('Profiler.stop');
  const gst = await p.evaluate(() => window.__dbg('JSON.stringify({v74r: typeof V74R === "object" ? V74R.stat : null, v72p: V72P.stat, inframe: typeof V74R === "object" ? V74R.inf : null})')).catch(e => String(e));
  await cdp.send('Emulation.setCPUThrottlingRate', {rate:1});
  // ---- khung hình ----
  const F = res.T.slice(10), d = F.map(f => f[1]), avg = d.reduce((s, v) => s + v, 0)/d.length, srt = d.slice().sort((a, b) => a - b);
  const fr = {fps:+(1000/avg).toFixed(1), p95:+srt[Math.floor(srt.length*.95)].toFixed(1), max:+srt[srt.length - 1].toFixed(1), n:d.length, gt50:d.filter(v => v > 50).length, gt100:d.filter(v => v > 100).length, gt33:d.filter(v => v > 33.4).length};
  // ---- profile ----
  const N = new Map(), PAR = new Map(); for(const n of profile.nodes){ N.set(n.id, n); for(const c of (n.children || [])) PAR.set(c, n.id); }
  // rubik-school-game.js (gộp từ FILES) → file:dòng thật
  const html = fs.readFileSync(__dirname + '/../../index.html', 'utf8'), FL = [...html.slice(html.indexOf('const FILES = ['), html.indexOf('];', html.indexOf('const FILES = ['))).matchAll(/'([^']+\.js)'/g)].map(m => m[1]);
  const OFF = []; let ln = 4; for(const f of FL){ OFF.push([ln, f]); try { ln += fs.readFileSync(__dirname + '/../../' + f, 'utf8').split('\n').length; } catch(e){ ln += 1; } }
  const where = l => { let r = OFF[0]; for(const o of OFF){ if(o[0] <= l) r = o; else break; } return r[1].replace(/^js\//, '') + ':' + (l - r[0] + 1); };
  const nm = n => { const c = n.callFrame; if(/rubik-school-game\.js$/.test(c.url)) return (c.functionName || '(anon)') + ' ' + where(c.lineNumber + 1); return (c.functionName || '(anon)') + ' ' + (c.url || '').replace(/^.*\/school\//, '') + ':' + (c.lineNumber + 1); };
  let t = profile.startTime, markT = null; const S = [];
  for(let i = 0; i < profile.samples.length; i++){ t += profile.timeDeltas[i]; const n = N.get(profile.samples[i]); S.push([t, n]); if(markT == null && n.callFrame.functionName === 'v74rMarkFn') markT = t; }
  const off = markT != null ? markT/1000 - res.mark : null;   // ms: profile = page + off
  const agg = (filter) => { const m = new Map(); let tot = 0; for(let i = 1; i < S.length; i++){ const [ts, n] = S[i], dt = (ts - S[i-1][0])/1000; if(filter && !filter(ts/1000)) continue; tot += dt; let k = nm(n); if(!n.callFrame.url && n.callFrame.functionName && !/^\(/.test(n.callFrame.functionName)){ const pp = N.get(PAR.get(n.id)); if(pp) k = n.callFrame.functionName + ' ← ' + nm(pp); } m.set(k, (m.get(k) || 0) + dt); }
    return {tot, top:[...m].sort((a, b) => b[1] - a[1]).slice(0, 22).map(([k, v]) => [k, +v.toFixed(1), +(v/tot*100).toFixed(1)])}; };
  const all = agg(null);
  // thời gian gồm cả hàm con (inclusive) — tìm ai gọi
  const inc = new Map(); let itot = 0; for(let i = 1; i < S.length; i++){ const dt = (S[i][0] - S[i-1][0])/1000; itot += dt; const seen = new Set(); let n = S[i][1]; while(n){ const k = nm(n); if(!seen.has(k)){ seen.add(k); inc.set(k, (inc.get(k) || 0) + dt); } n = N.get(PAR.get(n.id)); } }
  const incTop = [...inc].filter(([k]) => !/^\(/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 60).map(([k, v]) => [k, +v.toFixed(1), +(v/itot*100).toFixed(1)]);
  const longs = off == null ? [] : F.filter(f => f[1] > 50).map(f => [f[0] + off, f[0] + f[1] + off]);
  const inLong = ts => longs.some(([a, z]) => ts >= a && ts <= z);
  const lg = longs.length ? agg(inLong) : null;
  // 12 khung dài nhất: hàm (inclusive) chiếm nhiều nhất trong từng khung
  const SKIP = /^(frame|render|v46Render|v46ZonePass|v46ZoneContent|extUpdate|\(anon\)) /;
  const worst = off == null ? [] : F.filter(f => f[1] > 50).sort((a, b) => b[1] - a[1]).slice(0, 12).map(f => { const a = f[0] + off, z = f[0] + f[1] + off, m = new Map();
    for(let i = 1; i < S.length; i++){ const ts = S[i][0]/1000; if(ts < a || ts > z) continue; const dt = (S[i][0] - S[i-1][0])/1000, seen = new Set(); let n = S[i][1];
      while(n){ const k = nm(n); if(!seen.has(k) && !SKIP.test(k)){ seen.add(k); m.set(k, (m.get(k) || 0) + dt); } n = N.get(PAR.get(n.id)); } }
    return [+f[1].toFixed(0), [...m].sort((x, y) => y[1] - x[1]).slice(0, 7).map(([k, v]) => k.replace(/ ext\//, ' ') + '=' + v.toFixed(0))]; });
  const out = {vp, cpu:+cpu, q:+q, tag, frames:fr, errs:logs.filter(l => !/v61l: danh sách FILES/.test(l.s)).slice(0, 5), all, long:lg, inc:incTop};
  const dir = '/tmp/v74r'; fs.mkdirSync(dir, {recursive:true}); fs.writeFileSync(`${dir}/${tag}-${vp}-x${cpu}.json`, JSON.stringify(out, null, 1));
  console.log(tag, vp, 'cpu×' + cpu, 'q' + q, JSON.stringify(fr), 'errs', out.errs.length, gst);
  console.log('-- self-time cả lượt (ms, %) --'); all.top.slice(0, 18).forEach(r => console.log('  ' + r[1] + '\t' + r[2] + '%\t' + r[0]));
  if(process.env.FOCUS){ const re = new RegExp(process.env.FOCUS), m = new Map(); let tot = 0;
    for(let i = 1; i < S.length; i++){ let n = S[i][1], hit = false; while(n){ if(re.test(nm(n))){ hit = true; break; } n = N.get(PAR.get(n.id)); } if(!hit) continue;
      const dt = (S[i][0] - S[i-1][0])/1000; tot += dt; const seen = new Set(); n = S[i][1]; while(n){ const k = nm(n); if(re.test(k)) break; if(!seen.has(k)){ seen.add(k); m.set(k, (m.get(k) || 0) + dt); } n = N.get(PAR.get(n.id)); } }
    console.log('-- bên trong ' + process.env.FOCUS + ' (tổng ' + tot.toFixed(0) + ' ms, inclusive) --'); [...m].sort((a, b) => b[1] - a[1]).slice(0, 40).forEach(([k, v]) => console.log('  ' + v.toFixed(0) + '\t' + k)); }
  if(process.env.INC){ console.log('-- inclusive --'); incTop.forEach(r => console.log('  ' + r[1] + '\t' + r[2] + '%\t' + r[0])); }
  if(lg){ console.log('-- trong khung > 50 ms (' + longs.length + ' khung) --'); lg.top.slice(0, 14).forEach(r => console.log('  ' + r[1] + '\t' + r[2] + '%\t' + r[0])); }
  if(process.env.LINC && longs.length){ const m = new Map(); let tot = 0; for(let i = 1; i < S.length; i++){ if(!inLong(S[i][0]/1000)) continue; const dt = (S[i][0] - S[i-1][0])/1000; tot += dt; const seen = new Set(); let n = S[i][1]; while(n){ const k = nm(n); if(!seen.has(k)){ seen.add(k); m.set(k, (m.get(k) || 0) + dt); } n = N.get(PAR.get(n.id)); } }
    console.log('-- inclusive trong khung dài (' + tot.toFixed(0) + ' ms) --'); [...m].filter(([k]) => !/^(frame|render|v46Render|v46ZonePass|v46ZoneContent|extUpdate|\(root\)) /.test(k)).sort((a, b) => b[1] - a[1]).slice(0, +process.env.LINC).forEach(([k, v]) => console.log('  ' + v.toFixed(0) + '\t' + (v/tot*100).toFixed(1) + '%\t' + k)); }
  if(process.env.WORST) worst.forEach(w => console.log('  [' + w[0] + ' ms] ' + w[1].join(' | ')));
  await b.close();
})();
