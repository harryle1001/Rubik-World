// ================= v75w · ĐŨA THẦN: CHẠM ĐÂU PHÓNG PHÉP ĐÓ =================
// Khi đang CẦM Đũa thần (v48c, V48C.on): chạm / bấm chuột trái vào bất kỳ điểm nào trên màn chơi → nhân vật quay về phía đó, vung đũa,
// luồng phép (đạn phép v50 – vệt sáng lấp lánh màu theo phép) bay từ đầu đũa tới đúng điểm chạm và nổ hiệu ứng vui.
// Phép vô hại: hoa nở, bong bóng bay, cầu vồng, mây tuyết, mây mưa tưới mầm; NPC trúng phép thì cười / nhảy / bay bong bóng / đổi màu áo.
// Vật phát sáng cũ của v48c (hoa, đèn, cây, đồ hỏng, hào nước) vẫn dùng phép cũ, nay có luồng phép bay tới.
// Cầm đũa: chạm KHÔNG đi bộ và không mở cửa (vuốt để đi như cũ). Cất đũa → mọi thứ như cũ. Mọi tên toàn cục có tiền tố v75w / V75W.
const V75W_RANGE = 340, V75W_CD = .42, V75W_FXMAX = 48;
const V75W_SP = [
  {id:'star', ic:'✨', vi:'Sao lấp lánh', w:0, npc:['🤩', 'Oa, sao lấp lánh!', 'jump']},
  {id:'flower', ic:'🌸', vi:'Hoa nở', w:7, npc:['😊', 'Hoa đẹp quá!', 'jump']},
  {id:'bubble', ic:'🫧', vi:'Bong bóng', w:6, npc:['😆', 'Ơ, mình bay nè!', 'float']},
  {id:'rainbow', ic:'🌈', vi:'Cầu vồng', w:11, npc:['😮', 'Áo mình đổi màu!', 'color']},
  {id:'snow', ic:'❄️', vi:'Mây tuyết', w:2, npc:['😲', 'Lạnh ghê, hihi!', 'shiver']},
  {id:'rain', ic:'🌧️', vi:'Mưa tưới cây', w:3, npc:['😄', 'Mát quá!', 'jump']}
];
const V75W = {sel:0, cd:0, sw:-9, aim:0, fx:[], dn:null, lt:0, bar:null, hint:0, inner:0, last:null, n:0};

function v75wOk(){
  return typeof V48C !== 'undefined' && V48C.on && typeof PLAYER !== 'undefined' && PLAYER && PLAYER.visible && PLAYER.controlled && !PLAYER.boat && !PLAYER.v16fly
    && typeof V46 !== 'undefined' && V46.on && !V46.sky && !(typeof V50 !== 'undefined' && V50.open) && !(typeof openModal !== 'undefined' && openModal);
}
function v75wW(sx, sy){ return [cam.x + (sx - cw/2)/cam.z, cam.y + (sy - ch/2)/cam.z]; }
function v75wS(wx, wy){ return [(wx - cam.x)*cam.z + cw/2, (wy - cam.y)*cam.z + ch/2]; }
// đầu đũa (toạ độ đảo mới) theo góc vung
function v75wTip(a){ const pp = v46Pos(PLAYER), d = PLAYER.dir < 0 ? -1 : 1; return [pp[0] + d*6 + Math.cos(a)*15, pp[1] - 14 + Math.sin(a)*15]; }
function v75wWand(){ return V50_WANDS[V75W_SP[V75W.sel].w] || V50_WANDS[0]; }

