// ================= v70f · CẢM GIÁC & KHÔNG KHÍ 4/4: âm thanh — bước chân theo mặt đất (cỏ, đá, gỗ, cát, tuyết), mưa rơi, sấm xa, pháo hoa, chuông lên cấp =================
// Tất cả tổng hợp bằng WebAudio (không file mới). Bước chân + pháo hoa đi qua kênh Hiệu ứng (V39S.vol.sfx); mưa + sấm đi qua kênh Âm nền (AMB.vol).
// Nhạc nền theo khu + chim/sóng/gió/côn trùng đêm có sẵn (AMB / v45a, chuyển mượt setTargetAtTime) — giữ nguyên, chỉ thêm lớp mưa.
const V70F_S = {d:0, px:null, py:null, alt:0, rain:null, rainK:-1};
function v70fSfxOn(){ return typeof AC !== 'undefined' && AC && typeof V39S === 'object' && V39S.vol.sfx > 0 && AC.state === 'running'; }
function v70fNoiseHit(t, type, f, q, v, len, out, rate){
  const s = AC.createBufferSource(); s.buffer = noise(); s.playbackRate.value = rate || 1; const fl = AC.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  const g = AC.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + Math.min(.012, len*.2)); g.gain.exponentialRampToValueAtTime(.0001, t + len);
  s.connect(fl); fl.connect(g); g.connect(out); s.start(t, Math.random()*.8); s.stop(t + len + .03);
}
function v70fStep(sf){
  if(!v70fSfxOn()) return; const out = v39Bus(), t = AC.currentTime + .005, j = .85 + Math.random()*.3, alt = (V70F_S.alt ^= 1) ? 1 : .9;
  switch(sf){
    case 'grass': v70fNoiseHit(t, 'bandpass', 2600*j*alt, .9, .07, .09, out); v70fNoiseHit(t + .02, 'highpass', 5200, .5, .025, .06, out); break;
    case 'stone': v70fNoiseHit(t, 'bandpass', 1900*j*alt, 2.2, .14, .045, out); v70fNoiseHit(t, 'lowpass', 260, .8, .08, .05, out); break;
    case 'wood': { v70fNoiseHit(t, 'bandpass', 700*j*alt, 2.4, .16, .07, out); const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(170*j, t); o.frequency.exponentialRampToValueAtTime(95, t + .08);
      g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.0001, t + .09); o.connect(g); g.connect(out); o.start(t); o.stop(t + .1); break; }
    case 'sand': v70fNoiseHit(t, 'lowpass', 1300*j*alt, .6, .08, .14, out, .7); break;
    case 'snow': for(let k = 0; k < 4; k++) v70fNoiseHit(t + k*.018 + Math.random()*.01, 'bandpass', 1500 + Math.random()*1400, 3, .06, .05, out); break;
  }
}
// thay bước chân cũ (một âm k-step đổi cao độ) bằng âm theo mặt đất; nhịp theo quãng đường thật
function v70fSteps(){
  const P = typeof PLAYER !== 'undefined' ? PLAYER : null;
  if(!P || !P.visible || !P.controlled || !P.moving || P.boat || P.v16fly || P.cycling || P.mount || P.flying){ V70F_S.d = 0; V70F_S.px = null; return; }
  const p = v46Pos(P); if(V70F_S.px == null){ V70F_S.px = p[0]; V70F_S.py = p[1]; return; }
  V70F_S.d += Math.hypot(p[0] - V70F_S.px, p[1] - V70F_S.py); V70F_S.px = p[0]; V70F_S.py = p[1]; if(V70F_S.d < 36) return; V70F_S.d = 0;
  try { v70fStep(V70F_X.surf && performance.now() - (V70F_S.st || 0) < 500 ? V70F_X.surf : (V70F_S.st = performance.now(), V70F_X.surf = v70fSurf(P))); } catch(e){}
}
// lớp mưa (vòng lặp noise) — âm lượng theo kênh Âm nền và độ to của mưa; tắt khi ở trong nhà / mini game
function v70fRainTick(){
  try { if(typeof AC === 'undefined' || !AC || AC.state !== 'running' || typeof AMB !== 'object' || !AMB.started) return;
    const w = weather, k = V70F_RAIN.has(w) ? (w === 'muaphun' ? .25 : w === 'mua' ? .55 : 1) : 0, P = typeof PLAYER !== 'undefined' ? PLAYER : null;
    const inside = (typeof openModal !== 'undefined' && openModal) || document.hidden || (P && !P.boat && (() => { try { return !v46Raw(P.x) && indoor(P); } catch(e){ return false; } })());
    const want = (season === 'dong' && w === 'mua') ? 0 : k*(inside ? .25 : 1)*(AMB.on ? (AMB.vol || .5) : 0);
    if(!V70F_S.rain){ if(want <= 0) return; const g = AC.createGain(); g.gain.value = 0; g.connect(AC.destination);
      const s = AC.createBufferSource(); s.buffer = noise(); s.loop = true; const hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
      const s2 = AC.createBufferSource(); s2.buffer = noise(); s2.loop = true; s2.playbackRate.value = .5; const lp2 = AC.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 420; const g2 = AC.createGain(); g2.gain.value = .5;
      s.connect(hp); hp.connect(lp); lp.connect(g); s2.connect(lp2); lp2.connect(g2); g2.connect(g); s.start(); s2.start(); V70F_S.rain = {g, s, s2}; }
    if(Math.abs(want - V70F_S.rainK) > .01){ V70F_S.rainK = want; V70F_S.rain.g.gain.setTargetAtTime(want*.32, AC.currentTime, 1.2); }
  } catch(e){}
}
// sấm xa: tiếng ầm thấp, càng xa càng nhỏ và trầm
function v70fThunder(far){
  try { if(typeof AC === 'undefined' || !AC || AC.state !== 'running' || typeof AMB !== 'object' || !AMB.on) return; const v = (AMB.vol || .5)*(1.1 - far*.6); if(v <= 0) return;
    const t = AC.currentTime, s = AC.createBufferSource(); s.buffer = noise(); s.playbackRate.value = .35; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(380 - far*180, t); lp.frequency.exponentialRampToValueAtTime(90, t + 3);
    const g = AC.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v*.9, t + .15 + far*.3); g.gain.setTargetAtTime(v*.45, t + .6, .3); g.gain.exponentialRampToValueAtTime(.0001, t + 3.4);
    s.connect(lp); lp.connect(g); g.connect(AC.destination); s.start(t); s.stop(t + 3.6); } catch(e){}
}
// pháo hoa: tiếng nổ nhỏ + lách tách (giới hạn 3 lần/giây)
function v70fPop(){
  if(!v70fSfxOn()) return; const n = performance.now(); if(n - (V70F_S.pop || 0) < 330) return; V70F_S.pop = n;
  try { const out = v39Bus(), t = AC.currentTime + .02; v70fNoiseHit(t, 'lowpass', 500, .7, .22, .35, out, .6); for(let k = 0; k < 6; k++) v70fNoiseHit(t + .25 + k*.07 + Math.random()*.05, 'highpass', 4500, .7, .05, .03, out); } catch(e){}
}
// chuông lấp lánh khi lên cấp (thêm vào âm lên cấp có sẵn)
function v70fChime(){
  if(!v70fSfxOn()) return; try { const out = v39Bus(), t = AC.currentTime + .45; [1568, 2093, 2637, 3136].forEach((f, i) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(.0001, t + i*.07); g.gain.exponentialRampToValueAtTime(.07, t + i*.07 + .01); g.gain.exponentialRampToValueAtTime(.0001, t + i*.07 + .9); o.connect(g); g.connect(out); o.start(t + i*.07); o.stop(t + i*.07 + 1); }); } catch(e){}
}
function v70fSndInit(){
  if(typeof v39Steps === 'function'){ const s0 = v39Steps; v39Steps = function(dt){ if(!V70F.on) return s0.apply(this, arguments); v70fSteps(dt); }; }
  setInterval(v70fRainTick, 700);
}
