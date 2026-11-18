// ================= v56p · 1/2 GÓC NHÌN HÀNH TINH: kéo camera ra xa → thế giới hoá hành tinh tí hon =================
// Vòng tròn đồng tâm (dày theo dãy φ): đất liền → bãi cát → biển nông → biển sâu → viền khí quyển → vòng mây → không gian.
// Không gắn cứng bán kính biển: đọc V46L.W/H/CX/CY/ISLAND, v52wRout, và v55sOuter / v55sIsWater nếu phiên biển v55s có.
// Mọi tên toàn cục có tiền tố v56p / V56P.
const V56P_PHI = 1.618033988749895;
const V56P = {on:false, Rp:0, Wk:0, land:null, sea:null, atm:null, atmK:'', stars:null, starK:'', sun:null, aur:null, puff:null, clouds:[],
  t:0, sk:0, skT:0, fly:null, flown:false, view:null, ptr:null, ptrN:0, hint:{}, fps:0, btn:null, back:null};
const v56pPow = k => Math.pow(V56P_PHI, -k);                 // φ^-k: độ dày các vòng
const v56pSm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a)/(b - a))); return t*t*(3 - 2*t); };
const v56pMix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v)*k));
// ---------- kích thước hành tinh (đọc từ thế giới hiện có) ----------
function v56pLandOut(a){ return typeof v52wRout === 'function' ? v52wRout(a) : V46L.ISLAND; }
function v56pRadius(){
  const L = V46L; let lo = 0; for(let i = 0; i < 64; i++) lo = Math.max(lo, v56pLandOut(i/64*Math.PI*2));
  let R = Math.max(L.W/2*1.06, lo*1.22);
  if(typeof v55sOuter === 'function'){ try { let o = 0; for(let i = 0; i < 16; i++){ const v = +v55sOuter(i/16*Math.PI*2); if(isFinite(v)) o = Math.max(o, v); } if(o > lo) R = Math.max(R, o*1.04); } catch(e){} }
  return R;
}
function v56pCheck(){ if(V56P.Wk === V46L.W + V46L.CX*3 && V56P.Rp) return; V56P.Wk = V46L.W + V46L.CX*3; V56P.Rp = v56pRadius(); V56P.land = null; V56P.sea = null; }
// bờ ngoài của đất (theo góc): dùng v55sIsWater nếu có để khớp biển mở rộng
function v56pLandEdge(){
  if(V56P.land) return V56P.land; const L = V46L, N = 360, out = new Float32Array(N), Rp = V56P.Rp, w = typeof v55sIsWater === 'function';
  for(let i = 0; i < N; i++){ const a = i/N*Math.PI*2, c = Math.cos(a), s = Math.sin(a); let r = v56pLandOut(a);
    if(w){ try { r = Rp; while(r > L.ISLAND && v55sIsWater(L.CX + c*r, L.CY + s*r)) r -= 80; } catch(e){ r = v56pLandOut(a); } }
    out[i] = r; }
  return (V56P.land = out);
}
// mức chuyển sang hành tinh theo zoom (0 = bình thường, 1 = hành tinh)
function v56pZFit(){ return Math.min(cw, ch)/(2*V56P.Rp); }
function v56pZMin(){ return v56pZFit()*.66; }
function v56pBlend(z){ const f = v56pZFit(); return 1 - v56pSm(f*.95, f*3.2, z); }
// ---------- giờ trong game → màu khí quyển ----------
function v56pSky(){
  const c = clock, dawn = 1 - Math.min(1, Math.abs(c - 375)/75), dusk = 1 - Math.min(1, Math.abs(c - 1065)/80), glow = Math.max(dawn, dusk);
  const night = c < 330 || c > 1110 ? 1 : (c < 420 ? 1 - v56pSm(330, 420, c) : (c > 1020 ? v56pSm(1020, 1110, c) : 0));
  let col = v56pMix([120, 196, 255], [112, 70, 196], night); col = v56pMix(col, [255, 138, 120], glow*.85);
  return {col, night, glow};
}
// ---------- canvas cache ----------
function v56pCv(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
// biển nông → biển sâu: vành từ bờ đất ra mép hành tinh (toạ độ thế giới, cache 1 lần)
function v56pSeaCache(){
  if(V56P.sea) return V56P.sea; const N = 1024, c = v56pCv(N, N), g = c.getContext('2d'), Rp = V56P.Rp, k = N/2/Rp, E = v56pLandEdge(), M = E.length;
  let lo = 1e9; for(let i = 0; i < M; i++) lo = Math.min(lo, E[i]);
  const r0 = lo/Rp, gr = g.createRadialGradient(N/2, N/2, 0, N/2, N/2, N/2), sw = 1 - r0;
  gr.addColorStop(0, 'rgba(70,214,214,0)'); gr.addColorStop(Math.max(0, r0 - .01), 'rgba(70,214,214,0)');
  gr.addColorStop(r0 + .004, 'rgba(92,226,210,.62)');                       // biển nông sát bờ (ngọc lam)
  gr.addColorStop(r0 + sw*v56pPow(2), 'rgba(38,160,206,.42)');               // biển nông → vừa (φ⁻²)
  gr.addColorStop(r0 + sw/V56P_PHI, 'rgba(14,74,150,.42)');                 // biển sâu (φ⁻¹)
  gr.addColorStop(1, 'rgba(6,26,82,.7)');                                   // vực sâu sát mép
  g.fillStyle = gr; g.beginPath(); g.arc(N/2, N/2, N/2, 0, Math.PI*2); g.fill();
  // khoét đất liền (để màu biển không phủ lên đất)
  g.globalCompositeOperation = 'destination-out'; g.beginPath();
  for(let i = 0; i <= M; i++){ const a = i/M*Math.PI*2, r = E[i % M]*k + 1; i ? g.lineTo(N/2 + Math.cos(a)*r, N/2 + Math.sin(a)*r) : g.moveTo(N/2 + Math.cos(a)*r, N/2 + Math.sin(a)*r); }
  g.closePath(); g.fill(); g.globalCompositeOperation = 'source-over';
  // bọt sóng trắng mờ viền bờ ngoài
  g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 2; g.beginPath();
  for(let i = 0; i <= M; i++){ const a = i/M*Math.PI*2, r = E[i % M]*k + 3; i ? g.lineTo(N/2 + Math.cos(a)*r, N/2 + Math.sin(a)*r) : g.moveTo(N/2 + Math.cos(a)*r, N/2 + Math.sin(a)*r); }
  g.stroke();
  return (V56P.sea = c);
}
// viền khí quyển + tối mép (độ cong) — cập nhật mỗi 10 phút trong game hoặc khi đổi thời tiết
const V56P_AR = 1.32;   // canvas khí quyển phủ tới 1.32 × bán kính
function v56pAtmCache(){
  const s = v56pSky(), key = Math.round(clock/15) + weather; if(V56P.atm && V56P.atmK === key) return V56P.atm; V56P.atmK = key;
  const N = 768, c = V56P.atm = V56P.atm || v56pCv(N, N), g = c.getContext('2d'), rc = N/2/V56P_AR, m = N/2, [r, gg, b] = s.col; g.clearRect(0, 0, N, N);
  const L = g.createRadialGradient(m, m, 0, m, m, rc); L.addColorStop(0, 'rgba(6,14,44,0)'); L.addColorStop(1/V56P_PHI, 'rgba(6,14,44,0)');
  L.addColorStop(1 - v56pPow(4), 'rgba(6,14,44,.16)'); L.addColorStop(1, 'rgba(4,10,36,.5)'); g.fillStyle = L; g.beginPath(); g.arc(m, m, rc, 0, Math.PI*2); g.fill();
  const a1 = 1 - v56pPow(5), a2 = 1 + v56pPow(6), a3 = 1 + v56pPow(6) + v56pPow(5), A = g.createRadialGradient(m, m, rc*a1, m, m, rc*V56P_AR), span = V56P_AR - a1, st = x => (x - a1)/span;
  const ws = WEATHERS[weather] ? WEATHERS[weather].dark : 0, k = 1 - ws*.5;
  A.addColorStop(0, `rgba(${r},${gg},${b},0)`); A.addColorStop(st(1), `rgba(${r},${gg},${b},${.62*k})`);
  A.addColorStop(st(a2), `rgba(${r},${gg},${b},${.34*k})`); A.addColorStop(st(a3), `rgba(${r},${gg},${b},${.1*k})`); A.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  // bóng ngày/đêm (xoay theo hướng mặt trời) — gộp vào cùng cache để mỗi khung chỉ 1 lần drawImage
  g.save(); g.beginPath(); g.arc(m, m, rc, 0, Math.PI*2); g.clip(); g.translate(m, m); g.rotate(v56pSunA()); const G = g.createLinearGradient(-rc, 0, rc, 0);
  G.addColorStop(0, 'rgba(255,244,214,.13)'); G.addColorStop(.42, 'rgba(255,244,214,0)'); G.addColorStop(.62, 'rgba(0,4,26,0)'); G.addColorStop(1, 'rgba(0,4,26,.42)'); g.fillStyle = G; g.fillRect(-rc, -rc, 2*rc, 2*rc); g.restore();
  g.fillStyle = A; g.fillRect(0, 0, N, N);
  return c;
}
const v56pSunA = () => (clock/1440)*Math.PI*2 + Math.PI/2;   // trưa: mặt trời trên đỉnh, nửa đêm: dưới đáy
// vòng cực quang dựng 1 lần (cùng hệ toạ độ với cache khí quyển)
function v56pAurRing(){
  if(V56P.aurR) return V56P.aurR; const N = 768, c = v56pCv(N, N), g = c.getContext('2d'), rc = N/2/V56P_AR, m = N/2, A = V56P.aur, segs = 15, sw = A.width/segs;
  g.globalCompositeOperation = 'lighter';
  [[-Math.PI/2, 1], [Math.PI/2, .45]].forEach(([a0, k]) => { for(let i = 0; i < segs; i++){ const a = a0 + (i - (segs - 1)/2)*.075*k, h = rc*(.14 + .05*Math.sin(i*1.3))*k;
    g.setTransform(Math.cos(a + Math.PI/2), Math.sin(a + Math.PI/2), -Math.sin(a + Math.PI/2), Math.cos(a + Math.PI/2), m, m); g.globalAlpha = k*(.55 + .25*Math.sin(i*.9));
    g.drawImage(A, i*sw, 0, sw, A.height, -rc*.04*k - 1, -rc*1.005 - h, rc*.08*k + 2, h); } });
  return (V56P.aurR = c);
}
// khí quyển đúng cỡ màn hình: khi camera đứng yên thì phóng sẵn 1 lần (vẽ không cần làm mịn → nhanh trên điện thoại)
function v56pAtmImg(rp){
  const base = v56pAtmCache(), d = V56P.atmD, L = V56P.lastRp || 0; V56P.still = Math.abs(L - rp) < rp*.002 ? (V56P.still || 0) + 1 : 0; V56P.lastRp = rp;
  if(d && d.key === V56P.atmK && Math.abs(d.rp - rp) < rp*.04) return [d.c, d.rp];
  const S = Math.ceil(rp*2*V56P_AR);
  if(V56P.still > 3 && S < 2400){ const c = (d && d.c) || v56pCv(8, 8); c.width = c.height = S; const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.drawImage(base, 0, 0, S, S); V56P.atmD = {c, rp, key:V56P.atmK}; return [c, rp]; }
  return [base, 0];
}
// trời sao (theo cỡ màn hình)
function v56pStarCache(){
  const key = cw + 'x' + ch; if(V56P.stars && V56P.starK === key) return V56P.stars; V56P.starK = key;
  const c = v56pCv(Math.ceil(cw), Math.ceil(ch)), g = c.getContext('2d'); let s = 9137; const rn = () => (s = (s*16807) % 2147483647)/2147483647;
  const G = g.createLinearGradient(0, 0, cw, ch); G.addColorStop(0, '#05071a'); G.addColorStop(.5, '#0b0d2c'); G.addColorStop(1, '#06081c'); g.fillStyle = G; g.fillRect(0, 0, cw, ch);
  g.save(); g.translate(cw*.5, ch*.5); g.rotate(-.5); for(let i = 0; i < 26; i++){ const x = (rn() - .5)*Math.max(cw, ch)*1.6, y = (rn() - .5)*80, r = 40 + rn()*90, R = g.createRadialGradient(x, y, 0, x, y, r);
    R.addColorStop(0, `rgba(${150 + rn()*80|0},${120 + rn()*60|0},255,.07)`); R.addColorStop(1, 'rgba(120,100,255,0)'); g.fillStyle = R; g.fillRect(x - r, y - r, 2*r, 2*r); } g.restore();
  const n = Math.round(cw*ch/1400); for(let i = 0; i < n; i++){ const b = rn(), x = rn()*cw, y = rn()*ch; g.fillStyle = b > .96 ? '#ffe9b0' : b > .9 ? '#b8d4ff' : `rgba(255,255,255,${.35 + rn()*.5})`; const z = b > .97 ? 2 : 1; g.fillRect(x, y, z, z); }
  V56P.tw = Array.from({length:22}, () => [rn()*cw, rn()*ch, rn()*6]);
  return (V56P.stars = c);
}
function v56pSprites(){
  if(V56P.sun) return; const S = V56P.sun = v56pCv(160, 160), g = S.getContext('2d'), R = g.createRadialGradient(80, 80, 0, 80, 80, 80);
  R.addColorStop(0, 'rgba(255,255,236,1)'); R.addColorStop(.16, 'rgba(255,236,150,1)'); R.addColorStop(.24, 'rgba(255,200,90,.55)'); R.addColorStop(.55, 'rgba(255,170,70,.14)'); R.addColorStop(1, 'rgba(255,160,60,0)');
  g.fillStyle = R; g.fillRect(0, 0, 160, 160);
  // mây: 3 sắc (trắng · xám · xám đậm)
  V56P.puff = ['255,255,255', '138,146,162', '86,94,112'].map(col => { const c = v56pCv(160, 96), q = c.getContext('2d');
    [[52, 58, 30], [84, 46, 36], [112, 60, 28], [76, 66, 30], [34, 66, 20], [130, 68, 18]].forEach(([x, y, r]) => { const G = q.createRadialGradient(x, y, 0, x, y, r);
      G.addColorStop(0, `rgba(${col},.95)`); G.addColorStop(.6, `rgba(${col},.55)`); G.addColorStop(1, `rgba(${col},0)`); q.fillStyle = G; q.fillRect(x - r, y - r, 2*r, 2*r); }); return c; });
  // cực quang: dải rèm xanh lục → tím
  const A = V56P.aur = v56pCv(512, 160), a = A.getContext('2d');
  for(let i = 0; i < 128; i++){ const x = i*4, h = 70 + 60*Math.abs(Math.sin(i*.21) + .5*Math.sin(i*.07 + 1)), G = a.createLinearGradient(0, 160, 0, 160 - h);
    G.addColorStop(0, 'rgba(70,255,160,0)'); G.addColorStop(.18, 'rgba(70,255,160,.55)'); G.addColorStop(.62, 'rgba(90,220,255,.28)'); G.addColorStop(1, 'rgba(190,90,255,0)'); a.fillStyle = G; a.fillRect(x, 160 - h, 3, h); }
  // các cụm mây trên vòng (góc vàng → rải đều, không trùng)
  V56P.clouds = Array.from({length:72}, (_, i) => { const u = (i*.6180339) % 1; return {a:i*2.39996323, u, s:.7 + ((i*.381966) % 1)*.7, sp:.6 + u*.8, inner:i % 3 === 2}; });
}
// ---------- thời tiết → vòng mây ----------
function v56pCloudSpec(){
  const w = weather;
  if(w === 'nang' || w === 'nangnong' || w === 'dongdat') return {n:12, c:0, a:.55, inner:0};
  if(w === 'cauvong') return {n:18, c:0, a:.62, inner:4};
  if(w === 'tuyet') return {n:46, c:0, a:.86, inner:14};
  if(w === 'baotuyet') return {n:64, c:0, a:.92, inner:22};
  if(w === 'suongmu') return {n:52, c:0, a:.5, inner:20};
  if(w === 'gio') return {n:26, c:0, a:.6, inner:6};
  if(w === 'mua' || w === 'muaphun') return {n:48, c:1, a:.84, inner:18};
  return {n:62, c:2, a:.88, inner:22};   // bão, siêu bão, lốc, sấm sét, mưa đá
}
// ---------- vẽ: (1) màu biển theo độ sâu — gọi trong toạ độ thế giới, trước người/tàu ----------
function v56pSeaPass(alpha){
  if(alpha <= .01) return; const L = V46L, Rp = V56P.Rp; ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = true;
  ctx.drawImage(v56pSeaCache(), L.CX - Rp, L.CY - Rp, Rp*2, Rp*2); ctx.restore();
}
// ---------- vẽ: (2) nền vũ trụ toàn màn (không clip): biển phẳng → tối dần → sao, theo mức t ----------
function v56pSpaceBg(t, q){
  const C = ctx; C.save(); C.setTransform(DPR, 0, 0, DPR, 0, 0); C.globalAlpha = 1; C.fillStyle = S().sea2; C.imageSmoothingEnabled = false;
  if(q){ C.beginPath(); C.rect(q[0], q[1], q[2], q[3]); C.arc(q[4], q[5], q[6], 0, Math.PI*2, true); C.clip('evenodd'); }   // chỉ vá 4 góc quanh đĩa
  const r = q ? [Math.max(0, q[0]), Math.max(0, q[1]), Math.min(cw, q[0] + q[2]), Math.min(ch, q[1] + q[3])] : [0, 0, cw, ch];
  if(r[2] <= r[0] || r[3] <= r[1]){ C.restore(); return; }
  if(t < .999) C.fillRect(r[0], r[1], r[2] - r[0], r[3] - r[1]);
  C.globalAlpha = t; const st = v56pStarCache(); C.drawImage(st, r[0], r[1], r[2] - r[0], r[3] - r[1], r[0], r[1], r[2] - r[0], r[3] - r[1]);
  C.fillStyle = '#fff'; (V56P.tw || []).forEach(([x, y, p]) => { const k = .5 + .5*Math.sin(realT*2.2 + p); if(k > .55){ C.globalAlpha = t*k; C.fillRect(x - 1, y, 3, 1); C.fillRect(x, y - 1, 1, 3); } });
  C.restore();
}
// ---------- vẽ: (3) quanh hành tinh: mặt trời/trăng, cực quang, khí quyển + độ cong, vòng mây (toạ độ màn hình) ----------
function v56pSpace(cx, cy, rp, t, sky){
  const C = ctx; C.save(); C.setTransform(DPR, 0, 0, DPR, 0, 0); C.globalAlpha = t; C.imageSmoothingEnabled = true;
  // mặt trời / mặt trăng quay quanh theo giờ (trưa: trên đỉnh, nửa đêm: dưới đáy)
  const sa = v56pSunA(), orb = rp*(1 + v56pPow(1)*.75), sz = Math.max(70, rp*.36), ox = Math.max(rp*1.22, Math.min(orb, cw/2 - 24)), oy = Math.max(rp*1.16, Math.min(orb, ch/2 - 24)), sx = cx + Math.cos(sa)*ox, sy = cy + Math.sin(sa)*oy;   // quỹ đạo elip vừa khung màn
  C.drawImage(V56P.sun, sx - sz/2, sy - sz/2, sz, sz);
  const mx = cx - Math.cos(sa)*ox, my = cy - Math.sin(sa)*oy, mr = Math.max(9, rp*.055);
  C.fillStyle = '#e9ecf4'; C.beginPath(); C.arc(mx, my, mr, 0, Math.PI*2); C.fill(); C.fillStyle = 'rgba(150,158,180,.7)';
  [[-.3, -.2, .26], [.32, .1, .2], [-.05, .4, .16]].forEach(([u, v, q]) => { C.beginPath(); C.arc(mx + u*mr, my + v*mr, q*mr, 0, Math.PI*2); C.fill(); });
  C.fillStyle = 'rgba(10,14,40,.55)'; C.beginPath(); C.arc(mx + Math.cos(sa)*mr*.5, my + Math.sin(sa)*mr*.5, mr*.9, 0, Math.PI*2); C.fill();   // pha trăng: phía xa mặt trời tối
  // khí quyển + độ cong + bóng ngày/đêm (1 ảnh cache)
  const [ai, ar] = v56pAtmImg(rp); C.imageSmoothingEnabled = !ar; C.drawImage(ai, cx - rp*V56P_AR, cy - rp*V56P_AR, rp*2*V56P_AR, rp*2*V56P_AR); C.imageSmoothingEnabled = true;
  // cực quang ban đêm (hai cực: bắc to, nam nhỏ) — vòng cực quang dựng sẵn, mỗi khung chỉ nhấp nháy + co giãn nhẹ
  const s = v56pSky(); if(s.night > .05){ const A = v56pAurRing(), k = 1 + .012*Math.sin(realT*.7), q = rp*V56P_AR*k;
    C.save(); C.globalCompositeOperation = 'lighter'; C.globalAlpha = t*s.night*(.72 + .2*Math.sin(realT*.9)); C.imageSmoothingEnabled = false; C.drawImage(A, cx - q, cy - q, q*2, q*2); C.restore(); }
  if(!sky) v56pCloudRing(cx, cy, rp, t, 0, 1e9);
  C.restore();
}
// vòng mây: cụm trên mép (chồng lên biển) + cụm trong đĩa khi trời xấu; chỉ vẽ cụm nằm trong khung nhìn
function v56pCloudRing(cx, cy, rp, t, a0, a1){
  const sp = v56pCloudSpec(), s = v56pSky(), C = ctx, w = WEATHERS[weather] ? WEATHERS[weather].wind : .2, rot = realT*(.006 + w*.01), band = v56pPow(5), mid = 1 + v56pPow(7);
  const puff = V56P.puff[s.night > .6 && sp.c === 0 ? 1 : sp.c], al = sp.a*(1 - s.night*.35)*t, ib = Math.min(sp.inner, 24); let n = 0, m = 0;
  for(const c of V56P.clouds){
    let r; if(c.inner){ if(m >= ib) continue; m++; r = rp*(.3 + c.u*.62); } else { if(n >= sp.n) continue; n++; r = rp*(mid + (c.u - .5)*band); }
    if(r < a0*rp || r > a1*rp) continue;
    const a = c.a + rot*c.sp, x = cx + Math.cos(a)*r, y = cy + Math.sin(a)*r, sz = rp*.19*c.s*(c.inner ? 1.3 : 1), h = sz*.6;
    if(x < -sz || x > cw + sz || y < -sz || y > ch + sz) continue;
    const ca = Math.cos(a + Math.PI/2), sn = Math.sin(a + Math.PI/2); C.globalAlpha = al*(c.inner ? .7 : 1);
    C.setTransform(DPR*ca, DPR*sn, -DPR*sn, DPR*ca, DPR*x, DPR*y); C.drawImage(puff, -sz/2, -h/2, sz, h);
  }
  C.setTransform(DPR, 0, 0, DPR, 0, 0); C.globalAlpha = 1;
}
// chim (đàn chữ V, dưới tầng mây) — toạ độ màn hình
function v56pBirds(cx, cy, rp, t){
  const s = v56pSky(); if(s.night > .7) return; const C = ctx; C.save(); C.setTransform(DPR, 0, 0, DPR, 0, 0); C.globalAlpha = t*(1 - s.night); C.strokeStyle = '#1c2436'; C.lineWidth = 1.6;
  for(let f = 0; f < 4; f++){ const a = f*1.9 + realT*.02*(f % 2 ? -1 : 1), r = rp*(.42 + f*.13), x = cx + Math.cos(a)*r, y = cy + Math.sin(a)*r, d = a + (f % 2 ? -1 : 1)*Math.PI/2;
    for(let i = 0; i < 5; i++){ const o = i - 2, bx = x - Math.cos(d)*Math.abs(o)*9 + Math.cos(d + Math.PI/2)*o*8, by = y - Math.sin(d)*Math.abs(o)*9 + Math.sin(d + Math.PI/2)*o*8, fl = Math.sin(realT*8 + i + f)*2.2;
      C.beginPath(); C.moveTo(bx - 4, by - fl); C.lineTo(bx, by); C.lineTo(bx + 4, by - fl); C.stroke(); } }
  C.restore();
}
// máy bay trang trí (trên tầng mây), lấy từ SKY.planes của v17
function v56pPlanes(cx, cy, rp, t){
  if(typeof SKY === 'undefined' || !SKY.planes) return; const C = ctx; C.save(); C.globalAlpha = t; const sz = Math.max(7, rp*.028);
  SKY.planes.forEach((p, i) => { const u = ((p.x/W) % 1 + 1) % 1, a = i*1.57 + .4, d = (u - .5)*2*rp*.92, off = (i - 1.5)*rp*.28, x = cx + Math.cos(a)*d - Math.sin(a)*off, y = cy + Math.sin(a)*d + Math.cos(a)*off, h = a + (p.v < 0 ? Math.PI : 0);
    C.setTransform(DPR*Math.cos(h), DPR*Math.sin(h), -DPR*Math.sin(h), DPR*Math.cos(h), DPR*x, DPR*y);
    C.fillStyle = 'rgba(255,255,255,.35)'; C.fillRect(-sz*4.2, -.6, sz*3.2, 1.2);
    C.fillStyle = p.c || '#eceff1'; C.fillRect(-sz, -sz*.18, sz*2, sz*.36); C.fillRect(-sz*.2, -sz*.9, sz*.5, sz*1.8); C.fillRect(-sz, -sz*.45, sz*.3, sz*.9); });
  C.restore();
}
