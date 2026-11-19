// ================= v66t · CÂY THẦN KỲ 1/4: lõi — vị trí, hình học tỷ lệ vàng, lưu, va chạm, đường, bản đồ, móc vào game =================
// Cây khổng lồ trên bãi cỏ phía Bắc đảo (giữa vòng đường 2 và 3), điểm nhấn đẹp nhất bản đồ. Mọi tên toàn cục có tiền tố v66t / V66T.
// Toạ độ: tâm gốc cây = tâm khu (V46L.zones.v66t, so với tâm đảo). Người chơi ở ngoài khu → toạ độ thô PLAYER.x = V46E + x.
// Vẽ: nền quảng trường + rễ nướng vào ô nền (bọc v46Paint); thân + tán = sprite nướng sẵn nửa độ phân giải (1 điểm = 2px thế giới),
// cache theo mùa, chỉ vẽ khi trong khung nhìn, xếp theo y với người đi trên đảo (vẽ chen giữa lượt v46DrawRaw).
const V66T_PHI = 1.618033988749895;
const V66T_CW = 1120;                                   // tán rộng 1120px thế giới
const V66T_RP = Math.round(V66T_CW/V66T_PHI/2);         // quảng trường: đường kính = tán/φ → bán kính 346
const V66T_DEF = [-1200, -3250];                        // chỗ trống đủ rộng: cách đường ≥480, cách khu gần nhất ≥900
const V66T = {on:false, spr:{}, key:'', G:null, gk:'', drawn:false, fx:null, near:false, dn:null, msgT:0, t:0, hide:0, sw:0, panel:null};

// ---------- 0. đăng ký khu (lúc nạp file, TRƯỚC v46Init) — chế độ 🧩 Sắp xếp (v48m) dời được ----------
V46L.zones.v66t = {x:V66T_DEF[0], y:V66T_DEF[1], v66t:1};
if(typeof V48M !== 'undefined'){ V48M.def.v66t = V66T_DEF.slice(); try { const s = v48mLoad(), p = s && s.v66t; if(Array.isArray(p) && isFinite(p[0]) && isFinite(p[1])){ V46L.zones.v66t.x = Math.round(p[0]); V46L.zones.v66t.y = Math.round(p[1]); } } catch(e){} }
const v66tBuild0 = v46Build;
v46Build = function(){ const Z = V46L.zones, keep = Z.v66t; delete Z.v66t; try { return v66tBuild0.apply(this, arguments); } finally { Z.v66t = keep; } };
if(typeof v48mFoot === 'function'){
  const f0 = v48mFoot; v48mFoot = function(){ const F = f0(), e = [-V66T_CW/2, -V66T_RP - 200, V66T_CW/2, V66T_RP + 40]; F.v66t = {e, r:e.slice()}; return F; };
  const t0 = v48mThumbs; v48mThumbs = function(F){ const G = Object.assign({}, F); delete G.v66t; const T = t0(G); try { T.v66t = v66tThumb(); } catch(e){} return T; };
  const n0 = v48mName; v48mName = function(id){ return id === 'v66t' ? ['🌳', 'Cây thần kỳ'] : n0(id); };
}

// ---------- 1. hình học (toạ độ thế giới mới) ----------
// bx, by = chân thân cây (mặt trước gốc). Mọi kích thước suy ra từ tán rộng CW theo φ.
function v66tGeo(){
  const z = V46L.zones.v66t, k = z.x + ',' + z.y; if(V66T.G && V66T.gk === k) return V66T.G;
  const P = V66T_PHI, CW = V66T_CW, bx = V46L.CX + z.x, by = V46L.CY + z.y;
  const G = {bx, by, CW, RP:V66T_RP, H:Math.round(CW*P*.69),                // cao 1250 — cao hơn mọi toà nhà (trừ Tháp Rubik 81 cao 1000+chóp)
    trunkW:Math.round(CW/P**4), trunkH:Math.round(CW/P/P*1.24)};          // thân rộng 163, cao tới tán 520
  // sprite nửa độ phân giải: phủ thế giới x ∈ [bx − 620, bx + 620], y ∈ [by − 1320, by + 40]
  G.sx = bx - 620; G.sy = by - 1320; G.SW = 620; G.SH = 680;
  G.box = {x0:bx - CW/2 - 30, y0:by - G.H - 80, x1:bx + CW/2 + 30, y1:by + G.RP + 40};
  G.door = [bx, by + 34];                                                  // trước hốc cây (chỗ đứng để chạm)
  G.ladder = [bx + 262, by + 6];                                           // chân thang dây
  G.swing = [bx - 318, by - 392];                                          // điểm treo xích đu (cành trái)
  // va chạm: thân (elip) + 5 rễ lớn trồi lên (elip nhỏ)
  G.solid = [[bx, by - 26, 96, 40], [bx - 128, by - 4, 46, 20], [bx + 134, by - 2, 50, 20], [bx - 64, by + 14, 30, 14], [bx + 70, by + 16, 30, 14], [bx - 196, by + 18, 30, 14], [bx + 204, by + 22, 28, 13]];
  V66T.G = G; V66T.gk = k; return G;
}
function v66tSolid(x, y){ const G = v66tGeo(); for(const s of G.solid){ const u = (x - s[0])/s[2], v = (y - s[1])/s[3]; if(u*u + v*v < 1) return true; } return false; }

