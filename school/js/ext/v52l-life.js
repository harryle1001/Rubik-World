// ================= v52 · CUỘC SỐNG: no bụng, ăn uống, bếp nhà, căn tin, quầy ăn ngoài phố =================
// Mọi tên toàn cục có tiền tố v52l / V52L (khác V46L). Thiết kế gốc, hình vẽ pixel bằng code (cache thành sprite).
// Game cho trẻ em: đói chỉ đi chậm hơn một chút, không bao giờ chết hay bị phạt nặng.
const V52L_PHI = 1.618;
const V52L_FONT = "800 16px Nunito, 'Be Vietnam Pro', sans-serif";
// nguyên liệu: [tên, emoji, giá $, hình vẽ, màu 1, màu 2, nhóm]
const V52L_ING = {
  gao:['Gạo', '🍚', 2, 'sack', '#f4f1e6', '#c9b98a', 'grain'], banhpho:['Bánh phở', '🍜', 3, 'noodle', '#f5efe0', '#cbbd98', 'grain'],
  mi:['Mì sợi', '🍝', 3, 'noodle', '#f2d27a', '#c9a240', 'grain'], bot:['Bột mì', '🌾', 2, 'sack', '#ffffff', '#d9d2c0', 'grain'],
  banhmi:['Ổ bánh mì', '🥖', 3, 'bread', '#e0a050', '#a8682a', 'grain'], banhtrang:['Bánh tráng', '⚪', 2, 'sheet', '#f3eee2', '#d6ccb4', 'grain'],
  thitbo:['Thịt bò', '🥩', 6, 'meat', '#c0392b', '#f2c6c0', 'protein'], thitheo:['Thịt heo', '🥓', 5, 'meat', '#e57373', '#fde0dc', 'protein'],
  tom:['Tôm', '🦐', 5, 'shrimp', '#ff8a65', '#ffccbc', 'protein'], ca:['Cá', '🐟', 5, 'fish', '#78909c', '#cfd8dc', 'protein'],
  trung:['Trứng', '🥚', 2, 'egg', '#fff8e7', '#f3d9a4', 'protein'], dauxanh:['Đậu xanh', '🫘', 2, 'bean', '#7cb342', '#c5e1a5', 'protein'],
  phomai:['Phô mai', '🧀', 4, 'cheese', '#ffd54f', '#ffb300', 'dairy'], rau:['Rau xanh', '🥬', 1, 'leaf', '#43a047', '#a5d6a7', 'veg'],
  cachua:['Cà chua', '🍅', 1, 'round', '#e53935', '#43a047', 'veg'], dualeo:['Dưa leo', '🥒', 1, 'long', '#2e7d32', '#a5d6a7', 'veg'],
  hanh:['Hành', '🧅', 1, 'round', '#c792b8', '#7cb342', 'veg'], ngo:['Ngô', '🌽', 1, 'corn', '#fdd835', '#7cb342', 'veg'],
  chuoi:['Chuối', '🍌', 1, 'long', '#fdd835', '#8d6e63', 'fruit'], traicay:['Trái cây', '🍎', 2, 'round', '#ef5350', '#8d6e63', 'fruit'],
  cotdua:['Nước cốt dừa', '🥥', 2, 'coco', '#8d6e63', '#ffffff', 'other']
};
// món nấu được: 13 món Việt và quốc tế. cook: boil (luộc/nấu) · fry (chiên) · grill (nướng) · bake (lò) · mix (trộn/xay)
const V52L_REC = [
  {id:'pho', vi:'Phở bò', em:'🍜', o:'🇻🇳', ing:['banhpho', 'thitbo', 'hanh', 'rau'], cook:'boil', no:45, v:'bowl', c:['#f3e1b8', '#c0392b', '#43a047']},
  {id:'comtam', vi:'Cơm tấm', em:'🍛', o:'🇻🇳', ing:['gao', 'thitheo', 'trung', 'dualeo'], cook:'grill', no:50, v:'plate', c:['#f7f3e8', '#a0522d', '#2e7d32']},
  {id:'banhmi', vi:'Bánh mì', em:'🥖', o:'🇻🇳', ing:['banhmi', 'thitheo', 'dualeo', 'rau'], cook:'grill', no:35, v:'bread', c:['#e0a050', '#e57373', '#43a047']},
  {id:'goicuon', vi:'Gỏi cuốn', em:'🌯', o:'🇻🇳', ing:['banhtrang', 'tom', 'rau', 'dualeo'], cook:'boil', no:30, v:'roll', c:['#f3eee2', '#ff8a65', '#43a047']},
  {id:'che', vi:'Chè đậu xanh', em:'🍧', o:'🇻🇳', ing:['dauxanh', 'cotdua', 'chuoi'], cook:'boil', no:20, v:'glass', c:['#c5e1a5', '#ffffff', '#fdd835']},
  {id:'trung', vi:'Trứng chiên', em:'🍳', o:'🇻🇳', ing:['trung', 'hanh'], cook:'fry', no:25, v:'egg', c:['#fff8e7', '#ffc107', '#7cb342']},
  {id:'comchien', vi:'Cơm chiên', em:'🍚', o:'🇻🇳', ing:['gao', 'trung', 'ngo', 'hanh'], cook:'fry', no:45, v:'plate', c:['#f6d77a', '#fdd835', '#7cb342']},
  {id:'banhxeo', vi:'Bánh xèo', em:'🥞', o:'🇻🇳', ing:['bot', 'tom', 'rau'], cook:'fry', no:40, v:'half', c:['#f2c14e', '#ff8a65', '#43a047']},
  {id:'canhchua', vi:'Canh chua cá', em:'🍲', o:'🇻🇳', ing:['ca', 'cachua', 'rau'], cook:'boil', no:35, v:'bowl', c:['#ffcc80', '#e53935', '#43a047']},
  {id:'salad', vi:'Salad rau củ', em:'🥗', o:'🌍', ing:['rau', 'cachua', 'dualeo', 'ngo'], cook:'mix', no:25, v:'bowl', c:['#66bb6a', '#e53935', '#fdd835']},
  {id:'pizza', vi:'Pizza', em:'🍕', o:'🇮🇹', ing:['bot', 'cachua', 'phomai'], cook:'bake', no:45, v:'pizza', c:['#f2c14e', '#e53935', '#ffd54f']},
  {id:'miy', vi:'Mì Ý sốt cà', em:'🍝', o:'🇮🇹', ing:['mi', 'cachua', 'thitbo'], cook:'boil', no:45, v:'plate', c:['#f2d27a', '#d84315', '#7cb342']},
  {id:'sinhto', vi:'Sinh tố trái cây', em:'🥤', o:'🌍', ing:['chuoi', 'traicay'], cook:'mix', no:18, v:'glass', c:['#f8bbd0', '#fdd835', '#ef5350']}
];
// đồ ăn bán sẵn: [id, tên, emoji, giá, no, rau/trái cây?, nước?]
const V52L_MENU = {
  canteen:[['suatcom', 'Suất cơm căn tin (cơm, rau, thịt)', '🍱', 5, 55, 1], ['canh', 'Bát canh rau', '🥣', 2, 15, 1], ['dtraicay', 'Đĩa trái cây', '🍉', 2, 12, 1], ['sua', 'Hộp sữa', '🥛', 2, 10, 0], ['nuoc', 'Nước lọc', '💧', 0, 3, 0, 1]],
  stall:[['sbanhmi', 'Bánh mì nóng', '🥖', 4, 35, 0], ['xoi', 'Xôi đậu xanh', '🍙', 3, 30, 0], ['bap', 'Bắp luộc', '🌽', 2, 18, 1], ['ltraicay', 'Ly trái cây', '🍓', 3, 14, 1], ['mia', 'Nước mía', '🧃', 2, 8, 0], ['nuoc', 'Nước lọc', '💧', 1, 3, 0, 1]],
  home:[['nuoc', 'Nước lọc', '💧', 0, 3, 0, 1], ['tchuoi', 'Quả chuối trong tủ', '🍌', 1, 10, 1]]
};
const V52L_ST = {home:['🍳', 'Bếp nhà tôi', 'Nấu ăn & ăn cơm nhà'], canteen:['🍱', 'Căn tin trường', 'Bữa trưa cùng các bạn'], stall:['🥖', 'Quầy ăn ngoài phố', 'Đồ ăn vặt lành mạnh'], market:['🥬', 'Quầy nguyên liệu', 'Mua đồ về nấu']};
const V52L_TIPS = ['🥬 Ăn rau xanh giúp bụng khoẻ, tiêu hoá tốt.', '🍎 Mỗi ngày một ít trái cây: nhiều vitamin cho cơ thể.', '💧 Nhớ uống đủ nước, nhất là sau khi chạy nhảy.',
  '🍚 Ăn sáng đầy đủ thì học tập tập trung hơn.', '🥛 Sữa và trứng giúp xương chắc, người cao lớn.', '🍬 Đồ ngọt ăn ít thôi nhé, kẻo sâu răng!', '🐢 Nhai chậm, ăn từ tốn để bụng dễ chịu.',
  '🌈 Đĩa ăn nhiều màu (xanh, đỏ, vàng) là đĩa ăn khoẻ mạnh.', '🧼 Rửa tay sạch trước khi ăn nhé.'];
