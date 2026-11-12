// ================= EVENTS =================
function expectedRegion(s, p){
  if(!s.visible || !s.checked || s.inSub || concert || festival || isQuake() || s.quiz || s.fight) return null;
  const a = s.group === 'A';
  switch(p){
    case 'tiet1': return a ? 'rubik' : 'elec';
    case 'tiet2': return a ? 'elec' : 'hall';
    case 'trua': return 'hall';
    case 'clb': return isStorm() ? 'hall' : ({chess:'chess', rubikyard:'rubikyard', music:'music', football:'field'})[s.club];
    case 'bien': return isWet() ? 'hall' : 'beach';
    default: return null;
  }
}
function startConcert(){
  const p = period(clock);
  if(p === 'dem' || p === 'nghi'){ log('info', 'Đang ngoài giờ học nên chưa tổ chức biểu diễn được. Chờ ngày học tiếp theo nhé.'); return; }
  const avail = students.filter(s => s.visible && s.checked && !s.inSub);
  if(!avail.length){ log('info', 'Chưa có học sinh nào điểm danh xong để biểu diễn.'); return; }
  if(festival) endFestival(true);
  const used = new Set();
  const take = pref => { const s = avail.find(x => x.id === pref && !used.has(x)) || avail.find(x => !used.has(x)); if(s) used.add(s); return s || null; };
  concert = {until: clock + 40, singer: take('bminh'), piano: take('minh'), guitar: take('triet')};
  students.forEach(s => { s.wander = false; });
  A.nam.fetch = [];
  agents.forEach(a => { if(!a.controlled) a.planKey = null; });
  const cast = [concert.singer && `${concert.singer.name} hát`, concert.piano && `${concert.piano.name} đệm đàn phím`, concert.guitar && `${concert.guitar.name} đàn guitar`].filter(Boolean).join(', ');
  log('event', `Biểu diễn "${SONG}" ở Hội trường lớn: ${cast}. Cả trường kéo về xem.`);
  if(!musicOn) startMusic();
  if(truck.state === 'off') sendTruck('loa và đèn sân khấu cho buổi biểu diễn');
  $('#concert').textContent = 'Kết thúc biểu diễn';
}
function endConcert(silent){
  concert = null;
  agents.forEach(a => { if(!a.controlled) a.planKey = null; });
  if(!silent) log('event', 'Buổi biểu diễn kết thúc, cả trường vỗ tay. Mọi người quay lại hoạt động.');
  $('#concert').textContent = 'Biểu diễn ở Hội trường';
}
function concertBrain(a){
  const c = concert, STAGE = {singer:[1375,142], piano:[1305,142], guitar:[1445,142]};
  const role = a === c.singer ? 'singer' : a === c.piano ? 'piano' : a === c.guitar ? 'guitar' : null;
  if(role){
    setPlan(a, 'concert-' + role, [{r:'hall', p:STAGE[role], task: role==='singer' ? `Hát "${SONG}" trên sân khấu` : role==='piano' ? 'Đệm đàn phím cho bài hát' : 'Đàn guitar cho bài hát', thought:'Hít thở sâu, bắt đầu nào', say: role==='singer' ? `♪ ${SONG} ♪` : null}]);
  } else if(a.id === 'nam'){
    setPlan(a, 'concert-nam', [{r:'hall', p:[1224,432], task:'Đứng ở cửa Hội trường giữ trật tự', thought:'Mọi người vào xem biểu diễn an toàn'}]);
  } else {
    const p = a.student ? SEAT_HALL(a.idx) : [1262 + staff.indexOf(a)*34, 604];
    setPlan(a, 'concert-seat', [{r:'hall', p, task:'Xem biểu diễn ở Hội trường', thought: a.student ? 'Bạn mình hát hay quá' : 'Các em biểu diễn tự tin lắm'}]);
  }
}
// ---- festivals
function startFestival(kind, until){
  if(concert) endConcert(true);
  if(festival) endFestival(true);
  festival = {kind, start:clock, until};
  const avail = students.filter(s => s.visible && s.checked && !s.inSub);
  students.forEach(s => { s.lion = null; s.drum = false; s.fspot = null; s.wander = false; });
  if(kind === 'lan'){
    const take = (id) => avail.find(s => s.id === id && !s.lion && !s.drum) || avail.find(s => !s.lion && !s.drum);
    const h = take('pbach'); if(h) h.lion = 'head';
    const t = take('hbach'); if(t) t.lion = 'tail';
    const dr = take('quan'); if(dr) dr.drum = true;
    festival.head = h; festival.tail = t;
  }
  if(kind === 'bongda'){ score = {L:0, R:0}; students.forEach(s => { s.team = s.group === 'A' ? 'L' : 'R'; }); ball.x = 1920; ball.y = 515; ball.vx = ball.vy = 0; }
  if(kind === 'noel') students.forEach(s => { s.gift = false; });
  agents.forEach(a => { if(!a.controlled) a.planKey = null; });
  const desc = {lan:'Đội lân tập trung ở sân trường, trống thúc rộn ràng', noel:'Cây thông ở sân trường sáng đèn, ông già Noel chuẩn bị phát quà', bongda:'Nhóm A (Đội Đỏ) gặp nhóm B (Đội Xanh) ở sân bóng', thamlop:'Cô Ngọc dẫn các bạn đi thăm từng lớp, gặp lại thầy cô', picnic:'Cả trường đi bộ và đạp xe vào rừng thông: ăn picnic, cắm trại bên hồ cá koi, ngắm đầm sen và vườn hoa'}[kind];
  log('event', `${FEST_NAME[kind]} bắt đầu! ${desc}.`);
  dayStats.festDone = true;
}
function endFestival(silent){
  const f = festival; festival = null;
  students.forEach(s => { s.lion = null; s.drum = false; s.fspot = null; });
  agents.forEach(a => { if(!a.controlled) a.planKey = null; });
  if(silent || !f) return;
  if(f.kind === 'bongda'){ const w = score.L === score.R ? 'Hai đội hòa' : score.L > score.R ? 'Đội Đỏ (nhóm A) vô địch' : 'Đội Xanh (nhóm B) vô địch'; log('event', `Giải bóng đá kết thúc ${score.L} – ${score.R}. ${w}!`); dayStats.goals.push(`Chung cuộc ${score.L} – ${score.R}`); }
  else if(f.kind === 'noel') log('event', `Lễ hội Giáng sinh kết thúc. Ông già Noel đã phát ${dayStats.gifts} phần quà.`);
  else log('event', `${FEST_NAME[f.kind]} kết thúc, các bạn rất vui.`);
}
function ringSpot(k, cx, cy, rx, ry){ const ang = (k / agents.length) * Math.PI*2; return [cx + Math.cos(ang)*rx, clamp(cy + Math.sin(ang)*ry, 314, 462)]; }
function festivalBrain(a){
  const f = festival, k = agents.indexOf(a);
  if(f.kind === 'picnic'){
    if(a.id === 'hung') return;
    const acts = ['picnic','bike','camp','koi','garden','lotus'];
    forestPlan(a, a.student ? acts[a.idx % 6] : ({ha:'picnic', xuan:'garden', nam:'bike', mic:'picnic', ngoc:'lotus', lai:'picnic', haquan:'koi'})[a.id] || 'picnic', 'fp');
    return;
  }
  if(f.kind === 'lan'){
    if(a.lion === 'head'){ const pts = [0,1,2,3,4,5,6,7].map(j => [480 + Math.cos(j/8*Math.PI*2)*70, 392 + Math.sin(j/8*Math.PI*2)*26]); setPlan(a, 'lan-head', pts.map(p => ({r:'yard', p, wait:1, loop:true, task:'Múa lân (đầu lân)', thought:'Lân vờn quả cầu', say: Math.random() < .3 ? 'Hây!' : null}))); return; }
    if(a.lion === 'tail'){ a.task = 'Múa lân (đuôi lân)'; a.thought = 'Bám sát bạn múa đầu'; a.planKey = 'lan-tail'; a.queue = []; a.path = []; a.cur = null; return; }
    if(a.drum){ setPlan(a, 'lan-drum', [{r:'yard', p:[480,322], task:'Đánh trống múa lân', thought:'Tùng tùng cắc!', say:'Tùng tùng cắc!'}]); return; }
    setPlan(a, 'lan-ring', [{r:'yard', p:ringSpot(k, 480, 392, 165, 70), task:'Xem múa lân', thought:'Lân đẹp quá!'}]);
    return;
  }
  if(f.kind === 'noel'){
    if(a.id === 'nam'){
      const kids = students.filter(s => s.visible && s.checked && !s.inSub);
      setPlan(a, 'santa', kids.map(s => ({r:'yard', p:(()=>{ const q = ringSpot(agents.indexOf(s), 900, 402, 150, 60); return [q[0]+14, q[1]]; })(), wait:1, task:'Làm ông già Noel phát quà', thought:'Ho ho ho!', onArrive: () => { if(!s.gift){ s.gift = true; dayStats.gifts++; say(A.nam, `Quà cho ${s.name}!`); say(s, 'Cảm ơn ông Noel!'); if(dayStats.gifts % 4 === 1) log('event', `Ông già Noel (Nam) tặng quà cho ${s.name}.`, 'nam'); } }})).concat([{r:'yard', p:[960,450], task:'Ông già Noel chụp ảnh với học sinh', say:'Giáng sinh vui vẻ!'}]));
      return;
    }
    setPlan(a, 'noel-ring', [{r:'yard', p:ringSpot(k, 900, 402, 150, 60), task: a.student ? 'Hát mừng Giáng sinh quanh cây thông' : 'Dự lễ Giáng sinh cùng học sinh', thought:'Jingle bells...'}]);
    return;
  }
  if(f.kind === 'thamlop'){
    const stops = [['rubik',[220,240]],['elec',[1850,240]],['music',[930,230]],['hall',[1375,420]],['field',[1920,515]],['chess',[565,250]]];
    if(a.id === 'ha'){ setPlan(a, 'tl-ha', [{r:'rubik', p:[220,112], task:'Đón các bạn đến thăm Lớp Rubik', say:'Chào các em, hè vui không?'}]); return; }
    if(a.id === 'xuan'){ setPlan(a, 'tl-xuan', [{r:'elec', p:[1850,104], task:'Đón các bạn đến thăm lớp lắp ráp điện', say:'Lớp mình có đèn mới đó!'}]); return; }
    const idx = Math.floor((clock - f.start) / 18) % stops.length, [rid, c] = stops[idx];
    const off = [((k % 5) - 2) * 24, (Math.floor(k / 5) - 2) * 18];
    setPlan(a, 'tour-' + idx, [{r:rid, p:[c[0] + off[0], c[1] + off[1]], task:`Đi thăm lớp: ${R[rid].name}`, thought:'Nhớ lớp quá', say: a.id === 'ngoc' ? `Đây là ${R[rid].name}` : null}]);
    return;
  }
  if(f.kind === 'bongda'){
    if(a.student){ footballPlan(a, 'Thi đấu giải bóng đá'); return; }
    if(a.id === 'nam'){ setPlan(a, 'ref', [{r:'field', p:[1920,392], task:'Làm trọng tài trận bóng', say:'Tuýt!'}]); return; }
    setPlan(a, 'bd-watch', [{r:'field', p:[1720 + (k%8)*55, 644], task:'Cổ vũ trận đấu', thought:'Cố lên các em!'}]);
  }
}
function fieldSpot(s){ return [s.team === 'L' ? rnd(1740, 1900) : rnd(1940, 2100), rnd(420, 610)]; }
function footballPlan(s, task){
  if(!s.fspot) s.fspot = fieldSpot(s);
  setPlan(s, 'fb-' + task, [{r:'field', p:s.fspot, task, thought:'Chuyền bóng cho đồng đội!'}]);
}
function goal(team){
  score[team]++;
  const who = ball.last;
  log('event', `${who ? who.name : 'Một bạn'} ghi bàn! Tỉ số Đội Đỏ ${score.L} – ${score.R} Đội Xanh.`, who && who.id);
  dayStats.goals.push(`${who ? who.name : '?'} (${fmt(clock)})`);
  if(who) say(who, 'Vàoooo!');
  ball.x = 1920; ball.y = 515; ball.vx = ball.vy = 0;
}
function updateBall(dt){
  ball.x += ball.vx*dt; ball.y += ball.vy*dt;
  const fr = Math.pow(.08, dt); ball.vx *= fr; ball.vy *= fr;
  if(ball.y < 394){ ball.y = 394; ball.vy = Math.abs(ball.vy); }
  if(ball.y > 636){ ball.y = 636; ball.vy = -Math.abs(ball.vy); }
  const mouth = Math.abs(ball.y - 515) < 36;
  if(ball.x < 1694){ if(mouth) goal('R'); else { ball.x = 1694; ball.vx = Math.abs(ball.vx); } }
  if(ball.x > 2146){ if(mouth) goal('L'); else { ball.x = 2146; ball.vx = -Math.abs(ball.vx); } }
  const pl = students.filter(s => s.visible && !s.inSub && !s.flying && !down(s) && !s.controlled && s.planKey && s.planKey.startsWith('fb-') && !s.path.length && regionAt(s.x,s.y) === 'field');
  if(pl.length < 2) return;
  pl.forEach(s => {
    const d = dist(s.x, s.y, ball.x, ball.y);
    const tx = d < 200 ? ball.x : s.fspot[0], ty = d < 200 ? ball.y : s.fspot[1];
    const dd = dist(s.x, s.y, tx, ty), st = 85*dt;
    if(dd > 3){ s.x += (tx-s.x)/dd*Math.min(st, dd); s.y += (ty-s.y)/dd*Math.min(st, dd); s.moving = true; s.walk += dt*7; s.dir = tx < s.x ? -1 : 1; }
    if(d < 12 && clock - (s.lastKick || 0) > .5){
      const gx = s.team === 'L' ? 2152 : 1688, ang = Math.atan2(515 + rnd(-70,70) - ball.y, gx - ball.x), sp = rnd(240, 380);
      ball.vx = Math.cos(ang)*sp; ball.vy = Math.sin(ang)*sp; ball.last = s; s.lastKick = clock;
    }
  });
}
// ---- fights at break time
function startFight(manual){
  const cands = students.filter(s => s.visible && s.checked && !s.saoDo && !s.inSub && !s.flying && !down(s) && !s.quiz && !s.controlled && !s.lion);
  if(cands.length < 2){ if(manual) log('info', 'Chưa có đủ học sinh ở trường để xảy ra sự cố.'); return; }
  const [a, b] = shuffle(cands).slice(0,2);
  const reason = pick(['giành quả bóng','tranh chỗ ngồi','cãi nhau ai giải Rubik nhanh hơn','va vào nhau làm rơi Rubik','trêu nhau quá trớn']);
  fight = {a, b, x:rnd(300,620), y:rnd(352,436), start:clock, reason, reported:false, sao:null};
  a.fight = b.fight = fight; a.planKey = b.planKey = null; a.wander = b.wander = false;
  log('event', `${a.name} và ${b.name} xô xát ở sân trường vì ${reason}.`, a.id);
}
function resolveFight(by){
  const f = fight; if(!f) return;
  [f.a, f.b].forEach(s => { s.violations++; s.fight = null; s.planKey = null; say(s, 'Mình xin lỗi'); });
  weekViol++;
  dayStats.fights.push(`${f.a.name} và ${f.b.name} (${f.reason})`);
  log(by.log, `${by.name} tách ${f.a.name} và ${f.b.name}, nhắc nhở và ghi vào sổ đầu bài. Hai bạn xin lỗi, bắt tay làm hòa.`, by.id);
  say(by, 'Các em bắt tay làm hòa nhé');
  if(f.sao) f.sao.planKey = null;
  fight = null; by.planKey = null; attDirty = true;
}
// ---- quizzes
function startQuiz(teacher, rid, board){
  if(!teacher.visible || concert || festival) return;
  const p = period(clock);
  const cands = students.filter(s => expectedRegion(s, p) === rid && regionAt(s.x,s.y) === rid && !s.wander && !s.moving);
  if(!cands.length) return;
  const s = pick(cands);
  s.quiz = {until: clock + 6, board, teacher, rid}; s.planKey = null;
  say(teacher, `Mời ${s.name} lên bảng`);
  log('ha', `${teacher.name} gọi ${s.name} lên bảng kiểm tra bài cũ.`, teacher.id);
}
function test15(){
  ['elec','hall'].forEach(rid => {
    const ss = students.filter(s => s.visible && regionAt(s.x,s.y) === rid);
    if(!ss.length) return;
    let best = null;
    ss.forEach(s => { const sc = clamp(Math.round(rnd(5.5, 10.4)), 4, 10); s.scores.push(sc); if(!best || sc > best[1]) best = [s, sc]; });
    log('ha', `${R[rid].name} làm bài kiểm tra 15 phút (${ss.length} bạn). Điểm cao nhất: ${best[0].name} ${best[1]} điểm.`, rid === 'elec' ? 'xuan' : 'ha');
    dayStats.quizzes.push(`Kiểm tra 15 phút ở ${R[rid].name}`);
  });
  attDirty = true;
}
// ---- truck, ships, submarine
function sendTruck(cargo){
  if(truck.state !== 'off'){ log('info', 'Xe chở hàng đang chạy, chờ xe quay về nhé.'); return; }
  Object.assign(truck, {state:'in', x:2680, y:708, path:[[1605,708],[1605,612]], cargo, vert:false, dir:-1});
  log('event', `Xe chở hàng đang đến trường, chở ${cargo}.`);
}
function updateTruck(dt){
  if(truck.state === 'off') return;
  if(truck.state === 'unload'){
    if(clock >= truck.until){ truck.state = 'out'; truck.path = [[1605,708],[2680,708]]; log('event', 'Xe chở hàng dỡ xong và rời trường.'); }
    return;
  }
  const t = truck.path[0];
  if(!t){
    if(truck.state === 'in'){ truck.state = 'unload'; truck.until = clock + 10; truck.boxes = Math.min(9, truck.boxes + 3); dayStats.deliveries.push(truck.cargo); log('event', `Xe chở hàng tới cổng sau Hội trường, dỡ ${truck.cargo}.`); }
    else truck.state = 'off';
    return;
  }
  const dx = t[0]-truck.x, dy = t[1]-truck.y, d = Math.hypot(dx,dy), st = 260*dt;
  truck.vert = Math.abs(dy) > Math.abs(dx); truck.dir = truck.vert ? (dy < 0 ? -1 : 1) : (dx < 0 ? -1 : 1);
  if(d <= st){ truck.x = t[0]; truck.y = t[1]; truck.path.shift(); } else { truck.x += dx/d*st; truck.y += dy/d*st; }
}
function spawnPirate(manual){
  if(pirate){ if(manual) log('info', 'Tàu hải tặc vẫn đang ở ngoài khơi.'); return; }
  pirate = {k:'pirate', x:-160, y:1115, v:20, dir:1};
  ships.push(pirate);
  log('sea', 'Tàu hải tặc xuất hiện ngoài khơi! Hải đăng rọi đèn theo dõi, chú Hưng gọi loa nhắc các bạn lên bờ.', 'hung');
  if(A.hung.visible) say(A.hung, 'Mọi người lên bờ!');
  students.forEach(s => { if(s.planKey === 'bien-swim') s.planKey = null; });
}
function startSubTour(passengers, manual){
  const hung = A.hung;
  if(sub.state !== 'dock'){ if(manual) log('info', 'Tàu ngầm đang lặn, chờ tàu về bến nhé.'); return; }
  if(!hung.visible || hung.flying || down(hung)){ if(manual) log('info', 'Chú Hưng chưa có ở bến tàu.'); return; }
  if(isStorm() || weather === 'suongmu' || isQuake()){ log('sea', `Chú Hưng: trời ${WEATHERS[weather].name.toLowerCase()}, tàu ngầm không ra khơi.`, 'hung'); return; }
  sub.pass = passengers.slice(0,3);
  [hung, ...sub.pass].forEach(a => {
    a.inSub = true; a.path = []; a.queue = []; a.cur = null; a.planKey = null; a.waitSub = false;
    a.task = a === hung ? 'Lái tàu ngầm' : 'Đi tàu ngầm ngắm san hô với chú Hưng';
    a.thought = a === hung ? 'Giữ độ sâu 10 mét, quay về đúng giờ' : 'Cá đẹp quá!';
    a.hist.unshift(fmt(clock) + '  ' + a.task + ' — Biển');
  });
  sub.state = 'dive'; sub.t = 0;
  log('sea', `Chú Hưng lái tàu ngầm ${sub.pass.length ? 'chở ' + sub.pass.map(s => s.name).join(', ') + ' ' : ''}lặn xuống ngắm san hô.`, 'hung');
  dayStats.subTrips.push(sub.pass.length ? sub.pass.map(s => s.name).join(', ') : 'chú Hưng đi một mình');
}
function updateSub(dt){
  const [dx, dy] = SUB_DOCK, sx = SUB_C[0] - SUB_R[0], sy = SUB_C[1];
  if(sub.state === 'dive'){ sub.t = Math.min(1, sub.t + dt/3); sub.x = dx; sub.y = dy + (sy-dy)*sub.t; sub.depth = sub.t; if(sub.t >= 1){ sub.state = 'tour'; sub.ang = Math.PI; } }
  else if(sub.state === 'tour'){
    sub.ang += dt * (Math.PI*2/24);
    const px = sub.x; sub.x = SUB_C[0] + Math.cos(sub.ang)*SUB_R[0]; sub.y = SUB_C[1] + Math.sin(sub.ang)*SUB_R[1];
    sub.dir = sub.x >= px ? 1 : -1; sub.depth = 1;
    if(sub.ang >= Math.PI*3){ sub.state = 'rise'; sub.t = 0; }
  }
  else if(sub.state === 'rise'){
    sub.t = Math.min(1, sub.t + dt/3); sub.x = sx; sub.y = sy + (dy-sy)*sub.t; sub.depth = 1 - sub.t;
    if(sub.t >= 1){
      sub.state = 'dock'; sub.depth = 0;
      const all = [A.hung, ...sub.pass];
      all.forEach((a,i) => { a.inSub = false; a.x = PIER_END[0] + (i-1)*10; a.y = PIER_END[1] - i*6; a.planKey = null; if(a.student){ a.subDone = true; say(a, 'Tuyệt quá!'); } });
      log('sea', `Tàu ngầm về bến an toàn.${sub.pass.length ? ' ' + sub.pass.map(s => s.name).join(', ') + ' kể đã thấy rùa biển và san hô.' : ''}`, 'hung');
      sub.pass = [];
    }
  }
  if(sub.state !== 'dock') [A.hung, ...sub.pass].forEach(a => { a.x = sub.x; a.y = sub.y; });
}

