# Phase 4K · Neon Foundry Nights: audit for Phase 5 (no changes made)

Track id `neon` (theme `night`, "Harbor Steelworks"). Phase 4 did **not** touch it: on the V2 pipeline it
still renders with the legacy look (`GFX.v2.LOOKS` has no `neon`), through r186 with the compat layer.
This is what a Phase 5 "Neon Foundry V2" has to work with.

## What is there

| | |
|---|---|
| env | `models/env/env_neon.glb`, 8.7 MB, 60 meshes / 105 primitives, **has vertex normals** (unlike Alondra and Revolution) |
| textures | 14 JPEG/PNG, ~2.3 MB: `maximus_face` 608 KB, `signs_nf` 490 KB, `gantry_atlas` 439 KB, `asphalt_wet` 206 KB, `mvm_title` / `mvm_art` ~290 KB, the rest < 110 KB |
| materials | 42, of which **22 emissive** (LED strips, arches, chevrons, furnace, signs, windows) |
| custom shaders | `neonMaterials()` in `game.js`: animated LED arch procession, route-guidance chase pulses on the barriers, scrolling chevrons, breathing furnace mouths, additive glow cards, a reflection band under the arch (`m_refl_arch`), and its own env map (`neonEnvMap`) |
| cost today (container counters, Medium, one frame at the start) | **79 draws, 151 k triangles, 46–53 programs** — the lightest track in the game |

## What V2 would change, and the risks

1. **This is the one track where bloom is the look.** Pacifica/Mojave/Alondra use bloom at 0.045–0.06; a
   night track wants ~0.25–0.4 with a lower threshold, and the LED materials are `MeshBasicMaterial`
   with `toneMapped:false` — they bypass exposure entirely. Under the V2 post chain (HDR target, Neutral
   tone mapping) they must become emissive HDR values (intensity > 1) so bloom picks them up and tone mapping
   treats them consistently. **Risk:** every LED colour was tuned by eye for the legacy unmanaged pipeline;
   they will all shift and have to be re-tuned one by one.
2. **Wet asphalt.** `asphalt_wet` is a flat texture. The V2 road (`GFX.road`) can do rubber, dust and
   bleach but not wetness. Needed: low roughness with puddle masks, and reflections of the LED arches.
   Screen-space reflections are out of scope (no WebGPU, cost); the cheap route is the existing
   `m_refl_arch` idea generalised: a planar-reflection-free fake (emissive smears under each light source,
   stretched along the view). Worth prototyping before committing.
3. **Night sky and IBL.** The V2 sky model is a daylight sky (Rayleigh-ish gradient + sun disk). A night look
   needs a dark sky with light-pollution glow at the horizon and furnace orange low in one direction; the IBL
   should come from the neon itself (the legacy `neonEnvMap` is already that: keep it, tag it for r186).
   The "sun" becomes a weak cool moon / sodium key for shadows.
4. **Shadows.** Night scenes read through light pools, not sun shadows. Many small lights are not affordable
   as real lights; the existing light cards + a single key shadow is the right budget. Decide if shadows are
   needed at all (a big saving on mobile).
5. **Draw calls are not the problem here** (79). Programs are: the custom neon shaders + V2 variants could
   push the program count past 100 and first-load compile is the hitching risk. Use the Phase 3 prewarm
   (`GFX.renderer.prewarm`) and keep the neon shader variants few.
6. **Emissive signage** (`maximus_face`, `gantry_atlas`, `signs_nf`) should go UASTC in a KTX2 variant (text),
   the rest ETC1S, like Alondra (`tools/optimize_env.sh`). Expect ~8.7 → ~6 MB.

## Recommended Phase 5 order

1. KTX2/Meshopt variant (low risk, measurable).
2. `LOOKS.neon` with a night sky, the existing neon env as IBL, bloom 0.3, Neutral/AgX tone mapping; convert
   the LED `MeshBasicMaterial`s to HDR emissive; re-tune colours against legacy screenshots.
3. Wet road: roughness + puddle mask in `GFX.road`, fake light smears.
4. Benchmark scene `?bench=neon` (LED straight, foundry weave, canal jump, arena chicane, the grandstands).
5. Only then dressing (containers, forklifts, steam vents as instanced props) — the track is already busy.
