// ================= v53s · CÂU CÁ THẢ NEO NGOÀI BIỂN: thả dây, phao nhấp nhô, chờ cá cắn, kéo vừa lực =================
// Tái dùng: khung mini game GAMES/openArcade, cỡ khung v45pSize, đếm lượt v45pDay, loài cá SPECIES + hình vẽ drawSea2 (EXT12).
// ---------- 1. loài cá: SPECIES cũ (theo vùng biển) + loài theo giờ / mùa / thời tiết / điểm câu ----------
// c: điều kiện {t:'day'|'night'|'dusk', s:mùa, w:[thời tiết], sp:'bird'|'bub'}; rel: loài cần bảo vệ, thả về biển
const V53S_EXTRA = [
  ['Cá cơm', 1, [.01, .05], 0, 40, '#cfd8dc', 'fish', {sp:'bird'}, 'Cá cơm bơi thành đàn rất lớn, chim biển bay vòng phía trên để săn.'],
  ['Cá nục', 1, [.1, .4], 0, 12, '#78909c', 'fish', {t:'day'}, 'Cá nục bơi theo đàn, là món cá quen thuộc của ngư dân Việt Nam.'],
  ['Cá chuồn', 1, [.2, .6], 1, 18, '#64b5f6', 'fish', {t:'day', s:'ha'}, 'Cá chuồn xoè vây ngực như đôi cánh, lướt khỏi mặt nước hàng chục mét.'],
  ['Cá hồng', 1, [.5, 3], 2, 9, '#ff7043', 'fish', {t:'dusk'}, 'Cá hồng có màu đỏ cam rực rỡ như ánh hoàng hôn.'],
  ['Cá đèn lồng', 1, [.05, .2], 1, 60, '#7e57c2', 'fish', {t:'night'}, 'Cá đèn lồng có các đốm tự phát sáng dọc thân, gọi là phát quang sinh học.'],
  ['Cá bạc má', 1, [.2, .8], 1, 14, '#90caf9', 'fish', {w:['mua', 'muaphun', 'samset']}, 'Cá bạc má là họ hàng của cá thu, thịt giàu dầu omega-3 tốt cho não.'],
  ['Cá bơn', 1, [.3, 2], 1, 14, '#a1887f', 'ray', {s:'dong'}, 'Cá bơn lớn lên thì một mắt dời sang bên kia, hai mắt nằm cùng một phía.'],
  ['Cá chim trắng', 2, [.4, 2], 1, 12, '#eceff1', 'sunfish', {s:'thu'}, 'Cá chim có thân dẹt và tròn như chiếc đĩa.'],
  ['Cá ngựa', 1, [.01, .03], 2, 0, '#ffb74d', 'horse', {s:'xuan'}, 'Cá ngựa bố mang trứng trong túi ở bụng. Loài cần bảo vệ: thả về biển.', 1],
  ['Cá ánh trăng', 2, [3, 12], 2, 8, '#ef9a9a', 'sunfish', {t:'night'}, 'Cá ánh trăng (cá opah) là một trong rất ít loài cá máu nóng.'],
  ['Rùa biển con', 1, [.5, 2], 3, 0, '#66bb6a', 'turtle', {sp:'bub'}, 'Rùa biển là loài quý hiếm. Gỡ lưỡi câu thật nhẹ và thả rùa về biển nhé.', 1],
  ['Cá cầu vồng', 1, [1, 4], 3, 20, '#e040fb', 'fish', {w:['cauvong']}, 'Cầu vồng có 7 màu vì ánh nắng đi qua giọt nước bị tách thành nhiều màu.'],
  ['Cá mập voi', 3, [2000, 9000], 3, 0, '#546e7a', 'shark', {sp:'bird'}, 'Cá mập voi là loài cá lớn nhất thế giới nhưng chỉ ăn sinh vật phù du.', 1]
].map(([n, z, w, r, v, col, shape, c, fx, rel]) => ({n, z, w, r, v, col, shape, c, fx, rel:!!rel, x:1}));
const V53S_FX = {'Cá bống biển':'Cá bống hay vùi mình dưới cát để trốn kẻ thù.', 'Cá rô biển':'Sống quanh bãi đá ven bờ, ăn tôm cua nhỏ.', 'Cá thu':'Cá thu bơi rất nhanh, thân thon như quả ngư lôi.',
  'Cá đuối nhỏ':'Cá đuối là họ hàng của cá mập, bộ xương làm bằng sụn.', 'Mực ống':'Mực có tới 3 quả tim và phun mực đen để trốn.', 'Cua xanh':'Cua đi ngang vì các khớp chân gập sang hai bên.',
  'Cá hề':'Cá hề sống trong hải quỳ và được hải quỳ che chở.', 'Cá mú đỏ':'Nhiều loài cá mú có thể đổi giới tính khi lớn lên.', 'Cá bò hòm':'Thân cá bò hòm có lớp vỏ cứng như chiếc hộp.',
  'Cá ngừ vây vàng':'Cá ngừ có thể bơi hơn 70 km mỗi giờ.', 'Bạch tuộc':'Bạch tuộc có 8 xúc tu và máu màu xanh lam.', 'Cá mặt trăng':'Cá mặt trăng là loài cá xương nặng nhất, hơn 2 tấn.',
  'Cá ngừ đại dương':'Cá ngừ vây xanh giữ thân ấm hơn nước biển xung quanh.', 'Cá kiếm':'Cá kiếm có cơ quan làm ấm mắt để nhìn rõ trong nước lạnh.', 'Cá cờ xanh':'Cá cờ dựng vây lưng như cánh buồm khi săn mồi.',
  'Cá mập đầu búa':'Chiếc đầu búa giúp cá mập cảm nhận dòng điện yếu của con mồi dưới cát.', 'Cá nóc':'Cá nóc phồng tròn như quả bóng khi sợ. Có độc, không được ăn!', 'Cá thu ngàng':'Cá thu ngàng là một trong những loài cá bơi nhanh nhất biển.',
  'Cá cần câu':'Cá cần câu có chiếc "đèn" phát sáng trên đầu để dụ mồi.', 'Cá rồng đen':'Cá rồng đen sống ở biển sâu tối om và tự phát ra ánh sáng.', 'Cá mắt ống':'Cá mắt ống có đầu trong suốt, mắt nhìn xuyên qua đầu lên trên.',
  'Cá chình miệng túi':'Miệng cá chình túi há rộng để nuốt con mồi to.', 'Mực khổng lồ':'Mực khổng lồ có đôi mắt lớn nhất trong muôn loài.', 'Sứa phát sáng':'Sứa không có não, không có tim, cơ thể gần như toàn là nước.',
  'Cá tuyết':'Cá tuyết sống ở biển lạnh, mỗi lần đẻ hàng triệu trứng.', 'Cá hồi bạc':'Cá hồi bơi ngược dòng sông về đúng nơi chúng sinh ra để đẻ trứng.', 'Cá băng trong suốt':'Máu cá băng không có hồng cầu nên trong suốt.',
  'Cua hoàng đế':'Sải chân của cua hoàng đế dài tới gần 2 mét.', 'Cá mập Greenland':'Cá mập Greenland có thể sống hơn 250 năm!'};
