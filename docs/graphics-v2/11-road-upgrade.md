# Phase 2 · Road upgrade report (Pacifica)

The Blender road mesh (`pc_road`, material `m_asphalt`) and its albedo texture are kept. Everything
below is added on top by `js/gfx/road.js` and `js/gfx/decals.js`, and only on the V2 look.

## Asphalt (layered material)

| Layer | How | Why |
|---|---|---|
| **Aggregate normal detail** | A 512² tiling normal map generated at load (layered value noise plus about 5,000 rounded "pebbles"), tiled every 1.4 m using the mesh's measured metres-per-UV | The low sun catches the stone texture; the road stops reading as a flat colour |
| **Roughness variation** | A matching generated roughness map (cavities rougher) | Highlights break up realistically instead of a uniform sheen |
| **Macro variation** | World-space noise at about 12 m and 50 m scales (±12 % brightness) plus warm/cool patches | Removes visible texture repetition at racing speed |
| **Rubber** | Two tyre lanes that follow the **AI racing line** (`analyzeTrack().line`) through every corner, 0.8 m either side of it: darker (−22 %) and smoother (−28 % roughness), broken up by noise | The road shows where cars actually drive |
| **Edge wear** | Dust tint and extra roughness from 78 % of the half-width to the edge | The edge looks driven-over and dusty; the transition into the shoulder is softer |
| **Albedo lift** | ×1.3 | The legacy asphalt texture was authored dark for the old lighting; under physical light it read almost black |
| **Environment response** | `envMapIntensity 0.3` | A little sky reflection at grazing angles, without turning the road blue |

Per-vertex data (`aRoad`: lateral position, racing-line offset, half-width) is computed once from the
track path, so the cost in the shader is a few texture taps.

## Lane paint

`m_line_w` / `m_line_y`: noise-driven wear (up to 55 % towards the asphalt colour), roughness 0.62
(smoother than asphalt). The double yellow looks painted and weathered rather than like a flat decal.

## Decals (`js/gfx/decals.js`)

One generated 1024² atlas (crack, crack network, tar snake, patch, oil, braking marks, dirt smear,
gravel spill, edge grit, faded arrow). Decals are strips of quads that follow the centreline and sit on
the **real road surface**: a spatial grid of the road mesh triangles gives the height at any x, z. The
whole lap merges into **two meshes** (matte + glossy), so the whole lap is **2 draw calls and about 7,400 triangles**.

Placement follows rules, not random scatter (seeded per track, identical every run):

- **Braking marks and oil**: 26–44 m before each of the 9 tight corners (curvature > 1/85 m), on the
  racing line, 10–22 m long.
- **Dirt**: on the outside of each corner exit.
- **Patches** about every 170 m, **tar snakes** about every 55 m, **cracks** about every 40 m, in the lanes.
- **Edge grit**: continuous strips on both edges, from 0.8 m inside the edge to 1.4 m onto the shoulder.

The atlas is extendable: add a cell and a drawing function (arrows, race markings, graffiti,
track-specific details are prepared). Decals switch off with the tier setting `decals`.

## Shoulder / terrain transition

- The edge-grit decal strip blends asphalt into the shoulder (gravel and dust spill both ways).
- Ground (`m_ground`), rock (`m_coast_rock`) and concrete get world-space detail (V2 `detail` rule): macro
  colour drift, slope-based tint, strata bands on the cliffs, and the aggregate normal map at a larger scale.
- Near the car, GTAO darkens the contact between the road and the guardrail bases, curbs and cliff foot.

## Not done (Phase 3)

- A real asphalt texture set (albedo, normal, roughness) authored in Blender, instead of the generated
  detail on the legacy albedo.
- Puddles and wet-road response (Neon Foundry will need it).
- Skid marks from gameplay already exist (`Skids`); they are not yet lit by the V2 material (they stay
  unlit black quads).
