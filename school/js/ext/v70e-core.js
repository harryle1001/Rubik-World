// ================= v70e · LÝ DO QUAY LẠI MỖI NGÀY 1/3: lõi — lịch lễ hội, 60 thành tựu, điểm danh 7 ngày, bảng vàng =================
// Chủ game: "nâng cấp game này lên tầm cao mới". Mọi tên toàn cục có tiền tố v70e / V70E. Tiền trong game, không mua bằng tiền thật, không hộp may rủi.
// Lưu: PROF.v70e (khách: localStorage truong-v70e-guest). Ngày thật đọc qua v70eNow() → thử lễ hội bằng v70eSetDate('2026-02-17').
const V70E_PHI = 1.618033988749895;
const V70E = {on:false, off:0, cd:{}, q:[], qOn:false, panel:null, tab:'fest', ev:null, evK:'', act:null, near:'', dn:null, board:null, bKey:'', bT:0, online:null, onT:0, G:null, ckAsk:'', wear:true};

// ---------- 0. ngày thật (có thể giả để thử) ----------
function v70eNow(){ return new Date(Date.now() + V70E.off); }
function v70eSetDate(s){ const t = new Date(s + 'T09:00:00'); V70E.off = isFinite(t) ? t - Date.now() : 0; V70E.evK = ''; v70eEvent(true); try { if(V70E.panel && !V70E.panel.hidden) v70eRender(); } catch(e){} return v70eEvent() ? v70eEvent().n : 'không có lễ hội thật — dùng lễ hội theo mùa'; }
const v70eD = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
function v70eDay(){ return v70eD(v70eNow()); }
function v70eWeek(){ const d = v70eNow(), t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), w = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - w); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() + '-W' + Math.ceil(((t - y0)/864e5 + 1)/7); }
const v70eDiff = (a, b) => Math.round((new Date(a + 'T12:00:00') - new Date(b + 'T12:00:00'))/864e5);
function v70eEsc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c])); }
function v70eRnd(seed){ let s = seed >>> 0 || 1; return () => { s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909); s ^= s >>> 16; return (s >>> 0)/4294967296; }; }
function v70eHash(str){ let h = 5381; for(let i = 0; i < str.length; i++) h = (Math.imul(h, 33) ^ str.charCodeAt(i)) >>> 0; return h; }

