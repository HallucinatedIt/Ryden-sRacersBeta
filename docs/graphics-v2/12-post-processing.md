# Phase 2 · Post-processing report

`js/gfx/post.js`: a compact HDR pipeline owned by `GFX.renderer`. It runs only when a V2 look is active
(Pacifica) **and** the tier has `postFX`. Gameplay code never calls it. Each stage is switched per tier,
and developers can turn stages off one at a time with `?post=off|noao|nobloom|nohaze|nograde` to A/B them.

## Stages

| # | Effect | Implementation | Tier switch | Low | Medium | High | Ultra |
|---|---|---|---|---|---|---|---|
| 1 | **HDR scene + anti-aliasing** | Scene rendered to a HalfFloat target with **MSAA ×4** and a depth texture. MSAA is the AA (no SMAA/FXAA stacked on top); alpha-tested foliage gets alpha-to-coverage | `postFX`, `msaa` | direct render, canvas MSAA | ×4 | ×4 | ×4 |
| 2 | **Ambient occlusion** | three.js **GTAO**, fed the depth buffer (normals reconstructed from depth, so **no second scene pass**), half resolution, Poisson denoise; radius 0.9 m, intensity 0.85 | `ssao`, `ssaoSamples` | off | 8 samples | 12 | 16 |
| 3 | **Bloom** | "Physically based" bloom: 13-tap downsample chain (5 mips, Karis average on the first) + tent upsample. Soft threshold 1.6 (knee 0.7), energy clamp, intensity 0.05. Only HDR highlights bloom (sun glints on paint and water, the sun disk, signage), not the sky | `bloom` | off | on | on | on |
| 4 | **Aerial perspective / height haze** | In the composite, from the depth buffer: analytic exponential height fog (density 0.00045, falloff 0.011, starting at 25 m, sea level −9 m) with a warm in-scattering lobe towards the sun | with `postFX` | linear fog instead | on | on | on |
| 5 | **Tone mapping** | Khronos **PBR Neutral** (keeps hue and saturation, so no orange/teal shift); AgX and ACES are selectable per look | always | renderer Neutral | Neutral | Neutral | Neutral |
| 6 | **Colour grade** | White balance, saturation 1.08, contrast 1.05, lift/gamma/gain, optional **3D LUT** (`GFX.post.loadLUT('x.cube')`, 32³, blended by `lutIntensity`), vignette 0.14 | `colorGrade` | off | on | on | on |
| 7 | Sharpen | Luminance-only 4-tap sharpen, for when resolution is reduced (off at native) | `sharpen` | 0 | 0 | 0 | 0 |
| 8 | Dither | ±1/255 triangular noise before 8-bit output (no banding in the sky) | always | | on | on | on |

**Not added, on purpose:** gameplay motion blur, lens flares, chromatic aberration, film grain, and any
depth of field. The races stay readable at speed.

## Cost

Measured pass count per frame (Medium): **12 full-screen or partial passes** after the scene. The scene
MSAA resolve is 1, GTAO + denoise 2 (at ¼ of the pixels), bloom 5 down + 4 up (at ¼, 1/16, … of the
pixels) and 1 composite. In pixel work that is roughly:

| Stage | Relative cost (share of a native full-screen pass) | Notes |
|---|---|---|
| MSAA ×4 HDR target | the main extra cost: 4× samples for the colour buffer, 8 bytes/sample | on a mobile tile-based GPU MSAA is nearly free; on desktop it is bandwidth |
| GTAO (half res, 8–16 taps) + denoise | ≈ 0.5–1.0 | the most expensive single effect; off on Low |
| Bloom (5 mips) | ≈ 0.4 | the first downsample is the only large pass |
| Composite (AO, haze, tone map, grade, vignette, dither) | ≈ 1.0 | one pass, about 5 texture reads |

The frame times from the cloud test machine (software GPU) are not meaningful, so no milliseconds are
quoted here. The benchmark reports real milliseconds per shot on your Mac and phone (see 13 ·
Performance). If a stage turns out to be too expensive on a device, it is already one tier switch away.

## How to change the look

Everything that is art direction (exposure, tone mapper, grade, bloom strength, AO radius, haze
colours) lives in the track's look (`js/gfx/v2.js`, `LOOKS.coast`), not in the pipeline. A LUT can be
added per track by dropping a `.cube` file in the repo and setting `grade.lut` in the look.
