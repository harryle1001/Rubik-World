// site.js — trang công khai cho NGƯỜI LỚN: giới thiệu (/gioi-thieu), Góc phụ huynh (/blog), SEO (sitemap, robots).
// Game vẫn ở "/" (và "/play"). Trang dựng sẵn trên server, CSS nội tuyến → tải nhanh, không chặn hiển thị.
// φ: chữ 13/16/21/26/34/55 · khoảng 8/13/21/34/55/89 · cột 987 · hero 1.618fr / 1fr · ảnh 16:9
const fs = require('fs');
const path = require('path');

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const NAME = 'Đảo Rubik', ORG = 'Trường Rubik';

const CSS = `:root{--bg:#f6f0e4;--card:#fff;--ink:#2e2418;--mute:#6f604f;--line:#e6dccb;--pri:#2c8f82;--pri2:#1f6d63;--acc:#f0a23a;--night:#1b1626;--gold:#c9a24a}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.618 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--pri2)}img{max-width:100%;height:auto;display:block}
.w{max-width:987px;margin:0 auto;padding:0 16px}
.top{background:var(--night);color:#fff;position:sticky;top:0;z-index:9}
.top .w{display:flex;align-items:center;gap:13px;min-height:55px}
.brand{display:flex;align-items:center;gap:8px;color:#fff;text-decoration:none;font-weight:900;font-size:21px;white-space:nowrap}.brand img{width:34px;height:34px}
.nav{display:flex;gap:21px;margin-left:auto;align-items:center}.nav a{color:#fff;opacity:.85;text-decoration:none;font-weight:700;font-size:15px}.nav a:hover{opacity:1}
.b{display:inline-block;padding:13px 21px;border-radius:13px;background:var(--pri);color:#fff;text-decoration:none;font:800 16px system-ui;text-align:center;border:0;cursor:pointer}
.b:hover{background:var(--pri2)}.b.gold{background:var(--acc);color:#2a1a0a}.b.ghost{background:transparent;color:inherit;box-shadow:inset 0 0 0 2px currentColor}.b.sm{padding:8px 13px;font-size:14px}
.nav .b{opacity:1;color:#2a1a0a}
@media(max-width:700px){.nav a:not(.b){display:none}.brand{font-size:18px}}
.hero{background:radial-gradient(120% 90% at 80% 0,#3a2d55 0,var(--night) 61.8%);color:#fff;padding:55px 0 89px}
.hero .w{display:grid;grid-template-columns:1.618fr 1fr;gap:34px;align-items:center}
.hero h1{font-size:55px;line-height:1.146;margin:0 0 21px;letter-spacing:-.5px}.hero h1 em{font-style:normal;color:var(--acc)}
.hero p.lead{font-size:21px;opacity:.88;margin:0 0 34px}
.cta{display:flex;flex-wrap:wrap;gap:13px}.hero .b.ghost{color:#fff}
.shot{border-radius:21px;overflow:hidden;box-shadow:0 21px 55px #0008;aspect-ratio:16/9;background:#2b2340}
.shot img{width:100%;height:100%;object-fit:cover}
@media(max-width:800px){.hero{padding:34px 0 55px}.hero .w{grid-template-columns:1fr}.hero h1{font-size:34px}.hero p.lead{font-size:18px}}
.facts{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-top:-34px}
.facts div{background:var(--card);border-radius:21px;padding:21px 13px;text-align:center;box-shadow:0 8px 34px #0000000f;font-size:14px;color:var(--mute);font-weight:600}
.facts b{display:block;font-size:26px;color:var(--ink);line-height:1.382}
@media(max-width:700px){.facts{grid-template-columns:repeat(2,1fr)}}
section{padding:55px 0}section h2{font-size:34px;line-height:1.236;margin:0 0 13px}section .sub{color:var(--mute);font-size:18px;margin:0 0 34px;max-width:610px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:21px}@media(max-width:800px){.grid{grid-template-columns:1fr 1fr}}@media(max-width:520px){.grid{grid-template-columns:1fr}}
.card{background:var(--card);border-radius:21px;padding:21px;box-shadow:0 2px 13px #0000000d}.card h3{margin:0 0 8px;font-size:18px}.card p{margin:0;color:var(--mute)}
.ic{font-size:34px;line-height:1;margin-bottom:13px;display:block}
.gal{display:grid;grid-template-columns:1.618fr 1fr;gap:13px}.gal figure{margin:0;border-radius:21px;overflow:hidden;position:relative;background:#ddd;aspect-ratio:16/9}
.gal figure:first-child{grid-row:span 2;aspect-ratio:auto}.gal img{width:100%;height:100%;object-fit:cover}
.gal figcaption{position:absolute;left:13px;bottom:13px;background:#1b1626cc;color:#fff;padding:3px 13px;border-radius:13px;font:700 13px system-ui}
@media(max-width:700px){.gal{grid-template-columns:1fr}.gal figure:first-child{grid-row:auto;aspect-ratio:16/9}}
.split{display:grid;grid-template-columns:1fr 1.618fr;gap:34px;align-items:center}.split.r{grid-template-columns:1.618fr 1fr}@media(max-width:800px){.split,.split.r{grid-template-columns:1fr}}
.ticks{list-style:none;padding:0;margin:0 0 21px}.ticks li{padding:5px 0 5px 29px;position:relative}.ticks li:before{content:"✦";position:absolute;left:5px;color:var(--gold)}
.dark{background:var(--night);color:#fff}.dark .sub{color:#fffb}.dark .card{background:#2a2240;box-shadow:none}.dark .card p{color:#fffc}
.quote{font-size:17px}.quote p{color:var(--ink)!important;font-style:italic}.quote footer{margin-top:13px;font:700 14px system-ui;color:var(--mute)}
.tag{display:inline-block;font:800 12px system-ui;background:#efe3cc;color:#6a4a10;border-radius:8px;padding:0 8px;margin-left:5px;vertical-align:middle}
.posts .card{padding:0;overflow:hidden;display:flex;flex-direction:column}.posts .card a.c{color:inherit;text-decoration:none;display:block;padding:21px}.posts .card h3{font-size:19px;line-height:1.382}
.meta{font-size:13px;color:var(--mute);margin-bottom:8px}
details{background:var(--card);border-radius:13px;padding:13px 21px;margin-bottom:13px}summary{font-weight:800;cursor:pointer}
.ad{display:none;margin:34px auto;max-width:728px;text-align:center}.ads-on .ad{display:block}.ad>span{display:block;font:700 11px system-ui;letter-spacing:1px;text-transform:uppercase;color:var(--mute);margin-bottom:5px}.ad ins{min-height:89px}
.foot{background:#ece3d2;padding:34px 0 55px;font-size:14px;color:var(--mute)}.foot .w{display:flex;flex-wrap:wrap;gap:13px 34px;justify-content:space-between}.foot a{color:var(--ink);margin-right:13px}
.foot button{background:none;border:0;padding:0;font:inherit;color:var(--ink);text-decoration:underline;cursor:pointer}
.art{max-width:700px;margin:0 auto;padding:34px 16px 55px}.art h1{font-size:34px;line-height:1.236;margin:8px 0 13px}.art h2{font-size:24px;margin:34px 0 13px}.art h3{font-size:19px;margin:21px 0 8px}
.art img{border-radius:13px;margin:21px 0}.art blockquote{margin:21px 0;padding:13px 21px;background:#fff;border-left:5px solid var(--gold);border-radius:8px}.art li{margin:5px 0}
.crumb{font-size:14px}.crumb a{text-decoration:none}
.consent{position:fixed;left:13px;right:13px;bottom:13px;z-index:20;max-width:610px;margin:0 auto;background:#fff;border-radius:21px;padding:21px;box-shadow:0 13px 55px #0004;font-size:14px}
.consent h2{font-size:18px;margin:0 0 8px}.consent p{margin:0 0 13px}.consent .cta{gap:8px}.consent .b{padding:8px 13px;font-size:14px}
:focus-visible{outline:3px solid var(--acc);outline-offset:2px}`;

