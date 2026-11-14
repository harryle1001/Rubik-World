// Client entry: login, Socket.io wiring and the 3D zone (one zone = one scene load).
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
    const key = ($('lAdmin').value || '').trim(); try { if(key) localStorage.setItem('rw_admin', key); else localStorage.removeItem('rw_admin'); } catch(e){}
    $('lGo').disabled = true; EXTRAS.gesture(); connect(name, st(), key); };
  $('lGo').onclick = go; $('lName').onkeydown = e => { if(e.key === 'Enter') go(); };
  try { const k = localStorage.getItem('rw_admin'); if(k){ $('lAdmin').value = k; $('lAdminBox').open = true; } } catch(e){}
  $('lName').focus();
})();

// ---------- socket ----------
function connect(name, style, adminKey){
  const s = NET.socket = io();
  s.on('connect', () => { if(!G.me) s.emit('join', {name, style, adminKey}); });
  s.on('welcome', d => { applyMeta(d.meta); $('bEdit').hidden = !d.me.admin; if(d.me.admin) UI.toast('Bạn là chủ game: bấm ✏️ Sửa để chỉnh thế giới.'); G.me = d.me; $('login').hidden = true; $('hud').hidden = false; UI.me(d.me); UI.board(d.leaderboard); UI.chat({sys:true, text:'Chào ' + d.me.name + '! Đi xuống cửa lớp để ra đường chính. Enter để chat.'}); startGame(d.state); });
  s.on('zoneState', st => { G.pending = null; if(G.game && E3.models.oak) startZone(st); else if(G.game) E3.ready.then(() => startZone(st)); });
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
  s.on('props', d => { if(G.scene && d.zone === G.zone){ G.scene.state.props = d.props; propsRender(G.scene, d.props); } });
  s.on('worldMeta', m => { applyMeta(m); s.emit('refresh'); if(EDITOR.on) setTimeout(edPanel, 300); });
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

// ---------- 3D zone (Three.js) ----------
class Avatar {
  constructor(p, isMe){
    this.id = p.id; this.name = p.name; this.style = p.style; this.x = this.tx = this.lx = p.x; this.y = this.ty = this.ly = p.y; this.dir = p.dir || 1; this.moving = !!p.moving; this.ride = p.ride || null; this.hat = null; this.isMe = isMe;
    this.a3 = new Avatar3D(p.style, {name:p.name, me:isMe}); this.a3.g.position.set(this.x, 0, this.y);
  }
  update(dt){
    if(!this.isMe){ const k = 1 - Math.pow(.0005, dt); this.x += (this.tx - this.x)*k; this.y += (this.ty - this.y)*k; if(Math.hypot(this.tx - this.x, this.ty - this.y) > 400){ this.x = this.tx; this.y = this.ty; } }
    const vx = this.x - this.lx, vy = this.y - this.ly; this.lx = this.x; this.ly = this.y;
    this.a3.setRide(this.ride); this.a3.setHat(this.hat);
    if(this.isMe ? this.moving : Math.hypot(vx, vy) > .3) this.a3.faceTo(this.isMe ? this.fx : vx, this.isMe ? this.fy : vy, dt);
    this.a3.update(dt, this.moving || (!this.isMe && Math.hypot(vx, vy) > .3), this.ride ? 1.3 : 1); this.a3.g.position.set(this.x, 0, this.y);
  }
  say(t){ this.a3.say(t); }
  destroy(){ this.a3.dispose(); }
}
const KEYS = new Set();
document.addEventListener('keydown', e => { KEYS.add(e.code); if(e.code === 'KeyE' && G.scene && !busy() && G.scene.near) G.scene.near.act(); });
document.addEventListener('keyup', e => KEYS.delete(e.code)); addEventListener('blur', () => KEYS.clear());
class Zone3D {
  constructor(st){
    const Z = SHARED.ZONES[st.zone]; this.state = st; G.zone = st.zone; G.scene = this; this.Z = Z; this.onLeave = []; UI.zone(Z.name); UI.prompt(null);
    if(st.plots) G.plots = st.plots;
    this.world = drawZone(this, Z, st.zone);
    this.others = new Map(); this.stars = new Map();
    const mine = st.players.find(p => p.id === G.me.id) || {id:G.me.id, name:G.me.name, style:G.me.style, x:Z.spawn[0], y:Z.spawn[1]};
    this.meAv = new Avatar(mine, true); this.meAv.ride = (G.me.equip || {}).bike || null; this.meAv.hat = (G.me.equip || {}).hat || null; this.meAv.fx = 0; this.meAv.fy = 1;
    this.me = this.meAv;
    EXTRAS.zoneCreated(this, Z);
    propsRender(this, st.props);
    st.players.forEach(p => p.id !== G.me.id && this.addOther(p));
    st.stars.forEach(s => this.addStar(s));
    this.ring = new THREE.Mesh(new THREE.RingGeometry(26, 34, 32), new THREE.MeshBasicMaterial({color:'#ffd23f', transparent:true, opacity:.8, depthWrite:false})); this.ring.rotation.x = -Math.PI/2; this.ring.visible = false; E3.root.add(this.ring);
    this.sendT = 0; this.lastSent = ''; this.enterLock = performance.now() + 700; this.time = 0;
    E3.follow.x = mine.x; E3.follow.y = mine.y; E3.camSnap = true; E3.onUpdate = (dt, now) => this.update(dt, now); E3.fade(false, 350);
  }
  leave(){ this.onLeave.forEach(f => f()); this.others.forEach(o => o.destroy()); this.meAv.destroy(); E3.onUpdate = null; }
  addOther(p){ if(p.id === G.me.id || this.others.has(p.id)) return; const a = new Avatar(p, false); this.others.set(p.id, a); }
  removeOther(id){ const a = this.others.get(id); if(a){ a.destroy(); this.others.delete(id); } }
  addStar(s){ if(this.stars.has(s.id)) return; const sh = new THREE.Shape(); for(let i=0;i<10;i++){ const r = i % 2 ? 7 : 16, a = i*Math.PI/5 - Math.PI/2; i ? sh.lineTo(Math.cos(a)*r, Math.sin(a)*r) : sh.moveTo(Math.cos(a)*r, Math.sin(a)*r); }
    const g = new THREE.ExtrudeGeometry(sh, {depth:5, bevelEnabled:true, bevelSize:1.5, bevelThickness:1.5, bevelSegments:1}); g.center();
    const o = new THREE.Mesh(g, E3.mat('#ffd23f', {emit:.6, metal:.3, rough:.3})); o.castShadow = true; o.position.set(s.x, 34, s.y); o.sx = s.x; o.sy = s.y; o.ph = Math.random()*6; E3.root.add(o); this.stars.set(s.id, o); }
  removeStar(id){ const o = this.stars.get(id); if(o){ E3.burst(o.sx, o.sy, 34, {n:16, colors:['#ffd23f', '#fff59d'], speed:160, life:.6, size:12, grow:.3, add:true}); E3.root.remove(o); o.geometry.dispose(); this.stars.delete(id); } }
  bubble(id, t){ const a = id === G.me.id ? this.meAv : this.others.get(id); if(a) a.say(t); }
  blocked(x, y){ const [x0, y0, x1, y1] = this.Z.walk; if(x < x0 || x > x1 || y < y0 || y > y1) return true; return this.world.blockers.some(([bx, by, bw, bh]) => x > bx - 8 && x < bx + bw + 8 && y > by && y < by + bh); }
  shake(sec, mag){ E3.shake(sec, mag); }
  update(dt, now){
    this.time = now; const a = this.meAv; let vx = 0, vy = 0;
    if(!busy() && !this.missileBusy){ const K = c => KEYS.has(c); if(K('ArrowLeft') || K('KeyA')) vx--; if(K('ArrowRight') || K('KeyD')) vx++; if(K('ArrowUp') || K('KeyW')) vy--; if(K('ArrowDown') || K('KeyS')) vy++; vx += TOUCH.vx; vy += TOUCH.vy; }
    a.moving = Math.hypot(vx, vy) > .05;
    if(a.moving){ const l = Math.max(1, Math.hypot(vx, vy)), sp = SPEED*(a.ride ? 1.8 : 1)*dt; const nx = a.x + vx/l*sp, ny = a.y + vy/l*sp; if(!this.blocked(nx, a.y)) a.x = nx; if(!this.blocked(a.x, ny)) a.y = ny; a.fx = vx; a.fy = vy; if(Math.abs(vx) > .1) a.dir = vx < 0 ? -1 : 1; }
    E3.follow.x = a.x; E3.follow.y = a.y;
    a.update(dt); this.others.forEach(o => o.update(dt));
    this.world.ticks.forEach(f => f(dt));
    EXTRAS.tick(this, dt);
    this.sendT += dt; const sig = `${Math.round(a.x)},${Math.round(a.y)},${a.dir},${a.moving}`;
    if(this.sendT > 1/15 && sig !== this.lastSent){ this.sendT = 0; this.lastSent = sig; NET.socket.emit('move', {x:Math.round(a.x), y:Math.round(a.y), dir:a.dir, moving:a.moving}); }
    const t = now/1000; this.stars.forEach((o, id) => { o.rotation.y = t*2 + o.ph; o.position.y = 34 + Math.sin(t*3 + o.ph)*6; if(!o.asked && Math.hypot(o.sx - a.x, o.sy - a.y) < 40){ o.asked = true; NET.socket.emit('collect', id); Snd.tone(880, .15, .15); setTimeout(() => o.asked = false, 1500); } });
    let near = null, nd = 1e9; this.world.interacts.forEach(it => { const d = Math.hypot(it.x - a.x, it.y - a.y); if(d < it.r && d < nd){ nd = d; near = it; } });
    if(near !== this.near){ this.near = near; UI.prompt(near && near.label); }
    this.ring.visible = !!near; if(near){ this.ring.position.set(near.x, 2, near.y); const s = 1 + .12*Math.sin(t*5); this.ring.scale.set(s, s, 1); }
    if(now > this.enterLock && !G.pending) for(const e of this.Z.exits){ if(a.x >= e.x && a.x <= e.x + e.w && a.y >= e.y && a.y <= e.y + e.h){ G.pending = e.to; this.enterLock = now + 3000; NET.socket.emit('move', {x:Math.round(a.x), y:Math.round(a.y), dir:a.dir, moving:false}); E3.fade(true, 250); setTimeout(() => NET.socket.emit('zone', {to:e.to, x:e.at[0], y:e.at[1]}), 260); setTimeout(() => { if(G.pending === e.to){ G.pending = null; E3.fade(false); } }, 4000); break; } }
  }
}
// click/tap: editor placement, or act on the highlighted spot
function pointerSetup(){
  const el = E3.R.domElement; let down = null;
  el.addEventListener('pointerdown', e => { if(!G.scene || !e.isPrimary) return; const p = E3.pick(e.clientX, e.clientY); if(!p) return; down = {x:e.clientX, y:e.clientY};
    if(EDITOR.on && !UI.open){ document.activeElement && document.activeElement.blur(); if(editorPointer(G.scene, 'down', {worldX:p.x, worldY:p.y})) return; } });
  el.addEventListener('pointermove', e => { if(!down || !G.scene) return; const p = E3.pick(e.clientX, e.clientY); if(p) editorPointer(G.scene, 'move', {worldX:p.x, worldY:p.y}); });
  el.addEventListener('pointerup', e => { if(!G.scene) return; const p = E3.pick(e.clientX, e.clientY); if(p) editorPointer(G.scene, 'up', {worldX:p.x, worldY:p.y});
    if(down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8 && !EDITOR.on && !busy() && p && G.scene.near && Math.hypot(p.x - G.scene.near.x, p.y - G.scene.near.y) < G.scene.near.r + 40) G.scene.near.act(); down = null; });
}
function startZone(state){ if(G.scene) G.scene.leave(); G.scene = null; new Zone3D(state); }
function startGame(state){
  E3.boot().then(() => { E3.init($('game')); if(!G.game){ G.game = true; pointerSetup(); } startZone(state); }).catch(err => { console.error(err); UI.toast('Không tải được đồ họa 3D. Hãy thử trình duyệt Chrome hoặc Safari mới.'); });
}
edInit();
