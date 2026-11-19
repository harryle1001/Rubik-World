// ================= v68m · 4/4 GIAO DIỆN: 3 quầy mới ở Tầng 3 TTTM Cầu Vồng, thẻ hàng pixel, túi đồ, nút Du lịch biển, khởi tạo =================
const V68M_KIOSK = {v68rod:['🎣', 'Cần Câu Vui', '#00897b'], v68bike:['🚲', 'Xe Đạp Gió', '#e53935'], v68boat:['⛵', 'Thuyền Du Lịch', '#1e88e5']};
const V68M_CSS = `
.v68m .v52card{width:min(720px,100%)}
.v68m h2{display:flex;align-items:center;gap:8px}
.v68tabs{display:flex;gap:8px;margin:8px 0 2px;flex-wrap:wrap}
.v68tabs button{min-height:44px;padding:0 18px;border-radius:22px;border:2px solid #e8d9b8;background:#fff;font:800 16px "Nunito",sans-serif;color:#5d4037;cursor:pointer}
.v68tabs button[aria-pressed="true"]{background:#2b1d14;color:#ffd23f;border-color:#2b1d14}
.v68grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:12px;margin-top:10px}
.v68card{display:flex;flex-direction:column;gap:6px;background:#fff;border:3px solid #2b1d14;border-radius:14px;padding:8px;box-shadow:0 4px 0 #2b1d14;position:relative}
.v68card.eq{border-color:#2fbf71;box-shadow:0 4px 0 #1f8a50}
.v68card canvas{width:100%;aspect-ratio:1.618;border-radius:9px;image-rendering:pixelated;display:block;background:#1b2244}
.v68card b{font-size:17px;line-height:1.2}
.v68card small{font-size:16px;line-height:1.3;color:#6d5a48}
.v68new{position:absolute;top:12px;left:12px;background:#ffd23f;color:#2b1d14;font:900 14px "Nunito",sans-serif;padding:2px 8px;border-radius:8px;border:2px solid #2b1d14}
.v68st{display:grid;grid-template-columns:auto 1fr auto;gap:4px 8px;align-items:center;font-size:16px}
.v68bar{height:10px;border-radius:5px;background:#efe6d6;overflow:hidden;border:1px solid #d9c9a8}
.v68bar i{display:block;height:100%;border-radius:5px}
.v68row{display:flex;align-items:center;gap:8px;margin-top:auto}
.v68pr{font:900 18px "Nunito",sans-serif;color:#2b1d14}
.v68row button{flex:1;min-height:44px;border-radius:12px;border:0;background:#2fbf71;color:#fff;font:800 16px "Nunito",sans-serif;cursor:pointer;box-shadow:0 3px 0 #1f8a50}
.v68row button.poor{background:#b0a596;box-shadow:0 3px 0 #8a8072}
.v68row button.use{background:#3d7bff;box-shadow:0 3px 0 #2a56b3}
.v68row button.on{background:#fff;color:#1f8a50;border:2px solid #2fbf71;box-shadow:none}
.v68tip{background:#fff3cd;border:2px dashed #e0b84a;border-radius:12px;padding:8px 12px;margin:8px 0 0;font-size:16px}
.v68treas{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:8px}
.v68treas div{background:#fff;border:2px solid #efe2c6;border-radius:12px;padding:8px;display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;font-size:16px}
.v68treas span{font-size:30px}
.v68treas button{min-height:44px;width:100%;border-radius:12px;border:0;background:#ff9800;color:#fff;font:800 16px "Nunito",sans-serif;cursor:pointer}
#v68mTourB{background:#4fc3f7}
#v68mTourB.on{background:#ef5350;color:#fff}
`;
// ---------- quầy trong TTTM (tầng 3) ----------
function v68mMallInit(){
  if(typeof V52WM_FLOORS === 'undefined') return;
  Object.assign(V52WM_SHOP, V68M_KIOSK);
  const F = V52WM_FLOORS[2]; F.KL = 'v68rod'; F.KR = 'v68bike'; F.n = 'Tầng 3 · Rạp phim, Ăn uống, Cần câu, Xe đạp, Thuyền';
  const k0 = v52wmKiosks; v52wmKiosks = function(f){ const K = k0.apply(this, arguments); if(f === 2 && !K.some(k => k.k === 'v68boat')) K.push({k:'v68boat', x0:280, x1:516, y0:590, y1:668}); return K; };
  const ss0 = v52wmSpots; v52wmSpots = function(f){ const S = ss0.apply(this, arguments); if(f === 2) v52wmKiosks(2).forEach(K => { if(V68M_KIOSK[K.k] && K.y1 > 900) S.push({x:(K.x0 + K.x1)/2, y:K.y0 - 26, r:62, ic:V68M_KIOSK[K.k][0], n:V68M_KIOSK[K.k][1], f:() => v68mPanel(K.k)}); }); return S; };
  const sp0 = v52wmShopPanel; v52wmShopPanel = function(k){ if(V68M_KIOSK[k]) return v68mPanel(k); return sp0.apply(this, arguments); };
  const tk0 = v52wmTalk; v52wmTalk = function(k){ return {v68rod:['Cần "Câu Là Dính" thả xuống là cá cắn liền!', 'Cần May Mắn hay gặp cá vàng, cá hiếm lắm đó.', 'Cá con thì mình thả lại cho cá lớn lên nhé.'],
    v68bike:['Xe chòi chân chậm nhất, xe đua Tia Chớp nhanh nhất. Bạn xem thanh tốc độ nhé!', 'Đạp xe nhớ đội mũ bảo hiểm và đi bên phải đường.', 'Yên gel êm giúp đạp nhanh hơn một chút đó.'],
    v68boat:['Thuyền Hoa Sen có mái che, chở được 3 bạn cùng đi.', 'Tàu Hải Âu chạy được ra tận biển khơi, có chuyến Du lịch biển tự chạy qua 5 đảo!', 'Lên thuyền luôn mặc áo phao nhé.']}[k] || tk0.apply(this, arguments); };
  const p0 = v52wmPaint; v52wmPaint = function(g){ p0.apply(this, arguments); if(V52WM.f === 2) try { v68mDecor(g); } catch(e){ console.warn('v68m decor', e); } };
  const gf0 = v52wmGoFloor; v52wmGoFloor = function(f){ const r = gf0.apply(this, arguments); if(f === 2 && !V68M.fl3){ V68M.fl3 = 1; setTimeout(() => toast('🎣🚲⛵ Tầng 3 có quầy mới: Cần câu, Xe đạp, Thuyền du lịch!'), 900); } return r; };
}
// đồ trưng bày quanh 3 quầy (vẽ 1 lần vào nền tầng)
function v68mDecor(g){
  withCtx(g, () => { ctx.imageSmoothingEnabled = false;
    // giá cần câu cạnh quầy cần câu (300..536 × 866..944)
    ctx.fillStyle = '#6d4c41'; ctx.fillRect(262, 800, 30, 140); ctx.fillStyle = '#8d6e63'; ctx.fillRect(262, 800, 30, 6);
    V68M_RODS.forEach((r, i) => { const x = 266 + i*4.4; ctx.strokeStyle = r.k === 'pretty' ? V68M_RAIN[i % 7] : r.col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 936); ctx.lineTo(x + 4 + i, 760 + i*3); ctx.stroke(); ctx.fillStyle = '#ef5350'; ctx.fillRect(x + 3 + i, 756 + i*3, 3, 3); });
    // xe trưng bày trên bục xoay cạnh quầy xe (1082..1318)
    [[1150, 846, 'v68b6'], [1250, 846, 'v68b1']].forEach(([x, y, id]) => { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 44, 10, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.ellipse(x, y, 40, 9, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(x, y); ctx.scale(2.2, 2.2); try { drawFancyBike(0, 0, ITEM[id], ['v68a_flag', 'v68a_basket'], .3, true); } catch(e){} ctx.restore(); });
    ctx.font = '800 15px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#2b1d14'; ctx.fillText('🐢 chậm nhất', 1250, 770); ctx.fillText('⚡ nhanh nhất', 1150, 770);
    // thuyền mô hình trên bể nước cạnh quầy thuyền (300..536 × 590..668)
    ctx.fillStyle = '#5d6d7e'; ctx.fillRect(276, 532, 244, 54); ctx.fillStyle = '#4fc3f7'; ctx.fillRect(282, 538, 232, 42); ctx.fillStyle = 'rgba(255,255,255,.35)'; for(let i = 0; i < 6; i++) ctx.fillRect(292 + i*38, 552 + (i % 2)*10, 20, 3);
    ctx.save(); ctx.translate(350, 574); ctx.scale(.78, .78); try { drawBoatModel(0, 0, ITEM.v68t1, [], 1); } catch(e){} ctx.restore();
    ctx.save(); ctx.translate(456, 574); ctx.scale(.66, .66); try { drawBoatModel(0, 0, ITEM.v68t2, [], 1); } catch(e){} ctx.restore();
    ctx.textAlign = 'left'; });
}
// ---------- bảng hàng ----------
function v68mStars(n){ const k = Math.max(0, Math.min(5, n)); return '<span class="v68bar"><i style="width:' + Math.round(k/5*100) + '%;background:hsl(' + Math.round(8 + k*24) + ',78%,50%)"></i></span>'; }
function v68mCard(it){
  const own = has(it.id), slot = equipSlot(it), eq = slot ? PROF && PROF.equip[slot] === it.id : own && !v68mOff(it.id), money = PROF ? PROF.money : 0;
  let st = '';
  if(it.cat === 'rod'){ const v = V68M_RODST[it.k]; st = `<div class="v68st"><span>⚡ Cắn câu</span>${v68mStars(v[0])}<b>${v[0]}</b><span>🍀 May mắn</span>${v68mStars(v[1])}<b>${v[1]}</b><span>💪 Sức dây</span>${v68mStars(v[2])}<b>${v[2]}</b><span>💎 Kho báu</span>${v68mStars(v[3])}<b>${v[3]}</b></div>`; }
  else if(it.cat === 'bike') st = `<div class="v68st"><span>⚡ Tốc độ</span>${v68mStars(it.s/V68M_SMAX*5)}<b>${it.s}</b></div>`;
  else if(it.cat === 'boat') st = `<div class="v68st"><span>⚡ Tốc độ</span>${v68mStars(it.s/V68M_SMAX*5)}<b>${it.s}</b><span>🌊 Đi xa</span>${v68mStars(it.zone)}<b>${it.zone}/5</b><span>🧑‍🤝‍🧑 Chở</span>${v68mStars(it.seats + 1)}<b>${it.seats}</b></div>`;
  const btn = own ? (it.cat === 'bacc' ? `<button type="button" data-use="${it.id}" class="${eq ? 'on' : 'use'}">${eq ? '✔ Đang gắn · Tháo' : '🔧 Gắn lên xe'}</button>` : `<button type="button" data-use="${it.id}" class="${eq ? 'on' : 'use'}">${eq ? '✔ Đang dùng' : '▶ Dùng'}</button>`)
    : `<button type="button" data-buy="${it.id}"${money < it.price ? ' class="poor"' : ''}>🛒 Mua</button>`;
  return `<div class="v68card${eq ? ' eq' : ''}"><canvas data-pv="${it.id}" width="208" height="128"></canvas><span class="v68new">MỚI</span><b>${v68mEsc(it.n)}</b><small>${v68mEsc(it.d)}</small>${st}<div class="v68row"><span class="v68pr">${own ? '✅' : '$' + it.price}</span>${btn}</div></div>`;
}
function v68mPanel(k, tab){
  if(!PROF){ try { openLogin(); } catch(e){} return; }
  const [ic, name] = V68M_KIOSK[k]; V68M.pk = k; V68M.pt = tab = tab || (k === 'v68bike' ? 'bike' : '');
  let list = k === 'v68rod' ? V68M_RODS : k === 'v68boat' ? V68M_BOATS : tab === 'acc' ? V68M_ACCS : V68M_BIKES;
  let h = `<h2>${ic} ${v68mEsc(name)}</h2><p class="v52money">💰 Bạn có <b>$${PROF.money}</b></p>`;
  if(k === 'v68bike') h += `<div class="v68tabs"><button type="button" data-tab="bike" aria-pressed="${tab === 'bike'}">🚲 Xe đạp (chậm → nhanh)</button><button type="button" data-tab="acc" aria-pressed="${tab === 'acc'}">🔔 Phụ kiện xe</button></div>`;
  h += '<div class="v68grid">' + list.map(v68mCard).join('') + '</div>';
  h += `<p class="v68tip">${k === 'v68rod' ? '🎣 Cần câu đang dùng có hiệu ứng thật ở mọi hồ câu, bến tàu và câu cá ngoài khơi. Đồ quý câu được nằm trong 🎒 Túi đồ, bán lấy tiền.' : k === 'v68boat' ? '⛵ Ra bến, bấm Lên thuyền rồi lái ra biển. Khi ở ngoài biển bấm 🧭 để thuyền tự chạy hành trình du lịch.' : '🚲 Bấm Đạp xe ngoài phố để chạy thử: mỗi xe có tốc độ khác nhau thật sự. Phụ kiện mua rồi tự gắn lên xe, bấm để tháo/gắn.'}</p>`;
  const p = v52wsPanel(h, 'v52shop v68m'); if(!p) return;
  p.querySelectorAll('canvas[data-pv]').forEach(cv => { try { drawItemPreview(cv, ITEM[cv.dataset.pv]); } catch(e){ console.warn('v68m pv', e); } });
  p.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => v68mPanel(k, b.dataset.tab));
  p.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { v68mBuy(b.dataset.buy); v68mPanel(k, V68M.pt); });
  p.querySelectorAll('[data-use]').forEach(b => b.onclick = () => { v68mUse(b.dataset.use); v68mPanel(k, V68M.pt); });
}
// ---------- túi đồ: đồ quý câu được + đồ mới đã mua ----------
function v68mBagHtml(){
  if(!PROF) return ''; const o = v68mDb(), ids = Object.keys(o.treas).filter(k => o.treas[k] > 0), gear = [...V68M_RODS, ...V68M_BIKES, ...V68M_BOATS].filter(it => has(it.id));
  if(!ids.length && !gear.length) return '';
  let h = '<div class="v68m">';
  if(gear.length) h += '<p><b>🎣🚲⛵ Đồ dùng mua ở TTTM</b></p><div class="v68treas">' + gear.map(it => { const eq = PROF.equip[equipSlot(it)] === it.id; return `<div><span>${it.cat === 'rod' ? '🎣' : it.cat === 'bike' ? '🚲' : '⛵'}</span><b>${v68mEsc(it.n)}</b><button type="button" data-v68use="${it.id}" style="background:${eq ? '#2fbf71' : '#3d7bff'}">${eq ? '✔ Đang dùng' : '▶ Dùng'}</button></div>`; }).join('') + '</div>';
  if(ids.length) h += '<p><b>💎 Đồ quý câu được</b></p><div class="v68treas">' + ids.map(id => { const x = V68M_TREAS.find(t => t.id === id); if(!x) return ''; return `<div><span>${x.ic}</span><b>${v68mEsc(x.n)} × ${o.treas[id]}</b><button type="button" data-v68sell="${id}">${x.open ? '🔓 Mở rương' : '💰 Bán $' + x.sell}</button></div>`; }).join('') + '</div>';
  return h + '</div>';
}
function v68mBagWire(p, again){ if(!p) return; p.querySelectorAll('[data-v68use]').forEach(b => b.onclick = () => { v68mUse(b.dataset.v68use); again(); });
  p.querySelectorAll('[data-v68sell]').forEach(b => b.onclick = () => { v68mTreasSell(b.dataset.v68sell); again(); }); }
