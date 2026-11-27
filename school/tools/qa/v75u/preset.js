// v75u: kiểm bố cục preset của chủ game (tài khoản mới) — ảnh trước (vị trí gốc) / sau (preset), đếm cặp khối chồng, chữ < 16px, FPS, lỗi
// node tools/qa/v75u/preset.js [phone,land,desk] [?bundle] [thư-mục-ảnh]
const {chromium} = require('playwright'), path = require('path'), fs = require('fs');
const VP = {phone:{w:390,h:844,touch:true}, land:{w:844,h:390,touch:true}, desk:{w:1440,h:900}};
const LIST = (process.argv[2] || 'phone,land,desk').split(','), Q = process.argv[3] || '', OUT = process.argv[4] || path.join(__dirname, 'out'); fs.mkdirSync(OUT, {recursive:true});
async function run(b, vpn, mode){
  const v = VP[vpn], ctx = await b.newContext({viewport:{width:v.w, height:v.h}, hasTouch:!!v.touch, isMobile:!!v.touch, deviceScaleFactor:2});
  if(mode === 'truoc') await ctx.route(/v75u-preset\.js/, r => r.fulfill({status:200, contentType:'application/javascript', body:'const V75U_PRESET = null;'}));
  const p = await ctx.newPage(), logs = [];
  p.on('console', m => { if(/error|warning/.test(m.type()) && !/AudioContext|favicon|404|v61l/.test(m.text())) logs.push(m.text().slice(0, 300)); }); p.on('pageerror', e => logs.push('PAGEERROR ' + e.message));
  await p.goto('http://localhost:8792/index.html' + Q); await p.waitForFunction(() => typeof window.__dbg === 'function', null, {timeout:90000}); await p.waitForFunction(() => !document.getElementById('rsBoot'), null, {timeout:60000}).catch(() => {}); await p.waitForTimeout(2500);
  if(await p.isVisible('#lgName').catch(() => false)){ await p.fill('#lgName', 'Hà Quân ' + vpn); await p.fill('#lgPass', 'qa12345'); await p.click('#lgNew'); await p.waitForTimeout(1500);
    if(await p.isVisible('#lgName').catch(() => false)){ await p.click('#lgGo'); await p.waitForTimeout(1500); } if(await p.isVisible('#crDone').catch(() => false)){ await p.click('#crDone'); await p.waitForTimeout(1500); } }
  await p.addStyleTag({content:'#v70sDlg,#v70sCard,#v70eAch,#v59gTip,.v59gTip,#v70ePanel{display:none!important}'});
  await p.evaluate(() => window.__dbg("try{ for(let i=0;i<4;i++) if(openModal) hideModal() }catch(e){} try{ v70eClose() }catch(e){} try{ clock = 600; weather = 'nang'; autoWeather = false }catch(e){} 1")); await p.waitForTimeout(3500);
  await p.screenshot({path:path.join(OUT, `preset_${vpn}_${mode}.png`)});
  const R = await p.evaluate(() => { const V = window.__v75u; const pairs = V.v75uPairs();
    const small = []; ['#prof', '#mentor', '#v41Col', '#stage > .hud', '#quick', '#mtrack', '#mlog', '#hint'].forEach(q => { const e = document.querySelector(q); if(!e || !e.getClientRects().length) return;
      e.querySelectorAll('*').forEach(c => { if(!c.childNodes.length || ![...c.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return; if(!c.getClientRects().length) return; const fs = parseFloat(getComputedStyle(c).fontSize); if(fs < 16) small.push(q + ' ' + (c.id || c.className || c.tagName) + ' ' + fs); }); });
    const boxes = {}; ['mini', 'prof', 'mentor', 'v41Col', 'v32MenuBtn', 'v32MisBtn', 'v32LogBtn', 'v70sIc', 'mtrack', 'mlog', 'quick', 'hint', 'v75uFab', 'v70eGo'].forEach(id => { const e = document.getElementById(id); if(e && e.getClientRects().length){ const r = e.getBoundingClientRect(); boxes[id] = [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; } });
    const h = document.querySelector('#stage > .hud'); if(h && h.getClientRects().length){ const r = h.getBoundingClientRect(); boxes.hud = [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }
    return {pairs, small:[...new Set(small)].slice(0, 12), boxes, notes:V.V75U.notes || []}; });
  R.fps = await p.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if(performance.now() - t0 < 3000) requestAnimationFrame(f); else r(Math.round(n/((performance.now() - t0)/1000))); }; requestAnimationFrame(f); }));
  R.logs = logs; await ctx.close(); return R;
}
(async () => { const b = await chromium.launch(), res = {};
  for(const vpn of LIST){ res[vpn] = {truoc:await run(b, vpn, 'truoc'), sau:await run(b, vpn, 'sau')}; }
  console.log(JSON.stringify(res, null, 1)); await b.close(); })().catch(e => { console.error('FAIL', e); process.exit(1); });
