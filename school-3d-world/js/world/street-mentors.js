// ================= EXT19: PLAYER STREET & DOORS, BOAT RIDER ANIMATION, AMBIENT SOUNDSCAPES, MENTORS =================
R.pstreet = {name:'Phố nhà & cửa hàng người chơi', x:8740, y:-530, w:880, h:500, open:true};
ROOM_ORDER.splice(ROOM_ORDER.indexOf('botanic'), 0, 'pstreet');
const PLOTS = Array.from({length:8}, (_, i) => ({x:8760 + (i % 4)*215, y:i < 4 ? -500 : -265, w:195, h:200}));
var STREET = [];
function demoRoom(seed){ const R2 = rng(seed), st = MSTY[Math.floor(R2()*7)][0], col = () => MCOL[Math.floor(R2()*MCOL.length)][0], items = [];
  const tryPut = (type, tx, ty) => { const k = `d|${type}|${st}|${col()}`; if(mallItem(k)) items.push([k, tx, ty, 0]); };
  tryPut('sofa', 2, 4); tryPut('rug', 2, 6); tryPut('dtable', 9, 5); tryPut('chair', 8, 5); tryPut('chair', 11, 5); tryPut('bookshelf', 13, 2); tryPut('plant', 0, 2); tryPut('lamp', 6, 3); tryPut('painting', 3, 0); tryPut('window', 8, 0); tryPut('clock', 12, 0); tryPut('bed', 12, 7); tryPut('pendant', 6, 6);
  return {wall:`w|${WPAT[Math.floor(R2()*WPAT.length)][0]}|${col()}`, floor:`f|${FPAT[Math.floor(R2()*FPAT.length)][0]}|${col()}`, items}; }
