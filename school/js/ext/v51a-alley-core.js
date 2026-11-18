// ================= v51a · PHỐ CẦU VỒNG PHÉP THUẬT (Rainbow Spell Lane): dữ liệu, lưu, tiền, hiệu ứng, hình vẽ bằng code =================
// Thiết kế gốc hoàn toàn: tên phố, tên tiệm, thú cưng, chổi, kẹo, sách đều tự đặt. Mọi hình vẽ bằng code (không tải ảnh ngoài).
// Mọi tên toàn cục có tiền tố v51a / V51A. Dùng lại tiện ích v50 (v50Person, v50Glow, v50Shape, v50P, v50Snd, v50Reward, v50State).
const V51A_PHI = 1.618;
const V51A_FONT = "800 16px Nunito, 'Be Vietnam Pro', sans-serif";
// 10 cửa hàng (+ bưu cục cú, quầy đồ thất lạc, tháp đồng hồ, xe bóng bay là điểm phụ)
const V51A_SHOPS = [
  {id:'wand', ic:'🪄', vi:'Tiệm Đũa Sao Đêm', en:'Starnight Wands', wall:'#3b2d5c', roof:'#241a3d', acc:'#ffd23f'},
  {id:'robe', ic:'🧥', vi:'Xưởng Áo Choàng Mây', en:'Cloudweave Robes', wall:'#7a1f2b', roof:'#45121c', acc:'#e8c27a'},
  {id:'book', ic:'📚', vi:'Nhà Sách Trang Bay', en:'Flying Page Books', wall:'#2f5a3e', roof:'#1d3a28', acc:'#f0e2b6'},
  {id:'brew', ic:'⚗️', vi:'Vạc & Thảo Mộc', en:'Cauldron & Herbs', wall:'#4a4a58', roof:'#2a2a34', acc:'#7fe36a'},
  {id:'pet', ic:'🦉', vi:'Tổ Cú & Thú Phép', en:'Owl Nest Pets', wall:'#8a5a32', roof:'#53351c', acc:'#ffffff'},
  {id:'candy', ic:'🍬', vi:'Kẹo Nổ Lấp Lánh', en:'Fizzy Sparkle Sweets', wall:'#f27db3', roof:'#c9437a', acc:'#ffe066'},
  {id:'broom', ic:'🧹', vi:'Chổi Bay Gió Lộng', en:'Windrush Brooms', wall:'#b5793a', roof:'#6b4226', acc:'#ffe9a8'},
  {id:'toy', ic:'🧊', vi:'Đồ Chơi Rubik Phép', en:'Magic Rubik Toys', wall:'#3d7bff', roof:'#1a2f7a', acc:'#ffd23f'},
  {id:'ice', ic:'🍦', vi:'Xe Kem Tuyết Mây', en:'Snowcloud Ice Cream', wall:'#ffe9f2', roof:'#ff8fc4', acc:'#7fd3ff'},
  {id:'bank', ic:'🐷', vi:'Ngân Hàng Heo Đất Rubik', en:'Rubik Piggy Bank', wall:'#d2cab6', roof:'#6b6a78', acc:'#ffd23f'}
];
// thú cưng phép (đi theo người chơi). fly = bay trên vai
const V51A_PETS = [
  {vi:'Cú Tuyết Bông', en:'Snowpuff Owl', $:60, lvl:1, c:'#f4f4f8', c2:'#c8cde0', k:'owl', fly:1, say:'Cú quay đầu được gần 270 độ đó!'},
  {vi:'Cú Hạt Dẻ', en:'Chestnut Owl', $:50, lvl:1, c:'#a86a3a', c2:'#6b4226', k:'owl', fly:1, say:'Cú săn đêm nhờ đôi mắt rất to.'},
  {vi:'Mèo Mây Tím', en:'Cloud Cat', $:80, lvl:2, c:'#9a86d8', c2:'#6b58a8', k:'cat', say:'Mèo ngủ khoảng 13–16 giờ mỗi ngày.'},
  {vi:'Ếch Ngọc', en:'Jade Frog', $:40, lvl:1, c:'#3fbf6a', c2:'#1f7a40', k:'frog', say:'Ếch uống nước qua da!'},
  {vi:'Thỏ Trăng', en:'Moon Bunny', $:100, lvl:3, c:'#ffffff', c2:'#ffc2cf', k:'bunny', say:'Răng thỏ mọc suốt đời.'},
  {vi:'Cáo Lửa Cam', en:'Ember Fox', $:140, lvl:5, c:'#ff8a2b', c2:'#fff3e0', k:'fox', say:'Cáo nghe được tiếng chuột dưới tuyết.'},
  {vi:'Rồng Mây Tí Hon', en:'Tiny Cloud Dragon', $:260, lvl:8, c:'#7fd3ff', c2:'#e8c2ff', k:'dragon', fly:1, say:'Rồng mây chỉ thở ra… bong bóng xà phòng 🫧'}
];
// chổi bay: dùng ở mini game "Bay Chổi Qua Vòng" của Học viện (màu chổi, vệt sao, nam châm hút sao, điểm thưởng mỗi vòng)
const V51A_BROOMS = [
  {vi:'Chổi Tre Tập Bay', en:'Bamboo Trainer', $:0, lvl:1, st:'#8a5a32', br:'#d8b86a', tr:'#fff3b0', mag:1, bon:0},
  {vi:'Chổi Gió Sồi', en:'Oak Breeze', $:70, lvl:2, st:'#6b4226', br:'#e8c27a', tr:'#c8ffb0', mag:1.4, bon:1},
  {vi:'Chổi Sao Băng', en:'Shooting Star', $:140, lvl:4, st:'#2c3a66', br:'#9fb2ff', tr:'#9fd8ff', mag:1.8, bon:2},
  {vi:'Chổi Mây Hồng', en:'Pink Cloud', $:200, lvl:6, st:'#a8436a', br:'#ffc2e0', tr:'#ff8fc4', mag:2.2, bon:3},
  {vi:'Chổi Cầu Vồng Rubik', en:'Rubik Rainbow', $:400, lvl:10, st:'#f4f4f4', br:'rainbow', tr:'rainbow', mag:2.8, bon:5}
];
// áo choàng đặc biệt (thêm vào bảng màu áo v50, từ chỉ số 12)
const V51A_ROBES = [['#23205a', 'Ngân Hà', 'Galaxy', 50], ['#c8553d', 'Hoàng Hôn', 'Sunset', 40], ['#9aa3b8', 'Bạc Trăng', 'Moon Silver', 60], ['#b8741a', 'Hổ Phách', 'Amber', 45], ['#1f8a8a', 'Ngọc Lam', 'Teal Jade', 55], ['#e07aa0', 'Anh Đào', 'Cherry Blossom', 70]];
// sách phép = bài học ngắn + câu hỏi (đọc xong trả lời đúng được EXP)
const V51A_BOOKS = [
  {vi:'Vì Sao Sao Lấp Lánh?', en:'Why Do Stars Twinkle?', ic:'🌟', $:15, txt:['Ánh sao đi qua lớp không khí luôn chuyển động.', 'Không khí bẻ cong ánh sáng lúc nhiều lúc ít, nên sao như nhấp nháy.', 'Ngoài vũ trụ, nhà du hành thấy sao sáng đều, không lấp lánh.'], q:'Sao lấp lánh là do…', a:['Không khí chuyển động', 'Sao bật tắt đèn', 'Mây che'], ok:0},
  {vi:'Bí Mật Lá Xanh', en:'Secret of Green Leaves', ic:'🌿', $:15, txt:['Lá cây dùng ánh nắng, nước và khí CO₂ để làm thức ăn.', 'Quá trình đó gọi là quang hợp, và lá thải ra khí oxy cho chúng ta thở.'], q:'Lá cây thải ra khí gì?', a:['Khí oxy', 'Khói', 'Hơi nước nóng'], ok:0},
  {vi:'Con Số Vàng 1,618', en:'The Golden Number', ic:'🐚', $:20, txt:['Dãy Fibonacci: 1, 1, 2, 3, 5, 8, 13… số sau bằng tổng hai số trước.', 'Chia một số cho số đứng trước, kết quả tiến dần tới 1,618 (tỷ lệ vàng φ).', 'Mặt tiền mỗi tiệm ở phố này cao gấp 1,618 lần bề ngang!'], q:'Số tiếp theo của 3, 5, 8 là…', a:['13', '11', '16'], ok:0},
  {vi:'Hành Trình Giọt Nước', en:'Journey of a Raindrop', ic:'💧', $:15, txt:['Nắng làm nước bốc hơi bay lên trời.', 'Hơi nước gặp lạnh ngưng tụ thành mây.', 'Mây nặng thì mưa rơi xuống, chảy ra sông, ra biển rồi lại bốc hơi.'], q:'Hơi nước gặp lạnh sẽ thành…', a:['Mây', 'Lửa', 'Cát'], ok:0},
  {vi:'Khối Rubik Kỳ Diệu', en:'The Wonderful Cube', ic:'🧩', $:25, txt:['Khối Rubik 3×3 có 6 mặt, mỗi mặt 9 ô vuông.', 'Nó có khoảng 43 tỷ tỷ cách xáo trộn khác nhau!', 'Ai cũng giải được nếu học từng bước và kiên nhẫn luyện tập.'], q:'Mỗi mặt Rubik 3×3 có bao nhiêu ô?', a:['9 ô', '6 ô', '12 ô'], ok:0},
  {vi:'Phép Màu Của Lời Tử Tế', en:'Magic of Kind Words', ic:'💛', $:10, txt:['"Cảm ơn", "xin lỗi", "bạn có sao không?" là những câu thần chú mạnh nhất.', 'Thử nói một câu tử tế với bạn bè hôm nay nhé!', 'English: thank you · sorry · are you okay?'], q:'Câu nào là "câu thần chú" tử tế?', a:['Cảm ơn bạn!', 'Tránh ra!', 'Kệ bạn!'], ok:0},
  {vi:'Tiết Kiệm Như Heo Đất', en:'Save Like a Piggy', ic:'🐷', $:10, txt:['Mỗi tuần bỏ ống $5, sau 10 tuần em có $50.', 'Gửi ngân hàng còn được lãi: tiền đẻ ra tiền.', 'Lãi kép: tháng sau em được lãi cả trên phần lãi tháng trước!'], q:'Mỗi tuần $5, sau 4 tuần có…', a:['$20', '$9', '$54'], ok:0}
];
// nguyên liệu pha chế (thật, an toàn) + công thức 2 món → thuốc vui
const V51A_ING = [
  {id:'mint', vi:'Lá bạc hà', en:'Mint leaf', ic:'🌿', $:5, c:'#3fd36a', fact:'Bạc hà có mùi the mát.'},
  {id:'lav', vi:'Hoa oải hương', en:'Lavender', ic:'💜', $:6, c:'#b089ff', fact:'Oải hương giúp thư giãn.'},
  {id:'honey', vi:'Mật ong', en:'Honey', ic:'🍯', $:6, c:'#ffb000', fact:'Ong bay rất xa để làm mật.'},
  {id:'dew', vi:'Sương sớm', en:'Morning dew', ic:'💧', $:4, c:'#7fd3ff', fact:'Sương đọng khi đêm lạnh.'},
  {id:'star', vi:'Bụi sao', en:'Stardust', ic:'✨', $:12, c:'#ffe066', fact:'Bụi sao thật có trong thiên thạch!'},
  {id:'lemon', vi:'Vỏ chanh', en:'Lemon peel', ic:'🍋', $:4, c:'#f4e04d', fact:'Chanh chứa nhiều vitamin C.'}
];
const V51A_POTS = {
  'mint+dew':{id:'speed', vi:'Thuốc Gió Mát', en:'Breeze Draught', ic:'🌬️', c:'#7fe3ff', fx:'speed', sec:60, d:'Đi nhanh gấp rưỡi trong 60 giây'},
  'lav+star':{id:'firefly', vi:'Thuốc Đom Đóm', en:'Firefly Tonic', ic:'🪲', c:'#d9ff7a', fx:'firefly', sec:90, d:'Đom đóm sáng bay quanh em'},
  'honey+lemon':{id:'bubble', vi:'Nước Bong Bóng', en:'Bubble Brew', ic:'🫧', c:'#9fd8ff', fx:'bubble', sec:60, d:'Bong bóng bay theo bước chân'},
  'honey+star':{id:'sparkle', vi:'Thuốc Lấp Lánh', en:'Sparkle Potion', ic:'🌟', c:'#ffe066', fx:'sparkle', sec:60, d:'Sao vàng lấp lánh quanh người'},
  'dew+lav':{id:'hop', vi:'Thuốc Bay Bổng', en:'Floaty Fizz', ic:'🎈', c:'#c8b0ff', fx:'hop', sec:45, d:'Nhún nhảy bồng bềnh khi đi'},
  'lemon+mint':{id:'rainbow', vi:'Thuốc Cầu Vồng', en:'Rainbow Elixir', ic:'🌈', c:'#ff8fc4', fx:'rainbow', sec:60, d:'Vệt cầu vồng 6 màu Rubik sau lưng'}
};
const V51A_CANDY = [
  {id:'pop', vi:'Kẹo Nổ Sao', en:'Star Popper', ic:'🍬', $:3, fx:'sparkle', sec:25, d:'Lách tách sao vàng'},
  {id:'cloud', vi:'Kẹo Bông Mây', en:'Cloud Floss', ic:'☁️', $:4, fx:'cloud', sec:30, d:'Một đám mây nhỏ trên đầu'},
  {id:'rain', vi:'Kẹo Dẻo Cầu Vồng', en:'Rainbow Gummy', ic:'🌈', $:5, fx:'rainbow', sec:25, d:'Vệt cầu vồng phía sau'},
  {id:'frog', vi:'Sô-cô-la Ếch Nhảy', en:'Hopping Choco Frog', ic:'🐸', $:5, fx:'hop', sec:20, d:'Nhảy tưng tưng'},
  {id:'snow', vi:'Kẹo Bạc Hà Tuyết', en:'Snowy Mint', ic:'❄️', $:4, fx:'snow', sec:30, d:'Bông tuyết rơi quanh em'},
  {id:'fizz', vi:'Kẹo Bong Bóng Nổ', en:'Bubble Fizz', ic:'🫧', $:3, fx:'bubble', sec:25, d:'Bong bóng bay lên'}
];
const V51A_TOYS = [
  {vi:'Rubik 2×2 Bay Lượn', en:'Hovering 2×2', $:30, lvl:1, k:'c2'},
  {vi:'Rubik 3×3 Lấp Lánh', en:'Sparkle 3×3', $:60, lvl:2, k:'c3'},
  {vi:'Kim Tự Tháp Rubik', en:'Rubik Pyramid', $:90, lvl:3, k:'pyr'},
  {vi:'Rubik Sao 12 Mặt', en:'12-Face Star Puzzle', $:150, lvl:5, k:'dod'},
  {vi:'Rubik Cầu Vồng Xoay', en:'Rainbow Spinner', $:220, lvl:7, k:'spin'}
];
const V51A_ICE = [['🍦', 'Vani', 'Vanilla', 3, '#fff3d6'], ['🍓', 'Dâu', 'Strawberry', 3, '#ff9ab8'], ['🍫', 'Sô-cô-la', 'Chocolate', 4, '#8a5a3a'], ['🍵', 'Trà xanh', 'Green tea', 4, '#9fd36a'], ['🥭', 'Xoài', 'Mango', 4, '#ffc23f'], ['✨', 'Kem Mây Phép', 'Magic Cloud', 8, '#c8b0ff']];
const V51A_RUBIK = ['#ef4b4b', '#ffd23f', '#3d7bff', '#2fbf71', '#f4f4f4', '#ff8a2b'];
const V51A = {open:false, say:0, fx:{}, cone:null, bal:null, root:null, quest:null, petTr:[]};

