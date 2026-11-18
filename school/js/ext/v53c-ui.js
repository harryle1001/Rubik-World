// ================= v53c · THÀNH PHỐ AN TOÀN 6b: bảng chọn, câu đố số khẩn cấp, mini game dập lửa, cài đặt, khởi động =================
// ---------- 1. câu hỏi ----------
const V53C_CALLQ = [
  ['🔥', 'Thấy nhà hàng xóm bốc nhiều khói đen', 114], ['🧒', 'Một bạn nhỏ bị lạc, khóc tìm bố mẹ ở chợ', 113], ['🤕', 'Ông bị ngã, đau chân không đứng dậy được', 115],
  ['🚪', 'Có người lạ cố mở cửa nhà mình ban đêm', 113], ['🌲', 'Đám cỏ khô ven rừng đang cháy lan', 114], ['😵', 'Có người bỗng ngất xỉu ngoài đường', 115],
  ['🛗', 'Có người bị kẹt trong thang máy', 114], ['🚗', 'Thấy hai xe va chạm, có người bị thương', 115], ['👛', 'Nhặt được ví tiền có giấy tờ của người khác', 113]
];
const V53C_QZ = {
  cross:[['Qua đường an toàn thì đi ở đâu?', ['Trên vạch kẻ đường cho người đi bộ', 'Chỗ nào gần nhất cũng được', 'Chạy thật nhanh giữa các xe'], 0],
         ['Trước khi qua đường, mắt nhìn thế nào?', ['Nhìn trái – phải – trái', 'Chỉ nhìn điện thoại', 'Nhắm mắt cho nhanh'], 0],
         ['Đèn cho người đi bộ màu gì thì được đi?', ['Màu xanh', 'Màu đỏ', 'Màu tím'], 0]],
  traffic:[['Đèn giao thông màu đỏ nghĩa là gì?', ['Dừng lại', 'Đi thật nhanh', 'Quay đầu xe'], 0],
         ['Ngồi sau xe máy, em cần làm gì?', ['Đội mũ bảo hiểm, cài quai', 'Đứng lên cho mát', 'Bỏ mũ cho nhẹ đầu'], 0],
         ['Xe cứu hỏa bật còi phía sau, các xe khác nên làm gì?', ['Tránh sang bên, nhường đường', 'Chạy đua với xe cứu hỏa', 'Dừng giữa đường'], 0]]
};
const v53cShuffle = A => { const B = A.slice(); for(let i = B.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i + 1)); [B[i], B[j]] = [B[j], B[i]]; } return B; };

