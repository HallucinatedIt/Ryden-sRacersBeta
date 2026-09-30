# Phase 5A / 5F · Real-device benchmarks: status and the kit to run them

**Honest status:** no new real-device numbers were recorded in Phase 5. The Mac's browser pane was hidden
(a hidden pane renders no frames) whenever a run was attempted, Revolution needs a signed-in account
(see below), and no phone was reachable from this environment. The last real-device numbers are the Phase 4
M4 Medium runs (`24-phase4-performance.md`, `phase4_bench/m4_runs.jsonl`). Nothing below is invented.

Container counters (SwiftShader: draw calls and triangles are real, frame times are not) are in each
track's document.

## The kit

Open each URL, keep the tab in front and the window focused for the ~1–2 minutes it runs (the benchmark
now ignores blur-pause, but a hidden tab renders nothing), then screenshot the results panel. On a phone
the mobile preset variant is applied automatically (`pointer:coarse`); `&mobile=1` forces it on a desktop.

Base: `https://raw.githack.com/HallucinatedIt/Ryden-sRacersBeta/<commit>/index.html` with the latest
`graphics-v2` commit. The game is muted by its own settings on that origin if you set the volumes to 0 once.

### Desktop / Mac

| scene | URL query |
|---|---|
| Pacifica Medium / High / Ultra | `?bench=pacifica&tier=medium` · `&tier=high` · `&tier=ultra` |
| Mojave Medium | `?bench=mojave&tier=medium` |
| Alondra Medium | `?bench=alondra&tier=medium` |
| Revolution Medium / High | `?bench=revolution&tier=medium` · `&tier=high` (**signed in**) |
| Neon Foundry Medium | `?bench=neon&tier=medium` |

### Mobile profile (on the phone, or `&mobile=1` on the Mac)

| scene | URL query |
|---|---|
| Pacifica Medium | `?bench=pacifica&tier=medium` |
| Alondra Medium | `?bench=alondra&tier=medium` |
| Revolution Medium | `?bench=revolution&tier=medium` (signed in) |
| Neon Foundry Medium | `?bench=neon&tier=medium` |

Each run records, per shot: FPS, average frame time, p95, 1 % low, worst frame, CPU submit, draw calls,
triangles, texture memory, shadow draws and post passes (the JSON is also kept in `localStorage` under
`rydens_bench_<scene>_<pipeline>_<tier>` and printed to the console as `[bench] {...}`).

### Revolution and accounts

Revolution is an account track, and the benchmark waits for a signed-in racer instead of bypassing the
lock. Signing in on `raw.githack.com` stores the session token in that origin's storage, which every other
page served from raw.githack.com can read: prefer signing in there only for the run and signing out after,
or allow a benchmark-only view of Revolution on `graphics-v2` (a Phase 6 decision for the owner; `main` would
keep the lock).
