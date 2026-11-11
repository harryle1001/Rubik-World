// Extras: touch joystick, minimap, mentor teachers ("Người Thầy Ánh Sáng"), procedural ambient sound, leaderboard lookup.
const TOUCH = {vx:0, vy:0};

// ---------- mentors: one gentle teacher per main zone ----------
const MENTORS = {
  class: {at:[1240, 700], name:'Cô Ánh Sáng', robe:'#fff8e1',
    say:[['Đức Phật dạy', 'Đừng tin điều gì chỉ vì người khác nói. Hãy tự tìm hiểu, tự thử, rồi mới hiểu thật.'], ['Ông bà ta dạy', 'Học thầy không tày học bạn. Hỏi bạn bên cạnh cũng là một cách học hay.']],
    tip:'Ra cửa phía dưới để tới đường chính. Mỗi bảng gỗ chỉ một khu mới.'},
  talent:{at:[1200, 1000], name:'Thầy Nghệ Thuật', robe:'#ede7f6',
    say:[['Chúa Jesus dạy', 'Đừng giấu ngọn đèn dưới cái thúng. Tài năng nhỏ của con cũng đáng được thắp sáng.'], ['Ông bà ta dạy', 'Có công mài sắt, có ngày nên kim. Mỗi ngày tập một chút là đủ.']],
    tip:'Đàn piano dùng phím A S D F G H J K. Rubik có 6 bước, làm chậm mà chắc.'},
  sports:{at:[1300, 250], name:'Thầy Thể Thao', robe:'#e8f5e9',
    say:[['Đức Phật dạy', 'Thắng người khác là mạnh, thắng chính mình mới là mạnh nhất.'], ['Ông bà ta dạy', 'Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao.']],
    tip:'Chạm vào bóng để sút. Đưa bóng vào khung thành hai bên sân để ghi bàn.'},
  gym:   {at:[1100, 980], name:'Võ Sư Hiền', robe:'#fafafa',
    say:[['Đức Phật dạy', 'Giận dữ như cầm hòn than nóng để ném người khác: người bị bỏng trước là mình.'], ['Chúa Jesus dạy', 'Người hiền lành là người có phúc. Võ để bảo vệ, không để bắt nạt.']],
    tip:'Đứng gần bao cát và bấm E liên tục. Combo 10 cú được thưởng xu.'},
  park:  {at:[1300, 1200], name:'Thầy Ikigai', robe:'#fff3e0',
    say:[['Ông bà ta dạy', 'Thắng không kiêu, bại không nản. Ván cờ thua là một bài học hay.'], ['Đức Phật dạy', 'Mỗi nước đi hãy nhìn cho kỹ, như người đi bộ nhìn từng bước chân.']],
    tip:'Ngồi vào bàn cờ để chơi với máy. Có bộ cờ vua thì mời được bạn bè thách đấu ở bất cứ đâu.'},
  farm:  {at:[600, 1250], name:'Bác Nông Dân Hiền', robe:'#f1f8e9',
    say:[['Chúa Jesus dạy', 'Hãy nhìn chim trời, hoa đồng nội: muôn loài đều được chăm sóc. Ta cũng chăm sóc muôn loài.'], ['Ông bà ta dạy', 'Uống nước nhớ nguồn. Ăn quả nhớ kẻ trồng cây.']],
    tip:'Đi vòng ra sau đàn cừu để giúp chó chăn cừu lùa đàn về đồng cỏ xanh.'},
  hill:  {at:[1100, 1380], name:'Thầy Thiên Văn', robe:'#e3f2fd',
    say:[['Đức Phật dạy', 'Bầu trời rộng lớn giúp ta thấy mình nhỏ bé, nên sống khiêm tốn và biết ơn.'], ['Ông bà ta dạy', 'Đi một ngày đàng, học một sàng khôn. Hãy tò mò về mọi điều.']],
    tip:'Lên đài thiên văn và bấm E ở kính viễn vọng. Ngắm đủ 8 hành tinh để được thưởng.'}
};

