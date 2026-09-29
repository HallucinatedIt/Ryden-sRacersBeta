# Phase 3 recommendation

Based on what Phase 2 showed on Pacifica, in order.

## 1. Real-device numbers first (half a day)
Run the benchmark on the M4 Mac and the phone you race on (Low, Medium, High), OLD and V2. Set the
phone's default tier from that, and switch `GFX.settings.recommended()` on for the first run. Everything
below is budgeted against those numbers.

## 2. Roll the V2 look out track by track (biggest visible win per hour)
The pipeline is done; each track now needs a look (sun, sky, haze, grade, material rules), about one day per track:
- **Mojave Mesa Run** first: a daylight desert, the closest to Pacifica, and it reuses the sky, road
  and rock detail directly.
- **Alondra Blvd / Sweet Justice**: city daylight; add facade-glass reflections (IBL already supports it).
- **Revolution**: per-chapter looks (the chapter atmosphere table maps directly onto look parameters).
- **Neon Foundry** last, as its own project (see 5).
When every track has a look, the legacy compensation code (`applyLegacyEnv`, `legacyUVTransforms`) can go.

## 3. Vehicle material pass (all 20 cars)
Split each Meshy car into material slots in Blender (paint / glass / rubber / chrome / lights / interior).
Then give each car a profile (the duck gets glossy rubbery paint, the fish car scales and a wet sheen,
the police car a metallic flake, the luxury car deep metallic plus chrome). Add emissive lights that
bloom. The showroom switches to the V2 look at the same time (it becomes the car showcase).

## 4. Asset pipeline for vegetation
Palms, cypress, heather, ferns: retopologised or card-based LODs with a shared wind shader (the
Revolution foliage sway, generalised) and instancing. This is what makes Pacifica's hills feel planted
rather than scattered. Then, per track, 20–30 intentional placements like the Pacifica overlook.

## 5. Neon Foundry overhaul
Night is a different lighting problem: many local lights, a wet road, emissive everything. Plan:
screen-space or probe reflections for the wet road (the `reflections` knob), a local-light budget
(`localLights`), bloom tuned for neon, and rain that interacts with the road.

## 6. Road texture set and more decals
An authored asphalt set (albedo, normal, roughness) per road type, puddles for wet tracks, and
track-specific markings (the decal atlas is ready: Revolution cobbles and ruts, Neon painted arrows).

## 7. Weather and time of day (later)
The look system can blend two looks. That makes a dusk variant of Pacifica, or rain on Alondra, a data
task on top of the sky/haze parameters, not new rendering work.

## Not recommended yet
WebGPU/TSL. WebGL2 on r186 is stable and fast enough for everything above; a WebGPU port would mean
rewriting every custom shader for no visual gain at this stage.
