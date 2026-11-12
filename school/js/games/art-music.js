// ================= EXT: GENERATIVE PAINTINGS (NPC "AI" ARTISTS) =================
function rng(seed){ let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0)/4294967296; }; }
const ART_STYLES = {
  bien:['Hoàng hôn trên biển','Biển chiều','Thuyền về bến'], nui:['Đồi thông sương sớm','Núi đồi Đà Lạt','Thung lũng mây'], xoay:['Đêm sao xoáy','Bầu trời quay tròn','Giấc mơ đêm'],
  truutuong:['Giai điệu màu sắc','Vòng tròn và đường thẳng','Bản nhạc hình học'], hoa:['Cánh đồng mùa hè','Vườn hoa trong gió','Mùa hoa nở'], pho:['Phố lên đèn','Thành phố về đêm','Ánh đèn bên sông'],
  koi:['Hồ cá Koi','Cá chép bơi vòng','Mặt hồ yên ả'], cay:['Cây thu lá đỏ','Cây cổ thụ','Mùa lá rơi']
};
const ART_ADJ = ['rực rỡ','dịu dàng','mơ màng','lấp lánh','yên bình','bí ẩn','ấm áp','trong veo'];
function genPainting(seed, artist){
  const R = rng(seed), pick = a => a[Math.floor(R()*a.length)], st = pick(Object.keys(ART_STYLES)), S = [];
  const pal = pick([['#ff7e5f','#feb47b','#ffd194','#6a82fb','#fc5c7d'],['#355c7d','#6c5b7b','#c06c84','#f67280','#f8b195'],['#2a9d8f','#e9c46a','#f4a261','#e76f51','#264653'],['#8ecae6','#219ebc','#023047','#ffb703','#fb8500'],['#606c38','#283618','#fefae0','#dda15e','#bc6c25']]);
  const W2 = 160, H2 = 120;
  const stroke = (c, x1, y1, x2, y2, w, col, a) => { c.globalAlpha = a == null ? .85 : a; c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo((x1 + x2)/2 + (R() - .5)*w*2, (y1 + y2)/2 + (R() - .5)*w*2, x2, y2); c.stroke(); c.globalAlpha = 1; };
  const dab = (c, x, y, r, col, a) => { c.globalAlpha = a == null ? .8 : a; c.fillStyle = col; c.beginPath(); c.ellipse(x, y, r, r*(.6 + R()*.5), R()*3, 0, Math.PI*2); c.fill(); c.globalAlpha = 1; };
  const sky = (top, bot, hy) => { for(let y=0; y<hy; y+=4){ const k = y/hy; S.push(c => { const g = c.createLinearGradient(0, 0, 0, hy); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(0, y, W2, 5); for(let i=0;i<3;i++) stroke(c, R()*W2, y + R()*4, R()*W2, y + R()*4, 3, k < .5 ? top : bot, .25); }); } };
  S.push(c => { c.fillStyle = '#f7f2e8'; c.fillRect(0, 0, W2, H2); });
  if(st === 'bien'){ const hy = 64; sky(pal[3], pal[1], hy); const sx = 30 + R()*100; S.push(c => { dab(c, sx, hy - 14, 14, '#fff3b0', .95); });
    for(let y=hy; y<H2; y+=3) S.push(c => { for(let i=0;i<4;i++){ const x = R()*W2; stroke(c, x, y, x + 10 + R()*20, y + R()*2, 2.5, pick([pal[4], pal[3], '#2b4c7e']), .7); } if(R() < .6) stroke(c, sx - 8 + R()*16, y, sx - 8 + R()*16 + 6, y, 1.5, '#fff3b0', .8); });
    for(let k=0;k<3;k++){ const bx = R()*140, by = hy + 8 + R()*30; S.push(c => { c.fillStyle = '#3a2410'; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + 14, by); c.lineTo(bx + 11, by + 4); c.lineTo(bx + 3, by + 4); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(bx + 7, by - 12); c.lineTo(bx + 7, by - 1); c.lineTo(bx + 13, by - 1); c.fill(); }); }
    for(let k=0;k<5;k++){ const x = R()*150, y = 10 + R()*30; S.push(c => stroke(c, x, y, x + 4, y - 2, 1.2, '#222', .8)); } }
  else if(st === 'nui'){ sky('#bfe3f2', '#fdf0d5', 70); for(let L=0; L<3; L++){ const base = 60 + L*16, col = ['#7d8fb3','#5b7f6e','#2f5d48'][L]; for(let x=0;x<W2;x+=6){ const h = 18 + Math.sin(x*.05 + L*2 + seed)*12 + R()*6; S.push(c => stroke(c, x, base + 30, x + 3, base - h + 20, 7, col, .9)); } }
    for(let k=0;k<26;k++){ const x = R()*W2, y = 92 + R()*24; S.push(c => { c.fillStyle = '#1e3d2f'; c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + 4, y); c.lineTo(x, y - 14); c.fill(); }); }
    for(let k=0;k<8;k++){ const y = 70 + R()*20; S.push(c => stroke(c, 0, y, W2, y + R()*4, 5, '#ffffff', .25)); } }
  else if(st === 'xoay'){ S.push(c => { c.fillStyle = '#0d1b4c'; c.fillRect(0, 0, W2, H2); }); const cs = [[40 + R()*30, 30 + R()*20], [100 + R()*40, 40 + R()*20]];
    for(let k=0;k<70;k++){ const [cx, cy] = pick(cs), r = 6 + R()*30, a = R()*6; S.push(c => { c.globalAlpha = .7; c.strokeStyle = pick(['#3a5fcd','#6fa8dc','#f1e3a0','#89b4f0','#2c3e8f']); c.lineWidth = 2 + R()*2; c.beginPath(); c.arc(cx, cy, r, a, a + 1 + R()*2); c.stroke(); c.globalAlpha = 1; }); }
    for(let k=0;k<12;k++){ const x = R()*W2, y = R()*70; S.push(c => { dab(c, x, y, 5, '#f7e27a', .35); dab(c, x, y, 2, '#fffbe0', .95); }); }
    S.push(c => dab(c, 140, 18, 9, '#ffe066', .95));
    S.push(c => { c.fillStyle = '#10241a'; c.beginPath(); c.moveTo(18, H2); c.quadraticCurveTo(8, 60, 24, 24); c.quadraticCurveTo(34, 70, 32, H2); c.fill(); });
    for(let k=0;k<8;k++){ const x = 50 + k*13; S.push(c => { c.fillStyle = '#1c2a44'; c.fillRect(x, 96, 10, 24); c.fillStyle = '#ffd54f'; c.fillRect(x + 3, 102, 3, 3); }); } }
  else if(st === 'truutuong'){ S.push(c => { c.fillStyle = pick(['#f4ecd8','#e9f1f7','#fff1e6']); c.fillRect(0, 0, W2, H2); });
    for(let k=0;k<7;k++){ const x = R()*W2, y = R()*H2, r = 6 + R()*22, col = pick(pal); S.push(c => { c.globalAlpha = .85; c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI*2); c.fill(); c.strokeStyle = '#1a1206'; c.lineWidth = 1.5; c.stroke(); c.fillStyle = pick(pal); c.beginPath(); c.arc(x, y, r*.5, 0, Math.PI*2); c.fill(); c.globalAlpha = 1; }); }
    for(let k=0;k<12;k++){ const x = R()*W2, y = R()*H2; S.push(c => { c.strokeStyle = '#1a1206'; c.lineWidth = 1 + R()*2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (R() - .5)*120, y + (R() - .5)*80); c.stroke(); }); }
    for(let k=0;k<6;k++){ const x = R()*W2, y = R()*H2; S.push(c => { c.fillStyle = pick(pal); c.fillRect(x, y, 6 + R()*20, 4 + R()*14); }); } }
  else if(st === 'hoa'){ sky('#9ad0f5', '#e8f6ff', 50); for(let y=50; y<H2; y+=4) S.push(c => stroke(c, 0, y + Math.sin(y)*3, W2, y + 3, 6, pick(['#6a9a3a','#7fb04a','#5b8a32']), .9));
    for(let k=0;k<26;k++) S.push(c => { for(let i=0;i<8;i++){ const y = 58 + R()*62, x = R()*W2; dab(c, x, y, 1.5 + (y - 50)/30, pick(['#ff6f91','#ffd23f','#ffffff','#b06bff','#ff8a2b','#ef4b4b']), .9); } });
    S.push(c => { c.fillStyle = '#5a3a1e'; c.fillRect(120, 30, 5, 30); for(let i=0;i<14;i++) dab(c, 122 + (R() - .5)*30, 28 + (R() - .5)*18, 7, pick(['#2e7d32','#388e3c','#43a047']), .9); }); }
  else if(st === 'pho'){ sky('#1d2b64', '#f8cdda', 80); for(let k=0;k<14;k++){ const x = k*12 + R()*4, h = 30 + R()*50, w = 10 + R()*6; S.push(c => { c.fillStyle = pick(['#232946','#2e3440','#393e5c']); c.fillRect(x, 80 - h, w, h); for(let wy = 80 - h + 4; wy < 76; wy += 6) for(let wx = x + 2; wx < x + w - 2; wx += 4) if(R() < .5){ c.fillStyle = pick(['#ffd54f','#fff3b0','#ffb74d']); c.fillRect(wx, wy, 2, 3); } }); }
    for(let y=82; y<H2; y+=3) S.push(c => { c.fillStyle = '#1b2440'; c.fillRect(0, y, W2, 3); for(let i=0;i<5;i++) stroke(c, R()*W2, y, R()*W2, y + 1, 1.2, pick(['#ffd54f','#ffb74d','#f8cdda']), .5); }); }
  else if(st === 'koi'){ S.push(c => { c.fillStyle = '#1f6f78'; c.fillRect(0, 0, W2, H2); }); for(let k=0;k<20;k++) S.push(c => stroke(c, R()*W2, R()*H2, R()*W2, R()*H2, 6, pick(['#237a85','#2a8c8f','#1a5c66']), .4));
    for(let k=0;k<6;k++){ const x = R()*W2, y = R()*H2; S.push(c => { dab(c, x, y, 10, '#3f8f3f', .95); c.fillStyle = '#1f6f78'; c.beginPath(); c.moveTo(x, y); c.arc(x, y, 10, 0, .6); c.fill(); }); }
    for(let k=0;k<7;k++){ const x = 20 + R()*120, y = 15 + R()*90, a = R()*6, col = pick(['#ff7043','#ffffff','#ffca28']); S.push(c => { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, 9, 3.5, 0, 0, Math.PI*2); c.fill(); c.beginPath(); c.moveTo(-8, 0); c.lineTo(-14, -4); c.lineTo(-14, 4); c.fill(); if(col === '#ffffff'){ c.fillStyle = '#ff5722'; c.fillRect(-2, -2, 4, 3); } c.restore(); }); } }
  else { sky(pick(['#fbe3c4','#d7e8f5']), '#fff7ea', 120); S.push(c => { c.fillStyle = '#7a5a3a'; c.fillRect(0, 104, W2, 16); });
    const br = (x, y, a, l, d) => { if(d > 6) return; const x2 = x + Math.cos(a)*l, y2 = y + Math.sin(a)*l; S.push(c => stroke(c, x, y, x2, y2, Math.max(1, 7 - d), '#4e342e', .95)); br(x2, y2, a - .35 - R()*.3, l*.75, d + 1); br(x2, y2, a + .35 + R()*.3, l*.75, d + 1); if(d > 3) S.push(c => { for(let i=0;i<4;i++) dab(c, x2 + (R() - .5)*12, y2 + (R() - .5)*10, 3, pick(['#e65100','#ff8f00','#c62828','#ffb300']), .85); }); };
    br(80, 110, -Math.PI/2, 30, 0); for(let k=0;k<20;k++){ const x = R()*W2; S.push(c => dab(c, x, 106 + R()*10, 2, pick(['#e65100','#ffb300']), .9)); } }
  S.push(c => { c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 1; for(let i=0;i<40;i++){ const x = R()*W2, y = R()*H2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 2, y + 1); c.stroke(); } c.font = '7px sans-serif'; c.fillStyle = 'rgba(0,0,0,.45)'; c.fillText(artist || '', 120, 116); });
  return {steps:S, title:`${pick(ART_STYLES[st])} ${pick(ART_ADJ)}`, artist, style:st};
}
var EASELS = [], GALLERY = [];
function easelInit(){ for(let i=0;i<4;i++){ const cv = document.createElement('canvas'); cv.width = 160; cv.height = 120; EASELS.push({cv, gen:null, k:0, t:0, hold:0, col:'#ef4b4b', artist:''}); } }
function easelUpdate(dt){
  if(!isDay()) return;
  EASELS.forEach((E, i) => {
    if(!E.gen){ E.artist = 'Bạn ' + NPC_NAMES[(i*3 + Math.floor(realT/40)) % NPC_NAMES.length]; E.gen = genPainting(Math.floor(Math.random()*1e9), E.artist); E.k = 0; E.hold = 0; }
    if(E.k < E.gen.steps.length){ E.t -= dt; if(E.t <= 0){ E.t = .12; const c = E.cv.getContext('2d'); E.gen.steps[E.k++](c); E.col = ['#ef4b4b','#3d7bff','#ffd23f','#2fbf71','#b06bff'][E.k % 5]; } }
    else { if(E.hold === 0){ addGallery(E.cv.toDataURL('image/jpeg', .8), E.gen.title, E.artist, true); log('event', `${E.artist} vẽ xong bức "${E.gen.title}" ở Góc họa sĩ.`); } E.hold += dt; if(E.hold > 10) E.gen = null; }
  });
}
function addGallery(src, title, artist, npc){ GALLERY.unshift({src, title, artist, npc}); const npcs = GALLERY.filter(g => g.npc); if(npcs.length > 16) GALLERY.splice(GALLERY.lastIndexOf(npcs[npcs.length - 1]), 1); if(!npc) saveGallery(); if(openModal && openModal.id === 'mPaint') renderGallery(); }
function saveGallery(){ try { localStorage.setItem('truong-gallery-v1', JSON.stringify(GALLERY.filter(g => !g.npc).slice(0, 8))); } catch(e){ toast('Bộ nhớ trình duyệt đầy, không lưu thêm tranh được.'); } }
function loadGallery(){ try { const a = JSON.parse(localStorage.getItem('truong-gallery-v1') || '[]'); if(Array.isArray(a)) a.forEach(g => GALLERY.push(g)); } catch(e){} }
function renderGallery(){
  const box = $('#gallery'); box.innerHTML = '';
  if(!GALLERY.length){ box.appendChild(el('p', {className:'now'}, 'Chưa có bức tranh nào. Hãy vẽ hoặc bấm "Để bạn NPC vẽ".')); return; }
  GALLERY.forEach(g => { const f = el('figure', {className:'gitem'}); const im = el('img', {src:g.src, alt:g.title}); const cap = el('figcaption'); cap.textContent = `${g.title} · ${g.artist}${g.npc ? '' : ' (bạn vẽ)'}`; f.appendChild(im); f.appendChild(cap); box.appendChild(f); });
}

