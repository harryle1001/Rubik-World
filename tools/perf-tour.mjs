// tools/perf-tour.mjs — Đi một vòng toàn bản đồ ở chế độ ĐIỆN THOẠI (390×844, DPR 2, UA iPhone → CFG.isMobile, chất lượng mức 1
// = mức điện thoại khởi đầu, khoá) và đo từng điểm: ms/khung, khung giật (> 50 ms), draw call (tổng + pass bóng), tam giác,
// số đèn/đèn đổ bóng, thời gian JS mỗi khung theo module, shader mới biên dịch khi tới điểm (nguyên nhân khựng phổ biến).
// Chạy: node server/index.js &  rồi  node tools/perf-tour.mjs [--out=thu-muc-anh] [--json=ket-qua.json]
// Lưu ý: GPU giả lập (SwiftShader) → ms/khung tuyệt đối chậm hơn máy thật nhiều lần; dùng để SO SÁNH giữa các điểm.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const OUT = arg('out'), JSONF = arg('json'); if (OUT) fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.goto('http://localhost:3000/ocean.html');
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 300000 });
await page.waitForFunction(() => !__island.player.frozen, null, { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(3000);
await page.evaluate(() => { __island.setQuality(1, true); __island.sky.state.lock = 13; }); await page.waitForTimeout(8000);   // ổn định: bật lại bóng đổ (máy chậm có thể đã tự hạ mức) + biên dịch lại shader trước khi đo

// bọc đo: JS từng module, render (CPU), draw call / tam giác (cả pass bóng), khung giật
await page.evaluate(() => {
  const c = __island, R = c.renderer, P = window.__pt = { reset() { Object.assign(this, { t: {}, n: 0, calls: 0, sh: 0, tris: 0, frame: 0, raf: 0, spikes: 0, maxF: 0 }); } };
  P.reset(); R.info.autoReset = false; c.setQuality(1, true);
  const wrap = (name, o, fn = 'update') => { if (!o || !o[fn] || o[fn].__w) return; const f = o[fn]; o[fn] = function (...a) { const s = performance.now(); const r = f.apply(this, a); P.t[name] = (P.t[name] || 0) + performance.now() - s; return r; }; o[fn].__w = 1; };
  for (const k of ['player', 'physics', 'terrain', 'net', 'animals', 'school', 'aircraft', 'sky', 'weather', 'eggs', 'ambience', 'living', 'sealife', 'treasure', 'skyshow', 'perf', 'mg', 'worldMap', 'audio']) wrap(k, c[k]);
  const so = R.shadowMap.render.bind(R.shadowMap); R.shadowMap.render = (...a) => { const c0 = R.info.render.calls; so(...a); P._sh += R.info.render.calls - c0; };   // gọi nhiều lần/khung (mỗi pass hậu kỳ) → cộng dồn
  const r = c.post.render; c.post.render = function () { R.info.reset(); P._sh = 0; const s = performance.now(); r.call(this); P.t.render = (P.t.render || 0) + performance.now() - s; P.n++; P.calls += R.info.render.calls; P.sh += P._sh; P.tris += R.info.render.triangles; };
  let last = performance.now(); (function loop() { const n = performance.now(), d = n - last; last = n; P.frame += d; P.raf++; if (d > 50) P.spikes++; P.maxF = Math.max(P.maxF, d); requestAnimationFrame(loop); })();
});
const L = await page.evaluate(async () => {
  const l = await import('/js/island/layout.js'), p = await import('/js/island/sample/plaza.js'), K = l.EXTRA.find(e => e.id === 'K').r, B = l.BLOCKS.find(b => b.id === 'B');
  const school = l.to3(1000, 380), a = Math.PI * 0.75, beach = [Math.cos(a) * l.ISLAND_R * 0.93, Math.sin(a) * l.ISLAND_R * 0.93], sea = [Math.cos(a) * (l.ISLAND_R + 25), Math.sin(a) * (l.ISLAND_R + 25)];
  return { spawn: l.SPAWN, plaza: [p.PLAZA.x, p.PLAZA.z], school, town: B.c, air: [(K[0] + K[2]) / 2, (K[1] + K[3]) / 2], beach, sea };
});
// mỗi điểm: [tên, chuẩn bị (chạy trong trang), thời gian chờ ổn định (ms)]
const spots = [
  ['Cổng trường', `p.teleport(${L.spawn}); cam(-Math.PI/2+0.75)`, 4000],
  ['Quảng trường', `p.teleport(${L.plaza}); cam(Math.PI/2)`, 4000],
  ['Khu trường (sân trong)', `p.teleport(${L.school}); cam(0)`, 5000],
  ['Thị trấn Đà Lạt', `p.teleport(${L.town}); cam(0.8)`, 5000],
  ['Sân bay', `p.teleport(${L.air}); cam(0)`, 4000],
  ['Bờ biển', `p.teleport(${L.beach}); cam(${Math.PI * 0.75 + Math.PI})`, 4000],
  ['Lặn biển', `p.teleport(${L.sea}); cam(0); dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyQ' })); setTimeout(() => dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyQ' })), 2500)`, 6000],
  ['Đêm mưa (cổng trường)', `p.teleport(${L.spawn}); cam(-Math.PI/2+0.75); c.sky.state.lock = 22; c.weather.set('rain', true)`, 6000],
  ['Khinh khí cầu', `c.sky.state.lock = 13; c.weather.set('clear', true); p.teleport(${L.spawn}); c.account.profile && c.account.profile.own && c.account.profile.own.push('ride-balloon'); c.vehicles.toggleBalloon()`, 12000],
  ['Bay máy bay', `c.vehicles.riding && c.vehicles.toggleBalloon(); p.vehicle = null; p.teleport(${L.air}); c.aircraft.board()`, 14000],
];
const rows = [];
for (const [name, prep, wait] of spots) {
  const pre = await page.evaluate(code => { const c = __island, p = c.player, cam = y => { p.cam.yaw = y; p.cam.pitch = 0.3; p.cam.dist = 11; p.snapCamera(); };
    if (c.sky.state.lock == null) c.sky.state.lock = 13; try { eval(code); } catch (e) { return 'lỗi chuẩn bị: ' + e.message; } return c.renderer.info.programs.length; }, prep);
  await page.waitForTimeout(wait);
  await page.evaluate(() => __pt.reset());
  await page.waitForFunction(() => __pt.n >= 55, null, { timeout: 300000 });
  const m = await page.evaluate(pre => {
    const c = __island, P = __pt, n = Math.max(1, P.n); let lights = 0, shadowLights = 0;
    c.scene.traverse(o => { if (o.isLight && o.visible && o.intensity > 0) { lights++; if (o.castShadow && c.renderer.shadowMap.enabled) shadowLights++; } });
    const js = {}; let jsSum = 0; for (const k in P.t) if (k !== 'render') { js[k] = +(P.t[k] / n).toFixed(2); jsSum += P.t[k] / n; }
    const top = Object.entries(js).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${v}`).join(', ');
    return { msFrame: +(P.frame / Math.max(1, P.raf)).toFixed(1), spikes: P.spikes, maxMs: Math.round(P.maxF), calls: Math.round(P.calls / n), shadowCalls: Math.round(P.sh / n), tris: Math.round(P.tris / n),
      lights, shadowLights, jsMs: +jsSum.toFixed(2), renderCpuMs: +(P.t.render / n).toFixed(2), topJs: top, newShaders: typeof pre === 'number' ? c.renderer.info.programs.length - pre : pre,
      pos: [c.player.pos.x, c.player.pos.y, c.player.pos.z].map(v => Math.round(v)), underwater: !!c.underwater, plane: c.aircraft && c.aircraft.phase };
  }, pre);
  if (OUT) await page.screenshot({ path: `${OUT}/${String(rows.length + 1).padStart(2, '0')}.png` });
  rows.push({ name, ...m }); console.log(name, JSON.stringify(m));
}
console.table(rows.map(r => ({ điểm: r.name, 'ms/khung': r.msFrame, giật: r.spikes, maxMs: r.maxMs, call: r.calls, 'call bóng': r.shadowCalls, 'tam giác': r.tris, đèn: r.lights, 'JS ms': r.jsMs, 'render CPU': r.renderCpuMs, 'shader mới': r.newShaders })));
if (JSONF) fs.writeFileSync(JSONF, JSON.stringify(rows, null, 1));
console.log(errors.length ? 'LỖI CONSOLE:\n' + errors.join('\n') : 'Không lỗi console');
await browser.close();
