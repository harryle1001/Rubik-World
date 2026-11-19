// train/crew.js — PHỤC VỤ TRÊN TÀU: cô nhân viên đẩy xe đồ ăn đi dọc lối đi qua 6 toa (dừng ở mỗi khoang/cụm ghế),
// gặp bạn thì chào + soát vé (lần đầu mỗi chuyến), bấm ✋ "Gọi đồ" để chọn: 4 đồ uống + 4 bánh kẹo phép thuật.
// Trả bằng xu (ctx.account) sau khi trả lời đúng 1 câu đố vui (ctx.magic.ask); món mua hiện trên bàn trước ghế hoặc trên tay.
// Nút 🛎 (khi đang ngồi): gọi cô tới chỗ mình. Mỗi máy tự mô phỏng xe đẩy (không cần đồng bộ).
import * as THREE from 'three';
import { Batch } from '../academy/geo.js';
import { matV } from '../sample/palette.js';
import { loadModel } from '../models.js';
import { loadHero } from '../characters.js';
import { CARS, FLOOR, GAP } from './consist.js';
import { layout } from './coaches.js';

const MENU = [
  { id: 'cam', e: '🍊', n: 'Nước cam', p: 3, col: '#f5a623', subj: 'khoahoc', f: 'Cam giàu <b>vitamin C</b> — giúp vết thương mau lành, tăng sức đề kháng.' },
  { id: 'trasua', e: '🧋', n: 'Trà sữa trân châu', p: 5, col: '#c8a27a', subj: 'toan', f: 'Trân châu làm từ <b>bột sắn</b> (tinh bột) — nấu chín thì dẻo và trong.' },
  { id: 'socola', e: '☕', n: 'Sô-cô-la nóng', p: 5, col: '#6b3e26', subj: 'khoahoc', f: 'Sô-cô-la làm từ <b>hạt ca cao</b> — cây ca cao mọc ở vùng nhiệt đới, có cả ở Tây Nguyên.' },
  { id: 'suoi', e: '💧', n: 'Nước suối', p: 2, col: '#bfe6f2', subj: 'toan', f: 'Cơ thể em có khoảng <b>2/3 là nước</b> — mỗi ngày nên uống 6–8 cốc nước.' },
  { id: 'cupcake', e: '🧁', n: 'Bánh Mây Hồng', p: 3, m: 'food_cupcake', subj: 'toan', f: 'Bánh nở xốp nhờ <b>bột nở</b> tạo bọt khí CO₂ khi nướng nóng.' },
  { id: 'donut', e: '🍩', n: 'Donut Cầu Vồng', p: 4, m: 'food_donut', subj: 'khoahoc', f: 'Cầu vồng có <b>7 màu</b>: ánh sáng trắng tách màu khi đi qua giọt nước.' },
  { id: 'cookie', e: '🍪', n: 'Bánh Quy Chòm Sao', p: 3, m: 'food_cookie', subj: 'toan', f: 'Chòm <b>Bắc Đẩu</b> có 7 ngôi sao sáng, chỉ đường về phía bắc.' },
  { id: 'kem', e: '🍦', n: 'Kem Tuyết Lấp Lánh', p: 4, m: 'food_icecream', subj: 'khoahoc', f: 'Kem tan vì nhiệt: nước đá <b>nóng chảy ở 0 °C</b>.' },
];
const SPEED = 0.618, PAUSE = 3, OFF = CARS.map(c => c.off);

