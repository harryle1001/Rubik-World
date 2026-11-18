// ================= v62k · 10 THẦY CÔ GIÁO SƯ (1/3 · lõi): nhân vật, lịch đi dạo, vẽ pixel, chạm để nói chuyện, tiến độ học =================
// Thầy cô đi trên đường đảo tròn v46 (toạ độ MỚI), tự vẽ sprite pixel (cache), không gắn nhãn chữ trên bản đồ.
// Kho kiến thức tải lười: js/data/v62k/kb-<id>.txt (gzip + base64) khi mở thầy cô lần đầu.
// look: da, tóc (màu, kiểu), áo, quần/váy, kính, râu, áo khoác, đạo cụ cầm tay
const V62K_T = [
  {id:'toan', n:'Cô Phi Lam', s:'Toán học', ic:'📐', g:'cô', hi:'Chào em! Cô là Phi Lam, người mê con số φ = 1,618. Hôm nay mình cùng đếm vẻ đẹp của Toán nhé!',
    L:{sk:'#f2c9a0', hr:'#2b1d14', hs:'bun', sh:'#ffb703', pa:'#3a4a7a', sk2:1, gl:'#1b1b1b', pr:'ruler'}, st:['rubik', 'rubikpark', 'attend', 'office'],
    qa:{t:'Rubik + mini game Toán', re:/Rubik|Toán|Sudoku|thẻ nhớ|Ikigai|cờ vua|Cờ|chess|Thuật toán/i, x:['rubik3d']}},
  {id:'ly', n:'Thầy Lực Quang', s:'Vật lý', ic:'🧲', g:'thầy', hi:'Chào em! Thầy là Lực Quang. Mọi thứ quanh ta đều chuyển động — mình cùng tìm hiểu vì sao nhé!',
    L:{sk:'#e8b48a', hr:'#d9d9d9', hs:'bald', sh:'#4361ee', pa:'#2b2d42', coat:1, gl:'#5c3b1e', be:'#d9d9d9', pr:'magnet'}, st:['elec', 'field', 'attend', 'office'],
    qa:{t:'Máy bay, xe, khinh khí cầu, thuyền', re:/Xe đạp|Thuyền|Khinh khí cầu|khinh khí cầu|Máy bay|Hangar|Sân bay|Xe cứu hoả|Xe cảnh sát|Drone|Trạm cứu hoả|Đồn cảnh sát/i, x:['plane3']}},
  {id:'hoa', n:'Cô Ngọc Tố', s:'Hoá học', ic:'⚗️', g:'cô', hi:'Xin chào! Cô là Ngọc Tố. Mọi vật đều làm từ nguyên tử — nhỏ xíu mà kỳ diệu lắm!',
    L:{sk:'#f5d0b0', hr:'#7a2e1d', hs:'long', sh:'#2ec4b6', pa:'#264653', coat:1, gl:'#2b2b2b', pr:'flask'}, st:['academy', 'giantchess', 'zen', 'office'],
    qa:{t:'Bếp, nấu ăn, pha chế, TTTM, chợ', re:/Bếp|Nấu ăn|Pha Chế|TTTM|Cửa hàng|Chợ|Bánh mì|Kem que|Trà sữa|Ngô nướng|Cứu hoả: Nhà bếp/i}},
  {id:'sinh', n:'Cô Lục Diệp', s:'Sinh học', ic:'🌿', g:'cô', hi:'Chào em! Cô là Lục Diệp. Cây xanh, con vật và cả cơ thể em đều là những điều kỳ diệu của sự sống!',
    L:{sk:'#d9a679', hr:'#1e1e1e', hs:'curly', sh:'#52b788', pa:'#6b4f2a', hat:'#e9c46a', pr:'leaf'}, st:['garden', 'zen', 'rubikpark', 'office'],
    qa:{t:'Nông trại, câu cá, thú, vườn', re:/Nông trại|Câu cá|cá|Đua thú|Sinh Vật|vườn|Vườn|Đầm sen|Koi|Đồng lúa|Cánh đồng|Bách thảo/i}},
  {id:'su', n:'Thầy Đăng Sử', s:'Lịch sử', ic:'📜', g:'thầy', hi:'Chào học trò! Thầy là Đăng Sử. Mỗi viên gạch cổ đều kể một câu chuyện — em có muốn nghe không?',
    L:{sk:'#e3b089', hr:'#3b2a1a', hs:'short', sh:'#9d0208', pa:'#3d2b1f', be:'#3b2a1a', pr:'scroll'}, st:['hall', 'rubikyard', 'attend', 'office'],
    qa:{t:'Học viện phép thuật, phố phép thuật, lâu đài', re:/phép thuật|Phép|Chổi|Rune|Học viện|Bản đồ nhà|Biệt thự|Lâu đài|Hội trường|Người Thầy/i}},
  {id:'dia', n:'Cô Hải Đồ', s:'Địa lý', ic:'🌏', g:'cô', hi:'Chào em! Cô là Hải Đồ. Trái Đất rộng lắm — hôm nay mình đi vòng quanh thế giới bằng tấm bản đồ nhé!',
    L:{sk:'#efc3a0', hr:'#4a2c1a', hs:'pony', sh:'#219ebc', pa:'#023047', sk2:1, pr:'globe'}, st:['library', 'chess', 'zen', 'office'],
    qa:{t:'Biển, hành tinh, bản đồ, đảo', re:/Bản đồ|bản đồ|biển|Biển|Bến|tàu|Tàu|Hải|hải|Sông|Đồi|Thiên văn|thiên văn|Kính|Ngày \/ đêm|Bốn mùa/i, x:['planet']}},
  {id:'van', n:'Thầy Nghiên Văn', s:'Văn học', ic:'🖋️', g:'thầy', hi:'Chào em! Thầy là Nghiên Văn. Tiếng Việt mình giàu đẹp lắm — mỗi chữ là một bức tranh nhỏ.',
    L:{sk:'#f0c29c', hr:'#111111', hs:'side', sh:'#f1faee', pa:'#1d3557', gl:'#8b5e34', tie:'#e63946', pr:'book'}, st:['library', 'hall', 'rubikpark', 'office'],
    qa:{t:'Thư viện, hộp thoại, chữ trên màn hình', re:/Thư viện|Nói chuyện với|Sổ cá|Quét giao diện chính$/i, x:['texts', 'library']}},
  {id:'anh', n:'Cô Linh Ngữ', s:'Tiếng Anh', ic:'🔤', g:'cô', hi:'Hello! Cô là Linh Ngữ. Mỗi ngày một từ mới — little by little, a little becomes a lot!',
    L:{sk:'#f6d5b8', hr:'#c9a227', hs:'bob', sh:'#e76f51', pa:'#2a2a2a', sk2:1, pr:'card'}, st:['chess', 'field', 'attend', 'office'],
    qa:{t:'Menu song ngữ, nhãn, nút', re:/Quét giao diện|Nút trên màn hình|Kiểm tra nhãn|Đấu trường online/i, x:['bilingual']}},
  {id:'tin', n:'Thầy Minh Bit', s:'Tin học', ic:'💻', g:'thầy', hi:'Chào em! Thầy là Minh Bit. 0 và 1 thôi mà dựng nên cả thế giới số — mình cùng lập trình nhé!',
    L:{sk:'#e0ad85', hr:'#2d2d2d', hs:'spiky', sh:'#3a0ca3', pa:'#222', gl:'#0aff99', hood:1, pr:'laptop'}, st:['elec', 'arena', 'giantchess', 'office'],
    qa:{t:'Trường tin học, laptop, online, chạm', re:/tin học|Tin học|Bài |Laptop|online|Online/i, x:['tap']}},
  {id:'nghe', n:'Cô Cầm Hoạ', s:'Nghệ thuật & Âm nhạc', ic:'🎨', g:'cô', hi:'Chào em! Cô là Cầm Hoạ. Màu sắc và âm thanh giúp ta kể chuyện mà không cần lời đấy!',
    L:{sk:'#f3c7a5', hr:'#6a1b4d', hs:'beret', sh:'#ff70a6', pa:'#5a189a', sk2:1, beret:'#e63946', pr:'palette'}, st:['music', 'art', 'zen', 'office'],
    qa:{t:'Âm thanh, nhạc, vẽ, phố đi bộ', re:/nhạc|Nhạc|đàn|Phố đi bộ|họa sĩ|Họa sĩ|Hoạ sĩ|guitar|violin|Vẽ|Kịch câm|Đài phun|thiền|Lửa trại/i, x:['sound', 'music']}}
];
const V62K = {T:[], ready:false, spr:{}, kb:{}, kbP:{}, cur:null, dlg:null, tapT:0, near:null, prof:null, hold:{}};
function v62kOK(){ return typeof OWNER !== 'undefined' && !!OWNER && OWNER.is === true; }
function v62kDay(){ const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function v62kRnd(a, b){ return a + Math.random()*(b - a); }

// ---------- sprite pixel (vẽ bằng code, cache 3 khung: đứng, bước 1, bước 2) ----------
function v62kPaint(L, fr, sc){
  const c = document.createElement('canvas'); c.width = 16*sc; c.height = 27*sc; const g = c.getContext('2d');
  const R = (col, x, y, w, h) => { if(!col) return; g.fillStyle = col; g.fillRect(x*sc, y*sc, w*sc, h*sc); };
  const dk = (h, k) => { const n = parseInt(h.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v*k))); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => f(v).toString(16).padStart(2, '0')).join(''); };
  const lg = fr === 1 ? [0, 1] : fr === 2 ? [1, 0] : [0, 0];
  // chân + giày
  if(L.sk2){ R(L.pa, 4, 17, 8, 3); R(dk(L.pa, .8), 4, 19, 8, 1); R(L.sk, 5, 20, 2, 3 - lg[0]); R(L.sk, 9, 20, 2, 3 - lg[1]); }
  else { R(L.pa, 5, 17, 3, 6 - lg[0]); R(L.pa, 8, 17, 3, 6 - lg[1]); R(dk(L.pa, .75), 7, 17, 2, 4); }
  R('#2a1d16', 4 + (fr === 1 ? 1 : 0), 23 - lg[0], 4, 2); R('#2a1d16', 8 - (fr === 2 ? 1 : 0), 23 - lg[1], 4, 2);
  // thân áo
  R(L.sh, 4, 10, 8, 8); R(dk(L.sh, .82), 4, 16, 8, 1);
  if(L.coat){ R('#f8f9fa', 3, 10, 3, 9); R('#f8f9fa', 10, 10, 3, 9); R('#ced4da', 5, 10, 1, 9); R('#ced4da', 10, 10, 1, 9); }
  if(L.hood){ R(dk(L.sh, .7), 4, 10, 8, 1); R('#fff', 7, 12, 2, 2); }
  if(L.tie){ R(L.tie, 7, 10, 2, 5); R(dk(L.tie, .7), 7, 15, 2, 1); }
  // tay
  const ac = L.coat ? '#f8f9fa' : L.sh, sw = fr ? (fr === 1 ? 1 : -1) : 0;
  R(dk(ac, .9), 2, 10 + sw, 2, 6); R(dk(ac, .9), 12, 10 - sw, 2, 6); R(L.sk, 2, 16 + sw, 2, 2); R(L.sk, 12, 16 - sw, 2, 2);
  // cổ + đầu
  R(L.sk, 7, 9, 2, 1); R(L.sk, 5, 2, 6, 7); R(dk(L.sk, .88), 5, 8, 6, 1); R(L.sk, 4, 4, 1, 2); R(L.sk, 11, 4, 1, 2);
  R('#1b1b1b', 6, 5, 1, 1); R('#1b1b1b', 9, 5, 1, 1); R('#e07a5f', 7, 7, 2, 1);
  if(L.gl){ R(L.gl, 5, 4, 3, 1); R(L.gl, 8, 4, 3, 1); R(L.gl, 5, 5, 1, 1); R(L.gl, 7, 5, 2, 1); R(L.gl, 10, 5, 1, 1); }
  if(L.be){ R(L.be, 5, 7, 6, 2); R(L.be, 4, 5, 1, 3); R(L.be, 11, 5, 1, 3); R('#e07a5f', 7, 7, 2, 1); }
  // tóc
  const h = L.hr, hs = L.hs;
  if(hs === 'bald'){ R(h, 4, 3, 1, 2); R(h, 11, 3, 1, 2); R(dk(L.sk, 1.06), 6, 2, 3, 1); }
  else { R(h, 5, 1, 6, 2); R(h, 4, 2, 1, 3); R(h, 11, 2, 1, 3); }
  if(hs === 'bun'){ R(h, 6, 0, 4, 1); R(dk(h, 1.4), 7, 0, 2, 1); }
  if(hs === 'long'){ R(h, 3, 3, 2, 9); R(h, 11, 3, 2, 9); }
  if(hs === 'curly'){ R(h, 4, 0, 8, 2); R(h, 3, 2, 2, 4); R(h, 11, 2, 2, 4); }
  if(hs === 'pony'){ R(h, 11, 3, 3, 2); R(h, 13, 4, 1, 5); }
  if(hs === 'side'){ R(h, 5, 2, 4, 1); R(dk(h, 2.5), 9, 1, 1, 1); }
  if(hs === 'bob'){ R(h, 3, 2, 2, 6); R(h, 11, 2, 2, 6); R(h, 5, 2, 2, 1); }
  if(hs === 'spiky'){ R(h, 5, 0, 1, 1); R(h, 7, 0, 1, 1); R(h, 9, 0, 1, 1); }
  if(L.hat){ R(L.hat, 3, 1, 10, 1); R(L.hat, 5, 0, 6, 1); R(dk(L.hat, .8), 5, 1, 6, 1); }
  if(L.beret){ R(L.beret, 4, 0, 8, 2); R(L.beret, 9, -0, 1, 1); R(dk(L.beret, .75), 4, 2, 8, 0.6); }
  // đạo cụ (tay phải)
  const px = 12, py = 13 - sw;
  switch(L.pr){
    case 'ruler': R('#ffd166', px + 1, py - 4, 1, 9); R('#7a5c00', px + 1, py - 3, 1, 1); R('#7a5c00', px + 1, py - 1, 1, 1); R('#7a5c00', px + 1, py + 1, 1, 1); break;
    case 'magnet': R('#e63946', px, py + 2, 1, 3); R('#e63946', px + 2, py + 2, 1, 3); R('#adb5bd', px, py + 5, 1, 1); R('#adb5bd', px + 2, py + 5, 1, 1); R('#e63946', px, py + 2, 3, 1); break;
    case 'flask': R('#dee2e6', px + 1, py, 1, 2); R('#b8f2e6', px, py + 2, 3, 3); R('#06d6a0', px, py + 3, 3, 2); break;
    case 'leaf': R('#2d6a4f', px + 1, py - 1, 1, 6); R('#74c69d', px, py - 1, 3, 3); R('#40916c', px + 1, py, 1, 1); break;
    case 'scroll': R('#f1e3c3', px, py + 1, 3, 5); R('#a0522d', px, py, 3, 1); R('#a0522d', px, py + 6, 3, 1); break;
    case 'globe': R('#4cc9f0', px, py + 1, 3, 3); R('#52b788', px + 1, py + 1, 1, 2); R('#6c757d', px + 1, py + 4, 1, 2); R('#6c757d', px, py + 6, 3, 1); break;
    case 'book': R('#6a4c93', px - 1, py + 1, 4, 5); R('#fff', px, py + 2, 2, 3); break;
    case 'card': R('#fff', px - 1, py + 1, 4, 3); R('#e76f51', px, py + 2, 1, 1); R('#264653', px + 1, py + 2, 1, 1); break;
    case 'laptop': R('#adb5bd', px - 2, py + 3, 5, 1); R('#343a40', px - 1, py, 4, 3); R('#0aff99', px, py + 1, 2, 1); break;
    case 'palette': R('#d4a373', px - 1, py + 1, 4, 3); R('#e63946', px - 1, py + 1, 1, 1); R('#ffd166', px + 1, py + 1, 1, 1); R('#118ab2', px, py + 2, 1, 1); R('#06d6a0', px + 2, py + 2, 1, 1); break;
  }
  return c;
}
function v62kSpr(t, fr, sc){ const k = t.id + fr + '_' + (sc || 2); return V62K.spr[k] || (V62K.spr[k] = v62kPaint((t.def || t).L, fr, sc || 2)); }
// chân dung (dùng trong hộp thoại & bảng báo cáo)
function v62kPortrait(t, sc){ const c = v62kSpr(t, 0, sc || 5); try { return c.toDataURL(); } catch(e){ return ''; } }

