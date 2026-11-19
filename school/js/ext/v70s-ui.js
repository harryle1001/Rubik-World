// ================= v70s · CỐT TRUYỆN 3/3: giao diện — khung thoại RPG, chân dung, chữ hiện dần, tiêu đề chương, lia camera, sổ 📖 Hành trình =================
// Chữ Nunito ≥ 16px; khung theo tỷ lệ vàng (chân dung 89px : chữ, đệm 13/21px); điện thoại chỉ cần chạm. Chân dung: thầy cô v62k, học sinh v66c, Rubi tự vẽ.
const V70S_PHI = 1.618;
function v70sCss(){ return `
#v70sDlg{position:fixed;left:0;right:0;bottom:0;z-index:120;display:flex;justify-content:center;padding:0 10px max(10px,env(safe-area-inset-bottom));font-family:Nunito,sans-serif;pointer-events:none}
#v70sDlg[hidden],#v70sCard[hidden],#v70sBook[hidden],#v70sPill[hidden]{display:none!important}
#v70sDlg .v70sBox{pointer-events:auto;width:min(680px,100%);background:#fff7e3;color:#2b1a10;border:4px solid #2b1a10;border-radius:8px;box-shadow:0 0 0 4px var(--v70c,#5ff0ff),0 0 0 8px #2b1a10,0 14px 40px rgba(0,0,0,.5);padding:13px 13px 10px;display:grid;grid-template-columns:89px 1fr;gap:13px;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;animation:v70sUp .28s ease-out}
@keyframes v70sUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
#v70sDlg .v70sPor{width:89px;height:89px;border-radius:6px;background:var(--v70c,#5ff0ff);border:3px solid #2b1a10;display:grid;place-items:center;overflow:hidden;image-rendering:pixelated}
#v70sDlg .v70sPor img{width:100%;height:100%;object-fit:contain;image-rendering:pixelated}#v70sDlg .v70sPor span{font-size:44px}
#v70sDlg .v70sWho{font:900 17px Nunito,sans-serif;margin:0 0 3px;display:flex;align-items:center;gap:8px}#v70sDlg .v70sWho i{font-style:normal;font-size:13px;font-weight:800;opacity:.6;margin-left:auto}
#v70sDlg .v70sTx{font-size:18px;line-height:1.45;font-weight:700;min-height:52px;margin:0}
#v70sDlg .v70sFt{grid-column:1/-1;display:flex;align-items:center;gap:8px;min-height:30px}
#v70sDlg .v70sFt small{font-size:16px;font-weight:800;opacity:.65;margin-right:auto}#v70sDlg .v70sFt small b{display:inline-block;animation:v70sBob 1s infinite}
@keyframes v70sBob{50%{transform:translateY(3px)}}
#v70sDlg .v70sSk{min-height:44px;min-width:44px;padding:0 14px;border-radius:10px;border:3px solid #2b1a10;background:#ffe9a8;font:900 16px Nunito,sans-serif;color:#2b1a10;cursor:pointer}
#v70sDlg .v70sOpts{grid-column:1/-1;display:grid;gap:8px}
#v70sDlg .v70sOpts button{min-height:52px;border-radius:12px;border:3px solid #2b1a10;background:#fff;font:900 17px Nunito,sans-serif;color:#2b1a10;text-align:left;padding:6px 14px;cursor:pointer;box-shadow:0 3px 0 #2b1a10}
#v70sDlg .v70sOpts button.ok{background:#b8f5a0}#v70sDlg .v70sOpts button.no{background:#ffd2d2;animation:v70sShake .35s}
#v70sDlg .v70sWhy{grid-column:1/-1;font-size:16px;font-weight:800;margin:0;padding:8px 12px;border-radius:10px;background:#e9f9e2}
@keyframes v70sShake{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
#v70sCard{position:fixed;inset:0;z-index:121;display:grid;place-items:center;pointer-events:auto;cursor:pointer;background:radial-gradient(circle,rgba(8,12,30,.25),rgba(8,12,30,.72));animation:v70sFade 3.2s ease-in-out forwards;font-family:Nunito,sans-serif;text-align:center;color:#fff;padding:20px}
#v70sCard .v70sCn{font:16px Bungee,Nunito,sans-serif;letter-spacing:4px;color:var(--v70c);text-shadow:0 2px 0 #000}
#v70sCard .v70sCt{font:900 clamp(28px,7vw,52px)/1.15 Nunito,sans-serif;margin:8px 0 13px;text-shadow:0 4px 0 #0b1028,0 0 24px rgba(0,0,0,.6)}
#v70sCard .v70sCs{display:inline-flex;gap:6px}#v70sCard .v70sCs i{width:21px;height:21px;border:3px solid #0b1028;border-radius:4px;background:#3a4060}
#v70sCard .v70sCs i.on{box-shadow:0 0 12px currentColor}
#v70sCard .v70sCh{margin-top:13px;font-size:16px;font-weight:800;opacity:.8}
@keyframes v70sFade{0%{opacity:0}12%{opacity:1}82%{opacity:1}100%{opacity:0}}
#v70sCard .v70sCt,#v70sCard .v70sCn{animation:v70sZoom 3.2s ease-out}@keyframes v70sZoom{0%{transform:scale(.8)}20%{transform:scale(1)}}
#v70sPill{position:absolute;z-index:6;left:max(14px,env(safe-area-inset-left));top:150px;max-width:min(320px,calc(100% - 140px));min-height:44px;display:flex;align-items:center;gap:8px;padding:4px 14px 4px 6px;border-radius:22px;border:2px solid rgba(255,210,63,.8);background:rgba(10,15,34,.84);color:#fff;font:800 16px Nunito,sans-serif;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.35);text-align:left}
#v70sPill b{flex:none;display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#ffd23f;color:#1a1400;font-size:18px}
#v70sPill span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.2}#v70sPill small{display:block;font-size:13px;color:#ffd23f;font-weight:900}
body.v32phone #v70sPill{left:max(62px,calc(env(safe-area-inset-left) + 54px));top:calc(var(--v44mt, calc(var(--v32t,60px) + 112px)) + 1px);max-width:min(300px,calc(100% - 140px))}
body.v32phone .v70sIc{top:calc(var(--v32t,60px) + 192px);right:max(14px,env(safe-area-inset-right))}
#v70sBook{position:fixed;inset:0;z-index:119;display:flex;align-items:center;justify-content:center;padding:max(10px,env(safe-area-inset-top)) 10px max(10px,env(safe-area-inset-bottom));background:rgba(8,12,30,.72);font-family:Nunito,sans-serif;color:#2b1a10}
#v70sBook .v70sPg{width:min(620px,100%);max-height:100%;overflow:auto;background:#f6ecd2;border:4px solid #2b1a10;border-radius:10px;box-shadow:0 0 0 4px #ffd23f,0 0 0 8px #2b1a10,0 20px 50px rgba(0,0,0,.6);padding:13px 16px 16px;overscroll-behavior:contain}
#v70sBook h2{margin:0;font:900 22px Nunito,sans-serif;display:flex;align-items:center;gap:8px}
#v70sBook .v70sX{margin-left:auto;color:#2b1a10;min-width:44px;min-height:44px;border-radius:12px;border:3px solid #2b1a10;background:#fff;font:900 18px Nunito,sans-serif;cursor:pointer}
#v70sBook .v70sSub{margin:2px 0 10px;font-size:16px;font-weight:700;opacity:.75}
#v70sBook .v70sShd{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:0 0 12px}
#v70sBook .v70sShd div{border:3px solid #2b1a10;border-radius:8px;padding:6px 2px;text-align:center;font-size:13px;font-weight:900;background:#ddd3bb;opacity:.55}#v70sBook .v70sShd div.on{opacity:1;background:var(--c);color:#1b1b1b;box-shadow:0 0 12px var(--c)}
#v70sBook .v70sShd div i{display:block;font-style:normal;font-size:20px}
#v70sBook .v70sCh{border:3px solid #2b1a10;border-radius:10px;background:#fff7e3;margin:0 0 8px;padding:8px 12px}
#v70sBook .v70sCh.lock{opacity:.55;background:#eadfc4}#v70sBook .v70sCh.cur{box-shadow:0 0 0 3px #ffd23f}
#v70sBook .v70sCh h3{margin:0;font:900 17px Nunito,sans-serif;display:flex;gap:8px;align-items:center}#v70sBook .v70sCh h3 em{margin-left:auto;font-style:normal;font-size:16px}
#v70sBook .v70sCh ol{margin:6px 0 2px;padding-left:4px;list-style:none}#v70sBook .v70sCh li{color:#2b1a10;font-size:16px;font-weight:700;margin:5px 0;display:grid;grid-template-columns:26px 1fr;gap:4px}
#v70sBook .v70sCh li.ok{opacity:.6;text-decoration:line-through}#v70sBook .v70sCh li.now{font-weight:900}#v70sBook .v70sCh li small{grid-column:2;font-weight:700;opacity:.75;text-decoration:none}
#v70sBook .v70sRw{font-size:16px;font-weight:800;margin:4px 0 0;color:#6b3f26}
#v70sBook .v70sBt{display:grid;grid-template-columns:1.618fr 1fr;gap:8px;margin-top:10px}#v70sBook .v70sBt button{min-height:52px;border-radius:12px;border:3px solid #2b1a10;font:900 16px Nunito,sans-serif;cursor:pointer;background:#fff;color:#2b1a10}
#v70sBook .v70sBt .go{background:#ffd23f}
`; }

