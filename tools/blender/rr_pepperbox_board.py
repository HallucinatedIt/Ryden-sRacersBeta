# Ryden's Racers · Pepperbox TV roadside billboard (one structure, the face is swapped per show in the game)
#
#   python3 tools/blender/rr_pepperbox_board.py -- <texdir> <face.jpg> <out.glb> [pole_lift_m]
#
# pole_lift_m > 0 builds the city version (Alondra, Sweet Justice): the same board lifted onto one tall steel
# monopole so it reads above the rooftops, with a caged ladder up the pole instead of the two ground columns.
#
# Built to sit next to the Maximus Knives board: a ground-standing steel bulletin, ~19 x 8.6 m, face 17 x 6.12 m
# (2.78:1, the shape of Pepperbox's hero-web banners), catwalk with railing and a Pepperbox TV plate on the kick
# board, five gooseneck lamps, a ladder, back bracing and two columns. Front = Blender -Y (glTF +Z), like knives.glb.
# One mesh per material: pb_face (the show), pb_steel, pb_back, pb_grate (alpha), pb_lamp_lens (emissive), pb_plate.
import bpy, bmesh, sys, math, os
from mathutils import Vector, Matrix

args = sys.argv[sys.argv.index('--') + 1:]
texdir, face_img, out = args[:3]; LIFT = float(args[3]) if len(args) > 3 else 0.0
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

FW, FH = 17.0, 6.12           # face
ZB = 1.95 + LIFT; ZT = ZB + FH       # face bottom / top
YF = -0.36                    # face plane (front)

def mat(name, img=None, color=(1, 1, 1, 1), rough=0.6, metal=0.0, emit=None, alpha=False, mr=None):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = color; b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if img:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(img); nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
        if alpha: nt.links.new(t.outputs['Alpha'], b.inputs['Alpha']); m.blend_method = 'CLIP' if hasattr(m, 'blend_method') else None
    if mr:
        t2 = nt.nodes.new('ShaderNodeTexImage'); t2.image = bpy.data.images.load(mr); t2.image.colorspace_settings.name = 'Non-Color'
        sep = nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(t2.outputs['Color'], sep.inputs[0])
        nt.links.new(sep.outputs['Green'], b.inputs['Roughness']); nt.links.new(sep.outputs['Blue'], b.inputs['Metallic'])
    if emit is not None:
        b.inputs['Emission Color'].default_value = emit; b.inputs['Emission Strength'].default_value = 1.0
    return m

M = {
    'face': mat('pb_face', face_img, rough=0.42),
    'steel': mat('pb_steel', os.path.join(texdir, 'steel.jpg'), rough=0.6, metal=0.7, mr=os.path.join(texdir, 'steel_mr.png')),
    'back': mat('pb_back', os.path.join(texdir, 'back.jpg'), rough=0.7, metal=0.3),
    'grate': mat('pb_grate', os.path.join(texdir, 'grate.png'), rough=0.6, metal=0.7, alpha=True),
    'lens': mat('pb_lamp_lens', color=(1, 0.95, 0.85, 1), rough=0.2, emit=(1, 0.93, 0.8, 1)),
    'plate': mat('pb_plate', os.path.join(texdir, 'pb_plate.png'), rough=0.35, metal=0.1),
}
BM = {k: bmesh.new() for k in M}

def box(key, c, s, rot=None, uvs=1.0):
    """axis box: centre c, size s (x,y,z); optional rotation matrix; cube-projected UVs (uvs m per tile)"""
    b = BM[key]; r = rot or Matrix.Identity(3); hx, hy, hz = s[0] / 2, s[1] / 2, s[2] / 2
    P = [Vector(c) + r @ Vector((x, y, z)) for x in (-hx, hx) for y in (-hy, hy) for z in (-hz, hz)]
    V = [b.verts.new(p) for p in P]
    F = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    uvl = b.loops.layers.uv.verify()
    for f in F:
        face = b.faces.new([V[i] for i in f]); n = face.normal; a = max(range(3), key=lambda k: abs(n[k]))
        ax = [(1, 2), (0, 2), (0, 1)][a]
        for lp in face.loops: co = lp.vert.co; lp[uvl].uv = (co[ax[0]] / uvs, co[ax[1]] / uvs)
    return b

