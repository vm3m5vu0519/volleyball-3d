
// ---------------- 場景與畫面效果：觀眾、大螢幕比分、球網擺動、落地痕跡、後製（光暈、調色、暗角） ----------------
const FX={crowd:null,heads:null,cw:[],cheer:0,cheerSide:0,net:null,marks:[],comp:null,bloom:null,grade:null,board:[]};
// 觀眾：坐在看台每一排座位上，平常輕輕晃，得分時站起來歡呼（得分那一方的看台跳得最高）
(function crowd(){const W=M.wid,HF=M.half,seats=[];
  const addRows=(len,dist,side,rows,axis)=>{for(let k=0;k<rows;k++){const d=dist+k*.95-.12,y=.5+k*.5;for(let u=-len/2+.5;u<len/2-.5;u+=.62){if(rnd()<.32)continue;
    const j=(rnd()-.5)*.12;seats.push(axis==='z'?{x:u+j,z:side*d,y}:{x:side*d,z:u+j,y});}}};
  [-1,1].forEach(s=>{addRows(44,W+6.5,s,13,'z');addRows(30,HF+8,s,11,'x');});
  const n=seats.length,bodyG=new TH.CylinderGeometry(.15,.21,.62,6),headG=new TH.SphereGeometry(.115,8,6);bodyG.translate(0,.31,0);headG.translate(0,.74,0);
  const bm=new TH.MeshLambertMaterial({color:'#ffffff'}),hm=new TH.MeshLambertMaterial({color:'#ffffff'});
  const B=new TH.InstancedMesh(bodyG,bm,n),H=new TH.InstancedMesh(headG,hm,n);B.instanceMatrix.setUsage(TH.DynamicDrawUsage);H.instanceMatrix.setUsage(TH.DynamicDrawUsage);
  const shirts=['#e8504f','#3d7fd0','#f2f2f2','#ffcc33','#2b2f3a','#ff8a2a','#6fc3a8','#e86fa8','#8a6fe8','#1d2a5a'],skin=['#f3d2b8','#e6b996','#c99572','#f6dcc8'],hair=['#2a1d18','#3b2a22','#6b4a33','#1b1b1f','#c9a26a'];
  const c=new TH.Color();seats.forEach((s,i)=>{c.set(shirts[(rnd()*shirts.length)|0]);B.setColorAt(i,c);c.set(rnd()<.6?hair[(rnd()*hair.length)|0]:skin[(rnd()*skin.length)|0]);H.setColorAt(i,c);
    s.ph=rnd()*7;s.fan=rnd();s.team=Math.sign(s.x)||1;});
  B.frustumCulled=H.frustumCulled=false;scene.add(B);scene.add(H);FX.crowd=B;FX.heads=H;FX.cw=seats;})();
const _cm=new TH.Matrix4(),_cq=new TH.Quaternion(),_cs=new TH.Vector3(1,1,1),_cp=new TH.Vector3();let _cT=0;
function crowdFrame(dt){if(!FX.crowd)return;const on=S.gfx>=1;FX.crowd.visible=FX.heads.visible=on;if(!on)return;_cT+=dt;if(_cT<1/30)return;const t=time;_cT=0;
  FX.cheer=Math.max(0,FX.cheer-.011);
  FX.cw.forEach((s,i)=>{const mine=FX.cheerSide===0||Math.sign(s.x)===FX.cheerSide,e=FX.cheer*(mine?1:.35)*(s.fan>.25?1:0);
    const jump=e>0?Math.max(0,Math.sin(t*9+s.ph))*.22*e+.18*Math.min(1,e*3):Math.sin(t*1.3+s.ph)*.015;
    _cp.set(s.x,s.y+jump,s.z);_cq.setFromAxisAngle(_ya,Math.sin(t*2+s.ph)*.15*e);_cm.compose(_cp,_cq,_cs);FX.crowd.setMatrixAt(i,_cm);FX.heads.setMatrixAt(i,_cm);});
  FX.crowd.instanceMatrix.needsUpdate=FX.heads.instanceMatrix.needsUpdate=true;}
