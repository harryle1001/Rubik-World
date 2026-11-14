# Builds stylised low-poly scenery for Rubik World, exports .glb and renders 2D sprites.
# Run: blender -b -P tools/blender/scenery.py -- client            (models -> client/models/*.glb)
#      blender -b -P tools/blender/scenery.py -- <dir> --sprites  (also render 2D sprites)
import bpy, bmesh, math, random, sys, os
from mathutils import Vector
OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'client'
os.makedirs(OUT + '/sprites', exist_ok=True); os.makedirs(OUT + '/models', exist_ok=True)
random.seed(7)

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
reset()
MATS = {}
def mat(hexc, rough=.8, emit=0):
    k = (hexc, rough, emit)
    if k in MATS: return MATS[k]
    m = bpy.data.materials.new(hexc); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    c = tuple(int(hexc[i:i+2], 16)/255 for i in (1, 3, 5))
    c = tuple(((v + .055)/1.055)**2.4 if v > .04045 else v/12.92 for v in c) + (1,)
    b.inputs['Base Color'].default_value = c; b.inputs['Roughness'].default_value = rough
    if emit: b.inputs['Emission Color'].default_value = c; b.inputs['Emission Strength'].default_value = emit
    MATS[k] = m; return m

def finish(o, m, jitter=0, flat=True):
    o.data.materials.append(m)
    if jitter:
        for v in o.data.vertices: v.co += Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1)))*jitter
    for p in o.data.polygons: p.use_smooth = not flat
    return o
def cyl(r1, r2, h, loc, m, n=8, j=0):
    bpy.ops.mesh.primitive_cone_add(vertices=n, radius1=r1, radius2=r2, depth=h, location=(loc[0], loc[1], loc[2] + h/2))
    return finish(bpy.context.object, m, j)
def ico(r, loc, m, j=.06, sc=(1, 1, 1), sub=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc); o = bpy.context.object; o.scale = sc
    bpy.ops.object.transform_apply(scale=True); return finish(o, m, j*r)
def box(s, loc, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o = bpy.context.object; o.scale = s
    bpy.ops.object.transform_apply(scale=True, rotation=True); return finish(o, m)
def group(name, objs):
    for o in bpy.context.selected_objects: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join()
    o = bpy.context.object; o.name = name; return o

BARK = mat('#6d4c41'); BARK2 = mat('#8d6e63')
def oak():
    p = [cyl(.22, .14, 1.4, (0, 0, 0), BARK, 7)]
    for (x, y, z, r) in [(0, 0, 2.1, .95), (.6, .2, 1.8, .7), (-.6, -.1, 1.85, .72), (.1, -.5, 2.6, .6), (-.2, .45, 2.5, .62)]:
        p.append(ico(r, (x, y, z), mat(random.choice(['#43a047', '#388e3c', '#66bb6a'])), .12))
    return group('oak', p)
def pine():
    p = [cyl(.16, .1, .8, (0, 0, 0), BARK, 6)]
    for k in range(4):
        p.append(cyl(1.0 - k*.2, 0, 1.1, (0, 0, .6 + k*.62), mat(['#1b5e20', '#2e7d32', '#388e3c', '#43a047'][k]), 8, .04))
    return group('pine', p)
def sakura():
    p = [cyl(.18, .1, 1.3, (0, 0, 0), mat('#5d4037'), 7)]
    p.append(cyl(.07, .04, .8, (.1, 0, 1.1), mat('#5d4037'), 5)); p[-1].rotation_euler = (0, .7, 0)
    for (x, y, z, r) in [(0, 0, 2.0, .85), (.7, .1, 1.75, .6), (-.65, .1, 1.8, .62), (.1, .5, 2.4, .55), (0, -.5, 2.35, .55)]:
        p.append(ico(r, (x, y, z), mat(random.choice(['#f8bbd0', '#f48fb1', '#fce4ec'])), .14))
    return group('sakura', p)
def palm():
    p = []
    for k in range(7):
        s = cyl(.17 - k*.012, .15 - k*.012, .42, (k*.07, 0, k*.4), mat('#8d6e63' if k % 2 else '#a1887f'), 7); p.append(s)
    top = Vector((.49, 0, 2.85))
    for a in range(7):
        bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 0)); f = bpy.context.object
        bm = bmesh.new(); bm.from_mesh(f.data); bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=4); bm.to_mesh(f.data); bm.free()
        for v in f.data.vertices:
            u = v.co.x + .5; v.co.x = u*1.6; v.co.y *= .5*(1 - u*.8); v.co.z = -u*u*.9
        f.rotation_euler = (0, 0, a*2*math.pi/7); f.location = top; finish(f, mat(['#2e7d32', '#43a047'][a % 2]))
        f.modifiers.new('s', 'SOLIDIFY').thickness = .03; bpy.context.view_layer.objects.active = f; bpy.ops.object.modifier_apply(modifier='s'); p.append(f)
    for k in range(3): p.append(ico(.12, (top.x + .12*math.cos(k*2.1), .12*math.sin(k*2.1), top.z - .18), mat('#6d4c41'), 0))
    return group('palm', p)
