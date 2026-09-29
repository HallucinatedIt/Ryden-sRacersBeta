"""Ryden's Racers · Blender car prep: Meshy vehicle -> game-ready car GLB

A Meshy vehicle is one mesh, often 500k+ triangles, with the wheels fused to the body. The game needs:
a body mesh plus one mesh per wheel whose name contains "wheel" (front wheels contain FL / FR), the car's
front along glTF +Z, its left along +X, and a sane triangle count. This does that:

    python3 tools/blender/rr_car_prep.py SRC.glb OUT.glb --front -x [--tris 40000] [--tex 1024] [--debug out.png]

  1. import, rotate so the front (--front: +x -x +y -y in Blender axes) becomes glTF +Z, apply
  2. weld (Meshy splits every UV chart) and Decimate to --tris (UVs and the texture are kept)
  3. find the wheels from the geometry: dense low geometry at the sides, clustered along the length into
     axles; radius from the height of the cluster; faces inside each wheel's disc (and at the side) are
     split out as wheel_FL / wheel_FR (front axle) and wheel_RL / wheel_RR, wheel_RL2 / wheel_RR2 ... behind
  4. textures resized to --tex, export GLB (JPEG)
Prints RR_REPORT with the axles found and the triangle counts.
"""
import bpy, bmesh, sys, os, json, math, argparse
from mathutils import Vector, Matrix
import numpy as np

def args():
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    p = argparse.ArgumentParser(); p.add_argument('src'); p.add_argument('out')
    p.add_argument('--front', default='-x'); p.add_argument('--tris', type=int, default=40000); p.add_argument('--tex', type=int, default=1024)
    p.add_argument('--debug', default=''); p.add_argument('--wheel-r', type=float, default=0, help='tyre radius in source units (0 = estimate per axle)'); return p.parse_args(a)

def tris(o): return sum(len(p.vertices) - 2 for p in o.data.polygons)

