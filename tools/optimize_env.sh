#!/usr/bin/env bash
# Graphics V2 · optimized browser variant of an environment GLB (KTX2/Basis textures + Meshopt geometry)
#
#   tools/optimize_env.sh models/env/env_coast.glb models/env/env_coast.v2.glb
#
# Needs: npx @gltf-transform/cli (v4) and the KTX-Software `ktx` tool (v4.3+) on PATH
#        (https://github.com/KhronosGroup/KTX-Software/releases).
#
# Texture choices are per texture, not one preset for everything:
#   UASTC (+RDO, zstd)  text and signage (signs, gantry atlas, Maximus billboard) and the asphalt:
#                       the things the player reads or stares at; ~BC7/ASTC quality.
#   ETC1S (quality 230) rock, ground, concrete, steel, wood, curb, foam, checker: organic or small
#                       textures where ETC1S artifacts disappear; tiny files.
# Colour textures keep the sRGB transfer function (gltf-transform assigns it from the glTF slot), alpha is
# kept (foam), UVs and material slots are untouched. Geometry: Meshopt (EXT_meshopt_compression), which
# three.js decodes with MeshoptDecoder. The original GLB is never modified: the game loads the variant
# only on the Graphics V2 pipeline (GFX.assets.VARIANTS), ?gfx=legacy / ?origassets load the original.
set -euo pipefail
SRC="$1"; OUT="$2"; T=$(mktemp -d)
GT="npx --yes @gltf-transform/cli@4"
# texture sets per track (override with UASTC=... ETC1S=... in the environment)
#   Mojave: ETC1S="{rock,strata,ground,curb,wood,steel,tin,checker,concrete_hazard}"
[ -n "${UASTC:-}" ] || UASTC='{signs,gantry_atlas,maximus_face,asphalt}'
[ -n "${ETC1S:-}" ] || ETC1S='{coast_rock,ground,curb,wood,foam,concrete_coast,steel,tin,checker}'
$GT uastc "$SRC" "$T/a.glb" --pattern "$UASTC" --level 2 --rdo --rdo-lambda 1.5 --zstd 20
$GT etc1s "$T/a.glb" "$T/b.glb" --pattern "$ETC1S" --quality 230
$GT meshopt "$T/b.glb" "$OUT" --level medium
$GT inspect "$OUT" | sed -n '/TEXTURES/,$p' | head -30
rm -rf "$T"
