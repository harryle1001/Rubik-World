# v74l · nén PNG KHÔNG MẤT CHẤT LƯỢNG (từng điểm ảnh RGBA y hệt bản gốc — có kiểm tra).
# Cách làm: thử bảng màu chính xác (≤256 màu, kèm tRNS) và RGBA nén tối ưu; bỏ chunk thừa (iCCP sRGB chuẩn, tEXt, tIME, pHYs…).
# Giữ nguyên file có gAMA/cHRM hoặc hồ sơ màu iCCP lạ, ảnh 16 bit, hoặc khi bản mới không nhỏ hơn.
# Dùng: python3 tools/build/v74l-png.py <thư-mục>... [--dry]      (cần Pillow)
import sys, os, io, struct, zlib, hashlib
from PIL import Image
SRGB_ICC = {'eeef5cb5'}     # md5[:8] của hồ sơ "sRGB IEC61966-2.1" 3144 byte (trình duyệt coi ảnh không gắn hồ sơ là sRGB → y hệt)
def chunks(b):
    i = 8
    while i < len(b):
        n, = struct.unpack('>I', b[i:i+4]); yield b[i+4:i+8], b[i+8:i+8+n]; i += 12 + n
def safe(b):
    if b[:8] != b'\x89PNG\r\n\x1a\n': return False
    for t, d in chunks(b):
        if t == b'IHDR' and d[8] not in (1, 2, 4, 8): return False
        if t in (b'gAMA', b'cHRM', b'sBIT'): return False
        if t == b'iCCP':
            name = d.split(b'\0')[0]
            if hashlib.md5(zlib.decompress(d[len(name)+2:])).hexdigest()[:8] not in SRGB_ICC: return False
    return True
def best(raw):
    im = Image.open(io.BytesIO(raw)); im.load(); ref = im.convert('RGBA'); px = ref.tobytes(); out = []
    cols = ref.getcolors(256)
    if cols is not None:
        lut = {c: i for i, (_, c) in enumerate(cols)}; pal = Image.new('P', ref.size)
        pal.putdata([lut[p] for p in (ref.get_flattened_data() if hasattr(ref, 'get_flattened_data') else ref.getdata())])
        pal.putpalette([v for _, c in cols for v in c[:3]]); al = bytes(c[3] for _, c in cols)
        b = io.BytesIO(); kw = {'optimize': True}
        if any(a < 255 for a in al): kw['transparency'] = al
        pal.save(b, 'PNG', **kw); out.append(b.getvalue())
    for m in ('RGBA',) if ('A' in im.mode or 'transparency' in im.info) else ('RGB', 'RGBA'):
        b = io.BytesIO(); im.convert(m).save(b, 'PNG', optimize=True); out.append(b.getvalue())
    good = [c for c in out if Image.open(io.BytesIO(c)).convert('RGBA').tobytes() == px]
    return min(good, key=len) if good else raw
dry = '--dry' in sys.argv; t0 = t1 = n = 0
for root in [a for a in sys.argv[1:] if not a.startswith('--')]:
    for d, _, fs in os.walk(root):
        for f in sorted(fs):
            if not f.lower().endswith('.png'): continue
            p = os.path.join(d, f); raw = open(p, 'rb').read(); new = best(raw) if safe(raw) else raw
            t0 += len(raw)
            if len(new) < len(raw):
                t1 += len(new); n += 1
                if not dry: open(p, 'wb').write(new)
            else: t1 += len(raw)
print(f'{n} ảnh nhỏ lại: {t0/1e6:.2f} MB → {t1/1e6:.2f} MB (−{100 - t1*100/max(t0,1):.0f}%)' + (' [thử, chưa ghi]' if dry else ''))
