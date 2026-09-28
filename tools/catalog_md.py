"""Renders docs/graphics-v2/01-asset-inventory.md from models/catalog.json."""
import json
C = json.load(open('models/catalog.json')); A = C['assets']
TN = {'sweet': 'Sweet Justice', 'mesa': 'Mojave Mesa', 'coast': 'Pacifica', 'neon': 'Neon Foundry', 'alondra': 'Alondra Blvd', 'country': 'Honky Tonk', 'revolution': 'Revolution', 'menu': 'Menu'}
CATN = {'playable_vehicle': 'Playable vehicles', 'decorative_vehicle': 'Decorative vehicles', 'building': 'Buildings', 'vegetation': 'Vegetation', 'infrastructure': 'Infrastructure',
        'hero_prop': 'Hero props', 'filler_prop': 'Filler props', 'track_specific': 'Track-specific assets', 'environment': 'Track environments'}
def k(n): return '%.1fM' % (n / 1e6) if n and n >= 1e6 else ('%dk' % round(n / 1000) if n else '-')
L = []
L.append('# Asset inventory\n')
L.append('Generated from [`models/catalog.json`](../../models/catalog.json) by `tools/catalog_md.py`. **%d assets**: %d already in the game, %d new Meshy models waiting in the Blender inbox.\n' % (len(A), sum(a['status'] == 'in_game' for a in A), sum(a['status'] == 'inbox' for a in A)))
L.append('## Where the new Meshy models are\n')
L.append('The 32 models sent from Meshy on 2026-09-28 had arrived **inside the open Revolution Blender file** (`revolution.blend`, collection `RR_Revolution`), all at the origin with generic names. They were:\n')
L.append('- moved into their own collection **`Meshy_Inbox`**, so the next Revolution export cannot pick them up by accident;')
L.append('- renamed `mx_<what it is>` (the original Meshy name is kept on each object as `rr_source`, with triangle and texture info as `rr_tris` / `rr_textures`);')
L.append('- saved to their own library file **`RydensRacers-Blender/meshy_inbox/meshy_inbox.blend`** (2.3 GB: the raw Meshy meshes are 0.5 to 8 million triangles each). The Revolution file itself was not re-saved.\n')
L.append('None of them is in the game yet: every one except five needs a game-ready export (decimation to the target budget, 1024/2048 texture caps, LODs) before use. Nothing was added to the playable car list.\n')
L.append('![Meshy inbox](img/meshy_inbox_sheet.jpg)\n')
L.append('## New Meshy models (inbox)\n')
L.append('| | id | category | role | tris now | target | textures | best tracks | notes |')
L.append('|---|---|---|---|---|---|---|---|---|')
for a in sorted([a for a in A if a['status'] == 'inbox'], key=lambda a: (a['category'], a['id'])):
    L.append('| <img src="img/meshy/%s.jpg" width="72"> | `%s` | %s | %s | %s | %s | %s | %s | %s |' % (a['id'], a['id'], CATN[a['category']], a['role'], k(a['tris']), k(a['targetTris']), a['textures'], ', '.join(TN[t] for t in a['tracks']), a['note']))
L.append('\n**Ready now or nearly ready** (under 30k triangles): `mx_dumpster` (9k), `mx_charred_stump` (10k), `mx_picnic_table` (10k), `mx_banana_plant` (21k), `mx_trash_can` (30k). They still need their 2048/4096 textures capped.\n')
L.append('**Heaviest:** `mx_fruit_tree` (8.2M), `mx_red_hot_poker_shrub` (5.2M), `mx_mossy_log` (3.4M), `mx_fly_agaric` (3.2M), `mx_generator_compressor` (2.9M, 4096 textures). Foliage models need a foliage-aware reduction (alpha cards or impostors), because a plain decimation to 10k turns leaves into blobs.\n')
L.append('**Candidate playable cars (your call, not added):** `mx_corvette_grand_sport`, `mx_rat_rod`, `mx_blown_muscle_sedan`. They are classified as decorative vehicles for now: parked displays at the Pacifica festival, a Route 99 garage, Alondra side streets.\n')
L.append('## Per-track shopping list\n')
for t in C['tracks']:
    ing = [a['id'] for a in A if a['status'] == 'in_game' and t in a['tracks'] and a['category'] != 'playable_vehicle']
    inb = [a['id'] for a in A if a['status'] == 'inbox' and t in a['tracks']]
    L.append('- **%s**: new candidates: %s. In game today: %s.' % (TN[t], ', '.join('`%s`' % x for x in inb) or 'none', ', '.join('`%s`' % x for x in ing) or 'environment only'))
L.append('')
L.append('## Already in the game\n')
for cat in ['playable_vehicle', 'environment', 'building', 'infrastructure', 'hero_prop', 'vegetation', 'track_specific']:
    rows = [a for a in A if a['status'] == 'in_game' and a['category'] == cat]
    if not rows: continue
    L.append('### %s\n' % CATN[cat])
    L.append('| id | file | tris | draw prims | textures | texture MB | file MB | tracks | notes |')
    L.append('|---|---|---|---|---|---|---|---|---|')
    for a in rows:
        L.append('| `%s` | `%s` | %s | %s | %s | %s | %s | %s | %s |' % (a['id'], a['file'], k(a['tris']), a.get('prims', '-'), a.get('textures', '-'), a.get('textureMB', '-'), a.get('fileMB', '-'), ', '.join(TN.get(t, t) for t in a['tracks']) or 'all', a['note']))
    L.append('')
L.append('## Observations\n')
L.append('- **Cars** are consistent (24 to 40k tris, one material, 1024/512/256 baked textures), except White Lightning (2048 textures, 3 MB).')
L.append('- **`rrsign`** is the most expensive prop (133k tris, a 4096 texture, 11 MB) and appears on several tracks. It needs a lighter version.')
L.append('- **`grandstand`** (99k tris) should get a LOD.')
L.append('- **Environment GLBs** total 105 MB and are downloaded per track with no geometry or texture compression. Meshopt plus KTX2 would roughly halve that.')
L.append('- **Duplicates / similar:** `palm` (3k, procedural-looking) vs `mx_palm_tree` (higher quality); `mx_fir_tree` / `mx_dark_pine` vs the Revolution card pines; `mx_brick_colonial_house` vs the procedural Revolution houses. The Meshy versions are upgrades, not additions.')
open('docs/graphics-v2/01-asset-inventory.md', 'w').write('\n'.join(L) + '\n')
print('ok', len(L))