def bush():
    return group('bush', [ico(r, (x, y, r*.7), mat(random.choice(['#43a047', '#558b2f', '#66bb6a'])), .12) for (x, y, r) in [(0, 0, .5), (.45, .1, .38), (-.42, .05, .4), (0, .3, .35)]] +
                 [ico(.07, (random.uniform(-.6, .6), random.uniform(-.4, .1), random.uniform(.4, .7)), mat(random.choice(['#ffd23f', '#ff6f91', '#ffffff'])), 0) for _ in range(9)])
def bench():
    W, S = mat('#a1887f'), mat('#455a64', .4)
    p = [box((1.8, .12, .06), (0, k*.14 - .14, .5), W) for k in range(3)]
    p += [box((1.8, .06, .12), (0, .26, .7 + k*.16), W) for k in range(2)]
    for x in (-.75, .75): p += [box((.08, .5, .5), (x, 0, .25), S), box((.08, .06, .55), (x, .27, .6), S)]
    return group('bench', p)
def lamp():
    M = mat('#37474f', .35)
    p = [cyl(.18, .14, .2, (0, 0, 0), M, 8), cyl(.06, .05, 2.4, (0, 0, .2), M, 8), box((.36, .36, .06), (0, 0, 2.62), M)]
    p.append(cyl(.14, .18, .34, (0, 0, 2.62), mat('#fff3b0', .2, 3), 6)); p.append(cyl(.24, .04, .2, (0, 0, 2.96), M, 6))
    return group('lamp', p)
def school():
    p = [box((5, 3, 2.4), (0, 0, 1.2), mat('#f5e6c8')), box((5.2, 3.2, .2), (0, 0, .1), mat('#bcaaa4'))]
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=3.6, radius2=0, depth=1.5, location=(0, 0, 3.15), rotation=(0, 0, math.pi/4))
    r = bpy.context.object; r.scale = (1.0, .62, 1); bpy.ops.object.transform_apply(scale=True); p.append(finish(r, mat('#c62828')))
    p.append(box((1, .1, 1.5), (0, -1.52, .75), mat('#6d4c41')))
    for x in (-1.7, -.9, .9, 1.7): p += [box((.6, .08, .7), (x, -1.52, 1.45), mat('#81d4fa', .1)), box((.7, .1, .08), (x, -1.53, 1.06), mat('#ffffff'))]
    p.append(box((1.6, .08, .45), (0, -1.53, 2.05), mat('#1565c0'))); p.append(cyl(.04, .04, 1.6, (2.2, -1.2, 2.4), mat('#9e9e9e', .3), 6))
    p.append(box((.03, .5, .32), (2.2, -.95, 3.8), mat('#e53935')))
    p.append(ico(.35, (2.2, -1.53, 1.85), mat('#ffffff'), 0, (1, .3, 1), 2))
    return group('school', p)

def rock():
    return group('rock', [ico(.6, (0, 0, .25), mat('#9e9e9e'), .18, (1.2, 1, .7)), ico(.35, (.55, .2, .15), mat('#bdbdbd'), .2, (1, 1, .8))])
