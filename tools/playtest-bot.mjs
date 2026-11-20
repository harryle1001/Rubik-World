// tools/playtest-bot.mjs — BOT CHƠI THỬ hằng ngày Đảo Rubik 3D (Playwright + SwiftShader).
// Chạy: PORT=3400 node server/index.js &  rồi  node tools/playtest-bot.mjs --out=docs/daily-playtest/img/NGAY [--mobile] [--json=kq.json]
// Kịch bản: chơi khách → dịch chuyển tới các điểm layout.js rồi đi bộ thật → M bản đồ → xe đạp, khinh khí cầu → máy bay cất/hạ cánh
// → vào/thoát mọi mini game → nói chuyện 3 NPC → Tàu Pha Lê tới Học viện, xuống tàu, cổng lâu đài, sân, đại sảnh, phố phép thuật, rừng → đổi giờ.
// Ghi: lỗi console/pageerror/HTTP, thời gian tải, draw call & tam giác mỗi điểm, khung > 50 ms, kẹt/rơi, nút chồng (điện thoại).
// FPS máy ảo (SwiftShader) không tin được — chỉ so tương đối giữa các điểm/các ngày.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const MOBILE = process.argv.includes('--mobile'), OUT = arg('out'), JSONF = arg('json'), BASE = arg('url') || 'http://localhost:3400';
if (OUT) fs.mkdirSync(OUT, { recursive: true });
const errors = [], http = [], notes = [], rows = [];
const log = (...a) => console.log(...a);
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(MOBILE ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' } : { viewport: { width: 1280, height: 720 } });
let step = 'tải';
page.on('console', m => { if (m.type() === 'error') errors.push(`[${step}] ${m.text().slice(0, 300)}`); });
page.on('pageerror', e => errors.push(`[${step}] pageerror: ${e.message.slice(0, 300)}`));
page.on('response', r => { if (r.status() >= 400) http.push(`[${step}] ${r.status()} ${r.url().replace(BASE, '')}`); });
page.on('requestfailed', r => { const f = r.failure(); if (f && !/ERR_ABORTED/.test(f.errorText)) http.push(`[${step}] FAIL ${r.url().replace(BASE, '')} ${f.errorText}`); });
const T = ms => page.waitForTimeout(ms);
const ev = (fn, a) => page.evaluate(fn, a).catch(e => { notes.push(`[${step}] evaluate lỗi: ${String(e.message).slice(0, 160)}`); return null; });
let nShot = 0;
const shot = async name => { if (!OUT) return; nShot++; await page.screenshot({ path: `${OUT}/${String(nShot).padStart(2, '0')}-${name}${MOBILE ? '-m' : ''}.png` }).catch(() => {}); };

// ---------- tải + chơi khách ----------
const t0 = Date.now();
await page.goto(BASE + '/ocean.html');
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 600000 });
const loadS = +((Date.now() - t0) / 1000).toFixed(1); log('Tải xong', loadS, 's');
for (let k = 0, calm = 0; k < 50 && calm < 6; k++) {
  await T(700);
  const busy = await ev(() => { const g = document.querySelector('#accBox:not([hidden]) [data-a="guest"]'); if (g) g.click(); const s = document.querySelector('[data-s]'); if (s && s.offsetParent) s.click();
    const n = document.querySelector('#stSay button.nx'); if (n && n.offsetParent) n.click(); for (const b of document.querySelectorAll('button')) if (/^Bỏ qua/.test(b.textContent.trim()) && b.offsetParent) b.click();
    return !!g || document.body.classList.contains('st-cut') || !!__island.freeCam || __island.player.frozen; });
  calm = busy ? 0 : calm + 1;
}
await page.waitForFunction(() => !__island.player.frozen, null, { timeout: 30000 }).catch(() => notes.push('nhân vật vẫn khoá 30 s sau khi chơi khách'));
// Gói Phụ huynh: khách bị khoá học viện/mini game (đúng thiết kế). Ghi lại 1 lần, rồi mở khoá TRONG BOT để kiểm tra nội dung.
const gate = await ev(() => { const pm = __island.premium; if (!pm) return null; const r = { on: pm.on(), mgFree: pm.free().mg.length }; pm.on = () => true; return r; });
log('Gói Phụ huynh (khách):', JSON.stringify(gate));
await ev(() => { const c = __island; c.sky.state.lock = 13; if (c.account && c.account.profile && c.account.profile.own) c.account.profile.own.push('ride-balloon', 'broom-tap'); });
// bọc đo
await ev(() => {
  const c = __island, R = c.renderer, P = window.__pt = { reset() { Object.assign(this, { n: 0, calls: 0, tris: 0, frame: 0, raf: 0, spikes: 0, maxF: 0 }); } };
  P.reset(); R.info.autoReset = false; window.__sim = 0; const pu = c.player.update; c.player.update = function (dt) { __sim += dt; return pu.call(this, dt); };
  const r = c.post.render; c.post.render = function () { R.info.reset(); r.call(this); P.n++; P.calls += R.info.render.calls; P.tris += R.info.render.triangles; };
  let last = performance.now(); (function loop() { const n = performance.now(), d = n - last; last = n; P.frame += d; P.raf++; if (d > 50) P.spikes++; P.maxF = Math.max(P.maxF, d); requestAnimationFrame(loop); })();
});
const measure = () => ev(() => { const c = __island, P = __pt, n = Math.max(1, P.n);
  return { ms: +(P.frame / Math.max(1, P.raf)).toFixed(0), spikes: P.spikes, maxMs: Math.round(P.maxF), calls: Math.round(P.calls / n), tris: Math.round(P.tris / n),
    pos: [c.player.pos.x, c.player.pos.y, c.player.pos.z].map(v => Math.round(v)) }; });
