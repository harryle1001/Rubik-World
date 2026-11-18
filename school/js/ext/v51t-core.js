// ================= v51t · TRƯỜNG TIN HỌC RUBIK (Rubik Code School): lõi — vị trí trên đảo, lưu, thưởng, âm thanh, chữ pixel =================
// Thiết kế gốc (không dùng tên/logo/giao diện của sản phẩm khác). Mọi tên toàn cục có tiền tố v51t / V51T.
// Toà nhà vẽ thẳng trên đảo tròn v46 (toạ độ mới), KHÔNG cắt từ thế giới cũ. Vị trí lưu trong V46L.zones.tech (cờ v51t)
// để chế độ 🧩 Sắp xếp (v48) dời được như mọi khu khác; v46Build bỏ qua khu này.
const V51T_PHI = 1.618033988749895;
const V51T_FONT = "800 16px Nunito, 'Be Vietnam Pro', sans-serif";
const V51T_RUBIK = ['#ef4b4b', '#ffd23f', '#3d7bff', '#2fbf71', '#f4f4f4', '#ff8a2b'];
// khung khu: rộng 780 = toà nhà 482 (= 780/φ) + sân robot 298 (= 482/φ); cao 482 (= 780/φ)
const V51T_W = 780, V51T_H = 482;
const V51T = {open:false, game:null, lb:null, G:null, spr:{}, px:new Map(), geo:null, gk:'', snd:0};

// ---------- 0. đăng ký khu trên đảo (chạy lúc nạp file, TRƯỚC v46Init) ----------
V46L.zones.tech = {x:-3780, y:-1100, v51t:1};          // Tây Bắc, cạnh nhóm học tập (thư viện, học viện)
if(typeof V48M !== 'undefined'){ V48M.def.tech = [V46L.zones.tech.x, V46L.zones.tech.y];
  try { const s = v48mLoad(); const p = s && s.tech; if(Array.isArray(p) && isFinite(p[0]) && isFinite(p[1])){ V46L.zones.tech.x = Math.round(p[0]); V46L.zones.tech.y = Math.round(p[1]); } } catch(e){} }
// v46Build: bỏ qua khu v51t (không có khung cũ để cắt)
const v51tBuild0 = v46Build;
v46Build = function(){ const Z = V46L.zones, keep = {}; for(const k in Z) if(Z[k] && Z[k].v51t){ keep[k] = Z[k]; delete Z[k]; }
  try { return v51tBuild0.apply(this, arguments); } finally { Object.assign(Z, keep); } };
// v48 sắp xếp: thêm khung + ảnh thu nhỏ + tên
if(typeof v48mFoot === 'function'){
  const f0 = v48mFoot; v48mFoot = function(){ const F = f0(); F.tech = {e:[-V51T_W/2, -V51T_H/2, V51T_W/2, V51T_H/2], r:[-V51T_W/2, -V51T_H/2, V51T_W/2, V51T_H/2]}; return F; };
  const t0 = v48mThumbs; v48mThumbs = function(F){ const G = Object.assign({}, F); delete G.tech; const T = t0(G); try { T.tech = v51tThumb(); } catch(e){} return T; };
  const n0 = v48mName; v48mName = function(id){ return id === 'tech' ? ['💻', 'Trường Tin học'] : n0(id); };
}

// ---------- 1. hình học (toạ độ đảo mới) ----------
function v51tGeo(){
  const z = V46L.zones.tech, k = z.x + ',' + z.y; if(V51T.geo && V51T.gk === k) return V51T.geo;
  const P = V51T_PHI, cx = V46L.CX + z.x, cy = V46L.CY + z.y, x0 = cx - V51T_W/2, y0 = cy - V51T_H/2;
  const bw = Math.round(V51T_W/P), bh = Math.round(bw/P), gy = y0 + bh;                 // toà nhà 482×298 (hình chữ nhật vàng)
  const main = Math.round(bw/P), door = {w:Math.round(bh/P**3), h:Math.round(bh/P**3*P)}; // gian chính 298 · cửa 70×113
  const G = {cx, cy, x0, y0, x1:x0 + V51T_W, y1:y0 + V51T_H, bw, bh, gy, main,
    b:{x0, y0, x1:x0 + bw, y1:gy},                                                       // thân nhà (chặn đi)
    yard:{x0:x0 + bw, y0, x1:x0 + V51T_W, y1:y0 + V51T_H},                              // sân robot 298×482
    front:{x0, y0:gy, x1:x0 + bw, y1:y0 + V51T_H},                                       // quảng trường trước 482×184
    door:[x0 + Math.round(main/2), gy], dw:door.w, dh:door.h};
  G.sign = [x0 + main + Math.round((bw - main)/2), gy + Math.round((V51T_H - bh)/P)];   // biển hiệu đứng ở sân trước
  G.track = {x0:G.yard.x0 + 40, y0:y0 + 70, x1:G.yard.x1 - 40, y1:y0 + 70 + Math.round((V51T_W - bw - 80)*P)};
  V51T.geo = G; V51T.gk = k; return G;
}

