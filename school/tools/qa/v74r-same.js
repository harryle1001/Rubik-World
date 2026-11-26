// v74r: so từng điểm ảnh lớp nền giữa bản cũ (V74R.on=false) và bản mới, ở nhiều chỗ trên đảo + nhiều mức thu phóng.
// node tools/qa/v74r-same.js [desk|land|phone]
const L = require('./v69q-lib.js');
const vp = process.argv[2] || 'desk';
const SPOTS = [[0, 150], [3000, 150], [3000, -2500], [-1500, -2500], [-1500, 2500], [2500, 2500], [-399, -977], [1590, 915], [4900, 0], [0, 5000]];
(async () => {
  const {b, p, logs} = await L.open(vp); await L.login(p); await p.waitForTimeout(2500); const out = [];
  for(const z of [1, .7, .4]) for(const [x, y] of SPOTS){
    await p.evaluate(([x, y, z]) => window.__dbg(`followCam = false; cam.x = V46L.CX + ${x}; cam.y = V46L.CY + ${y}; cam.z = ${z}; clampCam(); 1`), [x, y, z]);
    await p.waitForTimeout(700);
    const r = await p.evaluate(() => window.__dbg(`(() => {
      const W = cvs.width, H = cvs.height, mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
      const VBn = Object.assign({}, V46.VBn), T = mainCtx.getTransform ? null : null;
      // dựng lại phép biến đổi camera như v46Render
      const s = DPR*cam.z, tr = [s, 0, 0, s, DPR*(cw/2 - cam.x*cam.z) + .37, DPR*(ch/2 - cam.y*cam.z) + .61];
      const run = on => { const c = mk(), g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.setTransform(...tr); const prev = ctx; ctx = g; V74R.on = on; try { V46T.budget = 9; v46DrawGround(VBn); } finally { ctx = prev; V74R.on = true; } return g.getImageData(0, 0, W, H).data; };
      V74R.stat.skip = V74R.stat.full = 0;
      for(let k = 0; k < 6; k++) run(true); V74R.stat.skip = 0; const a = run(false), b = run(true); let diff = 0, mx = 0; for(let i = 0; i < a.length; i++){ const d = Math.abs(a[i] - b[i]); if(d){ diff++; if(d > mx) mx = d; } }
      return {z:+cam.z.toFixed(2), x:Math.round(cam.x), y:Math.round(cam.y), diff, mx, skip:V74R.stat.skip, full:V74R.stat.full}; })()`));
    out.push(r); console.log(JSON.stringify(r));
  }
  const bad = out.filter(r => r.diff); logs.forEach(l => console.log('LOG', l.t, l.s)); console.log(vp, 'chỗ khác nhau:', bad.length, '/', out.length, 'lỗi console:', logs.length);
  await b.close();
})();
