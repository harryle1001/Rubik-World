// ================= v53s · BIỂN KHƠI: thả neo câu cá ngoài biển + đuổi tàu hải tặc đi (không bạo lực) =================
// Mọi tên toàn cục ở đây có tiền tố v53s / V53S. Chỉ bọc hàm cũ, không sửa file cũ.
// Phần này: lưu trữ, điểm câu đặc biệt, tàu hải tặc neo ngoài khơi, nút nổi (Câu cá / Nhảy sang tàu / Sổ tay cá).
const V53S = {ui:null, db:null, who:'', spots:[], spotKey:'', pir:null, gull:null, tick:0, near:'', leave:0};
const V53S_K = 'v53s-sea-v1';
const V53S_PHI = 1.618;
// tàu hải tặc neo ở phía đông bắc cửa bến (góc vàng so với hướng bến), trong vùng ven bờ nên thuyền nào cũng tới được
const V53S_PIRA = -Math.PI/2 + 0.618, V53S_PIRR = 5200 + 250;

// ---------- 1. lưu trữ (theo tên người chơi) ----------
function v53sWho(){ return (typeof PROF !== 'undefined' && PROF && PROF.name) || 'guest'; }
function v53sDb(){ const w = v53sWho(); if(V53S.db && V53S.who === w) return V53S.db;
  let o = null; try { o = JSON.parse(localStorage.getItem(V53S_K + ':' + w) || 'null'); } catch(e){}
  o = o || {}; o.bag = o.bag || []; o.dex = o.dex || {}; o.pir = o.pir || {gone:false, days:0, need:4, wins:0}; o.cook = o.cook || 0;
  V53S.db = o; V53S.who = w; return o; }
function v53sSave(){ try { localStorage.setItem(V53S_K + ':' + V53S.who, JSON.stringify(V53S.db)); } catch(e){} }

// ---------- 2. toạ độ biển mới (đảo tròn v46) ----------
function v53sMe(){ return typeof agents !== 'undefined' ? agents.find(a => a.controlled) : null; }
function v53sAtSea(c){ return !!(c && c.boat && typeof V46 !== 'undefined' && V46.on && !V46.sky && v46Raw(c.x)); }
function v53sRaw(c){ return [c.x - V46E, c.y]; }
function v53sZone(x, y){ try { return oceanAt(v47wDepthY(x, y)); } catch(e){ return {z:1, n:'Vùng ven bờ'}; } }
function v53sPirPos(){ const L = V46L, P = V53S.pir || {}, k = P.lv ? Math.min(1, (realT - P.lv)/14) : 0, r = V53S_PIRR + k*k*1600, a = V53S_PIRA + k*.05;
  return [L.CX + Math.cos(a)*r, L.CY + Math.sin(a)*r, a, k]; }
// đầu ván nhảy: phía mạn tàu quay về đảo
function v53sPlankA(){ const [x, y, a] = v53sPirPos(), sx = Math.cos(a) > 0 ? -1 : 1, x0 = x + sx*96, y0 = y + 6; return [x0, y0, x0 - Math.cos(a)*120, y0 - Math.sin(a)*96]; }
function v53sPlank(){ const P = v53sPlankA(); return [P[2], P[3]]; }
function v53sPirHere(){ const P = v53sDb().pir; return !P.gone || (V53S.pir && V53S.pir.lv && realT - V53S.pir.lv < 14); }

