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
  // Alondra yard spots: free ground found by probing the env (see docs/graphics-v2/19-alondra-v2.md)
  const AB_LILY=[[141,-21],[141,-25],[144,-21],[144,-25],[144,21],[144,25],[147,-25],[147,30],[147,36],[150,-17],[162,36],[180,-36],[180,17],[198,-36],[204,-36],[207,-36],[222,-36],[228,-25],[231,-21],[231,-25],[231,-30],[234,-21],[234,-25],[234,-36],[237,-17],[237,17],[237,21],[237,25],[240,-17],[240,17],[240,25],[243,21],[246,17],[246,36],[252,-17],[252,-36],[255,-21],[258,-17],[261,-21],[261,-36],[264,-36],[267,17],[270,-36],[273,17],[273,36],[276,-17],[279,-36],[279,17],[279,36],[282,-36],[285,36],[540,-36],[543,-21],[543,-30],[543,-36],[546,-17],[546,-21],[546,-30],[549,-17],[549,-21],[549,-36],[552,-21],[555,-17],[555,-36],[555,17],[555,21],[555,25],[555,30],[558,-25],[558,-30],[558,-36],[558,21],[558,30],[561,-21],[561,-25],[561,30],[564,17],[567,-17],[567,-36],[573,-21],[573,36],[576,-30],[576,36],[579,-30],[582,-17],[582,21],[582,25],[582,36],[585,-21],[588,-21],[588,-30],[591,-21],[591,-25],[594,-21],[594,-25],[594,17],[594,36],[597,-25],[597,-36],[597,36],[600,-30],[600,-36],[603,-17],[603,-30],[603,36],[606,-17],[606,-25],[606,-36],[609,-30],[609,-36],[615,-36],[627,21],[627,25],[633,-36],[636,-17],[636,-25],[639,-36]];
  const AB_BANANA=[[147,21],[204,-17],[207,-17],[219,17],[222,36],[228,-21],[228,-30],[234,17],[234,21],[240,30],[255,-36],[549,-30],[552,-30],[555,-30],[558,-21],[561,-36],[564,-36],[570,-36],[582,-25],[585,36],[588,36],[591,-17],[591,-30],[591,-36],[594,-36],[597,-21],[600,-21],[600,36],[612,-36],[624,-36],[630,-36],[630,25],[630,36]];
  const jit=(L,n,r)=>{ const o=[]; L.forEach(([i,lat],k)=>{ for(let c=0;c<=n;c++){ const a=(k*7+c*13)%17/17*6.283; o.push({i,lat:lat+(c?Math.cos(a)*r:0),ds:c?Math.sin(a)*r*1.4:0,yaw:a}); } }); return o; };
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
    // Alondra: a smoggy Southern California afternoon. Mid-height warm-neutral sun that throws long building
    // shadows across the boulevard, a hazy mid-blue sky with a milky horizon, a lot of sky and concrete bounce
    // (the street reads bright even in shade), glossy shop windows, grimy stucco. Not Mojave's hard noon, not
    // Pacifica's golden coast.
    alondra:{ name:'Alondra · smoggy SoCal afternoon',
      colorManaged:true, toneMapping:'neutral', exposure:1.18,
      sunDir:[-0.55,0.6,-0.58],
      sun:{ color:0xfff0de, intensity:3.8, shadowBias:-0.00025, normalBias:0.03, radius:2.0 },
      sky:{ zenith:0x3f78c2, horizon:0xd6d8d6, warm:0xd8b58e, ground:0x8e877c, mie:0.85, disk:30, sunRadiance:1.0, clouds:0.16, horizonPow:0.44, brightness:1.0 },
      ibl:{ skyScale:1.0, intensity:0.88 },
      hemi:0.12,
      haze:{ density:0.0011, falloff:0.014, start:30, base:0, color:0xd3ccbe, sunColor:0xffdcae },   // smog: denser than the desert, warm grey
      fog:{ near:600, far:2600 },
      bloom:{ threshold:1.6, knee:0.7, intensity:0.045, radius:1.0 },
      ao:{ radius:1.1, intensity:0.75, thickness:1.2, exponent:1.4, falloff:1.0 },   // contact under cars, kerbs and awnings, never black
      grade:{ saturation:1.05, contrast:1.06, wb:[1.0,0.995,0.975], lift:[0.006,0.006,0.008], gain:[1,1,0.99], gamma:1.0, vignette:0.13 },
      road:{ material:/^m_road$/, mesh:/^ab_road$/, roughness:0.9, normalScale:0.62, detailTile:1.4, rubber:0.3, dust:0x6c665e, dustAmt:0.45, macro:0.2, envMapIntensity:0.3, albedo:1.15, edgeStart:0.84 },
      decals:{ patchEvery:85, tarEvery:48, crackEvery:30, manholeEvery:52, potholeEvery:115, oilEvery:34, gritTint:0x6e6961, dirtTint:0x5e5850 },
      walls:{ every:12, height:[1.3,2.8], size:[1.5,3.2], reach:24, max:140 },
      materials:[
        {re:/^m_stucco$/, detail:'stucco', ground:0.4, set:{roughness:0.92}},
        {re:/^m_brick$/, detail:'brick', ground:0.4, set:{roughness:0.9}},
        {re:/^m_block$/, detail:'brick', ground:0.4, set:{roughness:0.88}},
        {re:/^m_facade$/, detail:'storefront', ground:0.4, set:{roughness:0.6, envMapIntensity:1.35}},
        {re:/^m_glass$/, set:{metalness:0.0, roughness:0.04, envMapIntensity:1.6}},
        {re:/^m_concrete$/, detail:'stone'},
        {re:/^m_metal$/, set:{metalness:0.65, roughness:0.42, envMapIntensity:1.0}},          // roll-up doors, awnings
        {re:/^m_steel$/, set:{metalness:0.8, roughness:0.45, envMapIntensity:1.0}},
        {re:/^m_(shingle|tar)$/, set:{roughness:0.95}},
        {re:/^m_(signs|event|murals_a|murals_b|tags|court)$/, set:{roughness:0.8}},
        {re:/^m_paint$/, set:{roughness:0.7}},
        {re:/^m_(foliage|trunk)$/, set:{roughness:0.88}, color:[0.95,0.97,0.9]},             // dusty city greenery
        {re:/^m_ground$/, detail:'ground'},
      ],
      // storytelling: every group is a small scene with a reason (i = track sample, lat = metres right of the centreline)
      dressing:[
        // the delivery van unloading in the side lot of the liquor store south of the Hot Block
        {asset:'mz_panel_truck', i:426, lat:24, yaw:-1.5, lods:[0,50,120], far:700},
        // (ab_graffiti_wall was tried here: its rebaked texture reads as a dark smear at street distance, so the
        //  graffiti comes from the wall-art decals on the real walls instead)
      ],
      // instanced street life (Meshy vehicles are long along X: yaw 0 = nose-in, -1.57 = along the road; the
      // cruisers are built from the game cars, long along Z: the opposite). Nothing is on the racing surface (kerb line or beyond): decorative only, no collision
      scatter:[
        // BPD presence: the precinct lot on the east side (nose-in cruisers + Donut Patrol), a traffic stop in the lot by the intersection
        {asset:'ab_police_cruiser', points:[{i:312,lat:13.5,yaw:1.2},{i:315,lat:13.5,yaw:1.2},{i:321,lat:13.6,yaw:1.25},{i:110,lat:-24,yaw:0.04}], lods:[0,45,110], far:520, shadowLevels:2},
        {asset:'ab_donut_cruiser', points:[{i:318,lat:13.6,yaw:1.2},{i:96,lat:24,yaw:-1.5}], lods:[0,45,110], far:520, shadowLevels:2},
        // the car that got pulled over; cars parked in lots and driveways
        {asset:'mz_muscle_sedan', points:[{i:113,lat:-24,yaw:-1.57},{i:465,lat:-25,yaw:0.1},{i:229,lat:-22,yaw:0.05},{i:147,lat:22,yaw:3.1},{i:258,lat:-23,yaw:-0.1},{i:588,lat:-25,yaw:0.15}], lods:[0,45,110], far:480, shadowLevels:2},
        {asset:'pc_corvette_gs', points:[{i:441,lat:21,yaw:3.05},{i:240,lat:22,yaw:3.14},{i:600,lat:-30,yaw:0.05}], lods:[0,45,110], far:480, shadowLevels:2},
        {asset:'mz_rat_rod', points:[{i:468,lat:-21,yaw:-0.2}], lods:[0,40,100], far:420, shadowLevels:2},
        // service alleys: dumpsters behind the shops
        {asset:'mz_dumpster', points:[{i:96,lat:30,yaw:0.2},{i:504,lat:-25,yaw:1.57},{i:462,lat:-30,yaw:0.1},{i:144,lat:-30,yaw:1.5},{i:411,lat:21,yaw:-0.2}], far:360},
        // sidewalk bins on the commercial strip and the Hot Block, wheelie bins out on the kerb in the residential streets
        {asset:'pc_trash_can', points:[57,75,93,108,396,420,447,471,489].map((i,k)=>({i,lat:k%2?11.2:-11.2,yaw:0})).concat([150,174,201,222,246,270].map((i,k)=>({i,lat:k%2?-10.8:10.8,yaw:0.3}))), far:260, thin:true},
        // ATMs at the storefronts; AC units on the flat commercial roofs (probed from above: the first flat surface is the roof)
        {asset:'ab_atm', points:[{i:42,lat:-12.4,yaw:-1.57},{i:66,lat:12.6,yaw:1.57},{i:486,lat:-12.5,yaw:-1.57},{i:393,lat:12.6,yaw:1.57}], far:240},
        {asset:'ab_ac_unit', points:[{i:42,lat:-22},{i:45,lat:20},{i:120,lat:20},{i:300,lat:-20},{i:318,lat:20},{i:360,lat:-19},{i:396,lat:-19},{i:486,lat:-20},{i:66,lat:-24}], probe:40, far:420, thin:true},
        // yards: lily beds and bananas in the front gardens of the south side and around the park
        {asset:'ab_red_lily', points:jit(AB_LILY,2,1.1), scale:[0.8,1.2], far:300, thin:true},
        {asset:'pc_banana', points:AB_BANANA.map(([i,lat])=>({i,lat})), scale:[0.8,1.1], yawJitter:3.1, far:420, shadowLevels:1, thin:true},
      ],
      // the env is already split by neighbourhood (ab_n_*, ab_f_*, ab_street_*, ab_veg_*): chunking it further
      // multiplied draws (104 meshes -> 1071 chunks, 276 -> 585 draws), so zones only cull whole neighbourhoods
      // by distance and switch their shadows off beyond shadowFar
      // one draw per material per 350 m cell across all neighbourhoods (see GFX.lod.mergeByMaterial)
      mergeMaterials:{ re:/^ab_(n_|f_|street_|streets|outskirts|park|railyard|railcut|overpass|stand|event|gantry|barrier|catchfence|banners)/, skip:/crowd|_lit/, cell:350 },
      zones:[
        {re:/^ab_(n_|f_)/, zone:'mid', cell:1e5, far:1400, shadowFar:480},
        {re:/^ab_(street_|streets)/, zone:'near', cell:1e5, far:700, shadowFar:260},
        {re:/^ab_(veg_near|veg_res|veg_start|veg_commercial|veg_mural|park_veg)/, zone:'near', cell:1e5, far:900, shadowFar:300},
        {re:/^ab_veg_far/, zone:'mid', cell:1e5, far:1600, shadowFar:1},
        {re:/^ab_(park|railyard|railcut|outskirts)/, zone:'mid', cell:1e5, far:1500, shadowFar:420},
      ],
    },
    // Revolution: one look per chapter, blended with the course's own chapter system (revChapterAt: 70 samples
    // of blend before each chapter). The base values are Yorktown's; each chapter overrides sun, sky, haze,
    // grade and exposure. Sun direction stays fixed for the whole course (shadows must not swing).
    revolution:{ name:'Revolution · seven chapters, 1775–1781',
      colorManaged:true, toneMapping:'neutral', exposure:1.1,
      sunDir:[-0.7,0.34,0.55],
      sun:{ color:0xffc98a, intensity:3.5, shadowBias:-0.0003, normalBias:0.035, radius:2.2 },
      sky:{ zenith:0x4f78b4, horizon:0xf0d4a6, warm:0xe8b47c, ground:0x7c6a4c, mie:1.1, disk:30, sunRadiance:1.0, clouds:0.36, horizonPow:0.5, brightness:1.0 },
      ibl:{ skyScale:1.0, intensity:0.8 },
      hemi:0.12,
      haze:{ density:0.0012, falloff:0.012, start:25, base:0, color:0xe6cfa6, sunColor:0xffd6a0 },
      fog:{ near:700, far:2400 },
      bloom:{ threshold:1.5, knee:0.7, intensity:0.06, radius:1.0 },   // muzzle flashes and the portals bloom, smoke does not
      ao:{ radius:1.2, intensity:0.8, thickness:1.3, exponent:1.4, falloff:1.0 },
      grade:{ saturation:1.06, contrast:1.07, wb:[1.02,1.0,0.96], lift:[0.008,0.006,0.004], gain:[1,0.99,0.97], gamma:1.0, vignette:0.16 },
      road:{ material:/^__none__$/ },   // dirt, mud, cobble and snow roads keep the course's own ground/road shaders (no asphalt, no road decals)
      materials:[
        // m_ground, m_road, m_foliage keep the course's own shaders (two-scale ground, road wear, leaf wind)
        {re:/^m_(stone|stonewall)$/, detail:'stone', set:{roughness:0.9}},
        {re:/^m_earth$/, detail:'ground', set:{roughness:0.97}},                        // earthworks, redoubts
        {re:/^m_facade$/, detail:'storefront', ground:0, set:{roughness:0.75, envMapIntensity:1.1}},   // colonial facades: the dark window panes read as glass
        {re:/^m_(timber|planks|wicker|bark)$/, set:{roughness:0.94}},
        {re:/^m_snow$/, set:{roughness:0.62, envMapIntensity:1.15}},                   // wind-packed snow: a soft sheen, not white plastic
        {re:/^m_shingle$/, set:{roughness:0.93}},
        {re:/^m_iron$/, set:{metalness:0.7, roughness:0.5}},                            // cannon, hardware
        {re:/^m_(canvas|sandbag)$/, set:{roughness:0.95}},
        {re:/^m_(signs|paint)$/, set:{roughness:0.8}},
      ],
      // (rv_palisade lines at Bunker Hill / Yorktown were tried: behind the course's own barriers and hay walls
      //  they did not read from the road at any placement tested, so they are not placed. Asset kept for Phase 5)
      // Phase 5 Meshy set, placed on free ground found by probing (test/free2.js): a brick house and a farm gate in
      // Lexington's fields, butcher stalls at Trenton and in the Yorktown village; firs on the Lexington hills,
      // birches and fly agarics in the Saratoga woods, mossy logs along the swamp. Not in the Yorktown battle
      // view (the mobile draw-call hotspot): only one stall there.
      dressing:[
        {asset:'rv_colonial_house', i:360, lat:30, yaw:1.57, lods:[0,70,180], far:1000, big:true},
        {asset:'rv_colonial_house', i:438, lat:29, yaw:1.45, lods:[0,70,180], far:1000, big:true},
        {asset:'rv_timber_gate', i:372, lat:17.5, yaw:1.57, lods:[0,35,90], far:320},
        {asset:'rv_butcher_stall', i:1456, lat:29, yaw:1.57, lods:[0,40,100], far:380},
        {asset:'rv_butcher_stall', i:2139, lat:-18.5, yaw:-1.57, lods:[0,40,100], far:380},
      ],
      scatter:[
        {asset:'rv_fir', count:36, band:[16,70], section:[300,580], cluster:3, clusterRadius:9, scale:[0.8,1.2], shadowLevels:1, far:900, minUp:0.8},
        {asset:'rv_birch', count:44, band:[12,55], section:[1561,2079], cluster:4, clusterRadius:7, scale:[0.8,1.15], shadowLevels:1, far:700, minUp:0.8},
        {asset:'rv_fly_agaric', count:70, band:[4,22], section:[1561,2079], cluster:5, clusterRadius:2, scale:[0.8,1.4], far:110, minUp:0.85},
        {asset:'rv_mossy_log', count:24, band:[6,20], section:[2900,3100], cluster:1, scale:[0.8,1.3], far:260, minUp:0.85},
      ],
      // no zones: the course culls its own vegetation / building tiles by the fog distance (course code), and the
      // troops cast shadows only in their near tier. The chapter fog below is therefore also the cull distance:
      // it keeps the legacy chapter distances (same tiles in view as before), the haze does the aerial perspective
      zones:[],
      // Phase 5 draw-call control (Yorktown / mobile): far vegetation tiles (2 draws per tile: foliage + bark) merged per
      // material per 700 m cell and culled by distance as chunks; the course's crossed light-shaft cards merged to one draw
      mergeMaterials:{ re:/^rv_veg_far_/, cell:700, far:1500, shadowFar:1 },
      mergeCards:{ maxTris:2 },
      chapters:{
        // South Carolina swamp: a humid, low golden sun through green-grey mist
        swamp:{ fog:{near:360, far:600}, sun:{color:0xffb574, intensity:2.7}, sky:{zenith:0x4f6b86, horizon:0xdcc39a, warm:0xd9a674, ground:0x3c4a30, clouds:0.46, mie:1.3},
          haze:{density:0.0034, falloff:0.02, color:0xa9b49c, sunColor:0xffc890}, exposure:1.12, ibl:0.8, grade:{saturation:1.0, contrast:1.05, wb:[1.01,1.0,0.95]} },
        // Lexington & Concord, April 1775: a crisp, clear spring morning
        lexington:{ fog:{near:810, far:1350}, sun:{color:0xfff0d8, intensity:3.7}, sky:{zenith:0x3f78c8, horizon:0xdce6ee, warm:0xe6d2b4, ground:0x5e6e40, clouds:0.3, mie:0.9},
          haze:{density:0.0008, falloff:0.012, color:0xd6dfe4, sunColor:0xfff0d8}, exposure:1.08, ibl:0.85, grade:{saturation:1.07, contrast:1.06, wb:[1.0,1.0,0.99]} },
        // Bunker Hill, June 1775: a hot afternoon, dust and powder smoke
        bunker:{ fog:{near:690, far:1150}, sun:{color:0xffdfa8, intensity:3.8}, sky:{zenith:0x4a7cbe, horizon:0xeedcb6, warm:0xe8c490, ground:0x7a6c40, clouds:0.28, mie:1.1},
          haze:{density:0.0012, falloff:0.013, color:0xe0d2b2, sunColor:0xffdcaa}, exposure:1.06, ibl:0.82, grade:{saturation:1.05, contrast:1.07, wb:[1.02,1.0,0.96]} },
        // Crossing the Delaware, Christmas night 1776: overcast winter dusk. Grey, cold, but not blue: the white
        // balance is pulled warm and the saturation down, so the snow reads white and the river slate-grey
        delaware:{ fog:{near:460, far:760}, sun:{color:0xf2ebe0, intensity:1.9}, sky:{zenith:0x8a94a0, horizon:0xdcdbd6, warm:0xcfc1ae, ground:0x8e9094, clouds:0.8, mie:0.7, horizonPow:0.62},
          haze:{density:0.0024, falloff:0.014, color:0xcfcfcb, sunColor:0xe8e2d8}, exposure:1.0, ibl:1.0, grade:{saturation:0.9, contrast:1.04, wb:[1.03,1.0,0.955], lift:[0.01,0.01,0.01]} },
        // Trenton, the morning after: low winter sun on fresh snow, clean and bright
        trenton:{ fog:{near:420, far:700}, sun:{color:0xffe6c8, intensity:2.8}, sky:{zenith:0x6f8fb6, horizon:0xe2e0da, warm:0xe0c8a8, ground:0x9a9ca0, clouds:0.55, mie:0.9},
          haze:{density:0.0016, falloff:0.013, color:0xd9d7d1, sunColor:0xffe6c8}, exposure:1.0, ibl:0.95, grade:{saturation:0.95, contrast:1.05, wb:[1.025,1.0,0.96]} },
        // Saratoga, autumn 1777: golden light in the fall woods
        saratoga:{ fog:{near:600, far:1000}, sun:{color:0xffcc8a, intensity:3.4}, sky:{zenith:0x5579b0, horizon:0xf0cc98, warm:0xe6a868, ground:0x6e5430, clouds:0.42, mie:1.2},
          haze:{density:0.0013, falloff:0.013, color:0xe2c69e, sunColor:0xffcc8a}, exposure:1.05, ibl:0.8, grade:{saturation:1.09, contrast:1.07, wb:[1.03,1.0,0.94]} },
        // Yorktown, 1781: the payoff. Grand late-afternoon gold over the siege lines and the harbour
        yorktown:{ fog:{near:780, far:1300}, sun:{color:0xffc27c, intensity:3.8}, sky:{zenith:0x4f78b4, horizon:0xf4d09a, warm:0xeeae70, ground:0x806a46, clouds:0.36, mie:1.25},
          haze:{density:0.0012, falloff:0.012, color:0xeacfa2, sunColor:0xffcf92}, exposure:1.1, ibl:0.8, grade:{saturation:1.08, contrast:1.08, wb:[1.03,1.0,0.94]}, bloom:0.075 },
      },
    },
    // Neon Foundry Nights: midnight in the steelworks. Wet, metallic, dangerous: deep blacks with readable road
    // edges, the course's own LED show pushed into HDR so bloom finds it, a dark sky with magenta light pollution
    // and furnace orange low in the north-east, reflections from a night IBL made of neon / sodium / furnace
    // panels (the black sky alone reflects nothing), wet asphalt with puddles and a squeegeed racing line.
    // The moon is the only shadow light.
    neon:{ name:'Neon Foundry · wet midnight',
      colorManaged:true, toneMapping:'neutral', exposure:1.3,
      sunDir:[0.35,0.62,-0.7],
      sun:{ color:0x8fa4ff, intensity:0.45, shadowBias:-0.0003, normalBias:0.03, radius:2.4 },
      sky:{ zenith:0x03040b, horizon:0x1c1130, warm:0x3a1c10, ground:0x040308, mie:0.35, disk:6, sunRadiance:0.35, clouds:0.22, horizonPow:0.62, brightness:1.0 },
      ibl:{ skyScale:1.0, intensity:1.0 },
      night:{
        // reflections: what wet asphalt, paint and steel see (HDR panels around the horizon, a dim sky overhead)
        iblSpec:{ background:0x03040a, ground:0x020203, panels:[
          {w:30,h:4,color:0x22e4ff,intensity:5,pos:[40,4,0]}, {w:30,h:4,color:0xff2e97,intensity:5,pos:[-40,4,6]},
          {w:26,h:3,color:0x9b4dff,intensity:4,pos:[8,5,40]}, {w:22,h:5,color:0xff6a1c,intensity:3.2,pos:[28,3,-32]}, {w:18,h:3,color:0x3a7bff,intensity:3,pos:[-30,6,-30]},
          {w:14,h:2,color:0xffb060,intensity:3,pos:[-20,16,-24]}, {w:10,h:2,color:0xfff2e0,intensity:2.5,pos:[0,22,20]},
          {w:60,h:60,color:0x0b0e1a,intensity:1,pos:[0,40,0]} ] },
        hdr:{ basic:1.6, shader:1.3, glow:0.85, additive:0.5 },        // multipliers on the course's LED materials (toneMapped:false) so they bloom
        stripEnv:true,                                  // env materials use the night IBL instead of the course's legacy env map
        glow:{ re:/^nf_(furnace|furnace_pools)$/, color:0xff5a18, intensity:0.16, size:1.1, cell:14 },
        steam:{ re:/^nf_stack_rings$/, cell:18, rate:3.5, rise:2.6, life:8, size:17, color:0x8e899a, alpha:0.3, spread:3,
                furnace:{ re:/^nf_furnace$/, rate:2.5, rise:1.6, life:6, size:19, color:0x5e4238, alpha:0.14 } },
      },
      hemi:0.05,
      haze:{ density:0.0017, falloff:0.018, start:20, base:0, color:0x140e20, sunColor:0x2a2240 },
      fog:{ near:500, far:1500 },
      bloom:{ threshold:0.85, knee:0.45, intensity:0.3, radius:1.0 },
      ao:{ radius:1.0, intensity:0.9, thickness:1.2, exponent:1.4, falloff:1.0 },
      grade:{ saturation:1.08, contrast:1.12, wb:[0.985,0.99,1.03], lift:[0.005,0.005,0.009], gain:[1,1,1], gamma:1.0, vignette:0.2 },
      road:{ material:/^m_road$/, roughness:0.62, normalScale:0.5, detailTile:1.4, rubber:0.35, dust:0x1a1a22, dustAmt:0.25, macro:0.18, envMapIntensity:1.0, albedo:1.0, edgeStart:0.8,
             wet:{ amount:0.85, darken:0.45, puddles:0.6, roughness:0.07 } },
      decals:{ patchEvery:110, tarEvery:55, crackEvery:40, manholeEvery:70, potholeEvery:0, oilEvery:24, gritTint:0x2a2a30, dirtTint:0x1c1c22 },
      materials:[
        {re:/^m_(steel_dark|arch_steel|galv|metal)$/, set:{metalness:0.85, roughness:0.32, envMapIntensity:1.2}},   // wet steel
        {re:/^m_(wall_dark|cladding)$/, set:{metalness:0.45, roughness:0.5, envMapIntensity:1.0}},
        {re:/^m_container$/, set:{metalness:0.35, roughness:0.48, envMapIntensity:1.0}},
        {re:/^m_glass_dark$/, set:{metalness:0.0, roughness:0.04, envMapIntensity:1.5}},
        {re:/^m_concrete$/, detail:'stone', set:{roughness:0.72}},                                               // damp concrete
        {re:/^m_(shoulder|curb|barrier)$/, set:{roughness:0.45, envMapIntensity:0.9}},
        {re:/^m_slag$/, set:{roughness:0.9}},
        {re:/^m_(signs|gantry_sign|mvm_title)$/, set:{emissiveIntensity:0.8}},    // text stays under the bloom threshold: readable, not a blob
        {re:/^m_(mvm_art|maximus)$/, set:{emissiveIntensity:0.7}},
      ],
      // no extra props: the track is already dense, and the only free concrete off the racing line (tech yard,
      // found by probing) sits behind the barriers where a parked truck is not seen from the road (tried)
      zones:[],
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
    const desertKind=kind==='strata'||kind==='desertRock'||kind==='sand'||kind==='stucco'||kind==='storefront'||kind==='brick';   // these run after the vertex colours
    m.onBeforeCompile=sh=>{ sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vDW; varying vec3 vDNv;').replace('#include <project_vertex>','#include <project_vertex>\nvDW=(modelMatrix*vec4(transformed,1.0)).xyz; vec3 dnW=mat3(modelMatrix)*objectNormal; vDNv=dot(dnW,dnW)>1e-8?normalize(dnW):vec3(0.);');
      // the Alondra env has no vertex normals (flat shaded): fall back to the face normal from derivatives
      sh.fragmentShader=sh.fragmentShader.replace('void main() {','void main() {\nvDN=dot(vDNv,vDNv)>0.25?normalize(vDNv):normalize(cross(dFdx(vDW),dFdy(vDW)));').replace('#include <common>','#include <common>\nvarying vec3 vDW; varying vec3 vDNv; vec3 vDN; float sfGlass=0.; const float GR='+(m.userData.v2ground||0).toFixed(2)+'; float dth(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} float dtn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(dth(i),dth(i+vec2(1,0)),f.x),mix(dth(i+vec2(0,1)),dth(i+vec2(1,1)),f.x),f.y);}')
        .replace(desertKind?'#include <color_fragment>':'#include <map_fragment>',(desertKind?'#include <color_fragment>':'#include <map_fragment>')+'\n'+(
          kind==='rock'? '{ vec2 q=vDW.xz+vDW.y*vec2(0.7,-0.4); float mac=dtn(q*0.018)*0.6+dtn(q*0.07)*0.4; float strata=0.5+0.5*sin(vDW.y*1.9+dtn(vDW.xz*0.05)*5.); float up=clamp(vDN.y,0.,1.);'
             +' diffuseColor.rgb*=0.74+0.46*mac; diffuseColor.rgb*=mix(vec3(0.9,0.93,0.98),vec3(1.08,1.0,0.9),strata*0.8); diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(0.86,0.92,0.72),smoothstep(0.7,0.95,up)*0.35); }'
          : kind==='strata'? STRATA
          : kind==='desertRock'? '{ float dl=dot(diffuseColor.rgb,vec3(0.3,0.59,0.11)); diffuseColor.rgb=mix(vec3(dl),diffuseColor.rgb,0.66)*vec3(1.12,1.05,0.96); vec2 q=vDW.xz+vDW.y*vec2(0.7,-0.4); float mac=dtn(q*0.03)*0.6+dtn(q*0.11)*0.4; diffuseColor.rgb*=0.8+0.36*mac; float steep=1.-clamp(vDN.y,0.,1.);'
             +' float h=vDW.x*0.6+vDW.z*0.8; float streak=dtn(vec2(h*0.8,vDW.y*0.06)); diffuseColor.rgb*=1.-smoothstep(0.6,0.9,streak)*steep*0.35;'
             +' diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.12,1.05,0.95),smoothstep(0.7,0.95,clamp(vDN.y,0.,1.))*0.5); }'   // sand-dusted tops
          : kind==='sand'? // flat ground is sand; the same material on steep faces (the mesas are part of the terrain mesh) becomes banded rock
             '{ vec3 c0=diffuseColor.rgb; float stp=smoothstep(0.32,0.62,1.-clamp(vDN.y,0.,1.)); '+STRATA+' vec3 rockC=diffuseColor.rgb; diffuseColor.rgb=c0; '+SAND+' diffuseColor.rgb=mix(diffuseColor.rgb,rockC,stp); }'
          : kind==='stucco'? // city walls: fine grain, grime at the base, water stains streaking down from sills and roof edges
             '{ float mac=dtn(vDW.xz*0.06+vDW.y*0.21)*0.55+dtn(vec2(vDW.x+vDW.z,vDW.y)*1.3)*0.45; diffuseColor.rgb*=0.9+0.17*mac; float vert=1.-abs(vDN.y);'
             +' float grime=(1.-smoothstep(0.15,1.5,vDW.y-GR))*vert; diffuseColor.rgb*=1.-0.28*grime*(0.6+0.4*dtn(vDW.xz*0.8));'
             +' float h=vDW.x*0.71+vDW.z*0.71; float streak=smoothstep(0.62,0.9,dtn(vec2(h*1.6,vDW.y*0.07)))*vert; diffuseColor.rgb*=1.-0.13*streak; }'
          : kind==='brick'? '{ float mac=dtn(vec2(vDW.x+vDW.z,vDW.y)*0.35)*0.6+dtn(vDW.xz*0.9)*0.4; diffuseColor.rgb*=0.88+0.2*mac; float vert=1.-abs(vDN.y); diffuseColor.rgb*=1.-0.22*(1.-smoothstep(0.1,1.2,vDW.y-GR))*vert; }'
          : kind==='storefront'? // shop fronts: the dark window areas of the facade atlas become glass (glossy, reflect the sky and the street)
             '{ float l=dot(diffuseColor.rgb,vec3(0.3,0.59,0.11)); float mx=max(diffuseColor.r,max(diffuseColor.g,diffuseColor.b)), mn=min(diffuseColor.r,min(diffuseColor.g,diffuseColor.b));'
             +' sfGlass=smoothstep(0.26,0.12,l)*smoothstep(0.3,0.08,mx-mn)*(1.-abs(vDN.y)); float vert=1.-abs(vDN.y); diffuseColor.rgb*=1.-0.2*(1.-smoothstep(0.1,1.0,vDW.y-GR))*vert*(1.-sfGlass); }'
          : kind==='ground'? '{ float mac=dtn(vDW.xz*0.012)*0.55+dtn(vDW.xz*0.05)*0.3+dtn(vDW.xz*0.2)*0.15; diffuseColor.rgb*=0.84+0.3*mac; float dry=dtn(vDW.xz*0.008+5.1); diffuseColor.rgb*=mix(vec3(0.96,1.02,0.94),vec3(1.06,1.0,0.9),dry); float sl=1.-clamp(vDN.y,0.,1.); diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(0.95,0.9,0.86),smoothstep(0.25,0.6,sl)*0.5); }'
          : '{ float mac=dtn(vDW.xz*0.05+vDW.y*0.1)*0.6+dtn(vDW.xz*0.23)*0.4; diffuseColor.rgb*=0.9+0.18*mac; }'));
      if(kind==='storefront') sh.fragmentShader=sh.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,0.06,sfGlass);').replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=mix(metalnessFactor,0.1,sfGlass);');
    };
    m.customProgramCacheKey=()=>'rr_detail2_'+kind+'_'+(m.userData.v2ground||0); m.needsUpdate=true; }

  const V2={
    LOOKS, active:false, look:null, race:null,
    enabled(){ return GFX.settings.pipeline==='v2' && GFX.compat.rev>=160; },
    // Which tracks get their V2 look by default. After the first live test only Neon Foundry stays on: the
    // other tracks render their original look on r186 (they ran smoother and looked right that way).
    // ?v2looks=all (or a list, e.g. ?v2looks=alondra,coast) turns the other looks back on to keep working on them.
    DEFAULT_LOOKS:['neon'],
    lookOn(id){ const q=qs.get('v2looks'); if(q) return q==='all'?!!LOOKS[id]:q.split(',').includes(id); return V2.DEFAULT_LOOKS.includes(id); },
    // V2 car materials (slot paint / chrome / glass): off by default after the live test (?v2cars=1 to compare)
    carsOn(){ return qs.get('v2cars')==='1'; },
    lookFor(def){ return def && V2.lookOn(def.id) && (LOOKS[def.id]||null); },
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
      if(L.ocean) W.group.traverse(o=>{ if(o.isMesh&&o.material&&o.material.uniforms&&o.material.uniforms.deep&&o.material.uniforms.shallow){ const om=GFX.sky.makeOcean(L); o.material.dispose(); o.material=om; W.updaters.push((dt,t)=>{ om.uniforms.t.value=t; }); rep.ocean=true; } });
      // --- environment materials
      const env=W.env&&W.env.root; const road=[], lines=[]; let nm=0;
      if(env){ const seen=new Set();
        env.traverse(o=>{ if(!o.isMesh) return; const m=o.material, n=(m&&m.name)||'';
          const RS=L.road||{}; if((RS.material||/^m_asphalt$/).test(n)&&(!RS.mesh||RS.mesh.test(o.name))) road.push(o); else if(/^m_line_[wy]$/.test(n)) lines.push(o);
          if(seen.has(m)) return; seen.add(m);
          for(const rule of L.materials){ if(!rule.re.test(n)) continue; nm++;
            if(rule.set) Object.assign(m,rule.set);
            if(rule.color&&m.color) m.color.multiply(new THREE.Color(...rule.color));
            if(rule.ground!=null) m.userData.v2ground=rule.ground;   // street level for base grime (city kinds)
            if(rule.detail && Q.roadDetail>=1 && !qs.get('nodetail')) detailMaterial(m,rule.detail);   // ?nodetail=1: A/B the detail shaders
            if(rule.physical){ const pm=new THREE.MeshPhysicalMaterial(); ['name','color','map','roughness','metalness','roughnessMap','metalnessMap','normalMap','normalScale','emissive','emissiveMap','emissiveIntensity','side','vertexColors','envMapIntensity','aoMap','alphaTest','transparent','opacity','flatShading'].forEach(k=>{ const v=m[k]; if(v!==undefined) pm[k]=(v&&v.clone&&!v.isTexture)?v.clone():v; }); Object.assign(pm,rule.physical); env.traverse(q=>{ if(q.material===m) q.material=pm; }); }
            m.needsUpdate=true; break; } }); }
      rep.materials=nm; if(env){ let ct=0,tt=0; const seenT=new Set(); env.traverse(o=>{ const m=o.material; if(m&&m.map&&!seenT.has(m.map)){ seenT.add(m.map); tt++; if(m.map.isCompressedTexture) ct++; } }); rep.textures={total:tt,ktx2:ct}; }
      road.forEach(o=>GFX.road.upgradeAsphalt(o,W,P,A,L,Q)); lines.forEach(o=>GFX.road.upgradeLines(o,L)); rep.road=road.length;
      // --- night tracks: HDR emissives, night IBL for reflections, furnace glow, steam
      if(L.night) rep.night=V2.night(R,L,Q,r);
      // --- decals on the real road surface
      if(Q.decals && road.length){ const surf=GFX.road.surface(road); const dg=GFX.decals.build(W,P,A,surf,L,R.def.id); W.group.add(dg); rep.decals=dg.userData.stats; }
      // --- wall art (graffiti, posters, painted ads, stencils): one merged mesh on walls that face the road
      if(Q.decals && env && L.walls){ const wm=GFX.decals.buildWalls(W,P,Object.assign({},L.walls,{max:Math.round((L.walls.max||120)*Math.max(0.35,Q.propDensity||1))})); if(wm){ W.group.add(wm); rep.walls=wm.userData.stats; } }
      // --- draw-call control: flat-colour material slots of one object -> one draw (?merge=0 to compare)
      if(env&&qs.get('merge')!=='0') rep.mergeFlat=GFX.lod.mergeFlat(env);
      const mergedFar=[];
      if(env&&L.mergeMaterials&&qs.get('merge')!=='0') rep.mergeByMaterial=GFX.lod.mergeByMaterial(env,Object.assign({onMerged:m=>{ if(L.mergeMaterials.far) mergedFar.push(m); }},L.mergeMaterials));
      // static decoration cards the course builds as one mesh each (Revolution: the crossed light-shaft planes): one draw per material
      if(L.mergeCards&&qs.get('merge')!=='0'){ const C=L.mergeCards; rep.mergeCards=GFX.lod.mergeByMaterial(W.group,{cell:1e5, filter:o=>!o.name&&o.parent===W.group&&o.geometry&&o.geometry.type==='PlaneGeometry'&&(o.geometry.index?o.geometry.index.count:9)<=(C.maxTris||2)*3&&o.material&&o.material.blending===THREE.AdditiveBlending&&o.material.transparent}); }
      // --- scenery zones: chunk merged meshes, distance culling, far shadows off
      if(env){ const lod=GFX.lod.manager(Q); rep.zones=lod.zoneEnvironment(env,L.zones); V2.lod=lod; mergedFar.forEach(m=>lod.register(m,{far:L.mergeMaterials.far,shadowFar:L.mergeMaterials.shadowFar})); W.updaters.push(()=>{ if(R.game&&R.game.camera) lod.update(R.game.camera); }); }
      // --- MSAA-friendly foliage edges
      if(Q.postFX&&Q.msaa) W.group.traverse(o=>{ if(o.isMesh&&o.material&&o.material.alphaTest>0) o.material.alphaToCoverage=true; });
      // --- cars: V2 vehicle materials + environment
      const cenv=V2.env||R.env; let nc=0; R.cars.forEach(c=>{ nc+=V2.carsOn()?GFX.vehicles.apply(c,cenv):GFX.vehicles.light(c); }); rep.carMaterials=nc;
      R.cars.forEach(c=>c.model.root.traverse(o=>{ if(o.isMesh&&o.material&&o.material.map&&o.material.transparent&&/shadow/i.test(o.name||'')) o.material.opacity=0.6; }));
      // --- post look
      GFX.post.enable(Object.assign({},L,{haze:Object.assign({},L.haze,L.hazeC),sunDir:L.sunDir}));
      // --- chapter looks (Revolution): blend the per-chapter looks with the course's own chapter system
      if(L.chapters&&W.rev&&typeof revChapterAt==='function') rep.chapters=V2.chapterLooks(R,L,Q,r);
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
    night(R,L,Q,renderer){ const W=R.W, N=L.night, NF=GFX.nightfx, st={}; const env=W.env&&W.env.root;
      // HDR: the course's LED materials are toneMapped:false basics / shaders authored for a 0..1 output; under the
      // HDR post chain they must go above the bloom threshold, or the neon reads as flat paint
      const seen=new Set(); let nb=0, ns=0;
      W.group.traverse(o=>{ const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[]; for(const m of ms){ if(!m||seen.has(m)) continue; seen.add(m);
        if(m.toneMapped===false&&m.isMeshBasicMaterial&&m.color){ m.color.multiplyScalar(m.blending===THREE.AdditiveBlending?(N.hdr.glow||1):(N.hdr.basic||1)); nb++; }
        else if(m.toneMapped===false&&m.isShaderMaterial&&!m.userData.v2hdr){ m.userData.v2hdr=1; const k=(m.blending===THREE.AdditiveBlending?(N.hdr.additive!=null?N.hdr.additive:1):(N.hdr.shader||1)).toFixed(3);   /* additive = halos and the fake road reflection: the wet road now reflects for real */ const fs=m.fragmentShader, j=fs.lastIndexOf('}');
          if(j>0){ m.fragmentShader=fs.slice(0,j)+'\ngl_FragColor.rgb*='+k+';\n'+fs.slice(j); m.needsUpdate=true; ns++; } } } });
      st.hdr={basic:nb, shader:ns};
      // reflections: a night IBL (dark, with HDR neon / sodium / furnace panels)
      if(Q.envLighting&&N.iblSpec){ const e=NF.nightIBL(renderer,N.iblSpec); if(V2.env) V2.env.dispose(); V2.env=e; R.scene.environment=e; R.scene.environmentIntensity=L.ibl.intensity; st.ibl=true; }
      if(N.stripEnv&&env){ const lg=W.neonEnv; env.traverse(o=>{ const m=o.isMesh&&o.material; if(m&&m.isMeshStandardMaterial&&m.envMap&&(!lg||m.envMap===lg)&&!/water/.test(m.name||'')){ m.envMap=null; m.needsUpdate=true; } }); }
      // cluster a mesh's vertices into cells (a mesh may hold many stacks / furnace mouths)
      const clusters=(re,cell)=>{ const C=new Map(); if(!env) return []; const v=new THREE.Vector3(); env.traverse(o=>{ if(!o.isMesh||!re.test(o.name)) return; const pa=o.geometry.attributes.position; o.updateMatrixWorld();
          for(let k=0;k<pa.count;k++){ v.fromBufferAttribute(pa,k).applyMatrix4(o.matrixWorld); const key=Math.floor(v.x/cell)+','+Math.floor(v.z/cell); let c=C.get(key); if(!c){ c={min:v.clone(),max:v.clone()}; C.set(key,c); } else { c.min.min(v); c.max.max(v); } } });
        return [...C.values()]; };
      if(N.glow&&Q.postFX!==false){ const cl=clusters(N.glow.re,N.glow.cell||14); const G=N.glow;
        const g=NF.glowCards(cl.map(c=>{ const s=c.max.clone().sub(c.min); return {pos:[(c.min.x+c.max.x)/2,(c.min.y+c.max.y)/2+1,(c.min.z+c.max.z)/2], size:Math.max(8,Math.max(s.x,s.z)*(G.size||1.6)), color:G.color, intensity:G.intensity, aspect:0.55}; }));
        W.group.add(g); st.glowCards=cl.length; }
      if(N.steam&&(Q.particles||0)>0){ const S=N.steam, em=[];
        clusters(S.re,S.cell||18).forEach(c=>em.push({pos:[(c.min.x+c.max.x)/2,c.max.y,(c.min.z+c.max.z)/2], rate:S.rate, rise:S.rise, life:S.life, size:S.size, color:S.color, alpha:S.alpha, spread:S.spread}));
        if(S.furnace) clusters(S.furnace.re,14).forEach(c=>em.push(Object.assign({pos:[(c.min.x+c.max.x)/2,c.max.y+4,(c.min.z+c.max.z)/2], spread:3},S.furnace)));
        const sys=NF.steam(em,{cap:Math.round(360*(Q.particles||1)), far:560, near:240, wind:[0.8,0.25]});
        if(sys){ W.group.add(sys.points); V2.steam=sys; const r=renderer; W.updaters.push((dt)=>{ const c=R.game&&R.game.camera; if(c) sys.update(Math.min(dt,0.05),c.position,r.domElement.height); }); st.steam=sys.stats; } }
      return st; },
    // one derived look per chapter; per frame: find the chapter blend at the player (or the posed car in a
    // benchmark), interpolate sun / sky / haze / grade / exposure, and switch the IBL at the blend midpoint
    // (pre-baked PMREM per chapter: no PMREM work while racing). Runs after the course's own atmosphere updater,
    // so it has the last word on the lights; fog stays the V2 far-clip fog.
    chapterLooks(R,L,Q,renderer){ const W=R.W, P=R.P, C=L.chapters, ids=Object.keys(C);
      const col=h=>new THREE.Color(h);
      const mk=id=>{ const c=C[id]||{}; const sky=Object.assign({},L.sky,c.sky||{}), sun=Object.assign({},L.sun,c.sun||{}), hz=Object.assign({},L.haze,c.haze||{}), gr=Object.assign({},L.grade,c.grade||{});
        return { sunC:col(sun.color), sunI:sun.intensity, zen:col(sky.zenith), hor:col(sky.horizon), warm:col(sky.warm), gnd:col(sky.ground), clouds:sky.clouds||0, mie:sky.mie||1, hpow:sky.horizonPow||0.5,
          hd:hz.density, hf:hz.falloff, hc:col(hz.color), hs:col(hz.sunColor), exp:c.exposure||L.exposure, ibl:c.ibl!=null?c.ibl:L.ibl.intensity,
          fn:(c.fog||L.fog).near, ff:(c.fog||L.fog).far, sat:gr.saturation, con:gr.contrast, wb:gr.wb.slice(), lift:(gr.lift||[0,0,0]).slice(), bloom:c.bloom!=null?c.bloom:L.bloom.intensity,
          look:Object.assign({},L,{sky,sun,haze:hz,sunDir:L.sunDir}) }; };
      const K={}; ids.forEach(id=>{ K[id]=mk(id); });
      const envs={}; if(Q.envLighting&&R.scene.environment){ ids.forEach(id=>{ envs[id]=GFX.sky.makeIBL(renderer,K[id].look); }); if(V2.env) V2.env.dispose(); V2.env=null; V2.chEnvs=envs; }
      const dome=W.v2Sky&&W.v2Sky.material.uniforms, PL=GFX.post.look||{}; PL.haze=Object.assign({},PL.haze); PL.grade=Object.assign({},PL.grade); PL.bloom=Object.assign({},PL.bloom);
      const tc=new THREE.Color(); const mixC=(out,a,b,t)=>out.copy(a).lerp(b,t); const Ln=(a,b,t)=>a+(b-a)*t;
      let idx=0, lastEnv=null; const st={chapters:ids.length, pmrem:Object.keys(envs).length};
      const findIdx=()=>{ const G=window.GAME, Rc=G&&G.race, pl=Rc&&Rc.player; if(!pl) return idx;
        if(Rc.state==='race'&&pl.pr&&pl.pr.i!=null&&!(GFX.bench&&GFX.bench.active)) return pl.pr.i;
        // posed car (benchmark / intro): nearest sample, searched near the last one first
        let best=idx, bd=1e18; const x=pl.x, z=pl.z; for(let k=0;k<P.N;k++){ const dx=P.x[k]-x, dz=P.z[k]-z, d=dx*dx+dz*dz; if(d<bd){ bd=d; best=k; } } return best; };
      const apply=()=>{ idx=findIdx(); const {cur,nxt,t}=revChapterAt(P,idx); const A=K[cur.id]||K[ids[ids.length-1]], B=(nxt&&K[nxt.id])||A;
        mixC(W.sun.color,A.sunC,B.sunC,t); W.sun.intensity=Ln(A.sunI,B.sunI,t);
        if(W.hemi) W.hemi.intensity=L.hemi||0;
        if(dome){ mixC(dome.skZen.value,A.zen,B.zen,t); mixC(dome.skHor.value,A.hor,B.hor,t); mixC(dome.skWarm.value,A.warm,B.warm,t); mixC(dome.skGround.value,A.gnd,B.gnd,t);
          dome.skSun.value.copy(W.sun.color); dome.skClouds.value=Ln(A.clouds,B.clouds,t); dome.skMie.value=Ln(A.mie,B.mie,t); dome.skHorPow.value=Ln(A.hpow,B.hpow,t); }
        PL.haze.density=Ln(A.hd,B.hd,t); PL.haze.falloff=Ln(A.hf,B.hf,t); if(PL.haze.color&&PL.haze.color.isColor) mixC(PL.haze.color,A.hc,B.hc,t); else PL.haze.color=mixC(new THREE.Color(),A.hc,B.hc,t);
        if(PL.haze.sunColor&&PL.haze.sunColor.isColor) mixC(PL.haze.sunColor,A.hs,B.hs,t); else PL.haze.sunColor=mixC(new THREE.Color(),A.hs,B.hs,t);
        PL.exposure=Ln(A.exp,B.exp,t); PL.grade.saturation=Ln(A.sat,B.sat,t); PL.grade.contrast=Ln(A.con,B.con,t); PL.grade.wb=A.wb.map((v,k)=>Ln(v,B.wb[k],t)); PL.grade.lift=A.lift.map((v,k)=>Ln(v,B.lift[k],t)); PL.bloom.intensity=Ln(A.bloom,B.bloom,t);
        if(W.th) W.th.exposure=1;
        if(W.fog){ const fn=Ln(A.fn,B.fn,t)*(Q.fogMul||1), ff=Ln(A.ff,B.ff,t)*(Q.fogMul||1); W.fog.color.copy(PL.haze.color); W.fog.near=Q.postFX?fn:fn*0.2; W.fog.far=Q.postFX?ff:ff*0.55; }   // also the course's tile cull distance
        const envId=t<0.5?cur.id:(nxt?nxt.id:cur.id); if(envs[envId]&&lastEnv!==envId){ R.scene.environment=envs[envId]; lastEnv=envId; }
        R.scene.environmentIntensity=Ln(A.ibl,B.ibl,t); V2.chapter={id:cur.id, next:nxt&&nxt.id, t:+t.toFixed(2), i:idx}; };
      apply(); W.updaters.push(apply); return st; },
    dress(R,L,Q){ const W=R.W, P=R.P; const ray=new THREE.Raycaster(); const targets=[], rockT=[];
      W.env.root.traverse(o=>{ if(!o.isMesh) return; const nm=o.userData.chunkOf||o.name; if(/rocks|arch/.test(nm)) rockT.push(o); if(!/grass|scrub|cypress|palms|foam|crowd|horizon|rocks|joshua|veg|foliage|bark|water/.test(nm+' '+((o.material&&o.material.name)||''))) targets.push(o); });
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
      if(V2.env){ V2.env.dispose(); V2.env=null; } if(V2.chEnvs){ Object.values(V2.chEnvs).forEach(e=>e.dispose()); V2.chEnvs=null; } V2.chapter=null; const g=window.GAME; if(g&&g.renderer) g.applyQuality(); },
  };
  window.GFX=window.GFX||{}; window.GFX.v2=V2;
})();
