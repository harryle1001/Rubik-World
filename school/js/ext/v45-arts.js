// ================= EXT54 (v45 · Session 6): calm arts — a Buddhist temple in the zen garden with people meditating and
// soft nature sounds; gentle code-made background music that changes with every area; the painters' corner opens onto the
// meadow with more students painting; a new "Music Hill" north of the flower field (the world grows north) with corners for
// piano, violin, trumpet, flute and saxophone and an open-air opera stage: student orchestra, a conductor, a student audience =================
const V45A = {bgm:{on:false, zone:null, nextT:0, step:0, timer:0, out:null}, perf:null, demo:null, mh:null, mhKey:''};
// Music Hill: the new land north of the flower field (golden split: 0.618 opera · 0.382 instrument corners)
const V45A_MH = {x:1590, y:-890, w:1050, h:318};
const V45A_OP = {x:V45A_MH.x, w:Math.round(V45A_MH.w*.618)};
const V45A_STAIR = {x:2150, w:64};
const V45A_INST = [
  {k:'piano', n:'Piano', ic:'🎹', x:2312, y:-812, c:'#263238', f:'Piano có 88 phím đen trắng, ra đời ở Ý khoảng năm 1700.'},
  {k:'violin', n:'Violin', ic:'🎻', x:2440, y:-812, c:'#a0522d', f:'Violin có 4 dây, kéo bằng vĩ làm từ lông đuôi ngựa.'},
  {k:'trumpet', n:'Kèn trumpet', ic:'🎺', x:2568, y:-812, c:'#d4a017', f:'Kèn trumpet đổi nốt bằng 3 phím bấm và cách mím môi.'},
  {k:'flute', n:'Sáo', ic:'🪈', x:2376, y:-680, c:'#b0bec5', f:'Sáo trúc Việt Nam có 6 lỗ bấm, thổi ngang.'},
  {k:'sax', n:'Saxophone', ic:'🎷', x:2504, y:-680, c:'#c9a227', f:'Saxophone do ông Adolphe Sax phát minh năm 1846.'}
];
const v45aIn = (r, x, y, m) => x >= r.x - (m || 0) && x <= r.x + r.w + (m || 0) && y >= r.y - (m || 0) && y <= r.y + r.h + (m || 0);
const v45aOnStair = (x, y) => x >= V45A_STAIR.x && x <= V45A_STAIR.x + V45A_STAIR.w && y >= V45A_MH.y + V45A_MH.h - 6 && y <= -520;
const v45aNight = () => { try { return Math.min(.6, (SKYST ? SKYST.night*.55 + SKYST.dk*.25 : 0)); } catch(e){ return 0; } };
// ---------- small drawing helpers (global ctx, like the rest of the map) ----------
function v45aSit(f, x, y, pose, sc){ // pose: 'lotus' (cross-legged) · 'chair' (legs forward) — upper body from drawBody, clipped above the hip
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if(sc) ctx.scale(sc, sc);
  ctx.save(); ctx.beginPath(); ctx.rect(-14, -48, 28, 39); ctx.clip(); ctx.translate(0, 1); f.moving = false; drawBody(f, false); ctx.restore();
  if(pose === 'lotus'){ ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(-10, -2, 20, 3); ctx.fillStyle = f.pants; ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(10, -2); ctx.lineTo(7, -9); ctx.lineTo(-7, -9); ctx.fill(); ctx.fillStyle = f.skin; ctx.fillRect(-8, -9, 3, 3); ctx.fillRect(5, -9, 3, 3); }
  else { ctx.fillStyle = f.pants; ctx.fillRect(-5, -9, 4, 4); ctx.fillRect(1, -9, 4, 4); ctx.fillRect(f.dir > 0 ? 2 : -6, -6, 4, 6); ctx.fillStyle = '#222'; ctx.fillRect(f.dir > 0 ? 2 : -6, -1, 5, 2); }
  ctx.restore(); }
