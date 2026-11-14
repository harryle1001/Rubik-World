// ================= EXT45 (v40): AI Coach Ru — a friendly coach in the world who teaches by hints, speaks (tts), listens (dictation),
// remembers each student's learning in db, runs quizzes, points to chess moves, guides you places; offline hint bank when Claude is not available =================
const V40 = {home:[760, 420], x:760, y:420, dir:1, follow:0, open:false, turns:[], summary:'', busy:false, ctl:null, en:false, speak:true, attempts:0,
  sample:null, tts:null, dict:null, db:null, user:null, uid:null, toolsOK:false, prof:null, restUntil:0, pending:null};
const V40_DAY = () => new Date().toISOString().slice(0, 10);
const V40_MAX = 40;
// ---------- who the coach is, by area ----------
function v40Zone(){ const P = PLAYER; if(!P) return 'school'; const x = P.x, y = P.y, inR = k => R[k] && x >= R[k].x && x <= R[k].x + R[k].w && y >= R[k].y && y <= R[k].y + R[k].h;
  if(inR('library')) return 'library'; if(inR('farm') || inR('flowerfield')) return 'farm';
  if(['field', 'stadium', 'pool', 'archery', 'gym', 'kart', 'skate', 'patin', 'basket', 'ski'].some(inR)) return 'sports';
  if(['chess', 'rubik', 'rubikyard', 'giantchess', 'rubikpark', 'academy', 'zen', 'botanic', 'hall2p'].some(inR)) return 'brain'; return 'school'; }
const V40_ROLE = {school:['Coach Ru', 'huấn luyện viên học tập chung'], brain:['Coach Ru · Cờ & Rubik', 'huấn luyện viên cờ vua và Rubik ở Brain Zone'], sports:['Coach Ru · Thể thao', 'huấn luyện viên thể thao'], library:['Cô Ru · Thư viện', 'cô giáo dạy đọc sách ở thư viện'], farm:['Bác Ru · Nông trại', 'bác nông dân dạy về cây trồng, vật nuôi, thiên nhiên']};
// ---------- learning profile (db + local copy) ----------
const V40_LS = 'truong-coach-v40';
function v40Local(){ try { return JSON.parse(localStorage.getItem(V40_LS) || '{}'); } catch(e){ return {}; } }
function v40SaveLocal(o){ try { localStorage.setItem(V40_LS, JSON.stringify(o)); } catch(e){} }
function v40Blank(){ return {grade:0, topics:{}, weak:[], correct:0, wrong:0, streak:0, lastDay:'', lessons:{}, updated:0}; }
async function v40LoadProf(){ const L = v40Local(); V40.prof = Object.assign(v40Blank(), L.prof || {});
  if(V40.db && V40.uid){ try { const s = await V40.db.doc('learn/' + V40.uid).get(); if(s.exists){ const d = s.data() || {}; if((d.updated || 0) > (V40.prof.updated || 0)) V40.prof = Object.assign(v40Blank(), d); } } catch(e){} } }
let v40SaveT = null;
function v40Save(){ V40.prof.updated = Date.now(); const L = v40Local(); L.prof = V40.prof; v40SaveLocal(L); clearTimeout(v40SaveT);
  v40SaveT = setTimeout(async () => { if(!V40.db || !V40.uid) return; const p = V40.prof; try { await V40.db.doc('learn/' + V40.uid).set({grade:p.grade || 0, topics:p.topics, weak:p.weak.slice(0, 6), correct:p.correct, wrong:p.wrong, streak:p.streak, lastDay:p.lastDay, lessons:p.lessons, updated:p.updated, game:(PROF && PROF.name || '').slice(0, 20)}); } catch(e){}
    try { await V40.db.doc('lb/' + V40.uid).set({stars:p.correct, streak:p.streak, name:(PROF && PROF.name || '').slice(0, 20), updated:p.updated}); } catch(e){} }, 1200); }