// ---------- 2. lưu (PROF.v66t hoặc khách) ----------
function v66tDef(){ return {d:'', n:0, wish:0, facts:{}, q:0}; }
function v66tState(){
  if(typeof PROF !== 'undefined' && PROF){ if(!PROF.v66t) PROF.v66t = v66tDef(); const s = PROF.v66t; if(!s.facts) s.facts = {}; return s; }
  if(!V66T.Gs){ let g = null; try { g = JSON.parse(localStorage.getItem('truong-v66t-guest') || 'null'); } catch(e){} V66T.Gs = Object.assign(v66tDef(), g || {}); } return V66T.Gs;
}
function v66tSave(){ try { if(typeof PROF !== 'undefined' && PROF) saveProfile(); else localStorage.setItem('truong-v66t-guest', JSON.stringify(v66tState())); } catch(e){} }
function v66tToday(){ const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
const v66tSe = () => (typeof season === 'string' && /^(xuan|ha|thu|dong)$/.test(season)) ? season : 'ha';
function v66tHash(a, b){ let h = (a*73856093) ^ (b*19349663); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0); }
function v66tRnd(seed){ let s = seed >>> 0 || 1; return () => { s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909); s ^= s >>> 16; return (s >>> 0)/4294967296; }; }
function v66tEsc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c])); }
function v66tReady(){ return V66T.on && typeof V46 !== 'undefined' && V46.on && !V46.sky; }

