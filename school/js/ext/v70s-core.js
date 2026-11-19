// ================= v70s · CỐT TRUYỆN 2/3: lõi — trạng thái (PROF.v70s), sự kiện, nhiệm vụ, dẫn đường, phần thưởng =================
// Sự kiện lấy từ hàm có sẵn bằng cách BỌC: mprog(id) → 'm:id', reward(…, why) → 'r:why', v66tOpen → 'tree', v51tOpen → 'tech',
// v67lAdd (lương) → 'job', góc nhìn hành tinh v56p → 'planet'. Không có vòng vẽ mỗi khung: chỉ một nhịp 250 ms + rAF lúc lia camera.
// Người chơi có thể bỏ qua cốt truyện (s.on = 0) — mọi tính năng cũ vẫn chạy như trước.
const V70S = {guest:null, busy:false, iv:0, q:[], t0:0, arrT:0, planT:0, pan:null, ui:{}, lastKey:'', ready:false};
function v70sDef(){ return {v:1, on:1, ch:0, q:0, n:0, done:[], qd:[], titles:[], title:'', intro:0, fin:0, open:''}; }
function v70sSt(){
  if(typeof PROF === 'undefined' || !PROF) return V70S.guest || (V70S.guest = v70sDef());
  if(!PROF.v70s || typeof PROF.v70s !== 'object') PROF.v70s = v70sDef();
  return PROF.v70s;
}
function v70sSave(){ try { if(typeof PROF !== 'undefined' && PROF) saveProfile(); } catch(e){} }
function v70sCur(){ const s = v70sSt(), C = V70S_CH[s.ch]; return C ? {s, C, Q:C.q[s.q] || null} : {s, C:null, Q:null}; }
function v70sEsc(t){ return String(t).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c])); }
function v70sMe(){ return typeof PLAYER !== 'undefined' && PLAYER && PLAYER.visible ? PLAYER : null; }
function v70sName(){ return (typeof PROF !== 'undefined' && PROF && PROF.name) || 'Em'; }

