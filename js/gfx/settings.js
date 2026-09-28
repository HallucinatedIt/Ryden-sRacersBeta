// Ryden's Racers · Graphics V2 · GraphicsSettings
// -----------------------------------------------------------------------------------------------
// One table describes every graphics tier. Today's game reads a small legacy subset of it
// (QUALITY.low/medium/high: pr, shadows, shadowSize, terrainCell, density, fogMul) and those numbers
// are kept EXACTLY as they were, so Phase 1 changes nothing on screen. Everything else in a tier is a
// forward-looking knob that Phase 2+ systems (post processing, AO, reflections, LOD, decals...) read
// through GFX.settings.current() instead of hard-coding their own quality switches.
//
// Tiers:  low · medium · high  (public, in the Settings menu)   ·   ultra (developer-only for now)
// Pipelines: 'legacy' = the current renderer path, 'v2' = the Graphics V2 path. In Phase 1 the two are
// identical; the flag exists so the benchmark can compare OLD vs V2 as V2 features land.
//   URL overrides (developer):  ?gfx=v2 | ?gfx=legacy   ·   ?tier=ultra   ·   ?gfxdebug=1
(function(){
  const TIERS={
    low:{
      // --- legacy fields (read by game.js today; do not change without a visual review) ---
      pr:0.75, shadows:false, shadowSize:512, terrainCell:9, density:0.45, fogMul:0.75,
      // --- Graphics V2 knobs (not yet consumed unless noted) ---
      renderScale:1.0,          // multiplier on top of pr (dynamic resolution hook)
      shadowDistance:70,        // half-extent of the sun's shadow box, metres (consumed by LightingManager)
      shadowCasters:'hero',     // 'hero' | 'near' | 'all'
      postFX:false, bloom:false, colorGrade:false, antialias:'msaa',
      ssao:false, reflections:'none',   // 'none' | 'probe' | 'ssr'
      envLighting:false,        // image-based lighting for world materials (PMREM sky probe)
      vegDensity:0.45, propDensity:0.6, lodBias:0.6, particles:0.5,
      textureMax:1024, anisotropy:4, localLights:0, decals:false,
    },
    medium:{
      pr:1, shadows:true, shadowSize:1024, terrainCell:6, density:0.8, fogMul:1,
      renderScale:1.0, shadowDistance:70, shadowCasters:'near',
      postFX:false, bloom:false, colorGrade:false, antialias:'msaa',
      ssao:false, reflections:'none', envLighting:false,
      vegDensity:0.8, propDensity:0.85, lodBias:0.85, particles:0.8,
      textureMax:2048, anisotropy:8, localLights:4, decals:true,
    },
    high:{
      pr:2, shadows:true, shadowSize:2048, terrainCell:5, density:1, fogMul:1.15,
      renderScale:1.0, shadowDistance:70, shadowCasters:'near',
      postFX:false, bloom:false, colorGrade:false, antialias:'msaa',
      ssao:false, reflections:'none', envLighting:false,
      vegDensity:1, propDensity:1, lodBias:1, particles:1,
      textureMax:4096, anisotropy:8, localLights:8, decals:true,
    },
    ultra:{   // developer-only in Phase 1: identical to High for the legacy fields
      pr:2, shadows:true, shadowSize:2048, terrainCell:5, density:1, fogMul:1.15,
      renderScale:1.0, shadowDistance:70, shadowCasters:'all',
      postFX:false, bloom:false, colorGrade:false, antialias:'msaa',
      ssao:false, reflections:'none', envLighting:false,
      vegDensity:1, propDensity:1, lodBias:1.3, particles:1,
      textureMax:4096, anisotropy:16, localLights:16, decals:true,
    },
  };
  const LEGACY_KEYS=['pr','shadows','shadowSize','terrainCell','density','fogMul'];
  const qs=(()=>{ try{ return new URLSearchParams(location.search); }catch(e){ return new URLSearchParams(''); } })();
  const pipeline=(qs.get('gfx')==='v2')?'v2':'legacy';
  const forcedTier=TIERS[qs.get('tier')]?qs.get('tier'):null;

  const GS={
    TIERS, pipeline, forcedTier,
    PUBLIC_TIERS:['low','medium','high'],
    // The object game.js uses as QUALITY. Each tier object is the full tier (legacy fields + V2 knobs),
    // so existing code keeps reading Q.pr / Q.shadows / Q.density... unchanged.
    legacyQuality(){ return TIERS; },
    // resolve a saved setting ('low'|'medium'|'high') to the active tier name, honouring a developer override
    resolve(saved){ return forcedTier || (TIERS[saved]?saved:'medium'); },
    current(){ const g=window.GAME; return TIERS[GS.resolve(g&&g.S&&g.S.quality)]; },
    currentName(){ const g=window.GAME; return GS.resolve(g&&g.S&&g.S.quality); },
    // A device-based suggestion for Phase 2 (NOT applied automatically: first-run mobile players keep the
    // current 'medium' default until we have real-device numbers from the benchmark).
    recommended(){
      const coarse=(typeof matchMedia==='function')&&matchMedia('(pointer:coarse)').matches;
      const mem=navigator.deviceMemory||4, cores=navigator.hardwareConcurrency||4;
      if(coarse) return (mem>=6&&cores>=8)?'medium':'low';
      return (mem>=8&&cores>=8)?'high':'medium';
    },
    legacyKeys:LEGACY_KEYS,
  };
  window.GFX=window.GFX||{}; window.GFX.settings=GS;
})();
