const { chromium } = require('playwright');
const tag = process.argv[2] || 'after';
const sizes = [['p390',390,844,true],['p360',360,740,true],['land',844,390,true],['pc',1440,900,false],['pc720',1280,720,false]];
const STATES = {
  base: `void 0`,
  act: `(()=>{const a=$('bAct');a.hidden=false;a.textContent='✈️ Lái máy bay';})()`,
  bike: `(()=>{$('bBell').hidden=false;$('bRun').hidden=$('bJump').hidden=true;$('bBike').textContent='🚶';const a=$('bAct');a.hidden=false;a.textContent='🚲 Xuống xe đạp';})()`,
  swim: `(()=>{$('bRun').hidden=$('bJump').hidden=true;$('bDive').hidden=false;})()`,
  dive: `(()=>{$('bRun').hidden=$('bJump').hidden=true;$('bDive').hidden=false;$('bSurf').hidden=false;$('o2').classList.add('on');
          document.querySelector('#bSea').innerHTML='<i>🧰</i><span class="tx"><small>Kho báu</small><b>2/13</b></span><em class="cmp">🧭 Đông Bắc 123 m</em>';
          const f=document.querySelector('iframe').contentDocument.getElementById('toast'); f.hidden=false; f.textContent='🎉 Sự kiện: Hội chợ sách đang diễn ra ở sân trường!';
          window.__toast('Đến gần rương rồi bấm <b>E</b> để mở nhé');})()`,
  plane: `(()=>{$('bRun').hidden=$('bJump').hidden=true;$('bBoost').hidden=false;document.querySelector('.vbtns').style.display='none';
          const h=[...document.querySelectorAll('body>div')].find(d=>d.style.top.includes('89px')); h.style.display='block'; h.id='__planeHud'; h.textContent='✈️ Cánh Diều · ⛰ 120 m · 180 km/h · 🧭 Đông Nam'; $('o2').classList.add('on');
          const a=$('bAct');a.hidden=false;a.textContent='🛬 Hạ cánh';})()`,
  menu: `(()=>{$('bMore').click();})()`,
  bright: `(()=>{$('bMore').click();$('bBright').click();})()`,
};
(async()=>{
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  let fails = 0;
  for (const [n,w,h,m] of sizes){
    const c = await b.newContext({viewport:{width:w,height:h},isMobile:m,hasTouch:m});
    const p = await c.newPage(); const errs=[];
    p.on('pageerror',e=>errs.push(e.message)); p.on('console',x=>{if(x.type()==='error')errs.push(x.text())});
    await p.goto('http://localhost:3000/ocean.html'); await p.waitForTimeout(1000);
    await p.evaluate(()=>{ window.$=id=>document.getElementById(id); });
    const snap0 = {};
    for (const [st,code] of Object.entries(STATES)){
      if (tag==='before' && st!=='base') continue; if (process.env.ONLY && !process.env.ONLY.split(',').includes(st)) continue;
      await p.reload(); await p.waitForTimeout(st==='base'?20000:14000);
      await p.evaluate(()=>{ window.$=id=>document.getElementById(id);
        window.__toast=t=>__island.toast(t); __island.flushOffer=()=>{}; });
      // dùng toast thật nếu có
      if(st==='dive') await p.waitForFunction(()=>{const d=document.querySelector('iframe').contentDocument; return d&&[...d.querySelectorAll('style')].some(x=>x.textContent.includes('rs-embed body #stage'));},null,{timeout:60000});
      await p.evaluate(code); await p.waitForTimeout(700);
      await p.screenshot({path:`${tag}-${n}-${st}.png`});
      const r = await p.evaluate(()=>{
        const vis=e=>{ for(let x=e;x&&x!==document.body;x=x.parentElement){const s=getComputedStyle(x); if(s.display==='none'||s.visibility==='hidden'||+s.opacity<0.05)return false;} return true; };
        const out=[]; const add=(id,e,kind)=>{ if(!e||!vis(e))return; const q=e.getBoundingClientRect(); if(q.width<2)return; out.push({id,kind,x:q.left,y:q.top,r:q.right,b:q.bottom}); };
        document.querySelectorAll('.topbtns>button,#bMore,#bMap,.vbtns>button,.btns>button,#bAct,#moreMenu,#brightBox').forEach(e=>add(e.id,e,'btn'));
        add('o2',$('o2'),'hud'); add('planeHud',$('__planeHud'),'hud'); add('info',$('info'),'hud'); add('cmp',document.querySelector('.cmp'),'hud');
        const f=document.querySelector('iframe'); const t=f.contentDocument.getElementById('toast'); if(t&&!t.hidden){const q=t.getBoundingClientRect(); out.push({id:'banner',kind:'hud',x:q.left,y:q.top,r:q.right,b:q.bottom});}
        return out.map(o=>({...o,x:Math.round(o.x),y:Math.round(o.y),r:Math.round(o.r),b:Math.round(o.b)}));
      });
      // giao nhau (bỏ cặp menu/brightBox với nút ở dưới — là bảng nổi tạm thời)
      const over=[]; const off=[];
      for(let i=0;i<r.length;i++){const A=r[i]; if(A.x<0||A.y<0||A.r>w||A.b>h) off.push(A.id);
        for(let j=i+1;j<r.length;j++){const B=r[j];
          if(A.x<B.r&&B.x<A.r&&A.y<B.b&&B.y<A.b){ const pop=['moreMenu','brightBox']; if(pop.includes(A.id)!==pop.includes(B.id) && !['bMore','bMap'].includes(A.id) && !['bMore','bMap'].includes(B.id) && (pop.includes(A.id)||pop.includes(B.id)) && (A.id==='bBright'||B.id==='bBright'||A.id==='bMenu'||B.id==='bMenu')) continue;
            if((A.id==='moreMenu'&&['bMenu','bBright'].includes(B.id))||(B.id==='moreMenu'&&['bMenu','bBright'].includes(A.id))) continue;
            over.push(A.id+'×'+B.id);} }}
      // ổn định: nút cố định không dời so với base
      const pos={}; r.forEach(o=>pos[o.id]=o);
      if(st==='base') Object.assign(snap0,pos);
      const moved=[]; for(const id of ['bBike','bBalloon','bGaze','bMap','bMore','bSchool','bEggs','bSea']) if(snap0[id]&&pos[id]&&(snap0[id].x!==pos[id].x||snap0[id].y!==pos[id].y)) moved.push(id);
      const bad = over.length||off.length||moved.length; if(bad) fails++;
      if(st==='dive') console.log('   info:', await p.evaluate(()=>$('info').innerHTML));
      console.log(`${n} ${st}: ${bad?'❌':'✅'} overlap=[${over}] offscreen=[${off}] moved=[${moved}]`);
      console.log('   '+r.map(o=>`${o.id}[${o.x},${o.y}→${o.r},${o.b}]`).join(' '));
    }
    if(tag!=='before'){ // dive slot: bDive must equal bRun slot; bSurf = bJump slot  (checked via screenshots/positions above)
    }
    console.log(`${n} console errors:`, errs.length? errs.slice(0,5):'none');
    await c.close();
  }
  console.log('FAILS', fails);
  await b.close();
})();
