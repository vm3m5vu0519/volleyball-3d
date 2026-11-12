
// ---------------- 打擊、接球特效 ----------------
// 都是「看鏡頭的面片」：光爆（星芒）、衝擊環、火花、灰塵；地上會留衝擊裂痕。另外有球的殘影、畫面集中線、閃光＋色差
const FX2={pool:[],live:[],ghosts:[],lines:0,lineCol:'#ffffff',imp:0,ca:0,dustT:0};
function _ctex(n,fn){const c=document.createElement('canvas');c.width=c.height=n;fn(c.getContext('2d'),n);const t=new TH.CanvasTexture(c);return t;}
const FXT={
  glow:_ctex(128,(g,n)=>{const r=g.createRadialGradient(n/2,n/2,0,n/2,n/2,n/2);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.75)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,n,n);}),
  ring:_ctex(256,(g,n)=>{for(let i=0;i<3;i++){g.strokeStyle=`rgba(255,255,255,${[.25,.6,1][i]})`;g.lineWidth=[22,12,5][i];g.beginPath();g.arc(n/2,n/2,n/2-16,0,7);g.stroke();}}),
  star:_ctex(256,(g,n)=>{g.translate(n/2,n/2);const r=g.createRadialGradient(0,0,0,0,0,n*.18);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(-n/2,-n/2,n,n);
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2+(i%2)*.13,L=(i%3===0?.5:.32)*n,w=i%3===0?.05:.03;g.save();g.rotate(a);const lg=g.createLinearGradient(0,0,L,0);lg.addColorStop(0,'rgba(255,255,255,1)');lg.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=lg;
      g.beginPath();g.moveTo(0,-w*n);g.lineTo(L,0);g.lineTo(0,w*n);g.fill();g.restore();}}),
  puff:_ctex(128,(g,n)=>{for(let i=0;i<14;i++){const x=n/2+(Math.random()-.5)*n*.35,y=n/2+(Math.random()-.5)*n*.35,rr=n*(.14+Math.random()*.16),r=g.createRadialGradient(x,y,0,x,y,rr);r.addColorStop(0,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,n,n);}}),
  crack:_ctex(256,(g,n)=>{g.translate(n/2,n/2);g.strokeStyle='rgba(40,20,10,.9)';g.lineCap='round';
    for(let i=0;i<11;i++){let a=i/11*Math.PI*2+Math.random()*.4,x=0,y=0,L=n*(.22+Math.random()*.24);g.lineWidth=4;g.beginPath();g.moveTo(Math.cos(a)*n*.05,Math.sin(a)*n*.05);
      for(let s=0;s<5;s++){a+=(Math.random()-.5)*.5;x=Math.cos(a)*L*(s+1)/5;y=Math.sin(a)*L*(s+1)/5;g.lineTo(x,y);g.lineWidth=Math.max(1,4-s*.7);}g.stroke();}
    const r=g.createRadialGradient(0,0,0,0,0,n*.16);r.addColorStop(0,'rgba(30,15,8,.55)');r.addColorStop(1,'rgba(30,15,8,0)');g.fillStyle=r;g.fillRect(-n/2,-n/2,n,n);})};
const FXG=new TH.PlaneGeometry(1,1),FXGF=new TH.PlaneGeometry(1,1).rotateX(-Math.PI/2);
function fxSpawn(o){if(FX2.live.length>400){const old=FX2.live.shift();scene.remove(old);FX2.pool.push(old);}let m=FX2.pool.pop();if(!m){m=new TH.Mesh(FXG,new TH.MeshBasicMaterial({transparent:true,depthWrite:false,fog:false}));m.frustumCulled=false;}
  const add=o.add!==false;m.material.map=FXT[o.tex];o.a=(o.a??1)*(add?.7:1);m.material.blending=add?TH.AdditiveBlending:TH.NormalBlending;m.material.color.set(o.col||'#fff');m.material.needsUpdate=true;
  m.geometry=o.flat?FXGF:FXG;m.position.set(o.x,o.y,o.z);m.renderOrder=o.flat?1:5;m.material.depthTest=o.flat?true:!!o.depth;
  Object.assign(m.userData,{t:0,life:o.life||.4,s0:o.s0||.3,s1:o.s1??o.s0,a0:o.a??1,vx:o.vx||0,vy:o.vy||0,vz:o.vz||0,g:o.g||0,rot:o.rot||0,spin:o.spin||0,flat:!!o.flat,fade:o.fade||'out',drag:o.drag||0});
  scene.add(m);FX2.live.push(m);return m;}
