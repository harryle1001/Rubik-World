// ================= v54q · ROBO THÁM TỬ (1/2 · lõi): NPC robot đi khắp đảo, thử từng nơi và ghi lỗi — CHỈ CHỦ GAME =================
// Mọi tên toàn cục có tiền tố v54q / V54Q. Không đổi dữ liệu người chơi (xe đạp mượn tạm được trả lại sau khi thử).
const V54Q = {toastN:0, on:false, stop:false, steps:[], idx:0, cur:'', iss:[], keys:new Map(), errs:[], spr:null, rob:{x:0, y:0, ok:false, say:'', f:0},
  last:null, tp:0, watch:false, lt:0, fw:{t:0, n:0}, fps:{min:999, sum:0, cnt:0}, sf:{min:999, sum:0, cnt:0}, t0:0, nshot:0, vp:'', done:false, ui:null};
const V54Q_SEV = {high:'Nghiêm trọng', mid:'Vừa', low:'Nhẹ'};
function v54qOK(){ return typeof OWNER !== 'undefined' && !!OWNER && OWNER.is === true; }
const v54qSleep = ms => new Promise(r => setTimeout(r, ms));
const v54qD = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// ---------- 1. bắt lỗi JS: window.onerror, unhandledrejection, console.warn/error (từ các khối try/catch init/vẽ) ----------
function v54qLoc(st){ const m = /rubik-school-game\.js:(\d+)(?::(\d+))?/.exec(String(st || '')); return m ? 'game:' + m[1] : ''; }
function v54qErr(kind, msg, st){
  msg = String(msg || '').slice(0, 300); if(/AudioContext|autoplay/i.test(msg)) return;
  const e = {kind, msg, loc:v54qLoc(st), st:String(st || '').split('\n').slice(0, 4).join(' | ').slice(0, 400), step:V54Q.cur || 'Khởi động', t:Date.now()};
  if(V54Q.errs.length < 300) V54Q.errs.push(e);
  if(V54Q.on) v54qErrIssue(e);
}
function v54qErrIssue(e){
  const sev = e.kind === 'error' || e.kind === 'promise' ? 'high' : e.kind === 'cerror' ? 'high' : 'mid';
  v54qIssue(sev, 'js', (e.kind === 'warn' ? '⚠️ Cảnh báo JS: ' : '💥 Lỗi JS: ') + e.msg.slice(0, 110),
    {desc:e.msg, repro:'Lúc Robo đang ở bước: ' + e.step, file:e.loc, stack:e.st, key:'js|' + e.msg.slice(0, 80)});
}
(function(){
  const cw0 = console.warn, ce0 = console.error;
  const txt = a => [...a].map(x => x && x.message ? x.message : typeof x === 'string' ? x : (() => { try { return JSON.stringify(x); } catch(_){ return String(x); } })()).join(' ');
  const stk = a => { const e = [...a].find(x => x && x.stack); return e ? e.stack : ''; };
  console.warn = function(){ try { v54qErr('warn', txt(arguments), stk(arguments)); } catch(_){} return cw0.apply(console, arguments); };
  console.error = function(){ try { v54qErr('cerror', txt(arguments), stk(arguments)); } catch(_){} return ce0.apply(console, arguments); };
  window.addEventListener('error', ev => { try { v54qErr('error', ev.message, (ev.error && ev.error.stack) || (ev.filename + ':' + ev.lineno)); } catch(_){} });
  window.addEventListener('unhandledrejection', ev => { try { const r = ev.reason; v54qErr('promise', r && r.message || String(r), r && r.stack || ''); } catch(_){} });
})();

