// academy/alley-night.js — 🌙 HẺM ĐÊM: ngõ nhánh hơi bí ẩn nhưng thân thiện sau Ngân Hàng Kho Báu (nguyên bản).
// Lối hẹp giữa hông ngân hàng và tường thành → cổng vòm đá có màn phép tím; giải 1 câu ĐỐ MẸO để mở (nhớ vĩnh viễn).
// Bên trong: sân nhỏ giữa tháp góc và tường thành — đèn lồng tím, dây đèn sao, nấm phát sáng, đom đóm suốt ngày đêm,
// sạp của Cô Đom Đóm (thiên văn, đố mẹo). Hình: model CC0 Kenney/Quaternius qua put/prop của alley.js (gộp draw call).
import * as THREE from 'three';
import { GATE_RIDDLES } from './alley-shops.js';

export const NIGHT_U = { gate: -89.6, u0: -97, u1: -111, v0: 124.5, v1: 134.4, lane: [131.9, 135.0] };
const KEY = 'academy.nightGate';

export function buildNight({ ctx, magic, put, prop, boxes, W, gy, g, S, T, R }) {
  const N = NIGHT_U, up = new THREE.Vector3(0, 1, 0), white = new THREE.Color(1, 1, 1), violet = new THREE.Color(0.78, 0.66, 1);
  let open = (() => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } })();
  // ---- cổng vòm: 2 cột đá + vòm gỗ chạm, biển "Hẻm Đêm" ----
  const gv = (N.lane[0] + N.lane[1]) / 2, gw = N.lane[1] - N.lane[0], gyy = gy(N.gate, gv);
  for (const v of N.lane) put('pillar-stone', new THREE.Matrix4().compose(W(N.gate, v, gyy), new THREE.Quaternion(), new THREE.Vector3(S * 1.1, S * 1.05, S * 1.1)), violet);
  put('wall-arch-top-detail', new THREE.Matrix4().compose(W(N.gate, gv, gyy + S * 0.98), new THREE.Quaternion().setFromAxisAngle(up, Math.PI / 2), new THREE.Vector3(S * 0.6, gw * 0.42, gw * 1.02)), violet);
  // ---- màn phép (mặt phẳng lấp lánh, chặn lối tới khi giải đố) ----
  const veilMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { t: { value: 0 }, o: { value: open ? 0 : 1 } },
    vertexShader: 'varying vec2 vu; void main(){ vu = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec2 vu; uniform float t, o;
      void main(){ float w = sin(vu.x * 21.0 + t * 2.0) * sin(vu.y * 13.0 - t * 1.3) * 0.5 + 0.5, e = smoothstep(0.0, 0.12, vu.x) * smoothstep(1.0, 0.88, vu.x) * smoothstep(1.0, 0.8, vu.y);
        float s = step(0.985, fract(sin(dot(floor(vu * vec2(34.0, 21.0)), vec2(12.9898, 78.233))) * 43758.5453 + t * 0.1));
        gl_FragColor = vec4(mix(vec3(0.35, 0.2, 0.75), vec3(0.85, 0.75, 1.0), w * 0.6 + s), (0.38 + w * 0.3 + s) * e * o); }`,
  });
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(gw - 0.2, 2.9), veilMat);
  veil.position.copy(W(N.gate, gv, gyy + 1.45)); veil.rotation.y = Math.PI / 2 * 0; veil.visible = !open; veil.name = 'alley-night-veil'; g.add(veil);
  { const a = W(N.gate, N.lane[0], 0), b = W(N.gate, N.lane[1], 0); veil.lookAt(veil.position.clone().add(new THREE.Vector3(0, 0, 1).cross(new THREE.Vector3().subVectors(b, a)).length() ? new THREE.Vector3(a.z - b.z, 0, b.x - a.x).normalize() : new THREE.Vector3(0, 0, 1))); }
  const wall = { x0: Math.min(...[N.lane[0], N.lane[1]].map(v => W(N.gate, v, 0).x)), x1: Math.max(...[N.lane[0], N.lane[1]].map(v => W(N.gate, v, 0).x)), z0: W(N.gate - 0.3, gv, 0).z, z1: W(N.gate + 0.3, gv, 0).z, top: gyy + 3.2 };
  if (wall.z0 > wall.z1) [wall.z0, wall.z1] = [wall.z1, wall.z0];
  if (!open) boxes.push(wall);

  // ---- sân trong: đèn lồng tím trên cột, dây đèn sao, nấm sáng, sạp sao, ghế ----
  const lights = [], glowPts = [];
  const lp = [[-99, 125.6], [-105, 133.6], [-110, 126], [-99.5, 133.6], [-106, 125.4]];
  lp.forEach(([u, v]) => { const p = W(u, v, gy(u, v)); put('lantern', new THREE.Matrix4().compose(p, new THREE.Quaternion(), new THREE.Vector3(2.1, 2.1, 2.1)), violet); lights.push(p.clone().setY(p.y + 3.1)); ctx.colliders.push({ x: p.x, z: p.z, r: 0.25, alley: true }); });
  // dây đèn sao võng ngang sân (Points)
  for (let k = 0; k < 4; k++) { const u = N.u0 - 2 - k * 3.6, a = W(u, N.v0, gy(u, N.v0) + 4.2 + (k % 2) * 0.5), b = W(u - 1.5, N.v1, gy(u, N.v1) + 4.2); for (let i = 0; i <= 13; i++) { const t = i / 13, p = a.clone().lerp(b, t); p.y -= Math.sin(t * Math.PI) * 0.7; glowPts.push(p); } }
  // nấm phát sáng ven tường, sạp + ghế của Cô Đom Đóm
  const MUSH = [[-98, 134.4], [-101.5, 124.7], [-108.5, 134.3], [-111, 129], [-103.5, 134.5], [-110.5, 124.8], [-97.5, 124.9]];
  MUSH.forEach(([u, v], i) => { const p = W(u, v, gy(u, v)); prop(i % 2 ? 'kit/plant_mushroom_group' : 'kit/mushroom_red', i % 2 ? 0.55 : 0.4, new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromAxisAngle(up, i * 2.4), new THREE.Vector3(1, 1, 1)), new THREE.Color(0.75, 0.85, 1.25)); glowPts.push(p.clone().setY(p.y + 0.35)); });
  const su = -104.5, sv = 131.8, sp = W(su, sv, gy(su, sv));
  put('stall-red', new THREE.Matrix4().compose(sp, new THREE.Quaternion().setFromAxisAngle(up, -Math.PI / 2), new THREE.Vector3(2.4, 2.4, 2.4)), violet);
  boxes.push({ x0: sp.x - 0.9, x1: sp.x + 0.9, z0: sp.z - 1.2, z1: sp.z + 1.2, top: sp.y + 1.2 });
  for (const [du, dv] of [[2.6, -4.5], [-2.6, -4.6]]) { const p = W(su + du, sv + dv, gy(su + du, sv + dv)); put('stall-bench', new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromAxisAngle(up, du > 0 ? 0 : Math.PI), new THREE.Vector3(2.4, 2.4, 2.4)), white); }
  const S0 = new THREE.Matrix4().compose(sp, new THREE.Quaternion().setFromAxisAngle(up, -Math.PI / 2), new THREE.Vector3(1, 1, 1));
  for (const [x, z, nm, f] of [[0, -0.7, 'kit/furn_book_set', 0.3], [0.1, 0.1, 'kit/prop_jewel', 0.34], [-0.1, 0.75, 'kit/prop_lantern_hanging', 0.4]]) prop(nm, f, S0.clone().multiply(T.makeTranslation(x, 0.9, z)), violet);
  const keeperAt = W(su, sv - 1.2, gy(su, sv - 1.2));
  // đồ lặt vặt bí ẩn: thùng, két chai thuốc, chồng củi, sách cũ chất đống, giá sách
  for (const [u, v, nm, f, a] of [[-98.2, 133.9, 'kit/barrels', 0.75, 0.3], [-100.5, 134.1, 'kit/prop_crate_bottles', 0.5, 1], [-109.5, 133.8, 'kit/prop_log_stack', 0.5, 0.2], [-111.2, 131.5, 'kit/furn_bookshelf_small', 1.2, -Math.PI / 2], [-111.2, 127.5, 'kit/barrel', 0.89, 0], [-97.8, 128.5, 'kit/crate', 0.55, 0.6]])
    { const p = W(u, v, gy(u, v)); prop(nm, f, new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromAxisAngle(up, a), new THREE.Vector3(1, 1, 1)), violet); ctx.colliders.push({ x: p.x, z: p.z, r: 0.35, alley: true }); }

  // ---- đom đóm (luôn có ở Hẻm Đêm) + quầng đèn tím: Points, 2 draw call ----
  const dot = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const k = c.getContext('2d'), gr = k.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, '#fff'); gr.addColorStop(0.4, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = gr; k.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
  const mk = (pts, size, col) => { const p = new THREE.Points(new THREE.BufferGeometry().setFromPoints(pts), new THREE.PointsMaterial({ map: dot, size, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: col })); g.add(p); return p; };
  const halo = mk(lights, 3.4, 0xb898ff), sparks = mk(glowPts, 0.5, 0xd0c0ff); halo.name = 'alley-night-halo';
  const NF = 34, ff = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ map: dot, size: 0.22, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xd8ff70 }));
  ff.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NF * 3), 3)); ff.frustumCulled = false; ff.name = 'alley-night-fireflies'; g.add(ff);
  const seeds = Array.from({ length: NF }, () => ({ u: N.u0 - Math.random() * (N.u0 - N.u1), v: N.v0 + Math.random() * (N.v1 - N.v0), h: 0.5 + Math.random() * 3, r: Math.random() * 6.28 }));
  const center = W((N.u0 + N.u1) / 2, (N.v0 + N.v1) / 2, gy(-104, 129));

  let t = 0, asking = false;
  function openGate() {
    open = true; try { localStorage.setItem(KEY, '1'); } catch (e) {}
    const k = boxes.indexOf(wall); if (k >= 0) boxes.splice(k, 1); const j = ctx.boxes.indexOf(wall); if (j >= 0) ctx.boxes.splice(j, 1);
    magic.burst(veil.position.clone(), up, '#c8a8ff', 55, 4, 1); ctx.sfx && ctx.sfx('magic');
    ctx.toast('🌙 Cổng <b>Hẻm Đêm</b> đã mở! Vào gặp Cô Đom Đóm nhé.', 4500);
  }
  function update(dt, pp) {
    t += dt; veilMat.uniforms.t.value = t;
    if (open && veilMat.uniforms.o.value > 0) { veilMat.uniforms.o.value = Math.max(0, veilMat.uniforms.o.value - dt); if (!veilMat.uniforms.o.value) veil.visible = false; }
    const dg = Math.hypot(pp.x - veil.position.x, pp.z - veil.position.z);
    if (!open && !asking && dg < 3.4 && !ctx.player.vehicle) ctx.offer('🌙 Cổng Hẻm Đêm — giải câu đố mẹo để mở', () => {
      asking = true; setTimeout(() => (asking = false), 1500);
      magic.ask(GATE_RIDDLES[Math.floor(Math.random() * GATE_RIDDLES.length)], openGate, '🌙 Màn phép thì thầm: “Đố em…”');
    }, 8);
    const nt = ctx.sky && ctx.sky.state ? Math.min(1, ctx.sky.state.night * 1.4) : 0; halo.material.size = 1.6 + nt * 1.8; halo.material.opacity = 0.55 + nt * 0.45; sparks.material.opacity = 0.6 + nt * 0.4;
    const near = center.distanceTo(pp) < 34; ff.visible = near; halo.visible = sparks.visible = near || dg < 34;
    if (!near) return;
    const a = ff.geometry.attributes.position;
    seeds.forEach((s, i) => { const u = s.u + Math.sin(t * 0.3 + s.r) * 1.3, v = s.v + Math.cos(t * 0.23 + s.r * 2) * 1.1, p = W(u, v, center.y + s.h + Math.sin(t * 0.9 + s.r * 3) * 0.4); a.setXYZ(i, p.x, p.y, p.z); });
    a.needsUpdate = true; ff.material.opacity = 0.55 + 0.45 * Math.sin(t * 3.1);
  }
  return { update, keeperAt, keeperFace: Math.atan2(...(() => { const d = W(su, sv - 4, 0).sub(W(su, sv, 0)); return [d.x, d.z]; })()), lights, get open() { return open; } };
}
