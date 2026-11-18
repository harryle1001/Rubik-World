// Mở nhanh 1 thứ trong game và chụp màn hình: node tools/qa/look.js <w> <h> <touch 0|1> "<lệnh JS>" <ảnh.png>
const {openGame, login, owner} = require('./qa-lib');
(async () => {
  const [w, h, t, cmd, out] = process.argv.slice(2);
  const {b, p, logs} = await openGame({w:+w, h:+h, touch:t === '1'}); await login(p); await owner(p);
  if(cmd) await p.evaluate(c => window.__dbg(c), cmd); await p.waitForTimeout(1500);
  await p.screenshot({path:out}); console.log(JSON.stringify(logs)); await b.close();
})();