// ---------- 1. lịch lễ hội ----------
// âm lịch: mùng 1 Tết và rằm tháng 8 (dương lịch) 2025–2030
const V70E_TET = {2025:'01-29', 2026:'02-17', 2027:'02-06', 2028:'01-26', 2029:'02-13', 2030:'02-03'};
const V70E_TT  = {2025:'10-06', 2026:'09-25', 2027:'09-15', 2028:'10-03', 2029:'09-22', 2030:'09-12'};
// k: mã · n: tên · ic · th: kiểu trang trí · ban: băng rôn ở cổng trường · from/to: số ngày quanh ngày chính · acts: hoạt động · wear: đồ lễ của NPC · old: lễ hội cũ (festival) tương ứng
const V70E_EV = {
  tet:      {n:'Tết Nguyên đán', ic:'🧧', ban:'CHÚC MỪNG NĂM MỚI', th:{lan:['#e53935', '#c62828'], flag:['#e53935', '#ffd23f'], fl:['#ff8fb1', '#ffd23f'], tassel:'#ffd23f'}, acts:['banhchung', 'quiz'], wear:'tet', old:'lan', gift:'🏮 Đèn lồng Tết', d:'Cả trường gói bánh chưng, treo đèn lồng đỏ, hoa đào hoa mai nở rộ.'},
  trungthu: {n:'Tết Trung thu', ic:'🏮', ban:'VUI TẾT TRUNG THU', th:{lan:['#ffd23f', '#ef6c00', '#e53935', '#8e24aa'], star:1, flag:['#ffd23f', '#ef6c00'], fl:['#ffd23f'], tassel:'#e53935'}, acts:['ruocden', 'quiz'], wear:'trungthu', old:'lan', gift:'⭐ Đèn ông sao', d:'Rước đèn ông sao quanh quảng trường, ngắm trăng rằm, múa lân.'},
  khaigiang:{n:'Lễ Khai giảng', ic:'🥁', ban:'CHÀO NĂM HỌC MỚI', th:{flag:['#e53935', '#ffd23f', '#1e88e5', '#43a047'], fl:['#e53935', '#fff59d'], balloon:1}, acts:['trong', 'quiz'], wear:'khaigiang', old:'thamlop', gift:'🎒 Cặp sách năm học mới', d:'Tiếng trống khai trường rộn ràng, bóng bay và cờ hoa khắp sân.'},
  nhagiao:  {n:'Ngày Nhà giáo 20/11', ic:'💐', ban:'TRI ÂN THẦY CÔ 20-11', th:{flag:['#e53935', '#ffd23f', '#ec407a'], fl:['#ec407a', '#ffd23f', '#e53935', '#fff'], arch:1}, acts:['thiep', 'quiz'], wear:'nhagiao', old:'thamlop', gift:'💐 Bó hoa tri ân', d:'Cổng hoa rực rỡ, các bạn tặng hoa và viết thiệp cảm ơn thầy cô.'},
  thieunhi: {n:'Tết Thiếu nhi 1/6', ic:'🎈', ban:'VUI TẾT THIẾU NHI 1-6', th:{flag:['#ec407a', '#29b6f6', '#ffd23f', '#66bb6a'], fl:['#ffd23f', '#ec407a'], balloon:1}, acts:['bongbay', 'quiz'], wear:'thieunhi', old:'picnic', gift:'🎈 Chùm bóng bay', d:'Bóng bay bay khắp quảng trường — ai nhặt được nhiều nhất?'},
  noel:     {n:'Giáng sinh', ic:'🎄', ban:'GIÁNG SINH AN LÀNH', th:{bulb:['#e53935', '#ffd23f', '#43a047', '#29b6f6'], flag:['#e53935', '#43a047', '#fff'], fl:['#e53935'], pine:1}, acts:['quanoel', 'quiz'], wear:'noel', old:'noel', gift:'🎁 Hộp quà Giáng sinh', d:'Đèn nháy lung linh, cây thông nhỏ ở cổng, đi tìm hộp quà quanh quảng trường.'},
  // lễ hội theo mùa trong game (khi không có ngày lễ thật)
  khoahoc:  {n:'Hội chợ khoa học', ic:'🔬', ban:'HỘI CHỢ KHOA HỌC', th:{flag:['#1e88e5', '#26c6da', '#7e57c2'], fl:['#fff59d'], booth:1}, acts:['nuilua', 'quiz'], wear:'khoahoc', old:null, gift:'🧪 Bộ thí nghiệm nhí', d:'Gian trưng bày thí nghiệm: núi lửa, nam châm, mạch điện. Mùa Xuân.', se:'xuan'},
  caythan:  {n:'Lễ hội Cây thần kỳ', ic:'🌳', ban:'LỄ HỘI CÂY THẦN KỲ', th:{leaf:1, flag:['#43a047', '#9ccc65', '#ffd23f'], fl:['#ff8fb1', '#ffd23f', '#fff']}, acts:['trongcay', 'quiz'], wear:'caythan', old:'picnic', gift:'🍃 Vòng lá thần kỳ', d:'Vòng lá xanh, học cách trồng cây và chăm sóc thiên nhiên. Mùa Hạ.', se:'ha'},
  hoithao:  {n:'Hội thao trường', ic:'🏃', ban:'HỘI THAO TRƯỜNG', th:{flag:['#e53935', '#1e88e5', '#ffd23f', '#43a047'], fl:['#ffd23f']}, acts:['tiepsuc', 'quiz'], wear:'hoithao', old:'bongda', gift:'🏆 Cúp hội thao', d:'Chạy tiếp sức, bóng đá Đội Đỏ – Đội Xanh, băng đô cổ vũ. Mùa Thu.', se:'thu'},
  rubik:    {n:'Hội thi Rubik', ic:'🧩', ban:'HỘI THI RUBIK MÙA ĐÔNG', th:{flag:['#ffffff', '#ffd23f', '#e53935', '#ef6c00', '#1e88e5', '#43a047'], fl:['#fff']}, acts:['rubikbuoc', 'quiz'], wear:'rubik', old:'noel', gift:'🧩 Cúp Rubik băng giá', d:'Hội thi giải Rubik: ai nhớ đúng các bước giải nhanh nhất? Mùa Đông.', se:'dong'}
};
// lễ hội theo ngày thật: [mã, ngày chính (MM-DD hoặc bảng âm lịch), bắt đầu trước, kết thúc sau]
function v70eRealList(y){
  const L = [['khaigiang', '09-05', 4, 2], ['nhagiao', '11-20', 5, 1], ['noel', '12-25', 5, 1], ['thieunhi', '06-01', 2, 2]];
  if(V70E_TET[y]) L.push(['tet', V70E_TET[y], 3, 6]); if(V70E_TET[y + 1] && V70E_TET[y + 1] < '01-08') L.push(['tet', V70E_TET[y + 1], 3, 6, y + 1]);
  if(V70E_TT[y]) L.push(['trungthu', V70E_TT[y], 5, 2]);
  return L;
}
// lễ hội đang diễn ra: ưu tiên ngày thật, nếu không thì theo mùa trong game
function v70eEvent(force){
  const now = v70eNow(), y = now.getFullYear(), d = v70eD(now), se = (typeof season === 'string') ? season : 'ha', key = d + '|' + se;
  if(!force && V70E.evK === key) return V70E.ev;
  let ev = null;
  for(const [k, md, b, a, yy] of v70eRealList(y)){ const main = (yy || y) + '-' + md, df = v70eDiff(d, main); if(df >= -b && df <= a){ ev = {k, real:true, main, from:v70eD(new Date(new Date(main + 'T12:00:00') - b*864e5)), to:v70eD(new Date(new Date(main + 'T12:00:00').getTime() + a*864e5)), left:a - df}; break; } }
  if(!ev){ const k = Object.keys(V70E_EV).find(q => V70E_EV[q].se === se); if(k) ev = {k, real:false, main:d, from:d, to:d, left:0}; }
  if(ev){ Object.assign(ev, V70E_EV[ev.k]); ev.id = ev.k + '-' + (ev.real ? ev.main.slice(0, 4) : d); }
  V70E.ev = ev; V70E.evK = key; return ev;
}
// lễ hội thật sắp tới (để hiện lịch)
function v70eUpcoming(){
  const now = v70eNow(), d = v70eD(now), y = now.getFullYear(), out = [];
  [y, y + 1].forEach(yy => v70eRealList(yy).forEach(([k, md, b, a, y2]) => { const main = (y2 || yy) + '-' + md, df = v70eDiff(main, d); if(df > -a && df < 400 && !out.some(o => o.main === main)) out.push({k, main, df, n:V70E_EV[k].n, ic:V70E_EV[k].ic}); }));
  return out.sort((p, q) => p.df - q.df).slice(0, 6);
}

