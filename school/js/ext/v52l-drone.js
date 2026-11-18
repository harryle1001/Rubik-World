// ================= v52 · FLYCAM "CHUỒN CHUỒN RB-1" — CHỈ DÀNH CHO CHỦ GAME =================
// Bay tự do khắp đảo, zoom xa/gần, bám theo NPC hoặc người chơi online, chụp ảnh, điều phối (gọi NPC tới một chỗ, bật/tắt sự kiện, đổi giờ).
// Quyền: mọi hàm đều kiểm tra OWNER.is (không chỉ ẩn nút). Điện thoại: vuốt để bay, chụm 2 ngón để zoom. Máy tính: WASD/mũi tên, Q/E, F, P, Esc.
const V52LD_NAME = 'Chuồn Chuồn RB-1';
const V52LD = {on:false, el:null, fc:null, fg:null, W:0, H:0, dpr:1, raf:0, last:0, ptrs:new Map(), pinch:null, vx:0, vy:0, keys:{}, follow:null, sel:null, call:null, mark:null, bat:100, t0:0,
  hum:null, fpsN:0, fpsT:0, fps:0, z0:1, heading:0, pop:null, flash:0, shots:0};
function v52ldOK(){ return typeof OWNER !== 'undefined' && OWNER && OWNER.is === true; }

// ---------- nút (chỉ hiện với chủ game; kiểm tra lại mỗi giây vì quyền chủ game đến sau) ----------
function v52ldBtnSync(){
  let b = document.getElementById('v52ldBtn'); const ok = v52ldOK() && typeof PLAYER !== 'undefined' && !(typeof V50 !== 'undefined' && V50.open);
  if(!ok){ if(b) b.remove(); if(V52LD.on && !v52ldOK()) v52ldClose(); return; }
  if(!b){ b = document.createElement('button'); b.type = 'button'; b.id = 'v52ldBtn'; b.innerHTML = '<span>🚁</span><small>Flycam</small>'; b.title = 'Flycam của chủ game (phím V)'; b.setAttribute('aria-label', 'Mở flycam chủ game'); b.onclick = () => v52ldOpen(); (document.getElementById('stage') || document.body).appendChild(b); }
  b.hidden = V52LD.on;
}

