// ================= v67l · LƯƠNG CỦA EM 1/4: lõi — 6 nguồn công, giới hạn mỗi ngày, bậc lương, nhận lương, móc vào game =================
// Chủ game: "Kiếm tiền, diễn văn nghệ, tham gia hội thi, giúp thầy cô mang đồ, giúp phòng tin học, học giỏi hơn đều được lương."
// Tiền trong game (PROF.money) — không có tiền thật, không mua bằng tiền thật. Mọi tên toàn cục có tiền tố v67l / V67L.
// Cách cộng công: bọc reward() (đọc lý do thưởng), mprog() (mã hoạt động), đếm số món bán ở cửa hàng; 3 việc mới (v67l-stage, v67l-jobs) gọi v67lAdd().
const V67L_PHI = 1.618033988749895;
const V67L_CATS = [
  {k:'work',  ic:'💼', n:'Làm việc kiếm tiền',  s:'Bán hàng, thu hoạch, nấu ăn, câu cá…',        go:'market'},
  {k:'art',   ic:'🎤', n:'Diễn văn nghệ',        s:'Hát, đàn, múa, kể chuyện, vẽ tranh',           go:'stage'},
  {k:'cont',  ic:'🏆', n:'Tham gia hội thi',     s:'Cờ, Rubik, Olympic thể thao, giải đấu',        go:'games'},
  {k:'teach', ic:'🧑‍🏫', n:'Giúp thầy cô mang đồ', s:'Chạm thầy cô có bong bóng 📦 để nhận việc',   go:'teach'},
  {k:'it',    ic:'💻', n:'Giúp phòng tin học',   s:'Sửa máy hỏng ở Trường Tin học, giúp cô Lam',   go:'it'},
  {k:'smart', ic:'🧠', n:'Học giỏi hơn',          s:'Bài học, đọc sách, đố vui, Cây thần kỳ',       go:'learn'}
];
const V67L_CAP = 8;                      // tối đa 8 công mỗi nguồn mỗi ngày → không spam
const V67L_PAYH = 16*60;                 // phát lương sau 16:00 (tan học) theo đồng hồ trong game
// bậc lương: tổng công đã nhận → $ mỗi công (mốc cuối 618 ≈ 1000/φ)
const V67L_LV = [[0, 'Tập sự', 3], [40, 'Chăm chỉ', 4], [120, 'Giỏi việc', 5], [300, 'Xuất sắc', 6], [618, 'Ngôi sao', 8]];
const V67L = {self:0, cd:{}, catT:{}, sales:-1, popT:0, panel:null, slip:null, on:false};

// ---------- 1. lưu (PROF.v67l hoặc khách) ----------
function v67lDay(){ const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function v67lWeek(){ const d = new Date(), t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), w = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - w); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() + '-W' + Math.ceil(((t - y0)/864e5 + 1)/7); }
function v67lZero(){ const o = {}; V67L_CATS.forEach(c => o[c.k] = 0); return o; }
function v67lDef(){ return {d:'', wk:'', today:v67lZero(), week:v67lZero(), pend:v67lZero(), pd:'', tot:0, paid:0, hist:[], cnt:{carry:0, fix:0, show:0}, lam:''}; }
function v67lState(){
  let s;
  if(typeof PROF !== 'undefined' && PROF){ if(!PROF.v67l) PROF.v67l = v67lDef(); s = PROF.v67l; }
  else { if(!V67L.G){ let g = null; try { g = JSON.parse(localStorage.getItem('truong-v67l-guest') || 'null'); } catch(e){} V67L.G = Object.assign(v67lDef(), g || {}); } s = V67L.G; }
  ['today', 'week', 'pend'].forEach(k => { if(!s[k]) s[k] = v67lZero(); V67L_CATS.forEach(c => { if(!(s[k][c.k] >= 0)) s[k][c.k] = 0; }); });
  if(!Array.isArray(s.hist)) s.hist = []; if(!s.cnt) s.cnt = {carry:0, fix:0, show:0};
  const d = v67lDay(), w = v67lWeek(); if(s.d !== d){ s.d = d; s.today = v67lZero(); } if(s.wk !== w){ s.wk = w; s.week = v67lZero(); }
  return s;
}
function v67lSave(){ try { if(typeof PROF !== 'undefined' && PROF) saveProfile(); else localStorage.setItem('truong-v67l-guest', JSON.stringify(v67lState())); } catch(e){} }
const v67lCat = k => V67L_CATS.find(c => c.k === k);
const v67lSum = o => V67L_CATS.reduce((a, c) => a + (o[c.k] || 0), 0);
function v67lLv(tot){ let i = 0; for(let j = 0; j < V67L_LV.length; j++) if(tot >= V67L_LV[j][0]) i = j; const L = V67L_LV[i], N = V67L_LV[i + 1]; return {i, name:L[1], rate:L[2], next:N ? N[0] : 0, nextName:N ? N[1] : '', from:L[0]}; }
function v67lEsc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c])); }

