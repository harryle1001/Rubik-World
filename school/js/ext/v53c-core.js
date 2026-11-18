// ================= v53c · THÀNH PHỐ AN TOÀN 1/6: lõi — vị trí khu, lưu, cài đặt, huy hiệu, âm thanh, sprite xe =================
// Trạm cứu hỏa (114) · Đồn cảnh sát (113) · Tháp Rubik 81 (thiết kế gốc, tên riêng của game). Mọi tên toàn cục có tiền tố v53c / V53C.
// Khu vẽ thẳng trên đảo tròn v46 (toạ độ mới), lưu trong V46L.zones.* với cờ v53c để chế độ 🧩 Sắp xếp (v48) dời được; v46Build bỏ qua.
const V53C_PHI = 1.618033988749895;
const V53C_SEA = 11000;                       // máy bay bay được tới bán kính này (đảo 5200)
// khung khu (tỷ lệ vàng): rộng W, sâu H = W/φ; toà nhà rộng W/φ, sâu (W/φ)/φ
const V53C_Z = {
  fire:    {x:3500,  y:-1900, W:620, H:383, ic:'🚒', vi:'Trạm cứu hỏa', en:'Fire Station'},
  police:  {x:-3700, y:1300,  W:620, H:383, ic:'🚓', vi:'Đồn cảnh sát', en:'Police Station'},
  tower81: {x:-60,   y:1560,  W:486, H:300, ic:'🏙️', vi:'Tháp Rubik 81', en:'Rubik Tower 81'}
};
const V53C = {spr:{}, geo:{}, gk:{}, G:null, set:null, mode:'', veh:{}, fires:[], drops:[], puffs:[], ui:{}, k:{}, stick:{x:0, y:0}, msgT:0, t:0, fps:60, fpsN:0, fpsT:0, near:'', snd:{}};

// ---------- 0. đăng ký khu trên đảo (chạy lúc nạp file, TRƯỚC v46Init) ----------
for(const id in V53C_Z){ const z = V53C_Z[id]; V46L.zones[id] = {x:z.x, y:z.y, v53c:1};
  if(typeof V48M !== 'undefined'){ V48M.def[id] = [z.x, z.y]; try { const s = v48mLoad(); const p = s && s[id]; if(Array.isArray(p) && isFinite(p[0]) && isFinite(p[1])){ V46L.zones[id].x = Math.round(p[0]); V46L.zones[id].y = Math.round(p[1]); } } catch(e){} } }
const v53cBuild0 = v46Build;
v46Build = function(){ const Z = V46L.zones, keep = {}; for(const k in Z) if(Z[k] && Z[k].v53c){ keep[k] = Z[k]; delete Z[k]; }
  try { return v53cBuild0.apply(this, arguments); } finally { Object.assign(Z, keep); } };
if(typeof v48mFoot === 'function'){
  const f0 = v48mFoot; v48mFoot = function(){ const F = f0(); for(const id in V53C_Z){ const z = V53C_Z[id], e = [-z.W/2, -z.H/2, z.W/2, z.H/2]; F[id] = {e, r:e.slice()}; } return F; };
  const t0 = v48mThumbs; v48mThumbs = function(F){ const G = Object.assign({}, F); for(const id in V53C_Z) delete G[id]; const T = t0(G); for(const id in V53C_Z){ try { T[id] = v53cThumb(id); } catch(e){} } return T; };
  const n0 = v48mName; v48mName = function(id){ const z = V53C_Z[id]; return z ? [z.ic, z.vi] : n0(id); };
}