// ---------- 3. móc vào game (gọi cuối extFinalInit) ----------
function v66tInit(){
  if(typeof V46 === 'undefined' || !V46.ready || /[?&]nov66t/.test(location.search)) return;
  V66T.on = true; v66tCss();
  // nền: quảng trường đá, rễ, rêu, ghế, đèn, biển gỗ, lối đi — nướng vào ô nền
  const p0 = v46Paint; v46Paint = function(g, x0, y0, w, h, lod){ p0(g, x0, y0, w, h, lod); const B = v66tGeo().box; if(B.x1 < x0 || B.x0 > x0 + w || B.y1 + 60 < y0 || B.y0 > y0 + h) return; try { v66tGround(g, x0, y0, w, h, lod); } catch(e){ console.warn('v66t paint', e); } };
  const ob0 = v46OverviewBuildings; v46OverviewBuildings = function(g){ ob0(g); try { const G = v66tGeo(), L = v66tLayers(); g.drawImage(L.body, G.sx, G.sy, G.SW*2, G.SH*2); g.drawImage(L.front, G.sx, G.sy, G.SW*2, G.SH*2); } catch(e){} };
  // xếp theo y: cây vẽ ngay trước người đầu tiên đứng trước gốc, nếu không có thì sau cùng
  const sh0 = v46Shore; v46Shore = function(VBn){ sh0(VBn); V66T.drawn = false; };
  const dr0 = v46DrawRaw; v46DrawRaw = function(a){ if(!V66T.drawn && V66T.on){ try { const p = v46Pos(a); if(p[1] > v66tGeo().by) v66tDraw(); } catch(e){} } return dr0.apply(this, arguments); };
  const ww0 = v47wWorld; v47wWorld = function(VBn){ if(!V66T.drawn && V66T.on) v66tDraw(); return ww0.apply(this, arguments); };
  // ban đêm: quả & đèn lồng sáng, hào quang, đom đóm (sau lớp tối)
  const li0 = v46Lighting; v46Lighting = function(VBn){ li0(VBn); try { v66tNight(VBn); } catch(e){ console.warn('v66t night', e); } };
  if(typeof v25Collect === 'function'){ const vc0 = v25Collect; v25Collect = function(dk){ vc0(dk); if(!v66tReady()) return; const on = v25Ramp(clock, 1080, 330); if(on <= 0) return;
    V46.raw = true; try { const G = v66tGeo(); v25Push(G.bx, G.by - 40, 150, on*.8, 2); for(const L of v66tLampsW()) v25Push(G.bx + L[0], G.by + L[1], 60, on*.7, 2); } finally { V46.raw = false; } }; }
  // đường: tránh quảng trường + một lối đá nối ra đường gần nhất
  const ob = v46Obst; v46Obst = function(pad){ const o = ob(pad), G = v66tGeo(); o.push({x0:G.bx - G.RP - pad, y0:G.by - G.RP - pad, x1:G.bx + G.RP + pad, y1:G.by + G.RP + pad, z:{id:'v66t'}}); return o; };
  const rd0 = v46Roads; v46Roads = function(){ rd0(); try { v66tRoad(); v46Graph(); } catch(e){ console.warn('v66t road', e); } };
  const d0 = v46Deco; v46Deco = function(){ d0(); try { v66tClean(); } catch(e){} };
  try { v46Roads(); v46Deco(); V46T.L0.clear(); V46T.L1.clear(); V46T.ov = null; V46RC.clear(); V46G.key = ''; } catch(e){ console.warn('v66t rebuild', e); }
  // va chạm: đi vòng thân + rễ lớn
  const cm0 = canMove; canMove = function(ox, oy, nx, ny){ const r = cm0(ox, oy, nx, ny); if(!r || !V66T.on || !V46.on || V46.sky || !v46Raw(nx)) return r; return v66tSolid(nx - V46E, ny) && !v66tSolid(ox - V46E, oy) ? false : r; };
  // bản đồ lớn / minimap / danh sách điểm đến
  if(typeof V64M_K !== 'undefined') V64M_K.v66t = 'fruit';
  if(typeof v64mPri === 'function'){ const pr0 = v64mPri; v64mPri = function(p){ return pr0(p) + (p && p.k === 'v66t' ? 400 : 0); }; }   // điểm nhấn: nhãn luôn ưu tiên
  if(typeof mapPlaces === 'function'){ const mp0 = mapPlaces; mapPlaces = function(){ const P = mp0(); if(!V46.on || !Array.isArray(P) || P.some(p => p.k === 'v66t')) return P; const G = v66tGeo();
    P.push({k:'v66t', name:'Cây thần kỳ', ic:'🌳', icon:'🌳', desc:'Cây khổng lồ — ước một điều, nhận quà mỗi ngày', cat:'nature', x:G.bx, y:G.by - 120, ox:G.door[0] + V46E, oy:G.door[1], door:[G.door[0] + V46E, G.door[1]], r:true}); return P; }; }
  try { if(typeof DESTS !== 'undefined' && !DESTS.some(d => d[0] === 'v66t')){ const G = v66tGeo(); DESTS.push(['v66t', '🌳 Cây thần kỳ', G.door[0] + V46E, G.door[1] + 20]);
    const sel = document.getElementById('hDest'); if(sel){ const o = document.createElement('option'); o.value = 'v66t'; o.textContent = '🌳 Cây thần kỳ'; sel.appendChild(o); } } } catch(e){}
  if(typeof v32Items === 'function'){ const mi = v32Items; v32Items = function(){ const L = mi(); L.push({ic:'map', en:'Magic Tree', vi:'🌳 Cây thần kỳ', grp:'world', f:() => v66tGuide()}); return L; }; }
  // chạm vào gốc / thân cây → mở bảng
  cvs.addEventListener('pointerdown', e => { V66T.dn = [e.clientX, e.clientY, performance.now()]; }, true);
  cvs.addEventListener('pointerup', e => { if(e.pointerType === 'mouse' && e.button !== 0) return; const d = V66T.dn; V66T.dn = null; if(d && Math.hypot(e.clientX - d[0], e.clientY - d[1]) < 10 && performance.now() - d[2] < 450) v66tTap(e); }, true);
  setInterval(() => { try { v66tTick(); } catch(e){} }, 250);
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v66t = {V66T, v66tGeo, v66tOpen, v66tLayers};
}
// lối đá từ mép quảng trường (phía nam) ra nút đường gần nhất
function v66tRoad(){
  const G = v66tGeo(), e = [G.bx, G.by + G.RP - 10], q = v46Nearest(e[0], e[1]), t = V46R.nodes[q]; if(!t) return;
  const n = Math.max(2, Math.ceil(Math.hypot(t[0] - e[0], t[1] - e[1])/50)), P = []; for(let i = 0; i <= n; i++) P.push([e[0] + (t[0] - e[0])*i/n, e[1] + (t[1] - e[1])*i/n]);
  const ln = {P, closed:false, w:V46L.roads.path, k:'spoke', z:'v66t'}; V46R.lines.push(ln); V66T.road = P;
  // v52w vẽ nền đảo bằng bản sao đường cũ (V52W.isle) → thêm lối vào đó luôn
  if(typeof V52W !== 'undefined' && Array.isArray(V52W.isle)){ V52W.isle = V52W.isle.filter(l => l.z !== 'v66t'); V52W.isle.push(ln); }
}
// bỏ cây/đèn ngẫu nhiên của đảo trong khu cây thần kỳ
function v66tClean(){
  const G = v66tGeo(), bad = (x, y) => (Math.hypot(x - G.bx, y - G.by) < G.RP + 70) || (x > G.bx - G.CW/2 - 20 && x < G.bx + G.CW/2 + 20 && y > G.by - G.H - 60 && y < G.by + 30);
  V46T.deco = V46T.deco.filter(t => t.k === 9 || !bad(t.x, t.y)); if(V46T.lamps) V46T.lamps = V46T.lamps.filter(([x, y]) => !bad(x, y));
}

