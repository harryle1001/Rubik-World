// 10 thầy cô chơi thử & báo lỗi (v62k) ở 3 cỡ màn hình → tools/qa/teachers/out/<vp>/report.json + ảnh lỗi
// Dùng: (từ school/) python3 -m http.server 8754  rồi  node tools/qa/teachers/run.js [vp=all|phone|land|desk] [id,id…]
const fs = require('fs'), path = require('path');
const {chromium} = require('playwright');
const {openGame, login, owner} = require('../qa-lib');
const VPS = {phone:{w:390, h:844, touch:true}, land:{w:844, h:390, touch:true}, desk:{w:1440, h:900}};
const pick = process.argv[2] || 'all', ids = process.argv[3] ? process.argv[3].split(',') : null;
(async () => {
  const b = await chromium.launch();
  for(const k of (pick === 'all' ? Object.keys(VPS) : pick.split(','))){
    const vp = VPS[k], dir = path.join(__dirname, 'out', k); fs.mkdirSync(dir, {recursive:true});
    const {ctx, p, logs} = await openGame(vp, {browser:b}); await login(p); await owner(p);
    const per = {};
    await p.exposeFunction('__v54qShot', async (id) => { const t = await p.evaluate(() => window.__dbg('V62K.qa.cur ? V62K.qa.cur.id : ""')).catch(() => ''); if(!t) return;
      per[t] = (per[t] || 0) + 1; if(per[t] > 6) return; try { await p.screenshot({path:path.join(dir, `${t}-${id}.jpg`), type:'jpeg', quality:60}); } catch(e){} });
    await p.exposeFunction('__v62kStep', (t, i, n, name) => { if(i === 0 || i === n - 1) console.log(`[${k}] ${t} ${i + 1}/${n} ${name}`); });
    const t0 = Date.now();
    const rep = await p.evaluate(ids => window.__dbg(`v62kQaRun(${JSON.stringify(ids)}).then(r => r && v62kQaReport(true))`), ids);
    if(!rep){ console.log('không chạy được', k); await ctx.close(); continue; }
    rep.secs = Math.round((Date.now() - t0)/1000); rep.vpKey = k; rep.consoleLogs = logs;
    await p.waitForTimeout(500); await p.screenshot({path:path.join(dir, 'panel.png')});
    fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(rep));
    console.log(`[${k}] xong ${rep.secs}s`, rep.count, 'console', logs.length);
    await ctx.close();
  }
  await b.close();
})();
