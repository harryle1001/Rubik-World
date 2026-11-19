// tools/ride-warp-test.mjs — Bấm 🏫 Đến trường khi đang trên phương tiện (thuyền Học viện, khinh khí cầu, chổi, máy bay):
// sau 3 s người chơi phải ở cổng trường (xuống xe) hoặc được báo "tới nơi rồi bấm lại" — KHÔNG được bị kéo ra giữa biển.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const errors = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1' });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.goto('http://localhost:3000/');
await page.waitForFunction(() => window.__island && __island.school && __island.school.ready && __island.warmed, null, { timeout: 300000 });
for (let k = 0; k < 20; k++) { const busy = await page.evaluate(() => { const g = document.querySelector('#accBox:not([hidden]) [data-a="guest"]'); if (g) g.click(); const s = document.querySelector('[data-s]'); if (s && s.offsetParent) s.click(); return !!g || document.body.classList.contains('st-cut') || __island.player.frozen; }); if (!busy) break; await page.waitForTimeout(700); }
await page.evaluate(() => { __island.post.render = () => {}; const t = __island.toast; __island.toast = (m, ...a) => { (window.__toasts = window.__toasts || []).push(String(m).replace(/<[^>]+>/g, '')); return t(m, ...a); }; });   // không vẽ: đủ khung logic
const L = await page.evaluate(async () => { const l = await import('/js/island/layout.js'); return { spawn: l.SPAWN, W: __island.CFG ? 0 : 0 }; });
const cases = [
  ['⛵ Thuyền Học viện', `c.ferry.start(1)`],
  ['🎈 Khinh khí cầu (đang bay)', `c.vehicles.toggleBalloon(); setTimeout(() => { c.player.vehicle && (c.player.vehicle.lift = 3); }, 300)`],
  ['🧹 Chổi bay', `c.brooms.summon()`],
  ['✈️ Máy bay', `c.aircraft.board()`],
];
const rows = [];
for (const [name, code] of cases) {
  await page.evaluate(() => { const c = __island; if (c.ferry.riding) c.ferry.seek(1e6); if (c.aircraft.flying) c.aircraft.land && c.aircraft.land(); }); await page.waitForTimeout(1500);
  await page.evaluate(() => { const c = __island; c.vehicles.forceOff && c.vehicles.forceOff(); document.getElementById('bSchool').click(); window.__toasts = []; });
  await page.waitForTimeout(1500);
  const ok = await page.evaluate(code => { const c = __island; try { eval(code); return 'ok'; } catch (e) { return e.message; } }, code);
  await page.waitForTimeout(6000);
  const before = await page.evaluate(() => { const p = __island.player.pos; return [Math.round(p.x), Math.round(p.z), Math.round(p.y)]; });
  await page.evaluate(() => document.getElementById('bSchool').click());
  await page.waitForTimeout(3000);
  const r = await page.evaluate(sp => { const c = __island, p = c.player.pos; return { pos: [Math.round(p.x), Math.round(p.z), Math.round(p.y)], dGate: Math.round(Math.hypot(p.x - sp[0], p.z - sp[1])), ground: +Math.max(c.terrain.heightAt(p.x, p.z), c.groundExtra ? c.groundExtra(p.x, p.z, 99) : -99).toFixed(1), vehicle: !!c.player.vehicle, toast: (window.__toasts || []).slice(-1)[0] || '' }; }, L.spawn);
  rows.push({ name, start: ok, before, ...r, toast: r.toast.slice(0, 50) });
}
console.table(rows);
console.log(errors.length ? 'LỖI CONSOLE:\n' + errors.join('\n') : 'Không lỗi console');
await browser.close();
