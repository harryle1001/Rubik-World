// tools/perf-cpu.mjs — Profile CPU Đảo 3D ở chế độ ĐIỆN THOẠI, CPU chậm 4× (CDP): 30 s đi bộ + 30 s chạy vòng quanh quảng trường thị trấn.
// Chạy: node server/index.js &  rồi  node tools/perf-cpu.mjs [--out=thu/muc] [--throttle=4] [--sec=30]
// In: TOP 10 hàm tốn nhất (self time), số lần GC (minor/major, tổng ms), khung > 50 ms, ms/khung trung bình & p95, heap đầu/cuối.
// --out: lưu file .cpuprofile (mở bằng Chrome DevTools → Performance) và kết quả JSON.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const URL = arg('url') || 'http://localhost:3000/ocean.html', OUT = arg('out'), THR = +(arg('throttle') ?? 4), SEC = +(arg('sec') ?? 30), PX = +(arg('px') ?? 0.25);
// --px: tỉ lệ điểm ảnh lúc đo (mặc định 0,25): GPU giả lập SwiftShader chạy bằng CPU → giảm điểm ảnh để luồng chính không chờ GPU, đo đúng phần JS
if (OUT) fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--js-flags=--expose-gc'] });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
const cdp = await page.context().newCDPSession(page);
await page.goto(URL);
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 300000 });
const fr = page.frames().find(f => f.url().includes('/school/'));
if (fr) { const b = fr.getByText('Chỉ xem, chưa chơi'); if (await b.count().catch(() => 0)) await b.first().click({ force: true, timeout: 5000 }).catch(() => {}); }
for (let k = 0; k < 20; k++) { const busy = await page.evaluate(() => { const g = document.querySelector('#accBox:not([hidden]) [data-a="guest"]'); if (g) g.click(); const s = document.querySelector('[data-s]'); if (s && s.offsetParent) s.click(); const n = document.querySelector('#stSay button.nx'); if (n && n.offsetParent) n.click(); return !!g || document.body.classList.contains('st-cut') || __island.player.frozen; }); if (!busy) break; await page.waitForTimeout(700); }   // Chơi khách · bỏ qua dẫn chuyện
await page.waitForFunction(() => !__island.player.frozen, null, { timeout: 30000 }).catch(() => {});
const P = await page.evaluate(async () => { const p = await import('/js/island/sample/plaza.js'); return [p.PLAZA.x, p.PLAZA.z]; });
// khoá chất lượng mức 1 + giờ 13h (số đo không đổi theo FPS/giờ thật); đặt người chơi ở mép quảng trường
await page.evaluate(([x, z, px]) => { const c = __island; c.setQuality(1, true); c.sky.state.lock = 13; c.renderer.setPixelRatio(px); c.post.setSize(innerWidth, innerHeight); c.player.teleport(x + 21, z); c.player.snapCamera();
  // đo ms từng module (bọc hàm update trong ctx) + ms vẽ (post.render)
  const M = window.__mod = {}, F = {}; window.__spk = []; for (const k of Object.keys(c)) { const o = c[k]; if (!o || typeof o !== 'object' || typeof o.update !== 'function' || o === c.renderer || o === c.camera || o === c.scene) continue; const f = o.update; M[k] = 0; o.update = function () { const s = performance.now(), r = f.apply(this, arguments), d = performance.now() - s; M[k] += d; F[k] = (F[k] || 0) + d; return r; }; }
  const r = c.post.render; M.render = 0; c.post.render = function () { const s = performance.now(); r.call(this); const d = performance.now() - s; M.render += d; F.render = (F.render || 0) + d; };
  const raf = window.requestAnimationFrame; M.frameJs = 0; window.__fj = []; window.requestAnimationFrame = cb => raf(ts => { const s = performance.now(); cb(ts); const d = performance.now() - s; M.frameJs += d; if (cb.name === 'onAnimationFrame') { __fj.push(d); if (d > 100) __spk.push({ ms: Math.round(d), prog: __island.renderer.info.programs.length, tex: __island.renderer.info.memory.textures, geo: __island.renderer.info.memory.geometries, ...Object.fromEntries(Object.entries(F).filter(e => e[1] > 5).map(([k, v]) => [k, Math.round(v)])) }); } for (const k in F) F[k] = 0; });
}, [...P, PX]);
await page.waitForTimeout(5000);   // chunk/LOD/biên dịch shader ổn định trước khi đo
// GPU giả lập chỉ ~3 khung/s, dt bị chặn 1/20 s → giờ trong game trôi chậm: chạy sẵn 2 lần quét của perf.js (trạng thái ổn định như máy thật sau vài giây)
// chờ biên dịch trước shader của ocean.js (1 lần, sau khi đóng bảng đăng nhập) xong rồi mới đo
await page.waitForFunction(() => __island.warmed, null, { timeout: 120000 }).catch(() => console.log('(chưa warm-up shader)')); await page.waitForTimeout(3000);
await page.evaluate(() => { const p = __island.perf; if (p && p.frozen) { p.scan(); p.scan(); } });
// lái: giữ W, cứ 100 ms đặt hướng camera = tiếp tuyến vòng tròn bán kính 21 m (Fibonacci) quanh quảng trường + kéo về bán kính
await page.evaluate(([cx, cz]) => {
  const c = __island, R = 21; window.__steer = setInterval(() => { const p = c.player.pos, dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz) || 1;
    const tx = -dz / d + dx / d * (R - d) * 0.15, tz = dx / d + dz / d * (R - d) * 0.15; c.player.cam.yaw = Math.atan2(-tx, -tz); c.player.cam.drag = performance.now(); }, 100);
  const F = window.__fr = { t: [], last: 0 }; const tick = ts => { if (F.last) F.t.push(ts - F.last); F.last = ts; F.raf = requestAnimationFrame(tick); }; F.raf = requestAnimationFrame(tick);
}, P);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: THR });
await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
const gcs = []; cdp.on('Tracing.dataCollected', e => { for (const ev of e.value) if (/^(MinorGC|MajorGC|V8\.GCScavenger|V8\.GCFinalizeMC|V8\.GCIncrementalMarkingFinalize)$/.test(ev.name) && ev.ph === 'X') gcs.push({ name: ev.name, dur: ev.dur / 1000 }); });
const done = new Promise(r => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['devtools.timeline', 'v8'], recordMode: 'recordContinuously' }, transferMode: 'ReportEvents' });
const heap0 = await page.evaluate(() => performance.memory ? performance.memory.usedJSHeapSize : 0);
await page.evaluate(() => { __fr.t.length = 0; for (const k in __mod) __mod[k] = 0; __fj.length = 0; __spk.length = 0; });
await cdp.send('Profiler.start');
const ALLOC = process.argv.includes('--alloc');   // --alloc: lấy mẫu cấp phát bộ nhớ (hàm nào tạo rác cho GC)
if (ALLOC) { await cdp.send('HeapProfiler.enable'); await cdp.send('HeapProfiler.startSampling', { samplingInterval: 8192, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true }); }
await page.keyboard.down('KeyW'); await page.waitForTimeout(SEC * 1000);                       // đi bộ
await page.keyboard.down('ShiftLeft'); await page.waitForTimeout(SEC * 1000);                  // chạy
await page.keyboard.up('ShiftLeft'); await page.keyboard.up('KeyW');
const { profile } = await cdp.send('Profiler.stop');
let allocTop = null; if (ALLOC) { const { profile: hp } = await cdp.send('HeapProfiler.stopSampling'); const m = new Map(); const walk = n => { const cf = n.callFrame, k = `${cf.functionName || '(anon)'} ${(cf.url || '').replace(/^.*\/(js|lib)\//, '')}:${cf.lineNumber + 1}`; m.set(k, (m.get(k) || 0) + n.selfSize); n.children.forEach(walk); }; walk(hp.head); allocTop = [...m].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, b]) => ({ fn: k.slice(0, 90), KB: Math.round(b / 1024) })); }
await cdp.send('Tracing.end'); await done;
const heap1 = await page.evaluate(() => performance.memory ? performance.memory.usedJSHeapSize : 0);
const ft = await page.evaluate(() => { cancelAnimationFrame(__fr.raf); clearInterval(__steer); return __fr.t; });
const fj = await page.evaluate(() => __fj.slice()).then(a => a.sort((x, y) => x - y));
const mod = await page.evaluate(n => Object.fromEntries(Object.entries(__mod).map(([k, v]) => [k, +(v / n).toFixed(2)]).sort((a, b) => b[1] - a[1])), ft.length);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
// --- tổng hợp self time theo hàm (gộp cùng tên + file:dòng) ---
const byId = new Map(profile.nodes.map(n => [n.id, n])), self = new Map(), dts = profile.timeDeltas;
for (let i = 0; i < profile.samples.length; i++) { const n = byId.get(profile.samples[i]); const cf = n.callFrame; const k = `${cf.functionName || '(anon)'} ${(cf.url || '').replace(/^.*\/js\//, '')}:${cf.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + (dts[i + 1] || 0) / 1000); }
const tot = [...self.values()].reduce((a, b) => a + b, 0);
const top = [...self.entries()].filter(([k]) => !/^\((idle|program|garbage collector)\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, ms]) => ({ fn: k.slice(0, 90), ms: Math.round(ms), pct: +(ms / tot * 100).toFixed(1) }));
// ms/khung của JS đảo 3D + three (self time từ profile, ổn định hơn đồng hồ trong trang) và riêng phần tính ma trận
let jsT = 0, matT = 0; for (let i = 0; i < profile.samples.length; i++) { const cf = byId.get(profile.samples[i]).callFrame, d = (dts[i + 1] || 0) / 1000; if (/localhost:\d+\/(js|lib\/three)\//.test(cf.url)) jsT += d; if (/^(updateMatrixWorld|updateMatrix|compose|multiplyMatrices)$/.test(cf.functionName)) matT += d; }
const gcMs = [...self.entries()].filter(([k]) => k.startsWith('(garbage collector)')).reduce((a, [, v]) => a + v, 0);
const sorted = [...ft].sort((a, b) => a - b), avg = ft.reduce((a, b) => a + b, 0) / ft.length;
const minor = gcs.filter(g => /Minor|Scavenger/.test(g.name)), major = gcs.filter(g => /Major|FinalizeMC/.test(g.name));
const res = {
  frames: ft.length, avgMs: +avg.toFixed(1), p95Ms: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1), maxMs: Math.round(sorted.at(-1)),
  over50: ft.filter(t => t > 50).length, over100: ft.filter(t => t > 100).length,
  gcMinor: minor.length, gcMajor: major.length, gcTraceMs: Math.round(gcs.reduce((a, g) => a + g.dur, 0)), gcProfMs: Math.round(gcMs),
  // khung JS (vòng lặp game + vẽ phía CPU, không tính chờ GPU giả lập): p95, lớn nhất, số khung > 50 ms
  jsFrame: { p95: +fj[Math.floor(fj.length * 0.95)].toFixed(1), max: Math.round(fj.at(-1)), over50: fj.filter(t => t > 50).length, over100: fj.filter(t => t > 100).length },
  jsMs: +(jsT / ft.length).toFixed(1), matrixMs: +(matT / ft.length).toFixed(2),
  heapMB: [+(heap0 / 1048576).toFixed(1), +(heap1 / 1048576).toFixed(1)],
};
res.msPerFrame = mod; res.spikes = await page.evaluate(() => __spk);
console.table(top); if (allocTop) console.table(allocTop); console.log(JSON.stringify(res));
if (OUT) { fs.writeFileSync(`${OUT}/cpu.cpuprofile`, JSON.stringify(profile)); fs.writeFileSync(`${OUT}/result.json`, JSON.stringify({ res, top }, null, 1)); await page.screenshot({ path: `${OUT}/end.png` }); }
console.log(errors.length ? 'LỖI CONSOLE:\n' + errors.slice(0, 10).join('\n') : 'Không lỗi console');
await browser.close();
