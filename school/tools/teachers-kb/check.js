// node tools/teachers-kb/check.js <id>  — kiểm tra 1 file kho kiến thức theo SCHEMA.md
const fs = require('fs'), path = require('path');
const ids = process.argv.slice(2); let bad = 0;
for(const id of ids){
  const f = path.join(__dirname, id + '.json'), E = m => { console.log(`[${id}] ✗ ${m}`); bad++; };
  let J; try { J = JSON.parse(fs.readFileSync(f, 'utf8')); } catch(e){ E('JSON lỗi: ' + e.message); continue; }
  const T = J.topics || []; if(T.length !== 6) E('topics phải = 6');
  const cnt = (L, k) => { const o = {}; L.forEach(x => o[x[k]] = (o[x[k]] || 0) + 1); return o; };
  const C = J.cards || [], Q = J.quiz || [];
  if(C.length < 66) E('cards < 66: ' + C.length); if(Q.length < 66) E('quiz < 66: ' + Q.length);
  for(const [nm, L] of [['cards', C], ['quiz', Q]]){
    const tp = cnt(L, 'tp'), lv = cnt(L, 'lv');
    T.forEach((_, i) => { if((tp[i] || 0) < 10) E(`${nm} chủ đề ${i} < 10 (${tp[i] || 0})`); });
    [1, 2, 3].forEach(l => { if((lv[l] || 0) < 18) E(`${nm} cấp ${l} < 18 (${lv[l] || 0})`); });
  }
  C.forEach((c, i) => { if(!(c.tp >= 0 && c.tp < 6) || ![1, 2, 3].includes(c.lv) || !c.t || !c.vi || c.vi.length < 80 || !Array.isArray(c.en) || !c.en.length) E('card ' + i + ' sai trường/nội dung ngắn'); if(c.t && c.t.length > 60) E('card ' + i + ' tiêu đề dài'); });
  const cc = [0, 0, 0, 0], seenQ = new Set();
  Q.forEach((q, i) => { if(!(q.tp >= 0 && q.tp < 6) || ![1, 2, 3].includes(q.lv) || !q.q || !Array.isArray(q.a) || q.a.length !== 4 || !(q.c >= 0 && q.c < 4) || !q.why) { E('quiz ' + i + ' sai trường'); return; }
    if(new Set(q.a.map(s => String(s).trim().toLowerCase())).size !== 4) E('quiz ' + i + ' đáp án trùng'); cc[q.c]++; if(seenQ.has(q.q)) E('quiz ' + i + ' câu hỏi trùng'); seenQ.add(q.q);
    if(q.a.some(s => String(s).length > 70)) E('quiz ' + i + ' đáp án quá dài'); });
  if(Math.max(...cc) > Q.length * .4) E('đáp án đúng dồn một chỗ: ' + cc);
  if((J.stories || []).length < 8) E('stories < 8'); if((J.lessons || []).length < 10) E('lessons < 10');
  (J.lessons || []).forEach((l, i) => { if(!l.t || !l.vi || !l.try) E('lesson ' + i + ' thiếu trường'); });
  console.log(`[${id}] cards ${C.length} · quiz ${Q.length} · stories ${(J.stories || []).length} · lessons ${(J.lessons || []).length} · đáp án ${cc}`);
}
process.exit(bad ? 1 : 0);