const reset = () => ev(() => __pt.reset());
// đi bộ thật vài giây (phím W / joystick), có thử đổi hướng nếu kẹt
async function walk(sec = 3) {
  const p0 = await ev(() => { __sim = 0; return __island.player.pos.toArray(); });
  if (MOBILE) {
    await ev(() => { const cv = __island.renderer.domElement, mk = (t, x, y) => cv.dispatchEvent(new PointerEvent(t, { pointerId: 7, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, isPrimary: true }));
      mk('pointerdown', 110, 700); window.__jm = () => mk('pointermove', 110, 640); window.__ju = () => mk('pointerup', 110, 640); __jm(); });
    for (let i = 0; i < sec * 4; i++) { await ev(() => __jm()); await T(250); }
    await ev(() => __ju());
  } else { await page.keyboard.down('KeyW'); await T(sec * 1000); await page.keyboard.up('KeyW'); }
  const p1 = await ev(() => [...__island.player.pos.toArray(), __sim, __island.player.frozen, !!__island.player.vehicle]);
  return p0 && p1 ? { moved: +Math.hypot(p1[0] - p0[0], p1[2] - p0[2]).toFixed(1), sim: +p1[3].toFixed(2), dy: +(p1[1] - p0[1]).toFixed(1), y: +p1[1].toFixed(1), frozen: p1[4], veh: p1[5] } : null;
}
async function spot(name, prep, { wait = 3500, walkS = 3, snap = false } = {}) {
  step = name;
  await ev(() => { const b = document.getElementById('pmBox'); if (b && !b.hidden) { b.hidden = true; __island.player.frozen = false; window.__pmHit = (window.__pmHit || 0) + 1; } });
  const pre = await ev(code => { const c = __island, p = c.player, cam = y => { p.cam.yaw = y; p.cam.pitch = 0.3; p.cam.dist = 11; p.snapCamera && p.snapCamera(); };
    try { (0, eval)('(c,p,cam)=>{' + code + '}')(c, p, cam); } catch (e) { return 'lỗi: ' + e.message; } return 'ok'; }, prep);
  await T(wait); await reset();
  const w = walkS ? await walk(walkS) : null;
  if (!walkS) await T(2500);
  const m = await measure();
  const row = { name, ...m, ...(w || {}), prep: pre };
  if (w && w.moved < Math.max(0.4, 5.5 * w.sim * 0.25)) row.stuck = true;
  if (m && m.pos[1] < -4 && !/Lặn|biển/.test(name)) row.fell = true;
  rows.push(row); log(name, JSON.stringify(row));
  if (snap) await shot(name.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase());
  return row;
}