function v45aBack(f, x, y, sc){ // someone seen from behind (audience facing the stage)
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if(sc) ctx.scale(sc, sc); rect(f.shirt, -6, -20, 12, 11); rect(f.skin, -5, -30, 10, 10); rect(f.hair, -6, -32, 12, f.long ? 14 : 9); rect(f.skin, -8, -19, 2, 7); rect(f.skin, 6, -19, 2, 7); ctx.restore(); }
function v45aNote(x, y, t, col){ ctx.fillStyle = col || 'rgba(255,255,255,.85)'; ctx.font = '800 14px Nunito, sans-serif'; ctx.fillText(t % 2 < 1 ? '♪' : '♫', x, y); }
// ---------- 1. zen garden: Buddhist temple replaces the lean-to hut ----------
function v45aTemple(){ const r = R.zen, cx = r.x + 320, by = r.y + 118, dong = season === 'dong';
  // clear the old hut with raked sand
  rect('#e9e2cf', r.x + 226, r.y + 2, 190, 116); ctx.strokeStyle = 'rgba(160,140,110,.5)'; ctx.lineWidth = 1.5; for(let k=0;k<5;k++){ ctx.beginPath(); ctx.moveTo(r.x + 226, r.y + 20 + k*22); for(let x = r.x + 226; x <= r.x + 416; x += 20) ctx.lineTo(x, r.y + 20 + k*22 + Math.sin(x*.02 + k)*3); ctx.stroke(); }
  // stone base with steps
  rect('#9e9a90', cx - 92, by - 16, 184, 16); rect('#b9b4a8', cx - 86, by - 20, 172, 6); for(let k=0;k<3;k++) rect('#cfc9bb', cx - 22 + k*2, by - 4 + k*4 - 8, 44 - k*4, 4);
  // red pillars + walls + glowing golden doorway with a small seated Buddha
  rect('#7a1f1a', cx - 74, by - 70, 148, 50); for(let k=0;k<5;k++) rect('#b71c1c', cx - 70 + k*34, by - 70, 6, 50);
  rect('#ffcf66', cx - 18, by - 62, 36, 42); rect('#ffe08a', cx - 14, by - 58, 28, 38);
  ctx.fillStyle = '#c99a1e'; ctx.beginPath(); ctx.arc(cx, by - 44, 5, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx - 11, by - 22); ctx.quadraticCurveTo(cx, by - 42, cx + 11, by - 22); ctx.fill(); ctx.fillStyle = '#e6b422'; ctx.beginPath(); ctx.ellipse(cx, by - 24, 12, 4, 0, 0, 7); ctx.fill();
  rect('#5d1512', cx - 64, by - 60, 22, 18); rect('#5d1512', cx + 42, by - 60, 22, 18); rect('#f2c14e', cx - 62, by - 58, 18, 2); rect('#f2c14e', cx + 44, by - 58, 18, 2);
  // two-tier roof with upturned eaves and a golden ridge
  const roof = (w, y, h, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx - w/2 - 14, y - 6); ctx.quadraticCurveTo(cx - w/2, y, cx - w/2 + 10, y - 2); ctx.lineTo(cx - w/2 + 28, y - h); ctx.lineTo(cx + w/2 - 28, y - h); ctx.lineTo(cx + w/2 - 10, y - 2); ctx.quadraticCurveTo(cx + w/2, y, cx + w/2 + 14, y - 6); ctx.lineTo(cx + w/2 + 4, y + 4); ctx.lineTo(cx - w/2 - 4, y + 4); ctx.fill(); };
  roof(178, by - 66, 20, dong ? '#dfe7ee' : '#2e5e4e'); rect(dong ? '#c9d3dc' : '#244c3f', cx - 82, by - 66, 164, 4);
  rect('#7a1f1a', cx - 46, by - 104, 92, 20); for(let k=0;k<4;k++) rect('#b71c1c', cx - 44 + k*28, by - 104, 5, 20);
  roof(124, by - 100, 20, dong ? '#e6edf3' : '#2e5e4e'); rect('#e6b422', cx - 34, by - 122, 68, 3);
  ctx.fillStyle = '#e6b422'; ctx.beginPath(); ctx.moveTo(cx - 6, by - 122); ctx.lineTo(cx + 6, by - 122); ctx.lineTo(cx, by - 140); ctx.fill(); ctx.beginPath(); ctx.arc(cx, by - 141, 3, 0, 7); ctx.fill();
  // stone lanterns + a bodhi tree beside the temple
  for(const lx of [cx - 108, cx + 102]){ rect('#9e9a90', lx - 5, by - 6, 10, 6); rect('#b0aa9d', lx - 3, by - 24, 6, 18); rect('#8a857a', lx - 8, by - 30, 16, 6); rect('#ffd77a', lx - 4, by - 28, 8, 3); tri(lx - 9, by - 30, lx + 9, by - 30, lx, by - 38, '#8a857a'); }
  const tx = r.x + 470, ty = r.y + 120; rect('#6d4c2e', tx - 4, ty - 40, 8, 40); circ(tx, ty - 58, 30, dong ? '#e8eef0' : '#4f8f3a'); circ(tx - 20, ty - 46, 20, dong ? '#dbe4e8' : '#5ea044'); circ(tx + 20, ty - 48, 20, dong ? '#dbe4e8' : '#5ea044');
  plate('CHÙA TĨNH TÂM', cx, by + 4);
}
const V45A_ZEN = [[86, 210, 0], [200, 200, 0], [300, 200, 1], [420, 196, 1], [70, 360, 0], [470, 380, 1], [330, 560, 0], [460, 560, 1], [180, 520, 0], [296, 182, 2], [344, 182, 2]];
function v45aZenSprites(sp, t){ const r = R.zen; if(VB.x1 < r.x || VB.x0 > r.x + r.w || VB.y1 < r.y || VB.y0 > r.y + r.h + 40) return;
  V45A_ZEN.forEach(([dx, dy, monk], i) => { const x = r.x + dx, y = r.y + dy, br = (Math.sin(t*.7 + i*1.3) + 1)/2;
    sp.push({y, f:() => { ctx.fillStyle = `rgba(255,236,179,${.1 + br*.2})`; ctx.beginPath(); ctx.arc(x, y - 16, 14 + br*7, 0, 7); ctx.fill(); ctx.fillStyle = monk === 2 ? '#a1887f' : '#7e57c2'; ctx.beginPath(); ctx.ellipse(x, y - 1, 12, 4, 0, 0, 7); ctx.fill();
      const f = fakeAt(150 + i, x, y, i % 2 ? -1 : 1); if(monk === 2){ f.shirt = '#e07b1f'; f.pants = '#e07b1f'; f.hair = f.skin; f.cap = null; } v45aSit(f, x, y, 'lotus'); }}); });
  // incense smoke in front of the temple
  const ix = r.x + 320, iy = r.y + 158; sp.push({y:iy, f:() => { rect('#8d6e4a', ix - 8, iy - 8, 16, 8); rect('#b08a5a', ix - 9, iy - 10, 18, 3); ctx.strokeStyle = 'rgba(230,230,230,.5)'; ctx.lineWidth = 1.5; for(let k=0;k<2;k++){ ctx.beginPath(); ctx.moveTo(ix - 3 + k*6, iy - 10); for(let j=1;j<8;j++) ctx.lineTo(ix - 3 + k*6 + Math.sin(t*1.5 + j*.8 + k)*4, iy - 10 - j*6); ctx.stroke(); } }}); }
