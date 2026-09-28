// Ryden's Racers · Graphics V2 · MaterialManager
// -----------------------------------------------------------------------------------------------
// Texture filtering policy and material/texture accounting. glbAniso() moved here verbatim from game.js.
// stats(scene) walks a scene and reports unique materials by type, unique textures and an estimate of
// their GPU memory (RGBA8 + mips) — shown in the debug overlay and recorded by the benchmark.
// Phase 2: per-tier texture caps (settings.textureMax), KTX2/Basis textures, shared material library.
function glbAniso(m){ const a=(window.GAME&&GAME.renderer)?Math.min(8,GAME.renderer.capabilities.getMaxAnisotropy()):8; ['map','normalMap','roughnessMap','metalnessMap'].forEach(k=>{ if(m[k]){ m[k].anisotropy=a; m[k].needsUpdate=true; } }); }

(function(){
  const MM={
    aniso:(m)=>glbAniso(m),
    stats(scene){ const mats=new Set(), tex=new Set(); const byType={}; let bytes=0;
      scene.traverse(o=>{ const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[]; for(const m of ms){ if(!m||mats.has(m)) continue; mats.add(m); byType[m.type]=(byType[m.type]||0)+1;
        for(const k of ['map','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap','alphaMap','envMap','lightMap','bumpMap']){ const t=m[k]; if(t&&t.isTexture) tex.add(t); }
        if(m.uniforms) for(const u of Object.values(m.uniforms)){ if(u&&u.value&&u.value.isTexture) tex.add(u.value); } } });
      for(const t of tex){ const im=t.image; const w=im&&(im.width||im.videoWidth)||0, h=im&&(im.height||im.videoHeight)||0; if(w&&h) bytes+=w*h*4*(t.generateMipmaps!==false?1.33:1); }
      return {materials:mats.size, byType, textures:tex.size, textureMB:+(bytes/1048576).toFixed(1)}; },
  };
  window.GFX=window.GFX||{}; window.GFX.materials=MM;
})();