const _fxq=new TH.Quaternion(),_fxz=new TH.Vector3(0,0,1);
function fx2Frame(dt){
  for(let i=FX2.live.length-1;i>=0;i--){const m=FX2.live[i],u=m.userData;u.t+=dt;const k=u.t/u.life;
    if(k>=1){scene.remove(m);FX2.live.splice(i,1);FX2.pool.push(m);continue;}
    u.vy-=u.g*dt;if(u.drag){const d=Math.exp(-u.drag*dt);u.vx*=d;u.vy*=d;u.vz*=d;}m.position.x+=u.vx*dt;m.position.y+=u.vy*dt;m.position.z+=u.vz*dt;
    const e=1-Math.pow(1-k,3),s=u.s0+(u.s1-u.s0)*e;m.scale.set(s,s,s);
    m.material.opacity=u.a0*(u.fade==='in-out'?Math.sin(k*Math.PI):u.fade==='late'?(k<.5?1:1-(k-.5)*2):1-k);
    if(!u.flat){m.quaternion.copy(cam.quaternion);u.rot+=u.spin*dt;_fxq.setFromAxisAngle(_fxz,u.rot);m.quaternion.multiply(_fxq);}}
  // 球的殘影：扣球、跳發這種重球，球後面留下 4 顆漸淡的影子
  const fast=ball&&state==='play'&&(ball.atk||ball.serve&&ball.drive)&&Math.hypot(ball.vx,ball.vy,ball.vz)>11&&ball.trail.length>8&&S.gfx>=1;
  if(!FX2.ghosts.length&&typeof ballMesh!=='undefined'){for(let i=0;i<4;i++){const g=new TH.Mesh(ballMesh.geometry,new TH.MeshBasicMaterial({color:'#ffffff',transparent:true,depthWrite:false,blending:TH.AdditiveBlending,map:ballMesh.material.map||null}));g.visible=false;scene.add(g);FX2.ghosts.push(g);}}
  FX2.ghosts.forEach((g,i)=>{g.visible=!!fast;if(!fast)return;const tp=ball.trail[Math.max(0,ball.trail.length-3-i*2)];g.position.set(tp.x,tp.y,tp.z);g.scale.setScalar(ballMesh.scale.x*(1-.08*i));g.quaternion.copy(ballMesh.quaternion);g.material.opacity=.32-.07*i;g.material.color.set(ball.atk?'#ffe7a0':'#cfe9ff');});
  // 飛撲滑地：腳下揚起灰塵
  FX2.dustT-=dt;if(FX2.dustT<=0&&S.gfx>=1){FX2.dustT=.05;for(const p of players)if(p.dive>0&&p.y<=.05&&Math.hypot(p.vx,p.vz)>1.5)fxSpawn({tex:'puff',add:false,col:'#efe2d2',x:p.x+(rnd()-.5)*.3,y:.15,z:p.z+(rnd()-.5)*.3,s0:.3,s1:.9,life:.55,a:.3,vy:.4,rot:rnd()*6});}
  // 畫面閃光、色差慢慢退
  FX2.imp=Math.max(0,FX2.imp-dt*6);FX2.ca=Math.max(0,FX2.ca-dt*4);FX2.lines=Math.max(0,FX2.lines-dt);
  if(FX&&FX.grade){FX.grade.uniforms.imp.value=FX2.imp;FX.grade.uniforms.ca.value=FX2.ca;}}
// ------ 組合好的特效 ------
function fxSparks(x,y,z,col,n,sp,up=1){for(let i=0;i<n;i++){const a=rnd()*Math.PI*2,e=rnd()*1.2-.2,s=sp*(.4+rnd()*.8);
  fxSpawn({tex:'glow',col,x,y,z,vx:Math.cos(a)*Math.cos(e)*s,vy:Math.sin(e)*s*up+1,vz:Math.sin(a)*Math.cos(e)*s,g:9,drag:2.2,s0:.09+rnd()*.06,s1:.02,life:.35+rnd()*.3});}}
