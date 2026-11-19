// v71d: chụp TRƯỚC (?nov71d) / SAU, đo chữ, thử kho báu > 5 lần, FPS. Server: node tools/build/serve.js . 8792
// node tools/qa/v71d-run.js [before|after] [q-thêm]
const L = require('./v69q-lib.js'); const fs = require('fs');
const mode = process.argv[2] || 'after', extra = process.argv[3] || ''; const D = __dirname + '/v71d/img/'; fs.mkdirSync(D, {recursive:true});
const Q = (mode === 'before' ? '?nov71d' : '?') + extra;
const out = {mode, q:Q};
const rect = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if(!e) return null; const r = e.getBoundingClientRect(); return r.width ? [r.left, r.top, r.width, r.height].map(Math.round) : null; }, sel);
const closeAll = p => L.dbg(p, "(function(){ try{ v70eClose() }catch(e){} try{ if(openModal) hideModal() }catch(e){} try{ v67lClose() }catch(e){} try{ const d=document.getElementById('v66tPanel'); if(d&&!d.hidden) d.querySelector('.v66tX').click() }catch(e){} try{ const w=document.getElementById('v52wsPan'); if(w) w.hidden=true }catch(e){} try{ if(V32.menuOpen) v32MenuToggle(false) }catch(e){} try{ if(V52WS.open) v52wsClose() }catch(e){} })()");
// chỉ để ảnh rõ: ẩn hộp thoại cốt truyện / lễ hội tự bật (không liên quan v71d)
const quiet = p => p.addStyleTag({content:'#v70sDlg,#v70sCard,#v70ePanel,#v70eAch,#v70sPill{display:none!important}'});
// chữ < 16px đang hiện (trong vùng chọn)
const small = (p, root) => p.evaluate(root => { const out = []; const W = innerWidth, H = innerHeight; const R = root ? document.querySelectorAll(root) : [document.body];
  R.forEach(rt => rt.querySelectorAll('*').forEach(e => { if(e.closest('svg') || e.tagName === 'CANVAS') return; const cs = getComputedStyle(e); if(cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return; const r = e.getBoundingClientRect(); if(r.width < 1 || r.height < 1 || r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) return;
    const own = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim(); if(!own) return; const f = parseFloat(cs.fontSize); if(f < 15.95) out.push(f + 'px ' + (e.id || String(e.className).slice(0, 24) || e.tagName) + ': ' + own.slice(0, 24)); })); return out; }, root);
async function fps(p, ms = 4000){ return p.evaluate(ms => new Promise(res => { let n = 0, min = 999, last = performance.now(); const t0 = last; const f = t => { n++; const d = t - last; last = t; if(d > 0) min = Math.min(min, 1000/d); if(t - t0 < ms) requestAnimationFrame(f); else res({avg:Math.round(n*1000/(t - t0)), min:Math.round(min)}); }; requestAnimationFrame(f); }), ms); }
(async () => {
  const b = await require('playwright').chromium.launch();
  for(const vp of ['desk', 'phone', 'land']){
    const o = out[vp] = {}; const {p, logs} = await L.open(vp, {browser:b, q:Q}); await L.login(p); await quiet(p); await p.waitForTimeout(1200); await closeAll(p); await p.waitForTimeout(400);
    // 4/6 · HUD
    await p.screenshot({path:D + `${mode}_${vp}_hud.png`});
    o.rect = {quick:await rect(p, '#quick'), mini:await rect(p, '#mini'), mtrack:await rect(p, '#mtrack'), prof:await rect(p, '#prof'), col:await rect(p, '#v41Col'), mentor:await rect(p, '#mentor'), lamp:await rect(p, '#v44Lamp'), menuBtn:await rect(p, '#v32MenuBtn'), mis:await rect(p, '#v32MisBtn'), log:await rect(p, '#v32LogBtn'), sound:await rect(p, '#hSound'), toi:await rect(p, '#tToi'), mlog:await rect(p, '#mlog')};
    o.labels = await p.evaluate(() => [...document.querySelectorAll('#v41Col .v41b small')].filter(s => s.offsetParent).map(s => s.textContent + ' ' + getComputedStyle(s).fontSize));
    o.quickAll = await p.evaluate(() => { const q = document.getElementById('quick'); if(!q || !q.offsetParent) return null; const qr = q.getBoundingClientRect(), m = document.getElementById('mini').getBoundingClientRect(); let hid = 0, rows = new Set(); q.querySelectorAll('button, select, .ambname').forEach(e => { if(!e.offsetParent) return; const r = e.getBoundingClientRect(); rows.add(Math.round(r.top/12)); if(r.right > Math.min(qr.right, m.left) + 1 || r.right > innerWidth) hid++; }); return {rows:rows.size, cut:hid, scrollW:q.scrollWidth, clientW:q.clientWidth, overMini:qr.right > m.left}; });
    o.smallHud = await small(p);
    // 5 · thông báo
    await L.dbg(p, "toast('🎉 Thử thông báo dài: Bạn đã đến Vườn bách thảo, nhớ tưới cây và chào thầy cô nhé!')"); await p.waitForTimeout(700);
    await p.screenshot({path:D + `${mode}_${vp}_toast.png`}); o.rect.toast = await rect(p, '#toast');
    await p.waitForTimeout(3500);
    // 3 · menu ☰
    await L.dbg(p, 'v32MenuToggle(true)'); await p.waitForTimeout(700); await p.screenshot({path:D + `${mode}_${vp}_menu.png`});
    o.menu = await p.evaluate(() => { const m = document.getElementById('v32Menu'); const t = [...m.querySelectorAll('.v39tile')]; return {tiles:t.length, en:t.filter(x => x.querySelector('small')).length, minFs:Math.min(...t.map(x => parseFloat(getComputedStyle(x.querySelector('b')).fontSize))), over:t.filter(x => x.scrollWidth > x.clientWidth + 1 || x.querySelector('b').scrollWidth > x.querySelector('b').clientWidth + 1).length, sample:t.slice(0, 6).map(x => x.textContent.trim()), chips:[...m.querySelectorAll('.v39chip')].map(c => c.textContent.trim() + ' ' + getComputedStyle(c).fontSize), pageOver:document.documentElement.scrollWidth > innerWidth}; });
    o.menuSmall = await small(p, '#v32Menu');
    o.menuTile = await rect(p, '#v32Grid .v39tile');
    await L.dbg(p, "v32Sub('games')"); await p.waitForTimeout(500); await p.screenshot({path:D + `${mode}_${vp}_menu2.png`}); o.menu2Small = await small(p, '#v32Menu');
    o.menu2 = await p.evaluate(() => [...document.querySelectorAll('#v39Tabs .v39tab')].map(x => x.textContent.trim()));
    await closeAll(p); await p.waitForTimeout(300);
    // 2 · Lương + Cây thần kỳ
    await L.dbg(p, 'v67lOpen()'); await p.waitForTimeout(500); await p.screenshot({path:D + `${mode}_${vp}_luong.png`}); o.rect.luongNote = await rect(p, '.v71dDay'); o.luongSmall = await small(p, '#v67lPanel');
    await closeAll(p); await L.dbg(p, 'v66tOpen()'); await p.waitForTimeout(600); await p.screenshot({path:D + `${mode}_${vp}_cay.png`}); o.rect.cayNote = await rect(p, '#v66tPanel .v71dDay'); o.caySmall = await small(p, '#v66tPanel');
    await closeAll(p);
    // 1 · cần câu kho báu: mua, xem thẻ, câu 8 lần đồ quý (ép tỉ lệ 100%)
    await L.dbg(p, "PROF.money = 2000; v52wMallOpen(); v52wmGoFloor(2, [809, 940]); v68mBuy('v68r6'); v68mPanel('v68rod')"); await p.waitForTimeout(900);
    await L.dbg(p, "(function(){ const c=[...document.querySelectorAll('#v52wsPan .v68card')].pop(); if(c) c.scrollIntoView({block:'center'}) })()"); await p.waitForTimeout(300);
    await p.screenshot({path:D + `${mode}_${vp}_rod.png`}); o.rect.rodTag = await rect(p, '.v71dTreas'); o.rect.rodCard = await p.evaluate(() => { const c = [...document.querySelectorAll('#v52wsPan .v68card')].pop(); if(!c) return null; const r = c.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); });
    await closeAll(p);
    if(vp === 'desk' || vp === 'phone'){
      o.treas = await L.dbg(p, `(function(){ const R0 = Math.random; const res = []; let toasts = [];
        const t0 = toast; toast = function(s){ toasts.push(s); return t0.apply(this, arguments); };
        try { const s = {}; for(let i = 0; i < 8; i++){ toasts = []; const x = v68mTreasGot(); const o = v68mDb(); res.push({i:i + 1, got:x ? x.n : null, tn:o.tn, items:Object.values(o.treas).reduce((a, b) => a + b, 0), toast:toasts.join(' | ').slice(0, 140)}); } }
        finally { toast = t0; } return res; })()`);
      // đường thật: mini game câu cá ở bến tàu (fishCatch) với tỉ lệ ép 100% → không ra đồ quý nữa, chỉ ra cá
      o.treasReal = await L.dbg(p, `(function(){ try { const o = v68mDb(), before = JSON.stringify(o.treas); const R0 = Math.random; let got = 0; const g = v68mTreasGot; v68mTreasGot = function(){ const x = g.apply(this, arguments); if(x) got++; return x; };
        try { Math.random = () => 0.01; FS.state = 'fight'; FS.prog = 100; fishCatch(); } finally { Math.random = R0; v68mTreasGot = g; } return {got, same: JSON.stringify(v68mDb().treas) === before, last: FS.last}; } catch(e){ return 'err ' + e.message; } })()`);
      await L.dbg(p, "try{ if(openModal) hideModal() }catch(e){} try { openFishing('sea') } catch(e){}"); await p.waitForTimeout(900);
      await p.screenshot({path:D + `${mode}_${vp}_fish.png`}); o.rect.chip = await rect(p, '#v71dChip'); o.chip = await p.evaluate(() => { const c = document.getElementById('v71dChip'); return c && !c.hidden ? c.textContent : null; });
      await closeAll(p);
    }
    // 6 · bảng cũ trên máy tính: Cài đặt, Cửa hàng, Hồ sơ, Nhiệm vụ
    if(vp === 'desk'){ o.panels = {};
      for(const [k, c] of [['set', 'openSettings()'], ['shop', 'openShop()'], ['prof', 'openProfile()'], ['mis', "renderMissions(); showModal('mMissions')"]]){
        await L.dbg(p, c); await p.waitForTimeout(700); await p.screenshot({path:D + `${mode}_desk_p_${k}.png`}); o.panels[k] = await small(p, '.modal:not([hidden])'); await closeAll(p); await p.waitForTimeout(300); } }
    // FPS: đứng yên + đi bộ
    await closeAll(p); o.fps = await fps(p); await p.keyboard.down('ArrowRight'); o.fpsWalk = await fps(p); await p.keyboard.up('ArrowRight');
    o.logs = logs.filter(l => !/v61l: danh sách FILES/.test(l.s));
    await p.context().close(); console.log(vp, 'ok');
  }
  fs.writeFileSync(__dirname + `/v71d/${mode}${extra ? '_' + extra.replace(/\W/g, '') : ''}.json`, JSON.stringify(out, null, 1)); await b.close();
})();
