// ================= EXT7: ACCOUNTS, PLAYER, LEVELS, SHOP =================
var PLAYER = null, PROF = null, ACC_NAME = null, CLOUD = {db:null, user:null, uid:null, tried:false};
const ACC_KEY = 'truong-accounts-v1';
const needExp = L => Math.round(100*Math.pow(L, 1.75));
function accLoad(){ try { return JSON.parse(localStorage.getItem(ACC_KEY) || '{}') || {}; } catch(e){ return {}; } }
function accSaveAll(a){ try { localStorage.setItem(ACC_KEY, JSON.stringify(a)); } catch(e){} }
const hex = b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
async function passHash(pass, salt){
  try {
    if(window.crypto && crypto.subtle){
      const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits']);
      return 'p2:' + hex(await crypto.subtle.deriveBits({name:'PBKDF2', salt:new TextEncoder().encode(salt), iterations:120000, hash:'SHA-256'}, k, 256));
    }
  } catch(e){}
  let h1 = 0x811c9dc5, h2 = 0x1234567; const s = salt + '|' + pass; for(let r=0;r<5000;r++) for(let i=0;i<s.length;i++){ h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619) >>> 0; h2 = Math.imul(h2 ^ (h1 >>> 7), 2246822519) >>> 0; }
  return 'f1:' + h1.toString(16) + h2.toString(16);
}
const newSalt = () => { const a = new Uint8Array(12); (window.crypto || {getRandomValues:x => x.map(() => Math.random()*256|0)}).getRandomValues(a); return hex(a); };
function newProfile(name, look){ return {name, look, level:1, exp:0, money:30, inv:{bike1:Date.now()}, equip:{bike:'bike1'}, books:{}, fish:{}, stats:{games:0, catches:0, read:0, medals:0}, created:Date.now(), cdo:{}}; }
async function cloudInit(){
  if(CLOUD.tried) return CLOUD.db; CLOUD.tried = true;
  try { if(!window.claude || !claude.use) return null; const [db, user] = await Promise.all([claude.use('db'), claude.use('user')]); if(!db || !user) return null; CLOUD.db = db; CLOUD.user = user; CLOUD.uid = await user.id(); } catch(e){ CLOUD.db = null; }
  return CLOUD.db;
}
async function cloudGetAccount(name){ const db = await cloudInit(); if(!db || !CLOUD.uid) return null; try { const s = await db.doc(`data/users/${CLOUD.uid}/acc-${name.toLowerCase()}`).get(); return s.exists ? s.data() : null; } catch(e){ return null; } }
var cloudT = null;
function saveProfile(){
  if(!PROF || !ACC_NAME) return;
  const all = accLoad(); if(all.users && all.users[ACC_NAME]){ all.users[ACC_NAME].profile = PROF; all.last = ACC_NAME; accSaveAll(all); }
  clearTimeout(cloudT); cloudT = setTimeout(async () => {
    const db = await cloudInit(); if(!db || !CLOUD.uid) return; const u = accLoad().users[ACC_NAME]; if(!u) return;
    try { await db.doc(`data/users/${CLOUD.uid}/acc-${ACC_NAME.toLowerCase()}`).set({salt:u.salt, hash:u.hash, profile:JSON.stringify(PROF), at:Date.now()}); } catch(e){}
    try { await db.doc(`board/${CLOUD.uid}`).set({u:PROF.name, lvl:PROF.level, exp:PROF.exp, tot:totalExp(), money:PROF.money, look:JSON.stringify(PROF.look).slice(0, 600), at:Date.now()}); } catch(e){}
  }, 2500);
}
const totalExp = () => { let t = PROF.exp; for(let l=1;l<PROF.level;l++) t += needExp(l); return t; };
async function doRegister(name, pass){
  name = name.trim(); if(!/^[\p{L}\p{N}_.\- ]{3,20}$/u.test(name)) return 'Tên đăng nhập cần 3–20 ký tự (chữ, số, dấu cách, _ . -).';
  if(pass.length < 4) return 'Mật khẩu cần ít nhất 4 ký tự.';
  const all = accLoad(); all.users = all.users || {};
  if(all.users[name] || await cloudGetAccount(name)) return 'Tên này đã có người dùng trên máy này. Hãy chọn tên khác hoặc đăng nhập.';
  const salt = newSalt(); all.users[name] = {salt, hash:await passHash(pass, salt), profile:null}; all.last = name; accSaveAll(all);
  ACC_NAME = name; return null;
}
async function doLogin(name, pass){
  name = name.trim(); const all = accLoad(); all.users = all.users || {};
  let u = all.users[name];
  if(!u){ const c = await cloudGetAccount(name); if(c){ u = {salt:c.salt, hash:c.hash, profile:JSON.parse(c.profile || 'null')}; all.users[name] = u; } }
  if(!u) return 'Không tìm thấy tài khoản này. Hãy bấm "Tạo tài khoản mới".';
  if(await passHash(pass, u.salt) !== u.hash) return 'Sai mật khẩu.';
  all.last = name; accSaveAll(all); ACC_NAME = name;
  if(u.profile){ PROF = Object.assign(newProfile(name, u.profile.look), u.profile); enterGame(); } else openCreator();
  return null;
}
function logout(){ saveProfile(); if(PLAYER){ extUncontrol(PLAYER); PLAYER.controlled = false; PLAYER.visible = false; } PROF = null; ACC_NAME = null; PLAYER = null; renderProfHud(); openLogin(); }

