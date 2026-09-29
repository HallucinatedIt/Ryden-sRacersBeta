# Phase 2 · three.js migration report

## Versions

| | Before (Phase 1, `main`) | After (Phase 2, `graphics-v2`) |
|---|---|---|
| three.js | **r128** (2021), from cdnjs, classic global script | **r186** (0.186.1), bundled locally: `js/vendor/three.r186.min.js` |
| glTF loader | r128 `examples/js` GLTFLoader, inlined | r186 `GLTFLoader` (jsm), in the bundle |
| Renderer | WebGLRenderer (WebGL1 or WebGL2) | WebGLRenderer, **WebGL2** |
| Fallback | none | r128 is still shipped as a fallback for browsers without WebGL2 and as the exact OLD renderer (`?three=r128`) |

WebGPU was not adopted (see "Not done" below).

## How the game loads three.js now

`index.html` has a small boot check: if the browser has WebGL2 (and `?three=r128` is not set) it
loads `js/vendor/three.r186.min.js`. Otherwise it loads the original r128 scripts. Everything after that
is shared. The bundle is built by esbuild from `tools/three-bundle-entry.js`. It contains three.js plus
the addons the game uses: GLTFLoader, KTX2Loader, MeshoptDecoder, GTAOPass, FullScreenQuad,
LUTCubeLoader, Sky and BufferGeometryUtils. It exposes them as `window.THREE`, so `game.js` stays a
classic script. This is the same idea as the ES-module boot in the Phase 1 plan, but it needs no import
map. That matters because import maps need iOS 16.4 or newer, and a single classic bundle runs on
everything that has WebGL2 (iOS 15+). The branch stays a plain static site: no build step is needed to
serve it, relative paths are unchanged, and it deploys to GitHub Pages as-is.

Rebuild the bundle:
`npm i three@0.186.1 esbuild && npx esbuild tools/three-bundle-entry.js --bundle --format=iife --minify --define:import.meta.url=__RR_META_URL --banner:js="var __RR_META_URL=(document.currentScript&&document.currentScript.src)||location.href;" --outfile=js/vendor/three.r186.min.js`

## Major API changes and how each was handled

All version differences go through **`js/gfx/compat.js`**, so `game.js` and the gfx modules run on both
r186 and r128.

| Change | Where it hit the game | What was done |
|---|---|---|
| `texture.encoding` / `renderer.outputEncoding` → `colorSpace` / `outputColorSpace` (r152) | 3 texture assignments in game.js, the renderer | `GFX.compat.srgb(tex)`, `GFX.compat.setOutputSRGB(renderer)` |
| **Colour management on by default** (r152): hex colours are converted sRGB → linear | Every hex colour in THEMES, props, cars and shaders would render darker and more saturated | Colour management is **off by default** (the legacy look is preserved exactly). It is switched **on** only while a Graphics V2 look is active (Pacifica); the world is built with it on and it is switched off again when the race ends |
| **Physically based light units** (r155; legacy mode removed in r165): no implicit ×π on punctual/hemisphere lights, and spot/point lights use inverse-square falloff | World sun + hemisphere (every track), Revolution chapter atmosphere, garage key/fill/rim lights | `GFX.compat.li()` (×π) for directional/hemisphere; `GFX.compat.spotI()` converts the garage spot lights, matched at their real distance to the car |
| `PCFSoftShadowMap` removed (r180) | Renderer shadow type | `PCFShadowMap` + `shadow.radius` (the r180+ replacement; soft Vogel-disk filtering) |
| Map UV varying renamed `vUv` → `vMapUv` (r151) | Revolution ground shader (`onBeforeCompile`) | `GFX.compat.uvMap` |
| Double-sided transparent materials draw in two passes (r151) | Foam, glows, beams: extra draw calls (coast parity test: 96 → 160 draw calls) | `GFX.compat.singlePassTransparency(scene)` (`forceSinglePass`), same look and draw count as r128 |
| `examples/js` loaders removed (r148) | The inlined r128 GLTFLoader | The r186 jsm loader in the bundle; the r128 copy stays in `js/vendor/` only for the fallback |
| Normalised attributes are denormalised by `getX()` (r139+) | Revolution height grid and culling bounds read quantised positions | No change needed: that code reads the raw arrays and applies its own factors, so it gives the same result on both versions |
| Default shader precision / GLSL 3 | All 10 custom `ShaderMaterial`s (sky, ocean, neon ×n, Revolution water and portal) | No change needed: they only use `fog_*`, `common`, `begin_vertex` and `project_vertex`, which still exist, and three's GLSL3 shims keep `gl_FragColor`/`texture2D` working |
| Each texture map has its own UV transform (r151); r128 used `map`'s transform for every map | Neon Foundry's puddle roughness map (its own repeat) | `GFX.compat.legacyUVTransforms(scene)` on legacy looks |
| PMREM rough mips are much darker for dark environments with small bright emitters (measured ≈10× on the Neon wet road) | Neon Foundry wet-road sheen | `GFX.compat.tagLegacyEnv(env,12)` + `applyLegacyEnv`: roughness-weighted envMapIntensity compensation on legacy looks (Neon diff 15.2 → 5.9/255) |
| `renderer.info` counting | Per-frame stats | `info.autoReset=false`, reset once per frame, so post passes are counted too; the shadow pass is counted separately |

