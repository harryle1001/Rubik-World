// net.js — Multiplayer: nối đảo vào Socket.io của server (namespace /island), đồng bộ vị trí người chơi.
// Gửi vị trí 10 lần/giây; người khác được nội suy mượt và có bảng tên trên đầu. Không có chat (an toàn cho trẻ em).
import * as THREE from 'three';
import { makeHero } from './player.js';
import { loadHero, driveHero, KINDS, actorLod, stepAnim } from './characters.js';
import { T, dampV3, dampAngle } from './motion.js';

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
    const h = makeHero(p.hue), tag = nameTag(p.name); h.root.add(tag); ctx.scene.add(h.root);
    const o = { h, name: p.name, from: new THREE.Vector3(p.x, p.y, p.z), to: new THREE.Vector3(p.x, p.y, p.z), r: p.r, s: 0, t: 1, phase: 0, vel: new THREE.Vector3(), pv: new THREE.Vector3(), pred: new THREE.Vector3(), kr: { v: 0 }, age: 0, recv: 0, tag };
    h.root.position.copy(o.to); others.set(p.id, o); setStatus();
    // bộ đồ KayKit theo màu áo người đó chọn (hiệp sĩ / đạo tặc / pháp sư / chiến binh)
    loadHero(KINDS[Math.floor((p.hue || 0) / 30) % KINDS.length]).then(r => { if (!r || !others.has(p.id)) return; o.hero = r; h.body.visible = false; h.root.add(r.model); r.anim.play(r.set.idle, 0); });
  }
  // người rời đảo: giải phóng texture bảng tên + hình khối riêng của người đó (trước chỉ gỡ khỏi cảnh → rò rỉ bộ nhớ GPU mỗi lượt vào/ra;
  // lưới nhân vật KayKit dùng chung bộ nhớ đệm nên không dispose)
  function remove(id) { const o = others.get(id); if (!o) return; ctx.scene.remove(o.h.root); others.delete(id); setStatus();
    o.tag.material.map.dispose(); o.tag.material.dispose(); o.h.body.traverse(m => { if (m.isMesh) m.geometry.dispose(); }); if (o.hero) o.hero.anim.mixer?.stopAllAction?.(); }

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
    sock.on('m', ([id, x, y, z, r, sp]) => { // ước lượng vận tốc từ 2 gói liên tiếp để dự đoán giữa các gói (gói trễ không làm khựng)
      const o = others.get(id); if (!o) return; const now = performance.now() / 1000, gap = Math.min(0.5, Math.max(0.05, now - o.recv));
      o.from.copy(o.to); const vx = (x - o.to.x) / gap, vz = (z - o.to.z) / gap; if (vx * vx + vz * vz > 400) o.vel.set(0, 0, 0); else { o.vel.x += (vx - o.vel.x) * 0.382; o.vel.z += (vz - o.vel.z) * 0.382; } // lọc nhiễu (1/φ²)
      o.to.set(x, y, z); o.r = r; o.s = sp; o.t = 0; o.age = 0; o.recv = now; });
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
      o.t = Math.min(1, o.t + dt / 0.1); o.age += dt; const root = o.h.root;
      // vị trí dự đoán = gói mới nhất + vận tốc × thời gian từ gói (tối đa 1/φ³ s), hiển thị bám theo bằng lò xo; lệch > 8 m thì đặt lại
      o.pred.copy(o.vel).multiplyScalar(Math.min(o.age, 1 / 1.618 ** 3)).add(o.to);
      if (root.position.distanceToSquared(o.pred) > 64) { root.position.copy(o.pred); o.pv.set(0, 0, 0); } else dampV3(root.position, o.pred, o.pv, T.soft, dt);
      root.rotation.y = dampAngle(root.rotation.y, o.r, o.kr, T.quick, dt, 12);
      if (o.hero) {   // LOD như người trong thị trấn: viền/bóng chỉ khi gần, animation thưa dần theo khoảng cách, > 60 m đứng yên
        const d = root.position.distanceTo(ctx.player.pos); driveHero(o.hero, { speed: o.s, grounded: Math.abs(o.to.y - o.from.y) < 0.6 });
        actorLod(o.hero, o.hero.model, d); if (d < 60) stepAnim(o.hero.anim, o.an || (o.an = {}), d, dt); continue;
      }
      o.phase += dt * o.s * 2.1; const a = Math.min(1, o.s / 5.5) * 0.8;
      o.h.legL.rotation.x = Math.sin(o.phase) * a; o.h.legR.rotation.x = -Math.sin(o.phase) * a; o.h.armL.rotation.x = -Math.sin(o.phase) * a; o.h.armR.rotation.x = Math.sin(o.phase) * a;
    }
  }
  return { update, others, get connected() { return !!(sock && sock.connected); }, get sock() { return sock; } };
}