function v40Progress(topic, result){
  const p = V40.prof, t = String(topic || 'chung').slice(0, 40), ok = /đúng|correct|right|pass|learned|xong|done/i.test(String(result));
  const T = p.topics[t] = p.topics[t] || {ok:0, bad:0, last:0}; if(ok){ T.ok++; p.correct++; } else { T.bad++; p.wrong++; } T.last = Date.now();
  p.weak = Object.entries(p.topics).filter(([, v]) => v.bad > v.ok).sort((a, b) => (b[1].bad - b[1].ok) - (a[1].bad - a[1].ok)).map(([k]) => k).slice(0, 6);
  const d = V40_DAY(); if(p.lastDay !== d){ const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10); p.streak = p.lastDay === y ? p.streak + 1 : 1; p.lastDay = d; }
  v40Save(); v40Head(); return {saved:true, topic:t, correct:p.correct, wrong:p.wrong, streak:p.streak};
}
// ---------- daily limits ----------
function v40Count(add){ const L = v40Local(), d = V40_DAY(); if(L.day !== d){ L.day = d; L.asked = 0; L.paid = 0; } if(add) L.asked = (L.asked || 0) + add; v40SaveLocal(L); return L; }
const v40Left = () => Math.max(0, V40_MAX - (v40Count(0).asked || 0));
// ---------- the coach in the world ----------
function v40Sprites(sp){
  const P = PLAYER, dt = .016;
  if(V40.follow > realT && P && P.visible){ const tx = P.x - P.dir*34, ty = P.y + 6, dx = tx - V40.x, dy = ty - V40.y, d = Math.hypot(dx, dy); if(d > 900){ V40.x = tx; V40.y = ty; } else if(d > 8){ const s = Math.min(d, 150*dt*(d > 120 ? 2 : 1)); V40.x += dx/d*s; V40.y += dy/d*s; V40.dir = dx < 0 ? -1 : 1; V40.walk = (V40.walk || 0) + dt*10; } }
  else { const [hx, hy] = V40.home, dx = hx - V40.x, dy = hy - V40.y, d = Math.hypot(dx, dy); if(d > 6){ const s = Math.min(d, 90*dt); V40.x += dx/d*s; V40.y += dy/d*s; V40.dir = dx < 0 ? -1 : 1; V40.walk = (V40.walk || 0) + dt*10; } else if(P) V40.dir = P.x < V40.x ? -1 : 1; }
  if(!inVB(V40.x, V40.y)) return;
  sp.push({y:V40.y, f:() => { const x = Math.round(V40.x), y = Math.round(V40.y), st = Math.floor(V40.walk || 0) % 2, b = Math.sin(realT*3)*1;
    rect('rgba(0,0,0,.25)', x - 9, y - 2, 18, 4); rect('#263238', x - 5, y - 10, 4, 8 - st*2); rect('#263238', x + 1, y - 10, 4, 8 - (1 - st)*2); rect('#fff', x - 5, y - 2 - st*2, 4, 2); rect('#fff', x + 1, y - 2 - (1 - st)*2, 4, 2);
    rect('#1a237e', x - 7, y - 22, 14, 13); rect('#ffd23f', x - 7, y - 18, 14, 2); rect('#fff', x - 1, y - 22, 2, 13); rect('#1a237e', x - 9, y - 21, 2, 9); rect('#1a237e', x + 7, y - 21, 2, 9); rect('#f2c9a0', x - 9, y - 12, 2, 2); rect('#f2c9a0', x + 7, y - 12, 2, 2);
    rect('#c0c0c0', x + 2*V40.dir, y - 17, 4, 3); rect('#9e9e9e', x - 1, y - 22, 1, 5);
    const C = ['#ef4b4b', '#ffd23f', '#3d7bff', '#2fbf71', '#f4f4f4', '#ff8a2b'], hy = y - 38 + b; rect('#0a0f22', x - 8, hy - 1, 16, 16); for(let i=0;i<3;i++) for(let j=0;j<3;j++) rect(C[(i + j*2) % 6], x - 7 + i*5, hy + j*5, 4, 4);
    rect('#0a0f22', x - 4 + V40.dir, hy + 5, 2, 2); rect('#0a0f22', x + 2 + V40.dir, hy + 5, 2, 2); rect('#0a0f22', x - 3 + V40.dir, hy + 10, 6, 1); rect('#0a0f22', x - 4 + V40.dir, hy + 9, 1, 1); rect('#0a0f22', x + 3 + V40.dir, hy + 9, 1, 1);
    const near = P && Math.hypot(P.x - x, P.y - y) < 150; ctx.font = '13px VT323, monospace'; ctx.textAlign = 'center';
    if(near){ const n = V40_ROLE[v40Zone()][0], w = ctx.measureText(n).width + 10; ctx.fillStyle = 'rgba(26,35,126,.92)'; ctx.fillRect(x - w/2, hy - 18, w, 14); ctx.fillStyle = '#ffd23f'; ctx.fillText(n, x, hy - 7); }
    else { ctx.fillStyle = '#ffd23f'; ctx.fillText('🎓', x, hy - 6); } ctx.textAlign = 'left'; }});
}
function v40Doors(d){ d.push({x:V40.x, y:V40.y + 6, n:'Nói chuyện với Coach Ru (AI)', f:() => v40Open(), host:true}); }
// ---------- chat panel ----------
function v40Panel(){
  if($('#v40Coach')) return; const p = document.createElement('div'); p.id = 'v40Coach'; p.hidden = true; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'AI Coach');
  p.innerHTML = `<div class="v40h"><canvas id="v40Av" width="40" height="40" aria-hidden="true"></canvas><div class="v40t"><b id="v40Name">Coach Ru</b><small id="v40Sub"></small></div>
    <button type="button" id="v40En" class="v40b" aria-pressed="false" title="English mode">EN</button><button type="button" id="v40Spk" class="v40b" aria-pressed="true" title="Đọc to câu trả lời">🔊</button><button type="button" id="v40X" class="v40b" aria-label="Đóng Coach">✕</button></div>
    <div id="v40Grade" class="v40grade" hidden><span>Em học lớp mấy?</span><select id="v40GradeSel"><option value="0">Chọn lớp</option>${[1,2,3,4,5,6,7,8,9].map(g => `<option value="${g}">Lớp ${g}</option>`).join('')}</select></div>
    <div id="v40Today" class="v40today"></div><div id="v40Log" class="v40log" aria-live="polite"></div>
    <div id="v40Chips" class="v40chips"></div>
    <form id="v40Form" class="v40form"><button type="button" id="v40Mic" class="v40b" aria-label="Nói" hidden>🎤</button><input id="v40In" autocomplete="off" maxlength="400" placeholder="Hỏi Coach bất cứ điều gì…"><button type="submit" id="v40Send" class="v40b v40send" aria-label="Gửi">➤</button><button type="button" id="v40Stop" class="v40b" hidden aria-label="Dừng">■</button></form>`;
  document.body.appendChild(p);
  ['pointerdown', 'pointermove', 'touchstart', 'touchmove', 'wheel', 'keydown'].forEach(ev => p.addEventListener(ev, e => e.stopPropagation()));
  $('#v40X').onclick = () => v40Close(); $('#v40Form').onsubmit = e => { e.preventDefault(); const t = $('#v40In').value.trim(); if(t){ $('#v40In').value = ''; v40Ask(t); } };
  $('#v40Stop').onclick = () => { if(V40.ctl) V40.ctl.abort(); };
  $('#v40En').onclick = () => { V40.en = !V40.en; $('#v40En').setAttribute('aria-pressed', V40.en); v40Chips(); v40Msg('coach', V40.en ? "English mode on! Let's talk in simple English. I will speak slowly." : 'Đã chuyển về tiếng Việt nhé!'); };
  $('#v40Spk').onclick = () => { V40.speak = !V40.speak; $('#v40Spk').setAttribute('aria-pressed', V40.speak); $('#v40Spk').textContent = V40.speak ? '🔊' : '🔈'; if(!V40.speak) v40Hush(); };
  $('#v40GradeSel').onchange = e => { V40.prof.grade = +e.target.value; v40Save(); $('#v40Grade').hidden = !!V40.prof.grade; v40Today(); };
  $('#v40Mic').onclick = v40Mic; v40Chips();
}
function v40Chips(){ const c = $('#v40Chips'); if(!c) return; c.innerHTML = ''; const L = V40.en ? ['Explain this', 'Give me a hint', 'Quiz me', 'Practice English', 'Why is the sky blue?'] : ['Explain this', 'Give me a hint', 'Quiz me', 'Practice English', 'Why is the sky blue?', 'Quiz me English animals'];
  L.forEach(t => { const b = document.createElement('button'); b.type = 'button'; b.className = 'v40chip'; b.textContent = t; b.onclick = () => { if(t === 'Practice English' && !V40.en) $('#v40En').click(); v40Ask(t); }; c.appendChild(b); }); }