const V52L_MEAL = [['b', '☀️', 'Bữa sáng', 330, 600], ['l', '🌞', 'Bữa trưa', 630, 840], ['t', '🌙', 'Bữa tối', 1020, 1290]];
const V52L = {hudOn:null, near:null, lastT:0, growlT:0, remindT:0, npcT:0, spr:new Map(), G:null, tip:0, st:null, pan:'eat', where:'home', inv:null, ac:null};

// ---------- lưu ----------
function v52lDef(){ return {hun:80, pan:{gao:2, trung:3, hanh:2, rau:2, cachua:2, banhmi:1, thitheo:1, dualeo:1}, dish:{}, meal:{d:-1, b:0, l:0, t:0, all:0}, cooked:0, best:{}, gave:{d:-1, n:{}}, rday:{d:'', n:0}}; }
function v52lS(){
  if(typeof PROF !== 'undefined' && PROF){ if(!PROF.v52l) PROF.v52l = v52lDef(); const s = PROF.v52l; s.pan = s.pan || {}; s.dish = s.dish || {}; s.meal = s.meal || {d:-1}; s.best = s.best || {}; s.gave = s.gave || {d:-1, n:{}}; s.rday = s.rday || {d:'', n:0}; return s; }
  if(!V52L.G) V52L.G = v52lDef(); return V52L.G;
}
function v52lSave(){ try { if(typeof PROF !== 'undefined' && PROF) saveProfile(); } catch(e){} }
const v52lRec = id => V52L_REC.find(r => r.id === id);
const v52lHas = (k, n) => (v52lS().pan[k] || 0) >= (n || 1);
function v52lAdd(k, n){ const p = v52lS().pan; p[k] = Math.max(0, (p[k] || 0) + (n == null ? 1 : n)); if(!p[k]) delete p[k]; }
function v52lMissing(r){ return r.ing.filter(k => !v52lHas(k)); }

// ---------- âm thanh (WebAudio, không file) ----------
function v52lSnd(k){
  try { if(typeof V39S !== 'undefined' && V39S.vol && V39S.vol.sfx <= 0) return; ensureAC(); const t = AC.currentTime, out = typeof v39Bus === 'function' ? v39Bus() : AC.destination;
    if(k === 'growl'){ const o = AC.createOscillator(), g = AC.createGain(), l = AC.createOscillator(), lg = AC.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t); o.frequency.linearRampToValueAtTime(62, t + .7);
      l.frequency.value = 9; lg.gain.value = 18; l.connect(lg); lg.connect(o.frequency); const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260;
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.05, t + .08); g.gain.exponentialRampToValueAtTime(.0001, t + .8); o.connect(f); f.connect(g); g.connect(out); o.start(t); l.start(t); o.stop(t + .85); l.stop(t + .85); return; }
    const N = {eat:[520, 380, .09, 'square'], ok:[660, 990, .22, 'sine'], buy:[784, 1180, .16, 'triangle'], gift:[880, 1320, .3, 'triangle'], tap:[900, 700, .05, 'sine']}[k] || [700, 900, .1, 'sine'];
    const rep = k === 'eat' ? 3 : 1; for(let i = 0; i < rep; i++){ const s = t + i*.13, o = AC.createOscillator(), g = AC.createGain(); o.type = N[3]; o.frequency.setValueAtTime(N[0], s); o.frequency.exponentialRampToValueAtTime(N[1], s + N[2]);
      g.gain.setValueAtTime(.0001, s); g.gain.exponentialRampToValueAtTime(k === 'eat' ? .03 : .07, s + .012); g.gain.exponentialRampToValueAtTime(.0001, s + N[2] + .04); o.connect(g); g.connect(out); o.start(s); o.stop(s + N[2] + .06); }
  } catch(e){}
}