## Parity result (legacy look on r186 vs `main` on r128)

Same camera, same frame, `parity.js` (software GPU, 480×270), mean absolute pixel difference:

| scene | difference | note |
|---|---|---|
| Pacifica | **1.5 / 255** | indistinguishable |
| Sweet Justice | 2.8 / 255 | |
| Menu / showroom | 4.6 / 255 | animated neon strips |
| Revolution | 6.4 / 255 | flags, smoke and cannon fire are time-based |
| Neon Foundry | 5.9 / 255 (15.2 before the PMREM compensation) | rain and LEDs are animated; the wet-road sheen is back, slightly more magenta |

All tracks launch and render with no console errors. Scene-pass draw calls on Pacifica match r128
exactly in every benchmark shot (54 / 54 / 73 / 57 / 147 / 45).

## Deprecated systems replaced

- `outputEncoding` / `sRGBEncoding` → `outputColorSpace` / `SRGBColorSpace` (through compat)
- `PCFSoftShadowMap` → `PCFShadowMap` + radius
- r128 `examples/js/GLTFLoader` → r186 jsm `GLTFLoader` with `KTX2Loader` + `MeshoptDecoder`
- Legacy (non-physical) light units → physical units with explicit conversion

## Shader changes required

- Revolution ground/road shader: `vUv` → `vMapUv` (through compat). No other existing shader needed a change.
- Neon Foundry shaders: **unchanged** (they are self-contained ShaderMaterials and use no renamed chunks).

## Remaining technical debt

1. **Two three.js versions ship.** r128 is kept as the WebGL1 fallback and the OLD comparison. Once real
   device data shows nobody needs WebGL1, remove it together with `js/vendor/GLTFLoader.r128.js` and the
   r128 branches in compat.js.
2. **Legacy tracks still use the non-colour-managed palette.** Each track moves to colour management when
   it gets its own V2 look (Phase 3). Until then, V2 features (IBL, post, AO) only run on Pacifica.
3. **game.js is still one classic script** that uses the global `THREE`. Moving it to ES modules is not
   needed for graphics and was not done (no rewrite in Phase 2).
4. **WebGPU / TSL:** not started. Every custom shader (sky, ocean, neon, portals, water, ground) would have
   to be re-written as node materials. Revisit only if the benchmark on target devices shows WebGL is
   the limit.
5. **The bundle includes GTAO/LUT code** even on devices where the tier never uses it (about 290 KB gzip in
   total, versus about 150 KB for r128). Acceptable; it could be split later.

Side by side (left `main` on r128, right `graphics-v2`): `img/phase2/other_tracks_main_vs_v2.jpg`, `img/phase2/parity_r128_r186.jpg`.