// ---------- procedural ambient soundscapes ----------
const AMB = {
  on:true, cur:null, nodes:[], timers:[], master:null,
  init(){ try { AMB.on = localStorage.getItem('rw_sound') !== '0'; } catch(e){} AMB.label(); },
  label(){ const b = $('bSound'); if(b) b.textContent = 'Âm thanh: ' + (AMB.on ? 'bật' : 'tắt'); },
  toggle(){ AMB.on = !AMB.on; try { localStorage.setItem('rw_sound', AMB.on ? '1' : '0'); } catch(e){} AMB.label(); const t = AMB.cur; AMB.cur = null; AMB.set(t); },
  stop(){ AMB.timers.forEach(clearInterval); AMB.timers = []; AMB.nodes.forEach(n => { try { n.stop && n.stop(); } catch(e){} try { n.disconnect(); } catch(e){} }); AMB.nodes = []; },
  ctx(){ const ac = Snd.ctx(); if(!AMB.master){ AMB.master = ac.createGain(); AMB.master.gain.value = .5; AMB.master.connect(ac.destination); } return ac; },
  noiseSrc(ac, brown){ const n = ac.sampleRate*2, b = ac.createBuffer(1, n, ac.sampleRate), x = b.getChannelData(0); let last = 0; for(let i=0;i<n;i++){ const w = Math.random()*2 - 1; if(brown){ last = (last + .02*w)/1.02; x[i] = last*3.5; } else x[i] = w; } const s = ac.createBufferSource(); s.buffer = b; s.loop = true; return s; },
  waves(ac, vol){ const s = AMB.noiseSrc(ac), f = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain(); f.type = 'lowpass'; f.frequency.value = 700; g.gain.value = vol*.6; lfo.frequency.value = .12; lg.gain.value = vol*.5; lfo.connect(lg); lg.connect(g.gain); s.connect(f); f.connect(g); g.connect(AMB.master); s.start(); lfo.start(); AMB.nodes.push(s, f, g, lfo, lg); },
  wind(ac, vol){ const s = AMB.noiseSrc(ac), f = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain(); f.type = 'bandpass'; f.frequency.value = 400; f.Q.value = .7; g.gain.value = vol; lfo.frequency.value = .07; lg.gain.value = 250; lfo.connect(lg); lg.connect(f.frequency); s.connect(f); f.connect(g); g.connect(AMB.master); s.start(); lfo.start(); AMB.nodes.push(s, f, g, lfo, lg); },
  room(ac, vol){ const s = AMB.noiseSrc(ac, true), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'lowpass'; f.frequency.value = 220; g.gain.value = vol; s.connect(f); f.connect(g); g.connect(AMB.master); s.start(); AMB.nodes.push(s, f, g); },
  chirp(ac, vol){ const t = ac.currentTime, n = 2 + Math.floor(Math.random()*4), base = 2200 + Math.random()*2200;
    for(let i=0;i<n;i++){ const o = ac.createOscillator(), g = ac.createGain(), t0 = t + i*.11; o.type = 'sine'; o.frequency.setValueAtTime(base, t0); o.frequency.exponentialRampToValueAtTime(base*(1.3 + Math.random()*.5), t0 + .06); g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + .08); o.connect(g); g.connect(AMB.master); o.start(t0); o.stop(t0 + .1); } },
  cricket(ac, vol){ const t = ac.currentTime, f = 4200 + Math.random()*500;
    for(let i=0;i<3;i++){ const o = ac.createOscillator(), g = ac.createGain(), t0 = t + i*.07; o.type = 'square'; o.frequency.value = f; g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .005); g.gain.exponentialRampToValueAtTime(.0001, t0 + .04); o.connect(g); g.connect(AMB.master); o.start(t0); o.stop(t0 + .05); } },
  every(ms, fn){ AMB.timers.push(setInterval(() => { if(Math.random() < .65) fn(); }, ms)); },
  set(theme){
    if(theme === AMB.cur) return; AMB.stop(); AMB.cur = theme; if(!AMB.on || !theme) return;
    let ac; try { ac = AMB.ctx(); } catch(e){ return; }
    const birds = v => AMB.every(1400, () => AMB.chirp(ac, v));
    switch(theme){
      case 'forest': AMB.wind(ac, .05); birds(.05); break;
      case 'park': case 'garden': case 'town': birds(.04); AMB.wind(ac, .02); break;
      case 'farm': birds(.04); AMB.wind(ac, .025); AMB.every(5000, () => Snd.tone(180 + Math.random()*40, .5, .03, 'sawtooth')); break;
      case 'beach': AMB.waves(ac, .14); AMB.every(4000, () => AMB.chirp(ac, .02)); break;
      case 'hub': AMB.waves(ac, .05); birds(.03); break;
      case 'hill': AMB.every(700, () => AMB.cricket(ac, .02)); AMB.wind(ac, .015); break;
      case 'sports': AMB.wind(ac, .03); birds(.02); break;
      default: AMB.room(ac, .05);  // class, talent, gym, mall, interior
    }
  }
};