// ---------- 2. painters' corner opens onto the meadow ----------
function v45aArtStatic(){ const r = R.art, dong = season === 'dong', g = dong ? '#e8eef0' : '#8fbf5a', g2 = dong ? '#dbe4e8' : '#7fb04c';
  rect(g, r.x - 14, r.y - 14, r.w + 28, r.h + 28); for(let i=0;i<70;i++){ const x = r.x + (i*53) % r.w, y = r.y + (i*97) % r.h; rect(g2, x, y, 4, 2); }
  // a winding path and a little stream through the meadow
  ctx.strokeStyle = dong ? '#cfd8dc' : '#d9c79a'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(r.x + r.w/2, r.y + r.h + 10); ctx.bezierCurveTo(r.x + 80, r.y + 270, r.x + 200, r.y + 160, r.x + 120, r.y + 40); ctx.stroke();
  ctx.strokeStyle = dong ? '#d6ecf3' : '#5fb2cf'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(r.x + r.w + 10, r.y + 60); ctx.bezierCurveTo(r.x + 200, r.y + 110, r.x + 250, r.y + 220, r.x + 180, r.y + r.h + 10); ctx.stroke(); ctx.lineCap = 'butt';
  if(!dong) for(let i=0;i<46;i++){ const x = r.x + 8 + (i*61) % (r.w - 16), y = r.y + 8 + (i*37) % (r.h - 16); circ(x, y, 2.4, ['#ff6f91', '#ffd23f', '#ffffff', '#ba68c8', '#ff8a65'][i % 5]); }
  for(const [x, y, s] of [[r.x + 30, r.y + 40, 24], [r.x + r.w - 34, r.y + 300, 26], [r.x + 40, r.y + 300, 20], [r.x + r.w - 40, r.y + 20, 22]]){ rect('#6d4c2e', x - 3, y, 6, 22); circ(x, y - 6, s, dong ? '#dbe4e8' : '#4f8f3a'); circ(x - s*.5, y + 2, s*.6, dong ? '#e8eef0' : '#5ea044'); }
  plate('GÓC HỌA SĨ GIỮA THIÊN NHIÊN · BẤM ĐỂ VẼ', r.x + r.w/2, r.y + r.h - 22); }
const V45A_PAINT = [[46, 110, 1], [150, 92, -1], [222, 150, -1], [70, 200, 1], [196, 260, -1], [110, 318, 1], [240, 330, -1], [24, 250, 1]];
function v45aArtSprites(sp, t){ const r = R.art; if(VB.x1 < r.x - 20 || VB.x0 > r.x + r.w + 20 || VB.y1 < r.y - 20 || VB.y0 > r.y + r.h + 20) return;
  V45A_PAINT.forEach(([dx, dy, dir], i) => { const x = r.x + dx, y = r.y + dy, ex = x + dir*18; sp.push({y, f:() => {
    rect('#6d4c2e', ex - 1, y - 30, 2, 30); ctx.strokeStyle = '#6d4c2e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ex, y - 28); ctx.lineTo(ex - 8, y); ctx.moveTo(ex, y - 28); ctx.lineTo(ex + 8, y); ctx.stroke();
    rect('#fff', ex - 11, y - 34, 22, 16); const hue = (i*47) % 360; ctx.fillStyle = `hsl(${hue},60%,70%)`; ctx.fillRect(ex - 9, y - 32, 18, 6); ctx.fillStyle = `hsl(${(hue + 120) % 360},50%,55%)`; ctx.fillRect(ex - 9, y - 26, 18, 6); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(ex + 4 - 8*(i % 2), y - 29, 2.5, 0, 7); ctx.fill();
    rect('#8d6e4a', x - 5, y - 6, 10, 3); const f = fakeAt(170 + i, x, y, dir); v45aSit(f, x, y - 2, 'chair');
    const a = Math.sin(t*2 + i)*2; rect(f.skin, x + dir*7, y - 19 + a, 5*dir, 2); }}); }); }
