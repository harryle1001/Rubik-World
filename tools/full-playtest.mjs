// tools/full-playtest.mjs — CHƠI THỬ TOÀN BỘ Đảo Rubik 3D như một học sinh (Playwright + SwiftShader).
// Điều khiển THẬT: phím (máy tính) / chạm CDP + joystick (điện thoại); chỉ dịch chuyển tới chỗ TRỐNG ngoài trời (không vào trong vật thể).
// Chạy: PORT=3400 node server/index.js &   rồi
//   node tools/full-playtest.mjs [--size=desk|port|land] [--out=docs/full-playtest/shots] [--json=kq.json] [--only=walk,npc] [--skip=plane] [--url=http://localhost:3400]
// Mỗi bước ghi PASS/FAIL + lỗi console trong bước + ảnh khi FAIL. Theo dõi suốt buổi: rơi biển khi đi bộ, đứng trong vật thể (collide), bước nhảy > 8 m
// không do dịch chuyển, NaN, nhân vật bị khoá sau bước, bảng che màn hình còn mở.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const SIZE = arg('size') || (process.argv.includes('--mobile') ? 'port' : 'desk');
const VIEW = { desk: [1280, 720], port: [390, 844], land: [844, 390] }[SIZE];
const TOUCH = SIZE !== 'desk', OUT = arg('out') || '', JSONF = arg('json'), BASE = arg('url') || 'http://localhost:3400';
const ONLY = arg('only') ? arg('only').split(',') : null, SKIP = (arg('skip') || '').split(',').filter(Boolean);
if (OUT) fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctxB = await browser.newContext(TOUCH ? { viewport: { width: VIEW[0], height: VIEW[1] }, isMobile: true, hasTouch: true, deviceScaleFactor: 1,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' } : { viewport: { width: VIEW[0], height: VIEW[1] } });
let page = await ctxB.newPage();
let step = 'tải', errs = [];
const hook = pg => {
  pg.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_INTERNET|net::ERR_ABORTED/.test(m.text())) errs.push(`[${step}] ${m.text().slice(0, 240)}`); });
  pg.on('pageerror', e => errs.push(`[${step}] pageerror: ${e.message.slice(0, 240)}`));
  pg.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) errs.push(`[${step}] HTTP ${r.status()} ${r.url().replace(BASE, '')}`); });
};
hook(page);
const T = ms => page.waitForTimeout(ms);
const ev = (fn, a) => page.evaluate(fn, a);
let cdp = TOUCH ? await ctxB.newCDPSession(page) : null;
const results = [];
const log = (...a) => console.log(...a);
const tag = `${SIZE}`;
async function shot(name) { if (!OUT) return null; const f = `${OUT}/${tag}-${name.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase().slice(0, 40)}.png`; await page.screenshot({ path: f }).catch(() => {}); return f; }

