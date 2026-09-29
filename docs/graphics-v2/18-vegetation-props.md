# Phase 3 · Vegetation and props (Meshy → game)

Phase 3 added a pipeline that turns Meshy source models into browser-ready props with LODs, and two ways
to put them in a track: **dressing** (one-off placements with a story) and **scatter** (instanced plants and
repeated street objects). Phase 4 used the same pipeline for Alondra and the Revolution palisade.

## Pipeline: `tools/blender/rr_prop_pipeline.py`

```
python3 tools/blender/rr_prop_pipeline.py SRC.glb OUT.glb --height 1.3 --lods 3000,900,250 --tex 512 [--impostor] [--rebake auto|always|never]
tools/optimize_prop.sh OUT.glb models/props/<id>.glb        # KTX2 (ETC1S) textures + Meshopt geometry
```

1. import, join, **weld** (Meshy splits every UV chart into its own island; welding is what lets Decimate work),
   delete loose junk (< 0.05 % of the area), remove degenerate faces, recalculate normals;
2. **real-world scale** (`--height` in metres), origin at the base centre, glTF +Y up. The scale lives on the
   `lod*` nodes (the geometry is quantized by Meshopt), so every consumer must keep the node transform.
   (Phase 4 fixed `GFX.scatter.levelsOf`, which dropped it: instanced props rendered at a unit size of 2 m.
   Dressing, which clones the nodes, was always right);
3. **LODs** by Decimate to each triangle target; if Decimate stalls on "chart soup" the LOD is rebuilt
   (UV-less decimate → Smart UV → bake the base colour). `--rebake always` forces this; use it when the
   LOD sheet (`tools/blender/rr_lod_sheet.py`) shows a smeared texture that the triangle count cannot reveal;
4. optional **impostor** (`--impostor`): the albedo rendered from 3 directions into an alpha atlas, rebuilt as
   3 crossed quads (6 triangles). The game lights the cards with a mostly-up normal, so they match LOD0;
5. textures to `--tex`, export one GLB with nodes `lod0`, `lod1`, `lod2`, `lodImp`.

## Using props in a look (`js/gfx/v2.js`)

| | `dressing` | `scatter` |
|---|---|---|
| what | a scene with a reason: the rest stop, the abandoned car, the precinct lot | many copies: plants, bins, parked cars, roof units |
| draws | 1 `THREE.LOD` per placement | 1 `InstancedMesh` per part per LOD level for **all** copies |
| placement | `{asset, i, lat, yaw}`, dropped onto the first surface under it | random (`count`, `band`, `section`, `cluster`) or explicit (`points`, `line`) |
| LOD | THREE.LOD per object | distance + frustum bucketing every 3 frames |
| density preset | `propDensity` | `vegDensity` (`thin:true` rules drop copies at low density) |

`i` is a track sample, `lat` metres right of the centreline, `yaw` relative to the track direction. Meshy
vehicles are long along X (yaw 0 = nose-in to the road); the Phase 4 cruisers are built from the game cars
and are long along Z.

## Assets (all KTX2 ETC1S textures + Meshopt geometry)

| asset | KB | LOD0 | LOD1 | LOD2 | impostor | used on |
|---|---|---|---|---|---|---|
| `pc_heather` | 224 | 1628 | 327 | – | 6 | Pacifica |
| `pc_redhot` | 68 | – | – | – | 6 | Pacifica, Mojave |
| `pc_fern` | 129 | 1240 | 279 | – | 6 | Pacifica |
| `pc_banana` | 249 | 2999 | 798 | – | 6 | Pacifica, Alondra |
| `pc_palm` | 544 | 4439 | 966 | – | 6 | Pacifica, Mojave |
| `pc_picnic_table` | 555 | 4000 | 917 | – | – | Pacifica, Mojave |
| `pc_trash_can` | 492 | 3000 | 758 | – | – | Pacifica, Mojave, Alondra |
| `pc_corvette_gs` | 2223 | 22256 | 5138 | – | – | Pacifica, Alondra |
| `mz_adobe_pueblo` | 1310 | 11989 | 3310 | 863 | – | Mojave |
| `mz_charred_stump` | 348 | 2760 | 657 | – | – | Mojave |
| `mz_dumpster` | 170 | 3000 | 899 | 247 | – | Mojave, Alondra |
| `mz_generator` | 260 | 3737 | 1311 | 279 | – | Mojave, Pacifica |
| `mz_ibex` | 225 | 5000 | 1500 | 450 | – | Mojave |
| `mz_ice_freezer` | 195 | 2770 | 852 | 236 | – | Mojave, Pacifica |
| `mz_muscle_sedan` | 1015 | 11996 | 3995 | 1145 | – | Mojave, Alondra |
| `mz_panel_truck` | 886 | 11999 | 3998 | 1198 | – | Mojave, Pacifica, Alondra |
| `mz_rat_rod` | 841 | 11571 | 3748 | 1072 | – | Mojave, Alondra |

Phase 4 additions are in `20-phase4-assets.md`.

## What the pipeline cannot do

- It cannot tell a good texture from a smeared one after Decimate: look at the LOD sheet.
- Meshy's hidden interior shells are removed only when they are separate islands.
- Tree canopies from Meshy are solid blobs; the impostor path is fine for shrubs and flowers, but big trees
  need hand-authored cards (not done).
