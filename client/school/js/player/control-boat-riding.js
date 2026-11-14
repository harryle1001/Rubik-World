// ================= EXT: CONTROLLED CHARACTER, BOAT & RIDING =================
function ensureControlled(){
  let c = agents.find(a => a.controlled); if(c) return c;
  if(PLAYER && PLAYER.visible){ select(PLAYER, false); setControl(true); return PLAYER; }
  let a = selected && selected.visible && !selected.inSub ? selected : students.find(s => s.visible && !s.inSub && !s.flying && !down(s));
  if(!a){ toast('Chưa có bạn nào ở trường để điều khiển. Hãy đợi tới giờ học.'); return null; }
  select(a, false); setControl(true); return agents.find(x => x.controlled) || null;
}
function boardBoat(){
  const c = ensureControlled(); if(!c) return;
  if(c.boat){ leaveBoat(c); return; }
  if(c.mount) dismount(c, true);
  const own = c.isPlayer && PROF && PROF.equip.boat ? ITEM[PROF.equip.boat] : null;
  c.boat = {h:0, v:0, kind:own ? own.col : ['#ef4b4b','#3d7bff','#ffd23f','#2fbf71'][c.idx % 4], item:own || {zone:1, col:'#ff8a2b', s:220, n:'Thuyền của trường'}};
  if(c.isPlayer && !own) toast('Bạn đang dùng thuyền kayak của trường (chỉ đi vùng ven bờ). Mua thuyền ở Bến du thuyền để ra khơi xa!');
  c.x = Math.max(30, Math.min(W - 30, c.x)); c.y = Math.max(c.y, 930); if(onPier(c.x, c.y)) c.x += 70;
  followCam = true; if(cam.z < .7) cam.z = .9;
  log('info', `${c.name} lên thuyền máy. Lái bằng phím mũi tên / WASD: lên là tăng tốc, trái phải để bẻ lái.`);
  toast(`${c.name} đã lên thuyền! Lên = chạy tới, trái/phải = bẻ lái, xuống = lùi`); updateExtButtons(); updatePanel();
}
function leaveBoat(c){ if(!c.boat) return; c.boat = null; c.y = 850; if(onPier(c.x, c.y)) c.x += 60; log('info', `${c.name} cập bờ và rời thuyền.`); updateExtButtons(); updatePanel(); }
function boatMove(c, dt){
  const b = c.boat, thr = (keys.up ? 1 : 0) - (keys.down ? .6 : 0), turn = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  b.v += thr*260*dt; b.v *= Math.pow(.55, dt); b.v = Math.max(-90, Math.min(b.item ? b.item.s : 330, b.v));
  b.h += turn*dt*(1.2 + Math.min(1.6, Math.abs(b.v)/140)) * (b.v < 0 ? -1 : 1);
  const nx = c.x + Math.cos(b.h)*b.v*dt, ny = c.y + Math.sin(b.h)*b.v*dt*.75;
  if(nx > 20 && nx < W - 20 && ny > 905 && ny < H - 22 && !onPier(nx, ny) && !onIsland(nx, ny) && boatZoneOK(c, ny)){ c.x = nx; c.y = ny; } else b.v *= -.3;
  c.dir = Math.cos(b.h) < 0 ? -1 : 1; c.moving = Math.abs(b.v) > 5;
  if(c.y > 1500) mprog('boat');
  b.trail = b.trail || []; if(Math.abs(b.v) > 40 && Math.random() < .5) b.trail.push({x:c.x - Math.cos(b.h)*24, y:c.y - Math.sin(b.h)*18, t:1.2});
  b.trail.forEach(p => p.t -= dt); b.trail = b.trail.filter(p => p.t > 0);
}
function drawBoatPerson(a){
  const b = a.boat, x = Math.round(a.x), y = Math.round(a.y);
  (b.trail || []).forEach(p => { ctx.globalAlpha = p.t*.5; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 10*(1.6 - p.t*.5), 4, 0, 0, Math.PI*2); ctx.fill(); });
  ctx.globalAlpha = 1;
  const bob = Math.sin(realT*3 + a.idx)*1.5;
  ctx.save(); ctx.translate(x, y + bob); ctx.scale(Math.cos(b.h) < 0 ? -1 : 1, 1);
  const tilt = Math.sin(b.h)*.25*(Math.cos(b.h) < 0 ? -1 : 1); ctx.rotate(tilt);
  drawBoatModel(0, 0, b.item, a.isPlayer && PROF ? SHOP.filter(i => i.cat === 'bgear' && has(i.id)).map(i => i.id) : [], 1);
  drawBoatRider(a, b);
  ctx.restore();
  if(Math.abs(b.v) > 60){ ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(x + (Math.cos(b.h) < 0 ? -34 : 26), y - 2 + bob, 6, 3); }
}
function mount(kind){
  const c = ensureControlled(); if(!c) return;
  if(c.boat){ toast('Hãy cập bờ (rời thuyền) trước rồi mới cưỡi thú.'); return; }
  if(c.y > 880){ c.y = 860; }
  c.mount = kind; c.bike = false; followCam = true; mprog('ride');
  log('info', `${c.name} leo lên lưng ${ANI[kind].name.toLowerCase()}. Dùng phím mũi tên / WASD để cưỡi đi khắp nơi.`);
  toast(`${c.name} đang cưỡi ${ANI[kind].name.toLowerCase()}! Bấm "Xuống" để xuống.`); updateExtButtons(); updatePanel(); hideModal();
}
function dismount(c, quiet){ if(!c || !c.mount) return; const k = c.mount; c.mount = null; if(!quiet) log('info', `${c.name} xuống khỏi lưng ${ANI[k].name.toLowerCase()}.`); updateExtButtons(); updatePanel(); }
function drawMountPerson(a){
  const A = ANI[a.mount], x = Math.round(a.x), y = Math.round(a.y), bounce = a.moving ? Math.abs(Math.sin(a.walk*.8))*3 : 0;
  drawAnimal(a.mount, x, y, a.dir, a.walk*.9, a.moving);
  ctx.save(); ctx.translate(x - a.dir*2, y + A.ride - bounce); const was = a.moving; a.moving = false; drawBody(a, false); a.moving = was; ctx.restore();
}
function extUncontrol(a){ if(a.boat) leaveBoat(a); if(a.mount) dismount(a); }
function updateExtButtons(){
  const c = agents.find(a => a.controlled), bb = $('#boatBtn'), db = $('#dismountBtn');
  if(bb) bb.textContent = c && c.boat ? 'Rời thuyền' : 'Lên thuyền';
  const hb = $('#hBoat'); if(hb) hb.textContent = c && c.boat ? 'Cập bờ' : 'Lên thuyền';
  const hf = $('#hFish'); if(hf) hf.hidden = !(c && c.boat);
  const hk = $('#hBike'); if(hk) hk.textContent = PLAYER && PLAYER.cycling ? 'Xuống xe' : 'Đạp xe';
  if(db) db.hidden = !(c && c.mount);
  const fd = $('#fdismount'); if(fd) fd.hidden = !(c && c.mount);
}

