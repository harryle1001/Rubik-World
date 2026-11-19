// sea/pilot.js — NGƯỜI CHƠI RA KHƠI:
//   ⛵ Thuyền buồm chạy theo HƯỚNG GIÓ (Địa lý): ngang gió nhanh nhất · xuôi gió êm · chạy vát 45° khi ngược gió · thẳng ngược gió thì đứng.
//      La bàn gió trên HUD (gió gọi tên theo hướng thổi TỚI: "gió đông bắc"), cờ đuôi nheo trên cột buồm, tốc độ tính bằng hải lý/giờ.
//   🚤 Ca nô: nhanh (Shift/Nhanh), chồm mũi, rẽ sóng. Cả hai đăng ký vào vehicles.js (kiểu 'boat' → chỉ đi trên nước, không xuyên đảo/cầu tàu).
//   ⛴️ Đi nhờ phà 3 bến: lên ở bến khi phà đậu, đứng trên boong ngắm biển, "⏭ Tới bến" để tua nhanh, xuống ở bến bất kỳ.
import * as THREE from 'three';
import { loadModel } from '../models.js';
import { CFG } from '../config.js';
import { PHI, BAY, toW, PIER_V, RESORT_JETTY, STOPS } from './site.js';

const KNOT = 1.852 / 3.6;   // 1 hải lý/giờ = 1,852 km/h ≈ 0,514 m/s
const DIR8 = ['bắc', 'đông bắc', 'đông', 'đông nam', 'nam', 'tây nam', 'tây', 'tây bắc'];
// hệ số tốc độ theo góc β giữa mũi thuyền và hướng gió thổi tới (0° = xuôi gió, 180° = thẳng ngược gió)
const POLAR = [[0, 0.72], [60, 0.9], [100, 1], [135, 0.62], [150, 0.3], [160, 0.1], [180, 0.08]];
const polarAt = deg => { for (let i = 1; i < POLAR.length; i++) if (deg <= POLAR[i][0]) { const [a, fa] = POLAR[i - 1], [b, fb] = POLAR[i]; return fa + (fb - fa) * (deg - a) / (b - a); } return 0.08; };
const FERRY_FACTS = [
  '🌊 <b>Hải lý</b> là đơn vị đo đường biển: 1 hải lý = 1 852 m. Tàu đi 1 hải lý mỗi giờ là chạy 1 <b>nút</b>.',
  '🏝️ <b>Vịnh</b> là vùng biển ăn sâu vào đất liền, sóng êm nên làng chài hay nằm trong vịnh.',
  '⚓ Tàu nổi nhờ <b>lực đẩy Ác-si-mét</b>: phần chìm chiếm chỗ lượng nước nặng bằng cả con tàu.',
  '🧭 Trên biển, mạn trái tàu gọi là <b>mạn trái (đèn đỏ)</b>, mạn phải là <b>mạn phải (đèn xanh)</b>.',
];

