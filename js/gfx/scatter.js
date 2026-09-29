// Ryden's Racers · Graphics V2 · Instanced scatter (vegetation and small props)
// -----------------------------------------------------------------------------------------------
// The scalable vegetation pipeline (Phase 3). Assets come from tools/blender/rr_prop_pipeline.py: one GLB
// with nodes lod0, lod1 (lod2) and, for plants, lodImp: an impostor of 3 crossed quads (6 triangles)
// carrying an albedo atlas rendered from the hero model.
//
// Cost model: every LOD level of an asset is ONE InstancedMesh, whatever the number of placements, so a
// plant type costs at most (levels) draw calls (+ the shadow pass for the levels that cast). Every few
// frames each instance is put in the level its camera distance asks for, or dropped when it is beyond
// `far` or outside a padded view frustum; only the matrices of drawn instances are uploaded.
//   hero   lod0      the first ~25-40 m (x lodBias): real geometry, casts shadows
//   mid    lod1/2    decimated, baked texture, casts shadows only in the near level
//   far    lodImp    impostor cards, no shadows: thousands cost almost nothing
// Placement is deterministic (seeded per track and rule) and rule-driven, never random over the map:
// a band beside the road (metres from the road edge), a track section, clustering, slope limit, and the
// terrain height from a ray cast on the scenery meshes. Density scales with the tier's vegDensity
// (phones use a lower value: fewer plants, never an empty map).
(function(){
  const _m=new THREE.Matrix4(), _q=new THREE.Quaternion(), _s=new THREE.Vector3(), _p=new THREE.Vector3(), _e=new THREE.Euler(), _up=new THREE.Vector3(0,1,0);
  const _fr=new THREE.Frustum(), _pm=new THREE.Matrix4(), _sph=new THREE.Sphere(), _cp=new THREE.Vector3();

  // impostor cards: alpha-tested, both sides, lit with a mostly-up normal (a card's own normal makes the
  // plant flip between lit and dark as the camera goes round it)
  function impostorMaterial(src){ const m=new THREE.MeshStandardMaterial({map:src.map, color:src.color?src.color.clone():0xffffff, roughness:0.95, metalness:0,
      alphaTest:0.5, transparent:false, depthWrite:true, side:THREE.DoubleSide});
    m.name=(src.name||'impostor')+'_v2'; m.onBeforeCompile=sh=>{ sh.fragmentShader=sh.fragmentShader.replace('#include <normal_fragment_begin>',
      '#include <normal_fragment_begin>\nnormal=normalize(mix(normal,normalize((viewMatrix*vec4(0.,1.,0.,0.)).xyz),0.75)); nonPerturbedNormal=normal;'); };
    m.customProgramCacheKey=()=>'rr_impostor'; return m; }

  // [{name, dist, parts:[{geometry, material}], radius}] from a pipeline GLB scene
  function levelsOf(scene,dists){ const out=[]; const names=['lod0','lod1','lod2','lodImp'];
    names.forEach((n,k)=>{ const node=scene.getObjectByName(n); if(!node) return; const parts=[]; node.updateMatrixWorld(true);
      node.traverse(o=>{ if(!o.isMesh) return; const g=o.geometry.clone(); g.applyMatrix4(new THREE.Matrix4().copy(node.matrixWorld).invert().multiply(o.matrixWorld));
        let mat=o.material; if(n==='lodImp') mat=impostorMaterial(mat); else { mat=mat.clone(); mat.side=THREE.FrontSide; }
        g.computeBoundingSphere(); parts.push({geometry:g, material:mat}); });
      if(parts.length) out.push({name:n, imp:n==='lodImp', parts, radius:Math.max(...parts.map(p=>p.geometry.boundingSphere.radius+p.geometry.boundingSphere.center.length()))}); });
    // distances: explicit per rule, else by size (a 1 m shrub drops to its impostor far sooner than an 8 m palm)
    const R=out.length?out[0].radius:1; const def=[0, 14+R*9, 30+R*18, out.some(l=>l.imp)?(out.length>2?48+R*22:18+R*10):1e9];
    out.forEach((l,k)=>{ l.dist=(dists&&dists[k]!=null)?dists[k]:(l.imp?def[3]:def[k]); }); out[0].dist=0; return out; }

  function build(R,L,Q,rules){ const W=R.W, P=R.P; const bias=Q.lodBias||1, dens=Q.vegDensity!=null?Q.vegDensity:1;
    const grp=new THREE.Group(); grp.name='v2_scatter'; const S={group:grp, sets:[], stats:{placed:0, draws:0, assets:0}};
    // ray-cast targets: terrain + rock, not plants/roads/props
    const targets=[]; W.env.root.traverse(o=>{ if(o.isMesh&&o.material&&/^m_(ground|strata|rock|rock_plain|sand|coast_rock|grass_ground)$/.test(o.material.name||'')) targets.push(o); });
    const ray=new THREE.Raycaster(); ray.far=400;
    // coarse grid of centre-line samples, so a placement beside one part of the track is not ON another part
    const G=new Map(), cs=24; for(let i=0;i<P.N;i++){ const k=Math.floor(P.x[i]/cs)+','+Math.floor(P.z[i]/cs); let b=G.get(k); if(!b){ b=[]; G.set(k,b); } b.push(i); }
    const clearOfRoad=(x,z,m)=>{ const gx=Math.floor(x/cs), gz=Math.floor(z/cs); for(let a=-1;a<=1;a++) for(let b=-1;b<=1;b++){ const L2=G.get((gx+a)+','+(gz+b)); if(!L2) continue;
        for(const i of L2){ const d=Math.hypot(x-P.x[i],z-P.z[i]); if(d<P.w[i]/2+m) return false; } } return true; };
    const ld=GFX.assets.configureLoader(new THREE.GLTFLoader()); const ids=[...new Set(rules.map(r=>r.asset))];
    return Promise.all(ids.map(u=>new Promise(res=>ld.load('models/props/'+u+'.glb?v=3',g=>res([u,g.scene]),undefined,e=>{ console.warn('[gfx v2] scatter asset failed',u,e); res([u,null]); }))))
      .then(pairs=>{ const T=Object.fromEntries(pairs);
        rules.forEach((rule,ri)=>{ const sc=T[rule.asset]; if(!sc) return; const lv=levelsOf(sc,rule.lods); if(!lv.length) return;
          let sd=(ri+1)*7919; for(const ch of (R.def.id+rule.asset)) sd=(sd*31+ch.charCodeAt(0))>>>0; sd=sd%2147483646+1;
          const rnd=()=>{ sd=(sd*16807)%2147483647; return (sd-1)/2147483646; }; const rr=(a,b)=>a+rnd()*(b-a);
          const inst=[]; const want=Math.round((rule.count||0)*(rule.dense===false?1:dens)); const band=rule.band||[2,30]; const sec=rule.section; let tries=0;
          const clusterN=rule.cluster||1;
          while(inst.length<want && tries++<want*30){
            let i=Math.floor(rnd()*P.N); if(sec){ const a=sec[0], b=sec[1]; i=Math.floor(a+rnd()*(((b-a)%P.N+P.N)%P.N))%P.N; }
            if(P.gap&&P.gap[i]) continue; const side=rule.side==='left'?-1:rule.side==='right'?1:(rnd()<0.5?-1:1);
            const lat0=side*(P.w[i]/2+rr(band[0],band[1])); const cx=P.x[i]+P.rx[i]*lat0, cz=P.z[i]+P.rz[i]*lat0;
            for(let c=0;c<clusterN&&inst.length<want;c++){ const ang=rnd()*6.283, rad=c?Math.sqrt(rnd())*(rule.clusterRadius||6):0; const x=cx+Math.cos(ang)*rad, z=cz+Math.sin(ang)*rad;
              if(!clearOfRoad(x,z,band[0])) continue;
              ray.set(_p.set(x,(P.y[i]||0)+200,z),new THREE.Vector3(0,-1,0)); const hit=targets.length?ray.intersectObjects(targets,false)[0]:null; if(!hit) continue;
              const n=hit.face?hit.face.normal.clone().transformDirection(hit.object.matrixWorld):_up; if(n.y<(rule.minUp!=null?rule.minUp:0.8)) continue;
              const s=rr(...(rule.scale||[0.8,1.2])); inst.push({x, y:hit.point.y-(rule.sink||0.05)*s, z, s, yaw:rnd()*6.283, tilt:rule.tilt?n:null}); } }
          if(!inst.length) return;
          // one InstancedMesh per part per level, sized for every instance; counts are set per update
          const sets=lv.map((l,k)=>({l, dist:l.dist*bias, meshes:l.parts.map(p=>{ const im=new THREE.InstancedMesh(p.geometry,p.material,inst.length); im.count=0; im.frustumCulled=false;
            im.castShadow=!l.imp && k<=(rule.shadowLevels!=null?rule.shadowLevels-1:0) && !!Q.shadows; im.receiveShadow=true; im.name='scatter_'+rule.asset+'_'+l.name; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); grp.add(im); return im; })}));
          const far=(rule.far||(lv[lv.length-1].imp?420:260))*bias;
          const mats=inst.map(o=>{ _q.setFromEuler(_e.set(0,o.yaw,0)); if(o.tilt){ const t=new THREE.Quaternion().setFromUnitVectors(_up,o.tilt); t.slerp(new THREE.Quaternion(),0.5); _q.premultiply(t); }
            return new THREE.Matrix4().compose(_p.set(o.x,o.y,o.z),_q,_s.set(o.s,o.s,o.s)); });
          S.sets.push({rule, inst, mats, sets, far, radius:lv[0].radius}); S.stats.placed+=inst.length; S.stats.assets++; S.stats.draws+=sets.reduce((a,b)=>a+b.meshes.length,0); });
        W.group.add(grp); return S; }); }

  // put every instance in its level (or nowhere); cheap enough for thousands every few frames
  function update(S,camera,force){ if(!S) return; S.frame=(S.frame||0)+1; if(!force && S.frame%3) return;
    camera.updateMatrixWorld(); _pm.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse); _fr.setFromProjectionMatrix(_pm); _cp.setFromMatrixPosition(camera.matrixWorld);
    for(const A of S.sets){ const cnt=A.sets.map(()=>0); const n=A.inst.length;
      for(let k=0;k<n;k++){ const o=A.inst[k]; const d=Math.hypot(o.x-_cp.x,o.y-_cp.y,o.z-_cp.z); if(d>A.far) continue;
        _sph.center.set(o.x,o.y+A.radius*o.s*0.5,o.z); _sph.radius=A.radius*o.s+6+d*0.06; if(!_fr.intersectsSphere(_sph)) continue;
        let lvl=0; for(let j=A.sets.length-1;j>=0;j--){ if(d>=A.sets[j].dist){ lvl=j; break; } }
        const set=A.sets[lvl]; const c=cnt[lvl]++; for(const im of set.meshes) im.setMatrixAt(c,A.mats[k]); }
      A.sets.forEach((set,j)=>set.meshes.forEach(im=>{ if(im.count!==cnt[j]||cnt[j]) { im.count=cnt[j]; im.instanceMatrix.needsUpdate=true; } im.visible=cnt[j]>0; })); } }

  function stats(S){ if(!S) return null; let drawn=0, tris=0; S.sets.forEach(A=>A.sets.forEach(set=>set.meshes.forEach(im=>{ drawn+=im.count; const g=im.geometry; tris+=im.count*(g.index?g.index.count:g.attributes.position.count)/3; })));
    return Object.assign({}, S.stats, {drawnInstances:drawn, tris:Math.round(tris)}); }

  window.GFX=window.GFX||{}; window.GFX.scatter={build, update, stats, levelsOf, impostorMaterial};
})();
