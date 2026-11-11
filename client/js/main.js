// Client entry: login, Socket.io wiring and the Phaser ZoneScene (one zone = one scene load).
const G = {me:null, zone:null, scene:null, plots:[], game:null, pending:null};
const NET = {socket:null, reward(kind, label){ this.socket.emit('reward', {kind, label}); }};
const SPEED = 230, AV = 2; // px/s, avatar draw scale

// ---------- login & style picker ----------
(function login(){
  const st = () => ({skin:$('lSkin').value, hair:$('lHair').value, shirt:$('lShirt').value, pants:$('lPants').value, hairStyle:$('lHairS').value, look:G.look || ''});
  LOOKS.forEach(L => { const b = document.createElement('button'); b.textContent = L.n; b.onclick = () => { G.look = L.n; $('lSkin').value = L.s.skin; $('lHair').value = L.s.hair; $('lShirt').value = L.s.shirt; $('lPants').value = L.s.pants; $('lHairS').value = L.s.hairStyle; }; $('lLooks').appendChild(b); });
  try { const s = JSON.parse(localStorage.getItem('rw_style') || 'null'); if(s){ ['Skin', 'Hair', 'Shirt', 'Pants'].forEach(k => s[k.toLowerCase()] && ($('l' + k).value = s[k.toLowerCase()])); $('lHairS').value = s.hairStyle || 'short'; } $('lName').value = localStorage.getItem('rw_name') || ''; } catch(e){}
  const c = $('lPrev').getContext('2d'); let ph = 0;
  (function anim(){ if($('login').hidden) return; ph += .15; c.clearRect(0, 0, 120, 150); drawAvatar(CG(c, 60, 135, 3.2), st(), {dir:1, phase:ph, moving:true}); requestAnimationFrame(anim); })();
  const go = () => { const name = $('lName').value.trim(); if(!name){ $('lName').focus(); $('lName').placeholder = 'Hãy nhập tên trước nhé!'; return; }
    try { localStorage.setItem('rw_name', name); localStorage.setItem('rw_style', JSON.stringify(st())); } catch(e){}
    $('lGo').disabled = true; connect(name, st()); };
  $('lGo').onclick = go; $('lName').onkeydown = e => { if(e.key === 'Enter') go(); };
  $('lName').focus();
})();

// ---------- socket ----------
function connect(name, style){
  const s = NET.socket = io();
  s.on('connect', () => { if(!G.me) s.emit('join', {name, style}); });
  s.on('welcome', d => { G.me = d.me; $('login').hidden = true; $('hud').hidden = false; UI.me(d.me); UI.board(d.leaderboard); UI.chat({sys:true, text:'Chào ' + d.me.name + '! Đi xuống cửa lớp để ra đường chính. Enter để chat.'}); startGame(d.state); });
  s.on('zoneState', st => { G.pending = null; if(G.game) G.game.scene.getScene('zone').scene.restart({state:st}); });
  s.on('joined', p => G.scene && G.scene.addOther(p));
  s.on('moved', m => { const o = G.scene && G.scene.others.get(m.id); if(o){ o.tx = m.x; o.ty = m.y; o.dir = m.dir; o.moving = m.moving; o.ride = m.ride; } });
  s.on('left', id => G.scene && G.scene.removeOther(id));
  s.on('starGone', id => G.scene && G.scene.removeStar(id));
  s.on('starNew', st => G.scene && G.scene.addStar(st));
  s.on('me', m => { G.me = Object.assign(G.me, m); UI.me(G.me); if(G.scene && G.scene.meAv){ G.scene.meAv.ride = (G.me.equip || {}).bike || null; G.scene.meAv.hat = (G.me.equip || {}).hat || null; } });
  s.on('leaderboard', UI.board);
  s.on('chat', m => { UI.chat(m); if(G.scene) G.scene.bubble(m.id, m.text); });
  s.on('system', t => UI.chat({sys:true, text:t}));
  s.on('toast', UI.toast);
  s.on('restyle', r => { const o = G.scene && (r.id === G.me.id ? G.scene.meAv : G.scene.others.get(r.id)); if(o){ o.ride = r.ride; o.hat = r.equip && r.equip.hat; } });
  s.on('plots', p => { G.plots = p; });
  s.on('challenged', UI.invited);
  s.on('chessStart', d => UI.chessGame({color:d.color, opp:d.opp, oppId:d.oppId}));
  s.on('chessMove', UI.remoteChess);
  s.on('disconnect', () => UI.chat({sys:true, text:'Mất kết nối, đang thử lại…'}));
}

