// academy/stairs.js — THÁP CẦU THANG PHÉP (Sân Bắc): tháp tròn mở trời r 13 m, 4 vòng ban công (mỗi 8,4 m), 4 nhịp cầu thang đá
// tự xoay. Mỗi nhịp dài 13 m quay quanh chân thang: 8 s đứng yên cập ban công trên, 5 s xoay sang chỗ cập thứ hai —
// giữa chừng đầu thang lơ lửng giữa tháp. Hai chỗ cập: |P + L·d| = r_p ⇒ cos(θ − a) = −L / (2 r_p) (hình học vòng tròn).
// Đứng trên nhịp khi xoay: được chở theo (xoay vị trí người quanh chân thang). Trên đỉnh: ngắm toàn cảnh.
import * as THREE from 'three';
import { Batch } from './geo.js';
import { mat } from '../sample/palette.js';
import { stoneMaterial, lookChoice } from './castle.js';
import { COL } from './kit.js';

export const STAIR_TOWER = { u: -146, v: -58, R: 13, r0: 9.4, r1: 12.4, FH: 8.4, n: 4, L: 13, rp: 10.9, door: 0.16 };
const PI = Math.PI, REST = 8, SWING = 5;

export function createStairs(ctx, { Y, toWorld, toLocal }) {
  const T = STAIR_TOWER, gapA = T.door + 0.08;
  const F = [...Array(T.n)].map((_, k) => { const a = k * PI / 2 + PI / 4, d = Math.acos(-T.L / (2 * T.rp)); return { k, a, p: [T.rp * Math.cos(a), T.rp * Math.sin(a)], t1: a + d, t2: a - d, th: a + d, g: null }; });
  let G = null, boxes = [], warned = 0, topSeen = false;
  const angAt = (f, t) => { const c = (t + f.k * 3.25) % (2 * (REST + SWING)), half = REST + SWING, e = x => x * x * (3 - 2 * x), t2 = f.t2 + 2 * PI;   // xoay qua phía tâm tháp
    if (c < REST) return f.t1; if (c < half) return f.t1 + (t2 - f.t1) * e((c - REST) / SWING); if (c < half + REST) return t2; return t2 + (f.t1 - t2) * e((c - half - REST) / SWING); };
  const moving = (f, t) => { const c = (t + f.k * 3.25) % (2 * (REST + SWING)); return (c > REST && c < REST + SWING) || c > 2 * REST + SWING; };
  const onFlight = (f, du, dv, y) => { const c = Math.cos(f.th), s = Math.sin(f.th), x = du - f.p[0], z = dv - f.p[1], a = x * c + z * s, w = -x * s + z * c; if (a < -0.3 || a > T.L + 0.3 || Math.abs(w) > 1.3) return null; const h = Y + f.k * T.FH + T.FH * Math.max(0, Math.min(1, a / T.L)); return h <= y + 1.0 ? h : null; };
  const prev = ctx.groundExtra;
  ctx.groundExtra = (x, z, y) => {
    let h = prev ? prev(x, z, y) : -99; if (!G || y === undefined || y < Y - 2) return h;
    const [u, v] = toLocal(x, z), du = u - T.u, dv = v - T.v, r = Math.hypot(du, dv); if (r > T.R) return h;
    const a = Math.atan2(dv, du);
    if (r > T.r0 && r < T.r1 && Math.abs(a) > gapA) for (let k = T.n; k >= 1; k--) { const hk = Y + k * T.FH; if (hk <= y + 1.0) { h = Math.max(h, hk); break; } }
    for (const f of F) { const hf = onFlight(f, du, dv, y); if (hf !== null) h = Math.max(h, hf); }
    return h;
  };
  function build() {
    if (G) return;
    const c0 = toWorld(0, 0); G = new THREE.Group(); G.name = 'academy-stair-tower'; G.position.set(c0[0], 0, c0[1]);
    const b = new Batch(), gl = new Batch(), H = T.n * T.FH + 4.4;
    // tường: mặt ngoài + mặt trong (lật pháp tuyến), cửa vòm ở chân tháp hướng +u (về lâu đài)
    const ring = (r, y0, h, a0, al, flip) => b.add(new THREE.CylinderGeometry(r, r, h, 34, 1, true, a0, al), COL.wall, T.v, y0 + h / 2, T.u, 0, 0, 0, flip ? -1 : 1, 1, 1);
    const gl0 = 2 * PI - 2 * T.door;   // Cylinder: góc 0 = +z (= +u) → bắt đầu sau khe cửa
    for (const [r, fl] of [[T.R + 0.4, false], [T.R, true]]) { ring(r, Y - 3, 8, T.door, gl0, fl); ring(r, Y + 5, H - 5, 0, 2 * PI, fl); }
    b.add(new THREE.TorusGeometry(T.R + 0.4, 0.5, 4, 34).rotateX(PI / 2), COL.wallD, T.v, Y + H, T.u);
    for (let k = 0; k < 21; k++) { const a = k / 21 * 2 * PI; b.box(T.v + Math.sin(a) * (T.R + 0.4) - 0.45, T.v + Math.sin(a) * (T.R + 0.4) + 0.45, Y + H, Y + H + 1.2, T.u + Math.cos(a) * (T.R + 0.4) - 0.45, T.u + Math.cos(a) * (T.R + 0.4) + 0.45, COL.wallD); }   // răng cưa đỉnh
    b.cyl(T.v, Y - 0.02, T.u, T.R, 0.08, '#6f6a62', 34);
    gl.add(new THREE.RingGeometry(2.6, 3.0, 34).rotateX(-PI / 2), '#9fe6ff', T.v, Y + 0.08, T.u);   // vòng rune giữa sàn
    // ban công 4 tầng (bỏ khúc trước cửa) + mép dày
    for (let k = 1; k <= T.n; k++) {
      const y = Y + k * T.FH, a0 = gapA, al = 2 * PI - 2 * gapA;
      b.add(new THREE.RingGeometry(T.r0, T.r1 + 0.6, 34, 1, a0 - PI / 2, al).rotateX(-PI / 2), '#8d857a', T.v, y, T.u);   // φ = a − π/2 sau khi xoay nằm
      b.add(new THREE.CylinderGeometry(T.r0, T.r0, 0.5, 34, 1, true, a0, al), COL.wallD, T.v, y - 0.25, T.u);
      for (let i = 0; i < 6; i++) { const a = a0 + (i + 0.5) / 6 * al; gl.add(new THREE.SphereGeometry(0.22, 6, 4), '#ffd27a', T.v + Math.sin(a) * (T.R - 0.3), y + 2.2, T.u + Math.cos(a) * (T.R - 0.3)); }   // đèn tường
    }
    // va chạm tường: 48 hộp nhỏ quanh r 13,4 (chừa cửa)
    for (let i = 0; i < 48; i++) { const a = (i + 0.5) / 48 * 2 * PI - PI, wrapped = Math.atan2(Math.sin(a), Math.cos(a)); if (Math.abs(wrapped) < T.door + 0.05) continue;
      const u = T.u + Math.cos(a) * (T.R + 0.5), v = T.v + Math.sin(a) * (T.R + 0.5), [x, z] = toWorld(u, v); boxes.push({ x0: x - 0.6, x1: x + 0.6, z0: z - 0.6, z1: z + 0.6, top: Y + H }); }
    const stone = stoneMaterial(lookChoice());
    const m = new THREE.Mesh(b.build(), stone); m.matrixAutoUpdate = false; m.castShadow = m.receiveShadow = true; G.add(m);
    G.add(new THREE.Mesh(gl.build(), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })));
    // 4 nhịp thang: 13 bậc + 2 lan can, gốc = chân thang, dọc +z cục bộ
    const fb = new Batch();
    for (let i = 0; i < 13; i++) { const z0 = i * T.L / 13, h = (i + 1) * T.FH / 13; fb.box(-1.25, 1.25, h - 0.45, h, z0, z0 + T.L / 13 + 0.05, i % 2 ? '#9f9a92' : '#a8a298'); }
    fb.add(new THREE.BoxGeometry(2.5, 0.6, T.L * 1.06), COL.wallD, 0, T.FH / 2 - 0.9, T.L / 2, 0, -Math.atan2(T.FH, T.L));   // dầm dưới
    for (const s of [-1, 1]) fb.add(new THREE.BoxGeometry(0.14, 0.14, T.L * 1.06), COL.wood, s * 1.2, T.FH / 2 + 1.05, T.L / 2, 0, -Math.atan2(T.FH, T.L));
    const fg = fb.build();
    for (const f of F) { const g = new THREE.Mesh(fg, stone); g.position.set(T.v + f.p[1], Y + f.k * T.FH, T.u + f.p[0]); g.castShadow = true; G.add(g); f.g = g; }
    ctx.scene.add(G); (ctx.boxes = ctx.boxes || []).push(...boxes);
  }
  function unbuild() { if (!G) return; ctx.scene.remove(G); G.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose(); }); for (const x of boxes) { const i = ctx.boxes.indexOf(x); if (i >= 0) ctx.boxes.splice(i, 1); } boxes = []; G = null; }
  function update(dt, t) {
    if (!G) return; const cam = ctx.camera.position, [cu, cv] = toLocal(cam.x, cam.z); G.visible = Math.hypot(cu - T.u, cv - T.v) < 233 && cam.y < 600; if (!G.visible) return;
    const p = ctx.player.pos, [u, v] = toLocal(p.x, p.z), du = u - T.u, dv = v - T.v, inside = Math.hypot(du, dv) < T.R && p.y > Y - 1 && p.y < Y + 40;
    for (const f of F) {
      const th = angAt(f, t), d = th - f.th;
      if (inside && d !== 0) { const c = Math.cos(f.th), s = Math.sin(f.th), x = du - f.p[0], z = dv - f.p[1], a = x * c + z * s, w = -x * s + z * c, h = Y + f.k * T.FH + T.FH * a / T.L;
        if (a > -0.3 && a < T.L + 0.3 && Math.abs(w) < 1.4 && Math.abs(p.y - h) < 0.7) {   // chở người theo
          const cd = Math.cos(d), sd = Math.sin(d), nx = x * cd - z * sd, nz = x * sd + z * cd, [wx, wz] = toWorld(T.u + f.p[0] + nx, T.v + f.p[1] + nz); p.x = wx; p.z = wz; ctx.player.cam.yaw -= d; } }
      f.th = th; f.g.rotation.y = Math.atan2(Math.sin(th), Math.cos(th));
    }
    if (!inside) return;
    if (F.some(f => moving(f, t)) && warned < 2 && Math.random() < dt * 0.2) { warned++; ctx.sfx && ctx.sfx('bell'); ctx.toast('🌀 <b>Cầu thang đang xoay!</b> Đứng yên trên bậc — cầu thang sẽ chở em sang ban công khác. Mỗi nhịp đứng yên 8 giây rồi xoay 5 giây.', 5000); }
    if (p.y > Y + T.n * T.FH - 0.5 && !topSeen) { topSeen = true; ctx.account && ctx.account.addCoins(3); ctx.toast('🏆 Em đã lên tới <b>đỉnh Tháp Cầu Thang Phép</b> (34 m)! +3 🪙. Nhìn quanh: Tháp Cú, Phố Mới, cả lâu đài Pha Lê.', 6000); }
  }
  return { build, unbuild, update };
}
