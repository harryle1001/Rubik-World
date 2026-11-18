// ================= v54q · ROBO THÁM TỬ (2/3 · lộ trình): khu → cửa/toà nhà → mini game & cửa hàng → phương tiện → giờ & mùa → nút HUD =================
// Lộ trình dựng lại mỗi lần chạy từ dữ liệu sống của game (mapPlaces, V46.Z, DOORS, GAMES…) nên khu mới thêm sau này tự được đi qua.
function v54qPlaces(){
  const out = [], seen = new Set();
  try { (mapPlaces() || []).forEach(p => { const k = p.k || p.name; if(seen.has(k)) return; seen.add(k); out.push({k, name:p.name, ic:p.ic, x:p.x, y:p.y, door:p.door, raw:p}); }); } catch(e){ v54qIssue('high', 'nhãn', 'mapPlaces() lỗi', {desc:e.message}); }
  try { V46.Z.forEach(z => { if(z.flip || seen.has(z.id)) return; seen.add(z.id); out.push({k:z.id, name:(R[z.id] && R[z.id].name) || z.id, ic:'', x:(z.nr.x0 + z.nr.x1)/2, y:(z.nr.y0 + z.nr.y1)/2, zoneOnly:true}); }); } catch(e){}
  return out;
}
function v54qBuild(){
  const S = []; const add = (k, name, run) => S.push({k, name, run});
  add('map', '🗺 Kiểm tra nhãn bản đồ & khu đè nhau', v54qMapCheck);
  add('hud', '🖲 Quét giao diện chính', async () => { if(v54qScan('Màn hình chính')) await v54qSleep(900); });
  v54qPlaces().forEach(p => add('place', `${p.ic || '📍'} ${p.name}`, () => v54qVisit(p)));
  let D = []; try { D = DOORS(); } catch(e){ v54qIssue('high', 'mở', 'DOORS() lỗi', {desc:e.message}); }
  const dseen = new Set(); D.forEach(d => { const k = d.n + '|' + Math.round(d.x/40); if(dseen.has(k)) return; dseen.add(k); add('door', '🚪 ' + d.n, () => v54qDoor(d)); });
  v54qGames().forEach(g => add('game', g.n, () => v54qGame(g)));
  add('veh', '🚲 Xe đạp', v54qBike); add('veh', '⛵ Thuyền', v54qBoat); add('veh', '🎈 Khinh khí cầu', v54qBalloon);
  add('veh', '✈️ Máy bay ở sân bay', v54qPlane); add('veh', '🚒 Xe cứu hoả', () => v54qCar('fire')); add('veh', '🚓 Xe cảnh sát', () => v54qCar('police'));
  add('time', '🌗 Ngày / đêm', v54qTimes); add('time', '🍂 Bốn mùa', v54qSeasons);
  add('hud', '🖲 Quét giao diện chính lần 2 (nút tạo muộn)', async () => { v54qFree(); try { const G = v46Gate(); v54qTeleNew(G[0], G[1] + 60); } catch(e){} await v54qSleep(600); if(v54qScan('Màn hình chính')) await v54qSleep(900); });
  add('hud', '👆 Nút trên màn hình có phản hồi?', v54qButtons);
  return S;
}

