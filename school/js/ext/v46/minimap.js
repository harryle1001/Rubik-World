// ================= v46 · 8/9 MAPS: bản đồ tròn góc phải, bản đồ lớn, chỉ đường vàng — theo đảo mới =================
const V46G = {t:0, from:null, pts:null, key:''};
function v46GuideRoute(){
  if(!GUIDE) return null; const me = PLAYER && PLAYER.visible ? v46Pos(PLAYER) : [cam.x, cam.y], to = v46ToNew(GUIDE.x, GUIDE.y), k = GUIDE.x + ',' + GUIDE.y;
  if(V46G.key !== k || !V46G.from || Math.hypot(me[0] - V46G.from[0], me[1] - V46G.from[1]) > 90 || realT - V46G.t > 3){ V46G.key = k; V46G.from = me; V46G.t = realT; V46G.pts = v46Route(me, to); }
  return V46G.pts;
}
function v46DrawGuide(){
  const pts = v46GuideRoute(); if(!pts) return; const to = pts[pts.length - 1], off = -(realT*40) % 30, lw = Math.max(6, 7/cam.z);
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = 'rgba(10,15,34,.55)'; ctx.lineWidth = lw + 3; ctx.setLineDash([lw*3, lw*2]); ctx.lineDashOffset = off; ctx.stroke();
  ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = lw; ctx.stroke(); ctx.setLineDash([]); const pulse = 1 + .25*Math.sin(realT*5);
  ctx.strokeStyle = '#ef4b4b'; ctx.beginPath(); ctx.arc(to[0], to[1], 18*pulse, 0, Math.PI*2); ctx.stroke(); circ(to[0], to[1] - 22, 9, '#ef4b4b');
  ctx.restore(); plate(GUIDE.name || '', to[0], to[1] - 46);
}
// minimap / big map background: the small island overview
function v46MapBg(g, x0, y0, x1, y1){ const ov = v46Overview(), s = V46T.OVS; g.fillStyle = S().sea2; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  const ax = Math.max(0, x0), ay = Math.max(0, y0), bx = Math.min(V46L.W, x1), by = Math.min(V46L.H, y1); if(bx > ax && by > ay){ g.imageSmoothingEnabled = true; g.drawImage(ov, ax*s, ay*s, (bx - ax)*s, (by - ay)*s, ax, ay, bx - ax, by - ay); } }
function v46MapsInit(){
  drawGuideWorld = function(){};
  const rr0 = rmRender;
  rmRender = function(){
    if(!V46.on || V46.sky) return rr0();
    const r = miniCv.getBoundingClientRect(); if(!r.width) return true; const dpr = Math.min(2, window.devicePixelRatio || 1);
    if(miniCv.width !== Math.round(r.width*dpr) || miniCv.height !== Math.round(r.height*dpr)){ miniCv.width = Math.round(r.width*dpr); miniCv.height = Math.round(r.height*dpr); }
    const me = PLAYER && PLAYER.visible ? v46Pos(PLAYER) : [cam.x, cam.y], SP = 3000, k = r.width/SP, g = miniCtx;
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0a0f22'; g.fillRect(0, 0, miniCv.width, miniCv.height);
    g.setTransform(dpr*k, 0, 0, dpr*k, dpr*(r.width/2 - me[0]*k), dpr*(r.height/2 - me[1]*k));
    v46MapBg(g, me[0] - SP, me[1] - SP, me[0] + SP, me[1] + SP);
    agents.forEach(a => { if(!a.visible || a === PLAYER) return; const p = v46Pos(a); g.fillStyle = a.student ? a.bag : '#ffffff'; g.fillRect(p[0] - 20, p[1] - 20, 40, 40); });
    const pts = v46GuideRoute(); if(pts){ g.strokeStyle = '#ffd23f'; g.lineWidth = 3.4/k; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); const t = pts[pts.length - 1]; g.fillStyle = '#ef4b4b'; g.beginPath(); g.arc(t[0], t[1], 9/k, 0, Math.PI*2); g.fill(); }
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2/k; g.strokeRect(cam.x - cw/cam.z/2, cam.y - ch/cam.z/2, cw/cam.z, ch/cam.z);
    g.setTransform(dpr, 0, 0, dpr, 0, 0); const mx = r.width/2, my = r.height/2, d = PLAYER ? PLAYER.dir || 1 : 1;
    g.fillStyle = '#ffd23f'; g.strokeStyle = '#0a0f22'; g.lineWidth = 2; g.beginPath(); g.moveTo(mx + 9*d, my); g.lineTo(mx - 6*d, my - 7); g.lineTo(mx - 3*d, my); g.lineTo(mx - 6*d, my + 7); g.closePath(); g.fill(); g.stroke();
    g.font = "700 13px 'Be Vietnam Pro', sans-serif"; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('B', mx, 14); g.textAlign = 'left';
    return true;
  };
  // phone big map (v32)
  const mp0 = mapPlaces;
  mapPlaces = function(){
    if(!V46.on) return mp0(); if(MAP.places46) return MAP.places46;
    MAP.places = null; const P = mp0().filter(p => p.k === 'gate' || v46ZoneOld(p.x, p.y)).map(p => { const q = Object.assign({}, p), ox = p.x, oy = p.y; q.ox = ox; q.oy = oy;
      if(!q.door) q.door = p.r ? [ox, p.r.y + p.r.h - 2] : [ox, oy - 12];
      const n = v46ToNew(ox, oy); q.x = n[0]; q.y = n[1]; q.r = p.r ? true : null; return q; });
    return (MAP.places46 = P);
  };
  mapBake = function(){};
  v32MapOpen = function(){ const m = $('#v32Map'); m.hidden = false; V32.mapOpen = true; const cv = $('#v32MapCv'); MAP.z = cv.clientWidth/V46L.W*1.6;
    const p = PLAYER && PLAYER.visible ? v46Pos(PLAYER) : [V46L.CX, V46L.CY]; MAP.cx = p[0]; MAP.cy = p[1];
    $('#v32MapCard').hidden = true; $('#v32MapList').hidden = true; cancelAnimationFrame(MAP.raf); MAP.raf = requestAnimationFrame(mapDraw); };
  openBigMap = v32MapOpen;
  const mc0 = mapCard, ml0 = mapList; mapCard = p => v46WithNew(() => mc0(p)); mapList = q => v46WithNew(() => ml0(q));
  const me = $('#v32MapMe'); if(me) me.onclick = () => { if(PLAYER){ const p = v46Pos(PLAYER); MAP.cx = p[0]; MAP.cy = p[1]; MAP.z = Math.max(MAP.z, .22); } };
  mapDraw = function(){
    if(!V32.mapOpen) return; const cv = $('#v32MapCv'), g = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), Wc = cv.clientWidth, Hc = cv.clientHeight, L = V46L;
    if(cv.width !== Math.round(Wc*dpr) || cv.height !== Math.round(Hc*dpr)){ cv.width = Math.round(Wc*dpr); cv.height = Math.round(Hc*dpr); }
    if(!MAP.drag && MAP.pins.size === 0 && (Math.abs(MAP.vx) > .01 || Math.abs(MAP.vy) > .01)){ MAP.cx -= MAP.vx/MAP.z; MAP.cy -= MAP.vy/MAP.z; MAP.vx *= .92; MAP.vy *= .92; }
    MAP.z = Math.max(Math.min(Wc, Hc)/L.W*.9, Math.min(2, MAP.z)); MAP.cx = Math.max(0, Math.min(L.W, MAP.cx)); MAP.cy = Math.max(0, Math.min(L.H, MAP.cy));
    const z = MAP.z; g.setTransform(dpr*z, 0, 0, dpr*z, dpr*(Wc/2 - MAP.cx*z), dpr*(Hc/2 - MAP.cy*z));
    v46MapBg(g, MAP.cx - Wc/2/z, MAP.cy - Hc/2/z, MAP.cx + Wc/2/z, MAP.cy + Hc/2/z);
    const pts = v46GuideRoute(); if(pts){ g.strokeStyle = '#ffd23f'; g.lineWidth = 5/z; g.setLineDash([10/z, 7/z]); g.lineDashOffset = -(realT*30) % 17/z; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.setLineDash([]); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); const ox = Wc/2 - MAP.cx*z, oy = Hc/2 - MAP.cy*z;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    mapPlaces().forEach(p => { const x = ox + p.x*z, y = oy + p.y*z; if(x < -60 || x > Wc + 60 || y < -40 || y > Hc + 40) return; if(p.small && z < .16) return; if(z < .05 && !p.r) return;
      g.font = (z < .07 ? 16 : 22) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.fillText(p.ic, x, y - (z >= .045 ? 10 : 0));
      if(z >= .045){ g.font = "700 14px 'Be Vietnam Pro', Nunito, sans-serif"; const tw = g.measureText(p.name).width + 12; g.fillStyle = 'rgba(10,15,34,.8)'; g.fillRect(x - tw/2, y + 5, tw, 20); g.fillStyle = MAP.sel === p ? '#ffd23f' : '#fff'; g.fillText(p.name, x, y + 15); } });
    (ONLINE.peers || []).forEach(q => { const pr = q.presence || {}; if(pr.x == null) return; const n = v46ToNew(+pr.x, +pr.y); g.fillStyle = '#26c6da'; g.beginPath(); g.arc(ox + n[0]*z, oy + n[1]*z, 5, 0, Math.PI*2); g.fill(); });
    if(PLAYER && PLAYER.visible){ const n = v46Pos(PLAYER), x = ox + n[0]*z, y = oy + n[1]*z, pr = (realT*1.2) % 1; g.strokeStyle = `rgba(66,165,245,${1 - pr})`; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 8 + pr*18, 0, Math.PI*2); g.stroke();
      g.fillStyle = '#1e88e5'; g.beginPath(); g.arc(x, y, 8, 0, Math.PI*2); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke(); }
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    MAP.raf = requestAnimationFrame(mapDraw);
  };
  // navigation: the road route of the island, ending at the real (old) target point
  const nf0 = navFind; navFind = function(sx, sy, tx, ty){ if(!V46.on) return nf0(sx, sy, tx, ty);
    const a = v46ToNew(sx, sy), b = v46ToNew(tx, ty); return v46Route(a, b).slice(1).map(p => [p[0] + V46E, p[1]]); };
}