// ================= BRAINS =================
function practice(s, prob){
  if(s.moving || Math.random() > prob) return;
  const time = s.best * rnd(.86, 1.35);
  s.solves++;
  if(time < s.best){
    s.best = time;
    log('event', `${s.name} giải xong Rubik trong ${time.toFixed(1)} giây, kỷ lục mới!`, s.id);
    dayStats.records.push(`${s.name} ${time.toFixed(1)}s`);
    say(s, `Kỷ lục ${time.toFixed(1)}s!`);
  } else if(Math.random() < .3) say(s, `${time.toFixed(0)} giây`);
}
function build(s, prob){
  if(s.moving || Math.random() > prob) return;
  const item = pick(['đèn LED nhấp nháy','quạt mini chạy pin','chuông cửa','xe robot nhỏ','đèn giao thông mini','mạch báo trộm']);
  s.builds++;
  dayStats.builds.push(`${s.name}: ${item}`);
  if(Math.random() < .5) log('event', `${s.name} lắp xong ${item}.`, s.id);
  say(s, 'Sáng đèn rồi!');
}
function maybeWander(s){
  if(s.wanderDone || s.moving || isStorm() || s.saoDo || Math.random() > .003) return;
  s.wander = true; s.wanderDone = true; s.caught = false; s.wanderUntil = clock + 45;
  const dest = pick([['beach',[rnd(300,1250), 836],'Lẻn ra bãi biển chơi'], ['rubikyard',[rnd(100,340), 640],'Lẻn ra khu Rubik'], ['yard',[rnd(300,650), 440],'Lẻn ra sân chơi'], ['field',[rnd(1750,2100), rnd(420,600)],'Lẻn ra sân bóng']]);
  setPlan(s, 'wander', [{r:dest[0], p:dest[1], task:dest[2], thought:'Chắc không ai để ý đâu...'}]);
  log('event', `${s.name} rời lớp khi chưa được phép.`, s.id);
}
const CLUB_TASK = {chess:'Chơi cờ vua', rubikyard:'Thi giải Rubik ngoài trời'};
const MUSIC_TASK = {piano:'Đánh đàn piano', guitar:'Đàn guitar', guitar2:'Đàn guitar', singer:'Hát cùng cả nhóm', singer2:'Hát bè'};
function clubSpot(s){
  if(s.club === 'chess'){ const t = CHESS_T[Math.floor(s.chessSeat/2)]; return [t[0] + (s.chessSeat%2 ? 30 : -30), t[1]+14]; }
  if(s.club === 'music') return MUSIC_SPOTS[s.musicRole];
  return RY_SPOTS[s.rySeat % RY_SPOTS.length];
}

