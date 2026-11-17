
// ---------------- 6 3D 呈現 ----------------
const TH=THREE,hudC=$('hud'),hctx=hudC.getContext('2d');
let renderer=null;try{renderer=new TH.WebGLRenderer({canvas:g3,antialias:true,powerPreference:'high-performance'});}catch(e){}
const scene=new TH.Scene(),cam=new TH.PerspectiveCamera(60,1,.1,400);
scene.fog=new TH.Fog('#10141a',40,120);
function ctex(w,h,fn,rep){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new TH.CanvasTexture(c);t.anisotropy=8;if(rep){t.wrapS=t.wrapT=TH.RepeatWrapping;t.repeat.set(rep[0],rep[1]);}return t;}
const gm=new TH.DataTexture(new Uint8Array([120,120,120,255,200,200,200,255,255,255,255,255]),3,1,TH.RGBAFormat);gm.minFilter=gm.magFilter=TH.NearestFilter;gm.needsUpdate=true;
const gmS=new TH.DataTexture(new Uint8Array([200,200,200,255,255,255,255,255]),2,1,TH.RGBAFormat);gmS.minFilter=gmS.magFilter=TH.NearestFilter;gmS.needsUpdate=true;
const MC={},tm=c=>MC[c]||(MC[c]=new TH.MeshToonMaterial({color:c,gradientMap:gm}));
const OUTM=new TH.MeshBasicMaterial({color:'#140d22',side:TH.BackSide});
const lam=(c,map)=>new TH.MeshLambertMaterial({color:c,map:map||null});
scene.add(new TH.HemisphereLight('#fffaf0','#8a6a4a',.6));
const sun=new TH.DirectionalLight('#fff8ec',.55);sun.position.set(3,20,5);scene.add(sun);scene.add(sun.target);
sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-15,right:15,top:12,bottom:-12,near:2,far:60});sun.shadow.bias=-.0006;
// 室內體育館：楓木地板（整片木頭，場內顏色略深）、白線、深藍色防撞牆、淺色牆面與高窗、天花板桁架和燈板
(function(){
  const W=M.wid,HF=M.half,GW=W+6,GL=HF+7,GH=11;   // 牆：|z|=GW、|x|=GL，天花板高 GH
  // 比賽用運動地板（PU 地墊）：場內橘、自由區藍、外圍深灰；細微顆粒＋一點光澤
  const sport=(rgb,seed,grain)=>{let r=seed;const R=()=>(r=(r*16807)%2147483647)/2147483647;return ctex(512,512,(c,w,h)=>{c.fillStyle=`rgb(${rgb})`;c.fillRect(0,0,w,h);
    for(let i=0;i<9000;i++){const v=R();c.fillStyle=v<.5?`rgba(0,0,0,${grain*R()})`:`rgba(255,255,255,${grain*.7*R()})`;c.fillRect(R()*w,R()*h,1.4,1.4);}});};
  const tOut=sport([34,40,47],5,.06),tFree=sport([30,86,132],7,.07),tCourt=sport([214,112,58],11,.07);
  [tOut,tFree,tCourt].forEach(t=>{t.wrapS=t.wrapT=TH.RepeatWrapping;t.anisotropy=16;});tOut.repeat.set(GL/2,GW/2);tFree.repeat.set((HF+3.5)/2,(W+3)/2);tCourt.repeat.set(HF/2,W/2);
  const fm=(t,sh)=>new TH.MeshPhongMaterial({color:'#ffffff',map:t,shininess:sh,specular:new TH.Color('#0e0e0e')}); /* 反光要很淡很散：從上往下看時，太亮的高光點會被光暈特效放大成一大團白光 */
  const floor=new TH.Mesh(new TH.PlaneGeometry(GL*2,GW*2),fm(tOut,8));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
  const free=new TH.Mesh(new TH.PlaneGeometry((HF+3.5)*2,(W+3)*2),fm(tFree,14));free.rotation.x=-Math.PI/2;free.position.y=.002;free.receiveShadow=true;scene.add(free);
  const court=new TH.Mesh(new TH.PlaneGeometry(HF*2,W*2),fm(tCourt,14));court.rotation.x=-Math.PI/2;court.position.y=.004;court.receiveShadow=true;scene.add(court);
  const groups={};const box=(col,x,y,z,sx,sy,sz,ry=0)=>{const g=new TH.BoxGeometry(sx,sy,sz);g.rotateY(ry);g.translate(x,y,z);(groups[col]=groups[col]||[]).push(g);};
  [[0,W,HF*2+.05,.05],[0,-W,HF*2+.05,.05],[HF,0,.05,W*2],[-HF,0,.05,W*2],[0,0,.05,W*2],[3,0,.05,W*2],[-3,0,.05,W*2]].forEach(([x,z,a,b])=>box('#ffffff',x,.012,z,a,.01,b));
  [-3,3].forEach(x=>[-1,1].forEach(s=>{for(let k=0;k<4;k++)box('#ffffff',x,.012,s*(W+.5+k*.7),.05,.01,.35);}));
  // 牆：下段 2.2 公尺深藍防撞墊，上段淺灰牆，頂部一排高窗
  // 牆：深色吸音牆（讓燈光集中在球場上），下段深藍軟墊
  [-1,1].forEach(s=>{box('#151b24',0,1.1,s*(GW-.08),GL*2,2.2,.16);box('#1c222b',0,(GH+2.2)/2,s*GW,GL*2,GH-2.2,.2);box('#151b24',s*(GL-.08),1.1,0,.16,2.2,GW*2);box('#1c222b',s*GL,(GH+2.2)/2,0,.2,GH-2.2,GW*2);
    box('#2a3340',0,2.25,s*(GW-.2),GL*2,.06,.06);box('#2a3340',s*(GL-.2),2.25,0,.06,.06,GW*2);});
  // 天花板桁架
  for(let x=-GL+2;x<=GL-2;x+=4)box('#262c35',x,GH-.4,0,.18,.5,GW*2);
  [-1,0,1].forEach(k=>box('#262c35',0,GH-.75,k*GW*.55,GL*2,.12,.12));
  // 網柱（圓柱、外包防撞墊）與裁判台
  box('#cfd5dc',0,.7,-(W+1.55),.6,.05,.6);box('#cfd5dc',0,.35,-(W+1.55),.06,.7,.06);
  for(const col in groups){const mt=new TH.MeshLambertMaterial({color:col});const m=new TH.Mesh(mergeGeos(groups[col]),mt);m.receiveShadow=true;m.castShadow=col==='#1d3357'&&false;scene.add(m);}
  // 天花板、高窗、燈板（發光）
  const ceil=new TH.Mesh(new TH.PlaneGeometry(GL*2,GW*2),new TH.MeshLambertMaterial({color:'#12161c'}));ceil.rotation.x=Math.PI/2;ceil.position.y=GH;scene.add(ceil);
  // 牆上直向的細燈條（取代高窗）
  const stripM=new TH.MeshBasicMaterial({color:'#7fb6ff'});
  [-1,1].forEach(s=>{for(let x=-GL+2;x<GL-1.5;x+=2.6){const w=new TH.Mesh(new TH.PlaneGeometry(.06,GH-3.4),stripM);w.position.set(x,(GH+2.6)/2,s*(GW-.11));w.rotation.y=s>0?Math.PI:0;scene.add(w);}});
  const lampM=new TH.MeshBasicMaterial({color:'#fffdf4'});
  for(let x=-GL+3;x<=GL-3;x+=4)for(const z of[-GW*.55,0,GW*.55]){const l=new TH.Mesh(new TH.PlaneGeometry(1.6,.5),lampM);l.rotation.x=Math.PI/2;l.position.set(x,GH-.86,z);scene.add(l);}
  // 牆上布條
  const ban=ctex(2048,160,(g,w,h)=>{g.fillStyle='#1d3357';g.fillRect(0,0,w,h);g.font='bold 96px "Noto Sans TC",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#ff7a2a';g.fillText('熱 血 排 球',w*.3,h/2);g.fillStyle='#e9f1f7';g.font='bold 70px "Noto Sans TC",sans-serif';g.fillText('VOLLEYBALL CLUB',w*.72,h/2);});
  const bm=new TH.Mesh(new TH.PlaneGeometry(14,1.1),new TH.MeshBasicMaterial({map:ban}));bm.position.set(0,6.2,-(GW-.11));scene.add(bm);
  // 球網：黑色 10 公分方格、上緣 7 公分白色帶、下緣 5 公分白帶、兩側白色標誌帶（全部畫在同一張高解析貼圖上，網子晃動時一起動）
  const NW=W*2+1.6;
  // 網目用 2 的次方尺寸，才有 mipmap：遠看不會閃爍、不會有鋸齒
  const nt=ctex(4096,512,(c,w,h)=>{const px=w/NW,py=h;c.clearRect(0,0,w,h);
    c.strokeStyle='rgba(22,24,28,.95)';c.lineWidth=2.2;
    for(let x=0;x<=w;x+=px*.1){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}for(let y=0;y<=h;y+=py*.1){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
    // 網目交叉點的結（深一點）
    c.fillStyle='rgba(10,10,12,1)';for(let x=0;x<=w;x+=px*.1)for(let y=0;y<=h;y+=py*.1)c.fillRect(x-2,y-2,4,4);
    // 上緣 7 cm、下緣 5 cm 白帶（有一點陰影線），兩側 5 cm 白色標誌帶
    c.fillStyle='#f6f6f2';c.fillRect(0,0,w,py*.07);c.fillRect(0,h-py*.05,w,py*.05);
    c.fillStyle='rgba(0,0,0,.18)';c.fillRect(0,py*.066,w,py*.006);c.fillRect(0,h-py*.05,w,py*.004);
    [-W,W].forEach(z=>{const x=(z+NW/2)*px;c.fillStyle='#f6f6f2';c.fillRect(x-px*.025,0,px*.05,h);});});
  nt.anisotropy=16;nt.generateMipmaps=true;nt.minFilter=TH.LinearMipmapLinearFilter;
  const net=new TH.Mesh(new TH.PlaneGeometry(NW,1),new TH.MeshLambertMaterial({map:nt,transparent:true,alphaTest:.08,depthWrite:false,side:TH.DoubleSide}));net.userData.isNet=1;net.rotation.y=Math.PI/2;net.position.set(0,NETH-.5,0);net.renderOrder=1;scene.add(net);
  // 上緣白帶做成有厚度的帶子（網子晃動時帶子不動，就像拉緊的鋼索）
  const tape=new TH.Mesh(new TH.BoxGeometry(.02,.07,W*2+.1),lam('#f4f4f0'));tape.position.set(0,NETH-.035,0);scene.add(tape);
  // 網柱：圓柱＋外包軟墊（隊色深藍＋白線），底座
  [-1,1].forEach(s=>{const z=s*(W+1);const post=new TH.Mesh(new TH.CylinderGeometry(.05,.05,2.6,16),lam('#c9ced4'));post.position.set(0,1.3,z);scene.add(post);
    const pad=new TH.Mesh(new TH.CylinderGeometry(.16,.16,1.9,20),lam('#1d3357'));pad.position.set(0,.95,z);scene.add(pad);
    const ring=new TH.Mesh(new TH.CylinderGeometry(.165,.165,.06,20),lam('#ff8a3d'));ring.position.set(0,1.6,z);scene.add(ring);
    const base=new TH.Mesh(new TH.CylinderGeometry(.26,.3,.06,20),lam('#2a3038'));base.position.set(0,.03,z);scene.add(base);});
  // 鋼索、標誌桿（紅白相間，高出網子 80 公分）
  const cab=new TH.MeshLambertMaterial({color:'#9aa0a6'});
  [NETH,NETH-1].forEach(y=>{const c=new TH.Mesh(new TH.CylinderGeometry(.006,.006,W*2+2,6),cab);c.rotation.x=Math.PI/2;c.position.set(0,y,0);scene.add(c);});
  const antT=ctex(16,256,(c,w,h)=>{for(let i=0;i<18;i++){c.fillStyle=i%2?'#f2f2f2':'#e0242c';c.fillRect(0,i*h/18,w,h/18+1);}});
  [-1,1].forEach(s=>{const a=new TH.Mesh(new TH.CylinderGeometry(.005,.005,1.8,8),new TH.MeshLambertMaterial({map:antT}));a.position.set(0,NETH-.1,s*(W+.02));scene.add(a);});
  // LED 廣告看板：圍在自由區外面（一般比賽場地的樣子），會發光
  const led=ctex(2048,128,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#0b1a2e');gr.addColorStop(1,'#071222');g.fillStyle=gr;g.fillRect(0,0,w,h);
    const items=[['熱血排球','#ff8a3d'],['VOLLEYBALL CLUB','#e9f1f7'],['HOT SPIKE','#5ad1ff'],['熱血排球','#ffd23f']];let x=40;
    for(let k=0;k<2;k++)for(const [t,col] of items){g.font='900 64px "Noto Sans TC",sans-serif';g.fillStyle=col;g.textBaseline='middle';g.fillText(t,x,h/2+2);x+=g.measureText(t).width+90;g.fillStyle='rgba(255,255,255,.25)';g.fillRect(x-48,h*.3,4,h*.4);}
    for(let y=0;y<h;y+=4){g.fillStyle='rgba(0,0,0,.18)';g.fillRect(0,y,w,1);}});led.wrapS=TH.RepeatWrapping;
  const ledM=new TH.MeshBasicMaterial({map:led});const AZ=W+4.6,AX=HF+5.5;window.ADB={z:AZ,x:AX,h:.9};
  const adb=(len,x,z,ry,rep)=>{const t=led.clone();t.needsUpdate=true;t.repeat.set(rep,1);const m=new TH.Mesh(new TH.BoxGeometry(len,.9,.12),[lam('#0d1118'),lam('#0d1118'),lam('#0d1118'),lam('#0d1118'),new TH.MeshBasicMaterial({map:t}),new TH.MeshBasicMaterial({map:t})]);m.position.set(x,.45,z);m.rotation.y=ry;scene.add(m);};
  [-1,1].forEach(s=>{adb(AX*2,0,s*AZ,0,2.4);adb(AZ*2-1.4,s*AX,0,Math.PI/2,1.2);});
  window.GYM={W:GW,L:GL,H:GH};
})();
function mergeGeos(list){let n=0;list.forEach(g=>{n+=(g.index?g.index.count:g.attributes.position.count);});const pos=new Float32Array(n*3),nor=new Float32Array(n*3);let o=0;
  list.forEach(g0=>{const g=g0.index?g0.toNonIndexed():g0,P=g.attributes.position.array,N=g.attributes.normal.array;pos.set(P,o);nor.set(N,o);o+=P.length;});
  const geo=new TH.BufferGeometry();geo.setAttribute('position',new TH.BufferAttribute(pos,3));geo.setAttribute('normal',new TH.BufferAttribute(nor,3));return geo;}
