// Lưu chân dung + thông tin 10 thầy cô ra out/teachers.json (cho báo cáo HTML)
const fs = require('fs'), path = require('path'); const {openGame} = require('../qa-lib');
(async () => { const {b, p} = await openGame({w:800, h:600});
  const J = await p.evaluate(() => window.__dbg("JSON.stringify(V62K_T.map((d, i) => ({id:d.id, n:d.n, s:d.s, ic:d.ic, mission:d.qa.t, img:v62kSpr({def:d, id:d.id}, 0, 6).toDataURL()})))"));
  fs.mkdirSync(path.join(__dirname, 'out'), {recursive:true}); fs.writeFileSync(path.join(__dirname, 'out', 'teachers.json'), J); console.log('ok', JSON.parse(J).length); await b.close(); })();
