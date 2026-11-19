// tools/play-mg.cjs — Vào/thoát 8 mini game 3D (cả bản ghé thăm mg/visit), chạm 1 khối Coach Ru & trả lời; kiểm không iframe, không tải file 2D, không lỗi console.
// Chạy: node server/index.js &  rồi  node tools/play-mg.cjs [--mobile]  (ảnh vào docs/img/no-2d/)
const { chromium } = require('playwright');
const MOB = process.argv.includes('--mobile'), OUT = 'docs/img/no-2d/';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(MOB ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } : { viewport: { width: 1280, height: 800 } });
  const errs = [], reqs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('request', r => { if (/\/school\/|world-2d|phaser/.test(r.url())) reqs.push(r.url()); });
  await p.goto('http://localhost:3000/');
  await p.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 300000 });
  const g = p.locator('#accBox:not([hidden])').getByText(/Chơi khách/); if (await g.count()) await g.first().click({ force: true }).catch(() => {});
  await p.waitForFunction(() => __island.warmed, null, { timeout: 300000 }).catch(() => {}); await p.waitForTimeout(3000);
  const r = await p.evaluate(async () => { const { doorKey } = await import('/js/island/mg/host.js'); const c = __island, G = c.miniGames;
    return { n: c.school.doors.length, iframes: document.querySelectorAll('iframe').length, missing: c.school.doors.filter(q => !G[doorKey(c, q.d)]).map(q => q.d.n) }; });
  console.log(MOB ? 'MOBILE' : 'DESKTOP', JSON.stringify(r));
  const pre = MOB ? 'phone-' : 'desk-';
  const tag = MOB ? 'phone' : 'desk';
  for (const want of ['Tham quan Nhà sàn', 'Chú Bình · Lửa trại BBQ', 'Chị Ngọc · Trung tâm thương mại', 'Coach Ru', 'Thư viện Tri Thức', 'Bác Năm · Nông trại', 'Nhà của Quân', 'Bàn cờ Ikigai']) {
    const ok = await p.evaluate(async w => { const { doorKey } = await import('/js/island/mg/host.js'); const c = __island, q = c.school.doors.find(q => q.d.n.includes(w)); if (!q) return 'no door';
      c.player.teleport(q.x, q.z + 1.5); const k = doorKey(c, q.d); return k + ':' + c.mg.start(k, q); }, want);
    await p.waitForTimeout(/Nhà sàn|BBQ|thương mại|Coach|Thư viện/.test(want) ? 34000 : 8000);
    const st = await p.evaluate(() => ({ active: __island.mg.active, key: __island.mg.key, hud: !document.getElementById('mgHud')?.hidden, msg: document.querySelector('#mgHud .mg-msg')?.textContent.slice(0, 80) }));
    if (/Nhà sàn|BBQ|thương mại|Coach|Thư viện/.test(want)) await p.screenshot({ path: OUT + pre + want.replace(/[^a-zA-Z]+/g, '-').toLowerCase().slice(0, 21) + '.png' });
    if (want === 'Thư viện Tri Thức') { const n = await p.evaluate(async () => (await (await import('/js/island/mg/arts/books.js')).loadBooks()).length); const t = await p.evaluate(async () => { const B = await import('/js/island/mg/arts/books.js'); const l = await B.loadBooks(); const big = l.find(x => x.big); return big ? ((await B.bookText(big)) || '').length : -1; }); console.log('  books', n, 'bigText', t); }
    if (want === 'Coach Ru') { // chạm 1 khối (vùng chạm ẩn) → nhân vật đi tới → bấm đáp án
      const pt = await p.evaluate(async () => { const T = await import('three'); const c = __island; let h = null; c.scene.traverse(o => { if (!h && o.isMesh && o.material && o.material.visible === false && o.geometry.type === 'CylinderGeometry' && o.geometry.parameters.radiusTop === 0.89) h = o; });
        if (!h) return null; const v = h.getWorldPosition(new T.Vector3()).project(c.camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; });
      console.log('  hit at', JSON.stringify(pt));
      if (pt) { const cv = await p.$('canvas'); await p.evaluate(([x, y]) => { const cv = __island.renderer.domElement; for (const t of ['pointerdown', 'pointerup']) cv.dispatchEvent(new PointerEvent(t, { pointerId: 9, clientX: x, clientY: y, bubbles: true, isPrimary: true, pointerType: 'mouse', button: 0 })); }, pt);
        await p.waitForTimeout(21000); const q = await p.evaluate(() => ({ msg: document.querySelector('#mgHud .mg-msg')?.textContent, btns: [...document.querySelectorAll('#mgHud button')].map(b => b.textContent) })); console.log('  question', JSON.stringify(q));
        await p.screenshot({ path: OUT + pre + 'coach-question.png' });
        await p.evaluate(() => { const b = [...document.querySelectorAll('#mgHud .mg-bar button')][0]; b && b.click(); }); await p.waitForTimeout(2500);
        console.log('  after answer', await p.evaluate(() => document.querySelector('#mgHud .mg-info')?.textContent + ' | ' + document.querySelector('#mgHud .mg-msg')?.textContent)); } }
    await p.evaluate(() => __island.mg.active && __island.mg.exit()); await p.waitForTimeout(1500);
    const after = await p.evaluate(() => ({ active: __island.mg.active, frozen: __island.player.frozen }));
    console.log(' ', want, ok, JSON.stringify(st), '→ thoát', JSON.stringify(after));
  }
  await p.evaluate(() => document.getElementById('bSchool').click()); await p.waitForTimeout(3000); await p.screenshot({ path: OUT + pre + 'school-gate.png' });
  await p.evaluate(() => document.getElementById('bMenu').click()); await p.waitForTimeout(800); await p.screenshot({ path: OUT + pre + 'menu.png' });
  console.log('ERR', JSON.stringify(errs), 'REQ2D', JSON.stringify(reqs)); await b.close();
})();