// ---------- 3. Music Hill (new land north of the flower field) ----------
function v45aMHBuild(){ const key = season; if(V45A.mh && V45A.mhKey === key) return V45A.mh;
  const M = V45A_MH, pad = 80, cv = V45A.mh || document.createElement('canvas'); cv.width = M.w + pad*2; cv.height = M.h + pad*2; const g = cv.getContext('2d'), prev = ctx; ctx = g; g.setTransform(1, 0, 0, 1, pad - M.x, pad - M.y);
  try { const dg = season === 'dong', grass = dg ? '#e8eef0' : '#86b85a', grass2 = dg ? '#dbe4e8' : '#77a94e';
    // land: rounded plateau with a rocky cliff face on the south side
    g.fillStyle = '#7a6a55'; g.beginPath(); g.roundRect ? g.roundRect(M.x, M.y + 10, M.w, M.h + 6, 40) : g.rect(M.x, M.y + 10, M.w, M.h + 6); g.fill();
    g.fillStyle = grass; g.beginPath(); g.roundRect ? g.roundRect(M.x, M.y, M.w, M.h - 6, 40) : g.rect(M.x, M.y, M.w, M.h - 6); g.fill();
    for(let i=0;i<120;i++){ rect(grass2, M.x + 20 + (i*71) % (M.w - 40), M.y + 14 + (i*43) % (M.h - 34), 4, 2); }
    for(let x = M.x + 20; x < M.x + M.w - 20; x += 26) rect('#6a5a46', x, M.y + M.h - 4, 14, 4);
    // trees along the north rim
    for(let x = M.x + 26; x < M.x + M.w - 20; x += 46){ const h = 30 + ((x*7) % 16); tri(x - 14, M.y + 14, x + 14, M.y + 14, x, M.y + 14 - h, dg ? '#c9d6dc' : '#2e6b3a'); }
    // stairs down to the flower field
    const S = V45A_STAIR; rect('#a69a86', S.x - 6, M.y + M.h - 14, S.w + 12, 40); for(let k=0;k<6;k++) rect(k % 2 ? '#bdb2a0' : '#cfc5b3', S.x, M.y + M.h - 12 + k*6, S.w, 5);
    // --- opera: stage at the top, orchestra on it, audience rows below ---
    const ox = V45A_OP.x, ow = V45A_OP.w, scx = ox + ow/2, sy = M.y + 96;
    g.fillStyle = '#d8cdb8'; g.beginPath(); g.ellipse(scx, sy + 40, ow*.47, 150, 0, 0, Math.PI); g.fill();
    for(let k=0;k<5;k++){ g.strokeStyle = k % 2 ? '#bfb29a' : '#cbbfa7'; g.lineWidth = 10; g.beginPath(); g.ellipse(scx, sy + 52, 130 + k*36, 70 + k*30, 0, .12, Math.PI - .12); g.stroke(); }
    // shell-shaped bandstand
    g.fillStyle = '#f5ecd9'; g.beginPath(); g.moveTo(scx - 190, sy); g.quadraticCurveTo(scx, sy - 150, scx + 190, sy); g.closePath(); g.fill();
    g.strokeStyle = '#d9c7a4'; g.lineWidth = 3; for(let k=1;k<7;k++){ g.beginPath(); g.moveTo(scx, sy - 2); g.lineTo(scx - 190 + k*54, sy - Math.sin(k/7*Math.PI)*66 - 6); g.stroke(); }
    g.fillStyle = '#8e1b1b'; g.beginPath(); g.moveTo(scx - 172, sy); g.quadraticCurveTo(scx - 150, sy - 70, scx - 110, sy - 92); g.lineTo(scx - 120, sy); g.fill(); g.beginPath(); g.moveTo(scx + 172, sy); g.quadraticCurveTo(scx + 150, sy - 70, scx + 110, sy - 92); g.lineTo(scx + 120, sy); g.fill();
    rect('#6d4c2e', scx - 196, sy, 392, 12); rect('#8d6e4a', scx - 190, sy - 4, 380, 6); rect('#5d4037', scx - 12, sy + 26, 24, 8); // conductor's podium
    for(let k=0;k<6;k++) rect(['#ffd23f', '#ff8a65', '#4fc3f7'][k % 3], scx - 180 + k*72, sy + 8, 4, 4);
    plate('NHÀ HÁT OPERA NGOÀI TRỜI · BẤM ĐỂ NGHE', scx, M.y + M.h - 26);
    // --- instrument corners ---
    V45A_INST.forEach(I => { g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.ellipse(I.x, I.y + 30, 50, 18, 0, 0, 7); g.fill(); g.fillStyle = '#c8a878'; g.beginPath(); g.ellipse(I.x, I.y + 26, 48, 17, 0, 0, 7); g.fill(); g.strokeStyle = '#a07f52'; g.lineWidth = 2; g.stroke();
      for(const px of [-38, 38]){ rect('#f5ecd9', I.x + px - 3, I.y - 22, 6, 46); } g.fillStyle = I.c; g.beginPath(); g.moveTo(I.x - 52, I.y - 18); g.quadraticCurveTo(I.x, I.y - 48, I.x + 52, I.y - 18); g.lineTo(I.x + 46, I.y - 12); g.lineTo(I.x - 46, I.y - 12); g.fill();
      plate(I.n.toUpperCase(), I.x, I.y + 46); });
    // lamps
    for(const [x, y] of [[M.x + 40, M.y + 250], [V45A_OP.x + ow + 10, M.y + 60], [M.x + M.w - 40, M.y + 250], [V45A_STAIR.x - 20, M.y + M.h - 30]]){ rect('#37474f', x - 2, y - 40, 4, 40); rect('#ffe08a', x - 5, y - 46, 10, 8); }
    plate('ĐỒI ÂM NHẠC', M.x + M.w/2 + 120, M.y + 6);
  } finally { ctx = prev; }
  V45A.mh = cv; V45A.mhKey = key; return cv; }