// ---------- lưu ----------
function v51aDef(){ return {pets:[], pet:-1, brooms:[0], broom:0, robes:[], books:[], read:{}, cauld:false, ing:{}, pot:{}, candy:{}, toys:[], toy:-1, bank:{bal:0, t:0, earned:0}, best:{}, seen:false}; }
function v51aGuest(){ if(V51A.G) return V51A.G; let g = null; try { g = JSON.parse(localStorage.getItem('truong-v51a-guest') || 'null'); } catch(e){} V51A.G = Object.assign(v51aDef(), g || {}); return V51A.G; }
function v51aState(){
  if(typeof PROF !== 'undefined' && PROF){ if(!PROF.v51a) PROF.v51a = Object.assign(v51aDef(), v51aGuest()); const s = PROF.v51a, d = v51aDef(); for(const k in d) if(s[k] == null) s[k] = d[k]; if(!s.brooms.length) s.brooms = [0]; return s; }
  return v51aGuest();
}
function v51aSave(){ try { if(typeof PROF !== 'undefined' && PROF) saveProfile(); else localStorage.setItem('truong-v51a-guest', JSON.stringify(v51aGuest())); } catch(e){} }
function v51aLv(){ return (typeof PROF !== 'undefined' && PROF) ? PROF.level || 1 : 1; }
function v51aMoney(){ return (typeof PROF !== 'undefined' && PROF) ? PROF.money || 0 : 0; }
function v51aSay(m){ V51A.say = 1; try { toast(m); } catch(e){} finally { V51A.say = 0; } }
// trả tiền: cần đăng nhập + đủ $
function v51aPay(n){
  if(typeof PROF === 'undefined' || !PROF){ try { if(typeof loginNudge === 'function') loginNudge(); } catch(e){} v51aSay('🔑 Đăng nhập để mua sắm và lưu đồ nhé!'); return false; }
  if((PROF.money || 0) < n){ v51aSay('💰 Cần $' + n + ' (em đang có $' + (PROF.money || 0) + '). Chơi mini game hoặc rút tiền tiết kiệm nhé!'); v50Snd('bad'); return false; }
  PROF.money -= n; try { renderProfHud(); } catch(e){} v50Snd('buy'); return true;
}
function v51aGive(n){ if(typeof PROF === 'undefined' || !PROF) return; PROF.money = (PROF.money || 0) + n; try { renderProfHud(); } catch(e){} }

