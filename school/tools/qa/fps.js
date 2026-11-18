// v61f · Đo khựng hình (frame > 50 ms) theo lộ trình Robo v54q + tính năng mới (v55s…v60t), CPU chậm ×4 như điện thoại.
// Không cần server: Playwright phục vụ file thẳng từ đĩa qua page.route (URL vẫn là localhost để có window.__dbg).
// Dùng (từ school/):  node tools/qa/fps.js <nhãn=before> [vp=phone,land,desk] [chậm=4]
// Kết quả: tools/qa/out/fps-<nhãn>/<vp>.json  (khung hình, FPS, 10 chỗ khựng nặng nhất kèm hàm gây ra)
const fs = require('fs'), path = require('path');
const {chromium} = require('playwright');
const ROOT = process.env.FPS_ROOT || path.resolve(__dirname, '..', '..');
const VPS = {phone:{w:390, h:844, touch:true}, land:{w:844, h:390, touch:true}, desk:{w:1440, h:900}};
const tag = process.argv[2] || 'before', pick = (process.argv[3] || 'phone,land,desk').split(','), RATE = +process.argv[4] || 4;
const MIME = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.json':'application/json', '.svg':'image/svg+xml', '.mp3':'audio/mpeg', '.ogg':'audio/ogg', '.wav':'audio/wav', '.woff2':'font/woff2', '.webp':'image/webp'};
const sleep = ms => new Promise(r => setTimeout(r, ms));

