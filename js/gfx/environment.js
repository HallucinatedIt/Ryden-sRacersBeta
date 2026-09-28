// Ryden's Racers · Graphics V2 · EnvironmentManager
// -----------------------------------------------------------------------------------------------
// Sky dome shader, distance fog and the reflection/lighting environment. makeSky() and
// makeEnvFromTheme() are moved here verbatim from game.js (they stay global functions, so every existing
// call site works unchanged). makeSky supports optional procedural clouds (th.clouds / u.clouds, used by
// the Revolution chapter atmosphere).
//
// What the environment map is used for today: car paint/glass/chrome reflections (setEnvOnCarMats) and
// a few env-GLB materials. World materials get NO image-based lighting yet (scene.environment = null);
// GFX.environment.applyWorldIBL() is the Phase 2 switch for that, gated by settings.envLighting.
function makeSky(th,radius){
  const mat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
    uniforms:{top:{value:new THREE.Color(th.skyTop)},hor:{value:new THREE.Color(th.skyHor)},sun:{value:new THREE.Vector3(...th.sunDir).normalize()},sunc:{value:new THREE.Color(th.sunCol)},night:{value:th.night?1:0},clouds:{value:th.clouds||0},ct:{value:0}},
    vertexShader:'varying vec3 d;void main(){d=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
    fragmentShader:`uniform vec3 top,hor,sunc,sun;uniform float night,clouds,ct;varying vec3 d;
      float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453);}
      float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
      float fb(vec2 p){float a=0.,w=0.5;for(int k=0;k<5;k++){a+=w*n2(p);p=p*2.03+vec2(1.7,9.2);w*=0.5;}return a;}
      void main(){ float y=max(d.y,0.); vec3 c=mix(hor,top,pow(y,0.55)); if(d.y<0.) c=hor*0.92;
       float s=max(dot(d,sun),0.); c+=sunc*(pow(s,600.)*(1.-night)*4.+pow(s,8.)*0.35*(1.-night*0.7)+pow(s,2.)*0.08);
       if(clouds>0.001&&d.y>-0.02){ vec2 uc=d.xz/(d.y+0.16)*1.1+vec2(ct*0.006,ct*0.0022); float n=fb(uc); float cov=smoothstep(1.02-clouds,1.36-clouds,n);
         float thick=smoothstep(1.02-clouds,1.7-clouds,fb(uc*1.7+3.1)); float lit=pow(max(dot(normalize(vec3(d.x,max(d.y,0.05),d.z)),sun),0.),3.);
         vec3 cc=mix(mix(top,hor,0.55)*0.78+vec3(0.2),vec3(1.0,0.98,0.95),0.55)*(1.-0.32*thick)+sunc*lit*0.45*(1.-thick*0.6);
         c=mix(c,cc,cov*smoothstep(-0.02,0.1,d.y)*(1.-night)); }
       if(night>0.5){ vec3 q=floor(d*420.); float st=step(0.9975,h(q))*smoothstep(0.05,0.35,d.y); c+=vec3(st)*(0.6+0.4*h(q+1.)); c+=vec3(0.55,0.15,0.5)*pow(1.-y,6.)*0.35; }
       gl_FragColor=vec4(c,1.);}`});
  const m=new THREE.Mesh(new THREE.SphereGeometry(radius,32,16),mat); m.renderOrder=-10; m.frustumCulled=false; return m;
}

function makeEnvFromTheme(renderer,th){
  const s=new THREE.Scene(); const sg=new THREE.SphereGeometry(45,32,16); const pc=sg.attributes.position; const cols=new Float32Array(pc.count*3); const top=new THREE.Color(th.skyTop), hor=new THREE.Color(th.skyHor), gnd=new THREE.Color(th.hemiG).multiplyScalar(0.5), cc=new THREE.Color();
  for(let v=0;v<pc.count;v++){ const y=pc.getY(v)/45; if(y>=0) cc.copy(hor).lerp(top,Math.pow(y,0.55)); else cc.copy(hor).lerp(gnd,Math.min(1,-y*4)); cols[v*3]=cc.r; cols[v*3+1]=cc.g; cols[v*3+2]=cc.b; }
  sg.setAttribute('color',new THREE.BufferAttribute(cols,3)); s.add(new THREE.Mesh(sg,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
  const sd=new THREE.Vector3(...th.sunDir).normalize(); const sunB=new THREE.Mesh(new THREE.SphereGeometry(th.night?2:5,12,8),new THREE.MeshBasicMaterial({color:new THREE.Color(th.sunCol).multiplyScalar(th.night?0.5:3)})); sunB.position.copy(sd).multiplyScalar(38); s.add(sunB);
  const g=new THREE.PlaneGeometry(200,200); g.rotateX(-Math.PI/2); const gm=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:new THREE.Color(th.hemiG).multiplyScalar(0.6)})); gm.position.y=-2; s.add(gm);
  if(th.night){ [0xff2e97,0x22e4ff,0xffc23d].forEach((c,k)=>{ const p=new THREE.Mesh(new THREE.PlaneGeometry(30,4),new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide})); p.position.set(Math.cos(k*2.1)*40,6,Math.sin(k*2.1)*40); p.lookAt(0,6,0); s.add(p); }); }
  const pm=new THREE.PMREMGenerator(renderer); const rt=pm.fromScene(s,0.02); pm.dispose(); return rt.texture;
}

(function(){
  const EM={
    makeSky:(th,radius)=>makeSky(th,radius),
    makeFog(th,Q){ return new THREE.Fog(th.fog,th.fogNear,th.fogFar*Q.fogMul); },
    envFromTheme:(renderer,th)=>makeEnvFromTheme(renderer,th),
    // Phase 2: world image-based lighting. Off in every tier for Phase 1 (visual parity).
    applyWorldIBL(scene,envTex,Q){ if(Q&&Q.envLighting&&envTex){ scene.environment=envTex; return true; } scene.environment=null; return false; },
  };
  window.GFX=window.GFX||{}; window.GFX.environment=EM;
})();
