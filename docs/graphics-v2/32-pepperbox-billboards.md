# Pepperbox TV billboards

A different Pepperbox show on every roadside board, built to sit alongside the Maximus Knives and Hi Joe boards.

| | |
|---|---|
| shows | all 33 on pepperbox.tv/shows-all (with Pepperbox's OK), key art = each show's `hero-web` banner (2500x900, logo included) |
| faces | `models/props/pepperbox/<show>.jpg`, 2048x1024, light weathering baked in (grime at the bottom edge, soft edges); ~440 KB each, only the boards of the current race load |
| structure | `tools/blender/rr_pepperbox_board.py` (textures in `tools/blender/pepperbox_tex/`): steel bulletin 17.6 x 9 m, face 17 x 6.12 m, frame, back panel and bracing, catwalk with railing, Pepperbox TV plate on the kick board, 5 gooseneck lamps, ladder. ~1.2k triangles, 6 materials |
| `pbboard` | ground board: Mojave, Pacifica, Neon Foundry, Honky Tonk (2 each) |
| `pbpole` | same board on a 21 m monopole with a caged ladder, for the city tracks where a ground board would hide behind the storefronts: Alondra (3), Sweet Justice (2) |
| rotation | shows are shuffled once per session and dealt in order, so every board in a race is different and the next race continues with new ones |
| cost | ~6 draw calls per board |

Rebuild: `python3 tools/blender/rr_pepperbox_board.py -- tools/blender/pepperbox_tex tools/blender/pepperbox_tex/face_default.jpg models/props/pepperbox_board.glb` (append `12` for the pole version).
To add a show: drop a 2048x1024 JPG in `models/props/pepperbox/` and add its id to `PB_SHOWS` in `js/game.js`.
