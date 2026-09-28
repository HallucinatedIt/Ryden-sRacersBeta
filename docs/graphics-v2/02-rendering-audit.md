# Graphics architecture audit (as of Phase 1)

What actually produces the pictures in Ryden's Racers today, where it lives in the code, and what holds
the visuals back. Line references are to the `graphics-v2` branch.

## 1. Renderer and colour pipeline

| Item | Current state | Where |
|---|---|---|
| Library | **three.js r128** (Feb 2021) from cdnjs, classic `<script>` (global `THREE`) | `index.html` |
| glTF loader | r128 `examples/js` GLTFLoader, previously pasted into the first 3,630 lines of `game.js`; now `js/vendor/GLTFLoader.r128.js` (verbatim) | vendor file |
| Backend | `WebGLRenderer` (WebGL2 when available, WebGL1 fallback) | `js/gfx/renderer.js` |
| Antialiasing | MSAA via `antialias:true` on the default framebuffer. No FXAA/SMAA/TAA. Low tier renders at 0.75 px ratio (visibly soft). | renderer.js |
| Colour management | r128 style: `outputEncoding = sRGBEncoding`; car textures flagged `sRGBEncoding`; hex colours are *not* colour-managed (r128 has no `ColorManagement`). | renderer.js, game.js (4 places) |
| Tone mapping | ACES Filmic; `toneMappingExposure` set per frame from the theme (`th.exposure`, 0.94–1.02) | `GFX.renderer.render` |
| Light units | Legacy (non-physical) lighting (`physicallyCorrectLights` off) | — |
| Frame entry points | Exactly two: `Race.render()` and `Garage.render()`; both now call `GFX.renderer.render(scene, camera, exposure, tag)` | game.js |

## 2. Lighting, shadows, environment

- **Key light:** one `DirectionalLight` sun per track (`THEMES[*].sunCol/sunI/sunDir`), plus one
  `HemisphereLight` for sky/ground fill. No ambient occlusion of any kind.
- **Shadows:** `PCFSoftShadowMap`, one orthographic shadow box **140 × 140 m** (±70 m) that follows the
  player every frame. Map size 512 / 1024 / 2048 (Low has shadows **off**). Bias −0.0006, normal bias 0.03.
  Nothing beyond ~70 m from the car casts or receives shadows.
- **Shadow casters:** chosen per track by regular expressions on object names (`ENV_CFG[track].shadowRe`)
  plus cars and some props. Terrain/road only receive.
- **Environment / reflections:** a tiny PMREM "sky probe" is rendered per race from the theme colours
  (`makeEnvFromTheme`) and applied **only to car materials** (paint, glass, chrome) and a few env
  materials. Neon Foundry builds its own neon PMREM; the showroom builds another.
  **`scene.environment` is `null`: world materials receive no image-based lighting.**
- **Local lights:** start-gantry lamps and a few spot lights; lanterns, fires and neon are emissive
  sprites/shaders, not lights.
- **Fog:** linear `THREE.Fog`, per theme (`fogNear/fogFar`), scaled by tier (`fogMul`), overridden per
  environment (`ENV_CFG[*].fogNear/fogFar`) and animated per chapter on the Revolution track.
- **Sky:** a sphere with a gradient shader, sun disc and halo, optional star field (night) and, since the
  Revolution work, optional procedural clouds (`th.clouds`, off elsewhere).

## 3. Geometry, materials and track-specific systems

- **World geometry.** Every track runs the procedural `buildWorld`: height field terrain (plane grid,
  vertex-coloured, one 256 px noise detail texture), road ribbons, curbs, shoulders, walls. Tracks with a
  Blender environment (`env_<track>.glb`) hide the procedural terrain/road and use the authored meshes
  instead (all seven tracks now do). The procedural terrain is still **built and then hidden**, which
  costs load time and memory for nothing.
- **Environment GLBs** (Blender pipeline, `RydensRacers-Blender/<track>/`): 8–24 MB each, 76k–587k
  triangles, 38–395 primitives, `KHR_mesh_quantization` on the big ones, JPEG textures up to 2048.
  Materials are PBR-lite: base colour map × vertex colour, roughness/metalness constants, **no normal
  maps on environment surfaces**.
- **Cars:** Meshy GLBs, 24–40k triangles, one material with baked base/normal/metal-rough JPEGs
  (1024/512/256; White Lightning 2048). Plus shared procedural glass/chrome/trim materials with the
  sky-probe env map.
- **Custom shaders (preserve!):**
  - Neon Foundry: animated LED strips, light show, wet road, harbour water (`neonShader`, `neonLSMat`).
  - Pacifica ocean shader (custom `ShaderMaterial`).
  - Revolution: river/swamp/harbour water with ice and duckweed, swirling portals, ground/road/foliage
    `onBeforeCompile` upgrades (macro variation, wind), light shafts, CSS vignette.
  - Sky shader (all tracks).
- **Particles:** `Particles` (sparks, dust), `Skids`, `Rain`, `RevPuffs` (smoke, flashes, motes, snow),
  sprite glows.
- **Instancing:** Revolution troops (3 LODs, CPU-selected per frame) and repeated props; flat
  `instanced()` helper for scenery; otherwise meshes are merged per chapter/tile.
