// Ryden's Racers · Graphics V2 · Road surface
// -----------------------------------------------------------------------------------------------
// Layered asphalt for the racing surface of a V2 track. The Blender road mesh and its albedo texture are
// kept; on top of them this adds:
//   - aggregate detail: a tiling normal map and roughness map generated once at load (no downloads),
//   - macro variation: low-frequency colour/roughness drift in world space, so the road never tiles,
//   - rubber: two darker, smoother tyre lanes that follow the AI racing line (A.line) through every corner,
//   - edge wear: dust and grit towards the road edges, rougher and lighter,
//   - worn paint on the lane lines.
// Everything is per-vertex data (lateral position, racing-line offset) plus a few texture taps, so the cost
// is flat. A surface sampler (GFX.road.surface) lets decals sit exactly on the road mesh.
(function(){
  let DETAIL=null;
  // 512x512 tiling aggregate: height from layered value noise + pebbles -> normal (RGB) and roughness (G)
  function detailMaps(){ if(DETAIL) return DETAIL; const S=512, H=new Float32Array(S*S);
    let sd=90210; const rnd=()=>{ sd=(sd*16807)%2147483647; return (sd-1)/2147483646; };
    const lat=(n)=>{ const g=new Float32Array(n*n); for(let k=0;k<g.length;k++) g[k]=rnd(); return g; };
    const octs=[[8,0.30],[16,0.22],[32,0.18],[64,0.14],[128,0.10]].map(([n,a])=>({n,a,g:lat(n)}));
    for(let y=0;y<S;y++) for(let x=0;x<S;x++){ let h=0; for(const o of octs){ const fx=x/S*o.n, fy=y/S*o.n; const ix=Math.floor(fx), iy=Math.floor(fy); const tx=fx-ix, ty=fy-iy;
        const sx=tx*tx*(3-2*tx), sy=ty*ty*(3-2*ty); const g=o.g, n=o.n; const a=g[(iy%n)*n+(ix%n)], b=g[(iy%n)*n+((ix+1)%n)], c=g[((iy+1)%n)*n+(ix%n)], d=g[((iy+1)%n)*n+((ix+1)%n)];
        h+=o.a*((a*(1-sx)+b*sx)*(1-sy)+(c*(1-sx)+d*sx)*sy); } H[y*S+x]=h; }
    // pebbles: small rounded bumps (the aggregate that catches low sun)
    for(let k=0;k<5200;k++){ const cx=rnd()*S, cy=rnd()*S, r=1+rnd()*2.6, hh=0.25+rnd()*0.35;
      for(let y=Math.floor(cy-r);y<=cy+r;y++) for(let x=Math.floor(cx-r);x<=cx+r;x++){ const d=Math.hypot(x-cx,y-cy)/r; if(d>=1) continue; const X=(x+S)%S, Y=(y+S)%S; H[Y*S+X]+=hh*Math.sqrt(1-d*d)*0.4; } }
    const nrm=new Uint8Array(S*S*4), rgh=new Uint8Array(S*S*4); const st=5.5;
    for(let y=0;y<S;y++) for(let x=0;x<S;x++){ const i=y*S+x; const hx=H[y*S+(x+1)%S]-H[y*S+(x-1+S)%S], hy=H[((y+1)%S)*S+x]-H[((y-1+S)%S)*S+x];
      let nx=-hx*st, ny=-hy*st, nz=1; const l=Math.hypot(nx,ny,nz); nx/=l; ny/=l; nz/=l;
      nrm[i*4]=(nx*0.5+0.5)*255; nrm[i*4+1]=(ny*0.5+0.5)*255; nrm[i*4+2]=(nz*0.5+0.5)*255; nrm[i*4+3]=255;
      const cav=Math.max(0,Math.min(1,0.55+(H[i]-0.5)*1.6)); const r=0.72+0.28*(1-cav); rgh[i*4]=255; rgh[i*4+1]=Math.round(r*255); rgh[i*4+2]=0; rgh[i*4+3]=255; }
    const mk=(data)=>{ const t=new THREE.DataTexture(data,S,S,THREE.RGBAFormat); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.magFilter=THREE.LinearFilter; t.minFilter=THREE.LinearMipmapLinearFilter; t.generateMipmaps=true; t.needsUpdate=true; return t; };
    DETAIL={normal:mk(nrm), rough:mk(rgh)}; return DETAIL; }

  // spatial grid over the road triangles: y (and normal) of the actual road surface at x,z
  function surface(meshes){ const cell=8, cells=new Map(), tris=[]; const v=new THREE.Vector3();
    meshes.forEach(o=>{ o.updateMatrixWorld(true); const g=o.geometry, p=g.attributes.position, ix=g.index; const W=new Float32Array(p.count*3);
      for(let k=0;k<p.count;k++){ v.fromBufferAttribute(p,k).applyMatrix4(o.matrixWorld); W[k*3]=v.x; W[k*3+1]=v.y; W[k*3+2]=v.z; }
      const n=ix?ix.count:p.count; for(let f=0;f<n;f+=3){ const a=ix?ix.getX(f):f, b=ix?ix.getX(f+1):f+1, c=ix?ix.getX(f+2):f+2; const t=tris.length; tris.push(W,a,b,c);
        const x0=Math.min(W[a*3],W[b*3],W[c*3]), x1=Math.max(W[a*3],W[b*3],W[c*3]), z0=Math.min(W[a*3+2],W[b*3+2],W[c*3+2]), z1=Math.max(W[a*3+2],W[b*3+2],W[c*3+2]);
        for(let gx=Math.floor(x0/cell);gx<=Math.floor(x1/cell);gx++) for(let gz=Math.floor(z0/cell);gz<=Math.floor(z1/cell);gz++){ const key=gx+','+gz; let L=cells.get(key); if(!L){ L=[]; cells.set(key,L); } L.push(t); } } });
    return { at(x,z){ const L=cells.get(Math.floor(x/cell)+','+Math.floor(z/cell)); if(!L) return null; let best=null;
        for(const t of L){ const W=tris[t], a=tris[t+1]*3, b=tris[t+2]*3, c=tris[t+3]*3;
          const d=(W[b+2]-W[c+2])*(W[a]-W[c])+(W[c]-W[b])*(W[a+2]-W[c+2]); if(Math.abs(d)<1e-9) continue;
          const l0=((W[b+2]-W[c+2])*(x-W[c])+(W[c]-W[b])*(z-W[c+2]))/d, l1=((W[c+2]-W[a+2])*(x-W[c])+(W[a]-W[c])*(z-W[c+2]))/d, l2=1-l0-l1;
          if(l0<-1e-4||l1<-1e-4||l2<-1e-4) continue; const y=l0*W[a+1]+l1*W[b+1]+l2*W[c+1]; if(best===null||y>best) best=y; }
        return best; } }; }

  // per-vertex road coordinates: x = lateral (m, + right), y = racing-line lateral at that sample, z = half width
  function roadAttr(o,W,P,A){ const g=o.geometry, p=g.attributes.position, n=p.count; const out=new Float32Array(n*3); const v=new THREE.Vector3(); o.updateMatrixWorld(true);
    for(let k=0;k<n;k++){ v.fromBufferAttribute(p,k).applyMatrix4(o.matrixWorld); const inf=W.hash(v.x,v.z,3); const i=inf.i<0?0:inf.i;
      const lat=(v.x-P.x[i])*P.rx[i]+(v.z-P.z[i])*P.rz[i]; out[k*3]=lat; out[k*3+1]=A&&A.line?A.line[i]:0; out[k*3+2]=P.w[i]/2; }
    g.setAttribute('aRoad',new THREE.BufferAttribute(out,3)); }

  // metres per UV unit along u and v, measured on the mesh (so the detail maps tile at a real size)
  function uvScale(o){ const g=o.geometry, p=g.attributes.position, uv=g.attributes.uv, ix=g.index; if(!uv) return [1,1]; const a=new THREE.Vector3(), b=new THREE.Vector3(), c=new THREE.Vector3();
    let su=0,sv=0,nu=0,nv=0; const n=Math.min((ix?ix.count:p.count),3000);
    for(let f=0;f<n;f+=3){ const i0=ix?ix.getX(f):f, i1=ix?ix.getX(f+1):f+1, i2=ix?ix.getX(f+2):f+2;
      a.fromBufferAttribute(p,i0).applyMatrix4(o.matrixWorld); b.fromBufferAttribute(p,i1).applyMatrix4(o.matrixWorld); c.fromBufferAttribute(p,i2).applyMatrix4(o.matrixWorld);
      const du1=uv.getX(i1)-uv.getX(i0), dv1=uv.getY(i1)-uv.getY(i0), du2=uv.getX(i2)-uv.getX(i0), dv2=uv.getY(i2)-uv.getY(i0);
      const e1=b.clone().sub(a), e2=c.clone().sub(a); const det=du1*dv2-du2*dv1; if(Math.abs(det)<1e-9) continue;
      const T=e1.clone().multiplyScalar(dv2).sub(e2.clone().multiplyScalar(dv1)).divideScalar(det), B=e2.clone().multiplyScalar(du1).sub(e1.clone().multiplyScalar(du2)).divideScalar(det);
      const lt=T.length(), lb=B.length(); if(isFinite(lt)&&lt<1e4){ su+=lt; nu++; } if(isFinite(lb)&&lb<1e4){ sv+=lb; nv++; } }
    return [nu?su/nu:1, nv?sv/nv:1]; }

  const RD={
    detailMaps, surface, roadAttr, uvScale,
    // upgrade the asphalt material of mesh o (a clone, so nothing else shares the change)
    upgradeAsphalt(o,W,P,A,L,Q){ const R=L.road||{}; roadAttr(o,W,P,A); const [mu,mv]=uvScale(o); const D=detailMaps();
      const m=o.material.clone(); o.material=m; const tile=R.detailTile||1.6;
      const nm=D.normal.clone(); nm.repeat.set(mu/tile,mv/tile); nm.needsUpdate=true; const rm=D.rough.clone(); rm.repeat.set(mu/tile,mv/tile); rm.needsUpdate=true;
      if(Q.roadDetail>=1){ m.normalMap=nm; m.normalScale=new THREE.Vector2(R.normalScale||0.55,R.normalScale||0.55); m.roughnessMap=rm; }
      m.roughness=R.roughness||0.92; m.metalness=0; m.envMapIntensity=R.envMapIntensity!=null?R.envMapIntensity:0.9;
      if(m.map){ m.map.anisotropy=Math.min(16,GFX.renderer.maxAnisotropy()); }
      const U={rdRubber:{value:R.rubber!=null?R.rubber:0.22},rdDust:{value:new THREE.Color(R.dust||0x9a8a72)},rdDustAmt:{value:R.dustAmt!=null?R.dustAmt:0.35},rdMacro:{value:R.macro!=null?R.macro:0.12}};
      m.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,U);
        sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 aRoad; varying vec3 vRoad; varying vec3 vRW;')
          .replace('#include <project_vertex>','#include <project_vertex>\nvRoad=aRoad; vRW=(modelMatrix*vec4(transformed,1.0)).xyz;');
        sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
          varying vec3 vRoad; varying vec3 vRW; uniform float rdRubber,rdDustAmt,rdMacro; uniform vec3 rdDust;
          float rdh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
          float rdn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(rdh(i),rdh(i+vec2(1,0)),f.x),mix(rdh(i+vec2(0,1)),rdh(i+vec2(1,1)),f.x),f.y);}
          float rdRub, rdEdge;`)
          .replace('#include <map_fragment>',`#include <map_fragment>
          { float lat=vRoad.x, line=vRoad.y, hw=max(vRoad.z,1.);
            float mac=rdn(vRW.xz*0.021)*0.6+rdn(vRW.xz*0.083)*0.4;                 // macro drift, 12 m and 50 m scales
            diffuseColor.rgb*=1.0+rdMacro*(mac-0.5)*2.0;
            diffuseColor.rgb*=mix(vec3(1.0),vec3(1.03,1.0,0.96),rdn(vRW.xz*0.006+3.7)); // warm/cool patches
            float dl=abs(lat-line); float lane=exp(-pow((dl-0.78)/0.42,2.0));          // two tyre lanes on the racing line
            float brk=0.6+0.4*rdn(vRW.xz*0.35); rdRub=lane*brk;
            diffuseColor.rgb*=1.0-rdRubber*rdRub;
            float e=clamp(abs(lat)/hw,0.,1.2); rdEdge=smoothstep(0.78,1.02,e)*(0.55+0.45*rdn(vRW.xz*0.6));
            diffuseColor.rgb=mix(diffuseColor.rgb,rdDust,rdDustAmt*rdEdge); }`)
          .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
          roughnessFactor=clamp(roughnessFactor*(1.0-0.28*rdRub)+0.08*rdEdge,0.25,1.0);`); };
      m.customProgramCacheKey=()=>'rr_asphalt_v2'; m.needsUpdate=true; return m; },
    // lane lines: worn paint, smoother than asphalt
    upgradeLines(o,L){ const m=o.material.clone(); o.material=m; m.roughness=0.62; m.envMapIntensity=0.8;
      m.onBeforeCompile=sh=>{ sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vRW;').replace('#include <project_vertex>','#include <project_vertex>\nvRW=(modelMatrix*vec4(transformed,1.0)).xyz;');
        sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vRW; float lnh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} float lnn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(lnh(i),lnh(i+vec2(1,0)),f.x),mix(lnh(i+vec2(0,1)),lnh(i+vec2(1,1)),f.x),f.y);}')
          .replace('#include <map_fragment>','#include <map_fragment>\n{ float w=lnn(vRW.xz*0.9)*0.6+lnn(vRW.xz*4.1)*0.4; float worn=smoothstep(0.45,0.85,w); diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.085,0.085,0.09),worn*0.55); }'); };
      m.customProgramCacheKey=()=>'rr_lines_v2'; m.needsUpdate=true; return m; },
  };
  window.GFX=window.GFX||{}; window.GFX.road=RD;
})();
