// ================= v51t · GIAO DIỆN: vào/ra trường, khung mini game (chuẩn v44), bảng thành tích, chứng chỉ, khởi động =================
function v51tEl(tag, cls, html){ const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
function v51tEsc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]); }
function v51tSay(m){ V51T.say = 1; try { toast(m); } finally { V51T.say = 0; } }

// ---------- 1. khung DOM ----------
function v51tBuildUi(){
  if(V51T.root) return V51T.root; const r = v51tEl('div'); r.id = 'v51t'; r.hidden = true; r.setAttribute('role', 'dialog'); r.setAttribute('aria-label', 'Trường Tin học Rubik');
  r.innerHTML = '<canvas id="v51tCv"></canvas>' +
    '<div class="v51ttop"><button type="button" class="v51tib" id="v51tBack" aria-label="Ra ngoài">✕</button><div class="v51ttt"><b>💻 Trường Tin học Rubik</b><small id="v51tPer"></small></div>' +
    '<div class="v51ttr"><button type="button" class="v51tib" id="v51tBoardB" aria-label="Bảng thành tích">🏆</button><button type="button" class="v51tib" id="v51tHelp" aria-label="Hướng dẫn">?</button></div></div>' +
    '<button type="button" id="v51tAct" hidden></button><div id="v51tPan" hidden></div>' +
    '<div id="v51tG" hidden><div id="v51tGB"></div><div class="v51tgbar"><div class="v51tgl"></div><div class="v51tgm" id="v51tGStat"></div><div class="v51tgr"><button type="button" class="v51tib" id="v51tGHelp" aria-label="Hướng dẫn">?</button><button type="button" class="v51tib" id="v51tGX" aria-label="Thoát">✕</button></div></div>' +
    '<div id="v51tGHow" hidden></div><div id="v51tGEnd" hidden></div></div>';
  (document.getElementById('stage') || document.body).appendChild(r); V51T.root = r; V51TI.cv = r.querySelector('#v51tCv'); V51TI.g = V51TI.cv.getContext('2d', {alpha:false});
  r.querySelector('#v51tBack').onclick = () => v51tClose(); r.querySelector('#v51tBoardB').onclick = () => v51tBoard(); r.querySelector('#v51tHelp').onclick = () => v51tHelpPanel();
  r.querySelector('#v51tAct').onclick = () => { if(V51TI.near) v51tSpot(V51TI.near); };
  r.querySelector('#v51tGX').onclick = () => v51tGClose(); r.querySelector('#v51tGHelp').onclick = () => { const h = document.getElementById('v51tGHow'); h.hidden = !h.hidden; if(V51T.game) V51T.game.pause = !h.hidden; };
  v51tInInput(V51TI.cv); addEventListener('resize', v51tResize); return r;
}
function v51tResize(){ if(!V51T.open || !V51TI.cv) return; const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight; V51TI.dpr = dpr; V51TI.W = W; V51TI.H = H;
  V51TI.cv.width = Math.round(W*dpr); V51TI.cv.height = Math.round(H*dpr); V51TI.z = Math.max(.5, Math.min(1.3, H/720)); const G = V51T.game; if(G && G.def.resize) try { G.def.resize(G); } catch(e){} }