// ---------- 2. cộng công (có trần mỗi ngày + chống lặp) ----------
// key: nguồn cụ thể (một hành động chỉ được cộng 1 lần mỗi 20 giây); một nguồn lương không cộng 2 lần trong 3 giây (reward + mprog cùng lúc)
function v67lAdd(k, n, key, quiet){
  const C = v67lCat(k); if(!C) return 0; n = Math.max(1, Math.round(n || 1));
  const now = performance.now(), kk = key || k;
  if(V67L.cd[kk] && now - V67L.cd[kk] < 20000) return 0;
  if(!/^v67l/.test(kk) && V67L.catT[k] && now - V67L.catT[k] < 3000) return 0;
  const s = v67lState(), room = V67L_CAP - s.today[k]; if(room <= 0){ v67lCapMsg(C); return 0; }
  const g = Math.min(room, n); V67L.cd[kk] = now; V67L.catT[k] = now;
  s.today[k] += g; s.week[k] += g; s.pend[k] += g; if(!s.pd) s.pd = s.d;
  v67lSave(); if(!quiet) v67lPop(`+${g} công ${C.ic} ${C.n.replace(/ (kiếm tiền|mang đồ|hơn)$/, '')}` + (s.today[k] >= V67L_CAP ? ' · đủ công hôm nay!' : ''));
  try { if(V67L.panel && !V67L.panel.hidden) v67lRender(); } catch(e){}
  return g;
}
function v67lCapMsg(C){ const t = performance.now(); if(t - (V67L.capT || 0) < 60000) return; V67L.capT = t; v67lPop(`${C.ic} Hôm nay em đã đủ ${V67L_CAP} công ${C.n.toLowerCase()} rồi. Thử việc khác nhé!`); }
// thông báo nhỏ: dùng toast có sẵn; khi đang ở cảnh toàn màn hình (phòng tin học, sân khấu) thì hiện chip nhỏ của v67l
function v67lPop(msg){
  const full = (typeof V51T !== 'undefined' && V51T.open) || document.body.classList.contains('v67lFull');
  if(!full){ try { toast(msg); return; } catch(e){} }
  let p = document.getElementById('v67lPop'); if(!p){ p = document.createElement('div'); p.id = 'v67lPop'; p.setAttribute('role', 'status'); document.body.appendChild(p); }
  p.textContent = msg; p.hidden = false; p.classList.remove('v67lIn'); void p.offsetWidth; p.classList.add('v67lIn');
  clearTimeout(V67L.popT); V67L.popT = setTimeout(() => { p.hidden = true; }, 2600);
}

