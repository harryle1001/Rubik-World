// ================= v67l · LƯƠNG CỦA EM 3/4: DIỄN VĂN NGHỆ trên sân khấu Hội trường lớn =================
// Lên sân khấu → chọn tiết mục (hát, đàn, múa, kể chuyện) → mini game nhịp điệu ngắn: chạm 3 làn đúng lúc nốt chạm vạch.
// Khán giả là học sinh vỗ tay theo độ chính xác, cuối bài chấm 0–3 sao → công 🎤 Văn nghệ. Người diễn vẽ bằng drawBody (v66c).
// Bố cục tỷ lệ vàng: màn dọc — sân khấu 38,2% trên, làn nốt 61,8% dưới; màn ngang — sân khấu 61,8% trái, làn nốt bên phải.
const V67L_ACTS = [
  {k:'sing', ic:'🎤', n:'Hát', t:'Ngôi trường tỷ lệ vàng', v:'flute', base:72, bpm:96, tip:'Hát đúng nhịp: các phách đều nhau như tiếng tim đập.',
    sub:['🎵 Sân trường nắng vàng tươi', '🎵 Bạn bè cùng vui chơi', '🎵 Học hay và chăm ngoan', '🎵 Rubik xoay muôn màu', '🎵 Một, hai, ba — φ!', '🎵 Trường em đẹp nhất nhà!']},
  {k:'piano', ic:'🎹', n:'Đàn piano', t:'Khúc nhạc ban mai', v:'piano', base:60, bpm:104, tip:'Gam ngũ cung có 5 nốt: Đô, Rê, Mi, Son, La.',
    sub:['🎹 Đô – Rê – Mi', '🎹 Son – La – Son', '🎹 Mi – Rê – Đô', '🎹 Tay trái giữ nhịp', '🎹 Tay phải bay bổng', '🎹 Kết bài thật nhẹ…']},
  {k:'dance', ic:'💃', n:'Múa', t:'Điệu múa hoa sen', v:'marimba', base:67, bpm:112, tip:'Múa giúp cơ thể dẻo dai và tự tin hơn.',
    sub:['💃 Nhún chân!', '💃 Xoay một vòng!', '💃 Vỗ tay hai cái!', '💃 Dang tay như cánh sen', '💃 Bước sang trái, sang phải', '💃 Cúi chào khán giả!']},
  {k:'story', ic:'📖', n:'Kể chuyện', t:'Thỏ và Rùa', v:'kalimba', base:64, bpm:88, tip:'Truyện ngụ ngôn: chậm mà chắc, kiên trì sẽ thành công.',
    sub:['📖 Thỏ chế giễu Rùa chạy chậm…', '📖 Hai bạn thi chạy tới gốc đa.', '📖 Thỏ chạy nhanh rồi lăn ra ngủ.', '📖 Rùa cứ đi đều, không dừng lại.', '📖 Rùa về đích trước!', '📖 Chậm mà chắc — kiên trì sẽ thắng.']}
];
const V67L_LANE = ['#ff6b8b', '#ffd23f', '#5ec8ff'];
const V67S = {on:false, el:null, cv:null, g:null, W:0, H:0, dpr:1, act:null, notes:[], t0:0, raf:0, st:'pick', score:0, combo:0, best:0, hit:0, n:0, clap:0, fx:[], aud:[], lastBeat:-1, res:null, near:false, lay:null, dur:0};