function v45aMHDraw(){ const M = V45A_MH; if(VB.x1 < M.x - 80 || VB.x0 > M.x + M.w + 80 || VB.y1 < M.y - 160 || VB.y0 > M.y + M.h + 80) return; ctx.drawImage(v45aMHBuild(), M.x - 80, M.y - 80); }
const V45A_ORCH = ['violin', 'violin', 'violin', 'cello', 'violin', 'violin', 'flute', 'trumpet', 'cello', 'flute', 'violin', 'drum'];
function v45aMHSprites(sp, t){ const M = V45A_MH; if(VB.x1 < M.x - 40 || VB.x0 > M.x + M.w + 40 || VB.y1 < M.y - 160 || VB.y0 > M.y + M.h + 40) return;
  const P = V45A.perf, playing = P && performance.now() < P.end, ox = V45A_OP.x, scx = ox + V45A_OP.w/2, sy = M.y + 96, sw = playing ? 6 : 2.2;
  // orchestra: two arcs of seated students on the stage
  V45A_ORCH.forEach((ins, i) => { const row = i < 7 ? 0 : 1, k = row ? i - 7 : i, n = row ? 5 : 7, a = Math.PI*(.18 + .64*k/(n - 1)), rr = row ? 90 : 150, x = scx - Math.cos(a)*rr, y = sy - 12 - Math.sin(a)*(row ? 36 : 56) + (row ? 0 : 14);
    sp.push({y, f:() => { const f = fakeAt(200 + i, x, y, x < scx ? 1 : -1, {shirt:'#1c1c1c', pants:'#1c1c1c'}); v45aSit(f, x, y, 'chair'); const m = Math.sin(t*sw + i)*3;
      if(ins === 'violin'){ rect('#8b4513', x - 2, y - 22, 7, 4); ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 6 + m, y - 26); ctx.lineTo(x + 8 + m, y - 18); ctx.stroke(); }
      else if(ins === 'cello'){ rect('#8b4513', x + 4, y - 22, 6, 16); rect('#5d2f0e', x + 6, y - 30, 2, 8); ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 2 + m, y - 14); ctx.lineTo(x + 14 + m, y - 14); ctx.stroke(); }
      else if(ins === 'flute') rect('#cfd8dc', x - 2, y - 26, 14, 2); else if(ins === 'trumpet'){ rect('#d4a017', x + 2, y - 24, 10, 3); rect('#d4a017', x + 11, y - 26, 3, 7); }
      else { rect('#b0bec5', x - 7, y - 16, 14, 8); rect('#eceff1', x - 7, y - 17, 14, 2); rect('#6d4c2e', x - 3 + m, y - 22, 2, 6); }
      if(playing && (i + Math.floor(t*2)) % 5 === 0) v45aNote(x - 4, y - 36 - ((t*20 + i*7) % 18), t + i, 'rgba(255,240,180,.9)'); }}); });
  // conductor on the podium, back to the audience, waving the baton
  const cx = scx, cy = sy + 30; sp.push({y:cy, f:() => { const f = fakeAt(230, cx, cy, 1, {shirt:'#111', pants:'#111'}); v45aBack(f, cx, cy, 1.15); const a = Math.sin(t*(playing ? 5 : 1.6))*.9;
    ctx.save(); ctx.translate(cx + 7, cy - 22); ctx.rotate(-1.2 + a); rect(f.skin, 0, -1, 9, 2); rect('#fff', 9, -0.5, 12, 1); ctx.restore(); ctx.save(); ctx.translate(cx - 7, cy - 22); ctx.rotate(-2 - a*.5); rect(f.skin, 0, -1, 8, 2); ctx.restore(); }});
  // student audience on the curved rows, seen from behind; they clap when the piece ends
  const clap = P && performance.now() > P.end && performance.now() < P.end + 3500;
  for(let k=0;k<4;k++){ const n = 5 + k*2; for(let j=0;j<n;j++){ const a = Math.PI*(.2 + .6*j/(n - 1)), x = scx - Math.cos(a)*(150 + k*36), y = sy + 56 + Math.sin(a)*(66 + k*24); if((j*7 + k*3) % 4 === 3) continue;
    sp.push({y, f:() => { const f = fakeAt(240 + k*20 + j, x, y, 1); v45aBack(f, x, y); if(clap){ const u = Math.sin(t*18 + j)*2; rect(f.skin, x - 4 + u, y - 34, 3, 3); rect(f.skin, x + 1 - u, y - 34, 3, 3); } }}); } }
  // students practising in each instrument corner
  V45A_INST.forEach((I, i) => { const x = I.x, y = I.y + 22, d = V45A.demo && V45A.demo.k === I.k && performance.now() < V45A.demo.end; sp.push({y, f:() => { const f = fakeAt(280 + i, x, y, 1); const m = Math.sin(t*(d ? 8 : 3) + i)*2;
    if(I.k === 'piano'){ rect('#111', x - 22, y - 26, 36, 18); rect('#fafafa', x - 20, y - 14, 32, 4); v45aSit(f, x + 18, y + 2, 'chair'); f.dir = -1; }
    else { const ff = Object.assign(f, {moving:false}); ctx.save(); ctx.translate(x, y); drawBody(ff, false); ctx.restore();
      if(I.k === 'violin'){ rect('#8b4513', x + 2, y - 24, 8, 4); ctx.strokeStyle = '#eee'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 4 + m, y - 28); ctx.lineTo(x + 12 + m, y - 20); ctx.stroke(); }
      else if(I.k === 'trumpet'){ rect('#d4a017', x + 4, y - 24, 12, 3); rect('#d4a017', x + 15, y - 27, 4, 9); }
      else if(I.k === 'flute') rect('#cfd8dc', x - 10, y - 26, 26, 2); else { rect('#c9a227', x + 4, y - 22, 3, 12); rect('#c9a227', x + 4, y - 11, 8, 3); rect('#c9a227', x + 10, y - 16, 3, 6); } }
    if(d || (i + Math.floor(t)) % 3 === 0) v45aNote(x + 10, y - 40 - ((t*18 + i*9) % 16), t + i, d ? '#ffd23f' : 'rgba(255,255,255,.7)'); }}); });
  // night tint for the new land (the world's night shade only covers the old land)
  const nt = v45aNight(); if(nt > .02) sp.push({y:M.y + M.h + 2, f:() => { ctx.fillStyle = `rgba(12,18,48,${nt})`; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(M.x, M.y, M.w, M.h + 16, 40); else ctx.rect(M.x, M.y, M.w, M.h + 16); const scx2 = V45A_OP.x + V45A_OP.w/2, sy2 = M.y + 96; ctx.moveTo(scx2 - 196, sy2); ctx.quadraticCurveTo(scx2, sy2 - 150, scx2 + 196, sy2); ctx.closePath(); ctx.fill('nonzero');
    for(const [x, y] of [[M.x + 40, M.y + 250], [V45A_OP.x + V45A_OP.w + 10, M.y + 60], [M.x + M.w - 40, M.y + 250], [V45A_STAIR.x - 20, M.y + M.h - 30]]){ const gr = ctx.createRadialGradient(x, y - 42, 2, x, y - 42, 70); gr.addColorStop(0, `rgba(255,214,120,${nt*.9})`); gr.addColorStop(1, 'rgba(255,214,120,0)'); ctx.fillStyle = gr; ctx.fillRect(x - 70, y - 112, 140, 140); } }}); }