// ---------- HUD ----------
$('chatForm').onsubmit = e => { e.preventDefault(); const t = $('chatIn').value.trim(); if(t) NET.socket.emit('chat', t); $('chatIn').value = ''; $('chatIn').blur(); };
$('mClose').onclick = () => UI.close();
$('bInv').onclick = () => UI.inventory(); $('bMap').onclick = () => UI.map();
$('bBike').onclick = () => { const eq = G.me.equip || {}; if(eq.bike){ G.lastBike = eq.bike; NET.socket.emit('equip', {kind:'bike', key:null}); return; } const k = G.lastBike && G.me.inv[G.lastBike] ? G.lastBike : Object.keys(G.me.inv).find(k => k.startsWith('bike_')); if(k) NET.socket.emit('equip', {kind:'bike', key:k}); else UI.toast('Bạn chưa có xe. Mua ở Trung tâm mua sắm!'); };
document.addEventListener('keydown', e => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if(e.key === 'Escape'){ if(UI.open) UI.close(); document.activeElement.blur(); }
  else if(e.key === 'Enter' && !typing && !UI.open && G.me){ e.preventDefault(); $('chatIn').focus(); }
});
const busy = () => UI.open || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);

// ---------- Phaser ----------
class Avatar {
  constructor(scene, p, isMe){
    this.scene = scene; this.id = p.id; this.name = p.name; this.style = p.style; this.x = this.tx = p.x; this.y = this.ty = p.y; this.dir = p.dir || 1; this.moving = !!p.moving; this.ride = p.ride || null; this.hat = null; this.ph = 0; this.isMe = isMe;
    this.g = scene.add.graphics(); this.tag = scene.add.text(0, 0, p.name, {fontFamily:'Segoe UI, Arial', fontSize:'14px', color:isMe ? '#ffd23f' : '#ffffff', backgroundColor:'rgba(0,0,0,.5)', padding:{x:5, y:2}}).setOrigin(.5, 1);
  }
  update(dt){
    if(!this.isMe){ const k = 1 - Math.pow(.0005, dt); this.x += (this.tx - this.x)*k; this.y += (this.ty - this.y)*k; if(Math.hypot(this.tx - this.x, this.ty - this.y) > 400){ this.x = this.tx; this.y = this.ty; } }
    if(this.moving) this.ph += dt*(this.ride ? 14 : 11);
    this.g.clear(); drawAvatar(PG(this.g, this.x, this.y, AV), this.style, {dir:this.dir, phase:this.ph, moving:this.moving, ride:this.ride, hat:this.hat});
    const top = this.y - (this.ride ? ((bikeOf(this.ride) || {}).design === 'penny' ? 120 : 96) : 80);
    this.g.setDepth(this.y); this.tag.setPosition(this.x, top).setDepth(this.y + 5000);
    if(this.bub){ this.bub.setPosition(this.x, top - 26).setDepth(this.y + 5001); }
  }
  say(t){ if(this.bub) this.bub.destroy(); this.bub = this.scene.add.text(this.x, this.y, t, {fontFamily:'Segoe UI, Arial', fontSize:'15px', color:'#1a1400', backgroundColor:'#fff8e1', padding:{x:8, y:5}, wordWrap:{width:220}}).setOrigin(.5, 1); clearTimeout(this.bt); this.bt = setTimeout(() => { if(this.bub){ this.bub.destroy(); this.bub = null; } }, 4500); }
  destroy(){ this.g.destroy(); this.tag.destroy(); if(this.bub) this.bub.destroy(); clearTimeout(this.bt); }
}
class ZoneScene extends Phaser.Scene {
  constructor(){ super('zone'); }
  init(data){ this.state = data.state; }
  create(){
    const st = this.state, Z = SHARED.ZONES[st.zone]; G.zone = st.zone; G.scene = this; this.Z = Z; UI.zone(Z.name); UI.prompt(null);
    if(st.plots) G.plots = st.plots;
    if(!this.textures.exists('puff')){ const t = this.make.graphics({x:0, y:0, add:false}); t.fillStyle(0xffffff, 1); t.fillCircle(16, 16, 16); t.generateTexture('puff', 32, 32); t.clear(); t.fillStyle(0xffffff, 1); t.fillCircle(6, 6, 6); t.generateTexture('spark', 12, 12); t.destroy(); }
    this.world = drawZone(this, Z, st.zone);
    this.others = new Map(); this.stars = new Map();
    const mine = st.players.find(p => p.id === G.me.id) || {id:G.me.id, name:G.me.name, style:G.me.style, x:Z.spawn[0], y:Z.spawn[1]};
    this.meAv = new Avatar(this, mine, true); this.meAv.ride = (G.me.equip || {}).bike || null; this.meAv.hat = (G.me.equip || {}).hat || null;
    this.me = this.meAv; // world.js reads scene.me.x / .y
    st.players.forEach(p => p.id !== G.me.id && this.addOther(p));
    st.stars.forEach(s => this.addStar(s));
    const cam = this.cameras.main; cam.setBounds(0, 0, Z.w, Z.h); cam.setZoom(Z.theme === 'interior' ? 1.15 : 1);
    this.camTarget = this.add.zone(mine.x, mine.y - 40, 1, 1); cam.startFollow(this.camTarget, true, .12, .12); cam.fadeIn(350, 0, 0, 0);
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT', false);
    this.input.keyboard.on('keydown-E', () => { if(busy() || !this.near) return; this.near.act(); });
    this.input.on('pointerdown', p => { if(busy()) return; if(this.near && Math.hypot(p.worldX - this.near.x, p.worldY - this.near.y) < this.near.r) this.near.act(); });
    this.sendT = 0; this.lastSent = ''; this.enterLock = this.time.now + 700;
    if(st.zone === 'vuon') this.plotTick = 0;
  }
  addOther(p){ if(p.id === G.me.id || this.others.has(p.id)) return; const a = new Avatar(this, p, false); this.others.set(p.id, a); }
  removeOther(id){ const a = this.others.get(id); if(a){ a.destroy(); this.others.delete(id); } }
  addStar(s){ if(this.stars.has(s.id)) return; const o = this.add.star(s.x, s.y - 20, 5, 7, 15, 0xffd23f).setStrokeStyle(2, 0xff8f00).setDepth(s.y); this.tweens.add({targets:o, angle:360, duration:3000, repeat:-1}); this.tweens.add({targets:o, y:s.y - 30, duration:800, yoyo:true, repeat:-1, ease:'Sine.easeInOut'}); o.sx = s.x; o.sy = s.y; this.stars.set(s.id, o); }
  removeStar(id){ const o = this.stars.get(id); if(o){ this.tweens.add({targets:o, scale:2, alpha:0, duration:250, onComplete:() => o.destroy()}); this.stars.delete(id); } }
  bubble(id, t){ const a = id === G.me.id ? this.meAv : this.others.get(id); if(a) a.say(t); }
  blocked(x, y){ const [x0, y0, x1, y1] = this.Z.walk; if(x < x0 || x > x1 || y < y0 || y > y1) return true; return this.world.blockers.some(([bx, by, bw, bh]) => x > bx - 8 && x < bx + bw + 8 && y > by && y < by + bh); }
  update(time, ms){
    const dt = Math.min(.05, ms/1000), a = this.meAv, k = this.keys; let vx = 0, vy = 0;
    if(!busy() && !this.missileBusy){ if(k.LEFT.isDown || k.A.isDown) vx--; if(k.RIGHT.isDown || k.D.isDown) vx++; if(k.UP.isDown || k.W.isDown) vy--; if(k.DOWN.isDown || k.S.isDown) vy++; }
    a.moving = !!(vx || vy);
    if(a.moving){ const l = Math.hypot(vx, vy), sp = SPEED*(a.ride ? 1.8 : 1)*dt; const nx = a.x + vx/l*sp, ny = a.y + vy/l*sp; if(!this.blocked(nx, a.y)) a.x = nx; if(!this.blocked(a.x, ny)) a.y = ny; if(vx) a.dir = vx; }
    if(!this.missileBusy){ this.camTarget.x = a.x; this.camTarget.y = a.y - 40; }
    a.update(dt); this.others.forEach(o => o.update(dt));
    this.world.ticks.forEach(f => f(dt));
    // network: ~15 updates/s, only when something changed
    this.sendT += dt; const sig = `${Math.round(a.x)},${Math.round(a.y)},${a.dir},${a.moving}`;
    if(this.sendT > 1/15 && sig !== this.lastSent){ this.sendT = 0; this.lastSent = sig; NET.socket.emit('move', {x:Math.round(a.x), y:Math.round(a.y), dir:a.dir, moving:a.moving}); }
    // stars
    this.stars.forEach((o, id) => { if(!o.asked && Math.hypot(o.sx - a.x, o.sy - a.y) < 40){ o.asked = true; NET.socket.emit('collect', id); Snd.tone(880, .15, .15); setTimeout(() => o.asked = false, 1500); } });
    // interactables
    let near = null, nd = 1e9; this.world.interacts.forEach(it => { const d = Math.hypot(it.x - a.x, it.y - a.y); if(d < it.r && d < nd){ nd = d; near = it; } });
    if(near !== this.near){ this.near = near; UI.prompt(near && near.label); }
    // exits
    if(time > this.enterLock && !G.pending) for(const e of this.Z.exits){ if(a.x >= e.x && a.x <= e.x + e.w && a.y >= e.y && a.y <= e.y + e.h){ G.pending = e.to; this.enterLock = time + 3000; NET.socket.emit('move', {x:Math.round(a.x), y:Math.round(a.y), dir:a.dir, moving:false}); this.cameras.main.fadeOut(250, 0, 0, 0); this.time.delayedCall(260, () => NET.socket.emit('zone', {to:e.to, x:e.at[0], y:e.at[1]})); setTimeout(() => { G.pending = null; }, 4000); break; } }
    if(this.plotG){ this.plotTick -= dt; if(this.plotTick <= 0){ this.plotTick = .5; this.drawPlots(); } }
  }
  drawPlots(){
    const g = this.plotG; g.clear(); const d = PG(g), now = Date.now();
    G.plots.forEach((pl, i) => { const x = 200 + (i % 4)*340, y = 320 + Math.floor(i/4)*230;
      d.rect(pl.owner ? '#6d4c2e' : '#a1887f', x, y, 220, 140); for(let r=0;r<4;r++) d.rect(pl.owner ? '#5d4037' : '#8d6e63', x + 6, y + 14 + r*32, 208, 8);
      d.rect('#fff8e1', x, y - 26, 220, 22, .85);
      if(pl.crop){ const C = SHARED.CROPS[pl.crop], need = C.grow*1000/(1 + pl.water*.5), f = Math.min(1, (now - pl.plantedAt)/need);
        for(let r=0;r<4;r++) for(let c=0;c<5;c++){ const px = x + 26 + c*42, py = y + 22 + r*32, h = 4 + f*20; d.line('#2e7d32', px, py, px, py - h, 2); d.ell('#43a047', px - 4, py - h*.6, 4*f + 1, 2); d.ell('#43a047', px + 4, py - h*.8, 4*f + 1, 2); if(f >= 1) d.circ(C.color, px, py - h - 2, 5); }
        d.rect('#263238', x + 10, y + 128, 200, 6); d.rect(f >= 1 ? '#ffd23f' : '#2fbf71', x + 10, y + 128, 200*f, 6);
        for(let w=0;w<pl.water;w++) d.circ('#4fc3f7', x + 196 - w*12, y + 10, 4); }
      if(!this.plotLbl) this.plotLbl = [];
      const txt = `${i + 1}. ${pl.owner ? pl.owner : 'Đất trống · ' + SHARED.PLOT_PRICE + ' xu'}${pl.crop ? ' · ' + SHARED.CROPS[pl.crop].name : ''}`;
      if(!this.plotLbl[i]) this.plotLbl[i] = this.add.text(x + 110, y - 15, txt, {fontFamily:'Segoe UI, Arial', fontSize:'13px', color:'#3e2723'}).setOrigin(.5).setDepth(4); else this.plotLbl[i].setText(txt); });
  }
}
function startGame(state){
  G.game = new Phaser.Game({type:Phaser.AUTO, parent:'game', backgroundColor:'#0a0f22', scale:{mode:Phaser.Scale.RESIZE, width:window.innerWidth, height:window.innerHeight}, render:{antialias:true}, scene:[]});
  G.game.scene.add('zone', ZoneScene, true, {state});
}
