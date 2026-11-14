// ================= FISHING =================
const FISH_SEA_DAY = [['Cá thu',1.2,4],['Cá ngừ',2,8],['Cá hồng',.6,3],['Cá mú',.8,5],['Cá nục',.2,.6],['Cá chim',.4,1.5],['Cua biển',.3,1],['Sao biển',.1,.4],['Chai nhựa, nhặt lên cho biển sạch',0,0]];
const FISH_SEA_NIGHT = [['Mực ống',.3,1.2],['Mực lá',.5,2],['Cá đèn lồng',.05,.2],['Bạch tuộc',.8,3],['Cá ánh trăng',3,12]];
const FISH_POND = [['Cá rô phi',.3,1],['Cá chép',.8,3],['Cá trắm',1.5,6],['Cá koi, thả lại hồ',.5,2],['Cá trê',.6,2]];
const FS = {spot:'sea', state:'idle', t:0, wait:0, ten:0, prog:0, reel:false, catchT:0, last:null, running:false, prev:0, bag:[]};
try { FS.bag = JSON.parse(localStorage.getItem('truong-fishbag-v1') || '[]') || []; } catch(e){ FS.bag = []; }
function openFishing(spot){ showModal('mFish'); setFishSpot(spot || FS.spot); renderBag(); FS.running = true; FS.prev = performance.now(); requestAnimationFrame(fishLoop); }
function fishClose(){ FS.running = false; FS.state = 'idle'; FS.reel = false; if(!immersive) { ambient(false); $('#fsound').checked = false; } }
function setFishSpot(s){ FS.spot = s; FS.state = 'idle'; document.querySelectorAll('[data-spot]').forEach(b => b.setAttribute('aria-pressed', b.dataset.spot === s)); $('#mFishT').textContent = 'Câu cá thư giãn · ' + (s === 'sea' ? 'Bến tàu ngoài biển' : 'Hồ câu công viên'); fishMsg('Bấm Quăng câu để bắt đầu'); $('#fcast').textContent = 'Quăng câu'; }
function fishMsg(t){ $('#fstatus').textContent = t; }
function renderBag(){ const ul = $('#fbag'); ul.innerHTML = ''; FS.bag.slice(-30).reverse().forEach(f => { const li = el('li'); li.textContent = f.w ? `${f.n} · ${f.w} kg · ${f.p}` : `${f.n} · ${f.p}`; ul.appendChild(li); }); $('#fcount').textContent = FS.bag.length ? `(${FS.bag.length})` : ''; if(!FS.bag.length){ const li = el('li'); li.textContent = 'Chưa có gì. Thả câu thôi!'; ul.appendChild(li); } }
function fishCatch(){
  const night = isNight(), list = FS.spot === 'pond' ? FISH_POND : (night && Math.random() < .7 ? FISH_SEA_NIGHT : FISH_SEA_DAY);
  const [n, a, b] = pick(list), w = b ? +(a + Math.random()*(b - a)).toFixed(2) : 0;
  FS.last = {n, w}; FS.catchT = 2.6; FS.state = 'caught';
  FS.bag.push({n, w, p: FS.spot === 'sea' ? 'biển' : 'hồ'}); if(FS.bag.length > 200) FS.bag.shift();
  try { localStorage.setItem('truong-fishbag-v1', JSON.stringify(FS.bag)); } catch(e){}
  fishMsg(w ? `Bạn câu được ${n} nặng ${w} kg!` : `Bạn kéo lên: ${n}.`); renderBag(); $('#fcast').textContent = 'Quăng câu';
  if(w) mprog('fish3'); if(n.startsWith('Mực') && night) mprog('squid');
}
function fishCastBtn(){
  if(FS.state === 'idle' || FS.state === 'caught'){ FS.state = 'cast'; FS.t = 0; FS.ten = 0; FS.prog = 0; fishMsg('Đang quăng câu...'); $('#fcast').textContent = 'Giật cần!'; return; }
  if(FS.state === 'bite'){ FS.state = 'fight'; FS.t = 0; FS.prog = 20; FS.ten = 30; fishMsg('Cá mắc câu! Giữ nút kéo dây, đừng để dây quá căng.'); return; }
  if(FS.state === 'wait'){ fishMsg('Chưa có cá cắn, kiên nhẫn chờ phao chìm nhé.'); }
}
function fishReel(on){ FS.reel = on; }
function fishUpdate(dt){
  const relax = $('#frelax').checked;
  FS.t += dt;
  if(FS.state === 'cast' && FS.t > .7){ FS.state = 'wait'; FS.t = 0; FS.wait = 2 + Math.random()*5; fishMsg('Chờ cá cắn câu... thư giãn nghe sóng nhé.'); }
  else if(FS.state === 'wait' && FS.t > FS.wait){ FS.state = 'bite'; FS.t = 0; fishMsg('Phao chìm! Bấm Giật cần ngay!'); }
  else if(FS.state === 'bite' && FS.t > (relax ? 2.4 : 1.3)){ FS.state = 'idle'; fishMsg('Cá ăn mất mồi rồi. Quăng câu lại nhé.'); $('#fcast').textContent = 'Quăng câu'; }
  else if(FS.state === 'fight'){
    const surge = Math.sin(FS.t*2.3) > .85 ? 40 : 0;
    FS.ten = clamp(FS.ten + (FS.reel ? 42 : -55)*dt + surge*dt, 0, relax ? 85 : 120);
    FS.prog = clamp(FS.prog + (relax ? (FS.reel ? 20 : 6) : (FS.reel && FS.ten < 92 ? 24 : -9))*dt, 0, 100);
    if(FS.ten >= 100){ FS.state = 'idle'; fishMsg('Đứt dây mất rồi! Lần sau nhả bớt khi dây căng.'); $('#fcast').textContent = 'Quăng câu'; }
    else if(FS.prog >= 100) fishCatch();
    else if(FS.prog <= 0 && FS.t > 3){ FS.state = 'idle'; fishMsg('Cá thoát mất rồi. Thử lại nhé.'); $('#fcast').textContent = 'Quăng câu'; }
  }
  else if(FS.state === 'caught'){ FS.catchT -= dt; }
  $('#ften').style.width = FS.ten.toFixed(0) + '%'; $('#ften').style.background = FS.ten > 80 ? 'var(--cube-r)' : FS.ten > 55 ? 'var(--cube-y)' : 'var(--cube-g)';
  $('#fprog').style.width = FS.prog.toFixed(0) + '%';
}
function fishDraw(){
  const cv = $('#fishCv'), w = cv.clientWidth, h = cv.clientHeight; if(!w) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1); if(cv.width !== Math.round(w*dpr)){ cv.width = Math.round(w*dpr); cv.height = Math.round(h*dpr); }
  const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const night = isNight(), pond = FS.spot === 'pond', hz = h*.32;
  const sky = g.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, night ? '#0b1030' : '#7ec8f2'); sky.addColorStop(1, night ? '#1d2a5a' : '#d9f1ff'); g.fillStyle = sky; g.fillRect(0, 0, w, hz);
  if(night){ g.fillStyle = '#fff'; for(let i=0;i<40;i++) g.fillRect((i*97) % w, (i*53) % hz, 2, 2); g.fillStyle = '#fff8d0'; g.beginPath(); g.arc(w*.8, hz*.35, 16, 0, Math.PI*2); g.fill(); }
  else { g.fillStyle = '#fff4b0'; g.beginPath(); g.arc(w*.82, hz*.35, 20, 0, Math.PI*2); g.fill(); }
  if(pond){ g.fillStyle = night ? '#163a2a' : '#4f9a3c'; g.fillRect(0, hz - 20, w, 24); for(let i=0;i<16;i++){ g.fillStyle = night ? '#1f4d34' : '#2e7d32'; g.beginPath(); g.moveTo(i*w/15, hz); g.lineTo(i*w/15 + 10, hz - 34 - (i%3)*8); g.lineTo(i*w/15 + 20, hz); g.fill(); } }
  else { g.fillStyle = night ? '#24304a' : '#9fb8c8'; g.fillRect(w*.08, hz - 14, 60, 8); g.fillRect(w*.55, hz - 10, 40, 6); }
  const wat = g.createLinearGradient(0, hz, 0, h); wat.addColorStop(0, pond ? (night ? '#103a40' : '#3aa0b8') : (night ? '#0d2a4a' : '#2f93d2')); wat.addColorStop(1, pond ? (night ? '#08202a' : '#1f6f82') : (night ? '#061830' : '#145a8f')); g.fillStyle = wat; g.fillRect(0, hz, w, h - hz);
  g.fillStyle = 'rgba(255,255,255,.25)'; for(let r=0;r<10;r++){ const yy = hz + 12 + r*((h - hz)/10); for(let x = ((realT*14*(r%2 ? 1 : -1)) % 60) - 60; x < w; x += 60) g.fillRect(x, yy + Math.sin(x*.05 + realT*2 + r)*2, 24, 2); }
  if(pond && !night) for(let i=0;i<6;i++){ g.fillStyle = '#4caf50'; g.beginPath(); g.ellipse((i*137) % w, hz + 40 + (i*61) % (h*.4), 14, 6, 0, 0, Math.PI*2); g.fill(); }
  for(let i=0;i<4;i++){ const fx = ((realT*(20 + i*7) + i*200) % (w + 80)) - 40, fy = hz + 60 + i*((h - hz - 120)/4); g.fillStyle = night ? 'rgba(120,255,220,.25)' : 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(fx, fy, 16, 6, 0, 0, Math.PI*2); g.fill(); }
  if(night && !pond) for(let i=0;i<40;i++){ const tw = (Math.sin(realT*2 + i) + 1)/2; g.fillStyle = `rgba(90,220,255,${.2 + tw*.6})`; g.fillRect((i*131) % w, hz + 20 + (i*71) % (h - hz - 40), 2, 2); }
  g.fillStyle = '#7a4b2a'; g.fillRect(0, h - 46, w, 46); g.fillStyle = '#5a3418'; for(let x=0;x<w;x+=34) g.fillRect(x, h - 46, 2, 46);
  const tipX = w*.42, tipY = h*.36 + (FS.state === 'fight' ? Math.sin(realT*14)*6 : 0);
  g.strokeStyle = '#3a2410'; g.lineWidth = 5; g.beginPath(); g.moveTo(w*.12, h - 10); g.quadraticCurveTo(w*.22, h*.5, tipX, tipY); g.stroke();
  let bx = w*.6, by = hz + (h - hz)*.35;
  if(FS.state === 'cast'){ const k = Math.min(1, FS.t/.7); bx = tipX + (bx - tipX)*k; by = tipY + (by - tipY)*k - Math.sin(k*Math.PI)*60; }
  if(FS.state === 'idle'){ bx = tipX; by = tipY + 40; }
  const bob = FS.state === 'wait' ? Math.sin(realT*3)*2 : FS.state === 'bite' ? 8 + Math.sin(realT*20)*4 : FS.state === 'fight' ? Math.sin(realT*9)*8 : 0;
  if(FS.state === 'fight'){ bx = w*.6 - FS.prog*.0025*w*40; by = hz + (h - hz)*(.35 + FS.prog/250); }
  g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1; g.beginPath(); g.moveTo(tipX, tipY); g.lineTo(bx, by + bob); g.stroke();
  if(FS.state !== 'idle' && FS.state !== 'caught'){ g.fillStyle = '#fff'; g.beginPath(); g.arc(bx, by + bob, 6, 0, Math.PI*2); g.fill(); g.fillStyle = '#e53935'; g.beginPath(); g.arc(bx, by + bob - 2, 6, Math.PI, 0); g.fill(); g.strokeStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(bx, by + 8, 14 + Math.sin(realT*3)*3, 4, 0, 0, Math.PI*2); g.stroke(); }
  if(FS.state === 'fight'){ g.fillStyle = 'rgba(255,255,255,.7)'; for(let i=0;i<6;i++) g.fillRect(bx - 16 + Math.random()*32, by + bob - 6 + Math.random()*12, 3, 3); }
  if(FS.state === 'caught' && FS.last && FS.catchT > 0){ const y = h*.3 + Math.sin(realT*6)*4; g.fillStyle = FS.last.n.startsWith('Mực') ? '#e0f7fa' : FS.last.w ? '#ff8a2b' : '#9fd3ff'; g.beginPath(); g.ellipse(tipX, y + 30, 26, 11, 0, 0, Math.PI*2); g.fill(); g.beginPath(); g.moveTo(tipX - 24, y + 30); g.lineTo(tipX - 40, y + 18); g.lineTo(tipX - 40, y + 42); g.fill(); g.fillStyle = '#111'; g.fillRect(tipX + 12, y + 26, 3, 3); g.font = '20px VT323, monospace'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(FS.last.n, tipX, y - 6); g.textAlign = 'left'; }
}
function fishLoop(now){ if(!FS.running) return; const dt = Math.min(.05, (now - FS.prev)/1000); FS.prev = now; fishUpdate(dt); fishDraw(); requestAnimationFrame(fishLoop); }
$('#fcast').onclick = fishCastBtn;
const reelBtn = $('#freel');
reelBtn.addEventListener('pointerdown', e => { e.preventDefault(); fishReel(true); });
['pointerup','pointerleave','pointercancel'].forEach(ev => reelBtn.addEventListener(ev, () => fishReel(false)));
document.querySelectorAll('[data-spot]').forEach(b => b.onclick = () => setFishSpot(b.dataset.spot));
$('#fsound').onchange = e => ambient(e.target.checked);