function v40Head(){ const z = v40Zone(), [n] = V40_ROLE[z]; const nm = $('#v40Name'); if(nm) nm.textContent = n; const sb = $('#v40Sub'); if(sb){ const p = V40.prof || {}; sb.textContent = `${V40.sample ? 'Còn ' + v40Left() + ' lượt hỏi hôm nay' : 'Chế độ offline'} · chuỗi ${p.streak || 0} ngày · ⭐ ${p.correct || 0}`; }
  const cv = $('#v40Av'); if(cv){ const g = cv.getContext('2d'), C = ['#ef4b4b', '#ffd23f', '#3d7bff', '#2fbf71', '#f4f4f4', '#ff8a2b']; g.clearRect(0, 0, 40, 40); g.fillStyle = '#0a0f22'; g.fillRect(4, 4, 32, 32); for(let i=0;i<3;i++) for(let j=0;j<3;j++){ g.fillStyle = C[(i + j*2) % 6]; g.fillRect(6 + i*10, 6 + j*10, 8, 8); } g.fillStyle = '#0a0f22'; g.fillRect(13, 15, 4, 4); g.fillRect(23, 15, 4, 4); g.fillRect(14, 25, 12, 2); g.fillRect(12, 23, 2, 2); g.fillRect(26, 23, 2, 2); } }
// three short lessons a day, chosen from weak topics
const V40_TOPICS = ['Toán: phép nhân', 'Toán: phân số', 'Tiếng Anh: con vật', 'Tiếng Anh: màu sắc', 'Khoa học: nước và không khí', 'Lịch sử Việt Nam: các vua Hùng', 'Địa lý Việt Nam: sông và núi', 'Kỹ năng sống: an toàn khi qua đường', 'Tiếng Việt: từ trái nghĩa', 'Cờ vua: chiếu hết bằng hậu', 'Rubik: tầng 1 (dấu cộng trắng)', 'Khoa học: hệ Mặt Trời'];
function v40Today(){ const box = $('#v40Today'); if(!box || !V40.prof) return; const p = V40.prof, d = V40_DAY(); let L = (p.lessons && p.lessons.day === d) ? p.lessons.list : null;
  if(!L){ const pool = p.weak.concat(V40_TOPICS.filter(t => !p.weak.includes(t))), r = v38Rng(+d.replace(/-/g, '') + (p.grade || 0)); L = []; while(L.length < 3 && pool.length){ const i = L.length < p.weak.length ? 0 : Math.floor(r()*pool.length); L.push({t:pool.splice(i, 1)[0], done:false}); } p.lessons = {day:d, list:L}; v40Save(); }
  box.innerHTML = '<b>Bài học hôm nay</b>'; L.forEach((l, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'v40les' + (l.done ? ' done' : ''); b.textContent = (l.done ? '✓ ' : '5′ ') + l.t; b.onclick = () => { V40.lesson = i; v40Ask(`Dạy em bài ngắn 5 phút: ${l.t}. Bắt đầu bằng một câu hỏi dễ.`); }; box.appendChild(b); }); }
