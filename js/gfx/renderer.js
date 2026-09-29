// Ryden's Racers · Graphics V2 · RendererManager
// -----------------------------------------------------------------------------------------------
// Owns the WebGLRenderer. Everything that draws a frame goes through GFX.renderer.render(), which is
// the single place where post processing, render-scale / dynamic resolution and frame metrics hook in.
// The renderer is configured exactly as the game always configured it (r128: sRGB output encoding,
// ACES Filmic tone mapping, PCF soft shadows, MSAA via antialias:true), so Phase 1 is visually neutral.
//
// Future (Phase 2+):  post = GFX.post.pass(...)  replaces the direct renderer.render() call below;
// a modern three.js build swaps outputEncoding -> outputColorSpace here and nowhere else.
(function(){
  const RM={
    r:null, canvas:null, kind:'WebGL', settings:null, frameCount:0, lastTag:'',
    hooks:{before:[],after:[]},
    create(canvas){
      const r=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
      GFX.compat.setOutputSRGB(r);                       // sRGB output (outputColorSpace on r152+, outputEncoding on r128)
      r.toneMapping=THREE.ACESFilmicToneMapping;
      r.shadowMap.type=GFX.compat.modern?THREE.PCFShadowMap:THREE.PCFSoftShadowMap;   // r180+ removed PCFSoft; PCF + shadow.radius is its replacement
      // count the shadow-map pass separately (draw calls / triangles it adds to the frame)
      const sm=r.shadowMap, smr=sm.render.bind(sm); RM.shadow={calls:0,tris:0}; sm.render=function(l,s,c){ const a=r.info.render.calls, t=r.info.render.triangles; smr(l,s,c); if(l&&l.length){ RM.shadow.calls=r.info.render.calls-a; RM.shadow.tris=r.info.render.triangles-t; } };   // full-screen passes call this with no lights
      RM.r=r; RM.canvas=canvas; RM.kind=r.capabilities.isWebGL2?'WebGL2':'WebGL1';
      return r;
    },
    // Apply a tier (the object QUALITY[...] / GFX.settings.current() returns)
    applySettings(Q){ const r=RM.r; if(!r) return; RM.settings=Q;
      r.setPixelRatio(Math.min(devicePixelRatio||1,Q.pr)*(Q.renderScale||1)*(RM.dynScale||1));
      r.shadowMap.enabled=!!Q.shadows; },
    resize(camera){ const r=RM.r; if(!r) return; const w=innerWidth,h=innerHeight; r.setSize(w,h,false); if(camera){ camera.aspect=w/h; camera.updateProjectionMatrix(); } },
    // The one frame entry point. tag = 'race' | 'garage' | 'bench' (shown in the debug overlay)
    render(scene,camera,exposure,tag){ const r=RM.r;
      for(const f of RM.hooks.before) f(scene,camera,tag);
      r.info.autoReset=false; r.info.reset();              // count every pass of the frame (shadows, scene, post)
      const Q=RM.settings, v2=(tag!=='garage') && window.GFX && GFX.v2 && GFX.v2.active;
      const t0=performance.now();
      if(v2 && GFX.post.wants(Q)){ RM.path='post'; GFX.post.render(r,scene,camera,exposure,Q); }
      else { RM.path='direct'; if(exposure!=null) r.toneMappingExposure=exposure*(v2&&GFX.v2.look?(GFX.v2.look.exposure||1):1);
        const tm=r.toneMapping; if(!v2) r.toneMapping=THREE.ACESFilmicToneMapping; else r.toneMapping=GFX.v2.toneMappingConst();
        r.setRenderTarget(null); r.render(scene,camera); r.toneMapping=tm; }
      const cpu=performance.now()-t0;
      if(tag==='race') RM._drs(Q);
      else if(tag==='garage'&&RM.frameCount%30===0) GFX.compat.applyLegacyEnv(scene);   // showroom env (cars arrive after the room)
      RM.frameCount++; RM.lastTag=tag||'';
      for(const f of RM.hooks.after) f(scene,camera,tag,cpu);
    },
    // Dynamic resolution (optional, conservative). Only on tiers with dynamicRes, only on touch devices
    // (or ?drs=1), only during a race. It looks at the frame interval over 3 s windows: below ~48 fps it
    // steps the resolution down by 10 % (min 70 %); after 9 s at a solid 60 it steps back up. At most one
    // change per 3 s, so there is no visible pumping. ?drs=0 turns it off.
    dynScale:1, _drsT:0, _drsN:0, _drsSum:0, _drsGood:0, _drsLast:0,
    _drsAllowed(Q){ if(!Q||!Q.dynamicRes) return false; let q=''; try{ q=location.search; }catch(e){} if(/[?&]drs=0/.test(q)) return false; if(/[?&]drs=1/.test(q)) return true;
      return (typeof matchMedia==='function')&&matchMedia('(pointer:coarse)').matches; },
    _drs(Q){ const now=performance.now(); const dt=RM._drsLast?now-RM._drsLast:0; RM._drsLast=now; if(!dt||dt>250) return;
      if(!RM._drsAllowed(Q)){ if(RM.dynScale!==1){ RM.dynScale=1; RM.applySettings(Q); } return; }
      RM._drsSum+=dt; RM._drsN++; if(now-RM._drsT<3000) return; const avg=RM._drsSum/RM._drsN; RM._drsSum=0; RM._drsN=0; RM._drsT=now;
      let s=RM.dynScale; if(avg>20.8&&s>0.7){ s=Math.max(0.7,+(s-0.1).toFixed(2)); RM._drsGood=0; } else if(avg<17.4){ RM._drsGood++; if(RM._drsGood>=3&&s<1){ s=Math.min(1,+(s+0.1).toFixed(2)); RM._drsGood=0; } } else RM._drsGood=0;
      if(s!==RM.dynScale){ RM.dynScale=s; RM.applySettings(Q); if(window.GAME&&GAME.resize) GAME.resize(); } },
    onBeforeRender(f){ RM.hooks.before.push(f); }, onAfterRender(f){ RM.hooks.after.push(f); },
    maxAnisotropy(){ return RM.r?RM.r.capabilities.getMaxAnisotropy():8; },
    // capability report for the debug overlay / benchmark results
    describe(){ const r=RM.r; if(!r) return {}; const gl=r.getContext(); let gpu='unknown', vendor='';
      try{ const ext=gl.getExtension('WEBGL_debug_renderer_info'); if(ext){ gpu=gl.getParameter(ext.UNMASKED_RENDERER_WEBGL); vendor=gl.getParameter(ext.UNMASKED_VENDOR_WEBGL); } }catch(e){}
      const sz=new THREE.Vector2(); r.getDrawingBufferSize(sz);
      return {backend:RM.kind, three:'r'+THREE.REVISION, gpu, vendor, drawingBuffer:[sz.x,sz.y], css:[innerWidth,innerHeight], pixelRatio:+r.getPixelRatio().toFixed(3),
        maxTexture:r.capabilities.maxTextureSize, maxAniso:r.capabilities.getMaxAnisotropy(), precision:r.capabilities.precision, shadows:r.shadowMap.enabled,
        toneMapping:RM.path==='post'?'post:'+((GFX.v2&&GFX.v2.look&&GFX.v2.look.toneMapping)||'neutral'):(GFX.v2&&GFX.v2.active?String(GFX.v2.look&&GFX.v2.look.toneMapping):'ACESFilmic'), path:RM.path||'direct', dynScale:RM.dynScale||1, output:GFX.compat.outputName(r), colorManagement:GFX.compat.colorManaged()}; },
  };
  window.GFX=window.GFX||{}; window.GFX.renderer=RM;
})();