// ---------- lịch đi dạo trên đường đảo ----------
function v62kStop(t, k){
  const id = t.def.st[k % t.def.st.length], z = V46.ZI[id] || V46.ZI.office || V46.Z[0];
  let p = [V46L.CX, V46L.CY];
  try { p = v46Entry(z); } catch(e){ p = [(z.n.x0 + z.n.x1)/2, z.n.y1 + 10]; }
  const a = t.i*0.618*Math.PI*2, r = 26 + (t.i % 3)*16; // xếp vòng theo góc vàng → không đứng đè nhau
  return {zid:id, p:[p[0] + Math.cos(a)*r, p[1] + Math.sin(a)*r*0.6]};
}
function v62kPlan(t){
  t.k = (t.k + 1) % t.def.st.length; const s = v62kStop(t, t.k); t.zid = s.zid;
  let P; try { P = v46Route(t.p.slice(), s.p).slice(1); } catch(e){ P = [s.p]; }
  if(!P || !P.length) P = [s.p]; t.route = P; t.ri = 0; t.wait = 0;
}
function v62kBuild(){
  if(V62K.ready || typeof V46 === 'undefined' || !V46.ready || !V46.Z.length) return false;
  V62K.T = V62K_T.map((def, i) => { const t = {def, id:def.id, i, k:i % def.st.length, p:[0, 0], route:[], ri:0, wait:v62kRnd(2, 30), dir:1, ph:Math.random()*6, mv:false};
    const s = v62kStop(t, t.k); t.p = s.p.slice(); t.zid = s.zid; return t; });
  V62K.ready = true; return true;
}
function v62kTick(dt){
  if(!V62K.ready && !v62kBuild()) return; dt = Math.min(.1, dt || .016);
  const now = performance.now();
  for(const t of V62K.T){
    t.mv = false;
    if((V62K.hold[t.id] || 0) > now || (V62K.cur === t && V62K.dlg && !V62K.dlg.hidden)){ v62kFace(t); continue; }
    if(t.wait > 0){ t.wait -= dt; if(t.wait <= 0) v62kPlan(t); continue; }
    if(!t.route.length){ t.wait = v62kRnd(18, 40); continue; }
    let st = 52*dt;
    while(st > 0 && t.ri < t.route.length){ const q = t.route[t.ri], dx = q[0] - t.p[0], dy = q[1] - t.p[1], d = Math.hypot(dx, dy);
      if(Math.abs(dx) > .4) t.dir = dx < 0 ? -1 : 1;
      if(d <= st){ t.p[0] = q[0]; t.p[1] = q[1]; st -= d; t.ri++; } else { t.p[0] += dx/d*st; t.p[1] += dy/d*st; st = 0; } }
    t.mv = true; t.ph += dt*8;
    if(t.ri >= t.route.length){ t.route = []; t.wait = v62kRnd(22, 48); }   // tới nơi: dạy / nghỉ một lúc
  }
  // tách nhau ra nếu đứng quá gần (không đè lên nhau)
  const T = V62K.T;
  for(let i = 0; i < T.length; i++) for(let j = i + 1; j < T.length; j++){ const a = T[i].p, b = T[j].p, dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
    if(d < 24 && d > .01){ const k = (24 - d)*.5*Math.min(1, dt*6)/d; a[0] -= dx*k; a[1] -= dy*k*.5; b[0] += dx*k; b[1] += dy*k*.5; }
    else if(d <= .01){ b[0] += 12; } }
}
function v62kFace(t){ try { const p = v46Pos(PLAYER); if(Math.abs(p[0] - t.p[0]) > 2) t.dir = p[0] < t.p[0] ? -1 : 1; } catch(e){} }
function v62kPlayerD(t){ try { if(!PLAYER || !PLAYER.visible) return 1e9; const p = v46Pos(PLAYER); return Math.hypot(p[0] - t.p[0], p[1] - t.p[1]); } catch(e){ return 1e9; } }