function fxImpact(x,y,z,col,big){
  fxSpawn({tex:'star',col,x,y,z,s0:.4*big,s1:1.5*big,life:.18+.06*big,a:1,rot:rnd()*6,spin:3,depth:false});
  fxSpawn({tex:'glow',col:'#fff6dc',x,y,z,s0:.6*big,s1:.15,life:.1,a:.75});
  fxSpawn({tex:'ring',col,x,y,z,s0:.2,s1:2.2*big,life:.3,a:.9});
  if(big>1.2)fxSpawn({tex:'ring',col:'#ffffff',x,y,z,s0:.1,s1:3.4*big,life:.42,a:.5});}
// p：誰打的；act：pass/set/spike/tip/over；q：好壞 0–1；k：接球型態（bump/dig/over/air）；v：來球速度
function hitFx(p,act,q,k,v,wasAtk){if(S.gfx<1&&!p.human)return;const x=ball.x,y=ball.y,z=ball.z,perfect=q>.82,me=p.human;
  if(act==='spike'){const col=perfect?'#ffd23f':'#ffffff',big=perfect?1.6:1.15;fxImpact(x,y,z,col,big);fxSparks(x,y,z,perfect?'#ffcf4a':'#ffffff',perfect?22:12,6);
    if(me){FX2.imp=perfect?1:.6;FX2.ca=perfect?1:.55;FX2.lines=perfect?.45:.3;FX2.lineCol=perfect?'#fff2b0':'#ffffff';}else if(perfect){FX2.ca=.35;}}
  else if(act==='tip'){fxSpawn({tex:'ring',col:'#c9f0ff',x,y,z,s0:.15,s1:.9,life:.25,a:.8});fxSparks(x,y,z,'#ffffff',5,2);}
  else if(act==='set'||k==='over'){// 舉球：手指輕觸，一圈柔和光環加幾顆閃光
    fxSpawn({tex:'ring',col:perfect?'#ffe680':'#d9f6ff',x,y,z,s0:.15,s1:1.1,life:.3,a:.8});fxSpawn({tex:'glow',col:'#fff8e8',x,y,z,s0:.45,s1:.15,life:.12,a:.55});
    if(perfect)for(let i=0;i<6;i++)fxSpawn({tex:'star',col:'#fff3b0',x:x+(rnd()-.5)*.5,y:y+(rnd()-.2)*.5,z:z+(rnd()-.5)*.5,s0:.05,s1:.28,life:.4,fade:'in-out',rot:rnd()*6,spin:2});}
  else{// 接球（墊球、救球）：前臂接觸的悶擊，白色衝擊環＋粉塵；接重球時更大；完美接球帶金色
    const hard=wasAtk&&v>14,col=perfect?'#ffe27a':q>.5?'#bff3ff':'#c8ccd6',big=hard?1.35:1;
    fxSpawn({tex:'ring',col,x,y,z,s0:.2,s1:1.4*big,life:.3,a:.8});fxSpawn({tex:'glow',col:'#fff8e8',x,y,z,s0:.5*big,s1:.15,life:.12,a:.55});
    for(let i=0;i<(hard?5:3);i++)fxSpawn({tex:'puff',add:false,col:'#e9e4dc',x:x+(rnd()-.5)*.3,y:y+(rnd()-.5)*.2,z:z+(rnd()-.5)*.3,vx:(rnd()-.5)*1.4,vy:rnd()*.8,vz:(rnd()-.5)*1.4,drag:3,s0:.2,s1:.6+rnd()*.3,life:.4+rnd()*.15,a:.22,rot:rnd()*6});
    if(perfect){fxSparks(x,y,z,'#ffd23f',10,3);fxSpawn({tex:'star',col:'#ffe27a',x,y,z,s0:.3,s1:1.1,life:.22,rot:rnd()*6,spin:2,depth:false});}
    if(k==='dig'){fxSpawn({tex:'ring',flat:true,col:'#ffffff',x:p.x,y:.03,z:p.z,s0:.4,s1:2.2,life:.4,a:.6});}
    if(me&&hard){FX2.imp=.35;FX2.ca=.3;}}}
