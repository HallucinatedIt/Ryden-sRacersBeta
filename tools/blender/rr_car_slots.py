"""Ryden's Racers · Graphics V2 · Blender vehicle material-slot pipeline (Phase 3)

Meshy cars arrive as ONE baked material (atlas base colour + metal/roughness + normal), so paint, glass,
chrome, rubber and lights cannot shade differently. This script gives every face of the car a real
material slot and exports a GLB with named materials, keeping the geometry, UVs, node names and wheel
transforms exactly as they were (the game finds wheels by name and sizes the car from its bounds).

    blender -b -P tools/blender/rr_car_slots.py -- models/cars/gt40.glb models/cars/gt40_base.jpg models/cars/gt40_mr.jpg build/gt40.slots.glb --labels build/gt40.labels.json [--police] [--debug out.png] [--report out.json]
    python3 tools/blender/rr_car_slots.py ...        (with the bpy module)
    node tools/car_apply_slots.mjs models/cars/gt40.glb build/gt40.labels.json models/cars/gt40.v2.glb

The Blender GLB (build/*.slots.glb) is the editable result: open it, fix faces by hand (select faces ->
assign the car_* material), export it, then write labels from it without re-classifying:
    blender -b -P tools/blender/rr_car_slots.py -- build/gt40.slots.glb base.jpg mr.jpg /tmp/x.glb --keep-slots --labels build/gt40.labels.json
(the export regroups triangles by material, so these labels are matched to the original by position). The game ships the output of car_apply_slots.mjs: the ORIGINAL geometry, byte for
byte (the car's bounds size its collision box, so they must not move by a single float), with each
triangle list split into primitives with the named slot materials.

Slots (material names; the game maps them in js/gfx/vehicles.js):
    car_paint  car_glass  car_lights  car_chrome  car_rubber  car_tire  car_wheel  car_interior  car_trim  car_emissive

How faces are classified (per face: the atlas sampled at the UV centroid and the three corners, plus the
face's place on the car):
    body   emissive  (--police only) roof-top, saturated red/blue: the light bar
           lights    front/rear 8 % of the length, mid height, glossy and facing straight out, bright-neutral
                     (headlamps) or strongly saturated red/amber (tail, indicators)
           glass     dark and glossy, upper half of the body within the cabin length (not wings/spoilers at
                     the ends), or dark blue-grey tinted and glossy
           chrome    metallic, or mid-grey neutral and very glossy (glossy white is paint)
           rubber    near-black and very rough, not on the upper body (seals, bumper strips)
           trim      dark, semi-gloss plastic on the lower body (sills, grilles, diffusers); dark on the
                     upper / upward-facing body is black paint
           interior  faces inside the cabin that point inwards
           paint     everything else
    wheels tire      dark, rough, outer part of the wheel disc
           chrome    metallic and glossy (polished rims)
           wheel     the rest of the rim / hub / brake
Then a 2-pass majority filter over edge-neighbours removes speckle (single faces that disagree with every
neighbour), except for lights/emissive which are small by nature; and a spatial cluster of lights faces
covering more than 1.5 % of the body's surface (4 % for a light bar) is livery, not a lens: back to paint.

This is automatic and heuristic: it is right for most of the surface of a clean car and wrong on some
faces. Check the --debug render (false colour per slot) and fix faces by hand in Blender where it matters
(select faces -> assign material slot). docs/graphics-v2/17-vehicle-pipeline.md lists which cars pass as is.
"""
import bpy, bmesh, sys, os, json, math, argparse, colorsys
from mathutils import Vector
import numpy as np

SLOTS = ['car_paint', 'car_glass', 'car_lights', 'car_chrome', 'car_rubber', 'car_tire', 'car_wheel', 'car_interior', 'car_trim', 'car_emissive']
DEBUG = {  # false colours for the check render
    'car_paint': (0.85, 0.15, 0.1), 'car_glass': (0.1, 0.6, 1.0), 'car_lights': (1.0, 1.0, 0.2), 'car_chrome': (0.9, 0.9, 0.95),
    'car_rubber': (0.15, 0.15, 0.15), 'car_tire': (0.05, 0.05, 0.05), 'car_wheel': (0.55, 0.35, 0.8), 'car_interior': (0.3, 0.8, 0.3),
    'car_trim': (0.45, 0.45, 0.4), 'car_emissive': (1.0, 0.3, 1.0)}

