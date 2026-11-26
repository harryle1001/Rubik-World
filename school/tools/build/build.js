// v61l · ĐÓNG GÓI game 2D: nối js/ theo đúng thứ tự FILES trong index.html → 1 bundle rút gọn có hash trong dist/.
// Chạy: cd school/tools/build && npm i && node build.js      (xem README.md cùng thư mục)
// - Giữ đúng ngữ nghĩa loader: mọi file chạy chung MỘT scope "(() => { 'use strict'; ... })()".
// - Rút gọn an toàn: chỉ bỏ khoảng trắng/chú thích + gọn cú pháp, KHÔNG đổi tên biến (các file gán lại hàm của nhau theo tên).
// - Dữ liệu lớn (sách, piano) tách ra dist/*.json, chỉ tải khi mở thư viện / đàn (js/ext/v61l-load.js).
// - Ghi tên bundle + chữ ký FILES vào index.html (giữa <!--v61l-build--> … <!--/v61l-build-->), tạo sw.js mới.
const fs = require('fs'), path = require('path'), crypto = require('crypto'), vm = require('vm');
const esbuild = require('esbuild');
const AC = require('./v74l-acorn'); if(AC.respawn()) return;   // v74l: cần acorn (có sẵn trong Node) để tách hàm lạnh
const ROOT = path.resolve(__dirname, '../..'), DIST = path.join(ROOT, 'dist'), HTML = path.join(ROOT, 'index.html');
const VENDOR = 'js/vendor/chess-0.10.3.min.js';
// File có hàm bị đọc lại mã nguồn bằng toString() rồi sửa + eval (v55s-sea.js đọc mapDraw) → giữ NGUYÊN văn, không rút gọn.
const RAW = new Set(['js/ext/v32-phone-ui.js', 'js/ext/v46/minimap.js']);
const LAZY = {'js/data/books-text.js':{key:'books', name:'TEXT_GZ'}, 'js/data/piano-samples.js':{key:'piano', name:'PIANO_B64'}};
// v74l: hằng dữ liệu lớn nằm GIỮA file code (danh mục ~4 600 sách của thư viện) → tách ra dist/cat.<hash>.json, trong bản gói còn "let BOOKS = [];".
// js/ext/v74l-load.js nạp lúc rảnh sau khi hiện màn đăng nhập (hoặc ngay khi mở thư viện). Không thấy mẫu → giữ nguyên, chỉ báo.
const LAZY_CONST = {'js/games/library.js':{key:'cat', names:['BOOKS', 'PICBOOKS']}};
// v74l: bảng băm ảnh/css cho service worker (ảnh không đổi → không bao giờ hỏi lại máy chủ; đổi → tải bản mới)
const MAN_DIRS = ['assets', 'css'], MAN_EXT = /\.(png|gif|jpe?g|webp|svg|css)$/i;
const hash = b => crypto.createHash('sha256').update(b).digest('hex').slice(0, 10);
const sig = list => { let h = 5381; const s = list.join('|'); for(let i = 0; i < s.length; i++) h = ((h*33) ^ s.charCodeAt(i)) >>> 0; return h.toString(16); };