// ---------- character styles ----------
const HAIRSTYLES = [['short','Ngắn gọn'],['long','Dài thẳng'],['pony','Buộc đuôi ngựa'],['bun','Búi tóc'],['spiky','Dựng ngầu'],['afro','Xoăn bồng'],['twin','Hai bím'],['bob','Tóc bob']];
const HAIRCOLS = ['#1a1a1a','#3a2418','#6d4c2e','#c58c4a','#e8c46a','#b0b0b0','#d84315','#5e35b1','#26a69a','#ec407a'];
const SKINCOLS = ['#f5d1ad','#f2c9a0','#eab98c','#e5b183','#c98e60','#9c6644','#6f4a33'];
const SHIRTCOLS = ['#f7f7f7','#ef4b4b','#3d7bff','#2fbf71','#ffd23f','#b06bff','#ff8a2b','#26c6da','#222222','#ff6f91'];
const PANTCOLS = ['#24356b','#222222','#5a3a1e','#455a64','#7b1fa2','#c62828','#e0e0e0','#2e7d32'];
const PRESETS = [
  {n:'Học sinh gương mẫu', look:{skin:0, hs:'short', hc:0, shirt:'#f7f7f7', pants:'#24356b', outfit:'school'}},
  {n:'Vận động viên', look:{skin:2, hs:'spiky', hc:1, shirt:'#ef4b4b', pants:'#222222', outfit:'jersey', hat:'band'}},
  {n:'Nghệ sĩ tự do', look:{skin:1, hs:'bob', hc:9, shirt:'#ffd23f', pants:'#455a64', outfit:'artist', hat:'beret'}},
  {n:'Mọt sách thông thái', look:{skin:0, hs:'short', hc:2, shirt:'#2fbf71', pants:'#5a3a1e', outfit:'cardigan', glasses:true}},
  {n:'Cô nàng năng động', look:{skin:1, hs:'pony', hc:3, shirt:'#ff6f91', pants:'#24356b', outfit:'hoodie', skirt:true}},
  {n:'Hip-hop đường phố', look:{skin:4, hs:'afro', hc:0, shirt:'#222222', pants:'#455a64', outfit:'hoodie', hat:'cap'}},
  {n:'Nhà thám hiểm', look:{skin:3, hs:'short', hc:1, shirt:'#c58c4a', pants:'#5a3a1e', outfit:'explorer', hat:'safari'}},
  {n:'Cô bé hai bím', look:{skin:0, hs:'twin', hc:4, shirt:'#b06bff', pants:'#7b1fa2', outfit:'school', skirt:true}},
  {n:'Lập trình viên nhí', look:{skin:5, hs:'bun', hc:0, shirt:'#26c6da', pants:'#222222', outfit:'hoodie', glasses:true, hat:'phones'}},
  {n:'Kỳ thủ cờ vua', look:{skin:2, hs:'short', hc:0, shirt:'#222222', pants:'#222222', outfit:'chess'}},
  {n:'Nhà vô địch Rubik', look:{skin:1, hs:'spiky', hc:6, shirt:'#3d7bff', pants:'#24356b', outfit:'rubik'}},
  {n:'Ninja áo đen', look:{skin:3, hs:'short', hc:0, shirt:'#222222', pants:'#222222', outfit:'ninja', hat:'ninja'}}
];
function applyLook(a, L){
  a.skin = SKINCOLS[L.skin] || SKINCOLS[0]; a.hair = HAIRCOLS[L.hc] || HAIRCOLS[0]; a.long = ['long','twin','pony'].includes(L.hs);
  a.shirt = L.shirt; a.pants = L.pants; a.skirt = !!L.skirt; a.glasses = !!L.glasses; a.cap = L.hat === 'cap' ? L.shirt : null; a.brim = null;
  a.style = L; a.student = false; a.bag = L.shirt;
}
function lookWithEquip(){ const L = Object.assign({}, PROF.look), E = PROF.equip, G = id => id ? (ITEM[id] || (typeof mallEquip === 'function' ? mallEquip(id) : null)) : null; const of = G(E.outfit); if(of){ L.outfit = of.o; if(of.c) L.shirt = of.c; if(of.p) L.pants = of.p; if(of.skirt != null) L.skirt = of.skirt; } const hat = G(E.hat); if(hat){ L.hat = hat.o; L.hatC = hat.col || null; } L.accC = {}; L.acc = ['neck','ear','wrist','back','aura','face'].map(k => { const it = G(E[k]); if(it && it.col) L.accC[it.o] = it.col; return it && it.o; }).filter(Boolean); return L; }
function drawStyle(a, by){
  const L = a.style; if(!L) return;
  const d = a.dir > 0 ? 1 : -1, sh = L.shirt;
  const o = L.outfit;
  if(o === 'hoodie'){ rect('rgba(0,0,0,.18)', -4, -14 + by, 8, 3); rect(sh, -7, -23 + by, 14, 3); rect('#fff', -1, -19 + by, 1, 5); }
  else if(o === 'jersey'){ rect('#fff', -6, -21 + by, 12, 2); ctx.fillStyle = '#fff'; ctx.font = '7px monospace'; ctx.fillText('10', -4, -12 + by); }
  else if(o === 'artist'){ rect('#ef4b4b', -1, -21 + by, 2, 4); rect('#3d7bff', -6, -12 + by, 12, 2); }
  else if(o === 'cardigan'){ rect('#6d4c2e', -6, -21 + by, 3, 12); rect('#6d4c2e', 3, -21 + by, 3, 12); rect('#ffd23f', -2, -17 + by, 1, 1); rect('#ffd23f', -2, -14 + by, 1, 1); }
  else if(o === 'explorer'){ rect('#5a3a1e', -6, -16 + by, 12, 2); rect('#8d6e4a', d*2, -20 + by, 3, 3); }
  else if(o === 'chess'){ for(let i=0;i<3;i++) for(let j=0;j<3;j++) if((i + j)%2) rect('#f4f4f4', -6 + i*4, -21 + j*4 + by, 4, 4); }
  else if(o === 'rubik'){ const c = ['#ef4b4b','#ffd23f','#3d7bff','#2fbf71','#ff8a2b','#fff']; for(let i=0;i<3;i++) for(let j=0;j<3;j++) rect(c[(i*3 + j) % 6], -6 + i*4, -21 + j*4 + by, 4, 4); }
  else if(o === 'ninja'){ rect('#c62828', -6, -13 + by, 12, 2); }
  else if(o === 'jacket'){ rect('#1565c0', -6, -21 + by, 12, 12); rect('#fff', -1, -21 + by, 2, 12); rect('#0d47a1', -6, -21 + by, 2, 12); }
  else if(o === 'suit'){ rect('#1d1d2b', -6, -21 + by, 12, 12); rect('#fff', -2, -21 + by, 4, 6); rect('#c62828', -1, -20 + by, 2, 6); rect('#1d1d2b', -5, -10, 4, 8); rect('#1d1d2b', 1, -10, 4, 8); }
  else if(o === 'princess'){ ctx.fillStyle = sh; ctx.beginPath(); ctx.moveTo(-5, -14 + by); ctx.lineTo(5, -14 + by); ctx.lineTo(10, -1); ctx.lineTo(-10, -1); ctx.closePath(); ctx.fill(); for(let i=0;i<5;i++) rect('#fff59d', -8 + i*4, -4 - (i%2)*4, 1, 1); rect('#fff59d', -6, -15 + by, 12, 1); }
  else if(o === 'wizard'){ ctx.fillStyle = sh; ctx.beginPath(); ctx.moveTo(-6, -21 + by); ctx.lineTo(6, -21 + by); ctx.lineTo(9, 0); ctx.lineTo(-9, 0); ctx.closePath(); ctx.fill(); rect('#ffd23f', -4, -12 + by, 1, 1); rect('#ffd23f', 3, -7, 1, 1); rect('#ffd23f', -2, -4, 1, 1); rect('#ffd23f', 5, -16 + by, 1, 1); }
  else if(o === 'knight'){ rect('#b0bec5', -7, -22 + by, 14, 13); rect('#eceff1', -7, -22 + by, 14, 2); rect('#90a4ae', -1, -20 + by, 2, 10); rect('#78909c', -5, -10, 4, 8); rect('#78909c', 1, -10, 4, 8); }
  else if(o === 'astro'){ rect('#eceff1', -7, -22 + by, 14, 13); rect('#ef4b4b', -3, -18 + by, 6, 3); rect('#eceff1', -5, -10, 4, 8); rect('#eceff1', 1, -10, 4, 8); }
  else if(o === 'royal'){ rect('#6a1b9a', -7, -22 + by, 14, 14); rect('#ffd23f', -7, -22 + by, 14, 2); rect('#ffd23f', -1, -20 + by, 2, 12); rect('#fff', -7, -9, 14, 2); for(let i=0;i<4;i++) rect('#222', -6 + i*4, -8, 1, 1); }
  else if(o === 'chef'){ rect('#fafafa', -6, -21 + by, 12, 12); rect('#bdbdbd', -1, -19 + by, 1, 1); rect('#bdbdbd', -1, -15 + by, 1, 1); }
  const hs = L.hs, hc = a.hair;
  if(hs === 'pony'){ rect(hc, d > 0 ? -9 : 7, -31 + by, 3, 9); rect(hc, d > 0 ? -10 : 8, -24 + by, 3, 4); }
  else if(hs === 'bun'){ rect(hc, -3, -37 + by, 6, 4); }
  else if(hs === 'spiky'){ for(let i=0;i<4;i++) tri(-6 + i*3.5, -32 + by, -3 + i*3.5, -32 + by, -4.5 + i*3.5, -37 + by, hc); }
  else if(hs === 'afro'){ circ(0, -32 + by, 9, hc); rect(a.skin, -5, -31 + by, 10, 8); rect('#1a1a1a', d > 0 ? 0 : -3, -27 + by, 2, 2); rect('#1a1a1a', d > 0 ? 3 : 0, -27 + by, 2, 2); }
  else if(hs === 'twin'){ rect(hc, -9, -29 + by, 3, 10); rect(hc, 6, -29 + by, 3, 10); rect('#ef4b4b', -9, -24 + by, 3, 2); rect('#ef4b4b', 6, -24 + by, 3, 2); }
  else if(hs === 'bob'){ rect(hc, -7, -33 + by, 14, 5); rect(hc, -7, -30 + by, 3, 7); rect(hc, 4, -30 + by, 3, 7); }
  const h = L.hat;
  if(h === 'band') rect('#fff', -6, -32 + by, 12, 2);
  else if(h === 'beret'){ rect('#c62828', -7, -36 + by, 12, 4); rect('#c62828', -2, -38 + by, 2, 2); }
  else if(h === 'safari'){ rect('#c8a26a', -9, -33 + by, 18, 2); rect('#c8a26a', -5, -38 + by, 10, 5); }
  else if(h === 'phones'){ rect('#222', -7, -35 + by, 14, 2); rect('#ef4b4b', -8, -30 + by, 3, 5); rect('#ef4b4b', 5, -30 + by, 3, 5); }
  else if(h === 'ninja'){ rect('#222', -6, -34 + by, 12, 5); rect('#222', -5, -25 + by, 10, 4); rect('#c62828', d > 0 ? -9 : 6, -33 + by, 3, 2); }
  else if(h === 'beanie'){ rect('#3d7bff', -6, -37 + by, 12, 6); rect('#fff', -1, -39 + by, 2, 2); }
  else if(h === 'wizard'){ tri(-8, -33 + by, 8, -33 + by, 2*d, -50 + by, '#5e35b1'); rect('#ffd23f', -1, -42 + by, 2, 2); }
  else if(h === 'crown'){ const cc = L.hatC || '#ffd23f'; rect(cc, -6, -37 + by, 12, 4); tri(-6, -37 + by, -2, -37 + by, -4, -41 + by, cc); tri(-2, -37 + by, 2, -37 + by, 0, -42 + by, cc); tri(2, -37 + by, 6, -37 + by, 4, -41 + by, cc); rect('#e53935', -1, -36 + by, 2, 2); rect('#1e88e5', -5, -36 + by, 2, 2); rect('#43a047', 3, -36 + by, 2, 2); }
  else if(h === 'tophat'){ rect('#111', -8, -34 + by, 16, 2); rect('#111', -5, -44 + by, 10, 10); rect('#c62828', -5, -37 + by, 10, 2); }
  else if(h === 'flower'){ ['#ff6f91','#ffd23f','#fff','#b06bff'].forEach((c, i) => circ(-5 + i*3.3, -34 + by, 2, c)); }
  else if(h === 'helmet'){ ctx.fillStyle = 'rgba(200,230,255,.55)'; ctx.beginPath(); ctx.arc(0, -27 + by, 9, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#eceff1'; ctx.lineWidth = 2; ctx.stroke(); }
  else if(h === 'chef'){ rect('#fafafa', -5, -42 + by, 10, 9); circ(-3, -42 + by, 3, '#fafafa'); circ(3, -42 + by, 3, '#fafafa'); }
  const AC2 = k => (L.accC && L.accC[k]) || null;
  (L.acc || []).forEach(k => {
    if(k === 'sunglass'){ const sc = AC2(k) || '#111'; rect(sc, -6, -29 + by, 5, 1); rect(sc, 1, -29 + by, 5, 1); rect('#111', -5, -28 + by, 4, 3); rect('#111', 1, -28 + by, 4, 3); rect('#111', -1, -28 + by, 2, 1); }
    else if(k === 'necklace'){ rect(AC2(k) || '#cfd8dc', -4, -21 + by, 8, 1); rect(AC2(k) || '#cfd8dc', -1, -20 + by, 2, 2); }
    else if(k === 'goldnecklace'){ const gc = AC2(k) || '#ffd23f'; rect(L.accC && L.accC[k] ? '#ffd23f' : gc, -5, -21 + by, 10, 1); rect(gc, -2, -20 + by, 4, 4); rect('#fff', -1, -20 + by, 1, 1); }
    else if(k === 'earring'){ rect(AC2(k) || '#80deea', -6, -25 + by, 2, 2); rect(AC2(k) || '#80deea', 5, -25 + by, 2, 2); }
    else if(k === 'watch'){ rect(AC2(k) || '#ffd23f', d > 0 ? 6 : -8, -14 + by, 2, 3); }
    else if(k === 'cape'){ rect('#c62828', d > 0 ? -8 : 6, -21 + by, 2, 18); }
    else if(k === 'wings'){ ctx.fillStyle = 'rgba(255,255,255,.9)'; const f = Math.sin(realT*6)*2; ctx.beginPath(); ctx.ellipse(-10, -20 + by - f, 6, 3, -.5, 0, Math.PI*2); ctx.ellipse(10, -20 + by - f, 6, 3, .5, 0, Math.PI*2); ctx.fill(); }
    else if(k === 'aura'){ for(let i=0;i<5;i++){ const an = realT*2 + i*1.26; circ(Math.cos(an)*12, -18 + by + Math.sin(an)*14, 1.4, i % 2 ? '#ffd23f' : '#fff59d'); } }
    else if(k === 'star'){ ctx.fillStyle = '#ffd23f'; ctx.font = '8px monospace'; ctx.fillText('★', -3, -40 + by + Math.sin(realT*3)*2); }
  });
}

// ---------- shop catalogue ----------
const SHOP = [
  // bikes: s = speed
  {id:'bike1', cat:'bike', n:'Xe đạp mini', price:40, lvl:1, s:230, col:'#3d7bff', d:'Chiếc xe đầu tiên, đạp khắp trường.'},
  {id:'bike2', cat:'bike', n:'Xe đạp địa hình', price:140, lvl:2, s:270, col:'#2e7d32', d:'Bánh to, leo đồi thông dễ dàng.'},
  {id:'bike3', cat:'bike', n:'Xe đạp đua carbon', price:360, lvl:4, s:330, col:'#c62828', d:'Siêu nhẹ, chạy nhanh nhất phố.'},
  {id:'bike4', cat:'bike', n:'Xe đạp điện', price:700, lvl:6, s:380, col:'#26c6da', d:'Có động cơ trợ lực, đèn LED.'},
  {id:'bike5', cat:'bike', n:'Xe đạp vàng hoàng gia', price:1800, lvl:9, s:420, col:'#ffd23f', d:'Mạ vàng, chỉ dành cho cao thủ.'},
  {id:'bell', cat:'bacc', n:'Chuông kính coong', price:15, lvl:1, d:'Bấm phím B khi đạp để rung chuông.'},
  {id:'basket', cat:'bacc', n:'Giỏ mây phía trước', price:30, lvl:1, d:'Đựng sách và đồ ăn.'},
  {id:'light', cat:'bacc', n:'Đèn pha LED', price:60, lvl:2, d:'Chiếu sáng khi đạp xe ban đêm.'},
  {id:'flag', cat:'bacc', n:'Cờ đuôi phấp phới', price:40, lvl:2, d:'Lá cờ nhỏ bay theo gió.'},
  {id:'seat', cat:'bacc', n:'Yên da cao cấp', price:90, lvl:3, d:'Êm ái, đạp lâu không mỏi (+10 tốc độ).'},
  {id:'glow', cat:'bacc', n:'Vành xe phát sáng', price:160, lvl:4, d:'Bánh xe sáng rực màu cầu vồng.'},
  {id:'carrier', cat:'bacc', n:'Ghế sau chở thú cưng', price:120, lvl:3, d:'Thú cưng ngồi sau xe đi cùng bạn.'},
  {id:'speaker', cat:'bacc', n:'Loa mini', price:140, lvl:5, d:'Phát nhạc khi đạp xe.'},
  {id:'paint', cat:'bacc', n:'Sơn khung thiên hà', price:300, lvl:6, d:'Khung xe lấp lánh như dải ngân hà.'},
  {id:'dog', cat:'pet', n:'Chó con', price:60, lvl:1, d:'Trung thành, chạy theo bạn khắp nơi.'},
  {id:'cat', cat:'pet', n:'Mèo mướp', price:60, lvl:1, d:'Hay meo meo đòi vuốt ve.'},
  {id:'rabbit', cat:'pet', n:'Thỏ trắng', price:100, lvl:2, d:'Nhảy tưng tưng dễ thương.'},
  {id:'parrot', cat:'pet', n:'Vẹt sặc sỡ', price:180, lvl:3, d:'Bay quanh vai bạn.'},
  {id:'fox', cat:'pet', n:'Cáo lửa', price:260, lvl:4, d:'Đuôi đỏ rực rỡ.'},
  {id:'panda', cat:'pet', n:'Gấu trúc', price:480, lvl:6, d:'Lăn tròn rất đáng yêu.'},
  {id:'unicorn', cat:'pet', n:'Kỳ lân con', price:1100, lvl:8, d:'Để lại vệt cầu vồng.'},
  {id:'dragon', cat:'pet', n:'Rồng con', price:2500, lvl:10, d:'Thú cưng huyền thoại, biết phun lửa.'},
  {id:'o_hoodie', cat:'outfit', n:'Áo hoodie', price:30, lvl:1, o:'hoodie', d:'Ấm áp, năng động.'},
  {id:'o_jacket', cat:'outfit', n:'Áo khoác bóng chày', price:60, lvl:2, o:'jacket', d:'Phong cách thể thao Mỹ.'},
  {id:'o_chef', cat:'outfit', n:'Đồ đầu bếp', price:70, lvl:2, o:'chef', c:'#fafafa', p:'#222222', d:'Nướng BBQ chuyên nghiệp.'},
  {id:'o_princess', cat:'outfit', n:'Váy công chúa', price:150, lvl:3, o:'princess', c:'#f48fb1', skirt:true, d:'Váy xòe lấp lánh.'},
  {id:'o_suit', cat:'outfit', n:'Bộ vest lịch lãm', price:240, lvl:4, o:'suit', c:'#1d1d2b', p:'#1d1d2b', d:'Sang trọng như doanh nhân.'},
  {id:'o_wizard', cat:'outfit', n:'Áo choàng pháp sư', price:360, lvl:5, o:'wizard', c:'#4527a0', d:'Lấp lánh ngàn sao.'},
  {id:'o_knight', cat:'outfit', n:'Giáp hiệp sĩ', price:520, lvl:6, o:'knight', c:'#b0bec5', p:'#78909c', d:'Bảo vệ ngôi trường.'},
  {id:'o_astro', cat:'outfit', n:'Đồ phi hành gia', price:700, lvl:7, o:'astro', c:'#eceff1', p:'#eceff1', d:'Sẵn sàng bay lên vũ trụ.'},
  {id:'o_royal', cat:'outfit', n:'Lễ phục hoàng gia', price:1500, lvl:9, o:'royal', c:'#6a1b9a', p:'#4a148c', d:'Bộ đồ đẹp nhất trường.'},
  {id:'h_beanie', cat:'hat', n:'Mũ len', price:20, lvl:1, o:'beanie', d:'Ấm áp mùa đông.'},
  {id:'h_phones', cat:'hat', n:'Tai nghe chụp tai', price:45, lvl:2, o:'phones', d:'Nghe nhạc mọi lúc.'},
  {id:'h_flower', cat:'hat', n:'Vòng hoa', price:50, lvl:2, o:'flower', d:'Hoa tươi Đà Lạt.'},
  {id:'h_tophat', cat:'hat', n:'Mũ chóp cao', price:160, lvl:4, o:'tophat', d:'Quý ông lịch lãm.'},
  {id:'h_wizard', cat:'hat', n:'Mũ phù thủy', price:180, lvl:5, o:'wizard', d:'Đi kèm áo choàng pháp sư.'},
  {id:'h_helmet', cat:'hat', n:'Mũ phi hành gia', price:400, lvl:7, o:'helmet', d:'Kính trong suốt.'},
  {id:'h_crown', cat:'hat', n:'Vương miện đá quý', price:1200, lvl:8, o:'crown', d:'Đính hồng ngọc, lam ngọc, lục bảo.'},
  {id:'j_sun', cat:'face', n:'Kính râm', price:25, lvl:1, o:'sunglass', d:'Ngầu dưới nắng.'},
  {id:'j_watch', cat:'wrist', n:'Đồng hồ vàng', price:80, lvl:2, o:'watch', d:'Đúng giờ vào lớp.'},
  {id:'j_neck', cat:'neck', n:'Vòng cổ bạc', price:100, lvl:3, o:'necklace', d:'Lấp lánh nhẹ nhàng.'},
  {id:'j_ear', cat:'ear', n:'Hoa tai ngọc', price:110, lvl:3, o:'earring', d:'Ngọc xanh biển.'},
  {id:'j_cape', cat:'back', n:'Áo choàng đỏ', price:280, lvl:5, o:'cape', d:'Bay phấp phới như siêu anh hùng.'},
  {id:'j_gold', cat:'neck', n:'Dây chuyền vàng', price:300, lvl:5, o:'goldnecklace', d:'Mặt hồng ngọc.'},
  {id:'j_wings', cat:'back', n:'Đôi cánh thiên thần', price:800, lvl:7, o:'wings', d:'Đập cánh nhè nhẹ.'},
  {id:'j_star', cat:'aura', n:'Ngôi sao hộ mệnh', price:600, lvl:6, o:'star', d:'Ngôi sao bay trên đầu.'},
  {id:'j_aura', cat:'aura', n:'Hào quang huyền thoại', price:3000, lvl:10, o:'aura', d:'Ánh sáng vàng bao quanh.'},
  {id:'boat1', cat:'boat', n:'Thuyền kayak', price:50, lvl:1, s:190, zone:1, col:'#ff8a2b', d:'Chèo ven bờ và rạn san hô gần.'},
  {id:'boat2', cat:'boat', n:'Xuồng máy', price:220, lvl:2, s:280, zone:2, col:'#3d7bff', d:'Ra tới rạn san hô xa.'},
  {id:'boat3', cat:'boat', n:'Ca nô cao tốc', price:560, lvl:4, s:400, zone:3, col:'#ef4b4b', d:'Lướt nhanh ra biển khơi.'},
  {id:'boat4', cat:'boat', n:'Tàu câu cá biển sâu', price:1000, lvl:6, s:320, zone:4, col:'#2e7d32', d:'Đi tới vực thẳm, câu cá khủng.'},
  {id:'boat5', cat:'boat', n:'Du thuyền thám hiểm', price:2600, lvl:9, s:380, zone:5, col:'#fafafa', d:'Đi mọi vùng biển, cả biển băng.'},
  {id:'g_flag', cat:'bgear', n:'Cờ trường trên cột buồm', price:20, lvl:1, d:'Lá cờ Rubik bay trên thuyền.'},
  {id:'g_light', cat:'bgear', n:'Đèn câu đêm', price:90, lvl:2, d:'Cá kéo tới nhiều hơn ban đêm.'},
  {id:'g_sail', cat:'bgear', n:'Buồm cầu vồng', price:120, lvl:3, d:'Cánh buồm 7 màu.'},
  {id:'g_sonar', cat:'bgear', n:'Máy dò cá sonar', price:180, lvl:3, d:'Thấy cá dưới nước khi câu.'},
  {id:'g_fridge', cat:'bgear', n:'Hầm lạnh trữ cá', price:240, lvl:4, d:'Bán cá được thêm 25% tiền.'},
  {id:'g_radar', cat:'bgear', n:'Ra-đa và la bàn', price:300, lvl:5, d:'Hiện vị trí bãi cá trên bản đồ.'},
  {id:'g_crane', cat:'bgear', n:'Tời kéo cá lớn', price:450, lvl:6, d:'Kéo nhanh hơn 30% với cá lớn.'},
  {id:'rod2', cat:'rod', n:'Cần câu carbon', price:90, lvl:2, t:1.3, d:'Chịu lực tốt hơn cần tre.'},
  {id:'rod3', cat:'rod', n:'Cần câu biển sâu', price:450, lvl:5, t:1.7, d:'Cho cá trên 50 kg.'},
  {id:'rod4', cat:'rod', n:'Cần câu huyền thoại', price:1400, lvl:8, t:2.3, d:'Câu được cả quái vật biển sâu.'},
  {id:'lure2', cat:'lure', n:'Mồi tôm tươi', price:35, lvl:1, d:'Cá rạn san hô rất thích.'},
  {id:'lure3', cat:'lure', n:'Mồi giả phát sáng', price:160, lvl:4, d:'Thu hút cá vực thẳm.'},
  {id:'lure4', cat:'lure', n:'Mồi mực khổng lồ', price:320, lvl:6, d:'Dụ cá ngừ, cá kiếm, cá mập.'}
];
const ITEM = {}; SHOP.forEach(i => ITEM[i.id] = i);
const SHOP_TABS = [['bike','Xe đạp'],['chess','Cờ vua'],['bacc','Phụ kiện xe'],['pet','Thú cưng'],['outfit','Quần áo'],['hat','Mũ'],['jewel','Trang sức'],['boat','Thuyền'],['bgear','Đồ trên thuyền'],['fish','Đồ câu cá']];
const tabOf = it => ['face','wrist','neck','ear','back','aura'].includes(it.cat) ? 'jewel' : ['rod','lure'].includes(it.cat) ? 'fish' : it.cat;
const has = id => !!(PROF && PROF.inv[id]);
const equipSlot = it => it.cat === 'bacc' || it.cat === 'bgear' ? null : it.cat;
var shopTab = 'bike';
function openShop(tab){ if(!PROF){ openLogin(); return; } if(tab) shopTab = tab; showModal('mShop'); renderShop(); }
function renderShop(){
  const tabs = $('#shopTabs'); tabs.innerHTML = '';
  SHOP_TABS.forEach(([k, n]) => { const b = el('button', {type:'button'}, n); b.setAttribute('aria-pressed', k === shopTab); b.onclick = () => { shopTab = k; renderShop(); }; tabs.appendChild(b); });
  $('#shopMoney').textContent = `$${PROF.money} · Level ${PROF.level}`;
  const g = $('#shopGrid'); g.innerHTML = '';
  SHOP.filter(it => tabOf(it) === shopTab).forEach(it => {
    const own = has(it.id), lock = PROF.level < it.lvl, slot = equipSlot(it), eq = slot && PROF.equip[slot] === it.id;
    const c = el('div', {className:'scard' + (lock ? ' lock' : '') + (eq ? ' eq' : '')});
    const cv = el('canvas', {width:120, height:90}); c.appendChild(cv); drawItemPreview(cv, it); v16Card(c, cv, it);
    const t = el('div', {className:'sname'}); t.textContent = it.n; c.appendChild(t);
    const d = el('div', {className:'sdesc'}); d.textContent = it.d + (it.s ? ` Tốc độ ${it.s}.` : ''); c.appendChild(d);
    const b = el('button', {type:'button'});
    if(own){ if(slot){ b.textContent = eq ? 'Đang dùng · Tháo ra' : 'Trang bị'; b.onclick = () => { PROF.equip[slot] = eq ? null : it.id; afterEquip(); renderShop(); }; } else { b.textContent = 'Đã có (tự gắn)'; b.disabled = true; } }
    else if(lock){ b.textContent = `Mở khóa ở Level ${it.lvl}`; b.disabled = true; }
    else { b.textContent = `Mua $${it.price}`; b.className = 'primary'; b.disabled = PROF.money < it.price; b.onclick = () => buy(it); }
    c.appendChild(b); g.appendChild(c);
  });
}
function buy(it){
  if(PROF.money < it.price || PROF.level < it.lvl || has(it.id)) return;
  PROF.money -= it.price; PROF.inv[it.id] = Date.now(); v16Bought(it); const slot = equipSlot(it); if(slot) PROF.equip[slot] = it.id;
  floatText(`-$${it.price}`, '#ef4b4b'); toast(`Đã mua ${it.n}!`); blipSfx(1320); log('event', `${PROF.name} mua ${it.n} ở cửa hàng.`); afterEquip(); renderShop(); renderProfHud(); saveProfile(); mprog('shop');
}
function afterEquip(){ if(PLAYER) applyLook(PLAYER, lookWithEquip()); if(PLAYER && PLAYER.cycling && !PROF.equip.bike) PLAYER.cycling = false; spawnPet(); saveProfile(); renderProfHud(); updateExtButtons(); }
function drawItemPreview(cv, it){
  withCtx(cv.getContext('2d'), () => {
    ctx.clearRect(0, 0, 120, 90); const g = ctx.createLinearGradient(0, 0, 0, 90); g.addColorStop(0, '#24305e'); g.addColorStop(1, '#141b3a'); ctx.fillStyle = g; ctx.fillRect(0, 0, 120, 90);
    ctx.save(); ctx.translate(60, 72);
    if(it.cat === 'bike' || it.cat === 'bacc'){ ctx.scale(2.6, 2.6); drawFancyBike(0, 0, it.cat === 'bike' ? it : ITEM.bike2, it.cat === 'bacc' ? [it.id] : [], realT*4); }
    else if(it.cat === 'chess'){ ctx.scale(2.4, 2.4); drawChessSet(it, v16BikeCol(it)); }
    else if(it.cat === 'pet'){ ctx.scale(3, 3); drawPet(it.id, 0, 0, 1, realT*6, false); }
    else if(it.cat === 'boat' || it.cat === 'bgear'){ ctx.scale(1.6, 1.6); drawBoatModel(0, -4, it.cat === 'boat' ? it : ITEM.boat2, it.cat === 'bgear' ? [it.id] : [], 1); }
    else if(it.cat === 'rod' || it.cat === 'lure'){ ctx.strokeStyle = it.cat === 'rod' ? ['#8d6e4a','#37474f','#1565c0','#ffd23f'][['rod2','rod3','rod4'].indexOf(it.id) + 1] : '#ccc'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(40, -50); ctx.stroke(); if(it.cat === 'lure'){ circ(30, -20, 8, it.id === 'lure3' ? '#76ff03' : it.id === 'lure4' ? '#ab47bc' : '#ff8a65'); } }
    else { const f = Object.assign(lookFor(3), {style:Object.assign({}, PROF ? PROF.look : PRESETS[0].look)}); applyLook(f, f.style); if(it.cat === 'outfit'){ f.style.outfit = it.o; if(it.c) f.shirt = it.c; if(it.p) f.pants = it.p; if(it.skirt) f.skirt = true; } else if(it.cat === 'hat') f.style.hat = it.o; else f.style.acc = [it.o]; f.dir = 1; ctx.scale(2.4, 2.4); drawBody(f, false); }
    ctx.restore();
  });
}

// ---------- detailed bike ----------
function drawFancyBike(x, y, bk, accs, spin){
  const col = accs.includes('paint') ? `hsl(${(realT*60) % 360},70%,60%)` : v16BikeCol(bk), glow = accs.includes('glow');
  if(bk.design) v16Frame(x, y, bk, col, spin, glow); else {
  [-8, 8].forEach(wx => { ctx.strokeStyle = glow ? `hsl(${(realT*200 + wx*10) % 360},90%,60%)` : '#222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + wx, y - 5, 5, 0, Math.PI*2); ctx.stroke(); ctx.strokeStyle = '#999'; ctx.lineWidth = .6; for(let k=0;k<4;k++){ const a = spin + k*Math.PI/4; ctx.beginPath(); ctx.moveTo(x + wx + Math.cos(a)*4.5, y - 5 + Math.sin(a)*4.5); ctx.lineTo(x + wx - Math.cos(a)*4.5, y - 5 - Math.sin(a)*4.5); ctx.stroke(); } });
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 8, y - 5); ctx.lineTo(x - 1, y - 12); ctx.lineTo(x + 6, y - 12); ctx.lineTo(x + 8, y - 5); ctx.moveTo(x - 1, y - 12); ctx.lineTo(x, y - 5); ctx.lineTo(x - 8, y - 5); ctx.stroke();
  rect(accs.includes('seat') ? '#6d4c2e' : '#222', x - 4, y - 15, 6, 2); rect('#222', x + 5, y - 16, 2, 4); rect('#333', x + 3, y - 17, 6, 2); }
  if(accs.includes('basket')){ rect('#c8a26a', x + 7, y - 16, 7, 6); rect('#8d6e4a', x + 7, y - 16, 7, 1); }
  if(accs.includes('light')){ rect('#fff59d', x + 9, y - 14, 3, 3); if(SKYST && SKYST.night > .3){ ctx.fillStyle = 'rgba(255,245,157,.25)'; ctx.beginPath(); ctx.moveTo(x + 11, y - 13); ctx.lineTo(x + 50, y - 22); ctx.lineTo(x + 50, y + 4); ctx.closePath(); ctx.fill(); } }
  if(accs.includes('bell')) rect('#ffd23f', x + 4, y - 18, 2, 2);
  if(accs.includes('flag')){ rect('#ddd', x - 9, y - 26, 1, 16); ctx.fillStyle = '#ef4b4b'; ctx.beginPath(); ctx.moveTo(x - 9, y - 26); ctx.lineTo(x - 15, y - 24 + Math.sin(realT*8)); ctx.lineTo(x - 9, y - 22); ctx.fill(); }
  if(accs.includes('carrier')) rect('#5d4037', x - 12, y - 13, 7, 2);
  if(accs.includes('speaker')){ rect('#222', x - 3, y - 10, 4, 3); if(Math.floor(realT*4) % 2) rect('#26c6da', x - 2, y - 12, 1, 1); }
}
const bikeAccs = () => SHOP.filter(i => i.cat === 'bacc' && has(i.id)).map(i => i.id);
function bikeSpeed(){ const b = PROF && PROF.equip.bike && ITEM[PROF.equip.bike]; return (b ? b.s : 230) + (has('seat') ? 10 : 0); }
function drawCyclist(a){
  const bk = ITEM[(PROF && PROF.equip.bike) || 'bike1'], x = Math.round(a.x), y = Math.round(a.y), accs = bikeAccs();
  ctx.save(); ctx.translate(x, y); if(a.dir < 0) ctx.scale(-1, 1);
  drawFancyBike(0, 0, bk, accs, a.walk*1.3);
  if(accs.includes('carrier') && PET && PET.ride){ ctx.save(); ctx.translate(-9, -13); ctx.scale(.8, .8); drawPet(PET.kind, 0, 0, 1, realT*4, false); ctx.restore(); }
  ctx.translate(-1, -8); const was = a.moving, wd = a.dir; a.moving = false; a.dir = 1; drawBody(a, false); a.moving = was; a.dir = wd;
  ctx.restore();
  if(accs.includes('speaker') && a.moving && Math.floor(realT*3) % 2){ ctx.fillStyle = '#ffd23f'; ctx.font = '10px monospace'; ctx.fillText('♪', x - 6, y - 40 - (realT*20 % 10)); }
}
function toggleBike(){
  if(!PLAYER || !PROF){ openLogin(); return; }
  if(!PROF.equip.bike){ toast('Bạn chưa có xe đạp. Vào Cửa hàng mua xe trước nhé!'); openShop('bike'); return; }
  if(PLAYER.boat) leaveBoat(PLAYER); if(PLAYER.mount) dismount(PLAYER, true);
  PLAYER.cycling = !PLAYER.cycling; if(PLAYER.cycling){ select(PLAYER, false); if(!PLAYER.controlled) setControl(true); toast(`Đang đạp ${ITEM[PROF.equip.bike].n}! Đi khắp nơi bằng phím mũi tên.`); mprog('cycle'); }
  updateExtButtons(); updatePanel();
}

// ---------- pets ----------
var PET = null;
function spawnPet(){ const k = PROF && PROF.equip.pet; if(!k || !PLAYER){ PET = null; return; } if(!PET || PET.kind !== k) PET = {kind:k, x:PLAYER.x - 20, y:PLAYER.y + 6, dir:1, ph:0, moving:false, heart:0, ride:false}; }
function updatePet(dt){
  if(!PET || !PLAYER || !PLAYER.visible) return;
  PET.ride = PLAYER.cycling && has('carrier');
  if(PLAYER.boat){ PET.x = PLAYER.x; PET.y = PLAYER.y; return; }
  const tx = PLAYER.x - PLAYER.dir*22, ty = PLAYER.y + 8, dx = tx - PET.x, dy = ty - PET.y, d = Math.hypot(dx, dy);
  if(d > 400){ PET.x = tx; PET.y = ty; }
  if(d > 6){ const sp = Math.min(d*3, 420); PET.x += dx/d*sp*dt; PET.y += dy/d*sp*dt; PET.moving = true; PET.dir = dx < 0 ? -1 : 1; PET.ph += dt*12; } else PET.moving = false;
  PET.heart = Math.max(0, PET.heart - dt); if(!PET.moving && Math.random() < dt*.08) PET.heart = 1.6;
}
function drawPet(k, x, y, dir, ph, moving){
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if(dir < 0) ctx.scale(-1, 1);
  const b = moving ? Math.abs(Math.sin(ph))*2 : 0; rect('rgba(0,0,0,.2)', -6, -1, 12, 2);
  if(k === 'dog' || k === 'fox' || k === 'cat'){ const c = k === 'dog' ? '#c58c4a' : k === 'fox' ? '#ff7043' : '#9e9e9e'; rect(c, -6, -8 - b, 11, 6); rect(c, 3, -12 - b, 6, 6); rect('#111', 6, -10 - b, 1, 1); rect(c, -5, -3, 2, 3); rect(c, 2, -3, 2, 3);
    if(k === 'cat'){ tri(3, -12 - b, 5, -12 - b, 4, -15 - b, c); tri(6, -12 - b, 8, -12 - b, 7, -15 - b, c); rect(c, -8, -12 - b + Math.sin(ph)*1, 2, 5); }
    else if(k === 'fox'){ tri(3, -12 - b, 5, -12 - b, 4, -15 - b, c); tri(6, -12 - b, 8, -12 - b, 7, -15 - b, c); rect(c, -11, -8 - b, 5, 4); rect('#fff', -12, -8 - b, 2, 3); rect('#fff', 6, -8 - b, 3, 2); }
    else { rect('#6d4c2e', 4, -12 - b, 2, 4); rect(c, -8, -9 - b + Math.sin(ph*1.5)*1.5, 2, 3); } }
  else if(k === 'rabbit'){ const j = moving ? Math.abs(Math.sin(ph*.7))*5 : 0; rect('#fafafa', -5, -8 - j, 10, 7); rect('#fafafa', 2, -12 - j, 6, 5); rect('#fafafa', 3, -18 - j, 2, 6); rect('#fafafa', 6, -18 - j, 2, 6); rect('#f8bbd0', 6, -17 - j, 1, 4); rect('#111', 6, -10 - j, 1, 1); }
  else if(k === 'parrot'){ const fy = -26 + Math.sin(ph*.8)*3; rect('#e53935', -3, fy, 6, 7); rect('#ffd23f', -3, fy + 4, 6, 2); rect('#1e88e5', -6, fy + 1 + Math.sin(ph*3)*2, 3, 4); rect('#1e88e5', 3, fy + 1 - Math.sin(ph*3)*2, 3, 4); rect('#ffb300', 3, fy + 1, 2, 2); }
  else if(k === 'panda'){ rect('#fafafa', -7, -10 - b, 13, 9); rect('#111', -7, -5 - b, 13, 3); rect('#fafafa', 2, -15 - b, 8, 7); rect('#111', 2, -16 - b, 2, 2); rect('#111', 8, -16 - b, 2, 2); rect('#111', 4, -12 - b, 2, 2); rect('#111', 7, -12 - b, 2, 2); }
  else if(k === 'unicorn'){ rect('#fafafa', -7, -10 - b, 13, 6); rect('#fafafa', 4, -15 - b, 5, 7); tri(6, -15 - b, 8, -15 - b, 8, -21 - b, '#ffd23f'); ['#ef4b4b','#ffd23f','#2fbf71','#3d7bff'].forEach((c, i) => rect(c, -9 - i, -10 - b + i, 3, 2)); rect('#fafafa', -6, -4, 2, 4); rect('#fafafa', 3, -4, 2, 4); }
  else if(k === 'dragon'){ const fy = -22 + Math.sin(ph*.6)*3; rect('#2e7d32', -7, fy, 13, 7); rect('#2e7d32', 5, fy - 4, 7, 6); rect('#ffd23f', 10, fy - 2, 2, 2); rect('#a5d6a7', -14, fy - 4 - Math.sin(ph*2)*3, 7, 3); rect('#2e7d32', -11, fy + 2, 4, 2); if(Math.floor(ph) % 6 === 0){ rect('#ff9800', 12, fy - 1, 5, 2); rect('#ffeb3b', 16, fy - 1, 3, 2); } }
  ctx.restore();
}
function petSprites(sp){ if(PET && PLAYER && PLAYER.visible && !PET.ride && !PLAYER.boat && inVB(PET.x, PET.y)) sp.push({y:PET.y, f:() => { drawPet(PET.kind, PET.x, PET.y, PET.dir, PET.ph, PET.moving); if(PET.heart > 0){ ctx.font = '12px VT323, monospace'; ctx.fillStyle = '#ff6f91'; ctx.fillText('♥', PET.x - 3, PET.y - 22 - (1.6 - PET.heart)*10); } }}); }

// ---------- level, exp, money ----------
function reward(exp, money, why, quiet){
  if(!PROF){ if(!quiet && (exp || money)) loginNudge(); return; }
  exp = Math.round(exp || 0); money = Math.round(money || 0);
  PROF.exp += exp; PROF.money += money; PROF.stats.games++;
  if(exp) floatText(`+${exp} EXP`, '#7cf29c'); if(money) setTimeout(() => floatText(`+$${money}`, '#ffd23f'), 220);
  if(why && (money || exp >= 30)) log('event', `${PROF.name} nhận ${exp ? exp + ' EXP' : ''}${exp && money ? ' và ' : ''}${money ? '$' + money : ''}: ${why}.`);
  let up = false; while(PROF.exp >= needExp(PROF.level)){ PROF.exp -= needExp(PROF.level); PROF.level++; up = true; }
  if(up) levelUp();
  renderProfHud(); saveProfile();
}
var nudged = 0;
function loginNudge(){ if(realT - nudged < 60) return; nudged = realT; toast('Đăng nhập để nhận EXP và tiền thưởng khi chơi!'); }
function activity(id, exp){ if(!PROF) return; const k = 'a_' + id, now = Date.now(); if(PROF.cdo[k] && now - PROF.cdo[k] < 15000) return; PROF.cdo[k] = now; reward(exp || 8, 0, null, true); }
function levelUp(){
  const L = PROF.level, el2 = $('#lvlUp'); $('#lvlNum').textContent = L;
  const un = SHOP.filter(i => i.lvl === L).map(i => i.n).concat(LOCKS.filter(z => z.lvl === L).map(z => 'Khu ' + z.name));
  $('#lvlUnlock').textContent = un.length ? 'Mở khóa: ' + un.slice(0, 6).join(', ') + (un.length > 6 ? '…' : '') : 'Tiếp tục cố gắng nhé!';
  el2.hidden = false; el2.classList.remove('show'); void el2.offsetWidth; el2.classList.add('show');
  clearTimeout(el2._t); el2._t = setTimeout(() => { el2.hidden = true; }, 4200);
  try { sfx(); const t = AC.currentTime; [523, 659, 784, 1046, 1318].forEach((f, i) => tone(t + i*.09, f, .5, .14)); } catch(e){}
  confetti(); log('event', `🎉 ${PROF.name} lên Level ${L}!`);
}
function floatText(t, col){ const s = $('#stage'), d = el('div', {className:'floater'}); d.textContent = t; d.style.color = col; d.style.left = (40 + Math.random()*20) + '%'; s.appendChild(d); setTimeout(() => d.remove(), 1800); }
var CONF = [];
function confetti(){ if(RM.matches) return; for(let i=0;i<120;i++) CONF.push({x:Math.random(), y:-Math.random()*.3, vx:(Math.random() - .5)*.2, vy:.2 + Math.random()*.4, r:Math.random()*6, c:['#ef4b4b','#ffd23f','#3d7bff','#2fbf71','#ff8a2b','#fff'][i % 6], t:3}); }
function drawConfetti(dt){
  if(!CONF.length) return; const c = mainCtx; c.save(); c.setTransform(DPR, 0, 0, DPR, 0, 0);
  CONF.forEach(p => { p.x += p.vx*dt; p.y += p.vy*dt; p.t -= dt; p.r += dt*8; c.fillStyle = p.c; c.save(); c.translate(p.x*cw, p.y*ch); c.rotate(p.r); c.fillRect(-4, -2, 8, 4); c.restore(); });
  CONF = CONF.filter(p => p.t > 0 && p.y < 1.1); c.restore();
}
function renderProfHud(){
  const h = $('#prof'); if(!h) return;
  if(!PROF){ h.classList.add('guest'); $('#profName').textContent = 'Khách'; $('#profLvl').textContent = 'Chưa đăng nhập'; $('#profMoney').textContent = ''; $('#profBar').style.width = '0%'; $('#profExp').textContent = 'Bấm để đăng nhập hoặc tạo tài khoản'; return; }
  h.classList.remove('guest');
  $('#profName').textContent = PROF.name; $('#profLvl').textContent = 'Level ' + PROF.level; $('#profMoney').textContent = '$' + PROF.money;
  const n = needExp(PROF.level); $('#profBar').style.width = Math.min(100, PROF.exp/n*100) + '%'; $('#profExp').textContent = `${PROF.exp} / ${n} EXP`;
}
function drawAvatar(){
  const cv = $('#profAv'); if(!cv) return; const c = cv.getContext('2d');
  withCtx(c, () => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); if(!PLAYER) { ctx.fillStyle = '#8ea0d6'; ctx.font = '28px Bungee'; ctx.fillText('?', 18, 40); return; } ctx.translate(26, 52); ctx.scale(1.6, 1.6); const was = PLAYER.moving; PLAYER.moving = true; const w = PLAYER.walk; PLAYER.walk = realT*6; drawBody(PLAYER, false); PLAYER.moving = was; PLAYER.walk = w; });
}

// ---------- level-locked zones ----------
var LOCKS = [];
function gateOK(ox, oy, nx, ny){
  const c = agents.find(a => a.controlled);
  if(c && (c.cycling || c.mount) && ny > 872 && ny > oy){ if(realT - (gateOK.w || 0) > 3){ gateOK.w = realT; toast(c.cycling ? 'Xe đạp chỉ chạy trên bờ. Bấm "Lên thuyền" để ra biển.' : 'Thú cưỡi không xuống nước được.'); } return false; }
  if(!c || !c.isPlayer || !PROF) return true;
  for(const z of LOCKS){ if(PROF.level >= z.lvl) continue; if(!inside(z.r, ox, oy) && inside(z.r, nx, ny)){ if(realT - (z.warn || 0) > 2.5){ z.warn = realT; toast(`${z.name}: cần Level ${z.lvl} mới vào được (bạn đang Level ${PROF.level}).`); } return false; } }
  return true;
}
function drawLocks(){
  LOCKS.forEach(z => { if(PROF && PROF.level >= z.lvl) return; const r = z.r; if(r.x > VB.x1 || r.x + r.w < VB.x0 || r.y > VB.y1 || r.y + r.h < VB.y0) return;
    ctx.save(); ctx.strokeStyle = 'rgba(255,210,63,.9)'; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -realT*20; ctx.lineWidth = 3; ctx.strokeRect(r.x, r.y, r.w, r.h); ctx.restore();
    ctx.fillStyle = 'rgba(10,15,34,.18)'; ctx.fillRect(r.x, r.y, r.w, r.h);
    const cx = r.x + r.w/2, cy = r.y + Math.min(r.h/2, 120); rect('#2a1c10', cx - 70, cy - 16, 140, 30); rect('#ffd23f', cx - 62, cy - 9, 10, 9); rect('#ffd23f', cx - 60, cy - 14, 6, 6); rect('#2a1c10', cx - 58, cy - 12, 2, 4);
    ctx.font = '15px VT323, monospace'; ctx.fillStyle = '#ffd23f'; ctx.fillText(`Cần Level ${z.lvl}`, cx - 46, cy + 4); });
}

// ---------- login & creator UI ----------
function openLogin(){ showModal('mLogin'); const all = accLoad(); $('#lgName').value = all.last || ''; $('#lgMsg').textContent = ''; setTimeout(() => ($('#lgName').value ? $('#lgPass') : $('#lgName')).focus(), 50); }
var CR = {look:null, preset:0};
function openCreator(){ CR.look = Object.assign({}, PRESETS[0].look); CR.preset = 0; showModal('mCreator'); renderCreator(); crAnim(); }
function renderCreator(){
  const p = $('#crPresets'); p.innerHTML = '';
  PRESETS.forEach((pr, i) => { const b = el('button', {type:'button', className:'crp'}); const cv = el('canvas', {width:56, height:70}); b.appendChild(cv); const s = el('span'); s.textContent = pr.n; b.appendChild(s); b.setAttribute('aria-pressed', i === CR.preset); b.onclick = () => { CR.preset = i; CR.look = Object.assign({}, pr.look); renderCreator(); }; p.appendChild(b);
    withCtx(cv.getContext('2d'), () => { ctx.translate(28, 62); ctx.scale(1.8, 1.8); const f = Object.assign(lookFor(i), {}); applyLook(f, pr.look); f.dir = 1; drawBody(f, false); }); });
  const row = (id, arr, key, isCol) => { const r = $(id); r.innerHTML = ''; arr.forEach((v, i) => { const val = isCol === 'idx' ? i : Array.isArray(v) ? v[0] : v; const b = el('button', {type:'button', className: isCol ? 'swatch' : ''}); if(isCol) b.style.background = Array.isArray(v) ? v[0] : v; else b.textContent = v[1]; b.setAttribute('aria-pressed', CR.look[key] === val); b.setAttribute('aria-label', Array.isArray(v) ? v[1] : String(v)); b.onclick = () => { CR.look[key] = val; renderCreator(); }; r.appendChild(b); }); };
  row('#crSkin', SKINCOLS, 'skin', 'idx'); row('#crHair', HAIRSTYLES, 'hs', false); row('#crHairC', HAIRCOLS, 'hc', 'idx'); row('#crShirt', SHIRTCOLS, 'shirt', true); row('#crPants', PANTCOLS, 'pants', true);
  $('#crSkirt').checked = !!CR.look.skirt; $('#crGlass').checked = !!CR.look.glasses;
}
function crAnim(){ if(!openModal || openModal.id !== 'mCreator') return; const cv = $('#crPrev'); withCtx(cv.getContext('2d'), () => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); const g = ctx.createRadialGradient(110, 150, 10, 110, 150, 140); g.addColorStop(0, '#3a4a8a'); g.addColorStop(1, '#141b3a'); ctx.fillStyle = g; ctx.fillRect(0, 0, 220, 240); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(110, 212, 50, 10, 0, 0, Math.PI*2); ctx.fill(); const f = lookFor(0); applyLook(f, CR.look); f.dir = Math.sin(realT*.8) > 0 ? 1 : -1; f.moving = true; f.walk = realT*5; ctx.translate(110, 212 - Math.abs(Math.sin(realT*5))*2); ctx.scale(5, 5); drawBody(f, false); }); requestAnimationFrame(crAnim); }
function finishCreator(){
  if(!ACC_NAME) return; PROF = newProfile(ACC_NAME, CR.look); PROF.look.preset = PRESETS[CR.preset].n;
  const all = accLoad(); if(all.users && all.users[ACC_NAME]){ all.users[ACC_NAME].profile = PROF; accSaveAll(all); }
  hideModal(); enterGame(true);
}
function enterGame(first){
  if(!PLAYER){ PLAYER = mkAgent({id:'player', name:PROF.name, role:'Người chơi', log:'event', icon:null}, 99, false); PLAYER.isPlayer = true; PLAYER.speed = 80;
    const r = $('#roster'), h = el('h3', {}, 'Người chơi'), bt = el('button', {type:'button', className:'who'}); bt.innerHTML = '<span class="n"><span class="dot"></span><b class="pn"></b></span><span class="t"></span>'; bt.onclick = () => { backToPlayer(); locateAgent(PLAYER); }; r.insertBefore(bt, r.firstChild); r.insertBefore(h, bt); PLAYER.btn = bt; agents.push(PLAYER); }
  PLAYER.btn.querySelector('.pn').textContent = PROF.name; PLAYER.btn.querySelector('.dot').style.background = PROF.look.shirt;
  PLAYER.name = PROF.name; applyLook(PLAYER, lookWithEquip()); PLAYER.visible = true; PLAYER.x = 820 + Math.random()*40; PLAYER.y = 430; PLAYER.task = 'Khám phá thế giới'; PLAYER.cycling = false;
  select(PLAYER, true); setControl(true); followCam = true; cam.z = Math.max(cam.z, 1); clampCam(); grantStarter(); spawnPet(); renderProfHud(); saveProfile();
  toast(first ? `Chào mừng ${PROF.name}! Chơi mini game để lên level, kiếm tiền mua đồ.` : `Chào mừng ${PROF.name} trở lại! Level ${PROF.level} · $${PROF.money}`);
  log('event', `${PROF.name} ${first ? 'vừa gia nhập' : 'quay lại'} thế giới trường Rubik.`);
  hideModal(); updateExtButtons(); if(window.onlineHello) onlineHello(); setTimeout(() => { try { dailyWisdom(); } catch(e){} }, 3000);
}
function backToPlayer(){ if(!PLAYER){ openLogin(); return; } cancelAuto(); select(PLAYER, true); if(!PLAYER.controlled) setControl(true); followCam = true; }
function openProfile(){
  if(!PROF){ openLogin(); return; } showModal('mProfile');
  const n = needExp(PROF.level);
  $('#pfInfo').innerHTML = '';
  const rows = [['Tên', PROF.name], ['Level', PROF.level], ['Kinh nghiệm', `${PROF.exp} / ${n} EXP (tổng ${totalExp()})`], ['Tiền', '$' + PROF.money], ['Mini game đã chơi', PROF.stats.games], ['Sách đã hoàn thành', Object.keys(PROF.books).length], ['Cá đã câu', PROF.stats.catches], ['Huy chương Olympic', PROF.stats.medals], ['Phong cách', PROF.look.preset || '']];
  rows.forEach(([k, v]) => { const d = el('div', {className:'pfrow'}); d.innerHTML = '<span></span><b></b>'; d.firstChild.textContent = k; d.lastChild.textContent = v; $('#pfInfo').appendChild(d); });
  const inv = $('#pfInv'); inv.innerHTML = ''; const own = SHOP.filter(i => has(i.id)); if(!own.length) inv.textContent = 'Túi đồ trống. Kiếm tiền từ mini game rồi vào Cửa hàng nhé!';
  own.forEach(i => { const s = el('span', {className:'chipi'}); s.textContent = i.n + (equipSlot(i) && PROF.equip[equipSlot(i)] === i.id ? ' ✓' : ''); inv.appendChild(s); });
  loadBoard();
}
async function loadBoard(){
  const box = $('#pfBoard'); box.textContent = 'Đang tải bảng xếp hạng…';
  const db = await cloudInit(); if(!db){ box.textContent = 'Bảng xếp hạng online cần mở trang trên claude.ai.'; return; }
  try { const q = await db.collection('board').orderBy('tot', 'desc').limit(20).get(); box.innerHTML = ''; const ol = el('ol', {className:'board'}); q.docs.forEach(d => { const v = d.data() || {}; const li = el('li'); li.textContent = `${v.u || '?'} · Level ${v.lvl || 1} · ${v.tot || 0} EXP`; ol.appendChild(li); }); box.appendChild(ol); if(!q.docs.length) box.textContent = 'Chưa có ai trên bảng xếp hạng.'; }
  catch(e){ box.textContent = 'Chưa tải được bảng xếp hạng.'; }
}
function ext7Init(){
  $('#lgGo').onclick = async () => { $('#lgMsg').textContent = 'Đang kiểm tra…'; const e = await doLogin($('#lgName').value, $('#lgPass').value); $('#lgMsg').textContent = e || ''; };
  $('#lgNew').onclick = async () => { $('#lgMsg').textContent = 'Đang tạo…'; const e = await doRegister($('#lgName').value, $('#lgPass').value); if(e){ $('#lgMsg').textContent = e; return; } $('#lgMsg').textContent = ''; openCreator(); };
  $('#lgPass').addEventListener('keydown', e => { if(e.key === 'Enter') $('#lgGo').click(); });
  $('#lgGuest').onclick = () => hideModal();
  $('#crSkirt').onchange = e => { CR.look.skirt = e.target.checked; }; $('#crGlass').onchange = e => { CR.look.glasses = e.target.checked; };
  $('#crDone').onclick = finishCreator;
  $('#prof').onclick = () => PROF ? openProfile() : openLogin();
  $('#pfShop').onclick = () => openShop(); $('#pfLogout').onclick = () => { hideModal(); logout(); };
  $('#pfRestyle').onclick = () => { CR.look = Object.assign({}, PROF.look); CR.preset = Math.max(0, PRESETS.findIndex(p => p.n === PROF.look.preset)); showModal('mCreator'); renderCreator(); crAnim(); $('#crDone').onclick = () => { PROF.look = Object.assign({}, CR.look, {preset:PRESETS[CR.preset].n}); afterEquip(); hideModal(); $('#crDone').onclick = finishCreator; }; };
  const B = (id, f) => { const b = $('#' + id); if(b) b.onclick = f; };
  B('hShop', () => openShop()); B('hBike', toggleBike); B('hMe', backToPlayer); B('hOnline', () => openLobby && openLobby()); B('xShop', () => openShop());
  renderProfHud();
  setInterval(() => { drawAvatar(); }, 120);
  setInterval(() => { if(PROF) saveProfile(); }, 30000);
  const all = accLoad();
  setTimeout(() => { if(!openModal) openLogin(); }, 900);
}

