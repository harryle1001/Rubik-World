// net.js — Multiplayer: nối đảo vào Socket.io của server (namespace /island), đồng bộ vị trí người chơi.
// Gửi vị trí 10 lần/giây; người khác được nội suy mượt và có bảng tên trên đầu. Không có chat (an toàn cho trẻ em).
import * as THREE from 'three';
import { makeHero } from './player.js';

function nameTag(text) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
  g.font = 'bold 30px system-ui'; const w = Math.min(240, g.measureText(text).width + 30);
  g.fillStyle = 'rgba(27,22,38,.7)'; g.beginPath(); g.roundRect((256 - w) / 2, 10, w, 44, 22); g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 33);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false })); s.scale.set(2, 0.5, 1); s.position.y = 2.8; return s;
}

export function createNet(ctx) {
  const others = new Map(); let sock = null;
  const status = document.getElementById('online');
  const setStatus = () => { if (status) status.textContent = sock && sock.connected ? `👥 ${others.size + 1} người trên đảo` : '⚪ Chơi một mình'; };

  function add(p) {
    if (others.has(p.id)) return;
    const h = makeHero(p.hue); h.root.add(nameTag(p.name)); ctx.scene.add(h.root);
    const o = { h, name: p.name, from: new THREE.Vector3(p.x, p.y, p.z), to: new THREE.Vector3(p.x, p.y, p.z), r: p.r, s: 0, t: 1, phase: 0 };
    h.root.position.copy(o.to); others.set(p.id, o); setStatus();
  }
  function remove(id) { const o = others.get(id); if (!o) return; ctx.scene.remove(o.h.root); others.delete(id); setStatus(); }

  // nạp thư viện client của socket.io (server tự phục vụ ở /socket.io/socket.io.js)
  // trong app (Capacitor) thư viện có sẵn ở /lib và server ở xa: window.ISLAND_SERVER
  const server = window.ISLAND_SERVER || '';
  const s = document.createElement('script'); s.src = server ? '/lib/socket.io.min.js' : '/socket.io/socket.io.js';
  s.onload = () => {
    sock = window.io(server + '/island', { transports: ['websocket', 'polling'] });
    sock.on('connect', () => { for (const id of [...others.keys()]) remove(id); sock.emit('join', { name: ctx.playerName, hue: ctx.hue }); setStatus(); });
    sock.on('disconnect', setStatus);
    sock.on('players', list => list.forEach(add));
    sock.on('joined', add);
    sock.on('left', remove);
    sock.on('m', ([id, x, y, z, r, sp]) => { const o = others.get(id); if (!o) return; o.from.copy(o.h.root.position); o.to.set(x, y, z); o.r = r; o.s = sp; o.t = 0; });
  };
  s.onerror = setStatus; document.head.appendChild(s); setStatus();

  let sendT = 0; const lastSent = new THREE.Vector3(1e9, 0, 0);
  function update(dt) {
    const p = ctx.player;
    if (sock && sock.connected && (sendT += dt) > 0.1) {
      sendT = 0;
      if (lastSent.distanceToSquared(p.pos) > 0.0004 || p.speed > 0.05) { sock.emit('m', { x: p.pos.x, y: p.pos.y, z: p.pos.z, r: p.rot, s: p.speed }); lastSent.copy(p.pos); }
    }
    for (const o of others.values()) {
      o.t = Math.min(1, o.t + dt / 0.1); const root = o.h.root;
      root.position.lerpVectors(o.from, o.to, o.t);
      let d = o.r - root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); root.rotation.y += d * Math.min(1, dt * 10);
      o.phase += dt * o.s * 2.1; const a = Math.min(1, o.s / 5.5) * 0.8;
      o.h.legL.rotation.x = Math.sin(o.phase) * a; o.h.legR.rotation.x = -Math.sin(o.phase) * a; o.h.armL.rotation.x = -Math.sin(o.phase) * a; o.h.armR.rotation.x = Math.sin(o.phase) * a;
    }
  }
  return { update, others, get connected() { return !!(sock && sock.connected); } };
}