// ---------- 2. bảng (dùng chung kiểu .v51pBox) ----------
function v53cPanel(k, o){
  let p = document.getElementById('v53cPanel'); if(!k){ if(p) p.hidden = true; V53C.panelK = null; if(V53C.mode === 'rest') v53cTowerDown(); return; }
  if(!p){ p = document.createElement('div'); p.id = 'v53cPanel'; (document.getElementById('stage') || document.body).appendChild(p); p.addEventListener('pointerdown', e => { if(e.target === p) v53cPanel(null); }); }
  V53C.panelK = k; p.hidden = false; o = o || {}; const S = v53cState(), H = (t, sub) => '<div class="v51pHd"><b>' + t + (sub ? ' <small>' + sub + '</small>' : '') + '</b><button type="button" class="v51pIb" data-x aria-label="Đóng">✕</button></div>';
  const badges = () => '<div class="v53cBad">' + Object.keys(V53C_BADGES).map(b => { const B = V53C_BADGES[b], on = S.badges[b]; return '<span class="' + (on ? 'on' : '') + '" title="' + v53cEsc(B.why) + '">' + B.ic + ' ' + B.vi + '</span>'; }).join('') + '</div>';
  let h = '';
  if(k === 'fire'){ const f = V53C.fires.find(q => !q.out);
    h = H('🚒 Trạm cứu hỏa', 'Fire Station · ☎️ 114') + '<div class="v53cGold"><div class="v53cBig"><canvas id="v53cPrev" width="160" height="99"></canvas><p><b>☎️ 114</b> — gọi khi có <b>cháy</b> hoặc cần <b>cứu nạn</b> (kẹt thang máy, đuối nước…).</p>' + (f ? '<p class="v53cHot">🔥 Đang có đám cháy nhỏ! Xe cứu hỏa đang xử lý.</p>' : '') + '</div>' +
      '<div class="v53cAct"><button type="button" class="v51pGo" data-a="drive">🚒 Lái xe cứu hỏa</button><button type="button" data-a="mg">💦 Tập dập lửa</button><button type="button" data-a="call">☎️ Học số khẩn cấp</button><button type="button" data-a="drill">✈️ Bài tập sự cố máy bay</button></div></div>' +
      '<p class="v53cNote">🧒 Ngoài đời: các em <b>không tự dập lửa</b>. Hãy ra ngoài ngay, báo người lớn và gọi 114.</p>' + badges(); }
  else if(k === 'police'){
    h = H('🚓 Đồn cảnh sát', 'Police Station · ☎️ 113') + '<div class="v53cGold"><div class="v53cBig"><canvas id="v53cPrev" width="160" height="99"></canvas><p><b>☎️ 113</b> — gọi khi cần <b>công an giúp đỡ</b>: bị lạc, có người lạ đáng ngờ, nhặt được của rơi.</p><p>Cảnh sát nhí ở đây chỉ làm <b>việc tốt</b>: tìm bé lạc, trả đồ rơi, giúp qua đường, điều tiết giao thông.</p></div>' +
      '<div class="v53cAct"><button type="button" class="v51pGo" data-a="drive">🚓 Lái xe & nhận nhiệm vụ</button><button type="button" data-a="call">☎️ Trò chơi gọi đúng số</button></div></div>' + badges(); }
  else if(k === 'tower81'){
    h = H('🏙️ Tháp Rubik 81', 'Rubik Tower 81 · 461 m') + '<div class="v53cGold"><div class="v53cBig"><canvas id="v53cPrev" width="99" height="160"></canvas><p>Toà tháp cao nhất đảo: <b>81 tầng</b>, kiểu <b>bó tre</b> nhiều khối, nhỏ dần lên đỉnh theo <b>tỷ lệ vàng 1 : 1,618</b>. Ban đêm đèn LED đổi màu, đỉnh có đèn chớp cho máy bay.</p></div>' +
      '<div class="v53cAct"><b class="v53cLiftT">🛗 Thang máy</b><button type="button" class="v51pGo" data-a="f81">🔭 Tầng 81 · Đài quan sát</button><button type="button" data-a="f61">🍽️ Tầng 61 · Nhà hàng Mây</button></div></div>' + badges(); }
  else if(k === 'help'){
    h = H('❓ Cách lái xe', 'How to drive') + '<ol class="v51pHelp"><li>📱 Chạm và <b>kéo</b> ở bất kỳ đâu: kéo về hướng nào, xe chạy hướng đó. Thả tay là xe dừng.</li><li>⌨️ Máy tính: phím mũi tên hoặc W A S D, phím H bật/tắt còi.</li><li>🚨 Còi và đèn ưu tiên chỉ bật khi đi làm nhiệm vụ khẩn cấp.</li><li>🚒 Có cháy: theo mũi tên đỏ, dừng gần đám cháy, đội cứu hỏa sẽ kéo vòi. Bấm 💦 để cùng dập lửa.</li><li>🚓 Bấm 📋 để nhận nhiệm vụ, theo mũi tên xanh tới nơi và dừng xe.</li><li>☎️ Nhớ: <b>113</b> Công an · <b>114</b> Cứu hỏa · <b>115</b> Cấp cứu.</li></ol>'; }
  else if(k === 'done'){ const r = o.r;
    h = H(o.ic + ' Hoàn thành!') + '<div class="v51pRes"><div class="v53cBigIc">' + o.ic + '</div><p><b>' + v53cEsc(o.t) + '</b></p>' + (r ? '<p>+$' + r.money + ' · +' + r.exp + ' EXP</p>' : '') + (o.lesson ? '<p class="v53cLes">💡 ' + v53cEsc(o.lesson) + '</p>' : '') + '</div><div class="v51pFt">' + (o.again ? '<button type="button" class="v51pGo" data-a="again">Play again</button>' : '') + '<button type="button" data-x>OK</button></div>'; }
  else if(k === 'mis'){
    h = H('📋 Nhiệm vụ giúp đỡ', 'Kind missions') + '<div class="v51pList">' + V53C_MIS.map((M, i) => '<div class="v51pRow"><div class="v51pBig">' + M.ic + '</div><div><b>' + M.vi + '</b><p>' + v53cEsc(M.ta.replace('{A}', '…')) + '</p></div><button type="button" class="v51pGo" data-m="' + i + '">Nhận</button></div>').join('') + '</div><p class="v53cNote">☎️ Ngoài đời, gặp chuyện cần công an giúp thì gọi <b>113</b>.</p>'; }
  else if(k === 'quiz'){ const Q = o.q[o.i];
    h = H(o.title, 'Câu ' + (o.i + 1) + '/' + o.q.length) + '<div class="v53cQ"><p class="v53cQt">' + (Q.ic ? '<span class="v53cBigIc">' + Q.ic + '</span>' : '') + v53cEsc(Q.t) + '</p><div class="v53cOpts">' + Q.o.map((s, i) => '<button type="button" data-q="' + i + '">' + v53cEsc(s) + '</button>').join('') + '</div><p id="v53cQf" class="v53cLes" hidden></p></div>'; }
  else if(k === 'call'){
    h = H('☎️ Số điện thoại khẩn cấp', 'Emergency numbers') + '<div class="v53cNums"><div><b>113</b><span>👮 Công an</span></div><div><b>114</b><span>🚒 Cứu hỏa & cứu nạn</span></div><div><b>115</b><span>🚑 Cấp cứu</span></div></div>' +
      '<ol class="v51pHelp"><li>📞 Gọi khi <b>thật sự khẩn cấp</b>. Không gọi đùa — người khác đang cần giúp!</li><li>🗣️ Nói rõ: <b>chuyện gì</b> xảy ra, <b>ở đâu</b>, <b>tên mình</b>.</li><li>🧑‍🤝‍🧑 Em nhỏ hãy nhờ <b>người lớn</b> gọi giúp và đứng ở nơi an toàn.</li></ol><div class="v51pFt"><button type="button" class="v51pGo" data-a="callq">🎯 Chơi: gọi đúng số</button></div>'; }
  else if(k === 'rest'){ const pick = V53C.plate || (V53C.plate = []);
    h = H('🍽️ Nhà hàng Mây · Tầng 61', 'Sky Restaurant') + '<p class="v53cNote">Ngắm đảo từ trên cao và chọn <b>3 món</b> cho một khay cơm <b>cân bằng</b>: có rau, có đạm, có tinh bột.</p><div class="v53cFood">' +
      V53C_FOOD.map((f, i) => '<button type="button" data-f="' + i + '" class="' + (pick.includes(i) ? 'on' : '') + '"><i>' + f.ic + '</i>' + f.vi + '<small>' + V53C_FG[f.g] + '</small></button>').join('') + '</div><div class="v51pFt"><button type="button" class="v51pGo" data-a="eat"' + (pick.length === 3 ? '' : ' disabled') + '>🍽️ Ăn thôi (' + pick.length + '/3)</button><button type="button" data-a="down">🛗 Đi xuống</button></div>'; }
  p.innerHTML = '<div class="v51pBox">' + h + '</div>';
  p.querySelectorAll('[data-x]').forEach(b => b.onclick = () => v53cPanel(null));
  p.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { const i = +b.dataset.m; if(V53C.mode !== 'drive' || V53C.drv !== 'police'){ if(!v53cDrive('police')) return; } v53cMisStart(i); });
  p.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { const a = b.dataset.a; v53cSnd('tap');
    if(a === 'drive') v53cDrive(k === 'fire' ? 'fire' : 'police'); else if(a === 'mg'){ v53cPanel(null); v53cMgOpen(v53cPick(['kitchen', 'forest', 'plane'])); } else if(a === 'call') v53cPanel('call');
    else if(a === 'drill'){ V53C.drill = true; v53cPanel(null); toast('✈️ Lần bay tới, khoảng 20 giây sau khi cất cánh sẽ có bài tập sự cố. Ra Sân bay Rubik để bay nhé!'); }
    else if(a === 'f81'){ v53cPanel(null); v53cTowerGo(81); } else if(a === 'f61'){ v53cPanel(null); v53cTowerGo(61); } else if(a === 'again'){ const f = o.again; p.hidden = true; V53C.panelK = null; f(); }
    else if(a === 'callq') v53cCallQuiz(); else if(a === 'down'){ V53C.plate = []; v53cPanel(null); } else if(a === 'eat') v53cEat(); });
  p.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { const i = +b.dataset.f, P = V53C.plate; const j = P.indexOf(i); if(j >= 0) P.splice(j, 1); else if(P.length < 3) P.push(i); v53cSnd('pick', .6); v53cPanel('rest'); });
  p.querySelectorAll('[data-q]').forEach(b => b.onclick = () => o.pick(+b.dataset.q, b));
  const pc = p.querySelector('#v53cPrev'); if(pc) try { const g = pc.getContext('2d'), id = k, G = v53cGeo(id), b = v53cSprOf(id); g.imageSmoothingEnabled = false;
    if(id === 'tower81'){ const s = Math.min(pc.width/b.width, pc.height/b.height); g.drawImage(b, (pc.width - b.width*s)/2, pc.height - b.height*s, b.width*s, b.height*s); }
    else { g.fillStyle = '#8fc56a'; g.fillRect(0, 0, pc.width, pc.height); const s = Math.min(pc.width/b.width, pc.height/b.height); g.drawImage(b, (pc.width - b.width*s)/2, (pc.height - b.height*s)/2, b.width*s, b.height*s); } } catch(e){}
}
function v53cMisPanel(){ v53cPanel('mis'); }
// câu đố chung: q = [{t, o:[...], a, ic}] → cb(ok)
function v53cAsk(title, q, cb, need){
  let i = 0, right = 0; const show = () => v53cPanel('quiz', {title, q, i, pick:(c, btn) => { const Q = q[i], ok = c === Q.a, f = document.getElementById('v53cQf');
    document.querySelectorAll('#v53cPanel [data-q]').forEach((b, j) => { b.disabled = true; if(j === Q.a) b.classList.add('ok'); else if(j === c) b.classList.add('no'); });
    if(ok){ right++; v53cSnd('ok'); } else v53cSnd('bad'); if(f){ f.hidden = false; f.textContent = (ok ? '✅ Đúng rồi! ' : '💡 Đáp án: ') + (Q.why || Q.o[Q.a]); }
    setTimeout(() => { i++; if(i < q.length) show(); else { V53C.panelK = null; cb(right >= (need || q.length), right); } }, ok ? 1100 : 2000); }});
  show();
}
function v53cQuiz(kind, cb){ const Q = v53cShuffle(V53C_QZ[kind]).map(x => { const o = v53cShuffle(x[1].map((s, j) => [s, j])); return {t:x[0], o:o.map(z => z[0]), a:o.findIndex(z => z[1] === x[2])}; });
  v53cAsk(kind === 'cross' ? '🚸 Giúp các bạn qua đường' : '🚦 Điều tiết giao thông', Q, ok => cb(ok), 2); }