// ---------- 2. lưu ----------
function v51tDef(){ return {st:{}, best:{}, lv:{}, cert:{}, art:[], day:{d:'', n:{}}, seen:0}; }
function v51tGuest(){ if(V51T.G) return V51T.G; let g = null; try { g = JSON.parse(localStorage.getItem('truong-v51t-guest') || 'null'); } catch(e){} V51T.G = Object.assign(v51tDef(), g || {}); return V51T.G; }
function v51tState(){
  if(typeof PROF !== 'undefined' && PROF){ if(!PROF.v51t) PROF.v51t = Object.assign(v51tDef(), v51tGuest()); const s = PROF.v51t; ['st', 'best', 'lv', 'cert'].forEach(k => { if(!s[k]) s[k] = {}; }); if(!s.day) s.day = {d:'', n:{}}; if(!s.art) s.art = []; return s; }
  return v51tGuest();
}
function v51tSave(){ try { if(typeof PROF !== 'undefined' && PROF) saveProfile(); else localStorage.setItem('truong-v51t-guest', JSON.stringify(v51tGuest())); } catch(e){} }
function v51tToday(){ const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
// sao của bài id ở cấp lv (0..3)
function v51tStars(id, lv){ const s = v51tState(); return ((s.st[id] || {})[lv]) || 0; }
function v51tUnlocked(id){ const s = v51tState(); return Math.max(1, s.lv[id] || 1); }       // cấp cao nhất đã mở
function v51tTotalStars(id){ const s = v51tState(), o = s.st[id] || {}; let n = 0; for(const k in o) n += o[k]; return n; }

// ---------- 3. thưởng: $1–$20, EXP 8–40 mỗi lượt; từ lượt 11 trong ngày còn một nửa ----------
function v51tReward(id, perf, name){
  perf = Math.max(0, Math.min(1, perf || 0)); const s = v51tState(), t = v51tToday(); if(s.day.d !== t) s.day = {d:t, n:{}}; s.day.n[id] = (s.day.n[id] || 0) + 1;
  let money = Math.max(1, Math.min(20, Math.round(1 + perf*19))), exp = Math.round(8 + perf*32); if(s.day.n[id] > 10){ money = Math.max(1, Math.round(money/2)); exp = Math.round(exp/2); }
  let ok = false; try { if(typeof PROF !== 'undefined' && PROF){ reward(exp, money, name || 'Trường Tin học', true); ok = true; } else if(typeof loginNudge === 'function') loginNudge(); } catch(e){}
  v51tSave(); return {money, exp, ok};
}
// ---------- 4. kỷ lục (máy này) ----------
function v51tLB(){ if(V51T.lb) return V51T.lb; try { V51T.lb = JSON.parse(localStorage.getItem('truong-v51t-lb') || '{}') || {}; } catch(e){ V51T.lb = {}; } return V51T.lb; }
function v51tLBAdd(id, score){
  const L = v51tLB(), n = (typeof PROF !== 'undefined' && PROF && PROF.name) || 'Khách', a = L[id] = L[id] || [];
  a.push({n, s:Math.round(score), d:v51tToday()}); a.sort((x, y) => y.s - x.s); a.length = Math.min(a.length, 5);
  try { localStorage.setItem('truong-v51t-lb', JSON.stringify(L)); } catch(e){}
  const s = v51tState(), best = s.best[id] || 0, rec = score > best; if(rec){ s.best[id] = Math.round(score); v51tSave(); } return {rec, best:Math.max(best, Math.round(score)), top:a};
}

// ---------- 5. âm thanh (WebAudio, tạo bằng code, không file) ----------
function v51tSnd(k){
  try { if(typeof V39S !== 'undefined' && V39S.vol.sfx <= 0) return; ensureAC(); const t = AC.currentTime, out = typeof v39Bus === 'function' ? v39Bus() : AC.destination;
    const N = {tap:[1046, 1046, .05, 'square', .035], ok:[660, 1320, .22, 'triangle', .08], bad:[260, 190, .2, 'square', .04], step:[520, 620, .06, 'square', .03], pick:[880, 1760, .12, 'triangle', .07],
      win:[523, 1046, .45, 'triangle', .09], key:[1400, 1200, .03, 'square', .025], boot:[220, 880, .35, 'sawtooth', .03], beep:[1760, 1760, .07, 'sine', .05]}[k] || [700, 900, .1, 'sine', .05];
    const o = AC.createOscillator(), g = AC.createGain(); o.type = N[3]; o.frequency.setValueAtTime(N[0], t); o.frequency.exponentialRampToValueAtTime(N[1], t + N[2]);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(N[4], t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + N[2] + .04); o.connect(g); g.connect(out); o.start(t); o.stop(t + N[2] + .06);
    if(k === 'win'){ [659, 784, 1046].forEach((f, i) => { const o2 = AC.createOscillator(), g2 = AC.createGain(); o2.type = 'triangle'; o2.frequency.value = f; const s = t + .12*(i + 1); g2.gain.setValueAtTime(.0001, s); g2.gain.exponentialRampToValueAtTime(.06, s + .02); g2.gain.exponentialRampToValueAtTime(.0001, s + .3); o2.connect(g2); g2.connect(out); o2.start(s); o2.stop(s + .32); }); }
  } catch(e){}
}

// ---------- 6. chữ pixel: vẽ chữ nhỏ rồi phóng to không làm mịn (dùng cho biển hiệu, tiêu đề ngắn) ----------
function v51tPixText(s, col, scale, shadow){
  const key = s + col + scale + (shadow || ''); let c = V51T.px.get(key); if(c) return c;
  const m = document.createElement('canvas').getContext('2d'); m.font = "700 11px 'Be Vietnam Pro', Nunito, sans-serif"; const w = Math.ceil(m.measureText(s).width) + 2, h = 17;
  const a = document.createElement('canvas'); a.width = w; a.height = h; const g = a.getContext('2d'); g.font = m.font; g.textBaseline = 'top'; g.fillStyle = '#fff'; g.fillText(s, 1, 1);
  const im = g.getImageData(0, 0, w, h), d = im.data; for(let i = 3; i < d.length; i += 4) d[i] = d[i] > 96 ? 255 : 0; g.putImageData(im, 0, 0);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, w, h);
  c = document.createElement('canvas'); c.width = (w + 1)*scale; c.height = (h + 1)*scale; const o = c.getContext('2d'); o.imageSmoothingEnabled = false;
  if(shadow){ const sh = document.createElement('canvas'); sh.width = w; sh.height = h; const sg = sh.getContext('2d'); sg.drawImage(a, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = shadow; sg.fillRect(0, 0, w, h); o.drawImage(sh, scale, scale, w*scale, h*scale); }
  o.drawImage(a, 0, 0, w*scale, h*scale); V51T.px.set(key, c); return c;
}

// ---------- 7. người pixel (học sinh, cô giáo) dùng chung trong/ngoài trường ----------
// P = {skin, hair, shirt, pants, long, dir, walk, moving, sit, type, glasses}
function v51tKid(g, x, y, P, t){
  const mv = P.moving, ph = mv ? Math.floor(P.walk*1.5) % 6 : 0, lA = mv ? [0, 1, 2, 2, 1, 0][ph] : 0, lB = mv ? [2, 1, 0, 0, 1, 2][ph] : 0, by = mv && (ph === 1 || ph === 4) ? -1 : 0, s = P.sc || 1;
  g.save(); g.translate(Math.round(x), Math.round(y)); if(s !== 1) g.scale(s, s); if(P.dir < 0) g.scale(-1, 1); const R = (c, a, b, w, h) => { g.fillStyle = c; g.fillRect(a, b, w, h); };
  R('rgba(0,0,0,.22)', -8, -2, 16, 4);
  if(P.sit){ R(P.pants || '#34406b', -5, -10, 11, 4); R('#22222a', 4, -7, 3, 6); R(P.shirt, -6, -21, 12, 12); const tp = P.type ? (Math.floor(t*9 + (P.ph || 0)) % 2) : 0; R(P.skin, 5, -15 + tp, 4, 3); R(P.shirt, 3, -17, 4, 4); }
  else { R(P.pants || '#34406b', -5, -9, 4, 7 - lA); R(P.pants || '#34406b', 1, -9, 4, 7 - lB); R('#18181e', -5, -2 - lA, 4, 2); R('#18181e', 1, -2 - lB, 4, 2); R(P.shirt, -6, -21 + by, 12, 12); R(P.skin, -8, -19 + by, 2, 7); R(P.skin, 6, -19 + by, 2, 7); }
  const hy = (P.sit ? 0 : by);
  R(P.skin, -5, -31 + hy, 10, 10); R(P.hair, -6, -33 + hy, 12, 4); if(P.long){ R(P.hair, -6, -31 + hy, 2, 11); R(P.hair, 4, -31 + hy, 2, 11); } else R(P.hair, -6, -31 + hy, 2, 4);
  R('#1a1a22', 1, -27 + hy, 2, 2); R('#1a1a22', -3, -27 + hy, 2, 2); if(P.glasses){ R('#1a1a22', -4, -28 + hy, 8, 1); }
  if(P.back){ R(P.hair, -6, -33 + hy, 12, 11); if(P.long) R(P.hair, -6, -24 + hy, 12, 4); }
  if(P.badge) R(P.badge, -4, -18 + by, 3, 3);
  g.restore();
}
const V51T_SKIN = ['#f1c27d', '#e0ac69', '#ffdbac', '#c68642', '#f6d0a8'];
const V51T_HAIR = ['#2a1a10', '#3a2a1a', '#1a1a1a', '#5a3a1a', '#7a4a20'];
const V51T_SHIRT = ['#3d7bff', '#ef4b4b', '#2fbf71', '#ffd23f', '#ff8a2b', '#9b6bff', '#28b5c8', '#f472b6'];
const V51T_NAMES = ['An', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hà', 'Khoa', 'Lan', 'Minh', 'Ngọc', 'Phúc', 'Quỳnh', 'Sơn', 'Thảo', 'Uyên', 'Vy'];
function v51tRandKid(i){ return {skin:V51T_SKIN[i % 5], hair:V51T_HAIR[(i*3) % 5], shirt:V51T_SHIRT[(i*5) % 8], pants:i % 3 ? '#34406b' : '#4a3a2a', long:i % 2 === 1, dir:1, walk:0, moving:false, ph:i*1.7, name:V51T_NAMES[i % V51T_NAMES.length], glasses:i % 5 === 2}; }

// ---------- 8. thời khoá biểu: giờ học (giờ game) ----------
function v51tClass(){ const c = typeof clock === 'number' ? clock : 600; return (c >= 450 && c < 690) || (c >= 810 && c < 990); }      // 7:30–11:30 · 13:30–16:30
function v51tNightK(){ const c = typeof clock === 'number' ? clock : 600; return typeof v25Ramp === 'function' ? v25Ramp(c, 1080, 330) : (c >= 1080 || c < 330 ? 1 : 0); }
function v51tPeriod(){ const c = typeof clock === 'number' ? clock : 600;
  if(c < 450) return ['🌙', 'Trường chưa mở cửa', 'Opens 7:30']; if(c < 690){ const p = Math.floor((c - 450)/60); return ['💻', 'Tiết ' + (p + 1) + ': ' + ['Lập trình khối', 'Số nhị phân', 'Gõ phím nhanh', 'Robot & thuật toán'][p], 'Class time']; }
  if(c < 810) return ['🍱', 'Nghỉ trưa · chơi robot ở sân', 'Lunch break']; if(c < 990){ const p = Math.floor((c - 810)/60); return ['💻', 'Tiết ' + (p + 5) + ': ' + ['Vẽ pixel', 'An toàn trên mạng', 'Tìm lỗi (debug)'][Math.min(2, p)], 'Class time']; }
  if(c < 1140) return ['🤖', 'Câu lạc bộ robot sau giờ học', 'Robot club']; return ['🌙', 'Tối rồi · phòng máy đóng cửa', 'Closed']; }

// ---------- 9. danh sách bài học (mini game) ----------
const V51T_GAMES = {};       // các file v51t-games*.js điền vào
const V51T_LESSONS = [
  {id:'blocks', icon:'🧩', vi:'Lập trình khối', en:'Block Coding', lv:8},
  {id:'rubik', icon:'🧊', vi:'Thuật toán Rubik', en:'Cube Algorithm', lv:6},
  {id:'binary', icon:'💡', vi:'Số nhị phân', en:'Binary Numbers', lv:6},
  {id:'pixel', icon:'🎨', vi:'Vẽ pixel theo toạ độ', en:'Pixel Grid Art', lv:6},
  {id:'typing', icon:'⌨️', vi:'Gõ phím nhanh', en:'Fast Typing', lv:5},
  {id:'debug', icon:'🐞', vi:'Tìm lỗi (debug)', en:'Bug Hunt', lv:6},
  {id:'safety', icon:'🛡️', vi:'An toàn trên mạng', en:'Online Safety', lv:4}
];
function v51tLesson(id){ return V51T_LESSONS.find(l => l.id === id); }
