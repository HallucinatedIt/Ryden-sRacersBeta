
const GLB_DATA={"env_revolution": "models/env/env_revolution.glb?v=3", "rv_troops": "models/props/rv_troops.glb?v=1", "rv_props": "models/props/rv_props.glb?v=2", "rv_heroes": "models/props/rv_heroes.glb?v=1", "env_alondra": "models/env/env_alondra.glb?v=1790529128", "env_neon": "models/env/env_neon.glb?v=1790473659", "showroom": "models/env/showroom.glb?v=1790463204", "env_coast": "models/env/env_coast.glb?v=1790457650", "env_mesa": "models/env/env_mesa.glb?v=1790446322", "env_sweet": "models/env/env_sweet.glb?v=1790439367", "grandstand": "models/props/grandstand.glb?v=1790402370", "rrsign": "models/props/rrsign.glb?v=1790402370", "dolly": "models/props/dolly.glb?v=1790402370", "knives": "models/props/knives.glb?v=1790402370", "trio": "models/props/trio.glb?v=1790402370", "gate": "models/props/gate.glb?v=1790402370", "solocup": "models/props/solocup.glb?v=1790402370", "church": "models/props/church.glb?v=1790402370", "donkeys": "models/props/donkeys.glb?v=1790402370", "hijoe": "models/props/hijoe.glb?v=1790402370", "palm": "models/props/palm.glb?v=1790402370", "mrblack": "models/props/mrblack.glb?v=1790402370", "ak": "models/props/ak.glb?v=1790402370", "hellcat": "models/cars/hellcat.glb?v=1790402370", "brcc": "models/cars/rotor.glb?v=1790402370", "fdc": "models/cars/rrpickup.glb?v=1790402370", "shoe_factory": "models/props/shoe_factory.glb?v=1790402370", "claw_can": "models/props/claw_can.glb?v=1790402370", "echelon_can": "models/props/echelon_can.glb?v=1790402370", "watch_shop": "models/props/watch_shop.glb?v=1790402370", "watch_sign": "models/props/watch_sign.glb?v=1790402370", "range_sign": "models/props/range_sign.glb?v=1790402370", "bpd": "models/cars/bpd_69.glb?v=1790402370", "concord": "models/cars/concordance.glb?v=1790402370", "donut": "models/cars/donut_patrol.glb?v=1790534633", "duck": "models/cars/duck_plasma.glb?v=1790402370", "gt44": "models/cars/gt40.glb?v=1790402370", "missile": "models/cars/missile_commander.glb?v=1790402370", "leopard": "models/cars/night_leopard.glb?v=1790402370", "trout": "models/cars/trout_protocol.glb?v=1790402370", "lightning": "models/cars/white_lightning.glb?v=1790534633", "genlee": "models/cars/general_lee.glb?v=1790474099", "eggplant": "models/cars/screaming_eggplant.glb?v=1", "voyager": "models/cars/midnight_voyager.glb?v=1", "pbboard": "models/props/pepperbox_board.glb?v=1", "pbpole": "models/props/pepperbox_pole.glb?v=1"};
const GLB_TEX={};
"use strict";
// ===== UTILITIES =====
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
let RNG=mulberry32(1);
function seed(s){RNG=mulberry32(s);}
const rnd=()=>RNG(); const rr=(a,b)=>a+(b-a)*RNG(); const pick=a=>a[Math.floor(RNG()*a.length)];
const NoiseP=new Uint8Array(512);(()=>{const r=mulberry32(99);const p=[...Array(256).keys()];for(let i=255;i>0;i--){const j=Math.floor(r()*(i+1));const t=p[i];p[i]=p[j];p[j]=t;}for(let i=0;i<512;i++)NoiseP[i]=p[i&255];})();
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y);const xf=x-xi,yf=y-yi;const h=(i,j)=>NoiseP[(NoiseP[(xi+i)&255]+yi+j)&255]/255;const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);return lerp(lerp(h(0,0),h(1,0),u),lerp(h(0,1),h(1,1),u),v);}
function fbm(x,y,o=4){let s=0,a=0.5,f=1;for(let i=0;i<o;i++){s+=a*vnoise(x*f,y*f);f*=2.03;a*=0.5;}return s;}
function angDiff(a,b){let d=b-a;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return d;}
function ordinal(n){const s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);}
function ordSuffix(n){return ordinal(n).replace(/^\d+/,'');}
function fmtTime(t){ if(t==null||!isFinite(t)) return '--:--.---'; const m=Math.floor(t/60), s=t-m*60; return m+':'+(s<10?'0':'')+s.toFixed(3); }
function canvasTex(w,h,draw,opts={}){
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);
  const t=new THREE.CanvasTexture(c); if(opts.srgb!==false) GFX.compat.srgb(t);
  t.anisotropy=opts.aniso||4; if(opts.repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;}
  if(opts.clampU){t.wrapS=THREE.ClampToEdgeWrapping;}
  return t;
}
function noiseFill(g,w,h,base,amt,n=0.5){
  g.fillStyle=base; g.fillRect(0,0,w,h);
  const id=g.getImageData(0,0,w,h),d=id.data;
  for(let i=0;i<d.length;i+=4){const r=(Math.random()-0.5)*amt;d[i]+=r;d[i+1]+=r;d[i+2]+=r;}
  g.putImageData(id,0,0);
}
// merge simple non-indexed/indexed geometries (position/normal/uv) into one
function mergeGeos(list){
  let total=0; const parts=list.map(g=>{g=g.index?g.toNonIndexed():g; total+=g.attributes.position.count; return g;});
  const pos=new Float32Array(total*3),nor=new Float32Array(total*3),uv=new Float32Array(total*2),col=new Float32Array(total*3);
  let o=0; const hasCol=parts.some(p=>p.attributes.color);
  parts.forEach(g=>{const n=g.attributes.position.count; pos.set(g.attributes.position.array,o*3);
    if(g.attributes.normal) nor.set(g.attributes.normal.array,o*3);
    if(g.attributes.uv) uv.set(g.attributes.uv.array,o*2);
    if(hasCol){ if(g.attributes.color) col.set(g.attributes.color.array,o*3); else for(let i=0;i<n*3;i++) col[o*3+i]=1; }
    o+=n;});
  const G=new THREE.BufferGeometry(); G.setAttribute('position',new THREE.BufferAttribute(pos,3)); G.setAttribute('normal',new THREE.BufferAttribute(nor,3)); G.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  if(hasCol) G.setAttribute('color',new THREE.BufferAttribute(col,3));
  return G;
}
function tintGeo(g,c){ g=g.index?g.toNonIndexed():g; const n=g.attributes.position.count; const a=new Float32Array(n*3); const col=new THREE.Color(c); for(let i=0;i<n;i++){a[i*3]=col.r;a[i*3+1]=col.g;a[i*3+2]=col.b;} g.setAttribute('color',new THREE.BufferAttribute(a,3)); return g; }
const Store={
  get(k,d){try{const v=localStorage.getItem('rydens_'+k);return v?JSON.parse(v):d;}catch(e){return d;}},
  set(k,v){try{localStorage.setItem('rydens_'+k,JSON.stringify(v));}catch(e){}}
};

// ===== TRACK DEFINITIONS =====
// Black Rifle Rallycross control points (metres x 0.88): [x, z, y, width]. cp 2 and cp 15 are the same spot seen from the two
// roads that cross there: the start straight at ground level, the upper straight in the air (the jump's gap).
function rallyPoints(){ const S=0.88, W=16; return [
  [0,-80,0],[0,-25,0],[0,30,0],[0,50,0],[0,62,0],[15,74,0],[15,92,0],[24,150,0.5],[55,190,1.5],[105,200,2.5],[152,175,3.5],[170,125,4.5],[160,70,5],
  [125,36,5],[70,30,5],[0,30,3.5],[-70,30,2],[-125,25,1.5],[-165,-5,1.5],[-175,-55,3],[-172,-110,7],[-165,-170,1],[-135,-215,0],[-80,-230,0],[-30,-205,0],[-5,-150,0]
 ].map(p=>[Math.round(p[0]*S*10)/10,Math.round(p[1]*S*10)/10,p[2],W]); }
// Oval control points: two straights (S) and two half circles (R), driven counter-clockwise (left turns), 40 points by arc
// length starting 55 % along the front straight.
function ovalPoints(){ const S=210, R=68, W=22, NP=40, L=2*S+2*Math.PI*R, s0=0.55*S, out=[];
  for(let k=0;k<NP;k++){ let s=(s0+k*L/NP)%L, x, z;
    if(s<S){ x=0; z=-S/2+s; } else if((s-=S)<Math.PI*R){ const a=Math.PI-s/R; x=R+R*Math.cos(a); z=S/2+R*Math.sin(a); }
    else if((s-=Math.PI*R)<S){ x=2*R; z=S/2-s; } else { s-=S; const a=-s/R; x=R+R*Math.cos(a); z=-S/2+R*Math.sin(a); }
    out.push([Math.round(x*10)/10,Math.round(z*10)/10,0,W]); }
  return out; }
// Figure 8 control points: two circles (radius R, centres +-d on x) joined by their two inner tangents, which cross at the
// origin. 40 points by arc length, starting 40 % along the flat diagonal; the other diagonal climbs to H over the crossing.
function fig8Points(){ const R=80, d=145, W=18, H=10, RAMP=150, s=R/d, c=Math.sqrt(1-s*s), al=Math.asin(s), pts=[];
  const seg=(a,b,n)=>{ for(let k=0;k<n;k++){ const t=k/n; pts.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]); } };
  const arc=(cx,a0,a1,n)=>{ for(let k=0;k<n;k++){ const a=a0+(a1-a0)*k/n; pts.push([cx+R*Math.cos(a),R*Math.sin(a)]); } };
  const A1=[-d*c*c,-d*c*s], B1=[d*c*c,d*c*s], B2=[d*c*c,-d*c*s], A2=[-d*c*c,d*c*s];
  seg(A1,B1,240); arc(d,Math.PI/2+al,-(Math.PI/2+al),345); const bridge=pts.length+120; seg(B2,A2,240); arc(-d,Math.PI/2-al,1.5*Math.PI+al,345);
  const n=pts.length, cum=[0]; for(let k=1;k<=n;k++){ const a=pts[k-1], b=pts[k%n]; cum.push(cum[k-1]+Math.hypot(b[0]-a[0],b[1]-a[1])); }
  const L=cum[n], sB=cum[bridge], s0=cum[96], NP=40, out=[];
  for(let k=0;k<NP;k++){ const sk=(s0+k*L/NP)%L; let j=0; while(j<n-1&&cum[j+1]<sk) j++; const a=pts[j], b=pts[(j+1)%n], t=(sk-cum[j])/Math.max(1e-6,cum[j+1]-cum[j]);
    let dd=Math.abs(sk-sB); dd=Math.min(dd,L-dd); const y=dd<RAMP?H*0.5*(1+Math.cos(Math.PI*dd/RAMP)):0;
    out.push([Math.round((a[0]+(b[0]-a[0])*t)*10)/10, Math.round((a[1]+(b[1]-a[1])*t)*10)/10, Math.round(y*100)/100, W]); }
  return out; }
// points: [x, z, y, width]
const TRACK_DATA = [
{
  id:'sweet', name:'Sweet Justice Circuit', place:'Compton Heights',
  blurb:'Sun-baked city blocks, palm-lined boulevards and a hilltop crest jump past the donut shop.',
  theme:'city', laps:3,
  points:[
    [0,-40,0,22],[0,60,0,22],[0,170,0,22],[6,240,0,20],[45,275,0,18],[120,282,1,16],
    [175,272,2,14],[205,292,3,14],[240,282,4,15],[300,282,6,16],[345,260,8,16],[362,215,9,16],
    [362,165,10,16],[360,110,6,17],[352,55,1,18],[330,15,0,18],[352,-30,0,17],[330,-72,0,16],
    [290,-115,0,15],[235,-135,0,13],[175,-128,0,13],[125,-140,0,13],[80,-160,0,14],[38,-150,0,16],[10,-110,0,20]
  ],
  jumps:[{cp:12,f:0.55,len:14,h:2.6,gap:0}],
  boosts:[{cp:1,f:0.4,lat:0},{cp:13,f:0.3,lat:-3},{cp:20,f:0.5,lat:0}],
  items:[{cp:2,f:0.3},{cp:15,f:0.5},{cp:21,f:0.2}],
  medians:[{cp:0,f:0.2,len:120,w:3}],
},
{
  id:'mesa', name:'Mojave Mesa Run', place:'Route 99 Desert',
  blurb:'Endless yellow lines, a mesa-top hairpin, a narrow slot canyon and a leap over the dry wash.',
  theme:'desert', laps:3,
  points:[
    [0,-40,0,20],[0,120,0,20],[0,300,0,20],[20,430,1,19],[90,520,3,18],[200,550,5,17],[300,520,8,16],
    [360,450,12,16],[385,380,14,17],[360,330,14,17],[310,340,13,15],[265,370,11,14],[215,330,8,13],
    [200,260,5,13],[205,190,3,16],[200,110,2,18],[230,40,2,18],[290,-30,2,17],[270,-110,1,16],[200,-150,0,17],
    [120,-160,0,18],[50,-140,0,19],[12,-95,0,20]
  ],
  jumps:[{cp:14,f:0.45,len:12,h:3.2,gap:14}],
  boosts:[{cp:1,f:0.6,lat:4},{cp:14,f:0.15,lat:0},{cp:18,f:0.5,lat:0}],
  items:[{cp:2,f:0.2},{cp:10,f:0.5},{cp:19,f:0.5}],
  medians:[],
},
{
  id:'coast', name:'Pacifica Cliffs', place:'Pacifica Coast Highway',
  blurb:'Golden-hour cliff road above the surf: tunnel, lighthouse, a downhill hairpin and blind crests.',
  theme:'coast', laps:3,
  points:[
    [0,-40,2,17],[0,100,3,17],[-20,210,6,16],[5,290,9,15],[-18,360,11,15],[4,430,12,15],[0,520,14,16],
    [-12,610,18,16],[-5,690,17,16],[35,730,15,16],[80,705,13,16],[95,640,11,17],[90,550,8,17],
    [120,470,6,16],[140,380,8,16],[120,290,10,16],[140,200,6,17],[120,110,3,18],[100,20,2,18],[80,-60,2,17],[40,-90,2,17],[10,-75,2,17]
  ],
  jumps:[{cp:15,f:0.6,len:12,h:2.2,gap:0}],
  boosts:[{cp:1,f:0.5,lat:0},{cp:12,f:0.5,lat:3},{cp:17,f:0.5,lat:0}],
  items:[{cp:2,f:0.7},{cp:11,f:0.3},{cp:18,f:0.4}],
  tunnels:[{cp:5,f:0.2,len:70}],
  medians:[],
},
{
  id:'neon', name:'Neon Foundry Nights', place:'Harbor Steelworks', rev:2,
  blurb:'Midnight in the steelworks: an LED light-show straight, a weave through the glowing foundry, a leap across the canal and a tight chicane back to the arena.',
  theme:'night', laps:3,
  points:[
    [0,-60,0,22],[0,60,0,22],[0,150,0,20],[14,205,0,18],[55,234,0.3,18],[140,242,0.6,18],
    [260,242,1,18],[380,240,1,18],[438,220,1,17],[470,168,1,16],[452,108,1.5,16],[482,45,2,16],
    [462,-15,3.5,16],[468,-62,7,16],[470,-150,6,16],[455,-200,4.5,15],[412,-226,3,15],[352,-207,2,14],
    [302,-233,1,14],[252,-207,0.5,14],[202,-233,0,14],[140,-214,0,15],[76,-200,0,16],[34,-160,0,18],
    [8,-112,0,20]
  ],
  jumps:[{cp:13,f:0.3,len:12,h:3.0,gap:16}],
  boosts:[{cp:1,f:0.3,lat:-4},{cp:1,f:0.3,lat:4},{cp:6,f:0.15,lat:0},{cp:13,f:0.02,lat:0},{cp:22,f:0.5,lat:0}],
  items:[{cp:2,f:0.35},{cp:10,f:0.5},{cp:21,f:0.4}],
  medians:[],
},
{
  id:'alondra', name:'Alondra Boulevard', place:'Compton, CA', rev:2,
  blurb:'A late-afternoon street race through the Hub City: shop-lined Alondra Blvd, quiet bungalow blocks, the auto-row climb over the rail overpass and a mural alley weave. Three Hot Blocks are live, so watch for the warning signs.',
  note:'Home-track advantage: BPD 69 and Donut Patrol run about 4 mph faster here.',
  theme:'city', sky:'dusk', laps:3, hard:true,
  points:[
    [0,-40,0,20],[0,80,0,19],[0,190,0,17],[10,245,0,15],[55,262,0,15],[120,262,0,15],
    [170,250,1,14],[205,270,1,14],[250,262,2,15],[290,235,3,15],[300,180,4,15],[300,110,6,15],
    [295,50,3,15],[270,10,1,14],[230,5,0,14],[215,40,0,14],[190,70,0,14],[150,70,0,15],
    [120,40,0,15],[120,-20,0,15],[140,-70,0,15],[130,-120,0,14],[90,-145,0,14],[50,-130,0,15],
    [25,-160,0,15],[-10,-150,0,17],[-15,-100,0,19]
  ],
  jumps:[{cp:11,f:0.5,len:13,h:2.4,gap:0}],
  boosts:[{cp:1,f:0.5,lat:0},{cp:10,f:0.3,lat:0},{cp:19,f:0.4,lat:0}],
  items:[{cp:2,f:0.2},{cp:12,f:0.6},{cp:20,f:0.3}],
  medians:[{cp:0,f:0.3,len:90,w:2.5}],
  // Hot Blocks: shooter perches [index offset, side, metres beyond the wall, perch height, fire window kmin, kmax (track samples with verified clear line of sight)]; balconies/alley mouths are built in the Blender environment
  shooters:[{cp:4,f:0.3,perches:[[0,-1,5.0,3.7,-25,26],[18,1,4.6,0.25,-26,26]]},{cp:13,f:0.1,perches:[[0,-1,4.6,0.25,-26,26],[18,1,5.0,3.7,-26,26]]},{cp:22,f:0.2,perches:[[0,-1,5.0,3.7,-26,1],[18,1,4.6,0.25,-26,26]]}],
},
{
  id:'country', name:'Honky Tonk Highway', place:'Red Dirt Country, OK', rev:2,
  blurb:'An ode to the legends of country music: red dirt, rolling hills and a covered bridge. Loop the Red Solo Cup roundabout, then hit the Yee-Haw Creek Jump and fly the creek good-ol\'-boy style. A church on the hill and one very honest donkey sign.',
  theme:'country', laps:3,
  points:[
    [0,-60,0,17],[0,60,1,17],[2,165,3,16],[-12,228,5,15],[-45,252,6,14],[-78,234,5,14],
    [-82,196,4,14],[-68,160,3,14],[-58,122,2,14],[-72,86,2,14],[-95,76,2,14],[-118,86,2,14],
    [-132,122,2,14],[-122,160,3,14],[-108,196,4,14],[-112,234,5,14],[-148,257,5,14],
    [-205,212,4,14],[-222,148,3,13],[-232,70,1,13],[-248,-10,0,13],[-236,-100,0,13],[-196,-165,1,13],
    [-128,-196,3,13],[-62,-178,6,14],[-8,-205,4,14],[55,-240,2,13],[118,-232,0,13],[170,-182,0,13],
    [214,-108,2,13],[236,-28,4,14],[214,48,6,14],[156,84,6,13],[104,58,4,13],[82,4,2,13],
    [70,-58,1,14],[52,-118,0,15],[16,-138,0,16],[-6,-108,0,17]
  ],
  jumps:[{cp:24,f:0.2,len:14,h:2.8,gap:0},{cp:27,f:0.15,len:16,h:4.4,gap:20,dukes:true}],
  boosts:[{cp:1,f:0.45,lat:0},{cp:13,f:0.5,lat:0},{cp:19,f:0.5,lat:-3},{cp:26,f:0.55,lat:0},{cp:30,f:0.4,lat:3}],
  items:[{cp:2,f:0.3},{cp:10,f:0.2},{cp:20,f:0.6},{cp:25,f:0.5},{cp:31,f:0.5},{cp:36,f:0.3}],
  medians:[],
  tunnels:[{cp:20,f:0.75,len:44}],
  creek:[[-420,-60],[-236,-78],[-120,-120],[40,-190],[148,-210],[320,-250],[520,-300]],
  monument:{x:-95,z:124},
  mud:{cp:18,f:0.5,len:72}, mudBoxes:{cp:18,f:0.1},
},
{
  id:'revolution', name:"Y'all Fuck With Racin?", place:'The American Revolution · 1775–1781', account:true,
  blurb:'Drag-race a quarter mile down the Swamp Fox\'s causeway behind Francis Marion himself, then blast through the portal into the Revolution: Lexington & Concord, the Bunker Hill redoubt, Washington\'s crossing of the icy Delaware, snowbound Trenton, Saratoga\'s autumn woods and the siege lines of Yorktown. The swamp drag strip is a one-time opening; Yorktown is the lap line and the finish.',
  note:'Account-exclusive flagship track. Lap 1 includes the swamp opening; best laps count full circuit laps only.',
  theme:'country', sky:'revolution', laps:3,
  points:[
    [0,-20,0,22],[3,80,0,22],[-12,170,0,21],[-2,260,0.3,20],[-16,350,0.5,19],[-22,420,0.8,18],
    [-24,500,1,16],[-14,570,1.5,15],[10,610,1.8,15],[60,622,2,15],[140,626,2,15],[185,650,1.5,16],[200,705,1.2,16],[196,780,2.4,17],[205,850,1.8,16],
    [240,905,3,16],[300,925,4,16],
    [380,930,7,16],[460,975,12,15],[520,1045,17,15],[585,1085,21,15],[650,1080,22,15],[705,1045,19,14],[735,985,15,15],[760,900,10,15],
    [800,830,6,15],[860,790,4,15],
    [915,730,3,16],[935,640,2,17],[945,540,2,17],[945,440,2,17],[935,370,2,16],[960,330,2.5,16],[1010,318,3,15],[1080,318,3,15],[1140,318,3,15],
    [1175,300,3,14],[1188,250,3,14],[1188,180,3,14],[1205,150,3,14],[1260,145,3,14],[1290,120,3,14],[1296,60,3,14],[1285,0,3,14],
    [1240,-60,4,15],[1170,-100,5,15],[1140,-170,6,15],[1165,-250,7,15],[1150,-340,8,15],[1090,-390,7,15],[1020,-360,6,15],[960,-390,5,15],[950,-470,4,15],[990,-540,3,15],[950,-610,2,15],[870,-620,2,15],[820,-560,2,15],
    [790,-490,2,16],[730,-470,2,16],[690,-505,2,15],[645,-515,2,15],[605,-485,2,16],[560,-470,2,18],[490,-480,2,20],[420,-470,2,22],[350,-455,2,24],[290,-450,2,24],[240,-448,2,22],
    [180,-445,1,20],[110,-410,1,20],
    // hidden connector: Yorktown -> the Swamp Fox's causeway far to the west (never raced; cars go through the return portal)
    [30,-450,0.8,20],[-110,-510,0.6,20],[-290,-545,0.5,22],[-460,-520,0.4,24],[-552,-430,0.35,26],
    // the drag strip: dead straight quarter mile on a causeway through the swamp, grid at z=-150, entry portal at z=+252
    [-560,-300,0.35,26],[-560,-200,0.35,26],[-560,-100,0.35,26],[-560,0,0.35,26],[-560,100,0.35,26],[-560,200,0.35,26],[-560,300,0.35,26],[-560,400,0.35,26],
    // hidden connector: past the entry portal and back to the old swamp line that leads into Concord (only the Concord arrival gate is visible)
    [-515,520,0.3,22],[-405,545,0.3,22],[-300,430,0.3,22],[-240,210,0.3,22],[-185,-10,0.3,22],[-115,-185,0.3,22],[12,-230,0,22],[2,-120,0,22]
  ],
  route:{start:[76,0.5],entry:[80,0.52],circ:[5,0.2],york:[65,0.1],ret:[67,0.35],pole:'hellcat'},
  chapters:[{id:'swamp',at:[0,0],label:'THE SWAMP FOX',year:'SOUTH CAROLINA'},{id:'lexington',at:[5,0.25],label:'LEXINGTON & CONCORD',year:'1775'},{id:'bunker',at:[16,0.3],label:'BUNKER HILL',year:'1775'},
    {id:'delaware',at:[25,0.5],label:'CROSSING THE DELAWARE',year:'1776'},{id:'trenton',at:[35,0.6],label:'TRENTON',year:'1776'},{id:'saratoga',at:[44,0.2],label:'SARATOGA',year:'1777'},{id:'yorktown',at:[57,0.2],label:'YORKTOWN',year:'1781'}],
  jumps:[], boosts:[{cp:78,f:0.5,lat:-5},{cp:78,f:0.5,lat:5},{cp:28,f:0.4,lat:0},{cp:45,f:0.5,lat:0},{cp:63,f:0.3,lat:0}],
  items:[{cp:79,f:0.4},{cp:10,f:0.3},{cp:20,f:0.3},{cp:33,f:0.5},{cp:49,f:0.4},{cp:61,f:0.5}],
  medians:[],
},
{
  // Figure 8 in space. The two diagonals cross in the middle: one runs flat, the other flies over it on a 10 m bridge.
  // Always 20 laps (practice stays endless, like on every track).
  // 20-lap tracks give no car bonuses: noPerks = every car runs stock (no home-track bonus, no all-terrain advantage). Item boxes and boost pads stay. gp:false keeps the 20-lapper out of the random Grand Prix draw.
  id:'acid8', name:'Acid Drip Galaxy', place:'The Melting Nebula · Sector 8',
  blurb:'A figure 8 floating in a galaxy that will not stop melting. Two long sweepers, a flyover where the track crosses itself, a sky that drips and one very large eye that watches every lap. Twenty laps. Nowhere to hide.',
  note:'Always 20 laps. No car bonuses here: every car runs stock. Item boxes and boost pads are live.',
  theme:'space', laps:20, shoulder:2.6, noPerks:true, gp:false,
  points:fig8Points(),
  // item rows and boost pads sit on the two diagonals only: in the sweepers the AI swerves for them and finds the wall
  jumps:[], boosts:[{cp:1,f:0.3,lat:0},{cp:17,f:0.2,lat:0}], items:[{cp:2,f:0.6},{cp:18,f:0.2}],
  medians:[],
},
{
  // Short-track oval, NASCAR style: left turns only, half a mile, wall all the way round. 20 laps, no car bonuses, pick-ups and pads live.
  id:'bowl', name:'PepperBox Raceway', place:'The Half-Mile Bullring',
  blurb:'The home track of Pepperbox TV. A half-mile short-track oval at golden hour: two drag-strip straights, two long left-handers, a wall that is always closer than it looks and grandstands all the way round. Twenty laps of elbows-out pack racing.',
  note:'Always 20 laps. No car bonuses here: every car runs stock. Item boxes and boost pads are live.',
  theme:'oval', laps:20, shoulder:3, noPerks:true, gp:false,
  points:ovalPoints(),
  // pads at the exits of turn 2 and turn 4, item rows in the middle of each straight
  jumps:[], boosts:[{cp:15,f:0.6,lat:3.5},{cp:15,f:0.6,lat:-3.5},{cp:35,f:0.4,lat:0}], items:[{cp:19,f:0.5},{cp:1,f:0.6}],
  medians:[],
},
{
  // Rallycross-style dirt loop through pine forest, Black Rifle Coffee Company colours everywhere. 20 laps, no car bonuses, pick-ups and pads live.
  // dirt:true = cars throw dust on the road itself. Wide for a rally stage (16 m) so eight cars fit.
  id:'roast', name:'Black Rifle Rallycross', place:'The Roastery Stage · Black Rifle Coffee Company', rev:2,
  blurb:'Black Rifle Coffee Company presents an extreme-sports dirt stage in the pines: under the Crossover, up and over the Full Send Loop, round the roastery sweeper, then fly the Crossover Jump across the road you started on and launch the Dark Roast Big Air, with fire on every take-off. Twenty laps, sideways and occasionally upside down.',
  note:'Always 20 laps. No car bonuses here: every car runs stock. Item boxes and boost pads are live.',
  theme:'rally', laps:20, noPerks:true, gp:false, dirt:true, flatGaps:true,
  // Layout (rallyPoints): the start straight runs north and passes UNDER the Crossover Jump, then the loop (entry cp 4, exit cp 5:
  // the exit lane is 13 m to the right), the roastery sweeper, the upper straight heading west with the Crossover Jump over
  // the start straight, the west straight with the Big Air, and the long left-hander home.
  points:rallyPoints(),
  loop:{cp:4,f:0,cpx:5,fx:0,r:11,w:11},
  jumps:[{cp:14,f:0.48,len:16,h:4.6,gap:32,name:'CROSSOVER JUMP'},{cp:19,f:0.35,len:22,h:6.5,gap:30,name:'DARK ROAST BIG AIR'}],
  // pads and item rows only where the stage runs straight
  boosts:[{cp:0,f:0.5,lat:0},{cp:13,f:0.55,lat:0},{cp:18,f:0.7,lat:0}],
  items:[{cp:6,f:0.5},{cp:16,f:0.6}],
  medians:[],
},
];
if (typeof module!=='undefined') module.exports = {TRACK_DATA};

// ===== TRACK PATH (shared by physics, AI, rendering) =====
function smooth01(t){ t=Math.max(0,Math.min(1,t)); return t*t*(3-2*t); }
// records and leaderboards are kept per course revision so a redesigned layout never mixes with old times
function trackKey(t){ return t&&t.rev>1 ? t.id+'_r'+t.rev : (t&&t.id); }
// account-exclusive tracks: locked unless a racer account is signed in (checked at every entry point: menus, race launch, practice, Grand Prix, Race constructor)
function trackLocked(t){ return !!(t&&t.account) && !(typeof GAME!=='undefined'&&GAME&&GAME.online&&GAME.online.hasAccess()); }
const UNLOCK_ID='revolution';
function buildTrackPath(def){
  const V3 = THREE.Vector3;
  const cps = def.points.map(p=>new V3(p[0],p[2],p[1]));
  const curve = new THREE.CatmullRomCurve3(cps,true,'centripetal',0.5);
  const L = curve.getLength();
  const SP = 2; // meters per sample
  const N = Math.round(L/SP);
  const raw = curve.getSpacedPoints(N); raw.pop();
  const spacing = L/N;
  const P = { def, N, L, spacing,
    x:new Float32Array(N), z:new Float32Array(N), y:new Float32Array(N),
    tx:new Float32Array(N), tz:new Float32Array(N), rx:new Float32Array(N), rz:new Float32Array(N),
    w:new Float32Array(N), wl:new Float32Array(N), wr:new Float32Array(N),
    curv:new Float32Array(N), gap:new Uint8Array(N), tunnel:new Uint8Array(N), mud:new Uint8Array(N), median:new Float32Array(N),
    slope:new Float32Array(N), s:new Float32Array(N), cpIdx:[] };
  for(let i=0;i<N;i++){ P.x[i]=raw[i].x; P.z[i]=raw[i].z; P.y[i]=raw[i].y; P.s[i]=i*spacing; }
  // control point sample indices
  let last=0;
  for(let c=0;c<cps.length;c++){
    let best=-1,bd=1e18;
    for(let k=0;k<N;k++){ const i=(last+k)%N; if(c===0 && k>N/2) break;
      const dx=P.x[i]-cps[c].x, dz=P.z[i]-cps[c].z, d=dx*dx+dz*dz; if(d<bd){bd=d;best=i;} if(c>0 && k>N*0.4) break; }
    if(c===0) best=0;
    P.cpIdx.push(best); last=best;
  }
  const idxAt=(cp,f)=>{ const a=P.cpIdx[cp%cps.length]; let b=P.cpIdx[(cp+1)%cps.length]; if(b<=a) b+=N; return Math.round(a+(b-a)*f)%N; };
  P.idxAt=idxAt;
  // widths
  for(let c=0;c<cps.length;c++){
    const a=P.cpIdx[c]; let b=P.cpIdx[(c+1)%cps.length]; if(b<=a) b+=N;
    const w0=def.points[c][3], w1=def.points[(c+1)%cps.length][3];
    for(let i=a;i<=b;i++) P.w[i%N]=w0+(w1-w0)*smooth01((i-a)/Math.max(1,b-a));
  }
  // tangents
  for(let i=0;i<N;i++){
    const a=(i-1+N)%N,b=(i+1)%N; let dx=P.x[b]-P.x[a], dz=P.z[b]-P.z[a]; const l=Math.hypot(dx,dz)||1;
    P.tx[i]=dx/l; P.tz[i]=dz/l; P.rx[i]=-dz/l; P.rz[i]=dx/l;
  }
  // smooth heights a little
  for(let pass=0;pass<3;pass++){ const t=P.y.slice(); for(let i=0;i<N;i++){ P.y[i]=(t[(i-2+N)%N]+t[(i-1+N)%N]+t[i]+t[(i+1)%N]+t[(i+2)%N])/5; } }
  // jumps / kickers
  (def.jumps||[]).forEach(j=>{
    const i0=idxAt(j.cp,j.f); const rl=Math.round(j.len/spacing);
    for(let k=0;k<=rl;k++){ const i=(i0+k)%N; const t=k/rl; P.y[i]+= j.h*Math.pow(t,1.3); }
    const top=(i0+rl)%N;
    if(j.gap>0){ const gl=Math.round(j.gap/spacing); for(let k=1;k<=gl;k++) P.gap[(top+k)%N]=1; }
    else { for(let k=1;k<=3;k++){ const i=(top+k)%N; P.y[i]+= j.h*(1-k/3)*0.35; } }
    j.i0=i0; j.top=top;
  });
  // curvature (signed: + turning right)
  const K=4;
  for(let i=0;i<N;i++){
    const a=(i-K+N)%N,b=(i+K)%N;
    const ang=Math.atan2(P.tx[a]*P.tz[b]-P.tz[a]*P.tx[b], P.tx[a]*P.tx[b]+P.tz[a]*P.tz[b]);
    P.curv[i]= -ang/(2*K*spacing); // left turn => positive (heading increases)
  }
  for(let i=0;i<N;i++){ const b=(i+1)%N; P.slope[i]=(P.y[b]-P.y[i])/spacing; }
  // walls
  const SH = def.shoulder||4;
  for(let i=0;i<N;i++){
    let wl=P.w[i]/2+SH, wr=P.w[i]/2+SH;
    const c=P.curv[i]; if(Math.abs(c)>1e-4){ const R=1/Math.abs(c); if(c>0) wr=Math.min(wr,R*0.8); else wl=Math.min(wl,R*0.8); }
    P.wl[i]=Math.max(wl,P.w[i]/2+0.8); P.wr[i]=Math.max(wr,P.w[i]/2+0.8);
  }
  if(def.mud){ const i0=idxAt(def.mud.cp,def.mud.f); const n=Math.round(def.mud.len/spacing); for(let k=0;k<n;k++) P.mud[(i0+k)%N]=1; P.mudStart=i0; }
  (def.tunnels||[]).forEach(t=>{ const i0=idxAt(t.cp,t.f); const n=Math.round(t.len/spacing); for(let k=0;k<n;k++){ const i=(i0+k)%N; P.tunnel[i]=1; P.wl[i]=Math.min(P.wl[i],P.w[i]/2+1.2); P.wr[i]=Math.min(P.wr[i],P.w[i]/2+1.2);} t.i0=i0; t.n=n; });
  (def.medians||[]).forEach(m=>{ const i0=idxAt(m.cp,m.f); const n=Math.round(m.len/spacing); for(let k=0;k<n;k++){ const i=(i0+k)%N; const e=Math.min(k,n-k)/6; P.median[i]=m.w/2*Math.min(1,e);} m.i0=i0; m.n=n; });
  // route tracks (one-time opening segment + portal circuit): the path is one closed loop
  //   [0 .. entry)  opening segment (grid sits just behind index 0)      entry = portal into the circuit (used once per race)
  //   [entry .. york] the circuit; york = lap line / finish                ret = return portal (teleports to dest, just past entry)
  //   (ret .. N-HID) a hidden connector that closes the loop geometrically; never raced, never rendered
  P.hidden=new Uint8Array(N);
  if(def.route){ const r=def.route; const R0={entry:idxAt(r.entry[0],r.entry[1]),york:idxAt(r.york[0],r.york[1]),ret:idxAt(r.ret[0],r.ret[1])};
    // separate opening (drag strip) when start/circ are given: start = start line, entry = entry portal (teleports), circ = Concord arrival gate
    R0.start=r.start?idxAt(r.start[0],r.start[1]):0; R0.circ=r.circ?idxAt(r.circ[0],r.circ[1]):R0.entry; R0.teleportEntry=!!r.circ; R0.pole=r.pole||null;
    R0.dest=(R0.circ+(r.destOff||12))%N; R0.span=(R0.york-R0.circ+N)%N; R0.gridBack=Math.round((r.circ?44:70)/spacing);
    const hide=(a,b)=>{ for(let k=a;k!==b;k=(k+1)%N) P.hidden[k]=1; };
    if(R0.teleportEntry){ hide((R0.ret+Math.round(24/spacing))%N,(R0.start-R0.gridBack+N)%N); hide((R0.entry+Math.round(24/spacing))%N,(R0.circ-Math.round(12/spacing)+N)%N); }
    else for(let i=R0.ret+Math.round(24/spacing);i<N-R0.gridBack;i++) P.hidden[i]=1;
    R0.chapters=(def.chapters||[]).map(c=>Object.assign({},c,{i:idxAt(c.at[0],c.at[1])}));
    P.route=R0; }
  // Loop-the-loop (def.loop): the physics is flat, so a loop is a stunt on rails. Path samples between the entry (i0) and the
  // exit (i1) are a hidden connector that is never drawn or driven: a car reaching i0 is carried round a helix of radius R that
  // starts at the entry and comes down on the exit lane (offset D to the side, adv forward), then handed back at i1.
  if(def.loop){ const lp=def.loop, i0=idxAt(lp.cp,lp.f||0), i1=idxAt(lp.cpx,lp.fx||0), a=(i0-5+N)%N, fx=P.tx[a], fz=P.tz[a], rx=P.rx[a], rz=P.rz[a];
    for(let k=(i0+1)%N;k!==i1;k=(k+1)%N) P.hidden[k]=1;
    for(let k=-8;k<=((i1-i0+N)%N)+8;k++){ const i=(i0+k+N)%N; P.curv[i]=0; P.wl[i]=P.w[i]/2+SH; P.wr[i]=P.w[i]/2+SH; }   // the AI must not brake for the connector's kink
    const dx=P.x[i1]-P.x[i0], dz=P.z[i1]-P.z[i0], adv=dx*fx+dz*fz, D=dx*rx+dz*rz, R=lp.r||11, ex=P.x[i0], ey=P.y[i0], ez=P.z[i0], dy=P.y[i1]-ey;
    P.loop={i0,i1,span:(i1-i0+N)%N,fx,fz,rx,rz,adv,D,R,w:lp.w||11,len:2*Math.PI*R*1.04,ex,ey,ez,
      pos(u,l,o){ const th=2*Math.PI*u, al=R*Math.sin(th)+adv*u, lt=D*u+l; o.x=ex+fx*al+rx*lt; o.y=ey+dy*u+R*(1-Math.cos(th)); o.z=ez+fz*al+rz*lt; return o; } }; }
  // helpers
  P.nearest=function(x,z,hint,win){
    let best=hint,bd=1e18;
    if(hint<0){ for(let i=0;i<N;i++){ const dx=x-P.x[i],dz=z-P.z[i],d=dx*dx+dz*dz; if(d<bd){bd=d;best=i;} } return best; }
    for(let k=-win;k<=win;k++){ const i=(hint+k+N)%N; const dx=x-P.x[i],dz=z-P.z[i],d=dx*dx+dz*dz; if(d<bd){bd=d;best=i;} }
    return best;
  };
  // project to local frame: returns {i, t (0..1 toward i+1), lat, h (road height), along}
  P.project=function(x,z,i,out){
    const j=(i+1)%N; const ax=P.x[i],az=P.z[i];
    let sx=P.x[j]-ax, sz=P.z[j]-az; const sl=sx*sx+sz*sz;
    let t=((x-ax)*sx+(z-az)*sz)/sl;
    let ii=i;
    if(t<0){ ii=(i-1+N)%N; const bx=P.x[ii],bz=P.z[ii]; sx=ax-bx; sz=az-bz; t=((x-bx)*sx+(z-bz)*sz)/(sx*sx+sz*sz); }
    t=Math.max(0,Math.min(1,t));
    const k=(ii+1)%N;
    const cx=P.x[ii]+(P.x[k]-P.x[ii])*t, cz=P.z[ii]+(P.z[k]-P.z[ii])*t;
    const rx=P.rx[ii]+(P.rx[k]-P.rx[ii])*t, rz=P.rz[ii]+(P.rz[k]-P.rz[ii])*t;
    out.i=ii; out.t=t; out.lat=(x-cx)*rx+(z-cz)*rz;
    out.h=P.y[ii]+(P.y[k]-P.y[ii])*t; out.along=(ii+t)*spacing;
    out.wl=P.wl[ii]; out.wr=P.wr[ii]; out.w=P.w[ii]; out.gap=P.gap[ii]||P.gap[k]; out.median=P.median[ii];
    out.tx=P.tx[ii]; out.tz=P.tz[ii]; out.rx=rx; out.rz=rz; out.slope=P.slope[ii];
    return out;
  };
  return P;
}
if (typeof module!=='undefined') module.exports={buildTrackPath,smooth01};

// ===== VEHICLE ROSTER (based on the Ryden's Racers trailer) =====
const VEHICLES=[
 {id:'duck',driver:'Nic',name:'Duck Plasma',cls:'Rubber duck on wheels',desc:'A giant yellow rubber duck bolted onto a pocket-sized hatchback chassis. Squeaky, bouncy, surprisingly quick.',tag:'Quack. Quack. Gone.',body:'duckmini',livery:'duckskin',rim:0xd8d8d8,stats:{speed:9,accel:7,handling:6,drift:8,weight:4}},
 {id:'gt44',driver:'Eli',name:'GT40',cls:'Endurance racer, 1966',desc:'Low, loud and built to win the long race. Twin stripes, zero apologies.',tag:'Old money. New records.',body:'gt',livery:'stripes',num:40,rim:0xcfd3d6,stats:{speed:8,accel:8,handling:8,drift:6,weight:5}},
 {id:'donut',driver:'Donut',name:'Donut Patrol',cls:'Pursuit cruiser',desc:'Sprinkle-coated interceptor. Its plate says GLAZE EM, and it means it.',tag:'Protect. Serve. Snack.',body:'coupe',livery:'sprinkles',rim:0xf4f4f4,plate:'GLAZE EM',stats:{speed:7,accel:9,handling:8,drift:7,weight:5}},
 {id:'missile',allTerrain:true,driver:'Ethan',name:'Missile Commander',cls:'Heavy-duty pickup',desc:'Lifted gunmetal pickup with warning-yellow stripes, a grille full of missiles and rocket-fin bed rails.',tag:'Right of way, always.',body:'truck',livery:'missile',rim:0x1c1c1c,stats:{speed:7,accel:6,handling:5,drift:6,weight:10}},
 {id:'brcc',driver:'JT',name:'BRCC',cls:'Rally hatchback',desc:'Black Rifle Coffee rally car in black-and-gold camo. Short, stiff and happiest sideways.',tag:'Fueled by dark roast.',body:'gtcoupe',livery:'goldcamo',num:15,rim:0x1a1a1a,stats:{speed:7,accel:9,handling:8,drift:9,weight:4}},
 {id:'fdc',allTerrain:true,driver:'Chris',name:'Firearms Direct Club',cls:'Desert pickup',desc:'Sand-tan Firearms Direct Club pickup with a roll bar and a mount in the bed. Tough, heavy and hard to push around.',tag:'Members only.',body:'truck',livery:'goldcamo',rim:0x222222,stats:{speed:7,accel:6,handling:6,drift:5,weight:9}},
 {id:'hellcat',driver:'CordIsLoud',name:'Colonial Hellcat',cls:'Supercharged muscle car',desc:'Navy-blue muscle car with twin white stripes, a 13-star flag and 1776 on the doors. Monster straight-line speed; it takes some muscle in the corners.',tag:'Loud since 1776.',body:'gtcoupe',livery:'stripes',num:76,rim:0x151515,stats:{speed:10,accel:8,handling:5,drift:7,weight:7}},
 {id:'bpd',driver:'Rich',name:'BPD 69',cls:'Detective cruiser',desc:'Unmarked, unbothered. A boxy 80s cruiser that corners like it has a warrant.',tag:'Case closed at 180.',body:'sedan',livery:'filigree',rim:0x9aa0a6,plate:'BPD 69',stats:{speed:8,accel:7,handling:7,drift:7,weight:7}},
 {id:'concord',driver:'Brandon',name:'Concordance',cls:'Luxury limousine',desc:'Silk-black stretch luxury sedan of a decorated war hero and soon-to-be congressman. Gold crossed-rifle crests, AK-47 hood ornament, flags on the fenders.',tag:'Served. Now serving.',body:'yacht',livery:'silkblack',rim:0x111111,plate:'HERO 1',stats:{speed:8,accel:6,handling:6,drift:9,weight:8}},
 {id:'trout',driver:'Trout',name:'Trout Protocol',cls:'Rainbow trout hypercar',desc:'A mid-engine hypercar that is basically a rainbow trout: speckled olive back, pink stripe, fins, gills and a tail.',tag:'Swims upstream at 300.',body:'hyper',livery:'trout',rim:0x2b2b2b,stats:{speed:9,accel:8,handling:7,drift:5,weight:4}},
 {id:'leopard',driver:'Pix',name:'Black Lightning',cls:'Turbo GT coupe',desc:'Rosette-printed street GT that stalks the inside line at every corner.',tag:'Spots you from the apex.',body:'gtcoupe',livery:'leopard',rim:0x1c1c1c,stats:{speed:8,accel:8,handling:8,drift:7,weight:5}},
 {id:'lightning',driver:'Tackett',name:'White Lightning',cls:'GT3 R race car',desc:'Pearl-white GT3 R with a towering rear wing and a splitter that nearly scrapes paint off the track. Glued to the road through fast corners.',tag:'Strikes twice. Same lap.',body:'gtcoupe',livery:'stripes',rim:0x1a1a1a,stats:{speed:9,accel:8,handling:9,drift:5,weight:5}},
 {id:'genlee',driver:'Nolan',name:'General Lee',cls:'1969 muscle car',desc:'Orange 69 muscle car with a big-block V8 and a habit of jumping creeks. Brutal off the line and happy to hang the tail out.',tag:'Straight, sideways, or airborne.',body:'sedan',livery:'stripes',num:1,rim:0xcfd3d6,stats:{speed:9,accel:8,handling:5,drift:9,weight:7}},
 {id:'eggplant',driver:'Kerri',name:'Screaming Eggplant',cls:'Sport coupe',desc:'A deep-purple sport coupe with its name down both doors and a leafy green stem swept over the tail. Leaps off the line, loves to slide and is far too loud for a vegetable.',tag:'Hear it before you see it.',body:'coupe',livery:'stripes',rim:0xd8d8d8,plate:'EGGPLNT',stats:{speed:8,accel:9,handling:7,drift:8,weight:5}},
 {id:'voyager',driver:'Ryden',name:'Midnight Voyager',cls:'Touring coach',desc:'A full-size white touring coach with a highway-gearing diesel. Takes a moment to get rolling, then cruises at speeds a bus has no business reaching, and nobody moves it off its line.',tag:'Next stop: the podium.',body:'yacht',livery:'silkblack',rim:0xcfd3d6,plate:'RYDEN',stats:{speed:9,accel:7,handling:7,drift:6,weight:8}},
];
// Home-track advantage (passive): extra top speed in m/s on specific tracks, keyed by stable track + vehicle ids.
// 1.788 m/s = 4.0 mph at the HUD's 2.237 mph per m/s. Applied once per Car (a new Car is built for every race start/restart);
// the base VEHICLES definitions are never modified. Not scaled by boost; scaled down with off-road / mud / spin like base speed.
const HOME_BONUS={alondra:{bpd:1.788,donut:1.788}};
function homeBonus(trackId,vehId){ return ((HOME_BONUS[trackId]||{})[vehId])||0; }
function vehiclePhysics(v){ const _at=!!v.allTerrain;
  const s=v.stats;
  return { top:44+s.speed*1.05, accel:15+s.accel*1.5, steer:2.25+s.handling*0.07, grip:6.5+s.handling*0.45,
    drift:0.75+s.drift*0.06, mass:0.8+s.weight*0.12, allTerrain:_at };
}
const BODIES={
 proto:{L:4.7,W:2.0,ride:0.16,wr:0.36,ww:0.34,aF:1.45,aR:-1.35,nose:0.36,bev:0.14,
   up:[['q',2.3,0.66,1.55,0.8],['q',1.1,0.8,0.72,0.72],['l',-0.8,0.8],['q',-1.7,0.98,-2.35,0.88],['l',-2.35,0.45]],
   cab:[[0.76,0.72],[0.12,1.1],[-0.72,1.08],[-1.1,0.8]],cabW:0.6},
 gt:{L:4.3,W:1.96,ride:0.14,wr:0.35,ww:0.34,aF:1.35,aR:-1.3,nose:0.32,bev:0.12,
   up:[['q',2.15,0.64,1.5,0.72],['l',0.82,0.7],['l',-1.25,0.9],['q',-2.05,0.96,-2.15,0.8],['l',-2.15,0.4]],
   cab:[[0.86,0.7],[0.2,1.06],[-0.55,1.06],[-1.25,0.9]],cabW:0.7},
 coupe:{L:4.3,W:1.92,ride:0.2,wr:0.36,ww:0.32,aF:1.35,aR:-1.35,nose:0.45,bev:0.14,
   up:[['q',2.15,0.72,1.6,0.8],['l',0.66,0.86],['l',-1.25,0.95],['q',-2.15,0.98,-2.15,0.7],['l',-2.15,0.36]],
   cab:[[0.7,0.86],[0.05,1.28],[-0.72,1.28],[-1.28,0.95]],cabW:0.74},
 truck:{L:5.5,W:2.3,ride:0.62,wr:0.6,ww:0.46,aF:1.8,aR:-1.8,nose:1.0,bev:0.1,
   up:[['l',2.75,1.38],['l',1.25,1.48],['l',-0.55,1.48],['l',-0.62,1.34],['l',-2.75,1.34],['l',-2.75,0.3]],
   cab:[[1.2,1.48],[0.62,2.28],[-0.5,2.28],[-0.55,1.48]],cabW:0.86},
 sedan:{L:4.8,W:1.96,ride:0.24,wr:0.36,ww:0.32,aF:1.5,aR:-1.45,nose:0.72,bev:0.07,
   up:[['l',2.4,0.92],['l',1.0,0.97],['l',-1.35,0.97],['l',-2.4,0.95],['l',-2.4,0.42]],
   cab:[[0.98,0.97],[0.38,1.46],[-1.0,1.46],[-1.36,0.97]],cabW:0.8},
 yacht:{L:5.9,W:2.04,ride:0.2,wr:0.38,ww:0.34,aF:2.0,aR:-1.85,nose:0.66,bev:0.14,
   up:[['q',2.95,0.88,2.5,0.92],['l',1.05,0.95],['l',-1.85,0.98],['l',-2.6,0.96],['q',-2.95,0.95,-2.95,0.7],['l',-2.95,0.36]],
   cab:[[1.02,0.95],[0.45,1.4],[-1.3,1.4],[-1.85,0.98]],cabW:0.8},
 hyper:{L:4.5,W:2.06,ride:0.12,wr:0.37,ww:0.36,aF:1.4,aR:-1.4,nose:0.28,bev:0.12,
   up:[['l',2.25,0.42],['q',1.6,0.56,0.95,0.72],['l',-1.5,0.85],['l',-2.25,0.8],['l',-2.25,0.36]],
   cab:[[0.96,0.72],[0.12,1.1],[-0.6,1.08],[-1.5,0.85]],cabW:0.64},
 custom:{L:4.6,W:2.08,ride:0.14,wr:0.37,ww:0.36,aF:1.45,aR:-1.45,nose:0.34,bev:0.14,
   up:[['q',2.3,0.6,1.7,0.72],['l',0.55,0.8],['l',-1.4,0.92],['q',-2.3,0.95,-2.3,0.62],['l',-2.3,0.34]],
   cab:[[0.6,0.8],[-0.1,1.2],[-0.9,1.18],[-1.55,0.92]],cabW:0.7},
 duckmini:{L:3.7,W:1.9,ride:0.2,wr:0.36,ww:0.32,aF:1.2,aR:-1.2,nose:0.6,bev:0.1,custom:'duck',
   up:[['l',1.85,0.9],['l',-1.85,0.9],['l',-1.85,0.4]],
   cab:[[0.8,0.9],[0.4,1.3],[-0.8,1.3],[-1.2,0.9]],cabW:0.7},
 gtcoupe:{L:4.4,W:1.96,ride:0.16,wr:0.36,ww:0.33,aF:1.38,aR:-1.35,nose:0.4,bev:0.13,
   up:[['q',2.2,0.64,1.5,0.73],['l',0.78,0.8],['l',-1.5,0.88],['l',-1.85,0.87],['q',-2.2,0.9,-2.2,0.68],['l',-2.2,0.35]],
   cab:[[0.8,0.8],[0.05,1.2],[-0.65,1.18],[-1.5,0.88]],cabW:0.72},
};

// ===== LIVERIES + PROCEDURAL CAR MODELS =====
const LIVERY_CACHE={};
function liveryTexture(kind){
  if(LIVERY_CACHE[kind]) return LIVERY_CACHE[kind];
  const S=512, R=mulberry32(kind.length*977+kind.charCodeAt(0));
  const r=(a,b)=>a+(b-a)*R();
  const t=canvasTex(S,S,(g)=>{
    const swirl=(col,lw,n,sz)=>{ g.strokeStyle=col; g.lineWidth=lw; g.lineCap='round';
      for(let i=0;i<n;i++){ let x=r(0,S),y=r(0,S),a=r(0,TAU),rad=r(sz*0.5,sz); g.beginPath(); g.moveTo(x,y);
        for(let k=0;k<26;k++){ a+=r(0.15,0.45); rad*=0.93; x+=Math.cos(a)*rad*0.35; y+=Math.sin(a)*rad*0.35; g.lineTo(x,y);} g.stroke(); } };
    if(kind==='plasma'){
      noiseFill(g,S,S,'#f2b705',18);
      const grd=g.createLinearGradient(0,0,S,S); grd.addColorStop(0,'rgba(255,230,120,0.4)'); grd.addColorStop(1,'rgba(230,120,0,0.25)'); g.fillStyle=grd; g.fillRect(0,0,S,S);
      for(let i=0;i<9;i++){ let x=r(0,S),y=r(0,S); g.shadowColor='#bff6ff'; g.shadowBlur=10;
        g.strokeStyle='rgba(255,255,255,0.95)'; g.lineWidth=r(1.5,3.5); g.beginPath(); g.moveTo(x,y);
        let a=r(0,TAU); for(let k=0;k<22;k++){ a+=r(-0.9,0.9); x+=Math.cos(a)*r(8,20); y+=Math.sin(a)*r(8,20); g.lineTo(x,y);
          if(R()<0.15){ g.stroke(); g.beginPath(); g.moveTo(x,y); } }
        g.stroke(); }
      g.shadowBlur=0;
    } else if(kind==='stripes'){
      noiseFill(g,S,S,'#c3121c',12);
      g.fillStyle='#f4f1ea'; g.fillRect(0,S*0.40,S,S*0.07); g.fillRect(0,S*0.53,S,S*0.07);
    } else if(kind==='sprinkles'){
      noiseFill(g,S,S,'#ff8cc0',10);
      const cols=['#ffffff','#ffe14d','#3fd0ff','#7a5cff','#ff3b6b','#6bff8a','#ff9a3c'];
      for(let i=0;i<700;i++){ g.save(); g.translate(r(0,S),r(0,S)); g.rotate(r(0,TAU)); g.fillStyle=cols[i%cols.length];
        const l=r(9,15); g.beginPath(); g.moveTo(-l/2,-2.5); g.lineTo(l/2,-2.5); g.arc(l/2,0,2.5,-Math.PI/2,Math.PI/2); g.lineTo(-l/2,2.5); g.arc(-l/2,0,2.5,Math.PI/2,Math.PI*1.5); g.fill(); g.restore(); }
    } else if(kind==='goldcamo'){
      noiseFill(g,S,S,'#141414',10);
      for(let i=0;i<34;i++){ g.fillStyle=R()<0.5?'rgba(201,162,58,0.85)':'rgba(60,52,30,0.9)'; g.beginPath(); let x=r(0,S),y=r(0,S);
        for(let k=0;k<9;k++){ const a=k/9*TAU; const rad=r(14,40); const px=x+Math.cos(a)*rad, py=y+Math.sin(a)*rad; k?g.lineTo(px,py):g.moveTo(px,py);} g.fill(); }
      swirl('rgba(230,190,90,0.9)',2,26,60);
    } else if(kind==='filigree'){
      noiseFill(g,S,S,'#2d3137',10); swirl('rgba(212,170,80,0.75)',2.2,40,70); swirl('rgba(230,225,210,0.35)',1,30,40);
    } else if(kind==='goldfiligree'){
      noiseFill(g,S,S,'#0d0d10',6); swirl('rgba(225,180,70,0.95)',3,34,90); swirl('rgba(255,215,120,0.6)',1.2,50,50);
    } else if(kind==='scales'){
      const grd=g.createLinearGradient(0,0,0,S); grd.addColorStop(0,'#ff7a1f'); grd.addColorStop(0.5,'#ff4a1a'); grd.addColorStop(1,'#d11f2a'); g.fillStyle=grd; g.fillRect(0,0,S,S);
      const sz=32; for(let y=-1;y<S/sz*2+1;y++) for(let x=-1;x<S/sz+1;x++){ const cx=x*sz+(y%2?sz/2:0), cy=y*sz/2;
        g.strokeStyle='rgba(90,10,10,0.55)'; g.lineWidth=2.5; g.beginPath(); g.arc(cx,cy,sz/2,0.15*Math.PI,0.85*Math.PI); g.stroke();
        g.fillStyle='rgba(255,220,120,0.18)'; g.beginPath(); g.arc(cx,cy+4,sz/4,0,TAU); g.fill(); }
      for(let i=0;i<60;i++){ g.fillStyle='rgba(40,10,20,0.7)'; g.beginPath(); g.arc(r(0,S),r(0,S),r(2,5),0,TAU); g.fill(); }
    } else if(LIVERY_EXTRA[kind]){ LIVERY_EXTRA[kind](g,S,r);
    } else if(kind==='leopard'){
      noiseFill(g,S,S,'#d4a045',14);
      for(let i=0;i<120;i++){ const x=r(0,S),y=r(0,S),s=r(9,17); g.fillStyle='#2a170b';
        for(let k=0;k<5;k++){ const a=k/5*TAU+r(-0.3,0.3); g.beginPath(); g.ellipse(x+Math.cos(a)*s,y+Math.sin(a)*s,s*0.45,s*0.3,a+1.57,0,TAU); g.fill(); }
        g.fillStyle='#9a6024'; g.beginPath(); g.arc(x,y,s*0.6,0,TAU); g.fill(); }
      for(let i=0;i<120;i++){ g.fillStyle='#2a170b'; g.beginPath(); g.arc(r(0,S),r(0,S),r(2,5),0,TAU); g.fill(); }
    }
  },{repeat:true,aniso:8});
  LIVERY_CACHE[kind]=t; return t;
}
function decalTex(draw,w=128,h=128){ return canvasTex(w,h,draw); }
let SHARED_CAR_MATS=null;
function carSharedMats(){
  if(SHARED_CAR_MATS) return SHARED_CAR_MATS;
  SHARED_CAR_MATS={
    glass:new THREE.MeshPhysicalMaterial({color:0x0a0c12,metalness:0.2,roughness:0.08,clearcoat:1,clearcoatRoughness:0.05}),
    tire:new THREE.MeshStandardMaterial({color:0x151515,roughness:0.9}),
    trim:new THREE.MeshStandardMaterial({color:0x0e0e10,roughness:0.6,metalness:0.3}),
    chrome:new THREE.MeshStandardMaterial({color:0xe8e8ee,roughness:0.12,metalness:1}),
    gold:new THREE.MeshStandardMaterial({color:0xd4a33a,roughness:0.25,metalness:1}),
    head:new THREE.MeshBasicMaterial({color:0xfff4d6}),
    amber:new THREE.MeshBasicMaterial({color:0xffa31a}),
    shadow:new THREE.MeshBasicMaterial({map:canvasTex(64,64,(g)=>{const gr=g.createRadialGradient(32,32,2,32,32,32);gr.addColorStop(0,'rgba(0,0,0,0.75)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);}),transparent:true,depthWrite:false}),
  };
  return SHARED_CAR_MATS;
}
function setEnvOnCarMats(env){ const m=carSharedMats(); [m.glass,m.chrome,m.gold,m.trim].forEach(x=>{x.envMap=env;x.needsUpdate=true;}); }
function buildCarModel(v, env){
  const B=BODIES[v.body], M=carSharedMats();
  const root=new THREE.Group(); // positioned at ground contact, rotated by heading
  const chassis=new THREE.Group(); root.add(chassis); // pitch/roll/suspension
  const bodyMat=new THREE.MeshPhysicalMaterial({map:liveryTexture(v.livery),roughness:0.38,metalness:0.25,clearcoat:1,clearcoatRoughness:0.08,envMap:env||null,envMapIntensity:1.0});
  const mt=bodyMat.map;
  if(v.livery==='stripes'){ /* handled via uv trick */ }
  // lower body
  const s=new THREE.Shape(); const L=B.L, cy=Math.max(0.03,B.wr-B.ride), ra=B.wr+0.07;
  s.moveTo(-L/2,0.18); s.lineTo(-L/2+0.18,0);
  [B.aR,B.aF].forEach(ax=>{ s.lineTo(ax-ra,0); s.lineTo(ax-ra,cy); s.absarc(ax,cy,ra,Math.PI,0,true); s.lineTo(ax+ra,0); });
  s.lineTo(L/2-0.28,0); s.quadraticCurveTo(L/2,0.02,L/2,B.nose);
  B.up.forEach(c=>{ if(c[0]==='l') s.lineTo(c[1],c[2]); else s.quadraticCurveTo(c[1],c[2],c[3],c[4]); });
  s.lineTo(-L/2,0.18);
  const bt=B.bev, depth=B.W-2*bt;
  const g1=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:bt,bevelSize:bt*0.8,bevelSegments:6,curveSegments:24});
  g1.translate(0,0,-depth/2); g1.rotateY(-Math.PI/2); g1.computeVertexNormals();
  const body=new THREE.Mesh(g1,bodyMat); body.position.y=B.ride; body.castShadow=true; chassis.add(body);
  // texture scaling
  if(v.livery==='stripes'){ mt.repeat.set(0.35,1/B.W); mt.offset.set(0,1-1/B.W); }
  else mt.repeat.set(0.42,0.42);
  // cabin
  const cs=new THREE.Shape(); B.cab.forEach((p,i)=>i?cs.lineTo(p[0],p[1]):cs.moveTo(p[0],p[1]));
  const cw=B.W*B.cabW; const cb=0.08;
  const g2=new THREE.ExtrudeGeometry(cs,{depth:cw-2*cb,bevelEnabled:true,bevelThickness:cb,bevelSize:0.06,bevelSegments:2});
  g2.translate(0,0,-(cw-2*cb)/2); g2.rotateY(-Math.PI/2);
  const cab=new THREE.Mesh(g2,M.glass); cab.position.y=B.ride-0.02; cab.castShadow=true; chassis.add(cab);
  // roof panel in body material
  const rf=B.cab[1], rr_=B.cab[2]; const roofLen=rf[0]-rr_[0];
  const roof=new THREE.Mesh(new THREE.BoxGeometry(cw-0.12,0.07,roofLen*0.92),bodyMat);
  roof.position.set(0,B.ride+Math.max(rf[1],rr_[1])+0.02,(rf[0]+rr_[0])/2); chassis.add(roof);
  const roofY=roof.position.y+0.035;
  // wheels
  const wheels=[], steerPivots=[];
  const tireG=new THREE.CylinderGeometry(B.wr,B.wr,B.ww,32); tireG.rotateZ(Math.PI/2);
  const rimG=new THREE.CylinderGeometry(B.wr*0.64,B.wr*0.64,B.ww+0.03,14); rimG.rotateZ(Math.PI/2);
  const rimMat=new THREE.MeshStandardMaterial({color:v.rim,metalness:1,roughness:0.28,envMap:env||null});
  const spokeG=new THREE.BoxGeometry(B.ww+0.05,B.wr*1.1,0.07); const spokeMat=M.trim.clone(); const tireParts=[];
  const wx=B.W/2-B.ww/2+0.03;
  [[B.aF,1],[B.aF,-1],[B.aR,1],[B.aR,-1]].forEach(([z,side],k)=>{
    const pivot=new THREE.Group(); pivot.position.set(side*wx,B.wr,z); root.add(pivot);
    const wg=new THREE.Group(); pivot.add(wg);
    const t=new THREE.Mesh(tireG,M.tire); t.castShadow=true; wg.add(t); tireParts.push(wg);
    const rm=new THREE.Mesh(rimG,rimMat); wg.add(rm);
    for(let a=0;a<3;a++){ const sp=new THREE.Mesh(spokeG,spokeMat); sp.rotation.x=a*Math.PI/3; wg.add(sp); }
    wheels.push(wg); if(k<2) steerPivots.push(pivot);
  });
  // lights
  const tailMat=new THREE.MeshBasicMaterial({color:0xff1030});
  const hw=B.W/2-0.35, frontZ=L/2+bt*0.8-0.02, rearZ=-L/2-bt*0.8+0.02;
  const hy=B.ride+Math.min(B.nose,0.75)-0.1, ty=B.ride+0.45*(B.body==='truck'?1.6:1);
  const heads=[], tails=[];
  [-1,1].forEach(sd=>{
    const h=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.12,0.06),M.head); h.position.set(sd*hw,hy,frontZ); chassis.add(h); heads.push(h);
    const tl=new THREE.Mesh(new THREE.BoxGeometry(v.body==='gtcoupe'?0.24:0.46,0.13,0.06),tailMat); tl.position.set(sd*hw,Math.min(ty,B.ride+0.8),rearZ); chassis.add(tl); tails.push(tl);
    if(v.body==='gtcoupe'){ const t2=tl.clone(); t2.position.x=sd*(hw-0.3); chassis.add(t2); }
  });
  // exhausts & boost flames
  const flameMat=new THREE.MeshBasicMaterial({color:0x6ff3ff,transparent:true,opacity:0.85,blending:THREE.AdditiveBlending,depthWrite:false});
  const flames=[];
  const fg=new THREE.ConeGeometry(0.17,1,10,1,true); fg.translate(0,-0.5,0); fg.rotateX(-Math.PI/2);
  [-0.35,0.35].forEach(x=>{ const pipe=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.25,8),M.chrome); pipe.rotation.x=Math.PI/2; pipe.position.set(x,B.ride+0.18,rearZ-0.02); chassis.add(pipe);
    const f=new THREE.Mesh(fg,flameMat); f.position.set(x,B.ride+0.18,rearZ-0.12); f.scale.set(1,1,0.001); f.visible=false; chassis.add(f); flames.push(f); });
  // shadow blob
  const sh=new THREE.Mesh(new THREE.PlaneGeometry(B.W*1.5,L*1.25),M.shadow); sh.rotation.x=-Math.PI/2; sh.position.y=0.04; sh.renderOrder=-1; root.add(sh);
  // decals
  const addDecal=(tex,w,h,pos,rotY,rotX=0)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:0.4,polygonOffset:true,polygonOffsetFactor:-2})); m.position.copy(pos); m.rotation.set(rotX,rotY,0,'YXZ'); chassis.add(m); return m; };
  if(v.num && !B.custom){ const tex=decalTex((g)=>{ g.fillStyle='#f5f2ea'; g.beginPath(); g.arc(64,64,60,0,TAU); g.fill(); g.fillStyle='#111'; g.font='bold 70px "Racing Sans One", Impact, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(String(v.num),64,70); });
    const sideX=B.W/2+0.004; addDecal(tex,0.62,0.62,new THREE.Vector3(sideX,B.ride+0.42,0.15),Math.PI/2); addDecal(tex,0.62,0.62,new THREE.Vector3(-sideX,B.ride+0.42,0.15),-Math.PI/2);
    const hood=B.up.find(c=>c[0]!=='x'); addDecal(tex,0.55,0.55,new THREE.Vector3(0,B.ride+0.76+0.015,1.25),0,-Math.PI/2+0.1); }
  if(v.plate){ const tex=decalTex((g)=>{ g.fillStyle='#f3f3f3'; g.fillRect(0,0,256,96); g.strokeStyle='#223'; g.lineWidth=6; g.strokeRect(4,4,248,88); g.fillStyle='#1a2a6c'; g.font='bold 52px "Chakra Petch", sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(v.plate,128,52); },256,96);
    addDecal(tex,0.62,0.23,new THREE.Vector3(0,B.ride+0.32,rearZ-0.01),Math.PI); }
  // per-vehicle extras
  const box=(w,h,d,mat,x,y,z)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x,y,z); m.castShadow=true; chassis.add(m); return m; };
  let lightbar=null;
  if(v.id==='donut'||v.id==='bpd'){
    const red=new THREE.MeshBasicMaterial({color:0xff1030}), blue=new THREE.MeshBasicMaterial({color:0x1a55ff});
    const zc=roof.position.z+(v.id==='donut'?0.25:0.1);
    box(1.25,0.1,0.28,M.trim,0,roofY+0.04,zc); const lr=box(0.55,0.14,0.26,red,-0.32,roofY+0.15,zc); const lb=box(0.55,0.14,0.26,blue,0.32,roofY+0.15,zc);
    lightbar={red,blue};
    if(v.id==='donut'){ // checker band + mini donut
      const chk=decalTex((g)=>{for(let x=0;x<16;x++)for(let y=0;y<2;y++){g.fillStyle=(x+y)%2?'#111':'#fafafa';g.fillRect(x*16,y*16,16,16);}},256,32);
      [-1,1].forEach(sd=>addDecal(chk,2.2,0.2,new THREE.Vector3(sd*(B.W/2+0.005),B.ride+0.66,-0.1),sd*Math.PI/2));
      const dn=new THREE.Mesh(new THREE.TorusGeometry(0.2,0.1,10,20),new THREE.MeshStandardMaterial({color:0xff6fb0,roughness:0.5})); dn.rotation.x=Math.PI/2; dn.position.set(0,roofY+0.1,roof.position.z-0.45); chassis.add(dn);
    } else { box(1.7,0.3,0.1,M.trim,0,B.ride+0.35,frontZ+0.18); box(0.04,0.8,0.04,M.trim,-0.6,roofY+0.4,roof.position.z-0.5); }
  }
  if(v.id==='leopard'){ box(1.7,0.06,0.3,M.trim,0,B.ride+0.98,-2.05); }
  if(v.id==='bpd'){ box(0.2,0.2,0.05,M.chrome,-0.95,B.ride+1.1,0.95); }
  if(v.id==='gt44'){ box(1.6,0.05,0.2,M.trim,0,B.ride+0.95,-2.1); }
  const anims=styleCar(v,{B,M,chassis,root,body,bodyMat,roof,roofY,frontZ,rearZ,heads,tails,rimMat,spokeMat,tireParts,addDecal,box,env,L});
  // shield bubble
  const shield=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{t:{value:0},c:{value:new THREE.Color(0x3fe8ff)}},
    vertexShader:'varying vec3 n;varying vec3 vp;void main(){n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vp=-mv.xyz;gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform float t;uniform vec3 c;varying vec3 n;varying vec3 vp;void main(){float f=1.-abs(dot(normalize(n),normalize(vp)));f=pow(f,2.2);float s=0.5+0.5*sin(t*6.+vp.y*6.);gl_FragColor=vec4(c*(f*1.4+0.08+0.12*s),1.);}'}));
  shield.scale.set(B.W*0.85,1.5,L*0.62); shield.position.y=B.ride+0.6; shield.visible=false; root.add(shield);
    const model={root,chassis,wheels,steerPivots,tailMat,flames,flameMat,shield,lightbar,bodyMat,dims:B,anims:anims.list};
  return (typeof CAR_GLTF!=='undefined'&&CAR_GLTF[v.id])?applyGlbModel(model,v,env):model;
}

// ===== CAR STYLING: reference-sheet details for each ride =====
const LIVERY_EXTRA={
  duckskin(g,S,r){ // rubber-duck yellow with electric-blue plasma veins
    noiseFill(g,S,S,'#f3b21a',16);
    for(let i=0;i<140;i++){ g.strokeStyle='rgba(150,90,0,0.18)'; g.lineWidth=1; g.beginPath(); let x=r(0,S),y=r(0,S); g.moveTo(x,y); for(let k=0;k<4;k++){ x+=r(-30,30); y+=r(-30,30); g.lineTo(x,y);} g.stroke(); }
    for(let i=0;i<8;i++){ let x=r(0,S),y=r(0,S),a=r(0,TAU); const pts=[[x,y]]; for(let k=0;k<26;k++){ a+=r(-0.8,0.8); x+=Math.cos(a)*r(7,16); y+=Math.sin(a)*r(7,16); pts.push([x,y]); }
      [[14,'rgba(40,200,255,0.25)'],[6,'rgba(60,220,255,0.7)'],[2,'rgba(230,255,255,1)']].forEach(([w,c])=>{ g.strokeStyle=c; g.lineWidth=w; g.lineJoin='round'; g.beginPath(); pts.forEach((p,k)=>k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.stroke(); });
      for(let b=0;b<3;b++){ const p=pts[Math.floor(r(3,pts.length-1))]; let bx=p[0],by=p[1],ba=r(0,TAU); g.strokeStyle='rgba(120,235,255,0.85)'; g.lineWidth=1.5; g.beginPath(); g.moveTo(bx,by); for(let k=0;k<6;k++){ ba+=r(-0.9,0.9); bx+=Math.cos(ba)*r(5,11); by+=Math.sin(ba)*r(5,11); g.lineTo(bx,by);} g.stroke(); } }
  },
  racered(g,S,r){ noiseFill(g,S,S,'#c4101c',8); const gr=g.createLinearGradient(0,0,0,S); gr.addColorStop(0,'rgba(255,255,255,0.06)'); gr.addColorStop(1,'rgba(0,0,0,0.08)'); g.fillStyle=gr; g.fillRect(0,0,S,S); },
  frosting(g,S,r){ // glossy pink icing, dark sprinkles
    noiseFill(g,S,S,'#ff5fa8',8);
    for(let i=0;i<60;i++){ const gr=g.createRadialGradient(0,0,0,0,0,40); g.save(); g.translate(r(0,S),r(0,S)); gr.addColorStop(0,'rgba(255,190,220,0.35)'); gr.addColorStop(1,'rgba(255,190,220,0)'); g.fillStyle=gr; g.fillRect(-40,-40,80,80); g.restore(); }
    for(let i=0;i<240;i++){ g.save(); g.translate(r(0,S),r(0,S)); g.rotate(r(0,TAU)); g.fillStyle=i%9===0?'#5a2a1a':'#1b1215'; const l=r(12,18); g.beginPath(); g.moveTo(-l/2,-2.6); g.lineTo(l/2,-2.6); g.arc(l/2,0,2.6,-Math.PI/2,Math.PI/2); g.lineTo(-l/2,2.6); g.arc(-l/2,0,2.6,Math.PI/2,Math.PI*1.5); g.fill(); g.fillStyle='rgba(255,255,255,0.35)'; g.fillRect(-l/2+2,-1.8,l-4,1); g.restore(); }
  },
  missile(g,S,r){ // gunmetal, worn, broken warning-yellow stripes + circuit lines
    noiseFill(g,S,S,'#2c2f33',14);
    for(let i=0;i<50;i++){ g.fillStyle=`rgba(${r(0,1)<0.5?'10,10,12':'70,74,80'},${r(0.1,0.3)})`; g.fillRect(r(0,S),r(0,S),r(20,90),r(4,20)); }
    g.strokeStyle='#e8b400'; g.lineCap='square';
    for(let i=0;i<7;i++){ g.lineWidth=r(3,7); g.beginPath(); let x=r(0,S),y=r(0,S); g.moveTo(x,y); for(let k=0;k<5;k++){ if(r(0,1)<0.5) x+=r(-120,120); else y+=r(-80,80); g.lineTo(x,y); if(r(0,1)<0.3){ g.stroke(); g.beginPath(); x+=r(10,30); g.moveTo(x,y);} } g.stroke(); }
    g.fillStyle='#e8b400'; for(let i=0;i<5;i++){ g.save(); g.translate(r(0,S),r(0,S)); g.rotate(-0.5); g.fillRect(-40,-7,80,14); g.restore(); }
  },
  silkblack(g,S,r){ noiseFill(g,S,S,'#0c0c0e',5); for(let i=0;i<40;i++){ g.fillStyle='rgba(255,255,255,0.025)'; g.fillRect(0,r(0,S),S,r(2,8)); } },
  trout(g,S,r){ // rainbow trout: olive speckled back, pink lateral band, silver-white belly (canvas top = top of car)
    const gr=g.createLinearGradient(0,0,0,S); gr.addColorStop(0,'#4e5a2c'); gr.addColorStop(0.35,'#7d8a48'); gr.addColorStop(0.47,'#c9a98a'); gr.addColorStop(0.53,'#e0708a'); gr.addColorStop(0.63,'#e58aa0'); gr.addColorStop(0.72,'#d9d4c6'); gr.addColorStop(1,'#f4f2ea'); g.fillStyle=gr; g.fillRect(0,0,S,S);
    for(let i=0;i<260;i++){ const y=r(0,S*0.66); g.fillStyle=`rgba(20,22,12,${r(0.55,0.9)})`; g.beginPath(); g.ellipse(r(0,S),y,r(2,5),r(2,4),r(0,3),0,TAU); g.fill(); }
    for(let i=0;i<50;i++){ g.fillStyle='rgba(255,255,255,0.12)'; g.fillRect(r(0,S),r(S*0.5,S*0.62),r(10,30),1.5); }
  },
  collage(g,S,r){ // torn paper conspiracy collage over tobacco brown
    noiseFill(g,S,S,'#3a2418',16);
    const papers=['#d9c8a0','#c9b48a','#e6d8b8','#8a2a22','#b9a27a','#6d5a44'];
    for(let i=0;i<55;i++){ g.save(); g.translate(r(0,S),r(0,S)); g.rotate(r(-0.5,0.5)); const w=r(30,90),h=r(24,70); g.fillStyle=papers[Math.floor(r(0,papers.length))]; g.globalAlpha=r(0.55,0.9);
      g.beginPath(); g.moveTo(-w/2,-h/2); for(let k=0;k<6;k++) g.lineTo(-w/2+w*k/5,-h/2+r(-3,3)); g.lineTo(w/2,h/2); for(let k=0;k<6;k++) g.lineTo(w/2-w*k/5,h/2+r(-3,3)); g.fill();
      g.globalAlpha=0.6; g.fillStyle='#2a1a12'; for(let l=0;l<5;l++) g.fillRect(-w/2+5,-h/2+6+l*8,r(w*0.3,w*0.85),2);
      if(r(0,1)<0.3){ g.strokeStyle='#2a1a12'; g.lineWidth=2; g.beginPath(); g.moveTo(0,-12); g.lineTo(11,8); g.lineTo(-11,8); g.closePath(); g.stroke(); g.beginPath(); g.ellipse(0,1,5,3,0,0,TAU); g.stroke(); }
      g.restore(); }
    g.globalAlpha=1; const pins=[]; for(let i=0;i<16;i++) pins.push([r(0,S),r(0,S)]);
    g.strokeStyle='rgba(200,20,30,0.85)'; g.lineWidth=1.6; for(let i=0;i<22;i++){ const a=pins[Math.floor(r(0,16))],b=pins[Math.floor(r(0,16))]; g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
    pins.forEach(p=>{ g.fillStyle='#d11'; g.beginPath(); g.arc(p[0],p[1],3,0,TAU); g.fill(); });
    for(let i=0;i<30;i++){ g.fillStyle=`rgba(20,12,8,${r(0.1,0.35)})`; g.beginPath(); g.arc(r(0,S),r(0,S),r(10,40),0,TAU); g.fill(); }
  },
};
function scaleTex(){ return canvasTex(256,256,(g,w,h)=>{ const gr=g.createLinearGradient(0,0,w,0); gr.addColorStop(0,'#5e8a6a'); gr.addColorStop(0.5,'#c86a78'); gr.addColorStop(1,'#6b8f73'); g.fillStyle=gr; g.fillRect(0,0,w,h);
  const sz=22; for(let y=-1;y<h/sz*2+1;y++) for(let x=-1;x<w/sz+1;x++){ const cx=x*sz+(y%2?sz/2:0), cy=y*sz/2; const hue=(x*37+y*11)%3; g.fillStyle=['rgba(255,150,170,0.35)','rgba(150,230,170,0.3)','rgba(220,200,255,0.3)'][hue]; g.beginPath(); g.arc(cx,cy,sz/2,0,Math.PI); g.fill(); g.strokeStyle='rgba(30,20,20,0.5)'; g.lineWidth=1.6; g.beginPath(); g.arc(cx,cy,sz/2,0.1*Math.PI,0.9*Math.PI); g.stroke(); } },{repeat:true}); }
function styleCar(v,C){
  const {B,M,chassis,body,bodyMat,roofY,frontZ,rearZ,heads,tails,rimMat,spokeMat,addDecal,box}=C;
  const out={list:[]}; const ray=new THREE.Raycaster(); body.updateMatrixWorld(true);
  const top=(x,z)=>{ ray.set(new THREE.Vector3(x,10,z),new THREE.Vector3(0,-1,0)); const h=ray.intersectObject(body)[0]; return h?h.point.y:B.ride+0.6; };
  const side=(sd,y,z)=>{ ray.set(new THREE.Vector3(sd*6,y,z),new THREE.Vector3(-sd,0,0)); const h=ray.intersectObject(body)[0]; return h?h.point.x:sd*B.W/2; };
  const mat=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:0.5},o));
  const mesh=(g,m,x,y,z,par=chassis)=>{ const o=new THREE.Mesh(g,m); o.position.set(x,y,z); o.castShadow=true; par.add(o); return o; };
  const topDecal=(tex,w,h,x,z,rot=0)=>{ const y=top(x,z)+0.012; const d=addDecal(tex,w,h,new THREE.Vector3(x,y,z),rot,-Math.PI/2); return d; };
  const sideDecal=(tex,w,h,sd,y,z)=>{ const x=side(sd,y,z)+sd*0.012; return addDecal(tex,w,h,new THREE.Vector3(x,y,z),sd*Math.PI/2); };
  const roundel=(n,bg='#f5f2ea',fg='#111')=>decalTex((g)=>{ g.fillStyle=bg; g.beginPath(); g.arc(64,64,60,0,TAU); g.fill(); g.fillStyle=fg; g.font='bold 74px "Racing Sans One", Impact, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(String(n),64,70); });
  spokeMat.color.setHex(0x0e0e10);

  // ---------------- MISSILE COMMANDER ----------------
  if(v.id==='missile'){
    bodyMat.roughness=0.55; bodyMat.clearcoat=0.2; bodyMat.metalness=0.4;
    const yel=mat(0xe8b400,{roughness:0.4}), blk=mat(0x0d0d0e,{roughness:0.6,metalness:0.4}), amb=new THREE.MeshBasicMaterial({color:0xffb020});
    // amber roof marker lights
    for(let i=-2;i<=2;i++) box(0.18,0.08,0.12,amb,i*0.26,roofY+0.05,C.roof.position.z+0.55);
    // heavy grille with a rack of missiles
    const gz=frontZ+0.04; box(2.05,0.62,0.1,blk,0,B.ride+0.92,gz); box(1.95,0.06,0.14,yel,0,B.ride+1.25,gz+0.02);
    for(let i=-2;i<=2;i++){ const m=new THREE.Group(); m.position.set(i*0.34,B.ride+0.72,gz+0.08); chassis.add(m);
      mesh(new THREE.CylinderGeometry(0.06,0.06,0.42,10),mat(0x9a9ea3,{metalness:0.8,roughness:0.3}),0,0,0,m); mesh(new THREE.ConeGeometry(0.06,0.16,10),mat(0xe8b400,{metalness:0.6}),0,0.29,0,m);
      [-1,1].forEach(sd=>mesh(new THREE.BoxGeometry(0.1,0.1,0.015),blk,sd*0.06,-0.17,0,m)); }
    // headlights: bright LED bars with amber DRL
    heads.forEach(h=>{ h.scale.set(0.9,1.8,1); h.position.y=B.ride+1.02; h.position.x=Math.sign(h.position.x)*0.92; h.position.z=gz+0.02; });
    [-1,1].forEach(sd=>box(0.36,0.04,0.04,amb,sd*0.92,B.ride+1.14,gz+0.04));
    // steel bumper + fog lights + tow hooks
    box(2.3,0.3,0.34,blk,0,B.ride+0.38,frontZ+0.16); [-0.7,0.7].forEach(x=>{ box(0.16,0.1,0.04,amb,x,B.ride+0.4,frontZ+0.34); const hk=mesh(new THREE.TorusGeometry(0.06,0.02,6,12),mat(0xe8b400),x*0.55,B.ride+0.22,frontZ+0.36); });
    // vertical exhaust stacks behind the cab (with warning bands)
    [-0.72,0.72].forEach(x=>{ const z=-0.72; mesh(new THREE.CylinderGeometry(0.09,0.09,1.5,12),blk,x,roofY+0.05,z); box(0.19,0.06,0.19,yel,x,roofY-0.25,z);
      const tip=mesh(new THREE.CylinderGeometry(0.1,0.09,0.25,12,1,true),blk,x,roofY+0.9,z-0.02); tip.rotation.x=-0.5; });
    // rocket fins along both bed rails
    const fs=new THREE.Shape(); fs.moveTo(0,0); fs.lineTo(0.5,0); fs.lineTo(0.1,0.42); fs.lineTo(-0.05,0.42); fs.closePath(); const fgm=new THREE.ExtrudeGeometry(fs,{depth:0.05,bevelEnabled:false}); fgm.rotateY(Math.PI/2);
    [-1,1].forEach(sd=>{ for(let k=0;k<3;k++){ const f=new THREE.Mesh(fgm,blk); f.position.set(sd*(B.W/2-0.12),B.ride+1.34,-1.0-k*0.55); f.castShadow=true; chassis.add(f); const edge=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.04,0.3),yel); edge.position.set(sd*(B.W/2-0.12),B.ride+1.36,-1.15-k*0.55); chassis.add(edge); } });
    // missile graphic + nameplate + star roundel
    const ms=decalTex((g)=>{ g.strokeStyle='#e8b400'; g.lineWidth=5; g.fillStyle='rgba(20,20,22,0.9)'; g.beginPath(); g.moveTo(20,64); g.lineTo(60,40); g.lineTo(380,40); g.lineTo(430,20); g.lineTo(430,108); g.lineTo(380,88); g.lineTo(60,88); g.closePath(); g.fill(); g.stroke(); g.fillStyle='#e8b400'; g.fillRect(90,52,6,24); g.fillRect(110,52,6,24); },460,128);
    const nm=decalTex((g)=>{ g.fillStyle='#e8b400'; g.font='italic bold 44px "Racing Sans One",Impact'; g.textAlign='center'; g.fillText('MISSILE COMMANDER',256,48); },512,64);
    const star=decalTex((g)=>{ g.fillStyle='#1a1a1a'; g.beginPath(); g.arc(64,64,58,0,TAU); g.fill(); g.strokeStyle='#e8b400'; g.lineWidth=7; g.stroke(); g.fillStyle='#c9c9c9'; g.beginPath(); for(let k=0;k<10;k++){ const a=k/10*TAU-Math.PI/2, rr2=k%2?18:44; g.lineTo(64+Math.cos(a)*rr2,64+Math.sin(a)*rr2);} g.fill(); });
    [-1,1].forEach(sd=>{ sideDecal(ms,2.0,0.55,sd,B.ride+0.95,-1.5); sideDecal(nm,1.5,0.19,sd,B.ride+0.55,0.2); sideDecal(star,0.46,0.46,sd,B.ride+1.05,0.55);
      // mud flaps
      box(0.05,0.5,0.5,blk,sd*(B.W/2-0.25),B.ride+0.15,B.aR-0.8); });
    rimMat.color.setHex(0x1c1c1c); spokeMat.color.setHex(0xe8b400);
  }


  // ---------------- DUCK PLASMA: a yellow rubber duck on a mini hatchback chassis ----------------
  if(v.id==='duck'){
    body.visible=false; C.roof.visible=false; chassis.children.forEach(o=>{ if(o.material===M.glass) o.visible=false; });
    heads.forEach(h=>h.visible=false);
    const rub=new THREE.MeshPhysicalMaterial({color:0xffcf1f,roughness:0.32,clearcoat:0.7,clearcoatRoughness:0.2,envMap:C.env||null});
    const beakM=new THREE.MeshPhysicalMaterial({color:0xff7a12,roughness:0.3,clearcoat:0.6});
    const blk=new THREE.MeshStandardMaterial({color:0x0a0a0a,roughness:0.15,metalness:0.2}), wht=new THREE.MeshBasicMaterial({color:0xffffff});
    const ride=B.ride;
    // mini chassis: black rubber skirt + bumpers + round headlights (the "hatchback" part)
    const skirt=mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshPhysicalMaterial({color:0x1d4fa8,roughness:0.3,clearcoat:1}),0,ride+0.3,0); skirt.geometry=roundedBox(B.W-0.15,0.36,B.L-0.25,0.16);
    [-1,1].forEach(sd=>{ const hl=new THREE.Group(); hl.position.set(sd*0.6,ride+0.55,B.L/2-0.05); chassis.add(hl);
      mesh(new THREE.TorusGeometry(0.14,0.035,10,24),M.chrome,0,0,0,hl); mesh(new THREE.CircleGeometry(0.13,20),M.head,0,0,0.005,hl); });
    box(1.0,0.08,0.1,M.chrome,0,ride+0.36,B.L/2-0.05);
    // duck body: plump teardrop
    const bodyG=new THREE.SphereGeometry(1,40,28); const bp=bodyG.attributes.position;
    for(let i=0;i<bp.count;i++){ let x=bp.getX(i),y=bp.getY(i),z=bp.getZ(i); const back=Math.max(0,-z); y+=back*back*0.55*Math.max(0,y+0.2); if(y<0) y*=0.7; bp.setXYZ(i,x,y,z); }
    bodyG.computeVertexNormals();
    const db=mesh(bodyG,rub,0,ride+1.0,-0.15); db.scale.set(0.98,0.62,1.72);
    // wings
    [-1,1].forEach(sd=>{ const w=mesh(new THREE.SphereGeometry(1,24,16),rub,sd*0.86,ride+1.05,-0.35); w.scale.set(0.16,0.34,0.72); w.rotation.x=-0.25; });
    // head + beak + eyes
    const head=mesh(new THREE.SphereGeometry(0.62,36,26),rub,0,ride+1.95,0.85);
    const bu=mesh(new THREE.SphereGeometry(1,28,18),beakM,0,ride+1.82,1.45); bu.scale.set(0.34,0.13,0.4);
    const bl=mesh(new THREE.SphereGeometry(1,24,14),beakM,0,ride+1.71,1.38); bl.scale.set(0.27,0.08,0.3);
    [-1,1].forEach(sd=>{ const e=mesh(new THREE.SphereGeometry(0.1,18,14),blk,sd*0.3,ride+2.1,1.33); e.scale.set(0.8,1.15,0.6); mesh(new THREE.SphereGeometry(0.03,8,6),wht,sd*0.3+sd*0.02,ride+2.15,1.39); });
    // tail tuft
    const tail=mesh(new THREE.ConeGeometry(0.3,0.55,24),rub,0,ride+1.55,-1.72); tail.rotation.x=-1.0;
    rimMat.color.setHex(0xf2f2f2); spokeMat.color.setHex(0xffcf1f);
    // bob / squash while driving
    const bob=[db,head,bu,bl]; const base=bob.map(o=>o.position.y);
    out.list.push((dt,t,car)=>{ const sp=car?Math.min(1,car.speed/40):0.2; const off=Math.sin(t*(4+sp*6))*0.025*(0.3+sp); bob.forEach((o,k)=>o.position.y=base[k]+off*(k?1.4:1)); head.rotation.z=car?clamp(car.latA*0.004,-0.15,0.15):Math.sin(t)*0.05; });
  }

  // ---------------- TROUT PROTOCOL: a rainbow trout hypercar ----------------
  if(v.id==='trout'){
    // project the livery from the side so the back is olive and the belly silver
    const g0=body.geometry, pp=g0.attributes.position, uv=g0.attributes.uv; let ymax=0; for(let i=0;i<pp.count;i++) ymax=Math.max(ymax,pp.getY(i));
    for(let i=0;i<pp.count;i++){ const nz=Math.abs(g0.attributes.normal.getY(i)); let vv=pp.getY(i)/ymax; if(nz>0.7 && pp.getY(i)>ymax*0.55) vv=1; uv.setXY(i,pp.getZ(i)*0.22,clamp(vv,0.02,0.98)); }
    uv.needsUpdate=true; bodyMat.map.repeat.set(1,1); bodyMat.map.offset.set(0,0); bodyMat.roughness=0.3; bodyMat.metalness=0.15;
    const finM=new THREE.MeshPhysicalMaterial({color:0x7d8a48,roughness:0.45,clearcoat:0.5,side:THREE.DoubleSide,transparent:true,opacity:0.95});
    const finShape=(pts)=>{ const s2=new THREE.Shape(); pts.forEach((p,i)=>i?s2.lineTo(p[0],p[1]):s2.moveTo(p[0],p[1])); return s2; };
    const finMesh=(shape,thick)=>{ const g=new THREE.ExtrudeGeometry(shape,{depth:thick,bevelEnabled:true,bevelThickness:0.02,bevelSize:0.02,bevelSegments:2,curveSegments:12}); g.translate(0,0,-thick/2); g.rotateY(-Math.PI/2); return g; };
    // forked tail fin at the rear
    const ts=new THREE.Shape(); ts.moveTo(0,0); ts.quadraticCurveTo(-0.3,0.15,-0.75,0.75); ts.quadraticCurveTo(-0.55,0.3,-0.6,0.05); ts.quadraticCurveTo(-0.55,-0.2,-0.75,-0.5); ts.quadraticCurveTo(-0.3,-0.1,0,-0.12); ts.closePath();
    const tf=new THREE.Mesh(finMesh(ts,0.06),finM); const tz=rearZ+0.35; tf.position.set(0,top(0,tz)+0.3,tz); tf.castShadow=true; chassis.add(tf);
    // dorsal fin on the roof
    const ds=new THREE.Shape(); ds.moveTo(0.3,0); ds.quadraticCurveTo(0.1,0.45,-0.55,0.42); ds.quadraticCurveTo(-0.7,0.2,-0.9,0); ds.closePath();
    const df=new THREE.Mesh(finMesh(ds,0.04),finM); df.position.set(0,roofY-0.02,C.roof.position.z-0.15); df.castShadow=true; chassis.add(df);
    // adipose fin + pectoral fins by the front wheels
    const ad=new THREE.Mesh(finMesh(finShape([[0,0],[-0.15,0.18],[-0.35,0]]),0.03),finM); ad.position.set(0,top(0,-1.2),-1.2); chassis.add(ad);
    [-1,1].forEach(sd=>{ const pf=new THREE.Mesh(new THREE.ExtrudeGeometry(finShape([[0,0],[-0.55,0.06],[-0.4,-0.14]]),{depth:0.03,bevelEnabled:false}),finM); pf.rotation.set(-Math.PI/2+0.3*sd,0,Math.PI/2*sd);
      pf.rotation.order='YXZ'; pf.rotation.set(0.35,sd>0?Math.PI/2:-Math.PI/2,0); pf.position.set(side(sd,B.ride+0.3,B.aF-0.7)+sd*0.02,B.ride+0.28,B.aF-0.7); chassis.add(pf); });
    // fish eyes on the front flanks + gill arcs + mouth
    const eyeTex=decalTex((g)=>{ g.fillStyle='#e8c35a'; g.beginPath(); g.arc(64,64,58,0,TAU); g.fill(); g.fillStyle='#0a0a0a'; g.beginPath(); g.arc(64,64,34,0,TAU); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(50,50,9,0,TAU); g.fill(); });
    const gill=decalTex((g)=>{ g.strokeStyle='rgba(120,30,40,0.85)'; g.lineWidth=7; for(let k=0;k<2;k++){ g.beginPath(); g.arc(-60+k*22,64,110,-0.55,0.55); g.stroke(); } });
    [-1,1].forEach(sd=>{ const d=sideDecal(eyeTex,0.3,0.3,sd,B.ride+0.4,frontZ-0.55); const gd=sideDecal(gill,0.5,0.55,sd,B.ride+0.38,frontZ-1.05); if(sd<0) gd.scale.x=-1; });
    box(0.9,0.05,0.05,mat(0x3a1a20),0,B.ride+0.22,frontZ+0.02);
    rimMat.color.setHex(0x3a4020); spokeMat.color.setHex(0x9aa05a);
    // tail swish
    out.list.push((dt,t,car)=>{ const lat=car?car.latA:0; tf.rotation.y=Math.sin(t*(car?6:2.5))*0.12+clamp(lat*0.004,-0.25,0.25); });
  }

  // ---------------- CONCORDANCE: war hero's silk-black limousine ----------------
  if(v.id==='concord'){
    bodyMat.roughness=0.42; bodyMat.metalness=0.35; bodyMat.clearcoat=0.35; bodyMat.clearcoatRoughness=0.35; bodyMat.map.repeat.set(0.3,0.3);
    const gold=M.gold;
    // tall chrome waterfall grille + bumper blades
    const gz=frontZ+0.02; box(1.1,0.42,0.06,M.chrome,0,B.ride+0.52,gz); for(let k=-5;k<=5;k++) box(0.03,0.38,0.08,mat(0x1a1a1a),k*0.095,B.ride+0.52,gz+0.01);
    box(1.9,0.1,0.12,M.chrome,0,B.ride+0.22,frontZ+0.04); box(1.9,0.1,0.12,M.chrome,0,B.ride+0.22,rearZ-0.04);
    heads.forEach(h=>{ h.scale.set(0.7,1.2,1); h.position.x=Math.sign(h.position.x)*0.78; });
    // gold pinstripe along both flanks
    [-1,1].forEach(sd=>{ const x=side(sd,B.ride+0.72,0); box(0.02,0.03,B.L-0.7,gold,x+sd*0.006,B.ride+0.72,0); box(0.02,0.07,B.L-1.2,M.chrome,side(sd,B.ride+0.3,0)+sd*0.006,B.ride+0.3,0); });
    // AK-47 silhouette texture (used for crest + trunk badge)
    const drawAK=(g,sc,col)=>{ g.save(); g.scale(sc,sc); g.fillStyle=col; g.beginPath();
      g.moveTo(0,20); g.lineTo(38,16); g.lineTo(46,12); g.lineTo(120,12); g.lineTo(120,8); g.lineTo(150,8); g.lineTo(150,14); g.lineTo(122,16); g.lineTo(118,22); g.lineTo(84,22); // barrel/handguard/receiver top
      g.lineTo(80,40); g.quadraticCurveTo(76,52,70,54); g.lineTo(64,50); g.quadraticCurveTo(70,40,70,24); // curved magazine
      g.lineTo(58,24); g.lineTo(52,36); g.lineTo(44,36); g.lineTo(46,24); g.lineTo(36,24); g.lineTo(6,38); g.lineTo(0,30); g.closePath(); g.fill(); g.restore(); };
    const crest=decalTex((g)=>{ g.translate(128,128); [-1,1].forEach(sd=>{ g.save(); g.rotate(sd*0.62); g.translate(-80,-18); drawAK(g,1.05,'#d4a33a'); g.restore(); });
      g.fillStyle='#d4a33a'; g.beginPath(); for(let k=0;k<10;k++){ const a=k/10*TAU-Math.PI/2, rr2=k%2?11:26; g.lineTo(Math.cos(a)*rr2,Math.sin(a)*rr2-46);} g.fill();
      g.strokeStyle='#d4a33a'; g.lineWidth=4; g.beginPath(); g.arc(0,8,86,0.35,Math.PI-0.35); g.stroke(); },256,256);
    const ribbon=decalTex((g)=>{ const cs=['#7a1020','#f2f2f2','#1f3f8a','#d4a33a','#2e6b3a','#b3202a']; for(let k=0;k<6;k++){ g.fillStyle=cs[k]; g.fillRect((k%3)*42+2,Math.floor(k/3)*30+4,40,28);} },128,64);
    [-1,1].forEach(sd=>{ sideDecal(crest,0.9,0.9,sd,B.ride+0.52,-0.4); sideDecal(ribbon,0.3,0.15,sd,B.ride+0.62,B.aF-0.55); });
    const tb=decalTex((g)=>{ g.fillStyle='#d4a33a'; g.font='bold 34px "Chakra Petch",sans-serif'; g.textAlign='center'; g.fillText('C O N C O R D A N C E',256,44); },512,64);
    addDecal(tb,1.2,0.15,new THREE.Vector3(0,B.ride+0.82,rearZ-0.02),Math.PI);
    // gold AK-47 hood ornament
    const ornTex=decalTex((g)=>{ g.translate(8,40); drawAK(g,0.75,'#e0b44a'); },128,128);
    const orn=new THREE.Group(); const oz=frontZ-0.3; orn.position.set(0,top(0,oz)+0.02,oz); chassis.add(orn);
    mesh(new THREE.CylinderGeometry(0.05,0.07,0.06,12),gold,0,0.03,0,orn);
    const op=new THREE.Mesh(new THREE.PlaneGeometry(0.42,0.42),new THREE.MeshStandardMaterial({map:ornTex,transparent:true,metalness:1,roughness:0.25,color:0xffffff,side:THREE.DoubleSide,alphaTest:0.3,envMap:C.env||null})); op.rotation.y=Math.PI/2; op.position.set(0,0.13,0.05); orn.add(op);
    // fender flag staffs (diplomatic style) with waving flags
    const flagTex=decalTex((g)=>{ for(let k=0;k<13;k++){ g.fillStyle=k%2?'#ffffff':'#b3202a'; g.fillRect(0,k*64/13,128,64/13+0.5);} g.fillStyle='#1f3f8a'; g.fillRect(0,0,54,35); g.fillStyle='#fff'; for(let a=0;a<4;a++) for(let b=0;b<3;b++){ g.fillRect(6+a*12,5+b*10,3,3);} },128,64);
    const flags=[];
    [-1,1].forEach(sd=>{ const fx=sd*0.72, fz=frontZ-0.45, fy=top(fx,fz); mesh(new THREE.CylinderGeometry(0.012,0.012,0.55,6),M.chrome,fx,fy+0.27,fz); mesh(new THREE.SphereGeometry(0.025,8,6),gold,fx,fy+0.56,fz);
      const fg=new THREE.PlaneGeometry(0.34,0.2,8,1); fg.translate(-0.17,0,0); const f=new THREE.Mesh(fg,new THREE.MeshStandardMaterial({map:flagTex,side:THREE.DoubleSide,roughness:0.8}));
      f.rotation.y=Math.PI/2; f.position.set(fx,fy+0.44,fz); chassis.add(f); flags.push(f); });
    rimMat.color.setHex(0x0e0e0e); spokeMat.color.setHex(0xd4a33a);
    out.list.push((dt,t,car)=>{ const sp=car?Math.min(1,car.speed/30):0.35; flags.forEach((f,k)=>{ const p=f.geometry.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i); p.setZ(i,Math.sin(x*18+t*(6+sp*14)+k)*0.03*(-x/0.34)*(0.4+sp)); } p.needsUpdate=true; }); });
  }
  return out;
}
function roundedBox(w,h,d,r){ const s=new THREE.Shape(); const x=-d/2,y=-h/2; s.moveTo(x+r,y); s.lineTo(x+d-r,y); s.quadraticCurveTo(x+d,y,x+d,y+r); s.lineTo(x+d,y+h-r); s.quadraticCurveTo(x+d,y+h,x+d-r,y+h); s.lineTo(x+r,y+h); s.quadraticCurveTo(x,y+h,x,y+h-r); s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y);
  const g=new THREE.ExtrudeGeometry(s,{depth:w-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r*0.9,bevelSegments:5,curveSegments:10}); g.translate(0,0,-(w-2*r)/2); g.rotateY(-Math.PI/2); g.computeVertexNormals(); return g; }


// ===== GLB CAR MODELS (Meshy exports supplied by the player) =====
// GLB_DATA (base64 per vehicle id) is injected by the build.
const CAR_GLTF={}, GLB_PROC={};
const GLB_ROT={brcc:Math.PI/2, fdc:Math.PI/2, hellcat:Math.PI/2};
const GLB_LEN={hellcat:4.9,brcc:4.4,fdc:5.3,duck:3.9,gt44:4.4,donut:4.5,missile:5.8,bpd:4.8,concord:5.8,trout:5.0,leopard:4.5,lightning:4.75,genlee:5.1,eggplant:4.5,voyager:7.0};
const GLB_TEXTURES={}; let GLB_ERROR='';
const PROP_IDS=new Set(['env_revolution','rv_troops','rv_props','rv_heroes','env_alondra','env_neon','env_coast','env_mesa','env_sweet','grandstand','rrsign','dolly','knives','trio','gate','solocup','church','donkeys','hijoe','palm','mrblack','ak','shoe_factory','claw_can','echelon_can','watch_shop','watch_sign','range_sign','pbboard','pbpole']);
function propsForTrack(def){ const need=new Set(['grandstand','rrsign']);
  for(const id in PROP_INFO){ const i=PROP_INFO[id]; if((i.themes&&i.themes[def.id])||(i.median&&i.median[def.id])) need.add(id); }
  if(def.theme==='oval'){ need.add('pbpole'); need.add('pbboard'); }
  if(def.theme==='city') need.add('palm'); if(def.shooters){ need.add('mrblack'); need.add('ak'); } if(def.monument){ need.add('solocup'); need.add('dolly'); } if((def.jumps||[]).some(j=>j.dukes)&&GLB_DATA.genlee) need.add('genlee');
  if(def.id==='revolution'){ ['rv_troops','rv_props','rv_heroes','hijoe','knives','donkeys','trio'].forEach(id=>need.add(id)); }
  if(typeof GLB_DATA!=='undefined'&&GLB_DATA['env_'+def.id]&&!(window.GAME&&GAME.q&&GAME.q.env===false)) need.add('env_'+def.id);
  if(need.has('env_'+def.id)&&typeof ENV_CFG!=='undefined'&&ENV_CFG[def.id]){ const c=ENV_CFG[def.id]; (c.skipProps||[]).forEach(id=>need.delete(id)); if(c.skipStand) need.delete('grandstand'); }
  return [...need].filter(id=>typeof GLB_DATA!=='undefined'&&GLB_DATA[id]&&!CAR_GLTF[id]); }
function loadCarGLBs(done,progress,only){
  const data=(typeof GLB_DATA!=='undefined')?GLB_DATA:{}; const ids=only?only.filter(id=>data[id]&&!CAR_GLTF[id]):Object.keys(data).filter(id=>!PROP_IDS.has(id));
  if(!ids.length){ done(); return; }
  if(!THREE.GLTFLoader){ GLB_ERROR='model loader missing'; done(); return; }
  const texSrc=(typeof GLB_TEX!=='undefined')?GLB_TEX:{};
  // 1) decode textures through plain <img> data URIs (works under strict hosting rules)
  const jobs=[]; ids.forEach(id=>{ GLB_TEXTURES[id]=GLB_TEXTURES[id]||{}; Object.entries(texSrc[id]||{}).forEach(([slot,uri])=>{ jobs.push(new Promise(res=>{ const im=new Image(); im.onload=()=>{ const t=new THREE.Texture(im); t.flipY=false; if(slot==='base') GFX.compat.srgb(t); t.anisotropy=4; t.needsUpdate=true; GLB_TEXTURES[id][slot]=t; res(); }; im.onerror=()=>{ GLB_ERROR='texture '+id+'/'+slot; res(); }; im.src=uri; })); }); });
  Promise.all(jobs).then(()=>{
    const L=GFX.assets.configureLoader(new THREE.GLTFLoader()); let left=ids.length, k=0;   // + KTX2/Meshopt decoders on r186
    const next=()=>{ if(k>=ids.length) return; const id=ids[k++];
      const parse=buf=>L.parse(buf,'',g=>{ CAR_GLTF[id]=GFX.assets.postLoad?GFX.assets.postLoad(id,g.scene):g.scene; fin(); },e=>{ GLB_ERROR=id+': '+(e&&e.message||e); console.warn('GLB failed',id,e); fin(); });
      const src=GFX.assets.src(id,data[id]);   // optimized V2 variant when available
      if(/\.glb(\?|$)/i.test(src)){ fetch(src).then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status+' '+src); return r.arrayBuffer(); }).then(parse).catch(e=>{ GLB_ERROR=id+': '+e.message; fin(); }); return; }
      try{ const s=atob(src); const u=new Uint8Array(s.length); for(let i=0;i<s.length;i++) u[i]=s.charCodeAt(i); parse(u.buffer); }
      catch(e){ GLB_ERROR=id+': '+e.message; console.warn('GLB decode failed',id,e); fin(); } };
    const fin=()=>{ left--; if(progress) progress(ids.length-left,ids.length); if(left<=0) done(); else setTimeout(next,0); };
    next();
  });
}
function processGLB(id){
  if(GLB_PROC[id]) return GLB_PROC[id];
  const sc=CAR_GLTF[id]; sc.updateMatrixWorld(true);
  const meshes=[]; sc.traverse(o=>{ if(o.isMesh) meshes.push(o); });
  meshes.forEach(o=>{ o.geometry=o.geometry.clone(); o.geometry.applyMatrix4(o.matrixWorld); if(GLB_ROT[id]) o.geometry.rotateY(GLB_ROT[id]); if(!o.geometry.attributes.normal) o.geometry.computeVertexNormals(); });
  const box=new THREE.Box3(); meshes.forEach(o=>{ o.geometry.computeBoundingBox(); box.union(o.geometry.boundingBox); });
  const size=box.getSize(new THREE.Vector3()), s=(GLB_LEN[id]||4.5)/size.z;
  const cx=(box.min.x+box.max.x)/2, cz=(box.min.z+box.max.z)/2, my=box.min.y;
  const body=[], wheels=[];
  meshes.forEach(o=>{ const g=o.geometry; g.translate(-cx,-my,-cz); g.scale(s,s,s); g.computeBoundingBox();
    const mt=o.material; if(mt){ const T=GLB_TEXTURES[id]||{}; mt.flatShading=false; if(T.base){ mt.map=T.base; mt.color.setHex(0xffffff); } if(T.normal) mt.normalMap=T.normal; if(T.mr){ mt.roughnessMap=T.mr; mt.metalnessMap=T.mr; } mt.needsUpdate=true; }
    if(/wheel/i.test(o.name)){ const c=g.boundingBox.getCenter(new THREE.Vector3()); const ws=g.boundingBox.getSize(new THREE.Vector3()); g.translate(-c.x,-c.y,-c.z);
      wheels.push({name:o.name,c,r:ws.y/2,w:ws.x,geo:g,mat:mt,front:/F[LR]/.test(o.name)}); }
    else body.push({geo:g,mat:mt}); });
  const bb=new THREE.Box3(); body.forEach(b=>bb.union(b.geo.boundingBox)); const bs=bb.getSize(new THREE.Vector3());
  const fr=wheels.filter(w=>w.front), rr2=wheels.filter(w=>!w.front);
  const avg=(a,f)=>a.length?a.reduce((t,w)=>t+f(w),0)/a.length:0;
  const P={body,wheels,L:bs.z,W:bs.x,H:bs.y,wr:avg(wheels,w=>w.c.y)||0.36,ww:avg(wheels,w=>w.w)||0.3,aF:avg(fr,w=>w.c.z),aR:avg(rr2,w=>w.c.z),zMin:bb.min.z,zMax:bb.max.z};
  GLB_PROC[id]=P; return P;
}
function applyGlbModel(m,v,env){
  const P=processGLB(v.id);
  // hide the procedural car, keep the effect rig (boost flames, shield bubble)
  const keep=new Set([m.shield,...m.flames]);
  m.root.traverse(o=>{ if(o!==m.root && o!==m.chassis && (o.isMesh||o.isSprite||o.isLine) && !keep.has(o)) o.visible=false; });
  const mats=new Map(); const matFor=mt=>{ if(!mats.has(mt)){ const c=mt.clone(); glbAniso(c); c.envMap=env||null; c.envMapIntensity=0.9; mats.set(mt,c); } return mats.get(mt); };
  const bodyMeshes=[];
  P.body.forEach(b=>{ const o=new THREE.Mesh(b.geo,matFor(b.mat)); o.castShadow=true; o.receiveShadow=false; m.chassis.add(o); bodyMeshes.push(o); });
  const wheels=[], steer=[];
  P.wheels.forEach(w=>{ const piv=new THREE.Group(); piv.position.copy(w.c); m.root.add(piv); const spin=new THREE.Group(); piv.add(spin);
    const o=new THREE.Mesh(w.geo,matFor(w.mat)); o.castShadow=true; spin.add(o); wheels.push(spin); if(w.front) steer.push(piv); });
  // tail-light glow (brighter when braking)
  const tailMat=new THREE.SpriteMaterial({map:glbGlowTex(),color:0x8c0814,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true});
  const ray=new THREE.Raycaster();
  [-1,1].forEach(sd=>{ const x=sd*P.W*0.34, y=Math.min(P.H*0.45,1.0); ray.set(new THREE.Vector3(x,y,P.zMin-3),new THREE.Vector3(0,0,1)); const h=ray.intersectObjects(bodyMeshes)[0];
    const sp=new THREE.Sprite(tailMat); sp.scale.set(0.45,0.3,1); sp.position.set(x,y,(h?h.point.z:P.zMin)-0.05); m.chassis.add(sp); });
  m.flames.forEach((f,k)=>{ f.position.set((k?1:-1)*0.35,0.4,P.zMin-0.1); });
  m.shield.scale.set(P.W*0.75,Math.max(1.1,P.H*0.7),P.L*0.62);
  m.wheels=wheels; m.steerPivots=steer; m.tailMat=tailMat; m.lightbar=null; m.anims=[];
  m.dims=Object.assign({},m.dims,{H:P.H,L:P.L,W:P.W,wr:P.wr,ww:P.ww,aF:P.aF,aR:P.aR}); m.glb=true;
  return m;
}
let _glbGlow=null; function glbGlowTex(){ if(!_glbGlow) _glbGlow=canvasTex(64,64,(g)=>{ const gr=g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.35,'rgba(255,255,255,0.6)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64); }); return _glbGlow; }

// ---------- scenery props (GLB) ----------
const PROP_INFO={
  watch_shop:{h:7, kind:'building', themes:{sweet:2, alondra:3}},
  watch_sign:{h:10, kind:'billboard', face:1, themes:{sweet:1, alondra:1}},
  range_sign:{h:4, kind:'billboard', face:-1, themes:{mesa:2, alondra:1}},
  solocup:{h:30, kind:'manual'},
  grandstand:{h:11, kind:'manual'}, rrsign:{h:9, kind:'manual'}, dolly:{h:8, kind:'manual'},
  knives:{h:8, kind:'billboard', face:1, themes:{sweet:1, mesa:1, coast:1, neon:1, alondra:1}},
  trio:{h:7, kind:'billboard', face:1, themes:{country:1}},
  gate:{h:3.2, kind:'building', themes:{country:4}},
  church:{h:20, kind:'building', themes:{country:1}},
  donkeys:{h:4.2, kind:'billboard', face:1, themes:{country:1}},
  hijoe:{h:9, kind:'billboard', face:1, themes:{sweet:1, mesa:1, coast:1, neon:1, alondra:1, country:1}},
  palm:{h:12, kind:'manual'}, mrblack:{h:1.85, kind:'manual'}, ak:{len:0.9, kind:'manual'},
  shoe_factory:{h:12, kind:'building', themes:{sweet:1, alondra:1, neon:2}},
  claw_can:{h:6, kind:'billboard', face:1, themes:{sweet:1, alondra:1}, median:{sweet:[22,40,58]}},
  echelon_can:{h:6, kind:'billboard', face:-1, themes:{sweet:1, alondra:1}, median:{sweet:[31,49]}},
  // Pepperbox TV billboard: one steel bulletin structure, a different show on every board (PB_SHOWS)
  pbboard:{kind:'billboard', face:1, pepperbox:true, themes:{mesa:2, coast:1, neon:2, country:2}},                 // ground bulletin (open roads), 17.6 x 9 m
  pbpole:{kind:'billboard', face:1, pepperbox:true, pole:true, themes:{sweet:2, alondra:3, coast:2}},                    // city: the same board on a 21 m monopole, reads over the rooftops
};
// Pepperbox TV shows (key art from pepperbox.tv, models/props/pepperbox/<id>.jpg, 2048x1024, light weathering baked in)
const PB_SHOWS=["boysinthegarage", "battleinnajaf", "kindaconsensual", "underwhelminginc", "unfiltered", "lethimcook", "awfulandlawful", "internetesquire", "underwhelmingaftershow", "9holereviews", "acquisitionsanonymous", "administrativeresults", "americanmarksman", "unsubscribe", "brandonherrera", "habituallinecrosser", "pewview", "forgottenweapons", "kentuckyballistics", "micahmayfield", "unsubscribegang", "underwhelmingpodcast", "manvsmorning", "fatelectrician", "cappyarmy", "lorelodge", "angrycops", "cappyscombatreview", "overserved", "junkyarddigs", "millennialfarmer", "underqualified", "operationdonut"];
let PB_NEXT=Math.floor(Math.random()*PB_SHOWS.length), PB_ORDER=null; const PB_TEX={};
// every board of a race shows a different show; the rotation carries on to the next race so it is never the same set twice in a row
function pbNextShow(){ if(!PB_ORDER){ PB_ORDER=PB_SHOWS.slice(); for(let i=PB_ORDER.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [PB_ORDER[i],PB_ORDER[j]]=[PB_ORDER[j],PB_ORDER[i]]; } }
  const id=PB_ORDER[PB_NEXT%PB_ORDER.length]; PB_NEXT++; return id; }
function pbFace(o){ const id=pbNextShow(); o.userData.show=id; o.traverse(m=>{ if(!m.isMesh||!m.material||m.material.name!=='pb_face') return; const mt=m.material.clone(); m.material=mt;
    const apply=t=>{ mt.map=t; mt.emissiveMap=t; mt.needsUpdate=true; };
    if(PB_TEX[id]) apply(PB_TEX[id]);
    else new THREE.TextureLoader().load('models/props/pepperbox/'+id+'.jpg?v=1',t=>{ t.flipY=false; GFX.compat.srgb(t); t.anisotropy=8; PB_TEX[id]=t; apply(t); },undefined,e=>console.warn('pepperbox face',id,e)); }); }
const PROP_PROC={}; const PROP_DBG={fp:0,cand:0};
function propTemplate(id){
  if(PROP_PROC[id]) return PROP_PROC[id]; if(!CAR_GLTF[id]) return null;
  const sc=CAR_GLTF[id]; sc.updateMatrixWorld(true); const parts=[]; const box=new THREE.Box3();
  sc.traverse(o=>{ if(!o.isMesh) return; const g=o.geometry.clone(); g.applyMatrix4(o.matrixWorld); if(!g.attributes.normal) g.computeVertexNormals(); g.computeBoundingBox(); box.union(g.boundingBox);
    const mt=o.material.clone(); const T=GLB_TEXTURES[id]||{}; if(T.base){ mt.map=T.base; mt.color.setHex(0xffffff); } if(T.normal) mt.normalMap=T.normal; if(T.mr){ mt.roughnessMap=T.mr; mt.metalnessMap=T.mr; } mt.flatShading=false; glbAniso(mt); if((PROP_INFO[id]||{}).pepperbox){ if(/^pb_(face|plate)$/.test(mt.name)){ mt.emissiveMap=mt.map; mt.emissive=new THREE.Color(0xffffff); mt.emissiveIntensity=mt.name==='pb_face'?0.32:0.45; } if(mt.name==='pb_grate'){ mt.transparent=false; mt.alphaTest=0.5; mt.side=THREE.DoubleSide; mt.depthWrite=true; } }
    else if((PROP_INFO[id]||{}).kind==='billboard' && mt.map){ mt.emissiveMap=mt.map; mt.emissive=new THREE.Color(0xffffff); mt.emissiveIntensity=0.35; } mt.needsUpdate=true; parts.push({g,mt}); });
  const info=PROP_INFO[id]||{}; const size=box.getSize(new THREE.Vector3()); const s=info.len?info.len/Math.max(size.x,size.z):(info.h||size.y)/size.y; const cx=(box.min.x+box.max.x)/2, cz=(box.min.z+box.max.z)/2;
  parts.forEach(p=>{ p.g.translate(-cx,-box.min.y,-cz); p.g.scale(s,s,s); });
  const T={parts,w:size.x*s,d:size.z*s,h:size.y*s}; PROP_PROC[id]=T; return T;
}
function makeProp(id){ const T=propTemplate(id); if(!T) return null; const grp=new THREE.Group(); T.parts.forEach(p=>{ const m=new THREE.Mesh(p.g,p.mt); m.castShadow=true; m.receiveShadow=true; grp.add(m); }); return grp; }
// Pepperbox boards must be seen: sight lines from the approach (driver's eye, three distances) to five points of the
// face are tested against everything already built (environment model, terrain, earlier props), and the body of the
// board is swept for geometry it would stand in. A spot that is hidden or buried in rock is skipped.
const PB_VIS={W:null,why:{}};
// one pass over the scenery: world-space triangles in a 32 m grid, so a sight line only tests the triangles near it
function pbIndex(W){ const C=32, cells=new Map(), big=[]; let tri=new Float32Array(9*65536), solid=new Uint8Array(65536), n=0; const inst=[]; const v=new THREE.Vector3();
  W.group.updateMatrixWorld(true);
  W.group.traverse(o=>{ if(!o.isMesh||!o.visible||!o.geometry||o.isSkinnedMesh) return; const m=Array.isArray(o.material)?o.material[0]:o.material; if(!m||m.side===THREE.BackSide) return;
    const g=o.geometry, pos=g.attributes&&g.attributes.position; if(!pos) return; if(!g.boundingSphere) g.computeBoundingSphere(); if(g.boundingSphere.radius*o.matrixWorld.getMaxScaleOnAxis()>2500) return;   // sky, sea, far backdrop
    const sol=!(m.isShaderMaterial||(m.transparent&&!m.alphaTest)||m.blending===THREE.AdditiveBlending)?1:0;
    if(o.isInstancedMesh){ if(sol) inst.push(o); return; }
    const ix=g.index, cnt=ix?ix.count:pos.count, mw=o.matrixWorld;
    const P=new Float32Array(pos.count*3); for(let k=0;k<pos.count;k++){ v.fromBufferAttribute(pos,k).applyMatrix4(mw); P[k*3]=v.x; P[k*3+1]=v.y; P[k*3+2]=v.z; }
    for(let k=0;k+2<cnt;k+=3){ const i0=ix?ix.getX(k):k, i1=ix?ix.getX(k+1):k+1, i2=ix?ix.getX(k+2):k+2;
      if(n>=solid.length){ const t2=new Float32Array(tri.length*2); t2.set(tri); tri=t2; const s2=new Uint8Array(solid.length*2); s2.set(solid); solid=s2; }
      const q=n*9; for(let c=0;c<3;c++){ tri[q+c]=P[i0*3+c]; tri[q+3+c]=P[i1*3+c]; tri[q+6+c]=P[i2*3+c]; } solid[n]=sol;
      const x0=Math.floor(Math.min(tri[q],tri[q+3],tri[q+6])/C), x1=Math.floor(Math.max(tri[q],tri[q+3],tri[q+6])/C), z0=Math.floor(Math.min(tri[q+2],tri[q+5],tri[q+8])/C), z1=Math.floor(Math.max(tri[q+2],tri[q+5],tri[q+8])/C);
      if((x1-x0+1)*(z1-z0+1)>36) big.push(n); else for(let cx=x0;cx<=x1;cx++) for(let cz=z0;cz<=z1;cz++){ const key=cx*65536+cz; let a=cells.get(key); if(!a) cells.set(key,a=[]); a.push(n); }
      n++; } });
  return {C,cells,big,tri,solid,n,inst,ray:new THREE.Raycaster()}; }
// does the segment a->b hit anything? (all=true also counts glowing / see-through things: LED arches, glass)
function pbHit(I,a,b,all){ const dx=b.x-a.x, dy=b.y-a.y, dz=b.z-a.z, T=I.tri, C=I.C;
  const test=k=>{ if(!all&&!I.solid[k]) return false; const q=k*9, ax=T[q],ay=T[q+1],az=T[q+2], e1x=T[q+3]-ax,e1y=T[q+4]-ay,e1z=T[q+5]-az, e2x=T[q+6]-ax,e2y=T[q+7]-ay,e2z=T[q+8]-az;
    const px=dy*e2z-dz*e2y, py=dz*e2x-dx*e2z, pz=dx*e2y-dy*e2x, det=e1x*px+e1y*py+e1z*pz; if(det>-1e-9&&det<1e-9) return false; const f=1/det, sx=a.x-ax, sy=a.y-ay, sz=a.z-az;
    const u=f*(sx*px+sy*py+sz*pz); if(u<0||u>1) return false; const qx=sy*e1z-sz*e1y, qy=sz*e1x-sx*e1z, qz=sx*e1y-sy*e1x; const w=f*(dx*qx+dy*qy+dz*qz); if(w<0||u+w>1) return false;
    const t=f*(e2x*qx+e2y*qy+e2z*qz); return t>0.002&&t<0.998; };
  const x0=Math.floor(Math.min(a.x,b.x)/C), x1=Math.floor(Math.max(a.x,b.x)/C), z0=Math.floor(Math.min(a.z,b.z)/C), z1=Math.floor(Math.max(a.z,b.z)/C);
  for(let cx=x0;cx<=x1;cx++) for(let cz=z0;cz<=z1;cz++){ const arr=I.cells.get(cx*65536+cz); if(arr) for(let k=0;k<arr.length;k++) if(test(arr[k])) return true; }
  for(let k=0;k<I.big.length;k++) if(test(I.big[k])) return true;
  if(I.inst.length){ const len=Math.hypot(dx,dy,dz)||1; I.ray.set(a,new THREE.Vector3(dx/len,dy/len,dz/len)); I.ray.near=0; I.ray.far=len; if(I.ray.intersectObjects(I.inst,false).length) return true; }
  return false; }
// Pepperbox boards must be seen: sight lines from the approach (driver's eye, three distances) to seven points of the
// face are tested against everything already built (environment model, terrain, earlier props), the body of the board
// is swept for geometry it would stand in, and the road must have open sky. A hidden or buried spot is skipped.
function pbSpotOK(W,P,i,x,y,z,ang,info){
  if(PB_VIS.W!==W){ PB_VIS.W=W; PB_VIS.I=pbIndex(W); }
  const I=PB_VIS.I, why=PB_VIS.why, no=k=>{ why[k]=(why[k]||0)+1; return false; }; if(!I.n&&!I.inst.length) return true;
  const ax=Math.cos(ang), az=-Math.sin(ang), nx=Math.sin(ang), nz=Math.cos(ang);   // board x axis, face normal
  const lift=info.pole?12:0, zc=y+1.95+lift+3.06;                                    // face centre height
  const V=(px,py,pz)=>new THREE.Vector3(px,py,pz), eyes=[];
  // 1) the board faces the approach (not its back, not its edge)
  for(const back of [14,28,44]){ const k=((i-back)%P.N+P.N)%P.N; const eye=V(P.x[k],P.y[k]+1.5,P.z[k]); const ex=eye.x-x, ez=eye.z-z, el=Math.hypot(ex,ez)||1; if((ex*nx+ez*nz)/el<0.3) return no('facing'); eyes.push(eye); }
  // 2) open sky over the approach: no boards beside a tunnel, the LED arch run or under a gantry
  { let roof=0; for(const back of [0,10,22]){ const k=((i-back)%P.N+P.N)%P.N; if(pbHit(I,V(P.x[k],P.y[k]+2.2,P.z[k]),V(P.x[k],P.y[k]+32,P.z[k]),true)) roof++; } if(roof>=2) return no('roof'); }   // one hit = a wire or a single gantry: fine
  // 3) the body stands in nothing: sweeps along the board (front, back, top, bottom) and down through it
  for(const [off,h] of [[-1.6,zc],[1.6,zc],[-0.6,zc+2.7],[-0.6,zc-2.7],[0.8,zc+2.2],[0.8,zc-2.2]]){
    if(pbHit(I,V(x-ax*8.9+nx*off,h,z-az*8.9+nz*off),V(x+ax*8.9+nx*off,h,z+az*8.9+nz*off))) return no('body'); }
  if(!info.pole) for(const u of [-7,-3.5,0,3.5,7]){ if(pbHit(I,V(x+ax*u,y+9.4,z+az*u),V(x+ax*u,y+1.2,z+az*u))) return no('top'); }
  // 4) the face is seen from the road
  const tg=[[0,0],[-6.8,0],[6.8,0],[-5,2.2],[5,2.2],[-5,-2.2],[5,-2.2]].map(([u,v])=>V(x+ax*u+nx*0.9,zc+v,z+az*u+nz*0.9));
  const total=eyes.length*tg.length, maxMiss=Math.floor(total*0.14); let miss=0;
  for(const eye of eyes) for(const t of tg){ if(pbHit(I,eye,t)&&++miss>maxMiss) return no('hidden'); }
  why.ok=(why.ok||0)+1; return true;
}
// Places GLB props for this track along straight sections, facing the road. Returns blocker circles.
function placeTrackProps(W,def,P,H){
  const blockers=[]; if(typeof CAR_GLTF==='undefined') return blockers;
  // median props (e.g. giant cans on the Compton Heights boulevard), readable side toward oncoming cars
  for(const id in PROP_INFO){ const info=PROP_INFO[id], list=info.median&&info.median[def.id]; if(!list||!CAR_GLTF[id]) continue; const T=propTemplate(id); if(!T) continue;
    list.forEach(i=>{ if(P.median[i]<Math.max(T.w,T.d)/2) return; const o=makeProp(id); const ang=info.face>0?Math.atan2(-P.tx[i],-P.tz[i]):Math.atan2(P.tx[i],P.tz[i]);
      o.position.set(P.x[i],P.y[i]+0.12,P.z[i]); o.rotation.y=ang; W.group.add(o); (W.props=W.props||[]).push({id,x:P.x[i],z:P.z[i],y:P.y[i],ang,i,median:true}); blockers.push({x:P.x[i],z:P.z[i],r:Math.max(T.w,T.d)/2+0.2}); }); }
  for(const id in PROP_INFO){
    const want=(PROP_INFO[id].themes||{})[def.id]; if(!want || !CAR_GLTF[id] || PROP_INFO[id].kind==='manual') continue; if(W.env&&W.env.skipProps&&W.env.skipProps.includes(id)) continue; const T=propTemplate(id); if(!T) continue;
    const cand=[]; const K=12;
    for(let i=40;i<P.N-40;i+=6){ let c=0,tun=false; for(let k=-K;k<=K;k++) c=Math.max(c,Math.abs(P.curv[(i+k)%P.N])); for(let k=-45;k<=45;k+=3) if(P.tunnel[(i+k+P.N)%P.N]) tun=true; if(c<0.006&&!tun) cand.push(i); }
    PROP_DBG.cand=cand.length;
    // spread picks around the lap
    const picks=[]; const step=Math.max(1,Math.floor(cand.length/(want*2+1)));
    for(let n=0;n<cand.length && picks.length<want;n++){ const i=cand[(Math.floor(n*step*1.7)+step+Object.keys(PROP_INFO).indexOf(id)*Math.max(1,Math.floor(step/2)))%cand.length]; if(picks.some(q=>Math.abs(q.i-i)<60)) continue;
      const info=PROP_INFO[id], bill=info.kind==='billboard';
      for(const sd of (n%2?[1,-1]:[-1,1])){ const e=(sd<0?P.wl[i]:P.wr[i])+(info.pole?1.5+T.w*0.42:bill?2.5+T.w*0.5:4.5+T.d/2); const x=P.x[i]+P.rx[i]*e*sd, z=P.z[i]+P.rz[i]*e*sd;
        let ang;
        if(bill){ const nx=-P.tx[i]*0.8-sd*P.rx[i]*0.6, nz=-P.tz[i]*0.8-sd*P.rz[i]*0.6; ang=info.face>0?Math.atan2(nx,nz):Math.atan2(-nx,-nz); }
        else ang=Math.atan2(-sd*P.rx[i],-sd*P.rz[i]);
        if(!(info.pole?H.footprintClear(x,z,ang,3,3,1.0):H.footprintClear(x,z,ang,T.w+1,T.d+1,1.0))){ PROP_DBG.fp++; continue; } if(blockers.some(b=>Math.hypot(b.x-x,b.z-z)<b.r+Math.max(T.w,T.d)/2)) continue;
        if(info.pepperbox){ let gy=1e9, gh=-1e9; for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1],[0,0]]){ const hh=H.heightAt(x+a*T.w/2,z+b*T.d/2); gy=Math.min(gy,hh); gh=Math.max(gh,hh); }
          if(info.pole){ const py=H.heightAt(x,z)-P.y[i]; if(py<-2.5||py>6){ PB_VIS.why.footing=(PB_VIS.why.footing||0)+1; continue; } gy=H.heightAt(x,z); }
          if(!info.pole&&gh-gy>1.6){ PB_VIS.why.steep=(PB_VIS.why.steep||0)+1; continue; }                       // too steep for a ground board: it would hang in the air or dig in
          if(!pbSpotOK(W,P,i,x,gy-0.05,z,ang,info)) continue; }
        picks.push({i,x,z,ang}); break; } }
    picks.forEach(p=>{ const o=makeProp(id); if(PROP_INFO[id].pepperbox) pbFace(o); let y=1e9; for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]){ y=Math.min(y,H.heightAt(p.x+a*T.w/2,p.z+b*T.d/2)); } if(PROP_INFO[id].pole) y=H.heightAt(p.x,p.z); o.position.set(p.x,y-0.05,p.z); o.rotation.y=p.ang; W.group.add(o); (W.props=W.props||[]).push({id,x:p.x,z:p.z,y,ang:p.ang,i:p.i});
      blockers.push({x:p.x,z:p.z,r:Math.hypot(T.w,T.d)/2+1.5}); });
  }
  PB_VIS.W=null; PB_VIS.I=null;   // free the triangle index
  return blockers;
}

// ===== WORLD: themes, road, terrain, sky =====
const THEMES={
 city:{ skyTop:0x3f86d8, skyHor:0xf6dcb8, sunCol:0xffe0b0, sunI:2.3, sunDir:[-0.55,0.62,0.55], hemiS:0xc4dcff, hemiG:0x8c6e4c, hemiI:0.85,
   fog:0xeed6b4, fogNear:120, fogFar:900, exposure:1.0, road:'#5c5c61', roadLine:'white', curbA:'#d8262b', curbB:'#f4f4f4', edge:'#9a9a9a', shoulder:'sidewalk', wall:'jersey', wallH:1.0, groundBase:[0.52,0.5,0.44] },
 dusk:{ skyTop:0x3f78c8, skyHor:0xffc894, sunCol:0xffc987, sunI:2.5, sunDir:[-0.74,0.36,0.46], hemiS:0xb4c9ee, hemiG:0x7d6048, hemiI:0.82,
   fog:0xf1caa2, fogNear:220, fogFar:1500, exposure:1.0, road:'#4f4d55', roadLine:'white', curbA:'#ffc23d', curbB:'#2a2a2e', edge:'#8a8a8a', shoulder:'sidewalk', wall:'jersey', wallH:1.0, groundBase:[0.5,0.46,0.42] },
 country:{ skyTop:0x4f7fc4, skyHor:0xffc98a, sunCol:0xffc37a, sunI:2.4, sunDir:[-0.62,0.38,0.62], hemiS:0xb8d0ff, hemiG:0x6b7a3a, hemiI:0.9,
   fog:0xf2cfa0, fogNear:180, fogFar:1300, exposure:1.02, road:'#4e4a47', roadLine:'yellow', curbA:'#c8281e', curbB:'#f3ecd9', edge:'#a0633f', shoulder:'dirt', wall:'wood', wallH:1.0 },
 desert:{ skyTop:0x2f78d6, skyHor:0xf8dcb6, sunCol:0xfff0d4, sunI:2.6, sunDir:[0.3,0.85,-0.4], hemiS:0xbfdcff, hemiG:0xc28a58, hemiI:0.8,
   fog:0xf3d8b6, fogNear:200, fogFar:1400, exposure:0.95, road:'#56504b', roadLine:'yellow', curbA:'#e05a1a', curbB:'#f2eadc', edge:'#c9a27a', shoulder:'sand', wall:'guardrail', wallH:0.85 },
 coast:{ skyTop:0x3a6cc0, skyHor:0xffbe86, sunCol:0xffc27a, sunI:2.5, sunDir:[-0.8,0.32,0.2], hemiS:0xa9c4f2, hemiG:0x7a6044, hemiI:0.9,
   fog:0xf0bf94, fogNear:160, fogFar:1300, exposure:1.02, road:'#4d4d53', roadLine:'yellow', curbA:'#d8262b', curbB:'#f4f4f4', edge:'#8c8c7c', shoulder:'gravel', wall:'guardrail', wallH:0.85 },
 revolution:{ skyTop:0x5a86c4, skyHor:0xffd6a8, sunCol:0xffd2a0, sunI:2.2, sunDir:[-0.7,0.3,0.55], hemiS:0xbfd2f0, hemiG:0x5e6a3a, hemiI:0.9,
   fog:0xe8d6bc, fogNear:160, fogFar:1200, exposure:1.0, road:'#4f4a44', roadLine:'none', curbA:'#8a2a22', curbB:'#e8dcc0', edge:'#8f7a5a', shoulder:'dirt', wall:'wood', wallH:1.0 },
 rally:{ skyTop:0x4d7fc0, skyHor:0xe9dcc4, sunCol:0xfff0d2, sunI:2.5, sunDir:[0.5,0.62,-0.42], hemiS:0xc4d6ee, hemiG:0x5a4a34, hemiI:0.9,
   fog:0xd9d2be, fogNear:180, fogFar:1300, exposure:1.0, road:'#7b5b3d', roadLine:'none', dirtRoad:true, curbA:'#6a4a2e', curbB:'#8a6a48', edge:'#6f5236', shoulder:'rallydirt', wall:'wood', wallH:1.0, groundBase:[0.3,0.4,0.22] },
 oval:{ skyTop:0x3a74c8, skyHor:0xffc48a, sunCol:0xffc890, sunI:2.5, sunDir:[-0.62,0.42,0.5], hemiS:0xb8ccf0, hemiG:0x6a6a52, hemiI:0.85,
   fog:0xf0c8a0, fogNear:260, fogFar:1700, exposure:1.0, road:'#48474c', roadLine:'none', curbA:'#ffd23f', curbB:'#f4f4f4', edge:'#e9e9e6', shoulder:'apron', wall:'safer', wallH:1.15, groundBase:[0.4,0.5,0.3] },
 space:{ skyTop:0x05010f, skyHor:0x2a0845, sunCol:0xe0b8ff, sunI:1.7, sunDir:[0.35,0.78,0.42], hemiS:0x8a5cff, hemiG:0x123a66, hemiI:1.0,
   fog:0x0a0318, fogNear:320, fogFar:2600, exposure:1.05, road:'#15101f', roadLine:'white', curbA:'#ff2e97', curbB:'#22e4ff', edge:'#2a2a33', shoulder:'wetconcrete', wall:'neon', wallH:1.0, night:true, space:true },
 night:{ skyTop:0x05041a, skyHor:0x3d1656, sunCol:0x8f9cff, sunI:0.45, sunDir:[0.4,0.7,0.3], hemiS:0x4a3a8a, hemiG:0x160a26, hemiI:0.75,
   fog:0x0c0719, fogNear:60, fogFar:620, exposure:1.05, road:'#1c1c24', roadLine:'white', curbA:'#ff2e97', curbB:'#1a1a22', edge:'#2a2a33', shoulder:'wetconcrete', wall:'neon', wallH:1.0, night:true },
};
function roadTexture(th){
  return canvasTex(512,1024,(g,w,h)=>{
    if(th.dirtRoad){ // packed dirt: no paint, two worn ruts, loose stones, darker damp patches
      noiseFill(g,w,h,th.road,34); for(let i=0;i<9;i++){ g.fillStyle=`rgba(40,26,14,${0.06+Math.random()*0.1})`; g.beginPath(); g.ellipse(Math.random()*w,Math.random()*h,50+Math.random()*120,60+Math.random()*180,0,0,TAU); g.fill(); }
      [0.3,0.7].forEach(u=>{ g.fillStyle='rgba(38,24,12,0.22)'; g.fillRect(u*w-46,0,92,h); g.fillStyle='rgba(205,170,125,0.16)'; g.fillRect(u*w-12,0,24,h); });
      for(let i=0;i<1500;i++){ const c=Math.random(); g.fillStyle=c<0.5?`rgba(215,195,165,${0.2+Math.random()*0.4})`:`rgba(45,32,20,${0.2+Math.random()*0.35})`; g.fillRect(Math.random()*w,Math.random()*h,1.5+Math.random()*4,1.5+Math.random()*3.5); }
      for(let i=0;i<70;i++){ g.strokeStyle=`rgba(40,26,14,${0.1+Math.random()*0.15})`; g.lineWidth=2+Math.random()*4; const x=Math.random()*w; g.beginPath(); g.moveTo(x,0); g.bezierCurveTo(x+(Math.random()-0.5)*50,h*0.33,x+(Math.random()-0.5)*50,h*0.66,x+(Math.random()-0.5)*30,h); g.stroke(); }
      return; }
    noiseFill(g,w,h,th.road,th.night?10:26);
    for(let i=0;i<2200;i++){ g.fillStyle=`rgba(${Math.random()<0.5?'255,255,255':'0,0,0'},${Math.random()*0.08})`; g.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*4,2+Math.random()*4); }
    // tire wear bands
    g.fillStyle='rgba(0,0,0,0.12)'; [0.28,0.72].forEach(u=>g.fillRect(u*w-40,0,80,h));
    // patches
    for(let i=0;i<6;i++){ g.fillStyle=`rgba(0,0,0,${0.05+Math.random()*0.08})`; g.fillRect(Math.random()*w,Math.random()*h,60+Math.random()*120,40+Math.random()*160); }
    g.fillStyle='rgba(240,240,240,0.9)'; g.fillRect(w*0.03,0,10,h); g.fillRect(w*0.97-10,0,10,h);
    if(th.roadLine==='yellow'){ g.fillStyle='#f2c230'; g.fillRect(w/2-16,0,10,h); g.fillRect(w/2+6,0,10,h); }
    else if(th.roadLine!=='none'){ g.fillStyle='rgba(245,245,245,0.9)'; g.fillRect(w/2-6,0,12,h*0.45); }
    else { g.fillStyle='rgba(0,0,0,0.16)'; [0.22,0.4,0.6,0.78].forEach(u=>g.fillRect(u*w-26,0,52,h)); }   // oval: no centre line, a wide rubbered-in groove
    if(th.night){ // wet sheen streaks
      for(let i=0;i<40;i++){ g.fillStyle=`rgba(120,140,200,${Math.random()*0.06})`; g.fillRect(Math.random()*w,0,4+Math.random()*20,h); } }
  },{repeat:true,aniso:8});
}
function stripTex(a,b,n=2){ return canvasTex(64,128,(g,w,h)=>{ for(let i=0;i<n;i++){ g.fillStyle=i%2?b:a; g.fillRect(0,i*h/n,w,h/n);} g.fillStyle='rgba(0,0,0,0.15)'; g.fillRect(w-6,0,6,h); },{repeat:true}); }
function shoulderTexture(kind){
  return canvasTex(256,256,(g,w,h)=>{
    if(kind==='sidewalk'){ noiseFill(g,w,h,'#b9b3a8',18); g.strokeStyle='rgba(60,50,40,0.35)'; g.lineWidth=2; for(let i=0;i<=4;i++){ g.beginPath(); g.moveTo(0,i*64); g.lineTo(w,i*64); g.stroke(); g.beginPath(); g.moveTo(i*64,0); g.lineTo(i*64,h); g.stroke(); }
      for(let i=0;i<30;i++){ g.fillStyle='rgba(40,30,20,0.12)'; g.beginPath(); g.arc(Math.random()*w,Math.random()*h,2+Math.random()*6,0,TAU); g.fill(); } }
    else if(kind==='dirt'){ noiseFill(g,w,h,'#9c4a2a',26); for(let i=0;i<420;i++){ g.fillStyle=`rgba(${Math.random()<0.5?'70,30,15':'190,110,70'},${Math.random()*0.45})`; g.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*3,2); } for(let i=0;i<30;i++){ g.fillStyle='rgba(90,110,40,0.35)'; g.fillRect(Math.random()*w,Math.random()*h,2,5); } }
    else if(kind==='sand'){ noiseFill(g,w,h,'#c99a68',30); for(let i=0;i<400;i++){ g.fillStyle=`rgba(90,60,30,${Math.random()*0.4})`; g.fillRect(Math.random()*w,Math.random()*h,2,2);} }
    else if(kind==='gravel'){ noiseFill(g,w,h,'#9a8e70',30); for(let i=0;i<300;i++){ g.fillStyle=`rgba(${Math.random()<0.5?'60,70,30':'170,150,90'},0.5)`; g.fillRect(Math.random()*w,Math.random()*h,3,3);} }
    else if(kind==='rallydirt'){ noiseFill(g,w,h,'#6b4c30',30); for(let i=0;i<420;i++){ g.fillStyle=`rgba(${Math.random()<0.5?'40,26,14':'190,160,120'},${Math.random()*0.4})`; g.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*4,2+Math.random()*3); } for(let i=0;i<26;i++){ g.fillStyle='rgba(70,110,50,0.35)'; g.fillRect(Math.random()*w,Math.random()*h,3,7); } }
    else if(kind==='apron'){ noiseFill(g,w,h,'#5c5b60',20); for(let i=0;i<260;i++){ g.fillStyle=`rgba(${Math.random()<0.5?'20,20,20':'200,200,200'},${Math.random()*0.18})`; g.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*5,2); } }
    else { noiseFill(g,w,h,'#2b2b33',14); for(let i=0;i<14;i++){ g.fillStyle='rgba(90,110,170,0.12)'; g.beginPath(); g.ellipse(Math.random()*w,Math.random()*h,10+Math.random()*30,6+Math.random()*14,0,0,TAU); g.fill(); } }
  },{repeat:true});
}
function wallTexture(kind){
  return canvasTex(256,64,(g,w,h)=>{
    if(kind==='jersey'){ noiseFill(g,w,h,'#c9c4ba',20); g.fillStyle='rgba(0,0,0,0.25)'; g.fillRect(0,h-10,w,10);
      const cols=['#ff2e97','#27d3ff','#ffd23f','#7cff6b','#b65cff']; for(let i=0;i<5;i++){ g.fillStyle=cols[Math.floor(Math.random()*5)]; g.globalAlpha=0.8; g.beginPath(); g.ellipse(Math.random()*w,20+Math.random()*25,10+Math.random()*25,6+Math.random()*10,Math.random(),0,TAU); g.fill(); } g.globalAlpha=1;
      g.fillStyle='rgba(0,0,0,0.3)'; g.fillRect(w-3,0,3,h); }
    else if(kind==='safer'){ noiseFill(g,w,h,'#f1f0ec',8); g.fillStyle='#ec6228'; g.fillRect(0,6,w,7); g.fillStyle='#15151a'; g.fillRect(0,15,w,4);
      for(let i=0;i<14;i++){ g.fillStyle=`rgba(20,20,20,${0.12+Math.random()*0.3})`; g.fillRect(Math.random()*w,26+Math.random()*26,20+Math.random()*70,1.5+Math.random()*2.5); }   // tyre marks
      g.fillStyle='rgba(0,0,0,0.22)'; g.fillRect(0,h-8,w,8); g.fillStyle='rgba(0,0,0,0.18)'; for(let x=0;x<w;x+=64) g.fillRect(x,0,2,h); }
    else if(kind==='wood'){ noiseFill(g,w,h,'#8a5a34',22); g.fillStyle='rgba(40,22,10,0.55)'; [14,34,54].forEach(y=>g.fillRect(0,y,w,2)); for(let i=0;i<60;i++){ g.fillStyle='rgba(60,35,15,0.35)'; g.fillRect(Math.random()*w,Math.random()*h,20+Math.random()*40,1); } g.fillStyle='rgba(30,16,6,0.6)'; for(let x=0;x<w;x+=64) g.fillRect(x,0,6,h); }
    else if(kind==='guardrail'){ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#e6e8ea'); gr.addColorStop(0.35,'#9aa0a6'); gr.addColorStop(0.5,'#dfe2e4'); gr.addColorStop(0.7,'#8a9096'); gr.addColorStop(1,'#555'); g.fillStyle=gr; g.fillRect(0,0,w,h); g.fillStyle='rgba(120,70,30,0.2)'; for(let i=0;i<20;i++) g.fillRect(Math.random()*w,Math.random()*h,4,2); }
    else { noiseFill(g,w,h,'#16161e',10); g.fillStyle='rgba(255,255,255,0.05)'; for(let i=0;i<8;i++) g.fillRect(i*32,0,2,h); }
  },{repeat:true});
}
// spatial hash of road samples
function buildRoadHash(P,noGap){
  const C=24, map=new Map();
  for(let i=0;i<P.N;i++){ if(P.hidden&&P.hidden[i]) continue; if(noGap&&P.gap[i]) continue; const k=Math.floor(P.x[i]/C)+','+Math.floor(P.z[i]/C); let a=map.get(k); if(!a){a=[];map.set(k,a);} a.push(i); }
  const out={d:0,i:0,edge:0,y:0,gap:0};
  return function(x,z,R=3){
    const cx=Math.floor(x/C),cz=Math.floor(z/C); let bd=1e18,bi=-1;
    for(let a=-R;a<=R;a++)for(let b=-R;b<=R;b++){ const l=map.get((cx+a)+','+(cz+b)); if(!l) continue; for(const i of l){ const dx=x-P.x[i],dz=z-P.z[i],d=dx*dx+dz*dz; if(d<bd){bd=d;bi=i;} } }
    if(bi<0){ out.d=1e9; out.i=-1; return out; }
    out.d=Math.sqrt(bd); out.i=bi; out.edge=Math.max(P.wl[bi],P.wr[bi]); out.y=P.y[bi]; out.gap=P.gap[bi]; return out;
  };
}

// ===== WORLD BUILDER =====
function naturalHeightFn(def,P){
  let cx=0,cz=0; for(let i=0;i<P.N;i++){cx+=P.x[i];cz+=P.z[i];} cx/=P.N; cz/=P.N;
  let R0=0; for(let i=0;i<P.N;i++) R0=Math.max(R0,Math.hypot(P.x[i]-cx,P.z[i]-cz));
  const channels=[]; (def.jumps||[]).forEach(j=>{ if(j.gap>0){ const gl=Math.round(j.gap/P.spacing); const m=(j.top+Math.round(gl/2))%P.N; channels.push({x:P.x[m],z:P.z[m],dx:P.rx[m],dz:P.rz[m],y:P.y[m]}); }});
  const chan=(x,z,h)=>{ for(const c of channels){ const px=x-c.x,pz=z-c.z; const along=px*c.dx+pz*c.dz; const perp=Math.abs(px*c.dz-pz*c.dx); if(Math.abs(along)<420){ const floor=c.y-11; const t=smooth01((perp-7)/7); h=Math.min(h,lerp(floor,h,t)); } } return h; };
  const t=def.theme; let f;
  if(t==='city') f=(x,z)=>{ const d=Math.hypot(x-cx,z-cz); return smooth01((d-R0-160)/380)*(25+110*fbm(x*0.004,z*0.004)); };
  else if(t==='desert'){ const mesas=[[150,420,70,34],[520,300,90,55],[-160,250,80,40],[380,-220,110,48],[-120,-120,60,30],[250,120,45,22],[120,300,40,26],[-300,600,140,70],[700,650,160,80],[600,-500,140,60],[-400,-300,150,55]];
    f=(x,z)=>{ let h=1.6*fbm(x*0.015,z*0.015)+0.6*fbm(x*0.08,z*0.08); const d0=Math.hypot(x-cx,z-cz); h+=smooth01((d0-R0-250)/400)*40*fbm(x*0.003+7,z*0.003);
      for(const m of mesas){ const d=Math.hypot(x-m[0],z-m[1]); const rn=m[2]*(0.85+0.3*fbm(x*0.02+m[0],z*0.02)); const k=smooth01((rn+14-d)/14); if(k>0) h=Math.max(h,m[3]*k+(k>0.99?1.5*fbm(x*0.05,z*0.05):0)); }
      return chan(x,z,h); }; }
  else if(t==='coast') f=(x,z)=>{ const coastX=-38+14*Math.sin(z*0.012)+8*Math.sin(z*0.031); const land=smooth01((x-coastX+45)/55);
      const hills=6+62*fbm(x*0.006+3,z*0.006)*smooth01((x-coastX)/220+0.25); return lerp(-26,hills,land); };
  else if(t==='country'){ const ck=def.creek||[]; const creekD=(x,z)=>{ let best=1e9; for(let k=0;k<ck.length-1;k++){ const [ax,az]=ck[k],[bx,bz]=ck[k+1]; const vx=bx-ax,vz=bz-az,L2=vx*vx+vz*vz; const tt=clamp(((x-ax)*vx+(z-az)*vz)/L2,0,1); best=Math.min(best,Math.hypot(x-ax-vx*tt,z-az-vz*tt)); } return best; };
    f=(x,z)=>{ const d0=Math.hypot(x-cx,z-cz); let h=4.5*fbm(x*0.007+11,z*0.007)+1.2*fbm(x*0.03,z*0.03)-1.5; h+=smooth01((d0-R0-120)/350)*55*fbm(x*0.0035+4,z*0.0035);
      if(ck.length){ const cd=creekD(x,z); if(cd<22) h=lerp(-7,h,smooth01((cd-5)/17)); } return h; }; f.creekD=creekD; }
  else if(t==='rally') f=(x,z)=>{ const d0=Math.hypot(x-cx,z-cz); return 5*fbm(x*0.008+3,z*0.008)+1.3*fbm(x*0.035,z*0.035)-1.2+smooth01((d0-R0-90)/320)*60*fbm(x*0.004+9,z*0.004); };
  else f=(x,z)=>{ return chan(x,z,0.0); };
  f.cx=cx; f.cz=cz; f.R0=R0; f.channels=channels; return f;
}
const ENV_CFG={ alondra:{skipProps:['knives','hijoe','shoe_factory','rrsign','palm','watch_shop','watch_sign','range_sign','claw_can','echelon_can'],skipStand:true,skipScenery:true,skipChevrons:true,respectSides:true,alondra:true,fogNear:220,fogFar:1500,
    lowHide:/^ab_(stand_crowd|veg_far|street_grid|park_veg)/,
    shadowRe:/^ab_(n_|gantry$|stand$|event$|maximus$|hot$|park$|railyard$|veg_(start|commercial|mural|res|near)$|overpass$)/},
  mesa:{skipProps:['knives','rrsign'],skipStand:true,skipScenery:true,respectSides:true,lowHide:/^mz_(scrub|rocks)/},
  revolution:{skipProps:['rrsign','gate','church'],skipStand:true,skipScenery:true,skipChevrons:true,respectSides:true,revolution:true,fogNear:160,fogFar:1200,
    lowHide:/^rv_(veg_far|grass|litter|reeds_far)/,
    shadowRe:/^rv_(start|finish|portal_|bridge_|bld_|fort_|camp_|veg_near|barrier_)/},
  coast:{skipProps:['knives','hijoe','rrsign'],skipStand:true,skipScenery:true,respectSides:true,lowHide:/^pc_(scrub|grass|rocks|shore_rocks)/,seaY:-9,fogNear:220,fogFar:2300,
    shadowRe:/gantry|maximus|grandstand|festival|lighthouse|support|cypress|palms|trackside|guardrail|roadside|overlook|tunnel/},
  neon:{skipProps:['knives','hijoe','shoe_factory','rrsign'],skipStand:true,skipScenery:true,skipChevrons:true,respectSides:true,neon:true,fogNear:140,fogFar:1500,
    lowHide:/^nf_(containers|orepiles|refl_arch|furnace_pools|stand_(main|east)_crowd)/,
    shadowRe:/^nf_(gantry$|arches$|foundry$|stand_main$|stand_east$|mvm$|maximus$|event$|tech$)/} };
// ---------- Neon Foundry Nights runtime materials: animated LEDs, wet road, harbor water ----------
const NEON_VS='varying vec2 vUv; varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; vec4 mvPosition=viewMatrix*w; gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}';
const NEON_PAL='vec3 pal(float x){ x=fract(x); vec3 a=vec3(0.13,0.89,1.0), b=vec3(1.0,0.18,0.62), c=vec3(0.58,0.28,1.0); return x<0.3333? mix(a,b,x*3.0) : (x<0.6667? mix(b,c,(x-0.3333)*3.0) : mix(c,a,(x-0.6667)*3.0)); }\n';
function neonShader(U,frag,opts){ return new THREE.ShaderMaterial(Object.assign({fog:true,toneMapped:false,uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{t:U.t,k:{value:1}}]),vertexShader:NEON_VS,
  fragmentShader:'uniform float t; uniform float k; varying vec2 vUv; varying vec3 vW;\n#include <fog_pars_fragment>\n'+NEON_PAL+'void main(){ '+frag+'\n#include <fog_fragment>\n}'},opts||{})); }
function neonEnvMap(renderer){
  const s=new THREE.Scene(); s.background=new THREE.Color(0x05040c);
  const add=(w,h,c,x,y,z)=>{ const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide})); p.position.set(x,y,z); p.lookAt(0,0,0); s.add(p); };
  [[0x22e4ff,0],[0xff2e97,1.3],[0x9b4dff,2.6],[0xff9030,3.9],[0x2b6bff,5.2]].forEach(([c,a])=>add(26,3,c,Math.cos(a)*40,4+2*Math.sin(a*3),Math.sin(a)*40));
  add(60,60,0x0c0a18,0,40,0); add(10,1.2,0xffffff,0,22,-30);
  const pm=new THREE.PMREMGenerator(renderer); const t=pm.fromScene(s,0.03).texture; pm.dispose(); return t; }
function puddleTex(){ return canvasTex(256,256,(g,w,h)=>{ g.fillStyle='#969696'; g.fillRect(0,0,w,h); let sd=7; const r=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
  for(let k=0;k<7;k++){ const x=r()*w,y=r()*h,rr=16+r()*26; g.save(); g.translate(x,y); g.scale(0.7,2.2); const gr=g.createRadialGradient(0,0,0,0,0,rr); gr.addColorStop(0,'rgba(95,95,95,0.55)'); gr.addColorStop(1,'rgba(150,150,150,0)'); g.fillStyle=gr; g.beginPath(); g.arc(0,0,rr,0,TAU); g.fill(); g.restore(); }
  for(let k=0;k<2;k++){ g.fillStyle='rgba(80,80,80,0.3)'; g.fillRect(w*(0.3+k*0.35),0,w*0.07,h); } },{srgb:false,repeat:true}); }
function neonMaterials(W,root,Q){
  const U={t:{value:0}}; W.updaters.push((dt,t)=>{ U.t.value=t; });
  const env=GFX.compat.tagLegacyEnv(neonEnvMap(GAME.renderer),12); W.neonEnv=env; const cache={}; const low=Q.density<0.6;
  const basic=(c,o)=>new THREE.MeshBasicMaterial(Object.assign({color:c,toneMapped:false},o||{}));
  const glowTexA=canvasTex(128,128,(g,w,h)=>{ const gr=g.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0,'rgba(255,255,255,0.9)'); gr.addColorStop(0.5,'rgba(255,255,255,0.35)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,w,h); },{srgb:false});
  const bandTex=canvasTex(8,64,(g,w,h)=>{ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(0.5,'rgba(255,255,255,1)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,w,h); },{srgb:false});
  const make={
    // arch procession: colour cycles cyan -> magenta -> violet across the straight; soft pulses flow forward with the traffic
    m_led_arch:()=>neonShader(U,'float w=0.5+0.5*sin(vUv.x*22.0-t*5.5); float a=0.72+0.28*sin(vUv.y*9.0-t*1.6+vUv.x*6.0); vec3 c=pal(vUv.x*1.6-t*0.05)*(0.45+1.25*w*w*w)*a; gl_FragColor=vec4(c,1.0);',{side:THREE.DoubleSide}),
    m_refl_arch:()=>neonShader(U,'float w=0.5+0.5*sin(vUv.x*22.0-t*5.5); float dy=(vUv.y-0.5)*4.5; float band=exp(-dy*dy); vec3 c=pal(vUv.x*1.6-t*0.05)*(0.25+0.7*w*w*w)*band*0.38; gl_FragColor=vec4(c,1.0);',{transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),
    // route guidance on the barriers: slow chase pulses every 30 m running with the traffic; colour from the code in uv.y
    m_led_route:()=>neonShader(U,'float cy=1.0-vUv.y; vec3 col=cy<0.25?vec3(0.13,0.89,1.0):(cy<0.5?vec3(0.17,0.45,1.0):(cy<0.75?vec3(1.0,0.55,0.14):vec3(1.0,0.18,0.62))); float p=fract(vUv.x*100.0/30.0-t*0.9); float dp=(p-0.5)*7.0; float pulse=exp(-dp*dp); gl_FragColor=vec4(col*(0.55+0.75*pulse),1.0);',{side:THREE.DoubleSide}),
    // corner chevrons scroll toward the turn direction
    m_chevron:()=>neonShader(U,'float f=fract((vUv.x-abs(vUv.y-0.5)*0.8)*2.5+t*0.7); float s=smoothstep(0.42,0.5,f)-smoothstep(0.78,0.86,f); float edge=step(0.06,vUv.y)*step(vUv.y,0.94); vec3 c=mix(vec3(0.02,0.03,0.06),vec3(0.2,0.6,1.0)*1.3,s*edge); gl_FragColor=vec4(c,1.0);',{side:THREE.DoubleSide}),
    // furnace mouths: hot gradient with a slow breathing shimmer (no flashing)
    m_furnace:()=>neonShader(U,'float h=clamp(1.0-vUv.y,0.0,1.0); vec3 c=mix(vec3(1.0,0.78,0.36),vec3(0.85,0.22,0.04),h); c*=0.85+0.12*sin(t*1.3+vW.x*0.2+vW.z*0.13)+0.05*sin(t*3.1+vW.y); gl_FragColor=vec4(c*1.2,1.0);',{side:THREE.DoubleSide}),
    m_led_cyan:()=>basic(0x3ae8ff,{side:THREE.DoubleSide}), m_led_blue:()=>basic(0x3a74ff,{side:THREE.DoubleSide}), m_led_violet:()=>basic(0x9b55ff,{side:THREE.DoubleSide}),
    m_led_magenta:()=>basic(0xff3aa0,{side:THREE.DoubleSide}), m_led_amber:()=>basic(0xffa040,{side:THREE.DoubleSide}), m_led_white:()=>basic(0xfff6ee,{side:THREE.DoubleSide}),
    m_led_red:()=>basic(0xff2020), m_led_road_cyan:()=>basic(0x39e6ff,{polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}), m_led_road_magenta:()=>basic(0xff3aa8,{polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),
    m_glow_amber:()=>basic(0xff8a30,{map:glowTexA,transparent:true,opacity:0.32,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),
    m_glow_cyan:()=>basic(0x39e6ff,{map:bandTex,transparent:true,opacity:0.3,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}),
    m_water:()=>new THREE.MeshStandardMaterial({color:0x010207,roughness:0.22,metalness:0.5,envMap:env,envMapIntensity:0.22}),
  };
  const pud=puddleTex(); pud.repeat.set(0.3,0.22);
  root.traverse(o=>{ if(!o.isMesh) return; const m=o.material; const n=m.name||'';
    if(make[n]){ if(!cache[n]) cache[n]=make[n](); o.material=cache[n]; o.castShadow=false; o.receiveShadow=!/led|glow|refl|furnace|chevron/.test(n);
      if(/refl|glow/.test(n)){ o.renderOrder=2; if(low&&/refl/.test(n)) o.visible=false; } return; }
    if(n==='m_road'){ m.roughnessMap=pud; m.roughness=1.0; m.metalness=0.0; m.envMap=env; m.envMapIntensity=0.4; m.color.setHex(0xa8a8b4); m.needsUpdate=true; return; }
    if(n==='m_slag'){ m.color.setHex(0x2a2522); m.needsUpdate=true; return; }
    if(n==='m_container'){ m.color.setHex(0x6a6a70); m.metalness=0.2; m.envMap=env; m.envMapIntensity=0.3; m.needsUpdate=true; return; }
    if(n==='m_windows'&&m.map){ if(!cache[n]) cache[n]=new THREE.MeshBasicMaterial({map:m.map,color:0xb8b8c8}); o.material=cache[n]; return; }
    if(/mvm_art|mvm_title|signs|maximus|gantry_sign/.test(n)&&m.emissiveMap){ m.emissiveIntensity=/mvm_art/.test(n)?0.42:(/title|signs/.test(n)?0.55:0.5); m.toneMapped=true; m.needsUpdate=true; return; }
    if(m.isMeshStandardMaterial){ m.envMap=env; m.envMapIntensity=m.metalness>0.3?0.7:0.35; m.needsUpdate=true; } });
  neonLightShow(W,U,Q);
}
// ---------- Neon Foundry Nights light show: LED ring tunnel, glow halos, wet-road reflections, ceiling chase bars, sky beams ----------
// Built at runtime from the track path (no GLB dependency). Plain GLSL with no pow() on signed values (NaN on real GPUs).
const NEON_LS_VS='attribute vec3 aP; varying vec3 vP;\n#include <fog_pars_vertex>\nvoid main(){ vP=aP; vec4 mvPosition=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}';
function neonLSMat(U,body,opts){ return new THREE.ShaderMaterial(Object.assign({fog:true,toneMapped:false,side:THREE.DoubleSide,
  uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{t:U.t,k:{value:1}}]),vertexShader:NEON_LS_VS,
  fragmentShader:'uniform float t; uniform float k; varying vec3 vP;\n#include <fog_pars_fragment>\n'+NEON_PAL+
  'vec3 ringCol(float r,float a){ float wave=0.5+0.5*sin(r*46.0-t*7.5); float sweep=0.5+0.5*sin(a*16.0+t*3.5+r*11.0); vec3 c=pal(r*1.7+a*0.45-t*0.11); return c*(0.3+1.5*wave*wave+0.55*sweep*wave); }\n'+
  'void main(){ '+body+'\n#include <fog_fragment>\n}'},opts||{})); }
function neonLightShow(W,U,Q){
  const P=W.P; if(!P) return; const low=Q.density<0.6; const N=P.N;
  const I0=188, I1=336, STEP=2;                   // the LED arch straight (arches span 196..328)
  const rings=[]; for(let i=I0;i<=I1;i+=STEP) rings.push(i);
  const pos=[],aP=[], gpos=[],gaP=[], rpos=[],raP=[];
  const push=(arr,att,p,a)=>{ arr.push(p[0],p[1],p[2]); att.push(a[0],a[1],a[2]); };
  const quad=(arr,att,A,B,C,D,a,b,c,d)=>{ push(arr,att,A,a);push(arr,att,B,b);push(arr,att,C,c); push(arr,att,A,a);push(arr,att,C,c);push(arr,att,D,d); };
  rings.forEach((i,ri)=>{
    const r=(i-I0)/(I1-I0); const half=Math.max(P.wl[i],P.wr[i])+1.2, y0=P.y[i];
    const prof=[[-half,0.35],[-half,5.6],[-half+1.8,8.4],[-6.2,9.6],[6.2,9.6],[half-1.8,8.4],[half,5.6],[half,0.35]];
    // subdivide the ring into ~0.8 m pieces; a = 0..1 around the ring
    const pts=[]; let tot=0; const segL=[];
    for(let k=0;k<prof.length-1;k++){ const L=Math.hypot(prof[k+1][0]-prof[k][0],prof[k+1][1]-prof[k][1]); segL.push(L); tot+=L; }
    let acc=0; for(let k=0;k<prof.length-1;k++){ const n=Math.max(1,Math.round(segL[k]/0.8)); for(let q=0;q<n;q++){ const f=q/n; pts.push([prof[k][0]+(prof[k+1][0]-prof[k][0])*f, prof[k][1]+(prof[k+1][1]-prof[k][1])*f, (acc+segL[k]*f)/tot]); } acc+=segL[k]; }
    pts.push([prof[prof.length-1][0],prof[prof.length-1][1],1]);
    const W3=(lat,h,al)=>[P.x[i]+P.rx[i]*lat+P.tx[i]*al, y0+h, P.z[i]+P.rz[i]*lat+P.tz[i]*al];
    for(let k=0;k<pts.length-1;k++){ const a=pts[k], b=pts[k+1];
      const w=0.32; quad(pos,aP,W3(a[0],a[1],-w),W3(b[0],b[1],-w),W3(b[0],b[1],w),W3(a[0],a[1],w),[r,a[2],0],[r,b[2],0],[r,b[2],0],[r,a[2],0]);
      if(!low){ const g=1.9; quad(gpos,gaP,W3(a[0],a[1],-g),W3(b[0],b[1],-g),W3(b[0],b[1],g),W3(a[0],a[1],g),[r,a[2],-1],[r,b[2],-1],[r,b[2],1],[r,a[2],1]); } }
    if(!low){ const hw=P.w[i]/2, L=3.2, yy=0.05; quad(rpos,raP,W3(-hw,yy,-L),W3(hw,yy,-L),W3(hw,yy,L),W3(-hw,yy,L),[r,0,-1],[r,1,-1],[r,1,1],[r,0,1]); }
  });
  const mk=(p,a,mat,ro)=>{ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(p,3)); g.setAttribute('aP',new THREE.Float32BufferAttribute(a,3)); g.computeBoundingSphere();
    const m=new THREE.Mesh(g,mat); m.frustumCulled=true; m.renderOrder=ro||0; W.group.add(m); return m; };
  mk(pos,aP,neonLSMat(U,'vec3 c=ringCol(vP.x,vP.y); gl_FragColor=vec4(c*k,1.0);'));
  const add={transparent:true,blending:THREE.AdditiveBlending,depthWrite:false};
  if(!low){
    mk(gpos,gaP,neonLSMat(U,'float x=vP.z; vec3 c=ringCol(vP.x,vP.y)*exp(-3.2*x*x)*0.42; gl_FragColor=vec4(c,1.0);',add),3);
    mk(rpos,raP,neonLSMat(U,'float x=vP.z; float e=abs(vP.y-0.5)*2.0; vec3 c=ringCol(vP.x,0.5)*exp(-2.6*x*x)*(1.0-0.55*e*e)*0.3; gl_FragColor=vec4(c,1.0);',Object.assign({polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3},add)),2);
  }
  // ceiling chase bars: three light lines running the length of the tunnel, pulses flowing with the traffic
  const cpos=[],caP=[]; const totL=(I1-I0)*P.spacing;
  [-4.2,0,4.2].forEach((lat,li)=>{ for(let i=I0;i<I1;i++){ const j=i+1, sa=(i-I0)/(I1-I0), sb=(j-I0)/(I1-I0);
    const A=[P.x[i]+P.rx[i]*(lat-0.14),P.y[i]+9.5,P.z[i]+P.rz[i]*(lat-0.14)], B=[P.x[j]+P.rx[j]*(lat-0.14),P.y[j]+9.5,P.z[j]+P.rz[j]*(lat-0.14)];
    const C=[P.x[j]+P.rx[j]*(lat+0.14),P.y[j]+9.5,P.z[j]+P.rz[j]*(lat+0.14)], D=[P.x[i]+P.rx[i]*(lat+0.14),P.y[i]+9.5,P.z[i]+P.rz[i]*(lat+0.14)];
    quad(cpos,caP,A,B,C,D,[sa,li,0],[sb,li,0],[sb,li,0],[sa,li,0]); } });
  mk(cpos,caP,neonLSMat(U,'float p=fract(vP.x*'+(totL/14).toFixed(2)+'-t*1.6); float d=(p-0.5)*6.0; float pulse=exp(-d*d); vec3 c=mix(vec3(0.15,0.8,1.0),vec3(1.0,0.3,0.8),0.5+0.5*sin(t*0.4+vP.y*2.0)); gl_FragColor=vec4(c*(0.25+1.4*pulse),1.0);'));
  // sky beams: slow sweeping searchlights over the arena and the tunnel mouths (no strobing)
  if(!low){
    const beamMat=(col)=>new THREE.ShaderMaterial({transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
      uniforms:{c:{value:new THREE.Color(col)}},vertexShader:'varying float vy; void main(){ vy=uv.y; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader:'uniform vec3 c; varying float vy; void main(){ float f=(1.0-vy)*(1.0-vy)*0.26; gl_FragColor=vec4(c*f,1.0); }'});
    const geo=new THREE.CylinderGeometry(7,0.5,190,16,1,true); geo.translate(0,95,0);   // narrow at the lamp; uv.y = 1 at the top, 0 at the lamp
    const sites=[[0,-1,0x39e6ff],[0,1,0xff3aa0],[I0,-1,0x9b55ff],[I0,1,0x39e6ff],[I1,-1,0xff3aa0],[I1,1,0x9b55ff],[80,1,0x39e6ff],[80,-1,0xff3aa0]];
    const beams=sites.map(([i,sd,col],k)=>{ const e=(sd<0?P.wl[i]:P.wr[i])+9; const b=new THREE.Mesh(geo,beamMat(col)); b.position.set(P.x[i]+P.rx[i]*e*sd,P.y[i]-0.5,P.z[i]+P.rz[i]*e*sd); b.renderOrder=4; b.frustumCulled=false; W.group.add(b); return {b,ph:k*1.7,sd}; });
    W.updaters.push((dt,t)=>{ beams.forEach(({b,ph,sd})=>{ b.rotation.set(0.32*Math.sin(t*0.23+ph)+0.12*sd, 0, 0.36*Math.cos(t*0.19+ph*1.3)); }); });
  }
}
// ---------- Alondra Boulevard runtime material touch-ups ----------
function alondraMaterials(W,root,Q){
  const lit=[]; const seen=new Set();
  root.traverse(o=>{ if(!o.isMesh) return; const mats=Array.isArray(o.material)?o.material:[o.material];
    mats.forEach(m=>{ if(!m||seen.has(m)) return; seen.add(m); const n=m.name||'';
      if(/m_(tags|hot|fence|foliage)/.test(n)){ m.alphaTest=0.5; m.transparent=false; m.depthWrite=true; }
      if(/m_(fence|foliage)/.test(n)){ m.side=THREE.DoubleSide; }
      if(/m_foliage/.test(n)){ o.castShadow=Q.shadows&&/veg_(start|commercial|mural|res|near)/.test(o.name); }
      if(/m_signs|m_event/.test(n) && m.emissiveMap){ m.emissiveIntensity=/m_signs/.test(n)?0.22:0.12; }
      if(/m_gantry/.test(n) && m.emissiveMap){ m.emissiveIntensity=0.35; }
      if(/m_maximus/.test(n) && m.emissiveMap){ m.emissiveIntensity=0.35; }
      if(/m_hot_lit/.test(n)){ m.emissive=new THREE.Color(0xffffff); if(!m.emissiveMap) m.emissiveMap=m.map; m.emissiveIntensity=0.9; m.toneMapped=true; lit.push(m); }
      if(/m_glass/.test(n)){ m.roughness=0.15; m.metalness=0.7; }
      if(/m_(murals|facade|court)/.test(n)){ m.roughness=0.85; m.metalness=0; }
    }); });
  // Hot Block signs breathe gently (no strobe): 0.75..1.05 over ~2.4 s
  if(lit.length) W.updaters.push((dt,t)=>{ const k=0.9+0.15*Math.sin(t*2.6); lit.forEach(m=>m.emissiveIntensity=k); });
}
function envFree(E,x,z,r){ const f=E.foot; for(let k=0;k<f.length;k++){ const b=f[k]; const dx=b[0]-x, dz=b[1]-z; if(dx*dx+dz*dz<(b[2]+r)*(b[2]+r)) return false; } return true; }
function addEnv(W,def,scene,Q){
  const cfg=ENV_CFG[def.id]||{};
  const root=scene.clone(true); const foot=[]; let lamps=null, hasTerrain=false; const aniso=(window.GAME&&GAME.renderer)?Math.min(Q.shadows?8:4,GAME.renderer.capabilities.getMaxAnisotropy()):4;
  const hide=[];
  root.traverse(o=>{ const ud=o.userData||{};
    if(ud.foot){ try{ foot.push(...JSON.parse(ud.foot)); }catch(e){} }
    if(ud.lamps){ try{ lamps={pos:JSON.parse(ud.lamps),dir:JSON.parse(ud.lampDir)}; }catch(e){} }
    if(ud.layout){ try{ const Lj=JSON.parse(ud.layout); if(Lj.lamps) lamps=Lj.lamps; }catch(e){} }
    if(!o.isMesh) return; const m=o.material; const n=(m.name||'');
    if(/^terrain/.test(o.name)) hasTerrain=true;
    if(cfg.lowHide && Q.density<0.6 && cfg.lowHide.test(o.name)) hide.push(o);
    if(m.map){ m.map.anisotropy=aniso; m.map.needsUpdate=true; }
    if(/fence/.test(n)){ m.transparent=false; m.alphaTest=0.45; m.side=THREE.DoubleSide; m.depthWrite=true; o.castShadow=false; }
    else if(!cfg.respectSides){ m.side=/billboard|bb_|donut|spr|lamp/.test(n)?THREE.DoubleSide:THREE.FrontSide; }
    if(/line|checker/.test(n)){ m.polygonOffset=true; m.polygonOffsetFactor=-2; m.polygonOffsetUnits=-2; }
    if(cfg.respectSides && /m_rock|m_scrub|m_strata/.test(n)){ m.flatShading=/m_rock|m_scrub/.test(n); m.needsUpdate=true; }
    if(/foam/.test(n)){ m.transparent=true; m.alphaTest=0; m.depthWrite=false; m.side=THREE.DoubleSide; o.renderOrder=1; o.castShadow=false; }
    if(/maximus|gantry_sign/.test(n) && m.emissiveMap){ m.emissiveIntensity=/maximus/.test(n)?0.55:0.3; m.toneMapped=true; }
    o.receiveShadow=true;
    o.castShadow=Q.shadows && !/foam/.test(n) && (cfg.shadowRe ? cfg.shadowRe.test(o.name) : cfg.respectSides ? /gantry|maximus|grandstand|festival|gasdiner|mine|arch|joshua|support|mesa_|trackside|guardrail/.test(o.name) : /city|barrier|billboard|lamp|donut/.test(o.name));
    o.matrixAutoUpdate=false; o.updateMatrix(); });
  hide.forEach(o=>{ o.visible=false; });
  if(cfg.neon) neonMaterials(W,root,Q);
  if(cfg.alondra) alondraMaterials(W,root,Q);
  root.updateMatrixWorld(true); W.group.add(root);
  return Object.assign({root,foot,lamps,hasTerrain},cfg);
}
// ===== Y'all Fuck With Racin? runtime: chapter atmosphere, water, portals, troops, props, flags, artillery spectacle =====
// Everything here is environmental: no collision, never touches car physics. Cannon arcs and impact zones come from the
// Blender/python layout, where each arc is verified to clear the road by a wide margin (and is re-checked below at load).
const REV_ATMO={
  swamp:    {fog:0xa7b39a,near:48, far:600, top:0x4c6784,hor:0xeab98a,sun:0xffb070,sunI:1.75,hs:0xb6c0ae,hg:0x2c3a22,hi:0.86,exp:0.97,cl:0.46},
  lexington:{fog:0xd4e0e8,near:170,far:1350,top:0x4a84d0,hor:0xdae8f3,sun:0xfff0d6,sunI:2.4,hs:0xc4daff,hg:0x5a7838,hi:0.95,exp:1.0,cl:0.34},
  bunker:   {fog:0xe3d4b2,near:140,far:1150,top:0x5885c0,hor:0xf1dab0,sun:0xffdfa6,sunI:2.5,hs:0xd0d8ea,hg:0x786c3a,hi:0.9, exp:1.0,cl:0.3},
  delaware: {fog:0xc6d0dc,near:80, far:760, top:0x7a90ab,hor:0xdde5ee,sun:0xe6ecff,sunI:1.7,hs:0xd4e0f2,hg:0x98a0aa,hi:1.05,exp:0.94,cl:0.78},
  trenton:  {fog:0xc2cad6,near:70, far:700, top:0x7489a6,hor:0xd9e1ea,sun:0xe6ecff,sunI:1.6,hs:0xd4e0f2,hg:0x98a0aa,hi:1.05,exp:0.94,cl:0.82},
  saratoga: {fog:0xe4c69c,near:130,far:1000,top:0x5a7db2,hor:0xf2cd9a,sun:0xffcd8c,sunI:2.3,hs:0xd8d0c0,hg:0x785830,hi:0.9, exp:1.0,cl:0.42},
  yorktown: {fog:0xead1a4,near:160,far:1300,top:0x587db6,hor:0xf6d29a,sun:0xffca86,sunI:2.4,hs:0xd6d0c4,hg:0x887046,hi:0.9, exp:1.02,cl:0.38},
};
function revChapterAt(P,i){ const R=P.route, ch=R.chapters; let cur=ch[0], nxt=null;
  if(R.teleportEntry && (i>R.ret+30 || i<R.circ)) return {cur:ch.find(c=>c.id==='swamp')||ch[0],nxt:null,t:0};   // the drag strip (and anything hidden beyond it)
  for(let k=0;k<ch.length;k++){ if(i>=ch[k].i){ cur=ch[k]; nxt=ch[k+1]||null; } }
  if(i>R.ret) return {cur:ch[ch.length-1],nxt:null,t:0};
  const blend=70; let t=0; if(nxt){ const d=nxt.i-i; if(d<blend) t=1-d/blend; }
  return {cur,nxt,t}; }
function revWaterMat(o){
  const U=THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{t:{value:0},deep:{value:new THREE.Color(o.deep)},shallow:{value:new THREE.Color(o.shallow)},sky:{value:new THREE.Color(0xdde6f0)},
    sunDir:{value:new THREE.Vector3(-0.7,0.3,0.55).normalize()},sunCol:{value:new THREE.Color(0xfff0d0)},ripple:{value:o.ripple||0.12},speed:{value:o.speed||0.25},ice:{value:o.ice||0},op:{value:o.op||0.93},refl:{value:o.refl==null?0.75:o.refl},weed:{value:o.weed||0}}]);
  return new THREE.ShaderMaterial({uniforms:U,fog:true,transparent:true,depthWrite:true,
    vertexShader:'varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; vec4 mvPosition=viewMatrix*w; gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
    fragmentShader:'uniform float t,ripple,speed,ice,op,refl,weed; uniform vec3 deep,shallow,sky,sunDir,sunCol; varying vec3 vW;\n#include <fog_pars_fragment>\n'+
      'float hh(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); } float nn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hh(i),hh(i+vec2(1.,0.)),f.x),mix(hh(i+vec2(0.,1.)),hh(i+vec2(1.,1.)),f.x),f.y); }\n'+
      'void main(){ vec2 p=vW.xz*ripple; float a=nn(p+vec2(t*speed,t*speed*0.7)), b=nn(p*2.1-vec2(t*speed*0.8,-t*speed*0.45)), c=nn(p*5.3+vec2(t*speed*1.7,0.));\n'+
      ' vec3 N=normalize(vec3((a-0.5)*0.3+(b-0.5)*0.18+(c-0.5)*0.08,1.,(b-0.5)*0.3-(a-0.5)*0.12+(c-0.5)*0.08)); vec3 V=normalize(cameraPosition-vW);\n'+
      ' float fr=0.04+refl*0.8*pow(1.-max(dot(N,V),0.),4.); vec3 R=reflect(-V,N); float sp=pow(max(dot(R,normalize(sunDir)),0.),160.);\n'+
      ' vec3 col=mix(deep,shallow,0.3+0.4*a); col=mix(col,sky,fr); col+=sunCol*sp*1.1;\n'+
      ' float wd=smoothstep(0.5,0.72,nn(vW.xz*0.028+vec2(3.1,0.)))*smoothstep(0.3,0.6,nn(vW.xz*0.11))*weed; col=mix(col,vec3(0.17,0.25,0.08)*(0.75+0.5*c),wd*0.85);\n'+
      ' float fl=smoothstep(0.58,0.7,nn(vW.xz*0.055+vec2(0.,t*0.02)))*ice; col=mix(col,vec3(0.86,0.9,0.95)*(0.85+0.15*b),fl);\n'+
      ' gl_FragColor=vec4(col,op);\n#include <fog_fragment>\n}'});
}
function revPortalMat(see,cols){
  return new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
    uniforms:{t:{value:0},see:{value:see},c1:{value:new THREE.Color(cols[0])},c2:{value:new THREE.Color(cols[1])},c3:{value:new THREE.Color(cols[2])},flash:{value:0}},
    vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader:'uniform float t,see,flash; uniform vec3 c1,c2,c3; varying vec2 vUv;\n'+
      'void main(){ vec2 p=vUv*2.-1.; float r=length(p); if(r>1.) discard; float a=atan(p.y,p.x); float lr=log(r+0.04);\n'+
      ' float arms=pow(0.5+0.5*sin(a*3.+lr*5.-t*2.4),4.)*smoothstep(0.05,0.5,r);\n'+
      ' float arms2=pow(0.5+0.5*sin(a*5.-lr*7.+t*1.7),6.)*smoothstep(0.25,0.85,r);\n'+
      ' float rim=exp(-pow((r-0.935)/0.04,2.)); float ring2=exp(-pow((r-0.85)/0.025,2.))*(0.5+0.5*sin(a*16.+t*5.));\n'+
      ' vec3 col=mix(c3,c1,arms); col=mix(col,c2,rim+ring2*0.6); col+=vec3(1.)*flash*0.25;\n'+
      ' float al=clamp(rim*0.95+ring2*0.5+arms*0.55*(1.-see*0.5)+arms2*0.35*(1.-see*0.4)+0.06+flash*0.15,0.,0.95);\n'+
      ' gl_FragColor=vec4(col,al); }'});
}
// soft smoke / flash / snow particles with fog (one draw call per system)
class RevPuffs{
  constructor(max,additive,tex){
    this.max=max; this.head=0; const A=n=>new Float32Array(n);
    this.pos=A(max*3); this.vel=A(max*3); this.col=A(max*4); this.size=A(max); this.life=A(max); this.ml=A(max); this.s0=A(max); this.s1=A(max); this.a0=A(max); this.drag=A(max); this.lift=A(max); this.seed=A(max);
    for(let i=0;i<max;i++) this.seed[i]=Math.random();
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(this.pos,3)); g.setAttribute('color',new THREE.BufferAttribute(this.col,4)); g.setAttribute('size',new THREE.BufferAttribute(this.size,1)); g.setAttribute('seed',new THREE.BufferAttribute(this.seed,1));
    const U=THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{scale:{value:700},map:{value:tex}}]);
    this.mat=new THREE.ShaderMaterial({uniforms:U,fog:!additive,transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,
      vertexShader:'attribute vec4 color; attribute float size, seed; uniform float scale; varying vec4 vC; varying float vS;\n#include <fog_pars_vertex>\nvoid main(){ vC=color; vS=seed; vec4 mvPosition=modelViewMatrix*vec4(position,1.); gl_PointSize=min(900.,size*scale/max(0.1,-mvPosition.z)); gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
      fragmentShader:'uniform sampler2D map; varying vec4 vC; varying float vS;\n#include <fog_pars_fragment>\nvoid main(){ vec2 q=gl_PointCoord-0.5; float c=cos(vS*6.28), s=sin(vS*6.28); q=mat2(c,-s,s,c)*q; vec4 tx=texture2D(map,q+0.5); float a=tx.a*vC.a; if(a<0.01) discard; gl_FragColor=vec4(vC.rgb*tx.rgb,a);\n#include <fog_fragment>\n}'});
    this.points=new THREE.Points(g,this.mat); this.points.frustumCulled=false; this.geo=g;
  }
  emit(x,y,z,vx,vy,vz,life,s0,s1,r,g,b,a,drag=0.6,lift=0){ const i=this.head; this.head=(this.head+1)%this.max;
    this.pos.set([x,y,z],i*3); this.vel.set([vx,vy,vz],i*3); this.life[i]=life; this.ml[i]=life; this.s0[i]=s0; this.s1[i]=s1; this.col.set([r,g,b,a],i*4); this.a0[i]=a; this.drag[i]=drag; this.lift[i]=lift; }
  update(dt){ const P=this.pos,V=this.vel;
    for(let i=0;i<this.max;i++){ if(this.life[i]<=0){ if(this.size[i]!==0){ this.size[i]=0; this.col[i*4+3]=0; } continue; }
      const l=this.life[i]-=dt; if(l<=0){ this.size[i]=0; this.col[i*4+3]=0; continue; }
      const k=Math.exp(-this.drag[i]*dt); V[i*3]*=k; V[i*3+1]=V[i*3+1]*k+this.lift[i]*dt; V[i*3+2]*=k;
      P[i*3]+=V[i*3]*dt; P[i*3+1]+=V[i*3+1]*dt; P[i*3+2]+=V[i*3+2]*dt;
      const f=l/this.ml[i]; this.size[i]=this.s1[i]+(this.s0[i]-this.s1[i])*f; this.col[i*4+3]=this.a0[i]*Math.min(1,f*2.2)*Math.min(1,(1-f)*8+0.2); }
    this.geo.attributes.position.needsUpdate=true; this.geo.attributes.color.needsUpdate=true; this.geo.attributes.size.needsUpdate=true; }
}
function revSmokeTex(){ return canvasTex(128,128,(g,w,h)=>{ for(let k=0;k<34;k++){ const a=Math.random()*6.28, r0=Math.random()*26; const x=64+Math.cos(a)*r0, y=64+Math.sin(a)*r0, r=14+Math.random()*22; const gr=g.createRadialGradient(x,y,0,x,y,r); const v=205+Math.random()*50|0;
  gr.addColorStop(0,`rgba(${v},${v},${v},0.22)`); gr.addColorStop(0.6,`rgba(${v},${v},${v},0.08)`); gr.addColorStop(1,`rgba(${v},${v},${v},0)`); g.fillStyle=gr; g.fillRect(0,0,w,h); }
  const id=g.getImageData(0,0,w,h), d=id.data; for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const q=Math.hypot(x-64,y-64)/64; const f=Math.max(0,1-q*q); d[(y*w+x)*4+3]*=f; } g.putImageData(id,0,0); }); }
function revDotTex(){ return canvasTex(64,64,(g)=>{ const gr=g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.4,'rgba(255,255,255,0.6)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64); }); }
// height grid rasterised from the environment's terrain tiles (camera ground clamp, runtime placement)
function revHeightGrid(root){
  const cell=6; let minx=1e9,maxx=-1e9,minz=1e9,maxz=-1e9; const tris=[];
  root.updateMatrixWorld(true);
  root.traverse(o=>{ if(!o.isMesh||!/^terrain/.test(o.name)) return; const g=o.geometry, p=g.attributes.position, ix=g.index; const v=new THREE.Vector3(); const W=[];
    const arr=p.array, nf=p.normalized?(arr instanceof Int16Array?1/32767:arr instanceof Uint16Array?1/65535:arr instanceof Int8Array?1/127:arr instanceof Uint8Array?1/255:1):1, is=p.itemSize, st=p.isInterleavedBufferAttribute?p.data.stride:is, of=p.isInterleavedBufferAttribute?p.offset:0, src=p.isInterleavedBufferAttribute?p.data.array:arr;
    for(let k=0;k<p.count;k++){ v.set(src[k*st+of]*nf,src[k*st+of+1]*nf,src[k*st+of+2]*nf).applyMatrix4(o.matrixWorld); W.push(v.x,v.y,v.z); if(v.x<minx)minx=v.x; if(v.x>maxx)maxx=v.x; if(v.z<minz)minz=v.z; if(v.z>maxz)maxz=v.z; }
    tris.push({W,ix:ix?ix.array:null,n:ix?ix.count:p.count}); });
  if(!tris.length) return null;
  const nx=Math.ceil((maxx-minx)/cell)+1, nz=Math.ceil((maxz-minz)/cell)+1; const H=new Float32Array(nx*nz).fill(-1e9);
  for(const T of tris){ const W=T.W;
    for(let f=0;f<T.n;f+=3){ const a=(T.ix?T.ix[f]:f)*3, b=(T.ix?T.ix[f+1]:f+1)*3, c=(T.ix?T.ix[f+2]:f+2)*3;
      const x0=Math.min(W[a],W[b],W[c]), x1=Math.max(W[a],W[b],W[c]), z0=Math.min(W[a+2],W[b+2],W[c+2]), z1=Math.max(W[a+2],W[b+2],W[c+2]);
      const d=(W[b+2]-W[c+2])*(W[a]-W[c])+(W[c]-W[b])*(W[a+2]-W[c+2]); if(Math.abs(d)<1e-9) continue;
      for(let gz=Math.ceil((z0-minz)/cell); gz<=Math.floor((z1-minz)/cell); gz++) for(let gx=Math.ceil((x0-minx)/cell); gx<=Math.floor((x1-minx)/cell); gx++){
        const px=minx+gx*cell, pz=minz+gz*cell; const l0=((W[b+2]-W[c+2])*(px-W[c])+(W[c]-W[b])*(pz-W[c+2]))/d, l1=((W[c+2]-W[a+2])*(px-W[c])+(W[a]-W[c])*(pz-W[c+2]))/d, l2=1-l0-l1;
        if(l0<-1e-4||l1<-1e-4||l2<-1e-4) continue; H[gz*nx+gx]=l0*W[a+1]+l1*W[b+1]+l2*W[c+1]; } } }
  return {minx,minz,cell,nx,nz,H,at(x,z){ const fx=(x-minx)/cell, fz=(z-minz)/cell; const ix=Math.max(0,Math.min(nx-2,Math.floor(fx))), iz=Math.max(0,Math.min(nz-2,Math.floor(fz))); const tx=Math.max(0,Math.min(1,fx-ix)), tz=Math.max(0,Math.min(1,fz-iz));
    const h00=H[iz*nx+ix],h10=H[iz*nx+ix+1],h01=H[(iz+1)*nx+ix],h11=H[(iz+1)*nx+ix+1]; const hs=[h00,h10,h01,h11]; if(hs.some(h=>h<-1e8)){ const m=Math.max(...hs); return m<-1e8?null:m; }
    return (h00*(1-tx)+h10*tx)*(1-tz)+(h01*(1-tx)+h11*tx)*tz; }};
}
function revFindMesh(root,name){ let m=null; if(root) root.traverse(o=>{ if(!m&&o.isMesh&&(o.name===name||(o.parent&&o.parent.name===name))) m=o; }); return m; }
function revPrep(mesh){ const g=mesh.geometry.clone(); mesh.updateMatrixWorld(true); g.applyMatrix4(mesh.matrixWorld); if(!g.attributes.normal) g.computeVertexNormals(); const m=mesh.material.clone(); if(m.map){ m.map.anisotropy=4; } return {g,m}; }

function revolutionWorld(W,def,P,Q,ENV){
  const G=W.group, low=Q.density<0.6, R0=P.route; W.th=Object.assign({},W.th); W.rev={};
  let L={}; ENV.root.traverse(o=>{ if(o.userData&&o.userData.layout){ try{ L=JSON.parse(o.userData.layout); }catch(e){} } }); W.rev.layout=L;
  // ---- ground height from the real terrain tiles
  const HG=revHeightGrid(ENV.root); if(HG){ const base=W.heightAt; W.heightAt=(x,z)=>{ const h=HG.at(x,z); return h==null?base(x,z):h; }; W.rev.hg=HG; }
  // ---- sky / lights handles for the chapter atmosphere
  let sky=null, hemi=null; G.traverse(o=>{ if(o.material&&o.material.uniforms&&o.material.uniforms.hor&&o.material.uniforms.top) sky=o; if(o.isHemisphereLight) hemi=o; });
  // ---- water surfaces
  const waters=[];
  ENV.root.traverse(o=>{ if(!o.isMesh) return; const n=(o.material&&o.material.name)||'';
    let m=null;
    if(/m_water_swamp/.test(n)) m=revWaterMat({deep:0x0b1008,shallow:0x222c1a,ripple:0.09,speed:0.1,op:0.97,refl:0.55,weed:0.5});
    else if(/m_water_river/.test(n)) m=/delaware/.test(o.name)? revWaterMat({deep:0x2a3a48,shallow:0x5a6e7e,ripple:0.07,speed:0.35,ice:low?0.5:0.85,op:0.97}) : revWaterMat({deep:0x223a40,shallow:0x4f6e62,ripple:0.1,speed:0.3});
    else if(/m_water_harbor/.test(n)) m=revWaterMat({deep:0x1b3346,shallow:0x3f6076,ripple:0.05,speed:0.25});
    if(m){ o.material=m; o.renderOrder=1; o.receiveShadow=false; o.castShadow=false; waters.push(m); } });
  // ---- materials tweaks + shader upgrades: two-scale ground detail with large-scale colour variation (no flat tiling), road wear, wind in the foliage
  const revT={value:0}; W.rev.shaderT=revT;
  const RVN='float rvh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} float rvn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(rvh(i),rvh(i+vec2(1,0)),f.x),mix(rvh(i+vec2(0,1)),rvh(i+vec2(1,1)),f.x),f.y);}\n';
  const upg=(m,kind)=>{ if(m.userData.rvUpg) return; m.userData.rvUpg=kind;
    m.onBeforeCompile=sh=>{ sh.uniforms.rvT=revT;
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vRW; uniform float rvT;').replace('#include <begin_vertex>', kind==='leaf'?
        '#include <begin_vertex>\n{ vec4 rwp=modelMatrix*vec4(transformed,1.0); float sw=sin(rvT*1.5+rwp.x*0.09+rwp.z*0.07)*0.6+sin(rvT*2.9+rwp.x*0.23-rwp.z*0.17)*0.3; transformed.x+=sw*0.13/length(modelMatrix[0].xyz); transformed.z+=sw*0.09/length(modelMatrix[2].xyz); }':'#include <begin_vertex>')
        .replace('#include <project_vertex>','#include <project_vertex>\nvRW=(modelMatrix*vec4(transformed,1.0)).xyz;');
      if(kind==='leaf') return;
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vRW;\n'+RVN).replace('#include <map_fragment>', kind==='ground'?
        '#include <map_fragment>\n{ vec4 t2=texture2D(map,'+GFX.compat.uvMap+'*0.173+vec2(0.31,0.77)); diffuseColor.rgb*=mix(vec3(1.0),t2.rgb*1.3,0.4); float mac=rvn(vRW.xz*0.006)*0.55+rvn(vRW.xz*0.023)*0.3+rvn(vRW.xz*0.09)*0.15; diffuseColor.rgb*=0.8+0.36*mac; float warm=rvn(vRW.xz*0.011+7.3); diffuseColor.rgb*=mix(vec3(0.95,1.0,0.94),vec3(1.06,1.0,0.92),warm); }':
        '#include <map_fragment>\n{ float mac=rvn(vRW.xz*0.02)*0.6+rvn(vRW.xz*0.11)*0.4; diffuseColor.rgb*=0.87+0.22*mac; }'); };
    m.customProgramCacheKey=()=>'rv_'+kind; m.needsUpdate=true; };
  ENV.root.traverse(o=>{ if(!o.isMesh) return; const m=o.material, n=(m&&m.name)||'';
    if(/m_ground/.test(n)&&m.map) upg(m,'ground'); else if(/m_road/.test(n)&&m.map) upg(m,'road');
    if(/m_foliage/.test(n)){ m.alphaTest=0.45; m.transparent=false; m.side=THREE.DoubleSide; m.depthWrite=true; if(!low) upg(m,'leaf'); }
    if(/m_canvas|m_flags/.test(n)){ m.side=THREE.DoubleSide; }
    if(/m_glow/.test(n)){ m.emissive=new THREE.Color(0xffb060); m.emissiveIntensity=1.2; m.toneMapped=true; }
    if(/m_maximus/.test(n)&&m.emissiveMap){ m.emissiveIntensity=0.45; }
    if(/m_signs/.test(n)){ m.roughness=0.7; } });
  // distance culling for the tiled vegetation / grass / buildings (fog hides them anyway; this keeps triangle counts down)
  const cull=[]; ENV.root.updateMatrixWorld(true);
  ENV.root.traverse(o=>{ if(!o.isMesh||!/^rv_(veg|grass|bld)/.test(o.name)||!o.visible) return; const p=o.geometry.attributes.position; const arr=p.isInterleavedBufferAttribute?p.data.array:p.array, st=p.isInterleavedBufferAttribute?p.data.stride:3, of=p.isInterleavedBufferAttribute?p.offset:0;
    const nf=p.normalized?(arr instanceof Int16Array?1/32767:arr instanceof Uint16Array?1/65535:arr instanceof Int8Array?1/127:arr instanceof Uint8Array?1/255:1):1; const v=new THREE.Vector3(), bb=new THREE.Box3();
    for(let k=0;k<p.count;k+=3){ v.set(arr[k*st+of]*nf,arr[k*st+of+1]*nf,arr[k*st+of+2]*nf).applyMatrix4(o.matrixWorld); bb.expandByPoint(v); }
    const c=bb.getCenter(new THREE.Vector3()); cull.push({o,c,r:bb.getSize(new THREE.Vector3()).length()/2,grass:/^rv_grass/.test(o.name)}); });
  let cullT=0; W.updaters.push((dt)=>{ cullT-=dt; if(cullT>0) return; cullT=0.25; const cam=GAME.camera.position; const far=Math.min(W.fog.far*1.02,low?520:2400);
    for(const q of cull){ const d=Math.hypot(q.c.x-cam.x,q.c.z-cam.z)-q.r; q.o.visible=d<(q.grass?Math.min(far,low?120:260):far); } });
  const smokeTex=revSmokeTex(), dotTex=revDotTex();
  const smoke=new RevPuffs(low?260:620,false,smokeTex), flash=new RevPuffs(low?60:140,true,dotTex), motes=new RevPuffs(low?220:520,true,dotTex), flakes=new RevPuffs(low?300:900,false,dotTex);
  [smoke,flash,motes,flakes].forEach(s=>G.add(s.points)); W.rev.smoke=smoke; W.rev.flash=flash;
  // ---- portals: swirling light discs in the timber-and-stone frames
  const portals=[];
  (L.portals||[]).forEach(pp=>{ const entry=pp.name==='entry', arrival=pp.name==='arrival';
    const mat=revPortalMat(entry?0.7:(arrival?0.15:0.3),(entry||arrival)?[0x4fd8ff,0xffc860,0x5a2aa8]:[0xffb050,0xffe4a0,0x7a2a18]);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(pp.w,pp.h),mat); m.position.set(pp.center[0],pp.center[1],pp.center[2]); m.rotation.y=Math.atan2(pp.dir[0],pp.dir[2]); m.renderOrder=3; G.add(m);
    portals.push({mesh:m,mat,pp,i:pp.i}); });
  W.rev.portals=portals;
  // ---- props (heroes, cannons, wagons, inns, ships)
  const srcP=CAR_GLTF['rv_props'], srcH=CAR_GLTF['rv_heroes'], srcT=CAR_GLTF['rv_troops'];
  const bob=[]; const placed={};
  const byId={}; (L.props||[]).forEach(p=>{ (byId[p.id]=byId[p.id]||[]).push(p); });
  const dummy=new THREE.Object3D(); const propCull=[];
  Object.keys(byId).forEach(id=>{ const src=revFindMesh(id==='marion'||id==='washington'?srcH:srcP,id); if(!src) return; const {g,m}=revPrep(src); const list=byId[id];
    if(list.length>3 && !['galleon'].includes(id)){ const im=new THREE.InstancedMesh(g,m,list.length); list.forEach((p,k)=>{ dummy.position.set(p.p[0],p.p[1],p.p[2]); dummy.rotation.set(0,p.r||0,0); dummy.scale.setScalar(p.s||1); dummy.updateMatrix(); im.setMatrixAt(k,dummy.matrix); });
      im.castShadow=Q.shadows&&id!=='wagon'; im.receiveShadow=true; im.frustumCulled=false; G.add(im); placed[id]=im;
      if(!g.boundingSphere) g.computeBoundingSphere(); const mats=[]; for(let k=0;k<list.length;k++){ const mm=new THREE.Matrix4(); im.getMatrixAt(k,mm); mats.push(mm); }
      propCull.push({im,mats,pos:list.map(p=>[p.p[0],p.p[2],g.boundingSphere.radius*(p.s||1)])}); }
    else list.forEach(p=>{ const o=new THREE.Mesh(g,m); o.position.set(p.p[0],p.p[1],p.p[2]); o.rotation.y=p.r||0; o.scale.setScalar(p.s||1); o.castShadow=Q.shadows&&id!=='galleon'; o.receiveShadow=true; G.add(o);
      if(!g.boundingSphere) g.computeBoundingSphere(); propCull.push({o,pos:[[p.p[0],p.p[2],g.boundingSphere.radius*(p.s||1)]]});
      if(p.bob) bob.push({o,y:p.p[1],r:p.r||0,a:p.bob,ph:Math.random()*6}); if(id==='washington') W.rev.boat=o; if(id==='marion') W.rev.marion=o; }); });
  W.rev.placed=placed;
  // ---- the house easter eggs (Hi Joe, Maximus Knives, the donkeys, the trio): spots chosen in the layout on long straights, trees cleared along the sightline
  (L.eggs||[]).forEach(e=>{ if(typeof CAR_GLTF==='undefined'||!CAR_GLTF[e.id]) return; const o=makeProp(e.id); if(!o) return; const info=PROP_INFO[e.id]||{}; const fc=info.face||1;
    o.rotation.y=fc>0?Math.atan2(e.n[0],e.n[1]):Math.atan2(-e.n[0],-e.n[1]); o.scale.setScalar(e.s||1); o.position.set(e.p[0],W.heightAt(e.p[0],e.p[2])-0.05,e.p[2]); G.add(o);
    propCull.push({o,pos:[[e.p[0],e.p[2],14]]}); });
  // ---- Francis Marion, the Swamp Fox: waits ahead of the grid, rears at GO, then gallops point down the causeway and vanishes into the portal
  let marion=null;
  if(L.marion&&srcH){ const src=revFindMesh(srcH,'marion'); if(src){ const {g,m}=revPrep(src); const o=new THREE.Mesh(g,m); o.castShadow=Q.shadows; o.receiveShadow=true; o.scale.setScalar(1.3); G.add(o);
      marion={o,s:L.marion.i,end:L.marion.portal,phase:'wait',v:0,t:0}; W.rev.marion=o; } }
  const marionStep=(dt,t)=>{ const M=marion, R=GAME.race; if(!M||!R||M.phase==='gone') return; const N=P.N, sp=P.spacing;
    if(M.phase==='wait'&&R.state==='race'){ M.phase='ride'; M.t=0; }
    let rear=0, gal=0;
    if(M.phase==='wait'){ if(R.state==='countdown'&&R.stateT>2.55) rear=Math.min(1,(R.stateT-2.55)/0.35); }
    else { M.t+=dt; rear=Math.max(0,1-M.t/0.5);
      // keep ~24 m ahead of the leading car on the strip; accelerate like a horse that has seen a lot of cannon fire
      let lead=-1e9; for(const c of R.cars){ if(c.cp===0){ const cs=c.pr.i+c.pr.t; if(cs>lead) lead=cs; } }
      const want=lead+17/sp; M.v=Math.min(M.v+dt*16,62); let ns=M.s+M.v*dt/sp; if(ns<want) ns=Math.min(want,M.s+(M.v+30)*dt/sp); M.s=ns; gal=1;
      if(M.s>=M.end){ M.phase='gone'; M.o.visible=false; const pp=(L.portals||[]).find(q=>q.name==='entry');
        if(pp){ for(let k=0;k<(low?16:40);k++) motes.emit(pp.center[0]+rr(-4,4),pp.center[1]+rr(-5,4),pp.center[2]+rr(-1,1),rr(-3,3),rr(-1,3),rr(-3,3),rr(1.5,3),0.9,0.3,0.85,0.95,1,1,0.5,0); flash.emit(pp.center[0],pp.center[1],pp.center[2],0,0,0,0.5,14,6,0.6,0.85,1,1,0,0); }
        const cam=GAME.camera.position; const d=Math.hypot(M.o.position.x-cam.x,M.o.position.z-cam.z); if(d<300) GAME.audio.play('portal',Math.max(0.15,1-d/300)); return; } }
    const i=Math.floor(M.s)%N, j=(i+1)%N, u=M.s-Math.floor(M.s); const x=P.x[i]+(P.x[j]-P.x[i])*u, z=P.z[i]+(P.z[j]-P.z[i])*u, y=P.y[i]+(P.y[j]-P.y[i])*u;
    const ph=t*2*Math.PI*2.3; const hop=gal?Math.abs(Math.sin(ph))*0.28:Math.sin(t*1.7)*0.015;
    if(gal&&Math.random()<dt*(low?10:24)){ const tx=P.tx[i], tz=P.tz[i]; smoke.emit(x-tx*1.2+rr(-0.4,0.4),y+0.2,z-tz*1.2+rr(-0.4,0.4),-tx*rr(2,5),rr(1,3),-tz*rr(2,5),rr(0.6,1.2),0.5,1.4,0.52,0.48,0.4,0.55,1.2,-2); }
    M.o.position.set(x,y+hop,z); M.o.rotation.set(-rear*0.32+(gal?Math.sin(ph)*0.07:Math.sin(t*1.3)*0.01),Math.atan2(P.tx[i],P.tz[i]),0,'YXZ'); };
  // distance culling for props: far single meshes are hidden, instanced props are compacted to the instances in range (eggs register here too)
  let propT=0; W.updaters.push((dt)=>{ propT-=dt; if(propT>0) return; propT=0.25; const cam=GAME.camera.position; const far=Math.min(W.fog.far*1.02,low?420:1500);
    for(const q of propCull){ if(q.o){ const p=q.pos[0]; q.o.visible=Math.hypot(p[0]-cam.x,p[1]-cam.z)-p[2]<far; continue; }
      let n=0; for(let k=0;k<q.pos.length;k++){ const p=q.pos[k]; if(Math.hypot(p[0]-cam.x,p[1]-cam.z)-p[2]<far){ q.im.setMatrixAt(n++,q.mats[k]); } }
      q.im.count=n; q.im.visible=n>0; q.im.instanceMatrix.needsUpdate=true; } });
  // ---- troops: instanced per uniform (LOD0 near, LOD1 far), with small loops: idle breathing, drill, volleys, cheering
  const TYPES=['redcoat','hessian','continental','militia','french']; const troops=L.troops||[]; const tm={};
  const TP={}; TYPES.forEach(t=>{ const a=revFindMesh(srcT,t), b=revFindMesh(srcT,t+'_l1'), c=revFindMesh(srcT,t+'_l2'); if(a&&b) TP[t]=[revPrep(a),revPrep(b),c?revPrep(c):revPrep(b)]; });
  (L.stands||[]).forEach(s=>{ /* spectators come from the same pools */ });
  const crowd=[]; (L.stands||[]).forEach((s,si)=>{ s.slots.forEach((q,k)=>{ const t=['continental','militia','french','continental','militia'][(k*7+si*3)%5]; crowd.push({t,p:q,r:Math.atan2(s.face[0],s.face[2])+((k*13)%7-3)*0.05,a:'crowd',ph:k*0.37}); }); });
  const allTroops=troops.concat(low?crowd.filter((c,k)=>k%3===0):crowd);
  TYPES.forEach(t=>{ const n=allTroops.filter(q=>q.t===t).length; if(!n||!TP[t]) return; const mk=(k,sh)=>{ const m=new THREE.InstancedMesh(TP[t][k].g,TP[t][k].m,n); m.count=0; m.castShadow=sh; m.frustumCulled=false; G.add(m); return m; };
    tm[t]={i0:mk(0,Q.shadows),i1:mk(1,false),i2:mk(2,false)}; });
  W.rev.troops=allTroops; W.rev.tm=tm;
  // volley groups: troops with anim 'fire' share a group timer
  const volleys={}; allTroops.forEach(q=>{ if(q.a==='fire'){ const g=q.g||'v'; (volleys[g]=volleys[g]||{list:[],next:3+Math.random()*6}).list.push(q); } });
  // ---- flags (CPU-waved cloth near the camera)
  const flagTex=new THREE.TextureLoader().load('models/env/rv_flags.jpg?v=1'); GFX.compat.srgb(flagTex); flagTex.anisotropy=4;
  const FLAG_UV={us13:[0,0],grand_union:[1,0],union:[0,1],red_ensign:[1,1],france:[0,2],pine_tree:[1,2],cinc:[0,3],rr_pennant:[1,3]};
  const flags=[]; const poleMat=new THREE.MeshStandardMaterial({color:0x5a4632,roughness:0.8});
  const boatFlags=[]; if(W.rev.boat){ const bt=W.rev.boat, sc=bt.scale.x, v=new THREE.Vector3(0,1.2,-3.9).multiplyScalar(sc).applyAxisAngle(new THREE.Vector3(0,1,0),bt.rotation.y).add(bt.position);
    L.flags=(L.flags||[]).concat([{kind:'us13',pos:[v.x,v.y+6.6,v.z],h:6.6,w:3.4,dir:[Math.sin(bt.rotation.y),0,Math.cos(bt.rotation.y)],boat:true}]); }
  (L.flags||[]).forEach(f=>{ const cu=FLAG_UV[f.kind]||[0,0]; const w=f.w||3, h=w*0.52;
    const g=new THREE.PlaneGeometry(w,h,10,5); const uv=g.attributes.uv;
    for(let k=0;k<uv.count;k++){ const u=g.attributes.position.getX(k)/w+0.5, v=g.attributes.position.getY(k)/h+0.5; uv.setXY(k,cu[0]*0.5+0.004+u*0.492,1-(cu[1]+1)*0.25+0.004+v*0.242); }
    g.translate(w/2,0,0); const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:flagTex,side:THREE.DoubleSide,roughness:0.85}));
    const base=new THREE.Vector3(...f.pos); const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.11,f.h||6,6),poleMat); pole.position.set(base.x,base.y-(f.h||6)/2,base.z); G.add(pole);
    m.position.set(base.x,base.y-h/2-0.15,base.z); m.rotation.y=Math.atan2(f.dir[0],f.dir[2])-Math.PI/2; G.add(m);
    flags.push({m,g,w,h,x0:g.attributes.position.array.slice(),ph:Math.random()*6}); if(f.boat) boatFlags.push({m,pole,my:m.position.y,py:pole.position.y}); });
  // ---- ice floes drifting down the Delaware
  const ice=[]; if(L.delaware){ const path=L.delaware, n=low?40:110; const geo=new THREE.CylinderGeometry(1,1.1,0.35,7); const im=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({color:0xe6eef5,roughness:0.35,metalness:0.0}),n); im.receiveShadow=true; G.add(im);
    const segs=[]; let tot=0; for(let k=0;k<path.length-1;k++){ const a=path[k],b=path[k+1]; const l=Math.hypot(b[0]-a[0],b[1]-a[1]); segs.push({a,b,l,s:tot}); tot+=l; }
    for(let k=0;k<n;k++) ice.push({s:Math.random()*tot,off:(Math.random()*2-1)*(L.delawareHW||50),sz:1.2+Math.random()*3.4,sq:0.5+Math.random()*0.8,rot:Math.random()*6,sp:1.2+Math.random()*1.2});
    W.rev.ice={im,segs,tot,list:ice,y:L.delawareY||-1.3}; }
  // ---- batteries: cannon fire as scenery only
  const bats=(L.batteries||[]).map(b=>Object.assign({next:2+Math.random()*8,shots:[]},b)); W.rev.bats=bats; const balls=[];
  const ballGeo=new THREE.SphereGeometry(0.45,10,8), ballMat=new THREE.MeshStandardMaterial({color:0x1c1a18,roughness:0.45,metalness:0.6}); const hotMat=new THREE.MeshStandardMaterial({color:0x2a1408,emissive:0xff5a14,emissiveIntensity:2.2,roughness:0.5});
  const ballPool=[]; for(let k=0;k<(low?8:18);k++){ const m=new THREE.Mesh(ballGeo,ballMat); m.visible=false; G.add(m); const gl=glowSprite(0xff7a2a,4.2,0.95); gl.visible=false; m.add(gl); ballPool.push({m,gl,on:false}); }
  const fire=(b,salute)=>{ if(window.__revDebug) window.__revDebug.shots=(window.__revDebug.shots||0)+1; const tg=salute?null:b.targets[Math.floor(Math.random()*b.targets.length)]; const p=b.p; const dir=[Math.sin(b.r),0,Math.cos(b.r)];
    for(let k=0;k<(low?5:10);k++) smoke.emit(p[0]+dir[0]*1.5+rr(-0.4,0.4),p[1]+0.3,p[2]+dir[2]*1.5+rr(-0.4,0.4),dir[0]*rr(4,10)+rr(-1,1),rr(0.5,2),dir[2]*rr(4,10)+rr(-1,1),rr(3,6),rr(2,3),rr(7,12),0.88,0.86,0.82,0.75,0.8,0.25);
    flash.emit(p[0]+dir[0]*1.2,p[1]+0.2,p[2]+dir[2]*1.2,0,0,0,0.14,6,3,1,0.8,0.45,1,0,0);
    const cam=GAME.camera.position; const d=Math.hypot(p[0]-cam.x,p[2]-cam.z); const vol=salute?0.5:Math.max(0,1-d/650)*0.85; if(vol>0.03) GAME.audio.play('cannon',vol);
    if(tg){ const bp=ballPool.find(q=>!q.on); if(bp){ const dist=Math.hypot(tg[0]-p[0],tg[2]-p[2]); bp.on=true; bp.m.visible=true; bp.a=p; bp.b=tg; bp.T=Math.max(1.2,Math.min(3.2,dist/70)); bp.t=0; bp.apex=b.apex||20; bp.cross=b.cross!=null; bp.m.material=bp.cross?hotMat:ballMat; bp.m.scale.setScalar(bp.cross?1.3:1); bp.gl.visible=bp.cross; balls.push(bp); if(bp.cross){ const d2=Math.hypot(p[0]-cam.x,p[2]-cam.z); GAME.audio.play('whistle',Math.max(0.2,1-d2/260)); } } } };
  W.rev.fire=fire;
  // ---- ambience emitters
  const mist=L.mist||[], fires=L.fires||[], lanterns=L.lanterns||[], plumes=L.plumes||[];
  lanterns.forEach(l=>{ const s=glowSprite(0xffb454,l.s||2.2,0.75); s.position.set(l.p[0],l.p[1],l.p[2]); G.add(s); });
  // ---- dawn light shafts slanting through the cypress along the causeway (additive, fog-aware; not on low)
  if(!low&&R0.teleportEntry&&W.sunDir){ const sd=W.sunDir.clone().normalize(); const cv=document.createElement('canvas'); cv.width=32; cv.height=128; const g=cv.getContext('2d');
    const gr=g.createLinearGradient(0,0,0,128); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(0.35,'rgba(255,255,255,0.9)'); gr.addColorStop(0.8,'rgba(255,255,255,0.55)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,32,128);
    const hg=g.createLinearGradient(0,0,32,0); hg.addColorStop(0,'rgba(0,0,0,1)'); hg.addColorStop(0.5,'rgba(0,0,0,0)'); hg.addColorStop(1,'rgba(0,0,0,1)'); g.globalCompositeOperation='destination-out'; g.fillStyle=hg; g.fillRect(0,0,32,128);
    const tx=new THREE.CanvasTexture(cv); const sm=new THREE.MeshBasicMaterial({map:tx,color:0xffd49a,transparent:true,opacity:0.085,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:true});
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),sd); let seed=7; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
    for(let k=0;k<18;k++){ const i=(R0.start-10+Math.floor(rnd()*((R0.entry-R0.start)+10)))%P.N; const lat=(rnd()<0.5?-1:1)*(9+rnd()*32); const bx=P.x[i]+P.rx[i]*lat, bz=P.z[i]+P.rz[i]*lat, by=P.y[i]-0.4;
      const len=38+rnd()*20, wd=3+rnd()*4; for(const a of [0,Math.PI/2]){ const m=new THREE.Mesh(new THREE.PlaneGeometry(wd,len),sm); m.quaternion.copy(q); m.rotateY(a); m.position.set(bx+sd.x*len*0.45,by+sd.y*len*0.45,bz+sd.z*len*0.45); m.renderOrder=4; G.add(m); } } }
  // ---- soft vignette + warm grade over the whole course (CSS, costs nothing)
  { let vg=document.getElementById('rvVig'); if(!vg){ vg=document.createElement('div'); vg.id='rvVig'; const cv=GAME&&GAME.renderer&&GAME.renderer.domElement; if(cv&&cv.parentNode) cv.parentNode.insertBefore(vg,cv.nextSibling); else document.body.appendChild(vg); } vg.classList.add('on'); }
  // ---- chapter labels + atmosphere
  let lastCh=null, labelT=0; const fogC=new THREE.Color(), c2=new THREE.Color();
  const atmo=(i)=>{ const {cur,nxt,t}=revChapterAt(P,i); const a=REV_ATMO[cur.id]||REV_ATMO.yorktown, b=nxt?(REV_ATMO[nxt.id]||a):a; const L2=(x,y)=>x+(y-x)*t;
    fogC.setHex(a.fog).lerp(c2.setHex(b.fog),t); W.fog.color.copy(fogC); W.fog.near=L2(a.near,b.near)*Q.fogMul; W.fog.far=L2(a.far,b.far)*Q.fogMul;
    if(sky){ const u=sky.material.uniforms; u.top.value.setHex(a.top).lerp(c2.setHex(b.top),t); u.hor.value.setHex(a.hor).lerp(c2.setHex(b.hor),t); u.sunc.value.setHex(a.sun).lerp(c2.setHex(b.sun),t); if(u.clouds) u.clouds.value=L2(a.cl||0,b.cl||0); }
    W.sun.color.setHex(a.sun).lerp(c2.setHex(b.sun),t); W.sun.intensity=GFX.compat.li(L2(a.sunI,b.sunI));
    if(hemi){ hemi.color.setHex(a.hs).lerp(c2.setHex(b.hs),t); hemi.groundColor.setHex(a.hg).lerp(c2.setHex(b.hg),t); hemi.intensity=GFX.compat.li(L2(a.hi,b.hi)); }
    W.th.exposure=L2(a.exp,b.exp); waters.forEach(m=>{ m.uniforms.sky.value.copy(sky?sky.material.uniforms.hor.value:fogC); m.uniforms.sunCol.value.copy(W.sun.color); });
    return t<0.5?cur:nxt; };
  W.rev.atmo=atmo;
  const tmpM=new THREE.Matrix4(), tmpQ=new THREE.Quaternion(), tmpE=new THREE.Euler(), tmpS=new THREE.Vector3(), tmpP=new THREE.Vector3();
  let troopT=0, cheer=0, saluteQ=[]; W.rev.celebrate=()=>{ cheer=12; GAME.audio.play('cheer',0.8); const yb=bats.filter(b=>b.ch==='yorktown'); saluteQ=[]; for(let k=0;k<13;k++) saluteQ.push({t:0.6+k*0.55,b:yb[k%Math.max(1,yb.length)]}); };
  W.updaters.push((dt,t)=>{
    const R=GAME.race; const cam=GAME.camera.position; const pl=R&&R.player;
    marionStep(dt,t);
    const idx=pl?(R.state==='intro'?(R0.start||0):pl.pr.i):0; const ch=atmo(idx==null?0:idx);
    if(R&&ch&&ch.id!==lastCh&&(R.state==='race'||R.state==='countdown'||R.state==='intro')){ lastCh=ch.id; if(GAME.ui.chapter) GAME.ui.chapter(ch.label,ch.year); }
    waters.forEach(m=>m.uniforms.t.value=t); if(sky&&sky.material.uniforms.ct) sky.material.uniforms.ct.value=t; revT.value=t;
    portals.forEach(p=>{ p.mat.uniforms.t.value=t; const d=Math.hypot(cam.x-p.pp.center[0],cam.z-p.pp.center[2]); p.mat.uniforms.flash.value=Math.max(0,1-d/40)*0.6;
      if(d<260 && Math.random()<dt*(low?10:26)){ const a=Math.random()*6.283, rr_=0.45+Math.random()*0.5, w=p.pp.w/2, h=p.pp.h/2, r=[p.pp.dir[2],0,-p.pp.dir[0]];
        motes.emit(p.pp.center[0]+r[0]*Math.cos(a)*w*rr_,p.pp.center[1]+Math.sin(a)*h*rr_,p.pp.center[2]+r[2]*Math.cos(a)*w*rr_,rr(-0.6,0.6),rr(-0.3,0.8),rr(-0.6,0.6),rr(1.2,2.4),0.7,0.1,0.8,0.9,1,0.9,0.4,0); } });
    // boats and ships
    bob.forEach(b=>{ if(b.o===W.rev.boat){ const dy=Math.sin(t*0.9+b.ph)*0.12*b.a; boatFlags.forEach(q=>{ q.m.position.y=q.my+dy; q.pole.position.y=q.py+dy; }); } b.o.position.y=b.y+Math.sin(t*0.9+b.ph)*0.12*b.a; b.o.rotation.z=Math.sin(t*0.7+b.ph)*0.035*b.a; b.o.rotation.x=Math.sin(t*0.55+b.ph*1.3)*0.02*b.a; });
    // ice floes
    if(W.rev.ice){ const I=W.rev.ice; for(let k=0;k<I.list.length;k++){ const f=I.list[k]; f.s=(f.s+f.sp*dt)%I.tot; let sg=I.segs[0]; for(const q of I.segs){ if(f.s>=q.s) sg=q; }
        const u=(f.s-sg.s)/sg.l, x=sg.a[0]+(sg.b[0]-sg.a[0])*u, z=sg.a[1]+(sg.b[1]-sg.a[1])*u; const nx=-(sg.b[1]-sg.a[1])/sg.l, nz=(sg.b[0]-sg.a[0])/sg.l;
        let fx=x+nx*f.off, fz=z+nz*f.off; const bt=W.rev.boat; if(bt){ const dx=fx-bt.position.x, dz=fz-bt.position.z, dd=Math.hypot(dx,dz)+1e-3, br=bt.scale.x*6.6+f.sz; if(dd<br){ fx=bt.position.x+dx/dd*br; fz=bt.position.z+dz/dd*br; } }
        dummy.position.set(fx,I.y+0.06+Math.sin(t+k)*0.03,fz); dummy.rotation.set(0,f.rot+t*0.03*(k%3-1),0); dummy.scale.set(f.sz,1,f.sz*f.sq); dummy.updateMatrix(); I.im.setMatrixAt(k,dummy.matrix); } I.im.instanceMatrix.needsUpdate=true; }
    // flags wave
    flags.forEach(f=>{ const d=Math.hypot(cam.x-f.m.position.x,cam.z-f.m.position.z); if(d>320) return; const pa=f.g.attributes.position; const a=pa.array;
      for(let k=0;k<pa.count;k++){ const x=f.x0[k*3], y=f.x0[k*3+1]; const u=x/f.w; a[k*3+2]=Math.sin(t*6+f.ph-u*5.5+y*0.4)*0.22*u+Math.sin(t*9.5+f.ph-u*9)*0.06*u; a[k*3+1]=y-u*u*0.12*f.h; }
      pa.needsUpdate=true; f.g.computeVertexNormals(); });
    // troops (every frame for the near ones)
    troopT-=dt; const near=[], mid=[], far=[]; const lim0=low?20:36, lim1=low?80:150, lim2=low?360:640; GAME.camera.getWorldDirection(tmpP); const cfx=tmpP.x, cfz=tmpP.z, cfl=Math.hypot(cfx,cfz)||1;
    for(const q of allTroops){ const dx=q.p[0]-cam.x, dz=q.p[2]-cam.z; if((dx*cfx+dz*cfz)/cfl<-14) continue; const d2=dx*dx+dz*dz; if(d2<lim0*lim0) near.push(q); else if(d2<lim1*lim1) mid.push(q); else if(d2<lim2*lim2) far.push(q); }
    Object.values(volleys).forEach(v=>{ v.next-=dt; if(v.next<=0){ v.next=7+Math.random()*9; v.fireT=t; const c=v.list[0]; const d=Math.hypot(c.p[0]-cam.x,c.p[2]-cam.z);
      if(d<700){ v.list.forEach(q=>{ const dx=Math.sin(q.r), dz=Math.cos(q.r); const mx=q.p[0]+dx*0.9, my=q.p[1]+1.5, mz=q.p[2]+dz*0.9; flash.emit(mx,my,mz,0,0,0,0.1,1.4,0.6,1,0.85,0.5,1,0,0); if(Math.random()<(low?0.35:0.8)) smoke.emit(mx+dx*0.5,my,mz+dz*0.5,dx*rr(2,4),rr(0.2,0.8),dz*rr(2,4),rr(2.5,4.5),0.8,rr(3,5),0.9,0.88,0.84,0.55,0.9,0.15); });
        const vol=Math.max(0,1-d/500)*0.45; if(vol>0.03) GAME.audio.play('shot',vol); } } });
    const put=(q,im,k)=>{ let y=q.p[1], rx=0, rz=0, sy=1; const ph=q.ph||0;
      if(cheer>0&&(q.a==='crowd'||q.a==='idle'||q.a==='fire')){ y+=Math.abs(Math.sin(t*7+ph*3))*0.35; rz=Math.sin(t*5+ph)*0.08; }
      else if(q.a==='crowd'){ y+=Math.abs(Math.sin(t*2.2+ph))*0.05; rz=Math.sin(t*1.3+ph)*0.03; }
      else if(q.a==='drill'){ y+=Math.abs(Math.sin(t*4.2+ph))*0.06; rx=Math.sin(t*4.2+ph)*0.03; }
      else if(q.a==='fire'){ const v=volleys[q.g||'v']; const e=v&&v.fireT!=null?t-v.fireT:9; if(e<0.5){ rx=-0.12*Math.exp(-e*6); } sy=1+Math.sin(t*1.6+ph)*0.006; }
      else { sy=1+Math.sin(t*1.6+ph)*0.008; rz=Math.sin(t*0.5+ph)*0.015; }
      tmpE.set(rx,q.r,rz,'YXZ'); tmpQ.setFromEuler(tmpE); tmpP.set(q.p[0],y,q.p[2]); tmpS.set(1,sy,1); tmpM.compose(tmpP,tmpQ,tmpS); im.setMatrixAt(im.count++,tmpM); };
    Object.values(tm).forEach(o=>{ o.i0.count=0; o.i1.count=0; o.i2.count=0; });
    near.forEach(q=>{ const o=tm[q.t]; if(o) put(q,o.i0); }); mid.forEach(q=>{ const o=tm[q.t]; if(o) put(q,o.i1); }); far.forEach(q=>{ const o=tm[q.t]; if(o) put(q,o.i2); });
    Object.values(tm).forEach(o=>{ o.i0.instanceMatrix.needsUpdate=true; o.i1.instanceMatrix.needsUpdate=true; o.i2.instanceMatrix.needsUpdate=true; });
    if(cheer>0) cheer-=dt;
    // artillery
    bats.forEach(b=>{ const d=Math.hypot(b.p[0]-cam.x,b.p[2]-cam.z); if(d>(low?600:900)) return;
      if(b.cross!=null){   // crossfire: fire so the ball crosses the course ~55 m in front of the player (it never comes down near the road)
        if(!pl||R.state!=='race'||pl.cp===0||b.shotLap===pl.lap) return; const ahead=((b.cross-pl.pr.i+P.N)%P.N)*P.spacing; const v=Math.max(20,pl.speed||0);
        const tg=b.targets[0], T=Math.max(1.2,Math.min(3.2,Math.hypot(tg[0]-b.p[0],tg[2]-b.p[2])/70)); const want=v*T*0.5+55;
        if(ahead<want+30&&ahead>want-25){ b.shotLap=pl.lap; fire(b,false); } return; }
      b.next-=dt; if(b.next<=0){ b.next=(b.every?b.every[0]+Math.random()*(b.every[1]-b.every[0]):8+Math.random()*8); fire(b,false); } });
    for(let k=saluteQ.length-1;k>=0;k--){ const s=saluteQ[k]; s.t-=dt; if(s.t<=0){ if(s.b) fire(s.b,true); saluteQ.splice(k,1); } }
    for(let k=balls.length-1;k>=0;k--){ const b=balls[k]; b.t+=dt; const u=Math.min(1,b.t/b.T); const x=b.a[0]+(b.b[0]-b.a[0])*u, z=b.a[2]+(b.b[2]-b.a[2])*u, y=b.a[1]+(b.b[1]-b.a[1])*u+4*b.apex*u*(1-u);
      b.m.position.set(x,y,z); if(b.cross){ flash.emit(x+rr(-0.3,0.3),y+rr(-0.3,0.3),z+rr(-0.3,0.3),rr(-1,1),rr(-1,1),rr(-1,1),0.22,1.3,0.5,1,0.55,0.2,1,0,0); }
      if(b.cross||Math.random()<0.5) smoke.emit(x,y,z,0,0.2,0,b.cross?1.4:0.9,b.cross?1.1:0.6,b.cross?2.4:1.6,0.82,0.8,0.76,b.cross?0.5:0.35,1,0);
      if(window.__revDebug){ const D=window.__revDebug; const inf=W.hash(x,z,2); if(inf.i>=0&&inf.d<inf.edge+6){ D.over=(D.over||0)+1; D.minClear=Math.min(D.minClear==null?1e9:D.minClear,y-inf.y); } }
      if(u>=1){ b.on=false; b.m.visible=false; balls.splice(k,1);
        for(let q=0;q<(low?6:14)*(b.cross?2:1);q++) smoke.emit(x+rr(-1,1),y+0.3,z+rr(-1,1),rr(-3,3),rr(4,10)*(b.cross?1.4:1),rr(-3,3),rr(1.5,3),rr(1.5,2.5),rr(4,7),0.55,0.45,0.34,0.8,1.6,-3);
        if(b.cross&&R){ const dd=Math.hypot(x-cam.x,z-cam.z); if(dd<90&&R.shake) R.shake(0.22*(1-dd/90)); }
        flash.emit(x,y+0.6,z,0,0,0,0.12,5,2,1,0.75,0.4,1,0,0);
        if(window.__revDebug){ const D=window.__revDebug; D.impacts=(D.impacts||0)+1; const inf=W.hash(x,z,4); const dd=inf.i<0?999:inf.d-inf.edge; D.minImpactGap=Math.min(D.minImpactGap==null?1e9:D.minImpactGap,dd); }
        const d=Math.hypot(x-cam.x,z-cam.z); const vol=Math.max(0,1-d/500)*0.7; if(vol>0.03) GAME.audio.play('thud',vol); } }
    // ambient: swamp mist + fireflies, battlefield haze, chimney/fire smoke, snow and leaves near the camera
    if(Math.random()<dt*(low?3:8)) mist.forEach(m=>{ const d=Math.hypot(m.p[0]-cam.x,m.p[2]-cam.z); if(d<260&&Math.random()<0.25) smoke.emit(m.p[0]+rr(-m.r,m.r),m.p[1]+rr(0,1.2),m.p[2]+rr(-m.r,m.r),rr(-0.3,0.3),rr(0,0.1),rr(-0.3,0.3),rr(8,14),rr(6,9),rr(10,16),m.c?m.c[0]:0.9,m.c?m.c[1]:0.9,m.c?m.c[2]:0.88,m.a||0.22,0.2,0); });
    fires.forEach(f=>{ const d=Math.hypot(f.p[0]-cam.x,f.p[2]-cam.z); if(d>400) return; if(Math.random()<dt*(f.big?6:2.5)) smoke.emit(f.p[0]+rr(-0.5,0.5),f.p[1]+0.6,f.p[2]+rr(-0.5,0.5),rr(-0.3,0.3)+(f.wind||0),rr(1.5,3),rr(-0.3,0.3),rr(5,9),f.big?4:1.2,f.big?18:6,0.36,0.34,0.32,f.big?0.55:0.4,0.3,0.4);
      if(d<120&&Math.random()<dt*5) flash.emit(f.p[0]+rr(-0.4,0.4),f.p[1]+0.3,f.p[2]+rr(-0.4,0.4),0,rr(1,2),0,0.35,0.9,0.2,1,0.55,0.2,0.9,0,0); });
    plumes.forEach(f=>{ const d=Math.hypot(f.p[0]-cam.x,f.p[2]-cam.z); if(d>1500) return; if(f.chimney){ if(Math.random()<dt*2) smoke.emit(f.p[0]+rr(-0.5,0.5),f.p[1],f.p[2]+rr(-0.5,0.5),rr(0.3,0.8),rr(1,2),rr(-0.3,0.3),rr(6,9),1.5,7,0.78,0.78,0.8,0.28,0.2,0.2); return; } if(Math.random()<dt*3) smoke.emit(f.p[0]+rr(-4,4),f.p[1],f.p[2]+rr(-4,4),rr(0.5,1.5),rr(3,5),rr(-0.5,0.5),rr(14,22),10,40,0.42,0.4,0.38,0.38,0.1,0.3); });
    if(ch&&ch.id==='swamp'&&Math.random()<dt*14){ const a=Math.random()*6.28, r=rr(8,40); motes.emit(cam.x+Math.cos(a)*r,cam.y+rr(-1.5,2),cam.z+Math.sin(a)*r,rr(-0.3,0.3),rr(-0.1,0.2),rr(-0.3,0.3),rr(2,4),0.25,0.18,1,0.9,0.45,0.9,0.3,0); }
    const snowing=ch&&(ch.id==='delaware'||ch.id==='trenton'), leaves=ch&&ch.id==='saratoga';
    if(snowing){ const n=Math.floor(dt*(low?90:260)+Math.random()); for(let k=0;k<n;k++){ flakes.emit(cam.x+rr(-40,40),cam.y+rr(6,18),cam.z+rr(-40,40),rr(-1,1),-rr(1.5,2.5),rr(-1,1),rr(4,6),0.16,0.16,1,1,1,0.9,0.1,0); } }
    if(leaves && Math.random()<dt*(low?8:22)){ const c=[[0.85,0.35,0.12],[0.95,0.6,0.15],[0.8,0.2,0.1],[0.95,0.8,0.25]][Math.floor(Math.random()*4)]; flakes.emit(cam.x+rr(-35,35),cam.y+rr(4,12),cam.z+rr(-35,35),rr(-1.5,1.5),-rr(0.6,1.2),rr(-1.5,1.5),rr(5,8),0.28,0.28,c[0],c[1],c[2],1,0.3,0); }
    smoke.update(dt); flash.update(dt); motes.update(dt); flakes.update(dt);
  });
}

function buildWorld(def,P,Q){
  { const vg=document.getElementById('rvVig'); if(vg) vg.classList.remove('on'); }
  seed(def.id.length*1337+7);
  const th=THEMES[def.sky||def.theme]; const W={group:new THREE.Group(),updaters:[],obstacles:[],items:[],pads:[],slicks:[],th,def,P};
  const G=W.group; const hash=buildRoadHash(P); W.hash=hash;
  const nat=naturalHeightFn(def,P);
  const hashNG=def.flatGaps?buildRoadHash(P,true):null;   // a jump that flies over another road: the ground under the flight is that road's, not open country
  const heightAt=th.space?(()=>-400):(x,z)=>{ const b=nat(x,z); let inf=hash(x,z); if(inf.gap&&hashNG){ inf=hashNG(x,z); if(inf.i<0) return b; } if(inf.i<0||inf.gap) return b; const near=inf.edge+7; const flat=inf.y-0.35; if(inf.d<near) return flat; return lerp(flat,b,smooth01((inf.d-near)/40)); };
  W.heightAt=heightAt;
  const clearOfRoad=(x,z,m)=>{ const inf=hash(x,z,4); return inf.i<0||inf.d>inf.edge+m; };
  // ---------- lights / sky / fog ----------
  GFX.lighting.createWorldLights(W,th,Q);                 // sun + hemisphere + shadow box (js/gfx/lighting.js)
  G.add(th.space?spaceSky(W):GFX.environment.makeSky(th,2600));   // sky dome (js/gfx/environment.js); the space track has its own melting galaxy
  W.fog=GFX.environment.makeFog(th,Q);
  // ---------- terrain ----------
  let minx=1e9,maxx=-1e9,minz=1e9,maxz=-1e9; for(let i=0;i<P.N;i++){minx=Math.min(minx,P.x[i]);maxx=Math.max(maxx,P.x[i]);minz=Math.min(minz,P.z[i]);maxz=Math.max(maxz,P.z[i]);}
  W.bounds={minx,maxx,minz,maxz};
  const EXT=def.theme==='city'?650:750, cell=Q.terrainCell;
  const tw=maxx-minx+EXT*2, td=maxz-minz+EXT*2; const nx=Math.ceil(tw/cell), nz=Math.ceil(td/cell);
  const tg=new THREE.PlaneGeometry(tw,td,nx,nz); tg.rotateX(-Math.PI/2); tg.translate((minx+maxx)/2,0,(minz+maxz)/2);
  const tp=tg.attributes.position; const cols=new Float32Array(tp.count*3); const dists=new Float32Array(tp.count);
  for(let v=0;v<tp.count;v++){ const x=tp.getX(v),z=tp.getZ(v); tp.setY(v,heightAt(x,z)); const inf=hash(x,z); dists[v]=inf.i<0?999:inf.d-inf.edge; }
  tg.computeVertexNormals(); const tn=tg.attributes.normal;
  for(let v=0;v<tp.count;v++){ const x=tp.getX(v),z=tp.getZ(v),y=tp.getY(v); const slope=1-tn.getY(v); const n=fbm(x*0.03,z*0.03), n2=vnoise(x*0.2,z*0.2); let c;
    const dd=dists[v];
    if(def.theme==='city'){ if(dd<9) c=[0.62,0.6,0.56]; else if(y>6) c=lerp3([0.62,0.55,0.36],[0.38,0.44,0.26],n); else c=n>0.52?[0.4,0.47,0.25]:[0.5,0.48,0.44]; c=lerp3(c,[0.55,0.5,0.4],slope*2); }
    else if(def.theme==='desert'){ c=lerp3([0.86,0.63,0.42],[0.78,0.52,0.34],n); if(y>5){ const band=0.5+0.5*Math.sin(y*1.3+n*3); c=lerp3([0.72,0.36,0.2],[0.84,0.52,0.32],band); } if(slope>0.25) c=lerp3(c,[0.6,0.3,0.18],clamp((slope-0.25)*2,0,1)); }
    else if(def.theme==='country'){ c=lerp3([0.34,0.52,0.2],[0.6,0.58,0.28],smooth01((n-0.4)*2.5)); if(y<-3) c=lerp3([0.42,0.3,0.18],c,smooth01((y+6)/3)); if(slope>0.35) c=lerp3(c,[0.55,0.32,0.18],clamp((slope-0.35)*2,0,1)); }
    else if(def.theme==='coast'){ if(y<-1.5) c=[0.82,0.74,0.56]; else c=lerp3([0.72,0.62,0.34],[0.36,0.46,0.22],smooth01((n-0.35)*3)); if(slope>0.3) c=lerp3(c,[0.47,0.42,0.37],clamp((slope-0.3)*2.5,0,1)); if(y<-8) c=[0.55,0.5,0.42]; }
    else if(def.theme==='rally'){ c=lerp3([0.1,0.2,0.07],[0.2,0.16,0.09],smooth01((n-0.38)*2.6)); if(dd<7) c=lerp3([0.3,0.2,0.12],c,smooth01(dd/7)); if(slope>0.3) c=lerp3(c,[0.4,0.34,0.27],clamp((slope-0.3)*2.5,0,1)); }
    else if(def.theme==='oval'){ const hi=hash(x,z,7); const lat=hi.i<0?1:((x-P.x[hi.i])*P.rx[hi.i]+(z-P.z[hi.i])*P.rz[hi.i]);
      if(lat<0){ c=(Math.floor((x+z)/9)&1)?[0.2,0.5,0.17]:[0.25,0.57,0.2]; if(dd<4) c=[0.34,0.34,0.36]; }            // infield: mown stripes, asphalt apron by the wall
      else c=dd<34?[0.4,0.4,0.42]:lerp3([0.5,0.47,0.38],[0.33,0.45,0.24],smooth01((n-0.4)*3)); }                    // outside: concourse, then lots and grass
    else { c=lerp3([0.1,0.1,0.13],[0.16,0.15,0.18],n); if(dd<10) c=[0.14,0.14,0.17]; if(y<-3) c=[0.08,0.08,0.1]; }
    const k=0.9+0.2*n2; cols[v*3]=c[0]*k; cols[v*3+1]=c[1]*k; cols[v*3+2]=c[2]*k; }
  tg.setAttribute('color',new THREE.BufferAttribute(cols,3));
  const detail=canvasTex(256,256,(g,w,h)=>{noiseFill(g,w,h,'#bfbfbf',70);},{repeat:true}); detail.repeat.set(tw/12,td/12);
  const terrain=new THREE.Mesh(tg,new THREE.MeshStandardMaterial({vertexColors:true,map:detail,roughness:0.97})); terrain.receiveShadow=true; G.add(terrain); W.terrainMesh=terrain; if(th.space) terrain.visible=false;
  // ---------- hand-built environment (Blender) ----------
  const ENV=CAR_GLTF['env_'+def.id]?addEnv(W,def,CAR_GLTF['env_'+def.id],Q):null; W.env=ENV;
  if(ENV&&ENV.hasTerrain){ W.terrainMesh.visible=false; }
  if(ENV&&ENV.fogFar){ W.fog.near=ENV.fogNear*Q.fogMul; W.fog.far=ENV.fogFar*Q.fogMul; }
  if(ENV&&ENV.revolution) revolutionWorld(W,def,P,Q,ENV);
  // ---------- road surfaces ----------
  const ptAt=(i,lat,dy)=>[P.x[i]+P.rx[i]*lat,P.y[i]+dy,P.z[i]+P.rz[i]*lat];
  function ribbon(include,latA,latB,dyA,dyB,uA,uB,vs,normalUp=true){
    const pos=[],uv=[];
    for(let i=0;i<P.N;i++){ const j=(i+1)%P.N; if(!include(i,j)) continue;
      const a0=ptAt(i,latA(i),dyA), b0=ptAt(i,latB(i),dyB), a1=ptAt(j,latA(j),dyA), b1=ptAt(j,latB(j),dyB);
      const v0=i*P.spacing/vs, v1=(i+1)*P.spacing/vs;
      pos.push(...a0,...b0,...a1,...b0,...b1,...a1); uv.push(uA,v0,uB,v0,uA,v1,uB,v0,uB,v1,uA,v1); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    g.computeVertexNormals(); return g;
  }
  const notGap=(i,j)=>!P.gap[i]&&!P.gap[j]&&!P.hidden[i]&&!P.hidden[j];
  const roadMat=new THREE.MeshStandardMaterial({map:roadTexture(th),roughness:th.night?0.28:0.85,metalness:th.night?0.35:0.0});
  const road=new THREE.Mesh(ribbon(notGap,i=>-P.w[i]/2,i=>P.w[i]/2,0,0,0,1,26),roadMat); road.receiveShadow=true; if(!ENV) G.add(road); W.roadMat=roadMat;
  // curbs: corner curbs vs edge strip
  const isCorner=i=>Math.abs(P.curv[i])>1/110;
  const curbMat=new THREE.MeshStandardMaterial({map:stripTex(th.curbA,th.curbB),roughness:0.6,emissive:th.night?0xff2e97:0,emissiveIntensity:th.night?0.25:0});
  const edgeMat=new THREE.MeshStandardMaterial({color:th.edge,roughness:0.8});
  const shMat=new THREE.MeshStandardMaterial({map:shoulderTexture(th.shoulder),roughness:th.night?0.4:0.95,metalness:th.night?0.2:0});
  if(!ENV) [[-1],[1]].forEach(([sd])=>{
    const la=sd<0?(i=>-P.w[i]/2-0.9):(i=>P.w[i]/2), lb=sd<0?(i=>-P.w[i]/2):(i=>P.w[i]/2+0.9);
    const c1=new THREE.Mesh(ribbon((i,j)=>notGap(i,j)&&isCorner(i),la,lb,0.04,0.04,0,1,2),curbMat); c1.receiveShadow=true; G.add(c1);
    const c2=new THREE.Mesh(ribbon((i,j)=>notGap(i,j)&&!isCorner(i),la,lb,0.02,0.02,0,1,2),edgeMat); c2.receiveShadow=true; G.add(c2);
    const sa=sd<0?(i=>-P.wl[i]-0.3):(i=>P.w[i]/2+0.9), sb=sd<0?(i=>-P.w[i]/2-0.9):(i=>P.wr[i]+0.3);
    const sh=new THREE.Mesh(ribbon(notGap,sa,sb,0.01,0.01,0,1,4),shMat); sh.receiveShadow=true; sh.material.map.repeat.set(3,1); G.add(sh);
  });
  // medians
  (ENV?[]:(def.medians||[])).forEach(m=>{
    const mg=ribbon((i,j)=>P.median[i]>0.3&&P.median[j]>0.3,i=>-P.median[i],i=>P.median[i],0.35,0.35,0,1,4);
    const mm=new THREE.Mesh(mg,new THREE.MeshStandardMaterial({color:def.theme==='night'?0x222a2a:0x6f8f3a,roughness:0.9})); G.add(mm);
    const side=ribbon((i,j)=>P.median[i]>0.3&&P.median[j]>0.3,i=>-P.median[i],i=>-P.median[i],-0.2,0.38,0,1,2);
    const side2=ribbon((i,j)=>P.median[i]>0.3&&P.median[j]>0.3,i=>P.median[i],i=>P.median[i],0.38,-0.2,0,1,2);
    const cm=new THREE.MeshStandardMaterial({color:0xd8d4cc,side:THREE.DoubleSide}); G.add(new THREE.Mesh(side,cm)); G.add(new THREE.Mesh(side2,cm));
    W.medianList=W.medianList||[]; W.medianList.push(m);
  });
  // ---------- walls ----------
  const wallMat=new THREE.MeshStandardMaterial({map:wallTexture(th.wall),roughness:th.wall==='guardrail'?0.35:0.8,metalness:th.wall==='guardrail'?0.6:0.05,side:THREE.DoubleSide});
  const railLike=th.wall==='guardrail'||th.wall==='wood'; const H=th.wallH, T=railLike?0.12:0.45;
  const wallInc=(i,j)=>notGap(i,j);
  if(!ENV) [-1,1].forEach(sd=>{
    const L=i=>sd<0?-P.wl[i]:P.wr[i], L2=i=>sd<0?-P.wl[i]-T:P.wr[i]+T;
    const bottom=railLike?0.3:-0.5;
    const gIn=ribbon(wallInc,L,L,bottom,H,0,1,4); const gTop=ribbon(wallInc,sd<0?L2:L,sd<0?L:L2,H,H,0,0.1,4); const gOut=ribbon(wallInc,L2,L2,H,-0.6,0,1,4);
    fixWallUV(gIn); fixWallUV(gOut);
    const wm=new THREE.Mesh(mergeGeos([gIn,gTop,gOut]),wallMat); wm.castShadow=true; wm.receiveShadow=true; G.add(wm);
    if(th.wall==='neon'){ const nm=new THREE.MeshBasicMaterial({color:sd<0?0xff2e97:0x22e4ff});
      const tube=ribbon(wallInc,i=>L(i)-sd*0.05,i=>L(i)+sd*0.05*0,H+0.02,H+0.02,0,1,4); const tube2=ribbon(wallInc,L,L,H-0.18,H+0.02,0,1,4);
      { const tm=new THREE.MeshBasicMaterial({color:sd<0?0xff2e97:0x22e4ff,side:THREE.DoubleSide}); G.add(new THREE.Mesh(mergeGeos([tube,tube2]),tm)); (W.neonMats=W.neonMats||[]).push({m:tm,sd}); }
      const glow=ribbon(wallInc,i=>L(i)-sd*1.6,L,0.03,0.03,0,1,8); const gm=new THREE.MeshBasicMaterial({map:glowStripTex(),color:sd<0?0xff2e97:0x22e4ff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0.55}); (W.neonMats=W.neonMats||[]).push({m:gm,sd});
      if(sd>0){ const gg=ribbon(wallInc,i=>L(i)-1.6,L,0.03,0.03,0,1,8); G.add(new THREE.Mesh(gg,gm)); } else { const gg=ribbon(wallInc,L,i=>L(i)+1.6,0.03,0.03,1,0,8); G.add(new THREE.Mesh(gg,gm)); } }
    if(railLike){ // posts
      const pts=[]; for(let i=0;i<P.N;i+=2){ if(P.gap[i]||P.hidden[i]) continue; const p=ptAt(i,L(i)+sd*0.15,0); pts.push({x:p[0],y:p[1]-0.4,z:p[2],ry:0,s:[0.12,1.2,0.12]}); }
      G.add(instanced(new THREE.BoxGeometry(1,1,1).translate(0,0.5,0),new THREE.MeshStandardMaterial(th.wall==='wood'?{color:0x5a3a20,roughness:0.9}:{color:0x7a7f84,metalness:0.6,roughness:0.4}),pts,false)); }
  });
  function fixWallUV(g){ const uv=g.attributes.uv; for(let k=0;k<uv.count;k++){ const u=uv.getX(k); uv.setXY(k,uv.getY(k),u); } }
  // ---------- start/finish ----------
  const s0=P.route?P.route.start:0;
  const chk=canvasTex(256,64,(g)=>{for(let x=0;x<16;x++)for(let y=0;y<4;y++){g.fillStyle=(x+y)%2?'#111':'#f4f4f4';g.fillRect(x*16,y*16,16,16);}});
  const fl=new THREE.Mesh(ribbon((i,j)=>i===0,i=>-P.w[i]/2,i=>P.w[i]/2,0.03,0.03,0,1,P.spacing),new THREE.MeshStandardMaterial({map:chk,roughness:0.6})); if(!ENV) G.add(fl);
  // grid slots
  const drag=!!(P.route&&P.route.teleportEntry);   // drag strip: two rows of four abreast behind the start line; slot 0 = pole, inside lane
  W.grid=[]; for(let k=0;k<8;k++){ let i,lat; if(drag){ const row=Math.floor(k/4), col=k%4; i=(s0-Math.round((7+row*10)/P.spacing)+P.N)%P.N; lat=(col-1.5)*P.w[i]*0.19; }
    else { const row=Math.floor(k/2), col=k%2; const dist=10+row*8.5+(col?4:0); i=(s0+P.N-Math.round(dist/P.spacing))%P.N; lat=(col?1:-1)*P.w[i]*0.22; } W.grid.push({i,lat}); 
    const p=ptAt(i,lat,0.035); const m=new THREE.Mesh(new THREE.PlaneGeometry(2.6,0.25),new THREE.MeshBasicMaterial({color:0xf0f0f0})); m.position.set(p[0],p[1],p[2]+0); m.rotation.set(-Math.PI/2,0,Math.atan2(P.tx[i],P.tz[i])); m.position.x+=P.tx[i]*2.6; m.position.z+=P.tz[i]*2.6; if(!ENV) G.add(m); }
  buildGantry(W,P,s0); if(ENV&&ENV.lamps) envLamps(W,ENV); else upgradeGantry(W,P,s0);
  // ---------- boost pads ----------
  const padTex=canvasTex(128,256,(g,w,h)=>{ g.fillStyle='rgba(10,20,40,0.6)'; g.fillRect(0,0,w,h); g.lineWidth=16; g.lineJoin='miter';
    for(let k=0;k<3;k++){ const y=h-40-k*80; g.strokeStyle=k%2?'#ff2e97':'#22e4ff'; g.beginPath(); g.moveTo(14,y+34); g.lineTo(w/2,y); g.lineTo(w-14,y+34); g.stroke(); } },{repeat:true});
  const padMat=new THREE.MeshBasicMaterial({map:padTex,transparent:true,depthWrite:false});
  (def.boosts||[]).forEach(b=>{ const i=P.idxAt(b.cp,b.f); const p=ptAt(i,b.lat,0.06); const m=new THREE.Mesh(new THREE.PlaneGeometry(4.2,7),padMat); m.rotation.order='YXZ'; m.rotation.set(-Math.PI/2,Math.atan2(P.tx[i],P.tz[i])+Math.PI,0);
    m.position.set(p[0],p[1],p[2]); G.add(m); W.pads.push({i,lat:b.lat,along:i*P.spacing,half:3.5,hw:2.2}); });
  W.updaters.push((dt,t)=>{ padTex.offset.y=(t*1.6)%1; });
  // ---------- item prisms ----------
  const prismGeo=new THREE.OctahedronGeometry(0.85,0);
  const prismMat=new THREE.MeshStandardMaterial({color:0xff4fb0,emissive:0x9b1cff,emissiveIntensity:0.6,metalness:0.3,roughness:0.15,transparent:true,opacity:0.88});
  const coreMat=new THREE.MeshBasicMaterial({color:0x7ff6ff});
  (def.items||[]).forEach(it=>{ const i=P.idxAt(it.cp,it.f); const n=Math.max(3,Math.floor(P.w[i]/4)); for(let k=0;k<n;k++){ const lat=(k-(n-1)/2)*(P.w[i]-3)/(n-1); const p=ptAt(i,lat,1.2);
    const grp=new THREE.Group(); const m=new THREE.Mesh(prismGeo,prismMat); m.castShadow=true; grp.add(m); const c=new THREE.Mesh(new THREE.IcosahedronGeometry(0.28,0),coreMat); grp.add(c); grp.position.set(p[0],p[1],p[2]); G.add(grp);
    W.items.push({x:p[0],y:p[1],z:p[2],i,lat,active:true,t:0,grp,spin:k}); } });
  // ---------- mud patch + mud-tire station ----------
  W.mudBoxes=[];
  if(def.mud){ const inc=(i,j)=>P.mud[i]&&P.mud[j];
    const mt=canvasTex(256,256,(g,w2,h2)=>{ noiseFill(g,w2,h2,'#4a3020',26); for(let k=0;k<40;k++){ g.fillStyle=`rgba(${Math.random()<0.5?'30,18,10':'95,65,40'},0.5)`; g.beginPath(); g.ellipse(Math.random()*w2,Math.random()*h2,8+Math.random()*30,4+Math.random()*14,Math.random()*3,0,TAU); g.fill(); }
      g.strokeStyle='rgba(20,12,6,0.6)'; g.lineWidth=6; [60,100,156,196].forEach(x=>{ g.beginPath(); g.moveTo(x,0); for(let y=0;y<=h2;y+=16) g.lineTo(x+Math.sin(y*0.05)*4,y); g.stroke(); });
      for(let k=0;k<10;k++){ g.fillStyle='rgba(120,100,80,0.45)'; g.beginPath(); g.ellipse(Math.random()*w2,Math.random()*h2,10+Math.random()*20,5+Math.random()*8,0,0,TAU); g.fill(); } },{repeat:true});
    const mm=new THREE.MeshStandardMaterial({map:mt,roughness:0.35,metalness:0.1,polygonOffset:true,polygonOffsetFactor:-4});
    const mg=ribbon(inc,i=>-P.w[i]/2-3,i=>P.w[i]/2+3,0.06,0.06,0,1,5); const mesh=new THREE.Mesh(mg,mm); mesh.receiveShadow=true; G.add(mesh);
    // splatter heaps at the edges
    const heaps=[]; for(let i=0;i<P.N;i+=3){ if(!P.mud[i]) continue; for(const sd of [-1,1]){ const p=ptAt(i,sd*(P.w[i]/2+rr(2.5,4.5)),0); heaps.push({x:p[0],y:p[1]-0.2,z:p[2],ry:rnd()*TAU,s:[rr(0.8,1.8),rr(0.25,0.5),rr(0.8,1.8)],c:0x4a3020}); } }
    G.add(instanced(new THREE.SphereGeometry(1,8,5),new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.5}),heaps,false,true));
    // warning sign
    const si=(P.mudStart-40+P.N)%P.N; const sp=ptAt(si,-(P.wl[si]+1.2),0); const sg=new THREE.Group(); sg.position.set(sp[0],sp[1],sp[2]); sg.rotation.y=Math.atan2(-P.tx[si],-P.tz[si]); G.add(sg);
    const post=new THREE.Mesh(new THREE.BoxGeometry(0.2,3.4,0.2),new THREE.MeshStandardMaterial({color:0x5a3a20})); post.position.y=1.7; sg.add(post);
    const pan=new THREE.Mesh(new THREE.PlaneGeometry(4.2,2.1),new THREE.MeshStandardMaterial({map:textPanelTex([{text:'MUD AHEAD',font:'bold 92px "Racing Sans One", Impact',color:'#1a1000',y:0.4},{text:'GRAB MUD TIRES',font:'bold 56px "Chakra Petch", sans-serif',color:'#1a1000',y:0.78}],{w:512,h:256,bg:'#ffc23d'}),side:THREE.DoubleSide}));
    pan.position.y=3.5; sg.add(pan);
    // the station: five identical mud-tire boxes across the road
    if(def.mudBoxes){ const i=P.idxAt(def.mudBoxes.cp,def.mudBoxes.f); const n=5;
      const boxMat=new THREE.MeshStandardMaterial({color:0xff7a10,emissive:0xff4a00,emissiveIntensity:0.75,roughness:0.35,metalness:0.1,transparent:true,opacity:0.9});
      const tireMat=new THREE.MeshStandardMaterial({color:0x1a1a1a,roughness:0.8}), rimM=new THREE.MeshStandardMaterial({color:0xd8d8d8,metalness:0.8,roughness:0.3});
      for(let k=0;k<n;k++){ const lat=(k-(n-1)/2)*(P.w[i]-3)/(n-1); const p=ptAt(i,lat,1.3);
        const grp=new THREE.Group(); const cube=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.5,1.5),boxMat); cube.castShadow=true; grp.add(cube);
        const tire=new THREE.Mesh(new THREE.TorusGeometry(0.42,0.18,10,20),tireMat); grp.add(tire); const rim=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.25,0.16,14),rimM); rim.rotation.x=Math.PI/2; grp.add(rim);
        grp.position.set(p[0],p[1],p[2]); G.add(grp); W.mudBoxes.push({x:p[0],y:p[1],z:p[2],i,lat,active:true,t:0,grp,spin:k}); } }
  }
  W.updaters.push((dt,t)=>{ W.mudBoxes.forEach(b=>{ if(!b.active){ b.t-=dt; if(b.t<=0){ b.active=true; b.grp.visible=true; } } b.grp.rotation.y=t*1.4+b.spin; b.grp.position.y=b.y+Math.sin(t*2+b.spin)*0.15; }); });
  W.updaters.push((dt,t)=>{ W.items.forEach(b=>{ if(!b.active){ b.t-=dt; if(b.t<=0){b.active=true;b.grp.visible=true; b.grp.scale.setScalar(0.01);} } else { const s=b.grp.scale.x; if(s<1) b.grp.scale.setScalar(Math.min(1,s+dt*3)); } b.grp.rotation.y=t*1.6+b.spin; b.grp.rotation.x=Math.sin(t*1.2+b.spin)*0.3; b.grp.position.y=b.y+Math.sin(t*2+b.spin)*0.18; }); });
  // theme scenery
  W.nat=nat; if(th.space) buildSpaceScenery(W,def,P,Q,{ptAt,ribbon,notGap}); else buildScenery(W,def,P,Q,{heightAt,clearOfRoad,ptAt,hash,nat,ribbon,notGap});
  // minimap outline
  W.mini=[]; for(let i=0;i<P.N;i+=3) W.mini.push([P.x[i],P.z[i]]);
  W.update=(dt,t)=>W.updaters.forEach(f=>f(dt,t));
  return W;
}
function lerp3(a,b,t){return [lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];}
let _glowStrip=null; function glowStripTex(){ if(_glowStrip) return _glowStrip; _glowStrip=canvasTex(64,16,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(255,255,255,1)');g.fillStyle=gr;g.fillRect(0,0,w,h);}); return _glowStrip; }
function instanced(geo,mat,list,cast=true,recv=false){
  const m=new THREE.InstancedMesh(geo,mat,Math.max(1,list.length)); const o=new THREE.Object3D(); const col=new THREE.Color();
  list.forEach((p,k)=>{ o.position.set(p.x,p.y,p.z); o.rotation.set(p.rx||0,p.ry||0,p.rz||0); if(Array.isArray(p.s)) o.scale.set(p.s[0],p.s[1],p.s[2]); else o.scale.setScalar(p.s||1); o.updateMatrix(); m.setMatrixAt(k,o.matrix); col.set(p.c!==undefined?p.c:0xffffff); m.setColorAt(k,col); });
  if(!list.length){ col.set(0xffffff); m.setColorAt(0,col); }
  m.count=list.length; m.castShadow=cast; m.receiveShadow=recv; if(m.instanceColor) m.instanceColor.needsUpdate=true; return m;
}
function textPanelTex(lines,opts={}){
  const w=opts.w||512,h=opts.h||256;
  return canvasTex(w,h,(g)=>{ g.fillStyle=opts.bg||'#111'; g.fillRect(0,0,w,h); if(opts.border){ g.strokeStyle=opts.border; g.lineWidth=12; g.strokeRect(8,8,w-16,h-16); }
    lines.forEach(L=>{ g.font=L.font; g.fillStyle=L.color; g.textAlign='center'; g.textBaseline='middle'; if(L.glow){ g.shadowColor=L.glow; g.shadowBlur=20; } g.fillText(L.text,w/2,L.y*h); g.shadowBlur=0; }); });
}
function envLamps(W,E){
  const grp=W.group.children.find(o=>o.isGroup&&o.userData.gantry); if(grp) grp.visible=false;
  const d=new THREE.Vector3(...E.lamps.dir).normalize(); W.lamps=[];
  E.lamps.pos.forEach(p=>{ const m=new THREE.Mesh(new THREE.CircleGeometry(0.4,20),new THREE.MeshBasicMaterial({color:0x220808})); m.position.set(p[0],p[1],p[2]).addScaledVector(d,0.02); m.lookAt(m.position.clone().add(d)); W.group.add(m); W.lamps.push(m.material); });
}
function upgradeGantry(W,P,i){
  if(typeof propTemplate!=='function') return; const T=propTemplate('rrsign'); if(!T) return;
  const grp=W.group.children.find(o=>o.isGroup&&o.userData.gantry); if(!grp) return;
  grp.children.forEach(o=>{ if(!o.userData.lamp) o.visible=false; });
  const s=(P.w[i]+11)/(T.w*0.68); const arch=makeProp('rrsign'); arch.scale.setScalar(s); arch.rotation.y=Math.PI; grp.add(arch);
  const H=T.h*s, D=T.d*s; grp.children.forEach(o=>{ if(o.userData.lamp){ o.position.y=H*0.56; o.position.z=-(D/2+0.25-(o.userData.housing?0.2:0)); } });
}
function buildGantry(W,P,i){
  const G=W.group, w=P.w[i]/2+2.2, ang=Math.atan2(P.tx[i],P.tz[i]);
  const grp=new THREE.Group(); grp.userData.gantry=true; grp.position.set(P.x[i],P.y[i],P.z[i]); grp.rotation.y=ang; G.add(grp);
  const dark=new THREE.MeshStandardMaterial({color:0x1b1b24,metalness:0.6,roughness:0.4});
  [-1,1].forEach(s=>{ const p=new THREE.Mesh(new THREE.BoxGeometry(0.8,8,0.8),dark); p.position.set(s*w,4,0); p.castShadow=true; grp.add(p); });
  const beam=new THREE.Mesh(new THREE.BoxGeometry(w*2+0.8,1.9,0.9),dark); beam.position.y=8.4; beam.castShadow=true; grp.add(beam);
  const tex=textPanelTex([{text:"RYDEN'S RACERS",font:'italic 120px "Racing Sans One", Impact, sans-serif',color:'#ff4fb0',glow:'#ff2e97',y:0.55}],{w:1024,h:192,bg:'#12081f'});
  [1,-1].forEach(sd=>{ const b=new THREE.Mesh(new THREE.PlaneGeometry(w*1.7,1.6),new THREE.MeshBasicMaterial({map:tex})); b.position.set(0,8.4,-sd*0.46); if(sd>0) b.rotation.y=Math.PI; grp.add(b); });
  // countdown lamps (facing approaching cars: -z side)
  W.lamps=[]; for(let k=0;k<5;k++){ const m=new THREE.Mesh(new THREE.CircleGeometry(0.34,16),new THREE.MeshBasicMaterial({color:0x220808})); m.position.set((k-2)*0.95,6.9,-0.47); m.rotation.y=Math.PI; m.userData.lamp=true; grp.add(m); W.lamps.push(m.material); }
  const hous=new THREE.Mesh(new THREE.BoxGeometry(5.2,1,0.3),dark); hous.position.set(0,6.9,-0.3); hous.userData.lamp=true; hous.userData.housing=true; grp.add(hous);
}

// ===== THEMED SCENERY =====
// low-poly spectators for instancing: body (shirt + cap take the instance colour, legs stay dark) and skin (head + arms).
// Sit = seated, thighs toward -z.  Up = standing, arms raised.  Stand = standing, arms down.
function fanGeos(){ const bx=(w,h,d,x,y,z,c)=>{ const g=new THREE.BoxGeometry(w,h,d); g.translate(x,y,z); return tintGeo(g,c); };
  const head=()=>{ const g=new THREE.IcosahedronGeometry(0.15,0); g.translate(0,1.1,0); return tintGeo(g,0xffffff); }; const up=g=>{ g.translate(0,0.42,0); return g; };
  const G={ bodySit:mergeGeos([bx(0.46,0.56,0.26,0,0.64,0,0xffffff),bx(0.42,0.3,0.56,0,0.24,-0.24,0x3a3f55),bx(0.27,0.08,0.3,0,1.25,-0.03,0xffffff)]),
    skinSit:mergeGeos([head(),bx(0.11,0.4,0.11,-0.29,0.62,-0.06,0xffffff),bx(0.11,0.4,0.11,0.29,0.62,-0.06,0xffffff)]),
    bodyUp:up(mergeGeos([bx(0.46,0.56,0.26,0,0.64,0,0xffffff),bx(0.17,0.72,0.2,-0.12,0.0,0,0x3a3f55),bx(0.17,0.72,0.2,0.12,0.0,0,0x3a3f55),bx(0.27,0.08,0.3,0,1.25,-0.03,0xffffff)])),
    skinUp:up(mergeGeos([head(),bx(0.11,0.5,0.11,-0.31,1.12,0,0xffffff),bx(0.11,0.5,0.11,0.31,1.12,0,0xffffff)])),
    skinStand:up(mergeGeos([head(),bx(0.11,0.46,0.11,-0.29,0.6,0,0xffffff),bx(0.11,0.46,0.11,0.29,0.6,0,0xffffff)])) };
  Object.values(G).forEach(g=>g.computeVertexNormals()); return G; }
let _glowTex=null; function glowTex(){ if(_glowTex) return _glowTex; _glowTex=canvasTex(128,128,(g)=>{const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(0.25,'rgba(255,255,255,0.5)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);}); return _glowTex; }
function glowSprite(color,size,op=0.8){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:op,fog:false})); s.scale.set(size,size,1); return s; }
function palmGeos(){
  const trunk=new THREE.CylinderGeometry(0.17,0.3,1,6,3); trunk.translate(0,0.5,0); const trunk2=tintGeo(trunk,0x8a6a48);
  const fr=[]; for(let k=0;k<9;k++){ const g=new THREE.PlaneGeometry(0.9,4.2,1,5); const p=g.attributes.position;
    for(let v=0;v<p.count;v++){ const y=p.getY(v)+2.1; const w=Math.sin(y/4.2*Math.PI)*1.0; p.setX(v,p.getX(v)*w); p.setZ(v,y); p.setY(v,-0.08*y*y+0.5*y*0.4); }
    g.rotateY(k/9*TAU+(k%2)*0.2); fr.push(tintGeo(g,k%2?0x3f7a2c:0x2f6a26)); }
  const crown=mergeGeos(fr); crown.computeVertexNormals();
  return {trunk:trunk2,crown};
}
function saguaroGeo(){ const parts=[]; const c=(r,h,x,y,z)=>{const g=new THREE.CylinderGeometry(r,r,h,8);g.translate(x,y+h/2,z);parts.push(g);const s=new THREE.SphereGeometry(r,8,5,0,TAU,0,Math.PI/2);s.translate(x,y+h,z);parts.push(s);};
  c(0.38,5.2,0,0,0); c(0.26,1.8,0.9,2.2,0); c(0.26,1.4,-0.85,2.8,0); const a=new THREE.CylinderGeometry(0.24,0.24,0.9,8); a.rotateZ(Math.PI/2); a.translate(0.5,2.3,0); parts.push(a); const b=new THREE.CylinderGeometry(0.24,0.24,0.8,8); b.rotateZ(Math.PI/2); b.translate(-0.45,2.9,0); parts.push(b);
  const g=mergeGeos(parts.map(p=>tintGeo(p,0x4d7a3a))); g.computeVertexNormals(); return g; }
function rockGeo(seedv){ const g=new THREE.IcosahedronGeometry(1,1); const p=g.attributes.position; for(let v=0;v<p.count;v++){ const x=p.getX(v),y=p.getY(v),z=p.getZ(v); const n=0.75+0.5*vnoise(x*1.7+seedv,z*1.7+y); p.setXYZ(v,x*n,y*n*0.75,z*n);} g.computeVertexNormals(); return g; }
function coneTreeGeo(col){ const parts=[]; const t=new THREE.CylinderGeometry(0.15,0.22,2,5); t.translate(0,1,0); parts.push(tintGeo(t,0x5a4030));
  for(let k=0;k<3;k++){ const c=new THREE.ConeGeometry(1.5-k*0.35,2.6,7); c.translate(0,2.2+k*1.5,0); parts.push(tintGeo(c,col)); } const g=mergeGeos(parts); g.computeVertexNormals(); return g; }
function cypressGeo(){ const parts=[]; const t=new THREE.CylinderGeometry(0.2,0.3,3,5); t.translate(0,1.5,0); t.rotateZ(0.15); parts.push(tintGeo(t,0x5a4030));
  [[0.3,3.2,0,2.2],[1.2,3.6,0.4,1.8],[-1,3.4,-0.3,1.6],[0.5,4.2,0.2,1.4]].forEach(([x,y,z,r])=>{ const s=new THREE.SphereGeometry(r,7,5); s.scale(1.3,0.55,1.1); s.translate(x,y,z); parts.push(tintGeo(s,0x2f5a2a)); });
  const g=mergeGeos(parts); g.computeVertexNormals(); return g; }
function facadeTex(kind){
  return canvasTex(512,256,(g,w,h)=>{
    if(kind==='shop'){ noiseFill(g,w,h,'#eeeeee',14); g.fillStyle='rgba(0,0,0,0.12)'; g.fillRect(0,h-18,w,18);
      const sc=['#ff2e97','#1fb6ff','#ffb000','#2ecc71','#8e44ff','#ff5a36']; g.fillStyle=sc[Math.floor(Math.random()*6)]; g.fillRect(20,20,w-40,44);
      g.fillStyle='rgba(255,255,255,0.9)'; for(let k=0;k<8;k++) g.fillRect(40+k*55,34,34,16);
      g.fillStyle='#1d2433'; g.fillRect(24,90,200,130); g.fillRect(280,90,120,130); g.fillStyle='#343f55'; g.fillRect(420,110,70,110);
      g.fillStyle='rgba(180,220,255,0.25)'; g.fillRect(30,96,90,60); g.fillRect(290,96,50,60); }
    else if(kind==='villa'){ noiseFill(g,w,h,'#f4efe4',10); g.fillStyle='#2a3a4a'; for(let k=0;k<4;k++){ g.fillRect(40+k*120,60,50,70); g.fillStyle='#3a6ea5'; g.fillRect(34+k*120,56,8,78); g.fillRect(88+k*120,56,8,78); g.fillStyle='#2a3a4a'; } }
    else if(kind==='warehouse'){ noiseFill(g,w,h,'#3a3d46',14); for(let x=0;x<w;x+=8){ g.fillStyle='rgba(0,0,0,0.25)'; g.fillRect(x,0,3,h);} g.fillStyle='rgba(0,0,0,0.4)'; g.fillRect(40,h-120,120,120); }
    else if(kind==='warehouseE'){ g.fillStyle='#000'; g.fillRect(0,0,w,h); for(let r=0;r<3;r++) for(let c=0;c<10;c++) if(Math.random()<0.55){ g.fillStyle=Math.random()<0.7?'#ffb34d':'#9fd8ff'; g.fillRect(14+c*50,20+r*40,34,20);} }
    else if(kind==='tower'){ g.fillStyle='#000'; g.fillRect(0,0,w,h); for(let r=0;r<16;r++) for(let c=0;c<16;c++) if(Math.random()<0.45){ g.fillStyle=['#ffd58a','#a8d8ff','#ff8ad0'][Math.floor(Math.random()*3)]; g.fillRect(8+c*31,6+r*15,18,8);} }
  },{repeat:true});
}
function buildScenery(W,def,P,Q,H){
  const G=W.group, th=W.th, D=Q.density, {heightAt,clearOfRoad,ptAt,hash}=H;
  const scatter=(n,minD,maxD,margin,fn)=>{ const out=[]; let tries=0; n=Math.round(n*D); while(out.length<n&&tries<n*10){ tries++; const i=Math.floor(rnd()*P.N); const sd=rnd()<0.5?-1:1; const e=sd<0?P.wl[i]:P.wr[i]; const d=e+rr(minD,maxD);
      const x=P.x[i]+P.rx[i]*d*sd, z=P.z[i]+P.rz[i]*d*sd; if(!clearOfRoad(x,z,margin)) continue; if(typeof freeOfProps==='function' && !freeOfProps(x,z,5)) continue; const y=heightAt(x,z); const r=fn?fn(x,y,z,i,sd):{x,y,z,ry:rnd()*TAU}; if(r) out.push(r);} return out; };
  const areaScatter=(n,margin,fn)=>{ const out=[]; const b=W.bounds; let tries=0; n=Math.round(n*D); while(out.length<n&&tries<n*6){ tries++; const x=rr(b.minx-350,b.maxx+350), z=rr(b.minz-350,b.maxz+350); if(!clearOfRoad(x,z,margin)) continue; const y=heightAt(x,z); const r=fn(x,y,z); if(r) out.push(r);} return out; };
  const footprintClear=(x,z,ang,w,d,m)=>{ const ca=Math.cos(ang),sa=Math.sin(ang); for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1],[0,0],[0,1],[0,-1],[1,0],[-1,0]]){ const px=x+(a*w/2)*ca+(b*d/2)*sa, pz=z-(a*w/2)*sa+(b*d/2)*ca; if(!clearOfRoad(px,pz,m)) return false; } return true; };
  const stdMat=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:0.85},o));
  var freeOfProps; const PB=placeTrackProps(W,def,P,{heightAt,footprintClear}); freeOfProps=(x,z,r)=>!PB.some(b=>Math.hypot(b.x-x,b.z-z)<b.r+r);
  const vcMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.85,side:THREE.DoubleSide});
  const addPoles=(i0,i1,side,every,height,wires)=>{ const posts=[],lines=[]; let prev=null;
    for(let i=i0;i<i1;i+=every){ const k=i%P.N; const e=(side<0?P.wl[k]:P.wr[k])+2.5; const x=P.x[k]+P.rx[k]*e*side, z=P.z[k]+P.rz[k]*e*side; const y=heightAt(x,z);
      posts.push({x,y,z,ry:Math.atan2(P.tx[k],P.tz[k])}); const top=[x,y+height,z]; if(prev&&wires) for(let w=-1;w<=1;w++){ const ox=P.rx[k]*w*1.1, oz=P.rz[k]*w*1.1; lines.push(prev[0]+prev[3]*w*1.1,prev[1],prev[2]+prev[4]*w*1.1, top[0]+ox,top[1],top[2]+oz);} prev=[...top,P.rx[k],P.rz[k]]; }
    const pole=new THREE.CylinderGeometry(0.14,0.2,height,6); pole.translate(0,height/2,0); const bar=new THREE.BoxGeometry(2.6,0.14,0.14); bar.translate(0,height-0.2,0); bar.rotateY(Math.PI/2);
    G.add(instanced(mergeGeos([pole,bar]),stdMat(0x5b4633),posts));
    if(lines.length){ const lg=new THREE.BufferGeometry(); lg.setAttribute('position',new THREE.Float32BufferAttribute(lines,3)); G.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0x222222}))); } };
  const billboard=(i,side,dist,lines,bg,h=9)=>{ const k=i%P.N; const e=(side<0?P.wl[k]:P.wr[k])+dist; const x=P.x[k]+P.rx[k]*e*side, z=P.z[k]+P.rz[k]*e*side; const y=heightAt(x,z);
    const grp=new THREE.Group(); grp.position.set(x,y,z); grp.rotation.y=Math.atan2(P.tx[k],P.tz[k])+(side<0?-1:1)*0.6+Math.PI; G.add(grp);
    const tex=textPanelTex(lines,{w:1024,h:512,bg,border:'#ffffff'}); const b=new THREE.Mesh(new THREE.BoxGeometry(12,6,0.3),[stdMat(0x222222),stdMat(0x222222),stdMat(0x222222),stdMat(0x222222),new THREE.MeshStandardMaterial({map:tex,roughness:0.6,emissive:th.night?0xffffff:0,emissiveMap:th.night?tex:null,emissiveIntensity:0.8}),stdMat(0x333333)]);
    b.position.y=h; b.castShadow=true; grp.add(b); [-4,4].forEach(px=>{ const p=new THREE.Mesh(new THREE.BoxGeometry(0.4,h,0.4),stdMat(0x444444,{metalness:0.5})); p.position.set(px,h/2-1.5,0); grp.add(p); }); return grp; };
  // chevron boards on tight corners
  const chevTex=canvasTex(256,128,(g,w,h)=>{ g.fillStyle=th.night?'#0a0a14':'#f4f4f4'; g.fillRect(0,0,w,h); g.fillStyle=th.night?'#22e4ff':'#d8262b'; for(let k=0;k<3;k++){ g.beginPath(); const x=30+k*75; g.moveTo(x,10); g.lineTo(x+45,64); g.lineTo(x,118); g.lineTo(x+22,118); g.lineTo(x+67,64); g.lineTo(x+22,10); g.fill(); } });
  const chevMat=new THREE.MeshStandardMaterial({map:chevTex,emissive:th.night?0xffffff:0,emissiveMap:th.night?chevTex:null,emissiveIntensity:1,roughness:0.6});
  if(!(W.env&&W.env.skipChevrons)) for(let i=0;i<P.N;i+=7){ const c=P.curv[i]; if(Math.abs(c)<1/48||P.gap[i]) continue; const side=c>0?-1:1; const e=(side<0?P.wl[i]:P.wr[i])+0.8; const p=ptAt(i,e*side,0);
    const m=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.2,0.12),chevMat); m.position.set(p[0],p[1]+1.9,p[2]); m.rotation.y=Math.atan2(-P.rx[i]*side,-P.rz[i]*side); m.scale.x=side>0?-1:1; G.add(m); }
  // grandstand at start (all tracks)
  const GST=(typeof propTemplate==='function')?propTemplate('grandstand'):null;
  if(W.env&&W.env.skipStand){ }
  else if(GST){ const i=Math.round(26/P.spacing); const sc=55/GST.w; const e=P.wr[i]+4+GST.d*sc/2; const x=P.x[i]+P.rx[i]*e, z=P.z[i]+P.rz[i]*e; const o=makeProp('grandstand'); o.scale.setScalar(sc); o.position.set(x,heightAt(x,z)-0.1,z); o.rotation.y=Math.atan2(-P.rx[i],-P.rz[i]); G.add(o); }
  else { const i=Math.round(22/P.spacing); const side=1; const e=P.wr[i]+4; const x=P.x[i]+P.rx[i]*e, z=P.z[i]+P.rz[i]*e, y=heightAt(x,z); const grp=new THREE.Group(); grp.position.set(x,y,z); grp.rotation.y=Math.atan2(P.tx[i],P.tz[i]); G.add(grp);
    const crowd=[]; for(let r=0;r<6;r++){ const st=new THREE.Mesh(new THREE.BoxGeometry(6+r*0,1,40),stdMat(th.night?0x2a2a38:0xb0aca4)); st.position.set(-(r*1.6+2),r*1.0+0.5,0); st.scale.x=0.3; st.receiveShadow=true; grp.add(st);
      for(let c=0;c<26;c++) if(rnd()<0.8) crowd.push({x:-(r*1.6+2),y:r*1.0+1.4,z:-19+c*1.5+rr(-0.3,0.3),s:[0.5,0.8+rnd()*0.3,0.5],c:pick([0xff2e97,0x22e4ff,0xffd23f,0xffffff,0x2b2b2b,0xe74c3c,0x3498db,0x8e44ad])}); }
    const base=new THREE.Mesh(new THREE.BoxGeometry(10,7,42),stdMat(th.night?0x1e1e2a:0x9d978c)); base.position.set(-7,2.5,0); base.castShadow=true; grp.add(base);
    const roof=new THREE.Mesh(new THREE.BoxGeometry(12,0.4,44),stdMat(0xff2e97)); roof.position.set(-7,10.5,0); roof.rotation.z=-0.12; roof.castShadow=true; grp.add(roof);
    grp.add(instanced(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({roughness:0.8}),crowd,false)); }

  if(def.theme==='city' && !(W.env&&W.env.skipScenery)){
    const {trunk,crown}=palmGeos();
    const palms=scatter(110,3,60,3,(x,y,z)=>({x,y,z,ry:rnd()*TAU,h:rr(10,17)}));
    for(let i=0;i<P.N;i+=8){ if(i>P.cpIdx[3]&&i<P.cpIdx[21]) continue; [-1,1].forEach(sd=>{ const e=(sd<0?P.wl[i]:P.wr[i])+2.5; const x=P.x[i]+P.rx[i]*e*sd, z=P.z[i]+P.rz[i]*e*sd; palms.push({x,y:heightAt(x,z),z,ry:rnd()*TAU,h:rr(13,17)}); }); }
    for(let i=0;i<P.N;i+=9){ if(P.median[i]>1.2){ palms.push({x:P.x[i],y:P.y[i]+0.3,z:P.z[i],ry:rnd()*TAU,h:rr(8,11)}); } }
    for(let q=palms.length-1;q>=0;q--) if(!freeOfProps(palms[q].x,palms[q].z,1.5)||(W.env&&!envFree(W.env,palms[q].x,palms[q].z,2))) palms.splice(q,1);
    const PT=(typeof propTemplate==='function')?propTemplate('palm'):null;
    if(PT){ PT.parts.forEach(pp=>G.add(instanced(pp.g,pp.mt,palms.map(p=>({x:p.x,y:p.y,z:p.z,ry:p.ry,s:p.h/PT.h*0.85})),true))); }
    else { G.add(instanced(trunk,vcMat,palms.map(p=>({x:p.x,y:p.y,z:p.z,ry:p.ry,s:[1+p.h*0.03,p.h,1+p.h*0.03]}))));
    G.add(instanced(crown,vcMat,palms.map(p=>({x:p.x,y:p.y+p.h-0.2,z:p.z,ry:p.ry,s:1.15})))); }
    if(!W.env){ // procedural city (replaced by the Blender environment when present)
    // buildings
    const facades=[facadeTex('shop'),facadeTex('shop'),facadeTex('shop')]; const roofM=stdMat(0x8a8580);
    const blds=[[],[],[]];
    scatter(150,9,70,5,(x,y,z,i,sd)=>{ const ang=Math.atan2(P.tx[i],P.tz[i])+(sd>0?Math.PI/2:-Math.PI/2); const w=rr(11,20),d=rr(10,16),h=rr(4.5,9);
      if(!footprintClear(x,z,ang,w,d,4) || !freeOfProps(x,z,Math.max(w,d)/2)) return null; blds[Math.floor(rnd()*3)].push({x,y:y-0.2,z,ry:ang,s:[w,h,d],c:pick([0xf2e3c6,0xe8c7a0,0xcfe0d8,0xf0c9c9,0xd9d4f0,0xf7efe0,0xe0b98f,0xa9d6e5])}); return {}; });
    const bg=new THREE.BoxGeometry(1,1,1); bg.translate(0,0.5,0);
    blds.forEach((l,k)=>{ const fm=new THREE.MeshStandardMaterial({map:facades[k],roughness:0.85}); if(l.length){ const m=instanced(bg,[fm,fm,roofM,roofM,fm,fm],l,true,true); G.add(m);} });
    addPoles(P.cpIdx[3],P.cpIdx[11],-1,14,9,true); addPoles(P.cpIdx[17],P.cpIdx[23],1,14,9,true);
    // street lamps
    const lamps=[]; for(let i=0;i<P.N;i+=18){ const sd=(i/18)%2?1:-1; const e=(sd<0?P.wl[i]:P.wr[i])+1.2; const x=P.x[i]+P.rx[i]*e*sd, z=P.z[i]+P.rz[i]*e*sd; lamps.push({x,y:heightAt(x,z),z,ry:Math.atan2(P.rx[i]*-sd,P.rz[i]*-sd)}); }
    const lp=new THREE.CylinderGeometry(0.1,0.14,7,6); lp.translate(0,3.5,0); const la=new THREE.BoxGeometry(0.2,0.2,2); la.translate(0,7,1); G.add(instanced(mergeGeos([lp,la]),stdMat(0x3a3a3a,{metalness:0.6}),lamps));
    }
    // landmark: retro Ryden's sign
    { const i=P.cpIdx[3]; const e=P.wl[i]+9; const x=P.x[i]-P.rx[i]*e, z=P.z[i]-P.rz[i]*e, y=heightAt(x,z); const grp=new THREE.Group(); grp.position.set(x,y,z); grp.rotation.y=Math.atan2(P.tx[i],P.tz[i])+2.2; G.add(grp);
      const tex=canvasTex(1024,512,(g,w,h)=>{ g.fillStyle='#f6f0e2'; g.beginPath(); g.moveTo(40,120); g.lineTo(w-60,40); g.lineTo(w-20,h-120); g.lineTo(60,h-40); g.fill(); g.strokeStyle='#27c6d9'; g.lineWidth=18; g.stroke();
        g.font='italic 150px Yellowtail, cursive'; g.fillStyle='#ff2e97'; g.textAlign='center'; g.fillText("Ryden's",w/2,230); g.font='italic 150px "Racing Sans One", Impact'; g.fillStyle='#1e7fd0'; g.strokeStyle='#fff'; g.lineWidth=6; g.strokeText('RACERS',w/2,390); g.fillText('RACERS',w/2,390); });
      const sgn=new THREE.Mesh(new THREE.PlaneGeometry(14,7),new THREE.MeshStandardMaterial({map:tex,transparent:true,side:THREE.DoubleSide,roughness:0.5,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:0.25})); sgn.position.y=15; grp.add(sgn);
      const pl=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.45,15,8),stdMat(0x6b6f75,{metalness:0.6})); pl.position.y=7.5; pl.castShadow=true; grp.add(pl); }
    // landmark: donut shop with giant donut
    if(!W.env){ const i=P.cpIdx[15]; const sd=1; const e=P.wr[i]+18; const x=P.x[i]+P.rx[i]*e, z=P.z[i]+P.rz[i]*e, y=heightAt(x,z); const grp=new THREE.Group(); grp.position.set(x,y,z); grp.rotation.y=Math.atan2(P.tx[i],P.tz[i]); G.add(grp);
      const b=new THREE.Mesh(new THREE.BoxGeometry(14,5,12),stdMat(0xfff3e6)); b.position.y=2.5; b.castShadow=true; grp.add(b);
      const dough=new THREE.Mesh(new THREE.TorusGeometry(4,1.9,16,40),stdMat(0xd9a15a)); dough.position.set(0,11,0); dough.rotation.y=Math.PI/2; dough.castShadow=true; grp.add(dough);
      const ic=new THREE.Mesh(new THREE.TorusGeometry(4,1.95,16,40,Math.PI*2),new THREE.MeshStandardMaterial({map:liveryTexture('sprinkles'),roughness:0.5})); ic.scale.set(1,1,0.7); ic.position.set(0.35,11,0); ic.rotation.y=Math.PI/2; grp.add(ic);
      const sg=new THREE.Mesh(new THREE.PlaneGeometry(10,1.6),new THREE.MeshBasicMaterial({map:textPanelTex([{text:'GLAZE EM DONUTS',font:'bold 90px "Racing Sans One",Impact',color:'#ff2e97',y:0.55}],{w:1024,h:160,bg:'#fff'})})); sg.position.set(-7.05,4,0); sg.rotation.y=-Math.PI/2; grp.add(sg); }
    if(!W.env) billboard(P.cpIdx[8],1,10,[{text:'RIMFIRE GAMES',font:'bold 130px "Racing Sans One",Impact',color:'#ffd23f',y:0.4},{text:'presents',font:'italic 70px Yellowtail',color:'#fff',y:0.72}],'#1a0f33');
    if(!W.env) billboard(P.cpIdx[19],-1,8,[{text:'MISSILE',font:'bold 150px "Racing Sans One",Impact',color:'#d4a33a',y:0.35},{text:'COMMANDER TRUCKS',font:'bold 80px "Chakra Petch"',color:'#fff',y:0.72}],'#111');
    // distant skyline (downtown)
    const tw=facadeTex('tower'); const towers=[]; for(let k=0;k<26;k++){ const a=-0.6+k*0.05+rr(-0.02,0.02); const r=rr(820,980); towers.push({x:W.nat.cx+Math.sin(a)*r,y:0,z:W.nat.cz+Math.cos(a)*r,ry:rnd(),s:[rr(25,45),rr(60,190),rr(25,45)]}); }
    const tg=new THREE.BoxGeometry(1,1,1); tg.translate(0,0.5,0); G.add(instanced(tg,new THREE.MeshStandardMaterial({color:0x8ea3b8,roughness:0.6,metalness:0.3}),towers,false));
  }
  if(def.theme==='desert' && !(W.env&&W.env.skipScenery)){
    const sag=saguaroGeo(); G.add(instanced(sag,vcMat,scatter(170,3,140,2,(x,y,z)=>({x,y:y-0.2,z,ry:rnd()*TAU,s:rr(0.8,1.5)}))));
    const rocks=[0,1,2].map(k=>rockGeo(k*10)); const rockMat=new THREE.MeshStandardMaterial({color:0xa65a34,roughness:0.95,flatShading:true});
    rocks.forEach(g=>G.add(instanced(g,rockMat,scatter(70,2,160,2,(x,y,z)=>{const s=rr(0.8,5);return {x,y:y+s*0.1,z,ry:rnd()*TAU,s:[s*rr(1,1.8),s,s*rr(1,1.6)],c:pick([0xffffff,0xd8b8a0,0xc09070])};}),true,true)));
    const shrub=new THREE.IcosahedronGeometry(0.8,0); G.add(instanced(shrub,new THREE.MeshStandardMaterial({color:0x8a8a4a,roughness:1,flatShading:true}),scatter(300,1,120,1.5,(x,y,z)=>({x,y,z,s:[rr(0.6,1.4),rr(0.4,0.8),rr(0.6,1.4)],ry:rnd()*TAU})),false));
    addPoles(P.cpIdx[0]+4,P.cpIdx[3],1,16,8,true); addPoles(P.cpIdx[19],P.cpIdx[22]+20,1,16,8,true);
    // rock arch over the straight
    { const i=P.idxAt(1,0.55); const R=Math.max(P.wl[i],P.wr[i])+5; const arch=new THREE.Mesh(new THREE.TorusGeometry(R,3.6,8,28,Math.PI),new THREE.MeshStandardMaterial({color:0xb4643a,roughness:0.95,flatShading:true}));
      const p=arch.geometry.attributes.position; for(let v=0;v<p.count;v++){ const x=p.getX(v),y=p.getY(v),z=p.getZ(v); const n=0.8+0.45*vnoise(x*0.3+3,y*0.3+z); p.setXYZ(v,x+(x/R)*n*0.8,y*1.0+n,z*n*1.4);} arch.geometry.computeVertexNormals();
      arch.position.set(P.x[i],P.y[i]-3,P.z[i]); arch.rotation.y=Math.atan2(P.tx[i],P.tz[i]); arch.scale.set(1,1.1,1); arch.castShadow=true; arch.receiveShadow=true; G.add(arch);
      [-1,1].forEach(s=>{ const b=new THREE.Mesh(rockGeo(s+5),arch.material); b.scale.set(7,8,7); b.position.set(P.x[i]+P.rx[i]*s*(R+1),P.y[i]-2,P.z[i]+P.rz[i]*s*(R+1)); b.castShadow=true; G.add(b); }); }
    // broken bridge stubs at the wash
    (def.jumps||[]).forEach(j=>{ if(!j.gap) return; const gl=Math.round(j.gap/P.spacing); [j.top+1,j.top+gl].forEach(i=>{ i%=P.N; [-1,1].forEach(s=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(1.2,12,1.2),stdMat(0x8d8478)); m.position.set(P.x[i]+P.rx[i]*s*P.w[i]*0.4,P.y[i]-6.3,P.z[i]+P.rz[i]*s*P.w[i]*0.4); G.add(m); }); }); });
    // gas station + water tower landmark
    { const i=P.cpIdx[20]; const e=P.wl[i]+16; const x=P.x[i]-P.rx[i]*e, z=P.z[i]-P.rz[i]*e, y=heightAt(x,z); const grp=new THREE.Group(); grp.position.set(x,y,z); grp.rotation.y=Math.atan2(P.tx[i],P.tz[i])+Math.PI/2; G.add(grp);
      const canopy=new THREE.Mesh(new THREE.BoxGeometry(16,0.8,9),stdMat(0xf4f0e8)); canopy.position.y=5.5; canopy.castShadow=true; grp.add(canopy);
      const band=new THREE.Mesh(new THREE.BoxGeometry(16.2,0.5,9.2),stdMat(0xd8262b)); band.position.y=5.2; grp.add(band);
      [-6,6].forEach(px=>[-3,3].forEach(pz=>{ const c=new THREE.Mesh(new THREE.BoxGeometry(0.4,5.2,0.4),stdMat(0xdddddd)); c.position.set(px,2.6,pz); grp.add(c); }));
      const shop=new THREE.Mesh(new THREE.BoxGeometry(10,4.5,8),stdMat(0xe9dcc5)); shop.position.set(0,2.25,11); shop.castShadow=true; grp.add(shop);
      const sg=new THREE.Mesh(new THREE.PlaneGeometry(8,2),new THREE.MeshBasicMaterial({map:textPanelTex([{text:"RYDEN'S GAS",font:'italic 120px "Racing Sans One",Impact',color:'#ff2e97',y:0.55}],{w:1024,h:256,bg:'#fff8ea'})})); sg.position.set(0,5.5,-4.55); sg.rotation.y=Math.PI; grp.add(sg);
      const tower=new THREE.Group(); tower.position.set(14,0,14); grp.add(tower); const tank=new THREE.Mesh(new THREE.CylinderGeometry(4,4,5,16),stdMat(0x9fb4c0,{metalness:0.5,roughness:0.4})); tank.position.y=16; tank.castShadow=true; tower.add(tank);
      const cap=new THREE.Mesh(new THREE.ConeGeometry(4.3,2,16),stdMat(0x7f949f)); cap.position.y=19.5; tower.add(cap);
      [[-2.5,-2.5],[2.5,-2.5],[2.5,2.5],[-2.5,2.5]].forEach(([a,b])=>{ const l=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.25,14,6),stdMat(0x6d6d6d)); l.position.set(a,7,b); tower.add(l); }); }
    billboard(P.cpIdx[5],-1,10,[{text:'MOJAVE MESA RUN',font:'bold 110px "Racing Sans One",Impact',color:'#ffb000',y:0.4},{text:'Next services 99 mi',font:'italic 70px "Chakra Petch"',color:'#fff',y:0.75}],'#3b1f12');
  }
  if(def.theme==='country' && !(W.env&&W.env.skipScenery)) buildCountryScenery(W,def,P,Q,H,{scatter,areaScatter,footprintClear,stdMat,vcMat,freeOfProps});
  if(def.theme==='coast'){
    // ocean
    const ocean=new THREE.Mesh(new THREE.PlaneGeometry(9000,9000,1,1),new THREE.ShaderMaterial({fog:true,transparent:false,
      uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{t:{value:0},sun:{value:W.sunDir},deep:{value:new THREE.Color(0x0e4a78)},shallow:{value:new THREE.Color(0x2e8fae)},sunc:{value:new THREE.Color(0xffc27a)}}]),
      vertexShader:'varying vec3 wp;\n#include <fog_pars_vertex>\nvoid main(){vec4 w=modelMatrix*vec4(position,1.);wp=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
      fragmentShader:`uniform float t;uniform vec3 sun,deep,shallow,sunc;varying vec3 wp;\n#include <fog_pars_fragment>\n
        void main(){ vec2 p=wp.xz*0.05; float w=sin(p.x*2.1+t*1.2)*0.5+sin(p.y*1.7-t*0.9+p.x)*0.5+sin((p.x+p.y)*4.3+t*2.)*0.25;
          vec3 n=normalize(vec3(cos(p.x*2.1+t*1.2)*0.12,1.,cos(p.y*1.7-t*0.9)*0.12+0.05*w));
          vec3 v=normalize(cameraPosition-wp); float fr=pow(1.-max(dot(n,v),0.),3.);
          vec3 c=mix(deep,shallow,0.35+0.2*w); c=mix(c,vec3(0.95,0.75,0.6),fr*0.6);
          vec3 r=reflect(-v,n); float sp=pow(max(dot(r,normalize(sun)),0.),120.); c+=sunc*sp*3.;
          gl_FragColor=vec4(c,1.);\n#include <fog_fragment>\n}`}));
    ocean.rotation.x=-Math.PI/2; ocean.position.y=(W.env&&W.env.seaY!=null)?W.env.seaY:-3; G.add(ocean); W.updaters.push((dt,t)=>ocean.material.uniforms.t.value=t);
    if(!(W.env&&W.env.skipScenery)){
    const land=(x,z,y)=>y>0.5;
    const cyp=cypressGeo(); G.add(instanced(cyp,vcMat,scatter(150,4,140,3,(x,y,z)=>land(x,z,y)?{x,y:y-0.2,z,ry:rnd()*TAU,s:rr(1.2,2.2)}:null)));
    const pine=coneTreeGeo(0x2d5a32); G.add(instanced(pine,vcMat,areaScatter(260,10,(x,y,z)=>y>4?{x,y:y-0.3,z,ry:rnd()*TAU,s:rr(1.5,3)}:null)));
    const rg=rockGeo(3); const rm=new THREE.MeshStandardMaterial({color:0x6d655c,roughness:0.95,flatShading:true});
    G.add(instanced(rg,rm,areaScatter(40,20,(x,y,z)=>y<-4&&y>-24?{x,y:-4,z,ry:rnd()*TAU,s:[rr(4,10),rr(6,22),rr(4,10)]}:null),true));
    G.add(instanced(rg,rm,scatter(80,2,50,2,(x,y,z)=>({x,y,z,ry:rnd()*TAU,s:rr(0.8,3)}))));
    // gallery tunnel (open to the ocean side)
    (def.tunnels||[]).forEach(t=>{ const inc=(i,j)=>P.tunnel[i]&&P.tunnel[j]; const roofY=7.2;
      const cm=new THREE.MeshStandardMaterial({color:0xb9b2a4,roughness:0.9,side:THREE.DoubleSide});
      const roof=H.ribbon(inc,i=>-P.wl[i]-0.6,i=>P.wr[i]+0.6,roofY,roofY,0,1,6); const roofTop=H.ribbon(inc,i=>-P.wl[i]-0.6,i=>P.wr[i]+0.6,roofY+0.8,roofY+0.8,0,1,6);
      const inner=H.ribbon(inc,i=>P.wr[i]+0.2,i=>P.wr[i]+0.2,-0.5,roofY,0,1,6);
      const m=new THREE.Mesh(mergeGeos([roof,roofTop,inner]),cm); m.castShadow=true; m.receiveShadow=true; G.add(m);
      const cols=[]; for(let k=0;k<t.n;k+=3){ const i=(t.i0+k)%P.N; const p=ptAt(i,-P.wl[i]-0.3,0); cols.push({x:p[0],y:p[1]-0.5,z:p[2],ry:Math.atan2(P.tx[i],P.tz[i]),s:[0.9,roofY+0.5,1.4]}); }
      const cg=new THREE.BoxGeometry(1,1,1); cg.translate(0,0.5,0); G.add(instanced(cg,cm,cols,true,true));
      const lights=[]; for(let k=2;k<t.n;k+=4){ const i=(t.i0+k)%P.N; const p=ptAt(i,0,roofY-0.1); lights.push({x:p[0],y:p[1],z:p[2],ry:Math.atan2(P.tx[i],P.tz[i]),s:[1.5,0.1,2]}); }
      G.add(instanced(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffe7b0}),lights,false)); });
    // lighthouse landmark
    { const i=P.cpIdx[8]; const e=P.wl[i]+26; const x=P.x[i]-P.rx[i]*e, z=P.z[i]-P.rz[i]*e, y=Math.max(heightAt(x,z),P.y[i]-4); const grp=new THREE.Group(); grp.position.set(x,y,z); G.add(grp);
      const base=new THREE.Mesh(new THREE.CylinderGeometry(6,7,4,20),stdMat(0x9a8f80)); base.position.y=-1; grp.add(base);
      for(let k=0;k<5;k++){ const s=new THREE.Mesh(new THREE.CylinderGeometry(2.6-k*0.25,2.85-k*0.25,4.4,18),stdMat(k%2?0xd8262b:0xf4f4f4)); s.position.y=2.2+k*4.4; s.castShadow=true; grp.add(s); }
      const lan=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,2.4,12),new THREE.MeshBasicMaterial({color:0xfff2b0})); lan.position.y=24.4; grp.add(lan);
      const cap=new THREE.Mesh(new THREE.ConeGeometry(2.2,2.2,12),stdMat(0x1f1f1f)); cap.position.y=26.7; grp.add(cap);
      const gl=glowSprite(0xfff0b0,26,0.7); gl.position.y=24.4; grp.add(gl);
      const beamG=new THREE.ConeGeometry(4,60,16,1,true); beamG.translate(0,-30,0); beamG.rotateZ(Math.PI/2);
      const beam=new THREE.Mesh(beamG,new THREE.MeshBasicMaterial({color:0xfff2c0,transparent:true,opacity:0.12,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); beam.position.y=24.4; grp.add(beam);
      W.updaters.push((dt,t)=>beam.rotation.y=t*0.8); }
    // clifftop villas (Mediterranean village feel)
    const vf=new THREE.MeshStandardMaterial({map:facadeTex('villa'),roughness:0.9}); const rfm=stdMat(0xb5532e);
    const vl=scatter(28,10,60,5,(x,y,z,i,sd)=>{ if(y<1) return null; const ang=Math.atan2(P.tx[i],P.tz[i]); const w=rr(9,14),d=rr(8,11),h=rr(5,8); if(!footprintClear(x,z,ang,w,d,4)) return null; return {x,y:y-0.3,z,ry:ang,s:[w,h,d],c:pick([0xffffff,0xf7e7cf,0xf2d6c0])}; });
    const bg=new THREE.BoxGeometry(1,1,1); bg.translate(0,0.5,0); G.add(instanced(bg,[vf,vf,rfm,rfm,vf,vf],vl,true,true));
    const rg2=new THREE.ConeGeometry(0.75,0.35,4); rg2.rotateY(Math.PI/4); rg2.translate(0,0.17,0); G.add(instanced(rg2,rfm,vl.map(v=>({x:v.x,y:v.y+v.s[1],z:v.z,ry:v.ry,s:[v.s[0]*0.95*1.41,v.s[1]*0.9,v.s[2]*0.95*1.41]})),true));
    }
    // sailboats
    for(let k=0;k<5;k++){ const b=new THREE.Group(); const x=W.nat.cx-rr(350,900), z=W.nat.cz+rr(-600,600); b.position.set(x,(W.env&&W.env.seaY!=null)?W.env.seaY:-3,z); const hull=new THREE.Mesh(new THREE.BoxGeometry(2,1,7),stdMat(0xffffff)); b.add(hull);
      const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.Float32BufferAttribute([0,1,-2,0,11,0,0,1,2.8],3)); sg.computeVertexNormals(); const sail=new THREE.Mesh(sg,new THREE.MeshStandardMaterial({color:0xf8f4ec,side:THREE.DoubleSide})); b.add(sail); b.rotation.y=rnd()*TAU; G.add(b); }
    if(!W.env) billboard(P.cpIdx[13],1,8,[{text:'PACIFICA',font:'italic 150px Yellowtail',color:'#ff7a1f',y:0.42},{text:'COAST HIGHWAY',font:'bold 80px "Chakra Petch"',color:'#fff',y:0.76}],'#10304f');
  }
  if(def.theme==='rally'){
    // ===== BLACK RIFLE RALLYCROSS: an extreme-sports dirt stage in the pines, dressed as if Black Rifle Coffee Company paid for every metre =====
    // Brand art here is plain lettering in black / tan / red; official logo files can replace the banner atlas (see docs).
    const ribbon=H.ribbon, notGap=H.notGap, N=P.N, BLK='#111112', TAN='#c9a66b', RED='#b3202a', JS=def.jumps||[], LP=P.loop;
    const edge=(i,sd,d)=>ptAt(i,sd*((sd<0?P.wl[i]:P.wr[i])+d),0), outSide=i=>P.curv[i]>0?1:-1, bg1=new THREE.BoxGeometry(1,1,1); bg1.translate(0,0.5,0);
    const F1='bold 92px "Chakra Petch", sans-serif', F1s='bold 60px "Chakra Petch", sans-serif', F2='italic 104px "Racing Sans One", Impact, sans-serif';
    const keep=(x,z,r)=>(W.rk=W.rk||[]).push([x,z,r]), onJump=i=>JS.some(j=>((i-j.i0+N)%N)<Math.round((j.len+j.gap+22)/P.spacing)), vis=i=>!P.hidden[i]&&!P.gap[i];
    // ---- sponsor banners on the fences, both sides, the whole lap (one atlas: 2 rows x 4 panels)
    { const panels=[[BLK,TAN,'BLACK RIFLE COFFEE COMPANY',F1,0.74],[TAN,BLK,'BRCC',F2,1.5],[BLK,'#f2efe8','FRESH ROASTED · FULL SEND',F1,0.74],[RED,'#f2efe8','BLACK RIFLE COFFEE',F1,0.92],
                    [TAN,BLK,'BLACK RIFLE COFFEE COMPANY',F1,0.74],[BLK,RED,'BRCC',F2,1.5],[BLK,TAN,'FUELED BY DARK ROAST',F1,0.8],['#f2efe8',BLK,'SEND IT',F2,1.3]];
      const at=canvasTex(2048,256,(g,w,h)=>{ panels.forEach((p,k)=>{ const x=(k%4)*512, y=Math.floor(k/4)*128; g.fillStyle=p[0]; g.fillRect(x,y,512,128); g.strokeStyle=p[1]; g.lineWidth=5; g.strokeRect(x+7,y+7,498,114);
          g.fillStyle=p[1]; g.textAlign='center'; g.textBaseline='middle'; g.font=p[3]; const tw=g.measureText(p[2]).width, sc=Math.min(p[4],470/tw); g.save(); g.translate(x+256,y+66); g.scale(sc,Math.min(1,sc*1.25)); g.fillText(p[2],0,0); g.restore(); }); },{repeat:true,aniso:8});
      const bm=new THREE.MeshBasicMaterial({map:at,side:THREE.DoubleSide}); const STRIP=4.6*4;
      const band=(sd,row)=>{ const lat=i=>sd*((sd<0?P.wl[i]:P.wr[i])-0.1); const g=ribbon(notGap,lat,lat,0.22,1.3,1-(row+1)*0.5,1-row*0.5,STRIP); const uv=g.attributes.uv; for(let k=0;k<uv.count;k++){ const u=uv.getX(k); uv.setXY(k,sd>0?-uv.getY(k):uv.getY(k),u); } return new THREE.Mesh(g,bm); };
      G.add(band(1,0)); G.add(band(-1,1)); }
    // ---- stunt surface: black deck with tan chevrons (ramps and the loop)
    const deckT=canvasTex(256,256,(g,w,h)=>{ g.fillStyle='#17171a'; g.fillRect(0,0,w,h); g.strokeStyle='rgba(201,166,107,0.9)'; g.lineWidth=16; g.lineJoin='miter'; for(let y=40;y<h+60;y+=128){ g.beginPath(); g.moveTo(26,y+50); g.lineTo(w/2,y-14); g.lineTo(w-26,y+50); g.stroke(); }
        g.fillStyle='#b3202a'; g.fillRect(0,0,10,h); g.fillRect(w-10,0,10,h); for(let k=0;k<160;k++){ g.fillStyle=`rgba(255,255,255,${Math.random()*0.05})`; g.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*26,1.5); } },{repeat:true,aniso:8});
    const deckM=new THREE.MeshStandardMaterial({map:deckT,roughness:0.55,metalness:0.15,side:THREE.DoubleSide});
    // ---- jumps: a chevron deck on each ramp, an arch at the foot, flame jets on the lip (lit when a car takes off), fireworks beyond
    const jets=[], shells=[];
    JS.forEach((J,q)=>{ const i=J.i0, ang=Math.atan2(P.tx[i],P.tz[i]), R0=P.w[i]/2+4.5; const ag=new THREE.Group(); ag.position.set(P.x[i],P.y[i]-0.4,P.z[i]); ag.rotation.y=ang; G.add(ag);
      const arch=new THREE.Mesh(new THREE.TorusGeometry(R0,1.25,10,30,Math.PI),stdMat(0x141416,{roughness:0.55})); arch.castShadow=true; ag.add(arch);
      [-1,1].forEach(s2=>{ const ft=new THREE.Mesh(new THREE.BoxGeometry(3.4,1.6,3.4),stdMat(0x141416)); ft.position.set(s2*R0,0.8,0); ag.add(ft); });
      const tt=textPanelTex([{text:'BLACK RIFLE COFFEE COMPANY',font:F1s,color:TAN,y:0.3},{text:J.name||'JUMP',font:F2,color:'#f2efe8',y:0.7}],{w:1024,h:256,bg:BLK,border:TAN});
      [1,-1].forEach(sd2=>{ const b=new THREE.Mesh(new THREE.PlaneGeometry(R0*1.25,R0*0.31),new THREE.MeshBasicMaterial({map:tt})); b.position.set(0,R0+2.2,sd2*-0.2); if(sd2>0) b.rotation.y=Math.PI; ag.add(b); });
      const bar=new THREE.Mesh(new THREE.BoxGeometry(R0*1.3,R0*0.34,0.3),stdMat(0x141416)); bar.position.set(0,R0+2.2,0); ag.add(bar);
      const rl=Math.round(J.len/P.spacing), inR=(a,b)=>((a-J.i0+N)%N)<=rl&&((b-J.i0+N)%N)<=rl; const dk=new THREE.Mesh(ribbon(inR,k=>-P.w[k]/2+0.6,k=>P.w[k]/2-0.6,0.05,0.05,0,1,4),deckM); dk.receiveShadow=true; G.add(dk);
      const side=ribbon(inR,k=>-P.w[k]/2-0.3,k=>-P.w[k]/2-0.3,-6,0.04,0,1,4), side2=ribbon(inR,k=>P.w[k]/2+0.3,k=>P.w[k]/2+0.3,-6,0.04,0,1,4); const skm=stdMat(0x1a1a1c,{roughness:0.7,side:THREE.DoubleSide}); G.add(new THREE.Mesh(mergeGeos([side,side2]),skm));
      const tp=J.top; for(const sd of [-1,1]) for(const back of [0,5]){ const k=(tp-back+N)%N, p=ptAt(k,sd*(P.w[k]/2+1.6),0.3); jets.push({q,x:p[0],y:p[1],z:p[2]}); const can=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.55,1.5,10),stdMat(0x202024,{metalness:0.6,roughness:0.4})); can.position.set(p[0],p[1]-0.4,p[2]); G.add(can); }
      const land=(tp+Math.round((J.gap+18)/P.spacing))%N; for(const sd of [-1,1]){ const p=edge(land,sd,10); shells.push({q,x:p[0],y:P.y[land]+1,z:p[2]}); } });
    // ---- THE FULL SEND LOOP: a helix deck with lips, on a steel frame, the name over the entry
    if(LP){ const SEG=72, WL=LP.w, o={}, pos=[], uv=[], idx=[]; const add=(u,l,up,U,V)=>{ LP.pos(u,l,o); const th=2*Math.PI*u; pos.push(o.x-LP.fx*Math.sin(th)*up,o.y+Math.cos(th)*up,o.z-LP.fz*Math.sin(th)*up); uv.push(U,V); };
      for(let k=0;k<=SEG;k++){ const u=k/SEG, v=u*LP.len/4; add(u,-WL/2,0,0,v); add(u,WL/2,0,1,v); add(u,-WL/2,0.75,0.02,v); add(u,WL/2,0.75,0.98,v); add(u,-WL/2,-0.5,0.5,v); add(u,WL/2,-0.5,0.5,v); }
      for(let k=0;k<SEG;k++){ const a=k*6, b=a+6; idx.push(a,a+1,b, a+1,b+1,b,  a,b,a+2, a+2,b,b+2,  a+1,a+3,b+1, a+3,b+3,b+1,  a+4,b+4,a+5, a+5,b+4,b+5,  a,a+4,b, a+4,b+4,b,  a+1,b+1,a+5, a+5,b+1,b+5); }
      const lg=new THREE.BufferGeometry(); lg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); lg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); lg.setIndex(idx); lg.computeVertexNormals();
      const loop=new THREE.Mesh(lg,deckM); loop.castShadow=true; loop.receiveShadow=true; G.add(loop);
      const cx=LP.ex+LP.fx*LP.adv*0.5+LP.rx*LP.D*0.5, cz=LP.ez+LP.fz*LP.adv*0.5+LP.rz*LP.D*0.5; keep(cx,cz,LP.R+24);
      // frame: a portal over the top (two posts outside the helix, a truss across, hangers down to the deck) and two knee braces
      { const fm=stdMat(0x2b2d33,{metalness:0.6,roughness:0.45}), lo=Math.min(0,LP.D)-WL/2-1.6, hi=Math.max(0,LP.D)+WL/2+1.6, Ht=2*LP.R+2.6, al=LP.adv*0.5; const fg=new THREE.Group(); fg.position.set(LP.ex+LP.fx*al,LP.ey-0.4,LP.ez+LP.fz*al); fg.rotation.y=Math.atan2(LP.fx,LP.fz); G.add(fg);
        // group local: +z = travel direction, +x = to the LEFT of travel (rotation.y maps local x to (cos,0,-sin)), so lateral l (to the right) is local x = -l
        [lo,hi].forEach(l=>{ const post=new THREE.Mesh(new THREE.BoxGeometry(0.8,Ht,0.8),fm); post.position.set(-l,Ht/2,0); post.castShadow=true; fg.add(post); const ft=new THREE.Mesh(new THREE.BoxGeometry(2.6,0.5,2.6),fm); ft.position.set(-l,0.25,0); fg.add(ft);
          [-1,1].forEach(s2=>{ const br=new THREE.Mesh(new THREE.BoxGeometry(0.3,Ht*0.62,0.3),fm); br.position.set(-l,Ht*0.28,s2*Ht*0.16); br.rotation.x=-s2*0.52; fg.add(br); }); });
        const beam=new THREE.Mesh(new THREE.BoxGeometry(hi-lo+0.8,1.1,1.0),fm); beam.position.set(-(lo+hi)/2,Ht-0.2,0); beam.castShadow=true; fg.add(beam);
        [-1,1].forEach(s2=>{ const hl=LP.D*0.5+s2*(WL/2+0.2); const hg=new THREE.Mesh(new THREE.BoxGeometry(0.16,2.3,0.16),fm); hg.position.set(-hl,Ht-1.6,0); fg.add(hg); }); }
      const sgT=textPanelTex([{text:'BLACK RIFLE COFFEE COMPANY',font:F1s,color:TAN,y:0.3},{text:'THE FULL SEND LOOP',font:F2,color:'#f2efe8',y:0.7}],{w:1024,h:256,bg:BLK,border:RED});
      const sg=new THREE.Group(); sg.position.set(LP.ex-LP.fx*(LP.R+7),LP.ey,LP.ez-LP.fz*(LP.R+7)); sg.rotation.y=Math.atan2(LP.fx,LP.fz); G.add(sg); const hw=P.w[LP.i0]/2+3.4;
      [-1,1].forEach(s2=>{ const pl=new THREE.Mesh(new THREE.BoxGeometry(0.7,9.5,0.7),stdMat(0x2b2d33,{metalness:0.6,roughness:0.45})); pl.position.set(s2*hw,4.75,0); sg.add(pl); }); const bd=new THREE.Mesh(new THREE.BoxGeometry(hw*2+0.7,3.4,0.4),stdMat(0x141416)); bd.position.y=8.2; sg.add(bd);
      [1,-1].forEach(sd2=>{ const b=new THREE.Mesh(new THREE.PlaneGeometry(hw*1.9,3),new THREE.MeshBasicMaterial({map:sgT})); b.position.set(0,8.2,sd2*-0.22); if(sd2>0) b.rotation.y=Math.PI; sg.add(b); });
      for(const sd of [-1,1]){ const p=ptAt((LP.i0-4+N)%N,sd*(P.w[LP.i0]/2+1.6),0.3); jets.push({q:'loop',x:p[0],y:p[1],z:p[2]}); }
      LP.pos(0.5,0,o); shells.push({q:'loop',x:o.x+LP.rx*9,y:o.y+4,z:o.z+LP.rz*9},{q:'loop',x:o.x-LP.rx*9,y:o.y+4,z:o.z-LP.rz*9}); }
    // ---- pyro: flame jets (sprites + sparks) for 0.9 s when a car takes off, then a shell bursts over the landing
    { const fl=jets.map(j=>{ const a=glowSprite(0xff8a1e,3,0); a.position.set(j.x,j.y+3.4,j.z); G.add(a); const b=glowSprite(0xfff0b0,1.6,0); b.position.set(j.x,j.y+1.2,j.z); G.add(b); return {j,a,b}; });
      const live={}, fire=[]; W.pyro=(q,c)=>{ const t=W.pyroT||0; if(live[q]&&t-live[q]<1.6) return; live[q]=t; fire.push({q,t0:t,shell:false}); if(c&&c.isPlayer&&W.sfxPyro) W.sfxPyro(); };
      const cols=[[1,0.78,0.42],[1,0.25,0.2],[1,0.95,0.8],[0.79,0.65,0.42]];
      W.updaters.push((dt,t)=>{ W.pyroT=t; const fx=W.fx; fl.forEach(f=>{ f.on=0; });
        for(let n=fire.length-1;n>=0;n--){ const F=fire[n], e=t-F.t0; if(e>2.2){ fire.splice(n,1); continue; }
          if(e<0.9){ const k=Math.sin(Math.PI*Math.min(1,e/0.9)); fl.forEach(f=>{ if(f.j.q===F.q){ f.on=Math.max(f.on,k); if(fx) for(let m=0;m<3;m++) fx.sparks.emit(f.j.x+rr(-0.2,0.2),f.j.y+0.6,f.j.z+rr(-0.2,0.2),rr(-1.6,1.6),rr(13,24),rr(-1.6,1.6),rr(0.25,0.55),0.5,0.08,1,rr(0.45,0.85),0.15,1,1.4,14); } }); }
          if(!F.shell&&e>0.35){ F.shell=true; if(fx) shells.forEach(sh=>{ if(sh.q!==F.q) return; const c=cols[Math.floor(Math.random()*cols.length)], hy=sh.y+rr(15,22); for(let m=0;m<70;m++){ const a=Math.random()*TAU, b=Math.acos(2*Math.random()-1), sp=rr(9,17); fx.sparks.emit(sh.x,hy,sh.z,Math.sin(b)*Math.cos(a)*sp,Math.cos(b)*sp,Math.sin(b)*Math.sin(a)*sp,rr(0.7,1.3),0.55,0.05,c[0],c[1],c[2],1,1.6,7); } }); } }
        fl.forEach(f=>{ const k=f.on||0; f.a.material.opacity=0.85*k; f.b.material.opacity=0.9*k; const s1=2.6+6.4*k; f.a.scale.set(s1*0.8,s1*1.9,1); f.b.scale.set(1.4+2*k,3+4.4*k,1); }); }); }
    // ---- hay bales on the outside of every real corner and down both sides of each jump
    { const bales=[]; for(let i=0;i<N;i+=2){ if(!vis(i)) continue; const corner=Math.abs(P.curv[i])>1/75, oj=JS.some(j=>((i-j.i0+N)%N)<Math.round((j.len+2)/P.spacing)); if(!corner&&!oj) continue;
        for(const sd of (oj?[-1,1]:[outSide(i)])){ const p=edge(i,sd,-0.75); bales.push({x:p[0],y:p[1]-0.05,z:p[2],ry:Math.atan2(P.tx[i],P.tz[i])+rr(-0.12,0.12),s:[0.85,rr(0.62,0.72),1.55],c:rnd()<0.5?0xa8802c:0x96701f}); if(corner&&rnd()<0.45) bales.push({x:p[0],y:p[1]+0.62,z:p[2],ry:Math.atan2(P.tx[i],P.tz[i])+rr(-0.3,0.3),s:[0.85,0.66,1.5],c:0x9c7624}); } }
      G.add(instanced(bg1,stdMat(0xffffff,{roughness:1}),bales,true,true)); }
    // ---- THE MUG: a 14 m black coffee mug inside the last long left-hander, steam rolling off the top
    { const i=P.idxAt(23,0), p=edge(i,-outSide(i),30), mx=p[0], mz=p[2], my=heightAt(mx,mz)-0.5; keep(mx,mz,20); const mg=new THREE.Group(); mg.position.set(mx,my,mz); G.add(mg);
      const wrap=canvasTex(2048,512,(g,w,h)=>{ g.fillStyle=BLK; g.fillRect(0,0,w,h); g.fillStyle=TAN; g.fillRect(0,26,w,10); g.fillRect(0,h-36,w,10); g.textAlign='center'; g.textBaseline='middle';
          for(let k=0;k<2;k++){ g.fillStyle=TAN; g.font='italic 250px "Racing Sans One", Impact, sans-serif'; g.fillText('BRCC',k*1024+512,210); g.fillStyle='#f2efe8'; g.font='bold 62px "Chakra Petch", sans-serif'; g.fillText('BLACK RIFLE COFFEE COMPANY',k*1024+512,388); } },{repeat:true,aniso:8});
      const body=new THREE.Mesh(new THREE.CylinderGeometry(9,7.8,14,36,1,true),new THREE.MeshStandardMaterial({map:wrap,roughness:0.35,metalness:0.1,side:THREE.DoubleSide})); body.position.y=7.6; body.castShadow=true; mg.add(body);
      const rim=new THREE.Mesh(new THREE.TorusGeometry(9,0.45,8,36),stdMat(0x1a1a1c,{roughness:0.3})); rim.rotation.x=Math.PI/2; rim.position.y=14.6; mg.add(rim);
      const coffee=new THREE.Mesh(new THREE.CircleGeometry(8.7,32),stdMat(0x2a160b,{roughness:0.15})); coffee.rotation.x=-Math.PI/2; coffee.position.y=13.4; mg.add(coffee);
      const hd=new THREE.Mesh(new THREE.TorusGeometry(4.2,1.05,8,20,Math.PI),stdMat(0x141416,{roughness:0.35})); hd.rotation.z=-Math.PI/2; hd.position.set(8.6,8,0); mg.add(hd);
      const sau=new THREE.Mesh(new THREE.CylinderGeometry(13,11,0.9,36),stdMat(0x1c1c1e,{roughness:0.35})); sau.position.y=0.45; sau.receiveShadow=true; mg.add(sau);
      const st=[]; for(let k=0;k<7;k++){ const sp=glowSprite(0xf2ead8,9,0.22); mg.add(sp); st.push({sp,ph:k/7,ox:rr(-4,4),oz:rr(-4,4)}); }
      W.updaters.push((dt,t)=>{ st.forEach(o=>{ const u=(t*0.12+o.ph)%1; o.sp.position.set(o.ox+Math.sin(u*6+o.ph*9)*2.5,15+u*17,o.oz+Math.cos(u*5+o.ph*7)*2.5); const sc=7+u*14; o.sp.scale.set(sc,sc,1); o.sp.material.opacity=0.26*Math.sin(Math.PI*u); }); }); }
    // ---- the roastery on the outside of the long sweeper: black barn, tan sign, chimney smoke, bean sacks and barrels in the yard
    { const i=P.idxAt(9,0.5), sd=outSide(i), p=edge(i,sd,30), ry=Math.atan2(-sd*P.rx[i],-sd*P.rz[i]); keep(p[0],p[2],27); const rg=new THREE.Group(); rg.position.set(p[0],heightAt(p[0],p[2])-0.4,p[2]); rg.rotation.y=ry; G.add(rg);
      const barn=new THREE.Mesh(new THREE.BoxGeometry(34,10,18),stdMat(0x1b1b1d,{roughness:0.8})); barn.position.y=5; barn.castShadow=true; rg.add(barn);
      const rf=new THREE.Mesh(new THREE.CylinderGeometry(0.01,11.2,5.5,4,1),stdMat(0x101012,{roughness:0.6,metalness:0.3})); rf.rotation.y=Math.PI/4; rf.scale.set(1.56,1,0.84); rf.position.y=12.75; rf.castShadow=true; rg.add(rf);
      const sgt=textPanelTex([{text:'BLACK RIFLE COFFEE COMPANY',font:F1s,color:TAN,y:0.3},{text:'THE ROASTERY',font:F2,color:'#f2efe8',y:0.7}],{w:1024,h:256,bg:BLK,border:TAN}); const sg=new THREE.Mesh(new THREE.PlaneGeometry(26,6.5),new THREE.MeshBasicMaterial({map:sgt})); sg.position.set(0,6.4,9.06); rg.add(sg);
      const door=new THREE.Mesh(new THREE.PlaneGeometry(7,2.6),stdMat(0x3a2a1a)); door.position.set(0,1.3,9.05); rg.add(door);
      const ch=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.3,9,10),stdMat(0x2a2a2c,{metalness:0.5})); ch.position.set(11,14.5,-3); rg.add(ch);
      const sm=[]; for(let k=0;k<5;k++){ const sp=glowSprite(0xcfc8bc,8,0.2); rg.add(sp); sm.push({sp,ph:k/5}); }
      W.updaters.push((dt,t)=>{ sm.forEach(o=>{ const u=(t*0.09+o.ph)%1; o.sp.position.set(11+u*9,19+u*20,-3+Math.sin(u*5+o.ph*8)*2); const sc=5+u*15; o.sp.scale.set(sc,sc,1); o.sp.material.opacity=0.3*Math.sin(Math.PI*u); }); });
      const sacks=[], barrels=[]; const ca=Math.cos(ry), sa=Math.sin(ry), W2=(lx,lz)=>[p[0]+lx*ca+lz*sa,p[2]-lx*sa+lz*ca];
      for(let k=0;k<26;k++){ const lx=-15+((k%9)*1.5)+rr(-0.1,0.1), lz=11.5+Math.floor(k/9)*0.2, q=W2(lx,lz+rr(0,1.2)); sacks.push({x:q[0],y:rg.position.y+Math.floor(k/9)*0.62,z:q[1],ry:ry+rr(-0.2,0.2),s:[1.35,0.6,0.85],c:k%4?0xb99864:0xa8844f}); }
      for(let k=0;k<10;k++){ const q=W2(9+((k%5)*1.5),11.5+Math.floor(k/5)*1.5); barrels.push({x:q[0],y:rg.position.y,z:q[1],s:[0.62,1.25,0.62],c:k%3?0x151517:0xb3202a}); }
      G.add(instanced(bg1,stdMat(0xffffff,{roughness:1}),sacks,true)); G.add(instanced(new THREE.CylinderGeometry(1,1,1,12).translate(0,0.5,0),stdMat(0xffffff,{roughness:0.5,metalness:0.3}),barrels,true)); }
    // ---- service park beside the start straight: black canopies with a tan valance, feather flags down both sides
    { const legs=[], roofs=[], val=[], flags=[], poles=[]; const roofG=new THREE.ConeGeometry(1,1,4,1); roofG.rotateY(Math.PI/4); roofG.translate(0,0.5,0);
      for(let k=0;k<7;k++){ const i=(N-Math.round((6+k*13)/P.spacing)+N)%N, p=edge(i,-1,9.5), ry=Math.atan2(P.tx[i],P.tz[i]), y=heightAt(p[0],p[2]); keep(p[0],p[2],7); roofs.push({x:p[0],y:y+3,z:p[2],ry,s:[4.4,1.7,4.4],c:0x151517}); val.push({x:p[0],y:y+2.62,z:p[2],ry,s:[6.1,0.4,6.1],c:k%2?0xc9a66b:0x151517});
        for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]){ const ca=Math.cos(ry), sa=Math.sin(ry); legs.push({x:p[0]+a*2.9*ca+b*2.9*sa,y,z:p[2]-a*2.9*sa+b*2.9*ca,s:[0.12,2.7,0.12],c:0x9a9a9a}); } }
      for(let i=Math.round(8/P.spacing);i<Math.round(64/P.spacing);i+=5) for(const sd of [-1,1]){ const p=edge(i,sd,2.2), y=heightAt(p[0],p[2]); poles.push({x:p[0],y,z:p[2],s:[0.08,5.6,0.08],c:0x2a2a2a}); flags.push({x:p[0],y:y+1.5,z:p[2],ry:Math.atan2(P.tx[i],P.tz[i])+Math.PI/2,i}); }
      G.add(instanced(bg1,stdMat(0xffffff,{roughness:0.6}),legs.concat(poles),false)); G.add(instanced(roofG,stdMat(0xffffff,{roughness:0.7}),roofs,true)); G.add(instanced(bg1,stdMat(0xffffff,{roughness:0.7}),val,false));
      const ft=canvasTex(128,512,(g,w,h)=>{ g.fillStyle=BLK; g.fillRect(0,0,w,h); g.fillStyle=TAN; g.fillRect(0,0,w,26); g.save(); g.translate(w/2,h/2+10); g.rotate(-Math.PI/2); g.textAlign='center'; g.textBaseline='middle'; g.font='italic 96px "Racing Sans One", Impact, sans-serif'; g.fillStyle=TAN; g.fillText('BRCC',0,0); g.restore(); });
      const fg=new THREE.PlaneGeometry(1.05,4); fg.translate(0.56,2,0); G.add(instanced(fg,new THREE.MeshBasicMaterial({map:ft,side:THREE.DoubleSide}),flags,false)); }
    // ---- a skate-park corner by the loop: two quarter pipes and a grind box (the extreme-sports village)
    if(LP){ const qp=(x,z,ry)=>{ const g=new THREE.Group(); g.position.set(x,heightAt(x,z)-0.3,z); g.rotation.y=ry; G.add(g); keep(x,z,9); const pts=[], uvs=[], ix=[], n=10, Wd=9, Rq=3.4;
        for(let k=0;k<=n;k++){ const a=k/n*Math.PI/2, y=Rq*(1-Math.cos(a)), zz=Rq*Math.sin(a); pts.push(-Wd/2,y,zz, Wd/2,y,zz); uvs.push(0,k/n*1.4,1,k/n*1.4); } for(let k=0;k<n;k++){ const a=k*2; ix.push(a,a+1,a+2,a+1,a+3,a+2); }
        const bgq=new THREE.BufferGeometry(); bgq.setAttribute('position',new THREE.Float32BufferAttribute(pts,3)); bgq.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2)); bgq.setIndex(ix); bgq.computeVertexNormals(); g.add(new THREE.Mesh(bgq,deckM));
        const back=new THREE.Mesh(new THREE.BoxGeometry(Wd,Rq,1.6),stdMat(0x1a1a1c)); back.position.set(0,Rq/2,Rq+0.8); back.castShadow=true; g.add(back); const cop=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,Wd,8),stdMat(0xc9a66b,{metalness:0.8,roughness:0.3})); cop.rotation.z=Math.PI/2; cop.position.set(0,Rq,Rq); g.add(cop); };
      const bx=LP.ex-LP.rx*(LP.D>0?26:-26)-LP.fx*8, bz=LP.ez-LP.rz*(LP.D>0?26:-26)-LP.fz*8, ry=Math.atan2(LP.fx,LP.fz); qp(bx-LP.fx*9,bz-LP.fz*9,ry); qp(bx+LP.fx*9,bz+LP.fz*9,ry+Math.PI);
      const box=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.6,6),stdMat(0x202024)); box.position.set(bx,heightAt(bx,bz)+0.1,bz); box.rotation.y=ry+0.5; G.add(box); }
    // ---- spectators behind the fences at every stunt and in the corners (standing; one in three with arms up)
    { const {bodyUp,skinUp,skinStand}=fanGeos(); const bodies=[], calm=[], cheerB=[], cheerS=[]; const shirts=[0x151517,0x151517,0xc9a66b,0xb3202a,0xf2efe8,0x3d4a2c,0x2d6fd6,0xe0ac3a,0x6a6a70], skins=[0xf1c9a5,0xe0ac82,0xc68a5c,0x9a6238,0x6b4226,0xf6d7bd];
      const spots=[]; JS.forEach(j=>{ spots.push([(j.top+Math.round((j.gap+6)/P.spacing))%N,24,0]); spots.push([(j.i0-18+N)%N,16,0]); }); if(LP){ spots.push([(LP.i0-22+N)%N,18,0],[(LP.i1+3)%N,18,0]); }
      spots.push([P.idxAt(10,0.2),22,2],[P.idxAt(12,0.2),18,2],[P.idxAt(23,0),26,2],[P.idxAt(8,0.3),16,2]);
      spots.forEach(([i0,len,mode])=>{ for(let k=0;k<len;k++){ const i=(i0+k)%N; if(!vis(i)) continue; for(const sd of (mode===0?[-1,1]:[outSide(i)])) for(let row=0;row<3;row++){ if(rnd()>0.72*Math.min(1,D+0.3)) continue; const p=edge(i,sd,1.4+row*1.1+rr(-0.2,0.2)); const x=p[0]+P.tx[i]*rr(-0.8,0.8), z=p[2]+P.tz[i]*rr(-0.8,0.8);
            const o={x,y:heightAt(x,z)-0.42+row*0.18,z,ry:Math.atan2(-sd*P.rx[i],-sd*P.rz[i])+rr(-0.4,0.4),s:rr(1.05,1.25)}, sh=shirts[Math.floor(rnd()*shirts.length)], sk=skins[Math.floor(rnd()*skins.length)];
            if(rnd()<0.33){ cheerB.push(Object.assign({c:sh},o)); cheerS.push(Object.assign({c:sk},o)); } else { bodies.push(Object.assign({c:sh},o)); calm.push(Object.assign({c:sk},o)); } } } });
      const pm=new THREE.MeshStandardMaterial({color:0xd6d6d6,vertexColors:true,roughness:0.85}); G.add(instanced(bodyUp,pm,bodies,true)); G.add(instanced(skinStand,pm,calm,false));
      const cg=new THREE.Group(); cg.add(instanced(bodyUp,pm,cheerB,true)); cg.add(instanced(skinUp,pm,cheerS,false)); G.add(cg); W.updaters.push((dt,t)=>{ cg.position.y=Math.abs(Math.sin(t*5))*0.14; }); W.rallyStats={fans:bodies.length+cheerB.length}; }
    // ---- sponsor boards on legs
    { const b1=P.idxAt(8,0.2), b2=P.idxAt(11,0.6), b3=P.idxAt(22,0.4), b4=P.idxAt(17,0.5);
      billboard(b1,outSide(b1),9,[{text:'BLACK RIFLE',font:F2,color:TAN,y:0.3},{text:'COFFEE COMPANY',font:F1,color:'#f2efe8',y:0.6},{text:'FRESH ROASTED · FULL SEND',font:'bold 44px "Chakra Petch", sans-serif',color:RED,y:0.86}],BLK,8);
      billboard(b2,outSide(b2),9,[{text:'BRCC',font:'italic 260px "Racing Sans One", Impact, sans-serif',color:BLK,y:0.44},{text:'BLACK RIFLE COFFEE COMPANY',font:'bold 56px "Chakra Petch", sans-serif',color:BLK,y:0.84}],TAN,8);
      billboard(b3,outSide(b3),9,[{text:'FUELED BY',font:F1,color:'#f2efe8',y:0.3},{text:'DARK ROAST',font:'italic 170px "Racing Sans One", Impact, sans-serif',color:TAN,y:0.64}],BLK,8);
      billboard(b4,outSide(b4),9,[{text:'SEND IT',font:'italic 230px "Racing Sans One", Impact, sans-serif',color:'#f2efe8',y:0.42},{text:'BLACK RIFLE RALLYCROSS',font:'bold 60px "Chakra Petch", sans-serif',color:TAN,y:0.84}],RED,8); }
    // ---- the forest: pines close to the stage and thick beyond it, rocks and log piles in between
    { const dark=coneTreeGeo(0x0d2a12), light=coneTreeGeo(0x16401a); const near=scatter(340,5,90,6,(x,y,z)=>({x,y:y-0.3,z,ry:rnd()*TAU,s:rr(2.2,4.4)})), far=areaScatter(300,34,(x,y,z)=>({x,y:y-0.3,z,ry:rnd()*TAU,s:rr(3,5.6)}));
      const all=near.concat(far).filter(t=>!(W.rk||[]).some(k=>Math.hypot(t.x-k[0],t.z-k[1])<k[2])); G.add(instanced(dark,vcMat,all.filter((t,k)=>k%2===0),true)); G.add(instanced(light,vcMat,all.filter((t,k)=>k%2===1),true));
      const rocks=scatter(70,2.5,40,3,(x,y,z)=>(W.rk||[]).some(k=>Math.hypot(x-k[0],z-k[1])<k[2])?null:{x,y:y-0.3,z,ry:rnd()*TAU,s:[rr(0.8,2.6),rr(0.6,1.8),rr(0.8,2.6)],c:0x77726a}); G.add(instanced(rockGeo(5),stdMat(0xffffff,{roughness:1,flatShading:true}),rocks,true)); }
  }
  if(def.theme==='oval'){
    // ===== PEPPERBOX RACEWAY: a short-track oval. Outside = +lat (left turns only), infield = -lat. =====
    const ribbon=H.ribbon, notGap=H.notGap, N=P.N, out=(i,d)=>ptAt(i,P.wr[i]+d,0), inn=(i,d)=>ptAt(i,-(P.wl[i]+d),0);
    const front=i=>Math.abs(P.curv[i])<0.002&&P.x[i]<20, back=i=>Math.abs(P.curv[i])<0.002&&P.x[i]>60;
    // ---- catch fence on the outside wall: chain link (alpha-tested), posts, a cable on top
    { const ft=canvasTex(128,128,(g,w,h)=>{ g.clearRect(0,0,w,h); g.strokeStyle='rgba(205,210,215,0.95)'; g.lineWidth=2.2; for(let k=-h;k<w+h;k+=16){ g.beginPath(); g.moveTo(k,0); g.lineTo(k+h,h); g.stroke(); g.beginPath(); g.moveTo(k+h,0); g.lineTo(k,h); g.stroke(); }
        g.fillStyle='rgba(190,195,200,1)'; g.fillRect(0,0,w,5); g.fillRect(0,h-5,w,5); },{repeat:true});
      const fm=new THREE.MeshBasicMaterial({map:ft,alphaTest:0.5,side:THREE.DoubleSide,color:0xc8ccd0});
      G.add(new THREE.Mesh(ribbon(notGap,i=>P.wr[i]+0.5,i=>P.wr[i]+0.2,th.wallH,5.2,0,1,2.6),fm));
      const posts=[]; for(let i=0;i<N;i+=5){ const p=out(i,0.55); posts.push({x:p[0],y:p[1],z:p[2],s:[0.14,5.3,0.14]}); }
      const pg=new THREE.BoxGeometry(1,1,1); pg.translate(0,0.5,0); G.add(instanced(pg,stdMat(0x8a9096,{metalness:0.6,roughness:0.4}),posts,false)); }
    // ---- grandstands all the way round: one instanced stand; the crowd is instanced people (shirt + cap in a team colour, legs,
    //      head and arms in skin tones). About one in four is on their feet with their arms up, bobbing.
    { const ROWS=9, WD=26, steps=[]; for(let r=0;r<ROWS;r++){ const b=new THREE.BoxGeometry(WD,0.95,1.5); b.translate(0,1.6+r*0.95,r*1.5+0.75); steps.push(b); }
      const base=new THREE.BoxGeometry(WD,1.6,ROWS*1.5); base.translate(0,0.8,ROWS*0.75); steps.push(base); const backW=new THREE.BoxGeometry(WD,3.2,0.4); backW.translate(0,1.6+ROWS*0.95+1.2,ROWS*1.5); steps.push(backW);
      const {bodySit,skinSit,bodyUp,skinUp}=fanGeos();
      const shirts=[0xec6228,0xec6228,0xff2e97,0x22a8e4,0xffd23f,0xf2f2f2,0x26262c,0xd8262b,0x2d6fd6,0x7d3fb0,0xf39c12,0x2faa5a], skins=[0xf1c9a5,0xe0ac82,0xc68a5c,0x9a6238,0x6b4226,0xf6d7bd];
      const stands=[], sitB=[], sitS=[], upB=[[],[]], upS=[[],[]]; const gsI=Math.round(26/P.spacing), SC=1.18;
      for(let i=0;i<N;i+=14){ let di=Math.abs(i-gsI); di=Math.min(di,N-di); if(di<24) continue;                                  // the main grandstand (GLB) stands at the start
        const d=9+(front(i)||back(i)?0:1.5); const p=out(i,d), ry=Math.atan2(P.rx[i],P.rz[i]);
        stands.push({x:p[0],y:p[1]-0.3,z:p[2],ry,c:0x8f8c86});
        const ca=Math.cos(ry), sa=Math.sin(ry); for(let r=0;r<ROWS;r++) for(let q=0;q<24;q++){ if(rnd()>0.56*Math.min(1,D+0.25)) continue; const lx=(q-11.5)*1.06+rr(-0.15,0.15), lz=r*1.5+0.95+rr(-0.08,0.08), ly=1.6+r*0.95+0.475-0.24;
          const o={x:p[0]+lx*ca+lz*sa,y:p[1]-0.3+ly,z:p[2]-lx*sa+lz*ca,ry:ry+rr(-0.25,0.25),s:SC*rr(0.92,1.08)}; const sh=shirts[Math.floor(rnd()*shirts.length)], sk=skins[Math.floor(rnd()*skins.length)];
          if(rnd()<0.24){ const k=rnd()<0.5?0:1; upB[k].push(Object.assign({c:sh},o)); upS[k].push(Object.assign({c:sk},o)); } else { sitB.push(Object.assign({c:sh},o)); sitS.push(Object.assign({c:sk},o)); } } }
      G.add(instanced(mergeGeos(steps),stdMat(0xffffff,{roughness:0.9}),stands,true,true));
      const pm=new THREE.MeshStandardMaterial({color:0xd6d6d6,vertexColors:true,roughness:0.85});
      G.add(instanced(bodySit,pm,sitB,false)); G.add(instanced(skinSit,pm,sitS,false));
      const fans=[0,1].map(k=>{ const g=new THREE.Group(); g.add(instanced(bodyUp,pm,upB[k],false)); g.add(instanced(skinUp,pm,upS[k],false)); G.add(g); return g; });
      W.updaters.push((dt,t)=>{ fans[0].position.y=Math.abs(Math.sin(t*5.2))*0.16; fans[1].position.y=Math.abs(Math.sin(t*4.3+1.3))*0.16; });
      W.ovalStats={stands:stands.length,crowd:sitB.length+upB[0].length+upB[1].length}; }
    // ---- light towers: four outside the turns, two in the infield (lamps glow; no real lights)
    { const pole=new THREE.CylinderGeometry(0.35,0.55,30,8); pole.translate(0,15,0); const rack=new THREE.BoxGeometry(7,2.6,0.6); rack.translate(0,30.5,0); const poles=[], glows=[];
      [0.185,0.315,0.685,0.815].forEach(f=>{ const i=Math.round(f*N)%N; const p=out(i,30); poles.push({x:p[0],y:p[1],z:p[2],ry:Math.atan2(P.rx[i],P.rz[i])}); glows.push([p[0]-P.rx[i]*0.6,31,p[2]-P.rz[i]*0.6]); });
      [[68,62],[68,-62]].forEach(([x,z],k)=>{ poles.push({x,y:0,z,ry:k?0:Math.PI}); glows.push([x,31,z]); });
      G.add(instanced(mergeGeos([pole,rack]),stdMat(0x70757c,{metalness:0.5,roughness:0.5}),poles,true));
      glows.forEach(g=>{ const sp=glowSprite(0xfff1d0,16,0.9); sp.position.set(g[0],g[1],g[2]); G.add(sp); const lm=new THREE.Mesh(new THREE.PlaneGeometry(6.4,2.1),new THREE.MeshBasicMaterial({color:0xfff6dc,side:THREE.DoubleSide})); lm.position.set(g[0],30.5,g[2]); lm.lookAt(68,10,0); G.add(lm); }); }
    // ---- infield: pit road with stalls along the front straight, pit boxes, haulers, the logo mown into the grass, scoring pylon
    { const pitT=canvasTex(256,256,(g,w,h)=>{ noiseFill(g,w,h,'#505056',18); g.fillStyle='#ffd23f'; g.fillRect(0,0,6,h); g.fillStyle='#f2f2f2'; g.fillRect(w-70,0,3,h); g.fillRect(w-70,0,70,3); g.fillRect(w-70,h/2,70,3); },{repeat:true});
      const pit=new THREE.Mesh(ribbon((i,j)=>front(i)&&front(j),i=>-(P.wl[i]+3),i=>-(P.wl[i]+15),0.03,0.03,0,1,12),new THREE.MeshStandardMaterial({map:pitT,roughness:0.9})); pit.receiveShadow=true; G.add(pit);
      const boxes=[], tires=[]; const bc=[0xd8262b,0x1c3f8f,0xffd23f,0x1a1a1a,0x2ecc71,0xff7a1a,0xffffff,0x8e44ad]; let k=0;
      for(let i=0;i<N;i+=6){ if(!front(i)) continue; const p=inn(i,17.5), ry=Math.atan2(P.tx[i],P.tz[i]); boxes.push({x:p[0],y:p[1],z:p[2],ry,s:[2.2,2.1,3.2],c:bc[k++%bc.length]}); const q=inn(i,16.2); tires.push({x:q[0]+P.tx[i]*2.6,y:q[1],z:q[2]+P.tz[i]*2.6,s:[0.8,rr(0.9,1.5),0.8],c:0x18181a}); }
      const bg=new THREE.BoxGeometry(1,1,1); bg.translate(0,0.5,0); G.add(instanced(bg,stdMat(0xffffff,{roughness:0.6}),boxes,true)); G.add(instanced(new THREE.CylinderGeometry(0.5,0.5,1,10).translate(0,0.5,0),stdMat(0xffffff,{roughness:0.95}),tires,false));
      const haul=[]; [[52,-34],[60,-34],[68,-34],[76,-34],[84,-34],[52,40],[60,40],[68,40]].forEach(([x,z],q)=>{ haul.push({x,y:0,z,s:[3,4.1,16],c:bc[(q*3+1)%bc.length]}); haul.push({x,y:0,z:z+(z<0?-10.2:10.2),s:[2.8,3.2,3.6],c:0xe8e8e8}); });
      G.add(instanced(bg,stdMat(0xffffff,{roughness:0.5,metalness:0.1}),haul,true));
      const lt=textPanelTex([{text:'PEPPERBOX RACEWAY',font:'italic 118px "Racing Sans One", Impact, sans-serif',color:'#f4f4ee',y:0.52}],{w:1024,h:256,bg:'rgba(0,0,0,0)'});
      const logo=new THREE.Mesh(new THREE.PlaneGeometry(74,18.5),new THREE.MeshBasicMaterial({map:lt,transparent:true,opacity:0.82,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2})); logo.rotation.set(-Math.PI/2,0,Math.PI/2); logo.position.set(96,0.1,0); G.add(logo);
      const pyT=canvasTex(64,512,(g,w,h)=>{ g.fillStyle='#101014'; g.fillRect(0,0,w,h); g.font='bold 44px "Chakra Petch", sans-serif'; g.textAlign='center'; g.textBaseline='middle'; ['76','40','69','15','1','22','8','47','3','11'].forEach((t,q)=>{ g.fillStyle=q<3?'#ffd23f':'#f4f4f4'; g.fillText(t,w/2,28+q*50); }); });
      const pym=new THREE.MeshBasicMaterial({map:pyT}), dk=stdMat(0x15151a); const py=new THREE.Mesh(new THREE.BoxGeometry(2.4,20,2.4),[pym,pym,dk,dk,pym,pym]); py.position.set(40,10,0); G.add(py);
      const cap=new THREE.Mesh(new THREE.BoxGeometry(3,1.2,3),new THREE.MeshBasicMaterial({color:0xec6228})); cap.position.set(40,20.6,0); G.add(cap); }
    // ---- sponsors: the Pepperbox shows on banners along the catch fence and the pit wall (one atlas, three rows of eleven panels)
    { const sp=new THREE.TextureLoader().load('models/props/pepperbox/sponsors.jpg?v=1'); GFX.compat.srgb(sp); sp.wrapS=THREE.RepeatWrapping; sp.anisotropy=8;
      const bm=new THREE.MeshBasicMaterial({map:sp,side:THREE.DoubleSide}); const PANEL=4.4, STRIP=PANEL*11, third=Math.ceil(N/3);
      const band=(inc,lat,y0,y1,row,flip)=>{ const g=ribbon(inc,lat,lat,y0,y1,1-(row+1)*0.25,1-row*0.25,STRIP); const uv=g.attributes.uv; for(let k=0;k<uv.count;k++){ const u=uv.getX(k); uv.setXY(k,flip?-uv.getY(k):uv.getY(k),u); } return new THREE.Mesh(g,bm); };
      for(let r=0;r<3;r++){ const inc=(i,j)=>notGap(i,j)&&Math.floor(i/third)===r; G.add(band(inc,i=>P.wr[i]+0.16,th.wallH+0.08,th.wallH+1.5,r,true)); }
      G.add(band((i,j)=>front(i)&&front(j),i=>-(P.wl[i]+2.9),0.35,1.75,1,false)); }
    // ---- the big sign over the back straight and Pepperbox TV on the pylon
    { const lg=new THREE.TextureLoader().load('models/props/pepperbox/pepperbox_tv.png?v=1'); GFX.compat.srgb(lg); const lm=new THREE.MeshBasicMaterial({map:lg,transparent:true});
      const i=Math.round(0.5*N)%N, p=out(i,26), ry=Math.atan2(-P.rx[i],-P.rz[i]); const sg=new THREE.Group(); sg.position.set(p[0],0,p[2]); sg.rotation.y=ry; G.add(sg);
      const bd=new THREE.Mesh(new THREE.BoxGeometry(46,10,0.6),stdMat(0x121216,{roughness:0.6})); bd.position.y=22; sg.add(bd); const rim=new THREE.Mesh(new THREE.BoxGeometry(47,11,0.4),new THREE.MeshBasicMaterial({color:0xec6228})); rim.position.set(0,22,-0.15); sg.add(rim);
      const face=new THREE.Mesh(new THREE.PlaneGeometry(40,7.2),lm); face.position.set(0,23,0.32); sg.add(face);
      const rt=textPanelTex([{text:'R A C E W A Y',font:'bold 150px "Chakra Petch", sans-serif',color:'#f4f4ee',y:0.55}],{w:1024,h:160,bg:'rgba(0,0,0,0)'}); const rw=new THREE.Mesh(new THREE.PlaneGeometry(20,3.1),new THREE.MeshBasicMaterial({map:rt,transparent:true})); rw.position.set(0,18.6,0.33); sg.add(rw);
      [-18,0,18].forEach(x=>{ const leg=new THREE.Mesh(new THREE.BoxGeometry(0.9,17,0.9),stdMat(0x3a3d44,{metalness:0.5})); leg.position.set(x,8.5,-0.6); sg.add(leg); }); }
    // ---- Pepperbox show boards: nine on poles behind the stands, four ground boards in the infield (every one a different show)
    { const place=(id,x,z,nx,nz)=>{ const o=makeProp(id); if(!o) return; pbFace(o); o.position.set(x,-0.3,z); o.rotation.y=Math.atan2(nx,nz); G.add(o); (W.props=W.props||[]).push({id,x,z,y:0,ang:o.rotation.y,i:hash(x,z,8).i}); };
      [0.10,0.25,0.39,0.565,0.63,0.75,0.89,0.96].forEach(f=>{ const i=Math.round(f*N)%N, p=out(i,37); place('pbpole',p[0],p[2],-P.rx[i]*0.86-P.tx[i]*0.5,-P.rz[i]*0.86-P.tz[i]*0.5); });
      [[44,58,-0.7,-0.7],[44,-78,-0.7,-0.7],[96,-58,0.7,0.7],[96,78,0.7,0.7]].forEach(([x,z,nx,nz])=>place('pbboard',x,z,nx,nz)); }
    // ---- a ring of trees and a few camper lots beyond the stands
    { const trees=areaScatter(170,58,(x,y,z)=>{ const hi=hash(x,z,7); if(hi.i>=0){ const lat=(x-P.x[hi.i])*P.rx[hi.i]+(z-P.z[hi.i])*P.rz[hi.i]; if(lat<0||hi.d<P.wr[hi.i]+46) return null; } if(!freeOfProps(x,z,4)) return null; return {x,y,z,ry:rnd()*TAU,s:rr(2.4,4.6)}; });
      G.add(instanced(coneTreeGeo(0x2f6a34),vcMat,trees,true)); }
  }
  if(def.theme==='night'){
    W.rain=true;
    if(!(W.env&&W.env.skipScenery)){
    const wf=new THREE.MeshStandardMaterial({map:facadeTex('warehouse'),emissiveMap:facadeTex('warehouseE'),emissive:0xffffff,emissiveIntensity:0.9,roughness:0.7,metalness:0.4}); const wr=stdMat(0x22242c,{metalness:0.5});
    const wh=scatter(70,10,70,6,(x,y,z,i,sd)=>{ const ang=Math.atan2(P.tx[i],P.tz[i]); const w=rr(20,38),d=rr(16,28); if(!freeOfProps(x,z,Math.max(w,d)/2)) return null; const h=rr(9,18); if(!footprintClear(x,z,ang,w,d,5)) return null; return {x,y:y-0.2,z,ry:ang,s:[w,h,d],c:pick([0xffffff,0xcfd6ff,0xffd9e8,0xd0fff5])}; });
    const bg=new THREE.BoxGeometry(1,1,1); bg.translate(0,0.5,0); G.add(instanced(bg,[wf,wf,wr,wr,wf,wf],wh,true,true));
    // neon signs on warehouse fronts
    const words=[["RYDEN'S",'#ff2e97'],['OPEN 24/7','#22e4ff'],['FOUNDRY 47','#ffb000'],['PLASMA','#b65cff'],['GLAZE EM','#ff4fb0'],['NIGHT SHIFT','#22e4ff']];
    wh.slice(0,Math.min(18,wh.length)).forEach((b,k)=>{ const [txt,col]=words[k%words.length]; const tex=textPanelTex([{text:txt,font:'italic bold 150px "Racing Sans One",Impact',color:col,glow:col,y:0.55}],{w:1024,h:256,bg:'rgba(0,0,0,0)'});
      const m=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(16,b.s[0]*0.7),4),new THREE.MeshBasicMaterial({map:tex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
      const fx=Math.sin(b.ry+Math.PI/2), fz=Math.cos(b.ry+Math.PI/2); const toRoad=hash(b.x,b.z,4); const sign=toRoad.i>=0&&((P.x[toRoad.i]-b.x)*fx+(P.z[toRoad.i]-b.z)*fz)>0?1:-1;
      m.position.set(b.x+fx*sign*(b.s[0]/2+0.1),b.y+b.s[1]*0.7,b.z+fz*sign*(b.s[0]/2+0.1)); m.rotation.y=b.ry+Math.PI/2+(sign<0?Math.PI:0); G.add(m); });
    // smokestacks
    W.smoke=[]; const stackM=stdMat(0x5a5a62,{metalness:0.4}); const bandM=stdMat(0xc0392b);
    areaScatter(10,40,(x,y,z)=>{ const h=rr(35,60); const s=new THREE.Mesh(new THREE.CylinderGeometry(1.8,2.8,h,14),stackM); s.position.set(x,y+h/2,z); s.castShadow=true; G.add(s);
      const b=new THREE.Mesh(new THREE.CylinderGeometry(1.85,1.95,2.5,14),bandM); b.position.set(x,y+h-3,z); G.add(b); const l=glowSprite(0xff2020,5,0.9); l.position.set(x,y+h+0.5,z); G.add(l); W.updaters.push((dt,t)=>l.material.opacity=(Math.sin(t*3+x)>0)?0.95:0.15);
      W.smoke.push([x,y+h+1,z]); return {}; });
    // blast furnace landmark
    { const i=P.cpIdx[7]; const e=P.wr[i]+26; const x=P.x[i]+P.rx[i]*e, z=P.z[i]+P.rz[i]*e, y=heightAt(x,z); const grp=new THREE.Group(); grp.position.set(x,y,z); G.add(grp);
      const body=new THREE.Mesh(new THREE.CylinderGeometry(7,9,30,20),stdMat(0x3b3b44,{metalness:0.6,roughness:0.5})); body.position.y=15; body.castShadow=true; grp.add(body);
      const top=new THREE.Mesh(new THREE.ConeGeometry(7,8,20),stdMat(0x2e2e36,{metalness:0.6})); top.position.y=34; grp.add(top);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(9.2,0.6,8,32),new THREE.MeshBasicMaterial({color:0xff7a18})); ring.rotation.x=Math.PI/2; ring.position.y=4; grp.add(ring);
      const mouth=new THREE.Mesh(new THREE.BoxGeometry(6,5,0.5),new THREE.MeshBasicMaterial({color:0xffa030})); mouth.position.set(0,3,-8.6); grp.add(mouth);
      const gl=glowSprite(0xff7a18,40,0.8); gl.position.y=6; grp.add(gl); W.updaters.push((dt,t)=>{ gl.material.opacity=0.6+0.2*Math.sin(t*5)+0.1*Math.sin(t*13); });
      const pipe=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.4,40,10),stdMat(0x55555e,{metalness:0.5})); pipe.rotation.z=Math.PI/2.6; pipe.position.set(-16,26,0); grp.add(pipe); W.smoke.push([x,y+38,z]); }
    // harbor crane spanning the track
    { const i=P.idxAt(13,0.6); const e=Math.max(P.wl[i],P.wr[i])+4; const grp=new THREE.Group(); grp.position.set(P.x[i],P.y[i],P.z[i]); grp.rotation.y=Math.atan2(P.tx[i],P.tz[i]); G.add(grp);
      const ym=stdMat(0xf2b705,{metalness:0.4,roughness:0.5});
      [-1,1].forEach(s=>[-5,5].forEach(zz=>{ const l=new THREE.Mesh(new THREE.BoxGeometry(1,24,1),ym); l.position.set(s*e,12,zz); l.castShadow=true; grp.add(l); }));
      const beam=new THREE.Mesh(new THREE.BoxGeometry(e*2+2,2.2,12),ym); beam.position.y=24; beam.castShadow=true; grp.add(beam);
      const boom=new THREE.Mesh(new THREE.BoxGeometry(2,2,70),ym); boom.position.set(0,30,-10); grp.add(boom);
      const cab=new THREE.Mesh(new THREE.BoxGeometry(4,3,4),stdMat(0x222222)); cab.position.set(e-2,21.5,0); grp.add(cab);
      [-e,e].forEach(px=>{ const l=glowSprite(0xff3030,4); l.position.set(px,25.5,0); grp.add(l); }); }
    // street lamps with light pools
    const lamps=[],pools=[]; for(let i=0;i<P.N;i+=20){ if(P.gap[i]) continue; const sd=(Math.floor(i/20)%2)?1:-1; const e=(sd<0?P.wl[i]:P.wr[i])+0.8; const x=P.x[i]+P.rx[i]*e*sd, z=P.z[i]+P.rz[i]*e*sd; lamps.push({x,y:P.y[i]-0.5,z,ry:Math.atan2(-P.rx[i]*sd,-P.rz[i]*sd)});
      const q=ptAt(i,sd*(e-4),0.07); pools.push({x:q[0],y:q[1],z:q[2],rx:-Math.PI/2,s:14}); }
    const lp=new THREE.CylinderGeometry(0.12,0.16,9,6); lp.translate(0,4.5,0); const la=new THREE.BoxGeometry(0.25,0.25,3.2); la.translate(0,9,1.5); G.add(instanced(mergeGeos([lp,la]),stdMat(0x2a2a30,{metalness:0.7}),lamps));
    const head=new THREE.BoxGeometry(0.9,0.12,0.5); head.translate(0,8.85,3); G.add(instanced(head,new THREE.MeshBasicMaterial({color:0xffc98a}),lamps,false));
    G.add(instanced(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:glowTex(),color:0xff9c50,transparent:true,opacity:0.35,blending:THREE.AdditiveBlending,depthWrite:false}),pools,false));
    // canal water
    W.nat.channels.forEach(c=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(22,840),new THREE.MeshStandardMaterial({color:0x0a1a2a,roughness:0.1,metalness:0.6,emissive:0x0a1030})); m.rotation.x=-Math.PI/2; m.rotation.z=Math.atan2(c.dx,c.dz); m.rotation.order='YXZ'; m.rotation.set(-Math.PI/2,Math.atan2(c.dx,c.dz),0); m.position.set(c.x,c.y-7,c.z); G.add(m); });
    // industrial pipes along a section
    const pipes=[]; for(let i=P.cpIdx[14];i<P.cpIdx[19];i+=5){ const e=P.wr[i]+3; const p=ptAt(i,e,0); pipes.push({x:p[0],y:p[1]+2.4,z:p[2],ry:Math.atan2(P.tx[i],P.tz[i]),rx:Math.PI/2,s:[1,11,1]}); }
    G.add(instanced(new THREE.CylinderGeometry(0.6,0.6,1,10),stdMat(0x6c6f78,{metalness:0.7,roughness:0.35}),pipes));
    // skyline ring
    const tw=facadeTex('tower'); const towers=[]; for(let k=0;k<70;k++){ const a=k/70*TAU+rr(-0.03,0.03); const r=rr(700,900); towers.push({x:W.nat.cx+Math.sin(a)*r,y:0,z:W.nat.cz+Math.cos(a)*r,ry:rnd(),s:[rr(25,50),rr(50,200),rr(25,50)]}); }
    const tg=new THREE.BoxGeometry(1,1,1); tg.translate(0,0.5,0); tw.repeat.set(2,3); G.add(instanced(tg,new THREE.MeshStandardMaterial({color:0x14142a,emissive:0xffffff,emissiveMap:tw,emissiveIntensity:0.8,roughness:0.6}),towers,false));
    billboard(P.cpIdx[3],-1,8,[{text:'NEON FOUNDRY',font:'italic bold 130px "Racing Sans One",Impact',color:'#ff2e97',glow:'#ff2e97',y:0.4},{text:'NIGHTS',font:'bold 110px "Racing Sans One"',color:'#22e4ff',glow:'#22e4ff',y:0.75}],'#0d0620');
  }
  }
}

// ===== HONKY TONK HIGHWAY: Yee-Haw Creek Jump =====
function buildDukesJump(W,def,P,j,heightAt,stdMat){
  const G=new THREE.Group(); W.group.add(G); const N=P.N; const gl=Math.round(j.gap/P.spacing);
  const plank=canvasTex(128,256,(c,w,h)=>{ noiseFill(c,w,h,'#9b7448',22); c.fillStyle='rgba(50,28,12,0.75)'; for(let y=0;y<h;y+=21) c.fillRect(0,y,w,2); c.fillStyle='rgba(30,16,6,0.6)'; for(let y=0;y<h;y+=21){ c.fillRect(8,y+8,3,3); c.fillRect(w-12,y+8,3,3); } },{repeat:true});
  const woodM=new THREE.MeshStandardMaterial({map:plank,roughness:0.85,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  const beamM=stdMat(0x6b4a2c), steelM=new THREE.MeshStandardMaterial({color:0x8a8f96,metalness:0.6,roughness:0.4});
  const i0=j.i0, top=j.top;
  // plank deck over the ramp + side skirts down to the ground
  const ribbon=(ia,ib,la,lb,ya,yb,mat)=>{ const pos=[],uv=[]; for(let i=ia;i<ib;i++){ const a=i%N,b=(i+1)%N; const q=(ii,lat,dy)=>[P.x[ii]+P.rx[ii]*lat(ii),dy(ii),P.z[ii]+P.rz[ii]*lat(ii)];
      const A=q(a,la,ya),B=q(a,lb,yb),C=q(b,lb,yb),D=q(b,la,ya); const v0=(i-ia)*P.spacing/3, v1=(i+1-ia)*P.spacing/3; pos.push(...A,...B,...C,...A,...C,...D); uv.push(0,v0,1,v0,1,v1,0,v0,1,v1,0,v1); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.computeVertexNormals(); const m=new THREE.Mesh(g,mat); m.receiveShadow=true; m.castShadow=true; G.add(m); return m; };
  ribbon(i0-2,top+1,i=>-P.w[i]/2-0.6,i=>P.w[i]/2+0.6,i=>P.y[i]+0.03,i=>P.y[i]+0.03,woodM);
  [-1,1].forEach(sd=>{ const e=i=>sd*(P.w[i]/2+0.6); ribbon(i0,top+1,e,e,i=>P.y[i]+0.25,i=>Math.min(P.y[i]-0.3,heightAt(P.x[i]+P.rx[i]*e(i),P.z[i]+P.rz[i]*e(i))-0.4),woodM);
    // guard rail timbers along the ramp edges
    for(let i=i0;i<=top;i+=2){ const x=P.x[i]+P.rx[i]*sd*(P.w[i]/2+0.5), z=P.z[i]+P.rz[i]*sd*(P.w[i]/2+0.5); const post=new THREE.Mesh(new THREE.BoxGeometry(0.25,1.1,0.25),beamM); post.position.set(x,P.y[i]+0.55,z); G.add(post); } });
  // trestle under the lip: timber bents with cross bracing, sitting in the creek bank
  for(let k=0;k<4;k++){ const i=(top-k*2+N)%N; const gy=Math.min(P.y[i]-0.2,heightAt(P.x[i],P.z[i]))-1.5, hh=P.y[i]-gy;
    [-0.42,-0.14,0.14,0.42].forEach(f=>{ const lat=f*P.w[i]; const c=new THREE.Mesh(new THREE.BoxGeometry(0.45,hh,0.45),beamM); c.position.set(P.x[i]+P.rx[i]*lat,gy+hh/2,P.z[i]+P.rz[i]*lat); c.castShadow=true; G.add(c); });
    const x=new THREE.Mesh(new THREE.BoxGeometry(P.w[i]*0.9,0.3,0.3),beamM); x.position.set(P.x[i],gy+hh*0.55,P.z[i]); x.rotation.y=Math.atan2(P.rx[i],P.rz[i])-Math.PI/2; G.add(x); }
  // lip flags (orange + checkered) and landing flags on the far bank
  const flagTex=canvasTex(64,48,(c,w,h)=>{ for(let x=0;x<8;x++)for(let y=0;y<6;y++){ c.fillStyle=(x+y)%2?'#111':'#f4f4f4'; c.fillRect(x*8,y*8,8,8); } });
  const flag=(i,sd,lat,orange)=>{ const x=P.x[i]+P.rx[i]*sd*lat, z=P.z[i]+P.rz[i]*sd*lat, y=Math.max(P.y[i],heightAt(x,z)); const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,4.2,5),steelM); pole.position.set(x,y+2.1,z); G.add(pole);
    const f=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.1),orange?stdMat(0xff7a1a,{side:THREE.DoubleSide}):new THREE.MeshStandardMaterial({map:flagTex,side:THREE.DoubleSide})); f.position.set(x+P.tx[i]*0.85,y+3.6,z+P.tz[i]*0.85); f.rotation.y=Math.atan2(P.rx[i],P.rz[i]); G.add(f); };
  [-1,1].forEach(sd=>{ flag(top,sd,P.w[top]/2+1.4,false); flag((top-6+N)%N,sd,P.w[top]/2+1.6,true); flag((top+gl+2)%N,sd,P.w[(top+gl+2)%N]/2+1.6,true); flag((top+gl+6)%N,sd,P.w[(top+gl+6)%N]/2+1.6,false); });
  // hay bales: round bales along the approach, a stacked wall at the landing
  const hayTex=canvasTex(128,64,(c,w,h)=>{ noiseFill(c,w,h,'#d8b35a',30); c.strokeStyle='rgba(120,90,30,0.5)'; for(let y=4;y<h;y+=6){ c.beginPath(); c.moveTo(0,y); c.lineTo(w,y+Math.random()*3); c.stroke(); } },{repeat:true});
  const hayM=new THREE.MeshStandardMaterial({map:hayTex,roughness:1}); const round=new THREE.CylinderGeometry(0.85,0.85,1.3,12); round.rotateZ(Math.PI/2); const sq=new THREE.BoxGeometry(1.2,0.6,0.6);
  const bales=[];
  [-1,1].forEach(sd=>{ for(let k=-26;k<-4;k+=3){ const i=(i0+k+N)%N; const e=(sd<0?P.wl[i]:P.wr[i])+1.4; const x=P.x[i]+P.rx[i]*e*sd, z=P.z[i]+P.rz[i]*e*sd; const b=new THREE.Mesh(round,hayM); b.position.set(x,heightAt(x,z)+0.8,z); b.rotation.y=Math.atan2(P.tx[i],P.tz[i]); b.castShadow=true; G.add(b); }
    for(let k=gl+3;k<gl+14;k+=2){ const i=(top+k)%N; const e=(sd<0?P.wl[i]:P.wr[i])+1.3; for(let r=0;r<3;r++){ const x=P.x[i]+P.rx[i]*e*sd, z=P.z[i]+P.rz[i]*e*sd; const b=new THREE.Mesh(sq,hayM); b.position.set(x,heightAt(x,z)+0.3+r*0.6,z); b.rotation.y=Math.atan2(P.tx[i],P.tz[i])+Math.PI/2+(r%2)*0.1; b.castShadow=true; G.add(b); } } });
  // hand-painted plank sign on the approach (left side), facing oncoming cars
  { const i=(i0-22+N)%N, sd=-1, e=P.wl[i]+4.5; const x=P.x[i]+P.rx[i]*e*sd, z=P.z[i]+P.rz[i]*e*sd, y=heightAt(x,z);
    const tex=canvasTex(1024,512,(c,w,h)=>{ noiseFill(c,w,h,'#a7784a',26); c.fillStyle='rgba(60,32,14,0.6)'; for(let yy=0;yy<h;yy+=64) c.fillRect(0,yy,w,4);
      c.textAlign='center'; c.fillStyle='#fff7e0'; c.strokeStyle='#5a2a10'; c.lineWidth=14; c.font='bold 150px "Racing Sans One",Impact'; c.strokeText('YEE-HAW!',w/2,190); c.fillText('YEE-HAW!',w/2,190);
      c.fillStyle='#ff7a1a'; c.font='bold 92px Impact'; c.strokeText('CREEK JUMP AHEAD',w/2,330); c.fillText('CREEK JUMP AHEAD',w/2,330);
      c.fillStyle='#fff7e0'; c.font='bold 56px Impact'; c.fillText('FLOOR IT  →  FLY THE CREEK',w/2,440); });
    const grp=new THREE.Group(); grp.position.set(x,y,z); grp.rotation.y=Math.atan2(-P.tx[i],-P.tz[i]); G.add(grp);
    const face=new THREE.Mesh(new THREE.PlaneGeometry(8,4),new THREE.MeshStandardMaterial({map:tex,roughness:0.9})); face.position.y=4.2; grp.add(face);
    const back=new THREE.Mesh(new THREE.BoxGeometry(8.2,4.2,0.15),beamM); back.position.set(0,4.2,-0.1); grp.add(back);
    [-3,3].forEach(px=>{ const p=new THREE.Mesh(new THREE.BoxGeometry(0.3,6.4,0.3),beamM); p.position.set(px,3.0,-0.25); p.castShadow=true; grp.add(p); }); }
  // the General Lee, frozen mid-jump on a steel pole beside the creek (decoration only; the car stays drivable in the garage)
  if(typeof CAR_GLTF!=='undefined'&&CAR_GLTF.genlee){ const PG=processGLB('genlee'); const m=(top+Math.round(gl*0.55))%N; const sd=1; const e=P.wr[m]+6.5;
    const x=P.x[m]+P.rx[m]*e*sd, z=P.z[m]+P.rz[m]*e*sd, gy=heightAt(x,z), carY=P.y[top]+4.2;
    const car=new THREE.Group(); car.position.set(x,carY,z); car.rotation.order='YXZ'; car.rotation.set(-0.2,Math.atan2(P.tx[m],P.tz[m]),0.05);
    const mats=new Map(); const mf=mt=>{ if(!mats.has(mt)){ const c=mt.clone(); if(W.env&&W.env.envMap) c.envMap=W.env.envMap; mats.set(mt,c); } return mats.get(mt); };
    PG.body.forEach(b=>{ const o=new THREE.Mesh(b.geo,mf(b.mat)); o.castShadow=true; car.add(o); });
    PG.wheels.forEach(w=>{ const o=new THREE.Mesh(w.geo,mf(w.mat)); o.position.copy(w.c); o.castShadow=true; car.add(o); });
    car.position.y-=PG.H*0.35; G.add(car);
    const top_=carY-0.2, h=top_-gy+0.6; const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.3,h,10),steelM); pole.position.set(x,gy-0.6+h/2,z); pole.castShadow=true; G.add(pole);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.7,0.8,12),stdMat(0x9a948a)); base.position.set(x,gy+0.1,z); G.add(base);
    const plaque=canvasTex(512,128,(c,w,h)=>{ c.fillStyle='#2b1a0e'; c.fillRect(0,0,w,h); c.strokeStyle='#e0b050'; c.lineWidth=8; c.strokeRect(6,6,w-12,h-12); c.fillStyle='#f4d58a'; c.textAlign='center'; c.font='bold 54px Impact'; c.fillText('GOOD OL’ CREEK JUMP',w/2,82); });
    const pl=new THREE.Mesh(new THREE.PlaneGeometry(3.2,0.8),new THREE.MeshStandardMaterial({map:plaque,roughness:0.6})); pl.position.set(x-P.rx[m]*1.75,gy+0.5,z-P.rz[m]*1.75); pl.rotation.y=Math.atan2(-P.rx[m],-P.rz[m]); G.add(pl);
    W.dukesCar=car; }
}

// ===== HONKY TONK HIGHWAY: country scenery =====
function buildCountryScenery(W,def,P,Q,H,K){
  const G=W.group, {heightAt,clearOfRoad}=H, {scatter,areaScatter,footprintClear,stdMat,vcMat,freeOfProps}=K, D=Q.density;
  const blocked=[]; const free=(x,z,r)=>freeOfProps(x,z,r)&&!blocked.some(b=>Math.hypot(b.x-x,b.z-z)<b.r+r);
  const nat=W.nat;

  // ---------- creek ----------
  if(def.creek){ const ck=def.creek; const pts=[]; for(let k=0;k<ck.length-1;k++){ const [ax,az]=ck[k],[bx,bz]=ck[k+1]; const n=Math.ceil(Math.hypot(bx-ax,bz-az)/6); for(let q=0;q<n;q++) pts.push([lerp(ax,bx,q/n),lerp(az,bz,q/n)]); } pts.push(ck[ck.length-1]);
    const pos=[],uv=[],idx=[]; const Y=-4.6, hw=9;
    pts.forEach((p,k)=>{ const a=pts[Math.max(0,k-1)], b=pts[Math.min(pts.length-1,k+1)]; let tx=b[0]-a[0],tz=b[1]-a[1]; const l=Math.hypot(tx,tz)||1; tx/=l; tz/=l; const rx=-tz,rz=tx;
      pos.push(p[0]+rx*hw,Y,p[1]+rz*hw, p[0]-rx*hw,Y,p[1]-rz*hw); uv.push(0,k*0.25,1,k*0.25); if(k){ const o=(k-1)*2; idx.push(o,o+1,o+2,o+1,o+3,o+2); } });
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals();
    const wt=canvasTex(128,256,(c,w,h)=>{ const gr=c.createLinearGradient(0,0,w,0); gr.addColorStop(0,'#3d6b5a'); gr.addColorStop(0.5,'#5a9ab0'); gr.addColorStop(1,'#3d6b5a'); c.fillStyle=gr; c.fillRect(0,0,w,h); for(let i=0;i<80;i++){ c.fillStyle='rgba(255,255,255,0.18)'; c.fillRect(Math.random()*w,Math.random()*h,8+Math.random()*20,1.5); } },{repeat:true});
    const wm=new THREE.MeshStandardMaterial({map:wt,roughness:0.15,metalness:0.2,transparent:true,opacity:0.92,side:THREE.DoubleSide}); const water=new THREE.Mesh(g,wm); water.receiveShadow=true; G.add(water);
    W.updaters.push((dt,t)=>{ wt.offset.y=-t*0.25; });
    // river rocks along the banks
    const rocks=[]; pts.forEach((p,k)=>{ if(k%2) return; for(const sd of [-1,1]){ const x=p[0]+rr(-3,3)+sd*rr(8,12), z=p[1]+rr(-3,3); if(!clearOfRoad(x,z,3)) continue; rocks.push({x,y:heightAt(x,z)-0.3,z,ry:rnd()*TAU,s:[rr(0.8,2),rr(0.5,1.2),rr(0.8,2)],c:0x8a8278}); } });
    G.add(instanced(new THREE.DodecahedronGeometry(1,0),stdMat(0xffffff),rocks,true,true));
  }

  // ---------- Yee-Haw Creek Jump: timber stunt ramp, hay bales, flags, hand-painted sign, and the General Lee flying the creek on a pole ----------
  (def.jumps||[]).forEach(j=>{ if(!j.dukes) return; buildDukesJump(W,def,P,j,heightAt,stdMat); j.gl=Math.round(j.gap/P.spacing);
    for(let k=-6;k<j.gl+8;k++){ const i=(j.top+k+P.N)%P.N; blocked.push({x:P.x[i],z:P.z[i],r:P.w[i]/2+16}); } });

  // ---------- covered bridge over the creek (tunnel section) ----------
  (def.tunnels||[]).forEach(()=>{ const inc=(i,j)=>P.tunnel[i]&&P.tunnel[j];
    const wood=new THREE.MeshStandardMaterial({map:canvasTex(256,128,(c,w,h)=>{ noiseFill(c,w,h,'#9a2a1e',18); c.fillStyle='rgba(40,10,5,0.5)'; for(let x=0;x<w;x+=16) c.fillRect(x,0,2,h); },{repeat:true}),roughness:0.85,side:THREE.DoubleSide});
    const roofM=new THREE.MeshStandardMaterial({color:0x3a302a,roughness:0.9,side:THREE.DoubleSide});
    const wl=H.ribbon(inc,i=>-P.wl[i]-0.3,i=>-P.wl[i]-0.3,-0.3,5.2,0,1,4), wr=H.ribbon(inc,i=>P.wr[i]+0.3,i=>P.wr[i]+0.3,-0.3,5.2,0,1,4);
    const m1=new THREE.Mesh(mergeGeos([wl,wr]),wood); m1.castShadow=true; G.add(m1);
    const rl=H.ribbon(inc,i=>-P.wl[i]-1.2,i=>0,5.0,8.2,0,1,6), rrg=H.ribbon(inc,i=>0,i=>P.wr[i]+1.2,8.2,5.0,0,1,6);
    const m2=new THREE.Mesh(mergeGeos([rl,rrg]),roofM); m2.castShadow=true; G.add(m2);
    // deck edge beams + stone abutments at both ends
    const idxs=[]; for(let i=0;i<P.N;i++) if(P.tunnel[i]) idxs.push(i);
    [idxs[0],idxs[idxs.length-1]].forEach(i=>{ if(i===undefined) return; for(const sd of [-1,1]){ const e=(sd<0?P.wl[i]:P.wr[i])+0.6; const pier=new THREE.Mesh(new THREE.BoxGeometry(1.6,9,2.2),stdMat(0x8d8578)); pier.position.set(P.x[i]+P.rx[i]*e*sd,P.y[i]-3.8,P.z[i]+P.rz[i]*e*sd); pier.rotation.y=Math.atan2(P.tx[i],P.tz[i]); pier.castShadow=true; G.add(pier); } });
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(7,1.3),new THREE.MeshStandardMaterial({map:textPanelTex([{text:'HONKY TONK CROSSING',font:'bold 64px "Racing Sans One", Impact',color:'#f3e2b8',y:0.55}],{w:1024,h:190,bg:'#3a1a10'})}));
    const i0=idxs[0]; if(i0!==undefined){ sign.position.set(P.x[i0]-P.tx[i0]*0.4,P.y[i0]+6.3,P.z[i0]-P.tz[i0]*0.4); sign.rotation.y=Math.atan2(-P.tx[i0],-P.tz[i0]); G.add(sign); }
  });

  // ---------- THE RED SOLO CUP MONUMENT (the centrepiece) ----------
  if(def.monument && typeof CAR_GLTF!=='undefined' && CAR_GLTF.solocup){
    const {x,z}=def.monument; const R=17; const base=Math.max(nat(x,z),0); const gy=base+3.2;
    const mound=new THREE.Mesh(new THREE.CylinderGeometry(R+2,R+7,3.4,48),new THREE.MeshStandardMaterial({color:0x5f7f34,roughness:1})); mound.position.set(x,base+1.4,z); mound.receiveShadow=true; G.add(mound);
    blocked.push({x,z,r:R+8});
    const stone=new THREE.MeshStandardMaterial({map:canvasTex(256,256,(c,w,h)=>{ noiseFill(c,w,h,'#b9ad98',20); c.strokeStyle='rgba(60,50,40,0.35)'; c.lineWidth=2; for(let y=0;y<h;y+=32){ c.beginPath(); c.moveTo(0,y); c.lineTo(w,y); c.stroke(); for(let xx=(y/32%2)*32;xx<w;xx+=64){ c.beginPath(); c.moveTo(xx,y); c.lineTo(xx,y+32); c.stroke(); } } },{repeat:true}),roughness:0.9});
    stone.map.repeat.set(6,1);
    const plaza=new THREE.Mesh(new THREE.CylinderGeometry(R,R+2,1.6,48),stone); plaza.position.set(x,gy+0.2,z); plaza.receiveShadow=true; plaza.castShadow=true; G.add(plaza);
    const ring=new THREE.Mesh(new THREE.CylinderGeometry(R*0.55,R*0.6,1.4,40),stone); ring.position.set(x,gy+1.6,z); ring.castShadow=true; G.add(ring);
    const red=new THREE.MeshStandardMaterial({color:0xc8201e,roughness:0.6}); const band=new THREE.Mesh(new THREE.TorusGeometry(R*0.57,0.18,8,64),red); band.rotation.x=Math.PI/2; band.position.set(x,gy+2.3,z); G.add(band);
    // the cup itself, towering over the infield
    const cup=makeProp('solocup'); cup.position.set(x,gy+2.3,z); const toStart=0; cup.rotation.y=toStart; G.add(cup);
    // bronze plaque facing the start straight
    const pl=new THREE.Mesh(new THREE.BoxGeometry(6.4,1.8,0.3),new THREE.MeshStandardMaterial({map:textPanelTex([{text:'RED SOLO CUP',font:'bold 88px "Racing Sans One", Impact',color:'#ffe2a0',y:0.36},{text:'IN LOVING MEMORY OF TOBY',font:'bold 46px "Chakra Petch", sans-serif',color:'#f5d99a',y:0.74}],{w:1024,h:290,bg:'#5a3a14'}),metalness:0.5,roughness:0.45}));
    const ang=toStart; pl.position.set(x+Math.sin(ang)*(R*0.6+0.2),gy+1.7,z+Math.cos(ang)*(R*0.6+0.2)); pl.rotation.y=ang; G.add(pl);
    // floodlight towers + light beams + flags + string lights
    const poleM=stdMat(0x2a2a2e,{metalness:0.6,roughness:0.4}); const beamM=new THREE.MeshBasicMaterial({color:0xfff0c8,transparent:true,opacity:0.05,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
    const beams=[]; const tops=[];
    for(let k=0;k<6;k++){ const a=k/6*TAU+0.3, px=x+Math.cos(a)*(R-2.5), pz=z+Math.sin(a)*(R-2.5);
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.26,11,8),poleM); pole.position.set(px,gy+6.5,pz); pole.castShadow=true; G.add(pole); tops.push([px,gy+12,pz]);
      const lamp=glowSprite(0xfff2c0,3.2,0.9); lamp.position.set(px,gy+12.1,pz); G.add(lamp);
      const bg=new THREE.ConeGeometry(4.5,15,20,1,true); bg.translate(0,-7.5,0); const b=new THREE.Mesh(bg,beamM); b.position.set(px,gy+12,pz); b.lookAt(x,gy+10,z); b.rotateX(Math.PI/2); beams.push(b); }
    for(let k=0;k<4;k++){ const a=k/4*TAU+1.0, px=x+Math.cos(a)*(R-0.8), pz=z+Math.sin(a)*(R-0.8); const fp=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.1,12,6),stdMat(0xdddddd,{metalness:0.7})); fp.position.set(px,gy+6,pz); G.add(fp);
      const fg=new THREE.PlaneGeometry(3.4,2,10,1); fg.translate(1.7,0,0); const fl=new THREE.Mesh(fg,new THREE.MeshStandardMaterial({map:canvasTex(128,76,(c,w,h)=>{ for(let s=0;s<7;s++){ c.fillStyle=s%2?'#f5f0e6':'#c8201e'; c.fillRect(0,s*h/7,w,h/7+1);} c.fillStyle='#233a78'; c.fillRect(0,0,w*0.42,h*0.54); c.fillStyle='#fff'; for(let i=0;i<5;i++) for(let j=0;j<4;j++) c.fillRect(5+i*10,4+j*10,3,3); }),side:THREE.DoubleSide,roughness:0.8}));
      fl.position.set(px,gy+11,pz); G.add(fl); W.updaters.push((dt,t)=>{ const p=fg.attributes.position; for(let i=0;i<p.count;i++){ const X=p.getX(i); p.setZ(i,Math.sin(X*2.2-t*5+k)*0.18*(X/3.4)); } p.needsUpdate=true; }); }
    // string lights between the floodlight poles
    const bulbs=[]; for(let k=0;k<tops.length;k++){ const a=tops[k], b=tops[(k+1)%tops.length]; for(let q=1;q<14;q++){ const t=q/14; bulbs.push({x:lerp(a[0],b[0],t),y:lerp(a[1],b[1],t)-2.2*Math.sin(t*Math.PI)-0.4,z:lerp(a[2],b[2],t),s:0.16,c:[0xffd27a,0xff6a4a,0x8affc8,0xffffff][q%4]}); } }
    G.add(instanced(new THREE.SphereGeometry(1,6,4),new THREE.MeshBasicMaterial({color:0xffffff}),bulbs,false));
    // hay-bale seating ring and a few pickup-bed style crowd blocks
    const hay=[]; for(let k=0;k<18;k++){ const a=k/18*TAU+0.17; hay.push({x:x+Math.cos(a)*(R-4.5),y:gy+1.6,z:z+Math.sin(a)*(R-4.5),rz:Math.PI/2,ry:a,s:[0.75,1.4,0.75],c:0xd8b35a}); }
    G.add(instanced(new THREE.CylinderGeometry(1,1,1,14),stdMat(0xffffff,{roughness:1}),hay,true,true));
    W.updaters.push((dt,t)=>{ beams.forEach((b,k)=>{ b.material.opacity=0.04+0.02*Math.sin(t*1.3+k); }); });
    W.monument={x,y:gy,z};
  }

  // ---------- Dolly statue by the start straight ----------
  if(typeof CAR_GLTF!=='undefined' && CAR_GLTF.dolly){ const i=Math.round(170/P.spacing); const e=P.wr[i]+9; const x=P.x[i]+P.rx[i]*e, z=P.z[i]+P.rz[i]*e; const gy=heightAt(x,z);
    const stone=stdMat(0xcfc6b4,{roughness:0.8}); const ped=new THREE.Mesh(new THREE.CylinderGeometry(3.2,3.8,2.2,32),stone); ped.position.set(x,gy+1.1,z); ped.castShadow=ped.receiveShadow=true; G.add(ped);
    const trim=new THREE.Mesh(new THREE.TorusGeometry(3.25,0.12,8,40),stdMat(0xd4a33a,{metalness:0.8,roughness:0.3})); trim.rotation.x=Math.PI/2; trim.position.set(x,gy+2.2,z); G.add(trim);
    const d=makeProp('dolly'); d.position.set(x,gy+2.2,z); const nx=-P.tx[i]*0.8-P.rx[i]*0.6, nz=-P.tz[i]*0.8-P.rz[i]*0.6; d.rotation.y=Math.atan2(nx,nz); G.add(d);
    const pl=new THREE.Mesh(new THREE.PlaneGeometry(4,0.9),new THREE.MeshStandardMaterial({map:textPanelTex([{text:'DOLLY',font:'bold 110px "Racing Sans One", Impact',color:'#ffe2a0',y:0.58}],{w:512,h:128,bg:'#5a3a14'}),metalness:0.5,roughness:0.45}));
    pl.position.set(x+Math.sin(d.rotation.y)*3.55,gy+1.1,z+Math.cos(d.rotation.y)*3.55); pl.rotation.y=d.rotation.y; G.add(pl);
    [-1,1].forEach(k=>{ const a=d.rotation.y+k*0.7; const lamp=glowSprite(0xffe6b0,2.2,0.8); lamp.position.set(x+Math.sin(a)*3.4,gy+2.6,z+Math.cos(a)*3.4); G.add(lamp); });
    blocked.push({x,z,r:6}); }

  // ---------- farm buildings ----------
  const barnWood=canvasTex(256,256,(c,w,h)=>{ noiseFill(c,w,h,'#a3261c',16); c.fillStyle='rgba(50,10,5,0.45)'; for(let x=0;x<w;x+=12) c.fillRect(x,0,2,h); },{repeat:true});
  const barnM=new THREE.MeshStandardMaterial({map:barnWood,roughness:0.85}), trimM=stdMat(0xf2ede0), roofM=stdMat(0x3b3b40,{roughness:0.7,metalness:0.3});
  const makeBarn=(s)=>{ const g=new THREE.Group(); const w=12*s,d=18*s,h=7*s;
    const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),barnM); body.position.y=h/2; g.add(body);
    const sh=new THREE.Shape(); sh.moveTo(-w/2-0.4,0); sh.lineTo(-w*0.32,h*0.45); sh.lineTo(0,h*0.62); sh.lineTo(w*0.32,h*0.45); sh.lineTo(w/2+0.4,0); sh.closePath();
    const rg=new THREE.ExtrudeGeometry(sh,{depth:d+0.8,bevelEnabled:false}); rg.translate(0,h,-(d+0.8)/2); const roof=new THREE.Mesh(rg,roofM); g.add(roof);
    const gab=new THREE.Shape(); gab.moveTo(-w/2,0); gab.lineTo(-w*0.32,h*0.45); gab.lineTo(0,h*0.62); gab.lineTo(w*0.32,h*0.45); gab.lineTo(w/2,0); gab.closePath(); const gg=new THREE.ShapeGeometry(gab); gg.translate(0,h,d/2+0.01);
    g.add(new THREE.Mesh(gg,barnM)); const gb=gg.clone(); gb.rotateY(Math.PI); g.add(new THREE.Mesh(gb,barnM));
    const door=new THREE.Mesh(new THREE.PlaneGeometry(w*0.42,h*0.72),new THREE.MeshStandardMaterial({map:canvasTex(128,128,(c,W2,H2)=>{ c.fillStyle='#8f1f16'; c.fillRect(0,0,W2,H2); c.strokeStyle='#f2ede0'; c.lineWidth=9; c.strokeRect(5,5,W2-10,H2-10); c.beginPath(); c.moveTo(5,5); c.lineTo(W2-5,H2-5); c.moveTo(W2-5,5); c.lineTo(5,H2-5); c.stroke(); })}));
    door.position.set(0,h*0.36,d/2+0.02); g.add(door); const loft=new THREE.Mesh(new THREE.PlaneGeometry(w*0.18,h*0.22),stdMat(0x1a1210)); loft.position.set(0,h*1.18,d/2+0.03); g.add(loft);
    g.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } }); return {g,w,d}; };
  const siloM=stdMat(0xc9ccd0,{metalness:0.55,roughness:0.35}), domeM=stdMat(0xa8abb0,{metalness:0.6,roughness:0.3});
  const makeSilo=(h)=>{ const g=new THREE.Group(); const r=2.6; const c=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,20),siloM); c.position.y=h/2; g.add(c); for(let k=1;k<h/2.2;k++){ const ring=new THREE.Mesh(new THREE.TorusGeometry(r+0.03,0.05,4,20),domeM); ring.rotation.x=Math.PI/2; ring.position.y=k*2.2; g.add(ring); } const dm=new THREE.Mesh(new THREE.SphereGeometry(r,20,10,0,TAU,0,Math.PI/2),domeM); dm.position.y=h; g.add(dm); g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); return g; };
  const farms=[]; let tries=0;
  while(farms.length<Math.round(5*Math.max(0.6,D)) && tries<400){ tries++; const i=Math.floor(rnd()*P.N), sd=rnd()<0.5?-1:1; const e=(sd<0?P.wl[i]:P.wr[i])+rr(30,70); const x=P.x[i]+P.rx[i]*e*sd, z=P.z[i]+P.rz[i]*e*sd; const ang=Math.atan2(-P.rx[i]*sd,-P.rz[i]*sd);
    if(!footprintClear(x,z,ang,30,30,6) || !free(x,z,18) || farms.some(f=>Math.hypot(f.x-x,f.z-z)<90)) continue; farms.push({x,z,ang}); }
  farms.forEach((f,k)=>{ const b=makeBarn(rr(0.9,1.15)); const y=heightAt(f.x,f.z)-0.1; b.g.position.set(f.x,y,f.z); b.g.rotation.y=f.ang; G.add(b.g);
    const ca=Math.cos(f.ang), sa=Math.sin(f.ang); for(let q=0;q<(k%2?2:1);q++){ const s=makeSilo(rr(12,17)); const ox=b.w/2+4+q*6; s.position.set(f.x+ca*ox,heightAt(f.x+ca*ox,f.z-sa*ox),f.z-sa*ox); G.add(s); }
    blocked.push({x:f.x,z:f.z,r:22}); });

  // ---------- windmills (animated) ----------
  const mills=[]; tries=0;
  while(mills.length<3 && tries<300){ tries++; const i=Math.floor(rnd()*P.N), sd=rnd()<0.5?-1:1; const e=(sd<0?P.wl[i]:P.wr[i])+rr(18,40); const x=P.x[i]+P.rx[i]*e*sd, z=P.z[i]+P.rz[i]*e*sd; if(!clearOfRoad(x,z,8)||!free(x,z,6)||mills.some(m=>Math.hypot(m.x-x,m.z-z)<150)) continue;
    const y=heightAt(x,z); const g=new THREE.Group(); g.position.set(x,y,z); const steel=stdMat(0x8a8d90,{metalness:0.6,roughness:0.4});
    for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]){ const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.1,13,5),steel); leg.position.set(a*1.1,6.3,b*1.1); leg.rotation.set(b*0.08,0,-a*0.08); g.add(leg); }
    const hub=new THREE.Group(); hub.position.set(0,13,0); g.add(hub); const rot=new THREE.Group(); hub.add(rot);
    for(let k=0;k<18;k++){ const bl=new THREE.Mesh(new THREE.BoxGeometry(0.35,2.6,0.05),stdMat(0xd8d8d0,{metalness:0.4})); bl.position.set(Math.cos(k/18*TAU)*1.6,Math.sin(k/18*TAU)*1.6,0); bl.rotation.z=k/18*TAU-Math.PI/2; rot.add(bl); }
    const vane=new THREE.Mesh(new THREE.BoxGeometry(0.05,1.4,2.6),stdMat(0xc8201e)); vane.position.set(0,0,-2); hub.add(vane); hub.rotation.y=rnd()*TAU;
    g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); G.add(g); const sp=rr(1.5,2.5); W.updaters.push((dt)=>{ rot.rotation.z+=dt*sp; }); mills.push({x,z}); blocked.push({x,z,r:4}); }

  // ---------- oak trees, hay bales, fields, fences ----------
  const trunk=new THREE.CylinderGeometry(0.35,0.55,4,7); trunk.translate(0,2,0);
  const canopy=mergeGeos([0,1,2,3].map(k=>{ const s=new THREE.IcosahedronGeometry(k?2.2:2.8,1); s.translate(k?Math.cos(k*2.1)*1.8:0,k?4.8+rr(-0.3,0.6):5.6,k?Math.sin(k*2.1)*1.8:0); return tintGeo(s,0xffffff); }));
  const oaks=scatter(160,6,120,5,(x,y,z)=>free(x,z,3)?{x,y,z,ry:rnd()*TAU,s:rr(0.8,1.5)}:null).concat(areaScatter(220,40,(x,y,z)=>free(x,z,3)?{x,y,z,ry:rnd()*TAU,s:rr(1,1.9)}:null));
  G.add(instanced(trunk,stdMat(0x5a4030),oaks,true)); G.add(instanced(canopy,stdMat(0xffffff),oaks.map(o=>Object.assign({},o,{c:[0x4f7a2e,0x5f8a34,0x6b8f3a,0x3f6a28][Math.floor(rnd()*4)]})),true));
  const bales=scatter(70,5,60,4,(x,y,z)=>free(x,z,2)?{x,y:y+0.75,z,rz:Math.PI/2,ry:rnd()*TAU,s:[0.75,1.5,0.75],c:0xd8b35a}:null);
  G.add(instanced(new THREE.CylinderGeometry(1,1,1,14),stdMat(0xffffff,{roughness:1}),bales,true,true));
  // crop fields: striped ground patches
  const fieldTex=canvasTex(256,256,(c,w,h)=>{ c.fillStyle='#6d5a2c'; c.fillRect(0,0,w,h); for(let x=0;x<w;x+=16){ c.fillStyle='#7fa33a'; c.fillRect(x+3,0,9,h); c.fillStyle='rgba(200,220,120,0.4)'; c.fillRect(x+5,0,2,h); } },{repeat:true});
  const fieldM=new THREE.MeshStandardMaterial({map:fieldTex,roughness:1,polygonOffset:true,polygonOffsetFactor:-3});
  let nf=0; tries=0; while(nf<Math.round(10*D) && tries<400){ tries++; const i=Math.floor(rnd()*P.N), sd=rnd()<0.5?-1:1; const e=(sd<0?P.wl[i]:P.wr[i])+rr(20,90); const x=P.x[i]+P.rx[i]*e*sd, z=P.z[i]+P.rz[i]*e*sd; const w=rr(40,80), d=rr(30,60), a=Math.atan2(P.tx[i],P.tz[i]);
    if(!footprintClear(x,z,a,w,d,4)||!free(x,z,Math.max(w,d)/2)) continue; if(W.nat.creekD && W.nat.creekD(x,z)<Math.max(w,d)/2+12) continue;
    const seg=10, g=new THREE.PlaneGeometry(w,d,seg,seg); g.rotateX(-Math.PI/2); g.rotateY(a); const p=g.attributes.position; for(let k=0;k<p.count;k++){ p.setY(k,heightAt(x+p.getX(k),z+p.getZ(k))+0.08); } g.computeVertexNormals();
    const tx=fieldTex.clone(); tx.needsUpdate=true; tx.repeat.set(w/16,d/16); const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:tx,roughness:1,polygonOffset:true,polygonOffsetFactor:-3})); m.position.set(x,0,z); m.receiveShadow=true; G.add(m); nf++; }
  // ---------- honky-tonk bar + water tower near the start ----------
  const i0=Math.round(P.N*0.02), sdB=1, eB=P.wr[i0]+26; const bx=P.x[i0]+P.rx[i0]*eB*sdB, bz=P.z[i0]+P.rz[i0]*eB*sdB; const bang=Math.atan2(-P.rx[i0]*sdB,-P.rz[i0]*sdB);
  if(footprintClear(bx,bz,bang,20,14,4)&&free(bx,bz,12)){ const g=new THREE.Group(); g.position.set(bx,heightAt(bx,bz)-0.1,bz); g.rotation.y=bang;
    const plank=new THREE.MeshStandardMaterial({map:canvasTex(256,128,(c,w,h)=>{ noiseFill(c,w,h,'#6b4a2e',20); c.fillStyle='rgba(30,15,5,0.5)'; for(let y=0;y<h;y+=10) c.fillRect(0,y,w,1.5); },{repeat:true}),roughness:0.9});
    const body=new THREE.Mesh(new THREE.BoxGeometry(20,6,14),plank); body.position.y=3; g.add(body); const rf=new THREE.Mesh(new THREE.BoxGeometry(21,0.5,15),roofM); rf.position.y=6.2; g.add(rf);
    const porch=new THREE.Mesh(new THREE.BoxGeometry(20,0.3,3),plank); porch.position.set(0,3.6,8.2); g.add(porch); for(const px of [-9.5,-3,3,9.5]){ const post=new THREE.Mesh(new THREE.BoxGeometry(0.3,3.6,0.3),plank); post.position.set(px,1.8,9.5); g.add(post); }
    const neon=new THREE.Mesh(new THREE.PlaneGeometry(12,2.6),new THREE.MeshBasicMaterial({map:textPanelTex([{text:'HONKY TONK',font:'italic bold 120px Yellowtail, cursive',color:'#ff6a3a',glow:'#ff2e2e',y:0.55}],{w:1024,h:230,bg:'rgba(0,0,0,0)'}),transparent:true}));
    neon.position.set(0,7.9,7.1); g.add(neon);
    g.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } }); G.add(g); blocked.push({x:bx,z:bz,r:13});
    // water tower
    const wx=bx+Math.cos(bang)*18, wz=bz-Math.sin(bang)*18; const tw=new THREE.Group(); tw.position.set(wx,heightAt(wx,wz),wz); const steel=stdMat(0x9fa4a8,{metalness:0.6,roughness:0.4});
    for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]){ const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.25,16,6),steel); leg.position.set(a*2.6,8,b*2.6); tw.add(leg); }
    const tank=new THREE.Mesh(new THREE.CylinderGeometry(5,5,6,24),new THREE.MeshStandardMaterial({map:textPanelTex([{text:'HONKY TONK HWY',font:'bold 70px "Racing Sans One", Impact',color:'#c8201e',y:0.55}],{w:1024,h:200,bg:'#e9e4d8'}),roughness:0.6})); tank.position.y=19; tw.add(tank);
    const cap=new THREE.Mesh(new THREE.ConeGeometry(5.3,2.6,24),steel); cap.position.y=23.3; tw.add(cap); tw.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); G.add(tw); }
}

// ===== ACID DRIP GALAXY: the space track (figure 8) =====
// Everything here is cheap on purpose: one sky shader, a handful of instanced meshes, canvas textures, no extra lights.
function spaceSky(W){
  const U={t:{value:0}}; W.spaceU=U;
  const mat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:U,
    vertexShader:'varying vec3 d;void main(){d=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
    fragmentShader:`uniform float t; varying vec3 d;
      float h3(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453);}
      float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
      float fb(vec3 p){float a=0.,w=.5;for(int k=0;k<4;k++){a+=w*n3(p);p=p*2.02+vec3(3.1,1.7,5.3);w*=.5;}return a;}
      vec3 pal(float x){return .5+.5*cos(6.2832*(x+vec3(0.,.33,.67)));}
      void main(){ vec3 n=normalize(d); vec3 p=n*2.1;
        // nebula: domain-warped noise that slowly flows, colours cycling through the whole spectrum
        float wa=fb(p+vec3(0.,t*.016,0.)), wb=fb(p*1.2+vec3(5.2,1.3,t*.012));
        float f=fb(p*1.3+vec3(wa,wb,wa*wb)*2.4+vec3(0.,0.,t*.008));
        float neb=smoothstep(.40,.78,f);
        vec3 c=vec3(.016,.004,.045)+pal(f*1.7+wa*.8+t*.012)*neb*.5+pal(wb*2.+.4)*neb*neb*neb*.3;
        // stars (two sizes, twinkling)
        vec3 q=floor(n*250.); float hs=h3(q); c+=vec3(step(.9972,hs))*(.45+.55*sin(t*2.3+hs*600.))*(1.-neb*.6);
        vec3 q2=floor(n*90.); float h2=h3(q2+7.); c+=pal(h2*9.)*step(.9985,h2)*(1.1+.5*sin(t*1.4+h2*90.));
        // galaxy core
        float g=max(dot(n,normalize(vec3(-.55,.3,.78))),0.); c+=vec3(1.,.78,.55)*pow(g,110.)*1.3+pal(.92+t*.004)*pow(g,14.)*.22;
        // the sky is melting: goo hangs from the zenith in slow drips
        float a=atan(n.z,n.x); vec3 rg=vec3(cos(a),sin(a),0.);
        float col=pow(abs(sin(a*7.+2.*n3(rg*2.+4.))),10.);
        float edge=.64-.09*n3(rg*4.+vec3(0.,0.,t*.03))-.5*col*n3(rg*3.+9.)*(.62+.38*sin(t*.11+a*2.));
        float goo=smoothstep(edge-.01,edge+.01,n.y);
        vec3 gc=mix(vec3(.5,1.,.08),vec3(1.,.12,.72),.5+.5*sin(a*3.+t*.17+n.y*7.)); gc=mix(gc,pal(a*.32+t*.02),.35);
        float rim=smoothstep(edge+.07,edge,n.y);
        c=mix(c,gc*(.22+.55*rim)+vec3(1.)*pow(rim,8.)*.25,goo*.92);
        gl_FragColor=vec4(c,1.);}`});
  W.updaters.push((dt,t)=>{ U.t.value=t; });
  const m=new THREE.Mesh(new THREE.SphereGeometry(2600,32,16),mat); m.renderOrder=-10; m.frustumCulled=false; return m;
}
function buildSpaceScenery(W,def,P,Q,H){
  const G=W.group, {ptAt,ribbon,notGap}=H, D=Q.density||1, hue=new THREE.Color();
  const basic=(o)=>new THREE.MeshBasicMaterial(o);
  // ---- road: black glass with marbled acid swirls; the lines glow and drift through the spectrum
  const swirl=(g,w,h,alpha,grey)=>{ let sd=11; const r=()=>{ sd=(sd*16807)%2147483647; return (sd-1)/2147483646; };
    for(let k=0;k<46;k++){ const x=r()*w, y=r()*h; g.strokeStyle=grey?`rgba(255,255,255,${alpha*(0.5+r())})`:`hsla(${Math.floor(r()*360)},95%,58%,${alpha*(0.5+r())})`; g.lineWidth=3+r()*16; g.beginPath(); g.moveTo(x,y);
      g.bezierCurveTo(x+(r()-0.5)*260,y+r()*160,x+(r()-0.5)*260,y+140+r()*200,x+(r()-0.5)*120,y+300+r()*220); g.stroke(); } };
  const lines=(g,w,h,cE,cC)=>{ g.fillStyle=cE; g.fillRect(w*0.03,0,9,h); g.fillRect(w*0.97-9,0,9,h); g.fillStyle=cC; for(let y=0;y<h;y+=256) g.fillRect(w/2-6,y,12,150); };
  const mapT=canvasTex(512,1024,(g,w,h)=>{ g.fillStyle='#0d0718'; g.fillRect(0,0,w,h); swirl(g,w,h,0.2,false); lines(g,w,h,'#8a8a92','#8a8a92'); },{repeat:true,aniso:8});
  const emT=canvasTex(512,1024,(g,w,h)=>{ g.fillStyle='#000'; g.fillRect(0,0,w,h); swirl(g,w,h,0.11,true); lines(g,w,h,'#fff','#fff'); },{repeat:true,aniso:8});
  const rm=W.roadMat; rm.map=mapT; rm.emissiveMap=emT; rm.emissive=new THREE.Color(0xff2e97); rm.emissiveIntensity=0.9; rm.roughness=0.2; rm.metalness=0.45; rm.needsUpdate=true;
  // ---- underside: the ribbon has a belly, so it reads as a slab from below (the flyover passes right over the cars)
  const belly=new THREE.Mesh(ribbon(notGap,i=>-P.wl[i]-0.45,i=>P.wr[i]+0.45,-0.62,-0.62,0,1,14),basic({map:canvasTex(256,256,(g,w,h)=>{ g.fillStyle='#12061f'; g.fillRect(0,0,w,h); let sd=5; const r=()=>{ sd=(sd*16807)%2147483647; return (sd-1)/2147483646; };
      for(let k=0;k<70;k++){ g.fillStyle=`hsla(${[300,95,185,280][k%4]},90%,55%,${0.08+r()*0.2})`; g.beginPath(); g.ellipse(r()*w,r()*h,6+r()*30,10+r()*46,0,0,TAU); g.fill(); } },{repeat:true}),side:THREE.DoubleSide}));
  G.add(belly);
  // ---- acid drips hanging off both edges of the ribbon
  { const cone=new THREE.ConeGeometry(0.34,1,7); cone.rotateX(Math.PI); cone.translate(0,-0.5,0); const blob=new THREE.SphereGeometry(0.2,7,5); blob.translate(0,-1.0,0);
    const list=[]; const cols=[0x9dff1a,0xff2ec4,0x22e4ff,0xb44cff,0xffe23d];
    for(let i=0;i<P.N;i+=2) for(const sd of [-1,1]){ if(rnd()>0.42*Math.min(1,D+0.3)) continue; const e=(sd<0?P.wl[i]:P.wr[i])+0.45+rr(-0.25,0.05); const p=ptAt(i,e*sd,-0.55);
      const len=rnd()<0.12?rr(5,11):rr(0.7,3.6); const wd=rr(0.7,1.5)*(len>5?1.5:1); list.push({x:p[0],y:p[1],z:p[2],ry:rnd()*TAU,s:[wd,len,wd],c:cols[Math.floor(rnd()*cols.length)]}); }
    G.add(instanced(mergeGeos([cone,blob]),basic({color:0xffffff}),list,false)); W.spaceDrips=list.length; }
  // ---- warp hoops around the road (one instanced mesh, colours chase along the lap)
  { const R0=P.w[0]/2+5.2, tor=new THREE.TorusGeometry(R0,0.32,8,44); const list=[]; const step=Math.round(46/P.spacing);
    for(let i=Math.round(20/P.spacing);i<P.N;i+=step){ if(Math.hypot(P.x[i],P.z[i])<52) continue;   /* none at the crossing: a hoop there would cut through the other deck */ list.push({x:P.x[i],y:P.y[i]+2.6,z:P.z[i],ry:Math.atan2(P.tx[i],P.tz[i]),i}); }
    const hoops=instanced(tor,basic({color:0xffffff}),list,false); G.add(hoops); W.spaceHoops=list.length;
    W.updaters.push((dt,t)=>{ for(let k=0;k<list.length;k++){ hue.setHSL((k*0.11+t*0.22)%1,1,0.56); hoops.setColorAt(k,hue); } hoops.instanceColor.needsUpdate=true; }); }
  // ---- the wall neon and the road lines drift through the spectrum
  W.updaters.push((dt,t)=>{ (W.neonMats||[]).forEach(o=>{ o.m.color.setHSL((t*0.05+(o.sd<0?0:0.5))%1,1,0.55); }); rm.emissive.setHSL((t*0.04+0.8)%1,1,0.5); rm.emissiveIntensity=0.8+0.25*Math.sin(t*1.7); });
  // ---- THE EYE (left lobe): it watches the player
  { const tex=canvasTex(1024,512,(g,w,h)=>{ g.fillStyle='#efe6dc'; g.fillRect(0,0,w,h);
      let sd=23; const r=()=>{ sd=(sd*16807)%2147483647; return (sd-1)/2147483646; };
      g.lineCap='round'; for(let k=0;k<90;k++){ let x=r()*w, y=h*0.24+r()*h*0.76; g.strokeStyle=`rgba(${170+r()*60},20,40,${0.25+r()*0.35})`; g.lineWidth=1+r()*3; g.beginPath(); g.moveTo(x,y); for(let q=0;q<6;q++){ x+=(r()-0.5)*40; y-=10+r()*28; g.lineTo(x,y); } g.stroke(); }
      const gr=g.createLinearGradient(0,0,0,h*0.22); gr.addColorStop(0,'#000'); gr.addColorStop(0.2,'#000'); gr.addColorStop(0.22,'#ffe23d'); gr.addColorStop(0.45,'#ff2ec4'); gr.addColorStop(0.7,'#22e4ff'); gr.addColorStop(0.93,'#3a1a8a'); gr.addColorStop(1,'#12061f');
      g.fillStyle=gr; g.fillRect(0,0,w,h*0.22); for(let x=0;x<w;x+=6){ g.strokeStyle=`rgba(${r()<0.5?'0,0,0':'255,255,255'},${0.10+r()*0.22})`; g.lineWidth=1+r()*2; g.beginPath(); g.moveTo(x,h*0.048); g.lineTo(x+(r()-0.5)*8,h*0.212); g.stroke(); } });
    const geo=new THREE.SphereGeometry(40,40,24); geo.rotateX(Math.PI/2);   // pupil (texture top) looks down +Z, so lookAt() aims it
    const eye=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:tex,emissiveMap:tex,emissive:0xffffff,emissiveIntensity:0.5,roughness:0.25,metalness:0.0})); eye.position.set(-145,22,0); G.add(eye); W.spaceEye=eye;
    const lid=new THREE.Mesh(new THREE.TorusGeometry(41.5,2.2,8,40),basic({color:0xff2ec4})); eye.add(lid); lid.position.z=30; lid.scale.setScalar(0.64);   // glowing lash ring around the iris
    const tq=new THREE.Quaternion(), m4=new THREE.Matrix4(), up=new THREE.Vector3(0,1,0), tp=new THREE.Vector3();
    W.updaters.push((dt,t)=>{ const cam=(typeof GAME!=='undefined'&&GAME&&GAME.camera)?GAME.camera:null; if(!cam) return; tp.copy(cam.position); tp.x+=Math.sin(t*0.7)*6; tp.y+=Math.sin(t*0.9)*4;
      m4.lookAt(tp,eye.position,up); tq.setFromRotationMatrix(m4); eye.quaternion.slerp(tq,Math.min(1,dt*2.2)); eye.position.y=22+Math.sin(t*0.5)*2.5; hue.setHSL((t*0.06)%1,1,0.55); lid.material.color.copy(hue); }); }
  // ---- THE MELTING PLANET (right lobe): banded acid planet, tilted rainbow ring, long drips off its belly
  { const tex=canvasTex(512,256,(g,w,h)=>{ let sd=41; const r=()=>{ sd=(sd*16807)%2147483647; return (sd-1)/2147483646; }; const bands=['#9dff1a','#1fd6a0','#ff2ec4','#7a2cff','#ffe23d','#ff7a1a','#22e4ff','#ff2e6a'];
      for(let y=0;y<h;y+=2){ const k=Math.floor((y/h)*11+Math.sin(y*0.09)*0.8); g.fillStyle=bands[((k%bands.length)+bands.length)%bands.length]; g.fillRect(0,y,w,2); }
      for(let k=0;k<160;k++){ const x=r()*w, y=r()*h; g.fillStyle=`hsla(${Math.floor(r()*360)},95%,60%,0.35)`; g.beginPath(); g.ellipse(x,y,8+r()*42,3+r()*8,0,0,TAU); g.fill(); }
      for(let k=0;k<60;k++){ const x=r()*w; g.fillStyle=`hsla(${[95,320,185][k%3]},100%,62%,0.55)`; g.fillRect(x,r()*h*0.8,2+r()*5,20+r()*80); } },{repeat:true});
    const grp=new THREE.Group(); grp.position.set(145,17,0); G.add(grp);
    const pl=new THREE.Mesh(new THREE.SphereGeometry(34,36,22),new THREE.MeshStandardMaterial({map:tex,emissiveMap:tex,emissive:0xffffff,emissiveIntensity:0.42,roughness:0.5})); grp.add(pl);
    const rt=canvasTex(256,8,(g,w,h)=>{ for(let x=0;x<w;x++){ g.fillStyle=`hsla(${x/w*720},100%,60%,${(x%23<17)?0.85:0.1})`; g.fillRect(x,0,1,h); } });
    const rg=new THREE.RingGeometry(44,66,72,1); { const uv=rg.attributes.uv, ps=rg.attributes.position; for(let k=0;k<uv.count;k++){ const rr2=Math.hypot(ps.getX(k),ps.getY(k)); uv.setXY(k,(rr2-44)/22,0.5); } }
    const ring=new THREE.Mesh(rg,basic({map:rt,side:THREE.DoubleSide,transparent:true,depthWrite:false})); ring.rotation.set(-1.15,0.25,0); grp.add(ring);
    const cone=new THREE.ConeGeometry(1,1,8); cone.rotateX(Math.PI); cone.translate(0,-0.5,0); const blob=new THREE.SphereGeometry(0.62,8,6); blob.translate(0,-1.0,0); const dl=[];
    let sd=77; const r=()=>{ sd=(sd*16807)%2147483647; return (sd-1)/2147483646; };
    for(let k=0;k<22;k++){ const a=r()*TAU, q=r()*0.75, rad=34*Math.sin(q*1.2), yy=-34*Math.cos(q*1.2)+1.5; const len=10+r()*34; const wd=1.6+r()*3.4; dl.push({x:Math.cos(a)*rad,y:yy,z:Math.sin(a)*rad,s:[wd,len,wd],c:[0x9dff1a,0xff2ec4,0x22e4ff,0xffe23d][k%4]}); }
    grp.add(instanced(mergeGeos([cone,blob]),basic({color:0xffffff}),dl,false));
    W.updaters.push((dt,t)=>{ pl.rotation.y=t*0.05; ring.rotation.z=t*0.12; grp.position.y=17+Math.sin(t*0.4+2)*2; }); }
  // ---- crystal belt slowly orbiting the whole circuit + drifting stardust
  { const geo=new THREE.OctahedronGeometry(1,0), list=[]; const n=Math.round(150*Math.min(1,D+0.2));
    for(let k=0;k<n;k++){ const a=rnd()*TAU, rad=rr(330,620); hue.setHSL(rnd(),0.95,0.6); list.push({x:Math.cos(a)*rad,y:rr(-90,120),z:Math.sin(a)*rad*0.8,rx:rnd()*3,ry:rnd()*3,rz:rnd()*3,s:[rr(2,7),rr(5,20),rr(2,7)],c:hue.getHex()}); }
    const belt=instanced(geo,new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x5a2aa8,emissiveIntensity:0.9,roughness:0.25,metalness:0.3,flatShading:true}),list,false); G.add(belt);
    const np=Math.round(700*Math.min(1,D+0.2)), pos=new Float32Array(np*3), col=new Float32Array(np*3);
    for(let k=0;k<np;k++){ pos[k*3]=rr(-330,330); pos[k*3+1]=rr(-45,70); pos[k*3+2]=rr(-190,190); hue.setHSL(rnd(),1,0.7); col[k*3]=hue.r; col[k*3+1]=hue.g; col[k*3+2]=hue.b; }
    const pg=new THREE.BufferGeometry(); pg.setAttribute('position',new THREE.BufferAttribute(pos,3)); pg.setAttribute('color',new THREE.BufferAttribute(col,3));
    const dust=new THREE.Points(pg,new THREE.PointsMaterial({size:1.5,map:glowTex(),vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true})); G.add(dust);
    W.updaters.push((dt,t)=>{ belt.rotation.y=t*0.012; dust.rotation.y=Math.sin(t*0.05)*0.08; dust.position.y=Math.sin(t*0.3)*2; }); }
  // ---- mushroom islands outside the sweepers (glowing caps)
  { const stem=new THREE.CylinderGeometry(0.28,0.42,1,7); stem.translate(0,0.5,0); const cap=new THREE.SphereGeometry(1,10,6,0,TAU,0,Math.PI/2); cap.scale(1,0.7,1); cap.translate(0,1,0);
    const stems=[], caps=[], rocks=[]; const isl=[[-300,-14,70],[-285,-20,-90],[300,-12,-60],[290,-22,95],[0,-38,150],[10,-30,-160]];
    isl.forEach(([x,y,z],q)=>{ rocks.push({x,y:y-6,z,ry:q,s:[20,9,16],c:[0x3a1d5c,0x1d3a5c,0x4a1d4a][q%3]});
      for(let k=0;k<7;k++){ const a=rnd()*TAU, d2=rr(1,13), hh=rr(3,11), cw=rr(2,5.5); const px=x+Math.cos(a)*d2, pz=z+Math.sin(a)*d2*0.8; stems.push({x:px,y:y+1,z:pz,s:[cw*0.3,hh,cw*0.3],c:0xe8dcff}); hue.setHSL(rnd(),1,0.58); caps.push({x:px,y:y+1+hh-cw*0.55,z:pz,s:[cw,cw*0.8,cw],c:hue.getHex()}); } });
    G.add(instanced(new THREE.IcosahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.9,flatShading:true}),rocks,false));
    G.add(instanced(stem,new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x443366,roughness:0.7}),stems,false)); G.add(instanced(cap,basic({color:0xffffff}),caps,false)); }
}

// ===== PARTICLES, SKIDS, RAIN =====
class Particles{
  constructor(max,additive){
    this.max=max; this.head=0;
    this.pos=new Float32Array(max*3); this.col=new Float32Array(max*4); this.size=new Float32Array(max);
    this.vel=new Float32Array(max*3); this.life=new Float32Array(max); this.ml=new Float32Array(max); this.s0=new Float32Array(max); this.s1=new Float32Array(max); this.a0=new Float32Array(max); this.drag=new Float32Array(max); this.grav=new Float32Array(max);
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(this.pos,3)); g.setAttribute('color',new THREE.BufferAttribute(this.col,4)); g.setAttribute('size',new THREE.BufferAttribute(this.size,1));
    this.mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,uniforms:{scale:{value:600}},
      vertexShader:'attribute vec4 color;attribute float size;uniform float scale;varying vec4 vC;void main(){vC=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*scale/max(0.1,-mv.z);gl_Position=projectionMatrix*mv;}',
      fragmentShader:'varying vec4 vC;void main(){vec2 d=gl_PointCoord-0.5;float a=smoothstep(0.5,0.1,length(d));if(a<0.01)discard;gl_FragColor=vec4(vC.rgb,vC.a*a);}'});
    this.points=new THREE.Points(g,this.mat); this.points.frustumCulled=false; this.geo=g; this.alive=0;
  }
  emit(x,y,z,vx,vy,vz,life,s0,s1,r,g,b,a,drag=1,grav=0){
    const i=this.head; this.head=(this.head+1)%this.max;
    this.pos[i*3]=x;this.pos[i*3+1]=y;this.pos[i*3+2]=z; this.vel[i*3]=vx;this.vel[i*3+1]=vy;this.vel[i*3+2]=vz;
    this.life[i]=life;this.ml[i]=life;this.s0[i]=s0;this.s1[i]=s1;this.col[i*4]=r;this.col[i*4+1]=g;this.col[i*4+2]=b;this.a0[i]=a;this.drag[i]=drag;this.grav[i]=grav;
  }
  update(dt){
    const P=this.pos,V=this.vel;
    for(let i=0;i<this.max;i++){ if(this.life[i]<=0){ if(this.size[i]!==0){this.size[i]=0;this.col[i*4+3]=0;} continue; }
      const l=this.life[i]-=dt; if(l<=0){ this.size[i]=0; this.col[i*4+3]=0; continue; }
      const k=Math.exp(-this.drag[i]*dt); V[i*3]*=k; V[i*3+1]=V[i*3+1]*k-this.grav[i]*dt; V[i*3+2]*=k;
      P[i*3]+=V[i*3]*dt; P[i*3+1]+=V[i*3+1]*dt; P[i*3+2]+=V[i*3+2]*dt;
      const f=l/this.ml[i]; this.size[i]=this.s1[i]+(this.s0[i]-this.s1[i])*f; this.col[i*4+3]=this.a0[i]*Math.min(1,f*1.5); }
    this.geo.attributes.position.needsUpdate=true; this.geo.attributes.color.needsUpdate=true; this.geo.attributes.size.needsUpdate=true;
  }
  clear(){ this.life.fill(0); this.size.fill(0); }
}
class Skids{
  constructor(max=1600){
    this.max=max; this.head=0; this.pos=new Float32Array(max*4*3); const idx=new Uint32Array(max*6);
    for(let q=0;q<max;q++){ const v=q*4; idx.set([v,v+1,v+2,v+1,v+3,v+2],q*6); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(this.pos,3)); g.setIndex(new THREE.BufferAttribute(idx,1));
    this.mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.32,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4})); this.mesh.frustumCulled=false; this.geo=g; this.dirty=false;
  }
  add(x0,y0,z0,x1,y1,z1,rx,rz,w){
    const q=this.head; this.head=(this.head+1)%this.max; const o=q*12, p=this.pos;
    p[o]=x0-rx*w;p[o+1]=y0;p[o+2]=z0-rz*w; p[o+3]=x0+rx*w;p[o+4]=y0;p[o+5]=z0+rz*w;
    p[o+6]=x1-rx*w;p[o+7]=y1;p[o+8]=z1-rz*w; p[o+9]=x1+rx*w;p[o+10]=y1;p[o+11]=z1+rz*w; this.dirty=true;
  }
  update(){ if(this.dirty){ this.geo.attributes.position.needsUpdate=true; this.dirty=false; } }
  clear(){ this.pos.fill(0); this.dirty=true; }
}
class Rain{
  constructor(n=700){ this.n=n; this.p=new Float32Array(n*6); this.off=new Float32Array(n*3);
    for(let i=0;i<n;i++){ this.off[i*3]=Math.random()*60-30; this.off[i*3+1]=Math.random()*30; this.off[i*3+2]=Math.random()*60-30; }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(this.p,3)); this.geo=g;
    this.mesh=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x8fa8ff,transparent:true,opacity:0.35})); this.mesh.frustumCulled=false; }
  update(dt,cam,vx,vz){ const o=this.off,p=this.p; for(let i=0;i<this.n;i++){ o[i*3+1]-=dt*38; if(o[i*3+1]<0) o[i*3+1]+=30;
      const x=cam.x+(((o[i*3]-vx*0.0)%60+90)%60-30), y=cam.y-12+o[i*3+1], z=cam.z+(((o[i*3+2])%60+90)%60-30);
      p[i*6]=x;p[i*6+1]=y;p[i*6+2]=z; p[i*6+3]=x-vx*0.02;p[i*6+4]=y+0.9;p[i*6+5]=z-vz*0.02; }
    this.geo.attributes.position.needsUpdate=true; }
}

// ===== CAR: arcade physics + visual state =====
const GRAV=30;
const DRIFT_TIERS=[1.1,2.1,3.3], DRIFT_BOOST=[0.55,0.85,1.2];
const TIER_COL=[[0.35,0.75,1.0],[1.0,0.6,0.15],[1.0,0.25,0.85]];
class Car{
  constructor(race,v,idx,isPlayer){
    this.race=race; this.v=v; this.idx=idx; this.isPlayer=isPlayer; this.name=v.name;
    this.ph=vehiclePhysics(v); this.homeBonus=homeBonus(race.def&&race.def.id,v.id); if(race.def&&race.def.noPerks){ this.ph.allTerrain=false; this.homeBonus=0; }   /* level-field tracks: every car runs stock */ this.hazImm=0; this.model=buildCarModel(v,race.env);
    this.halfW=this.model.dims.W/2; this.halfL=this.model.dims.L/2;
    this.radius=Math.max(1.15,Math.min(1.5,this.model.dims.L*0.29));
    this.inp={thr:0,brk:0,steer:0,drift:false,item:false};
    this.pr={}; this.reset0();
  }
  reset0(){
    this.x=0;this.y=0;this.z=0;this.h=0;this.vx=0;this.vz=0;this.vy=0;this.vF=0;this.vS=0;this.yaw=0;this.steerS=0;
    this.grounded=true;this.air=0;this.uPrev=0;this.i=0;this.offroad=false;
    this.drifting=false;this.driftDir=0;this.driftT=0;this.tier=-1;this.boost=0;this.boostMax=1;
    this.shield=0;this.spin=0;this.spinDir=1;this.ghost=0;this.item=null;this.itemCD=0;
    this.susp=0;this.suspV=0;this.lonA=0;this.latA=0;this.visYaw=0;this.pitch=0;
    this.lap=0;this.cp=0;this.cpCount=0;this.finished=false;this.finishTime=0;this.lapStart=0;this.lapTimes=[];this.bestLap=null;
    this.score=0;this.rank=1;this.wrongT=0;this.stuckT=0;this.lastSafe=0;this.wallHit=0;this.skidAmt=0;this.lastImpact=0;
    this.prevWheel=[null,null]; this.airTime=0; this.mudT=0; this.onMud=false; this.mudSlow=false; this.mudWarn=-1; this.itemDelay=0; this.rubber=1; this.skill=1;
  }
  place(i,lat){
    const P=this.race.P; this.i=i; this.x=P.x[i]+P.rx[i]*lat; this.z=P.z[i]+P.rz[i]*lat; this.y=P.y[i];
    this.h=Math.atan2(P.tx[i],P.tz[i]); this.vx=this.vz=this.vy=0; this.vF=this.vS=0; this.yaw=0; this.grounded=true;
    this.drifting=false; this.boost=0; this.spin=0; this.susp=0; this.suspV=0; this.uPrev=0;
    P.project(this.x,this.z,this.i,this.pr); this.prevWheel=[null,null];
  }
  respawn(){
    const R=this.race,P=R.P; let i=this.lastSafe;
    // step back out of any gap / ramp
    for(const j of (P.def.jumps||[])){ const d=(i-j.i0+P.N)%P.N; if(d<Math.round((j.len+j.gap+6)/P.spacing)+2) i=(j.i0-6+P.N)%P.N; }
    let lat=clamp(this.pr.lat||0,-P.w[i]/2+2,P.w[i]/2-2); if(P.median[i]>0.3) lat=(lat<0?-1:1)*(P.median[i]+2.5);
    this.loop=null; if(P.loop&&((i-P.loop.i0+P.N)%P.N)<=P.loop.span) i=(P.loop.i0-8+P.N)%P.N;   /* never respawn inside the loop's hidden connector */
    this.place(i,lat); this.vF=8; this.ghost=2.2; this.stuckT=0; this.wrongT=0;
    if(this.isPlayer){ R.sfx('respawn'); R.cam.snap=true; }
  }
  step(dt){
    const R=this.race,P=R.P,ph=this.ph,inp=this.inp,pr=this.pr;
    if(this.ghost>0) this.ghost-=dt; if(this.shield>0) this.shield-=dt; if(this.itemCD>0) this.itemCD-=dt;
    let fx=Math.sin(this.h),fz=Math.cos(this.h),rx=-fz,rz=fx;
    let vF=this.vx*fx+this.vz*fz, vS=this.vx*rx+this.vz*rz;
    this.i=P.nearest(this.x,this.z,this.i,8); P.project(this.x,this.z,this.i,pr);
    const halfRoad=pr.w/2+0.9; this.offroadRaw=Math.abs(pr.lat)>halfRoad && !P.tunnel[pr.i]; this.offroad=this.offroadRaw && !ph.allTerrain;
    if(this.mudT>0) this.mudT-=dt;
    this.onMud=!!(P.mud && P.mud[pr.i]) && Math.abs(pr.lat)<pr.w/2+4 && this.grounded;
    this.mudSlow=this.onMud && !ph.allTerrain && !(this.mudT>0);
    const onMedian=pr.median>0.3 && Math.abs(pr.lat)<pr.median+0.2;
    // --- steering input smoothing ---
    let st=inp.steer; if(this.spin>0) st=0;
    this.steerS+= (st-this.steerS)*Math.min(1,dt*(Math.abs(st)>Math.abs(this.steerS)?9:14));
    const s=this.steerS, sp=Math.abs(vF);
    // --- drift state ---
    if(this.grounded && !this.drifting && inp.drift && Math.abs(s)>0.3 && vF>14 && this.spin<=0){
      this.drifting=true; this.driftDir=Math.sign(s); this.driftT=0; this.tier=-1; this.vy=3.2; this.grounded=false; this.air=0;
      if(this.isPlayer) R.sfx('hop');
    }
    if(this.drifting){
      if(!inp.drift || vF<9 || this.spin>0){ this.endDrift(); }
      else if(this.grounded){ this.driftT+=dt*(0.6+0.4*Math.abs(s)+(s*this.driftDir>0?0.3:0))*clamp(Math.abs(this.yaw)/1.0,0.3,1.1);
        const t=DRIFT_TIERS.findIndex((x,k)=>this.driftT>=x && (k===2||this.driftT<DRIFT_TIERS[k+1]));
        if(t>this.tier){ this.tier=t; if(this.isPlayer) R.sfx('tier',t); } }
    }
    // --- yaw ---
    let yawT;
    if(this.drifting){ const amt=0.42+0.58*((s*this.driftDir)+1)/2; yawT=this.driftDir*ph.steer*amt*(0.85+ph.drift*0.3)/(1+sp/48); }
    else { yawT=s*ph.steer*clamp(sp/5,0,1)/(1+sp/34)*Math.sign(vF||1); if(inp.drift && sp>4) yawT*=1.35; }
    if(!this.grounded) yawT*=0.35;
    if(this.spin>0){ yawT=this.spinDir*9; this.spin-=dt; }
    this.yaw+=(yawT-this.yaw)*Math.min(1,dt*(this.grounded?9:3));
    this.h-=this.yaw*dt;
    // re-express velocity in new frame (velocity stays, heading rotated → slip appears)
    fx=Math.sin(this.h);fz=Math.cos(this.h);rx=-fz;rz=fx;
    vF=this.vx*fx+this.vz*fz; vS=this.vx*rx+this.vz*rz;
    // --- longitudinal ---
    const boosting=this.boost>0; if(boosting) this.boost-=dt;
    const slowK=(this.offroad?0.6:1)*(this.mudSlow?0.42:1)*(this.spin>0?0.5:1);
    let top=ph.top*this.rubber*this.skill*slowK*(boosting?(this.boostMul||1.28):1)+this.homeBonus*slowK;
    const vF0=vF;
    if(this.grounded){
      if(boosting){ if(vF<top) vF+=Math.max(ph.accel,40)*dt; }
      if(inp.thr>0 && this.spin<=0){ if(vF<top) vF+=ph.accel*inp.thr*Math.max(0.12,1-Math.pow(Math.max(0,vF)/top,2))*dt*(vF<0?2.2:1); }
      if(vF>top) vF-=(vF-top)*(this.offroad?2.2:1.1)*dt;
      if(inp.brk>0){ if(vF>0.5) vF-=40*inp.brk*dt*(this.drifting?0.3:1); else if(vF>-14) vF-=14*inp.brk*dt; }
      if(inp.thr<=0 && inp.brk<=0) vF-=vF*0.35*dt+Math.sign(vF)*Math.min(Math.abs(vF),2.5*dt*60/60);
      if(this.offroad && vF>top*0.8) vF-=vF*0.9*dt;
      if(this.mudSlow && vF>top*0.7) vF-=vF*1.6*dt;
      if(this.drifting) vF-=vF*0.04*dt;
      // lateral grip
      const g= this.drifting? 3.0+ph.drift*1.0 : (this.offroad?4.2:ph.grip) * (inp.drift&&!this.drifting?0.55:1);
      const nvS=vS*Math.exp(-g*dt); const lost=Math.abs(vS)-Math.abs(nvS);
      if(this.drifting) vF+=lost*0.3; else vF+=lost*0.12*Math.sign(vF);
      vS=nvS;
    } else { vS*=Math.exp(-0.4*dt); vF-=vF*0.02*dt; }
    this.lonA=lerp(this.lonA,(vF-vF0)/dt,0.1);
    this.latA=lerp(this.latA,this.yaw*vF,0.1);
    this.vF=vF; this.vS=vS;
    this.vx=fx*vF+rx*vS; this.vz=fz*vF+rz*vS;
    // --- integrate position ---
    this.x+=this.vx*dt; this.z+=this.vz*dt;
    this.i=P.nearest(this.x,this.z,this.i,8); P.project(this.x,this.z,this.i,pr);
    // --- vertical ---
    const along=this.vx*pr.tx+this.vz*pr.tz;
    const groundY=pr.gap?pr.h-40:pr.h;
    const u=pr.slope*along; // road vertical speed under the car
    if(this.grounded){
      const req=(u-this.uPrev)/dt;
      if(pr.gap || req<-GRAV*1.05){ this.grounded=false; this.vy=this.uPrev; this.air=0; }
      else { this.y=groundY; this.vy=u; }
    }
    if(!this.grounded){
      this.vy-=GRAV*dt; this.y+=this.vy*dt; this.air+=dt;
      if(this.y<=groundY){
        const imp=Math.max(0,u-this.vy); this.y=groundY; this.grounded=true;
        this.suspV-=Math.min(imp,14)*0.9; if(this.drifting && this.air<0.4){} else if(this.air>0.35){ if(this.isPlayer){ R.sfx('land',imp); R.shake(Math.min(0.5,imp*0.03)); } R.fx.dustBurst(this); }
        this.vy=u;
      }
      if(pr.gap && this.y<pr.h-6){ this.respawn(); return; }
    }
    this.uPrev=this.grounded?u:this.vy;
    if(this.grounded && !pr.gap && !this.offroad && Math.abs(pr.lat)<pr.w/2-1) this.lastSafe=pr.i;
    // --- walls (only when near road level) ---
    if(this.y>pr.h-4){
      const lim=this.halfW*0.9;
      let push=0,nx=0,nz=0;
      if(pr.lat>pr.wr-lim){ push=pr.lat-(pr.wr-lim); nx=-pr.rx; nz=-pr.rz; }
      else if(pr.lat<-pr.wl+lim){ push=(-pr.wl+lim)-pr.lat; nx=pr.rx; nz=pr.rz; }
      else if(onMedian || (pr.median>0.3 && Math.abs(pr.lat)<pr.median+lim)){ const sd=pr.lat>=0?1:-1; push=pr.median+lim-Math.abs(pr.lat); nx=pr.rx*sd; nz=pr.rz*sd; }
      if(push>0){ this.hitWall(push,nx,nz); }
    }
    // --- suspension spring ---
    const target=this.grounded? clamp(-this.lonA*0.004,-0.06,0.06):0.08;
    this.suspV+=((target-this.susp)*170-this.suspV*13)*dt; this.susp+=this.suspV*dt; this.susp=clamp(this.susp,-0.28,0.2);
    // stuck / wrong way detection
    const dirDot=fx*pr.tx+fz*pr.tz;
    if(dirDot<-0.4 && sp>3) this.wrongT+=dt; else this.wrongT=Math.max(0,this.wrongT-dt*2);
  }
  hitWall(push,nx,nz){
    const R=this.race; this.x+=nx*push; this.z+=nz*push;
    const vn=this.vx*nx+this.vz*nz;
    if(vn<0){
      const scrub=Math.max(0.55,1-(-vn)*0.022);
      let tx=(this.vx-nx*vn)*scrub, tz=(this.vz-nz*vn)*scrub;
      this.vx=tx-nx*vn*0.25; this.vz=tz-nz*vn*0.25;
      // nudge heading toward wall tangent
      const th=Math.atan2(tx,tz); const d=angDiff(this.h,th); if(Math.abs(d)<1.4) this.h+=d*Math.min(1,(-vn)*0.02);
      if(-vn>6){ if(this.drifting && -vn>12) this.endDrift(true); if(R.time-this.lastImpact>0.25){ this.lastImpact=R.time; R.impact(this,-vn,this.x-nx*this.halfW,this.y+0.5,this.z-nz*this.halfW); } }
      this.wallHit=0.3;
    }
  }
  endDrift(cancel){
    if(!this.drifting) return; this.drifting=false;
    if(!cancel && this.tier>=0){ this.giveBoost(DRIFT_BOOST[this.tier],1.2); if(this.isPlayer) this.race.sfx('boost',0.6+this.tier*0.2); }
    this.tier=-1; this.driftT=0;
  }
  giveBoost(t,mul=1.28){ this.boostMul=this.boost>0?Math.max(this.boostMul||1,mul):mul; this.boost=Math.max(this.boost,t); this.boostMax=Math.max(t,0.5); }
  spinOut(dur){ if(this.shield>0){ this.shield=0; this.race.sfx3d('shieldPop',this); return false; } this.spin=dur; this.spinDir=Math.random()<0.5?-1:1; this.endDrift(true); this.boost=0; this.vx*=0.45; this.vz*=0.45; return true; }
  // --- visuals ---
  visual(dt,t){
    const m=this.model, R=this.race, pr=this.pr;
    if(this.loop){ const L=R.P.loop, th=this.loop.th, c=Math.cos(th), sn=Math.sin(th); const V=Car._lv||(Car._lv=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3(),new THREE.Matrix4()]);
      V[0].set(L.fz,0,-L.fx); V[1].set(-L.fx*sn,c,-L.fz*sn); V[2].set(L.fx*c,sn,L.fz*c); V[3].makeBasis(V[0],V[1],V[2]); m.root.quaternion.setFromRotationMatrix(V[3]);
      m.root.position.set(this.x,this.y,this.z); m.chassis.position.y=0; m.chassis.rotation.set(0,0,0); const spin=this.vF/m.dims.wr*dt; for(const w of m.wheels) w.rotation.x+=spin; m.steerPivots.forEach(p=>p.rotation.y=0); this.pitch=0; this.visYaw=0; return; }
    m.root.position.set(this.x,this.y+this.susp*0.3,this.z);
    const vis=this.drifting? -this.driftDir*0.32 : clamp(-this.vS*0.02,-0.2,0.2);
    this.visYaw+=(vis-this.visYaw)*Math.min(1,dt*6);
    m.root.rotation.order='YXZ'; m.root.rotation.y=this.h+this.visYaw;
    let targetPitch;
    if(this.grounded){ const fx=Math.sin(this.h),fz=Math.cos(this.h); const d=fx*pr.tx+fz*pr.tz; targetPitch=-Math.atan(pr.slope*d); }
    else { targetPitch=clamp(-Math.atan2(this.vy,Math.max(8,Math.abs(this.vF)))*0.6,-0.5,0.5); }
    this.pitch+=(targetPitch-this.pitch)*Math.min(1,dt*(this.grounded?14:3)); m.root.rotation.x=this.pitch;
    m.root.rotation.z=0;
    const ch=m.chassis; ch.position.y=-this.susp*0.7+(this.grounded?0:0.05);
    ch.rotation.x=clamp(this.lonA*0.0035,-0.07,0.07)+clamp(this.suspV*0.01,-0.04,0.04);
    ch.rotation.z=clamp(-this.latA*0.0028,-0.09,0.09);
    const wr=m.dims.wr; const spin=this.vF/wr*dt;
    for(const w of m.wheels) w.rotation.x+=spin;
    const sa=this.drifting? this.steerS*0.25-this.driftDir*0.3 : this.steerS*0.42;
    m.steerPivots.forEach(p=>p.rotation.y=-sa);
    const hover=this.grounded?0:0.12;
    m.wheels.forEach((w,k)=>{ w.parent.position.y=m.dims.wr-Math.max(-0.12,Math.min(0.12,this.susp*0.3))-hover*0; });
    const braking=this.inp.brk>0&&this.vF>1;
    m.tailMat.color.setRGB(braking?1:0.55,braking?0.12:0.03,braking?0.2:0.08);
    const b=this.boost>0; m.flames.forEach(f=>{ f.visible=b; if(b){ f.scale.z=0.8+Math.random()*0.9; } });
    if(b) m.flameMat.color.setHex(this.boostMax>1.3?0xff4fe0:0x6ff3ff);
    m.shield.visible=this.shield>0; if(this.shield>0){ m.shield.material.uniforms.t.value=t; m.shield.visible=this.shield>1.5||Math.sin(t*30)>0; }
    if(m.lightbar){ const f=Math.sin(t*14)>0; m.lightbar.red.color.setHex(f?0xff1030:0x300008); m.lightbar.blue.color.setHex(f?0x10103a:0x1a55ff); }
    if(m.anims) for(const f of m.anims) f(dt,t,this);
    m.root.visible= this.ghost>0 ? (Math.sin(t*40)>-0.3) : true;
    // effects
    const fx=R.fx; const fxv=Math.sin(this.h), fzv=Math.cos(this.h), rxv=-fzv, rzv=fxv;
    const rearZ=-m.dims.L*0.42, hw=m.dims.W*0.42;
    const near=R.nearCam(this);
    const slide=this.grounded && (this.drifting || Math.abs(this.vS)>4.5 || (braking&&this.vF>18));
    this.skidAmt=slide?Math.min(1,(Math.abs(this.vS)+(this.drifting?6:0))/12):0;
    for(let k=0;k<2;k++){
      const sd=k?1:-1; const wx=this.x+fxv*rearZ+rxv*hw*sd, wz=this.z+fzv*rearZ+rzv*hw*sd, wy=this.y+0.04;
      if(slide && !this.offroad){ const pw=this.prevWheel[k]; if(pw) fx.skids.add(pw[0],pw[1],pw[2],wx,wy,wz,rxv,rzv,0.16); this.prevWheel[k]=[wx,wy,wz]; } else this.prevWheel[k]=null;
      if(!near) continue;
      if(this.drifting && this.grounded){
        const c=this.tier>=0?TIER_COL[this.tier]:[1,0.9,0.7];
        const n=this.tier>=0?2:1;
        for(let q=0;q<n;q++) fx.sparks.emit(wx,wy+0.1,wz,-this.vx*0.1+rxv*sd*rr(1,4)+rr(-1,1),rr(1.5,4),-this.vz*0.1+rzv*sd*rr(1,4)+rr(-1,1),rr(0.2,0.4),this.tier>=0?0.35:0.22,0.05,c[0],c[1],c[2],1,2,9);
      }
      if(this.onMud && Math.abs(this.vF)>4 && Math.random()<0.8){ fx.dust.emit(wx,wy+0.2,wz,-this.vx*0.1+rr(-2,2),rr(1.5,4.5),-this.vz*0.1+rr(-2,2),rr(0.5,0.9),0.35,1.4,0.33,0.2,0.1,0.9,1.2,6); }
      if(R.def.dirt && !this.offroad && Math.abs(this.vF)>9 && Math.random()<0.2) fx.dust.emit(wx,wy+0.2,wz,-this.vx*0.12+rr(-1,1),rr(0.5,1.8),-this.vz*0.12+rr(-1,1),rr(0.6,1.1),0.5,2.6,R.dustCol[0],R.dustCol[1],R.dustCol[2],0.3,1.5,-0.3);   /* dirt stage: a dust trail on the road itself */
      if(((this.offroad||(this.offroadRaw&&this.ph.allTerrain)) && Math.abs(this.vF)>6) || (slide && Math.random()<0.4)){
        const dc=R.W.th.night?[0.35,0.33,0.45]:((this.offroad||this.offroadRaw)?R.dustCol:[0.85,0.85,0.85]);
        if(Math.random()<(this.offroad?0.7:0.35)) fx.dust.emit(wx,wy+0.2,wz,-this.vx*0.15+rr(-1,1),rr(0.5,2),-this.vz*0.15+rr(-1,1),rr(0.6,1.1),0.5,2.4,dc[0],dc[1],dc[2],this.offroad?0.45:0.25,1.5,-0.3);
      }
    }
    if(b && near){ for(const sd of [-1,1]){ const ex=this.x+fxv*(rearZ-0.3)+rxv*0.35*sd, ez=this.z+fzv*(rearZ-0.3)+rzv*0.35*sd; const c=this.boostMax>1.3?[1,0.35,0.9]:[0.4,0.9,1];
      fx.sparks.emit(ex,this.y+0.35,ez,-fxv*8+rr(-1,1)+this.vx*0.6,rr(0,1),-fzv*8+rr(-1,1)+this.vz*0.6,0.18,0.45,0.1,c[0],c[1],c[2],0.9,3,0); } }
  }
  get speed(){ return Math.hypot(this.vx,this.vz); }
}

// ===== CPU DRIVER =====
// shared per-track analysis: racing line + curvature
function analyzeTrack(P){
  const N=P.N, sp=P.spacing;
  // smoothed |curvature| and signed curvature
  const ca=new Float32Array(N), cs=new Float32Array(N);
  const K=6;
  for(let i=0;i<N;i++){ let a=0,b=0; for(let k=-K;k<=K;k++){ const j=(i+k+N)%N; a=Math.max(a,Math.abs(P.curv[j])); b+=P.curv[j]; } ca[i]=a; cs[i]=b/(2*K+1); }
  // racing line: inside at apex, outside on entry/exit
  const line=new Float32Array(N);
  for(let i=0;i<N;i++){
    let ahead=0,wsum=0; for(let k=-10;k<=22;k++){ const j=(i+k+N)%N; const w=k<0?0.5:1; ahead+=cs[j]*w; wsum+=w; } ahead/=wsum;
    const room=Math.max(0,P.w[i]/2-2.2);
    line[i]=-clamp(ahead*420,-1,1)*room; // inside of the turn (right = +lat)
  }
  for(let pass=0;pass<12;pass++){ const t=line.slice(); for(let i=0;i<N;i++){ let s=0; for(let k=-4;k<=4;k++) s+=t[(i+k+N)%N]; line[i]=s/9; } }
  // medians: pick one side per median run and blend in/out smoothly
  const med=[]; for(let i=0;i<N;i++) med.push(P.median[i]>0.05);
  let s0=0; while(s0<N && med[s0]) s0++;
  for(let k=0;k<N;k++){ const i=(s0+k)%N; if(!med[i] || med[(i-1+N)%N]) continue;
    let e=i, n=0; while(med[e%N] && n<N){ e++; n++; }
    let sum=0; for(let q=-40;q<-5;q++) sum+=line[(i+q+N)%N]; const side=sum<0?-1:1;
    for(let q=-45;q<n+30;q++){ const j=(i+q+N)%N; const mi=(i+clamp(q,0,n-1)+N)%N; const want=side*Math.min(P.median[mi]+2.8,P.w[j]/2-1.6);
      const blend=q<0?smooth01((q+45)/45):q>=n?smooth01((n+30-q)/30):1; const ok=side>0?Math.max(line[j],want):Math.min(line[j],want); line[j]=lerp(line[j],ok,blend); } }
  for(let i=0;i<N;i++){ const room=P.w[i]/2-1.6; line[i]=clamp(line[i],-room,room); }
  // jump approach: go straight down the middle-ish
  (P.def.jumps||[]).forEach(j=>{ const n=Math.round((j.len+j.gap)/sp)+14; for(let k=-20;k<n;k++){ const i=(j.i0+k+N)%N; line[i]*=0.2; } });
  return {ca,cs,line};
}
function speedProfile(P,A,steer){
  const N=P.N, v=new Float32Array(N);
  for(let i=0;i<N;i++){ const c=Math.max(A.ca[i],1e-5); const R=1/c; const cc=steer*R*0.82; v[i]=Math.min(80,(-1+Math.sqrt(1+4*cc/34))*17); }
  // jumps: never brake on kickers
  (P.def.jumps||[]).forEach(j=>{ const n=Math.round((j.len+j.gap)/P.spacing)+8; for(let k=-12;k<n;k++){ const q=(j.i0+k+N)%N; v[q]=Math.min(v[q],j.gap>0?36:42); } });
  const a=24, ds=P.spacing;
  for(let pass=0;pass<2;pass++) for(let q=2*N-1;q>=0;q--){ const i=q%N, j=(i+1)%N; v[i]=Math.min(v[i],Math.sqrt(v[j]*v[j]+2*a*ds)); }
  return v;
}
class AIDriver{
  constructor(car,race,skill,aggr){
    this.car=car; this.race=race; this.skill=skill; this.aggr=aggr;
    this.prof=speedProfile(race.P,race.A,car.ph.steer);
    this.lane=0; this.laneT=0; this.laneTimer=Math.random()*0.2; this.stuck=0; this.revT=0; this.stuckTotal=0; this.itemHold=0;
    this.wob=Math.random()*100; this.follow=null; this.cornerAcc=0; this.inCorner=false;
    const d=race.opt?race.opt.diff:'normal'; this.diff=d;
    this.corner=({easy:0.92,normal:1.0,hard:1.08})[d]||1.0; if(car.isPlayer) this.corner=0.97;
    this.driftSkill=0; this.boostSkill=car.isPlayer?0:(({easy:0,normal:0.5,hard:1})[d]||0);
  }
  // route tracks: after the finish, pull over into the Yorktown victory lane (never through the return portal again)
  parkUpdate(dt){
    const c=this.car, R=this.race, P=R.P, N=P.N, inp=c.inp; inp.drift=false; inp.item=false;
    if(c.parked){ inp.thr=0; inp.brk=1; inp.steer=0; return; }
    if(!this.park){ const k=(c.finishPos||1)-1, Y=R.route.york; const pi=(Y+14+Math.floor(k/2)*6)%N; this.park={i:pi,lat:(k%2?1:-1)*(P.w[pi]/2+0.4)}; }
    const pk=this.park, i=c.pr.i, v=Math.max(0,c.vF);
    let d=((pk.i-i+N)%N)*P.spacing; if(d>P.L/2) d=0;
    const ia=(i+Math.round((2+v*0.16)/P.spacing))%N; const th=Math.atan2(P.tx[ia],P.tz[ia]);
    const e=c.pr.lat-pk.lat*smooth01(1-d/60); const vd=clamp(-1.0*e,-0.3*Math.max(v,6),0.3*Math.max(v,6));
    const hd=th-Math.asin(clamp(vd/Math.max(v,6),-0.9,0.9)); const hv=c.speed>4?Math.atan2(c.vx,c.vz):c.h;
    const steerGain=c.ph.steer*clamp(v/5,0,1)/(1+v/34); const ff=-v*P.curv[ia];
    inp.steer=clamp((steerGain>0.05?ff/steerGain:0)+3.2*angDiff(hd,hv),-1,1);
    const vT=Math.sqrt(2*9*Math.max(0,d-1.5)); inp.thr=v<vT-1?0.6:0; inp.brk=v>vT+1?1:(d<2?1:0);
    if(d<2 && c.speed<0.6){ c.parked=true; c.vx=c.vz=0; }
  }
  update(dt){
    const c=this.car, R=this.race, P=R.P, A=R.A, inp=c.inp, N=P.N, sp=P.spacing;
    if(R.route && c.finished) return this.parkUpdate(dt);
    const v=Math.max(0,c.vF), i=c.pr.i!==undefined?c.pr.i:c.i;
    // ---------- traffic awareness (4 Hz) ----------
    this.laneTimer-=dt;
    if(this.laneTimer<=0){
      this.laneTimer=0.1; let want=0; this.follow=null; const myLat=c.pr.lat;
      for(const o of R.cars){ if(o===c||o.ghost>0||Math.abs(o.y-c.y)>2||(R.route&&o.finished)) continue;
        let d=((o.i-i+N)%N); if(d>N/2) d-=N; d*=sp; const dl=o.pr.lat-myLat;
        // car ahead in my path
        if(d>0 && d<10+v*0.45 && Math.abs(dl)<2.7){
          const closing=v-Math.max(0,o.vF);
          if(closing>-1){ const room=P.w[o.i]/2-1.8; const passR=room-o.pr.lat, passL=room+o.pr.lat;
            const side=(passR>=2.6&&(passR>passL||passL<2.6))?1:(passL>=2.6?-1:0);
            if(side!==0) want+=side*(2.9-Math.abs(dl)*0.4)*(0.9+this.aggr*0.4);
            if(!this.follow||d<this.follow.d) this.follow={d,v:Math.max(0,o.vF),dl}; }
        }
        // car alongside: give it room
        if(Math.abs(d)<5.5 && Math.abs(dl)<3.2){ want+=(dl>0?-1:1)*(3.2-Math.abs(dl))*0.9; }
      }
      for(const s of R.slicks){ const si=P.nearest(s.x,s.z,i,40); let d=((si-i+N)%N)*sp; if(d>2 && d<35){ const sl=P.project(s.x,s.z,si,{}).lat; const dl=sl-(A.line[si]+this.lane); if(Math.abs(dl)<2.8) want+=(dl>0?-1:1)*(3-Math.abs(dl)); } }
      // aim for boost pads ahead
      if(!this.follow) for(const p of R.W.pads){ let d=((p.i-i+N)%N)*sp; if(d>8&&d<60){ const dl=p.lat-A.line[p.i]; if(Math.abs(dl)<4.5 && Math.abs(this.laneT)<0.5) want+=dl*0.8; } }
      this.laneT=clamp(want,-5.5,5.5);
    }
    this.lane+=(this.laneT-this.lane)*Math.min(1,dt*2.2);
    if(Math.abs(this.laneT)<0.1) this.lane*=Math.exp(-dt*0.8);
    // ---------- steering: feed-forward curvature + Stanley lateral control ----------
    const ahead=Math.round((2+v*0.16)/sp);
    const ia=(i+ahead)%N, ib=(ia+4)%N;
    const room=P.w[ia]/2-1.5;
    let tgt=clamp(A.line[ia]+this.lane,-room,room);
    let mA=0; for(let k=0;k<14;k+=2) mA=Math.max(mA,P.median[(i+k)%N]);
    if(mA>0.3){ const m=mA+2.4; const side=Math.abs(c.pr.lat)>0.6?Math.sign(c.pr.lat):(Math.sign(tgt)||1); if(Math.sign(tgt)!==side||Math.abs(tgt)<m) tgt=side*Math.min(Math.max(Math.abs(tgt),m),room); }
    const lineSlope=(A.line[ib]-A.line[ia])/(4*sp);
    const th=Math.atan2(P.tx[ia],P.tz[ia]);
    const e=c.pr.lat-tgt; // + = too far right
    let vd=v*lineSlope-1.15*e; vd=clamp(vd,-0.3*Math.max(v,6),0.3*Math.max(v,6));
    const hd=th-Math.asin(clamp(vd/Math.max(v,6),-0.9,0.9));
    const hv=c.speed>4?Math.atan2(c.vx,c.vz):c.h;
    const ff=-v*P.curv[ia]; // yaw rate needed (+ = right; curv + = left)
    const steerGain=c.ph.steer*clamp(v/5,0,1)/(1+v/34);
    let steer=(steerGain>0.05?ff/steerGain:0)+3.2*angDiff(hd,hv);
    steer=clamp(steer,-1,1);
    // ---------- speed ----------
    let vT=1e9; const la=Math.round((4+v*0.4)/sp); for(let k=0;k<=la;k+=2){ vT=Math.min(vT,this.prof[(i+k)%N]); }
    vT*=this.corner*(1+Math.max(0,c.rubber-1)*0.5);
    if(this.follow){ const f=this.follow; const gap=f.d-c.halfL*2-0.8; const allowed=f.v+Math.max(0,gap)*0.8-(gap<0?3:0); const dlNow=f.dl-(this.lane-this.laneT)*0; if(Math.abs(f.dl)<2.4) vT=Math.min(vT,allowed); }
    let thr=1,brk=0;
    if(v>vT+1.2){ thr=0; brk=clamp((v-vT)/5,0.2,1); } else if(v>vT-0.5){ thr=0.4; }
    if(Math.abs(e)>4 && v>20){ thr=Math.min(thr,0.5); }
    // corner-exit boost (stands in for the drift boosts a skilled player earns)
    const cornerNow=this.prof[i]<c.ph.top*0.75;
    if(cornerNow){ this.cornerAcc=(this.cornerAcc||0)+dt; this.inC2=true; }
    else if(this.inC2){ this.inC2=false; if((this.boostSkill||0)>0 && this.cornerAcc>0.8 && Math.random()<this.boostSkill) c.giveBoost(Math.min(1.1,0.4+this.cornerAcc*0.3),1.2); this.cornerAcc=0; }
    // ---------- real drifting (disabled for CPUs; kept for experiments) ----------
    const ca=(i+6)%N, dirWant=-Math.sign(P.curv[ca]||0);
    const cornerSoon=this.prof[ca]<c.ph.top*0.82 && Math.abs(P.curv[ca])>0.008;
    if(cornerSoon && !this.inCorner){ this.inCorner=true; this.dRoll=Math.random(); } else if(!cornerSoon && this.prof[i]>c.ph.top*0.9) this.inCorner=false;
    let wantDrift=false;
    if(this.driftSkill>0 && this.revT<=0){
      if(c.drifting){
        const K=c.ph.steer*(0.85+c.ph.drift*0.3)/(1+Math.abs(c.vF)/48); const yd=steer*steerGain; const amt=yd*c.driftDir/Math.max(0.05,K);
        const stillCorner=this.prof[i]<c.ph.top*0.9 || cornerSoon;
        if(stillCorner && Math.abs(e)<3.8 && amt>0.25 && amt<1.3){ wantDrift=true; const a2=clamp(amt,0.42,1); steer=c.driftDir*(2*(a2-0.42)/0.58-1); }
      } else if(this.inCorner && this.dRoll<this.driftSkill && v>18 && !this.follow && Math.sign(steer)===dirWant && Math.abs(steer)>0.32 && Math.abs(e)<2.5){ wantDrift=true; }
    }
    // ---------- recovery ----------
    if(this.revT>0){ this.revT-=dt; thr=0; brk=1; steer=-Math.sign(e||1)*-1; steer=e>0?-1:1; steer=-steer; }
    else if(R.state==='race'||R.state==='finish'||R.state==='done'){
      if(c.speed<2.2 && c.spin<=0 && c.grounded){ this.stuck+=dt; this.stuckTotal+=dt; } else { this.stuck=0; this.stuckTotal=Math.max(0,this.stuckTotal-dt*0.5); }
      if(this.stuck>1.1){ this.revT=1.1; this.stuck=0; }
      if(this.stuckTotal>4.5 || c.wrongT>2.5){ c.respawn(); this.stuckTotal=0; this.revT=0; }
      // progress watchdog: whatever pins a car (wedged on scenery, perched off the ground, pushing into a wall), no progress for 8 s -> respawn
      if(R.state==='race' && !c.finished && (c!==R.player||GAME.autopilot)){ if(this.progS==null || c.score>this.progS+20 || c.score<this.progS-400){ this.progS=c.score; this.progT=0; } else if((this.progT+=dt)>8){ c.respawn(); this.progS=null; this.stuckTotal=0; this.revT=0; } }
    }
    inp.thr=thr; inp.brk=brk; inp.steer=steer; inp.drift=wantDrift;
    // ---------- items ----------
    inp.item=false;
    if(c.item && c.itemDelay<=0){
      this.itemHold+=dt;
      if(c.item==='nitro'){ let clear=true; for(let k=0;k<40;k+=3){ if(this.prof[(i+k)%N]<v+10) {clear=false;break;} } if((clear&&!this.follow&&this.itemHold>0.5)||this.itemHold>8) inp.item=true; }
      else if(c.item==='aegis'){ if(this.itemHold>2+this.wob%3) inp.item=true; }
      else if(c.item==='slick'){ let behind=false; for(const o of R.cars){ if(o===c) continue; const d=((i-o.i+N)%N)*sp; if(d>3&&d<25&&Math.abs(o.pr.lat-c.pr.lat)<3) behind=true; } if((behind&&this.itemHold>0.6)||this.itemHold>10) inp.item=true; }
    } else this.itemHold=0;
  }
}

// ===== AUDIO (Web Audio, fully procedural) =====
class AudioEngine{
  constructor(settings){ this.S=settings; this.ctx=null; this.ok=false; this.musicMode='menu'; this.step=0; this.nextT=0; this.bar=0; }
  init(){
    if(this.ctx){ if(this.ctx.state==='suspended') this.ctx.resume(); return; }
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
    try{ this.ctx=new AC(); }catch(e){ return; }
    const c=this.ctx; this.master=c.createGain(); this.master.connect(c.destination);
    this.comp=c.createDynamicsCompressor(); this.comp.threshold.value=-14; this.comp.ratio.value=4; this.comp.connect(this.master);
    this.sfxG=c.createGain(); this.sfxG.connect(this.comp); this.musG=c.createGain(); this.musG.connect(this.comp);
    // noise buffer
    const nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate), d=nb.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; this.noise=nb;
    // music delay bus
    this.dly=c.createDelay(1); this.dly.delayTime.value=60/108*0.75; this.fb=c.createGain(); this.fb.gain.value=0.32; const dlf=c.createBiquadFilter(); dlf.type='lowpass'; dlf.frequency.value=2400;
    this.dly.connect(dlf); dlf.connect(this.fb); this.fb.connect(this.dly); dlf.connect(this.musG);
    this.ok=true; this.apply(); this.nextT=c.currentTime+0.1;
    this.timer=setInterval(()=>this.schedule(),60);
  }
  apply(){ if(!this.ok) return; const S=this.S, t=this.ctx.currentTime;
    this.master.gain.setTargetAtTime(S.master,t,0.05); this.sfxG.gain.setTargetAtTime(S.sfx,t,0.05); this.musG.gain.setTargetAtTime(S.musicOn?S.music*0.55:0,t,0.1); }
  // ---------- engine / loops ----------
  startLoops(){
    if(!this.ok||this.eng) return; const c=this.ctx;
    const e={}; e.o1=c.createOscillator(); e.o1.type='sawtooth'; e.o2=c.createOscillator(); e.o2.type='square'; e.o3=c.createOscillator(); e.o3.type='triangle';
    e.f=c.createBiquadFilter(); e.f.type='lowpass'; e.f.Q.value=3; e.g=c.createGain(); e.g.gain.value=0;
    const g2=c.createGain(); g2.gain.value=0.5; e.o1.connect(e.f); e.o2.connect(g2); g2.connect(e.f); e.o3.connect(e.f); e.f.connect(e.g); e.g.connect(this.sfxG);
    [e.o1,e.o2,e.o3].forEach(o=>o.start());
    // opponents hum
    e.ao=c.createOscillator(); e.ao.type='sawtooth'; e.af=c.createBiquadFilter(); e.af.type='lowpass'; e.af.frequency.value=500; e.ag=c.createGain(); e.ag.gain.value=0; e.ao.connect(e.af); e.af.connect(e.ag); e.ag.connect(this.sfxG); e.ao.start();
    // skid
    const mk=(type,f,q)=>{ const s=c.createBufferSource(); s.buffer=this.noise; s.loop=true; const bf=c.createBiquadFilter(); bf.type=type; bf.frequency.value=f; bf.Q.value=q; const g=c.createGain(); g.gain.value=0; s.connect(bf); bf.connect(g); g.connect(this.sfxG); s.start(); return {s,bf,g}; };
    e.skid=mk('bandpass',1800,4); e.wind=mk('lowpass',600,0.5); e.rough=mk('lowpass',300,1);
    this.eng=e;
  }
  stopLoops(){ if(!this.eng) return; const e=this.eng; try{ [e.o1,e.o2,e.o3,e.ao,e.skid.s,e.wind.s,e.rough.s].forEach(o=>o.stop()); }catch(x){} [e.g,e.ag,e.skid.g,e.wind.g,e.rough.g].forEach(g=>g.disconnect()); this.eng=null; }
  updateCar(car,other,paused){
    if(!this.eng) return; const e=this.eng,t=this.ctx.currentTime;
    if(paused){ [e.g,e.ag,e.skid.g,e.wind.g,e.rough.g].forEach(g=>g.gain.setTargetAtTime(0,t,0.05)); return; }
    const v=Math.abs(car.vF), top=car.ph.top*1.1; const gears=[0,0.16,0.3,0.46,0.63,0.82,1.2];
    const r=v/top; let gi=1; while(gi<gears.length-1&&r>gears[gi]) gi++;
    const lo=gears[gi-1], hi=gears[gi]; let rpm=0.28+0.72*clamp((r-lo)/(hi-lo),0,1); if(!car.grounded) rpm=Math.min(1.05,rpm+0.2); if(car.inp.thr>0&&v<3) rpm=0.45+Math.random()*0.03;
    const f=48+rpm*115+(car.boost>0?15:0);
    e.o1.frequency.setTargetAtTime(f,t,0.03); e.o2.frequency.setTargetAtTime(f*0.5,t,0.03); e.o3.frequency.setTargetAtTime(f*2.01,t,0.03);
    e.f.frequency.setTargetAtTime(400+rpm*1400*(car.inp.thr>0?1.4:0.8),t,0.05);
    e.g.gain.setTargetAtTime(0.09+0.06*(car.inp.thr>0?1:0.4),t,0.05);
    e.skid.g.gain.setTargetAtTime(car.skidAmt*0.16*(car.offroad?0.2:1),t,0.04);
    e.wind.g.gain.setTargetAtTime(clamp(v/60,0,1)*0.12,t,0.1); e.wind.bf.frequency.setTargetAtTime(300+v*14,t,0.1);
    e.rough.g.gain.setTargetAtTime(car.offroad&&v>4?0.25:0,t,0.05);
    if(other){ const d=other.d; e.ao.frequency.setTargetAtTime(60+other.v*2.2,t,0.05); e.ag.gain.setTargetAtTime(clamp(1-d/30,0,1)*0.05,t,0.08); } else e.ag.gain.setTargetAtTime(0,t,0.1);
  }
  // ---------- one-shots ----------
  tone(freq,dur,type='sine',vol=0.2,when=0,slideTo=null,dest=null){
    if(!this.ok) return; const c=this.ctx,t=c.currentTime+when; const o=c.createOscillator(),g=c.createGain(); o.type=type; o.frequency.setValueAtTime(freq,t);
    if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo,t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(dest||this.sfxG); o.start(t); o.stop(t+dur+0.05);
  }
  burst(dur,f,vol,type='lowpass',when=0,fEnd=null,dest=null){
    if(!this.ok) return; const c=this.ctx,t=c.currentTime+when; const s=c.createBufferSource(); s.buffer=this.noise; const bf=c.createBiquadFilter(); bf.type=type; bf.frequency.setValueAtTime(f,t); if(fEnd) bf.frequency.exponentialRampToValueAtTime(fEnd,t+dur);
    const g=c.createGain(); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); s.connect(bf); bf.connect(g); g.connect(dest||this.sfxG); s.start(t,Math.random()); s.stop(t+dur+0.05);
  }
  play(name,a=0){
    if(!this.ok) return;
    switch(name){
      case 'blip': this.tone(880,0.07,'square',0.06); break;
      case 'select': this.tone(660,0.08,'square',0.07); this.tone(1320,0.12,'square',0.06,0.06); break;
      case 'back': this.tone(520,0.1,'square',0.06,0,300); break;
      case 'count': this.tone(660,0.28,'square',0.13); this.tone(660,0.28,'sine',0.15); break;
      case 'go': this.tone(1320,0.6,'square',0.12); this.tone(1320,0.6,'sine',0.16); this.tone(660,0.6,'sawtooth',0.05); break;
      case 'impact': { const v=clamp(a/25,0.15,1); this.burst(0.25,900,0.5*v); this.tone(90,0.25,'sine',0.35*v,0,40); break; }
      case 'bump': this.burst(0.15,1400,0.25); this.tone(140,0.14,'triangle',0.2,0,70); break;
      case 'boost': this.burst(0.7,300,0.35,'bandpass',0,3500); this.tone(220,0.6,'sawtooth',0.08*(a||1),0,660); break;
      case 'pad': this.burst(0.6,500,0.3,'bandpass',0,4000); this.tone(440,0.35,'square',0.06,0,880); break;
      case 'hop': this.tone(300,0.08,'triangle',0.1,0,500); break;
      case 'tier': this.tone([700,900,1200][a]||700,0.15,'square',0.07); this.tone(([700,900,1200][a]||700)*1.5,0.15,'sine',0.07,0.05); break;
      case 'pickup': [0,1,2].forEach(k=>this.tone([784,988,1318][k],0.12,'square',0.07,k*0.05)); break;
      case 'roll': this.tone(1200+Math.random()*400,0.03,'square',0.035); break;
      case 'item': this.tone(1046,0.18,'triangle',0.12); this.tone(1568,0.2,'sine',0.1,0.06); break;
      case 'shield': this.tone(300,0.5,'sine',0.14,0,1200); this.tone(600,0.4,'triangle',0.06,0.05,1800); break;
      case 'shieldPop': this.burst(0.3,3000,0.3,'highpass'); this.tone(1400,0.25,'sine',0.12,0,300); break;
      case 'drop': this.tone(200,0.2,'sine',0.2,0,60); this.burst(0.2,600,0.2); break;
      case 'splat': this.burst(0.35,700,0.4,'lowpass',0,200); this.tone(500,0.4,'sawtooth',0.08,0,120); break;
      case 'land': this.tone(70,0.2,'sine',clamp(a/20,0.1,0.4),0,40); this.burst(0.12,700,clamp(a/40,0.05,0.3)); break;
      case 'respawn': this.tone(400,0.3,'sine',0.12,0,900); break;
      case 'lap': [0,1].forEach(k=>this.tone([880,1175][k],0.18,'square',0.08,k*0.12)); break;
      case 'final': [0,1,2].forEach(k=>this.tone([659,880,1318][k],0.22,'square',0.09,k*0.13)); break;
      case 'finish': [[523,659,784],[587,740,880],[659,831,988],[784,988,1175]].forEach((ch,k)=>ch.forEach(f=>this.tone(f,k===3?1.2:0.28,'square',0.05,k*0.2))); this.burst(1.5,2000,0.15,'highpass',0.6); break;
      case 'shot': { const v=a||1; this.burst(0.09,2500,0.55*v,'highpass'); this.tone(220,0.12,'square',0.12*v,0,50); this.burst(0.35,700,0.12*v,'lowpass',0.05,200); break; }
      case 'hit': this.tone(1800,0.15,'triangle',0.15,0,900); this.burst(0.25,1200,0.4); this.tone(120,0.25,'sine',0.3,0,50); break;
      case 'warn': this.tone(880,0.12,'square',0.07); this.tone(880,0.12,'square',0.07,0.18); break;
      case 'wrong': this.tone(220,0.2,'square',0.06); break;
      case 'portal': this.burst(0.9,400,0.3,'bandpass',0,5200); this.tone(180,0.9,'sine',0.16,0,1400); this.tone(900,0.6,'triangle',0.05,0.1,300); break;
      case 'whistle': { const v=clamp(a||0.5,0.03,1); this.tone(1900,1.1,'sine',0.07*v,0,700); this.tone(1320,1.1,'triangle',0.035*v,0.02,520); break; }
      case 'cannon': { const v=clamp(a||0.5,0.03,1); this.burst(0.08,3000,0.25*v,'highpass'); this.burst(1.3,260,0.7*v,'lowpass',0.02,60); this.tone(55,0.7,'sine',0.5*v,0,28); break; }
      case 'thud': { const v=clamp(a||0.3,0.02,1); this.burst(0.6,320,0.4*v,'lowpass',0,90); this.tone(48,0.4,'sine',0.3*v,0,30); break; }
      case 'cheer': { const v=clamp(a||0.5,0.05,1); for(let k=0;k<3;k++) this.burst(1.6,900+k*500,0.10*v,'bandpass',k*0.25,1100+k*600); break; }
    }
  }
  // ---------- music sequencer ----------
  setMusic(mode){ this.musicMode=mode; }
  schedule(){
    if(!this.ok||!this.S.musicOn||this.S.music<=0.001) { if(this.ok) this.nextT=Math.max(this.nextT,this.ctx.currentTime+0.05); return; }
    const c=this.ctx, spb=60/108, st=spb/4;
    if(this.nextT<c.currentTime-0.2) this.nextT=c.currentTime+0.05;
    while(this.nextT<c.currentTime+0.25){ this.note16(this.step,this.nextT,st); this.step=(this.step+1)%256; this.nextT+=st; }
  }
  note16(s,t,st){
    const c=this.ctx, M=this.musG, race=this.musicMode==='race', calm=this.musicMode==='menu';
    const chords=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]]; // Am F C G
    const bar=Math.floor(s/16)%4, ch=chords[bar], p=s%16, sec=Math.floor(s/64);
    const mf=n=>440*Math.pow(2,(n-69)/12);
    // bass: 8ths, octave pulse
    if(p%2===0){ const n=ch[0]-24+(p%4===2?12:0); this.voice(mf(n),st*1.8,'sawtooth',race?0.13:0.09,t,M,500+(race?300:0)); }
    // pad at bar start
    if(p===0){ ch.forEach(n=>{ this.voice(mf(n),st*16,'sawtooth',0.028,t,M,1200,0.6,true); this.voice(mf(n)*1.006,st*16,'sawtooth',0.02,t,M,1200,0.6,true); }); }
    // arp
    if(!calm || sec%2===1){ const arp=[0,1,2,1,0,2,1,2]; const n=ch[arp[p%8]]+12+(p>=8&&race?12:0); if(p%2===0||race) this.voice(mf(n),st*0.9,'square',race?0.035:0.03,t,this.dly,2600); }
    // drums
    if(race || sec%2===1){
      if(p%4===0) this.kick(t,race?0.55:0.35);
      if(p===4||p===12) this.snare(t,race?0.25:0.15);
      if(race && p%2===1) this.hat(t,0.05); else if(p%4===2) this.hat(t,0.05);
    }
    // lead melody in race mode, second half
    if(race && sec%2===1){ const mel=[[76,0],[74,4],[72,6],[74,8],[76,12]]; mel.forEach(([n,q])=>{ if(q===p && (bar%2===0)) this.voice(mf(n+(bar===2?-5:0)),st*3,'square',0.03,t,this.dly,1800); }); }
  }
  voice(f,dur,type,vol,t,dest,cut,atk=0.005,pad=false){
    const c=this.ctx; const o=c.createOscillator(), g=c.createGain(), bf=c.createBiquadFilter(); o.type=type; o.frequency.value=f; bf.type='lowpass'; bf.frequency.value=cut;
    g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+(pad?dur*0.3:atk)); g.gain.setTargetAtTime(0.0001,t+(pad?dur*0.6:dur*0.4),pad?dur*0.25:dur*0.3);
    o.connect(bf); bf.connect(g); g.connect(dest); if(dest===this.dly) g.connect(this.musG); o.start(t); o.stop(t+dur*1.6+0.1);
  }
  kick(t,v){ const c=this.ctx,o=c.createOscillator(),g=c.createGain(); o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(40,t+0.15); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.3); o.connect(g); g.connect(this.musG); o.start(t); o.stop(t+0.35); }
  snare(t,v){ const c=this.ctx,s=c.createBufferSource(); s.buffer=this.noise; const f=c.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1800; const g=c.createGain(); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.2); s.connect(f); f.connect(g); g.connect(this.musG); g.connect(this.dly); s.start(t,Math.random()); s.stop(t+0.25); }
  hat(t,v){ const c=this.ctx,s=c.createBufferSource(); s.buffer=this.noise; const f=c.createBiquadFilter(); f.type='highpass'; f.frequency.value=7000; const g=c.createGain(); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.05); s.connect(f); f.connect(g); g.connect(this.musG); s.start(t,Math.random()); s.stop(t+0.07); }
}

// ===== HAZARD: roadside shooters (Alondra Boulevard) =====
function makeFlashTex(){ return canvasTex(64,64,(g)=>{ const gr=g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(255,255,230,1)'); gr.addColorStop(0.25,'rgba(255,220,120,0.95)'); gr.addColorStop(0.6,'rgba(255,140,40,0.35)'); gr.addColorStop(1,'rgba(255,100,0,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64); }); }
const HAZ_IMMUNE_AFTER=1.8;   // seconds of Hot Block immunity after a hit spin ends
class Shooters{
  // Hot Block hazard. Targeting rules (unchanged from the original): every car (player or AI) is a target;
  // each shooter picks the nearest non-ghost car 6-48 m away inside its field of fire; a hit spins the car (shield blocks it).
  // Hit chance per shot: player 22%, AI 30%. Per-shooter cooldown 3-4.5 s, per-zone cooldown 1.4 s.
  // Added for fairness: a 0.45 s aim telegraph before each shot, and post-hit immunity so a car cannot be chain-spun.
  constructor(R){
    this.R=R; const P=R.P, W=R.W, def=R.def; this.list=[]; this.shots=[]; this.zones=[]; this.t=0; this.warnLap={}; this.zoneCd={};
    this.stats={shots:0,aimed:0,hits:0,hitsPlayer:0,hitsAI:0,blocked:0,skippedImmune:0,wasted:0};
    const G=this.group=new THREE.Group(); R.scene.add(G);
    const env=!!(W.env&&W.env.alondra);
    const skin=[0x8d5524,0xc68642,0x5a3a22,0xe0ac69], hood=[0xd62828,0x1f6fe0,0x2eae4a,0xf2b705,0x9b30d9,0xe8e8e8];
    const flashTex=makeFlashTex(); this.glowTex=flashTex;
    // arcade tracers: hot-magenta core + white-hot tip, additive so they read against any backdrop
    this.tracerMat=new THREE.MeshBasicMaterial({color:0xff3fb4,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
    this.tracerGeo=new THREE.CylinderGeometry(0.16,0.16,7.5,6,1,true); this.tracerGeo.rotateX(Math.PI/2);
    this.tipMat=new THREE.SpriteMaterial({map:flashTex,color:0xffe6f6,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false});
    this.laserMat=new THREE.MeshBasicMaterial({color:0xff2a2a,transparent:true,opacity:0.55,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
    this.laserGeo=new THREE.CylinderGeometry(0.035,0.035,1,5,1,true); this.laserGeo.translate(0,0.5,0); this.laserGeo.rotateX(Math.PI/2);
    const brick=canvasTex(128,64,(g,w,h)=>{ g.fillStyle='#6d3a2c'; g.fillRect(0,0,w,h); g.fillStyle='#8c4a36'; for(let r=0;r<8;r++) for(let c=0;c<5;c++){ g.fillRect((c*28+(r%2)*14)%w-4,r*8+1,24,6);} },{repeat:true});
    const brickM=new THREE.MeshStandardMaterial({map:brick,roughness:0.9}), stoopM=new THREE.MeshStandardMaterial({color:0x8a8580,roughness:0.9});
    (def.shooters||[]).forEach((z,zk)=>{
      const i0=P.idxAt(z.cp,z.f); this.zones.push({i0,i1:(i0+22)%P.N});
      const perches=z.perches||[[0,-1,1.9,0],[18,1,1.9,0]];
      perches.forEach(([off,sd,E,ph,kmin,kmax],sk)=>{
        const i=(i0+off)%P.N; const e=(sd<0?P.wl[i]:P.wr[i])+E;
        const x=P.x[i]+P.rx[i]*e*sd, z2=P.z[i]+P.rz[i]*e*sd; const gy=env?P.y[i]+ph+0.1:Math.max(W.heightAt(x,z2),P.y[i]);
        const face=Math.atan2(-P.rx[i]*sd,-P.rz[i]*sd); // facing the road
        const base=new THREE.Group(); base.position.set(x,gy,z2); base.rotation.y=face; G.add(base);
        if(!env){
          const stoop=new THREE.Mesh(new THREE.BoxGeometry(3.2,0.7,2.4),stoopM); stoop.position.y=0.35; stoop.castShadow=stoop.receiveShadow=true; base.add(stoop);
          const cover=new THREE.Mesh(new THREE.BoxGeometry(3.4,1.0,0.45),brickM); cover.position.set(0,1.2,1.1); cover.castShadow=true; base.add(cover);
        }
        const fig=new THREE.Group(); fig.position.y=env?0:0.7; fig.scale.setScalar(1.35); base.add(fig);
        const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:0.8});
        const hc=hood[(zk*2+sk)%hood.length];
        const legL=new THREE.Mesh(new THREE.BoxGeometry(0.26,0.9,0.3),mat(0x22324a)); legL.position.set(-0.17,0.45,0); fig.add(legL);
        const legR=legL.clone(); legR.position.x=0.17; fig.add(legR);
        const torso=new THREE.Mesh(new THREE.BoxGeometry(0.72,0.8,0.42),mat(hc)); torso.position.y=1.3; fig.add(torso);
        const head=new THREE.Mesh(new THREE.SphereGeometry(0.22,12,10),mat(skin[(zk+sk)%4])); head.position.y=1.93; fig.add(head);
        const cap=new THREE.Mesh(new THREE.SphereGeometry(0.235,12,8,0,TAU,0,Math.PI/2),mat(sk?0x111111:hc)); cap.position.y=1.96; fig.add(cap);
        const brim=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.04,0.2),mat(0x111111)); brim.position.set(0,1.99,0.25); fig.add(brim);
        const armL=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.62,0.2),mat(hc)); armL.position.set(-0.46,1.35,0.05); armL.rotation.x=-0.5; fig.add(armL);
        const shoulder=new THREE.Group(); shoulder.position.set(0.44,1.6,0); fig.add(shoulder);
        const arm=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.18,0.7),mat(hc)); arm.position.z=0.35; shoulder.add(arm);
        const gun=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.2,0.42),mat(0x0c0c0c)); gun.position.set(0,0.05,0.82); shoulder.add(gun);
        const flash=new THREE.Sprite(new THREE.SpriteMaterial({map:flashTex,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false})); flash.scale.set(2.6,2.6,1); flash.position.set(0,0.06,1.2); flash.visible=false; shoulder.add(flash);
        fig.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
        const MB=(typeof propTemplate==='function')?propTemplate('mrblack'):null, AKT=(typeof propTemplate==='function')?propTemplate('ak'):null;
        if(MB&&AKT){ fig.children.slice().forEach(ch=>{ if(ch!==shoulder) fig.remove(ch); }); fig.scale.setScalar(1.25);
          MB.parts.forEach(p=>{ const m=new THREE.Mesh(p.g,p.mt); m.castShadow=true; fig.add(m); });
          shoulder.children.slice().forEach(ch=>{ if(ch!==flash) shoulder.remove(ch); }); shoulder.position.set(0.2,1.36,0.12);
          const akg=new THREE.Group(); AKT.parts.forEach(p=>{ const m=new THREE.Mesh(p.g,p.mt); m.castShadow=true; akg.add(m); }); akg.rotation.y=Math.PI/2; akg.position.set(0,-0.12,0.3); shoulder.add(akg);
          flash.position.set(0,0.0,0.8); flash.scale.set(1.8,1.8,1); }
        const laser=new THREE.Mesh(this.laserGeo,this.laserMat.clone()); laser.visible=false; G.add(laser);
        this.list.push({base,fig,shoulder,flash,laser,face,x,y:gy,z:z2,cd:1+Math.random()*2,flashT:0,yaw:0,pitch:0,zone:zk,idx:i,aimT:0,aimCar:null,kmin:kmin==null?-999:kmin,kmax:kmax==null?999:kmax});
      });
      if(!env){ // warning sign before the zone (the Blender environment brings its own lit gantry signs + road stencils)
        const wi=(i0-45+P.N)%P.N, sd=-1; const e=P.wl[wi]+1.4; const sx=P.x[wi]+P.rx[wi]*e*sd, sz=P.z[wi]+P.rz[wi]*e*sd;
        const sg=new THREE.Group(); sg.position.set(sx,W.heightAt(sx,sz),sz); sg.rotation.y=Math.atan2(-P.tx[wi],-P.tz[wi]); G.add(sg);
        const post=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,3.2,6),new THREE.MeshStandardMaterial({color:0x777777,metalness:0.6})); post.position.y=1.6; sg.add(post);
        const tex=canvasTex(256,256,(g)=>{ g.translate(128,128); g.rotate(Math.PI/4); g.fillStyle='#ffc400'; g.fillRect(-84,-84,168,168); g.lineWidth=10; g.strokeStyle='#111'; g.strokeRect(-76,-76,152,152); g.rotate(-Math.PI/4);
          g.fillStyle='#111'; g.textAlign='center'; g.font='bold 34px "Racing Sans One",Impact'; g.fillText('HOT',0,-8); g.fillText('BLOCK',0,30); g.font='bold 60px Impact'; g.fillText('!',0,-44); });
        const pl=new THREE.Mesh(new THREE.PlaneGeometry(2.4,2.4),new THREE.MeshStandardMaterial({map:tex,transparent:true,side:THREE.DoubleSide,roughness:0.6})); pl.position.y=3.3; sg.add(pl);
      }
    });
  }
  targetable(c,s){ if(!(c.ghost<=0 && !(c.hazImm>0) && !c.finishedHidden)) return false; if(s){ const N=this.R.P.N; const k=((c.pr.i-s.idx+N+(N>>1))%N)-(N>>1); if(k<s.kmin||k>s.kmax) return false; } return true; }
  update(dt){
    const R=this.R, P=R.P, N=P.N; this.t+=dt; for(const k in this.zoneCd) this.zoneCd[k]-=dt;
    for(const c of R.cars){ if(c.hazImm>0) c.hazImm-=dt; }
    const live=R.state==='race'||R.state==='finish'||R.state==='done';
    for(const s of this.list){
      // pick nearest targetable car in range, inside the field of fire
      let best=null,bd=1e9;
      for(const c of R.cars){ const dx=c.x-s.x, dz=c.z-s.z, d=Math.hypot(dx,dz); if(d<6||d>48) continue; if(Math.abs(angDiff(s.face,Math.atan2(dx,dz)))>=1.35) continue;
        if(!this.targetable(c,s)) continue; if(d<bd){bd=d;best=c;} }
      if(s.aimT>0 && s.aimCar && this.targetable(s.aimCar,s)){ const c=s.aimCar; const d=Math.hypot(c.x-s.x,c.z-s.z); if(d>=6&&d<=52) best=c; }
      let ty=s.face, tp=0;
      if(best){ const dx=best.x-s.x, dz=best.z-s.z; ty=Math.atan2(dx,dz); tp=Math.atan2((best.y+0.7)-(s.y+2.3),Math.hypot(dx,dz)); }
      s.yaw+=angDiff(s.yaw,angDiff(s.face,ty))*Math.min(1,dt*6); s.yaw=clamp(s.yaw,-1.4,1.4);
      s.pitch+=(tp-s.pitch)*Math.min(1,dt*6);
      s.fig.rotation.y=s.yaw; s.shoulder.rotation.x=-s.pitch; s.shoulder.rotation.z=0;
      if(s.flashT>0){ s.flashT-=dt; s.flash.visible=s.flashT>0; s.flash.material.rotation=Math.random()*TAU; }
      s.cd-=dt;
      const zc=this.zoneCd;
      // aim telegraph: a red sight line tracks the target for 0.45 s before the shot
      if(s.aimT>0){
        s.aimT-=dt;
        if(!best || best!==s.aimCar || !this.targetable(s.aimCar,s)){ s.aimT=0; s.laser.visible=false; this.stats.wasted++; }
        else {
          s.base.updateMatrixWorld(true); const m=new THREE.Vector3(0,0.06,1.0).applyMatrix4(s.shoulder.matrixWorld); const c=s.aimCar;
          const tx=c.x-m.x, ty2=c.y+0.8-m.y, tz=c.z-m.z, L=Math.hypot(tx,ty2,tz);
          s.laser.position.copy(m); s.laser.lookAt(c.x,c.y+0.8,c.z); s.laser.scale.set(1,1,L); s.laser.visible=true;
          s.laser.material.opacity=0.35+0.3*Math.sin(this.t*30);
          if(s.aimT<=0){ s.laser.visible=false; if(live){ this.fire(s,c); s.cd=3+Math.random()*1.5; zc[s.zone]=1.4; } }
        }
      } else if(live && best && s.cd<=0 && (zc[s.zone]||0)<=0){
        s.aimT=0.45; s.aimCar=best; zc[s.zone]=1.4; this.stats.aimed++;
      }
    }
    // projectiles
    for(let k=this.shots.length-1;k>=0;k--){
      const b=this.shots[k]; b.life-=dt;
      const x0=b.x,y0=b.y,z0=b.z; b.x+=b.vx*dt; b.y+=b.vy*dt; b.z+=b.vz*dt; b.mesh.position.set(b.x,b.y,b.z); b.tip.position.set(b.x,b.y,b.z);
      let done=b.life<=0;
      if(!done && b.intent){ const c=b.target; if(this.targetable(c)){ const d=segDist(c.x,c.y+0.7,c.z,x0,y0,z0,b.x,b.y,b.z); if(d<1.25){ this.hit(c,b); done=true; } } }
      if(!done && b.y<R.W.heightAt(b.x,b.z)+0.05){ for(let q=0;q<6;q++) R.fx.sparks.emit(b.x,b.y+0.1,b.z,rr(-3,3),rr(1,4),rr(-3,3),0.25,0.2,0.03,1,0.5,0.8,1,2,10); R.fx.dust.emit(b.x,b.y+0.2,b.z,0,1,0,0.6,0.3,1.2,0.7,0.7,0.7,0.4,1,0); done=true; }
      if(done){ this.group.remove(b.mesh); this.group.remove(b.tip); this.shots.splice(k,1); }
    }
    // HUD warning for the player on approach
    const pl=R.player; if(live && !pl.finished){ this.zones.forEach((z,k)=>{ const d=((z.i0-pl.pr.i+N)%N)*P.spacing; const key=k+'_'+pl.lap; if(d>20&&d<110&&!this.warnLap[key]){ this.warnLap[key]=1; R.game.ui.flash('⚠ HOT BLOCK AHEAD','#ffc400',1.6); R.sfx('warn'); } }); }
  }
  fire(s,c){
    const R=this.R; s.flashT=0.07; s.flash.visible=true; this.stats.shots++;
    s.base.updateMatrixWorld(true); const m=new THREE.Vector3(0,0.06,1.1).applyMatrix4(s.shoulder.matrixWorld);
    // aim with lead + deliberate spread
    const spd=95; let tx=c.x,ty=c.y+0.7,tz=c.z; for(let it=0;it<2;it++){ const t=Math.hypot(tx-m.x,tz-m.z)/spd; tx=c.x+c.vx*t; tz=c.z+c.vz*t; }
    const hitChance=c.isPlayer?0.22:0.3; const miss=Math.random()>hitChance;
    if(miss){ if(Math.random()<0.5){ ty+=rr(1.9,2.6); } else { const t=rr(3,6); const fx=tx-m.x,fz=tz-m.z,fl=Math.hypot(fx,fz); tx-=fx/fl*t; tz-=fz/fl*t; ty=R.W.heightAt(tx,tz)-0.3; } }
    const dx=tx-m.x,dy=ty-m.y,dz=tz-m.z,d=Math.hypot(dx,dy,dz);
    const b={intent:!miss,target:c,x:m.x,y:m.y,z:m.z,vx:dx/d*spd,vy:dy/d*spd,vz:dz/d*spd,life:1.1,owner:s};
    b.mesh=new THREE.Mesh(this.tracerGeo,this.tracerMat); b.mesh.position.set(b.x,b.y,b.z); b.mesh.lookAt(b.x+b.vx,b.y+b.vy,b.z+b.vz); this.group.add(b.mesh);
    b.tip=new THREE.Sprite(this.tipMat); b.tip.scale.set(1.1,1.1,1); b.tip.position.copy(b.mesh.position); this.group.add(b.tip); this.shots.push(b);
    const cp=R.game.camera.position; const dist=Math.hypot(s.x-cp.x,s.z-cp.z); if(dist<120) R.game.audio.play('shot',clamp(1-dist/120,0.15,1));
  }
  hit(c,b){
    const R=this.R;
    for(let q=0;q<14;q++) R.fx.sparks.emit(c.x,c.y+0.8,c.z,rr(-5,5),rr(1,5),rr(-5,5),0.35,0.3,0.05,1,q%2?0.35:0.85,q%2?0.75:0.4,1,2,10);
    const spun=c.spinOut(1.0);
    if(spun){ c.hazImm=1.0+HAZ_IMMUNE_AFTER; this.stats.hits++; if(c.isPlayer) this.stats.hitsPlayer++; else this.stats.hitsAI++; } else this.stats.blocked++;
    if(c.isPlayer){ if(spun){ R.sfx('hit'); R.shake(0.35); R.game.ui.flash('YOU GOT HIT!','#ff3b3b',1.4); } else R.game.ui.flash('SHIELD BLOCKED IT','#7ff6ff',1.2); }
    else if(spun) R.sfx3d('hit',c);
  }
}
function segDist(px,py,pz,ax,ay,az,bx,by,bz){ const vx=bx-ax,vy=by-ay,vz=bz-az; const wx=px-ax,wy=py-ay,wz=pz-az; const L=vx*vx+vy*vy+vz*vz; const t=L>0?clamp((wx*vx+wy*vy+wz*vz)/L,0,1):0; const dx=wx-vx*t,dy=wy-vy*t,dz=wz-vz*t; return Math.sqrt(dx*dx+dy*dy+dz*dz); }

// ===== RACE MANAGER =====
const NCP=12, DT=1/120, MUD_TIRE_TIME=5;
const DIFFS={easy:{base:0.9,rb:0.05,label:'Easy'},normal:{base:1.0,rb:0.1,label:'Normal'},hard:{base:1.07,rb:0.18,label:'Hard'}};
const ITEMS={nitro:{name:'Nitro Cell',icon:'⚡',col:'#22e4ff'},aegis:{name:'Aegis Bubble',icon:'◈',col:'#7ff6ff'},slick:{name:'Glaze Slick',icon:'◍',col:'#ff4fb0'}};
class Race{
  constructor(game,opt){
    this.game=game; this.opt=opt; this.def=TRACK_DATA[opt.track]; if(this.def&&this.def.account&&!(game.online&&game.online.hasAccess())) throw new Error('This track is for signed-in racers. Create an account or log in to unlock it.'); this.practice=!!opt.practice; this.laps=this.practice?999:(opt.laps||this.def.laps); this.shortRace=!this.practice&&this.laps!==this.def.laps;   /* Grand Prix runs the 20-lap tracks over 10: no race-time record or leaderboard post for those */
    GFX.v2.begin(this.def,game);   // Graphics V2 look for this track (Pacifica), or nothing: graphics only
    const Q=game.Q; this.time=0; this.raceTime=0; this.state='intro'; this.stateT=0; this.acc=0; this.paused=false;
    this.P=buildTrackPath(this.def); this.A=analyzeTrack(this.P);
    this.W=buildWorld(this.def,this.P,Q);
    this.scene=new THREE.Scene(); this.scene.add(this.W.group); this.scene.fog=this.W.fog;
    this.env=makeEnvFromTheme(game.renderer,this.W.th); GFX.environment.applyWorldIBL(this.scene,this.env,game.Q);   // world IBL is off in Phase 1
    setEnvOnCarMats(this.env);
    this.dustCol=this.def.sky==='revolution'?[0.72,0.64,0.52]:({country:[0.62,0.34,0.2],city:[0.75,0.7,0.6],desert:[0.85,0.62,0.42],coast:[0.72,0.64,0.5],night:[0.4,0.38,0.5],space:[0.55,0.35,0.85],oval:[0.6,0.6,0.58],rally:[0.62,0.47,0.32]})[this.def.theme];
    // fx
    this.fx={sparks:new Particles(Q.density>0.7?1600:900,true),dust:new Particles(Q.density>0.7?900:500,false),skids:new Skids(Q.density>0.7?1400:700)};
    this.fx.dustBurst=(car)=>{ if(!this.nearCam(car)) return; for(let k=0;k<14;k++) this.fx.dust.emit(car.x+rr(-1.5,1.5),car.y+0.2,car.z+rr(-1.5,1.5),rr(-4,4)+car.vx*0.2,rr(0.5,2.5),rr(-4,4)+car.vz*0.2,rr(0.6,1.2),0.8,3,this.dustCol[0],this.dustCol[1],this.dustCol[2],0.45,2,-0.2); };
    this.W.fx=this.fx;     this.scene.add(this.fx.skids.mesh,this.fx.dust.points,this.fx.sparks.points);
    if(this.W.rain && Q.density>0.4){ this.rain=new Rain(Math.round(900*Q.density)); this.scene.add(this.rain.mesh); }
    // cars
    const pv=VEHICLES[opt.vehicle]; const others=VEHICLES.filter(v=>v!==pv);
    const shuffled=others.slice().sort((a,b)=>(a.id.charCodeAt(1)*7+opt.track*13)%11-(b.id.charCodeAt(1)*7+opt.track*13)%11);
    const field=opt.field?opt.field.map(id=>VEHICLES.find(v=>v.id===id)).filter(Boolean):shuffled.slice(0,7);
    const total=field.length+1;
    const d=DIFFS[opt.diff]; const spread=[0.02,0.012,0.006,0,-0.006,-0.012,-0.02];
    this.cars=[]; const playerSlot=Math.min(total-1,opt.diff==='easy'?3:opt.diff==='hard'?7:5); let ai=0;
    // grid order: slot -> {v,isP}. A track can reserve pole for one car (Y'all Fuck With Racin?: the Colonial Hellcat always starts P1, whoever drives it)
    let order=[]; { let a=0; for(let s=0;s<total;s++) order.push(s===playerSlot?{v:pv,isP:true}:{v:field[a++],isP:false}); }
    // Grand Prix, race 2 onward: the grid is the previous race's finishing order (winner on pole). opt.order = vehicle ids, '__player__' for you.
    let fromResults=false;
    if(opt.order&&opt.order.length===total){ const o2=opt.order.map(id=>id==='__player__'?{v:pv,isP:true}:{v:field.find(v=>v.id===id),isP:false}); if(o2.every(o=>o.v)&&o2.filter(o=>o.isP).length===1){ order=o2; fromResults=true; } }
    const poleId=!fromResults&&this.P.route&&this.P.route.pole;
    if(poleId && VEHICLES.some(v=>v.id===poleId)){ let k=order.findIndex(o=>o.v.id===poleId);
      if(k<0){ const pv2=VEHICLES.find(v=>v.id===poleId); k=order.map(o=>!o.isP).lastIndexOf(true); order[k]={v:pv2,isP:false}; }
      const [o]=order.splice(k,1); order.unshift(o); }
    const aiField=order.filter(o=>!o.isP).map(o=>o.v); const pSlot=order.findIndex(o=>o.isP);
    for(let s=0;s<total;s++){
      const isP=s===pSlot; const v=isP?pv:aiField[ai]; const car=new Car(this,v,s,isP);
      car.driver=isP?'YOU':v.driver;
      car.place(this.W.grid[s].i,this.W.grid[s].lat); car.cp=0; car.cpCount=0; car.lap=0;
      if(!isP){ car.skill=d.base+spread[ai]; car.ai=new AIDriver(car,this,car.skill,(ai*37%10)/10); ai++; }
      else { this.player=car; this.auto=new AIDriver(car,this,1,0.5); }
      this.scene.add(car.model.root); this.cars.push(car);
    }
    GFX.v2.finish(this);   // Graphics V2: lighting, sky, materials, road detail, decals, dressing (no gameplay data touched)
    this.cpIdx=[]; for(let k=0;k<NCP;k++) this.cpIdx.push(Math.round(k*this.P.N/NCP)%this.P.N);
    // route tracks: ordered checkpoints entry portal -> 10 circuit gates -> Yorktown line. The entry gate counts only on lap 1.
    this.route=this.P.route||null;
    if(this.route){ const R0=this.route, N=this.P.N; this.cps=[R0.entry]; for(let k=1;k<=10;k++) this.cps.push((R0.circ+Math.round(R0.span*k/11))%N); this.cps.push(R0.york); this.ncp=this.cps.length;
      this.cars.forEach(c=>{ c.cp=0; c.lap=0; }); this.portalLog=[]; }
    this.slicks=[]; this.finishOrder=[]; this.best=Store.get('best_'+trackKey(this.def),{race:null,lap:null});
    if(this.def.shooters) this.shooters=new Shooters(this);
    this.cam=new ChaseCam(this); this.trauma=0; this.msgT=0; this.hudT=0; this.finalShown=false; this.resetCD=0;
    this.slickGeo=new THREE.CircleGeometry(1.7,24); this.slickMat=new THREE.MeshStandardMaterial({map:canvasTex(128,128,(g)=>{ const gr=g.createRadialGradient(64,64,10,64,64,64); gr.addColorStop(0,'#ffd1ea'); gr.addColorStop(0.75,'#ff4fb0'); gr.addColorStop(1,'rgba(255,79,176,0)'); g.fillStyle=gr; g.beginPath(); for(let a=0;a<24;a++){ const r=48+Math.sin(a*2.3)*10; g.lineTo(64+Math.cos(a/24*TAU)*r,64+Math.sin(a/24*TAU)*r);} g.fill(); const cs=['#22e4ff','#ffe14f','#fff','#7dff6a']; for(let k=0;k<40;k++){ g.fillStyle=cs[k%4]; g.save(); g.translate(30+Math.random()*68,30+Math.random()*68); g.rotate(Math.random()*6); g.fillRect(-5,-1.5,10,3); g.restore(); } }),transparent:true,roughness:0.15,metalness:0.1,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
    game.audio.startLoops(); game.audio.setMusic('race');
    this.buildMiniPath(); game.ui.raceStart(this);
  }
  // ---------- helpers used by Car ----------
  nearCam(car){ const c=this.game.camera.position; const dx=car.x-c.x,dz=car.z-c.z; return dx*dx+dz*dz<110*110; }
  sfx(n,a){ this.game.audio.play(n,a); }
  sfx3d(n,car){ const c=this.game.camera.position; const d=Math.hypot(car.x-c.x,car.z-c.z); if(car.isPlayer||d<40) this.game.audio.play(n); }
  shake(a){ if(this.game.S.shake) this.trauma=Math.min(1,this.trauma+a); }
  impact(car,v,x,y,z){
    for(let k=0;k<Math.min(24,v);k++) this.fx.sparks.emit(x,y,z,rr(-5,5)+car.vx*0.3,rr(1,5),rr(-5,5)+car.vz*0.3,rr(0.15,0.4),0.3,0.05,1,0.8,0.4,1,2,12);
    if(car.isPlayer){ this.sfx('impact',v); this.shake(Math.min(0.55,v*0.025)); } else this.sfx3d('bump',car);
  }
  // ---------- main update ----------
  update(dt,input){
    dt=Math.min(dt,0.1); const P=this.P, pl=this.player;
    if(this.paused){ this.game.audio.updateCar(pl,null,true); this.render(); return; }
    this.stateT+=dt;
    // the intro waits (max ~6 s more) for the Graphics V2 warm-up (shader compile, texture upload), so that hitch
    // happens under the intro card and never in the middle of 3-2-1-GO
    if(this.state==='intro'){ const warm=window.GFX&&GFX.v2&&GFX.v2.pending&&GFX.v2.race===this&&this.stateT<10; if((this.stateT>4.2||input.skip)&&!warm){ this.state='countdown'; this.stateT=0; this.lastCount=-1; this.game.ui.introCard(false); } }
    if(this.state==='countdown'){
      const n=Math.floor(this.stateT); if(n!==this.lastCount && n<=3){ this.lastCount=n; if(n<3){ this.sfx('count'); this.game.ui.count(String(3-n)); this.W.lamps.forEach((m,k)=>m.color.setHex(k<=(n*2)?0xff1a1a:0x220808)); } else { this.sfx('go'); this.game.ui.count('GO!'); this.W.lamps.forEach(m=>m.color.setHex(0x18ff5a)); this.state='race'; this.stateT=0; if(this.route) this.cars.forEach(c=>{ c.lap=1; c.lapStart=0; }); } }
      // launch boost: holding throttle right at GO
    }
    // inputs
    if(this.state==='race'||this.state==='finish'||this.state==='done'){
      if(pl.finished){ this.auto.update(dt); }
      else { const I=pl.inp; let st=input.steer; const as=this.game.assistLevel(); const keepItem=I.item;
        if(as>0 && !this.game.autopilot && pl.grounded && pl.speed>6 && !pl.drifting){ const A=this.auto; A.stuck=0; A.stuckTotal=0; A.revT=0; A.update(dt); const ai=clamp(I.steer,-1,1);
          st=clamp(st+as*(ai-st)*(1-Math.min(1,Math.abs(st))*0.7),-1,1); }
        I.thr=input.thr; I.brk=input.brk; I.steer=st; I.drift=input.drift; I.item=keepItem; if(input.item&&!this.itemLatch) I.item=true; this.itemLatch=input.item;
        if(this.game.autopilot){ this.auto.update(dt); }
        this.resetCD-=dt; if(input.reset && this.resetCD<=0){ this.resetCD=1.5; pl.respawn(); } }
      for(const c of this.cars) if(c.ai) c.ai.update(dt);
    } else { for(const c of this.cars){ c.inp.thr=0; c.inp.brk=1; c.inp.steer=0; } if(this.state==='countdown'&&this.stateT>2.55&&input.thr>0) this.launch=true; }
    if(this.state==='race' && this.stateT<0.05 && this.launch){ pl.giveBoost(0.8); this.sfx('boost'); this.launch=false; this.game.ui.flash('ROCKET START!','#22e4ff'); }
    // fixed-step simulation
    this.acc+=dt; let steps=0;
    while(this.acc>=DT && steps<14){ this.simStep(); this.acc-=DT; steps++; }
    if(steps>=14) this.acc=0;
    if(this.state==='race'||this.state==='finish'||this.state==='done') this.raceTime+=dt;
    if(this.state==='finish'){ const allDone=this.cars.every(c=>c.finished); if(this.stateT>9||allDone){ this.state='done'; this.stateT=0; this.game.showResults(this.results()); } }
    // visuals
    for(const c of this.cars) c.visual(dt,this.time);
    this.W.update(dt,this.time); this.fx.sparks.update(dt); this.fx.dust.update(dt); this.fx.skids.update();
    this.slicks.forEach(s=>{ s.mesh.rotation.z+=dt*0.2; });
    if(this.shooters) this.shooters.update(dt);
    this.cam.update(dt);
    if(this.rain) this.rain.update(dt,this.game.camera.position,pl.vx,pl.vz);
    // sun follows player for shadows
    GFX.lighting.follow(this.W,pl.x,pl.y,pl.z);
    // audio
    let near=null; const cp=this.game.camera.position; for(const c of this.cars){ if(c===pl) continue; const d=Math.hypot(c.x-cp.x,c.z-cp.z); if(!near||d<near.d) near={d,v:Math.abs(c.vF)}; }
    this.game.audio.updateCar(pl,near,false);
    this.hudT-=dt; if(this.hudT<=0){ this.hudT=1/15; this.game.ui.hud(this); }
    this.game.ui.minimap(this);
    this.render();
  }
  render(){ GFX.renderer.render(this.scene,this.game.camera,this.W.th.exposure,'race'); }
  simStep(){
    this.time+=DT; const P=this.P, N=P.N; const racing=this.state!=='intro'&&this.state!=='countdown';
    for(const c of this.cars){
      if(!racing){ c.score=this.route?-((this.route.entry-c.pr.i+N)%N):((c.pr.i-this.cpIdx[NCP-1]+N)%N); c.inp.thr=0; c.inp.brk=0; c.step(DT); c.vx=c.vz=0; const g=this.W.grid[c.idx]; if(g){ const P=this.P; c.x=P.x[g.i]+P.rx[g.i]*g.lat; c.z=P.z[g.i]+P.rz[g.i]*g.lat; c.h=Math.atan2(P.tx[g.i],P.tz[g.i]); } continue; }
      const LP=P.loop; if(LP && !c.loop && c.grounded && ((c.pr.i-LP.i0+N)%N)<LP.span) this.loopEnter(c);
      if(c.loop) this.loopStep(c,DT); else c.step(DT);
      if(!racing) continue;
      // take-off fire: a car on the lip of a jump (or entering the loop) sets off that feature's pyro
      if(this.W.pyro){ const js=P.def.jumps||[]; for(let q=0;q<js.length;q++){ const d=(c.pr.i-js[q].top+N)%N; if(d<3&&!c.loop) this.W.pyro(q,c); } }
      // checkpoints
      if(this.route) this.routeStep(c);
      else {
      const ci=this.cpIdx[c.cp]; const di=(c.pr.i-ci+N)%N;
      if(di<30 && c.pr.i!==undefined){
        c.cp=(c.cp+1)%NCP; c.cpCount++;
        if(c.cp===1){ c.lap++; this.onLap(c); }
      }
      c.score=c.finished?1e9-c.finishPos*1e6:c.cpCount*(N/NCP)+((c.pr.i-this.cpIdx[(c.cp+NCP-1)%NCP]+N)%N); }
      // pads
      for(const p of this.W.pads){ const d=((c.pr.i+c.pr.t-p.i)+N+N/2)%N-N/2; if(Math.abs(d*P.spacing)<p.half && Math.abs(c.pr.lat-p.lat)<p.hw && c.grounded){ if(c.boost<0.3){ if(c.isPlayer) this.sfx('pad'); else this.sfx3d('pad',c); } c.giveBoost(1.1); } }
      // item boxes
      for(const b of this.W.items){ if(!b.active) continue; const dx=c.x-b.x,dz=c.z-b.z; if(dx*dx+dz*dz<5.3 && Math.abs(c.y+0.6-b.y)<2.5){ b.active=false; b.t=4; b.grp.visible=false;
        for(let k=0;k<16;k++) this.fx.sparks.emit(b.x,b.y,b.z,rr(-6,6),rr(-2,6),rr(-6,6),0.5,0.4,0.05,1,0.4,0.9,1,3,6);
        if(!c.item){ c.item=this.rollItem(c); c.itemDelay=c.isPlayer?1.0:0.6; if(c.isPlayer){ this.sfx('pickup'); this.game.ui.roulette(); } } } }
      for(const b of this.W.mudBoxes){ if(!b.active) continue; const dx=c.x-b.x,dz=c.z-b.z; if(dx*dx+dz*dz<5.8 && Math.abs(c.y+0.6-b.y)<2.5){ b.active=false; b.t=1.2; b.grp.visible=false; c.mudT=MUD_TIRE_TIME;
          for(let k=0;k<14;k++) this.fx.dust.emit(b.x,b.y,b.z,rr(-5,5),rr(0,5),rr(-5,5),0.6,0.5,1.2,0.78,0.47,0.17,0.9,2,4);
          if(c.isPlayer){ this.sfx('pickup'); this.game.ui.flash(c.ph.allTerrain?'MUD TIRES (YOU ALREADY HAVE 4x4)':'MUD TIRES!','#ffc23d',1.4); } } }
      if(c.isPlayer && c.mudSlow && c.mudWarn!==c.lap){ c.mudWarn=c.lap; this.game.ui.flash('STUCK IN THE MUD!','#c8782a',1.2); }
      if(c.itemDelay>0){ c.itemDelay-=DT; if(c.isPlayer && c.itemDelay<=0) this.sfx('item'); }
      if(c.inp.item){ c.inp.item=false; if(c.item && c.itemDelay<=0 && !c.finished) this.useItem(c); }
      // slicks
      for(let k=this.slicks.length-1;k>=0;k--){ const s=this.slicks[k]; if(s.owner===c&&s.age<0.8) continue; const dx=c.x-s.x,dz=c.z-s.z; if(dx*dx+dz*dz<3.6 && c.grounded && c.ghost<=0){ const hit=c.spinOut(1.0); if(hit){ if(c.isPlayer){ this.sfx('splat'); this.shake(0.3); this.game.ui.flash('GLAZED!','#ff4fb0'); } else this.sfx3d('splat',c); } this.removeSlick(k); } }
    }
    for(const s of this.slicks) s.age+=DT;
    for(let k=this.slicks.length-1;k>=0;k--) if(this.slicks[k].age>30) this.removeSlick(k);
    this.collide();
    // ranking + rubber band
    { const sorted0=this.cars.slice().sort((a,b)=>b.score-a.score); sorted0.forEach((c,k)=>c.rank=k+1); }
    if(racing){
      const sorted=this.cars.slice().sort((a,b)=>b.score-a.score); sorted.forEach((c,k)=>c.rank=k+1);
      const pl=this.player;
      const rb=DIFFS[this.opt.diff].rb;
      for(const c of this.cars){ if(!c.ai) continue; const dd=(pl.score-c.score)*P.spacing; let r=1;
        if(dd>15) r=1+rb*Math.min(1,(dd-15)/110); else if(dd<-120) r=1-Math.min(0.04,(-dd-120)/2500);
        if(pl.finished) r=1; c.rubber+=(r-c.rubber)*0.004; }
    }
    // wrong way
    const pl=this.player; if(racing && !pl.finished && pl.wrongT>1.2){ this.game.ui.wrong(true); } else this.game.ui.wrong(false);
  }
  // ---------- route tracks: ordered checkpoints, Yorktown lap line, return portal ----------
  routeStep(c){
    const P=this.P, N=P.N, R0=this.route;
    if(!c.finished && P.hidden[c.pr.i]){ c.lastSafe=R0.teleportEntry?(c.cp===0?R0.start:R0.dest):3; c.respawn(); }            // e.g. reversing off the back of the grid
    // separate drag strip: the entry portal teleports into Concord and counts as the first gate
    if(R0.teleportEntry && c.cp===0 && !c.finished && (c.pr.i-R0.entry+N)%N<40){ c.cpCount++; c.cp=1; this.portalJump(c,R0.entry); }
    const ci=this.cps[c.cp]; const di=(c.pr.i-ci+N)%N;
    if(di<30){ c.cpCount++;
      if(c.cp===this.ncp-1){ c.cp=1; c.lap++; this.onLap(c); }                     // Yorktown: next lap goes straight to gate 1 (no swamp)
      else c.cp++; }
    if(!c.finished){ const dr=(c.pr.i-R0.ret+N)%N; if(dr<40 && c.cp===1) this.portalJump(c,R0.ret); }
    let seg;
    if(c.cp===0) seg=-((R0.entry-c.pr.i+N)%N);
    else { let s=(c.pr.i-R0.circ+N)%N; if(s>=R0.span) s-=R0.span; if(s>R0.span*0.8 && c.cp===1) s=0; const lo=(this.cps[c.cp-1]-R0.circ+N)%N, hi=(this.cps[c.cp]-R0.circ+N)%N||R0.span; seg=clamp(s,c.cp===1?0:lo,hi+30); }
    c.score=c.finished?1e9-c.finishPos*1e6:(c.lap-1)*R0.span+seg;
  }
  // teleport through the return portal: same distance past the gate, same lateral offset, same heading and speed relative to the road
  portalJump(c,from){
    const P=this.P, N=P.N, R0=this.route, sp=P.spacing; if(from==null) from=R0.ret;
    const oi=c.pr.i, off=clamp(((oi-from+N)%N)+c.pr.t,0,40); const pre={v:+c.speed.toFixed(2),lat:+c.pr.lat.toFixed(2),hrel:+angDiff(Math.atan2(P.tx[oi],P.tz[oi]),c.h).toFixed(3)};
    const fi=R0.dest+off, i=Math.floor(fi)%N, t=fi-Math.floor(fi), j=(i+1)%N;
    const hOld=Math.atan2(P.tx[oi],P.tz[oi]), hNew=Math.atan2(P.tx[i],P.tz[i]); const dh=angDiff(hOld,hNew);
    const cx=P.x[i]+(P.x[j]-P.x[i])*t, cz=P.z[i]+(P.z[j]-P.z[i])*t;
    let lat=clamp(c.pr.lat,-P.w[i]/2+c.halfW+0.3,P.w[i]/2-c.halfW-0.3);
    // never land on top of someone who came through a moment earlier: slide sideways, else ghost briefly
    const free=l=>this.cars.every(o=>{ if(o===c||o.finished) return true; const ox=cx+P.rx[i]*l-o.x, oz=cz+P.rz[i]*l-o.z; return ox*ox+oz*oz>(c.radius+o.radius)*(c.radius+o.radius); });
    let placed=free(lat); for(const d of [2.6,-2.6,5.2,-5.2]){ if(placed) break; const l=clamp(lat+d,-P.w[i]/2+c.halfW+0.3,P.w[i]/2-c.halfW-0.3); if(free(l)){ lat=l; placed=true; } }
    if(!placed) c.ghost=Math.max(c.ghost,0.6);
    const dy=c.y-c.pr.h; c.x=cx+P.rx[i]*lat; c.z=cz+P.rz[i]*lat; c.y=P.y[i]+(P.y[j]-P.y[i])*t+dy;
    const cs=Math.cos(dh), sn=Math.sin(dh), vx=c.vx, vz=c.vz; c.vx=vx*cs+vz*sn; c.vz=vz*cs-vx*sn; c.h+=dh;
    c.i=i; P.project(c.x,c.z,i,c.pr); c.prevWheel=[null,null]; c.lastSafe=i; c.portalT=this.time;
    { const hr=o=>angDiff(Math.atan2(P.tx[o],P.tz[o]),c.h); this.portalLog.push({car:c.name,lap:c.lap,t:+this.raceTime.toFixed(2),v:+c.speed.toFixed(2),lat:+c.pr.lat.toFixed(2),hrel:+hr(i).toFixed(3),ghost:!placed,pre}); }
    if(c.isPlayer){ this.cam.snap=true; this.game.ui.portal(); this.sfx('portal'); }
  }
  // ---- loop-the-loop on rails (see buildTrackPath)
  loopEnter(c){ const L=this.P.loop, P=this.P; const half=P.w[L.i0]/2; c.loop={u:0,v:clamp(c.speed,24,46),lat:clamp(c.pr.lat,-half,half)*((L.w-3.2)/2)/half,th:0}; c.drifting=false; c.spin=0; c.vy=0;
    if(c.isPlayer){ this.sfx('boost'); this.game.ui.flash('FULL SEND!','#c9a66b',1.1); } if(this.W.pyro) this.W.pyro('loop',c); }
  loopStep(c,dt){ const L=this.P.loop, P=this.P, N=P.N, o=c.loop; const th=2*Math.PI*o.u; const v=o.v*(1-0.22*Math.sin(th/2)*Math.sin(th/2));   // a touch slower over the top
    o.u+=v*dt/L.len;
    if(o.u>=1){ c.loop=null; const lat=clamp(o.lat*(P.w[L.i1]/2)/((L.w-3.2)/2),-P.w[L.i1]/2+1.5,P.w[L.i1]/2-1.5); c.place(L.i1,lat); c.vF=o.v; c.vx=Math.sin(c.h)*o.v; c.vz=Math.cos(c.h)*o.v; c.ghost=Math.max(c.ghost,0.25); if(c.isPlayer) this.shake(0.25); return; }
    L.pos(o.u,o.lat,c); o.th=2*Math.PI*o.u; c.h=Math.atan2(L.fx,L.fz); const cs=Math.cos(o.th); c.vx=L.fx*v*cs; c.vz=L.fz*v*cs; c.vy=0; c.vF=v; c.vS=0; c.yaw=0; c.grounded=true; c.offroad=false; c.offroadRaw=false;
    const i=(L.i0+Math.min(L.span-1,Math.floor(o.u*L.span)))%N; c.i=i; c.pr.i=i; c.pr.t=0; c.pr.lat=o.lat; c.pr.h=c.y; c.pr.gap=0; c.pr.w=P.w[i]; c.pr.wl=P.wl[i]; c.pr.wr=P.wr[i]; c.pr.tx=L.fx; c.pr.tz=L.fz; c.pr.rx=L.rx; c.pr.rz=L.rz; c.pr.slope=0; c.pr.median=0;
    if(c.ghost>0) c.ghost-=dt; if(c.shield>0) c.shield-=dt; if(c.itemCD>0) c.itemCD-=dt; }
  onLap(c){
    if(c.finished) return;   // a finished car that keeps circulating must not finish again (20-lap races: the leader can lap once more before the player is home)
    const now=this.raceTime;
    if(c.lap>1 && this.route && c.lap===2 && !c.openDone){ c.openDone=true; c.openLap=now-c.lapStart; c.lapTimes.push(c.openLap); }
    else if(c.lap>1){ const lt=now-c.lapStart; c.lapTimes.push(lt); if(c.bestLap==null||lt<c.bestLap) c.bestLap=lt;
      if(c.isPlayer && !this.game.autopilotNoRecord && !this.practice && (this.best.lap==null||lt<this.best.lap)){ this.best.lap=lt; this.best.lapCar=c.v.name; Store.set('best_'+trackKey(this.def),this.best); this.newLapRecord=true; } }
    c.lapStart=now;
    if(c.lap>this.laps){ c.finished=true; c.finishTime=now; this.finishOrder.push(c); c.finishPos=this.finishOrder.length;
      if(c.isPlayer){ this.state='finish'; this.stateT=0; this.sfx('finish'); if(this.W.rev&&this.W.rev.celebrate) this.W.rev.celebrate(); this.game.audio.setMusic('menu'); this.game.ui.flash(ordinal(c.finishPos)+' PLACE!',c.finishPos<=3?'#ffc23d':'#22e4ff',3);
        if(!this.shortRace&&(this.best.race==null||now<this.best.race)){ this.best.race=now; this.best.raceCar=c.v.name; this.newRaceRecord=true; Store.set('best_'+trackKey(this.def),this.best); } }
      return; }
    if(c.isPlayer && c.lap>1 && this.practice){ const lt=c.lapTimes[c.lapTimes.length-1]; this.sfx('lap'); this.game.ui.flash('LAP '+fmtTime(lt)+(lt<=c.bestLap+1e-6?' · BEST':''),'#22e4ff'); return; }
    if(c.isPlayer && c.lap>1){ if(c.lap===this.laps){ this.sfx('final'); this.game.ui.flash('FINAL LAP','#ff2e97'); } else { this.sfx('lap'); this.game.ui.flash('LAP '+c.lap+' / '+this.laps,'#22e4ff'); } }
  }
  rollItem(c){ const r=Math.random(), pos=c.rank/8;
    const wN=0.2+0.6*pos, wA=0.35-0.15*pos, wS=0.45-0.3*pos; const t=wN+wA+wS; const x=r*t; return x<wN?'nitro':x<wN+wA?'aegis':'slick'; }
  useItem(c){
    const it=c.item; c.item=null;
    if(it==='nitro'){ c.giveBoost(1.6); c.boostMax=1.6; if(c.isPlayer) this.sfx('boost',1.2); else this.sfx3d('boost',c); }
    else if(it==='aegis'){ c.shield=7; if(c.isPlayer) this.sfx('shield'); else this.sfx3d('shield',c); }
    else if(it==='slick'){ const fx=Math.sin(c.h),fz=Math.cos(c.h); const x=c.x-fx*(c.halfL+2.2), z=c.z-fz*(c.halfL+2.2); const i=this.P.nearest(x,z,c.i,10); const pr=this.P.project(x,z,i,{});
      if(pr.gap) { c.item=null; return; }
      const m=new THREE.Mesh(this.slickGeo,this.slickMat); m.rotation.x=-Math.PI/2; m.position.set(x,pr.h+0.06,z); m.receiveShadow=true; this.scene.add(m);
      this.slicks.push({x,z,mesh:m,owner:c,age:0}); if(this.slicks.length>12) this.removeSlick(0); if(c.isPlayer) this.sfx('drop'); else this.sfx3d('drop',c); }
  }
  removeSlick(k){ const s=this.slicks[k]; this.scene.remove(s.mesh); this.slicks.splice(k,1); }
  collide(){
    const cs=this.cars;
    for(let a=0;a<cs.length;a++) for(let b=a+1;b<cs.length;b++){
      const A=cs[a],B=cs[b]; if(A.ghost>0||B.ghost>0) continue; if(this.route&&(A.finished||B.finished)) continue; if(Math.abs(A.y-B.y)>1.8) continue;
      const dx=B.x-A.x, dz=B.z-A.z, rs=A.radius+B.radius; const d2=dx*dx+dz*dz; if(d2>rs*rs||d2<1e-6) continue;
      const d=Math.sqrt(d2), nx=dx/d, nz=dz/d, pen=rs-d; const ma=A.ph.mass, mb=B.ph.mass, mt=ma+mb;
      A.x-=nx*pen*mb/mt; A.z-=nz*pen*mb/mt; B.x+=nx*pen*ma/mt; B.z+=nz*pen*ma/mt;
      const rv=(B.vx-A.vx)*nx+(B.vz-A.vz)*nz;
      if(rv<0){ const j=-(1.35)*rv/(1/ma+1/mb); A.vx-=j*nx/ma; A.vz-=j*nz/ma; B.vx+=j*nx/mb; B.vz+=j*nz/mb;
        if(A.shield>0&&B.shield<=0&&-rv>3) B.spinOut(0.6); else if(B.shield>0&&A.shield<=0&&-rv>3) A.spinOut(0.6);
        if(-rv>2.5){ const px=A.x+nx*A.radius, pz=A.z+nz*A.radius; if(A.isPlayer||B.isPlayer){ this.sfx('bump'); this.shake(Math.min(0.35,-rv*0.03)); for(let k=0;k<8;k++) this.fx.sparks.emit(px,A.y+0.6,pz,rr(-4,4),rr(1,4),rr(-4,4),0.3,0.25,0.05,1,0.85,0.5,1,2,10);} }
      }
    }
  }
  results(){
    const P=this.P; const list=this.cars.slice();
    const avg=c=>{ return Math.max(20,c.ph.top*c.skill*0.8); };
    list.forEach(c=>{ if(!c.finished){ const remain=this.route? this.laps*this.route.span-c.score : (this.laps+1)*P.N - (c.score); c.estTime=this.raceTime+Math.max(0,remain)*P.spacing/avg(c); } else c.estTime=c.finishTime; });
    list.sort((a,b)=>{ if(a.finished&&b.finished) return a.finishPos-b.finishPos; if(a.finished) return -1; if(b.finished) return 1; return a.estTime-b.estTime; });
    return {track:this.def, place:list.indexOf(this.player)+1, rows:list.map((c,k)=>({pos:k+1,driver:c.driver,car:c.v.name,time:c.estTime,est:!c.finished,best:c.bestLap,player:c.isPlayer,color:c.v})),
      finished:this.player.finished, shortRace:!!this.shortRace, playerTime:this.player.finishTime, playerBest:this.player.bestLap, newRace:!!this.newRaceRecord, newLap:!!this.newLapRecord, best:this.best};
  }
  buildMiniPath(){ const P=this.P; let minx=1e9,maxx=-1e9,minz=1e9,maxz=-1e9; for(let i=0;i<P.N;i++){minx=Math.min(minx,P.x[i]);maxx=Math.max(maxx,P.x[i]);minz=Math.min(minz,P.z[i]);maxz=Math.max(maxz,P.z[i]);}
    this.mini={minx,maxx,minz,maxz}; }
  dispose(){
    this.game.audio.stopLoops(); GFX.v2.end(this);
    this.scene.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ if(m.map) m.map.dispose(); m.dispose(); }); } });
    if(this.env) this.env.dispose();
  }
}
// ---------- chase camera ----------
class ChaseCam{
  constructor(R){ this.R=R; this.yaw=R.player.h; this.y=R.player.y+3; this.fov=68; this.snap=true; this.t=0; }
  update(dt){
    const R=this.R, cam=R.game.camera, c=R.player; this.t+=dt;
    if(R.state==='intro'){ // cinematic flyover of the grid
      const k=this.t/4.2, P=R.P, i=(P.N-40+Math.round(k*48))%P.N;
      const side=Math.sin(k*2)*14; { const cx=P.x[i]+P.rx[i]*side, cz=P.z[i]+P.rz[i]*side; cam.position.set(cx,Math.max(P.y[i]+4+10*(1-k),R.W.heightAt(cx,cz)+2),cz); }
      const j=(i+12)%P.N; cam.lookAt(P.x[j],P.y[j]+1,P.z[j]); cam.fov=60; cam.updateProjectionMatrix(); return; }
    if(R.state==='finish'||R.state==='done'){ // orbit the player
      const a=this.t*0.35+c.h+2.5, r=9; const tx=c.x+Math.sin(a)*r, tz=c.z+Math.cos(a)*r; const gy=Math.max(c.y+3.2,R.W.heightAt(tx,tz)+2); cam.position.lerp(new THREE.Vector3(tx,gy,tz),Math.min(1,dt*2)); cam.lookAt(c.x,c.y+1,c.z); cam.fov=lerp(cam.fov,55,dt*2); cam.updateProjectionMatrix(); return; }
    const sp=c.speed;
    let tgtYaw=c.h; if(sp>3){ const vy=Math.atan2(c.vx,c.vz); const fwdDot=Math.sin(c.h)*c.vx+Math.cos(c.h)*c.vz; if(fwdDot>0) tgtYaw=c.h+angDiff(c.h,vy)*0.5; }
    if(this.snap){ this.yaw=tgtYaw; this.y=c.y+2.8; this.snap=false; }
    this.yaw+=angDiff(this.yaw,tgtYaw)*Math.min(1,dt*5.5);
    const tall=Math.max(0,((c.model.dims.H||1.3)-1.4)); const dist=6.6+sp*0.035+tall*1.2, hgt=2.4+sp*0.012+tall*0.7;
    const ty=c.y+hgt; this.y+=(ty-this.y)*Math.min(1,dt*(c.grounded?7:2.5));
    let px=c.x-Math.sin(this.yaw)*dist, pz=c.z-Math.cos(this.yaw)*dist, py=this.y;
    const gh=R.W.heightAt(px,pz); if(py<gh+1.2) py=gh+1.2;
    // shake
    R.trauma=Math.max(0,R.trauma-dt*1.4); let sh=R.trauma*R.trauma; if(R.game.S.shake && c.boost>0) sh+=0.012;
    if(sh>0){ px+=(vnoise(this.t*25,1)-0.5)*sh*1.2; py+=(vnoise(this.t*25,7)-0.5)*sh*1.0; pz+=(vnoise(this.t*25,13)-0.5)*sh*1.2; }
    cam.position.set(px,py,pz);
    this.loopK=(this.loopK||0)+((c.loop?1:0)-(this.loopK||0))*Math.min(1,dt*(c.loop?6:3)); if(this.loopK<0.002) this.loopK=0;
    if(this.loopK>0){ const L=R.P.loop, u=c.loop?c.loop.u:1, sd=L.D>0?-1:1, k=smooth01(this.loopK), lt=L.D*u+sd*L.R*2.5, al=L.adv*u-L.R*1.25;   // stand outside the loop on the entry side, a little behind
      const sx=L.ex+L.fx*al+L.rx*lt, sy=L.ey+L.R*0.62, sz=L.ez+L.fz*al+L.rz*lt; cam.position.set(px+(sx-px)*k,py+(sy-py)*k,pz+(sz-pz)*k);
      const lx=c.x+Math.sin(this.yaw)*4*(1-k), lz=c.z+Math.cos(this.yaw)*4*(1-k); cam.lookAt(lx,c.y+1.1*(1-k)+0.4*k,lz); if(c.loop){ this.yaw=c.h; this.y=py; } }
    else cam.lookAt(c.x+Math.sin(this.yaw)*4,c.y+1.1,c.z+Math.cos(this.yaw)*4);
    const tf=66+Math.min(sp,70)*0.22+(c.boost>0?7:0); this.fov+=(tf-this.fov)*Math.min(1,dt*3); cam.fov=this.fov; cam.updateProjectionMatrix();
  }
}

// ===== ONLINE: username/password accounts + Hard-mode leaderboards (Supabase REST) =====
const SB_URL='https://pnnuxsjjdkluphvwknqt.supabase.co';
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubnV4c2pqZGtsdXBodndrbnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNDg5MjQsImV4cCI6MjEwNTkyNDkyNH0.Y9ZTT5p3k4ND8vpzl2qQniTlltCabEb24c4WdHJnf_8';
const USER_RE=/^[A-Za-z0-9_]{3,16}$/;
class Online{
  constructor(){ this.session=Store.get('session',null); this.listeners=[]; }
  get user(){ return this.session&&this.session.username?this.session.username:null; }
  emailFor(u){ return u.toLowerCase()+'@players.rydensracers.com'; }
  onChange(f){ this.listeners.push(f); } emit(){ this.listeners.forEach(f=>{ try{ f(this.user); }catch(e){} }); }
  async req(path,{method='GET',body,auth=false,headers={}}={}){
    const h=Object.assign({apikey:SB_KEY,'Content-Type':'application/json'},headers);
    if(auth){ await this.ensureFresh(); if(!this.session) throw new Error('Please log in again.'); h.Authorization='Bearer '+this.session.access_token; }
    else h.Authorization='Bearer '+SB_KEY;
    let r; try{ r=await fetch(SB_URL+path,{method,headers:h,body:body!==undefined?JSON.stringify(body):undefined}); }
    catch(e){ throw new Error('Can\u2019t reach the leaderboard server. Online features work on the GitHub version of the game.'); }
    const txt=await r.text(); let data=null; try{ data=txt?JSON.parse(txt):null; }catch(e){ data=txt; }
    if(!r.ok){ const msg=(data&&(data.msg||data.message||data.error_description||data.error))||('Server error '+r.status); const err=new Error(msg); err.status=r.status; err.code=data&&(data.error_code||data.code); throw err; }
    return {data,res:r};
  }
  saveSession(d,username){ this.session={access_token:d.access_token,refresh_token:d.refresh_token,expires_at:Date.now()/1000+(d.expires_in||3600),user_id:d.user&&d.user.id,username}; Store.set('session',this.session); this.emit(); }
  async ensureFresh(){
    const s=this.session; if(!s) return; if(s.expires_at-Date.now()/1000>90) return;
    try{ const {data}=await this.req('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:s.refresh_token}}); this.saveSession(data,s.username); }
    catch(e){ if(e.status===400||e.status===401){ this.session=null; Store.set('session',null); this.emit(); } throw e; }
  }
  validate(u,p){ if(!USER_RE.test(u||'')) return 'Username must be 3\u201316 letters, numbers or _'; if(!p||p.length<6) return 'Password must be at least 6 characters'; return null; }
  async signUp(u,p){
    const bad=this.validate(u,p); if(bad) throw new Error(bad);
    const {data:free}=await this.req('/rest/v1/rpc/username_available',{method:'POST',body:{name:u}});
    if(free===false) throw new Error('That username is taken.');
    let d; try{ d=(await this.req('/auth/v1/signup',{method:'POST',body:{email:this.emailFor(u),password:p,data:{username:u}}})).data; }
    catch(e){ if(/already registered|already exists/i.test(e.message)) throw new Error('That username is taken.'); if(/database error/i.test(e.message)) throw new Error('That username can\u2019t be used. Try another.'); throw e; }
    if(!d||!d.access_token) throw new Error('Account created, but email confirmation is still switched on in Supabase (Authentication \u2192 Email \u2192 Confirm email).');
    this.saveSession(d,u); return u;
  }
  async logIn(u,p){
    if(!u||!p) throw new Error('Enter your username and password.');
    let d; try{ d=(await this.req('/auth/v1/token?grant_type=password',{method:'POST',body:{email:this.emailFor(u),password:p}})).data; }
    catch(e){ if(e.status===400) throw new Error('Wrong username or password.'); throw e; }
    let name=u; try{ const {data:pr}=await this.req('/rest/v1/profiles?select=username&id=eq.'+d.user.id); if(pr&&pr[0]) name=pr[0].username; }catch(e){}
    this.saveSession(d,name); return name;
  }
  logOut(){ const s=this.session; this.session=null; Store.set('session',null); this.emit(); if(s) fetch(SB_URL+'/auth/v1/logout',{method:'POST',headers:{apikey:SB_KEY,Authorization:'Bearer '+s.access_token}}).catch(()=>{}); }
  // Account-exclusive content: access comes from a real signed-in session of the existing account system (never from a stored "unlocked" flag).
  hasAccess(){ return !!(this.session && this.session.access_token && this.session.user_id && this.user); }
  async verify(){ if(!this.session) return false;
    try{ await this.req('/auth/v1/user',{auth:true}); this.verified=true; return true; }
    catch(e){ if(e.status===401||e.status===403){ this.session=null; Store.set('session',null); this.emit(); return false; } this.verified=null; return !!this.session; } }
  ackKey(u){ return 'ack_'+(this.session&&this.session.user_id)+'_'+u; }
  async isAcked(unlock){ if(!this.hasAccess()) return true; if(Store.get(this.ackKey(unlock),false)) return true;
    try{ const {data}=await this.req('/rest/v1/unlock_acks?select=unlock&unlock=eq.'+encodeURIComponent(unlock),{auth:true}); const yes=!!(data&&data.length); if(yes) Store.set(this.ackKey(unlock),true); return yes; }
    catch(e){ return false; } }
  async ack(unlock){ if(!this.hasAccess()) return; Store.set(this.ackKey(unlock),true);
    try{ await this.req('/rest/v1/unlock_acks',{method:'POST',auth:true,body:{unlock},headers:{Prefer:'return=minimal'}}); }
    catch(e){ if(e.status!==409 && !/duplicate/i.test(e.message||'')) Store.set('ackRetry_'+this.session.user_id,unlock); } }
  async submit(track,car,raceMs,lapMs){
    const rows=[]; if(raceMs) rows.push({track,car,kind:'race',time_ms:Math.round(raceMs)}); if(lapMs) rows.push({track,car,kind:'lap',time_ms:Math.round(lapMs)});
    if(!rows.length) return; await this.req('/rest/v1/race_results',{method:'POST',auth:true,body:rows,headers:{Prefer:'return=minimal'}});
  }
  async board(track,kind,limit=10){ const {data}=await this.req(`/rest/v1/leaderboard?select=username,car,time_ms,created_at&track=eq.${track}&kind=eq.${kind}&order=time_ms.asc,created_at.asc&limit=${limit}`); return data||[]; }
  async myBest(track,kind){ if(!this.user) return null; const {data}=await this.req(`/rest/v1/leaderboard?select=username,car,time_ms&track=eq.${track}&kind=eq.${kind}&username=eq.${encodeURIComponent(this.user)}`); return data&&data[0]||null; }
  async rankOf(track,kind,ms){ const {res}=await this.req(`/rest/v1/leaderboard?select=username&track=eq.${track}&kind=eq.${kind}&time_ms=lt.${Math.round(ms)}`,{headers:{Prefer:'count=exact',Range:'0-0'}}); const cr=res.headers.get('content-range')||''; const n=parseInt(cr.split('/')[1]); return isNaN(n)?null:n+1; }
}

// ===== GAME / UI =====
const QUALITY=GFX.settings.legacyQuality();   // tier table lives in js/gfx/settings.js (legacy fields unchanged)
const $=id=>document.getElementById(id);
function btnScale(S){ return ({s:0.82,m:1,l:1.2})[S.btnSize||'m']||1; }
class Input{
  constructor(game){
    this.g=game; this.keys={}; this.touch={}; this.pressed=[]; this.padPrev={};
    addEventListener('keydown',e=>{ if(e.target&&e.target.tagName==='INPUT'){ if(e.code==='Enter'){ const a=game.screen==='account'&&!game.online.user?'login':null; if(a){ e.preventDefault(); game.ui.act(a); } } else if(e.code==='Escape'){ e.target.blur(); } return; } if(e.repeat&&this.keys[e.code]) { this.prevent(e); return; } this.keys[e.code]=true; this.pressed.push(e.code); this.prevent(e); game.onAnyInput(); });
    addEventListener('keyup',e=>{ this.keys[e.code]=false; });
    addEventListener('blur',()=>{ this.keys={}; });
    // ---- touch: joystick OR arrow buttons for steering + multi-touch action buttons you can slide/chord between ----
    this.touches=new Map(); this.joy={id:null,x:0,y:0,sx:0,sy:0,steer:0,brake:false}; this.arrowSteer=0; this.lastDrive=performance.now(); this.tapSkip=false;
    const tEl=$('touch'), active=()=>tEl.classList.contains('on');
    const S=()=>game.S; const lefty=()=>S().steerSide==='right';
    const hitButtons=(x,y)=>{ const out=[]; tEl.querySelectorAll('.tb').forEach(b=>{ if(b.offsetParent===null) return; const r=b.getBoundingClientRect(); const cx=r.left+r.width/2, cy=r.top+r.height/2, R=r.width/2; if(Math.hypot(x-cx,y-cy)<=R*1.25) out.push(b.dataset.k); }); return out; };
    const refresh=()=>{ const on={}; this.touches.forEach(v=>{ if(v.type==='btn') v.keys.forEach(k=>on[k]=true); }); ['gas','brake','drift','item','left','right'].forEach(k=>this.touch[k]=!!on[k]); tEl.querySelectorAll('.tb').forEach(b=>b.classList.toggle('on',!!on[b.dataset.k])); };
    const joyEl=$('joy'), knob=$('joyK');
    const joyR=()=>58*(1.55-0.55*clamp(S().steerSens||1,0.5,1.5))*btnScale(S());
    const joyMove=(x,y)=>{ const J=this.joy, R=joyR(); let dx=x-J.sx, dy=y-J.sy; const d=Math.hypot(dx,dy); if(d>R){ dx*=R/d; dy*=R/d; } knob.style.transform=`translate(${dx}px,${dy}px)`;
      const expo=1.5-0.6*clamp(S().steerSens||1,0.5,1.5); let s=dx/R; s=Math.abs(s)<0.08?0:Math.sign(s)*Math.pow((Math.abs(s)-0.08)/0.92,expo); J.steer=clamp(s,-1,1); J.brake=dy/R>0.62; };
    const inSteerZone=(x,y)=>{ const w=innerWidth; return (lefty()? x>w*0.54 : x<w*0.46) && y>innerHeight*0.25; };
    const start=e=>{ if(!active()) return; let used=false; const R=game.race;
      for(const t of e.changedTouches){ if(t.target && t.target.closest && t.target.closest('#pauseBtn')) continue; const x=t.clientX,y=t.clientY; used=true; game.audio.init();
        if(R && R.state==='intro') this.tapSkip=true;
        if(S().steerMode!=='arrows' && inSteerZone(x,y) && this.joy.id===null){ const J=this.joy; J.id=t.identifier; J.sx=x; J.sy=y; const jr=joyR()+8; joyEl.style.width=joyEl.style.height=(jr*2)+'px'; joyEl.style.marginLeft=joyEl.style.marginTop=(-jr)+'px'; joyEl.style.left=x+'px'; joyEl.style.top=y+'px'; joyEl.classList.add('on'); joyMove(x,y); this.touches.set(t.identifier,{type:'joy'}); }
        else this.touches.set(t.identifier,{type:'btn',keys:hitButtons(x,y)}); }
      if(used){ e.preventDefault(); refresh(); } };
    const move=e=>{ if(!active()||!this.touches.size) return; let used=false;
      for(const t of e.changedTouches){ const v=this.touches.get(t.identifier); if(!v) continue; used=true; if(v.type==='joy') joyMove(t.clientX,t.clientY); else v.keys=hitButtons(t.clientX,t.clientY); }
      if(used){ e.preventDefault(); refresh(); } };
    const resetJoy=()=>{ const J=this.joy; J.id=null; J.steer=0; J.brake=false; knob.style.transform=''; joyEl.classList.remove('on'); ['left','top','width','height','marginLeft','marginTop'].forEach(k=>joyEl.style[k]=''); };
    const end=e=>{ let used=false; for(const t of e.changedTouches){ const v=this.touches.get(t.identifier); if(!v) continue; used=true; this.touches.delete(t.identifier); if(v.type==='joy') resetJoy(); }
      if(used){ if(e.cancelable) e.preventDefault(); refresh(); } };
    document.addEventListener('touchstart',start,{passive:false}); document.addEventListener('touchmove',move,{passive:false});
    document.addEventListener('touchend',end,{passive:false}); document.addEventListener('touchcancel',end,{passive:false});
    this.clearTouch=()=>{ this.touches.clear(); resetJoy(); this.arrowSteer=0; refresh(); };
  }
  prevent(e){ if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Tab'].includes(e.code)) e.preventDefault(); }
  pad(){ const ps=navigator.getGamepads?navigator.getGamepads():[]; for(const p of ps){ if(p&&p.connected) return p; } return null; }
  // edge-triggered menu events
  events(){
    const ev=this.pressed.slice(); this.pressed.length=0;
    const p=this.pad(); if(p){ const b=i=>p.buttons[i]&&p.buttons[i].pressed; const map={up:b(12)||p.axes[1]<-0.6,down:b(13)||p.axes[1]>0.6,left:b(14)||p.axes[0]<-0.6,right:b(15)||p.axes[0]>0.6,ok:b(0),back:b(1),start:b(9),sel:b(8)};
      const codes={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight',ok:'Enter',back:'Escape',start:'PadStart',sel:'PadSelect'};
      for(const k in map){ if(map[k]&&!this.padPrev[k]){ ev.push(codes[k]); this.g.onAnyInput(); } this.padPrev[k]=map[k]; } }
    return ev;
  }
  drive(){
    const K=this.keys,T=this.touch; const o={thr:0,brk:0,steer:0,drift:false,item:false,reset:false,skip:false};
    const J=this.joy||{steer:0,brake:false}; const now=performance.now(), ddt=Math.min(0.1,(now-this.lastDrive)/1000); this.lastDrive=now;
    if(K.KeyW||K.ArrowUp||T.gas) o.thr=1; if(K.KeyS||K.ArrowDown||T.brake||J.brake) o.brk=1;
    if(K.KeyA||K.ArrowLeft) o.steer-=1; if(K.KeyD||K.ArrowRight) o.steer+=1; if(J.steer) o.steer=clamp(o.steer+J.steer,-1,1);
    { const want=(T.right?1:0)-(T.left?1:0), sens=clamp(this.g.S.steerSens||1,0.5,1.5); const rate=(want===0?9:(2.5+4*sens))*ddt;
      this.arrowSteer+=clamp(want-this.arrowSteer,-rate,rate); if(want!==0 && Math.sign(want)!==Math.sign(this.arrowSteer)) this.arrowSteer=0; if(this.arrowSteer) o.steer=clamp(o.steer+this.arrowSteer,-1,1); }
    if(this.tapSkip){ o.skip=true; this.tapSkip=false; }
    const R=this.g.race; if(this.g.S.autogas && this.g.ui.isTouch() && !o.brk && R && R.state!=='intro' && R.state!=='countdown') o.thr=1;
    o.drift=!!(K.Space||T.drift); o.item=!!(K.ShiftLeft||K.ShiftRight||K.KeyE||T.item); o.reset=!!K.KeyR;
    const p=this.pad(); if(p){ const ax=p.axes[0]||0; if(Math.abs(ax)>0.15) o.steer=clamp(o.steer+Math.sign(ax)*(Math.abs(ax)-0.15)/0.85,-1,1);
      const bv=i=>p.buttons[i]?(p.buttons[i].value||(p.buttons[i].pressed?1:0)):0;
      o.thr=Math.max(o.thr,bv(7),bv(0)); o.brk=Math.max(o.brk,bv(6),bv(1)); if(bv(5)>0.5||bv(2)>0.5) o.drift=true; if(bv(4)>0.5||bv(3)>0.5) o.item=true; if(bv(8)>0.5) o.reset=true; }
    return o;
  }
}
class Game{
  constructor(){
    this.S=Object.assign({master:0.8,sfx:0.9,music:0.6,musicOn:true,quality:'medium',shake:true,units:'mph',touch:'auto',autogas:true,device:null,steerMode:'joy',steerSens:1,assist:'low',btnSize:'m',steerSide:'left'},Store.get('settings',{}));
    if(Store.get('carOrder',1)<2){ const lc=Store.get('lastCar',null); if(lc===VEHICLES.length-2) Store.set('lastCar',VEHICLES.length-1); Store.set('carOrder',2); }   // order v2: Screaming Eggplant inserted before the Bus (the Bus stays last); a save that pointed at the Bus follows it
    this.sel={vehicle:Store.get('lastCar',2),track:Store.get('lastTrack',0),diff:Store.get('lastDiff','normal')};
    this.renderer=GFX.renderer.create($('gl'));          // renderer setup lives in js/gfx/renderer.js
    this.camera=new THREE.PerspectiveCamera(66,1,0.1,3200);
    this.online=new Online(); this.audio=new AudioEngine(this.S); this.input=new Input(this); this.ui=new UI(this);
    this.applyQuality(); addEventListener('resize',()=>this.resize()); this.resize();
    this.garage=new Garage(this); this.race=null; this.screen='title'; this.focus=0; this.last=performance.now();
    this.fps=60; this.frames=0; this.fpsT=0;
    const loop=()=>{ requestAnimationFrame(loop); this.frame(); }; requestAnimationFrame(loop);
    document.addEventListener('visibilitychange',()=>{ if(document.hidden && this.race && this.screen==='race') this.pause(true); });
  }
  get Q(){ return GFX.settings.effective(this.S.quality)||QUALITY.medium; }   // tier (+ Graphics V2 overrides while a V2 look is active)
  applyQuality(){ GFX.renderer.applySettings(this.Q); this.resize(); }
  resize(){ GFX.renderer.resize(this.camera); }
  saveSettings(){ Store.set('settings',this.S); this.audio.apply(); this.ui.touchMode(); }
  onAnyInput(){ try{ this.audio.init(); }catch(e){ console.warn('audio init',e); } if(this.screen==='title'){ try{ this.audio.play('select'); }catch(e){} this.show(this.S.device?'menu':'device'); this.swallow=true; } }
  assistLevel(){ if(!this.ui.isTouch()) return 0; return ({off:0,low:0.3,high:0.6})[this.S.assist]||0; }
  goLandscape(){ if(!this.ui.isMobile()) return; try{ const d=document.documentElement; const lock=()=>{ try{ if(screen.orientation&&screen.orientation.lock) screen.orientation.lock('landscape').catch(()=>{}); }catch(e){} };
      if(document.fullscreenEnabled && !document.fullscreenElement && this.S.fullscreen!==false){ d.requestFullscreen({navigationUI:'hide'}).then(lock).catch(()=>{}); } else lock(); }catch(e){} }
  show(name){
    this.screen=name; document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===name));
    this.focus=0; this.ui.enter(name); this.ui.refocus();
  }
  frame(){
    const now=performance.now(); let dt=(now-this.last)/1000; this.last=now; if(dt>0.25) dt=0.25;
    this.frames++; this.fpsT+=dt; if(this.fpsT>=1){ this.fps=this.frames/this.fpsT; this.frames=0; this.fpsT=0; }
    let ev=this.input.events(); if(this.swallow){ ev=[]; this.swallow=false; }
    if(this.race && this.screen==='race' && this.ui.isMobile() && innerHeight>innerWidth*1.05 && this.race.state!=='finish' && this.race.state!=='done' && !this.race.paused) this.pause(true);
    if(this.race && (this.screen==='race'||this.screen==='pause'||this.screen==='results'||((this.screen==='settings'||this.screen==='controls')&&this.fromPause))){
      if(this.screen==='race'){ const k=ev.findIndex(e=>e==='Escape'||e==='KeyP'||e==='PadStart'); if(k>=0){ this.pause(true); this.ui.menuEvents(ev.slice(k+1)); } }
      else this.ui.menuEvents(ev);
      if(!this.race){ this.garage.update(dt); this.garage.render(); return; }
      const inp=this.input.drive(); inp.skip=inp.skip||(this.screen==='race'&&ev.length>0&&this.race.state==='intro');
      this.race.update(dt,this.screen==='race'?inp:{thr:0,brk:0,steer:0,drift:false,item:false,reset:false});
      return;
    }
    this.ui.menuEvents(ev);
    this.garage.update(dt); this.garage.render();
  }
  pause(on){ if(!this.race) return; this.race.paused=on; if(on){ this.show('pause'); $('hud').classList.remove('on'); this.audio.play('blip'); } else { this.show('race'); $('hud').classList.add('on'); } }
  startRace(){
    if(!window.CARS_READY){ this.show('loading'); $('loadName').textContent='Warming up'; $('loadPlace').textContent='Loading cars…'; window.CARS_WAIT.push(()=>this.startRace()); return; }
    if(this.gp){ this.sel.track=TRACK_DATA.findIndex(t=>t.id===this.gp.tracks[this.gp.round]); this.sel.diff=this.gp.diff;
      if(trackLocked(TRACK_DATA[this.sel.track])){ const alt=TRACK_DATA.filter(t=>!trackLocked(t)&&!this.gp.tracks.includes(t.id)); const pick=alt[Math.floor(Math.random()*alt.length)]||TRACK_DATA[0]; this.gp.tracks[this.gp.round]=pick.id; this.sel.track=TRACK_DATA.indexOf(pick); } }
    else if(trackLocked(TRACK_DATA[this.sel.track])){ this.ui.lockedPrompt(TRACK_DATA[this.sel.track]); return; }
    else { Store.set('lastCar',this.sel.vehicle); Store.set('lastTrack',this.sel.track); Store.set('lastDiff',this.sel.diff); }
    if(this.starting&&performance.now()-this.starting<30000) return; this.starting=performance.now();   // one race build at a time (a second Go / restart while loading built the race twice)
    this.goLandscape();
    const def=TRACK_DATA[this.sel.track]; $('loadName').textContent=def.name; $('loadPlace').textContent=def.place;
    this.show('loading'); this.garage.render();
    const need=propsForTrack(def); const lp=$('loadPlace');
    if(need.length){ lp.textContent=def.place+' · loading scenery 0/'+need.length; loadCarGLBs(()=>{ lp.textContent=def.place; this.buildRaceNow(); },(a,b)=>{ lp.textContent=def.place+' · loading scenery '+a+'/'+b; },need); return; }
    this.buildRaceNow();
  }
  buildRaceNow(){
    setTimeout(()=>{
      this.starting=0;
      try{
        if(this.race){ this.race.dispose(); this.race=null; }
        this.race=new Race(this,{track:this.sel.track,vehicle:this.sel.vehicle,diff:this.sel.diff,field:this.gp?this.gp.field:(this.mode==='practice'?[]:null),practice:this.mode==='practice',laps:this.gp?gpLapsFor(TRACK_DATA[this.sel.track]):null,order:this.gp?this.gp.order:null});
        this.show('race'); $('hud').classList.add('on');
      }catch(e){ this.ui.error(e); console.error(e); this.show('menu'); }
    },60);
  }
  endRace(){ if(this.race){ this.race.dispose(); this.race=null; } $('hud').classList.remove('on'); this.audio.setMusic('menu'); this.ui.touchVisible(false); }
  showResults(res){ $('hud').classList.remove('on'); this.ui.results(res); if(this.gp) this.gpAfterRace(res); else { $('resGP').style.display='none'; $('resBtnsGP').style.display='none'; $('resBtns').style.display=''; } this.show('results'); this.postOnline(res); }
  gpAfterRace(res){
    const gp=this.gp, GPT=gp.tracks, r=gp.round, last=r===GPT.length-1; const rows=res.rows; const el=$('resGP'), bt=$('resBtnsGP');
    $('resBtns').style.display='none'; el.style.display='block'; bt.style.display='flex';
    let html=`<div class="gpt">GRAND PRIX · RACE ${r+1} OF ${GPT.length}</div>`, btns='';
    if(last){
      const win=rows[0]; gp.done=true;
      if(win.player){ html=`<div class="gpt" style="font-size:30px">🏆 GRAND PRIX CHAMPION! 🏆</div><div class="gpn">You won all the way through with the ${VEHICLES[this.sel.vehicle].name}.</div>`; this.audio.play('finish'); }
      else html+=`<div class="gpo">${esc(win.driver)} wins the Grand Prix in the ${esc(win.car)}. You finished ${ordinal(rows.findIndex(x=>x.player)+1)} in the final.</div>`;
      btns=`<div class="btn small gold" data-gp="new"><span>New Grand Prix</span></div><div class="btn small" data-gp="quit"><span>Main menu</span></div>`;
    } else {
      const k=(gp.elim||GP_ELIM)[r]||0; const out=k?rows.slice(rows.length-k):[]; const meOut=out.some(x=>x.player);
      if(out.length) html+=`<div class="gpo">Eliminated: ${out.map(x=>x.player?'<b>YOU</b>':esc(x.driver)+' ('+esc(x.car)+')').join(', ')}</div>`;
      if(meOut){ gp.done=true; html+=`<div class="gpn">Your Grand Prix is over. Finish higher to survive the cut.</div>`; btns=`<div class="btn small gold" data-gp="new"><span>Try again</span></div><div class="btn small" data-gp="quit"><span>Main menu</span></div>`; }
      else { const keep=rows.slice(0,rows.length-k); gp.field=keep.filter(x=>!x.player).map(x=>x.color.id); gp.order=keep.map(x=>x.player?'__player__':x.color.id); gp.round++; const nt=TRACK_DATA.find(t=>t.id===GPT[gp.round]);
        const myGrid=gp.order.indexOf('__player__')+1; html+=`<div class="gpn">You survive! Next: <b>${nt.name}</b> with ${gp.field.length+1} racers${gp.round===GPT.length-1?' · FINAL':''}. You start <b>${ordinal(myGrid)}</b> on the grid (this race's finishing order).</div>`;
        btns=`<div class="btn small gold" data-gp="next"><span>${gp.round===GPT.length-1?'Start the final':'Next race'}</span></div><div class="btn small" data-gp="quit"><span>Quit Grand Prix</span></div>`; }
    }
    el.innerHTML=html; bt.innerHTML=btns;
    bt.querySelectorAll('[data-gp]').forEach(b=>b.addEventListener('click',()=>this.ui.act('gp_'+b.dataset.gp)));
  }
  newGP(){ const others=VEHICLES.filter((v,i)=>i!==this.sel.vehicle).map(v=>v.id).sort(()=>Math.random()-0.5); if(this.gp&&this.gp.done) GP_TRACKS=rollGPTracks(GP_TRACKS); const series=this.gpSeries||'classic', tracks=gpSeriesTracks(series); this.gp={round:0,diff:this.sel.diff,field:others.slice(0,7),tracks,series,elim:gpElim(tracks.length),order:null}; this.startRace(); }
  async postOnline(res){
    const el=$('resOnline'); el.className='msg'; el.textContent='';
    if(!res.finished || res.posted) return; res.posted=true;
    if(this.sel.diff!=='hard'){ el.textContent='Leaderboards count Hard difficulty only.'; return; }
    if(!this.online.user){ if(this.autopilot) return; const pend=Store.get('pending',[]); pend.push({track:trackKey(res.track),car:VEHICLES[this.sel.vehicle].id,race:res.shortRace?null:res.playerTime*1000,lap:res.playerBest?res.playerBest*1000:null,at:Date.now()}); Store.set('pending',pend.slice(-10));
      el.innerHTML='Your Hard time is saved on this device. <b>Log in or create a racer name</b> and it posts to the online leaderboard automatically. <a href="#" id="resLogin" style="color:var(--gold)">Log in now →</a>';
      const a=$('resLogin'); if(a) a.onclick=ev=>{ ev.preventDefault(); this.ui.act('quit'); this.ui.act('account'); }; return; }
    if(this.autopilot){ return; }
    const tr=trackKey(res.track), car=VEHICLES[this.sel.vehicle].id;
    el.textContent='Posting to leaderboards…';
    try{
      const raceMs=res.shortRace?null:res.playerTime*1000;   // a 10-lap Grand Prix run of a 20-lap track only posts its best lap
      await this.online.submit(tr,car,raceMs,res.playerBest?res.playerBest*1000:null);
      const [rr,lr]=await Promise.all([raceMs?this.online.rankOf(tr,'race',raceMs):null,res.playerBest?this.online.rankOf(tr,'lap',res.playerBest*1000):null]);
      el.innerHTML=`Posted as <b>${this.online.user}</b>`+(raceMs?` · this race would rank <b>#${rr||'?'}</b>`:' · Grand Prix runs this track over 10 laps, so only the lap counts')+(lr?` · best lap <b>#${lr}</b>`:'')+' on the online board';
    }catch(e){ el.className='msg bad'; el.textContent='Couldn’t post to leaderboards: '+e.message; }
  }
}
// ---------------- neon showroom (menu backdrop + car select) ----------------
// The main menu always presents a fixed showcase car. It is independent of GAME.sel.vehicle (the player's racing car),
// so visiting the menu, changing cars or finishing a race never changes what the menu shows.
const SHOWCASE_CAR_ID='gt44';            // the red 1966 GT40 from the trailer
const SHOWCASE_SCREENS=new Set(['title','device','menu','boards','records','account','settings','controls','howto']);
function showroomFloorTex(){
  // glossy dark floor with large, deliberate colour pieces (trailer motif); alpha lets the mirrored scene show through
  return canvasTex(2048,1536,(g,w,h)=>{
    g.clearRect(0,0,w,h); g.fillStyle='rgba(10,6,20,0.55)'; g.fillRect(0,0,w,h);
    // floor spans x -17..17 (34 m), z -9..16 (25 m); car at x=0,z=0
    const X=x=>(x+17)/34*w, Z=z=>(z+9)/25*h; let s=11; const rnd=()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; };
    const cols=['#a81d27','#b88f16','#128784','#2253a8','#bf2273','#5c26bf'];
    const blob=(cx,cz,r,col,k)=>{ const n=9, pts=[]; for(let i=0;i<n;i++){ const a=i/n*TAU+rnd()*0.3; const rr=r*(0.72+rnd()*0.5); pts.push([X(cx+Math.cos(a)*rr*1.25),Z(cz+Math.sin(a)*rr)]); }
      g.beginPath(); for(let i=0;i<=n;i++){ const p=pts[i%n], q=pts[(i+1)%n]; const mx=(p[0]+q[0])/2, my=(p[1]+q[1])/2; if(i===0) g.moveTo(mx,my); else g.quadraticCurveTo(p[0],p[1],mx,my); } g.closePath();
      const gr=g.createLinearGradient(X(cx-r),Z(cz-r),X(cx+r),Z(cz+r)); gr.addColorStop(0,col); gr.addColorStop(1,shade(col,-0.25));
      g.fillStyle=gr; g.globalAlpha=0.66; g.fill(); g.globalAlpha=1; g.lineWidth=10; g.strokeStyle='rgba(8,4,16,0.8)'; g.stroke(); };
    const shade=(hex,f)=>{ const c=parseInt(hex.slice(1),16); let r=c>>16,gg=(c>>8)&255,b=c&255; r=Math.round(r*(1+f)); gg=Math.round(gg*(1+f)); b=Math.round(b*(1+f)); return 'rgb('+r+','+gg+','+b+')'; };
    // pieces grouped under and in front of the car, sparse toward the far walls and the menu side
    [[1.5,1.2,3.4,0],[-2.8,2.6,2.6,1],[4.8,-0.6,2.8,2],[6.5,3.8,3.2,3],[-0.4,5.6,3.0,2],[2.8,7.6,2.4,1],[-5.6,6.8,2.8,4],[9.8,1.2,2.2,1],[-7.8,1.0,2.0,3],[8.4,7.8,2.6,0],[-1.8,-3.6,2.2,5],[5.2,-4.8,2.0,4],[-10.5,9,2.4,2],[12,-3,2.2,0],[0.6,11.5,3.2,3]]
      .forEach(([x,z,r,c])=>blob(x,z,r,cols[c]));
    // specular sheen fading toward the back wall
    const sh=g.createLinearGradient(0,0,0,h); sh.addColorStop(0,'rgba(255,255,255,0.05)'); sh.addColorStop(0.4,'rgba(255,255,255,0)'); g.fillStyle=sh; g.fillRect(0,0,w,h);
  },{srgb:true,aniso:8});
}
function glowBandTex(){ return canvasTex(8,64,(g,w,h)=>{ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(0.42,'rgba(255,255,255,0.35)'); gr.addColorStop(0.5,'rgba(255,255,255,1)'); gr.addColorStop(0.58,'rgba(255,255,255,0.35)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,w,h); },{srgb:false}); }
function softBlobTex(){ return canvasTex(128,128,(g,w,h)=>{ const gr=g.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0,'rgba(0,0,0,0.9)'); gr.addColorStop(0.55,'rgba(0,0,0,0.55)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(0,0,w,h); },{srgb:false}); }
function hazeTex(){ return canvasTex(256,128,(g,w,h)=>{ for(let k=0;k<40;k++){ const x=Math.random()*w, y=h*0.35+Math.random()*h*0.5, r=20+Math.random()*50; const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,'rgba(255,255,255,0.18)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,w,h); }
  const m=g.createLinearGradient(0,0,w,0); m.addColorStop(0,'rgba(0,0,0,1)'); m.addColorStop(0.2,'rgba(0,0,0,0)'); m.addColorStop(0.8,'rgba(0,0,0,0)'); m.addColorStop(1,'rgba(0,0,0,1)'); g.globalCompositeOperation='destination-out'; g.fillStyle=m; g.fillRect(0,0,w,h); },{srgb:false}); }
class Garage{
  constructor(game){
    this.g=game; const s=this.scene=new THREE.Scene(); s.background=new THREE.Color(0x07030f); s.fog=new THREE.Fog(0x0a0418,26,70);
    // --- environment map for paint and chrome: overhead softbox, pink and cyan side strips (keeps the red paint red)
    const es=new THREE.Scene(); es.background=new THREE.Color(0x0c0618);
    const ep=(w,h,c,x,y,z)=>{ const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide})); p.position.set(x,y,z); p.lookAt(0,0.6,0); es.add(p); };
    ep(12,6,0xffffff,0,9,1); ep(3,10,0xff2e97,-9,3,-2); ep(3,10,0x22e4ff,9,3,-2); ep(20,3,0x3a2468,0,1.5,-10); ep(6,2,0xfff1e6,-4,3,9);
    const pm=new THREE.PMREMGenerator(game.renderer); this.env=pm.fromScene(es,0.04).texture; pm.dispose();
    // --- lights: soft key from front-left above, cool fill, restrained pink/cyan rims, mirrored key for the floor reflection
    s.add(new THREE.HemisphereLight(0x6a58c8,0x12081e,GFX.compat.li(0.28)));
    const key=this.key=new THREE.SpotLight(0xfff3ec,GFX.compat.spotI(2.2,40,1,9.8),40,0.36,0.75,1.0); key.position.set(-1.8,9.5,3.2); key.target.position.set(0,0.4,0); key.castShadow=true; key.shadow.mapSize.set(1024,1024); key.shadow.bias=-0.0004; key.shadow.radius=GFX.compat.modern?1.5:4;   /* r128 PCFSoft ignored radius */ s.add(key); s.add(key.target);
    const fill=new THREE.DirectionalLight(0xb9c4ff,GFX.compat.li(0.3)); fill.position.set(4,3,10); s.add(fill);
    const rimP=new THREE.SpotLight(0xff2e97,GFX.compat.spotI(2.6,30,1,9.6),30,0.5,0.7,1.0); rimP.position.set(-7,3.2,-6); rimP.target.position.set(0,0.6,0); s.add(rimP); s.add(rimP.target);
    const rimC=new THREE.SpotLight(0x22e4ff,GFX.compat.spotI(2.2,30,1,9.7),30,0.5,0.7,1.0); rimC.position.set(8,3.0,-5); rimC.target.position.set(0,0.6,0); s.add(rimC); s.add(rimC.target);
    const under=new THREE.DirectionalLight(0xffe8f2,GFX.compat.li(0.9)); under.position.set(-1.8,-9.5,3.2); s.add(under);
    // --- room (Blender-built showroom.glb) and its mirror image under the glossy floor
    this.room=this.buildRoom(); s.add(this.room); GFX.compat.singlePassTransparency(s);
    this.mirror=new THREE.Group(); this.mirror.scale.y=-1; s.add(this.mirror);
    const rm=this.room.clone(true); const dim=new Map();
    rm.traverse(o=>{ if(!o.isMesh) return; o.castShadow=false; o.receiveShadow=false; const m=o.material;
      if(m&&m.isMeshBasicMaterial){ if(!dim.has(m)){ const c=m.clone(); c.color.multiplyScalar(0.55); if(c.transparent) c.opacity*=0.45; dim.set(m,c); } o.material=dim.get(m); } }); this.mirror.add(rm);
    // --- floor: translucent glossy layer over the mirrored scene; opaque black backing far below
    const floorM=new THREE.MeshBasicMaterial({map:showroomFloorTex(),transparent:true,depthWrite:true,color:0xa89fbd});   // gloss comes from the mirrored scene, no specular hot spots
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(34,25),floorM); floor.rotation.x=-Math.PI/2; floor.position.set(0,0,3.5); floor.receiveShadow=true; floor.renderOrder=1; s.add(floor);
    const pit=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.MeshBasicMaterial({color:0x040208})); pit.rotation.x=-Math.PI/2; pit.position.y=-14; s.add(pit);
    // --- haze low behind the car (two soft additive cards)
    const hz0=hazeTex(); this.haze=[];
    [[-2,2.0,-5.5,16,3.2,0xb04cff,0.2],[7,1.7,-6.5,16,3.0,0xff4fb0,0.14]].forEach(([x,y,z,w,h,c,o])=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:this.haze.length?Object.assign(hz0.clone(),{needsUpdate:true}):hz0,color:c,transparent:true,opacity:o,blending:THREE.AdditiveBlending,depthWrite:false,fog:false})); m.position.set(x,y,z); m.userData.x0=x; m.renderOrder=3; s.add(m); this.haze.push(m); });
    // --- stages: fixed showcase car, and the player's selection on a turntable (car select / race setup)
    this.blobTex=softBlobTex();
    this.showcase=new THREE.Group(); s.add(this.showcase); this.showMirror=new THREE.Group(); this.mirror.add(this.showMirror);
    this.showIdx=Math.max(0,VEHICLES.findIndex(v=>v.id===SHOWCASE_CAR_ID)); this.showYaw=0.66;
    this.turn=new THREE.Group(); this.turn.position.y=0.06; s.add(this.turn); this.turnMirror=new THREE.Group(); this.turnMirror.position.y=0.06; this.mirror.add(this.turnMirror);
    const disc=new THREE.Mesh(new THREE.CylinderGeometry(3.6,3.7,0.12,64),new THREE.MeshStandardMaterial({color:0x160c28,metalness:0.8,roughness:0.28,envMap:this.env})); disc.position.y=-0.03; disc.receiveShadow=true;
    const ring=new THREE.Mesh(new THREE.TorusGeometry(3.66,0.035,8,96),new THREE.MeshBasicMaterial({color:0xff2e97,toneMapped:false})); ring.rotation.x=Math.PI/2; ring.position.y=0.03;
    this.platform=new THREE.Group(); this.platform.add(disc,ring); s.add(this.platform); this.platMirror=this.platform.clone(); this.mirror.add(this.platMirror);
    this.carIdx=-1; this.models={}; this.t=0; this.spin=0.4; this.drag=null; this.mode=null; this.frameKey=''; this.fit={d:9,ox:0,oy:0};
    this.cam=new THREE.PerspectiveCamera(30,1,0.1,200); this.base=new THREE.Vector3(0,0.55,0);
    if(window.GFX&&GFX.showroom) GFX.showroom.upgrade(this);   // Graphics V2: studio env + neutral rims (no-op on legacy)
    this.buildShowcase();
    const cv=$('gl'); cv.addEventListener('pointerdown',e=>{ if(this.g.screen==='garage'){ this.drag=e.clientX; this.swX=e.clientX; this.swT=performance.now(); } }); addEventListener('pointerup',e=>{ if(this.swX!=null&&this.g.screen==='garage'&&this.g.ui.isMobile()){ const dx=e.clientX-this.swX; if(Math.abs(dx)>45&&performance.now()-this.swT<600) this.g.ui.act(dx<0?'nextCar':'prevCar'); } this.swX=null; }); addEventListener('pointermove',e=>{ if(this.drag!=null){ this.spin=0; this.turn.rotation.y+=(e.clientX-this.drag)*0.01; this.drag=e.clientX; } }); addEventListener('pointerup',()=>{ if(this.drag!=null){ this.drag=null; this.spin=0.4; } });
  }
  buildRoom(){
    const G=new THREE.Group(); const src=CAR_GLTF['showroom'];
    const neon={m_neon_pink:0xff3aa0,m_neon_cyan:0x3ae8ff,m_neon_white:0xfff4fb};
    const band=glowBandTex();
    const cove=canvasTex(8,256,(g,w,h)=>{ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#05020c'); gr.addColorStop(0.45,'#1c0a3a'); gr.addColorStop(0.85,'#5a1a78'); gr.addColorStop(1,'#a0287a'); g.fillStyle=gr; g.fillRect(0,0,w,h); });
    if(src){
      const root=src.clone(true); const cache=new Map();
      root.traverse(o=>{ if(!o.isMesh) return; const n=(o.material&&o.material.name)||''; o.castShadow=false; o.receiveShadow=/m_panel|m_wall/.test(n);
        if(!cache.has(n)){ let m;
          if(neon[n]!=null) m=new THREE.MeshBasicMaterial({color:neon[n],toneMapped:false});
          else if(/m_glow_/.test(n)) m=new THREE.MeshBasicMaterial({color:/pink/.test(n)?0xff2e97:0x22e4ff,map:band,transparent:true,opacity:0.55,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
          else if(/m_cove/.test(n)) m=new THREE.MeshBasicMaterial({map:cove,fog:false});
          else { m=o.material; const base={m_wall:0x08050f,m_panel:0x130c24,m_frame:0x171229,m_trim:0x8a86a8}[n]; if(base!=null) m.color.setHex(base);
            if(n==='m_panel'){ m.roughness=0.5; m.metalness=0.2; } m.envMap=this.env; m.envMapIntensity=/m_frame|m_trim/.test(n)?0.55:0.12; m.needsUpdate=true; }
          cache.set(n,m); }
        o.material=cache.get(n); if(/m_glow_/.test(n)) o.renderOrder=2; o.matrixAutoUpdate=false; o.updateMatrix(); });
      G.add(root);
    } else {
      // fallback if the showroom model failed to load: simple dark room with neon bars
      const wall=new THREE.Mesh(new THREE.PlaneGeometry(60,12),new THREE.MeshStandardMaterial({color:0x100822,roughness:0.9})); wall.position.set(0,6,-9); G.add(wall);
      [[6.2,0xff3aa0],[1.05,0x3ae8ff]].forEach(([y,c])=>[-12,-6.5,6.5,12].forEach(x=>{ const b=new THREE.Mesh(new THREE.BoxGeometry(4.6,0.1,0.1),new THREE.MeshBasicMaterial({color:c,toneMapped:false})); b.position.set(x,y,-8.8); G.add(b); }));
    }
    return G;
  }
  // soft contact shadow: footprint blob + a darker patch at each tyre
  contactShadow(m){ const d=m.dims||{L:4.4,W:1.9}; const grp=new THREE.Group(); const mat=new THREE.MeshBasicMaterial({map:this.blobTex,transparent:true,depthWrite:false,opacity:0.85,color:0x000000});
    const add=(w,l,x,z,o)=>{ const q=new THREE.Mesh(new THREE.PlaneGeometry(w,l),o===1?mat:mat.clone()); if(o!==1) q.material.opacity=o; q.rotation.x=-Math.PI/2; q.position.set(x,0.012,z); q.renderOrder=2; grp.add(q); };
    add(d.W*1.35,d.L*1.18,0,0,0.9);
    (m.wheels||[]).forEach(wh=>{ const p=new THREE.Vector3(); wh.parent.getWorldPosition(p); m.root.worldToLocal(p); add(0.75,0.95,p.x,p.z,1); });
    return grp; }
  buildShowcase(){
    const v=VEHICLES[this.showIdx]; setEnvOnCarMats(this.env); const m=buildCarModel(v,this.env); m.root.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); if(GFX.showroom) GFX.showroom.car(this,v,m);
    (m.steerPivots||[]).forEach(p=>p.rotation.y=-0.32);          // wheels turned toward the camera, showroom pose
    m.root.updateMatrixWorld(true); this.showModel=m;
    this.showcase.add(m.root); this.showcase.add(this.contactShadow(m)); this.showcase.rotation.y=this.showYaw;
    const mc=m.root.clone(true); this.showMirror.add(mc); this.showMirror.rotation.y=this.showYaw;
    this.showBox=new THREE.Box3().setFromObject(m.root);
    // silhouette sample points (model space) for tight framing
    const pts=[]; const tv=new THREE.Vector3(); m.root.traverse(o=>{ if(!o.isMesh||!o.visible) return; let p=o, vis=true; while(p){ if(p.visible===false) vis=false; p=p.parent; } if(!vis) return; const a=o.geometry.attributes.position; const st=Math.max(1,Math.floor(a.count/400)); for(let i=0;i<a.count;i+=st){ tv.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld); pts.push(tv.clone()); } });
    this.showPts=pts.length?pts:null; }
  setCar(i){ if(this.carIdx===i) return; this.carIdx=i; [this.turn,this.turnMirror].forEach(g=>g.children.slice().forEach(c=>g.remove(c)));
    const v=VEHICLES[i]; if(!window.CARS_READY && GLB_DATA[v.id] && !CAR_GLTF[v.id]){ window.CARS_WAIT.push(()=>{ if(this.carIdx===i){ this.carIdx=-1; this.setCar(i); } }); return; }
    if(!this.models[i]){ setEnvOnCarMats(this.env); const m=buildCarModel(VEHICLES[i],this.env); m.root.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); if(GFX.showroom) GFX.showroom.car(this,VEHICLES[i],m); m.root.updateMatrixWorld(true); m.shadow=this.contactShadow(m); m.mirrorRoot=m.root.clone(true); this.models[i]=m; }
    const m=this.models[i]; this.turn.add(m.root); this.turn.add(m.shadow); this.turnMirror.add(m.mirrorRoot); this.pop=0; this.frameKey=''; if(GFX.showroom) GFX.showroom.platform(this,m); }
  // where on screen the car should sit, from the live layout of the current screen
  stageFor(scr){ const W=innerWidth,H=innerHeight, land=W/H>=1.15;
    if(scr==='menu'){ const c=document.querySelector('#menu .mcol'), lg=document.querySelector('#menu .mlogo'); if(c&&c.offsetParent){ const r=c.getBoundingClientRect();
        if(land) return {x:r.right+W*0.03,y:H*0.1,w:Math.max(W*0.3,W-r.right-W*0.09),h:H*0.8,fx:0.8,fy:0.56};
        const top=lg?lg.getBoundingClientRect().top+c.scrollTop:H*0.35; return {x:W*0.04,y:H*0.03,w:W*0.92,h:Math.max(H*0.22,top-H*0.05),fx:0.92,fy:0.85}; } }
    if(scr==='title'){ const pr=$('pressTxt'); const b=pr?pr.getBoundingClientRect().bottom:H*0.45; const y=Math.min(H*0.7,b+H*0.02); return {x:W*0.08,y,w:W*0.84,h:H-y-H*0.03,fx:0.75,fy:0.8}; }
    if(scr==='garage'){ const c=$('carInfo'); const r=c?c.getBoundingClientRect():null;
      if(land&&r&&r.width&&r.right<W*0.6) return {x:r.right+20,y:H*0.14,w:W-r.right-100,h:H*0.72,fx:0.86,fy:0.62};
      return {x:W*0.04,y:H*0.1,w:W*0.92,h:Math.max(H*0.3,(r&&r.top>0?r.top:H*0.6)-H*0.12),fx:0.9,fy:0.75}; }
    if(SHOWCASE_SCREENS.has(scr)) return land?{x:W*0.42,y:H*0.12,w:W*0.56,h:H*0.8,fx:0.85,fy:0.6}:{x:W*0.04,y:H*0.05,w:W*0.92,h:H*0.4,fx:0.9,fy:0.8};
    return {x:W*0.1,y:H*0.15,w:W*0.8,h:H*0.75,fx:0.8,fy:0.6}; }
  // choose camera distance and view offset so the car fills the stage rectangle
  frameCar(st,showcase){ const W=innerWidth,H=innerHeight, cam=this.cam; cam.aspect=W/H; cam.clearViewOffset(); cam.fov=30; cam.updateProjectionMatrix();
    const pts=[]; if(showcase){ const up=new THREE.Vector3(0,1,0); if(this.showPts) this.showPts.forEach(p=>pts.push(p.clone().applyAxisAngle(up,this.showYaw))); else { const b=this.showBox; for(const x of [b.min.x,b.max.x]) for(const y of [b.min.y,b.max.y]) for(const z of [b.min.z,b.max.z]) pts.push(new THREE.Vector3(x,y,z).applyAxisAngle(up,this.showYaw)); } }
    else { const m=this.models[this.carIdx]; const d=(m&&m.dims)||{L:4.5,W:1.9,H:1.3}; const r=0.5*Math.hypot(d.L,d.W); for(let k=0;k<12;k++){ const a=k/12*TAU; pts.push(new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r),new THREE.Vector3(Math.cos(a)*r,(d.H||1.3)+0.06,Math.sin(a)*r)); } }
    const bb=new THREE.Box3().setFromPoints(pts), c=new THREE.Vector3(); bb.getCenter(c); this.base.set(c.x,Math.max(0.45,c.y),c.z);
    let d=9, ex=0, ey=0;
    for(let it=0;it<4;it++){ this.placeCam(d,0); let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; pts.forEach(p=>{ const q=p.clone().project(cam); x0=Math.min(x0,q.x); x1=Math.max(x1,q.x); y0=Math.min(y0,q.y); y1=Math.max(y1,q.y); });
      const pw=(x1-x0)/2*W, ph=(y1-y0)/2*H; ex=(x0+x1)/4*W; ey=-(y0+y1)/4*H; if(!(pw>0&&ph>0&&st.w>0&&st.h>0)) break; const k=Math.max(pw/(st.w*st.fx),ph/(st.h*st.fy)); d=Math.min(40,Math.max(4.5,d*k)); }
    // centre the car's silhouette (not the look-at point) in the stage
    this.fit={d,cx:st.x+st.w/2-ex,cy:st.y+st.h*0.5-ey}; }
  placeCam(d,a){ const cam=this.cam; const el=0.012; cam.position.set(this.base.x+Math.sin(a)*d*Math.cos(el),this.base.y+Math.sin(el)*d+0.1,this.base.z+Math.cos(a)*d*Math.cos(el)); cam.lookAt(this.base); cam.updateMatrixWorld(true); }
  update(dt){
    this.t+=dt; const scr=this.g.screen; const show=SHOWCASE_SCREENS.has(scr) || scr==='error';
    if(show!==this.mode){ this.mode=show; this.frameKey=''; this.showcase.visible=this.showMirror.visible=show; this.turn.visible=this.turnMirror.visible=this.platform.visible=this.platMirror.visible=!show; }
    if(!show){ this.turn.rotation.y+=this.spin*dt; this.turnMirror.rotation.y=this.turn.rotation.y; this.pop=Math.min(1,(this.pop||0)+dt*3); const k=1-Math.pow(1-this.pop,3); this.turn.scale.setScalar(0.7+0.3*k); this.turnMirror.scale.setScalar(0.7+0.3*k);
      const m=this.models[this.carIdx]; if(m&&m.anims) m.anims.forEach(f=>f(dt,this.t,null)); if(m&&m.lightbar){ const f=Math.sin(this.t*12)>0; m.lightbar.red.color.setHex(f?0xff1030:0x300008); m.lightbar.blue.color.setHex(f?0x10103a:0x1a55ff); } }
    const st=this.stageFor(scr); const key=[scr,innerWidth,innerHeight,Math.round(st.x),Math.round(st.y),Math.round(st.w),Math.round(st.h),show?1:this.carIdx].join(',');
    if(key!==this.frameKey){ this.frameKey=key; this.frameCar(st,show); }
    // gentle idle drift: a few degrees of camera sway, never swinging the car behind the menu
    const a=Math.sin(this.t*0.26)*0.045, W=innerWidth,H=innerHeight; this.placeCam(this.fit.d*(1+0.012*Math.sin(this.t*0.19)),a);
    this.cam.setViewOffset(W,H,W/2-this.fit.cx,H/2-this.fit.cy,W,H); this.cam.updateProjectionMatrix();
    this.haze.forEach((h,k)=>{ h.position.x=h.userData.x0+Math.sin(this.t*0.05+k*2)*0.8; });
  }
  render(){ GFX.renderer.render(this.scene,this.cam,1.0,'garage'); }
}
// ---------------- UI (menus + HUD) ----------------
class UI{
  constructor(g){
    this.g=g; this.miniCtx=$('mini').getContext('2d'); this.touchMode();
    document.querySelectorAll('[data-act]').forEach(b=>b.addEventListener('click',()=>{ this.g.audio.init(); this.act(b.dataset.act); }));
    // start from the title on any kind of tap: pointer events, plain touch (older iOS / some in-app browsers) and click as a last resort
    const tStart=(e)=>{ if(this.g.screen!=='title') return; try{ this.g.onAnyInput(); }catch(err){ const el=$('err'); if(el){ el.style.display='block'; el.textContent='Error: '+(err&&err.message||err); } } };
    ['pointerdown','touchend','click'].forEach(ev=>$('title').addEventListener(ev,tStart,{passive:true}));
    $('diffSeg').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ this.g.sel.diff=b.dataset.d; this.g.audio.play('blip'); this.diffUI(); }));
    $('pauseBtn').addEventListener('click',()=>this.g.pause(true));
    // settings wiring
    document.querySelectorAll('#settings input[type=range], #controls input[type=range]').forEach(inp=>{ const k=inp.dataset.s; inp.value=g.S[k]; const lab=inp.nextElementSibling; lab.textContent=Math.round(g.S[k]*100);
      inp.addEventListener('input',()=>{ g.S[k]=+inp.value; lab.textContent=Math.round(g.S[k]*100); g.saveSettings(); }); });
    document.querySelectorAll('#settings .seg[data-t], #controls .seg[data-t]').forEach(seg=>{ const k=seg.dataset.t; seg.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ let v=b.dataset.v; if(k==='musicOn'||k==='shake'||k==='autogas') v=v==='1'; g.S[k]=v; g.audio.init(); g.audio.play('blip'); if(k==='quality') g.applyQuality(); g.saveSettings(); this.settingsUI(); })); });
    this.settingsUI(); this.buildTracks(); this.carDots(); g.online.onChange(()=>{ this.acctUI(); this.onlineHints(); if(g.screen==='trackSel') this.buildTracks(); }); this.acctUI(); this.onlineHints(); if(g.online.user) this.flushPending();
    if(g.online.user) g.online.verify().then(ok=>{ if(ok) this.checkUnlocks(); });
    document.querySelectorAll('#unlockModal [data-act]').forEach(b=>b.addEventListener('click',()=>{ this.g.audio.init(); }));
    this.lastItem=null; this.rollT=0;
    if('ontouchstart' in window) $('pressTxt').textContent='Tap to start';
  }
  error(e){ const el=$('err'); el.style.display='block'; el.textContent='Error: '+(e&&e.message||e); }
  guessMobile(){ return (('ontouchstart' in window)||navigator.maxTouchPoints>0)&&matchMedia('(pointer:coarse)').matches; }
  isMobile(){ const d=this.g.S.device; return d?d==='mobile':this.guessMobile(); }
  isTouch(){ return this.isMobile(); }
  touchMode(){ const S=this.g.S, b=document.body; b.classList.toggle('touch',this.isTouch()); b.classList.toggle('mobile',this.isMobile()); b.classList.toggle('autogas',!!S.autogas);
    b.classList.toggle('arrows',S.steerMode==='arrows'); b.classList.toggle('lefty',S.steerSide==='right'); ['s','m','l'].forEach(k=>b.classList.toggle('bs-'+k,(S.btnSize||'m')===k));
    const s=$('introSkip'); if(s) s.textContent=this.isMobile()?'TAP TO SKIP':'PRESS ANY KEY TO SKIP'; }
  touchVisible(on,preview){ $('touch').classList.toggle('on',!!on&&this.isTouch()); $('touch').classList.toggle('preview',!on&&!!preview&&this.isTouch()); if(!on&&this.g.input&&this.g.input.clearTouch) this.g.input.clearTouch(); }
  settingsUI(){ const S=this.g.S; const dl=$('devLabel'); if(dl) dl.textContent=(this.isMobile()?'📱 Phone':'💻 Computer')+' · change'; document.querySelectorAll('#settings input[type=range], #controls input[type=range]').forEach(inp=>{ inp.value=S[inp.dataset.s]; inp.nextElementSibling.textContent=Math.round(S[inp.dataset.s]*100); }); document.querySelectorAll('#settings .seg[data-t], #controls .seg[data-t]').forEach(seg=>{ const k=seg.dataset.t; seg.querySelectorAll('button').forEach(b=>{ let v=b.dataset.v; if(k==='musicOn'||k==='shake'||k==='autogas') v=v==='1'; b.classList.toggle('on',S[k]===v); }); }); }
  diffUI(){ $('diffSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.d===this.g.sel.diff)); this.onlineHints(); }
  items(){ if(this.modalOpen()) return [...document.querySelectorAll('#unlockModal .btn')]; return [...document.querySelectorAll('.screen.on .devCard, .screen.on .btn, .screen.on .tcard, .screen.on .arrow')].filter(b=>b.offsetParent!==null&&!b.classList.contains('arrow')); }
  refocus(){ const it=this.items(); it.forEach((b,k)=>b.classList.toggle('focus',k===this.g.focus)); const f=it[this.g.focus]; if(f&&f.closest('.mcol')&&f.scrollIntoView) try{ f.scrollIntoView({block:'nearest'}); }catch(e){} }
  enter(name){
    const g=this.g;
    if(name==='garage'){ g.garage.setCar(g.sel.vehicle); this.carInfo(); g.focus=1; }
    if(name==='trackSel'){ this.buildTracks(); this.diffUI(); g.focus=g.sel.track; }
    this.onlineHints();
    if(name==='records') this.records();
    if(name==='gpIntro'){ GP_TRACKS=rollGPTracks(GP_TRACKS); this.gpIntroUI(); }
    if(name==='account'){ this.acctUI(); $('acctMsg').textContent=''; if(!this.g.online.user) setTimeout(()=>{ if(!this.isTouch()) $('aUser').focus(); },50); }
    if(name==='boards'){ this.buildBoardTabs(); this.loadBoard(); }
    $('acctTag').style.display=name==='title'&&this.g.online.user?'block':'none';
    if(name==='settings'){ this.settingsUI(); document.querySelectorAll('#settings input[type=range]').forEach(inp=>{ inp.value=g.S[inp.dataset.s]; inp.nextElementSibling.textContent=Math.round(g.S[inp.dataset.s]*100); }); }
    if(name==='device'){ g.focus=this.guessMobile()?1:0; }
    if(name==='controls'){ this.settingsUI(); }
    if(name==='pause'){ $('pauseCtl').style.display=this.isMobile()?'':'none'; $('pauseTitle').textContent=g.race&&g.race.practice?'Practice paused':'Paused'; $('pauseRestart').firstElementChild.textContent=g.race&&g.race.practice?'Restart practice':'Restart race'; }
    if(name==='trackSel'){ $('diffRow').style.display=g.mode==='practice'?'none':''; const lk=trackLocked(TRACK_DATA[g.sel.track]); $('goBtn').firstElementChild.textContent=lk?'🔒 Create account to unlock':(g.mode==='practice'?'Start practice':'Start race'); }
    if(name==='menu' && this.unlockQueued){ this.unlockQueued=false; setTimeout(()=>this.showUnlock(),250); }
    const menuish=['menu','garage','trackSel','gpIntro','records','boards','account','howto','results'].includes(name);
    $('mGear').style.display=this.isMobile()&&menuish?'flex':'none';
    document.body.classList.toggle('inmenu',!['race','pause','loading'].includes(name)&&!(name==='controls'&&g.fromPause));
    this.touchVisible(name==='race',name==='controls'); document.body.classList.toggle('racing',['race','loading','pause'].includes(name)||(name==='controls'&&!!g.fromPause));
    $('pauseBtn').style.display=(name==='race'&&this.isTouch())?'block':'none';
  }
  menuEvents(ev){
    const g=this.g; if(!ev.length) return; const it=this.items(); const scr=g.screen;
    if(this.modalOpen()){ for(const e of ev){ if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab','KeyA','KeyD'].includes(e)){ g.focus=(g.focus+1)%it.length; g.audio.play('blip'); this.refocus(); }
        else if(e==='Enter'||e==='Space'||e==='NumpadEnter'){ const b=it[g.focus]; if(b) b.click(); } else if(e==='Escape'||e==='Backspace') this.act('unlockClose'); } return; }
    for(const e of ev){
      if(scr==='title'||scr==='loading') continue;
      if(scr==='garage'&&(e==='ArrowLeft'||e==='KeyA')){ this.act('prevCar'); continue; }
      if(scr==='garage'&&(e==='ArrowRight'||e==='KeyD')){ this.act('nextCar'); continue; }
      if(scr==='trackSel'&&(e==='ArrowUp'||e==='ArrowDown'||e==='KeyW'||e==='KeyS')){ this.selectTrack(g.sel.track+((e==='ArrowUp'||e==='KeyW')?-1:1)); continue; }
      if(scr==='trackSel'&&(e==='ArrowLeft'||e==='ArrowRight'||e==='KeyA'||e==='KeyD')){ const d=['easy','normal','hard']; let k=d.indexOf(g.sel.diff)+((e==='ArrowRight'||e==='KeyD')?1:-1); g.sel.diff=d[clamp(k,0,2)]; this.diffUI(); g.audio.play('blip'); continue; }
      if(scr==='trackSel'&&(e==='Enter'||e==='Space'||e==='NumpadEnter')){ this.act('go'); continue; }
      if(false){ const d=['easy','normal','hard']; let k=d.indexOf(g.sel.diff)+(e==='ArrowUp'?1:-1); g.sel.diff=d[clamp(k,0,2)]; this.diffUI(); g.audio.play('blip'); continue; }
      if(scr==='settings'&&(e==='ArrowLeft'||e==='ArrowRight')) continue;
      if(['ArrowDown','ArrowRight','KeyS','KeyD','Tab'].includes(e)){ g.focus=(g.focus+1)%it.length; g.audio.play('blip'); }
      else if(['ArrowUp','ArrowLeft','KeyW','KeyA'].includes(e)){ g.focus=(g.focus-1+it.length)%it.length; g.audio.play('blip'); }
      else if(e==='Enter'||e==='Space'||e==='NumpadEnter'){ const b=it[g.focus]; if(b){ if(b.classList.contains('tcard')){ g.sel.track=+b.dataset.i; g.audio.play('select'); this.act('go'); } else b.click(); } }
      else if(e==='Escape'||e==='Backspace'){ if(scr==='pause') this.act('resume'); else if(scr!=='menu'&&scr!=='results') this.act('back'); }
      else if(e==='PadStart'&&scr==='pause') this.act('resume');
      this.refocus();
    }
  }
  act(a){
    const g=this.g, au=g.audio;
    switch(a){
      case 'race': au.play('select'); g.mode='single'; g.gp=null; g.show('garage'); break;
      case 'practice': au.play('select'); g.mode='practice'; g.gp=null; g.show('garage'); break;
      case 'devPc': case 'devMob': g.S.device=a==='devMob'?'mobile':'pc'; g.saveSettings(); au.play('select'); if(a==='devMob') g.goLandscape(); g.show('menu'); break;
      case 'pickDevice': au.play('select'); g.show('device'); break;
      case 'controls': au.play('select'); g.fromPause=g.screen==='pause'; g.ctlFrom=g.screen; g.show('controls'); break;
      case 'ctlDone': au.play('back'); if(g.ctlFrom==='pause'&&g.race){ g.show('pause'); } else g.show(g.ctlFrom==='settings'?'settings':'menu'); break;
      case 'fullscreen': au.play('blip'); if(document.fullscreenElement) document.exitFullscreen().catch(()=>{}); else { g.S.fullscreen=true; g.goLandscape(); } break;
      case 'gp': au.play('select'); g.mode='gp'; g.gp=null; g.show('garage'); break;
      case 'gpBack': au.play('back'); g.show('garage'); break;
      case 'gpStart': au.play('select'); g.newGP(); break;
      case 'gpShuffle': au.play('blip'); GP_TRACKS=rollGPTracks(GP_TRACKS); this.gpIntroUI(); break;
      case 'gp_next': au.play('select'); g.startRace(); break;
      case 'gp_new': au.play('select'); g.endRace(); g.newGP(); break;
      case 'gp_quit': au.play('back'); g.gp=null; g.mode='single'; g.endRace(); g.show('menu'); break;
      case 'settings': au.play('select'); if(g.screen!=='controls') g.fromPause=g.screen==='pause'; g.show('settings'); break;
      case 'howto': au.play('select'); g.show('howto'); break;
      case 'records': au.play('select'); g.show('records'); break;
      case 'clearRec': TRACK_DATA.forEach(t=>Store.set('best_'+trackKey(t),{race:null,lap:null})); this.records(); au.play('back'); break;
      case 'back': au.play('back');
        if(g.screen==='settings'&&g.fromPause){ g.fromPause=false; g.show('pause'); break; }
        if(g.screen==='device'){ g.show('menu'); break; }
        g.show(g.screen==='trackSel'?'garage':'menu'); break;
      case 'prevCar': g.sel.vehicle=(g.sel.vehicle+VEHICLES.length-1)%VEHICLES.length; g.garage.setCar(g.sel.vehicle); this.carInfo(); au.play('blip'); break;
      case 'nextCar': g.sel.vehicle=(g.sel.vehicle+1)%VEHICLES.length; g.garage.setCar(g.sel.vehicle); this.carInfo(); au.play('blip'); break;
      case 'pickCar': au.play('select'); g.show(g.mode==='gp'?'gpIntro':'trackSel'); break;
      case 'go': au.play('select'); g.startRace(); break;
      case 'resume': au.play('select'); g.pause(false); break;
      case 'restart': au.play('select'); g.startRace(); break;
      case 'endPractice': au.play('back'); g.mode='single'; g.endRace(); g.show('menu'); break;
      case 'changeTrack': au.play('select'); g.gp=null; g.mode='single'; g.endRace(); g.show('trackSel'); break;
      case 'changeCar': au.play('select'); g.gp=null; g.mode='single'; g.endRace(); g.show('garage'); break;
      case 'quit': au.play('back'); g.gp=null; g.mode='single'; g.endRace(); g.show('menu'); break;
      case 'account': au.play('select'); g.show('account'); break;
      case 'boards': au.play('select'); g.show('boards'); break;
      case 'refreshBoards': au.play('blip'); this.loadBoard(); break;
      case 'login': case 'signup': this.doAuth(a); break;
      case 'unlockSignup': case 'unlockLogin': au.play('select'); this.fromLock=TRACK_DATA.findIndex(t=>t.id===UNLOCK_ID); g.show('account');
        { const m=$('acctMsg'); m.className='msg'; m.innerHTML=a==='unlockSignup'?`Pick a racer name and password, then press <b>Create account</b> to unlock <b>${esc(TRACK_DATA[this.fromLock].name)}</b>.`:`Log in to unlock <b>${esc(TRACK_DATA[this.fromLock].name)}</b>.`; } break;
      case 'unlockView': au.play('select'); this.hideUnlock(); g.gp=null; if(g.mode!=='practice') g.mode='single'; g.sel.track=TRACK_DATA.findIndex(t=>t.id===UNLOCK_ID); if(g.race) g.endRace(); g.show('trackSel'); this.selectTrack(g.sel.track); break;
      case 'unlockClose': au.play('back'); this.hideUnlock(); break;
      case 'logout': au.play('back'); g.online.logOut(); this.acctUI(); break;
    }
  }
  lockedPrompt(def){ const g=this.g; g.audio.play('back'); if(g.screen!=='trackSel'){ g.mode=g.mode==='practice'?'practice':'single'; g.show('trackSel'); }
    this.selectTrack(TRACK_DATA.indexOf(def)); const lb=$('lbHint'); if(lb){ lb.className='msg bad'; lb.innerHTML='🔒 <b>'+esc(def.name)+'</b> is for racer accounts. Create a free account (no email, no payment) or sign in to race it.'; } }
  // "New Map Unlocked": after a successful sign-up, and once per existing account on its next sign-in (acknowledged server-side per account)
  async checkUnlocks(){ const on=this.g.online; if(!on.hasAccess()) return; const seen=await on.isAcked(UNLOCK_ID); if(seen) return;
    if(['menu','account','trackSel','garage','records','boards'].includes(this.g.screen)) this.showUnlock(); else this.unlockQueued=true; }
  showUnlock(fresh){ const g=this.g, t=TRACK_DATA.find(x=>x.id===UNLOCK_ID); if(!t||!g.online.hasAccess()) return; const M=$('unlockModal'); if(!M) return;
    $('ulName').textContent=t.name; $('ulPlace').textContent=t.place; $('ulSub').textContent=fresh?'Thanks for joining Ryden\u2019s Racers. Your account unlocks the flagship track:':'Your racer account unlocks the new flagship track:';
    const cv=$('ulCanvas'); cv.width=960; cv.height=420; drawTrackPreview(cv,t,true,false); M.classList.add('on'); g.audio.play('final'); g.focus=0; this.refocus(); g.online.ack(UNLOCK_ID); }
  hideUnlock(){ const M=$('unlockModal'); if(M) M.classList.remove('on'); this.refocus(); if(this.g.screen==='trackSel') this.buildTracks(); }
  modalOpen(){ const M=$('unlockModal'); return !!(M&&M.classList.contains('on')); }
  acctUI(){ const u=this.g.online.user; $('acctIn').style.display=u?'none':'block'; $('acctOut').style.display=u?'block':'none'; $('acctName').textContent=u||'';
    $('acctBtn').firstElementChild.textContent=u?'Account':'Log in'; $('acctTag').innerHTML=u?'Racing as <b>'+u+'</b>':'';
    const ma=$('menuAcct'); if(ma) ma.innerHTML=u?'<i class="dot"></i>Racing as <b>'+esc(u)+'</b>':'<i class="dot off"></i>Not signed in · times save on this device'; }
  async doAuth(kind){
    const g=this.g, m=$('acctMsg'), u=$('aUser').value.trim(), p=$('aPass').value; if(this.busy) return; this.busy=true;
    m.className='msg'; m.textContent=kind==='signup'?'Creating account…':'Logging in…';
    try{ const name=kind==='signup'?await g.online.signUp(u,p):await g.online.logIn(u,p); $('aPass').value=''; g.audio.play('select'); this.acctUI(); m.textContent=(kind==='signup'?'Account created. ':'')+'Welcome, '+name+'!';
      const n=await this.flushPending(); if(n) m.textContent+=` Posted ${n} saved Hard ${n>1?'times':'time'} to the leaderboard.`;
      if(kind==='signup') this.showUnlock(true); else this.checkUnlocks(); }
    catch(e){ g.audio.play('back'); m.className='msg bad'; m.textContent=e.message; }
    this.busy=false;
  }
  async flushPending(){ const g=this.g; const pend=Store.get('pending',[]); if(!pend.length||!g.online.user) return 0; let n=0; const keep=[];
    for(const p of pend){ try{ await g.online.submit(p.track,p.car,p.race,p.lap); n++; }catch(e){ if(!/violates|check constraint/i.test(e.message)) keep.push(p); } }
    Store.set('pending',keep); return n; }
  onlineHints(){ const g=this.g, u=g.online.user; const jb=$('joinBanner'); if(jb) jb.style.display=u?'none':'flex';
    const lh=$('lbHint'); if(lh){ if(g.sel.diff!=='hard') lh.innerHTML='🏆 Online leaderboard counts <b>Hard</b> races only'; else if(!u) lh.innerHTML='🏆 Hard race: <b>log in</b> to post your time online (it’s saved until you do)'; else lh.innerHTML='✓ Hard race · your time will post to the online leaderboard as <b>'+esc(u)+'</b>'; } }
  buildBoardTabs(){ if(this.bSel==null) this.bSel={track:trackKey(TRACK_DATA[this.g.sel.track]),kind:'race'}; const el=$('bTracks');
    el.innerHTML=TRACK_DATA.map(t=>`<button data-t="${trackKey(t)}" class="${trackKey(t)===this.bSel.track?'on':''}">${t.name}</button>`).join('');
    el.querySelectorAll('button').forEach(b=>b.onclick=()=>{ this.bSel.track=b.dataset.t; this.g.audio.play('blip'); this.buildBoardTabs(); this.loadBoard(); });
    $('bKind').querySelectorAll('button').forEach(b=>{ b.classList.toggle('on',b.dataset.k===this.bSel.kind); b.onclick=()=>{ this.bSel.kind=b.dataset.k; this.g.audio.play('blip'); this.buildBoardTabs(); this.loadBoard(); }; }); }
  async loadBoard(){
    const {track,kind}=this.bSel||{track:'sweet',kind:'race'}, tb=$('bTable'), m=$('bMsg'), on=this.g.online; const req=this.boardReq=(this.boardReq||0)+1;
    tb.innerHTML=''; m.className='msg'; m.textContent='Loading…';
    try{ const rows=await on.board(track,kind,10); if(req!==this.boardReq) return;
      const carName=id=>(VEHICLES.find(v=>v.id===id)||{name:id}).name;
      tb.innerHTML=rows.map((r,k)=>`<tr class="${r.username===on.user?'me':''}"><td class="p">${k+1}</td><td>${esc(r.username)}</td><td style="color:var(--dim)">${carName(r.car)}</td><td class="t">${fmtTime(r.time_ms/1000)}</td></tr>`).join('');
      m.textContent=rows.length?'':'No times yet. Finish a race on Hard to set the first record!';
      if(on.user && !rows.some(r=>r.username===on.user)){ const mine=await on.myBest(track,kind); if(mine&&req===this.boardReq){ const rk=await on.rankOf(track,kind,mine.time_ms); m.innerHTML=`Your best: <b>${fmtTime(mine.time_ms/1000)}</b> in the ${carName(mine.car)} · rank #${rk}`; } }
    }catch(e){ if(req!==this.boardReq) return; m.className='msg bad'; m.textContent=e.message; }
  }
  gpIntroUI(){ const g=this.g; const series=g.gpSeries||'classic', TR=gpSeriesTracks(series), EL=gpElim(TR.length); const sizes=[8]; EL.forEach((k,i)=>sizes.push(sizes[i]-k));
    $('gpTitle').textContent=series==='marathon'?'Marathon Grand Prix':'Grand Prix';
    $('gpHint').textContent=(series==='marathon'?'The 20-lap tracks back to back, '+GP_LAPS_LONG+' laps each':TR.length+' random tracks back to back')+' · the slowest racers are knocked out after each race · from race 2 you start where you finished';
    $('gpSeries').querySelectorAll('button').forEach(b=>{ b.classList.toggle('on',b.dataset.s===series); b.onclick=()=>{ g.gpSeries=b.dataset.s; g.audio.play('blip'); this.gpIntroUI(); }; });
    const sh=document.querySelector('[data-act="gpShuffle"]'); if(sh) sh.style.display=series==='marathon'?'none':'';
    $('gpRounds').style.gridTemplateColumns='repeat('+Math.max(1,TR.length)+',minmax(0,1fr))';
    $('gpRounds').innerHTML=TR.map((id,i)=>{ const t=TRACK_DATA.find(x=>x.id===id); return `<div class="gpr"><div class="n">Race ${i+1}${i===TR.length-1?' · Final':''}</div><canvas width="300" height="240"></canvas><h3>${t.name}</h3><div class="f">${gpLapsFor(t)} laps · ${sizes[i]} racers${i<EL.length?(EL[i]?' · '+EL[i]+' knocked out':''):' · winner takes all'}</div></div>`; }).join('');
    $('gpRounds').querySelectorAll('canvas').forEach((cv,i)=>drawTrackThumb(cv,TRACK_DATA.find(x=>x.id===TR[i])));
    $('gpDiff').querySelectorAll('button').forEach(b=>{ b.classList.toggle('on',b.dataset.d===g.sel.diff); b.onclick=()=>{ g.sel.diff=b.dataset.d; g.audio.play('blip'); this.gpIntroUI(); }; }); }
  carDots(){ $('carDots').innerHTML=VEHICLES.map(()=>'<b></b>').join(''); }
  carInfo(){
    const v=VEHICLES[this.g.sel.vehicle], s=v.stats;
    const bars=[['Speed',s.speed],['Accel',s.accel],['Handling',s.handling],['Drift',s.drift],['Weight',s.weight]].map(([n,x])=>`<div class="stat"><span>${n}</span><div class="bar"><i style="width:${x*10}%"></i></div></div>`).join('');
    $('carInfo').innerHTML=`<div class="cls">${v.cls} · Driver: ${v.driver}${v.allTerrain?' · <b style="color:#ffc23d">ALL-TERRAIN</b>':''}</div><h2>${v.name}</h2><div class="tag">${v.tag}</div><div class="desc">${v.desc}</div><div style="margin-top:12px">${bars}</div>`;
    [...$('carDots').children].forEach((d,k)=>d.classList.toggle('on',k===this.g.sel.vehicle));
  }
  buildTracks(){
    const el=$('tList'); el.innerHTML='';
    TRACK_DATA.forEach((t,i)=>{ const b=Store.get('best_'+trackKey(t),{});
      const d=document.createElement('div'); d.className='tcard'; d.dataset.i=i;
      const lk=trackLocked(t); if(t.account) d.classList.add('acct'); if(lk) d.classList.add('locked');
      d.innerHTML=`<canvas width="144" height="108"></canvas><div><h3>${esc(t.name)}</h3><div class="pl">${t.place}</div><div class="rec">${lk?'🔒 CREATE AN ACCOUNT TO UNLOCK':(t.account?'★ ACCOUNT EXCLUSIVE · ':'')+(lk?'':`RACE ${fmtTime(b.race)} · LAP ${fmtTime(b.lap)}`)}</div></div>${lk?'<i class="lock">🔒</i>':''}`;
      d.addEventListener('click',()=>{ if(this.g.sel.track===i && ((this.lastTap && performance.now()-this.lastTap<450)||(this.isMobile()&&this.lastTap))){ this.act('go'); return; } this.lastTap=performance.now(); this.selectTrack(i); });
      el.appendChild(d); if(t.account) drawTrackPreview(d.querySelector('canvas'),t); else drawTrackThumb(d.querySelector('canvas'),t); });
    this.markTrack();
  }
  selectTrack(i){ const g=this.g; g.sel.track=clamp(i,0,TRACK_DATA.length-1); g.focus=g.sel.track; g.audio.play('blip'); this.markTrack(); this.refocus(); const c=$('tList').children[g.sel.track]; if(c&&c.scrollIntoView) c.scrollIntoView({block:'nearest'}); }
  markTrack(){ const g=this.g, t=TRACK_DATA[g.sel.track]; document.querySelectorAll('#tList .tcard').forEach((c,k)=>c.classList.toggle('sel',k===g.sel.track));
    const cv=$('tBig'); if(cv.clientWidth){ cv.width=Math.round(cv.clientWidth*Math.min(2,devicePixelRatio||1)); cv.height=Math.round(cv.clientHeight*Math.min(2,devicePixelRatio||1)); } if(t.account) drawTrackPreview(cv,t,true); else drawTrackThumb(cv,t);
    const lk=trackLocked(t); $('goBtn').firstElementChild.textContent=lk?'🔒 Create account to unlock':(g.mode==='practice'?'Start practice':'Start race'); $('goBtn').classList.toggle('lockgo',lk);
    if(lk){ $('tInfo').innerHTML=`<h2>${esc(t.name)}<span class="badge" style="background:var(--gold);color:#1a1000">ACCOUNT EXCLUSIVE</span></h2><div class="pl">${t.place}</div><p>${t.blurb}</p>
      <div class="lockBox"><b>🔒 Locked for guests.</b> Create a free Ryden's Racers account to unlock the flagship track. No email or payment needed.<div class="row" style="margin-top:10px;justify-content:flex-start"><div class="btn small gold" data-lk="signup"><span>Create an account to unlock</span></div><div class="btn small" data-lk="login"><span>Sign in</span></div></div></div>`;
      $('tInfo').querySelectorAll('[data-lk]').forEach(b=>b.addEventListener('click',()=>{ g.audio.init(); this.act(b.dataset.lk==='signup'?'unlockSignup':'unlockLogin'); })); return; } const b=Store.get('best_'+trackKey(t),{}); const P=t._len||(t._len=Math.round(buildTrackPath(t).L));
    const feats=[]; if((t.jumps||[]).length) feats.push((t.jumps||[]).length+' jump'+((t.jumps||[]).length>1?'s':'')); if((t.tunnels||[]).length) feats.push(t.id==='country'?'covered bridge':'tunnel'); if(t.shooters) feats.push('hot blocks'); if(t.monument) feats.push('Red Solo Cup roundabout');
    const badge=t.hard?'<span class="badge" style="background:#ff3b3b;color:#fff">HARDEST</span>':t.id==='country'?'<span class="badge" style="background:var(--gold);color:#1a1000">NEW</span>':'';
    $('tInfo').innerHTML=`<h2>${t.name}${badge}</h2><div class="pl">${t.place}</div><p>${t.blurb}</p>${t.note?`<p class="hint" style="text-align:left;margin:4px 0 8px;text-transform:none;letter-spacing:.02em;color:#ffd23f">${t.note}</p>`:''}<div class="stats"><span>Length <b>${(P/1000).toFixed(2)} km</b></span><span>Laps <b>${t.laps}</b></span>${feats.length?`<span>${feats.join(' · ')}</span>`:''}</div><div class="stats" style="margin-top:6px"><span>Best race <b>${fmtTime(b.race)}</b></span><span>Best lap <b>${fmtTime(b.lap)}</b></span></div>`; }
  records(){
    $('recList').innerHTML=TRACK_DATA.map(t=>{ const b=Store.get('best_'+trackKey(t),{}); return `<div style="display:flex;justify-content:space-between;gap:10px;padding:10px 4px;border-bottom:1px solid rgba(255,255,255,.08)"><div><div style="font-family:var(--disp);font-size:20px;font-style:italic">${t.name}</div><div class="hint" style="margin:0;text-align:left">${t.place}${t.rev>1?' · new layout':''}</div>${(()=>{ if(!(t.rev>1)) return ''; const o=Store.get('best_'+t.id,{}); return (o.race!=null||o.lap!=null)?`<div class="hint" style="margin:2px 0 0;text-align:left;letter-spacing:.06em;text-transform:none">Original layout: race ${fmtTime(o.race)} · lap ${fmtTime(o.lap)}</div>`:''; })()}</div><div style="text-align:right;font-size:13px;letter-spacing:.06em"><div>RACE <b style="color:var(--gold)">${fmtTime(b.race)}</b> <span style="color:var(--dim)">${b.raceCar||''}</span></div><div>LAP <b style="color:var(--cyan)">${fmtTime(b.lap)}</b> <span style="color:var(--dim)">${b.lapCar||''}</span></div></div></div>`; }).join('');
  }
  // ---------- race HUD ----------
  raceStart(R){ $('miniName').textContent=R.def.name; $('icName').textContent=R.def.name; $('icPlace').textContent=R.def.place; this.introCard(true); $('hUnit').textContent=this.g.S.units==='mph'?'MPH':'KM/H';
    const m=R.mini; const pad=18, W=340; const sc=(W-pad*2)/Math.max(m.maxx-m.minx,m.maxz-m.minz); this.miniT={sc,ox:W/2-(m.minx+m.maxx)/2*sc,oz:W/2+(m.minz+m.maxz)/2*sc};
    const P=R.P; const path=new Path2D(); let pen=false; for(let i=0;i<=P.N;i+=2){ const k=i%P.N; if(P.hidden[k]){ pen=false; continue; } const x=this.miniT.ox+P.x[k]*sc, y=this.miniT.oz-P.z[k]*sc; pen?path.lineTo(x,y):path.moveTo(x,y); pen=true; } if(!R.route) path.closePath(); this.miniPath=path;
    this.lastItem=undefined; this.lastPos=0; }
  introCard(on){ $('introCard').style.display=on?'block':'none'; }
  count(t){ const c=$('count'); c.textContent=t; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); c.style.color=t==='GO!'?'#7dff9a':'#fff'; }
  flash(t,col,dur){ const f=$('flash'); f.textContent=t; f.style.color=col||'#fff'; f.style.animationDuration=(dur||1.6)+'s'; f.classList.remove('pop'); void f.offsetWidth; f.classList.add('pop'); }
  wrong(on){ const w=$('wrong'); const d=on?'block':'none'; if(w.style.display!==d){ w.style.display=d; if(on) this.g.audio.play('wrong'); } }
  roulette(){ this.rollT=1.0; }
  chapter(label,year){ const el=$('chapterTag'); if(!el||!label) return; el.innerHTML=`<b>${esc(label)}</b><span>${esc(year||'')}</span>`; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); }
  portal(){ const f=$('portalFx'); if(!f) return; f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
  hud(R){
    const c=R.player; const rank=c.finished?c.finishPos:c.rank;
    if(rank!==this.lastPos){ $('hPos').innerHTML=`${rank}<sup>${ordSuffix(rank)}</sup><small>/${R.cars.length}</small>`; this.lastPos=rank; }
    $('hLap').innerHTML=R.practice?`LAP ${Math.max(1,c.lap)}<span> PRACTICE</span>`:`LAP ${clamp(c.lap,1,R.laps)}<span>/${R.laps}${R.route&&c.cp===0&&!c.finished?' · OPENING':''}</span>`;
    const rt=R.state==='race'||R.state==='finish'||R.state==='done'?(c.finished?c.finishTime:R.raceTime):0;
    $('hTime').textContent=fmtTime(rt); $('hLapT').textContent=fmtTime(c.lap>=1&&!c.finished?R.raceTime-c.lapStart:(c.lapTimes[c.lapTimes.length-1]||0)); $('hBest').textContent=fmtTime(c.bestLap!=null?c.bestLap:R.best.lap);
    const sp=c.speed*(this.g.S.units==='mph'?2.237:3.6); $('hSpd').textContent=Math.round(sp);
    const sorted=R.cars.slice().sort((a,b)=>(a.finished?a.finishPos:a.rank)-(b.finished?b.finishPos:b.rank));
    $('board').innerHTML=sorted.map(o=>`<div class="${o.isPlayer?'me':''}"><b>${o.finished?o.finishPos:o.rank}</b>${o.isPlayer?'YOU':o.driver} · ${o.v.name}</div>`).join('');
    // item
    let icon='',nm='';
    if(this.rollT>0){ this.rollT-=1/15; const ks=Object.keys(ITEMS); const k=ks[Math.floor(Math.random()*3)]; icon=ITEMS[k].icon; nm='. . .'; this.g.audio.play('roll'); $('itemBox').style.borderColor='#fff'; }
    else if(c.item){ icon=ITEMS[c.item].icon; nm=ITEMS[c.item].name; $('itemBox').style.borderColor=ITEMS[c.item].col; $('hItem').style.color=ITEMS[c.item].col; }
    else { $('itemBox').style.borderColor='rgba(255,255,255,.35)'; }
    $('hItem').textContent=icon; $('hItemN').textContent=nm;
    const hb=$('hBuff'); if(c.mudT>0){ hb.style.display='block'; hb.textContent='🛞 MUD TIRES '+c.mudT.toFixed(1)+'s'; } else hb.style.display='none';
    // drift / boost meter
    const bar=$('boostBar').firstElementChild;
    if(c.boost>0){ bar.style.width=clamp(c.boost/Math.max(0.5,c.boostMax),0,1)*100+'%'; bar.style.background='linear-gradient(90deg,#ffc23d,#ff2e97)'; $('boostLbl').textContent='BOOST'; }
    else if(c.drifting){ const t=c.driftT; bar.style.width=clamp(t/DRIFT_TIERS[2],0,1)*100+'%'; const cc=c.tier>=0?TIER_COL[c.tier].map(x=>Math.round(x*255)).join(','):'200,200,220'; bar.style.background=`rgb(${cc})`; $('boostLbl').textContent=c.tier>=0?['DRIFT · BLUE','DRIFT · ORANGE','DRIFT · PINK!'][c.tier]:'DRIFT'; }
    else { bar.style.width='0%'; $('boostLbl').textContent='DRIFT'; }
  }
  minimap(R){
    const g=this.miniCtx, T=this.miniT; if(!T) return; g.clearRect(0,0,340,340);
    g.save(); g.beginPath(); g.arc(170,170,168,0,TAU); g.clip();
    g.lineJoin='round'; g.strokeStyle='rgba(255,255,255,.18)'; g.lineWidth=16; g.stroke(this.miniPath); g.strokeStyle='#e8e0ff'; g.lineWidth=6; g.stroke(this.miniPath);
    if(R.shooters){ g.strokeStyle='rgba(255,59,59,.85)'; g.lineWidth=10; for(const z of R.shooters.zones){ g.beginPath(); for(let q=0;q<=22;q+=2){ const k=(z.i0+q)%R.P.N; const x=T.ox+R.P.x[k]*T.sc, y=T.oz-R.P.z[k]*T.sc; q?g.lineTo(x,y):g.moveTo(x,y);} g.stroke(); } }
    const P=R.P; g.fillStyle='#fff'; const s0=R.route?R.route.york:0; const sx=T.ox+P.x[s0]*T.sc, sy=T.oz-P.z[s0]*T.sc; g.fillRect(sx-7,sy-3,14,6);
    const cols=['#ffc23d','#ff6b3d','#7dff6a','#b18cff','#22e4ff','#ff4fb0','#ffffff','#ff3b3b'];
    for(const c of R.cars){ if(c.isPlayer) continue; g.fillStyle=cols[VEHICLES.indexOf(c.v)%8]; g.beginPath(); g.arc(T.ox+c.x*T.sc,T.oz-c.z*T.sc,8,0,TAU); g.fill(); g.strokeStyle='#000'; g.lineWidth=2; g.stroke(); }
    const p=R.player, px=T.ox+p.x*T.sc, py=T.oz-p.z*T.sc; g.translate(px,py); g.rotate(-p.h+Math.PI); 
    g.fillStyle='#ff2e97'; g.strokeStyle='#fff'; g.lineWidth=3; g.beginPath(); g.moveTo(0,-15); g.lineTo(10,11); g.lineTo(0,5); g.lineTo(-10,11); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }
  results(res){
    const pl=res.place; $('resPlace').textContent=ordinal(pl)+(pl===1?' — WINNER!':pl<=3?' — PODIUM!':' PLACE');
    $('resTrack').textContent=res.track.name+' · '+res.track.place;
    let rec=''; if(res.newRace) rec+='<div class="rec">★ New best race time '+fmtTime(res.best.race)+'</div>'; if(res.newLap) rec+='<div class="rec">★ New best lap '+fmtTime(res.best.lap)+'</div>';
    if(!rec) rec=`<div class="rec" style="color:var(--dim)">Your time ${fmtTime(res.playerTime)} · best lap ${fmtTime(res.playerBest)} · record ${fmtTime(res.best.race)}</div>`;
    $('resRec').innerHTML=rec;
    $('resTable').innerHTML=res.rows.map(r=>`<tr class="${r.player?'me':''}"><td class="p">${r.pos}</td><td>${r.player?'<b>YOU</b>':r.driver}</td><td style="color:var(--dim)">${r.car}</td><td class="t">${r.est?'<span style="color:var(--dim)">~</span>':''}${fmtTime(r.time)}</td><td class="t" style="color:var(--dim)">${r.best?'lap '+fmtTime(r.best):''}</td></tr>`).join('');
  }
}
const GP_ELIM=[2,1,1], GP_LEN=4;
// Grand Prix series. classic: 4 random tracks. marathon: every 20-lap track, in list order, cut to 10 laps each (new 20-lap
// tracks join automatically). Every series ends with a 4-car final: gpElim(n) = how many are knocked out after each race.
const GP_LAPS_LONG=10;
function gpElim(n){ return n<=1?[]:n===2?[4]:n===3?[2,2]:n===4?[2,1,1]:[1,1,1,1].concat(new Array(Math.max(0,n-5)).fill(0)); }
function gpSeriesTracks(series){ return series==='marathon'?TRACK_DATA.filter(t=>t.laps>=20&&!trackLocked(t)).map(t=>t.id):GP_TRACKS.slice(); }
function gpLapsFor(def){ return def.laps>=20?GP_LAPS_LONG:def.laps; }
function rollGPTracks(prev){ const ids=TRACK_DATA.filter(t=>!trackLocked(t)&&t.gp!==false).map(t=>t.id); let pick;
  for(let tries=0;tries<20;tries++){ const a=ids.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } pick=a.slice(0,GP_LEN); if(!prev||pick.join()!==prev.join()) break; }
  return pick; }
let GP_TRACKS=rollGPTracks();
function esc(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function drawTrackThumb(cv,def){
  const g=cv.getContext('2d'), w=cv.width,h=cv.height;
  const th=THEMES[def.theme]; const bgs={revolution:['#ffd6a8','#2d4f86'],country:['#ffc98a','#4f7fc4'],dusk:['#ff9a6a','#2c2f78'],city:['#f5c98a','#3f86d8'],desert:['#f0b27a','#c2562a'],coast:['#ffbe86','#1c5a8a'],night:['#3d1656','#05041a'],space:['#5a1a8a','#05010f'],oval:['#ffc48a','#3a74c8'],rally:['#b89a6a','#2f4a2a']}[def.sky||def.theme];
  const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,bgs[1]); gr.addColorStop(1,bgs[0]); g.fillStyle=gr; g.fillRect(0,0,w,h);
  if(!def._thumb){ const P=buildTrackPath(def); def._thumb={x:Array.from(P.x),z:Array.from(P.z),y:Array.from(P.y),h:Array.from(P.hidden),s0:P.route?P.route.york:0}; }
  const T=def._thumb; let a=1e9,b=-1e9,c=1e9,d=-1e9; T.x.forEach((x,i)=>{a=Math.min(a,x);b=Math.max(b,x);c=Math.min(c,T.z[i]);d=Math.max(d,T.z[i]);});
  const sc=Math.min((w-40)/(b-a),(h-40)/(d-c)); const ox=w/2-(a+b)/2*sc, oz=h/2+(c+d)/2*sc;
  g.lineJoin='round'; g.beginPath(); let pen=false; T.x.forEach((x,i)=>{ if(T.h&&T.h[i]){ pen=false; return; } const px=ox+x*sc, py=oz-T.z[i]*sc; pen?g.lineTo(px,py):g.moveTo(px,py); pen=true; }); if(!(T.h&&T.h.some(v=>v))) g.closePath();
  g.strokeStyle='rgba(0,0,0,.45)'; g.lineWidth=12; g.stroke(); g.strokeStyle='#fff'; g.lineWidth=6; g.stroke(); g.strokeStyle=def.theme==='night'?'#ff2e97':'#ff2e97'; g.lineWidth=2; g.stroke();
  g.fillStyle='#22e4ff'; g.beginPath(); g.arc(ox+T.x[T.s0||0]*sc,oz-T.z[T.s0||0]*sc,6,0,TAU); g.fill();
}
// account-track preview: a real in-game screenshot (img/<id>_preview.jpg) with the title treatment; falls back to the map outline
const PREVIEW_IMG={};
function drawTrackPreview(cv,def,big,title){
  const g=cv.getContext('2d'), w=cv.width, h=cv.height; let im=PREVIEW_IMG[def.id];
  if(!im){ im=PREVIEW_IMG[def.id]=new Image(); im.onload=()=>{ document.querySelectorAll('canvas[data-prev="'+def.id+'"]').forEach(c=>drawTrackPreview(c,def,c.dataset.big==='1',c.dataset.title==='1')); }; im.src='img/'+def.id+'_preview.jpg?v=1'; }
  cv.dataset.prev=def.id; cv.dataset.big=big?'1':'0'; cv.dataset.title=title?'1':'0';
  if(im.complete&&im.naturalWidth){ const s=Math.max(w/im.naturalWidth,h/im.naturalHeight); const dw=im.naturalWidth*s, dh=im.naturalHeight*s; g.drawImage(im,(w-dw)/2,(h-dh)/2,dw,dh); } else drawTrackThumb(cv,def);
  const lk=trackLocked(def);
  const gr=g.createLinearGradient(0,h*0.45,0,h); gr.addColorStop(0,'rgba(8,2,20,0)'); gr.addColorStop(1,'rgba(8,2,20,'+(lk?0.85:0.6)+')'); g.fillStyle=gr; g.fillRect(0,0,w,h);
  if(lk){ g.fillStyle='rgba(8,2,20,.28)'; g.fillRect(0,0,w,h); }
  if(big||title){ g.textAlign='left'; g.fillStyle='#ffd23f'; g.font='bold '+Math.round(h*0.05)+'px "Chakra Petch", sans-serif'; g.fillText((lk?'🔒 ':'★ ')+'ACCOUNT EXCLUSIVE', w*0.04, h*0.86); }
  if(title){ g.fillStyle='#fff'; g.font='italic '+Math.round(h*0.1)+'px "Racing Sans One", Impact, sans-serif'; g.fillText(def.name, w*0.04, h*0.8); }
}
// boot
window.addEventListener('load',()=>{
  if(typeof THREE==='undefined'){ document.body.innerHTML='<div style="color:#fff;font-family:sans-serif;padding:40px">Could not load the 3D engine (three.js) from cdnjs.cloudflare.com. Check your internet connection and reload.</div>'; return; }
  const pt=document.getElementById('pressTxt'); const keep=pt.textContent; pt.textContent='Loading cars…';
  // the showroom and the showcase GT40 load first so the menu is usable right away; the other cars stream in behind it
  const FIRST=['showroom',SHOWCASE_CAR_ID].filter(id=>GLB_DATA[id]); const REST=Object.keys(GLB_DATA).filter(id=>!PROP_IDS.has(id)&&!FIRST.includes(id));
  window.CARS_READY=false; window.CARS_WAIT=[];
  const carsDone=()=>{ window.CARS_READY=true; const bl=document.getElementById('bootLoad'); if(bl) bl.style.display='none'; const w=window.CARS_WAIT; window.CARS_WAIT=[]; w.forEach(f=>{ try{ f(); }catch(e){ console.error(e); } });
    if(GLB_ERROR){ const el=document.getElementById('err'); el.style.display='block'; el.textContent='Some custom car models could not load ('+GLB_ERROR+'), using fallback cars.'; } };
  loadCarGLBs(()=>{ pt.textContent=keep; try{ window.GAME=new Game(); GFX.perf.init(); GFX.bench.maybeStart(); }catch(e){ const el=document.getElementById('err'); el.style.display='block'; el.textContent='Startup error: '+e.message; console.error(e); return; }
    const bl=document.getElementById('bootLoad'); loadCarGLBs(carsDone,(a,b)=>{ if(bl){ bl.style.display='block'; bl.textContent='Loading cars '+a+'/'+b; } },REST); },(a,b)=>{ pt.textContent='Loading showroom… '+a+'/'+b; },FIRST);
  return;
  try{ window.GAME=new Game(); }catch(e){ const el=document.getElementById('err'); el.style.display='block'; el.textContent='Startup error: '+e.message; console.error(e); }
});
window.addEventListener('error',e=>{ const el=document.getElementById('err'); if(el){ el.style.display='block'; el.textContent='Error: '+e.message; } });