// ---------- 2. sổ lỗi ----------
function v54qWhere(){
  try { const P = PLAYER; if(!P || !P.visible) return null; const n = v46Pos(P); return {x:Math.round(n[0]), y:Math.round(n[1]), ox:Math.round(P.x), oy:Math.round(P.y), z:P._z || ''}; } catch(e){ return null; }
}
function v54qShot(){
  try { if(V54Q.nshot >= 80 || typeof cvs === 'undefined' || !cvs) return ''; const c = document.createElement('canvas'); c.width = 240; c.height = 150;
    const g = c.getContext('2d'); g.drawImage(cvs, 0, 0, c.width, c.height); V54Q.nshot++; return c.toDataURL('image/jpeg', .62); } catch(e){ return ''; }
}
// sev: high | mid | low ; cat: js, fps, nan, kẹt, nhảy, nhãn, nút, chữ, tràn, che, mở, đóng, khu
function v54qIssue(sev, cat, title, o){
  o = o || {}; const key = o.key || cat + '|' + title;
  const old = V54Q.keys.get(key); if(old){ old.n++; if(V54Q_SEV[sev] && 'low mid high'.indexOf(sev) > 'low mid high'.indexOf(old.sev)) old.sev = sev; return old; }
  const it = {id:V54Q.iss.length + 1, sev, cat, title, desc:o.desc || '', repro:o.repro || ('Robo đang ở bước: ' + (V54Q.cur || '—')), file:o.file || '', stack:o.stack || '',
    step:V54Q.cur, vp:V54Q.vp || (innerWidth + '×' + innerHeight), where:o.where || v54qWhere(), shot:o.noShot ? '' : v54qShot(), n:1, t:Math.round((Date.now() - V54Q.t0)/1000)};
  V54Q.iss.push(it); V54Q.keys.set(key, it);
  try { if(typeof window.__v54qShot === 'function') window.__v54qShot(it.id, it.sev, it.title); } catch(e){}
  try { v54qUiCount(); } catch(e){}
  return it;
}

// ---------- 3. Robo: sprite dễ thương (cache), bay theo người chơi, bong bóng lời nói ----------
const V54Q_ART = [
  '.......a........', '.......y........', '...wwwwwwwwww...', '..wbbbbbbbbbbw..', '..wbkkbbbbkkbw..', '..wbkcbbbbkcbw..', '..wbbbbppbbbbw..', '..wbbbbbbbbbbw..',
  '...wwwwwwwwww...', '.....gggggg.....', '...wwwwwwwwww...', '..wwssssssssww..', 'hhwwsrrssggswwhh', '..wwssssssssww..', '..wwwwwwwwwwww..', '...ww......ww...', '...dd......dd...'];
