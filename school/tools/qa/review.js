// Chụp ảnh cho REVIEW_v54_qa.png: Robo đang đi, bảng báo cáo trong game, các cặp Trước/Sau (kèm toạ độ phần tử để khoanh đỏ)
const fs = require('fs'), path = require('path');
const {chromium} = require('playwright');
const {openGame, login, owner} = require('./qa-lib');
const OUT = path.join(__dirname, 'out', 'review'); fs.mkdirSync(OUT, {recursive:true});
const BASE = 'http://localhost:8754/index.html';
const rect = (p, sels) => p.evaluate(S => S.map(s => { const e = document.querySelector(s); if(!e || !e.getClientRects().length) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }), sels);
async function shot(b, name, vp, url, cmd, wait, sels){
  process.env.QA_URL = url; delete require.cache[require.resolve('./qa-lib')];
  const {openGame, login, owner} = require('./qa-lib');
  const {ctx, p} = await openGame(vp, {browser:b}); await login(p); await owner(p); await p.waitForTimeout(2500);
  if(cmd) await p.evaluate(c => window.__dbg(c), cmd); await p.waitForTimeout(wait || 1500);
  const r = sels ? await rect(p, sels) : null;
  await p.screenshot({path:path.join(OUT, name + '.png')}); await ctx.close(); return r;
}
(async () => {
  const b = await chromium.launch(), meta = {};
  const PH = {w:390, h:844, touch:true}, LA = {w:844, h:390, touch:true}, DE = {w:1440, h:900};
  meta.robo = await shot(b, 'robo', PH, BASE, "setTimeout(() => v54qStart({only:['place'], max:6}), 0)", 3200);
  meta.panel = await shot(b, 'panel', PH, BASE, "v54qStart({only:['map','hud'], max:3}).then(() => v54qOpen())", 4500);
  const HUD = ['#v52ldBtn', '#v32MisBtn', '#mentor', '#v51pBtn', '#prof', '#v41Col'];
  for(const [k, u] of [['before', BASE + '?v54nofix'], ['after', BASE]]){
    meta['land_' + k] = await shot(b, 'land_' + k, LA, u, 'dailyWisdom()', 1800, HUD);
    meta['phone_' + k] = await shot(b, 'phone_' + k, PH, u, "openLab('3')", 1800, ['#mLab b', '#prof', '#v41Col']);
    meta['shop_' + k] = await shot(b, 'shop_' + k, DE, u, "PROF.money = 500; openShop('bike')", 1800, ['#mentor', '#shopGrid']);
  }
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 1)); await b.close(); console.log(JSON.stringify(meta));
})();