// ---------- vẽ pixel bằng code, cache thành sprite ----------
function v52lCv(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }
function v52lR(g, c, x, y, w, h){ g.fillStyle = c; g.fillRect(x, y, w, h); }
// nguyên liệu 32×32
function v52lIngSpr(k){
  const key = 'i:' + k; let c = V52L.spr.get(key); if(c) return c; const I = V52L_ING[k] || ['?', '', 0, 'round', '#ccc', '#999']; let g; [c, g] = v52lCv(32, 32); const a = I[4], b = I[5], R = (cl, x, y, w, h) => v52lR(g, cl, x, y, w, h), O = '#3b2a1f';
  switch(I[3]){
    case 'sack': R(O, 7, 9, 18, 21); R(a, 8, 10, 16, 19); R(b, 8, 24, 16, 5); R(O, 11, 5, 10, 5); R(b, 12, 6, 8, 3); R('#8d6e63', 10, 9, 12, 2); R(k === 'gao' ? '#e0d6b8' : '#efe9dc', 11, 14, 10, 6); break;
    case 'noodle': R(O, 5, 13, 22, 14); R(a, 6, 14, 20, 12); for(let i = 0; i < 5; i++) R(b, 7 + i*4, 15 + (i % 2)*3, 2, 9); R(b, 6, 24, 20, 2); break;
    case 'bread': R(O, 2, 12, 28, 10); R(a, 3, 13, 26, 8); R(b, 3, 19, 26, 2); for(let i = 0; i < 4; i++) R('#f6c886', 6 + i*6, 14, 3, 2); break;
    case 'sheet': g.fillStyle = O; g.beginPath(); g.arc(16, 17, 13, 0, 7); g.fill(); g.fillStyle = a; g.beginPath(); g.arc(16, 17, 12, 0, 7); g.fill(); g.strokeStyle = b; g.lineWidth = 1; for(let i = 0; i < 5; i++){ g.beginPath(); g.moveTo(6, 10 + i*4); g.lineTo(26, 12 + i*4); g.stroke(); } break;
    case 'meat': R(O, 4, 10, 24, 15); R(a, 5, 11, 22, 13); R(b, 5, 11, 22, 3); R(b, 14, 15, 9, 2); R('#8e1f16', 6, 20, 6, 3); break;
    case 'shrimp': g.strokeStyle = a; g.lineWidth = 6; g.beginPath(); g.arc(16, 17, 8, -.3, 3.4); g.stroke(); R(b, 9, 13, 3, 3); R('#1a1a1a', 23, 12, 2, 2); R(a, 5, 21, 5, 4); break;
    case 'fish': g.fillStyle = O; g.beginPath(); g.ellipse(14, 17, 11, 7, 0, 0, 7); g.fill(); g.fillStyle = a; g.beginPath(); g.ellipse(14, 17, 10, 6, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(24, 17); g.lineTo(30, 11); g.lineTo(30, 23); g.fill(); R(b, 7, 15, 10, 2); R('#111', 7, 14, 2, 2); break;
    case 'egg': g.fillStyle = O; g.beginPath(); g.ellipse(16, 17, 9, 12, 0, 0, 7); g.fill(); g.fillStyle = a; g.beginPath(); g.ellipse(16, 17, 8, 11, 0, 0, 7); g.fill(); R('#ffffff', 12, 9, 3, 4); R(b, 11, 22, 10, 3); break;
    case 'bean': for(let i = 0; i < 9; i++){ const x = 8 + (i % 3)*6 + (i > 5 ? 3 : 0), y = 10 + Math.floor(i/3)*6; R(O, x - 1, y - 1, 7, 6); R(a, x, y, 5, 4); R(b, x + 1, y, 2, 1); } break;
    case 'cheese': g.fillStyle = O; g.beginPath(); g.moveTo(3, 25); g.lineTo(29, 25); g.lineTo(29, 13); g.lineTo(5, 18); g.closePath(); g.fill(); g.fillStyle = a; g.beginPath(); g.moveTo(5, 24); g.lineTo(28, 24); g.lineTo(28, 14); g.lineTo(6, 18.5); g.closePath(); g.fill(); [[12, 20], [20, 18], [23, 21]].forEach(p => R(b, p[0], p[1], 3, 2)); break;
    case 'leaf': g.fillStyle = '#1b5e20'; g.beginPath(); g.ellipse(16, 18, 11, 12, 0, 0, 7); g.fill(); g.fillStyle = a; g.beginPath(); g.ellipse(13, 17, 8, 10, -.3, 0, 7); g.fill(); g.fillStyle = b; g.beginPath(); g.ellipse(19, 18, 7, 9, .3, 0, 7); g.fill(); R('#e8f5e9', 15, 12, 2, 16); break;
    case 'round': g.fillStyle = O; g.beginPath(); g.arc(16, 18, 11, 0, 7); g.fill(); g.fillStyle = a; g.beginPath(); g.arc(16, 18, 10, 0, 7); g.fill(); R('rgba(255,255,255,.55)', 10, 12, 4, 3); R(b, 15, 5, 3, 5); R(b, 18, 6, 5, 2); break;
    case 'long': g.save(); g.translate(16, 16); g.rotate(-.6); R(O, -14, -5, 28, 10); R(a, -13, -4, 26, 8); R('rgba(255,255,255,.35)', -10, -3, 18, 2); R(b, 12, -2, 3, 4); g.restore(); break;
    case 'corn': R('#558b2f', 8, 6, 5, 22); R('#7cb342', 19, 8, 5, 20); R(O, 11, 4, 10, 24); for(let y = 5; y < 27; y += 3) for(let x = 12; x < 20; x += 3) R(y % 2 ? a : '#fbc02d', x, y, 2, 2); break;
    case 'coco': g.fillStyle = a; g.beginPath(); g.arc(16, 18, 11, 0, 7); g.fill(); g.fillStyle = b; g.beginPath(); g.arc(16, 18, 7, 0, 7); g.fill(); R('#5d4037', 12, 8, 2, 2); R('#5d4037', 18, 8, 2, 2); break;
  }
  V52L.spr.set(key, c); return c;
}
// món ăn 48×40 (vẽ theo màu của món)
function v52lDishSpr(r){
  const key = 'd:' + r.id; let c = V52L.spr.get(key); if(c) return c; let g; [c, g] = v52lCv(48, 40); const [a, b, d] = r.c, R = (cl, x, y, w, h) => v52lR(g, cl, x, y, w, h), O = '#2b1d14';
  const plate = () => { g.fillStyle = O; g.beginPath(); g.ellipse(24, 29, 22, 9, 0, 0, 7); g.fill(); g.fillStyle = '#f5f5f5'; g.beginPath(); g.ellipse(24, 28, 21, 8, 0, 0, 7); g.fill(); g.fillStyle = '#d9dde6'; g.beginPath(); g.ellipse(24, 28, 15, 5, 0, 0, 7); g.fill(); };
  switch(r.v){
    case 'bowl': g.fillStyle = O; g.beginPath(); g.moveTo(5, 16); g.lineTo(43, 16); g.lineTo(36, 35); g.lineTo(12, 35); g.closePath(); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(7, 17); g.lineTo(41, 17); g.lineTo(35, 33); g.lineTo(13, 33); g.closePath(); g.fill();
      R('#3d7bff', 10, 24, 28, 2); g.fillStyle = a; g.beginPath(); g.ellipse(24, 17, 17, 4, 0, 0, 7); g.fill(); R(b, 14, 14, 8, 3); R(b, 26, 15, 6, 2); R(d, 20, 13, 4, 2); R(d, 31, 13, 3, 2); break;
    case 'plate': plate(); g.fillStyle = a; g.beginPath(); g.ellipse(18, 24, 10, 6, 0, 0, 7); g.fill(); R(b, 26, 19, 12, 7); R('#00000033', 26, 24, 12, 2); R(d, 30, 27, 8, 3); R(d, 12, 27, 5, 2); break;
    case 'bread': plate(); R(O, 6, 15, 36, 13); R(a, 7, 16, 34, 11); R(b, 9, 22, 30, 3); R(d, 10, 20, 28, 2); for(let i = 0; i < 4; i++) R('#f6c886', 11 + i*7, 17, 4, 2); break;
    case 'roll': plate(); for(let i = 0; i < 3; i++){ const x = 8 + i*11; R(O, x, 17, 10, 12); R(a, x + 1, 18, 8, 10); R(b, x + 2, 20, 6, 2); R(d, x + 2, 24, 6, 2); } R('#8d6e63', 39, 21, 6, 6); break;
    case 'glass': R(O, 15, 4, 18, 32); R('#e3f2fd', 16, 5, 16, 30); R(a, 17, 12, 14, 22); R(b, 17, 12, 14, 4); R(d, 19, 20, 4, 3); R(d, 25, 26, 4, 3); R('#ff4081', 27, 0, 2, 12); break;
    case 'egg': plate(); g.fillStyle = a; g.beginPath(); g.ellipse(24, 24, 14, 7, 0, 0, 7); g.fill(); g.fillStyle = b; g.beginPath(); g.arc(24, 23, 5, 0, 7); g.fill(); R(d, 15, 22, 3, 2); R(d, 32, 25, 3, 2); break;
    case 'half': plate(); g.fillStyle = a; g.beginPath(); g.arc(24, 27, 14, Math.PI, 0); g.fill(); R(b, 17, 21, 5, 3); R(b, 27, 20, 5, 3); R(d, 21, 16, 6, 3); break;
    case 'pizza': g.fillStyle = O; g.beginPath(); g.arc(24, 21, 18, 0, 7); g.fill(); g.fillStyle = a; g.beginPath(); g.arc(24, 21, 17, 0, 7); g.fill(); g.fillStyle = b; g.beginPath(); g.arc(24, 21, 14, 0, 7); g.fill();
      [[18, 15], [29, 17], [21, 26], [31, 26], [24, 20]].forEach(p => { R(d, p[0] - 2, p[1] - 2, 5, 4); }); g.strokeStyle = '#00000044'; g.lineWidth = 1; for(let i = 0; i < 3; i++){ g.beginPath(); g.moveTo(24 + Math.cos(i*1.05)*17, 21 + Math.sin(i*1.05)*17); g.lineTo(24 - Math.cos(i*1.05)*17, 21 - Math.sin(i*1.05)*17); g.stroke(); } break;
  }
  V52L.spr.set(key, c); return c;
}
// bếp nhà (cái chòi bếp nhỏ, tỷ lệ vàng 96 × 60), quầy căn tin, xe đẩy đồ ăn
function v52lStSpr(kind){
  const key = 's:' + kind; let c = V52L.spr.get(key); if(c) return c; let g; const R = (cl, x, y, w, h) => v52lR(g, cl, x, y, w, h), O = '#2b1d14';
  if(kind === 'home'){ [c, g] = v52lCv(104, 92);
    R(O, 8, 36, 88, 54); R('#f3e0c0', 10, 38, 84, 50); R('#e2c9a0', 10, 80, 84, 8); // tường
    g.fillStyle = O; g.beginPath(); g.moveTo(2, 40); g.lineTo(52, 8); g.lineTo(102, 40); g.closePath(); g.fill(); g.fillStyle = '#c0533a'; g.beginPath(); g.moveTo(7, 38); g.lineTo(52, 12); g.lineTo(97, 38); g.closePath(); g.fill();
    for(let i = 0; i < 4; i++) R('#a8432d', 14 + i*20, 30 - i*0, 14, 2); R(O, 70, 6, 12, 22); R('#8d6e63', 72, 8, 8, 20); // ống khói
    R(O, 18, 52, 24, 22); R('#bfe3ff', 20, 54, 20, 18); R('#ffffff', 29, 54, 2, 18); R('#ffffff', 20, 62, 20, 2); R('#ffd23f', 20, 70, 20, 2); // cửa sổ
    R(O, 58, 52, 26, 38); R('#8d5a33', 60, 54, 22, 36); R('#ffd23f', 77, 72, 3, 3); // cửa
    R('#2fbf71', 16, 76, 28, 6); R('#ef4b4b', 20, 74, 4, 4); R('#ffd23f', 30, 74, 4, 4); // bồn hoa
  } else if(kind === 'canteen'){ [c, g] = v52lCv(178, 56);
    R(O, 2, 20, 174, 34); R('#d9e2ec', 4, 22, 170, 30); R('#b7c3d0', 4, 44, 170, 8); R('#ffffff', 4, 22, 170, 4);
    const pots = ['#ef4b4b', '#ffd23f', '#2fbf71', '#3d7bff', '#ff8a2b']; pots.forEach((p, i) => { const x = 12 + i*33; R(O, x, 8, 26, 16); R('#9aa5b1', x + 1, 9, 24, 14); R(p, x + 3, 10, 20, 5); R('#ffffff55', x + 4, 10, 6, 2); });
    R(O, 14, 30, 150, 2); for(let i = 0; i < 6; i++){ const x = 12 + i*27; R('#7a5232', x, 34, 22, 6); R('#ffe0a3', x + 3, 34, 6, 3); R('#66bb6a', x + 11, 34, 6, 3); }
  } else { [c, g] = v52lCv(96, 92);
    g.fillStyle = O; g.beginPath(); g.moveTo(4, 30); g.lineTo(48, 4); g.lineTo(92, 30); g.closePath(); g.fill(); for(let i = 0; i < 6; i++){ g.fillStyle = i % 2 ? '#ffffff' : '#ff8a2b'; g.beginPath(); g.moveTo(48, 7); g.lineTo(8 + i*14, 29); g.lineTo(8 + (i + 1)*14, 29); g.closePath(); g.fill(); }
    R(O, 46, 28, 4, 22); R(O, 10, 46, 76, 32); R('#2f8a5a', 12, 48, 72, 28); R('#1f6a42', 12, 70, 72, 6); R('#ffe9a8', 16, 52, 64, 12);
    [['#e0a050', 18], ['#fdd835', 34], ['#ef5350', 50], ['#7cb342', 66]].forEach(([col, x]) => { R(O, x, 42, 12, 8); R(col, x + 1, 43, 10, 6); });
    [[22, 80], [74, 80]].forEach(([x, y]) => { g.fillStyle = O; g.beginPath(); g.arc(x, y + 4, 8, 0, 7); g.fill(); g.fillStyle = '#9aa5b1'; g.beginPath(); g.arc(x, y + 4, 5, 0, 7); g.fill(); });
  }
  V52L.spr.set(key, c); return c;
}
// bong bóng ý nghĩ "đói" trên đầu: cơm nắm nhỏ
function v52lHungrySpr(){
  let c = V52L.spr.get('hb'); if(c) return c; let g; [c, g] = v52lCv(22, 20); const R = (cl, x, y, w, h) => v52lR(g, cl, x, y, w, h);
  R('#0b1020', 1, 1, 20, 14); R('#ffffff', 2, 2, 18, 12); R('#ffffff', 4, 14, 3, 3); R('#ffffff', 2, 17, 2, 2);
  g.fillStyle = '#f4f4f4'; g.beginPath(); g.moveTo(11, 3); g.lineTo(17, 12); g.lineTo(5, 12); g.closePath(); g.fill(); g.strokeStyle = '#9aa5b1'; g.lineWidth = 1; g.stroke(); R('#1d3a2a', 7, 9, 8, 3);
  V52L.spr.set('hb', c); return c;
}

// ---------- vị trí trong thế giới (toạ độ đảo mới, theo khu v46 đã xếp) ----------
function v52lStations(){
  if(V52L.st && V52L.st.v === (typeof V46 !== 'undefined' && V46.ZI ? V46.ZI : null)) return V52L.st.L;
  if(typeof V46 === 'undefined' || !V46.ZI) return [];
  const Z = V46.ZI, L = [], add = (id, zid, f) => { const z = Z[zid]; if(z && z.n){ const p = f(z.n); L.push({id, x:Math.round(p[0]), y:Math.round(p[1])}); } };
  add('home', 'houses', n => [n.x0 - 128, n.y0 + (n.y1 - n.y0)/V52L_PHI]);
  add('canteen', 'hall', n => [n.x0 + (n.x1 - n.x0)/V52L_PHI/V52L_PHI + 4, n.y1 - 124]);
  add('stall', 'pstreet', n => [n.x0 + 258, n.y1 + 172]);
  add('stall', 'pstreet', n => [n.x0 + 710, n.y1 + 172]);
  V52L.st = {v:Z, L}; return L;
}
function v52lDrawStations(VBn){
  const L = v52lStations(); if(!L.length) return; const t = (typeof realT !== 'undefined' ? realT : performance.now()/1000);
  L.forEach(S => {
    if(S.x < VBn.x0 - 120 || S.x > VBn.x1 + 120 || S.y < VBn.y0 - 140 || S.y > VBn.y1 + 60) return;
    const sp = v52lStSpr(S.id), w = sp.width, h = sp.height; ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(S.x, S.y + 1, w*.46, 7, 0, 0, 7); ctx.fill(); ctx.drawImage(sp, Math.round(S.x - w/2), Math.round(S.y - h));
    if(S.id === 'home'){ for(let i = 0; i < 3; i++){ const k = (t*.35 + i/3) % 1; ctx.globalAlpha = (1 - k)*.5; ctx.fillStyle = '#e8eef5'; ctx.beginPath(); ctx.arc(S.x + 24 + Math.sin(t + i)*4 + k*8, S.y - h + 4 - k*34, 4 + k*7, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
    if(S.id === 'canteen' || S.id === 'stall'){ for(let i = 0; i < 2; i++){ const k = (t*.5 + i/2) % 1; ctx.globalAlpha = (1 - k)*.4; ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(S.x - 30 + i*40 + Math.sin(t*2 + i)*3), Math.round(S.y - h + 6 - k*20), 3, 6); } ctx.globalAlpha = 1; }
    if(cam.z >= .45){ const I = V52L_ST[S.id], fs = 17/Math.max(.8, cam.z), ly = S.y - h - 10 - fs*.6, s = I[0] + ' ' + I[1]; ctx.font = "800 " + fs.toFixed(1) + "px Nunito, 'Be Vietnam Pro', sans-serif"; const tw = ctx.measureText(s).width + fs;
      ctx.fillStyle = 'rgba(11,16,32,.78)'; ctx.fillRect(S.x - tw/2, ly - fs*.8, tw, fs*1.6); ctx.fillStyle = '#ffe9a8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, S.x, ly); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; }
  });
  // khay cơm trước mặt các bạn đang ăn trưa ở căn tin + bong bóng "đói"
  if(cam.z < .5 || typeof students === 'undefined') return; const hb = v52lHungrySpr(), tr = v52lDishSpr(V52L_REC[1]);
  students.forEach(s => { if(!s.visible || s.inSub) return; const p = v46Pos(s); if(p[0] < VBn.x0 || p[0] > VBn.x1 || p[1] < VBn.y0 || p[1] > VBn.y1) return;
    if(s.planKey === 'trua-true' && !s.moving && !(s.path && s.path.length)) ctx.drawImage(tr, Math.round(p[0] - 12), Math.round(p[1] - 30), 24, 20);
    else if((s.v52h == null ? 100 : s.v52h) < 25) ctx.drawImage(hb, Math.round(p[0] + 4), Math.round(p[1] - 52 + Math.sin(t*3 + s.idx)*1.5)); });
  if(typeof PLAYER !== 'undefined' && PLAYER && PLAYER.visible && PROF && v52lS().hun < 30){ const p = v46Pos(PLAYER); ctx.drawImage(hb, Math.round(p[0] + 6), Math.round(p[1] - 56 + Math.sin(t*4)*2)); }
}

// ---------- no bụng ----------
function v52lLevel(h){ return h < 10 ? 3 : h < 30 ? 2 : h < 60 ? 1 : 0; }   // 0 no · 1 hơi đói · 2 đói · 3 rất đói
function v52lHud(){
  const m = document.getElementById('v45Heart') || document.getElementById('profMoney'); if(!m) return; let s = document.getElementById('v52lHun');
  if(!s){ s = document.createElement('button'); s.type = 'button'; s.id = 'v52lHun'; s.className = 'v52lhun'; s.innerHTML = '<span class="ic">🍚</span><span class="bar"><i></i></span><b></b>'; s.title = 'No bụng: bấm để xem nên ăn gì';
    s.onclick = e => { e.stopPropagation(); v52lPanel(v52lNearId() || 'pocket'); }; m.after(s); }
  if(!PROF){ s.hidden = true; return; } s.hidden = false; const h = Math.round(v52lS().hun), L = v52lLevel(h);
  if(V52L.hudOn !== h + ':' + L){ V52L.hudOn = h + ':' + L; s.querySelector('i').style.width = h + '%'; s.querySelector('b').textContent = h; s.dataset.lv = L; s.setAttribute('aria-label', 'No bụng ' + h + ' phần trăm' + (L >= 2 ? ', đang đói' : '')); s.querySelector('.ic').textContent = L >= 2 ? '😋' : '🍚'; }
}
function v52lSporty(){ return !!(typeof openModal !== 'undefined' && openModal && /^(mOly|mArcade)$/.test(openModal.id)); }
function v52lTick(){
  const now = performance.now(), dt = Math.min(1, Math.max(0, (now - (V52L.lastT || now))/1000)); V52L.lastT = now;
  try { v52lHud(); } catch(e){}
  if(typeof PROF === 'undefined' || !PROF || !PLAYER || document.hidden || (typeof paused !== 'undefined' && paused)) { v52lBtn(null); return; }
  const S = v52lS(); let rate = 100/(15*60);                       // ngồi yên: khoảng 15 phút từ no tới đói hẳn
  if(PLAYER.moving) rate *= 1.5; if(PLAYER.cycling) rate *= 1.3; if(v52lSporty()) rate *= 2.2;
  if((typeof V52LC !== 'undefined' && V52LC.open) || (typeof V52LD !== 'undefined' && V52LD.on)) rate *= .25;
  S.hun = Math.max(0, S.hun - rate*dt);
  const L = v52lLevel(S.hun);
  if(L >= 2 && PLAYER.visible){
    V52L.growlT -= dt; if(V52L.growlT <= 0){ V52L.growlT = 22 + Math.random()*10; v52lSnd('growl'); try { floatText('ọc ọc… 😋', '#ffb74d'); } catch(e){} }
    V52L.remindT -= dt; if(V52L.remindT <= 0){ V52L.remindT = 70 + Math.random()*30; v52lRemind(L); }
  } else { V52L.growlT = 6; V52L.remindT = Math.min(V52L.remindT, 12); }
  V52L.npcT -= dt; if(V52L.npcT <= 0){ V52L.npcT = 1; try { v52lNpcTick(1); } catch(e){} }
  try { v52lBtn(PLAYER.visible && !(typeof V50 !== 'undefined' && V50.open) && !(typeof V52LD !== 'undefined' && V52LD.on) ? v52lNearId() : null); } catch(e){}
  if(Math.random() < dt/20) v52lSave();
}
// một bạn NPC gần đó nhắc nhở nhẹ nhàng
function v52lRemind(L){
  const pp = v46Pos(PLAYER); let best = null, bd = 520; agents.forEach(a => { if(!a.visible || a.isPlayer || a.inSub) return; const p = v46Pos(a), d = Math.hypot(p[0] - pp[0], p[1] - pp[1]); if(d < bd){ bd = d; best = a; } });
  const M = L >= 3 ? ['Bạn ơi, bụng bạn kêu to quá! Ghé căn tin hoặc quầy ăn nhé 🍱', 'Đói quá thì đi chậm lắm đó. Ăn chút gì đi bạn 🍙'] : ['Nghe như bụng bạn đang réo kìa 😄 Ăn nhẹ chút trái cây nhé 🍎', 'Sắp tới giờ ăn chưa nhỉ? Nhớ uống nước nữa nha 💧', 'Đi ăn cùng mình không? Căn tin hôm nay có canh rau ngon lắm 🥣'];
  const m = pick(M); if(best){ say(best, m); toast(best.name + ': ' + m); } else toast('😋 Bụng bạn đang kêu. ' + m);
}
// NPC học sinh cũng đói và xuống căn tin ăn trưa theo thời khoá biểu
function v52lNpcTick(dt){
  if(typeof students === 'undefined') return; const p = typeof period === 'function' && SCHED && SCHED.length ? period(clock) : '';
  students.forEach(s => {
    if(s.v52h == null) s.v52h = 55 + Math.random()*45;
    s.v52h = Math.max(0, s.v52h - dt*(s.moving ? 100/(14*60) : 100/(22*60)));
    if(p === 'trua' && s.planKey === 'trua-true'){ if(s.task && s.task.startsWith('Ăn trưa ở Hội trường')){ s.task = 'Ăn trưa ở Căn tin 🍱'; s.thought = pick(['Cơm căn tin hôm nay có rau muống xào!', 'Canh chua ngon quá', 'Ăn rau cho khoẻ nè']); }
      if(!s.moving && !(s.path && s.path.length)) s.v52h = Math.min(100, s.v52h + dt*6); }
    if(s.visible && s.v52h < 22 && !s.bubble && Math.random() < dt*.02) say(s, pick(['Bụng mình kêu rồi 😋', 'Sắp tới giờ ăn chưa nhỉ? 🍙', 'Mình thèm một quả chuối 🍌']));
  });
}
// ăn một món: hồi no bụng, xét bữa ăn đúng giờ, gợi ý ăn uống lành mạnh
function v52lEat(f){
  const S = v52lS(), was = S.hun; S.hun = Math.min(100, S.hun + f.no); v52lSnd('eat');
  try { floatText(`+${Math.round(S.hun - was)} 🍚 ${f.em || ''}`, '#9be38a'); } catch(e){}
  let msg = `${f.em || '😋'} Ngon quá! ${f.name}.`;
  if(f.no >= 15 && typeof clock !== 'undefined'){
    const m = S.meal, t = clock % 1440; if(m.d !== day) Object.assign(m, {d:day, b:0, l:0, t:0, all:0});
    const M = V52L_MEAL.find(x => t >= x[3] && t <= x[4]);
    if(M && !m[M[0]]){ m[M[0]] = 1; msg += ` ${M[1]} Ăn ${M[2].toLowerCase()} đúng giờ: +$3, +10 EXP.`; try { reward(10, 3, M[2] + ' đúng giờ', true); } catch(e){}
      if(m.b && m.l && m.t && !m.all){ m.all = 1; msg += ' 🌟 Đủ 3 bữa hôm nay!'; try { if(typeof v45Hearts === 'function') v45Hearts(1, 'Ăn đủ 3 bữa trong ngày'); } catch(e){} } }
  }
  const tip = f.water ? '💧 Uống nước giúp cơ thể mát và tỉnh táo.' : f.veg ? '👍 Có rau/trái cây: rất tốt cho sức khoẻ!' : V52L_TIPS[V52L.tip++ % V52L_TIPS.length];
  toast(msg + ' ' + tip); try { log('event', `${PROF.name} ăn ${f.name}.`); } catch(e){}
  v52lSave(); V52L.hudOn = null; v52lHud(); if(V52L.open) v52lRender();
}
function v52lBuy(cost){ if(!PROF){ try { openLogin(); } catch(e){} return false; } if(PROF.money < cost){ toast(`Chưa đủ tiền: cần $${cost}. Chơi mini game để kiếm thêm nhé!`); return false; } PROF.money -= cost; try { renderProfHud(); } catch(e){} return true; }

// ---------- nút ở gần trạm + bảng ăn uống ----------
function v52lNearId(){ if(typeof PLAYER === 'undefined' || !PLAYER || !PLAYER.visible) return null; const pp = v46Pos(PLAYER); let id = null, bd = 95; v52lStations().forEach(S => { const d = Math.hypot(pp[0] - S.x, pp[1] - (S.y - 8)); if(d < bd){ bd = d; id = S.id; } }); return id; }
function v52lBtn(id){
  let b = document.getElementById('v52lEnter'); if(!id){ if(b) b.hidden = true; return; }
  if(!b){ b = document.createElement('button'); b.type = 'button'; b.id = 'v52lEnter'; b.onclick = () => { const k = b.dataset.k; if(k) v52lPanel(k); }; (document.getElementById('stage') || document.body).appendChild(b); }
  if(b.dataset.k !== id){ const I = V52L_ST[id]; b.dataset.k = id; b.innerHTML = `${I[0]} ${id === 'home' ? 'Vào bếp' : id === 'canteen' ? 'Vào căn tin' : 'Ghé quầy ăn'} <small>${I[2]}</small>`; } b.hidden = false;
}
function v52lEl(tag, cls, html){ const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
function v52lModal(){
  let M = document.getElementById('v52lM'); if(M) return M;
  M = v52lEl('div', 'modal v52lm'); M.id = 'v52lM'; M.hidden = true; M.setAttribute('role', 'dialog'); M.setAttribute('aria-modal', 'true'); M.setAttribute('aria-labelledby', 'v52lT');
  M.innerHTML = '<div class="mbox wide v52lbox"><div class="mhead"><h2 id="v52lT">🍳 Bếp</h2><button class="mclose" data-close aria-label="Đóng">×</button></div><div class="v52ltop" id="v52lTop"></div><div class="seg v52ltabs" id="v52lTabs"></div><div id="v52lBody" class="v52lbody"></div></div>';
  document.body.appendChild(M); M.querySelector('[data-close]').onclick = () => { V52L.open = false; hideModal(); }; return M;
}
function v52lPanel(where, tab){
  if(typeof PROF === 'undefined' || !PROF){ try { openLogin(); } catch(e){} return; }
  V52L.where = where; V52L.pan = tab || (where === 'market' ? 'ing' : 'eat'); v52lModal(); showModal('v52lM'); V52L.open = true; v52lRender();
}
function v52lTabs(){ const w = V52L.where, T = [['eat', '🍽 Ăn']]; if(w === 'home' || w === 'canteen') T.push(['cook', '👩‍🍳 Nấu ăn']); T.push(['ing', '🥬 Nguyên liệu'], ['give', '🎁 Mời bạn']); return T; }
function v52lRender(){
  const M = document.getElementById('v52lM'); if(!M || M.hidden){ V52L.open = false; return; } const S = v52lS(), w = V52L.where, I = V52L_ST[w] || ['🍙', 'Ăn gì nhỉ?', 'Túi đồ ăn của bạn'];
  M.querySelector('#v52lT').textContent = I[0] + ' ' + I[1]; const h = Math.round(S.hun), L = v52lLevel(h), m = S.meal || {}, today = m.d === day;
  M.querySelector('#v52lTop').innerHTML = `<div class="v52lmeter" data-lv="${L}"><span>${['😊 No', '🙂 Hơi đói', '😋 Đói', '🥺 Rất đói'][L]}</span><span class="bar"><i style="width:${h}%"></i></span><b>${h}%</b></div>` +
    `<div class="v52lmeals">${V52L_MEAL.map(x => `<span class="${today && m[x[0]] ? 'ok' : ''}">${x[1]} ${x[2]}${today && m[x[0]] ? ' ✓' : ''}</span>`).join('')}</div><p class="v52ltip">${V52L_TIPS[(day + 3) % V52L_TIPS.length]} · <b>$${PROF.money}</b></p>`;
  const tb = M.querySelector('#v52lTabs'); tb.innerHTML = ''; v52lTabs().forEach(([k, n]) => { const b = v52lEl('button', '', n); b.type = 'button'; b.setAttribute('aria-pressed', V52L.pan === k); b.onclick = () => { V52L.pan = k; v52lRender(); }; tb.appendChild(b); });
  if(!v52lTabs().some(t => t[0] === V52L.pan)) V52L.pan = 'eat';
  const body = M.querySelector('#v52lBody'); body.innerHTML = ''; ({eat:v52lTabEat, cook:v52lTabCook, ing:v52lTabIng, give:v52lTabGive})[V52L.pan](body, S);
}
function v52lCard(icon, title, sub, btn, fn, dis){ const d = v52lEl('div', 'v52lcard'); const ic = v52lEl('div', 'ic'); if(icon instanceof HTMLCanvasElement){ const c = document.createElement('canvas'); c.width = icon.width; c.height = icon.height; c.getContext('2d').drawImage(icon, 0, 0); ic.appendChild(c); } else ic.textContent = icon;
  d.appendChild(ic); d.appendChild(v52lEl('div', 'tx', `<b>${title}</b><small>${sub}</small>`)); if(btn){ const b = v52lEl('button', 'primary', btn); b.type = 'button'; b.disabled = !!dis; b.onclick = fn; d.appendChild(b); } return d; }
function v52lTabEat(body, S){
  const menu = V52L_MENU[V52L.where] || V52L_MENU.home, g = v52lEl('div', 'v52lgrid');
  Object.keys(S.dish).filter(k => S.dish[k] > 0).forEach(k => { const r = v52lRec(k); if(!r) return; const veg = r.ing.some(i => /veg|fruit/.test(V52L_ING[i][6]));
    g.appendChild(v52lCard(v52lDishSpr(r), `${r.em} ${r.vi} ×${S.dish[k]}`, `Bạn tự nấu · +${r.no} no bụng${veg ? ' · 🥬 có rau' : ''}`, '😋 Ăn', () => { S.dish[k]--; if(!S.dish[k]) delete S.dish[k]; v52lEat({name:r.vi, em:r.em, no:r.no, veg}); })); });
  menu.forEach(([id, n, em, $, no, veg, water]) => g.appendChild(v52lCard(em, n, `${$ ? '$' + $ : 'Miễn phí'} · +${no} no bụng${veg ? ' · 🥬 lành mạnh' : ''}`, $ ? `Mua & ăn $${$}` : '💧 Uống', () => { if(v52lBuy($)) v52lEat({name:n, em, no, veg:!!veg, water:!!water}); })));
  if(V52L.where === 'pocket') body.appendChild(v52lEl('p', 'now', '📍 Tới <b>🍳 Bếp nhà tôi</b> (cạnh khu nhà học sinh), <b>🍱 Căn tin</b> (trong Hội trường) hoặc <b>🥖 Quầy ăn</b> (phố chợ) để mua đồ ăn và nấu ăn.'));
  body.appendChild(g);
}
function v52lTabCook(body, S){
  body.appendChild(v52lEl('p', 'now', '👩‍🍳 Chọn món: chọn nguyên liệu → rửa → thái (vuốt) → nấu (canh lửa) → bày đĩa. Thiếu đồ thì bấm mua nhanh.'));
  const g = v52lEl('div', 'v52lgrid');
  V52L_REC.forEach(r => { const miss = v52lMissing(r), cost = miss.reduce((a, k) => a + V52L_ING[k][2], 0), best = S.best[r.id] ? ' · ' + '★'.repeat(S.best[r.id]) : '';
    const ing = r.ing.map(k => `<span class="${v52lHas(k) ? 'ok' : 'no'}">${V52L_ING[k][1]} ${V52L_ING[k][0]}</span>`).join(' ');
    const d = v52lCard(v52lDishSpr(r), `${r.em} ${r.vi} <i>${r.o}</i>${best}`, ing, miss.length ? `Mua thiếu $${cost}` : '🔥 Nấu', () => {
      if(miss.length){ if(!v52lBuy(cost)) return; miss.forEach(k => v52lAdd(k, 1)); v52lSnd('buy'); v52lSave(); v52lRender(); return; }
      V52L.open = false; hideModal(); v52lcOpen(r.id, V52L.where); });
    g.appendChild(d); });
  body.appendChild(g);
}
function v52lTabIng(body, S){
  body.appendChild(v52lEl('p', 'now', '🌱 Rau, cà chua, ngô, trái cây thu hoạch ở <b>nông trại</b> cũng tự vào tủ bếp của bạn.'));
  const g = v52lEl('div', 'v52lgrid ing');
  Object.entries(V52L_ING).forEach(([k, I]) => g.appendChild(v52lCard(v52lIngSpr(k), `${I[1]} ${I[0]}`, `Trong tủ: ${S.pan[k] || 0} · $${I[2]}`, `+1 · $${I[2]}`, () => { if(!v52lBuy(I[2])) return; v52lAdd(k, 1); v52lSnd('buy'); v52lSave(); v52lRender(); })));
  body.appendChild(g);
}
function v52lTabGive(body, S){
  const dishes = Object.keys(S.dish).filter(k => S.dish[k] > 0);
  if(!dishes.length){ body.appendChild(v52lEl('p', 'now', '🎁 Bạn chưa có món tự nấu. Hãy nấu một món rồi mời bạn bè ăn cùng nhé!')); return; }
  const pp = v46Pos(PLAYER), near = agents.filter(a => a.visible && !a.isPlayer && !a.inSub).map(a => [a, (p => Math.hypot(p[0] - pp[0], p[1] - pp[1]))(v46Pos(a))]).filter(x => x[1] < 420).sort((a, b) => a[1] - b[1]).slice(0, 6);
  if(!near.length){ body.appendChild(v52lEl('p', 'now', '👀 Không có bạn nào ở gần. Đi tới chỗ đông người (sân trường, căn tin) rồi mời nhé.')); return; }
  const sel = v52lEl('div', 'seg'); let pick0 = V52L.give && S.dish[V52L.give] ? V52L.give : dishes[0]; V52L.give = pick0;
  dishes.forEach(k => { const r = v52lRec(k), b = v52lEl('button', '', `${r.em} ${r.vi} ×${S.dish[k]}`); b.type = 'button'; b.setAttribute('aria-pressed', k === pick0); b.onclick = () => { V52L.give = k; v52lRender(); }; sel.appendChild(b); });
  body.appendChild(sel); const g = v52lEl('div', 'v52lgrid'), G = S.gave; if(G.d !== day){ G.d = day; G.n = {}; }
  near.forEach(([a]) => { const done = G.n[a.id]; g.appendChild(v52lCard(a.student ? '🧒' : '🧑‍🏫', a.name, done ? 'Hôm nay đã mời bạn này rồi 💛' : (a.task || a.role || ''), done ? 'Đã mời' : '🎁 Mời ăn', () => v52lGive(a, V52L.give), !!done)); });
  body.appendChild(g);
}
function v52lGive(a, k){
  const S = v52lS(), r = v52lRec(k); if(!r || !S.dish[k]) return; S.dish[k]--; if(!S.dish[k]) delete S.dish[k]; S.gave.n[a.id] = 1; a.v52h = 100;
  const thx = pick([`Cảm ơn bạn! ${r.vi} bạn nấu ngon tuyệt 😋`, `Oa, ${r.vi}! Mình ăn hết sạch luôn 💛`, `Bạn nấu giỏi quá, lần sau dạy mình nhé!`]);
  say(a, thx); v52lSnd('gift'); toast(`${a.name}: ${thx}`); try { reward(12, 0, 'Mời bạn ăn ' + r.vi, true); if(typeof v45Hearts === 'function') v45Hearts(1, 'Mời ' + a.name + ' ăn ' + r.vi); } catch(e){}
  try { log('event', `${PROF.name} mời ${a.name} ăn ${r.vi} tự nấu. Tình bạn thêm thân thiết!`); } catch(e){} v52lSave(); v52lRender();
}

// ---------- nối với nông trại v45/v16: thu hoạch → tủ bếp ----------
function v52lFarmHooks(){
  if(typeof farmHarvest === 'function' && typeof FARM !== 'undefined'){ const fh0 = farmHarvest; farmHarvest = function(){
    let n = 0, ban = 0; try { FARM.plots.forEach(p => { if(p.fruit && plotStage(p) === 5){ if(p.fruit === 'chuoi') ban++; else n++; } }); } catch(e){}
    const r = fh0.apply(this, arguments); if(PROF && (n || ban)){ v52lAdd('traicay', n); v52lAdd('chuoi', ban); v52lSave(); setTimeout(() => toast(`🧺 Đã cất ${n ? n + ' trái cây ' : ''}${ban ? ban + ' chuối ' : ''}vào tủ bếp. Về bếp làm sinh tố nhé!`), 900); } return r; }; }
  if(typeof gClick === 'function' && typeof gState === 'function'){ const gc0 = gClick; gClick = function(e){
    let before = null; try { before = PROF ? gState().beds.map(b => b.c) : null; } catch(e2){}
    const r = gc0.apply(this, arguments);
    try { if(before){ const MAP = {rau:'rau', cachua:'cachua', ngo:'ngo', duahau:'traicay'}; gState().beds.forEach((b, i) => { if(before[i] && !b.c && MAP[before[i]]){ v52lAdd(MAP[before[i]], 2); v52lSave(); setTimeout(() => toast(`🧺 +2 ${V52L_ING[MAP[before[i]]][0]} vào tủ bếp!`), 700); } }); } } catch(e2){}
    return r; }; }
}
// nút "Bếp" trong Nhà tôi và "Nguyên liệu nấu ăn" trong Chợ
function v52lUiHooks(){
  const mk = document.querySelector('#mMarket .row');
  if(mk && !document.getElementById('v52lMk')){ const b = v52lEl('button', '', '🥬 Nguyên liệu nấu ăn'); b.type = 'button'; b.id = 'v52lMk'; b.onclick = () => { hideModal(); v52lPanel('market', 'ing'); }; mk.appendChild(b); }
  const ri = document.getElementById('roomInfo');
  if(ri && !document.getElementById('v52lRoomK')){ const b = v52lEl('button', 'primary', '🍳 Vào bếp nhà'); b.type = 'button'; b.id = 'v52lRoomK'; b.className = 'primary v52lroomk'; b.onclick = () => { hideModal(); v52lPanel('home'); }; ri.after(b); }
  if(typeof openRoom === 'function'){ const or0 = openRoom; openRoom = function(mode){ const r = or0.apply(this, arguments); const b = document.getElementById('v52lRoomK'); if(b) b.hidden = mode !== 'home' || (typeof ROOM !== 'undefined' && ROOM.readonly); return r; }; }
}

// ---------- khởi động (gọi duy nhất từ extFinalInit) ----------
function v52lInit(){
  if(typeof v47wWorld === 'function'){ const w0 = v47wWorld; v47wWorld = function(VBn){ w0(VBn); try { v52lDrawStations(VBn); } catch(e){ console.warn('v52l draw', e); } }; }
  // đói thì đi chậm hơn một chút (không bao giờ dừng hẳn)
  if(typeof v35Sp === 'function'){ const sp0 = v35Sp; v35Sp = function(c, sp){ let r = sp0(c, sp); try { if(c && c.isPlayer && typeof PROF !== 'undefined' && PROF){ const L = v52lLevel(v52lS().hun); if(L === 3) r *= .72; else if(L === 2) r *= .85; } } catch(e){} return r; }; }
  if(typeof renderProfHud === 'function'){ const rp0 = renderProfHud; renderProfHud = function(){ const r = rp0.apply(this, arguments); try { V52L.hudOn = null; v52lHud(); } catch(e){} return r; }; }
  v52lFarmHooks(); v52lUiHooks();
  setInterval(() => { try { v52lTick(); } catch(e){ console.warn('v52l tick', e); } }, 250);
  try { v52lcInit(); } catch(e){ console.warn('v52lc', e); }
  try { v52ldInit(); } catch(e){ console.warn('v52ld', e); }
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v52l = {V52L, v52lS, v52lPanel, v52lEat, v52lStations};
}