// ---------- 4. sound: instruments, the opera piece, and soft background music per area ----------
const v45aHz = m => 440*Math.pow(2, (m - 69)/12);
function v45aOut(){ ensureAC(); if(!V45A.bgm.out){ V45A.bgm.out = AC.createGain(); V45A.bgm.out.gain.value = 0; V45A.bgm.out.connect(AC.destination); } return V45A.bgm.out; }
function v45aSfxOut(){ try { return sfx(); } catch(e){ ensureAC(); return AC.destination; } }
function v45aVoice(kind, m, t, d, v, out){ // synthesized instruments
  const o = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter(); f.type = 'lowpass'; const hz = v45aHz(m); o.frequency.setValueAtTime(hz, t);
  const env = (a, r) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.setTargetAtTime(0, t + Math.max(a, d - r), r/3); };
  if(kind === 'violin' || kind === 'strings' || kind === 'cello'){ o.type = 'sawtooth'; f.frequency.value = kind === 'strings' ? 1400 : 2600; env(kind === 'strings' ? .35 : .08, .3); const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = 5.5; lg.gain.value = hz*.006; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + d + 1); }
  else if(kind === 'trumpet'){ o.type = 'sawtooth'; f.frequency.setValueAtTime(600, t); f.frequency.linearRampToValueAtTime(2400, t + .06); f.Q.value = 2; env(.03, .12); }
  else if(kind === 'sax'){ o.type = 'square'; f.frequency.value = 1500; f.Q.value = 3; env(.05, .15); const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = 5; lg.gain.value = hz*.008; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + d + 1); }
  else if(kind === 'flute'){ o.type = 'sine'; f.frequency.value = 3000; env(.06, .2); const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = 4.5; lg.gain.value = hz*.005; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + d + 1); }
  else if(kind === 'pad'){ o.type = 'triangle'; f.frequency.value = 900; env(.8, 1.2); }
  else if(kind === 'bell' || kind === 'kalimba'){ o.type = 'sine'; f.frequency.value = 5000; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + (kind === 'bell' ? 2.4 : .9)); d = kind === 'bell' ? 2.5 : 1; const o2 = AC.createOscillator(), g2 = AC.createGain(); o2.frequency.value = hz*(kind === 'bell' ? 2.76 : 3); g2.gain.setValueAtTime(v*.3, t); g2.gain.exponentialRampToValueAtTime(.0001, t + .5); o2.connect(g2); g2.connect(out); o2.start(t); o2.stop(t + 1); }
  else if(kind === 'marimba'){ o.type = 'triangle'; f.frequency.value = 2400; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .45); d = .5; }
  else if(kind === 'pluck'){ o.type = 'sawtooth'; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(500, t + .3); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .8); d = .9; }
  else { o.type = 'triangle'; f.frequency.value = 2200; const o2 = AC.createOscillator(); o2.type = 'sine'; o2.frequency.value = hz*2; const g2 = AC.createGain(); g2.gain.setValueAtTime(v*.25, t); g2.gain.exponentialRampToValueAtTime(.0001, t + .6); o2.connect(g2); g2.connect(out); o2.start(t); o2.stop(t + 1); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + Math.max(.6, d*1.6)); d = Math.max(.7, d*1.7); } // 'epiano'
  o.connect(f); f.connect(g); g.connect(out); o.start(t); o.stop(t + d + 1.2); }
// demo phrases for the instrument corners (tap the corner)
const V45A_DEMO = {violin:[[76, .5], [74, .5], [72, .5], [74, .5], [76, 1], [79, 1.5]], trumpet:[[67, .3], [72, .3], [76, .3], [79, .9], [76, .3], [79, 1.2]], flute:[[81, .6], [79, .3], [76, .3], [74, .6], [72, .6], [74, 1.4]], sax:[[62, .4], [65, .3], [67, .3], [70, .5], [69, .3], [67, 1.4]]};
function v45aDemo(k){ const I = V45A_INST.find(i => i.k === k); if(!I) return; if(k === 'piano'){ try { openMusic('piano'); } catch(e){} toast(I.ic + ' ' + I.f); return; }
  try { ensureAC(); const out = v45aSfxOut(); let t = AC.currentTime + .05; V45A_DEMO[k].forEach(([m, d]) => { v45aVoice(k, m, t, d*.95, .14, out); t += d*.62; }); V45A.demo = {k, end:performance.now() + (t - AC.currentTime)*1000}; } catch(e){}
  toast(`${I.ic} ${I.n}: ${I.f}`); try { activity('inst_' + k, 6); } catch(e){} }
// the opera piece: "Ode to Joy" (Beethoven, Symphony No. 9, public domain), melody on flute + trumpet, strings below
const V45A_ODE = [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62, 0, 64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 62, 60, 60, 0];
const V45A_ODE_CH = [[48, 55, 64], [43, 55, 62], [48, 55, 64], [43, 55, 62], [48, 55, 64], [43, 55, 62], [48, 55, 64], [43, 55, 60]];
function v45aOpera(){ if(V45A.perf && performance.now() < V45A.perf.end){ toast('🎼 Dàn nhạc đang biểu diễn, hãy ngồi nghe nhé!'); return; }
  let dur = 0; try { ensureAC(); const out = v45aSfxOut(), b = .42, t0 = AC.currentTime + .1; V45A_ODE.forEach((m, i) => { if(m){ v45aVoice('flute', m + 12, t0 + i*b, b*(i % 4 === 3 ? 1.6 : .95), .09, out); if(i >= 16) v45aVoice('trumpet', m, t0 + i*b, b*.9, .05, out); } });
    V45A_ODE_CH.forEach((c, k) => c.forEach((m, j) => v45aVoice(j ? 'strings' : 'cello', m, t0 + k*4*b, 4*b, j ? .035 : .05, out))); dur = V45A_ODE.length*b;
    setTimeout(() => { try { const t = AC.currentTime; for(let k=0;k<26;k++){ const s = AC.createBufferSource(); s.buffer = noise(); const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500 + Math.random()*1500; const g = AC.createGain(); const w = t + k*.11 + Math.random()*.05; g.gain.setValueAtTime(.05, w); g.gain.exponentialRampToValueAtTime(.0001, w + .07); s.connect(f); f.connect(g); g.connect(out); s.start(w); s.stop(w + .1); } } catch(e){} }, dur*1000 + 300); } catch(e){ dur = 13; }
  V45A.perf = {end:performance.now() + dur*1000}; toast('🎼 Dàn nhạc học sinh biểu diễn “Ode to Joy” – Giao hưởng số 9 của Beethoven (1824)'); try { activity('opera', 12); } catch(e){} }
