# bpyenv/bin/python blend2glb.py in1 out1.glb [in2 out2.glb ...]  — FBX/OBJ/.blend → GLB (bỏ camera/đèn/animation)
import bpy, sys, os
a = sys.argv[1:]
for src, out in zip(a[0::2], a[1::2]):
    try:
        ext = os.path.splitext(src)[1].lower()
        if ext == '.blend':
            bpy.ops.wm.open_mainfile(filepath=src)
        else:
            bpy.ops.wm.read_factory_settings(use_empty=True)
            if ext == '.fbx': bpy.ops.import_scene.fbx(filepath=src)
            elif ext == '.obj': bpy.ops.wm.obj_import(filepath=src)
            elif ext in ('.glb', '.gltf'): bpy.ops.import_scene.gltf(filepath=src)
        for o in list(bpy.data.objects):
            if o.type not in ('MESH', 'EMPTY') or (o.type == 'MESH' and o.hide_render): bpy.data.objects.remove(o, do_unlink=True)
        for o in bpy.data.objects:
            if o.type == 'MESH':
                for m in list(o.modifiers):
                    if m.type in ('CLOTH', 'SOFT_BODY', 'COLLISION', 'PARTICLE_SYSTEM'): o.modifiers.remove(m)
        bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_apply=True, export_animations=False, export_cameras=False, export_lights=False, use_visible=False)
        print('OK', out)
    except Exception as e:
        print('ERR', src, e)