// ---------- minimap ----------
const MINI = {
  show:true, t:0,
  init(){ try { MINI.show = localStorage.getItem('rw_mini') !== '0'; } catch(e){} MINI.apply(); },
  apply(){ const c = $('mini'); if(c) c.style.display = MINI.show ? 'block' : 'none'; },
  toggle(){ MINI.show = !MINI.show; try { localStorage.setItem('rw_mini', MINI.show ? '1' : '0'); } catch(e){} MINI.apply(); },
  resize(Z){ const c = $('mini'); if(!c) return; c.width = 206; c.height = Math.max(70, Math.min(150, Math.round(206*Z.h/Z.w))); },
  draw(scene){
    const c = $('mini'); if(!c || !MINI.show) return; const x = c.getContext('2d'), Z = scene.Z, W = c.width, H = c.height, sx = W/Z.w, sy = H/Z.h, [x0, y0, x1, y1] = Z.walk;
    x.fillStyle = '#0f1533'; x.fillRect(0, 0, W, H);
    x.fillStyle = {hub:'#2e5d2a', beach:'#a8894e', hill:'#1b3a28', forest:'#22401c', farm:'#3f6b25', park:'#3f6b25', garden:'#3f6b25', sports:'#2e6b33', town:'#3f6b25'}[Z.theme] || '#4a4560';
    x.fillRect(x0*sx, y0*sy, (x1 - x0)*sx, (y1 - y0)*sy);
    x.fillStyle = 'rgba(0,0,0,.45)'; scene.world.blockers.forEach(([bx, by, bw, bh]) => x.fillRect(bx*sx, by*sy, Math.max(1, bw*sx), Math.max(1, bh*sy)));
    x.fillStyle = '#ffd23f'; Z.exits.forEach(e => x.fillRect(e.x*sx - 1, e.y*sy - 1, Math.max(3, e.w*sx) + 2, Math.max(3, e.h*sy) + 2));
    if(scene.mentor){ x.fillStyle = '#b3e5fc'; x.beginPath(); x.arc(scene.mentor.x*sx, scene.mentor.y*sy, 2.5, 0, 7); x.fill(); }
    x.fillStyle = '#ffffff'; scene.others.forEach(o => { x.beginPath(); x.arc(o.x*sx, o.y*sy, 2.5, 0, 7); x.fill(); });
    const a = scene.meAv; x.fillStyle = '#ffd23f'; x.strokeStyle = '#1a1400'; x.lineWidth = 1.5; x.beginPath(); x.arc(a.x*sx, a.y*sy, 4, 0, 7); x.fill(); x.stroke();
  }
};

