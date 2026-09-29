# Phase 2 · Known issues (not hidden)

1. **No real-device frame times for Graphics V2 yet.** The cloud harness has a software GPU, and the V2
   run on the M4 Mac stalled because the browser pane was hidden (hidden pages pause the render loop).
   Links to run it yourself: 13 · Performance.
2. **Legacy look on r186 is not pixel-identical everywhere.**
   - Pacifica: mean difference 1.5/255 (indistinguishable).
   - Sweet Justice: 2.8/255, Revolution: 6.8/255 (animated flags, smoke, cannon fire and rain differ frame
     to frame, so part of it is time, not rendering).
   - **Neon Foundry**: r128's PMREM gave the dark, emitter-lit wet-road environment much brighter rough
     reflections (the purple wet-road sheen). Found by isolating each light and the env map: with the env
     off, both versions match exactly. Restored with a measured, roughness-weighted compensation
     (`GFX.compat.tagLegacyEnv(env,12)` / `applyLegacyEnv`): the mean difference drops from 15.2 to 6.3/255,
     and the rest is the rain and animated LEDs. It is a calibrated match, not an exact one. Neon should get
     its own V2 look in Phase 3, which removes the compensation.
   - **Showroom/menu**: 4.4/255 (compensation tested and rejected: it made it worse). The difference is
     small and mostly in the animated neon strips.
3. **Races are not deterministic**, not even OLD vs OLD with a fixed random seed (the simulation
   takes wall-clock input). So gameplay parity was verified by a code diff instead: the only `game.js`
   changes are graphics hooks (`GFX.v2.begin/finish/end`, compat calls for colour space and light units,
   the loader hook). Physics, AI, laps, items and UI code are untouched. Full seeded races on Pacifica
   finish normally on both pipelines, with lap times in the same range (33–37 s).
4. **V2 materials on the GT40 use an automatic material-ID mask** (10 · GT40). It cannot separate black
   paint from black trim, and head/tail lights are not their own material. Needs a Blender material split.
5. **The showroom (garage) is still the legacy look.** The GT40's V2 materials appear only on Pacifica.
6. **WebGL1-only devices get r128 + the legacy look** (no V2). This is intended; they are rare (very old iOS/Android).
7. **The Mac-only Meshy plants** (heather, red-hot poker, palms, ferns) were not placed: Blender's Decimate
   cannot bring them to budget (08 · Assets). Pacifica's dressing is three props (six placements).
8. **Decals near the start/finish**: the braking-zone logic can put braking marks and oil on the grid
   area if a tight corner follows the start. Not the case on Pacifica. Watch for it on other tracks.
9. **Dynamic resolution** only runs on touch devices (or `?drs=1`) and has not been tested on a real phone yet.
10. **Tag pushes are refused by the environment's git proxy**, so the rollback point is a branch,
    `graphics-v2-phase1-rollback`, not a tag.
11. **Old skid marks** (gameplay `Skids`) are unlit black quads. On the V2 road they read slightly flatter
    than the decal braking marks.
