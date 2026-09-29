// Ryden's Racers · Graphics V2 · Road decals
// -----------------------------------------------------------------------------------------------
// Lightweight projected detail for road surfaces: strips of quads that follow the track centreline and
// sit on the actual road mesh (GFX.road.surface), textured from one generated atlas. All decals of a
// track merge into two meshes (matte + glossy), so a whole lap of cracks, patches, tar snakes, oil,
// braking marks, dirt and edge grit costs 2 draw calls and a few thousand triangles.
//
// Placement is deliberate, not random scatter: braking marks and oil where the racing line brakes for a
// tight corner, dirt on the outside of corner exits, patches and sealed cracks spread along the lap in the
// lanes, grit along both edges. Seeded per track, so every run looks the same.
//
// Atlas cells (4x4, 256 px): 0 crack · 1 crack network · 2 tar snake · 3 patch · 4 oil · 5 braking marks ·
// 6 dirt smear · 7 gravel spill · 8 edge grit · 9 faded arrow · 10 sand drift · 11 faded repair patch ·
// 12 sealed transverse crack · 13 utility cover · 14 patched pothole · 15 lane oil drips. Add a kind = add a cell + a draw function. Per look (L.decals): spacing of each
// kind, and tints (grit, dirt) multiplied through the vertex colour so one atlas serves every climate.
(function(){
  let ATLAS=null;
  function atlas(){ if(ATLAS) return ATLAS; const S=1024, C=256; const cv=document.createElement('canvas'); cv.width=cv.height=S; const g=cv.getContext('2d');
    let sd=4242; const r=()=>{ sd=(sd*16807)%2147483647; return (sd-1)/2147483646; };
    const cell=(k,fn)=>{ g.save(); g.translate((k%4)*C,Math.floor(k/4)*C); g.beginPath(); g.rect(0,0,C,C); g.clip(); fn(); g.restore(); };
    const crackPath=(x,y,len,ang,w,col)=>{ g.strokeStyle=col; g.lineWidth=w; g.lineCap='round'; g.beginPath(); g.moveTo(x,y); let a=ang; for(let s=0;s<len;s+=6){ a+=(r()-0.5)*0.7; x+=Math.cos(a)*6; y+=Math.sin(a)*6; g.lineTo(x,y); if(r()<0.06) crackPath(x,y,len*0.3,a+(r()<0.5?1:-1)*(0.6+r()),w*0.6,col); } g.stroke(); };
    cell(0,()=>{ crackPath(128,6,250,Math.PI/2,2.4,'rgba(8,8,8,0.85)'); });
    cell(1,()=>{ for(let k=0;k<26;k++) crackPath(40+r()*176,20+r()*216,40+r()*60,r()*6.28,1.6,'rgba(10,10,10,0.7)'); });
    cell(2,()=>{ g.strokeStyle='rgba(5,5,6,0.92)'; g.lineWidth=7; g.lineJoin='round'; g.beginPath(); let x=128; g.moveTo(x,0); for(let y=0;y<=256;y+=8){ x+=(r()-0.5)*14; x=Math.max(60,Math.min(196,x)); g.lineTo(x,y); } g.stroke(); });
    cell(3,()=>{ g.fillStyle='rgba(30,30,32,0.7)'; g.fillRect(20,12,216,232); for(let k=0;k<900;k++){ g.fillStyle=`rgba(${r()<0.5?'0,0,0':'90,90,90'},${r()*0.25})`; g.fillRect(20+r()*214,12+r()*230,2,2); }
      g.strokeStyle='rgba(8,8,8,0.9)'; g.lineWidth=5; g.strokeRect(20,12,216,232); });
    cell(4,()=>{ for(let k=0;k<5;k++){ const x=70+r()*116, y=60+r()*136, rr=30+r()*50; const gr=g.createRadialGradient(x,y,2,x,y,rr); gr.addColorStop(0,'rgba(4,4,6,0.6)'); gr.addColorStop(0.6,'rgba(8,8,10,0.28)'); gr.addColorStop(1,'rgba(8,8,10,0)'); g.fillStyle=gr; g.beginPath(); g.ellipse(x,y,rr*0.7,rr,r(),0,6.28); g.fill(); } });
    cell(5,()=>{ [72,184].forEach(x=>{ const gr=g.createLinearGradient(0,0,0,256); gr.addColorStop(0,'rgba(0,0,0,0)'); gr.addColorStop(0.15,'rgba(6,6,6,0.55)'); gr.addColorStop(0.85,'rgba(6,6,6,0.7)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x-22,0,44,256);
      for(let k=0;k<40;k++){ g.fillStyle='rgba(0,0,0,0.12)'; g.fillRect(x-22+r()*44,0,1.5,256); } }); });
    cell(6,()=>{ for(let k=0;k<60;k++){ const x=20+r()*216, y=10+r()*236, rr=10+r()*34; const gr=g.createRadialGradient(x,y,1,x,y,rr); gr.addColorStop(0,'rgba(120,96,64,0.35)'); gr.addColorStop(1,'rgba(120,96,64,0)'); g.fillStyle=gr; g.beginPath(); g.arc(x,y,rr,0,6.28); g.fill(); } });
    cell(7,()=>{ for(let k=0;k<1400;k++){ const y=r()*256, x=r()*256, sz=1+r()*3.5, c=110+r()*80; g.fillStyle=`rgba(${c},${c*0.92|0},${c*0.8|0},${0.35+r()*0.5})`; g.fillRect(x,y,sz,sz); } });
    cell(8,()=>{ const gr=g.createLinearGradient(0,0,256,0); gr.addColorStop(0,'rgba(128,112,90,0)'); gr.addColorStop(0.55,'rgba(128,112,90,0.35)'); gr.addColorStop(0.85,'rgba(118,104,84,0.55)'); gr.addColorStop(1,'rgba(118,104,84,0.25)'); g.fillStyle=gr; g.fillRect(0,0,256,256);
      for(let k=0;k<2200;k++){ const x=Math.pow(r(),0.5)*256, y=r()*256, c=90+r()*90; g.fillStyle=`rgba(${c},${c*0.9|0},${c*0.78|0},${(x/256)*0.8*r()})`; g.fillRect(x,y,1+r()*2.5,1+r()*2.5); } });
    cell(9,()=>{ g.fillStyle='rgba(235,235,225,0.55)'; g.beginPath(); g.moveTo(128,20); g.lineTo(200,110); g.lineTo(152,110); g.lineTo(152,236); g.lineTo(104,236); g.lineTo(104,110); g.lineTo(56,110); g.closePath(); g.fill();
      g.globalCompositeOperation='destination-out'; for(let k=0;k<500;k++){ g.fillStyle=`rgba(0,0,0,${r()*0.8})`; g.fillRect(r()*256,r()*256,2+r()*6,2+r()*6); } g.globalCompositeOperation='source-over'; });
    // 10 sand drift: dense at the outer edge (u=1), wind ripples, ragged tongue edge towards the lane
    cell(10,()=>{ for(let y=0;y<256;y+=2){ const reach=150+70*Math.sin(y*0.045+r()*0.4)+30*Math.sin(y*0.13); for(let x=0;x<256;x+=2){ const d=(256-x)/reach; if(d>1.15) continue;
        const a=Math.max(0,Math.min(1,1.15-d))*(0.55+0.3*Math.sin((x*0.35+y*0.9)+Math.sin(y*0.07)*3)); const c=200+r()*30; g.fillStyle=`rgba(${c},${c*0.86|0},${c*0.66|0},${a*0.8})`; g.fillRect(x,y,2,2); } } });
    // 11 old repair patch, sun-faded: lighter than the road, crisp sawn edges
    cell(11,()=>{ g.fillStyle='rgba(150,146,140,0.55)'; g.fillRect(16,16,224,224); for(let k=0;k<1400;k++){ const c=r()<0.5?90:190; g.fillStyle=`rgba(${c},${c},${c-6},${r()*0.22})`; g.fillRect(16+r()*222,16+r()*222,2,2); }
      g.strokeStyle='rgba(20,20,20,0.7)'; g.lineWidth=3; g.strokeRect(16,16,224,224); });
    // 12 transverse thermal crack, tar-sealed (u = across the road): a wavy band over the full width
    cell(12,()=>{ g.strokeStyle='rgba(6,6,7,0.9)'; g.lineWidth=16; g.lineCap='round'; g.beginPath(); let y=128; g.moveTo(0,y); for(let x=0;x<=256;x+=8){ y+=(r()-0.5)*10; y=Math.max(100,Math.min(156,y)); g.lineTo(x,y); } g.stroke();
      g.strokeStyle='rgba(2,2,2,0.95)'; g.lineWidth=3; g.stroke(); });
    // 13 manhole / utility cover: cast-iron disc with a raised grid and a rust ring
    cell(13,()=>{ const c=128, R=92; g.fillStyle='rgba(28,27,26,0.95)'; g.beginPath(); g.arc(c,c,R,0,6.28); g.fill(); g.strokeStyle='rgba(95,70,48,0.8)'; g.lineWidth=7; g.stroke();
      g.strokeStyle='rgba(70,68,64,0.9)'; g.lineWidth=3; for(let k=-4;k<=4;k++){ g.beginPath(); g.moveTo(c+k*18,c-Math.sqrt(Math.max(0,R*R-(k*18)**2))+6); g.lineTo(c+k*18,c+Math.sqrt(Math.max(0,R*R-(k*18)**2))-6); g.stroke(); g.beginPath(); g.moveTo(c-Math.sqrt(Math.max(0,R*R-(k*18)**2))+6,c+k*18); g.lineTo(c+Math.sqrt(Math.max(0,R*R-(k*18)**2))-6,c+k*18); g.stroke(); }
      g.fillStyle='rgba(140,120,90,0.35)'; for(let k=0;k<200;k++){ const a=r()*6.28, rr_=r()*R; g.fillRect(c+Math.cos(a)*rr_,c+Math.sin(a)*rr_,2,2); } });
    // 14 patched pothole: fresh, darker cold-patch with a sawn edge, a little lumpy
    cell(14,()=>{ g.fillStyle='rgba(12,12,13,0.82)'; g.beginPath(); g.moveTo(40,34); g.lineTo(214,26); g.lineTo(226,196); g.lineTo(52,224); g.closePath(); g.fill();
      for(let k=0;k<700;k++){ g.fillStyle=`rgba(${r()<0.5?'0,0,0':'60,60,62'},${r()*0.35})`; g.fillRect(44+r()*176,32+r()*186,2+r()*2,2+r()*2); }
      g.strokeStyle='rgba(3,3,3,0.9)'; g.lineWidth=4; g.stroke(); });
    // 15 lane oil drips: a trail of small dark spots down the middle of a lane
    cell(15,()=>{ for(let k=0;k<46;k++){ const y=r()*256, x=128+(r()-0.5)*38, rr_=3+r()*10; const gr=g.createRadialGradient(x,y,0,x,y,rr_); gr.addColorStop(0,'rgba(5,5,6,0.7)'); gr.addColorStop(1,'rgba(5,5,6,0)'); g.fillStyle=gr; g.beginPath(); g.ellipse(x,y,rr_,rr_*1.4,0,0,6.28); g.fill(); } });
    const t=new THREE.CanvasTexture(cv); GFX.compat.srgb(t); t.anisotropy=Math.min(8,GFX.renderer.maxAnisotropy()); t.generateMipmaps=true; t.minFilter=THREE.LinearMipmapLinearFilter; ATLAS=t; return t; }

  // Wall art atlas (2048x1024, 8x4 cells of 256): graffiti tags and throw-ups, pasted posters, hand-painted
  // shop ads, stencils. Generated once; all words are invented (no real brands, no gang references).
  let WALL=null;
  function wallAtlas(){ if(WALL) return WALL; const C=256, cv=document.createElement('canvas'); cv.width=2048; cv.height=1024; const g=cv.getContext('2d');
    let sd=777; const r=()=>{ sd=(sd*16807)%2147483647; return (sd-1)/2147483646; }; const pick=a=>a[Math.floor(r()*a.length)];
    const cellAt=(k,fn)=>{ g.save(); g.translate((k%8)*C,Math.floor(k/8)*C); g.beginPath(); g.rect(0,0,C,C); g.clip(); fn(); g.restore(); };
    const tagCols=['#ff3fa4','#29d3ff','#ffd23f','#7cff5a','#ff6a2b','#b86bff','#f4f4f4','#ff2a2a'];
    const bubble=(txt,col,out,size)=>{ g.font=`bold ${size}px "Racing Sans One", "Chakra Petch", sans-serif`; g.textAlign='center'; g.textBaseline='middle'; g.lineJoin='round';
      g.lineWidth=size*0.28; g.strokeStyle='#111'; g.strokeText(txt,128,128); g.lineWidth=size*0.16; g.strokeStyle=out; g.strokeText(txt,128,128); g.fillStyle=col; g.fillText(txt,128,128);
      g.fillStyle='rgba(255,255,255,0.55)'; g.fillRect(40,128-size*0.28,176,size*0.06); for(let k=0;k<7;k++){ const x=60+r()*136; g.fillStyle=col; g.fillRect(x,128+size*0.3,3,10+r()*30); } };
    const words=['RYDN','BLVD','DRFT','ROLL','99','GRIP','SKRT','FAST','KING','ZOOM','NOLA','MOJO'];
    for(let k=0;k<10;k++) cellAt(k,()=>{ g.translate(128,128); g.rotate((r()-0.5)*0.3); g.translate(-128,-128); bubble(pick(words),pick(tagCols),pick(tagCols),60+r()*26); });   // 0-9 throw-ups
    for(let k=10;k<14;k++) cellAt(k,()=>{ g.strokeStyle=pick(['#111','#1b2b8a','#c01818']); g.lineWidth=7; g.lineCap='round'; g.beginPath(); let x=30,y=150+r()*30; g.moveTo(x,y); for(let q=0;q<14;q++){ x+=12+r()*6; y+=(r()-0.5)*70; g.quadraticCurveTo(x-6,y-40*(r()-0.5),x,y); } g.stroke(); });   // 10-13 hand tags
    const ads=[['CAR WASH','$5','#1f5fbf'],['TIRES','NEW · USED','#c8281e'],['TACOS','OPEN LATE','#e0a020'],['MUFFLERS','& BRAKES','#2a8a3c'],['CHECKS','CASHED','#6a2aa0'],['PHONES','REPAIR','#d24a1a']];
    for(let k=14;k<20;k++){ const A=ads[k-14]; cellAt(k,()=>{ g.fillStyle='rgba(245,238,220,0.92)'; g.fillRect(10,40,236,176); g.strokeStyle=A[2]; g.lineWidth=8; g.strokeRect(18,48,220,160);
      g.fillStyle=A[2]; g.font='bold 54px "Chakra Petch", sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(A[0],128,108); g.font='bold 30px "Chakra Petch", sans-serif'; g.fillStyle='#222'; g.fillText(A[1],128,166);
      g.globalCompositeOperation='destination-out'; for(let q=0;q<260;q++){ g.fillStyle=`rgba(0,0,0,${r()*0.5})`; g.fillRect(r()*256,r()*256,2+r()*5,2+r()*5); } g.globalCompositeOperation='source-over'; }); }   // 14-19 painted ads
    for(let k=20;k<26;k++) cellAt(k,()=>{ for(let q=0;q<3;q++){ const x=20+q*74+r()*10, y=30+r()*40, w=64, h=96+r()*40; g.save(); g.translate(x+w/2,y+h/2); g.rotate((r()-0.5)*0.12); g.fillStyle=pick(['#f2efe6','#ffe07a','#ff8fb8','#9fe0ff']); g.fillRect(-w/2,-h/2,w,h);
        g.fillStyle='#111'; g.font='bold 15px "Chakra Petch", sans-serif'; g.textAlign='center'; g.fillText(pick(['LIVE','SHOW','SAT','RACE','NIGHT','SALE']),0,-h/2+20); g.fillRect(-w/2+8,-10,w-16,26); g.font='11px sans-serif'; g.fillText(pick(['FRI 9PM','ALL AGES','$10','FREE']),0,h/2-12); g.restore(); } });   // 20-25 posters
    const sten=['NO PARKING','BPD','TOW AWAY','LOADING'];
    for(let k=26;k<30;k++) cellAt(k,()=>{ g.fillStyle=k===27?'rgba(20,30,90,0.85)':'rgba(15,15,15,0.8)'; g.font='bold 40px "Chakra Petch", monospace'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(sten[k-26],128,128);
      g.globalCompositeOperation='destination-out'; g.fillStyle='rgba(0,0,0,1)'; for(let q=0;q<6;q++) g.fillRect(20+q*40,100,3,56); g.globalCompositeOperation='source-over'; });   // 26-29 stencils
    for(let k=30;k<32;k++) cellAt(k,()=>{ g.fillStyle=pick(tagCols); g.beginPath(); for(let q=0;q<5;q++){ const a=q*1.2566-1.57, b=a+0.628; g.lineTo(128+Math.cos(a)*100,128+Math.sin(a)*100); g.lineTo(128+Math.cos(b)*42,128+Math.sin(b)*42); } g.closePath(); g.fill(); g.strokeStyle='#111'; g.lineWidth=8; g.stroke(); });   // 30-31 stars
    const t=new THREE.CanvasTexture(cv); GFX.compat.srgb(t); t.anisotropy=Math.min(8,GFX.renderer.maxAnisotropy()); WALL=t; return t; }

  // Wall decals: rays from the kerb find walls that face the road; each hit gets one quad of wall art.
  // opt: {every: m, height:[a,b], size:[a,b], sections:[[i0,i1],...], wallRe, kinds:{tag,ad,poster,stencil} weights, max}
  function buildWalls(W,P,opt){ const env=W.env&&W.env.root; if(!env) return null; const wallRe=opt.wallRe||/^m_(stucco|brick|block|concrete|paint|metal)$/;
    const walls=[]; env.traverse(o=>{ if(o.isMesh&&o.material&&wallRe.test(o.material.name||'')) walls.push(o); });
    let sd=4711; const r=()=>{ sd=(sd*16807)%2147483647; return (sd-1)/2147483646; }; const rr=(a,b)=>a+r()*(b-a);
    const K=Object.assign({tag:5,hand:2,ad:2,poster:2,stencil:1,star:1},opt.kinds||{}); const cells={tag:[0,10],hand:[10,14],ad:[14,20],poster:[20,26],stencil:[26,30],star:[30,32]};
    const bag=[]; for(const k in K) for(let n=0;n<K[k];n++) bag.push(k);
    const ray=new THREE.Raycaster(); ray.far=opt.reach||26; const pos=[], uv=[], ix=[], nrm=[]; let n=0, tries=0;
    const inSec=i=>!opt.sections||opt.sections.some(([a,b])=>i>=a&&i<=b);
    const step=Math.max(1,Math.round((opt.every||14)/P.spacing));
    for(let i=0;i<P.N&&n<(opt.max||120);i+=step){ if(!inSec(i)) continue;
      for(const side of [-1,1]){ tries++; if(r()<0.35) continue; const hw=P.w[i]/2+1; const ox=P.x[i]+P.rx[i]*hw*side, oz=P.z[i]+P.rz[i]*hw*side; const y=P.y[i]+rr(...(opt.height||[1.4,2.6]));
        const dir=new THREE.Vector3(P.rx[i]*side,0,P.rz[i]*side).applyAxisAngle(new THREE.Vector3(0,1,0),rr(-0.35,0.35)); ray.set(new THREE.Vector3(ox,y,oz),dir);
        const h=ray.intersectObjects(walls,false)[0]; if(!h||!h.face||h.distance<1.5) continue; const nn=h.face.normal.clone().transformDirection(h.object.matrixWorld); if(Math.abs(nn.y)>0.2||nn.dot(dir)>-0.55) continue;
        const kind=bag[Math.floor(r()*bag.length)]; const cr=cells[kind]; const cell=cr[0]+Math.floor(r()*(cr[1]-cr[0]));
        const sz=rr(...(opt.size||[1.6,3.4]))*(kind==='poster'?0.8:kind==='ad'?1.3:1); const hx=new THREE.Vector3(0,1,0).cross(nn).normalize().multiplyScalar(sz/2), hy=new THREE.Vector3(0,sz/2,0);
        const c=h.point.clone().addScaledVector(nn,0.04); const cu=(cell%8)/8, cv=1-(Math.floor(cell/8)+1)/4;
        [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([a,b])=>{ const v=c.clone().addScaledVector(hx,a).addScaledVector(hy,b); pos.push(v.x,v.y,v.z); nrm.push(nn.x,nn.y,nn.z); uv.push(cu+(a+1)/2/8*0.98+0.001,cv+(b+1)/2/4*0.98+0.001); });
        ix.push(n*4,n*4+1,n*4+2,n*4,n*4+2,n*4+3); n++; } }
    if(!n) return null; const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(nrm,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(ix);
    const m=new THREE.MeshStandardMaterial({map:wallAtlas(),transparent:true,depthWrite:false,roughness:0.85,metalness:0,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
    const mesh=new THREE.Mesh(g,m); mesh.name='v2_walls'; mesh.receiveShadow=true; mesh.renderOrder=2; mesh.userData.stats={quads:n,rays:tries}; return mesh; }

  const DC={
    atlas, wallAtlas, buildWalls,
    // builds the decal meshes for a track. surf: GFX.road.surface(...), A: analyzeTrack() result
    build(W,P,A,surf,L,seedStr){ const D=L.decals||{}; let sd=0; for(const ch of seedStr) sd=(sd*31+ch.charCodeAt(0))>>>0; sd=sd%2147483646+1;
      const rnd=()=>{ sd=(sd*16807)%2147483647; return (sd-1)/2147483646; }; const rr=(a,b)=>a+rnd()*(b-a);
      const N=P.N, sp=P.spacing; const buf={matte:{p:[],uv:[],c:[],ix:[]},gloss:{p:[],uv:[],c:[],ix:[]}};
      const ok=i=>!P.gap[i]&&!(P.hidden&&P.hidden[i]);
      // one decal: from sample i0 for len metres, lateral centre lat (may follow a function of i), width w, atlas cell k
      const tint=(h)=>{ if(h==null) return [1,1,1]; const c=new THREE.Color(h); return [c.r,c.g,c.b]; }; const TG=tint(D.gritTint), TD=tint(D.dirtTint); let COL=[1,1,1];
      const put=(kind,i0,len,latF,w,k,alpha,fadeEnds)=>{ const col=(k===8||k===10)?TG:(k===6||k===7)?TD:COL; const B=buf[kind]; const seg=Math.max(2,Math.ceil(len/1.2)); const cu=(k%4)/4, cv=1-(Math.floor(k/4)+1)/4; const base=B.p.length/3;
        for(let s=0;s<=seg;s++){ const f=i0+(len*s/seg)/sp; const i=Math.floor(f)%N, j=(i+1)%N, t=f-Math.floor(f); if(!ok(i)) return;
          const cx=P.x[i]+(P.x[j]-P.x[i])*t, cz=P.z[i]+(P.z[j]-P.z[i])*t, rx=P.rx[i]+(P.rx[j]-P.rx[i])*t, rz=P.rz[i]+(P.rz[j]-P.rz[i])*t; const lat=typeof latF==='function'?latF(i):latF;
          const a=Math.min(1,fadeEnds?Math.min(s,seg-s)/(seg*0.2+1e-3):1)*alpha;
          for(const e of [-0.5,0.5]){ const x=cx+rx*(lat+e*w), z=cz+rz*(lat+e*w); const y0=surf&&surf.at(x,z); const y=(y0!=null?y0:P.y[i])+0.015;
            B.p.push(x,y,z); B.uv.push(cu+(e+0.5)*0.25*0.96+0.005,cv+(s/seg)*0.25*0.96+0.005); B.c.push(col[0],col[1],col[2],a); } }
        for(let s=0;s<seg;s++){ const q=base+s*2; B.ix.push(q,q+1,q+2,q+1,q+3,q+2); } };
      // --- braking zones: where the racing line enters a tight corner
      const tight=[]; for(let i=0;i<N;i++){ const c=A.ca[i]; if(c>1/85 && A.ca[(i-6+N)%N]<c*0.8 && ok(i)) { if(!tight.length||i-tight[tight.length-1]>40) tight.push(i); } }
      tight.forEach(apex=>{ const bd=Math.round(rr(26,44)/sp); const i0=(apex-bd+N)%N; const L2=rr(10,22);
        put('gloss',i0,L2,i=>A.line[i],1.95,5,rr(0.55,0.9),true);
        if(rnd()<0.6) put('gloss',(i0+Math.round(rr(4,10)/sp))%N,rr(2,4),i=>A.line[i]+rr(-0.4,0.4),rr(1.4,2.2),4,rr(0.5,0.8),false);
        const out=P.curv[apex]>0?-1:1, ex=(apex+Math.round(rr(18,30)/sp))%N; put('matte',ex,rr(8,14),i=>out*(P.w[i]/2-rr(0.8,1.6)),rr(2,3.2),6,rr(0.5,0.85),true); });
      // --- patches, sealed cracks, cracks, arrows spread through the lap (lanes, not edges)
      const every=(m,fn)=>{ for(let s=rr(0,m);s<N*sp;s+=m*rr(0.6,1.4)){ const i=Math.floor(s/sp)%N; if(ok(i)) fn(i); } };
      every(D.patchEvery||170,i=>{ const lane=(rnd()<0.5?-1:1)*P.w[i]*rr(0.12,0.3); put('matte',i,rr(3,8),lane,rr(1.8,3.2),3,rr(0.12,0.2),false); });
      every(D.tarEvery||55,i=>put('gloss',i,rr(4,10),rr(-0.35,0.35)*P.w[i],rr(0.6,1.1),2,rr(0.6,0.9),true));
      every(D.crackEvery||40,i=>put('matte',i,rr(3,8),rr(-0.4,0.4)*P.w[i],rr(0.5,1.4),rnd()<0.3?1:0,rr(0.5,0.85),true));
      // --- desert: sand drifts off the shoulders, sealed thermal cracks across the full width, faded repairs
      if(D.driftEvery) every(D.driftEvery,i=>{ const sd2=rnd()<0.5?-1:1; const w=rr(2.2,4.2); put('matte',i,rr(5,14),j=>sd2*(P.w[j]/2+0.4-w/2),w*sd2,10,rr(0.55,0.9),true); });
      if(D.thermalEvery) every(D.thermalEvery,i=>{ put('gloss',i,rr(0.5,0.8),0,P.w[i]+0.4,12,rr(0.7,0.95),false); });
      if(D.fadedPatchEvery) every(D.fadedPatchEvery,i=>{ const lane=(rnd()<0.5?-1:1)*P.w[i]*rr(0.1,0.28); put('matte',i,rr(3,10),lane,rr(2,3.4),11,rr(0.45,0.75),false); });
      // --- city: utility covers and patched potholes in the lanes, oil down the middle of each lane
      const laneLat=i=>{ const n=Math.max(1,Math.round(P.w[i]/3.6)); const k=Math.floor(rnd()*n); return -P.w[i]/2+(k+0.5)*P.w[i]/n; };
      if(D.manholeEvery) every(D.manholeEvery,i=>{ put('matte',i,rr(0.9,1.1),laneLat(i)+rr(-0.5,0.5),1.0,13,0.95,false); });
      if(D.potholeEvery) every(D.potholeEvery,i=>{ put('matte',i,rr(1.2,2.6),laneLat(i)+rr(-0.4,0.4),rr(1.1,2.2),14,rr(0.7,0.9),false); });
      if(D.oilEvery) every(D.oilEvery,i=>{ put('gloss',i,rr(6,16),laneLat(i),rr(0.6,0.9),15,rr(0.45,0.75),true); });
      // --- edge grit, both sides, continuous (u runs road -> shoulder)
      for(const sd2 of [-1,1]){ let run=0, i0=0; const flush=(i1)=>{ const n=((i1-i0+N)%N); if(n>2) put('matte',i0,n*sp,i=>sd2*(P.w[i]/2+0.3),2.2*sd2,8,0.9,false); };
        for(let i=0;i<=N;i++){ const k=i%N; if(ok(k)&&i<N){ if(!run){ run=1; i0=k; } if(i-i0>80){ flush(k); i0=k; } } else if(run){ run=0; flush(k); } } }
      const mats={matte:new THREE.MeshStandardMaterial({map:atlas(),transparent:true,depthWrite:false,vertexColors:true,roughness:0.95,metalness:0,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}),
        gloss:new THREE.MeshStandardMaterial({map:atlas(),transparent:true,depthWrite:false,vertexColors:true,roughness:0.42,metalness:0,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4})};
      const out=new THREE.Group(); out.name='v2_decals'; let tris=0;
      for(const k of ['matte','gloss']){ const B=buf[k]; if(!B.ix.length) continue; const g=new THREE.BufferGeometry();
        g.setAttribute('position',new THREE.Float32BufferAttribute(B.p,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(B.uv,2)); g.setAttribute('color',new THREE.Float32BufferAttribute(B.c,4)); g.setIndex(B.ix);
        g.computeVertexNormals(); const m=new THREE.Mesh(g,mats[k]); m.receiveShadow=true; m.renderOrder=2; m.name='v2_decals_'+k; out.add(m); tris+=B.ix.length/3; }
      out.userData.stats={tris,braking:tight.length}; return out; },
  };
  window.GFX=window.GFX||{}; window.GFX.decals=DC;
})();