// bảng dòng → file của bản ghép (loader nối FILES vào một script, 3 dòng đầu là phần mở)
function lineMap(){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const m = html.match(/const FILES = \[([\s\S]*?)\];/); const files = [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
  const L = []; let line = 3; // 0-based: dòng 0..2 là phần mở
  for(const f of files){ const n = fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n').length; L.push([line, f]); line += n; }
  return ln => { let r = null; for(const [s, f] of L){ if(s <= ln) r = [f, ln - s + 1]; else break; } return r; };
}

async function open(b, vp){
  const touch = !!vp.touch;
  const ctx = await b.newContext({viewport:{width:vp.w, height:vp.h}, hasTouch:touch, isMobile:touch, deviceScaleFactor:touch ? 2 : 1});
  await ctx.route('http://localhost:8754/**', r => {
    const u = new URL(r.request().url()); let f = path.join(ROOT, decodeURIComponent(u.pathname)); if(f.endsWith('/')) f += 'index.html';
    if(!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({status:404, body:'nf'});
    r.fulfill({status:200, body:fs.readFileSync(f), headers:{'content-type':MIME[path.extname(f)] || 'application/octet-stream'}});
  });
  const p = await ctx.newPage(); const logs = [];
  p.on('console', m => { const t = m.type(); if(t === 'warning' || t === 'error'){ const s = m.text(); if(!/AudioContext was not allowed|net::ERR|Failed to load resource/.test(s)) logs.push({t, s:s.slice(0, 300)}); } });
  p.on('pageerror', e => logs.push({t:'pageerror', s:String(e.message).slice(0, 300)}));
  await p.goto('http://localhost:8754/index.html'); await p.waitForFunction(() => typeof window.__dbg === 'function', null, {timeout:60000});
  await sleep(2500);
  // đăng nhập tài khoản thử
  if(await p.isVisible('#lgName').catch(() => false)){
    await p.fill('#lgName', 'robo_fps'); await p.fill('#lgPass', 'qa12345'); await p.click('#lgNew'); await sleep(1500);
    if(await p.isVisible('#lgName').catch(() => false)){ await p.click('#lgGo'); await sleep(1500); }
  }
  const go = p.getByText('Vào game', {exact:true}); if(await go.isVisible().catch(() => false)){ await go.click(); await sleep(1500); }
  for(let i = 0; i < 4; i++) await p.evaluate(() => window.__dbg("try{ if(openModal) closeModal(openModal) }catch(e){}")).catch(() => {});
  await p.evaluate(() => window.__dbg("OWNER.is = true; consoleApply(); PROF.level = Math.max(PROF.level || 1, 99); PROF.coins = Math.max(PROF.coins || 0, 99999); try{ saveProfile() }catch(e){}"));
  await sleep(800);
  return {ctx, p, logs};
}

// ghi từng khung hình bằng rAF + nhãn bước hiện tại
const REC = `(() => { const F = window.__v61fF = []; window.__fpsTag = 'start'; let last = performance.now();
  const loop = t => { F.push([last, t - last, window.__fpsTag]); last = t; if(!window.__v61fStop) requestAnimationFrame(loop); }; requestAnimationFrame(loop); })()`;
const MARK = `(() => { const t0 = performance.now(); (function __v61fMark(){ let x = 0; while(performance.now() - t0 < 60) x += Math.sqrt(x + 1); return x; })(); return t0; })()`;

// lộ trình: bước Robo v54q (khu, cửa, mini game, phương tiện, giờ & mùa) + tính năng mới
function plan(){
  const dbg = code => async p => p.evaluate(c => window.__dbg(c), code);
  const robo = (kind, every = 1, max = 999) => dbg(`(async () => { V54Q.on = true; const S = v54qBuild().filter(s => s.k === '${kind}'); let n = 0;
    for(let i = 0; i < S.length && n < ${max}; i += ${every}, n++){ window.__fpsTag = '${kind}: ' + S[i].name; try { await S[i].run(); } catch(e){} try { v54qForceClose(); } catch(e){} }
    V54Q.on = false; try { v54qFree(); } catch(e){} return n; })()`);
  const hold = (k, ms) => async p => { await p.evaluate(k => window.__dbg(`keys.${k} = true`), k); await sleep(ms); await p.evaluate(k => window.__dbg(`keys.${k} = false`), k); };
  const S = [];
  const add = (name, f) => S.push([name, f]);
  add('idle ở cổng', async p => { await dbg(`(() => { const G = v46Gate(); v54qTeleNew(G[0], G[1] + 80); })()`)(p); await sleep(4000); });
  add('đi bộ phím', async p => { for(const k of ['up', 'right', 'down', 'left']) await hold(k, 1800)(p); });
  add('khu (Robo)', robo('place', 1, 40));
  add('cửa (Robo)', robo('door', 3, 14));
  add('mini game (Robo)', robo('game', 3, 22));
  add('phương tiện (Robo)', robo('veh'));
  add('giờ & mùa (Robo)', async p => { await robo('time')(p); });
  add('giờ trôi nhanh (thời tiết/mùa theo giờ)', dbg(`(async () => { const G = v46Gate(); v54qTeleNew(G[0], G[1] + 80); for(let i = 0; i < 14; i++){ window.__fpsTag = 'giờ +60 #' + i; clock = (clock + 60) % 1440; await new Promise(r => setTimeout(r, 900)); } })()`));
  add('zoom nhanh', async p => { await dbg(`(() => { const G = v46Gate(); v54qTeleNew(G[0], G[1] + 80); })()`)(p); const vp = p.viewportSize(); await p.mouse.move(vp.width/2, vp.height/2);
    for(let r = 0; r < 2; r++){ for(let i = 0; i < 14; i++){ await p.mouse.wheel(0, 240); await sleep(60); } await sleep(700); for(let i = 0; i < 14; i++){ await p.mouse.wheel(0, -240); await sleep(60); } await sleep(700); } });
  add('hành tinh 🌍', dbg(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); window.__fpsTag = 'hành tinh: ra'; v56pToggle(); await w(3500); window.__fpsTag = 'hành tinh: chạm bay tới'; v56pTap(cw/2 + cw*.18, ch/2 + ch*.1); await w(3000); window.__fpsTag = 'hành tinh: về'; v56pBack(); await w(2500); })()`));
  add('góc nhìn thứ 3 🎥', async p => { await dbg(`(() => { const G = v46Gate(); v54qTeleNew(G[0], G[1] + 120); window.__fpsTag = 'TPS: bật'; v60tSet(true, true); })()`)(p); await sleep(1500);
    await dbg(`window.__fpsTag = 'TPS: đi'`)(p); await hold('up', 3000)(p); await hold('right', 1200)(p); await hold('up', 2500)(p);
    await dbg(`(() => { window.__fpsTag = 'TPS: xe đạp'; PROF.equip.bike = PROF.equip.bike || 'bike1'; toggleBike(); })()`)(p); await hold('up', 3000)(p);
    await dbg(`(() => { try { if(PLAYER.cycling) toggleBike(); } catch(e){} window.__fpsTag = 'TPS: tắt'; v60tSet(false, true); })()`)(p); await sleep(1500); });
  add('máy bay + góc bám đuôi ✈️', dbg(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); const C = v51pC(), A = V51P_AP; v54qTeleNew(C[0] + (A.rx0 + A.rx1)/2, C[1] + 4840); await w(500);
    window.__fpsTag = 'máy bay: lên'; v51pBoard(); await w(2000); window.__fpsTag = 'máy bay: bám đuôi'; v57pSetView('chase', true); keys.up = true; await w(5000); keys.up = false;
    window.__fpsTag = 'máy bay: trên xuống'; v57pSetView('top', true); await w(1500); window.__fpsTag = 'máy bay: xuống'; v51pExit(true); await w(1500); })()`));
  add('chỉ đường dấu chân 👣', dbg(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); const G = v46Gate(); v54qTeleNew(G[0], G[1] + 80); await w(400);
    const P = (mapPlaces() || []).filter(p => isFinite(p.x)); const t = P[Math.floor(P.length/2)]; const tg = t.door && isFinite(t.door[0]) ? t.door : v46ToOld(t.x, t.y);
    window.__fpsTag = 'chỉ đường: ' + t.name; V54Q.on = true; try { v32Nav(tg[0], tg[1], t.name, true); } catch(e){} await w(7000); try { cancelAuto(); V32.nav = null; } catch(e){} V54Q.on = false; })()`));
  add('toast liên tục', dbg(`(async () => { for(let i = 0; i < 8; i++){ window.__fpsTag = 'toast'; toast('🔔 Thử thông báo số ' + i); await new Promise(r => setTimeout(r, 350)); } await new Promise(r => setTimeout(r, 2500)); })()`));
  return S;
}

function analyze(frames, prof, off, lm){
  // frames: [start, dur, tag]; prof: CPU profile; off: ms cộng vào performance.now để ra giờ profile
  const durs = frames.map(f => f[1]);
  const tot = durs.reduce((a, b) => a + b, 0), avg = frames.length*1000/tot;
  let minF = 999; { let t = 0, n = 0; for(const d of durs){ t += d; n++; if(t >= 500){ minF = Math.min(minF, n*1000/t); t = 0; n = 0; } } }
  const long = frames.filter(f => f[1] > 50);
  const node = new Map(); prof.nodes.forEach(n => node.set(n.id, n)); const par = new Map(); prof.nodes.forEach(n => (n.children || []).forEach(c => par.set(c, n.id)));
  const ts = []; let t = prof.startTime; prof.timeDeltas.forEach(d => { t += d; ts.push(t/1000); });
  const name = n => { const c = n.callFrame; const loc = c.url && c.url.includes('rubik-school-game') ? lm(c.lineNumber) : null; return (c.functionName || '(ẩn danh)') + (loc ? ` @${loc[0].replace('js/', '')}:${loc[1]}` : c.url ? ` @${c.url.split('/').pop()}:${c.lineNumber + 1}` : ''); };
  const attr = f => {
    const a = f[0] + off, b = a + f[1], self = new Map(), incl = new Map(); let lo = 0, hi = ts.length;
    while(lo < hi){ const m = (lo + hi) >> 1; if(ts[m] < a) lo = m + 1; else hi = m; }
    for(let i = lo; i < ts.length && ts[i] <= b; i++){
      const dt = (ts[i + 1] || ts[i]) - ts[i]; let id = prof.samples[i]; const n0 = node.get(id); const k = name(n0); self.set(k, (self.get(k) || 0) + dt);
      const seen = new Set(); while(id){ const n = node.get(id); const kk = name(n); if(!seen.has(kk) && n.callFrame.url){ seen.add(kk); incl.set(kk, (incl.get(kk) || 0) + dt); } id = par.get(id); }
    }
    const top = m => [...m].sort((x, y) => y[1] - x[1]).slice(0, 5).map(([k, v]) => `${k} ${v.toFixed(0)}ms`);
    const dur = f[1]*.8; return {self:top(self), incl:[...incl].filter(([k, v]) => v < dur).sort((x, y) => y[1] - x[1]).slice(0, 6).map(([k, v]) => `${k} ${v.toFixed(0)}ms`),
      deep:[...incl].filter(([k, v]) => v < f[1]*.45 && !/^\(/.test(k)).sort((x, y) => y[1] - x[1]).slice(0, 8).map(([k, v]) => `${k} ${v.toFixed(0)}ms`)};
  };
  const worst = [...long].sort((x, y) => y[1] - x[1]).slice(0, 10).map(f => ({ms:Math.round(f[1]), tag:f[2], ...attr(f)}));
  // gom theo bước
  const byTag = {}, tagSelf = {}; long.forEach(f => { const k = String(f[2]).replace(/ #\d+$/, ''); byTag[k] = (byTag[k] || 0) + 1;
    const m = tagSelf[k] = tagSelf[k] || new Map(); attr(f).incl.forEach(s => { const q = s.match(/^(.*) (\d+)ms$/); m.set(q[1], (m.get(q[1]) || 0) + +q[2]); }); });
  const tagHot = Object.entries(byTag).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, n]) => ({tag:k, n, hot:[...tagSelf[k]].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([q, v]) => `${q} ${v}ms`)}));
  // hàm tốn nhiều nhất trong mọi khung dài (cộng dồn, inclusive)
  const agg = new Map(); long.forEach(f => attr(f).incl.forEach(s => { const m = s.match(/^(.*) (\d+)ms$/); agg.set(m[1], (agg.get(m[1]) || 0) + +m[2]); }));
  return {frames:frames.length, secs:Math.round(tot/1000), avg:+avg.toFixed(1), min:+minF.toFixed(1), long50:long.length, long100:frames.filter(f => f[1] > 100).length,
    tagHot, p99:+[...durs].sort((a, b) => a - b)[Math.floor(durs.length*.99)].toFixed(1), worst, byTag, hot:[...agg].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => `${k} ${v}ms`),
    hist:frames.map(f => Math.round(f[1])), median:[...durs].sort((a, b) => a - b)[durs.length >> 1]};
}

module.exports = {open, plan, analyze, lineMap, MARK, REC};
if(require.main === module) (async () => {
  const b = await chromium.launch(); const lm = lineMap(); const dir = path.join(__dirname, 'out', 'fps-' + tag); fs.mkdirSync(dir, {recursive:true});
  for(const k of pick){
    const vp = VPS[k]; const {ctx, p, logs} = await open(b, vp); const cdp = await ctx.newCDPSession(p);
    await cdp.send('Emulation.setCPUThrottlingRate', {rate:RATE});
    await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {interval:500}); await cdp.send('Profiler.start');
    const t0 = await p.evaluate(MARK); await p.evaluate(REC);
    const S = plan(), T0 = Date.now();
    for(const [name, f] of S){ await p.evaluate(n => { window.__fpsTag = n; }, name); try { await f(p); } catch(e){ console.log(`[${k}] bước “${name}” lỗi: ${e.message.slice(0, 160)}`); } console.log(`[${k}] xong ${name} (${Math.round((Date.now() - T0)/1000)}s)`); }
    await p.evaluate(() => { window.__v61fStop = 1; }); await sleep(300);
    const frames = await p.evaluate(() => window.__v61fF);
    const {profile} = await cdp.send('Profiler.stop');
    // căn giờ: mẫu đầu tiên rơi vào __v61fMark ứng với t0
    const node = new Map(); profile.nodes.forEach(n => node.set(n.id, n)); let tt = profile.startTime, off = null;
    for(let i = 0; i < profile.samples.length; i++){ tt += profile.timeDeltas[i]; if(node.get(profile.samples[i]).callFrame.functionName === '__v61fMark'){ off = tt/1000 - t0; break; } }
    const R = analyze(frames, profile, off || 0, lm); R.vp = k; R.rate = RATE; R.consoleLogs = logs; R.aligned = off != null;
    fs.writeFileSync(path.join(dir, k + '.json'), JSON.stringify(R, null, 1));
    console.log(`[${k}] FPS TB ${R.avg} · thấp nhất ${R.min} · khung>50ms ${R.long50} · >100ms ${R.long100} · console ${logs.length}`);
    R.worst.slice(0, 5).forEach(w => console.log(`   ${w.ms}ms [${w.tag}] ${w.self.slice(0, 2).join(' | ')} || ${w.incl.slice(0, 2).join(' | ')}`));
    await ctx.close();
  }
  await b.close();
})();
