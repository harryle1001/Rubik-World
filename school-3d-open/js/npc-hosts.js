// ================= EXT41 (v36): a host NPC stands in front of every game place and invites you in; talking to them (E, the door
// button, or a tap) starts that game; every finished game now pays money =================
const V36 = {hosts:[], talkT:0};
// [x, y, host name, game name, invite line, open]
const V36_DEF = [
  [254, 340, 'Cô Lan', 'Lớp Rubik', 'Vào xoay Rubik với cô nào!', () => openLab('3')],
  [599, 340, 'Thầy Đức', 'Lớp cờ vua', 'Học một thế cờ hay nhé?', () => openChessSchool(0)],
  [964, 340, 'Chị Mai', 'Phòng nhạc', 'Thử đánh một bản piano không em?', () => openMusic('piano')],
  [1884, 342, 'Anh Khoa', 'Lắp ráp điện', 'Cùng lắp mạch điện nào!', () => openAcademy()],
  [340, -20, 'Ông Tư', 'Cờ vua', 'Làm một ván cờ với ông nhé?', () => openChess()],
  [820, -20, 'Bạn Minh', 'Rubik 3D', 'Thi giải Rubik 3D với mình không?', () => openRubik()],
  [1300, -150, 'Bác Ba', 'Câu cá hồ', 'Ngồi câu cá thư giãn đi cháu!', () => openFishing('pond')],
  [1336, 800, 'Chú Hải', 'Câu cá biển', 'Ra cầu tàu câu cá biển nào!', () => openFishing('sea')],
  [1920, 664, 'Anh Tùng', 'Bóng đá mini', 'Sút vài quả bóng không?', () => openArcade('football')],
  [3000, -374, 'Chị Hương', 'Khinh khí cầu', 'Bay khinh khí cầu ngắm cảnh nhé!', () => openArcade('balloon')],
  [2760, -52, 'Bạn Long', 'Trượt ván', 'Trượt ván cực ngầu nè!', () => openArcade('skate')],
  [2980, -52, 'Bạn Vy', 'Trượt patin', 'Patin cùng mình đi!', () => openArcade('patin')],
  [3200, -52, 'Anh Dũng', 'Bóng rổ', 'Ném rổ thử tài không?', () => openArcade('basket')],
  [3570, -32, 'Chị Tuyết', 'Trượt tuyết', 'Trượt tuyết vui lắm đó!', () => openArcade('ski')],
  [4145, -52, 'Họa sĩ Nam', 'Vẽ tranh', 'Vẽ một bức tranh cùng chú nhé?', () => openPaint()],
  [4735, -32, 'Bác Năm', 'Nông trại', 'Giúp bác trồng cây, chăm thú nào!', () => openFarm()],
  [4500, -32, 'Anh Phong', 'Đua thú', 'Cưỡi thú đua một vòng không?', () => openArcade('race')],
  [3355, 562, 'Chú Bình', 'Lửa trại BBQ', 'Nướng xiên que với chú đi!', () => openArcade('bbq')],
  [5844, 680, 'Cô Thư', 'Thư viện', 'Đọc sách nhận thưởng nhé em!', () => openLibrary('vn')],
  [6684, 680, 'Sư cô Tâm', 'Ngồi thiền', 'Ngồi thiền tĩnh tâm cùng cô nhé.', () => openZen()],
  [7430, 682, 'HLV Hùng', 'Thế vận hội', 'Thi đấu giành huy chương nào!', () => openOlympics()],
  [8810, 682, 'Anh Quân', 'Đấu online', 'Vào đấu trường online không?', () => openLobby()],
  [9720, 692, 'Anh Tốc', 'Rubik Kart', 'Đua Rubik Kart một vòng nhé!', () => lvlOK('kart', 'Rubik Kart') && openArcade('kart')],
  [5650, -18, 'Giáo sư Trí', 'Học viện trí tuệ', 'Thử thách trí tuệ cùng thầy nào!', () => openAcademy()],
  [6510, -18, 'Chị Ngọc', 'Trung tâm thương mại', 'Ghé mua sắm đồ mới đi em!', () => openMall()],
  [7370, -18, 'Bạn Huy', 'Game 2 người', 'Chơi game 2 người với mình nhé!', () => openHall2p()],
  [7150, -18, 'Bạn Nhi', 'Cờ caro', 'Đánh caro với mình không?', () => { const b = $('#xCaro'); if(b) b.click(); }],
  [7590, -18, 'Ông Sáu', 'Cờ vây', 'Một ván cờ vây nhé cháu?', () => { const b = $('#xGo'); if(b) b.click(); }],
];
const V36_SHIRTS = ['#e53935', '#8e24aa', '#3949ab', '#00897b', '#f4511e', '#6d4c41', '#c2185b', '#43a047', '#fb8c00', '#1e88e5'];
function v36Make(){
  V36.hosts = V36_DEF.map(([x, y, name, game, line, open], i) => {
    const base = STAFF_DEF[i % STAFF_DEF.length], h = mkAgent(Object.assign({}, base, {id:'host' + i, name, role:'Người mời chơi'}), i + 3, false);
    return Object.assign(h, {x, y, task:'', shirt:V36_SHIRTS[i % V36_SHIRTS.length], game, line, open, host:true, path:[], queue:[]});
  });
}
function v36Near(h, r){ const P = PLAYER; return P && P.visible && Math.abs(P.x - h.x) < r && Math.abs(P.y - h.y) < r && Math.hypot(P.x - h.x, P.y - h.y) < r; }
function v36Sprites(sp){
  for(const h of V36.hosts){ if(!inVB(h.x, h.y)) continue;
    sp.push({y:h.y, f:() => {
      const P = PLAYER; if(P && P.visible) h.dir = P.x < h.x ? -1 : 1;
      drawPerson(h);
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const near = v36Near(h, 150), bob = Math.sin(realT*3 + h.idx)*2;
      if(!near){ ctx.font = 'bold 18px VT323, monospace'; ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#0a0f22'; ctx.lineWidth = 3; ctx.strokeText('!', h.x, h.y - 58 + bob); ctx.fillText('!', h.x, h.y - 58 + bob); }
      else {
        ctx.font = '14px VT323, monospace'; const t1 = `${h.name} · ${h.game}`, w1 = ctx.measureText(t1).width + 10;
        ctx.fillStyle = 'rgba(120,40,10,.9)'; ctx.fillRect(h.x - w1/2, h.y - 58, w1, 15); ctx.fillStyle = '#fff'; ctx.fillText(t1, h.x, h.y - 50);
        if(v36Near(h, 95)){ const t2 = h.line + ' 💰', w2 = Math.min(240, ctx.measureText(t2).width + 14), by = h.y - 78 + bob;
          ctx.fillStyle = '#fff'; ctx.fillRect(h.x - w2/2, by - 9, w2, 18); ctx.beginPath(); ctx.moveTo(h.x - 4, by + 9); ctx.lineTo(h.x + 4, by + 9); ctx.lineTo(h.x, by + 14); ctx.fill();
          ctx.strokeStyle = '#0f1530'; ctx.lineWidth = 1.5; ctx.strokeRect(h.x - w2/2, by - 9, w2, 18); ctx.fillStyle = '#0f1530'; ctx.fillText(t2, h.x, by, w2 - 8); }
      }
      ctx.restore();
    }});
  }
}
function v36Doors(d){ for(const h of V36.hosts) d.push({x:h.x, y:h.y + 6, n:`Nói chuyện với ${h.name} · ${h.game}`, f:() => v36Talk(h), host:h}); }
function v36Talk(h){
  if(performance.now() - V36.talkT < 900) return; V36.talkT = performance.now();
  try { blipSfx(1200); } catch(e){} keys.up = keys.down = keys.left = keys.right = false;
  toast(`${h.name}: ${h.line} Chơi xong sẽ có tiền thưởng!`);
  setTimeout(() => { try { h.open(); } catch(e){ console.warn('v36 open', e); } }, 650);
}
function v36Init(){
  v36Make();
  // every finished game pays: a game result with EXP but no money now also gives coins
  const base = reward; reward = function(exp, money, why, quiet){ if(why && !quiet && !money && exp > 0) money = Math.max(5, Math.round(exp/4)); return base(exp, money, why, quiet); };
}