(async () => {
  const t0 = Date.now();
  let html = fs.readFileSync(HTML, 'utf8');
  const FILES = [...html.match(/const FILES = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
  // 1. kiểm tra trùng tên khai báo cấp trên cùng (const/let trùng = sập game; function trùng = đè lặng lẽ → chỉ báo)
  const seen = new Map(), clash = [];
  for(const f of FILES){ const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    for(const m of src.matchAll(/^(?:const|let|class)\s+([A-Za-z_$][\w$]*)/gm)){ const n = m[1]; if(seen.has(n) && seen.get(n) !== f) clash.push(n + ': ' + seen.get(n) + ' & ' + f); seen.set(n, f); } }
  if(clash.length){ console.error('LỖI: const/let trùng tên ở cấp trên cùng:\n' + clash.join('\n')); process.exit(1); }
  // 2. nối file, tách dữ liệu lớn
  fs.mkdirSync(DIST, {recursive:true});
  const old = fs.readdirSync(DIST); const lazy = {}, parts = [];
  for(const f of FILES){ const src = fs.readFileSync(path.join(ROOT, f), 'utf8'), L = LAZY[f];
    if(L){ const val = vm.runInNewContext(src + '\n;' + L.name); const json = JSON.stringify(val), fn = `${L.key}.${hash(json)}.json`;
      fs.writeFileSync(path.join(DIST, fn), json); lazy[L.key] = 'dist/' + fn; parts.push(`let ${L.name} = null; // v61l: tải lười từ dist/${fn}`); continue; }
    const LC = LAZY_CONST[f]; let s2 = src;
    if(LC){ const data = {}; for(const n of LC.names){ const re = new RegExp('^const ' + n + ' = (\\[.*\\]);?[ \\t]*$', 'm'), m = s2.match(re);
        if(!m){ console.warn('v74l: không thấy "const ' + n + ' = [...]" trong ' + f + ' → giữ trong bản gói'); continue; }
        data[n] = vm.runInNewContext('(' + m[1] + ')'); s2 = s2.replace(re, () => `let ${n} = []; // v74l: tải lười từ dist/${LC.key}.*.json`); }
      if(Object.keys(data).length){ const json = JSON.stringify(data), fn = `${LC.key}.${hash(json)}.json`; fs.writeFileSync(path.join(DIST, fn), json); lazy[LC.key] = 'dist/' + fn; } }
    parts.push(s2); }
  // rút gọn TỪNG file (song song) rồi mới bọc chung 1 scope; thêm ';' cuối mỗi file để ranh giới y như bản gốc
  const mins = await Promise.all(parts.map((src, i) => RAW.has(FILES[i]) || LAZY[FILES[i]] ? src :
    esbuild.transform(src, {loader:'js', minifyWhitespace:true, minifySyntax:true, minifyIdentifiers:false, legalComments:'none', charset:'utf8', target:'es2020', logLevel:'error', sourcefile:FILES[i]}).then(r => r.code)));
  // v74l: TÁCH HÀM LẠNH — hàm trong tools/build/v74l-cold.json (không được gọi lúc mở game, xem v74l-cover.js) chỉ giữ "vỏ" cùng tên
  // trong bản gói; thân hàm nằm ở dist/lazy.<hash>.json, tải ngay khi bản gói bắt đầu chạy (song song lúc khởi tạo).
  // Lần gọi đầu: dịch thân hàm bằng eval trực tiếp TRONG scope chung → thấy mọi tên như cũ, this/arguments giữ nguyên.
  // Chưa tải xong mà đã gọi (hiếm): tải đồng bộ. Không có acorn / danh sách → bỏ qua, bản gói như trước.
  const acorn = AC(), COLD = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'v74l-cold.json'), 'utf8')).files || {}; } catch(e){ return {}; } })();
  const lz = []; let lzFn = '', lzN = 0;
  if(acorn && Object.keys(COLD).length) FILES.forEach((f, i) => { const want = COLD[f]; if(!want || RAW.has(f) || LAZY[f]) return;
    let code = mins[i], fns; try { fns = AC.topFns(acorn, code); } catch(e){ console.warn('v74l: không phân tích được ' + f + ' → giữ nguyên'); return; }
    const W = new Set(want), cnt = {}; fns.forEach(d => cnt[d.name] = (cnt[d.name] || 0) + 1);
    for(const d of fns.filter(d => W.has(d.name) && cnt[d.name] === 1).sort((a, b) => b.start - a.start)){
      const body = '(function' + code.slice(d.idEnd, d.end) + ')'; try { new vm.Script(body); } catch(e){ continue; }
      const id = lz.length; lz.push(body); lzN++;
      code = code.slice(0, d.start) + `function ${d.name}(){return __v74lZ(${id}).apply(this,arguments)}` + code.slice(d.end); }
    mins[i] = code; });
  let pro = '';
  if(lz.length){ const j = JSON.stringify(lz); lzFn = `lazy.${hash(j)}.json`; fs.writeFileSync(path.join(DIST, lzFn), j);
    pro = `const __v74lZS={src:null,url:${JSON.stringify('dist/' + lzFn)}};function __v74lZ(__v74lI){const __v74lC=__v74lZ.c||(__v74lZ.c=[]);if(__v74lC[__v74lI])return __v74lC[__v74lI];if(!__v74lZS.src){const __v74lX=new XMLHttpRequest();__v74lX.open('GET',__v74lZS.url,false);__v74lX.send();__v74lZS.src=JSON.parse(__v74lX.responseText);__v74lZ.sync=(__v74lZ.sync||0)+1}return __v74lC[__v74lI]=eval(__v74lZS.src[__v74lI])}fetch(__v74lZS.url).then(r=>r.ok?r.json():null).then(j=>{if(j&&!__v74lZS.src)__v74lZS.src=j}).catch(()=>{});\n`;
    lazy.code = 'dist/' + lzFn; }
  const code = "window.__RS_RAN = 1;\n(() => {\n'use strict';\n" + parts.join('\n') + "\n})();\n";
  const r = {code:"window.__RS_RAN=1;(()=>{'use strict';\n" + pro + mins.map(m => m.trim() + ';').join('\n') + "\n})();\n"};
  const vendor = fs.readFileSync(path.join(ROOT, VENDOR), 'utf8').trim();
  const out = vendor + '\n' + r.code;
  // kiểm tra cú pháp bản gói trước khi ghi
  new vm.Script(out, {filename:'bundle.js'});
  const fn = `game.${hash(out)}.js`; fs.writeFileSync(path.join(DIST, fn), out);
  // 3. xoá bản cũ trong dist/
  // v74l: bảng băm ảnh/css
  const man = {}; const walk = d => { if(!fs.existsSync(path.join(ROOT, d))) return; for(const e of fs.readdirSync(path.join(ROOT, d), {withFileTypes:true})){ const r = d + '/' + e.name;
    if(e.isDirectory()) walk(r); else if(MAN_EXT.test(e.name)) man[r] = hash(fs.readFileSync(path.join(ROOT, r))).slice(0, 8); } };
  MAN_DIRS.forEach(walk); let manFn = '';
  if(Object.keys(man).length){ const j = JSON.stringify(man); manFn = `assets.${hash(j)}.json`; fs.writeFileSync(path.join(DIST, manFn), j); }
  const keep = new Set([fn, manFn, ...Object.values(lazy).map(u => u.slice(5))]);
  for(const o of old) if(!keep.has(o) && /^(game|books|piano|cat|assets|lazy)\.[0-9a-f]+\.(js|json)$/.test(o)) fs.unlinkSync(path.join(DIST, o));
  // 4. ghi vào index.html
  const info = {js:'dist/' + fn, sig:sig(FILES), kb:Math.round(require('zlib').brotliCompressSync(out).length/1024), lazy};
  const block = `<!--v61l-build--><script>window.V61L_BUILD=${JSON.stringify(info)};</script><!--/v61l-build-->`;
  if(!/<!--v61l-build-->[\s\S]*?<!--\/v61l-build-->/.test(html)){ console.error('Không thấy <!--v61l-build--> trong index.html'); process.exit(1); }
  html = html.replace(/<!--v61l-build-->[\s\S]*?<!--\/v61l-build-->/, block); fs.writeFileSync(HTML, html);
  // 5. service worker: phiên bản = hash bundle → bản mới tự thay cache cũ
  // v74l: phiên bản đổi khi bản gói, dữ liệu, trang chính hoặc bất kỳ ảnh/css nào đổi
  const pre = ['dist/' + fn].concat(lazy.code ? [lazy.code] : [], lazy.cat ? [lazy.cat] : []);
  const sw = fs.readFileSync(path.join(__dirname, 'sw.template.js'), 'utf8').replace('__V61L_VER__', hash(out + JSON.stringify(lazy) + html + manFn))
    .replace('__V61L_PRE__', JSON.stringify(pre)).replace('__V74L_MAN__', manFn ? 'dist/' + manFn : '').replace('__V74L_DIST__', JSON.stringify(['dist/' + fn].concat(Object.values(lazy))));
  fs.writeFileSync(path.join(ROOT, 'sw.js'), sw);
  const raw = Buffer.byteLength(code), min = Buffer.byteLength(out);
  console.log(`OK ${FILES.length} file → dist/${fn}  ${(raw/1e6).toFixed(2)} MB → ${(min/1e6).toFixed(2)} MB (brotli ~${info.kb} KB)  lười: ${Object.values(lazy).join(', ')}  ảnh/css: ${Object.keys(man).length}  hàm lạnh: ${lzN}${lzFn ? ' → dist/' + lzFn + ' (' + Math.round(fs.statSync(path.join(DIST, lzFn)).size/1024) + ' KB)' : ''}  ${Date.now() - t0} ms`);
})().catch(e => { console.error(e); process.exit(1); });