function streetBuild(){
  const out = [];
  if(PROF){ out.push({kind:'home', own:true, name:'Nhà của ' + PROF.name, owner:PROF.name, col:'#ffd23f'}); out.push({kind:'shop', own:true, name:(PROF.myshop && PROF.myshop.name) || PROF.name + ' Shop', owner:PROF.name, col:'#ff6f91'}); }
  (MKT.shops || []).filter(s => !CLOUD.uid || s.uid !== CLOUD.uid).slice(0, 3).forEach(s => out.push({kind:'pshop', name:s.n || 'Cửa hàng', owner:s.o, data:s, col:'#26c6da'}));
  (MKT.homes || []).filter(h => !CLOUD.uid || h.uid !== CLOUD.uid).slice(0, 3).forEach(h => out.push({kind:'phome', name:'Nhà của ' + h.o, owner:h.o, data:h, col:'#7cb342'}));
  const npc = STU(); let k = 0; while(out.length < PLOTS.length){ const nm = npc[k % npc.length]; out.push({kind:'demo', name:'Nhà của ' + nm, owner:nm, seed:k*977 + 13, col:['#90caf9','#ce93d8','#ffcc80','#a5d6a7'][k % 4]}); k++; }
  STREET = out.slice(0, PLOTS.length);
}
function enterPlot(i){
  const s = STREET[i]; if(!s) return;
  if(s.kind === 'home'){ openRoom('home'); return; } if(s.kind === 'shop'){ openRoom('shop'); return; }
  if(s.kind === 'pshop'){ const d = s.data; visitShop(d, {name:d.n || d.o, wall:d.wall || null, floor:d.floor || null, items:parseJ(d.items, [])}); return; }
  if(s.kind === 'phome'){ const d = s.data; openVisit('Nhà của ' + d.o, {name:d.o, wall:d.wall || null, floor:d.floor || null, items:parseJ(d.items, [])}, [], null); return; }
  openVisit(s.name + ' (nhà mẫu)', Object.assign({name:s.owner}, demoRoom(s.seed)), [], null);
}
function streetSprites(sp){
  const r = R.pstreet; if(VB.x1 < r.x || VB.x0 > r.x + r.w || VB.y0 > r.y + r.h || VB.y1 < r.y) return;
  PLOTS.forEach((P, i) => { const s = STREET[i]; if(!s) return; sp.push({y:P.y + P.h - 6, f:() => {
    const x = P.x, y = P.y, w = P.w, isShop = s.kind === 'shop' || s.kind === 'pshop';
    rect('rgba(0,0,0,.18)', x + 8, y + P.h - 10, w - 16, 8); rect(isShop ? '#f5f5f5' : '#fff8e1', x + 14, y + 60, w - 28, P.h - 70);
    tri(x + 4, y + 62, x + w - 4, y + 62, x + w/2, y + 8, s.col); rect(shade(s.col, -.3), x + 4, y + 58, w - 8, 6);
    if(isShop){ for(let k=0;k<8;k++) rect(k % 2 ? '#fff' : s.col, x + 14 + k*(w - 28)/8, y + 64, (w - 28)/8, 16); }
    rect('#90caf9', x + 30, y + 96, 40, 34); rect('#90caf9', x + w - 70, y + 96, 40, 34); rect('#fff', x + 49, y + 96, 2, 34); rect('#fff', x + w - 51, y + 96, 2, 34);
    rect('#6d4c2e', x + w/2 - 18, y + P.h - 60, 36, 52); rect('#ffd23f', x + w/2 + 10, y + P.h - 36, 4, 4);
    rect('#a1887f', x + w/2 - 26, y + P.h - 10, 52, 8);
    const near = PLAYER && Math.hypot(PLAYER.x - (x + w/2), PLAYER.y - (y + P.h + 4)) < 40;
    ctx.font = '13px VT323, monospace'; const t = (s.name || '').slice(0, 26), tw = ctx.measureText(t).width + 10; rect(near ? '#ffd23f' : '#2a1c10', x + w/2 - tw/2, y + 30, tw, 15); ctx.fillStyle = near ? '#1a1206' : '#fff'; ctx.textAlign = 'center'; ctx.fillText(t, x + w/2, y + 41);
    if(near){ ctx.fillStyle = '#ffd23f'; ctx.font = '14px VT323, monospace'; ctx.fillText('Bấm E để vào', x + w/2, y + P.h + 26); } ctx.textAlign = 'left';
    for(let k=0;k<2;k++){ circ(x + 10 + k*(w - 20), y + P.h - 14, 10, '#2e7d32'); circ(x + 14 + k*(w - 28), y + P.h - 20, 3, '#ff6f91'); }
  }}); });
}
// doors: classrooms & plots
const DOORS = () => {
  const d = [
    {x:R.rubik.dout[0], y:R.rubik.dout[1], n:'Lớp Rubik · vào học xoay Rubik', f:() => openLab('3')},
    {x:R.chess.dout[0], y:R.chess.dout[1], n:'Khu cờ vua · lớp học cờ', f:() => openChessSchool(0)},
    {x:R.music.dout[0], y:R.music.dout[1], n:'Phòng nhạc · học đàn', f:() => openMusic('piano')},
    {x:R.hall.dout[0], y:R.hall.dout[1], n:'Hội trường · nghe Người Thầy Ánh Sáng', f:() => openReader('vw2')},
    {x:R.elec.dout[0], y:R.elec.dout[1], n:'Lớp lắp ráp điện · Học viện trí tuệ', f:() => openAcademy()},
    {x:R.library.x + R.library.w/2, y:R.library.y + R.library.h + 10, n:'Thư viện Tri Thức', f:() => openLibrary('vn')},
    {x:R.zen.x + R.zen.w/2, y:R.zen.y + R.zen.h + 10, n:'Vườn thiền', f:() => openZen()}
  ];
  PLOTS.forEach((P, i) => { if(STREET[i]) d.push({x:P.x + P.w/2, y:P.y + P.h + 4, n:STREET[i].name, f:() => enterPlot(i)}); });
  [[R.plaza.x + 200, R.plaza.y + 300], [R.zen.x + 300, R.zen.y + 200], [1000, 420]].forEach(([x, y]) => d.push({x, y:y + 8, n:'Nghe Người Thầy Ánh Sáng', f:dailyWisdom}));
  v16Doors(d); skyDoors(d); v33Doors(d); v36Doors(d);
  return d;
};
var NEAR_DOOR = null;
function doorUpdate(){
  const btn = $('#hEnter'); if(!btn) return; let best = null;
  if(PLAYER && PLAYER.visible && PLAYER.controlled && !PLAYER.boat){ let bd = 42; DOORS().forEach(d => { const dd = Math.hypot(PLAYER.x - d.x, PLAYER.y - d.y); if(dd < bd){ bd = dd; best = d; } }); }
  if(best !== NEAR_DOOR){ NEAR_DOOR = best; btn.hidden = !best; if(best){ btn.textContent = best.host ? `💬 ${best.n} (E)` : `Vào: ${best.n} (E)`; blipSfx(1500); } }
}
function doorEnter(){ if(!NEAR_DOOR || openModal) return false; const d = NEAR_DOOR; keys.up = keys.down = keys.left = keys.right = false; d.f(); return true; }
// ---------- boat rider animation ----------
function drawBoatRider(a, b){
  const sp = Math.abs(b.v), t = realT, kayak = !b.item || b.item.zone === 1, turn = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if(kayak){ const ang = Math.sin(t*(2.2 + sp/50))*.9; ctx.save(); ctx.translate(-6, -16); ctx.rotate(ang); rect('#8d6e4a', -20, -1, 40, 2.5); rect('#ffd23f', -24, -3, 6, 7); rect('#ffd23f', 18, -3, 6, 7); ctx.restore();
    if(sp > 20 && Math.sin(t*(2.2 + sp/50)) > .85){ ctx.fillStyle = 'rgba(255,255,255,.8)'; for(let k=0;k<4;k++) ctx.fillRect(-26 + Math.random()*8, -2 - Math.random()*6, 2, 2); } }
  else { ctx.save(); ctx.translate(6, -16); ctx.rotate(turn*.8 + Math.sin(t*1.5)*.05); ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); for(let k=0;k<4;k++){ ctx.moveTo(0, 0); ctx.lineTo(Math.cos(k*Math.PI/2)*6, Math.sin(k*Math.PI/2)*6); } ctx.stroke(); ctx.restore(); }
  ctx.save(); ctx.translate(-6, -6 + Math.sin(t*3)*.6); const was = a.dir; a.dir = 1; drawBody(a, true); a.dir = was;
  const hairL = 3 + Math.min(6, sp/40); rect(a.hair, -6 - hairL, -32 - 6, hairL, 2 + Math.sin(t*12)*1);
  if(kayak){ const ang = Math.sin(t*(2.2 + sp/50))*.9; rect(a.skin, -9 + Math.cos(ang)*3, -22 + Math.sin(ang)*4, 3, 6); rect(a.skin, 7 - Math.cos(ang)*3, -22 - Math.sin(ang)*4, 3, 6); }
  else if(sp < 15){ const wv = Math.sin(t*8)*3; rect(a.skin, 7, -30 + wv*.3, 3, 9); rect(a.skin, 8 + wv*.4, -33, 3, 3); }
  else { rect(a.skin, 8, -20, 6, 2); rect(a.skin, 8, -17, 6, 2); }
  ctx.restore();
  if(sp > 50){ ctx.fillStyle = 'rgba(255,255,255,.75)'; const L = b.item ? [26, 30, 36, 42, 54][b.item.zone - 1] : 30; for(let k=0;k<5;k++){ const ph = (t*6 + k) % 1; ctx.beginPath(); ctx.arc(L + 4 + ph*10, -2 - Math.sin(ph*Math.PI)*8, 1.6 + (1 - ph)*1.5, 0, Math.PI*2); ctx.fill(); } }
  if(PET && a === PLAYER){ ctx.save(); ctx.translate(-20, -6); ctx.scale(.8, .8); drawPet(PET.kind, 0, 0, 1, t*3, false); ctx.restore(); }
}
// ---------- ambient soundscapes ----------
var AMB = {on:true, started:false, zone:null, layer:null, evT:0, vol:.5, out:null};
function ambZone(){
  const p = PLAYER && PLAYER.visible ? PLAYER : {x:cam.x, y:cam.y}, x = p.x, y = p.y, rg = regionAt(x, y), night = SKYST && SKYST.night > .5;
  if(y > 4800) return 'deep'; if(y > 880 || (PLAYER && PLAYER.boat)) return 'sea';
  if(rg === 'music') return 'music'; if(['rubik','hall','elec','chess','office','academy'].includes(rg)) return 'class'; if(rg === 'library') return 'library'; if(rg === 'zen') return 'zen';
  if(['stadium','pool','archery','gym','arena','field','basket','skate','patin'].includes(rg)) return night ? 'night' : 'crowd'; if(rg === 'kart') return 'kart'; if(rg === 'farm') return 'farm';
  if(['shopst','plaza','pstreet','hall2p','dalat'].includes(rg)) return 'market'; if(['pond','giantchess','rubikpark','flowerfield','bpad','art'].includes(rg)) return night ? 'night' : 'park';
  if(['forest','lake','garden','picnic','lotus','hills','ski','botanic','eastland'].includes(rg)) return night ? 'night' : 'forest';
  if(x < 1572) return night ? 'night' : 'school'; return night ? 'night' : 'town';
}
const AMB_NAMES = {deep:'Đại dương sâu thẳm', sea:'Biển cả', music:'Phòng nhạc', class:'Lớp học', library:'Thư viện yên tĩnh', zen:'Vườn thiền', crowd:'Sân vận động', kart:'Trường đua', farm:'Nông trại', market:'Phố đông vui', park:'Công viên', forest:'Rừng thông', school:'Sân trường', night:'Đêm yên bình', town:'Phố xá'};
function ambNoise(out, type, f, q, v, lfo, lfoDepth){ const s = AC.createBufferSource(); s.buffer = noise(); s.loop = true; s.playbackRate.value = .8 + Math.random()*.4; const fl = AC.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = AC.createGain(); g.gain.value = v; s.connect(fl); fl.connect(g); g.connect(out); s.start(); const nodes = [s];
  if(lfo){ const o = AC.createOscillator(), lg = AC.createGain(); o.frequency.value = lfo; lg.gain.value = v*(lfoDepth || .6); o.connect(lg); lg.connect(g.gain); o.start(); nodes.push(o); } return nodes; }