function v51tOpen(){
  v51tBuildUi(); if(!V51TI.st.length) v51tMakeStudents(); V51T.open = true; V51T.root.hidden = false; document.body.classList.add('v51ton'); v51tEnterBtn(false);
  const P = typeof PLAYER !== 'undefined' && PLAYER ? PLAYER : null, m = V51TI.me; m.skin = P && P.skin || '#f1c27d'; m.hair = P && P.hair || '#3a2a1a'; m.long = !!(P && P.long); m.shirt = P && P.shirt || '#3d7bff'; m.pants = P && P.pants || '#34406b';
  m.x = 382; m.y = 585; m.dir = 1; V51TI.cam.x = 382; V51TI.cam.y = 480; V51TI.near = null; v51tActBtn(null); V51TI.hint = 6; V51TI.lt = 0; v51tResize();
  const pe = v51tPeriod(); document.getElementById('v51tPer').textContent = pe[0] + ' ' + pe[1]; if(!V51TI.raf) V51TI.raf = requestAnimationFrame(v51tInFrame); v51tSnd('boot');
  const s = v51tState(); if(!s.seen){ s.seen = 1; v51tSave(); setTimeout(() => { if(V51T.open && !V51T.game) v51tTeacher(true); }, 700); }
}
function v51tClose(){ if(V51T.game) v51tGClose(true); V51T.open = false; if(V51T.root) V51T.root.hidden = true; document.body.classList.remove('v51ton'); v51tPanel(null); V51TI.keys = {}; V51TI.joy = null; if(V51TI.raf){ cancelAnimationFrame(V51TI.raf); V51TI.raf = 0; } }
function v51tActBtn(s){ const b = document.getElementById('v51tAct'); if(!b) return; if(!s || V51T.game){ b.hidden = true; return; } b.hidden = false; b.innerHTML = '<span>' + s.ic + '</span> ' + v51tEsc(s.vi) + ' <small>' + v51tEsc(s.en) + '</small>'; }
function v51tPanel(html, cls){ const p = document.getElementById('v51tPan'); if(!p) return null; if(html == null){ p.hidden = true; p.innerHTML = ''; return null; }
  p.className = cls || ''; p.innerHTML = '<div class="v51tcard"><button type="button" class="v51tib v51tx" aria-label="Đóng">✕</button>' + html + '</div>'; p.hidden = false; p.querySelector('.v51tx').onclick = () => v51tPanel(null); p.onclick = e => { if(e.target === p) v51tPanel(null); }; return p; }
function v51tHelpPanel(){ v51tPanel('<h2>❓ Hướng dẫn <small>How to play</small></h2><ul class="v51thow"><li>👆 <b>Kéo</b> ngón tay để đi lại trong trường.</li><li>💻 <b>Chạm</b> vào một góc học (nhãn có biểu tượng) để vào bài.</li><li>⭐ Mỗi bài có nhiều <b>cấp</b>. Được sao thì mở cấp tiếp theo.</li><li>📜 Xong mọi cấp của một bài (ít nhất 1 sao) nhận <b>chứng chỉ</b>.</li><li>🏆 Xem sao, kỷ lục, chứng chỉ ở <b>Bảng thành tích</b>.</li><li>👩‍🏫 Gặp <b>cô Lam</b> để xem thời khoá biểu.</li><li>🚪 Ra cửa dưới để về đảo.</li></ul><button type="button" class="v51twide" id="v51tOk">Đã hiểu ✓</button>');
  document.getElementById('v51tOk').onclick = () => v51tPanel(null); }
