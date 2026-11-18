// ================= v51a · SỰ SỐNG TRÊN PHỐ: dân phố đi lại & trò chuyện, mèo trên mái, cú ở bưu cục, bóng bay, khói bếp, mùa, ngày/đêm =================
const V51A_LINES = ['Kem xoài ngon lắm! 🥭', 'Mình vừa mua sách sao 📚', 'Chổi mới bay êm ghê 🧹', 'Mình đang tiết kiệm để mua cú 🦉', 'Chào bạn! 👋', 'Hello! Nice wand ✨', 'Mèo trên mái kìa 🐈', 'Tháp đồng hồ đẹp quá 🕰️', 'Cảm ơn bạn nhé 💛', 'Cùng giải Rubik không? 🧩', 'Trời lạnh, uống ca cao nhé ☕', 'Mình gửi heo đất $10 rồi 🐷'];
const V51A_HATS = ['#3a2f5c', '#7a1f2b', '#1d2a5c', '#2f5a3e', null, null, '#4a2a6a', null];
const V51A_BALC = ['#ff5a8a', '#ffd23f', '#7fd3ff', '#7fe36a', '#b089ff', '#ff8a2b'];
function v51aMakeLife(){
  v51aLayout(); const SK = ['#f1c27d', '#e0ac69', '#c68642', '#ffdbac', '#8d5524'], HR = ['#3a2a1a', '#1a1a1a', '#7a4a1a', '#c8a050', '#5a2a1a', '#e8e8f0'], rr = v51aRnd(4321);
  const mk = (x, y, i) => ({x, y, tx:x, ty:y, dir:rr() < .5 ? -1 : 1, walk:0, moving:false, wait:rr()*4, skin:SK[i % 5], hair:HR[(i*3) % 6], long:i % 3 === 0, shirt:['#f4f4f4', '#ffe9a8', '#c8e0ff', '#ffd0e0'][i % 4],
    robe:V50_ROBE_COLS[(i*5) % 12][0], sty:i % 4, hc:i % 4 === 0 ? V50_HOUSES[i % 6].c : null, wand:i % 3 ? null : i % 12, hat:V51A_HATS[i % 8], kid:i % 3 !== 1, bal:i % 7 === 2 ? V51A_BALC[i % 6] : null, say:'', sayT:0, ph:rr()*6});
  V51AW.npc = []; for(let i = 0; i < 22; i++){ let x, y, k = 0; do { x = 160 + rr()*2300; y = v51aCy(x) + (rr() - .5)*V51A_HW*1.4; } while(!v51aWalk(x, y) && ++k < 30); V51AW.npc.push(mk(x, y, i)); }
  // 3 cặp đứng trò chuyện trước tiệm
  V51AW.pairs = []; [[700, 0], [1300, 3], [2150, 6]].forEach(([x, li], j) => { const y = v51aCy(x) - 10, a = mk(x - 13, y, 30 + j*2), b = mk(x + 13, y + 2, 31 + j*2); a.dir = 1; b.dir = -1; V51AW.pairs.push({a, b, li, t:j*1.3}); });
  // mèo trên mái: đứng ở đỉnh mái, thỉnh thoảng nhảy sang mái bên cạnh
  v51aBack(); const T = V51AW.tips; V51AW.cats = [0, 1, 2].map(k => ({i:Math.min(T.length - 1, 3 + k*Math.floor(T.length/3)), j:-1, u:0, wait:3 + k*3, c:['#2a2a33', '#e0a050', '#f4f4f4'][k], meow:0}));
  const post = V51AW.blds.find(b => b.k === 'post'); V51AW.owls = post && post.perch ? post.perch.map((p, k) => ({x:p[0], y:p[1], ph:k*1.7, c:['#f4f4f8', '#a86a3a', '#c8a070'][k]})) : [];
  V51AW.ents = []; V51AW.lanLit.fill(0);
}
// ---------- cập nhật ----------
function v51aUpdate(dt){
  const m = V51AW.me, K = V51AW.keys; let dx = (K.ArrowRight || K.d ? 1 : 0) - (K.ArrowLeft || K.a ? 1 : 0), dy = (K.ArrowDown || K.s ? 1 : 0) - (K.ArrowUp || K.w ? 1 : 0);
  if(V51AW.joy && V51AW.joy.on){ dx = V51AW.joy.vx; dy = V51AW.joy.vy; } const L = Math.hypot(dx, dy); m.moving = L > .15; v51aFxTick(dt);
  if(m.moving){ const sp = 150*Math.min(1, L)*(v51aFxOn('speed') ? 1.5 : 1), nx = m.x + dx/L*sp*dt, ny = m.y + dy/L*sp*dt; if(v51aWalk(nx, ny)){ m.x = nx; m.y = ny; } else if(v51aWalk(nx, m.y)) m.x = nx; else if(v51aWalk(m.x, ny)) m.y = ny; else { const c = v51aCy(nx), t2 = Math.max(c - V51A_HW + 6, Math.min(v51aSouth(nx) - 8, m.y)); if(v51aWalk(nx, t2)){ m.x = nx; m.y += (t2 - m.y)*.3; } }
    if(Math.abs(dx) > .1) m.dir = dx < 0 ? -1 : 1; m.walk += dt*10; }
  // vệt chân (thú cưng đi theo)
  V51AW.bub += dt; if(V51AW.bub > .05){ V51AW.bub = 0; const T = V51AW.tr; if(m.moving || !T[0]){ const i = V51AW.trI; T[i*2] = m.x; T[i*2 + 1] = m.y; V51AW.trI = (i + 1) % 40; } }
  V51AW.npc.forEach(a => { if(a.sayT > 0) a.sayT -= dt; if(a.wait > 0){ a.wait -= dt; a.moving = false; if(a.wait <= 0){ let k = 0; do { a.tx = a.x + (Math.random() < .5 ? -1 : 1)*(80 + Math.random()*260); a.ty = v51aCy(a.tx) + (Math.random() - .5)*V51A_HW*1.4 + v51aPlaza(a.tx)*Math.random()*.7; } while(!v51aWalk(a.tx, a.ty) && ++k < 12); if(k >= 12){ a.tx = a.x; a.ty = a.y; } } return; }
    const ddx = a.tx - a.x, ddy = a.ty - a.y, d = Math.hypot(ddx, ddy); if(d < 4){ a.wait = 1.5 + Math.random()*5; if(Math.random() < .3){ a.say = V51A_LINES[Math.floor(Math.random()*V51A_LINES.length)]; a.sayT = 3; } return; }
    const sp = a.kid ? 50 : 42, nx = a.x + ddx/d*sp*dt, ny = a.y + ddy/d*sp*dt; if(!v51aWalk(nx, ny)){ a.wait = .5; return; } a.x = nx; a.y = ny; a.moving = true; a.walk += dt*7; a.dir = ddx < 0 ? -1 : 1; });
  V51AW.pairs.forEach(p => { p.t += dt; if(p.t > 3.2){ p.t = 0; p.li = (p.li + 1) % V51A_LINES.length; } });
  V51AW.cats.forEach(c => { if(c.meow > 0) c.meow -= dt; if(c.j >= 0){ c.u += dt/.9; if(c.u >= 1){ c.i = c.j; c.j = -1; c.u = 0; c.wait = 6 + Math.random()*9; } return; } c.wait -= dt; if(c.wait <= 0){ const n = V51AW.tips.length, d = Math.random() < .5 ? -1 : 1, j = c.i + d; if(j >= 0 && j < n && Math.abs(V51AW.tips[j][0] - V51AW.tips[c.i][0]) < 170){ c.j = j; c.u = 0; } else c.wait = 2; } });
  for(let i = 0; i < V51AW.lanLit.length; i++) if(V51AW.lanLit[i] > 0) V51AW.lanLit[i] = Math.max(0, V51AW.lanLit[i] - dt/50);
  try { v51aQuestTick(dt); } catch(e){ console.warn('v51a quest', e); }
  // camera
  const z = V51AW.z, vw = V51AW.W/z, vh = V51AW.H/z; let cx = m.x, cy = v51aCy(m.x) - (V51AW.H > V51AW.W ? 95 : 70); cx = vw >= V51A_WX ? V51A_WX/2 : Math.max(vw/2, Math.min(V51A_WX - vw/2, cx)); cy = vh >= 1180 ? 410 : Math.max(-180 + vh/2, Math.min(V51A_WY1 - vh/2, cy));
  V51AW.cam.x += (cx - V51AW.cam.x)*Math.min(1, dt*5); V51AW.cam.y += (cy - V51AW.cam.y)*Math.min(1, dt*5);
  let near = null, nd = 1e9; V51AW.spots.forEach(s => { const d = Math.hypot(m.x - s.x, (m.y - s.y)*1.3); if(d < s.r + 30 && d < nd){ nd = d; near = s; } }); if(near !== V51AW.near){ V51AW.near = near; v51aActBtn(near); }
}
// ---------- vẽ người phố (áo choàng v50 + mũ nhọn + bóng bay) ----------
function v51aPerson(g, a, t){
  const k = a.kid ? .86 : 1.06; g.save(); g.translate(Math.round(a.x), Math.round(a.y)); g.scale(k, k); v50Person(g, 0, 0, a, t);
  if(a.hat){ const d = a.dir < 0 ? -1 : 1; g.fillStyle = a.hat; g.fillRect(-8, -35, 16, 3); g.beginPath(); g.moveTo(-6, -35); g.lineTo(d*3, -49); g.lineTo(d*6, -47); g.lineTo(6, -35); g.closePath(); g.fill(); g.fillStyle = '#ffd23f'; g.fillRect(-5, -37, 10, 2); }
  if(a.bal){ const bx = (a.dir < 0 ? -9 : 9), by = -62 + Math.sin(t*2 + a.ph)*2; g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = .8; g.beginPath(); g.moveTo(a.dir < 0 ? -7 : 7, -16); g.quadraticCurveTo(bx + 3, -36, bx, by + 9); g.stroke(); g.fillStyle = a.bal; g.beginPath(); g.ellipse(bx, by, 6, 7.5, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(bx - 3, by - 4, 2, 3); }
  g.restore();
}
function v51aDrawCat(g, x, y, c, t, sit){ const R = (cc, a, b, w, h) => { g.fillStyle = cc; g.fillRect(x + a, y + b, w, h); }, tl = Math.sin(t*2.5)*2;
  if(sit){ R(c, -4, -8, 8, 8); R(c, -3, -13, 6, 5); R(c, -3, -15, 2, 2); R(c, 1, -15, 2, 2); R('#ffd23f', -2, -11, 1, 1); R('#ffd23f', 1, -11, 1, 1); R(c, 4, -3 + tl*.3, 4, 2); R(c, 7, -7 + tl, 2, 5); }
  else { R(c, -6, -6, 11, 5); R(c, 3, -10, 6, 5); R(c, 3, -12, 2, 2); R(c, 7, -12, 2, 2); R(c, -9, -10 + tl, 2, 6); } }
// ---------- vẽ một khung ----------
function v51aDraw(dt){
  const g = V51AW.g, W = V51AW.W, H = V51AW.H, z = V51AW.z, cam = V51AW.cam, nk = v50Night(), s = v50Season(), t = performance.now()/1000, m = V51AW.me;
  g.setTransform(V51AW.dpr, 0, 0, V51AW.dpr, 0, 0); g.imageSmoothingEnabled = false; g.drawImage(v50SkyImg(), 0, 0, 2, 256, 0, 0, W, H);
  const ox = W/2 - cam.x*z, oy = H/2 - cam.y*z, X0 = cam.x - W/2/z, X1 = cam.x + W/2/z, Y0 = cam.y - H/2/z, Y1 = cam.y + H/2/z;
  if(nk > .05){ g.fillStyle = '#fff'; for(let i = 0; i < 70; i++){ g.globalAlpha = nk*(.35 + .65*Math.abs(Math.sin(t*1.5 + i))); const sx = ((i*137.5) % W + W - cam.x*.04 % W) % W, sy = (i*71.3) % (H*.45); g.fillRect(sx, sy, i % 7 ? 1.5 : 2.5, i % 7 ? 1.5 : 2.5); } g.globalAlpha = 1;
    const mx = W*.8, my = H*.1; g.globalAlpha = nk; g.fillStyle = '#f4f2e0'; g.beginPath(); g.arc(mx, my, 20, 0, 7); g.fill(); g.globalAlpha = 1; }
  g.setTransform(V51AW.dpr*z, 0, 0, V51AW.dpr*z, V51AW.dpr*ox, V51AW.dpr*oy);
  // mây + bóng mái xa (thị sai)
  const cl = v50CloudImg(); g.globalAlpha = nk > .5 ? .3 : .85; for(let i = 0; i < 6; i++){ const cx = ((i*480 + t*(6 + i*2)) % 3000) - 300 + cam.x*.5, cy = -120 + i*30; g.drawImage(cl, cx, cy, 120*(1 + i % 3*.4), 44*(1 + i % 3*.4)); } g.globalAlpha = 1;
  const far = v51aFar(); g.globalAlpha = .9; const fx0 = cam.x*.55 - 900; g.drawImage(far, fx0, 120); g.drawImage(far, fx0 + 2000, 120); g.globalAlpha = 1;
  // ảnh tĩnh phía sau (chỉ vùng thấy được)
  const bk = v51aBack(), sx = Math.max(0, Math.floor(X0)), sw = Math.min(bk.width - sx, Math.ceil(X1 - X0) + 2), sy = Math.max(0, Math.floor(Y0 - V51A_Y0)), sh = Math.min(bk.height - sy, Math.ceil(Y1 - Y0) + 2);
  if(sw > 0 && sh > 0) g.drawImage(bk, sx, sy, sw, sh, sx, sy + V51A_Y0, sw, sh);
  // cổng xoáy, đồng hồ, cú bưu cục, khói, mèo
  V51AW.blds.forEach(b => { if(b.arch && b.x > X0 - 80 && b.x < X1 + 80){ const [ax, ay, r, ry] = b.arch; g.save(); g.globalCompositeOperation = 'lighter'; for(let k = 0; k < 4; k++){ g.strokeStyle = (b.id === 'home' ? ['#3da5ff', '#7fe3ff', '#2fbf71', '#ffd23f'] : ['#7a6bff', '#e45bd8', '#3da5ff', '#ffd23f'])[k]; g.lineWidth = 3; g.beginPath(); g.ellipse(ax, ay, r*(.3 + k*.18), ry*(.35 + k*.16), t*(k % 2 ? 1 : -1)*.7, 0, 5); g.stroke(); } g.restore(); } });
  if(V51AW.clock){ const [cx, cy, r] = V51AW.clock, c = typeof clock === 'number' ? clock : 720, ha = (c/60 % 12)/12*6.283 - Math.PI/2, ma = (c % 60)/60*6.283 - Math.PI/2; g.strokeStyle = '#2a2a33'; g.lineCap = 'round'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ha)*r*.5, cy + Math.sin(ha)*r*.5); g.stroke(); g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ma)*r*.78, cy + Math.sin(ma)*r*.78); g.stroke(); g.fillStyle = '#ef4b4b'; g.beginPath(); g.arc(cx, cy, 3, 0, 7); g.fill(); g.lineCap = 'butt'; }
  V51AW.owls.forEach(o => { const bl = Math.sin(t*.7 + o.ph) > .96; v51aR(g, o.c, o.x - 4, o.y - 11, 8, 11); v51aR(g, o.c, o.x - 4, o.y - 13, 2, 2); v51aR(g, o.c, o.x + 2, o.y - 13, 2, 2); v51aR(g, '#fff', o.x - 3, o.y - 9, 3, bl ? 1 : 3); v51aR(g, '#fff', o.x + 1, o.y - 9, 3, bl ? 1 : 3); v51aR(g, '#ffb000', o.x - .5, o.y - 6, 1.5, 2); });
  V51AW.chim.forEach(c => { if(c[0] < X0 - 40 || c[0] > X1 + 40) return; for(let k = 0; k < 4; k++){ const u = (t*.22 + k/4 + c[2]) % 1; g.globalAlpha = .32*(1 - u)*(nk > .5 ? .6 : 1); g.fillStyle = nk > .5 ? '#9aa0c0' : '#e8e8f0'; g.beginPath(); g.arc(c[0] + Math.sin(u*5 + c[2])*6 + u*14, c[1] - u*60, 3 + u*8, 0, 7); g.fill(); } }); g.globalAlpha = 1;
  V51AW.cats.forEach(c => { const T = V51AW.tips, a = T[c.i]; if(!a) return; let x = a[0], y = a[1]; if(c.j >= 0){ const b = T[c.j], u = c.u; x = a[0] + (b[0] - a[0])*u; y = a[1] + (b[1] - a[1])*u - Math.sin(u*Math.PI)*34; } if(x < X0 - 30 || x > X1 + 30) return; v51aDrawCat(g, x, y + 1, c.c, t + c.i, c.j < 0);
    if(c.meow > 0) v51aBubbleW(g, x, y - 18, 'Meo~ 🐈', z); });
  // dây đèn lồng / cờ Rubik
  v51aStrings(g, t, X0, X1, nk);
  // nhân vật sắp theo y
  const E = V51AW.ents; E.length = 0; V51AW.npc.forEach(a => { if(a.x > X0 - 40 && a.x < X1 + 40) E.push(a); }); V51AW.pairs.forEach(p => { if(p.a.x > X0 - 40 && p.a.x < X1 + 40){ E.push(p.a); E.push(p.b); } }); E.push(m);
  const f = v51aFount(), ct = v51aCart(), bv = v51aBVend(); const fo = {y:f[1], fount:1}, co = {y:ct[1], cart:1}, vo = {y:bv[1], vend:1}; if(Math.abs(f[0] - cam.x) < W/z){ E.push(fo); E.push(co); E.push(vo); }
  E.sort((p, q) => p.y - q.y); m.hop = v51aFxOn('hop') && m.moving ? -Math.abs(Math.sin(t*7))*8 : 0;
  for(let i = 0; i < E.length; i++){ const e = E[i]; if(e === m) v51aDrawMe(g, t, dt); else if(e.fount) v51aFountain(g, f[0], f[1], t, s); else if(e.cart) v51aIceCart(g, ct[0], ct[1], t, s); else if(e.vend) v51aBalloonCart(g, bv[0], bv[1], t); else v51aPerson(g, e, t); }
  // phép (đạn + hạt) dùng chung pool v50
  v50BDraw(g, dt); v50PDraw(g, dt);
  // ảnh tĩnh phía trước (quầy + mái phía nam)
  const fr = v51aFront(), fsy = Math.max(0, Math.floor(Y0 - V51A_FY0)), fsh = Math.min(fr.height - fsy, Math.ceil(Y1 - Y0) + 2); if(sw > 0 && fsh > 0) g.drawImage(fr, sx, fsy, sw, fsh, sx, fsy + V51A_FY0, sw, fsh);
  v51aHuntDraw(g, t);
  // đêm: phủ màu + quầng sáng ấm cửa sổ, đèn lồng
  if(nk > .02){ g.setTransform(V51AW.dpr, 0, 0, V51AW.dpr, 0, 0); g.fillStyle = 'rgba(10,12,44,' + (.5*nk).toFixed(3) + ')'; g.fillRect(0, 0, W, H); g.setTransform(V51AW.dpr*z, 0, 0, V51AW.dpr*z, V51AW.dpr*ox, V51AW.dpr*oy);
    g.globalCompositeOperation = 'lighter'; const wg = v50Glow('#ffb347'), lg = v50Glow('#ffcf6a'), cg = v50Glow('#b089ff'); for(let i = 0; i < V51AW.win.length; i++){ const w = V51AW.win[i]; if(w[0] < X0 - 40 || w[0] > X1 + 40) continue; const fl = .85 + .15*Math.sin(t*3 + i), r = w[2]*(w[3] === 1 ? 1.5 : 1.15); g.globalAlpha = nk*(w[3] === 1 ? .75 : .5)*fl; g.drawImage(w[3] === 3 ? cg : wg, w[0] - r, w[1] - r, r*2, r*2); }
    g.globalAlpha = nk*.7; for(let k = 0; k < V51AW.strings.length; k++){ const S = V51AW.strings[k]; if(S.flag || S.x2 < X0 - 60 || S.x1 > X1 + 60) continue; for(let j = 1; j <= S.n; j++){ const p = v51aStrPt(S, j/(S.n + 1), t); g.drawImage(lg, p[0] - 22, p[1] - 18, 44, 44); } }
    g.globalAlpha = nk*.55; g.drawImage(lg, m.x - 50, m.y - 70, 100, 100); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  // thời tiết / mùa (toạ độ màn hình)
  g.setTransform(V51AW.dpr, 0, 0, V51AW.dpr, 0, 0); v51aSeasonFx(g, W, H, t, s, nk);
  // nhãn tiệm (chữ ≥ 16px trên màn hình) + bong bóng lời thoại
  g.font = V51A_FONT; g.textAlign = 'center'; g.textBaseline = 'middle';
  const LB = V51AW.lb || (V51AW.lb = []); LB.length = 0; if(V51AW.near) LB.push(V51AW.near); V51AW.spots.forEach(sp => { if(sp !== V51AW.near) LB.push(sp); }); const RC = []; LB.forEach(sp => { const px = (sp.x - cam.x)*z + W/2, py = (sp.y - cam.y)*z + H/2 - 60*z - 10; if(px < -90 || px > W + 90) return; const nr = V51AW.near === sp, d = Math.hypot(sp.x - m.x, sp.y - m.y); if(!nr && d > 240) return;
    const txt = sp.ic + ' ' + sp.vi, w = g.measureText(txt).width + 18; if(RC.some(r => Math.abs(r[0] - px) < (r[1] + w)/2 + 4 && Math.abs(r[2] - py) < 30)) return; RC.push([px, w, py]); g.globalAlpha = nr ? 1 : .8; g.fillStyle = nr ? 'rgba(255,210,63,.96)' : 'rgba(11,16,32,.74)'; v50RR(g, px - w/2, py - 14, w, 28, 14); g.fill(); g.fillStyle = nr ? '#1a1430' : '#f7f5ef'; g.fillText(txt, px, py + 1); }); g.globalAlpha = 1;
  let nb = 0; V51AW.npc.forEach(a => { if(a.sayT > 0 && nb < 2 && Math.abs(a.x - m.x) < 260 && ++nb) v51aBubble(g, (a.x - cam.x)*z + W/2, (a.y - cam.y)*z + H/2 - 52*z, a.say); });
  V51AW.pairs.forEach(p => { if(Math.abs(p.a.x - m.x) > 260 || nb >= 3) return; nb++; const sp = p.t < 1.6 ? p.a : p.b; v51aBubble(g, (sp.x - cam.x)*z + W/2, (sp.y - cam.y)*z + H/2 - 52*z, V51A_LINES[(p.li + (p.t < 1.6 ? 0 : 1)) % V51A_LINES.length]); });
  if(V51AW.hint > 0){ V51AW.hint -= dt; g.globalAlpha = Math.min(1, V51AW.hint); const txt = '👆 Kéo để đi · Chạm tiệm để vào', w = g.measureText(txt).width + 28; g.fillStyle = 'rgba(11,16,32,.82)'; v50RR(g, W/2 - w/2, H*.7 - 18, w, 36, 18); g.fill(); g.fillStyle = '#fff'; g.fillText(txt, W/2, H*.7 + 1); g.font = '28px sans-serif'; g.fillText('👆', W/2 + Math.sin(t*3)*40, H*.7 + 46); g.globalAlpha = 1; g.font = V51A_FONT; }
  v51aQuestDraw(g, W, H, t, z, cam);
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  const j = V51AW.joy; if(j && j.on){ g.globalAlpha = .55; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(j.x0, j.y0, 46, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.arc(j.x0 + j.vx*40, j.y0 + j.vy*40, 20, 0, 7); g.fill(); g.globalAlpha = 1; }
  v50Flash(g, W, H, dt);
}
function v51aBubble(g, x, y, s){ g.font = V51A_FONT; const w = g.measureText(s).width + 20; g.fillStyle = 'rgba(255,255,255,.95)'; v50RR(g, x - w/2, y - 30, w, 28, 12); g.fill(); g.beginPath(); g.moveTo(x - 5, y - 3); g.lineTo(x + 5, y - 3); g.lineTo(x, y + 4); g.fill(); g.fillStyle = '#1a1430'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y - 15); }
function v51aBubbleW(g, x, y, s, z){ g.save(); g.translate(x, y); g.scale(1/z, 1/z); v51aBubble(g, 0, 0, s); g.restore(); }
function v51aStrPt(S, u, t){ const sw = Math.sin(t*1.3 + S.ph + u*3)*2.5; return [S.x1 + (S.x2 - S.x1)*u + sw, S.y1 + (S.y2 - S.y1)*u + Math.sin(u*Math.PI)*28]; }
function v51aStrings(g, t, X0, X1, nk){
  for(let k = 0; k < V51AW.strings.length; k++){ const S = V51AW.strings[k]; if(S.x2 < X0 - 60 || S.x1 > X1 + 60) continue; g.strokeStyle = 'rgba(40,30,30,.7)'; g.lineWidth = 1; g.beginPath(); for(let i = 0; i <= 10; i++){ const p = v51aStrPt(S, i/10, t); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke();
    if(S.flag){ for(let i = 1; i < 10; i++){ const p = v51aStrPt(S, i/10, t); g.fillStyle = V51A_RUBIK[i % 6]; g.beginPath(); g.moveTo(p[0] - 4, p[1]); g.lineTo(p[0] + 4, p[1]); g.lineTo(p[0], p[1] + 9); g.closePath(); g.fill(); } continue; }
    for(let j = 1; j <= S.n; j++){ const p = v51aStrPt(S, j/(S.n + 1), t), lit = nk > .3 || V51AW.lanLit[(k*5 + j) % 64] > 0; g.fillStyle = '#2a2a33'; g.fillRect(p[0] - 3, p[1] - 1, 6, 2); g.fillStyle = lit ? ['#ffcf6a', '#ff8a5a', '#ffe9a8'][j % 3] : ['#c23a3a', '#d8a03a', '#c2603a'][j % 3]; g.beginPath(); g.ellipse(p[0], p[1] + 6, 4.5, 5.5, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(p[0] - 4, p[1] + 6, 8, 1); g.fillRect(p[0] - 2, p[1] + 11, 4, 2);
      if(lit && nk <= .3){ g.globalCompositeOperation = 'lighter'; g.globalAlpha = .6; g.drawImage(v50Glow('#ffcf6a'), p[0] - 16, p[1] - 10, 32, 32); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } } }
}
function v51aFountain(g, x, y, t, s){
  g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x + 4, y + 4, 50, 20, 0, 0, 7); g.fill(); g.fillStyle = '#9a96a6'; g.beginPath(); g.ellipse(x, y, 48, 19, 0, 0, 7); g.fill(); g.fillStyle = s === 'dong' ? '#d4e8f8' : '#5aa8e0'; g.beginPath(); g.ellipse(x, y - 2, 40, 14, 0, 0, 7); g.fill();
  g.fillStyle = '#b5b0c0'; g.fillRect(x - 5, y - 30, 10, 28); g.beginPath(); g.ellipse(x, y - 30, 16, 6, 0, 0, 7); g.fill();
  if(s !== 'dong'){ for(let k = 0; k < 6; k++){ const a = k/6*6.283 + t*.4, u = (t*1.2 + k/6) % 1; g.fillStyle = V51A_RUBIK[k]; g.globalAlpha = .85; const px = x + Math.cos(a)*(6 + u*30), py = y - 34 - Math.sin(u*Math.PI)*26 + u*30; g.fillRect(px - 1.5, py - 1.5, 3, 3); } g.globalAlpha = 1;
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y - 2, 18 + (t*20 % 20), 6 + (t*7 % 7), 0, 0, 7); g.stroke(); }
  g.fillStyle = '#ffd23f'; g.fillRect(x - 3, y - 40, 6, 6);
}
function v51aIceCart(g, x, y, t, s){
  g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x, y + 2, 32, 7, 0, 0, 7); g.fill(); v51aR(g, '#ffe9f2', x - 28, y - 30, 56, 26); v51aR(g, '#ff8fc4', x - 28, y - 12, 56, 4); v51aR(g, '#7fd3ff', x - 28, y - 30, 56, 4);
  for(let k = 0; k < 2; k++){ g.fillStyle = '#5a3a22'; g.beginPath(); g.arc(x - 16 + k*32, y - 3, 5, 0, 7); g.fill(); g.fillStyle = '#c8c8d0'; g.beginPath(); g.arc(x - 16 + k*32, y - 3, 2, 0, 7); g.fill(); }
  for(let k = 0; k < 5; k++){ g.fillStyle = V51A_ICE[k][4]; g.beginPath(); g.arc(x - 20 + k*10, y - 33, 4.5, Math.PI, 0); g.fill(); }
  v51aR(g, '#e8e8f0', x - 1, y - 74, 2, 44); for(let k = 0; k < 6; k++){ g.fillStyle = k % 2 ? '#fff' : '#ff8fc4'; g.beginPath(); g.moveTo(x, y - 82); g.arc(x, y - 72, 36, Math.PI + k*Math.PI/6, Math.PI + (k + 1)*Math.PI/6); g.closePath(); g.fill(); } if(s === 'dong') v51aR(g, '#f4f8ff', x - 30, y - 74, 60, 3);
  v51aPerson(g, {x:x + 34, y:y - 2, dir:-1, moving:false, walk:0, skin:'#ffdbac', hair:'#7a4a1a', long:true, shirt:'#fff', robe:'#ff8fc4', sty:3, hc:null, wand:null, hat:null, kid:false, bal:null}, t);
}
function v51aBalloonCart(g, x, y, t){
  v51aR(g, '#6b4226', x - 18, y - 16, 36, 14); g.fillStyle = '#3a2a1e'; g.beginPath(); g.arc(x - 10, y - 2, 4, 0, 7); g.arc(x + 10, y - 2, 4, 0, 7); g.fill();
  for(let k = 0; k < 7; k++){ const a = -Math.PI/2 + (k - 3)*.32, bx = x + Math.cos(a)*30 + Math.sin(t*1.6 + k)*2, by = y - 58 + Math.sin(a)*26 + Math.cos(t*1.3 + k)*2; g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = .8; g.beginPath(); g.moveTo(x, y - 16); g.lineTo(bx, by + 8); g.stroke(); g.fillStyle = V51A_BALC[k % 6]; g.beginPath(); g.ellipse(bx, by, 7, 8.5, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(bx - 3, by - 5, 2, 3); }
  // một quả bay lên trời mỗi ~10 giây
  const u = (t % 10)/10; if(u < .7){ const bx = x + 40 + Math.sin(u*12)*10, by = y - 70 - u*420; g.globalAlpha = 1 - u/.7; g.fillStyle = V51A_BALC[Math.floor(t/10) % 6]; g.beginPath(); g.ellipse(bx, by, 7, 8.5, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.moveTo(bx, by + 8); g.quadraticCurveTo(bx - 4, by + 18, bx + 2, by + 26); g.stroke(); g.globalAlpha = 1; }
  v51aPerson(g, {x:x - 26, y:y, dir:1, moving:false, walk:0, skin:'#c68642', hair:'#1a1a1a', long:false, shirt:'#ffe9a8', robe:'#3d7bff', sty:3, hc:null, wand:null, hat:'#ef4b4b', kid:false, bal:null}, t);
}
// người chơi + thú cưng + đồ chơi + hiệu ứng
function v51aDrawMe(g, t, dt){
  const m = V51AW.me, st = v51aState(), T = V51AW.tr, n = 40, hop = m.hop || 0;
  if(st.pet >= 0){ const p = V51A_PETS[st.pet], i = ((V51AW.trI - 12) % n + n) % n; let px = T[i*2] || m.x - 20*m.dir, py = T[i*2 + 1] || m.y; if(Math.hypot(px - m.x, py - m.y) < 16){ px = m.x - 18*m.dir; py = m.y + 2; }
    if(p.fly){ px = m.x - 14*m.dir + Math.sin(t*1.7)*4; py = m.y - 40; } v51aDrawPet(g, st.pet, px, py, t, px < m.x ? 1 : -1, m.moving); }
  g.save(); g.translate(0, hop); v50MeLook(); v50Person(g, m.x, m.y, m, t);
  if(V51A.cone){ const hx = m.x + 8*m.dir, hy = m.y - 16; g.fillStyle = '#d8a050'; g.beginPath(); g.moveTo(hx - 3, hy - 4); g.lineTo(hx + 3, hy - 4); g.lineTo(hx, hy + 5); g.closePath(); g.fill(); V51A.cone.c.forEach((c, k) => { g.fillStyle = c; g.beginPath(); g.arc(hx, hy - 6 - k*4.5, 3.6, 0, 7); g.fill(); }); }
  if(V51A.bal){ const bx = m.x + 10*m.dir, by = m.y - 66 + Math.sin(t*2)*2; g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = .8; g.beginPath(); g.moveTo(m.x + 7*m.dir, m.y - 16); g.quadraticCurveTo(bx + 3, m.y - 40, bx, by + 9); g.stroke(); g.fillStyle = V51A.bal.c; g.beginPath(); g.ellipse(bx, by, 7, 8.5, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(bx - 3, by - 5, 2, 3); }
  if(v51aFxOn('cloud')){ const cl = v50CloudImg(); g.drawImage(cl, m.x - 16, m.y - 70, 32, 13); }
  g.restore();
  if(st.toy >= 0) v51aDrawToy(g, st.toy, m.x + 16*m.dir, m.y - 46 + hop, t, 1);
  // hiệu ứng thuốc / kẹo
  const sp = Math.random(); if(v51aFxOn('firefly')){ g.globalCompositeOperation = 'lighter'; for(let k = 0; k < 6; k++){ const a = t*(1 + k*.13) + k, x = m.x + Math.cos(a)*22, y = m.y - 22 + Math.sin(a*1.3)*16; g.globalAlpha = .6 + .4*Math.sin(t*5 + k); g.drawImage(v50Glow('#d9ff7a'), x - 7, y - 7, 14, 14); } g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  if(v51aFxOn('sparkle') && sp < .35) v50P(m.x + (Math.random() - .5)*24, m.y - 20 - Math.random()*20, (Math.random() - .5)*40, -30, .7, 6, v50Shape('star', '#ffe066'), 20);
  if(v51aFxOn('bubble') && sp < .25) v50P(m.x + (Math.random() - .5)*20, m.y - 14, (Math.random() - .5)*20, -40, 1.4, 6, v50Shape('bubble', '#bfe8ff'), -8);
  if(v51aFxOn('rainbow') && m.moving && sp < .7) v50P(m.x - 8*m.dir, m.y - 10 - Math.random()*10, -m.dir*20, 0, .9, 8, v50Glow(V51A_RUBIK[Math.floor(t*12) % 6]), 0);
  if(v51aFxOn('snow') && sp < .3) v50P(m.x + (Math.random() - .5)*50, m.y - 70, 0, 30, 1.6, 5, v50Shape('star', '#ffffff'), 0);
  if(v51aFxOn('speed') && m.moving){ g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.5; for(let k = 0; k < 3; k++){ const y = m.y - 8 - k*8; g.beginPath(); g.moveTo(m.x - 12*m.dir, y); g.lineTo(m.x - (24 + k*6)*m.dir, y); g.stroke(); } }
}
function v51aSeasonFx(g, W, H, t, s, nk){
  const wet = typeof weather !== 'undefined' && /mua|bao/.test(weather);
  if(wet){ g.strokeStyle = 'rgba(200,210,240,.45)'; g.lineWidth = 1; g.beginPath(); for(let i = 0; i < 70; i++){ const x = (i*97.3 + t*60) % W, y = (i*53.1 + t*520) % H; g.moveTo(x, y); g.lineTo(x - 3, y + 12); } g.stroke(); return; }
  const n = Math.round((s === 'dong' ? 60 : 24)*(V50.q < 1 ? .5 : 1)); if(s === 'ha' && nk < .5) return;
  for(let i = 0; i < n; i++){ const x = ((i*131.7 + t*(s === 'dong' ? 14 : 24) + Math.sin(t + i)*20) % (W + 40)) - 20, y = ((i*71.9 + t*(s === 'dong' ? 40 : 30)) % (H + 40)) - 20;
    if(s === 'dong'){ g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(x, y, i % 3 ? 2.5 : 3.5, i % 3 ? 2.5 : 3.5); }
    else if(s === 'xuan'){ g.fillStyle = i % 2 ? '#ffc2dc' : '#ff9ac4'; g.beginPath(); g.ellipse(x, y, 3.5, 2, t + i, 0, 7); g.fill(); }
    else if(s === 'thu'){ g.fillStyle = ['#e0782a', '#c25a1a', '#e8b040'][i % 3]; g.save(); g.translate(x, y); g.rotate(t*2 + i); g.fillRect(-3, -2, 6, 4); g.restore(); }
    else { g.globalCompositeOperation = 'lighter'; g.globalAlpha = .5 + .5*Math.sin(t*3 + i); g.drawImage(v50Glow('#d9ff7a'), x - 6, (y*.5 + H*.4) - 6, 12, 12); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; } }
}