// ---------- công cụ điều khiển như người chơi ----------
const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
async function rectOf(sel) { return ev(s => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: 'center' }); for (let a = e; a; a = a.parentElement) { const c = getComputedStyle(a); if (c.display === 'none' || c.visibility === 'hidden') return null; } const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return null; return [r.x + r.width / 2, r.y + r.height / 2, r.width, r.height]; }, sel); }
// chạm/bấm 1 nút THẬT (toạ độ màn hình) — kiểm tra nút có bị phần tử khác che không
async function tap(sel, { must = true } = {}) {
  const r = await rectOf(sel);
  if (!r) { if (must) throw new Error(`không thấy nút ${sel}`); return false; }
  const top = await ev(([x, y, s]) => { const e = document.elementFromPoint(x, y), t = document.querySelector(s); return !e ? 'không có' : (t === e || t.contains(e) || e.contains(t)) ? null : (e.id || e.className || e.tagName) + ''; }, [r[0], r[1], sel]);
  if (top) { if (must) throw new Error(`nút ${sel} bị che bởi ${String(top).slice(0, 40)}`); return false; }
  if (TOUCH) { await touch('touchStart', [{ x: r[0], y: r[1], id: 9 }]); await T(60); await touch('touchEnd', []); }
  else await page.mouse.click(r[0], r[1]);
  return true;
}
// bấm nút theo chữ (trong vùng chứa sel)
async function tapText(re, within = 'body', o) {
  const id = await ev(([src, w]) => { const R = new RegExp(src), root = document.querySelector(w) || document.body; const b = [...root.querySelectorAll('button,[role=button],.btn,a')].find(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && R.test(e.textContent.trim()));
    if (!b) return null; if (!b.id) b.id = '__pt' + Math.random().toString(36).slice(2, 8); return '#' + b.id; }, [re.source, within]);
  if (!id) { if (!o || o.must !== false) throw new Error(`không thấy nút /${re.source}/`); return false; }
  return tap(id, o);
}
const key = async (k, ms = 80) => { await page.keyboard.down(k); await T(ms); await page.keyboard.up(k); };
// hướng camera → joystick: tiến = (−sin yaw, −cos yaw)
const P = () => ev(() => { const p = __island.player; return { x: p.pos.x, y: p.pos.y, z: p.pos.z, yaw: p.cam.yaw, veh: !!p.vehicle, frozen: p.frozen }; });
let joyOn = false;
async function joyTo(dx, dy) {   // giữ joystick, đặt núm lệch (dx,dy) px so với tâm
  const [jx, jy] = [VIEW[0] * 0.2, VIEW[1] * 0.78];
  if (!joyOn) { await touch('touchStart', [{ x: jx, y: jy, id: 1 }]); joyOn = true; }
  await touch('touchMove', [{ x: jx + dx, y: jy + dy, id: 1 }]);
}
async function joyUp() { if (joyOn) { await touch('touchEnd', []); joyOn = false; } }
// đi bộ tới (tx,tz) như người chơi: máy tính giữ W + xoay camera về hướng đích; điện thoại kéo joystick theo hướng đích (giữ nguyên camera)
async function walkTo(tx, tz, { sec = 30, run = false, near = 2.5, label = '' } = {}) {
  const t0 = Date.now(); let p = await P(), best = Infinity, lastBest = Date.now(), stuck = false, detours = 0, detourUntil = 0, side = 1;
  if (!TOUCH) { await page.keyboard.down('KeyW'); if (run) await page.keyboard.down('ShiftLeft'); }
  try {
    while (Date.now() - t0 < sec * 1000) {
      p = await P(); let dx = tx - p.x, dz = tz - p.z; const d = Math.hypot(dx, dz);
      if (d < near) break;
      if (d < best - 0.5) { best = d; lastBest = Date.now(); detourUntil = 0; } else if (Date.now() - lastBest > 2500 && !detourUntil) { if (++detours > 5) { stuck = true; break; } detourUntil = Date.now() + 1600; side = -side; }
      if (detourUntil && Date.now() > detourUntil) { detourUntil = 0; lastBest = Date.now(); }
      if (detourUntil) { const ux = dx / d, uz = dz / d; dx = -uz * side - ux * 0.3; dz = ux * side - uz * 0.3; }   // né sang bên như người chơi
      if (TOUCH) { const dl = Math.hypot(dx, dz), ux = dx / dl, uz = dz / dl, y = p.yaw, ix = ux * Math.cos(y) - uz * Math.sin(y), iz = -(ux * -Math.sin(y) + uz * -Math.cos(y)), R = run ? 50 : 34; await joyTo(ix * R, iz * R); }
      else await ev(([dx, dz]) => { const c = __island.player.cam; c.yaw = Math.atan2(-dx, -dz); }, [dx, dz]);
      await T(250);
    }
  } finally { if (TOUCH) await joyUp(); else { await page.keyboard.up('KeyW'); await page.keyboard.up('ShiftLeft'); } }
  p = await P(); const d = Math.hypot(tx - p.x, tz - p.z);
  return { ok: d < near * 2, d: +d.toFixed(1), stuck, secs: +((Date.now() - t0) / 1000).toFixed(1), at: [p.x, p.z].map(v => +v.toFixed(1)) };
}
// dịch chuyển tới chỗ trống NGOÀI TRỜI gần (x,z) (giống 🏫/bản đồ): dò vòng xoắn, tránh hộp nhà, ô va chạm, nước
async function goNear(x, z, yaw) {
  const r = await ev(([x0, z0, yaw]) => { const c = __island, p = c.player, B = c.boxes || [], W = c.CFG ? c.CFG.island.waterLevel : 0;
    const gy = (x, z) => Math.max(c.terrain.heightAt(x, z), c.groundExtra ? c.groundExtra(x, z, 400) : -99);
    const bad = (x, z) => B.some(b => b && b.x0 != null && x > b.x0 - 1 && x < b.x1 + 1 && z > b.z0 - 1 && z < b.z1 + 1 && (b.top == null || b.top > gy(x, z) + 1)) || gy(x, z) < W + 0.4
      || (c.collide && [[0, 0], [0.6, 0], [-0.6, 0], [0, 0.6], [0, -0.6]].some(([a, b]) => c.collide.blocked(x + a, z + b, gy(x, z) + 0.1)));
    let best = null; for (let i = 0; i < 60 && !best; i++) { const a = i * 2.4, rr = i * 0.9, x = x0 + Math.cos(a) * rr, z = z0 + Math.sin(a) * rr; if (!bad(x, z)) best = [x, z]; }
    if (!best) best = [x0, z0]; c.vehicles && c.vehicles.forceOff && c.vehicles.forceOff(); p.vehicle = null; p.teleport(best[0], best[1]); window.__pt.tp++; if (yaw != null) p.cam.yaw = yaw; p.snapCamera && p.snapCamera(); return best; }, [x, z, yaw ?? null]);
  await T(1500); return r;
}
async function clearUi(max = 30) {   // bấm qua thoại cốt truyện/hướng dẫn như người chơi (nút Tiếp/Bỏ qua)
  for (let k = 0; k < max; k++) {
    const st = await ev(() => { const v = s => { const e = document.querySelector(s); return e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' ? s : null; };
      return { sk: v('#intro .sk'), nx: v('#stSay button.nx'), ds: v('[data-s]'), cut: document.body.classList.contains('st-cut'), fr: __island.player.frozen, intro: !!document.getElementById('intro') }; });
    if (st.sk) await tap('#intro .sk', { must: false }); else if (st.nx) await tap('#stSay button.nx', { must: false }); else if (st.ds) await tap('[data-s]', { must: false });
    else if (!st.cut && !st.fr && !st.intro) return true;
    await T(700);
  }
  return false;
}
// chờ nút hành động #bAct có nhãn khớp rồi bấm (như người chơi bấm nút/E)
async function act(re, { sec = 8, must = true } = {}) {
  const t0 = Date.now(); let lab = null;
  while (Date.now() - t0 < sec * 1000) { lab = await ev(() => { const b = document.getElementById('bAct'); return b && !b.hidden && b.getClientRects().length ? b.textContent.trim() : null; }); if (lab && re.test(lab) && await tap('#bAct', { must: false })) return lab; await T(300); }
  if (must) throw new Error(`không có nút hành động /${re.source}/ (đang: ${lab})`); return null;
}
const hold = async (k, ms) => { await page.keyboard.down(k); await T(ms); await page.keyboard.up(k); };
// giữ nút trên màn hình (chạm giữ / chuột giữ)
async function holdBtn(sel, ms) { const r = await rectOf(sel); if (!r) throw new Error('không thấy nút ' + sel);
  if (TOUCH) { await touch('touchStart', [{ x: r[0], y: r[1], id: 5 }]); await T(ms); await touch('touchEnd', []); } else { await page.mouse.move(r[0], r[1]); await page.mouse.down(); await T(ms); await page.mouse.up(); } }
// đi/lái tới trước ms mili-giây (W hoặc joystick lên)
async function forward(ms, { run = false } = {}) { if (TOUCH) { await joyTo(0, -(run ? 50 : 40)); await T(ms); await joyUp(); } else { await page.keyboard.down('KeyW'); if (run) await page.keyboard.down('ShiftLeft'); await T(ms); await page.keyboard.up('KeyW'); await page.keyboard.up('ShiftLeft'); } }
const up = ms => TOUCH ? holdBtn('#bUp', ms) : hold('Space', ms), down = ms => TOUCH ? holdBtn('#bDown', ms) : hold('KeyC', ms);
const ground = () => ev(() => { const c = __island, q = c.player.pos; return +(q.y - Math.max(c.terrain.heightAt(q.x, q.z), c.groundExtra ? c.groundExtra(q.x, q.z, q.y) : -99)).toFixed(1); });
// dọn sau bước (không tính điểm): đóng bảng còn mở, thoát mini game, xuống xe
async function closeAll() {
  await joyUp().catch(() => {});
  if (await ev(() => __island.aircraft && __island.aircraft.flying).catch(() => false)) { await ev(() => __island.aircraft.eject()); for (let i = 0; i < 40 && !(await ev(() => __island.player.grounded)); i++) await T(1000); }
  await ev(() => { const v = __island.vehicles; if (v && v.riding) try { v.forceOff ? v.forceOff() : v.dismount(); } catch (e) {} const sb = __island.silverBoard; if (sb && sb.riding) try { sb.finish(); } catch (e) {} }).catch(() => {});
  await ev(() => { const c = __island; try { if (c.mg && c.mg.active) c.mg.exit(true); } catch (e) {}
    const x = document.querySelector('#vcr [data-a=x]'); if (x) x.click();
    for (const b of document.querySelectorAll('button')) if (b.getClientRects().length && /^(✕|×|✖|Đóng)/.test(b.textContent.trim())) try { b.click(); } catch (e) {}
    if (document.getElementById('moreMenu') && !document.getElementById('moreMenu').hidden) document.getElementById('bMore').click(); }).catch(() => {});
  await page.keyboard.press('Escape').catch(() => {}); await T(600); await clearUi(10);
}
// trạng thái chung sau mỗi bước: nhân vật không khoá, không còn bảng modal
const health = () => ev(() => { const c = __island; return { frozen: c.player.frozen, modal: document.body.classList.contains('rs-modal'), mg: !!(c.mg && c.mg.active), veh: !!c.player.vehicle,
  pos: c.player.pos.toArray().map(v => +v.toFixed(1)), nan: !Number.isFinite(c.player.pos.x + c.player.pos.y + c.player.pos.z) }; });

// ---------- khung bước ----------
async function run(id, name, fn) {
  if (ONLY && !ONLY.includes(id) && !['load', 'guest', 'intro'].includes(id)) return; if (SKIP.includes(id)) return;
  step = id; const e0 = errs.length, w0 = await ev(() => window.__pt && { ...window.__pt.cnt }).catch(() => null), t0 = Date.now();
  const row = { id, name, ok: false, note: '' };
  try { const r = await fn(row); if (r !== false) row.ok = true; } catch (e) { row.note = (row.note ? row.note + ' · ' : '') + String(e.message || e).slice(0, 300); }
  const w1 = await ev(() => window.__pt && { ...window.__pt.cnt }).catch(() => null);
  if (w0 && w1) for (const k of ['water', 'inside', 'jump', 'nan']) if (w1[k] > w0[k]) { row.ok = false; row.note += ` · ${k}+${w1[k] - w0[k]} ${JSON.stringify((await ev(k => __pt.last[k], k).catch(() => null)) || '')}`; }
  row.errors = errs.slice(e0); if (row.errors.length) { row.ok = false; row.note += ` · ${row.errors.length} lỗi console`; }
  row.secs = Math.round((Date.now() - t0) / 1000);
  if (!row.ok) row.shot = await shot('FAIL-' + id);
  results.push(row); log(`${row.ok ? '✅' : '❌'} [${tag}] ${id} — ${name} (${row.secs}s) ${row.note}`); if (row.errors.length) log('   ' + row.errors.slice(0, 5).join('\n   '));
  // dọn: về trạng thái chơi bình thường cho bước sau
  if (!['load', 'guest', 'intro'].includes(id)) await closeAll();
}
// rà giao diện: nút chồng nhau, nút tràn mép/ngoài vùng an toàn, chữ tràn khỏi nút, nút quá nhỏ để chạm
const uiAudit = (scope = 'body') => ev(scope => {
  const root = document.querySelector(scope) || document.body;
  const vis = e => { if (!e.offsetParent && getComputedStyle(e).position !== 'fixed') return false; for (let a = e; a; a = a.parentElement) { const s = getComputedStyle(a); if (s.visibility === 'hidden' || +s.opacity < 0.05 || s.display === 'none') return false; } const r = e.getBoundingClientRect(); return r.width > 6 && r.height > 6; };
  const inScroll = e => { const r = e.getBoundingClientRect(); for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a); if (/auto|scroll|hidden/.test(s.overflowY + s.overflowX)) { const q = a.getBoundingClientRect(); if (r.bottom > q.bottom + 1 || r.top < q.top - 1 || r.right > q.right + 1 || r.left < q.left - 1) return false; } } return true; };
  const els = [...root.querySelectorAll('button,[role=button]')].filter(e => vis(e) && inScroll(e) && getComputedStyle(e).pointerEvents !== 'none');
  const name = e => (e.id ? '#' + e.id : '') + '«' + e.textContent.trim().slice(0, 14) + '»';
  const over = [], off = [], clip = [], small = [];
  for (let i = 0; i < els.length; i++) {
    const a = els[i], r = a.getBoundingClientRect();
    if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) off.push(name(a) + `@${r.left | 0},${r.top | 0}`);
    if (a.scrollWidth > a.clientWidth + 3 && getComputedStyle(a).overflow !== 'visible' && a.textContent.trim().length > 2) clip.push(name(a));
    if (matchMedia('(pointer:coarse)').matches && (r.width < 30 || r.height < 30) && !a.closest('#hudBar')) small.push(name(a) + `${r.width | 0}x${r.height | 0}`);
    for (let j = i + 1; j < els.length; j++) { const b = els[j]; if (a.contains(b) || b.contains(a)) continue; const q = b.getBoundingClientRect();
      const w = Math.min(r.right, q.right) - Math.max(r.left, q.left), h = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top);
      const stk = e => { for (let x = e; x; x = x.parentElement) if (getComputedStyle(x).position === 'sticky') return true; return false; };
      if (w > 4 && h > 4 && stk(a) === stk(b)) { // chỉ tính khi một nút thật sự nằm trên nút kia ở điểm chồng
        const cx = Math.max(r.left, q.left) + w / 2, cy = Math.max(r.top, q.top) + h / 2, top = document.elementFromPoint(cx, cy);
        if (top && (a.contains(top) || b.contains(top))) over.push(`${name(a)} ⟂ ${name(b)}`); } }
  }
  return { n: els.length, over, off, clip, small };
}, scope);
// theo dõi mỗi khung (cài sau khi tải)
const installWatch = () => ev(() => {
  const c = __island, p = c.player, W = c.CFG ? c.CFG.island.waterLevel : 0, pt = window.__pt = { tp: 0, cnt: { water: 0, inside: 0, jump: 0, nan: 0 }, last: {} };
  const tp = p.teleport; p.teleport = function () { pt.tp++; return tp.apply(this, arguments); }; pt.sim = 0; const pu = p.update; p.update = function (dt) { pt.sim += dt; return pu.call(this, dt); };
  let last = null, lastTp = 0, insideRun = 0;
  (function f() { requestAnimationFrame(f); const q = p.pos; if (!Number.isFinite(q.x + q.y + q.z)) { pt.cnt.nan++; return; }
    const free = !p.vehicle && !(c.dive && c.dive.swimming) && !(c.mg && c.mg.active) && !document.body.classList.contains('st-cut') && !(c.train && c.train.ride && c.train.ride.state.aboard) && !p.frozen;
    if (last && pt.tp === lastTp) { const d = Math.hypot(q.x - last[0], q.z - last[1]); if (d > 8 && free) { pt.cnt.jump++; pt.last.jump = [last.map(v => +v.toFixed(1)), [q.x, q.z].map(v => +v.toFixed(1))]; } }
    if (free) {
      const h = c.terrain.heightAt(q.x, q.z), g = c.groundExtra ? c.groundExtra(q.x, q.z, q.y) : -99;
      if (Math.max(h, g) < W - 0.5 && q.y < W + 0.2 && !(c.sea && c.sea.aboard)) { pt.cnt.water++; pt.last.water = [q.x, q.y, q.z].map(v => +v.toFixed(1)); }
      // đứng TRONG vật: ô va chạm chặn ngay tâm người suốt > 0,5 s (không tính lúc vừa dịch chuyển)
      if (c.collide && c.collide.blocked(q.x, q.z, q.y + 0.05)) { if (++insideRun === 30) { pt.cnt.inside++; pt.last.inside = [q.x, q.y, q.z].map(v => +v.toFixed(1)); } } else insideRun = 0;
    } else insideRun = 0;
    last = [q.x, q.z]; lastTp = pt.tp; })();
});

