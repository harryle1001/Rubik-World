// ================= EXT51 (v44b): review fixes — edge-to-edge mini games in portrait and landscape (the game's own
// edges are extended to fill the screen, no gaps, no "rotate your phone" hint), six balloon scenes (day, sunset, snowy
// mountains, waterfalls, starry night, rice terraces), a classic British brass lantern button, small travel buttons top-left =================
// ---------- 1. fill the screen: stretch the game's edge pixels into the space around it ----------
function v44Fill(){ const bg = $('#v44Bg'), cv = $('#arcCv'); if(!bg || !cv || !cv.style.width) return; const W = innerWidth, H = innerHeight;
  if(bg.width !== W || bg.height !== H){ bg.width = W; bg.height = H; }
  const g = bg.getContext('2d'), w = parseFloat(cv.style.width), h = parseFloat(cv.style.height), r = cv.getBoundingClientRect(), x0 = Math.round(r.left), y0 = Math.round(r.top), x1 = x0 + Math.round(w), y1 = y0 + Math.round(h), top = (ARC.g && ARC.g.v44top != null) ? ARC.g.v44top : 40;
  g.imageSmoothingEnabled = true;
  try {
    if(y0 > 0){ g.drawImage(cv, 0, top, AW, 1, x0, 0, x1 - x0, y0); g.drawImage(cv, 0, top, 1, 1, 0, 0, x0, y0); g.drawImage(cv, AW - 1, top, 1, 1, x1, 0, W - x1, y0); }
    if(y1 < H){ g.drawImage(cv, 0, AH - 1, AW, 1, x0, y1, x1 - x0, H - y1); g.drawImage(cv, 0, AH - 1, 1, 1, 0, y1, x0, H - y1); g.drawImage(cv, AW - 1, AH - 1, 1, 1, x1, y1, W - x1, H - y1); }
    if(x0 > 0) g.drawImage(cv, 0, 0, 1, AH, 0, y0, x0, y1 - y0); if(x1 < W) g.drawImage(cv, AW - 1, 0, 1, AH, x1, y0, W - x1, y1 - y0);
  } catch(e){} }
