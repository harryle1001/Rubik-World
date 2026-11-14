// temple.js — Đền Tri Thức: bia đá câu đố trước cổng. Giải đúng đủ số câu → cổng phép tan, mở rương nhận vật phẩm.
// Thêm đền mới: thêm 1 dòng vào TEMPLES. Câu đố lấy từ quiz-data.js.
import * as THREE from 'three';
import { toon, addOutline } from './style.js';
import { loadModel } from './models.js';
import { pickQuestions } from './quiz-data.js';

export const TEMPLES = [
  { id: 'den-tri-thuc', name: 'Đền Tri Thức', x: 0, z: -6, rot: 0, subjects: ['toan', 'khoahoc'], need: 3, reward: { id: 'ngoc', name: 'Ngọc Tri Thức', icon: '💎' } },
];
const SAVE = 'island.temples', INV = 'island.inventory';
const load = k => { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch (e) { return {}; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

export function createTemples(ctx) {
  const { scene, terrain } = ctx; const done = load(SAVE), inv = load(INV);
  const ui = buildUI(); const list = [];
  const invEl = document.getElementById('inv'); const showInv = () => { invEl.textContent = Object.values(inv).map(i => `${i.icon} ${i.n}`).join('  ') || ''; }; showInv();

  for (const T of TEMPLES) {
    const y = terrain.heightAt(T.x, T.z), g = new THREE.Group(); g.position.set(T.x, y, T.z); g.rotation.y = T.rot; scene.add(g);
    const stone = toon('#cfc6b4'), dark = toon('#8f8676');
    const box = (w, h, d, m, x, yy, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, yy + h / 2, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
    box(12, 0.5, 12, dark, 0, -0.3, -3);                                       // nền đá
    for (const s of [-1, 1]) { box(1, 4.2, 1, stone, s * 2.2, 0, 2); box(1.3, 0.4, 1.3, dark, s * 2.2, 4.2, 2); }
    box(5.8, 0.7, 1.2, stone, 0, 4.4, 2);                                        // xà cổng
    // màn phép chặn cổng (lung linh)
    const barrierMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uOpen: { value: done[T.id] ? 1 : 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform float uTime, uOpen; varying vec2 vUv; void main(){ float w = 0.5+0.5*sin(vUv.y*30.-uTime*3.+sin(vUv.x*12.+uTime)*2.); float a = (0.25 + 0.35*w) * (1.-uOpen) * smoothstep(0.,0.1,vUv.x)*smoothstep(1.,0.9,vUv.x); gl_FragColor = vec4(vec3(0.45,0.85,1.)*a, a); }' });
    const barrier = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 4.2), barrierMat); barrier.position.set(0, 2.1, 2); g.add(barrier);
    // bia đá câu đố
    const stele = box(1.4, 1.8, 0.4, stone, -3.6, 0, 4.6); const glyph = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ color: '#7fe3ff', transparent: true, opacity: 0.85 })); glyph.position.set(-3.6, 1.1, 4.81); g.add(glyph);
    // đền (model Blender den.glb) + rương phía sau cổng
    loadModel('den').then(m => { if (!m) return; m.scale.setScalar(2.2); m.position.set(0, 0, -5); g.add(m); addOutline(m); });
    const chest = new THREE.Group(); chest.position.set(0, 0, -1); g.add(chest);
    const cb = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.8), toon('#a8692e')); cb.position.y = 0.35; chest.add(cb);
    const lid = new THREE.Group(); lid.position.set(0, 0.7, -0.4); chest.add(lid);
    const lm = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.3, 0.84), toon('#c27a35')); lm.position.set(0, 0.15, 0.4); lid.add(lm);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.86), toon('#f2c14e')); band.position.set(0, 0.15, 0.4); lid.add(band);
    addOutline(chest);
    // va chạm: 2 cột, màn phép (khi chưa mở), tường bên của nền
    const toWorld = (lx, lz) => { const c = Math.cos(T.rot), s = Math.sin(T.rot); return { x: T.x + lx * c + lz * s, z: T.z - lx * s + lz * c }; };
    for (const s of [-1, 1]) ctx.colliders.push(Object.assign(toWorld(s * 2.2, 2), { r: 0.75 }));
    const gate = [-1.1, 0, 1.1].map(lx => Object.assign(toWorld(lx, 2), { r: 0.7 })); if (!done[T.id]) ctx.colliders.push(...gate);
    for (let lx = -5.5; lx <= 5.5; lx += 1.1) if (Math.abs(lx) > 2.8) ctx.colliders.push(Object.assign(toWorld(lx, 2), { r: 0.6 }));
    for (let lx = -5.5; lx <= 5.5; lx += 1.1) ctx.colliders.push(Object.assign(toWorld(lx, -9), { r: 0.6 }));
    for (let lz = -8.5; lz <= 2; lz += 1.1) for (const s of [-1, 1]) ctx.colliders.push(Object.assign(toWorld(s * 5.6, lz), { r: 0.6 }));
    const steleW = toWorld(-3.6, 4.6); ctx.colliders.push(Object.assign({}, steleW, { r: 0.8 }));
    list.push({ T, barrierMat, gate, glyph, lid, steleW, chestW: toWorld(0, -1), opened: !!done[T.id] + 0, chestOpen: !!done[T.id + '-chest'] });
    if (done[T.id + '-chest']) lid.rotation.x = -1.9;
  }

  // nút hành động (gần bia → Giải đố; gần rương khi cổng đã mở → Mở rương)
  const act = document.getElementById('bAct'); let target = null;
  act.onclick = () => target && target();
  addEventListener('keydown', e => { if (e.code === 'KeyE' && target) target(); });

  function solve(t) {
    ctx.player.frozen = true;
    ui.run(t.T, pickQuestions(t.T.subjects, t.T.need), ok => {
      ctx.player.frozen = false;
      if (!ok) return;
      done[t.T.id] = 1; save(SAVE, done); t.opened = 1;
      for (const c of t.gate) { const i = ctx.colliders.indexOf(c); if (i >= 0) ctx.colliders.splice(i, 1); }
      ctx.sfx && ctx.sfx('open'); ctx.toast(`🔓 ${t.T.name}: cổng đã mở! Vào lấy rương báu nào.`);
    });
  }
  function openChest(t) {
    t.chestOpen = true; done[t.T.id + '-chest'] = 1; save(SAVE, done);
    const r = t.T.reward; inv[r.id] = inv[r.id] || { icon: r.icon, n: 0 }; inv[r.id].n++; save(INV, inv); showInv();
    ctx.toast(`${r.icon} Bạn nhận được ${r.name}!`); ctx.sfx && ctx.sfx('win');
  }

  function update(dt, t) {
    const p = ctx.player.pos; target = null; let label = '';
    for (const L of list) {
      L.barrierMat.uniforms.uTime.value = t; const u = L.barrierMat.uniforms.uOpen; u.value += ((L.opened ? 1 : 0) - u.value) * Math.min(1, dt * 2);
      L.glyph.material.opacity = L.opened ? 0.25 : 0.6 + 0.3 * Math.sin(t * 3);
      if (L.chestOpen) L.lid.rotation.x += (-1.9 - L.lid.rotation.x) * Math.min(1, dt * 4);
      if (!L.opened && Math.hypot(p.x - L.steleW.x, p.z - L.steleW.z) < 2.6) { target = () => solve(L); label = '📜 Giải đố'; }
      if (L.opened && !L.chestOpen && Math.hypot(p.x - L.chestW.x, p.z - L.chestW.z) < 2.2) { target = () => openChest(L); label = '🎁 Mở rương'; }
    }
    act.hidden = !target || ui.open; act.textContent = label;
  }
  return { update };
}