// ---------- 2. lưu ----------
function v70eDef(){ return {c:{}, pl:{}, got:{}, title:'', mx:0, ck:{last:'', n:0, streak:0, best:0}, fest:{}, wk:'', wkp:0, tot:0}; }
function v70eState(){
  let s;
  if(typeof PROF !== 'undefined' && PROF){ if(!PROF.v70e) PROF.v70e = v70eDef(); s = PROF.v70e; }
  else { if(!V70E.Gs){ let g = null; try { g = JSON.parse(localStorage.getItem('truong-v70e-guest') || 'null'); } catch(e){} V70E.Gs = Object.assign(v70eDef(), g || {}); } s = V70E.Gs; }
  const D = v70eDef(); for(const k in D) if(s[k] == null) s[k] = D[k];
  const w = v70eWeek(); if(s.wk !== w){ s.wk = w; s.wkp = 0; }
  return s;
}
function v70eSave(){ try { if(typeof PROF !== 'undefined' && PROF) saveProfile(); else localStorage.setItem('truong-v70e-guest', JSON.stringify(v70eState())); } catch(e){} }
const v70eLogged = () => typeof PROF !== 'undefined' && !!PROF;

// ---------- 3. 60 thành tựu = 20 hạng mục × 3 bậc đồng / bạc / vàng ----------
const V70E_TIER = [['đồng', '🥉', '#c77b3a', '#f3c08c'], ['bạc', '🥈', '#9aa7b4', '#eef3f7'], ['vàng', '🥇', '#e0a21a', '#fff0a8']];
const V70E_TR = [
  {k:'rubik',   ic:'🧩', n:'Thần đồng Rubik',      d:'Giải, luyện Rubik',                 t:[1, 10, 40]},
  {k:'chess',   ic:'♟️', n:'Kỳ thủ nhí',           d:'Chơi cờ vua',                       t:[1, 10, 40]},
  {k:'fish',    ic:'🎣', n:'Cần thủ cừ khôi',      d:'Câu được cá',                       t:[1, 25, 100], v:() => PROF.stats.catches},
  {k:'bike',    ic:'🚲', n:'Tay đua xe đạp',       d:'Đạp xe, đua xe',                    t:[1, 10, 30]},
  {k:'boat',    ic:'⛵', n:'Thủy thủ nhí',         d:'Đi thuyền, dạo vịnh',               t:[1, 5, 20]},
  {k:'plane',   ic:'✈️', n:'Phi công nhí',         d:'Bay máy bay',                       t:[1, 5, 20]},
  {k:'read',    ic:'📚', n:'Mọt sách thư viện',    d:'Đọc xong sách, truyện',             t:[1, 5, 15], v:() => Object.keys(PROF.books || {}).length},
  {k:'it',      ic:'💻', n:'Kỹ sư tin học',        d:'Sửa máy, học Tin học',              t:[1, 8, 25], v:() => (PROF.v67l && PROF.v67l.cnt && PROF.v67l.cnt.fix) || 0},
  {k:'art',     ic:'🎤', n:'Nghệ sĩ nhí',          d:'Văn nghệ, đàn, vẽ tranh',           t:[1, 10, 40]},
  {k:'pay',     ic:'💰', n:'Chăm làm có lương',    d:'Nhận lương (Lương của em)',         t:[1, 7, 30], v:() => (PROF.v67l && PROF.v67l.paid) || 0},
  {k:'tree',    ic:'🌳', n:'Bạn của Cây thần kỳ',  d:'Ghé cây, ước, giải đố',             t:[1, 7, 25], v:() => (PROF.v66t && PROF.v66t.n) || 0},
  {k:'sport',   ic:'🏅', n:'Kiện tướng thể thao',  d:'Olympic, bóng, trượt băng…',        t:[1, 10, 40], v:() => PROF.stats.medals || 0},
  {k:'farm',    ic:'🌾', n:'Nhà nông giỏi',        d:'Trồng, cho ăn, thu hoạch',          t:[1, 20, 80]},
  {k:'explore', ic:'🧭', n:'Nhà thám hiểm',        d:'Khám phá nơi mới trên đảo',         t:[3, 8, 15], v:s => Object.keys(s.pl).length},
  {k:'level',   ic:'⭐', n:'Học sinh tiến bộ',     d:'Lên level',                         t:[3, 8, 15], v:() => PROF.level},
  {k:'money',   ic:'🪙', n:'Tiết kiệm giỏi',       d:'Có tiền trong ví (tiền game)',      t:[100, 500, 2000], v:s => Math.max(s.mx || 0, PROF.money)},
  {k:'streak',  ic:'📅', n:'Chuyên cần',           d:'Chơi nhiều ngày liền nhau',         t:[3, 7, 30], v:s => s.ck.best},
  {k:'fest',    ic:'🎉', n:'Vua lễ hội',           d:'Hoạt động lễ hội',                  t:[1, 6, 20]},
  {k:'learn',   ic:'🧠', n:'Siêu trí tuệ',         d:'Học bài, đố vui, toán nhanh',       t:[3, 25, 100]},
  {k:'games',   ic:'🎮', n:'Người chơi chăm chỉ',  d:'Chơi mini game',                    t:[10, 60, 250], v:() => PROF.stats.games}
];
const V70E_MP = {rubik:['rubik', 'rubikcoach', 'rubiklab'], chess:['chess', 'chessai', 'chesslearn'], bike:['cycle', 'ride', 'race'], boat:['boat'], read:['readall', 'comicread', 'book'],
  art:['piano', 'guitar', 'paint', 'npcart'], sport:['olympic', 'medal', 'football', 'basket', 'ski', 'skate', 'patin'], farm:['plant', 'harvest', 'feed', 'farm'], learn:['learn', 'school', 'math', 'memory', 'sudoku']};
