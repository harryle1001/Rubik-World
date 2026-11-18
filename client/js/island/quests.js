// quests.js — Bảng nhiệm vụ hằng ngày (nút 📋 bên phải / phím L):
//   1) Đi tới 3 khu của hôm nay   2) Trả lời đúng 3 câu đố của thầy cô (teacher-quiz.js gọi ctx.questEvent('quiz'))
//   3) Thu thập 5 viên pha lê (8 viên rải quanh trường, vị trí đổi theo ngày; tới gần là nhặt)
//   Xong cả 3 → Nhận thưởng 34 🪙 + 💠 Pha lê Tri Thức (island.inventory, dùng chung temple/treasure). Chuỗi ngày liên tiếp 🔥.
//   Tiến độ lưu localStorage 'island.quests', tự làm mới khi sang ngày mới (giờ máy).
// φ: 3 nhiệm vụ · 5 pha lê · 8 viên rải (Fibonacci), bán kính rải 21–89 m, pha lê cao/rộng = φ, nhịp xoay 1/φ vòng/s,
//    thẻ nhiệm vụ cao 55, chữ 13/21, bo 21, thanh tiến độ 8. Đồ hoạ: 2 draw call (InstancedMesh pha lê + cột sáng).
import * as THREE from 'three';
import { PHI, BLOCKS, EXTRA, SPAWN, blocked } from './layout.js';
import { CFG } from './config.js';