// ---------- 1. Các điểm layout.js ----------
const L = await ev(async () => {
  const l = await import('/js/island/layout.js'); let plaza = null; try { const p = await import('/js/island/sample/plaza.js'); plaza = [p.PLAZA.x, p.PLAZA.z]; } catch (e) {}
  const out = { spawn: l.SPAWN, plaza, school: l.to3(1000, 380), temple: l.TEMPLE_C, light: l.LIGHTHOUSE.c, acad: l.ACADEMY.c, blocks: {}, extra: {} };
  for (const b of l.BLOCKS) out.blocks[b.id + ' ' + b.name] = b.c;
  for (const e of l.EXTRA) if (!e.sea) out.extra[e.id + ' ' + e.name] = [(e.r[0] + e.r[2]) / 2, (e.r[1] + e.r[3]) / 2];
  return out;
});
const pts = [['Cổng trường (spawn)', L.spawn, true], ...(L.plaza ? [['Quảng trường', L.plaza]] : []), ['Sân trường', L.school],
  ...Object.entries(L.blocks).filter(([k]) => !k.startsWith('A')).map(([k, c]) => [k, c, k.startsWith('B')]), ...Object.entries(L.extra).map(([k, c]) => [k, c, k.startsWith('F')]), ['Đền Tri Thức', L.temple]];