const V70E_MPK = {}; Object.keys(V70E_MP).forEach(k => V70E_MP[k].forEach(id => V70E_MPK[id] = k));
const V70E_PLACE = ['beach', 'koi', 'park', 'night', 'meteor', 'imm', 'sky', 'stars', 'cloud', 'whale', 'dolphin', 'squid', 'pirate', 'visit', 'map', 'balloon', 'treasure', 'zen', 'mall', 'library', 'fish3'];
const V70E_RW = [[/Rubik/, 'rubik'], [/cờ vua/i, 'chess'], [/máy bay|^Bay /i, 'plane'], [/Sửa máy|tin học/i, 'it'], [/Cây thần kỳ/, 'tree'], [/Diễn văn nghệ|biểu diễn/i, 'art'],
  [/Câu hỏi|Học bài|Toán nhanh|câu đố|Coach|Thầy Ru|Trả lời đúng|Lật thẻ/i, 'learn'], [/thuyền|Du lịch biển|Dạo vịnh/i, 'boat'], [/Đua|đạp xe/i, 'bike'], [/huy chương|Olympic|Thắng Đấu trường/i, 'sport'], [/Thu hoạch|Trồng|Cho .{1,12} ăn/i, 'farm']];
const v70eTr = k => V70E_TR.find(t => t.k === k);
function v70eVal(t, s){ s = s || v70eState(); let v = s.c[t.k] || 0; if(t.v && v70eLogged()){ try { v = Math.max(v, +t.v(s) || 0); } catch(e){} } return v; }
// cộng một lượt hoạt động (chống lặp: mỗi hạng mục tối đa 1 lần / 3 giây)
function v70eAdd(k, n, key){
  if(!v70eLogged()) return;
  const now = performance.now(), kk = key || k; if(V70E.cd[kk] && now - V70E.cd[kk] < 3000) return; V70E.cd[kk] = now;
  const s = v70eState(); s.c[k] = (s.c[k] || 0) + (n || 1); s.wkp += 1; s.tot += 1;
  v70eCheck(); v70eSave();
}
function v70ePlace(id){ if(!v70eLogged()) return; const s = v70eState(); if(!s.pl[id]){ s.pl[id] = v70eDay(); v70eCheck(); v70eSave(); } }
// kiểm tra mốc → thông báo
function v70eCheck(quiet){
  if(!v70eLogged()) return 0; const s = v70eState(); let n = 0; s.mx = Math.max(s.mx || 0, PROF.money || 0);
  V70E_TR.forEach(t => { const v = v70eVal(t, s); t.t.forEach((need, i) => { const id = t.k + i; if(v >= need && !s.got[id]){ s.got[id] = v70eDay(); n++; if(!quiet) v70eNotify({ic:t.ic, n:t.n, tier:i, d:`${t.d}: ${need}`}); } }); });
  if(n){ v70eSave(); if(!quiet) try { if(V70E.panel && !V70E.panel.hidden) v70eRender(); } catch(e){} }
  return n;
}
const v70eGotN = s => Object.keys((s || v70eState()).got).length;
// danh hiệu: mỗi bậc đã đạt + quà lưu niệm lễ hội
function v70eTitles(){
  const s = v70eState(), L = [];
  V70E_TR.forEach(t => { for(let i = 2; i >= 0; i--) if(s.got[t.k + i]){ L.push({id:t.k + i, tx:`${V70E_TIER[i][1]} ${t.n}`, tier:i}); break; } });
  Object.keys(s.fest).forEach(id => { const f = s.fest[id]; if(f && f.done){ const E = V70E_EV[id.split('-')[0]]; if(E) L.push({id:'f:' + id, tx:`${E.ic} ${E.n} ${id.split('-')[1].slice(0, 4)}`, tier:3}); } });
  if(s.ck.n >= 7) L.push({id:'ck7', tx:'📅 Điểm danh 7 ngày', tier:1});
  return L;
}
function v70eTitleText(){ if(!v70eLogged()) return ''; const s = v70eState(); if(!s.title) return ''; const t = v70eTitles().find(q => q.id === s.title); return t ? t.tx : ''; }

