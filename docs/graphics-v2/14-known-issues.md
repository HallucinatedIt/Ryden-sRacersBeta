# Phase 2 · Known issues (not hidden)

1. **No real-device frame times for Graphics V2 yet.** The cloud harness has a software GPU, and the V2
   run on the M4 Mac stalled because the browser pane was hidden (hidden pages pause the render loop).
   Links to run it yourself: 13 · Performance.
2. **Legacy look on r186 is not pixel-identical everywhere.**
   - Pacifica: mean difference 1.5/255 (indistinguishable).
   - Sweet Justice: 2.8/255, Revolution: 6.4/255 (animated flags, smoke, cannon fire and rain differ frame
     to frame, so part of it is time, not rendering).
   - **Neon Foundry**: r128's PMREM gave the dark, emitter-lit wet-road environment much brighter rough
     reflections (the purple wet-road sheen). Found by isolating each light and the env map: with the env
     off, both versions match exactly. Restored with a measured, roughness-weighted compensation
     (`GFX.compat.tagLegacyEnv(env,12)` / `applyLegacyEnv`): the mean difference drops from 15.2 to 5.9/255,
     and the rest is the rain and animated LEDs. It is a calibrated match, not an exact one. Neon should get
     its own V2 look in Phase 3, which removes the compensation.
   - **Showroom/menu**: 4.6/255 (compensation tested and rejected: it made it worse). The difference is
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

## Status after Phase 3 and 4

- 4 (GT40 mask): **fixed in Phase 3** (real Blender slots). 5 (showroom): **still legacy**, tested with slots
  in Phase 4 and left opt-in (22 · Vehicles). 7 (Meshy plants): **fixed in Phase 3** (rebake path, 18).

## Phase 4 known issues

12. **Automatic slot classification misreads premium paints** (Hellcat metallic navy → chrome, black gloss on
    Black Lightning / Concordance / BRCC → glass, White Lightning pearl → chrome). Compensated in the
    per-car profiles so nothing looks wrong, but the slots themselves need a hand pass in Blender.
13. **Showroom slot materials are opt-in** (`?showroomv2=1`): in the unmanaged showroom they read darker
    with a pink cast. Needs the showroom on the V2 path.
14. **Revolution was not measured on a real GPU** (account track; the benchmark pane was not signed in).
    Container counters only.
15. **High / Ultra / mobile presets were not measured on the M4** in Phase 4 (runs interrupted: blur-pause,
    now fixed, and a hidden pane). No real phone measured.
16. **Low preset loses part of the chapter identity on Revolution**: Low has no post chain, so the per-chapter
    grade (Delaware's warm white balance, saturation) does not apply; sun, sky and fog colours still change
    per chapter.
17. **Merge by material coarsens frustum culling** on Alondra (350 m cells): triangles per frame went up
    ~5 % (container: 570k → 606k at the commercial strip) while draws went down 20–30 %. On the M4, V2 Alondra with the merge submits frames ~17 % faster than legacy; on a phone GPU
    with few draws to spare it should be re-checked (`?merge=0` to compare).
18. **The quick container counters for Revolution depend on the course's 0.25 s cull timer**: very short
    benchmark runs (`&frames=4`) can report tiles from the previous shot. Use ≥ 40 frames for counters.
19. **The Meshy Revolution/Alondra batch** (fruit tree, colonial house, butcher stall, timber gate, pines,
    birch, fir, fly agaric, mossy log) was not exported: the Mac bridge kept disconnecting.
20. **No Alondra trees were upgraded**: the env's own low-poly trees remain (Meshy trees need hand-authored
    cards, 18).

## Status after Phase 5

- 12 (slot misclassification): **fixed at the source** for Hellcat, Black Lightning, Concordance, White
  Lightning, BRCC and FDC (27 · Vehicle fixes); compensations removed. Hellcat's windows are only partly glass.
- 13 (showroom): **fixed**: V2 showroom rig, slot materials by default on V2 (28).
- 14, 15 (no real-GPU runs for Revolution / High / Ultra / mobile): **still open** (30). No phone measured.
- 18 (short-run counters): still true; use ≥ 40 frames.
- 19 (Meshy batch): **done**, except the fruit tree (LOD0 rebake came out black) and the dark pine (decimated
  canopy too sparse): both rejected.

## Phase 5 known issues

21. **Neon rain** was not added (readability in the LED tunnel and the chicane); optional.
22. **Revolution cannonball pool and glow sprites** (~65 draws at Yorktown when the artillery fires) are not
    instanced yet (29).
23. **The Neon night IBL is global**: the furnace-orange panel shows in reflections everywhere, not only near
    the furnace (kept dim for that reason). Local reflection probes would fix it.
24. **Neon glow cards** are placed from furnace mesh clusters; a few sit partly over the road edge in the
    furnace section (reads as heat on the wet road).
25. **The showroom** still renders direct (ACES, no post chain); bloom on its neon is not available there.
