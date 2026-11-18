#!/usr/bin/env python3
"""Gộp report.json của Robo (out/before/*, out/after/*) + ghi chú sửa (fixes.json) thành school/BAO_CAO_v54_QA.html.
Chạy từ school/: python3 tools/qa/build_report.py"""
import json, os, re, html
from PIL import Image
Q = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(Q, '..', '..'))
VPN = {'phone': '📱 390×844', 'land': '📱↔ 844×390', 'desk': '🖥 1440×900'}
SEV = {'high': ('Nghiêm trọng', 'h'), 'mid': ('Vừa', 'm'), 'low': ('Nhẹ', 'l')}
ORD = {'high': 0, 'mid': 1, 'low': 2}

# ---- map "game:LINE" (dòng trong file nối) -> file:dòng ----
idx = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
blk = idx[idx.index('const FILES = ['):]; blk = blk[:blk.index('];')]
FILES = re.findall(r"'([^']+\.js)'", blk); SPANS = []; ln = 4  # 3 dòng đầu do loader thêm
for f in FILES:
    n = open(os.path.join(ROOT, f), encoding='utf-8').read().count('\n') + 1; SPANS.append((ln, f)); ln += n
def mapline(loc):
    m = re.match(r'game:(\d+)', loc or '')
    if not m: return loc or ''
    L = int(m.group(1)); cur = None
    for s, f in SPANS:
        if s <= L: cur = (s, f)
    return f'{cur[1]}:{L - cur[0] + 1}' if cur else loc
def norm(t): return re.sub(r'\s*\(\d+( chỗ)?\)|\s*\(\d+px[^)]*\)|\s*×\d+|TB \d+, thấp nhất \d+', '', t).strip()

def load(tag):
    out = {}
    for k in ('phone', 'land', 'desk'):
        p = os.path.join(Q, 'out', tag, k, 'report.json')
        if os.path.exists(p): out[k] = json.load(open(p, encoding='utf-8'))
    return out
B, A = load('before'), load('after')
FX = json.load(open(os.path.join(Q, 'fixes.json'), encoding='utf-8')) if os.path.exists(os.path.join(Q, 'fixes.json')) else {}

shot_dir = os.path.join(Q, 'shots'); os.makedirs(shot_dir, exist_ok=True)
def shot(tag, vp, iid):
    src = os.path.join(Q, 'out', tag, vp, f'issue-{iid}.png')
    if not os.path.exists(src): return ''
    dst = os.path.join(shot_dir, f'{tag}-{vp}-{iid}.jpg')
    if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
        im = Image.open(src).convert('RGB'); im.thumbnail((720, 720)); im.save(dst, 'JPEG', quality=72)
    return os.path.relpath(dst, ROOT)

def merge(R, tag):
    M = {}
    for vp, r in R.items():
        for i in r['issues']:
            k = norm(i['title']) + (' · 🖥 máy tính' if vp == 'desk' else ' · 📱 cảm ứng') if i['cat'] in ('chữ', 'che', 'tràn') else norm(i['title'])
            e = M.setdefault(k, {'k': k, 'title': k if i['cat'] in ('chữ', 'che', 'tràn') else i['title'], 'sev': i['sev'], 'cat': i['cat'], 'desc': i['desc'], 'repro': i['repro'], 'file': mapline(i.get('file')), 'vps': [], 'shot': '', 'n': 0, 'where': i.get('where')})
            if ORD[i['sev']] < ORD[e['sev']]: e['sev'] = i['sev']
            e['vps'].append(vp); e['n'] += i.get('n', 1)
            if not e['shot']: e['shot'] = shot(tag, vp, i['id'])
            if not e['file'] and i.get('file'): e['file'] = mapline(i['file'])
            if not e['file'] and i.get('stack'):
                m = re.search(r'rubik-school-game\.js:(\d+)', i['stack'])
                if m: e['file'] = mapline('game:' + m.group(1))
    return M
