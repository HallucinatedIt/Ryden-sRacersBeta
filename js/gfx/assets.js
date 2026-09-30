// Ryden's Racers · Graphics V2 · AssetManager
// -----------------------------------------------------------------------------------------------
// A read-only view over the asset inventory (models/catalog.json) and the already-loaded GLBs.
// Loading itself is unchanged in Phase 1: game.js still loads cars at boot and a track's props/env on
// demand (loadCarGLBs + GLB_DATA). This module answers "what do we have, what is it for, how heavy is
// it" so Phase 2 placement can be data-driven (per-track dressing lists) instead of hard-coded.
//
//   await GFX.assets.catalog()              -> {assets:[...]}   (fetched once, lazily; never at boot)
//   GFX.assets.forTrack('coast')            -> assets tagged for Pacifica (in_game + inbox)
//   GFX.assets.byCategory('vegetation')
//   GFX.assets.loaded(id)                   -> the loaded glTF scene (CAR_GLTF) or null
//   GFX.assets.loadedReport()               -> ids currently in memory with triangle counts
(function(){
  let CAT=null, pending=null;
  const AM={
    catalog(){ if(CAT) return Promise.resolve(CAT); if(pending) return pending;
      pending=fetch('models/catalog.json',{cache:'no-cache'}).then(r=>r.json()).then(j=>{ CAT=j; return j; }).catch(e=>{ pending=null; throw e; }); return pending; },
    all(){ return CAT?CAT.assets:[]; },
    forTrack(t){ return AM.all().filter(a=>(a.tracks||[]).includes(t)); },
    byCategory(c){ return AM.all().filter(a=>a.category===c); },
    // --- optimized browser variants (Graphics V2): KTX2/Basis textures + Meshopt geometry ---
    // Built by tools/optimize_env.sh; the originals stay untouched and are what ?gfx=legacy / r128 load.
    VARIANTS:{ env_coast:{ v2:'models/env/env_coast.v2.glb?v=1', track:'coast', needs:['ktx2','meshopt'] },
               env_mesa:{ v2:'models/env/env_mesa.v2.glb?v=1', track:'mesa', needs:['ktx2','meshopt'] },
               env_alondra:{ v2:'models/env/env_alondra.v2.glb?v=1', track:'alondra', needs:['ktx2','meshopt'] },
               env_revolution:{ v2:'models/env/env_revolution.v2.glb?v=1', track:'revolution', needs:['ktx2','meshopt'] },
               env_neon:{ v2:'models/env/env_neon.v2.glb?v=1', track:'neon', needs:['ktx2','meshopt'] },
               // Phase 3 cars with exported material slots (tools/blender/rr_car_slots.py); folded to one mesh per part on load
               gt44:{ v2:'models/cars/gt40.v2.glb?v=1', car:true }, missile:{ v2:'models/cars/missile_commander.v2.glb?v=1', car:true },
               trout:{ v2:'models/cars/trout_protocol.v2.glb?v=1', car:true }, duck:{ v2:'models/cars/duck_plasma.v2.glb?v=1', car:true },
               bpd:{ v2:'models/cars/bpd_69.v2.glb?v=1', car:true }, donut:{ v2:'models/cars/donut_patrol.v2.glb?v=1', car:true },
               // Phase 4: the remaining eight GLB cars
               hellcat:{ v2:'models/cars/hellcat.v2.glb?v=1', car:true }, leopard:{ v2:'models/cars/night_leopard.v2.glb?v=1', car:true },
               concord:{ v2:'models/cars/concordance.v2.glb?v=1', car:true }, lightning:{ v2:'models/cars/white_lightning.v2.glb?v=1', car:true },
               genlee:{ v2:'models/cars/general_lee.v2.glb?v=1', car:true }, brcc:{ v2:'models/cars/rotor.v2.glb?v=1', car:true },
               fdc:{ v2:'models/cars/rrpickup.v2.glb?v=1', car:true }, voyager:{ v2:'models/cars/midnight_voyager.v2.glb?v=1', car:true } },
    useVariant(id){ const v=AM.VARIANTS[id]; if(!v) return false; let q=''; try{ q=location.search; }catch(e){}
      return GFX.settings.pipeline==='v2' && GFX.compat.rev>=160 && !/[?&]origassets/.test(q) && (v.car ? !!(GFX.v2&&GFX.v2.carsOn()) : !!(GFX.v2&&GFX.v2.LOOKS[v.track]&&GFX.v2.lookOn(v.track))); },
    // after a GLB is parsed (game.js): slotted car variants are folded to the original structure
    postLoad(id,scene){ const v=AM.VARIANTS[id]; if(v&&v.car&&AM.useVariant(id)&&GFX.vehicles&&GFX.vehicles.foldSlots) GFX.vehicles.foldSlots(scene); return scene; },
    src(id,url){ return AM.useVariant(id)?AM.VARIANTS[id].v2:url; },
    // give a GLTFLoader the KTX2 (Basis) and Meshopt decoders when this build has them
    configureLoader(L){ if(GFX.compat.rev<160) return L;
      if(THREE.MeshoptDecoder&&L.setMeshoptDecoder) L.setMeshoptDecoder(THREE.MeshoptDecoder);
      const r=window.GAME&&GAME.renderer; if(r&&THREE.KTX2Loader&&L.setKTX2Loader){ if(!AM._ktx2){ AM._ktx2=new THREE.KTX2Loader().setTranscoderPath('js/vendor/basis/').detectSupport(r); } L.setKTX2Loader(AM._ktx2); }
      return L; },
    loaded(id){ return (typeof CAR_GLTF!=='undefined'&&CAR_GLTF[id])||null; },
    loadedReport(){ if(typeof CAR_GLTF==='undefined') return []; const out=[];
      for(const id in CAR_GLTF){ let tris=0; CAR_GLTF[id].traverse(o=>{ if(o.isMesh){ const g=o.geometry; tris+=(g.index?g.index.count:g.attributes.position.count)/3; } }); out.push({id,tris:Math.round(tris)}); }
      return out.sort((a,b)=>b.tris-a.tris); },
  };
  window.GFX=window.GFX||{}; window.GFX.assets=AM;
})();