// ---------- phóng phép ----------
function v75wFace(wx, wy){ const pp = v46Pos(PLAYER); PLAYER.dir = wx < pp[0] ? -1 : 1; const d = PLAYER.dir; V75W.aim = Math.atan2(wy - (pp[1] - 14), wx - (pp[0] + d*6)); V75W.sw = realT; }
function v75wFire(wx, wy, wi, onHit){
  v75wFace(wx, wy); const t = v75wTip(V75W.aim);
  const b = v50Cast(t[0], t[1], wx, wy, wi, onHit); V75W.last = {tx:wx, ty:wy, sx:t[0], sy:t[1], t:realT, hit:null}; return b;
}
function v75wCast(sx, sy){
  if(realT < V75W.cd) return; V75W.cd = realT + V75W_CD; const pp = v46Pos(PLAYER), sp = V75W_SP[V75W.sel];
  let [wx, wy] = v75wW(sx, sy); const dx = wx - pp[0], dy = wy - (pp[1] - 14), d = Math.hypot(dx, dy);
  if(d > V75W_RANGE){ wx = pp[0] + dx/d*V75W_RANGE; wy = pp[1] - 14 + dy/d*V75W_RANGE; }   // quá xa: bay tới tầm tối đa theo hướng đó
  V75W.n++; v75wBarCd(); const req = v75wW(sx, sy);
  v75wFire(wx, wy, sp.w, (tx, ty) => { if(V75W.last) V75W.last.hit = [tx, ty]; try { v75wHit(sp, tx, ty); } catch(e){ console.warn('v75w hit', e); } }); V75W.last.req = req; V75W.last.far = d > V75W_RANGE;
}
function v75wHit(sp, x, y){
  // NPC gần điểm nổ: phản ứng vui
  let who = null, bd = 34; if(typeof agents !== 'undefined') agents.forEach(a => { if(!a || a === PLAYER || !a.visible) return; const p = v46Pos(a), dd = Math.hypot(p[0] - x, p[1] - 16 - y); if(dd < bd){ bd = dd; who = a; } });
  if(who){ who.v75w = {t:realT, k:sp.npc[2], e:sp.npc[0], s:sp.npc[1], T:sp.npc[2] === 'color' ? 8 : 2.4}; const p = v46Pos(PLAYER), q = v46Pos(who); who.dir = p[0] < q[0] ? -1 : 1; who.bubble = sp.npc[0] + ' ' + sp.npc[1]; who.bubbleT = realT + 2.6; try { v48cChime(3 + V75W.sel); } catch(e){} }
  const F = V75W.fx, add = o => { o.t = realT; F.push(o); if(F.length > V75W_FXMAX) F.shift(); };
  if(sp.id === 'star'){ for(let i = 0; i < 3; i++) add({k:'tw', x:x + (Math.random() - .5)*50, y:y + (Math.random() - .5)*34, T:1.2 + i*.25}); }
  else if(sp.id === 'flower'){ const C = ['#ff8fc4', '#ffd23f', '#ffffff', '#c9a6ff', '#ff6b6b'], n = who ? 3 : 5; for(let i = 0; i < n; i++){ const a = i/n*6.28 + Math.random(), r = i ? 10 + Math.random()*18 : 0; add({k:'fl', x:x + Math.cos(a)*r*1.3, y:y + Math.sin(a)*r*.7, T:9 + Math.random()*2, c:C[(i + V75W.n) % 5], d:i*.12}); } }
  else if(sp.id === 'bubble'){ for(let i = 0; i < 6; i++) add({k:'bb', x:x + (Math.random() - .5)*40, y:y + (Math.random() - .5)*16, T:2.6 + Math.random()*1.6, r:5 + Math.random()*6, ph:Math.random()*6}); }
  else if(sp.id === 'rainbow') add({k:'rb', x, y, T:3.6});
  else if(sp.id === 'snow') add({k:'cl', x, y, T:3.2, sn:1, e:0});
  else if(sp.id === 'rain') add({k:'cl', x, y, T:3, sn:0, e:0});
}
// ---------- vẽ hiệu ứng mặt đất (trước lớp tối) và trên không (sau lớp tối) ----------
function v75wGround(dt){
  const F = V75W.fx; for(let i = F.length - 1; i >= 0; i--){ const o = F[i], a = realT - o.t; if(a > o.T){ F.splice(i, 1); continue; }
    const fade = Math.min(1, (o.T - a)/.8);
    if(o.k === 'fl' || o.k === 'sp'){ const g = Math.max(0, Math.min(1, (a - (o.d || 0))/.5)), e = 1 - (1 - g)*(1 - g)*(1 - g); if(e <= 0) continue; ctx.globalAlpha = fade;
      ctx.fillStyle = '#2f9e4f'; ctx.fillRect(o.x - 1, o.y - 9*e, 2, 9*e); ctx.fillStyle = '#3fd36a'; ctx.beginPath(); ctx.ellipse(o.x + 3*e, o.y - 4*e, 3*e, 1.6*e, -.5, 0, 6.29); ctx.fill();
      if(o.k === 'fl'){ const r = 3.4*e, cy = o.y - 10*e, sw = Math.sin(realT*2 + o.x)*.3; ctx.fillStyle = o.c; for(let k = 0; k < 5; k++){ const an = k*1.2566 + sw; ctx.beginPath(); ctx.arc(o.x + Math.cos(an)*r, cy + Math.sin(an)*r*.8, r*.75, 0, 6.29); ctx.fill(); }
        ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(o.x, cy, r*.55, 0, 6.29); ctx.fill(); } ctx.globalAlpha = 1; }
  }
}
function v75wAir(dt){
  const F = V75W.fx; for(let i = 0; i < F.length; i++){ const o = F[i], a = realT - o.t, fade = Math.max(0, Math.min(1, (o.T - a)/.6));
    if(o.k === 'tw'){ const s = 6 + Math.sin(a*9)*3; ctx.globalAlpha = fade; ctx.drawImage(v50Shape('star', '#fff3b0'), o.x - s, o.y - s - a*16, s*2, s*2); ctx.globalAlpha = 1; }
    else if(o.k === 'bb'){ const yy = o.y - 10 - a*34, xx = o.x + Math.sin(a*2.4 + o.ph)*7; if(o.T - a < .12){ if(!o.pop){ o.pop = 1; for(let k = 0; k < 5; k++){ const an = k*1.26; v50P(xx, yy, Math.cos(an)*50, Math.sin(an)*50, .3, 4, v50Glow('#c9ecff')); } } continue; }
      ctx.globalAlpha = .85*fade; ctx.strokeStyle = '#c9ecff'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(xx, yy, o.r, 0, 6.29); ctx.stroke(); ctx.fillStyle = 'rgba(160,215,255,.22)'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(xx - o.r*.5, yy - o.r*.55, 2, 2); ctx.globalAlpha = 1; }
    else if(o.k === 'rb'){ const g = Math.min(1, a/.4), R = 30*g; ctx.globalAlpha = .75*fade; ctx.lineWidth = 3.2; V50_RUBIK.forEach((c, k) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(o.x, o.y, Math.max(1, R + 12 - k*3), Math.PI, Math.PI*2); ctx.stroke(); }); ctx.globalAlpha = 1;
      if(Math.random() < .3) v50P(o.x + (Math.random() - .5)*70, o.y - 20 - Math.random()*20, 0, -20, .6, 5, v50Glow(V50_RUBIK[Math.floor(Math.random()*6)])); }
    else if(o.k === 'cl'){ const cy = o.y - 64 + Math.sin(a*2)*2, sc = Math.min(1, a/.3); ctx.globalAlpha = .92*fade; ctx.fillStyle = o.sn ? '#eef6ff' : '#cfd8e6';
      [[-14, 2, 11], [0, -4, 14], [14, 2, 11], [6, 6, 10], [-6, 6, 10]].forEach(c => { ctx.beginPath(); ctx.arc(o.x + c[0]*sc, cy + c[1]*sc, c[2]*sc, 0, 6.29); ctx.fill(); }); ctx.globalAlpha = 1;
      if(a < o.T - .5){ o.e += dt; while(o.e > (o.sn ? .07 : .035)){ o.e -= o.sn ? .07 : .035; const px = o.x + (Math.random() - .5)*34;
          if(o.sn) v50P(px, cy + 8, (Math.random() - .5)*14, 26, 1.9, 4, v50Shape('star', '#ffffff'), 6); else v50P(px, cy + 8, 0, 150, .38, 3, v50Glow('#9fd8ff'), 0); } }
      if(!o.sn && !o.grew && a > 1.4){ o.grew = 1; for(let k = 0; k < 4; k++) V75W.fx.push({k:k % 2 ? 'fl' : 'sp', x:o.x + (k - 1.5)*10, y:o.y + (Math.random() - .5)*8, t:realT, T:8, c:['#ffd23f', '#ff8fc4'][k % 2 ? (k >> 1) : 0], d:k*.15}); } }
  }
}
// ---------- vẽ đũa trên tay + phản ứng NPC (bọc drawBody, toạ độ cục bộ của người) ----------
function v75wDrawWand(a){
  const d = a.dir < 0 ? -1 : 1, s = realT - V75W.sw, idle = d > 0 ? -1.05 : -Math.PI + 1.05; let an = idle;
  if(s < .45){ const u = s/.45, up = idle - d*.9; an = u < .3 ? idle + (up - idle)*(u/.3) : up + (V75W.aim - up)*Math.min(1, (u - .3)/.2); if(u > .75) an = V75W.aim + (idle - V75W.aim)*((u - .75)/.25); }
  const hx = d*6, hy = -14, ex = hx + Math.cos(an)*15, ey = hy + Math.sin(an)*15, w = v75wWand();
  ctx.strokeStyle = '#4a2c16'; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.strokeStyle = '#8b5e34'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.lineCap = 'butt';
  const pul = 1 + Math.sin(realT*6)*.2; ctx.globalCompositeOperation = 'lighter'; const gl = v50Glow(w.fx === 'rainbow' ? V50_RUBIK[Math.floor(realT*8) % 6] : w.c); ctx.drawImage(gl, ex - 7*pul, ey - 7*pul, 14*pul, 14*pul); ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#fff'; ctx.fillRect(ex - 1, ey - 1, 2, 2);
}
function v75wBodyFn(db0){
  return function(a, swim){
    const r = a && a.v75w; if(!r){ db0.apply(this, arguments); if(a === PLAYER && !swim && typeof V48C !== 'undefined' && V48C.on && !a.lion) try { v75wDrawWand(a); } catch(e){} return; }
    const u = realT - r.t; if(u > r.T || u < 0){ a.v75w = null; return db0.apply(this, arguments); }
    let oy = 0, ox = 0; const sh = a.shirt;
    if(r.k === 'jump') oy = -Math.abs(Math.sin(u*9))*10*Math.max(0, 1 - u/1.6);
    else if(r.k === 'float') oy = -Math.sin(Math.min(1, u/2.2)*Math.PI)*24;
    else if(r.k === 'shiver') ox = Math.sin(u*60)*1.4*Math.max(0, 1 - u/1.8);
    else if(r.k === 'color') a.shirt = V50_RUBIK[Math.floor(u*3) % 6];
    ctx.save(); ctx.translate(ox, oy);
    try { db0.apply(this, arguments); } finally { a.shirt = sh; }
    if(r.k === 'float'){ ctx.globalAlpha = .55; ctx.strokeStyle = '#c9ecff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, -14, 19, 0, 6.29); ctx.stroke(); ctx.fillStyle = 'rgba(160,215,255,.16)'; ctx.fill(); ctx.globalAlpha = 1; }
    ctx.restore();
  };
}
// ---------- thanh chọn phép ----------
function v75wCss(){
  if(document.getElementById('v75wCss')) return; const s = document.createElement('style'); s.id = 'v75wCss';
  s.textContent = '#v75wBar{position:absolute;z-index:7;left:50%;transform:translateX(-50%);bottom:calc(14px + env(safe-area-inset-bottom));display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;font-family:Nunito,"Be Vietnam Pro",system-ui,sans-serif}' +
    '#v75wBar[hidden]{display:none!important}#v75wBar .v75wRow{display:flex;gap:6px;padding:6px;border-radius:30px;background:rgba(20,16,44,.72);box-shadow:0 4px 18px rgba(0,0,0,.35);pointer-events:auto;backdrop-filter:blur(6px)}' +
    '#v75wBar button{position:relative;width:44px;height:44px;border-radius:50%;border:2px solid transparent;background:rgba(255,255,255,.1);font-size:23px;line-height:1;padding:0;cursor:pointer;color:#fff;font-family:inherit;touch-action:manipulation}' +
    '#v75wBar button.on{border-color:var(--c);background:rgba(255,255,255,.22);box-shadow:0 0 12px var(--c)}#v75wBar button.cd::after{content:"";position:absolute;inset:-2px;border-radius:50%;border:3px solid var(--c);animation:v75wCd .42s linear forwards}' +
    '@keyframes v75wCd{from{clip-path:inset(0 0 0 0);opacity:1}to{clip-path:inset(0 0 100% 0);opacity:.2}}' +
    '#v75wBar .v75wOff{width:auto;border-radius:22px;padding:0 12px;font-size:20px;background:rgba(255,255,255,.16)}#v75wBar .v75wOff small{font-size:16px;font-weight:800}' +
    '#v75wBar .v75wName{font-size:16px;font-weight:800;color:#fff7d6;background:rgba(20,16,44,.72);padding:4px 14px;border-radius:16px;text-shadow:0 1px 2px #000}' +
    '@media (orientation:portrait) and (max-width:600px){#v75wBar{left:auto;right:calc(8px + env(safe-area-inset-right));bottom:auto;top:50%;transform:translateY(-38%)}#v75wBar .v75wRow{flex-direction:column;padding:5px;gap:5px}#v75wBar .v75wName{display:none}#v75wBar .v75wOff{width:44px;padding:0;font-size:22px}#v75wBar .v75wOff small{display:none}}' +
    '@media (max-height:500px) and (orientation:landscape){#v75wBar{bottom:calc(8px + env(safe-area-inset-bottom));left:auto;right:calc(10px + env(safe-area-inset-right));transform:none}#v75wBar .v75wName{display:none}}';
  document.head.appendChild(s);
}
function v75wBarBuild(){
  if(V75W.bar) return V75W.bar; v75wCss(); const b = document.createElement('div'); b.id = 'v75wBar'; b.hidden = true; b.setAttribute('role', 'toolbar'); b.setAttribute('aria-label', 'Chọn phép thuật');
  let h = '<div class="v75wName"></div><div class="v75wRow">';
  V75W_SP.forEach((s, i) => { const w = V50_WANDS[s.w]; h += '<button type="button" data-i="' + i + '" aria-label="Phép ' + s.vi + '" style="--c:' + (w.fx === 'rainbow' ? '#ffd23f' : w.c) + '">' + s.ic + '</button>'; });
  b.innerHTML = h + '<button type="button" class="v75wOff" aria-label="Cất đũa">✋<small> Cất</small></button></div>';
  b.querySelectorAll('[data-i]').forEach(x => x.onclick = e => { e.stopPropagation(); V75W.sel = +x.dataset.i; v75wBarSync(); try { v50Snd('pop'); } catch(er){} const nm = b.querySelector('.v75wName'); if(nm && !nm.offsetWidth) try { toast(V75W_SP[V75W.sel].ic + ' Phép ' + V75W_SP[V75W.sel].vi); } catch(er){} });
  b.querySelector('.v75wOff').onclick = e => { e.stopPropagation(); try { v48cToggle(false); } catch(er){} v75wBarSync(); };
  ['pointerdown', 'pointerup'].forEach(t => b.addEventListener(t, e => e.stopPropagation()));
  (document.getElementById('stage') || document.body).appendChild(b); V75W.bar = b; v75wBarSync(); return b;
}
function v75wBarSync(){ const b = V75W.bar; if(!b) return; b.querySelectorAll('[data-i]').forEach(x => x.classList.toggle('on', +x.dataset.i === V75W.sel)); b.querySelector('.v75wName').textContent = '🪄 ' + V75W_SP[V75W.sel].vi + ' · chạm để phóng'; }
function v75wBarCd(){ const x = V75W.bar && V75W.bar.querySelector('[data-i="' + V75W.sel + '"]'); if(!x) return; x.classList.remove('cd'); void x.offsetWidth; x.classList.add('cd'); }
function v75wTick(){
  const on = v75wOk(); if(on && !V75W.bar) v75wBarBuild(); if(V75W.bar) V75W.bar.hidden = !on; document.body.classList.toggle('v75wOn', on);
}
// ---------- chạm / chuột ----------
function v75wInput(){
  const up = e => {
    const d = V75W.dn; if(!d || d.id !== e.pointerId) return; V75W.dn = null;
    const ms = e.pointerType === 'mouse', mv = Math.hypot(e.clientX - d.x, e.clientY - d.y), dt = performance.now() - d.t;
    if(mv > (ms ? 6 : 10) || dt > (ms ? 450 : 350) || d.multi || !v75wOk()) return;
    const r = cvs.getBoundingClientRect(); try { v75wCast(e.clientX - r.left, e.clientY - r.top); } catch(err){ console.warn('v75w cast', err); }
    if(e.target === cvs){   // chặn chạm-đi-bộ / mở cửa / chọn NPC, nhưng dọn trạng thái như các lớp cũ sẽ tự dọn
      e.stopImmediatePropagation(); try { drag = null; } catch(er){} try { cvs.releasePointerCapture(e.pointerId); } catch(er){} cvs.classList.remove('dragging');
      try { if(typeof MOB !== 'undefined' && MOB.pins){ MOB.pins.delete(e.pointerId); if(MOB.pins.size < 2) MOB.pinch = null; } } catch(er){} }
  };
  const act = new Set();   // chỉ đếm sự kiện thật (cần điều khiển nổi v32 tự phát pointerdown giả cho #mJoy)
  window.addEventListener('pointerdown', e => { if(!e.isTrusted) return; act.add(e.pointerId);
    if(e.target !== cvs || (e.pointerType === 'mouse' && e.button !== 0) || !v75wOk()){ if(V75W.dn) V75W.dn.multi = true; return; }
    if(V75W.dn){ V75W.dn.multi = true; return; } V75W.dn = {id:e.pointerId, x:e.clientX, y:e.clientY, t:performance.now(), multi:act.size > 1}; }, true);
  window.addEventListener('pointerup', e => { if(!e.isTrusted) return; act.delete(e.pointerId); up(e); }, true);
  window.addEventListener('pointercancel', e => { if(!e.isTrusted) return; act.delete(e.pointerId); if(V75W.dn && V75W.dn.id === e.pointerId) V75W.dn = null; }, true);
}
// ---------- gắn vào game ----------
function v75wInit(){
  if(typeof V48C === 'undefined' || typeof V50_WANDS === 'undefined' || typeof v46Lighting !== 'function') return;
  drawBody = v75wBodyFn(drawBody);
  // vẽ: mặt đất trước lớp tối, đạn phép + hạt sau lớp tối (phát sáng cả ban đêm)
  const L0 = v46Lighting; v46Lighting = function(VBn){
    const t = performance.now(), dt = Math.min(.05, V75W.lt ? (t - V75W.lt)/1000 : .016); V75W.lt = t; const busy = V75W.fx.length || V50B.some(b => b.on) || V75W.live;
    if(busy && !(typeof V50 !== 'undefined' && V50.open)) try { v75wGround(dt); } catch(e){ console.warn('v75w g', e); }
    L0.apply(this, arguments);
    if(busy && !(typeof V50 !== 'undefined' && V50.open)){ try { v75wAir(dt); v50BDraw(ctx, dt); v50PDraw(ctx, dt); } catch(e){ console.warn('v75w air', e); } V75W.live = realT - V75W.cd < 3.5 || V75W.fx.length > 0; }
  };
  // đũa cũ của v48c (vẽ ở lớp lâu đài) → bỏ, vì v75w vẽ đũa trên tay ở mọi nơi
  if(typeof v48cWorld === 'function'){ const w0 = v48cWorld; v48cWorld = function(){ if(!V48C.on) return w0.apply(this, arguments); const r0 = rect;
    rect = function(c, x, y, w, h){ if((c === '#6b4226' && x === -1.5 && y === -16) || (c === '#e8c27a' && x === -2 && y === -19 && w === 4)) return; return r0(c, x, y, w, h); };
    try { return w0.apply(this, arguments); } finally { rect = r0; } }; }
  // vật phát sáng v48c: luồng phép bay tới rồi mới làm phép cũ
  if(typeof v48cCast === 'function'){ const c0 = v48cCast; v48cCast = function(it, wx, wy){
    if(V75W.inner || !it || !v75wOk()) return c0.apply(this, arguments);
    const pp = v46Pos(PLAYER); if(Math.hypot(it.x - pp[0], it.y - pp[1]) > 380) return c0.apply(this, arguments);
    if(realT < V75W.cd) return true; V75W.cd = realT + V75W_CD; const tx = it.x, ty = it.y - 18 - (it.lift || 0); V75W.live = true;
    v75wFire(tx, ty, V75W_SP[V75W.sel].w, () => { V75W.inner = 1; try { c0(it, wx, wy); } catch(e){ console.warn('v75w v48c', e); } finally { V75W.inner = 0; } }); v75wBarCd(); return true; }; }
  // lời nhắc khi cầm đũa
  const t0 = toast; toast = function(m){ if(typeof m === 'string' && /^🪄 Cầm đũa: chạm vào vật phát sáng/.test(m)) m = '🪄 Cầm đũa: chạm vào đâu cũng phóng phép! Vuốt để đi · chọn phép ở thanh dưới.'; return t0.call(this, m, ...Array.prototype.slice.call(arguments, 1)); };
  v75wInput(); setInterval(() => { try { v75wTick(); } catch(e){} }, 250);
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v75w = {V75W, V75W_SP, v75wCast, v75wW, v75wS, v75wOk};
}
