"""Ryden's Racers · Graphics V2 · Blender prop/vegetation pipeline (Phase 3)

Turns a Meshy source GLB (never modified) into a browser-ready prop with LODs.

Run with Blender (GUI Blender: Scripting tab, or headless):
    blender -b -P tools/blender/rr_prop_pipeline.py -- SRC.glb OUT.glb --height 1.3 --lods 3000,900,250 --tex 512 [--impostor] [--report out.json]
or with the `bpy` Python module (pip install bpy):
    python3 tools/blender/rr_prop_pipeline.py SRC.glb OUT.glb --height 1.3 ...

Steps
 1. import, join all meshes into one object
 2. clean-up: merge by distance (Meshy splits every UV chart into its own island; welding them is what
    lets Decimate work at all), delete loose junk (islands under 0.05 % of the surface area:
    hidden/internal fragments), remove degenerate faces, recalculate normals outward
 3. real-world scale (--height, metres), origin at the base centre, +Z up in Blender (+Y up in glTF)
 4. LODs: Decimate (collapse) to each target triangle count; UVs and the material are preserved.
    If Decimate stalls above 1.3x the target (Meshy "chart soup": every UV chart its own island),
    that LOD is rebuilt instead (--rebake auto): UV-less copy, decimate, Smart UV, bake base colour.
 5. optional impostor LOD (--impostor): the model's albedo (unlit, Standard view transform) is rendered
    with Cycles from 3 directions into an alpha atlas and rebuilt as 3 crossed quads (6 triangles): the
    far vegetation LOD. The game lights the cards, so they match LOD0 instead of being shaded twice.
 6. textures resized to --tex (the impostor atlas is --tex / 2 per view)
 7. export one GLB with nodes lod0, lod1, lod2 (and lodImp); the game builds a THREE.LOD from them
Prints a JSON report (triangles per LOD, dimensions, islands removed).
"""
import bpy, bmesh, sys, os, json, math, argparse
from mathutils import Vector

def args():
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    p = argparse.ArgumentParser()
    p.add_argument('src'); p.add_argument('out')
    p.add_argument('--height', type=float, required=True)
    p.add_argument('--lods', default='3000,900,250', help="triangle target per LOD; 'none' = impostor only (needs --impostor)")
    p.add_argument('--tex', type=int, default=512)
    p.add_argument('--impostor', action='store_true')
    p.add_argument('--junk', type=float, default=0.0005, help='delete islands below this fraction of total area')
    p.add_argument('--weld', type=float, default=0.0008, help='merge distance as a fraction of the model size')
    p.add_argument('--report', default='')
    p.add_argument('--rebake', default='auto', choices=['auto', 'never', 'always'],
                   help='rebuild LODs that Decimate cannot reach (chart-soup meshes): UV-less decimate -> smart UV -> bake colour')
    return p.parse_args(a)

def clear_normals(o):
    for n in ('custom_normal', 'sharp_edge', 'sharp_face'):
        a = o.data.attributes.get(n)
        if a: o.data.attributes.remove(a)
    try:
        if o.data.has_custom_normals: o.data.free_normals_split() if hasattr(o.data, 'free_normals_split') else None
    except Exception: pass

def tris(o):
    return sum(len(p.vertices) - 2 for p in o.data.polygons)