// ---------- 1. hình học (toạ độ đảo mới) ----------
function v53cGeo(id){
  const z = V46L.zones[id], k = z.x + ',' + z.y; if(V53C.geo[id] && V53C.gk[id] === k) return V53C.geo[id];
  const D = V53C_Z[id], P = V53C_PHI, cx = V46L.CX + z.x, cy = V46L.CY + z.y, x0 = cx - D.W/2, y0 = cy - D.H/2;
  const bw = Math.round(D.W/P), bh = Math.round(bw/P);
  const G = {id, cx, cy, x0, y0, x1:x0 + D.W, y1:y0 + D.H, W:D.W, H:D.H, bw, bh, gy:y0 + bh};
  if(id === 'tower81'){                                             // bục đế rộng cả khung, sâu H/φ; tháp đứng giữa bục
    G.bw = D.W; G.bh = Math.round(D.H/P); G.gy = y0 + G.bh; G.b = {x0, y0, x1:x0 + D.W, y1:G.gy}; G.door = [cx, G.gy];
    G.tw = 308; G.th = 1000;                                        // tháp: 7 cột bó tre, cao 1000 (đỉnh nhìn từ xa)
  } else {
    G.b = {x0, y0, x1:x0 + bw, y1:G.gy};
    G.door = id === 'fire' ? [x0 + Math.round(bw/P/2), G.gy] : [x0 + Math.round(bw/2), G.gy];
    G.side = {x0:x0 + bw, y0, x1:x0 + D.W, y1:y0 + D.H};            // phần bên phải rộng W − W/φ
    G.park = id === 'fire' ? [x0 + Math.round(bw/P/2), G.gy + 70] : [G.side.x0 + Math.round((D.W - bw)/2), G.gy + 70];   // chỗ đậu xe trước cửa
  }
  G.exit = [G.door[0], G.y1 + 26];
  V53C.geo[id] = G; V53C.gk[id] = k; return G;
}
const v53cIds = () => Object.keys(V53C_Z);

// ---------- 2. lưu & cài đặt ----------
function v53cDef(){ return {badges:{}, fires:0, helps:0, deck:0, em:0, day:{d:'', n:{}}, best:{}}; }
function v53cState(){
  if(typeof PROF !== 'undefined' && PROF){ if(!PROF.v53c) PROF.v53c = v53cDef(); const s = PROF.v53c; if(!s.badges) s.badges = {}; if(!s.day) s.day = {d:'', n:{}}; if(!s.best) s.best = {}; return s; }
  if(!V53C.G){ let g = null; try { g = JSON.parse(localStorage.getItem('truong-v53c-guest') || 'null'); } catch(e){} V53C.G = Object.assign(v53cDef(), g || {}); } return V53C.G;
}
function v53cSave(){ try { if(typeof PROF !== 'undefined' && PROF) saveProfile(); else localStorage.setItem('truong-v53c-guest', JSON.stringify(v53cState())); } catch(e){} }
function v53cSet(){ if(V53C.set) return V53C.set; let s = null; try { s = JSON.parse(localStorage.getItem('truong-v53c-set') || 'null'); } catch(e){} V53C.set = Object.assign({inc:true}, s || {}); return V53C.set; }
function v53cSetSave(){ try { localStorage.setItem('truong-v53c-set', JSON.stringify(v53cSet())); } catch(e){} }
function v53cToday(){ const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
// thưởng $1–$20, EXP 8–40; từ lượt 11 trong ngày còn một nửa
function v53cReward(id, perf, why){
  perf = Math.max(0, Math.min(1, perf || 0)); const s = v53cState(), t = v53cToday(); if(s.day.d !== t) s.day = {d:t, n:{}}; s.day.n[id] = (s.day.n[id] || 0) + 1;
  let money = Math.max(1, Math.min(20, Math.round(1 + perf*19))), exp = Math.round(8 + perf*32); if(s.day.n[id] > 10){ money = Math.max(1, Math.round(money/2)); exp = Math.round(exp/2); }
  try { if(typeof PROF !== 'undefined' && PROF) reward(exp, money, why || 'Thành phố an toàn', true); else if(typeof loginNudge === 'function') loginNudge(); } catch(e){}
  v53cSave(); return {money, exp};
}
const V53C_BADGES = {
  calm:   {ic:'🎖️', vi:'Phi công bình tĩnh', en:'Calm Pilot', why:'Xử lý sự cố động cơ đúng các bước và hạ cánh an toàn.'},
  fire:   {ic:'🧯', vi:'Lính cứu hỏa nhí', en:'Junior Firefighter', why:'Dập tắt đám cháy trong mini game.'},
  police: {ic:'🛡️', vi:'Cảnh sát tốt bụng', en:'Kind Officer', why:'Hoàn thành nhiệm vụ giúp đỡ người dân.'},
  sky:    {ic:'🔭', vi:'Người ngắm đảo', en:'Sky Watcher', why:'Lên đài quan sát tầng 81 của Tháp Rubik.'},
  call:   {ic:'📞', vi:'Nhớ số khẩn cấp', en:'Emergency Numbers', why:'Trả lời đúng hết bài 113 · 114 · 115.'}
};
function v53cBadge(id){
  const s = v53cState(), b = V53C_BADGES[id]; if(!b || s.badges[id]) return false; s.badges[id] = v53cToday(); v53cSave();
  try { v53cSnd('win'); } catch(e){} v53cPop(b.ic, 'Huy hiệu mới: ' + b.vi, b.why); return true;
}
// thông báo lớn giữa màn hình (huy hiệu)
function v53cPop(ic, t, sub){
  let d = document.getElementById('v53cPop'); if(!d){ d = document.createElement('div'); d.id = 'v53cPop'; (document.getElementById('stage') || document.body).appendChild(d); }
  d.innerHTML = '<i>' + ic + '</i><b>' + v53cEsc(t) + '</b><span>' + v53cEsc(sub || '') + '</span>'; d.hidden = false; d.classList.remove('go'); void d.offsetWidth; d.classList.add('go');
  clearTimeout(V53C.popT); V53C.popT = setTimeout(() => { d.hidden = true; }, 4200);
}
function v53cEsc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c])); }
function v53cMsg(t, sec){ const m = document.getElementById('v53cMsg'); if(m){ m.textContent = t; m.hidden = false; V53C.msgT = realT + (sec || 3.5); } else toast(t); }