for (const [name, c, snap] of pts) {
  // chỗ trống: thử tâm rồi lệch dần theo vòng xoắn, chọn điểm không nằm trong hộp va chạm (ctx.boxes) nếu có
  await spot(name, `const [x0,z0]=[${c[0]},${c[1]}]; let best=[x0,z0]; const B=c.boxes||[]; const inBox=(x,z)=>B.some(b=>b&&b.x0!=null&&x>b.x0-1&&x<b.x1+1&&z>b.z0-1&&z<b.z1+1);
    for(let i=0;i<21;i++){const a=i*2.4,r=i*1.6,x=x0+Math.cos(a)*r,z=z0+Math.sin(a)*r; if(!inBox(x,z)){best=[x,z];break;}} p.vehicle=null; p.teleport(best[0],best[1]); cam(Math.random()*6.28)`, { snap });
}
// ---------- 2. Bản đồ M ----------
step = 'bản đồ M'; await ev(sp => { window.__sp = sp; __island.player.vehicle = null; __island.player.teleport(...sp); }, L.spawn); await T(1500);
await page.keyboard.press('KeyM'); await T(2500);
const mapOpen = await ev(() => !!(__island.worldMap && (__island.worldMap.open || __island.worldMap.isOpen)) || !![...document.querySelectorAll('[id*=map i],[class*=map i]')].find(e => e.offsetParent && e.getBoundingClientRect().width > 200));
log('Bản đồ mở:', mapOpen); await shot('ban-do'); await page.keyboard.press('KeyM'); await T(800); await page.keyboard.press('Escape').catch(() => {}); await T(500);
if (!mapOpen) notes.push('Phím M: không thấy bản đồ mở');
// ---------- 3. Xe đạp, khinh khí cầu ----------
await spot('Xe đạp', `p.vehicle=null; p.teleport(${L.spawn}); cam(-Math.PI/2+0.75); setTimeout(()=>c.vehicles.toggleBike(),1200)`, { wait: 4000 });
rows.at(-1).bike = await ev(() => !!(__island.player.vehicle && __island.vehicles.riding));
await ev(() => __island.vehicles.riding && __island.vehicles.toggleBike()); await T(1500);
await spot('Khinh khí cầu', `c.vehicles.toggleBalloon()`, { wait: 8000, walkS: 3, snap: true });
rows.at(-1).balloon = await ev(() => !!(__island.vehicles.riding && __island.player.vehicle));
await ev(() => __island.vehicles.riding && __island.vehicles.toggleBalloon()); await T(6000);
// ---------- 4. Máy bay ----------
const air = L.extra[Object.keys(L.extra).find(k => k.startsWith('K'))];
await spot('Máy bay cất cánh', `p.vehicle=null; p.teleport(${air}); setTimeout(()=>c.aircraft.board(),800)`, { wait: 14000, walkS: 0, snap: true });
rows.at(-1).plane = await ev(() => ({ flying: __island.aircraft.flying, phase: __island.aircraft.phase, y: Math.round(__island.player.pos.y) }));
step = 'máy bay hạ cánh';
// lái như người chơi: vòng ra xa rồi canh thẳng đường băng Cánh Diều (chạy theo trục x, cất cánh hướng −x), tới gần mới bấm hạ cánh
// (máy bay chỉ đáp ở chỗ phẳng là đúng thiết kế — aircraft.js)
const K = await ev(async () => (await import('/js/island/layout.js')).EXTRA.find(e => e.id === 'K').r);
let landed = null; const tL = Date.now();
for (let i = 0; i < 150; i++) {
  landed = await ev(K => { const c = __island, a = c.aircraft, P = c.player.pos, z = K[3] - 13, x1 = K[2] - 6, x0 = K[0] + 6;
    if (!a.flying) return { flying: false, phase: a.phase, y: Math.round(P.y) };
    const s = window.__ls = window.__ls || { st: 0 };
    const tgt = s.st === 0 ? [x1 + 160, z] : [x0, z];   // 0: ra điểm cách đầu đường băng 160 m về phía đông · 1: bay vào dọc đường băng
    if (s.st === 0 && Math.hypot(tgt[0] - P.x, tgt[1] - P.z) < 25) s.st = 1;
    const want = Math.atan2(tgt[0] - P.x, tgt[1] - P.z); let dy = want - a.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); a.yaw += dy * 0.4;
    if (s.st === 1 && P.x < x1 + 60 && a.phase === 'fly') a.land();
    return { flying: true, phase: a.phase, st: s.st, y: Math.round(P.y), x: Math.round(P.x), z: Math.round(P.z) }; }, K);
  if (landed && !landed.flying) break; await T(1000);
}
if (landed) landed.secs = Math.round((Date.now() - tL) / 1000);
log('Hạ cánh:', JSON.stringify(landed)); rows.push({ name: 'Máy bay hạ cánh', ...landed });
if (landed && landed.flying) { notes.push(`Máy bay không đáp được sau ${landed.secs} s (${JSON.stringify(landed)})`); await ev(() => __island.aircraft.eject()); await T(3000); }
rows.at(-1).afterPlane = await ev(() => ({ flying: __island.aircraft.flying, veh: !!__island.player.vehicle }));
// ---------- 5. Mini game ----------
const mg = [];
const keys = await ev(() => { const G = __island.miniGames || {}, seen = new Set(), out = []; for (const [k, g] of Object.entries(G)) { if (seen.has(g)) continue; seen.add(g); out.push(k); } return out; }) || [];
await ev(() => { __island.player.vehicle = null; __island.player.teleport(...window.__sp); });
for (const k of keys) {
  step = 'mini game ' + k; const e0 = errors.length;
  const ok = await ev(k => { const q = __island.mg.doorOf ? __island.mg.doorOf(k) : null; return !!__island.mg.start(k, q); }, k);
  await T(900); await ev(() => __island.mg.skipFly && __island.mg.skipFly()); await reset(); await T(2200);
  const m = await measure(); const act = await ev(() => !!__island.mg.active);
  if (mg.length === 0 || mg.length % 8 === 0) await shot('mg-' + k);
  await ev(() => __island.mg.exit(true)); await T(700);
  const left = await ev(() => ({ active: !!__island.mg.active, frozen: __island.player.frozen }));
  mg.push({ k, ok, act, calls: m && m.calls, ms: m && m.ms, exit: left && !left.active && !left.frozen, err: errors.length - e0 });
}
log('Mini game:', mg.length, 'lỗi mở:', mg.filter(r => !r.ok).map(r => r.k).join(','), 'kẹt thoát:', mg.filter(r => !r.exit).map(r => r.k).join(','));
await ev(() => { if (__island.player.frozen && __island.mg && __island.mg.active) __island.mg.exit(true); });
// ---------- 6. NPC ----------
const talks = [];
await ev(() => { __island.player.vehicle = null; __island.player.teleport(...window.__sp); }); await T(6000);
for (let i = 0; i < 3; i++) {
  step = 'NPC ' + (i + 1);
  const r = await ev(async i => { const c = __island, P = c.townPeople || []; const me = c.player.pos, list = P.filter(e => e.a && e.px != null && !e.seat).sort((a, b) => Math.hypot(a.px - me.x, a.pz - me.z) - Math.hypot(b.px - me.x, b.pz - me.z)); const e = list[i];
    if (!e) return { err: 'không có NPC trong pool' }; c.player.vehicle = null; c.player.teleport(e.px + 1.6, e.pz + 0.4); return { at: [Math.round(e.px), Math.round(e.pz)] }; }, i);
  await T(2500);
  const lab = await ev(() => { const b = document.getElementById('bAct'); return b && !b.hidden ? b.textContent.trim() : null; });
  await page.keyboard.press('KeyE'); await T(2500);
  const open = await ev(() => __island.teacherQuiz && __island.teacherQuiz.open());
  if (i === 0) await shot('npc');
  await ev(() => __island.teacherQuiz && __island.teacherQuiz.close()); await T(500);
  talks.push({ ...r, label: lab, open }); log('NPC', i + 1, JSON.stringify(talks.at(-1)));
}
// ---------- 7. Tàu Pha Lê → Học viện ----------
step = 'Tàu Pha Lê';
const tr = {};
await ev(() => { const t = __island.train; __island.player.vehicle = null; t.ride.relocate('A'); });
await T(1500);
tr.board = await ev(() => { __island.train.ride.board(); return true; }); await T(3000);
tr.aboard = await ev(() => __island.train.ride.state.aboard);
if (!tr.aboard) { // tới gần sân ga A rồi lên lại
  await ev(() => { const r = __island.train.ride; const c = __island.train.consist.cars[2]; if (c && c.group) __island.player.teleport(c.group.position.x + 3, c.group.position.z); r.board(); }); await T(3000);
  tr.aboard = await ev(() => __island.train.ride.state.aboard);
}
await shot('tau-len'); await reset();
await ev(() => __island.train.ride.depart()); await T(5000);
tr.run = await measure(); await shot('tau-chay');
await ev(() => __island.train.ride.seek(142)); await T(9000);
tr.after = await ev(() => ({ at: __island.train.ride.state.at, aboard: __island.train.ride.state.aboard, phase: __island.train.ride.state.phase, zone: __island.zoneAt ? __island.zoneAt(__island.player.pos.x, __island.player.pos.z) : null, pos: __island.player.pos.toArray().map(Math.round) }));
if (tr.after && tr.after.aboard) { await ev(() => __island.train.ride.alight()); await T(3000); tr.after2 = await ev(() => ({ aboard: __island.train.ride.state.aboard, pos: __island.player.pos.toArray().map(Math.round) })); }
log('Tàu:', JSON.stringify(tr));
await spot('Ga Học viện (xuống tàu, đi bộ)', ``, { wait: 500, snap: false });
// ---------- 8. Học viện: cổng, sân, đại sảnh, phố, rừng, nhà ----------
const A = await ev(async () => { const g = await import('/js/island/academy/plan.js'); const W = g.toWorld; const L = g.CASTLE_L, V = g.VILLAGE, F = g.FOREST;
  return { gate: W(g.CASTLE.u1 + 8, 0), yard: W(-20, 0), hall: W((L.hall.u0 + L.hall.u1) / 2, 0), alley: V ? W((V.u0 + V.u1) / 2, V.v0 + 6) : null, forest: W(F.gate[0], F.gate[1] - 13), forestIn: W(F.u + 40, F.v), dock: W(g.DOCK[0], g.DOCK[1]) }; });
