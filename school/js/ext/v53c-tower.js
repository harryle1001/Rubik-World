// ================= v53c · THÀNH PHỐ AN TOÀN 6a: Tháp Rubik 81 — thang máy, đài quan sát tầng 81 (nhìn toàn đảo), nhà hàng Mây tầng 61 =================
const V53C_DECK_FACTS = [
  '🔭 Đứng ở độ cao 461 m, mắt người nhìn xa được khoảng 77 km (vì Trái Đất cong). Công thức: √(độ cao) × 3,57 km.',
  '📐 Các khối của tháp nhỏ dần theo tỷ lệ vàng: cột sau cao bằng cột trước chia √φ, chóp tháp = chiều cao ÷ φ⁴.',
  '🌬️ Trên cao gió mạnh hơn dưới đất, nên nhà chọc trời được thiết kế hơi đung đưa để không gãy.',
  '⚡ Đèn chớp trên đỉnh tháp giúp máy bay nhìn thấy tháp vào ban đêm và khi trời mù.',
  '🏙️ Tháp có 81 tầng: mỗi tầng cao khoảng 5,7 m. 81 = 9 × 9 = 3⁴.',
  '🎋 Kiểu dáng "bó tre": nhiều ống cao thấp đứng sát nhau, giống bó tre buộc chặt — cứng cáp hơn từng cây lẻ.',
  '🌅 Ban đêm, đèn LED trên mép các khối đổi màu cầu vồng: đỏ, cam, vàng, lục, lam, chàm, tím.'
];
// ---------- 1. thang máy (hoạt cảnh đếm tầng) ----------
function v53cLift(floor, then){
  let L = document.getElementById('v53cLift'); if(!L){ L = document.createElement('div'); L.id = 'v53cLift'; L.innerHTML = '<div class="v53cLD"><i></i><i></i></div><div class="v53cLC"><b id="v53cLN">1</b><span id="v53cLT"></span></div>'; (document.getElementById('stage') || document.body).appendChild(L); }
  v53cPanel(null); L.hidden = false; L.classList.remove('open'); const from = V53C.floor || 1, t0 = performance.now(), dur = 2300, N = document.getElementById('v53cLN');
  document.getElementById('v53cLT').textContent = floor > from ? '⬆️ Thang máy đi lên · tai hơi ù là bình thường, nuốt nước bọt là hết!' : '⬇️ Thang máy đi xuống · bám tay vịn nhé';
  v53cSnd('ding', .6); const step = () => { const k = Math.min(1, (performance.now() - t0)/dur), e = k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2; N.textContent = Math.round(from + (floor - from)*e);
    if(k < 1) requestAnimationFrame(step); else { V53C.floor = floor; v53cSnd('ding', .8); L.classList.add('open'); setTimeout(() => { L.hidden = true; if(then) then(); }, 520); } };
  requestAnimationFrame(step);
}
// ---------- 2. vào / ra khỏi tháp ----------
function v53cTowerGo(floor){
  if(typeof PLAYER === 'undefined' || !PLAYER || !PLAYER.visible) return; try { cancelAuto(); } catch(e){} try { if(PLAYER.cycling) toggleBike(); } catch(e){}
  V53C.mode = 'lift'; document.body.classList.add('v53cOn'); V53C.fc = followCam; followCam = false; V53C.cz = cam.z;
  v53cLift(floor, () => { if(floor === 81) v53cDeckOn(); else if(floor === 61) v53cRestOn(); else v53cTowerLeave(); });
}
function v53cTowerLeave(){
  const G = v53cGeo('tower81'), Pl = PLAYER, x = G.door[0], y = G.gy + 40; v53cDeckHud(false); V53C.floor = 1;
  if(Pl){ Pl.x = x + V46E; Pl.y = y; Pl._z = null; Pl.v46t = null; Pl._lx = Pl.x; Pl._ly = Pl.y; Pl.moving = false; }
  V53C.mode = ''; document.body.classList.remove('v53cOn'); followCam = V53C.fc !== false; cam.z = Math.max(.6, Math.min(1.4, V53C.cz || 1)); cam.x = x; cam.y = y; try { clampCam(); } catch(e){}
  try { select(PLAYER, true); if(!PLAYER.controlled) setControl(true); followCam = true; } catch(e){}
}
function v53cTowerDown(){ V53C.mode = 'lift'; v53cDeckHud(false); v53cPanel(null); v53cLift(1, v53cTowerLeave); }
// ---------- 3. đài quan sát: camera nhìn toàn đảo, kéo để ngắm, ➕ ➖ theo bước φ ----------
function v53cDeckFit(){ return Math.min(cw, ch)/(2*(V46L.ISLAND + 500)); }
function v53cDeckOn(){
  V53C.mode = 'deck'; const G = v53cGeo('tower81'); V53C.dk = {x:V46L.CX, y:V46L.CY + 300, z:v53cDeckFit(), fi:0, ft:realT}; cam.x = G.cx; cam.y = G.gy - G.th; cam.z = .5;
  v53cDeckHud(true); const s = v53cState(); s.deck = (s.deck || 0) + 1; v53cSave(); setTimeout(() => v53cBadge('sky'), 1600);
}
function v53cRestOn(){ V53C.mode = 'rest'; const G = v53cGeo('tower81'); V53C.dk = {x:G.cx, y:G.gy - 200, z:Math.min(cw, ch) < 520 ? .2 : .28}; v53cPanel('rest'); }
function v53cDeckCam(dt){
  const D = V53C.dk; if(!D) return; const k = Math.min(1, dt*2.2); cam.x += (D.x - cam.x)*k; cam.y += (D.y - cam.y)*k; cam.z += (D.z - cam.z)*Math.min(1, dt*1.6);
  if(V53C.mode === 'deck' && realT - D.ft > 9){ D.ft = realT; D.fi = (D.fi + 1) % V53C_DECK_FACTS.length; const f = document.getElementById('v53cDF'); if(f) f.textContent = V53C_DECK_FACTS[D.fi]; }
}
function v53cDeckZoom(dir){ const D = V53C.dk; if(!D) return; const f = v53cDeckFit(); D.z = Math.max(f*.8, Math.min(.6, D.z*(dir > 0 ? V53C_PHI : 1/V53C_PHI))); v53cSnd('tap'); }
function v53cDeckHud(on){
  let h = document.getElementById('v53cDeck');
  if(!h){ if(!on) return; h = document.createElement('div'); h.id = 'v53cDeck';
    h.innerHTML = '<div id="v53cDeckPad"></div><div class="v53cWin"></div><div class="v51pTop"><button type="button" class="v51pIb" id="v53cDX" aria-label="Đi thang máy xuống">✕</button><div id="v53cDS"><b>🔭 Đài quan sát · Tầng 81</b><span>⛰️ 461 m</span></div><button type="button" class="v51pIb" id="v53cDM" aria-label="Thu nhỏ">➖</button><button type="button" class="v51pIb" id="v53cDP" aria-label="Phóng to">➕</button></div><div id="v53cDF"></div>';
    (document.getElementById('stage') || document.body).appendChild(h);
    h.querySelector('#v53cDX').onclick = () => v53cTowerDown(); h.querySelector('#v53cDM').onclick = () => v53cDeckZoom(-1); h.querySelector('#v53cDP').onclick = () => v53cDeckZoom(1);
    const pad = h.querySelector('#v53cDeckPad'); let pid = null, lx = 0, ly = 0;
    pad.addEventListener('pointerdown', e => { pid = e.pointerId; lx = e.clientX; ly = e.clientY; try { pad.setPointerCapture(pid); } catch(er){} e.preventDefault(); });
    pad.addEventListener('pointermove', e => { if(e.pointerId !== pid || !V53C.dk) return; const D = V53C.dk, R = V46L.ISLAND + 2500; D.x -= (e.clientX - lx)/cam.z; D.y -= (e.clientY - ly)/cam.z; lx = e.clientX; ly = e.clientY;
      const dx = D.x - V46L.CX, dy = D.y - V46L.CY, r = Math.hypot(dx, dy); if(r > R){ D.x = V46L.CX + dx/r*R; D.y = V46L.CY + dy/r*R; } cam.x = D.x; cam.y = D.y; });
    const up = e => { if(e.pointerId === pid) pid = null; }; pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', up);
    pad.addEventListener('wheel', e => { v53cDeckZoom(e.deltaY < 0 ? 1 : -1); e.preventDefault(); }, {passive:false}); }
  h.hidden = !on; if(on){ const f = h.querySelector('#v53cDF'); f.textContent = V53C_DECK_FACTS[0]; }
}
// ---------- 4. nhà hàng Mây (tầng 61): chọn khay cơm cân bằng ----------
const V53C_FOOD = [
  {ic:'🥦', vi:'Rau xanh luộc', g:'rau'}, {ic:'🥕', vi:'Cà rốt xào', g:'rau'}, {ic:'🐟', vi:'Cá hấp', g:'dam'}, {ic:'🍳', vi:'Trứng ốp', g:'dam'}, {ic:'🫘', vi:'Đậu phụ sốt cà', g:'dam'},
  {ic:'🍚', vi:'Cơm trắng', g:'bot'}, {ic:'🍠', vi:'Khoai lang', g:'bot'}, {ic:'🍉', vi:'Dưa hấu', g:'qua'}, {ic:'🍟', vi:'Khoai chiên', g:'vat'}, {ic:'🥤', vi:'Nước ngọt', g:'vat'}
];
const V53C_FG = {rau:'🥬 Rau', dam:'🍗 Đạm', bot:'🍚 Tinh bột', qua:'🍎 Trái cây', vat:'🍭 Đồ ăn vặt'};