MB, MA = merge(B, 'before'), merge(A, 'after')
rows = sorted(MB.values(), key=lambda e: (ORD[e['sev']], e['cat'], e['k']))
new_after = [e for k, e in MA.items() if k not in MB]
cnt = {s: sum(1 for e in rows if e['sev'] == s) for s in ORD}
fixed = {s: sum(1 for e in rows if e['sev'] == s and e['k'] not in MA) for s in ORD}
def fx(e):
    a = MA.get(e['k']); txt = e['k'] + ' ' + e['desc'] + ' ' + (a['desc'] if a else '')
    for pat, v in FX.get('notes', {}).items():
        if pat in txt: return v
    return {}
def esc(s): return html.escape(str(s or ''))
def stat(r):
    s = 0
    for v in r.values(): s += len(v['issues'])
    return s
def fps(R):
    return ' · '.join(f"{VPN[k]}: TB {v['fps']['avg']} / thấp nhất {v['fps']['min']}" for k, v in R.items())

cards = []
for e in rows:
    after = MA.get(e['k']); note = fx(e)
    if note.get('notbug'): st, cl = '⚪ Không phải lỗi: ' + note['notbug'], 'own'
    elif after is None: st, cl = ('✅ Đã sửa' if note.get('what') else '✅ Không còn gặp lại'), 'ok'
    else: st, cl = ('⏳ Chưa sửa' + (': ' + note['why'] if note.get('why') else '')), 'no'
    if note.get('owner'): st, cl = '🧑‍⚖️ Chờ chủ game quyết định: ' + note['owner'], 'own'
    fl = note.get('file') or e['file']
    cards.append(f'''<article class="c {SEV[e['sev']][1]}"><header><span class="b {SEV[e['sev']][1]}">{SEV[e['sev']][0]}</span><h3>{esc(e['title'])}</h3></header>
<p class="vp">{' '.join(VPN[v] for v in e['vps'])} · gặp {e['n']} lần</p>
{f'<img loading="lazy" src="{esc(e["shot"])}" alt="Ảnh lúc Robo gặp lỗi">' if e['shot'] else ''}
<details><summary>Mô tả & cách tái hiện</summary><p>📝 {esc(e['desc']) or '—'}</p><p>🔁 {esc(e['repro'])}</p>{f'<p>🔧 Đã sửa: {esc(note["what"])}</p>' if note.get('what') else ''}</details>
<p class="f">📄 {esc(fl) or 'chưa rõ'}</p>
<div class="ba"><div><small>Trước</small><b>❌ Có lỗi</b></div><div class="{cl}"><small>Sau</small><b>{esc(st)}</b></div></div></article>''')
newc = ''.join(f'<li>{SEV[e["sev"]][0]} · {esc(e["title"])} ({" ".join(VPN[v] for v in e["vps"])})</li>' for e in new_after)
owner = ''.join(f'<li>{esc(t)}</li>' for t in FX.get('owner', []))
manual = ''.join(f'<li>{esc(t)}</li>' for t in FX.get('manual', []))
tot = len(rows); tfix = sum(fixed.values())
doc = f'''<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Báo cáo Robo Thám Tử v54</title><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap" rel="stylesheet">
<style>
:root{{--bg:#f6f4ee;--card:#fff;--ink:#1d2433;--mute:#5a6378;--line:#e4e0d4;--h:#d64545;--m:#e09a1a;--l:#3a7bd5;--ok:#1f9d55;--own:#7b4dd6}}
@media (prefers-color-scheme:dark){{:root{{--bg:#11151f;--card:#1a2030;--ink:#eef1f7;--mute:#a9b2c6;--line:#2a3247}}}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font:700 16px/1.6 Nunito,system-ui,sans-serif}}
main{{max-width:1000px;margin:0 auto;padding:16px}}h1{{font-size:clamp(26px,5vw,40px);line-height:1.15;margin:12px 0 4px;font-weight:900}}
.sub{{color:var(--mute);margin:0 0 20px}}h2{{font-size:24px;margin:34px 0 12px;font-weight:900}}
.k{{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}}.k div{{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px}}
.k b{{display:block;font-size:34px;font-weight:900;line-height:1.1}}.k .h b{{color:var(--h)}}.k .m b{{color:var(--m)}}.k .l b{{color:var(--l)}}.k .ok b{{color:var(--ok)}}
.g{{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}}
.c{{background:var(--card);border:1px solid var(--line);border-left:6px solid var(--l);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:6px}}
.c.h{{border-left-color:var(--h)}}.c.m{{border-left-color:var(--m)}}.c header{{display:flex;gap:8px;align-items:flex-start}}.c h3{{font-size:17px;margin:0;line-height:1.35}}
.b{{flex:none;border-radius:8px;padding:0 8px;color:#fff;font-size:16px}}.b.h{{background:var(--h)}}.b.m{{background:var(--m)}}.b.l{{background:var(--l)}}
.vp,.f{{color:var(--mute);margin:0;font-size:16px;word-break:break-word}}.c img{{width:100%;border-radius:10px;border:1px solid var(--line);aspect-ratio:16/10;object-fit:cover}}
details p{{margin:4px 0;word-break:break-word}}summary{{cursor:pointer;color:var(--l)}}
.ba{{display:grid;grid-template-columns:1fr 1.618fr;gap:8px;margin-top:auto}}.ba div{{border-radius:10px;padding:6px 10px;background:rgba(214,69,69,.1)}}.ba small{{display:block;color:var(--mute)}}
.ba .ok{{background:rgba(31,157,85,.14)}}.ba .ok b{{color:var(--ok)}}.ba .no{{background:rgba(224,154,26,.16)}}.ba .own{{background:rgba(123,77,214,.14)}}.ba .own b{{color:var(--own)}}
ul{{padding-left:22px}}li{{margin:6px 0}}.note{{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px 18px}}
</style></head><body><main>
<h1>🤖 Robo Thám Tử · Báo cáo kiểm tra v54</h1>
<p class="sub">Trường Rubik của Hà Quân (bản 2D) · Robo đi khắp đảo ở 3 cỡ màn hình, mở từng khu, cửa, mini game, cửa hàng, phương tiện, đổi giờ và mùa.</p>
<div class="k"><div class="h"><b>{cnt['high']}</b>Nghiêm trọng · sửa {fixed['high']}</div><div class="m"><b>{cnt['mid']}</b>Vừa · sửa {fixed['mid']}</div><div class="l"><b>{cnt['low']}</b>Nhẹ · sửa {fixed['low']}</div><div class="ok"><b>{tfix}/{tot}</b>Đã hết sau khi sửa</div></div>
<h2>📊 Số liệu chạy</h2><div class="note"><p>Trước: {stat(B)} lượt ghi lỗi · {fps(B)}</p><p>Sau: {stat(A)} lượt ghi lỗi · {fps(A)}</p>
<p>Mỗi lượt Robo: {', '.join(f"{VPN[k]} {v['steps']} bước / {v.get('secs', '?')} giây" for k, v in B.items())}.</p></div>
{f'<h2>🧑‍⚖️ Cần chủ game quyết định</h2><div class="note"><ul>{owner}</ul></div>' if owner else ''}
<h2>🐞 Danh sách lỗi (Trước / Sau)</h2><div class="g">{''.join(cards)}</div>
{f'<h2>👀 Phát hiện thêm khi xem ảnh Robo chụp</h2><div class="note"><ul>{manual}</ul></div>' if manual else ''}
{f'<h2>🆕 Lỗi mới chỉ thấy ở lần chạy lại</h2><div class="note"><ul>{newc}</ul></div>' if newc else ''}
<h2>ℹ️ Cách chạy lại</h2><div class="note"><p>Trong game (chỉ chủ game): Menu → 🤖 Robo Thám Tử → ▶ Bắt đầu. Bảng báo cáo có nút 📍 Đi tới chỗ lỗi và ⬇ Tải JSON.</p>
<p>Tự động: trong <code>school/</code> chạy <code>python3 -m http.server 8754</code>, rồi <code>node tools/qa/run.js after</code> và <code>python3 tools/qa/build_report.py</code>.</p></div>
</main></body></html>'''
open(os.path.join(ROOT, 'BAO_CAO_v54_QA.html'), 'w', encoding='utf-8').write(doc)
print('OK', tot, 'lỗi gộp; đã hết', tfix, '; mới', len(new_after))
