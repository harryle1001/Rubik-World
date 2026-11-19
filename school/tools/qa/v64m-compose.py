# v64m: ghép ảnh duyệt REVIEW_v64_map.png. python3 tools/qa/v64m-compose.py <thư mục ảnh> <ra.png>
import sys
from PIL import Image, ImageDraw, ImageFont
D, OUT = sys.argv[1], sys.argv[2]
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf'
f_t, f_b, f_s = ImageFont.truetype(F % '-Bold', 34), ImageFont.truetype(F % '-Bold', 22), ImageFont.truetype(F % '', 19)
RED = (229, 57, 53)
def load(n, box=None, size=None):
    im = Image.open(f'{D}/{n}.png').convert('RGB')
    if box: im = im.crop(box)
    if size: im = im.resize(size, Image.NEAREST if box else Image.LANCZOS)
    return im
W = 1640; cv = Image.new('RGB', (W, 2700), (16, 20, 38)); d = ImageDraw.Draw(cv)
d.text((30, 22), 'v64m · Bản đồ Puny World (bản đồ lớn + minimap) — TRƯỚC / SAU', font=f_t, fill=(255, 210, 63))
def put(im, x, y, cap):
    cv.paste(im, (x, y)); d.rectangle([x - 2, y - 2, x + im.width + 1, y + im.height + 1], outline=(70, 80, 110), width=2); d.text((x, y + im.height + 6), cap, font=f_b, fill=(255, 255, 255))
def ring(x, y, r, n):
    d.ellipse([x - r, y - r, x + r, y + r], outline=RED, width=5); d.ellipse([x + r*.7 - 17, y - r*.7 - 17, x + r*.7 + 17, y - r*.7 + 17], fill=RED); d.text((x + r*.7, y - r*.7), str(n), font=f_b, fill='white', anchor='mm')
sw, sh = 390, 844; y0 = 80
cols = [('before_far', 'TRƯỚC · xa'), ('after_far', 'SAU · xa'), ('before_near', 'TRƯỚC · gần'), ('after_near', 'SAU · gần')]
for i, (n, c) in enumerate(cols): put(load(n), 30 + i*400, y0, c)
ring(30 + 400 + 200, y0 + 430, 150, 1); ring(30 + 400 + 300, y0 + 560, 60, 2); ring(30 + 1200 + 190, y0 + 300, 120, 3); ring(30 + 400 + 70, y0 + 640, 60, 4)
y1 = y0 + sh + 50
put(load('before_main'), 30, y1, 'TRƯỚC · đất liền'); put(load('after_main'), 430, y1, 'SAU · đất liền'); put(load('winter_far'), 830, y1, 'SAU · mùa đông (xa)'); put(load('winter_near'), 1230, y1, 'SAU · mùa đông (gần)')
ring(430 + 200, y1 + 300, 150, 5); ring(830 + 200, y1 + 420, 160, 6)
y2 = y1 + sh + 50; m = 220
for i, (n, c) in enumerate([('before_mini', 'Minimap TRƯỚC'), ('after_mini', 'Minimap SAU'), ('winter_mini', 'Minimap mùa đông')]):
    put(load(n, (295, 0, 390, 95), (m, m)), 30 + i*(m + 30), y2, c)
ring(30 + (m + 30) + m//2, y2 + m//2, 40, 7)
notes = ['① Nền vẽ lại bằng ô Puny World: biển 3 tầng (nông → xanh → sâu) có sóng, bờ cát, cỏ, rừng thông theo cụm, đảo nhỏ ngoài khơi.',
         '② Đường đất nối các khu (vòng, trục, lối vào); cầu gỗ Puny qua sông/eo biển.',
         '③ Mỗi khu có biểu tượng ô Puny: lâu đài = cổng trường, nhà cam = lớp học, nhà xanh ngọc = học viện/thư viện, nhà đỏ = thể thao, quầy = chợ.',
         '④ Nhãn chữ Nunito 16px, tự dời (dưới/trên/phải/trái) để không chồng nhau, né thanh trên + nút "Vị trí của tôi"; không còn nhãn "undefined".',
         '⑤ Đất liền: sông Bạc, ruộng lúa, đồi đá, làng, lều cắm trại lấy đúng vị trí thật của thế giới.',
         '⑥ Mùa đông (v49): cỏ, cây, đồi tô trắng; nhà và nhãn giữ màu. Đổi mùa/sắp xếp khu (v48m) → tự dựng lại.',
         '⑦ Minimap cùng phong cách; mũi tên vàng viền trắng xoay theo hướng đi thật.',
         'FPS (Playwright): 390×844, 844×390, 1440×900: bản đồ lớn 60 · đi bộ + minimap 60. CPU chậm ×4 (390×844): bản đồ 60 (cũ 55), đi bộ 30 (cũ 24).',
         'Dựng ảnh nền ~0,45 s nhưng chia nhỏ 6 ms/khung (không khựng). Tìm kiếm, thẻ địa điểm, chỉ đường, Vị trí của tôi, chấm online, nút Sắp xếp: vẫn chạy. 0 lỗi console.']
nx = 30 + 3*(m + 30) + 10; ny = y2
for t in notes:
    words, line = t.split(' '), ''
    for w in words:
        if d.textlength(line + w + ' ', font=f_s) > W - nx - 30: d.text((nx, ny), line, font=f_s, fill=(235, 238, 245)); ny += 26; line = ''
        line += w + ' '
    d.text((nx, ny), line, font=f_s, fill=(235, 238, 245)); ny += 34
cv = cv.crop((0, 0, W, max(ny, y2 + m + 50) + 20)); cv.save(OUT, optimize=True); print(cv.size)