// ---------- bản đồ: nhãn undefined / thiếu biểu tượng, khu đè nhau ----------
async function v54qMapCheck(){
  let P = []; try { P = mapPlaces() || []; } catch(e){}
  P.forEach(p => {
    const bad = !p.name || /undefined|null|NaN/.test(String(p.name)) || /undefined|null/.test(String(p.desc || ''));
    if(bad) v54qIssue('mid', 'nhãn', `Nhãn bản đồ hỏng: “${p.name}” (${p.k})`, {desc:JSON.stringify({k:p.k, name:p.name, ic:p.ic, desc:p.desc}).slice(0, 200), key:'nhãn|' + p.k, noShot:true});
    if(!p.ic || /undefined/.test(String(p.ic))) v54qIssue('low', 'nhãn', `Thiếu biểu tượng trên bản đồ: “${p.name}”`, {desc:'Trường ic của mapPlaces trống.', key:'ic|' + p.k, noShot:true});
    if(!isFinite(p.x) || !isFinite(p.y)) v54qIssue('mid', 'nan', `Điểm bản đồ có toạ độ NaN: “${p.name}”`, {key:'mpnan|' + p.k, noShot:true});
  });
  for(let i = 0; i < P.length; i++) for(let j = i + 1; j < P.length; j++){ const a = P[i], b = P[j];
    if(a.k !== b.k && Math.hypot(a.x - b.x, a.y - b.y) < 60) v54qIssue('low', 'nhãn', `Hai nhãn bản đồ chồng lên nhau: “${a.name}” & “${b.name}”`, {desc:`Cách nhau ${Math.round(Math.hypot(a.x - b.x, a.y - b.y))}px.`, key:'trùng|' + a.k + b.k, noShot:true}); }
  const Z = V46.Z.filter(z => !z.flip);
  for(let i = 0; i < Z.length; i++) for(let j = i + 1; j < Z.length; j++){ const a = Z[i].nr, b = Z[j].nr;
    const ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
    if(ix > 8 && iy > 8) v54qIssue(ix*iy > 20000 ? 'mid' : 'low', 'khu', `Khu “${Z[i].id}” đè lên khu “${Z[j].id}”`, {desc:`Vùng chồng ${Math.round(ix)}×${Math.round(iy)}px (toạ độ đảo).`, key:'khu|' + Z[i].id + Z[j].id,
      where:{x:Math.round((Math.max(a.x0, b.x0) + Math.min(a.x1, b.x1))/2), y:Math.round((Math.max(a.y0, b.y0) + Math.min(a.y1, b.y1))/2)}, noShot:true}); }
  // khu thêm riêng (sân bay, trường tin học, trạm cứu hoả…) so với khu đảo
  const ext = [];
  try { const C = v51pC(), A = V51P_AP; ext.push(['Sân bay', {x0:C[0] + A.rx0, x1:C[0] + A.rx1, y0:C[1] + 4600, y1:C[1] + 5080}]); } catch(e){}
  try { const G = v51tGeo(); ext.push(['Trường tin học', {x0:G.x0, x1:G.x1, y0:G.y0, y1:G.y1}]); } catch(e){}
  try { v53cIds().forEach(id => { const G = v53cGeo(id); ext.push(['v53c ' + id, {x0:G.x0, x1:G.x1, y0:G.y0, y1:G.y1}]); }); } catch(e){}
  ext.forEach(([n, a]) => { if(![a.x0, a.x1, a.y0, a.y1].every(isFinite)) return; Z.forEach(z => { const b = z.nr, ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
    if(ix > 20 && iy > 20) v54qIssue('mid', 'khu', `“${n}” đè lên khu “${z.id}”`, {desc:`Vùng chồng ${Math.round(ix)}×${Math.round(iy)}px.`, key:'khu|' + n + z.id, where:{x:Math.round(a.x0 + ix/2), y:Math.round(a.y0 + iy/2)}, noShot:true}); }); });
}