// ---------- 4. thông báo đẹp khi đạt (hàng chờ) ----------
function v70eNotify(o){ V70E.q.push(o); if(!V70E.qOn) v70eNext(); }
function v70eNext(){
  const o = V70E.q.shift(); if(!o){ V70E.qOn = false; return; } V70E.qOn = true;
  let b = document.getElementById('v70eAch'); if(!b){ b = document.createElement('button'); b.type = 'button'; b.id = 'v70eAch'; b.onclick = () => { b.classList.remove('v70eIn'); v70eOpen('ach'); }; document.body.appendChild(b); }
  const T = V70E_TIER[Math.min(2, o.tier)] || V70E_TIER[2], col = o.tier === 3 ? ['#8e24aa', '#f3d4ff'] : [T[2], T[3]];
  b.style.setProperty('--v70eA', col[0]); b.style.setProperty('--v70eB', col[1]);
  b.innerHTML = `<span class="m"><i>${o.ic}</i></span><span class="t"><small>${o.head || '🏅 Thành tựu mới · bậc ' + T[0]}</small><b>${v70eEsc(o.n)}</b><em>${v70eEsc(o.d || '')}</em></span><span class="sp" aria-hidden="true"></span>`;
  b.hidden = false; b.classList.toggle('v70eLow', !!(V70E.panel && !V70E.panel.hidden)); b.classList.remove('v70eIn'); void b.offsetWidth; b.classList.add('v70eIn');
  try { if(o.tier === 2 || o.tier === 3) cheerSfx(); else blipSfx(1320); } catch(e){}
  clearTimeout(V70E.nT); V70E.nT = setTimeout(() => { b.classList.remove('v70eIn'); setTimeout(v70eNext, 420); }, 3400);
}

