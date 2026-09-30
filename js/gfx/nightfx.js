// Ryden's Racers · Graphics V2 · night effects (Phase 5, Neon Foundry)
//
// Cheap, capped atmosphere for night tracks. Nothing here is a real light:
//   glowCards(): soft additive camera-facing cards over hot or bright sources (furnace mouths, pools):
//                reads as local haze / heat around the source, one draw per card, no lights
//   steam():     rising steam / smoke puffs from a few emitters (stacks, vents, furnace exhaust): ONE
//                THREE.Points for all emitters, CPU-updated, particle count capped by the preset;
//                far emitters stop spawning (distant smoke is cheap: it just thins out)
//   nightIBL():  a PMREM of a dark scene with HDR neon / sodium / furnace panels around the horizon, so
//                wet asphalt, car paint, glass and steel reflect coloured light instead of a black sky
// Gameplay code never calls this file.
(function(){
  const soft=(()=>{ let t=null; return ()=>{ if(t) return t; const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d');
    const gr=g.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.35,'rgba(255,255,255,0.45)'); gr.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=gr; g.fillRect(0,0,128,128); t=new THREE.CanvasTexture(c); return t; }; })();
  const puff=(()=>{ let t=null; return ()=>{ if(t) return t; const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d');
    let s=11; const r=()=>{ s=(s*16807)%2147483647; return s/2147483647; };
    for(let k=0;k<14;k++){ const x=18+r()*28, y=18+r()*28, rr=8+r()*14; const gr=g.createRadialGradient(x,y,0,x,y,rr); gr.addColorStop(0,'rgba(255,255,255,0.33)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64); }
    t=new THREE.CanvasTexture(c); return t; }; })();

  const NF={
    // spec: [{pos:[x,y,z], size, color, intensity}] -> group of sprites (fog on, additive, never write depth)
    glowCards(spec){ const G=new THREE.Group(); G.name='v2_glow_cards';
      spec.forEach(s=>{ const m=new THREE.SpriteMaterial({map:soft(), color:new THREE.Color(s.color).multiplyScalar(s.intensity||1), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, fog:true});
        const sp=new THREE.Sprite(m); sp.position.set(...s.pos); sp.scale.set(s.size,s.size*(s.aspect||0.6),1); sp.renderOrder=3; G.add(sp); });
      return G; },
    // emitters: [{pos:[x,y,z], rate (puffs/s), rise (m/s), spread, life (s), size, color, alpha}], opt.cap: max particles
    steam(emitters,opt){ opt=opt||{}; const cap=Math.max(0,Math.round(opt.cap||300)); if(!cap||!emitters.length) return null;
      const pos=new Float32Array(cap*3), col=new Float32Array(cap*4), siz=new Float32Array(cap); const P=[]; for(let k=0;k<cap;k++) P.push({t:1,life:1,e:null,x:0,y:-1e4,z:0,vx:0,vy:0,vz:0,s:1});
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('aCol',new THREE.BufferAttribute(col,4).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('aSize',new THREE.BufferAttribute(siz,1).setUsage(THREE.DynamicDrawUsage));
      const mat=new THREE.ShaderMaterial({transparent:true, depthWrite:false, fog:true, uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{map:{value:puff()},scale:{value:1}}]),
        vertexShader:'attribute vec4 aCol; attribute float aSize; varying vec4 vCol; uniform float scale;\n#include <fog_pars_vertex>\nvoid main(){ vCol=aCol; vec4 mvPosition=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mvPosition; gl_PointSize=aSize*scale/max(-mvPosition.z,1.);\n#include <fog_vertex>\n}',
        fragmentShader:'uniform sampler2D map; varying vec4 vCol;\n#include <fog_pars_fragment>\nvoid main(){ vec4 t=texture2D(map,gl_PointCoord); gl_FragColor=vec4(vCol.rgb,vCol.a*t.a);\n#include <fog_fragment>\n}'});
      const pts=new THREE.Points(g,mat); pts.frustumCulled=false; pts.name='v2_steam'; pts.renderOrder=4;
      const E=emitters.map(e=>Object.assign({acc:Math.random(), c:new THREE.Color(e.color||0xbfc4cc)},e)); let next=0;
      const S={points:pts, stats:{emitters:E.length, cap},
        update(dt,cam,viewH){ mat.uniforms.scale.value=(viewH||800)*0.55;
          for(const e of E){ const d=cam?Math.hypot(cam.x-e.pos[0],cam.z-e.pos[2]):0; if(d>(opt.far||520)) continue;   // far emitters stop spawning
            e.acc+=dt*e.rate*(d>(opt.near||220)?0.4:1); while(e.acc>=1){ e.acc-=1; const p=P[next]; next=(next+1)%cap; const sp=e.spread||1;
              p.e=e; p.t=0; p.life=(e.life||4)*(0.75+Math.random()*0.5); p.x=e.pos[0]+(Math.random()-0.5)*sp; p.y=e.pos[1]; p.z=e.pos[2]+(Math.random()-0.5)*sp;
              p.vx=(opt.wind?opt.wind[0]:0.6)+(Math.random()-0.5)*0.6; p.vy=(e.rise||2)*(0.8+Math.random()*0.4); p.vz=(opt.wind?opt.wind[1]:0.2)+(Math.random()-0.5)*0.6; p.s=(e.size||6)*(0.8+Math.random()*0.4); } }
          for(let k=0;k<cap;k++){ const p=P[k]; if(!p.e||p.t>=p.life){ pos[k*3+1]=-1e4; col[k*4+3]=0; continue; }
            p.t+=dt; const u=p.t/p.life; p.x+=p.vx*dt; p.y+=p.vy*dt*(1-u*0.6); p.z+=p.vz*dt; pos[k*3]=p.x; pos[k*3+1]=p.y; pos[k*3+2]=p.z;
            const c=p.e.c; col[k*4]=c.r; col[k*4+1]=c.g; col[k*4+2]=c.b; col[k*4+3]=(p.e.alpha||0.35)*Math.sin(Math.PI*Math.min(1,u*1.15)); siz[k]=p.s*(0.6+u*1.6); }
          g.attributes.position.needsUpdate=true; g.attributes.aCol.needsUpdate=true; g.attributes.aSize.needsUpdate=true; } };
      for(let k=0;k<80;k++) S.update(0.1,null,800);   // pre-simulate 8 s: the plumes are already standing when the race starts
      return S; },
    // panels: [{w,h,color,intensity,pos:[x,y,z]}] around the origin (they face the centre); background: dark colour
    nightIBL(renderer,spec){ const s=new THREE.Scene(); s.background=new THREE.Color(spec.background||0x020308);
      (spec.panels||[]).forEach(p=>{ const q=new THREE.Mesh(new THREE.PlaneGeometry(p.w,p.h),new THREE.MeshBasicMaterial({color:new THREE.Color(p.color).multiplyScalar(p.intensity||1),side:THREE.DoubleSide})); q.position.set(...p.pos); q.lookAt(0,p.pos[1]*0.3,0); s.add(q); });
      if(spec.ground){ const gq=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshBasicMaterial({color:new THREE.Color(spec.ground),side:THREE.DoubleSide})); gq.rotation.x=-Math.PI/2; gq.position.y=-6; s.add(gq); }
      const pm=new THREE.PMREMGenerator(renderer); const rt=pm.fromScene(s,0.02,0.1,200); pm.dispose(); s.traverse(o=>{ if(o.isMesh){ o.geometry.dispose(); o.material.dispose(); } }); return rt.texture; },
  };
  window.GFX=window.GFX||{}; window.GFX.nightfx=NF;
})();