function v53sAll(){ if(V53S.all) return V53S.all; const base = (typeof SPECIES !== 'undefined' ? SPECIES : []).map(s => ({n:s.n, z:s.z, w:s.w, r:s.r, v:s.v, col:s.col, shape:s.shape, c:s.night ? {t:'night'} : null, fx:V53S_FX[s.n] || 'Một loài cá của biển khơi.', rel:false, lure:s.lure}));
  return V53S.all = base.concat(V53S_EXTRA); }
// bối cảnh lúc câu: giờ, mùa, thời tiết
function v53sTod(){ const m = clock; return m < 330 || m > 1140 ? 'night' : m < 420 ? 'dawn' : m > 1030 ? 'dusk' : 'day'; }
function v53sCtx(zone, spot){ return {zone, spot:spot ? spot.k : '', tod:v53sTod(), season, weather}; }
function v53sOk(s, X){ const c = s.c; if(!c) return true;
  if(c.t === 'night' && X.tod !== 'night') return false; if(c.t === 'day' && (X.tod === 'night')) return false; if(c.t === 'dusk' && X.tod !== 'dusk' && X.tod !== 'dawn') return false;
  if(c.s && c.s !== X.season) return false; if(c.w && !c.w.includes(X.weather)) return false; if(c.sp && c.sp !== X.spot) return false; return true; }
function v53sPool(X){ const z = X.zone; return v53sAll().filter(s => (s.x ? s.z <= z : s.z <= z && s.z >= z - 1) && v53sOk(s, X)); }
function v53sPick(X){ const P = v53sPool(X), storm = ['bao', 'sieubao', 'loc'].includes(X.weather);
  const W = P.map(s => [10, 4, 1.5, .5][s.r]*(s.z === X.zone || s.x ? 1 : .55)*(s.c ? 1.8 : 1)*(X.spot === 'bub' && s.r >= 2 ? 2.4 : 1)*(X.spot === 'bird' && s.r === 0 ? 1.6 : 1)*(storm && s.r >= 2 ? .5 : 1));
  let t = 0; W.forEach(x => t += x); let r = Math.random()*t; for(let i = 0; i < P.length; i++){ r -= W[i]; if(r <= 0) return P[i]; } return P[0]; }
function v53sCondTxt(s){ const c = s.c || {}, o = []; if(c.t) o.push({day:'☀️ ban ngày', night:'🌙 ban đêm', dusk:'🌅 bình minh, hoàng hôn'}[c.t]);
  if(c.s) o.push({xuan:'🌸 mùa xuân', ha:'🌞 mùa hạ', thu:'🍂 mùa thu', dong:'❄️ mùa đông'}[c.s]); if(c.w) o.push(c.w.includes('cauvong') ? '🌈 có cầu vồng' : '🌧️ trời mưa');
  if(c.sp) o.push(c.sp === 'bird' ? '🕊️ chỗ đàn chim' : '🫧 chỗ nước sủi bọt'); const zn = (typeof OCEAN !== 'undefined' && OCEAN[s.z - 1]) ? OCEAN[s.z - 1].n : ''; return [zn ? '🌊 ' + zn : ''].concat(o).filter(Boolean).join(' · '); }

// ---------- 2. vẽ cá: drawSea2 (EXT12) + rùa biển, cá ngựa vẽ riêng ----------
function v53sFishDraw(c, f, x, y, sc){ const s = f.sp;
  if(s.shape === 'turtle'){ const L = 46*sc, dir = f.vx < 0 ? -1 : 1; c.save(); c.translate(x, y); c.scale(dir, 1); c.fillStyle = '#8bc34a';
    c.fillRect(L*.36, -L*.1, L*.22, L*.18); c.fillRect(-L*.3, -L*.38, L*.16, L*.16); c.fillRect(L*.12, -L*.38, L*.16, L*.16); c.fillRect(-L*.3, L*.24, L*.16, L*.14); c.fillRect(L*.12, L*.24, L*.16, L*.14);
    c.fillStyle = s.col; c.beginPath(); c.ellipse(0, 0, L*.36, L*.28, 0, 0, 6.283); c.fill(); c.fillStyle = '#33691e'; c.fillRect(-L*.12, -L*.12, L*.1, L*.1); c.fillRect(L*.04, -L*.04, L*.1, L*.1); c.fillRect(-L*.16, L*.06, L*.1, L*.08);
    c.fillStyle = '#111'; c.fillRect(L*.5, -L*.06, 2, 2); c.restore(); return; }
  if(s.shape === 'horse'){ const L = 34*sc; c.save(); c.translate(x, y); c.fillStyle = s.col; c.beginPath(); c.ellipse(0, -L*.15, L*.16, L*.3, .2, 0, 6.283); c.fill();
    c.fillRect(L*.02, -L*.5, L*.3, L*.12); c.strokeStyle = s.col; c.lineWidth = L*.1; c.beginPath(); c.moveTo(-L*.02, L*.1); c.quadraticCurveTo(-L*.1, L*.5, L*.14, L*.42); c.stroke();
    c.fillStyle = '#111'; c.fillRect(L*.08, -L*.46, 2, 2); c.restore(); return; }
  try { drawSea2(c, f, x, y, sc); } catch(e){} }
