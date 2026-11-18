#!/usr/bin/env python3
"""Dựng school/BAO_CAO_v62_THAY_CO.html từ tools/qa/teachers/out/{phone,land,desk}/report.json (ảnh nhúng sẵn).
Chạy (từ school/): python3 tools/qa/teachers/build_report.py"""
import json, os, re, base64, io, html, subprocess
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
OUT = os.path.join(HERE, 'out'); VPN = {'phone': '📱 390×844', 'land': '📱↔ 844×390', 'desk': '🖥 1440×900'}
SEV = {'high': ('🔴', 'Nghiêm trọng', 0), 'mid': ('🟠', 'Vừa', 1), 'low': ('🔵', 'Nhẹ', 2)}
T = json.load(open(os.path.join(OUT, 'teachers.json')))
R = {k: json.load(open(os.path.join(OUT, k, 'report.json'))) for k in VPN if os.path.exists(os.path.join(OUT, k, 'report.json'))}
E = lambda s: html.escape(str(s or ''))

def img64(path, w=360):
    im = Image.open(path).convert('RGB'); im.thumbnail((w, w*2)); b = io.BytesIO(); im.save(b, 'JPEG', quality=62)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()

GREP = {}
def guess(text):
    """file:dòng nghi ngờ: tìm #id hoặc hàm nhắc trong mô tả lỗi."""
    ids = re.findall(r'#([A-Za-z][\w-]{2,})', text or '')
    for i in ids[:3]:
        if i in GREP: return GREP[i]
        try:
            o = subprocess.run(['grep', '-rn', '--include=*.js', '--include=*.css', '--include=index.html', '-m1', '-e', "id = '" + i + "'", '-e', 'id="' + i + '"', '-e', '#' + i + '{', '-e', '#' + i + ' ', '.'],
                               cwd=ROOT, capture_output=True, text=True).stdout.splitlines()
            o = [l for l in o if '/v54q' not in l and '/v62k' not in l and '/tools/' not in l]
            GREP[i] = ':'.join(o[0].split(':')[:2]).lstrip('./') if o else ''
        except Exception: GREP[i] = ''
        if GREP[i]: return GREP[i]
    return ''

# gộp lỗi theo thầy cô, cùng tiêu đề (bỏ số trong ngoặc) qua 3 cỡ màn hình
M = {}
for vk, rep in R.items():
    for tid, tr in rep['teachers'].items():
        for it in tr['issues']:
            k = re.sub(r'\(\d+[^)]*\)', '', it['title']).strip()
            m = M.setdefault(tid, {}).setdefault(k, {'it': it, 'vps': [], 'sev': it['sev'], 'n': 0, 'img': ''})
            m['vps'].append(vk); m['n'] += it.get('n', 1)
            if SEV[it['sev']][2] < SEV[m['sev']][2]: m['sev'] = it['sev']
            p = os.path.join(OUT, vk, f"{tid}-{it['id']}.jpg")
            if not m['img'] and os.path.exists(p): m['img'] = img64(p)
            if not m['img'] and it.get('shot'): m['img'] = it['shot']

tot = {'high': 0, 'mid': 0, 'low': 0}
for tid in M:
    for m in M[tid].values(): tot[m['sev']] += 1
ALL = sum(tot.values())

css = """
*{box-sizing:border-box}body{margin:0;background:#f6f1e4;color:#1f2433;font:700 17px/1.55 Nunito,system-ui,sans-serif}
main{max-width:860px;margin:0 auto;padding:16px}h1{font-size:26px;margin:8px 0}h2{font-size:21px;margin:0}
.sum{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0}.sum div{border-radius:14px;padding:10px;text-align:center;font-size:18px}
.h{background:#ffd9dc}.m{background:#ffeab0}.l{background:#d6ebff}
.note{background:#fff;border-radius:14px;padding:10px 14px;border:2px solid #e3dac2}
section.t{background:#fff;border-radius:18px;margin:18px 0;padding:12px 14px;border:3px solid #2f3e5c}
.th{display:flex;gap:12px;align-items:center}.th img{width:58px;height:98px;image-rendering:pixelated;background:#fdf3d8;border-radius:12px}
.th small{display:block;font-size:16px;color:#4a5368}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.chips span{border-radius:10px;padding:2px 10px;font-size:16px}
details{border-radius:12px;margin:8px 0;padding:8px 10px}details summary{cursor:pointer;font-size:17px}
details p{margin:6px 0;font-size:16px;word-break:break-word}details img{width:100%;max-width:420px;border-radius:10px;display:block;margin-top:6px}
code{background:#eef1f7;border-radius:6px;padding:0 4px;font-size:16px}
table{border-collapse:collapse;width:100%;font-size:16px}td,th{border-bottom:1px solid #e3dac2;padding:6px;text-align:left}
"""
H = [f"<!doctype html><html lang='vi'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
     f"<title>Báo cáo thầy cô kiểm tra v62</title><link href='https://fonts.googleapis.com/css2?family=Nunito:wght@700;800&display=swap' rel='stylesheet'><style>{css}</style></head><body><main>",
     "<h1>🧑‍🏫 Báo cáo của 10 thầy cô · v62</h1>",
     f"<p class='note'>10 thầy cô giáo sư đã chơi thử từng mảng game ở 3 cỡ màn hình ({', '.join(VPN[k] for k in R)}), dùng bộ máy Robo Thám Tử v54q. "
     f"Tổng <b>{ALL} lỗi</b> (đã gộp lỗi trùng giữa các cỡ màn hình). Phiên này <b>chỉ báo cáo, không sửa</b> — phiên v62f sửa lỗi. Lưu ý: FPS của Rubik 3D đo trong Chromium headless (WebGL chạy phần mềm) nên thấp hơn máy thật; lỗi “chữ < 16px” trên máy tính được hạ mức Nhẹ.</p>",
     f"<div class='sum'><div class='h'>🔴 Nghiêm trọng<br><b>{tot['high']}</b></div><div class='m'>🟠 Vừa<br><b>{tot['mid']}</b></div><div class='l'>🔵 Nhẹ<br><b>{tot['low']}</b></div></div>",
     "<table><tr><th>Thầy cô</th><th>Mảng game</th><th>🔴</th><th>🟠</th><th>🔵</th><th>FPS TB</th></tr>"]