// ================= KỊCH BẢN =================
const t0 = Date.now();
async function boot({ fresh = true } = {}) {
  await page.goto(BASE + '/');
  await page.waitForFunction(() => window.__island && __island.school && __island.school.ready && __island.warmed, null, { timeout: 600000 });
}
await run('load', 'Mở game (tới khi đảo sẵn sàng)', async row => { await boot(); row.note = `tải ${((Date.now() - t0) / 1000).toFixed(1)} s`; });
await installWatch();
const L = await ev(async () => { const l = await import('/js/island/layout.js'); return { spawn: l.SPAWN, school: l.to3(1000, 380), gate: l.GATE3 }; });

await run('guest', 'Bảng tài khoản → Chơi khách', async row => {
  await page.waitForSelector('#accBox:not([hidden]) [data-a="guest"]', { timeout: 30000 });
  await tap('#accBox [data-a="guest"]');
  await T(1500); if (await ev(() => !!document.querySelector('#accBox:not([hidden])'))) throw new Error('bảng tài khoản không đóng');
});
await run('intro', 'Clip mở đầu → bấm Bỏ qua ⏭', async row => {
  await page.waitForSelector('#intro .sk', { timeout: 30000 }).catch(() => { row.note = 'không thấy clip (đã xem?)'; });
  if (await rectOf('#intro .sk')) {
    const a = await uiAudit('#intro'); if (a.clip.length || a.off.length) { row.note += ` nút clip: tràn chữ ${a.clip.join(',')} ngoài màn ${a.off.join(',')}`; row.bad = 1; }
    await tap('#intro .sk');
    await page.waitForFunction(() => !document.getElementById('intro'), null, { timeout: 15000 });
  }
  if (!(await clearUi(40))) throw new Error('thoại mở đầu không kết thúc / nhân vật vẫn khoá');
  if (row.bad) return false;
});
await run('avatar', 'Tạo nhân vật (☰ → 🎨 Nhân vật → chọn → 💾 Lưu)', async row => {
  await tap('#bMore'); await T(600); await tap('#bAvatar'); await page.waitForSelector('#vcr', { timeout: 10000 }); await T(2500);
  const a = await uiAudit('#vcr'); if (a.off.length || a.over.length) row.note += ` bảng tạo nhân vật: ngoài màn ${a.off.slice(0, 3)} chồng ${a.over.slice(0, 3)}`;
  await tap('#vcr [data-k="base"][data-v="hair-m"]'); await T(1500);
  await tap('#vcr [data-k="glasses"][data-v="round"]'); await T(800);
  await tap('#vcr [data-a="ok"]'); await page.waitForFunction(() => !document.getElementById('vcr'), null, { timeout: 10000 });
  const s = await ev(() => { try { return JSON.parse(localStorage.getItem('island.avatar') || 'null'); } catch (e) { return 'x'; } });
  await T(1500); const h = await health(); if (h.frozen || h.modal) throw new Error('đóng trình tạo nhân vật xong vẫn khoá ' + JSON.stringify(h));
  row.note += ' lưu: ' + JSON.stringify(s).slice(0, 80);
  if (a.off.length || a.over.length) return false;
});
await run('walk', 'Đi bộ từ cổng vào sân trường bằng joystick/phím (không rơi biển, không xuyên, không kẹt)', async row => {
  await tap('#bMore'); await T(500); const ok = await tapText(/Đến trường|🏫/, '#moreMenu', { must: false }); if (!ok) { await tap('#bMore'); await goNear(...L.spawn); }
  await T(2500); await clearUi(10);
  const legs = [[L.gate[0] + 6, L.gate[1]], L.school];
  for (const [x, z] of legs) { const r = await walkTo(x, z, { sec: 45, label: 'trường' }); row.note += ` → (${x | 0},${z | 0}) ${JSON.stringify(r)}`; if (!r.ok) throw new Error('không tới được sân trường ' + JSON.stringify(r)); }
  // đi lang thang trong sân 13 s (đổi hướng), xem có kẹt/xuyên không
  const p = await P(); for (const [dx, dz] of [[13, 0], [0, 13], [-13, 0], [0, -13]]) await walkTo(p.x + dx, p.z + dz, { sec: 8, run: true });
  await shot('san-truong');
});

