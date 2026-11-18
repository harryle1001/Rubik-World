// Thư viện chung cho QA v54: mở game, tạo/đăng nhập tài khoản thử, bật chế độ chủ game qua window.__dbg (chỉ localhost)
const {chromium} = require('playwright');
const URL = process.env.QA_URL || 'http://localhost:8754/index.html';

async function openGame(vp, opts = {}){
  const b = opts.browser || await chromium.launch();
  const touch = !!vp.touch;
  const ctx = await b.newContext({viewport:{width:vp.w, height:vp.h}, hasTouch:touch, isMobile:touch, deviceScaleFactor:1});
  const p = await ctx.newPage();
  const logs = [];
  p.on('console', m => { const t = m.type(); if(t === 'warning' || t === 'error'){ const s = m.text(); if(!/AudioContext was not allowed/.test(s)) logs.push({t, s:s.slice(0, 400)}); } });
  p.on('pageerror', e => logs.push({t:'pageerror', s:String(e.message).slice(0, 400), st:String(e.stack || '').slice(0, 600)}));
  await p.goto(URL); await p.waitForFunction(() => typeof window.__dbg === 'function', null, {timeout:30000});
  await p.waitForTimeout(2500);
  return {b, ctx, p, logs};
}

async function login(p, name = 'robo_qa', pass = 'qa12345'){
  const has = await p.$('#lgName');
  if(has && await has.isVisible()){
    await p.fill('#lgName', name); await p.fill('#lgPass', pass);
    await p.click('#lgNew'); await p.waitForTimeout(1500);
    if(await p.isVisible('#lgName').catch(() => false)){ await p.click('#lgGo'); await p.waitForTimeout(1500); }
  }
  const go = p.getByText('Vào game', {exact:true}); if(await go.isVisible().catch(() => false)){ await go.click(); await p.waitForTimeout(1500); }
  // đóng mọi cửa sổ còn mở (chọn nhân vật, giới thiệu…)
  for(let i = 0; i < 4; i++) await p.evaluate(() => window.__dbg("try{ if(openModal) closeModal(openModal) }catch(e){}")).catch(() => {});
  await p.waitForTimeout(500);
}

async function owner(p){ await p.evaluate(() => window.__dbg("OWNER.is = true; consoleApply(); try{ v54qOwnerUI && v54qOwnerUI() }catch(e){}")); }

module.exports = {openGame, login, owner, URL};