// background music: a slow generative piece per area (all made in code, nothing downloaded)
const V45A_BGM = {
  school:{root:60, sc:[0, 2, 4, 7, 9], ch:[0, 9, 5, 7], bpm:84, ins:'epiano', bass:'pad', dens:.55},
  class:{root:65, sc:[0, 2, 4, 7, 9], ch:[0, 5, 2, 7], bpm:64, ins:'epiano', bass:'pad', dens:.3},
  library:{root:62, sc:[0, 2, 5, 7, 9], ch:[0, 7, 5, 0], bpm:56, ins:'epiano', bass:'pad', dens:.22},
  park:{root:67, sc:[0, 2, 4, 7, 9], ch:[0, 5, 7, 0], bpm:92, ins:'kalimba', bass:'pad', dens:.55},
  forest:{root:62, sc:[0, 2, 3, 7, 9], ch:[0, 10, 5, 0], bpm:68, ins:'flute', bass:'pad', dens:.28},
  zen:{root:57, sc:[0, 3, 5, 7, 10], ch:[0, 0, 5, 3], bpm:44, ins:'bell', bass:'pad', dens:.18},
  market:{root:65, sc:[0, 2, 4, 7, 10], ch:[0, 5, 10, 7], bpm:104, ins:'marimba', bass:'pluck', dens:.6},
  crowd:{root:67, sc:[0, 2, 4, 7, 9], ch:[0, 5, 7, 5], bpm:110, ins:'marimba', bass:'pluck', dens:.45},
  farm:{root:67, sc:[0, 2, 4, 7, 9], ch:[0, 5, 0, 7], bpm:96, ins:'pluck', bass:'pad', dens:.5},
  sea:{root:58, sc:[0, 2, 4, 7, 9], ch:[0, 5, 9, 7], bpm:72, ins:'pluck', bass:'pad', dens:.35},
  town:{root:63, sc:[0, 2, 4, 7, 9], ch:[0, 8, 5, 7], bpm:80, ins:'epiano', bass:'pad', dens:.45},
  night:{root:64, sc:[0, 3, 5, 7, 10], ch:[0, 8, 3, 10], bpm:54, ins:'bell', bass:'pad', dens:.25},
  opera:{root:60, sc:[0, 2, 4, 5, 7, 9, 11], ch:[0, 5, 7, 0], bpm:66, ins:'strings', bass:'cello', dens:.3},
  deep:{root:50, sc:[0, 3, 5, 7, 10], ch:[0, 5, 3, 0], bpm:40, ins:'pad', bass:'pad', dens:.15},
  kart:{root:65, sc:[0, 2, 4, 7, 9], ch:[0, 5, 7, 5], bpm:120, ins:'marimba', bass:'pluck', dens:.5}
};
function v45aBgmTick(){ const B = V45A.bgm; try {
  const want = typeof AMB !== 'undefined' && AMB.on && AMB.started && !document.hidden && !(typeof musicOn !== 'undefined' && musicOn) && !(V45A.perf && performance.now() < V45A.perf.end + 2500) && !openModal;
  if(!want){ if(B.out) B.out.gain.setTargetAtTime(0, AC.currentTime, .4); B.zone = null; return; }
  const z = AMB.zone, P = V45A_BGM[z]; const out = v45aOut(); out.gain.setTargetAtTime(P ? Math.max(0, Math.min(1, (AMB.vol || .5)*1.1)) : 0, AC.currentTime, .8); if(!P) return;
  if(B.zone !== z){ B.zone = z; B.nextT = AC.currentTime + .3; B.step = 0; B.last = P.root + P.sc[2]; }
  const beat = 60/P.bpm/2; // eighth notes
  while(B.nextT < AC.currentTime + .5){ const i = B.step, bar = Math.floor(i/8) % 4, chord = P.root + P.ch[bar], t = B.nextT;
    if(i % 8 === 0){ v45aVoice(P.bass, chord - 24, t, beat*8, P.bass === 'pad' ? .05 : .06, out); if(P.ins !== 'strings') v45aVoice('pad', chord - 12 + 7, t, beat*8, .022, out); else [0, 4, 7].forEach(k => v45aVoice('strings', chord - 12 + k, t, beat*8, .02, out)); }
    if(Math.random() < P.dens*(i % 2 ? .6 : 1)){ const sc = P.sc, deg = sc.map(x => P.root + x).concat(sc.map(x => P.root + 12 + x)); let m = B.last + (Math.random() < .5 ? -1 : 1)*(1 + Math.floor(Math.random()*2)); const near = deg.reduce((a, b) => Math.abs(b - m) < Math.abs(a - m) ? b : a, deg[0]); B.last = near;
      v45aVoice(P.ins, near, t, beat*(P.ins === 'flute' || P.ins === 'strings' ? 3 : 1.6), P.ins === 'bell' ? .04 : P.ins === 'strings' ? .03 : .045, out); }
    B.nextT += beat; B.step++; }
  } catch(e){} }
