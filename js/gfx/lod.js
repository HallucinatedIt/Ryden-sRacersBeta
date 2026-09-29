// Ryden's Racers · Graphics V2 · LOD, distance culling and scenery zones
// -----------------------------------------------------------------------------------------------
// The Blender environments are exported as a few big merged meshes (all the grass of a track in one mesh,
// all the cypress trees in another...). That is cheap in draw calls but it defeats culling: a merged mesh
// is drawn whole whenever any part of it is on screen, and drawn whole into the shadow map whenever any
// part of it is inside the shadow box. This module:
//
//   chunk(mesh, cell)   splits a large merged mesh into spatial chunks (same material, same vertex format),
//                       so frustum culling, the shadow camera and distance culling work per chunk.
//   zone rules          NEAR (grass, scrub, small rocks, props) - hidden beyond ~350-600 m
//                       MID  (trees, buildings, poles, trackside) - hidden beyond ~1.3 km
//                       FAR  (cliffs, headlands, horizon)         - always drawn
//                       Distances scale with settings.lodBias.
//   register(obj,opt)   distance-based visibility and shadow casting for any object
//   makeLOD(levels)     THREE.LOD wrapper (LOD0/LOD1/LOD2 meshes, distances x lodBias) for placed assets
//   mergeFlat(root)     draw-call control: sibling flat-colour materials -> one vertex-coloured mesh
//
// Nothing here changes what is on the road: collision and gameplay never read scenery meshes.
(function(){
  function chunk(o,cell){ const g=o.geometry; if(!g.index) return null; const p=g.attributes.position; const ix=g.index.array; const v=new THREE.Vector3();
    o.updateMatrixWorld(true); const buckets=new Map();
    for(let f=0;f<ix.length;f+=3){ let cx=0,cz=0; for(let k=0;k<3;k++){ v.fromBufferAttribute(p,ix[f+k]).applyMatrix4(o.matrixWorld); cx+=v.x; cz+=v.z; }
      const key=Math.floor(cx/3/cell)+','+Math.floor(cz/3/cell); let b=buckets.get(key); if(!b){ b=[]; buckets.set(key,b); } b.push(f); }
    if(buckets.size<2) return null;
    const out=[]; const names=Object.keys(g.attributes);
    for(const [key,faces] of buckets){ const map=new Map(); const nIdx=new Uint32Array(faces.length*3); let nv=0;
      for(let t=0;t<faces.length;t++) for(let k=0;k<3;k++){ const old=ix[faces[t]+k]; let nu=map.get(old); if(nu===undefined){ nu=nv++; map.set(old,nu); } nIdx[t*3+k]=nu; }
      const ng=new THREE.BufferGeometry(); const olds=new Uint32Array(nv); for(const [a,b] of map) olds[b]=a;
      for(const n of names){ const A=g.attributes[n]; const src=A.isInterleavedBufferAttribute?null:A.array; const is=A.itemSize;
        const dst=new (src?src.constructor:Float32Array)(nv*is);
        for(let k=0;k<nv;k++){ const s=olds[k]; if(src){ for(let c=0;c<is;c++) dst[k*is+c]=src[s*is+c]; } else { for(let c=0;c<is;c++) dst[k*is+c]=A.getComponent(s,c); } }
        ng.setAttribute(n,new THREE.BufferAttribute(dst,is,src?A.normalized:false)); }
      ng.setIndex(new THREE.BufferAttribute(nv<65536?new Uint16Array(nIdx):nIdx,1)); ng.computeBoundingSphere(); ng.computeBoundingBox();
      const m=new THREE.Mesh(ng,o.material); m.name=o.name+'#'+key; m.castShadow=o.castShadow; m.receiveShadow=o.receiveShadow; m.renderOrder=o.renderOrder;
      m.matrix.copy(o.matrix); m.matrixAutoUpdate=false; m.userData=Object.assign({},o.userData,{chunkOf:o.name}); out.push(m); }
    return out; }

  function manager(Q){ const bias=(Q&&Q.lodBias)||1; const items=[]; let frame=0; const c=new THREE.Vector3(), cp=new THREE.Vector3();
    const M={ items, bias, stats:{hidden:0,shadowOff:0,chunks:0,sourceMeshes:0},
      register(obj,opt){ const s=obj.geometry&&obj.geometry.boundingSphere; if(obj.geometry&&!s) obj.geometry.computeBoundingSphere();
        obj.updateMatrixWorld(true); const bs=obj.geometry?obj.geometry.boundingSphere.clone().applyMatrix4(obj.matrixWorld):new THREE.Sphere(obj.getWorldPosition(new THREE.Vector3()),opt.radius||5);
        items.push({obj,center:bs.center,radius:bs.radius,far:opt.far?opt.far*bias:Infinity,shadowFar:opt.shadowFar?opt.shadowFar*bias:Infinity,cast:obj.castShadow}); },
      update(camera){ if((frame++)%8) return; cp.setFromMatrixPosition(camera.matrixWorld); let h=0,so=0;
        for(const it of items){ const d=Math.max(0,cp.distanceTo(it.center)-it.radius); const vis=d<it.far; if(it.obj.visible!==vis) it.obj.visible=vis; if(!vis) h++;
          if(it.cast){ const cs=d<it.shadowFar; if(it.obj.castShadow!==cs) it.obj.castShadow=cs; if(!cs) so++; } }
        M.stats.hidden=h; M.stats.shadowOff=so; },
      // split the big merged meshes of an environment root by zone rules [{re, zone, cell, far, shadowFar}]
      zoneEnvironment(root,rules){ rules=rules||[]; const todo=[]; root.traverse(o=>{ if(!o.isMesh||!o.geometry||!o.geometry.index) return; const r=rules.find(r=>r.re.test(o.name)); if(r) todo.push([o,r]); });
        for(const [o,r] of todo){ o.geometry.computeBoundingSphere(); const big=o.geometry.boundingSphere.radius*o.matrixWorld.getMaxScaleOnAxis()>r.cell*0.75;
          const parts=big?chunk(o,r.cell):null; const list=parts||[o];
          if(parts){ const par=o.parent; parts.forEach(m=>par.add(m)); par.remove(o); M.stats.chunks+=parts.length; M.stats.sourceMeshes++; }
          list.forEach(m=>{ m.userData.zone=r.zone; if(r.far||r.shadowFar) M.register(m,{far:r.far,shadowFar:r.shadowFar}); }); }
        return M.stats; },
    };
    return M; }

  // Draw-call control: a Blender object with N flat-colour materials arrives as N meshes = N draws.
  // mergeFlat() combines sibling meshes whose materials are plain, untextured, opaque, non-emissive
  // MeshStandardMaterials into one mesh per (side, roughness, metalness, env intensity) bucket, with each
  // material's colour moved into a vertex colour. Same shading, a fraction of the draws.
  // Materials with maps, emissive, transparency/alpha test, clearcoat (Physical) or a name matching `keep`
  // are never touched (road, lines, signs, glass, lamps...).
  function mergeFlat(root,opt){ opt=opt||{}; const keep=opt.keep||/asphalt|line_|curb|glass|lamp|neon|sign|water|foam|ocean|checker|horizon|crowd/;
    const flat=m=>m&&m.isMeshStandardMaterial&&!m.isMeshPhysicalMaterial&&!m.map&&!m.normalMap&&!m.roughnessMap&&!m.metalnessMap&&!m.aoMap&&!m.emissiveMap&&!m.alphaMap&&!m.transparent&&!(m.alphaTest>0)
      &&!(m.emissive&&(m.emissive.r+m.emissive.g+m.emissive.b)*(m.emissiveIntensity==null?1:m.emissiveIntensity)>0.001)&&!m.onBeforeCompile.toString().includes('replace')&&!keep.test(m.name||'');
    const byParent=new Map(); root.traverse(o=>{ if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||!o.geometry||!o.geometry.attributes.position||!flat(o.material)) return; const g=o.geometry; if(g.morphAttributes&&Object.keys(g.morphAttributes).length) return;
      const m=o.material; const key=[m.side,(Math.round(m.roughness*10)/10),(Math.round(m.metalness*10)/10),(m.envMapIntensity==null?1:m.envMapIntensity).toFixed(2),m.flatShading?1:0,o.castShadow?1:0,o.receiveShadow?1:0,o.renderOrder].join('|');
      const pk=o.parent; if(!byParent.has(pk)) byParent.set(pk,new Map()); const B=byParent.get(pk); if(!B.has(key)) B.set(key,[]); B.get(key).push(o); });
    let before=0, after=0; const v=new THREE.Vector3(), n=new THREE.Vector3(), nm=new THREE.Matrix3();
    for(const [par,B] of byParent) for(const [key,list] of B){ if(list.length<2) continue; before+=list.length; after++;
      let nv=0, ni=0; list.forEach(o=>{ nv+=o.geometry.attributes.position.count; ni+=o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count; });
      const P=new Float32Array(nv*3), N=new Float32Array(nv*3), C=new Float32Array(nv*3), I=new Uint32Array(ni); let ov=0, oi=0;
      list.forEach(o=>{ const g=o.geometry, pa=g.attributes.position, na=g.attributes.normal, ca=g.attributes.color; o.updateMatrix(); const M=o.matrix; nm.getNormalMatrix(M); const col=o.material.color;
        for(let k=0;k<pa.count;k++){ v.fromBufferAttribute(pa,k).applyMatrix4(M); P[(ov+k)*3]=v.x; P[(ov+k)*3+1]=v.y; P[(ov+k)*3+2]=v.z;
          if(na){ n.fromBufferAttribute(na,k).applyMatrix3(nm).normalize(); N[(ov+k)*3]=n.x; N[(ov+k)*3+1]=n.y; N[(ov+k)*3+2]=n.z; }
          const vc=(ca&&o.material.vertexColors)?[ca.getX(k),ca.getY(k),ca.getZ(k)]:[1,1,1]; C[(ov+k)*3]=col.r*vc[0]; C[(ov+k)*3+1]=col.g*vc[1]; C[(ov+k)*3+2]=col.b*vc[2]; }
        if(g.index){ const ix=g.index.array; for(let k=0;k<ix.length;k++) I[oi+k]=ix[k]+ov; oi+=ix.length; } else { for(let k=0;k<pa.count;k++) I[oi+k]=ov+k; oi+=pa.count; }
        ov+=pa.count; });
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(P,3)); g.setAttribute('normal',new THREE.BufferAttribute(N,3)); g.setAttribute('color',new THREE.BufferAttribute(C,3));
      g.setIndex(new THREE.BufferAttribute(nv<65536?new Uint16Array(I):I,1)); g.computeBoundingSphere(); g.computeBoundingBox();
      const m0=list[0].material; const mat=m0.clone(); mat.color.setRGB(1,1,1); mat.vertexColors=true; mat.name='merged_flat['+list.map(o=>o.material.name).filter((x,i,a)=>a.indexOf(x)===i).join(',').slice(0,80)+']';
      const mesh=new THREE.Mesh(g,mat); mesh.name=list[0].name.replace(/_\d+$/,'')+'_flat'; mesh.castShadow=list[0].castShadow; mesh.receiveShadow=list[0].receiveShadow; mesh.renderOrder=list[0].renderOrder;
      mesh.userData=Object.assign({},list[0].userData,{mergedFlat:list.length}); par.add(mesh); list.forEach(o=>{ par.remove(o); o.geometry.dispose(); }); }
    return {meshesBefore:before, meshesAfter:after, drawsSaved:before-after}; }

  // Draw-call control for textured city blocks: a neighbourhood object with 18 materials is 18 draws, and eight
  // neighbourhoods share the same 18 materials. mergeByMaterial() combines static meshes that share one material
  // (and shadow flags) into one mesh per material per spatial cell (cells keep frustum culling useful). Geometry
  // is baked to the root's space and dequantized (Meshopt/quantized attributes -> Float32). Materials, UVs and
  // vertex colours are untouched, so shading is identical; only the number of draws changes.
  function mergeByMaterial(root,opt){ opt=opt||{}; const re=opt.re||/./, cell=opt.cell||400; root.updateMatrixWorld(true);
    const inv=new THREE.Matrix4().copy(root.matrixWorld).invert(), M=new THREE.Matrix4(), nm=new THREE.Matrix3(), c=new THREE.Vector3(), v=new THREE.Vector3();
    const sig=g=>Object.keys(g.attributes).sort().map(k=>k+g.attributes[k].itemSize).join(',');
    const B=new Map(); let before=0;
    root.traverse(o=>{ if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||!o.visible||Array.isArray(o.material)||!o.geometry||!o.geometry.attributes.position) return;
      const nmN=o.name+' '+((o.parent&&o.parent.name)||''); if(!re.test(nmN)||(opt.skip&&opt.skip.test(nmN))) return; const g=o.geometry; if(g.morphAttributes&&Object.keys(g.morphAttributes).length) return;
      if(!g.boundingSphere) g.computeBoundingSphere(); c.copy(g.boundingSphere.center).applyMatrix4(o.matrixWorld);
      const key=[o.material.uuid,o.castShadow?1:0,o.receiveShadow?1:0,o.renderOrder,o.frustumCulled?1:0,Math.floor(c.x/cell),Math.floor(c.z/cell),sig(g)].join('|');
      if(!B.has(key)) B.set(key,[]); B.get(key).push(o); before++; });
    let after=0, merged=0;
    for(const [key,list] of B){ if(list.length<2) { after++; continue; }
      const names=Object.keys(list[0].geometry.attributes); let nv=0, ni=0; list.forEach(o=>{ const g=o.geometry; nv+=g.attributes.position.count; ni+=g.index?g.index.count:g.attributes.position.count; });
      const out={}; names.forEach(k=>{ out[k]=new Float32Array(nv*list[0].geometry.attributes[k].itemSize); }); const I=nv>65535?new Uint32Array(ni):new Uint16Array(ni); let ov=0, oi=0;
      list.forEach(o=>{ const g=o.geometry, n=g.attributes.position.count; M.multiplyMatrices(inv,o.matrixWorld); nm.getNormalMatrix(M);
        names.forEach(k=>{ const a=g.attributes[k], is=a.itemSize, dst=out[k];
          for(let i=0;i<n;i++){ const b=(ov+i)*is;
            if(k==='position'){ v.fromBufferAttribute(a,i).applyMatrix4(M); dst[b]=v.x; dst[b+1]=v.y; dst[b+2]=v.z; }
            else if(k==='normal'){ v.fromBufferAttribute(a,i).applyMatrix3(nm).normalize(); dst[b]=v.x; dst[b+1]=v.y; dst[b+2]=v.z; }
            else if(k==='tangent'){ v.set(a.getX(i),a.getY(i),a.getZ(i)).transformDirection(M); dst[b]=v.x; dst[b+1]=v.y; dst[b+2]=v.z; dst[b+3]=a.getW(i); }
            else { dst[b]=a.getX(i); if(is>1) dst[b+1]=a.getY(i); if(is>2) dst[b+2]=a.getZ(i); if(is>3) dst[b+3]=a.getW(i); } } });
        if(g.index){ const ix=g.index; for(let i=0;i<ix.count;i++) I[oi++]=ix.getX(i)+ov; } else { for(let i=0;i<n;i++) I[oi++]=ov+i; }
        ov+=n; });
      const G=new THREE.BufferGeometry(); names.forEach(k=>G.setAttribute(k,new THREE.BufferAttribute(out[k],list[0].geometry.attributes[k].itemSize))); G.setIndex(new THREE.BufferAttribute(I,1)); G.computeBoundingSphere(); G.computeBoundingBox();
      const f=list[0], m=new THREE.Mesh(G,f.material); m.name=(opt.prefix||'mm_')+((f.material&&f.material.name)||'mat')+'_'+after; m.castShadow=f.castShadow; m.receiveShadow=f.receiveShadow; m.renderOrder=f.renderOrder; m.frustumCulled=f.frustumCulled;
      m.userData.mergedFrom=list.length; m.matrixAutoUpdate=false; root.add(m); m.updateMatrixWorld(true);
      list.forEach(o=>{ if(o.parent) o.parent.remove(o); o.geometry.dispose(); }); after++; merged+=list.length; }
    return {meshesBefore:before, meshesAfter:after, merged, drawsSaved:before-after}; }

  function makeLOD(levels,bias){ const L=new THREE.LOD(); levels.forEach(l=>L.addLevel(l.obj,(l.dist||0)*(bias||1))); L.autoUpdate=true; return L; }

  window.GFX=window.GFX||{}; window.GFX.lod={chunk,manager,makeLOD,mergeFlat,mergeByMaterial};
})();