module.exports = function setupSite(app, { ROOT, aff }) {
  const env = process.env;
  const ADS = (env.ADSENSE_CLIENT || '').trim();             // VD ca-pub-1234567890123456 — để trống = TẮT quảng cáo
  const ADS_SLOT = (env.ADSENSE_SLOT || '').trim();
  const base = req => (env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const BLOG_DIR = path.join(ROOT, 'content', 'blog');

  // ---------- Góc phụ huynh: content/blog/*.md (front matter đơn giản) → HTML dựng sẵn khi khởi động ----------
  const { marked } = require('marked');
  function loadPosts() {
    let files = []; try { files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md')); } catch (e) {}
    return files.map(f => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, f), 'utf8'), m = raw.match(/^---\n([\s\S]*?)\n---\n?/), meta = {};
      if (m) for (const l of m[1].split('\n')) { const i = l.indexOf(':'); if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, ''); }
      const md = m ? raw.slice(m[0].length) : raw;
      return { slug: f.replace(/\.md$/, ''), title: meta.title || f, description: meta.description || '', date: meta.date || '', cover: meta.cover || '', tags: (meta.tags || '').replace(/[[\]]/g, '').split(',').map(s => s.trim()).filter(Boolean), draft: meta.draft === 'true', html: marked.parse(md) };
    }).filter(p => !p.draft).sort((a, b) => (b.date > a.date ? 1 : -1));
  }
  let POSTS = loadPosts(), postsAt = Date.now();
  const posts = () => { if (env.NODE_ENV !== 'production' && Date.now() - postsAt > 5000) { POSTS = loadPosts(); postsAt = Date.now(); } return POSTS; };   // máy mình: sửa .md thấy ngay
  const vnDate = d => (d ? d.split('-').reverse().join('/') : '');

  // ---------- khung trang ----------
  const adSlot = () => (ADS ? `<aside class="ad" aria-label="Quảng cáo"><span>Quảng cáo</span><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(ADS)}"${ADS_SLOT ? ` data-ad-slot="${esc(ADS_SLOT)}"` : ''} data-ad-format="auto" data-full-width-responsive="true"></ins></aside>` : '');
  function page(req, { title, desc, p, body, ads = false, ld = [], image = '/site/img/og.jpg', type = 'website', robots = 'index,follow' }) {
    const url = base(req) + p, img = /^https?:/.test(image) ? image : base(req) + image;
    return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(url)}"><meta name="robots" content="${robots}">
