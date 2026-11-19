// ================= v65c · 1/4 KHU THIÊN NHIÊN NINJA ADVENTURE: lõi, ảnh phụ, nước pixel, móc vào game =================
// Đổi đồ hoạ 11 khu thiên nhiên sang tile Ninja Adventure (CC0) — giống cách v64s làm khuôn viên trường.
// Chỉ đổi HÌNH: vị trí khu, cửa, va chạm, mini game, nút bấm giữ nguyên. Mọi tên toàn cục có tiền tố v65c / V65C.
// Vẽ trong TOẠ ĐỘ CŨ của từng khu (R[id]) rồi dịch theo z.d — đúng như nền cũ của khu được dán lên đảo.
// Nền: vẽ vào ô nền nướng sẵn (bọc v46Paint) → không tốn khung hình. Cây, lều, nhà… = sprite cache, xếp theo y cùng người.
const V65C_IDS = ['pond', 'flowerfield', 'garden', 'picnic', 'lotus', 'lake', 'zen', 'botanic', 'farm', 'bpad', 'art'];
const V65C_ON = {}; V65C_IDS.forEach(k => { V65C_ON[k] = 1; });
const V65C_NA = 'assets/cc0/ninja-adventure/';
const V65C_SRC = {
  cow:'Actor/Animals/Cow/SpriteSheetWhiteSide.png', horse:'Actor/Animals/Horse/SpriteSheetBrownSide.png', pig:'Actor/Animals/Pig/SpriteSheetPink.png',
  chick:'Actor/Animals/Chicken/SpriteSheetWhite.png', lion:'Actor/Animals/Lion/SpriteSheetYellowSide.png', dog:'Actor/Animals/Dog/SpriteSheet.png',
  fishR:'Actor/Animals/Fish/SpriteSheetRed.png', fishY:'Actor/Animals/Fish/SpriteSheetYellow.png', fishW:'Actor/Animals/Fish/SpriteSheetWhite.png', frog:'Actor/Animals/Frog/SpriteSheet.png',
  mill:'Backgrounds/Animated/MillPropeller/SpriteSheet64x64.png', wmill:'Backgrounds/Animated/WaterMill/SpriteSheet.png', boat:'Backgrounds/Vehicles/Boat.png',
  rip:'Backgrounds/Animated/Water Ripples/SpriteSheet16x16.png', flagG:'Backgrounds/Animated/Flag/FlagGreen16x16.png'
};
const V65C = {on:false, cur:null, img:{}, spr:{}, P:{}, key:'', t0:0};
// toạ độ khu
const v65cZ = id => V46.ZI[id];
const v65cR = id => R[id];

// ---------- 1. ảnh phụ (thú, cối xay, thuyền…): tải ngầm, thiếu thì dùng hình cũ / tự vẽ ----------
function v65cLoad(){
  Object.keys(V65C_SRC).forEach(k => { const im = new Image(); im.decoding = 'async'; im.onload = () => { V65C.img[k] = im; }; im.onerror = () => {}; im.src = V65C_NA + V65C_SRC[k]; });
}
const v65cI = k => V65C.img[k] || null;
const v65cDong = () => season === 'dong', v65cThu = () => season === 'thu', v65cXuan = () => season === 'xuan';
function v65cHash(a, b){ let h = (a*73856093) ^ (b*19349663); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0); }

// ---------- 2. sprite cache: vẽ ở nửa độ phân giải (1 điểm ảnh = 2 px thế giới, đúng cỡ tile NA ×2) ----------
// draw(g) vẽ theo "điểm ảnh NA"; trả về {cv, w, h} với w, h = cỡ thế giới
function v65cSpr(key, pw, ph, draw){
  let c = V65C.spr[key]; if(c) return c;
  const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(pw)); cv.height = Math.max(1, Math.ceil(ph)); const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  try { draw(g, cv); } catch(e){ console.warn('v65c spr', key, e); }
  c = V65C.spr[key] = {cv, w:cv.width*2, h:cv.height*2}; return c;
}
// vẽ sprite với gốc (ax, ay) = điểm neo trong sprite (theo px thế giới)
function v65cPut(g, s, x, y, ax, ay){ if(s) g.drawImage(s.cv, Math.round(x - ax), Math.round(y - ay), s.w, s.h); }
// khung chữ nhật pixel có viền
function v65cBox(g, x, y, w, h, fill, line){ g.fillStyle = line || '#2b1a10'; g.fillRect(x, y, w, h); g.fillStyle = fill; g.fillRect(x + 1, y + 1, w - 2, h - 2); }