// 球、影子、落點、拖影、粒子
// 球：經典 18 片排球（6 個面、每面 3 條皮片，相鄰面的皮片方向互相垂直），皮片之間有縫線凹槽
const BALLC=[['#f6f4ee','#1f4fb8','#f6f4ee'],['#f6f4ee','#f2b81c','#f6f4ee'],['#f6f4ee','#f6f4ee','#f6f4ee']];
const bTex=ctex(1536,1024,(c,w,h)=>{const fw=w/3,fh=h/2;
  for(let f=0;f<6;f++){const ox=(f%3)*fw,oy=Math.floor(f/3)*fh,cols=BALLC[Math.floor(f/2)],vert=Math.floor(f/2)===0;
    for(let k=0;k<3;k++){c.fillStyle=cols[k];if(vert)c.fillRect(ox+k*fw/3,oy,fw/3+1,fh);else c.fillRect(ox,oy+k*fh/3,fw,fh/3+1);}
    // 皮革細紋
    for(let i=0;i<900;i++){c.fillStyle=`rgba(0,0,0,${Math.random()*.035})`;c.fillRect(ox+Math.random()*fw,oy+Math.random()*fh,2,2);}
    // 縫線：深色細線＋兩側淡陰影
    c.lineCap='butt';const seam=(x1,y1,x2,y2)=>{c.strokeStyle='rgba(40,40,50,.18)';c.lineWidth=12;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.strokeStyle='rgba(30,30,40,.75)';c.lineWidth=3.5;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();};
    for(let k=1;k<3;k++){if(vert)seam(ox+k*fw/3,oy,ox+k*fw/3,oy+fh);else seam(ox,oy+k*fh/3,ox+fw,oy+k*fh/3);}
    seam(ox,oy,ox+fw,oy);seam(ox,oy+fh,ox+fw,oy+fh);seam(ox,oy,ox,oy+fh);seam(ox+fw,oy,ox+fw,oy+fh);}});
bTex.anisotropy=8;
function ballGeo(r,n){const P=[],U=[],N=[],I=[];const F=[[[0,0,1],[1,0,0],[0,1,0]],[[0,0,-1],[-1,0,0],[0,1,0]],[[1,0,0],[0,0,-1],[0,1,0]],[[-1,0,0],[0,0,1],[0,1,0]],[[0,1,0],[1,0,0],[0,0,-1]],[[0,-1,0],[1,0,0],[0,0,1]]];
  const order=[0,1,2,3,4,5];   // 面對應的貼圖格：Z 面直條、X 面和 Y 面橫條，相鄰面的皮片互相垂直
  F.forEach(([nn,uu,vv],fi)=>{const cell=order[fi],ox=(cell%3)/3,oy=Math.floor(cell/3)/2,base=P.length/3;
    for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const a=i/n*2-1,b=j/n*2-1,x=nn[0]+uu[0]*a+vv[0]*b,y=nn[1]+uu[1]*a+vv[1]*b,z=nn[2]+uu[2]*a+vv[2]*b,
      // 方塊投影到球面（點分布比較均勻）
      x2=x*x,y2=y*y,z2=z*z,sx=x*Math.sqrt(1-y2/2-z2/2+y2*z2/3),sy=y*Math.sqrt(1-z2/2-x2/2+z2*x2/3),sz=z*Math.sqrt(1-x2/2-y2/2+x2*y2/3);
      P.push(sx*r,sy*r,sz*r);N.push(sx,sy,sz);U.push(ox+(i/n)/3*.998+.001/3,1-(oy+(j/n)/2*.998+.001/2));}
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){const q=base+j*(n+1)+i;I.push(q,q+1,q+n+1,q+1,q+n+2,q+n+1);}});
  const g=new TH.BufferGeometry();g.setAttribute('position',new TH.Float32BufferAttribute(P,3));g.setAttribute('normal',new TH.Float32BufferAttribute(N,3));g.setAttribute('uv',new TH.Float32BufferAttribute(U,2));g.setIndex(I);
  // 繞法統一朝外
  const a0=new TH.Vector3().fromArray(P,0);return g;}
const ballM=new TH.MeshPhongMaterial({map:bTex,shininess:28,specular:new TH.Color('#3a3a3a'),emissive:new TH.Color('#000')});
const ballMesh=new TH.Mesh(ballGeo(BR*1.15,10),ballM);ballMesh.castShadow=true;scene.add(ballMesh);{const o=new TH.Mesh(ballMesh.geometry,OUTM);o.scale.setScalar(1.06);ballMesh.add(o);}
const glow=new TH.Mesh(new TH.SphereGeometry(BR*2.4,16,12),new TH.MeshBasicMaterial({color:'#ff8a2a',transparent:true,opacity:.35,blending:TH.AdditiveBlending,depthWrite:false}));scene.add(glow);
const flatM=(c,o,top)=>new TH.MeshBasicMaterial({color:c,transparent:true,opacity:o,depthWrite:false,depthTest:!top,side:TH.DoubleSide});
const flat=(geo,c,o,top)=>{const m=new TH.Mesh(geo,flatM(c,o,top));m.rotation.x=-Math.PI/2;if(top)m.renderOrder=10;scene.add(m);return m;};
function arcTex(rings){return ctex(256,256,(c,w,h)=>{c.translate(w/2,h/2);c.strokeStyle='#fff';c.lineCap='round';c.shadowColor='#fff';c.shadowBlur=6;rings.forEach(([r,lw,n,gap])=>{c.lineWidth=lw;for(let i=0;i<n;i++){const a0=i/n*Math.PI*2;c.beginPath();c.arc(0,0,r,a0,a0+(Math.PI*2/n)*(1-gap));c.stroke();}});});}
const ARCA=arcTex([[110,9,3,.18],[78,6,4,.3]]),ARCB=arcTex([[124,4,6,.45]]);
const blob=flat(new TH.CircleGeometry(.2,24),'#000',.45),ring=flat(new TH.PlaneGeometry(1.25,1.25),'#fff',1,true),ring2=flat(new TH.PlaneGeometry(1.25,1.25),'#fff',.8,true),disc=flat(new TH.CircleGeometry(.36,40),'#ff2d55',.15,true);
ring.material.map=ARCA;ring2.material.map=ARCB;
const dropL=new TH.Mesh(new TH.CylinderGeometry(.01,.01,1,6).translate(0,.5,0),new TH.MeshBasicMaterial({color:'#fff',transparent:true,opacity:.45,depthWrite:false}));scene.add(dropL);
const meRing=flat(new TH.RingGeometry(.42,.52,32),'#ffcf3a',.85),cueM=flat(new TH.RingGeometry(.3,.42,32),'#ffd60a',1,true),aimM=flat(new TH.PlaneGeometry(1.1,1.1),'#c8ff3a',.95,true);aimM.material.map=ARCA;
const RBN=22,ribGeo=new TH.BufferGeometry();ribGeo.setAttribute('position',new TH.BufferAttribute(new Float32Array(RBN*6),3));{const idx=[];for(let i=0;i<RBN-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}ribGeo.setIndex(idx);}
const ribbon=new TH.Mesh(ribGeo,new TH.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.75,side:TH.DoubleSide,depthWrite:false,blending:TH.AdditiveBlending}));ribbon.frustumCulled=false;scene.add(ribbon);
const _ra=new TH.Vector3(),_rb=new TH.Vector3(),_rc=new TH.Vector3();
function updRibbon(col){const T=ball.trail,N=Math.min(T.length,RBN),P=ribGeo.attributes.position.array,base=T.length-N;
  for(let i=0;i<RBN;i++){const k=Math.min(i,N-1),t=T[base+k],tn=T[base+Math.min(k+1,N-1)],tp=T[base+Math.max(k-1,0)];
    _ra.set(tn.x-tp.x,tn.y-tp.y,tn.z-tp.z).normalize();_rb.set(t.x-cam.position.x,t.y-cam.position.y,t.z-cam.position.z);_rc.crossVectors(_ra,_rb).normalize();const w=BR*1.05*(k/(N-1||1));
    P[i*6]=t.x+_rc.x*w;P[i*6+1]=t.y+_rc.y*w;P[i*6+2]=t.z+_rc.z*w;P[i*6+3]=t.x-_rc.x*w;P[i*6+4]=t.y-_rc.y*w;P[i*6+5]=t.z-_rc.z*w;}
  ribGeo.attributes.position.needsUpdate=true;ribbon.material.color.set(col);}