function forestSpot(act, k){
  switch(act){
    case 'camp': { const t = TENTS[k % TENTS.length]; return {r:'lake', p:[t[0] + 16, t[1] + 12], task:'Cắm trại bên hồ', thought:'Tối nay nướng khoai bên lửa trại'}; }
    case 'koi': { const a = (k/21)*Math.PI*2; return {r:'lake', p:[LAKE.cx + Math.cos(a)*(LAKE.rx+16), LAKE.cy + Math.sin(a)*(LAKE.ry+14)], task:'Cho cá koi ăn', thought:'Cá koi đỏ trắng đẹp quá'}; }
    case 'lotus': { const a = (k/21)*Math.PI*2; return {r:'lotus', p:[LOTUS.cx + Math.cos(a)*(LOTUS.rx+14), LOTUS.cy + Math.sin(a)*(LOTUS.ry+12)], task:'Ngắm đầm sen', thought:'Hoa sen thơm quá'}; }
    case 'garden': return {r:'garden', p:[R.garden.x + 20 + (k%4)*110, R.garden.y + 84 + (Math.floor(k/4)%3)*78], task:'Ngắm vườn hoa Đà Lạt', thought:'Hoa nào cũng đẹp'};
    case 'giantchess': return {r:'giantchess', p:[GBOARD.x + 24 + (k%8)*GBOARD.s, GBOARD.y + 8*GBOARD.s + 30 + (Math.floor(k/8)%2)*18], task:'Chơi cờ vua khổng lồ', thought:'Đẩy quân Mã to đùng này đi đâu nhỉ?'};
    case 'pondfish': { const a = (k/21)*Math.PI + .1; return {r:'pond', p:[POND.cx + Math.cos(a)*(POND.rx+16), Math.min(-36, POND.cy + Math.sin(a)*(POND.ry+14))], task:'Câu cá ở hồ thư giãn', thought:'Kiên nhẫn chờ cá cắn câu'}; }
    default: return {r:'picnic', p:[R.picnic.x + 20 + (k%4)*62, R.picnic.y + 40 + (Math.floor(k/4)%2)*80], task:'Ăn picnic trên bãi cỏ', thought:'Bánh mì với nước cam ngon quá'};
  }
}
function forestPlan(a, act, pre){
  if(act === 'bike'){ setPlan(a, pre + '-bike', [[TRAIL.x0, TRAIL.y1],[TRAIL.x0, TRAIL.y0],[TRAIL.x1, TRAIL.y0],[TRAIL.x1, TRAIL.y1]].map(p => ({r:'forest', p, loop:true, task:'Đạp xe quanh rừng thông', thought:'Gió mát quá!'}))); return; }
  const s = forestSpot(act, agents.indexOf(a));
  setPlan(a, pre + '-' + act, [{r:s.r, p:s.p, task:s.task, thought:s.thought}]);
}
function studentBrain(s, p){
  const i = s.idx;
  if(p === 'dem' || p === 've' || p === 'nghi'){ if(s.visible) goHome(s); return; }
  if(p === 'cnrung'){
    if(!s.cnOut) return;
    if(!s.visible){ if(clock >= s.arriveAt && !s.rungStarted){ s.rungStarted = true; spawnHome(s); log('event', `${s.name} ${s.bike ? 'đạp xe' : 'đi bộ'} vào rừng thông chơi ngày Chủ nhật.`, s.id); } else return; }
    if(isStorm() || isQuake()){ goHome(s); return; }
    forestPlan(s, s.cnAct, 'cn');
    return;
  }
  if(p === 'cnbong'){
    if(!s.fan) return;
    if(!s.visible){ if(clock >= s.fbAt && !s.fbStarted){ s.fbStarted = true; spawnHome(s); log('event', `${s.name} ${s.bike ? 'đạp xe' : 'đi bộ'} ra sân bóng chơi ngày Chủ nhật.`, s.id); } else return; }
    if(isStorm() || isQuake()){ goHome(s); return; }
    footballPlan(s, 'Đá bóng ngày Chủ nhật');
    return;
  }
  if(!s.visible){
    if((s.att === 'co' || s.att === 'muon') && clock >= s.arriveAt && !s.wentHome){
      spawnHome(s);
      log('event', `${s.name} ${s.bike ? 'đạp xe' : 'đi bộ'} từ nhà đến trường${s.att==='muon' ? ' (muộn)' : ''}.`, s.id);
    } else return;
  }
  if(!s.checked){
    setPlan(s, 'pad', [{r:'attend', p:PAD(i), task:'Đến ô điểm danh', thought:'Đứng đúng ô của mình để Mic điểm danh', onArrive: a => { a.atPad = true; }}]);
    return;
  }
  if(isQuake()){ setPlan(s, 'quake', [{r:'field', p:QUAKE(agents.indexOf(s)), task:'Sơ tán ra sân bóng đá (động đất)', thought:'Tránh xa tòa nhà, ngồi thấp xuống'}]); return; }
  if(s.fight){ const f = s.fight, o = f.a === s ? f.b : f.a; setPlan(s, 'fight', [{r:'yard', p:[f.x + (f.a === s ? -9 : 9), f.y], task:`Đánh lộn với ${o.name}`, thought:'Mình đang rất tức!', say: pick(['Trả đây!','Tại bạn trước!','Không phải của bạn!'])}]); return; }
  if(s.saoDo && fight && fight.sao === s && !fight.reported){
    setPlan(s, 'stopfight', [{r:'yard', p:[fight.x, fight.y + 22], task:'Sao đỏ: can ngăn đánh lộn', thought:'Phải báo cô Ngọc ngay', onArrive: () => {
      if(!fight) return; fight.reported = true; say(s, 'Dừng lại! Mình báo cô Ngọc');
      log('sao', `Sao đỏ ${s.name} phát hiện ${fight.a.name} và ${fight.b.name} đánh lộn, báo cô Ngọc.`, s.id);
      A.ngoc.planKey = null; A.nam.planKey = null;
    }}]);
    return;
  }
  if(s.quiz){
    if(clock >= s.quiz.until){
      const sc = clamp(Math.round(rnd(6, 10.4)), 4, 10); s.scores.push(sc);
      log('ha', `${s.quiz.teacher.name} kiểm tra bài cũ: ${s.name} được ${sc} điểm.`, s.quiz.teacher.id);
      dayStats.quizzes.push(`${s.name} ${sc}đ`); say(s, sc >= 8 ? 'Yeah!' : 'Lần sau em cố hơn');
      s.quiz = null; s.planKey = null; attDirty = true;
    } else { setPlan(s, 'quiz', [{r:s.quiz.rid, p:s.quiz.board, task:'Lên bảng kiểm tra bài cũ', thought:'Bình tĩnh, nhớ lại bài hôm trước'}]); return; }
  }
  if(concert){ concertBrain(s); return; }
  if(festival && !isStorm()){ festivalBrain(s); return; }
  if(s.wander){
    if(clock > s.wanderUntil && !s.caught){ s.wander = false; log('event', `${s.name} tự quay về lớp.`, s.id); }
    else return;
  }
  const storm = isStorm(), grpA = s.group === 'A', sao = SAO.indexOf(s);
  const hallSeat = task => setPlan(s, 'hall-' + task, [{r:'hall', p:SEAT_HALL(i), task, thought:'Ở trong nhà an toàn hơn'}]);
  switch(p){
    case 'den': case 'diemdanh':
      if(s.saoDo && clock >= 440) setPlan(s, 'sao-am', [{r:'attend', p:[1118, 486 + sao*30], task:'Sao đỏ: kiểm tra khăn quàng, đồng phục', thought:'Ai quên khăn quàng thì nhắc nhẹ', onArrive: () => {
        if(!s.saoNoted && Math.random() < .5){ s.saoNoted = true; const o = pick(students.filter(x => x.visible && !x.saoDo)); if(o) log('sao', `Sao đỏ ${s.name} nhắc ${o.name} đeo khăn quàng đỏ cho ngay ngắn.`, s.id); }
      }}]);
      else setPlan(s, 'pad', [{r:'attend', p:PAD(i), task:'Chờ vào lớp', thought:'Điểm danh xong rồi, chờ vào học'}]);
      break;
    case 'chaoco':
      setPlan(s, 'chaoco', [{r:'yard', p:CHAOCO(i), task:'Chào cờ đầu tuần', thought:'Đứng nghiêm, hát Quốc ca'}]);
      break;
    case 'tiet1':
      if(grpA){ setPlan(s, 'tiet1', [{r:'rubik', p:SEAT_RUBIK(i), task:'Học xoay Rubik với cô Hà', thought:'Nhớ công thức R U R\' U\''}]); practice(s, .06); }
      else { setPlan(s, 'tiet1', [{r:'elec', p:SEAT_ELEC(i-6), task:'Học lắp mạch điện với cô Xuân', thought:'Cực dương nối với chân dài của đèn LED'}]); build(s, .035); }
      maybeWander(s);
      break;
    case 'rachoi': {
      if(storm){ hallSeat('Trú trong Hội trường giờ ra chơi'); break; }
      if(s.saoDo){ setPlan(s, 'sao-patrol', [{r:'yard', p:[300 + sao*90, 360], wait:4, loop:true, task:'Sao đỏ tuần tra giờ ra chơi', thought:'Để ý xem có bạn nào xô xát không'}, {r:'yard', p:[340 + sao*90, 440], wait:4, loop:true, task:'Sao đỏ tuần tra giờ ra chơi'}]); break; }
      const z = s.breakZone;
      if(z === 'football'){ footballPlan(s, 'Đá bóng giờ ra chơi'); break; }
      if(z === 'giantchess'){ forestPlan(s, 'giantchess', 'rc'); break; }
      const steps = z === 'yard' ? [{r:'yard', p:[rnd(600,1000), rnd(352,440)], task:'Đá cầu ở sân trường', thought:'Ra chơi rồi, đá cầu thôi!'}]
        : z === 'rubikyard' ? [{r:'rubikyard', p:RY_SPOTS[i % 6], task:'Chơi Rubik giờ ra chơi', thought:'Thử phá kỷ lục của mình'}]
        : z === 'chess' ? [{r:'chess', p:[CHESS_T[i%5][0] + (i%2 ? -30 : 30), CHESS_T[i%5][1]+14], task:'Chơi cờ vua giờ ra chơi', thought:'Ván nhanh 10 phút'}]
        : [{r:'music', p:Object.values(MUSIC_SPOTS)[i%5], task:'Nghịch đàn ở phòng nhạc', thought:'Thử bấm vài nốt piano'}];
      setPlan(s, 'rachoi-' + z, steps);
      break;
    }
    case 'tiet2':
      if(grpA){ setPlan(s, 'tiet2', [{r:'elec', p:SEAT_ELEC(i), task:'Học lắp mạch điện với cô Xuân', thought:'Hôm nay lắp quạt mini'}]); build(s, .035); }
      else { setPlan(s, 'tiet2', [{r:'hall', p:SEAT_HALL(i), task:'Học Rubik nâng cao ở Hội trường', thought:'Hôm nay học giải tầng 2'}]); practice(s, .05); }
      maybeWander(s);
      break;
    case 'trua': {
      const an = clock < 705;
      setPlan(s, 'trua-' + an, [{r:'hall', p:SEAT_HALL(i), task: an ? 'Ăn trưa ở Hội trường' : 'Ngủ trưa', thought: an ? 'Cơm hôm nay ngon quá' : 'Zzz...'}]);
      break;
    }
    case 'clb':
      if(storm){ hallSeat('Sinh hoạt câu lạc bộ trong Hội trường (tránh bão)'); break; }
      if(s.club === 'football'){ footballPlan(s, 'Câu lạc bộ bóng đá: đá bóng'); break; }
      setPlan(s, 'clb-' + s.club, [{r:s.club, p:clubSpot(s), task: s.club === 'music' ? MUSIC_TASK[s.musicRole] : CLUB_TASK[s.club], thought: s.club === 'chess' ? 'Mình sẽ nhập thành sớm' : s.club === 'music' ? 'Giữ đúng nhịp nhé' : 'Lần này phải dưới 40 giây'}]);
      if(s.club === 'rubikyard') practice(s, .08);
      if(s.club === 'music' && Math.random() < .03) say(s, pick(['♪ la la la','♪ đô rê mi','Nhịp này hay quá!']));
      maybeWander(s);
      break;
    case 'bien': {
      if(isWet()){ hallSeat(storm ? 'Trú bão trong Hội trường' : 'Trú mưa, xem phim ở Hội trường'); break; }
      let act = s.beachAct;
      if(act === 'sub' && (s.subDone || sub.doneToday && sub.state === 'dock')) act = 'castle';
      if((act === 'swim' || act === 'surf') && (pirate || weather === 'suongmu' || tsu)) act = 'castle';
      const bx = 220 + (i % 7)*160 + (i >= 7 ? 80 : 0);
      const steps = act === 'sub' ? [{r:'beach', p:[PIER_END[0] + (i%2 ? 10 : -10), PIER_END[1] - 4], task:'Chờ lên tàu ngầm của chú Hưng', thought:'Mặc áo phao vào trước đã', onArrive: a => { a.waitSub = true; }}]
        : act === 'swim' ? [{r:'beach', p:[bx, 908], task:'Tắm biển (có Nam trông)', thought:'Nước mát quá!'}]
        : act === 'surf' ? [{r:'beach', p:[bx, 975], wait:2, task:'Lướt sóng', loop:true, thought:'Bắt con sóng này!'}, {r:'beach', p:[bx + 70, 902], wait:1, task:'Lướt sóng', loop:true}]
        : act === 'castle' ? [{r:'beach', p:[bx, 832], task:'Xây lâu đài cát', thought:'Thêm một cái tháp nữa'}]
        : act === 'shell' ? [{r:'beach', p:[bx, 845], wait:6, task:'Nhặt vỏ sò', loop:true}, {r:'beach', p:[bx+90, 830], wait:6, task:'Nhặt vỏ sò', loop:true}]
        : [{r:'beach', p:[bx, 822], task:'Chạy đuổi bắt trên cát', loop:true}, {r:'beach', p:[bx+140, 850], task:'Chạy đuổi bắt trên cát', loop:true}];
      setPlan(s, 'bien-' + act, steps);
      break;
    }
    case 'sukien':
      setPlan(s, 'sukien-free', [{r:'hall', p:SEAT_HALL(i), task:'Sinh hoạt tự do ở Hội trường', thought:'Chờ lễ hội tiếp tục'}]);
      break;
    case 'diemdanhcuoi':
      setPlan(s, 'pad2', [{r:'attend', p:PAD(i), task:'Điểm danh cuối ngày', thought:'Sắp được về rồi'}]);
      break;
  }
}

