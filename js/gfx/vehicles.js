// Ryden's Racers · Graphics V2 · Vehicle materials
// -----------------------------------------------------------------------------------------------
// A reusable vehicle material system. Each car can have a PROFILE describing its paint, glass, rubber,
// metal and lights; cars without one get the generic profile. Phase 2 proves the system on the GT40.
//
// How it maps onto the assets: Meshy cars have a single baked material (atlas base + metal/roughness +
// normal). A material-ID mask (tools/car_matid.py -> models/cars/<car>_matid.png: R clearcoat, G glass,
// B bare metal) tells the shader which texels are paint, glass or metal, so each gets its own response:
//   paint  -> MeshPhysicalMaterial base layer + clearcoat (clearcoatMap = mask.R)
//   glass  -> darkened, near-mirror clearcoat, higher specular
//   metal  -> metalness 1, low roughness (chrome, polished alloy)
//   rest   -> the atlas' own roughness (tyres, trim, interior), no clearcoat
// Wheels get their own material (no clearcoat; rubber roughness; metal rims from the mask).
// Procedural cars (the non-GLB bodies) keep their materials but move to the V2 environment.
// Phase 3: the proper fix. tools/blender/rr_car_slots.py gives every face of a car a named material slot
// (car_paint, car_glass, car_lights, car_chrome, car_rubber, car_tire, car_wheel, car_interior, car_trim,
// car_emissive) and exports <car>.v2.glb. On load, foldSlots() folds the slots of each part back into ONE
// mesh with a per-vertex slot id (aSlot) and the original single material, so the game code, the legacy
// look and the draw-call count are exactly as before; on a V2 track slotMaterial() shades every slot on
// its own (one draw per part, as before). Slot values: SLOT_DEFAULTS, overridden per car in PROFILES[id].slots.
// Cars without a .v2.glb keep the Phase 2 path (matid mask, or the generic profile).
(function(){
  const PROFILES={
    _generic:{ paint:{roughness:null, clearcoat:0.8, clearcoatRoughness:0.08}, env:1.0 },
    gt44:{ // Ford GT40-style race car: solid (non-metallic) red/black race paint under a deep clear coat
      matid:'models/cars/gt40_matid.png?v=1',   // Phase 2 fallback (used only if gt40.v2.glb is not loaded)
      paint:{ roughness:0.42, metalness:0.0, clearcoat:0.85, clearcoatRoughness:0.035, flake:0 },
      glass:{ tint:[0.16,0.19,0.2], roughness:0.03, specular:1.0 },
      metal:{ roughness:0.18 },
      rubber:{ roughness:0.88, tint:0.85 },
      env:0.9, normalScale:0.8,
      slots:{ car_paint:{rough:0.4, keep:0.25, cc:0.9, ccRough:0.035} },
    },
    missile:{ env:0.85, normalScale:0.9,   // Missile Commander: military-grey satin body, gunmetal hardware
      slots:{ car_paint:{rough:0.55, keep:0.4, cc:0.35, ccRough:0.2}, car_chrome:{rough:0.3, tint:[0.85,0.85,0.85]} } },
    trout:{ env:0.95, normalScale:0.85,     // Trout Protocol: glossy metallic livery
      slots:{ car_paint:{rough:0.32, keep:0.25, metal:0.35, cc:1.0, ccRough:0.03} } },
    duck:{ env:0.95, normalScale:0.85,      // Duck Plasma: candy paint, bright lights
      slots:{ car_paint:{rough:0.35, keep:0.2, cc:1.0, ccRough:0.03}, car_lights:{emis:0.6} } },
    bpd:{ env:0.9, normalScale:0.85, police:true,     // BPD 69: police cruiser, working light bar
      slots:{ car_paint:{rough:0.45, keep:0.3, cc:0.8, ccRough:0.06} } },
    donut:{ env:0.9, normalScale:0.85, police:true,   // Donut Patrol
      slots:{ car_paint:{rough:0.45, keep:0.3, cc:0.8, ccRough:0.06} } },
    // Phase 4: the remaining eight GLB cars, each with its own finish so they do not all read as one "car paint"
    hellcat:{ env:0.95, normalScale:0.85,   // Colonial Hellcat: deep navy metallic, show-car clear coat, hot headlamps (slots fixed by recipe, Phase 5)
      slots:{ car_paint:{rough:0.34, keep:0.2, metal:0.35, cc:1.0, ccRough:0.025}, car_lights:{emis:0.55} } },
    leopard:{ env:0.9, normalScale:0.9,     // Black Lightning (leopard print): satin-wrap vinyl over the body
      slots:{ car_paint:{rough:0.5, keep:0.4, cc:0.4, ccRough:0.16}, car_chrome:{rough:0.25, tint:[0.7,0.7,0.72]} } },
    concord:{ env:1.05, normalScale:0.8,    // Concordance: silk-black limousine, mirror-deep clear coat, polished chrome and gold crests
      slots:{ car_paint:{rough:0.28, keep:0.15, metal:0.15, cc:1.0, ccRough:0.015}, car_chrome:{rough:0.06} } },
    lightning:{ env:1.0, normalScale:0.85,  // White Lightning GT3 R: pearl white (a touch of flake), carbon trim, race lamps
      slots:{ car_paint:{rough:0.34, keep:0.2, metal:0.25, cc:1.0, ccRough:0.03}, car_trim:{rough:0.38, cc:0.6}, car_lights:{emis:0.6} } },
    genlee:{ env:0.95, normalScale:0.85,    // General Lee: 1969 solid orange enamel, older and softer than a modern clear coat; chrome bumpers
      slots:{ car_paint:{rough:0.44, keep:0.3, cc:0.7, ccRough:0.07}, car_chrome:{rough:0.1} } },
    brcc:{ env:0.85, normalScale:0.95,      // BRCC rally hatch: black-and-gold camo wrap (matte), gold wheels
      slots:{ car_paint:{rough:0.62, keep:0.5, cc:0.2, ccRough:0.3}, car_wheel:{rough:0.3, metal:0.9} } },
    fdc:{ env:0.85, normalScale:0.95,       // Firearms Direct Club pickup: sand-tan bedliner-textured paint, rough rubber and steel
      slots:{ car_paint:{rough:0.68, keep:0.55, cc:0.12, ccRough:0.4}, car_trim:{rough:0.8, cc:0.0}, car_chrome:{rough:0.35, tint:[0.8,0.8,0.8]} } },
    voyager:{ env:0.95, normalScale:0.8,    // Midnight Voyager (Bus V2): fleet-white coach paint, big tinted side glass, bright lamp clusters
      slots:{ car_paint:{rough:0.38, keep:0.25, cc:0.85, ccRough:0.05}, car_glass:{tint:[0.2,0.22,0.24], rough:0.03}, car_lights:{emis:0.7} } },
  };
  // per-slot shading (rough/metal: value used; keep: how much of the atlas' own roughness survives;
  // cc: clearcoat amount; tint: albedo multiplier; emis: albedo-as-emission strength)
  const SLOTS=['car_paint','car_glass','car_lights','car_chrome','car_rubber','car_tire','car_wheel','car_interior','car_trim','car_emissive'];
  const SLOT_DEFAULTS={
    car_paint:   {rough:0.42, keep:0.3, metal:0.0, cc:1.0, ccRough:0.05, tint:[1,1,1], emis:0},
    car_glass:   {rough:0.035,keep:0,   metal:0.0, cc:1.0, tint:[0.42,0.46,0.5], emis:0},
    car_lights:  {rough:0.08, keep:0,   metal:0.0, cc:1.0, tint:[1,1,1], emis:0.35},
    car_chrome:  {rough:0.12, keep:0,   metal:1.0, cc:0.0, tint:[1.25,1.25,1.25], emis:0},
    car_rubber:  {rough:0.9,  keep:0,   metal:0.0, cc:0.0, tint:[0.9,0.9,0.9], emis:0},
    car_tire:    {rough:0.92, keep:0,   metal:0.0, cc:0.0, tint:[0.85,0.85,0.85], emis:0},
    car_wheel:   {rough:0.32, keep:0.3, metal:0.8, cc:0.0, tint:[1.05,1.05,1.05], emis:0},
    car_interior:{rough:0.85, keep:0,   metal:0.0, cc:0.0, tint:[0.8,0.8,0.8], emis:0},
    car_trim:    {rough:0.6,  keep:0.3, metal:0.0, cc:0.2, tint:[1,1,1], emis:0},
    car_emissive:{rough:0.3,  keep:0,   metal:0.0, cc:1.0, tint:[1,1,1], emis:2.6},
  };
  const texCache={};
  const loadTex=(url)=>{ if(!texCache[url]){ const t=new THREE.TextureLoader().load(url); t.flipY=false; t.colorSpace=THREE.NoColorSpace; t.anisotropy=4; texCache[url]=t; } return texCache[url]; };

  function carMaterial(src,prof,isWheel,env){ const pa=prof.paint||{}, gl=prof.glass||{}, me=prof.metal||{}, ru=prof.rubber||{};
    const m=new THREE.MeshPhysicalMaterial({ map:src.map||null, normalMap:src.normalMap||null, roughnessMap:src.roughnessMap||null, metalnessMap:src.metalnessMap||null,
      color:src.color?src.color.clone():new THREE.Color(1,1,1), roughness:src.roughness!=null?src.roughness:1, metalness:src.metalness!=null?src.metalness:0,
      envMap:env||null, envMapIntensity:prof.env||1, clearcoat:isWheel?0:(pa.clearcoat!=null?pa.clearcoat:1), clearcoatRoughness:pa.clearcoatRoughness||0.05 });
    if(m.normalMap) m.normalScale=new THREE.Vector2(prof.normalScale||1,prof.normalScale||1);
    if(src.map) m.map.anisotropy=Math.min(8,GFX.renderer.maxAnisotropy());
    const mid=prof.matid?loadTex(prof.matid):null; if(mid&&!isWheel) m.clearcoatMap=mid;
    const U={vmMid:{value:mid},vmUse:{value:mid?1:0},vmWheel:{value:isWheel?1:0},vmPaintR:{value:pa.roughness!=null?pa.roughness:-1},vmPaintM:{value:pa.metalness!=null?pa.metalness:-1},
      vmGlassT:{value:new THREE.Vector3(...(gl.tint||[0.2,0.2,0.22]))},vmGlassR:{value:gl.roughness||0.04},vmMetalR:{value:me.roughness||0.2},vmRubR:{value:ru.roughness||0.88},vmRubT:{value:ru.tint||0.9}};
    m.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,U);
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D vmMid; uniform float vmUse,vmWheel,vmPaintR,vmPaintM,vmGlassR,vmMetalR,vmRubR,vmRubT; uniform vec3 vmGlassT; vec3 vmId;')
        .replace('#include <map_fragment>',`#include <map_fragment>
          vmId=vmUse>0.5?texture2D(vmMid,${GFX.compat.uvMap}).rgb:vec3(0.);
          if(vmWheel>0.5){ vmId.r=0.; vmId.g=0.; }
          diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vmGlassT*2.2,vmId.g);
          float vmRest=clamp(1.-vmId.r-vmId.b,0.,1.)*step(max(diffuseColor.r,max(diffuseColor.g,diffuseColor.b)),0.22);
          diffuseColor.rgb*=mix(1.,vmRubT,vmRest*vmWheel);`)
        .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
          float vmPaint=clamp(vmId.r-vmId.g,0.,1.);
          if(vmPaintR>=0.) roughnessFactor=mix(roughnessFactor,vmPaintR,vmPaint);
          roughnessFactor=mix(roughnessFactor,vmGlassR,vmId.g); roughnessFactor=mix(roughnessFactor,vmMetalR,vmId.b);
          roughnessFactor=mix(roughnessFactor,max(roughnessFactor,vmRubR),vmRest*vmWheel);`)
        .replace('#include <metalnessmap_fragment>',`#include <metalnessmap_fragment>
          if(vmPaintM>=0.) metalnessFactor=mix(metalnessFactor,vmPaintM,clamp(vmId.r-vmId.g,0.,1.));
          metalnessFactor=mix(metalnessFactor,0.,vmId.g); metalnessFactor=mix(metalnessFactor,1.,vmId.b);`); };
    m.customProgramCacheKey=()=>'rr_car_v2_'+(isWheel?'w':'b')+(mid?'m':'');
    return m; }

  function slotMaterial(src,prof,env){ const S=SLOTS.map(n=>Object.assign({},SLOT_DEFAULTS[n],(prof.slots||{})[n]||{}));
    const m=new THREE.MeshPhysicalMaterial({ map:src.map||null, normalMap:src.normalMap||null, roughnessMap:src.roughnessMap||null, metalnessMap:src.metalnessMap||null,
      color:new THREE.Color(1,1,1), roughness:1, metalness:0, envMap:env||null, envMapIntensity:prof.env||1, clearcoat:1, clearcoatRoughness:(S[0].ccRough||0.05) });
    m.name='car_slots'; if(m.normalMap) m.normalScale=new THREE.Vector2(prof.normalScale||1,prof.normalScale||1); if(src.map) m.map.anisotropy=Math.min(8,GFX.renderer.maxAnisotropy());
    const U={vsRough:{value:S.map(x=>x.rough)},vsKeep:{value:S.map(x=>x.keep)},vsMetal:{value:S.map(x=>x.metal)},vsCC:{value:S.map(x=>x.cc)},
      vsTint:{value:S.map(x=>new THREE.Vector3(...x.tint))},vsEmis:{value:S.map(x=>x.emis)},vsTime:{value:0},vsPolice:{value:prof.police?1:0}};
    m.userData.slotUniforms=U;
    m.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,U);
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aSlot; varying float vSlot; varying float vSide;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\nvSlot=aSlot; vSide=sign(position.x);');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vSlot; varying float vSide; uniform float vsRough[10],vsKeep[10],vsMetal[10],vsCC[10],vsEmis[10],vsTime,vsPolice; uniform vec3 vsTint[10]; int vsI;')
        .replace('#include <map_fragment>','#include <map_fragment>\nvsI=int(vSlot+0.5); diffuseColor.rgb*=vsTint[vsI];')
        .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(vsRough[vsI],roughnessFactor,vsKeep[vsI]);')
        .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=vsMetal[vsI];')
        .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n{ float e=vsEmis[vsI]; if(vsI==9&&vsPolice>0.5){ float ph=fract(vsTime*1.6+(vSide>0.?0.5:0.)); e*=0.15+0.85*step(ph,0.18)+0.85*step(0.3,ph)*step(ph,0.42); } totalEmissiveRadiance+=diffuseColor.rgb*e; }')
        .replace('#include <lights_physical_fragment>','#include <lights_physical_fragment>\n#ifdef USE_CLEARCOAT\nmaterial.clearcoat*=vsCC[vsI];\n#endif'); };
    m.customProgramCacheKey=()=>'rr_car_slots_v3'; return m; }

  // Folds a slotted car GLB (tools/blender/rr_car_slots.py) back to one mesh per part with aSlot, keeping the
  // node names, transforms and a single material, so game.js loads it exactly like the original.
  function foldSlots(scene){ const isSlot=m=>m&&SLOTS.includes(m.name); let parts=0, slots=0;
    const todo=[]; scene.traverse(o=>{ if(o.isMesh&&isSlot(o.material)&&!(o.parent&&o.parent.isGroup&&o.parent.children.every(c=>c.isMesh&&isSlot(c.material))&&o.parent.children.length>1)) todo.push([o,[o]]);
      else if(o.isGroup&&o.children.length>1&&o.children.every(c=>c.isMesh&&isSlot(c.material))) todo.push([o,o.children.slice()]); });
    for(const [node,list] of todo){ let nv=0, ni=0; list.forEach(c=>{ nv+=c.geometry.attributes.position.count; ni+=c.geometry.index?c.geometry.index.count:c.geometry.attributes.position.count; });
      const g0=list[0].geometry, names=Object.keys(g0.attributes).filter(k=>list.every(c=>c.geometry.attributes[k]&&c.geometry.attributes[k].itemSize===g0.attributes[k].itemSize));
      const out=new THREE.BufferGeometry(); const arrs={}; names.forEach(k=>{ arrs[k]=new Float32Array(nv*g0.attributes[k].itemSize); });
      const slot=new Float32Array(nv), I=new Uint32Array(ni); let ov=0, oi=0;
      list.forEach(c=>{ const g=c.geometry, n=g.attributes.position.count, sid=SLOTS.indexOf(c.material.name); if(c!==node){ c.updateMatrix(); if(!c.matrix.equals(new THREE.Matrix4())) g.applyMatrix4(c.matrix); }
        names.forEach(k=>{ const A=g.attributes[k], is=A.itemSize; for(let v=0;v<n;v++) for(let q=0;q<is;q++) arrs[k][(ov+v)*is+q]=A.getComponent(v,q); });
        slot.fill(sid,ov,ov+n); if(g.index){ const ix=g.index.array; for(let q=0;q<ix.length;q++) I[oi+q]=ix[q]+ov; oi+=ix.length; } else { for(let q=0;q<n;q++) I[oi+q]=ov+q; oi+=n; } ov+=n; });
      names.forEach(k=>out.setAttribute(k,new THREE.BufferAttribute(arrs[k],g0.attributes[k].itemSize,false))); out.setAttribute('aSlot',new THREE.BufferAttribute(slot,1)); out.setIndex(new THREE.BufferAttribute(I,1));
      const mat=list[0].material.clone(); mat.name='car_baked';
      if(node.isMesh){ node.geometry=out; node.material=mat; }
      else { const mesh=new THREE.Mesh(out,mat); mesh.name=node.name; mesh.position.copy(node.position); mesh.quaternion.copy(node.quaternion); mesh.scale.copy(node.scale); mesh.userData=node.userData; const par=node.parent; par.add(mesh); par.remove(node); }
      parts++; slots+=list.length; }
    scene.userData.slotFold={parts,slots}; return scene; }

  const VM={
    PROFILES, SLOTS, SLOT_DEFAULTS, foldSlots, slotMaterial,
    profile(id){ return PROFILES[id]||PROFILES._generic; },
    // swap a car's materials to its V2 profile. car: a Car (car.def / car.model), env: PMREM texture
    apply(car,env){ const v=car.v||car.def||{}; const id=v.id; const prof=VM.profile(id); const root=car.model&&car.model.root; if(!root) return 0; let n=0;
      const cache=new Map();
      root.traverse(o=>{ if(!o.isMesh||!o.visible||!o.material||Array.isArray(o.material)) return; const src=o.material;
        if(car.model.glb && src.isMeshStandardMaterial && o.geometry.attributes.aSlot){   // Phase 3: exported material slots
          const key=src.uuid+'s'; if(!cache.has(key)){ const sm=slotMaterial(src,prof,env); cache.set(key,sm); } o.material=cache.get(key); n++;
          if(prof.police&&!o.userData.vsTick){ o.userData.vsTick=1; const U=o.material.userData.slotUniforms; o.onBeforeRender=()=>{ U.vsTime.value=performance.now()/1000; }; } }
        else if(car.model.glb && src.isMeshStandardMaterial && !src.isMeshPhysicalMaterial && (src.map||src.normalMap)){
          const wheel=!!(o.parent&&o.parent.parent&&car.model.wheels&&car.model.wheels.includes(o.parent));
          const key=src.uuid+(wheel?'w':'b'); if(!cache.has(key)) cache.set(key,carMaterial(src,prof,wheel,env)); o.material=cache.get(key); n++; }
        else if(src.isMeshStandardMaterial){ src.envMap=env; src.envMapIntensity=(prof.env||1); src.needsUpdate=true; } });
      // tail-light glow sprites: authored for the old pipeline; with bloom and physical light they read as pink blobs
      if(car.model.tailMat&&!car.model.tailMat.userData.v2){ car.model.tailMat.userData.v2=1; car.model.tailMat.color.multiplyScalar(0.4); }
      return n; },
  };
  window.GFX=window.GFX||{}; window.GFX.vehicles=VM;
})();
