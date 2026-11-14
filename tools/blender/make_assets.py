"""Tạo model low-poly bằng Blender (bpy) và xuất .glb vào client/assets/models/.
Chạy:  python tools/blender/make_assets.py      (cần: pip install bpy)
Hoặc:  blender -b -P tools/blender/make_assets.py
"""
import bpy, bmesh, math, os, random
from mathutils import Vector

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'client', 'assets', 'models')
os.makedirs(OUT, exist_ok=True)
random.seed(7)

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def mat(name, rgb):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = 0.85
    return m

def hexc(h):  # '#rrggbb' -> linear rgb
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(x ** 2.2 for x in c)

def finish(obj, m, flat=True):
    obj.data.materials.append(m)
    if flat:
        for p in obj.data.polygons: p.use_smooth = False
    return obj

def cone(r, h, loc, m, v=6, r2=0.0):
    bpy.ops.mesh.primitive_cone_add(vertices=v, radius1=r, radius2=r2, depth=h, location=(loc[0], loc[1], loc[2] + h / 2))
    return finish(bpy.context.object, m)

def cyl(r, h, loc, m, v=6):
    bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=h, location=(loc[0], loc[1], loc[2] + h / 2))
    return finish(bpy.context.object, m)

def ico(r, loc, m, sub=1, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc)
    o = bpy.context.object; o.scale = scale; bpy.ops.object.transform_apply(scale=True)
    return finish(o, m)

def jitter(obj, amt):
    bm = bmesh.new(); bm.from_mesh(obj.data)
    for v in bm.verts: v.co += Vector([random.uniform(-amt, amt) for _ in range(3)])
    bm.to_mesh(obj.data); bm.free()

def export(name):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.join()
    o = bpy.context.object; o.name = name
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY') if False else None
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, name + '.glb'), export_format='GLB', export_apply=True, export_yup=True)
    tris = sum(len(p.vertices) - 2 for p in o.data.polygons)
    print(f'{name}.glb  {tris} tam giác')

# ---- Cây thông ----
reset()
trunk, leaf = mat('trunk', hexc('#8b5a2b')), mat('leaf', hexc('#2e8b57'))
cyl(0.18, 1.0, (0, 0, 0), trunk)
for i, (r, z) in enumerate([(1.1, 0.8), (0.85, 1.6), (0.6, 2.3)]): jitter(cone(r, 1.3, (0, 0, z), leaf, 7), 0.05)
export('cay-thong')

# ---- Cây tròn ----
reset()
cyl(0.2, 1.3, (0, 0, 0), mat('trunk', hexc('#a0693a')), 6)
for loc, r in [((0, 0, 2.0), 0.95), ((0.5, 0.2, 1.7), 0.65), ((-0.45, -0.2, 1.8), 0.7)]: jitter(ico(r, loc, mat('leaf', hexc('#7bc86c'))), 0.06)
export('cay-tron')

# ---- Đá ----
reset()
for loc, r in [((0, 0, 0.3), 0.7), ((0.7, 0.3, 0.2), 0.45)]: jitter(ico(r, loc, mat('rock', hexc('#9aa5b1')), 1, (1, 0.9, 0.7)), 0.12)
export('da')

# ---- Đền (cho câu đố học tập) ----
reset()
stone, roof, gold = mat('stone', hexc('#e8dcc2')), mat('roof', hexc('#c0563b')), mat('gold', hexc('#f2c14e'))
cyl(2.6, 0.35, (0, 0, 0), stone, 8)
for a in range(6):
    x, y = 1.8 * math.cos(a * math.pi / 3), 1.8 * math.sin(a * math.pi / 3)
    cyl(0.25, 2.2, (x, y, 0.35), stone, 8)
cyl(2.3, 0.3, (0, 0, 2.55), stone, 8)
cone(2.5, 1.6, (0, 0, 2.85), roof, 8)
ico(0.35, (0, 0, 4.7), gold, 1)
export('den')

# ---- Cá mập ----
reset()
grey, belly = mat('grey', hexc('#6c7a89')), mat('belly', hexc('#eef2f5'))
ico(1, (0, 0, 0), grey, 2, (2.4, 0.7, 0.8))
ico(0.9, (0.1, 0, -0.25), belly, 2, (2.2, 0.62, 0.5))
cone(0.7, 1.4, (-2.2, 0, 0.1), grey, 3).rotation_euler = (0, math.radians(-90), 0)
cone(0.4, 1.0, (0.1, 0, 0.7), grey, 3, 0.0)
for s in (-1, 1):
    f = cone(0.35, 1.1, (0.5, 0.7 * s, -0.2), grey, 3); f.rotation_euler = (math.radians(70 * s), 0, 0)
    e = ico(0.07, (1.9, 0.38 * s, 0.2), mat('eye', hexc('#111111')), 1)
export('ca-map')

# ---- Rùa biển ----
reset()
shell, skin = mat('shell', hexc('#5aa469')), mat('skin', hexc('#b8e08a'))
ico(1, (0, 0, 0.1), shell, 2, (1.2, 1.0, 0.5)); ico(0.8, (0, 0, -0.1), mat('under', hexc('#f4e7b0')), 1, (1.1, 0.9, 0.35))
ico(0.35, (1.35, 0, 0.1), skin, 1)
for sx, sy, ang in [(0.6, 1.1, 35), (0.6, -1.1, -35), (-0.7, 0.9, 20), (-0.7, -0.9, -20)]:
    f = ico(0.5, (sx, sy, 0), skin, 1, (0.9, 0.25, 0.1)); f.rotation_euler = (0, 0, math.radians(ang))
export('rua')

# ---- Cá nhiệt đới ----
reset()
c, d = mat('fish', hexc('#ff8a5c')), mat('stripe', hexc('#ffffff'))
ico(0.5, (0, 0, 0), c, 1, (1.5, 0.45, 0.8)); ico(0.12, (0.45, 0.2, 0.12), mat('eye', hexc('#111111')), 1)
ico(0.08, (0.45, -0.2, 0.12), mat('eye', hexc('#111111')), 1)
cone(0.35, 0.6, (-0.95, 0, 0), c, 3).rotation_euler = (0, math.radians(-90), 0)
cyl(0.5, 0.12, (0.2, 0, -0.3), d, 6)
export('ca')

# ---- San hô ----
reset()
for i, col in enumerate(['#ff6b81', '#ff9f43', '#a55eea']):
    m = mat(f'coral{i}', hexc(col))
    for k in range(4):
        a = k * 1.57 + i; cone(0.18, 0.9 + 0.5 * random.random(), (0.35 * math.cos(a) * (i + 1) / 2, 0.35 * math.sin(a) * (i + 1) / 2, 0), m, 5)
export('san-ho')
