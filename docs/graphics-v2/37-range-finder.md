# Range Finder (item `range`)

Asked for by players. A fourth item in the item boxes on every track. Using it puts the exact distance left in the race on
screen for the rest of the race: it appears big in the centre of the screen for 1.4 s, then slides up under the timer and
counts down to zero at the flag.

- `ITEMS.range` (◎, yellow). `Race.rollItem` gives it only to the human driver (20 % of rolls) and only until it has been used
  once in that race; the AI never rolls it.
- `Race.useItem` sets `R.rangeOn`; `UI.hud` shows `#distBox`, then adds `.dock` and pins it under `#timeBox` (re-measured every
  frame, so it follows screen size and rotation).
- `Race.distLeft(c)`: metres along the road. Normal tracks: laps still to run x lap length + what is left of the current lap
  (the lap line is path sample 0; before the first crossing the run to the line is added). Revolution (drag strip + circuit)
  counts by its route span and never counts up across the portal hop. Practice: distance to the lap line.
- Units follow the speed setting: miles (two decimals) or feet under 0.1 mi; kilometres (two decimals) or metres under 1 km.
- A shortcut (Knifehand Arena) makes the number drop by the road it skips, as it should.

Checked by simulation: PepperBox Raceway, 20 laps: 16,942 m at the start, exactly one lap (847 m) less at each line, 0 at the
flag, never more than 1.4 m per frame. Knifehand Arena: 20,400 m, 1,020 m per lap. Revolution: 12,923 m including the opening,
4,168 m per circuit lap.