def main():
    A = args()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=A.src)
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    for o in bpy.context.scene.objects: o.select_set(o.type == 'MESH')
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1: bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    rep = {'source': os.path.basename(A.src), 'source_tris': tris(ob)}

    # ---- clean-up
    size = max(ob.dimensions)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    before_v = len(bm.verts)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=size * A.weld)
    rep['welded_verts'] = before_v - len(bm.verts)
    bmesh.ops.dissolve_degenerate(bm, dist=size * 1e-5, edges=bm.edges)
    # islands
    # (face objects, not f.index: indices are stale after remove_doubles and would split real parts into "junk")
    seen = set(); islands = []
    for f in bm.faces:
        if f in seen: continue
        stack = [f]; isl = []; seen.add(f)
        while stack:
            g = stack.pop(); isl.append(g)
            for e in g.edges:
                for h in e.link_faces:
                    if h not in seen: seen.add(h); stack.append(h)
        islands.append(isl)
    total = sum(f.calc_area() for f in bm.faces) or 1
    junk = [isl for isl in islands if sum(f.calc_area() for f in isl) < total * A.junk]
    bmesh.ops.delete(bm, geom=[f for isl in junk for f in isl], context='FACES')
    rep['islands'] = len(islands); rep['junk_islands_removed'] = len(junk)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(ob.data); bm.free()
    # imported custom split normals + sharp flags pin Decimate (it refuses to collapse across them)
    clear_normals(ob)
    for p in ob.data.polygons: p.use_smooth = True

    # ---- scale + origin (base centre)
    zs = [v.co.z for v in ob.data.vertices]
    s = A.height / (max(zs) - min(zs))
    xs = [v.co.x for v in ob.data.vertices]; ys = [v.co.y for v in ob.data.vertices]
    cx, cy, z0 = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2, min(zs)
    for v in ob.data.vertices:
        v.co = Vector(((v.co.x - cx) * s, (v.co.y - cy) * s, (v.co.z - z0) * s))
    ob.data.update(); bpy.context.view_layer.update(); rep['clean_tris'] = tris(ob); rep['dims_m'] = [round(d, 2) for d in ob.dimensions]

    # ---- textures
    for m in ob.data.materials:
        if not m or not m.use_nodes: continue
        for n in m.node_tree.nodes:
            if n.type == 'TEX_IMAGE' and n.image and max(n.image.size) > A.tex:
                n.image.scale(A.tex, A.tex)

    # ---- LODs
    targets = [] if A.lods == 'none' else [int(t) for t in A.lods.split(',') if t]
    lods = []
    for k, t in enumerate(targets):
        o = ob.copy(); o.data = ob.data.copy(); o.name = 'lod%d' % k; bpy.context.scene.collection.objects.link(o)
        cur = tris(o)
        if cur > t:
            d = o.modifiers.new('dec', 'DECIMATE'); d.ratio = max(0.0005, t / cur); d.use_collapse_triangulate = True
            bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier='dec')
        # NOTE: Decimate can also reach the target and still scramble a chart-soup texture (Phase 4: graffiti
        # wall). That cannot be detected from the mesh statistics, so always check the LOD sheet
        # (tools/blender/rr_lod_sheet.py) and re-run such an asset with --rebake always.
        if A.rebake == 'always' or (A.rebake == 'auto' and tris(o) > t * 1.3):
            nb = rebake(ob, t, A, 'lod%d' % k)
            bpy.data.objects.remove(o); nb.name = 'lod%d' % k; o = nb; rep.setdefault('rebaked', []).append(k)
        lods.append(o)
    rep['lod_tris'] = [tris(o) for o in lods]

    # ---- impostor (3 crossed quads)
    if A.impostor:
        imp = impostor(ob, A)
        if imp: lods.append(imp); rep['impostor_tris'] = tris(imp)
    bpy.data.objects.remove(ob)

    # ---- export
    for o in bpy.context.scene.objects: o.select_set(o in lods)
    bpy.ops.export_scene.gltf(filepath=A.out, export_format='GLB', use_selection=True, export_image_format='JPEG',
                              export_jpeg_quality=88, export_apply=True, export_yup=True)
    rep['out'] = os.path.basename(A.out); rep['bytes'] = os.path.getsize(A.out)
    print('RR_REPORT ' + json.dumps(rep))
    if A.report: json.dump(rep, open(A.report, 'w'), indent=1)

def quadric(o, target):
    """Quadric edge-collapse via pymeshlab (pip install pymeshlab). Unlike Blender's Decimate it keeps
    collapsing through non-manifold edges (edges with 3+ faces are everywhere in Meshy output)."""
    try:
        import pymeshlab, numpy as np
    except ImportError:
        return False
    me = o.data; me.calc_loop_triangles()
    V = np.array([v.co[:] for v in me.vertices], dtype=np.float64)
    F = np.array([t.vertices[:] for t in me.loop_triangles], dtype=np.int32)
    ms = pymeshlab.MeshSet(); ms.add_mesh(pymeshlab.Mesh(V, F))
    ms.meshing_merge_close_vertices(threshold=pymeshlab.PercentageValue(0.05))
    ms.meshing_decimation_quadric_edge_collapse(targetfacenum=int(target), preservenormal=True, planarquadric=True,
                                                 qualitythr=0.3, autoclean=True)
    m = ms.current_mesh(); V2, F2 = m.vertex_matrix(), m.face_matrix()
    me.clear_geometry(); me.from_pydata([tuple(v) for v in V2], [], [tuple(int(i) for i in f) for f in F2]); me.update()
    return True

def rebake(src, target, A, name):
    """Chart-soup fallback. Meshy meshes whose every UV chart is a separate island stall Decimate (and a
    decimate that is forced through them scrambles the texture). Instead: take a copy with NO UVs or
    materials (so seams no longer constrain the collapse), quadric-decimate the geometry, unwrap it with Smart UV
    Project and bake the source's base colour onto the new UVs (Cycles, selected-to-active)."""
    sc = bpy.context.scene
    o = src.copy(); o.data = src.data.copy(); o.name = name + '_rb'; sc.collection.objects.link(o)
    o.data.materials.clear()
    while o.data.uv_layers: o.data.uv_layers.remove(o.data.uv_layers[0])
    clear_normals(o)
    for s_ in sc.objects: s_.select_set(s_ is o)
    bpy.context.view_layer.objects.active = o
    if not quadric(o, target):          # pymeshlab missing: Blender Decimate (floors on non-manifold meshes)
        for _ in range(4):
            if tris(o) <= target * 1.05: break
            d = o.modifiers.new('dec', 'DECIMATE'); d.ratio = max(0.0005, target / tris(o)); d.use_collapse_triangulate = True
            bpy.ops.object.modifier_apply(modifier='dec')
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.004); bpy.ops.object.mode_set(mode='OBJECT')
    res = max(128, A.tex if target >= 2000 else A.tex // 2)
    img = bpy.data.images.new(os.path.splitext(os.path.basename(A.out))[0] + '_' + name, res, res)
    mat = bpy.data.materials.new(name + '_baked'); mat.use_nodes = True; nt = mat.node_tree
    tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = img; nt.nodes.active = tex
    bsdf = nt.nodes['Principled BSDF']; nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = 0.8
    o.data.materials.append(mat)
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 1
    src.select_set(True); o.select_set(True); bpy.context.view_layer.objects.active = o
    size = max(src.dimensions)
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, use_selected_to_active=True,
                        cage_extrusion=size * (0.01 if target >= 2000 else 0.04),
                        max_ray_distance=size * (0.04 if target >= 2000 else 0.15), margin=4)
    img.pack()
    for p in o.data.polygons: p.use_smooth = True
    return o

