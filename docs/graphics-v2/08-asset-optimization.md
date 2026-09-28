# Phase 2 · Asset optimization report

## What was optimized in Phase 2

| asset | before | after | how |
|---|---|---|---|
| `models/env/env_coast.glb` (Pacifica environment) | 11.8 MB, 13 JPEG textures (~75 MB of GPU memory as RGBA8) | **`env_coast.v2.glb` 9.2 MB**; textures KTX2 (UASTC for signage/asphalt, ETC1S for the rest); geometry Meshopt | `tools/optimize_env.sh`. Tested in game (all 13 textures load as compressed textures, alpha foam and sRGB colour kept). The original is untouched and still loads on `?gfx=legacy` / `?origassets` |
| `mx_picnic_table` (Meshy) | 9,998 tris, 3 × 2048² | **4,000 / 917 tris (LOD0 / LOD1)**, 512² KTX2, 0.57 MB | Blender (Decimate, real 0.8 m height, base at the origin) → `tools/prop_lod.mjs` → KTX2 + Meshopt |
| `mx_trash_can` (Meshy) | 29,996 tris, 3 × 2048² | **3,000 / 758 tris**, 512² KTX2, 0.5 MB | same |
| `mx_corvette_grand_sport` (Meshy) | 1,439,181 tris, 3 × 2048² | **22,256 / 5,138 tris**, 1024² KTX2, 2.3 MB | same; LOD1 needed meshopt's "sloppy" simplifier (see below) |

The three props are in `models/props/pc_*.glb` and are placed on Pacifica by the look (see 09 · Pacifica).

## Findings that need Blender work

**Meshy meshes are made of thousands of loose islands, with UVs in a "chart soup" atlas.** Two
consequences for every Meshy asset:

1. Blender's Decimate (collapse) stops at roughly 12–22k triangles no matter how low the ratio is,
   because every island keeps its border. The heather came out at 12,721 triangles (target 2,000), so it
   was **not** placed. Plants need **retopology** or a **card/impostor** rebuild, not a decimate.
2. The topology-preserving simplifier cannot collapse across UV seams either. For a distant LOD1, the
   sloppy simplifier works (it keeps existing vertices, so the texture still maps). For LOD0 on hero
   assets, the right fix is retopology plus a normal-map bake from the high-poly Meshy mesh.

**Materials:** every Meshy asset is one material with a baked atlas. Cars especially need separate
material slots (paint / glass / rubber / chrome / lights). The GT40 uses an auto-generated material-ID
mask in the meantime (`tools/car_matid.py`, see 10 · GT40). Recommended Blender pass per car: select by
atlas region → separate materials, or paint an ID map.

## Heavy assets already in the game (measured)

