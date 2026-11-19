// v64m: chụp một cảnh. node tools/qa/v64m-shot.js <w> <h> <touch 0|1> <out.png> [code chạy trong game] [chờ ms]
const {openGame, login} = require('./qa-lib');
(async () => { const [w, h, t, out, code, wait] = process.argv.slice(2);
  const {b, p, logs} = await openGame({w:+w, h:+h, touch:t === '1'}); await login(p);
  if(code){ const r = await p.evaluate(c => window.__dbg(c), code); if(r !== undefined) console.log(JSON.stringify(r).slice(0, 3000)); }
  await p.waitForTimeout(+(wait || 1500)); await p.screenshot({path:out});
  console.log('logs', JSON.stringify(logs.filter(l => !/GL Driver/.test(l.s))).slice(0, 2000)); await b.close(); })();
