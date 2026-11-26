// v74l · ĐO HÀM NÀO DÙNG LÚC MỞ GAME → ghi tools/build/v74l-cold.json (danh sách hàm "lạnh" được build.js tách sang dist/lazy.*.json).
// Chạy (chế độ từng file trên localhost):  node tools/build/serve.js . 8762   rồi   node tools/build/v74l-cover.js http://localhost:8762/index.html
// Mỗi cỡ màn hình (điện thoại dọc/ngang, máy tính): mở game → tạo tài khoản → đi khắp các khu + phóng to/thu nhỏ ~70 s
// → tải lại → đăng nhập tài khoản cũ. Hàm nào được gọi (dù 1 lần) = "nóng", giữ nguyên trong bản gói.
// Hàm lạnh vẫn chạy đúng: bản gói giữ một "vỏ" cùng tên, lần gọi đầu mới dịch thân hàm (đã tải sẵn ngay sau bản gói).
// Hàm mới thêm sau lần đo này luôn ở bản gói (an toàn); thỉnh thoảng chạy lại để cập nhật.
const AC = require('./v74l-acorn'); if(AC.respawn()) return;
const acorn = AC(); if(!acorn){ console.error('Không có acorn'); process.exit(1); }
const {chromium} = require('playwright'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..'), url = process.argv[2] || 'http://localhost:8762/index.html', SECS = +process.argv[3] || 70;
const RAW = new Set(['js/ext/v32-phone-ui.js', 'js/ext/v46/minimap.js']), MIN_LEN = 160;
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const FILES = [...html.match(/const FILES = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
const SRC = FILES.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8'));
const HEAD = "window.__RS_RAN = 1;\n(() => {\n'use strict';\n";
const base = []; { let o = HEAD.length; SRC.forEach((s, i) => { base[i] = o; o += s.length + 1; }); }
const decl = SRC.map(s => AC.topFns(acorn, s));
const all = SRC.join('\n'), count = new Map(); decl.flat().forEach(d => count.set(d.name, (count.get(d.name) || 0) + 1));
const risky = n => new RegExp('(new\\s+' + n + '\\b|\\b' + n + '\\s*\\.\\s*(prototype|toString|length|name|call|bind)\\b)').test(all);
const hot = new Set(), seen = new Set();
async function session(b, vp){
  const ctx = await b.newContext({viewport:{width:vp[0], height:vp[1]}, isMobile:vp[2], hasTouch:vp[2]}); const p = await ctx.newPage(), c = await ctx.newCDPSession(p);
  await c.send('Profiler.enable'); await c.send('Profiler.startPreciseCoverage', {callCount:true, detailed:false});
  const D = s => p.evaluate(s => window.__dbg(s), s).catch(() => {});
  const take = async () => { const r = await c.send('Profiler.takePreciseCoverage');
    for(const s of r.result){ if(!/rubik-school-game\.js/.test(s.url) && !s.functions.some(f => f.functionName === 'extFinalInit')) continue;
      for(const f of s.functions){ const r0 = f.ranges[0]; if(!f.functionName) continue; seen.add(f.functionName + '@' + r0.startOffset); if(r0.count > 0) hot.add(f.functionName + '@' + r0.startOffset); } } };
  await p.goto(url); await p.waitForFunction(() => typeof window.__dbg === 'function', null, {timeout:90000});
  await p.waitForSelector('#lgName', {state:'visible', timeout:60000}); const nm = 'cov' + Date.now() % 1e6;
  await p.fill('#lgName', nm); await p.fill('#lgPass', 'qa12345'); await p.click('#lgNew');
  await p.waitForSelector('#crDone', {state:'visible', timeout:20000}).catch(() => {}); await p.click('#crDone').catch(() => {}); await p.waitForTimeout(1500);
  for(let i = 0; i < 4; i++) await D('try{ if(openModal) hideModal() }catch(e){}');
  const t0 = Date.now(); let k = 0;
  while(Date.now() - t0 < SECS*1000){ k++;
    await D(`(() => { try { const Z = V46.Z.filter(z => !z.flip), z = Z[${k} % Z.length], n = z.n; v54qTeleNew((n.x0 + n.x1)/2, n.y1 + 60); backToPlayer(); } catch(e){} })()`);
    if(k % 5 === 0) await D(`try { followCam = false; cam.z = [.3, .6, 1.4, v56pZMin()][${k} % 4]; clampCam(); } catch(e){}`);
    if(k % 5 === 2) await D('try { backToPlayer(); } catch(e){}');
    const key = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'][k % 4]; await p.keyboard.down(key); await p.waitForTimeout(900); await p.keyboard.up(key);
  }
  await take();
  // lần mở sau: tài khoản cũ
  await p.reload(); await p.waitForFunction(() => typeof window.__dbg === 'function', null, {timeout:90000});
  await p.waitForSelector('#lgName', {state:'visible', timeout:60000}).catch(() => {}); await p.fill('#lgName', nm).catch(() => {}); await p.fill('#lgPass', 'qa12345').catch(() => {});
  await p.click('#lgGo').catch(() => {}); await p.waitForTimeout(6000); await take();
  await ctx.close();
}
(async () => {
  const b = await chromium.launch();
  for(const vp of [[390, 844, true], [844, 390, true], [1440, 900, false]]){ await session(b, vp); console.log('xong', vp.join('x'), 'nóng:', hot.size); }
  await b.close();
  const out = {}; let nc = 0, bytes = 0, kept = 0;
  FILES.forEach((f, i) => { if(RAW.has(f)) return; const L = [];
    for(const d of decl[i]){ const key = d.name + '@' + (base[i] + d.start);
      if(!seen.has(key)){ kept++; continue; }                     // không thấy trong số đo → giữ nguyên (an toàn)
      if(hot.has(key) || count.get(d.name) > 1 || d.end - d.start < MIN_LEN || risky(d.name)) continue;
      L.push(d.name); nc++; bytes += d.end - d.start; }
    if(L.length) out[f] = L; });
  fs.writeFileSync(path.join(__dirname, 'v74l-cold.json'), JSON.stringify({v:1, at:new Date().toISOString().slice(0, 10), note:'hàm không được gọi lúc mở game + đi khắp đảo (tools/build/v74l-cover.js)', files:out}, null, 0).replace(/\],"/g, '],\n"'));
  console.log(`hàm lạnh: ${nc}  (${(bytes/1e6).toFixed(2)} MB mã gốc)  không đo được (giữ): ${kept}  → tools/build/v74l-cold.json`);
})();