// ---------- vẽ (sau tàu/phố v47, trước ánh sáng ngày đêm) ----------
function v62kDraw(VBn){
  if(!V62K.ready || cam.z < .22) return;
  const L = V62K.T.filter(t => t.p[0] > VBn.x0 && t.p[0] < VBn.x1 && t.p[1] > VBn.y0 && t.p[1] < VBn.y1).sort((a, b) => a.p[1] - b.p[1]);
  let near = null, nd = 150;
  for(const t of L){
    const x = Math.round(t.p[0]), y = Math.round(t.p[1]), fr = t.mv ? 1 + ((t.ph | 0) & 1) : 0, img = v62kSpr(t, fr, 2), bob = t.mv ? 0 : Math.round(Math.sin(realT*2 + t.i)*.6);
    ctx.fillStyle = 'rgba(0,0,0,.24)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 11, 4, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(x, y); if(t.dir < 0) ctx.scale(-1, 1); ctx.drawImage(img, -16, -52 + bob); ctx.restore();
    const d = v62kPlayerD(t); if(d < nd){ nd = d; near = t; }
  }
  V62K.near = near;
  if(near && !(V62K.dlg && !V62K.dlg.hidden)){ // bong bóng 💬 nhỏ trên đầu thầy cô gần nhất — không chữ
    const x = Math.round(near.p[0]), y = Math.round(near.p[1]) - 66 + Math.sin(realT*3)*2;
    ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.ellipse(x, y, 11, 9, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 3, y + 7); ctx.lineTo(x + 2, y + 13); ctx.lineTo(x + 4, y + 6); ctx.fill();
    ctx.fillStyle = '#3a86ff'; [-5, 0, 5].forEach((o, k) => { ctx.beginPath(); ctx.arc(x + o, y, 1.8 + ((realT*3 + k) % 3 < 1 ? .6 : 0), 0, 7); ctx.fill(); });
  }
}

