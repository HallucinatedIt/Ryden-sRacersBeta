"""Ryden's Racers · LOD check sheet: renders every mesh node of a prop GLB (lod0, lod1, lod2, lodImp) separately.
    python3 tools/blender/rr_lod_sheet.py prop.glb out_dir     (bpy module) -> out_dir/<prop>__<node>__<tris>.png
Look at every level: a smeared texture on a Decimate LOD means the asset needs --rebake always."""
import bpy, sys, math, os
from mathutils import Vector
src, outdir = sys.argv[1], sys.argv[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
sc=bpy.context.scene; sc.render.engine='CYCLES'; sc.cycles.samples=12; sc.cycles.device='CPU'
sc.render.resolution_x=sc.render.resolution_y=256; sc.render.film_transparent=False
w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True; w.node_tree.nodes['Background'].inputs[0].default_value=(0.55,0.62,0.72,1)
sun=bpy.data.objects.new('s',bpy.data.lights.new('s','SUN')); sun.data.energy=3; sun.rotation_euler=(0.7,0.2,0.9); sc.collection.objects.link(sun)
obs=sorted([o for o in sc.objects if o.type=='MESH'], key=lambda o:o.name)
cam=bpy.data.objects.new('c',bpy.data.cameras.new('c')); sc.collection.objects.link(cam); sc.camera=cam
base=os.path.splitext(os.path.basename(src))[0]
for o in obs:
    for p in obs: p.hide_render = p is not o
    bb=[o.matrix_world@Vector(c) for c in o.bound_box]; mn=Vector([min(v[i] for v in bb) for i in range(3)]); mx=Vector([max(v[i] for v in bb) for i in range(3)])
    c=(mn+mx)/2; r=(mx-mn).length/2
    d=Vector((1,-1.3,0.6)).normalized()*r*2.6
    cam.location=c+d; cam.rotation_euler=(-d).to_track_quat('-Z','Y').to_euler()
    n=sum(len(p.vertices)-2 for p in o.data.polygons)
    sc.render.filepath=os.path.join(outdir,f'{base}__{o.name}__{n}.png'); bpy.ops.render.render(write_still=True)