// ---------- 2. balloon scenes ----------
const V44_SCENES = ['Bay ngày', 'Bay hoàng hôn', 'Núi tuyết', 'Thác nước', 'Đêm sao', 'Ruộng bậc thang'];
function v44Scene(c, s){ const k = s.scene || 0, X = s.x;
  const sky = (a, b, m) => { const gr = c.createLinearGradient(0, 0, 0, AH); gr.addColorStop(0, a); if(m) gr.addColorStop(.55, m); gr.addColorStop(1, b); c.fillStyle = gr; c.fillRect(0, 0, AW, AH); };
  const ridge = (par, base, amp, f, col, ph) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, AH); for(let x=0;x<=AW;x+=8){ const u = (X*par + x)*f + ph; c.lineTo(x, base - Math.abs(Math.sin(u))*amp - Math.sin(u*2.3)*amp*.25); } c.lineTo(AW, AH); c.fill(); };
  if(k === 2){ sky('#7fa7e6', '#e8f1fb', '#b9d3f2');
    for(const [par, base, amp, col, cap] of [[.06, 300, 150, '#8fa6c8', '#f4f8ff'], [.12, 330, 110, '#6d86ad', '#eef4ff']]){ ridge(par, base, amp, .006, col, par*40); c.save(); c.beginPath(); c.rect(0, 0, AW, base - amp*.55); c.clip(); ridge(par, base, amp, .006, cap, par*40); c.restore(); } }
  else if(k === 3){ sky('#6cc3d5', '#d8f3e6', '#a6e0d8'); ridge(.05, 280, 120, .005, '#5c8a6a', 1); ridge(.1, 320, 90, .007, '#3f7457', 2);
    for(let i=0;i<4;i++){ const fx = ((i*260 - X*.1) % 1040 + 1040) % 1040 - 120, top = 170 + (i % 2)*30; c.fillStyle = '#4b5d52'; c.fillRect(fx - 18, top - 10, 60, 14); const gr = c.createLinearGradient(0, top, 0, 330); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(200,240,255,.6)'); c.fillStyle = gr; c.fillRect(fx, top, 24, 330 - top);
      c.fillStyle = 'rgba(255,255,255,.55)'; for(let j=0;j<6;j++){ const yy = top + ((realT*120 + j*30) % (330 - top)); c.fillRect(fx + 3 + (j % 3)*7, yy, 3, 10); } c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(fx + 12, 332, 34, 9, 0, 0, 7); c.fill(); } }
  else if(k === 4){ sky('#0b1036', '#2a2f6b', '#141a4d'); for(let i=0;i<70;i++){ const x = ((i*97 - X*.05) % AW + AW) % AW, y = (i*53) % 260 + 6, tw = .45 + .55*Math.abs(Math.sin(realT*1.3 + i)); c.fillStyle = `rgba(255,250,220,${tw})`; c.fillRect(x, y, i % 7 ? 2 : 3, i % 7 ? 2 : 3); }
    c.fillStyle = '#fff8dc'; c.beginPath(); c.arc(640, 70, 26, 0, 7); c.fill(); c.fillStyle = '#0b1036'; c.beginPath(); c.arc(652, 62, 24, 0, 7); c.fill(); ridge(.06, 330, 80, .006, '#1c2350', 3); }
  else if(k === 5){ sky('#8fd0f2', '#fdf3c9', '#cdebf2'); ridge(.05, 260, 110, .005, '#7bb38a', 4);
    for(let t=0;t<7;t++){ const y = 250 + t*16; c.fillStyle = t % 2 ? '#9ccc65' : '#c5e1a5'; c.beginPath(); c.moveTo(0, AH); for(let x=0;x<=AW;x+=10) c.lineTo(x, y + Math.sin((X*.12 + x)*.01 + t*.6)*14); c.lineTo(AW, AH); c.fill(); } }
}
const V44_GROUND = {2:['#eef4fb', '#3a5a4a'], 3:['#4f9a5a', '#2c6b43'], 4:['#1f2a48', '#141c34'], 5:['#7cb342', '#33691e']};
function v44Balloon(){ const G = GAMES.balloon; if(!G || G.v44own) return;
  G.opts = V44_SCENES.slice(); const gi = G.init; G.init = function(o){ const s = gi.call(this, o === 1 ? 1 : 0); s.scene = o || 0; return s; };
  const gd = G.draw; G.draw = function(s, c){ if(!(s.scene >= 2)) return gd.call(this, s, c); let first = true; const gc = V44_GROUND[s.scene];
    const px = new Proxy(c, {get(t, k){ if(k === 'fillRect') return (x, y, w, h) => { if(first && x === 0 && y === 0 && w === AW && h === AH){ first = false; v44Scene(t, s); return; } t.fillRect(x, y, w, h); }; const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; },
      set(t, k, v){ if(k === 'fillStyle' && typeof v === 'string'){ if(v === '#4f8a3c') v = gc[0]; else if(v === '#235c34') v = gc[1]; } t[k] = v; return true; }});
    return gd.call(this, s, px); };
}
// ---------- 3. classic British brass lantern + small travel buttons top-left ----------
const V44_LAMP = '<svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><defs><radialGradient id="v44lg" cx="50%" cy="55%" r="55%"><stop offset="0" stop-color="#fff6c8"/><stop offset=".55" stop-color="#ffc44d"/><stop offset="1" stop-color="#d9881c"/></radialGradient><linearGradient id="v44br" x1="0" x2="1"><stop offset="0" stop-color="#8a6a2a"/><stop offset=".5" stop-color="#f3d27a"/><stop offset="1" stop-color="#8a6a2a"/></linearGradient></defs><circle cx="16" cy="3.6" r="2.2" fill="none" stroke="url(#v44br)" stroke-width="1.4"/><path d="M10 9.2 16 5.6l6 3.6z" fill="#1d2420" stroke="url(#v44br)" stroke-width="1"/><rect x="9.6" y="9" width="12.8" height="2" rx=".6" fill="url(#v44br)"/><path d="M11 11h10l-1 13H12z" fill="url(#v44lg)" stroke="#1d2420" stroke-width="1.3"/><path d="M16 11v13M13.5 11l-.6 13M18.5 11l.6 13" stroke="#1d2420" stroke-width=".8" opacity=".75"/><rect x="10.6" y="24" width="10.8" height="2.2" rx=".6" fill="url(#v44br)"/><path d="M12.4 26.2h7.2l-1.4 2.6h-4.4z" fill="#1d2420"/></svg>';
function v44Lamp(){ const b = $('#v44Lamp'); if(!b) return; b.querySelector('.ic').innerHTML = V44_LAMP; b.classList.add('v44lamp'); }
function v44Travel(){ const col = $('#v41Col'); if(!col) return; col.classList.add('v44tl'); }
// ---------- 4. Coach: no technical "offline" lines in the chat ----------
function v44CoachQuiet(){ const vm = v40Msg; v40Msg = function(who, text){ if(who === 'sys' && /offline|Claude|kho gợi ý/i.test(String(text))) return document.createElement('div'); return vm.apply(this, arguments); };
  setInterval(() => { document.querySelectorAll('#v40Log .v40m.sys').forEach(m => { if(/offline|Claude|kho gợi ý/i.test(m.textContent)) m.remove(); }); const sb = $('#v40Sub'); if(sb && /offline/i.test(sb.textContent)) sb.textContent = '● Sẵn sàng trò chuyện'; }, 400); }