function commonStaff(a){
  if(isQuake()){ setPlan(a, 'quake', [{r:'field', p:QUAKE(agents.indexOf(a)), task:'Sơ tán ra sân bóng, hướng dẫn học sinh', thought:'Giữ bình tĩnh, đếm đủ người', onArrive: x => { if(x.id === 'mic'){ const n = agents.filter(b => b.visible && regionAt(b.x,b.y) === 'field').length; log('mic', `Mic đếm ở điểm sơ tán (sân bóng): ${n} người đã tập trung.`, 'mic'); } }}]); return true; }
  if(concert){ concertBrain(a); return true; }
  if(festival && !isStorm()){ festivalBrain(a); return true; }
  return false;
}
function haBrain(a, p){
  if(commonStaff(a)) return;
  const tips = ['Ghép chữ thập trắng trước nhé!','Nhớ công thức R U R\' U\'','Nhìn trước hai bước rồi hãy xoay','Giữ mặt vàng ở trên','Xoay chậm mà chắc'];
  switch(p){
    case 'dem': case 'nghi': case 'cnbong': case 'cnrung': goGate(a); break;
    case 'den': case 'diemdanh': setPlan(a,'greet',[{r:'yard',p:[220,350],task:'Đón học sinh trước lớp Rubik',say:'Chào các em!'}]); break;
    case 'chaoco': setPlan(a,'chaoco',[{r:'yard',p:[760,446],task:'Dự lễ chào cờ'}]); break;
    case 'tiet1': setPlan(a,'tiet1',[{r:'rubik',p:[220,112],wait:8,task:'Giảng bài trên bảng',say:()=>pick(tips),loop:true},
      ...[0,1,2,3,4,5].map(i=>({r:'rubik',p:[SEAT_RUBIK(i)[0]+22,SEAT_RUBIK(i)[1]-4],wait:3,task:'Chỉ bài từng em',say:()=>pick(tips),loop:true}))]); break;
    case 'rachoi': setPlan(a,'break',[{r:'office',p:[600,560],task:'Nghỉ giải lao ở văn phòng'}]); break;
    case 'tiet2': setPlan(a,'tiet2',[{r:'hall',p:[1375,150],wait:10,task:'Dạy Rubik nâng cao trên sân khấu',say:()=>pick(tips),loop:true},{r:'hall',p:[1300,250],wait:4,task:'Đi xuống kiểm tra học sinh',loop:true},{r:'hall',p:[1460,250],wait:4,task:'Đi xuống kiểm tra học sinh',loop:true}]); break;
    case 'trua': setPlan(a,'trua'+(clock<705),[{r:'hall',p:[1480,604],task: clock<705 ? 'Ăn trưa cùng học sinh' : 'Trông học sinh ngủ trưa'}]); break;
    case 'clb': setPlan(a,'clb'+isStorm(),isStorm()?[{r:'hall',p:[1480,604],task:'Trông học sinh trú bão'}]:[{r:'rubikyard',p:[220,520],wait:6,task:'Bấm giờ thi Rubik',loop:true},{r:'chess',p:[565,175],wait:5,task:'Ghé xem các em chơi cờ',loop:true},{r:'music',p:[930,150],wait:5,task:'Ghé phòng nhạc',loop:true}]); break;
    case 'bien': setPlan(a,'bien'+isWet(),[isWet()?{r:'hall',p:[1480,604],task:'Trông học sinh trong Hội trường'}:{r:'beach',p:[600,822],task:'Trông học sinh chơi ở biển'}]); break;
    case 'sukien': setPlan(a,'sk',[{r:'office',p:[600,560],task:'Chuẩn bị đồ cho lễ hội'}]); break;
    case 'diemdanhcuoi': setPlan(a,'dd2',[{r:'attend',p:[1100,626],task:'Dặn dò cuối ngày'}]); break;
    case 've': setPlan(a,'ve',[{r:'yard',p:[1540,700],task:'Tiễn học sinh ra cổng sau',say:'Đạp xe cẩn thận nhé!'}]); break;
  }
}
function xuanBrain(a, p){
  if(commonStaff(a)) return;
  const tips = ['Kiểm tra cực âm cực dương nhé','Tắt nguồn trước khi nối dây','Đèn LED chân dài là cực dương','Dây đỏ là dương, dây đen là âm'];
  switch(p){
    case 'dem': case 'nghi': case 'cnbong': case 'cnrung': goGate(a); break;
    case 'den': case 'diemdanh': setPlan(a,'greet',[{r:'road',p:[1850,350],task:'Đón học sinh trước lớp lắp ráp điện',say:'Chào các em!'}]); break;
    case 'chaoco': setPlan(a,'chaoco',[{r:'yard',p:[800,448],task:'Dự lễ chào cờ'}]); break;
    case 'tiet1': case 'tiet2': setPlan(a,'teach-'+p,[{r:'elec',p:[1850,104],wait:8,task:'Giảng bài lắp mạch điện',say:()=>pick(tips),loop:true},
      ...[0,1,2,3,4,5,6].map(j=>({r:'elec',p:[SEAT_ELEC(j)[0]+24,SEAT_ELEC(j)[1]-6],wait:2,task:'Kiểm tra mạch của từng em',say:()=>pick(tips),loop:true}))]); break;
    case 'rachoi': setPlan(a,'break',[{r:'office',p:[630,540],task:'Nghỉ giải lao ở văn phòng'}]); break;
    case 'trua': setPlan(a,'trua',[{r:'hall',p:[1520,604],task:'Ăn trưa, nghỉ trưa'}]); break;
    case 'clb': setPlan(a,'clb'+isStorm(),[isStorm()?{r:'hall',p:[1520,604],task:'Trông học sinh trú bão'}:{r:'elec',p:[1850,150],task:'Mở phòng lắp ráp cho các em tự làm'}]); break;
    case 'bien': setPlan(a,'bien'+isWet(),[isWet()?{r:'hall',p:[1520,604],task:'Trông học sinh trong Hội trường'}:{r:'beach',p:[1060,822],task:'Trông học sinh chơi ở biển'}]); break;
    case 'sukien': setPlan(a,'sk',[{r:'elec',p:[1850,150],task:'Lắp đèn trang trí cho lễ hội'}]); break;
    case 'diemdanhcuoi': setPlan(a,'dd2',[{r:'attend',p:[1080,626],task:'Dặn dò cuối ngày'}]); break;
    case 've': setPlan(a,'ve',[{r:'road',p:[1660,708],task:'Hướng dẫn các bạn qua đường',say:'Đi sát lề phải nhé!'}]); break;
  }
}
function namBrain(a, p){
  if(a.fetch.length && !concert && !festival){
    const s = a.fetch[0];
    if(!s.visible || !s.wander){ a.fetch.shift(); a.planKey = null; return; }
    const rid = regionAt(s.x, s.y);
    let pt = [s.x + 16, s.y]; if(regionAt(pt[0],pt[1]) !== rid) pt = [s.x, s.y + 6];
    setPlan(a, 'fetch-' + s.id, [{r:rid, p:pt, task:`Đi tìm ${s.name} đưa về lớp`, thought:`Có báo ${s.name} không có trong lớp`, say:`${s.name} ơi, về lớp nào!`, onArrive: () => {
      s.wander = false; s.planKey = null; a.fetch.shift(); a.planKey = null;
      log('nam', `Nam tìm thấy ${s.name} ở ${R[rid].name} và đưa em về lớp.`, 'nam');
    }}]);
    return;
  }
  if(fight && fight.reported && (!A.ngoc.visible || down(A.ngoc) || A.ngoc.inSub)){ setPlan(a, 'resolve', [{r:'yard', p:[fight.x, fight.y - 22], task:'Can ngăn học sinh đánh lộn', onArrive: () => resolveFight(a)}]); return; }
  if(p === 'dem' || p === 'nghi'){ setPlan(a, 'night', [{r:'yard', p:BOOTH, task: p === 'nghi' ? 'Trực trường ngày Chủ nhật' : 'Trực đêm ở chốt bảo vệ', thought:'Khóa cổng, đi một vòng rồi trực'}]); return; }
  if(p === 'cnbong'){ setPlan(a, 'cn', [{r:'road', p:[1660,660], task:'Trông các bạn đá bóng Chủ nhật'}]); return; }
  if(isQuake()){ commonStaff(a); return; }
  if(isStorm()){ setPlan(a, 'storm-' + weather, [{r:'yard', p:[1150,428], task:'Hướng dẫn mọi người vào Hội trường', say: weather === 'sieubao' ? 'Siêu bão! Vào trong ngay!' : 'Vào Hội trường trú bão!', thought:'An toàn là trên hết'}]); return; }
  if(commonStaff(a)) return;
  if(p === 'chaoco'){ setPlan(a, 'chaoco', [{r:'yard', p:[676,444], task:'Kéo cờ Tổ quốc', say:'Nghiêm!', thought:'Kéo cờ lên đều tay'}]); return; }
  if(p === 'bien' && !isWet()){ setPlan(a, 'guard', [{r:'beach', p:[786,848], wait:10, task:'Ngồi ghế cứu hộ, canh học sinh tắm biển', loop:true, say:'Không bơi ra xa nhé!'}, {r:'beach', p:[1100,868], wait:6, task:'Đi dọc bờ biển canh chừng', loop:true}]); return; }
  const stops = [['rubik','Lớp Rubik'],['chess','Khu cờ vua'],['music','Khu âm nhạc'],['hall','Hội trường lớn'],['attend','Khu điểm danh'],['office','Văn phòng'],['rubikyard','Khu chơi Rubik']];
  const steps = stops.map(([id, nm]) => ({r:'yard', p:[R[id].dout[0] + 14, R[id].dout[1] + (id==='hall'?24:0)], wait:3, loop:true, task:`Tuần tra: canh ${nm}`, thought:`Kiểm tra ${nm} có an toàn không`, say:`${nm}: ổn`}));
  steps.push({r:'road', p:[1880,340], wait:3, loop:true, task:'Tuần tra: canh lớp lắp ráp điện', say:'Lớp điện: ổn'});
  steps.push({r:'road', p:[1660,700], wait:3, loop:true, task:'Tuần tra: kiểm tra cổng sau và sân bóng'});
  steps.push({r:'yard', p:[60,430], wait:3, loop:true, task:'Tuần tra: kiểm tra cổng trường', onArrive: () => { dayStats.patrols++; if(dayStats.patrols % 2 === 1) log('nam', `Nam đi xong vòng tuần tra thứ ${dayStats.patrols}, các lớp đều an toàn.`, 'nam'); }});
  setPlan(a, 'patrol', steps);
}
function micBrain(a, p){
  const waiting = students.filter(s => s.visible && !s.checked && s.atPad && (s.rollDone || clock >= 437));
  if(waiting.length && !['dem','nghi','cnbong','cnrung'].includes(p) && !concert && !isQuake()){
    const s = waiting[0];
    if(s.rollDone || (a.planKey && !a.planKey.startsWith('roll-am'))){
      setPlan(a, 'late-' + s.id, [{r:'attend', p:PAD_FRONT(s.idx), wait:1, task:`Ghi nhận ${s.name} đến muộn`, thought:`${s.name} vừa tới, phải ghi vào sổ`, onArrive: () => {
        s.mark.sang = 'muon'; s.checked = true; s.planKey = null; a.planKey = null;
        dayStats.late.push(s.name); attDirty = true;
        log('mic', `Mic ghi: ${s.name} đi muộn, đến lúc ${fmt(clock)}.`, 'mic'); say(a, `${s.name}: đi muộn`);
      }}]);
      return;
    }
  }
  if(p === 'dem' || p === 'nghi' || p === 'cnbong' || p === 'cnrung'){ goGate(a); return; }
  if(p === 'den' || (p === 'diemdanh' && clock < 437)){ setPlan(a, 'wait-am', [{r:'attend', p:MIC_SPOT, task:'Chờ học sinh vào ô điểm danh', thought:'7:17 bắt đầu điểm danh'}]); return; }
  if((p === 'diemdanh' || p === 'chaoco' || p === 'tiet1' || p === 'sukien') && students.some(s => !s.rollDone)){
    if(a.planKey === 'roll-am') return;
    setPlan(a, 'roll-am', [...students.map(s => ({r:'attend', p:PAD_FRONT(s.idx), wait:.3, task:'Điểm danh buổi sáng', thought:`Kiểm tra ô của ${s.name}`, onArrive: () => markMorning(s)})), {r:'attend', p:MIC_SPOT, task:'Tổng hợp sổ điểm danh', onArrive: () => {
      const co = students.filter(s => s.mark.sang === 'co').length;
      log('mic', `Mic tổng hợp sáng: ${co}/${students.length} có mặt đúng giờ.`, 'mic');
    }}]);
    return;
  }
  if(commonStaff(a)) return;
  if(p === 'chaoco'){ setPlan(a, 'chaoco', [{r:'yard', p:[1030,440], task:'Đứng cuối hàng chào cờ'}]); return; }
  if(p === 'diemdanhcuoi'){
    if(clock < ps('diemdanhcuoi') + 15){ setPlan(a, 'wait-pm', [{r:'attend', p:MIC_SPOT, task:'Chờ điểm danh cuối ngày'}]); return; }
    setPlan(a, 'roll-pm', [...students.map(s => ({r:'attend', p:PAD_FRONT(s.idx), wait:.3, task:'Điểm danh cuối ngày', onArrive: () => markEvening(s)})), {r:'attend', p:MIC_SPOT, task:'Nộp sổ cho cô Lai'}]);
    return;
  }
  if(p === 've'){ setPlan(a, 've', [{r:'attend', p:MIC_SPOT, task:'Cất sổ điểm danh'}]); return; }
  if(p === 'rachoi' || p === 'sukien'){ setPlan(a, 'desk', [{r:'attend', p:MIC_SPOT, task:'Ghi chép sổ điểm danh'}]); return; }
  const slot = Math.floor(clock / 25);
  const regions = [...new Set(students.map(s => expectedRegion(s, p)).filter(Boolean))];
  const steps = regions.map(rid => ({r:rid, p: R[rid].look ? R[rid].look : [R[rid].din[0] + (rid==='hall'?20:0), R[rid].din[1] + (rid==='beach'?10:(R[rid].side==='b'?-10:0))], wait:2, task:`Đếm sĩ số ${R[rid].name}`, thought:`Xem ${R[rid].name} có thiếu ai không`, onArrive: () => checkRegion(rid, p)}));
  steps.push({r:'attend', p:MIC_SPOT, task:'Về bàn điểm danh', thought:'Chờ lượt kiểm tra tiếp theo'});
  setPlan(a, `check-${p}-${slot}-${regions.join(',')}`, steps);
}
function markMorning(s){
  s.rollDone = true;
  const near = s.visible && dist(s.x, s.y, PAD(s.idx)[0], PAD(s.idx)[1]) < 30;
  if(near){ s.mark.sang = 'co'; s.checked = true; s.planKey = null; log('mic', `Mic điểm danh: ${s.name} có mặt.`, 'mic'); say(A.mic, `${s.name}: có`); }
  else if(s.att === 'phep'){ s.mark.sang = 'phep'; dayStats.absent.push(s.name + ' (có phép)'); log('mic', `Mic ghi: ${s.name} nghỉ học có phép.`, 'mic'); say(A.mic, `${s.name}: nghỉ phép`); }
  else if(s.att === 'vang'){ s.mark.sang = 'vang'; dayStats.absent.push(s.name + ' (không phép)'); log('mic', `Mic ghi: ${s.name} nghỉ học không phép, cần báo phụ huynh.`, 'mic'); say(A.mic, `${s.name}: vắng`); }
  else { log('mic', `Mic: ${s.name} chưa đến, chờ ghi đi muộn.`, 'mic'); say(A.mic, `${s.name}: chưa đến`); }
  attDirty = true;
}
function markEvening(s){
  if(s.mark.sang === 'phep' || s.mark.sang === 'vang'){ s.mark.cuoi = s.mark.sang; return; }
  const near = s.visible && dist(s.x, s.y, PAD(s.idx)[0], PAD(s.idx)[1]) < 34;
  if(near){ s.mark.cuoi = 'co'; log('mic', `Mic điểm danh cuối ngày: ${s.name} có mặt.`, 'mic'); }
  else { s.mark.cuoi = 'thieu'; log('mic', `Mic: ${s.name} không có ở ô điểm danh cuối ngày.`, 'mic'); }
  attDirty = true;
}
function checkRegion(rid, p){
  const exp = students.filter(s => expectedRegion(s, p) === rid);
  const here = exp.filter(s => regionAt(s.x, s.y) === rid && !s.wander);
  const gone = exp.filter(s => s.wander);
  log('mic', `Mic đếm ${R[rid].name}: ${here.length}/${exp.length} em${here.length === exp.length ? ', đủ.' : gone.length ? '.' : ' (các em còn lại đang di chuyển tới).'}`, 'mic');
  gone.forEach(s => {
    if(s.caught) return;
    s.caught = true; s.missing++; dayStats.catches.push(`${s.name} (${fmt(clock)})`); attDirty = true;
    log('mic', `Mic phát hiện ${s.name} đi thiếu khỏi ${R[rid].name}! Báo Nam đi tìm.`, 'mic');
    say(A.mic, `Thiếu ${s.name}!`);
    A.nam.fetch.push(s); A.nam.planKey = null;
  });
}
function ngocBrain(a, p){
  if(fight && fight.reported){ setPlan(a, 'resolve', [{r:'yard', p:[fight.x, fight.y - 22], task:'Xử lý vụ đánh lộn', thought:'Phải tìm hiểu nguyên nhân rồi hòa giải', onArrive: () => resolveFight(a)}]); return; }
  if(p === 'dem' || p === 've' || p === 'nghi' || p === 'cnbong' || p === 'cnrung'){ goGate(a); return; }
  if(commonStaff(a)) return;
  if(p === 'chaoco'){
    setPlan(a, 'chaoco', [{r:'yard', p:[712,452], task:'Phát biểu chào cờ đầu tuần', thought:'Nhận xét tuần qua, dặn dò tuần mới', say:'Chúc các em một tuần học tốt!', onArrive: () => {
      if(dayStats.chaocoDone) return; dayStats.chaocoDone = true;
      const uy = A.uyen.visible ? A.uyen : SAO.find(x => x.visible);
      log('ngoc', `Chào cờ đầu tuần: Cô Ngọc nhận xét tuần qua và dặn các em giữ trật tự, an toàn khi đạp xe.${uy ? ` Sao đỏ ${uy.name} báo cáo: tuần trước có ${weekViol} vụ vi phạm.` : ''}`, 'ngoc');
      weekViol = 0;
    }}]);
    return;
  }
  if(p === 'den' || p === 'diemdanh' || p === 'diemdanhcuoi'){ setPlan(a, 'attend', [{r:'attend', p:[1100,506], task:'Theo dõi điểm danh', thought:'Xem Mic điểm danh có đúng quy trình không'}]); return; }
  if(isStorm()){ setPlan(a, 'storm', [{r:'hall', p:[1520,604], task:'Kiểm tra an toàn trong Hội trường', thought:'Đếm lại đủ người chưa'}]); return; }
  const list = [['rubik',[320,250]],['elec',[1990,250]],['chess',[670,250]],['music',[1080,250]],['hall',[1520,604]],['rubikyard',[345,520]],['field',[1700,640]]];
  if(p === 'bien' && !isWet()) list.push(['beach',[960,826]]);
  const steps = list.map(([rid, pt]) => ({r:rid, p:pt, wait:10, loop:true, task:`Dự giờ ${R[rid].name}`, thought:`Xem ${R[rid].name} học thế nào`, onArrive: () => remark(rid)}));
  steps.push({r:'office', p:[490,630], wait:8, loop:true, task:'Ghi sổ dự giờ ở văn phòng'});
  setPlan(a, 'inspect-' + (p==='bien' && !isWet()), steps);
}
function remark(rid){
  const n = students.filter(s => s.visible && regionAt(s.x, s.y) === rid).length;
  const note = n === 0 ? 'lớp đang trống.' : pick(['học sinh tập trung, trật tự tốt.','không khí vui, các em hăng hái.','cần nhắc các em giữ trật tự hơn.','các em tiến bộ rõ.']);
  const text = `${R[rid].name}: ${n} em, ${note}`;
  dayStats.remarks.push(fmt(clock) + ' ' + text);
  log('ngoc', 'Cô Ngọc dự giờ ' + text, 'ngoc');
  if(n) say(A.ngoc, pick(['Tốt lắm các em','Cô ghi nhận nhé','Cố lên nào']));
}
function laiBrain(a, p){
  const DESK = [640,630];
  if(p === 'nghi' || p === 'cnbong' || p === 'cnrung'){ goGate(a); return; }
  const am = ps('diemdanh') + 98, pm = ps('diemdanhcuoi') + 50;
  if(clock >= am && clock < am + 27 && !dayStats.amReport){
    setPlan(a, 'collect-am', [{r:'attend', p:LAI_PICK, wait:3, task:'Lấy sổ điểm danh buổi sáng', say:'Cô lấy sổ điểm danh nhé', thought:'Cần số liệu điểm danh để làm báo cáo'},
      {r:'office', p:DESK, wait:4, task:'Viết báo cáo điểm danh buổi sáng', onArrive: () => { if(!dayStats.amReport){ dayStats.amReport = true; writeReport('am'); } }}]);
    return;
  }
  if(clock >= pm && !dayStats.pmReport){
    setPlan(a, 'collect-pm', [{r:'attend', p:LAI_PICK, wait:3, task:'Nhận sổ điểm danh cuối ngày', say:'Cảm ơn Mic', thought:'Tổng hợp cả ngày'},
      {r:'office', p:DESK, wait:6, task:'Viết báo cáo cuối ngày', onArrive: () => { if(!dayStats.pmReport){ dayStats.pmReport = true; writeReport('pm'); } }}]);
    return;
  }
  if((a.planKey === 'collect-am' || a.planKey === 'collect-pm') && (a.queue.length || (a.cur && !a.cur.done) || a.path.length)) return;
  if(p === 'dem'){ goGate(a); return; }
  if(commonStaff(a)) return;
  if(isStorm() && regionAt(a.x,a.y) !== 'office'){ setPlan(a, 'storm', [{r:'hall', p:[1500,604], task:'Trú bão, ghi biên bản thời tiết'}]); return; }
  setPlan(a, 'desk' + isStorm(), [{r:'office', p:DESK, task: pick(['Soạn giấy tờ','Sắp xếp hồ sơ học sinh','Ghi biên bản họp']), thought:'Giấy tờ phải rõ ràng, đúng ngày giờ'}]);
}
function haquanBrain(a, p){
  if(p === 'dem' || p === 'nghi'){ goGate(a); return; }
  const film = (key, pt, rid, task) => setPlan(a, key, [{r:rid, p:pt, task, thought:'Giữ máy quay thật chắc tay'}]);
  if(isQuake()){ film('quake', [1700,450], 'field', 'Quay cảnh sơ tán động đất'); return; }
  if(isStorm()){ film('storm', [1530,420], 'hall', 'Quay bão qua cửa sổ Hội trường'); return; }
  if(fight){ film('fight-' + fight.start, [fight.x + 46, fight.y + 12], 'yard', 'Quay lại sự cố để báo cáo cô Ngọc'); return; }
  if(concert){ film('concert', [1530,560], 'hall', 'Quay buổi biểu diễn'); return; }
  if(festival){
    const f = festival.kind;
    if(f === 'picnic'){ film('fest-picnic', [3700,540], 'lake', 'Quay buổi dã ngoại trong rừng'); return; }
    if(f === 'thamlop'){ const n = A.ngoc; setPlan(a, 'tl-' + Math.floor(clock/6), [{r:regionAt(n.x+30, n.y), p:[n.x + 30, n.y], task:'Quay các bạn đi thăm lớp'}]); return; }
    film('fest-' + f, f === 'lan' ? [660,452] : f === 'noel' ? [1060,452] : [1920,660], f === 'bongda' ? 'road' : 'yard', `Quay ${FEST_NAME[f].toLowerCase()}`);
    return;
  }
  if(p === 'chaoco'){ film('chaoco', [880,452], 'yard', 'Quay lễ chào cờ'); return; }
  if(p === 'den'){ film('den', [1980,700], 'road', 'Quay các bạn đạp xe đến trường'); return; }
  if(p === 've'){ film('ve', [2150,700], 'road', 'Quay các bạn trên đường về nhà'); return; }
  if(p === 'cnrung'){ film('cnr', [3700,540], 'lake', 'Quay các bạn dã ngoại trong rừng'); return; }
  if(p === 'cnbong'){ film('cn', [1920,660], 'road', 'Quay trận bóng Chủ nhật'); return; }
  let n = 0;
  const stop = (rid, pt, task) => ({r:rid, p:pt, wait:4, loop:true, task, onArrive: () => { n++; if(n % 4 === 0){ const c = agents.filter(b => b.visible && dist(b.x,b.y,pt[0],pt[1]) < 200).length; log('cam', `Hà Quân quay được cảnh ${task.replace('Quay ','')}, ${c} người trong khung hình.`, 'haquan'); } }});
  setPlan(a, 'patrol', [
    stop('yard', [380,340], 'Quay Lớp Rubik và khu cờ vua'), stop('yard', [930,350], 'Quay khu âm nhạc'), stop('attend', [1100,600], 'Quay khu điểm danh'),
    stop('yard', [1160,430], 'Quay Hội trường lớn'), stop('road', [1880,345], 'Quay lớp lắp ráp điện'), stop('road', [1700,660], 'Quay sân bóng đá'),
    stop('road', [2150,700], 'Quay đường về nhà'), stop('road', [2220,320], 'Quay khu nhà các bạn'), stop('beach', [2360,840], 'Quay ngọn hải đăng'),
    stop('garden', [2760,340], 'Quay vườn hoa Đà Lạt'), stop('lake', [3700,540], 'Quay hồ cá Koi và khu cắm trại'), stop('lotus', [4540,445], 'Quay đầm sen'), stop('road', [4200,700], 'Quay siêu xe trên đường'),
    stop('beach', [1340,850], 'Quay bến tàu ngầm của chú Hưng'), stop('yard', [560,450], 'Quay văn phòng và khu chơi Rubik')
  ]);
}
function hungBrain(a, p){
  if(p === 'dem' || p === 'nghi'){ goGate(a); return; }
  if(isQuake()){ commonStaff(a); return; }
  if(isStorm()){ setPlan(a, 'storm', [{r:'hall', p:[1540,604], task:'Trú bão trong Hội trường', thought:'Tàu ngầm đã neo chắc ở bến'}]); return; }
  if(p === 'bien' && !isWet()){ setPlan(a, 'guide', [{r:'beach', p:[PIER_END[0] + 14, PIER_END[1] - 10], wait:6, loop:true, task:'Hướng dẫn an toàn: mặc áo phao, nghe hiệu lệnh', say:'Ai đi tàu ngầm thì mặc áo phao!'}, {r:'beach', p:[1330,860], wait:4, loop:true, task:'Kiểm tra dây neo tàu ngầm'}]); return; }
  setPlan(a, 'maint', [{r:'beach', p:[PIER_END[0] + 14, PIER_END[1] - 10], wait:12, loop:true, task:'Bảo dưỡng tàu ngầm', thought:'Kiểm tra động cơ và bình dưỡng khí'}, {r:'beach', p:[1380,840], wait:8, loop:true, task:'Kiểm tra bến tàu'}]);
}
const STAFF_BRAIN = {ha:haBrain, xuan:xuanBrain, nam:namBrain, mic:micBrain, ngoc:ngocBrain, lai:laiBrain, haquan:haquanBrain, hung:hungBrain};
function staffAllowed(a, p){
  if(p === 'dem' || p === 'nghi') return false;
  if(p === 'cnbong' || p === 'cnrung') return a.id === 'haquan' || a.id === 'hung';
  return true;
}