function blockFx(x,y,z,kind){const col=kind==='stuff'?'#7af0c0':kind==='tool'?'#ff8a2a':'#c9f0ff';fxImpact(x,y,z,col,kind==='stuff'?1.7:1.1);fxSparks(x,y,z,col,kind==='stuff'?20:10,5);
  if(typeof netHit==='function')netHit(z,y-.3,(ball.vx>0?1:-1)*4);if(kind==='stuff'){FX2.imp=.7;FX2.ca=.6;}}
// 落地：重球打到地板＝地面衝擊環、灰塵、裂痕；輕球只有一點粉塵
function landFx(x,z,v,heavy){const big=heavy?clamp(v/18,1,1.8):.7;
  fxSpawn({tex:'ring',flat:true,col:heavy?'#ffe7a0':'#ffffff',x,y:.03,z,s0:.3,s1:(heavy?3.4:1.6)*big,life:heavy?.5:.35,a:heavy?.9:.5});
  if(heavy){fxSpawn({tex:'ring',flat:true,col:'#ffffff',x,y:.035,z,s0:.2,s1:5*big,life:.7,a:.4});fxSpawn({tex:'crack',flat:true,add:false,col:'#ffffff',x,y:.02,z,s0:1.1*big,s1:1.25*big,life:3.2,a:.75,fade:'late'});
    fxSpawn({tex:'star',col:'#ffffff',x,y:.2,z,s0:.5,s1:2*big,life:.2,rot:rnd()*6,depth:false});fxSparks(x,.15,z,'#fff2c0',14,5,1.4);}
  for(let i=0;i<(heavy?10:4);i++){const a=rnd()*Math.PI*2,s=(heavy?2.6:1.2)*(.5+rnd());fxSpawn({tex:'puff',add:false,col:'#f3e6d8',x,y:.12,z,vx:Math.cos(a)*s,vy:.3+rnd()*.6,vz:Math.sin(a)*s,drag:2.5,s0:.3,s1:1.1+rnd()*.5,life:.65+rnd()*.3,a:.32,rot:rnd()*6});}
  if(heavy){FX2.imp=Math.max(FX2.imp,.45);FX2.ca=Math.max(FX2.ca,.5);}}
// 畫面集中線（漫畫的速度線）：扣到球的瞬間，從畫面外圍往中心射
function fxHud(g,cw,ch){if(FX2.lines<=0)return;const a=Math.min(1,FX2.lines/.3),cx=cw/2,cy=ch/2,R=Math.hypot(cw,ch)/2;g.save();g.globalAlpha=.55*a;g.fillStyle=FX2.lineCol;
  for(let i=0;i<70;i++){const t=(i/70)*Math.PI*2+Math.sin(i*12.9898)*.05,r0=R*(.55+.2*((i*7)%5)/5),w=.006+.006*((i*3)%4)/4;
    g.beginPath();g.moveTo(cx+Math.cos(t-w)*R*1.1,cy+Math.sin(t-w)*R*1.1);g.lineTo(cx+Math.cos(t)*r0,cy+Math.sin(t)*r0);g.lineTo(cx+Math.cos(t+w)*R*1.1,cy+Math.sin(t+w)*R*1.1);g.fill();}g.restore();}
{const _dh=drawHUD;drawHUD=function(){_dh.apply(this,arguments);try{const cw=innerWidth,ch=innerHeight;fxHud(hctx,cw,ch);}catch(e){}};}
// 保護：特效出任何錯都不能影響比賽本身
{const W=f=>function(){try{return f.apply(this,arguments);}catch(e){if(!W.n){W.n=1;console.warn('特效錯誤',e);}}};hitFx=W(hitFx);blockFx=W(blockFx);landFx=W(landFx);}
// 舊的方塊粒子（白色小方塊，接球時會放大成一塊塊白色方塊，看起來像破圖）改成柔和的光點和粉塵
{const _cloud=cloud,_burst=burst;
  cloud=function(x,y,z){if(S.gfx<1)return _cloud(x,y,z);};   // 接球的粉塵已由 hitFx 處理
  burst=function(x,y,z,c,n=10,s=3){if(S.gfx<1)return _burst(x,y,z,c,n,s);try{fxSparks(x,y+.05,z,c,Math.min(14,Math.ceil(n*.6)),s*.9);}catch(e){}};}
