// ================= v64s · 5/5 NHÂN VẬT NINJA ADVENTURE: 16×16, 4 hướng, 4 khung đi, phóng ×2 sắc nét =================
// Áp cho người chơi + học sinh/NPC khi đang ở trong khuôn viên trường; ngoài trường giữ hình cũ. 10 thầy cô v62k: mỗi người 1 nhân vật.
// Bảng sprite NA 64×112: cột = hướng (xuống, lên, trái, phải), hàng 0–3 = khung đi.
const V64S_KEY = 'truong-v64s-char';
function v64sMyChar(){ if(V64S.my == null){ try { V64S.my = localStorage.getItem(V64S_KEY) || ''; } catch(e){ V64S.my = ''; } } return V64S.my; }
function v64sCharOf(a){
  if(a === PLAYER){ const m = v64sMyChar(); if(m === 'old') return null; if(m) return m; }
  if(a._v64c === undefined){ const k = [a.name, a.idx, a.id, a.shirt, a.hair, a.pants].join('|'); a._v64c = V64S_KIDS[(k.replace(/[|u]/g, '').length > 2 ? v64sHash(k) : Math.floor(Math.random()*1e6)) % V64S_KIDS.length]; } return a._v64c;
}
function v64sHere(a){
  if(!V64S.ok || !V46.on || V46.sky) return false;
  if(V64S.rawP) return v64sInCampus(V64S.rawP[0], V64S.rawP[1], 20);   // v46DrawRaw: người đi đường vẽ tạm ở toạ độ cũ giả
  try { if(v46Raw(a.x)) return v64sInCampus(a.x - V46E, a.y, 20);
    const z = (a._z && V46.ZI[a._z]) || v46ZoneOld(a.x, a.y); return !!(z && V64S.zin[z.id]); } catch(e){ return false; }
}
// hướng nhìn: theo chuyển động gần nhất (lưu trên người đó), đứng yên thì giữ hướng cũ
function v64sFace(a){
  const p = a._v64p, x = a.x, y = a.y; a._v64p = [x, y];
  if(p){ const dx = x - p[0], dy = y - p[1]; if(Math.abs(dx) + Math.abs(dy) > .05 && Math.abs(dx) + Math.abs(dy) < 60){ a._v64f = Math.abs(dx) > Math.abs(dy)*1.1 ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0); } }
  if(a._v64f == null) a._v64f = 0; return a._v64f;
}
function v64sDrawNA(a, swim){
  if(swim || a.lion || !v64sHere(a)) return false; const name = v64sCharOf(a); if(!name) return false; const im = v64sChar(name); if(!im) return false;
  const f = v64sFace(a), fr = a.moving ? Math.floor((a.walk || 0)*1.25) % 4 : 0;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-9, -3, 18, 4);
  const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false; ctx.drawImage(im, f*16, fr*16, 16, 16, -16, -31, 32, 32); ctx.imageSmoothingEnabled = sm;
  return true;
}
// bọc ngay khi nạp file (các lớp v50/v51a vẽ đồ cầm tay sau đó vẫn chạy)
const v64sDB0 = drawBody;
drawBody = function(a, swim){ try { if(v64sDrawNA(a, swim)) return; } catch(e){} return v64sDB0(a, swim); };

// thầy cô v62k: canvas 16·sc × 27·sc, chân ở hàng 26·sc (khớp chỗ vẽ -16, -52 khi sc = 2)
function v64sTeachSpr(t, fr, sc){
  const name = V64S_TEACH[t.id], im = name && v64sChar(name); if(!im) return null;
  const c = document.createElement('canvas'); c.width = 16*sc; c.height = 27*sc; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const col = fr ? 3 : 0, row = fr ? (fr === 1 ? 1 : 3) : 0; g.drawImage(im, col*16, row*16, 16, 16, 0, 10*sc, 16*sc, 16*sc); return c;
}
// chọn nhân vật trong "Nhân vật của tôi"
function v64sPicker(){
  const inv = document.getElementById('pfInv'); if(!inv) return; let box = document.getElementById('v64sPick');
  if(!box){ box = document.createElement('div'); box.id = 'v64sPick'; const h = document.createElement('h2'); h.textContent = '🥷 Nhân vật ở khu trường mới'; box.appendChild(h);
    const row = document.createElement('div'); row.className = 'v64sRow'; box.appendChild(row); inv.parentNode.insertBefore(box, inv.previousElementSibling || inv); }
  const row = box.querySelector('.v64sRow'); row.innerHTML = ''; const cur = v64sMyChar();
  const opts = [['', 'Tự chọn ngẫu nhiên']].concat(V64S_KIDS.map(n => [n, n]), [['old', 'Hình cũ']]);
  opts.forEach(([n, label]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'v64sCh' + (n === cur ? ' on' : ''); b.setAttribute('aria-label', label); b.title = label;
    if(n && n !== 'old'){ const cv = document.createElement('canvas'); cv.width = cv.height = 48; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; const draw = () => { const im = v64sChar(n); if(im){ g.clearRect(0, 0, 48, 48); g.drawImage(im, 0, 0, 16, 16, 0, 0, 48, 48); return true; } return false; };
      if(!draw()){ let k = 0; const iv = setInterval(() => { if(draw() || ++k > 30) clearInterval(iv); }, 120); } b.appendChild(cv); }
    else b.textContent = n === 'old' ? '↩️' : '🎲';
    b.onclick = () => { V64S.my = n; try { localStorage.setItem(V64S_KEY, n); } catch(e){} row.querySelectorAll('.v64sCh').forEach(x => x.classList.toggle('on', x === b)); toast(n === 'old' ? 'Dùng lại hình nhân vật cũ' : '🥷 Đã đổi nhân vật ở khu trường!'); };
    row.appendChild(b); });
}
function v64sCharsInit(){
  if(typeof v62kSpr === 'function'){ const s0 = v62kSpr; v62kSpr = function(t, fr, sc){ if(!V64S.ok) return s0(t, fr, sc); const k = 'v64' + t.id + fr + '_' + (sc || 2); if(V62K.spr[k]) return V62K.spr[k]; const c = v64sTeachSpr(t, fr, sc || 2); if(!c) return s0(t, fr, sc); return (V62K.spr[k] = c); }; }
  const dr0 = v46DrawRaw; v46DrawRaw = function(a){ try { V64S.rawP = v46Pos(a); } catch(e){} try { return dr0(a); } finally { V64S.rawP = null; } };
  const op0 = openProfile; openProfile = function(){ const r = op0.apply(this, arguments); try { v64sPicker(); } catch(e){ console.warn('v64s pick', e); } return r; };
  // tải trước nhân vật thầy cô + vài học sinh để lần vẽ đầu không bị nháy hình cũ
  Object.values(V64S_TEACH).concat(V64S_KIDS).forEach(n => v64sChar(n));
}
