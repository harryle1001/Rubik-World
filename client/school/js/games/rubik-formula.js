// ================= EXT20: RUBIK FORMULA TABLE (right side) & COACHED PRACTICE =================
var LF = {alg:null, idx:-1, mode:null, name:'', expect:[], pos:0, wrong:0};
function labFormulas(){ return (LAB.kind === 'pyra' ? [] : TUTS.notation).concat(TUTS[LAB.kind] || []); }
function renderFormula(){
  const box = $('#labFormula'); if(!box) return; box.innerHTML = '';
  labFormulas().forEach(([t, d, alg], fi) => {
    const row = el('div', {className:'frow' + (LF.name === t ? ' on' : '')}); const h = el('b'); h.textContent = t; row.appendChild(h);
    const chips = el('div', {className:'fchips'}); parseAlg(alg).forEach((m, k) => { const c = el('span', {className:'fchip'}); c.textContent = m; if(LF.name === t){ if(k < LF.pos) c.classList.add('done'); if(k === LF.pos && LF.mode) c.classList.add('cur'); } chips.appendChild(c); }); row.appendChild(chips);
    const r = el('div', {className:'row'});
    const play = el('button', {type:'button'}); play.textContent = '▶ Xem'; play.onclick = () => formulaPlay(t, alg); r.appendChild(play);
    const step = el('button', {type:'button'}); step.textContent = 'Từng bước'; step.onclick = () => formulaStep(t, alg); r.appendChild(step);
    const coach = el('button', {type:'button', className:'primary'}); coach.textContent = 'Luyện cùng thầy'; coach.onclick = () => formulaCoach(t, alg, d); r.appendChild(coach);
    row.appendChild(r); box.appendChild(row);
  });
}
function formulaPlay(t, alg){ const ms = parseAlg(alg); LF = {name:t, alg, mode:'play', expect:ms, pos:0}; ms.forEach(m => labMove(m, false)); LF.playQ = ms.length; coachMsg(`Đang xoay mẫu "${t}": quan sát kỹ từng bước nhé.`); renderFormula(); }
function formulaStep(t, alg){ const ms = parseAlg(alg); if(LF.name !== t || LF.mode !== 'step'){ LF = {name:t, alg, mode:'step', expect:ms, pos:0}; } if(LF.pos >= ms.length){ LF.pos = 0; coachMsg('Bắt đầu lại từ bước đầu.'); renderFormula(); return; } labMove(ms[LF.pos], false); LF.pos++; coachMsg(`Bước ${LF.pos}/${ms.length}: ${ms[LF.pos - 1]} — ${moveExplain(ms[LF.pos - 1])}`); renderFormula(); }
function formulaCoach(t, alg, d){
  const ms = parseAlg(alg); labNew(LAB.kind); ms.slice().reverse().forEach(m => applyMove(LAB.P, invMove(m)));
  LF = {name:t, alg, mode:'coach', expect:ms, pos:0, wrong:0}; LAB.hist = [];
  coachMsg(`Thầy đã chuẩn bị sẵn tình huống cho "${t}". Bây giờ em hãy tự xoay theo công thức. Bước đầu tiên: ${ms[0]} — ${moveExplain(ms[0])}.`); renderFormula(); mentorSay('rubik');
}
function moveExplain(m){ const base = m.replace(/['2]/g, ''), prime = m.includes("'"), two = m.includes('2');
  const N = {U:'mặt trên', D:'mặt dưới', L:'mặt trái', R:'mặt phải', F:'mặt trước', B:'mặt sau', M:'lớp giữa dọc', E:'lớp giữa ngang', S:'lớp giữa trước', x:'cả khối theo trục R', y:'cả khối theo trục U', z:'cả khối theo trục F', Rw:'2 lớp bên phải', Lw:'2 lớp bên trái', Uw:'2 lớp trên', Fw:'2 lớp trước', r:'lớp thứ hai bên phải', u:'chóp hoặc lớp thứ hai trên', l:'chóp trái', b:'chóp sau', f:'lớp thứ hai trước'}[base] || base;
  return `xoay ${N} ${two ? '180°' : prime ? 'ngược chiều kim đồng hồ' : 'theo chiều kim đồng hồ'}`; }
function coachMsg(t){ const b = $('#labCoach'); if(b){ b.textContent = t; b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); } }
function labOnUserMove(m){
  if(LF.mode !== 'coach') return;
  const want = LF.expect[LF.pos];
  if(m === want){ LF.pos++; blipSfx(1320); if(LF.pos >= LF.expect.length){ LF.mode = null; coachMsg(`Tuyệt vời! Em đã thực hiện đúng công thức "${LF.name}". Lặp lại vài lần để tay nhớ nhé!`); reward(25, 0, `Luyện công thức ${LF.name}`); mprog('rubikcoach'); confetti(); mentorSay('rubik', 'Giỏi lắm! Kiên nhẫn từng bước nhỏ đã giúp em làm được điều lớn.', null, true); }
    else coachMsg(`Đúng rồi! Bước ${LF.pos + 1}/${LF.expect.length}: ${LF.expect[LF.pos]} — ${moveExplain(LF.expect[LF.pos])}.`); }
  else { LF.wrong++; chessSfx('illegal'); coachMsg(`Chưa đúng, không sao cả. Thầy xoay lại cho em. Em cần xoay ${want} — ${moveExplain(want)}.`); setTimeout(() => { labMove(invMove(m), false); }, 250); }
  renderFormula();
}

