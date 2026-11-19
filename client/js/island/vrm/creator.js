// vrm/creator.js — Trình tạo nhân vật anime: mẫu (nữ tóc dài / nữ tóc ngắn / nam), tóc, mắt, da, kính, mũ, nhà Tứ Linh,
// kiểu hiển thị (anime / chibi cho máy yếu). Xem trước 3D ở trên (61,8% màn hình — φ), bảng chọn ở dưới; lưu vào tài khoản.
// Mở: nút ☰ → 🎨 Nhân vật, hoặc ctx.creator.open(). Lưu xong gọi ctx.onAvatar(look) (vrm/player-vrm.js thay nhân vật).
import * as THREE from 'three';
import { loadVrmHero, HAIR, EYES, SKINS } from './vrm-hero.js';
import { loadAvatar, saveAvatar, houseOf } from './avatar.js';
import { HOUSES, HOUSE } from '../academy/houses-data.js';
import { PALETTE } from './vrm-outfit.js';

const CSS = `#vcr{position:fixed;inset:0;z-index:45;background:linear-gradient(#cfe3f1,#efe6d6);display:flex;flex-direction:column;font:16px/1.4 system-ui;color:#2a1e2c}
#vcr .pv{position:relative;flex:0 0 61.8%;min-height:0}#vcr canvas{width:100%;height:100%;display:block;touch-action:none}
#vcr .hd{position:absolute;left:13px;right:13px;top:max(13px,env(safe-area-inset-top));display:flex;justify-content:space-between;align-items:center;pointer-events:none}
#vcr .hd b{font:800 21px system-ui;background:#fffc;padding:5px 13px;border-radius:13px}#vcr .hd span{font:700 13px system-ui;background:#fff9;padding:5px 8px;border-radius:13px}
#vcr .ld{position:absolute;inset:auto 0 13px;text-align:center;font:700 13px system-ui;opacity:.7}
#vcr .pn{flex:1 1 38.2%;min-height:0;overflow-y:auto;background:#fff8ec;border-radius:21px 21px 0 0;box-shadow:0 -8px 21px #0002;padding:13px 13px 0}
#vcr .rw{display:flex;align-items:center;gap:8px;margin:0 0 8px;flex-wrap:wrap}#vcr .rw>i{flex:0 0 55px;font:800 13px system-ui;font-style:normal;opacity:.75}
#vcr .ch{display:flex;gap:8px;flex-wrap:wrap;flex:1}#vcr button.c{border:2px solid #e3d3b5;background:#fff;border-radius:13px;padding:6px 10px;font:700 13px system-ui;color:#2a1e2c;min-height:34px}
#vcr button.c.on{border-color:#2a1e2c;background:#ffe9b8}#vcr button.sw{width:34px;height:34px;padding:0;border-radius:50%}
#vcr button.sw.on{box-shadow:0 0 0 3px #fff8ec,0 0 0 5px #2a1e2c}#vcr .lock{font:600 12px system-ui;opacity:.65;flex-basis:100%;margin-left:63px}
#vcr .ft{position:sticky;bottom:0;display:flex;gap:8px;padding:8px 0 max(13px,env(safe-area-inset-bottom));background:#fff8ec}
#vcr .ft button{flex:1;padding:13px;border-radius:13px;border:0;font:800 16px system-ui;background:#efe3cc;color:#2a1e2c}#vcr .ft .ok{flex:1.618;background:#f0a23a}`;

