// v63f: chụp nhanh một cảnh để soi bố cục. node tools/qa/v63f-look.js <w> <h> <touch 0|1> <out.png> [code chạy trong game]
const {openGame, login} = require('./qa-lib');
(async () => { const [w, h, t, out, code] = process.argv.slice(2);
  const {b, p, logs} = await openGame({w:+w, h:+h, touch:t === '1'}); await login(p);
  if(code){ const r = await p.evaluate(c => window.__dbg(c), code); if(r !== undefined) console.log(JSON.stringify(r)); }
  await p.waitForTimeout(1200); await p.screenshot({path:out}); console.log('logs', JSON.stringify(logs.filter(l => !/GL Driver/.test(l.s)))); await b.close(); })();
