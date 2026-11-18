#!/usr/bin/env python3
"""v63f: dựng school/BAO_CAO_v63_SUA_LOI.html — so TRƯỚC/SAU cho từng lỗi trong báo cáo v62 của 10 thầy cô.
Cần: <BEFORE>/{phone,land,desk}/report.json (chạy run.js trên bản chưa sửa) và out/{phone,land,desk}/report.json (bản đã sửa).
Chạy (từ school/): python3 tools/qa/teachers/build_report_v63.py <thư mục out TRƯỚC>"""
import json, os, re, sys, html
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
BEF = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'out_before'); AFT = os.path.join(HERE, 'out')
VPN = {'phone': '📱 390×844', 'land': '📱↔ 844×390', 'desk': '🖥 1440×900'}
SEV = {'high': ('🔴', 'Nghiêm trọng', 0), 'mid': ('🟠', 'Vừa', 1), 'low': ('🔵', 'Nhẹ', 2)}
E = lambda s: html.escape(str(s or ''))
load = lambda d: {k: json.load(open(os.path.join(d, k, 'report.json'))) for k in VPN if os.path.exists(os.path.join(d, k, 'report.json'))}
RB, RA = load(BEF), load(AFT)
norm = lambda t: re.sub(r'\(\d+[^)]*\)', '', t).strip()

def merge(R):  # gộp như build_report.py: theo thầy cô + tiêu đề, qua 3 cỡ màn hình
    M = {}
    for vk, rep in R.items():
        for tid, tr in rep['teachers'].items():
            for it in tr['issues']:
                m = M.setdefault(tid, {}).setdefault(norm(it['title']), {'it': it, 'vps': {}, 'sev': it['sev']})
                m['vps'][vk] = it
                if SEV[it['sev']][2] < SEV[m['sev']][2]: m['sev'] = it['sev']
    return M
MB, MA = merge(RB), merge(RA)

# lý do còn lại / ghi chú cách sửa (khớp theo tiêu đề)
WHY = [
    (r'Chạm-để-đi', 'Đã bỏ dòng V57P.on trong v58t-tap.js (phiên trước); robo kiểm lại: v58tBlocked() = false khi đi bộ ở cổng trường.'),
    (r'Không đóng được .*Rubik 3D', 'Rubik 3D đóng bình thường. Robo nhầm nút mời “Vào …” (v53c, hiện khi đứng gần cửa toà nhà) nằm đúng điểm dò 70% chiều cao màn ngang là cửa sổ chưa đóng. Sửa: robo bỏ qua nút mời này; nút mời ẩn khi đang mở cửa sổ.'),
    (r'FPS thấp ở .*Rubik 3D', 'rubik3d.js chỉ vẽ lại khi khối/camera/cỡ khung đổi (đứng yên không vẽ).'),
    (r'Chữ nhỏ hơn 16px', 'Bật lại v54qFixInit() (bị rơi khỏi dòng init khi merge v54) + v63f thêm chữ 16px cho dòng trạng thái/tiêu đề cửa sổ.'),
    (r'Nút che nhau', 'Thẻ lời dạy (mentor) ẩn khi có cửa sổ/khung mở; máy tính: dời thẻ sang phải cột nút; Trường tin học: ẩn nút ?/🏆/hành động khi bảng bài học phủ màn; v54q dời nút Flycam.'),
    (r'Hai nhãn bản đồ', 'mapPlaces: nhãn khu lớn hơn (Khu rừng thông) dời sang trái, không còn đè “Hồ cá Koi”.'),
]
OWNER = [  # còn lại vì cần chủ game quyết
    (r'Chữ nhỏ hơn 16px trong (#mlog|#mtrack|#quick|thanh HUD)', 'Chờ chủ game: chữ bảng Nhật ký / Nhiệm vụ / thanh nút trên máy tính 12–15px; nâng lên 16px làm các bảng to ra (yêu cầu: máy tính để nguyên).'),
    (r'Chữ nhỏ hơn 16px', 'Chờ chủ game: phần còn lại chỉ ở máy tính (HUD/cột nút/bảng chọn máy bay); nâng 16px làm nút & bảng to ra nên để nguyên theo yêu cầu.'),
    (r'FPS thấp', 'Chromium headless vẽ WebGL bằng phần mềm; cần đo trên máy thật.'),
]
why = lambda L, t: next((w for p, w in L if re.search(p, t)), '')

