// ================= v64p · 2/2 HÀNH TINH + MÂY PIXEL (2D Planet Pack + mây Ninja Adventure, CC0) =================
// Góc nhìn hành tinh v56p: trăng thật (Airless) quay quanh theo giờ, 2 hành tinh xa trên nền sao, biển màu Tiny Swords,
// vòng mây dùng mây pixel. Mây trôi khi chơi (bóng mây trên đất, mây trời, mây khi bay v51p/v57p/v60t) đồng bộ mây pixel.
const V64P_PL = 'assets/cc0/planets/';
const V64P_SKY = {spr:{}, moon:null, far:[], starC:null, scratch:null, ok:false};

// ---------- mây pixel: gốc là đám mây 80×36 của Ninja Adventure, ghép thêm hình rộng + bóng dưới ----------
function v64pCloudMask(shape){
  const key = 'm' + shape; if(V64P_SKY.spr[key]) return V64P_SKY.spr[key]; const I = V64P.img.cloud, c = document.createElement('canvas'), g = c.getContext('2d');
  if(shape === 1){ c.width = 124; c.height = 44; g.drawImage(I, 0, 8); g.drawImage(I, 44, 0); }          // mây rộng (2 cụm)
  else if(shape === 2){ c.width = 104; c.height = 40; g.drawImage(I, 24, 4); g.drawImage(I, 0, 0, 80, 36, 0, 12, 56, 26); }   // mây lệch
  else { c.width = 80; c.height = 36; g.drawImage(I, 0, 0); }
  return (V64P_SKY.spr[key] = c);
}
function v64pTint(src, col){ const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const g = c.getContext('2d');
  g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); return c; }
// mây có bóng: lớp tối lệch xuống 4px, lớp sáng phía trên, chấm sáng đỉnh
function v64pCloud(shape, base, shade, hi){
  const key = shape + base + shade + (hi || ''); if(V64P_SKY.spr[key]) return V64P_SKY.spr[key]; const m = v64pCloudMask(shape), c = document.createElement('canvas'), g = c.getContext('2d');
  c.width = m.width; c.height = m.height + 4; g.drawImage(v64pTint(m, shade), 0, 4); g.drawImage(v64pTint(m, base), 0, 0);
  if(hi){ g.globalAlpha = .55; g.drawImage(v64pTint(m, hi), 0, 0, m.width, m.height, 6, 2, m.width - 12, m.height*.5); g.globalAlpha = 1; }
  return (V64P_SKY.spr[key] = c);
}
// phóng to sẵn theo bội số nguyên (giữ điểm ảnh sắc nét kể cả khi nơi vẽ bật làm mịn)
function v64pBig(src, k, padH){ const c = document.createElement('canvas'), g = c.getContext('2d'); c.width = src.width*k; c.height = Math.round(src.height*k*(padH || 1));
  g.imageSmoothingEnabled = false; g.drawImage(src, 0, Math.round((c.height - src.height*k)/2), src.width*k, src.height*k); return c; }