function v53cCallQuiz(){
  const Q = v53cShuffle(V53C_CALLQ).slice(0, 5).map(x => ({ic:x[0], t:x[1] + ' — gọi số nào?', o:['113 👮 Công an', '114 🚒 Cứu hỏa', '115 🚑 Cấp cứu'], a:x[2] - 113, why:{113:'113: Công an giúp đỡ, giữ an toàn.', 114:'114: Cứu hỏa và cứu nạn, cứu hộ.', 115:'115: Cấp cứu y tế, có xe cứu thương.'}[x[2]]}));
  v53cAsk('☎️ Gọi đúng số', Q, (ok, n) => { const r = v53cReward('call', n/5, 'Học số khẩn cấp'); v53cPanel('done', {ic:'☎️', t:'Đúng ' + n + '/5 câu!', r, lesson:'113 Công an · 114 Cứu hỏa & cứu nạn · 115 Cấp cứu. Gọi khi thật sự cần, nói rõ chuyện gì, ở đâu, tên mình.', again:v53cCallQuiz}); if(ok) setTimeout(() => v53cBadge('call'), 500); });
}
function v53cEat(){
  const P = V53C.plate || [], G = new Set(P.map(i => V53C_FOOD[i].g)), ok = G.has('rau') && G.has('dam') && G.has('bot'); V53C.plate = [];
  const r = ok ? v53cReward('rest', .5, 'Bữa ăn cân bằng') : null; v53cSnd(ok ? 'win' : 'bad');
  v53cPanel('done', {ic:ok ? '🥗' : '🍟', t:ok ? 'Khay cơm cân bằng! Ăn ngon miệng nhé.' : 'Khay này còn thiếu ' + ['rau', 'dam', 'bot'].filter(g => !G.has(g)).map(g => V53C_FG[g]).join(', '), r, lesson:'Mỗi bữa nên có rau xanh, đạm (cá, trứng, đậu, thịt) và tinh bột (cơm, khoai). Đồ chiên và nước ngọt chỉ thỉnh thoảng thôi.', again:() => { v53cRestOn(); }});
  V53C.mode = 'rest';
}
function v53cOpen(id){ v53cSnd('tap'); v53cPanel(id); }