// ---------- ngân hàng heo đất: lãi kép 2%/ngày thật, tính tối đa 30 ngày mỗi lần vắng, chỉ trên $2000 đầu ----------
const V51A_RATE = .02, V51A_CAP = 2000, V51A_DAY = 86400000;
function v51aBank(){ const s = v51aState(), b = s.bank; if(!b.t) b.t = Date.now(); const days = Math.floor((Date.now() - b.t)/V51A_DAY); let got = 0;
  if(days > 0){ const n = Math.min(30, days), base = Math.min(b.bal, V51A_CAP); got = Math.floor(base*(Math.pow(1 + V51A_RATE, n) - 1)); b.bal += got; b.earned += got; b.t += days*V51A_DAY; v51aSave(); }
  return got; }
function v51aBankMove(n){ // n > 0 gửi, n < 0 rút
  const s = v51aState(), b = s.bank; v51aBank(); if(typeof PROF === 'undefined' || !PROF){ v51aPay(0); return false; }
  if(n > 0){ n = Math.min(n, PROF.money || 0); if(n <= 0){ v51aSay('💰 Em chưa có tiền để gửi.'); return false; } PROF.money -= n; b.bal += n; if(!b.t) b.t = Date.now(); }
  else { n = Math.min(-n, b.bal); if(n <= 0){ v51aSay('🐷 Heo đất đang trống.'); return false; } b.bal -= n; PROF.money += n; }
  try { renderProfHud(); } catch(e){} v51aSave(); v50Snd(n > 0 ? 'pop' : 'ok'); return true;
}
function v51aProj(bal, d){ const base = Math.min(bal, V51A_CAP); return bal + Math.floor(base*(Math.pow(1 + V51A_RATE, d) - 1)); }

