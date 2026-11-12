// ================= WEATHER / SEASON / HAZARDS =================
const WEATHER_MSG = {
  bao:'Bão đến! Nam hướng dẫn mọi người vào Hội trường lớn.',
  sieubao:'Siêu bão mạnh nhất từ trước tới nay! Tất cả vào Hội trường, Nam khóa cửa các phòng.',
  loc:'Lốc xoáy xuất hiện! Mọi người vào Hội trường lớn ngay, lốc có thể cuốn người bay lên.',
  samset:'Sấm sét dữ dội! Vào trong nhà, không đứng dưới cây cao hay ngoài sân trống.',
  muada:'Mưa đá! Mọi người vào trong nhà ngay.',
  suongmu:'Sương mù dày đặc. Hải đăng bật đèn, tàu thuyền kéo còi.',
  dongdat:'Động đất! Ngồi thấp, che đầu, rồi sơ tán ra sân bóng đá, tránh xa tòa nhà.',
  nangnong:'Nắng nóng gay gắt! Nhớ uống nước, đội mũ, ra biển thì bôi kem chống nắng.',
  cauvong:'Cầu vồng hiện ra trên biển, mọi người cùng ngắm!',
  tuyet:'Tuyết rơi trắng xóa cả trường và rừng thông!',
  baotuyet:'Bão tuyết! Tất cả vào trong nhà giữ ấm.',
  songthan:'Cảnh báo sóng thần! Mọi người rời bãi biển, vào Hội trường lớn ngay!',
  nhatthuc:'Nhật thực! Trời tối sầm giữa ban ngày. Không nhìn thẳng vào mặt trời.',
  saobang:'Mưa sao băng trên trời, mọi người cùng ước một điều ước!'
};
function setWeather(w, manual){
  if(w === weather && !manual){ weatherUntil = clock + rnd(80,160); return; }
  const prev = weather; weather = w;
  weatherUntil = clock + (['bao','sieubao','loc','samset','muada','dongdat','baotuyet','songthan','nhatthuc','saobang','cauvong'].includes(w) ? rnd(40,80) : rnd(90,180));
  if(dayStats) dayStats.weather.push(WEATHERS[w].name);
  if(prev !== w){
    log('weather', `Thời tiết chuyển sang ${WEATHERS[w].name.toLowerCase()}${manual ? ' (bạn chọn)' : ''}.`);
    if(WEATHER_MSG[w]) log(w === 'suongmu' ? 'sea' : 'nam', WEATHER_MSG[w], w === 'suongmu' ? 'hung' : 'nam');
    if(w === 'loc') tornado = {x:-80, baseY:rnd(560, 980), y:800, vx:42, a:0, life:1};
    if(w === 'dongdat') quakeT = 1.5;
    if(w === 'songthan') tsu = {y:H, dir:-1, n:0};
    if(w === 'nhatthuc' || w === 'saobang' || w === 'cauvong') agents.filter(a => a.visible && !a.inSub).slice(0, 7).forEach(a => say(a, w === 'nhatthuc' ? 'Nhật thực kìa!' : w === 'saobang' ? 'Ước gì được điểm 10!' : 'Cầu vồng đẹp quá!'));
    if(prev === 'dongdat') cracks = [];
  }
  agents.forEach(a => { if(!a.controlled) a.planKey = null; });
  renderButtons();
}
function setSeason(s, auto){
  if(season === s) return;
  season = s;
  log('weather', `Chuyển sang mùa ${SEASONS[s].name}${auto ? '' : ' (bạn chọn)'}.`);
  parts = parts.filter(p => p.k === 'rain' || p.k === 'note');
  renderButtons();
}
function autoWeatherTick(){
  if(!autoWeather || clock < weatherUntil) return;
  const wts = W_WEIGHTS[season]; let r = Math.random(), acc = 0, choice = 'nang';
  for(const k in wts){ acc += wts[k]; if(r <= acc){ choice = k; break; } }
  setWeather(choice, false);
}
const outdoorVictims = () => agents.filter(a => a.visible && !a.inSub && !a.flying && !indoor(a));
function strike(){
  let tx, ty;
  const out = outdoorVictims();
  const ctrl = out.find(a => a.controlled);
  if(ctrl && Math.random() < .09){ /* 9% of bolts aim at you */ tx = ctrl.x + rnd(-15,15); ty = ctrl.y; }
  else if(out.length && Math.random() < .25){ const v = pick(out); tx = v.x + rnd(-25,25); ty = v.y; }
  else if(Math.random() < .35){ tx = LIGHTHOUSE[0]; ty = 740; }
  else { tx = clamp(rnd(cam.x - cw/cam.z/2, cam.x + cw/cam.z/2), 20, W-20); ty = clamp(rnd(cam.y - ch/cam.z/2, cam.y + ch/cam.z/2), 40, H-40); }
  const seg = [[tx + rnd(-80,80), ty - 520]];
  for(let i=1;i<9;i++){ const k = i/9; seg.push([seg[0][0] + (tx - seg[0][0])*k + rnd(-26,26), seg[0][1] + (ty - seg[0][1])*k]); }
  seg.push([tx, ty]);
  bolts.push({seg, t:.35, x:tx, y:ty});
  if(!RM.matches && realT - lastFlash > 2){ flash = 1; lastFlash = realT; }
  agents.forEach(a => {
    if(!a.visible || a.inSub || a.flying || indoor(a) || dist(a.x,a.y,tx,ty) > 45) return;
    a.shocked = realT + 1.8; knock(a, clock + 6);
    say(a, 'Bzzzt!');
    dayStats.hazards.push(`${a.name} bị sét đánh gần, giật điện (${fmt(clock)})`);
    log('hazard', `Sét đánh gần ${a.name}! ${a.name} bị giật điện và ngã xuống. Cô Ngọc đưa đi kiểm tra sức khỏe.`, a.id);
  });
}
function updateHazards(dtR){
  agents.forEach(a => {
    if(!a.flying) return;
    const f = a.flying; f.t += dtR;
    if(tornado){ f.cx = tornado.x; f.cy = tornado.y; }
    f.ang += dtR*9; f.r = 22 + f.t*24;
    a.x = f.cx + Math.cos(f.ang)*f.r; a.y = f.cy + Math.sin(f.ang)*f.r*.4;
    a.lift = Math.min(130, f.t*70);
    if(f.t > 2.8){
      a.flying = null; a.lift = 0;
      let nx = clamp(f.cx + rnd(-240,240), 60, W-60), ny = clamp(f.cy + rnd(-180,60), 330, 870);
      const rg = regionAt(nx, ny); if(R[rg] && R[rg].walls && R[rg].dout){ nx = R[rg].dout[0]; ny = R[rg].dout[1]; }
      a.x = nx; a.y = ny; if(!canMove(a.x, a.y, a.x, a.y)){ a.y = Math.min(a.y, 760); if(!canMove(a.x, a.y, a.x, a.y)){ a.x = clamp(a.x, 60, W - 60); a.y = 700; } } knock(a, clock + 6);
      say(a, 'Chóng mặt quá!');
      dayStats.hazards.push(`${a.name} bị lốc cuốn (${fmt(clock)})`);
      log('hazard', `${a.name} bị lốc cuốn bay vòng vòng rồi rơi xuống ${R[regionAt(a.x,a.y)].name}.`, a.id);
    }
  });
  if(tornado && weather === 'loc'){
    outdoorVictims().forEach(a => {
      if(down(a) || dist(a.x, a.y, tornado.x, tornado.y) > 60) return;
      a.flying = {t:0, ang:Math.atan2(a.y - tornado.y, a.x - tornado.x), r:30, cx:tornado.x, cy:tornado.y};
      a.path = []; a.queue = []; a.cur = null; a.planKey = null;
      say(a, 'Áaaa!'); log('hazard', `Lốc xoáy cuốn ${a.name} bay lên trời!`, a.id);
    });
  }
  if(isQuake()){
    quakeT -= dtR;
    if(quakeT <= 0){
      quakeT = rnd(4, 8); shake = 1;
      const fell = [];
      agents.forEach(a => { if(a.visible && !a.inSub && !a.flying && !down(a) && (a.controlled || Math.random() < .35)){ knock(a, clock + 5); say(a, 'Ối!'); fell.push(a.name); } });
      if(fell.length){ log('hazard', `Động đất rung mạnh! ${fell.join(', ')} bị ngã.`); dayStats.hazards.push(`Động đất làm ${fell.length} người ngã (${fmt(clock)})`); }
      if(cracks.length < 14){ const cx = rnd(cam.x - 300, cam.x + 300), cy = rnd(cam.y - 200, cam.y + 200); const pts = [[cx,cy]]; for(let i=0;i<6;i++){ const l = pts[pts.length-1]; pts.push([l[0] + rnd(-30,30), l[1] + rnd(8,22)]); } cracks.push(pts); }
    }
  }
  if(tsu){
    tsu.y += tsu.dir * dtR * 160;
    if(tsu.dir < 0 && tsu.y <= 770) tsu.dir = 1;
    else if(tsu.dir > 0 && tsu.y >= H){ if(weather === 'songthan'){ tsu.dir = -1; tsu.n++; } else tsu = null; }
    if(tsu && tsu.dir < 0) agents.forEach(a => {
      const tag = day + '-' + tsu.n;
      if(!a.visible || a.inSub || a.flying || a.y < 780 || a.y < tsu.y - 4 || a.tsuTag === tag) return;
      a.tsuTag = tag; a.y = Math.max(762, tsu.y - 26); knock(a, clock + 6); say(a, 'Cứu với!');
      dayStats.hazards.push(`${a.name} bị sóng thần đánh lên bờ (${fmt(clock)})`);
      log('hazard', `Sóng thần đánh ${a.name} dạt lên bờ! May mà không sao.`, a.id);
    });
  }
  shake = Math.max(0, shake - dtR*1.4);
  const rate = {samset:.55, bao:.12, sieubao:.35}[weather] || 0;
  if(rate && Math.random() < dtR*rate) strike();
  bolts = bolts.filter(b => (b.t -= dtR) > 0);
}

