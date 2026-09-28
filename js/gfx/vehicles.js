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
// A proper fix for any car is separate material slots from Blender; the mask is the stop-gap and is
// documented per car in docs/graphics-v2/08-asset-optimization.md.
(function(){
  const PROFILES={
    _generic:{ paint:{roughness:null, clearcoat:0.8, clearcoatRoughness:0.08}, env:1.0 },
    gt44:{ // Ford GT40-style race car: solid (non-metallic) red/black race paint under a deep clear coat
      matid:'models/cars/gt40_matid.png?v=1',
      paint:{ roughness:0.42, metalness:0.0, clearcoat:1.0, clearcoatRoughness:0.035, flake:0 },
      glass:{ tint:[0.16,0.19,0.2], roughness:0.03, specular:1.0 },
      metal:{ roughness:0.18 },
      rubber:{ roughness:0.88, tint:0.85 },
      env:1.0, normalScale:0.8,
    },
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

  const VM={
    PROFILES,
    profile(id){ return PROFILES[id]||PROFILES._generic; },
    // swap a car's materials to its V2 profile. car: a Car (car.def / car.model), env: PMREM texture
    apply(car,env){ const v=car.v||car.def||{}; const id=v.id; const prof=VM.profile(id); const root=car.model&&car.model.root; if(!root) return 0; let n=0;
      const cache=new Map();
      root.traverse(o=>{ if(!o.isMesh||!o.visible||!o.material||Array.isArray(o.material)) return; const src=o.material;
        if(car.model.glb && src.isMeshStandardMaterial && !src.isMeshPhysicalMaterial && (src.map||src.normalMap)){
          const wheel=!!(o.parent&&o.parent.parent&&car.model.wheels&&car.model.wheels.includes(o.parent));
          const key=src.uuid+(wheel?'w':'b'); if(!cache.has(key)) cache.set(key,carMaterial(src,prof,wheel,env)); o.material=cache.get(key); n++; }
        else if(src.isMeshStandardMaterial){ src.envMap=env; src.envMapIntensity=(prof.env||1); src.needsUpdate=true; } });
      return n; },
  };
  window.GFX=window.GFX||{}; window.GFX.vehicles=VM;
})();