// ---------- đi tới một khu: đứng ở nút đường gần nhất rồi tự đi bộ vào ----------
async function v54qVisit(p){
  if(!isFinite(p.x) || !isFinite(p.y)) return;
  let s = [p.x, p.y + 220]; try { const q = V46R.nodes[v46Nearest(p.x, p.y)]; if(q) s = q; } catch(e){}
  const tgt = p.door && isFinite(p.door[0]) ? p.door : v46ToOld(p.x, p.y), tn = v46ToNew(tgt[0], tgt[1]);
  v54qTeleNew(s[0], s[1]); await v54qSleep(300);
  const d0 = v54qD(v46Pos(PLAYER), tn);
  if(d0 > 30) await v54qWalk(tgt, p.name, d0);
  v54qTele(tgt[0], tgt[1] + 4); await v54qSleep(500);
}
async function v54qWalk(tgt, name, d0){
  const P = PLAYER;
  try { const lk = typeof LOCKS !== 'undefined' && PROF && LOCKS.find(q => inside(q.r, tgt[0], tgt[1]) && PROF.level < q.lvl); if(lk){ V54Q.locked = (V54Q.locked || 0) + 1; return; } } catch(e){} // khu khoá theo Level: đúng thiết kế V54Q.watch = true; V54Q.last = null;
  try { v32Nav(tgt[0], tgt[1], name, true); } catch(e){ v54qIssue('high', 'kẹt', `Lỗi khi tự đi tới “${name}”`, {desc:e.message, stack:e.stack}); V54Q.watch = false; return; }
  P.speed = Math.max(P.speed || 95, 240);
  const T = Math.min(9000, 1600 + d0/240*1000*1.6); let t = 0, still = 0, lp = v46Pos(P), res = 'timeout';
  while(t < T && V54Q.on){
    await v54qSleep(200); t += 200; if(!V32.nav){ res = 'ok'; break; }
    const q = v46Pos(P); if(v54qD(q, lp) < 2) still += 200; else still = 0; lp = q;
    if(still >= 2000){ res = 'stuck'; break; }
  }
  V54Q.watch = false;
  const left = Math.round(v54qD(v46Pos(P), v46ToNew(tgt[0], tgt[1])));
  if(res === 'stuck' && left > 60) v54qIssue('mid', 'kẹt', `Nhân vật bị kẹt khi đi tới “${name}”`, {desc:`Đứng yên 2 giây, còn cách đích ${left}px (đường dài ${Math.round(d0)}px).`, key:'kẹt|' + name, repro:`Bấm “Tự đi tới…” → ${name} từ nút đường gần nhất.`});
  else if(res === 'timeout' && left > 120) v54qIssue('low', 'kẹt', `Đi mãi không tới “${name}”`, {desc:`Sau ${Math.round(T/1000)} giây còn cách ${left}px.`, key:'xa|' + name, repro:`Bấm “Tự đi tới…” → ${name}.`});
  try { cancelAuto(); V32.nav = null; V32.walk = null; GUIDE = null; } catch(e){}
}

// ---------- vào cửa / toà nhà ----------
async function v54qDoor(d){
  if(!isFinite(d.x) || !isFinite(d.y)){ v54qIssue('mid', 'nan', `Cửa “${d.n}” có toạ độ NaN`, {noShot:true}); return; }
  v54qTele(d.x, d.y); await v54qSleep(150); try { doorUpdate(); } catch(e){}
  const sky = typeof SKY_OBJ !== 'undefined' && Object.values(SKY_OBJ).some(o => Math.abs(o.x - d.x) < 2 && Math.abs(o.y + 20 - d.y) < 2);
  if(sky) return; // cửa trên bầu trời chỉ dùng khi đang bay khinh khí cầu
  if(!NEAR_DOOR){ v54qIssue('low', 'mở', `Đứng ngay cửa “${d.n}” mà không hiện nút Vào`, {key:'cửa|' + d.n}); return; }
  const base = v54qSig(), tt = V54Q.toastN;
  try { if(!doorEnter()) d.f(); } catch(e){ v54qIssue('high', 'mở', `Vào “${d.n}” bị lỗi JS`, {desc:e.message, stack:e.stack}); return; }
  await v54qSleep(900);
  const now = v54qSig(), t2 = V54Q.toastN;
  if(now === base){ if(t2 === tt) v54qIssue('mid', 'mở', `Bấm vào “${d.n}” không mở gì`, {desc:'Không có cửa sổ, mini game hay thông báo nào hiện ra.', key:'mở|' + d.n}); try { v54qTele(d.x, d.y + 40); } catch(e){} return; }
  if(v54qScan(d.n.split(' · ')[0])) await v54qSleep(900); // chờ chụp ảnh lỗi rồi mới đóng
  await v54qClose(base, d.n);
  try { if(PLAYER && !PLAYER.visible) v54qIssue('mid', 'đóng', `Thoát “${d.n}” xong nhân vật biến mất`, {key:'vis|' + d.n}); } catch(e){}
}

