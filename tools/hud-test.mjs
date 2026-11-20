// tools/hud-test.mjs — Đo HUD: mọi phần tử fixed hiển thị, diện tích nửa trên, che vùng nhân vật (tâm ±25%), chồng nút.
// node tools/hud-test.mjs <thư-mục-ảnh> [tên=sau]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const out = process.argv[2] || 'docs/shots/hud-compact', tag = process.argv[3] || 'sau';
const VIEWS = [
  { n: 'doc-390x844', w: 390, h: 844, mob: true },
  { n: 'doc-360x740', w: 360, h: 740, mob: true },
  { n: 'ngang-844x390', w: 844, h: 390, mob: true },
  { n: 'pc-1440x900', w: 1440, h: 900, mob: false },
];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let fail = 0;
for (const v of VIEWS) {
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, isMobile: v.mob, hasTouch: v.mob, deviceScaleFactor: 1, ...(v.mob ? { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1' } : {}) });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.addInitScript(() => { try { localStorage.setItem('island.intro', '1'); } catch (e) {} });
  await page.goto(process.env.URL || 'http://localhost:3000/');
  await page.waitForFunction(() => window.__island && __island.school && __island.school.ready && __island.warmed, null, { timeout: 300000 });
  for (let k = 0; k < 30; k++) { const busy = await page.evaluate(() => { const g = document.querySelector('#accBox:not([hidden]) [data-a="guest"]'); if (g) g.click(); const s = document.querySelector('[data-s]'); if (s && s.offsetParent) s.click(); const n = document.querySelector('#stSay button.nx'); if (n && n.offsetParent) n.click(); const sk = document.querySelector('button.sk'); if (sk && sk.offsetParent) sk.click(); return !!g || document.body.classList.contains('st-cut') || __island.player.frozen; }); if (!busy) break; await page.waitForTimeout(700); }
  for (let k = 0; k < 16; k++) { await page.evaluate(() => { const n = document.querySelector('#stSay button.nx'); if (n && n.offsetParent) n.click(); }); await page.waitForTimeout(500); }
  await page.waitForTimeout(1500);
  // thử bật chế độ bay (chổi) để hiện nút ⬆/⬇
  const shot = async (suffix) => page.screenshot({ path: `${out}/${tag}-${v.n}${suffix}.jpg`, quality: 80 });
  await shot('');
  const m = await page.evaluate(() => {
    const W = innerWidth, H = innerHeight, els = [];
    for (const e of document.body.querySelectorAll('*')) {
      if (e.tagName === 'CANVAS' || e.tagName === 'SCRIPT') continue;
      const cs = getComputedStyle(e); if (cs.position !== 'fixed' && cs.position !== 'absolute') continue;
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) continue;
      const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.right <= 0 || r.bottom <= 0 || r.left >= W || r.top >= H) continue;
      // bỏ con nằm trong phần tử fixed khác
      let p = e.parentElement, inner = false; while (p && p !== document.body) { const pc = getComputedStyle(p); if (pc.position === 'fixed' && pc.display !== 'none') { inner = true; break; } p = p.parentElement; } if (inner) continue;
      if (r.width >= W * 0.95 && r.height >= H * 0.95) continue; // lớp phủ toàn màn hình
      els.push({ id: e.id || e.className || e.tagName, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), btn: e.tagName === 'BUTTON' || !!e.querySelector('button') });
    }
    // diện tích nửa trên (lưới 4px, hợp các hình)
    let top = 0, centre = [];
    const cx0 = W * .25, cx1 = W * .75, cy0 = H * .25, cy1 = H * .75;
    for (let y = 0; y < H / 2; y += 4) for (let x = 0; x < W; x += 4) if (els.some(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h)) top++;
    for (const r of els) if (r.x < cx1 && r.x + r.w > cx0 && r.y < cy1 && r.y + r.h > cy0) centre.push(r.id);
    // chồng nhau giữa các nút
    const btns = [...document.querySelectorAll('button')].filter(b => { const cs = getComputedStyle(b); const r = b.getBoundingClientRect(); return r.width > 2 && cs.visibility !== 'hidden' && b.offsetParent !== null; }).map(b => { const r = b.getBoundingClientRect(); return { id: b.id || b.textContent.trim().slice(0, 12), r }; });
    const ov = [];
    for (let i = 0; i < btns.length; i++) for (let j = i + 1; j < btns.length; j++) { const a = btns[i].r, b = btns[j].r; const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); if (ix > 1 && iy > 1 && !(a.left >= b.left && a.right <= b.right && a.top >= b.top && a.bottom <= b.bottom) && !(b.left >= a.left && b.right <= a.right && b.top >= a.top && b.bottom <= a.bottom)) ov.push(btns[i].id + '×' + btns[j].id); }
    return { els, topPct: +(top * 16 / (W * H) * 100).toFixed(1), centre, ov };
  });
  console.log(`\n== ${v.n}: HUD nửa trên ${m.topPct}% màn hình · che vùng nhân vật: ${m.centre.join(', ') || 'không'} · nút chồng: ${m.ov.join(', ') || 'không'}`);
  for (const e of m.els) console.log(`   ${String(e.id).slice(0, 30).padEnd(30)} ${e.x},${e.y} ${e.w}×${e.h}`);
  // bay: hiện ⬆/⬇ rồi đo chồng nút
  const fly = await page.evaluate(async () => { const $ = id => document.getElementById(id); $('bUp').hidden = $('bDown').hidden = false; $('bJump').hidden = true; $('bStyle').hidden = $('bBell').hidden = false; $('bAct').hidden = false; $('bAct').innerHTML = '<i>🚪</i><span class="cap">Vào lớp học</span>'; await new Promise(r => setTimeout(r, 300)); const btns = [...document.querySelectorAll('button')].filter(b => b.offsetParent !== null && getComputedStyle(b).visibility !== 'hidden').map(b => { const r = b.getBoundingClientRect(); return { id: b.id || b.textContent.trim().slice(0, 12), r }; }); const ov = []; for (let i = 0; i < btns.length; i++) for (let j = i + 1; j < btns.length; j++) { const a = btns[i].r, c = btns[j].r; const ix = Math.min(a.right, c.right) - Math.max(a.left, c.left), iy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top); if (ix > 1 && iy > 1) ov.push(btns[i].id + '×' + btns[j].id); } return { up: !document.getElementById('bUp').hidden, ov }; });
  await shot('-bay');
  await page.evaluate(() => { const $ = id => document.getElementById(id); $('bUp').hidden = $('bDown').hidden = true; $('bJump').hidden = false; $('bStyle').hidden = $('bBell').hidden = true; });
  // 📷: chạm → ngắm con vật gần nhất (hoặc chụp ảnh thường), chạm ✖/Esc để thoát
  const cam = await page.evaluate(async () => { const b = document.getElementById('bCam'); if (!b || !b.getClientRects().length) return 'không có nút 📷'; b.click(); await new Promise(r => setTimeout(r, 1200)); const r = document.getElementById('natCam') && !document.getElementById('natCam').hidden ? 'ngắm: ' + document.querySelector('#natCam .lb').textContent : __island.photoMode ? 'chụp ảnh thường' : '?'; return r; });
  await shot('-cam');
  await page.evaluate(() => { const x = document.querySelector('#natCam .x'); if (x && x.offsetParent) x.click(); if (__island.photo && __island.photo.on) __island.photo.exit(); });
  // viên nhiệm vụ: chạm mở chi tiết
  await page.evaluate(() => { const p = document.getElementById('hudPill'); p && p.click(); }); await page.waitForTimeout(400); await shot('-nhiemvu');
  const pillTxt = await page.evaluate(() => { const p = document.getElementById('hudPill'); return p ? p.textContent : '-'; });
  await page.evaluate(() => document.getElementById('bMore').click()); await page.waitForTimeout(300); await shot('-menu');
  console.log(`   📷: ${cam} · viên: ${pillTxt}`);
  console.log(`   bay chổi: nút ⬆ ${fly.up ? 'hiện' : 'ẩn'} · nút chồng: ${fly.ov.join(', ') || 'không'}`);
  if (fly.ov.length || m.ov.length) fail++;
  if (v.mob && v.w < v.h && (m.topPct > 12 || m.centre.length)) fail++;
  console.log(errors.length ? '   LỖI CONSOLE:\n   ' + errors.join('\n   ') : '   Không lỗi console');
  if (errors.length) fail++;
  await ctx.close();
}
await browser.close();
console.log(fail ? `\n❌ ${fail} lỗi` : '\n✅ đạt');
