// ================= v68m · 1/4 TTTM: QUẦY CẦN CÂU · XE ĐẠP · THUYỀN DU LỊCH (dữ liệu, mua, dùng, đồ quý) =================
// Mua bằng tiền trong game (PROF.money), không có tiền thật. Đồ mua nằm trong PROF.inv như cửa hàng cũ (ITEM/has/equip),
// đồ quý câu được nằm ở PROF.v68m.treas. Mọi tên toàn cục có tiền tố v68m / V68M. Chỉ bọc (gán lại) hàm cũ.
const V68M_PHI = 1.618;
// ---------- cần câu: k = kiểu hiệu ứng (xem V68M_FX) ----------
const V68M_RODS = [
  {id:'v68r1', k:'basic', n:'Cần câu tre Xanh Lá', price:20, t:1.1, col:'#7cb342', d:'Cần câu thường, nhẹ tay, giá rẻ cho bạn mới tập câu.'},
  {id:'v68r2', k:'quick', n:'Cần câu "Câu Là Dính"', price:110, t:1.3, col:'#ff7043', d:'Mồi thơm đặc biệt: vừa thả xuống là cá cắn câu liền, không phải chờ.'},
  {id:'v68r3', k:'luck', n:'Cần câu May Mắn Cỏ Bốn Lá', price:170, t:1.3, col:'#43a047', d:'Tăng mạnh tỉ lệ gặp cá hiếm, cá quý và cá vàng.'},
  {id:'v68r4', k:'strong', n:'Cần câu Titan Siêu Mạnh', price:240, t:2.8, col:'#546e7a', d:'Dây siêu bền không bao giờ đứt, kéo cá to nhẹ như không.'},
  {id:'v68r5', k:'pretty', n:'Cần câu Cầu Vồng Lấp Lánh', price:320, t:1.6, col:'#ec407a', d:'Thân cần bảy màu lấp lánh. Chủ yếu để đẹp, nhỉnh hơn chút: may mắn hơn, kéo nhanh hơn.'},
  {id:'v68r6', k:'treasure', n:'Cần câu Kho Báu Đại Dương', price:450, t:1.8, col:'#ffb300', d:'Thỉnh thoảng câu được đồ quý: rương, ngọc trai, đồng xu cổ, vỏ sò hiếm. Đồ quý bán được.'}
];
// hiệu ứng thật trong mini game câu cá: quick = cắn ngay · luck = tỉ lệ đổi sang cá hiếm · strong = dây không đứt · pull = kéo nhanh · treas = tỉ lệ đồ quý
const V68M_FX = {basic:{}, quick:{quick:1}, luck:{luck:.6}, strong:{strong:1, pull:1.25}, pretty:{luck:.18, pull:1.15, shine:1}, treasure:{treas:.35}};
// chỉ số hiện trên thẻ (0..5)
const V68M_RODST = {basic:[1, 1, 1, 0], quick:[5, 1, 2, 0], luck:[2, 5, 2, 0], strong:[2, 1, 5, 0], pretty:[2, 2, 3, 0], treasure:[2, 2, 3, 5]};
// ---------- xe đạp: s = tốc độ thật khi đạp (bikeSpeed) ----------
const V68M_BIKES = [
  {id:'v68b1', design:'v68bal', n:'Xe chòi chân Gấu Con', price:25, s:110, col:'#ff8a65', d:'Xe tập đi không bàn đạp, bé đẩy chân để tập thăng bằng. Chậm nhất, an toàn nhất.'},
  {id:'v68b2', design:'tricycle', n:'Xe ba bánh Ong Vàng', price:50, s:150, col:'#ffca28', d:'Ba bánh vững vàng, có thùng nhỏ phía sau. Đi chậm rãi quanh sân.'},
  {id:'v68b3', design:'cruiser', n:'Xe dạo phố Hoa Anh Đào', price:150, s:245, col:'#f48fb1', d:'Khung cong mềm mại, ngồi thẳng lưng, dạo phố thong thả.'},
  {id:'v68b4', design:'road', n:'Xe touring Đường Dài', price:300, s:315, col:'#5c6bc0', d:'Đi xa không mỏi, chạy đều trên đường nhựa.'},
  {id:'v68b5', design:'mtb', n:'Xe địa hình Sấm Sét', price:560, s:385, col:'#43a047', d:'Phuộc nhún, lốp gai, leo dốc băng đồi nhanh.'},
  {id:'v68b6', design:'v68aero', n:'Xe đua Tia Chớp', price:1200, s:500, col:'#e53935', d:'Khung khí động học, bánh đặc. Tốc độ tối đa: nhanh nhất cả thành phố!'}
];
const V68M_SMAX = 500;
// ---------- phụ kiện xe mới (tự gắn khi có; bấm Tháo/Gắn trong quầy) ----------
const V68M_ACCS = [
  {id:'v68a_sticker', n:'Bộ sticker Rubik', price:12, d:'Dán khối Rubik nhỏ lên khung xe.'},
  {id:'v68a_bottle', n:'Bình nước thể thao', price:15, d:'Gắn ở khung xe. Đạp xe nhớ uống nước nhé!'},
  {id:'v68a_bell', n:'Chuông vàng hai tầng', price:18, d:'Chuông bóng loáng, kêu "kính coong" vui tai.'},
  {id:'v68a_mirror', n:'Gương chiếu hậu', price:20, d:'Nhìn thấy xe phía sau, đi đường an toàn hơn.'},
  {id:'v68a_basket', n:'Giỏ trước cắm hoa', price:28, d:'Giỏ mây có bó hoa nhỏ xinh.'},
  {id:'v68a_flag', n:'Cờ đuôi cầu vồng', price:45, d:'Cột cờ cao bảy màu, xe khác dễ nhìn thấy bạn.'},
  {id:'v68a_led', n:'Dải đèn LED bảy màu', price:70, d:'Đèn chạy dọc khung xe, sáng rực ban đêm.'},
  {id:'v68a_gel', n:'Yên gel siêu êm', price:95, d:'Đệm gel mềm mại: đạp lâu không mỏi (+15 tốc độ).'},
  {id:'v68a_wheel', n:'Bánh xe sao lấp lánh', price:120, d:'Những ngôi sao nhỏ xoay quanh bánh xe khi đạp.'}
];
// ---------- thuyền: zone = vùng biển đi tới, tour = số đảo trong hành trình tự chạy ----------
const V68M_BOATS = [
  {id:'v68t1', v68b:'tour', n:'Thuyền du lịch Hoa Sen', price:280, s:240, zone:3, col:'#ff9800', seats:3, tour:2, d:'Mái che mát mẻ, chở 3 bạn ngồi cùng, chạy êm. Có hành trình "Dạo vịnh" tự chạy tới 2 đảo gần rồi về.'},
  {id:'v68t2', v68b:'far', n:'Tàu du lịch biển xa Hải Âu', price:950, s:470, zone:5, col:'#1e88e5', seats:2, tour:5, d:'Chạy nhanh, ra tới biển khơi xa nhất. Có hành trình "Du lịch biển" tự chạy qua 5 đảo xa rồi về bến.'}
];
// ---------- đồ quý câu được (phần thưởng cố định theo xác suất, KHÔNG bán hộp may rủi) ----------
const V68M_TREAS = [
  {id:'chest', n:'Rương kho báu', ic:'🧰', w:1, sell:0, open:30, f:'Ngày xưa tàu buôn chở hàng qua biển, đôi khi rương bị chìm xuống đáy.'},
  {id:'pearl', n:'Ngọc trai', ic:'🦪', w:2, sell:25, f:'Ngọc trai hình thành khi một hạt cát lọt vào con trai, trai tiết xà cừ bọc lại nhiều năm.'},
  {id:'coin', n:'Đồng xu cổ', ic:'🪙', w:3, sell:15, f:'Đồng xu cổ giúp nhà khảo cổ biết người xưa buôn bán thế nào.'},
  {id:'shell', n:'Vỏ sò cầu vồng', ic:'🐚', w:3, sell:12, f:'Vỏ sò làm từ canxi, lớp xà cừ bên trong phản chiếu ánh sáng thành bảy màu.'},
  {id:'star', n:'Sao biển vàng', ic:'⭐', w:2, sell:18, f:'Sao biển có thể mọc lại cánh bị mất. (Bạn chụp ảnh rồi giữ làm kỷ niệm nhé.)'}
];
const V68M = {tour:null, ui:null, btn:null, msg:{}, fl3:0};
// ---------- đưa hàng vào danh mục chung (để has/equip/ITEM và cửa hàng cũ đều dùng được) ----------
V68M_RODS.forEach(r => { r.cat = 'rod'; r.lvl = 1; r.v68 = 1; });
V68M_BIKES.forEach(b => { b.cat = 'bike'; b.lvl = 1; b.v68 = 1; });
V68M_ACCS.forEach(a => { a.cat = 'bacc'; a.lvl = 1; a.v68 = 1; });
V68M_BOATS.forEach(b => { b.cat = 'boat'; b.lvl = 1; b.v68 = 1; });
[...V68M_RODS, ...V68M_BIKES, ...V68M_ACCS, ...V68M_BOATS].forEach(it => { if(!ITEM[it.id]){ SHOP.push(it); ITEM[it.id] = it; } });