// ---------- mở / đóng ----------
function v52ldEl(){
  if(V52LD.el) return V52LD.el; const E = document.createElement('div'); E.id = 'v52ld'; E.hidden = true;
  E.innerHTML = '<canvas class="fr" aria-hidden="true"></canvas>' +
    '<div class="v52ld-top"><div class="l"><b>🚁 ' + V52LD_NAME + '</b><span class="rec">● REC</span></div><div class="c"><span class="alt"></span><span class="bat"></span><span class="tm"></span></div><div class="r"><button type="button" class="hb" aria-label="Hướng dẫn">?</button><button type="button" class="xb" aria-label="Hạ cánh, thoát flycam">✕</button></div></div>' +
    '<div class="v52ld-chip" hidden></div><div class="v52ld-pop" hidden></div>' +
    '<div class="v52ld-help" hidden><h3>🚁 Lái flycam</h3><p>📱 Vuốt 1 ngón để bay · chụm/mở 2 ngón để zoom · chạm vào NPC để chọn.</p><p>⌨️ WASD / mũi tên: bay · Q/E hoặc −/+: zoom · F: bám theo · P: chụp ảnh · Esc: hạ cánh.</p><p>📣 <b>Gọi</b>: chạm NPC rồi chạm chỗ muốn gọi họ tới.</p><button type="button" class="primary ok">Đã hiểu</button></div>' +
    '<div class="v52ld-bar" role="toolbar" aria-label="Điều khiển flycam">' +
    [['zone', '🗺', 'Khu'], ['follow', '👁', 'Bám'], ['shot', '📸', 'Chụp'], ['call', '📣', 'Gọi'], ['event', '🎉', 'Sự kiện'], ['time', '🕒', 'Giờ'], ['zo', '➖', 'Xa'], ['zi', '➕', 'Gần']].map(([k, i, n]) => `<button type="button" data-k="${k}"><span>${i}</span><i>${n}</i></button>`).join('') + '</div>' +
    '<div class="v52ld-flash"></div><img class="v52ld-thumb" alt="Ảnh vừa chụp" hidden>';
  document.body.appendChild(E); V52LD.el = E; V52LD.fc = E.querySelector('canvas.fr'); V52LD.fg = V52LD.fc.getContext('2d');
  E.querySelector('.xb').onclick = () => v52ldClose(); E.querySelector('.hb').onclick = () => { const h = E.querySelector('.v52ld-help'); h.hidden = !h.hidden; }; E.querySelector('.v52ld-help .ok').onclick = () => { E.querySelector('.v52ld-help').hidden = true; };
  E.querySelectorAll('.v52ld-bar button').forEach(b => b.onclick = e => { e.stopPropagation(); v52ldAct(b.dataset.k); });
  v52ldInput(E); return E;
}
function v52ldOpen(){
  if(!v52ldOK()){ return false; }                                           // người chơi thường: không gọi được
  if(V52LD.on || typeof cam === 'undefined') return false; if(typeof V52LC !== 'undefined' && V52LC.open) return false;
  try { if(typeof openModal !== 'undefined' && openModal) hideModal(); } catch(e){}
  const E = v52ldEl(); V52LD.on = true; V52LD.z0 = cam.z; V52LD.fc0 = typeof followCam !== 'undefined' ? followCam : true; V52LD.follow = null; V52LD.sel = null; V52LD.call = null; V52LD.mark = null; V52LD.vx = V52LD.vy = 0; V52LD.t0 = performance.now(); V52LD.bat = 100;
  try { followCam = false; if(typeof keys !== 'undefined') keys.up = keys.down = keys.left = keys.right = false; } catch(e){}
  E.hidden = false; document.body.classList.add('v52ld-on'); E.querySelector('.v52ld-pop').hidden = true; V52LD.callMode = false; E.querySelector('[data-k="call"]').classList.remove('on'); v52ldChip(); v52ldResize(); v52ldHum(1); V52LD.last = performance.now(); cancelAnimationFrame(V52LD.raf); V52LD.raf = requestAnimationFrame(v52ldFrame);
  try { log('info', 'Chủ game cất cánh flycam ' + V52LD_NAME + '.'); } catch(e){} v52ldBtnSync(); return true;
}
function v52ldClose(){
  if(!V52LD.on) return; V52LD.on = false; cancelAnimationFrame(V52LD.raf); v52ldHum(0); if(V52LD.el) V52LD.el.hidden = true; document.body.classList.remove('v52ld-on'); V52LD.ptrs.clear(); V52LD.pinch = null;
  try { cam.z = V52LD.z0; if(typeof PLAYER !== 'undefined' && PLAYER && PLAYER.visible){ followCam = true; const p = v46Pos(PLAYER); cam.x = p[0]; cam.y = p[1]; } else followCam = V52LD.fc0; clampCam(); } catch(e){}
  v52ldBtnSync();
}
function v52ldResize(){ if(!V52LD.on) return; const dpr = Math.min(2, window.devicePixelRatio || 1); V52LD.dpr = dpr; V52LD.W = innerWidth; V52LD.H = innerHeight; V52LD.fc.width = Math.round(V52LD.W*dpr); V52LD.fc.height = Math.round(V52LD.H*dpr); }

