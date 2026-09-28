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
      zoneEnvironment(root,rules){ const todo=[]; root.traverse(o=>{ if(!o.isMesh||!o.geometry||!o.geometry.index) return; const r=rules.find(r=>r.re.test(o.name)); if(r) todo.push([o,r]); });
        for(const [o,r] of todo){ o.geometry.computeBoundingSphere(); const big=o.geometry.boundingSphere.radius*o.matrixWorld.getMaxScaleOnAxis()>r.cell*0.75;
          const parts=big?chunk(o,r.cell):null; const list=parts||[o];
          if(parts){ const par=o.parent; parts.forEach(m=>par.add(m)); par.remove(o); M.stats.chunks+=parts.length; M.stats.sourceMeshes++; }
          list.forEach(m=>{ m.userData.zone=r.zone; if(r.far||r.shadowFar) M.register(m,{far:r.far,shadowFar:r.shadowFar}); }); }
        return M.stats; },
    };
    return M; }

  function makeLOD(levels,bias){ const L=new THREE.LOD(); levels.forEach(l=>L.addLevel(l.obj,(l.dist||0)*(bias||1))); L.autoUpdate=true; return L; }

  window.GFX=window.GFX||{}; window.GFX.lod={chunk,manager,makeLOD};
})();