function v67lStageCss(){ return `
#v67lStage{position:fixed;inset:0;z-index:94;background:#140a14;font-family:Nunito,sans-serif;color:#fff;touch-action:none;user-select:none;-webkit-user-select:none}
#v67lStage canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#v67lStage .v67sTop{position:absolute;left:0;right:0;top:0;height:56px;padding:max(6px,env(safe-area-inset-top)) 10px 0;display:flex;align-items:center;gap:10px;background:linear-gradient(rgba(20,8,20,.92),rgba(20,8,20,0));z-index:2}
#v67lStage .v67sTop b{font-size:19px;font-weight:900;text-shadow:0 2px 0 #000;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#v67lStage .v67sX{flex:none;width:48px;height:48px;border-radius:50%;border:3px solid #2b1a10;background:#f6ecd2;color:#2b1a10;font:900 22px Nunito,sans-serif;cursor:pointer}
#v67lStage .v67sBox{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(520px,calc(100% - 24px));max-height:calc(100% - 70px);overflow:auto;z-index:3;padding:16px;border-radius:20px;background:#f6ecd2;color:#2b1a10;border:4px solid #2b1a10;box-shadow:0 0 0 4px #c0396b,0 20px 50px rgba(0,0,0,.6)}
#v67lStage .v67sBox h2{margin:0 0 4px;font-size:23px;font-weight:900;color:#7a1a42}#v67lStage .v67sBox p{margin:6px 0;font-size:17px;line-height:1.45}
#v67lStage .v67sActs{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
#v67lStage .v67sActs button{display:block!important;min-height:96px;padding:10px;border-radius:16px;border:3px solid #2b1a10;background:#fff;font:900 18px Nunito,sans-serif;color:#2b1a10;cursor:pointer;text-align:left;box-shadow:0 4px 0 #2b1a10}
#v67lStage .v67sActs button span{display:block;font-size:34px;line-height:1.1}#v67lStage .v67sActs button small{display:block;font-size:16px;font-weight:800;color:#7a6048}
#v67lStage .v67sStars{font-size:46px;letter-spacing:6px;text-align:center;color:#ffb703;text-shadow:0 3px 0 #2b1a10}#v67lStage .v67sStars i{color:#d8c7a6;font-style:normal}
#v67lStage .v67sRow{display:grid;grid-template-columns:1fr 1.618fr;gap:10px;margin-top:12px}
#v67lStage .v67sBig{text-align:center;font-size:38px;font-weight:900;color:#7a1a42}
#v67lStage .v67sGo{display:block;width:100%;min-height:56px;border-radius:16px;border:3px solid #2b1a10;background:linear-gradient(#ff8fb1,#d6336c);font:900 19px Nunito,sans-serif;color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.3);cursor:pointer;box-shadow:0 4px 0 #2b1a10}
#v67lStage .v67sGo.w{background:#fff;color:#2b1a10;text-shadow:none}
`; }

// ---------- 1. vào / ra ----------
function v67lHallEntry(){ try { const z = V46.ZI.hall; if(!z) return null; const p = v46Entry(z); return p; } catch(e){ return null; } }
function v67lStageGo(){
  if(typeof PLAYER === 'undefined' || !PLAYER || !PLAYER.visible || typeof V46 === 'undefined' || !V46.on){ v67lStageOpen(); return; }
  const e = v67lHallEntry(); if(!e){ v67lStageOpen(); return; }
  const p = v46Pos(PLAYER); if(Math.hypot(p[0] - e[0], p[1] - e[1]) < 220){ v67lStageOpen(); return; }
  try { const o = v46ToOld(e[0], e[1] + 14); v32Nav(o[0], o[1], 'Hội trường lớn', true, () => v67lStageOpen()); v67lPop('🎤 Đang đi tới sân khấu Hội trường lớn…'); } catch(err){ v67lStageOpen(); }
}
function v67lStageOpen(){
  let r = V67S.el; if(!r){ r = document.createElement('div'); r.id = 'v67lStage'; r.innerHTML = '<canvas></canvas><div class="v67sTop"><b>🎤 Sân khấu Hội trường lớn</b><button type="button" class="v67sX" aria-label="Đóng">✕</button></div><div class="v67sBox" hidden></div>';
    document.body.appendChild(r); V67S.el = r; V67S.cv = r.querySelector('canvas'); V67S.g = V67S.cv.getContext('2d'); r.querySelector('.v67sX').onclick = v67lStageClose; v67lStageInput(V67S.cv); addEventListener('resize', () => { if(V67S.on) v67lStageSize(); }); }
  r.hidden = false; V67S.on = true; document.body.classList.add('v67lFull'); v67lStageSize(); v67lAud(); v67lPick();
  try { if(typeof drag !== 'undefined') drag = null; } catch(e){}
  if(!V67S.raf) V67S.raf = requestAnimationFrame(v67lStageFrame);
}
function v67lStageClose(){ V67S.on = false; V67S.st = 'pick'; if(V67S.el) V67S.el.hidden = true; document.body.classList.remove('v67lFull'); if(V67S.raf){ cancelAnimationFrame(V67S.raf); V67S.raf = 0; } }
function v67lStageSize(){
  const W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1), c = V67S.cv; V67S.W = W; V67S.H = H; V67S.dpr = dpr; c.width = Math.round(W*dpr); c.height = Math.round(H*dpr);
  const top = 56, port = H > W*1.05;
  if(port){ const sh = Math.round(Math.min(W*198/320, (H - top)*.382)); V67S.lay = {sc:{x:0, y:top, w:W, h:sh}, ln:{x:0, y:top + sh, w:W, h:H - top - sh}}; }
  else { const sw = Math.round(W - Math.min(W*.382, 480)); V67S.lay = {sc:{x:0, y:top - 6, w:sw, h:H - top + 6}, ln:{x:sw, y:top, w:W - sw, h:H - top}}; }
}
// khán giả: 3 hàng học sinh nhìn từ phía sau
function v67lAud(){ if(V67S.aud.length) return; for(let r = 0; r < 3; r++) for(let i = 0; i < 9 - r; i++){ const L = typeof lookFor === 'function' ? lookFor(r*9 + i + 3) : {shirt:'#3d7bff', hair:'#222', skin:'#f1c27d'}; V67S.aud.push({x:26 + i*34 + r*17 + (r === 1 ? 4 : 0), y:176 + r*9, L, ph:Math.random()*6, r}); } }

