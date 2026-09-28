// Graphics V2 · game-ready prop from a Blender/Meshy export: LOD1 + node names + weld
//
//   node tools/prop_lod.mjs in.glb out.glb [lod1Ratio=0.25] [lod1MaxError=0.02]
//
// Input: a GLB exported by the Blender step (docs/graphics-v2/08-asset-optimization.md) with two meshes,
// LOD0 first and LOD1 second (Blender's Decimate stops at ~20k triangles on Meshy meshes because they are
// made of thousands of loose islands). This welds both, simplifies LOD1 with meshoptimizer (UVs kept,
// so the same textures fit) and names the nodes lod0 / lod1, which GFX.lod.makeLOD() reads.
// Texture compression (KTX2) and Meshopt geometry compression run afterwards with the gltf-transform CLI.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplifyPrimitive, prune, dedup } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

const [,, IN, OUT, R='0.25', E='0.02'] = process.argv;
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(IN);
await doc.transform(weld());
const nodes = doc.getRoot().listNodes().filter(n => n.getMesh());
const tri = p => (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3;
nodes.forEach((n, k) => {
  n.setName('lod' + k);
  if (k === 1) for (const p of n.getMesh().listPrimitives()) {
    const before = tri(p);
    simplifyPrimitive(p, { simplifier: MeshoptSimplifier, ratio: +R, error: +E, lockBorder: false });
    // Meshy atlases are "chart soup": UV seams everywhere stop the topology-preserving simplifier. For a
    // distant LOD fall back to meshopt's sloppy simplifier (keeps existing vertices, so UVs stay valid).
    if (tri(p) > before * 0.6) {
      const pos = p.getAttribute('POSITION').getArray(), idx = p.getIndices();
      const src = new Uint32Array(idx.getArray()); const target = Math.floor(before * +R) * 3;
      const [out] = MeshoptSimplifier.simplifySloppy(src, new Float32Array(pos), 3, null, target, 0.05);
      idx.setArray(pos.length / 3 < 65536 ? new Uint16Array(out) : new Uint32Array(out));
    }
    console.log(`lod1: ${before} -> ${tri(p)} triangles`);
  }
  else console.log(`lod${k}: ${n.getMesh().listPrimitives().reduce((s, p) => s + tri(p), 0)} triangles`);
});
await doc.transform(prune());
await io.write(OUT, doc);