def flowers():
    p = [cyl(.75, .7, .18, (0, 0, 0), mat('#6d4c41'), 12)]
    for k in range(18):
        a = k*2.4; r = .15 + (k % 6)*.1; x, y = math.cos(a)*r, math.sin(a)*r
        p.append(cyl(.015, .015, .3, (x, y, .15), mat('#388e3c'), 4))
        p.append(ico(.08, (x, y, .48), mat(['#ff6f91', '#ffd23f', '#ffffff', '#ba68c8', '#ff8a65'][k % 5]), .1))
    return group('flowers', p)
def fountain():
    S = mat('#e6e0d3', .6); W = mat('#4fc3f7', .05)
    p = [cyl(1.6, 1.7, .5, (0, 0, 0), S, 16), cyl(1.4, 1.4, .05, (0, 0, .42), W, 16), cyl(.18, .22, 1.2, (0, 0, .4), S, 8),
         cyl(.7, .4, .2, (0, 0, 1.5), S, 12), cyl(.6, .6, .04, (0, 0, 1.66), W, 12), cyl(.08, .1, .5, (0, 0, 1.6), S, 6), ico(.18, (0, 0, 2.2), mat('#e1f5fe', .05), 0, (1, 1, 1), 2)]
    return group('fountain', p)
def statue():
    S = mat('#f4f1ea', .5)
    return group('statue', [box((1, 1, .5), (0, 0, .25), mat('#cfc6b4')), cyl(.28, .35, 1.3, (0, 0, .5), S, 8), ico(.25, (0, 0, 2.05), S, 0, (1, 1, 1), 2),
                            cyl(.06, .06, .7, (.35, 0, 1.3), S, 6), ico(.12, (.35, 0, 2.05), mat('#ffd23f', .3, .5), 0)])
def chest():
    Wd = mat('#8d6e4a'); Au = mat('#ffd23f', .3)
    p = [box((.9, .6, .45), (0, 0, .225), Wd)]
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=.3, depth=.9, location=(0, 0, .45), rotation=(0, math.pi/2, 0)); c = bpy.context.object; c.scale = (1, 1, 1)
    p.append(finish(c, mat('#6d4c2e')))
    for x in (-.35, .35): p.append(box((.06, .64, .5), (x, 0, .3), Au))
    p.append(box((.14, .05, .16), (0, -.31, .45), Au))
    return group('chest', p)
def hull(L, Wd, H, col, deck):
    bpy.ops.mesh.primitive_cube_add(size=1); h = bpy.context.object; h.scale = (L, Wd, H); bpy.ops.object.transform_apply(scale=True)
    for v in h.data.vertices:
        if v.co.x > L*.3: v.co.y *= .25 if v.co.x > L*.45 else .7
        if v.co.z < 0: v.co.y *= .55; v.co.x *= .85
    h.location = (0, 0, H*.2); finish(h, mat(col))
    return [h, box((L*.86, Wd*.8, .06), (-.05*L, 0, H*.72), mat(deck))]
def sailboat():
    p = hull(3, 1.1, .7, '#fafafa', '#a1887f') + [box((3.05, 1.12, .08), (0, 0, .35), mat('#ef4b4b')), cyl(.05, .04, 3.2, (-.2, 0, .5), mat('#5d4037'), 6)]
    bpy.ops.mesh.primitive_plane_add(size=1); s = bpy.context.object
    for v in s.data.vertices: v.co = Vector((-.2 + (v.co.x + .5)*1.4*(0 if v.co.y > 0 else 1), 0, .9 + (v.co.y + .5)*2.6))
    s.data.vertices[0].co = Vector((-.15, 0, .9)); s.data.vertices[1].co = Vector((1.3, 0, .9)); s.data.vertices[2].co = Vector((-.15, 0, 3.6)); s.data.vertices[3].co = Vector((-.15, 0, 3.6))
    finish(s, mat('#ffffff')); s.modifiers.new('s', 'SOLIDIFY').thickness = .03; bpy.context.view_layer.objects.active = s; bpy.ops.object.modifier_apply(modifier='s'); p.append(s)
    return group('sailboat', p)
