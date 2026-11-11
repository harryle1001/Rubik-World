// Draws each zone as its own scene, with signposts, interactable spots and living animations.
const TXT = (scene, x, y, s, size, col, bg) => scene.add.text(x, y, s, {fontFamily:'Segoe UI, Arial', fontSize:(size || 16) + 'px', color:col || '#ffffff', backgroundColor:bg || null, padding:bg ? {x:6, y:3} : null, align:'center'}).setOrigin(.5);
function signpost(scene, x, y, text, dir){
  const g = scene.add.graphics(); const d = PG(g);
  d.rect('#5d4037', x - 3, y - 40, 6, 44); d.rect('#3e2723', x - 6, y + 2, 12, 4);
  const w = Math.max(110, text.length*8 + 20);
  d.rect('#8d6e4a', x - w/2, y - 64, w, 26); d.rect('#a1887f', x - w/2, y - 64, w, 4); d.rect('#6d4c2e', x - w/2, y - 42, w, 4);
  d.circ('#3e2723', x - w/2 + 6, y - 51, 2); d.circ('#3e2723', x + w/2 - 6, y - 51, 2);
  for(let k=0;k<3;k++) d.circ(['#ff6f91','#ffd23f','#ffffff'][k], x - 10 + k*10, y + 2, 4);
  TXT(scene, x, y - 51, text, 14, '#fff8e1').setDepth(y + 1); g.setDepth(y);
}
function exitMarker(scene, e){
  const g = scene.add.graphics().setDepth(1); g.fillStyle(0xffd23f, .25); g.fillRoundedRect(e.x, e.y, e.w, e.h, 10); g.lineStyle(2, 0xffd23f, .8); g.strokeRoundedRect(e.x, e.y, e.w, e.h, 10);
  scene.tweens.add({targets:g, alpha:.45, duration:900, yoyo:true, repeat:-1});
}
// ---------- sky life: clouds that morph (wave / blue whale / puffy), satellites, birds ----------
function skyLife(scene, x0, y0, w, h, night){
  const g = scene.add.graphics().setDepth(2); const S = {g, t:0, clouds:[], birds:[], sats:[]};
  for(let i=0;i<9;i++) S.clouds.push({x:x0 + Math.random()*w, y:y0 + 40 + Math.random()*(h - 140), v:8 + Math.random()*14, s:.8 + Math.random()*1.2, kind:['puff','wave','whale'][i % 3], ph:Math.random()*6});
  const kinds = [['eagle','#5d4037'], ['parrot','#e53935'], ['parrot','#1e88e5'], ['parrot','#43a047'], ['crane','#fafafa'], ['swallow','#263238']];
  for(let i=0;i<10;i++){ const k = kinds[i % kinds.length]; S.birds.push({x:x0 + Math.random()*w, y:y0 + 60 + Math.random()*(h - 160), v:(40 + Math.random()*60)*(Math.random() < .5 ? -1 : 1), kind:k[0], col:k[1], ph:Math.random()*6}); }
  for(let i=0;i<2;i++) S.sats.push({x:x0 + Math.random()*w, y:y0 + 20 + i*30, v:30 + i*20});
  S.tick = (dt) => { S.t += dt; g.clear(); const d = PG(g), wob = Math.sin(S.t*.4);
    S.clouds.forEach(c => { c.x += c.v*dt; if(c.x > x0 + w + 200) c.x = x0 - 200; const s = c.s*(1 + .06*Math.sin(S.t*.3 + c.ph)), a = night ? .35 : .9, col = night ? '#9fa8da' : '#ffffff';
      if(c.kind === 'whale'){ d.ell(col, c.x, c.y, 70*s, 22*s, a); d.ell(col, c.x + 55*s, c.y - 4*s, 26*s, 16*s, a); d.tri(col, c.x - 64*s, c.y, c.x - 100*s, c.y - 22*s + wob*6, c.x - 100*s, c.y + 18*s + wob*6, a); d.circ(night ? '#5c6bc0' : '#b3e5fc', c.x + 60*s, c.y - 8*s, 3*s, a); for(let k=0;k<3;k++) d.circ(col, c.x + 30*s + k*6*s, c.y - 30*s - k*6*s - Math.abs(Math.sin(S.t*2 + k))*6, (4 - k)*s, a*.8); }
      else if(c.kind === 'wave'){ for(let k=0;k<9;k++) d.circ(col, c.x + k*16*s, c.y + Math.sin(S.t*1.2 + k*.8 + c.ph)*10*s, (12 + (k % 3)*3)*s, a); }
      else { [[0, 0, 26], [24, -8, 20], [-24, -4, 18], [46, 4, 16], [-46, 6, 14]].forEach(([dx, dy, r]) => d.circ(col, c.x + dx*s, c.y + dy*s, r*s, a)); } });
    S.sats.forEach(s => { s.x += s.v*dt; if(s.x > x0 + w + 40) s.x = x0 - 40; d.rect('#cfd8dc', s.x - 3, s.y - 3, 6, 6); d.rect('#1565c0', s.x - 14, s.y - 2, 9, 4); d.rect('#1565c0', s.x + 5, s.y - 2, 9, 4); if(Math.floor(S.t*2) % 2) d.circ('#ff5252', s.x, s.y - 5, 1.5); });
    S.birds.forEach(b => { b.x += b.v*dt; b.ph += dt*(b.kind === 'eagle' ? 3 : 9); if(b.x > x0 + w + 60) b.x = x0 - 60; if(b.x < x0 - 60) b.x = x0 + w + 60; const f = b.v < 0 ? -1 : 1, fl = Math.sin(b.ph)*(b.kind === 'eagle' ? 5 : 4), y = b.y + Math.sin(S.t + b.ph)*6;
      if(b.kind === 'eagle'){ d.ell(b.col, b.x, y, 9, 4); d.tri(b.col, b.x - 2, y, b.x - 26, y - 6 - fl, b.x + 2, y - 2); d.tri(b.col, b.x + 2, y, b.x + 26, y - 6 - fl, b.x - 2, y - 2); d.circ('#fafafa', b.x + 9*f, y - 2, 3); d.tri('#ffb300', b.x + 11*f, y - 2, b.x + 15*f, y - 1, b.x + 11*f, y); }
      else if(b.kind === 'parrot'){ d.ell(b.col, b.x, y, 6, 3.5); d.tri(b.col === '#e53935' ? '#ffd23f' : '#ffd23f', b.x - 2, y, b.x - 9, y - 6 - fl, b.x + 2, y - 1); d.tri(b.col, b.x - 6*f, y, b.x - 16*f, y + 2, b.x - 6*f, y + 3); d.circ('#fff', b.x + 5*f, y - 2, 1.4); }
      else if(b.kind === 'crane'){ d.ell(b.col, b.x, y, 8, 3); d.tri(b.col, b.x, y, b.x - 14, y - 8 - fl, b.x + 6, y); d.line('#424242', b.x + 7*f, y - 1, b.x + 16*f, y - 4, 1.2); d.circ('#e53935', b.x + 16*f, y - 5, 1.6); }
      else { d.tri(b.col, b.x - 8, y - fl, b.x, y, b.x + 8, y - fl); } }); };
  return S;
}
// ---------- per-theme painters ----------
function grassTex(d, x, y, w, h, c1, c2){ d.rect(c1, x, y, w, h); for(let i=0;i<w*h/2500;i++) d.rect(c2, x + (i*97) % w, y + (i*61) % h, 3, 5); }
function tree(d, x, y, kind, s){ s = s || 1; d.ell('#000', x, y + 4, 16*s, 5*s, .2);
  if(kind === 'pine'){ d.rect('#5d4037', x - 3*s, y - 12*s, 6*s, 16*s); for(let k=0;k<3;k++) d.tri(['#1b5e20','#2e7d32','#388e3c'][k], x - (24 - k*5)*s, y - (8 + k*16)*s, x + (24 - k*5)*s, y - (8 + k*16)*s, x, y - (40 + k*14)*s); }
  else if(kind === 'sakura'){ d.rect('#5d4037', x - 3*s, y - 20*s, 6*s, 24*s); [[0, -38, 20], [-16, -28, 14], [16, -28, 14], [-6, -50, 12], [10, -48, 12]].forEach(([a, b, r]) => d.circ(['#f8bbd0','#f48fb1','#fce4ec'][(a + 30) % 3], x + a*s, y + b*s, r*s)); }
  else if(kind === 'palm'){ d.line('#8d6e4a', x, y, x + 6*s, y - 50*s, 5*s); for(let k=0;k<6;k++){ const a = k*Math.PI/3; d.tri('#2e7d32', x + 6*s, y - 50*s, x + 6*s + Math.cos(a)*30*s, y - 50*s + Math.sin(a)*12*s, x + 6*s + Math.cos(a + .3)*26*s, y - 50*s + Math.sin(a + .3)*10*s); } }
  else { d.rect('#5d4037', x - 3*s, y - 18*s, 6*s, 22*s); d.circ('#2e7d32', x, y - 34*s, 20*s); d.circ('#388e3c', x - 12*s, y - 24*s, 14*s); d.circ('#43a047', x + 12*s, y - 26*s, 14*s); } }
