# Black Rifle Rallycross (track `roast`)

A short, fast dirt stage through pine forest, dressed as if Black Rifle Coffee Company sponsored every metre.
Always 20 laps; no car bonuses; item boxes and boost pads are live.

<img src="img/roast/roast.jpg" width="900">

| | |
|---|---|
| layout | 0.92 km loop, 16-17 m wide (wide for a rally stage so eight cars fit): start straight into the jump, a climbing sweeper (4 m of elevation), esses, a hairpin, the run back |
| the jump | the Dark Roast Jump, 3 m table-top kicker 60 m after the line (`jumps:[{cp:1,f:0.25,len:15,h:3.0,gap:0}]`), under an arch, hay bales down both sides |
| dirt | `THEMES.rally` + `dirtRoad`: packed-dirt road texture with ruts and loose stones, no paint, dirt shoulders, wooden fence; `dirt:true` makes every car trail dust on the road itself. Looks only: grip is the same as on every track |
| laps | `laps:20`. AI laps 19-22 s on Hard: about 7 minutes |
| no car bonuses | `noPerks:true` |
| pick-ups | pads and item rows only on the start straight and the run back from the hairpin (in the sweeper and the esses they put the AI in the fence) |
| Grand Prix | `gp:false` |
| Black Rifle | banners on both fences for the whole lap, the jump arch, THE MUG (a 14 m black coffee mug with steam inside the hairpin), the roastery barn with chimney smoke, bean sacks and barrels, a service park of black canopies, feather flags down the start straight, four sponsor boards, spectators in brand colours |
| cost | 98 draw calls, 633k triangles in the solo test shot |

## Brand art

Everything Black Rifle on this track is **plain lettering** in black, tan and red (the company name, "BRCC", and lines written
for the game). No official logo artwork is used. To put the real marks on: replace the canvas atlas in the `rally` block of
`buildScenery` (`panels`, 2 rows x 4 panels of 512x128) with an image, the way `sponsors.jpg` is used at PepperBox Raceway.

## Leaderboard (Supabase)

`roast` must be allowed in `race_results_track_check`; floors for this track: lap >= 13 s, race >= 260 s.