// ---------- mini game & cửa hàng mở bằng hàm (v45…v53) ----------
function v54qGames(){
  const L = []; const g = (n, f, at) => L.push({n, f, at});
  try { Object.keys(GAMES).forEach(id => g('🕹 ' + (GAMES[id].title || id), () => openArcade(id, 0))); } catch(e){}
  g('🏟 Đấu trường online v45', () => v45Open());
  g('🛍 Cửa hàng', () => openShop()); g('🏠 Nhà tôi', () => $('#hHome').click()); g('🛒 Chợ', () => $('#hMarket').click());
  g('🗺 Bản đồ lớn', () => openBigMap());
  g('🏰 Bản đồ nhà v48', () => v48mOpen());
  g('🪄 Học viện phép thuật', () => v50Open());
  try { Object.keys(V50_GAMES).forEach(id => g('🪄 ' + (V50_GAMES[id].vi || V50_GAMES[id].name || id), () => v50GOpen(id), async () => { v50Open(); await v54qSleep(600); })); } catch(e){}
  g('🧙 Phố phép thuật', () => v51aOpen());
  g('💻 Trường tin học', () => v51tOpen());
  try { Object.keys(V51T_GAMES).forEach(id => g('💻 Bài ' + (V51T_GAMES[id].vi || V51T_GAMES[id].name || id), () => v51tGOpen(id, 1), async () => { v51tOpen(); await v54qSleep(600); })); } catch(e){}
  g('✈️ Hangar máy bay', () => v51pPanel('hangar'));
  g('🏬 TTTM', () => v52wMallOpen()); g('💻 Laptop', () => v52wDevice('laptop'));
  g('🍳 Bếp nhà', () => v52lPanel('home', 'eat'));
  try { const r = V52L_REC && (Array.isArray(V52L_REC) ? V52L_REC[0] : Object.values(V52L_REC)[0]); if(r) g('🍳 Nấu ăn: ' + (r.vi || r.n || r.id), () => v52lcOpen(r.id, 'home')); } catch(e){}
  g('🚁 Drone', () => v52ldOpen());
  g('🚒 Trạm cứu hoả', () => v53cOpen('fire')); g('🚓 Đồn cảnh sát', () => v53cOpen('police'));
  try { Object.keys(V53C_MGS).forEach(k => g('🧯 Cứu hoả: ' + V53C_MGS[k].vi, () => v53cMgOpen(k))); } catch(e){}
  g('📖 Sổ cá biển', () => v53sBookOpen()); g('🏴‍☠️ Tàu hải tặc', () => v53sPirOpen());
  return L;
}
async function v54qGame(G){
  try { v54qTele(...(v46ToOld(...v46Gate()))); } catch(e){} await v54qSleep(150);
  const B0 = v54qSig();
  try { if(G.at) await G.at(); } catch(e){}
  const base = v54qSig(), tt = V54Q.toastN;
  try { G.f(); } catch(e){ v54qIssue('high', 'mở', `Mở “${G.n}” bị lỗi JS`, {desc:e.message, stack:e.stack, file:v54qLoc(e.stack), key:'mởjs|' + G.n}); return; }
  await v54qSleep(1100);
  const now = v54qSig(), t2 = V54Q.toastN;
  if(now === base){ if(t2 === tt) v54qIssue('low', 'mở', `“${G.n}” không mở ra (không cửa sổ, không thông báo)`, {key:'mở|' + G.n}); return; }
  if(v54qScan(G.n.replace(/^\S+\s/, ''))) await v54qSleep(900); v54qStepFps(G.n);
  await v54qClose(base, G.n); if(G.at) await v54qClose(B0, G.n + ' (khung ngoài)');
}