function v51tTeacher(first){
  const pe = v51tPeriod(), tips = ['Máy tính chỉ làm đúng điều mình bảo. Lệnh rõ ràng thì robot đi đúng! 🤖', 'Lỗi (bug) không đáng sợ. Tìm lỗi là cách lập trình viên học giỏi hơn 🐞', 'Mật khẩu là bí mật: chỉ em và bố mẹ biết thôi nhé 🔐', 'Nhị phân chỉ có 0 và 1, giống công tắc tắt và bật 💡', 'Giải Rubik cũng là thuật toán: làm đúng các bước theo thứ tự 🧊'], tip = tips[Math.floor((typeof day === 'number' ? day : 0) + Date.now()/8.64e7) % tips.length];
  v51tPanel('<h2>👩‍🏫 Cô Lam <small>Teacher · Tin học</small></h2><p class="v51tnote">' + (first ? 'Chào em! Cô là cô Lam, cô dạy Tin học. Ở đây em vừa chơi vừa học lập trình nhé. ' : '') + 'Bây giờ: <b>' + pe[0] + ' ' + v51tEsc(pe[1]) + '</b> <i>(' + pe[2] + ')</i></p>' +
    '<p class="v51tnote">💬 ' + tip + '</p><h3>📅 Thời khoá biểu <small>Timetable</small></h3><ul class="v51ttt2"><li><b>7:30</b> 🧩 Lập trình khối</li><li><b>8:30</b> 💡 Số nhị phân</li><li><b>9:30</b> ⌨️ Gõ phím nhanh</li><li><b>10:30</b> 🤖 Robot & thuật toán</li><li><b>11:30</b> 🍱 Nghỉ trưa</li><li><b>13:30</b> 🎨 Vẽ pixel</li><li><b>14:30</b> 🛡️ An toàn trên mạng</li><li><b>15:30</b> 🐞 Tìm lỗi</li><li><b>16:30</b> 🤖 CLB robot</li></ul>' +
    '<h3>📚 Bài học <small>Lessons</small></h3><div class="v51tgrid">' + V51T_LESSONS.map(l => '<button type="button" data-g="' + l.id + '"><b>' + l.icon + ' ' + v51tEsc(l.vi) + '</b><small>' + l.en + '</small><em>' + '⭐ ' + v51tTotalStars(l.id) + '/' + (l.lv*3) + '</em></button>').join('') + '</div>');
  document.querySelectorAll('#v51tPan [data-g]').forEach(b => { b.onclick = () => { v51tPanel(null); v51tGOpen(b.dataset.g); }; });
}
// ---------- 2. bảng thành tích ----------
function v51tBoard(){
  const s = v51tState(), L = v51tLB(); let tot = 0, max = 0, nc = 0;
  const rows = V51T_LESSONS.map(l => { const st = v51tTotalStars(l.id); tot += st; max += l.lv*3; if(s.cert[l.id]) nc++; const top = (L[l.id] || []).slice(0, 3).map((e, i) => ['🥇', '🥈', '🥉'][i] + ' ' + v51tEsc(e.n) + ' ' + e.s).join(' · ') || '—';
    return '<button type="button" data-g="' + l.id + '" class="' + (s.cert[l.id] ? 'done' : '') + '"><b>' + l.icon + ' ' + v51tEsc(l.vi) + '</b><small>' + l.en + '</small><em>⭐ ' + st + '/' + l.lv*3 + ' · Cấp ' + Math.min(l.lv, v51tUnlocked(l.id)) + '/' + l.lv + '</em><small>🏅 Kỷ lục: ' + (s.best[l.id] || 0) + '</small><small class="lb">' + top + '</small>' + (s.cert[l.id] ? '<i>📜 Chứng chỉ ✓</i>' : '') + '</button>'; }).join('');
  v51tPanel('<h2>🏆 Bảng thành tích <small>Achievements</small></h2><p class="v51tnote">⭐ <b>' + tot + '</b>/' + max + ' sao · 📜 <b>' + nc + '</b>/7 chứng chỉ</p><div class="v51tgrid v51tboard">' + rows + '</div>' +
    '<button type="button" class="v51twide" id="v51tCertAll"' + (nc ? '' : ' disabled') + '>📜 Xem chứng chỉ của em</button>');
  document.querySelectorAll('#v51tPan [data-g]').forEach(b => { b.onclick = () => { v51tPanel(null); v51tGOpen(b.dataset.g); }; });
  const cb = document.getElementById('v51tCertAll'); if(cb) cb.onclick = () => v51tCertList();
}
// ---------- 3. chứng chỉ (vẽ bằng code, khung 1000×618 = chữ nhật vàng) ----------
function v51tCertCanvas(id){
  const l = id === 'all' ? {icon:'🎓', vi:'Lập trình viên nhí', en:'Young Coder · 7/7 bài'} : v51tLesson(id), s = v51tState(), name = (typeof PROF !== 'undefined' && PROF && PROF.name) || 'Khách', date = (id === 'all' ? s.cert.all : s.cert[id]) || v51tToday();
  const c = document.createElement('canvas'); c.width = 1000; c.height = 618; const g = c.getContext('2d');
  g.fillStyle = '#fdf8ec'; g.fillRect(0, 0, 1000, 618); for(let i = 0; i < 6; i++){ g.fillStyle = V51T_RUBIK[i]; g.fillRect(0, i*103, 18, 103); g.fillRect(982, 515 - i*103, 18, 103); }
  g.strokeStyle = '#c9a54a'; g.lineWidth = 6; g.strokeRect(40, 30, 920, 558); g.lineWidth = 2; g.strokeRect(54, 44, 892, 530);
  g.textAlign = 'center'; g.fillStyle = '#2b3550'; g.font = "800 26px Nunito, sans-serif"; g.fillText('TRƯỜNG TIN HỌC RUBIK · RUBIK CODE SCHOOL', 500, 100);
  const t = v51tPixText('CHỨNG CHỈ', '#1f8a50', 6, '#b7e4c7'); g.drawImage(t, 500 - t.width/2, 116); g.font = "700 22px Nunito, sans-serif"; g.fillStyle = '#6b7080'; g.fillText('CERTIFICATE OF COMPLETION', 500, 222);
  g.font = "700 22px Nunito, sans-serif"; g.fillStyle = '#2b3550'; g.fillText('Chứng nhận bạn', 500, 270); g.font = "800 44px Nunito, sans-serif"; g.fillStyle = '#1b2440'; g.fillText(name.slice(0, 22), 500, 324);
  g.font = "700 22px Nunito, sans-serif"; g.fillStyle = '#2b3550'; g.fillText('đã hoàn thành bài học', 500, 370); g.font = "800 34px Nunito, sans-serif"; g.fillStyle = '#3d7bff'; g.fillText(l.icon + ' ' + l.vi, 500, 418); g.font = "700 20px Nunito, sans-serif"; g.fillStyle = '#6b7080'; g.fillText(l.en, 500, 448);
  const st = id === 'all' ? V51T_LESSONS.reduce((a, q) => a + v51tTotalStars(q.id), 0) : v51tTotalStars(id); g.font = "800 24px Nunito, sans-serif"; g.fillStyle = '#c9a54a'; g.fillText('⭐ ' + st + ' sao', 500, 488);
  g.font = "700 18px Nunito, sans-serif"; g.fillStyle = '#2b3550'; g.textAlign = 'left'; g.fillText('Ngày: ' + date, 90, 548); g.textAlign = 'right'; g.fillText('Cô Lam · Giáo viên Tin học', 910, 548);
  g.strokeStyle = '#2b3550'; g.lineWidth = 2; g.beginPath(); g.moveTo(720, 520); g.bezierCurveTo(760, 490, 790, 540, 830, 505); g.bezierCurveTo(850, 495, 870, 520, 900, 510); g.stroke();
  // con dấu: robot pixel trong vòng tròn
  g.fillStyle = 'rgba(239,75,75,.85)'; g.beginPath(); g.arc(160, 470, 46, 0, 7); g.fill(); g.fillStyle = '#fdf8ec'; g.fillRect(140, 450, 40, 30); g.fillStyle = 'rgba(239,75,75,.85)'; g.fillRect(148, 458, 8, 8); g.fillRect(164, 458, 8, 8); g.fillRect(150, 472, 20, 4); g.fillStyle = '#fdf8ec'; g.fillRect(158, 438, 4, 12);
  g.textAlign = 'left'; return c;
}
function v51tCertShow(id){ const c = v51tCertCanvas(id), url = c.toDataURL('image/png'); v51tPanel('<h2>📜 Chứng chỉ <small>Certificate</small></h2><img class="v51tcert" alt="Chứng chỉ" src="' + url + '"><a class="v51twide v51tdl" download="chung-chi-tin-hoc.png" href="' + url + '">💾 Lưu ảnh chứng chỉ</a>'); }
function v51tCertList(){ const s = v51tState(), ids = V51T_LESSONS.filter(l => s.cert[l.id]).map(l => l.id); if(s.cert.all) ids.unshift('all');
  v51tPanel('<h2>📜 Chứng chỉ của em <small>My certificates</small></h2><div class="v51tgrid">' + ids.map(id => { const l = id === 'all' ? {icon:'🎓', vi:'Lập trình viên nhí'} : v51tLesson(id); return '<button type="button" data-c="' + id + '"><b>' + l.icon + ' ' + v51tEsc(l.vi) + '</b><small>' + (id === 'all' ? s.cert.all : s.cert[id]) + '</small></button>'; }).join('') + '</div>');
  document.querySelectorAll('#v51tPan [data-c]').forEach(b => { b.onclick = () => v51tCertShow(b.dataset.c); }); }