// ---------- hành tinh: thu nhỏ ảnh 256px → vài chục điểm ảnh rồi phóng không làm mịn = hợp phong cách pixel ----------
function v64pPix(img, n){ const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, n, n); return c; }
function v64pPlanetLoad(done){
  const L = [['moon', 'Solid/Airless_01-256x256.png', 40], ['far1', 'Gaseous/OrgangeGiant_02-256x256.png', 72], ['far2', 'Solid/Icy_02-256x256.png', 30]];
  let n = L.length; const one = () => { if(--n === 0) done(); };
  L.forEach(([k, s, px]) => { const i = new Image(); i.onload = () => { V64P_SKY[k] = v64pPix(i, px); one(); }; i.onerror = () => { console.warn('v64p: thiếu ảnh', s); one(); }; i.src = V64P_PL + s; });
}
// nền sao: thêm 2 hành tinh xa (vẽ 1 lần vào ảnh nền sao của v56p)
function v64pFarPlanets(c){
  const g = c.getContext('2d'), w = c.width, h = c.height, m = Math.min(w, h); g.imageSmoothingEnabled = false;
  if(V64P_SKY.far1){ const s = Math.round(m*.15), x = Math.round(w*.64 - s/2), y = Math.round(h*.14 - s/2); g.globalAlpha = .92; g.drawImage(V64P_SKY.far1, x, y, s, s); }
  if(V64P_SKY.far2){ const s = Math.round(m*.07), x = Math.round(w*.88 - s/2), y = Math.round(h*.9 - s/2); g.globalAlpha = .9; g.drawImage(V64P_SKY.far2, x, y, s, s); }
  g.globalAlpha = 1;
}
// biển hành tinh: nông → khơi theo màu nước Tiny Swords
function v64pSeaCache(){
  if(V56P.sea) return V56P.sea; const N = 1024, c = v56pCv(N, N), g = c.getContext('2d'), Rp = V56P.Rp, k = N/2/Rp, E = v56pLandEdge(), M = E.length;
  let lo = 1e9; for(let i = 0; i < M; i++) lo = Math.min(lo, E[i]);
  const r0 = lo/Rp, gr = g.createRadialGradient(N/2, N/2, 0, N/2, N/2, N/2), sw = 1 - r0;
  gr.addColorStop(0, 'rgba(98,196,188,0)'); gr.addColorStop(Math.max(0, r0 - .01), 'rgba(98,196,188,0)');
  gr.addColorStop(r0 + .004, 'rgba(150,226,210,.55)');                    // nước nông sát bờ (sáng)
  gr.addColorStop(r0 + sw*v56pPow(2), 'rgba(71,171,169,.4)');             // nước Tiny Swords
  gr.addColorStop(r0 + sw/V56P_PHI, 'rgba(47,125,132,.42)');              // khơi
  gr.addColorStop(1, 'rgba(26,78,92,.66)');                               // sâu sát mép
  g.fillStyle = gr; g.beginPath(); g.arc(N/2, N/2, N/2, 0, Math.PI*2); g.fill();
  g.globalCompositeOperation = 'destination-out'; g.beginPath();
  for(let i = 0; i <= M; i++){ const a = i/M*Math.PI*2, r = E[i % M]*k + 1; i ? g.lineTo(N/2 + Math.cos(a)*r, N/2 + Math.sin(a)*r) : g.moveTo(N/2 + Math.cos(a)*r, N/2 + Math.sin(a)*r); }
  g.closePath(); g.fill(); g.globalCompositeOperation = 'source-over';
  g.strokeStyle = 'rgba(198,240,219,.55)'; g.lineWidth = 2; g.beginPath();   // bọt sóng màu Foam
  for(let i = 0; i <= M; i++){ const a = i/M*Math.PI*2, r = E[i % M]*k + 3; i ? g.lineTo(N/2 + Math.cos(a)*r, N/2 + Math.sin(a)*r) : g.moveTo(N/2 + Math.cos(a)*r, N/2 + Math.sin(a)*r); }
  g.stroke();
  return (V56P.sea = c);
}
// trăng thật quay quanh hành tinh (đối diện mặt trời) + pha trăng
function v64pMoon(C, mx, my, mr, sa){
  const M = V64P_SKY.moon; C.save(); C.imageSmoothingEnabled = false;
  const gl = C.createRadialGradient(mx, my, mr*.8, mx, my, mr*1.9); gl.addColorStop(0, 'rgba(210,225,255,.22)'); gl.addColorStop(1, 'rgba(210,225,255,0)'); C.fillStyle = gl; C.fillRect(mx - mr*2, my - mr*2, mr*4, mr*4);
  C.drawImage(M, Math.round(mx - mr), Math.round(my - mr), Math.round(mr*2), Math.round(mr*2));
  C.beginPath(); C.arc(mx, my, mr*.98, 0, Math.PI*2); C.clip(); C.fillStyle = 'rgba(8,12,36,.5)'; C.beginPath(); C.arc(mx + Math.cos(sa)*mr*.75, my + Math.sin(sa)*mr*.75, mr*.9, 0, Math.PI*2); C.fill();
  C.restore();
}
// thay v56pSpace: giống bản cũ, chỉ đổi trăng vẽ tay → trăng Planet Pack
function v64pSpace(cx, cy, rp, t, sky){
  const C = ctx; C.save(); C.setTransform(DPR, 0, 0, DPR, 0, 0); C.globalAlpha = t; C.imageSmoothingEnabled = true;
  const sa = v56pSunA(), orb = rp*(1 + v56pPow(1)*.75), sz = Math.max(70, rp*.36), ox = Math.max(rp*1.22, Math.min(orb, cw/2 - 24)), oy = Math.max(rp*1.16, Math.min(orb, ch/2 - 24)), sx = cx + Math.cos(sa)*ox, sy = cy + Math.sin(sa)*oy;
  C.drawImage(V56P.sun, sx - sz/2, sy - sz/2, sz, sz);
  const mx = cx - Math.cos(sa)*ox, my = cy - Math.sin(sa)*oy, mr = Math.max(14, rp*.075);
  v64pMoon(C, mx, my, mr, sa);
  const [ai, ar] = v56pAtmImg(rp); C.imageSmoothingEnabled = !ar; C.drawImage(ai, cx - rp*V56P_AR, cy - rp*V56P_AR, rp*2*V56P_AR, rp*2*V56P_AR); C.imageSmoothingEnabled = true;
  const s = v56pSky(); if(s.night > .05){ const A = v56pAurRing(), k = 1 + .012*Math.sin(realT*.7), q = rp*V56P_AR*k;
    C.save(); C.globalCompositeOperation = 'lighter'; C.globalAlpha = t*s.night*(.72 + .2*Math.sin(realT*.9)); C.imageSmoothingEnabled = false; C.drawImage(A, cx - q, cy - q, q*2, q*2); C.restore(); }
  if(!sky) v56pCloudRing(cx, cy, rp, t, 0, 1e9);
  C.restore();
}