function v53sSc(f, k){ const L = Math.min(150, 14 + Math.pow(f.w || .1, .45)*9); return Math.min(k, 190/L); }
function v53sIcon(s){ V53S.ico = V53S.ico || {}; if(V53S.ico[s.n]) return V53S.ico[s.n]; const cv = document.createElement('canvas'); cv.width = 120; cv.height = 74; const g = cv.getContext('2d');
  const f = {sp:s, w:Math.min(s.w[1], 60), vx:1}, L = Math.min(150, 14 + Math.pow(f.w, .45)*9); v53sFishDraw(g, f, 60, 38, Math.min(4, 92/Math.max(14, L)));
  return V53S.ico[s.n] = cv.toDataURL(); }

// ---------- 3. mini game ----------
const V53S_DAYK = 'v53s-fish-day';
function v53sFishOpen(){ const c = v53sMe(); if(!v53sAtSea(c)){ toast('⛵ Lên thuyền ra biển, dừng lại rồi bấm Câu cá nhé.'); return; }
  const p = v53sRaw(c), z = v53sZone(p[0], p[1]), sp = v53sSpotAt(p[0], p[1]); V53S.fishAt = {z:z.z, zn:z.n, spot:sp, boat:c.boat.item}; openArcade('v53sfish', 0); }
function v53sNewFish(s, side){ const sp = v53sPick(s.X), dir = side != null ? (side < 0 ? 1 : -1) : (Math.random() < .5 ? -1 : 1), d = .15 + Math.random()*.8;
  const w = +(sp.w[0] + Math.pow(Math.random(), 2.2)*(sp.w[1] - sp.w[0])).toFixed(2), y = s.sy + 40 + d*(s.bot - s.sy - 70);
  return {sp, x:side != null ? (side < 0 ? -40 : s.vw + 40) : s.vw*.1 + Math.random()*s.vw*.85, y, by:y, vx:dir*(18 + Math.random()*22)*(sp.r >= 2 ? .8 : 1), w, ph:Math.random()*6, st:'swim', t:0}; }
function v53sFishBg(s){ const key = [s.vw, s.vh, s.X.zone, s.X.tod, s.X.weather, s.X.season].join(); if(V53S.bgKey === key) return V53S.bg;
  const cv = V53S.bg || document.createElement('canvas'); cv.width = s.vw; cv.height = s.vh; const g = cv.getContext('2d'), W = s.vw, H = s.vh, SY = s.sy, T = s.X.tod, dark = (WEATHERS[s.X.weather] || {}).dark || 0;
  const SK = {day:['#5fb0f5', '#cfeeff'], dawn:['#f6a5c0', '#ffe0b2'], dusk:['#5b4b9a', '#ffab6b'], night:['#070b22', '#1f2a55']}[T], k = Math.min(.6, dark);
  const mix = (a, b, t) => { const p = x => [1, 3, 5].map(i => parseInt(x.substr(i, 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v)*t).toString(16).padStart(2, '0')).join(''); };
  let gr = g.createLinearGradient(0, 0, 0, SY); gr.addColorStop(0, mix(SK[0], '#5f6b7a', k)); gr.addColorStop(1, mix(SK[1], '#9aa5b1', k)); g.fillStyle = gr; g.fillRect(0, 0, W, SY);
  if(T === 'night'){ g.fillStyle = '#fff'; const R = v53sRng(5); for(let i = 0; i < 70; i++){ g.globalAlpha = .3 + R()*.7; g.fillRect(Math.round(R()*W), Math.round(R()*SY*.9), 2, 2); } g.globalAlpha = 1; g.fillStyle = '#fff8e1'; g.beginPath(); g.arc(W*.764, SY*.28, 18, 0, 6.283); g.fill(); g.fillStyle = SK[0]; g.beginPath(); g.arc(W*.764 + 8, SY*.25, 16, 0, 6.283); g.fill(); }
  else if(dark < .25){ g.fillStyle = T === 'day' ? '#fff3c4' : '#ffcc80'; g.beginPath(); g.arc(W*.764, T === 'day' ? SY*.26 : SY*.78, 24, 0, 6.283); g.fill(); }
  // đảo nhà ở chân trời (toạ độ theo tỷ lệ vàng)
  g.fillStyle = T === 'night' ? '#16233f' : mix('#5c8f6a', '#8d9aa8', k + .2); g.beginPath(); g.moveTo(0, SY); g.quadraticCurveTo(W*.09, SY - 34, W*.236, SY - 10); g.quadraticCurveTo(W*.3, SY - 4, W*.382, SY); g.fill();
  g.fillStyle = T === 'night' ? '#ffd54f' : '#f4f4f4'; g.fillRect(Math.round(W*.15), SY - 44, 4, 22);
  const deep = [0, .1, .3, .55, .8, .4][s.X.zone] || .2, ice = s.X.zone === 5, top = ice ? '#8fd3e8' : mix('#2fa3c9', '#0b2c4a', deep*.6 + (T === 'night' ? .4 : 0)), bot = mix(top, '#020812', .55 + deep*.35);
  gr = g.createLinearGradient(0, SY, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, SY, W, H - SY);
  if(T !== 'night'){ g.fillStyle = 'rgba(255,255,255,.06)'; for(let i = 0; i < 5; i++){ const x = W*(.1 + i*.2); g.beginPath(); g.moveTo(x, SY); g.lineTo(x - 50, H*.8); g.lineTo(x + 30, H*.8); g.closePath(); g.fill(); } }
  // đáy biển
  g.fillStyle = s.X.zone >= 4 ? '#14181f' : s.X.zone === 2 ? '#d7b98a' : '#b9a57e'; g.beginPath(); g.moveTo(0, H); for(let x = 0; x <= W; x += 20) g.lineTo(x, H - 30 - Math.sin(x*.021)*10 - Math.sin(x*.05)*4); g.lineTo(W, H); g.fill();
  if(s.X.zone <= 2){ const R = v53sRng(11), C = ['#ff6f61', '#ffb3c6', '#ffd23f', '#b06bff', '#4dd0e1', '#81c784']; for(let i = 0; i < (s.X.zone === 2 ? 16 : 7); i++){ const x = R()*W, h = 16 + R()*34; g.fillStyle = C[i % 6]; g.fillRect(Math.round(x), Math.round(H - 34 - h), 6, h); g.fillRect(Math.round(x - 8), Math.round(H - 34 - h*.6), 22, 5); } }
  V53S.bg = cv; V53S.bgKey = key; return cv; }
