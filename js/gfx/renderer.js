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
      r.outputEncoding=THREE.sRGBEncoding;               // r128 colour management (see docs/graphics-v2/05-threejs-migration-plan.md)
      r.toneMapping=THREE.ACESFilmicToneMapping;
      r.shadowMap.type=THREE.PCFSoftShadowMap;
      RM.r=r; RM.canvas=canvas; RM.kind=r.capabilities.isWebGL2?'WebGL2':'WebGL1';
      return r;
    },
    // Apply a tier (the object QUALITY[...] / GFX.settings.current() returns)
    applySettings(Q){ const r=RM.r; if(!r) return; RM.settings=Q;
      r.setPixelRatio(Math.min(devicePixelRatio||1,Q.pr)*(Q.renderScale||1));
      r.shadowMap.enabled=!!Q.shadows; },
    resize(camera){ const r=RM.r; if(!r) return; const w=innerWidth,h=innerHeight; r.setSize(w,h,false); if(camera){ camera.aspect=w/h; camera.updateProjectionMatrix(); } },
    // The one frame entry point. tag = 'race' | 'garage' | 'bench' (shown in the debug overlay)
    render(scene,camera,exposure,tag){ const r=RM.r;
      for(const f of RM.hooks.before) f(scene,camera,tag);
      if(exposure!=null) r.toneMappingExposure=exposure;
      const t0=performance.now();
      r.render(scene,camera);
      const cpu=performance.now()-t0;
      RM.frameCount++; RM.lastTag=tag||'';
      for(const f of RM.hooks.after) f(scene,camera,tag,cpu);
    },
    onBeforeRender(f){ RM.hooks.before.push(f); }, onAfterRender(f){ RM.hooks.after.push(f); },
    maxAnisotropy(){ return RM.r?RM.r.capabilities.getMaxAnisotropy():8; },
    // capability report for the debug overlay / benchmark results
    describe(){ const r=RM.r; if(!r) return {}; const gl=r.getContext(); let gpu='unknown', vendor='';
      try{ const ext=gl.getExtension('WEBGL_debug_renderer_info'); if(ext){ gpu=gl.getParameter(ext.UNMASKED_RENDERER_WEBGL); vendor=gl.getParameter(ext.UNMASKED_VENDOR_WEBGL); } }catch(e){}
      const sz=new THREE.Vector2(); r.getDrawingBufferSize(sz);
      return {backend:RM.kind, three:'r'+THREE.REVISION, gpu, vendor, drawingBuffer:[sz.x,sz.y], css:[innerWidth,innerHeight], pixelRatio:+r.getPixelRatio().toFixed(3),
        maxTexture:r.capabilities.maxTextureSize, maxAniso:r.capabilities.getMaxAnisotropy(), precision:r.capabilities.precision, shadows:r.shadowMap.enabled,
        toneMapping:'ACESFilmic', outputEncoding:r.outputEncoding===THREE.sRGBEncoding?'sRGB':'linear'}; },
  };
  window.GFX=window.GFX||{}; window.GFX.renderer=RM;
})();
