// node tools/teachers-kb/build.js — nén từng kho JSON → js/data/v62k/kb-<id>.txt (gzip + base64), tải lười trong game
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const out = path.join(__dirname, '../../js/data/v62k'); fs.mkdirSync(out, {recursive:true}); let C = 0, Q = 0;
for(const id of ['toan', 'ly', 'hoa', 'sinh', 'su', 'dia', 'van', 'anh', 'tin', 'nghe']){
  const J = JSON.parse(fs.readFileSync(path.join(__dirname, id + '.json'), 'utf8')); C += J.cards.length; Q += J.quiz.length;
  const b = zlib.gzipSync(Buffer.from(JSON.stringify(J)), {level:9}).toString('base64'); fs.writeFileSync(path.join(out, 'kb-' + id + '.txt'), b);
  console.log(id, J.cards.length, J.quiz.length, (b.length/1024).toFixed(1) + 'KB'); }
console.log('TỔNG thẻ', C, 'câu đố', Q);