function v53sLook(){ try { return Object.assign({}, PLAYER || agentLook(2, {})); } catch(e){ return agentLook(2, {}); } }
GAMES.v53sfish = {
  title:'Câu cá ngoài khơi', opts:[], v44own:true,
  help:'⚓ Thuyền đã thả neo. 👆 Chạm xuống nước để thả dây tới đó. 🎈 Phao nhấp nhô: chờ cá rỉa mồi. ❗ Phao chìm hẳn thì chạm ngay để giật cần. ✊ Giữ ngón tay để kéo, giữ kim lực trong vạch xanh (kéo vừa lực): căng quá thì thả tay ra. Càng xa đảo nước càng sâu, cá càng hiếm. Ngày, đêm, mùa và thời tiết có loài cá khác nhau. 🕊️ Đàn chim và 🫧 nước sủi bọt là điểm câu đặc biệt.',
  init(){ const [vw, vh] = v45pSize(), cv = $('#arcCv'); if(cv && (cv.width !== vw || cv.height !== vh)){ cv.width = vw; cv.height = vh; }
    const A = V53S.fishAt || {z:1, zn:'Vùng ven bờ'}, X = v53sCtx(A.z, A.spot);
    const s = {vw, vh, X, zn:A.zn, sy:Math.round(vh*.382), bot:vh - 40, t:0, st:'idle', bait:6, fish:[], fx:[], bag:[], msg:'👆 Chạm xuống nước để thả dây', msgT:99, ten:0, prog:0, strain:0, look:v53sLook(), item:A.boat, drops:[]};
    v53sFishLay(s); const n = A.spot && A.spot.k === 'bird' ? 11 : 8; for(let i = 0; i < n; i++) s.fish.push(v53sNewFish(s));
    const wet = ['mua', 'muaphun', 'bao', 'sieubao', 'samset', 'muada'].includes(X.weather); if(wet || X.season === 'dong' && X.weather !== 'nang') for(let i = 0; i < 70; i++) s.drops.push({x:Math.random()*vw, y:Math.random()*vh, v:.6 + Math.random()*.6});
    s.snow = X.season === 'dong'; return s; },
  pointer(s, ty, ax, ay){ if(ty !== 'down' || s.over) return; const x = ax*s.vw/AW, y = ay*s.vh/AH;
    if(s.st === 'card'){ s.st = 'idle'; s.card = null; s.msg = s.bait > 0 ? `👆 Thả dây tiếp · còn ${s.bait} mồi` : ''; s.msgT = 3; if(s.bait <= 0) v53sFishEnd(s); return; }
    if(s.st === 'bite'){ s.st = 'fight'; s.ten = 30; s.prog = 25; s.strain = 0; s.lo = 0; s.msg = '✊ Giữ để kéo · giữ kim trong vạch xanh'; s.msgT = 3; try { kickSfx(.6); } catch(e){} return; }
    if(s.st !== 'idle' && s.st !== 'wait') return;
    if(y > s.sy + 20 && x > s.bx + 40){ if(s.bait <= 0) return; v53sCast(s, x, Math.min(y, s.bot - 20)); } },
  update(s, dt){ if(s.over) return; s.t += dt; s.msgT -= dt; const hold = typeof holdKey === 'function' ? holdKey() : ARC.ptr.down;
    s.fish.forEach(f => { f.ph += dt*3; f.t -= dt;
      if(f.st === 'swim' || f.st === 'flee'){ const k = f.st === 'flee' ? 3 : 1; f.x += f.vx*k*dt; f.y += (f.by - f.y)*Math.min(1, dt*1.5) + Math.sin(f.ph*.7)*.2;
        if(f.x < -60) f.vx = Math.abs(f.vx); if(f.x > s.vw + 60) f.vx = -Math.abs(f.vx); if(f.st === 'flee' && f.t <= 0) f.st = 'swim'; if(Math.random() < dt*.06) f.vx *= -1; }
      else if(f.st === 'go'){ const dx = s.hx - f.x, dy = s.hy - f.y, d = Math.hypot(dx, dy); if(Math.abs(dx) > 3) f.vx = Math.sign(dx)*Math.abs(f.vx); const v = 34*dt; if(d > 12){ f.x += dx/d*v; f.y += dy/d*v; } else { f.st = 'nib'; f.t = .8; s.nib = 1 + Math.floor(Math.random()*3); } } });
    if(s.st === 'cast'){ s.ct += dt/.7; if(s.ct >= 1){ s.st = 'wait'; s.look2 = .8; s.fx.push({k:'ring', x:s.hx, y:s.sy, t:0}); try { v45pSplash(.3); } catch(e){} s.msg = '⏳ Chờ cá cắn câu… nghe sóng vỗ nhé'; s.msgT = 2.6; } }
    else if(s.st === 'wait'){ s.look2 -= dt; s.bob = Math.sin(s.t*2.2)*1.6; const on = s.fish.find(f => f.st === 'go' || f.st === 'nib');
      if(!on && s.look2 <= 0){ s.look2 = .55; const R = s.X.spot ? 320 : 230, c = s.fish.filter(f => f.st === 'swim' && Math.hypot(f.x - s.hx, f.y - s.hy) < R);
        if(c.length && Math.random() < (s.X.spot === 'bird' ? .5 : .32)){ const f = c[Math.floor(Math.random()*c.length)]; if(Math.random() < 1/(1 + f.sp.r*.45)) f.st = 'go'; } }
      if(on && on.st === 'nib'){ on.x = s.hx - Math.sign(on.vx)*18; on.y = s.hy; on.t -= dt;
        if(on.t <= 0){ if(s.nib-- > 0){ on.t = .6 + Math.random()*.6; s.bob = 6; s.fx.push({k:'ring', x:s.hx, y:s.sy, t:.3}); try { v45pSplash(.08, 1200); } catch(e){} }
          else { s.st = 'bite'; s.bt = 1.8; s.on = on; s.msg = '❗ Phao chìm! Chạm ngay để giật cần'; s.msgT = 1.8; try { blipSfx(1320); } catch(e){} } } } }
    else if(s.st === 'bite'){ s.bt -= dt; s.bob = 14 + Math.sin(s.t*30)*2; if(s.bt <= 0){ v53sLost(s, '🐟 Cá nhả mồi rồi, chờ con khác nhé'); s.st = 'wait'; } }
    else if(s.st === 'fight'){ const f = s.on, pf = Math.min(2.4, .6 + f.sp.r*.35 + Math.pow(f.w, .3)*.15), pull = pf*(.5 + .6*Math.max(0, Math.sin(s.t*2.1 + f.ph)));
      s.ten += hold ? (26*pull + 14)*dt : -42*dt; s.ten = Math.max(0, Math.min(110, s.ten)); const ok = s.ten >= 35 && s.ten <= 78;
      s.prog += ok ? 15/(.6 + pf*.5)*dt : s.ten < 35 ? -3.2*pull*dt : 2*dt; s.strain = s.ten > 92 ? s.strain + dt : Math.max(0, s.strain - dt*.8); s.lo = s.ten < 12 ? (s.lo || 0) + dt : 0;
      s.bob = 8 + Math.sin(s.t*14)*3; const k = Math.max(0, Math.min(1, s.prog/100)); f.x = s.hx + (s.bx + 60 - s.hx)*k + Math.sin(s.t*6)*10*(1 - k); f.y = s.hy + (s.sy + 16 - s.hy)*k; f.vx = Math.sin(s.t*3 + f.ph) > 0 ? 1 : -1;
      if(s.strain > 1.2){ v53sLost(s, '💥 Căng quá, dây tuột mất cá. Lần sau thả tay sớm hơn nhé'); s.st = 'idle'; }
      else if(s.prog <= 0 || s.lo > 3){ v53sLost(s, '🐟 Dây chùng quá, cá bơi mất rồi'); s.st = 'idle'; }
      else if(s.prog >= 100) v53sCaught(s); }
    else if(s.st === 'idle' && s.bait <= 0) v53sFishEnd(s);
    s.fx.forEach(p => p.t += dt); s.fx = s.fx.filter(p => p.t < 1.6);
    if(s.drops.length){ const sn = s.snow; s.drops.forEach(p => { p.y += (sn ? 50 : 420)*p.v*dt; p.x += (sn ? Math.sin(s.t + p.v*9)*20 : -60)*dt; if(p.y > s.vh){ p.y = -10; p.x = Math.random()*s.vw; } if(p.x < -10) p.x = s.vw; }); } },
  draw(s, c){ v53sFishDraw2(s, c); }
};
function v53sFishLay(s){ const port = s.vh > s.vw; s.bx = Math.round(s.vw*(port ? .236 : .19)); s.bk = port ? 2.6 : 2.3; s.tip = [s.bx + (port ? 96 : 110), s.sy - (port ? 124 : 104)]; }
function v53sCast(s, x, y){ s.bait--; s.st = 'cast'; s.ct = 0; s.hx = x; s.hy = Math.max(s.sy + 30, y); s.on = null; s.fish.forEach(f => { if(f.st === 'go' || f.st === 'nib') f.st = 'swim'; }); s.msgT = 0; try { v45pSplash(.12, 900); } catch(e){} }
function v53sLost(s, m){ const f = s.on || s.fish.find(f => f.st === 'go' || f.st === 'nib'); if(f){ f.st = 'flee'; f.t = 1.8; f.by = Math.max(s.sy + 40, Math.min(s.bot - 24, f.y)); f.vx = (f.x < s.hx ? -1 : 1)*Math.abs(f.vx || 20); } s.on = null; s.msg = m; s.msgT = 2.6; }
function v53sCaught(s){ const f = s.on, sp = f.sp, db = v53sDb(), d = db.dex[sp.n], isNew = !d;
  s.bag.push({n:sp.n, w:f.w, r:sp.r, rel:sp.rel}); s.card = {sp, w:f.w, isNew}; s.st = 'card'; s.on = null; s.fx.push({k:'ring', x:f.x, y:s.sy, t:0}, {k:'ring', x:f.x, y:s.sy, t:.4});
  s.fish.splice(s.fish.indexOf(f), 1); setTimeout(() => { if(ARC.s === s) s.fish.push(v53sNewFish(s, Math.random() < .5 ? -1 : 1)); }, 1400);
  db.dex[sp.n] = {c:(d ? d.c : 0) + 1, best:Math.max(d ? d.best : 0, f.w), at:d ? d.at : Date.now()};
  if(!sp.rel){ db.bag.push({n:sp.n, w:f.w, r:sp.r, at:Date.now()}); if(db.bag.length > 80) db.bag.shift(); }
  v53sSave(); try { v45pSplash(.5, 600); sp.r >= 2 ? cheerSfx() : blipSfx(1760); } catch(e){}
  try { if(PROF){ const p = PROF.fish[sp.n] || {n:0, best:0}; p.n++; p.best = Math.max(p.best, f.w); PROF.fish[sp.n] = p; PROF.stats.catches = (PROF.stats.catches || 0) + 1; } mprog('fish3'); if(sp.r >= 2) mprog('bigfish'); } catch(e){} }