// ---------- nơi chốn (toạ độ mới của đảo v46) ----------
const V70S_PLACE = {tree:'Cây thần kỳ', tech:'Trường Tin học', airport:'Sân bay Quốc tế Rubik', harbor:'Bến cảng', houses:'Khu nhà ở'};
function v70sPlace(at){ if(V70S_PLACE[at]) return V70S_PLACE[at]; try { const r = R[at]; if(r && r.name) return String(r.name).replace(/\s*[·(].*$/, ''); } catch(e){} return at || ''; }
function v70sPt(at){
  try {
    if(!at || typeof V46 === 'undefined' || !V46.on) return null;
    if(at === 'harbor') return v46ToNew(1380, 840, 'harbor');               // bến tàu (giống nút ⛵ v46)
    if(at === 'tree'){ const G = v66tGeo(); return [G.door[0], G.door[1] + 20]; }
    if(at === 'tech'){ const G = v51tGeo(); return [G.door[0], G.gy + 22]; }
    if(at === 'airport'){ const A = typeof V57P !== 'undefined' && V57P.A; return A && A.term ? [A.term[2] + 90, Math.round((A.term[1] + A.term[3])/2)] : null; }
    const z = V46.ZI[at]; return z ? v46Entry(z) : null;
  } catch(e){ return null; }
}
function v70sDist(at){ const me = v70sMe(), pt = v70sPt(at); if(!me || !pt) return 1e9; const p = v46Pos(me); return Math.hypot(p[0] - pt[0], p[1] - pt[1]); }
// dẫn đường bằng dấu chân v59g (qua v32Nav — cùng hệ dẫn đường với bản đồ)
function v70sGuide(quiet){
  const {s, Q} = v70sCur(); if(!Q || !s.on) return false; const at = Q.at, pt = v70sPt(at);
  if(!pt){ if(!quiet) v70sToast('📖 ' + Q.d); return false; }
  if(!v70sMe()){ if(!quiet) v70sToast('📖 Vào thế giới để đi theo dấu chân nhé!'); return false; }
  try { const o = v46ToOld(pt[0], pt[1]); v32Nav(o[0], o[1], '📖 ' + v70sPlace(at), false); if(!quiet) v70sToast('👣 Đi theo dấu chân tới ' + v70sPlace(at) + ' nhé!'); return true; } catch(e){ return false; }
}
function v70sToast(t){ try { toast(t); } catch(e){} }

// ---------- sự kiện từ hoạt động có sẵn ----------
function v70sEv(key){
  const {s, C, Q} = v70sCur(); if(!Q || !s.on || !s.intro || Q.type !== 'do' || !Q.ev || !Q.ev.test(key)) return;
  if(Q.boat){ const me = v70sMe(); if(/^m:fish3$/.test(key) && !(me && me.boat)) return; }
  s.n = (s.n || 0) + 1; v70sSave();
  if(s.n >= (Q.need || 1)) v70sDone(Q, true); else { v70sToast(`📖 ${Q.t}: ${s.n}/${Q.need}`); v70sUi(); }
}
// ---------- hoàn thành nhiệm vụ / chương ----------
function v70sDone(Q, talk){
  const {s, C} = v70sCur(); if(!C || C.q[s.q] !== Q) return;
  if(!s.qd.includes(Q.id)) s.qd.push(Q.id);
  try { reward(25, 3, 'Hành trình: ' + Q.t, true); } catch(e){}
  s.q++; s.n = 0; const last = s.q >= C.q.length; v70sSave(); v70sUi();
  try { blipSfx(1320); } catch(e){}
  const next = () => { if(last) v70sChapterEnd(C); else v70sNext(); };
  if(talk && Q.say && Q.say.length) v70sQueue({lines:Q.say, done:next}); else next();
}
function v70sNext(){
  const {s, Q} = v70sCur(); if(!Q || !s.on) return; v70sUi();
  v70sToast('📖 Nhiệm vụ mới: ' + Q.t); V70S.arrT = 0;
  if(Q.type === 'quiz') v70sQueue({who:Q.who, lines:Q.say || [], quiz:Q.quiz, done:() => v70sDone(Q, false)});
  else setTimeout(() => v70sGuide(true), 600);
}
function v70sChapterEnd(C){
  const s = v70sSt();
  v70sQueue({lines:C.end, shard:C, done:() => {
    if(!s.done.includes(C.id)) s.done.push(C.id);
    if(!s.titles.includes(C.title)){ s.titles.push(C.title); s.title = C.title; }
    let gift = '';
    try { if(typeof mallItem === 'function' && mallItem(C.decor) && typeof bagAdd === 'function'){ bagAdd(C.decor, 1); gift = mallItem(C.decor).name; } } catch(e){}
    try { reward(C.exp, Math.min(20, C.cash), 'Hoàn thành chương: ' + C.name); } catch(e){}
    s.ch++; s.q = 0; s.n = 0; if(s.ch >= V70S_CH.length) s.fin = Date.now();
    v70sSave(); v70sUi();
    v70sToast(`${C.ic} Mảnh Sáng ${C.shard}! Danh hiệu ${C.title}${gift ? ' · Quà: ' + gift : ''} · +$${C.cash}`);
    try { cheerSfx(); } catch(e){}
    setTimeout(() => { if(s.fin) v70sFinale(); else v70sChapterStart(); }, 900);
  }});
}
// mở chương: chữ tiêu đề chương + camera lia tới khu của chương + lời mở đầu
function v70sChapterStart(first){
  const {s, C} = v70sCur(); if(!C) return; s.open = C.id; v70sSave();
  v70sQueue({card:C, pan:C.zone, lines:C.open, ask:first, done:() => v70sNext()});
}
function v70sFinale(){ v70sQueue({card:{ic:'🌟', name:'Khối Rubik Ánh Sáng rực rỡ!', col:'#ffd23f', fin:1}, pan:'rubikpark', lines:[['rubi', `Cảm ơn ${v70sName()}! Em có thể xem lại hành trình trong 📖 bất cứ lúc nào.`]], done:() => v70sUi()}); }

// ---------- nhịp kiểm tra (250 ms) ----------
function v70sFree(){
  try {
    if(typeof openModal !== 'undefined' && openModal) return false;
    if(typeof V67S !== 'undefined' && V67S.on) return false;
    if(typeof V51T !== 'undefined' && V51T.open) return false;
    if(typeof V66T !== 'undefined' && V66T.panel) return false;
    const a = document.getElementById('v67lAsk'); if(a && !a.hidden) return false;
    const f = document.getElementById('v67lFix'); if(f && !f.hidden && f.offsetParent) return false;
  } catch(e){}
  return !V70S.busy && !V70S.pan && !(V70S.ui.book && !V70S.ui.book.hidden);
}
function v70sTick(){
  if(typeof PROF === 'undefined' || !PROF) { v70sUi(); return; }
  const s = v70sSt(), me = v70sMe(); if(V70S.lastKey !== PROF.name){ V70S.lastKey = PROF.name; V70S.t0 = performance.now(); v70sUi(); }
  // góc nhìn hành tinh (thu nhỏ thật xa)
  try { if(s.on && typeof v56pBlend === 'function' && typeof V46 !== 'undefined' && V46.on && cam && v56pBlend(cam.z) > .55 && performance.now() - V70S.planT > 4000){ V70S.planT = performance.now(); v70sEv('planet'); } } catch(e){}
  if(!s.on || !me || !v70sFree()) return;
  if(V70S.q.length){ v70sRun(V70S.q.shift()); return; }
  if(!s.intro){ if(performance.now() - V70S.t0 > 7000){ s.intro = 1; v70sSave(); v70sChapterStart(true); } return; }
  const {C, Q} = v70sCur(); if(!Q) return;
  if(s.open !== C.id){ v70sChapterStart(); return; }                      // vào lại game giữa chương → nhắc lại lời mở chương
  if(Q.type === 'go' && v70sDist(Q.at) < 170 && performance.now() - V70S.arrT > 12000){
    V70S.arrT = performance.now();
    try { if(typeof GUIDE !== 'undefined' && GUIDE && String(GUIDE.name || '').startsWith('📖')){ GUIDE = null; V32.nav = null; } } catch(e){}
    v70sQueue({who:Q.who, lines:Q.say || [], quiz:Q.quiz, done:() => v70sDone(Q, false)});
  }
}
function v70sQueue(job){ if(v70sFree() && v70sMe()) v70sRun(job); else V70S.q.push(job); }

// ---------- bọc hàm cũ để nhận sự kiện ----------
function v70sWrap(){
  if(typeof mprog === 'function'){ const f = mprog; mprog = function(id){ const r = f.apply(this, arguments); try { v70sEv('m:' + id); } catch(e){} return r; }; }
  if(typeof reward === 'function'){ const f = reward; reward = function(exp, money, why){ const r = f.apply(this, arguments); try { if(why) v70sEv('r:' + why); } catch(e){} return r; }; }
  if(typeof v66tOpen === 'function'){ const f = v66tOpen; v66tOpen = function(){ const r = f.apply(this, arguments); try { v70sEv('tree'); } catch(e){} return r; }; }
  if(typeof v51tOpen === 'function'){ const f = v51tOpen; v51tOpen = function(){ const r = f.apply(this, arguments); try { v70sEv('tech'); } catch(e){} return r; }; }
  if(typeof v67lAdd === 'function'){ const f = v67lAdd; v67lAdd = function(){ const r = f.apply(this, arguments); try { if(r) v70sEv('job'); } catch(e){} return r; }; }
}
function v70sInit(){
  if(V70S.ready) return; V70S.ready = true;
  v70sWrap(); v70sUiInit(); V70S.t0 = performance.now();
  V70S.iv = setInterval(() => { try { v70sTick(); } catch(e){ console.warn('v70s tick', e); } }, 250);
}