const V54Q_COL = {w:'#eef3f8', b:'#24324d', k:'#5ef2ff', c:'#ffffff', p:'#ff8fb3', a:'#ffd23f', y:'#9aa7b8', g:'#9aa7b8', s:'#4dabf7', r:'#ff6b6b', h:'#8d99ab', d:'#4c566a'};
function v54qSprite(){
  if(V54Q.spr) return V54Q.spr; const f = [];
  for(let k = 0; k < 2; k++){ const c = document.createElement('canvas'); c.width = 16*3 + 18; c.height = 17*3; const g = c.getContext('2d');
    V54Q_ART.forEach((row, j) => { for(let i = 0; i < row.length; i++){ const ch = row[i]; if(ch === '.') continue; let col = V54Q_COL[ch]; if(ch === 'a' && k) col = '#ff6b6b'; if(ch === 'k' && k) col = '#a6fbff'; g.fillStyle = col; g.fillRect(i*3, j*3, 3, 3); } });
    // kính lúp thám tử
    g.strokeStyle = '#8a5a2b'; g.lineWidth = 3; g.beginPath(); g.moveTo(48, 40); g.lineTo(56, 48); g.stroke();
    g.strokeStyle = '#ffd23f'; g.lineWidth = 2.5; g.beginPath(); g.arc(57, 33, 6, 0, Math.PI*2); g.stroke(); g.fillStyle = 'rgba(166,251,255,.45)'; g.fill();
    f.push(c); }
  return (V54Q.spr = f);
}
function v54qDraw(){
  if(!V54Q.on || typeof PLAYER === 'undefined' || !PLAYER || !PLAYER.visible) return;
  const R0 = V54Q.rob, p = v46Pos(PLAYER), tx = p[0] - 34, ty = p[1] - 18;
  if(!R0.ok || v54qD([R0.x, R0.y], [tx, ty]) > 2500){ R0.x = tx; R0.y = ty - 300; R0.ok = true; }
  const d = v54qD([R0.x, R0.y], [tx, ty]), k = d > 400 ? .2 : .12; R0.x += (tx - R0.x)*k; R0.y += (ty - R0.y)*k; R0.f++;
  const S = v54qSprite(), img = S[(R0.f >> 4) & 1], bob = Math.sin(R0.f*.12)*2.5, fly = d > 60;
  ctx.setTransform(DPR*cam.z, 0, 0, DPR*cam.z, Math.round(DPR*(cw/2 - cam.x*cam.z)), Math.round(DPR*(ch/2 - cam.y*cam.z))); ctx.imageSmoothingEnabled = false;
  const x = Math.round(R0.x - 24), y = Math.round(R0.y - 50 + bob);
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(R0.x, R0.y + 4, 15, 5, 0, 0, Math.PI*2); ctx.fill();
  if(fly){ ctx.fillStyle = (R0.f & 4) ? '#ffb347' : '#ffd23f'; ctx.fillRect(x + 12, y + 51, 6, 5 + (R0.f & 3)); ctx.fillRect(x + 30, y + 51, 6, 5 + ((R0.f + 2) & 3)); }
  ctx.drawImage(img, x, y);
  const say = R0.say; if(say){ const fs = 16/cam.z; ctx.font = `800 ${fs}px Nunito, sans-serif`; const w = ctx.measureText(say).width + 14/cam.z, h = fs*1.5, bx = R0.x - w/2, by = y - h - 8/cam.z;
    ctx.fillStyle = 'rgba(20,28,48,.9)'; ctx.fillRect(bx, by, w, h); ctx.fillStyle = '#ffd23f'; ctx.fillRect(bx, by + h - 2/cam.z, w, 2/cam.z);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(say, R0.x, by + h/2); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; }
}
function v54qSay(s){ V54Q.rob.say = String(s || '').slice(0, 44); V54Q.cur = s; try { v54qUiStep(); } catch(e){} }

// ---------- 4. đo mỗi khung hình: FPS, NaN/Infinity, nhảy xa bất thường ----------
function v54qFrame(ts){
  if(!V54Q.on){ V54Q.raf = false; return; } requestAnimationFrame(v54qFrame);   // v63f: một vòng đếm duy nhất (trước đây mỗi thầy cô chồng thêm 1 vòng → FPS ×2, ×3…)
  const W = V54Q.fw; if(!W.t) W.t = ts; W.n++;
  if(ts - W.t >= 500){ const f = W.n*1000/(ts - W.t); W.t = ts; W.n = 0; [V54Q.fps, V54Q.sf].forEach(o => { o.min = Math.min(o.min, f); o.sum += f; o.cnt++; }); }
  const P = typeof PLAYER !== 'undefined' ? PLAYER : null; if(!P || !P.visible) return;
  if(!isFinite(P.x) || !isFinite(P.y)){ v54qIssue('high', 'nan', 'Toạ độ nhân vật bị NaN/Infinity', {desc:`PLAYER.x=${P.x}, y=${P.y}`, noShot:true, where:null}); }
  if((V54Q.lt++ & 31) === 0 && typeof agents !== 'undefined'){ for(const a of agents){ if(!isFinite(a.x) || !isFinite(a.y)){ v54qIssue('mid', 'nan', 'NPC có toạ độ NaN/Infinity: ' + (a.name || a.id || '?'), {desc:`x=${a.x}, y=${a.y}, vai trò ${a.role || ''}`, noShot:true, where:null}); break; } } }
  let q; try { q = v46Pos(P); } catch(e){ return; }
  if(V54Q.tp > 0 || !V54Q.watch || !V54Q.last){ V54Q.tp = Math.max(0, V54Q.tp - 1); V54Q.last = q; return; }
  const d = v54qD(q, V54Q.last);
  if(d > 260 && !P.v16fly && !(typeof V51P !== 'undefined' && V51P.on)) v54qIssue('mid', 'nhảy', 'Nhân vật bị dịch chuyển bất thường (' + Math.round(d) + 'px trong 1 khung)',
    {desc:`Từ (${Math.round(V54Q.last[0])}, ${Math.round(V54Q.last[1])}) nhảy tới (${Math.round(q[0])}, ${Math.round(q[1])}) khi ${P.cycling ? 'đạp xe' : P.boat ? 'đi thuyền' : 'đi bộ'}.`, key:'nhảy|' + V54Q.cur});
  V54Q.last = q;
}
function v54qStepFps(name){
  const s = V54Q.sf; if(s.cnt >= 2){ const avg = s.sum/s.cnt;
    if(avg < 30) v54qIssue(avg < 20 ? 'mid' : 'low', 'fps', `FPS thấp ở “${name}”: TB ${Math.round(avg)}, thấp nhất ${Math.round(s.min)}`, {key:'fps|' + name, desc:'Đo bằng requestAnimationFrame trong lúc Robo ở bước này.'}); }
  V54Q.sf = {min:999, sum:0, cnt:0};
}