// ---------- 4. khung mini game: thanh trên (cấp · số liệu · ? ✕), hướng dẫn khi bấm ?, màn kết thúc có "Play again" ----------
function v51tGOpen(id, lv){
  const def = V51T_GAMES[id]; if(!def) return; v51tPanel(null); v51tActBtn(null); const box = document.getElementById('v51tG'); box.hidden = false;
  const max = Math.min(def.lv, v51tUnlocked(id)); lv = Math.max(1, Math.min(lv || max, max));
  const G = V51T.game = {id, def, lv, pause:false, end:false, score:0, t0:performance.now(), st:{}, tm:[], raf:0, body:document.getElementById('v51tGB')};
  const L = box.querySelector('.v51tgl'); L.innerHTML = ''; const lb = v51tEl('button', 'v51tib v51tlv', '🎯' + lv); lb.type = 'button'; lb.setAttribute('aria-label', 'Chọn cấp'); lb.onclick = () => v51tLevels(); L.appendChild(lb);
  (def.modes || []).forEach((m, i) => { const b = v51tEl('button', 'v51tib' + (i === (G.mode || 0) ? ' on' : ''), m[0]); b.type = 'button'; b.title = m[1]; b.setAttribute('aria-label', m[1]); b.onclick = () => { G.mode = i; L.querySelectorAll('.v51tmd').forEach((x, k) => x.classList.toggle('on', k === i)); v51tGStart(); }; b.classList.add('v51tmd'); L.appendChild(b); });
  const how = document.getElementById('v51tGHow'); how.hidden = true; how.innerHTML = '<div class="v51tcard"><h2>' + def.icon + ' ' + v51tEsc(def.name) + ' <small>' + v51tEsc(def.en) + '</small></h2><ul class="v51thow">' + def.help.map(s => '<li>' + s + '</li>').join('') + '</ul><button type="button" class="v51twide" id="v51tHowOk">Đã hiểu ✓</button></div>';
  how.querySelector('#v51tHowOk').onclick = () => { how.hidden = true; G.pause = false; };
  G.mode = 0; v51tResize(); v51tGStart(); v51tSnd('boot');
}
function v51tLevels(){
  const G = V51T.game; if(!G) return; const max = Math.min(G.def.lv, v51tUnlocked(G.id)), how = document.getElementById('v51tGHow'); G.pause = true; how.hidden = false;
  let h = '<div class="v51tcard"><h2>🎯 Chọn cấp <small>Levels</small></h2><div class="v51tlvs">'; for(let i = 1; i <= G.def.lv; i++){ const s = v51tStars(G.id, i), on = i <= max; h += '<button type="button" ' + (on ? 'data-l="' + i + '"' : 'disabled') + ' class="' + (i === G.lv ? 'on' : '') + '"><b>' + (on ? i : '🔒') + '</b><i>' + '★'.repeat(s) + '<span>' + '★'.repeat(3 - s) + '</span></i></button>'; }
  how.innerHTML = h + '</div><button type="button" class="v51twide" id="v51tHowOk">Đóng</button></div>'; how.querySelector('#v51tHowOk').onclick = () => { how.hidden = true; G.pause = false; };
  how.querySelectorAll('[data-l]').forEach(b => { b.onclick = () => { how.hidden = true; G.lv = +b.dataset.l; document.querySelector('#v51tG .v51tlv').textContent = '🎯' + G.lv; v51tGStart(); }; });
}
function v51tGClear(G){ G.tm.forEach(t => clearInterval(t)); G.tm = []; if(G.raf){ cancelAnimationFrame(G.raf); G.raf = 0; } if(G.def.stop) try { G.def.stop(G); } catch(e){} }
function v51tGStart(){ const G = V51T.game; if(!G) return; v51tGClear(G); G.score = 0; G.end = false; G.pause = false; G.st = {}; G.t0 = performance.now(); G.body.innerHTML = ''; G.body.className = 'v51tgb v51tg-' + G.id; document.getElementById('v51tGEnd').hidden = true;
  const lb = document.querySelector('#v51tG .v51tlv'); if(lb) lb.textContent = '🎯' + G.lv; try { G.def.start(G); } catch(e){ console.warn('v51t start', e); } }
