// tools/perf-opt-cpu.mjs — Đo CPU/JS/bộ nhớ Đảo 3D ở chế độ ĐIỆN THOẠI (390×844, CPU chậm 4×) theo nhiều kịch bản 60 s.
// Chạy: node server/index.js &  rồi  node tools/perf-opt-cpu.mjs --out=docs/perf/opt-cpu/before [--sec=60] [--only=thi-tran,may-bay] [--leak] [--no-scen]
// Mỗi kịch bản: JS/khung (vòng lặp game + vẽ phía CPU) trung bình · p95 · p99, khung > 33/50/100 ms, GC (số lần, ms),
// heap theo giây, TOP 15 hàm (self time), số setInterval sống / setTimeout mỗi giây / rAF phụ mỗi khung / listener.
// --alloc: lấy mẫu cấp phát (hàm nào tạo rác) · --dom: đếm thay đổi DOM/giây · --save-prof: lưu .cpuprofile
// --leak: vào/ra mini game, khu (học viện ↔ thị trấn), phương tiện (xe đạp, phà) 10 lần → heap sau GC + geometry/texture.
// GPU giả lập (SwiftShader) → giảm điểm ảnh (--px, mặc định 0,25) để luồng chính không chờ GPU, đo đúng phần JS.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const URL = arg('url') || 'http://localhost:3000/ocean.html', OUT = arg('out'), THR = +(arg('throttle') ?? 4), SEC = +(arg('sec') ?? 60), PX = +(arg('px') ?? 0.25);
const ONLY = arg('only') ? arg('only').split(',') : null, LEAK = process.argv.includes('--leak'), NOSCEN = process.argv.includes('--no-scen'), MG = arg('mg') || 'caro', DOM = process.argv.includes('--dom'), ALLOC = process.argv.includes('--alloc');
if (OUT) fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--js-flags=--expose-gc'] });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
// đếm hẹn giờ/listener từ đầu (trang chính, không tính iframe trường 2D)
await page.addInitScript(() => { if (window.top !== window) return; try { localStorage.setItem('island.intro', '1'); } catch (e) {}   // bỏ clip mở đầu (chạy giữa lúc đo, cuối clip đưa người chơi về chỗ cũ)
  const T = window.__tm = { iv: new Set(), to: 0, raf: 0, lis: 0, ivSrc: new Map() };
  const si = setInterval, ci = clearInterval, st = setTimeout, ra = requestAnimationFrame, ae = EventTarget.prototype.addEventListener, re = EventTarget.prototype.removeEventListener;
  window.setInterval = function (f, ms, ...a) { const id = si.call(window, f, ms, ...a); T.iv.add(id); T.ivSrc.set(id, ms + 'ms ' + ((new Error().stack || '').split('\n')[2] || '').replace(/.*\/js\//, '').replace(/\)$/, '').trim()); return id; };
  window.clearInterval = function (id) { T.iv.delete(id); T.ivSrc.delete(id); return ci.call(window, id); };
  window.setTimeout = function (...a) { T.to++; return st.apply(window, a); };
  window.requestAnimationFrame = function (cb) { if (cb && cb.name !== 'onAnimationFrame') T.raf++; return ra.call(window, cb); };
  EventTarget.prototype.addEventListener = function (...a) { T.lis++; return ae.apply(this, a); };
  EventTarget.prototype.removeEventListener = function (...a) { T.lis--; return re.apply(this, a); };
});
const cdp = await page.context().newCDPSession(page);
await page.goto(URL);
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 300000 });
const fr = page.frames().find(f => f.url().includes('/school/'));
if (fr) { const b = fr.getByText('Chỉ xem, chưa chơi'); if (await b.count().catch(() => 0)) await b.first().click({ force: true, timeout: 5000 }).catch(() => {}); }
for (let k = 0; k < 20; k++) { const busy = await page.evaluate(() => { const g = document.querySelector('#accBox:not([hidden]) [data-a="guest"]'); if (g) g.click(); const s = document.querySelector('[data-s]'); if (s && s.offsetParent) s.click(); const n = document.querySelector('#stSay button.nx'); if (n && n.offsetParent) n.click(); return !!g || document.body.classList.contains('st-cut') || __island.player.frozen; }); if (!busy) break; await page.waitForTimeout(700); }
await page.waitForFunction(() => !__island.player.frozen, null, { timeout: 30000 }).catch(() => {});
await page.waitForFunction(() => __island.warmed, null, { timeout: 120000 }).catch(() => console.log('(chưa warm-up shader)'));
const L = await page.evaluate(async () => { const p = await import('/js/island/sample/plaza.js'), l = await import('/js/island/layout.js'), s = await import('/js/island/sea/site.js');
  return { plaza: [p.PLAZA.x, p.PLAZA.z], acad: l.ACADEMY.c, village: s.STOPS[0].land, spawn: l.SPAWN }; });
// khung đo: bọc rAF (khung JS), post.render (vẽ phía CPU), player.update (lái tự động)
await page.evaluate(([px, L]) => { const c = __island; c.__L = L; c.setQuality(1, true); c.sky.state.lock = 13; c.renderer.setPixelRatio(px); c.post.setSize(innerWidth, innerHeight);
  const F = window.__pf = { on: false, js: [], rd: [], iv: [], rdCur: 0, last: 0, drive: null, held: new Set() };
  // ms từng module (bọc mọi ctx.X.update) → bảng module tốn nhất mỗi kịch bản
  F.mod = {}; for (const k of Object.keys(c)) { const o = c[k]; if (!o || typeof o !== 'object' || typeof o.update !== 'function' || o === c.renderer || o === c.camera || o === c.scene || o === c.player || o.update.__w) continue; const f = o.update;
    o.update = function () { const s = performance.now(), r = f.apply(this, arguments); if (F.on) F.mod[k] = (F.mod[k] || 0) + performance.now() - s; return r; }; o.update.__w = 1; }
  const r = c.post.render; c.post.render = function () { const s = performance.now(); r.apply(this, arguments); F.rdCur += performance.now() - s; };
  const pu = c.player.update; c.player.update = function () { if (F.drive) try { F.drive(); } catch (e) { console.error('drive', e.message); } return pu.apply(this, arguments); };
  const raf = window.requestAnimationFrame; window.requestAnimationFrame = cb => raf(ts => { if (cb.name !== 'onAnimationFrame') return cb(ts); const s = performance.now(); F.rdCur = 0; cb(ts); const d = performance.now() - s; if (F.on) { F.js.push(d); F.rd.push(F.rdCur); if (F.last) F.iv.push(s - F.last); } F.last = s; });
  F.key = (code, on) => { if (on === F.held.has(code)) return; on ? F.held.add(code) : F.held.delete(code); dispatchEvent(new KeyboardEvent(on ? 'keydown' : 'keyup', { code })); };
  F.release = () => { for (const k of [...F.held]) F.key(k, false); c.player.input.x = c.player.input.z = 0; F.drive = null; };
  // đi vòng tròn bán kính R quanh (cx, cz): hướng camera = tiếp tuyến + kéo về bán kính
  F.circle = (cx, cz, R, run) => () => { const p = c.player, dx = p.pos.x - cx, dz = p.pos.z - cz, d = Math.hypot(dx, dz) || 1;
    const tx = -dz / d + dx / d * (R - d) * 0.15, tz = dx / d + dz / d * (R - d) * 0.15; p.cam.yaw = Math.atan2(-tx, -tz); p.cam.drag = performance.now(); F.key('KeyW', true); F.key('ShiftLeft', !!run); };
}, [PX, L]);
await page.waitForTimeout(4000);

const SCEN = {
  // đi bộ (rồi chạy) vòng 34 m quanh quảng trường: đi qua phố, nhà, người
  'thi-tran': () => { const c = __island, [x, z] = c.__L.plaza; c.player.teleport(x + 34, z); c.player.snapCamera(); const w = __pf.circle(x, z, 34); let t0 = performance.now(); __pf.drive = () => { w(); __pf.key('ShiftLeft', performance.now() - t0 > 30000); }; },
  // đứng giữa quảng trường đông NPC/thú, xoay camera chậm
  'quang-truong': () => { const c = __island, [x, z] = c.__L.plaza; c.player.teleport(x + 5, z + 3); c.player.snapCamera(); __pf.drive = () => { c.player.cam.yaw += 0.004; c.player.cam.drag = performance.now(); }; },
  'hoc-vien': () => { const c = __island, [x, z] = c.__L.acad; c.player.teleport(x + 8, z); c.player.snapCamera(); __pf.drive = __pf.circle(x, z, 8); },
  'lang-chai': () => { const c = __island, [x, z] = c.__L.village; c.player.teleport(x, z); c.player.snapCamera(); __pf.drive = __pf.circle(x, z - 8, 8); },
  'may-bay': () => { const c = __island, F = __pf; c.aircraft.board(); const wp = [[0, 0, 40], [-150, -100, 40], [150, -60, 40], [60, 160, 40]]; let wi = 0; const wr = a => Math.atan2(Math.sin(a), Math.cos(a));
    F.drive = () => { const pl = c.aircraft.planes.find(q => !q.parked && !q.route); if (!pl) return; const P = pl.group.position, w = wp[wi]; if (Math.hypot(w[0] - P.x, w[1] - P.z) < 25) wi = (wi + 1) % wp.length;
      const d = wr(Math.atan2(w[0] - P.x, w[1] - P.z) - pl.group.rotation.y); F.key('KeyA', d > 0.08); F.key('KeyD', d < -0.08); F.key('KeyW', P.y < w[2] - 2); F.key('KeyS', P.y > w[2] + 4); }; },
  'tau': () => { const c = __island, [x, z] = c.__L.village; c.player.teleport(x, z); c.sea.pilot.board(); __pf.drive = () => { c.player.cam.yaw += 0.002; }; },
  'mini-game': mg => { const c = __island; c.mg.start(mg, c.mg.doorOf(mg)); setTimeout(() => c.mg.skipFly && c.mg.skipFly(), 600); let k = 0; __pf.drive = () => { if (++k % 40 === 0) { __pf.key('Space', true); setTimeout(() => __pf.key('Space', false), 80); } __pf.key('KeyW', k % 120 < 60); }; },
  // mở/đóng cặp sách → cửa hàng → bản đồ, mỗi thứ ~3 s
  'giao-dien': () => { const c = __island; let k = 0; const seq = [() => c.backpack.open(), () => c.backpack.close(), () => c.shop.open('wear'), () => c.shop.close(), () => c.worldMap.toggle(), () => c.worldMap.toggle()];
    window.__ui = setInterval(() => { try { seq[k++ % seq.length](); } catch (e) { console.error('ui', e.message); } }, 3000); },
};
const TEARDOWN = {
  'may-bay': () => { const c = __island; try { if (c.aircraft.eject()) { c.player.vehicle = null; } } catch (e) {} const [x, z] = c.__L.plaza; c.player.teleport(x + 8, z); },
  'tau': () => { const c = __island; if (c.sea.pilot.aboard) c.sea.pilot.leave(c.sea.pilot && { land: c.__L.village, name: '' }); },
  'mini-game': () => { __island.mg.exit(true); },
  'giao-dien': () => { clearInterval(window.__ui); const c = __island; if (c.backpack.isOpen) c.backpack.close(); if (c.shop.isOpen) c.shop.close(); if (c.worldMap.open) c.worldMap.toggle(); },
};
const pct = (a, q) => a.length ? +a[Math.min(a.length - 1, Math.floor(a.length * q))].toFixed(1) : 0;
async function measure(name) {
  const gcs = []; const onData = e => { for (const ev of e.value) if (/^(MinorGC|MajorGC|V8\.GCScavenger|V8\.GCFinalizeMC|V8\.GCIncrementalMarkingFinalize)$/.test(ev.name) && ev.ph === 'X') gcs.push({ name: ev.name, dur: ev.dur / 1000 }); };
  cdp.on('Tracing.dataCollected', onData); const done = new Promise(r => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['devtools.timeline', 'v8'], recordMode: 'recordContinuously' }, transferMode: 'ReportEvents' });
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 250 });
  const t0 = await page.evaluate(() => { const F = __pf; F.js.length = F.rd.length = F.iv.length = 0; F.mod = {}; F.last = 0; F.on = true; const T = __tm; return { to: T.to, raf: T.raf, lis: T.lis }; });
  if (DOM) await page.evaluate(() => { const M = window.__dm = new Map(); const d = n => { const e = n.nodeType === 1 ? n : n.parentElement; return e ? (e.id ? '#' + e.id : e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '') + (e.parentElement && e.parentElement.id ? '<#' + e.parentElement.id : '')) : '?'; };
    window.__mo = new MutationObserver(l => { for (const m of l) { const k = d(m.target) + ' ' + m.type + (m.attributeName ? ':' + m.attributeName : ''); M.set(k, (M.get(k) || 0) + 1); } }); __mo.observe(document.body, { subtree: true, attributes: true, childList: true, characterData: true }); });
  await cdp.send('Profiler.start');
  if (ALLOC) { await cdp.send('HeapProfiler.enable'); await cdp.send('HeapProfiler.startSampling', { samplingInterval: 16384, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true }); }
  const heap = []; for (let s = 0; s < SEC; s++) { await page.waitForTimeout(1000); heap.push(await page.evaluate(() => +(performance.memory.usedJSHeapSize / 1048576).toFixed(1))); }
  const { profile } = await cdp.send('Profiler.stop');
  let alloc = null; if (ALLOC) { const { profile: hp } = await cdp.send('HeapProfiler.stopSampling'); const m = new Map(); const nm = q => q ? `${q.callFrame.functionName || '(anon)'} ${(q.callFrame.url || '').replace(/^.*\/(js|lib)\//, '').replace('three/build/three.module.js', 'three')}:${q.callFrame.lineNumber + 1}` : ''; const walk = (q, a, b) => { const k = nm(q) + ' < ' + nm(a) + ' < ' + nm(b); m.set(k, (m.get(k) || 0) + q.selfSize); q.children.forEach(c => walk(c, q, a)); }; walk(hp.head, null, null); alloc = [...m].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, b]) => k.slice(0, 160) + ' ' + Math.round(b / 1024 / SEC) + ' KB/s'); }
  const dom = DOM ? await page.evaluate(S => { __mo.disconnect(); return [...__dm].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => k + ' ' + (v / S).toFixed(1) + '/s'); }, SEC) : null;
  await cdp.send('Tracing.end'); await done; cdp.off('Tracing.dataCollected', onData);
  const P = await page.evaluate(() => { const F = __pf, T = __tm; F.on = false; return { mod: F.mod, js: F.js.slice(), rd: F.rd.slice(), iv: F.iv.slice(), to: T.to, raf: T.raf, lis: T.lis, ivLive: T.iv.size, ivSrc: [...T.ivSrc.values()], info: { geo: __island.renderer.info.memory.geometries, tex: __island.renderer.info.memory.textures, prog: __island.renderer.info.programs.length } }; });
  const n = P.js.length || 1, js = [...P.js].sort((a, b) => a - b), logic = P.js.map((v, i) => v - P.rd[i]).sort((a, b) => a - b), avg = a => a.reduce((s, v) => s + v, 0) / (a.length || 1);
  const byId = new Map(profile.nodes.map(q => [q.id, q])), self = new Map(), dts = profile.timeDeltas;
  for (let i = 0; i < profile.samples.length; i++) { const cf = byId.get(profile.samples[i]).callFrame; const k = `${cf.functionName || '(anon)'} ${(cf.url || '').replace(/^.*\/(js|lib)\//, '')}:${cf.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + (dts[i + 1] || 0) / 1000); }
  const tot = [...self.values()].reduce((a, b) => a + b, 0);
  const top = [...self.entries()].filter(([k]) => !/^\((idle|program|garbage collector)\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, ms]) => ({ fn: k.slice(0, 80), msF: +(ms / n).toFixed(2), pct: +(ms / tot * 100).toFixed(1) }));
  const minor = gcs.filter(g => /Minor|Scavenger/.test(g.name)), major = gcs.filter(g => /Major|FinalizeMC/.test(g.name));
  const res = { name, frames: P.js.length, fps: +(P.js.length / SEC).toFixed(1),
    jsAvg: +avg(P.js).toFixed(1), jsP95: pct(js, 0.95), jsP99: pct(js, 0.99), jsMax: Math.round(js.at(-1) || 0),
    logicAvg: +avg(logic).toFixed(1), logicP99: pct(logic, 0.99), renderAvg: +avg(P.rd).toFixed(1),
    over33: P.js.filter(t => t > 33).length, over50: P.js.filter(t => t > 50).length, over100: P.js.filter(t => t > 100).length,
    gcMinor: minor.length, gcMajor: major.length, gcMs: Math.round(gcs.reduce((a, g) => a + g.dur, 0)),
    heapMB: [heap[0], Math.max(...heap), heap.at(-1)], heapSlopeMBmin: +((heap.at(-1) - heap[0]) / SEC * 60).toFixed(1),
    mods: Object.entries(P.mod).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => k + ' ' + (v / n).toFixed(2)).join(' · '), ivLive: P.ivLive, toPerS: +((P.to - t0.to) / SEC).toFixed(1), rafPerF: +((P.raf - t0.raf) / n).toFixed(2), listeners: P.lis, ...P.info };
  if (dom) res.dom = dom; if (alloc) res.alloc = alloc; return { res, top, heap, ivSrc: P.ivSrc, profile };
}
const rows = [], all = {};
if (!NOSCEN) for (const [name, setup] of Object.entries(SCEN)) {
  if (ONLY && !ONLY.includes(name)) continue;
  await page.evaluate(() => { for (const b of document.querySelectorAll('#stSay button')) if (/Bỏ qua|Xong/.test(b.textContent) && b.offsetParent) b.click(); });   // hộp thoại cốt truyện
  await page.evaluate(([src, mg]) => { (0, eval)('(' + src + ')')(mg); }, [setup.toString(), MG]);
  await page.waitForTimeout(5000);   // khu/model nạp, shader biên dịch
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: THR });
  const m = await measure(name);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  if (OUT) { await page.screenshot({ path: `${OUT}/${name}.jpg`, quality: 70, scale: 'css', type: 'jpeg' }); if (process.argv.includes('--save-prof')) fs.writeFileSync(`${OUT}/${name}.cpuprofile`, JSON.stringify(m.profile)); }
  await page.evaluate(() => __pf.release());
  if (TEARDOWN[name]) await page.evaluate(src => { (0, eval)('(' + src + ')')(); }, TEARDOWN[name].toString()).catch(e => console.log('teardown', e.message));
  await page.waitForTimeout(1500);
  rows.push(m.res); all[name] = { res: m.res, top: m.top, heap: m.heap, ivSrc: m.ivSrc };
  console.log('\n##', name, JSON.stringify(m.res)); console.table(m.top);
}
if (rows.length) console.table(rows.map(r => { const { heapMB, ...o } = r; return { ...o, heap: heapMB.join('/') }; }));
// --- rò rỉ: vào/ra 10 lần ---
if (LEAK) {
  const mem = () => page.evaluate(async () => { for (let i = 0; i < 3; i++) { window.gc && gc(); await new Promise(r => setTimeout(r, 300)); } const i = __island.renderer.info.memory; return { heap: +(performance.memory.usedJSHeapSize / 1048576).toFixed(1), geo: i.geometries, tex: i.textures, lis: __tm.lis, iv: __tm.iv.size, kids: __island.scene.children.length }; });
  const cycles = {
    'mini-game': async () => { await page.evaluate(k => { const c = __island; c.mg.start(k, c.mg.doorOf(k)); c.mg.skipFly && c.mg.skipFly(); }, MG); await page.waitForTimeout(2500); await page.evaluate(() => __island.mg.exit(true)); await page.waitForTimeout(1500); },
    'khu': async () => { for (const k of ['acad', 'plaza']) for (let i = 0; i < 8; i++) { await page.evaluate(k => { const c = __island, [x, z] = c.__L[k]; if (Math.hypot(c.player.pos.x - x - 8, c.player.pos.z - z) > 3) c.player.teleport(x + 8, z); }, k); await page.waitForTimeout(500); } },
    'phuong-tien': async () => { await page.evaluate(() => { const c = __island, [x, z] = c.__L.plaza; c.player.teleport(x + 8, z); c.vehicles.toggleBike(); }); await page.waitForTimeout(1200); await page.evaluate(() => __island.vehicles.toggleBike()); await page.waitForTimeout(800);
      await page.evaluate(() => { const c = __island, [x, z] = c.__L.village; c.player.teleport(x, z); c.sea.pilot.board(); }); await page.waitForTimeout(1500); await page.evaluate(() => { const c = __island; if (c.sea.pilot.aboard) c.sea.pilot.leave({ land: c.__L.village, name: '' }); }); await page.waitForTimeout(800); },
  };
  const leak = {};
  for (const [k, fn] of Object.entries(cycles)) { await fn(); const a = await mem(); for (let i = 0; i < 10; i++) await fn(); const b = await mem(); leak[k] = { truoc: a, sau10: b, dHeapMB: +(b.heap - a.heap).toFixed(1), dGeo: b.geo - a.geo, dTex: b.tex - a.tex, dLis: b.lis - a.lis, dIv: b.iv - a.iv }; console.log('rò rỉ', k, JSON.stringify(leak[k])); }
  all.leak = leak;
}
if (OUT) fs.writeFileSync(`${OUT}/result.json`, JSON.stringify(all, null, 1));
console.log(errors.length ? 'LỖI CONSOLE:\n' + [...new Set(errors)].slice(0, 15).join('\n') : 'Không lỗi console');
await browser.close();
