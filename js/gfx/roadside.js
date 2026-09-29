// Ryden's Racers · Graphics V2 · Procedural roadside structures
// -----------------------------------------------------------------------------------------------
// Long, repetitive roadside structures are cheaper to generate than to model: they follow the track, so
// they are built from the centre line at load. Each run merges into one mesh (one draw call, one shadow
// draw) and is registered with the LOD manager for distance culling.
//   poles   a utility line: weathered timber poles with a cross-arm and insulators, three sagging wires
//   fence   a ranch fence: leaning posts and three strands of wire
//   rail    a painted post-and-rail timber fence (lay-bys, overlooks); color = paint
// Rule: {kind, from, to, lat, every, h}   from/to = track samples, lat = metres right (+) / left (-) of the
// centre line, every = spacing in metres, h = pole height. Wire sag and post lean are seeded per run.
(function(){
  const wood=()=>new THREE.MeshStandardMaterial({color:0x7d6a55, roughness:0.95, metalness:0, name:'rs_wood'});
  const wire=()=>new THREE.MeshStandardMaterial({color:0x262320, roughness:0.6, metalness:0.4, name:'rs_wire'});

  function push(G,geo,m){ geo=geo.index?geo.toNonIndexed():geo; geo.applyMatrix4(m); G.push(geo); }
  function merge(list){ if(!list.length) return null; let n=0; list.forEach(g=>{ n+=g.attributes.position.count; });
    const pos=new Float32Array(n*3), nor=new Float32Array(n*3); let o=0;
    list.forEach(g=>{ pos.set(g.attributes.position.array,o*3); nor.set(g.attributes.normal.array,o*3); o+=g.attributes.position.count; g.dispose(); });
    const out=new THREE.BufferGeometry(); out.setAttribute('position',new THREE.BufferAttribute(pos,3)); out.setAttribute('normal',new THREE.BufferAttribute(nor,3)); out.computeBoundingSphere(); return out; }
  // a thin 4-sided tube along the points (the wires): cheap and it catches the sun
  function strand(pts,r){ const p=[], nrm=[]; const t=new THREE.Vector3(), a=new THREE.Vector3(), b=new THREE.Vector3(), up=new THREE.Vector3(0,1,0);
    for(let k=0;k<pts.length-1;k++){ const p0=pts[k], p1=pts[k+1]; t.subVectors(p1,p0).normalize(); a.crossVectors(t,up).normalize(); b.crossVectors(a,t).normalize();
      const ring=(c)=>[0,1,2,3].map(q=>{ const an=q*Math.PI/2; return new THREE.Vector3().copy(c).addScaledVector(a,Math.cos(an)*r).addScaledVector(b,Math.sin(an)*r); });
      const r0=ring(p0), r1=ring(p1); for(let q=0;q<4;q++){ const q2=(q+1)%4; const quad=[r0[q],r1[q],r1[q2],r0[q],r1[q2],r0[q2]]; const an=(q+0.5)*Math.PI/2; const nn=new THREE.Vector3().addScaledVector(a,Math.cos(an)).addScaledVector(b,Math.sin(an));
        quad.forEach(v=>{ p.push(v.x,v.y,v.z); nrm.push(nn.x,nn.y,nn.z); }); } }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(p,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(nrm,3)); return g; }

  function build(R,rules){ const W=R.W, P=R.P; const out=new THREE.Group(); out.name='v2_roadside'; const stats={runs:0,tris:0};
    const targets=[]; W.env.root.traverse(o=>{ if(o.isMesh&&o.material&&/^m_(ground|strata|sand|grass_ground)$/.test(o.material.name||'')) targets.push(o); });
    const ray=new THREE.Raycaster(); ray.far=400; const down=new THREE.Vector3(0,-1,0);
    const groundAt=(x,z,y0)=>{ ray.set(new THREE.Vector3(x,y0+150,z),down); const h=targets.length?ray.intersectObjects(targets,false)[0]:null; return h?h.point.y:y0; };
    rules.forEach((r,ri)=>{ let sd=977+ri*131; const rnd=()=>{ sd=(sd*16807)%2147483647; return (sd-1)/2147483646; };
      const N=P.N, sp=P.spacing, step=Math.max(1,Math.round(r.every/sp)); const posts=[];
      for(let s=r.from; s<=r.to; s+=step){ const i=((s%N)+N)%N; const x=P.x[i]+P.rx[i]*r.lat, z=P.z[i]+P.rz[i]*r.lat; posts.push({x,z,y:groundAt(x,z,P.y[i]),yaw:Math.atan2(P.tx[i],P.tz[i]),lean:(rnd()-0.5)*(r.kind==='fence'?0.16:0.05),lean2:(rnd()-0.5)*0.06}); }
      if(posts.length<2) return; const WG=[], XG=[]; const m=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler();
      if(r.kind==='poles'){ const H=r.h||9;
        posts.forEach(p=>{ q.setFromEuler(e.set(p.lean,p.yaw,p.lean2)); m.compose(new THREE.Vector3(p.x,p.y+H/2-0.4,p.z),q,new THREE.Vector3(1,1,1)); push(WG,new THREE.CylinderGeometry(0.13,0.17,H,6,1),m);
          const arm=new THREE.Matrix4().compose(new THREE.Vector3(0,H/2-0.9,0),new THREE.Quaternion(),new THREE.Vector3(1,1,1)); push(WG,new THREE.BoxGeometry(2.6,0.14,0.14),m.clone().multiply(arm));
          [-1.1,0,1.1].forEach(ox=>push(XG,new THREE.CylinderGeometry(0.05,0.07,0.22,5),m.clone().multiply(new THREE.Matrix4().makeTranslation(ox,H/2-0.72,0)))); });
        // wires: catenary-ish sag between consecutive insulators
        [-1.1,0,1.1].forEach(ox=>{ for(let k=0;k<posts.length-1;k++){ const a=posts[k], b=posts[k+1]; const pa=new THREE.Vector3(ox,H/2-0.62,0).applyEuler(e.set(a.lean,a.yaw,a.lean2)).add(new THREE.Vector3(a.x,a.y+H/2-0.4,a.z));
            const pb=new THREE.Vector3(ox,H/2-0.62,0).applyEuler(e.set(b.lean,b.yaw,b.lean2)).add(new THREE.Vector3(b.x,b.y+H/2-0.4,b.z)); const span=pa.distanceTo(pb), sag=span*0.028; const pts=[];
            for(let t=0;t<=8;t++){ const u=t/8; pts.push(new THREE.Vector3().lerpVectors(pa,pb,u).add(new THREE.Vector3(0,-sag*4*u*(1-u),0))); } XG.push(strand(pts,0.022)); } }); }
      else if(r.kind==='rail'){ // painted post-and-rail timber fence (coast lay-bys): square posts, two rails
        const H=r.h||1.1;
        posts.forEach(p=>{ q.setFromEuler(e.set(p.lean*0.3,p.yaw,p.lean2*0.3)); m.compose(new THREE.Vector3(p.x,p.y+H/2-0.05,p.z),q,new THREE.Vector3(1,1,1)); push(WG,new THREE.BoxGeometry(0.13,H,0.13),m); });
        for(let k=0;k<posts.length-1;k++){ const a=posts[k], b=posts[k+1]; const dx=b.x-a.x, dz=b.z-a.z, len=Math.hypot(dx,dz); const yaw=Math.atan2(dx,dz);
          [0.45,0.9].forEach(h=>{ const mid=new THREE.Vector3((a.x+b.x)/2,(a.y+b.y)/2+h*(H/1.1),(a.z+b.z)/2); const pitch=Math.atan2(b.y-a.y,len);
            q.setFromEuler(e.set(-pitch,yaw,0,'YXZ')); m.compose(mid,q,new THREE.Vector3(1,1,1)); push(WG,new THREE.BoxGeometry(0.07,0.14,len+0.1),m); }); } }
      else { // fence
        posts.forEach(p=>{ q.setFromEuler(e.set(p.lean,p.yaw+rnd()*0.4,p.lean2*2)); m.compose(new THREE.Vector3(p.x,p.y+0.6,p.z),q,new THREE.Vector3(1,1,1)); push(WG,new THREE.CylinderGeometry(0.06,0.075,1.35,5,1),m); });
        [0.35,0.72,1.08].forEach(h=>{ for(let k=0;k<posts.length-1;k++){ const a=posts[k], b=posts[k+1]; if(rnd()<0.12) continue;   // a few strands down
            const pa=new THREE.Vector3(a.x,a.y+h,a.z), pb=new THREE.Vector3(b.x,b.y+h*(0.9+rnd()*0.1),b.z); const pts=[]; for(let t=0;t<=4;t++){ const u=t/4; pts.push(new THREE.Vector3().lerpVectors(pa,pb,u).add(new THREE.Vector3(0,-0.06*4*u*(1-u),0))); }
            XG.push(strand(pts,0.012)); } }); }
      const wm=wood(); if(r.color!=null){ wm.color.setHex(r.color); wm.roughness=0.7; }
      [[WG,wm],[XG,wire()]].forEach(([L2,mat])=>{ const g=merge(L2); if(!g) return; const mesh=new THREE.Mesh(g,mat); mesh.castShadow=true; mesh.receiveShadow=true; mesh.name='rs_'+r.kind+'_'+ri+'_'+mat.name; out.add(mesh); stats.tris+=g.attributes.position.count/3; });
      stats.runs++; });
    stats.tris=Math.round(stats.tris); out.userData.stats=stats; return out.children.length?out:null; }

  window.GFX=window.GFX||{}; window.GFX.roadside={build};
})();