// ---------- 5. dịch chuyển, giải phóng phương tiện, trạng thái màn hình (để biết mini game mở/đóng) ----------
function v54qFree(){
  const P = PLAYER; if(!P) return;
  try { if(typeof V51P !== 'undefined' && V51P.on) v51pExit(true); } catch(e){}
  try { if(typeof V53C !== 'undefined' && V53C.mode === 'drive') v53cExit(true); } catch(e){}
  try { if(P.boat) leaveBoat(P); } catch(e){} try { if(P.cycling) toggleBike(); } catch(e){} try { if(P.v16fly) flyLand(); } catch(e){}
  try { if(P.mount) dismount(P, true); } catch(e){} try { cancelAuto(); } catch(e){}
  try { if(typeof V32 !== 'undefined'){ V32.nav = null; V32.walk = null; } GUIDE = null; } catch(e){}
}
function v54qTele(ox, oy){
  const P = PLAYER; if(!P || !isFinite(ox) || !isFinite(oy)) return false; v54qFree();
  P.x = ox; P.y = oy; P.path = []; P.queue = []; P.cur = null; P.v46p = null;
  try { const z = v46ZoneOld(ox, oy); P._z = z ? z.id : null; } catch(e){}
  if(!P.controlled) try { setControl(true); } catch(e){}
  V54Q.tp = 4; V54Q.last = null; followCam = true;
  try { const q = v46Pos(P); cam.x = q[0]; cam.y = q[1] - 20; } catch(e){}
  return true;
}
function v54qTeleNew(nx, ny){ const o = v46ToOld(nx, ny); return v54qTele(o[0], o[1]); }
function v54qVis(e){ if(!e || !e.getClientRects().length) return false; const s = getComputedStyle(e); return s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > .05; }
function v54qRoot(e, up){ // lớp gốc của phần tử: modal / khung phủ / HUD (up: bắt đầu từ cha, dùng khi so nút che nhau)
  let r = up ? document.body : e, x = up ? e.parentElement : e; while(x && x !== document.body){ const st = getComputedStyle(x); if(x.classList && x.classList.contains('modal')) return x; if((st.position === 'fixed' || st.position === 'absolute') && x.id) r = x; x = x.parentElement; }
  return r;
}
function v54qSig(){
  const a = [];
  try { if(openModal) a.push('m:' + openModal.id); } catch(e){}
  const fl = [['V50', 'open'], ['V51A', 'open'], ['V51T', 'open'], ['V51P', 'on'], ['V52WS', 'open'], ['V52LC', 'open'], ['V52WD', 'open'], ['V48C', 'on'], ['V40', 'open']];
  for(const [n, k] of fl){ try { const o = eval(n); if(o && o[k]) a.push(n); } catch(e){} }
  try { if(V53C.mode) a.push('V53C:' + V53C.mode); } catch(e){}
  try { if(PLAYER && !PLAYER.visible) a.push('pv'); } catch(e){}
  ['v50G', 'v51tG', 'v53cMgR', 'v52lcR', 'v50Panel', 'v51tPanel', 'v51aPanel'].forEach(id => { const e = document.getElementById(id); if(e && !e.hidden && v54qVis(e)) a.push('g:' + id); });
  const W = innerWidth, H = innerHeight, seen = new Set();
  document.querySelectorAll('body > *, .app > *, #stage > *').forEach(e => { if(!e.id || /^(v54q|toast|world)/.test(e.id) || !v54qVis(e)) return; const st = getComputedStyle(e); if(st.position !== 'fixed') return;
    const r = e.getBoundingClientRect(); if(r.width*r.height > W*H*.12) a.push('f:' + e.id); });
  [[.5, .5], [.3, .5], [.7, .5], [.5, .32], [.5, .7]].forEach(([fx, fy]) => { const e = document.elementFromPoint(W*fx, H*fy); if(!e || e.closest('#v54qPanel, #toast, #v53cEnter')) return;
    if(e.id === 'world' || e.tagName === 'CANVAS' && e.closest('.stage, #stage')) return; const r = v54qRoot(e); const k = r === document.body ? '' : (r.id || r.className || r.tagName).toString().slice(0, 24); if(k && !seen.has(k)){ seen.add(k); a.push('p:' + k); } });
  return a.sort().join(',');
}
function v54qKey(k){ ['keydown', 'keyup'].forEach(t => { const ev = new KeyboardEvent(t, {key:k, code:k, bubbles:true}); document.dispatchEvent(ev); window.dispatchEvent(ev); }); }
function v54qCloseBtn(){
  const L = [...document.querySelectorAll('button, [role=button], .close, [data-close]')].filter(b => v54qVis(b) && !b.closest('#v54qPanel'));
  const ok = b => { const t = (b.textContent || '').trim(), l = (b.getAttribute('aria-label') || '') + ' ' + (b.title || '');
    return b.hasAttribute('data-close') || /^(✕|×|✖|x|X|❌|Đóng|Thoát|← Về|⟵|Rời|Ra ngoài)$/.test(t) || /đóng|thoát|close|exit|rời/i.test(l); };
  const c = L.filter(ok); return c.length ? c[c.length - 1] : null;
}
function v54qForceClose(){
  const F = [() => hideModal(), () => v50GClose(true), () => v50Close(), () => v51aClose(), () => v51tGClose(), () => v51tClose(), () => v52wsClose(), () => v52lcClose(false),
    () => v52wDevClose(), () => v52ldClose(), () => v53cMgClose(true), () => v53cTowerLeave(), () => v48mClose(), () => { if(V51P.on) v51pExit(true); }, () => { if(V53C.mode) v53cExit(true); }];
  F.forEach(f => { try { f(); } catch(e){} });
}
// đóng thứ vừa mở như người chơi: Esc → nút ✕/Đóng → (cuối cùng) hàm nội bộ. Trả về cách đã đóng được.
async function v54qClose(base, name){
  for(let i = 0; i < 4; i++){
    if(v54qSig() === base) return i ? 'ok' : 'ok';
    if(i === 0){ v54qKey('Escape'); }
    else { const b = v54qCloseBtn(); if(b){ try { b.click(); } catch(e){} } else if(i === 1){ try { hideModal(); } catch(e){} } }
    await v54qSleep(300);
  }
  if(v54qSig() === base) return 'ok';
  const left = v54qSig(); v54qForceClose(); await v54qSleep(350);
  if(v54qSig() === base){ v54qIssue('mid', 'đóng', `“${name}” không có nút ✕/Đóng hay phím Esc để thoát`, {desc:'Robo phải gọi hàm đóng nội bộ mới thoát được. Còn mở: ' + left, key:'đóng|' + name}); return 'force'; }
  v54qIssue('high', 'đóng', `Không đóng được “${name}”`, {desc:'Sau Esc, nút ✕ và hàm đóng nội bộ vẫn còn: ' + v54qSig(), key:'đóng|' + name});
  return 'fail';
}

