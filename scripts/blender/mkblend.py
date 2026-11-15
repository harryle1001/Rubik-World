import bpy, os, math, sys
D = os.path.abspath('chars'); OUT = sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.unit_settings.system = 'METRIC'
NAMES = {'co-giao-ao-dai': 'Cô giáo (áo dài)', 'thay-giao': 'Thầy giáo', 'bac-bao-ve': 'Bác bảo vệ'}
files = sorted(f for f in os.listdir(D) if f.startswith('hoc-sinh')) + ['co-giao-ao-dai.glb', 'thay-giao.glb', 'bac-bao-ve.glb']
for i, f in enumerate(files):
    key = f[:-4]; label = NAMES.get(key, 'Học sinh ' + key.replace('hoc-sinh-', '').replace('female', 'nữ').replace('male', 'nam').upper().replace('NỮ', 'Nữ').replace('NAM', 'Nam'))
    col = bpy.data.collections.new(label); sc.collection.children.link(col)
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(D, f))
    new = [o for o in bpy.data.objects if o not in before]
    for o in [o for o in new if o.name.startswith('Icosphere')]:
        for ob in bpy.data.objects:
            if ob.type == 'ARMATURE':
                for pb in ob.pose.bones:
                    if pb.custom_shape == o: pb.custom_shape = None
        new.remove(o); bpy.data.objects.remove(o)
    for o in new:
        for c in o.users_collection: c.objects.unlink(o)
        col.objects.link(o)
    roots = [o for o in new if o.parent is None]
    row, k = (0, i) if i < 12 else (1, i - 12)
    x = (k - (5.5 if row == 0 else 1)) * 1.4; y = row * 2.4
    for r in roots: r.location.x += x; r.location.y += y; r.name = key
    # dừng ở tư thế đứng (animation idle) cho dễ sửa
    for o in new:
        if o.type == 'ARMATURE' and o.animation_data:
            acts = [a for a in bpy.data.actions if 'idle' in a.name.lower()]
            o.animation_data.action = None
    t = bpy.data.curves.new(key + '-ten', 'FONT'); t.body = label; t.size = 0.16; t.align_x = 'CENTER'
    to = bpy.data.objects.new(key + '-ten', t); to.location = (x, y - 0.55, 0.02); to.rotation_euler = (math.radians(90), 0, 0); col.objects.link(to)
# vật liệu: bật màu theo đỉnh (áo trắng, quần xanh) nếu có
for m in bpy.data.materials:
    if not m.use_nodes: continue
    nt = m.node_tree; bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if not bsdf: continue
    linked = bsdf.inputs['Base Color'].is_linked
    if not linked:
        for me in bpy.data.meshes:
            if m.name in [x.name for x in me.materials if x] and me.color_attributes:
                va = nt.nodes.new('ShaderNodeVertexColor'); va.layer_name = me.color_attributes[0].name
                nt.links.new(va.outputs['Color'], bsdf.inputs['Base Color']); break
# nền, đèn, camera
bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 1, 0)); g = bpy.context.object; g.name = 'nen-co'
gm = bpy.data.materials.new('co'); gm.diffuse_color = (0.42, 0.68, 0.3, 1); gm.use_nodes = True; gm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.42, 0.68, 0.3, 1); g.data.materials.append(gm)
bpy.ops.object.light_add(type='SUN', rotation=(math.radians(50), 0, math.radians(30))); bpy.context.object.data.energy = 3.5
w = bpy.data.worlds.new('troi'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.62, 0.8, 0.95, 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.9
bpy.ops.object.camera_add(location=(0, -17, 3.6), rotation=(math.radians(83), 0, 0)); cam = bpy.context.object; cam.data.lens = 34; sc.camera = cam
sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.device = 'CPU'; sc.render.resolution_x, sc.render.resolution_y = 1600, 700
sc.view_settings.view_transform = 'Standard'
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=True)
sc.render.filepath = OUT.replace('.blend', '-preview.png'); bpy.ops.render.render(write_still=True)
print('OK', len(bpy.data.objects), [a.name for a in bpy.data.actions][:8])