// ---------- 5. điểm danh 7 ngày + chuỗi ngày chơi ----------
// quà nhỏ: tiền trong game hoặc đồ trang trí nhà (vào túi đồ). Vòng 7 ngày không bị mất khi lỡ một ngày — chỉ chuỗi ngày liền về 1.
const V70E_CK = [{m:10}, {m:15}, {dec:'lamp'}, {m:20}, {m:25}, {dec:'plant'}, {m:50, dec:'gold', big:1}];
function v70eDecorKey(kind){
  try { const K = mallKeys().filter(k => k[0] === 'd'), it = K.map(mallItem).filter(i => i && i.kind === 'decor' && i.price <= (kind === 'gold' ? 4000 : 1600));
    const want = kind === 'lamp' ? /Đèn|đèn/ : kind === 'plant' ? /Chậu|cây|Cây|hoa/ : /Tủ|Kệ|Đồng hồ|Tranh|Gương/;
    const L = it.filter(i => want.test(i.name)), A = L.length ? L : it; if(!A.length) return null; const r = v70eHash(v70eDay() + kind)%A.length; return A[r].key;
  } catch(e){ return null; }
}
function v70eCkInfo(){
  const s = v70eState(), d = v70eDay(), last = s.ck.last, gap = last ? v70eDiff(d, last) : 99;
  return {done:last === d, idx:s.ck.n % 7, streak:gap <= 1 ? s.ck.streak : 0, next:gap === 1 || !last ? s.ck.streak + 1 : last === d ? s.ck.streak : 1};
}
function v70eCheckin(){
  if(!v70eLogged()){ try { loginNudge(); } catch(e){} return null; }
  const s = v70eState(), I = v70eCkInfo(); if(I.done) return null;
  const R = V70E_CK[I.idx], d = v70eDay(), gap = s.ck.last ? v70eDiff(d, s.ck.last) : 99;
  s.ck.streak = gap === 1 ? s.ck.streak + 1 : 1; s.ck.best = Math.max(s.ck.best, s.ck.streak); s.ck.last = d; s.ck.n++; s.wkp += 3;
  let got = [];
  const bonus = s.ck.streak >= 30 ? 10 : s.ck.streak >= 7 ? 5 : 0;      // thưởng chuỗi ngày liền: nhỏ, không tạo áp lực
  if(R.m){ PROF.money += R.m + bonus; got.push(`$${R.m + bonus}`); try { floatText(`+$${R.m + bonus}`, '#ffd23f'); } catch(e){} }
  if(R.dec){ const k = v70eDecorKey(R.dec); if(k){ try { bagAdd(k, 1); got.push('🎁 ' + mallItem(k).name); } catch(e){} } else { PROF.money += 20; got.push('$20'); } }
  try { renderProfHud(); } catch(e){} try { log('event', `${PROF.name} điểm danh ngày ${I.idx + 1}/7 (chuỗi ${s.ck.streak} ngày).`); } catch(e){}
  v70eCheck(); v70eSave(); return {day:I.idx + 1, got, streak:s.ck.streak, big:!!R.big};
}

