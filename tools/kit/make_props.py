# Tự dựng vài model đơn giản còn thiếu (CC0, của dự án): rổ bóng rổ, dù bãi biển, bập bênh, lưới bóng chuyền, phao bơi, khung thành mini
import bpy, math, sys
out = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '.'
def reset(): bpy.ops.wm.read_factory_settings(use_empty=True)
mats = {}
def mat(name, hexc, rough=0.8):
    if name in mats: return mats[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    c = tuple(int(hexc[i:i+2], 16) / 255 for i in (1, 3, 5))
    p = m.node_tree.nodes['Principled BSDF']; p.inputs['Base Color'].default_value = (*[x ** 2.2 for x in c], 1); p.inputs['Roughness'].default_value = rough
    mats[name] = m; return m
def put(o, m): o.data.materials.append(m); return o
def box(loc, size, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot); o = bpy.context.object; o.scale = [s / 2 for s in size]; return put(o, m)
def cyl(loc, r, h, m, v=10, rot=(0, 0, 0), r2=None):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=h, location=loc, rotation=rot)
    else: bpy.ops.mesh.primitive_cone_add(vertices=v, radius1=r, radius2=r2, depth=h, location=loc, rotation=rot)
    return put(bpy.context.object, m)
def torus(loc, R, r, m, rot=(0, 0, 0), maj=16, mi=6):
    bpy.ops.mesh.primitive_torus_add(location=loc, rotation=rot, major_radius=R, minor_radius=r, major_segments=maj, minor_segments=mi); return put(bpy.context.object, m)
def save(name):
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bpy.ops.export_scene.gltf(filepath=f'{out}/{name}.glb', export_format='GLB', export_apply=True); mats.clear(); print('OK', name)
# Blender: Z lên. 1 đơn vị = 1 m.
reset()  # rổ bóng rổ cao 3.05 m
W, R, O, N = mat('white', '#f4f1ea'), mat('red', '#e8453c'), mat('orange', '#f08a24'), mat('pole', '#3d4a5c', 0.5)
cyl((0, -0.6, 1.6), 0.07, 3.2, N); box((0, -0.35, 3.0), (0.12, 0.6, 0.12), N)
box((0, 0, 3.3), (1.8, 0.05, 1.05), W); box((0, 0.03, 3.15), (0.6, 0.02, 0.45), R)
torus((0, 0.28, 3.05), 0.23, 0.018, O); cyl((0, 0.28, 2.85), 0.22, 0.38, W, 10, r2=0.14).data.polygons.foreach_set('use_smooth', [False]*12)
box((0, -0.6, 0.05), (0.6, 0.6, 0.1), N); save('sport_hoop')
reset()  # dù bãi biển sọc đỏ trắng, cao 2.4 m
R, W, P = mat('red', '#e8453c'), mat('white', '#fbf1de'), mat('wood', '#b9824f')
cyl((0, 0, 1.15), 0.035, 2.3, P, 6)
bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=1.4, radius2=0.05, depth=0.55, location=(0, 0, 2.15)); c = bpy.context.object
c.data.materials.append(R); c.data.materials.append(W)
for i, p in enumerate(c.data.polygons):
    if len(p.vertices) == 4 or p.vertices[0] < 24: p.material_index = (i % 2)
save('prop_beach_umbrella')
reset()  # bập bênh dài 3 m
Y, B, G = mat('yellow', '#f5c518'), mat('blue', '#4a90d9'), mat('grey', '#a9a297')
box((0, 0, 0.55), (3.0, 0.28, 0.06), Y, rot=(0, math.radians(8), 0)); cyl((0, 0, 0.27), 0.25, 0.3, G, 3, rot=(math.radians(90), 0, 0))
for x in (-1.3, 1.3): box((x, 0, 0.55 - x * 0.14 + 0.25), (0.05, 0.45, 0.05), B); cyl((x * 1.04, 0, 0.75 - x * 0.14), 0.02, 0.35, B, 6)
save('play_seesaw')
reset()  # lưới bóng chuyền/cầu lông rộng 6 m
N, W = mat('pole', '#3d4a5c', 0.5), mat('net', '#fbf1de')
for x in (-3, 3): cyl((x, 0, 1.2), 0.05, 2.4, N, 8)
box((0, 0, 2.05), (6, 0.03, 0.7), W); box((0, 0, 2.38), (6, 0.04, 0.05), mat('band', '#e8453c'))
save('sport_net')
reset()  # phao bơi
torus((0, 0, 0.12), 0.4, 0.13, mat('ring', '#e8453c', 0.4), maj=16, mi=8)
save('prop_swim_ring')
reset()  # khung thành mini (sân trường) 3 x 2 m
W, N = mat('white', '#f4f1ea', 0.4), mat('net', '#dfe6ea')
for x in (-1.5, 1.5): cyl((x, 0, 1), 0.05, 2, W, 8)
cyl((0, 0, 2), 0.05, 3.1, W, 8, rot=(0, math.radians(90), 0))
box((0, -0.6, 1.0), (3, 0.02, 2), N, rot=(math.radians(-20), 0, 0))
save('sport_goal_mini')