def quad(key, pts, uv):
    b = BM[key]; uvl = b.loops.layers.uv.verify(); f = b.faces.new([b.verts.new(Vector(p)) for p in pts])
    for lp, u in zip(f.loops, uv): lp[uvl].uv = u
    return f

def beam(key, a, b_, w, d=None):
    """box from point a to point b, cross-section w x d"""
    a, b_ = Vector(a), Vector(b_); v = b_ - a; L = v.length; z = v.normalized()
    x = z.cross(Vector((0, 0, 1))) if abs(z.z) < 0.95 else z.cross(Vector((1, 0, 0))); x.normalize(); y = z.cross(x)
    r = Matrix((x, y, z)).transposed(); box(key, (a + b_) / 2, (w, d or w, L), r)

# ---- face (the show) and frame
quad('face', [(-FW / 2, YF, ZB), (FW / 2, YF, ZB), (FW / 2, YF, ZT), (-FW / 2, YF, ZT)], [(0, 0), (1, 0), (1, 1), (0, 1)])
fr = 0.22
for z in (ZB - fr / 2, ZT + fr / 2): box('steel', (0, YF + 0.02, z), (FW + 2 * fr, 0.34, fr))
for x in (-FW / 2 - fr / 2, FW / 2 + fr / 2): box('steel', (x, YF + 0.02, (ZB + ZT) / 2), (fr, 0.34, FH + 2 * fr))
# back panel (a shallow box behind the face)
box('back', (0, YF + 0.2, (ZB + ZT) / 2), (FW, 0.32, FH), uvs=FW / 1.0)
BK = YF + 0.36   # back surface y
# ---- back structure: 3 stringers, ribs every ~2.8 m, cross braces, 2 columns
for z in (ZB + 0.5, (ZB + ZT) / 2, ZT - 0.5): box('steel', (0, BK + 0.14, z), (FW - 0.2, 0.22, 0.26))
ribs = [(-FW / 2 + 0.4) + k * (FW - 0.8) / 6 for k in range(7)]
for x in ribs: box('steel', (x, BK + 0.34, (ZB + ZT) / 2), (0.14, 0.14, FH - 0.2))
for i in range(6):
    x0, x1 = ribs[i], ribs[i + 1]
    if i % 2 == 0: beam('steel', (x0, BK + 0.36, ZB + 0.5), (x1, BK + 0.36, ZT - 0.5), 0.08)
    else: beam('steel', (x0, BK + 0.36, ZT - 0.5), (x1, BK + 0.36, ZB + 0.5), 0.08)
CX = 5.2; CY = BK + 0.75
if LIFT <= 0:
    for x in (-CX, CX):
        box('steel', (x, CY, (ZT - 0.4) / 2), (0.55, 0.55, ZT - 0.4))                  # column
        box('steel', (x, CY, 0.04), (1.3, 1.3, 0.08))                                  # base plate
        box('steel', (x, CY - 0.36, ZT - 1.2), (0.3, 0.5, 0.3))                        # head bracket
        for z in (ZB + 0.5, (ZB + ZT) / 2, ZT - 0.5): box('steel', (x, (BK + CY) / 2 + 0.05, z), (0.3, CY - BK, 0.2))
        beam('steel', (x, CY, 0.6), (x + (1.6 if x < 0 else -1.6), CY, ZB + 0.3), 0.16)  # knee brace
    box('steel', (CX + 0.45, CY - 0.1, 1.6), (0.5, 0.25, 0.7))                        # electrical box