// ---------- 3. âm thanh (WebAudio, tạo bằng code) ----------
function v53cVol(){ return (typeof V39S !== 'undefined' && V39S.vol) ? V39S.vol.sfx : .8; }
function v53cSnd(k, v){
  try { if(v53cVol() <= 0 || typeof ensureAC !== 'function') return; ensureAC(); if(!AC) return; const t = AC.currentTime, out = typeof v39Bus === 'function' ? v39Bus() : AC.destination, a = (v == null ? 1 : v)*v53cVol();
    const N = {tap:[1046, 1046, .05, 'square', .03], ok:[660, 1320, .22, 'triangle', .08], bad:[300, 200, .2, 'sine', .05], win:[523, 1046, .45, 'triangle', .09], pick:[880, 1760, .12, 'triangle', .07],
      chime:[988, 740, .35, 'sine', .07], spray:[300, 280, .12, 'sawtooth', .012], ding:[1318, 1318, .25, 'sine', .06], horn:[392, 392, .3, 'square', .04]}[k] || [700, 900, .1, 'sine', .05];
    const o = AC.createOscillator(), g = AC.createGain(); o.type = N[3]; o.frequency.setValueAtTime(N[0], t); o.frequency.exponentialRampToValueAtTime(N[1], t + N[2]);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, N[4]*a), t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + N[2] + .04); o.connect(g); g.connect(out); o.start(t); o.stop(t + N[2] + .06);
    if(k === 'win') [659, 784, 1046].forEach((f, i) => { const o2 = AC.createOscillator(), g2 = AC.createGain(); o2.type = 'triangle'; o2.frequency.value = f; const s = t + .12*(i + 1); g2.gain.setValueAtTime(.0001, s); g2.gain.exponentialRampToValueAtTime(.06*a, s + .02); g2.gain.exponentialRampToValueAtTime(.0001, s + .3); o2.connect(g2); g2.connect(out); o2.start(s); o2.stop(s + .32); });
  } catch(e){}
}
// còi xe (hú lên xuống) — một bộ dao động cho mỗi xe, âm lượng theo khoảng cách tới camera
function v53cSiren(id, on, vol){
  const S = V53C.snd; try {
    if(!on || vol <= .001 || v53cVol() <= 0 || document.hidden){ if(S[id]){ const s = S[id]; S[id] = null; const t = AC.currentTime; s.g.gain.setTargetAtTime(0, t, .1); s.o.stop(t + .5); s.l.stop(t + .5); } return; }
    if(typeof ensureAC !== 'function') return; ensureAC(); if(!AC) return; const t = AC.currentTime;
    if(!S[id]){ const o = AC.createOscillator(), l = AC.createOscillator(), lg = AC.createGain(), g = AC.createGain(), f = AC.createBiquadFilter(), out = typeof v39Bus === 'function' ? v39Bus() : AC.destination;
      o.type = 'triangle'; o.frequency.value = id === 'police' ? 760 : 680; l.type = id === 'police' ? 'square' : 'sine'; l.frequency.value = id === 'police' ? 1.6 : .45; lg.gain.value = id === 'police' ? 160 : 260; f.type = 'lowpass'; f.frequency.value = 1800; g.gain.value = 0;
      l.connect(lg); lg.connect(o.frequency); o.connect(f); f.connect(g); g.connect(out); o.start(t); l.start(t); S[id] = {o, l, g}; }
    S[id].g.gain.setTargetAtTime(.028*vol*v53cVol(), t, .2);
  } catch(e){}
}
// chuông báo sự cố trong buồng lái (hai nốt, lặp)
function v53cCaution(){ v53cSnd('chime', .9); setTimeout(() => v53cSnd('ding', .7), 260); }

