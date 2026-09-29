// Ryden's Racers · Graphics V2 · PerformanceMonitor + developer overlay
// -----------------------------------------------------------------------------------------------
// Samples every frame that goes through GFX.renderer.render(): frame interval (FPS / frame time),
// CPU time spent submitting the render, and the renderer's own counters (draw calls, triangles,
// geometries, textures, shader programs). Hidden by default; nothing is drawn on the public UI.
//
//   Show / hide:  ?gfxdebug=1 in the URL   ·   the ` (backquote/tilde) key   ·   GFX.perf.toggle() in the console
//   The choice is remembered on this device (localStorage 'rydens_gfxdebug').
(function(){
  const N=240;                       // rolling window (~4 s at 60 fps)
  const PM={
    dt:new Float32Array(N), cpu:new Float32Array(N), k:0, n:0, last:0, el:null, visible:false, statsT:0, lastStats:null, lastInfo:null,
    sample(scene,camera,tag,cpuMs){ if(tag==='prewarm'){ PM.last=0; return; }   // the 1-pixel prewarm frame is not a game frame
      const now=performance.now(); if(PM.last){ const d=now-PM.last; if(d<1000){ PM.dt[PM.k]=d; PM.cpu[PM.k]=cpuMs; PM.k=(PM.k+1)%N; PM.n=Math.min(N,PM.n+1); } } PM.last=now;
      const r=GFX.renderer.r; if(r){ const i=r.info; PM.lastInfo={calls:i.render.calls,tris:i.render.triangles,points:i.render.points,lines:i.render.lines,geometries:i.memory.geometries,textures:i.memory.textures,programs:(i.programs||[]).length,tag}; }
      if(PM.visible){ PM.statsT-=1; if(PM.statsT<=0){ PM.statsT=120; try{ PM.lastStats=GFX.materials.stats(scene); }catch(e){} } PM.draw(); } },
    // summary over the window: fps avg, ms avg / p95 / worst, 1% low fps, cpu submit ms
    summary(){ const n=PM.n; if(!n) return null; const a=Array.from(PM.dt.slice(0,n)).sort((x,y)=>x-y); const sum=a.reduce((s,v)=>s+v,0);
      const avg=sum/n, p95=a[Math.min(n-1,Math.floor(n*0.95))], p99=a[Math.min(n-1,Math.floor(n*0.99))], worst=a[n-1]; const c=Array.from(PM.cpu.slice(0,n)); const cpu=c.reduce((s,v)=>s+v,0)/n;
      return {frames:n, fps:+(1000/avg).toFixed(1), ms:+avg.toFixed(2), p95:+p95.toFixed(2), worst:+worst.toFixed(2), low1:+(1000/p99).toFixed(1), cpuSubmitMs:+cpu.toFixed(2)}; },
    reset(){ PM.k=0; PM.n=0; PM.last=0; },
    ensureEl(){ if(PM.el) return PM.el; const el=document.createElement('div'); el.id='gfxDebug';
      el.style.cssText='position:fixed;left:8px;bottom:8px;z-index:99;pointer-events:none;font:11px/1.35 ui-monospace,Menlo,Consolas,monospace;color:#d8f7ff;background:rgba(6,10,20,.78);border:1px solid rgba(120,220,255,.35);border-radius:6px;padding:6px 8px;white-space:pre;max-width:46vw;display:none';
      document.body.appendChild(el); PM.el=el; return el; },
    draw(){ const el=PM.ensureEl(); const s=PM.summary(); const i=PM.lastInfo||{}; const d=GFX.renderer.describe(); const st=PM.lastStats;
      const tier=GFX.settings.currentName(); const g=window.GAME; const tr=g&&g.race&&g.race.def?g.race.def.name:'—';
      const l=[]; l.push('GRAPHICS · '+tier.toUpperCase()+' · pipeline '+GFX.settings.pipeline+(GFX.bench&&GFX.bench.active?' · BENCH':''));
      if(s) l.push('FPS '+s.fps+'   frame '+s.ms+' ms   p95 '+s.p95+'   1% low '+s.low1+' fps   cpu '+s.cpuSubmitMs+' ms');
      l.push('draws '+(i.calls||0)+'   tris '+((i.tris||0)/1000).toFixed(1)+'k   geo '+(i.geometries||0)+'   tex '+(i.textures||0)+'   programs '+(i.programs||0));
      if(st) l.push('materials '+st.materials+'   unique textures '+st.textures+' (~'+st.textureMB+' MB)   lights '+st.lights+' ('+st.shadowLights+' shadow)   casters '+st.shadowCasters+'/'+st.meshes);
      const V=GFX.v2; if(V&&V.active){ const Q=GFX.renderer.settings||{}; const ps=GFX.post.stats; const on=[Q.msaa?'MSAA'+Q.msaa:null,Q.ssao?'GTAO':null,Q.bloom?'bloom':null,Q.colorGrade?'grade':null,'haze'].filter(Boolean).join(' ');
        l.push('V2 '+V.look.name+'   '+(d.path==='post'?'post['+on+'] scene draws '+ps.sceneCalls+' +'+ps.passes+' passes':'direct')+'   tm '+(V.look.toneMapping||'')+(V.lod?'   culled '+V.lod.stats.hidden+' shadowOff '+V.lod.stats.shadowOff:'')); }
      else l.push('legacy look'+(GFX.settings.pipeline==='legacy'?' (?gfx=legacy)':'')+'   colour management '+(GFX.compat.colorManaged()?'on':'off'));
      l.push(d.backend+' '+d.three+'   '+d.drawingBuffer.join('×')+' @'+d.pixelRatio+'x   css '+d.css.join('×'));
      l.push('GPU '+String(d.gpu).slice(0,60));
      l.push('scene '+(i.tag||'?')+'   track '+tr);
      el.textContent=l.join('\n'); },
    show(on,persist){ PM.visible=!!on; const el=PM.ensureEl(); el.style.display=on?'block':'none'; if(on){ PM.statsT=0; } if(persist!==false){ try{ localStorage.setItem('rydens_gfxdebug',on?'1':'0'); }catch(e){} } },
    toggle(){ PM.show(!PM.visible); },
    init(){ let on=false; try{ on=localStorage.getItem('rydens_gfxdebug')==='1'; }catch(e){}
      try{ const q=new URLSearchParams(location.search).get('gfxdebug'); if(q!=null) on=q!=='0'; }catch(e){}
      GFX.renderer.onAfterRender(PM.sample);
      addEventListener('keydown',e=>{ if(e.target&&e.target.tagName==='INPUT') return; if(e.key==='`'||e.key==='~'){ PM.toggle(); }
        // developer comparison: with the overlay open, \ reloads with the other pipeline (OLD <-> GRAPHICS V2), keeping the other URL switches
        else if(e.key==='\\'&&PM.visible){ const q=new URLSearchParams(location.search); q.set('gfx',GFX.settings.pipeline==='v2'?'legacy':'v2'); location.search=q.toString(); } });
      if(on) PM.show(true,false); },
  };
  window.GFX=window.GFX||{}; window.GFX.perf=PM;
})();
