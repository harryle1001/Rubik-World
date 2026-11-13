// ================= EXT25 (v20): soften the world — outdoor zones become rounded, hedge-lined islands like the farm; rooms get round corners =================
const SOFT_ZONES = ['giantchess','rubikpark','pond','flowerfield','bpad','skate','patin','basket','ski','art','garden','picnic','lotus','lake','field','attend','zen','stadium','pool','archery','gym','arena','kart','academy','shopst','hall2p','plaza','botanic','pstreet','farm'];
const SOFT_ROOMS = ['rubik','chess','music','hall','rubikyard','office','elec'];
const sh01 = (a, b) => { let h = (a*73856093) ^ (b*19349663); h = (h ^ (h >>> 13))*1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0)/4294967296; };
function rrPath(x, y, w, h, r){ ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath(); }
function softCorners(x, y, w, h, rad, fill, deco){
  ctx.save(); ctx.beginPath(); ctx.rect(x - 1, y - 1, w + 2, h + 2); rrPath(x, y, w, h, rad); ctx.fillStyle = fill; ctx.fill('evenodd'); ctx.restore();
  if(!deco) return; const s = S(), dong = season === 'dong';
  [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([cx, cy, sx, sy], i) => {
    for(let k=0;k<10;k++){ const u = sh01(cx + k, cy), v = sh01(cy + k, cx); if(u + v > .55) continue; rect(s.grass2, cx + sx*u*rad*.9, cy + sy*v*rad*.9, 3, 4); }
    const bx = cx + sx*rad*.26, by = cy + sy*rad*.26, br = Math.max(5, rad*.13); circ(bx, by + 2, br + 1, 'rgba(0,0,0,.15)'); circ(bx, by, br, dong ? '#cfd8dc' : s.leaf); circ(bx - br*.4, by - br*.4, br*.6, dong ? '#eceff1' : s.leaf2);
    if(!dong){ circ(bx + br*.5, by - br*.2, 1.8, ['#ff6f91','#ffd23f','#ffffff','#ba68c8'][i]); circ(bx - br*.3, by + br*.4, 1.6, '#fff59d'); } });
}
function softHedge(x, y, w, h, rad){
  const s = S(), dong = season === 'dong'; ctx.save(); ctx.beginPath(); rrPath(x + 3, y + 3, w - 6, h - 6, Math.max(4, rad - 3)); ctx.lineWidth = 7; ctx.strokeStyle = dong ? '#e0e6e8' : s.leaf; ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = dong ? '#ffffff' : s.leaf2; ctx.stroke(); ctx.restore();
  if(dong) return; const per = 2*(w + h), step = 46;
  for(let d = 0; d < per; d += step){ const k = sh01(x + d, y); if(k < .45) continue; let px, py; if(d < w){ px = x + d; py = y + 3; } else if(d < w + h){ px = x + w - 3; py = y + d - w; } else if(d < 2*w + h){ px = x + w - (d - w - h); py = y + h - 3; } else { px = x + 3; py = y + h - (d - 2*w - h); }
    if((px - x < rad || x + w - px < rad) && (py - y < rad || y + h - py < rad)) continue; circ(px, py, 2.4, ['#ff6f91','#ffd23f','#ffffff','#ba68c8','#ff8a65'][Math.floor(k*50) % 5]); }
}
function v20Soft(){
  if(typeof FEED !== 'undefined' && FEED) return; const s = S();
  SOFT_ZONES.forEach(k => { const r = R[k]; if(!r || !r.w || VB.x1 < r.x || VB.x0 > r.x + r.w || VB.y1 < r.y || VB.y0 > r.y + r.h) return;
    const rad = Math.min(130, Math.min(r.w, r.h)*(k === 'farm' ? .3 : .26)); softCorners(r.x, r.y, r.w, r.h, rad, s.grass, true); softHedge(r.x, r.y, r.w, r.h, rad); });
}
function v20Rooms(){
  if(typeof FEED !== 'undefined' && FEED) return; const s = S();
  SOFT_ROOMS.forEach(k => { const r = R[k]; if(!r || VB.x1 < r.x - 20 || VB.x0 > r.x + r.w + 20 || VB.y1 < r.y - 20 || VB.y0 > r.y + r.h + 20) return; const rad = 26, t = 9;
    softCorners(r.x - t, r.y - t, r.w + 2*t, r.h + 2*t, rad, s.grass, false);
    [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]].forEach(([x, y], i) => { const ox = (i % 2 ? -1 : 1)*9, oy = (i < 2 ? 1 : -1)*9; circ(x + ox, y + oy + 2, 12, 'rgba(0,0,0,.18)'); circ(x + ox, y + oy, 11, r.fence ? '#a8844a' : '#e9dcc0'); circ(x + ox - 3, y + oy - 3, 5, r.fence ? '#c8a46a' : '#fff8ec'); circ(x + ox, y + oy, 3, '#d4a52c'); }); });
}

