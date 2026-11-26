// tools/perf-gpu.mjs — Đo VẼ (GPU) + TẢI toàn bản đồ ở chế độ ĐIỆN THOẠI (390×844, DPR 2, UA iPhone → CFG.isMobile,
// chất lượng mặc định điện thoại = mức 1, khoá; 13h nắng). Mỗi điểm × 4 hướng camera: draw call (cả pass bóng), tam giác,
// số texture/geometry three đang giữ, bộ nhớ GPU ước tính (đếm byte thật qua hook WebGL: texture + buffer + renderbuffer),
// thời gian khung (CPU chậm 4×, rAF). Chế độ --load: giả lập 4G, đo thời gian tới khi chơi được (màn che mở) + dung lượng tải.
// Chạy: node server/index.js &  rồi  node tools/perf-gpu.mjs --json=docs/perf/gpu/truoc.json [--out=thu-muc-anh] [--only=a,b] [--load]
// GPU giả lập (SwiftShader) → ms/khung tuyệt đối chậm hơn máy thật nhiều lần; so sánh tương đối giữa trước/sau.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const OUT = arg('out'), JSONF = arg('json'), ONLY = arg('only'), LOAD = process.argv.includes('--load'), FR = +(arg('frames') || 8);
if (OUT) fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.addInitScript(() => {
  performance.setResourceTimingBufferSize(5000);   // mặc định 250 mục → đếm thiếu file/dung lượng
  // mốc tải theo đồng hồ của trang (waitForFunction của Playwright trễ vài giây khi giả lập mạng chậm): đảo dựng · trường sẵn sàng · màn che mở
  { let v; const T = window.__tl = {}; Object.defineProperty(window, '__island', { configurable: true, get() { return v; }, set(x) { v = x; T.island = performance.now(); } });
    const iv = setInterval(() => { if (!v) return; if (!T.ready && v.school && v.school.ready) T.ready = performance.now(); if (!T.play && v.loading && !v.loading.veil) { T.play = performance.now(); clearInterval(iv); } }, 100); }
  try { localStorage.setItem('island.tut', '1'); localStorage.setItem('island.intro', '1'); localStorage.setItem('academy.nightGate', '1'); } catch (e) {}
  // bộ nhớ GPU: đếm byte cấp cho từng texture/buffer/renderbuffer (ghi đè khi cấp lại, trừ khi xoá)
  const G = window.__gmem = { tex: new Map(), dim: new Map(), buf: new Map(), rb: new Map(), sum() { let t = 0, b = 0, r = 0; for (const v of this.tex.values()) t += v; for (const v of this.buf.values()) b += v; for (const v of this.rb.values()) r += v; return { tex: t, buf: b, rb: r }; } };
  const P = WebGL2RenderingContext.prototype, bound = new WeakMap(), curTex = gl => bound.get(gl) || {};
  const BPP = t => ({ 0x1401: 4, 0x1406: 16, 0x140b: 8, 0x8d61: 8 })[t] || 4;
  const IFMT = f => ({ 0x8058: 4, 0x881a: 8, 0x8814: 16, 0x822e: 4, 0x8230: 8, 0x8229: 1, 0x822b: 2, 0x81a6: 3, 0x88f0: 4, 0x8cac: 4, 0x8c43: 4, 0x8051: 3 })[f] || 4;
  const ob = P.bindTexture; P.bindTexture = function (t, x) { const b = bound.get(this) || {}; b[t] = x; bound.set(this, b); return ob.call(this, t, x); };
  const ad = (gl, target, w, h, d, bpp, lv) => { const x = curTex(gl)[target === 0x8513 || (target >= 0x8515 && target <= 0x851a) ? 0x8513 : target]; if (!x) return; const k = x.__k || (x.__k = {}); k[target + ':' + lv] = w * h * d * bpp; if (lv === 0 || lv === 'st') G.dim.set(x, w + 'x' + h + 'x' + d + 'b' + bpp); let s = 0; for (const q in k) s += k[q]; G.tex.set(x, s); };
  const ti = P.texImage2D; P.texImage2D = function (t, lv, ifmt, a, b, c, d, e, f) { let w, h, ty; if (arguments.length >= 8) { w = a; h = b; ty = e; } else { const src = c; w = src.width || src.videoWidth || 0; h = src.height || src.videoHeight || 0; ty = b; } ad(this, t, w, h, 1, IFMT(ifmt) || BPP(ty), lv); return ti.apply(this, arguments); };
  const ts = P.texStorage2D; P.texStorage2D = function (t, lv, ifmt, w, h) { let s = 0; for (let i = 0; i < lv; i++) s += Math.max(1, w >> i) * Math.max(1, h >> i); ad(this, t, s, 1, t === 0x8513 ? 6 : 1, IFMT(ifmt), 'st'); return ts.apply(this, arguments); };
  const t3 = P.texImage3D; P.texImage3D = function (t, lv, ifmt, w, h, d) { ad(this, t, w, h, d, IFMT(ifmt), lv); return t3.apply(this, arguments); };
  const ct = P.compressedTexImage2D; P.compressedTexImage2D = function (t, lv, f, w, h, b, data) { ad(this, t, (data && data.byteLength) || w * h, 1, 1, 1, lv); return ct.apply(this, arguments); };
  const dt = P.deleteTexture; P.deleteTexture = function (x) { G.tex.delete(x); return dt.call(this, x); };
  const bb = P.bindBuffer, bmap = new WeakMap(); P.bindBuffer = function (t, x) { const b = bmap.get(this) || {}; b[t] = x; bmap.set(this, b); return bb.call(this, t, x); };
  const bd = P.bufferData; P.bufferData = function (t, d) { const x = (bmap.get(this) || {})[t]; if (x) G.buf.set(x, typeof d === 'number' ? d : (d && d.byteLength) || 0); return bd.apply(this, arguments); };
  const db = P.deleteBuffer; P.deleteBuffer = function (x) { G.buf.delete(x); return db.call(this, x); };
  const br = P.bindRenderbuffer; let rbc = null; P.bindRenderbuffer = function (t, x) { rbc = x; return br.call(this, t, x); };
  const rs = P.renderbufferStorage; P.renderbufferStorage = function (t, f, w, h) { if (rbc) G.rb.set(rbc, w * h * IFMT(f)); return rs.apply(this, arguments); };
  const rm = P.renderbufferStorageMultisample; P.renderbufferStorageMultisample = function (t, s, f, w, h) { if (rbc) G.rb.set(rbc, w * h * IFMT(f) * Math.max(1, s)); return rm.apply(this, arguments); };
  const dr = P.deleteRenderbuffer; P.deleteRenderbuffer = function (x) { G.rb.delete(x); return dr.call(this, x); };
});
let cdp;
if (LOAD) { cdp = await page.context().newCDPSession(page); await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true }); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 85, downloadThroughput: 9e6 / 8, uploadThroughput: 0.75e6 / 8 }); }
const t0 = Date.now();
await page.goto(`http://localhost:${arg('port') || 3000}/ocean.html${arg('q') ? '?' + arg('q') : ''}`);
await page.waitForFunction(() => window.__island, null, { timeout: 300000 }); const tFirst = (Date.now() - t0) / 1000;
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 300000 }); const tReady = (Date.now() - t0) / 1000;
await page.waitForFunction(() => !__island.loading.veil, null, { timeout: 120000 }).catch(() => {}); const tPlay = (Date.now() - t0) / 1000;
const bytes = () => page.evaluate(() => { let t = 0, d = 0, n = 0; const by = {}; for (const e of performance.getEntriesByType('resource')) { t += e.transferSize || 0; d += e.decodedBodySize || 0; n++; const k = (e.name.match(/\.(glb|vrm|js|mp3|ogg|wav|png|jpg|webp|json|css|ktx2|html)(\?|$)/) || [, 'khác'])[1]; by[k] = (by[k] || 0) + (e.transferSize || 0); } for (const k in by) by[k] = Math.round(by[k] / 1024); return { files: n, transferKB: Math.round(t / 1024), decodedKB: Math.round(d / 1024), by }; });
const atPlay = await bytes();
const TL = await page.evaluate(() => window.__tl), atPlay2 = await page.evaluate(t => { let b = 0, n = 0; for (const e of performance.getEntriesByType('resource')) if (e.responseEnd <= t) { b += e.transferSize || 0; n++; } return { files: n, transferKB: Math.round(b / 1024) }; }, TL.play || 1e9);
const load = { islandS: +(TL.island / 1000).toFixed(1), readyS: +(TL.ready / 1000).toFixed(1), playableS: +(TL.play / 1000).toFixed(1), atPlay: atPlay2, all: atPlay };
console.log('TẢI', JSON.stringify(load));
if (LOAD) { await page.waitForTimeout(30000); load.after30s = await bytes(); console.log('sau 30 s', JSON.stringify(load.after30s)); if (JSONF) fs.writeFileSync(JSONF, JSON.stringify({ load, errors }, null, 1)); console.log(errors.length ? 'LỖI CONSOLE:\n' + errors.join('\n') : 'Không lỗi console'); await browser.close(); process.exit(0); }