function trolleyGeo() {   // xe đẩy gỗ 0,6 × 1,0 × 1,0 m, 2 tầng khay đầy bánh kẹo, tay đẩy đồng
  const b = new Batch(), W = '#a8744a', D = '#6e4a30';
  b.box(-0.3, 0.3, 0.12, 0.18, -0.5, 0.5, W); b.box(-0.3, 0.3, 0.62, 0.68, -0.5, 0.5, W); b.box(-0.32, 0.32, 0.98, 1.02, -0.52, 0.52, D);
  for (const x of [-0.27, 0.27]) for (const z of [-0.47, 0.47]) b.box(x - 0.03, x + 0.03, 0.06, 1.0, z - 0.03, z + 0.03, D);
  for (const x of [-0.18, 0.18]) for (const z of [-0.47, 0.47]) b.cyl(x, 0, z, 0.06, 0.12, '#2a2630', 6);
  b.box(-0.04, 0.04, 1.0, 1.25, -0.56, -0.5, '#d4a24a'); b.box(-0.3, 0.3, 1.2, 1.26, -0.56, -0.5, '#d4a24a');
  const goods = ['#f2c443', '#e0503e', '#efe3c8', '#ee93a8', '#7fbf5e', '#c8763a'];
  let k = 0; for (const y of [0.18, 0.68]) for (let i = 0; i < 6; i++) { const c = goods[k++ % 6], x = -0.2 + (i % 3) * 0.2, z = -0.3 + Math.floor(i / 3) * 0.55; b.box(x - 0.08, x + 0.08, y, y + 0.16, z - 0.1, z + 0.1, c); }
  for (const [x, z, c] of [[-0.18, 0.25, '#f5a623'], [0, 0.3, '#c8a27a'], [0.18, 0.25, '#6b3e26'], [0.1, -0.2, '#bfe6f2']]) { b.cyl(x, 1.02, z, 0.045, 0.16, '#f4f1ea', 8, 0.055); b.cyl(x, 1.17, z, 0.05, 0.005, c, 8); }   // ly đồ uống
  return b.build();
}
function cupGeo(col) {   // ly sứ có quai (không có model CC0 phù hợp): thân côn + nước màu + quai
  const b = new Batch();
  b.cyl(0, 0, 0, 0.038, 0.1, '#f4f1ea', 10, 0.046); b.cyl(0, 0.094, 0, 0.042, 0.006, col, 10);
  b.add(new THREE.TorusGeometry(0.026, 0.008, 4, 8, Math.PI), '#f4f1ea', 0.046, 0.05, 0, 0, 0, -Math.PI / 2);
  return b.build();
}

