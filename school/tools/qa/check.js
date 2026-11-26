// v74q · BỘ KIỂM TRA TỰ ĐỘNG MỘT LỆNH cho game 2D "Trường Rubik của Hà Quân" (xem README.md cùng thư mục).
// Chạy (từ school/):  node tools/qa/check.js            → bản từng file
//                     node tools/qa/check.js --bundle   → bản gói dist/ (?bundle)
// Tuỳ chọn: --vp=phone,land,desk  --quick (ít khu/mini game hơn)  --update (ghi lại ảnh chuẩn)  --port=8792  --only=load,zones,games,save,fps
// Kết quả: tools/qa/report.html (tiếng Việt) + tools/qa/v74q/last[-bundle].json + ảnh nhỏ tools/qa/v74q/out/
// KHÔNG sửa code game: đo init bằng cách chèn bộ đếm vào bản sao js/main.js / bundle khi trình duyệt tải (page.route).
const fs = require('fs'), path = require('path'), {spawn} = require('child_process');
const {chromium} = require('playwright');
const ROOT = path.resolve(__dirname, '../..'), QA = __dirname, D = path.join(QA, 'v74q'), OUT = path.join(D, 'out'), BASE = path.join(D, 'base');
const arg = (k, d) => { const a = process.argv.find(x => x === '--' + k || x.startsWith('--' + k + '=')); return a ? (a.includes('=') ? a.split('=')[1] : true) : d; };
const BUNDLE = !!arg('bundle'), QUICK = !!arg('quick'), UPDATE = !!arg('update'), PORT = +arg('port', 8792);
const VPN = String(arg('vp', 'phone,land,desk')).split(','), ONLY = arg('only') ? String(arg('only')).split(',') : null;
const MODE = BUNDLE ? 'bundle' : 'files', on = k => !ONLY || ONLY.includes(k);
const VPS = {phone:{w:390, h:844, touch:true, vi:'Điện thoại dọc 390×844'}, land:{w:844, h:390, touch:true, vi:'Điện thoại ngang 844×390'}, desk:{w:1440, h:900, vi:'Máy tính 1440×900'}};
const URL0 = `http://localhost:${PORT}/index.html` + (BUNDLE ? '?bundle' : '');
const DIFF_MAX = 0.18; // tỉ lệ ô ảnh khác ảnh chuẩn cho phép (NPC, mây, nước luôn động)
[OUT, BASE].forEach(d => fs.mkdirSync(d, {recursive:true}));
const R = {mode:MODE, at:new Date().toISOString(), url:URL0, issues:[], static:{}, vp:{}};
const sev = {high:'Nặng', mid:'Vừa', low:'Nhẹ', info:'Ghi chú'};
const issue = (s, cat, vp, title, more = {}) => { R.issues.push(Object.assign({sev:s, cat, vp, title}, more)); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').replace(/[^\w]+/g, '_').slice(0, 40);

// ---------------- 0. kiểm tĩnh: danh sách FILES, trùng tên toàn cục, lớp bọc, module không dùng ----------------
function staticCheck(){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const FILES = [...html.match(/const FILES = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
  const S = R.static = {files:FILES.length, missing:[], hard:[], fnDup:[], wraps:[], unused:[], lines:0};
  const decl = /^(const|let|var|class|function\*?|async function)\s+([A-Za-z_$][\w$]*)/gm, seen = new Map(), src = {};
  for(const f of FILES){ const p = path.join(ROOT, f); if(!fs.existsSync(p)){ S.missing.push(f); continue; }
    const t = src[f] = fs.readFileSync(p, 'utf8'); S.lines += t.split('\n').length;
    for(const m of t.matchAll(decl)){ const k = m[1].split(' ').pop().replace('*', ''), n = m[2]; if(!seen.has(n)) seen.set(n, []); seen.get(n).push({k, f, line:t.slice(0, m.index).split('\n').length}); } }
  for(const [n, L] of seen){ if(L.length < 2) continue; const ks = new Set(L.map(x => x.k));
    if(ks.has('const') || ks.has('let') || ks.has('class')) S.hard.push({n, at:L.map(x => `${x.k} ${x.f}:${x.line}`)});
    else if(L.every(x => x.k === 'function')) S.fnDup.push({n, at:L.map(x => `${x.f}:${x.line}`)}); }
  // lớp bọc: "tên = function" hoặc "tên = (…) =>" gán lại hàm toàn cục
  const fnNames = new Set([...seen].filter(([, L]) => L.some(x => x.k === 'function')).map(([n]) => n)), wr = new Map();
  for(const f of FILES){ const t = src[f]; if(!t) continue;
    for(const m of t.matchAll(/(?:^|[;{}\s(])([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?(?:function\b|\([^()]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/g)){ const n = m[1]; if(!fnNames.has(n)) continue;
      if(!wr.has(n)) wr.set(n, new Set()); wr.get(n).add(f.replace('js/ext/', '')); } }
  S.wraps = [...wr].map(([n, s]) => ({n, k:s.size, by:[...s]})).sort((a, b) => b.k - a.k).slice(0, 40);
  // module trong js/ không nằm trong FILES (đã gỡ / bị thay thế)
  const all = []; const walk = d => fs.readdirSync(path.join(ROOT, d)).forEach(x => { const r = d + '/' + x; if(fs.statSync(path.join(ROOT, r)).isDirectory()){ if(x !== 'vendor') walk(r); } else if(x.endsWith('.js')) all.push(r); });
  walk('js'); const inF = new Set(FILES);
  S.unused = all.filter(f => !inF.has(f)).map(f => { const t = fs.readFileSync(path.join(ROOT, f), 'utf8'); return {f, kb:Math.round(t.length/1024), head:(t.split('\n').find(l => l.trim()) || '').replace(/^\/\/\s*=*\s*/, '').slice(0, 140)}; });
  S.missing.forEach(f => issue('high', 'tải', '*', 'File trong FILES không tồn tại: ' + f));
  S.hard.forEach(d => issue('high', 'trùng tên', '*', `const/let/class trùng tên toàn cục: ${d.n}`, {desc:d.at.join(' · ')}));
  return FILES;
}

// ---------------- 1. trình duyệt: chèn bộ đếm init + đếm setInterval / listener ----------------
const INIT_SCRIPT = `(() => {
  const W = window; W.__v74qInit = []; W.__v74qT0 = performance.now();
  W.__v74qI = (n, f) => { const t = performance.now(); try { const r = f(); W.__v74qInit.push({n, ok:1, ms:+(performance.now() - t).toFixed(1)}); return r; }
    catch(e){ W.__v74qInit.push({n, ok:0, ms:+(performance.now() - t).toFixed(1), err:String(e && e.message || e).slice(0, 300), st:String(e && e.stack || '').split('\\n').slice(0, 3).join(' | ').slice(0, 400)}); throw e; } };
  const live = new Set(), si = W.setInterval, ci = W.clearInterval; W.__v74qIv = live;
  W.setInterval = function(){ const id = si.apply(this, arguments); live.add(id); return id; };
  W.clearInterval = function(id){ live.delete(id); return ci.apply(this, arguments); };
  const L = {n:0}, ae = EventTarget.prototype.addEventListener, re = EventTarget.prototype.removeEventListener, mp = new WeakMap(); W.__v74qL = L;
  const g = t => t === W || t === document || t === document.body;
  EventTarget.prototype.addEventListener = function(type, fn, o){ if(g(this) && fn){ let s = mp.get(this); if(!s) mp.set(this, s = new Set()); const k = type + '|' + !!(o === true || (o && o.capture)); const key = fn; if(!s.has(key + k)){} L.n++; } return ae.apply(this, arguments); };
  EventTarget.prototype.removeEventListener = function(type, fn){ if(g(this) && fn) L.n = Math.max(0, L.n - 1); return re.apply(this, arguments); };
})();`;
function patchInit(code){
  const i = code.indexOf('function extFinalInit(){'); if(i < 0) return code;
  let j = i + 'function extFinalInit(){'.length, d = 1; while(j < code.length && d){ const c = code[j]; if(c === '{') d++; else if(c === '}') d--; j++; }
  const body = code.slice(i, j).replace(/\b([A-Za-z_$][\w$]*Init)\(\)/g, (m, n) => n === 'extFinalInit' ? m : `__v74qI(${JSON.stringify(n)},()=>${n}())`);
  return code.slice(0, i) + body + code.slice(j);
}
async function openPage(b, vpn, ctx){
  const vp = VPS[vpn];
  ctx = ctx || await b.newContext({viewport:{width:vp.w, height:vp.h}, hasTouch:!!vp.touch, isMobile:!!vp.touch, deviceScaleFactor:1});
  if(!ctx.__v74q){ ctx.__v74q = 1; await ctx.addInitScript(INIT_SCRIPT);
    await ctx.route(/\/(js\/main\.js|dist\/game\.[0-9a-f]+\.js)(\?.*)?$/, async rt => { const res = await rt.fetch(); const t = await res.text(); const h = Object.assign({}, res.headers()); delete h['content-encoding']; delete h['content-length']; await rt.fulfill({status:res.status(), body:patchInit(t), headers:h}); }); }
  const p = await ctx.newPage(); const logs = [];
  p.on('console', m => { const t = m.type(); if(t !== 'warning' && t !== 'error') return; const s = m.text(); if(/AudioContext was not allowed|GL Driver|GPU stall|favicon|Failed to load resource.*404/.test(s)) return; logs.push({t, s:s.slice(0, 500), at:p.__step || 'tải'}); });
  p.on('pageerror', e => logs.push({t:'pageerror', s:String(e.message).slice(0, 400), st:String(e.stack || '').split('\n').slice(0, 4).join(' | ').slice(0, 600), at:p.__step || 'tải'}));
  const t0 = Date.now(); await p.goto(URL0);
  await p.waitForFunction(() => typeof window.__dbg === 'function', null, {timeout:90000});
  await p.waitForFunction(() => !document.getElementById('rsBoot'), null, {timeout:60000}).catch(() => {});
  const ms = Date.now() - t0; await p.waitForTimeout(2000);
  return {ctx, p, logs, ms};
}
const dbg = (p, c) => p.evaluate(c => window.__dbg(c), c);
async function login(p, name, pass = 'qa12345', isNew = true){
  if(await p.isVisible('#lgName').catch(() => false)){
    await p.fill('#lgName', name); await p.fill('#lgPass', pass); await p.click(isNew ? '#lgNew' : '#lgGo'); await p.waitForTimeout(1500);
    if(await p.isVisible('#crDone').catch(() => false)){ await p.click('#crDone'); await p.waitForTimeout(1500); }
  }
  const go = p.getByText('Vào game', {exact:true}); if(await go.isVisible().catch(() => false)){ await go.click(); await p.waitForTimeout(1200); }
  await dbg(p, "try{ for(let i=0;i<4;i++) if(openModal) hideModal() }catch(e){} 1");
  return dbg(p, 'typeof PROF !== "undefined" && !!PROF && !!PLAYER');
}
const QUIET = '#v70sDlg,#v70sCard,#v70sPill,#v70eAch,#v59gTip,.v59gTip{display:none!important}';

// trợ giúp chạy TRONG scope game (qua __dbg). Dùng lại Robo v54q (v54qTele, v54qSig, v54qGames…) + bảng mới v66–v73.
const HELP = `window.__H = (() => {
  const vis = e => !!e && !e.hidden && e.getClientRects().length > 0 && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden';
  const EX = ['v67lPanel', 'v66tPanel', 'v70ePanel', 'v70sBook', 'v52wsPan', 'v51pPanel', 'v51pHangar'];
  const H = {
    sig(){ let s = ''; try { s = v54qSig(); } catch(e){ s = 'ERR:' + e.message; } s = s.split(',').filter(x => x && !/^p:(v70eGo|v53cEnter|v67lGoStage|v66tGo|toast)/.test(x)).join(','); return s + EX.map(id => vis(document.getElementById(id)) ? '|x:' + id : '').join(''); },
    stable(){ try { clock = 600; weather = 'nang'; autoWeather = false; if(typeof weatherUntil !== 'undefined') weatherUntil = 1e9; } catch(e){}
      try { if(window.__day0 == null) window.__day0 = day; day = window.__day0; setSeason('thu', true); } catch(e){} return 1; },
    pos(){ try { const q = v46Pos(PLAYER); return [Math.round(q[0]), Math.round(q[1])]; } catch(e){ return null; } },
    places(){ const L = v54qPlaces(); window.__P = L; return L.map(p => ({k:p.k, name:p.name, ic:p.ic || '', x:Math.round(p.x), y:Math.round(p.y), door:!!(p.door && isFinite(p.door[0])), bad:!p.name || /undefined|NaN|null/.test(String(p.name))})); },
    go(i){ const p = window.__P[i]; try { if(p.door && isFinite(p.door[0])) v54qTele(p.door[0], p.door[1] + 36); else v54qTeleNew(p.x, p.y); } catch(e){ return 'ERR ' + e.message; } return H.pos(); },
    async walk(){ const P = PLAYER, out = {}; const d0 = H.pos(); if(!d0) return null;
      for(const k of ['right', 'down', 'left', 'up']){ const a = H.pos(); keys[k] = true; await new Promise(r => setTimeout(r, 380)); keys[k] = false; await new Promise(r => setTimeout(r, 60)); const b = H.pos(); out[k] = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1])); }
      return out; },
    games(){ const L = v54qGames(); const g = (n, f, at) => L.push({n, f, at});
      g('💰 Bảng Lương', () => v67lOpen()); g('🌳 Cây thần kỳ', () => v66tOpen()); g('🏆 Thành tựu & Lễ hội', () => v70eOpen());
      g('📖 Sổ Hành trình', () => v70sBook()); g('🧭 Robo QA v54q (chủ game)', () => v54qOpen && null);
      g('✈️ Hangar (v73a)', () => v51pPanel('hangar')); g('🔥 Đường bay tốc độ Tia Lửa', () => v73aSpeedStart());
      g('🏬 TTTM tầng 2 · cần câu', () => { v52wMallOpen(); v52wmGoFloor(2, [809, 940]); });
      L.forEach(x => { if(/Nấu ăn/.test(x.n)){ const f = x.f; x.f = () => { try { const r = Object.values(V52L_REC).find(q => x.n.includes(q.vi || q.n)) || Object.values(V52L_REC)[0]; (r.ing || []).forEach(k => v52lAdd(k, 1)); } catch(e){} return f(); }; } });
      window.__G = L.filter(x => !/Robo QA/.test(x.n)); return window.__G.map(x => x.n); },
    async open(i){ const G = window.__G[i]; try { v54qTele(...v46ToOld(...v46Gate())); } catch(e){} await new Promise(r => setTimeout(r, 150));
      const base = H.sig(); let err = null; try { if(G.at) await G.at(); } catch(e){ err = 'at: ' + e.message; }
      const b1 = H.sig(); try { const r = G.f(); if(r && r.then) await r; } catch(e){ err = (e && e.message) || String(e); window.__lastErrSt = e && e.stack; }
      await new Promise(r => setTimeout(r, 1000)); return {base, b1, now:H.sig(), err, st:err ? String(window.__lastErrSt || '').split('\\n').slice(0, 3).join(' | ') : ''}; },
    async close(base){ const cl = [() => v67lClose(), () => v70eClose(), () => { const b = document.getElementById('v70sBook'); if(b) b.hidden = true; }, () => { const d = document.getElementById('v66tPanel'); if(d && !d.hidden){ const x = d.querySelector('.v66tX'); if(x) x.click(); else d.hidden = true; } },
        () => { if(typeof V51P !== 'undefined' && V51P.mg) V51P.mg = null; }, () => v51pPanel(null), () => { if(V51P.on) v51pExit(true); }];
      for(let i = 0; i < 6; i++){ if(H.sig() === base) return {ok:1, how:['sẵn', 'Esc', 'nút ✕', 'nút ✕', 'ép đóng', 'ép đóng'][i]};
        if(i === 0) v54qKey('Escape'); else if(i < 3){ const b = v54qCloseBtn(); if(b) try { b.click(); } catch(e){} } else { try { v54qForceClose(); } catch(e){} cl.forEach(f => { try { f(); } catch(e){} }); }
        await new Promise(r => setTimeout(r, 350)); }
      return {ok:H.sig() === base ? 1 : 0, left:H.sig()}; },
    leak(){ return {iv:window.__v74qIv.size, ls:window.__v74qL.n}; },
    snap(){ const o = JSON.parse(JSON.stringify(PROF)); return o; },
    seed(){ PROF.money = 4321; PROF.exp = 77; PROF.inv = PROF.inv || {}; PROF.inv.v74qTestHat = 123456; PROF.inv.bike2 = 1;
      try { const s = v67lState(); s.tot = 987; s.paid = 654; s.hist.push({d:'v74q', v:12}); s.today[Object.keys(s.today)[0]] = 3; } catch(e){}
      try { const s = v70sSt(); s.v74q = 1; if(Array.isArray(s.done) && !s.done.length && typeof V70S_CH !== 'undefined') s.done.push(V70S_CH[0].id); } catch(e){}
      try { const s = v66tState(); s.v74q = 2; } catch(e){} try { const o = v68mDb(); o.treas.v74q = 1; } catch(e){}
      saveProfile(); return H.snap(); },
  };
  return H; })(); 1`;

// so ảnh: thu nhỏ còn 160px, so từng ô; trả ảnh nhỏ (jpeg) để làm ảnh chuẩn / ảnh báo cáo
async function shrink(cp, png, ref){
  return cp.evaluate(async ([a, b]) => { const ld = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = s; });
    const A = await ld(a), W = 200, H = Math.round(A.height*W/A.width), c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d', {willReadFrequently:true});
    g.drawImage(A, 0, 0, W, H); const small = c.toDataURL('image/jpeg', .72); if(!b) return {small, diff:null};
    const da = g.getImageData(0, 0, W, H).data; const B = await ld(b); if(!B) return {small, diff:null}; g.drawImage(B, 0, 0, W, H); const db = g.getImageData(0, 0, W, H).data;
    let bad = 0, n = 0; const C = 5; for(let y = 0; y + C <= H; y += C) for(let x = 0; x + C <= W; x += C){ let s = 0; for(let yy = 0; yy < C; yy++) for(let xx = 0; xx < C; xx++){ const k = ((y + yy)*W + x + xx)*4; s += Math.abs(da[k] - db[k]) + Math.abs(da[k + 1] - db[k + 1]) + Math.abs(da[k + 2] - db[k + 2]); } n++; if(s/(C*C*3) > 28) bad++; }
    return {small, diff:+(bad/n).toFixed(3)}; }, ['data:image/png;base64,' + png.toString('base64'), ref]);
}
const b64file = (f, d) => fs.writeFileSync(f, Buffer.from(d.split(',')[1], 'base64'));

// quét giao diện DOM đang hiện: chữ undefined/NaN, chữ <16px (điện thoại), nút nhỏ, nút bị che/chồng, tràn ngang
async function scan(p, touch, root){
  return p.evaluate(([touch, root]) => { const out = {bad:[], small:[], tiny:[], cover:[], over:false}; const W = innerWidth, H = innerHeight;
    const vis = e => { const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > .05; };
    const R0 = root ? [...document.querySelectorAll(root)] : [document.body];
    R0.forEach(rt => rt.querySelectorAll('*').forEach(e => { if(e.closest('svg') || e.tagName === 'CANVAS' || e.tagName === 'SCRIPT' || e.tagName === 'STYLE') return; if(!vis(e)) return;
      const r = e.getBoundingClientRect(); if(r.width < 1 || r.height < 1 || r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) return;
      let hid = false; for(let x = e; x && x !== document.body; x = x.parentElement){ if(x.hidden || !vis(x)){ hid = true; break; } } if(hid) return;
      const own = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim(); const nm = e.id ? '#' + e.id : (String(e.className || e.tagName).split(' ')[0]);
      if(own){ if(/\bundefined\b|\bNaN\b|\[object |\bnull\b/.test(own)) out.bad.push(nm + ': ' + own.slice(0, 70));
        const fs = parseFloat(getComputedStyle(e).fontSize); if(touch && fs < 15.95) out.small.push(fs + 'px ' + nm + ': ' + own.slice(0, 26)); }
      const hit = ['::after', '::before'].some(ps => { const q = getComputedStyle(e, ps); return q.position === 'absolute' && q.content !== 'none'; }); // vùng chạm nới bằng ::after/::before
      if(touch && !hit && (e.tagName === 'BUTTON' || e.getAttribute('role') === 'button') && (r.width < 36 || r.height < 36)) out.tiny.push(Math.round(r.width) + '×' + Math.round(r.height) + ' ' + nm + ' ' + (e.textContent || '').trim().slice(0, 16));
    }));
    // nút bị che: điểm giữa nút không bấm trúng chính nó (hoặc con của nó)
    const btn = [...document.querySelectorAll('button, [role=button]')].filter(b => { if(!vis(b)) return false; const r = b.getBoundingClientRect(); return r.width > 4 && r.height > 4 && r.left >= 0 && r.top >= 0 && r.right <= W && r.bottom <= H; });
    for(const b of btn){ let hid = false; for(let x = b; x && x !== document.body; x = x.parentElement) if(x.hidden || !vis(x)){ hid = true; break; } if(hid) continue;
      const r = b.getBoundingClientRect(), cx = r.left + r.width/2, cy = r.top + r.height/2; let clip = false;
      for(let x = b.parentElement; x && x !== document.body; x = x.parentElement){ const o = getComputedStyle(x); if(o.overflow === 'visible' && o.overflowY === 'visible') continue; const q = x.getBoundingClientRect(); if(cx < q.left || cx > q.right || cy < q.top || cy > q.bottom){ clip = true; break; } }
      if(clip) continue; const t = document.elementFromPoint(cx, cy);
      let big = false; for(let x = t; x && x !== document.body; x = x.parentElement){ const q = x.getBoundingClientRect(); if(q.width*q.height > W*H*.4 && !x.contains(b)){ big = true; break; } }
      if(t && !big && t !== b && !b.contains(t) && !t.contains(b) && getComputedStyle(t).pointerEvents !== 'none'){ const tn = t.id ? '#' + t.id : String(t.className || t.tagName).split(' ')[0];
        if(!/^(world|cv|stage)$/.test(t.id)) out.cover.push((b.id ? '#' + b.id : (b.textContent || '').trim().slice(0, 18) || String(b.className).split(' ')[0]) + ' ⟵ bị ' + tn + ' che'); } }
    out.over = document.documentElement.scrollWidth > W + 2;
    for(const k in out) if(Array.isArray(out[k])) out[k] = [...new Set(out[k])].slice(0, 30); return out; }, [touch, root || null]);
}
async function fps(p, ms, move){
  return p.evaluate(([ms, move]) => new Promise(done => { const T = []; let last = performance.now(); const t0 = last; const dirs = ['right', 'down', 'left', 'up'];
    const step = now => { T.push(now - last); last = now; if(move) window.__dbg(`keys.up=keys.down=keys.left=keys.right=false; keys['${dirs[Math.floor((now - t0)/1100) % 4]}']=true; 1`);
      if(now - t0 < ms) requestAnimationFrame(step); else { window.__dbg('keys.up=keys.down=keys.left=keys.right=false; 1'); const f = T.slice(5), s = f.slice().sort((a, b) => a - b), avg = f.reduce((a, b) => a + b, 0)/f.length;
        done({fps:+(1000/avg).toFixed(1), p95:+s[Math.floor(s.length*.95)].toFixed(1), max:+s[s.length - 1].toFixed(1), long:f.filter(x => x > 50).length}); } };
    requestAnimationFrame(step); }), [ms, move]);
}

// ---------------- 2. chạy một cỡ màn hình ----------------
async function runVp(b, cp, vpn){
  const vp = VPS[vpn], V = R.vp[vpn] = {vi:vp.vi, steps:{}}, touch = !!vp.touch; const t0 = Date.now();
  const {ctx, p, logs, ms} = await openPage(b, vpn); V.loadMs = ms;
  V.init = await p.evaluate(() => window.__v74qInit || []);
  const hasHelper = V.init.length > 0; V.initPatched = hasHelper;
  V.init.filter(x => !x.ok).forEach(x => issue('high', 'init', vpn, `Init ${x.n}() ném lỗi khi khởi động`, {desc:x.err, st:x.st}));
  V.init.filter(x => x.ok && x.ms > 120).forEach(x => issue('info', 'init', vpn, `Init ${x.n}() chạy chậm: ${x.ms} ms`));
  const bootErr = logs.filter(l => l.t !== 'warning').length; V.bootLogs = logs.slice();
  const user = 'qa' + vpn + Math.random().toString(36).slice(2, 6); V.user = user;
  p.__step = 'đăng nhập'; const ok = await login(p, user); V.login = ok; if(!ok) issue('high', 'đăng nhập', vpn, 'Không vào được game bằng tài khoản mới');
  await p.addStyleTag({content:QUIET}); await dbg(p, HELP); await dbg(p, "__H.stable(); try { v49rDaySeason = () => 'thu'; } catch(e){} 1"); await p.waitForTimeout(800);
  // HUD
  p.__step = 'màn hình chính'; V.hud = await scan(p, touch); await p.screenshot({path:path.join(OUT, `${MODE}_${vpn}_hud.jpg`), type:'jpeg', quality:60});
  // ---- khu ----
  if(on('zones')){ p.__step = 'khu';
    let P = await dbg(p, '__H.places()'); V.placesAll = P.length; if(QUICK) P = P.filter((_, i) => i % 4 === 0);
    P.filter(x => x.bad).forEach(x => issue('mid', 'chữ', vpn, `Tên khu hỏng trên bản đồ: “${x.name}” (${x.k})`));
    V.zones = []; const sig0 = await dbg(p, '__H.sig()'); V.sig0 = sig0;
    for(let i = 0; i < P.length; i++){ const z = P[i], idx = V.placesAll === P.length ? i : i*4; p.__step = 'khu ' + z.name; const n0 = logs.length;
      await dbg(p, `__H.go(${idx}); __H.stable(); 1`); await p.waitForTimeout(900);
      const png = await p.screenshot({type:'png'}); const bf = path.join(BASE, `${vpn}_${slug(z.k)}.jpg`); const ref = fs.existsSync(bf) && !UPDATE ? 'data:image/jpeg;base64,' + fs.readFileSync(bf).toString('base64') : null;
      const sh = await shrink(cp, png, ref); const of = `${MODE}_${vpn}_z_${slug(z.k)}.jpg`; b64file(path.join(OUT, of), sh.small); if(!ref) b64file(bf, sh.small);
      const mv = await p.evaluate(() => window.__H.walk()); const stuck = mv && Object.values(mv).every(v => v < 3);
      const sigNow = await dbg(p, '__H.sig()'); if(sigNow !== sig0) await p.evaluate(s => window.__H.close(s), sig0);
      const errs = logs.slice(n0).filter(l => l.t !== 'warning');
      V.zones.push({k:z.k, name:z.name, ic:z.ic, img:of, diff:sh.diff, mv, stuck, errs:errs.length});
      if(stuck) issue('mid', 'kẹt', vpn, `Nhân vật kẹt (không đi được hướng nào) ở “${z.name}”`, {img:of, desc:JSON.stringify(mv)});
      if(sh.diff != null && sh.diff > DIFF_MAX) issue('low', 'ảnh', vpn, `Ảnh “${z.name}” khác ảnh chuẩn ${Math.round(sh.diff*100)}%`, {img:of, ref:path.relative(QA, bf)});
      errs.forEach(e => issue('high', 'lỗi JS', vpn, `Lỗi khi tới “${z.name}”: ${e.s.slice(0, 120)}`, {st:e.st}));
    } }
  // ---- mini game & bảng ----
  if(on('games')){ p.__step = 'mini game';
    let G = await dbg(p, '__H.games()'); const all = G.map((n, i) => ({n, i})); const pick = QUICK ? all.filter((g, k) => k % 3 === 0 || /Lương|Cây|Thành tựu|Hành trình|TTTM|Hangar|Tia Lửa/.test(g.n)) : all;
    V.games = []; const lk0 = await dbg(p, '__H.leak()'); V.leak0 = lk0;
    for(const g of pick){ p.__step = g.n; const n0 = logs.length, l0 = await dbg(p, '__H.leak()');
      const o = await p.evaluate(i => window.__H.open(i), g.i); const opened = o.now !== o.base || o.now !== o.b1;
      let sc = null, img = null; if(opened){ sc = await scan(p, touch); const png = await p.screenshot({type:'png'}); const sh = await shrink(cp, png, null); img = `${MODE}_${vpn}_g_${slug(g.n)}.jpg`; b64file(path.join(OUT, img), sh.small); }
      const c = await p.evaluate(s => window.__H.close(s), o.base); await p.waitForTimeout(250); const l1 = await dbg(p, '__H.leak()');
      const errs = logs.slice(n0).filter(l => l.t !== 'warning');
      const r = {n:g.n, opened, err:o.err, closed:!!c.ok, how:c.how || '', left:c.left || '', img, scan:sc, iv:l1.iv - l0.iv, ls:l1.ls - l0.ls, errs:errs.map(e => e.s.slice(0, 160))}; V.games.push(r);
      if(o.err) issue('high', 'mini game', vpn, `Mở “${g.n}” ném lỗi: ${o.err.slice(0, 120)}`, {st:o.st, img});
      const ownerOnly = /Drone/.test(g.n); if(!opened && !o.err) issue(ownerOnly ? 'info' : 'low', 'mini game', vpn, `“${g.n}” ${ownerOnly ? 'không mở với người chơi thường (chỉ chủ game — đúng thiết kế)' : 'không thấy mở ra (không đổi màn hình)'}`);
      if(opened && !c.ok) issue('mid', 'mini game', vpn, `“${g.n}” không đóng lại được`, {desc:'Còn lại: ' + c.left, img});
      if(opened && c.ok && c.how === 'ép đóng') issue(/Đường bay|Tia Lửa/.test(g.n) ? 'info' : 'low', 'mini game', vpn, `“${g.n}” không đóng bằng Esc / nút ✕ (phải ép đóng)`, {img});
      errs.forEach(e => issue('high', 'lỗi JS', vpn, `Lỗi trong “${g.n}”: ${e.s.slice(0, 120)}`, {st:e.st, img}));
      if(sc){ sc.bad.forEach(t => issue('mid', 'chữ', vpn, `Chữ hỏng trong “${g.n}”: ${t}`, {img})); if(sc.cover.length) issue('low', 'nút che', vpn, `Nút bị che trong “${g.n}”: ${sc.cover.slice(0, 3).join(' · ')}`, {img, desc:sc.cover.join('\n')});
        if(sc.small.length) issue('low', 'chữ nhỏ', vpn, `Chữ < 16px trong “${g.n}” (${sc.small.length} chỗ)`, {img, desc:sc.small.join('\n')}); if(sc.over) issue('low', 'tràn', vpn, `“${g.n}” làm trang cuộn ngang`, {img}); }
    }
    // rò rỉ: mở/đóng lại vài bảng nhiều lần, interval/listener không được tăng mãi
    const rep = V.games.filter(g => g.opened && g.closed).slice(0, QUICK ? 6 : 40); V.leakRep = [];
    for(const g of rep){ const gi = G.indexOf(g.n), l0 = await dbg(p, '__H.leak()');
      for(let k = 0; k < 3; k++){ const o = await p.evaluate(i => window.__H.open(i), gi); await p.evaluate(s => window.__H.close(s), o.base); }
      const l1 = await dbg(p, '__H.leak()'); const d = {n:g.n, iv:l1.iv - l0.iv, ls:l1.ls - l0.ls}; V.leakRep.push(d);
      if(d.iv >= 3) issue('mid', 'rò rỉ', vpn, `“${g.n}”: mở/đóng 3 lần còn sót ${d.iv} setInterval`, {desc:'Mỗi lần mở tạo interval mới mà đóng không clearInterval.'});
      if(d.ls >= 3) issue('low', 'rò rỉ', vpn, `“${g.n}”: mở/đóng 3 lần thêm ${d.ls} listener trên window/document`); }
    V.leak1 = await dbg(p, '__H.leak()'); }
  // ---- HUD sau cùng: chữ, nút ----
  const hb = V.hud; hb.bad.forEach(t => issue('mid', 'chữ', vpn, `Chữ hỏng trên màn hình chính: ${t}`, {img:`${MODE}_${vpn}_hud.jpg`}));
  if(hb.small.length) issue('low', 'chữ nhỏ', vpn, `Chữ < 16px trên màn hình chính (${hb.small.length} chỗ)`, {desc:hb.small.join('\n'), img:`${MODE}_${vpn}_hud.jpg`});
  if(hb.cover.length) issue('mid', 'nút che', vpn, `Nút bị che trên màn hình chính: ${hb.cover.slice(0, 3).join(' · ')}`, {desc:hb.cover.join('\n'), img:`${MODE}_${vpn}_hud.jpg`});
  if(hb.tiny.length) issue('low', 'nút nhỏ', vpn, `Nút < 36px trên màn hình chính (${hb.tiny.length})`, {desc:hb.tiny.join('\n')});
  if(hb.over) issue('low', 'tràn', vpn, 'Màn hình chính cuộn ngang được');
  // ---- FPS ----
  if(on('fps')){ p.__step = 'FPS'; await dbg(p, 'v54qFree(); try{ v54qTeleNew(V46L.CX - 200, V46L.CY + 420) }catch(e){} __H.stable(); 1'); await p.waitForTimeout(1200);
    V.fps = {stand:await fps(p, 4000, false), walk:await fps(p, 5000, true)};
    // chơi lâu: đứng yên rồi đo lại — bắt lỗi tích tụ (vd. ngăn xếp clip canvas, v74q). Mặc định chỉ máy tính, --soak=giây để đổi.
    const soak = +arg('soak', vpn === 'desk' && !QUICK ? 150 : 0);
    if(soak > 0){ await p.waitForTimeout(soak*1000); await dbg(p, 'v54qFree(); try{ v54qTeleNew(V46L.CX - 200, V46L.CY + 420) }catch(e){} 1'); await p.waitForTimeout(800); V.fps.soak = Object.assign(await fps(p, 4000, false), {sec:soak});
      if(V.fps.soak.fps < V.fps.stand.fps*.7 && V.fps.soak.fps < 45) issue('high', 'FPS', vpn, `FPS tụt dần khi chơi lâu: ${V.fps.stand.fps} → ${V.fps.soak.fps} sau ${soak} giây đứng yên`, {desc:'Dấu hiệu tích tụ (canvas, listener, hàng đợi…). Mở DevTools > Performance để xem.'}); }
    if(V.fps.walk.fps < 40) issue(V.fps.walk.fps < 20 ? 'mid' : V.fps.walk.fps < 30 ? 'low' : 'info', 'FPS', vpn, `FPS khi đi bộ ${V.fps.walk.fps} (trình duyệt không GPU, máy thật thường cao hơn)`); }
  // ---- lưu / tải ----
  if(on('save') && ok){ p.__step = 'lưu/tải';
    await dbg(p, '__H.seed()'); await p.waitForTimeout(3200); const before = await dbg(p, 'saveProfile(); __H.snap()');
    await p.close(); const o2 = await openPage(b, vpn, ctx); const p2 = o2.p; o2.p.__step = 'tải lại';
    const ok2 = await login(p2, user, 'qa12345', false); await dbg(p2, HELP); const after = ok2 ? await dbg(p2, '__H.snap()') : null;
    const diffs = []; const cmp = (a, b, k) => { if(diffs.length > 40) return; if(a && typeof a === 'object'){ for(const x of Object.keys(a)) cmp(a[x], b ? b[x] : undefined, k + '.' + x); } else if(a !== (b && typeof b === 'object' ? NaN : b)) diffs.push({k, a:JSON.stringify(a), b:JSON.stringify(b)}); };
    if(after) cmp(before, after, 'PROF');
    const real = diffs.filter(d => !/\.(t|at|ts|last|time|seen|wT|lt|day|d|pd|wk|ping|tick|lastT|rt|hun|thirst|en|energy)$/i.test(d.k) && !(/\.mx$/.test(d.k) && +d.b >= +d.a) /* mx: kỷ lục tiền (v70e) cập nhật trễ, chỉ tăng */ && !/\.(hist|log)\.\d+\.(t|at)$/.test(d.k));
    V.save = {ok:!!after, keys:before ? Object.keys(before).length : 0, diffs:real, ign:diffs.length - real.length,
      check:after ? {money:after.money === 4321, hat:after.inv && after.inv.v74qTestHat === 123456, luong:after.v67l && after.v67l.tot === 987 && after.v67l.paid === 654, story:after.v70s && after.v70s.v74q === 1, cay:after.v66t && after.v66t.v74q === 2} : null};
    if(!after) issue('high', 'lưu', vpn, 'Tải lại trang rồi đăng nhập lại thất bại');
    else { Object.entries(V.save.check).forEach(([k, v]) => { if(!v) issue('high', 'lưu', vpn, `Mất dữ liệu sau khi tải lại: ${k}`); });
      real.forEach(d => issue('mid', 'lưu', vpn, `Dữ liệu đổi sau tải lại: ${d.k}`, {desc:`trước ${d.a} → sau ${d.b}`})); }
    o2.logs.filter(l => l.t !== 'warning').forEach(e => issue('high', 'lỗi JS', vpn, `Lỗi khi tải lại hồ sơ: ${e.s.slice(0, 120)}`, {st:e.st}));
    logs.push(...o2.logs.map(l => Object.assign(l, {at:'tải lại: ' + l.at}))); }
  // ---- tổng hợp log ----
  V.logs = logs; const seenL = new Set();
  logs.forEach(l => { const k = l.t + l.s.slice(0, 90); if(seenL.has(k)) return; seenL.add(k);
    if(l.at === 'tải' || l.at === 'đăng nhập' || l.at === 'màn hình chính') issue(l.t === 'warning' ? 'mid' : 'high', l.t === 'warning' ? 'cảnh báo' : 'lỗi JS', vpn, `${l.t === 'warning' ? 'Cảnh báo' : 'Lỗi'} console lúc ${l.at}: ${l.s.slice(0, 120)}`, {st:l.st}); });
  V.warnN = logs.filter(l => l.t === 'warning').length; V.errN = logs.filter(l => l.t !== 'warning').length; V.sec = Math.round((Date.now() - t0)/1000);
  await ctx.close(); console.log(`  ✓ ${vpn}: ${V.sec}s · ${V.zones ? V.zones.length : 0} khu · ${V.games ? V.games.length : 0} mini game · lỗi ${V.errN} · cảnh báo ${V.warnN}`);
}

// ---------------- 3. báo cáo HTML ----------------
// ghi chú tay (đã sửa / cần chủ game quyết) trong v74q/notes.json: {fixed:[{t,f}], decide:[{t,why}], cleanup:[{f,why}]}
function notes(){ const f = path.join(D, 'notes.json'); if(!fs.existsSync(f)) return ''; const N = JSON.parse(fs.readFileSync(f, 'utf8'));
  const li = (L, k) => (L || []).map(x => `<li>${esc(x.t || x.f)}${x[k] ? ` <small>— ${esc(x[k])}</small>` : ''}</li>`).join('');
  return `<section><h2>Ghi chú đợt ${esc(N.ver || '')}</h2><h3>✅ Đã sửa</h3><ul>${li(N.fixed, 'f')}</ul><h3>🤔 Cần chủ game quyết</h3><ul>${li(N.decide, 'why')}</ul><h3>🧹 Có thể dọn (chỉ báo cáo, chưa xoá)</h3><ul>${li(N.cleanup, 'why')}</ul></section>`; }
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c]));
function report(){
  const runs = ['files', 'bundle'].map(m => { const f = path.join(D, m === 'bundle' ? 'last-bundle.json' : 'last.json'); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; }).filter(Boolean);
  const order = {high:0, mid:1, low:2, info:3};
  const part = X => { const iss = X.issues.slice().sort((a, b) => order[a.sev] - order[b.sev]); const cnt = s => iss.filter(i => i.sev === s).length;
    const vps = Object.entries(X.vp).map(([k, V]) => `<div class="card"><h3>${esc(V.vi)}</h3><ul>
      <li>Tải xong: <b>${(V.loadMs/1000).toFixed(1)} s</b> · init chạy: <b>${V.init.filter(x => x.ok).length}/${V.init.length}</b>${V.init.some(x => !x.ok) ? ' <span class="bad">có init lỗi</span>' : ''}</li>
      <li>Lỗi console: <b class="${V.errN ? 'bad' : 'ok'}">${V.errN}</b> · cảnh báo: <b>${V.warnN}</b></li>
      <li>Khu đã tới: <b>${V.zones ? V.zones.length : '-'}</b>${V.placesAll && V.zones && V.zones.length < V.placesAll ? ' / ' + V.placesAll : ''} · kẹt: <b class="${V.zones && V.zones.some(z => z.stuck) ? 'bad' : 'ok'}">${V.zones ? V.zones.filter(z => z.stuck).length : '-'}</b></li>
      <li>Mini game & bảng: <b>${V.games ? V.games.filter(g => g.opened).length : '-'}</b> mở được / ${V.games ? V.games.length : '-'} · đóng được: <b>${V.games ? V.games.filter(g => g.opened && g.closed).length : '-'}</b></li>
      <li>FPS đứng / đi${V.fps && V.fps.soak ? ' / sau ' + V.fps.soak.sec + ' giây' : ''}: <b>${V.fps ? V.fps.stand.fps + ' / ' + V.fps.walk.fps + (V.fps.soak ? ' / ' + V.fps.soak.fps : '') : '-'}</b>${V.fps ? ` <small>(khung dài nhất ${V.fps.walk.max} ms)</small>` : ''}</li>
      <li>Lưu → tải lại: <b class="${V.save && V.save.ok && Object.values(V.save.check || {}).every(Boolean) && !V.save.diffs.length ? 'ok' : 'bad'}">${V.save ? (V.save.ok ? (Object.values(V.save.check).every(Boolean) && !V.save.diffs.length ? 'không mất gì' : 'có mất/đổi') : 'thất bại') : '-'}</b>${V.save ? ` <small>(${V.save.keys} mục hồ sơ)</small>` : ''}</li>
      <li>setInterval đang chạy: <b>${V.leak1 ? V.leak1.iv : '-'}</b> · listener window/document: <b>${V.leak1 ? V.leak1.ls : '-'}</b></li></ul>
      <img src="v74q/out/${X.mode}_${k}_hud.jpg" alt="màn hình chính" loading="lazy"></div>`).join('');
    const rows = iss.map(i => `<tr class="s-${i.sev}"><td><span class="tag">${sev[i.sev]}</span></td><td>${esc(i.cat)}</td><td>${esc(i.vp)}</td><td>${esc(i.title)}${i.desc ? `<details><summary>chi tiết</summary><pre>${esc(i.desc)}</pre></details>` : ''}${i.st ? `<details><summary>vết lỗi</summary><pre>${esc(i.st)}</pre></details>` : ''}</td><td>${i.img ? `<a href="v74q/out/${esc(i.img)}"><img src="v74q/out/${esc(i.img)}" loading="lazy"></a>` : ''}</td></tr>`).join('');
    const zones = Object.entries(X.vp).filter(([, V]) => V.zones).map(([k, V]) => `<h3>${esc(V.vi)} — ${V.zones.length} khu</h3><div class="grid">${V.zones.map(z => `<figure class="${z.stuck || z.errs ? 'warn' : ''}"><img src="v74q/out/${z.img}" loading="lazy"><figcaption>${esc(z.ic)} ${esc(z.name)}<br><small>${z.diff == null ? 'ảnh chuẩn mới' : 'khác chuẩn ' + Math.round(z.diff*100) + '%'}${z.stuck ? ' · KẸT' : ''}${z.errs ? ' · lỗi JS' : ''}</small></figcaption></figure>`).join('')}</div>`).join('');
    const games = Object.entries(X.vp).filter(([, V]) => V.games).map(([k, V]) => `<h3>${esc(V.vi)}</h3><table class="t"><tr><th>Mini game / bảng</th><th>Mở</th><th>Đóng</th><th>Chữ <16px</th><th>Nút che</th><th>Interval sót</th></tr>${V.games.map(g => `<tr><td>${esc(g.n)}</td><td>${g.err ? '<span class="bad">lỗi</span>' : g.opened ? '✅' : '—'}</td><td>${g.opened ? (g.closed ? '✅ ' + esc(g.how) : '<span class="bad">không</span>') : ''}</td><td>${g.scan ? g.scan.small.length : ''}</td><td>${g.scan ? g.scan.cover.length : ''}</td><td>${g.iv > 0 ? g.iv : ''}</td></tr>`).join('')}</table>`).join('');
    return `<section><h2>Chế độ: ${X.mode === 'bundle' ? 'Bản gói dist/ (?bundle)' : 'Từng file (js/…)'} <small>${esc(X.at.replace('T', ' ').slice(0, 16))}</small></h2>
      <div class="sum"><div class="n s-high">${cnt('high')}<small>Nặng</small></div><div class="n s-mid">${cnt('mid')}<small>Vừa</small></div><div class="n s-low">${cnt('low')}<small>Nhẹ</small></div><div class="n s-info">${cnt('info')}<small>Ghi chú</small></div></div>
      <div class="cards">${vps}</div><h2>Danh sách vấn đề (nặng → nhẹ)</h2>${iss.length ? `<table class="t iss"><tr><th>Mức</th><th>Loại</th><th>Màn</th><th>Mô tả</th><th>Ảnh</th></tr>${rows}</table>` : '<p class="ok">Không có vấn đề nào 🎉</p>'}
      <h2>Mini game & bảng</h2>${games}<h2>Ảnh từng khu</h2>${zones}</section>`; };
  const S = runs[0] ? runs[0].static : R.static;
  const st = `<section><h2>Kiểm tĩnh mã nguồn</h2><ul><li>${S.files} file trong FILES, ${S.lines} dòng · thiếu file: <b class="${S.missing.length ? 'bad' : 'ok'}">${S.missing.length}</b> · trùng const/let/class: <b class="${S.hard.length ? 'bad' : 'ok'}">${S.hard.length}</b> · hàm khai báo 2 lần (bản sau đè lặng lẽ): <b>${S.fnDup.length}</b></li></ul>
    ${S.fnDup.length ? `<details><summary>Hàm khai báo trùng (${S.fnDup.length})</summary><pre>${esc(S.fnDup.map(d => d.n + ': ' + d.at.join(', ')).join('\n'))}</pre></details>` : ''}
    <h3>Hàm bị bọc (gán lại) nhiều lớp nhất</h3><table class="t"><tr><th>Hàm</th><th>Số file bọc</th><th>Các file</th></tr>${S.wraps.slice(0, 20).map(w => `<tr><td>${esc(w.n)}</td><td>${w.k}</td><td><small>${esc(w.by.join(', '))}</small></td></tr>`).join('')}</table>
    <h3>Module không còn nằm trong FILES (đã gỡ / bị thay thế — chỉ liệt kê, KHÔNG xoá)</h3>${S.unused.length ? `<table class="t"><tr><th>File</th><th>KB</th><th>Dòng đầu</th></tr>${S.unused.map(u => `<tr><td>${esc(u.f)}</td><td>${u.kb}</td><td><small>${esc(u.head)}</small></td></tr>`).join('')}</table>` : '<p>Không có.</p>'}</section>`;
  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kiểm tra tự động v74q</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&display=swap" rel="stylesheet"><style>
:root{--bg:#f6f4ee;--fg:#1d2430;--mut:#5d6675;--card:#fff;--line:#e2ddd0;--high:#c62828;--mid:#ef6c00;--low:#1565c0;--info:#607d8b;--ok:#2e7d32}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 Nunito,system-ui,sans-serif;padding:0 16px 60px}main{max-width:1180px;margin:auto}
h1{font-size:30px;margin:28px 0 4px}h2{font-size:22px;margin:30px 0 10px;border-bottom:2px solid var(--line);padding-bottom:6px}h3{font-size:18px;margin:18px 0 8px}small{color:var(--mut);font-size:16px}
.sum{display:flex;gap:12px;flex-wrap:wrap}.n{background:var(--card);border-radius:12px;padding:10px 18px;font-size:30px;font-weight:800;min-width:90px;text-align:center;border:1px solid var(--line)}.n small{display:block;font-size:16px}
.s-high .tag,.n.s-high{color:var(--high)}.s-mid .tag,.n.s-mid{color:var(--mid)}.s-low .tag,.n.s-low{color:var(--low)}.s-info .tag,.n.s-info{color:var(--info)}.tag{font-weight:800}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;margin-top:14px}.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:6px 16px 14px}.card ul{padding-left:18px;margin:6px 0}.card img{width:100%;border-radius:8px;margin-top:8px}
.t{width:100%;border-collapse:collapse;background:var(--card);border-radius:12px;overflow:hidden}.t td,.t th{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}.t th{background:#ece7da}
.iss img{width:150px;border-radius:6px}pre{white-space:pre-wrap;font-size:16px;background:#f3f0e8;padding:8px;border-radius:8px;margin:4px 0;max-height:260px;overflow:auto}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}figure{margin:0;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:6px}figure.warn{border-color:var(--high)}figure img{width:100%;border-radius:6px}figcaption{font-size:16px;line-height:1.35}
.bad{color:var(--high)}.ok{color:var(--ok)}@media(max-width:600px){.t td,.t th{padding:6px}.iss img{width:90px}h1{font-size:24px}}
</style></head><body><main><h1>🤖 Kiểm tra tự động · v74q</h1><p><small>Trường Rubik của Hà Quân · game 2D · tạo bởi <code>node tools/qa/check.js</code>. Mỗi lần chạy ghi đè trang này.</small></p>
${notes()}${runs.map(part).join('')}${st}</main></body></html>`;
  fs.writeFileSync(path.join(QA, 'report.html'), html);
}

// ---------------- chạy ----------------
async function up(){ try { const r = await fetch(`http://localhost:${PORT}/index.html`); if(r.ok) return null; } catch(e){}
  const s = spawn(process.execPath, [path.join(ROOT, 'tools/build/serve.js'), ROOT, String(PORT)], {stdio:'ignore'});
  for(let i = 0; i < 50; i++){ await sleep(200); try { const r = await fetch(`http://localhost:${PORT}/index.html`); if(r.ok) return s; } catch(e){} } throw new Error('không bật được máy chủ'); }
module.exports = {openPage, login, dbg, HELP, QUIET, scan, VPS, up};
if(require.main === module) (async () => {
  if(arg('report-only')){ report(); console.log('đã ghi tools/qa/report.html'); return; }
  console.log(`v74q · kiểm tra ${MODE} · ${VPN.join(', ')}${QUICK ? ' · nhanh' : ''}`); staticCheck();
  const srv = await up(); const b = await chromium.launch(); const cp = await (await b.newContext()).newPage(); await cp.setContent('<canvas></canvas>');
  try { for(const v of VPN) await runVp(b, cp, v); }
  catch(e){ issue('high', 'bộ kiểm tra', '*', 'Bộ kiểm tra bị dừng giữa chừng: ' + e.message, {st:e.stack}); console.error(e); }
  finally { await b.close(); if(srv) srv.kill(); }
  // gom trùng (cùng tiêu đề ở nhiều màn hình)
  const M = new Map(); R.issues.forEach(i => { const k = i.sev + i.title; if(M.has(k)){ const o = M.get(k); if(!o.vp.split(',').includes(i.vp)) o.vp += ',' + i.vp; } else M.set(k, Object.assign({}, i)); }); R.issues = [...M.values()];
  fs.writeFileSync(path.join(D, BUNDLE ? 'last-bundle.json' : 'last.json'), JSON.stringify(R, null, 1)); report();
  const c = s => R.issues.filter(i => i.sev === s).length;
  console.log(`Xong: nặng ${c('high')} · vừa ${c('mid')} · nhẹ ${c('low')} · ghi chú ${c('info')} → tools/qa/report.html`);
  process.exitCode = c('high') ? 1 : 0;
})();