await run('npc', 'Nói chuyện NPC → trả lời câu hỏi → bấm ✕', async row => {
  // Coach Ru ở cổng trường (nhân vật cốt truyện) + 1 bạn/thầy cô gần nhất
  await goNear(L.spawn[0] + 3, L.spawn[1]); await clearUi(5);
  const near = await ev(sp => { const P = (__island.townPeople || []).filter(e => e.a && e.px != null && !e.seat && !e.bike); P.sort((a, b) => Math.hypot(a.px - sp[0], a.pz - sp[1]) - Math.hypot(b.px - sp[0], b.pz - sp[1])); return P.slice(0, 6).map(e => [e.px, e.pz]); }, L.spawn);
  let talked = false;
  for (const [x, z] of near) {
    await goNear(x + 1.6, z + 0.4); const lab = await act(/^💬/, { sec: 4, must: false }); if (!lab) continue;
    row.note += lab.slice(0, 30); await T(1200); talked = true;
    for (let i = 0; i < 8; i++) {   // đọc thoại: Tiếp ▶ cho tới khi có câu hỏi
      if (await rectOf('#rwQ .ch button')) break;
      if (!(await tap('#tQuiz .row .go', { must: false }))) { const g = await rectOf('#tQuiz [data-g="3"]'); if (g) await tap('#tQuiz [data-g="3"]'); else break; }
      await T(900);
    }
    if (await rectOf('#rwQ .ch button')) {
      const a = await uiAudit('#rwQ'); if (a.over.length || a.off.length || a.clip.length) row.note += ` thẻ câu hỏi: ${JSON.stringify(a)}`;
      await tap('#rwQ .ch button[data-k="0"]'); await T(1200); row.note += ' · ' + ((await ev(() => (document.querySelector('#rwQ p.ex') || {}).textContent || '')) || '').slice(0, 20);
      if (await rectOf('#rwQ .qx')) await tap('#rwQ .qx');
    } else row.note += ' (không có câu hỏi)';
    await T(600); if (await rectOf('#tQuiz .x')) await tap('#tQuiz .x');
    await T(1000); const h = await health(); if (h.frozen || await rectOf('#tQuiz') || await rectOf('#rwQ')) throw new Error('bấm ✕ xong vẫn còn bảng/khoá ' + JSON.stringify(h));
    break;
  }
  if (!talked) throw new Error('không NPC nào có nút 💬');
});
await run('mg', 'Mọi mini game: vào (☰ → 🎮) → chơi 3 s → ✕ Thoát', async row => {
  await ev(() => { const pm = __island.premium; if (pm) { pm.allow = () => true; pm.on = () => true; } });   // khách bị Gói Phụ huynh khoá (đúng thiết kế) → mở trong test
  const keys = await ev(() => { const G = __island.miniGames, seen = new Set(), out = []; for (const [k, g] of Object.entries(G)) { if (seen.has(g)) continue; seen.add(g); out.push(k); } return out; });
  const bad = [];
  for (const k of keys) {
    step = 'mg:' + k; const e0 = errs.length;
    try {
      await goNear(...L.spawn); await tap('#bMore'); await T(400); await tap('#bMenu'); await T(800);
      if (!(await rectOf(`#schoolMenu button[data-k="${k}"]`))) { await closeAll(); const ok = await ev(k => __island.mg.start(k, __island.mg.doorOf(k)), k); if (!ok) throw new Error('không mở'); row.note += ` ${k}(không có trong menu)`; }
      else await tap(`#schoolMenu button[data-k="${k}"]`);
      // câu khởi động rồi "▶ Vào chơi"
      for (let i = 0; i < 12 && !(await ev(() => !!__island.mg.active)); i++) {
        if (await rectOf('#rwQ .ch button[data-k="0"]') && !(await rectOf('#rwQ p.ex'))) await tap('#rwQ .ch button[data-k="0"]');
        else if (!(await tapText(/Vào chơi|▶ Chơi|Bắt đầu/, 'body', { must: false }))) await act(/^✋|Chơi/, { sec: 1, must: false });
        await T(900);
      }
      if (!(await ev(() => !!__island.mg.active))) throw new Error('không vào được');
      await T(1200); await ev(() => __island.mg.skipFly && __island.mg.skipFly());
      if (TOUCH) { await joyTo(20, -30); await T(1500); await joyUp(); } else { await hold('KeyW', 800); await key('Space'); await hold('KeyD', 600); }
      await T(800);
      const a = await uiAudit('#mgHud'); if (a.off.length) bad.push(`${k}: nút HUD ngoài màn ${a.off}`);
      if (!(await tap('#mgHud .mg-x', { must: false }))) { const card = await tapText(/Thoát/, '.mg-card', { must: false }); if (!card) throw new Error('không bấm được ✕ Thoát'); }
      await T(1500);
      const h = await health(); if (h.mg || h.frozen) throw new Error('thoát xong vẫn kẹt ' + JSON.stringify(h));
      if (await ev(() => !!(__island.silverBoard && __island.silverBoard.riding))) throw new Error('thoát xong vẫn trên ván bạc');
    } catch (e) { bad.push(`${k}: ${String(e.message).slice(0, 120)}`); await shot('FAIL-mg-' + k); await closeAll(); }
    if (errs.length > e0) bad.push(`${k}: ${errs.length - e0} lỗi console`);
  }
  step = 'mg'; row.note += ` ${keys.length} game, lỗi ${bad.length}: ${bad.join(' | ')}`; if (bad.length) return false;
});
await run('shop', 'Cặp sách 🎒 → 🛒 Cửa hàng → mua 1 món bằng vàng → ✕', async row => {
  await goNear(...L.spawn); await tap('#bBag'); await page.waitForSelector('#ecoBag', { timeout: 8000 });
  let a = await uiAudit('#ecoBag'); if (a.over.length || a.off.length) row.note += ` cặp: ${JSON.stringify(a)}`;
  await tap('#ecoBag [data-a="shop"]'); await page.waitForSelector('#ecoShop', { timeout: 8000 }); await T(800);
  // vàng kiếm khi chơi: test cộng sẵn 377 🪙 (như đã chơi mini game/nhiệm vụ) để mua khinh khí cầu bằng giao diện, rồi giấy phép bay + chổi tập cho các bước sau
  await ev(() => { const a = __island.account; if (__island.eco.gold() < 300) a.addCoins ? a.addCoins(377) : (a.profile.money += 377); });
  await tap('#ecoShop button[data-t="ride"]'); await T(800);
  const g0 = await ev(() => __island.eco.gold());
  const id = await ev(() => { const E = __island.eco, pr = i => { const it = E.ITEM[i]; return it ? ((it.price && it.price.gold) ?? it.gold) : null; };
    const cs = [...document.querySelectorAll('#ecoShop .cd[data-id]')].filter(c => !c.classList.contains('own') && !c.classList.contains('lock') && pr(c.dataset.id) != null && pr(c.dataset.id) <= E.gold());
    return (cs.find(c => c.dataset.id === 'ride-balloon') || cs[0] || {}).dataset?.id || null; });
  if (!id) throw new Error('không có món nào mua được bằng ' + g0 + ' vàng');
  await tap(`#ecoShop .cd[data-id="${id}"]`); await T(500); await tap('#ecoShop [data-a="buy"]'); await T(1500);
  const r = await ev(id => ({ own: __island.eco.owns(id), g: __island.eco.gold() }), id); row.note += ` mua ${id}: ${g0}→${r.g}`;
  if (!r.own || r.g >= g0) throw new Error('mua không thành ' + JSON.stringify(r));
  a = await uiAudit('#ecoShop'); if (a.over.length || a.off.length) { row.note += ` cửa hàng: ${JSON.stringify(a)}`; row.bad = 1; }
  await ev(() => { for (const i of ['ride-plane', 'broom-tap', 'ride-balloon']) if (!__island.eco.owns(i)) __island.eco.buy(i); });
  await tap('#ecoShop [data-a="x"]'); await T(600); if (await rectOf('#ecoBag')) await tap('#ecoBag [data-a="x"]'); await T(600);
  const h = await health(); if (h.modal || h.frozen || await rectOf('#ecoShop') || await rectOf('#ecoBag')) throw new Error('đóng không hết ' + JSON.stringify(h));
  if (row.bad) return false;
});
await run('bike', 'Xe đạp 🚲: lên, đạp 4 s, xuống', async row => {
  await goNear(L.school[0], L.school[1]); await tap('#bBike'); await T(1500);
  if (!(await ev(() => __island.vehicles.riding === 'bike'))) throw new Error('không lên được xe');
  const p0 = await P(), s0 = await ev(() => __pt.sim); await forward(4000); const p1 = await P(), sim = (await ev(() => __pt.sim)) - s0; const m = Math.hypot(p1.x - p0.x, p1.z - p0.z); row.note = `đi ${m.toFixed(1)} m / ${sim.toFixed(1)} s mô phỏng`;
  await tap('#bBike'); await T(1200); if (await ev(() => !!__island.player.vehicle)) throw new Error('không xuống được xe'); if (m < 2 * sim) throw new Error('xe không chạy');
});
await run('balloon', 'Khinh khí cầu: lên, bay cao, bay tới, hạ, rời', async row => {
  await goNear(L.school[0] + 10, L.school[1] + 10); await tap('#bBalloon'); await T(2500);
  if (!(await ev(() => __island.vehicles.riding === 'balloon'))) throw new Error('không lên được khinh khí cầu (' + (await ev(() => document.getElementById('info').textContent.slice(0, 80))) + ')');
  await up(3000); const g1 = await ground(); await forward(3000); row.note = `cao ${g1} m`;
  for (let i = 0; i < 12 && (await ground()) > 0.6; i++) await down(1500);
  await tap('#bBalloon'); await T(1500); if (await ev(() => !!__island.player.vehicle)) { const l = await act(/Rời|Xuống/, { sec: 4, must: false }); await T(1500); }
  if (await ev(() => !!__island.player.vehicle)) throw new Error('không rời được khinh khí cầu, cao ' + (await ground()));
  if (g1 < 2) throw new Error('không bay lên');
});
await run('plane', 'Máy bay: lên → cất cánh → bay qua Học viện → nút đỏ nhảy ra → diều lượn → chạm đất', async row => {
  const K = await ev(async () => { const l = await import('/js/island/layout.js'); const k = l.EXTRA.find(e => e.id === 'K'); return { r: k.r, acad: l.ACADEMY.c }; });
  await ev(() => { const a = __island.account; a && a.profile && a.profile.own && !a.profile.own.includes('ride-plane') && a.profile.own.push('ride-plane'); });   // giấy phép bay (mua ở cửa hàng — đã thử mua ở bước shop)
  const pl = await ev(() => __island.aircraft.planes.filter(p => p.parked).map(p => [p.group.position.x, p.group.position.z])[0]);
  if (!pl) throw new Error('không có máy bay đỗ');
  await goNear(pl[0] + 3, pl[1] + 3); await act(/✈️/, { sec: 6 });
  for (let i = 0; i < 40 && (await ev(() => __island.aircraft.phase)) !== 'fly'; i++) await T(1000);
  if ((await ev(() => __island.aircraft.phase)) !== 'fly') throw new Error('không cất cánh được: ' + (await ev(() => __island.aircraft.phase)));
  // lái về Học viện bằng A/D (máy tính) hoặc joystick (điện thoại)
  const tgt = K.acad; let dmin = 1e9;
  for (let i = 0, tf = Date.now(); Date.now() - tf < 240000; i++) {
    const s = await ev(t => { const a = __island.aircraft, q = __island.player.pos, want = Math.atan2(t[0] - q.x, t[1] - q.z); let d = want - a.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); return { d, dist: Math.hypot(t[0] - q.x, t[1] - q.z), y: q.y, phase: a.phase }; }, tgt);
    dmin = Math.min(dmin, s.dist); if (s.dist < 60 || !(await ev(() => __island.aircraft.flying))) break;
    const turn = s.d > 0.1 ? 1 : s.d < -0.1 ? -1 : 0;   // dấu lái: thử, nếu sai thì đảo
    if (TOUCH) { await joyTo(-turn * 40, 0); await T(700); await joyUp(); } else if (turn) await hold(turn > 0 ? 'KeyA' : 'KeyD', 500); else await T(500);
  }
  row.note = `gần Học viện nhất ${Math.round(dmin)} m`;
  await shot('bay-qua-hoc-vien');
  if (dmin > 200) throw new Error('không bay tới được Học viện (gần nhất ' + Math.round(dmin) + ' m)');
  await tap('#bEject'); await T(1500);
  if (await ev(() => __island.aircraft.flying)) throw new Error('nút đỏ không nhảy ra được');
  let gl = false; for (let i = 0; i < 90; i++) { const s = await ev(() => ({ g: !!(__island.player.glide && __island.player.glide.on), gr: __island.player.grounded })); gl = gl || s.g; if (s.gr && i > 2) break; if (i % 3 === 0) await forward(900); else await T(900); }
  row.note += ` diều ${gl ? 'mở' : 'KHÔNG mở'}`; const h = await health(); row.note += ` đáp ${JSON.stringify(h.pos)}`;
  if (!gl) throw new Error('diều lượn không mở');
  if (!(await ev(() => __island.player.grounded))) throw new Error('chưa chạm đất sau 90 s');
});
await run('broom', 'Chổi 🧹: gọi, bay lên, bay tới, hạ, xuống', async row => {
  await goNear(L.school[0], L.school[1] + 8); await tap('#bBroom'); await T(2500);
  if (!(await ev(() => __island.vehicles.riding === 'broom'))) throw new Error('không lên được chổi (' + (await ev(() => document.getElementById('info').textContent.slice(0, 80))) + ')');
  await up(2000); const g = await ground(); await forward(3000);
  for (let i = 0; i < 10 && (await ground()) > 0.5; i++) await down(1500);
  await tap('#bBroom'); await T(1200); if (await ev(() => !!__island.player.vehicle)) await act(/Xuống|🧹/, { sec: 3, must: false }); await T(1200);
  row.note = `cao ${g} m`; if (await ev(() => !!__island.player.vehicle)) throw new Error('không xuống chổi được');
  if (g < 1.5) throw new Error('chổi không bay lên');
});
await run('board', 'Ván bạc 🏄: lên, lướt, xuống', async row => {
  await goNear(L.school[0] - 8, L.school[1]); await tap('#bBoard'); await T(2000);
  if (!(await ev(() => !!(__island.silverBoard && __island.silverBoard.riding)))) throw new Error('không lên được ván');
  const p0 = await P(); await forward(3000); const p1 = await P(); row.note = `lướt ${Math.hypot(p1.x - p0.x, p1.z - p0.z).toFixed(1)} m`;
  await tap('#bBoard'); await T(2000); if (await ev(() => !!(__island.silverBoard.riding))) throw new Error('không xuống ván được');
});
await run('boat', 'Thuyền: lên thuyền buồm/ca nô ở làng chài, lái, lên bờ', async row => {
  const b = await ev(() => { const B = __island.sea.pilot.boats || []; const q = __island.player.pos; return B.map(b => { const o = b.group || b.obj || b; const p = o.position || b.pos; return p ? [p.x, p.z, b.name || b.kind || ''] : null; }).filter(Boolean); });
  if (!b.length) throw new Error('không thấy thuyền');
  let lab = null;
  for (const [x, z] of b) { const g = await goNear(x, z); if (!g) continue; lab = await act(/⛵|🚤/, { sec: 5, must: false }); if (lab) break; }
  if (!lab) throw new Error('không có nút lên thuyền gần thuyền nào');
  row.note = lab; await T(1500); if (!(await ev(() => !!__island.sea.pilot.aboard))) throw new Error('bấm rồi nhưng chưa lên thuyền');
  await forward(4000);
  // quay về bờ: lái ngược lại rồi chờ nút 🏝️
  let left = await act(/🏝️|Lên bờ/, { sec: 2, must: false });
  for (let i = 0; i < 8 && !left; i++) { if (TOUCH) { await joyTo(0, 40); await T(1500); await joyUp(); } else await hold('KeyS', 1500); left = await act(/🏝️|Lên bờ/, { sec: 1, must: false }); }
  if (!left) { row.note += ' (không thấy 🏝️ Lên bờ)'; throw new Error('không lên bờ được'); }
  await T(1500); if (await ev(() => !!__island.sea.pilot.aboard)) throw new Error('vẫn trên thuyền');
});