// ---------- 2. màn chọn tiết mục / kết quả ----------
function v67lBox(html){ const b = V67S.el.querySelector('.v67sBox'); if(html == null){ b.hidden = true; return null; } b.innerHTML = html; b.hidden = false; return b; }
function v67lPick(){
  V67S.st = 'pick'; V67S.act = null; const s = v67lState(), left = V67L_CAP - s.today.art;
  const b = v67lBox(`<h2>🎭 Chọn tiết mục văn nghệ</h2><p>Lên sân khấu biểu diễn cho các bạn xem! Chạm vào làn khi nốt chạm vạch sáng. Đúng nhịp nhiều thì khán giả vỗ tay to và em được nhiều sao.</p>
    <div class="v67sActs">${V67L_ACTS.map(a => `<button type="button" data-a="${a.k}"><span>${a.ic}</span>${a.n}<small>“${a.t}”</small></button>`).join('')}</div>
    <p style="font-size:16px;color:#6a5038">🎤 Công văn nghệ hôm nay: ${s.today.art}/${V67L_CAP}${left <= 0 ? ' — đã đủ công, em vẫn diễn vui được nhé!' : ' · 1 sao = 1 công'}</p>`);
  b.querySelectorAll('[data-a]').forEach(x => x.onclick = () => v67lStart(V67L_ACTS.find(a => a.k === x.dataset.a)));
}
function v67lStart(A){
  v67lBox(null); V67S.act = A; V67S.st = 'play'; V67S.score = 0; V67S.combo = 0; V67S.best = 0; V67S.hit = 0; V67S.fx = []; V67S.clap = 0; V67S.lastBeat = -1;
  // bài nhạc ngắn ~22 giây: nốt theo phách, thỉnh thoảng nửa phách, 3 làn (thấp · giữa · cao) — giai điệu ngũ cung tự sinh
  const beat = 60/A.bpm, n = Math.floor(20/beat), N = []; let seed = A.k.length*977 + 13; const rnd = () => (seed = (seed*16807) % 2147483647)/2147483647;
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19];
  for(let i = 4; i < n + 4; i++){ const ln = Math.floor(rnd()*3); N.push({t:i*beat, ln, m:A.base + PENTA[ln*3 + Math.floor(rnd()*3)], done:0});
    if(i % 4 === 3 && rnd() < .5) N.push({t:(i + .5)*beat, ln:(ln + 1 + Math.floor(rnd()*2)) % 3, m:A.base + PENTA[Math.floor(rnd()*9)], done:0}); }
  V67S.notes = N; V67S.n = N.length; V67S.dur = (n + 6)*beat; V67S.t0 = performance.now()/1000 + .6;
  try { ensureAC(); } catch(e){}
}
function v67lEnd(){
  V67S.st = 'end'; const A = V67S.act, acc = V67S.n ? V67S.score/(V67S.n*100) : 0, stars = acc >= .8 ? 3 : acc >= .55 ? 2 : acc >= .25 ? 1 : 0, s = v67lState();
  let g = 0; if(stars){ g = v67lAdd('art', stars, 'v67lshow' + Date.now()); s.cnt.show++; V67L.self = 1; try { reward(6 + stars*6, 0, 'Diễn văn nghệ: ' + A.n, true); } catch(e){} V67L.self = 0; v67lSave(); try { cheerSfx(); } catch(e){} }
  V67S.res = {stars, acc}; V67S.clap = stars ? 3 : .6;
  const msg = ['💪 Khán giả vẫn cổ vũ em! Thử lại nhé.', '👏 Khá lắm! Các bạn vỗ tay rồi đó.', '🎉 Hay quá! Cả hội trường vỗ tay rào rào!', '🌟 Xuất sắc! Mọi người đứng dậy vỗ tay!'][stars];
  const b = v67lBox(`<h2>${A.ic} ${A.n} · “${A.t}”</h2><div class="v67sStars">${'★'.repeat(stars)}<i>${'★'.repeat(3 - stars)}</i></div><p style="text-align:center">${msg}</p>
    <div class="v67sRow"><div class="v67sBig">${Math.round(acc*100)}%<small style="display:block;font-size:16px;line-height:1.3;color:#6a5038">đúng nhịp · combo ${V67S.best}</small></div><div><p>${g ? `🎤 +${g} công văn nghệ` : stars ? '🎤 Hôm nay đã đủ công văn nghệ' : '🎤 Cần ít nhất 1 sao để có công'}</p><p style="font-size:16px;color:#6a5038">💡 ${A.tip}</p></div></div>
    <div class="v67sRow"><button type="button" class="v67sGo w" data-x="pick">🎭 Tiết mục khác</button><button type="button" class="v67sGo" data-x="again">🔁 Diễn lại</button></div>`);
  b.querySelector('[data-x="pick"]').onclick = () => v67lPick(); b.querySelector('[data-x="again"]').onclick = () => v67lStart(A);
}