// ---------- chạm vào thầy cô ----------
function v62kHit(sx, sy){
  if(!V62K.ready || typeof V46 === 'undefined' || !V46.on || V46.sky) return null;
  const wx = cam.x + (sx - cw/2)/cam.z, wy = cam.y + (sy - ch/2)/cam.z, pad = Math.max(4, 16/cam.z);
  let best = null, bd = 1e9;
  for(const t of V62K.T){ const x = t.p[0], y = t.p[1]; if(wx < x - 14 - pad || wx > x + 14 + pad || wy < y - 54 - pad || wy > y + 4 + pad) continue; const d = Math.hypot(wx - x, wy - y + 24); if(d < bd){ bd = d; best = t; } }
  return best;
}
function v62kTapInit(){
  const st = document.getElementById('stage') || document.body;
  let dn = null;
  st.addEventListener('pointerdown', e => { dn = [e.clientX, e.clientY, performance.now()]; }, true);
  st.addEventListener('pointerup', e => {
    if(typeof cvs === 'undefined' || e.target !== cvs || !dn) return;
    if(Math.hypot(e.clientX - dn[0], e.clientY - dn[1]) > 12 || performance.now() - dn[2] > 450) return;
    if(v62kBusy()) return;
    const r = cvs.getBoundingClientRect(), t = v62kHit(e.clientX - r.left, e.clientY - r.top); if(!t) return;
    e.stopImmediatePropagation(); try { drag = null; } catch(er){} try { cvs.releasePointerCapture(e.pointerId); } catch(er){}
    v62kTouch(t);
  }, true);
}
// đang lái máy bay/xe, đi thuyền, nhìn hành tinh… thì không chạm thầy cô (không dùng v58tBlocked: V57P.on luôn bật)
function v62kBusy(){
  const P = typeof PLAYER !== 'undefined' ? PLAYER : null; if(!P || !P.visible || P.boat || P.v16fly || P.mount) return true;
  try { if(V46.sky || (typeof v56pActive === 'function' && v56pActive())) return true; } catch(e){}
  try { if(V51P.on || V53C.mode || V52LD.on) return true; } catch(e){}
  return false;
}
function v62kTouch(t){
  V62K.hold[t.id] = performance.now() + 12000;
  if(v62kPlayerD(t) < 170){ v62kOpen(t); return; }
  // ở xa: tự đi tới cạnh thầy cô rồi mở
  try { const o = v46ToOld(t.p[0] + 22, t.p[1] + 6); if(typeof v58tGo === 'function') v58tGo(o[0], o[1], () => v62kOpen(t)); else v32Nav(o[0], o[1], ' ', true, () => v62kOpen(t)); }
  catch(e){ v62kOpen(t); }
}