// ---------- 6. lễ hội: tiến độ hoạt động ----------
function v70eFest(ev){ ev = ev || v70eEvent(); if(!ev) return null; const s = v70eState(); if(!s.fest[ev.id]) s.fest[ev.id] = {a:{}, done:0, day:{}}; const f = s.fest[ev.id]; if(!f.day) f.day = {}; return f; }
// hoàn thành 1 hoạt động: thưởng mỗi ngày 1 lần / hoạt động; làm đủ các hoạt động trong lễ → quà lưu niệm giới hạn + danh hiệu
function v70eActDone(act){
  const ev = v70eEvent(); if(!ev) return; if(!v70eLogged()){ try { loginNudge(); } catch(e){} return; }
  const f = v70eFest(ev), d = v70eDay(), A = V70E_ACT[act], dk = act + d; let paid = false;
  if(!f.day[dk]){ f.day[dk] = 1; paid = true; try { reward(30, 15, 'Sự kiện lễ hội: ' + A.n); } catch(e){} v70eAdd('fest', 1, 'fest' + act); }
  f.a[act] = (f.a[act] || 0) + 1;
  if(!f.done && ev.acts.every(k => f.a[k])){ f.done = d; try { PROF.money += 40; renderProfHud(); } catch(e){} const k = v70eDecorKey('gold'); if(k) try { bagAdd(k, 1); } catch(e){}
    setTimeout(() => v70eNotify({ic:ev.ic, n:`${ev.gift}`, tier:3, head:'🎉 Quà lưu niệm lễ hội (giới hạn)', d:`Danh hiệu “${ev.n}” · +$40 · đồ trang trí nhà`}), 600); }
  // giữ gọn: chỉ giữ lễ hội của 12 lần gần nhất
  const s = v70eState(), ids = Object.keys(s.fest); if(ids.length > 12) ids.slice(0, ids.length - 12).forEach(i => { if(!s.fest[i].done) delete s.fest[i]; });
  v70eSave(); return paid;
}

// ---------- 7. bảng vàng: điểm Rubik, cờ vua, câu cá, chăm chỉ tuần ----------
const V70E_BC = [{k:'rubik', ic:'🧩', n:'Rubik'}, {k:'chess', ic:'♟️', n:'Cờ vua'}, {k:'fish', ic:'🎣', n:'Câu cá'}, {k:'week', ic:'📅', n:'Chăm chỉ tuần'}];
function v70eMine(){
  if(!v70eLogged()) return null; const s = v70eState(), wk67 = (() => { try { const S = PROF.v67l; return S && S.wk === v67lWeek() ? v67lSum(S.week) : 0; } catch(e){ return 0; } })();
  return {u:PROF.name, rubik:s.c.rubik || 0, chess:s.c.chess || 0, fish:PROF.stats.catches || 0, week:Math.max(s.wkp, wk67), me:1};
}
// học sinh NPC: điểm cố định theo tuần (hạt giống = tên + tuần) để bảng ổn định, người chơi chăm thì vượt được
function v70eNpcRows(){
  const wk = v70eWeek(), L = [];
  (typeof students !== 'undefined' ? students : []).forEach(a => { if(!a || !a.name) return; const r = v70eRnd(v70eHash(a.name + wk)), r2 = v70eRnd(v70eHash(a.name));
    L.push({u:a.name, rubik:Math.round(2 + r2()*22 + r()*6), chess:Math.round(1 + r2()*16 + r()*5), fish:Math.round(r2()*30 + r()*8), week:Math.round(4 + r()*34), npc:1}); });
  return L;
}
function v70eRows(cat){
  const L = v70eNpcRows(), me = v70eMine(); (V70E.online || []).forEach(o => { if(!me || o.u !== me.u) L.push(Object.assign({on:1}, o)); }); if(me) L.push(me);
  return L.filter(r => r[cat] > 0).sort((p, q) => q[cat] - p[cat] || (p.u > q.u ? 1 : -1));
}
// online (claude.ai db có sẵn của game): ghi điểm của mình, đọc của các bạn
async function v70eOnline(write){
  try { const db = await cloudInit(); if(!db || !CLOUD.uid) return;
    const me = v70eMine(); if(write && me){ await db.doc('v70e/' + CLOUD.uid).set({u:String(me.u).slice(0, 20), rubik:me.rubik, chess:me.chess, fish:me.fish, week:me.week, wk:v70eWeek(), at:Date.now()}); }
    if(!write || !V70E.online || Date.now() - V70E.onT > 120000){ const q = await db.collection('v70e').limit(80).get(), wk = v70eWeek(); V70E.onT = Date.now();
      V70E.online = q.docs.map(d => d.data() || {}).filter(o => o && o.u).map(o => ({u:String(o.u).slice(0, 20), rubik:+o.rubik || 0, chess:+o.chess || 0, fish:+o.fish || 0, week:o.wk === wk ? (+o.week || 0) : 0})); }
  } catch(e){}
}