def args():
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    p = argparse.ArgumentParser()
    p.add_argument('src'); p.add_argument('base'); p.add_argument('mr'); p.add_argument('out')
    p.add_argument('--police', action='store_true', help='look for a roof light bar (emissive slot)')
    p.add_argument('--debug', default='', help='render a false-colour slot check image')
    p.add_argument('--report', default='')
    p.add_argument('--labels', default='', help='write the slot of every triangle (per glTF mesh) as JSON, for tools/car_apply_slots.mjs')
    p.add_argument('--keep-slots', action='store_true', help='SRC is a hand-edited *.slots.glb: keep its material assignment, just write labels (matched by position)')
    return p.parse_args(a)

def load_img(path):
    im = bpy.data.images.load(path); w, h = im.size
    px = np.array(im.pixels[:], dtype=np.float32).reshape(h, w, 4)[..., :3]
    return px, w, h

def sample(px, w, h, uv):
    x = int((uv[0] % 1.0) * (w - 1)); y = int((uv[1] % 1.0) * (h - 1))   # Blender images: row 0 = bottom = v 0
    return px[y, x]

def classify_face(f, uvl, B, M, box, wheel, police, center):
    uvs = [l[uvl].uv for l in f.loops]; cu = sum((u for u in uvs), Vector((0, 0))) / len(uvs)
    pts = [cu] + [cu.lerp(u, 0.7) for u in uvs]
    cols = np.array([sample(*B, p) for p in pts]).mean(0); mr = np.array([sample(*M, p) for p in pts]).mean(0)
    r, g, b = [float(c) for c in cols]; mx, mn = max(r, g, b), min(r, g, b); sat = (mx - mn) / (mx + 1e-5); lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    hue = colorsys.rgb_to_hsv(r, g, b)[0] * 360
    rough, metal = float(mr[1]), float(mr[2])
    c = f.calc_center_median(); n = f.normal
    lo, hi = box; sz = hi - lo
    nx = (c.x - (lo.x + hi.x) / 2) / (sz.x / 2 + 1e-6); ny = (c.z - lo.z) / (sz.z + 1e-6); nf = ((lo.y + hi.y) / 2 - c.y) / (sz.y / 2 + 1e-6)   # Blender: z up; glTF +z (the car's front) imports as -y, so nf > 0 = front
    red = (hue < 20 or hue > 340) and sat > 0.5; amber = 20 <= hue < 55 and sat > 0.55; blue = 190 < hue < 260 and sat > 0.45
    if wheel:
        wc, wr = wheel   # wheel centre (x,z plane radius)
        rad = math.hypot(c.y - wc.y, c.z - wc.z) / (wr + 1e-6)
        if metal > 0.5 and rough < 0.35: return 'car_chrome'
        if mx < 0.3 and sat < 0.35 and (rough > 0.4 or rad > 0.72): return 'car_tire'
        return 'car_wheel'
    if police and ny > 0.82 and abs(nf) < 0.6 and (red or blue) and lum > 0.08: return 'car_emissive'
    fwd = -n.y if nf > 0 else n.y          # how squarely the face looks out of the nose / tail (Blender -y = front)
    if abs(nf) > 0.84 and 0.15 < ny < 0.75 and fwd > 0.55 and rough < 0.4:   # lenses: glossy, facing straight out, at the very ends
        if (lum > 0.62 and sat < 0.3) or ((red or amber) and lum > 0.22 and sat > 0.6 and nf < 0) or (amber and lum > 0.3): return 'car_lights'
    if ny > 0.45 and n.z > -0.3 and abs(nf) < 0.8 and ((mx < 0.2 and rough < 0.36) or (mx < 0.32 and b > r + 0.03 and rough < 0.4 and sat < 0.45)): return 'car_glass'
    if metal > 0.5 or (sat < 0.1 and 0.5 < lum < 0.82 and rough < 0.25): return 'car_chrome'   # glossy WHITE is paint, not chrome
    inward = (c - center).normalized().dot(n) < -0.35
    if inward and 0.3 < ny < 0.85 and abs(nx) < 0.7 and abs(nf) < 0.6: return 'car_interior'
    up = n.z > 0.5 or ny > 0.55          # upper body / upward-facing: dark there is black PAINT (livery), not plastic
    if mx < 0.12 and rough > 0.7 and not up: return 'car_rubber'
    if mx < 0.2 and 0.34 <= rough <= 0.7 and not up and ny < 0.42: return 'car_trim'
    return 'car_paint'