// ================= EXT: PAINT =================
var PAINT = {tool:'brush', col:'#ef4b4b', size:10, undo:[], drawing:false, lx:0, ly:0, npc:null};
const PCOLS = ['#111111','#ffffff','#9e9e9e','#ef4b4b','#ff8a2b','#ffd23f','#2fbf71','#26c6da','#3d7bff','#1d2c52','#b06bff','#ff6f91','#8d5a3a','#f2c9a0','#7cb342','#004d40'];
function paintInit(){
  const cv = $('#paintCv'), c = cv.getContext('2d'); cv.width = 720; cv.height = 480; c.fillStyle = '#fff'; c.fillRect(0, 0, 720, 480);
  const pal = $('#ppal'); PCOLS.forEach(col => { const b = el('button', {type:'button', className:'swatch'}); b.style.background = col; b.setAttribute('aria-label', 'Màu ' + col); b.onclick = () => { PAINT.col = col; $('#pcolor').value = col; pal.querySelectorAll('.swatch').forEach(x => x.setAttribute('aria-pressed', x === b)); }; pal.appendChild(b); });
  $('#pcolor').oninput = e => { PAINT.col = e.target.value; };
  $('#psize').oninput = e => { PAINT.size = +e.target.value; };
  document.querySelectorAll('#ptools button').forEach(b => b.onclick = () => { PAINT.tool = b.dataset.t; document.querySelectorAll('#ptools button').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left)/r.width*720, (e.clientY - r.top)/r.height*480]; };
  cv.addEventListener('pointerdown', e => { if(PAINT.npc) return; e.preventDefault(); cv.setPointerCapture(e.pointerId); pushUndo(); const [x, y] = pos(e); if(PAINT.tool === 'fill'){ flood(c, Math.floor(x), Math.floor(y), PAINT.col); return; } PAINT.drawing = true; PAINT.lx = x; PAINT.ly = y; paintAt(c, x, y, x, y); });
  cv.addEventListener('pointermove', e => { if(!PAINT.drawing) return; const [x, y] = pos(e); paintAt(c, PAINT.lx, PAINT.ly, x, y); PAINT.lx = x; PAINT.ly = y; });
  ['pointerup','pointercancel'].forEach(ev => cv.addEventListener(ev, () => { if(PAINT.drawing) mprog('paint'); PAINT.drawing = false; }));
  $('#pundo').onclick = () => { const d = PAINT.undo.pop(); if(d) c.putImageData(d, 0, 0); };
  $('#pclear').onclick = () => { pushUndo(); c.fillStyle = '#fff'; c.fillRect(0, 0, 720, 480); };
  $('#psave').onclick = () => { const t = ($('#ptitle').value || 'Tranh không tên').slice(0, 40); const sm = document.createElement('canvas'); sm.width = 360; sm.height = 240; sm.getContext('2d').drawImage(cv, 0, 0, 360, 240); addGallery(sm.toDataURL('image/jpeg', .75), t, ($('#partist').value || 'Bạn').slice(0, 20), false); toast('Đã treo tranh lên phòng tranh!'); mprog('paint'); renderGallery(); };
  $('#pnpc').onclick = npcPaint;
  const sel = $('#partist'); [...students.map(s => s.name), 'Cô Hà', 'Cô Xuân', 'Hà Quân'].forEach(n => sel.appendChild(el('option', {value:n}, n)));
}
function pushUndo(){ const c = $('#paintCv').getContext('2d'); PAINT.undo.push(c.getImageData(0, 0, 720, 480)); if(PAINT.undo.length > 15) PAINT.undo.shift(); }
function paintAt(c, x1, y1, x2, y2){
  const s = PAINT.size;
  if(PAINT.tool === 'spray'){ c.fillStyle = PAINT.col; for(let i=0;i<s*2;i++){ const a = Math.random()*6.28, r = Math.random()*s*1.6; c.fillRect(x2 + Math.cos(a)*r, y2 + Math.sin(a)*r, 1.6, 1.6); } return; }
  c.strokeStyle = PAINT.tool === 'eraser' ? '#ffffff' : PAINT.col; c.lineWidth = PAINT.tool === 'eraser' ? s*2 : s; c.lineCap = 'round'; c.lineJoin = 'round';
  c.globalAlpha = PAINT.tool === 'water' ? .25 : 1; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2 + .01, y2); c.stroke(); c.globalAlpha = 1;
}
function flood(c, x, y, col){
  const W3 = 720, H3 = 480, im = c.getImageData(0, 0, W3, H3), d = im.data, i0 = (y*W3 + x)*4, t = [d[i0], d[i0+1], d[i0+2]];
  const tmp = document.createElement('canvas').getContext('2d'); tmp.fillStyle = col; tmp.fillRect(0, 0, 1, 1); const f = tmp.getImageData(0, 0, 1, 1).data;
  if(Math.abs(t[0] - f[0]) + Math.abs(t[1] - f[1]) + Math.abs(t[2] - f[2]) < 10) return;
  const st = [x, y], same = k => Math.abs(d[k] - t[0]) + Math.abs(d[k+1] - t[1]) + Math.abs(d[k+2] - t[2]) < 60;
  while(st.length){ const yy = st.pop(), xx = st.pop(); let k = (yy*W3 + xx)*4; if(xx < 0 || yy < 0 || xx >= W3 || yy >= H3 || !same(k)) continue; d[k] = f[0]; d[k+1] = f[1]; d[k+2] = f[2]; d[k+3] = 255; st.push(xx + 1, yy, xx - 1, yy, xx, yy + 1, xx, yy - 1); }
  c.putImageData(im, 0, 0);
}
function npcPaint(){
  if(PAINT.npc) return;
  const who = $('#partist').value || 'Bạn AI', g = genPainting(Math.floor(Math.random()*1e9), who), cv = $('#paintCv'), c = cv.getContext('2d');
  pushUndo(); const off = document.createElement('canvas'); off.width = 160; off.height = 120; const oc = off.getContext('2d');
  PAINT.npc = {g, k:0}; $('#pnpc').disabled = true; $('#pstatus').textContent = `${who} đang sáng tác: "${g.title}"…`;
  const step = () => {
    if(!PAINT.npc) return;
    for(let j=0;j<2 && PAINT.npc.k < g.steps.length; j++) g.steps[PAINT.npc.k++](oc);
    c.imageSmoothingEnabled = true; c.drawImage(off, 0, 0, 720, 480);
    if(PAINT.npc.k < g.steps.length) setTimeout(step, 60);
    else { PAINT.npc = null; $('#pnpc').disabled = false; $('#pstatus').textContent = `${who} đã vẽ xong "${g.title}" và treo lên phòng tranh.`; addGallery(off.toDataURL('image/jpeg', .85), g.title, who, true); mprog('npcart'); renderGallery(); }
  };
  step();
}