function runBrains(){
  const p = period(clock), m = Math.floor(clock), d = dow();
  if(concert && (clock >= concert.until || p === 'dem' || p === 'nghi')) endConcert();
  if(festival && (clock >= festival.until || p === 'dem' || p === 'nghi')) endFestival();
  if(m === 400 && d < 5) sendTruck(pick(DAILY_CARGO));
  if(m === 400 && d === 5) sendTruck(FEST_CARGO[FEST_KIND[season]]);
  if(p === 'sukien' && !festival && !dayStats.festDone && !isStorm() && !isQuake()) startFestival(FEST_KIND[season], ps('diemdanhcuoi'));
  flagRaise = p === 'chaoco' ? clamp((clock - ps('chaoco')) / 5, 0, 1) : 1;
  if(m === ps('tiet1') + 8){ startQuiz(A.ha, 'rubik', [180,120]); startQuiz(A.xuan, 'elec', [1800,112]); }
  if(m === ps('tiet2') + 8){ startQuiz(A.ha, 'hall', [1330,160]); startQuiz(A.xuan, 'elec', [1800,112]); }
  if(d === 3 && m === ps('tiet2') + 40) test15();
  if(p === 'rachoi' && m === ps('rachoi') + 6 && !fight && Math.random() < .45) startFight();
  if(fight && !fight.sao && !fight.reported && clock >= fight.start + 1){
    const free = SAO.filter(s => s.visible && !s.inSub && !down(s) && !s.fight && !s.controlled);
    if(free.length){ free.sort((x,y) => dist(x.x,x.y,fight.x,fight.y) - dist(y.x,y.y,fight.x,fight.y)); fight.sao = free[0]; free[0].planKey = null; }
    else if(clock >= fight.start + 3){ fight.reported = true; }
  }
  if(!pirate && p !== 'dem' && p !== 'nghi' && Math.random() < .0012) spawnPirate();
  if(p === 'bien' && !sub.doneToday && sub.state === 'dock' && clock >= ps('bien') + 8 && !isWet()){
    const waiting = students.filter(s => s.waitSub && s.visible && dist(s.x,s.y,PIER_END[0],PIER_END[1]) < 40);
    if(waiting.length >= 2 || clock >= ps('bien') + 20){ sub.doneToday = true; startSubTour(waiting); }
  }
  agents.forEach(a => {
    if(a.controlled || a.isPlayer || a.inSub || a.flying || down(a)) return;
    if(a.student){ studentBrain(a, p); return; }
    if(!a.visible){
      if(staffAllowed(a, p) && clock >= (a.arriveAt || 0)){ spawn(a); log(a.log, `${a.name} đến ${a.id === 'hung' ? 'bến tàu' : 'trường'}.`, a.id); }
      else return;
    }
    STAFF_BRAIN[a.id](a, p);
  });
  if(p === 'clb' && !isStorm() && m % 30 === 0){
    const players = students.filter(s => s.club === 'chess' && s.visible && regionAt(s.x,s.y) === 'chess');
    if(players.length >= 2){
      const [x, y] = shuffle(players.slice()).slice(0,2);
      const res = Math.random() < .2 ? `${x.name} và ${y.name} hòa cờ` : `${x.name} thắng ${y.name} ván cờ vua`;
      dayStats.chess.push(res); log('event', res + '.', x.id);
    }
  }
  if(concert && Math.random() < .3){ const b = pick(agents.filter(x => x.visible && x !== concert.singer && regionAt(x.x,x.y) === 'hall')); if(b) say(b, pick(['Hay quá!','Vỗ tay nào!','Hát tiếp đi!','Tuyệt vời!'])); }
  if(Math.random() < .25){
    const s = pick(students.filter(s => s.visible && !s.moving && !s.inSub));
    if(s && Math.random() < .25) say(s, pick(['Hay quá!','Cô ơi em làm được rồi!','Chơi tiếp đi','Nhìn kìa!','Hihi']));
  }
  // cameras spot students who left class
  FEEDS.forEach(f => {
    if(f.dynamic) return;
    students.forEach(s => {
      if(!s.wander || s.caught || !s.visible || regionAt(s.x, s.y) !== f.rid || s.moving) return;
      s.caught = true; s.missing++; dayStats.catches.push(`${s.name} (${fmt(clock)}, camera ${f.n})`); attDirty = true;
      log('mic', `Camera ${f.n} quay được ${s.name} ở ${f.name} trong giờ học. Mic báo Nam đi đưa em về.`, 'mic');
      say(A.mic, `Camera ${f.n}: thấy ${s.name}!`);
      A.nam.fetch.push(s); A.nam.planKey = null;
      f.alertUntil = realT + 8;
    });
  });
}