// ---------- chân dung (vẽ một lần, cache dataURL) ----------
const V70S_POR = {};
function v70sRubiCv(){
  const c = document.createElement('canvas'); c.width = c.height = 30; const g = c.getContext('2d'), s = v70sSt(), cols = V70S_CH.map((C, i) => s.done.includes(C.id) ? C.col : '#cfd6e6');
  const sq = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  sq(4, 5, 22, 22, '#0b1028'); for(let i = 0; i < 9; i++) sq(5 + (i % 3)*7, 6 + Math.floor(i/3)*7, 6, 6, cols[(i + (i > 4 ? 1 : 0)) % 6]);
  sq(9, 12, 4, 5, '#0b1028'); sq(17, 12, 4, 5, '#0b1028'); sq(10, 13, 1, 1, '#fff'); sq(18, 13, 1, 1, '#fff'); sq(12, 20, 6, 2, '#0b1028'); sq(7, 18, 3, 2, '#ff8fb1'); sq(20, 18, 3, 2, '#ff8fb1');
  sq(14, 1, 2, 4, '#0b1028'); sq(13, 0, 4, 2, '#ffd23f');
  return c;
}
function v70sKid(L){
  const a = Object.assign({id:'v70s', dir:1, moving:false, walk:0, visible:true, student:1, bag:'#3d7bff'}, L);
  const sp = v66cSprite(a, false, 0, 0, 0, 0), c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const K = sp.c.width/sp.W; g.drawImage(sp.c, 0, 2*K, 24*K, 24*K, 0, 4, 64, 64);   // nửa trên: đầu + vai
  return c;
}
function v70sPortrait(who){
  const key = who === 'rubi' ? 'rubi' + v70sSt().done.length : who === 'me' ? 'me' + (typeof PROF !== 'undefined' && PROF ? JSON.stringify(PROF.look || '') : '') : who;
  if(V70S_POR[key] !== undefined) return V70S_POR[key];
  let url = '';
  try {
    if(who === 'rubi') url = v70sRubiCv().toDataURL();
    else if(who === 'me'){ const P = v70sMe() || (typeof PLAYER !== 'undefined' && PLAYER); if(P && typeof v66cSprite === 'function') url = v70sKid({shirt:P.shirt, pants:P.pants, skin:P.skin, hair:P.hair, long:P.long, skirt:P.skirt, glasses:P.glasses, saoDo:P.saoDo, bag:P.bag}).toDataURL(); }
    else if(V70S_PEOPLE[who] && V70S_PEOPLE[who].L && typeof v66cSprite === 'function') url = v70sKid(V70S_PEOPLE[who].L).toDataURL();
    else if(typeof V62K_T !== 'undefined'){ const t = V62K_T.find(x => x.id === who); if(t && typeof v62kPortrait === 'function') url = v62kPortrait(t, 5); }
  } catch(e){ url = ''; }
  return V70S_POR[key] = url;
}
function v70sWho(who){
  const P = V70S_PEOPLE[who]; if(P) return {n:who === 'me' ? v70sName() : P.n, ic:P.ic, c:P.c, s:who === 'rubi' ? 'Mẩu Khối Ánh Sáng' : who === 'ha' ? 'Bạn cùng trường' : ''};
  const t = typeof V62K_T !== 'undefined' && V62K_T.find(x => x.id === who); if(t) return {n:t.n, ic:t.ic, c:(t.L && t.L.sh) || '#ffd23f', s:t.s};
  return {n:who, ic:'💬', c:'#ffd23f', s:''};
}