// ---------- 6. quét giao diện: chữ < 16px, tràn màn hình, nút che nhau ----------
function v54qSel(e){ let s = e.tagName.toLowerCase(); if(e.id) return s + '#' + e.id; const c = (e.className && typeof e.className === 'string') ? e.className.trim().split(/\s+/).slice(0, 2).join('.') : ''; if(c) s += '.' + c;
  const p = e.parentElement && e.parentElement.closest('[id]'); return (p ? '#' + p.id + ' ' : '') + s; }
function v54qClipped(e, r){ // nằm trong khung cuộn/che (overflow) => không tính là tràn
  for(let x = e.parentElement; x && x !== document.body; x = x.parentElement){ const st = getComputedStyle(x); if(st.overflowX !== 'visible' || st.overflowY !== 'visible'){ const q = x.getBoundingClientRect(); if(q.right <= innerWidth + 4 && q.left >= -4 && q.bottom <= innerHeight + 4) return true; } }
  return false;
}
function v54qVisRect(e){ // khung nhìn thấy được sau khi bị các khung cuộn cha cắt
  const r = e.getBoundingClientRect(); let x0 = r.left, y0 = r.top, x1 = r.right, y1 = r.bottom;
  for(let x = e.parentElement; x && x !== document.body; x = x.parentElement){ const st = getComputedStyle(x); if(st.overflowX === 'visible' && st.overflowY === 'visible') continue;
    const q = x.getBoundingClientRect(); x0 = Math.max(x0, q.left); y0 = Math.max(y0, q.top); x1 = Math.min(x1, q.right); y1 = Math.min(y1, q.bottom); }
  return {left:x0, top:y0, right:x1, bottom:y1, width:Math.max(0, x1 - x0), height:Math.max(0, y1 - y0)};
}
function v54qScan(ctxName){
  const n0 = V54Q.iss.length; v54qScan0(ctxName); return V54Q.iss.length > n0;
}
function v54qScan0(ctxName){
  const W = innerWidth, H = innerHeight, small = new Map(), over = [], phone = Math.min(W, H) < 500 || document.body.classList.contains('touchdev');
  const els = document.querySelectorAll('body *'); let n = 0;
  for(const e of els){
    if(n > 2500) break; if(e.closest('#v54qPanel, #v54qBtn, script, style, canvas, svg')) continue;
    const own = [...e.childNodes].some(c => c.nodeType === 3 && c.textContent.trim().length > 1); if(!own && e.tagName !== 'BUTTON') continue;
    if(!v54qVis(e)) continue; n++;
    const r = e.getBoundingClientRect(); if(r.width < 2 || r.height < 2 || r.bottom < 0 || r.right < 0 || r.top > H || r.left > W) continue;
    const top = document.elementFromPoint(Math.min(W - 1, Math.max(0, r.left + r.width/2)), Math.min(H - 1, Math.max(0, r.top + r.height/2)));
    if(top && top !== e && !e.contains(top) && !top.contains(e)) continue; // bị lớp khác phủ lên: người chơi không thấy
    const fs = parseFloat(getComputedStyle(e).fontSize), root = v54qRoot(e), rk = root === document.body ? 'HUD' : '#' + (root.id || root.className);
    if(own && fs < 15.5){ const g = small.get(rk) || small.set(rk, []).get(rk); if(g.length < 8) g.push(`${v54qSel(e)} ${fs}px “${e.textContent.trim().slice(0, 24)}”`); else g.more = (g.more || 0) + 1; }
    if((r.right > W + 4 || r.left < -4 || r.bottom > H + 4) && r.width < W*1.5 && !v54qClipped(e, r)){ const k = v54qSel(e); if(over.length < 12 && !over.some(o => o.k === k)) over.push({k, r:`${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}×${Math.round(r.height)}`}); }
  }
  small.forEach((L, rk) => v54qIssue(phone ? 'mid' : 'low', 'chữ', `Chữ nhỏ hơn 16px trong ${rk === 'HUD' ? 'thanh HUD/màn hình chính' : rk}`,
    {desc:L.join(' · ') + (L.more ? ` · và ${L.more} chỗ khác` : ''), key:'chữ|' + rk, repro:'Mở ' + ctxName + ' rồi nhìn chữ nhỏ.'}));
  if(over.length) v54qIssue('mid', 'tràn', `Phần tử tràn khỏi màn hình ở “${ctxName}” (${over.length})`, {desc:over.map(o => o.k + ' @ ' + o.r).join(' · '), key:'tràn|' + over.map(o => o.k).join(',')});
  // nút che nhau: chỉ so các nút CÙNG một lớp (cùng HUD hoặc cùng một cửa sổ) và đang thật sự hiện trên cùng
  const B = [...document.querySelectorAll('button, .mobctl, [role=button]')].filter(b => v54qVis(b) && !b.closest('#v54qPanel')).slice(0, 260).map(b => [b, v54qVisRect(b), v54qRoot(b, true)]).filter(([b, r]) => r.width > 4 && r.height > 4 && r.top < H && r.left < W && r.bottom > 0 && r.right > 0);
  const hit = [];
  for(let i = 0; i < B.length && hit.length < 6; i++) for(let j = i + 1; j < B.length; j++){
    const [a, ra, oa] = B[i], [b, rb, ob] = B[j]; if(oa !== ob || a.contains(b) || b.contains(a)) continue;
    if(a.classList.contains('pk') && b.classList.contains('pk')) continue; // phím đàn đen nằm trên phím trắng: đúng thiết kế
    const ix = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), iy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top); if(ix <= 2 || iy <= 2) continue;
    const ov = ix*iy/Math.min(ra.width*ra.height, rb.width*rb.height); if(ov < .25 || ov > .95) continue; // che hẳn = lớp trên đè lớp dưới (không phải lỗi bố cục)
    const ta = document.elementFromPoint(Math.max(ra.left, rb.left) + ix/2, Math.max(ra.top, rb.top) + iy/2); if(!ta || !(a.contains(ta) || b.contains(ta) || ta === a || ta === b)) continue;
    hit.push(`${v54qSel(a)} ↔ ${v54qSel(b)} (${Math.round(ov*100)}%)`);
  }
  // nút đè lên một bảng/khung cố định khác (vd. nút nổi đè lên bảng Nhật ký)
  const PN = [...document.querySelectorAll('body > *, .app > *, #stage > *')].filter(e => e.id && !/^(v54q|toast|world)/.test(e.id) && v54qVis(e) && getComputedStyle(e).position === 'fixed').map(e => [e, e.getBoundingClientRect()]).filter(([e, r]) => r.width*r.height < W*H*.5 && r.width > 40 && r.height > 40);
  for(const [b, rb, ob] of B){ if(hit.length >= 8) break; for(const [p, rp] of PN){ if(p === ob || p.contains(b) || b.contains(p) || ob.contains(p)) continue;
    const ix = Math.min(rb.right, rp.right) - Math.max(rb.left, rp.left), iy = Math.min(rb.bottom, rp.bottom) - Math.max(rb.top, rp.top); if(ix <= 4 || iy <= 4) continue;
    const ov = ix*iy/Math.min(rb.width*rb.height, rp.width*rp.height); if(ov < .25 || ov > .95) continue; const ta = document.elementFromPoint(Math.max(rb.left, rp.left) + ix/2, Math.max(rb.top, rp.top) + iy/2); if(!ta || !(b.contains(ta) || p.contains(ta))) continue;
    hit.push(`${v54qSel(b)} ↔ bảng #${p.id} (${Math.round(ov*100)}%)`); } }
  if(hit.length) v54qIssue('mid', 'che', `Nút che nhau ở “${ctxName}”`, {desc:hit.join(' · '), key:'che|' + hit.map(h => h.split(' (')[0]).join(',')});
}
