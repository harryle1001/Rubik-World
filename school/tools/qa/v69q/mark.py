# v69q: vẽ vòng tròn đỏ lên ảnh lỗi. python3 mark.py  (ảnh gốc ở /tmp/claude-0/qa → school/tools/qa/v69q/img)
import os
from PIL import Image, ImageDraw
SRC = '/tmp/claude-0/qa'; OUT = os.path.join(os.path.dirname(__file__), 'img'); os.makedirs(OUT, exist_ok=True)
J = [('L1', 'l1-before.png', [(330, 45, 885, 182)]),
     ('L2', 'z-land-farm.png', [(280, 165, 570, 250)]),
     ('L3', 'luong-phone-3slip.png', [(322, 222, 388, 495)]),
     ('L5', 'tower-night.png', [(192, 50, 392, 165)]),
     ('L4', 'hall-phone.png', [(92, 688, 298, 755)]),
     ('L6', 'mall-phone-1rod.png', [(40, 120, 105, 160)]),
     ('L7', 'start-phone.png', [(236, 740, 272, 776)]),
     ('L8', 'mall-land-5boat.png', [(186, 24, 394, 98)]),
     ('N1', 'start-desk.png', [(960, 92, 1020, 128)]),
     ('N2', 'gen-phone-1menu.png', [(40, 230, 110, 254), (155, 230, 255, 254)]),
     ('N3', 'luong-phone-v67lTeachG.png', [(192, 52, 392, 140)])]
for k, f, boxes in J:
    p = os.path.join(SRC, f)
    if not os.path.exists(p): print('thiếu', f); continue
    im = Image.open(p).convert('RGB'); d = ImageDraw.Draw(im)
    for b in boxes:
        if b[2] <= b[0]: continue
        for w in range(4): d.ellipse([b[0] - 8 - w, b[1] - 8 - w, b[2] + 8 + w, b[3] + 8 + w], outline=(230, 20, 20))
    if im.width > 900: im = im.resize((900, round(im.height*900/im.width)))
    im.save(os.path.join(OUT, k + '.jpg'), quality=82); print(k, im.size)
# ảnh SAU khi sửa (không khoanh)
for k, f in [('L1b', 'l1-after.png'), ('L2b', 'after-farm.png'), ('L3b', 'v-phone-slip.png'), ('L5b', 'after-tower.png'), ('L6b', 'after-rod.png'), ('L8b', 'after-boat.png')]:
    p = os.path.join(SRC, f)
    if not os.path.exists(p): print('thiếu', f); continue
    im = Image.open(p).convert('RGB')
    if im.width > 900: im = im.resize((900, round(im.height*900/im.width)))
    im.save(os.path.join(OUT, k + '.jpg'), quality=82); print(k, im.size)