function v68mBagInit(){
  if(typeof v52wBagPanel === 'function'){ const bp = v52wBagPanel; v52wBagPanel = function(){ const r = bp.apply(this, arguments); try { const card = document.querySelector('#v52wsPan .v52card'), h = v68mBagHtml(); if(card && h){ const em = card.querySelector('.v52money'); if(em && /trống/.test(em.textContent)) em.remove(); const d = document.createElement('div'); d.innerHTML = h; card.appendChild(d); v68mBagWire(d, () => v52wBagPanel()); } } catch(e){ console.warn('v68m bag', e); } return r; }; }
  if(typeof openProfile === 'function'){ const op = openProfile; openProfile = function(){ const r = op.apply(this, arguments); try { const inv = document.getElementById('pfInv'), h = v68mBagHtml(); if(inv && h){ const d = document.createElement('div'); d.className = 'v52pf'; d.innerHTML = h; inv.appendChild(d); v68mBagWire(d, () => { try { hideModal(); } catch(e){} openProfile(); }); } } catch(e){} return r; }; }
}
// ---------- nút 🧭 Du lịch biển (gắn vào hàng nút biển v53s) ----------
function v68mTourUi(){
  const box = document.getElementById('v53sAct'); if(!box) return; let b = V68M.btn;
  if(!b || !b.isConnected){ b = V68M.btn = document.createElement('button'); b.type = 'button'; b.id = 'v68mTourB'; b.hidden = true; const bk = box.querySelector('#v53sBookB'); box.insertBefore(b, bk || null);
    b.onclick = () => { if(V68M.tour) v68mTourEnd('⏹ Đã dừng hành trình. Bạn tự lái tiếp nhé.'); else v68mTourStart(); v68mTourUi(); }; }
  const c = typeof v53sMe === 'function' ? v53sMe() : null, it = v68mBoatItem(c), show = !!(it && v68mAtSea(c));
  if(b.hidden === show) b.hidden = !show; if(!show) return;
  const T = V68M.tour, txt = T ? `⏹ Dừng · ${T.pts[Math.min(T.i, T.pts.length - 1)].n}` : `🧭 ${it.v68b === 'far' ? 'Du lịch biển' : 'Dạo vịnh'}`;
  if(b.textContent !== txt) b.textContent = txt; b.classList.toggle('on', !!T);
}
// ---------- khởi tạo ----------
function v68mInit(){
  if(!document.getElementById('v68mCss')){ const s = document.createElement('style'); s.id = 'v68mCss'; s.textContent = V68M_CSS; document.head.appendChild(s); }
  const step = (n, f) => { try { f(); } catch(e){ console.warn('v68m ' + n, e); } };
  step('mall', v68mMallInit); step('fish', v68mFishInit); step('bike', v68mBikeInit); step('boat', v68mBoatInit); step('bag', v68mBagInit);
  setInterval(() => { try { v68mTourUi(); } catch(e){} }, 300);
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v68m = {V68M, v68mPanel, v68mBuy, v68mUse, v68mTourStart, v68mRod};
}