// ---------- Tàu Pha Lê → Học viện ----------
const AC = await ev(async () => { const g = await import('/js/island/academy/plan.js'); const W = g.toWorld, L2 = g.CASTLE_L, V = g.VILLAGE, F = g.FOREST, H = g.HOUSE_AT || {};
  return { gate: W(g.CASTLE.u1 + 8, -14), yard: W(-20, 0), hall: W((L2.hall.u0 + L2.hall.u1) / 2, 0), hallDoor: W(L2.hall.u1 - 4, -5.3), alley: W(V.u0 + 8, V.v0 + 8), forestGate: W(F.gate[0], F.gate[1] + 8), forestIn: W(F.u + 40, F.v),
    lake: W(F.lake.u + F.lake.ring + 4, F.lake.v), houseLong: H.long ? W(H.long[0], H.long[1]) : null, cls: W(-30, -34.5), Y: g.PLAT.y }; });
await run('train', 'Tàu Pha Lê: lên tàu ở ga đảo Rubik → tới ga Học viện → xuống tàu', async row => {
  await ev(() => { const pm = __island.premium; if (pm) { pm.allow = () => true; pm.on = () => true; } });
  const car = await ev(() => { const c = __island.train.consist.cars[2] || __island.train.consist.cars[0]; return c && [c.o.position.x, c.o.position.z]; });
  // chờ tàu về ga A (nếu đang chạy)
  for (let i = 0; i < 100 && (await ev(() => __island.train.ride.state.at !== 'A' || __island.train.ride.state.phase === 'run')); i++) await T(2000);
  const c2 = await ev(() => { const c = __island.train.consist.cars[2]; const v = new c.o.position.constructor(); c.o.getWorldPosition(v); return [v.x, v.z]; });
  await ev(c => { const p = __island.player; p.vehicle = null; p.teleport(c[0] + 4, c[1]); __pt.tp++; }, c2); await T(1500);
  let lab = await act(/🚂/, { sec: 6, must: false });
  if (!lab) { await ev(c => { __island.player.teleport(c[0] - 4, c[1]); __pt.tp++; }, c2); await T(1500); lab = await act(/🚂/, { sec: 6 }); }
  row.note = lab.slice(0, 40); await T(2500);
  if (!(await ev(() => __island.train.ride.state.aboard))) throw new Error('bấm 🚂 nhưng không lên tàu');
  for (let i = 0; i < 90 && (await ev(() => __island.train.ride.state.phase)) !== 'run'; i++) await T(1500);
  await shot('tau'); 
  let skip = false; for (let i = 0; i < 140; i++) { const st = await ev(() => __island.train.ride.state); if (st.at === 'B' && st.phase !== 'run') break; if (!skip) skip = !!(await tapText(/Tới nơi|⏭/, 'body', { must: false })); await T(1500); }
  await T(2000); let st = await ev(() => __island.train.ride.state);
  if (st.aboard) { await act(/Xuống|🚶|Ra/, { sec: 8, must: false }); await T(2500); st = await ev(() => __island.train.ride.state); }
  row.note += ` → ga ${st.at}, trên tàu ${st.aboard}`;
  if (st.at !== 'B' || st.aboard) throw new Error('không tới/xuống được ga Học viện ' + JSON.stringify(st));
  const h = await health(); if (h.frozen) throw new Error('xuống tàu bị khoá');
});
await run('academy', 'Học viện: đi bộ tới cổng lâu đài → sân → Đại sảnh → nhận đũa → vào trong (7 tầng) → lên cầu thang', async row => {
  if ((await ev(() => __island.train.ride.state.at)) !== 'B' || !(ONLY && ONLY.includes('train'))) { await goNear(...AC.gate); }
  for (const [n, t] of [['cổng', AC.gate], ['sân', AC.yard], ['đại sảnh', AC.hallDoor]]) { const r = await walkTo(t[0], t[1], { sec: 60, run: true }); row.note += ` ${n}:${r.ok ? 'ok' : JSON.stringify(r)}`; if (!r.ok) { await shot('ac-' + n); throw new Error(`không đi bộ tới ${n} được ` + JSON.stringify(r)); } }
  await walkTo(AC.hall[0], AC.hall[1], { sec: 20 });
  // đũa phép
  if (!(await ev(() => !!localStorage.getItem('academy.wand')))) { const w = await act(/🪄/, { sec: 3, must: false }); if (w) { await T(1200); await tapText(/Chọn|Nhận|✨|OK|Xong/, '#mgCard', { must: false }); await T(800); await tapText(/Chọn|Nhận|✨|OK|Xong|Lưu/, '#mgCard', { must: false }); } if (!(await ev(() => !!localStorage.getItem('academy.wand')))) { row.note += ' (không nhận đũa được bằng nút)'; await ev(() => __island.academy && __island.academy.magic && __island.academy.magic.setWand && __island.academy.magic.setWand()); } }
  // vào trong lâu đài
  await walkTo(AC.hallDoor[0], AC.hallDoor[1], { sec: 15, near: 1.5 });
  const lab = await act(/🚪 Vào trong/, { sec: 6 }); await T(3000);
  const I = await ev(() => { const i = __island.academy.interior; return { inside: i.inside, k: i.level, foot: i.toWorld(30, 49.5, 0), top: i.toWorld(49, 49.5, 1) }; });
  if (!I.inside) throw new Error('bấm vào nhưng không ở trong lâu đài');
  await shot('trong-lau-dai');
  let r = await walkTo(I.foot[0], I.foot[2], { sec: 30 }); row.note += ` chân cầu thang:${r.ok}`;
  r = await walkTo(I.top[0], I.top[2], { sec: 30 }); const y = (await P()).y;
  row.note += ` lên cầu thang: y=${y.toFixed(1)} (tầng 1 ≈ ${I.top[1]})`;
  if (y < I.top[1] - 1) throw new Error('không lên được tầng 1 bằng cầu thang');
  await shot('tang-1');
  // ra lại Đại sảnh
  await walkTo(I.foot[0], I.foot[2], { sec: 30 });
});
await run('house', 'Lễ chọn Nhà (Quả cầu) → phòng sinh hoạt nhà', async row => {
  await ev(() => { const i = __island.academy.interior; if (i.inside) i.leave && i.leave(); }); await T(1500);
  await goNear(...AC.hall); await T(1000);
  if (!(await ev(() => __island.houses && __island.houses.houseId()))) {
    for (let i = 0; i < 8 && !(await rectOf('#hsCard')); i++) { await walkTo(AC.hall[0] + (i % 2 ? 2 : -2), AC.hall[1] + (i % 3) - 1, { sec: 4 }); await act(/🔮/, { sec: 2, must: false }); }
    if (!(await rectOf('#hsCard'))) throw new Error('không thấy nút 🔮 Lễ chọn Nhà ở Đại sảnh');
    await tap('#hsCard [data-go]'); for (let i = 0; i < 10 && (await rectOf('#hsCard [data-h]')); i++) { await tap('#hsCard [data-h]'); await T(800); }
    await T(2500); await closeAll();
  }
  const id = await ev(() => __island.houses.houseId()); row.note = 'nhà ' + id; if (!id) throw new Error('chưa được chọn nhà');
  const door = await ev(async id => { const g = await import('/js/island/academy/plan.js'); const H = g.HOUSE_AT[id]; return g.toWorld(H[0], H[1]); }, id);
  await goNear(door[0], door[1]); 
  for (let k = 0; k < 4; k++) {
    if (!(await act(new RegExp('— '), { sec: 5, must: false }))) { await walkTo(door[0], door[1], { sec: 6, near: 1 }); continue; }
    await T(1200); if (await rectOf('#rwQ .ch button')) { await tap(`#rwQ .ch button[data-k="${k}"]`); await T(2500); await closeAll(); }
    await T(3000); if (await ev(() => Math.abs(__island.player.pos.y - 233) < 6)) break;
  }
  const y = (await P()).y; row.note += ` y=${y.toFixed(0)}`; await shot('phong-nha');
  if (Math.abs(y - 233) > 6) throw new Error('không vào được phòng sinh hoạt nhà');
  await act(/Ra sân/, { sec: 2, must: false }); const r = await walkTo((await P()).x + 1.5, (await P()).z, { sec: 3 }); await act(/Ra sân/, { sec: 6, must: false }); await T(2500);
});
await run('class', 'Lớp học Học viện: tới cửa lớp → vào → ✕ Thoát', async row => {
  await goNear(AC.cls[0], AC.cls[1] - 3); await walkTo(AC.cls[0], AC.cls[1], { sec: 8, near: 1.5 }); const lab = await act(/lớp|Lớp|Vào|📚|✨|🔆|💡/, { sec: 6 }); row.note = lab.slice(0, 30); await T(2500);
  for (let i = 0; i < 10 && !(await ev(() => !!__island.mg.active)); i++) { if (await rectOf('#rwQ .ch button[data-k="0"]') && !(await rectOf('#rwQ p.ex'))) await tap('#rwQ .ch button[data-k="0"]'); else await tapText(/Vào|Bắt đầu|▶/, 'body', { must: false }); await T(1000); }
  if (!(await ev(() => !!__island.mg.active))) throw new Error('không vào được lớp');
  await T(2500); await shot('lop-hoc'); await tap('#mgHud .mg-x'); await T(1500); const h = await health(); if (h.mg || h.frozen) throw new Error('thoát lớp vẫn kẹt');
});
await run('alley', 'Phố Phép Thuật: đi bộ dạo phố', async row => {
  await goNear(...AC.alley); const p = await P(); await shot('pho-phep-thuat');
  for (const [dx, dz] of [[0, 13], [8, 0], [0, -13]]) { const r = await walkTo(p.x + dx, p.z + dz, { sec: 12 }); row.note += ` ${r.ok ? 'ok' : r.d}`; }
});
await run('forest', 'Rừng Học viện → hồ trong rừng', async row => {
  await goNear(...AC.forestGate); let r = await walkTo(AC.forestIn[0], AC.forestIn[1], { sec: 40, run: true }); row.note = `vào rừng ${JSON.stringify(r)}`;
  await shot('rung'); if (!r.ok && r.stuck) throw new Error('kẹt trong rừng');
  r = await walkTo(AC.lake[0], AC.lake[1], { sec: 40, run: true }); row.note += ` hồ ${JSON.stringify(r)}`; await shot('ho');
  if (!r.ok) throw new Error('không tới được hồ');
});
await run('destiny', 'Rừng Thiên Định (đảo chính): đi bộ vào thung lũng tới hồ', async row => {
  const D = await ev(async () => { const d = await import('/js/island/destiny-plan.js'); return { guide: d.GUIDE, trail: d.TRAIL, lake: [d.LAKE.x, d.LAKE.z + d.LAKE.r + 3], O: d.O }; });
  // theo lối mòn bí mật như người chơi: bia khắc đá → đom đóm → đá bước → khe dốc → ngã ba → sương → cầu khỉ → hang → thung lũng → hồ gương
  await goNear(D.guide[0][0] + 3, D.guide[0][1] + 3); let r = null, i = 0;
  for (const w of [...D.guide.slice(1), ...D.trail, D.lake]) { r = await walkTo(w[0], w[1], { sec: 25, run: true, near: 2.2 }); i++; if (!r.ok) { row.note = `kẹt ở điểm ${i}/${D.guide.length + D.trail.length} ${JSON.stringify(w)} ${JSON.stringify(r)}`; await shot('rtd-ket'); break; } }
  const p = await P(); r = { ok: Math.hypot(p.x - D.lake[0], p.z - D.lake[1]) < 16 }; row.note += ` tới hồ: ${r.ok}`; await shot('rung-thien-dinh');
  if (!r.ok) throw new Error('không tới được hồ Rừng Thiên Định');
});
await run('lighthouse', 'Hải đăng: thuyền ra đảo đá → vào tháp → leo 144 bậc lên đỉnh', async row => {
  const LH = await ev(() => { const l = __island.lighthouse; return { main: l.pier.main, door: l.door, C: l.C, Y0: l.Y0 }; });
  await goNear(LH.main[0], LH.main[1]); await act(/⛵/, { sec: 8 }); await T(2000);
  await tapText(/Tới nơi|⏭/, 'body', { must: false }); for (let i = 0; i < 40 && (await ev(() => __island.lighthouse.ride.active)); i++) { await act(/⏭/, { sec: 1, must: false }); await T(1500); }
  await T(1500); const pi = await P(); row.note = `xuống bến ${[pi.x, pi.z].map(Math.round)}`;
  let r = await walkTo(LH.door[0], LH.door[1], { sec: 60, run: true }); row.note += ` cửa tháp ${r.ok}`; if (!r.ok) throw new Error('không tới được cửa tháp ' + JSON.stringify(r));
  // leo cầu thang xoắn: đi vòng ngược chiều kim đồng hồ (theo hệ e,n của tháp), bám bán kính lối đi
  const t0 = Date.now(); let top = 0;
  while (Date.now() - t0 < 240000) {
    const s = await ev(async () => { const pl = await import('/js/island/lighthouse/plan.js'), q = __island.player.pos, [e, n] = pl.toLocal(q.x, q.z), yr = q.y - pl.Y0, th = Math.atan2(n, e);
      const r = pl.rIn(Math.max(0, yr)) - 0.6, th2 = th + 0.5, w = pl.toWorld(Math.cos(th2) * r, Math.sin(th2) * r); return { w, yr, deck: pl.T.DECK, r: Math.hypot(e, n) }; });
    top = Math.max(top, s.yr); if (s.yr >= s.deck - 0.5) break;
    if (TOUCH) { const p = await P(), dx = s.w[0] - p.x, dz = s.w[1] - p.z, d = Math.hypot(dx, dz) || 1, y = p.yaw; await joyTo((dx / d * Math.cos(y) - dz / d * Math.sin(y)) * 40, (dx / d * Math.sin(y) + dz / d * Math.cos(y)) * 40); }
    else { await ev(w => { const p = __island.player, dx = w[0] - p.pos.x, dz = w[1] - p.pos.z; p.cam.yaw = Math.atan2(-dx, -dz); }, s.w); await page.keyboard.down('KeyW'); }
    await T(200);
  }
  if (TOUCH) await joyUp(); else await page.keyboard.up('KeyW');
  const deck = await ev(async () => (await import('/js/island/lighthouse/plan.js')).T.DECK);
  row.note += ` cao nhất ${top.toFixed(1)}/${deck.toFixed(1)} m`; await shot('dinh-hai-dang');
  if (top < deck - 0.5) throw new Error('không leo tới đỉnh');
});
await run('village', 'Làng chài Vịnh Én: đi bộ dọc cầu tàu', async row => {
  const V = await ev(async () => { const s = await import('/js/island/sea/site.js'); return { a: s.toW(-12, s.PIER_V), b: s.toW(30, s.PIER_V) }; });
  await goNear(V.a[0], V.a[1]); const r = await walkTo(V.b[0], V.b[1], { sec: 30 }); row.note = JSON.stringify(r); await shot('lang-chai');
  if (!r.ok) throw new Error('không đi hết cầu tàu');
});
await run('spell', 'Vòng phép: mở vòng ✨ → chọn 1 phép → phép được thi triển', async row => {
  await ev(() => { const m = __island.academy && __island.academy.magic; if (m && !localStorage.getItem('academy.wand') && m.setWand) m.setWand(); });
  await goNear(...AC.yard);
  const m0 = await ev(() => { const m = __island.academy.magic; window.__cast = 0; m.onCast && m.onCast(() => window.__cast++); return m.mana; });
  if (TOUCH) { const r = await rectOf('#bSpell'); if (!r) throw new Error('không thấy nút ✨'); await touch('touchStart', [{ x: r[0], y: r[1], id: 4 }]); await T(700);
    const ring = await ev(() => { const b = document.querySelector('#mgRing [data-id],#mgRing button,#mgRing .it'); if (!b) return null; const q = b.getBoundingClientRect(); return [q.x + q.width / 2, q.y + q.height / 2]; });
    if (ring) { await touch('touchMove', [{ x: ring[0], y: ring[1], id: 4 }]); await T(300); } await touch('touchEnd', []); row.note = ring ? 'chọn trong vòng' : 'không thấy vòng phép';
  } else { if (await rectOf('#mgkPick')) { await tap('#mgkPick'); await T(800); row.note = (await rectOf('#mgRing')) ? 'vòng mở' : 'vòng KHÔNG mở'; await key('Escape'); } await key('Digit1'); }
  await T(1500); const c = await ev(() => ({ n: window.__cast, mana: __island.academy.magic.mana }));
  row.note += ` phép ${c.n}, năng lượng ${m0}→${c.mana}`; if (!c.n && c.mana >= m0) throw new Error('không thi triển được phép');
});
await run('map', 'Bản đồ M: mở → ✕ đóng', async row => {
  await goNear(...L.spawn);
  if (TOUCH) { await tap('#bMore'); await T(400); await tap('#bMap'); } else await key('KeyM');
  await T(1500); if (!(await ev(() => !!(__island.worldMap.open || __island.mapOpen)))) throw new Error('bản đồ không mở');
  const a = await uiAudit('#wmap'); if (a.off.length || a.over.length) row.note = JSON.stringify(a); await shot('ban-do');
  await tap('#wmap .x'); await T(800); if (await ev(() => !!(__island.worldMap.open || __island.mapOpen))) throw new Error('✕ không đóng bản đồ');
  const h = await health(); if (h.frozen || h.modal) throw new Error('đóng bản đồ vẫn khoá');
  if (a.off.length || a.over.length) return false;
});
await run('time', 'Đổi giờ ☀️ (☰ → Ánh sáng & giờ → 🌙 Tối) + mưa', async row => {
  await tap('#bMore'); await T(400); await tap('#bBright'); await T(800);
  await tap('#tMode button[data-t="20.5"]'); await T(4000);
  const n = await ev(() => ({ night: __island.sky.state.night, hour: +__island.sky.state.hour.toFixed?.(1) || __island.sky.state.hour })); row.note = JSON.stringify(n);
  const a = await uiAudit('#brightBox'); if (a.off.length || a.over.length) row.note += JSON.stringify(a);
  await closeAll(); await ev(() => __island.weather.set('rain')); await T(4000); row.note += ' mưa: ' + (await ev(() => __island.weather.type)) + ' (không có nút mưa cho người chơi)';
  await shot('dem-mua'); await walkTo((await P()).x + 6, (await P()).z, { sec: 5 });
  await ev(() => __island.weather.set('clear')); await tap('#bMore'); await T(400); await tap('#bBright'); await T(600); await tap('#tMode button[data-t="12.5"]'); await T(800); await closeAll();
  if (!n.night && !(n.hour > 19)) throw new Error('không chuyển sang đêm');
});
await run('photo', '📷 Chụp ảnh con vật (sổ tay thiên nhiên ghi nhận)', async row => {
  const n0 = await ev(() => { try { return Object.keys(JSON.parse(localStorage.getItem('island.nature') || '{}').photo || {}).length; } catch (e) { return 0; } });
  const spots = await ev(() => { const out = []; const W = __island.wild; if (W && W.actors) for (const A of W.actors) { const q = A.root.position; if (A.S && !A.S.fly && !A.S.sea) out.push([q.x, q.z]); } return out.sort(() => Math.random() - 0.5).slice(0, 6); });
  if (!spots.length) throw new Error('không có con vật nào trong thế giới (wild.actors)');
  let ok = false;
  for (const sp of spots) {
    await goNear(sp[0] + 8, sp[1] + 8); await T(2500);
    if (!(await tap('#bCam', { must: false }))) { row.note += ' không thấy nút 📷'; break; }
    await T(1500); const aim = await rectOf('#natCam'); if (!aim) { await closeAll(); continue; }
    await tap('#bCam', { must: false }) || await tapText(/📷|Chụp/, '#natCam', { must: false }); await T(2000);
    const n1 = await ev(() => { try { return Object.keys(JSON.parse(localStorage.getItem('island.nature') || '{}').photo || {}).length; } catch (e) { return 0; } });
    await closeAll(); if (n1 > n0) { ok = true; row.note += ` ảnh ${n0}→${n1}`; break; }
  }
  if (!ok) throw new Error('không chụp được con vật nào');
});
await run('save', 'Lưu → tải lại trang → Chơi khách → tiến độ còn nguyên', async row => {
  const s0 = await ev(() => ({ gold: __island.eco.gold(), own: (__island.account.profile.own || []).length, house: __island.houses && __island.houses.houseId(), av: localStorage.getItem('island.avatar') }));
  await page.reload(); await page.waitForFunction(() => window.__island && __island.school && __island.school.ready && __island.warmed, null, { timeout: 600000 });
  if (TOUCH) cdp = await ctxB.newCDPSession(page);
  await installWatch();
  await page.waitForSelector('#accBox:not([hidden]) [data-a="guest"]', { timeout: 30000 }).catch(() => {});
  if (await rectOf('#accBox [data-a="guest"]')) await tap('#accBox [data-a="guest"]');
  await T(3000); await clearUi(20);
  const s1 = await ev(() => ({ gold: __island.eco.gold(), own: (__island.account.profile.own || []).length, house: __island.houses && __island.houses.houseId(), av: localStorage.getItem('island.avatar'), intro: !!document.getElementById('intro') }));
  row.note = JSON.stringify({ s0: { ...s0, av: !!s0.av }, s1: { ...s1, av: !!s1.av } });
  if (s1.intro) throw new Error('clip mở đầu chiếu lại sau khi đã xem');
  if (s1.gold !== s0.gold || s1.own !== s0.own || s1.house !== s0.house || s1.av !== s0.av) throw new Error('tiến độ không giữ sau khi tải lại');
});
await run('ui', 'Rà giao diện lần cuối: nút chồng / tràn / chữ cắt / nút nhỏ', async row => {
  await closeAll(); await goNear(...L.spawn); await T(2000);
  const a = await uiAudit(); row.note = JSON.stringify(a).slice(0, 600); await shot('hud');
  if (a.over.length || a.off.length || a.clip.length) return false;
});

export { };
// ---------- tổng kết ----------
const pass = results.filter(r => r.ok).length;
log(`\n===== [${tag}] ${pass}/${results.length} PASS · ${Math.round((Date.now() - t0) / 1000)} s =====`);
for (const r of results) log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.id.padEnd(10)} ${r.note.slice(0, 200)}`);
if (JSONF) fs.writeFileSync(JSONF, JSON.stringify({ size: SIZE, view: VIEW, results }, null, 1));
await browser.close();
process.exit(pass === results.length ? 0 : 1);
