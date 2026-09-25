# Ryden's Racers

A 3D arcade racer that runs in the browser (three.js r128).

## Play / publish on GitHub Pages
1. Create a new GitHub repository and upload everything in this folder (keep the `js/` and `models/` folders).
2. In the repo: **Settings -> Pages -> Build and deployment -> Source: Deploy from a branch**, pick `main` and `/ (root)`, then Save.
3. After a minute the game is live at `https://<your-username>.github.io/<repo-name>/`.

## Test on your own computer
Double-clicking `index.html` will NOT load the 3D models (browsers block that for local files).
Run a tiny local server from this folder instead, then open http://localhost:8000
- Python: `python3 -m http.server 8000`
- Node: `npx serve .`

## Adding models
- Cars: `models/cars/`  -  Props (buildings, trees, billboards): `models/props/`
- Each model is a `.glb` (shape) plus `_base.jpg`, `_normal.jpg`, `_mr.jpg` textures.