const KEY = 'island.quests', INV = 'island.inventory', ZONE_POOL = ['B', 'C', 'D', 'K', 'F', 'G', 'H', 'I'];
const NEED = { zones: 3, quiz: 3, gems: 5 }, GEMS_N = 8, REWARD_XU = 34;
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

  // ---------- Giao diện: nút 📋 + bảng nhiệm vụ ----------
  const css = document.createElement('style'); css.textContent = `
#bQuest{position:relative;background:#f0a23acc!important}#bQuest i{position:absolute;right:-8px;top:-8px;min-width:21px;height:21px;padding:0 5px;box-sizing:border-box;border-radius:13px;background:#fff;color:#7a4a10;font:800 12px/21px system-ui;font-style:normal;box-shadow:0 2px 5px #0005}
#bQuest.done i{background:#3fb36b;color:#fff}#bQuest.ready{animation:qPulse 1.618s ease-in-out infinite}@keyframes qPulse{50%{box-shadow:0 0 21px #ffd23f;transform:scale(1.08)}}
#questBoard{position:fixed;inset:0;z-index:30;display:grid;place-items:center;background:#1a2a1fcc;padding:13px}
#questBoard .card{box-sizing:border-box;width:min(100%,610px);max-height:calc(100% - 26px);overflow:auto;background:#fffaf0;color:#3a2a1a;border-radius:21px;padding:13px 21px 21px;border-top:8px solid #f0a23a;font:15px/1.5 system-ui;box-shadow:0 13px 34px #0006}
#questBoard .top{display:flex;align-items:center;gap:8px}#questBoard h3{margin:0;font-size:21px;flex:1}#questBoard .coin{font:800 15px system-ui;background:#f3e3c3;border-radius:21px;padding:5px 13px}
#questBoard .x{width:44px;height:44px;border-radius:50%;border:0;background:#e8dcc6;font:800 18px system-ui;color:#5a4a3a;cursor:pointer}
#questBoard .day{margin:0 0 8px;font-size:13px;opacity:.7}
#questBoard .q{display:grid;grid-template-columns:55px 1fr;gap:3px 13px;align-items:center;padding:8px 13px;margin:8px 0;border-radius:13px;background:#f6ecd8;min-height:55px}
#questBoard .q.ok{background:#dcf5e4}#questBoard .q .ic{grid-row:span 3;font-size:34px;text-align:center}
#questBoard .q b{font-size:16px}#questBoard .q small{font-size:13px;opacity:.8;line-height:1.4}
#questBoard .bar{height:8px;border-radius:5px;background:#e6d6b6;overflow:hidden}#questBoard .bar i{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,#f0a23a,#ffd23f);transition:width .618s}
#questBoard .q.ok .bar i{background:linear-gradient(90deg,#3fb36b,#7fe0a0)}
#questBoard .tag{display:inline-block;margin:2px 5px 0 0;padding:1px 8px;border-radius:13px;background:#fff;font-size:12px}#questBoard .tag.ok{background:#3fb36b;color:#fff}
#questBoard .rw{margin-top:13px;padding:13px;border-radius:13px;background:#fff3d6;text-align:center;border:2px dashed #f0c46a}
#questBoard .rw p{margin:0 0 8px}#questBoard .claim{width:100%;min-height:55px;border-radius:34px;border:0;font:800 17px system-ui;background:#f0a23a;color:#2a1a0a;cursor:pointer}
#questBoard .claim:disabled{background:#e8dcc6;color:#9a8a76;cursor:default}
@media(max-width:420px){#questBoard h3{font-size:18px}#questBoard .card{padding:13px 13px 21px}#questBoard .q{grid-template-columns:34px 1fr;padding:8px}#questBoard .q .ic{font-size:26px}}`;
  document.head.appendChild(css);
  const btn = document.createElement('button'); btn.id = 'bQuest'; btn.title = 'Nhiệm vụ hôm nay (L)'; btn.innerHTML = '📋<i></i>';
  const vb = document.querySelector('.vbtns'); vb ? vb.prepend(btn) : document.body.appendChild(btn);
  const el = document.createElement('div'); el.id = 'questBoard'; el.hidden = true; document.body.appendChild(el);

  const prog = () => ({ zones: Math.min(NEED.zones, S.zones.length), quiz: Math.min(NEED.quiz, S.quiz), gems: Math.min(NEED.gems, S.gems.length) });
  const doneCount = () => { const p = prog(); return (p.zones >= NEED.zones) + (p.quiz >= NEED.quiz) + (p.gems >= NEED.gems); };
  const coins = () => load(INV, {}).xu?.n || 0;
  function badge() { const n = doneCount(); btn.querySelector('i').textContent = S.claimed ? '✓' : `${n}/3`; btn.classList.toggle('done', S.claimed); btn.classList.toggle('ready', n === 3 && !S.claimed); }
  function nearestGem() { const p = ctx.player.pos; let b = null, bd = 1e9; gemPos.forEach((g, i) => { if (!gemLeft(i)) return; const d = Math.hypot(g[0] - p.x, g[1] - p.z); if (d < bd) { bd = d; b = g; } }); return b && `gần nhất: ${Math.round(bd)} m về hướng ${dirName(b[0] - p.x, b[1] - p.z)}`; }
  function render() {
    const p = prog(), row = (ok, ic, title, n, need, sub) => `<div class="q${ok ? ' ok' : ''}"><span class="ic">${ok ? '✅' : ic}</span><b>${title} · ${n}/${need}</b><div class="bar"><i style="width:${n / need * 100}%"></i></div><small>${sub}</small></div>`;
    const zt = zonesToday.map(id => `<span class="tag${S.zones.includes(id) ? ' ok' : ''}">${S.zones.includes(id) ? '✓ ' : ''}${zoneById(id).name}</span>`).join('');
    const all = doneCount() === 3, ng = nearestGem();
    el.innerHTML = `<div class="card"><div class="top"><h3>📋 Nhiệm vụ hôm nay</h3><span class="coin">🪙 ${coins()}</span><button class="x" aria-label="Đóng">✕</button></div>
      <p class="day">${S.day.split('-').reverse().join('/')} · làm mới mỗi ngày${S.streak ? ` · 🔥 chuỗi ${S.streak} ngày` : ''}</p>
      ${row(p.zones >= NEED.zones, '🗺️', 'Đi tới 3 khu', p.zones, NEED.zones, zt + '<br>Bấm 🗺️ (phím M) xem bản đồ; đi xe đạp 🚲 hay khinh khí cầu 🎈 cho nhanh!')}
      ${row(p.quiz >= NEED.quiz, '📚', 'Trả lời đúng 3 câu đố', p.quiz, NEED.quiz, 'Lại gần thầy cô hoặc người dân, bấm <b>E</b> / nút <b>Nói chuyện</b>.')}
      ${row(p.gems >= NEED.gems, '💎', 'Thu thập 5 viên pha lê', p.gems, NEED.gems, p.gems >= NEED.gems ? 'Đủ rồi, giỏi quá!' : `Tìm cột sáng xanh quanh trường${ng ? ' — ' + ng : ''}.`)}
      <div class="rw"><p>🎁 Phần thưởng: <b>${REWARD_XU} 🪙</b> + <b>💠 Pha lê Tri Thức</b></p>
      <button class="claim" ${all && !S.claimed ? '' : 'disabled'}>${S.claimed ? '✓ Đã nhận — hẹn em ngày mai!' : all ? '🎉 Nhận thưởng' : `Còn ${3 - doneCount()} nhiệm vụ nữa`}</button></div></div>`;
    el.querySelector('.x').onclick = close; el.querySelector('.claim').onclick = claim;
  }
  function open() { if (ctx.player.frozen) return; render(); el.hidden = false; ctx.player.frozen = true; ctx.sfx && ctx.sfx('ui'); }
  function close() { el.hidden = true; ctx.player.frozen = false; }
  btn.onclick = () => (el.hidden ? open() : close());
  el.onclick = ev => { if (ev.target === el) close(); };
  addEventListener('keydown', ev => { if (ev.code === 'KeyL' && !ev.repeat && !(ev.target instanceof HTMLInputElement)) el.hidden ? open() : close(); else if (ev.code === 'Escape' && !el.hidden) close(); });

  function claim() {
    if (S.claimed || doneCount() < 3) return;
    const y = new Date(); y.setDate(y.getDate() - 1); const yd = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
    S.streak = S.lastClaim === yd ? (S.streak || 0) + 1 : 1; S.lastClaim = S.day; S.claimed = true; save(KEY, S);
    const inv = load(INV, {}); inv.xu = inv.xu || { icon: '🪙', n: 0 }; inv.xu.n += REWARD_XU; inv['pha-le'] = inv['pha-le'] || { icon: '💠', n: 0 }; inv['pha-le'].n++; save(INV, inv);
    ctx.sfx && ctx.sfx('win'); ctx.player.emote && ctx.player.emote('cheer'); badge(); render();
    ctx.toast(`🎉 Hoàn thành nhiệm vụ hôm nay! +${REWARD_XU} 🪙 và 💠 Pha lê Tri Thức${S.streak > 1 ? `<br>🔥 Chuỗi ${S.streak} ngày liên tiếp!` : ''}`, 5000);
  }
  function step(kind) {   // báo tiến độ ngắn + nhắc khi đủ cả 3
    save(KEY, S); badge(); if (!el.hidden) render();
    if (doneCount() === 3 && !S.claimed) setTimeout(() => ctx.toast('🎁 Xong cả 3 nhiệm vụ! Bấm 📋 để nhận thưởng.', 5000), 1618);
  }
  ctx.questEvent = kind => {
    if (kind === 'quiz' && S.quiz < NEED.quiz) { S.quiz++; ctx.toast(`📚 Đố vui: ${S.quiz}/${NEED.quiz}`, 2000); step(); }
    else if (kind === 'coins' && !el.hidden) render();
  };
  ctx.quests = { open, state: () => S, gems: () => gemPos, zones: () => zonesToday };
  badge();
  setTimeout(() => { if (!S.claimed && doneCount() === 0) ctx.toast('📋 Có <b>nhiệm vụ hôm nay</b>! Bấm nút 📋 (phím L) để xem.', 5000); }, 8000);

  let zT = 0, t = 0;
  return {
    update(dt) {
      t += dt; const p = ctx.player.pos;
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
      if ((zT -= dt) > 0) return; zT = 0.5;
      if (today() !== S.day) { fresh(); badge(); if (!el.hidden) render(); ctx.toast('🌅 Ngày mới — nhiệm vụ mới đã sẵn sàng! Bấm 📋 để xem.', 5000); return; }
      for (const id of zonesToday) if (!S.zones.includes(id) && inRect(zoneById(id).r, p.x, p.z)) { S.zones.push(id); ctx.toast(`🗺️ Đã tới <b>${zoneById(id).name}</b> (${S.zones.length}/${NEED.zones})`, 3000); step(); }
    },
  };
}