// ---------- 3. điểm câu đặc biệt: đàn chim bay vòng, nước sủi bọt (đổi mỗi 2 giờ trong game) ----------
function v53sRng(seed){ let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0)/4294967296; }; }
function v53sSpots(){ const key = day + ':' + Math.floor(clock/120); if(V53S.spotKey === key) return V53S.spots; V53S.spotKey = key;
  const R = v53sRng(day*977 + Math.floor(clock/120)*131 + 7), L = V46L, out = [];
  for(let i = 0, n = 0; i < 7 && n < 60; n++){ // 2 điểm đầu luôn gần cửa bến (không trong khu bến); các điểm sau rải khắp biển, xa đảo hơn
    const a = i < 2 ? -Math.PI/2 + (i ? 1 : -1)*(.32 + R()*.3) : R()*Math.PI*2, far = i < 2 ? 160 + R()*220 : 220 + R()*1800, r = L.ISLAND + far;
    const x = L.CX + Math.cos(a)*r, y = L.CY + Math.sin(a)*r; if(x < 160 || x > L.W - 160 || y < 140 || y > L.H - 160) continue;
    if(Math.hypot(x - L.CX, y - L.CY) < L.ISLAND + 120 || [[0, 0], [-260, 0], [260, 0], [0, 260], [0, -200]].some(([dx, dy]) => { try { return !!v46ZoneNew(x + dx, y + dy); } catch(e){ return false; } })) continue;
    if(Math.hypot(x - v53sPirPos()[0], y - v53sPirPos()[1]) < 500) continue; i++;
    out.push({x, y, k:i % 2 ? 'bub' : 'bird', ph:R()*6, n:5 + Math.floor(R()*3)}); }
  V53S.spots = out; return out; }
function v53sSpotAt(x, y){ return v53sSpots().find(s => Math.hypot(s.x - x, s.y - y) < 190) || null; }

// ---------- 4. vẽ trên biển (gọi sau khi các khu đã vẽ, toạ độ thế giới mới) ----------
function v53sGullSprite(){ if(V53S.gull) return V53S.gull; const cv = document.createElement('canvas'); cv.width = 40; cv.height = 14; const g = cv.getContext('2d');
  [0, 1].forEach(f => { const ox = f*20; g.fillStyle = '#f7f5ef'; g.fillRect(ox + 8, 6, 5, 3); g.fillStyle = '#37474f';
    if(f){ g.fillRect(ox + 2, 7, 6, 2); g.fillRect(ox + 13, 7, 6, 2); g.fillRect(ox + 1, 9, 2, 2); g.fillRect(ox + 18, 9, 2, 2); }
    else { g.fillRect(ox + 3, 4, 5, 2); g.fillRect(ox + 13, 4, 5, 2); g.fillRect(ox + 1, 2, 2, 2); g.fillRect(ox + 18, 2, 2, 2); } g.fillStyle = '#ffb300'; g.fillRect(ox + 13, 7, 2, 1); });
  return V53S.gull = cv; }