<meta name="theme-color" content="#1b1626"><link rel="icon" href="/icons/logo.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<meta property="og:type" content="${type}"><meta property="og:site_name" content="${NAME}"><meta property="og:locale" content="vi_VN"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}"><meta property="og:image" content="${esc(img)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(img)}">
${ads && ADS ? `<meta name="rubik-ads" content="${esc(ADS)}">` : ''}${ld.map(o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('')}
<style>${CSS}</style><script src="/site/site.js" defer></script></head><body>
<header class="top"><div class="w"><a class="brand" href="/gioi-thieu"><img src="/icons/logo.svg" alt="" width="34" height="34">${NAME}</a>
<nav class="nav" aria-label="Chính"><a href="/gioi-thieu#loi-ich">Lợi ích</a><a href="/blog">Góc phụ huynh</a><a href="/gioi-thieu#nha-truong">Nhà trường</a><a class="b gold sm" href="/">▶ Chơi ngay</a></nav></div></header>
<main id="main">${body}</main>
<footer class="foot"><div class="w"><div><b style="color:var(--ink)">${NAME} · ${ORG}</b><br>Thế giới mở 3D để học sinh vừa học vừa chơi.<br>Trong game không quảng cáo, không chat tự do.</div>
<div><a href="/">Chơi ngay</a><a href="/blog">Góc phụ huynh</a><a href="/parent">Trang Phụ huynh</a><a href="/teacher">Giáo viên</a><br><a href="/privacy">Chính sách bảo mật</a><a href="/terms">Điều khoản</a><button type="button" data-consent-open>Cài đặt cookie</button></div></div></footer>
</body></html>`;
  }
  const send = (res, html) => { res.set('Cache-Control', 'public, max-age=300'); res.type('html').send(html); };

  // ---------- trang giới thiệu ----------
  const FEAT = [
    ['🧮', 'Toán', 'Bảng nhân, phân số, hình học… trong câu đố mở rương, xây nhà, đua chổi — sai thì được gợi ý, không bị phạt.'],
    ['📖', 'Tiếng Việt', 'Đọc hiểu, chính tả, thành ngữ qua lời nhân vật và nhiệm vụ trên đảo.'],
    ['🗣️', 'Tiếng Anh', 'Từ vựng theo chủ đề gắn với đồ vật, con vật em gặp khi khám phá.'],
    ['🔬', 'Khoa học', 'Sinh vật biển, thực vật, thời tiết, ánh sáng — học bằng cách lặn, quan sát, ghi vào bách khoa.'],
    ['🗺️', 'Sử – Địa', 'Di tích, bản đồ, phương hướng: lần theo la bàn để tìm kho báu.'],
    ['🧩', 'Tư duy Rubik', 'Phòng Rubik 3D: ký hiệu xoay, công thức từng bước — rèn trí nhớ và tính kiên nhẫn.'],
  ];
  const SAFE = [
    ['💬', 'Không chat tự do', 'Chỉ biểu cảm và câu nói có sẵn — người lạ không thể nhắn tin cho con.'],
    ['⏱️', 'Giới hạn giờ chơi', 'Bố mẹ đặt số phút mỗi ngày; hết giờ game nhẹ nhàng dừng.'],
    ['🚫', 'Không quảng cáo trong game', 'Không vật phẩm may rủi, không nút mua bấm nhầm. Mọi trang trả phí đều sau cổng phụ huynh.'],
  ];
  function testimonials() {
    let t = []; try { t = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'testimonials.json'), 'utf8')); } catch (e) {}
    return t.slice(0, 3).map(q => `<blockquote class="card quote"><p>“${esc(q.text)}”</p><footer>— ${esc(q.who)}${q.sample ? '<span class="tag">Minh hoạ</span>' : ''}</footer></blockquote>`).join('');
  }
  const postCards = list => list.map(p => `<article class="card"><a class="c" href="/blog/${p.slug}"><div class="meta">${vnDate(p.date)}${p.tags.length ? ' · ' + esc(p.tags.join(', ')) : ''}</div><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p></a></article>`).join('');

  app.get(['/gioi-thieu', '/gioi-thieu/'], (req, res) => {
    const u = base(req);
    const ld = [{ '@context': 'https://schema.org', '@type': ['EducationalApplication', 'VideoGame'], name: NAME, alternateName: ORG, url: u + '/gioi-thieu', image: u + '/site/img/og.jpg',
      description: 'Thế giới mở 3D cho học sinh tiểu học: học Toán, Tiếng Việt, Tiếng Anh, Khoa học, Sử–Địa qua khám phá, phép thuật và câu đố.', applicationCategory: 'EducationalApplication', genre: ['Giáo dục', 'Thế giới mở'],
      operatingSystem: 'Web, Android, iOS', inLanguage: 'vi', isAccessibleForFree: true, educationalLevel: 'Tiểu học', audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
      offers: { '@type': 'Offer', price: 0, priceCurrency: 'VND' }, publisher: { '@type': 'Organization', name: ORG, url: u + '/gioi-thieu', logo: u + '/icons/icon-512.png' } }];
    const body = `<div class="hero"><div class="w"><div><h1>Học mà chơi trên <em>Đảo Rubik</em> 3D</h1>
<p class="lead">Thế giới mở cho học sinh tiểu học: cưỡi rồng, bay chổi, lặn biển, xây nhà — mỗi chuyến phiêu lưu là một câu đố Toán, Tiếng Việt, Tiếng Anh, Khoa học. Chạy ngay trên trình duyệt điện thoại.</p>
<div class="cta"><a class="b gold" href="/">▶ Chơi ngay — miễn phí</a><a class="b ghost" href="/parent">Dành cho phụ huynh</a><a class="b ghost" href="#nha-truong">Dành cho nhà trường</a></div></div>
<div class="shot"><picture><source media="(max-width:800px)" srcset="/site/img/p2-castle-610.webp"><img src="/site/img/p2-castle.webp" width="987" height="555" alt="Học viện Pha Lê trên Đảo Rubik, học sinh cưỡi thú bay" fetchpriority="high"></picture></div></div></div>
<div class="w"><div class="facts"><div><b>5 môn</b>lồng trong lối chơi</div><div><b>0</b>quảng cáo trong game</div><div><b>0</b>chat tự do</div><div><b>📱</b>chạy mượt trên điện thoại</div></div></div>
<section id="loi-ich"><div class="w"><h2>Lợi ích học tập</h2><p class="sub">Nội dung bám chương trình tiểu học, chia nhỏ thành thử thách 1–3 phút. Trả lời đúng mới mở được đường đi, rương báu, phép mới.</p>
<div class="grid">${FEAT.map(([i, h, p]) => `<div class="card"><span class="ic" aria-hidden="true">${i}</span><h3>${h}</h3><p>${p}</p></div>`).join('')}</div></div></section>
<section style="padding-top:0"><div class="w"><h2>Một vòng quanh đảo</h2><p class="sub">Ảnh chụp trực tiếp trong game.</p>
<div class="gal"><figure><img src="/site/img/mg-rubik-landscape.webp" width="987" height="456" loading="lazy" alt="Phòng Rubik 3D: học ký hiệu xoay"><figcaption>Phòng Rubik 3D</figcaption></figure>
<figure><img src="/site/img/p1-luyen-bay-vong.webp" width="987" height="555" loading="lazy" alt="Luyện bay chổi qua vòng"><figcaption>Giải bay chổi</figcaption></figure>
<figure><img src="/site/img/2-vung-sau-sua.webp" width="987" height="555" loading="lazy" alt="Lặn biển khám phá san hô"><figcaption>Lặn biển · Khoa học</figcaption></figure></div>
<div class="gal" style="margin-top:13px;grid-template-columns:1fr 1fr 1fr"><figure style="grid-row:auto;aspect-ratio:16/9"><img src="/site/img/c1-tiem-dua-chon-dua.webp" width="987" height="555" loading="lazy" alt="Tiệm đũa phép"><figcaption>Tiệm Đũa Pha Lê</figcaption></figure>
<figure><img src="/site/img/t4-ban-dem.webp" width="987" height="555" loading="lazy" alt="Câu đố của Cụ Đa ban đêm"><figcaption>Câu đố Cụ Đa</figcaption></figure>
<figure><img src="/site/img/gate.webp" width="987" height="555" loading="lazy" alt="Cổng Trường Rubik"><figcaption>Cổng Trường Rubik</figcaption></figure></div></div></section>
<section class="dark"><div class="w"><h2>An toàn cho trẻ, yên tâm cho bố mẹ</h2><p class="sub">Thiết kế theo nguyên tắc “không làm phiền trẻ”.</p>
<div class="grid">${SAFE.map(([i, h, p]) => `<div class="card"><span class="ic" aria-hidden="true">${i}</span><h3>${h}</h3><p>${p}</p></div>`).join('')}</div></div></section>
<section id="phu-huynh"><div class="w split r"><div><h2>Dành cho phụ huynh</h2><ul class="ticks"><li><b>Báo cáo học tập hằng tuần</b> theo 5 môn, gửi qua email tối Chủ nhật</li><li>Biết con <b>mạnh môn nào, cần luyện chủ đề nào</b></li><li>Đặt <b>giới hạn giờ chơi</b>, <b>giao nhiệm vụ học</b> cho con</li><li>Dùng thử miễn phí 7 ngày, không cần thẻ, không tự gia hạn</li></ul>
<div class="cta"><a class="b" href="/parent">Mở trang Phụ huynh</a><a class="b ghost" href="/blog">Đọc Góc phụ huynh</a></div></div>
<div class="shot"><img src="/site/img/c1-tiem-dua-chon-dua.webp" width="987" height="555" loading="lazy" alt="Học sinh chọn đũa phép trong game"></div></div></section>
<section id="nha-truong" style="background:#ece3d2"><div class="w split"><div class="shot"><img src="/site/img/gate.webp" width="987" height="555" loading="lazy" alt="Cổng Trường Rubik trong game"></div><div><h2>Dành cho nhà trường</h2>
<ul class="ticks"><li>Giáo viên <b>tạo lớp bằng mã 6 ký tự</b>, học sinh vào lớp không cần email</li><li><b>Giao nhiệm vụ theo môn</b>, xem tiến độ và tỉ lệ đúng của từng em</li><li><b>Giấy phép trường</b>: mở toàn bộ nội dung cho cả lớp, cả khối</li><li>Chạy trên máy tính phòng tin học lẫn điện thoại/tablet</li></ul>
<div class="cta"><a class="b" href="/teacher">Trang Giáo viên</a>${env.CONTACT_EMAIL ? `<a class="b ghost" href="mailto:${esc(env.CONTACT_EMAIL)}?subject=Gi%E1%BA%A5y%20ph%C3%A9p%20tr%C6%B0%E1%BB%9Dng">Liên hệ giấy phép trường</a>` : ''}</div></div></div></section>
${testimonials() ? `<section><div class="w"><h2>Cảm nhận</h2><div class="grid">${testimonials()}</div></div></section>` : ''}
${posts().length ? `<section style="padding-top:0"><div class="w"><h2>Góc phụ huynh</h2><p class="sub">Mẹo học tập và cách chơi cùng con.</p><div class="grid posts">${postCards(posts().slice(0, 3))}</div><p style="margin-top:21px"><a href="/blog">Xem tất cả bài viết →</a></p></div></section>` : ''}
<section style="padding-top:0"><div class="w"><h2>Câu hỏi thường gặp</h2>
<details><summary>Đảo Rubik có miễn phí không?</summary><p>Có. Phần lớn đảo chơi miễn phí. Gói Phụ huynh (tuỳ chọn) mở thêm khu vực và báo cáo học tập chi tiết; chỉ người lớn mua được, ở trang Phụ huynh.</p></details>
<details><summary>Cần cài đặt gì không?</summary><p>Không. Mở trình duyệt trên điện thoại, máy tính bảng hoặc máy tính là chơi được. Có thể “Thêm vào màn hình chính” như ứng dụng.</p></details>
<details><summary>Con có thấy quảng cáo không?</summary><p>Không. Trong game tuyệt đối không có quảng cáo. Quảng cáo (nếu có) chỉ xuất hiện ở trang dành cho người lớn như trang này và Góc phụ huynh, không cá nhân hoá, và chỉ sau khi bạn đồng ý.</p></details>
<details><summary>Dữ liệu của con được bảo vệ thế nào?</summary><p>Không cần email của trẻ. Dữ liệu học tập chỉ dùng để làm báo cáo cho bố mẹ, xử lý theo Nghị định 13/2023/NĐ-CP. Xem <a href="/privacy">Chính sách bảo mật</a>.</p></details></div></section>
<div class="w">${adSlot()}</div>
<section class="dark" style="text-align:center"><div class="w"><h2>Sẵn sàng lên đảo?</h2><p class="sub" style="margin:0 auto 34px">Không cần tài khoản để thử. Bố mẹ có thể chơi cùng con 21 phút đầu tiên.</p><a class="b gold" href="/">▶ Chơi ngay</a></div></section>`;
    send(res, page(req, { title: `${NAME} — Game thế giới mở 3D học mà chơi cho học sinh tiểu học`, desc: 'Đảo Rubik: thế giới mở 3D miễn phí, học Toán, Tiếng Việt, Tiếng Anh, Khoa học qua phiêu lưu. Không quảng cáo trong game, không chat tự do, có báo cáo học tập cho bố mẹ.', p: '/gioi-thieu', body, ads: true, ld }));
  });

  // ---------- Góc phụ huynh (blog) ----------
  app.get(['/blog', '/blog/'], (req, res) => {
    const list = posts();
    const body = `<div class="art" style="max-width:987px"><p class="crumb"><a href="/gioi-thieu">${NAME}</a> › Góc phụ huynh</p><h1>Góc phụ huynh</h1><p class="sub" style="color:var(--mute);font-size:18px;margin:0 0 34px">Mẹo học tập, hướng dẫn chơi cùng con, cách dùng báo cáo học tập.</p>
<div class="grid posts">${postCards(list) || '<p>Chưa có bài viết.</p>'}</div>${adSlot()}</div>`;
    send(res, page(req, { title: `Góc phụ huynh — mẹo học tập & chơi cùng con | ${NAME}`, desc: 'Bài viết cho phụ huynh: mẹo học Toán, Tiếng Việt, hướng dẫn chơi Đảo Rubik cùng con, quản lý giờ chơi hợp lý.', p: '/blog', body, ads: true,
      ld: [{ '@context': 'https://schema.org', '@type': 'Blog', name: `Góc phụ huynh · ${NAME}`, url: base(req) + '/blog', inLanguage: 'vi' }] }));
  });
  app.get('/blog/:slug', (req, res, next) => {
    const p = posts().find(x => x.slug === req.params.slug); if (!p) return next();
    // quảng cáo trong bài: tối đa 2 vị trí — sau đoạn thứ 5 (nếu bài đủ dài) và cuối bài
    let html = p.html; const parts = html.split('</p>');
    if (ADS && parts.length > 8) { parts[4] += '</p>' + adSlot(); html = parts.map((x, i) => (i === 4 || i === parts.length - 1 ? x : x + '</p>')).join(''); }
    const sugg = aff && aff.blogBlock ? aff.blogBlock(p.tags) : '';
    const body = `<article class="art"><p class="crumb"><a href="/gioi-thieu">${NAME}</a> › <a href="/blog">Góc phụ huynh</a></p><div class="meta">${vnDate(p.date)}${p.tags.length ? ' · ' + esc(p.tags.join(', ')) : ''}</div><h1>${esc(p.title)}</h1>
${p.cover ? `<img src="${esc(p.cover)}" width="987" height="555" alt="" fetchpriority="high">` : ''}${html}
${sugg}<div class="card" style="margin-top:34px"><h3>Cho con thử Đảo Rubik</h3><p>Miễn phí, chạy trên trình duyệt điện thoại. Không quảng cáo trong game.</p><p style="margin-top:13px"><a class="b gold sm" href="/">▶ Chơi ngay</a> <a class="b sm" href="/parent">Trang Phụ huynh</a></p></div>${adSlot()}</article>`;
    const u = base(req);
    send(res, page(req, { title: `${p.title} | Góc phụ huynh ${NAME}`, desc: p.description, p: '/blog/' + p.slug, body, ads: true, type: 'article', image: p.cover || '/site/img/og.jpg',
      ld: [{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, datePublished: p.date, dateModified: p.date, inLanguage: 'vi', url: u + '/blog/' + p.slug, image: u + (p.cover || '/site/img/og.jpg'),
        author: { '@type': 'Organization', name: ORG }, publisher: { '@type': 'Organization', name: ORG, logo: { '@type': 'ImageObject', url: u + '/icons/icon-512.png' } }, mainEntityOfPage: u + '/blog/' + p.slug }] }));
  });

  // ---------- SEO ----------
  app.get('/robots.txt', (req, res) => res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /pay/\n\nSitemap: ${base(req)}/sitemap.xml\n`));
  app.get('/sitemap.xml', (req, res) => {
    const u = base(req), today = new Date().toISOString().slice(0, 10);
    const urls = [['/gioi-thieu', today, '1.0'], ['/', today, '0.8'], ['/blog', (posts()[0] || {}).date || today, '0.8'], ...posts().map(p => ['/blog/' + p.slug, p.date || today, '0.6']), ['/parent', today, '0.5'], ['/teacher', today, '0.4'], ['/privacy', today, '0.2'], ['/terms', today, '0.2']];
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([p, d, pr]) => `<url><loc>${esc(u + p)}</loc><lastmod>${d}</lastmod><priority>${pr}</priority></url>`).join('\n')}\n</urlset>\n`);
  });
  // ads.txt: chỉ khi đã bật AdSense (f08c47fec0942fa0 = mã xác thực cố định của Google)
  app.get('/ads.txt', (req, res) => (ADS ? res.type('text/plain').send(`google.com, ${ADS.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`) : res.status(404).type('text/plain').send('')));
  // /parent: chèn 1 khung quảng cáo cuối trang (ẩn với gia đình đã mua gói — xem parent.html)
  const PARENT = path.join(ROOT, 'client', 'parent.html');
  app.get('/parent', (req, res) => {
    let h = fs.readFileSync(PARENT, 'utf8');
    h = h.replace('<!--ADMETA-->', ADS ? `<meta name="rubik-ads" content="${esc(ADS)}">` : '').replace('<!--AD-->', adSlot());
    res.set('Cache-Control', 'no-cache'); res.type('html').send(h);
  });
  app.get('/play', (req, res) => { res.set('Cache-Control', 'no-cache'); res.sendFile(path.join(ROOT, 'client', 'ocean.html')); });   // đường dẫn dễ nhớ vào game (giống "/")
  return { posts, adSlot, ADS };
};