for (let k = 0; k < 20; k++) { const busy = await page.evaluate(() => { const g = document.querySelector('#accBox:not([hidden]) [data-a="guest"]'); if (g) g.click(); const s = document.querySelector('[data-s]'); if (s && s.offsetParent) s.click(); return !!g || document.body.classList.contains('st-cut') || __island.player.frozen; }); if (!busy) break; await page.waitForTimeout(700); }
await page.waitForFunction(() => !__island.player.frozen, null, { timeout: 30000 }).catch(() => {});
await page.evaluate(() => { __island.setQuality(1, true); __island.sky.state.lock = 13; });
await page.waitForTimeout(5000);
cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await page.evaluate(() => {
  const c = __island, R = c.renderer, P = window.__pg = { reset() { Object.assign(this, { n: 0, calls: 0, sh: 0, tris: 0, fr: [] }); } };
  P.reset(); R.info.autoReset = false;
  const so = R.shadowMap.render.bind(R.shadowMap); R.shadowMap.render = (...a) => { const c0 = R.info.render.calls; so(...a); P._sh += R.info.render.calls - c0; };
  const r = c.post.render; c.post.render = function () { R.info.reset(); P._sh = 0; r.call(this); P.n++; P.calls += R.info.render.calls; P.sh += P._sh; P.tris += R.info.render.triangles; };
  let last = performance.now(); (function loop() { const n = performance.now(); P.fr.push(n - last); last = n; requestAnimationFrame(loop); })();
});
const L = await page.evaluate(async () => {
  const l = await import('/js/island/layout.js'), p = await import('/js/island/sample/plaza.js'), A = await import('/js/island/academy/plan.js'), S = await import('/js/island/sea/site.js'), D = await import('/js/island/destiny-plan.js');
  const K = l.EXTRA.find(e => e.id === 'K').r, B = l.BLOCKS.find(b => b.id === 'B'), a = Math.PI * 0.75;
  const vc = v => 127.4 + 1.6 * Math.sin(v / 13);
  return { spawn: l.SPAWN, gate: [l.GATE3[0] + 6, l.GATE3[1]], plaza: [p.PLAZA.x, p.PLAZA.z], school: l.to3(1000, 380), town: B.c, air: [(K[0] + K[2]) / 2, (K[1] + K[3]) / 2],
    beach: [Math.cos(a) * l.ISLAND_R * 0.93, Math.sin(a) * l.ISLAND_R * 0.93], bay: [S.BAY.O[0], S.BAY.O[1]], light: [l.LIGHTHOUSE.c[0], l.LIGHTHOUSE.c[1] + 13],
    yard: A.toWorld(-8, -40), hall: A.toWorld(-72, 0), alley: [-811 + vc(8), -828 + 8], forest: A.toWorld(A.FOREST.u + 21, A.FOREST.v + 21), zen: [l.TEMPLE_C[0] + 21, l.TEMPLE_C[1] + 13], destiny: [D.O[0] + 8, D.O[1] + 8],
    future: [660, -60 + 34], village: [-660 + 34, 140 - 21], pier: A.toWorld(A.DOCK[0], A.DOCK[1]) };
});
const T = (p, y = '') => `p.vehicle = null; p.teleport(${p[0]}, ${p[1]}${y});`;
// [tên, mã chuẩn bị (trong trang), chờ ms trước hướng đầu]
const SPOTS = [
  ['spawn', T(L.spawn), 6000],
  ['cong-truong', T(L.gate), 5000],
  ['quang-truong', T(L.plaza), 5000],
  ['trong-truong', T(L.school), 6000],
  ['thi-tran', T(L.town), 6000],
  ['san-bay', T(L.air), 5000],
  ['bo-bien', T(L.beach), 5000],
  ['lang-chai', T(L.bay), 7000],
  ['hai-dang', T(L.light), 9000],
  ['hv-san', T(L.yard), 14000],
  ['hv-dai-sanh', T(L.hall), 8000],
  ['hv-noi-that', `c.academy.interior.enter('hall')`, 9000],
  ['pho-phep-thuat', `c.academy.interior.inside && c.academy.interior.leave('hall'); ` + T(L.alley), 14000],
  ['rung-phep-thuat', T(L.forest), 14000],
  ['rung-thien', T(L.zen), 7000],
  ['thien-dinh', T(L.destiny), 7000],
  ['vung-tuong-lai', T(L.future), 14000],
  ['vung-lang-co', T(L.village), 14000],
  ['may-bay', T(L.air) + ` c.aircraft.board();`, 16000],
  ['choi-bay', T(L.spawn) + ` c.account.profile && c.account.profile.own && c.account.profile.own.push('broom-tap'); c.brooms.summon();`, 9000],
  ['van-bay', `c.brooms.park && c.brooms.park(); ` + T(L.plaza) + ` c.silverBoard.summon(true);`, 9000],
  ['tren-tau', `c.silverBoard.leave && c.silverBoard.leave(); ` + T(L.pier) + ` c.academy.ferry.start();`, 12000],
].filter(s => !ONLY || ONLY.split(',').includes(s[0]));
const rows = [];
// đóng hội thoại cốt truyện / bảng đang mở (khoá camera, đứng im) trước mỗi lần đo
const calm = () => page.evaluate(() => { for (let i = 0; i < 6; i++) { const b = document.querySelector('[data-s]'); if (!b) break; b.click(); } const c = __island; if (document.body.classList.contains('st-cut')) { document.body.classList.remove('st-cut'); } c.freeCam = false; c.player.frozen = false; });
for (const [name, prep, wait] of SPOTS) {
  await calm();
  const e = await page.evaluate(code => { const c = __island, p = c.player; c.sky.state.lock = 13; try { eval(code); } catch (e) { return e.message; } return ''; }, prep);
  if (e) console.log(name, 'lỗi chuẩn bị:', e);
  await page.waitForTimeout(wait);
  const dirs = [];
  for (let d = 0; d < 4; d++) {
    await calm();
    await page.evaluate(d => { const p = __island.player; p.cam.yaw = d * Math.PI / 2 + 0.3; p.cam.pitch = 0.3; p.cam.dist = 11; p.snapCamera && p.snapCamera(); }, d);
    await page.waitForTimeout(d ? 2500 : 500);
    await page.evaluate(() => __pg.reset());
    if (!(await page.waitForFunction(n => __pg.n >= n, FR, { timeout: 150000 }).then(() => 1, () => 0))) { console.log(name, d, 'không vẽ khung nào (màn che/bảng đang mở?)'); await page.keyboard.press('Escape'); continue; }
    const m = await page.evaluate(() => {
      const c = __island, P = __pg, n = Math.max(1, P.n), g = __gmem.sum(), mi = c.renderer.info.memory, f = P.fr.slice(1).sort((a, b) => a - b);
      return { calls: Math.round(P.calls / n), sh: Math.round(P.sh / n), tris: Math.round(P.tris / n), tex: mi.textures, geo: mi.geometries, gpuMB: +((g.tex + g.buf + g.rb) / 1048576).toFixed(1), texMB: +(g.tex / 1048576).toFixed(1),
        ms: +(f.reduce((a, b) => a + b, 0) / Math.max(1, f.length)).toFixed(0), p95: Math.round(f[Math.floor(f.length * 0.95)] || 0), pos: [c.player.pos.x, c.player.pos.y, c.player.pos.z].map(Math.round) };
    });
    dirs.push(m);
    if (OUT && (d === 0 || process.argv.includes('--alldirs'))) await page.screenshot({ path: `${OUT}/${String(rows.length + 1).padStart(2, '0')}-${name}${d ? '-' + d : ''}.jpg`, quality: 70 });
  }
  if (!dirs.length) continue;
  const mx = k => Math.max(...dirs.map(r => r[k])), av = k => Math.round(dirs.reduce((a, r) => a + r[k], 0) / dirs.length);
  const row = { name, callsMax: mx('calls'), callsAvg: av('calls'), shMax: mx('sh'), trisMaxK: Math.round(mx('tris') / 1000), trisAvgK: Math.round(av('tris') / 1000), tex: mx('tex'), geo: mx('geo'), gpuMB: mx('gpuMB'), texMB: mx('texMB'), ms: av('ms'), p95: mx('p95'), pos: dirs[0].pos, dirs };
  rows.push(row); console.log(name, JSON.stringify({ ...row, dirs: dirs.map(r => r.calls + '/' + Math.round(r.tris / 1000) + 'k') }));
}
console.table(rows.map(r => ({ điểm: r.name, 'call max': r.callsMax, 'call tb': r.callsAvg, bóng: r.shMax, 'k tam giác max': r.trisMaxK, tex: r.tex, geo: r.geo, 'GPU MB': r.gpuMB, 'ms/khung': r.ms, p95: r.p95 })));
if (JSONF) { fs.mkdirSync(JSONF.replace(/[^/]+$/, ''), { recursive: true }); fs.writeFileSync(JSONF, JSON.stringify({ load, rows, errors }, null, 1)); }
console.log(errors.length ? 'LỖI CONSOLE:\n' + [...new Set(errors)].slice(0, 30).join('\n') : 'Không lỗi console');
await browser.close();