function v53sFishEnd(s){ if(s.over) return; const n = s.bag.length, kinds = new Set(s.bag.map(b => b.n)).size, pts = s.bag.reduce((a, b) => a + 2 + b.r*3, 0);
  const plays = v45pDay(V53S_DAYK, true), half = plays > 10; let money = Math.max(1, Math.min(20, Math.round(1 + pts*.55))), exp = Math.max(6, Math.min(45, Math.round(6 + pts*1.5)));
  if(half){ money = Math.max(1, Math.ceil(money/2)); exp = Math.max(1, Math.ceil(exp/2)); } s.rw = [money, exp];
  s.over = n ? `Câu được ${n} con · ${kinds} loài` : 'Hết mồi câu rồi!'; s.sub = PROF ? `+$${money} · +${exp} EXP · cá đã vào 🧺 giỏ (📖 Sổ tay cá)${half ? ' · thưởng một nửa' : ''}` : 'Đăng nhập để nhận tiền và EXP'; }
// ---------- vẽ một khung hình (nền tĩnh đã cache; chỉ vẽ nước, cá, dây, chữ) ----------
function v53sTxt(c, t, x, y, size, col, al){ c.font = `800 ${size}px Nunito, sans-serif`; c.textAlign = al || 'center'; c.lineWidth = 4; c.strokeStyle = 'rgba(6,14,30,.75)'; c.strokeText(t, x, y); c.fillStyle = col || '#fff'; c.fillText(t, x, y); c.textAlign = 'left'; }
function v53sFishDraw2(s, c){ const W = s.vw, H = s.vh, SY = s.sy, t = s.t, port = H > W, fs = port ? 22 : 20;
  c.imageSmoothingEnabled = false; c.drawImage(v53sFishBg(s), 0, 0);
  // đàn chim / bọt nước của điểm câu đặc biệt
  if(s.X.spot === 'bird'){ const G = v53sGullSprite(); for(let i = 0; i < 6; i++){ const a = t*.6 + i*1.047, f = ((t*4 + i) | 0) % 2; c.drawImage(G, f*20, 0, 20, 14, Math.round(W*.618 + Math.cos(a)*W*.2 - 20), Math.round(SY*.45 + Math.sin(a)*SY*.18), 40, 28); } }
  if(s.X.spot === 'bub'){ c.fillStyle = 'rgba(255,255,255,.7)'; for(let i = 0; i < 16; i++){ const k = (t*.6 + i*.618) % 1; c.globalAlpha = 1 - k; c.beginPath(); c.arc(W*.5 + Math.sin(i*2.4)*W*.3, H - 40 - k*(H - SY - 40), 2 + k*4, 0, 6.283); c.fill(); } c.globalAlpha = 1; }
  // cá
  s.fish.forEach(f => { if(f.x < -80 || f.x > W + 80) return; c.globalAlpha = f === s.on || f.st === 'nib' ? 1 : .88; v53sFishDraw(c, f, f.x, f.y, v53sSc(f, port ? 1.7 : 1.4)); }); c.globalAlpha = 1;
  // mặt nước gợn sóng
  c.fillStyle = 'rgba(255,255,255,.55)'; for(let x = 0; x < W; x += 10) c.fillRect(x, Math.round(SY + Math.sin(x*.035 + t*1.8)*3), 8, 2);
  // thuyền + người câu (vẽ bằng hàm sẵn có của game)
  const bob = Math.sin(t*1.4)*2, k = s.bk; withCtx(c, () => { ctx.save(); ctx.translate(s.bx, SY - 4 + bob); ctx.scale(k, k); try { drawBoatModel(0, 0, s.item || (typeof ITEM !== 'undefined' && ITEM.boat2) || {zone:1, col:'#ff8a2b'}, [], 1); } catch(e){}
    ctx.translate(-10, -6); try { drawBody(Object.assign(s.look, {dir:1, moving:false}), true); } catch(e){} ctx.restore(); });
  // neo
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(s.bx - 30, SY + 6); c.lineTo(s.bx - 46, H - 40); c.stroke(); c.font = '24px sans-serif'; c.fillText('⚓', s.bx - 60, H - 34);
  // cần câu + dây + phao
  const hx = s.bx + 8, hy = SY - 34*k/2.3 + bob, [tx, ty] = s.tip, bend = s.st === 'fight' ? 20 + s.ten*.15 : s.st === 'bite' ? 12 : 3;
  c.strokeStyle = '#6d4c2e'; c.lineWidth = 4; c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo((hx + tx)/2, (hy + ty)/2 + bend, tx, ty + bend*.6); c.stroke();
  if(s.st !== 'idle'){ const k2 = s.st === 'cast' ? Math.min(1, s.ct) : 1, fx = s.st === 'fight' && s.on ? s.on.x : s.hx, fy = s.st === 'fight' && s.on ? s.on.y : s.hy, px = tx + (fx - tx)*k2, py = s.st === 'cast' ? ty + (SY - ty)*k2 - Math.sin(k2*Math.PI)*60 : SY + (s.bob || 0);
    c.strokeStyle = s.st === 'fight' && s.ten > 78 ? '#ff5252' : 'rgba(255,255,255,.85)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(tx, ty + bend*.6); c.quadraticCurveTo((tx + px)/2, Math.min(ty, py) + 30, px, py); if(s.st !== 'cast'){ c.lineTo(fx, fy); } c.stroke();
    if(s.st !== 'cast' && s.st !== 'fight'){ c.fillStyle = '#d32f2f'; c.fillRect(px - 6, py - 10, 12, 8); c.fillStyle = '#fff'; c.fillRect(px - 6, py - 2, 12, 6); c.fillStyle = '#ffd23f'; c.fillRect(px - 1, py - 16, 2, 6); c.fillStyle = '#ff8a65'; c.beginPath(); c.arc(s.hx, s.hy, 4, 0, 6.283); c.fill(); } }
  s.fx.forEach(p => { c.strokeStyle = `rgba(255,255,255,${(1 - p.t/1.6)*.8})`; c.lineWidth = 2; c.beginPath(); c.ellipse(p.x, p.y, 8 + p.t*40, 3 + p.t*10, 0, 0, 6.283); c.stroke(); });
  // mưa / tuyết (pool cố định)
  if(s.drops.length){ c.fillStyle = s.snow ? 'rgba(255,255,255,.85)' : 'rgba(210,230,255,.55)'; s.drops.forEach(p => c.fillRect(Math.round(p.x), Math.round(p.y), s.snow ? 3 : 1, s.snow ? 3 : 9)); }
  if(s.X.weather === 'suongmu'){ c.fillStyle = 'rgba(230,236,240,.35)'; c.fillRect(0, 0, W, H); }
  // thông tin: giờ · mùa · thời tiết · vùng biển · mồi (dưới thanh trên cùng của khung v44)
  const TOD = {day:'☀️ Ngày', dawn:'🌄 Bình minh', dusk:'🌅 Hoàng hôn', night:'🌙 Đêm'}[s.X.tod], SEA = {xuan:'🌸 Xuân', ha:'🌞 Hạ', thu:'🍂 Thu', dong:'❄️ Đông'}[s.X.season] || '', WN = (WEATHERS[s.X.weather] || {}).name || '';
  const top = port ? 112 : 74; if(!s.over){ c.fillStyle = 'rgba(6,14,30,.55)'; c.fillRect(0, top - fs, W, fs*2.6);
  v53sTxt(c, `🌊 ${s.zn} · 🪱 ${s.bait} mồi · 🐟 ${s.bag.length}`, W/2, top + 2, fs, '#ffd23f'); v53sTxt(c, `${TOD} · ${SEA} · ${WN}${s.X.spot ? (s.X.spot === 'bird' ? ' · 🕊️ Đàn chim' : ' · 🫧 Sủi bọt') : ''}`, W/2, top + fs*1.25, fs - 2, '#e3f2fd'); }
  // thanh lực kéo (rộng 61.8% màn hình): vạch xanh là kéo vừa lực
  if(s.st === 'fight'){ const bw = Math.round(W*.618), bx = Math.round((W - bw)/2), by = H - (port ? 120 : 84), bh = 22; c.fillStyle = 'rgba(6,14,30,.75)'; c.fillRect(bx - 8, by - 34, bw + 16, bh + 66);
    c.fillStyle = '#37474f'; c.fillRect(bx, by, bw, bh); c.fillStyle = '#2fbf71'; c.fillRect(bx + bw*.35/1.1, by, bw*(.43/1.1), bh); c.fillStyle = '#ef5350'; c.fillRect(bx + bw*.92/1.1, by, bw - bw*.92/1.1, bh);
    c.fillStyle = '#fff'; c.fillRect(bx + Math.min(1, s.ten/110)*bw - 3, by - 6, 6, bh + 12); v53sTxt(c, s.ten > 78 ? '😣 Căng quá, thả tay ra!' : s.ten < 35 ? '✊ Giữ để kéo' : '👍 Vừa lực, giữ nguyên!', W/2, by - 10, fs - 2, s.ten > 78 ? '#ff8a80' : '#fff');
    c.fillStyle = '#263238'; c.fillRect(bx, by + bh + 10, bw, 10); c.fillStyle = '#4fc3f7'; c.fillRect(bx, by + bh + 10, bw*Math.max(0, Math.min(1, s.prog/100)), 10); }
  if(s.msgT > 0 && s.msg && s.st !== 'card') v53sTxt(c, s.msg, W/2, s.st === 'fight' ? H*.618 - 60 : SY + (H - SY)*.382, fs, s.st === 'bite' ? '#ffab40' : '#fff');
  if(s.st === 'bite'){ v53sTxt(c, '❗', s.hx, SY - 30 - Math.abs(Math.sin(t*10))*8, 40, '#ffab40'); }
  if(s.card) v53sCard(s, c);
  if(s.over){ const oy = port ? H*.382 : H*.24; c.fillStyle = 'rgba(5,8,20,.74)'; c.fillRect(0, 0, W, H); v53sTxt(c, '🎣 ' + s.over, W/2, oy, port ? 28 : 30, '#ffd23f'); v53sTxt(c, s.sub || '', W/2, oy + 44, fs - 2, '#fff');
    s.bag.slice(-6).forEach((b, i, a) => { const sp = v53sAll().find(x => x.n === b.n); if(!sp) return; const x = W/2 + (i - (a.length - 1)/2)*Math.min(110, W/7); v53sFishDraw(c, {sp, w:Math.min(b.w, 40), vx:1}, x, oy + (port ? 120 : 92), v53sSc({w:Math.min(b.w, 40)}, 1.6)); }); } }
