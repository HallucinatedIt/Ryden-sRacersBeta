# Phase 4F/G · Assets: optimization table and density

## New props (Meshy → `tools/blender/rr_prop_pipeline.py` → `tools/optimize_prop.sh`)

All: KTX2 (ETC1S) textures, Meshopt geometry, real-world scale on the `lod*` nodes.

| asset | source | KB | LOD0 | LOD1 | LOD2 | impostor | notes | used |
|---|---|---|---|---|---|---|---|---|
| `ab_police_cruiser` | the game's BPD 69 GLB (decorative copy) | 660 | 4989 | 1442 | 422 | – | BPD 69 stays a playable car; this copy has no wheels to spin, no slots | Alondra precinct lot, traffic stop |
| `ab_donut_cruiser` | the game's Donut Patrol GLB (decorative copy) | 690 | 4966 | 1411 | 406 | – | idem | Alondra precinct lot, donut break |
| `ab_atm` | Meshy | 251 | 2499 | 685 | 196 | – | | Alondra storefronts |
| `ab_ac_unit` | Meshy | 115 | 1780 | 490 | 141 | – | | Alondra roofs |
| `ab_red_lily` | Meshy | 61 | – | – | – | 6 | impostor only (`--lods none`): a flower bed never needs geometry | Alondra yards (351) |
| `ab_graffiti_wall` | Meshy | 315 | 1989 | 600 | 160 | – | LOD0 was smeared by Decimate → `--rebake always`. Still reads as a dark smear at street distance: **rejected** (not placed) | – |
| `rv_palisade` | Meshy ("iron spike fence" prompt; the model is a wooden stake palisade, which suits 1775 better) | 92 | 1467 | 356 | – | – | 4 m sections, 2 m stakes. Tried along Bunker Hill and Yorktown: hidden behind the course's own barriers and hay walls from the road at every placement tested (lat 15 / 23, ×1.35 scale), so **not placed** | – |

Reused from Phase 3 on Alondra: `mz_muscle_sedan`, `pc_corvette_gs`, `mz_rat_rod`, `mz_panel_truck`,
`mz_dumpster`, `pc_trash_can`, `pc_banana` (table in `18-vegetation-props.md`).

**Meshy batch not processed:** fruit tree, brick colonial house, butcher stall, timber gate, dark pine,
birch, fir, fly agaric, mossy log (from the Blender library file on the Mac). The export needs the Mac
bridge; it disconnected repeatedly during Phase 4 and the export did not finish. The pipeline command for
each is ready (`--height` per asset in the export log); they are a Phase 5 item for Revolution woods
(Saratoga) and Alondra yards.

## Environment variants

| file | original | V2 variant | textures |
|---|---|---|---|
| `env_coast.v2.glb` (Phase 2) | 11.8 MB | 9.2 MB | |
| `env_mesa.v2.glb` (Phase 3) | 14.2 MB | 10.1 MB | |
| `env_alondra.v2.glb` | 16.2 MB | **11.8 MB** | UASTC: signs, shop fronts, gantry, asphalt · ETC1S: murals, tags, event, everything else |
| `env_revolution.v2.glb` | 24.0 MB | **14.4 MB** | UASTC: signs, facades · ETC1S: everything else (incl. the 1.6 MB foliage PNG) |

Scene texture memory (transcoded, `GFX.materials.stats`): Alondra 259 → 134 MB; Revolution 293 MB legacy →
243 MB V2 **including** the 7 chapter PMREMs.

## Cars

Slot variants (`*.v2.glb`) for all 14 GLB cars. Size change: +2 KB each (index lists), except General Lee
(−142 KB) and White Lightning (−240 KB), where `prune` dropped an unused duplicate texture. Geometry byte
for byte identical (see `22-vehicles-phase4.md`).

## Density per preset (4G)

| | Low | Medium | High / Ultra | mobile Medium |
|---|---|---|---|---|
| `propDensity` (dressing, wall art count) | 0.6 | 0.85 | 1 | 0.85 |
| `vegDensity` (scatter; `thin:true` rules drop copies) | 0.45 | 0.8 | 1 | 0.55 |
| Alondra wall-art quads (max 140 × propDensity, min 35 %) | 84 | 119 | 140 | 119 |
| Alondra instanced props (bins, lilies, bananas, AC: `thin`) | ~45 % | ~80 % | all | ~55 % |
| parked cars, cruisers, dumpsters, ATMs (not thin: they are the story) | all | all | all | all |

The story pieces (the precinct lot, the traffic stop, the delivery van) are never thinned: a lower preset
removes clutter, not the scenes.

## Phase 5 additions (Meshy batch, exported from the Mac)

| asset | KB | LOD0 | LOD1 | LOD2 | impostor | textures | format | geometry |
|---|---|---|---|---|---|---|---|---|
| `rv_birch` | 216 | 1694 | 418 | - | 6 | 3 | ktx2 | meshopt |
| `rv_butcher_stall` | 225 | 2998 | 892 | 226 | - | 3 | ktx2 | meshopt |
| `rv_colonial_house` | 665 | 5999 | 1799 | 499 | - | 3 | ktx2 | meshopt |
| `rv_fir` | 232 | 2151 | 544 | - | 6 | 3 | ktx2 | meshopt |
| `rv_fly_agaric` | 32 | 446 | 105 | - | - | 2 | ktx2 | meshopt |
| `rv_mossy_log` | 83 | 1432 | 424 | - | - | 2 | ktx2 | meshopt |
| `rv_timber_gate` | 352 | 1999 | 598 | 177 | - | 4 | ktx2 | meshopt |

Rejected: `ab_fruit_tree` (the LOD0/LOD1 rebake came out black; only the impostor was usable) and
`rv_dark_pine` (the decimated canopy is too sparse). Placement: `21-revolution-v2.md` / `31-phase5-report.md`.