# danh sách gốc 71 lỗi: đọc thẳng từ BAO_CAO_v62_THAY_CO.html (thứ tự thầy cô = V62K.T)
IDS = ['toan', 'ly', 'hoa', 'sinh', 'su', 'dia', 'van', 'anh', 'tin', 'nghe']
V62 = open(os.path.join(ROOT, 'BAO_CAO_v62_THAY_CO.html'), encoding='utf-8').read()
V62 = re.sub(r"<img[^>]*>", '', V62); names = {}; L62 = []
SEVN = {'Nghiêm trọng': 'high', 'Vừa': 'mid', 'Nhẹ': 'low'}; VPR = {v: k for k, v in VPN.items()}
for i, sec in enumerate(re.findall(r"<section class='t'>(.*?)</section>", V62, re.S)):
    tid = IDS[i]; h = html.unescape(re.search(r"<h2>(.*?)</h2>", sec).group(1)); names[tid] = {'ic': h.split(' ')[0], 'n': h.split(' ', 1)[1]}
    for d in re.findall(r"<summary>(.*?)</summary>", sec, re.S):
        t = html.unescape(re.sub(r"<[^>]+>", '', d)); m = re.match(r"\S+ (\S+(?: trọng)?) · (.*) \((.*)\)$", t)
        sev = SEVN[m.group(1)]; title = norm(m.group(2)); vps = [VPR[v.strip()] for v in m.group(3).split(' · ')[0].split(', ') if v.strip() in VPR]
        L62.append((tid, title, sev, vps))
rows, cnt = [], {'fixed': 0, 'part': 0, 'left': 0}
tot = {'high': 0, 'mid': 0, 'low': 0}
for tid, k, sev, vps in L62:
    tot[sev] += 1; mb = {'sev': sev, 'vps': {v: None for v in vps}, 'it': (MB.get(tid, {}).get(k) or {}).get('it', {})}
    ma = MA.get(tid, {}).get(k)
    if not ma: st = 'fixed'
    else: st = 'part' if set(ma['vps']) < set(vps) or SEV[ma['sev']][2] > SEV[sev][2] else 'left'
    cnt[st] += 1; rows.append((tid, k, mb, ma, st))
K62 = {(r[0], r[1]) for r in L62}
new = [(tid, k, ma) for tid in MA for k, ma in MA[tid].items() if (tid, k) not in K62]

def fps(R, tid, div=False):  # div: bản trước cộng dồn n vòng đếm (n = thứ tự thầy cô) → chia lại để ra FPS thật gần đúng
    n = IDS.index(tid) + 1 if div else 1
    return ' / '.join((str(round(R[k]['teachers'][tid]['fps']['avg']/n)) + ('' if n == 1 else '') ) if tid in R[k]['teachers'] else '–' for k in VPN if k in R)
def cons(R):
    return sum(len([l for l in r.get('consoleLogs', []) if 'GL Driver' not in l['s']]) for r in R.values())

