// Ryden's Racers · Graphics V2 · Track looks (the V2 orchestrator)
// -----------------------------------------------------------------------------------------------
// A LOOK is the complete Graphics V2 description of one track: sun, sky, image-based lighting, haze,
// tone mapping, grade, bloom/AO character, water, road and material rules, storytelling dressing, roadside
// structures and instanced vegetation. Phase 2 defined Pacifica; Phase 3 adds Mojave Mesa Run (mesa).
// Every other track keeps the legacy look (on the modern renderer) until it gets its own look.
//
// Lifecycle (called from Race; graphics only, no gameplay data is read-write):
//   begin(def, game)  before the world is built: colour management on, V2 tier overrides on
//   finish(race)      after the world + cars exist: lighting, sky/IBL, water, materials, road, decals, zones
//   end(race)         when the race is disposed: everything back to the legacy defaults
//
// Developer switches: ?gfx=legacy (Phase 1 look), ?three=r128 (the original renderer), ?post=off|noao|nobloom|nohaze|nograde
(function(){
  const LOOKS={
    coast:{ name:'Pacifica · golden afternoon',
      colorManaged:true, toneMapping:'neutral', exposure:1.3,
      sunDir:[-0.78,0.46,0.22],
      sun:{ color:0xffe2bd, intensity:3.7, shadowBias:-0.00025, normalBias:0.025, radius:2.2 },
      sky:{ zenith:0x2f64b8, horizon:0xcfdce6, warm:0xd89a4c, ground:0x5a5046, mie:0.9, disk:30, sunRadiance:1.0, clouds:0.34, horizonPow:0.32, brightness:1.0 },
      ibl:{ skyScale:1.0, intensity:0.7 },
      hemi:0.0,
      haze:{ density:0.00045, falloff:0.011, start:25, base:-9, color:0xd6cfc4, sunColor:0xffc68c },
      fog:{ near:900, far:5200 },
      bloom:{ threshold:1.6, knee:0.7, intensity:0.05, radius:1.0 },
      ao:{ radius:0.9, intensity:0.85, thickness:1.2, exponent:1.5, falloff:1.0 },
      grade:{ saturation:1.08, contrast:1.05, wb:[1.0,1.0,0.975], lift:[0.004,0.004,0.008], gain:[1,1,1], gamma:1.0, vignette:0.14 },
      ocean:{ deep:0x08314d, shallow:0x1c6f88, sunGlint:7, roughness:0.1 },
      road:{ roughness:0.9, normalScale:0.6, detailTile:1.4, rubber:0.22, dust:0x9a8a70, dustAmt:0.32, macro:0.12, envMapIntensity:0.3 },
      decals:{ patchEvery:170, tarEvery:55, crackEvery:40 },
      // material rules by glTF material name (env GLB)
      materials:[
        {re:/^m_(galv|galv_ds|steel|steel_dark|steel_teal|alu|tin)$/, set:{metalness:0.85, roughness:0.42, envMapIntensity:1.0}},
        {re:/^m_glass$/, set:{metalness:0.0, roughness:0.06, envMapIntensity:1.6}},
        {re:/^m_glass_lamp$/, set:{emissiveIntensity:2.0}},
        {re:/^m_car_(red|white|yellow)$/, physical:{clearcoat:1, clearcoatRoughness:0.06, roughness:0.4}},
        {re:/^m_(paint_white|paint_red|paint_orange|blue)$/, set:{roughness:0.55}},
        {re:/^m_(signs|gantry_sign)$/, set:{emissiveIntensity:1.25}},
        {re:/^m_maximus$/, set:{emissiveIntensity:1.1}},
        {re:/^m_(concrete_coast|concrete_plain|stone)$/, detail:'stone'},
        {re:/^m_coast_rock$/, detail:'rock'},
        {re:/^m_ground$/, detail:'ground'},
        {re:/^m_(scrub|foliage)$/, set:{roughness:0.85}},
      ],
      // intentional dressing: every placement has a reason (i = track sample, lat = metres right of the centreline, yaw = radians)
      dressing:[
        // cliff overlook (the lay-by with the view over the ocean): somewhere to stop
        {asset:'pc_picnic_table', i:146, lat:16.5, yaw:0.25}, {asset:'pc_picnic_table', i:154, lat:17.5, yaw:-0.35},
        {asset:'pc_trash_can', i:142, lat:12.8, yaw:0.0}, {asset:'pc_trash_can', i:158, lat:13.0, yaw:1.2},
        // festival paddock behind the start: a classic on display for the crowd
        {asset:'pc_corvette_gs', i:878, lat:-19.5, yaw:-1.0, lod1:55, far:600},
        {asset:'pc_trash_can', i:872, lat:-14.5, yaw:0.4},
        // Phase 3: the ice-cream trike that works the overlook on race day, its cold box beside it
        {asset:'mz_panel_truck', i:162, lat:14.5, yaw:0.35, lods:[0,50,120], far:700},
        {asset:'mz_ice_freezer', i:166, lat:16.2, yaw:-1.9, s:0.8, far:320},
        // festival services: the generator behind the stands, ice for the crowd, the big bin
        {asset:'mz_generator', i:866, lat:-26, yaw:0.6, far:320},
        {asset:'mz_ice_freezer', i:884, lat:-15.5, yaw:1.4, far:320},
        {asset:'mz_dumpster', i:860, lat:-22, yaw:-0.3, far:360},
      ],
      // painted rail fence along the cliff edge of the overlook lay-by
      roadside:[
        {kind:'rail', from:136, to:170, lat:21, every:2.6, h:1.1, color:0xe9e4d8},
      ],
      // coastal planting, instanced (hero near, impostor cards far): heath on the landward slopes, kniphofia
      // in the lay-by and festival gardens, ferns in the tunnel shade, a tropical bed at the beach festival
      scatter:[
        {asset:'pc_heather', count:900, band:[3,48], cluster:6, clusterRadius:4, scale:[0.8,1.5], minUp:0.72, minY:-4},
        {asset:'pc_redhot', count:70, band:[4,20], section:[128,180], cluster:5, clusterRadius:3, scale:[0.8,1.15], minY:-4},
        {asset:'pc_redhot', count:60, band:[6,26], section:[840,925], cluster:5, clusterRadius:3, scale:[0.8,1.15], minY:-4},
        {asset:'pc_fern', count:70, band:[2,14], section:[188,240], cluster:4, clusterRadius:3, scale:[0.9,1.4], minUp:0.6},
        {asset:'pc_banana', count:14, band:[9,28], section:[850,905], cluster:2, clusterRadius:4, scale:[0.8,1.1], shadowLevels:2, minY:-4},
        {asset:'pc_palm', count:6, band:[16,34], section:[855,905], scale:[0.85,1.1], shadowLevels:2, far:1400, minY:-4},
      ],
      zones:[
        {re:/^pc_(grass)$/, zone:'near', cell:320, far:460},
        {re:/^pc_(scrub|rocks)$/, zone:'near', cell:380, far:700},
        {re:/^pc_shore_rocks$/, zone:'near', cell:450, far:1200},
        {re:/^pc_(cypress|palms)$/, zone:'mid', cell:450, far:1600},
        {re:/^pc_(guardrail|trackside|roadside|support|crowd)$/, zone:'mid', cell:500, far:1400},
      ],
    },
    // Mojave: a hard, high desert sun in a deep blue sky; the warmth lives at the horizon (dust) and in the
    // rock, not in an orange filter over everything. Shadows are short and dense, the asphalt is bleached
    // grey, the paint is chalky, and sand creeps in from the shoulders.
    mesa:{ name:'Mojave · high desert noon',
      colorManaged:true, toneMapping:'neutral', exposure:1.12,
      sunDir:[-0.42,0.84,-0.34],   // high, from behind-left of the main straight: the big mesa faces and the mine are lit, the car shadow stays readable
      sun:{ color:0xfff4e4, intensity:4.3, shadowBias:-0.0002, normalBias:0.03, radius:1.6 },
      sky:{ zenith:0x1c5cc6, horizon:0xb9d1e8, warm:0xc9a27a, ground:0xc49e76, mie:0.45, disk:34, sunRadiance:1.0, clouds:0.06, horizonPow:0.36, brightness:1.0 },   // blue-white horizon; the dust warmth is only the last few degrees (warm band)
      ibl:{ skyScale:1.0, intensity:0.72 },
      hemi:0.0,
      haze:{ density:0.00036, falloff:0.009, start:60, base:-4, color:0xcfccc4, sunColor:0xf2dcc0 },   // low dust layer, heavier near the ground; distant ranges go pale, not brown
      fog:{ near:1100, far:5600 },
      bloom:{ threshold:1.7, knee:0.6, intensity:0.035, radius:0.9 },
      ao:{ radius:0.9, intensity:0.9, thickness:1.2, exponent:1.6, falloff:1.0 },
      grade:{ saturation:1.04, contrast:1.09, wb:[1.0,1.0,1.0], lift:[0.006,0.005,0.008], gain:[1,0.995,0.985], gamma:1.0, vignette:0.15 },
      road:{ roughness:0.94, normalScale:0.7, detailTile:1.3, rubber:0.16, dust:0xb89c78, dustAmt:0.62, macro:0.16, envMapIntensity:0.25,
             albedo:1.25, bleach:0.55, bleachColor:0x9d9892, drift:0.85, edgeStart:0.7 },
      lines:{ wear:0.62, fade:0.35 },
      decals:{ patchEvery:260, tarEvery:34, crackEvery:30, driftEvery:70, thermalEvery:26, fadedPatchEvery:140, gritTint:0xf0d6ae, dirtTint:0xf4dcb4 },
      materials:[
        {re:/^m_(galv|galv_ds|steel|steel_dark|alu|tin)$/, set:{metalness:0.8, roughness:0.5, envMapIntensity:0.9}},
        {re:/^m_glass$/, set:{metalness:0.0, roughness:0.08, envMapIntensity:1.4}},
        {re:/^m_car_(red|white|yellow)$/, physical:{clearcoat:0.6, clearcoatRoughness:0.25, roughness:0.55}},          // sun-baked paint: dull clearcoat
        {re:/^m_(paint_white|paint_red)$/, set:{roughness:0.7}},
        {re:/^m_(signs|gantry_sign)$/, set:{emissiveIntensity:1.1}},
        {re:/^m_maximus$/, set:{emissiveIntensity:1.0}},
        {re:/^m_strata$/, detail:'strata', color:[1.0,0.95,0.92]},    // pull the legacy orange back towards buff/rose; the strata shader adds the banding
        {re:/^m_(rock|rock_plain)$/, detail:'desertRock', color:[1.0,0.95,0.92]},
        {re:/^m_ground$/, detail:'sand'},
        {re:/^m_(concrete_plain|concrete)$/, detail:'stone'},
        {re:/^m_(scrub|joshua_leaf)$/, set:{roughness:0.9}, color:[0.86,0.9,0.8]},        // grey-green desert foliage, not lawn green
        {re:/^m_joshua_bark$/, set:{roughness:0.97}},
        {re:/^m_wood$/, set:{roughness:0.95}, color:[0.9,0.86,0.8]},                    // weathered, sun-greyed timber
      ],
      // storytelling, not scatter: each group is one small scene with a reason to be there
      dressing:[
        // Route 99 trading post & rest area on the open straight: adobe post, picnic tables, a bin, its generator
        {asset:'mz_adobe_pueblo', i:66, lat:-33, yaw:1.62, lods:[0,90,220], far:1600, big:true},
        {asset:'pc_picnic_table', i:57, lat:-17.5, yaw:0.3}, {asset:'pc_picnic_table', i:60, lat:-18.2, yaw:-0.2},
        {asset:'pc_trash_can', i:62, lat:-15.6, yaw:0.0, far:260},
        {asset:'mz_generator', i:74, lat:-24.5, yaw:0.9, far:320},
        // the ibex on the rocks by the arch: someone to watch you go by
        {asset:'mz_ibex', i:121, lat:17.5, yaw:-2.2, onRock:true, far:500},
        // abandoned by the fence: the muscle car that never made it out, a burnt stump, sand in the wheel wells
        {asset:'mz_muscle_sedan', i:186, lat:15.5, yaw:0.55, dy:-0.12, lods:[0,45,110], far:650},
        {asset:'mz_charred_stump', i:193, lat:19, yaw:1.1, far:320},
        // mine camp: the rat rod the miners drive, their compressor, an ore bin
        {asset:'mz_rat_rod', i:620, lat:-19.5, yaw:-2.6, lods:[0,40,100], far:520},
        {asset:'mz_generator', i:626, lat:-33, yaw:0.4, far:320},
        {asset:'mz_dumpster', i:640, lat:-24, yaw:1.4, far:360},
        // service station: ice at the front, the compressor by the side, the delivery truck parked up, the palms someone waters
        {asset:'mz_ice_freezer', i:915, lat:19.5, yaw:-1.57, far:360},
        {asset:'mz_generator', i:930, lat:21.5, yaw:2.2, far:320},
        {asset:'mz_panel_truck', i:906, lat:21.5, yaw:0.2, lods:[0,50,120], far:900},
        {asset:'mz_dumpster', i:934, lat:30, yaw:-1.2, far:360},
        {asset:'pc_palm', i:911, lat:15.5, yaw:0.3, lods:[0,60,140], far:1400}, {asset:'pc_palm', i:927, lat:16, yaw:2.1, s:0.85, lods:[0,60,140], far:1400},
      ],
      // utility line along the old road (poles + sagging wires, one draw) and the fence the car ended up against
      roadside:[
        {kind:'poles', from:-60, to:210, lat:-26, every:44, h:9},
        {kind:'fence', from:176, to:198, lat:13.2, every:3},
      ],
      // instanced plants: hero geometry near, impostor cards far
      scatter:[
        {asset:'pc_redhot', count:260, band:[4,55], cluster:4, clusterRadius:5, scale:[0.7,1.2], minUp:0.85},   // desert bloom
        {asset:'mz_charred_stump', count:28, band:[8,70], scale:[0.6,1.1], far:300, shadowLevels:1, dense:true},
      ],
      // open desert: nearly every chunk is in view at once, so cells are large (a few chunks, not dozens):
      // the win is shadow-box and far culling, not frustum culling
      zones:[
        {re:/^mz_scrub/, zone:'near', cell:650, far:700, shadowFar:260},
        {re:/^mz_rocks/, zone:'near', cell:700, far:1100, shadowFar:300},
        {re:/^mz_joshua/, zone:'mid', cell:750, far:1500, shadowFar:350},
      ],
    },
  };
  const qs=(()=>{ try{ return new URLSearchParams(location.search); }catch(e){ return new URLSearchParams(''); } })();

  // desert detail recipes (GLSL blocks operating on diffuseColor; vDW world position, vDN world normal)
  const STRATA= // sedimentary bands (world height, warped), desert varnish streaks down steep faces, pale caprock
'{ float dl=dot(diffuseColor.rgb,vec3(0.3,0.59,0.11)); diffuseColor.rgb=mix(vec3(dl),diffuseColor.rgb,0.58)*vec3(1.12,1.05,0.97); float warp=dtn(vDW.xz*0.012)*9.+dtn(vDW.xz*0.05)*2.; float yb=vDW.y+warp; float b1=0.5+0.5*sin(yb*0.42); float b2=0.5+0.5*sin(yb*1.7+1.7); float band=smoothstep(0.1,0.9,b1*0.7+b2*0.3);'
             +' vec3 cream=vec3(1.26,1.19,1.07), rose=vec3(1.05,0.9,0.82), rust=vec3(0.8,0.62,0.54); vec3 tint=mix(mix(rust,rose,smoothstep(0.2,0.55,band)),cream,smoothstep(0.62,0.9,band));'
             +' diffuseColor.rgb*=tint; float steep=1.-clamp(vDN.y,0.,1.); float h=vDW.x*0.707+vDW.z*0.707; float streak=dtn(vec2(h*0.55,vDW.y*0.035))*0.7+dtn(vec2(h*2.1,vDW.y*0.12))*0.3;'
             +' diffuseColor.rgb*=1.-smoothstep(0.55,0.85,streak)*smoothstep(0.35,0.8,steep)*0.42; float mac=dtn(vDW.xz*0.02+vDW.y*0.03); diffuseColor.rgb*=0.88+0.24*mac;'
             +' diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.1,1.06,1.0),smoothstep(0.75,0.95,clamp(vDN.y,0.,1.))*0.6); }';
  const SAND= // wind ripples, dark desert-pavement gravel patches, bleached washes
'{ float dl=dot(diffuseColor.rgb,vec3(0.3,0.59,0.11)); diffuseColor.rgb=mix(vec3(dl),diffuseColor.rgb,0.34)*vec3(1.22,1.15,0.9); float mac=dtn(vDW.xz*0.01)*0.55+dtn(vDW.xz*0.043)*0.3+dtn(vDW.xz*0.19)*0.15; diffuseColor.rgb*=0.86+0.28*mac;'
             +' float pave=smoothstep(0.58,0.8,dtn(vDW.xz*0.028+11.3)); diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(0.72,0.68,0.66),pave*0.55);'
             +' float grit=step(0.82,dth(floor(vDW.xz*9.)))*pave; diffuseColor.rgb*=1.-grit*0.35;'
             +' float wash=smoothstep(0.62,0.85,dtn(vDW.xz*0.006+4.2)); diffuseColor.rgb=mix(diffuseColor.rgb,vec3(dot(diffuseColor.rgb,vec3(0.33)))*vec3(1.1,1.06,1.0),wash*0.35);'
             +' float rip=0.5+0.5*sin(dot(vDW.xz,vec2(0.83,0.55))*5.2+dtn(vDW.xz*0.4)*4.); diffuseColor.rgb*=1.-0.06*rip*(1.-pave);'
             +' float sl=1.-clamp(vDN.y,0.,1.); diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(0.92,0.85,0.8),smoothstep(0.25,0.6,sl)*0.5); }';
  // world-space detail for natural surfaces: macro variation + detail normal (shared aggregate map)
  function detailMaterial(m,kind){ if(m.userData.v2detail) return; m.userData.v2detail=kind; const D=GFX.road.detailMaps();
    const rocky=kind==='rock'||kind==='desertRock'||kind==='strata';
    if(!m.normalMap){ const n=D.normal.clone(); n.needsUpdate=true; const rep=rocky?0.35:kind==='stone'?0.6:0.5; n.repeat.set(rep*8,rep*8); m.normalMap=n; const ns=kind==='rock'?1.3:rocky?1.2:kind==='sand'?0.45:0.6; m.normalScale=new THREE.Vector2(ns,ns); }
    m.roughness=Math.max(m.roughness,kind==='stone'?0.85:0.92);
    const src=GFX.compat.uvMap;
    // desert kinds re-balance the whole albedo (texture x vertex colour), so they run after the vertex colours
    const desertKind=kind==='strata'||kind==='desertRock'||kind==='sand';
    m.onBeforeCompile=sh=>{ sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vDW; varying vec3 vDN;').replace('#include <project_vertex>','#include <project_vertex>\nvDW=(modelMatrix*vec4(transformed,1.0)).xyz; vDN=normalize(mat3(modelMatrix)*objectNormal);');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vDW; varying vec3 vDN; float dth(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} float dtn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(dth(i),dth(i+vec2(1,0)),f.x),mix(dth(i+vec2(0,1)),dth(i+vec2(1,1)),f.x),f.y);}')
        .replace(desertKind?'#include <color_fragment>':'#include <map_fragment>',(desertKind?'#include <color_fragment>':'#include <map_fragment>')+'\n'+(
          kind==='rock'? '{ vec2 q=vDW.xz+vDW.y*vec2(0.7,-0.4); float mac=dtn(q*0.018)*0.6+dtn(q*0.07)*0.4; float strata=0.5+0.5*sin(vDW.y*1.9+dtn(vDW.xz*0.05)*5.); float up=clamp(vDN.y,0.,1.);'
             +' diffuseColor.rgb*=0.74+0.46*mac; diffuseColor.rgb*=mix(vec3(0.9,0.93,0.98),vec3(1.08,1.0,0.9),strata*0.8); diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(0.86,0.92,0.72),smoothstep(0.7,0.95,up)*0.35); }'
          : kind==='strata'? STRATA
          : kind==='desertRock'? '{ float dl=dot(diffuseColor.rgb,vec3(0.3,0.59,0.11)); diffuseColor.rgb=mix(vec3(dl),diffuseColor.rgb,0.66)*vec3(1.12,1.05,0.96); vec2 q=vDW.xz+vDW.y*vec2(0.7,-0.4); float mac=dtn(q*0.03)*0.6+dtn(q*0.11)*0.4; diffuseColor.rgb*=0.8+0.36*mac; float steep=1.-clamp(vDN.y,0.,1.);'
             +' float h=vDW.x*0.6+vDW.z*0.8; float streak=dtn(vec2(h*0.8,vDW.y*0.06)); diffuseColor.rgb*=1.-smoothstep(0.6,0.9,streak)*steep*0.35;'
             +' diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.12,1.05,0.95),smoothstep(0.7,0.95,clamp(vDN.y,0.,1.))*0.5); }'   // sand-dusted tops
          : kind==='sand'? // flat ground is sand; the same material on steep faces (the mesas are part of the terrain mesh) becomes banded rock
             '{ vec3 c0=diffuseColor.rgb; float stp=smoothstep(0.32,0.62,1.-clamp(vDN.y,0.,1.)); '+STRATA+' vec3 rockC=diffuseColor.rgb; diffuseColor.rgb=c0; '+SAND+' diffuseColor.rgb=mix(diffuseColor.rgb,rockC,stp); }'
          : kind==='ground'? '{ float mac=dtn(vDW.xz*0.012)*0.55+dtn(vDW.xz*0.05)*0.3+dtn(vDW.xz*0.2)*0.15; diffuseColor.rgb*=0.84+0.3*mac; float dry=dtn(vDW.xz*0.008+5.1); diffuseColor.rgb*=mix(vec3(0.96,1.02,0.94),vec3(1.06,1.0,0.9),dry); float sl=1.-clamp(vDN.y,0.,1.); diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(0.95,0.9,0.86),smoothstep(0.25,0.6,sl)*0.5); }'
          : '{ float mac=dtn(vDW.xz*0.05+vDW.y*0.1)*0.6+dtn(vDW.xz*0.23)*0.4; diffuseColor.rgb*=0.9+0.18*mac; }'));
    };
    m.customProgramCacheKey=()=>'rr_detail_'+kind; m.needsUpdate=true; }

  const V2={
    LOOKS, active:false, look:null, race:null,
    enabled(){ return GFX.settings.pipeline==='v2' && GFX.compat.rev>=160; },
    lookFor(def){ return def && (LOOKS[def.id]||null); },
    toneMappingConst(){ const t=(V2.look&&V2.look.toneMapping)||'aces'; return t==='neutral'?THREE.NeutralToneMapping:t==='agx'?THREE.AgXToneMapping:THREE.ACESFilmicToneMapping; },
    begin(def,game){ V2.end(); const L=V2.enabled()?V2.lookFor(def):null; if(!L) return false;
      V2.active=true; V2.look=Object.assign({},L); V2.look.sunDir=new THREE.Vector3(...L.sunDir).normalize();
      // art tools (developer): ?sun=x,y,z  ?exposure=1.2  try a sun direction / exposure without editing the look
      const sq=qs.get('sun'); if(sq){ const v=sq.split(',').map(Number); if(v.length===3&&v.every(isFinite)) V2.look.sunDir.set(...v).normalize(); }
      if(+qs.get('exposure')) V2.look.exposure=+qs.get('exposure');
      GFX.compat.colorManagement(!!L.colorManaged); if(game) game.applyQuality(); return true; },
    finish(R){ GFX.compat.singlePassTransparency(R.scene); if(!V2.active){ GFX.compat.legacyUVTransforms(R.scene); GFX.compat.applyLegacyEnv(R.scene); return; } const L=V2.look, W=R.W, P=R.P, A=R.A, Q=R.game.Q, r=R.game.renderer; V2.race=R; const t0=performance.now(); const rep={};
      L.hazeC={color:new THREE.Color(L.haze.color), sunColor:new THREE.Color(L.haze.sunColor)};
      // --- sun + shadows
      const sun=W.sun; W.sunDir.copy(L.sunDir); sun.color.setHex(L.sun.color); sun.intensity=L.sun.intensity;
      if(sun.castShadow){ const e=Q.shadowDistance||60; const c=sun.shadow.camera; c.left=-e; c.right=e; c.top=e; c.bottom=-e; c.near=20; c.far=420; c.updateProjectionMatrix();
        sun.shadow.mapSize.set(Q.shadowSize,Q.shadowSize); if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map=null; }
        sun.shadow.bias=L.sun.shadowBias; sun.shadow.normalBias=L.sun.normalBias; sun.shadow.radius=L.sun.radius; }
      W.v2Shadow={extent:Q.shadowDistance||60,size:Q.shadowSize};
      if(W.hemi) W.hemi.intensity=L.hemi||0;
      // --- sky dome + IBL (same sky function)
      const old=[]; W.group.traverse(o=>{ if(o.isMesh&&o.material&&o.material.uniforms&&o.material.uniforms.hor&&o.material.uniforms.top) old.push(o); });
      old.forEach(o=>{ o.visible=false; }); const dome=GFX.sky.makeDome(L,2600); W.group.add(dome); W.v2Sky=dome;
      if(Q.envLighting){ const env=GFX.sky.makeIBL(r,L); R.scene.environment=env; R.scene.environmentIntensity=L.ibl.intensity; V2.env=env; }
      // --- fog: the composite haze does aerial perspective; linear fog only hides the far clip
      if(W.fog){ W.fog.color.set(L.haze.color); W.fog.near=Q.postFX?L.fog.near:L.fog.near*0.2; W.fog.far=Q.postFX?L.fog.far:L.fog.far*0.55; }   // no composite haze on the direct path: linear fog does the aerial perspective
      // --- ocean
      W.group.traverse(o=>{ if(o.isMesh&&o.material&&o.material.uniforms&&o.material.uniforms.deep&&o.material.uniforms.shallow){ const om=GFX.sky.makeOcean(L); o.material.dispose(); o.material=om; W.updaters.push((dt,t)=>{ om.uniforms.t.value=t; }); rep.ocean=true; } });
      // --- environment materials
      const env=W.env&&W.env.root; const road=[], lines=[]; let nm=0;
      if(env){ const seen=new Set();
        env.traverse(o=>{ if(!o.isMesh) return; const m=o.material, n=(m&&m.name)||'';
          if(/^m_asphalt$/.test(n)) road.push(o); else if(/^m_line_[wy]$/.test(n)) lines.push(o);
          if(seen.has(m)) return; seen.add(m);
          for(const rule of L.materials){ if(!rule.re.test(n)) continue; nm++;
            if(rule.set) Object.assign(m,rule.set);
            if(rule.color&&m.color) m.color.multiply(new THREE.Color(...rule.color));
            if(rule.detail && Q.roadDetail>=1) detailMaterial(m,rule.detail);
            if(rule.physical){ const pm=new THREE.MeshPhysicalMaterial(); ['name','color','map','roughness','metalness','roughnessMap','metalnessMap','normalMap','normalScale','emissive','emissiveMap','emissiveIntensity','side','vertexColors','envMapIntensity','aoMap','alphaTest','transparent','opacity','flatShading'].forEach(k=>{ const v=m[k]; if(v!==undefined) pm[k]=(v&&v.clone&&!v.isTexture)?v.clone():v; }); Object.assign(pm,rule.physical); env.traverse(q=>{ if(q.material===m) q.material=pm; }); }
            m.needsUpdate=true; break; } }); }
      rep.materials=nm; if(env){ let ct=0,tt=0; const seenT=new Set(); env.traverse(o=>{ const m=o.material; if(m&&m.map&&!seenT.has(m.map)){ seenT.add(m.map); tt++; if(m.map.isCompressedTexture) ct++; } }); rep.textures={total:tt,ktx2:ct}; }
      road.forEach(o=>GFX.road.upgradeAsphalt(o,W,P,A,L,Q)); lines.forEach(o=>GFX.road.upgradeLines(o,L)); rep.road=road.length;
      // --- decals on the real road surface
      if(Q.decals && road.length){ const surf=GFX.road.surface(road); const dg=GFX.decals.build(W,P,A,surf,L,R.def.id); W.group.add(dg); rep.decals=dg.userData.stats; }
      // --- draw-call control: flat-colour material slots of one object -> one draw (?merge=0 to compare)
      if(env&&qs.get('merge')!=='0') rep.mergeFlat=GFX.lod.mergeFlat(env);
      // --- scenery zones: chunk merged meshes, distance culling, far shadows off
      if(env){ const lod=GFX.lod.manager(Q); rep.zones=lod.zoneEnvironment(env,L.zones); V2.lod=lod; W.updaters.push(()=>{ if(R.game&&R.game.camera) lod.update(R.game.camera); }); }
      // --- MSAA-friendly foliage edges
      if(Q.postFX&&Q.msaa) W.group.traverse(o=>{ if(o.isMesh&&o.material&&o.material.alphaTest>0) o.material.alphaToCoverage=true; });
      // --- cars: V2 vehicle materials + environment
      const cenv=V2.env||R.env; let nc=0; R.cars.forEach(c=>{ nc+=GFX.vehicles.apply(c,cenv); }); rep.carMaterials=nc;
      R.cars.forEach(c=>c.model.root.traverse(o=>{ if(o.isMesh&&o.material&&o.material.map&&o.material.transparent&&/shadow/i.test(o.name||'')) o.material.opacity=0.6; }));
      // --- post look
      GFX.post.enable(Object.assign({},L,{haze:Object.assign({},L.haze,L.hazeC),sunDir:L.sunDir}));
      if(L.grade&&typeof L.grade.lut==='string'&&Q.colorGrade) GFX.post.loadLUT(L.grade.lut).catch(e=>console.warn('[gfx v2] LUT failed',e));   // optional .cube grade per look
      // --- intentional dressing (Meshy props processed in Blender: real scale, LOD0/LOD1, KTX2 + Meshopt)
      if(env&&L.roadside&&Q.propDensity>0){ const rs=GFX.roadside.build(R,L.roadside); if(rs){ W.group.add(rs); rep.roadside=rs.userData.stats; if(V2.lod) rs.children.forEach(c=>V2.lod.register(c,{far:1500,shadowFar:160})); } }
      V2.report=rep; const jobs=[];
      if(env&&L.dressing&&Q.propDensity>0) jobs.push(V2.dress(R,L,Q));
      if(env&&L.scatter&&(Q.vegDensity||0)>0) jobs.push(GFX.scatter.build(R,L,Q,L.scatter).then(S=>{ if(V2.race!==R) return; V2.scatter=S; rep.scatter=S.stats; W.updaters.push(()=>{ if(R.game&&R.game.camera) GFX.scatter.update(S,R.game.camera); }); }));
      // everything async (props, plants) loaded -> compile every program / upload every texture before the lights go green
      V2.pending=Promise.all(jobs).then(()=>{ if(V2.race!==R) return; return GFX.renderer.prewarm(R.scene,R.game.camera,W.th&&W.th.exposure,{canBlock:()=>!R.state||R.state==='intro'||R.state==='countdown'||(GFX.bench&&GFX.bench.active)}).then(st=>{ if(st) rep.prewarm=st; }); })
        .catch(e=>console.warn('[gfx v2] prewarm',e)).then(()=>{ if(V2.race===R) V2.pending=null; });
      rep.ms=Math.round(performance.now()-t0); V2.report=rep; if(qs.get('gfxdebug')) console.log('[gfx v2] look applied: '+L.name,JSON.stringify(rep));
    },
    dress(R,L,Q){ const W=R.W, P=R.P; const ray=new THREE.Raycaster(); const targets=[], rockT=[];
      W.env.root.traverse(o=>{ if(!o.isMesh) return; const nm=o.userData.chunkOf||o.name; if(/rocks|arch/.test(nm)) rockT.push(o); if(!/grass|scrub|cypress|palms|foam|crowd|horizon|rocks|joshua/.test(nm)) targets.push(o); });
      const ids=[...new Set(L.dressing.map(d=>d.asset))]; const ld=GFX.assets.configureLoader(new THREE.GLTFLoader());
      // pipeline props (tools/blender/rr_prop_pipeline.py): nodes lod0/lod1/lod2 (+ lodImp for plants), one GLB per asset
      return Promise.all(ids.map(u=>new Promise(res=>ld.load('models/props/'+u+'.glb?v=3',g=>res([u,g.scene]),undefined,e=>{ console.warn('[gfx v2] dressing asset failed',u,e); res([u,null]); }))))
        .then(pairs=>{ if(V2.race!==R) return; const T=Object.fromEntries(pairs); const grp=new THREE.Group(); grp.name='v2_dressing'; let n=0, tris=0;
          for(const d of L.dressing){ const sc=T[d.asset]; if(!sc) continue; const i=((d.i%P.N)+P.N)%P.N; const x=P.x[i]+P.rx[i]*d.lat, z=P.z[i]+P.rz[i]*d.lat;
            ray.set(new THREE.Vector3(x,P.y[i]+60,z),new THREE.Vector3(0,-1,0)); ray.far=160; const hit=ray.intersectObjects(d.onRock?rockT.concat(targets):targets,false)[0]; const y=hit?hit.point.y:P.y[i];
            const names=['lod0','lod1','lod2','lodImp']; const nodes=names.map(k=>sc.getObjectByName(k)).filter(Boolean); if(!nodes.length) continue;
            const dists=d.lods||[0,d.lod1||40,(d.lod1||40)*2.4,(d.lod1||40)*3.2];
            const levels=nodes.map((nd,k)=>{ let obj=nd.clone(); if(nd.name==='lodImp') obj.traverse(o=>{ if(o.isMesh) o.material=GFX.scatter.impostorMaterial(o.material); }); return {obj,dist:dists[k]!=null?dists[k]:dists[dists.length-1]*(1+k)}; });
            levels.forEach(l=>{ l.obj.position.set(0,0,0); l.obj.rotation.set(0,0,0); l.obj.traverse(o=>{ if(o.isMesh){ o.castShadow=l.obj.name!=='lodImp'; o.receiveShadow=true; } }); });
            nodes[0].traverse(o=>{ if(o.isMesh) tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3; });
            const lod=GFX.lod.makeLOD(levels,Q.lodBias); lod.name='dress_'+d.asset; lod.position.set(x,y+(d.dy||0),z); lod.rotation.y=Math.atan2(P.tx[i],P.tz[i])+(d.yaw||0); if(d.s) lod.scale.setScalar(d.s); lod.updateMatrixWorld(true);
            grp.add(lod); n++; if(V2.lod) V2.lod.register(lod,{far:d.far||450,radius:d.big?12:4, shadowFar:d.big?400:140}); }
          W.group.add(grp); V2.report.dressing={placed:n,lod0Tris:Math.round(tris)}; }); },
    end(R){ V2.pending=null; V2.scatter=null; if(!V2.active&&!V2.env) return; V2.active=false; V2.look=null; V2.race=null; V2.lod=null; GFX.post.disable(); GFX.compat.colorManagement(false);
      if(V2.env){ V2.env.dispose(); V2.env=null; } const g=window.GAME; if(g&&g.renderer) g.applyQuality(); },
  };
  window.GFX=window.GFX||{}; window.GFX.v2=V2;
})();
