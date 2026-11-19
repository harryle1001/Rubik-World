# v69q: dựng school/BAO_CAO_v69_LOI.html (ảnh nhúng base64) + school/REVIEW_v69_qa.png. Chạy: python3 tools/qa/v69q/report.py (từ school/)
import os, base64, json, html
from PIL import Image, ImageDraw, ImageFont
H = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(H, '..', '..', '..')); IMG = os.path.join(H, 'img')
D = json.load(open(os.path.join(H, 'data.json'), encoding='utf-8'))
def b64(k):
    p = os.path.join(IMG, k)
    return 'data:image/jpeg;base64,' + base64.b64encode(open(p, 'rb').read()).decode() if os.path.exists(p) else ''
SEV = {'nang': ('🔴 Nặng', '#d64045'), 'vua': ('🟠 Vừa', '#e8871e'), 'nhe': ('🔵 Nhẹ', '#3d7bff')}
ST = {'fixed': ('✅ Đã sửa', '#1f8a50'), 'owner': ('🧑‍⚖️ Cần chủ game quyết', '#8a5a00'), 'note': ('📝 Ghi nhận', '#555')}
cnt = {k: sum(1 for b in D['bugs'] if b['sev'] == k) for k in SEV}; fx = {k: sum(1 for b in D['bugs'] if b['sev'] == k and b['st'] == 'fixed') for k in SEV}
cards = []
for b in D['bugs']:
    s, c = SEV[b['sev']]; t, tc = ST[b['st']]
    imgs = ''.join(f'<figure><img src="{b64(i)}" alt=""><figcaption>{html.escape(cap)}</figcaption></figure>' for i, cap in b.get('img', []) if b64(i))
    cards.append(f'''<article class="bug" style="--c:{c}"><header><span class="id">{b['id']}</span><span class="sev">{s}</span><span class="st" style="background:{tc}">{t}</span></header>
<h3>{html.escape(b['t'])}</h3><dl><dt>Chỗ xảy ra</dt><dd>{html.escape(b['where'])}</dd><dt>Chuyện gì</dt><dd>{html.escape(b['what'])}</dd><dt>Đã làm</dt><dd>{html.escape(b['fix'])}</dd></dl><div class="imgs">{imgs}</div></article>''')
ask = ''.join(f'<li><b>{html.escape(q["t"])}</b> — {html.escape(q["d"])}</li>' for q in D['ask'])
rows = ''.join(f'<tr><td>{html.escape(r[0])}</td><td>{html.escape(r[1])}</td><td>{html.escape(r[2])}</td></tr>' for r in D['checks'])
fps = ''.join(f'<tr><td>{html.escape(r[0])}</td><td>{r[1]}</td><td>{r[2]}</td></tr>' for r in D['fps'])
page = f'''<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Báo cáo lỗi v69</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;800;900&display=swap" rel="stylesheet"><style>
:root{{--bg:#fbf7ef;--ink:#2b1d14;--card:#fff;--line:#eadfca;--mut:#6d5a48}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font:600 17px/1.62 Nunito,sans-serif}}
main{{max-width:1000px;margin:0 auto;padding:24px 16px 60px}}h1{{font-size:34px;line-height:1.2;margin:0 0 6px}}h2{{font-size:24px;margin:34px 0 10px}}
.sub{{color:var(--mut);margin:0 0 18px}}.kpi{{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}}
.kpi div{{background:var(--card);border:2px solid var(--line);border-radius:16px;padding:12px 16px}}.kpi b{{display:block;font-size:30px;font-weight:900}}
.bug{{background:var(--card);border:2px solid var(--line);border-left:8px solid var(--c);border-radius:16px;padding:14px 18px;margin:16px 0}}
.bug header{{display:flex;gap:8px;flex-wrap:wrap;align-items:center}}.id{{font-weight:900;background:var(--ink);color:#ffd23f;border-radius:8px;padding:0 8px}}
.sev{{font-weight:900;color:var(--c)}}.st{{color:#fff;border-radius:20px;padding:0 12px;font-weight:800}}.bug h3{{margin:8px 0;font-size:20px}}
dl{{display:grid;grid-template-columns:120px 1fr;gap:4px 12px;margin:0}}dt{{font-weight:900;color:var(--mut)}}dd{{margin:0}}
.imgs{{display:flex;gap:12px;flex-wrap:wrap;margin-top:10px}}figure{{margin:0;flex:1 1 260px;max-width:100%}}figure img{{width:100%;border-radius:10px;border:2px solid var(--line)}}figcaption{{font-size:16px;color:var(--mut)}}
table{{width:100%;border-collapse:collapse;background:var(--card);border-radius:12px;overflow:hidden}}td,th{{border-bottom:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}}
th{{background:#f3e9d6}}ul{{padding-left:22px}}li{{margin:6px 0}}.tw{{overflow-x:auto}}
@media(max-width:560px){{dl{{grid-template-columns:1fr}}h1{{font-size:28px}}}}</style></head><body><main>
<h1>🛠 Báo cáo lỗi v69 · Trường Rubik của Hà Quân (2D)</h1>
<p class="sub">{html.escape(D['intro'])}</p>
<div class="kpi"><div>🔴 Nặng<b>{cnt['nang']}</b>đã sửa {fx['nang']}</div><div>🟠 Vừa<b>{cnt['vua']}</b>đã sửa {fx['vua']}</div><div>🔵 Nhẹ<b>{cnt['nhe']}</b>đã sửa {fx['nhe']}</div><div>🧑‍⚖️ Cần chủ game quyết<b>{len(D['ask'])}</b>việc</div></div>
<h2>🧑‍⚖️ Việc cần chủ game quyết</h2><ul>{ask}</ul>
<h2>🐞 Danh sách lỗi</h2>{''.join(cards)}
<h2>📊 FPS (Robo đi hết 267 bước, sau khi sửa)</h2><div class="tw"><table><tr><th>Cỡ màn hình</th><th>FPS trung bình</th><th>Ghi chú</th></tr>{fps}</table></div>
<h2>✔️ Đã kiểm tra và không thấy lỗi</h2><div class="tw"><table><tr><th>Phần</th><th>Đã thử</th><th>Kết quả</th></tr>{rows}</table></div>
<p class="sub" style="margin-top:24px">Mã sửa: <code>js/ext/v69q-fix.js</code> (bọc hàm cũ, không đổi thiết kế). Công cụ kiểm tra: <code>tools/qa/v69q-lib.js</code>, <code>tools/qa/v69q/</code>.</p>
</main></body></html>'''
open(os.path.join(ROOT, 'BAO_CAO_v69_LOI.html'), 'w', encoding='utf-8').write(page); print('html', len(page)//1024, 'KB')
# ảnh tổng hợp
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22); f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 17)
except Exception: F = f2 = ImageFont.load_default()
tiles = [(b, i) for b in D['bugs'] for i, _ in b.get('img', [])[:1] if os.path.exists(os.path.join(IMG, i))]
W, TW, TH = 3, 520, 380; S = Image.new('RGB', (W*TW + 20, 80 + TH*((len(tiles) + W - 1)//W)), (251, 247, 239)); d = ImageDraw.Draw(S)
d.text((16, 22), f"v69 QA · Nặng {cnt['nang']} (sửa {fx['nang']}) · Vừa {cnt['vua']} (sửa {fx['vua']}) · Nhẹ {cnt['nhe']} (sửa {fx['nhe']}) · {len(D['ask'])} việc chủ game quyết", fill=(43, 29, 20), font=F)
for k, (b, i) in enumerate(tiles):
    im = Image.open(os.path.join(IMG, i)); im.thumbnail((TW - 20, TH - 60)); x, y = 10 + (k % W)*TW, 70 + (k//W)*TH
    S.paste(im, (x, y + 44)); col = {'nang': (214, 64, 69), 'vua': (232, 135, 30), 'nhe': (61, 123, 255)}[b['sev']]
    d.rectangle([x, y, x + TW - 20, y + 38], fill=col); d.text((x + 8, y + 9), (b['id'] + ' · ' + ('ĐÃ SỬA' if b['st'] == 'fixed' else 'CHỦ GAME QUYẾT') + ' · ' + ''.join(ch for ch in b['t'] if ord(ch) < 0x2190))[:52], fill='white', font=f2)
S.save(os.path.join(ROOT, 'REVIEW_v69_qa.png')); print('png', S.size)
