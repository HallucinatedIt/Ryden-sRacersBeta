#!/usr/bin/env python3
"""Material-ID mask for a Meshy car atlas (Graphics V2).

Meshy cars come as ONE material with a baked atlas (base colour + metal/roughness + normal), so paint,
glass, rubber and metal cannot get different shading. Until the car is split into real material slots in
Blender (the proper fix, see docs/graphics-v2/08-asset-optimization.md), this bakes a mask from the
textures the model already has:

    R = clearcoat amount   (painted body panels and glass)
    G = glass              (very dark, very glossy texels)
    B = bare metal         (metallic texels, or bright neutral glossy texels: chrome, polished alloy)

Everything else (dark and rough: tyres, trim, interior) keeps the atlas values with no clearcoat.

usage: tools/car_matid.py models/cars/gt40_base.jpg models/cars/gt40_mr.jpg models/cars/gt40_matid.png [size]
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

def main(base, mr, out, size=512):
    b = np.asarray(Image.open(base).convert('RGB').resize((size, size), Image.BILINEAR)).astype(np.float32) / 255
    m = np.asarray(Image.open(mr).convert('RGB').resize((size, size), Image.BILINEAR)).astype(np.float32) / 255
    R, G, B = b[..., 0], b[..., 1], b[..., 2]
    mx, mn = b.max(-1), b.min(-1)
    sat = (mx - mn) / (mx + 1e-5)
    lum = 0.2126 * R + 0.7152 * G + 0.0722 * B
    rough, metal = m[..., 1], m[..., 2]

    dark = mx < 0.2
    glass = dark & (rough < 0.24)
    metal_m = (metal > 0.4) | ((sat < 0.12) & (lum > 0.35) & (lum < 0.85) & (rough < 0.3))
    colour_paint = (sat > 0.35) & (mx > 0.25)                   # saturated livery colours
    light_paint = (lum > 0.55) & (sat < 0.25) & (rough < 0.45)   # white roundels, stripes
    dark_paint = dark & (rough >= 0.24) & (rough < 0.52)         # black body panels
    paint = (colour_paint | light_paint | dark_paint) & ~metal_m & ~glass

    cc = np.clip(paint * 1.0 + glass * 1.0, 0, 1)
    img = np.stack([cc, glass.astype(np.float32), metal_m.astype(np.float32)], -1)
    im = Image.fromarray((img * 255).astype(np.uint8), 'RGB').filter(ImageFilter.MedianFilter(3))
    im.save(out, optimize=True)
    tot = size * size
    print(f'{out}: paint {paint.sum()/tot:.1%} glass {glass.sum()/tot:.1%} metal {metal_m.sum()/tot:.1%} other {1-(paint|glass|metal_m).sum()/tot:.1%}')

if __name__ == '__main__':
    a = sys.argv[1:]
    main(a[0], a[1], a[2], int(a[3]) if len(a) > 3 else 512)
