// net.js — Multiplayer: nối đảo vào Socket.io của server (namespace /island), đồng bộ vị trí người chơi.
// Gửi vị trí 10 lần/giây; người khác được nội suy mượt và có bảng tên trên đầu. Không có chat tự do (an toàn cho trẻ em):
// chỉ biểu cảm + câu nói có sẵn (server gửi danh sách, ta chỉ gửi số thứ tự) hiện thành bong bóng trên đầu (social.js dùng net.on / net.emit).
// Đăng nhập tài khoản server → token gửi kèm khi kết nối; đổi tài khoản → kết nối lại.
import * as THREE from 'three';
import { makeHero } from './player.js';
import { loadHero, driveHero, KINDS, actorLod, stepAnim } from './characters.js';
import { T, dampV3, dampAngle } from './motion.js';
import { getToken } from './data/account.js';

function nameTag(text) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
  g.font = 'bold 30px system-ui'; const w = Math.min(240, g.measureText(text).width + 30);
  g.fillStyle = 'rgba(27,22,38,.7)'; g.beginPath(); g.roundRect((256 - w) / 2, 10, w, 44, 22); g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 33);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false })); s.scale.set(2, 0.5, 1); s.position.y = 2.8; return s;
}

// bong bóng biểu cảm / câu nói mẫu trên đầu: canvas 512×128 (tỉ lệ 4:1), bo góc 34, chữ 34/55 px; hiện 3,4 s rồi mờ dần
function bubble(text, big) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
  g.font = `bold ${big ? 76 : 36}px system-ui`; const w = Math.min(500, g.measureText(text).width + 55);
  g.fillStyle = '#fff8ecee'; g.strokeStyle = '#f0a23a'; g.lineWidth = 5; g.beginPath(); g.roundRect((512 - w) / 2, 8, w, 96, 34); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(236, 102); g.lineTo(256, 124); g.lineTo(276, 102); g.fill();
  g.fillStyle = '#3a2a1a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 58);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false, transparent: true })); s.scale.set(3.2, 0.8, 1); s.position.y = 3.5; s.renderOrder = 9; return s;
}

export function createNet(ctx) {
  const others = new Map(); let sock = null; const handlers = [], bubbles = [];
  const net = { others, info: null, on(ev, f) { handlers.push([ev, f]); if (sock) sock.on(ev, f); }, emit(ev, d) { if (sock && sock.connected) sock.emit(ev, d); }, get sock() { return sock; } };
  // hiện bong bóng trên đầu người (id = socket id; id của mình → nhân vật của mình)
  net.bubble = (id, text, big) => {
    const root = sock && id === sock.id ? ctx.player.root : others.get(id) && others.get(id).h.root; if (!root) return;
    for (const b of bubbles) if (b.root === root) b.t = 99;
    const s = bubble(text, big); root.add(s); bubbles.push({ s, root, t: 0 });
  };
  const status = document.getElementById('online');
  const setStatus = () => { if (status) status.textContent = sock && sock.connected ? `👥 ${[...others.values()].filter(o => !o.cloak).length + 1} người trên đảo` : '⚪ Chơi một mình'; };

  function add(p) {
    if (others.has(p.id)) return;
    const h = makeHero(p.hue), tag = nameTag(p.name); h.root.add(tag); ctx.scene.add(h.root);
    const o = { h, name: p.name, cloak: !!p.cloak, liftOk: !!p.liftOk, from: new THREE.Vector3(p.x, p.y, p.z), to: new THREE.Vector3(p.x, p.y, p.z), r: p.r, s: 0, t: 1, phase: 0, vel: new THREE.Vector3(), pv: new THREE.Vector3(), pred: new THREE.Vector3(), kr: { v: 0 }, age: 0, recv: 0, tag };
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
    sock = window.io(server + '/island', { transports: ['websocket', 'polling'], auth: cb => cb({ token: getToken() }) });
    sock.on('connect', () => { for (const id of [...others.keys()]) remove(id); sock.emit('join', { name: ctx.playerName, hue: ctx.hue, adminKey: net.adminKey || undefined }); setStatus(); });
    sock.on('disconnect', setStatus);
    sock.on('hello', d => { net.info = d; d.players.forEach(add); for (const f of net._hello || []) f(d); });
    sock.on('pstate', d => { const o = d && others.get(d.id); if (!o) return; if ('cloak' in d) o.cloak = !!d.cloak; if ('liftOk' in d) o.liftOk = !!d.liftOk; setStatus(); });   // áo choàng tàng hình / cho bạn nâng
    sock.on('players', list => list.forEach(add));
    for (const [ev, f] of handlers) sock.on(ev, f);

    sock.on('joined', add);
    sock.on('left', remove);
    sock.on('m', ([id, x, y, z, r, sp]) => { // ước lượng vận tốc từ 2 gói liên tiếp để dự đoán giữa các gói (gói trễ không làm khựng)
      const o = others.get(id); if (!o) return; const now = performance.now() / 1000, gap = Math.min(0.5, Math.max(0.05, now - o.recv));
      o.from.copy(o.to); const vx = (x - o.to.x) / gap, vz = (z - o.to.z) / gap; if (vx * vx + vz * vz > 400) o.vel.set(0, 0, 0); else { o.vel.x += (vx - o.vel.x) * 0.382; o.vel.z += (vz - o.vel.z) * 0.382; } // lọc nhiễu (1/φ²)
      o.to.set(x, y, z); o.r = r; o.s = sp; o.t = 0; o.age = 0; o.recv = now; });
  };
  s.onerror = setStatus; document.head.appendChild(s); setStatus();
  net.reconnect = () => { if (!sock) return; sock.disconnect(); sock.connect(); };
  net.onHello = f => { (net._hello = net._hello || []).push(f); if (net.info) f(net.info); };

  let sendT = 0; const lastSent = new THREE.Vector3(1e9, 0, 0);
  function update(dt) {
    const p = ctx.player;
    if (sock && sock.connected && (sendT += dt) > 0.1) {
      sendT = 0;
      if (lastSent.distanceToSquared(p.pos) > 0.0004 || p.speed > 0.05) { sock.emit('m', { x: p.pos.x, y: p.pos.y, z: p.pos.z, r: p.rot, s: p.speed }); lastSent.copy(p.pos); }
    }
    for (let i = bubbles.length - 1; i >= 0; i--) {   // bong bóng: nổi lên nhẹ, 3,4 s rồi mờ trong 0,6 s
      const b = bubbles[i]; b.t += dt; b.s.position.y = 3.5 + Math.min(b.t, 0.3) * 0.6; b.s.material.opacity = Math.max(0, Math.min(1, (4 - b.t) / 0.6));
      if (b.t > 4) { b.root.remove(b.s); b.s.material.map.dispose(); b.s.material.dispose(); bubbles.splice(i, 1); }
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
  net.update = update; Object.defineProperty(net, 'connected', { get: () => !!(sock && sock.connected) });
  net.send = net.emit;   // tên cũ (spellbook.js)
  return net;
}
