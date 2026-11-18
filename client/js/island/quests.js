// quests.js — Nhiệm vụ hằng ngày: ô HUD nhỏ 📋 góc trái (chạm / phím L mở rộng; không che cảnh, không khoá nhân vật):
//   1) Đi tới 3 khu của hôm nay   2) Trả lời đúng 3 câu đố của thầy cô (teacher-quiz.js gọi ctx.questEvent('quiz'))
//   3) Thu thập 5 viên pha lê (8 viên rải quanh trường, vị trí đổi theo ngày; tới gần là nhặt)
//   Xong cả 3 → Nhận thưởng 13 ⭐ + 💠 Pha lê Tri Thức (sao + 📒 Sổ học tập thay tiền thưởng) (island.inventory, dùng chung temple/treasure). Chuỗi ngày liên tiếp 🔥.
//   Tiến độ lưu localStorage 'island.quests', tự làm mới khi sang ngày mới (giờ máy).
// φ: 3 nhiệm vụ · 5 pha lê · 8 viên rải (Fibonacci), bán kính rải 21–89 m, pha lê cao/rộng = φ, nhịp xoay 1/φ vòng/s,
//    thẻ nhiệm vụ cao 55, chữ 13/21, bo 21, thanh tiến độ 8. Đồ hoạ: 2 draw call (InstancedMesh pha lê + cột sáng).
import * as THREE from 'three';
import { PHI, BLOCKS, EXTRA, SPAWN, blocked } from './layout.js';
import { CFG } from './config.js';

const KEY = 'island.quests', INV = 'island.inventory', ZONE_POOL = ['B', 'C', 'D', 'K', 'F', 'G', 'H', 'I'];
const NEED = { zones: 3, quiz: 3, gems: 5 }, GEMS_N = 8, REWARD_SAO = 13;
const DIRS = ['Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc', 'Bắc', 'Đông Bắc'];   // -z là hướng bắc
const dirName = (dx, dz) => DIRS[((Math.round(Math.atan2(dz, dx) / (Math.PI / 4)) % 8) + 8) % 8];
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const ZONES = [...BLOCKS, ...EXTRA];
const zoneById = id => ZONES.find(z => z.id === id);
const inRect = (r, x, z) => x > r[0] && x < r[2] && z > r[1] && z < r[3];

