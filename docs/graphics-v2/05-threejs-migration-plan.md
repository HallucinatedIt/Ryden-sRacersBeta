# Modern three.js migration plan

**Current:** three.js **r128** (2021), classic global script, `examples/js` GLTFLoader.
**Target:** a current three.js release (r17x or later, pinned to one exact version), still on
**WebGLRenderer**. WebGPU is a later, separate step.

No upgrade was made in Phase 1. It cannot be done as a drop-in: `examples/js` (the global-script
loaders) no longer exists, and colour management and light units changed defaults in ways that would
visibly change every track. The work below is ordered so each step can be verified with the benchmark
and the parity script before the next one.

## What changes between r128 and a modern release (and what it touches here)

| Change (release) | Effect on Ryden's Racers | Action |
|---|---|---|
| `examples/js` removed (r148); addons are ES modules only | The vendored r128 GLTFLoader cannot be used; the game is a classic script expecting a global `THREE` | Boot through a tiny module (see Step 1) that imports `three` + `GLTFLoader` and exposes them globally, then loads the existing scripts. Needs an import map (iOS Safari 16.4+) |
| `outputEncoding` / `texture.encoding` replaced by `outputColorSpace` / `texture.colorSpace` (r152) | `GFX.renderer.create` (1 place) and 4 `sRGBEncoding` texture assignments in game.js | Mechanical rename |
| `ColorManagement.enabled = true` by default (r152): hex colours and vertex colours are treated as sRGB and converted to linear | **Every** `new THREE.Color(0x...)`, theme colour, vertex-coloured terrain and env-GLB vertex colour would render darker/more saturated | Phase A: set `THREE.ColorManagement.enabled = false` for parity. Phase B: turn it on deliberately and re-tune palettes per track against the benchmark |
| Physically based light units by default (r155); legacy lights removed (r165) | 9 light constructors: sun/hemisphere intensities (legacy mode scaled them by π internally); spot/point lights now decay physically | Multiply directional/hemisphere intensities by π for a first match, then re-tune; re-set decay/intensity on the gantry spot lights |
| Shader chunk renames, e.g. `encodings_fragment` → `colorspace_fragment` (r154) | 10 `ShaderMaterial`s (sky, ocean, neon ×n, Revolution water/portal), 1 `onBeforeCompile` (Revolution ground/road/foliage), 19 `#include` uses | Audit each shader; most use only fog/common chunks, which still exist. `gl_FragColor` / `texture2D` keep working through three's GLSL3 shims |
| `BufferAttribute.getX()` and friends denormalise normalised attributes (r139+) | The Revolution runtime manually divides quantised (int16) positions by 32767 in `revHeightGrid` and the culling bounds; after the upgrade that would divide twice | Remove the manual `nf` factors |
| WebGL1 support removed (r163) | Devices without WebGL2 (old iOS < 15, some old Android) could no longer run the game | Check the backend stats from the benchmark/overlay first; keep r128 as a fallback build if needed |
| `InstancedMesh` bounding volumes computed from instances (r151+) | Revolution sets `frustumCulled = false` on instanced troops/props to avoid wrong culling | Can re-enable frustum culling afterwards (perf win) |
| Shadow map types: newer releases steer soft shadows towards `PCFShadowMap` + `shadow.radius` / `VSMShadowMap` | `PCFSoftShadowMap` in `GFX.renderer` | Verify on the pinned version; one-line change in renderer.js |
| GLTFLoader (jsm) updates: `KHR_mesh_quantization`, emissive strength and the texture colour space are handled internally | All env and car GLBs | Re-test car baked textures (the game assigns its own base/normal/MR textures after load) |
| Post processing: `examples/jsm/postprocessing` (EffectComposer, UnrealBloom, SMAA, GTAO, OutputPass) | None yet | Build the Phase 2 post stack **after** the upgrade, so it is only written once |

## Steps

1. **Module boot, same behaviour.** Add an import map (`three`, `three/addons/`) pinned to the target
   version and `js/boot.mjs`:
   ```js
   import * as T from 'three'; import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
   window.THREE = Object.assign({}, T, { GLTFLoader });   // module namespaces are frozen; copy
   // then append the classic scripts in order: js/gfx/*.js, js/game.js
   ```
   Remove `js/vendor/GLTFLoader.r128.js`. Keep a `?three=r128` escape hatch during testing.
2. **Parity mode.** `ColorManagement.enabled = false`, legacy-matching light intensities, colour-space
   renames, chunk renames, normalised-attribute fixes. Target: the parity script reports a
   near-identical frame on every track, and the benchmark shows no performance regression.
3. **Modern colour pipeline.** Enable colour management and physical lights; re-tune THEMES, the
   Revolution REV_ATMO table and the Neon palette against benchmark shots, track by track (the
   `?gfx=legacy` build stays available for side-by-side comparison).
4. **Unlock Phase 2 features:** post-processing stack, world IBL, instanced-mesh culling.
5. **WebGPU (later).** `three/webgpu` needs all custom shaders re-expressed in TSL (node materials),
   so it is a rewrite of the sky, water, neon, portal and ground shaders. Only after the game is stable
   on modern WebGL, and only if the benchmark shows a real gain on the target devices.

## Risks

- **Mobile Safari:** import maps need iOS 16.4+. Measure the share of older devices before dropping
  r128.
- **Asset re-validation:** car textures and env GLB materials must be re-checked under colour management.
- **Custom shaders:** they are the visual identity of Neon Foundry and Revolution. Each one is compared
  against its benchmark or parity frame before and after.