// ---------- tiếng cánh quạt: 2 sóng răng cưa lệch nhịp nhẹ qua bộ lọc thấp, rất nhỏ ----------
function v52ldHum(on){
  try {
    if(!on){ if(V52LD.hum){ const h = V52LD.hum; h.g.gain.setTargetAtTime(0, AC.currentTime, .08); setTimeout(() => { try { h.o1.stop(); h.o2.stop(); } catch(e){} }, 400); V52LD.hum = null; } return; }
    if(V52LD.hum || (typeof V39S !== 'undefined' && V39S.vol && V39S.vol.sfx <= 0)) return; ensureAC(); const o1 = AC.createOscillator(), o2 = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
    o1.type = o2.type = 'sawtooth'; o1.frequency.value = 172; o2.frequency.value = 176.5; f.type = 'lowpass'; f.frequency.value = 700; g.gain.value = 0; o1.connect(f); o2.connect(f); f.connect(g); g.connect(typeof v39Bus === 'function' ? v39Bus() : AC.destination);
    o1.start(); o2.start(); g.gain.setTargetAtTime(.012, AC.currentTime, .3); V52LD.hum = {o1, o2, f, g};
  } catch(e){}
}
function v52ldClick(){ try { ensureAC(); const t = AC.currentTime, n = AC.createBufferSource(), b = AC.createBuffer(1, 2400, AC.sampleRate), d = b.getChannelData(0); for(let i = 0; i < d.length; i++) d[i] = (Math.random()*2 - 1)*(1 - i/d.length); n.buffer = b; const g = AC.createGain(); g.gain.value = .12; n.connect(g); g.connect(typeof v39Bus === 'function' ? v39Bus() : AC.destination); n.start(t); } catch(e){} }