function v53sDrawSpots(VBn){ const G = v53sGullSprite(), t = realT;
  v53sSpots().forEach(s => { if(s.x < VBn.x0 - 200 || s.x > VBn.x1 + 200 || s.y < VBn.y0 - 260 || s.y > VBn.y1 + 200) return;
    if(s.k === 'bub'){ ctx.fillStyle = 'rgba(255,255,255,.75)'; for(let i = 0; i < 14; i++){ const k = (t*.7 + i*.618) % 1, a = i*2.39996 + s.ph, rr = 10 + (i*23 % 60); const x = s.x + Math.cos(a)*rr, y = s.y + Math.sin(a)*rr*.6;
        ctx.globalAlpha = .8*(1 - k); ctx.beginPath(); ctx.arc(x, y - k*6, 2 + k*5, 0, 6.283); ctx.fill(); }
      ctx.globalAlpha = .35; ctx.strokeStyle = '#e0f7fa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(s.x, s.y, 70 + Math.sin(t*1.3 + s.ph)*8, 40, 0, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1; }
    else { ctx.globalAlpha = .18; ctx.fillStyle = '#0d2a3a'; for(let i = 0; i < s.n; i++){ const a = t*.55 + i*6.283/s.n + s.ph; ctx.beginPath(); ctx.ellipse(s.x + Math.cos(a)*80, s.y + Math.sin(a)*34, 7, 3, 0, 0, 6.283); ctx.fill(); }
      ctx.globalAlpha = 1; for(let i = 0; i < s.n; i++){ const a = t*.55 + i*6.283/s.n + s.ph, f = ((t*4 + i) | 0) % 2, x = Math.round(s.x + Math.cos(a)*80 - 20), y = Math.round(s.y - 120 + Math.sin(a)*34 + Math.sin(t*2 + i)*6);
        ctx.drawImage(G, f*20, 0, 20, 14, x, y, 40, 28); }
      ctx.fillStyle = 'rgba(255,255,255,.55)'; for(let i = 0; i < 6; i++){ const a = i + s.ph, k = (t*.9 + i*.37) % 1; ctx.fillRect(Math.round(s.x + Math.cos(a)*40*k), Math.round(s.y + Math.sin(a)*20*k), 4, 2); } } }); }
function v53sDrawPirate(VBn){ if(!v53sPirHere()) return; const [x, y, a, k] = v53sPirPos(); if(x < VBn.x0 - 400 || x > VBn.x1 + 400 || y < VBn.y0 - 400 || y > VBn.y1 + 300) return;
  const sc = 2.2, dir = Math.cos(a) < 0 ? 1 : -1, bob = Math.sin(realT*1.2)*2;
  ctx.save(); ctx.globalAlpha = 1 - k*.9;
  // ván nhảy (cầu tàu gỗ) chìa ra phía đảo
  ctx.save(); ctx.translate(x, y + bob); ctx.scale(sc, sc); try { drawShip({k:'pirate', x:0, y:0, dir, v:0}); } catch(e){} ctx.restore();
  // ván nhảy gỗ hạ từ mạn tàu xuống phía đảo + phao tròn ở đầu ván
  if(!k){ const [x0, y0, px, py] = v53sPlankA(), L = Math.hypot(px - x0, py - y0); ctx.save(); ctx.translate(x0, y0 + bob); ctx.rotate(Math.atan2(py - y0, px - x0)); ctx.fillStyle = '#a07a4e'; ctx.fillRect(0, -10, L, 20); ctx.fillStyle = '#6d4c2e'; for(let i = 0; i < L; i += 16) ctx.fillRect(i, -10, 3, 20); ctx.fillStyle = '#4e342e'; ctx.fillRect(0, -13, L, 3); ctx.fillRect(0, 10, L, 3); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(px, py + 16, 26 + Math.sin(realT*2)*3, 7, 0, 0, 6.283); ctx.fill(); ctx.fillStyle = '#ef4b4b'; ctx.beginPath(); ctx.arc(px, py + 6, 9, 0, 6.283); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(px - 9, py + 4, 18, 4); }
  ctx.restore();
  if(k && k < .5){ const fs = Math.round(17/(cam.z || 1)); ctx.font = `800 ${fs}px Nunito, sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,248,225,.95)'; const m = '👋 Tạm biệt, cảm ơn nhé!', w = ctx.measureText(m).width + 16; ctx.fillRect(x - w/2, y + 70 - fs, w, fs*1.5); ctx.fillStyle = '#3e2723'; ctx.fillText(m, x, y + 70 + fs*.2); ctx.textAlign = 'left'; }
  if(!k){ const pl = v53sPlank(), me = v53sMe(), z = cam.z || 1; if(me && v53sAtSea(me)){ const p = v53sRaw(me); const dd = Math.hypot(p[0] - pl[0], p[1] - pl[1]); if(dd < 900 && dd > 170){
    const fs = Math.round(17/z), tx = pl[0], ty = pl[1] + 54/z; ctx.font = `800 ${fs}px Nunito, sans-serif`; ctx.textAlign = 'center'; const msg = '🏴‍☠️ Ván nhảy sang tàu', w = ctx.measureText(msg).width + 20/z;
      ctx.fillStyle = 'rgba(20,16,10,.82)'; ctx.fillRect(tx - w/2, ty - fs, w, fs*1.5); ctx.fillStyle = '#ffd23f'; ctx.fillText(msg, tx, ty + fs*.2); ctx.textAlign = 'left'; } } } }
function v53sDrawAnchor(){ const c = v53sMe(); if(!c || !c.boat || !c.boat.v53a || !v53sAtSea(c)) return; const [x, y] = v53sRaw(c);
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 18, y - 4); ctx.lineTo(x + 26, y + 16); ctx.stroke();
  ctx.globalAlpha = .4; ctx.strokeStyle = '#e0f7fa'; ctx.beginPath(); ctx.ellipse(x, y + 6, 46 + Math.sin(realT*1.5)*4, 14, 0, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1; }
function v53sWorld(VBn){ try { v53sDrawSpots(VBn); } catch(e){} try { v53sDrawPirate(VBn); } catch(e){} try { v53sDrawAnchor(); } catch(e){} }

// ---------- 5. nút nổi: ⚓ Câu cá (khi thuyền dừng) · 🏴‍☠️ Nhảy sang tàu (khi sát ván) · 📖 Sổ tay cá ----------
function v53sBuildUi(){ if(V53S.ui) return V53S.ui; const d = document.createElement('div'); d.id = 'v53sAct'; d.hidden = true;
  d.innerHTML = '<button type="button" id="v53sFishB" hidden>⚓ <b>Câu cá</b></button><button type="button" id="v53sJumpB" hidden>🏴‍☠️ <b>Nhảy sang tàu</b></button><button type="button" id="v53sBookB" aria-label="Sổ tay cá">📖</button><small id="v53sHint"></small>';
  document.body.appendChild(d); V53S.ui = d;
  d.querySelector('#v53sFishB').onclick = () => v53sDropAnchor();
  d.querySelector('#v53sJumpB').onclick = () => v53sBoard();
  d.querySelector('#v53sBookB').onclick = () => v53sBookOpen('dex');
  return d; }
function v53sUiTick(){ const d = V53S.ui; if(!d) return; const c = v53sMe(), sea = v53sAtSea(c) && !(typeof openModal !== 'undefined' && openModal) && !document.body.classList.contains('v51pOn');
  if(d.hidden === sea) d.hidden = !sea; if(!sea) return;
  const b = c.boat, slow = Math.abs(b.v) < 18, p = v53sRaw(c), pl = v53sPlank(), nearPl = v53sPirHere() && !(V53S.pir && V53S.pir.lv) && Math.hypot(p[0] - pl[0], p[1] - pl[1]) < 170;
  const sp = v53sSpotAt(p[0], p[1]), z = v53sZone(p[0], p[1]);
  const fb = d.querySelector('#v53sFishB'), jb = d.querySelector('#v53sJumpB'), h = d.querySelector('#v53sHint');
  if(fb.hidden === (slow && !nearPl)) fb.hidden = !(slow && !nearPl); if(jb.hidden === nearPl) jb.hidden = !nearPl;
  const t = nearPl ? '🏴‍☠️ Sát ván nhảy rồi!' : slow ? (sp ? (sp.k === 'bird' ? '🕊️ Đàn chim đang săn cá ở đây!' : '🫧 Nước sủi bọt: cá hiếm quanh đây!') : `🌊 ${z.n}`) : (sp ? '🕊️ Gần điểm câu đặc biệt, dừng thuyền lại nhé' : '');
  if(h.textContent !== t) h.textContent = t; }
function v53sDropAnchor(){ const c = v53sMe(); if(!v53sAtSea(c)) return; c.boat.v = 0; c.boat.v53a = true; c.moving = false;
  try { kickSfx(.35); } catch(e){} v53sFishOpen(); }
function v53sBoard(){ const c = v53sMe(); if(!v53sAtSea(c)) return; c.boat.v = 0; c.boat.v53a = true; try { blipSfx(660); } catch(e){} v53sPirOpen(); }

// ---------- 6. hải tặc rời đi / quay lại ----------
function v53sPirSail(){ const P = v53sDb().pir; P.gone = true; P.days = 0; P.need = 3 + Math.floor(Math.random()*3); P.wins = (P.wins || 0) + 1; P.at = Date.now(); v53sSave();
  V53S.pir = {lv:realT}; try { if(typeof pirate !== 'undefined' && pirate){ ships = ships.filter(s => s !== pirate); pirate = null; } } catch(e){}
  try { log('sea', 'Tàu hải tặc Râu Cam chịu thua, cảm ơn các bạn rồi giương buồm đi thật xa. Biển yên bình!', 'hung'); } catch(e){} }
function v53sPirBack(){ const P = v53sDb().pir; if(!P.gone) return; const real = P.at && Date.now() - P.at > 3*864e5;
  if(P.days >= P.need || real){ P.gone = false; P.days = 0; v53sSave(); V53S.pir = null; toast('🏴‍☠️ Tàu hải tặc Râu Cam đã quay lại vùng biển! Chèo thuyền tới ván nhảy để chơi tiếp nhé.'); } }

// ---------- 7. khởi động ----------
function v53sInit(){
  v53sBuildUi(); v53sDb();
  // vẽ thêm trên biển (v46Render gọi v47wWorld theo tên)
  const w0 = v47wWorld; v47wWorld = function(VBn){ w0(VBn); v53sWorld(VBn); };
  // hải tặc rời đi: cả đội tàu hải tặc chạy vòng quanh đảo cũng biến mất
  const bs0 = v47wBigShip; v47wBigShip = function(s){ if(s && s.k === 'pirate2' && v53sDb().pir.gone) return false; return bs0(s); };
  const ps0 = v47wShipPos; v47wShipPos = function(s){ const P = ps0(s); if(!v53sPirHere()) return P; const L = V46L, a = Math.atan2(P[1] - L.CY, P[0] - L.CX), d = Math.abs(Math.atan2(Math.sin(a - V53S_PIRA), Math.cos(a - V53S_PIRA)));
    if(d > .3) return P; const r = Math.hypot(P[0] - L.CX, P[1] - L.CY) + 430*(.5 + .5*Math.cos(d/.3*Math.PI)); return [L.CX + Math.cos(a)*r, L.CY + Math.sin(a)*r, P[2]]; };
  const sp0 = spawnPirate; spawnPirate = function(manual){ if(v53sDb().pir.gone){ if(manual) toast('🌊 Hải tặc đã đi xa rồi. Vài ngày nữa có thể họ quay lại.'); return; } return sp0.apply(this, arguments); };
  const nd0 = newDay; newDay = function(){ const r = nd0.apply(this, arguments); try { const P = v53sDb().pir; if(P.gone){ P.days = (P.days || 0) + 1; v53sSave(); v53sPirBack(); } } catch(e){} return r; };
  // thả neo: thuyền đứng yên tới khi người chơi lái tiếp (tự kéo neo)
  const bm0 = boatMove; boatMove = function(c, dt){ const b = c && c.boat;
    if(b && b.v53a){ const S = typeof V39 !== 'undefined' ? V39.steer : null, go = keys.up || keys.down || keys.left || keys.right || (S && S.drag);
      if(!go){ b.v = 0; c.moving = false; return; } b.v53a = false; toast('⚓ Kéo neo lên, ra khơi tiếp!'); }
    return bm0.apply(this, arguments); };
  // menu chính v39: thêm Sổ tay cá (menu v39 dựng danh sách mỗi lần mở)
  const mi0 = v39MainItems; v39MainItems = function(){ const L = mi0.apply(this, arguments); L.push({ic:'scroll', en:'Fish Book', vi:'Sổ tay cá', grp:'play', f:() => v53sBookOpen('dex')}); return L; };
  setInterval(() => { try { v53sUiTick(); } catch(e){} }, 250);
  try { v53sPirBack(); } catch(e){}
  try { v53sFishInit(); } catch(e){ console.warn('v53s fish', e); }
  try { v53sPirInit(); } catch(e){ console.warn('v53s pir', e); }
}
