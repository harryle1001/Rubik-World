// ================= EXT52 (v44c): Hot-air Balloon redrawn for the real screen shape — in portrait the sky fills the whole
// phone and you can fly right up to the top; slow, calm and smooth; six scenes (day, sunset, snowy mountains,
// waterfalls, starry night, rice terraces); its own HUD and end card =================
const BL = {scenes:['Bay ngày', 'Bay hoàng hôn', 'Núi tuyết', 'Thác nước', 'Đêm sao', 'Ruộng bậc thang']};
function blSize(){ const W = innerWidth, H = innerHeight; if(H > W){ const vw = 480; return [vw, Math.round(Math.min(1400, vw*H/W))]; } return [800, Math.max(450, Math.min(700, Math.round(800*H/W)))]; }
const BL_SKY = [['#4fa3e0', '#cdeafc', null], ['#2b1d5a', '#ffd180', '#ff8a65'], ['#7fa7e6', '#eef4fb', '#b9d3f2'], ['#6cc3d5', '#d8f3e6', '#a6e0d8'], ['#0b1036', '#2a2f6b', '#141a4d'], ['#8fd0f2', '#fdf3c9', '#cdebf2']];
const BL_LAND = [['#4f8a3c', '#235c34'], ['#4a3a5a', '#3a2a4a'], ['#eef4fb', '#3a5a4a'], ['#4f9a5a', '#2c6b43'], ['#1f2a48', '#141c34'], ['#7cb342', '#33691e']];
GAMES.balloon = {
  title:'Bay khinh khí cầu', opts:BL.scenes.slice(), v44top:0,
  help:'Giữ ngón tay (hoặc chuột, Space, phím lên) để đốt lửa bay lên, thả ra để hạ xuống từ từ. Mỗi độ cao có gió khác nhau. Nhặt ngôi sao và bình gas, tránh chim và núi. Cứ thong thả ngắm cảnh nhé!',
  init(o){ const [vw, vh] = blSize(); const cv = $('#arcCv'); if(cv && (cv.width !== vw || cv.height !== vh)){ cv.width = vw; cv.height = vh; }
    return {vw, vh, k:vh/450, x:0, y:vh*.45, vy:0, vx:40, fuel:100, stars:0, items:[], birds:[], next:260, burn:false, scene:o || 0, hit:0, t:0}; },
  gy(s, x){ const b = s.vh - 70; return b + Math.sin(x*.004)*26 + Math.sin(x*.011 + 1)*14 - Math.max(0, Math.sin(x*.0017))*Math.min(150, s.vh*.22); },
  wind(s, y){ const f = y/s.vh; return f < .25 ? 95 + Math.sin(s.t*.3)*18 : f < .5 ? 55 : f < .72 ? 75 + Math.sin(s.t*.5)*20 : 38; },
  update(s, dt){
    if(s.over) return; s.t += dt; const k = s.k;
    s.burn = (KA() || KU() || ARC.ptr.down) && s.fuel > 0; s.hit -= dt;
    if(s.burn){ s.vy -= 120*k*dt; s.fuel = Math.max(0, s.fuel - 5.5*dt); } else s.vy += 42*k*dt;
    s.vy *= Math.pow(.45, dt); s.vy = clampV(s.vy, -85*k, 70*k); s.y += s.vy*dt; if(s.y < 90){ s.y = 90; s.vy = Math.max(0, s.vy); }
    s.vx += (this.wind(s, s.y) - s.vx)*Math.min(1, dt*.6); s.x += s.vx*dt;
    if(s.x > s.next){ s.next = s.x + 200 + Math.random()*240; const r = Math.random(); s.items.push({x:s.x + s.vw + 40, y:110 + Math.random()*(s.vh - 300), k:r < .72 ? 'star' : 'gas'}); if(Math.random() < .45) s.birds.push({x:s.x + s.vw + 120, y:110 + Math.random()*(s.vh - 320), ph:Math.random()*6}); }
    const bx = s.x + s.vw*.32, by = s.y - 34;
    s.items = s.items.filter(it => { if(Math.hypot(it.x - bx, it.y - by) < 44){ if(it.k === 'star'){ s.stars++; blipSfx(1760); } else { s.fuel = Math.min(100, s.fuel + 35); blipSfx(990); } return false; } return it.x > s.x - 120; });
    s.birds.forEach(b => { b.x -= 40*dt; b.ph += dt*6; b.yy = b.y + Math.sin(b.ph*.3)*22; if(s.hit <= 0 && Math.hypot(b.x - bx, b.yy - by) < 36){ s.hit = 1.5; s.fuel = Math.max(0, s.fuel - 18); s.vy += 50; kickSfx(.5); } });
    s.birds = s.birds.filter(b => b.x > s.x - 120);
    if(s.y + 34 > this.gy(s, bx)){ const dist = Math.floor(s.x/10); s.over = s.fuel <= 0 ? `Hạ cánh! Bay được ${dist} m` : `Chạm núi! Bay được ${dist} m`; s.sub = `${s.stars} ngôi sao · Điểm ${dist + s.stars*50}`; if(dist >= 2000) mprog('balloon'); }
  },
  draw(s, c){ const W = s.vw, H = s.vh, sc = s.scene, X = s.x, [a, b, m] = BL_SKY[sc];
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); if(m) g.addColorStop(.6, m); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, 0, W, H);
    if(sc === 4){ for(let i=0;i<120;i++){ const x = ((i*97 - X*.05) % W + W) % W, y = (i*53) % (H*.7) + 6, tw = .4 + .6*Math.abs(Math.sin(s.t*1.3 + i)); c.fillStyle = `rgba(255,250,220,${tw})`; c.fillRect(x, y, i % 7 ? 2 : 3, i % 7 ? 2 : 3); } c.fillStyle = '#fff8dc'; c.beginPath(); c.arc(W*.78, H*.12, 26, 0, 7); c.fill(); c.fillStyle = a; c.beginPath(); c.arc(W*.78 + 12, H*.12 - 8, 24, 0, 7); c.fill(); }
    if(sc === 1){ c.fillStyle = 'rgba(255,214,120,.9)'; c.beginPath(); c.arc(W*.7, H*.55, 46, 0, 7); c.fill(); }
    if(sc === 0 || sc === 5){ c.fillStyle = 'rgba(255,244,190,.9)'; c.beginPath(); c.arc(W*.8, H*.1, 30, 0, 7); c.fill(); }
    // clouds through the whole sky
    c.fillStyle = sc === 4 ? 'rgba(200,210,255,.18)' : 'rgba(255,255,255,.78)'; for(let i=0;i<10;i++){ const x = ((i*230 - X*(.2 + (i % 3)*.08)) % (W + 300) + W + 300) % (W + 300) - 150, y = 60 + (i*137) % (H*.62); c.beginPath(); c.ellipse(x, y, 58, 17, 0, 0, 7); c.ellipse(x + 38, y - 10, 38, 15, 0, 0, 7); c.fill(); }
    // far scenery
    const ridge = (par, base, amp, f, col, ph) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, H); for(let x=0;x<=W;x+=8){ const u = (X*par + x)*f + ph; c.lineTo(x, base - Math.abs(Math.sin(u))*amp - Math.sin(u*2.3)*amp*.25); } c.lineTo(W, H); c.fill(); };
    if(sc === 2){ for(const [par, base, amp, col, cap] of [[.05, H*.72, H*.3, '#8fa6c8', '#f4f8ff'], [.1, H*.8, H*.2, '#6d86ad', '#eef4ff']]){ ridge(par, base, amp, .006, col, par*40); c.save(); c.beginPath(); c.rect(0, 0, W, base - amp*.6); c.clip(); ridge(par, base, amp, .006, cap, par*40); c.restore(); } }
    else if(sc === 3){ ridge(.05, H*.7, H*.25, .005, '#5c8a6a', 1); ridge(.1, H*.8, H*.16, .007, '#3f7457', 2);
      for(let i=0;i<4;i++){ const fx = ((i*240 - X*.1) % (W + 260) + W + 260) % (W + 260) - 130, top = H*(.48 + (i % 2)*.05), bot = H*.82; c.fillStyle = '#4b5d52'; c.fillRect(fx - 16, top - 10, 56, 14); const gr = c.createLinearGradient(0, top, 0, bot); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(200,240,255,.6)'); c.fillStyle = gr; c.fillRect(fx, top, 22, bot - top);
        c.fillStyle = 'rgba(255,255,255,.6)'; for(let j=0;j<8;j++){ const yy = top + ((s.t*110 + j*37) % (bot - top)); c.fillRect(fx + 3 + (j % 3)*6, yy, 3, 11); } c.beginPath(); c.ellipse(fx + 11, bot + 2, 32, 9, 0, 0, 7); c.fill(); } }
    else if(sc === 5){ ridge(.05, H*.7, H*.2, .005, '#7bb38a', 4); for(let t=0;t<9;t++){ const y = H*.7 + t*16; c.fillStyle = t % 2 ? '#9ccc65' : '#c5e1a5'; c.beginPath(); c.moveTo(0, H); for(let x=0;x<=W;x+=10) c.lineTo(x, y + Math.sin((X*.12 + x)*.01 + t*.6)*14); c.lineTo(W, H); c.fill(); } }
    else ridge(.08, H*.8, H*.14, .006, sc === 1 ? '#6a4a7a' : sc === 4 ? '#1c2350' : '#7aa86a', 5);
    // wind lanes (soft)
    c.setLineDash([6, 12]); c.strokeStyle = sc === 4 ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.35)'; [.25, .5, .72].forEach(f => { c.beginPath(); c.moveTo(0, H*f); c.lineTo(W, H*f); c.stroke(); }); c.setLineDash([]);
    // ground + trees
    const [gc, tc] = BL_LAND[sc]; c.fillStyle = gc; c.beginPath(); c.moveTo(0, H); for(let x=0;x<=W;x+=8) c.lineTo(x, this.gy(s, X + x)); c.lineTo(W, H); c.fill();
    c.fillStyle = tc; for(let x = -(X % 64); x < W; x += 64){ const y = this.gy(s, X + x); c.beginPath(); c.moveTo(x - 9, y + 4); c.lineTo(x + 9, y + 4); c.lineTo(x, y - 18); c.fill(); }
    // stars, gas, birds
    s.items.forEach(it => { const x = it.x - X; if(it.k === 'star'){ c.font = '30px Nunito, sans-serif'; c.fillStyle = '#ffd23f'; c.fillText('★', x - 10, it.y + 10); } else { c.fillStyle = '#ef4b4b'; c.fillRect(x - 8, it.y - 12, 16, 22); c.fillStyle = '#fff'; c.fillRect(x - 4, it.y - 16, 8, 5); c.font = '800 10px Nunito, sans-serif'; c.fillText('GAS', x - 9, it.y + 4); } });
    s.birds.forEach(bd => { const x = bd.x - X, w = Math.sin(bd.ph)*6; c.strokeStyle = sc === 4 ? '#cfd8ff' : '#263238'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 12, bd.yy - w); c.lineTo(x, bd.yy); c.lineTo(x + 12, bd.yy - w); c.stroke(); });
    // the balloon
    const bx = W*.32, by = s.y, sw = Math.sin(s.t*1.4)*.04;
    if(!(s.hit > 0 && Math.floor(s.hit*10) % 2)){ c.save(); c.translate(bx, by); c.rotate(sw);
      c.fillStyle = '#ef4b4b'; c.beginPath(); c.ellipse(0, -62, 40, 48, 0, 0, 7); c.fill(); c.fillStyle = '#ffd23f'; c.fillRect(-22, -108, 10, 90); c.fillRect(12, -108, 10, 90); c.fillStyle = '#3d7bff'; c.fillRect(-5, -110, 10, 96);
      c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.ellipse(-16, -78, 9, 20, 0, 0, 7); c.fill();
      c.strokeStyle = '#5a3a1e'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-26, -24); c.lineTo(-12, 4); c.moveTo(26, -24); c.lineTo(12, 4); c.stroke();
      if(s.burn){ c.fillStyle = '#ff9800'; c.beginPath(); c.moveTo(-6, -8); c.lineTo(6, -8); c.lineTo(0, -28 - Math.random()*10); c.fill(); c.fillStyle = '#fff59d'; c.beginPath(); c.moveTo(-3, -8); c.lineTo(3, -8); c.lineTo(0, -18); c.fill(); }
      c.fillStyle = '#8d6e4a'; c.fillRect(-13, 2, 26, 18); c.fillStyle = '#6d4c2e'; c.fillRect(-13, 2, 26, 4); c.restore();
      try { if(PLAYER) drawGuy(c, Object.assign({}, PLAYER), bx, by + 6, 1.1, 1, false); } catch(e){} }
    // HUD: distance · stars on the left, gas on the right (big and readable)
    c.fillStyle = 'rgba(10,15,34,.55)'; c.beginPath(); c.roundRect ? c.roundRect(W/2 - 150, H - 46, 300, 34, 17) : c.rect(W/2 - 150, H - 46, 300, 34); c.fill();
    c.font = '800 17px Nunito, sans-serif'; c.textAlign = 'left'; c.fillStyle = '#ffd23f'; c.fillText(`${Math.floor(X/10)} m · ★ ${s.stars}`, W/2 - 136, H - 23);
    c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(W/2 + 30, H - 35, 104, 12); c.fillStyle = s.fuel > 30 ? '#2fbf71' : '#ef4b4b'; c.fillRect(W/2 + 32, H - 33, s.fuel, 8); c.textAlign = 'left';
    if(s.over){ c.fillStyle = 'rgba(5,8,20,.55)'; c.fillRect(0, 0, W, H); c.textAlign = 'center'; c.font = '900 30px Nunito, sans-serif'; c.fillStyle = '#ffd23f'; c.fillText(s.over, W/2, H*.42); c.font = '800 19px Nunito, sans-serif'; c.fillStyle = '#fff'; c.fillText(s.sub || '', W/2, H*.42 + 34); c.textAlign = 'left'; }
  }
};
GAMES.balloon.v44own = true;
// every other game gets the normal 800×450 canvas back
function v44BalloonInit(){
  const oa = openArcade; openArcade = function(id, opt){ const cv = $('#arcCv'); if(cv && id !== 'balloon' && (cv.width !== AW || cv.height !== AH)){ cv.width = AW; cv.height = AH; } return oa.apply(this, arguments); };
  // fit uses the canvas's real size (the balloon canvas is taller in portrait)
  v44Fit = function(){ const cv = $('#arcCv'); if(!cv) return; const W = innerWidth, H = innerHeight, port = H > W, side = !port && MOB.touch, sideW = side ? 116 : 0, s = Math.min((W - sideW)/cv.width, H/cv.height); document.body.classList.toggle('v44side', side); cv.style.setProperty('width', Math.floor(cv.width*s) + 'px', 'important'); cv.style.setProperty('height', Math.floor(cv.height*s) + 'px', 'important'); cv.style.setProperty('object-fit', 'fill', 'important'); };
  addEventListener('resize', () => { if(ARC.id === 'balloon' && document.body.classList.contains('v44arc')){ const [vw, vh] = blSize(), cv = $('#arcCv'); if(cv.width !== vw || cv.height !== vh){ cv.width = vw; cv.height = vh; if(ARC.s){ ARC.s.vw = vw; ARC.s.vh = vh; ARC.s.k = vh/450; } } v44Fit(); } });
  // edge sampling must use the canvas's real height
  const fs = v44Fill; v44Fill = function(){ const cv = $('#arcCv'); if(cv && cv.height !== AH && ARC.id === 'balloon'){ const bg = $('#v44Bg'); if(bg){ const g = bg.getContext('2d'); if(bg.width !== innerWidth || bg.height !== innerHeight){ bg.width = innerWidth; bg.height = innerHeight; } const r = cv.getBoundingClientRect(); g.fillStyle = '#0b1020'; g.fillRect(0, 0, bg.width, bg.height); try { g.drawImage(cv, 0, 0, 2, cv.height, 0, r.top, Math.ceil(r.left) + 1, r.height); g.drawImage(cv, cv.width - 2, 0, 2, cv.height, Math.floor(r.right) - 1, r.top, innerWidth - r.right + 2, r.height); } catch(e){} } return; } return fs.apply(this, arguments); };
}
