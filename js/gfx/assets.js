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
    loaded(id){ return (typeof CAR_GLTF!=='undefined'&&CAR_GLTF[id])||null; },
    loadedReport(){ if(typeof CAR_GLTF==='undefined') return []; const out=[];
      for(const id in CAR_GLTF){ let tris=0; CAR_GLTF[id].traverse(o=>{ if(o.isMesh){ const g=o.geometry; tris+=(g.index?g.index.count:g.attributes.position.count)/3; } }); out.push({id,tris:Math.round(tris)}); }
      return out.sort((a,b)=>b.tris-a.tris); },
  };
  window.GFX=window.GFX||{}; window.GFX.assets=AM;
})();
