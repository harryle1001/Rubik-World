// v63f: chụp TRƯỚC/SAU các lỗi chính rồi ghép school/REVIEW_v63_fix.png (khoanh đỏ đánh số, ghi chú tiếng Việt).
// Cần 2 máy chủ: bản trước (QA_BEFORE, mặc định :8755) và bản sau (QA_URL, mặc định :8754). Chạy từ school/: node tools/qa/v63f-review.js
const fs = require('fs'), path = require('path');
const {chromium} = require('playwright');
const OUT = path.join(__dirname, 'out', 'v63f'); fs.mkdirSync(OUT, {recursive:true});
const URLS = {b:process.env.QA_BEFORE || 'http://localhost:8755/index.html', a:process.env.QA_URL || 'http://localhost:8754/index.html'};
const box = s => `(() => { const e = document.querySelector(${JSON.stringify(s)}); if(!e) return null; const r = e.getBoundingClientRect(); return r.width ? [r.x, r.y, r.width, r.height] : null; })()`;
// mỗi cảnh: cỡ màn, code mở cảnh, các phần tử cần khoanh (selector + ghi chú trước/sau)
const SC = [
  {k:'chess', w:390, h:844, t:1, code:"openChess()", rings:[['#cstatus', 'Cờ vua (điện thoại): dòng “Lượt Trắng đi” 14px → 16px']]},
  {k:'hud', w:844, h:390, t:1, code:"0", rings:[['#prof', 'Màn ngang: tên, level, tiền 12px → 16px'], ['#v41Col', 'Cột nút: nhãn Lamp/Bike/Plane 10px → 16px']]},
  {k:'mentor', w:1440, h:900, t:0, code:"mentorSay('math', 'Thử thẻ lời dạy để xem vị trí', null, true)", rings:[['#v56pBtn', 'Máy tính: thẻ lời dạy đè nút 🪐 Hành tinh → dời sang phải cột nút'], ['#mentor', '']]},
  {k:'tin', w:390, h:844, t:1, code:"v51tOpen()", wait:1500, rings:[['#v51tPan .v51tx', 'Trường tin học: nút ✕ của bảng đè nút ? ở thanh trên → ẩn ? / 🏆 khi bảng mở']]},
];
(async () => {
  const b = await chromium.launch(), meta = {};
  for(const s of SC) for(const v of ['b', 'a']){
    const ctx = await b.newContext({viewport:{width:s.w, height:s.h}, hasTouch:!!s.t, isMobile:!!s.t, deviceScaleFactor:1}), p = await ctx.newPage();
    await p.goto(URLS[v]); await p.waitForFunction(() => typeof window.__dbg === 'function', null, {timeout:30000}); await p.waitForTimeout(2500);
    const {login} = require('./qa-lib'); await login(p);
    await p.evaluate(c => window.__dbg(c), s.code).catch(() => {}); await p.waitForTimeout(s.wait || 1200);
    const R = []; for(const [sel] of s.rings) R.push(await p.evaluate(c => window.__dbg(c), box(sel)).catch(() => null));
    await p.screenshot({path:path.join(OUT, `${s.k}-${v}.png`)}); meta[`${s.k}-${v}`] = R; await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta));
  // ghép ảnh
  let num = 0; const notes = [], img = n => 'data:image/png;base64,' + fs.readFileSync(path.join(OUT, n + '.png')).toString('base64');
  const pic = (s, v, sc) => { const R = meta[`${s.k}-${v}`]; const rs = s.rings.map(([sel, t], i) => { const r = R[i]; if(!r || !t) return ''; if(v === 'a') return '';
      num++; notes.push([num, t]); const pad = 8; return `<div class="ring" style="left:${(r[0] - pad)*sc}px;top:${(r[1] - pad)*sc}px;width:${(r[2] + 2*pad)*sc}px;height:${(r[3] + 2*pad)*sc}px"><b>${num}</b></div>`; }).join('');
    const ra = v === 'a' ? s.rings.map(([sel, t], i) => { const r = R[i]; if(!r || !t) return ''; const pad = 8; const n = notes.find(x => x[1] === t); return `<div class="ring ok" style="left:${(r[0] - pad)*sc}px;top:${(r[1] - pad)*sc}px;width:${(r[2] + 2*pad)*sc}px;height:${(r[3] + 2*pad)*sc}px"><b>${n ? n[0] : ''}</b></div>`; }).join('') : '';
    return `<figure><div class="im"><img src="${img(s.k + '-' + v)}" style="width:${s.w*sc}px">${rs}${ra}</div><figcaption>${v === 'b' ? '❌ Trước' : '✅ Sau'}</figcaption></figure>`; };
  const scale = s => s.w > 1000 ? .5 : s.w > 600 ? .62 : .62;
  const body = SC.map(s => `<div class="pair">${pic(s, 'b', scale(s))}${pic(s, 'a', scale(s))}</div>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap" rel="stylesheet">
<style>body{margin:0;background:#f6f4ee;font:700 18px/1.45 Nunito,sans-serif;color:#1d2433;width:1900px}h1{margin:0;padding:24px 32px 4px;font-size:36px;font-weight:900}.sub{padding:0 32px 10px;color:#5a6378;font-size:19px}
.wrap{display:flex;flex-wrap:wrap;gap:22px;padding:8px 32px}.pair{display:flex;gap:12px;background:#fff;border-radius:16px;padding:12px;box-shadow:0 4px 16px rgba(0,0,0,.08)}
figure{margin:0}.im{position:relative;border-radius:12px;overflow:hidden}.im img{display:block}figcaption{padding:6px 2px 0;font-size:18px;font-weight:900}
.ring{position:absolute;border:4px solid #e53935;border-radius:50%;box-shadow:0 0 0 2px #fff}.ring.ok{border-color:#2e7d32}.ring b{position:absolute;left:-14px;top:-14px;width:30px;height:30px;border-radius:50%;background:#e53935;color:#fff;display:grid;place-items:center;font-size:17px}.ring.ok b{background:#2e7d32}
ol{margin:6px 32px 26px;padding:16px 16px 16px 46px;background:#fff;border-radius:16px;font-size:20px}li{margin:4px 0}</style></head><body>
<h1>🛠 v63 · Sửa lỗi theo báo cáo 10 thầy cô</h1><div class="sub">Vòng đỏ = lỗi trước khi sửa · vòng xanh = cùng chỗ sau khi sửa. Thêm: bật lại v54qFixInit (bị rơi khi merge), FPS báo cáo không còn cộng dồn, Rubik 3D chỉ vẽ khi khối đổi.</div>
<div class="wrap">${body}</div><ol>${notes.map(([n, t]) => `<li value="${n}">${t}</li>`).join('')}</ol></body></html>`;
  const p = await (await b.newContext({viewport:{width:1900, height:800}, deviceScaleFactor:1})).newPage(); await p.setContent(html); await p.waitForTimeout(800);
  await p.screenshot({path:path.join(__dirname, '..', '..', 'REVIEW_v63_fix.png'), fullPage:true}); await b.close(); console.log('xong', notes.length, 'ghi chú');
})();