// ---------- mây khi chơi ----------
// bóng mây trên mặt đất + mây mỏng (thay drawMapClouds của map.js)
function v64pMapClouds(){
  const box = document.getElementById('mapClouds'); if(!box || !box.checked || !SKYST) return;
  const cov = {nang:.35, nangnong:.15, cauvong:.45, gio:.6, mua:.9, muaphun:.85, bao:1, sieubao:1, loc:.8, samset:1, muada:.9, suongmu:.7, tuyet:.9, baotuyet:1, songthan:.7, dongdat:.4, nhatthuc:.3, saobang:.15}[weather];
  const n = Math.round((cov == null ? .4 : cov)*MAPCLOUDS.length), col = cloudColors(SKYST), sh = v64pCloud(1, '#0a141e', '#0a141e'), cl = v64pCloud(1, col.base, col.shade, col.hi);
  const smo = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
  for(let i = 0; i < n; i++){ const c = MAPCLOUDS[i]; if(c.y < NY + 40 || !cloudVisible(c, 140)) continue; const k = Math.max(1, Math.round(c.s*1.2)), w = sh.width*k, h = sh.height*k, x = Math.round(c.x - w/2), y = Math.round(c.y - h/2);
    ctx.globalAlpha = .1; ctx.drawImage(sh, x + 70, y + 110, w, h);
    ctx.globalAlpha = .4; ctx.drawImage(cl, x, y, w, h); }
  ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = smo;
}
// mây hình con vật trên trời (giữ đúng hình biến đổi của map.js, chỉ dựng ở độ phân giải thấp rồi phóng không làm mịn)
function v64pDrawCloud(c, col, alpha, dc0){
  const P = cloudPuffs(c), px = Math.max(3, Math.round(3*c.s)); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for(const p of P){ x0 = Math.min(x0, p[0] - p[2]); x1 = Math.max(x1, p[0] + p[2]); y0 = Math.min(y0, p[1] - p[2] - 3*c.s); y1 = Math.max(y1, p[1] + p[2]); }
  x0 = Math.floor(x0/px)*px; y0 = Math.floor(y0/px)*px; const w = Math.ceil((x1 - x0)/px) + 1, h = Math.ceil((y1 - y0)/px) + 1;
  let S0 = V64P_SKY.scratch; if(!S0 || S0.width < w || S0.height < h){ S0 = V64P_SKY.scratch = document.createElement('canvas'); S0.width = Math.max(w, S0 ? S0.width : 0, 96); S0.height = Math.max(h, S0 ? S0.height : 0, 64); }
  const g = S0.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w + 1, h + 1); g.setTransform(1/px, 0, 0, 1/px, -x0/px, -y0/px); g.imageSmoothingEnabled = false;
  const keep = ctx; ctx = g; try { dc0(c, col, 1); } finally { ctx = keep; }
  const smo = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false; ctx.globalAlpha = alpha; ctx.drawImage(S0, 0, 0, w, h, x0, y0, w*px, h*px); ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = smo;
}