def smooth(bm, lab, keep=('car_lights', 'car_emissive'), passes=2):
    faces = list(bm.faces)
    for _ in range(passes):
        new = dict(lab)
        for f in faces:
            if lab[f.index] in keep: continue
            nb = [lab[h.index] for e in f.edges for h in e.link_faces if h is not f]
            if not nb: continue
            cnt = {}
            for x in nb: cnt[x] = cnt.get(x, 0) + 1
            best = max(cnt, key=cnt.get)
            if lab[f.index] not in cnt and cnt[best] >= 2: new[f.index] = best
        lab = new
    return lab

def cap_islands(bm, lab, slot, max_share, fallback='car_paint'):
    """A lens is small: a cluster of 'lights' (or light-bar) faces covering more than max_share of the
    mesh's surface is livery that happens to look like a lens (a yellow duck's whole front) and goes back
    to paint. Clusters are spatial (centroids within ~2.5 % of the car's size), not edge-connected:
    Meshy meshes are not welded, so every UV chart is its own island."""
    faces = [f for f in bm.faces if lab[f.index] == slot]
    if not faces: return lab, 0
    total = sum(f.calc_area() for f in bm.faces) or 1
    lo = Vector([min(v.co[i] for v in bm.verts) for i in range(3)]); hi = Vector([max(v.co[i] for v in bm.verts) for i in range(3)])
    cell = max((hi - lo).length * 0.025, 1e-4)
    cen = {f.index: f.calc_center_median() for f in faces}; grid = {}
    for f in faces:
        c = cen[f.index]; grid.setdefault((int(c.x // cell), int(c.y // cell), int(c.z // cell)), []).append(f)
    par = {f.index: f.index for f in faces}
    def find(x):
        while par[x] != x: par[x] = par[par[x]]; x = par[x]
        return x
    for (gx, gy, gz), L in grid.items():
        near = [g for dx in (-1, 0, 1) for dy in (-1, 0, 1) for dz in (-1, 0, 1) for g in grid.get((gx + dx, gy + dy, gz + dz), [])]
        for f in L:
            for g in near:
                if g is not f and (cen[f.index] - cen[g.index]).length < cell: par[find(f.index)] = find(g.index)
    groups = {}
    for f in faces: groups.setdefault(find(f.index), []).append(f)
    reverted = 0
    for L in groups.values():
        if sum(f.calc_area() for f in L) > total * max_share:
            for f in L: lab[f.index] = fallback
            reverted += len(L)
    return lab, reverted

def main():
    A = args()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=A.src)
    B = load_img(A.base); M = load_img(A.mr)
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    # car bounds from everything; wheel discs from the wheel meshes
    allv = [o.matrix_world @ v.co for o in meshes for v in o.data.vertices]
    lo = Vector([min(v[i] for v in allv) for i in range(3)]); hi = Vector([max(v[i] for v in allv) for i in range(3)]); center = (lo + hi) / 2
    src_mat = next((s.material for o in meshes for s in o.material_slots if s.material), None)
    mats = {}
    for s in SLOTS:
        m = src_mat.copy() if src_mat else bpy.data.materials.new(s); m.name = s; mats[s] = m
    rep = {'source': os.path.basename(A.src), 'meshes': {}, 'slots': {s: 0 for s in SLOTS}}
    global LABELS; LABELS = {}
    for o in meshes:
        wheel = None
        if 'wheel' in o.name.lower():
            ws = [o.matrix_world @ v.co for v in o.data.vertices]; wlo = Vector([min(v[i] for v in ws) for i in range(3)]); whi = Vector([max(v[i] for v in ws) for i in range(3)])
            wheel = ((wlo + whi) / 2, max(whi.z - wlo.z, whi.y - wlo.y) / 2)
        me = o.data; bm = bmesh.new(); bm.from_mesh(me); bm.faces.ensure_lookup_table(); bm.transform(o.matrix_world); bm.normal_update()
        uvl = bm.loops.layers.uv.active
        if A.keep_slots:   # hand-edited: the material each face already has is the answer
            names = [m.name.split('.')[0] if m else 'car_paint' for m in me.materials]
            lab = {f.index: (names[f.material_index] if f.material_index < len(names) and names[f.material_index] in SLOTS else 'car_paint') for f in bm.faces}
        else:
            lab = {f.index: classify_face(f, uvl, B, M, (lo, hi), wheel, A.police, center) for f in bm.faces}
            lab = smooth(bm, lab)
        if not wheel and not A.keep_slots:
            lab, r1 = cap_islands(bm, lab, 'car_lights', 0.015); lab, r2 = cap_islands(bm, lab, 'car_emissive', 0.04)
            rep.setdefault('reverted', {})[o.name] = r1 + r2
        bm.free()
        me.materials.clear()
        used = [s for s in SLOTS if s in lab.values()]
        for s in used: me.materials.append(mats[s])
        idx = {s: k for k, s in enumerate(used)}
        for p in me.polygons: p.material_index = idx[lab[p.index]]
        # per-triangle labels in glTF order (the importer creates one polygon per glTF triangle, in order) +
        # a few centroids in glTF space so the apply step can verify the order before touching anything
        if len(me.polygons) and all(len(p.vertices) == 3 for p in me.polygons):
            mw = o.matrix_world; chk = []
            for p in list(me.polygons)[:: max(1, len(me.polygons) // 40)]:
                c = mw @ p.center; chk.append([p.index, round(c.x, 5), round(c.z, 5), round(-c.y, 5)])   # Blender (x, y, z) -> glTF (x, z, -y)
            if A.keep_slots:   # a re-exported file is grouped by material: match triangles by centroid instead of order
                LABELS[me.name.split('.')[0]] = {'centroids': [[round((mw @ p.center).x, 5), round((mw @ p.center).z, 5), round(-(mw @ p.center).y, 5), SLOTS.index(lab[p.index])] for p in me.polygons]}
            else:
                LABELS[me.name] = {'slots': [SLOTS.index(lab[p.index]) for p in me.polygons], 'check': chk}
        counts = {s: sum(1 for v in lab.values() if v == s) for s in used}
        rep['meshes'][o.name] = counts
        for s, c in counts.items(): rep['slots'][s] += c
    tot = sum(rep['slots'].values()) or 1
    rep['share'] = {s: round(c / tot, 3) for s, c in rep['slots'].items() if c}
    for o in bpy.context.scene.objects: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=A.out, export_format='GLB', use_selection=True, export_image_format='JPEG', export_jpeg_quality=90, export_yup=True, export_apply=False)
    rep['bytes'] = os.path.getsize(A.out)
    if A.labels: json.dump({'slots': SLOTS, 'meshes': LABELS}, open(A.labels, 'w'))
    print('RR_REPORT ' + json.dumps(rep))
    if A.debug: debug_render(meshes, os.path.abspath(A.debug))
    if A.report: json.dump(rep, open(A.report, 'w'), indent=1)

def debug_render(meshes, path):
    """False colour per slot from 3 sides, side by side (front 3/4, rear 3/4, top)."""
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.samples = 8; sc.cycles.device = 'CPU'
    sc.view_settings.view_transform = 'Standard'; sc.render.resolution_x = 480; sc.render.resolution_y = 300
    for s, col in DEBUG.items():
        m = bpy.data.materials.get(s)
        if not m: continue
        m.use_nodes = True; nt = m.node_tree; out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL')
        em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (*col, 1); em.inputs['Strength'].default_value = 1
        nt.links.new(em.outputs[0], out.inputs['Surface'])
    w = sc.world or bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.5, 0.52, 0.55, 1)
    allv = [o.matrix_world @ v.co for o in meshes for v in o.data.vertices]
    lo = Vector([min(v[i] for v in allv) for i in range(3)]); hi = Vector([max(v[i] for v in allv) for i in range(3)]); c = (lo + hi) / 2; R = (hi - lo).length
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    files = []
    for k, d in enumerate([Vector((1.2, 1.4, 0.7)), Vector((-1.2, -1.4, 0.7)), Vector((0.01, 0.2, 1.6))]):
        cam.location = c + d.normalized() * R * 1.25; cam.rotation_euler = (c - cam.location).to_track_quat('-Z', 'Y').to_euler()
        f = path + '.%d.png' % k; sc.render.filepath = f; bpy.ops.render.render(write_still=True); files.append(f)
    try:
        from PIL import Image
        ims = [Image.open(f) for f in files]; S = Image.new('RGB', (480 * 3, 300))
        for k, im in enumerate(ims): S.paste(im.convert('RGB'), (k * 480, 0))
        S.save(path)
        for f in files: os.remove(f)
    except Exception:
        pass

if __name__ == '__main__':
    main()