// ---------- vòng bay ----------
function v52ldFrame(now){
  if(!V52LD.on) return; if(!v52ldOK()){ v52ldClose(); return; } V52LD.raf = requestAnimationFrame(v52ldFrame);
  const dt = Math.min(.05, (now - V52LD.last)/1000); V52LD.last = now; V52LD.fpsN++; if(now - V52LD.fpsT > 1000){ V52LD.fps = V52LD.fpsN*1000/(now - V52LD.fpsT); V52LD.fpsN = 0; V52LD.fpsT = now; }
  try { followCam = false; } catch(e){}
  const K = V52LD.keys, sp = 620/cam.z; let ax = (K.d || K.ArrowRight ? 1 : 0) - (K.a || K.ArrowLeft ? 1 : 0), ay = (K.s || K.ArrowDown ? 1 : 0) - (K.w || K.ArrowUp ? 1 : 0);
  if(ax || ay){ V52LD.follow = null; const l = Math.hypot(ax, ay); V52LD.vx = ax/l*sp; V52LD.vy = ay/l*sp; }
  else if(!V52LD.ptrs.size){ const f = Math.pow(.04, dt); V52LD.vx *= f; V52LD.vy *= f; }                    // quán tính, trôi nhẹ rồi dừng
  if(!V52LD.ptrs.size || ax || ay){ cam.x += V52LD.vx*dt; cam.y += V52LD.vy*dt; }
  if(K.q || K['-']) v52ldZoom(Math.pow(.4, dt)); if(K.e || K['=']) v52ldZoom(Math.pow(2.5, dt));
  const F = v52ldTarget(V52LD.follow); if(F){ const k = 1 - Math.pow(.02, dt); cam.x += (F[0] - cam.x)*k; cam.y += (F[1] - 20 - cam.y)*k; } else if(V52LD.follow) V52LD.follow = null;
  try { clampCam(); } catch(e){}
  if(Math.abs(V52LD.vx) + Math.abs(V52LD.vy) > 5) V52LD.heading = Math.atan2(V52LD.vx, -V52LD.vy);
  V52LD.bat = Math.max(5, 100 - (now - V52LD.t0)/1000/12);                                                    // pin trang trí: ~1% mỗi 12 giây, không ép hạ cánh
  if(V52LD.hum){ const s = Math.min(1, (Math.abs(V52LD.vx) + Math.abs(V52LD.vy))*cam.z/700); V52LD.hum.o1.frequency.setTargetAtTime(172 + s*40, AC.currentTime, .2); V52LD.hum.o2.frequency.setTargetAtTime(176.5 + s*42, AC.currentTime, .2); }
  if(V52LD.flash > 0){ V52LD.flash -= dt; }
  v52ldDrawFrame(now/1000); if(!V52LD.hudT || now - V52LD.hudT > 120){ V52LD.hudT = now; v52ldHud(); }
}
function v52ldZoom(k, sx, sy){
  const W = V52LD.W, H = V52LD.H, ox = sx == null ? W/2 : sx, oy = sy == null ? H/2 : sy, wx = cam.x + (ox - W/2)/cam.z, wy = cam.y + (oy - H/2)/cam.z;
  cam.z = Math.max(.05, Math.min(3, cam.z*k)); try { clampCam(); } catch(e){} cam.x = wx - (ox - W/2)/cam.z; cam.y = wy - (oy - H/2)/cam.z; try { clampCam(); } catch(e){}
}
function v52ldAlt(){ const zmin = Math.min(innerWidth/V46L.W, innerHeight/V46L.H)*.95, k = Math.max(0, Math.min(1, Math.log(3/cam.z)/Math.log(3/zmin))); return Math.round(12 + k*k*480); }
function v52ldHud(){
  const E = V52LD.el; if(!E) return; const b = Math.round(V52LD.bat);
  E.querySelector('.alt').textContent = '⛰ ' + v52ldAlt() + ' m'; const be = E.querySelector('.bat'); be.textContent = (b < 20 ? '🪫 ' : '🔋 ') + b + '%'; be.classList.toggle('low', b < 20);
  E.querySelector('.tm').textContent = '🕒 ' + (typeof fmt === 'function' ? fmt(clock) : '') + (V52LD.fps ? ' · ' + Math.round(V52LD.fps) + ' fps' : '');
  if(V52LD.sel || V52LD.follow) v52ldChip();
}
// khung camera kiểu drone: góc ngắm, tâm ngắm, thước hướng, chấm REC — vẽ trên canvas phủ trong suốt
function v52ldDrawFrame(t){
  const g = V52LD.fg, W = V52LD.W, H = V52LD.H; g.setTransform(V52LD.dpr, 0, 0, V52LD.dpr, 0, 0); g.clearRect(0, 0, W, H);
  const m = Math.round(Math.min(W, H)/(V52L_PHI*V52L_PHI*V52L_PHI*V52L_PHI)), L = Math.round(m*V52L_PHI); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3;
  [[m, m + 44, 1, 1], [W - m, m + 44, -1, 1], [m, H - m - 70, 1, -1], [W - m, H - m - 70, -1, -1]].forEach(([x, y, sx, sy]) => { g.beginPath(); g.moveTo(x, y + sy*L); g.lineTo(x, y); g.lineTo(x + sx*L, y); g.stroke(); });
  const cx = W/2, cy = H/2; g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(cx - 22, cy); g.lineTo(cx - 8, cy); g.moveTo(cx + 8, cy); g.lineTo(cx + 22, cy); g.moveTo(cx, cy - 22); g.lineTo(cx, cy - 8); g.moveTo(cx, cy + 8); g.lineTo(cx, cy + 22); g.stroke();
  g.beginPath(); g.arc(cx, cy, 3, 0, 7); g.stroke();
  // thước hướng bay
  const hw = Math.min(260, W*.5), hy = m + 62; g.fillStyle = 'rgba(11,16,32,.35)'; g.fillRect(cx - hw/2, hy - 12, hw, 24); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1; const deg = V52LD.heading*180/Math.PI;
  for(let d = -60; d <= 60; d += 10){ const v = Math.round((deg + d)/10)*10, x = cx + (v - deg)*hw/120; if(x < cx - hw/2 || x > cx + hw/2) continue; g.beginPath(); g.moveTo(x, hy + 10); g.lineTo(x, hy + (v % 90 === 0 ? -8 : 2)); g.stroke(); if(v % 90 === 0){ g.fillStyle = '#fff'; g.font = "800 16px Nunito, sans-serif"; g.textAlign = 'center'; g.fillText(['B', 'Đ', 'N', 'T'][((v/90) % 4 + 4) % 4], x, hy - 12); } }
  g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(cx, hy + 12); g.lineTo(cx - 6, hy + 20); g.lineTo(cx + 6, hy + 20); g.fill(); g.textAlign = 'left';
  // dấu chọn NPC / điểm gọi tới (toạ độ màn hình)
  const scr = p => [W/2 + (p[0] - cam.x)*cam.z, H/2 + (p[1] - cam.y)*cam.z];
  const T = v52ldTarget(V52LD.sel || V52LD.follow); if(T){ const [x, y] = scr(T), r = 18 + Math.sin(t*6)*3; g.strokeStyle = V52LD.follow ? '#2fbf71' : '#ffd23f'; g.lineWidth = 3; g.beginPath(); g.arc(x, y - 18*cam.z, r, 0, 7); g.stroke(); }
  if(V52LD.mark && V52LD.mark.until > t){ const [x, y] = scr(V52LD.mark.p); g.strokeStyle = '#ff8fc4'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 14 + (t*30) % 16, 0, 7); g.stroke(); g.fillStyle = '#ff8fc4'; g.fillRect(x - 2, y - 26, 4, 22); }
  if(V52LD.flash > 0){ g.fillStyle = `rgba(255,255,255,${V52LD.flash/.25})`; g.fillRect(0, 0, W, H); }
}
// toạ độ (đảo mới) của mục tiêu: {t:'a', a:agent} hoặc {t:'p', id:peerId}
function v52ldTarget(T){
  if(!T) return null; if(T.t === 'a'){ const a = T.a; if(!a || !a.visible) return null; return v46Pos(a); }
  if(T.t === 'p' && typeof ONLINE !== 'undefined'){ const p = (ONLINE.peers || []).find(q => (q.peerId || q.id) === T.id); const pr = p && p.presence; if(!pr || !isFinite(pr.x)) return null; return v46ToNew(pr.x, pr.y); }
  return null;
}
function v52ldChip(){
  const c = V52LD.el && V52LD.el.querySelector('.v52ld-chip'); if(!c) return; const T = V52LD.sel || V52LD.follow; let h = '';
  if(V52LD.call) h = `📣 Chạm vào chỗ muốn gọi <b>${V52LD.call.a.name}</b> tới · <button type="button" data-c="cancel">Huỷ</button>`;
  else if(T){ const n = T.t === 'a' ? T.a.name : T.n, task = T.t === 'a' ? (T.a.task || T.a.role || '') : 'Người chơi online';
    h = `<b>${n}</b> <small>${task}</small> <button type="button" data-c="follow">${V52LD.follow && V52LD.follow === T ? '✋ Thôi bám' : '👁 Bám theo'}</button>${T.t === 'a' && !T.a.isPlayer ? '<button type="button" data-c="call">📣 Gọi tới…</button>' : ''}<button type="button" data-c="x">✕</button>`; }
  if(!h){ c.hidden = true; c.dataset.h = ''; return; } c.hidden = false; if(c.dataset.h === h) return;   // chỉ dựng lại khi nội dung đổi (để nút không bị thay giữa lúc bấm)
  c.dataset.h = h; c.innerHTML = h;
  c.querySelectorAll('button').forEach(b => b.onclick = e => { e.stopPropagation(); const k = b.dataset.c;
    if(k === 'cancel'){ V52LD.call = null; } else if(k === 'x'){ V52LD.sel = null; V52LD.follow = null; } else if(k === 'follow'){ V52LD.follow = V52LD.follow === T ? null : T; V52LD.sel = null; } else if(k === 'call'){ V52LD.call = T; V52LD.sel = null; V52LD.follow = null; }
    v52ldChip(); });
}

