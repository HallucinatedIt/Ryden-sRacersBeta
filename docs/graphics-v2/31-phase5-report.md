# Phase 5 report and Phase 6 recommendation

Branch `graphics-v2`; rollback point `graphics-v2-phase5-rollback` (= Phase 4 final, `a71871c`). Nothing
from Phase 5 is on `main`.

## Verification before starting

Branch clean and in sync with `origin/graphics-v2`; Phase 4 docs present; all seven tracks start on V2 and
legacy with no errors (Phase 4 final check, code unchanged since); menu, showroom and car select work on
both pipelines; all 14 cars (Bus last) load; benchmark scenes run. Leaderboards: the container cannot reach
Supabase (network allowlist), so they were checked directly in the database: the `leaderboard` view serves
rows for every track, with posts from today, and `race_results_car_check` now includes `voyager`.

## What was done

| | | doc |
|---|---|---|
| **5B Neon Foundry V2** | wet midnight look; the course's LED show in HDR (bloom finds it, text stays readable); night IBL (neon / sodium / furnace panels) for reflections; wet asphalt (film, puddles, edge water, streaks, squeegeed line, oil); furnace glow cards; capped steam from the stacks and furnace roofs; KTX2 env 8.7 → 6.7 MB; `?bench=neon` (stress: LED arch straight); full race OK | [26](26-neon-v2.md) |
| **5C Revolution** | far vegetation merged per 700 m cell, light-shaft cards merged: Yorktown wide mobile Medium **409 → 325 draws**, desktop Medium 412 → 328, every chapter shot 7–21 % fewer draws, visually identical | [29](29-revolution-perf.md) |
| **5D Showroom** | studio env (big softbox, side strips, dim brand accents), neutral rims and fill, slot materials by default on V2 (`?showroomv2=0` = old), turntable sized to the car | [28](28-showroom-v2.md) |
| **5E Vehicles** | found why five cars failed (three are rotated by the game; three have wheels baked into the body); fixed at the source with reviewable per-car slot recipes; FDC fixed too; profile compensations removed; geometry identical (0.0000 m) | [27](27-vehicle-fixes.md) |
| **5E assets** | Meshy batch exported from the Mac and processed: colonial house, farm gate, butcher stall, fir, birch, fly agaric, mossy log placed on Revolution (probed free ground, instanced, not in the Yorktown battle view); fruit tree and dark pine rejected (bad LODs) | [20](20-phase4-assets.md), [26](26-neon-v2.md) |
| **5A / 5F** | not measured on hardware (pane hidden, Revolution needs an account, no phone); the kit and URLs are ready | [30](30-phase5-benchmarks.md) |

## Final verification (container, end of Phase 5)

All seven tracks start a practice race on both pipelines with no console errors and no failed requests.
Legacy draws and triangles are identical to Phase 3/4 on every track (legacy unchanged). V2 now has five
looks (Pacifica, Mojave, Alondra, Revolution, Neon); Country and Sweet still render the legacy look on r186.
Full 8-car races finish on Neon V2; all 14 cars keep identical geometry; menu, showroom and car select
render with no errors on both pipelines. `main` is untouched (last commit there: your README edit).

## Known issues

`14-known-issues.md`, items 21–25, plus the status of 12–19.

## Phase 6 recommendation

1. **Run the benchmark kit on real hardware** (Mac High/Ultra, Revolution signed in, one iPhone and one
   mid-range Android). Decide the phone default preset from frame pacing, not draw counts.
2. **Revolution artillery**: instance the cannonball pool and the glow sprites (~65 draws at Yorktown when
   firing).
3. **Neon**: optional rain (screen-space streaks, off on mobile), local reflection probes for the furnace
   area, then the same wet treatment for Alondra at night if a night variant is ever wanted.
4. **Country and Sweet**: the last two tracks still on the legacy look.
5. **Showroom on the post chain** (bloom on its neon).
6. Then decide, separately and explicitly, whether and when Graphics V2 becomes the default on `main`.