// ---------- 4. lại gần / chạm ----------
function v66tTick(){
  const b = document.getElementById('v66tGo');
  if(!v66tReady() || typeof PLAYER === 'undefined' || !PLAYER || !PLAYER.visible || V66T.panel || (typeof V53C !== 'undefined' && V53C.mode)){ V66T.near = false; if(b) b.hidden = true; return; }
  const p = v46Pos(PLAYER), G = v66tGeo(), d = Math.hypot(p[0] - G.door[0], p[1] - G.door[1]);
  V66T.near = d < 150;
  if(Math.hypot(p[0] - G.bx, p[1] - G.by) < 900 && performance.now() - V66T.msgT > 180000){ V66T.msgT = performance.now(); toast('🌳 Cây thần kỳ ở ngay đây! Lại gần gốc cây để ước một điều nhé.'); }
  v66tBtn(V66T.near);
}
function v66tBtn(on){
  let b = document.getElementById('v66tGo'); if(!b){ if(!on) return; b = document.createElement('button'); b.type = 'button'; b.id = 'v66tGo'; b.className = 'v53cEnter v66tGo'; b.innerHTML = '🌳 Cây thần kỳ <small>Magic Tree</small>'; b.onclick = () => v66tOpen(); (document.getElementById('stage') || document.body).appendChild(b); }
  b.hidden = !on;
}
function v66tTap(e){
  if(!v66tReady() || V66T.panel || typeof PLAYER === 'undefined' || !PLAYER || !PLAYER.visible) return;
  const r = cvs.getBoundingClientRect(), wx = cam.x + (e.clientX - r.left - cw/2)/cam.z, wy = cam.y + (e.clientY - r.top - ch/2)/cam.z, G = v66tGeo();
  if(Math.abs(wx - G.bx) > 120 || wy < G.by - G.trunkH || wy > G.by + 60) return;   // chỉ thân + gốc
  const p = v46Pos(PLAYER); if(Math.hypot(p[0] - G.door[0], p[1] - G.door[1]) > 460){ toast('🌳 Đi tới gốc Cây thần kỳ rồi chạm lại nhé.'); return; }
  v66tOpen();
}
function v66tGuide(){
  const G = v66tGeo(); if(typeof PLAYER === 'undefined' || !PLAYER || !PLAYER.visible){ toast('🌳 Vào thế giới để đi tới Cây thần kỳ nhé!'); return; }
  try { v32Nav(G.door[0] + V46E, G.door[1] + 20, 'Cây thần kỳ', true); } catch(e){ toast('🌳 Cây thần kỳ ở phía Bắc đảo.'); }
}