function writeReport(kind){
  const by = k => students.filter(s => s.mark.sang === k).map(s => s.name);
  const co = by('co'), muon = by('muon'), phep = by('phep'), vang = by('vang'), chua = by('chua');
  let lines;
  if(kind === 'am'){
    lines = [
      `${DOWN[dow()]}, ngày ${day}. Sĩ số: ${students.length} học sinh. Có mặt đúng giờ: ${co.length}.`,
      `Đi muộn: ${muon.length ? muon.join(', ') : 'không có'}.`,
      `Nghỉ có phép: ${phep.length ? phep.join(', ') : 'không có'}. Nghỉ không phép: ${vang.length ? vang.join(', ') : 'không có'}.`,
      chua.length ? `Chưa đến lúc lập báo cáo: ${chua.join(', ')}.` : 'Tất cả học sinh đã được điểm danh.',
      `Thời tiết: ${WEATHERS[weather].name}, mùa ${SEASONS[season].name}.`,
      'Người điểm danh: Mic. Người lập: Cô Lai.'
    ];
  } else {
    const ev = students.map(s => `${s.name}: sáng ${STATUS[s.mark.sang]}, cuối ngày ${STATUS[s.mark.cuoi]}${s.missing ? `, đi thiếu ${s.missing} lần` : ''}`);
    const list = (arr, none) => arr.length ? arr.join('; ') : none;
    lines = [
      `${DOWN[dow()]}, ngày ${day}.`, 'Điểm danh:', ...ev.map(x => '• ' + x),
      `Học sinh rời lớp bị phát hiện: ${list(dayStats.catches, 'không có')}.`,
      `Đánh lộn: ${list(dayStats.fights, 'không có')}.`,
      `Kiểm tra bài: ${list(dayStats.quizzes, 'không có')}.`,
      `Sự cố thời tiết: ${list(dayStats.hazards, 'không có')}.`,
      `Nam tuần tra ${dayStats.patrols} vòng. Cô Ngọc dự giờ ${dayStats.remarks.length} lượt.`,
      `Kỷ lục Rubik: ${list(dayStats.records, 'không có')}.`,
      `Sản phẩm lắp ráp điện: ${dayStats.builds.length} sản phẩm.`,
      `Cờ vua: ${list(dayStats.chess, 'chưa có ván nào kết thúc')}.`,
      `Bóng đá: ${list(dayStats.goals, 'không có bàn thắng')}.`,
      `Tàu ngầm: ${list(dayStats.subTrips, 'không có chuyến nào')}.`,
      `Xe chở hàng: ${list(dayStats.deliveries, 'không có')}.`,
      `Thời tiết trong ngày: ${[...new Set(dayStats.weather)].join(' → ')}.`,
      'Video: Hà Quân đã quay toàn trường và đường về nhà.',
      'Người lập: Cô Lai.'
    ];
  }
  reports.unshift({day, t:fmt(clock), title: kind === 'am' ? `Báo cáo điểm danh sáng · ${DOWN[dow()]} · ngày ${day}` : `Báo cáo cuối ngày · ${DOWN[dow()]} · ngày ${day}`, body: lines.join('\n')});
  repDirty = true;
  log('lai', `Cô Lai hoàn thành ${kind === 'am' ? 'báo cáo điểm danh buổi sáng' : 'báo cáo cuối ngày'} (xem tab Báo cáo).`, 'lai');
  say(A.lai, 'Báo cáo xong!');
}
const STATUS = {co:'có mặt', muon:'đi muộn', vang:'nghỉ không phép', phep:'nghỉ có phép', chua:'chưa điểm danh', thieu:'không có mặt', cn:'nghỉ Chủ nhật'};