function v53sCard(s, c){ const W = s.vw, H = s.vh, port = H > W, cw = Math.min(port ? W - 36 : 440, 460), ch = Math.min(H - 24, Math.round(cw/V53S_PHI) + (port ? 150 : 110)), x = (W - cw)/2, y = Math.max(port ? 96 : 12, (H - ch)/2), {sp, w, isNew} = s.card;
  const RC = ['#b0bec5', '#4fc3f7', '#b06bff', '#ffd23f'], RN = ['Thường', 'Hiếm', 'Quý', 'Huyền thoại'];
  c.fillStyle = 'rgba(5,8,20,.55)'; c.fillRect(0, 0, W, H); c.fillStyle = '#10203c'; v45pRound(c, x, y, cw, ch, 18); c.fill(); c.strokeStyle = RC[sp.r]; c.lineWidth = 4; v45pRound(c, x, y, cw, ch, 18); c.stroke();
  const L = Math.min(150, 14 + Math.pow(Math.min(w, 60), .45)*9); c.save(); const z = 1 + Math.sin(s.t*3)*.03; c.translate(W/2, y + ch*.236); c.scale(z, z); v53sFishDraw(c, {sp, w:Math.min(w, 60), vx:1}, 0, 0, Math.min(5, cw*.42/Math.max(12, L))); c.restore();
  v53sTxt(c, (isNew ? '✨ Loài mới! ' : '') + sp.n, W/2, y + ch*.47, port ? 26 : 26, RC[sp.r]); v53sTxt(c, `${w >= 1000 ? (w/1000).toFixed(1) + ' tấn' : w + ' kg'} · ${RN[sp.r]} ${'★'.repeat(sp.r + 1)}`, W/2, y + ch*.47 + 32, 20, '#fff');
  c.font = '700 18px Nunito, sans-serif'; c.fillStyle = '#d6e4ff'; c.textAlign = 'center'; const words = ('💡 ' + sp.fx).split(' '); let line = '', ly = y + ch*.47 + 66; const mw = cw - 40;
  words.forEach(wd => { const tt = line ? line + ' ' + wd : wd; if(c.measureText(tt).width > mw){ c.fillText(line, W/2, ly); line = wd; ly += 24; } else line = tt; }); if(line) c.fillText(line, W/2, ly);
  v53sTxt(c, sp.rel ? '💚 Đã thả về biển · 👆 chạm để câu tiếp' : '🧺 Đã cho vào giỏ · 👆 chạm để câu tiếp', W/2, y + ch - 18, 18, sp.rel ? '#a5d6a7' : '#ffd23f'); c.textAlign = 'left'; }

