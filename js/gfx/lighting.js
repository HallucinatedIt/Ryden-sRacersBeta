// Ryden's Racers · Graphics V2 · LightingManager
// -----------------------------------------------------------------------------------------------
// World key light (sun) + sky/ground fill (hemisphere) + the sun's shadow box, extracted verbatim from
// buildWorld() / Race.update(). The shadow box follows the player so shadows stay sharp near the car.
// Theme values (sunCol, sunI, sunDir, hemiS/G/I) still come from THEMES in game.js; track systems (e.g.
// the Revolution chapter atmosphere) keep driving W.sun / hemisphere colours at runtime.
//
// Phase 2 hooks: shadowDistance per tier, cascaded/stable shadows, a PMREM sky probe for
// scene.environment (settings.envLighting), local-light budgets (settings.localLights).
(function(){
  const LM={
    // Adds hemisphere + sun to W.group; sets W.sun / W.sunDir / W.hemi. Returns {sun,hemi,sunDir}.
    createWorldLights(W,th,Q){ const G=W.group;
      const sunDir=new THREE.Vector3(...th.sunDir).normalize();
      const hemi=new THREE.HemisphereLight(th.hemiS,th.hemiG,th.hemiI); G.add(hemi);
      const sun=new THREE.DirectionalLight(th.sunCol,th.sunI); sun.position.copy(sunDir).multiplyScalar(200); G.add(sun); G.add(sun.target);
      if(Q.shadows){ sun.castShadow=true; sun.shadow.mapSize.set(Q.shadowSize,Q.shadowSize); const c=sun.shadow.camera; const e=Q.shadowDistance||70;
        c.left=-e;c.right=e;c.top=e;c.bottom=-e;c.near=10;c.far=500; sun.shadow.bias=-0.0006; sun.shadow.normalBias=0.03; }
      W.sun=sun; W.sunDir=sunDir; W.hemi=hemi;
      return {sun,hemi,sunDir}; },
    // Keep the shadow box centred on a target (the player car or the benchmark focus point)
    follow(W,x,y,z){ const sun=W.sun, d=W.sunDir; if(!sun) return;
      sun.position.set(x+d.x*200,y+d.y*200,z+d.z*200); sun.target.position.set(x,y,z); sun.target.updateMatrixWorld(); },
  };
  window.GFX=window.GFX||{}; window.GFX.lighting=LM;
})();