// ---------- 3. chạm theo nhịp ----------
function v67lStageInput(cv){
  const lane = (x, y) => { const L = V67S.lay.ln; if(x < L.x || y < L.y) return -1; return Math.max(0, Math.min(2, Math.floor((x - L.x)/(L.w/3)))); };
  cv.addEventListener('pointerdown', e => { e.preventDefault(); if(V67S.st !== 'play') return; const r = cv.getBoundingClientRect(), l = lane(e.clientX - r.left, e.clientY - r.top); if(l >= 0) v67lTap(l); });
  addEventListener('keydown', e => { if(!V67S.on) return; if(e.key === 'Escape'){ v67lStageClose(); return; } if(V67S.st !== 'play' || e.repeat) return; const m = {a:0, s:1, d:2, j:0, k:1, l:2, ArrowLeft:0, ArrowDown:1, ArrowUp:1, ArrowRight:2}[e.key.length === 1 ? e.key.toLowerCase() : e.key]; if(m != null){ e.preventDefault(); v67lTap(m); } }, true);
}
function v67lNow(){ return performance.now()/1000 - V67S.t0; }
function v67lTap(l){
  const t = v67lNow(); let best = null, bd = .2;
  for(const n of V67S.notes){ if(n.done || n.ln !== l) continue; const d = Math.abs(n.t - t); if(d < bd){ bd = d; best = n; } if(n.t - t > .3) break; }
  V67S.fx.push({k:'tap', ln:l, t:0});
  if(!best){ V67S.combo = 0; return; }
  const q = bd < .09 ? 100 : 60; best.done = q === 100 ? 2 : 1; V67S.score += q; V67S.hit++; V67S.combo++; V67S.best = Math.max(V67S.best, V67S.combo); V67S.clap = Math.min(3, V67S.clap + (q === 100 ? .5 : .3));
  V67S.fx.push({k:q === 100 ? 'Tuyệt!' : 'Tốt!', ln:l, t:0});
  try { const out = sfx(), T = AC.currentTime; v45aVoice(V67S.act.v, best.m, T, .35, .22, out); } catch(e){}
}