// ---------- 4. sổ tay cá + giỏ cá: bán ở chợ, mang về bếp ----------
function v53sPrice(b){ return Math.max(1, Math.min(20, Math.round(1 + b.r*2.5 + Math.sqrt(b.w)*1.1))); }
const V53S_DISH = b => b.n === 'Cá nóc' ? null : /Mực|Bạch tuộc/.test(b.n) ? '🦑 Mực nướng sa tế' : /Cua/.test(b.n) ? '🦀 Cua hấp sả' : b.w < .6 ? '🍤 Cá chiên giòn' : b.w < 8 ? '🍲 Canh chua cá' : '🍛 Cá kho tộ';
function v53sBookBuild(){ if(V53S.book) return V53S.book; const d = document.createElement('div'); d.id = 'v53sBook'; d.hidden = true; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Sổ tay cá');
  d.innerHTML = '<div class="v53sbk"><header><b>📖 Sổ tay cá biển</b><button type="button" class="v53sx" aria-label="Đóng">✕</button></header><nav><button type="button" data-t="dex">📖 Sổ tay</button><button type="button" data-t="bag">🧺 Giỏ cá</button></nav><p class="v53ssum"></p><div class="v53sbody"></div></div>';
  document.body.appendChild(d); V53S.book = d; d.querySelector('.v53sx').onclick = () => { d.hidden = true; }; d.addEventListener('pointerdown', e => { if(e.target === d) d.hidden = true; });
  d.querySelectorAll('nav button').forEach(b => b.onclick = () => v53sBookOpen(b.dataset.t)); return d; }