// ================= SIMULATION =================
function simulate(minutes){
  let left = minutes;
  while(left > 0){
    const dt = Math.min(.25, left); left -= dt;
    clock += dt;
    const m = Math.floor(clock);
    if(m !== lastBrainMin){ lastBrainMin = m; autoWeatherTick(); runBrains(); }
    agents.forEach(a => v26Agent(a, dt*(V25MK || 1)));
    if(festival && festival.kind === 'lan' && festival.head && festival.tail && festival.tail.visible){
      const h = festival.head, t = festival.tail; t.x = h.x - h.dir*18; t.y = h.y - 1; t.dir = h.dir; t.moving = h.moving; t.walk = h.walk + .5;
    }
    updateSub(dt*(V25MK || 1)); updateTruck(dt*(V25MK || 1)); updateBall(dt*(V25MK || 1));
    if(clock >= (REALT.on ? 1e9 : 1320)){
      agents.forEach(a => { if(a.isPlayer) return; if(a.id !== 'nam') hide(a); a.controlled = false; });
      fade = 1; newDay(false); lastBrainMin = -1;
    }
  }
}

// ================= CAMERA =================
const stage = document.getElementById('stage'), cvs = document.getElementById('world'); let ctx = cvs.getContext('2d'); const mainCtx = ctx;
let cw = 0, ch = 0, DPR = 1;
const cam = {x:820, y:520, z:1};
const fitZ = () => Math.min(cw/W, ch/(H - Y0));
function resize(){
  const r = stage.getBoundingClientRect();
  DPR = Math.min(2, window.devicePixelRatio || 1);
  const first = cw === 0;
  cw = r.width; ch = r.height;
  cvs.width = Math.round(cw*DPR); cvs.height = Math.round(ch*DPR);
  if(first){
    if(cw < 700){ cam.z = Math.max(fitZ()*2.6, .5); cam.x = 900; cam.y = 500; } else { cam.z = Math.min(cw/1640, ch/1000); cam.x = 820; cam.y = 520; }
  }
  clampCam();
}
function clampCam(){
  cam.z = Math.max(fitZ()*.95, Math.min(3, cam.z));
  const vw = cw/cam.z, vh = ch/cam.z;
  cam.x = vw >= W ? W/2 : Math.max(vw/2, Math.min(W - vw/2, cam.x));
  cam.y = vh >= H - Y0 ? (H + Y0)/2 : Math.max(Y0 + vh/2, Math.min(H - vh/2, cam.y));
}
const toScreen = (x,y) => [(x - cam.x)*cam.z + cw/2, (y - cam.y)*cam.z + ch/2];
const toWorld = (sx,sy) => [(sx - cw/2)/cam.z + cam.x, (sy - ch/2)/cam.z + cam.y];
function zoomAt(f, sx, sy){
  const [wx, wy] = toWorld(sx, sy);
  cam.z *= f; clampCam();
  if(!followCam){ const [nx, ny] = toWorld(sx, sy); cam.x += wx - nx; cam.y += wy - ny; clampCam(); }
}