def impostor(ob, A):
    """Render ob from 3 directions (0°, 60°, 120°) into one alpha atlas; build 3 crossed quads."""
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.device = 'CPU'
    sc.render.film_transparent = True; sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
    res = max(128, A.tex // 2); sc.render.resolution_x = res; sc.render.resolution_y = res
    # albedo capture: every material becomes an unlit emission of its base colour and the view transform is
    # Standard, so the atlas holds the same colours as the LOD0 texture (the game lights the cards itself)
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = 0; sc.view_settings.gamma = 1
    w = sc.world or bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get('Background'); bg.inputs[1].default_value = 0.0
    for k, m0 in enumerate(ob.data.materials):
        if not m0 or not m0.use_nodes: continue
        m = m0.copy(); ob.data.materials[k] = m   # the LOD copies share the originals: never edit those
        nt = m.node_tree; out = next((n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'), None); bs = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if not out or not bs: continue
        em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = 1.0
        bc = bs.inputs['Base Color']
        if bc.links: nt.links.new(bc.links[0].from_socket, em.inputs['Color'])
        else: em.inputs['Color'].default_value = bc.default_value
        nt.links.new(em.outputs[0], out.inputs['Surface'])
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 0.0; sc.collection.objects.link(sun)
    W, D, H = ob.dimensions.x, ob.dimensions.y, ob.dimensions.z; R = max(W, D) / 2
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); cam.data.type = 'ORTHO'; cam.data.ortho_scale = max(2 * R, H) * 1.04
    sc.collection.objects.link(cam); sc.camera = cam
    import tempfile; tmp = tempfile.mkdtemp(prefix='rr_imp_'); files = []   # per run: parallel runs must not share renders
    for k, ang in enumerate((0, 60, 120)):
        a = math.radians(ang); dist = 10 * max(R, H)
        cam.location = (math.sin(a) * dist, -math.cos(a) * dist, H / 2); cam.rotation_euler = (math.pi / 2, 0, a)
        f = os.path.join(tmp, 'v%d.png' % k); sc.render.filepath = f; bpy.ops.render.render(write_still=True); files.append(f)
    # atlas: 3 views side by side (+ one empty cell) in a 2x2 grid
    atlas = bpy.data.images.new(os.path.splitext(os.path.basename(A.out))[0] + '_impostor', res * 2, res * 2, alpha=True)
    px = [0.0] * (res * 2 * res * 2 * 4)
    for k, f in enumerate(files):
        im = bpy.data.images.load(f); src = list(im.pixels); ox, oy = (k % 2) * res, (k // 2) * res
        for y in range(res):
            row = src[y * res * 4:(y + 1) * res * 4]; o = ((oy + y) * res * 2 + ox) * 4
            px[o:o + res * 4] = row
    atlas.pixels = px; atlas.pack()
    # 3 quads through the centre, each facing its render direction
    me = bpy.data.meshes.new('lodImp'); verts = []; faces = []; uvs = []; S = cam.data.ortho_scale / 2
    for k, ang in enumerate((0, 60, 120)):
        a = math.radians(ang); ux, uy = math.cos(a), math.sin(a); b = len(verts)
        zc = H / 2
        for sx, sz in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            verts.append((ux * S * sx, uy * S * sx, zc + S * sz))
        faces.append((b, b + 1, b + 2, b + 3))
        u0, v0 = (k % 2) * 0.5, (k // 2) * 0.5
        uvs += [(u0, v0), (u0 + 0.5, v0), (u0 + 0.5, v0 + 0.5), (u0, v0 + 0.5)]
    me.from_pydata(verts, [], faces); uvl = me.uv_layers.new(name='UVMap')
    for i, l in enumerate(me.loops): uvl.data[i].uv = uvs[l.vertex_index]
    mat = bpy.data.materials.new('impostor'); mat.use_nodes = True; nt = mat.node_tree
    bsdf = nt.nodes.get('Principled BSDF'); tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = atlas
    nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color']); nt.links.new(tex.outputs['Alpha'], bsdf.inputs['Alpha'])
    bsdf.inputs['Roughness'].default_value = 0.9
    try: mat.blend_method = 'CLIP'
    except Exception: pass
    me.materials.append(mat); o = bpy.data.objects.new('lodImp', me); sc.collection.objects.link(o)
    bpy.data.objects.remove(cam); bpy.data.objects.remove(sun)
    return o

if __name__ == '__main__':
    main()
