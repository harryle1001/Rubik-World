// Chạy Robo Thám Tử ở 3 cỡ màn hình, lưu JSON + ảnh từng lỗi vào tools/qa/out/<nhãn>/
// Dùng: (từ school/) python3 -m http.server 8754  rồi  node tools/qa/run.js [nhãn=before] [vp=all|phone|land|desk] [max]
const fs = require('fs'), path = require('path');
const {chromium} = require('playwright');
const {openGame, login, owner} = require('./qa-lib');
const VPS = {phone:{w:390, h:844, touch:true}, land:{w:844, h:390, touch:true}, desk:{w:1440, h:900}};
const tag = process.argv[2] || 'before', pick = process.argv[3] || 'all', max = +process.argv[4] || 0, only = process.argv[5] ? process.argv[5].split(',') : null;

(async () => {
  const b = await chromium.launch();
  const list = pick === 'all' ? Object.keys(VPS) : pick.split(',');
  for(const k of list){
    const vp = VPS[k], dir = path.join(__dirname, 'out', tag, k); fs.mkdirSync(dir, {recursive:true});
    const {ctx, p, logs} = await openGame(vp, {browser:b});
    await login(p); await owner(p);
    let shots = 0;
    await p.exposeFunction('__v54qShot', async (id, sev, title) => { if(shots >= 45) return; shots++; try { await p.screenshot({path:path.join(dir, `issue-${id}.png`)}); } catch(e){} });
    await p.exposeFunction('__v54qStep', (i, n, name) => { if(i % 10 === 0 || i === n - 1) console.log(`[${k}] ${i + 1}/${n} ${name}`); });
    const t0 = Date.now();
    const rep = await p.evaluate(([max, only]) => window.__dbg(`v54qStart(${JSON.stringify({max, only})})`), [max, only]);
    if(!rep){ console.log('Robo không chạy được ở', k); continue; }
    rep.secs = Math.round((Date.now() - t0)/1000); rep.vpKey = k; rep.consoleLogs = logs;
    await p.evaluate(() => window.__dbg('v54qOpen()')); await p.waitForTimeout(400);
    await p.screenshot({path:path.join(dir, 'panel.png')});
    fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(rep, null, 1));
    console.log(`[${k}] xong ${rep.secs}s: ${rep.issues.length} lỗi`, rep.count, 'FPS', rep.fps, 'console', logs.length);
    await ctx.close();
  }
  await b.close();
})();
