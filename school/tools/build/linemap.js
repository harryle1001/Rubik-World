// Đổi số dòng trong rubik-school-game.js (bản nối) → file nguồn. Dùng: node tools/build/linemap.js 21978 13120 ...
const fs = require('fs'), h = fs.readFileSync(__dirname + '/../../index.html', 'utf8');
const F = [...h.match(/const FILES = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
let line = 4; const R = F.map(f => { const n = fs.readFileSync(__dirname + '/../../' + f, 'utf8').split('\n').length; const r = [f, line, line + n - 1]; line += n; return r; });
for(const a of process.argv.slice(2)){ const L = +a + 1; const r = R.find(r => L >= r[1] && L <= r[2]); console.log(a, '→', r ? r[0] + ':' + (L - r[1] + 1) : '?'); }