// ---------- tiến độ học (lưu trong hồ sơ người chơi) ----------
function v62kProf(){
  if(typeof PROF === 'undefined' || !PROF) return V62K.prof || (V62K.prof = {t:{}, day:{d:'', exp:0, cash:0, ai:0}});
  if(!PROF.v62k) PROF.v62k = {t:{}, day:{d:'', exp:0, cash:0, ai:0}};
  const s = PROF.v62k; if(s.day.d !== v62kDay()) s.day = {d:v62kDay(), exp:0, cash:0, ai:0, lesson:{}};
  if(!s.day.lesson) s.day.lesson = {};
  return s;
}
function v62kTP(id){ const s = v62kProf(); return s.t[id] || (s.t[id] = {seen:[], ok:[], tries:0, right:0, story:0, badge:''}); }
function v62kSave(){ try { if(typeof saveProfile === 'function') saveProfile(); } catch(e){} }
// thưởng nhỏ, có trần mỗi ngày (cân bằng kinh tế game)
function v62kGive(exp, cash, why){
  const s = v62kProf(), e = Math.max(0, Math.min(exp, 300 - s.day.exp)), c = Math.max(0, Math.min(cash, 60 - s.day.cash));
  s.day.exp += e; s.day.cash += c; if(e || c) try { reward(e, c, why, true); } catch(er){}
  v62kSave(); return e + c > 0;
}
function v62kBadge(t){
  const P = v62kTP(t.id); if(P.badge) return false;
  if(P.seen.length >= 20 && P.ok.length >= 15){ P.badge = v62kDay(); v62kSave(); try { toast(`🏅 Huy hiệu mới: “Học trò của ${t.def.n}”!`); } catch(e){} v62kGive(40, 10, 'Huy hiệu Học trò của ' + t.def.n); return true; }
  return false;
}

