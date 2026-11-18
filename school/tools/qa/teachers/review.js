// Ảnh duyệt school/REVIEW_v62_teachers.png: chân dung 10 thầy cô, thầy cô đi trong trường, hộp thoại hỏi/đố/kể chuyện, bảng báo cáo — khoanh đỏ đánh số, ghi chú tiếng Việt
const fs = require('fs'), path = require('path'); const {chromium} = require('playwright'); const {openGame, login, owner} = require('../qa-lib');
const OUT = path.join(__dirname, 'out'), SH = path.join(OUT, 'rv'); fs.mkdirSync(SH, {recursive:true});
const b64 = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
(async () => {
  const b = await chromium.launch();
  // 1) điện thoại: thầy cô đi dạo + hộp thoại
  {
    const {ctx, p} = await openGame({w:390, h:844, touch:true}, {browser:b}); await login(p);
    const D = c => p.evaluate(c => window.__dbg(c), c);
    await D("const P=v46Pos(PLAYER); V62K.T.slice(0,5).forEach((t,i)=>{ t.p=[P[0]-120+i*55, P[1]+40+(i%2)*40]; t.route=[]; t.wait=0; v62kPlan(t); })"); await p.waitForTimeout(2500);
    await p.screenshot({path:path.join(SH, 'walk.png')});
    await D("const t=V62K.T[3]; const P=v46Pos(PLAYER); t.p=[P[0]+40,P[1]+10]; v62kOpen(t)"); await p.waitForTimeout(1200); await p.screenshot({path:path.join(SH, 'hi.png')});
    await p.click('#v62kTabs [data-v=ask]'); await p.waitForTimeout(300); await p.screenshot({path:path.join(SH, 'topics.png')});
    await p.click('.v62kTopics button >> nth=2'); await p.waitForTimeout(300); await p.screenshot({path:path.join(SH, 'card.png')});
    await p.click('#v62kTabs [data-v=quiz]'); await p.waitForTimeout(300);
    const c = await D("String(V62K.kb[V62K.cur.id].quiz[V62K.q].c)"); await p.click(`.v62kOpts button >> nth=${c}`); await p.waitForTimeout(300); await p.screenshot({path:path.join(SH, 'quiz.png')});
    await p.click('#v62kTabs [data-v=story]'); await p.waitForTimeout(300); await p.screenshot({path:path.join(SH, 'story.png')});
    await ctx.close();
  }
  // 2) máy tính: bảng báo cáo của thầy cô (nạp báo cáo bản desk)
  {
    const {ctx, p} = await openGame({w:1440, h:900}, {browser:b}); await login(p); await owner(p);
    const rep = fs.readFileSync(path.join(OUT, 'desk', 'report.json'), 'utf8');
    await p.evaluate(r => window.__dbg(`V62K.qa.rep = (${r}).teachers; V62K.qa.at = new Date().toISOString(); V62K.qa.vp = '1440×900'; v62kQaOpen(); document.querySelectorAll('#v62kQa details').forEach((d,i)=>d.open = i===8)`), rep);
    await p.waitForTimeout(800); await p.screenshot({path:path.join(SH, 'panel.png')});
    await ctx.close();
  }
  const T = JSON.parse(fs.readFileSync(path.join(OUT, 'teachers.json'), 'utf8'));
  const C = (n, x, y, r) => `<div class=c style="left:${x}px;top:${y}px;width:${r*2}px;height:${r*2}px"><b>${n}</b></div>`;
  const shot = (f, w, notes, mark) => `<figure><div class=w style="width:${w}px">${'<img src="' + b64(path.join(SH, f)) + '" style="width:' + w + 'px">'}${mark || ''}</div><figcaption>${notes}</figcaption></figure>`;
  const k = 300/390;
  const page = `<!doctype html><meta charset=utf-8><link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800&display=swap" rel=stylesheet><style>
body{margin:0;background:#f6f1e4;font:700 17px/1.45 Nunito,sans-serif;color:#1f2433;width:1900px;padding:24px;box-sizing:border-box}
h1{margin:0 0 8px;font-size:30px}.row{display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start;margin-bottom:18px}
.tc{display:grid;grid-template-columns:repeat(10,1fr);gap:10px;background:#fff;border:3px solid #2f3e5c;border-radius:18px;padding:12px;position:relative}
.tc div{text-align:center;font-size:16px}.tc img{height:132px;image-rendering:pixelated;background:#fdf3d8;border-radius:12px;padding:4px}
figure{margin:0;background:#fff;border:3px solid #2f3e5c;border-radius:18px;padding:8px}.w{position:relative}figure img{display:block;border-radius:10px}
figcaption{max-width:300px;font-size:16px;margin-top:6px}.c{position:absolute;border:4px solid #e11;border-radius:50%;box-sizing:border-box}
.c b{position:absolute;left:-14px;top:-14px;background:#e11;color:#fff;border-radius:50%;width:28px;height:28px;display:grid;place-items:center;font-size:17px}</style>
<h1>v62k · 10 thầy cô giáo sư — ảnh duyệt</h1>
<div class=tc>${C(1, 6, 6, 18)}${T.map(t => `<div><img src="${t.img}" alt=""><br>${t.ic} ${t.n}<br><small>${t.s}</small></div>`).join('')}</div>
<p>① 10 thầy cô nhân vật gốc, vẽ pixel bằng code — mỗi người áo, tóc, kính, râu, đạo cụ riêng (thước, nam châm, bình hoá chất, lá, cuộn sử, quả địa cầu, sách, thẻ từ, laptop, bảng màu).</p>
<div class=row>
${shot('walk.png', 300, '② Thầy cô đi dạo trên đường đảo theo lịch: lớp → sân → nghỉ → phòng giáo viên. Không nhãn chữ; bong bóng 💬 chỉ hiện ở người gần nhất.', C(2, 40, 340*k, 70))}
${shot('hi.png', 300, '③ Chạm thầy cô khi đứng gần → hộp thoại: lời chào + 4 nút (Hỏi · Câu đố · Kể chuyện · Bài học). “Hỏi tự do” (AI) chỉ hiện trên claude.ai.', C(3, 10, 600*k, 140))}
${shot('topics.png', 300, '④ Hỏi thầy/cô: chọn cấp tuổi và 1 trong 6 chủ đề; số thẻ đã xem/tổng.', C(4, 20, 590*k, 120))}
${shot('card.png', 300, '⑤ Thẻ kiến thức: nội dung ngắn, mẹo nhớ 💡, từ khoá tiếng Anh 🔤. Thẻ mới +2 EXP.', C(5, 20, 560*k, 130))}
${shot('quiz.png', 300, '⑥ Câu đố trắc nghiệm có giải thích; đúng lần đầu +5 EXP +$2 (trần mỗi ngày). Đủ 20 thẻ + 15 câu đúng → huy hiệu “Học trò của …”.', C(6, 20, 620*k, 120))}
${shot('story.png', 300, '⑦ Kể chuyện khoa học / lịch sử.', C(7, 20, 560*k, 130))}
</div>
<div class=row>${shot('panel.png', 960, '⑧ Chỉ chủ game: nút 🧑‍🏫 Thầy cô kiểm tra → bảng “Báo cáo của thầy cô”: mỗi thầy cô một mục (lỗi theo mức độ, ảnh, gợi ý, 📍 Đi tới chỗ lỗi), ⬇ Tải JSON, ☁ Lưu vào CSDL game.', C(8, 0, 0, 60))}
<div style="max-width:780px"><h2>Tóm tắt</h2><p>• Kho tàng: ${'693'} thẻ kiến thức + ${'687'} câu đố + 91 chuyện + 113 bài học, 3 cấp tuổi, song ngữ (từ khoá tiếng Anh). Mỗi môn đã được một người soát lại độc lập.</p>
<p>• Tải lười: mỗi thầy cô ~20–25 KB (gzip + base64), chỉ tải khi mở lần đầu — trang chủ không chậm hơn.</p><p>• 60 FPS ở 390×844, 844×390, 1440×900 khi 10 thầy cô cùng trong khung hình.</p>
<p>• Báo cáo lỗi chi tiết: <b>BAO_CAO_v62_THAY_CO.html</b>.</p></div></div>`;
  const pg = await (await b.newContext({viewport:{width:1900, height:1000}})).newPage(); await pg.setContent(page); await pg.waitForTimeout(1500);
  await pg.screenshot({path:path.join(__dirname, '..', '..', '..', 'REVIEW_v62_teachers.png'), fullPage:true}); console.log('ok'); await b.close();
})();
