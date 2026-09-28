// Measures GLBs (tris, draw prims, materials, textures, bounds). Needs @gltf-transform/core|extensions|functions (npm i).
// usage: OUT=/tmp/inv.json node tools/inventory.mjs models/cars/*.glb models/props/*.glb models/env/*.glb
import {NodeIO} from '@gltf-transform/core'; import {ALL_EXTENSIONS} from '@gltf-transform/extensions'; import {getBounds} from '@gltf-transform/functions'; import fs from 'fs'; import path from 'path';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS); const out=[];
const files=process.argv.slice(2);
for(const f of files){ const doc=await io.read(f); const R=doc.getRoot(); let tris=0, prims=0, verts=0; const meshes=R.listMeshes().length, nodes=R.listNodes().length;
  for(const n of R.listNodes()){ const m=n.getMesh(); if(!m) continue; for(const p of m.listPrimitives()){ prims++; const idx=p.getIndices(); const pos=p.getAttribute('POSITION'); verts+=pos?pos.getCount():0; tris+=(idx?idx.getCount():(pos?pos.getCount():0))/3; } }
  const tex=R.listTextures().map(t=>{ const s=t.getSize(); return (s?s.join('x'):'?')+':'+(t.getMimeType()||'').replace('image/',''); });
  const texBytes=R.listTextures().reduce((a,t)=>a+(t.getImage()?t.getImage().byteLength:0),0);
  let b=null; try{ const sc=R.listScenes()[0]; b=getBounds(sc); }catch(e){}
  const size=b?b.max.map((v,i)=>+(v-b.min[i]).toFixed(1)):null;
  const ext=R.listExtensionsUsed().map(e=>e.extensionName);
  out.push({file:f.replace(/^.*?(models\/)/,'models/'),MB:+(fs.statSync(f).size/1e6).toFixed(2),nodes,meshes,prims,tris:Math.round(tris),verts,mats:R.listMaterials().length,textures:tex.length,texMB:+(texBytes/1e6).toFixed(2),tex:[...new Set(tex)].slice(0,6),size,ext}); }
if(process.env.OUT) fs.writeFileSync(process.env.OUT,JSON.stringify(out,null,1));
for(const o of out) console.log(o.file.padEnd(40),String(o.MB).padStart(6),'MB',String(o.tris).padStart(8),'tris',String(o.prims).padStart(4),'prims',String(o.mats).padStart(3),'mats',String(o.textures).padStart(3),'tex',o.texMB,'MB',JSON.stringify(o.size),o.tex.slice(0,3).join(' '),o.ext.join(','));