for t in T:
    c = {'high': 0, 'mid': 0, 'low': 0}
    for m in M.get(t['id'], {}).values(): c[m['sev']] += 1
    fps = [str(R[k]['teachers'][t['id']]['fps']['avg']) for k in R if t['id'] in R[k]['teachers']]
    H.append(f"<tr><td>{E(t['ic'])} {E(t['n'])}</td><td>{E(t['mission'])}</td><td>{c['high']}</td><td>{c['mid']}</td><td>{c['low']}</td><td>{'/'.join(fps)}</td></tr>")
H.append('</table>')
for t in T:
    L = sorted(M.get(t['id'], {}).items(), key=lambda kv: (SEV[kv[1]['sev']][2], kv[0]))
    tr = next((R[k]['teachers'][t['id']] for k in R if t['id'] in R[k]['teachers']), None)
    H.append(f"<section class='t'><div class='th'><img src='{t['img']}' alt='Chân dung {E(t['n'])}'><div><h2>{E(t['ic'])} {E(t['n'])}</h2><small>{E(t['s'])} · nhiệm vụ: {E(t['mission'])}</small>"
             f"{'<small>Đã thử ' + str(len(tr['steps'])) + ' chỗ: ' + E(', '.join(tr['steps'][:30])) + '</small>' if tr else ''}</div></div>")
    if tr and tr.get('tips'): H.append(f"<p>💡 Gợi ý: {E(' '.join(tr['tips']))}</p>")
    if not L: H.append('<p>✅ Không thấy lỗi trong mảng này.</p>')
    for k, m in L:
        it = m['it']; ic, nm, _ = SEV[m['sev']]; cls = m['sev'][0] if m['sev'] != 'mid' else 'm'
        f = it.get('file') or guess((it.get('desc') or '') + ' ' + it['title'])
        H.append(f"<details class='{ {'high':'h','mid':'m','low':'l'}[m['sev']] }'><summary>{ic} <b>{E(nm)}</b> · {E(it['title'])} <span>({', '.join(VPN[v] for v in m['vps'])}{' · ×' + str(m['n']) if m['n'] > 1 else ''})</span></summary>"
                 f"{'<p>📝 ' + E(it['desc'])[:900] + '</p>' if it.get('desc') else ''}<p>🔁 Tái hiện: {E(it.get('repro'))}</p>"
                 f"{'<p>📄 File nghi ngờ: <code>' + E(f) + '</code></p>' if f else ''}"
                 f"{'<p>📍 Vị trí: ' + E(json.dumps(it['where'])) + '</p>' if it.get('where') else ''}"
                 f"{'<img src=' + chr(39) + m['img'] + chr(39) + ' alt=' + chr(39) + 'Ảnh vị trí lỗi' + chr(39) + ' loading=lazy>' if m['img'] else ''}</details>")
    H.append('</section>')
H.append(f"<p class='note'>Dựng tự động bởi <code>tools/qa/teachers/build_report.py</code>. Chạy lại: <code>node tools/qa/teachers/run.js all</code> rồi build_report.py. Trong game: nút 🧑‍🏫 Thầy cô kiểm tra (chỉ chủ game).</p></main></body></html>")
open(os.path.join(ROOT, 'BAO_CAO_v62_THAY_CO.html'), 'w', encoding='utf-8').write('\n'.join(H))
print('Tổng', ALL, tot, 'kích thước', round(os.path.getsize(os.path.join(ROOT, 'BAO_CAO_v62_THAY_CO.html'))/1024), 'KB')