// ---------- chạy một "cảnh": tiêu đề chương + lia camera → các câu thoại → câu đố → hỏi có theo cốt truyện ----------
function v70sRun(job){
  V70S.busy = true; v70sUi(); const end = () => { v70sHide(); V70S.busy = false; v70sUi(); try { if(job.done) job.done(); } catch(e){ console.warn('v70s', e); } };
  const talk = () => v70sLines(job.lines || [], () => job.quiz ? v70sQuiz(job.quiz, 0, job.ask ? ask : end, job.who) : job.ask ? ask() : end());
  const ask = () => v70sChoice('rubi', 'Em có muốn cùng Rubi đi tìm 6 Mảnh Sáng không?', ['✨ Cùng Rubi phiêu lưu!', '🗺️ Để sau — mình chơi tự do'], i => {
    if(i === 1){ const s = v70sSt(); s.on = 0; v70sSave(); v70sHide(); V70S.busy = false; v70sUi(); v70sToast('📖 Mở “Hành trình” bất cứ lúc nào để bắt đầu cùng Rubi nhé!'); return; }
    end(); });
  if(job.card){ v70sCard(job.card); if(job.pan) v70sPan(job.pan); setTimeout(talk, 3000); } else talk();
}
function v70sDlgEl(){
  let d = V70S.ui.dlg; if(d) return d;
  d = document.createElement('div'); d.id = 'v70sDlg'; d.hidden = true; d.innerHTML = '<div class="v70sBox" role="dialog" aria-live="polite"><div class="v70sPor"></div><div><p class="v70sWho"></p><p class="v70sTx"></p></div><div class="v70sFt"><small><b>▼</b> Chạm để tiếp</small><button type="button" class="v70sSk">⏭ Bỏ qua</button></div></div>';
  document.body.appendChild(d); V70S.ui.dlg = d; return d;
}
function v70sSet(who, text){
  const d = v70sDlgEl(), W = v70sWho(who), box = d.querySelector('.v70sBox'), por = d.querySelector('.v70sPor'), url = v70sPortrait(who);
  box.style.setProperty('--v70c', W.c); por.innerHTML = url ? `<img alt="" src="${url}">` : `<span>${W.ic}</span>`;
  d.querySelector('.v70sWho').innerHTML = `${v70sEsc(W.n)}${W.s ? `<i>${v70sEsc(W.s)}</i>` : ''}`;
  d.querySelectorAll('.v70sOpts,.v70sWhy,.v70sBox > .v70sSk').forEach(e => e.remove()); d.hidden = false; return d;
}
function v70sType(el, text, done){
  clearInterval(V70S.typ); el.textContent = ''; let i = 0; const str = String(text).replace(/\{name\}/g, v70sName());
  const rm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(rm){ el.textContent = str; V70S.typing = null; done && done(); return; }
  V70S.typing = () => { clearInterval(V70S.typ); el.textContent = str; V70S.typing = null; done && done(); };
  V70S.typ = setInterval(() => { i += 2; el.textContent = str.slice(0, i); if(i % 8 === 0) try { blipSfx(700 + (i % 5)*60); } catch(e){} if(i >= str.length){ V70S.typing && V70S.typing(); } }, 34);
}
function v70sLines(lines, done){
  let k = 0; const d = v70sDlgEl(), box = d.querySelector('.v70sBox'), ft = d.querySelector('.v70sFt'), sk = d.querySelector('.v70sSk');
  const show = () => { if(k >= lines.length){ box.onclick = null; sk.onclick = null; done(); return; } const [who, tx] = lines[k]; v70sSet(who, tx); ft.hidden = false; v70sType(d.querySelector('.v70sTx'), tx); };
  box.onclick = e => { if(e.target.closest('.v70sSk')) return; if(V70S.typing){ V70S.typing(); return; } k++; show(); };
  sk.onclick = e => { e.stopPropagation(); if(V70S.typing) V70S.typing(); k = lines.length; show(); };
  V70S.adv = () => box.onclick({target:box});
  if(!lines.length){ done(); return; } show();
}
function v70sChoice(who, q, opts, pick, mark){
  const d = v70sSet(who, q), box = d.querySelector('.v70sBox'); d.querySelector('.v70sFt').hidden = true; box.onclick = null; V70S.adv = null;
  v70sType(d.querySelector('.v70sTx'), q);
  const o = document.createElement('div'); o.className = 'v70sOpts';
  opts.forEach((t, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = e => { e.stopPropagation(); if(V70S.typing) V70S.typing(); if(mark && !mark(b, i, o)) return; pick(i); }; o.appendChild(b); });
  box.appendChild(o);
}
function v70sQuiz(list, i, done, who){
  if(i >= list.length){ done(); return; } const Q = list[i]; let tries = 0;
  v70sChoice(who || 'rubi', (list.length > 1 ? `Câu ${i + 1}/${list.length}: ` : '❓ ') + Q.q, Q.a.map((t, j) => String.fromCharCode(65 + j) + '. ' + t), () => {}, (b, j, o) => {
    if(o.dataset.done) return false;
    if(j !== Q.k){ tries++; b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); try { blipSfx(300); } catch(e){} if(tries === 2) v70sWhy(o, '💡 Gợi ý: ' + Q.why.split(' — ')[0].split('.')[0] + '…'); return false; }
    o.dataset.done = 1; b.classList.add('ok'); try { cheerSfx(); } catch(e){}
    v70sWhy(o, '✅ Đúng rồi! ' + Q.why);
    const box = o.parentNode, nx = document.createElement('button'); nx.type = 'button'; nx.className = 'v70sSk'; nx.textContent = i + 1 < list.length ? '▶ Câu tiếp' : '▶ Tiếp tục'; nx.style.cssText = 'grid-column:1/-1;min-height:52px;font-size:17px';
    nx.onclick = e => { e.stopPropagation(); v70sQuiz(list, i + 1, done, who); }; box.appendChild(nx); return false;
  });
}
function v70sWhy(o, t){ let w = o.parentNode.querySelector('.v70sWhy'); if(!w){ w = document.createElement('p'); w.className = 'v70sWhy'; o.parentNode.insertBefore(w, o.nextSibling); } w.textContent = t; }
function v70sHide(){ clearInterval(V70S.typ); V70S.typing = null; V70S.adv = null; if(V70S.ui.dlg) V70S.ui.dlg.hidden = true; }