// ---------- phương tiện ----------
async function v54qDrive(ms, keysSeq){
  V54Q.watch = true; V54Q.last = null;
  for(const k of keysSeq){ try { keys[k] = true; } catch(e){} await v54qSleep(ms); try { keys[k] = false; } catch(e){} }
  V54Q.watch = false;
}
async function v54qBike(){
  const P = PLAYER; if(!PROF) return; const had = PROF.equip.bike; if(!had) PROF.equip.bike = 'bike1';
  try { const G = v46Gate(); v54qTeleNew(G[0], G[1] + 120); await v54qSleep(200); toggleBike(); await v54qSleep(200);
    if(!P.cycling){ v54qIssue('mid', 'mở', 'Không lên được xe đạp', {key:'bike'}); return; }
    await v54qDrive(1100, ['right', 'down', 'left', 'up']);
    // ra bờ biển: không được chạy xuống nước, không được nhảy về bãi cũ (lỗi đã sửa ở v44-ui.js:60)
    const L = V46L, a = 2.2, rr = L.ISLAND - 260; v54qTeleNew(L.CX + Math.cos(a)*rr, L.CY + Math.sin(a)*rr); await v54qSleep(200); if(!P.cycling) toggleBike();
    const kx = Math.cos(a) > 0 ? 'right' : 'left', ky = Math.sin(a) > 0 ? 'down' : 'up'; await v54qDrive(1600, [kx, ky]);
    const q = v46Pos(P), r = Math.hypot(q[0] - L.CX, q[1] - L.CY);
    if(r > L.ISLAND + 120 && !P.boat) v54qIssue('mid', 'nhảy', 'Xe đạp chạy được xuống biển', {desc:`Cách tâm đảo ${Math.round(r)}px (bờ ${L.ISLAND}).`, key:'bikesea'});
  } finally { try { if(P.cycling) toggleBike(); } catch(e){} if(!had) PROF.equip.bike = had; }
}
async function v54qBoat(){
  const P = PLAYER; let pl = null; try { pl = (mapPlaces() || []).find(p => /harbor|bến/i.test(p.k + ' ' + p.name)); } catch(e){}
  try { const h = V46L.harbor.src; v54qTele(h[0] + h[2]/2, h[1] + h[3] - 40); } catch(e){ if(pl) v54qTeleNew(pl.x, pl.y); }
  await v54qSleep(250); const had = PROF && PROF.equip.boat; if(PROF && !had) PROF.equip.boat = 'boat1';
  try { boardBoat(); await v54qSleep(500);
    if(!P.boat) v54qIssue('low', 'mở', 'Đứng ở bến tàu mà không lên được thuyền', {desc:'boardBoat() không đặt PLAYER.boat.', key:'boat'});
    else await v54qDrive(900, ['down', 'right', 'left']);
  } finally { try { if(P.boat) leaveBoat(P); } catch(e){} if(PROF && !had) PROF.equip.boat = had; }
}
async function v54qBalloon(){
  const P = PLAYER; try { const b = R.bpad; v54qTele(b.x + b.w/2, b.y + b.h/2); } catch(e){}
  await v54qSleep(250);
  try { flyToggle(); await v54qSleep(1600); if(!P.v16fly && !(typeof openModal !== 'undefined' && openModal)) v54qIssue('low', 'mở', 'Đứng ở bãi khinh khí cầu mà không bay được', {key:'balloon'}); v54qScan('Khinh khí cầu'); }
  finally { try { if(P.v16fly) flyLand(); } catch(e){} try { hideModal(); } catch(e){} }
}
async function v54qPlane(){
  try { const C = v51pC(), A = V51P_AP; v54qTeleNew(C[0] + (A.rx0 + A.rx1)/2, C[1] + 4840); } catch(e){ v54qIssue('mid', 'mở', 'Không tìm được vị trí sân bay', {desc:e.message}); return; }
  await v54qSleep(300);
  if(!v51pNearAirport()) v54qIssue('mid', 'mở', 'Đứng giữa sân bay mà game báo chưa ở sân bay', {key:'apnear'});
  let ok = false; try { ok = v51pBoard(); } catch(e){ v54qIssue('high', 'mở', 'Lên máy bay bị lỗi JS', {desc:e.message, stack:e.stack}); }
  if(!ok && !V51P.on){ v54qIssue('low', 'mở', 'Không lên được máy bay ở sân bay', {desc:'Có thể do khoá level/chưa mua máy bay.', key:'plane'}); return; }
  await v54qSleep(2200); v54qScan('Lái máy bay'); v54qStepFps('Lái máy bay');
  try { v51pExit(true); } catch(e){} await v54qSleep(300);
  if(V51P.on) v54qIssue('high', 'đóng', 'Không thoát được máy bay', {key:'planeexit'});
}
async function v54qCar(id){
  try { const G = v53cGeo(id); v54qTeleNew(G.park[0], G.park[1] + 60); } catch(e){}
  await v54qSleep(250);
  let ok = false; try { ok = v53cDrive(id); } catch(e){ v54qIssue('high', 'mở', `Lái xe ${id} bị lỗi JS`, {desc:e.message, stack:e.stack}); }
  if(!ok){ v54qIssue('low', 'mở', `Không lái được xe ${id === 'fire' ? 'cứu hoả' : 'cảnh sát'}`, {key:'car' + id}); return; }
  try { V53C.k.up = true; } catch(e){} await v54qSleep(1400); try { V53C.k.up = false; } catch(e){}
  v54qScan(id === 'fire' ? 'Lái xe cứu hoả' : 'Lái xe cảnh sát'); v54qStepFps('Lái xe ' + id);
  try { v53cExit(true); } catch(e){} await v54qSleep(300);
  try { hideModal(); } catch(e){}
  if(V53C.mode === 'drive') v54qIssue('high', 'đóng', `Không xuống được xe ${id}`, {key:'carexit' + id});
}