// ================= EXT: REAL PIANO (sampled) =================
var PS = {ready:false, loading:false, buf:{}}, pOut = null, pActive = {}, pSustain = false, pHeld = {}, pKeyMap = {}, pBase = 48, pMusicTab = 'piano';
const NOTE_IDX = {C:0, D:2, E:4, F:5, G:7, A:9, B:11};
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const nname = m => NOTE_NAMES[m % 12] + (Math.floor(m/12) - 1);
function parseNote(s){ const r = /^([A-G])(#|b)?(-?\d)$/.exec(s); if(!r) return null; return 12*(+r[3] + 1) + NOTE_IDX[r[1]] + (r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0); }
function pianoOutNode(){ ensureAC(); if(!pOut){ pOut = AC.createGain(); pOut.gain.value = +($('#pvol') ? $('#pvol').value : .8); const comp = AC.createDynamicsCompressor(); pOut.connect(comp); comp.connect(AC.destination); } return pOut; }
function loadPiano(){
  if(PS.ready || PS.loading) return; PS.loading = true; ensureAC();
  const keys = Object.keys(PIANO_B64);
  $('#pload').textContent = 'Đang nạp tiếng đàn piano thật…';
  Promise.all(keys.map(k => { const bin = atob(PIANO_B64[k]), u = new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i] = bin.charCodeAt(i);
    return new Promise(res => { try { AC.decodeAudioData(u.buffer, b => { PS.buf[k] = b; res(); }, () => res()); } catch(e){ res(); } }); }))
    .then(() => { PS.ready = Object.keys(PS.buf).length > 0; PS.loading = false; $('#pload').textContent = PS.ready ? 'Tiếng đàn: piano cơ Salamander Grand (mẫu thu âm thật)' : 'Không nạp được mẫu âm, đang dùng tiếng đàn tổng hợp.'; });
}
function pianoOn(m, vel){
  const out = pianoOutNode(), t = AC.currentTime;
  if(pActive[m]) releaseNote(m, .03);
  if(PS.ready){
    let best = null, bd = 99; for(const k in PS.buf){ const d = Math.abs(+k - m); if(d < bd){ bd = d; best = k; } }
    const src = AC.createBufferSource(); src.buffer = PS.buf[best]; src.playbackRate.value = Math.pow(2, (m - best)/12);
    const g = AC.createGain(); g.gain.value = (vel || .8)*(m > 84 ? .7 : 1); src.connect(g); g.connect(out); src.start(t); pActive[m] = {src, g};
  } else {
    const o = AC.createOscillator(), o2 = AC.createOscillator(), g = AC.createGain(); o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = mtof(m); o2.frequency.value = mtof(m)*2;
    o.connect(g); o2.connect(g); g.connect(out); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime((vel || .8)*.35, t + .01); g.gain.exponentialRampToValueAtTime(.05, t + 1.5); o.start(t); o2.start(t); pActive[m] = {src:o, src2:o2, g};
  }
  keyVis(m, true);
}
function releaseNote(m, tc){ const a = pActive[m]; if(!a) return; const t = AC.currentTime; a.g.gain.cancelScheduledValues(t); a.g.gain.setValueAtTime(a.g.gain.value, t); a.g.gain.setTargetAtTime(0, t, tc || .12); try { a.src.stop(t + .8); if(a.src2) a.src2.stop(t + .8); } catch(e){} delete pActive[m]; }
function pianoOffNote(m){ keyVis(m, false); if(pSustain){ pHeld[m] = true; return; } releaseNote(m); }
function setSustain(on){ pSustain = on; const c = $('#psus'); if(c) c.checked = on; if(!on){ Object.keys(pHeld).forEach(m => { if(!document.querySelector(`#pkeys [data-m="${m}"].down`)) releaseNote(+m); }); pHeld = {}; } }
const PK_LOW = ['KeyZ','KeyS','KeyX','KeyD','KeyC','KeyV','KeyG','KeyB','KeyH','KeyN','KeyJ','KeyM','Comma','KeyL','Period','Semicolon','Slash'];
const PK_UP = ['KeyQ','Digit2','KeyW','Digit3','KeyE','KeyR','Digit5','KeyT','Digit6','KeyY','Digit7','KeyU','KeyI','Digit9','KeyO','Digit0','KeyP','BracketLeft','Equal','BracketRight'];
const PK_LABEL = c => ({Comma:',', Period:'.', Semicolon:';', Slash:'/', BracketLeft:'[', BracketRight:']', Equal:'='}[c] || c.replace('Key','').replace('Digit',''));
function codeToMidi(code){ let i = PK_LOW.indexOf(code); if(i >= 0) return pBase + i; i = PK_UP.indexOf(code); if(i >= 0) return pBase + 12 + i; return null; }
function midiLabels(){ const L = {}; PK_LOW.forEach((c, i) => { (L[pBase + i] = L[pBase + i] || []).push(PK_LABEL(c)); }); PK_UP.forEach((c, i) => { (L[pBase + 12 + i] = L[pBase + 12 + i] || []).unshift(PK_LABEL(c)); }); return L; }
const PMIN = 36, PMAX = 96, WK = 28;
const isBlack = m => [1,3,6,8,10].includes(m % 12);
function keyX(m){ let w = 0; for(let k=PMIN; k<m; k++) if(!isBlack(k)) w++; return isBlack(m) ? w*WK - WK*.3 : w*WK; }
const keyW = m => isBlack(m) ? WK*.6 : WK;
function buildKeys(){
  const box = $('#pkeys'); box.innerHTML = ''; let wc = 0; for(let m=PMIN; m<=PMAX; m++) if(!isBlack(m)) wc++;
  box.style.width = (wc*WK) + 'px'; $('#pfall').width = wc*WK; $('#pfall').style.width = (wc*WK) + 'px';
  const L = midiLabels();
  for(let m=PMIN; m<=PMAX; m++){
    const k = el('button', {type:'button', className:'pk ' + (isBlack(m) ? 'b' : 'w')}); k.dataset.m = m; k.style.left = keyX(m) + 'px'; k.setAttribute('aria-label', nname(m));
    k.innerHTML = `<span class="kl">${(L[m] || []).join(' ')}</span>` + (!isBlack(m) && m % 12 === 0 ? `<span class="kn">${nname(m)}</span>` : '');
    k.addEventListener('pointerdown', e => { e.preventDefault(); try { k.releasePointerCapture(e.pointerId); } catch(x){} pianoOn(m, .8); pianoInput(m); });
    k.addEventListener('pointerenter', e => { if(e.buttons & 1){ pianoOn(m, .7); pianoInput(m); } });
    ['pointerup','pointerleave','pointercancel'].forEach(ev => k.addEventListener(ev, () => { if(k.classList.contains('down')) pianoOffNote(m); }));
    box.appendChild(k);
  }
  $('#poct').textContent = `Phím máy tính: ${nname(pBase)} → ${nname(pBase + 31)}`;
}
function keyVis(m, on){ const k = document.querySelector(`#pkeys [data-m="${m}"]`); if(k) k.classList.toggle('down', on); }
function centerKeys(){ const sc = $('#pscroll'); if(sc) sc.scrollLeft = Math.max(0, keyX(pBase) - 40); }

// ---------- SHEETS ----------
const SHEETS = [
  {t:'Für Elise', a:'Beethoven (1810) · phổ thông', u:.17, n:'E5:1 D#5:1 E5:1 D#5:1 E5:1 B4:1 D5:1 C5:1 A4:3 C4:1 E4:1 A4:1 B4:3 E4:1 G#4:1 B4:1 C5:3 E4:1 E5:1 D#5:1 E5:1 D#5:1 E5:1 B4:1 D5:1 C5:1 A4:3 C4:1 E4:1 A4:1 B4:3 E4:1 C5:1 B4:1 A4:3 B4:1 C5:1 D5:1 E5:3 G4:1 F5:1 E5:1 D5:3 F4:1 E5:1 D5:1 C5:3 E4:1 D5:1 C5:1 B4:3 E4:1 E5:1 D#5:1 E5:1 D#5:1 E5:1 B4:1 D5:1 C5:1 A4:3 C4:1 E4:1 A4:1 B4:3 E4:1 C5:1 B4:1 A4:6'},
  {t:'Ode to Joy (Khúc hoan ca)', a:'Beethoven (1824) · phổ thông', u:.24, n:'E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:3 D4:1 D4:4 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:3 C4:1 C4:4 D4 D4 E4 C4 D4 E4:1 F4:1 E4 C4 D4 E4:1 F4:1 E4 D4 C4 D4 G3:4 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:3 C4:1 C4:4'},
  {t:'Twinkle Twinkle Little Star', a:'Dân ca Pháp · phổ thông', u:.25, n:'C4 C4 G4 G4 A4 A4 G4:4 F4 F4 E4 E4 D4 D4 C4:4 G4 G4 F4 F4 E4 E4 D4:4 G4 G4 F4 F4 E4 E4 D4:4 C4 C4 G4 G4 A4 A4 G4:4 F4 F4 E4 E4 D4 D4 C4:4'},
  {t:'Canon in D', a:'Pachelbel (khoảng 1680) · phổ thông', u:.22, n:'F#5:4 E5:4 D5:4 C#5:4 B4:4 A4:4 B4:4 C#5:4 D5:4 C#5:4 B4:4 A4:4 G4:4 F#4:4 G4:4 E4:4 D4 F#4 A4 G4 F#4 D4 F#4 E4 D4 B3 D4 A4 G4 B4 A4 G4 F#4 D4 E4 C#5 D5 F#5 A5 A4 B4 G4 A4 F#4 D4 D5 D5:3 C#5:1 D5:8'},
  {t:'Gymnopédie No.1', a:'Erik Satie (1888) · phổ thông', u:.3, n:'F#5:2 A5:2 G5:2 F#5:2 C#5:2 B4:2 C#5:2 D5:2 A4:2 F#4:10 -:2 F#5:2 A5:2 G5:2 F#5:2 C#5:2 B4:2 C#5:2 D5:2 A4:2 C#5:6 F#5:6 E5:10'},
  {t:'Minuet in G', a:'Christian Petzold (1725) · phổ thông', u:.2, n:'D5:2 G4:1 A4:1 B4:1 C5:1 D5:2 G4:2 G4:2 E5:2 C5:1 D5:1 E5:1 F#5:1 G5:2 G4:2 G4:2 C5:2 D5:1 C5:1 B4:1 A4:1 B4:2 C5:1 B4:1 A4:1 G4:1 F#4:2 G4:1 A4:1 B4:1 G4:1 B4:2 A4:6 D5:2 G4:1 A4:1 B4:1 C5:1 D5:2 G4:2 G4:2 E5:2 C5:1 D5:1 E5:1 F#5:1 G5:2 G4:2 G4:2 C5:2 D5:1 C5:1 B4:1 A4:1 B4:2 C5:1 B4:1 A4:1 G4:1 A4:2 B4:1 A4:1 G4:1 F#4:1 G4:6'},
  {t:'Turkish March (Hành khúc Thổ Nhĩ Kỳ)', a:'Mozart (1783) · phổ thông, đoạn mở đầu', u:.13, n:'B4:1 A4:1 G#4:1 A4:1 C5:4 D5:1 C5:1 B4:1 C5:1 E5:4 F5:1 E5:1 D#5:1 E5:1 B5:1 A5:1 G#5:1 A5:1 B5:1 A5:1 G#5:1 A5:1 C6:4 A5:2 C6:2 B5:2 A5:2 G5:2 A5:2 B5:2 A5:2 G5:2 A5:2 B5:2 A5:2 G5:2 F#5:2 E5:4'},
  {t:'Prelude in C (Đoạn mở đầu)', a:'J. S. Bach (1722) · phổ thông', u:.15, n:'C4:1 E4:1 G4:1 C5:1 E5:1 G4:1 C5:1 E5:1 C4:1 E4:1 G4:1 C5:1 E5:1 G4:1 C5:1 E5:1 C4:1 D4:1 A4:1 D5:1 F5:1 A4:1 D5:1 F5:1 C4:1 D4:1 A4:1 D5:1 F5:1 A4:1 D5:1 F5:1 B3:1 D4:1 G4:1 D5:1 F5:1 G4:1 D5:1 F5:1 B3:1 D4:1 G4:1 D5:1 F5:1 G4:1 D5:1 F5:1 C4:1 E4:1 G4:1 C5:1 E5:1 G4:1 C5:1 E5:1 C4:1 E4:1 G4:1 C5:1 E5:1 G4:1 C5:1 E5:1 C4:1 E4:1 A4:1 E5:1 A5:1 A4:1 E5:1 A5:1 C4:1 E4:1 A4:1 E5:1 A5:1 A4:1 E5:1 A5:1 C4:1 D4:1 F#4:1 A4:1 D5:1 F#4:1 A4:1 D5:1 C4:1 D4:1 F#4:1 A4:1 D5:1 F#4:1 A4:1 D5:1 B3:1 D4:1 G4:1 D5:1 G5:1 G4:1 D5:1 G5:1 B3:1 D4:1 G4:1 D5:1 G5:1 G4:1 D5:1 G5:4'},
  {t:'Greensleeves', a:'Dân ca Anh · phổ thông', u:.22, n:'A4:2 C5:4 D5:2 E5:3 F5:1 E5:2 D5:4 B4:2 G4:3 A4:1 B4:2 C5:4 A4:2 A4:3 G#4:1 A4:2 B4:4 G#4:2 E4:4 A4:2 C5:4 D5:2 E5:3 F5:1 E5:2 D5:4 B4:2 G4:3 A4:1 B4:2 C5:3 B4:1 A4:2 G#4:3 F#4:1 G#4:2 A4:6'},
  {t:'Sakura Sakura (Hoa anh đào)', a:'Dân ca Nhật Bản · phổ thông', u:.27, n:'A4 A4 B4:4 A4 A4 B4:4 A4 B4 C5 B4 A4 B4:1 A4:1 F4:4 E4 C4 E4 F4 E4 E4:1 C4:1 B3:4 A4 B4 C5 B4 A4 B4:1 A4:1 F4:4 E4 C4 E4 F4 E4 E4:1 C4:1 B3:4 A4 A4 B4:4 A4 A4 B4:4 E4 F4 B4:1 A4:1 F4 E4:8'},
  {t:'Jingle Bells', a:'James Pierpont (1857) · phổ thông', u:.2, n:'E4 E4 E4:4 E4 E4 E4:4 E4 G4 C4:3 D4:1 E4:8 F4 F4 F4:3 F4:1 F4 E4 E4 E4:1 E4:1 E4 D4 D4 E4 D4:4 G4:4 E4 E4 E4:4 E4 E4 E4:4 E4 G4 C4:3 D4:1 E4:8 F4 F4 F4:3 F4:1 F4 E4 E4 E4:1 E4:1 G4 G4 F4 D4 C4:8'},
  {t:'Happy Birthday', a:'Mildred & Patty Hill · phổ thông', u:.24, n:'G4:1.5 G4:.5 A4:2 G4:2 C5:2 B4:4 G4:1.5 G4:.5 A4:2 G4:2 D5:2 C5:4 G4:1.5 G4:.5 G5:2 E5:2 C5:2 B4:2 A4:2 F5:1.5 F5:.5 E5:2 C5:2 D5:2 C5:6'},
  {t:'Brahms Lullaby (Bài hát ru)', a:'Johannes Brahms (1868) · phổ thông', u:.25, n:'E4:1 E4:1 G4:4 E4:1 E4:1 G4:4 E4:1 G4:1 C5:2 B4:3 A4:1 A4:2 G4:2 D4:1 E4:1 F4:2 D4:2 D4:1 E4:1 F4:4 D4:1 F4:1 B4:1 A4:1 G4:2 B4:2 C5:6'},
  {t:'Kìa con bướm vàng', a:'Bài hát thiếu nhi, giai điệu dân gian · phổ thông', u:.24, n:'C4 D4 E4 C4 C4 D4 E4 C4 E4 F4 G4:4 E4 F4 G4:4 G4:1 A4:1 G4:1 F4:1 E4 C4 G4:1 A4:1 G4:1 F4:1 E4 C4 C4 G3 C4:4 C4 G3 C4:4'},
  {t:'Bình minh trên biển', a:'Sáng tác riêng cho trường (nhẹ nhàng, chậm)', u:.22, n:'E5:2 D5:1 C5:1 G4:4 E5:2 D5:1 C5:1 A4:4 F5:2 E5:1 D5:1 C5:2 B4:2 C5:6 -:2 G4:1 A4:1 C5:2 D5:2 E5:4 G5:2 E5:2 D5:2 C5:1 D5:1 E5:6 C5:2 A4:2 B4:2 C5:2 D5:3 C5:1 C5:8'},
  {t:'Gió trên đồi thông', a:'Sáng tác riêng cho trường (điệu valse)', u:.2, n:'E5:2 A5:2 G5:2 E5:4 D5:2 C5:2 D5:2 E5:2 A4:6 C5:2 D5:2 E5:2 G5:4 E5:2 D5:4 C5:2 B4:6 E5:2 A5:2 G5:2 E5:4 D5:2 C5:2 B4:2 C5:2 A4:6 F5:2 E5:2 D5:2 C5:4 B4:2 A4:12'},
  {t:'Mưa nhẹ bên cửa sổ', a:'Sáng tác riêng cho trường (rải hợp âm)', u:.16, n:'A4:1 C5:1 E5:1 C5:1 A4:1 C5:1 E5:1 C5:1 F4:1 A4:1 C5:1 A4:1 F4:1 A4:1 C5:1 A4:1 C4:1 E4:1 G4:1 E4:1 C4:1 E4:1 G4:1 E4:1 G4:1 B4:1 D5:1 B4:1 G4:1 B4:1 D5:4 A4:1 C5:1 E5:1 A5:2 G5:1 E5:1 D5:1 C5:1 D5:1 E5:4 C5:2 B4:2 A4:8'}
];
var userSheets = [];
try { userSheets = JSON.parse(localStorage.getItem('truong-sheets-v1') || '[]') || []; } catch(e){ userSheets = []; }
const allSheets = () => SHEETS.concat(userSheets);
function sheetEvents(sh){ const ev = []; let t = 0; sh.n.trim().split(/\s+/).forEach(tok => { const [nt, d0] = tok.split(':'), d = (d0 ? +d0 : 2)*sh.u; if(nt !== '-'){ nt.split('+').forEach(x => { const m = parseNote(x); if(m != null) ev.push({m, t, d, j:null}); }); } t += d; }); return ev; }
var PG = {ev:[], mode:'off', t:0, i:0, sc:0, combo:0, best:0, hit:0, miss:0, wrong:0, run:false, tempo:1, last:0, auto:{}};
function sheetSelect(){ const sel = $('#psheet'); sel.innerHTML = ''; allSheets().forEach((s, i) => sel.appendChild(el('option', {value:i}, `${s.t} — ${s.a}`))); }
function pgStart(mode){
  const sh = allSheets()[+$('#psheet').value || 0]; if(!sh) return;
  pgStop(); PG.ev = sheetEvents(sh); if(!PG.ev.length){ toast('Bản nhạc trống hoặc sai định dạng.'); return; }
  const lo = Math.min(...PG.ev.map(e => e.m)); pBase = clampV(Math.floor(lo/12)*12, 36, 72); buildKeys(); centerKeys();
  Object.assign(PG, {mode, t:-1.5, i:0, sc:0, combo:0, best:0, hit:0, miss:0, wrong:0, run:true, tempo:+$('#ptempo').value, sheet:sh, auto:{}});
  PG.ev.forEach(e => e.j = null); PG.last = performance.now(); requestAnimationFrame(pgLoop); loadPiano();
  $('#pgstat').textContent = mode === 'demo' ? `Đang tự đàn: ${sh.t}` : mode === 'wait' ? 'Luyện tập: bấm đúng phím đang sáng, nhạc sẽ chờ bạn.' : 'Chơi theo nhịp: bấm khi nốt rơi chạm vạch vàng!';
}
function pgStop(){ PG.run = false; Object.keys(PG.auto || {}).forEach(m => pianoOffNote(+m)); PG.auto = {}; document.querySelectorAll('#pkeys .hint').forEach(k => k.classList.remove('hint')); drawFall(); }
function pgLoop(now){
  if(!PG.run) return;
  if(!openModal || openModal.id !== 'mMusic'){ pgStop(); return; }
  const dt = Math.min(.05, (now - PG.last)/1000)*PG.tempo; PG.last = now;
  if(PG.mode === 'wait'){ const e = PG.ev[PG.i]; if(e && PG.t + dt >= e.t) PG.t = e.t; else PG.t += dt; }
  else PG.t += dt;
  if(PG.mode === 'demo'){ PG.ev.forEach((e, k) => { if(e.j == null && PG.t >= e.t){ e.j = 'auto'; pianoOn(e.m, .75); PG.auto[e.m] = PG.t + e.d*.9; } }); Object.keys(PG.auto).forEach(m => { if(PG.t >= PG.auto[m]){ pianoOffNote(+m); delete PG.auto[m]; } }); }
  if(PG.mode === 'rhythm') PG.ev.forEach(e => { if(e.j == null && PG.t > e.t + .3){ e.j = 'miss'; PG.miss++; PG.combo = 0; } });
  document.querySelectorAll('#pkeys .hint').forEach(k => k.classList.remove('hint'));
  if(PG.mode === 'wait'){ const e = PG.ev[PG.i]; if(e){ const k = document.querySelector(`#pkeys [data-m="${e.m}"]`); if(k) k.classList.add('hint'); } }
  drawFall();
  const end = PG.ev[PG.ev.length - 1]; if(PG.t > end.t + end.d + .8 || (PG.mode === 'wait' && PG.i >= PG.ev.length)){ pgFinish(); return; }
  requestAnimationFrame(pgLoop);
}
function pianoInput(m){
  if(!PG.run || PG.t < -.2) return;
  if(PG.mode === 'wait'){ const e = PG.ev[PG.i]; if(!e) return; if(e.m === m){ e.j = 'ok'; PG.i++; PG.hit++; PG.combo++; PG.sc += 10*Math.min(5, 1 + Math.floor(PG.combo/10)); } else { PG.wrong++; PG.combo = 0; } }
  else if(PG.mode === 'rhythm'){ let best = null, bd = .3; PG.ev.forEach(e => { if(e.j == null && e.m === m && Math.abs(e.t - PG.t) < bd){ bd = Math.abs(e.t - PG.t); best = e; } }); if(best){ best.j = bd < .1 ? 'perfect' : 'good'; PG.hit++; PG.combo++; PG.best = Math.max(PG.best, PG.combo); PG.sc += (bd < .1 ? 100 : 50)*Math.min(4, 1 + Math.floor(PG.combo/8)); } }
  PG.best = Math.max(PG.best, PG.combo);
}
function pgFinish(){
  const tot = PG.ev.length, acc = PG.mode === 'wait' ? Math.round(tot/(tot + PG.wrong)*100) : Math.round(PG.hit/tot*100), sh = PG.sheet, mode = PG.mode;
  pgStop();
  if(mode === 'demo'){ $('#pgstat').textContent = `Đã đàn xong "${sh.t}". Giờ tới lượt bạn!`; return; }
  const grade = acc >= 95 ? 'S' : acc >= 85 ? 'A' : acc >= 70 ? 'B' : acc >= 50 ? 'C' : 'D';
  $('#pgstat').textContent = `Xong "${sh.t}": hạng ${grade} · chính xác ${acc}% · điểm ${PG.sc} · combo cao nhất ${PG.best}`;
  if(acc >= 60){ mprog('piano'); cheerSfx(); }
  log('event', `Bạn đàn bài "${sh.t}" trên piano: hạng ${grade}, chính xác ${acc}%.`);
}
function drawFall(){
  const cv = $('#pfall'); if(!cv) return; const c = cv.getContext('2d'), H2 = cv.height, sp = 150, hitY = H2 - 14;
  c.fillStyle = '#0d1230'; c.fillRect(0, 0, cv.width, H2);
  for(let m=PMIN; m<=PMAX; m++) if(!isBlack(m) && m % 12 === 0){ c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(keyX(m), 0, 1, H2); }
  c.fillStyle = '#ffd23f'; c.fillRect(0, hitY, cv.width, 3);
  if(!PG.ev.length || PG.mode === 'off') { c.font = '20px VT323, monospace'; c.fillStyle = '#8ea0d6'; c.fillText('Chọn một bản nhạc rồi bấm "Tự đàn", "Luyện chờ phím" hoặc "Chơi theo nhịp"', 16, 40); return; }
  PG.ev.forEach(e => { const y2 = hitY - (e.t - PG.t)*sp, y1 = y2 - Math.max(10, e.d*sp*.9); if(y2 < -10 || y1 > H2) return; const x = keyX(e.m), w = keyW(e.m);
    c.fillStyle = e.j === 'perfect' || e.j === 'ok' ? '#2fbf71' : e.j === 'good' ? '#26c6da' : e.j === 'miss' ? '#5a3a4a' : e.j === 'auto' ? '#b06bff' : isBlack(e.m) ? '#ff8a2b' : '#ffd23f';
    c.fillRect(x + 2, y1, w - 4, y2 - y1); c.fillStyle = '#1a1206'; c.font = '13px VT323, monospace'; const L = midiLabels()[e.m]; if(L && y2 - y1 > 14) c.fillText(L[0], x + 6, y2 - 4); });
  c.font = '20px VT323, monospace'; c.fillStyle = '#fff'; const sl = $('#pscroll').scrollLeft;
  c.fillText(PG.mode === 'demo' ? 'Đang tự đàn mẫu' : `Điểm ${PG.sc} · Combo ${PG.combo} · Đúng ${PG.hit}/${PG.ev.length}` + (PG.mode === 'wait' ? ` · Sai ${PG.wrong}` : ` · Trượt ${PG.miss}`), sl + 10, 22);
  if(PG.t < 0){ c.font = '40px Bungee, sans-serif'; c.fillStyle = '#ffd23f'; c.fillText(String(Math.ceil(-PG.t)), sl + 300, 90); }
}

// ================= EXT: GUITAR (Karplus-Strong) =================
const G_OPEN = [40, 45, 50, 55, 59, 64];
const CHORDS_G = {C:[-1,3,2,0,1,0], G:[3,2,0,0,0,3], Am:[-1,0,2,2,1,0], F:[1,3,3,2,1,1], D:[-1,-1,0,2,3,2], Em:[0,2,2,0,0,0], E:[0,2,2,1,0,0], A:[-1,0,2,2,2,0], Dm:[-1,-1,0,2,3,1], G7:[3,2,0,0,0,1]};
const CH_KEYS = Object.keys(CHORDS_G);
const PROGS = [['C','G','Am','F'],['Am','F','C','G'],['G','D','Em','C'],['C','Am','Dm','G7'],['D','A','Em','G'],['Em','C','G','D']];
var GT = {chord:'C', ksCache:{}, vib:[0,0,0,0,0,0], auto:null, step:0};
function ksBuf(m){
  if(GT.ksCache[m]) return GT.ksCache[m];
  const sr = AC.sampleRate, f = mtof(m), N = Math.round(sr/f), len = Math.floor(sr*2.6), b = AC.createBuffer(1, len, sr), d = b.getChannelData(0), ring = new Float32Array(N);
  for(let i=0;i<N;i++) ring[i] = (Math.random()*2 - 1)*.9; let p = 0, prev = 0; const decay = m < 50 ? .996 : .994;
  for(let i=0;i<len;i++){ const cur = ring[p], nx = ring[(p + 1) % N]; const v = decay*.5*(cur + nx); ring[p] = v; d[i] = cur*.6 + prev*.4; prev = cur; p = (p + 1) % N; }
  GT.ksCache[m] = b; return b;
}
function gPluck(s, fret, when, vel){
  if(fret < 0) return; ensureAC(); const out = pianoOutNode(), t = when || AC.currentTime;
  const src = AC.createBufferSource(); src.buffer = ksBuf(G_OPEN[s] + fret); const g = AC.createGain(); g.gain.value = (vel || .7)*.9;
  const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3800; src.connect(lp); lp.connect(g); g.connect(out); src.start(t); src.stop(t + 2.6);
  setTimeout(() => { GT.vib[s] = 1; }, Math.max(0, (t - AC.currentTime)*1000));
}
function gStrum(dir, vel){ const f = CHORDS_G[GT.chord]; ensureAC(); const t = AC.currentTime; const order = dir === 'down' ? [0,1,2,3,4,5] : [5,4,3,2,1,0]; let k = 0; order.forEach(s => { if(f[s] >= 0){ gPluck(s, f[s], t + k*.016, (vel || .7)*(dir === 'up' ? .8 : 1)); k++; } }); mprog('guitar'); }
function gSetChord(ch){ GT.chord = ch; document.querySelectorAll('#gchords button').forEach(b => b.setAttribute('aria-pressed', b.dataset.c === ch)); drawFret(); }
function drawFret(){
  const cv = $('#gfret'); if(!cv) return; const c = cv.getContext('2d'), Wf = cv.width, Hf = cv.height, f = CHORDS_G[GT.chord];
  c.fillStyle = '#3e2414'; c.fillRect(0, 0, Wf, Hf); c.fillStyle = '#5d3a1e'; c.fillRect(60, 14, Wf - 70, Hf - 28);
  c.fillStyle = '#f5f0e0'; c.fillRect(56, 14, 6, Hf - 28);
  for(let k=1;k<=6;k++){ const x = 60 + k*(Wf - 70)/6; c.fillStyle = '#c0c0c0'; c.fillRect(x - 1.5, 14, 3, Hf - 28); if([3,5].includes(k)){ c.fillStyle = '#e8dcc0'; c.beginPath(); c.arc(x - (Wf - 70)/12, Hf/2, 5, 0, Math.PI*2); c.fill(); } }
  for(let s=0;s<6;s++){ const y = Hf - 24 - s*(Hf - 48)/5, a = GT.vib[s]; c.strokeStyle = s < 3 ? '#d4b36a' : '#e0e0e0'; c.lineWidth = 3.2 - s*.4; c.beginPath(); c.moveTo(0, y); for(let x=0;x<=Wf;x+=12) c.lineTo(x, y + Math.sin(x*.3 + realT*60)*a*3); c.stroke();
    c.font = '18px VT323, monospace'; c.fillStyle = '#fff'; c.fillText(['E','A','D','G','B','e'][s] + ' ' + ['A','S','D','F','G','H'][s], 6, y - 4);
    const fr = f[s]; if(fr < 0){ c.fillStyle = '#ef4b4b'; c.fillText('×', 40, y + 5); } else if(fr === 0){ c.strokeStyle = '#2fbf71'; c.lineWidth = 2; c.beginPath(); c.arc(46, y, 6, 0, Math.PI*2); c.stroke(); } else { const x = 60 + (fr - .5)*(Wf - 70)/6; c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(x, y, 9, 0, Math.PI*2); c.fill(); c.fillStyle = '#1a1206'; c.font = '15px VT323, monospace'; c.fillText(String(fr), x - 3, y + 4); } }
  c.font = '28px Bungee, sans-serif'; c.fillStyle = '#ffd23f'; c.fillText(GT.chord, Wf - 90, 44);
}
function gAnim(){ if(!openModal || openModal.id !== 'mMusic' || pMusicTab !== 'guitar') return; GT.vib = GT.vib.map(v => v*.93); drawFret(); requestAnimationFrame(gAnim); }
function gAutoToggle(){
  if(GT.auto){ clearInterval(GT.auto); GT.auto = null; $('#gauto').textContent = 'Đệm tự động'; return; }
  const prog = PROGS[+$('#gprog').value] || PROGS[0], pat = ['down',null,'down','up',null,'up','down','up'];
  GT.step = 0; $('#gauto').textContent = 'Dừng đệm';
  const tick = () => { const bpm = +$('#gbpm').value, bar = Math.floor(GT.step/8) % prog.length; if(GT.step % 8 === 0) gSetChord(prog[bar]); const d = pat[GT.step % 8]; if(d) gStrum(d, d === 'down' && GT.step % 8 === 0 ? .85 : .6); GT.step++; clearInterval(GT.auto); GT.auto = setInterval(tick, 60000/bpm/2); };
  GT.auto = setInterval(tick, 10);
}
function fretClick(e){ const cv = $('#gfret'), r = cv.getBoundingClientRect(), y = (e.clientY - r.top)/r.height*cv.height, Hf = cv.height; const s = clampV(Math.round((Hf - 24 - y)/((Hf - 48)/5)), 0, 5); const f = CHORDS_G[GT.chord][s]; gPluck(s, Math.max(0, f)); }
function openMusic(tab){ showModal('mMusic'); musicTab(tab || 'piano'); loadPiano(); }
function musicTab(tab){
  pMusicTab = tab; $('#mpPiano').hidden = tab !== 'piano'; $('#mpGuitar').hidden = tab !== 'guitar';
  $('#mtPiano').setAttribute('aria-selected', tab === 'piano'); $('#mtGuitar').setAttribute('aria-selected', tab === 'guitar');
  if(tab === 'piano'){ buildKeys(); centerKeys(); drawFall(); } else { drawFret(); requestAnimationFrame(gAnim); }
}
function musicInit(){
  sheetSelect(); buildKeys();
  $('#mtPiano').onclick = () => musicTab('piano'); $('#mtGuitar').onclick = () => musicTab('guitar');
  $('#poctDn').onclick = () => { pBase = Math.max(36, pBase - 12); buildKeys(); centerKeys(); };
  $('#poctUp').onclick = () => { pBase = Math.min(72, pBase + 12); buildKeys(); centerKeys(); };
  $('#psus').onchange = e => setSustain(e.target.checked);
  $('#pvol').oninput = e => { if(pOut) pOut.gain.value = +e.target.value; };
  $('#ptempo').oninput = e => { PG.tempo = +e.target.value; $('#ptempoV').textContent = Math.round(PG.tempo*100) + '%'; };
  $('#pdemo').onclick = () => pgStart('demo'); $('#pwait').onclick = () => pgStart('wait'); $('#prhythm').onclick = () => pgStart('rhythm'); $('#pstop').onclick = () => { pgStop(); $('#pgstat').textContent = 'Đã dừng.'; };
  $('#paddsheet').onclick = () => { const t = $('#pstitle').value.trim() || 'Bản nhạc của tôi', n = $('#psnotes').value.trim(); const sh = {t, a:'Bản nhạc bạn tự nhập', u:+$('#psu').value || .22, n}; if(!sheetEvents(sh).length){ toast('Không đọc được nốt nào. Xem lại cách viết, ví dụ: C4 D4 E4:4'); return; } userSheets.push(sh); try { localStorage.setItem('truong-sheets-v1', JSON.stringify(userSheets)); } catch(e){} sheetSelect(); $('#psheet').value = allSheets().length - 1; toast('Đã thêm bản nhạc "' + t + '"'); };
  const gc = $('#gchords'); CH_KEYS.forEach((ch, i) => { const b = el('button', {type:'button'}, `${ch} <span class="kbd">${(i + 1) % 10}</span>`); b.dataset.c = ch; b.onclick = () => gSetChord(ch); gc.appendChild(b); });
  $('#gdown').onclick = () => gStrum('down'); $('#gup').onclick = () => gStrum('up'); $('#gauto').onclick = gAutoToggle; $('#gfret').addEventListener('pointerdown', fretClick);
  const gp = $('#gprog'); PROGS.forEach((p, i) => gp.appendChild(el('option', {value:i}, p.join(' – '))));
  gSetChord('C');
}
function musicKey(e, isDown){
  const tg = e.target.tagName; if(tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') return false;
  if(pMusicTab === 'piano'){
    if(e.code === 'Space'){ e.preventDefault(); if(isDown !== pSustain && !e.repeat) setSustain(isDown); return true; }
    if(isDown && e.code === 'ArrowLeft'){ $('#poctDn').click(); e.preventDefault(); return true; }
    if(isDown && e.code === 'ArrowRight'){ $('#poctUp').click(); e.preventDefault(); return true; }
    const m = codeToMidi(e.code); if(m == null) return false; e.preventDefault();
    if(isDown){ if(e.repeat || pKeyMap[e.code] != null) return true; pKeyMap[e.code] = m; pianoOn(m, e.shiftKey ? 1 : .8); pianoInput(m); }
    else { const mm = pKeyMap[e.code]; delete pKeyMap[e.code]; if(mm != null) pianoOffNote(mm); }
    return true;
  }
  if(!isDown) return false;
  const dg = /^Digit(\d)$/.exec(e.code); if(dg){ const i = (+dg[1] + 9) % 10; if(CH_KEYS[i]) gSetChord(CH_KEYS[i]); return true; }
  if(e.code === 'KeyJ' || e.code === 'ArrowDown'){ e.preventDefault(); gStrum('down'); return true; }
  if(e.code === 'KeyK' || e.code === 'ArrowUp'){ e.preventDefault(); gStrum('up'); return true; }
  const si = ['KeyA','KeyS','KeyD','KeyF','KeyG','KeyH'].indexOf(e.code); if(si >= 0){ const f = CHORDS_G[GT.chord][si]; gPluck(si, Math.max(0, f)); return true; }
  return false;
}

