// v74r: thử tắt từng phần (chỉ để đo, không phải sửa) → biết phần nào thực sự ăn FPS. node tools/qa/v74r-exp.js [desk] [cpu] [q]
const L = require('./v69q-lib.js');
const [vp = 'desk', cpu = '1', q = '2'] = process.argv.slice(2);
const fps = (p, ms) => p.evaluate(ms => new Promise(res => { const T = []; let last = performance.now(), t0 = last; const f = t => { T.push(t - last); last = t; if(t - t0 < ms) requestAnimationFrame(f); else { const a = T.slice(3), s = a.reduce((x, y) => x + y, 0); res(+(1000*a.length/s).toFixed(1)); } }; requestAnimationFrame(f); }), ms);
// main-thread busy time per frame (đo bằng long-task-free cách: thời gian trong frame())
const VAR = {
  base: '',
  noGround: 'v46DrawGround = function(){};',
  noShore: 'v46Shore = function(){};',
  noDark: 'v25Dark = function(){ return true; };',
  noLight: 'v46Lighting = function(){};',
  noZones: 'v46ZonePass = function(){};',
  noPeople: 'v53vDrawPerson = function(){};',
  noW47: 'v47wWorld = function(){};',
  noLabels: 'drawLabels = function(){};',
  noMini: 'renderMini = function(){};',
  noExtUpd: 'extUpdate = function(){};',
  base2: '',
};
(async () => {
  const b = await require('playwright').chromium.launch(); const res = {};
  for(const [k, code] of Object.entries(VAR)){
    const ctx = await b.newContext({viewport:{width:L.VPS[vp].w, height:L.VPS[vp].h}, hasTouch:!!L.VPS[vp].touch, isMobile:!!L.VPS[vp].touch, deviceScaleFactor:1});
    await ctx.addInitScript(q => { try { localStorage.setItem('truong-v70f-gfx', JSON.stringify({q:+q, auto:false})); } catch(e){} }, q);
    const {p} = await L.open(vp, {browser:b, ctx, q:process.env.QS || ''}); await L.login(p); await p.waitForTimeout(3000);
    if(+cpu > 1){ const c = await ctx.newCDPSession(p); await c.send('Emulation.setCPUThrottlingRate', {rate:+cpu}); }
    if(code) await p.evaluate(c => window.__dbg(c + ' 1'), code);
    await p.waitForTimeout(800); const a = await fps(p, 5000), bb = await fps(p, 5000); res[k] = [a, bb]; console.log(k, a, bb); await ctx.close();
  }
  await b.close();
})();
