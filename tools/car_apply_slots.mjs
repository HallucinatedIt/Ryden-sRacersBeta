// Graphics V2 · Phase 3 · apply Blender material-slot labels to an ORIGINAL car GLB
//
//   node tools/car_apply_slots.mjs models/cars/gt40.glb build/gt40.labels.json models/cars/gt40.v2.glb
//
// labels.json comes from tools/blender/rr_car_slots.py --labels. For every mesh the vertex buffers are
// kept exactly as they are (the car's bounds size its collision box in game.js: not one float may move);
// the triangle list is split into one primitive per slot, each with a material named after the slot
// (car_paint, car_glass, ...), all sharing the original textures. Before anything is written, sampled
// triangle centroids from Blender are compared with this file's triangles: if the face order does not
// match, the tool stops.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { readFileSync } from 'fs';
import { prune } from '@gltf-transform/functions';
const [,, IN, LAB, OUT] = process.argv;
const L = JSON.parse(readFileSync(LAB, 'utf8'));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(IN);
const mats = {};
const out = [];
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh(); if (!mesh) continue; const lab = L.meshes[mesh.getName()]; if (!lab) { out.push(mesh.getName() + ': no labels, unchanged'); continue; }
  const prims = mesh.listPrimitives(); if (prims.length !== 1) { out.push(mesh.getName() + ': ' + prims.length + ' primitives, skipped'); continue; }
  const p = prims[0], idx = p.getIndices(), pos = p.getAttribute('POSITION'); const n = idx ? idx.getCount() / 3 : pos.getCount() / 3;
  const W = node.getWorldMatrix(); const tri = (t, k) => idx ? idx.getScalar(t * 3 + k) : t * 3 + k; const v = [];
  const cen = t => { let c = [0, 0, 0]; for (let k = 0; k < 3; k++) { pos.getElement(tri(t, k), v); const w = [W[0]*v[0]+W[4]*v[1]+W[8]*v[2]+W[12], W[1]*v[0]+W[5]*v[1]+W[9]*v[2]+W[13], W[2]*v[0]+W[6]*v[1]+W[10]*v[2]+W[14]]; c = c.map((q, i) => q + w[i] / 3); } return c; };
  let worst = 0;
  if (lab.centroids) {   // labels from a hand-edited, re-exported file: match every triangle by its centroid
    const G = new Map(), cs = 0.01, key = c => c.map(q => Math.floor(q / cs)).join(',');
    for (const [x, y, z, sl] of lab.centroids) { const k = key([x, y, z]); if (!G.has(k)) G.set(k, []); G.get(k).push([x, y, z, sl]); }
    const slots = []; let miss = 0;
    for (let t = 0; t < n; t++) { const c = cen(t); const b = c.map(q => Math.floor(q / cs)); let best = null, bd = 1e9;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) for (const e of G.get([b[0]+dx, b[1]+dy, b[2]+dz].join(',')) || []) { const d = Math.hypot(e[0]-c[0], e[1]-c[1], e[2]-c[2]); if (d < bd) { bd = d; best = e[3]; } }
      if (best === null || bd > 1e-3) { miss++; best = 0; } worst = Math.max(worst, best === null ? 1 : bd); slots.push(best); }
    if (miss > n * 0.002) throw new Error(mesh.getName() + ': ' + miss + ' of ' + n + ' triangles have no matching labelled face');
    lab.slots = slots;
  } else {
    if (n !== lab.slots.length) throw new Error(mesh.getName() + ': ' + n + ' triangles here, ' + lab.slots.length + ' labels');
    for (const [t, x, y, z] of lab.check) { const c = cen(t); worst = Math.max(worst, Math.hypot(c[0] - x, c[1] - y, c[2] - z)); }
    if (worst > 1e-3) throw new Error(mesh.getName() + ': face order does not match (centroid off by ' + worst.toFixed(4) + ')');
  }
  const src = p.getMaterial(); const by = new Map();
  lab.slots.forEach((s, t) => { if (!by.has(s)) by.set(s, []); by.get(s).push(tri(t, 0), tri(t, 1), tri(t, 2)); });
  const counts = {};
  for (const [s, list] of [...by.entries()].sort((a, b) => a[0] - b[0])) { const name = L.slots[s];
    if (!mats[name]) { mats[name] = src.clone().setName(name); }
    const ia = doc.createAccessor().setType('SCALAR').setArray(pos.getCount() < 65536 ? new Uint16Array(list) : new Uint32Array(list)).setBuffer(idx ? idx.getBuffer() : doc.getRoot().listBuffers()[0]);
    const np = p.clone().setIndices(ia).setMaterial(mats[name]); mesh.addPrimitive(np); counts[name] = list.length / 3; }
  mesh.removePrimitive(p); p.dispose();
  out.push(mesh.getName() + ': ' + JSON.stringify(counts) + ' (order check ' + worst.toExponential(1) + ')');
}
await doc.transform(prune());
await io.write(OUT, doc);
console.log(out.join('\n'));