else:
    # monopole: 16-sided tapered column, base flange, head frame tying into the stringers
    b = BM['steel']; uvl = b.loops.layers.uv.verify(); n = 16; PY = CY + 0.25; z1 = ZB + 1.2
    ring = lambda z, r: [b.verts.new((math.cos(2 * math.pi * k / n) * r, PY + math.sin(2 * math.pi * k / n) * r, z)) for k in range(n)]
    lo, hi = ring(0.0, 0.62), ring(z1, 0.45)
    for k in range(n):
        f = b.faces.new([lo[k], lo[(k + 1) % n], hi[(k + 1) % n], hi[k]])
        for lp, uv in zip(f.loops, [(k / n * 2, 0), ((k + 1) / n * 2, 0), ((k + 1) / n * 2, z1 / 2), (k / n * 2, z1 / 2)]): lp[uvl].uv = uv
    box('steel', (0, PY, 0.05), (1.8, 1.8, 0.1)); box('steel', (0, PY, 0.5), (1.5, 1.5, 0.12))       # flange + stiffener ring
    for z in (ZB + 0.5, (ZB + ZT) / 2, ZT - 0.5): box('steel', (0, (BK + PY) / 2 + 0.05, z), (0.5, PY - BK, 0.3))
    for x in (-CX, CX):
        beam('steel', (0, PY, ZB - 0.6), (x, BK + 0.3, ZB + 0.5), 0.2)                      # V head frame
        box('steel', (x, (BK + PY) / 2, (ZB + ZT) / 2), (0.25, PY - BK + 0.1, FH - 1.0))
    box('steel', (0, PY, ZB - 0.6), (2.4, 0.5, 0.4))                                        # head plate
    box('steel', (0.75, PY, 1.9), (0.5, 0.26, 0.75))                                        # electrical box
    # caged ladder up the pole (from 3 m, anti-climb) to the catwalk
    LYp = PY - 0.75; top = ZB - 0.3
    for dx in (-0.22, 0.22): box('steel', (dx, LYp, (3.0 + top) / 2), (0.06, 0.06, top - 3.0))
    for k in range(int((top - 3.0) / 0.3)): box('steel', (0, LYp, 3.15 + k * 0.3), (0.44, 0.04, 0.04))
    for k in range(int((top - 5.0) / 1.2)):
        z = 5.0 + k * 1.2; beam('steel', (-0.36, LYp, z), (-0.36, LYp - 0.7, z), 0.04); beam('steel', (0.36, LYp, z), (0.36, LYp - 0.7, z), 0.04); beam('steel', (-0.36, LYp - 0.7, z), (0.36, LYp - 0.7, z), 0.04)
    beam('steel', (0, LYp, top), (0, YF - 0.2, top), 0.08)                                  # step-off to the catwalk
# ---- catwalk (front), brackets, railing, kick board + Pepperbox plate
CW0, CW1 = YF - 1.25, YF - 0.12; ZC = ZB - 0.32
quad('grate', [(-FW / 2 - 0.3, CW0, ZC), (FW / 2 + 0.3, CW0, ZC), (FW / 2 + 0.3, CW1, ZC), (-FW / 2 - 0.3, CW1, ZC)],
     [(0, 0), ((FW + 0.6) / 0.64, 0), ((FW + 0.6) / 0.64, (CW1 - CW0) / 0.64), (0, (CW1 - CW0) / 0.64)])
for y in (CW0, CW1): box('steel', (0, y, ZC - 0.06), (FW + 0.6, 0.08, 0.14))
brk = [-FW / 2 + 0.2 + k * (FW - 0.4) / 6 for k in range(7)]
for x in brk:
    box('steel', (x, (CW0 + CW1) / 2, ZC - 0.1), (0.1, CW1 - CW0, 0.12))
    beam('steel', (x, CW0 + 0.1, ZC - 0.12), (x, BK - 0.05, ZC - 1.2), 0.09)    # diagonal bracket to the back
    box('steel', (x, BK - 0.05, (ZB - 0.1 + ZC - 1.2) / 2), (0.1, 0.1, ZB - 0.1 - (ZC - 1.2)))   # hanger from the frame