// ---------- kho kiến thức: tải lười (gzip + base64) ----------
async function v62kKB(id){
  if(V62K.kb[id]) return V62K.kb[id];
  if(V62K.kbP[id]) return V62K.kbP[id];
  V62K.kbP[id] = (async () => {
    const r = await fetch('js/data/v62k/kb-' + id + '.txt', {cache:'force-cache'}); if(!r.ok) throw new Error('kb ' + r.status);
    const b = atob((await r.text()).trim()), u = new Uint8Array(b.length); for(let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    if(typeof DecompressionStream === 'undefined') throw new Error('Thiết bị chưa hỗ trợ giải nén');
    const ds = new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'));
    const J = JSON.parse(await new Response(ds).text()); V62K.kb[id] = J; return J;
  })();
  try { return await V62K.kbP[id]; } catch(e){ V62K.kbP[id] = null; throw e; }
}

function v62kInit(){
  try { const w0 = v47wWorld; v47wWorld = function(VBn){ w0(VBn); try { v62kDraw(VBn); } catch(e){} }; } catch(e){ console.warn('v62k draw', e); }
  try { const r0 = v46Render; v46Render = function(dt){ try { v62kTick(dt); } catch(e){} return r0.apply(this, arguments); }; } catch(e){ console.warn('v62k tick', e); }
  try { v62kTapInit(); } catch(e){ console.warn('v62k tap', e); }
  try { v62kUiInit(); } catch(e){ console.warn('v62k ui', e); }
  try { v62kQaInit(); } catch(e){ console.warn('v62k qa', e); }
}