function ambTone(out, type, f, v, lfo, lfoDepth){ const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f; g.gain.value = v; o.connect(g); g.connect(out); o.start(); const nodes = [o]; if(lfo){ const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = lfo; lg.gain.value = f*(lfoDepth || .01); l.connect(lg); lg.connect(o.frequency); l.start(); nodes.push(l); } return nodes; }
function ambBed(zone, out){
  switch(zone){
    case 'sea': return [...ambNoise(out, 'lowpass', 600, .7, .25, .12, .7)];
    case 'deep': return [...ambNoise(out, 'lowpass', 220, .5, .3, .05, .5), ...ambTone(out, 'sine', 55, .05, .1, .02)];
    case 'school': return [...ambNoise(out, 'bandpass', 900, 1.2, .05, 5.5, .8), ...ambNoise(out, 'highpass', 4000, .3, .01)];
    case 'class': return [...ambNoise(out, 'lowpass', 400, .3, .02)];
    case 'library': return [...ambNoise(out, 'lowpass', 300, .3, .015)];
    case 'zen': return [...ambNoise(out, 'bandpass', 1500, 1.5, .04, .7, .9), ...ambNoise(out, 'lowpass', 500, .4, .03, .08, .5)];
    case 'crowd': return [...ambNoise(out, 'bandpass', 1100, .7, .1, .3, .5)];
    case 'kart': return [...ambTone(out, 'sawtooth', 70, .02, .4, .3), ...ambNoise(out, 'lowpass', 300, .5, .04)];
    case 'farm': return [...ambNoise(out, 'lowpass', 700, .5, .04, .1, .5)];
    case 'market': return [...ambNoise(out, 'bandpass', 800, .9, .06, 3.5, .7)];
    case 'park': return [...ambNoise(out, 'highpass', 2500, .5, .04, .4, .3)];
    case 'forest': return [...ambNoise(out, 'lowpass', 500, .6, .08, .07, .9)];
    case 'night': return [...ambNoise(out, 'lowpass', 400, .5, .03, .05, .5)];
    case 'music': return [];
    default: return [...ambNoise(out, 'lowpass', 500, .5, .04, .1, .5)];
  }
}
function ambEvent(zone, out){
  const t = AC.currentTime, r = Math.random();
  const chirp = (f0, f1, d, v, when) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f0, t + when); o.frequency.exponentialRampToValueAtTime(f1, t + when + d); g.gain.setValueAtTime(.0001, t + when); g.gain.exponentialRampToValueAtTime(v, t + when + .02); g.gain.exponentialRampToValueAtTime(.0001, t + when + d); o.connect(g); g.connect(out); o.start(t + when); o.stop(t + when + d + .05); };
  const voice = (f, d, v, when, vib) => { const o = AC.createOscillator(), bp = AC.createBiquadFilter(), g = AC.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t + when); if(vib) o.frequency.linearRampToValueAtTime(f*.85, t + when + d); bp.type = 'bandpass'; bp.frequency.value = f*4; bp.Q.value = 2; g.gain.setValueAtTime(.0001, t + when); g.gain.exponentialRampToValueAtTime(v, t + when + .06); g.gain.exponentialRampToValueAtTime(.0001, t + when + d); o.connect(bp); bp.connect(g); g.connect(out); o.start(t + when); o.stop(t + when + d + .05); };
  const bell = (f, v, d) => [1, 2.76, 5.4].forEach((k, i) => { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = f*k; g.gain.setValueAtTime(v/(i + 1), t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(out); o.start(t); o.stop(t + d + .05); });
  const thump = (f, v, when) => { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(f, t + when); o.frequency.exponentialRampToValueAtTime(f*.5, t + when + .1); g.gain.setValueAtTime(v, t + when); g.gain.exponentialRampToValueAtTime(.0001, t + when + .12); o.connect(g); g.connect(out); o.start(t + when); o.stop(t + when + .15); };
  const pg = (v) => { const s = AC.createBufferSource(); s.buffer = noise(); const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2200; const g = AC.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .3); s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + .35); };
  switch(zone){
    case 'sea': if(r < .6){ chirp(1800, 1100, .35, .05, 0); chirp(1700, 1000, .3, .04, .4); } else chirp(300, 500, .4, .02, 0); return 3 + Math.random()*5;
    case 'deep': if(r < .4){ chirp(220, 520, 2.2, .06, 0); chirp(520, 260, 2.5, .05, 2.2); } else for(let k=0;k<5;k++) chirp(400 + k*90, 900 + k*120, .12, .03, k*.15); return 5 + Math.random()*6;
    case 'school': if(r < .15) bell(880, .06, 2); else if(r < .5) [0, .3, .6].forEach(w => thump(140, .2, w)); else for(let k=0;k<3;k++) voice(260 + Math.random()*120, .18, .02, k*.2, true); return 2 + Math.random()*4;
    case 'class': if(r < .5) for(let k=0;k<4;k++) voice(180 + Math.random()*60, .16, .02, k*.2, false); else { for(let k=0;k<6;k++) pg(.015); } return 3 + Math.random()*4;
    case 'library': if(r < .6) pg(.05); else { for(let k=0;k<4;k++) thump(1800, .02, k); } return 4 + Math.random()*5;
    case 'zen': if(r < .3) bell(196, .08, 7); else if(r < .7) [784, 988, 1175, 1318].forEach((f, k) => chirp(f, f, .9, .025, k*.25 + Math.random()*.1)); else chirp(2600, 3400, .12, .02, 0); return 4 + Math.random()*5;
    case 'crowd': if(r < .4){ const s = AC.createBufferSource(); s.buffer = noise(); const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200; const g = AC.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.18, t + .5); g.gain.exponentialRampToValueAtTime(.0001, t + 2.4); s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + 2.5); } else if(r < .6){ chirp(2600, 2600, .2, .04, 0); chirp(2600, 2600, .4, .04, .3); } else for(let k=0;k<6;k++) thump(120, .12, k*.45); return 3 + Math.random()*4;
    case 'kart': { const o = AC.createOscillator(), g = AC.createGain(), lp = AC.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(90, t); o.frequency.linearRampToValueAtTime(180, t + 1); o.frequency.linearRampToValueAtTime(70, t + 2); lp.type = 'lowpass'; lp.frequency.value = 900; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.06, t + .8); g.gain.exponentialRampToValueAtTime(.0001, t + 2); o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + 2.1); } return 2 + Math.random()*3;
    case 'farm': if(r < .3) voice(110, 1.2, .05, 0, true); else if(r < .55) for(let k=0;k<4;k++) voice(600, .08, .03, k*.12, false); else if(r < .75) voice(330, .7, .04, 0, true); else { voice(500, .2, .04, 0, false); voice(700, .25, .04, .2, false); voice(900, .5, .04, .45, true); } return 3 + Math.random()*4;
    case 'market': if(r < .3){ bell(1568, .05, .9); bell(2093, .04, .9); } else for(let k=0;k<3;k++) voice(220 + Math.random()*200, .2, .025, k*.25, true); return 2 + Math.random()*3;
    case 'park': for(let k=0;k<3;k++) chirp(3000 + Math.random()*1200, 4200 + Math.random()*800, .1, .025, k*.14); return 2 + Math.random()*4;
    case 'forest': if(r < .7){ const f = 2400 + Math.random()*1500; for(let k=0;k<3 + Math.floor(Math.random()*3);k++) chirp(f, f*1.3, .09, .03, k*.13); } else for(let k=0;k<8;k++) thump(900, .03, k*.07); return 1.5 + Math.random()*3;
    case 'night': if(r < .8) for(let k=0;k<6;k++) chirp(4400, 4500, .05, .012, k*.09); else { voice(380, .5, .03, 0, true); voice(350, .7, .03, .7, true); } return 1 + Math.random()*2;
    case 'music': { const pent = [60, 62, 64, 67, 69, 72, 74]; for(let k=0;k<3;k++){ const m = pent[Math.floor(Math.random()*pent.length)]; try { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'triangle'; o.frequency.value = mtof(m); g.gain.setValueAtTime(.0001, t + k*.35); g.gain.exponentialRampToValueAtTime(.05, t + k*.35 + .01); g.gain.exponentialRampToValueAtTime(.0001, t + k*.35 + 1.4); o.connect(g); g.connect(out); o.start(t + k*.35); o.stop(t + k*.35 + 1.5); } catch(e){} } } return 1.5 + Math.random()*2;
  }
  return 4;
}
function ambSwitch(zone){
  if(!AMB.started) return; ensureAC(); if(!AMB.out){ AMB.out = AC.createGain(); AMB.out.gain.value = AMB.vol; AMB.out.connect(AC.destination); }
  const old = AMB.layer; if(old){ old.g.gain.setTargetAtTime(0, AC.currentTime, .5); setTimeout(() => { old.nodes.forEach(n => { try { n.stop(); } catch(e){} }); try { old.g.disconnect(); } catch(e){} }, 2500); }
  const g = AC.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(1, AC.currentTime, .6); g.connect(AMB.out);
  AMB.layer = {zone, g, nodes:ambBed(zone, g)}; AMB.zone = zone; AMB.evT = 1; const b = $('#ambName'); if(b) b.textContent = AMB_NAMES[zone] || '';
}
function ambUpdate(dt){
  if(!AMB.on || !AMB.started || document.hidden) return;
  AMB.ck = (AMB.ck || 0) - dt; if(AMB.ck <= 0){ AMB.ck = 1.2; const z = ambZone(); if(z !== AMB.zone) ambSwitch(z); }
  if(AMB.layer){ AMB.evT -= dt; if(AMB.evT <= 0){ try { AMB.evT = ambEvent(AMB.zone, AMB.layer.g); } catch(e){ AMB.evT = 5; } } }
}
function ambToggle(on){ AMB.on = on; try { localStorage.setItem('truong-amb', on ? '1' : '0'); } catch(e){} const b = $('#hSound'); if(b){ b.textContent = on ? 'Âm thanh: bật' : 'Âm thanh: tắt'; b.setAttribute('aria-pressed', on); }
  if(!on && AMB.layer){ const l = AMB.layer; l.g.gain.setTargetAtTime(0, AC.currentTime, .3); setTimeout(() => l.nodes.forEach(n => { try { n.stop(); } catch(e){} }), 1500); AMB.layer = null; AMB.zone = null; }
  if(on){ AMB.started = true; AMB.zone = null; } }
