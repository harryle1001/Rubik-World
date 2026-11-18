// tools/perf-vehicles.mjs — Đo hiệu năng Đảo 3D khi ĐI PHƯƠNG TIỆN ở chế độ điện thoại (390×844, DPR 2, UA iPhone → CFG.isMobile).
// Chạy: node server/index.js &  rồi  node tools/perf-vehicles.mjs [--only=bay-thap,xe] [--frames=233] [--q=1] [--out=thu/muc/anh]
// Kịch bản (lái tự động bằng phím/joystick ảo): cất cánh · bay thấp qua thị trấn · bay cao · xe đạp qua thị trấn · thuyền ra biển ·
// khinh khí cầu · lặn. Mỗi kịch bản in: draw call, tam giác (trung bình), JS ms/khung (trung bình · p95 · max), render ms/khung,
// số khung giật (JS + render > 50 ms) và nguyên nhân (phần update chiếm nhiều nhất, shader mới biên dịch, geometry/texture mới tạo).
// GPU giả lập (SwiftShader) → render ms phản ánh CPU giả lập GPU, không phải máy thật; JS ms và số shader/geometry là số đáng tin.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const URL = arg('url') || 'http://localhost:3000/ocean.html', OUT = arg('out'), Q = +(arg('q') ?? 1), NF = +(arg('frames') ?? 233);
const ONLY = arg('only') ? arg('only').split(',') : null;
if (OUT) fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
async function openPage() {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(URL);
  await page.waitForFunction(() => window.__island && __island.school && __island.school.ready, null, { timeout: 300000 });
  const fr = page.frames().find(f => f.url().includes('/school/'));
  if (fr) { const b = fr.getByText('Chỉ xem, chưa chơi'); if (await b.count().catch(() => 0)) await b.first().click({ force: true, timeout: 5000 }).catch(() => {}); }
  await page.waitForFunction(() => !__island.player.frozen, null, { timeout: 30000 }).catch(() => {});
  await page.waitForFunction(() => __island.warmed, null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // ---------- đo trong trang: bọc update của từng phần + post.render ----------
  await page.evaluate(q => {
    const c = __island; c.setQuality(q, true); c.sky.state.lock = 13; c.renderer.info.autoReset = false;
    const F = window.__pf = { on: false, frames: [], cur: {}, js: 0, last: 0, drive: null };
    const subs = ['player', 'terrain', 'vehicles', 'aircraft', 'physics', 'weather', 'eggs', 'ambience', 'sealife', 'treasure', 'skyshow', 'living', 'mg', 'animals', 'perf', 'sky', 'school', 'net', 'audio', 'worldMap', 'dive'];
    for (const k of subs) { const o = c[k]; if (!o || typeof o.update !== 'function' || o.update._pf) continue; const f = o.update;
      o.update = function () { if (k === 'player' && F.drive) F.drive(); const s = performance.now(); const r = f.apply(this, arguments); const d = performance.now() - s; F.cur[k] = (F.cur[k] || 0) + d; F.js += d; return r; }; o.update._pf = 1; }
    const info = c.renderer.info, r = c.post.render;
    F.links = []; { const gl = c.renderer.getContext(), lp = gl.linkProgram.bind(gl); gl.linkProgram = p => { if (F.on) F.links.push((new Error().stack.split('\n').filter(l => /island|ocean\.js/.test(l)).slice(0, 3).map(l => l.replace(/.*\/js\//, '').replace(/\)$/, '')).join(' < ')) || '(three)'); return lp(p); }; }
    let prog = 0, geo = 0, tex = 0; const seen = new Set();
    const label = o => { let n = o.name, q = o.parent; while (!n && q) { n = q.name; q = q.parent; } return n || o.type; };
    const pSeen = new Set(), mProg = new WeakMap();
    const newMats = () => { const out = [], fresh = info.programs.filter(q => !pSeen.has(q)); fresh.forEach(q => pSeen.add(q));
      c.scene.traverse(o => { if (!o.material) return; for (const m of [].concat(o.material)) { const cp = c.renderer.properties.get(m).currentProgram; if (cp && !mProg.has(m)) { mProg.set(m, cp); out.push(label(o) + ':' + (m.name || m.type)); } } });
      for (const q of fresh) out.push('#' + q.cacheKey.split(',')[0].slice(0, 24) + (q.cacheKey.includes('USE_SHADOWMAP') ? '' : ''));
      return out; };
    for (const q of info.programs) pSeen.add(q); c.scene.traverse(o => { if (o.material) for (const m of [].concat(o.material)) { const cp = c.renderer.properties.get(m).currentProgram; if (cp) mProg.set(m, cp); } });
    c.post.render = function () {
      info.reset(); const s = performance.now(); r.apply(this, arguments); const rd = performance.now() - s;
      const np = info.programs.length, ng = info.memory.geometries, nt = info.memory.textures;
      if (F.on) F.frames.push({ js: F.js, rd, iv: F.last ? s - F.last : 0, calls: info.render.calls, tris: info.render.triangles, prog: np - prog, pn: np > prog ? newMats() : null, geo: ng - geo, tex: nt - tex, cur: F.cur, y: c.camera.position.y, far: c.camera.far });
      F.stable = np === prog ? (F.stable || 0) + 1 : 0; prog = np; geo = ng; tex = nt; F.cur = {}; F.js = 0; F.last = s;
    };
    // phím ảo
    const held = new Set();
    F.key = (code, on) => { if (on === held.has(code)) return; on ? held.add(code) : held.delete(code); dispatchEvent(new KeyboardEvent(on ? 'keydown' : 'keyup', { code })); };
    F.release = () => { for (const k of [...held]) F.key(k, false); c.player.input.x = c.player.input.z = 0; };
  }, Q);

  L = await page.evaluate(async () => { const l = await import('/js/island/layout.js'); const e = l.EXTRA.find(e => e.id === 'K').r; return { spawn: l.SPAWN, air: e, R: l.ISLAND_R }; });

  await page.waitForFunction(() => __pf.stable > 34, null, { timeout: 300000 }).catch(() => {});   // chờ hết biên dịch lại do khoá giờ 13h (đổi số đèn)
  return page;
}
let L;
// kịch bản: setup (trong trang) rồi drive (gọi mỗi khung trước player.update)
const SCEN = {
  'cat-canh': { setup: () => { __island.aircraft.board(); }, drive: 'plane', wp: [[400, 400, 15]] },
  'bay-thap': { setup: 'fly', wp: [[0, 0, 18], [-120, -60, 18]], alt0: 18 },
  'bay-cao': { setup: 'fly', wp: [[0, 0, 80], [-150, -100, 80]], alt0: 80 },
  'xe-dap': { setup: () => { const c = __island, p = c.player; p.teleport(c.__L.spawn[0] + 6, c.__L.spawn[1]); c.vehicles.toggleBike(); }, drive: 'ground', wp: [[60, 30], [90, 0], [60, -50], [0, -90], [-60, -60]] },
  'thuyen': { setup: () => { const c = __island, b = c.vehicles.all.filter(v => v.type === 'boat').sort((a, b) => Math.hypot(b.group.position.x, b.group.position.z) - Math.hypot(a.group.position.x, a.group.position.z))[0]; c.player.teleport(b.group.position.x, b.group.position.z); c.vehicles.mount(b); c.__boatDir = Math.atan2(b.group.position.x, b.group.position.z); }, drive: 'boat' },
  'khinh-khi-cau': { setup: () => { const c = __island, p = c.player; p.teleport(c.__L.spawn[0] + 14, c.__L.spawn[1] + 6); c.vehicles.toggleBalloon(); }, drive: 'balloon', wp: [[0, 0], [-60, -40], [-120, -80]] },
  'lan': { setup: () => { const c = __island, b = c.vehicles.all.filter(v => v.type === 'boat')[0], a = Math.atan2(b.group.position.x, b.group.position.z); c.player.teleport(Math.sin(a) * (c.__L.R + 20), Math.cos(a) * (c.__L.R + 20)); c.__boatDir = a; }, drive: 'dive' },
};
const rows = [], spikes = {};
for (const [name, S] of Object.entries(SCEN)) {
  if (ONLY && !ONLY.includes(name)) continue;
  const page = await openPage(); await page.evaluate(L => { __island.__L = L; }, L);
  await page.evaluate(() => {
    const c = __island, F = __pf, wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
    F.mk = () => () => {
      const p = c.player, m = F.mode, w = F.wp && F.wp[F.wi || 0];
      if (m === 'plane') {
        const pl = c.aircraft.planes.find(q => !q.parked && !q.route); if (!pl) return; const P = pl.group.position, yaw = pl.group.rotation.y;
        if (Math.hypot(w[0] - P.x, w[1] - P.z) < 25 && F.wi < F.wp.length - 1) F.wi++;
        const d = wrap(Math.atan2(w[0] - P.x, w[1] - P.z) - yaw); F.key('KeyA', d > 0.08); F.key('KeyD', d < -0.08);
        F.key('KeyW', P.y < w[2] - 2); F.key('KeyS', P.y > w[2] + 4);
      } else if (m === 'ground' || m === 'balloon') {
        if (Math.hypot(w[0] - p.pos.x, w[1] - p.pos.z) < 6 && F.wi < F.wp.length - 1) F.wi++;
        p.cam.yaw = Math.atan2(w[0] - p.pos.x, w[1] - p.pos.z) + Math.PI; p.input.z = -1;
        if (m === 'balloon') F.key('Space', p.pos.y < 55);
      } else if (m === 'boat' || m === 'dive') {
        p.cam.yaw = c.__boatDir + Math.PI; p.input.z = -1;
        if (m === 'dive' && c.dive.swimming) { const b = document.getElementById('bDive'); if (b && !c.dive.diving && !F.dv) { F.dv = 1; b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); } }
      }
    };
  });
  if (S.setup === 'fly') {
    await page.evaluate(alt => { __island.aircraft.board(); Object.assign(__pf, { mode: 'plane', wp: [[400, 400, alt]], wi: 0 }); __pf.drive = __pf.mk(); }, S.alt0);   // cất cánh trước (không đo)
    await page.waitForFunction(a => { const pl = __island.aircraft.planes.find(q => !q.parked && !q.route); return __island.aircraft.phase === 'fly' && pl && Math.abs(pl.group.position.y - a) < 6; }, S.alt0, { timeout: 180000 }).catch(() => {});
    await page.evaluate(wp => { __pf.wp = wp; __pf.wi = 0; }, S.wp);
  } else {
    await page.evaluate(([src, mode, wp]) => { (0, eval)('(' + src + ')')(); Object.assign(__pf, { mode, wp, wi: 0, dv: 0 }); __pf.drive = __pf.mk(); }, [S.setup.toString(), S.drive, S.wp || null]);
    if (S.drive === 'plane') await page.evaluate(() => { __pf.mode = 'plane'; });
  }
  await page.evaluate(() => { __pf.frames = []; __pf.on = true; });
  await page.waitForFunction(N => __pf.frames.length >= N, NF, { timeout: 900000 }).catch(() => {});
  const m = await page.evaluate(() => {
    const F = __pf, fr = F.frames; F.on = false; const n = fr.length || 1;
    const js = fr.map(f => f.js).sort((a, b) => a - b), avg = k => fr.reduce((s, f) => s + f[k], 0) / n;
    const sp = fr.filter(f => f.js + f.rd > 50 && (f.js > 25 || f.prog || f.geo > 2 || f.tex));   // khung giật do JS/biên dịch/tạo mới (không tính render giả lập đều đều)
    const why = f => { const top = Object.entries(f.cur).sort((a, b) => b[1] - a[1])[0] || ['?', 0]; return `${top[0]} ${top[1].toFixed(0)}ms` + (f.prog ? ` +${f.prog} shader` : '') + (f.geo > 0 ? ` +${f.geo} geo` : '') + (f.tex > 0 ? ` +${f.tex} tex` : '') + ` (render ${f.rd.toFixed(0)}ms)`; };
    const sub = {}; for (const f of fr) for (const [k, v] of Object.entries(f.cur)) sub[k] = (sub[k] || 0) + v;
    const top = Object.entries(sub).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${(v / n).toFixed(1)}`).join(' · ');
    const pl = __island.aircraft.planes.find(q => !q.parked && !q.route), P = pl ? pl.group.position : __island.player.pos;
    return { n: fr.length, calls: Math.round(avg('calls')), tris: Math.round(avg('tris') / 1000) + 'k', jsAvg: +avg('js').toFixed(1), jsP95: +js[Math.floor(n * 0.95)]?.toFixed(1), jsMax: +js[n - 1]?.toFixed(1), rd: +avg('rd').toFixed(0), spikes: sp.length, shader: fr.reduce((s, f) => s + f.prog, 0), geo: fr.reduce((s, f) => s + Math.max(0, f.geo), 0), far: Math.round(fr[n - 1]?.far || 0), y: Math.round(P.y), top, why: sp.slice(0, 6).map(why), pn: [...new Set(fr.flatMap(f => f.pn || []))], links: Object.entries(F.links.reduce((a, k) => (a[k] = (a[k] || 0) + 1, a), {})).map(([k, v]) => v + '× ' + k) };
  });
  if (OUT) await page.screenshot({ path: `${OUT}/${name}.jpg`, quality: 72, scale: 'css' });
  spikes[name] = m.why; const pn = m.pn, links = m.links; delete m.why; delete m.pn; delete m.links; rows.push({ name, ...m });
  console.log(name, JSON.stringify(m), '\n   giật:', spikes[name].join(' | ') || '-', '\n   shader mới:', pn.join(', ') || '-', '\n   linkProgram:\n     ' + (links.join('\n     ') || '-'));
  await page.close();
}
console.table(rows);
console.log(errors.length ? 'LỖI CONSOLE:\n' + [...new Set(errors)].slice(0, 10).join('\n') : 'Không lỗi console');
await browser.close();