// ---------- hiệu ứng vui (thuốc, kẹo, kem, bóng bay) ----------
function v51aFx(kind, sec){ V51A.fx[kind] = Math.max(V51A.fx[kind] || 0, sec); }
function v51aFxOn(kind){ return (V51A.fx[kind] || 0) > 0; }
function v51aFxTick(dt){ for(const k in V51A.fx){ if(V51A.fx[k] > 0) V51A.fx[k] = Math.max(0, V51A.fx[k] - dt); } if(V51A.cone && (V51A.cone.t -= dt) <= 0) V51A.cone = null; if(V51A.bal && (V51A.bal.t -= dt) <= 0) V51A.bal = null; }

// ---------- vẽ thú cưng (pixel, toạ độ cục bộ: chân ở y=0) ----------
function v51aDrawPet(g, i, x, y, t, dir, mv){
  const p = V51A_PETS[i]; if(!p) return; const R = (c, a, b, w, h) => { g.fillStyle = c; g.fillRect(a, b, w, h); }, f = Math.floor(t*(mv ? 8 : 3)) % 2;
  g.save(); g.translate(Math.round(x), Math.round(y)); if(dir < 0) g.scale(-1, 1);
  if(!p.fly) R('rgba(0,0,0,.22)', -6, -1, 12, 3);
  if(p.k === 'owl'){ const up = Math.sin(t*3)*2; g.translate(0, up); R('rgba(0,0,0,.15)', -5, 18 - up, 10, 2);
    R(p.c2, -6, -13, 12, 13); R(p.c, -5, -12, 10, 11); R(p.c2, -6, -15, 3, 3); R(p.c2, 3, -15, 3, 3);
    R('#fff', -4, -10, 4, 4); R('#fff', 0, -10, 4, 4); R('#1a1a22', -3, -9, 2, 2); R('#1a1a22', 1, -9, 2, 2); R('#ffb000', -1, -6, 2, 2);
    const wy = f ? -9 : -5; R(p.c2, -9, wy, 3, 7); R(p.c2, 6, wy, 3, 7); R('rgba(0,0,0,.18)', -4, -3, 8, 2); R('#ffb000', -3, 0, 2, 1); R('#ffb000', 1, 0, 2, 1); }
  else if(p.k === 'cat'){ const tl = Math.sin(t*4)*3; R(p.c, -7, -7, 11, 6); R(p.c, 2, -11, 7, 6); R(p.c, 2, -13, 2, 2); R(p.c, 7, -13, 2, 2); R('#1a1a22', 6, -9, 1, 1); R('#ffc2cf', 8, -8, 1, 1);
    R(p.c2, -10, -10 + tl*.4, 3, 6); R(p.c2, -11, -13 + tl, 2, 4); R(p.c2, -6, -1, 2, 1 + (mv ? f : 0)); R(p.c2, 1, -1, 2, 1 + (mv ? 1 - f : 0)); R('rgba(255,255,255,.3)', -6, -7, 10, 1); }
  else if(p.k === 'frog'){ const hp = mv ? -Math.abs(Math.sin(t*7))*5 : 0; g.translate(0, hp); R(p.c2, -6, -6, 12, 6); R(p.c, -5, -7, 10, 6); R(p.c, -5, -10, 3, 3); R(p.c, 2, -10, 3, 3); R('#fff', -4, -9, 2, 2); R('#fff', 3, -9, 2, 2); R('#1a1a22', -3, -9, 1, 1); R('#1a1a22', 4, -9, 1, 1); R('#ff8fa0', -2, -4, 4, 1); }
  else if(p.k === 'bunny'){ const hp = mv ? -Math.abs(Math.sin(t*6))*4 : 0; g.translate(0, hp); R(p.c, -6, -7, 10, 7); R(p.c, 1, -11, 6, 6); R(p.c, 2, -18, 2, 7); R(p.c, 5, -17, 2, 6); R(p.c2, 2, -16, 1, 4); R(p.c2, 5, -15, 1, 3); R('#1a1a22', 5, -9, 1, 1); R(p.c2, 6, -7, 1, 1); R('#fff', -8, -6, 3, 3); }
  else if(p.k === 'fox'){ const tl = Math.sin(t*3)*2; R(p.c, -7, -7, 11, 5); R(p.c, 2, -11, 7, 5); R(p.c, 2, -13, 2, 2); R(p.c, 6, -13, 2, 2); R(p.c2, 6, -8, 4, 2); R('#1a1a22', 9, -9, 1, 1); R('#1a1a22', 5, -10, 1, 1);
    R(p.c, -12, -8 + tl, 6, 4); R(p.c2, -14, -8 + tl, 3, 3); R('#3a2a1a', -6, -2, 2, 2 + (mv ? f : 0)); R('#3a2a1a', 1, -2, 2, 2 + (mv ? 1 - f : 0)); }
  else if(p.k === 'dragon'){ const up = Math.sin(t*2.6)*3; g.translate(0, up); R('rgba(0,0,0,.12)', -5, 20 - up, 10, 2); R(p.c, -6, -9, 10, 7); R(p.c, 2, -13, 7, 6); R('#fff', 6, -12, 2, 2); R('#1a1a22', 7, -12, 1, 1); R(p.c2, 3, -15, 2, 2); R(p.c2, 6, -15, 2, 2);
    const wy = f ? -16 : -12; R(p.c2, -4, wy, 6, 4); R(p.c2, -2, wy - 2, 3, 2); R(p.c, -10, -6, 4, 3); R(p.c, -12, -4, 3, 2); R('rgba(255,255,255,.35)', -5, -9, 8, 1); }
  g.restore();
}
// ---------- đồ chơi Rubik lơ lửng ----------
function v51aDrawToy(g, i, x, y, t, s){
  const k = (V51A_TOYS[i] || V51A_TOYS[0]).k, C = V51A_RUBIK, sc = s || 1, sp = Math.floor(t*2); g.save(); g.translate(x, y + Math.sin(t*2.4)*2*sc); g.scale(sc, sc);
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = .35; g.drawImage(v50Glow(k === 'spin' ? C[sp % 6] : '#fff3b0'), -14, -14, 28, 28); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  if(k === 'c2' || k === 'c3'){ const n = k === 'c2' ? 2 : 3, q = n === 2 ? 5 : 3.6, o = -n*q/2; g.fillStyle = '#111'; g.fillRect(o - 1, o - 1, n*q + 2, n*q + 2); for(let a = 0; a < n; a++) for(let b = 0; b < n; b++){ g.fillStyle = C[(a*n + b + sp) % 6]; g.fillRect(o + a*q + .5, o + b*q + .5, q - 1, q - 1); } }
  else if(k === 'pyr'){ for(let r = 0; r < 3; r++) for(let c = 0; c <= r*2; c++){ const up = c % 2 === 0, cx = -r*3.5 + c*3.5, cy = -8 + r*6; g.fillStyle = C[(r + c + sp) % 6]; g.beginPath(); if(up){ g.moveTo(cx, cy); g.lineTo(cx - 3.2, cy + 5.6); g.lineTo(cx + 3.2, cy + 5.6); } else { g.moveTo(cx - 3.2, cy); g.lineTo(cx + 3.2, cy); g.lineTo(cx, cy + 5.6); } g.closePath(); g.fill(); } }
  else if(k === 'dod'){ g.rotate(t*.8); for(let j = 0; j < 5; j++){ const a = j/5*6.283; g.fillStyle = C[(j + sp) % 6]; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a)*9, Math.sin(a)*9); g.lineTo(Math.cos(a + 1.2566)*9, Math.sin(a + 1.2566)*9); g.closePath(); g.fill(); } g.fillStyle = '#111'; g.fillRect(-1.5, -1.5, 3, 3); }
  else { g.rotate(t*3); for(let j = 0; j < 6; j++){ g.fillStyle = C[j]; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 9, j*1.047, (j + 1)*1.047); g.closePath(); g.fill(); } g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 2.5, 0, 7); g.fill(); }
  g.restore();
}
// ---------- chổi (shop + mini game bay chổi) ----------
function v51aBroomCol(b, i, t){ return b === 'rainbow' ? V51A_RUBIK[(i + Math.floor((t || performance.now()/1000)*8)) % 6] : b; }
function v51aDrawBroom(g, i, x, y, s, t){
  const B = V51A_BROOMS[i] || V51A_BROOMS[0]; g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = B.st; g.fillRect(-20, -1, 34, 3); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(-20, -1, 34, 1);
  for(let k = 0; k < 5; k++){ g.fillStyle = v51aBroomCol(B.br, k, t); g.beginPath(); g.moveTo(-20, -3 + k*1.4); g.lineTo(-33, -6 + k*3.2); g.lineTo(-33, -4 + k*3.2); g.lineTo(-20, -2 + k*1.4); g.fill(); }
  g.fillStyle = B.br === 'rainbow' ? '#ffd23f' : '#5a3a22'; g.fillRect(-21, -4, 3, 9); g.restore();
}
function v51aCanvas(w, h, fn){ const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; try { fn(g); } catch(e){} return c; }