function v51tGClose(){ const G = V51T.game; if(G) v51tGClear(G); V51T.game = null; const b = document.getElementById('v51tG'); if(b) b.hidden = true; const gb = document.getElementById('v51tGB'); if(gb) gb.innerHTML = ''; V51TI.near = null; V51TI.lt = 0; }
function v51tGStat(h){ const e = document.getElementById('v51tGStat'); if(e) e.innerHTML = h; }
function v51tGEvery(G, ms, f){ const t = setInterval(() => { if(V51T.game !== G || G.end){ clearInterval(t); return; } if(!G.pause) f(); }, ms); G.tm.push(t); return t; }
function v51tGLoop(G, f){ let lt = 0; const step = now => { if(V51T.game !== G){ return; } G.raf = requestAnimationFrame(step); const dt = Math.min(.05, lt ? (now - lt)/1000 : .016); lt = now; if(!G.pause) f(dt); }; G.raf = requestAnimationFrame(step); }
// kết thúc một lượt: r = {score, stars (0–3), title, note}
function v51tGEnd(G, r){
  if(G.end) return; G.end = true; const s = v51tState(), id = G.id, lv = G.lv, stars = Math.max(0, Math.min(3, r.stars | 0)); s.st[id] = s.st[id] || {};
  const prev = s.st[id][lv] || 0; if(stars > prev) s.st[id][lv] = stars; if(stars > 0 && lv >= (s.lv[id] || 1) && lv < G.def.lv) s.lv[id] = lv + 1;
  const rec = v51tLBAdd(id, r.score || 0), rw = v51tReward(id, stars ? .25 + stars*.25 : .1, G.def.name);
  let cert = ''; if(!s.cert[id]){ let ok = true; for(let i = 1; i <= G.def.lv; i++) if(!((s.st[id] || {})[i] > 0)) ok = false; if(ok){ s.cert[id] = v51tToday(); cert = id; } }
  if(cert && !s.cert.all && V51T_LESSONS.every(l => s.cert[l.id])){ s.cert.all = v51tToday(); cert = 'all'; }
  v51tSave(); v51tSnd(stars ? 'win' : 'bad');
  const e = document.getElementById('v51tGEnd'), next = stars > 0 && lv < G.def.lv;
  e.innerHTML = '<div class="v51tcard v51tend"><h2>' + (r.title || (stars ? '🎉 Giỏi lắm!' : '💪 Thử lại nhé!')) + '</h2><div class="v51tstars">' + '★'.repeat(stars) + '<span>' + '★'.repeat(3 - stars) + '</span></div>' +
    '<div class="v51tbig">' + (r.score || 0) + '</div><p class="v51tnote">' + (r.note || '') + '</p><p class="v51tnote">🎯 Cấp ' + lv + '/' + G.def.lv + (rec.rec && r.score ? ' · 🏅 <b>Kỷ lục mới!</b>' : ' · 🏅 Kỷ lục: ' + rec.best) + '</p>' +
    (rw.ok ? '<p class="v51tnote">+' + rw.exp + ' EXP · +$' + rw.money + '</p>' : '<p class="v51tnote">🔑 Đăng nhập để nhận EXP và tiền thưởng.</p>') + (cert ? '<button type="button" class="v51twide v51tcertb" id="v51tSeeCert">📜 Nhận chứng chỉ ' + (cert === 'all' ? 'Lập trình viên nhí 🎓' : '') + '</button>' : '') +
    '<div class="v51trow">' + (next ? '<button type="button" class="v51twide" id="v51tNext">Cấp ' + (lv + 1) + ' ▶</button>' : '') + '<button type="button" class="v51twide v51tagain" id="v51tAgain">Play again</button></div></div>';
  e.hidden = false; e.querySelector('#v51tAgain').onclick = () => v51tGStart(); const nb = e.querySelector('#v51tNext'); if(nb) nb.onclick = () => { G.lv = lv + 1; v51tGStart(); };
  const cb = e.querySelector('#v51tSeeCert'); if(cb) cb.onclick = () => { v51tGClose(); v51tCertShow(cert); };
}
function v51tStarsBy(v, a, b){ return v >= a ? 3 : v >= b ? 2 : 1; }     // tiện ích: chỉ số càng cao càng tốt

// ---------- 5. khởi động (gọi từ extFinalInit trong main.js) ----------
function v51tInit(){
  v51tWorldInit();
  // ở trong trường: không vẽ đảo (tiết kiệm pin), nhân vật đứng yên, toast chỉ hiện của trường
  const t0 = toast; toast = function(m){ if(V51T.open && !V51T.say && !V51T.game) return; return t0.apply(this, arguments); };
  const r0 = render; render = function(dt){ if(V51T.open) return; return r0(dt); };
  const cm0 = canMove; canMove = function(ox, oy, nx, ny){ if(V51T.open && typeof PLAYER !== 'undefined' && PLAYER && PLAYER.controlled && ox === PLAYER.x && oy === PLAYER.y) return false; return cm0(ox, oy, nx, ny); };
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v51t = {V51T, V51TI, V51TW, v51tOpen, v51tClose, v51tGOpen, v51tGClose, v51tState, v51tGeo, v51tBoard, v51tCertShow, v51tTeacher};
}