function drawZone(scene, Z, zid){
  const g = scene.add.graphics().setDepth(0), d = PG(g), out = {blockers:[], interacts:[], ticks:[]}, W = Z.w, H = Z.h;
  const deco = scene.add.graphics(); const dd = PG(deco); deco.setDepth(5);
  const I = (x, y, r, label, act) => out.interacts.push({x, y, r, label, act});
  const B = (x, y, w, h) => out.blockers.push([x, y, w, h]);
  switch(Z.theme){
  case 'class': {
    d.rect('#e8dcc6', 0, 0, W, H); for(let y=200; y<H; y+=40) for(let x=((y/40) % 2)*40; x<W; x+=80) d.rect('#dcccb0', x, y, 40, 40);
    d.rect('#8d6e4a', 0, 0, W, 200); d.rect('#2e5b3a', 380, 40, 640, 120); d.rect('#6b4a2a', 370, 30, 660, 10);
    TXT(scene, 700, 80, 'Chào mừng tới Trường Rubik!', 28, '#e9f5e9'); TXT(scene, 700, 120, 'Ra cửa phía dưới để tới đường chính · bảng chỉ dẫn sẽ dẫn đường', 16, '#c8e6c9');
    for(let r=0;r<3;r++) for(let c=0;c<4;c++){ const x = 230 + c*260, y = 320 + r*150; dd.rect('#8d6e4a', x - 50, y - 18, 100, 30); dd.rect('#6d4c2e', x - 50, y + 10, 100, 6); dd.rect('#3d7bff', x - 10, y - 32, 20, 16); B(x - 50, y - 20, 100, 36); }
    for(let k=0;k<4;k++){ d.rect('#90caf9', 80 + k*320, 210, 120, 0); }
    tree(dd, 80, 760, 'oak', .8); tree(dd, 1320, 760, 'oak', .8);
    I(700, 260, 70, 'Nghe cô giáo giảng bài', () => UI.lesson()); break; }
  case 'hub': {
    const third = H/3, night = false;
    const sky = scene.add.graphics().setDepth(0); sky.fillGradientStyle(0x4fa3e0, 0x4fa3e0, 0xcfeaff, 0xcfeaff, 1); sky.fillRect(0, 0, W, third);
    d.circ('#fff59d', 3600, 120, 50); d.circ('#fff9c4', 3600, 120, 70, .3);
    grassTex(d, 0, third, W, third, '#7cb342', '#689f38');
    d.rect('#9e9e9e', 0, 860, W, 80); for(let x=0;x<W;x+=80) d.rect('#fafafa', x, 898, 40, 4); d.rect('#bdbdbd', 0, 852, W, 8); d.rect('#bdbdbd', 0, 940, W, 8);
    Z.exits.forEach(e => { if(e.y < 700) d.rect('#d7ccc8', e.x + e.w/2 - 30, 640, 60, 220); else if(e.y > 1000) d.rect('#d7ccc8', e.x + e.w/2 - 30, 940, 60, 220); });
    const sea = scene.add.graphics().setDepth(0); sea.fillGradientStyle(0x29b6f6, 0x29b6f6, 0x01579b, 0x01579b, 1); sea.fillRect(0, third*2, W, third); d.rect('#ffe0a3', 0, third*2 - 10, W, 30);
    for(let i=0;i<70;i++){ const x = (i*211) % W, y = 660 + (i*53) % 520; if(Math.abs(y - 900) < 90) continue; if(Z.exits.some(e => Math.abs(e.x + e.w/2 - x) < 70)) continue; tree(dd, x, y, i % 4 ? 'oak' : 'pine', .9); }
    TXT(scene, 200, 300, 'BẦU TRỜI', 30, 'rgba(255,255,255,.55)'); TXT(scene, 200, 1500, 'ĐẠI DƯƠNG', 30, 'rgba(255,255,255,.55)');
    out.ticks.push(skyLife(scene, 0, 0, W, third, night).tick);
    const waves = scene.add.graphics().setDepth(1); let wt = 0; const ships = [{x:400, y:1350, v:30, c:'#ef4b4b'}, {x:2200, y:1600, v:-20, c:'#fafafa'}, {x:3400, y:1450, v:25, c:'#ffd23f'}];
    out.ticks.push(dt => { wt += dt; waves.clear(); const w = PG(waves); for(let r=0;r<10;r++) for(let x = -((wt*30 + r*40) % 120); x < W; x += 120) w.rect('#ffffff', x, 1230 + r*56 + Math.sin(wt + x*.01)*6, 50, 3, .35);
      ships.forEach(s => { s.x += s.v*dt; if(s.x > W + 100) s.x = -100; if(s.x < -100) s.x = W + 100; w.tri('#fafafa', s.x - 40, s.y, s.x + 40, s.y, s.x + 30, s.y + 14); w.rect(s.c, s.x - 36, s.y - 6, 70, 6); w.rect('#5d4037', s.x - 2, s.y - 50, 3, 44); w.tri('#ffffff', s.x + 1, s.y - 50, s.x + 1, s.y - 10, s.x + 30, s.y - 12); }); });
    break; }
  case 'forest': {
    grassTex(d, 0, 0, W, H, '#558b2f', '#33691e'); d.rect('#a1887f', 0, 660, W, 80);
    const stream = scene.add.graphics().setDepth(1); stream.fillStyle(0x4fc3f7, 1); for(let y=0;y<H;y+=10) stream.fillRect(1500 + Math.sin(y*.01)*60, y, 70, 10); out.blockers.push([1440, 0, 200, 640]); out.blockers.push([1440, 760, 200, H]);
    d.rect('#8d6e4a', 1420, 650, 240, 100); for(let x=1420;x<1660;x+=20) d.rect('#6d4c2e', x, 650, 4, 100);
    for(let i=0;i<120;i++){ const x = (i*173) % W, y = 140 + (i*97) % (H - 160); if(Math.abs(y - 700) < 90 || (x > 1400 && x < 1700)) continue; tree(dd, x, y, 'pine', .8 + (i % 3)*.15); }
    out.ticks.push(skyLife(scene, 0, 0, W, 400, false).tick);
    signpost(scene, 300, 640, '→ Suối trong & cầu gỗ'); signpost(scene, 1900, 640, 'Đường mòn ngắm chim →');
    break; }
  case 'beach': {
    d.rect('#ffe0a3', 0, 0, W, 720); for(let i=0;i<400;i++) d.rect('#f5d48a', (i*97) % W, (i*53) % 700, 2, 2);
    const sea = scene.add.graphics().setDepth(0); sea.fillGradientStyle(0x4fc3f7, 0x4fc3f7, 0x01579b, 0x01579b, 1); sea.fillRect(0, 720, W, H - 720);
    for(let k=0;k<6;k++) tree(dd, 120 + k*420, 140, 'palm', 1.1);
    d.rect('#8d6e4a', 1700, 560, 60, 260); for(let y=560;y<820;y+=14) d.rect('#6d4c2e', 1700, y, 60, 3);
    const navy = scene.add.container(1730, 880).setDepth(880); const ng = scene.add.graphics(); const nd = PG(ng); nd.tri('#546e7a', -120, 0, 120, 0, 100, 26); nd.rect('#607d8b', -110, -14, 210, 16); nd.rect('#78909c', -40, -46, 70, 32); nd.rect('#90a4ae', -20, -70, 24, 24); nd.rect('#37474f', 40, -24, 50, 8); nd.rect('#e53935', -100, -20, 14, 6); nd.rect('#ffd23f', -98, -18, 4, 2); navy.add(ng); navy.add(TXT(scene, 0, -90, 'Tàu hải quân · bệ phóng tên lửa', 14, '#fff', 'rgba(0,0,0,.55)'));
    const waves = scene.add.graphics().setDepth(1); let wt = 0; out.ticks.push(dt => { wt += dt; waves.clear(); const w = PG(waves); for(let r=0;r<12;r++) for(let x = -((wt*30 + r*40) % 140); x < W; x += 140) w.rect('#ffffff', x, 730 + r*60 + Math.sin(wt + x*.01)*6, 60, 3, .4); navy.y = 880 + Math.sin(wt*1.5)*3; });
    signpost(scene, 600, 520, 'Cảng hải quân →'); signpost(scene, 2200, 520, '← Bãi tắm');
    I(1730, 700, 90, 'Lên tàu hải quân: bắn tên lửa vào tàu hải tặc', () => Missile.start(scene, navy));
    out.ticks.push(skyLife(scene, 0, 0, W, 160, false).tick);
    break; }
  case 'hill': {
    const sky = scene.add.graphics().setDepth(0); sky.fillGradientStyle(0x050a24, 0x050a24, 0x283593, 0x283593, 1); sky.fillRect(0, 0, W, 800);
    const stars = scene.add.graphics().setDepth(1); const st = Array.from({length:260}, (_, i) => [(i*137) % W, (i*71) % 760, (i % 3) + 1]);
    let tt = 0; out.ticks.push(dt => { tt += dt; stars.clear(); st.forEach(([x, y, r], i) => { stars.fillStyle(0xffffff, .4 + .6*Math.abs(Math.sin(tt*1.5 + i))); stars.fillCircle(x, y, r*.8); }); if(Math.sin(tt*.7) > .995){ stars.lineStyle(2, 0xffffff, .9); stars.lineBetween(200 + (tt*50 % 1000), 100, 120 + (tt*50 % 1000), 160); } });
    for(let k=0;k<5;k++) d.ell(['#3949ab','#5c6bc0','#7986cb','#9fa8da','#c5cae9'][k], 800, 300 + k*20, 600 - k*70, 30, .08);
    d.ell('#1b5e20', 800, 1200, 900, 460); grassTex(d, 0, 900, W, H - 900, '#2e7d32', '#1b5e20');
    dd.rect('#eceff1', 700, 700, 200, 150); dd.circ('#cfd8dc', 800, 700, 100); dd.rect('#37474f', 780, 600, 100, 20); dd.rect('#ffd23f', 770, 780, 60, 70); B(700, 650, 200, 200);
    TXT(scene, 800, 560, 'ĐÀI THIÊN VĂN', 22, '#ffd23f');
    I(800, 880, 90, 'Ngắm kính viễn vọng: khám phá hệ Mặt Trời', () => UI.telescope());
    signpost(scene, 400, 1300, 'Ngắm sao băng ↑'); signpost(scene, 1200, 1300, 'Đài thiên văn ↑');
    break; }
  case 'talent': {
    d.rect('#ede7f6', 0, 0, W, H); d.rect('#7e57c2', 0, 0, W, 280); TXT(scene, 900, 140, 'LỚP NĂNG KHIẾU', 34, '#fff');
    [['Âm nhạc', 300, '#ffd23f'], ['Hội họa', 900, '#ff6f91'], ['Rubik', 1500, '#2fbf71']].forEach(([n, x, c]) => { d.rect(c, x - 200, 300, 400, 300, .25); TXT(scene, x, 330, n, 20, '#4527a0'); });
    dd.rect('#111', 220, 420, 160, 70); for(let k=0;k<14;k++) dd.rect('#fafafa', 224 + k*11, 470, 9, 20); B(220, 420, 160, 70); I(300, 520, 80, 'Chơi đàn piano', () => UI.piano());
    dd.rect('#8d6e4a', 880, 400, 6, 100); dd.rect('#fff', 850, 400, 80, 60); dd.rect('#ff6f91', 860, 410, 30, 20); dd.rect('#4fc3f7', 890, 430, 30, 20); I(900, 520, 80, 'Vẽ tranh', () => UI.paint());
    const cols = ['#ef4b4b','#ffd23f','#3d7bff','#2fbf71','#ff8a2b','#fff']; for(let i=0;i<9;i++) dd.rect(cols[i % 6], 1470 + (i % 3)*20, 420 + Math.floor(i/3)*20, 18, 18); I(1500, 520, 80, 'Xoay Rubik (mẹo hay)', () => UI.rubikTips());
    break; }
  case 'sports': {
    grassTex(d, 0, 0, W, H, '#43a047', '#388e3c'); d.rect('#c0533a', 100, 200, 2000, 1100, .9); d.rect('#4caf50', 220, 320, 1760, 860);
    const lines = scene.add.graphics().setDepth(1); lines.lineStyle(4, 0xffffff, .9); lines.strokeRect(300, 380, 1600, 740); lines.lineBetween(1100, 380, 1100, 1120); lines.strokeCircle(1100, 750, 90); lines.strokeRect(300, 600, 160, 300); lines.strokeRect(1740, 600, 160, 300);
    const goals = scene.add.graphics().setDepth(2); goals.fillStyle(0xffffff, .5); goals.fillRect(270, 680, 30, 140); goals.fillRect(1900, 680, 30, 140);
    const ball = scene.add.circle(1100, 750, 12, 0xffffff).setDepth(750); ball.setStrokeStyle(2, 0x222222); const bv = {x:0, y:0}; scene.ball = ball;
    out.ticks.push(dt => { const me = scene.me; if(me){ const dx = ball.x - me.x, dy = ball.y - (me.y - 6), dist = Math.hypot(dx, dy); if(dist < 22){ bv.x = dx/dist*420; bv.y = dy/dist*420; } } ball.x += bv.x*dt; ball.y += bv.y*dt; bv.x *= Math.pow(.4, dt); bv.y *= Math.pow(.4, dt); if(ball.y < 390 || ball.y > 1110){ bv.y *= -.8; ball.y = Phaser.Math.Clamp(ball.y, 390, 1110); }
      const inGoal = ball.y > 680 && ball.y < 820; if(ball.x < 300 || ball.x > 1900){ if(inGoal){ UI.toast('VÀOOO! Bàn thắng đẹp!'); NET.reward('goal', 'Ghi bàn'); ball.x = 1100; ball.y = 750; bv.x = bv.y = 0; scene.cameras.main.shake(200, .006); } else { bv.x *= -.8; ball.x = Phaser.Math.Clamp(ball.x, 300, 1900); } } ball.setDepth(ball.y); });
    signpost(scene, 1000, 180, 'Sân bóng: chạm bóng để sút!'); break; }
  case 'gym': {
    d.rect('#cfd8dc', 0, 0, W, H); d.rect('#37474f', 0, 0, W, 240); TXT(scene, 800, 120, 'GYM & VÕ THUẬT', 34, '#ffd23f');
    d.rect('#1565c0', 900, 400, 560, 420); d.rect('#ef4b4b', 920, 420, 520, 380, .25); TXT(scene, 1180, 440, 'Võ đường', 20, '#fff');
    const bag = scene.add.container(400, 480).setDepth(480); const bg2 = scene.add.graphics(); PG(bg2).rect('#5d4037', -2, -120, 4, 60); PG(bg2).rect('#c62828', -22, -60, 44, 90); bag.add(bg2); scene.bag = bag; B(370, 420, 60, 70);
    I(400, 560, 80, 'Đấm bao cát (bấm E liên tục)', () => UI.punch(scene));
    for(let k=0;k<3;k++){ dd.rect('#455a64', 160 + k*120, 760, 90, 40); dd.rect('#212121', 160 + k*120, 740, 90, 20); }
    for(let k=0;k<3;k++){ dd.rect('#8d6e4a', 1020 + k*140, 560, 8, 70); dd.circ('#a1887f', 1024 + k*140, 550, 14); }
    break; }
  case 'town': {
    grassTex(d, 0, 0, W, H, '#8bc34a', '#7cb342'); d.rect('#9e9e9e', 0, 780, W, 80); for(let x=0;x<W;x+=80) d.rect('#fafafa', x, 818, 40, 4); d.rect('#bdbdbd', 1150, 160, 100, 620);
    const H5 = [['my', 330], ['chauau', 830], ['nhat', 1330], ['y', 1830], ['vn', 2330]];
    H5.forEach(([s, x]) => { drawHouseExterior(dd, s, x, 740); B(x - 170, 470, 340, 245); });
    signpost(scene, 1200, 380, '↓ Các ngôi nhà, bấm cửa để vào');
    for(let i=0;i<20;i++) tree(dd, 80 + i*130, 1100 + (i % 2)*120, i % 3 ? 'oak' : 'sakura', .9);
    break; }
  case 'interior': drawInterior(scene, d, dd, Z.style, W, H, B, I); break;
  case 'park': {
    grassTex(d, 0, 0, W, H, '#9ccc65', '#8bc34a');
    const ik = [['#ff8a80', 900, 560, 'Điều bạn YÊU'], ['#82b1ff', 1300, 560, 'Điều bạn GIỎI'], ['#b9f6ca', 900, 900, 'Điều thế giới CẦN'], ['#ffe57f', 1300, 900, 'Điều được TRẢ CÔNG']];
    ik.forEach(([c, x, y, t]) => { d.circ(c, x, y, 260, .45); TXT(scene, x + (x < 1100 ? -110 : 110), y + (y < 700 ? -150 : 150), t, 16, '#33691e'); });
    TXT(scene, 1100, 730, 'IKIGAI', 30, '#1b5e20').setDepth(6);
    const pond = scene.add.graphics().setDepth(0); pond.fillStyle(0x4fc3f7, 1); pond.fillEllipse(300, 400, 360, 220); B(130, 300, 340, 200);
    for(let k=0;k<6;k++) tree(dd, 200 + k*360, 200, 'sakura', 1.1);
    [[700, 400], [1500, 400], [700, 1080], [1500, 1080], [1100, 730]].forEach(([x, y], i) => { if(i === 4) return; dd.rect('#8d6e4a', x - 40, y - 20, 80, 40); for(let a=0;a<4;a++) for(let b=0;b<4;b++) dd.rect((a + b) % 2 ? '#739552' : '#ebecd0', x - 32 + a*16, y - 18 + b*9, 16, 9); dd.rect('#6d4c2e', x - 64, y - 8, 18, 18); dd.rect('#6d4c2e', x + 46, y - 8, 18, 18); B(x - 40, y - 20, 80, 36); I(x, y + 40, 70, 'Bàn cờ vua: chơi hoặc thách đấu', () => UI.chess(scene)); });
    for(let k=0;k<4;k++){ dd.rect('#9e9e9e', 1800 + k*70, 1200, 20, 40); dd.rect('#bdbdbd', 1794 + k*70, 1190, 32, 12); }
    out.ticks.push(skyLife(scene, 0, 0, W, 140, false).tick);
    break; }
  case 'mall': {
    d.rect('#f5f5f5', 0, 0, W, H); for(let y=200;y<H;y+=60) for(let x=((y/60) % 2)*60; x<W; x+=120) d.rect('#eeeeee', x, y, 60, 60); d.rect('#263238', 0, 0, W, 160); TXT(scene, 900, 80, 'TRUNG TÂM MUA SẮM RUBIK', 34, '#ffd23f');
    [['bike', 'Xe đạp', 300, 420, '#3d7bff'], ['chess', 'Bộ cờ vua', 900, 420, '#5d4037'], ['hat', 'Thời trang', 1500, 420, '#ff6f91'], ['seed', 'Hạt giống & làm vườn', 900, 900, '#2fbf71']].forEach(([k, n, x, y, c]) => {
      dd.rect(c, x - 180, y - 120, 360, 40); dd.rect('#fafafa', x - 180, y - 80, 360, 120); dd.rect('#8d6e4a', x - 180, y + 40, 360, 30); B(x - 180, y - 120, 360, 190);
      const t = TXT(scene, x, y - 100, n, 18, '#fff'); t.setDepth(y);
      I(x, y + 110, 90, `Mua sắm: ${n}`, () => UI.shop(k)); });
    signpost(scene, 900, 300, 'Chào mừng! Bấm E ở quầy để mua'); break; }
  case 'garden': {
    grassTex(d, 0, 0, W, H, '#8bc34a', '#7cb342'); d.rect('#5d4037', 0, 0, W, 180); TXT(scene, 800, 90, 'KHU VƯỜN · MUA ĐẤT, GIEO HẠT, TƯỚI NƯỚC, THU HOẠCH', 22, '#fff');
    scene.plotG = scene.add.graphics().setDepth(3);
    for(let i=0;i<SHARED.PLOT_COUNT;i++){ const x = 200 + (i % 4)*340, y = 320 + Math.floor(i/4)*230; I(x + 110, y + 150, 100, 'Mảnh vườn số ' + (i + 1), () => UI.garden(i)); }
    break; }
  }
  // exits & signposts
  Z.exits.forEach(e => { exitMarker(scene, e); const sx = e.x + e.w/2, sy = e.y < Z.walk[1] + 60 ? e.y + 110 : e.y - 10; if(Z.theme !== 'town' || e.to === 'duongchinh') signpost(scene, sx, sy, e.label); });
  return out;
}
function drawHouseExterior(d, s, x, y){
  if(s === 'my'){ d.rect('#eceff1', x - 160, y - 240, 320, 200); d.tri('#455a64', x - 180, y - 240, x + 180, y - 240, x, y - 330); d.rect('#fafafa', x - 170, y - 60, 340, 20); for(let k=0;k<5;k++) d.rect('#fafafa', x - 160 + k*80, y - 120, 8, 60); d.rect('#1565c0', x - 30, y - 140, 60, 100); d.rect('#90caf9', x - 120, y - 200, 50, 40); d.rect('#90caf9', x + 70, y - 200, 50, 40); d.rect('#e53935', x + 120, y - 300, 10, 40); }
  else if(s === 'chauau'){ d.rect('#bcaaa4', x - 170, y - 260, 340, 220); for(const tx of [-170, 130]){ d.rect('#a1887f', x + tx, y - 320, 40, 280); d.tri('#4e342e', x + tx - 6, y - 320, x + tx + 46, y - 320, x + tx + 20, y - 370); } d.rect('#3e2723', x - 30, y - 150, 60, 110); d.circ('#3e2723', x, y - 150, 30); for(let k=0;k<4;k++) d.rect('#90caf9', x - 120 + k*70, y - 230, 30, 50); d.rect('#ffd23f', x - 170, y - 262, 340, 6); }
  else if(s === 'nhat'){ d.rect('#d7ccc8', x - 150, y - 200, 300, 160); d.tri('#37474f', x - 200, y - 200, x + 200, y - 200, x, y - 280); d.rect('#37474f', x - 200, y - 206, 400, 10); d.tri('#37474f', x - 210, y - 196, x - 190, y - 196, x - 214, y - 214); d.tri('#37474f', x + 210, y - 196, x + 190, y - 196, x + 214, y - 214); for(let k=0;k<6;k++) d.rect('#fff8e1', x - 140 + k*48, y - 180, 40, 100); for(let k=0;k<6;k++) d.rect('#8d6e4a', x - 140 + k*48, y - 180, 2, 100); d.rect('#c62828', x - 190, y - 60, 10, 30); }
  else if(s === 'y'){ d.rect('#ffe0b2', x - 170, y - 230, 340, 190); d.tri('#d84315', x - 190, y - 230, x + 190, y - 230, x, y - 290); for(let k=0;k<4;k++){ d.rect('#fff3e0', x - 140 + k*80, y - 150, 40, 110); d.circ('#fff3e0', x - 120 + k*80, y - 150, 20); } d.rect('#6d4c2e', x - 30, y - 140, 60, 100); d.rect('#2e7d32', x - 210, y - 220, 18, 180); d.rect('#2e7d32', x + 192, y - 220, 18, 180); }
  else { d.rect('#bcaaa4', x - 170, y - 200, 340, 160); d.tri('#b71c1c', x - 200, y - 200, x + 200, y - 200, x, y - 270); for(let k=0;k<12;k++) d.rect('#8e1b1b', x - 200 + k*34, y - 208, 2, 10); d.rect('#5d4037', x - 160, y - 200, 10, 160); d.rect('#5d4037', x + 150, y - 200, 10, 160); for(let k=0;k<3;k++) d.rect('#6d4c2e', x - 110 + k*80, y - 150, 60, 110); d.rect('#ffd23f', x - 40, y - 190, 80, 20); d.rect('#e53935', x - 220, y - 120, 16, 24); d.rect('#e53935', x + 204, y - 120, 16, 24); tree(d, x - 250, y - 20, 'palm', .9); }
}
function drawInterior(scene, d, dd, s, W, H, B, I){
  const P = {my:['#eceff1','#8d6e4a','Phong cách Mỹ: phòng khách ấm cúng'], chauau:['#efebe9','#4e342e','Quý tộc châu Âu: đèn chùm, thảm đỏ, đàn dương cầm'], nhat:['#f1e9d2','#c9b07a','Nhật Bản: chiếu tatami, cửa giấy, bonsai'], y:['#ffe0b2','#d84315','Biệt thự Ý: gạch nung, mái vòm, đài phun nước'], vn:['#efe2c6','#6d4c2e','Nhà Việt ba gian: sập gụ, tủ chè, tranh Đông Hồ']}[s];
  d.rect(P[0], 0, 0, W, 200); d.rect(P[1], 0, 190, W, 10);
  if(s === 'nhat'){ for(let y=200;y<H;y+=80) for(let x=((y/80) % 2)*80; x<W; x+=160){ d.rect('#d8c99a', x, y, 158, 78); d.rect('#3e2723', x, y, 158, 2); } for(let k=0;k<8;k++){ d.rect('#fff8e1', 60 + k*140, 30, 120, 150); for(let a=1;a<3;a++) d.rect('#8d6e4a', 60 + k*140 + a*40, 30, 2, 150); for(let b=1;b<4;b++) d.rect('#8d6e4a', 60 + k*140, 30 + b*37, 120, 2); } }
  else if(s === 'y'){ for(let y=200;y<H;y+=50) for(let x=0;x<W;x+=50) d.rect(((x + y)/50) % 2 ? '#d84315' : '#ef6c00', x, y, 50, 50); for(let k=0;k<5;k++){ d.circ('#fff3e0', 160 + k*220, 100, 60); d.rect('#fff3e0', 100 + k*220, 100, 120, 90); d.rect('#4fc3f7', 120 + k*220, 70, 80, 110, .5); } }
  else if(s === 'chauau'){ d.rect('#5d4037', 0, 200, W, H - 200); d.rect('#b71c1c', 500, 200, 200, H - 200); d.rect('#ffd23f', 498, 200, 4, H - 200); d.rect('#ffd23f', 698, 200, 4, H - 200); for(let k=0;k<6;k++){ d.rect('#d7ccc8', 80 + k*200, 20, 26, 170); d.rect('#ffd23f', 140 + k*200, 50, 70, 90); d.rect(['#7986cb','#81c784','#ffb74d'][k % 3], 146 + k*200, 56, 58, 78); } }
  else if(s === 'vn'){ for(let y=200;y<H;y+=40) for(let x=0;x<W;x+=40) d.rect(((x + y)/40) % 2 ? '#b23c17' : '#c1440e', x + 1, y + 1, 38, 38); for(let k=0;k<4;k++) d.rect('#5d4037', 100 + k*330, 0, 14, 200); for(let k=0;k<3;k++){ d.rect('#fff8e1', 180 + k*330, 40, 160, 110); d.rect(['#e53935','#43a047','#fdd835'][k], 200 + k*330, 60, 120, 70, .8); } }
  else { d.rect('#a1887f', 0, 200, W, H - 200); for(let x=0;x<W;x+=60) d.rect('#8d6e4a', x, 200, 2, H - 200); for(let k=0;k<3;k++){ d.rect('#90caf9', 160 + k*380, 50, 140, 110); d.rect('#fff', 228 + k*380, 50, 4, 110); } }
  TXT(scene, W/2, 210, P[2], 18, '#3e2723', 'rgba(255,255,255,.75)').setDepth(6);
  const F = (x, y, w, h, c, t) => { dd.rect('#000', x + 4, y + h - 4, w, 8, .15); dd.rect(c, x, y, w, h); dd.rect(shadeHex(c, .25), x, y, w, 6); if(t) TXT(scene, x + w/2, y - 12, t, 12, '#3e2723', 'rgba(255,255,255,.7)').setDepth(7); B(x, y, w, h); };
  if(s === 'my'){ F(120, 300, 260, 70, '#1565c0', 'Sofa'); F(160, 400, 180, 60, '#8d6e4a', 'Bàn trà'); F(500, 260, 200, 60, '#212121', 'TV & kệ'); F(820, 260, 180, 120, '#bcaaa4', 'Lò sưởi'); dd.rect('#ff7043', 870, 320, 80, 40); F(860, 470, 200, 120, '#c62828', 'Bàn ăn'); dd.rect('#b0bec5', 480, 480, 240, 140, .6); }
  if(s === 'chauau'){ F(100, 300, 240, 120, '#212121', 'Đàn dương cầm'); F(860, 300, 220, 80, '#7b1fa2', 'Ghế nhung'); F(820, 480, 300, 100, '#6d4c41', 'Bàn tiệc'); for(let k=0;k<3;k++){ dd.circ('#ffd23f', 300 + k*300, 260, 26, .4); dd.circ('#fff59d', 300 + k*300, 260, 10); } F(140, 520, 160, 70, '#ffd23f', 'Rương báu'); }
  if(s === 'nhat'){ F(480, 400, 240, 90, '#5d4037', 'Bàn thấp (chabudai)'); for(const [x, y] of [[440, 380], [740, 380], [440, 500], [740, 500]]) dd.rect('#c62828', x, y, 40, 30); F(120, 280, 80, 80, '#8d6e4a', 'Bonsai'); dd.circ('#2e7d32', 160, 270, 30); F(1000, 280, 80, 120, '#fff8e1', 'Đèn lồng'); dd.circ('#ffcc80', 1040, 330, 26, .6); }
  if(s === 'y'){ F(480, 320, 240, 120, '#fafafa', 'Đài phun nước'); dd.circ('#4fc3f7', 600, 380, 40); F(120, 300, 260, 100, '#c62828', 'Bàn ăn khăn ca rô'); for(let a=0;a<8;a++) for(let b=0;b<3;b++) if((a + b) % 2) dd.rect('#fff', 120 + a*32, 300 + b*33, 32, 33); F(880, 300, 80, 100, '#558b2f', 'Cây ô liu'); F(1000, 480, 120, 80, '#6d4c2e', 'Tủ rượu nho'); }
  if(s === 'vn'){ F(460, 280, 280, 90, '#4e342e', 'Sập gụ'); F(120, 280, 200, 110, '#3e2723', 'Tủ chè'); F(900, 280, 180, 90, '#6d4c2e', 'Bộ bàn ghế gỗ'); F(140, 500, 70, 70, '#8d6e4a', 'Chum nước'); F(980, 500, 60, 90, '#e53935', 'Đèn lồng'); dd.circ('#ffcc80', 1010, 530, 20, .6); for(let k=0;k<3;k++) dd.rect('#fff8e1', 520 + k*60, 240, 40, 30); }
  I(W/2, 620, 120, 'Cảm nhận kiến trúc ngôi nhà', () => UI.toast(P[2]));
}
// ---------- missile strike on pirates (motion scene) ----------
const Missile = {
  start(scene, navy){
    if(scene.missileBusy) return; scene.missileBusy = true;
    const cam = scene.cameras.main, px = Math.min(scene.Z.w - 140, navy.x + 640), py = 1080;
    const pir = scene.add.container(px + 400, py).setDepth(py); const pg = scene.add.graphics(); const d = PG(pg);
    d.tri('#3e2723', -90, 0, 90, 0, 70, 24); d.rect('#4e342e', -80, -14, 160, 16); d.rect('#5d4037', -4, -120, 6, 110); d.tri('#212121', 2, -118, 2, -40, 70, -50); d.rect('#fafafa', 20, -96, 16, 12); d.circ('#fafafa', 28, -96, 6); pir.add(pg); pir.add(TXT(scene, 0, -140, 'TÀU HẢI TẶC!', 16, '#ff5252', 'rgba(0,0,0,.6)'));
    scene.tweens.add({targets:pir, x:px, duration:2200, ease:'Sine.easeOut'});
    cam.stopFollow(); cam.pan((navy.x + px)/2, 900, 1200, 'Sine.easeInOut'); UI.toast('Phát hiện tàu hải tặc! Bấm nút PHÓNG TÊN LỬA (hoặc phím Space)');
    const wrap = document.createElement('div'); Object.assign(wrap.style, {position:'fixed', left:0, right:0, bottom:'150px', display:'flex', justifyContent:'center', zIndex:5, pointerEvents:'none'});
    const btn = document.createElement('button'); btn.className = 'primary fire'; btn.textContent = '🚀 PHÓNG TÊN LỬA'; Object.assign(btn.style, {fontSize:'22px', padding:'12px 22px', pointerEvents:'auto'}); wrap.appendChild(btn); document.body.appendChild(wrap);
    const go = () => { if(!wrap.isConnected) return; wrap.remove(); scene.input.keyboard.off('keydown-SPACE', go); Missile.fire(scene, navy, pir); };
    btn.onclick = go; scene.input.keyboard.on('keydown-SPACE', go); scene.events.once('shutdown', () => { wrap.remove(); scene.missileBusy = false; });
  },
  fire(scene, navy, pir){
    const cam = scene.cameras.main, sx = navy.x + 30, sy = navy.y - 40;
    const smoke = scene.add.particles(0, 0, 'puff', {speed:{min:10, max:40}, scale:{start:.6, end:2.2}, alpha:{start:.7, end:0}, lifespan:1400, frequency:12, tint:[0xeeeeee, 0xbdbdbd, 0x9e9e9e]}).setDepth(2000);
    const fire = scene.add.particles(0, 0, 'spark', {speed:{min:20, max:80}, scale:{start:.8, end:0}, lifespan:300, frequency:10, blendMode:'ADD', tint:[0xffeb3b, 0xff9800, 0xff5722]}).setDepth(2001);
    const m = scene.add.container(sx, sy).setDepth(2002); const mg = scene.add.graphics(); PG(mg).rect('#eceff1', -4, -22, 8, 30); PG(mg).tri('#e53935', -4, -22, 4, -22, 0, -34); PG(mg).tri('#455a64', -4, 8, -10, 14, -4, 0); PG(mg).tri('#455a64', 4, 8, 10, 14, 4, 0); m.add(mg);
    smoke.startFollow(m); fire.startFollow(m, 0, 14);
    cam.flash(150, 255, 240, 200); cam.shake(400, .006); Snd.launch();
    const tx = pir.x, ty = pir.y - 20, c = {x:(sx + tx)/2, y:sy - 520};
    const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(sx, sy), new Phaser.Math.Vector2(c.x, c.y), new Phaser.Math.Vector2(tx, ty)); const t = {v:0};
    cam.startFollow(m, true, .08, .08);
    scene.tweens.add({targets:t, v:1, duration:2200, ease:'Sine.easeIn', onUpdate:() => { const p = curve.getPoint(t.v), p2 = curve.getPoint(Math.min(1, t.v + .01)); m.x = p.x; m.y = p.y; m.rotation = Math.atan2(p2.y - p.y, p2.x - p.x) + Math.PI/2; },
      onComplete:() => { smoke.stop(); fire.stop(); m.destroy(); cam.stopFollow(); Missile.boom(scene, tx, ty, pir); setTimeout(() => { smoke.destroy(); fire.destroy(); }, 1600); }});
  },
  boom(scene, x, y, pir){
    const cam = scene.cameras.main; cam.flash(400, 255, 255, 255); cam.shake(900, .02); Snd.boom();
    const ex = scene.add.particles(x, y, 'spark', {speed:{min:120, max:520}, scale:{start:2.2, end:0}, lifespan:{min:500, max:1300}, blendMode:'ADD', tint:[0xffffff, 0xffeb3b, 0xff9800, 0xff3d00], emitting:false}).setDepth(2100); ex.explode(160);
    const sm = scene.add.particles(x, y, 'puff', {speed:{min:30, max:160}, scale:{start:1.5, end:5}, alpha:{start:.8, end:0}, lifespan:2600, tint:[0x424242, 0x616161, 0x757575], emitting:false}).setDepth(2099); sm.explode(60);
    const ring = scene.add.circle(x, y, 10, 0xffffff, 0).setStrokeStyle(8, 0xffecb3).setDepth(2101); scene.tweens.add({targets:ring, radius:260, alpha:0, duration:700, onUpdate:() => ring.setStrokeStyle(8*ring.alpha + 1, 0xffecb3, ring.alpha)});
    const bum = TXT(scene, x, y - 140, 'BÙM!', 90, '#ffeb3b').setDepth(2200).setStroke('#d84315', 10).setScale(.2);
    scene.tweens.add({targets:bum, scale:1.3, duration:400, ease:'Back.easeOut', yoyo:true, hold:700, onComplete:() => bum.destroy()});
    for(let i=0;i<14;i++){ const piece = scene.add.rectangle(x, y, 10 + Math.random()*20, 6, 0x3e2723).setDepth(2098); scene.tweens.add({targets:piece, x:x + (Math.random() - .5)*500, y:y - 100 - Math.random()*300, angle:Math.random()*720, duration:700, ease:'Quad.easeOut', yoyo:false, onComplete:() => scene.tweens.add({targets:piece, y:y + 200, alpha:0, duration:900, onComplete:() => piece.destroy()})}); }
    scene.tweens.add({targets:pir, angle:25, y:pir.y + 140, alpha:0, duration:2600, delay:300, ease:'Quad.easeIn', onComplete:() => { pir.destroy(); scene.missileBusy = false; cam.startFollow(scene.camTarget, true, .12, .12); }});
    NET.reward('pirate', 'Đánh chìm tàu hải tặc'); setTimeout(() => UI.toast('Đánh chìm tàu hải tặc! Biển cả bình yên trở lại.'), 900);
  }
};
const Snd = {
  ac:null, ctx(){ if(!this.ac) this.ac = new (window.AudioContext || window.webkitAudioContext)(); if(this.ac.state === 'suspended') this.ac.resume(); return this.ac; },
  noise(d, f, v){ const ac = this.ctx(), b = ac.createBuffer(1, ac.sampleRate*d, ac.sampleRate), x = b.getChannelData(0); for(let i=0;i<x.length;i++) x[i] = (Math.random()*2 - 1)*(1 - i/x.length); const s = ac.createBufferSource(); s.buffer = b; const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = f; const g = ac.createGain(); g.gain.value = v; s.connect(fl); fl.connect(g); g.connect(ac.destination); s.start(); },
  launch(){ this.noise(2.2, 1200, .5); }, boom(){ this.noise(2.8, 300, 1); this.noise(.6, 3000, .4); },
  tone(f, d, v, type){ const ac = this.ctx(), o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(v || .2, ac.currentTime + .01); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + d); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d + .05); }
};