// 對方扣球的預判提示：攻手在空中時，地上出現一道很淡的光帶指向他要打的方向
const tellTex=ctex(64,256,(c,w,h)=>{const g=c.createLinearGradient(0,h,0,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.55,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,1)');c.fillStyle=g;c.fillRect(0,0,w,h);
  const e=c.createLinearGradient(0,0,w,0);e.addColorStop(0,'rgba(0,0,0,1)');e.addColorStop(.3,'rgba(0,0,0,0)');e.addColorStop(.7,'rgba(0,0,0,0)');e.addColorStop(1,'rgba(0,0,0,1)');c.globalCompositeOperation='destination-out';c.fillStyle=e;c.fillRect(0,0,w,h);});
const tellM=new TH.Mesh(new TH.PlaneGeometry(1,1),new TH.MeshBasicMaterial({map:tellTex,transparent:true,opacity:.2,depthWrite:false,side:TH.DoubleSide}));tellM.rotation.order='YXZ';tellM.renderOrder=2;scene.add(tellM);
const tellD=new TH.Mesh(new TH.CircleGeometry(1,40),new TH.MeshBasicMaterial({color:'#fff',transparent:true,opacity:.12,depthWrite:false}));tellD.rotation.x=-Math.PI/2;tellD.renderOrder=2;scene.add(tellD);
const NP=400,ptsM=new TH.InstancedMesh(new TH.BoxGeometry(.05,.05,.05),new TH.MeshBasicMaterial({color:'#fff'}),NP);ptsM.frustumCulled=false;{const c=new TH.Color('#fff');for(let i=0;i<NP;i++)ptsM.setColorAt(i,c);}scene.add(ptsM);
const dummy=new TH.Object3D(),tmpC=new TH.Color(),ray=new TH.Raycaster();

// ---------------- 角色：隱形骨架 → CC0 GLB ----------------
// 遊戲邏輯驅動一副隱形骨架（髖、膝、腳、脊椎、肩、肘、手、頭），每一幀把模型的每節骨頭轉到和骨架同一個方向。
// 骨頭名稱支援 Mixamo（mixamorig:*）與 Unreal／Quaternius（pelvis、thigh_l…），所以換任何人形 GLB 都能直接用。
const L1=.45,L2=.45,FOOT=.075,HIPY=.98;
const ALIAS={Hips:['Hips','pelvis'],Spine:['Spine','spine_01'],Neck:['Neck','neck_01'],Head:['Head','head'],HeadTop_End:['HeadTop_End'],
  LeftShoulder:['LeftShoulder','clavicle_l'],RightShoulder:['RightShoulder','clavicle_r'],LeftArm:['LeftArm','upperarm_l'],RightArm:['RightArm','upperarm_r'],
  LeftForeArm:['LeftForeArm','lowerarm_l'],RightForeArm:['RightForeArm','lowerarm_r'],LeftHand:['LeftHand','hand_l'],RightHand:['RightHand','hand_r'],
  LeftHandMiddle1:['LeftHandMiddle1','middle_01_l'],RightHandMiddle1:['RightHandMiddle1','middle_01_r'],LeftUpLeg:['LeftUpLeg','thigh_l'],RightUpLeg:['RightUpLeg','thigh_r'],
  LeftLeg:['LeftLeg','calf_l'],RightLeg:['RightLeg','calf_r'],LeftFoot:['LeftFoot','foot_l'],RightFoot:['RightFoot','foot_r'],LeftToeBase:['LeftToeBase','ball_l'],RightToeBase:['RightToeBase','ball_r']};
// VRoid／VRM 的骨頭名稱（J_Bip_*）
{const V={Hips:'C_Hips',Spine:'C_Spine',Neck:'C_Neck',Head:'C_Head',LeftShoulder:'L_Shoulder',RightShoulder:'R_Shoulder',LeftArm:'L_UpperArm',RightArm:'R_UpperArm',LeftForeArm:'L_LowerArm',RightForeArm:'R_LowerArm',
  LeftHand:'L_Hand',RightHand:'R_Hand',LeftHandMiddle1:'L_Middle1',RightHandMiddle1:'R_Middle1',LeftUpLeg:'L_UpperLeg',RightUpLeg:'R_UpperLeg',LeftLeg:'L_LowerLeg',RightLeg:'R_LowerLeg',LeftFoot:'L_Foot',RightFoot:'R_Foot',LeftToeBase:'L_ToeBase',RightToeBase:'R_ToeBase'};
  for(const k in V)ALIAS[k].push('J_Bip_'+V[k]);}
// 找骨頭：先看模型自帶的人形對照表（VRM），再看常見命名，最後用關鍵字猜
function findBone(root,n){const hm=root.userData&&root.userData.hmap;
  if(hm&&hm[n]){const o=root.getObjectByName(hm[n]);if(o&&o.isBone)return o;}
  for(const a of ALIAS[n]||[n])for(const k of [a,'mixamorig'+a,'mixamorig:'+a,'mixamorig_'+a]){const o=root.getObjectByName(k);if(o&&o.isBone)return o;}
  return fuzzyBone(root,n);}
const FZ={Hips:[/hips?$|pelvis/],Spine:[/^spine$|spine0?1?$|spine_?01|abdomen|^waist|上半身$/],Neck:[/neck|首/],Head:[/^head$|head$|頭$/],Shoulder:[/shoulder|clavicle|collar|肩$/],Arm:[/upper_?arm|^arm$|uparm|腕$/],ForeArm:[/fore_?arm|lower_?arm|lowarm|elbow|ひじ/],
  Hand:[/hand$|wrist|手首/],HandMiddle1:[/middle_?(proximal|1|01)/],UpLeg:[/up_?leg|upper_?leg|thigh|^leg$|足$/],Leg:[/^leg$|lower_?leg|calf|shin|knee|ひざ/],Foot:[/foot$|ankle|足首/],ToeBase:[/toe/]};
function fuzzyBone(root,n){const side=n.startsWith('Left')?'l':n.startsWith('Right')?'r':'',part=side?n.replace(/^(Left|Right)/,''):n,pats=FZ[part];if(!pats)return null;
  let best=null;root.traverse(o=>{if(best||!o.isBone)return;let s=o.name.toLowerCase().replace(/mixamorig:?|j_bip_|def-|org-|bip0?1_?/g,'');
    const L=/(^|[^a-z])l([^a-z]|$)|left|[._]l$|^l[._]|左/.test(s),Rr=/(^|[^a-z])r([^a-z]|$)|right|[._]r$|^r[._]|右/.test(s);
    if(side==='l'&&!L||side==='r'&&!Rr||!side&&(L||Rr))return;
    s=s.replace(/left|right|左|右/g,'').replace(/(^|[^a-z])[lr]([^a-z]|$)/g,'$1$2').replace(/^[._\s-]+|[._\s-]+$/g,'');
    if(part==='UpLeg'&&/lower|low|calf|knee/.test(s))return;if(part==='Arm'&&/fore|lower|low/.test(s))return;
    if(pats.some(p=>p.test(s)))best=o;});return best;}
let GLBSRC=null;
function capsule(r,l){return new TH.CylinderGeometry(r,r*.85,l,10).translate(0,-l/2,0);}
let rigs=[];
function buildRig(p,sc=scene){
  const c=COL[p.team],root=new TH.Group(),hips=new TH.Group();hips.position.y=HIPY;root.add(hips);
  const body=tm(c.shirt),dark=tm(c.dark),skin=tm('#f1c9a5');const simple=[];
  const add=(par,geo,mat,x=0,y=0,z=0)=>{const o=new TH.Mesh(geo,mat);o.position.set(x,y,z);par.add(o);simple.push(o);return o;};
  const legs=[-1,1].map(s=>{const th=new TH.Group();th.position.set(s*.092,-.06,0);hips.add(th);add(th,capsule(.075,L1),dark);
    const kn=new TH.Group();kn.position.y=-L1;th.add(kn);add(kn,capsule(.055,L2),skin);const ft=new TH.Group();ft.position.y=-L2;kn.add(ft);add(ft,new TH.BoxGeometry(.1,.07,.24),dark,0,-.03,.05);return{th,kn,ft};});
  const spine=new TH.Group();spine.position.y=.03;hips.add(spine);add(spine,new TH.CylinderGeometry(.17,.15,.55,12).translate(0,.28,0),body);
  const head=new TH.Group();head.position.y=.64;spine.add(head);add(head,new TH.SphereGeometry(.11,14,10),skin,0,.12,0);
  const arms=[-1,1].map(s=>{const sh=new TH.Group();sh.position.set(s*.205,.48,0);spine.add(sh);add(sh,capsule(.05,.3),skin);const el=new TH.Group();el.position.y=-.3;sh.add(el);add(el,capsule(.04,.27),skin);const hd=new TH.Group();hd.position.y=-.27;el.add(hd);return{sh,el,hd};});
  const aura=new TH.Mesh(new TH.SphereGeometry(.7,18,14),new TH.MeshBasicMaterial({color:'#fff',transparent:true,opacity:.2,blending:TH.AdditiveBlending,depthWrite:false}));aura.position.y=1;aura.scale.set(.85,1.45,.85);root.add(aura);
  sc.add(root);const R={g:root,hips,spine,head,legs,arms,aura,simple,pl:p,mw:0};
  const hair=hairGroup(p);
  if(!attachGLB(R,p,hair)){head.add(hair);hair.position.y=.12;hair.scale.setScalar(1.05);}
  return R;}
// 髮型＋頭帶（v7 的角色辨識度）：掛在頭骨上
function hairGroup(p){const g=new TH.Group(),hm=tm(p.ch.hair),st=p.ch.style;
  const P=(geo,x,y,z,rx=0,rz=0,sx=1,sy=1,sz=1)=>{const m=new TH.Mesh(geo,hm);m.position.set(x,y,z);m.rotation.set(rx,0,rz);m.scale.set(sx,sy,sz);g.add(m);const o=new TH.Mesh(geo,OUTM);o.scale.setScalar(1.08);m.add(o);return m;};
  P(new TH.SphereGeometry(.112,20,12,0,Math.PI*2,0,Math.PI*.55),0,.005,-.01,-.35);
  if(st==='spiky')[[-.05,.1,-.02,-.6,-.5],[0,.12,-.04,-.6,0],[.05,.1,-.02,-.6,.5],[-.03,.08,-.09,-.9,-.3],[.035,.07,-.1,-.9,.3]].forEach(([x,y,z,rx,rz])=>P(new TH.ConeGeometry(.04,.13,6),x,y,z,rx,rz));
  if(st==='buns'){P(new TH.SphereGeometry(.045,10,8),-.08,.08,-.03);P(new TH.SphereGeometry(.045,10,8),.08,.08,-.03);}
  if(st==='bowl')P(new TH.CylinderGeometry(.118,.118,.05,22,1,true),0,.01,0);
  if(st==='pony')P(new TH.CylinderGeometry(.04,.015,.3,8).translate(0,-.15,0),0,.04,-.11,.35);
  if(st==='short'){P(new TH.BoxGeometry(.03,.12,.14),-.1,-.02,-.01);P(new TH.BoxGeometry(.03,.12,.14),.1,-.02,-.01);}
  const band=new TH.Mesh(new TH.TorusGeometry(.112,.013,6,28),tm(COL[p.team].band));band.position.y=.02;band.rotation.x=Math.PI/2-.25;g.add(band);
  return g;}
