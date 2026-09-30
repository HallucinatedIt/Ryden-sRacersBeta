// Ryden's Racers · Graphics V2 · showroom (Phase 5)
//
// The menu / car-select showroom was lit for the old single-material cars: a dark room, pink and cyan
// strips, a small overhead softbox. Physical slot materials (clear coat, chrome, glass) need something
// bright and neutral to reflect, otherwise paint goes dark, chrome goes black and everything picks up
// the room's pink. On the Graphics V2 pipeline this upgrades the room in place:
//   - a studio environment map: a big overhead softbox, two tall side strips and a front fill in neutral
//     white (HDR), a grey floor bounce, and only thin, dim pink / cyan accents at the back (the brand
//     colours stay in the room's neon, not on the paint);
//   - the rim spots go from saturated pink / cyan to near-neutral separation lights; the hemisphere fill
//     goes neutral;
//   - the cars get the track's slot materials (GFX.vehicles.apply) with that env;
//   - the turntable disc scales with the car (the Bus overhangs a sports-car disc otherwise).
// Legacy (?gfx=legacy, r128) never runs this. ?showroomv2=0 keeps the old showroom on V2 for comparison.
(function(){
  const qs=()=>{ try{ return location.search; }catch(e){ return ''; } };
  const SR={
    enabled(){ return !!(window.GFX&&GFX.settings&&GFX.settings.pipeline==='v2'&&GFX.compat.rev>=160&&!/[?&]showroomv2=0/.test(qs())); },
    studioEnv(renderer){ const s=new THREE.Scene(); s.background=new THREE.Color(0x07070a);
      const add=(w,h,c,k,x,y,z,look)=>{ const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(k),side:THREE.DoubleSide})); p.position.set(x,y,z); p.lookAt(look||new THREE.Vector3(0,0.6,0)); s.add(p); };
      add(16,7,0xfffaf4,2.4,0,11,0.5,new THREE.Vector3(0,0,0.5));   // overhead softbox: the long highlight along roof and bonnet
      add(3,12,0xf4f6ff,1.5,-10,4,-1); add(3,12,0xf4f6ff,1.5,10,4,-1);   // tall side strips: the lines down the flanks
      add(12,4,0xfff4ea,1.1,0,3,11);                                // front fill (camera side)
      add(22,2.2,0x6a6a78,0.6,0,1.1,-11);                           // back wall glow
      add(9,0.6,0xff3aa0,0.9,-6,2.2,-10.5); add(9,0.6,0x3ae8ff,0.9,6,2.2,-10.5);   // brand accents: thin and dim
      const fl=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshBasicMaterial({color:new THREE.Color(0x3a3a42).multiplyScalar(0.5),side:THREE.DoubleSide})); fl.rotation.x=-Math.PI/2; fl.position.y=-0.2; s.add(fl);
      const pm=new THREE.PMREMGenerator(renderer); const t=pm.fromScene(s,0.02).texture; pm.dispose(); s.traverse(o=>{ if(o.isMesh){ o.geometry.dispose(); o.material.dispose(); } }); return t; },
    // called once from the Garage constructor (game.js), after the room and lights exist
    upgrade(G){ if(!SR.enabled()||G.v2) return false; G.v2=true; const r=G.g.renderer; const old=G.env; const env=SR.studioEnv(r); G.env=env;
      G.scene.traverse(o=>{ const m=o.material; if(m&&m.envMap===old){ m.envMap=env; m.needsUpdate=true; }
        if(o.isSpotLight&&o!==G.key){ const c=o.color; const sat=Math.max(c.r,c.g,c.b)-Math.min(c.r,c.g,c.b); if(sat>0.3){ o.color.lerp(new THREE.Color(0xf2f0ff),0.75); o.intensity*=0.85; } }
        if(o.isHemisphereLight){ o.color.set(0x8a8ca0); o.groundColor.set(0x121016); }
        if(o.isDirectionalLight&&o.position.y>0){ o.color.lerp(new THREE.Color(0xffffff),0.6); } });
      if(G.key){ G.key.penumbra=Math.max(G.key.penumbra||0,0.9); if(G.key.shadow){ G.key.shadow.radius=4; G.key.shadow.bias=-0.0003; } }
      return true; },
    // per car model (showcase and turntable), before it is cloned for the floor mirror
    car(G,v,m){ if(!G.v2) return 0; return GFX.vehicles.apply({v,model:m},G.env); },
    // turntable disc sized to the car: never smaller than the original (3.6 m), grows for long cars
    platform(G,m){ if(!G.v2||!G.platform) return; const d=(m&&m.dims)||{L:4.5,W:1.9}; const k=Math.max(1,0.5*Math.hypot(d.L,d.W)/3.3);
      [G.platform,G.platMirror].forEach(p=>{ if(p) p.scale.set(k,1,k); }); },
  };
  window.GFX=window.GFX||{}; window.GFX.showroom=SR;
})();
