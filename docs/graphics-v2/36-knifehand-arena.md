# Knifehand Arena (track `knife`)

The fourth 20-lap track, built for the Department of Knife Hands: an indoor circuit under one roof, well lit, with the
knifehand everywhere. Always 20 laps; no car bonuses; item boxes and boost pads are live. It joins the Marathon Grand Prix
automatically (every track with `laps:20`).

<img src="img/knife/knife.jpg" width="900">

| | |
|---|---|
| layout | 1.02 km (`knifePoints`): start straight along the south side, the east sweeper under the Chop, the north straight that splits round the island, the west leg, a short infield hairpin and a U-turn home. AI laps 22-23 s on Hard, about 7.5 minutes |
| the arena | theme `arena` (`buildArenaScenery`): the floor edge is an ellipse round the track; a lettered retaining wall, a five-row lower tier, a raked upper tier, a suite wall and a dome roof are bands swept round it. Flat floor (`naturalHeightFn` returns 0), bright overhead light, floodlight bars, a centre-hung scoreboard |
| the crowd | lower tier: about 2,100 instanced colonials (continental, militia, French) from `rv_troops.glb`, lowest LOD, one in three bobbing. Upper tier: a painted crowd in the same colours |
| the knifehand | `models/props/knifehand.glb` (the Meshy model, 232k triangles simplified to 8k, no texture; coloured in game). Used as the 25 m gold monument on the nose of the island, a row of olive ones down the island, two beside the start straight, and the Chop |
| the Chop | a giant knifehand on a striped tower outside the east sweeper (cp 4) that raises and chops down across the road every 3.4 s. It stops 7 m above the road: it shakes the camera and thumps, it does not hit cars |
| the split | cp 7-10: the road widens to 46 m round a 20 m island (`medians:[{cp:7,f:0.55,len:100,w:20}]`), a boost pad in each lane. AI lines aim for the middle of a lane when a median is wider than 10 m |
| the shortcut | `shortcut:{cp:13,f:0,cpx:21,fx:0}`. See below |
| brick walls | five stand round the floor with number plates (7 1/2, 4 2/3, 12 1/4, 8 5/8 and 9 3/4). Only 9 3/4 is the way through |
| leaderboard | `knife` must be allowed in `race_results_track_check`; floors: lap >= 12 s, race >= 240 s |

## The shortcut (`def.shortcut`, `P.sc`, `Race.scEnter` / `scStep`)

An ode to old racing games. At the end of the west leg the road bends left into the infield; straight on is a brick wall
marked 9 3/4. `buildTrackPath` walks the straight-on line from the sample at `cp,f` until it leaves the road: that is the wall
point. A human driver who arrives within 5 m of it, pointing at it (within 15 degrees) and doing more than 10 m/s, is carried
on rails along a cubic curve through a brick tunnel and put back on the road at the outside of the U-turn (`cpx,fx`), at the
speed they went in (minimum 27 m/s). Bricks fly, the screen says PLATFORM 9 3/4.

- It cuts 150 m of road (the infield hairpin) down to about 55 m: roughly 4 seconds a lap.
- AI cars never take it (`c.isPlayer` only, and not under autopilot).
- The lap gates inside the part that was cut are credited on the way out, so the lap counts.
- Miss the wall, or arrive at an angle, and it is just the outside wall of the corner.
- The physics is path-relative, so the tunnel is not driveable road: the car is steered for you while inside.

## Brand art

Plain lettering only (the Department's name, its "Made by service members for service members" line and phrases written for
the game) in olive, black and yellow. No logo artwork is used. The knifehand model was supplied by the track's owner.
