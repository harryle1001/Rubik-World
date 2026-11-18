// ================= v62k · 10 THẦY CÔ GIÁO SƯ (2/3 · hộp thoại): Hỏi thầy/cô · Câu đố · Kể chuyện · Bài học hôm nay · Hỏi tự do (AI) =================
function v62kEsc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c])); }
function v62kUiInit(){
  if(document.getElementById('v62kDlg')) return;
  const d = document.createElement('div'); d.id = 'v62kDlg'; d.hidden = true; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'false');
  d.innerHTML = `<div class="v62kCard"><header><img id="v62kFace" alt=""><div class="v62kWho"><b id="v62kName"></b><span id="v62kSub"></span></div>
    <button type="button" class="v62kX" id="v62kX" aria-label="Đóng">✕</button></header>
    <nav id="v62kTabs"><button type="button" data-v="ask">📚 Hỏi</button><button type="button" data-v="quiz">❓ Câu đố</button><button type="button" data-v="story">📖 Kể chuyện</button><button type="button" data-v="lesson">🌟 Bài học</button><button type="button" data-v="ai" id="v62kAiTab" hidden>💬 Hỏi tự do</button></nav>
    <section id="v62kBody"></section></div>`;
  document.body.appendChild(d); V62K.dlg = d;
  d.querySelector('#v62kX').onclick = v62kClose;
  d.querySelector('#v62kTabs').onclick = e => { const b = e.target.closest('[data-v]'); if(b) v62kView(b.dataset.v); };
  d.querySelector('#v62kBody').onclick = v62kBodyClick;
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !d.hidden) v62kClose(); });
}
function v62kClose(){ if(V62K.dlg) V62K.dlg.hidden = true; if(V62K.cur) V62K.hold[V62K.cur.id] = performance.now() + 2500; V62K.cur = null; try { v62kAiStop(); } catch(e){} }
function v62kHead(){
  const t = V62K.cur; if(!t) return; const P = v62kTP(t.id), K = V62K.kb[t.id];
  V62K.dlg.querySelector('#v62kName').textContent = `${t.def.ic} ${t.def.n}`;
  V62K.dlg.querySelector('#v62kSub').textContent = `${t.def.s} · 📚 ${P.seen.length}${K ? '/' + K.cards.length : ''} · ✅ ${P.ok.length}${P.badge ? ' · 🏅' : ''}`;
}
function v62kAiOn(){ try { return typeof V40 !== 'undefined' && !!V40.sample; } catch(e){ return false; } }
async function v62kOpen(t){
  if(!t) return; v62kUiInit(); V62K.cur = t; const d = V62K.dlg; d.hidden = false;
  try { if(typeof openModal !== 'undefined' && openModal) hideModal(); } catch(e){}
  d.querySelector('#v62kFace').src = v62kPortrait(t, 4); d.querySelector('#v62kFace').alt = 'Chân dung ' + t.def.n;
  d.querySelector('#v62kAiTab').hidden = !v62kAiOn(); v62kHead();
  V62K.view = 'hi'; v62kBody(`<p class="v62kHi">👋 ${v62kEsc(t.def.hi)}</p><p class="v62kMuted">Em muốn làm gì nào? Chọn ở hàng nút phía trên nhé.</p>`);
  try { v39Sfx('open', .4); } catch(e){}
  try { await v62kKB(t.id); v62kHead(); } catch(e){ v62kBody(`<p>😅 Chưa mở được kho kiến thức (${v62kEsc(e.message)}). Em thử lại sau nhé.</p>`); }
}
function v62kBody(h){ const b = V62K.dlg.querySelector('#v62kBody'); b.innerHTML = h; b.scrollTop = 0; }
async function v62kView(v){
  const t = V62K.cur; if(!t) return; V62K.view = v;
  V62K.dlg.querySelectorAll('#v62kTabs button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  if(v === 'ai') return v62kAiView();
  let K; try { K = await v62kKB(t.id); } catch(e){ v62kBody('<p>⏳ Đang tải kho kiến thức… em thử lại nhé.</p>'); return; }
  if(v === 'ask') return v62kAskView(K);
  if(v === 'quiz') return v62kQuizNext(K);
  if(v === 'story') return v62kStory(K, 0);
  if(v === 'lesson') return v62kLesson(K);
}
function v62kLvBtns(){ const lv = V62K.lv || 0; return `<div class="v62kLv">${['Mọi cấp', 'Cấp 1 · 8–10t', 'Cấp 2 · 11–12t', 'Cấp 3 · 13–15t'].map((n, i) => `<button type="button" data-lv="${i}" class="${i === lv ? 'on' : ''}">${n}</button>`).join('')}</div>`; }
// ---- Hỏi thầy/cô: chọn chủ đề → thẻ kiến thức
function v62kAskView(K){
  const P = v62kTP(V62K.cur.id);
  v62kBody(`<p class="v62kMuted">${V62K.cur.def.g === 'thầy' ? 'Thầy' : 'Cô'} biết nhiều lắm! Em chọn một chủ đề:</p>${v62kLvBtns()}<div class="v62kTopics">${K.topics.map((n, i) => {
    const all = K.cards.filter(c => c.tp === i), s = all.filter(c => P.seen.includes(K.cards.indexOf(c))).length;
    return `<button type="button" data-tp="${i}">${v62kEsc(n)}<small>${s}/${all.length}</small></button>`; }).join('')}</div>`);
}
function v62kCard(K, tp){
  const P = v62kTP(V62K.cur.id), lv = V62K.lv || 0;
  const L = K.cards.map((c, i) => [c, i]).filter(([c]) => c.tp === tp && (!lv || c.lv === lv)); if(!L.length){ v62kBody('<p>Chủ đề này chưa có thẻ ở cấp đó. Em chọn cấp khác nhé.</p>' + v62kLvBtns()); return; }
  const un = L.filter(([, i]) => !P.seen.includes(i)), [c, i] = (un.length ? un : L)[Math.floor(Math.random()*(un.length ? un.length : L.length))];
  const fresh = !P.seen.includes(i); if(fresh){ P.seen.push(i); v62kGive(2, 0, 'Học thẻ kiến thức'); v62kBadge(V62K.cur); }
  V62K.tp = tp; v62kHead();
  v62kBody(`<article class="v62kK"><p class="v62kTag">${v62kEsc(K.topics[c.tp])} · Cấp ${c.lv}${fresh ? ' · ✨ mới' : ''}</p><h3>${v62kEsc(c.t)}</h3><p>${v62kEsc(c.vi)}</p>
    ${c.ex ? `<p class="v62kEx">💡 ${v62kEsc(c.ex)}</p>` : ''}<p class="v62kEn">🔤 ${c.en.map(v62kEsc).join(' · ')}</p></article>
    <div class="v62kAct"><button type="button" data-tp="${tp}" class="pri">▶ Thẻ khác</button><button type="button" data-v="ask">↩ Chủ đề</button></div>`);
}
// ---- Câu đố trắc nghiệm có giải thích
function v62kQuizNext(K){
  const P = v62kTP(V62K.cur.id), lv = V62K.lv || 0;
  const L = K.quiz.map((q, i) => [q, i]).filter(([q]) => !lv || q.lv === lv), un = L.filter(([, i]) => !P.ok.includes(i)), pool = un.length ? un : L;
  const [q, i] = pool[Math.floor(Math.random()*pool.length)]; V62K.q = i;
  v62kBody(`${v62kLvBtns()}<article class="v62kK"><p class="v62kTag">${v62kEsc(K.topics[q.tp])} · Cấp ${q.lv} · còn ${un.length} câu mới</p><h3>${v62kEsc(q.q)}</h3></article>
    <div class="v62kOpts">${q.a.map((a, k) => `<button type="button" data-ans="${k}">${'ABCD'[k]}. ${v62kEsc(a)}</button>`).join('')}</div><div id="v62kWhy"></div>`);
}
function v62kAnswer(k){
  const t = V62K.cur, K = V62K.kb[t.id], q = K && K.quiz[V62K.q]; if(!q) return; const box = V62K.dlg.querySelector('.v62kOpts'); if(!box || box.dataset.done) return; box.dataset.done = 1;
  const P = v62kTP(t.id), ok = k === q.c; P.tries++;
  box.querySelectorAll('button').forEach((b, j) => { b.disabled = true; if(j === q.c) b.classList.add('ok'); else if(j === k) b.classList.add('no'); });
  if(ok){ P.right++; if(!P.ok.includes(V62K.q)){ P.ok.push(V62K.q); v62kGive(5, 2, 'Trả lời đúng câu đố của ' + t.def.n); } v62kBadge(t); }
  try { v39Sfx(ok ? 'success' : 'error', .4); } catch(e){}
  V62K.dlg.querySelector('#v62kWhy').innerHTML = `<p class="v62kRes ${ok ? 'ok' : 'no'}">${ok ? '🎉 Chính xác!' : '🤔 Chưa đúng rồi. Đáp án: ' + 'ABCD'[q.c] + '.'}</p><p>📘 ${v62kEsc(q.why)}</p><p class="v62kEn">🔤 ${v62kEsc(q.en || '')}</p>
    <div class="v62kAct"><button type="button" class="pri" data-v="quiz">▶ Câu tiếp</button></div>`;
  v62kHead(); v62kSave();
}
// ---- Kể chuyện khoa học
function v62kStory(K, step){
  const P = v62kTP(V62K.cur.id), n = K.stories.length; P.story = ((P.story || 0) + step + n) % n; const s = K.stories[P.story];
  if(step) v62kGive(3, 0, 'Nghe kể chuyện');
  v62kBody(`<article class="v62kK"><p class="v62kTag">📖 Chuyện ${P.story + 1}/${n}</p><h3>${v62kEsc(s.t)}</h3><p>${v62kEsc(s.vi)}</p>${s.en ? `<p class="v62kEn">🔤 ${[].concat(s.en).map(v62kEsc).join(' · ')}</p>` : ''}</article>
    <div class="v62kAct"><button type="button" data-st="-1">◀ Trước</button><button type="button" class="pri" data-st="1">Chuyện khác ▶</button></div>`);
  v62kSave();
}
// ---- Bài học hôm nay (đổi mỗi ngày)
function v62kLesson(K){
  const t = V62K.cur, d = new Date(), k = (d.getFullYear()*400 + d.getMonth()*31 + d.getDate() + t.i*7) % K.lessons.length, L = K.lessons[k], s = v62kProf(), done = s.day.lesson[t.id];
  v62kBody(`<article class="v62kK"><p class="v62kTag">🌟 ${d.toLocaleDateString('vi-VN')}</p><h3>${v62kEsc(L.t)}</h3><p>${v62kEsc(L.vi)}</p><p class="v62kEx">🧪 Thử ngay: ${v62kEsc(L.try)}</p></article>
    <div class="v62kAct"><button type="button" class="pri" id="v62kDid" ${done ? 'disabled' : ''}>${done ? '✅ Em đã học bài hôm nay' : '✔ Em đã hiểu bài'}</button></div>`);
}
function v62kBodyClick(e){
  const b = e.target.closest('button'); if(!b || b.disabled) return; const K = V62K.cur && V62K.kb[V62K.cur.id];
  if(b.dataset.lv != null){ V62K.lv = +b.dataset.lv; if(V62K.view === 'quiz') v62kQuizNext(K); else if(V62K.view === 'ask' && V62K.tp != null && V62K.dlg.querySelector('.v62kK')) v62kCard(K, V62K.tp); else v62kAskView(K); return; }
  if(b.dataset.tp != null && K) return v62kCard(K, +b.dataset.tp);
  if(b.dataset.ans != null) return v62kAnswer(+b.dataset.ans);
  if(b.dataset.st != null && K) return v62kStory(K, +b.dataset.st);
  if(b.dataset.v) return v62kView(b.dataset.v);
  if(b.id === 'v62kDid'){ const s = v62kProf(); s.day.lesson[V62K.cur.id] = 1; v62kGive(10, 3, 'Bài học hôm nay của ' + V62K.cur.def.n); b.disabled = true; b.textContent = '✅ Em đã học bài hôm nay'; return; }
  if(b.id === 'v62kSend') return v62kAiSend();
}

// ---- Hỏi tự do: AI (chỉ khi game có window.claude sample — AI Coach v40), persona giáo sư + rào an toàn trẻ em
const V62K_PII = /(\b\d{9,11}\b|@[a-z0-9-]+\.|số nhà|địa chỉ nhà|mật khẩu|password|số điện thoại|sđt|zalo|facebook)/i;
const V62K_BAD = /(giết|tự tử|tự sát|ma tuý|ma túy|thuốc lá|rượu|súng|bom|sex|tình dục|khoả thân|khỏa thân|đánh bạc|cờ bạc)/i;
function v62kAiView(){
  const t = V62K.cur, s = v62kProf();
  if(!v62kAiOn()){ v62kBody('<p>💬 Hỏi tự do chỉ có khi mở game trong claude.ai.</p>'); return; }
  v62kBody(`<p class="v62kMuted">Em hỏi ${t.def.g} ${t.def.n.split(' ').slice(1).join(' ')} bất cứ điều gì về <b>${v62kEsc(t.def.s)}</b>. Đừng ghi tên thật, địa chỉ hay số điện thoại nhé. Còn ${Math.max(0, 15 - s.day.ai)} lượt hôm nay.</p>
    <div id="v62kLog" class="v62kLog"></div><div class="v62kAsk"><input id="v62kQ" maxlength="240" placeholder="Em muốn hỏi gì?" autocomplete="off"><button type="button" class="pri" id="v62kSend">Gửi</button></div>`);
  const q = V62K.dlg.querySelector('#v62kQ'); q.onkeydown = e => { if(e.key === 'Enter') v62kAiSend(); };
}
function v62kAiMsg(who, text){ const L = V62K.dlg.querySelector('#v62kLog'); if(!L) return null; const p = document.createElement('p'); p.className = 'v62kM ' + who; p.textContent = text; L.appendChild(p); L.scrollTop = L.scrollHeight; return p; }
function v62kAiStop(){ if(V62K.aiCtl) try { V62K.aiCtl.abort(); } catch(e){} V62K.aiCtl = null; }
async function v62kAiSend(){
  const t = V62K.cur, inp = V62K.dlg.querySelector('#v62kQ'); if(!t || !inp) return; const text = inp.value.trim(); if(!text) return; inp.value = '';
  const s = v62kProf(); v62kAiMsg('me', text);
  if(s.day.ai >= 15){ v62kAiMsg('t', 'Hôm nay mình hỏi nhiều rồi, mai hỏi tiếp nhé! Em thử Câu đố hoặc Thẻ kiến thức nha.'); return; }
  if(V62K_PII.test(text)){ v62kAiMsg('t', `${t.def.g === 'thầy' ? 'Thầy' : 'Cô'} không cần thông tin cá nhân đâu em. Mình chỉ nói chuyện học tập thôi nhé! 🙂`); return; }
  if(V62K_BAD.test(text)){ v62kAiMsg('t', 'Chuyện này em nên hỏi bố mẹ hoặc thầy cô ở trường nhé. Nếu em đang buồn hay lo lắng, hãy kể với người lớn em tin tưởng. 💛'); return; }
  s.day.ai++; v62kSave(); const out = v62kAiMsg('t', '…'); v62kAiStop(); V62K.aiCtl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const sys = `Bạn là ${t.def.n}, một giáo sư ${t.def.s} hiền, vui tính trong game giáo dục "Trường Rubik" cho học sinh Việt Nam 8–15 tuổi. Trả lời bằng tiếng Việt, ngắn (tối đa 5 câu), chính xác, dễ hiểu, kèm 1–2 từ khoá tiếng Anh trong ngoặc. Nếu không chắc thì nói không chắc. Chỉ nói về học tập; nếu câu hỏi không phù hợp trẻ em, nguy hiểm, buồn bã hay về sức khoẻ/y tế thì nhẹ nhàng từ chối và khuyên em hỏi bố mẹ hoặc thầy cô. Tuyệt đối không hỏi hay ghi nhớ tên thật, địa chỉ, trường, số điện thoại, ảnh hay mật khẩu. Không đóng vai bác sĩ. Hay hỏi lại 1 câu ngắn để em tự suy nghĩ.`;
  try { const r = await V40.sample([{role:'user', content:sys + '\n\nCâu hỏi của học sinh: ' + text}], V62K.aiCtl ? {signal:V62K.aiCtl.signal} : undefined);
    if(out) out.textContent = String(r && r.text || '').slice(0, 1200) || '…'; v62kGive(1, 0, 'Hỏi ' + t.def.n);
  } catch(e){ if(out) out.textContent = 'Mạng đang chậm, em hỏi lại sau nhé.'; }
}
