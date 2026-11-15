// map.js — Bản đồ thế giới (phím M hoặc nút 🗺️): vẽ sẵn địa hình 1 lần (chia nhỏ qua nhiều khung hình để không giật),
// rồi mỗi khung hình chỉ vẽ lại ảnh nền + vị trí người chơi, xe, thuyền, thú cưỡi, phượng hoàng.
// Kéo để di chuyển, lăn chuột / chụm 2 ngón để phóng to, nút 📍 về chỗ mình. Chuyển động mượt bằng nội suy.
import { CFG } from './config.js';

const X0 = -125, X1 = 490, Z0 = -185, Z1 = 125, RES = 1.5; // vùng bản đồ (m) và độ phân giải ảnh nền (px/m)
const PLACES = [
  { n: '🏕️ Bãi xuất phát', x: 2, z: 12 }, { n: '⛩️ Đền Tri Thức', x: 0, z: -9 }, { n: '🚲 Bãi xe thế giới', x: 0, z: 30 },
  { n: '🌉 Cầu gỗ', x: 6, z: -82 },
];

export function createMap(ctx) {
  const { terrain } = ctx, pl = ctx.player;
  const el = document.getElementById('map'), cv = document.getElementById('mapCv'), g = cv.getContext('2d');
  const bg = document.createElement('canvas'); bg.width = Math.round((X1 - X0) * RES); bg.height = Math.round((Z1 - Z0) * RES);
  const bgx = bg.getContext('2d'); let built = 0, building = false, overlayDone = false;
  const view = { x: 0, z: 0, k: 2 }, want = { x: 0, z: 0, k: 2 };
  let open = false, raf = 0, frozenBefore = false, t = 0;

  // ---------- Ảnh nền địa hình ----------
  const mix = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  const SURF = { stone: [176, 170, 160], wood: [196, 160, 112], sand: [236, 217, 160], mud: [150, 120, 84], grass: [140, 196, 110], gravel: [168, 160, 150] };
  const H = (x, z) => Math.max(terrain.heightAt(x, z), ctx.groundExtra ? ctx.groundExtra(x, z, 9) : -99);
  function buildRows(n) {
    const w = bg.width, img = bgx.createImageData(w, n), d = img.data;
    for (let j = 0; j < n && built + j < bg.height; j++) for (let i = 0; i < w; i++) {
      const x = X0 + i / RES, z = Z0 + (built + j) / RES, th = terrain.heightAt(x, z), ex = ctx.groundExtra ? ctx.groundExtra(x, z, 9) : -99, h = Math.max(th, ex);
      let c;
      if (h < CFG.island.waterLevel - 0.25) { const dep = Math.min(1, -h / 6); c = mix([110, 214, 222], [28, 86, 150], Math.sqrt(dep)); if (-h < 0.6) c = mix(c, [235, 250, 250], 0.35); }
      else if (ex > th && ex > 0.5) c = (ctx.surfaceAt && SURF[ctx.surfaceAt(x, z, 9)]) || [226, 211, 174];
      else if (h < 1.3) c = SURF.sand;
      else { c = mix([132, 196, 98], [70, 128, 62], Math.min(1, h / 14)); const sl = H(x + 1, z - 1) - h; c = mix(c, sl > 0 ? [40, 70, 40] : [235, 245, 200], Math.min(0.45, Math.abs(sl) * 0.35)); }
      const o = (j * w + i) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
    }
    bgx.putImageData(img, 0, built); built += n;
  }
  function overlay() { // cây, nhà/tường thị trấn
    overlayDone = true;
    bgx.fillStyle = 'rgba(40,90,40,.75)';
    for (const c of ctx.colliders) if (c.r < 1.3 && c.x > X0 && c.x < X1 && c.z > Z0 && c.z < Z1) { bgx.beginPath(); bgx.arc((c.x - X0) * RES, (c.z - Z0) * RES, Math.max(1.2, c.r * RES * 1.6), 0, 7); bgx.fill(); }
    bgx.fillStyle = '#b8865a'; bgx.strokeStyle = '#6b4a2b'; bgx.lineWidth = 1;
    for (const b of ctx.boxes || []) { const x = (b.x0 - X0) * RES, y = (b.z0 - Z0) * RES, w = (b.x1 - b.x0) * RES, h = (b.z1 - b.z0) * RES; bgx.fillRect(x, y, w, h); if (w > 3 && h > 3) bgx.strokeRect(x, y, w, h); }
  }
  function buildStep() { if (built < bg.height) { buildRows(24); requestAnimationFrame(buildStep); } else { building = false; if (ctx.school && ctx.school.gate) overlay(); } }

  // ---------- Vẽ ----------
  const size = () => { const r = Math.min(devicePixelRatio, 2); cv.width = cv.clientWidth * r; cv.height = cv.clientHeight * r; return r; };
  let dpr = 1;
  const fitK = () => Math.min(cv.clientWidth / (X1 - X0), cv.clientHeight / (Z1 - Z0)) * 0.95;
  const toScreen = (x, z) => [(x - view.x) * view.k + cv.clientWidth / 2, (z - view.z) * view.k + cv.clientHeight / 2];
  function icon(txt, x, z, s = 16) { const [sx, sy] = toScreen(x, z); if (sx < -20 || sy < -20 || sx > cv.clientWidth + 20 || sy > cv.clientHeight + 20) return; g.font = `${s}px system-ui`; g.fillText(txt, sx, sy); }
  function balloonIcon(x, z) { const [sx, sy] = toScreen(x, z); g.fillStyle = '#e8453c'; g.beginPath(); g.arc(sx, sy - 6, 7, 0, 7); g.fill(); g.fillStyle = '#f2c14e'; g.fillRect(sx - 2, sy - 13, 4, 13); g.fillStyle = '#a8763e'; g.fillRect(sx - 3, sy + 3, 6, 4); }
  function label(txt, x, z) { const [sx, sy] = toScreen(x, z); g.font = '700 13px system-ui'; g.lineWidth = 3.5; g.strokeStyle = '#0008'; g.strokeText(txt, sx, sy - 16); g.fillStyle = '#fff'; g.fillText(txt, sx, sy - 16); }
  function draw(dt) {
    t += dt;
    const f = 1 - Math.exp(-dt * 10); view.x += (want.x - view.x) * f; view.z += (want.z - view.z) * f; view.k *= Math.pow(want.k / view.k, f);
    if (!overlayDone && built >= bg.height && ctx.school && ctx.school.gate) overlay();
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#1d5a9a'; g.fillRect(0, 0, cv.clientWidth, cv.clientHeight);
    const [ox, oy] = toScreen(X0, Z0); g.imageSmoothingEnabled = view.k < RES * 1.5;
    g.drawImage(bg, ox, oy, (X1 - X0) * view.k, (Z1 - Z0) * view.k);
    if (built < bg.height) { g.fillStyle = '#fff'; g.font = '700 15px system-ui'; g.textAlign = 'center'; g.fillText(`Đang vẽ bản đồ… ${Math.round(built / bg.height * 100)}%`, cv.clientWidth / 2, 40); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    // thú, xe, thuyền
    const V = ctx.vehicles, small = view.k < 2.2;
    for (const A of (ctx.animals && ctx.animals.list) || []) if (!A.ridden) icon('🐾', A.root.position.x, A.root.position.z, 11);
    if (V) for (const v of V.all) {
      if (v === V.current) continue; const p = v.group.position;
      if (v.type === 'balloon') { balloonIcon(p.x, p.z); continue; }
      const e = v.type === 'bike' ? '🚲' : v.type === 'boat' ? '⛵' : v.type === 'phoenix' ? '🔥' : v.type === 'mount' ? (v.kind === 'elephant' ? '🐘' : v.kind === 'camel' ? '🐫' : v.kind === 'buffalo' ? '🐃' : v.kind === 'zebra' ? '🦓' : v.kind === 'ostrich' ? '🪶' : '🐎') : null;
      if (e && !(small && v.type === 'bike')) icon(e, p.x, p.z, v.type === 'phoenix' ? 20 : 14);
    }
    if (small) icon('🚲', 0, 26, 16);
    for (const P of PLACES) label(P.n, P.x, P.z);
    if (ctx.school && ctx.school.gate) { label('🏫 Trường Rubik', ctx.school.gate[0] + 14, ctx.school.gate[1] - 10); }
    // người chơi: mũi tên + vòng nhấp nháy
    const [px, py] = toScreen(pl.pos.x, pl.pos.z);
    g.save(); g.translate(px, py);
    g.beginPath(); g.arc(0, 0, 10 + (t * 14) % 14, 0, 7); g.strokeStyle = `rgba(255,214,80,${1 - ((t * 14) % 14) / 14})`; g.lineWidth = 2.5; g.stroke();
    g.rotate(Math.PI - pl.rot); g.beginPath(); g.moveTo(0, -11); g.lineTo(8, 9); g.lineTo(0, 4); g.lineTo(-8, 9); g.closePath(); g.fillStyle = '#ffd650'; g.fill(); g.strokeStyle = '#1b1626'; g.lineWidth = 2; g.stroke();
    g.restore();
    label('Bạn' + (V && V.riding ? ' (' + ({ bike: '🚲', boat: '⛵', balloon: 'khinh khí cầu', phoenix: '🔥', mount: '🐎', animal: '🐾' })[V.riding] + ')' : ''), pl.pos.x, pl.pos.z - 4 / view.k * 2);
    document.getElementById('mapCoord').textContent = `x ${Math.round(pl.pos.x)} · z ${Math.round(pl.pos.z)} · cao ${Math.round(pl.pos.y)} m`;
  }
  let last = 0;
  const loop = now => { const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; draw(dt); if (open || Math.abs(want.k - view.k) > 0.001) raf = requestAnimationFrame(loop); };

  // ---------- Mở / đóng ----------
  function show(v) {
    if (v === open) return; open = v; ctx.mapOpen = v; el.classList.toggle('on', v);
    if (v) {
      frozenBefore = pl.frozen; pl.frozen = true; dpr = size();
      if (!building && built < bg.height) { building = true; requestAnimationFrame(buildStep); }
      const k = fitK(); view.x = want.x = pl.pos.x; view.z = want.z = pl.pos.z; view.k = k * 3; want.k = Math.max(k * 2.2, 2.4); // mở: hiện quanh mình rồi lùi ra
      last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); ctx.sfx && ctx.sfx('ui');
    } else { pl.frozen = frozenBefore; cancelAnimationFrame(raf); }
  }
  addEventListener('keydown', e => { if (e.repeat || document.body.classList.contains('rs-modal')) return; if (e.code === 'KeyM') show(!open); else if (e.code === 'Escape' && open) show(false); });
  document.getElementById('bMap').onclick = () => show(!open);
  document.getElementById('mapClose').onclick = () => show(false);
  const zoomAt = (f, sx = cv.clientWidth / 2, sy = cv.clientHeight / 2) => {
    const k = Math.max(fitK() * 0.8, Math.min(14, want.k * f)), wx = want.x + (sx - cv.clientWidth / 2) / want.k, wz = want.z + (sy - cv.clientHeight / 2) / want.k;
    want.x = wx - (sx - cv.clientWidth / 2) / k; want.z = wz - (sy - cv.clientHeight / 2) / k; want.k = k;
  };
  document.getElementById('mapIn').onclick = () => zoomAt(1.6);
  document.getElementById('mapOut').onclick = () => zoomAt(1 / 1.6);
  document.getElementById('mapMe').onclick = () => { want.x = pl.pos.x; want.z = pl.pos.z; want.k = Math.max(want.k, 4); };
  document.getElementById('mapAll').onclick = () => { want.x = (X0 + X1) / 2; want.z = (Z0 + Z1) / 2; want.k = fitK(); };
  cv.addEventListener('wheel', e => { e.preventDefault(); const r = cv.getBoundingClientRect(); zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  const pts = new Map(); let pinch = 0;
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
  cv.addEventListener('pointermove', e => {
    const p = pts.get(e.pointerId); if (!p) return;
    if (pts.size === 1) { want.x -= (e.clientX - p[0]) / want.k; want.z -= (e.clientY - p[1]) / want.k; view.x = want.x; view.z = want.z; }
    p[0] = e.clientX; p[1] = e.clientY;
    if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), r = cv.getBoundingClientRect(); if (pinch) zoomAt(d / pinch, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top); pinch = d; }
  });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('dblclick', e => { const r = cv.getBoundingClientRect(); zoomAt(2, e.clientX - r.left, e.clientY - r.top); });
  addEventListener('resize', () => { if (open) dpr = size(); });
  return { show, get open() { return open; } };
}