// ---------- 3. mini game dập lửa (toàn màn hình) ----------
const V53C_MGS = {kitchen:{ic:'🏠', vi:'Nhà bếp'}, forest:{ic:'🌲', vi:'Bìa rừng'}, plane:{ic:'✈️', vi:'Máy bay'}};
function v53cMgOpen(kind, fire){
  let R = document.getElementById('v53cMgR'); if(!R){ R = document.createElement('div'); R.id = 'v53cMgR';
    R.innerHTML = '<canvas id="v53cMgC"></canvas><div class="v53cMgTop"><button type="button" class="v51pIb" id="v53cMgM" aria-label="Đổi cảnh"></button><div id="v53cMgS"></div><button type="button" class="v51pIb" id="v53cMgH" aria-label="Hướng dẫn">?</button><button type="button" class="v51pIb" id="v53cMgX" aria-label="Thoát">✕</button></div><div id="v53cMgEnd" hidden></div><div id="v53cMgHelp" hidden></div>';
    (document.getElementById('stage') || document.body).appendChild(R);
    R.querySelector('#v53cMgX').onclick = () => v53cMgClose(); R.querySelector('#v53cMgH').onclick = () => { const h = document.getElementById('v53cMgHelp'); h.hidden = !h.hidden; };
    R.querySelector('#v53cMgM').onclick = () => { if(V53C.mg && V53C.mg.fire) return; const L = Object.keys(V53C_MGS), k = L[(L.indexOf(V53C.mg.k) + 1) % L.length]; v53cMgStart(k, null); };
    const c = R.querySelector('#v53cMgC'), pos = e => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    c.addEventListener('pointerdown', e => { const M = V53C.mg; if(!M || M.done) return; M.aim = pos(e); M.hold = true; try { c.setPointerCapture(e.pointerId); } catch(er){} e.preventDefault(); });
    c.addEventListener('pointermove', e => { const M = V53C.mg; if(M && M.hold) M.aim = pos(e); });
    const up = () => { const M = V53C.mg; if(M) M.hold = false; }; c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up); }
  R.hidden = false; document.body.classList.add('v53cMgOn'); v53cMgStart(kind, fire);
}
function v53cMgStart(kind, fire){
  const c = document.getElementById('v53cMgC'), W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1); c.width = W*dpr; c.height = H*dpr; c.style.width = W + 'px'; c.style.height = H + 'px';
  const fl = [], n = kind === 'kitchen' ? 5 : kind === 'forest' ? 7 : 4, P = V53C_PHI;
  for(let i = 0; i < n; i++){ let x, y; if(kind === 'kitchen'){ x = W*(.3 + (i % 3)*.2) + (i > 2 ? W*.1 : 0); y = H*(i > 2 ? .44 : .62); } else if(kind === 'forest'){ x = W*(.12 + i*.125); y = H*(.56 + ((i*37) % 5)*.03); } else { x = W*(.36 + i*.09); y = H*(.6 - (i % 2)*.05); }
    fl.push({x, y, hp:1, s:Math.min(W, H)*(.09 + ((i*13) % 4)*.012)}); }
  V53C.mg = {k:kind, fire, fl, t:0, tank:100, hold:false, aim:null, drops:[], puffs:[], done:false, dpr, W, H, nz:[W*.18, H*(1 - 1/P/P/P)], last:performance.now()};
  document.getElementById('v53cMgM').textContent = V53C_MGS[kind].ic; document.getElementById('v53cMgEnd').hidden = true;
  const hp = document.getElementById('v53cMgHelp'); hp.hidden = true; hp.innerHTML = '<b>💦 Cách chơi</b><ol><li>Chạm và giữ để phun nước, kéo ngón tay để nhắm.</li><li>Nhắm vào <b>gốc lửa</b> (phần dưới) — tắt nhanh gấp đôi!</li><li>Bình nước 💧 cạn thì thả tay để bơm lại.</li></ol>' + (kind === 'kitchen' ? '<p>🍳 Chảo dầu bốc cháy: <b>không đổ nước</b>! Tắt bếp, đậy vung, gọi người lớn.</p>' : '') + '<p>🧒 Ngoài đời: em <b>không tự dập lửa</b>. Ra ngoài ngay, báo người lớn, gọi <b>114</b>.</p>';
  if(!V53C.mgRaf) V53C.mgRaf = requestAnimationFrame(v53cMgFrame);
}
function v53cMgClose(silent){ const R = document.getElementById('v53cMgR'); if(R) R.hidden = true; document.body.classList.remove('v53cMgOn'); V53C.mg = null; if(V53C.mgRaf){ cancelAnimationFrame(V53C.mgRaf); V53C.mgRaf = 0; } }
function v53cMgFrame(now){
  const M = V53C.mg; if(!M){ V53C.mgRaf = 0; return; } V53C.mgRaf = requestAnimationFrame(v53cMgFrame); const dt = Math.min(.05, (now - M.last)/1000); M.last = now;
  const c = document.getElementById('v53cMgC'), g = c.getContext('2d'), W = M.W, H = M.H; g.setTransform(M.dpr, 0, 0, M.dpr, 0, 0); g.imageSmoothingEnabled = false;
  if(!M.done){ M.t += dt; const spray = M.hold && M.tank > 0 && M.aim;
    if(spray){ M.tank = Math.max(0, M.tank - 10*dt); for(let i = 0; i < 3; i++) M.drops.push({t:0, life:.45 + Math.random()*.1, tx:M.aim[0] + (Math.random() - .5)*18, ty:M.aim[1] + (Math.random() - .5)*18}); if(Math.random() < dt*6) v53cSnd('spray', .4); }
    else M.tank = Math.min(100, M.tank + (M.hold ? 0 : 16)*dt);
    for(const f of M.fl){ if(f.hp <= 0) continue; let hit = 0; if(spray){ const dx = M.aim[0] - f.x, dy = M.aim[1] - (f.y - f.s*.5), d = Math.hypot(dx, dy); if(d < f.s*.9) hit = M.aim[1] > f.y - f.s*.45 ? 2 : 1; }
      if(hit){ f.hp -= .55*hit*dt; if(Math.random() < dt*8) M.puffs.push({x:f.x, y:f.y - f.s*.6, t:0, life:1.4, w:true}); } else f.hp = Math.min(1, f.hp + .05*dt);
      if(f.hp <= 0){ f.hp = 0; v53cSnd('pick', .7); for(let i = 0; i < 6; i++) M.puffs.push({x:f.x + (Math.random() - .5)*f.s*.6, y:f.y - f.s*.3, t:0, life:1.6, w:true}); }
      if(Math.random() < dt*3) M.puffs.push({x:f.x, y:f.y - f.s, t:0, life:2, w:false}); }
    if(M.fl.every(f => f.hp <= 0)) v53cMgWin(); }
  // nền theo cảnh
  const night = typeof lightLevel === 'function' && lightLevel() > .35, sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, night ? '#141b3d' : '#7ec8f0'); sky.addColorStop(1, night ? '#3a3f6a' : '#cfeefc'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  const gy = H*(1 - 1/V53C_PHI/V53C_PHI); g.fillStyle = M.k === 'plane' ? '#5d6068' : '#5fae4f'; g.fillRect(0, gy, W, H - gy); g.fillStyle = M.k === 'plane' ? '#f4f4f0' : '#4d9a41'; if(M.k === 'plane') for(let x = 0; x < W; x += 80) g.fillRect(x, gy + (H - gy)*.4, 44, 6);
  if(M.k === 'kitchen'){ const x0 = W*.2, x1 = W*.8, top = H*.22; g.fillStyle = '#e9dcc3'; g.fillRect(x0, top + 40, x1 - x0, gy - top - 40); g.fillStyle = '#b8432f'; g.beginPath(); g.moveTo(x0 - 20, top + 44); g.lineTo(W/2, top - 30); g.lineTo(x1 + 20, top + 44); g.fill();
    g.fillStyle = '#6b4a3a'; g.fillRect(W/2 - 30, gy - 90, 60, 90); for(const [x, y] of [[.3, .44], [.5, .44], [.7, .44], [.3, .62], [.7, .62]]){ g.fillStyle = '#3a2a22'; g.fillRect(W*x - 34, H*y - 50, 68, 54); } }
  else if(M.k === 'forest'){ for(let i = 0; i < 9; i++){ const x = W*(i/8), h = H*.22; g.fillStyle = '#6b4a2a'; g.fillRect(x - 6, gy - h*.5, 12, h*.5); g.fillStyle = '#2f7a3a'; g.beginPath(); g.moveTo(x, gy - h*1.3); g.lineTo(x - h*.35, gy - h*.4); g.lineTo(x + h*.35, gy - h*.4); g.fill(); } }
  else { const y = H*.52, L = W*.6, x = W*.2; g.fillStyle = '#f4f6fb'; g.fillRect(x, y - 20, L, 40); g.fillStyle = '#2f7ad8'; g.fillRect(x + L*.35, y - 80, L*.2, 160); g.fillStyle = '#7fd0ff'; g.fillRect(x + L*.82, y - 12, L*.1, 24); g.fillStyle = '#2f7ad8'; g.fillRect(x - 10, y - 50, 40, 100); }
  // lửa + khói + nước
  for(const f of M.fl){ if(f.hp <= 0) continue; const img = v53cFlameSpr(Math.floor(M.t*10 + f.x) % 4), s = f.s*(.45 + f.hp*.65); g.drawImage(img, f.x - s*.38, f.y - s, s*.75, s); }
  M.puffs = M.puffs.filter(p => (p.t += dt) < p.life); for(const p of M.puffs){ const a = p.t/p.life, r = 14 + a*40; g.globalAlpha = (1 - a)*.6; g.drawImage(v53cPuffSpr(!p.w), p.x - r + a*20, p.y - r - a*70, r*2, r*2); } g.globalAlpha = 1;
  const [nx, ny] = M.nz; M.drops = M.drops.filter(d => (d.t += dt) < d.life); g.fillStyle = '#9fdcff'; for(const d of M.drops){ const a = d.t/d.life, x = nx + (d.tx - nx)*a, y = ny + (d.ty - ny)*a - Math.sin(a*Math.PI)*60; g.fillRect(x - 3, y - 3, 6, 6); }
  // lính cứu hỏa cầm vòi (chính là mình) ở góc dưới trái
  g.save(); g.translate(nx - 30, ny + 40); g.scale(2.2, 2.2); v53cCrew(g, 0, 0, 'fire', 1, 0, false, M.t); g.restore(); g.strokeStyle = '#e8e8ee'; g.lineWidth = 6; g.beginPath(); g.moveTo(nx - 60, H); g.quadraticCurveTo(nx - 40, ny + 10, nx, ny); g.stroke();
  g.fillStyle = '#c8221b'; g.fillRect(nx - 6, ny - 6, 14, 12);
  if(M.aim && M.hold && !M.done){ g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 3; g.beginPath(); g.arc(M.aim[0], M.aim[1], 18, 0, 7); g.stroke(); }
  const left = M.fl.filter(f => f.hp > 0).length, s = '🔥 ' + left + ' · 💧 ' + Math.round(M.tank) + '% · ⏱ ' + Math.floor(M.t) + 's', e = document.getElementById('v53cMgS'); if(e && e._s !== s){ e._s = s; e.textContent = s; }
}
function v53cMgWin(){
  const M = V53C.mg; M.done = true; const st = M.t < 15 ? 3 : M.t < 25 ? 2 : 1, r = v53cReward('mg', st/3, 'Dập lửa'), best = v53cState().best; const b0 = best.mg; if(b0 == null || M.t < b0){ best.mg = Math.round(M.t*10)/10; v53cSave(); }
  if(M.fire) v53cFireOut(M.fire, true); v53cSnd('win'); setTimeout(() => v53cBadge('fire'), 900);
  const E = document.getElementById('v53cMgEnd'); E.hidden = false; E.innerHTML = '<div class="v51pStars">' + '★'.repeat(st) + '<i>' + '★'.repeat(3 - st) + '</i></div><b>Đã dập tắt hết lửa trong ' + M.t.toFixed(1) + ' giây!</b><span>+$' + r.money + ' · +' + r.exp + ' EXP · Kỷ lục ' + best.mg + 's</span><p>💡 ' + (M.k === 'kitchen' ? 'Chảo dầu cháy: không đổ nước — tắt bếp, đậy vung.' : 'Nhắm vào gốc lửa để dập nhanh hơn.') + ' Ngoài đời: ra ngoài, báo người lớn, gọi 114.</p><button type="button" class="v51pGo" id="v53cMgA">Play again</button>';
  E.querySelector('#v53cMgA').onclick = () => v53cMgStart(M.fire ? v53cPick(['kitchen', 'forest', 'plane']) : M.k, null);
}