// ---------- hành động trên thanh công cụ ----------
function v52ldAct(k){
  if(!v52ldOK()) return; const pop = V52LD.el.querySelector('.v52ld-pop');
  if(k === 'zi') return v52ldZoom(1.4); if(k === 'zo') return v52ldZoom(1/1.4); if(k === 'shot') return v52ldShot();
  if(k === 'call'){ V52LD.callMode = !V52LD.callMode; V52LD.el.querySelector('[data-k="call"]').classList.toggle('on', V52LD.callMode); toast(V52LD.callMode ? '📣 Chạm vào một NPC để gọi' : 'Đã tắt chế độ gọi'); return; }
  if(V52LD.pop === k && !pop.hidden){ pop.hidden = true; V52LD.pop = null; return; } v52ldPop(k);
}
// bảng chọn nhỏ phía trên thanh công cụ (khu, bám theo, sự kiện, giờ)
function v52ldPop(k){
  const pop = V52LD.el.querySelector('.v52ld-pop'); V52LD.pop = k; pop.hidden = false; pop.innerHTML = '';
  const add = (txt, fn, on, keep) => { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = txt; if(on) b.className = 'on'; b.onclick = e => { e.stopPropagation(); if(!v52ldOK()) return; fn(); if(keep) v52ldPop(k); else { pop.hidden = true; V52LD.pop = null; } }; pop.appendChild(b); };
  if(k === 'zone'){ const Z = Object.keys(V46.ZI).filter(id => V46.ZI[id].n); Z.sort((a, b) => v52ldZName(a).localeCompare(v52ldZName(b), 'vi')); add('🏫 Cổng trường', () => v52ldFly(v46Gate())); add('🗺 Toàn đảo', () => { V52LD.follow = null; cam.x = V46L.CX; cam.y = V46L.CY; cam.z = .01; clampCam(); });
    Z.forEach(id => add(v52ldZName(id), () => { const n = V46.ZI[id].n; v52ldFly([(n.x0 + n.x1)/2, (n.y0 + n.y1)/2]); })); }
  if(k === 'follow'){ if(typeof PLAYER !== 'undefined' && PLAYER && PLAYER.visible) add('🙋 Nhân vật của tôi', () => { V52LD.follow = {t:'a', a:PLAYER}; v52ldChip(); });
    (typeof ONLINE !== 'undefined' ? ONLINE.peers || [] : []).forEach(p => { const pr = p.presence || {}; if(isFinite(pr.x)) add('🌐 ' + String(pr.n || 'Khách').slice(0, 18), () => { V52LD.follow = {t:'p', id:p.peerId || p.id, n:pr.n || 'Khách'}; v52ldChip(); }); });
    agents.filter(a => a.visible && !a.isPlayer && !a.inSub).sort((a, b) => a.name.localeCompare(b.name, 'vi')).forEach(a => add((a.student ? '🧒 ' : '🧑‍🏫 ') + a.name, () => { V52LD.follow = {t:'a', a}; v52ldChip(); })); }
  if(k === 'event'){
    add((concert ? '⏹ Tắt' : '▶️ Bật') + ' hoà nhạc 🎵', () => { try { if(concert) endConcert(); else startConcert(); } catch(e){ toast('Chưa bật được hoà nhạc lúc này.'); } }, !!concert, true);
    add((festival ? '⏹ Tắt' : '▶️ Bật') + ' lễ hội 🎉', () => { try { if(festival) endFestival(); else startFestival(FEST_KIND[season], clock + 120); } catch(e){ toast('Chưa bật được lễ hội lúc này.'); } }, !!festival, true);
    Object.keys(WEATHERS).forEach(w => add('🌦 ' + (WEATHERS[w].name || WEATHERS[w].n || w), () => { try { autoWeather = false; setWeather(w, true); } catch(e){} }, weather === w, true));
    add('🔄 Thời tiết tự động', () => { autoWeather = !autoWeather; }, autoWeather, true); }
  if(k === 'time'){ (typeof V25_TIMES !== 'undefined' ? V25_TIMES : []).forEach(([id, txt, min, label]) => add(txt, () => { try { v25SetTime(min, label); } catch(e){ clock = min; } }));
    add('⏩ +1 giờ', () => { clock += 60; }); }
}
function v52ldZName(id){ try { if(typeof v48mName === 'function'){ const n = v48mName(id); if(n && n[0]) return String(n[0]); } } catch(e){} return id; }
function v52ldFly(p){ V52LD.follow = null; V52LD.sel = null; cam.x = p[0]; cam.y = p[1]; cam.z = Math.max(cam.z, .7); clampCam(); }
function v52ldShot(){
  if(!v52ldOK()) return; const cv = document.getElementById('world'); if(!cv || !cv.toDataURL) return; let url = '';
  try { url = cv.toDataURL('image/png'); } catch(e){ toast('Không chụp được ảnh trên trình duyệt này.'); return; }
  V52LD.flash = .25; V52LD.shots++; v52ldClick(); const a = document.createElement('a'); const d = new Date(); a.href = url; a.download = `flycam-rubik-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}.png`;
  document.body.appendChild(a); a.click(); a.remove(); const im = V52LD.el.querySelector('.v52ld-thumb'); im.src = url; im.hidden = false; clearTimeout(V52LD.thT); V52LD.thT = setTimeout(() => { im.hidden = true; }, 2600);
  toast('📸 Đã chụp ảnh flycam (lưu vào thư mục Tải về).');
}
// gọi NPC tới một chỗ: đi theo đường đảo, giữ chỗ 60 giây rồi quay lại lịch học
function v52ldCallTo(a, nx, ny){
  if(!v52ldOK() || !a || a.isPlayer) return false; const o = v46ToOld(nx, ny);
  a.v52hold = (typeof realT !== 'undefined' ? realT : 0) + 60; a.planKey = 'v52call'; a.queue = []; a.cur = {r:'', p:o, task:'Chủ game gọi tới', done:false, wait:1}; a.path = [[o[0], o[1]]]; a.v46t = null; a.waitUntil = 0; a.task = '📣 Đang tới chỗ chủ game gọi';
  say(a, pick(['Dạ, em tới ngay! 🏃', 'Có em đây! 🙋', 'Đến liền ạ!'])); V52LD.mark = {p:[nx, ny], until:performance.now()/1000 + 6};
  try { log('info', `Chủ game gọi ${a.name} tới một chỗ bằng flycam.`); } catch(e){} return true;
}

