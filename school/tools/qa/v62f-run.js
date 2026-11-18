// v62f: chạy chuỗi bước trên game: node tools/qa/v62f-run.js <w> <h> <touch 0|1> <bước...>
// bước: "wait:ms" | "shot:file.png" | "tap:x,y" | "swipe:x,y,dx,dy,ms" | mã JS (chạy trong scope game, in kết quả)
const {openGame, login, owner} = require('./qa-lib');
(async () => {
  const [w, h, t, ...steps] = process.argv.slice(2);
  const {b, p, logs} = await openGame({w:+w, h:+h, touch:t === '1'}); await login(p, process.env.QA_USER || 'robo_qa'); await owner(p);
  for(const s of steps){
    if(s.startsWith('wait:')) await p.waitForTimeout(+s.slice(5));
    else if(s.startsWith('shot:')) await p.screenshot({path:s.slice(5)});
    else if(s.startsWith('load:')) await p.evaluate(c => window.__dbg(c), require('fs').readFileSync(s.slice(5), 'utf8'));
    else if(s.startsWith('key:')){ const [k, ms] = s.slice(4).split(','); await p.keyboard.down(k); await p.waitForTimeout(+ms); await p.keyboard.up(k); }
    else if(s.startsWith('tap:')){ const [x, y] = s.slice(4).split(',').map(Number); await p.mouse.click(x, y); }
    else if(s.startsWith('swipe:')){ const [x, y, dx, dy, ms] = s.slice(6).split(',').map(Number); await p.mouse.move(x, y); await p.mouse.down(); const n = 20; for(let i = 1; i <= n; i++){ await p.mouse.move(x + dx*i/n, y + dy*i/n); await p.waitForTimeout(ms/n); } await p.mouse.up(); }
    else { const r = await p.evaluate(async c => { try { let v = window.__dbg(c); if(v && v.then) v = await v; return JSON.stringify(v); } catch(e){ return 'ERR ' + e.message; } }, s); console.log('>', s.slice(0, 60), '=>', String(r).slice(0, +(process.env.QA_MAX || 1500))); }
  }
  console.log('LOGS', JSON.stringify(logs).slice(0, 3000)); await b.close();
})();
