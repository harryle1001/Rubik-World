// v69q: thư viện QA (dựa trên qa-lib v54) — server: node tools/build/serve.js . 8792
const {chromium} = require('playwright');
const BASE = process.env.QA_URL || 'http://localhost:8792/index.html';
const VPS = {phone:{w:390, h:844, touch:true}, land:{w:844, h:390, touch:true}, desk:{w:1440, h:900}};
async function open(vpn, opts = {}){
  const vp = VPS[vpn] || vpn; const b = opts.browser || await chromium.launch();
  const touch = !!vp.touch;
  const ctx = opts.ctx || await b.newContext({viewport:{width:vp.w, height:vp.h}, hasTouch:touch, isMobile:touch, deviceScaleFactor:1});
  const p = await ctx.newPage(); const logs = [];
  p.on('console', m => { const t = m.type(); if(t === 'warning' || t === 'error'){ const s = m.text(); if(!/AudioContext was not allowed|GL Driver|GPU stall/.test(s)) logs.push({t, s:s.slice(0, 500)}); } });
  p.on('pageerror', e => logs.push({t:'pageerror', s:String(e.message).slice(0, 400), st:String(e.stack || '').slice(0, 800)}));
  await p.goto(BASE + (opts.q || '')); await p.waitForFunction(() => typeof window.__dbg === 'function', null, {timeout:60000});
  await p.waitForTimeout(2500);
  return {b, ctx, p, logs};
}
async function login(p, name = 'qa' + Math.random().toString(36).slice(2, 7), pass = 'qa12345'){
  if(await p.isVisible('#lgName').catch(() => false)){
    await p.fill('#lgName', name); await p.fill('#lgPass', pass); await p.click('#lgNew'); await p.waitForTimeout(1500);
    if(await p.isVisible('#crDone').catch(() => false)){ await p.click('#crDone'); await p.waitForTimeout(1500); }
    if(await p.isVisible('#lgName').catch(() => false)){ await p.click('#lgGo').catch(() => {}); await p.waitForTimeout(1500); }
  }
  const go = p.getByText('Vào game', {exact:true}); if(await go.isVisible().catch(() => false)){ await go.click(); await p.waitForTimeout(1500); }
  for(let i = 0; i < 4; i++) await p.evaluate(() => window.__dbg("try{ if(openModal) closeModal(openModal) }catch(e){}")).catch(() => {});
  await p.waitForTimeout(500); return name;
}
const dbg = (p, c) => p.evaluate(c => window.__dbg(c), c);
// quét DOM đang hiện: chữ undefined/NaN, chữ < 16px, nút < 44px, phần tử tràn màn hình
async function scan(p){ return p.evaluate(() => { const out = {bad:[], small:[], tiny:[], over:[]}; const W = innerWidth, H = innerHeight;
  for(const e of document.querySelectorAll('body *')){ const cs = getComputedStyle(e); if(cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const r = e.getBoundingClientRect(); if(r.width < 1 || r.height < 1 || r.bottom < 0 || r.right < 0 || r.top > H || r.left > W) continue;
    const own = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    if(own){ if(/\bundefined\b|\bNaN\b|\[object|null\b/.test(own)) out.bad.push((e.id || e.className || e.tagName) + ': ' + own.slice(0, 80));
      const fs = parseFloat(cs.fontSize); if(fs < 16 && e.tagName !== 'CANVAS') out.small.push(fs + 'px ' + (e.id || String(e.className).slice(0, 30) || e.tagName) + ': ' + own.slice(0, 30)); }
    if((e.tagName === 'BUTTON' || e.getAttribute('role') === 'button') && (r.width < 40 || r.height < 40)) out.tiny.push(Math.round(r.width) + 'x' + Math.round(r.height) + ' ' + (e.id || String(e.className).slice(0, 30)) + ' ' + (e.textContent || '').trim().slice(0, 20));
    if(r.right > W + 2 || r.left < -2) if(cs.position !== 'fixed' || true) out.over.push((e.id || String(e.className).slice(0, 30) || e.tagName) + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
  }
  for(const k in out) out[k] = [...new Set(out[k])].slice(0, 40); return out; }); }
async function fps(p, ms = 5000, move = true){ return p.evaluate(([ms, move]) => new Promise(done => { const T = []; let last = performance.now(), t0 = last; const dirs = ['right', 'up', 'left', 'down'];
  const step = now => { T.push(now - last); last = now; if(move){ const k = Math.floor((now - t0)/1200) % 4; window.__dbg(`keys.up=keys.down=keys.left=keys.right=false; keys['${dirs[k]}']=true; 1`); }
    if(now - t0 < ms) requestAnimationFrame(step); else { window.__dbg('keys.up=keys.down=keys.left=keys.right=false; 1'); const fr = T.slice(5), avg = fr.reduce((s, v) => s + v, 0)/fr.length; const s = fr.slice().sort((a, b) => a - b); done({fps:+(1000/avg).toFixed(1), p95:+s[Math.floor(s.length*.95)].toFixed(1), max:+s[s.length-1].toFixed(1)}); } };
  requestAnimationFrame(step); }), [ms, move]); }
module.exports = {open, login, dbg, scan, fps, VPS, BASE};
