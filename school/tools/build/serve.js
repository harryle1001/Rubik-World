// Máy chủ thử giống Netlify: nén brotli/gzip, ETag + 304, Cache-Control giống Netlify mặc định.
// Dùng: node tools/build/serve.js <thư-mục-gốc> [cổng=8761] [immutable=1 → file có hash trong dist/ được cache 1 năm]
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib'), crypto = require('crypto');
const root = path.resolve(process.argv[2] || '.'), port = +process.argv[3] || 8761, immut = process.argv[4] === '1';
const T = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.mp3':'audio/mpeg', '.ogg':'audio/ogg', '.wav':'audio/wav', '.txt':'text/plain; charset=utf-8', '.webmanifest':'application/manifest+json'};
const cache = new Map();
http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0]); if(u.endsWith('/')) u += 'index.html';
  const f = path.join(root, u); if(!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ r.writeHead(404); return r.end('404'); }
  const st = fs.statSync(f), key = f + st.mtimeMs; let e = cache.get(key);
  if(!e){ const b = fs.readFileSync(f), ext = path.extname(f), txt = /\.(html|js|css|json|svg|txt|webmanifest)$/.test(f);
    e = {b, br: txt ? zlib.brotliCompressSync(b, {params:{[zlib.constants.BROTLI_PARAM_QUALITY]:5}}) : null, gz: txt ? zlib.gzipSync(b) : null, etag:'"' + crypto.createHash('md5').update(b).digest('hex') + '"', type:T[ext] || 'application/octet-stream'}; cache.set(key, e); }
  const hashed = immut && /\/dist\/.*\.[0-9a-f]{8,}\.(js|json|txt)$/.test(u);
  const h = {'Content-Type':e.type, 'ETag':e.etag, 'Cache-Control': hashed ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate', 'Vary':'Accept-Encoding'};
  if(q.headers['if-none-match'] === e.etag){ r.writeHead(304, h); return r.end(); }
  const ae = q.headers['accept-encoding'] || ''; let body = e.b;
  if(e.br && /br/.test(ae)){ body = e.br; h['Content-Encoding'] = 'br'; } else if(e.gz && /gzip/.test(ae)){ body = e.gz; h['Content-Encoding'] = 'gzip'; }
  h['Content-Length'] = body.length; r.writeHead(200, h); r.end(body);
}).listen(port, () => console.log('serve', root, 'port', port, immut ? '(immutable dist)' : ''));