function v40Msg(who, text){ const log = $('#v40Log'); const d = document.createElement('div'); d.className = 'v40m ' + who; d.textContent = text; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; }
async function v40Open(){
  v40Panel(); const p = $('#v40Coach'); if(!p.hidden && V40.open) return; p.hidden = false; V40.open = true; V40.follow = realT + 1e6; try { v39Sfx('open', .45); } catch(e){}
  if(!V40.prof) await v40LoadProf(); v40Head(); v40Today(); $('#v40Grade').hidden = !!V40.prof.grade; $('#v40Mic').hidden = !V40.dict;
  if(!$('#v40Log').childElementCount){ const z = v40Zone(); v40Msg('coach', z === 'sports' ? 'Chào nhà vô địch! Hôm nay mình luyện kỹ năng gì nào? 🏅' : z === 'library' ? 'Chào em! Cô Ru ở đây. Em đang đọc truyện gì vậy? 📚' : z === 'farm' ? 'Chào cháu! Bác Ru đây. Cháu muốn tìm hiểu cây gì, con gì nào? 🌾' : z === 'brain' ? 'Chào em! Mình cùng luyện cờ vua hay Rubik nhé? ♟️' : 'Chào em! Mình là Coach Ru. Em muốn học gì hôm nay? Hỏi bất cứ điều gì nhé! 🎓');
    if(!V40.sample) v40Msg('sys', 'Coach đang dùng kho gợi ý offline (chưa kết nối được Claude). Vẫn hỏi được về cờ, Rubik, Sudoku, toán, tiếng Anh…'); }
  setTimeout(() => $('#v40In').focus({preventScroll:true}), 50);
}
function v40Close(){ const p = $('#v40Coach'); if(p) p.hidden = true; V40.open = false; V40.follow = realT + 20; if(V40.ctl) V40.ctl.abort(); v40Hush(); try { v39Sfx('close', .4); } catch(e){} }
// ---------- speech ----------
async function v40Say(text){ if(!V40.speak || !text) return; const t = String(text).slice(0, 1900);
  if(V40.tts){ try { await V40.tts.speak(t, V40.en ? {language:'en', rate:.85} : {}); return; } catch(e){ if(e && e.code === 'not_granted') V40.tts = null; else return; } }
  try { const u = new SpeechSynthesisUtterance(t); u.lang = V40.en ? 'en-US' : 'vi-VN'; u.rate = V40.en ? .85 : 1; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch(e){} }
function v40Hush(){ try { if(V40.tts) V40.tts.stop(); } catch(e){} try { speechSynthesis.cancel(); } catch(e){} }
function v40Mic(){ const d = V40.dict, b = $('#v40Mic'); if(!d) return; if(V40.listening){ d.stop().catch(() => {}); return; }
  let base = $('#v40In').value; d.start().catch(e => { if(e && e.code === 'not_granted'){ V40.dict = null; b.hidden = true; } });
  if(!V40.dictWired){ V40.dictWired = true; d.onPartial(({text}) => { $('#v40In').value = (V40.dictBase + ' ' + text).trim(); }); d.onFinal(({text}) => { V40.dictBase = (V40.dictBase + ' ' + text).trim(); $('#v40In').value = V40.dictBase; });
    d.onState(({state}) => { V40.listening = state === 'listening'; b.classList.toggle('on', V40.listening); b.textContent = V40.listening ? '⏺' : '🎤'; if(!V40.listening && V40.dictBase) { const t = V40.dictBase; V40.dictBase = ''; $('#v40In').value = ''; v40Ask(t); } }); }
  V40.dictBase = base; }
// ---------- context + rules sent with every call ----------
function v40State(){ const id = openModal && openModal.id ? openModal.id : (typeof openModal === 'string' ? openModal : (document.querySelector('.modal:not([hidden])') || {}).id || null); const s = {open:id};
  try { if(id === 'mChess' && chessGame) Object.assign(s, {game:'chess', fen:chessGame.fen(), turn:chessGame.turn() === 'w' ? 'white' : 'black', status:chessStatus()}); } catch(e){}
  try { if(id === 'mSudoku' && SDK.g) Object.assign(s, {game:'sudoku', grid:SDK.g.map(v => v || 0).join(''), mistakes:SDK.err}); } catch(e){}
  try { if(id === 'mMath' && MQ.q) Object.assign(s, {game:'math', question:MQ.q.t || MQ.q.q || '', score:MQ.sc}); } catch(e){}
  try { if(id === 'mArcade' && ARC.g) Object.assign(s, {game:ARC.g.title, help:ARC.g.help}); } catch(e){}
  try { if(id === 'mLab') s.game = 'rubik lab'; if(id === 'mRubik') s.game = 'rubik 3D'; } catch(e){}
  return s; }
function v40Ctx(){ const p = V40.prof || {}; return JSON.stringify({ten:(PROF && PROF.name || 'bạn').slice(0, 20), lop:p.grade || 'chưa rõ', level:PROF ? PROF.level : 0, khu:PLAYER && R[regionAt(PLAYER.x, PLAYER.y)] ? R[regionAt(PLAYER.x, PLAYER.y)].name : v40Zone(), dang_choi:v40State(), diem_yeu:(p.weak || []).slice(0, 3), so_lan_thu:V40.attempts}); }
function v40Rules(){ const z = v40Zone(), role = V40_ROLE[z][1];
  return `Bạn là "Coach Ru" — ${role} trong game The Rubik School, dành cho học sinh 6–15 tuổi ở Việt Nam. Thân thiện, vui vẻ, khích lệ.
QUY TẮC:
- ${V40.en ? 'ENGLISH MODE: reply in simple, slow English with short sentences (max 4). Gently correct the student\'s English mistakes ("Good try! We say: ..."). Add Vietnamese only for hard words.' : 'Trả lời bằng tiếng Việt đơn giản, tối đa 4 câu ngắn. Kèm 1–2 từ khoá tiếng Anh dạng "apple (quả táo)".'}
- Phương pháp gợi mở: KHÔNG đưa đáp án ngay. Hỏi lại, gợi ý từng bước. Chỉ giải đầy đủ khi so_lan_thu >= 2 hoặc học sinh tự xin đáp án.
- Khi trả lời câu hỏi tự do: giải thích đơn giản rồi kết thúc bằng MỘT câu hỏi ngược ngắn để học sinh suy nghĩ.
- Điều chỉnh độ khó theo lớp và điểm yếu trong ngữ cảnh.
- AN TOÀN TRẺ EM: không hỏi, không ghi lại thông tin cá nhân (địa chỉ, trường thật, số điện thoại, ảnh). Nội dung không phù hợp lứa tuổi: từ chối nhẹ nhàng và kéo về chủ đề học. Chuyện buồn, bạo lực, bắt nạt, sức khoẻ: an ủi ngắn, khuyên nói ngay với bố mẹ hoặc thầy cô, không đóng vai bác sĩ. Không bao giờ hẹn gặp ngoài đời.
- Công cụ: start_quiz khi học sinh muốn được kiểm tra/quiz; get_game_state để xem mini game đang chơi; show_board_hint khi đang chơi cờ và hỏi nước đi (chỉ nước hợp lệ, giải thích ngắn vì sao); navigate_to để dẫn tới địa điểm trong game; save_progress sau khi học sinh trả lời đúng/sai một bài; give_reward CHỈ khi học sinh vừa hoàn thành một bài học (tối đa $5).
- Không dùng markdown, không dùng tiêu đề, không dùng bảng.
NGỮ CẢNH GAME (JSON): ${v40Ctx()}
${V40.summary ? 'TÓM TẮT TRƯỚC ĐÓ: ' + V40.summary : ''}`; }
// ---------- tools ----------
const V40_PLACES = {library:'library', 'thư viện':'library', academy:'academy', 'học viện':'academy', chess:'chess', 'cờ vua':'giantchess', rubik:'rubikpark', music:'music', 'nhạc':'music', hall:'hall', 'hội trường':'hall', farm:'farm', 'nông trại':'farm', stadium:'stadium', 'sân vận động':'stadium', pool:'pool', 'hồ bơi':'pool', kart:'kart', zen:'zen', 'thiền':'zen', market:'shopst', 'chợ':'shopst', 'mua sắm':'shopst', observatory:'botanic', 'thiên văn':'botanic', field:'field', 'bóng đá':'field', art:'art', 'vẽ':'art', skate:'skate', ski:'ski', basket:'basket', 'bóng rổ':'basket', lake:'lake', 'hồ':'pond', pond:'pond', forest:'forest', 'rừng':'forest', plaza:'plaza', 'lễ hội':'plaza', school:'attend', 'trường':'attend', beach:'beach', 'biển':'beach', arena:'arena', archery:'archery', 'bắn cung':'archery', gym:'gym'};
function v40Tools(){ return [
  {name:'get_game_state', description:'Returns the mini game the student has open right now and its state (chess FEN and turn, Sudoku grid as 81 digits with 0 = empty, math question, arcade game name). Use before giving game advice.', execute:() => v40State()},
  {name:'start_quiz', description:'Creates and opens a short multiple-choice quiz window for the student. Returns {opened, count}. Use when the student asks to be quizzed.', inputSchema:{type:'object', properties:{subject:{type:'string', description:'Topic, e.g. "English animals", "Toán phân số"'}, grade:{type:'number'}, count:{type:'number', description:'3 to 8 questions'}}, required:['subject']}, execute:async i => v40Quiz(String(i.subject || '').slice(0, 80), +i.grade || (V40.prof && V40.prof.grade) || 4, Math.max(3, Math.min(8, +i.count || 5)))},
  {name:'navigate_to', description:'Shows the route and walks the student to a place in the game world. place: one of library, academy, chess, rubik, music, hall, farm, stadium, pool, kart, zen, market, observatory, field, art, skate, ski, basket, pond, forest, plaza, school, beach, arena, archery, gym. Returns {ok, place}.', inputSchema:{type:'object', properties:{place:{type:'string'}}, required:['place']}, execute:i => v40Nav(String(i.place || ''))},
  {name:'show_board_hint', description:'Highlights a suggested chess move on the open chess board, squares in algebraic notation like e2 and e4. Only legal moves for the side to move are shown. Returns {shown}.', inputSchema:{type:'object', properties:{from:{type:'string'}, to:{type:'string'}}, required:['from', 'to']}, execute:i => v40Hint(String(i.from || ''), String(i.to || ''))},
  {name:'give_reward', description:'Gives the student a small coin reward (max $5 per call, $20 per day from the coach) ONLY after they finished a lesson. Returns {given, left_today}.', inputSchema:{type:'object', properties:{amount:{type:'number'}, reason:{type:'string'}}, required:['amount', 'reason']}, execute:i => v40Give(+i.amount, String(i.reason || ''))},
  {name:'save_progress', description:'Saves one learning result for the student: topic (short, e.g. "Toán: phân số") and result ("correct", "wrong" or "learned"). Returns totals.', inputSchema:{type:'object', properties:{topic:{type:'string'}, result:{type:'string'}}, required:['topic', 'result']}, execute:i => v40Progress(i.topic, i.result)}]; }
function v40Nav(place){ const k = place.toLowerCase().trim(); let key = V40_PLACES[k]; if(!key) for(const n in V40_PLACES) if(k.includes(n)){ key = V40_PLACES[n]; break; }
  const r = key && R[key]; if(!r) throw new Error('unknown place'); const x = r.x + r.w/2, y = key === 'beach' ? 900 : Math.min(r.y + r.h + 10, 780); try { v32Nav(x, y, r.name, true); } catch(e){ throw new Error('navigation unavailable'); } return {ok:true, place:r.name}; }
function v40Hint(from, to){ if(!/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to)) throw new Error('bad square'); const m = document.querySelector('#mChess'); if(!m || m.hidden || !chessGame) throw new Error('chess board is not open');
  if(!chessGame.moves({verbose:true}).some(v => v.from === from && v.to === to)) throw new Error('not a legal move here');
  const b = $('#cboard'); [from, to].forEach(s => { const q = b && b.querySelector(`[data-sq="${s}"]`); if(q){ q.classList.add('v40hint'); setTimeout(() => q.classList.remove('v40hint'), 8000); } }); return {shown:true, from, to}; }