css = """*{box-sizing:border-box}body{margin:0;background:#f6f1e4;color:#1f2433;font:700 17px/1.55 Nunito,system-ui,sans-serif}
main{max-width:980px;margin:0 auto;padding:16px}h1{font-size:26px;margin:8px 0}h2{font-size:21px;margin:22px 0 6px}
.sum{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0}.sum div{border-radius:14px;padding:10px;text-align:center;font-size:18px}
.ok{background:#d7f5dc}.pt{background:#ffeab0}.no{background:#ffd9dc}.note{background:#fff;border-radius:14px;padding:10px 14px;border:2px solid #e3dac2}
.tw{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:16px;background:#fff;border-radius:12px}td,th{border-bottom:1px solid #e3dac2;padding:6px 8px;text-align:left;vertical-align:top}
th{background:#2f3e5c;color:#fff;position:sticky;top:0}td small{display:block;color:#4a5368;font-size:16px}code{background:#eef1f7;border-radius:6px;padding:0 4px;font-size:16px}"""
H = [f"<!doctype html><html lang='vi'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Báo cáo sửa lỗi v63</title>"
     f"<link href='https://fonts.googleapis.com/css2?family=Nunito:wght@700;800&display=swap' rel='stylesheet'><style>{css}</style></head><body><main>",
     "<h1>🛠 Báo cáo sửa lỗi v63 · theo báo cáo của 10 thầy cô (v62)</h1>",
     f"<p class='note'>Chạy lại đúng nhiệm vụ của 10 thầy cô (script v62k) ở {', '.join(VPN[k] for k in RA)} trên bản <b>trước</b> và <b>sau</b> khi sửa. "
     f"Báo cáo v62 có <b>{sum(tot.values())} lỗi</b> (🔴 {tot['high']} · 🟠 {tot['mid']} · 🔵 {tot['low']}). "
     f"Lỗi console (bỏ cảnh báo GL của Chromium headless): trước {cons(RB)}, sau {cons(RA)}.</p>",
     f"<div class='sum'><div class='ok'>✅ Đã sửa<br><b>{cnt['fixed']}</b></div><div class='pt'>🟡 Sửa một phần<br><b>{cnt['part']}</b></div><div class='no'>⏳ Chưa sửa<br><b>{cnt['left']}</b></div></div>",
     "<p class='note'>🧮 <b>FPS TB</b> trong báo cáo v62 cộng dồn (59, 118, 177…) vì mỗi thầy cô khởi thêm một vòng đếm khung hình <code>v54qFrame</code> mà vòng cũ không dừng. "
     "Đã sửa: chỉ giữ một vòng đếm (<code>V54Q.raf</code> trong v54q-core/v54q-ui/v62k-qa) → mỗi thầy cô ra FPS riêng.</p>",
     "<h2>📊 FPS từng thầy cô (📱 / 📱↔ / 🖥)</h2><div class='tw'><table><tr><th>Thầy cô</th><th>Trước (v62, cộng dồn)</th><th>Trước (đo lại, đã chia số vòng đếm)</th><th>Sau</th></tr>"]
old = {}
try:
    s = open(os.path.join(ROOT, 'BAO_CAO_v62_THAY_CO.html'), encoding='utf-8').read()
    for m in re.finditer(r"<tr><td>(.*?)</td><td>.*?</td>(?:<td>\d+</td>){3}<td>([\d/]+)</td></tr>", s): old[html.unescape(m.group(1))] = m.group(2)
except Exception: pass
for tid in names:
    t = names.get(tid, {'ic': '', 'n': tid}); nm = f"{t['ic']} {t['n']}"
    H.append(f"<tr><td>{E(nm)}</td><td>{E(old.get(nm, ''))}</td><td>{fps(RB, tid, True)}</td><td>{fps(RA, tid)}</td></tr>")
