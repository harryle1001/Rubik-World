// events.js — SỰ KIỆN TOÀN TRƯỜNG trên đảo 3D (greybox: khối cơ bản, làm đẹp sau). Lịch & điểm do server quyết (server/online.js):
//  🧰 Thứ Bảy — Săn kho báu: 13 rương phát sáng (vị trí sinh từ "hạt giống" server → mọi máy giống nhau), ai mở trước được thưởng;
//     mở rương phải trả lời đúng 1 câu đố (toán / khoa học / biển).
//  🧹 Chủ nhật — Giải bay chổi: 8 vòng quanh cổng trường (bán kính 55 m ≈ 34·φ), qua vòng 0 → bấm giờ, qua 1…7 theo thứ tự rồi về vòng 0.
// Hiệu năng: rương = 1 InstancedMesh + 1 InstancedMesh cột sáng; vòng = 8 mesh dùng chung 1 hình (torus 34 đoạn).
import * as THREE from 'three';
import { SPAWN, ISLAND_R, blocked } from './layout.js';
import { pickQuestions } from './quiz-data.js';

const PHI = 1.618, N_RING = 8, RACE_R = 55;
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

export function createEvents(ctx) {
  const { scene, net, terrain } = ctx; const H = (x, z) => terrain.heightAt(x, z);
  let ev = null, chests = [], rings = [], race = null;
  // ---------- hình khối dùng chung ----------
  const chestM = new THREE.InstancedMesh(new THREE.BoxGeometry(1.3, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: '#d9a43a', emissive: '#7a4a0a', emissiveIntensity: 0.8 }), 13);
  const beamM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.34, 0.55, 21, 8, 1, true), new THREE.MeshBasicMaterial({ color: '#ffe08a', transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide }), 13);
  chestM.count = beamM.count = 0; chestM.frustumCulled = beamM.frustumCulled = false; scene.add(chestM, beamM);
  const ringG = new THREE.TorusGeometry(3, 0.21, 8, 34), ringOn = new THREE.MeshBasicMaterial({ color: '#ffd36e' }), ringOff = new THREE.MeshBasicMaterial({ color: '#7fd3ff', transparent: true, opacity: 0.55 }), ringDone = new THREE.MeshBasicMaterial({ color: '#3fb8a8', transparent: true, opacity: 0.3 });
  const broom = new THREE.Group(); { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), new THREE.MeshStandardMaterial({ color: '#8a5a2b' })); st.rotation.z = Math.PI / 2; const br = new THREE.Mesh(new THREE.ConeGeometry(0.21, 0.55, 8), new THREE.MeshStandardMaterial({ color: '#d9b45a' })); br.rotation.z = -Math.PI / 2; br.position.x = -0.95; broom.add(st, br); broom.position.set(0, 0.55, 0); broom.rotation.y = Math.PI / 2; }
  const o = new THREE.Object3D();

  // ---------- 🧰 săn kho báu ----------
  function buildChests() {
    chests = []; const R = rng(ev.seed * 13 + 7);
    for (let k = 0; k < 600 && chests.length < ev.n; k++) {
      const a = R() * Math.PI * 2, r = ISLAND_R * (0.08 + R() * 0.62), x = Math.cos(a) * r, z = Math.sin(a) * r, h = H(x, z);
      if (h > 0.6 && !blocked(x, z, 2.5) && chests.every(c => Math.hypot(c.x - x, c.z - z) > 21)) chests.push({ id: chests.length, x, y: h, z, got: ev.claimed.includes(chests.length) });
    }
    drawChests();
  }
  function drawChests() {
    let n = 0; for (const c of chests) if (!c.got) { o.position.set(c.x, c.y + 0.4, c.z); o.rotation.set(0, c.id * 2.4, 0); o.scale.setScalar(1); o.updateMatrix(); chestM.setMatrixAt(n, o.matrix); o.position.y = c.y + 10.5; o.rotation.set(0, 0, 0); o.updateMatrix(); beamM.setMatrixAt(n, o.matrix); n++; }
    chestM.count = beamM.count = n; chestM.instanceMatrix.needsUpdate = beamM.instanceMatrix.needsUpdate = true;
  }
  let asking = false;
  function ask(c) {   // học lồng vào chơi: đúng 1 câu mới mở được rương
    if (asking) return; asking = true; ctx.player.frozen = true;
    const q = pickQuestions(['toan', 'khoahoc', 'bien'], 1)[0], box = document.createElement('div'); box.id = 'evQ';
    box.style.cssText = 'position:fixed;inset:0;z-index:42;display:grid;place-items:center;background:#0a1222b3;padding:13px;font:16px/1.5 system-ui';
    box.innerHTML = `<div style="width:min(100%,377px);background:#fff8ec;color:#3a2a1a;border-radius:21px;padding:21px;border-top:8px solid #d9a43a"><small>🧰 Rương sự kiện · ${q.icon || ''} ${q.subject}</small><h3 style="margin:8px 0 13px;font-size:21px">${q.q}</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${q.choices.map((t, i) => `<button data-i="${i}" style="padding:13px 8px;border:0;border-radius:13px;background:#efe3cc;font:700 15px system-ui;cursor:pointer">${t}</button>`).join('')}</div><p class="ex" style="min-height:21px;font-size:13px"></p></div>`;
    document.body.appendChild(box);
    const done = () => { box.remove(); asking = false; ctx.player.frozen = false; };
    box.onclick = e => { const b = e.target.closest('button'); if (!b || box.dataset.d) return; box.dataset.d = 1; const ok = +b.dataset.i === q.a;
      dispatchEvent(new CustomEvent('rw-learn', { detail: { s: q.subject, ok } })); b.style.background = ok ? '#9be3a0' : '#f3c7bd';
      box.querySelector('.ex').innerHTML = ok ? '✅ Chính xác! Rương mở…' : `💡 ${q.explain || 'Chưa đúng, lần sau nhé!'}`; ctx.sfx && ctx.sfx(ok ? 'ok' : 'bad');
      setTimeout(() => { done(); if (ok) net.emit('ev', { op: 'claim', id: c.id, x: ctx.player.pos.x, z: ctx.player.pos.z }); }, ok ? 900 : 2600); };
  }
  // ---------- 🧹 giải bay chổi ----------
  function buildRings() {
    for (const r of rings) scene.remove(r.m); rings = [];
    for (let i = 0; i < N_RING; i++) {
      let a = i / N_RING * Math.PI * 2, R = RACE_R, x, z; for (let k = 0; k < 13; k++) { x = SPAWN[0] + Math.cos(a) * R; z = SPAWN[1] + Math.sin(a) * R; if (!blocked(x, z, 3)) break; R *= k % 2 ? 1 / PHI * 1.4 : PHI * 0.75; }
      const y = Math.max(H(x, z), 0) + 2.6, m = new THREE.Mesh(ringG, ringOff); m.position.set(x, y, z); m.rotation.y = -a; scene.add(m); rings.push({ m, x, y, z });
    }
    paintRings();
  }
  const paintRings = () => rings.forEach((r, i) => { r.m.material = race ? (i === race.next % N_RING ? ringOn : i < race.next ? ringDone : ringOff) : i === 0 ? ringOn : ringOff; });
  function raceHud(t) { let el = document.getElementById('evRace'); if (!t) { el && el.remove(); return; } if (!el) { el = document.createElement('div'); el.id = 'evRace'; el.style.cssText = 'position:fixed;z-index:27;left:50%;transform:translateX(-50%);top:calc(max(13px,env(safe-area-inset-top)) + 55px);padding:5px 21px;border-radius:13px;background:#1b1626cc;color:#ffd36e;font:800 21px system-ui;pointer-events:none'; document.body.appendChild(el); } el.textContent = t; }

  function apply(d) {
    ev = d; for (const r of rings) scene.remove(r.m); rings = []; chestM.count = beamM.count = 0; chests = [];
    if (race) { ctx.player.root.remove(broom); race = null; raceHud(null); }
    if (!d || !d.kind) return;
    if (d.kind === 'treasure') { buildChests(); ctx.toast(`🧰 <b>Săn kho báu</b> bắt đầu! Tìm ${d.n - d.claimed.length} rương có cột sáng vàng trên đảo.`, 6000); }
    else { buildRings(); ctx.toast('🧹 <b>Giải bay chổi</b> hôm nay! Bay qua vòng vàng gần cổng trường để xuất phát.', 6000); }
  }
  net.onHello(d => apply(d.ev));
  net.on('ev', apply);
  net.on('evClaim', d => { const c = chests.find(c => c.id === d.id); if (c && !c.got) { c.got = true; drawChests(); } if (ev) ev.claimed.push(d.id); const left = chests.filter(c => !c.got).length; ctx.toast(`🧰 <b>${String(d.by).replace(/[<>&]/g, '')}</b> vừa mở 1 rương! Còn ${left} rương.`, 3000); });

  let t = 0;
  function update(dt) {
    if (!ev || !ev.kind) return; t += dt; const p = ctx.player.pos;
    if (ev.kind === 'treasure') {
      if (chestM.count) { beamM.material.opacity = 0.3 + 0.1 * Math.sin(t * 3); }
      for (const c of chests) if (!c.got && Math.abs(c.x - p.x) < 3 && Math.abs(c.z - p.z) < 3) { ctx.offer('🧰 Mở rương sự kiện', () => ask(c), 6); break; }
    } else if (rings.length) {
      for (const r of rings) r.m.rotation.z += dt * 0.618;
      const i = race ? race.next % N_RING : 0, r = rings[i];
      if (Math.hypot(r.x - p.x, r.z - p.z) < 3.4 && p.y > r.y - 4.2 && p.y < r.y + 2) {
        if (!race) { race = { next: 1, t0: performance.now() }; ctx.player.root.add(broom); ctx.sfx && ctx.sfx('ok'); ctx.toast('🧹 Xuất phát! Bay qua vòng vàng tiếp theo.', 2500); }
        else if (race.next === N_RING) { const ms = Math.round(performance.now() - race.t0); net.emit('ev', { op: 'race', ms }); ctx.toast(`🏁 Về đích: <b>${(ms / 1000).toFixed(1)} giây</b>!`, 5000); ctx.player.root.remove(broom); race = null; raceHud(null); }
        else { race.next++; ctx.sfx && ctx.sfx('coin'); }
        paintRings();
      }
      if (race) { raceHud(`🧹 ${race.next}/${N_RING} · ${((performance.now() - race.t0) / 1000).toFixed(1)} s`); broom.position.y = 0.55 + Math.sin(t * 5) * 0.08; if (performance.now() - race.t0 > 6e5) { ctx.player.root.remove(broom); race = null; raceHud(null); paintRings(); } }
    }
  }
  return { update, get state() { return ev; }, get chests() { return chests; } };
}
