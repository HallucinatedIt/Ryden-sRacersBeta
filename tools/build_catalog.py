"""Builds models/catalog.json (the Graphics V2 asset inventory) from measured GLB metrics + curated classification.
Re-run after adding assets:  node tools/inventory.mjs models/**/*.glb > /tmp/inv.json ; python3 tools/build_catalog.py /tmp/inv.json"""
import json, sys
inv = {o['file']: o for o in json.load(open(sys.argv[1]))}
TR = ['sweet', 'mesa', 'coast', 'neon', 'alondra', 'country', 'revolution']
# ---- assets already in the game --------------------------------------------------------------
REPO = [
 # playable vehicles (GLB_DATA ids)
 ('hellcat','models/cars/hellcat.glb','playable_vehicle',[],'Colonial Hellcat (CordIsLoud)'),
 ('brcc','models/cars/rotor.glb','playable_vehicle',[],'BRCC (JT)'), ('fdc','models/cars/rrpickup.glb','playable_vehicle',[],'FDC pickup'),
 ('bpd','models/cars/bpd_69.glb','playable_vehicle',[],'BPD 69 (Rich)'), ('concord','models/cars/concordance.glb','playable_vehicle',[],'Concordance'),
 ('donut','models/cars/donut_patrol.glb','playable_vehicle',[],'Donut Patrol'), ('duck','models/cars/duck_plasma.glb','playable_vehicle',[],'Duck Plasma (Nic)'),
 ('gt44','models/cars/gt40.glb','playable_vehicle',[],'GT40 (menu showcase + graphics benchmark car)'), ('missile','models/cars/missile_commander.glb','playable_vehicle',[],'Missile Commander'),
 ('leopard','models/cars/night_leopard.glb','playable_vehicle',[],'Black Lightning (Pix)'), ('trout','models/cars/trout_protocol.glb','playable_vehicle',[],'Trout Protocol'),
 ('lightning','models/cars/white_lightning.glb','playable_vehicle',[],'White Lightning GT3 (Tackett) - 2048 textures, heaviest car'),
 ('genlee','models/cars/general_lee.glb','playable_vehicle',['country'],'General Lee (Nolan); also the Dukes-jump hero on Honky Tonk Highway'),
 # authored track environments (Blender)
 ('env_sweet','models/env/env_sweet.glb','environment',['sweet'],'Sweet Justice Circuit environment'),
 ('env_mesa','models/env/env_mesa.glb','environment',['mesa'],'Mojave Mesa Run environment'),
 ('env_coast','models/env/env_coast.glb','environment',['coast'],'Pacifica Cliffs environment (graphics benchmark)'),
 ('env_neon','models/env/env_neon.glb','environment',['neon'],'Neon Foundry Nights environment (runtime LED/wet-road shaders)'),
 ('env_alondra','models/env/env_alondra.glb','environment',['alondra'],'Alondra Boulevard environment'),
 ('env_revolution','models/env/env_revolution.glb','environment',['revolution'],'Revolution environment + runtime layout JSON'),
 ('showroom','models/env/showroom.glb','environment',['menu'],'Neon showroom (menu / garage)'),
 # props
 ('grandstand','models/props/grandstand.glb','infrastructure',['sweet','country'],'Grandstand (99k tris - LOD candidate)'),
 ('rrsign','models/props/rrsign.glb','hero_prop',['sweet','country'],"Ryden's Racers sign - 133k tris + 4096 texture: biggest prop cost, needs LOD/texture cap"),
 ('knives','models/props/knives.glb','hero_prop',['sweet','mesa','coast','neon','alondra','revolution'],'Maximus Knives billboard (house easter egg)'),
 ('hijoe','models/props/hijoe.glb','hero_prop',['sweet','mesa','coast','neon','alondra','country','revolution'],'Hi Joe billboard (house easter egg)'),
 ('trio','models/props/trio.glb','hero_prop',['country','revolution'],'The trio billboard (easter egg)'),
 ('donkeys','models/props/donkeys.glb','hero_prop',['country','revolution'],'Donkeys sign (easter egg)'),
 ('solocup','models/props/solocup.glb','hero_prop',['country'],'Red Solo Cup monument'), ('dolly','models/props/dolly.glb','hero_prop',['country'],'Dolly statue'),
 ('mrblack','models/props/mrblack.glb','hero_prop',['alondra'],'Mr Black (shooter hazard)'), ('ak','models/props/ak.glb','hero_prop',['alondra'],'Shooter rifle'),
 ('church','models/props/church.glb','building',['country'],'Country church'), ('gate','models/props/gate.glb','infrastructure',['country'],'Ranch gate'),
 ('watch_shop','models/props/watch_shop.glb','building',['sweet','alondra'],'Watch shop'), ('shoe_factory','models/props/shoe_factory.glb','building',['sweet','alondra','neon'],'Shoe factory'),
 ('watch_sign','models/props/watch_sign.glb','hero_prop',['sweet','alondra'],'Watch billboard'), ('range_sign','models/props/range_sign.glb','hero_prop',['mesa','alondra'],'Range billboard'),
 ('claw_can','models/props/claw_can.glb','hero_prop',['sweet','alondra'],'Giant can (median prop)'), ('echelon_can','models/props/echelon_can.glb','hero_prop',['sweet','alondra'],'Giant can (median prop)'),
 ('palm','models/props/palm.glb','vegetation',['sweet'],'Palm tree (3k tris) - mx_palm_tree is a higher-quality candidate'),
 ('rv_troops','models/props/rv_troops.glb','track_specific',['revolution'],'Revolution troops, 3 LODs each'), ('rv_props','models/props/rv_props.glb','track_specific',['revolution'],'Revolution props: wagon, inn, galleon, cannon'),
 ('rv_heroes','models/props/rv_heroes.glb','track_specific',['revolution'],'Francis Marion + Washington crossing'),
]
# ---- new Meshy models (Blender inbox: RydensRacers-Blender/meshy_inbox/meshy_inbox.blend, collection Meshy_Inbox) --------
# heightM = intended real-world height; targetTris = budget for a game-ready export (LOD0)
INBOX = [
 ('mx_palm_tree','vegetation',9.0,2290928,'2048',['coast','sweet','alondra'],'filler','Tall fan palm. Better silhouette than the 3k-tri palm prop; needs a card/foliage-aware reduction, not a plain decimate.',12000),
 ('mx_birch_tree','vegetation',11.0,2509704,'2048 x3',['country','revolution'],'filler','Birch/aspen. Saratoga autumn woods, Honky Tonk creek.',12000),
 ('mx_fir_tree','vegetation',12.0,2788067,'2048 x3',['revolution','country','coast'],'filler','Fir. Trenton/Delaware winter, Pacifica headland.',12000),
 ('mx_dark_pine','vegetation',12.0,1959040,'4096/2048',['revolution','mesa'],'filler','Sparse dark pine (needle geometry). Heavy 4096 textures - cap to 1024.',10000),
 ('mx_fruit_tree','vegetation',6.0,8243129,'2048',['sweet','alondra','coast'],'hero','Umbrella tree with hanging red fruit. 8.2M tris - heaviest asset; bake to a low-poly + cards.',15000),
 ('mx_banana_plant','vegetation',2.2,21462,'2048 x3',['sweet','alondra','coast'],'filler','Already game-ready (21k). Yards, shop fronts, coastal gardens.',8000),
 ('mx_fern','vegetation',1.0,1318231,'2048 x3',['revolution','coast','country'],'filler','Understory: swamp causeway, cliff gardens.',2500),
 ('mx_heather','vegetation',0.8,1563224,'2048 x3',['coast','revolution'],'filler','Coastal heather tufts along the Pacifica cliff road.',2000),
 ('mx_red_hot_poker_shrub','vegetation',1.3,5202045,'2048 x3',['coast','sweet'],'filler','Flowering shrub (kniphofia) - coastal/Californian gardens.',3000),
 ('mx_red_lily','vegetation',0.6,849592,'2048 x3',['sweet','alondra'],'filler','Flower accent for planters and front yards.',1500),
 ('mx_fly_agaric','vegetation',0.5,3245387,'2048 x3',['revolution','country'],'filler','Toadstool cluster. Saratoga woods floor / swamp easter egg.',2000),
 ('mx_mossy_log','vegetation',0.8,3358591,'2048 x3',['revolution','country'],'filler','Fallen mossy log: swamp causeway, creek banks.',3000),
 ('mx_charred_stump','vegetation',1.2,9769,'4096/2048 + emissive embers',['revolution','mesa'],'hero','Burnt stump with glowing embers (Bunker Hill / Charlestown burning). Game-ready tris; cap textures.',9769),
 ('mx_ibex','hero_prop',1.4,509143,'2048 x3',['mesa'],'hero','Mountain goat/ibex - perch it on a Mojave Mesa rock outcrop (bighorn stand-in).',8000),
 ('mx_brick_colonial_house','building',9.5,760204,'2048 x3',['revolution'],'hero','Georgian brick house with chimneys - big upgrade over the procedural houses in Yorktown/Trenton.',15000),
 ('mx_adobe_pueblo','building',6.0,1581785,'2048 x3',['mesa'],'hero','Adobe pueblo block - Route 99 desert settlement / trading post.',12000),
 ('mx_butcher_stall','hero_prop',2.6,797096,'4096',['revolution'],'filler','Colonial market stall - Lexington green / Yorktown market.',8000),
 ('mx_timber_gate','infrastructure',3.0,939906,'2048 x3',['revolution','country'],'filler','Palisade gate with lantern - camp/fort entrances, ranch gates.',6000),
 ('mx_iron_spike_fence','infrastructure',2.0,769860,'2048 x4',['alondra','sweet'],'filler','Wrought-iron fence section - front yards, lots. Tileable run.',2000),
 ('mx_graffiti_brick_wall','infrastructure',2.5,684755,'2048 x3',['alondra','sweet','neon'],'filler','Graffiti brick wall panel - alleys, lots, underpasses.',2000),
 ('mx_metal_stairs','infrastructure',1.6,181334,'2048 x4',['neon'],'filler','Industrial steps with rail - Neon Foundry catwalks, grandstand access.',2500),
 ('mx_generator_compressor','infrastructure',1.3,2930188,'4096/2048',['neon','mesa','alondra'],'filler','Portable generator/compressor - work sites, foundry yard, gas station.',4000),
 ('mx_ac_condenser','infrastructure',1.0,931630,'2048',['alondra','sweet','neon'],'filler','AC condenser - beside houses, shops and rooftops.',2000),
 ('mx_ice_freezer','infrastructure',1.3,429706,'2048 x3',['mesa','sweet','alondra'],'filler','Gas-station ICE freezer - Route 99 gas stop, liquor-store fronts.',3000),
 ('mx_atm','infrastructure',1.8,164141,'2048 x3',['alondra','sweet'],'filler','Street ATM - storefronts on Alondra/Compton.',3000),
 ('mx_dumpster','infrastructure',1.3,9420,'2048 x3',['alondra','sweet','neon','mesa'],'filler','Game-ready (9k). Alleys, lots, foundry yard.',9420),
 ('mx_trash_can','infrastructure',1.0,29996,'2048 x3',['sweet','alondra','coast','neon'],'filler','Galvanised trash can. Near game-ready (30k).',3000),
 ('mx_picnic_table','infrastructure',0.8,9998,'2048 x3',['coast','mesa','country'],'filler','Game-ready (10k). Pacifica overlooks, desert rest stop, camps.',9998),
 ('mx_rat_rod','decorative_vehicle',1.5,1697217,'2048',['mesa','country','neon'],'hero','Blown rat rod - parked hero at a Route 99 garage or the Neon pits. Candidate playable car (your call).',25000),
 ('mx_panel_truck','decorative_vehicle',2.2,694483,'2048 x4',['alondra','neon','sweet'],'filler','Vintage black panel/delivery truck - parked on side streets, foundry yard.',15000),
 ('mx_blown_muscle_sedan','decorative_vehicle',1.5,858473,'4096/2048',['alondra','sweet'],'filler','Black sedan with blower - parked outside shops/houses. Candidate playable car.',15000),
 ('mx_corvette_grand_sport','decorative_vehicle',1.2,1439181,'2048 x3',['coast','sweet'],'hero','#12 Grand Sport racer - paddock/festival display at Pacifica. Candidate playable car.',25000),
]
out = {'version': 1, 'note': 'Graphics V2 asset inventory. status: in_game | inbox (not yet exported for the game). Categories: playable_vehicle, decorative_vehicle, building, vegetation, infrastructure, hero_prop, filler_prop, track_specific, environment.', 'tracks': TR, 'assets': []}
for id_, path, cat, tracks, note in REPO:
    m = inv.get(path, {}); out['assets'].append({'id': id_, 'status': 'in_game', 'file': path, 'category': cat, 'tracks': tracks, 'note': note,
        'tris': m.get('tris'), 'prims': m.get('prims'), 'materials': m.get('mats'), 'textures': m.get('tex'), 'textureMB': m.get('texMB'), 'fileMB': m.get('MB'), 'size': m.get('size')})
for id_, cat, h, tris, tex, tracks, role, note, target in INBOX:
    out['assets'].append({'id': id_, 'status': 'inbox', 'blend': 'RydensRacers-Blender/meshy_inbox/meshy_inbox.blend#Meshy_Inbox/' + id_, 'category': cat, 'role': role, 'tracks': tracks, 'note': note,
        'tris': tris, 'textures': tex, 'heightM': h, 'targetTris': target, 'thumb': 'docs/graphics-v2/img/meshy/%s.jpg' % id_})
json.dump(out, open('models/catalog.json', 'w'), indent=1)
print(len(out['assets']), 'assets')