log('Học viện:', JSON.stringify(A));
if (A) {
  for (const [n, k, snap] of [['Học viện · cổng lâu đài', 'gate', true], ['Học viện · sân trong', 'yard', false], ['Học viện · đại sảnh', 'hall', true], ['Học viện · phố phép thuật', 'alley', true], ['Học viện · cửa rừng', 'forest', false], ['Học viện · trong rừng', 'forestIn', true]]) {
    if (!A[k]) continue; await spot(n, `p.vehicle=null; p.teleport(${A[k]}); cam(${k === 'gate' ? 'Math.PI' : '0'})`, { wait: 5000, snap });
  }
  const houses = await ev(() => { const h = __island.academyHouses || __island.houses; return h ? Object.keys(h).slice(0, 8) : null; });
  if (houses) log('nhà Tứ Linh API:', houses.join(','));
}
// ---------- 9. Đổi giờ ☀️ ----------
step = 'đổi giờ';
await ev(() => { const c = __island; c.sky.state.lock = null; c.player.vehicle = null; c.player.teleport(...window.__sp); });
const sun = await ev(() => { const b = [...document.querySelectorAll('button')].find(b => /☀️|🌙|🕐|⏰/.test(b.textContent) && b.offsetParent); if (b) { b.click(); return b.textContent.trim().slice(0, 20); } return null; });
await T(1500); const sunPanel = await ev(() => [...document.querySelectorAll('button')].filter(b => b.offsetParent && /đêm|tối|Đêm|🌙/.test(b.textContent)).map(b => b.textContent.trim().slice(0, 16)));
const night = await ev(() => { const b = [...document.querySelectorAll('button')].find(b => b.offsetParent && /đêm|Đêm|🌙/.test(b.textContent)); if (b) { b.click(); return true; } __island.sky.state.lock = 22; return false; });
await T(5000); await reset(); await T(2500); const nm = await measure(); rows.push({ name: 'Ban đêm (đổi giờ)', ...nm, sunBtn: sun, clickedNight: night }); await shot('dem');
await ev(() => { __island.sky.state.lock = 13; });