function outlineMat(w){const m=new TH.MeshBasicMaterial({color:'#140d22',side:TH.BackSide,skinning:true});
  m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','vec3 transformed = vec3( position ) + normal * '+w.toFixed(5)+';');};return m;}
function attachGLB(R,p,hair){
  const sk=skinOf(p),src=sk?sk.gltf:GLBSRC;
  if(!src||!TH.SkeletonUtils)return false;
  const c=COL[p.team],m=TH.SkeletonUtils.clone(src.scene);
  // 自訂角色：保留原本的貼圖和顏色，只換成卡通光影；預設人偶：用隊伍顏色
  const toon=(o,mt)=>{if(!mt)return mt;const nm=(mt.name||'')+' '+(o.name||''),flat=/face|eye|mouth|brow|lash/i.test(nm);const n=new TH.MeshToonMaterial({color:mt.color?mt.color.clone():new TH.Color('#fff'),map:mt.map||null,gradientMap:gmS,skinning:!!o.isSkinnedMesh,
      transparent:!!mt.transparent,opacity:mt.opacity??1,alphaTest:mt.alphaTest||(mt.transparent?.05:0),side:mt.side??TH.FrontSide,emissive:mt.emissive?mt.emissive.clone():undefined,emissiveMap:mt.emissiveMap||null});n.name=mt.name;if(flat&&n.map){n.emissive=new TH.Color('#ffffff');n.emissiveMap=n.map;n.emissiveIntensity=.22;}n.userData.wasT=!!mt.transparent;n.userData.op0=mt.opacity??1;if(mt.transparent)n.depthWrite=false;return n;};
  m.traverse(o=>{if(o.isMesh){o.frustumCulled=false;
    if(sk)o.material=Array.isArray(o.material)?o.material.map(mt=>toon(o,mt)):toon(o,o.material);
    else{const nm=((o.material&&o.material.name)||'')+o.name,joint=/joint|dark|shoe/i.test(nm);o.material=new TH.MeshToonMaterial({color:joint?c.dark:c.shirt,gradientMap:gm,skinning:!!o.isSkinnedMesh});}}});
  if(sk){hair=null;
    // 上衣染成隊伍顏色；同一模型依位置換髮色；Seed-san 背後的機械手臂和背包拿掉
    const HAIRS=['#ffffff','#d9a27a','#f2d27a','#c9b6ff'],hc=new TH.Color(HAIRS[(ROLES.indexOf(p.role)+p.team*2)%4]),tc=new TH.Color(c.shirt).lerp(new TH.Color('#ffffff'),.35);
    m.traverse(o=>{if(!o.isMesh)return;const ms=Array.isArray(o.material)?o.material:[o.material],nm=o.name+' '+(o.parent?o.parent.name:'');
      if(/robo_arm/i.test(nm)||ms.some(mt=>/^(backpack|robo_|arm_plastic|armgear|green_emit|anim_logo)/i.test(mt.name||''))){o.visible=false;return;}
      ms.forEach(mt=>{const n=mt.name||'';if(/tops|huku/i.test(n))mt.color.copy(tc);else if(/hair/i.test(n)){const c0=mt.color,wh=c0.r>.9&&c0.g>.9&&c0.b>.9;if(wh)mt.color.copy(hc);else mt.color.lerp(hc,.15);}});});}
  const B={};Object.keys(ALIAS).forEach(n=>B[n]=findBone(m,n));
  if(['Hips','Spine','LeftArm','LeftForeArm','LeftHand','RightArm','RightForeArm','RightHand','LeftUpLeg','LeftLeg','LeftFoot','RightUpLeg','RightLeg','RightFoot'].some(n=>!B[n]))return false;
  const outl=[];m.traverse(o=>{if(o.isSkinnedMesh)outl.push(o);});
  R.g.add(m);m.updateMatrixWorld(true);
  const wp=n=>B[n].getWorldPosition(new TH.Vector3()),legLen=wp('LeftUpLeg').distanceTo(wp('LeftLeg'))+wp('LeftLeg').distanceTo(wp('LeftFoot'));
  m.scale.multiplyScalar((L1+L2)/Math.max(1e-4,legLen));m.updateMatrixWorld(true);
  // 描邊會讓蒙皮網格多畫一次，只在「高」畫質開
  if(S.gfx==2&&!sk)outl.forEach(o=>{const k=o.clone();k.material=outlineMat(.012/m.scale.x);o.parent.add(k);});
  const J=[],inv=new TH.Matrix4();
  const add=(bone,aim,latL,latR,alt)=>{if(!B[bone])return;let tg=B[aim]?wp(aim):alt?alt():null;if(!tg)return;const b=B[bone];inv.copy(b.matrixWorld).invert();
    const a=tg.applyMatrix4(inv).normalize();let l=null;if(latL&&B[latL]&&B[latR])l=wp(latL).applyMatrix4(inv).sub(wp(latR).applyMatrix4(inv)).normalize();J.push({b,name:bone,a,l,q0:b.quaternion.clone()});};
  add('Hips','Spine','LeftUpLeg','RightUpLeg');add('Spine','Neck',B.LeftShoulder?'LeftShoulder':'LeftArm',B.RightShoulder?'RightShoulder':'RightArm',()=>B.Head?wp('Head'):null);
  ['Left','Right'].forEach(s=>{add(s+'Arm',s+'ForeArm');add(s+'ForeArm',s+'Hand');add(s+'Hand',s+'HandMiddle1');add(s+'UpLeg',s+'Leg');add(s+'Leg',s+'Foot');
    add(s+'Foot',s+'ToeBase',null,null,()=>{const f=wp(s+'Foot');f.y-=.05;f.z+=.14;return f;});});
  // 關節鉸鏈：手肘、膝蓋只能往一個方向彎。用「鉸鏈軸」固定上臂、前臂、大腿、小腿的扭轉，關節不會往奇怪的方向折
  {const up=new TH.Vector3(0,1,0),lr=wp('LeftUpLeg').sub(wp('RightUpLeg')).normalize(),fw=new TH.Vector3().crossVectors(lr,up).normalize(),bk=fw.clone().negate(),iv=new TH.Matrix4();
    const H={LeftArm:['LeftForeArm',fw,'hLA'],LeftForeArm:['LeftHand',fw,'hLA'],RightArm:['RightForeArm',fw,'hRA'],RightForeArm:['RightHand',fw,'hRA'],
      LeftUpLeg:['LeftLeg',bk,'hLL'],LeftLeg:['LeftFoot',bk,'hLL'],RightUpLeg:['RightLeg',bk,'hRL'],RightLeg:['RightFoot',bk,'hRL']};
    J.forEach(j=>{const h=H[j.name];if(!h||!B[h[0]])return;const d=wp(h[0]).sub(wp(j.name)).normalize(),hw=new TH.Vector3().crossVectors(d,h[1]);if(hw.lengthSq()<1e-6)return;
      iv.copy(j.b.matrixWorld).invert();j.l=hw.normalize().transformDirection(iv);j.hk=h[2];});}
  inv.copy(B.Hips.matrixWorld).invert();const legMid=wp('LeftUpLeg').add(wp('RightUpLeg')).multiplyScalar(.5).applyMatrix4(inv);
  // 髮型：用綁定姿勢的「左右」與「上」決定方向，掛在頭骨
  const hb=B.Head||B.Neck;if(hb&&hair){const up=new TH.Vector3(0,1,0),lr=wp('LeftUpLeg').sub(wp('RightUpLeg')).normalize(),fw=new TH.Vector3().crossVectors(lr,up).normalize();
    const basis=new TH.Matrix4().makeBasis(lr,up,fw),q=new TH.Quaternion().setFromRotationMatrix(basis),hq=hb.getWorldQuaternion(new TH.Quaternion()),hs=hb.getWorldScale(new TH.Vector3());
    const top=hb.getWorldPosition(new TH.Vector3());top.y+=B.Head?.1:.2;hb.add(hair);hair.position.copy(hb.worldToLocal(top));hair.quaternion.copy(hq.invert().multiply(q));hair.scale.set(1/hs.x,1/hs.y,1/hs.z);}
  // 手指：記下每節手指的綁定姿勢和「往掌心彎」的軸，之後依動作握拳或張開
  const fing=[];['Left','Right'].forEach(sd_=>{const hb=B[sd_+'Hand'];if(!hb)return;const hp=hb.getWorldPosition(new TH.Vector3()),down=new TH.Vector3(0,-1,0);
    hb.traverse(o=>{if(!o.isBone||o===hb)return;const thumb=/thumb/i.test(o.name);if(!o.parent||!o.parent.isBone)return;const a=o.parent===hb?o.getWorldPosition(new TH.Vector3()):o.parent.getWorldPosition(new TH.Vector3()),
      b=o.children.find(c=>c.isBone),fd=(b?b.getWorldPosition(new TH.Vector3()):o.getWorldPosition(new TH.Vector3())).sub(o===hb?hp:o.getWorldPosition(new TH.Vector3()));
      if(fd.lengthSq()<1e-8)fd.copy(o.getWorldPosition(new TH.Vector3()).sub(a));fd.normalize();const ax=new TH.Vector3().crossVectors(fd,down);if(ax.lengthSq()<1e-6)return;
      const pinv=new TH.Matrix4().copy(o.matrixWorld).invert();ax.normalize().transformDirection(pinv);let depth=0;for(let q=o;q&&q!==hb;q=q.parent)depth++;fing.push({b:o,q0:o.quaternion.clone(),ax,k:thumb?[.25,.45,.4][Math.min(2,depth-1)]:[.75,.95,.7][Math.min(2,depth-1)]});});});
  const hand={};['Left','Right'].forEach(sd_=>{const hb=B[sd_+'Hand'],mb=B[sd_+'HandMiddle1'];if(!hb||!mb)return;const iq=hb.getWorldQuaternion(new TH.Quaternion()).invert();
    const hw=hb.getWorldPosition(new TH.Vector3()),fw=mb.getWorldPosition(new TH.Vector3()).sub(hw).normalize();let tb=null;hb.traverse(o=>{if(!tb&&o.isBone&&/thumb.?1|thumb.*proximal/i.test(o.name))tb=o;});
    // 掌心方向用大拇指位置和左右手的手性決定（不依賴模型預設姿勢）：右手 掌心＝大拇指×手指，左手相反
    let nw=new TH.Vector3(0,-1,0);if(tb){const t=tb.getWorldPosition(new TH.Vector3()).sub(hw);t.addScaledVector(fw,-t.dot(fw));if(t.lengthSq()>1e-8){t.normalize();nw=sd_==='Right'?new TH.Vector3().crossVectors(t,fw):new TH.Vector3().crossVectors(fw,t);}}
    const fl=fw.clone().applyQuaternion(iq),nl=nw.clone().applyQuaternion(iq);
    // 手指併攏：食指、無名指、小指的第一節往中指方向收（模型預設手是張開的）
    const adj=[];hb.traverse(o=>{if(!o.isBone||!/(index|ring|little).?1|(index|ring|little).*proximal/i.test(o.name))return;const ch=o.children.find(c=>c.isBone);if(!ch)return;
      const op=o.getWorldPosition(new TH.Vector3()),d=ch.getWorldPosition(new TH.Vector3()).sub(op);d.addScaledVector(nw,-d.dot(nw)).normalize();
      const ang=Math.atan2(new TH.Vector3().crossVectors(d,fw).dot(nw),d.dot(fw));const ax=nw.clone().transformDirection(new TH.Matrix4().copy(o.matrixWorld).invert());adj.push({b:o,ax,ang:ang*1.0});});
    // 大拇指：往手指方向收、並排朝前（真人墊球兩根大拇指併在一起朝前下）
    if(tb){const ch=tb.children.find(c=>c.isBone);if(ch){const op=tb.getWorldPosition(new TH.Vector3()),d=ch.getWorldPosition(new TH.Vector3()).sub(op);d.addScaledVector(nw,-d.dot(nw)).normalize();
      const ang=Math.atan2(new TH.Vector3().crossVectors(d,fw).dot(nw),d.dot(fw));adj.push({b:tb,ax:nw.clone().transformDirection(new TH.Matrix4().copy(tb.matrixWorld).invert()),ang:ang*.75});}}
    nl.addScaledVector(fl,-nl.dot(fl)).normalize();hand[sd_]={fl,nl,adj};});
  R.glb={m,B,J,legMid,fing,hand};
  if(sk){try{accAttach(R,p,sk,m,COL[p.team].shirt);}catch(e){console.warn('配件',e);}}if(sk)R.glb.vx=vrmSetup(R,m,src);R.simple.forEach(o=>o.visible=false);return true;}
const RT={q1:new TH.Quaternion(),q2:new TH.Quaternion(),q3:new TH.Quaternion(),f0:new TH.Quaternion(),f1:new TH.Quaternion(),rq:new TH.Quaternion(),
  a0:new TH.Vector3(),l0:new TH.Vector3(),d:new TH.Vector3(),x:new TH.Vector3(),y:new TH.Vector3(),z:new TH.Vector3(),m:new TH.Matrix4(),w:new TH.Vector3(),mid:new TH.Vector3()};
const PK=['hips','neck','spine','Ls','Rs','Le','Re','Lw','Rw','Lt','Rt','Lh','Rh','Lk','Rk','La','Ra','Lo','Ro','hipX','chestX','hLA','hRA','hLL','hRL'];
// 墊球手型（真人：前臂內側朝上、手掌朝上、一手疊在另一手掌心、大拇指並排朝前下、手腕微往下）
// 原本只控制手臂往哪伸，沒有前臂旋轉和手腕，所以兩手掌會直立貼在一起像拍手。這裡在套到模型之後：先把前臂沿自己的軸轉（掌心朝上），再把手掌轉到目標方向
const HP={a:new TH.Vector3(),n:new TH.Vector3(),f:new TH.Vector3(),c:new TH.Vector3(),u:new TH.Vector3(0,1,0),x:new TH.Vector3(),q:new TH.Quaternion(),q2:new TH.Quaternion(),m1:new TH.Matrix4(),m2:new TH.Matrix4(),p1:new TH.Vector3(),p2:new TH.Vector3()};
function handPlatform(R,k){const G=R.glb,B=G&&G.B;if(!B||!G.hand||k<=.001)return;
  HP.x.set(1,0,0).transformDirection(R.g.matrixWorld);   // 角色的左邊（模型左手在 +X）
  // 兩隻手的手指朝同一個方向（兩條前臂的平均方向），左手疊在右手掌心上
  if(!HP.avg)HP.avg=new TH.Vector3();HP.avg.set(0,0,0);for(const sd_ of ['Left','Right']){const F=B[sd_+'ForeArm'],H=B[sd_+'Hand'];if(!F||!H)return;F.getWorldPosition(HP.p1);H.getWorldPosition(HP.p2);HP.avg.add(HP.p2.sub(HP.p1).normalize());}HP.avg.normalize();
  for(const sd_ of ['Left','Right']){const F=B[sd_+'ForeArm'],H=B[sd_+'Hand'],L=G.hand[sd_];if(!F||!H||!L)continue;const top=sd_==='Left';
    F.getWorldPosition(HP.p1);H.getWorldPosition(HP.p2);HP.a.subVectors(HP.p2,HP.p1).normalize();
    // 目標掌心：朝上（扣掉前臂方向的分量）
    HP.n.copy(HP.u).addScaledVector(HP.a,-HP.u.dot(HP.a)).normalize();
    // 目標手指：順著前臂、手腕往下約 20°、往身體中線偏約 28°（兩手交疊）；上面那隻手稍微往上，避免兩手互相穿過
    HP.f.copy(HP.avg).addScaledVector(HP.n,-HP.avg.dot(HP.n)).normalize().multiplyScalar(Math.cos(.3)).addScaledVector(HP.n,-Math.sin(.3)+(top?.12:-.05)).normalize();
    HP.n.addScaledVector(HP.f,-HP.n.dot(HP.f)).normalize();
    // 1) 前臂沿自己的軸轉 60%（皮膚扭轉分給前臂，手腕不會像糖果紙一樣擰）
    H.getWorldQuaternion(HP.q);HP.c.copy(L.nl).applyQuaternion(HP.q);
    const np=HP.p1.copy(HP.c).addScaledVector(HP.a,-HP.c.dot(HP.a)),tp=HP.p2.copy(HP.n).addScaledVector(HP.a,-HP.n.dot(HP.a));
    if(np.lengthSq()>1e-6&&tp.lengthSq()>1e-6){np.normalize();tp.normalize();const th=Math.atan2(HP.c.crossVectors(np,tp).dot(HP.a),np.dot(tp));
      HP.q.setFromAxisAngle(HP.a,th*.6*k);F.getWorldQuaternion(HP.q2);HP.q2.premultiply(HP.q);F.parent.getWorldQuaternion(HP.q).invert();F.quaternion.copy(HP.q.multiply(HP.q2));F.updateMatrixWorld(true);}
    // 2) 手掌轉到目標：手指方向 f、掌心 n
    HP.c.crossVectors(L.fl,L.nl);HP.m1.makeBasis(L.fl,L.nl,HP.c);HP.p1.crossVectors(HP.f,HP.n);HP.m2.makeBasis(HP.f,HP.n,HP.p1);
    HP.m2.multiply(HP.m1.transpose());HP.q2.setFromRotationMatrix(HP.m2);H.getWorldQuaternion(HP.q);HP.q.slerp(HP.q2,k);
    H.parent.getWorldQuaternion(HP.q2).invert();H.quaternion.copy(HP.q2.multiply(HP.q));
    for(const f of L.adj||[]){HP.q.setFromAxisAngle(f.ax,f.ang*k);f.b.quaternion.multiply(HP.q);}
    H.updateMatrixWorld(true);}}
function frameQ(a,l,out){RT.y.copy(a).normalize();RT.x.copy(l).addScaledVector(RT.y,-l.dot(RT.y)).normalize();RT.z.crossVectors(RT.x,RT.y);RT.m.makeBasis(RT.x,RT.y,RT.z);return out.setFromRotationMatrix(RT.m);}
function retarget(R){
  const G=R.glb;if(!G)return;R.g.updateMatrixWorld(true);
  if(!G.P){G.P={};PK.forEach(k=>G.P[k]=new TH.Vector3());}
  const P=G.P,[aL,aR]=R.arms,[gL,gR]=R.legs,lw=(o,x,y,z,t)=>t.set(x,y,z).applyMatrix4(o.matrixWorld);
  R.hips.getWorldPosition(P.hips);lw(R.spine,0,.6,0,P.neck);R.spine.getWorldPosition(P.spine);
  aR.sh.getWorldPosition(P.Ls);aL.sh.getWorldPosition(P.Rs);aR.el.getWorldPosition(P.Le);aL.el.getWorldPosition(P.Re);aR.hd.getWorldPosition(P.Lw);aL.hd.getWorldPosition(P.Rw);
  lw(aR.hd,0,-.09,0,P.Lt);lw(aL.hd,0,-.09,0,P.Rt);gR.th.getWorldPosition(P.Lh);gL.th.getWorldPosition(P.Rh);gR.kn.getWorldPosition(P.Lk);gL.kn.getWorldPosition(P.Rk);
  gR.ft.getWorldPosition(P.La);gL.ft.getWorldPosition(P.Ra);lw(gR.ft,0,-.04,.16,P.Lo);lw(gL.ft,0,-.04,.16,P.Ro);
  P.hipX.set(1,0,0).applyQuaternion(R.hips.getWorldQuaternion(RT.q3));P.chestX.subVectors(P.Ls,P.Rs);
  P.hLA.set(-1,0,0).applyQuaternion(aR.sh.getWorldQuaternion(RT.q3));P.hRA.set(-1,0,0).applyQuaternion(aL.sh.getWorldQuaternion(RT.q3));P.hLL.set(1,0,0).applyQuaternion(gR.th.getWorldQuaternion(RT.q3));P.hRL.set(1,0,0).applyQuaternion(gL.th.getWorldQuaternion(RT.q3));
  if(R.mw>0&&R.pl&&R.pl.act)blendMocap(R,P,R.pl,R.mw);
  const D2=(a,b)=>RT.d.subVectors(P[a],P[b]);
  const dirOf=n=>{switch(n){case'Hips':return D2('neck','hips');case'Spine':return D2('neck','spine');
    case'LeftArm':return D2('Le','Ls');case'LeftForeArm':return D2('Lw','Le');case'LeftHand':return D2('Lt','Lw');case'RightArm':return D2('Re','Rs');case'RightForeArm':return D2('Rw','Re');case'RightHand':return D2('Rt','Rw');
    case'LeftUpLeg':return D2('Lk','Lh');case'LeftLeg':return D2('La','Lk');case'LeftFoot':return D2('Lo','La');case'RightUpLeg':return D2('Rk','Rh');case'RightLeg':return D2('Ra','Rk');case'RightFoot':return D2('Ro','Ra');}return null;};
  for(const j of G.J){const d=dirOf(j.name);if(!d)continue;d.normalize();const b=j.b;
    b.parent.getWorldQuaternion(RT.q1);RT.q2.copy(RT.q1).multiply(j.q0);RT.a0.copy(j.a).applyQuaternion(RT.q2);
    const lat=j.name==='Hips'?P.hipX:j.name==='Spine'?P.chestX:j.hk?P[j.hk]:null;
    if(j.l&&lat){RT.l0.copy(j.l).applyQuaternion(RT.q2);frameQ(RT.a0,RT.l0,RT.f0);RT.w.copy(d);frameQ(RT.w,lat,RT.f1);RT.rq.copy(RT.f1).multiply(RT.f0.invert());}
    else RT.rq.setFromUnitVectors(RT.a0,d);
    RT.rq.multiply(RT.q2);b.quaternion.copy(RT.q1.invert()).multiply(RT.rq);b.updateWorldMatrix(false,false);
    if(j.name==='Hips'){RT.mid.copy(G.legMid).applyMatrix4(b.matrixWorld);RT.w.addVectors(P.Lh,P.Rh).multiplyScalar(.5).sub(RT.mid);RT.mid.setFromMatrixPosition(b.matrixWorld).add(RT.w);b.parent.worldToLocal(RT.mid);b.position.copy(RT.mid);b.updateWorldMatrix(false,false);}}
  headLook(R,G);}
// 頭看球：影片裡的人物一直盯著球，頭最多轉 50 度、抬 35 度
const HL={d:new TH.Vector3(),hp:new TH.Vector3(),q:new TH.Quaternion(),qy:new TH.Quaternion(),qp:new TH.Quaternion(),pq:new TH.Quaternion(),ax:new TH.Vector3(),up:new TH.Vector3(0,1,0)};
function headLook(R,G){const hb=G.B.Head;if(!hb)return;if(!G.h0)G.h0=hb.quaternion.clone();hb.quaternion.copy(G.h0);hb.updateMatrixWorld(true);
  if(!ball||!R.pl||!(state==='play'||state==='serve')||R.pl.dive>0||R.pl.stun>0){if(R.hl)R.hl.y=R.hl.p=0;return;}
  hb.getWorldPosition(HL.hp);HL.d.set(ball.x,ball.y,ball.z).sub(HL.hp);const L=HL.d.length();if(L<.3)return;
  const yaw=R.g.rotation.y,ay=clamp(angDiff(yaw,Math.atan2(HL.d.x,HL.d.z)),-.9,.9),pit=clamp(Math.atan2(HL.d.y,Math.hypot(HL.d.x,HL.d.z)),-.4,.6),w=R.pl.y>.2?.4:.75;
  R.hl=R.hl||{y:0,p:0};R.hl.y+=(ay*w-R.hl.y)*.25;R.hl.p+=(pit*w-R.hl.p)*.25;
  HL.qy.setFromAxisAngle(HL.up,R.hl.y);HL.ax.set(Math.cos(yaw+R.hl.y),0,-Math.sin(yaw+R.hl.y));HL.qp.setFromAxisAngle(HL.ax,-R.hl.p);
  hb.getWorldQuaternion(HL.q);HL.q.premultiply(HL.qy).premultiply(HL.qp);hb.parent.getWorldQuaternion(HL.pq);hb.quaternion.copy(HL.pq.invert().multiply(HL.q));hb.updateMatrixWorld(true);}
function rebuildRigs(){rigs.forEach(r=>scene.remove(r.g));rigs=players.map(p=>buildRig(p));buildBlobs();blobs.forEach(b=>b.visible=!(S.gfx>=1));rigs.forEach(r=>r.g.traverse(o=>{if(o.isSkinnedMesh||o.isMesh&&o.material&&o.material.isMeshToonMaterial)o.castShadow=true;}));
  rigs.forEach(Rg=>Rg.g.traverse(o=>{if(o.isMesh&&o!==Rg.aura&&o.material&&!Array.isArray(o.material))o.material=o.material.clone();}));
  // 預先編譯著色器，避免第一次看到角色時頓一下
  if(renderer)try{renderer.compile(scene,cam);}catch(e){}}
const BLOBM=new TH.MeshBasicMaterial({color:'#000',transparent:true,opacity:.32,depthWrite:false}),BLOBG=new TH.CircleGeometry(.42,20);let blobs=[];
function buildBlobs(){blobs.forEach(b=>scene.remove(b));blobs=players.map(()=>{const m=new TH.Mesh(BLOBG,BLOBM);m.rotation.x=-Math.PI/2;m.renderOrder=1;scene.add(m);return m;});}
let ALPHA=1;
// 腳步鎖定：腳踩在地上的那段時間，把腳釘在踩下去的位置，用兩節骨的 IK 調整大腿和膝蓋，跑步、側移時腳不會在地上滑
const FL={w:new TH.Vector3(),l:new TH.Vector3(),m:new TH.Matrix4()};
function footLock(p,R,dt,onFeet){if(window.__nofl)return;R.fl=R.fl||[{on:0,k:0,W:new TH.Vector3()},{on:0,k:0,W:new TH.Vector3()}];
  if(!onFeet||p.y>0){R.fl.forEach(f=>{f.on=0;f.k=0;});return;}
  R.g.updateMatrixWorld(true);
  [R.legs[0],R.legs[1]].forEach((g,i)=>{const f=R.fl[i];g.ft.getWorldPosition(FL.w);const lift=FL.w.y-(FOOT+.01);
    const tooFar=f.on&&Math.hypot(FL.w.x-f.W.x,FL.w.z-f.W.z)>.45;
    if(lift<.035&&!tooFar){if(!f.on){f.on=1;f.W.set(FL.w.x,FOOT,FL.w.z);}f.k=Math.min(1,f.k+dt/.06);}
    else{f.on=0;f.k=Math.max(0,f.k-dt/.08);}
    if(f.k<=0)return;
    // 鎖住的位置換到大腿根部的座標，解平面兩節 IK（只動前後擺和膝蓋，左右不動）
    FL.l.copy(f.W);g.th.parent.updateMatrixWorld(true);FL.m.copy(g.th.parent.matrixWorld).invert();FL.l.applyMatrix4(FL.m).sub(g.th.position);
    const dy=FL.l.y,dz=FL.l.z,d=clamp(Math.hypot(dy,dz),.15,L1+L2-.002),t0=Math.atan2(-dz,-dy),
      kn=Math.PI-Math.acos(clamp((L1*L1+L2*L2-d*d)/(2*L1*L2),-1,1)),al=Math.acos(clamp((L1*L1+d*d-L2*L2)/(2*L1*d),-1,1)),th=t0-al;
    if(!isFinite(th)||!isFinite(kn))return;
    g.th.rotation.x=lerp(g.th.rotation.x,th,f.k);g.kn.rotation.x=lerp(g.kn.rotation.x,kn,f.k);
    g.ft.rotation.x=-(R.hips.rotation.x+g.th.rotation.x+g.kn.rotation.x);});}
const legH=(t,k)=>L1*Math.cos(t)+L2*Math.cos(t+k);
// 姿勢：每個關節的目標角度，平滑靠近；站地時用腿角反推骨盆高度，腳踩地
// 真人跑步資料：CMU Graphics Lab Motion Capture Database（mocap.cs.cmu.edu，可自由使用；BVH 轉檔 B. Hahne）
// 20 段慢跑／跑步、21 個完整步伐平均成 32 點的一個週期，再只保留前 3–4 個諧波（去掉雜訊）（左大腿往前最大＝0）。角度單位弧度：大腿與垂直線（往前為正）、膝彎曲、上臂與垂直線（往前為正）、手肘彎曲、軀幹前傾
const GAIT={"jog":{"thL":[0.5877,0.613,0.6074,0.5794,0.5422,0.5088,0.4864,0.4748,0.4664,0.4502,0.4165,0.3605,0.2834,0.1912,0.0917,-0.0076,-0.1008,-0.1834,-0.2508,-0.2983,-0.3213,-0.317,-0.2855,-0.2302,-0.1564,-0.0697,0.0261,0.1288,0.2361,0.3442,0.4454,0.5299],"thR":[-0.078,-0.1925,-0.2805,-0.3323,-0.3461,-0.326,-0.2787,-0.2097,-0.1219,-0.0164,0.1045,0.2348,0.3638,0.4784,0.5672,0.6239,0.6496,0.6514,0.639,0.6209,0.6018,0.5828,0.5627,0.5403,0.5154,0.4877,0.455,0.4128,0.3543,0.2736,0.1697,0.0482],"kL":[1.3933,1.211,0.9994,0.7913,0.6212,0.5154,0.4839,0.5182,0.595,0.6849,0.761,0.806,0.8138,0.7878,0.7366,0.6711,0.6027,0.5432,0.5052,0.5005,0.538,0.6204,0.7426,0.8923,1.0539,1.2119,1.354,1.4712,1.5557,1.5991,1.5911,1.5232],"kR":[0.6271,0.5623,0.5213,0.5217,0.5739,0.6787,0.8272,1.0038,1.19,1.3679,1.5217,1.6386,1.7077,1.721,1.6745,1.5704,1.4191,1.2381,1.0505,0.8791,0.7427,0.6518,0.6078,0.6046,0.6313,0.675,0.7228,0.763,0.7854,0.7824,0.7514,0.6959],"uaL":[-0.68,-0.7338,-0.7714,-0.791,-0.7942,-0.7844,-0.7638,-0.7323,-0.6877,-0.6283,-0.5553,-0.4742,-0.394,-0.3241,-0.271,-0.2363,-0.2168,-0.2069,-0.2017,-0.1995,-0.2015,-0.2107,-0.2291,-0.2561,-0.2887,-0.3236,-0.3591,-0.3964,-0.439,-0.4902,-0.5506,-0.6163],"uaR":[-0.1859,-0.1627,-0.1527,-0.1542,-0.1643,-0.1805,-0.2014,-0.2271,-0.2593,-0.2996,-0.3485,-0.4043,-0.4635,-0.5217,-0.5749,-0.6205,-0.6581,-0.6883,-0.7118,-0.7285,-0.7368,-0.7343,-0.7187,-0.6889,-0.6455,-0.5908,-0.5282,-0.4613,-0.3939,-0.3295,-0.2713,-0.2226],"eL":[1.8268,1.8365,1.8495,1.8641,1.8783,1.8903,1.899,1.9042,1.907,1.9094,1.914,1.9235,1.9395,1.9624,1.9908,2.0217,2.0512,2.0749,2.089,2.0911,2.0807,2.059,2.0285,1.9928,1.9555,1.9197,1.888,1.8618,1.842,1.8289,1.8222,1.8217],"eR":[1.9908,2.0273,2.0535,2.0644,2.0572,2.0317,1.9905,1.9386,1.8824,1.829,1.7842,1.7522,1.735,1.7321,1.7411,1.7583,1.7797,1.8016,1.8208,1.8354,1.8444,1.8476,1.8459,1.8408,1.8344,1.8295,1.8289,1.8353,1.8508,1.876,1.91,1.9498],"lean":[0.2357,0.2326,0.2266,0.2188,0.2108,0.2045,0.2018,0.204,0.2111,0.2222,0.2355,0.2485,0.2587,0.2644,0.2648,0.2603,0.252,0.2419,0.2317,0.223,0.2167,0.213,0.2115,0.2117,0.213,0.2151,0.2179,0.2214,0.2255,0.2298,0.2336,0.2358],"T":0.727,"sp":3.63},"run":{"thL":[0.6111,0.6633,0.6746,0.6513,0.6077,0.5602,0.5213,0.4943,0.4733,0.4468,0.4034,0.3369,0.2483,0.1445,0.0343,-0.0745,-0.1769,-0.2694,-0.3485,-0.4089,-0.444,-0.4484,-0.4201,-0.3622,-0.2816,-0.1857,-0.0801,0.0331,0.1538,0.2805,0.407,0.5219],"thR":[-0.1945,-0.3438,-0.4504,-0.4994,-0.4908,-0.437,-0.3557,-0.2612,-0.16,-0.0507,0.0705,0.2037,0.3416,0.4704,0.5749,0.6449,0.6793,0.6851,0.6734,0.654,0.632,0.6074,0.5788,0.5458,0.5111,0.4773,0.4439,0.404,0.3453,0.2554,0.1287,-0.0279],"kL":[1.4832,1.281,1.0492,0.8233,0.6382,0.5187,0.4737,0.4942,0.5583,0.638,0.708,0.7502,0.7568,0.7282,0.6711,0.5958,0.515,0.4432,0.3955,0.3855,0.4228,0.5103,0.6431,0.8101,0.9963,1.186,1.3648,1.5193,1.636,1.701,1.7012,1.6281],"kR":[0.4585,0.3653,0.3222,0.3536,0.4661,0.6467,0.8687,1.1012,1.3188,1.5063,1.6575,1.7704,1.8415,1.8637,1.8286,1.732,1.5787,1.3847,1.174,0.9725,0.8018,0.6746,0.5949,0.56,0.5631,0.5949,0.6428,0.6904,0.7189,0.7112,0.6587,0.5673],"uaL":[-0.6805,-0.7508,-0.7985,-0.8196,-0.8156,-0.7918,-0.7528,-0.7008,-0.635,-0.5545,-0.4608,-0.3602,-0.2629,-0.1794,-0.1171,-0.0778,-0.0577,-0.0504,-0.0505,-0.056,-0.0684,-0.0905,-0.1233,-0.1645,-0.2093,-0.2526,-0.293,-0.3334,-0.3803,-0.4398,-0.5137,-0.5974],"uaR":[-0.2008,-0.1635,-0.1438,-0.1438,-0.1619,-0.193,-0.2316,-0.2734,-0.3172,-0.3642,-0.4163,-0.4739,-0.5349,-0.5949,-0.6491,-0.6944,-0.7299,-0.7571,-0.7777,-0.7918,-0.7975,-0.7912,-0.7696,-0.7319,-0.6802,-0.6194,-0.555,-0.4908,-0.4284,-0.3674,-0.3077,-0.2508],"eL":[1.7915,1.8127,1.8346,1.8547,1.8711,1.8834,1.8921,1.8987,1.9054,1.915,1.9296,1.9511,1.9801,2.0158,2.056,2.0971,2.1346,2.1636,2.1798,2.18,2.1628,2.1289,2.081,2.0236,1.9622,1.9025,1.8498,1.808,1.7798,1.7657,1.7646,1.7743],"eR":[2.0307,2.0894,2.1295,2.1438,2.1288,2.0855,2.0194,1.9392,1.8554,1.7781,1.7155,1.6724,1.65,1.646,1.6561,1.6747,1.6966,1.7174,1.7343,1.7456,1.751,1.7508,1.7464,1.7396,1.7333,1.7309,1.7365,1.754,1.7861,1.8335,1.894,1.9624],"lean":[0.2489,0.2455,0.2404,0.2345,0.2288,0.2245,0.2229,0.2244,0.2291,0.2365,0.2453,0.2541,0.2615,0.2661,0.2673,0.2651,0.2601,0.253,0.2453,0.2379,0.2318,0.2275,0.2253,0.2252,0.2268,0.2298,0.2338,0.2384,0.2429,0.2468,0.2494,0.2502],"T":0.683,"sp":4.25}};
function gaitS(a,ph){const n=a.length,x=((ph%1)+1)%1*n,i=Math.floor(x),t=x-i,p0=a[(i-1+n)%n],p1=a[i%n],p2=a[(i+1)%n],p3=a[(i+2)%n];   // 週期性 Catmull-Rom，曲線平滑
  return .5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t);}
