// Ryden's Racers · Graphics V2 · three.js compatibility layer
// -----------------------------------------------------------------------------------------------
// The game runs on three.js r186 (WebGL2) and falls back to r128 on devices without WebGL2 (or with
// ?three=r128, the exact OLD renderer for comparisons). Everything that differs between the two
// releases goes through here, so game.js and the gfx modules stay version-agnostic:
//
//   colour spaces      texture.encoding / renderer.outputEncoding (r128)  ->  .colorSpace / .outputColorSpace (r152+)
//   light units        r155+ removed the implicit x PI on punctual/hemisphere lights, and point/spot
//                      lights attenuate physically (inverse square). li()/spotI() convert the values the
//                      game was tuned with, so the legacy look is preserved.
//   colour management  r152+ converts hex colours sRGB -> linear. The game's palettes were tuned without
//                      that, so it is OFF by default (parity) and turned on only by Graphics V2 tracks.
//   shader chunks      the map UV varying is vMapUv since r151 (was vUv).
(function(){
  const rev=parseInt(THREE.REVISION,10)||0;
  const modern=rev>=152, physical=rev>=155;
  const C={
    rev, modern, physicalLights:physical,
    uvMap: rev>=151?'vMapUv':'vUv',
    srgb(t){ if(!t) return t; if(modern) t.colorSpace=THREE.SRGBColorSpace; else t.encoding=THREE.sRGBEncoding; return t; },
    isSRGB(t){ return !!t && (modern ? t.colorSpace===THREE.SRGBColorSpace : t.encoding===THREE.sRGBEncoding); },
    setOutputSRGB(r){ if(modern) r.outputColorSpace=THREE.SRGBColorSpace; else r.outputEncoding=THREE.sRGBEncoding; },
    outputName(r){ return modern ? String(r.outputColorSpace) : (r.outputEncoding===THREE.sRGBEncoding?'srgb':'linear'); },
    // legacy intensity (directional / hemisphere / ambient) -> this build's units
    li(i){ return physical ? i*Math.PI : i; },
    // legacy spot/point light intensity -> this build, matched at a typical distance d (metres)
    spotI(i,cutoff,decay,d){ if(!physical) return i;
      const leg=(cutoff>0&&decay>0)?Math.pow(Math.max(0,1-d/cutoff),decay):1;
      let phys=1/Math.max(Math.pow(d,decay),0.01); if(cutoff>0) phys*=Math.pow(Math.max(0,1-Math.pow(d/cutoff,4)),2);
      return i*Math.PI*leg/phys; },
    // r151+ draws double-sided transparent materials in two passes (back faces, then front). The game's
    // transparent double-sided pieces (foam, glows, beams) are thin cards authored for one pass: keep one
    // pass (same draw calls and look as r128).
    singlePassTransparency(scene){ if(!modern||!scene) return; scene.traverse(o=>{ const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
      for(const m of ms) if(m&&m.transparent&&m.side===THREE.DoubleSide) m.forceSinglePass=true; }); },
    // r128 sampled every secondary map (normal, roughness, metalness, emissive, alpha...) with the UV transform
    // of `map` when there was one; r151+ gives each map its own transform. The game set a few secondary maps
    // with their own repeat (e.g. the Neon Foundry wet-road puddle roughness), tuned under the old rule: keep it.
    legacyUVTransforms(scene){ if(!(C.rev>=151)||!scene) return 0; let n=0; const keys=['normalMap','bumpMap','roughnessMap','metalnessMap','alphaMap','emissiveMap','specularMap','displacementMap'];
      const same=(a,b)=>a.offset.equals(b.offset)&&a.repeat.equals(b.repeat)&&a.rotation===b.rotation&&a.center.equals(b.center);
      scene.traverse(o=>{ const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
        for(const m of ms){ if(!m||!m.map||m.userData.rrLegacyUV) continue; m.userData.rrLegacyUV=1;
          for(const k of keys){ const t=m[k]; if(!t||same(t,m.map)) continue; const c=t.clone(); c.offset.copy(m.map.offset); c.repeat.copy(m.map.repeat); c.rotation=m.map.rotation; c.center.copy(m.map.center); c.needsUpdate=true; m[k]=c; n++; } } });
      return n; },
    // r128's PMREM made the rough mips of dark environments with small bright emitters (the Neon Foundry wet-road env,
    // the showroom softbox env) far brighter than r186 does (measured: ~10x more light on a rough road), and those
    // two looks were tuned on it. Such env maps are tagged with the factor that restores the legacy look
    // (tagLegacyEnv); applyLegacyEnv() scales envMapIntensity of every material using them, once. Theme sky envs
    // (smooth gradients) match without it. Legacy looks only; never on r128.
    tagLegacyEnv(tex,f){ if(tex&&C.rev>=152){ let q=''; try{ q=location.search; }catch(e){} const m=/[?&]envboost=([0-9.]+)/.exec(q); tex.userData.rrLegacyBoost=m?+m[1]:f; } return tex; },
    applyLegacyEnv(scene){ if(!(C.rev>=152)||!scene) return 0; let n=0; scene.traverse(o=>{ const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
      for(const m of ms){ const e=m&&m.envMap; if(!e||!e.userData||!e.userData.rrLegacyBoost||m.userData.rrEnvBoost===e) continue; const F=e.userData.rrLegacyBoost, r=m.roughness!=null?m.roughness:1, f=1+(F-1)*Math.max(0,Math.min(1,(r-0.15)/0.45));   // rough mips only: glossy chrome already matches
        m.envMapIntensity=(m.envMapIntensity!=null?m.envMapIntensity:1)*f; m.userData.rrEnvBoost=e; n++; } }); return n; },
    colorManagement(on){ if(modern&&THREE.ColorManagement) THREE.ColorManagement.enabled=!!on; },
    colorManaged(){ return !!(modern&&THREE.ColorManagement&&THREE.ColorManagement.enabled); },
  };
  C.colorManagement(false);   // parity: the legacy colour workflow until a Graphics V2 track opts in
  window.GFX=window.GFX||{}; window.GFX.compat=C;
})();