def warship():
    G1, G2 = mat('#607d8b', .5), mat('#78909c', .5)
    p = hull(7, 1.8, 1.1, '#546e7a', '#90a4ae') + [box((2, 1.2, .8), (-.6, 0, 1.2), G1), box((1, .9, .7), (-.7, 0, 1.9), G2), box((.6, .6, .5), (-.8, 0, 2.5), mat('#37474f'))]
    p += [cyl(.05, .05, 1.6, (-.9, 0, 2.6), mat('#37474f'), 6), box((.3, .02, .2), (-.9, .02, 4.05), mat('#e53935'))]
    p += [box((.8, .5, .3), (1.6, 0, 1.0), G1), box((1.2, .12, .12), (2.3, 0, 1.1), mat('#37474f'))]
    p += [box((.5, .7, .4), (-2.6, 0, 1.0), G1), box((.05, .9, .05), (-.7, 0, 2.3), mat('#ffd23f'))]
    return group('warship', p)
def pirate():
    Wd = mat('#4e342e')
    p = hull(5, 1.6, 1.0, '#3e2723', '#8d6e4a') + [box((1, 1.5, .8), (-1.9, 0, 1.0), Wd), cyl(.07, .06, 4, (.3, 0, .6), mat('#5d4037'), 6), cyl(.06, .05, 3, (-1.2, 0, .9), mat('#5d4037'), 6)]
    for (x, z, w, h) in [(.3, 2.2, 1.6, 1.6), (-1.2, 2.3, 1.2, 1.2)]:
        p.append(box((.04, w, h), (x + .05, 0, z), mat('#212121')))
    p.append(box((.02, .5, .35), (.3, 0, 4.4), mat('#212121'))); p.append(ico(.12, (.33, 0, 2.4), mat('#fafafa'), 0, (1, 1, 1), 2))
    return group('pirate', p)

BUILD = dict(oak=oak, pine=pine, sakura=sakura, palm=palm, bush=bush, bench=bench, lamp=lamp, school=school, rock=rock, flowers=flowers, fountain=fountain, statue=statue, chest=chest, sailboat=sailboat, warship=warship, pirate=pirate)
objs = {}
for i, (n, f) in enumerate(BUILD.items()):
    o = f(); o.location = (i*10, 0, 0); objs[n] = o
    for x in objs.values(): x.hide_render = x is not o
    o.select_set(True); bpy.context.view_layer.objects.active = o
for n, o in objs.items():
    for x in objs.values(): x.select_set(x is o)
    loc = o.location.copy(); o.location = (0, 0, 0)
    bpy.ops.export_scene.gltf(filepath=f'{OUT}/models/{n}.glb', use_selection=True, export_apply=True)
    o.location = loc

if '--sprites' not in sys.argv: sys.exit(0)
# ---- sprite rendering: orthographic 3/4 camera matching the game's top-down-front view ----
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 48; sc.cycles.use_denoising = True
sc.render.film_transparent = True; sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
sc.view_settings.view_transform = 'Standard'
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (.75, .82, .95, 1); w.node_tree.nodes['Background'].inputs[1].default_value = .9
bpy.ops.object.light_add(type='SUN', rotation=(math.radians(32), 0, math.radians(-40))); bpy.context.object.data.energy = 3.2; bpy.context.object.data.angle = .12
bpy.ops.object.camera_add(); cam = bpy.context.object; sc.camera = cam; cam.data.type = 'ORTHO'
cam.rotation_euler = (math.radians(58), 0, 0)
# shadow catcher ground
bpy.ops.mesh.primitive_plane_add(size=200); gnd = bpy.context.object; gnd.is_shadow_catcher = True
PX = 64  # pixels per metre in sprite
for n, o in objs.items():
    for x in objs.values(): x.hide_render = x is not o
    bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
    up = Vector((0, math.cos(math.radians(58)), math.sin(math.radians(58))))
    xs = [v.x for v in bb] + [max(v.x for v in bb) + .6]; us = [v.dot(up) for v in bb]
    size = max(max(xs) - min(xs), max(us) - min(us)) + 1.0; cam.data.ortho_scale = size
    d = Vector((0, -math.sin(math.radians(58)), math.cos(math.radians(58))))
    cu = (max(us) + min(us))/2
    cam.location = Vector(((max(xs) + min(xs))/2, 0, 0)) + up*cu + d*30
    sc.render.resolution_x = sc.render.resolution_y = int(size*PX)
    sc.render.filepath = f'{OUT}/sprites/{n}.png'; bpy.ops.render.render(write_still=True)
    print('RENDERED', n, sc.render.resolution_x)