// ---------- hồ sơ ----------
function v68mDb(){ if(!PROF) return {treas:{}, off:{}, tours:0}; const o = PROF.v68m = PROF.v68m || {}; o.treas = o.treas || {}; o.off = o.off || {}; o.tours = o.tours || 0; return o; }
function v68mSave(){ try { saveProfile(); renderProfHud(); } catch(e){} }
function v68mOff(id){ return !!(PROF && PROF.v68m && PROF.v68m.off && PROF.v68m.off[id]); }
function v68mAccOn(id){ return has(id) && !v68mOff(id); }
function v68mEsc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]); }
// cần câu đang dùng → bảng hiệu ứng (null nếu là cần câu cũ / chưa có)
function v68mRod(){ const id = PROF && PROF.equip && PROF.equip.rod, it = id && ITEM[id]; return it && it.v68 && V68M_FX[it.k] ? Object.assign({k:it.k, it}, V68M_FX[it.k]) : null; }
// ---------- mua / dùng ----------
function v68mBuy(id){
  const it = ITEM[id]; if(!it) return false; if(!PROF){ try { openLogin(); } catch(e){} return false; }
  if(has(id)){ v68mUse(id); return true; }
  if(PROF.money < it.price){ toast(`💸 ${it.n} giá $${it.price}. Bạn còn $${PROF.money}, chơi mini game kiếm thêm nhé!`); return false; }
  PROF.money -= it.price; PROF.inv[id] = Date.now(); try { v16Bought(it); } catch(e){}
  const slot = equipSlot(it); if(slot) PROF.equip[slot] = id;
  try { afterEquip(); } catch(e){} v68mSave();
  toast(`🎉 Đã mua ${it.n}!` + (it.cat === 'bike' ? ' Bấm 🚲 Đạp xe để chạy thử.' : it.cat === 'boat' ? ' Ra bến, lên thuyền để lái.' : it.cat === 'rod' ? ' Cần câu mới đã cầm trên tay.' : ' Đã gắn lên xe.'));
  try { blipSfx(1320); floatText(`-$${it.price}`, '#ef4b4b'); } catch(e){} try { mprog('shop'); } catch(e){} try { log('event', `${PROF.name} mua ${it.n} ở TTTM Cầu Vồng.`); } catch(e){}
  return true;
}
function v68mUse(id){
  const it = ITEM[id]; if(!it || !PROF || !has(id)) return;
  if(it.cat === 'bacc'){ const o = v68mDb(); o.off[id] = !o.off[id]; if(!o.off[id]) delete o.off[id]; toast(o.off[id] ? `🔧 Đã tháo ${it.n}.` : `🔧 Đã gắn ${it.n} lên xe.`); v68mSave(); return; }
  const slot = equipSlot(it); if(!slot) return; const on = PROF.equip[slot] === id; PROF.equip[slot] = on ? null : id;
  try { afterEquip(); } catch(e){} v68mSave(); toast(on ? `Đã cất ${it.n}.` : `✅ Đang dùng ${it.n}.`);
}
// ---------- đồ quý ----------
function v68mTreasRoll(){ let t = 0; V68M_TREAS.forEach(x => t += x.w); let r = Math.random()*t; for(const x of V68M_TREAS){ r -= x.w; if(r <= 0) return x; } return V68M_TREAS[1]; }
function v68mTreasGot(){ if(!PROF) return null; const x = v68mTreasRoll(), o = v68mDb(); o.treas[x.id] = (o.treas[x.id] || 0) + 1; v68mSave();
  try { toast(`🎁 Kho báu! Bạn câu được ${x.ic} ${x.n}. ${x.f}`); cheerSfx(); } catch(e){} try { mprog('treasure'); } catch(e){} return x; }
function v68mTreasSell(id){ const x = V68M_TREAS.find(t => t.id === id), o = v68mDb(); if(!x || !o.treas[id]) return; o.treas[id]--;
  if(x.open){ PROF.money += x.open; o.treas.pearl = (o.treas.pearl || 0) + 1; toast(`🧰 Mở rương: có $${x.open} và 1 🦪 ngọc trai!`); }
  else { PROF.money += x.sell; toast(`💰 Bán ${x.n} được $${x.sell}.`); }
  if(!o.treas[id]) delete o.treas[id]; try { blipSfx(1500); } catch(e){} v68mSave(); }