// ---------- 4. sprite xe nhìn từ trên xuống, mũi sang phải (vẽ một lần, cache) ----------
function v53cCv(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }
function v53cCarSpr(kind){
  if(V53C.spr['car' + kind]) return V53C.spr['car' + kind];
  const fire = kind === 'fire', W = fire ? 76 : 56, H = fire ? 34 : 28, [c, g] = v53cCv(W, H), R = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  R('rgba(0,0,0,.25)', 3, 4, W - 4, H - 4);                                   // bóng
  R('#1c1d24', 6, 1, 12, 4); R('#1c1d24', 6, H - 5, 12, 4); R('#1c1d24', W - 20, 1, 12, 4); R('#1c1d24', W - 20, H - 5, 12, 4); if(fire){ R('#1c1d24', 26, 1, 12, 4); R('#1c1d24', 26, H - 5, 12, 4); }
  if(fire){
    R('#c8221b', 2, 4, W - 4, H - 8); R('#e8372c', 2, 4, W - 4, 3); R('#8f1611', 2, H - 7, W - 4, 3);
    R('#f2f2f2', 4, H/2 - 1, W - 22, 2);                                       // sọc phản quang
    R('#d8dbe2', 6, 9, 44, 4); R('#d8dbe2', 6, H - 13, 44, 4); for(let x = 8; x < 50; x += 6) R('#9aa0ad', x, 9, 2, H - 18);   // thang trên nóc
    R('#5a5e6a', 48, 11, 6, H - 22);                                          // bệ xoay thang
    R('#b5191a', W - 20, 5, 16, H - 10); R('#7fd0ff', W - 9, 7, 5, H - 14); R('#4aa3d8', W - 7, 8, 2, H - 16);   // cabin + kính
    R('#ffd23f', W - 4, 6, 2, 4); R('#ffd23f', W - 4, H - 10, 2, 4);           // đèn pha
    R('#3a6fd8', W - 22, 7, 3, H - 14); R('#ef3030', W - 22, H/2 - 1, 3, 2);  // giá đèn
    R('#ffffff', 14, 6, 26, 2);                                                // cuộn vòi trắng
  } else {
    R('#f4f6fb', 2, 4, W - 4, H - 8); R('#ffffff', 2, 4, W - 4, 2); R('#c9ced8', 2, H - 6, W - 4, 2);
    R('#1f4fbf', 10, 4, 30, 4); R('#1f4fbf', 10, H - 8, 30, 4);                // sọc xanh hai bên
    R('#22283a', W - 26, 7, 14, H - 14); R('#7fd0ff', W - 24, 8, 4, H - 16); R('#7fd0ff', W - 16, 8, 3, H - 16);   // kính trước + nóc
    R('#22283a', 8, 7, 8, H - 14);                                             // kính sau
    R('#dfe3ea', 18, 7, W - 46, H - 14);                                       // nóc
    R('#ffd23f', W - 4, 5, 2, 4); R('#ffd23f', W - 4, H - 9, 2, 4); R('#ef3030', 2, 5, 2, 3); R('#ef3030', 2, H - 8, 2, 3);
  }
  V53C.spr['car' + kind] = c; return c;
}
// quầng sáng tròn (dùng chung cho đèn xe, đèn tháp, lửa)
function v53cGlow(col){
  const k = 'g' + col; if(V53C.spr[k]) return V53C.spr[k]; const [c, g] = v53cCv(32, 32), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, col); gr.addColorStop(.35, col.replace(/[\d.]+\)$/, '.45)')); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); V53C.spr[k] = c; return c;
}
// cụm khói xám mềm
function v53cPuffSpr(dark){
  const k = 'puff' + (dark ? 'd' : 'l'); if(V53C.spr[k]) return V53C.spr[k]; const [c, g] = v53cCv(32, 32), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16), col = dark ? '70,70,78' : '200,204,212';
  gr.addColorStop(0, 'rgba(' + col + ',1)'); gr.addColorStop(.6, 'rgba(' + col + ',.55)'); gr.addColorStop(1, 'rgba(' + col + ',0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); V53C.spr[k] = c; return c;
}
// ngọn lửa pixel (4 khung hình), cache
function v53cFlameSpr(f){
  const k = 'fl' + f; if(V53C.spr[k]) return V53C.spr[k]; const [c, g] = v53cCv(24, 32), sh = [[0, 0, 0, 0], [1, -1, 0, 1], [0, 1, -1, 0], [-1, 0, 1, -1]][f];
  const L = (col, pts) => { g.fillStyle = col; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill(); };
  L('#e8361d', [[2, 31], [4, 18 + sh[0]], [8, 12], [9 + sh[1], 3], [13, 11], [16 + sh[2], 5], [18, 15], [22, 20 + sh[3]], [22, 31]]);
  L('#ff8a1e', [[5, 31], [7, 21], [10, 16 + sh[0]], [12, 9], [14, 17], [17, 13 + sh[2]], [19, 22], [19, 31]]);
  L('#ffd23f', [[8, 31], [9, 24], [12, 18 + sh[1]], [14, 24], [16, 21], [16, 31]]);
  L('#fff6c8', [[10, 31], [11, 27], [12, 24], [13, 27], [14, 31]]);
  V53C.spr[k] = c; return c;
}