function v53sBookOpen(tab){ const d = v53sBookBuild(), db = v53sDb(); V53S.tab = tab || V53S.tab || 'dex'; d.hidden = false; d.querySelectorAll('nav button').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === V53S.tab));
  const body = d.querySelector('.v53sbody'), sum = d.querySelector('.v53ssum'), all = v53sAll(), got = all.filter(s => db.dex[s.n]).length; let h = '';
  if(V53S.tab === 'dex'){ sum.textContent = `Đã gặp ${got}/${all.length} loài · càng xa đảo, nước càng sâu, cá càng hiếm`;
    all.slice().sort((a, b) => a.z - b.z || a.r - b.r).forEach(s => { const e = db.dex[s.n]; h += `<div class="v53scard${e ? '' : ' v53sunk'} v53sr${s.r}"><img alt="" src="${v53sIcon(s)}"><div><b>${e ? v51tEsc(s.n) : '???'}</b><small>${'★'.repeat(s.r + 1)} · ${e ? `${e.c} lần · lớn nhất ${e.best >= 1000 ? (e.best/1000).toFixed(1) + ' tấn' : e.best + ' kg'}` : 'chưa gặp'}</small><span>${e ? '💡 ' + v51tEsc(s.fx) : '🔎 ' + v53sCondTxt(s)}</span></div></div>`; }); }
  else { const c = v53sMe(), land = !(c && c.boat); sum.textContent = db.bag.length ? (land ? `${db.bag.length} con cá trong giỏ · bán ở chợ hoặc mang về bếp nấu` : '⛵ Đang ở trên thuyền: cập bờ rồi mới bán hoặc nấu được nhé') : 'Giỏ trống. Ra khơi thả neo câu cá nhé!';
    if(db.bag.length && land) h += `<div class="v53srow v53sall"><button type="button" data-a="sellall">💰 Bán cả giỏ ở chợ ($${db.bag.reduce((a, b) => a + v53sPrice(b), 0)})</button></div>`;
    db.bag.slice().reverse().forEach((b, ri) => { const i = db.bag.length - 1 - ri, sp = all.find(x => x.n === b.n), dish = V53S_DISH(b); if(!sp) return;
      h += `<div class="v53srow"><img alt="" src="${v53sIcon(sp)}"><div><b>${v51tEsc(b.n)}</b><small>${b.w >= 1000 ? (b.w/1000).toFixed(1) + ' tấn' : b.w + ' kg'} · $${v53sPrice(b)}</small></div><button type="button" data-a="sell" data-i="${i}"${land ? '' : ' disabled'}>💰 Bán</button><button type="button" data-a="cook" data-i="${i}"${land && dish ? '' : ' disabled'}>🍳 ${dish ? 'Nấu' : 'Có độc'}</button></div>`; }); }
  body.innerHTML = h; body.querySelectorAll('button[data-a]').forEach(b => b.onclick = () => v53sBagAct(b.dataset.a, +b.dataset.i)); }
function v53sBagAct(a, i){ const db = v53sDb(), c = v53sMe(); if(c && c.boat){ toast('⛵ Cập bờ rồi mang cá ra chợ hoặc về bếp nhé!'); return; }
  if(!PROF){ try { loginNudge(); } catch(e){} return; }
  if(a === 'sellall'){ const m = db.bag.reduce((s, b) => s + v53sPrice(b), 0), n = db.bag.length; db.bag = []; v53sSave(); reward(0, m, `Bán ${n} con cá ở chợ`); toast(`💰 Bán ${n} con cá ở chợ được $${m}. Cô bán cá cảm ơn bạn!`); }
  else { const b = db.bag[i]; if(!b) return;
    if(a === 'sell'){ db.bag.splice(i, 1); v53sSave(); const m = v53sPrice(b); reward(0, m, `Bán ${b.n} ở chợ`); toast(`💰 Bán ${b.n} được $${m}`); }
    else { const dish = V53S_DISH(b); if(!dish){ toast('☠️ Cá nóc có độc, không được nấu ăn! Mang ra chợ bán cho trạm nghiên cứu nhé.'); return; } db.bag.splice(i, 1); db.cook = (db.cook || 0) + 1; v53sSave(); reward(4 + b.r*3, 0, 'Nấu cá ở bếp'); toast(`🍳 Mang về bếp nấu: ${dish} thơm lừng! Cả nhà ăn ngon miệng.`); } }
  v53sBookOpen('bag'); }

// ---------- 5. khởi động phần câu cá ----------
function v53sFishInit(){
  const oa = openArcade; openArcade = function(id){ const r = oa.apply(this, arguments); const my = id === 'v53sfish' || id === 'v53spir'; document.body.classList.toggle('v53sarc', my); if(my){ document.body.classList.add('v45pond'); try { v44Fit(); } catch(e){} } return r; };
  const ar = arcReward; arcReward = function(id, s){ if(id === 'v53sfish' || id === 'v53spir'){ if(!PROF){ try { loginNudge(); } catch(e){} return; } const [m, e] = s.rw || [1, 6]; reward(e, m, id === 'v53sfish' ? 'Câu cá ngoài khơi' : 'Đuổi tàu hải tặc'); return; } return ar.apply(this, arguments); };
  addEventListener('resize', () => { if((ARC.id === 'v53sfish' || ARC.id === 'v53spir') && ARC.s && openModal && openModal.id === 'mArcade'){ const [vw, vh] = v45pSize(), cv = $('#arcCv'); if(cv.width !== vw || cv.height !== vh){ cv.width = vw; cv.height = vh; const s = ARC.s, k = vh/s.vh; s.vw = vw; s.vh = vh; s.sy = Math.round(vh*.382); s.bot = vh - 40;
    if(ARC.id === 'v53sfish'){ v53sFishLay(s); s.fish.forEach(f => { f.x = Math.min(vw - 20, f.x); f.y = f.by = s.sy + 40 + Math.max(0, f.by - s.sy - 40)*k; }); } else if(s.lay) s.lay(); } try { v44Fit(); } catch(e){} } });
}