export function createCrew(ctx, { consist, interior, cabin, ride }) {
  const { player, camera } = ctx, cars = consist.cars, mv = matV();
  // ---------- tuyến tuần tra: đi qua cửa thông (x = 0) → lối đi của toa (hành lang khoang x = 1,04), dừng mỗi 2,2 m ----------
  const pts = [], stops = [];   // pts: [d (cách đầu tàu), x]
  for (let i = 2; i < cars.length; i++) {
    const Lc = layout(cars[i].type), hx = Lc.hall, zf = Lc.path[0][1], zr = Lc.path[1][1];
    pts.push([OFF[i] - zf, 0], [OFF[i] - zf + 0.4, hx]);
    for (let z = zf - 1.2; z > zr + 0.8; z -= 2.2) stops.push(OFF[i] - z);
    pts.push([OFF[i] - zr - 0.4, hx], [OFF[i] - zr, 0]);
  }
  const seg = []; let tot = 0; for (let k = 1; k < pts.length; k++) { const l = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); seg.push({ a: pts[k - 1], b: pts[k], l, s0: tot }); tot += l; }
  const pAt = s => { s = Math.max(0, Math.min(tot, s)); const g = seg.find(g => s <= g.s0 + g.l) || seg[seg.length - 1], k = (s - g.s0) / (g.l || 1); return [g.a[0] + (g.b[0] - g.a[0]) * k, g.a[1] + (g.b[1] - g.a[1]) * k]; };
  const sOfD = d => { let best = 0, bd = 1e9; for (let s = 0; s <= tot; s += 0.2) { const p = pAt(s), e = Math.abs(p[0] - d); if (e < bd) { bd = e; best = s; } } return best; };
  const stopS = stops.map(sOfD);
  const carOfD = d => { for (let i = 2; i < cars.length; i++) if (Math.abs(d - OFF[i]) <= cars[i].len / 2 + GAP / 2 + 0.01) return i; return d < OFF[2] ? 2 : cars.length - 1; };

  // ---------- xe đẩy + cô nhân viên ----------
  const T = { s: 0, dir: 1, wait: 0, nextStop: 0, mode: 'patrol', target: 0, busy: false, greeted: false, car: 2, x: 0, z: 0, yaw: 0 };
  const trolley = new THREE.Mesh(trolleyGeo(), mv); trolley.castShadow = false; trolley.visible = false;
  let staff = null;
  loadHero('student-female-a', 1.62, { role: 'adult', shirt: '#2c6455', pants: '#3a3344', hat: '#1f463c' }).then(h => { if (!h) return; staff = h; h.model.visible = false; h.anim.play('walk', 0); });
  // ---------- món đã mua: ly / bánh trên bàn hoặc trên tay ----------
  const items = [];   // { obj, seatId }
  const cupMat = matV(), cupGeos = {};
  async function makeItem(it) {
    if (it.m) { const m = await loadModel('kit/' + it.m); if (m) { m.scale.setScalar(0.9); return m; } }
    if (!cupGeos[it.id]) cupGeos[it.id] = cupGeo(it.col || '#fff');
    return new THREE.Mesh(cupGeos[it.id], cupMat);
  }
  function handBone() { let b = null; player.hero && player.hero.model.traverse(o => { if (!b && o.isBone && /handr/i.test(o.name)) b = o; }); return b; }
  async function serveItem(it) {
    const o = await makeItem(it); if (!o) return;
    const seat = cabin.state.seat;
    if (seat && seat.t) {   // đặt lên bàn trước ghế (con của toa → đi cùng tàu)
      const old = items.find(x => x.seatId === seat.id && x.slot === (it.m ? 1 : 0)); if (old) { old.obj.parent && old.obj.parent.remove(old.obj); items.splice(items.indexOf(old), 1); }
      o.position.set(seat.t.x + (it.m ? 0.12 * Math.sign(seat.t.x || 1) * -1 : 0), seat.t.y, seat.t.z + (it.m ? 0.06 : 0)); cars[seat.car].o.add(o); items.push({ obj: o, seatId: seat.id, slot: it.m ? 1 : 0 });
    } else {   // trên tay phải (bỏ món cũ trên tay)
      const hb = handBone(); if (!hb) return;
      const old = items.find(x => x.seatId === 'hand'); if (old) { old.obj.parent && old.obj.parent.remove(old.obj); items.splice(items.indexOf(old), 1); }
      const s = 1 / (hb.getWorldScale(new THREE.Vector3()).x || 1);   // bỏ tỉ lệ xương → ly đúng kích thước thật
      o.scale.multiplyScalar(s); o.position.set(0, 0.06 * s, 0.05 * s); hb.add(o); items.push({ obj: o, seatId: 'hand' });
    }
  }
  function clearItems() { for (const x of items) x.obj.parent && x.obj.parent.remove(x.obj); items.length = 0; }

  // ---------- bảng gọi đồ ----------
  const css = document.createElement('style');
  css.textContent = `#trMenu{position:fixed;inset:0;z-index:35;display:grid;place-items:center;background:#0a1220aa;padding:13px}#trMenu[hidden]{display:none}
#trMenu .card{width:min(100%,377px);max-height:calc(100vh - 26px);overflow:auto;background:#fff8ec;color:#3a2a1a;border-radius:21px;padding:16px 16px 13px;border-top:8px solid #2c6455;font:15px system-ui;box-sizing:border-box}
#trMenu h4{margin:0 0 2px;font:800 18px system-ui}#trMenu .sub{opacity:.75;font-size:13px;margin-bottom:8px}#trMenu .coin{float:right;font:800 15px system-ui;color:#8a5a00}
#trMenu .g{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:6px 0}#trMenu .g b{display:block;font:700 13px system-ui;opacity:.7;grid-column:1/-1;margin-top:4px}
#trMenu button.it{padding:8px 6px;border:2px solid #e6d6b8;border-radius:13px;background:#fff;font:700 14px system-ui;color:#3a2a1a;cursor:pointer;min-height:55px}#trMenu button.it i{display:block;font-style:normal;font-size:26px}#trMenu button.it small{color:#8a5a00}
#trMenu .x{margin-top:8px;width:100%;padding:10px;border:0;border-radius:13px;background:#efe3cc;font:700 15px system-ui}`;
  document.head.appendChild(css);
  const menu = document.createElement('div'); menu.id = 'trMenu'; menu.hidden = true; document.body.appendChild(menu);
  const coins = () => (ctx.account && ctx.account.profile ? ctx.account.coins : null);
  function openMenu() {
    T.busy = true; player.frozen = true;
    const c = coins(), btn = it => `<button class="it" data-id="${it.id}"><i>${it.e}</i>${it.n}<br><small>${it.p} 🪙</small></button>`;
    menu.innerHTML = `<div class="card"><span class="coin">🪙 ${c === null ? '—' : c}</span><h4>🛒 Xe đồ ăn Tàu Pha Lê</h4><div class="sub">Cô Lam: “Em muốn dùng gì nào? Trả lời đúng 1 câu đố vui rồi trả xu nhé!”</div>
      <div class="g"><b>🥤 Đồ uống</b>${MENU.filter(i => !i.m).map(btn).join('')}<b>✨ Bánh kẹo phép thuật</b>${MENU.filter(i => i.m).map(btn).join('')}</div><button class="x">Để sau</button></div>`;
    menu.hidden = false; ctx.sfx && ctx.sfx('ui');
    menu.querySelector('.x').onclick = closeMenu; menu.onclick = e => { if (e.target === menu) closeMenu(); };
    menu.querySelectorAll('button.it').forEach(b => b.onclick = () => order(MENU.find(i => i.id === b.dataset.id)));
  }
  function closeMenu() { menu.hidden = true; player.frozen = false; T.busy = false; T.wait = 1.5; }
  function order(it) {
    const c = coins();
    if (c === null) { closeMenu(); ctx.toast('👤 Bấm <b>Đăng nhập</b> hoặc <b>Chơi khách</b> để có ví xu nhé!', 4000); return; }
    if (c < it.p) { ctx.toast(`🪙 Cần <b>${it.p} xu</b> (em có ${c}). Giải đố ở <b>🏦 Ngân Hàng Kho Báu</b> (Phố Phép Thuật) hoặc mở rương kho báu để có thêm xu nhé!`, 5000); return; }
    menu.hidden = true;
    const pay = () => {
      if (!ctx.account.addCoins(-it.p)) { ctx.toast('Không đủ xu.', 2500); closeMenu(); return; }
      ctx.sfx && ctx.sfx('coin'); serveItem(it); staff && staff.anim.play('Interact', 0.2, true); ride.snd ? ride.snd.cup() : chime();
      ctx.toast(`${it.e} <b>${it.n}</b> — mời em! −${it.p} 🪙<br><small>${it.f}</small>`, 7000);
      let n = +(localStorage.getItem('island.trainOrders') || 0) + 1; try { localStorage.setItem('island.trainOrders', n); } catch (e) {}
      if (n === 8) setTimeout(() => ctx.toast('🏅 <b>Sành ăn Tàu Pha Lê</b>: đã gọi 8 món (8 là số Fibonacci)!', 5000), 2600);
      closeMenu();
    };
    if (ctx.magic && ctx.magic.ask) { player.frozen = true; ctx.magic.ask(it.subj, pay, `🛒 Trả lời đúng để nhận <b>${it.e} ${it.n}</b> (${it.p} 🪙)`); setTimeout(() => { if (!document.getElementById('mgCard')) { player.frozen = false; T.busy = false; } }, 400); watchCard(); }
    else pay();
  }
  function watchCard() { const id = setInterval(() => { if (!document.getElementById('mgCard')) { clearInterval(id); if (menu.hidden) { player.frozen = false; T.busy = false; } } }, 300); }
  function chime() {   // tiếng ly tách chạm khay (tổng hợp, nhỏ)
    const L = ctx.audio && ctx.audio.listener; if (!L || L.context.state !== 'running') return; const ac = L.context, t = ac.currentTime;
    for (const [f, d] of [[2637, 0], [3520, 0.09]]) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.06, t + d + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.5); o.connect(g).connect(L.getInput()); o.start(t + d); o.stop(t + d + 0.55); }
  }
  // ---------- gọi cô tới chỗ mình ----------
  function summon() {
    const cs = cabin.state; if (cs.mode !== 'seat' && cs.mode !== 'walk') return;
    const d = OFF[cs.car] - (cs.seat ? cs.seat.z : cs.z); T.mode = 'summon'; T.target = sOfD(d); T.wait = 0; ctx.toast('🛎 Đã gọi cô Lam — xe đồ ăn đang tới!', 2600);
  }

  // nút 🛎 khi đang ngồi (góc phải, trên nút hành động)
  const bell = document.createElement('button'); bell.textContent = '🛎 Gọi cô'; bell.hidden = true;
  bell.style.cssText = 'position:fixed;left:calc(50% + 89px);bottom:calc(max(13px,env(safe-area-inset-bottom)) + 8px);z-index:24;border:0;border-radius:21px;padding:10px 16px;background:#2c6455ee;color:#fff;font:700 15px system-ui;box-shadow:0 3px 13px #0005';
  bell.onclick = e => { e.stopPropagation(); summon(); }; document.body.appendChild(bell);
  // ---------- mỗi khung hình ----------
  const v = new THREE.Vector3();
  let shown = false;
  function update(dt) {
    const on = ride.riding && cabin.state.mode !== 'off' && cabin.state.mode !== 'cab';
    const bh = !(on && cabin.state.mode === 'seat' && !T.busy); if (bell.hidden !== bh) bell.hidden = bh;
    if (!on) { if (shown) { trolley.visible = false; if (staff) staff.model.visible = false; shown = false; } if (!ride.riding) { T.greeted = false; if (items.length) clearItems(); } return; }
    // di chuyển
    if (!T.busy) {
      if (T.wait > 0) T.wait -= dt;
      else if (T.mode === 'summon') { const d = T.target - T.s; if (Math.abs(d) < 0.05) { T.mode = 'patrol'; T.wait = 8; } else { T.dir = Math.sign(d); T.s += T.dir * Math.min(Math.abs(d), 1.2 * dt); } }
      else {
        const ns = T.s + T.dir * SPEED * dt, hit = stopS.find(s => (T.s - s) * (ns - s) < 0);
        T.s = Math.max(0, Math.min(tot, ns)); if (hit !== undefined) T.wait = PAUSE; if (T.s <= 0 || T.s >= tot) { T.dir = -T.dir; T.wait = PAUSE; }
      }
    }
    const [d, x] = pAt(T.s), car = carOfD(d), z = OFF[car] - d, pn = pAt(T.s + T.dir * 0.3);
    const yaw = Math.atan2(pn[1] - x, -(pn[0] - d)) || T.yaw; T.yaw = yaw;   // hướng đi trong hệ toa (z giảm khi d tăng)
    Object.assign(T, { car, x, z });
    const o = cars[car].o;
    if (trolley.parent !== o) o.add(trolley);
    trolley.position.set(x + Math.sin(yaw) * 0.75, FLOOR, z + Math.cos(yaw) * 0.75); trolley.rotation.y = yaw + Math.PI; trolley.visible = true;   // xe đi trước, cô đẩy phía sau
    if (staff) {
      if (staff.model.parent !== o) o.add(staff.model);
      staff.model.position.set(x, FLOOR, z); staff.model.rotation.y = yaw; staff.model.visible = true;
      const moving = !T.busy && T.wait <= 0; if (!staff.anim.oneShot) staff.anim.play(moving ? 'walk' : 'idle', 0.25);
      o.getWorldPosition(v); if (v.distanceToSquared(camera.position) < 21 * 21) staff.anim.update(dt);
    }
    shown = true;
    cabin.state.block = [{ car, x: trolley.position.x, z: trolley.position.z, r: 0.62 }, { car, x, z, r: 0.32 }];   // xe + cô chắn lối (đi vòng không được: chờ cô đi qua)
    // gặp người chơi: dừng lại hỏi
    const cs = cabin.state, pz = cs.seat ? cs.seat.z : cs.z, px = cs.seat ? cs.seat.x : cs.x, near = cs.car === car && Math.abs(pz - z) < 1.5 && Math.abs(px - x) < (cs.seat && cs.seat.room ? 2.6 : 1.6);   // khách trong khoang: cô đứng ở cửa khoang
    if (near && !T.busy) {
      if (T.wait < 1) T.wait = 1;   // đứng chờ trong lúc bạn ở gần
      if (!T.greeted) { T.greeted = true; T.wait = 4; staff && staff.anim.play('Interact', 0.2, true); ctx.sfx && ctx.sfx('ok'); ctx.toast(`👩‍✈️ Cô Lam: “Chào em! Cô soát vé nhé.” 🎫 <b>Vé hợp lệ</b> ✅ — ${ride.state.dir > 0 ? 'Ga đảo Rubik → Học viện Pha Lê' : 'Học viện Pha Lê → đảo Rubik'}. Chúc em đi vui!`, 5000); }
      ctx.offer('🛒 Gọi đồ ăn uống', openMenu, 10);
    }
  }
  const api = { update, summon, openMenu, menu: MENU, get state() { return T; }, debugServe: () => { const cs = cabin.state; T.s = sOfD(OFF[cs.car] - (cs.seat ? cs.seat.z : cs.z) - 1.0); T.mode = 'patrol'; T.wait = 0; return { car: cs.car, seat: cs.seat && cs.seat.id }; } };
  return api;
}
