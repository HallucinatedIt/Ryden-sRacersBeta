# Phase 2 · GT40 Graphics V2 benchmark (vehicle materials)

The GT40 (`models/cars/gt40.glb`, id `gt44`) was **not remodelled**. It is a Meshy model: one mesh for
the body plus four wheel meshes, one material, and a baked atlas (1024² base colour, 256² metal/roughness,
512² normal map). A single material cannot give paint, glass, rubber and chrome different responses, so
Phase 2 adds a reusable vehicle material system, `js/gfx/vehicles.js`, and a material-ID mask for this car.

## What changed

| | Before (legacy) | Graphics V2 |
|---|---|---|
| Material | `MeshStandardMaterial` (atlas maps), `envMapIntensity 0.9` | `MeshPhysicalMaterial` built from the car's **profile** (`GFX.vehicles.PROFILES.gt44`) |
| Paint | the atlas roughness everywhere, no clear coat | painted texels: base roughness 0.42, non-metallic (solid race paint), **clear coat 0.85, clear-coat roughness 0.035**: a sharp top reflection over a softer base |
| Glass | same as the paint | texels classified as glass: darkened and tinted (0.16/0.19/0.20), roughness 0.03, clear coat: dark, mirror-like windows with a strong Fresnel edge |
| Metal (rims, trim, exhaust) | the atlas metalness (mostly 0) | metal texels: metalness 1, roughness 0.18: they reflect the sky and road instead of looking grey |
| Tyres | same material as the rims | wheel meshes get their own material: no clear coat; dark texels become rubber (roughness ≥ 0.88, slightly darkened) |
| Reflections | a small gradient env map made from the theme colours | the **same sky that lights the world** (PMREM of the V2 sky: horizon, sun glow, clouds, ground) |
| Lighting response | legacy lights, ACES | physical sun (3.7) + image-based sky light, soft shadow (PCF radius 2.2), GTAO contact shadow under the car and in the wheel arches, bloom on sun glints |
| Normal map | normalScale 1 | 0.8 (Meshy normals are noisy; less reads as cleaner bodywork) |

The side view in the benchmark (`ocean_low`) is where it shows best: the rims read as metal, the glass
is dark and reflective, the tyres are matte, and the red paint has a clear-coat highlight along the
shoulder line.

## The material-ID mask

`tools/car_matid.py models/cars/gt40_base.jpg models/cars/gt40_mr.jpg models/cars/gt40_matid.png`
classifies every atlas texel from the textures the car already has. **R** = clear coat (paint and
glass), **G** = glass (very dark and very glossy), **B** = bare metal (metallic, or bright neutral
glossy). Anything else is left as it is. For the GT40 the split is 76 % paint, 5 % glass, 4 % metal,
15 % other. The mask is a 512² PNG (22 KB). The shader reads it with the same UVs as the base texture.

**This is a stop-gap, and it is documented as one.** The proper fix is in Blender: separate the car into
material slots (paint, glass, rubber, chrome, lights, interior), or paint a clean ID map. The automatic
mask has limits: it cannot tell black paint from black plastic trim, and headlights and tail-lights are not
classified (they stay as painted atlas texels; the existing tail-glow sprite does the lights).

## The reusable part (for every other car)

`PROFILES` is data. A new car gets:

```js
duck:{ matid:'models/cars/duck_plasma_matid.png', paint:{roughness:0.3, metalness:0, clearcoat:1, clearcoatRoughness:0.05},
       glass:{...}, metal:{...}, rubber:{...}, env:1.0 }
```

That is enough for the truck, fish car, police car, duck car and luxury car to look materially different
(matte vs gloss paint, metallic flake via metalness, chrome amount). Cars without a profile get
`_generic`: clear coat 0.8 on GLB cars and the V2 environment on procedural cars. Phase 2 enables the
system only on the V2 track (Pacifica). The garage/showroom still uses the legacy materials (known issue 5).

## Texture work to do in Blender (recommended)

1. Split material slots as above (biggest win; removes the mask).
2. Headlight / tail-light glass as its own material, with an emissive map (for bloom at night and in tunnels).
3. A clean normal map for the bodywork (the Meshy normal map has noise and seams).
4. A 1024² metal/roughness map (the current 256² one is too coarse for the clear coat).
5. Interior: darken and add an AO bake, so the cockpit does not read as flat black.