function v44PolishInit(){
  V44_ICONS.unshift([/núi|snow/i, '🏔️'], [/thác|waterfall/i, '🏞️'], [/sao|star/i, '🌌'], [/ruộng|lúa|terrace/i, '🌾']);
  v44Balloon(); v44Lamp(); v44Travel(); v44CoachQuiet(); v44ModePicker();
  // edge fill runs every frame while a mini game is open; no rotate hint
  const tk = v44ArcTick; v44ArcTick = function(){ const r = tk.apply(this, arguments); v44Fill(); return r; };
  const rot = $('#v44Rot'); if(rot) rot.remove(); V44.rotSeen = 1;
  const bg = $('#v44Bg'); if(bg){ bg.width = 2; bg.height = 2; }
}
// many modes: one button shows the current scene; tap it to open the list (keeps the top bar inside the screen)
function v44ModePicker(){ const vm = v44Modes; v44Modes = function(){ vm.apply(this, arguments); const box = $('#v44Bar .v44modes'); if(!box) return; const L = [...box.querySelectorAll('.v44mode')]; box.classList.toggle('v44pick', L.length > 3); box.classList.remove('open');
    if(L.length <= 3) return; const cur = L.find(b => b.getAttribute('aria-pressed') === 'true') || L[0]; L.forEach(b => { if(b !== cur){ const f = b.onclick; b.onclick = () => { box.classList.remove('open'); f(); }; } });
    const cf = cur.onclick; cur.onclick = () => { if(box.classList.contains('open')){ box.classList.remove('open'); return; } box.classList.add('open'); }; box.prepend(cur); cur.classList.add('cur'); }; }
// softer fill: the edge rows/columns are first shrunk to 16 samples (smooth colour bands, no streaks)
const V44T = {h:null, v:null};
function v44FillSoft(){ const bg = $('#v44Bg'), cv = $('#arcCv'); if(!bg || !cv || !cv.style.width) return; const W = innerWidth, H = innerHeight; if(bg.width !== W || bg.height !== H){ bg.width = W; bg.height = H; }
  if(!V44T.h){ V44T.h = document.createElement('canvas'); V44T.h.width = 16; V44T.h.height = 7; V44T.v = document.createElement('canvas'); V44T.v.width = 7; V44T.v.height = 16; }
  const g = bg.getContext('2d'), th = V44T.h.getContext('2d'), tv = V44T.v.getContext('2d'), r = cv.getBoundingClientRect(), x0 = Math.round(r.left), y0 = Math.round(r.top), x1 = Math.round(r.right), y1 = Math.round(r.bottom), top = (ARC.g && ARC.g.v44top != null) ? ARC.g.v44top : 40;
  th.imageSmoothingEnabled = tv.imageSmoothingEnabled = g.imageSmoothingEnabled = true; g.fillStyle = '#0b1020'; g.fillRect(0, 0, W, H);
  try {
    th.clearRect(0, 0, 16, 7); th.drawImage(cv, 0, top, AW, 6, 0, 0, 16, 3); th.drawImage(cv, 0, AH - 6, AW, 6, 0, 4, 16, 3);
    if(y0 > 0) g.drawImage(V44T.h, 0, 1, 16, 1, 0, 0, W, y0 + 1); if(y1 < H) g.drawImage(V44T.h, 0, 5, 16, 1, 0, y1 - 1, W, H - y1 + 1);
    tv.clearRect(0, 0, 7, 16); tv.drawImage(cv, 0, 0, 6, AH, 0, 0, 3, 16); tv.drawImage(cv, AW - 6, 0, 6, AH, 4, 0, 3, 16);
    if(x0 > 0) g.drawImage(V44T.v, 1, 0, 1, 16, 0, y0, x0 + 1, y1 - y0); if(x1 < W) g.drawImage(V44T.v, 5, 0, 1, 16, x1 - 1, y0, W - x1 + 1, y1 - y0);
  } catch(e){} }
v44Fill = v44FillSoft;
try { if(GAMES.balloon) GAMES.balloon.v44top = 64; } catch(e){}
