# Pepperbox TV billboards

A different Pepperbox show on every roadside board, built to sit alongside the Maximus Knives and Hi Joe boards.

| | |
|---|---|
| shows | all 33 on pepperbox.tv/shows-all (with Pepperbox's OK), key art = each show's `hero-web` banner (2500x900, logo included) |
| faces | `models/props/pepperbox/<show>.jpg`, 2048x1024, light weathering baked in (grime at the bottom edge, soft edges); ~440 KB each, only the boards of the current race load |
| structure | `tools/blender/rr_pepperbox_board.py` (textures in `tools/blender/pepperbox_tex/`): steel bulletin 17.6 x 9 m, face 17 x 6.12 m, frame, back panel and bracing, catwalk with railing, Pepperbox TV plate on the kick board, 5 gooseneck lamps, ladder. ~1.2k triangles, 6 materials |
| `pbboard` | ground board: Mojave, Neon Foundry, Honky Tonk (2 each); Pacifica 1 if a flat spot exists |
| `pbpole` | same board on a 21 m monopole with a caged ladder, for the city tracks where a ground board would hide behind the storefronts: Alondra (3), Sweet Justice (2), and Pacifica (2: the cliff road has almost no flat ground for a ground board) |
| rotation | shows are shuffled once per session and dealt in order, so every board in a race is different and the next race continues with new ones |
| cost | ~6 draw calls per board |

Rebuild: `python3 tools/blender/rr_pepperbox_board.py -- tools/blender/pepperbox_tex tools/blender/pepperbox_tex/face_default.jpg models/props/pepperbox_board.glb` (append `12` for the pole version).
To add a show: drop a 2048x1024 JPG in `models/props/pepperbox/` and add its id to `PB_SHOWS` in `js/game.js`.

## Placement test (fix after the first live test: boards hidden or buried in rock)

A spot is only used if `pbSpotOK` passes (`js/game.js`):

1. the board faces the approach (not its back or its edge);
2. open sky over the approach (no boards beside a tunnel or the LED arch run; a single wire or gantry is fine);
3. the body stands in nothing: sweeps along and down through the board against the scenery;
4. the face is seen: 21 sight lines (driver's eye at three distances x seven points of the face), at most 14 % blocked;
5. ground boards need level ground (<= 1.6 m across the footprint); pole boards need a footing near road level.

The scenery is indexed once per track into a 32 m triangle grid (`pbIndex`), so the whole test costs ~0.2-0.3 s at load
(the first version used three.js raycasts against the whole environment: 17 s). A track with no good spot gets fewer boards
rather than a bad one.
