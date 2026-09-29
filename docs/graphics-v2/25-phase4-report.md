# Phase 4 report and Phase 5 recommendation

Branch `graphics-v2`. Phase 3 rollback point: `5cebd51`. `main` carries only Ryden's Bus from this work.

## 1 · Ryden's Bus release (main)

- `main` commit **`fa7c1a8`** "Add Ryden's Bus to live game": `js/game.js` (+3 lines: the vehicle entry,
  its GLB and length), `index.html` (cache-bust), `models/cars/midnight_voyager.glb`. Nothing else.
- Midnight Voyager is the **14th / last** vehicle (saved `lastCar` indices of existing players unchanged),
  driver Ryden, stats speed 9 / accel 7 / handling 7 / drift 6 / weight 8.
- Verified live after the push: Pages deploy succeeded, the car-select shows 14 cars with the Bus last, the
  GLB loads (200, no console errors), a race with the Bus starts and finishes (5th, 112.7 s), an existing
  car still races (GT40), `main` has no Graphics V2 code (no `js/gfx`, three.js r128, no `GFX` references).
  `graphics-v2` was not merged.

## 2–3 · Alondra Blvd V2 and its benchmark → [19](19-alondra-v2.md)

Smoggy SoCal afternoon; city materials (stucco grime, brick, shop-front glass); the black-wall bug found and
fixed (no vertex normals → derivative normals); manholes, potholes, oil drips; 46–140 wall-art quads; street
life with a story (BPD precinct lot, a traffic stop, Donut Patrol on a break, parked cars, bins, ATMs, roof
AC, yard planting) with BPD 69 / Donut Patrol still playable; merge by material (−20–30 % draws);
KTX2/Meshopt env (16.2 → 11.8 MB). `?bench=alondra`: six scenes, **stress scene = the Hot Block**.

## 4–5 · Revolution V2 and its benchmark → [21](21-revolution-v2.md)

Seven chapter looks on the course's own chapter system, interpolated through its 70-sample blends, one
PMREM per chapter switched at the blend midpoint, fixed sun direction; Delaware grey and cold but not
blue; the course's ground/road/water/leaf shaders, troops (instanced, 3 LOD tiers, near tier casts shadows
only), smoke and flashes kept (the Meshy palisade was tried and not placed: hidden behind the course barriers); KTX2/Meshopt env (24.0 → 14.4 MB).
`?bench=revolution`: one shot per chapter + Yorktown wide + a moving chapter blend; **stress scene =
Yorktown wide**. Full 8-car race on V2 with the new env: all finish, 24 portal passes, no errors.

## 6–7 · Vehicles and Bus V2 → [22](22-vehicles-phase4.md)

All 14 GLB cars on material slots with a finish of their own; geometry identical on both pipelines (0.0000 m);
the Bus V2: fleet-white clear-coat paint, tinted window band, bright lamps, six wheels correctly slotted,
stats unchanged. Showroom slot materials tested and left opt-in (they looked worse in the legacy room).

## 8 · Asset optimization table → [20](20-phase4-assets.md), [18](18-vegetation-props.md)

## 9 · Phase 3 vs Phase 4 performance → [24](24-phase4-performance.md)

M4, Medium, same pane, back to back, every run listed: Pacifica and Mojave unchanged (p95 17.7–18.6 ms);
Alondra V2 p95 ≤ 19.3 ms at 60 fps with ~20 % fewer draws and ~17 % less CPU submit than legacy.
Not measured on real hardware: Revolution (account), High / Ultra / mobile presets, a real phone.

## 10 · Known issues → [14](14-known-issues.md) (items 12–20)

## 11 · Neon Foundry audit → [23](23-neon-foundry-audit.md)

## 12 · Screenshots

`img/phase4/`: `alondra_old_vs_v2.jpg`, `revolution_chapters_old_vs_v2.jpg`, `cars_v2.jpg`,
`car_slots_*.png` (slot check renders), `showroom_old_vs_slots.jpg`;
`img/phase3/`: `mojave_old_vs_v2.jpg`, `cars_old_vs_v2.jpg`, `car_slots_*.png` (backfilled).

## Final verification (container, commit `a608d63`)

All seven tracks start a practice race on both pipelines with **no console errors and no failed requests**.
Legacy (`?gfx=legacy`) draws and triangles are identical to the Phase 3 check on every track (legacy look
unchanged). V2: Pacifica, Mojave, Alondra and Revolution use their looks; Neon, Country and Sweet still
render the legacy look on r186. Full 8-car races finish on Revolution V2 (with the Bus) and Alondra V2.
All 14 GLB cars: identical dimensions, wheel positions and bounding boxes on both pipelines.

## 13 · Phase 5 recommendation

In order:

1. **Measure what Phase 4 could not**: Revolution signed in, High / Ultra / mobile-Medium on the M4 (the
   benchmark now ignores blur-pause), and one real phone (iPhone + a mid Android) on Pacifica, Alondra and
   Revolution Medium. Decide the mobile default preset from those numbers, not from the desktop.
2. **Hand pass on the car slots** for Hellcat, Black Lightning, Concordance, White Lightning, BRCC
   (1–2 hours each in Blender with `--keep-slots`), then remove the profile compensations.
3. **Showroom on the V2 path** (colour management, post, a physical softbox env), then switch the slot
   materials on there by default.
4. **Neon Foundry V2** following the audit (KTX2 variant → night look with HDR emissive LEDs → wet road →
   `?bench=neon`).
5. **The pending Meshy batch** (woods for Saratoga/Lexington, Alondra fruit trees) once the Mac export runs;
   hand-authored tree cards for the big trees.
6. **Country / Sweet tracks**: the remaining legacy looks on the V2 pipeline.
7. Only after all tracks have a V2 look: consider making V2 the default on `main` (a separate, explicit
   release decision, with the rollback points above).