// ---------- 4. khung hình ----------
function v67lStageFrame(now){
  if(!V67S.on){ V67S.raf = 0; return; } V67S.raf = requestAnimationFrame(v67lStageFrame);
  const dt = Math.min(.05, V67S.lt ? (now - V67S.lt)/1000 : .016); V67S.lt = now;
  if(V67S.st === 'play'){ const t = v67lNow();
    for(const n of V67S.notes) if(!n.done && t - n.t > .2){ n.done = -1; V67S.combo = 0; V67S.fx.push({k:'Lỡ', ln:n.ln, t:0}); }
    const bt = Math.floor(t*V67S.act.bpm/60); if(bt !== V67S.lastBeat && t > 0 && t < V67S.dur - 1){ V67S.lastBeat = bt; try { const out = sfx(), T = AC.currentTime; v45aVoice('marimba', V67S.act.base - 24 + (bt % 2 ? 7 : 0), T, .2, .07, out); } catch(e){} }
    if(t > V67S.dur) v67lEnd(); }
  V67S.clap = Math.max(V67S.st === 'end' && V67S.res && V67S.res.stars ? 1 : 0, V67S.clap - dt*.6);
  V67S.fx = V67S.fx.filter(f => (f.t += dt) < .7);
  v67lDraw(dt);
}
function v67lDraw(dt){
  const g = V67S.g, W = V67S.W, H = V67S.H, d = V67S.dpr, Ly = V67S.lay; g.setTransform(d, 0, 0, d, 0, 0); g.fillStyle = '#140a14'; g.fillRect(0, 0, W, H);
  const S = Ly.sc, k = Math.min(S.w/320, S.h/198), ox = S.x + (S.w - 320*k)/2, oy = S.y + (S.h - 198*k)/2;
  g.save(); g.beginPath(); g.rect(S.x, S.y, S.w, S.h); g.clip(); g.setTransform(d*k, 0, 0, d*k, d*ox, d*oy); g.imageSmoothingEnabled = false; v67lScene(g); g.restore();
  g.setTransform(d, 0, 0, d, 0, 0); v67lLanes(g, Ly.ln);
}
// sân khấu pixel (đơn vị logic 320×198)
function v67lScene(g){
  const t = performance.now()/1000, R = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); }, A = V67S.act || V67L_ACTS[0], play = V67S.st !== 'pick';
  R('#2a0f24', -200, -40, 720, 300);                                                             // tường hội trường
  R('#3b1530', 30, 8, 260, 112); for(let x = 34; x < 286; x += 12) R('#33122a', x, 8, 2, 112);     // phông nền
  // băng rôn + đèn
  R('#c0396b', 74, 14, 172, 16); R('#2b1a10', 74, 30, 172, 2); g.fillStyle = '#ffe9a8'; g.font = '900 10px Nunito, sans-serif'; g.textAlign = 'center'; g.fillText('VĂN NGHỆ TRƯỜNG RUBIK', 160, 25.5);
  for(let i = 0; i < 9; i++){ const on = (Math.floor(t*4) + i) % 3 === 0; R(on ? '#ffe66b' : '#8a6a30', 46 + i*29, 4, 5, 4); }
  // sàn gỗ
  R('#7a4a26', 0, 120, 320, 30); for(let y = 124; y < 150; y += 6) R('#6a3f20', 0, y, 320, 1); for(let x = 6; x < 320; x += 32) R('#6a3f20', x + ((x/32 | 0) % 2)*16, 120, 1, 30);
  R('#3a1e10', 0, 150, 320, 6); R('#ffd23f', 0, 150, 320, 1);
  // đèn sân khấu chiếu vào người diễn
  const gx = 160, grd = g.createRadialGradient(gx, 132, 4, gx, 132, 62); grd.addColorStop(0, `rgba(255,244,200,${play ? .5 : .32})`); grd.addColorStop(1, 'rgba(255,244,200,0)');
  g.fillStyle = grd; g.beginPath(); g.moveTo(gx - 10, 0); g.lineTo(gx + 10, 0); g.lineTo(gx + 52, 138); g.lineTo(gx - 52, 138); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,240,190,.22)'; g.beginPath(); g.ellipse(gx, 136, 44, 8, 0, 0, 7); g.fill();
  // màn nhung hai bên + diềm
  for(const s of [-1, 1]){ const x0 = s < 0 ? 0 : 320 - 46, sw = Math.sin(t*1.2)*2; R('#a3123a', x0, 0, 46, 150); for(let i = 0; i < 46; i += 8) R('#7d0d2c', x0 + i + sw, 0, 3, 150); R('#ffd23f', s < 0 ? 44 : 276, 60, 3, 10); }
  for(let x = 0; x < 320; x += 20){ R('#a3123a', x, 0, 20, 8); g.fillStyle = '#a3123a'; g.beginPath(); g.arc(x + 10, 8, 10, 0, Math.PI); g.fill(); } R('#ffd23f', 0, 0, 320, 2);
  // đạo cụ theo tiết mục
  const pl = V67S.st === 'play', beat = pl ? (v67lNow()*A.bpm/60) : t*1.4, bob = Math.abs(Math.sin(beat*Math.PI))*2;
  if(A.k === 'sing'){ R('#555', 182, 108, 2, 30); R('#333', 178, 137, 10, 2); R('#222', 180, 104, 6, 6); R('#888', 181, 105, 4, 2); }
  if(A.k === 'piano'){ R('#1b1b1b', 176, 104, 46, 32); R('#2e2e2e', 178, 98, 42, 8); R('#fff', 179, 112, 40, 7); for(let i = 0; i < 8; i++) R('#1b1b1b', 182 + i*5, 112, 2, 4); R('#1b1b1b', 180, 136, 3, 4); R('#1b1b1b', 215, 136, 3, 4); }
  if(A.k === 'story'){ R('#8b5e34', 140, 126, 18, 3); R('#6a4424', 142, 129, 2, 9); R('#6a4424', 154, 129, 2, 9); }
  if(A.k === 'dance' && pl){ for(let i = 0; i < 6; i++){ const a = t*2 + i; g.fillStyle = V67L_LANE[i % 3]; g.globalAlpha = .35; g.beginPath(); g.arc(160 + Math.cos(a)*60, 70 + Math.sin(a*1.3)*30, 6, 0, 7); g.fill(); } g.globalAlpha = 1; }
  // người diễn = nhân vật của em (drawBody) + MC và hai bạn ở cánh gà
  const me = typeof PLAYER !== 'undefined' && PLAYER ? PLAYER : (typeof lookFor === 'function' ? lookFor(1) : {}), look = Object.assign({}, me, {flying:null, boat:null, mount:null, v16fly:null, cycling:false});
  const dir = A.k === 'dance' && pl ? (Math.floor(beat/2) % 2 ? -1 : 1) : (A.k === 'piano' ? 1 : 1);
  const px = A.k === 'piano' ? 160 : A.k === 'dance' && pl ? 160 + Math.sin(beat*Math.PI/2)*14 : 160;
  v67lGuy(g, look, px, 136 - (A.k === 'dance' && pl ? bob*2 : A.k === 'sing' ? bob*.5 : 0), 1.25, dir, A.k === 'dance' && pl, beat*2);
  if(A.k === 'story'){ R('#6a4c93', px + 6, 112, 9, 7); R('#fff', px + 7, 113, 7, 5); }
  if(A.k === 'sing' && pl){ g.fillStyle = '#ffe9a8'; g.font = '900 9px Nunito, sans-serif'; for(let i = 0; i < 3; i++){ const a = (t*.8 + i/3) % 1; g.globalAlpha = 1 - a; g.fillText(i % 2 ? '♫' : '♪', px + 12 + i*6, 106 - a*30); } g.globalAlpha = 1; }
  if(typeof lookFor === 'function'){ v67lGuy(g, Object.assign(lookFor(5), {}), 60, 138, 1.1, 1, false, 0); v67lGuy(g, Object.assign(lookFor(8), {}), 266, 138, 1.1, -1, false, 0);
    if(V67S.clap > .8){ R('#f1c27d', 52, 104 - (Math.floor(t*8) % 2)*2, 3, 3); R('#f1c27d', 66, 104 - (Math.floor(t*8 + 1) % 2)*2, 3, 3); R('#f1c27d', 258, 104 - (Math.floor(t*8) % 2)*2, 3, 3); R('#f1c27d', 272, 104 - (Math.floor(t*8 + 1) % 2)*2, 3, 3); } }
  // khán giả (sau lưng), vỗ tay theo độ chính xác
  R('#1d0b18', -200, 156, 720, 60);
  for(const a of V67S.aud){ const c = V67S.clap > .25 + a.r*.25 + (a.ph % 1)*.3, up = c ? (Math.floor(t*9 + a.ph) % 2) : 0, y = a.y - (c ? 1 : 0), L = a.L;
    R(L.shirt || '#3d7bff', a.x - 7, y - 10, 14, 12); R(L.skin || '#f1c27d', a.x - 5, y - 20, 10, 10); R(L.hair || '#222', a.x - 6, y - 22, 12, L.long ? 14 : 9);
    if(c){ R(L.skin || '#f1c27d', a.x - 9 + up*2, y - 26, 3, 8); R(L.skin || '#f1c27d', a.x + 6 - up*2, y - 26, 3, 8); } }
  if(V67S.clap > 1.4){ g.font = '12px sans-serif'; for(let i = 0; i < 5; i++){ const a = (t*.7 + i/5) % 1; g.globalAlpha = 1 - a; g.fillText('👏', 40 + i*60, 172 - a*36); } g.globalAlpha = 1; }
  if(V67S.st === 'end' && V67S.res && V67S.res.stars >= 2){ for(let i = 0; i < 14; i++){ const a = (t*.5 + i/14) % 1; R(V67L_LANE[i % 3], 20 + i*21 + Math.sin(t + i)*6, a*150, 3, 3); } }
  // phụ đề (lời hát / lời kể / nốt)
  if(pl){ const sub = A.sub[Math.min(A.sub.length - 1, Math.floor(Math.max(0, v67lNow())/(V67S.dur/A.sub.length)))]; g.font = '900 11px Nunito, sans-serif'; g.textAlign = 'center'; const w = g.measureText(sub).width + 14;
    g.fillStyle = 'rgba(20,8,20,.78)'; g.fillRect(160 - w/2, 38, w, 17); g.fillStyle = '#fff'; g.fillText(sub, 160, 50); }
  g.textAlign = 'left';
}
function v67lGuy(g, f, x, y, sc, dir, moving, walk){
  try { if(typeof drawGuy === 'function'){ drawGuy(g, f, x, y, sc, dir, moving, walk); return; } } catch(e){}
  g.fillStyle = f.shirt || '#3d7bff'; g.fillRect(x - 6, y - 22, 12, 14); g.fillStyle = f.skin || '#f1c27d'; g.fillRect(x - 5, y - 32, 10, 10);
}
// làn nốt + vạch chạm (toạ độ màn hình, chữ ≥ 16px)
function v67lLanes(g, L){
  const lw = L.w/3, hitY = L.y + L.h - Math.max(70, L.h*.17), travel = 1.7, t = V67S.st === 'play' ? v67lNow() : 0, R = Math.min(lw*.36, 34);
  g.fillStyle = '#1e0f1e'; g.fillRect(L.x, L.y, L.w, L.h);
  for(let i = 0; i < 3; i++){ const x = L.x + i*lw; g.fillStyle = i % 2 ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.07)'; g.fillRect(x, L.y, lw, L.h); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x, L.y, 1, L.h); }
  g.strokeStyle = 'rgba(255,233,168,.9)'; g.lineWidth = 3; g.beginPath(); g.moveTo(L.x + 6, hitY); g.lineTo(L.x + L.w - 6, hitY); g.stroke();
  const tapK = [0, 0, 0]; V67S.fx.forEach(f => { if(f.k === 'tap') tapK[f.ln] = Math.max(tapK[f.ln], 1 - f.t/.25); });
  for(let i = 0; i < 3; i++){ const cx = L.x + lw*(i + .5); g.fillStyle = V67L_LANE[i]; g.globalAlpha = .28 + tapK[i]*.6; g.beginPath(); g.arc(cx, hitY, R + tapK[i]*6, 0, 7); g.fill(); g.globalAlpha = 1; g.strokeStyle = V67L_LANE[i]; g.lineWidth = 4; g.beginPath(); g.arc(cx, hitY, R, 0, 7); g.stroke(); }
  if(V67S.st === 'play'){
    for(const n of V67S.notes){ const dy = (n.t - t)/travel; if(dy > 1.05 || n.done > 0 || dy < -.2) continue; const cx = L.x + lw*(n.ln + .5), y = hitY - dy*(hitY - L.y);
      g.globalAlpha = n.done < 0 ? .3 : 1; g.fillStyle = V67L_LANE[n.ln]; g.beginPath(); g.arc(cx, y, R*.78, 0, 7); g.fill(); g.strokeStyle = '#2b1a10'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(cx - R*.25, y - R*.25, R*.18, 0, 7); g.fill(); g.globalAlpha = 1; }
    g.font = '900 18px Nunito, sans-serif'; g.textAlign = 'center';
    V67S.fx.forEach(f => { if(f.k === 'tap') return; const cx = L.x + lw*(f.ln + .5); g.globalAlpha = 1 - f.t/.7; g.fillStyle = f.k === 'Lỡ' ? '#ff9a9a' : f.k === 'Tuyệt!' ? '#ffe66b' : '#b8f5a0'; g.fillText(f.k, cx, hitY - R - 14 - f.t*40); g.globalAlpha = 1; });
    const p = Math.min(1, Math.max(0, t/V67S.dur)); g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(L.x + 10, L.y + 8, L.w - 20, 8); g.fillStyle = '#ff8fb1'; g.fillRect(L.x + 10, L.y + 8, (L.w - 20)*p, 8);
    g.fillStyle = '#fff'; g.font = '900 18px Nunito, sans-serif'; g.fillText(`Điểm ${V67S.score} · Combo ${V67S.combo}`, L.x + L.w/2, L.y + 40);
    if(t < 1.2){ g.font = '900 20px Nunito, sans-serif'; g.fillStyle = '#ffe66b'; g.fillText(t < 0 ? 'Chuẩn bị…' : '👆 Chạm làn khi nốt chạm vạch!', L.x + L.w/2, L.y + L.h*.42); }
    g.textAlign = 'left';
  }
}