// ---------- 10. Nút chồng nhau (điện thoại) ----------
step = 'nút chồng';
await ev(() => { const c = __island; c.player.vehicle = null; }); await T(1500);
const overlaps = await ev(() => {
  const els = [...document.querySelectorAll('button, .btn, [role=button]')].filter(e => { if (!e.offsetParent) return false; const s = getComputedStyle(e); if (s.visibility === 'hidden' || +s.opacity < 0.1 || s.pointerEvents === 'none') return false; const r = e.getBoundingClientRect(); return r.width > 8 && r.height > 8 && r.bottom > 0 && r.top < innerHeight; });
  const out = []; for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { const a = els[i], b = els[j]; if (a.contains(b) || b.contains(a)) continue;
    const r = a.getBoundingClientRect(), q = b.getBoundingClientRect(), w = Math.min(r.right, q.right) - Math.max(r.left, q.left), h = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top);
    if (w > 6 && h > 6 && w * h > 0.2 * Math.min(r.width * r.height, q.width * q.height)) out.push(`${(a.id || a.textContent.trim().slice(0, 12))} ⟂ ${(b.id || b.textContent.trim().slice(0, 12))}`); }
  const off = els.filter(e => { const r = e.getBoundingClientRect(); return r.left < -2 || r.right > innerWidth + 2; }).map(e => e.id || e.textContent.trim().slice(0, 12));
  return { n: els.length, overlaps: out.slice(0, 20), offscreen: off };
});
await shot('hud');
log('Nút:', JSON.stringify(overlaps));

// ---------- tổng kết ----------
const res = { mobile: MOBILE, loadS, gate, rows, mg, talks, train: tr, overlaps, errors: [...new Set(errors)], http: [...new Set(http)], notes };
console.table(rows.map(r => ({ điểm: r.name, ms: r.ms, giật: r.spikes, maxMs: r.maxMs, call: r.calls, 'tam giác': r.tris, đi: r.moved, kẹt: r.stuck ? 'KẸT' : '', rơi: r.fell ? 'RƠI' : '' })));
if (JSONF) fs.writeFileSync(JSONF, JSON.stringify(res, null, 1));
log('LỖI CONSOLE:', res.errors.length, '\n' + res.errors.slice(0, 30).join('\n'));
log('HTTP:', res.http.length, '\n' + res.http.slice(0, 20).join('\n'));
log('Ghi chú:', notes.join(' | '));
await browser.close();