// ---------- 5. người pixel đội mũ (lính cứu hỏa, cảnh sát) dựa trên v51tKid ----------
function v53cCrew(g, x, y, kind, dir, walk, moving, t){
  const P = kind === 'fire' ? {skin:'#f1c27d', hair:'#2a1a10', shirt:'#2b2f3a', pants:'#2b2f3a', badge:'#ffd23f'} : {skin:'#e0ac69', hair:'#1a1a1a', shirt:'#2f62c9', pants:'#1d2c55', badge:'#ffd23f'};
  P.dir = dir; P.walk = walk || 0; P.moving = !!moving; if(typeof v51tKid === 'function') v51tKid(g, x, y, P, t);
  g.save(); g.translate(Math.round(x), Math.round(y)); if(dir < 0) g.scale(-1, 1);
  if(kind === 'fire'){ g.fillStyle = '#ffd23f'; g.fillRect(-7, -36, 14, 5); g.fillRect(-8, -32, 16, 2); g.fillStyle = '#c8221b'; g.fillRect(-2, -37, 4, 3); g.fillStyle = '#e8e23a'; g.fillRect(-6, -14, 12, 2); }
  else { g.fillStyle = '#1d2c55'; g.fillRect(-6, -36, 12, 4); g.fillRect(-7, -32, 15, 2); g.fillStyle = '#ffd23f'; g.fillRect(-1, -35, 2, 2); }
  g.restore();
}