// ---------- mentors ----------
var MENT = {last:{}, on:true, hideT:null};
const MODAL_MENTOR = {mLab:'rubik', mRubik:'rubik', mChess:'chess', mChessLearn:'chess', mWatch:'chess', mCaro:'chess', mGo:'chess', mC4:'play', mOAQ:'play', mOly:'olympic', mLib:'library', mReader:'library', mBookQuiz:'library', mComic:'library', mZen:'zen', mFish:'fish', mFishDeep:'fish', mMall:'market', mMarket:'market', mShop:'market', mFarm:'farm', mMusic:'music', mLobby:'play', mHall:'play', mSudoku:'library', mMath:'library', mMemory:'library', mAcademy:'library', mPaint:'music'};
function mentorSay(kind, text, quote, force){
  if(!MENT.on) return; const M = MENTORS[kind] || MENTORS.light; if(!force && MENT.last[kind] && realT - MENT.last[kind] < 120) return; MENT.last[kind] = realT;
  const box = $('#mentor'); if(!box) return; $('#mtName').textContent = M[0]; $('#mtLine').textContent = text || M[1]; $('#mtQuote').textContent = `“${quote ? quote[0] : M[2]}”`; $('#mtSrc').textContent = quote ? quote[1] : M[3];
  const cv = $('#mtAv'); withCtx(cv.getContext('2d'), () => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); const g = ctx.createRadialGradient(32, 34, 4, 32, 34, 34); g.addColorStop(0, 'rgba(255,236,179,.95)'); g.addColorStop(1, 'rgba(255,236,179,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 72); ctx.translate(32, 64); ctx.scale(1.8, 1.8); const f = lookFor(Object.keys(MENTORS).indexOf(kind) + 2); f.hair = '#e0e0e0'; f.shirt = {rubik:'#3d7bff', chess:'#222', olympic:'#ef4b4b', library:'#8d6e63', zen:'#ff8f00', fish:'#1565c0', market:'#2e7d32', farm:'#795548', music:'#b06bff', play:'#26c6da', light:'#fafafa'}[kind] || '#fafafa'; f.style = {outfit:kind === 'light' || kind === 'zen' ? 'wizard' : '', shirt:f.shirt, acc:['aura'], hs:'short'}; f.dir = 1; drawBody(f, false); });
  box.hidden = false; box.classList.remove('show'); void box.offsetWidth; box.classList.add('show'); clearTimeout(MENT.hideT); MENT.hideT = setTimeout(() => { box.hidden = true; }, 11000);
}
function mentorFor(id){ const k = MODAL_MENTOR[id]; if(k) mentorSay(k); }
function mentorResult(id, medal){ const kind = OLY_IDS.has(id) ? 'olympic' : 'play'; if(medal === 1) mentorSay(kind, 'Chúc mừng em! Hãy cảm ơn bạn thi đấu và những người đã giúp em. Người giỏi thật sự luôn khiêm tốn.', ['Lúa chín thì cúi đầu.', 'Tục ngữ Việt Nam'], true); else if(medal) mentorSay(kind, 'Em đã làm rất tốt! Mỗi lần thi là một bài học, lần sau em sẽ còn tiến bộ hơn.', ['Có công mài sắt, có ngày nên kim.', 'Tục ngữ Việt Nam'], true); else mentorSay(kind, 'Không sao cả. Ngã ở đâu đứng dậy ở đó. Thầy tin em, mình thử lại nhé!', ['Thất bại là mẹ thành công.', 'Tục ngữ Việt Nam'], true); }
function dailyWisdom(){ const w = WISDOM_DAILY[(day + (PROF ? PROF.name.length : 0)) % WISDOM_DAILY.length]; mentorSay('light', 'Lời dạy hôm nay dành cho em. Hãy mang theo điều này suốt cả ngày nhé.', w, true); }
// light teacher in the world (plaza & zen)
function lightSprites(sp){
  [[R.plaza.x + 200, R.plaza.y + 300], [R.zen.x + 300, R.zen.y + 200], [1000, 420]].forEach(([x, y], i) => { if(!inVB(x, y)) return; sp.push({y, f:() => { const b = Math.sin(realT*1.5 + i)*3; const g = ctx.createRadialGradient(x, y - 24 + b, 4, x, y - 24 + b, 40); g.addColorStop(0, 'rgba(255,245,200,.85)'); g.addColorStop(1, 'rgba(255,245,200,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - 24 + b, 40, 0, Math.PI*2); ctx.fill();
    const f = lookFor(9); f.hair = '#f5f5f5'; f.long = true; f.shirt = '#fafafa'; f.style = {outfit:'wizard', shirt:'#fafafa', acc:['aura'], hs:'long'}; f.dir = 1; ctx.save(); ctx.translate(x, y + b); drawBody(f, false); ctx.restore();
    const near = PLAYER && Math.hypot(PLAYER.x - x, PLAYER.y - y) < 60; ctx.font = '13px VT323, monospace'; ctx.textAlign = 'center'; ctx.fillStyle = near ? '#ffd23f' : '#fff'; ctx.fillText(near ? 'Người Thầy Ánh Sáng · bấm E' : 'Người Thầy Ánh Sáng', x, y - 50 + b); ctx.textAlign = 'left'; }}); });
}
function ext19Init(){
  streetBuild(); setInterval(() => { streetBuild(); }, 20000);
  XHOT.unshift({r:R.pstreet, f:(x, y) => { const i = PLOTS.findIndex(P => x > P.x && x < P.x + P.w && y > P.y && y < P.y + P.h + 20); if(i >= 0) enterPlot(i); }});
  XHOT.unshift({r:{x:R.plaza.x + 170, y:R.plaza.y + 250, w:60, h:70}, f:dailyWisdom}, {r:{x:R.zen.x + 270, y:R.zen.y + 150, w:60, h:70}, f:dailyWisdom}, {r:{x:970, y:370, w:60, h:70}, f:dailyWisdom});
  try { AMB.on = localStorage.getItem('truong-amb') !== '0'; } catch(e){}
  ambToggle(AMB.on); AMB.started = false;
  const start = () => { if(AMB.on && !AMB.started){ AMB.started = true; AMB.zone = null; } window.removeEventListener('pointerdown', start); window.removeEventListener('keydown', start); };
  window.addEventListener('pointerdown', start); window.addEventListener('keydown', start);
  $('#hSound').onclick = () => ambToggle(!AMB.on); $('#hEnter').onclick = () => doorEnter();
  $('#mentor').onclick = () => { $('#mentor').hidden = true; };
  try { MENT.on = localStorage.getItem('truong-mentor') !== '0'; } catch(e){}
  $('#mentorOn').checked = MENT.on; $('#mentorOn').onchange = e => { MENT.on = e.target.checked; try { localStorage.setItem('truong-mentor', MENT.on ? '1' : '0'); } catch(x){} };
}