// ---------- 3. NƯỚC PIXEL kiểu NA: viền cỏ sẫm → bờ đất nâu → bọt trắng → nước nông → nước trong ----------
// dist(x, y): khoảng cách có dấu (px thế giới, dương = trong nước) tại điểm (x, y) tính từ góc sprite
const V65C_WP = {
  ha:['#a8a129', '#965340', '#ffffff', '#79b8ce', '#71ddee', '#a6ecf5'],
  sen:['#a8a129', '#965340', '#ffffff', '#79b8ce', '#62c9c4', '#8fe0d6'],
  dong:['#d2c9c9', '#bfa49e', '#ffffff', '#79b8ce', '#a9e8f2', '#e4f8fb']
};
function v65cWater(key, w, h, dist, pal){
  const k = key + '|' + (v65cDong() ? 'd' : pal || 'ha');
  return v65cSpr(k, w/2, h/2, (g, cv) => {
    const W = cv.width, H = cv.height, P = V65C_WP[v65cDong() ? 'dong' : pal || 'ha'].map(c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]);
    const im = g.createImageData(W, H), D = im.data;
    for(let j = 0; j < H; j++) for(let i = 0; i < W; i++){
      let d = dist(i*2 + 1, j*2 + 1)/2; const hh = v65cHash(i >> 1, j >> 1); d += ((hh % 3) - 1)*.45;
      let c = null;
      if(d < -3) continue; else if(d < 0){ if(hh % 5 < 3) c = P[0]; else continue; }
      else if(d < 2) c = P[1]; else if(d < 4) c = P[2]; else if(d < 6) c = P[3];
      else { c = P[4]; if(v65cDong()){ if((i + j) % 9 < 2) c = P[5]; } else if(hh % 61 === 0 || (hh % 97 === 1 && i % 3)) c = P[5]; }
      const o = (j*W + i)*4; D[o] = c[0]; D[o + 1] = c[1]; D[o + 2] = c[2]; D[o + 3] = 255;
    }
    g.putImageData(im, 0, 0);
  });
}
// khoảng cách tới mép elip (gần đúng, chuẩn hoá theo gradient → dải viền đều)
function v65cEllD(cx, cy, rx, ry){ return (x, y) => { const u = (x - cx)/rx, v = (y - cy)/ry, f = u*u + v*v - 1, gx = 2*(x - cx)/(rx*rx), gy = 2*(y - cy)/(ry*ry); return -f/Math.max(1e-6, Math.hypot(gx, gy)); }; }
// khoảng cách tới dải dọc theo đường gấp khúc P (bề rộng hw mỗi bên)
function v65cLineD(P, hw){ return (x, y) => { let b = 1e9; for(let i = 1; i < P.length; i++){ const a = P[i - 1], c = P[i], vx = c[0] - a[0], vy = c[1] - a[1], L = vx*vx + vy*vy || 1, t = Math.max(0, Math.min(1, ((x - a[0])*vx + (y - a[1])*vy)/L)); b = Math.min(b, Math.hypot(a[0] + vx*t - x, a[1] + vy*t - y)); } return hw - b; }; }
function v65cBez(p0, p1, p2, p3, n){ const P = []; for(let i = 0; i <= n; i++){ const t = i/n, u = 1 - t; P.push([u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0], u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]]); } return P; }
// mặt nước elip đặt sẵn: trả {s, x, y} để dán vào nền
function v65cLakeAt(key, cx, cy, rx, ry, pal){ const pad = 10, w = Math.ceil(rx*2 + pad*2), h = Math.ceil(ry*2 + pad*2); return {s:v65cWater(key, w, h, v65cEllD(rx + pad, ry + pad, rx, ry), pal), x:cx - rx - pad, y:cy - ry - pad}; }

