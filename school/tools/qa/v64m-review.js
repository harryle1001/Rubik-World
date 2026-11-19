// v64m: chụp bộ ảnh trước/sau cho REVIEW_v64_map.png + kiểm tra tìm kiếm, thẻ địa điểm, "Vị trí của tôi".
// node tools/qa/v64m-review.js <thư mục ra>
const {openGame, login} = require('./qa-lib');
const dir = process.argv[2];
const dbg = (p, c) => p.evaluate(c => window.__dbg(c), c);
(async () => {
  const {b, p, logs} = await openGame({w:390, h:844, touch:true}); await login(p);
  await dbg(p, "setSeason('ha'); try{ V49R.s = 'ha' }catch(e){} 1"); await p.waitForTimeout(4500);
  const shot = async (name, code, wait) => { await dbg(p, code); await p.waitForTimeout(wait || 900); await p.screenshot({path:`${dir}/${name}.png`}); };
  for(const on of [false, true]){ const tag = on ? 'after' : 'before';
    await shot(`${tag}_mini`, `v32MapClose(); V64M.on = ${on}; 1`, 1200);
    await shot(`${tag}_far`, `v32MapOpen(); 1`);
    await shot(`${tag}_near`, `const g = v46Gate(); MAP.cx = g[0]; MAP.cy = g[1] + 300; MAP.z = .12; 1`);
    await shot(`${tag}_main`, `MAP.cx = 17504; MAP.cy = 15800; MAP.z = .045; 1`);
  }
  // kiểm tra tương tác
  const chk = {};
  await dbg(p, "MAP.cx = v46Gate()[0]; MAP.cy = v46Gate()[1]; MAP.z = .12; 1"); await p.waitForTimeout(500);
  await p.fill('#v32MapQ', 'Rubik'); await p.waitForTimeout(300); chk.search = await p.evaluate(() => [...document.querySelectorAll('#v32MapList button')].map(b => b.textContent).slice(0, 3));
  await p.click('#v32MapList button'); await p.waitForTimeout(400); chk.card = await p.evaluate(() => document.querySelector('#v32MapCard b').textContent + ' | ' + document.querySelector('#v32MapCard span').textContent);
  await dbg(p, "MAP.cx = 0; MAP.cy = 0; 1"); await p.click('#v32MapMe'); await p.waitForTimeout(300); chk.me = await dbg(p, "const q = v46Pos(PLAYER); Math.round(Math.hypot(MAP.cx - q[0], MAP.cy - q[1]))");
  chk.undef = await dbg(p, "mapPlaces().filter(q => !q.name || /undefined/.test(q.name + q.ic)).length");
  chk.v48m = !!(await p.$('#v48mBtn'));
  // mùa đông
  await dbg(p, "v32MapClose(); setSeason('dong'); try{ V49R.s = 'dong' }catch(e){} 1"); await p.waitForTimeout(4500);
  await shot('winter_mini', '1', 300); await shot('winter_far', 'v32MapOpen(); 1');
  await shot('winter_near', "const g = v46Gate(); MAP.cx = g[0]; MAP.cy = g[1] + 300; MAP.z = .12; 1");
  chk.key = await dbg(p, 'V64M.key.slice(0, 12)');
  console.log(JSON.stringify(chk)); console.log('logs', JSON.stringify(logs.filter(l => !/GL Driver|v61l: danh sách FILES/.test(l.s))).slice(0, 1500)); await b.close();
  for(const vp of [[844, 390, true], [1440, 900, false]]){ const o = await openGame({w:vp[0], h:vp[1], touch:vp[2]}); await login(o.p); await o.p.waitForTimeout(4000);
    await dbg(o.p, 'v32MapOpen(); 1'); await o.p.waitForTimeout(900); await o.p.screenshot({path:`${dir}/after_${vp[0]}.png`});
    console.log(vp[0], 'logs', JSON.stringify(o.logs.filter(l => !/GL Driver|v61l: danh sách FILES/.test(l.s))).slice(0, 800)); await o.b.close(); }
})();