// ---------- Bảng câu đố ----------
function buildUI() {
  const el = document.createElement('div'); el.id = 'quiz'; el.hidden = true; document.body.appendChild(el);
  const ui = { open: false };
  ui.run = (T, qs, cb) => {
    let i = 0, right = 0; ui.open = true; el.hidden = false;
    const show = () => {
      if (i >= qs.length) {
        const ok = right === qs.length;
        el.innerHTML = `<div class="card"><div class="big">${ok ? '🔓' : '🔒'}</div><h3>${ok ? 'Giỏi quá! Cổng phép đã tan.' : `Đúng ${right}/${qs.length} câu. Cần đúng hết để mở cổng.`}</h3><button id="qOk">${ok ? 'Vào đền' : 'Thử lại sau'}</button></div>`;
        el.querySelector('#qOk').onclick = () => { el.hidden = true; ui.open = false; cb(ok); }; return;
      }
      const q = qs[i];
      el.innerHTML = `<div class="card"><p class="sub">${T.name} · ${q.icon} ${q.subject} · Câu ${i + 1}/${qs.length}</p><h3>${q.q}</h3><div class="ch">${q.choices.map((c, k) => `<button data-k="${k}">${c}</button>`).join('')}</div><p class="ex"></p></div>`;
      el.querySelectorAll('.ch button').forEach(b => b.onclick = () => {
        const k = +b.dataset.k, ok = k === q.a; if (ok) right++;
        el.querySelectorAll('.ch button').forEach((x, j) => { x.disabled = true; if (j === q.a) x.className = 'ok'; else if (j === k) x.className = 'bad'; });
        el.querySelector('.ex').innerHTML = `${ok ? '✅ Chính xác!' : '💡 Chưa đúng.'} ${q.explain}<br><button id="qNext">Tiếp</button>`;
        el.querySelector('#qNext').onclick = () => { i++; show(); };
      });
    };
    show();
  };
  return ui;
}
