const { chromium } = require('playwright');
(async () => {
  const [,, url, out] = process.argv;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); p.on('console', m => { if (m.type() === 'error' || m.type()==='warning') console.log(m.text()); });
  await p.goto(url); await p.waitForFunction(() => window.kitDone, null, { timeout: 300000 });
  const data = await p.evaluate(() => document.getElementById('sheet').toDataURL('image/png'));
  require('fs').writeFileSync(out, Buffer.from(data.split(',')[1], 'base64')); await b.close();
})();
