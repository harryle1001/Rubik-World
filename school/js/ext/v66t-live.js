// ================= v66t · CÂY THẦN KỲ 3/4: vẽ mỗi khung — tán đung đưa nhẹ, xích đu, lá/cánh hoa rơi, chim, bướm, lấp lánh; ban đêm: quả, đèn lồng, hào quang, đom đóm =================
// Chỉ vẽ khi cây nằm trong khung nhìn. Ít hạt (≤ 16 mỗi loại), mảng cấp sẵn, không tạo đối tượng mới mỗi khung.
const V66T_FX = {leaf:[], bfly:[], bird:[], spark:[], fly:[], t:-1};
function v66tFxInit(){
  const R = v66tRnd(6605), CW = V66T_CW;
  for(let i = 0; i < 16; i++) V66T_FX.leaf.push({x:(R()*2 - 1)*CW*.42, y:-300 - R()*700, v:18 + R()*22, ph:R()*7, gy:-10 + R()*V66T_RP, c:i});
  for(let i = 0; i < 3; i++) V66T_FX.bfly.push({ph:R()*7, r:120 + R()*170, s:.25 + R()*.2, c:['#ffd23f', '#7fd0ff', '#ff9ac2'][i]});
  for(let i = 0; i < 3; i++) V66T_FX.bird.push({ph:R()*7, s:.18 + R()*.1});
  for(let i = 0; i < 7; i++) V66T_FX.spark.push({x:0, y:0, t:R()*3});
  for(let i = 0; i < 14; i++) V66T_FX.fly.push({ph:R()*7, r:60 + R()*360, s:.15 + R()*.25, h:20 + R()*420});
}
function v66tVis(){ const VBn = V46.VBn, B = v66tGeo().box; return VBn && !(B.x1 < VBn.x0 || B.x0 > VBn.x1 || B.y1 < VBn.y0 || B.y0 > VBn.y1); }
// lớp có đung đưa: chia 4 dải ngang, dải càng cao lệch càng nhiều (≤ 3px thế giới)
function v66tSway(img, G, t, a){
  const top = 540, n = 4, hb = top/n;
  for(let i = 0; i < n; i++){ const k = (n - i)/n, dx = Math.round(Math.sin(t*.85 + i*.7)*1.5*k)*1 + Math.round(Math.sin(t*.37)*1.5*k);
    ctx.drawImage(img, 0, i*hb, G.SW, hb, G.sx + dx, G.sy + i*hb*2, G.SW*2, hb*2); }
  ctx.drawImage(img, 0, top, G.SW, G.SH - top, G.sx, G.sy + top*2, G.SW*2, (G.SH - top)*2);
}
function v66tDraw(){
  V66T.drawn = true; if(!v66tReady() || !v66tVis()) return;
  const G = v66tGeo(), L = v66tLayers(), t = realT, dt = V66T_FX.t < 0 ? 0 : Math.min(.1, Math.max(0, t - V66T_FX.t)); V66T_FX.t = t; if(!V66T_FX.leaf.length) v66tFxInit();
  // người chơi đứng sau thân/tán → cây mờ đi để vẫn thấy nhân vật
  // (tán: khi đứng dưới tán phía sau gốc; thân: khi đứng ngay sau thân)
  let hc = 0, ht = 0; try { if(PLAYER && PLAYER.visible && v46Raw(PLAYER.x)){ const p = v46Pos(PLAYER), dx = Math.abs(p[0] - G.bx);
    if(p[1] < G.by - 4 && p[1] > G.by - G.H + 160 && dx < G.CW/2 - 40 && p[1] < G.by + (v66tBottom(dx/2) - V66T_BY)*2 + 50) hc = 1; if(p[1] < G.by - 4 && p[1] > G.by - G.trunkH && dx < 110) ht = 1; } } catch(e){}
  const k = Math.min(1, dt*6); V66T.hide += (hc - V66T.hide)*k; V66T.hideT = (V66T.hideT || 0) + (ht - (V66T.hideT || 0))*k;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 1 - Math.max(V66T.hide*.42, V66T.hideT*.5);                              // 1 ảnh gộp sẵn; người chơi phía sau → mờ đi
  v66tSway(L.full, G, t); ctx.globalAlpha = 1; v66tSwing(G, t);
  ctx.globalAlpha = 1;
  v66tParticles(G, t, dt);
  ctx.restore();
}
// xích đu treo cành trái
function v66tSwing(G, t){
  const a = Math.sin(t*1.25)*.3, Ls = 225, top = G.swing, sx = top[0] + Math.sin(a)*Ls, sy = top[1] + Math.cos(a)*Ls;
  ctx.fillStyle = '#24130b'; for(const o of [-20, 20]){ ctx.strokeStyle = '#24130b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(top[0] + o, top[1]); ctx.lineTo(sx + o, sy); ctx.stroke(); ctx.strokeStyle = '#c9a26a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(top[0] + o - 1, top[1]); ctx.lineTo(sx + o - 1, sy); ctx.stroke(); }
  ctx.fillRect(Math.round(sx - 28), Math.round(sy - 2), 56, 12); ctx.fillStyle = '#b97a45'; ctx.fillRect(Math.round(sx - 26), Math.round(sy), 52, 8); ctx.fillStyle = '#d99a5c'; ctx.fillRect(Math.round(sx - 26), Math.round(sy), 52, 2);
  if(v66tSe() === 'dong'){ ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(sx - 26), Math.round(sy - 3), 52, 3); }
}
function v66tParticles(G, t, dt){
  const se = v66tSe(), dk = typeof v25Ramp === 'function' ? v25Ramp(clock, 1080, 330) : 0, bx = G.bx, by = G.by;
  // lá / cánh hoa / tuyết rơi
  const n = se === 'thu' ? 16 : se === 'xuan' ? 14 : se === 'dong' ? 12 : 7, col = se === 'thu' ? ['#e07a26', '#ffd166', '#c0392b'] : se === 'xuan' ? ['#f7aac6', '#ffe0ec', '#e27aa0'] : se === 'dong' ? ['#ffffff', '#e4f2fa', '#ffffff'] : ['#7cc451', '#4fa046', '#b4e06a'];
  for(let i = 0; i < n; i++){ const p = V66T_FX.leaf[i]; p.y += p.v*dt; if(p.y > p.gy){ p.y = -330 - (i*97 % 600); p.x = ((i*271 + Math.floor(t)) % 1000)/1000*G.CW*.84 - G.CW*.42; }
    const x = bx + p.x + Math.sin(t*1.6 + p.ph)*14, y = by + p.y, f = Math.sin(t*4 + p.ph) > 0; ctx.fillStyle = col[i % 3];
    if(se === 'dong') ctx.fillRect(Math.round(x), Math.round(y), 3, 3); else { ctx.fillRect(Math.round(x), Math.round(y), f ? 6 : 3, f ? 3 : 5); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(Math.round(x), Math.round(y) + (f ? 3 : 5), f ? 6 : 3, 1); } }
  if(dk < .5){
    // bướm quanh quảng trường (không có mùa đông)
    if(se !== 'dong') V66T_FX.bfly.forEach((b, i) => { const a = t*b.s + b.ph, x = bx + Math.cos(a)*b.r*1.3, y = by + 20 + Math.sin(a*1.7)*b.r*.45 - 40 - Math.abs(Math.sin(t*2 + i))*20, w = Math.abs(Math.sin(t*12 + i))*6 + 1;
      ctx.fillStyle = '#2b1a10'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 3, 2, 7); ctx.fillStyle = b.c; ctx.fillRect(Math.round(x - 1 - w), Math.round(y - 4), Math.round(w), 5); ctx.fillRect(Math.round(x + 1), Math.round(y - 4), Math.round(w), 5); });
    // chim bay vòng trên tán
    V66T_FX.bird.forEach((b, i) => { const a = t*b.s + b.ph, x = bx + Math.cos(a)*G.CW*.46, y = by - 760 + Math.sin(a)*170 - 280*Math.abs(Math.cos(a*.5 + i)), up = Math.sin(t*9 + i*2) > 0;
      ctx.fillStyle = '#2b2430'; ctx.fillRect(Math.round(x) - 2, Math.round(y), 5, 3); if(up){ ctx.fillRect(Math.round(x) - 8, Math.round(y) - 4, 6, 2); ctx.fillRect(Math.round(x) + 3, Math.round(y) - 4, 6, 2); } else { ctx.fillRect(Math.round(x) - 8, Math.round(y) + 2, 6, 2); ctx.fillRect(Math.round(x) + 3, Math.round(y) + 2, 6, 2); }
      ctx.fillStyle = '#ffb347'; ctx.fillRect(Math.round(x) + (Math.cos(a + 1.6) > 0 ? 3 : -3), Math.round(y) + 1, 2, 1); });
  }
  // lấp lánh ma thuật trên tán
  V66T_FX.spark.forEach((s, i) => { s.t -= dt; if(s.t <= 0){ s.t = 1.6 + (i*.37 % 1.2); const k = (Math.floor(t*10) + i*131) % 997/997, m = (Math.floor(t*7) + i*577) % 991/991; s.x = (k*2 - 1)*G.CW*.4; s.y = -760 + (m*2 - 1)*380; }
    const a = Math.sin(Math.min(1, s.t/1.6)*Math.PI); if(a < .05) return; const x = Math.round(bx + s.x), y = Math.round(by + s.y), r = Math.round(2 + a*5);
    ctx.globalAlpha = a; ctx.fillStyle = '#fff6c8'; ctx.fillRect(x - r, y - 1, r*2 + 1, 3); ctx.fillRect(x - 1, y - r, 3, r*2 + 1); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y - 1, 3, 3); ctx.globalAlpha = 1; });
}
// quầng sáng tròn (cache)
function v66tGlow(col){ const k = 'g' + col; if(V66T.spr[k]) return V66T.spr[k]; const [c, g] = v66tCv(64, 64), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(' + col + ',1)'); gr.addColorStop(.3, 'rgba(' + col + ',.5)'); gr.addColorStop(1, 'rgba(' + col + ',0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); V66T.spr[k] = c; return c; }
function v66tNight(VBn){
  if(!v66tReady() || !v66tVis()) return; const dk = typeof v25Ramp === 'function' ? v25Ramp(clock, 1080, 330) : 0, G = v66tGeo(), t = realT, se = v66tSe(), L = v66tLayers();
  const warm = se === 'dong' ? .35 : 0, on = Math.max(dk, warm*(dk > 0 ? 1 : .0)); if(on <= .02) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true;
  // hào quang mờ quanh tán
  ctx.globalAlpha = on*.32; ctx.drawImage(v66tGlow(se === 'xuan' ? '255,170,210' : se === 'thu' ? '255,190,110' : '170,255,190'), G.bx - G.CW*.68, G.by - 760 - 640, G.CW*1.36, 1280);
  // quả thần nhấp nháy
  const gq = v66tGlow('255,214,120'); (V66T.fruits || []).forEach((f, i) => { const a = on*(.55 + .45*Math.sin(t*1.7 + i*1.3)); ctx.globalAlpha = a; ctx.drawImage(gq, G.bx + f[0] - 26, G.by + f[1] - 24, 52, 52); });
  // đèn lồng, hốc cây, cửa sổ nhà trên cây
  const gl = v66tGlow(se === 'xuan' ? '255,150,190' : '255,190,100'); v66tLampsW().forEach(([x, y], i) => { ctx.globalAlpha = on*(.8 + .2*Math.sin(t*3 + i)); ctx.drawImage(gl, G.bx + x - 40, G.by + y - 34, 80, 80); });
  ctx.globalAlpha = on*.9; ctx.drawImage(v66tGlow('255,200,110'), G.bx - 4 - 50, G.by - 140 - 50, 100, 100); ctx.drawImage(v66tGlow('255,230,150'), G.bx + 242 - 36, G.by - 636 - 36, 72, 72);
  // đom đóm
  if(dk > .1 && se !== 'dong') V66T_FX.fly.forEach((f, i) => { const a = t*f.s + f.ph, x = G.bx + Math.cos(a)*f.r*1.2 + Math.sin(t*1.3 + i)*20, y = G.by - f.h + Math.sin(a*1.6)*f.r*.3, b = .5 + .5*Math.sin(t*3.1 + i*2.1);
    ctx.globalAlpha = dk*b; ctx.drawImage(v66tGlow('200,255,120'), Math.round(x) - 9, Math.round(y) - 9, 18, 18); ctx.fillStyle = '#eaffb0'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); });
  ctx.restore();
}
