// v61l · ĐÓNG GÓI game 2D: nối js/ theo đúng thứ tự FILES trong index.html → 1 bundle rút gọn có hash trong dist/.
// Chạy: cd school/tools/build && npm i && node build.js      (xem README.md cùng thư mục)
// - Giữ đúng ngữ nghĩa loader: mọi file chạy chung MỘT scope "(() => { 'use strict'; ... })()".
// - Rút gọn an toàn: chỉ bỏ khoảng trắng/chú thích + gọn cú pháp, KHÔNG đổi tên biến (các file gán lại hàm của nhau theo tên).
// - Dữ liệu lớn (sách, piano) tách ra dist/*.json, chỉ tải khi mở thư viện / đàn (js/ext/v61l-load.js).
// - Ghi tên bundle + chữ ký FILES vào index.html (giữa <!--v61l-build--> … <!--/v61l-build-->), tạo sw.js mới.
const fs = require('fs'), path = require('path'), crypto = require('crypto'), vm = require('vm');
const esbuild = require('esbuild');
const ROOT = path.resolve(__dirname, '../..'), DIST = path.join(ROOT, 'dist'), HTML = path.join(ROOT, 'index.html');
const VENDOR = 'js/vendor/chess-0.10.3.min.js';
// File có hàm bị đọc lại mã nguồn bằng toString() rồi sửa + eval (v55s-sea.js đọc mapDraw) → giữ NGUYÊN văn, không rút gọn.
const RAW = new Set(['js/ext/v32-phone-ui.js', 'js/ext/v46/minimap.js']);
const LAZY = {'js/data/books-text.js':{key:'books', name:'TEXT_GZ'}, 'js/data/piano-samples.js':{key:'piano', name:'PIANO_B64'}};
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
    parts.push(src); }
  // rút gọn TỪNG file (song song) rồi mới bọc chung 1 scope; thêm ';' cuối mỗi file để ranh giới y như bản gốc
  const mins = await Promise.all(parts.map((src, i) => RAW.has(FILES[i]) || LAZY[FILES[i]] ? src :
    esbuild.transform(src, {loader:'js', minifyWhitespace:true, minifySyntax:true, minifyIdentifiers:false, legalComments:'none', charset:'utf8', target:'es2020', logLevel:'error', sourcefile:FILES[i]}).then(r => r.code)));
  const code = "window.__RS_RAN = 1;\n(() => {\n'use strict';\n" + parts.join('\n') + "\n})();\n";
  const r = {code:"window.__RS_RAN=1;(()=>{'use strict';\n" + mins.map(m => m.trim() + ';').join('\n') + "\n})();\n"};
  const vendor = fs.readFileSync(path.join(ROOT, VENDOR), 'utf8').trim();
  const out = vendor + '\n' + r.code;
  // kiểm tra cú pháp bản gói trước khi ghi
  new vm.Script(out, {filename:'bundle.js'});
  const fn = `game.${hash(out)}.js`; fs.writeFileSync(path.join(DIST, fn), out);
  // 3. xoá bản cũ trong dist/
  const keep = new Set([fn, ...Object.values(lazy).map(u => u.slice(5))]);
  for(const o of old) if(!keep.has(o) && /^(game|books|piano)\.[0-9a-f]+\.(js|json)$/.test(o)) fs.unlinkSync(path.join(DIST, o));
  // 4. ghi vào index.html
  const info = {js:'dist/' + fn, sig:sig(FILES), kb:Math.round(require('zlib').brotliCompressSync(out).length/1024), lazy};
  const block = `<!--v61l-build--><script>window.V61L_BUILD=${JSON.stringify(info)};</script><!--/v61l-build-->`;
  if(!/<!--v61l-build-->[\s\S]*?<!--\/v61l-build-->/.test(html)){ console.error('Không thấy <!--v61l-build--> trong index.html'); process.exit(1); }
  html = html.replace(/<!--v61l-build-->[\s\S]*?<!--\/v61l-build-->/, block); fs.writeFileSync(HTML, html);
  // 5. service worker: phiên bản = hash bundle → bản mới tự thay cache cũ
  const sw = fs.readFileSync(path.join(__dirname, 'sw.template.js'), 'utf8').replace('__V61L_VER__', hash(out + JSON.stringify(lazy))).replace('__V61L_PRE__', JSON.stringify(['dist/' + fn]));
  fs.writeFileSync(path.join(ROOT, 'sw.js'), sw);
  const raw = Buffer.byteLength(code), min = Buffer.byteLength(out);
  console.log(`OK ${FILES.length} file → dist/${fn}  ${(raw/1e6).toFixed(2)} MB → ${(min/1e6).toFixed(2)} MB (brotli ~${info.kb} KB)  lười: ${Object.values(lazy).join(', ')}  ${Date.now() - t0} ms`);
})().catch(e => { console.error(e); process.exit(1); });