// ---------- 3. phân loại các phần thưởng có sẵn ----------
// lý do thưởng (why) của reward() → nguồn lương + số công (huy chương vàng/bạc được thêm)
function v67lClassify(why){
  const w = String(why || ''); if(!w || /Lương|Phiếu lương/.test(w)) return null;
  const medal = /huy chương vàng/i.test(w) ? 3 : /huy chương bạc/i.test(w) ? 2 : 1;
  if(/^Thắng|huy chương|Đấu trường|^Giải [^x]|Hội thi|hạng nhất/i.test(w)) return ['cont', medal];
  if(/^Bán|bán ở chợ|Thu hoạch|Nấu|Mời bạn ăn|giao hàng|Giao hàng|chăn cừu|Câu cá|Câu được|Thành phố an toàn|cửa hàng|Trồng|Tưới|tưới|Cho .{1,12} ăn|làm thêm|Làm việc|Pha chế|Bán hàng/i.test(w)) return ['work', 1];
  if(/piano|đàn|guitar|violin|sáo|kèn|trống|(^|\s)hát|Nhạc|nhạc|văn nghệ|múa|kể chuyện|Vẽ|vẽ tranh|tranh|Kịch|biểu diễn|sân khấu/i.test(w)) return ['art', 1];
  if(/Luyện|Câu hỏi|Học|học|Đọc|đọc|sách|Sách|truyện|Toán|toán|Tin học|câu đố|đố vui|Trả lời|Cây thần kỳ|thẻ nhớ|Gõ phím|Ngắm|điểm danh|Coach|Thầy |Cô |Khám phá|hành tinh|Huy hiệu|Phép thuật|phép|Sudoku/i.test(w)) return ['smart', 1];
  if(/cờ|Cờ|Rubik|Olympic|Kart|Bóng|bóng|Bơi|Bắn cung|Cử tạ|Nhảy cầu|Thể dục|Trượt|Đua|đua|côn cầu|Ô ăn quan|xe tăng|Sự kiện|online/i.test(w)) return ['cont', medal];
  return null;
}
// mã hoạt động của mprog() → nguồn lương
const V67L_MP = {
  work:['sell', 'harvest', 'plant', 'feed', 'farm', 'bbq', 'bigfish', 'deepfish', 'fish3', 'trade'],
  art:['piano', 'guitar', 'paint', 'npcart'],
  cont:['chess', 'chessai', 'caro', 'c4', 'go', 'oaq', 'online', 'olympic', 'medal', 'race', 'football', 'basket', 'ski', 'skate', 'patin', 'rubik', 'event'],
  smart:['learn', 'school', 'book', 'readall', 'comicread', 'library', 'math', 'memory', 'rubikcoach', 'chesslearn', 'rubiklab', 'sudoku']
};
const V67L_MPK = {}; Object.keys(V67L_MP).forEach(k => V67L_MP[k].forEach(id => V67L_MPK[id] = k));

// ---------- 4. nhận lương ----------
function v67lPayOK(s){
  s = s || v67lState(); if(v67lSum(s.pend) <= 0) return {ok:false, why:'none'};
  if(s.pd && s.pd !== s.d) return {ok:true, why:'old'};                     // công của những ngày trước: nhận lúc nào cũng được
  const c = typeof clock === 'number' ? clock : 0; if(c >= V67L_PAYH) return {ok:true, why:'time'};
  return {ok:false, why:'wait', left:V67L_PAYH - c};
}
function v67lCalc(s){
  s = s || v67lState(); const L = v67lLv(s.tot), base = v67lSum(s.pend)*L.rate, kinds = V67L_CATS.filter(c => s.pend[c.k] > 0).length;
  const bonus = kinds >= 6 ? 30 : kinds >= 4 ? 12 : 0;                      // thưởng chuyên cần: làm đủ nhiều loại việc
  return {lv:L, base, kinds, bonus, pay:base + bonus, cong:v67lSum(s.pend)};
}
function v67lPay(){
  const s = v67lState(), ok = v67lPayOK(s); if(!ok.ok) return null;
  if(typeof PROF === 'undefined' || !PROF){ try { loginNudge(); } catch(e){} v67lPop('🔑 Đăng nhập để nhận lương vào hồ sơ nhé!'); return null; }
  const R = v67lCalc(s), slip = {at:Date.now(), day:typeof day === 'number' ? day : 0, d:s.d, c:Object.assign({}, s.pend), rate:R.lv.rate, lv:R.lv.name, base:R.base, bonus:R.bonus, kinds:R.kinds, pay:R.pay, no:(s.paid || 0) + 1, name:PROF.name};
  PROF.money += R.pay; s.tot += R.cong; s.paid = slip.no; s.pend = v67lZero(); s.pd = ''; s.hist.unshift(slip); s.hist = s.hist.slice(0, 7);
  try { floatText(`+$${R.pay} lương`, '#ffd23f'); } catch(e){} try { renderProfHud(); } catch(e){} try { cheerSfx(); } catch(e){}
  try { log('event', `${PROF.name} nhận lương $${R.pay} (${R.cong} công).`); } catch(e){}
  const L2 = v67lLv(s.tot); if(L2.i > R.lv.i) setTimeout(() => v67lPop(`🎖️ Lên bậc lương: ${L2.name} · $${L2.rate}/công`), 1400);
  v67lSave(); return slip;
}