export function createPilot(ctx, { fleet }) {
  const { scene, terrain } = ctx, pl = ctx.player, V = ctx.vehicles, MOB = CFG.isMobile;
  const waveY = (x, z) => terrain.waveHeight(x, z);
  const told = new Set();
  const once = (k, html, ms = 6500) => { if (told.has(k)) return; told.add(k); ctx.toast(html, ms); };

  // ---------- gió ----------
  const wind = { ang: 0.38, k: 0.6, from: 0, name: 'đông bắc', level: 3 };
  function readWind() {
    const L = ctx.living && ctx.living.wind, W = ctx.weather && ctx.weather.cur; wind.ang = L ? L.ang : 0.38;
    wind.k = Math.min(1.3, 0.55 + (L ? L.g * 0.3 : 0) + (W ? W.w * 0.6 : 0));                 // 0,55 (gió nhẹ) … 1,3 (giông)
    const fx = -Math.cos(wind.ang), fz = -Math.sin(wind.ang); wind.from = (Math.atan2(fx, -fz) + Math.PI * 2) % (Math.PI * 2);   // phương vị gió thổi TỚI (0 = bắc, theo chiều kim đồng hồ)
    wind.name = DIR8[Math.round(wind.from / (Math.PI / 4)) % 8]; wind.level = Math.round(2 + (wind.k - 0.55) * 5.3);
  }

  // ---------- HUD la bàn gió ----------
  const hud = document.createElement('div');
  hud.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:calc(max(12px,env(safe-area-inset-top)) + 96px);z-index:26;display:none;align-items:center;gap:8px;padding:5px 13px 5px 5px;border-radius:34px;background:#0f2a3ad9;color:#fff3d6;font:700 13px/1.25 system-ui;pointer-events:none;max-width:94vw';
  hud.innerHTML = `<svg width="55" height="55" viewBox="-28 -28 56 56" style="flex:none"><circle r="26" fill="#17384a" stroke="#fff3d6" stroke-width="1.6"/>
<g fill="#fff3d6" font-size="8" font-weight="800" text-anchor="middle"><text y="-16">B</text><text x="19" y="3">Đ</text><text y="22">N</text><text x="-19" y="3">T</text></g>
<g id="swBoat"><path d="M0 -13 L5 7 L0 4 L-5 7 Z" fill="#ffd23f"/></g><g id="swWind"><path d="M0 -25 L0 -9 M-4 -14 L0 -8 L4 -14" stroke="#7fe0ff" stroke-width="2.6" fill="none" stroke-linecap="round"/></g></svg><div id="swTxt"></div>`;
  document.body.appendChild(hud);
  const gBoat = hud.querySelector('#swBoat'), gWind = hud.querySelector('#swWind'), txt = hud.querySelector('#swTxt');
  let hudT = 0, hudOn = false;
  const showHud = on => { if (hudOn !== on) { hudOn = on; hud.style.display = on ? 'flex' : 'none'; } };

  // ---------- thuyền lái được ----------
  const boats = [];
  function make({ model, s, x, z, ry, sail, name, seat, seatZ, dy }) {
    const g = new THREE.Group(); g.name = 'sea-pilot-' + model; let pennant = null;
    loadModel('kit/' + model).then(m => { if (!m) return; m.scale.setScalar(s); m.rotation.y = Math.PI; m.position.y = dy; m.traverse(o => { if (o.isMesh) { o.castShadow = !MOB; } }); g.add(m); });
    if (sail) {   // cờ đuôi nheo đỏ trên đỉnh cột: chỉ hướng gió thổi đi
      pennant = new THREE.Mesh(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0.22, 0, 0, -0.22, 0, 0, 0, 1.3], 3)), new THREE.MeshBasicMaterial({ color: '#e8392f', side: THREE.DoubleSide }));
      pennant.position.set(0, 4.74 * s + dy + 0.25, 0); g.add(pennant);
    }
    const mode = sail
      ? { speed: 7.5, turn: 1.25, accel: 0.7, water: true, anim: 'sit', seat, seatZ, camAdd: 5, waterY: (x, z) => waveY(x, z) - 0.02 }
      : { speed: 12, boost: 1.6, turn: 1.5, accel: 1.1, water: true, anim: 'sit', seat, seatZ, camAdd: 4, waterY: (x, z) => waveY(x, z) - 0.02 };
    const v = { type: 'boat', group: g, oars: [], body: g, mode, r: 4.6, far: 144, sail, name, pennant, wakeT: 0, len: sail ? 7.5 : 6.7,
      label: sail ? '⛵ Lái thuyền buồm' : '🚤 Lái ca nô',
      hello: sail ? '⛵ <b>Thuyền buồm chạy bằng gió!</b> Nhìn la bàn: mũi tên xanh là gió. Lái <b>ngang gió</b> thì nhanh nhất; thẳng ngược gió thì thuyền đứng — hãy chạy chéo (vát). Cập bờ bấm <b>E</b>.' : '🚤 <b>Ca nô</b> — giữ <b>Shift</b> / nút <b>Nhanh</b> để rẽ sóng. Nhớ mặc áo phao! Cập bờ bấm <b>E</b> để lên bờ.',
      tick: (dt, sp) => (sail ? tickSail : tickSpeed)(v, dt, sp),
      onDismount: () => { showHud(false); pl.root.rotation.set(0, 0, 0); } };
    g.position.set(x, 0, z); g.rotation.y = ry; V.register(v); boats.push(v); return v;
  }
  const J = RESORT_JETTY;
  // seat / seatZ: chỗ ngồi đo từ lưới model (sàn khoang lái phía lái thuyền), dy: mớn nước
  make({ model: 'boat_sail_a', s: 1.6, sail: true, name: 'Thuyền buồm Vịnh Én', seat: 0.8, seatZ: -2.3, dy: -0.32, ry: BAY.ry, ...xz(toW(29.8, PIER_V + 3.5)) });
  make({ model: 'boat_speed_a', s: 1.7, sail: false, name: 'Ca nô làng chài', seat: 1.18, seatZ: -1.9, dy: -0.3, ry: BAY.ry, ...xz(toW(29, PIER_V - 3.4)) });
  make({ model: 'boat_speed_e', s: 1.9, sail: false, name: 'Ca nô Resort', seat: 0.65, seatZ: 0.8, dy: -0.3, ry: -Math.PI / 2, x: J.x0 + J.headD + 5, z: J.z - 3.4 });
  make({ model: 'boat_sail_b', s: 1.6, sail: true, name: 'Thuyền buồm Resort', seat: 0.8, seatZ: -2.2, dy: -0.32, ry: -Math.PI / 2, x: J.x0 + J.headD + 6, z: J.z + 3.5 });
  function xz([x, z]) { return { x, z }; }

  let heel = 0, lastState = '', sailed = 0;
  const seen = new Set((() => { try { return JSON.parse(localStorage.getItem('sea.sail') || '[]'); } catch (e) { return []; } })());
  function common(v, dt, sp, width) {
    const p = pl.pos, r = Math.hypot(p.x, p.z);
    if (sp > 0.8 && (v.wakeT -= dt) <= 0) { v.wakeT = Math.max(0.12, width * 0.5 / sp) * (MOB ? 1.5 : 1); fleet.emitWake(p.x, p.z, pl.rot, sp, width, v.len); }
    if (r > 890) { const k = 885 / r; p.x *= k; p.z *= k; once('far', '🧭 Ra xa quá rồi! Biển khơi sóng lớn, thuyền nhỏ nên quay lại gần đảo.', 4000); told.delete('far'); }
    // nghiêng theo sóng thật: mũi – lái, trái – phải
    const fx = Math.sin(pl.rot), fz = Math.cos(pl.rot), a = v.len * 0.33;
    const pitch = -Math.atan2(waveY(p.x + fx * a, p.z + fz * a) - waveY(p.x - fx * a, p.z - fz * a), 2 * a) * 0.8, roll = Math.atan2(waveY(p.x + fz, p.z - fx) - waveY(p.x - fz, p.z + fx), 2) * 0.6;
    return { pitch, roll };
  }
  function tickSail(v, dt, sp) {
    readWind();
    const hx = Math.sin(pl.rot), hz = Math.cos(pl.rot), wx = Math.cos(wind.ang), wz = Math.sin(wind.ang);    // mũi thuyền · hướng gió thổi đi
    const cb = hx * wx + hz * wz, beta = Math.acos(Math.max(-1, Math.min(1, cb))) * 180 / Math.PI, f = polarAt(beta), side = hx * wz - hz * wx;   // side > 0: gió tạt từ mạn trái
    const vmax = 7.5 * f * (0.62 + 0.38 * wind.k); if (pl.vehicle) pl.vehicle.speed = vmax;
    const state = beta < 50 ? 'xuoi' : beta < 120 ? 'ngang' : beta < 152 ? 'vat' : 'nguoc';
    const P = common(v, dt, sp, 1.3);
    heel += ((state === 'nguoc' ? 0 : -Math.sign(side) * Math.sin(beta * Math.PI / 180) * 0.2 * Math.min(1, sp / 4 + 0.3) * wind.k) - heel) * Math.min(1, dt * 1.6);
    pl.root.rotation.z = P.roll + heel + (state === 'nguoc' ? Math.sin(performance.now() / 90) * 0.012 : 0); pl.root.rotation.x = P.pitch;
    if (v.pennant) v.pennant.rotation.y = Math.atan2(wx, wz) - pl.rot + Math.sin(performance.now() / 140) * 0.12;
    // HUD
    showHud(true);
    if ((hudT -= dt) <= 0) {
      hudT = 0.2;
      gBoat.setAttribute('transform', `rotate(${(Math.atan2(hx, -hz) * 180 / Math.PI).toFixed(0)})`); gWind.setAttribute('transform', `rotate(${(wind.from * 180 / Math.PI).toFixed(0)})`);
      const label = { xuoi: '⛵ Xuôi gió: êm, buồm căng', ngang: '⛵ <b style="color:#9dffb0">Ngang gió: nhanh nhất!</b>', vat: '⛵ Chạy vát (chéo ngược gió)', nguoc: '<b style="color:#ffb199">Ngược gió: buồm phần phật, thuyền đứng!</b> Rẽ chéo 45°' }[state];
      txt.innerHTML = `💨 Gió ${wind.name} · cấp ${wind.level}<br>${label} · ${(sp / KNOT).toFixed(1)} hải lý/giờ`;
    }
    if (state !== lastState) {
      lastState = state;
      if (state === 'nguoc') once('nguoc', '💨 <b>Thuyền buồm không chạy thẳng ngược gió được</b> — buồm không hứng được gió. Hãy lái chéo khoảng 45° so với gió rồi đổi bên: đường <b>zíc zắc</b> đó gọi là <b>chạy vát</b>.');
      else if (state === 'ngang') once('ngang', '⛵ <b>Ngang gió</b> là nhanh nhất: gió thổi qua cánh buồm cong tạo lực đẩy giống cánh máy bay.');
      else if (state === 'xuoi') once('xuoi', `🧭 Gió được gọi tên theo hướng nó <b>thổi tới</b>: hôm nay là <b>gió ${wind.name}</b>. Xuôi gió là gió đẩy từ sau lưng.`);
    }
    if (sp > 2 && !seen.has(state) && state !== 'nguoc') { seen.add(state); try { localStorage.setItem('sea.sail', JSON.stringify([...seen])); } catch (e) {} if (seen.size === 3 && !seen.has('done')) { seen.add('done'); try { localStorage.setItem('sea.sail', JSON.stringify([...seen])); } catch (e) {} ctx.reward && ctx.reward(2, 'Thuỷ thủ tập sự: đi buồm đủ 3 hướng gió'); ctx.toast('🎖️ <b>Thuỷ thủ tập sự!</b> Bạn đã lái buồm <b>xuôi gió, ngang gió và chạy vát</b>. +2 ⭐', 6000); ctx.sfx && ctx.sfx('win'); } }
    sailed += sp * dt;
  }
  function tickSpeed(v, dt, sp) {
    const P = common(v, dt, sp, 2.2), k = Math.min(1, sp / 16);
    pl.root.rotation.x = P.pitch - k * 0.13; pl.root.rotation.z += P.roll * 0.5;
    showHud(false);
    if (fleet.stormy) once('storm', '⛈️ <b>Biển động!</b> Sóng to, gió giật — thuyền bè đang về bến. Mình cũng nên vào bờ thôi.', 5000);
  }

  // ---------- đi phà ----------
  const F = fleet.ferry; let aboard = false, deckY = 1.0, factI = 0, factT = 21, measured = false;
  const fh = document.createElement('div'); fh.style.cssText = hud.style.cssText.replace('display:none', 'display:none').replace('padding:5px 13px 5px 5px', 'padding:6px 13px'); document.body.appendChild(fh);
  const btns = document.querySelector('.btns'), bSkip = document.createElement('button'); bSkip.textContent = '⏭ Tới bến'; bSkip.hidden = true; bSkip.style.background = '#2c6455cc'; bSkip.onclick = () => { if (aboard && F.state === 'sail') F.warp = 8; else if (aboard) F.dwell = 0; }; btns && btns.appendChild(bSkip);
  const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ');
  function measureDeck() {   // cao độ boong (m): bắn tia xuống lưới model ở nửa trước của phà
    const part = fleet.parts.ferry && fleet.parts.ferry[0]; if (!part) return; measured = true;
    const m = new THREE.Mesh(part.im.geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); m.matrix.copy(part.local); m.matrixAutoUpdate = false; m.matrixWorld.copy(part.local);
    const ray = new THREE.Raycaster(new THREE.Vector3(0, 20, 3.5), new THREE.Vector3(0, -1, 0)), hit = ray.intersectObject(m, false)[0]; if (hit) deckY = hit.point.y + F.K.dy;
  }
  const nextName = () => F.stops[(F.k + (F.state === 'dock' ? 1 : 0)) % F.stops.length].stop.name;
  function board() {
    if (aboard || pl.vehicle || pl.frozen) return; aboard = true; F.warp = 1;
    pl.vehicle = { speed: 0, turn: 0, accel: 4, fly: true, lift: 0, maxAlt: 999, anim: 'idle', seat: 0, seatZ: 0, camAdd: 8, ferry: true };
    bSkip.hidden = false; fh.style.display = 'flex'; for (const id of ['bRun', 'bJump']) { const b = document.getElementById(id); if (b) b.hidden = true; }
    ctx.sfx && ctx.sfx('splash'); ctx.toast(`⛴️ Lên phà! Bến kế: <b>${nextName()}</b>. Đứng trên boong ngắm biển nhé — tới bến bấm <b>E</b> để xuống.`, 5000); factT = 21;
  }
  function leave(stop) {
    aboard = false; pl.vehicle = null; bSkip.hidden = true; fh.style.display = 'none'; F.warp = 1; for (const id of ['bRun', 'bJump']) { const b = document.getElementById(id); if (b) b.hidden = false; }
    const [x, z] = stop.land; pl.teleport(x, z, Math.max(terrain.heightAt(x, z), ctx.groundExtra(x, z, 9))); pl.root.quaternion.identity(); pl.root.rotation.set(0, 0, 0);
    ctx.toast(`🏝️ Đã tới <b>${stop.name}</b>.`, 3500); ctx.questEvent && ctx.questEvent('ferry');
  }
  F.onArrive = v => { if (aboard) ctx.toast(`⛴️ Phà cập bến <b>${v.at.name}</b>. Bấm <b>E</b> để xuống, hoặc ở lại đi tiếp tới <b>${nextName()}</b>.`, 5000); };

  function update(dt) {
    if (!measured) measureDeck();
    // thuyền đỗ: nhấp nhô theo sóng thật (vehicles.js đặt cao độ theo sóng giả → ghi đè), cờ chỉ gió
    const cur = V.current;
    for (const v of boats) if (v !== cur && v.group.parent === scene && v.group.visible) { const g = v.group; g.position.y = waveY(g.position.x, g.position.z) - 0.02; if (v.pennant) { readWind(); v.pennant.rotation.y = Math.atan2(Math.cos(wind.ang), Math.sin(wind.ang)) - g.rotation.y; } }
    if (!(cur && boats.includes(cur))) showHud(false);
    // phà
    const p = pl.pos;
    if (!aboard) {
      if (F.state === 'dock' && !pl.vehicle && !pl.frozen) { const s = F.at || STOPS[0], d = Math.hypot(p.x - s.land[0], p.z - s.land[1]); if (d < 8) ctx.offer(`⛴️ Lên phà đi ${nextName()}`, board, 6); }
      else if (!pl.vehicle && !pl.frozen) for (const s of STOPS) if (Math.hypot(p.x - s.land[0], p.z - s.land[1]) < 6) { once('wait' + s.id, `⛴️ <b>Bến phà ${s.name}</b> — phà chạy vòng 3 bến: Làng chài · Làng nổi · Resort. Chờ phà cập bến rồi lên nhé!`, 5000); }
      return;
    }
    // đứng trên boong: vị trí theo thân phà (nhấp nhô theo sóng)
    fleet.deckPoint(F, 0, deckY - F.K.dy, 3.2, _p); pl.pos.copy(_p); pl.root.position.copy(_p); _e.set(F.pitch, F.h, F.roll); pl.root.quaternion.setFromEuler(_e); void _q;
    let rem = F.stops[F.k].s - F.s; if (rem < -1) rem += F.path.L;
    fh.innerHTML = F.state === 'dock' ? `⛴️ Phà đang đậu ở <b>&nbsp;${F.at.name}</b>&nbsp;· rời bến sau ${Math.max(0, Math.ceil(F.dwell))} s` : `⛴️ Phà → <b>&nbsp;${F.at.name}</b>&nbsp;· còn ${Math.round(rem)} m · ${(F.sp / KNOT).toFixed(0)} hải lý/giờ`;
    if (F.state === 'dock') ctx.offer(`🏝️ Xuống phà ở ${F.at.name}`, () => leave(F.at), 6);
    else if ((factT -= dt) <= 0 && F.warp === 1) { factT = 34; ctx.toast(FERRY_FACTS[factI++ % FERRY_FACTS.length], 7000); }
  }
  return { update, boats, wind, readWind, board, leave, get aboard() { return aboard; }, get sailed() { return sailed; } };
}
export { PHI };