const _ya=new TH.Vector3(0,1,0);
// 兩端大螢幕：即時比分
(function boards(){const HF=M.half;[-1,1].forEach(s=>{const cv=document.createElement('canvas');cv.width=512;cv.height=256;const tx=new TH.CanvasTexture(cv);
  const m=new TH.Mesh(new TH.PlaneGeometry(6.2,3.0),new TH.MeshBasicMaterial({map:tx,fog:false}));m.position.set(s*(HF+18.28),12.4,0);m.rotation.y=s>0?-Math.PI/2:Math.PI/2;scene.add(m);FX.board.push({cv,tx,last:''});});})();
function boardFrame(){if(!FX.board.length||typeof score==='undefined')return;const key=score.join(':')+state;
  FX.board.forEach(b=>{if(b.last===key)return;b.last=key;const g=b.cv.getContext('2d'),w=512,h=256;g.fillStyle='#0d1118';g.fillRect(0,0,w,h);
    g.fillStyle='#ff7a2a';g.font='bold 30px "Noto Sans TC",sans-serif';g.textAlign='center';g.fillText('熱血排球',w/2,40);
    const cols=[COL[0].shirt,COL[1].shirt];
    [0,1].forEach(t=>{g.fillStyle=cols[t];g.fillRect(t?w/2+8:16,64,w/2-24,150);g.fillStyle='#ffffff';g.font='bold 118px "Noto Sans TC",sans-serif';g.fillText(String(score[t]),t?w*3/4:w/4,182);});
    if(state==='point'){g.fillStyle='#ffe14a';g.font='bold 24px "Noto Sans TC",sans-serif';g.fillText('POINT!',w/2,244);}
    b.tx.needsUpdate=true;});}
// 球網：細分網格，被球打到會鼓起再晃回來
(function netMesh(){let net=null;scene.traverse(o=>{if(o.isMesh&&o.material&&o.material.transparent&&o.material.map&&Math.abs(o.position.y-(NETH-.5))<.01&&o.position.x===0&&o.geometry.parameters&&o.geometry.parameters.width>9)net=o;});
  if(!net)return;const W=net.geometry.parameters.width,g=new TH.PlaneGeometry(W,1,64,10);net.geometry.dispose();net.geometry=g;const P=g.attributes.position,n=P.count;
  FX.net={m:net,P,d:new Float32Array(n),v:new Float32Array(n),u:Float32Array.from({length:n},(_,i)=>P.getX(i)),h:Float32Array.from({length:n},(_,i)=>P.getY(i)),act:0};})();
// z：沿網子的位置；y：高度；s：力道（正負是方向，往 +x 為正）
function netHit(z,y,s){const N=FX.net;if(!N)return;const ly=y-(NETH-.5);for(let i=0;i<N.d.length;i++){const dz=N.u[i]+z,dy=N.h[i]-ly,top=Math.max(0,(.5-N.h[i]))/1,f=Math.exp(-(dz*dz)/.5-(dy*dy)/.35)*Math.min(1,top*1.6);N.v[i]+=s*f;}N.act=2.5;}
function netFrame(dt){const N=FX.net;if(!N||N.act<=0)return;N.act-=dt;dt=Math.min(dt,1/30);
  for(let i=0;i<N.d.length;i++){N.v[i]+=(-90*N.d[i]-5*N.v[i])*dt;N.d[i]+=N.v[i]*dt;N.P.setZ(i,N.d[i]);}
  N.P.needsUpdate=true;}