def main():
    A = args(); bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=A.src)
    ms = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    for o in bpy.context.scene.objects: o.select_set(o.type == 'MESH')
    bpy.context.view_layer.objects.active = ms[0]
    if len(ms) > 1: bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    for o in list(bpy.context.scene.objects):
        if o is not ob and o.type != 'MESH': bpy.data.objects.remove(o)
    ob.parent = None
    # front -> Blender -Y (= glTF +Z)
    ang = {'-x': math.pi / 2, '+x': -math.pi / 2, '+y': math.pi, '-y': 0}[A.front]
    ob.matrix_world = Matrix.Rotation(ang, 4, 'Z') @ ob.matrix_world
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    rep = {'source_tris': tris(ob)}
    # weld + decimate
    size = max(ob.dimensions); bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=size * 0.0004); bm.to_mesh(ob.data); bm.free()
    for n in ('custom_normal', 'sharp_edge', 'sharp_face'):
        at = ob.data.attributes.get(n)
        if at: ob.data.attributes.remove(at)
    for _ in range(3):
        if tris(ob) <= A.tris * 1.1: break
        d = ob.modifiers.new('dec', 'DECIMATE'); d.ratio = max(0.001, A.tris / tris(ob)); d.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier='dec')
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.quads_convert_to_tris(); bpy.ops.object.mode_set(mode='OBJECT')
    rep['tris'] = tris(ob)
    for p in ob.data.polygons: p.use_smooth = True
    # wheels: only the tyres touch the ground, so the contact patches (lowest 6 % of the height, outer half
    # of the width) give the axles; each axle's radius is the height of the tyre found around that patch
    V = np.array([v.co[:] for v in ob.data.vertices]); lo, hi = V.min(0), V.max(0); H = hi[2] - lo[2]; hw = (hi[0] - lo[0]) / 2; cx = (hi[0] + lo[0]) / 2
    L = hi[1] - lo[1]
    foot = V[(V[:, 2] < lo[2] + H * 0.06) & (np.abs(V[:, 0] - cx) > hw * 0.45)]
    ys = np.sort(foot[:, 1]); gaps = np.where(np.diff(ys) > L * 0.012)[0]; axles = []
    for sgm in np.split(ys, gaps + 1):
        if len(sgm) < max(8, len(foot) * 0.02): continue
        y0 = float((sgm[0] + sgm[-1]) / 2)
        ring = V[(np.abs(V[:, 1] - y0) < L * 0.06) & (np.abs(V[:, 0] - cx) > hw * 0.6) & (V[:, 2] < lo[2] + H * 0.5)]
        # radius: half the vertical extent of geometry within the patch's length band, capped by the patch width
        r = float(min(max(sgm[-1] - sgm[0], 0.2) * 1.2, (np.percentile(ring[:, 2], 97) - lo[2]) / 2)) if len(ring) else float(sgm[-1] - sgm[0])
        axles.append({'y': y0, 'r': A.wheel_r or r})
    axles.sort(key=lambda a: a['y'])   # Blender -Y is the front: first = front axle
    rep['axles'] = [{'y': round(a['y'], 3), 'r': round(a['r'], 3)} for a in axles]
    def wheel_name(k, side): return ('wheel_F' + side) if k == 0 else ('wheel_R' + side + ('' if k == 1 else str(k)))
    bm = bmesh.new(); bm.from_mesh(ob.data); bm.faces.ensure_lookup_table(); owner = {}
    for f in bm.faces:
        c = f.calc_center_median()
        if abs(c.x - cx) < hw * 0.5: continue
        for k, a in enumerate(axles):
            if math.hypot(c.y - a['y'], c.z - (lo[2] + a['r'])) < a['r'] * 0.97:
                owner[f.index] = wheel_name(k, 'L' if c.x > cx else 'R'); break   # left = +x (glTF +x with the front at +z)
    for name in sorted(set(owner.values())):
        b2 = bm.copy(); b2.faces.ensure_lookup_table()
        bmesh.ops.delete(b2, geom=[f for f in b2.faces if owner.get(f.index) != name], context='FACES')
        me = bpy.data.meshes.new(name); b2.to_mesh(me); b2.free()
        for m in ob.data.materials: me.materials.append(m)
        o2 = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o2)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.index in owner], context='FACES'); bm.to_mesh(ob.data); bm.free()
    ob.name = 'body'; ob.data.name = 'body'
    rep['parts'] = {o.name: tris(o) for o in bpy.context.scene.objects if o.type == 'MESH'}
    # textures
    for m in bpy.data.materials:
        if not m.use_nodes: continue
        for n in m.node_tree.nodes:
            if n.type == 'TEX_IMAGE' and n.image and max(n.image.size) > A.tex: n.image.scale(A.tex, A.tex)
    for o in bpy.context.scene.objects: o.select_set(o.type == 'MESH')
    bpy.ops.export_scene.gltf(filepath=A.out, export_format='GLB', use_selection=True, export_image_format='JPEG', export_jpeg_quality=88, export_yup=True)
    rep['bytes'] = os.path.getsize(A.out); print('RR_REPORT ' + json.dumps(rep))
    if A.debug: debug(os.path.abspath(A.debug))

def debug(path):
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.samples = 8; sc.cycles.device = 'CPU'; sc.view_settings.view_transform = 'Standard'
    sc.render.resolution_x = 900; sc.render.resolution_y = 360
    cols = {'body': (0.85, 0.85, 0.85)}; pal = [(0.9, 0.2, 0.2), (0.2, 0.5, 1), (0.2, 0.8, 0.3), (1, 0.8, 0.1), (0.8, 0.3, 0.9), (0.1, 0.9, 0.9)]
    for k, o in enumerate(sorted([o for o in sc.objects if o.type == 'MESH'], key=lambda o: o.name)):
        m = bpy.data.materials.new('dbg_' + o.name); m.use_nodes = True; nt = m.node_tree; out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
        em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (*cols.get(o.name, pal[k % len(pal)]), 1); nt.links.new(em.outputs[0], out.inputs['Surface'])
        o.data.materials.clear(); o.data.materials.append(m)
    w = bpy.data.worlds.new('w'); sc.world = w
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    allv = [o.matrix_world @ v.co for o in sc.objects if o.type == 'MESH' for v in o.data.vertices]
    lo = Vector([min(v[i] for v in allv) for i in range(3)]); hi = Vector([max(v[i] for v in allv) for i in range(3)]); c = (lo + hi) / 2; R = (hi - lo).length
    cam.location = c + Vector((1.2, -0.9, 0.25)).normalized() * R * 1.45; cam.rotation_euler = (c - cam.location).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = path; bpy.ops.render.render(write_still=True)

if __name__ == '__main__': main()