box('steel', (0, BK - 0.05, ZC - 1.2), (FW - 0.2, 0.16, 0.16))                    # anchor rail for the brackets
# railing
RZ = ZC + 1.05; RY = CW0 + 0.04
box('steel', (0, RY, RZ), (FW + 0.6, 0.06, 0.06)); box('steel', (0, RY, ZC + 0.55), (FW + 0.6, 0.04, 0.04))
for k in range(13):
    x = -FW / 2 - 0.26 + k * (FW + 0.52) / 12; box('steel', (x, RY, ZC + 0.52), (0.06, 0.06, 1.06))
for x in (-FW / 2 - 0.27, FW / 2 + 0.27): box('steel', (x, (CW0 + CW1) / 2, ZC + 0.52), (0.05, CW1 - CW0, 0.05))
# kick board, the Pepperbox TV plate in the middle of it (facing the road)
box('steel', (0, CW0 - 0.02, ZC + 0.12), (FW + 0.6, 0.03, 0.2))
PW, PH = 3.4, 0.53
quad('plate', [(-PW / 2, CW0 - 0.06, ZC - 0.62), (PW / 2, CW0 - 0.06, ZC - 0.62), (PW / 2, CW0 - 0.06, ZC - 0.62 + PH), (-PW / 2, CW0 - 0.06, ZC - 0.62 + PH)],
     [(0, 0), (1, 0), (1, 1), (0, 1)])
box('steel', (0, CW0 - 0.03, ZC - 0.62 + PH / 2), (PW + 0.12, 0.04, PH + 0.12))    # plate backing
for x in (-PW / 2 + 0.3, PW / 2 - 0.3): box('steel', (x, CW0 - 0.02, ZC - 0.2), (0.06, 0.05, 0.5))   # hangers
# ---- ladder (left), ground to catwalk
LX = -FW / 2 - 0.1; LY = CW0 - 0.35
if LIFT <= 0:
    for dx in (-0.22, 0.22): box('steel', (LX + dx, LY, (ZC + 1.0) / 2), (0.06, 0.06, ZC + 1.0))
    for k in range(int(ZC / 0.3)): box('steel', (LX, LY, 0.3 + k * 0.3), (0.44, 0.04, 0.04))
# ---- 5 gooseneck lamps over the top, aimed down at the face
for k in range(5):
    x = -FW / 2 + FW * (k + 0.5) / 5
    beam('steel', (x, YF + 0.05, ZT + 0.2), (x, YF - 0.5, ZT + 0.95), 0.07)
    beam('steel', (x, YF - 0.5, ZT + 0.95), (x, YF - 1.25, ZT + 0.9), 0.07)
    rot = Matrix.Rotation(math.radians(-32), 3, 'X')
    box('steel', (x, YF - 1.35, ZT + 0.82), (0.78, 0.42, 0.18), rot)
    c = Vector((x, YF - 1.35, ZT + 0.82)) + rot @ Vector((0, 0, -0.095)); ex = rot @ Vector((0.34, 0, 0)); ey = rot @ Vector((0, 0.17, 0))
    quad('lens', [c - ex - ey, c - ex + ey, c + ex + ey, c + ex - ey], [(0, 0), (0, 1), (1, 1), (1, 0)])

# ---- to objects (one per material)
col = sc.collection
for k, b in BM.items():
    me = bpy.data.meshes.new('pb_' + k); b.normal_update(); b.to_mesh(me); b.free(); me.materials.append(M[k])
    ob = bpy.data.objects.new('pb_' + k, me); col.objects.link(ob)
    for p in me.polygons: p.use_smooth = False
tris = sum(len(o.data.polygons) * 2 for o in col.objects)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_yup=True, export_apply=True, export_image_format='AUTO', export_jpeg_quality=88)
print('PBBOARD', out, 'objects', len(col.objects), 'quads', tris // 2)
