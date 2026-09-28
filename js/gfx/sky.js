// Ryden's Racers · Graphics V2 · Sky, image-based lighting and water
// -----------------------------------------------------------------------------------------------
// One analytic sky function (skyRad) is shared by three things, so they always agree:
//   - the visible sky dome,
//   - the PMREM environment used as scene.environment (image-based lighting for every PBR material and
//     the reflections in car paint, glass and metal),
//   - the ocean's reflections.
// The model is artist-driven but physically motivated: an air-mass horizon gradient, warm forward
// scattering around the sun (Henyey-Greenstein phase), a limb-darkened sun disk in HDR (so bloom picks it
// up), optional lit cloud cover, and a ground/sea lower hemisphere. All values are linear radiance.
(function(){
  const SKY_GLSL=`
    uniform vec3 skZen,skHor,skWarm,skSun,skGround,skSunDir; uniform float skMie,skDisk,skClouds,skCt,skHorPow,skBright;
    float skh2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float skn2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(skh2(i),skh2(i+vec2(1,0)),f.x),mix(skh2(i+vec2(0,1)),skh2(i+vec2(1,1)),f.x),f.y);}
    float skfb(vec2 p){float a=0.,w=0.5;for(int k=0;k<5;k++){a+=w*skn2(p);p=p*2.03+vec2(1.7,9.2);w*=0.5;}return a;}
    vec3 skyRad(vec3 d, float withDisk){
      float y=d.y, h=max(y,0.); float mu=dot(d,skSunDir);
      vec3 c=mix(skHor,skZen,pow(clamp(h,0.,1.),skHorPow));
      float hz=pow(1.-h,4.);                                    // air mass towards the horizon
      c+=skWarm*hz*(0.12+0.88*pow(max(mu,0.)*0.5+0.5,4.));      // warm band, strongest on the sun side
      float g=0.78; float ph=(1.-g*g)/pow(1.+g*g-2.*g*mu,1.5);   // Henyey-Greenstein forward scattering
      c+=skSun*skMie*ph*(0.25+0.75*hz)*0.08;
      if(skClouds>0.001&&y>-0.02){ vec2 uc=d.xz/(y+0.18)*1.1+vec2(skCt*0.006,skCt*0.0022); float n=skfb(uc);
        float cov=smoothstep(1.02-skClouds,1.36-skClouds,n); float thick=smoothstep(1.02-skClouds,1.7-skClouds,skfb(uc*1.7+3.1));
        float lit=pow(max(mu,0.),4.); vec3 cc=mix(skHor*1.05,vec3(1.)*length(skHor)*0.62,0.5)*(1.-0.35*thick)+skSun*(0.05+lit*0.35)*(1.-thick*0.5);
        c=mix(c,cc,cov*smoothstep(-0.02,0.12,y)*0.85); }
      if(withDisk>0.5){ float cd=0.99996; float disk=smoothstep(cd-0.00002,cd,mu); float limb=0.6+0.4*sqrt(clamp((mu-cd)/(1.-cd),0.,1.)); c+=skSun*skDisk*disk*limb; }
      if(y<0.){ c=mix(c,skGround,smoothstep(0.,-0.18,y)); }
      return c*skBright; }`;
  const uniformsFor=(L)=>{ const S=L.sky; return {
    skZen:{value:new THREE.Color(S.zenith)}, skHor:{value:new THREE.Color(S.horizon)}, skWarm:{value:new THREE.Color(S.warm)},
    skSun:{value:new THREE.Color(L.sun.color).multiplyScalar(S.sunRadiance||1)}, skGround:{value:new THREE.Color(S.ground)},
    skSunDir:{value:L.sunDir.clone()}, skMie:{value:S.mie||1}, skDisk:{value:S.disk||40}, skClouds:{value:S.clouds||0}, skCt:{value:0},
    skHorPow:{value:S.horizonPow||0.5}, skBright:{value:S.brightness||1} }; };
  const SK={
    GLSL:SKY_GLSL, uniformsFor,
    // visible dome (replaces the legacy gradient dome on a V2 track)
    makeDome(L,radius){ const U=uniformsFor(L);
      const mat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:U,
        vertexShader:'varying vec3 vD; void main(){ vD=normalize(position); vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position=p.xyww; }',
        fragmentShader:SKY_GLSL+'\nvarying vec3 vD; void main(){ gl_FragColor=vec4(skyRad(normalize(vD),1.),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
      const m=new THREE.Mesh(new THREE.SphereGeometry(radius,48,24),mat); m.renderOrder=-10; m.frustumCulled=false; m.name='v2_sky'; return m; },
    // image-based lighting: the same sky (sun disk left out: the sun light provides the highlight) as a PMREM
    makeIBL(renderer,L){ const U=uniformsFor(L); U.skClouds.value=(L.sky.clouds||0)*0.6;
      const s=new THREE.Scene(); const mat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:U,
        vertexShader:'varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader:SKY_GLSL+'\nvarying vec3 vD; void main(){ gl_FragColor=vec4(skyRad(normalize(vD),0.)*'+(L.ibl&&L.ibl.skyScale||1).toFixed(3)+',1.); }'});
      s.add(new THREE.Mesh(new THREE.SphereGeometry(40,48,24),mat));
      const pm=new THREE.PMREMGenerator(renderer); const rt=pm.fromScene(s,0.0,0.1,100); pm.dispose(); mat.dispose(); return rt.texture; },
    // ocean: sky reflections with Fresnel, layered wave normals, a sun glitter path in HDR, depth tint
    makeOcean(L,sunDir){ const U=Object.assign(uniformsFor(L),THREE.UniformsUtils.clone(THREE.UniformsLib.fog),{
        t:{value:0}, deep:{value:new THREE.Color(L.ocean.deep)}, shallow:{value:new THREE.Color(L.ocean.shallow)}, sunI:{value:L.ocean.sunGlint||6}, rough:{value:L.ocean.roughness||0.12} });
      U.skClouds.value=L.sky.clouds||0;
      return new THREE.ShaderMaterial({fog:true,uniforms:U,
        vertexShader:'varying vec3 wp;\n#include <fog_pars_vertex>\nvoid main(){ vec4 w=modelMatrix*vec4(position,1.); wp=w.xyz; vec4 mvPosition=viewMatrix*w; gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
        fragmentShader:SKY_GLSL+`\nuniform float t,sunI,rough; uniform vec3 deep,shallow; varying vec3 wp;\n#include <fog_pars_fragment>\n
          vec2 wv(vec2 p,vec2 dir,float fr,float sp,float a){ float ph=dot(p,dir)*fr+t*sp; return dir*cos(ph)*a*fr; }
          void main(){ vec2 p=wp.xz; vec3 v=cameraPosition-wp; float dist=length(v); v/=dist;
            vec2 g=wv(p,normalize(vec2(0.8,0.6)),0.045,1.1,0.9)+wv(p,normalize(vec2(-0.5,0.85)),0.07,1.5,0.55)+wv(p,normalize(vec2(0.2,-1.)),0.16,2.3,0.22)+wv(p,normalize(vec2(-0.9,-0.3)),0.31,3.1,0.1)
                  +wv(p,normalize(vec2(0.6,-0.7)),0.63,4.7,0.045)+wv(p,normalize(vec2(-0.2,0.9)),1.21,6.3,0.02);
            float fade=clamp(dist/900.,0.,1.); g*=mix(1.,0.35,fade);
            vec3 n=normalize(vec3(-g.x,1.,-g.y));
            float ndv=max(dot(n,v),0.); float F=0.02+0.98*pow(1.-ndv,5.);
            vec3 r=reflect(-v,n); r.y=abs(r.y); vec3 refl=skyRad(normalize(r),0.);
            vec3 body=mix(deep,shallow,0.25+0.35*pow(1.-ndv,2.))*(0.35+0.65*length(skHor)/1.2);
            vec3 c=mix(body,refl,F);
            vec3 hv=normalize(v+skSunDir); float nh=max(dot(n,hv),0.); float a=rough+fade*0.12; float a2=a*a; float dd=nh*nh*(a2-1.)+1.; float D=a2/(3.14159*dd*dd);
            c+=skSun*D*sunI*0.02*F*4.*max(dot(n,skSunDir),0.);
            gl_FragColor=vec4(c,1.);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
            #include <fog_fragment>
          }`}); },
  };
  window.GFX=window.GFX||{}; window.GFX.sky=SK;
})();