| asset | triangles | note |
|---|---|---|
| `rrsign.glb` (Ryden's Racers sign) | 133,315 | one sign costs half of a whole track; decimate to ~15k + normal bake |
| `grandstand.glb` | 99,468 per copy | placed several times: this is why Sweet Justice draws **1.09 M triangles**; decimate to ~15k, LOD1 5k |
| `rv_heroes.glb` · Washington | 69,999 | hero statue; LOD1 needed (only seen up close at one spot) |
| `range_sign.glb`, `mrblack.glb`, `church.glb`, `knives.glb`, `rv_props` galleon/inn, `watch_shop` | 25–32k each | LOD1 at ~25% |
| `env_mesa.glb` terrain | 57k | fine for terrain; chunk it like Pacifica (GFX.lod) |

## Meshy inbox (32 models, not yet in the game): what each one needs

Triangle counts are measured in Blender; targets come from the catalog (`models/catalog.json`).

| asset | category | triangles now | target | ratio | tracks | needs |
|---|---|---|---|---|---|---|
| mx_red_hot_poker_shrub | vegetation | 5,202,045 | 3,000 | 1734× | coast, sweet | retopology (or heavy decimate + normal-map bake); card/impostor LOD2; LOD1 (~25%); textures 2048 → 512 |
| mx_fly_agaric | vegetation | 3,245,387 | 2,000 | 1623× | revolution, country | retopology (or heavy decimate + normal-map bake); card/impostor LOD2; LOD1 optional; textures 2048 → 512 |
| mx_mossy_log | vegetation | 3,358,591 | 3,000 | 1120× | revolution, country | retopology (or heavy decimate + normal-map bake); card/impostor LOD2; LOD1 (~25%); textures 2048 → 512 |
| mx_heather | vegetation | 1,563,224 | 2,000 | 782× | coast, revolution | retopology (or heavy decimate + normal-map bake); card/impostor LOD2; LOD1 optional; textures 2048 → 512 |
| mx_generator_compressor | infrastructure | 2,930,188 | 4,000 | 733× | neon, mesa, alondra | retopology (or heavy decimate + normal-map bake); LOD1 (~25%); textures 2048 → 512 |
| mx_red_lily | vegetation | 849,592 | 1,500 | 566× | sweet, alondra | retopology (or heavy decimate + normal-map bake); card/impostor LOD2; LOD1 optional; textures 2048 → 512 |
| mx_fruit_tree | vegetation | 8,243,129 | 15,000 | 550× | sweet, alondra, coast | retopology (or heavy decimate + normal-map bake); card/impostor LOD2; LOD1 (~25%); textures 2048 → 1024 |
| mx_fern | vegetation | 1,318,231 | 2,500 | 527× | revolution, coast, country | retopology (or heavy decimate + normal-map bake); card/impostor LOD2; LOD1 optional; textures 2048 → 512 |
| mx_ac_condenser | infrastructure | 931,630 | 2,000 | 466× | alondra, sweet, neon | retopology (or heavy decimate + normal-map bake); LOD1 optional; textures 2048 → 512 |
| mx_iron_spike_fence | infrastructure | 769,860 | 2,000 | 385× | alondra, sweet | retopology (or heavy decimate + normal-map bake); LOD1 optional; textures 2048 → 1024 |
| mx_graffiti_brick_wall | infrastructure | 684,755 | 2,000 | 342× | alondra, sweet, neon | retopology (or heavy decimate + normal-map bake); LOD1 optional; textures 2048 → 1024 |
| mx_fir_tree | vegetation | 2,788,067 | 12,000 | 232× | revolution, country, coast | retopology (or heavy decimate + normal-map bake); card/impostor LOD2; LOD1 (~25%); textures 2048 → 1024 |
| mx_birch_tree | vegetation | 2,509,704 | 12,000 | 209× | country, revolution | retopology (or heavy decimate + normal-map bake); card/impostor LOD2; LOD1 (~25%); textures 2048 → 1024 |
| mx_dark_pine | vegetation | 1,959,040 | 10,000 | 196× | revolution, mesa | retopology (or heavy decimate + normal-map bake); card/impostor LOD2; LOD1 (~25%); textures 2048 → 1024 |
| mx_palm_tree | vegetation | 2,290,928 | 12,000 | 191× | coast, sweet, alondra | retopology (or heavy decimate + normal-map bake); card/impostor LOD2; LOD1 (~25%); textures 2048 → 1024 |
| mx_timber_gate | infrastructure | 939,906 | 6,000 | 157× | revolution, country | retopology (or heavy decimate + normal-map bake); LOD1 (~25%); textures 2048 → 1024 |
| mx_ice_freezer | infrastructure | 429,706 | 3,000 | 143× | mesa, sweet, alondra | retopology (or heavy decimate + normal-map bake); LOD1 (~25%); textures 2048 → 512 |
| mx_adobe_pueblo | building | 1,581,785 | 12,000 | 132× | mesa | retopology (or heavy decimate + normal-map bake); LOD1 (~25%); textures 2048 → 1024 |
| mx_butcher_stall | hero_prop | 797,096 | 8,000 | 100× | revolution | retopology (or heavy decimate + normal-map bake); LOD1 (~25%); textures 2048 → 1024 |
| mx_metal_stairs | infrastructure | 181,334 | 2,500 | 73× | neon | retopology (or heavy decimate + normal-map bake); LOD1 optional; textures 2048 → 512 |
| mx_rat_rod | decorative_vehicle | 1,697,217 | 25,000 | 68× | mesa, country, neon | retopology (or heavy decimate + normal-map bake); LOD1 (~25%); textures 2048 → 512 |
| mx_ibex | hero_prop | 509,143 | 8,000 | 64× | mesa | retopology (or heavy decimate + normal-map bake); LOD1 (~25%); textures 2048 → 512 |
| mx_corvette_grand_sport | decorative_vehicle | 1,439,181 | 25,000 | 58× | coast, sweet | retopology (or heavy decimate + normal-map bake); LOD1 (~25%); textures 2048 → 512 |
| mx_blown_muscle_sedan | decorative_vehicle | 858,473 | 15,000 | 57× | alondra, sweet | retopology (or heavy decimate + normal-map bake); LOD1 (~25%); textures 2048 → 512 |
| mx_atm | infrastructure | 164,141 | 3,000 | 55× | alondra, sweet | retopology (or heavy decimate + normal-map bake); LOD1 (~25%); textures 2048 → 512 |
| mx_brick_colonial_house | building | 760,204 | 15,000 | 51× | revolution | retopology (or heavy decimate + normal-map bake); LOD1 (~25%); textures 2048 → 1024 |
| mx_panel_truck | decorative_vehicle | 694,483 | 15,000 | 46× | alondra, neon, sweet | decimate; LOD1 (~25%); textures 2048 → 1024 |
| mx_trash_can | infrastructure | 29,996 | 3,000 | 10× | sweet, alondra, coast, neon | decimate; LOD1 (~25%); textures 2048 → 512 |
| mx_banana_plant | vegetation | 21,462 | 8,000 | 3× | sweet, alondra, coast | LOD1 (~25%); textures 2048 → 1024 |
| mx_charred_stump | vegetation | 9,769 | 9,769 | 1× | revolution, mesa | LOD1 (~25%); textures 2048 → 512 |
| mx_dumpster | infrastructure | 9,420 | 9,420 | 1× | alondra, sweet, neon, mesa | LOD1 (~25%); textures 2048 → 512 |
| mx_picnic_table | infrastructure | 9,998 | 9,998 | 1× | coast, mesa, country | LOD1 (~25%); textures 2048 → 512 |


## The pipeline, as used in Phase 2

1. **Blender** (`meshy_inbox.blend` or the open scene; the source object is never modified): copy the
   object, Decimate to the LOD0 target, scale to the real height from the catalog, put the origin at the
   base centre, copy the material with textures downscaled (512 for small props, 1024 for vehicles), and
   export a GLB with LOD0 + a second copy for LOD1. Output: `~/Documents/RydensRacers-Blender/pacifica_dressing/`.
2. `node tools/prop_lod.mjs in.glb out.glb <ratio> <error>`: weld, simplify LOD1 (sloppy fallback), name
   the nodes `lod0`/`lod1`.
3. `gltf-transform resize` → `uastc` (normal maps) → `etc1s` (base colour, metal/roughness) → `meshopt`.
4. Place it in the track's look (`LOOKS.<track>.dressing`): track sample, lateral offset, yaw. The game
   builds a `THREE.LOD` and registers it for distance culling.
