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
      const hemi=new THREE.HemisphereLight(th.hemiS,th.hemiG,GFX.compat.li(th.hemiI)); G.add(hemi);
      const sun=new THREE.DirectionalLight(th.sunCol,GFX.compat.li(th.sunI)); sun.position.copy(sunDir).multiplyScalar(200); G.add(sun); G.add(sun.target);
      if(Q.shadows){ sun.castShadow=true; sun.shadow.mapSize.set(Q.shadowSize,Q.shadowSize); const c=sun.shadow.camera; const e=Q.shadowDistance||70;
        c.left=-e;c.right=e;c.top=e;c.bottom=-e;c.near=10;c.far=500; sun.shadow.bias=-0.0006; sun.shadow.normalBias=0.03; if(GFX.compat.modern) sun.shadow.radius=1.5; }
      W.sun=sun; W.sunDir=sunDir; W.hemi=hemi;
      return {sun,hemi,sunDir}; },
    // Keep the shadow box centred on a target (the player car or the benchmark focus point)
    follow(W,x,y,z){ const sun=W.sun, d=W.sunDir; if(!sun) return;
      if(W.v2Shadow){ // Graphics V2: snap the shadow box to whole shadow-map texels in light space, so shadow edges don't crawl as the car moves
        const S=W.v2Shadow; const tex=2*S.extent/S.size; LM._r=LM._r||new THREE.Vector3(); LM._u=LM._u||new THREE.Vector3();
        const up=Math.abs(d.y)>0.99?LM._u.set(1,0,0):LM._u.set(0,1,0); const rt=LM._r.crossVectors(up,d).normalize(); const uu=LM._u.crossVectors(d,rt).normalize();
        const a=x*rt.x+y*rt.y+z*rt.z, b=x*uu.x+y*uu.y+z*uu.z, c=x*d.x+y*d.y+z*d.z; const sa=Math.round(a/tex)*tex, sb=Math.round(b/tex)*tex;
        x=rt.x*sa+uu.x*sb+d.x*c; y=rt.y*sa+uu.y*sb+d.y*c; z=rt.z*sa+uu.z*sb+d.z*c; }
      sun.position.set(x+d.x*200,y+d.y*200,z+d.z*200); sun.target.position.set(x,y,z); sun.target.updateMatrixWorld(); },
  };
  window.GFX=window.GFX||{}; window.GFX.lighting=LM;
})();
