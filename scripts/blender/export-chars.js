const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => m.type() === 'error' && console.log('C', m.text()));
  await p.goto('http://localhost:3000/tools/export-chars.html'); await p.waitForFunction(() => window.ready, null, { timeout: 30000 });
  const out = await p.evaluate(() => exportAll());
  fs.mkdirSync('chars', { recursive: true });
  for (const [k, v] of Object.entries(out)) { if (!v) { console.log('fail', k); continue; } fs.writeFileSync('chars/' + k + '.glb', Buffer.from(v, 'base64')); }
  console.log(fs.readdirSync('chars').map(f => f + ':' + fs.statSync('chars/' + f).size).join(' '));
  await b.close();
})();
