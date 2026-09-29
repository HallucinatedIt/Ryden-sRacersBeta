// Graphics V2 · LOD finishing for props exported by tools/blender/rr_prop_pipeline.py (or any GLB whose nodes are lod0, lod1, ...)
//
//   node tools/prop_lod.mjs in.glb out.glb [targets=3000,900,250] [maxError=0.03]
//
// Blender's Decimate (collapse) stalls on Meshy meshes that are non-manifold "chart soup" (it stops at
// roughly 10-16k triangles no matter the ratio). For every LOD above LOD0 that is still more than 30 %
// over its target, this runs meshoptimizer: first the topology-preserving simplifier, then, if that is
// blocked by UV seams too, the "sloppy" simplifier (it keeps existing vertices, so UVs and textures stay
// valid; fine for distant LODs). LOD0 is only touched if it is more than 3x over target.
// Unused vertices are compacted afterwards, nodes keep their lodN names (GFX.lod reads them).
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplifyPrimitive, prune } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

const [,, IN, OUT, T = '', E = '0.03'] = process.argv;
const targets = T ? T.split(',').map(Number) : [];
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(IN);
await doc.transform(weld());
const tri = p => (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3;
const nodes = doc.getRoot().listNodes().filter(n => n.getMesh()).sort((a, b) => a.getName().localeCompare(b.getName()));
const out = [];
nodes.forEach((n, k) => {
  const m = /lod(\d+)/.exec(n.getName()); const level = m ? +m[1] : k; const target = targets[level];
  for (const p of n.getMesh().listPrimitives()) {
    const before = tri(p);
    if (target && ((level > 0 && before > target * 1.3) || (level === 0 && before > target * 3))) {
      simplifyPrimitive(p, { simplifier: MeshoptSimplifier, ratio: target / before, error: +E, lockBorder: false });
      if (tri(p) > target * 1.3) {
        const pos = p.getAttribute('POSITION').getArray(), idx = p.getIndices();
        let res = idx.getArray();
        for (const err of [0.08, 0.2, 0.5]) { // widen the allowed error only as far as the target needs
          [res] = MeshoptSimplifier.simplifySloppy(new Uint32Array(idx.getArray()), new Float32Array(pos), 3, null, Math.floor(target) * 3, err);
          if (res.length / 3 <= target * 1.3) break;
        }
        idx.setArray(pos.length / 3 < 65536 ? new Uint16Array(res) : new Uint32Array(res));
      }
    }
    out.push(`${n.getName()}: ${before} -> ${tri(p)}${target ? ' (target ' + target + ')' : ''}`);
  }
});
// compact: drop vertices no longer referenced (sloppy leaves them in the buffers)
for (const mesh of doc.getRoot().listMeshes()) for (const p of mesh.listPrimitives()) {
  const idx = p.getIndices(); if (!idx) continue; const a = idx.getArray(); const used = new Map(); let n = 0;
  const remap = new Uint32Array(a.length); for (let i = 0; i < a.length; i++) { let v = used.get(a[i]); if (v === undefined) { v = n++; used.set(a[i], v); } remap[i] = v; }
  const order = new Uint32Array(n); for (const [o, v] of used) order[v] = o;
  for (const s of p.listSemantics()) { const at = p.getAttribute(s); const src = at.getArray(), sz = at.getElementSize(); const dst = new src.constructor(n * sz);
    for (let v = 0; v < n; v++) for (let c = 0; c < sz; c++) dst[v * sz + c] = src[order[v] * sz + c];
    const na = doc.createAccessor().setType(at.getType()).setArray(dst).setNormalized(at.getNormalized()).setBuffer(at.getBuffer()); p.setAttribute(s, na); }
  idx.setArray(n < 65536 ? new Uint16Array(remap) : remap);
}
await doc.transform(prune());
await io.write(OUT, doc);
console.log(out.join('\n'));