// ---------- 5. móc vào game ----------
function v67lHooks(){
  if(typeof reward === 'function'){ const r0 = reward; reward = function(exp, money, why, quiet){ const r = r0.apply(this, arguments); try { if(!V67L.self && typeof PROF !== 'undefined' && PROF){ const c = v67lClassify(why); if(c) v67lAdd(c[0], c[1], 'r:' + String(why).slice(0, 40)); } } catch(e){ console.warn('v67l reward', e); } return r; }; }
  if(typeof mprog === 'function'){ const m0 = mprog; mprog = function(id){ const r = m0.apply(this, arguments); try { const k = V67L_MPK[id]; if(k && typeof PROF !== 'undefined' && PROF) v67lAdd(k, 1, 'm:' + id); } catch(e){} return r; }; }
  // bán hàng ở cửa hàng của em (khách NPC hoặc người chơi khác mua) → công làm việc
  setInterval(() => { try { if(typeof PROF === 'undefined' || !PROF || !PROF.myshop){ V67L.sales = -1; return; } const n = PROF.myshop.sales || 0; if(V67L.sales >= 0 && n > V67L.sales) v67lAdd('work', Math.min(2, n - V67L.sales), 'shop' + n); V67L.sales = n; } catch(e){} }, 2000);
  if(typeof quickSell === 'function'){ const q0 = quickSell; quickSell = function(){ const m = PROF ? PROF.money : 0, r = q0.apply(this, arguments); try { if(PROF && PROF.money > m) v67lAdd('work', 1, 'qs' + Date.now()); } catch(e){} return r; }; }
  // menu ☰ + hồ sơ
  if(typeof v32Items === 'function'){ const mi = v32Items; v32Items = function(){ const L = mi(); L.push({ic:'scroll', en:'My Salary', vi:'💰 Lương của em', grp:'life', f:() => v67lOpen()}); return L; }; }
  if(typeof openProfile === 'function'){ const op = openProfile; openProfile = function(){ const r = op.apply(this, arguments); try { v67lProfBtn(); } catch(e){} return r; }; }
}
function v67lProfBtn(){
  const box = document.getElementById('pfInfo'); if(!box || box.querySelector('.v67lPfB')) return; const s = v67lState(), C = v67lCalc(s);
  const b = document.createElement('button'); b.type = 'button'; b.className = 'v67lPfB'; b.innerHTML = `💰 Lương của em <small>${v67lSum(s.today)} công hôm nay · chờ nhận $${C.pay}</small>`;
  b.onclick = () => { try { closeModal('mProfile'); } catch(e){} v67lOpen(); }; box.appendChild(b);
}
function v67lInit(){
  if(V67L.on || /[?&]nov67l/.test(location.search)) return; V67L.on = true;
  v67lCss(); v67lHooks();
  try { v67lStageInit(); } catch(e){ console.warn('v67l stage', e); }
  try { v67lJobsInit(); } catch(e){ console.warn('v67l jobs', e); }
  // nhắc nhẹ khi tới giờ phát lương (một lần mỗi ngày)
  setInterval(() => { try { const s = v67lState(); if(s.rem === s.d || typeof PROF === 'undefined' || !PROF) return; if(v67lPayOK(s).ok){ s.rem = s.d; v67lPop('💰 Đã tới giờ phát lương! Mở ☰ → Lương của em để nhận nhé.'); } } catch(e){} }, 15000);
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v67l = {V67L, v67lState, v67lAdd, v67lPay, v67lOpen, v67lClassify};
}