function v64pSkyInit(){
  // mây v51p (máy bay, trực thăng, góc nhìn thứ 3 v57p, flycam v60t): một sprite pixel phóng ×4 sẵn
  const setFly = () => { try { if(typeof V51P !== 'undefined') V51P.spr.cloud = v64pBig(v64pCloud(1, '#ffffff', '#c9d6e6', '#ffffff'), 4, 1.15); } catch(e){ console.warn('v64p fly cloud', e); } };
  // vòng mây hành tinh v56p: 3 sắc (trắng · xám · xám đậm), khung 5:3 như sprite cũ
  const setRing = () => { try { if(typeof V56P === 'undefined' || !V56P.puff) return; V56P.puff = [['#ffffff', '#c9d6e6', '#ffffff'], ['#a2aab8', '#7c8494'], ['#646c7e', '#474e60']].map(([b, s, h]) => v64pBig(v64pCloud(1, b, s, h), 2, 1.55)); } catch(e){ console.warn('v64p ring', e); } };
  const ci = v64pImg('cloud', 'assets/cc0/ninja-adventure/FX/Particle/Clouds.png');
  ci.onload = () => { V64P_SKY.ok = true; setFly(); setRing(); };
  if(typeof drawMapClouds === 'function'){ const mc0 = drawMapClouds; drawMapClouds = function(){ if(!V64P_SKY.ok) return mc0(); try { v64pMapClouds(); } catch(e){ mc0(); } }; }
  if(typeof drawCloud === 'function'){ const dc0 = drawCloud; drawCloud = function(c, col, alpha){ if(!V64P_SKY.ok) return dc0(c, col, alpha); try { v64pDrawCloud(c, col, alpha, dc0); } catch(e){ dc0(c, col, alpha); } }; }
  // góc nhìn hành tinh
  if(typeof V56P === 'undefined') return;
  v56pSeaCache = v64pSeaCache; V56P.sea = null;
  const cr0 = v56pCloudRing; v56pCloudRing = function(cx, cy, rp, t, a0, a1){ ctx.imageSmoothingEnabled = false; return cr0(cx, cy, rp, t, a0, a1); };
  const sc0 = v56pStarCache; v56pStarCache = function(){ const c = sc0(); if(c !== V64P_SKY.starC && V64P_SKY.far1){ v64pFarPlanets(c); V64P_SKY.starC = c; } return c; };
  const sp0 = v56pSpace; v56pSpace = function(cx, cy, rp, t, sky){ if(!V64P_SKY.moon) return sp0(cx, cy, rp, t, sky); return v64pSpace(cx, cy, rp, t, sky); };
  v64pPlanetLoad(() => { V56P.stars = null; V56P.starK = ''; });
}

// ---------- khởi động (gọi cuối extFinalInit) ----------
function v64pInit(){
  if(typeof V46 === 'undefined' || typeof V46L === 'undefined') return;
  try { v64pSeaInit(); } catch(e){ console.warn('v64p sea', e); }
  try { v64pSkyInit(); } catch(e){ console.warn('v64p sky', e); }
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v64p = {V64P, V64P_SKY, v64pRebake, v64pBuild};
}