- **Culling:** three.js per-object frustum culling; Revolution adds distance culling of vegetation/prop
  tiles and camera-behind culling for troops. Other tracks have no distance culling or LOD.

## 4. Quality tiers (before Phase 1)

| | pixel ratio cap | shadows | shadow map | terrain cell | density | fog × |
|---|---|---|---|---|---|---|
| Low | 0.75 | off | 512 | 9 m | 0.45 | 0.75 |
| Medium (default) | 1.0 | on | 1024 | 6 m | 0.8 | 1.0 |
| High | 2.0 | on | 2048 | 5 m | 1.0 | 1.15 |

`density` drives scenery counts, particle budgets and `lowHide` (objects hidden on Low). **Mobile has no
separate behaviour:** every device starts on Medium; the player must pick Low manually.

## 5. Measured scene cost (medium tier, 480×270 software GL, chase camera)

| Track / spot | draw calls | triangles |
|---|---|---|
| Pacifica, cliff/lighthouse stretch | 42–91 | 236k–244k |
| Pacifica, hills + beach festival | 110–192 | 427k–516k |
| Revolution, average / worst | 190 / 337 | 546k / 1.34M |
| Alondra start | 242 | 580k |
| Neon Foundry start | 126 | 337k |

The benchmark (`?bench=pacifica`) now records these per shot on any device.

## 6. Where gameplay touches graphics (coupling to keep in mind)

- Physics and AI use only the track path (`buildTrackPath`, `P.*`) and the road hash. **They do not read
  meshes.** Good.
- The ground height used for scenery placement and the chase camera (`W.heightAt`) comes from the
  procedural height function or, on Revolution, from the environment's terrain tiles.
- Collision obstacles (`W.obstacles`) are produced inside the scenery builders, so scenery placement
  code and collision data are interleaved. Any Phase 2 re-dressing must keep emitting the same
  obstacle list (or the collision changes).
- `ENV_CFG` mixes visual switches (shadow regex, hide lists, fog) with "skip props" flags that affect
  which props exist (and therefore obstacles).

## 7. Biggest visual bottlenecks (ranked by expected visual gain)

1. **No image-based lighting on the world.** Everything except cars is lit by one sun plus a flat
   hemisphere, so surfaces look matte, flat and "prototype". A per-track PMREM sky probe as
   `scene.environment` is cheap (one texture) and lifts every PBR surface. *Low cost / very high impact.*
2. **Surface materials.** Large surfaces (Pacifica's cliff wall, rock, terrain, road) are one tiling
   base texture × vertex colour with **no normal, roughness or detail maps**: no micro-detail, visible
   repetition, no wet/dry or edge variation. *Medium cost / very high impact.*
3. **No post-processing.** No bloom for sun/neon/lanterns, no colour grading, no screen-space AO,
   no anti-aliasing when the pixel ratio drops below 1. *Medium GPU cost / high impact on High/Ultra.*
4. **Grounding and shadows.** A single 140 m shadow box, nothing beyond it, no contact/ambient
   occlusion: objects sit *on* the terrain rather than *in* it. *Medium cost / high impact.*
5. **Vegetation and dressing density.** Low-poly procedural/card trees without LOD or wind (except
   Revolution); sparse, repeated placement. The new Meshy assets can fix this once they have a game-ready
   pipeline. *Medium cost / high impact.*
6. **Road detail.** One ribbon texture, hard edges into shoulders, no decals (cracks, patches, rubber),
   no roughness variation. *Low-medium cost / medium-high impact.*
7. **Sky and atmosphere.** Flat gradients (clouds only on Revolution), linear fog, no aerial perspective
   or height fog. *Low cost / medium impact.*
8. **Aliasing and resolution on mobile.** 0.75 px ratio on Low with no post-AA; alpha-tested foliage
   shimmers. *Low cost / medium impact.*

## 8. Performance bottlenecks

- **Download size:** environment GLBs of 8–24 MB plus 20 MB of cars loaded at boot (no geometry or
  texture compression). The biggest single prop is `rrsign.glb` (11 MB, 133k tris, one 4096 texture).
- **Draw calls:** 150–340 at busy spots; the shadow pass re-draws casters. Merged-per-chapter meshes are
  large, which limits frustum culling.
- **CPU per frame (Revolution):** troop instancing is rebuilt every frame, flags recompute normals,
  and particle updates run on the CPU.
- **Wasted work:** the procedural terrain/road is always built and then hidden when an environment
  exists.

## 9. Technical debt noted (not fixed in Phase 1)

- `game.js` is still one 3.7k-line file (tracks, physics, UI, audio, online, world building, the
  Revolution runtime).
- Three separate PMREM builders (car/sky probe, neon, showroom), to consolidate in the
  EnvironmentManager.
- Shader code lives in inline strings next to gameplay code (Neon, Revolution).
- Name-regex driven shadow/hide rules (`ENV_CFG`) are brittle; move to per-object metadata exported
  from Blender.
- `Race.dispose()` disposes geometries and materials of scenes cloned from shared GLB caches (works
  because three.js re-uploads on demand, but causes re-uploads between races).
- The accidental `models 2/` upload (fixed on this branch; still present on `main`).