function v40Give(amount, reason){ const L = v40Count(0), a = Math.max(0, Math.min(5, Math.round(amount || 0))), left = Math.max(0, 20 - (L.paid || 0)), g = Math.min(a, left);
  if(g > 0){ L.paid = (L.paid || 0) + g; v40SaveLocal(L); reward(5, g, 'Coach Ru: ' + reason.slice(0, 60)); if(V40.lesson != null && V40.prof.lessons && V40.prof.lessons.list[V40.lesson]){ V40.prof.lessons.list[V40.lesson].done = true; v40Save(); v40Today(); V40.lesson = null; } }
  return {given:g, left_today:left - g}; }
// ---------- quiz window ----------
async function v40Quiz(subject, grade, count){
  if(!V40.sample) return v40QuizShow(subject, v40OfflineQuiz(subject));
  const q = await V40.sample.json(`Tạo ${count} câu hỏi trắc nghiệm cho học sinh lớp ${grade} ở Việt Nam về chủ đề: "${subject}". Mỗi câu 4 lựa chọn ngắn, đúng 1 đáp án, kèm giải thích 1 câu thân thiện. Nếu chủ đề là tiếng Anh thì câu hỏi bằng tiếng Anh đơn giản, giải thích bằng tiếng Việt. Nội dung phù hợp trẻ em.
Chỉ trả về JSON: [{"q":"câu hỏi","options":["A","B","C","D"],"answer":0,"explain":"giải thích"}]`, {modelTier:'default'});
  const L = (Array.isArray(q) ? q : []).filter(x => x && typeof x.q === 'string' && Array.isArray(x.options) && x.options.length >= 2 && x.options.length <= 5 && x.options.every(o => typeof o === 'string') && Number.isInteger(x.answer) && x.answer >= 0 && x.answer < x.options.length).slice(0, 8)
    .map(x => ({q:x.q.slice(0, 200), options:x.options.map(o => o.slice(0, 80)), answer:x.answer, explain:String(x.explain || '').slice(0, 200)}));
  if(!L.length) throw new Error('quiz had no valid questions'); return v40QuizShow(subject, L);
}
function v40QuizShow(subject, L){
  let w = $('#v40Quiz'); if(!w){ w = document.createElement('div'); w.id = 'v40Quiz'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', 'Quiz'); document.body.appendChild(w); ['pointerdown', 'touchstart', 'touchmove', 'keydown'].forEach(ev => w.addEventListener(ev, e => e.stopPropagation())); }
  const st = {i:0, ok:0}; w.hidden = false;
  const draw = () => { const Q = L[st.i]; w.innerHTML = `<div class="v40qbox"><div class="v40qh"><b></b><span>${st.i + 1}/${L.length} · ⭐ ${st.ok}</span><button type="button" class="v40b" aria-label="Đóng quiz">✕</button></div><p class="v40qq"></p><div class="v40qo"></div><p class="v40qe" hidden></p><button type="button" class="v40qn" hidden>Câu tiếp ➜</button></div>`;
    w.querySelector('b').textContent = subject; w.querySelector('.v40qq').textContent = Q.q; w.querySelector('.v40qh button').onclick = () => { w.hidden = true; };
    const box = w.querySelector('.v40qo'); Q.options.forEach((o, k) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = o; b.onclick = () => { if(box.dataset.done) return; box.dataset.done = 1; const ok = k === Q.answer; if(ok) st.ok++; b.classList.add(ok ? 'ok' : 'bad'); box.children[Q.answer].classList.add('ok'); try { v39Sfx(ok ? 'success' : 'error', .5); } catch(e){}
      v40Progress(subject, ok ? 'correct' : 'wrong'); const e = w.querySelector('.v40qe'); e.hidden = false; e.textContent = (ok ? 'Chính xác! ' : 'Chưa đúng. ') + Q.explain; const n = w.querySelector('.v40qn'); n.hidden = false; n.textContent = st.i + 1 < L.length ? 'Câu tiếp ➜' : 'Xem kết quả'; n.focus(); }; box.appendChild(b); });
    w.querySelector('.v40qn').onclick = () => { st.i++; if(st.i < L.length) draw(); else done(); }; };
  const done = () => { const pc = st.ok/L.length; w.innerHTML = `<div class="v40qbox v40qend"><b>${pc >= .8 ? '🏆 Tuyệt vời!' : pc >= .5 ? '👍 Khá lắm!' : '💪 Cố lên nhé!'}</b><p>Đúng ${st.ok}/${L.length} câu.</p><button type="button" class="v40qn">Về với Coach</button></div>`;
    if(pc >= .6) v40Give(Math.min(5, st.ok), 'Hoàn thành quiz ' + subject); w.querySelector('button').onclick = () => { w.hidden = true; v40Msg('coach', `Em làm đúng ${st.ok}/${L.length} câu "${subject}". ${pc >= .8 ? 'Giỏi quá!' : 'Mình ôn lại câu sai nhé?'}`); }; };
  draw(); return {opened:true, count:L.length};
}
// ---------- offline hint bank ----------
const V40_OFF = [
  [/cờ vua|chess|nước nào|nước đi/i, 'Mẹo cờ vua: kiểm soát 4 ô trung tâm (d4, e4, d5, e5), ra quân mã và tượng sớm, nhập thành để vua an toàn. Trước mỗi nước, em tự hỏi: "Đối thủ đang dọa ăn quân nào của mình?" Em thấy quân nào đang bị dọa không?'],
  [/rubik|xoay/i, 'Giải Rubik từng tầng: (1) làm dấu cộng trắng, (2) góc trắng, (3) tầng giữa, (4) dấu cộng vàng, (5) xếp góc vàng. Bắt đầu với dấu cộng trắng nhé: em đã đưa được mấy cạnh trắng lên trên rồi?'],
  [/sudoku/i, 'Kỹ thuật loại trừ: chọn một ô trống, gạch đi các số đã có trong cùng hàng, cùng cột và cùng khối 3×3. Nếu chỉ còn một số thì đó là đáp án. Em thử với ô có ít lựa chọn nhất nhé! Ô nào chỉ còn 1–2 số?'],
  [/bầu trời|sky.*blue|màu xanh/i, 'Ánh sáng Mặt Trời có nhiều màu. Khi đi qua không khí, ánh sáng xanh (blue) bị các phân tử khí làm tán xạ nhiều nhất nên cả bầu trời nhìn xanh. Vậy em đoán xem vì sao lúc hoàng hôn trời lại đỏ cam?'],
  [/tiếng anh|english|animal|con vật/i, 'Let\'s learn animals! cat (con mèo), dog (con chó), elephant (con voi), rabbit (con thỏ). Can you say: "I like cats"? Con vật em thích nhất tiếng Anh là gì?'],
  [/\d+\s*[x×*+\-:\/]\s*\d+|bằng mấy|bằng bao nhiêu/i, 'Mình cùng làm từng bước nhé! Em thử tách số lớn ra cho dễ tính, ví dụ 12 × 15 = 12 × 10 + 12 × 5. Em tính được phần đầu là bao nhiêu?'],
  [/phân số|fraction/i, 'Phân số như chia bánh: 1/4 nghĩa là chia bánh thành 4 phần bằng nhau và lấy 1 phần. Vậy 2/4 bằng phân số nào gọn hơn?'],
  [/nhân|bảng cửu chương|multiply/i, 'Mẹo nhân: 9 × n thì lấy 10 × n rồi trừ n. Ví dụ 9 × 7 = 70 − 7 = 63. Em thử tính 9 × 8 xem?'],
  [/bóng|sút|ném|thể thao|sport/i, 'Mẹo thể thao: canh lực bằng cách giữ nút lâu hay ngắn, nhìn vạch chỉ hướng trước khi thả. Thử 3 lần với 3 lực khác nhau rồi chọn lực tốt nhất. Lần nào em thấy vào gần nhất?'],
  [/buồn|bắt nạt|đánh|ốm|đau/i, 'Coach rất tiếc khi em gặp chuyện này. Em hãy kể ngay với bố mẹ hoặc thầy cô em tin tưởng nhé, họ sẽ giúp em. Em không có lỗi và em không một mình đâu.'],
  [/quiz/i, 'Mình làm quiz nhanh nhé! (Quiz offline đã mở.)']
];
function v40Offline(t){ for(const [re, a] of V40_OFF) if(re.test(t)){ if(/quiz/i.test(t)) v40QuizShow(/english|anh|animal/i.test(t) ? 'English animals' : 'Toán vui', v40OfflineQuiz(t)); return a; }
  return 'Câu hỏi hay đấy! Coach đang ở chế độ offline nên chỉ trả lời được về cờ vua, Rubik, Sudoku, toán, tiếng Anh, thể thao và bầu trời. Em thử hỏi một chủ đề đó nhé?'; }