// ---------- 8. móc vào game ----------
function v70eHooks(){
  if(typeof reward === 'function'){ const r0 = reward; reward = function(exp, money, why){ const r = r0.apply(this, arguments); try { const w = String(why || ''); if(w && v70eLogged() && !/^Sự kiện lễ hội/.test(w)){ for(const [re, k] of V70E_RW) if(re.test(w)){ v70eAdd(k, 1); break; } } v70eCheck(); } catch(e){ console.warn('v70e reward', e); } return r; }; }
  if(typeof mprog === 'function'){ const m0 = mprog; mprog = function(id){ const r = m0.apply(this, arguments); try { const k = V70E_MPK[id]; if(k) v70eAdd(k, 1, 'm:' + id); if(V70E_PLACE.includes(id)) v70ePlace(id); } catch(e){} return r; }; }
  // lễ hội cũ (múa lân, Noel, bóng đá…) đổi theo lễ hội thật đang diễn ra
  if(typeof startFestival === 'function'){ const sf0 = startFestival; startFestival = function(kind, until){ try { const ev = v70eEvent(); if(ev && ev.real && ev.old && kind !== 'picnic' && FEST_NAME[ev.old]) kind = ev.old; } catch(e){} return sf0.call(this, kind, until); }; }
  // online: ghi điểm bảng vàng mỗi lần lưu hồ sơ (giãn 60 giây)
  if(typeof saveProfile === 'function'){ const sp0 = saveProfile; saveProfile = function(){ const r = sp0.apply(this, arguments); try { if(v70eLogged() && Date.now() - (V70E.wT || 0) > 60000){ V70E.wT = Date.now(); v70eOnline(true); } } catch(e){} return r; }; }
  // menu ☰ + hồ sơ
  if(typeof v32Items === 'function'){ const mi = v32Items; v32Items = function(){ const L = mi(); L.push({ic:'star', en:'Events & Badges', vi:'🏅 Lễ hội & Thành tựu', grp:'life', f:() => v70eOpen('fest')}); return L; }; }
  if(typeof openProfile === 'function'){ const op = openProfile; openProfile = function(){ const r = op.apply(this, arguments); try { v70eProfBtn(); } catch(e){} return r; }; }
}
function v70eProfBtn(){
  const box = document.getElementById('pfInfo'); if(!box || box.querySelector('.v70ePfB')) return; const s = v70eState(), t = v70eTitleText();
  const b = document.createElement('button'); b.type = 'button'; b.className = 'v70ePfB'; b.innerHTML = `🏅 Thành tựu <small>${v70eGotN(s)}/60 huy hiệu${t ? ' · đang đeo: ' + v70eEsc(t) : ''}</small>`;
  b.onclick = () => { try { closeModal('mProfile'); } catch(e){} try { hideModal(); } catch(e){} v70eOpen('ach'); }; box.appendChild(b);
}
function v70eInit(){
  if(V70E.on || /[?&]nov70e/.test(location.search)) return; V70E.on = true;
  const qd = /[?&]v70eDate=(\d{4}-\d\d-\d\d)/.exec(location.search); if(qd) v70eSetDate(qd[1]);
  v70eCss(); v70eHooks();
  try { v70eWorldInit(); } catch(e){ console.warn('v70e world', e); }
  // mỗi 5 giây: mốc từ số liệu có sẵn (level, tiền, cá…); mỗi ngày mới: mời điểm danh một lần
  setInterval(() => { try { if(!v70eLogged()) return; const S0 = v70eState(); if(!S0.init){ S0.init = 1; const n0 = v70eCheck(true); if(n0) toast(`🏅 Em đã có sẵn ${n0} huy hiệu từ trước! Xem ở ☰ → Lễ hội & Thành tựu.`); } v70eCheck(); const d = v70eDay(); if(V70E.ckAsk !== d && !V70E.act && !v70eCkInfo().done && (typeof openModal === 'undefined' || !openModal) && !(V70E.panel && !V70E.panel.hidden) && performance.now() > 9000){ V70E.ckAsk = d; v70eOpen('ck'); } } catch(e){} }, 5000);
  setTimeout(() => { try { v70eOnline(false); } catch(e){} }, 6000);
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v70e = {V70E, v70eState, v70eEvent, v70eSetDate, v70eOpen, v70eCheckin, v70eAdd, v70eRows};
}