export function createQuests(ctx) {
  const { scene, terrain } = ctx, W = CFG.island.waterLevel;
  let S, R, zonesToday, gemPos;
  function fresh() {   // nhiệm vụ của ngày: 3 khu + vị trí pha lê, sinh từ ngày (ai cũng giống nhau trong 1 ngày)
    const day = today(), r = rng([...day].reduce((h, c) => h * 31 + c.charCodeAt(0) | 0, 7));
    const pool = ZONE_POOL.slice(); zonesToday = []; while (zonesToday.length < NEED.zones) zonesToday.push(pool.splice((r() * pool.length) | 0, 1)[0]);
    gemPos = [];
    for (let k = 0; k < 600 && gemPos.length < GEMS_N; k++) {
      const a = r() * Math.PI * 2, d = 21 + r() * 68, x = SPAWN[0] + Math.cos(a) * d, z = SPAWN[1] + Math.sin(a) * d, h = terrain.heightAt(x, z);
      if (h < W + 0.4 || terrain.slopeAt(x, z) > 0.5 || blocked(x, z, 1)) continue;
      if (gemPos.some(p => Math.hypot(p[0] - x, p[1] - z) < 13)) continue;
      if (ctx.colliders.some(c => Math.hypot(c.x - x, c.z - z) < (c.r || 1) + 0.8)) continue;
      gemPos.push([x, z, h]);
    }
    const old = load(KEY, {}), prev = old.day;
    S = old.day === day ? old : { day, zones: [], quiz: 0, gems: [], claimed: false, streak: old.streak || 0, lastClaim: old.lastClaim || null };
    if (prev !== day) save(KEY, S);
  }
  fresh();

  // ---------- Pha lê: InstancedMesh bát diện (cao = φ × rộng) + cột sáng mờ để nhìn thấy từ xa ----------
  const gemGeo = new THREE.OctahedronGeometry(0.34, 0); gemGeo.scale(1, PHI, 1);
  const gemMat = new THREE.MeshBasicMaterial({ color: '#8fe8ff', fog: true });
  const gems = new THREE.InstancedMesh(gemGeo, gemMat, GEMS_N); gems.frustumCulled = false; scene.add(gems);
  const beamGeo = new THREE.CylinderGeometry(0.08, 0.21, 8, 6, 1, true); beamGeo.translate(0, 4, 0);
  const beamMat = new THREE.MeshBasicMaterial({ color: '#a8f0ff', transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const beams = new THREE.InstancedMesh(beamGeo, beamMat, GEMS_N); beams.frustumCulled = false; scene.add(beams);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), hid = new THREE.Vector3(0, 0, 0);
  const gemLeft = i => i < gemPos.length && !S.gems.includes(i) && S.gems.length < NEED.gems;

  // ---------- Giao diện: ô HUD nhỏ góc trái (không che cảnh, không khoá nhân vật). Chạm/phím L: mở rộng xem chi tiết ----------
  const css = document.createElement('style'); css.textContent = `
#questHud{position:fixed;left:max(12px,env(safe-area-inset-left));top:calc(max(12px,env(safe-area-inset-top)) + 55px);z-index:26;box-sizing:border-box;width:min(233px,calc(100vw - 89px));background:#1b1626b8;color:#fff;border:2px solid #fff5;border-radius:13px;font:13px/1.45 system-ui;text-shadow:0 1px 2px #0008;-webkit-user-select:none;user-select:none}
#questHud button{font-family:system-ui;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
#questHud .hd{display:flex;align-items:center;gap:5px;width:100%;min-height:34px;padding:5px 8px;border:0;background:none;color:#fff;font-weight:800;font-size:13px;text-align:left}
#questHud .hd span{flex:1}#questHud .hd small{font-weight:700;opacity:.85}
#questHud .mini{display:flex;gap:8px;padding:0 8px 8px}#questHud .mini b{flex:1;font-weight:700;white-space:nowrap}
#questHud .mini b i{display:block;height:5px;margin-top:2px;border-radius:3px;background:#ffffff33;overflow:hidden}#questHud .mini b i u{display:block;height:100%;background:#ffd23f;border-radius:3px}
#questHud .mini b.ok i u{background:#5fe08f}
#questHud .more{max-height:min(50vh,377px);overflow:auto;padding:0 8px 8px;border-top:1px solid #fff3}
#questHud .more p{margin:8px 0 0}#questHud .tag{display:inline-block;margin:2px 3px 0 0;padding:0 5px;border-radius:8px;background:#fff2;font-size:12px}#questHud .tag.ok{background:#3fb36bcc}
#questHud .claim{display:block;width:100%;min-height:44px;margin-top:8px;border-radius:21px;border:0;background:#f0a23a;color:#2a1a0a;font-weight:800;font-size:14px;text-shadow:none}
#questHud.ready{border-color:#ffd23f;animation:qPulse 1.618s ease-in-out infinite}@keyframes qPulse{50%{box-shadow:0 0 21px #ffd23faa}}
#questHud.claimed{opacity:.8}
@media(max-width:420px){#questHud{top:calc(max(12px,env(safe-area-inset-top)) + 76px)}}
body.rs-modal #questHud,body.mg-on #questHud{display:none}`;
  document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'questHud'; document.body.appendChild(el);
  let open = false;

  const prog = () => ({ zones: Math.min(NEED.zones, S.zones.length), quiz: Math.min(NEED.quiz, S.quiz), gems: Math.min(NEED.gems, S.gems.length) });
  const doneCount = () => { const p = prog(); return (p.zones >= NEED.zones) + (p.quiz >= NEED.quiz) + (p.gems >= NEED.gems); };
  const coins = () => load(INV, {}).sao?.n || 0;   // ⭐ sao (teacher-quiz.js: ctx.reward)
  const bookToday = () => { const d = new Date().toDateString(); let k = 0, ok = 0; for (const b of (ctx.book ? ctx.book() : [])) if (b.d === d) { k += b.k; ok += b.ok; } return { k, ok }; };
  function nearestGem() { const p = ctx.player.pos; let b = null, bd = 1e9; gemPos.forEach((g, i) => { if (!gemLeft(i)) return; const d = Math.hypot(g[0] - p.x, g[1] - p.z); if (d < bd) { bd = d; b = g; } }); return b && `${Math.round(bd)} m về hướng ${dirName(b[0] - p.x, b[1] - p.z)}`; }
  function render() {
    const p = prog(), n = doneCount(), ready = n === 3 && !S.claimed;
    const mini = (ok, ic, v, need) => `<b class="${ok ? 'ok' : ''}">${ok ? '✅' : ic} ${v}/${need}<i><u style="width:${v / need * 100}%"></u></i></b>`;
    let h = `<button class="hd" aria-expanded="${open}"><span>📋 ${S.claimed ? 'Xong hôm nay ✓' : `Nhiệm vụ · ${n}/3`}</span><small>⭐ ${coins()}${S.streak ? ` · 🔥${S.streak}` : ''}</small> ${open ? '▴' : '▾'}</button>`;
    if (!S.claimed) h += `<div class="mini">${mini(p.zones >= NEED.zones, '🗺️', p.zones, NEED.zones)}${mini(p.quiz >= NEED.quiz, '📚', p.quiz, NEED.quiz)}${mini(p.gems >= NEED.gems, '💎', p.gems, NEED.gems)}</div>`;
    if (ready && !open) h += `<div class="more"><button class="claim">🎉 Nhận thưởng</button></div>`;
    if (open) {
      const ng = nearestGem();
      h += `<div class="more"><p>🗺️ <b>Đi tới 3 khu:</b><br>${zonesToday.map(id => `<span class="tag${S.zones.includes(id) ? ' ok' : ''}">${S.zones.includes(id) ? '✓ ' : ''}${zoneById(id).name}</span>`).join('')}</p>
        <p>📚 <b>Đúng 3 câu đố:</b> lại gần thầy cô / người dân, bấm <b>E</b>.</p>
        <p>💎 <b>Nhặt 5 pha lê</b> (cột sáng xanh)${p.gems >= NEED.gems ? ' — đủ rồi!' : ng ? `: gần nhất ${ng}.` : '.'}</p>
        <p>📒 <b>Sổ học tập hôm nay:</b> đúng ${bookToday().ok}/${bookToday().k} câu</p>
        <p>🎁 Thưởng: <b>${REWARD_SAO} ⭐ + 💠 Pha lê Tri Thức</b>${S.claimed ? ' — đã nhận, hẹn ngày mai!' : ''}</p>
        ${ready ? '<button class="claim">🎉 Nhận thưởng</button>' : ''}</div>`;
    }
    el.innerHTML = h; el.classList.toggle('ready', ready); el.classList.toggle('claimed', S.claimed);
    el.querySelector('.hd').onclick = toggle; const c = el.querySelector('.claim'); if (c) c.onclick = claim;
  }
  const badge = render;
  function toggle() { open = !open; ctx.sfx && ctx.sfx('ui'); render(); }
  addEventListener('keydown', ev => { if (ev.code === 'KeyL' && !ev.repeat && !(ev.target instanceof HTMLInputElement)) toggle(); });

  function claim() {
    if (S.claimed || doneCount() < 3) return;
    const y = new Date(); y.setDate(y.getDate() - 1); const yd = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
    S.streak = S.lastClaim === yd ? (S.streak || 0) + 1 : 1; S.lastClaim = S.day; S.claimed = true; save(KEY, S);
    const inv = load(INV, {}); inv.sao = inv.sao || { icon: '⭐', n: 0 }; inv.sao.n += REWARD_SAO; inv['pha-le'] = inv['pha-le'] || { icon: '💠', n: 0 }; inv['pha-le'].n++; save(INV, inv);
    ctx.sfx && ctx.sfx('win'); ctx.player.emote && ctx.player.emote('cheer'); open = false; render();
    ctx.toast(`🎉 Hoàn thành nhiệm vụ hôm nay! +${REWARD_SAO} ⭐ và 💠 Pha lê Tri Thức${S.streak > 1 ? `<br>🔥 Chuỗi ${S.streak} ngày liên tiếp!` : ''}`, 5000);
  }
  function step() {   // lưu + vẽ lại HUD; đủ cả 3 → nhắc nhận thưởng
    save(KEY, S); render();
    if (doneCount() === 3 && !S.claimed) setTimeout(() => ctx.toast('🎁 Xong cả 3 nhiệm vụ! Bấm <b>Nhận thưởng</b> ở ô 📋 góc trái.', 5000), 1618);
  }
  ctx.questEvent = kind => {
    if (kind === 'quiz' && S.quiz < NEED.quiz) { S.quiz++; ctx.toast(`📚 Đố vui: ${S.quiz}/${NEED.quiz}`, 2000); step(); }
    else if (kind === 'coins' || kind === 'stars') render();
  };
  ctx.quests = { toggle, claim, state: () => S, gems: () => gemPos, zones: () => zonesToday };
  render();
  setTimeout(() => { if (!S.claimed && doneCount() === 0) ctx.toast('📋 Có <b>nhiệm vụ hôm nay</b> ở góc trái! Chạm vào (phím L) để xem chi tiết.', 5000); }, 8000);

  let zT = 0, t = 0, zT2 = 0;
  return {
    update(dt) {
      t += dt; const p = ctx.player.pos;
      // ô nhiệm vụ nằm ngay dưới hàng chip (đồng hồ · tài khoản · FPS — account-hud.js), hàng chip có thể xuống dòng trên điện thoại
      if ((zT2 -= dt) <= 0) { zT2 = 1; const r = document.getElementById('chipRow'), b = r && r.offsetHeight ? Math.round(r.getBoundingClientRect().bottom + 8) + 'px' : ''; if (el.style.top !== b) el.style.top = b; }
      // pha lê: xoay 1/φ vòng/s, nhấp nhô; tới gần (≤ 1,6 m) là nhặt
      for (let i = 0; i < GEMS_N; i++) {
        const live = gemLeft(i);
        if (!live) { m4.compose(v.set(0, -999, 0), q.identity(), hid); gems.setMatrixAt(i, m4); beams.setMatrixAt(i, m4); continue; }
        const [x, z, h] = gemPos[i], y = h + 1 + Math.sin(t * 2 + i) * 0.13;
        m4.compose(v.set(x, y, z), q.setFromEuler(e.set(0, t * 2 * Math.PI / PHI + i, 0)), one); gems.setMatrixAt(i, m4);
        m4.compose(v.set(x, h, z), q.identity(), one); beams.setMatrixAt(i, m4);
        if (Math.hypot(p.x - x, p.z - z) < 1.6 && Math.abs(p.y - h) < 2.5) {
          S.gems.push(i); ctx.sfx && ctx.sfx('ok'); ctx.toast(`💎 Pha lê ${Math.min(NEED.gems, S.gems.length)}/${NEED.gems}${S.gems.length >= NEED.gems ? ' — đủ rồi!' : ''}`, 2000); step();
        }
      }
      gems.instanceMatrix.needsUpdate = beams.instanceMatrix.needsUpdate = true;
      gemMat.color.setHSL(0.53 + Math.sin(t * 1.618) * 0.04, 0.9, 0.72);
      if ((zT -= dt) > 0) return; zT = 0.5; if (open) render();   // chi tiết đang mở: cập nhật khoảng cách pha lê
      if (today() !== S.day) { fresh(); render(); ctx.toast('🌅 Ngày mới — nhiệm vụ mới đã sẵn sàng!', 5000); return; }
      for (const id of zonesToday) if (!S.zones.includes(id) && inRect(zoneById(id).r, p.x, p.z)) { S.zones.push(id); ctx.toast(`🗺️ Đã tới <b>${zoneById(id).name}</b> (${S.zones.length}/${NEED.zones})`, 3000); step(); }
    },
  };
}
