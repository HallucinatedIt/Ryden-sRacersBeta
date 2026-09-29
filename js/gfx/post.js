// Ryden's Racers · Graphics V2 · Post-processing pipeline
// -----------------------------------------------------------------------------------------------
// A compact, modular HDR pipeline owned by GFX.renderer. It only runs when a Graphics V2 look is active
// (GFX.v2) AND the tier enables it (settings: postFX). Every stage is switched per tier:
//
//   1. scene  -> HDR target (HalfFloat, MSAA x settings.msaa, depth texture)        [always]
//   2. GTAO ambient occlusion from the depth buffer (no extra scene pass), half res [settings.ssao]
//   3. bloom: 13-tap downsample chain + tent upsample ("physically based" bloom,
//      soft threshold, low intensity)                                               [settings.bloom]
//   4. composite (one full-screen pass): AO, bloom, height/aerial haze from depth,
//      exposure + tone mapping (Neutral / AgX / ACES), colour grade (white balance,
//      contrast, saturation, lift/gain, optional 3D LUT), vignette, sharpen, dither [settings.colorGrade...]
//
// No motion blur. Gameplay code never touches this file; the look (exposure, tone mapper, grade, haze)
// comes from the active GFX.v2 look, the switches from GFX.settings.
(function(){
  const qs=(()=>{ try{ return new URLSearchParams(location.search); }catch(e){ return new URLSearchParams(''); } })();
  const VS='varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }';
  const DOWN=`uniform sampler2D src; uniform vec2 texel; uniform float first; uniform vec2 thr; varying vec2 vUv;
    vec3 s(vec2 o){ return texture2D(src,vUv+o*texel).rgb; }
    float lum(vec3 c){ return dot(c,vec3(0.2126,0.7152,0.0722)); }
    void main(){
      vec3 a=s(vec2(-2.,2.)),b=s(vec2(0.,2.)),c=s(vec2(2.,2.)),d=s(vec2(-2.,0.)),e=s(vec2(0.)),f=s(vec2(2.,0.)),g=s(vec2(-2.,-2.)),h=s(vec2(0.,-2.)),i=s(vec2(2.,-2.)),
           j=s(vec2(-1.,1.)),k=s(vec2(1.,1.)),l=s(vec2(-1.,-1.)),m=s(vec2(1.,-1.));
      vec3 o;
      if(first>0.5){ vec3 g0=(a+b+d+e)*.25,g1=(b+c+e+f)*.25,g2=(d+e+g+h)*.25,g3=(e+f+h+i)*.25,g4=(j+k+l+m)*.25;
        float w0=.125/(1.+lum(g0)),w1=.125/(1.+lum(g1)),w2=.125/(1.+lum(g2)),w3=.125/(1.+lum(g3)),w4=.5/(1.+lum(g4));
        o=(g0*w0+g1*w1+g2*w2+g3*w3+g4*w4)/(w0+w1+w2+w3+w4);
        float br=max(o.r,max(o.g,o.b)); float sf=clamp(br-thr.x+thr.y,0.,2.*thr.y); sf=sf*sf/(4.*thr.y+1e-4);
        o*=max(sf,br-thr.x)/max(br,1e-4); o=min(o,vec3(thr.y*0.+8.)); }   // energy clamp: the sun disk must not veil the whole sky
      else o=e*.125+(a+c+g+i)*.03125+(b+d+f+h)*.0625+(j+k+l+m)*.125;
      gl_FragColor=vec4(max(o,vec3(0.)),1.); }`;
  const UP=`uniform sampler2D src; uniform vec2 texel; uniform float radius; varying vec2 vUv;
    vec3 s(float x,float y){ return texture2D(src,vUv+vec2(x,y)*texel*radius).rgb; }
    void main(){ vec3 o=(s(-1.,1.)+s(1.,1.)+s(-1.,-1.)+s(1.,-1.))+(s(0.,1.)+s(-1.,0.)+s(1.,0.)+s(0.,-1.))*2.+s(0.,0.)*4.; gl_FragColor=vec4(o/16.,1.); }`;
  const COMP=`#include <common>
    #include <tonemapping_pars_fragment>
    uniform sampler2D tScene,tBloom,tAO,tDepth; uniform highp sampler3D tLUT;
    uniform vec2 texel; uniform float bloomI,aoI,useAO,useBloom,useLUT,lutI,vign,sharp,dith,frame,tm;
    uniform vec3 wb,lift,gain; uniform float sat,contrast,gammaG;
    uniform float useHaze; uniform vec4 haze; uniform vec3 hazeCol,hazeSun,sunDir,camPos; uniform mat4 projInv,camWorld;
    varying vec2 vUv;
    float lum(vec3 c){ return dot(c,vec3(0.2126,0.7152,0.0722)); }
    vec3 toSRGB(vec3 c){ c=max(c,vec3(0.)); return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-0.055,step(vec3(0.0031308),c)); }
    void main(){
      vec3 c=texture2D(tScene,vUv).rgb;
      if(sharp>0.){ vec3 n=texture2D(tScene,vUv+vec2(texel.x,0.)).rgb+texture2D(tScene,vUv-vec2(texel.x,0.)).rgb+texture2D(tScene,vUv+vec2(0.,texel.y)).rgb+texture2D(tScene,vUv-vec2(0.,texel.y)).rgb;
        float l0=lum(c), ln=lum(n)*0.25; c*=clamp(1.+sharp*(l0-ln)/max(l0,1e-3),0.75,1.25); }
      if(useAO>0.5){ float ao=texture2D(tAO,vUv).r; c*=mix(1.,ao,aoI); }
      if(useHaze>0.5){ float d=texture2D(tDepth,vUv).x;
        if(d<1.){ vec4 v=projInv*vec4(vUv*2.-1.,d*2.-1.,1.); v/=v.w; vec3 w=(camWorld*v).xyz; vec3 rv=w-camPos; float dist=length(rv); vec3 rd=rv/dist;
          float t=max(dist-haze.z,0.); float b=haze.y; float fh=exp(-max(camPos.y-haze.w,0.)*b);
          float od=haze.x*fh*t*(abs(rd.y*b*t)>1e-3?(1.-exp(-rd.y*b*t))/(rd.y*b*t):1.);
          float amt=1.-exp(-max(od,0.)); vec3 ins=mix(hazeCol,hazeSun,pow(max(dot(rd,sunDir),0.),6.));
          c=mix(c,ins,clamp(amt,0.,1.)); } }
      if(useBloom>0.5) c+=texture2D(tBloom,vUv).rgb*bloomI;
      c*=wb;
      if(tm<0.5) c=NeutralToneMapping(c); else if(tm<1.5) c=AgXToneMapping(c); else c=ACESFilmicToneMapping(c);
      vec3 g=toSRGB(c);
      float L=lum(g); g=mix(vec3(L),g,sat);
      g=(g-0.5)*contrast+0.5;
      g=pow(max(g*gain+lift*(1.-g),vec3(0.)),vec3(gammaG));
      if(useLUT>0.5){ vec3 lc=clamp(g,0.,1.); g=mix(g,texture(tLUT,lc*(31./32.)+0.5/32.).rgb,lutI); }
      vec2 q=vUv-0.5; g*=mix(1.,smoothstep(0.95,0.25,length(q*vec2(1.,0.8))*1.25),vign);
      float nz=fract(sin(dot(gl_FragCoord.xy+frame*vec2(0.37,0.71),vec2(12.9898,78.233)))*43758.5453)+fract(sin(dot(gl_FragCoord.yx+frame,vec2(39.35,11.13)))*24634.63)-1.;
      g+=nz*dith/255.;
      gl_FragColor=vec4(clamp(g,0.,1.),1.); }`;

  const PP={
    enabled:false, look:null, rt:null, mips:[], w:0, h:0, samples:-1, stats:{passes:0,sceneCalls:0,sceneTris:0},
    debugView:qs.get('post')||'',   // ?post=off|noao|nobloom|nohaze|nograde (developer: A/B individual stages)
    // called by GFX.v2 when a V2 look starts / ends
    enable(look){ PP.look=look; PP.enabled=!!look; },
    disable(){ PP.enabled=false; PP.look=null; },
    // HDR targets need a renderable half-float colour buffer; without it (some older mobile GPUs) V2 falls back to the direct path
    hdrOK(){ if(PP._hdr==null){ const r=GFX.renderer.r; const e=r&&r.extensions; PP._hdr=!!(e&&(e.has('EXT_color_buffer_half_float')||e.has('EXT_color_buffer_float'))); } return PP._hdr; },
    wants(Q){ return PP.enabled && Q && Q.postFX && GFX.compat.rev>=160 && PP.debugView!=='off' && PP.hdrOK(); },
    _mat(fs,uniforms,blend){ return new THREE.ShaderMaterial({vertexShader:VS,fragmentShader:fs,uniforms,depthTest:false,depthWrite:false,
      blending:blend||THREE.NoBlending,toneMapped:false}); },
    _init(){ if(PP.quad) return;
      PP.quad=new THREE.FullScreenQuad(null);
      PP.down=PP._mat(DOWN,{src:{value:null},texel:{value:new THREE.Vector2()},first:{value:0},thr:{value:new THREE.Vector2(1,0.5)}});
      PP.up=PP._mat(UP,{src:{value:null},texel:{value:new THREE.Vector2()},radius:{value:1}},THREE.AdditiveBlending);
      const lut=new THREE.Data3DTexture(new Uint8Array(4),1,1,1); lut.needsUpdate=true;
      PP.comp=PP._mat(COMP,{tScene:{value:null},tBloom:{value:null},tAO:{value:null},tDepth:{value:null},tLUT:{value:lut},texel:{value:new THREE.Vector2()},
        bloomI:{value:0},aoI:{value:1},useAO:{value:0},useBloom:{value:0},useLUT:{value:0},lutI:{value:1},vign:{value:0},sharp:{value:0},dith:{value:1},frame:{value:0},tm:{value:0},
        toneMappingExposure:{value:1},wb:{value:new THREE.Vector3(1,1,1)},lift:{value:new THREE.Vector3()},gain:{value:new THREE.Vector3(1,1,1)},sat:{value:1},contrast:{value:1},gammaG:{value:1},
        useHaze:{value:0},haze:{value:new THREE.Vector4()},hazeCol:{value:new THREE.Color()},hazeSun:{value:new THREE.Color()},sunDir:{value:new THREE.Vector3(0,1,0)},camPos:{value:new THREE.Vector3()},
        projInv:{value:new THREE.Matrix4()},camWorld:{value:new THREE.Matrix4()}}); },
    _size(r,Q){ const v=new THREE.Vector2(); r.getDrawingBufferSize(v); const w=Math.max(1,v.x|0), h=Math.max(1,v.y|0);
      const samples=Math.min(Q.msaa||0,r.capabilities.maxSamples||4);
      if(w===PP.w&&h===PP.h&&samples===PP.samples&&PP.rt) return;
      PP.dispose(); PP.w=w; PP.h=h; PP.samples=samples;
      const dt=new THREE.DepthTexture(w,h); dt.type=THREE.UnsignedIntType;
      PP.rt=new THREE.WebGLRenderTarget(w,h,{type:THREE.HalfFloatType,samples,depthTexture:dt,depthBuffer:true});
      PP.rt.texture.minFilter=PP.rt.texture.magFilter=THREE.LinearFilter; PP.rt.texture.generateMipmaps=false;
      let mw=w, mh=h; PP.mips=[]; for(let k=0;k<5;k++){ mw=Math.max(1,mw>>1); mh=Math.max(1,mh>>1); if(mw<4||mh<4) break;
        const t=new THREE.WebGLRenderTarget(mw,mh,{type:THREE.HalfFloatType,depthBuffer:false}); t.texture.minFilter=t.texture.magFilter=THREE.LinearFilter; t.texture.generateMipmaps=false; PP.mips.push(t); }
      PP.gtao=null; },
    _ao(r,scene,camera,Q){ const hw=Math.max(1,PP.w>>1), hh=Math.max(1,PP.h>>1);
      if(!PP.gtao){ const g=new THREE.GTAOPass(scene,camera,hw,hh); g.setGBuffer(PP.rt.depthTexture,undefined); g.output=THREE.GTAOPass.OUTPUT.Off;
        PP.gtao=g; PP.gtaoKey=''; }
      const g=PP.gtao, L=PP.look||{}, a=L.ao||{};
      const key=[Q.ssaoSamples,a.radius,a.thickness,a.falloff].join(',');
      if(key!==PP.gtaoKey){ PP.gtaoKey=key;
        g.updateGtaoMaterial({radius:a.radius||0.7,distanceExponent:a.exponent||1.6,thickness:a.thickness||1.2,distanceFallOff:a.falloff||1,scale:a.scale||1,samples:Q.ssaoSamples||12,screenSpaceRadius:false});
        g.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:4,rings:2,samples:Q.ssaoSamples>=16?16:8}); }
      g.camera=camera; g.scene=scene; g.render(r,null,PP.rt); PP.stats.passes+=2; return g.pdRenderTarget.texture; },
    _bloom(r,L){ const M=PP.mips; if(!M.length) return null; const b=L.bloom||{};
      PP.down.uniforms.thr.value.set(b.threshold!=null?b.threshold:1.0,b.knee!=null?b.knee:0.5);
      let src=PP.rt.texture, sw=PP.w, sh=PP.h;
      for(let k=0;k<M.length;k++){ PP.down.uniforms.src.value=src; PP.down.uniforms.texel.value.set(1/sw,1/sh); PP.down.uniforms.first.value=k===0?1:0;
        PP.quad.material=PP.down; r.setRenderTarget(M[k]); PP.quad.render(r); src=M[k].texture; sw=M[k].width; sh=M[k].height; PP.stats.passes++; }
      PP.up.uniforms.radius.value=b.radius||1;
      for(let k=M.length-1;k>0;k--){ PP.up.uniforms.src.value=M[k].texture; PP.up.uniforms.texel.value.set(1/M[k].width,1/M[k].height);
        PP.quad.material=PP.up; r.setRenderTarget(M[k-1]); PP.quad.render(r); PP.stats.passes++; }
      return M[0].texture; },
    // the frame (called by GFX.renderer.render when wants() is true)
    render(r,scene,camera,exposure,Q){ PP._init(); PP._size(r,Q); const L=PP.look||{}; const dv=PP.debugView; PP.stats.passes=0;
      const ac=r.autoClear; r.autoClear=true;
      r.setRenderTarget(PP.rt); r.render(scene,camera); PP.stats.sceneCalls=r.info.render.calls; PP.stats.sceneTris=r.info.render.triangles;
      const U=PP.comp.uniforms;
      const aoOn=Q.ssao && dv!=='noao', blOn=Q.bloom && dv!=='nobloom';
      U.useAO.value=0; if(aoOn){ const t=PP._ao(r,scene,camera,Q); if(t){ U.tAO.value=t; U.useAO.value=1; U.aoI.value=(L.ao&&L.ao.intensity!=null)?L.ao.intensity:0.8; } }
      U.useBloom.value=0; if(blOn){ const t=PP._bloom(r,L); if(t){ U.tBloom.value=t; U.useBloom.value=1; U.bloomI.value=(L.bloom&&L.bloom.intensity)||0.05; } }
      U.tScene.value=PP.rt.texture; U.tDepth.value=PP.rt.depthTexture; U.texel.value.set(1/PP.w,1/PP.h);
      U.toneMappingExposure.value=(exposure!=null?exposure:1)*(L.exposure||1);
      U.tm.value=({neutral:0,agx:1,aces:2})[L.toneMapping||'neutral'];
      const G=(Q.colorGrade&&dv!=='nograde')?(L.grade||{}):{};
      U.wb.value.set(...(G.wb||[1,1,1])); U.sat.value=G.saturation!=null?G.saturation:1; U.contrast.value=G.contrast!=null?G.contrast:1; U.gammaG.value=G.gamma||1;
      U.lift.value.set(...(G.lift||[0,0,0])); U.gain.value.set(...(G.gain||[1,1,1])); U.vign.value=G.vignette||0; U.sharp.value=Q.sharpen||0;
      U.useLUT.value=(G.lut&&PP.lut)?1:0; if(PP.lut){ U.tLUT.value=PP.lut; U.lutI.value=G.lutIntensity!=null?G.lutIntensity:1; }
      const H=L.haze; U.useHaze.value=(H&&dv!=='nohaze')?1:0;
      if(H){ U.haze.value.set(H.density,H.falloff,H.start||0,H.base||0); U.hazeCol.value.copy(H.color); U.hazeSun.value.copy(H.sunColor); if(L.sunDir) U.sunDir.value.copy(L.sunDir);
        U.camPos.value.setFromMatrixPosition(camera.matrixWorld); U.projInv.value.copy(camera.projectionMatrixInverse); U.camWorld.value.copy(camera.matrixWorld); }
      U.frame.value=(U.frame.value+1)%1024;
      PP.quad.material=PP.comp; r.setRenderTarget(null); PP.quad.render(r); PP.stats.passes++;
      r.autoClear=ac; },
    // optional 3D LUT (.cube) for a look: GFX.post.loadLUT('luts/pacifica.cube')
    loadLUT(url){ return new Promise((res,rej)=>{ new THREE.LUTCubeLoader().load(url,d=>{ PP.lut=d.texture3D; res(PP.lut); },undefined,rej); }); },
    dispose(){ if(PP.rt){ PP.rt.depthTexture&&PP.rt.depthTexture.dispose(); PP.rt.dispose(); } PP.mips.forEach(t=>t.dispose()); PP.mips=[]; PP.rt=null;
      if(PP.gtao){ PP.gtao.dispose(); PP.gtao=null; } PP.w=PP.h=0; },
  };
  window.GFX=window.GFX||{}; window.GFX.post=PP;
})();