// ---------- 4. cài đặt: bật/tắt sự cố bất ngờ ----------
function v53cSettingsUi(){
  const m = document.querySelector('#mSet .mbox'); if(!m || document.getElementById('v53cSetBox')) return; const d = document.createElement('section'); d.id = 'v53cSetBox'; d.className = 'v39vol';
  d.innerHTML = '<h3>🚨 Thành phố an toàn</h3><label class="chk"><input type="checkbox" id="v53cInc"> Sự cố bất ngờ (hiếm): máy bay bốc khói, cháy nhỏ — luôn kết thúc an toàn (mặc định tắt)</label>';
  const v = document.getElementById('v39Vol'); (v && v.nextSibling) ? m.insertBefore(d, v.nextSibling) : m.appendChild(d);
  const i = d.querySelector('#v53cInc'); i.checked = !!v53cSet().inc; i.onchange = () => { v53cSet().inc = i.checked; v53cSetSave(); toast(i.checked ? '🚨 Đã bật sự cố bất ngờ.' : '🔕 Đã tắt sự cố bất ngờ.'); };
}

// ---------- 5. khởi động (gọi trong extFinalInit sau v51tInit) ----------
function v53cInit(){
  if(typeof V46 === 'undefined' || !V46.on) return;
  v53cWorldInit(); v53cVehInit(); v53cPlaneInit();
  addEventListener('keydown', e => v53cKey(e, true), true); addEventListener('keyup', e => v53cKey(e, false), true); addEventListener('blur', () => { V53C.k = {}; });
  const vr0 = v46Render; v46Render = function(dt){ vr0(dt); try { if(V53C.mode === 'drive' || V53C.em || V53C.guide) v53cOverlay(); } catch(e){ console.warn('v53c overlay', e); } };
  const r0 = render; render = function(dt){ if(V46.on && !V46.sky){ if(V53C.mode === 'drive') v53cCam(dt); else if(V53C.mode === 'deck' || V53C.mode === 'rest') v53cDeckCam(dt); if(V53C.mode) v53cFps(dt); } return r0(dt); };
  const eu0 = extUpdate; extUpdate = function(dtR){ if(V46.on && !V46.sky){ try { if(V53C.mode === 'drive') v53cDriveTick(dtR); v53cVehTick(dtR); v53cFireTick(dtR); } catch(e){ console.warn('v53c tick', e); } } return eu0(dtR); };
  // người chơi "ở trong xe / trên tháp": không vẽ, không đi, không lên thuyền / khinh khí cầu
  if(typeof drawLabels === 'function'){ const dl0 = drawLabels; drawLabels = function(){ if(!V53C.mode || !PLAYER) return dl0.apply(this, arguments); const v = PLAYER.visible; PLAYER.visible = false; try { return dl0.apply(this, arguments); } finally { PLAYER.visible = v; } }; }
  const dp0 = drawPerson; drawPerson = function(a){ if(V53C.mode && a === PLAYER) return; return dp0.apply(this, arguments); };
  const ow0 = openWorldTick; openWorldTick = function(dt){ if(V53C.mode) return; return ow0(dt); };
  const bb0 = boardBoat; boardBoat = function(){ if(V53C.mode){ v53cMsg('🚗 Xuống xe rồi mới lên thuyền nhé!'); return; } return bb0.apply(this, arguments); };
  const ft0 = flyToggle; flyToggle = function(){ if(V53C.mode){ v53cMsg('🚗 Xuống xe rồi mới bay nhé!'); return; } return ft0.apply(this, arguments); };
  // cài đặt (menu v39 gán lại showModal lúc khởi động nên bọc ở đây)
  const sm0 = showModal; showModal = function(id){ const r = sm0.apply(this, arguments); if(id === 'mSet') setTimeout(v53cSettingsUi, 30); return r; };
  // menu: thêm mục
  if(typeof v32Items === 'function'){ const mi = v32Items; v32Items = function(){ const L = mi(); L.push({ic:'map', en:'Fire Station', vi:'🚒 Trạm cứu hỏa 114', grp:'world', f:() => v53cGuide('fire')}, {ic:'map', en:'Police', vi:'🚓 Đồn cảnh sát 113', grp:'world', f:() => v53cGuide('police')}, {ic:'map', en:'Tower 81', vi:'🏙️ Tháp Rubik 81', grp:'world', f:() => v53cGuide('tower81')}); return L; }; }
  setInterval(() => { try { v53cHud(); v53cIncTick(); } catch(e){} }, 250);
  setInterval(() => { try { v53cIncTick(); } catch(e){} }, 1000);
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v53c = {V53C, v53cDrive, v53cExit, v53cSpawnFire, v53cEmStart, v53cTowerGo, v53cMgOpen, v53cGeo, v53cPanel, v53cMisStart};
}
// tự đi bộ tới cửa khu (dùng đường có sẵn nếu có), hoặc báo hướng
function v53cGuide(id){
  const G = v53cGeo(id), D = V53C_Z[id]; V53C.guide = {id, until:realT + 120}; if(typeof PLAYER === 'undefined' || !PLAYER || !PLAYER.visible){ toast(D.ic + ' Vào thế giới để đi tới ' + D.vi + ' nhé!'); return; }
  const p = v46Pos(PLAYER); toast(D.ic + ' ' + D.vi + ' cách ' + Math.round(Math.hypot(G.cx - p[0], G.cy - p[1])/10) + ' m. Mũi tên vàng sẽ chỉ đường!');
}
function v53cFps(dt){ V53C.fpsN++; V53C.fpsT += dt; if(V53C.fpsT >= 1){ V53C.fps = V53C.fpsN/V53C.fpsT; V53C.fpsN = 0; V53C.fpsT = 0; } }
