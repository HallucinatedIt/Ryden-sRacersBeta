// Ryden's Racers · Graphics V2 · Track looks (the V2 orchestrator)
// -----------------------------------------------------------------------------------------------
// A LOOK is the complete Graphics V2 description of one track: sun, sky, image-based lighting, haze,
// tone mapping, grade, bloom/AO character, water, road and material rules. Phase 2 defines Pacifica only;
// every other track keeps the legacy look (on the modern renderer) until it gets its own look.
//
// Lifecycle (called from Race; graphics only, no gameplay data is read-write):
//   begin(def, game)  before the world is built: colour management on, V2 tier overrides on
//   finish(race)      after the world + cars exist: lighting, sky/IBL, water, materials, road, decals, zones
//   end(race)         when the race is disposed: everything back to the legacy defaults
//
// Developer switches: ?gfx=legacy (Phase 1 look), ?three=r128 (the original renderer), ?post=off|noao|nobloom|nohaze|nograde
(function(){
  const LOOKS={
    coast:{ name:'Pacifica · golden afternoon',
      colorManaged:true, toneMapping:'neutral', exposure:1.3,
      sunDir:[-0.78,0.46,0.22],
      sun:{ color:0xffe2bd, intensity:3.7, shadowBias:-0.00025, normalBias:0.025, radius:2.2 },
      sky:{ zenith:0x2f64b8, horizon:0xcfdce6, warm:0xc8783c, ground:0x5a5046, mie:0.9, disk:30, sunRadiance:1.0, clouds:0.34, horizonPow:0.32, brightness:1.0 },
      ibl:{ skyScale:1.0, intensity:0.7 },
      hemi:0.0,
      haze:{ density:0.00045, falloff:0.011, start:25, base:-9, color:0xd6cfc4, sunColor:0xffc68c },
      fog:{ near:900, far:5200 },
      bloom:{ threshold:1.6, knee:0.7, intensity:0.05, radius:1.0 },
      ao:{ radius:0.9, intensity:0.85, thickness:1.2, exponent:1.5, falloff:1.0 },
      grade:{ saturation:1.08, contrast:1.05, wb:[1.0,1.0,0.975], lift:[0.004,0.004,0.008], gain:[1,1,1], gamma:1.0, vignette:0.14 },
      ocean:{ deep:0x08314d, shallow:0x1c6f88, sunGlint:7, roughness:0.1 },
      road:{ roughness:0.9, normalScale:0.6, detailTile:1.4, rubber:0.22, dust:0x9a8a70, dustAmt:0.32, macro:0.12, envMapIntensity:0.3 },
      decals:{ patchEvery:170, tarEvery:55, crackEvery:40 },
      // material rules by glTF material name (env GLB)
      materials:[
        {re:/^m_(galv|galv_ds|steel|steel_dark|steel_teal|alu|tin)$/, set:{metalness:0.85, roughness:0.42, envMapIntensity:1.0}},
        {re:/^m_glass$/, set:{metalness:0.0, roughness:0.06, envMapIntensity:1.6}},
        {re:/^m_glass_lamp$/, set:{emissiveIntensity:2.0}},
        {re:/^m_car_(red|white|yellow)$/, physical:{clearcoat:1, clearcoatRoughness:0.06, roughness:0.4}},
        {re:/^m_(paint_white|paint_red|paint_orange|blue)$/, set:{roughness:0.55}},
        {re:/^m_(signs|gantry_sign)$/, set:{emissiveIntensity:1.25}},
        {re:/^m_maximus$/, set:{emissiveIntensity:1.1}},
        {re:/^m_(concrete_coast|concrete_plain|stone)$/, detail:'stone'},
        {re:/^m_coast_rock$/, detail:'rock'},
        {re:/^m_ground$/, detail:'ground'},
        {re:/^m_(scrub|foliage)$/, set:{roughness:0.85}},
      ],
      // intentional dressing: every placement has a reason (i = track sample, lat = metres right of the centreline, yaw = radians)
      dressing:[
        // cliff overlook (the lay-by with the view over the ocean): somewhere to stop
        {asset:'pc_picnic_table', i:146, lat:16.5, yaw:0.25}, {asset:'pc_picnic_table', i:154, lat:17.5, yaw:-0.35},
        {asset:'pc_trash_can', i:142, lat:12.8, yaw:0.0}, {asset:'pc_trash_can', i:158, lat:13.0, yaw:1.2},
        // festival paddock behind the start: a classic on display for the crowd
        {asset:'pc_corvette_gs', i:878, lat:-19.5, yaw:-1.0, lod1:55, far:600},
        {asset:'pc_trash_can', i:872, lat:-14.5, yaw:0.4},
      ],
      zones:[
        {re:/^pc_(grass)$/, zone:'near', cell:320, far:460},
        {re:/^pc_(scrub|rocks)$/, zone:'near', cell:380, far:700},
        {re:/^pc_shore_rocks$/, zone:'near', cell:450, far:1200},
        {re:/^pc_(cypress|palms)$/, zone:'mid', cell:450, far:1600},
        {re:/^pc_(guardrail|trackside|roadside|support|crowd)$/, zone:'mid', cell:500, far:1400},
      ],
    },
  };
  const qs=(()=>{ try{ return new URLSearchParams(location.search); }catch(e){ return new URLSearchParams(''); } })();

  // world-space detail for natural surfaces: macro variation + detail normal (shared aggregate map)
  function detailMaterial(m,kind){ if(m.userData.v2detail) return; m.userData.v2detail=kind; const D=GFX.road.detailMaps();
    if(!m.normalMap){ const n=D.normal.clone(); n.needsUpdate=true; const rep=kind==='rock'?0.35:kind==='stone'?0.6:0.5; n.repeat.set(rep*8,rep*8); m.normalMap=n; m.normalScale=new THREE.Vector2(kind==='rock'?1.3:0.6,kind==='rock'?1.3:0.6); }
    m.roughness=Math.max(m.roughness,kind==='stone'?0.85:0.92);
    const src=GFX.compat.uvMap;
    m.onBeforeCompile=sh=>{ sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vDW; varying vec3 vDN;').replace('#include <project_vertex>','#include <project_vertex>\nvDW=(modelMatrix*vec4(transformed,1.0)).xyz; vDN=normalize(mat3(modelMatrix)*objectNormal);');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vDW; varying vec3 vDN; float dth(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} float dtn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(dth(i),dth(i+vec2(1,0)),f.x),mix(dth(i+vec2(0,1)),dth(i+vec2(1,1)),f.x),f.y);}')
        .replace('#include <map_fragment>','#include <map_fragment>\n'+(
          kind==='rock'? '{ vec2 q=vDW.xz+vDW.y*vec2(0.7,-0.4); float mac=dtn(q*0.018)*0.6+dtn(q*0.07)*0.4; float strata=0.5+0.5*sin(vDW.y*1.9+dtn(vDW.xz*0.05)*5.); float up=clamp(vDN.y,0.,1.);'
             +' diffuseColor.rgb*=0.74+0.46*mac; diffuseColor.rgb*=mix(vec3(0.9,0.93,0.98),vec3(1.08,1.0,0.9),strata*0.8); diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(0.86,0.92,0.72),smoothstep(0.7,0.95,up)*0.35); }'
          : kind==='ground'? '{ float mac=dtn(vDW.xz*0.012)*0.55+dtn(vDW.xz*0.05)*0.3+dtn(vDW.xz*0.2)*0.15; diffuseColor.rgb*=0.84+0.3*mac; float dry=dtn(vDW.xz*0.008+5.1); diffuseColor.rgb*=mix(vec3(0.96,1.02,0.94),vec3(1.06,1.0,0.9),dry); float sl=1.-clamp(vDN.y,0.,1.); diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(0.95,0.9,0.86),smoothstep(0.25,0.6,sl)*0.5); }'
          : '{ float mac=dtn(vDW.xz*0.05+vDW.y*0.1)*0.6+dtn(vDW.xz*0.23)*0.4; diffuseColor.rgb*=0.9+0.18*mac; }'));
    };
    m.customProgramCacheKey=()=>'rr_detail_'+kind; m.needsUpdate=true; }

  const V2={
    LOOKS, active:false, look:null, race:null,
    enabled(){ return GFX.settings.pipeline==='v2' && GFX.compat.rev>=160; },
    lookFor(def){ return def && (LOOKS[def.id]||null); },
    toneMappingConst(){ const t=(V2.look&&V2.look.toneMapping)||'aces'; return t==='neutral'?THREE.NeutralToneMapping:t==='agx'?THREE.AgXToneMapping:THREE.ACESFilmicToneMapping; },
    begin(def,game){ V2.end(); const L=V2.enabled()?V2.lookFor(def):null; if(!L) return false;
      V2.active=true; V2.look=Object.assign({},L); V2.look.sunDir=new THREE.Vector3(...L.sunDir).normalize();
      GFX.compat.colorManagement(!!L.colorManaged); if(game) game.applyQuality(); return true; },
    finish(R){ GFX.compat.singlePassTransparency(R.scene); if(!V2.active) return; const L=V2.look, W=R.W, P=R.P, A=R.A, Q=R.game.Q, r=R.game.renderer; V2.race=R; const t0=performance.now(); const rep={};
      L.hazeC={color:new THREE.Color(L.haze.color), sunColor:new THREE.Color(L.haze.sunColor)};
      // --- sun + shadows
      const sun=W.sun; W.sunDir.copy(L.sunDir); sun.color.setHex(L.sun.color); sun.intensity=L.sun.intensity;
      if(sun.castShadow){ const e=Q.shadowDistance||60; const c=sun.shadow.camera; c.left=-e; c.right=e; c.top=e; c.bottom=-e; c.near=20; c.far=420; c.updateProjectionMatrix();
        sun.shadow.mapSize.set(Q.shadowSize,Q.shadowSize); if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map=null; }
        sun.shadow.bias=L.sun.shadowBias; sun.shadow.normalBias=L.sun.normalBias; sun.shadow.radius=L.sun.radius; }
      W.v2Shadow={extent:Q.shadowDistance||60,size:Q.shadowSize};
      if(W.hemi) W.hemi.intensity=L.hemi||0;
      // --- sky dome + IBL (same sky function)
      const old=[]; W.group.traverse(o=>{ if(o.isMesh&&o.material&&o.material.uniforms&&o.material.uniforms.hor&&o.material.uniforms.top) old.push(o); });
      old.forEach(o=>{ o.visible=false; }); const dome=GFX.sky.makeDome(L,2600); W.group.add(dome); W.v2Sky=dome;
      if(Q.envLighting){ const env=GFX.sky.makeIBL(r,L); R.scene.environment=env; R.scene.environmentIntensity=L.ibl.intensity; V2.env=env; }
      // --- fog: the composite haze does aerial perspective; linear fog only hides the far clip
      if(W.fog){ W.fog.color.set(L.haze.color); W.fog.near=Q.postFX?L.fog.near:L.fog.near*0.2; W.fog.far=Q.postFX?L.fog.far:L.fog.far*0.55; }   // no composite haze on the direct path: linear fog does the aerial perspective
      // --- ocean
      W.group.traverse(o=>{ if(o.isMesh&&o.material&&o.material.uniforms&&o.material.uniforms.deep&&o.material.uniforms.shallow){ const om=GFX.sky.makeOcean(L); o.material.dispose(); o.material=om; W.updaters.push((dt,t)=>{ om.uniforms.t.value=t; }); rep.ocean=true; } });
      // --- environment materials
      const env=W.env&&W.env.root; const road=[], lines=[]; let nm=0;
      if(env){ const seen=new Set();
        env.traverse(o=>{ if(!o.isMesh) return; const m=o.material, n=(m&&m.name)||'';
          if(/^m_asphalt$/.test(n)) road.push(o); else if(/^m_line_[wy]$/.test(n)) lines.push(o);
          if(seen.has(m)) return; seen.add(m);
          for(const rule of L.materials){ if(!rule.re.test(n)) continue; nm++;
            if(rule.set) Object.assign(m,rule.set);
            if(rule.detail && Q.roadDetail>=1) detailMaterial(m,rule.detail);
            if(rule.physical){ const pm=new THREE.MeshPhysicalMaterial(); ['name','color','map','roughness','metalness','roughnessMap','metalnessMap','normalMap','normalScale','emissive','emissiveMap','emissiveIntensity','side','vertexColors','envMapIntensity','aoMap','alphaTest','transparent','opacity','flatShading'].forEach(k=>{ const v=m[k]; if(v!==undefined) pm[k]=(v&&v.clone&&!v.isTexture)?v.clone():v; }); Object.assign(pm,rule.physical); env.traverse(q=>{ if(q.material===m) q.material=pm; }); }
            m.needsUpdate=true; break; } }); }
      rep.materials=nm; if(env){ let ct=0,tt=0; const seenT=new Set(); env.traverse(o=>{ const m=o.material; if(m&&m.map&&!seenT.has(m.map)){ seenT.add(m.map); tt++; if(m.map.isCompressedTexture) ct++; } }); rep.textures={total:tt,ktx2:ct}; }
      road.forEach(o=>GFX.road.upgradeAsphalt(o,W,P,A,L,Q)); lines.forEach(o=>GFX.road.upgradeLines(o,L)); rep.road=road.length;
      // --- decals on the real road surface
      if(Q.decals && road.length){ const surf=GFX.road.surface(road); const dg=GFX.decals.build(W,P,A,surf,L,R.def.id); W.group.add(dg); rep.decals=dg.userData.stats; }
      // --- scenery zones: chunk merged meshes, distance culling, far shadows off
      if(env){ const lod=GFX.lod.manager(Q); rep.zones=lod.zoneEnvironment(env,L.zones); V2.lod=lod; W.updaters.push(()=>{ if(R.game&&R.game.camera) lod.update(R.game.camera); }); }
      // --- MSAA-friendly foliage edges
      if(Q.postFX&&Q.msaa) W.group.traverse(o=>{ if(o.isMesh&&o.material&&o.material.alphaTest>0) o.material.alphaToCoverage=true; });
      // --- cars: V2 vehicle materials + environment
      const cenv=V2.env||R.env; let nc=0; R.cars.forEach(c=>{ nc+=GFX.vehicles.apply(c,cenv); }); rep.carMaterials=nc;
      R.cars.forEach(c=>c.model.root.traverse(o=>{ if(o.isMesh&&o.material&&o.material.map&&o.material.transparent&&/shadow/i.test(o.name||'')) o.material.opacity=0.6; }));
      // --- post look
      GFX.post.enable(Object.assign({},L,{haze:Object.assign({},L.haze,L.hazeC),sunDir:L.sunDir}));
      // --- intentional dressing (Meshy props processed in Blender: real scale, LOD0/LOD1, KTX2 + Meshopt)
      V2.report=rep; if(env&&L.dressing&&Q.propDensity>0) V2.dress(R,L,Q); else V2.pending=null;
      rep.ms=Math.round(performance.now()-t0); V2.report=rep; if(qs.get('gfxdebug')) console.log('[gfx v2] Pacifica look applied',JSON.stringify(rep));
    },
    dress(R,L,Q){ const W=R.W, P=R.P; const ray=new THREE.Raycaster(); const targets=[];
      W.env.root.traverse(o=>{ if(o.isMesh&&!/grass|scrub|cypress|palms|foam|crowd|horizon|rocks/.test(o.userData.chunkOf||o.name)) targets.push(o); });
      const ids=[...new Set(L.dressing.map(d=>d.asset))]; const ld=GFX.assets.configureLoader(new THREE.GLTFLoader());
      V2.pending=Promise.all(ids.map(u=>new Promise(res=>ld.load('models/props/'+u+'.glb?v=1',g=>res([u,g.scene]),undefined,e=>{ console.warn('[gfx v2] dressing asset failed',u,e); res([u,null]); }))))
        .then(pairs=>{ if(V2.race!==R) return; const T=Object.fromEntries(pairs); const grp=new THREE.Group(); grp.name='v2_dressing'; let n=0, tris=0;
          for(const d of L.dressing){ const sc=T[d.asset]; if(!sc) continue; const i=((d.i%P.N)+P.N)%P.N; const x=P.x[i]+P.rx[i]*d.lat, z=P.z[i]+P.rz[i]*d.lat;
            ray.set(new THREE.Vector3(x,P.y[i]+60,z),new THREE.Vector3(0,-1,0)); ray.far=140; const hit=ray.intersectObjects(targets,false)[0]; const y=hit?hit.point.y:P.y[i];
            const l0=sc.getObjectByName('lod0'), l1=sc.getObjectByName('lod1'); if(!l0) continue; const levels=[{obj:l0.clone(),dist:0}]; if(l1) levels.push({obj:l1.clone(),dist:d.lod1||40});
            levels.forEach(l=>{ l.obj.position.set(0,0,0); l.obj.rotation.set(0,0,0); l.obj.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } }); });
            l0.traverse(o=>{ if(o.isMesh) tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3; });
            const lod=GFX.lod.makeLOD(levels,Q.lodBias); lod.name='dress_'+d.asset; lod.position.set(x,y+(d.dy||0),z); lod.rotation.y=Math.atan2(P.tx[i],P.tz[i])+(d.yaw||0); lod.updateMatrixWorld(true);
            grp.add(lod); n++; if(V2.lod) V2.lod.register(lod,{far:d.far||450,radius:4}); }
          W.group.add(grp); V2.report.dressing={placed:n,lod0Tris:Math.round(tris)}; V2.pending=null; }); },
    end(R){ V2.pending=null; if(!V2.active&&!V2.env) return; V2.active=false; V2.look=null; V2.race=null; V2.lod=null; GFX.post.disable(); GFX.compat.colorManagement(false);
      if(V2.env){ V2.env.dispose(); V2.env=null; } const g=window.GAME; if(g&&g.renderer) g.applyQuality(); },
  };
  window.GFX=window.GFX||{}; window.GFX.v2=V2;
})();