// ---------- giờ ngày/đêm và mùa ----------
async function v54qTimes(){
  try { const G = v46Gate(); v54qTeleNew(G[0], G[1] + 80); } catch(e){}
  const c0 = clock;
  for(const [id, , m, vi] of V25_TIMES){ const b = document.getElementById(id); try { if(b) b.click(); else clock = m; } catch(e){} await v54qSleep(1300); V54Q.cur = '🌗 ' + vi; v54qStepFps('Giờ ' + vi); }
  try { clock = c0; } catch(e){}
}
async function v54qSeasons(){
  const s0 = season;
  for(const s of ['xuan', 'ha', 'thu', 'dong']){ try { setSeason(s); } catch(e){ v54qIssue('high', 'js', 'Đổi mùa ' + s + ' bị lỗi', {desc:e.message, stack:e.stack}); } await v54qSleep(1300); v54qStepFps('Mùa ' + s); }
  try { setSeason(s0); } catch(e){}
}

// ---------- nút trên màn hình có phản hồi không ----------
async function v54qButtons(){
  const skip = /đăng xuất|xoá|xóa|reset|bán|thoát game|online|robo|chủ game/i;
  const L = [...document.querySelectorAll('#quick button, .mobctl, #hud button, .v37top button, .topHud button')].filter(b => v54qVis(b) && !b.closest('#v54qPanel') && !skip.test(b.textContent + ' ' + (b.title || '') + ' ' + (b.getAttribute('aria-label') || '')));
  const uniq = [...new Set(L)].slice(0, 40);
  for(const b of uniq){
    if(!V54Q.on) break; if(!v54qVis(b)) continue; const name = (b.textContent || b.getAttribute('aria-label') || b.title || b.id).trim().slice(0, 30);
    const base = v54qSig(); let mut = 0; const mo = new MutationObserver(r => { mut += r.length; });
    mo.observe(document.body, {subtree:true, childList:true, attributes:true, characterData:true, attributeFilter:['hidden', 'class', 'style', 'aria-pressed', 'aria-expanded']});
    const ev = {k:'', P:PLAYER ? [PLAYER.x, PLAYER.y, PLAYER.cycling, PLAYER.boat] + '' : ''};
    try { b.click(); } catch(e){ v54qIssue('high', 'nút', `Bấm nút “${name}” bị lỗi JS`, {desc:e.message}); }
    await v54qSleep(450); mo.disconnect();
    const same = v54qSig() === base && !mut && (PLAYER ? [PLAYER.x, PLAYER.y, PLAYER.cycling, PLAYER.boat] + '' : '') === ev.P;
    if(same) v54qIssue('mid', 'nút', `Nút “${name}” bấm không phản hồi`, {desc:'Không có thay đổi giao diện nào sau 0,45 giây.', key:'nút|' + name});
    if(v54qSig() !== base){ if(v54qScan('Nút ' + name)) await v54qSleep(900); await v54qClose(base, 'Nút ' + name); }
    v54qFree();
  }
}
