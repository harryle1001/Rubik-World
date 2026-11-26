// v74r: so ảnh CẢ KHUNG HÌNH trước/sau tối ưu ở từng khu (cùng trang, cùng thời điểm: đóng băng performance.now + Math.random,
// vẽ 1 khung với V74R.on=false rồi 1 khung với V74R.on=true, so từng điểm ảnh). Lưu ảnh ghép trước|sau vào REVIEW_v74r_<vp>.png.
// node tools/qa/v74r-shots.js [desk|land|phone]
const L = require('./v69q-lib.js'), fs = require('fs');
const vp = process.argv[2] || 'desk';
const SPOTS = [['cổng trường', 0, 150], ['khu Rubik', -399, -977], ['sân bóng', 1590, 915], ['nông trại', 2160, -1073], ['ao', 1355, -2604], ['phố đông', 3000, 150], ['bãi biển', 4900, 0], ['tây bắc', -1500, -2500]];
(async () => {
  const {b, p, logs} = await L.open(vp); await L.login(p); await p.waitForTimeout(3000); const res = [], pics = [];
  for(const [name, x, y] of SPOTS){
    await p.evaluate(([x, y]) => window.__dbg(`followCam = false; cam.x = V46L.CX + ${x}; cam.y = V46L.CY + ${y}; cam.z = 1; clampCam(); 1`), [x, y]);
    await p.waitForTimeout(2500);   // cho ô nền + khu dựng xong
    const r = await p.evaluate(() => window.__dbg(`(() => {
      const pn = performance.now.bind(performance), T = pn(), mr = Math.random; let seed = 1;
      const shot = on => { seed = 12345; Math.random = () => { seed = (seed*16807) % 2147483647; return (seed - 1)/2147483646; }; performance.now = () => T;
        V74R.on = on; const pz = paused; try { render(0); } finally { paused = pz; } return cvs.toDataURL('image/png'); };
      let a, b, c0; try { shot(true); c0 = shot(true); a = shot(false); b = shot(true); } finally { performance.now = pn; Math.random = mr; V74R.on = true; }
      return {a, b, c0}; })()`));
    // so điểm ảnh trong Node bằng trang phụ (decode PNG qua canvas)
    const cmp = (a, b) => p.evaluate(({a, b}) => new Promise(done => { const ia = new Image(), ib = new Image(); let n = 0; const go = () => { if(++n < 2) return;
      const c = document.createElement('canvas'); c.width = ia.width; c.height = ia.height; const g = c.getContext('2d', {willReadFrequently:true}); g.drawImage(ia, 0, 0); const A = g.getImageData(0, 0, c.width, c.height).data; g.clearRect(0, 0, c.width, c.height); g.drawImage(ib, 0, 0); const B = g.getImageData(0, 0, c.width, c.height).data;
      let diff = 0, mx = 0, bx = [1e9, 1e9, -1, -1]; for(let i = 0; i < A.length; i++){ const v = Math.abs(A[i] - B[i]); if(v){ diff++; if(v > mx) mx = v; const q = i >> 2, x = q % c.width, y = (q/c.width) | 0; bx = [Math.min(bx[0], x), Math.min(bx[1], y), Math.max(bx[2], x), Math.max(bx[3], y)]; } } done({diff, mx, n:A.length/4, box:diff ? bx : null}); }; ia.onload = ib.onload = go; ia.src = a; ib.src = b; }), {a, b});
    const d = await cmp(r.a, r.b), ctl = await cmp(r.c0, r.b); d.ctl = ctl.diff; d.ctlBox = ctl.box;
    // khác nhau ngoài vùng tự đổi giữa 2 lần vẽ giống nhau (con vật/nhân vật có đồng hồ riêng), nới 4 px
    const B = d.box, C = ctl.box; d.real = !B ? 0 : (!C || B[0] < C[0] - 4 || B[1] < C[1] - 4 || B[2] > C[2] + 4 || B[3] > C[3] + 4) ? d.diff : 0;
    res.push({name, ...d}); console.log(name, JSON.stringify(d)); pics.push([name, r.a, r.b]);
  }
  // ảnh ghép: mỗi hàng một khu, trái = trước (tắt v74r), phải = sau
  const sheet = await p.evaluate(pics => new Promise(done => { const ims = []; let n = 0; const all = pics.length*2;
    pics.forEach(([nm, a, b], k) => [a, b].forEach((src, s) => { const im = new Image(); im.onload = () => { if(++n === all) draw(); }; im.src = src; ims[k*2 + s] = im; }));
    function draw(){ const w = ims[0].width, h = ims[0].height, sc = Math.min(1, 720/w), cw = Math.round(w*sc), chh = Math.round(h*sc), c = document.createElement('canvas'); c.width = cw*2 + 12; c.height = (chh + 30)*pics.length; const g = c.getContext('2d');
      g.fillStyle = '#111'; g.fillRect(0, 0, c.width, c.height); g.font = '700 18px sans-serif';
      pics.forEach(([nm], k) => { const y = k*(chh + 30); g.fillStyle = '#fff'; g.fillText(nm + ' — trước (trái) · sau v74r (phải)', 8, y + 21); g.drawImage(ims[k*2], 0, y + 28, cw, chh); g.drawImage(ims[k*2 + 1], cw + 12, y + 28, cw, chh); });
      done(c.toDataURL('image/png')); } }), pics.slice(0, 4));
  fs.writeFileSync(__dirname + '/../../REVIEW_v74r_' + vp + '.png', Buffer.from(sheet.split(',')[1], 'base64'));
  logs.forEach(l => console.log('LOG', l.t, l.s.slice(0, 200))); console.log(vp, 'khu khác nhau:', res.filter(r => r.real).length, '/', res.length, '| lỗi console:', logs.filter(l => !/v61l: danh sách FILES/.test(l.s)).length);
  await b.close();
})();