// ---------- cảm ứng: 1 ngón bay, 2 ngón zoom, chạm để chọn ----------
function v52ldInput(E){
  const pos = e => [e.clientX, e.clientY];
  E.addEventListener('pointerdown', e => { if(!V52LD.on || e.target.closest('button, .v52ld-pop, .v52ld-help, .v52ld-chip')) return; e.preventDefault(); try { E.setPointerCapture(e.pointerId); } catch(er){}
    const [x, y] = pos(e); V52LD.ptrs.set(e.pointerId, {x, y, x0:x, y0:y, t0:performance.now(), lx:x, ly:y, lt:performance.now()}); V52LD.vx = V52LD.vy = 0;
    if(V52LD.ptrs.size === 2){ const [a, b] = [...V52LD.ptrs.values()]; V52LD.pinch = {d:Math.hypot(a.x - b.x, a.y - b.y), z:cam.z}; } });
  E.addEventListener('pointermove', e => { const P = V52LD.ptrs.get(e.pointerId); if(!P || !V52LD.on) return; const [x, y] = pos(e), dx = x - P.x, dy = y - P.y; P.x = x; P.y = y;
    if(V52LD.ptrs.size >= 2 && V52LD.pinch){ const [a, b] = [...V52LD.ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if(V52LD.pinch.d > 10){ const want = V52LD.pinch.z*d/V52LD.pinch.d; v52ldZoom(want/cam.z, (a.x + b.x)/2, (a.y + b.y)/2); } return; }
    if(Math.hypot(x - P.x0, y - P.y0) > 8){ V52LD.follow = null; cam.x -= dx/cam.z; cam.y -= dy/cam.z; const now = performance.now(), ddt = Math.max(1, now - P.lt); V52LD.vx = -(x - P.lx)/cam.z/ddt*1000*.6; V52LD.vy = -(y - P.ly)/cam.z/ddt*1000*.6; P.lx = x; P.ly = y; P.lt = now; } });
  const up = e => { const P = V52LD.ptrs.get(e.pointerId); if(!P) return; V52LD.ptrs.delete(e.pointerId); if(V52LD.ptrs.size < 2) V52LD.pinch = null;
    if(performance.now() - P.lt > 90){ V52LD.vx = V52LD.vy = 0; }
    if(Math.hypot(P.x - P.x0, P.y - P.y0) < 9 && performance.now() - P.t0 < 400 && !V52LD.ptrs.size) v52ldTap(P.x, P.y); };
  E.addEventListener('pointerup', up); E.addEventListener('pointercancel', up);
  E.addEventListener('wheel', e => { if(!V52LD.on) return; e.preventDefault(); v52ldZoom(Math.pow(1.0018, -e.deltaY), e.clientX, e.clientY); }, {passive:false});
  addEventListener('keydown', e => { if(!V52LD.on) return; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if(k === 'Escape'){ v52ldClose(); e.preventDefault(); e.stopPropagation(); return; } if(k === 'p'){ v52ldShot(); } if(k === 'f'){ v52ldAct('follow'); }
    V52LD.keys[k] = true; if(/^Arrow/.test(k) || k === ' ') e.preventDefault(); e.stopPropagation(); }, true);
  addEventListener('keyup', e => { if(!V52LD.on) return; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; V52LD.keys[k] = false; e.stopPropagation(); }, true);
  addEventListener('resize', v52ldResize);
}
function v52ldTap(sx, sy){
  if(!v52ldOK()) return; const W = V52LD.W, H = V52LD.H, wx = cam.x + (sx - W/2)/cam.z, wy = cam.y + (sy - H/2)/cam.z;
  if(V52LD.call){ const a = V52LD.call.a; if(v52ldCallTo(a, wx, wy)) toast(`📣 Đã gọi ${a.name} tới đây.`); V52LD.call = null; V52LD.callMode = false; V52LD.el.querySelector('[data-k="call"]').classList.remove('on'); V52LD.follow = {t:'a', a}; v52ldChip(); return; }
  let best = null, bd = 34/Math.max(.35, cam.z) + 10; agents.forEach(a => { if(!a.visible || a.inSub) return; const p = v46Pos(a), d = Math.hypot(p[0] - wx, p[1] - 16 - wy); if(d < bd){ bd = d; best = a; } });
  V52LD.pop = null; V52LD.el.querySelector('.v52ld-pop').hidden = true;
  if(best){ V52LD.sel = {t:'a', a:best}; if(V52LD.callMode && !best.isPlayer){ V52LD.call = V52LD.sel; V52LD.sel = null; } v52ldClick(); } else V52LD.sel = null;
  v52ldChip();
}

// ---------- khởi động ----------
function v52ldInit(){
  // NPC đang được chủ game gọi thì giữ đường đi, không bị lịch học kéo đi chỗ khác (60 giây)
  if(typeof setPlan === 'function'){ const sp0 = setPlan; setPlan = function(a, key, steps){ if(a && a.v52hold && key !== 'v52call'){ if((typeof realT !== 'undefined' ? realT : 0) < a.v52hold) return; a.v52hold = 0; a.planKey = null; } return sp0.apply(this, arguments); }; }
  addEventListener('keydown', e => { if(e.key && e.key.toLowerCase() === 'v' && !e.ctrlKey && !e.metaKey && !V52LD.on && v52ldOK() && !(typeof openModal !== 'undefined' && openModal) && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) v52ldOpen(); });
  setInterval(() => { try { v52ldBtnSync(); } catch(e){} }, 1000);
}