H.append('</table></div>')
H.append("<h2>📋 Từng lỗi: Trước → Sau</h2><div class='tw'><table><tr><th>Thầy cô</th><th>Lỗi (v62)</th><th>Trước</th><th>Sau</th><th>Ghi chú</th></tr>")
ST = {'fixed': '✅ Đã sửa', 'part': '🟡 Một phần', 'left': '⏳ Chưa sửa'}
for tid, k, mb, ma, st in sorted(rows, key=lambda r: (SEV[r[2]['sev']][2], IDS.index(r[0]), r[1])):
    t = names.get(tid, {'ic': '', 'n': tid}); ic, nm, _ = SEV[mb['sev']]
    bef = ' '.join(VPN[v].split()[0] + ' ' + VPN[v].split()[1] for v in mb['vps'])
    aft = '—' if not ma else ' '.join(f"{VPN[v].split()[1]} ({SEV[ma['vps'][v]['sev']][0]})" for v in ma['vps'])
    note = why(WHY, k) if st == 'fixed' else (why(WHY, k) + ' ' if st == 'part' else '') + (why(OWNER, k) or 'Chưa sửa.')
    d = (ma or mb)['it'].get('desc', '') if (ma or mb)['it'] else '' if st != 'fixed' else ''
    H.append(f"<tr><td>{E(t['ic'])} {E(t['n'])}</td><td>{ic} {E(nm)} · {E(k)}</td><td>{E(bef)}{'<small>' + ('đo lại: còn' if k in MB.get(tid, {}) else 'đo lại: không tái hiện') + '</small>' if MB else ''}</td><td><b>{ST[st]}</b><small>{E(aft)}</small></td>"
             f"<td>{E(note)}{'<small>Còn: ' + E(d[:240]) + '</small>' if d else ''}</td></tr>")
H.append('</table></div>')
if new:
    H.append("<h2>🆕 Lỗi mới thấy ở lần chạy sau (không có trong v62)</h2><div class='tw'><table><tr><th>Thầy cô</th><th>Lỗi</th><th>Cỡ</th><th>Mô tả</th></tr>")
    for tid, k, ma in new:
        t = names.get(tid, {'ic': '', 'n': tid}); ic, nm, _ = SEV[ma['sev']]
        H.append(f"<tr><td>{E(t['ic'])} {E(t['n'])}</td><td>{ic} {E(nm)} · {E(k)}</td><td>{E(', '.join(VPN[v] for v in ma['vps']))}</td><td>{E(ma['it'].get('desc', '')[:300])}</td></tr>")
    H.append('</table></div>')
H.append("<h2>🧑‍💼 Cần chủ game quyết định (chưa tự đổi thiết kế)</h2><ul>"
         "<li>🖥 Chữ trên máy tính 10–15px ở HUD: bảng Nhật ký (#mlog), Nhiệm vụ (#mtrack), thanh nút trên (#quick: Menu, Cài đặt…), hồ sơ (#prof), nhãn cột nút trái (Lamp/Bike/Plane 10px), nút Flycam, bảng chọn máy bay (#v51pPanel), huy hiệu v53c. "
         "Nâng 16px sẽ làm các bảng/nút to ra → để nguyên theo yêu cầu. Nếu đồng ý, chỉ cần bỏ điều kiện <code>body.touchdev</code> ở các dòng CSS tương ứng trong v54q-fix.js.</li>"
         "<li>🖥 Chữ phụ trong lưới bài học Học viện (#acGrid), bìa sách Thư viện (#libList), phím đàn (#pkeys), chú thích tranh (#gallery) trên máy tính: nâng 16px làm thẻ/bàn phím to ra.</li>"
         "<li>🧊 FPS Rubik 3D đo trong Chromium headless (WebGL phần mềm). Đã giảm vẽ thừa; nên thử thêm trên máy thật.</li></ul>")
H.append(f"<p class='note'>Dựng bởi <code>tools/qa/teachers/build_report_v63.py</code>. Chạy lại: <code>node tools/qa/teachers/run.js all</code> (bản trước: thêm <code>?v63nofix</code> không đủ vì có sửa trong code gốc — dùng bản checkout trước v63) rồi script này.</p></main></body></html>")
open(os.path.join(ROOT, 'BAO_CAO_v63_SUA_LOI.html'), 'w', encoding='utf-8').write('\n'.join(H))
print('v63:', cnt, 'tổng v62', sum(tot.values()), tot, 'mới', len(new))