// ---------- 5. nút "Diễn văn nghệ" khi đứng gần Hội trường lớn ----------
function v67lStageTick(){
  let b = document.getElementById('v67lGoStage');
  const ok = !V67S.on && typeof V46 !== 'undefined' && V46.on && !V46.sky && typeof PLAYER !== 'undefined' && PLAYER && PLAYER.visible && !(typeof V51T !== 'undefined' && V51T.open) && !(typeof V53C !== 'undefined' && V53C.mode);
  let near = false; if(ok){ const e = v67lHallEntry(); if(e){ const p = v46Pos(PLAYER); near = Math.hypot(p[0] - e[0], p[1] - e[1]) < 150; } }
  V67S.near = near; if(!b){ if(!near) return; b = document.createElement('button'); b.type = 'button'; b.id = 'v67lGoStage'; b.className = 'v53cEnter v67lGo'; b.innerHTML = '🎤 Diễn văn nghệ <small>Stage</small>'; b.onclick = () => v67lStageOpen(); (document.getElementById('stage') || document.body).appendChild(b); }
  b.hidden = !near;
}
function v67lStageInit(){
  setInterval(() => { try { v67lStageTick(); } catch(e){} }, 400);
  if(typeof render === 'function'){ const r0 = render; render = function(dt){ if(V67S.on) return; return r0.apply(this, arguments); }; }   // đang diễn: không vẽ đảo (tiết kiệm pin)
  if(typeof v32Items === 'function'){ const mi = v32Items; v32Items = function(){ const L = mi(); L.push({ic:'music', en:'Stage Show', vi:'🎤 Diễn văn nghệ', grp:'art', f:() => v67lStageGo()}); return L; }; }
}
