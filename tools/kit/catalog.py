# python3 catalog.py kitmeta.json repoRoot  → docs/kit-catalog.md + client/tools/kit-list.json
import json,sys,os
m=json.load(open(sys.argv[1])); R=sys.argv[2]
OLD={'apple':'Táo','barrel':'Thùng gỗ','barrels':'Cụm thùng gỗ','building_a':'Nhà phố/cửa hàng A (Kenney Commercial)','building_b':'Cửa hàng B','building_c':'Cửa hàng C','building_d':'Cửa hàng D','building_e':'Cửa hàng E','building_f':'Cửa hàng F','building_g':'Cửa hàng G','building_h':'Cửa hàng H','bush':'Bụi cây','bush_large':'Bụi lớn','campfire':'Lửa trại','carrot':'Cà rốt','cat':'Mèo (animation)','chest':'Rương','column':'Cột đá','column_broken':'Cột gãy','crab':'Cua (animation)','crate':'Thùng gỗ vuông','deer':'Hươu (animation)','delivery_van':'Xe giao hàng','fence':'Hàng rào','fish':'Cá','flower_red':'Hoa đỏ','fox':'Cáo (animation)','log':'Khúc gỗ','mushroom_red':'Nấm đỏ','obelisk':'Tháp đá','pug':'Chó pug (animation)','pumpkin':'Bí ngô','rock_large':'Đá lớn','rock_small':'Đá nhỏ','rock_tall':'Đá cao','sedan':'Xe con','shiba':'Chó shiba (animation)','stag':'Hươu đực (animation)','stump':'Gốc cây','target':'Bia tập bắn','taxi':'Taxi','tent':'Lều','tractor':'Máy cày','tree_autumn':'Cây mùa thu','tree_dark':'Cây lá sẫm','tree_fat':'Cây tán to','tree_oak':'Cây sồi','tree_palm':'Cây dừa','tree_pine':'Cây thông','tree_pine_tall':'Thông cao','van':'Xe van','watermelon':'Dưa hấu'}
G=[('house','Nhà & công trình','house_, building_'),('dock','Cầu tàu / cầu','dock_, bridge_'),('boat','Thuyền & xe','boat_, vehicle_ + xe cũ'),('sport','Thể thao & vui chơi','sport_'),('prop','Đồ vật đường phố / chợ / trường','prop_, camp_, farm_'),('fence','Hàng rào & lối đi','fence_, path_'),('plant','Cây cối & đá','plant_, tree_, bush, rock_'),('other','Khác (thú, đồ ăn, cũ)','')]
def grp(n):
  p=n.split('_')[0]
  if p in('house','building'):return 'house'
  if p in('dock','bridge'):return 'dock'
  if p in('boat','vehicle') or n in('sedan','taxi','van','delivery_van','tractor'):return 'boat'
  if p=='sport':return 'sport'
  if p in('prop','camp','farm') or n in('barrel','barrels','crate','chest','campfire','tent','column','column_broken','obelisk','target','log'):return 'prop'
  if p in('fence','path'):return 'fence'
  if p in('plant','tree','bush','rock','flower','stump','mushroom'):return 'plant'
  return 'other'
def hint(n,v):
  x,y,z=v['size'];mx=max(x,z)
  if n.startswith('house_suburb') or n.startswith('house_shop') or n.startswith('building_'): return f'scale ≈ {round(8/mx,1)} → rộng ~8 m'
  if n.startswith('plant_palm') or n.startswith('plant_tree') or n.startswith('tree_'): return f'scale ≈ {round(6/max(y,0.01),1)} → cao ~6 m'
  if n.startswith('boat_'): return f'scale ≈ {round(5/max(z,x),1)} → dài ~5 m (thuyền nhỏ)'
  return ''
L=['# Kho model CC0 — `client/assets/models/kit/`','',
'Dùng: `placeKit(scene, name, [[x,y,z,scale,rotY],…])` (instancing, `client/js/island/kit.js`). Kích thước là hộp bao gốc (X×Y×Z, đơn vị model ≈ m) trước khi scale; nhà Kenney rất nhỏ (≈1 đơn vị) → cần `scale` 5–8. Cột "Gợi ý" là scale tham khảo.',
'Tất cả CC0 (nguồn: `client/assets/CREDITS.txt`). Đã nén meshopt, gộp mesh/vật liệu, texture bảng màu ≤128 px (Kenney) / ≤512 px. Bảng mẫu: `docs/shots/assets/catalog.png` (tạo lại: mở `/tools/kit-preview.html`, `?filter=house_` để lọc).','',
f'**Tổng: {len(m)} model · {sum(v["kb"] for v in m.values())/1024:.1f} MB.** Ngân sách: công trình nhỏ < 1.500 tam giác, cây/đá < 300 (⚠ = vượt, chỉ dùng ít/xa).','']
order=[]
for k,title,pre in G:
  ns=sorted(n for n in m if grp(n)==k)
  if not ns: continue
  order+=ns
  L+=[f'## {title} ({len(ns)})','','| Tên | Kích thước X×Y×Z | Tam giác | KB | Mô tả | Gợi ý |','|---|---|---|---|---|---|']
  for n in ns:
    v=m[n]; d=v.get('desc') or OLD.get(n,''); t=v['tris']
    lim=300 if grp(n)=='plant' else 1500; warn=' ⚠' if t>lim else ''
    if v.get('anim'): d+=f' · {v["anim"]} anim'
    L.append(f'| `{n}` | {"×".join(str(a) for a in v["size"])} | {t}{warn} | {v["kb"]} | {d} | {hint(n,v)} |')
  L.append('')
open(os.path.join(R,'docs/kit-catalog.md'),'w').write('\n'.join(L))
json.dump(order,open(os.path.join(R,'client/tools/kit-list.json'),'w'))
print(len(order))