const _fq=new TH.Quaternion();
// 人體關節範圍（弧度）：手肘只能往前彎、膝蓋只能往後彎、肩膀往後最多約 55°、大腿往後最多約 40°
const JLIM={eL:[-2.5,0],eR:[-2.5,0],kL:[0,2.5],kR:[0,2.5],aLx:[-3.15,.95],aRx:[-3.15,.95],tL:[-2.3,.7],tR:[-2.3,.7],aLz:[-1.3,.75],aRz:[-.75,1.3],sx:[-.45,1.1]};
function poseRig(p,R,dt){
  const a=ALPHA,[aL,aR]=R.arms,[gL,gR]=R.legs;
  R.g.position.set(lerp(p.ox,p.x,a),lerp(p.oy,p.y,a),lerp(p.oz,p.z,a));R.g.rotation.y=angLerp(p.oyaw??p.yaw,p.yaw,a);
  const air=p.y>0,sp=Math.hypot(p.vx,p.vz),run=sp>.12&&!air&&p.dive<=0&&p.stun<=0&&p.rec<=0;const strideL=clamp(1.15+.38*sp,1.3,3.8),phrT=2*Math.PI*Math.max(sp,.8)/strideL;R.phr=lerp(R.phr??phrT,phrT,1-Math.exp(-dt*6));R.ph=(R.ph||0)+dt*R.phr;
  R.rwv=lerp(R.rwv??0,run?clamp((sp-.12)/.9,0,1):0,1-Math.exp(-dt*9));const runW=R.rwv,rw=runW*runW*(3-2*runW);   // 起步、停下時從站姿平順混到跑步姿勢
  const T={pt:0,hy:HIPY,sx:.22,sy:0,tL:-.38,tR:-.38,kL:.75,kR:.75,aLx:-.55,aLz:-.14,aRx:-.55,aRz:.14,eL:-1.15,eR:-1.15};
  if(state==='menu'){T.sx=.05;T.tL=T.tR=-.05;T.kL=T.kR=.1;T.aLx=T.aRx=.05;T.eL=T.eR=-.25;}
  // 得分慶祝（不跳）：贏的一方握拳、雙手舉高、拍手、雙拳收在胸前；輸的一方雙手插腰或手撐膝蓋。每個人錯開一點時間開始
  if(state==='point'&&!air){const i=players.indexOf(p),t=Math.max(0,stT-.12-(i%4)*.09),win=p.team===window.ptWin,pump=.5+.5*Math.sin(t*6.2-1.57),v=i%4;
    T.tL=T.tR=-.08;T.kL=T.kR=.16;T.sx=.06;T.sy=0;T.aLx=T.aRx=.05;T.aLz=-.12;T.aRz=.12;T.eL=T.eR=-.3;
    if(t>0){if(win){if(v===0){T.aRx=lerp(-2.5,-1.45,pump);T.aRz=.3;T.eR=-2.05;T.aLx=-.35;T.eL=-.7;T.sx=.16;T.tL=T.tR=-.3;T.kL=T.kR=.38;T.sy=-.12;}
        else if(v===1){T.aLx=T.aRx=-2.7;T.aLz=-.42;T.aRz=.42;T.eL=T.eR=-.22;T.sx=-.1;T.sy=.08*Math.sin(t*3);}
        else if(v===2){const c=.5+.16*Math.sin(t*13);T.aLx=T.aRx=-1.2;T.aLz=c;T.aRz=-c;T.eL=T.eR=-1.15;T.sx=.12;}
        else{T.aLx=T.aRx=lerp(-1.05,-.6,pump);T.aLz=.12;T.aRz=-.12;T.eL=T.eR=-2.15;T.sx=.24;T.tL=T.tR=-.42;T.kL=T.kR=.55;}}
      else if(i%2){T.pt=.22;T.sx=.6;T.tL=T.tR=-.48;T.kL=T.kR=.6;T.aLx=T.aRx=-.62;T.eL=T.eR=-.12;T.aLz=.08;T.aRz=-.08;}
      else{T.aLx=T.aRx=.12;T.aLz=-.72;T.aRz=.72;T.eL=T.eR=-1.75;T.sx=.04;}}}
  // 跑步（運動員跑法）：骨盆微前傾，手肘約 90 度彎、和腳反向前後擺，往前擺時彎更多、手到胸前，往後擺時手到臀部
  // 跑步：上身挺直（整體只前傾約 3–6 度），支撐腳伸直推地，膝蓋在腳往前擺的時候彎最多（真人跑步的時序）
  // 跑步：全部用平滑曲線（不對稱的擺幅、只往一邊彎的膝蓋都用平滑函數，沒有尖角，關節速度不會突然改變）；速度變化時擺幅慢慢跟上
  // 跑步：直接用真人步伐曲線（慢跑、跑步兩組依速度混合，比資料更快時稍微外插）。上臂大多在身體後方擺動、手肘彎 100–125°、支撐腳膝蓋保持微彎
  if(run||rw>.02){const T0={...T},u=clamp((sp-3.2)/1.0,0,1),ph=R.ph/(2*Math.PI)+.25,g=k=>lerp(gaitS(GAIT.jog[k],ph),gaitS(GAIT.run[k],ph),u);
    const lean=g('lean')*.55;T.pt=lean*.45;T.sx=lean*.55;const tor=T.pt+T.sx;
    T.tL=-g('thL')-T.pt;T.tR=-g('thR')-T.pt;T.kL=g('kL');T.kR=g('kR');
    T.aLx=-g('uaL')-tor;T.aRx=-g('uaR')-tor;T.eL=-g('eL');T.eR=-g('eR');T.aLz=-.1;T.aRz=.1;
    const sw=Math.sin(R.ph);T.sy=.1*sw;R.bnc=.03*Math.min(1,sp/4)*sw*sw;
    for(const k in T)if(T0[k]!==undefined)T[k]=lerp(T0[k],T[k],rw);R.bnc*=rw;}else R.bnc=0;
  const pose=p.stun>0?'stun':p.dive>0?'dive':p.rec>0?'getup':p.swing>0?p.pose:'';
  const blk=air&&Math.abs(p.x)<1.4&&state==='play'&&ball&&ball.lastTeam!==p.team&&Math.sign(ball.x)!==sd(p.team);
  const hitter=air&&!blk&&ball&&((state==='play'&&(p.human||(ball.setInfo&&ball.setInfo.hitter===p)))||(state==='serve'&&server===p));
  // 接球姿勢：雙腳開、蹲低、手臂伸直在身前
  // 接球姿勢（前臂墊球）：骨盆前傾、背打直往前約 30 度、膝蓋在腳尖上方；雙臂伸直往前下方約 40 度，兩手靠攏成平台
  if(p.ready&&!air&&!pose){T.pt=.35;T.tL=T.tR=-1.05-T.pt;T.kL=T.kR=1.45;T.sx=.18;T.aLx=T.aRx=-1.2;T.aLz=.24;T.aRz=-.24;T.eL=T.eR=-.04;}
  // 起跳前蹲：膝蓋深彎、雙臂往後擺
  if(p.loadT>0&&!air){const k=1-p.loadT/.12;T.tL=T.tR=-1.05;T.kL=T.kR=1.7;T.sx=.55;T.aLx=T.aRx=.9+.3*k;T.eL=T.eR=-.15;}
  // 落地緩衝
  if(p.landT>0&&!air&&!pose){T.tL=T.tR=-.85;T.kL=T.kR=1.3;T.sx=.4;T.aLx=T.aRx=-.3;T.eL=T.eR=-.6;}
  // 空中：上升時雙臂往上擺、下降時腿收
  if(air){const up=p.vy>1;T.tL=up?-.5:-.7;T.kL=up?.5:1.1;T.tR=up?-.2:-.25;T.kR=up?.3:.6;T.aLx=T.aRx=up?-2.4:-1.3;T.eL=T.eR=-.3;T.sx=.05;}
  if(p.charging&&air&&pose!=='spike'){const c=p.power;T.aLx=-2.5;T.aLz=-.12;T.eL=-.15;T.aRx=-2.6-.4*c;T.aRz=.4;T.eR=-1.5-.5*c;T.sx=-.35-.25*c;T.sy=.35+.2*c;T.tL=.1;T.kL=1.6;T.tR=-.45;T.kR=1.25;}
  else if(hitter&&pose!=='spike'){if(p.vy>3.2){T.aLx=T.aRx=.95;T.eL=T.eR=-.1;T.sx=.38;T.tL=T.tR=-.45;T.kL=T.kR=.4;}
    else{T.aLx=-2.65;T.aLz=-.12;T.eL=-.15;T.aRx=-2.85;T.aRz=.38;T.eR=-1.75;T.sx=-.42;T.sy=.4;T.tL=.15;T.kL=1.55;T.tR=-.45;T.kR=1.2;}}
  if(pose==='block'||(blk&&pose!=='spike')){T.aLx=T.aRx=-3.02;T.aLz=-.1;T.aRz=.1;T.eL=T.eR=-.06;T.sx=.06;T.sy=0;T.tL=T.tR=-.12;T.kL=T.kR=.3;}
  else if(pose==='spike'){T.aRx=-.8;T.aRz=.05;T.eR=-.08;T.aLx=-.4;T.eL=-.75;T.sx=.55;T.sy=-.38;T.tL=-.7;T.kL=.55;T.tR=-.3;T.kR=.8;}
  else if(pose==='bump'||pose==='dig'){const f=p.swing>.18;T.pt=.3;T.tL=T.tR=(f?-1.1:-.8)-T.pt;T.kL=T.kR=f?1.55:1.15;T.sx=.25;T.aLx=T.aRx=(f?-1.1:-1.35)-.55;T.aLz=.24;T.aRz=-.24;T.eL=T.eR=-.03;}
  else if(pose==='over'){T.aLx=T.aRx=-2.05;T.aLz=-.48;T.aRz=.48;T.eL=T.eR=-.95;T.sx=-.08;T.kL=T.kR=.45;T.tL=T.tR=-.22;}
  // 發球動作（aL＝拋球手，aR＝擊球手；拋球手那側的腳在前）
  if(state==='serve'&&server===p&&!air){const jt=ball.toss&&ball.tossKind==='jump';
    if(!ball.toss){const b=Math.sin(time*2.2)*.03;T.aLx=-1.05+b;T.aLz=.32;T.eL=-.75;T.aRx=-.25;T.aRz=-.05;T.eR=-.55;T.tL=-.32;T.kL=.38;T.tR=.14;T.kR=.12;T.sx=.14;T.sy=-.08;}
    else if(jt){const up=ball.vy>2.4;if(up){T.aLx=T.aRx=-2.6;T.eL=T.eR=-.15;T.sx=.1;}else{T.aLx=T.aRx=.9;T.eL=T.eR=-.15;T.sx=.4;}}
    else{const ta=time-(p.tossAt||time),k=clamp(ta/.28,0,1),c=clamp((ta-.15)/.35,0,1);
      T.aLx=lerp(-1.05,-2.95,k);T.aLz=lerp(.32,.08,k);T.eL=lerp(-.75,-.05,k);
      T.aRx=lerp(-.4,-2.45,c);T.aRz=lerp(0,.75,c);T.eR=lerp(-.6,-1.55,c);T.sy=lerp(-.08,.42,c);T.sx=lerp(.12,-.18,c);
      T.tL=-.3;T.kL=.32;T.tR=lerp(.14,.02,c);T.kR=lerp(.12,.38,c);}}
  // 站發擊球與收手：擊球手由頭頂往前下揮，拋球手收到胸前，後腳往前踏
  if(pose==='serve'&&!air){const k=1-p.swing/.5;
    if(k<.18){T.aRx=-2.9;T.aRz=.28;T.eR=-.08;T.aLx=-1.4;T.eL=-1.1;T.sx=.05;T.sy=.1;}
    else{const f=clamp((k-.18)/.5,0,1);T.aRx=lerp(-2.6,-.7,f);T.aRz=lerp(.1,-.35,f);T.eR=lerp(-.1,-.35,f);T.aLx=lerp(-1.2,-.5,f);T.eL=-1.15;T.sx=lerp(.15,.38,f);T.sy=lerp(.05,-.3,f);T.tR=lerp(.05,-.45,f);T.kR=lerp(.3,.55,f);T.tL=.1;T.kL=.2;}}
  // 手去碰球：接球姿勢或墊球時，球靠近就把雙臂平台對準球（簡化的手臂 IK），接觸那一刻手真的在球的位置
  if((p.ready||pose==='bump'||pose==='dig')&&!air&&ball&&state==='play'){const bx=ball.x-p.x,bz=ball.z-p.z,fd=Math.sin(p.yaw)*bx+Math.cos(p.yaw)*bz,dist=Math.hypot(bx,bz,ball.y-1);
    if(fd>.1&&dist<1.8&&ball.y<1.7){const sy=1.1,dy=ball.y-sy,k=clamp((1.8-dist)/1.0,0,1),world=-Math.atan2(fd,-dy),tor=T.pt+T.sx;
      const want=clamp(world-tor,-2.4,-.4);T.aLx=T.aRx=lerp(T.aLx,want,k);T.eL=T.eR=lerp(T.eL,-.02,k);}}
  if(pose==='dive'){const k=1-p.dive/(p.diveT||.5);
    if(k<.22){T.pt=.6;T.hy=.72;T.sx=.25;T.aLx=T.aRx=-1.4;T.eL=T.eR=-.2;T.tL=-1.05;T.kL=1.2;T.tR=.35;T.kR=.5;}
    else if(k<.62){T.pt=1.38;T.hy=.48;T.sx=-.1;T.aLx=T.aRx=-2.95;T.aLz=.15;T.aRz=-.15;T.eL=T.eR=0;T.tL=.25;T.kL=.25;T.tR=.4;T.kR=.35;}
    else{T.pt=1.52;T.hy=.24;T.sx=-.15;T.aLx=T.aRx=-2.95;T.aLz=.2;T.aRz=-.2;T.eL=T.eR=0;T.tL=.15;T.kL=.4;T.tR=.2;T.kR=.6;}}
  if(pose==='getup'){const k=1-p.rec/.5;if(k<.45){T.pt=1.45;T.hy=.28;T.aLx=T.aRx=-1.55;T.eL=T.eR=-.5;T.tL=T.tR=.1;T.kL=T.kR=1.2;}else{T.pt=.35;T.hy=.6;T.sx=.3;T.aLx=T.aRx=-.8;T.tL=-1.2;T.kL=1.8;T.tR=-.3;T.kR=1.6;}}
  if(pose==='stun'){T.pt=-1.25;T.hy=.32;T.aLx=-2.4;T.aRx=-2;T.aLz=-.7;T.aRz=.7;T.eL=T.eR=-.4;T.tL=-.8;T.tR=-.4;T.kL=T.kR=.6;}
  // 慣性過渡（Inertialization，《戰爭機器》的作法）：輸出＝新目標＋一段會自己消失的「差值」。
  // 目標突然換姿勢時，跳掉的那段不直接套上，而是記成差值，並把當下的關節速度一起帶過去，再用臨界阻尼彈簧收斂到 0。
  // 好處：新動作立刻以完整幅度播放（跑步擺臂不會被削弱），切換時又保留原本的速度，不會頓一下或跳格。
  const hl=pose==='spike'||pose==='serve'?.065:p.charging||p.loadT>0?.07:pose==='bump'||pose==='dig'?.06:pose==='dive'||pose==='stun'||pose==='getup'?.1:p.landT>0?.09:.12,w=1.68/hl;
  const C=R.c||(R.c={...T}),O=R.o||(R.o={}),OV=R.ov||(R.ov={}),TP=R.tp||(R.tp={...T}),CV=R.cv||(R.cv={});
  const lim=(pose==='spike'||pose==='serve'?30:18)*dt,idt=1/Math.max(dt,1e-4);
  // 部位先後（參考 MECH-CORDON）：手臂的目標加上「軀幹角速度 × −0.045 秒」，軀幹往前彎時手臂慢半拍跟上，動作有慣性和層次
  {const CVp=R.cv||{},kk=1-Math.exp(-dt*10);R.lgw=lerp(R.lgw||0,((CVp.sx||0)+(CVp.pt||0))*-.045,kk);R.lgy=lerp(R.lgy||0,(CVp.sy||0)*-.045,kk);const tw=R.lgw,ty=R.lgy,lg=x=>clamp(x,-.3,.3);
    if(T.aLx!==undefined){T.aLx+=lg(tw);T.aRx+=lg(tw);}if(T.aLz!==undefined){T.aLz+=lg(ty)*.5;T.aRz+=lg(ty)*.5;}}
  // 目標每格的變化在 lim 以內＝連續動作（記下目標速度）；超過＝換姿勢：整段跳變交給差值，差值速度＝目前輸出速度－目標原本的速度
  const TV=R.tv||(R.tv={});
  for(const key in T){const t=T[key],tp=TP[key]??t,d=t-tp;let o=O[key]||0,ov=OV[key]||0;
    if(Math.abs(d)>lim){o-=d;ov=(CV[key]||0)-(TV[key]||0);}else TV[key]=lerp(TV[key]||0,d*idt,.5);
    const e=Math.exp(-w*dt),j=ov+w*o;o=(o+j*dt)*e;ov=(ov-w*j*dt)*e;ov=clamp(ov,pose==='spike'||pose==='serve'?-20:-12,pose==='spike'||pose==='serve'?20:12);
    const out=t+o;CV[key]=(out-(C[key]??out))*idt;C[key]=out;O[key]=o;OV[key]=ov;TP[key]=t;}
  // 最後一道：每個關節每秒最多轉幾弧度（扣球、發球揮臂 20，其他 11），大轉換會分好幾格走完，不會一格跳過去
  {const CP=R.cp||(R.cp={...C}),mr=40*dt;for(const k in C){const pv=CP[k];if(pv!==undefined){const d=C[k]-pv;if(d>mr)C[k]=pv+mr;else if(d<-mr)C[k]=pv-mr;}}}
  for(const k in JLIM)if(C[k]!==undefined){const [a,b]=JLIM[k],v=C[k];if(v>b){const o=v-b;C[k]=b+o/(1+o/.06);}else if(v<a){const o=a-v;C[k]=a-o/(1+o/.06);}}
  Object.assign(R.cp,C);
  const onFeet=!air&&pose!=='dive'&&pose!=='getup'&&pose!=='stun';
  R.hips.position.y=onFeet?Math.max(legH(C.pt+C.tL,C.kL),legH(C.pt+C.tR,C.kR))+FOOT+.03+(R.bnc||0):(air?HIPY:C.hy);
  R.hips.rotation.x=C.pt;R.spine.rotation.set(C.sx,C.sy,0);
  gL.th.rotation.x=C.tL;gR.th.rotation.x=C.tR;gL.kn.rotation.x=C.kL;gR.kn.rotation.x=C.kR;
  gL.ft.rotation.x=onFeet?-(C.pt+C.tL+C.kL):.35;gR.ft.rotation.x=onFeet?-(C.pt+C.tR+C.kR):.35;
  aL.sh.rotation.set(C.aLx,0,C.aLz);aR.sh.rotation.set(C.aRx,0,C.aRz);aL.el.rotation.x=C.eL;aR.el.rotation.x=C.eR;
  footLock(p,R,dt,onFeet);
  const au=null;
  R.aura.visible=!!au;if(au){R.aura.material.color.set(au);R.aura.material.opacity=.14+.07*Math.sin(time*12);}
  // 真人動作：接球姿勢、等球時循環；其他動作由遊戲事件觸發
  if(!p.act&&MOCAP.ready&&!air&&p.dive<=0&&p.stun<=0&&(p.ready||(state==='play'&&!p.human&&ball&&ball.call&&ball.call[p.team]===p&&ball.lastTeam!==p.team))){const c=MOCAP.ready;playAct(p,'ready',clipKey(c),{hold:clipKey(c),until:()=>!(p.ready||(state==='play'&&ball&&ball.call&&ball.call[p.team]===p&&ball.lastTeam!==p.team))||p.y>0});}
  R.mw=tickAct(p,dt);
  if(R.glb){retarget(R);
    // 手指：跑步握鬆拳、接球（前臂墊球）手掌攤平併攏、扣球攔網張開、平常微彎
    const ct=run?1.05:(p.ready||pose==='bump'||pose==='dig')?.42:(pose==='spike'||pose==='serve'||pose==='block'||air)?.12:(state==='serve'&&server===p&&!ball.toss)?.55:.42;
    R.fc=lerp(R.fc??ct,ct,1-Math.exp(-dt*14));const F=R.glb.fing;if(F)for(const f of F){_fq.setFromAxisAngle(f.ax,R.fc*f.k);f.b.quaternion.copy(f.q0).multiply(_fq);}
    {const on=(p.ready||pose==='bump'||pose==='dig')&&!air;R.hk=lerp(R.hk||0,on?1:0,1-Math.exp(-dt*14));handPlatform(R,R.hk);}
    vrmPost(R,dt);}
  // 給模擬用：拋球手掌心、擊球手肩膀的世界座標（發球時球放在手上）
  {const hp=p.holdP||(p.holdP=new TH.Vector3()),hs=p.hitS||(p.hitS=new TH.Vector3()),B=R.glb&&R.glb.B;
    if(B&&B.RightHand){B.RightHand.getWorldPosition(hp);if(B.RightHandMiddle1){B.RightHandMiddle1.getWorldPosition(RT.w);hp.lerp(RT.w,.6);}B.LeftArm.getWorldPosition(hs);}
    else{R.g.updateMatrixWorld(true);hp.set(0,-.08,0).applyMatrix4(aL.hd.matrixWorld);aR.sh.getWorldPosition(hs);}}}
