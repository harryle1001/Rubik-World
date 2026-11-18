// tools/perf-actors.mjs — Đo hiệu năng NHÂN VẬT ở chế độ điện thoại (390×844, DPR 2, UA iPhone → CFG.isMobile), mức chất lượng 1.
// Chạy: node server/index.js &  rồi  node tools/perf-actors.mjs [--out=docs/perf/actors/buoc] [--n=89] [--only=dam-dong-co-dinh,rung-thu]
// 5 điểm: quảng trường · sân trường giờ ra chơi (đặt đồng hồ trường 9h05 thứ Ba) · rừng đền có thú · biển (rạn san hô)
// · thú cố định (14 con trước camera, không bỏ chạy) · đám đông cố định (dừng mô phỏng, 21 người xếp trước camera, cách 3 → 34 m: so sánh trước/sau chính xác, không phụ thuộc người đi lại).
// Mỗi điểm (trung bình n khung): draw call, tam giác, số SkinnedMesh được vẽ (lượt chính), số mixer.update, ms JS/khung của
// các phần nhân vật (player · net · animals · school(people) · ambience(yard) · sealife) và riêng AnimationMixer.update.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const URL = arg('url') || 'http://localhost:3000/ocean.html', OUT = arg('out'), N = +(arg('n') || 89);
if (OUT) fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.goto(URL);
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 300000 });
const fr = page.frames().find(f => f.url().includes('/school/'));
if (fr) { const b = fr.getByText('Chỉ xem, chưa chơi'); if (await b.count().catch(() => 0)) await b.first().click({ force: true, timeout: 5000 }).catch(() => {}); }
await page.waitForFunction(() => !__island.player.frozen, null, { timeout: 30000 }).catch(() => {});
await page.evaluate(async () => {
  const c = __island, THREE = await import('three'); c.setQuality(1, true); c.sky.state.lock = 13; c.renderer.info.autoReset = false;
  const P = window.__pm = { n: 0, calls: 0, tris: 0, ms: 0, sk: 0, skSh: 0, mix: 0, mixMs: 0, js: {} };
  let inMain = false;
  const sk = THREE.SkinnedMesh.prototype; sk.onBeforeRender = function () { if (inMain) P.sk++; }; sk.onBeforeShadow = function () { P.skSh++; };
  const mu = THREE.AnimationMixer.prototype.update; THREE.AnimationMixer.prototype.update = function (dt) { const s = performance.now(); const r = mu.call(this, dt); P.mixMs += performance.now() - s; P.mix++; return r; };
  const wrap = (name, o) => { if (!o || !o.update) return; const f = o.update; o.update = function (...a) { const s = performance.now(); const r = f.apply(this, a); P.js[name] = (P.js[name] || 0) + performance.now() - s; return r; }; };
  wrap('player', c.player); wrap('net', c.net); wrap('animals', c.animals); wrap('school', c.school); wrap('ambience', c.ambience); wrap('sealife', c.sealife);
  const r = c.post.render; c.post.render = function () { c.renderer.info.reset(); inMain = false; const s = performance.now(); const oldR = c.renderer.render; c.renderer.render = function (sc, cam) { inMain = sc === c.scene; const x = oldR.call(this, sc, cam); inMain = false; return x; }; r.call(this); c.renderer.render = oldR; P.ms += performance.now() - s; P.n++; P.calls += c.renderer.info.render.calls; P.tris += c.renderer.info.render.triangles; };
});
// đồng hồ trường: thứ Ba (dow 1) 9h05 = giờ ra chơi (540–570)
const setClock = async m => { if (fr) await fr.evaluate(m => { day = 2; clock = m; }, m).catch(e => errors.push('clock: ' + e.message)); };
const L = await page.evaluate(async () => {
  const l = await import('/js/island/layout.js'), p = await import('/js/island/sample/plaza.js'), s = await import('/js/island/sealife.js');
  const R = __island.school.RS.R, y = R.rubikyard || R.yard, yard = l.to3(y.x + y.w / 2, y.y + y.h / 2), f = R.field || y, field = l.to3(f.x + f.w / 2, f.y + f.h / 2), reef = s.ZONES.find(z => z.id === 'reef') || s.ZONES[0];
  return { plaza: [p.PLAZA.x, p.PLAZA.z], yard, field, temple: l.TEMPLE_C, reef: [reef.x, reef.z] };
});
const spots = [
  ['quang-truong', L.plaza, Math.PI / 2, 0.3, 11, 600],
  ['san-truong-ra-choi', L.yard, 0.6, 0.35, 11, 545],
  ['rung-thu', [L.temple[0] + 20, L.temple[1] + 20], 2.4, 0.3, 11, 600],
  ['bien-ran-san-ho', L.reef, 0, 0.2, 6, 600, true],
  ['thu-co-dinh', [L.temple[0] + 20, L.temple[1] + 20], 2.4, 0.3, 11, 600, false, 'animals'],   // 14 thú xếp trước camera 3 → 30 m
  ['dam-dong-co-dinh', L.field, 0.6, 0.35, 11, 545, false, true],   // sân bóng: bãi trống
];
const ONLY = arg('only'), rows = [];
for (const [name, [x, z], yaw, pitch, dist, clk, dive, fixed] of spots) {
  if (ONLY && !ONLY.split(',').includes(name)) continue;
  await setClock(clk);
  if (fixed === 'animals') {
    await page.waitForFunction(() => __island.animals.list.length >= 14, null, { timeout: 120000 });
    await page.evaluate(([x, z, yaw]) => { const c = __island, p = c.player, fx = -Math.sin(yaw), fz = -Math.cos(yaw); p.teleport(x, z);
      c.animals.list.forEach((A, i) => { const r = 3 + i * 27 / 13, s = (i % 2 ? 1 : -1) * r * 0.382 * ((i * 0.618) % 1); A.root.position.set(x + fx * r - fz * s, 0, z + fz * r + fx * s); A.target = null; A.wait = 99; A.S = Object.assign({}, A.S, { shy: 0 }); }); }, [x, z, yaw]);
  } else if (fixed) {   // đám đông cố định: dừng mô phỏng trường, 21 người (theo id) đứng trong hình nêm trước camera, cách 3 → 34 m
    const pts = await page.evaluate(async ([x, z, yaw]) => { const l = await import('/js/island/layout.js'), out = [], fx = -Math.sin(yaw), fz = -Math.cos(yaw);
      for (let i = 0; i < 21; i++) { const r = 3 + i * 31 / 20, s = (i % 2 ? 1 : -1) * r * 0.382 * ((i * 0.618) % 1); out.push(l.to2(x + fx * r - fz * s, z + fz * r + fx * s)); } return out; }, [x, z, yaw]);
    await fr.evaluate(pts => { paused = true; const A = RS.agents.slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));
      for (const a of RS.agents) if (!A.slice(0, 21).includes(a)) a.y = -1e4;   // người khác ra khỏi bản đồ 3D
      A.slice(0, 21).forEach((a, i) => { if (!pts[i]) return; a.x = pts[i][0]; a.y = pts[i][1]; a.moving = false; a.visible = true; a.inSub = false; a.cycling = a.boat = false; }); for (const n of RS.npcs) n.y = -1e4; }, pts);
  }
  await page.evaluate(([x, z, yaw, pitch, dist, dive]) => { const p = __island.player; p.teleport(x, z); if (dive) p.pos.y = -4; p.cam.yaw = yaw; p.cam.pitch = pitch; p.cam.dist = dist; p.snapCamera(); }, [x, z, yaw, pitch, dist, !!dive]);
  await page.waitForTimeout(name.startsWith('san') ? 9000 : 5000);   // chờ người kéo ra sân / chunk / LOD
  // nhìn vào đám đông: người chơi đứng cách tâm nhóm (người trong pool / thú gần nhất) 8 m, camera hướng vào tâm
  await page.evaluate(kind => { const c = __island, p = c.player; let pts = [];
    if (kind === 'people') pts = (c.townPeople || []).filter(e => e.a).map(e => [e.px, e.pz]);
    if (kind === 'animals') { const a = c.animals.list.map(A => [A.root.position.x, A.root.position.z, Math.hypot(A.root.position.x - p.pos.x, A.root.position.z - p.pos.z)]).sort((a, b) => a[2] - b[2]).slice(0, 3); pts = a; }
    if (!pts.length) return; const cx = pts.reduce((s, q) => s + q[0], 0) / pts.length, cz = pts.reduce((s, q) => s + q[1], 0) / pts.length;
    p.teleport(cx + 8 * Math.SQRT1_2, cz + 8 * Math.SQRT1_2); p.cam.yaw = Math.atan2(-(cx - p.pos.x), -(cz - p.pos.z)); p.snapCamera(); }, name === 'rung-thu' ? 'animals' : name.startsWith('bien') || fixed ? '' : 'people');
  await page.waitForTimeout(2500);
  await page.evaluate(() => Object.assign(__pm, { n: 0, calls: 0, tris: 0, ms: 0, sk: 0, skSh: 0, mix: 0, mixMs: 0, js: {} }));
  await page.waitForFunction(n => __pm.n >= n, N, { timeout: 300000 });
  const m = await page.evaluate(() => { const P = __pm, n = P.n, js = {}; let tot = 0; for (const k in P.js) { js[k] = +(P.js[k] / n).toFixed(2); tot += P.js[k] / n; } const tp = __island.townPeople || [];
    return { calls: Math.round(P.calls / n), tris: Math.round(P.tris / n), skinDraw: +(P.sk / n).toFixed(1), skinShadow: +(P.skSh / n).toFixed(1), mixPerF: +(P.mix / n).toFixed(1), mixMs: +(P.mixMs / n).toFixed(2), actorJs: +tot.toFixed(2), ...js, people: tp.filter(e => e.a).length, full: tp.filter(e => e.a && e.hero.model.visible).length, peopleMs: +(__island.perfPeople ? __island.perfPeople() : 0).toFixed(2), renderMs: +(P.ms / n).toFixed(1) }; });
  if (arg('prof') === name) {   // --prof=<điểm>: đo CPU 8 s, in 21 hàm tốn nhất (self time) của client/js
    const cdp = await page.context().newCDPSession(page); await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
    await page.waitForTimeout(8000); const { profile } = await cdp.send('Profiler.stop'); const self = new Map(), dt = profile.timeDeltas, tot = dt.reduce((a, b) => a + b, 0), byId = new Map(profile.nodes.map(n => [n.id, n]));
    profile.samples.forEach((id, i) => { const f = byId.get(id).callFrame, k = `${f.functionName || '(anon)'} ${f.url.split('/').slice(-2).join('/')}:${f.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + (dt[i] || 0)); });
    console.log([...self].sort((a, b) => b[1] - a[1]).slice(0, 21).map(([k, v]) => `${(v / tot * 100).toFixed(1).padStart(5)}%  ${k}`).join('\n'));
  }
  if (OUT) await page.screenshot({ path: `${OUT}/${name}.png` });
  rows.push({ name, ...m });
}
console.table(rows);
if (OUT) fs.writeFileSync(`${OUT}/so-do.json`, JSON.stringify(rows, null, 1));
console.log(errors.length ? 'LỖI CONSOLE:\n' + errors.slice(0, 13).join('\n') : 'Không lỗi console');
await browser.close();