// ---------- 5. zen: a richer, peaceful sound garden ----------
function v45aZenEvent(out){ const t = AC.currentTime, r = Math.random();
  if(r < .3){ v45aVoice('bell', 45 + (Math.random() < .5 ? 0 : 7), t, 4, .09, out); return 6 + Math.random()*5; } // singing bowl
  if(r < .6){ const pent = [81, 84, 86, 88, 91, 93]; for(let k=0;k<4 + Math.floor(Math.random()*3);k++) v45aVoice('bell', pent[Math.floor(Math.random()*pent.length)], t + k*.22 + Math.random()*.1, 2, .025, out); return 4 + Math.random()*4; } // wind chimes
  if(r < .8){ const ph = [[69, .9], [72, .6], [74, 1.4], [72, .6], [69, 1.8]]; let w = t; ph.forEach(([m, d]) => { v45aVoice('flute', m, w, d, .045, out); w += d; }); return 9 + Math.random()*5; } // bamboo flute
  for(let k=0;k<3;k++){ const o = AC.createOscillator(), g = AC.createGain(), f0 = 2800 + Math.random()*900; o.frequency.setValueAtTime(f0, t + k*.13); o.frequency.exponentialRampToValueAtTime(f0*1.35, t + k*.13 + .09); g.gain.setValueAtTime(.025, t + k*.13); g.gain.exponentialRampToValueAtTime(.0001, t + k*.13 + .1); o.connect(g); g.connect(out); o.start(t + k*.13); o.stop(t + k*.13 + .12); } return 3 + Math.random()*3; } // birds
// ---------- init ----------
function v45ArtsInit(){
  // the new land + its region
  R.opera = {name:'Đồi Âm Nhạc & Nhà hát Opera', x:V45A_MH.x, y:V45A_MH.y, w:V45A_MH.w, h:V45A_MH.h, open:true}; ROOM_ORDER.unshift('opera');
  try { AMB_NAMES.opera = 'Đồi Âm Nhạc'; } catch(e){}
  const az = ambZone; ambZone = function(){ const p = PLAYER && PLAYER.visible ? PLAYER : {x:cam.x, y:cam.y}; if(v45aIn(V45A_MH, p.x, p.y)) return 'opera'; return az.apply(this, arguments); };
  const ab = ambBed; ambBed = function(zone, out){ if(zone === 'opera') return [...ambNoise(out, 'highpass', 2500, .5, .025, .3, .3)]; if(zone === 'zen') return ab.apply(this, arguments).concat([...ambNoise(out, 'bandpass', 2600, 2, .012, .4, .6)]); return ab.apply(this, arguments); };
  const ae = ambEvent; ambEvent = function(zone, out){ if(zone === 'zen') return v45aZenEvent(out); if(zone === 'opera'){ for(let k=0;k<3;k++){ const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + k*.14, f0 = 3200 + Math.random()*800; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0*1.3, t + .08); g.gain.setValueAtTime(.02, t); g.gain.exponentialRampToValueAtTime(.0001, t + .1); o.connect(g); g.connect(out); o.start(t); o.stop(t + .12); } return 3 + Math.random()*4; } return ae.apply(this, arguments); };
  // walking: the hill and its stairs are open ground
  const cm = canMove; canMove = function(ox, oy, nx, ny){ const inN = v45aIn(V45A_MH, nx, ny) || v45aOnStair(nx, ny), inO = v45aIn(V45A_MH, ox, oy, 2) || v45aOnStair(ox, oy);
    if(inN && (inO || (v45aOnStair(nx, ny) && oy > ny - 12))){ if(ny < V45A_MH.y + 24 || nx < V45A_MH.x + 14 || nx > V45A_MH.x + V45A_MH.w - 14) return false; if(ny > V45A_MH.y + V45A_MH.h - 8 && !(nx >= V45A_STAIR.x && nx <= V45A_STAIR.x + V45A_STAIR.w)) return false; return true; }
    return cm.apply(this, arguments); };
  // static art: temple (ground cache) and the open painters' meadow (north cache); rebuild both caches once
  const de = drawEastStatic; drawEastStatic = function(){ const r = de.apply(this, arguments); try { v45aTemple(); } catch(e){ console.warn('v45a temple', e); } return r; };
  const dz = drawZonesStatic; drawZonesStatic = function(){ const r = dz.apply(this, arguments); try { v45aArtStatic(); } catch(e){ console.warn('v45a art', e); } return r; };
  groundCache = null; northCache = null; const si = SOFT_ZONES.indexOf('art'); if(si >= 0) SOFT_ZONES.splice(si, 1);
  // the hill is drawn after the sky, before the sprites
  const nd = drawNorthDyn; drawNorthDyn = function(){ const r = nd.apply(this, arguments); try { v45aMHDraw(); } catch(e){} return r; };
  const es = extSprites; extSprites = function(sp){ es(sp); const t = realT; try { v45aZenSprites(sp, t); v45aArtSprites(sp, t); v45aMHSprites(sp, t); } catch(e){} };
  // taps: instrument corners, the opera stage
  V45A_INST.forEach(I => XHOT.unshift({r:{x:I.x - 52, y:I.y - 50, w:104, h:96}, f:() => v45aDemo(I.k)}));
  XHOT.unshift({r:{x:V45A_OP.x + 40, y:V45A_MH.y + 20, w:V45A_OP.w - 80, h:V45A_MH.h - 40}, f:() => v45aOpera()});
  // background music scheduler
  setInterval(v45aBgmTick, 200);
}