function v40OfflineQuiz(s){ return /english|anh|animal/i.test(s) ? [{q:'What animal says "meow"?', options:['dog', 'cat', 'cow', 'duck'], answer:1, explain:'Cat (con mèo) kêu meo meo.'}, {q:'Which animal is very big and has a trunk?', options:['elephant', 'rabbit', 'fish', 'bird'], answer:0, explain:'Elephant (con voi) có vòi dài.'}, {q:'"Con chó" in English is…', options:['pig', 'dog', 'hen', 'bee'], answer:1, explain:'Dog = con chó.'}]
  : [{q:'9 × 7 = ?', options:['56', '63', '72', '61'], answer:1, explain:'9 × 7 = 70 − 7 = 63.'}, {q:'1/2 bằng phân số nào?', options:['2/4', '1/3', '3/4', '2/3'], answer:0, explain:'Nhân cả tử và mẫu với 2: 1/2 = 2/4.'}, {q:'Một tuần có mấy ngày?', options:['5', '6', '7', '8'], answer:2, explain:'Từ thứ Hai đến Chủ nhật là 7 ngày.'}]; }
// ---------- ask ----------
async function v40Ask(text){
  if(V40.busy) return; v40Msg('me', text); const quizMe = /quiz me|kiểm tra|đố em/i.test(text);
  if(/đáp án|answer|không biết|chịu/i.test(text)) V40.attempts = 2; else if(V40.turns.length && /^[\d\s.,+\-×x*/=a-zA-ZÀ-ỹ]{1,40}$/.test(text)) V40.attempts++;
  if(!V40.sample){ const a = v40Offline(text); v40Msg('coach', a); v40Say(a); return; }
  if(Date.now() < V40.restUntil){ v40Msg('sys', 'Coach nghỉ uống nước 1 phút nhé ☕'); return; }
  if(quizMe && !V40.toolsOK){ const subj = text.replace(/quiz me|kiểm tra|đố em/ig, '').trim() || 'Kiến thức chung'; v40Count(1); v40Head(); const w = v40Msg('coach', 'Coach đang soạn quiz cho em…'); try { await v40Quiz(subj, (V40.prof && V40.prof.grade) || 4, 5); w.textContent = 'Quiz đã mở! Chúc em làm tốt nhé 💪'; } catch(e){ w.textContent = 'Chưa soạn được quiz, Coach mở quiz offline nhé.'; v40QuizShow(subj, v40OfflineQuiz(subj)); } return; }
  if(v40Left() <= 0){ v40Msg('sys', 'Hôm nay em đã hỏi đủ 40 lượt rồi. Mai Coach trả lời tiếp nhé! Bây giờ em có thể dùng gợi ý offline.'); const a = v40Offline(text); v40Msg('coach', a); return; }
  v40Count(1); v40Head(); V40.busy = true; $('#v40Send').hidden = true; $('#v40Stop').hidden = false; const out = v40Msg('coach', 'Đang suy nghĩ…'); out.classList.add('wait');
  V40.turns.push({role:'user', content:text}); const recent = V40.turns.slice(-6); if(recent[0].role !== 'user') recent.shift();
  const deep = quizMe || (v40State().game === 'chess' && /nước|move|tốt|best|phân tích|analy/i.test(text)) || /dạy em bài/i.test(text);
  V40.ctl = new AbortController(); const opts = {signal:V40.ctl.signal, cache:false, modelTier:deep ? 'default' : 'quick', onText:({text}) => { out.classList.remove('wait'); out.textContent = text; $('#v40Log').scrollTop = 1e6; }};
  if(V40.toolsOK) opts.tools = v40Tools(); delete opts.cache; if(!opts.tools) opts.cache = false;
  try { const r = await V40.sample([{role:'user', content:v40Rules()}, ...recent], opts); out.textContent = r.text; out.classList.remove('wait'); V40.turns.push({role:'assistant', content:r.text}); v40Say(r.text);
    if(V40.turns.length > 12){ const old = V40.turns.splice(0, V40.turns.length - 6); V40.summary = (V40.summary + ' ' + old.map(t => (t.role === 'user' ? 'HS: ' : 'Coach: ') + t.content.slice(0, 80)).join(' | ')).slice(-700); }
  } catch(e){ const c = e && e.code; out.classList.remove('wait');
    if(c === 'cancelled'){ out.textContent = e.text || '(đã dừng)'; }
    else if(c === 'rate_limited'){ V40.restUntil = Date.now() + 60000; out.textContent = 'Coach nghỉ uống nước 1 phút nhé ☕'; }
    else if(['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(c)){ V40.sample = null; v40Head(); const a = v40Offline(text); out.textContent = a; v40Msg('sys', 'Coach chuyển sang gợi ý offline.'); }
    else if(c === 'tools_unavailable'){ V40.toolsOK = false; out.textContent = 'Em hỏi lại giúp Coach nhé!'; }
    else if(c === 'refused'){ out.textContent = 'Mình nói chuyện về bài học nhé! Em muốn học toán, tiếng Anh hay khoa học?'; }
    else { out.textContent = (e && e.text) ? e.text + ' …' : 'Coach bị gián đoạn một chút. Em gửi lại câu hỏi nhé!'; }
    V40.turns.pop();
  } finally { V40.busy = false; $('#v40Send').hidden = false; $('#v40Stop').hidden = true; V40.ctl = null; }
}
// ---------- Learning Report for the game owner ----------
async function v40Report(){
  let w = $('#v40Rep'); if(!w){ w = document.createElement('div'); w.id = 'v40Rep'; w.className = 'v40qwrap'; document.body.appendChild(w); }
  w.hidden = false; w.innerHTML = '<div class="v40qbox"><div class="v40qh"><b>Learning Report · Báo cáo học tập</b><span></span><button type="button" class="v40b" aria-label="Đóng">✕</button></div><div class="v40rep">Đang tải…</div></div>';
  w.querySelector('.v40qh button').onclick = () => { w.hidden = true; }; const box = w.querySelector('.v40rep');
  if(!V40.db){ box.textContent = 'Chưa kết nối được dữ liệu dùng chung. Báo cáo chỉ có khi mở game trong claude.ai.'; return; }
  const timer = setTimeout(() => { box.textContent = 'Tải dữ liệu quá lâu. Hãy mở lại báo cáo sau.'; }, 10000);
  try { const s = await V40.db.collection('learn').get(); clearTimeout(timer); const rows = s.docs.map(d => ({id:d.id, ...(d.data() || {})})); if(!rows.length){ box.textContent = 'Chưa có học sinh nào học với Coach.'; return; }
    let names = {}; try { if(V40.user && V40.user.profiles) names = await V40.user.profiles(rows.map(r => r.id)); } catch(e){}
    const wk = Date.now() - 7*864e5; box.innerHTML = ''; rows.sort((a, b) => (b.updated || 0) - (a.updated || 0)).forEach(r => { const d = document.createElement('div'); d.className = 'v40row'; const n = (names[r.id] && names[r.id].name) || r.game || 'Học sinh';
      const top = Object.entries(r.topics || {}).sort((a, b) => (b[1].ok + b[1].bad) - (a[1].ok + a[1].bad)).slice(0, 3).map(([k, v]) => `${k} (${v.ok}✓/${v.bad}✗)`).join(', ');
      d.innerHTML = '<b></b><span></span><small></small>'; d.querySelector('b').textContent = `${n} · Lớp ${r.grade || '?'}`; d.querySelector('span').textContent = `Đúng ${r.correct || 0} · Sai ${r.wrong || 0} · Chuỗi ${r.streak || 0} ngày · ${(r.updated || 0) > wk ? 'Có học tuần này' : 'Chưa học tuần này'}`;
      d.querySelector('small').textContent = `Chủ đề: ${top || '—'} · Cần ôn: ${(r.weak || []).slice(0, 3).join(', ') || '—'}`; box.appendChild(d); });
  } catch(e){ clearTimeout(timer); box.textContent = 'Chỉ chủ game mới xem được báo cáo này.'; }
}
// ---------- start ----------
function v40Init(){
  const es = extSprites; extSprites = function(sp){ es(sp); try { v40Sprites(sp); } catch(e){} };
  const vd = v36Doors; v36Doors = function(d){ vd(d); v40Doors(d); };
  try { const st = $('#stage'); if(st && !$('#v40Btn')){ const b = document.createElement('button'); b.type = 'button'; b.id = 'v40Btn'; b.className = 'v32ic v40ic'; b.setAttribute('aria-label', 'Gọi AI Coach'); b.innerHTML = v39Ic('cap', 24, '#ffd23f'); b.onclick = e => { e.stopPropagation(); v40Open(); }; st.appendChild(b); } } catch(e){}
  const mi = v32Items; v32Items = function(){ const L = mi(); L.splice(1, 0, {ic:'cap', en:'AI Coach', vi:'Huấn luyện viên AI', grp:'brain', f:() => v40Open()}); return L; };
  const ms = v32SubItems; v32SubItems = function(k){ const L = ms(k); if(k === 'owner') L.unshift({ic:'scroll', en:'Learning Report', vi:'Báo cáo học tập', grp:'system', f:() => v40Report()}); return L; };
  v40Panel();
  (async () => { if(!window.claude || !claude.use) return; try { const [s, t, d, db, u] = await Promise.all(['sample', 'tts', 'dictation', 'db', 'user'].map(n => claude.use(n).catch(() => null)));
    V40.sample = s; V40.tts = t; V40.dict = d; V40.db = db; V40.user = u; if(u && u.id) V40.uid = await u.id().catch(() => null);
    if(s && s.limits){ try { const L = await s.limits(); V40.toolsOK = !!(L && L.tools); } catch(e){} }
    if(t && t.onState) t.onState(({state}) => { const b = $('#v40Spk'); if(b) b.classList.toggle('on', state === 'speaking'); });
    await v40LoadProf(); v40Head(); const m = $('#v40Mic'); if(m) m.hidden = !V40.dict; } catch(e){} })();
  v40LoadProf();
}