export function createCreator(ctx) {
  let ui = null;
  const sw = (c, on, k, v, title = '') => `<button class="c sw${on ? ' on' : ''}" data-k="${k}" data-v="${v}" title="${title}" style="background:${c}"></button>`;
  const chip = (t, on, k, v) => `<button class="c${on ? ' on' : ''}" data-k="${k}" data-v="${v}">${t}</button>`;
  function panel(L) {
    const locked = ctx.account && ctx.account.house;
    return `<div class="rw"><i>Mẫu</i><div class="ch">${[['shino', '👧 Nữ tóc dài'], ['shibu', '👧 Nữ tóc ngắn'], ['hair-m', '👦 Nam']].map(([v, t]) => chip(t, L.base === v, 'base', v)).join('')}</div></div>
      <div class="rw"><i>Nhà</i><div class="ch">${HOUSES.map(h => `<button class="c${houseOf(ctx, L) === h.id ? ' on' : ''}" data-k="house" data-v="${h.id}"${locked ? ' disabled' : ''}><span style="display:inline-block;width:13px;height:13px;border-radius:50%;vertical-align:-2px;background:${PALETTE[h.id].robe};box-shadow:3px 0 0 ${PALETTE[h.id].trim}"></span> ${h.icon} ${h.name.replace('Nhà ', '')}</button>`).join('')}</div>${locked ? `<div class="lock">🔮 Em đã được Quả cầu Tứ Linh chọn vào ${HOUSE[locked].name} — đồng phục theo màu nhà.</div>` : ''}</div>
      <div class="rw"><i>Tóc</i><div class="ch">${HAIR.map(c => sw(c, L.hair === c, 'hair', c)).join('')}</div></div>
      <div class="rw"><i>Mắt</i><div class="ch">${EYES.map(c => sw(c, L.eye === c, 'eye', c)).join('')}</div></div>
      <div class="rw"><i>Da</i><div class="ch">${['#f6dcc6', '#e6c2a2', '#c89a74'].map((c, i) => sw(c, (L.skin | 0) === i, 'skin', i)).join('')}</div></div>
      <div class="rw"><i>Kính</i><div class="ch">${[['none', 'Không'], ['round', '◯ Tròn'], ['square', '▢ Vuông']].map(([v, t]) => chip(t, L.glasses === v, 'glasses', v)).join('')}</div></div>
      <div class="rw"><i>Mũ</i><div class="ch">${chip('Không', !L.hat, 'hat', 0)}${chip('🧙 Mũ chóp', !!L.hat, 'hat', 1)}</div></div>
      <div class="rw"><i>Hiển thị</i><div class="ch">${chip('✨ Anime', L.mode !== 'chibi', 'mode', 'vrm')}${chip('🧸 Chibi (máy yếu)', L.mode === 'chibi', 'mode', 'chibi')}</div></div>
      <div class="ft"><button data-a="x">Huỷ</button><button class="ok" data-a="ok">💾 Lưu nhân vật</button></div>`;
  }
  function open() {
    if (ui) return;
    if (!document.getElementById('vcrCss')) { const st = document.createElement('style'); st.id = 'vcrCss'; st.textContent = CSS; document.head.appendChild(st); }
    const L = loadAvatar(ctx), el = document.createElement('div'); el.id = 'vcr';
    el.innerHTML = `<div class="pv"><canvas></canvas><div class="hd"><b>🎨 Nhân vật</b><span>kéo để xoay</span></div><div class="ld">Đang may đồng phục…</div></div><div class="pn"></div>`;
    document.body.appendChild(el); document.body.classList.add('rs-modal');
    if (ctx.player) ctx.player.frozen = true;
    const cv = el.querySelector('canvas'), pn = el.querySelector('.pn'), ld = el.querySelector('.ld');
    const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.1;
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
    scene.add(new THREE.HemisphereLight('#e8f3ff', '#c9b48a', 1.2)); const sun = new THREE.DirectionalLight('#fff2dc', 2.2); sun.position.set(-2, 5, 4); scene.add(sun);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.618, 48), new THREE.MeshLambertMaterial({ color: '#e2d6bf' })); disc.rotation.x = -Math.PI / 2; scene.add(disc);
    const size = () => { const w = cv.clientWidth, h = cv.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    size(); addEventListener('resize', size);
    let hero = null, yaw = 0.35, drag = null, token = 0, alive = true;
    const frame = () => { const H = hero ? hero.height : 1.6, d = Math.max(H * 0.6 / Math.tan(Math.PI / 12), 0.7 / (Math.tan(Math.PI / 12) * cam.aspect)); cam.position.set(Math.sin(yaw) * d, H * 0.55, Math.cos(yaw) * d); cam.lookAt(0, H * 0.5, 0); };
    async function rebuild() {
      const my = ++token; ld.hidden = false;
      const h = await loadVrmHero({ ...L, house: houseOf(ctx, L), wand: true }, { set: 'full', height: L.base === 'hair-m' ? 1.66 : 1.56 }).catch(e => { console.warn('VRM', e); return null; });
      if (!alive || my !== token) { if (h) h.dispose(); return; }
      if (hero) hero.dispose(); hero = h; ld.hidden = true; if (!h) { ld.textContent = 'Không nạp được nhân vật — vẫn lưu được lựa chọn.'; ld.hidden = false; return; }
      scene.add(h.model); h.anim.play('Idle', 0); h.setWand(true);
    }
    const render = () => { pn.innerHTML = panel(L); };
    render(); rebuild();
    pn.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.a === 'x') return close();
      if (b.dataset.a === 'ok') { saveAvatar(ctx, { ...L }); close(); ctx.toast && ctx.toast('🎨 Đã lưu nhân vật!'); ctx.onAvatar && ctx.onAvatar({ ...L }); return; }
      const k = b.dataset.k, v = b.dataset.v; if (!k) return;
      L[k] = k === 'skin' ? +v : k === 'hat' ? v === '1' : v;
      render();
      if (['base', 'glasses', 'hat'].includes(k)) rebuild();
      else if (hero && k !== 'mode') { hero.setLook({ hair: L.hair, eye: L.eye, skin: L.skin, house: houseOf(ctx, L) }); if (k === 'house' && hero.anim.has('Cheer')) { hero.anim.play('Cheer', 0.15, true); setTimeout(() => hero && hero.anim.play('Idle', 0.3), 1500); } }
    });
    cv.addEventListener('pointerdown', e => { drag = e.clientX; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => { if (drag != null) { yaw -= (e.clientX - drag) * 0.01; drag = e.clientX; } });
    cv.addEventListener('pointerup', () => drag = null);
    const clock = new THREE.Clock();
    r.setAnimationLoop(() => { const dt = Math.min(clock.getDelta(), 0.05); if (drag == null) yaw += dt * 0.1; if (hero) hero.anim.update(dt); frame(); r.render(scene, cam); });
    function close() {
      alive = false; r.setAnimationLoop(null); removeEventListener('resize', size); if (hero) hero.dispose(); r.dispose(); r.forceContextLoss();
      el.remove(); document.body.classList.remove('rs-modal'); ui = null; if (ctx.player) ctx.player.frozen = false;
    }
    ui = { close, get hero() { return hero; }, step(n, dt = 1 / 30) { for (let i = 0; i < n; i++) if (hero) hero.anim.update(dt); frame(); r.render(scene, cam); } };
  }
  // nút trong menu ☰
  const menu = document.getElementById('moreMenu');
  if (menu && !document.getElementById('bAvatar')) { const b = document.createElement('button'); b.id = 'bAvatar'; b.textContent = '🎨 Nhân vật'; b.onclick = open; menu.prepend(b); }
  return { open, get ui() { return ui; } };
}
