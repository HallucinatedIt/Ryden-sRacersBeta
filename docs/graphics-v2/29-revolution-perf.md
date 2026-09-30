# Phase 5C · Revolution: Yorktown / mobile draw calls

Target: the Yorktown wide shot on the phone profile (`?bench=revolution&tier=medium&mobile=1`), ~410 draws
per frame in Phase 4. Rule: nothing the player can see changes; remove invisible and redundant work first.

## Where the draws went (Phase 4, Yorktown wide, mobile Medium)

Measured by `test/ytprof.js`: the benchmark pose, then every visible, in-frustum draw grouped by object.

| group | draws | what it is |
|---|---|---|
| far vegetation tiles (`rv_veg_far_*`) | **68** | 34 terrain tiles × 2 materials (foliage + bark), each a separate draw, many 1–2 km away |
| light-shaft cards (unnamed, 2-tri planes, additive) | **39** | the course's crossed sun-shaft cards over the drag strip: 18 pairs, one draw each |
| glow sprites | 35 | lantern / cannon glows (sprites, 2 tris) |
| near vegetation tiles | 30 | foliage + bark, shadow casters |
| cannonball pool | 32 | 16 balls + 16 glow shells in flight (dynamic) |
| buildings (all chapters) | ~35 | visible through the fog range from Yorktown |
| terrain, road, shoulders, water, barriers, portals, flags, troops (instanced) | the rest | |

Troops are already instanced with three distance tiers and only the near tier casts shadows; smoke is two
`THREE.Points` systems with capped counts; neither was a problem.

## What changed

1. **Far vegetation merged by material per 700 m cell** (`GFX.lod.mergeByMaterial`, `mergeMaterials` in
   `LOOKS.revolution`): 156 far-vegetation meshes → 24 chunks. The course used to cull these tiles by
   the fog distance one by one; the merged chunks are distance-culled as chunks by the V2 LOD manager
   (`far: 1500`), and their shadows stay off, as before.
2. **Light-shaft cards merged** (`mergeCards`): 36 static additive 2-triangle planes → 2 draws (one per
   material). The cards share one material, so their fade animation is unchanged.

Result, Yorktown wide, mobile Medium (container counters, same pose):

| | draws / frame | scene draws | triangles |
|---|---|---|---|
| Phase 4 | 409 | 399 | 1.03M |
| **Phase 5** | **325** | 315 | 1.07M (+4 %: whole far chunks stay in view instead of single tiles) |

−84 draws (−21 %) at the stress shot, visually identical (checked side by side on every chapter shot).

Per shot, mobile Medium (container, `frames=4`: counts only, the course's 0.25 s tile cull can lag a
shot, see 14 · Known issues #18): swamp 232 → 203, Lexington 158 → 122, Bunker Hill 131 → 115,
Delaware 176 → 153, Saratoga 212 → 152, Yorktown wide 409 → 323.

Desktop Medium, all shots (container, 40 measured frames so the tile cull has settled; Phase 4 = commit
`a608d63`, Phase 5 = after the merges **and** with the Phase 5 props added):

| shot | Phase 4 draws · tris | Phase 5 draws · tris |
|---|---|---|
| swamp | 232 · 624k | **193** · 669k |
| lexington | 161 · 637k | **143** · 668k |
| bunker | 141 · 655k | **118** · 665k |
| delaware | 179 · 606k | **158** · 638k |
| trenton | 186 · 539k | **174** · 600k |
| saratoga | 215 · 849k | **185** · 879k |
| yorktown | 172 · 978k | **157** · 1.00M |
| yorktown_wide | 412 · 1.03M | **328** · 1.07M |
| chapter_blend_run (moving) | 176 · 535k | **157** · 574k |

Mobile Medium, Phase 5, 40 frames: swamp 189, Lexington 140, Bunker Hill 115, Delaware 155, Trenton 171,
Saratoga 181, Yorktown 150, **Yorktown wide 327**, moving blend 151 (1.07M triangles at Yorktown wide).
The phone profile saves GPU fill (no GTAO, MSAA ×2, smaller shadow map), not draws; draws come down only
through the merges above.

## Not changed, and why

- **Cannonball pool (32 draws when all balls fly)**: dynamic objects owned by the course's artillery code.
  Instancing them means rewriting that code; left for later.
- **Glow sprites (35)**: could become one `THREE.Points`; small win, left for later.
- **Buildings of other chapters** visible from Yorktown: they are real silhouettes on the horizon; culling
  them would change the view.
- Real frame pacing on a phone was not measured (no device). This is a draw-call and triangle reduction,
  not a measured frame-time win on hardware yet.