// 落地痕跡：球落地處留下一圈淡淡的擦痕，幾秒後淡掉
const markG=new TH.RingGeometry(.12,.3,24);markG.rotateX(-Math.PI/2);
function landMark(x,z,v){const m=new TH.Mesh(markG,new TH.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.0,depthWrite:false}));m.position.set(x,.015,z);m.scale.setScalar(.8+Math.min(1.2,v*.08));scene.add(m);FX.marks.push({m,t:0,a:Math.min(.55,.15+v*.03)});}
function marksFrame(dt){for(let i=FX.marks.length-1;i>=0;i--){const k=FX.marks[i];k.t+=dt;const f=k.t<.08?k.t/.08:Math.max(0,1-(k.t-.08)/3.2);k.m.material.opacity=k.a*f;k.m.scale.multiplyScalar(1+dt*.25);
  if(f<=0&&k.t>.1){scene.remove(k.m);k.m.material.dispose();FX.marks.splice(i,1);}}}
// 得分時觀眾歡呼（得分隊伍那一側更熱烈）
{const _p=point;point=function(w,why){const was=state;const r=_p.apply(this,arguments);if(was==='play'&&state==='point'){FX.cheer=1;FX.cheerSide=sd(w);if(lastLand)landMark(lastLand.x,lastLand.z,8);}return r;};}
// 後製：Unreal 光暈（只讓亮的東西發光：球的光圈、天空、白色看台反光）＋ 調色（對比、飽和、暖色、暗角）
const GradeShader={uniforms:{tDiffuse:{value:null},amt:{value:1},imp:{value:0},ca:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform sampler2D tDiffuse;uniform float amt;uniform float imp;uniform float ca;varying vec2 vUv;
  void main(){vec4 c=texture2D(tDiffuse,vUv);vec3 col=c.rgb;
    vec2 cd=(vUv-.5)*ca*.018;col.r=texture2D(tDiffuse,vUv+cd).r;col.b=texture2D(tDiffuse,vUv-cd).b;   // 衝擊色差
    float l=dot(col,vec3(.299,.587,.114));col=mix(vec3(l),col,1.0+.16*amt);          // 飽和
    col=(col-.5)*(1.0+.08*amt)+.5;                                                 // 對比
    col*=mix(vec3(1.),vec3(1.03,1.0,.97),amt);                                     // 微暖
    vec2 d=vUv-.5;float v=smoothstep(.85,.25,length(d*vec2(1.25,1.)));col*=mix(1.,.72+.28*v,amt); // 暗角
    col+=imp*.22*(1.-col);                                                          // 衝擊閃光
    gl_FragColor=vec4(clamp(col,0.,1.),c.a);}`};
function fxSetup(){if(FX.comp!==null||!renderer||!TH.EffectComposer||!TH.UnrealBloomPass)return;try{
  const sz=renderer.getDrawingBufferSize(new TH.Vector2()),rt=renderer.capabilities.isWebGL2&&TH.WebGLMultisampleRenderTarget?new TH.WebGLMultisampleRenderTarget(sz.x,sz.y,{format:TH.RGBAFormat}):undefined;
  const c=new TH.EffectComposer(renderer,rt);c.addPass(new TH.RenderPass(scene,cam));
  FX.bloom=new TH.UnrealBloomPass(new TH.Vector2(sz.x/2,sz.y/2),.28,.4,.93);c.addPass(FX.bloom);
  FX.grade=new TH.ShaderPass(GradeShader);c.addPass(FX.grade);FX.comp=c;}catch(e){FX.comp=false;}}
function fxRender(dt){crowdFrame(dt);if(typeof fx2Frame==='function')fx2Frame(dt);boardFrame();netFrame(dt);marksFrame(dt);
  if(S.gfx>=1&&FX.comp===null)fxSetup();
  if(S.gfx>=1&&FX.comp){const sz=renderer.getDrawingBufferSize(new TH.Vector2());if(FX.comp._w!==sz.x||FX.comp._h!==sz.y){FX.comp._w=sz.x;FX.comp._h=sz.y;FX.comp.setSize(sz.x/renderer.getPixelRatio(),sz.y/renderer.getPixelRatio());FX.comp.setPixelRatio&&FX.comp.setPixelRatio(renderer.getPixelRatio());}
    FX.bloom.enabled=S.gfx>=1;FX.bloom.strength=S.gfx==2?.3:.22;FX.comp.render(dt);}
  else renderer.render(scene,cam);}