// ---------- 4. móc vào game ----------
function v65cReady(){ return V65C.on && typeof V64S !== 'undefined' && V64S.ok && V46.on && !V46.sky; }
function v65cInit(){
  if(typeof V46 === 'undefined' || !V46.ready || typeof V64S === 'undefined' || /[?&]nov65c/.test(location.search)) return;
  V65C.on = true;
  // khu của mình: bỏ hàng rào hoa bo góc cũ (v20Soft) trong ảnh tĩnh của khu
  const zs0 = v46ZoneStatic; v46ZoneStatic = function(z){ if(V65C_ON[z.id] && v65cReady()) return; return zs0.apply(this, arguments); };
  // đánh dấu khu đang vẽ (lượt vẽ khu + ảnh toàn cảnh)
  const zc0 = v46ZoneContent; v46ZoneContent = function(z){ const prev = V65C.cur; V65C.cur = V65C_ON[z.id] && v65cReady() ? z.id : null; try { return zc0.apply(this, arguments); } finally { V65C.cur = prev; } };
  // hiệu ứng động cũ (cá koi, vịt, sen, lửa trại, khinh khí cầu bay ngang…) → bản NA trong v65cDyn
  const fd0 = drawForestDyn; drawForestDyn = function(){ if(V65C.cur) return; return fd0.apply(this, arguments); };
  const nd0 = drawNorthDyn; drawNorthDyn = function(){ if(V65C.cur) return; return nd0.apply(this, arguments); };
  // cây cũ trong khu → cây NA cùng mùa
  const tr0 = drawTree; drawTree = function(t, i){ if(V65C.cur){ try { v65cTreeAt(ctx, t[0], t[1], i || 0, 0); return; } catch(e){} } return tr0.apply(this, arguments); };
  const pi0 = drawPine; drawPine = function(x, y, i){ if(V65C.cur){ try { v65cTreeAt(ctx, x, y, i || 0, 1); return; } catch(e){} } return pi0.apply(this, arguments); };
  // 3 khinh khí cầu cũ chồng lên vòng 8 khinh khí cầu → bỏ ở khu bpad
  if(typeof zoneSprites === 'function'){ const zp0 = zoneSprites; zoneSprites = function(sp){ if(V65C.cur === 'bpad') return; return zp0.apply(this, arguments); }; }
  if(typeof v44Balloon === 'function'){ const b0 = v44Balloon; v44Balloon = function(x, y, c, i){ if(V65C.cur){ try { v65cBalloonAt(ctx, x, y, c, i); return; } catch(e){} } return b0.apply(this, arguments); }; }
  // nông trại: ô trồng cây + thú → NA (giữ nguyên dữ liệu trồng/thu hoạch)
  if(typeof drawPlot === 'function'){ const dp0 = drawPlot; drawPlot = function(i){ if(V65C.cur === 'farm'){ try { v65cPlot(i); return; } catch(e){} } return dp0.apply(this, arguments); }; }
  if(typeof drawAnimal === 'function'){ const da0 = drawAnimal; drawAnimal = function(kind, x, y, dir, ph, moving){ if(V65C.cur === 'farm'){ try { if(v65cAnimal(kind, x, y, dir, ph, moving)) return; } catch(e){} } return da0.apply(this, arguments); }; }
  // sprite của khu: cây, lều, nhà… + hiệu ứng nước
  const es0 = extSprites; extSprites = function(sp){ es0(sp); if(!V65C.cur) return; try { v65cSprites(sp, V65C.cur); } catch(e){ console.warn('v65c sprites', e); } };
  // đèn ấm ban đêm: đèn đường, lửa trại, cửa nhà trong khu
  if(typeof v25Collect === 'function'){ const vc = v25Collect; v25Collect = function(dk){ vc(dk); if(!v65cReady()) return; const on = v25Ramp(clock, 1080, 330); if(on <= 0) return;
    V46.raw = true; try { v65cLights(on); } catch(e){} finally { V46.raw = false; } }; }
  // nền đã nướng trước khi bật → nướng lại
  try { V46T.L0.clear(); V46T.L1.clear(); V46T.ov = null; } catch(e){}
  if(location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__v65c = {V65C, v65cLayout};
}
function v65cLights(on){
  for(const id of V65C_IDS){ const z = v65cZ(id), L = v65cLayout(id); if(!z || !L) continue;
    for(const p of L){ if(p.k === 'lamp') v25Push(p.x + z.d[0], p.y - 48 + z.d[1], 70, on*.85, 2); else if(p.k === 'fire') v25Push(p.x + z.d[0], p.y - 6 + z.d[1], 90, on, 2); else if(p.light) v25Push(p.x + z.d[0], p.y + z.d[1], p.light, on*.9, 2); } }
}
v65cLoad();
