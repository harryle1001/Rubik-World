// ================= EXT46 (v41): a vertical column of travel buttons on the right edge — Bike, Boat, Fly —
// white line icons with small English labels, gold ring when on; Boat far from water offers the way to the nearest pier;
// the old duplicates (left 🎈/🚲, Menu tiles, "⋯ Thêm" buttons) are removed =================
const V41 = {card:null};
const V41_ICON = {walk:'<circle cx="12" cy="4.5" r="2"/><path d="M12 6.5l-1.5 6 3 3 1 5.5M10.5 12.5l-3.5 2.5-1 4.5M11.5 9l4 2 2-1.5M11.5 9l-3 1"/>',
  leave:'<path d="M3 18.5h18l-2.6 3H5.6z"/><path d="M12 18.5V6M12 6l-4 4M12 6l4 4"/>', chute:'<path d="M3 10a9 7 0 0 1 18 0"/><path d="M3 10c1.5-1.2 3-1.2 4.5 0 1.5-1.2 3-1.2 4.5 0 1.5-1.2 3-1.2 4.5 0 1.5-1.2 3-1.2 4.5 0"/><path d="M3 10l8 9M21 10l-8 9M12 10v8"/><rect x="10.6" y="18" width="2.8" height="3.5" rx=".6"/>'};
function v41Svg(p){ return `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#F7F5EF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`; }
const v41NearWater = P => P.y > 700 || Math.hypot(P.x - PIER_END[0], P.y - PIER_END[1]) < 260;
function v41Pier(P){ const L = [[PIER_END[0], PIER_END[1] - 60, 'Bến tàu'], [Math.max(40, Math.min(W - 40, P.x)), 800, 'Bãi biển']]; let best = null, bd = 1e9; for(const q of L){ const d = Math.hypot(q[0] - P.x, q[1] - P.y); if(d < bd){ bd = d; best = q; } } return [best, bd]; }
function v41Boat(){
  const P = PLAYER; if(!P) return; if(P.boat || v41NearWater(P)){ v41Hide(); boardBoat(); return; }
  const [q, d] = v41Pier(P); let c = $('#v41Card'); if(!c){ c = document.createElement('div'); c.id = 'v41Card'; c.setAttribute('role', 'dialog'); $('#stage').appendChild(c); }
  c.hidden = false; c.innerHTML = `<div><b>Nearest pier · ${Math.round(d/8)}m</b><small>${q[2]} gần nhất · Go there? / Đi tới đó?</small></div><button type="button" class="v41go">Go · Đi</button><button type="button" class="v41no" aria-label="Đóng">✕</button>`;
  c.querySelector('.v41go').onclick = () => { v41Hide(); try { v32Nav(q[0], q[1], q[2], true, () => { if(!PLAYER.boat) boardBoat(); }); } catch(e){ toast('Đi về phía biển (phía nam) để lên thuyền.'); } };
  c.querySelector('.v41no').onclick = v41Hide; clearTimeout(V41.t); V41.t = setTimeout(v41Hide, 8000);
}
function v41Hide(){ const c = $('#v41Card'); if(c) c.hidden = true; }
function v41Sync(){
  const col = $('#v41Col'); if(!col) return; const P = PLAYER, bike = !!(P && P.cycling), boat = !!(P && P.boat), fly = !!(P && P.v16fly);
  const set = (id, on, dis, ic, en) => { const b = $('#' + id); const k = on + '|' + dis; if(b._k === k) return; b._k = k; b.classList.toggle('on', on); b.disabled = dis; b.setAttribute('aria-pressed', on); b.querySelector('.ic').innerHTML = v41Svg(ic); b.querySelector('small').textContent = en; };
  set('v41Bike', bike, boat || fly, bike ? V41_ICON.walk : V39_P.bike, bike ? 'Walk' : 'Bike');
  set('v41Boat', boat, fly, boat ? V41_ICON.leave : V39_P.sail, boat ? 'Leave boat' : 'Boat');
  set('v41Fly', fly, false, fly ? V41_ICON.chute : V39_P.balloon, fly ? 'Land' : 'Fly');
  const hide = (V32 && V32.menuOpen) || !!document.querySelector('.modal:not([hidden])') || ($('#quick') && $('#quick').classList.contains('open')) || ($('.app') && $('.app').classList.contains('immersive')) || ($('#v32Map') && !$('#v32Map').hidden) || ($('#v40Coach') && !$('#v40Coach').hidden);
  col.hidden = hide;
}
function v41Init(){
  const st = $('#stage'); if(!st || $('#v41Col')) return; const col = document.createElement('div'); col.id = 'v41Col'; col.setAttribute('aria-label', 'Đi lại');
  [['v41Bike', 'Bike', 'Đạp xe hoặc đi bộ', () => toggleBike()], ['v41Boat', 'Boat', 'Lên thuyền hoặc rời thuyền', v41Boat], ['v41Fly', 'Fly', 'Bay lên hoặc hạ cánh', () => flyToggle()]].forEach(([id, en, label, f]) => {
    const b = document.createElement('button'); b.type = 'button'; b.id = id; b.className = 'v41b'; b.setAttribute('aria-label', label); b.innerHTML = '<span class="ic"></span><small></small>'; b.querySelector('small').textContent = en;
    b.onclick = e => { e.stopPropagation(); if(b.disabled) return; try { v32Wake(); } catch(err){} f(); setTimeout(v41Sync, 80); }; col.appendChild(b); });
  st.appendChild(col); v41Sync(); setInterval(v41Sync, 250);
  // remove the duplicates from the Menu
  const mi = v32Items; v32Items = function(){ return mi().filter(it => !['Ride a Bike', 'Boat', 'Fly'].includes(it.en)); };
  const ms = v32SubItems; v32SubItems = function(k){ const L = ms(k); return k === 'games' ? L.filter(it => it.en !== 'Boat Trip') : L; };
}
