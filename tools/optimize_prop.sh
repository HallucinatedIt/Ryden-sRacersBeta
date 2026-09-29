#!/usr/bin/env bash
# Graphics V2 · Phase 3 · browser-ready prop/vegetation GLB from a tools/blender/rr_prop_pipeline.py output
#
#   tools/optimize_prop.sh build/mz_dumpster.glb models/props/mz_dumpster.glb
#
# Needs npx @gltf-transform/cli (v4) and KTX-Software `ktx` (v4.3+) on PATH.
# Props are small on screen, so every texture is ETC1S (quality 200, alpha kept for impostor atlases);
# geometry is Meshopt-compressed. The lod0/lod1/lod2/lodImp node names are preserved (GFX.lod reads them).
set -euo pipefail
SRC="$1"; OUT="$2"; T=$(mktemp -d)
GT="npx --yes @gltf-transform/cli@4"
$GT etc1s "$SRC" "$T/a.glb" --quality 200
$GT meshopt "$T/a.glb" "$OUT" --level medium
rm -rf "$T"