// ---------- touch controls ----------
const JOY = {
  init(){
    const touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
    if(!touch) return; document.body.classList.add('touch');
    const base = $('joy'), knob = $('joyK'); let pid = null;
    const upd = e => { const r = base.getBoundingClientRect(), cx = r.left + r.width/2, cy = r.top + r.height/2, R = r.width/2 - 14; let dx = e.clientX - cx, dy = e.clientY - cy; const l = Math.hypot(dx, dy); if(l > R){ dx *= R/l; dy *= R/l; }
      knob.style.transform = `translate(${dx}px,${dy}px)`; const m = Math.hypot(dx, dy)/R; TOUCH.vx = m < .15 ? 0 : dx/R; TOUCH.vy = m < .15 ? 0 : dy/R; };
    const end = e => { if(e.pointerId !== pid) return; pid = null; TOUCH.vx = TOUCH.vy = 0; knob.style.transform = ''; };
    base.addEventListener('pointerdown', e => { e.preventDefault(); pid = e.pointerId; try { base.setPointerCapture(pid); } catch(_){} EXTRAS.gesture(); upd(e); });
    base.addEventListener('pointermove', e => { if(e.pointerId === pid) upd(e); });
    base.addEventListener('pointerup', end); base.addEventListener('pointercancel', end);
    $('bAct').addEventListener('pointerdown', e => { e.preventDefault(); EXTRAS.gesture(); EXTRAS.act(); });
    $('bChat').onclick = () => { document.body.classList.toggle('chaton'); if(document.body.classList.contains('chaton')) $('chatIn').focus(); };
  }
};

// ---------- glue ----------
const EXTRAS = {
  gesture(){ try { const ac = Snd.ctx(); if(ac.state === 'suspended') ac.resume(); } catch(e){} if(AMB.cur && !AMB.nodes.length && !AMB.timers.length){ const t = AMB.cur; AMB.cur = null; AMB.set(t); } },
  act(){ const s = G.scene; if(!s || busy() || !s.near) return; s.near.act(); },
  mentorTalk(m){ const [a, b] = m.say[Math.floor(Math.random()*m.say.length)];
    UI.modal(m.name + ' · Người Thầy Ánh Sáng', `<p><b style="color:var(--y)">${esc(a)}:</b> ${esc(b)}</p><p class="hint">Gợi ý: ${esc(m.tip)}</p><p class="hint">Thầy luôn ở đây. Con cứ quay lại hỏi bất cứ lúc nào.</p>`); },
  zoneCreated(scene, Z){
    MINI.resize(Z); AMB.set(Z.theme);
    const m = MENTORS[Z.theme]; scene.mentor = null; if(!m) return;
    const [x, y] = m.at, halo = scene.add.circle(x, y - 70, 22, 0xfff59d, .35).setDepth(y - 1); scene.tweens.add({targets:halo, alpha:.1, scale:1.25, duration:1600, yoyo:true, repeat:-1, ease:'Sine.easeInOut'});
    const g = scene.add.graphics().setDepth(y); drawAvatar(PG(g, x, y, AV), {skin:'#f2c9a0', hair:'#eeeeee', shirt:m.robe, pants:m.robe, hairStyle:'bun'}, {dir:-1});
    scene.add.text(x, y - 84, '✦ ' + m.name, {fontFamily:'Segoe UI, Arial', fontSize:'14px', color:'#fff59d', backgroundColor:'rgba(40,30,0,.6)', padding:{x:5, y:2}}).setOrigin(.5, 1).setDepth(y + 5000);
    scene.mentor = {x, y}; scene.world.interacts.push({x, y, r:90, label:'Trò chuyện với ' + m.name, act:() => EXTRAS.mentorTalk(m)});
  },
  tick(scene, dt){ MINI.t -= dt; if(MINI.t <= 0){ MINI.t = .2; MINI.draw(scene); } }
};

// HUD wiring (DOM already parsed: scripts sit at the end of <body>)
AMB.init(); MINI.init(); JOY.init();
$('bSound').onclick = () => { EXTRAS.gesture(); AMB.toggle(); };
$('bMini').onclick = () => MINI.toggle();
document.addEventListener('keydown', e => { if((e.key === 'm' || e.key === 'M') && !busy() && G.me) MINI.toggle(); });
['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => EXTRAS.gesture(), {passive:true}));
$('lb').addEventListener('click', e => { const li = e.target.closest('li'); if(!li) return; const n = li.dataset.name;
  if(!li.classList.contains('on')) UI.toast(n + ' đang ngoại tuyến.'); else if(G.me && n === G.me.name) UI.toast('Bạn đang ở ' + SHARED.ZONES[G.zone].name + '.'); else UI.toast(`${n} đang ở: ${li.dataset.zone || 'không rõ'}`); });