// tiêu đề chương (chạm để tắt sớm)
function v70sCard(C){
  let c = V70S.ui.card; if(!c){ c = document.createElement('div'); c.id = 'v70sCard'; c.hidden = true; document.body.appendChild(c); V70S.ui.card = c; c.onclick = () => { c.hidden = true; }; }
  const s = v70sSt(), n = V70S_CH.indexOf(C);
  c.style.setProperty('--v70c', C.col);
  c.innerHTML = `<div><div class="v70sCn">${C.fin ? 'KẾT THÚC · THE END' : 'CHƯƠNG ' + (n + 1) + ' / 6'}</div><div class="v70sCt">${C.ic} ${v70sEsc(C.name)}</div>` +
    `<div class="v70sCs">${V70S_CH.map(X => `<i class="${s.done.includes(X.id) ? 'on' : ''}" style="${s.done.includes(X.id) ? 'background:' + X.col + ';color:' + X.col : ''}"></i>`).join('')}</div>` +
    `<div class="v70sCh">${C.fin ? 'Cả 6 Mảnh Sáng đã trở về!' : 'Đi tìm Mảnh Sáng ' + v70sEsc(C.shard) + ' · ' + v70sEsc(C.gift)}</div></div>`;
  c.hidden = false; c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
  clearTimeout(V70S.cardT); V70S.cardT = setTimeout(() => { c.hidden = true; }, 3200);
}
// lia camera tới khu của chương rồi quay lại nhân vật (≈ 3,4 s; có phím/joystick là trả camera ngay)
function v70sPan(at){
  const pt = v70sPt(at); if(!pt || typeof cam === 'undefined' || V70S.pan) return;
  const from = [cam.x, cam.y], T = performance.now(), ease = u => u < .5 ? 2*u*u : 1 - Math.pow(-2*u + 2, 2)/2;
  V70S.pan = {T}; followCam = false;
  const step = now => {
    if(!V70S.pan) return; const t = (now - T)/1000, me = v70sMe(), back = me ? v46CamT(me) : from;
    if(followCam || t > 3.6){ V70S.pan = null; followCam = true; return; }
    let x, y; if(t < 1.3){ const u = ease(t/1.3); x = from[0] + (pt[0] - from[0])*u; y = from[1] + (pt[1] - from[1])*u; }
    else if(t < 2.5){ x = pt[0]; y = pt[1]; } else { const u = ease(Math.min(1, (t - 2.5)/1.1)); x = pt[0] + (back[0] - pt[0])*u; y = pt[1] - 20 + (back[1] - pt[1])*u; }
    cam.x = x; cam.y = y; requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---------- sổ 📖 Hành trình ----------
function v70sBook(){
  let b = V70S.ui.book; if(!b){ b = document.createElement('div'); b.id = 'v70sBook'; b.hidden = true; document.body.appendChild(b); V70S.ui.book = b; b.onclick = e => { if(e.target === b) b.hidden = true; }; }
  if(typeof PROF === 'undefined' || !PROF){ v70sToast('📖 Đăng nhập để bắt đầu hành trình cùng Rubi nhé!'); return; }
  const s = v70sSt(), cur = v70sCur();
  const shd = V70S_CH.map(C => `<div class="${s.done.includes(C.id) ? 'on' : ''}" style="--c:${C.col}"><i>${s.done.includes(C.id) ? C.ic : '◻️'}</i>${v70sEsc(C.shard)}</div>`).join('');
  const chs = V70S_CH.map((C, i) => {
    const done = s.done.includes(C.id), now = i === s.ch && !s.fin, lock = i > s.ch;
    const qs = (now || done) ? `<ol>${C.q.map((Q, j) => { const ok = done || j < s.q, at = now && j === s.q; return `<li class="${ok ? 'ok' : at ? 'now' : ''}"><span>${ok ? '✅' : at ? '▶️' : '▫️'}</span><span>${v70sEsc(Q.t)}${at && Q.need ? ` (${s.n || 0}/${Q.need})` : ''}</span>${at ? `<small>${v70sEsc(Q.d)}${Q.at ? ' · 📍 ' + v70sEsc(v70sPlace(Q.at)) : ''}</small>` : ''}</li>`; }).join('')}</ol>` : '';
    return `<div class="v70sCh ${lock ? 'lock' : ''} ${now ? 'cur' : ''}"><h3>${lock ? '🔒' : C.ic} Chương ${i + 1}: ${v70sEsc(C.name)}<em>${done ? '✓' : now ? s.q + '/' + C.q.length : ''}</em></h3>${qs}<p class="v70sRw">🎁 ${v70sEsc(C.title)} · $${C.cash} · 🪑 đồ trang trí</p></div>`;
  }).join('');
  b.innerHTML = `<div class="v70sPg" role="dialog" aria-label="Hành trình"><h2>📖 Hành trình<button type="button" class="v70sX" aria-label="Đóng">✕</button></h2>
    <p class="v70sSub">Bí mật Khối Rubik Ánh Sáng · ${s.done.length}/6 Mảnh Sáng${s.title ? ' · Danh hiệu: <b>' + v70sEsc(s.title) + '</b>' : ''}</p>
    <div class="v70sShd">${shd}</div>${s.on ? '' : '<p class="v70sSub">🗺️ Em đang chơi tự do. Bấm “Bật cốt truyện” để cùng Rubi phiêu lưu.</p>'}${chs}
    <div class="v70sBt">${s.fin ? '<button type="button" class="go" data-a="replay">🌟 Xem lại cảnh kết</button>' : s.on ? '<button type="button" class="go" data-a="go">👣 Dẫn đường tới nhiệm vụ</button>' : '<button type="button" class="go" data-a="on">✨ Bật cốt truyện</button>'}
    <button type="button" data-a="${s.on ? 'off' : 'x'}">${s.on ? '🗺️ Chơi tự do' : '✕ Đóng'}</button></div></div>`;
  b.querySelector('.v70sX').onclick = () => { b.hidden = true; };
  b.querySelectorAll('[data-a]').forEach(btn => btn.onclick = () => { const a = btn.dataset.a; b.hidden = true;
    if(a === 'go'){ if(!cur.Q) return; if(cur.Q.type === 'quiz') { V70S.q.push({who:cur.Q.who, lines:cur.Q.say || [], quiz:cur.Q.quiz, done:() => v70sDone(cur.Q, false)}); return; } if(!v70sGuide()) v70sToast('📖 ' + cur.Q.d); }
    else if(a === 'on'){ s.on = 1; if(!s.intro){ s.intro = 1; s.open = ''; } v70sSave(); v70sUi(); v70sToast('✨ Rubi: “Mình đi thôi!”'); }
    else if(a === 'off'){ s.on = 0; v70sSave(); v70sUi(); try { if(typeof GUIDE !== 'undefined' && GUIDE && String(GUIDE.name || '').startsWith('📖')){ GUIDE = null; V32.nav = null; } } catch(e){} v70sToast('🗺️ Chơi tự do! Mở 📖 Hành trình khi muốn đi tiếp nhé.'); }
    else if(a === 'replay') v70sFinale();
  });
  b.hidden = false;
}
// nút 📖 (máy tính: thanh #quick · điện thoại: nút tròn bên phải) + thẻ nhiệm vụ hiện tại
function v70sUi(){
  const p = V70S.ui.pill; if(!p) return; const has = typeof PROF !== 'undefined' && !!PROF, s = v70sSt(), {C, Q} = v70sCur();
  const show = !!(has && s.on && s.intro && Q && !s.fin && !V70S.busy);
  if(show){ const k = C.id + s.q + (s.n || 0); if(p.dataset.k !== k){ p.dataset.k = k; p.innerHTML = `<b>${C.ic}</b><span><small>Chương ${s.ch + 1} · ${s.q + 1}/${C.q.length}</small>${v70sEsc(Q.t)}${Q.need ? ` ${s.n || 0}/${Q.need}` : ''}</span>`; } }
  if(p.hidden === show) p.hidden = !show;
}
function v70sUiInit(){
  const st = document.createElement('style'); st.id = 'v70sCss'; st.textContent = v70sCss(); document.head.appendChild(st);
  const stage = document.getElementById('stage') || document.body;
  const pill = document.createElement('button'); pill.type = 'button'; pill.id = 'v70sPill'; pill.hidden = true; pill.onclick = () => v70sBook(); stage.appendChild(pill); V70S.ui.pill = pill;
  const ic = document.createElement('button'); ic.type = 'button'; ic.id = 'v70sIc'; ic.className = 'v32ic v70sIc'; ic.title = 'Hành trình'; ic.setAttribute('aria-label', 'Hành trình'); ic.textContent = '📖'; ic.onclick = () => v70sBook(); stage.appendChild(ic);
  const q = document.getElementById('quick'); if(q){ const b = document.createElement('button'); b.type = 'button'; b.id = 'v70sQuick'; b.title = 'Hành trình · cốt truyện (phím J)'; b.textContent = '📖 Hành trình'; b.onclick = () => v70sBook(); const ref = q.children[1]; q.insertBefore(b, ref || null); }
  // phím: Enter/Space = tiếp thoại · J = mở sổ · Esc = đóng sổ
  addEventListener('keydown', e => {
    const d = V70S.ui.dlg; if(d && !d.hidden && (e.code === 'Enter' || e.code === 'Space')){ e.preventDefault(); e.stopPropagation(); if(V70S.adv) V70S.adv(); return; }
    const b = V70S.ui.book; if(b && !b.hidden && e.code === 'Escape'){ b.hidden = true; e.stopPropagation(); return; }
    if(e.code === 'KeyJ' && !/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '') && !(typeof openModal !== 'undefined' && openModal)){ if(b && !b.hidden) b.hidden = true; else v70sBook(); }
  }, true);
}
