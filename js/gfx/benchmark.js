// Ryden's Racers · Graphics V2 · Benchmark scene
// -----------------------------------------------------------------------------------------------
// Fixed, repeatable scenes for judging graphics changes:  Pacifica Cliffs + the GT40, Mojave Mesa Run + the GT40.
//   Open  index.html?bench=pacifica  ·  ?bench=mojave  ·  ?bench=alondra   (add &tier=low|medium|high|ultra, &gfx=legacy|v2, &gfxdebug=1)
// The GT40 is posed at five hand-picked shots on the cliff/lighthouse stretch and the beach-festival
// finish, plus one moving "lighthouse run". No physics or AI runs (practice mode, player car only), so
// every run renders the same frames. For each shot: warm-up, then N measured frames (FPS, frame time
// p95 / 1% low, CPU submit time, draw calls, triangles, textures) and a screenshot.
// Results are shown in a panel, downloadable as JSON/PNG, and kept per pipeline on this device so the
// panel can show OLD (legacy) vs GRAPHICS V2 side by side.
//
// Shots are plain data (BENCH_SCENES): add a scene for another track the same way.
(function(){
  const BENCH_SCENES={
    pacifica:{ track:'coast', car:'gt44', title:'Pacifica + GT40', warm:30, frames:180,
      // i = track sample (2 m each), lat = car lateral offset (m, + = right of travel).
      // cam: back/up/side are metres relative to the car (side + = right), ahead = look-at point ahead of the car.
      shots:[
        {id:'cliff_lighthouse', name:'Cliff road → lighthouse', i:330, lat:-2.5, cam:{back:7.2,up:2.9,side:0,ahead:5,fov:66},
          why:'cliff face, ocean, guardrail, curbs, lighthouse and headland at distance'},
        {id:'lighthouse_wide', name:'Lighthouse bend, elevated', i:352, lat:-3, cam:{back:15,up:9,side:9,ahead:26,fov:58},
          why:'long-distance scenery, water, road paint, vegetation on the point'},
        {id:'tunnel_mouth', name:'Tunnel approach', i:214, lat:2, cam:{back:7.2,up:2.9,side:0,ahead:5,fov:66},
          why:'cliff/rock material, tunnel portal, shadow transition'},
        {id:'ocean_low', name:'Ocean side, low', i:150, lat:3.5, cam:{back:-2.5,up:1.2,side:-6.5,ahead:-1,fov:52},
          why:'car paint + reflections against sea and sky, guardrail close-up'},
        {id:'festival_finish', name:'Beach festival finish', i:870, lat:-2, cam:{back:8,up:3.2,side:0,ahead:24,fov:66},
          why:'architecture, gantry, crowd, palms, billboards, low sun (most draw calls)'},
      ],
      drive:{id:'lighthouse_run', name:'Lighthouse run (moving)', i0:280, i1:400, lat:-2.5, speed:36},
    },
    mojave:{ track:'mesa', car:'gt44', title:'Mojave Mesa Run + GT40', warm:30, frames:180,
      shots:[
        {id:'open_desert', name:'Open desert straight', i:60, lat:-2.5, cam:{back:7.2,up:2.9,side:0,ahead:5,fov:66},
          why:'sun-bleached asphalt, faded yellow lines, sand shoulders, mesas and dust haze at distance'},
        {id:'rock_arch', name:'Rock arch approach', i:112, lat:2, cam:{back:7.2,up:2.9,side:0,ahead:5,fov:66},
          why:'rock/strata material close up, arch shadow, detail on the road edge'},
        {id:'mesa_vista', name:'Mesa-top vista, elevated', i:470, lat:-2, cam:{back:16,up:10,side:-10,ahead:30,fov:58},
          why:'large vista: terrain, mesas, the valley floor, haze and sky gradient'},
        {id:'mine_camp', name:'Mine camp', i:612, lat:-2, cam:{back:8,up:3.2,side:0,ahead:22,fov:66},
          why:'detailed area: mine head frame, sheds, equipment, abandoned vehicles'},
        {id:'gas_diner', name:'Gas & diner stop', i:912, lat:2.5, cam:{back:11,up:4.2,side:-7,ahead:10,fov:66},
          why:'dense roadside: the service station, diner, parked cars, signs (most draw calls)'},
      ],
      drive:{id:'arch_run', name:'Arch run (moving)', i0:20, i1:160, lat:-2.5, speed:36},
    },
    alondra:{ track:'alondra', car:'gt44', title:'Alondra Blvd + GT40', warm:30, frames:180,
      shots:[
        {id:'commercial_strip', name:'Commercial strip', i:60, lat:-3, cam:{back:7.2,up:2.9,side:0,ahead:5,fov:66},
          why:'storefronts, glass, signs, sidewalks, parked cars, wall art, the boulevard asphalt'},
        {id:'dense_intersection', name:'Dense intersection', i:106, lat:-2.5, cam:{back:9,up:3.6,side:-3,ahead:14,fov:66},
          why:'cross street, crossing, traffic stop, poles and wires, the most buildings in view'},
        {id:'residential_sweep', name:'Residential sweep', i:200, lat:-2, cam:{back:8,up:3.4,side:0,ahead:18,fov:66},
          why:'houses, yards, fences, driveways, trees, utility line'},
        {id:'police_lot', name:'Police lot', i:314, lat:3, cam:{back:11,up:5,side:-8,ahead:10,fov:62},
          why:'BPD / Donut Patrol presence: parked cruisers, stencils'},
        {id:'hot_block', name:'The Hot Block', i:490, lat:-2, cam:{back:8,up:3.2,side:0,ahead:20,fov:66},
          why:'heaviest detail: murals, lit signs, tags, dense storefronts (stress scene candidate)'},
      ],
      drive:{id:'boulevard_run', name:'Boulevard run (moving)', i0:20, i1:150, lat:-3, speed:36},
    },
    // Neon Foundry Nights: the night track. Wet road under the LED arches, the foundry weave, the furnace,
    // the canal jump, the tech yard, the start arena; stress scene = the LED arch straight (most emissive + reflections)
    neon:{ track:'neon', car:'gt44', title:'Neon Foundry Nights + GT40', warm:30, frames:180,
      shots:[
        {id:'start_arena', name:'Start arena', i:8, lat:-2, cam:{back:8,up:3.4,side:0,ahead:18,fov:66}, why:'grandstands, gantry, event LEDs, wet grid'},
        {id:'led_arches', name:'LED arch straight', i:250, lat:-2, cam:{back:7.5,up:2.8,side:0,ahead:20,fov:66}, why:'heaviest emissive + wet-road reflections (stress scene candidate)'},
        {id:'foundry_weave', name:'Foundry weave', i:420, lat:-2, cam:{back:7.5,up:3,side:0,ahead:16,fov:66}, why:'dense industrial: dark steel, containers, pipes'},
        {id:'furnace', name:'Furnace', i:455, lat:2, cam:{back:9,up:3.6,side:-4,ahead:12,fov:66}, why:'furnace glow, heat, smoke'},
        {id:'canal_jump', name:'Canal jump', i:515, lat:-1, cam:{back:9,up:4,side:0,ahead:22,fov:66}, why:'harbour/canal, water, jump signs'},
        {id:'tech_yard', name:'Tech yard', i:650, lat:-2, cam:{back:7.5,up:3,side:0,ahead:16,fov:66}, why:'service buildings, signage, chicane'},
      ],
      drive:{id:'arch_run', name:'LED arch run (moving)', i0:190, i1:330, lat:-2, speed:40},
    },
    // Revolution: one shot per chapter (placed relative to the chapter starts), Yorktown twice (the payoff and
    // the stress scene: siege lines, troops, artillery, harbour, smoke), and a moving run through a chapter blend
    revolution:{ track:'revolution', car:'gt44', title:"Y'all Fuck With Racin? (Revolution) + GT40", warm:30, frames:180,
      shots:[
        {id:'swamp', name:'The Swamp Fox', ch:'start', off:25, lat:-2, cam:{back:7.5,up:3,side:0,ahead:16,fov:66}, why:'humid mist, swamp water, cypress, mud road'},
        {id:'lexington', name:'Lexington & Concord', ch:'lexington', off:45, lat:-2, cam:{back:7.5,up:3,side:0,ahead:16,fov:66}, why:'clear spring morning, village, stone walls, militia'},
        {id:'bunker', name:'Bunker Hill', ch:'bunker', off:45, lat:-2, cam:{back:8,up:3.4,side:0,ahead:18,fov:66}, why:'redoubt, powder smoke and muzzle flashes readable against the sky'},
        {id:'delaware', name:'Crossing the Delaware', ch:'delaware', off:35, lat:-2, cam:{back:7.5,up:3,side:0,ahead:16,fov:66}, why:'winter dusk: must read grey and cold, not blue; river ice, snow'},
        {id:'trenton', name:'Trenton', ch:'trenton', off:45, lat:-2, cam:{back:7.5,up:3,side:0,ahead:16,fov:66}, why:'snow in low sun, town, troops'},
        {id:'saratoga', name:'Saratoga', ch:'saratoga', off:45, lat:-2, cam:{back:7.5,up:3,side:0,ahead:16,fov:66}, why:'autumn woods, golden light'},
        {id:'yorktown', name:'Yorktown', ch:'yorktown', off:50, lat:-2, cam:{back:8,up:3.6,side:0,ahead:20,fov:66}, why:'the payoff: siege lines, artillery, flags'},
        {id:'yorktown_wide', name:'Yorktown wide (stress)', ch:'yorktown', off:90, lat:-2, cam:{back:14,up:9,side:-4,ahead:30,fov:70}, why:'stress scene candidate: most troops, smoke and structures in view'},
      ],
      drive:{id:'chapter_blend_run', name:'Bunker Hill -> Delaware blend (moving)', ch:'delaware', off0:-90, off1:30, lat:-2, speed:36},
    },
  };
  const qs=(()=>{ try{ return new URLSearchParams(location.search); }catch(e){ return new URLSearchParams(''); } })();
  const B={ active:false, scene:null, results:null, shotsPng:{}, SCENES:BENCH_SCENES, errors:[], progress:null,
    requested(){ return BENCH_SCENES[qs.get('bench')]?qs.get('bench'):null; },
    // called from the boot code once GAME exists and the cars are loaded
    maybeStart(){ const id=B.requested(); if(!id||!window.GAME) return false; B.start(id); return true; },
    start(id){ const S=BENCH_SCENES[id], G=window.GAME;
      // account tracks (Revolution) are benchmarked only for a signed-in racer: wait for access, never bypass it
      const tdef=TRACK_DATA.find(t=>t.id===S.track); if(typeof trackLocked==='function'&&trackLocked(tdef)){ if(!B._lockNote){ B._lockNote=1; console.warn('[bench] '+id+' needs a signed-in account: sign in, the benchmark starts when access is granted'); } setTimeout(()=>B.start(id),500); return; }
      B.active=true; B.scene=id;
      // a benchmark must not stop when the window loses focus (the game pauses on blur): measured frames would include the pause
      if(!G.__benchPause){ const op=G.pause; G.pause=function(on){ if(B.active&&on) return; return op.call(this,on); }; G.__benchPause=1; }
      G.S.device=G.S.device||'pc'; G.mode='practice'; G.gp=null;
      G.sel.track=TRACK_DATA.findIndex(t=>t.id===S.track); G.sel.vehicle=Math.max(0,VEHICLES.findIndex(v=>v.id===(qs.get('car')||S.car)));   // &car=<id>: same shots with another car (developer)
      G.startRace();
      const wait=()=>{ if(G.race&&G.race.W&&G.screen==='race'&&!(GFX.v2&&GFX.v2.pending)){ B.run(S); } else setTimeout(wait,200); }; wait(); },   // V2 dressing loads async
    // take over the race frame: animate the world, pose the car, drive the camera, measure
    run(S){ if(+qs.get('frames')){ S=Object.assign({},S,{frames:+qs.get('frames'),warm:Math.min(S.warm,5)}); }   // developer: quick runs
      const G=window.GAME, R=G.race, P=R.P, car=R.player, cam=G.camera; const hud=document.getElementById('hud'); if(hud) hud.style.visibility='hidden';
      G.audio&&G.audio.setMusic&&G.audio.setMusic('menu');
      // shots may be placed relative to a Revolution chapter: {ch:'delaware', off:30} -> i = chapter start + 30
      // ('start' = the race start on the swamp drag strip: the swamp chapter's own start is the hidden connector)
      const CH=(P.route&&P.route.chapters)||[]; const at=(ch,off)=>{ if(ch==='start'&&P.route) return (P.route.start+(off||0)+P.N)%P.N; const c=CH.find(c=>c.id===ch); return c?(c.i+(off||0)+P.N)%P.N:(off||0); };
      const shots=S.shots.map(s=>s.ch?Object.assign({},s,{i:at(s.ch,s.off)}):s);
      const drive=S.drive&&S.drive.ch?Object.assign({},S.drive,{i0:at(S.drive.ch,S.drive.off0),i1:at(S.drive.ch,S.drive.off1)}):S.drive;
      const plan=[]; shots.forEach(s=>plan.push({kind:'shot',s})); if(drive) plan.push({kind:'drive',s:drive});
      const out={scene:B.scene, track:S.track, car:qs.get('car')||S.car, tier:GFX.settings.currentName(), pipeline:GFX.settings.pipeline, when:new Date().toISOString(), device:GFX.renderer.describe(), shots:[]};
      let step=0, f=0, t=0, cur=null; const origUpdate=R.update.bind(R);
      const pose=(i,lat)=>{ car.place(((i%P.N)+P.N)%P.N,lat); car.visual(1/60,t); };
      const aim=(i,lat,c)=>{ i=((Math.round(i)%P.N)+P.N)%P.N; const fx=P.tx[i], fz=P.tz[i], rx=P.rx[i], rz=P.rz[i]; const cx=car.x, cz=car.z, cy=car.y;
        cam.position.set(cx-fx*c.back+rx*c.side, cy+c.up, cz-fz*c.back+rz*c.side); cam.lookAt(cx+fx*c.ahead, cy+1.1, cz+fz*c.ahead); cam.fov=c.fov||66; cam.updateProjectionMatrix(); };
      R.update=(dt)=>{ try{ tick(); }catch(e){ B.errors.push(String(e&&e.stack||e).slice(0,300)); if(B.errors.length>20){ B.active=false; R.update=origUpdate; } } };
      const tick=()=>{ // replaces the race tick while benchmarking (physics/AI/timers do not run)
        const dt=1/60; t+=dt; R.time+=dt; B.progress={step,of:plan.length,f};
        if(!cur){ if(step>=plan.length){ B.finish(out,R,origUpdate); return; } cur=plan[step]; f=0; GFX.perf.reset(); }
        const s=cur.s; const total=S.warm+S.frames;
        if(cur.kind==='shot'){ pose(s.i,s.lat); aim(s.i,s.lat,s.cam); }
        else { const u=Math.min(1,f/total); const fi=s.i0+(s.i1-s.i0)*u; pose(Math.floor(fi),s.lat); aim(fi,s.lat,{back:7.2,up:2.9,side:0,ahead:5,fov:70}); }
        GFX.lighting.follow(R.W,car.x,car.y,car.z);
        R.W.update(dt,R.time); R.fx.sparks.update(dt); R.fx.dust.update(dt);
        if(f===S.warm) GFX.perf.reset();
        GFX.renderer.render(R.scene,G.camera,R.W.th.exposure,'bench');
        f++;
        // the screenshot is taken AFTER the measured frames: reading the canvas back costs 15-20 ms and used to
        // land inside the measurement (the ~35 ms 'worst frame' of every static shot in the Phase 2 results)
        if(f>=total){ const sum=GFX.perf.summary(); if(cur.kind==='shot'){ try{ B.shotsPng[s.id]=G.renderer.domElement.toDataURL('image/jpeg',0.86); }catch(e){} } const inf=GFX.perf.lastInfo||{}; let mats=null; try{ mats=GFX.materials.stats(R.scene); }catch(e){}
          const ps=GFX.post.stats, sh=GFX.renderer.shadow||{};
          out.shots.push({id:s.id, name:s.name, kind:cur.kind, perf:sum, draws:inf.calls, tris:inf.tris, geometries:inf.geometries, textures:inf.textures, programs:inf.programs, materials:mats,
            chapter:GFX.v2&&GFX.v2.chapter?Object.assign({},GFX.v2.chapter):undefined, i:s.i!=null?s.i:undefined,
            path:GFX.renderer.path, shadowDraws:sh.calls, shadowTris:sh.tris, sceneDraws:GFX.renderer.path==='post'?ps.sceneCalls-(sh.calls||0):(inf.calls||0)-(sh.calls||0), postPasses:GFX.renderer.path==='post'?ps.passes:0});
          step++; cur=null; } };
    },
    finish(out,R,origUpdate){ B.results=out; B.active=false;
      try{ const k='rydens_bench_'+out.scene+'_'+out.pipeline+'_'+out.tier; localStorage.setItem(k,JSON.stringify(out)); }catch(e){}
      R.update=(dt)=>{ R.W.update(1/60,R.time+=1/60); R.render(); };   // keep the last shot on screen
      console.log('[bench]',JSON.stringify(out)); window.__benchDone=out;
      B.thumbs(out).then(()=>B.panel(out)).catch(()=>B.panel(out)); },
    // small copies of the screenshots, kept per pipeline on this device, so the panel can put OLD and V2 side by side
    thumbsKey(out,pipe){ return 'rydens_bench_thumbs_'+out.scene+'_'+(pipe||out.pipeline)+'_'+out.tier; },
    thumbs(out){ const ent=Object.entries(B.shotsPng); const res={};
      return Promise.all(ent.map(([k,v])=>new Promise(ok=>{ const im=new Image(); im.onload=()=>{ const c=document.createElement('canvas'); c.width=320; c.height=Math.round(320*im.height/im.width);
          c.getContext('2d').drawImage(im,0,0,c.width,c.height); try{ res[k]=c.toDataURL('image/jpeg',0.72); }catch(e){} ok(); }; im.onerror=ok; im.src=v; })))
        .then(()=>{ B.thumbsNow=res; try{ localStorage.setItem(B.thumbsKey(out),JSON.stringify(res)); }catch(e){} }); },
    otherUrl(out){ const q=new URLSearchParams(location.search); q.set('gfx',out.pipeline==='v2'?'legacy':'v2'); return '?'+q.toString(); },
    previous(out){ const other=out.pipeline==='v2'?'legacy':'v2'; try{ return JSON.parse(localStorage.getItem('rydens_bench_'+out.scene+'_'+other+'_'+out.tier)||'null'); }catch(e){ return null; } },
    panel(out){ const prev=B.previous(out); const el=document.createElement('div'); el.id='gfxBench';
      el.style.cssText='position:fixed;right:10px;top:10px;z-index:100;max-height:92vh;overflow:auto;background:rgba(6,10,20,.9);color:#e6f6ff;font:12px/1.4 ui-monospace,Menlo,Consolas,monospace;border:1px solid rgba(120,220,255,.4);border-radius:8px;padding:10px 12px;max-width:min(560px,94vw)';
      const row=(a,b,c)=>`<tr><td style="padding:2px 8px 2px 0">${a}</td><td style="padding:2px 8px">${b}</td><td style="padding:2px 0;color:#9fb8c8">${c||''}</td></tr>`;
      let h=`<b>BENCHMARK · ${(BENCH_SCENES[out.scene]&&BENCH_SCENES[out.scene].title)||'Pacifica + GT40'}</b><br>${out.tier} · pipeline <b>${out.pipeline}</b> · ${out.device.backend} ${out.device.three} · ${out.device.drawingBuffer.join('×')} @${out.device.pixelRatio}x<br><span style="color:#9fb8c8">${String(out.device.gpu).slice(0,70)}</span><table style="margin-top:6px;border-collapse:collapse">`;
      h+=row('shot','fps · p95 ms · draws · tris',prev?('vs '+prev.pipeline):'');
      out.shots.forEach(s=>{ const p=prev&&prev.shots.find(q=>q.id===s.id); h+=row(s.name, `${s.perf?s.perf.fps:'-'} · ${s.perf?s.perf.p95:'-'} · ${s.draws} · ${((s.tris||0)/1000).toFixed(0)}k`, p&&p.perf?`${p.perf.fps} · ${p.perf.p95} · ${p.draws} · ${((p.tris||0)/1000).toFixed(0)}k`:''); });
      h+='</table><div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">';
      h+='<a id="bjson" href="#" style="color:#7fe3ff">Download results (JSON)</a><a id="bpng" href="#" style="color:#7fe3ff">Download screenshots</a><a href="'+B.otherUrl(out)+'" style="color:#7fe3ff">Run '+(out.pipeline==='v2'?'OLD (legacy)':'GRAPHICS V2')+' for comparison</a><a href="?" style="color:#ffd86b">Back to the game</a></div>';
      let other=null; try{ other=JSON.parse(localStorage.getItem(B.thumbsKey(out,out.pipeline==='v2'?'legacy':'v2'))||'null'); }catch(e){}
      if(other){ const L=out.pipeline==='v2'?['OLD',other,'V2',B.thumbsNow||{}]:['OLD',B.thumbsNow||{},'V2',other];
        h+='<div style="margin-top:8px;display:grid;grid-template-columns:1fr 1fr;gap:4px"><b>OLD (legacy)</b><b>GRAPHICS V2</b>';
        Object.keys(B.shotsPng).forEach(k=>{ h+=`<img src="${L[1][k]||''}" title="${k} OLD" style="width:100%;border-radius:3px"><img src="${L[3][k]||''}" title="${k} V2" style="width:100%;border-radius:3px">`; }); h+='</div>'; }
      else h+='<div style="margin-top:8px;display:grid;grid-template-columns:repeat(3,1fr);gap:4px">'+Object.entries(B.shotsPng).map(([k,v])=>`<img src="${v}" title="${k}" style="width:100%;border-radius:3px">`).join('')+'</div>';
      el.innerHTML=h; document.body.appendChild(el);
      const dl=(name,href)=>{ const a=document.createElement('a'); a.href=href; a.download=name; document.body.appendChild(a); a.click(); a.remove(); };
      el.querySelector('#bjson').onclick=e=>{ e.preventDefault(); dl(`bench_${out.scene}_${out.pipeline}_${out.tier}.json`,URL.createObjectURL(new Blob([JSON.stringify(out,null,1)],{type:'application/json'}))); };
      el.querySelector('#bpng').onclick=e=>{ e.preventDefault(); Object.entries(B.shotsPng).forEach(([k,v],n)=>setTimeout(()=>dl(`bench_${out.pipeline}_${out.tier}_${k}.jpg`,v),n*250)); }; },
  };
  window.GFX=window.GFX||{}; window.GFX.bench=B;
})();
