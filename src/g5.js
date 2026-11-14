
// ---------------- 鏡頭：每個動作一個視角 ----------------
// 動作視角（預設）：發球、接球、助跑、空中扣球、攔網、得分各有自己的機位，切換時平滑過去
const CAMN=['動作視角','固定視角','轉播'];
const camS={p:new TH.Vector3(-16,4,0),l:new TH.Vector3(0,1.5,0)};let orbit=0,camShot='',camShotT=0;
const _P=new TH.Vector3(),_L=new TH.Vector3();
function cueInfo(){if(!human||state!=='play'||!ball.setInfo||ball.setInfo.hitter!==human||ball.lastTeam!==human.team||ball.touches!==2)return null;
  const app=human.y>0?human.app:human.run,J=jumpProf(human,app),Lh=predict(HANDUP+J.hApex-.05);if(!Lh||Math.sign(Lh.x)!==sd(human.team))return null;
  return{x:Lh.x-tnet(human.team)*.3,z:Lh.z,toJump:Lh.t-J.tApex,hy:HANDUP+J.hApex};}
function shotFor(){const h=human;if(!h)return'ground';
  if(state==='point')return camShot||'ground';
  if(state==='serve')return server===h?'serve':'wait';
  if(h.y>.2){const blk=Math.abs(h.x)<1.6&&ball.lastTeam!==h.team&&Math.sign(ball.x)!==sd(h.team);return blk?'block':'air';}
  if(h.dive>0||h.rec>0)return'dive';
  if(cueInfo())return'approach';
  if(state==='play'&&ball.lastTeam!==h.team&&ball.call&&ball.call[h.team]===h)return'receive';
  if(state==='play'&&ball.setter===h&&ball.touches===1&&ball.lastTeam===h.team)return'set';
  if(state==='play'&&Math.abs(h.x)<4)return'net';
  return'ground';}
const SHOTN={net:'網前',serve:'發球',wait:'等待發球',air:'空中',block:'攔網',dive:'飛撲',approach:'助跑',receive:'接球',set:'舉球',ground:'跑位',point:'得分'};
// 滑鼠控制鏡頭方向（像開放世界遊戲），每個動作只調整鏡頭的距離、高度、俯角，切換時平滑過去
// 參考 Free Ball：鏡頭貼在背後偏低、廣角；空中稍微拉高好瞄準
// [後方距離, 額外高度, 額外俯角, 視角]：依 Free Ball 影片實測（規格表 §4）
const SHOTP={serve:[4.2,.1,-.06,66],wait:[4.6,.35,.1,70],receive:[4.6,.35,.1,70],set:[4.4,.35,.1,70],approach:[3.9,.4,.1,70],net:[3.9,.4,.1,70],air:[3.9,.5,.12,70],block:[4.2,.6,.1,70],dive:[4.5,.3,.1,70],point:[4.6,.35,.08,70],ground:[4.6,.35,.1,70]};
const cs={d:4.4,l:.2,pt:0,f:62},_T=new TH.Vector3(),pointLook=new TH.Vector3();let blurPx=0,baseFov=70;const camPrev=new TH.Vector3();
function updateCamera(dt){
  camLook(dt);const mode=S.cam|0;let fov=60;const bx=ball?lerp(ball.ox,ball.x,ALPHA):0;
  if(state==='menu'||state==='over'||!human){orbit+=dt*.07;_P.set(Math.cos(orbit)*15,5.2,Math.sin(orbit)*11);_L.set(0,1.3,0);camS.p.lerp(_P,1-Math.exp(-dt*3));camS.l.lerp(_L,1-Math.exp(-dt*3));fov=50;camShot='';}
  else if(mode===2){_P.set(bx*.4,8.5,M.wid+16);_L.set(bx*.35,1.2,0);camS.p.lerp(_P,1-Math.exp(-dt*5));camS.l.lerp(_L,1-Math.exp(-dt*5));fov=48;camShot='broadcast';}
  else{const h=human,sh=mode===1?(h.y>.2?'air':'ground'):shotFor();if(sh!==camShot){camShot=sh;camShotT=0;}camShotT+=dt;
    const P=SHOTP[sh]||SHOTP.ground,k=1-Math.exp(-dt*(h.y>0||h.loadT>0?4:2.5));cs.d+=(P[0]-cs.d)*k;cs.l+=(P[1]-cs.l)*k;cs.pt+=(P[2]-cs.pt)*k;cs.f+=(P[3]-cs.f)*k;fov=cs.f;
    const hx=lerp(h.ox,h.x,ALPHA),hz=lerp(h.oz,h.z,ALPHA),hy=lerp(h.oy,h.y,ALPHA),pt=clamp(camPitch+cs.pt,-.2,1.25);
    _T.set(hx,1.45+hy*.75+cs.l,hz);const fx=Math.sin(camYaw)*Math.cos(pt),fy=-Math.sin(pt),fz=Math.cos(camYaw)*Math.cos(pt);
    // 鏡頭方向立即跟滑鼠，只有位置（跳起來、換動作）用很快的平滑，看起來不會卡也不會晃
    // 得分後鏡頭不轉、不移動，停在得分那一刻的位置看大家慶祝
    const ptCam=state==='point';
    if(ptCam)camS.ptEnd=time;
    // 得分結束、回到發球站位時，鏡頭位置和方向都用 1 秒慢慢滑過去，不會一下子跳走
    if(!ptCam){const tr=time-(camS.ptEnd??-9)<1.2,kp=1-Math.exp(-dt*(tr?3.5:12));_P.set(_T.x-fx*cs.d,Math.max(.35,_T.y-fy*cs.d),_T.z-fz*cs.d);camS.p.lerp(_P,kp);
      _L.set(camS.p.x+fx*10,camS.p.y+fy*10,camS.p.z+fz*10);if(tr)camS.l.lerp(_L,1-Math.exp(-dt*4));else camS.l.copy(_L);}
    // 得分：鏡頭甩過球網，從高空俯看落點，3 秒後甩回發球位置（甩動時加動態模糊）
    if(false){const L=lastLand,side=sd(h.team),a=(stT-.3)*.12;
      // 影片：鏡頭移到網柱旁邊、約 5 公尺高，斜斜往下看網前的球員
      const zs=Math.sign(L.z)||1;_P.set(L.x*.25+side*1.2*Math.sin(a),4.8,zs*(M.wid+4.2));_L.set(L.x*.55,.8,L.z*.35);
      const k=stT<.7?1-Math.exp(-dt*9):1-Math.exp(-dt*2.5);camS.p.lerp(_P,k);pointLook.lerp(_L,k);camS.l.copy(pointLook);fov=62;}
    else if(state!=='point')pointLook.copy(camS.l);}
  // （原本鏡頭快速移動時用 CSS 模糊整個畫面，瀏覽器重繪很重、會造成卡頓，拿掉）
  if(camKick>0)camKick=Math.max(0,camKick-dt*.6);if(fovKick>0)fovKick=Math.max(0,fovKick-dt*30);
  const s=shake>0?shake*.15:0;cam.position.set(camS.p.x+(rnd()-.5)*s,camS.p.y+(rnd()-.5)*s,camS.p.z+(rnd()-.5)*s);cam.position.y-=camKick*Math.sin(Math.min(1,camKick/.11)*Math.PI);cam.lookAt(camS.l);
  const f=fov-(slowT>0||bulletT>0?4:0);baseFov+=(f-baseFov)*Math.min(1,dt*8);const nf=baseFov+fovKick;if(Math.abs(cam.fov-nf)>.01){cam.fov=nf;cam.updateProjectionMatrix();}
  camFwd=mode===2?{x:0,z:-1}:{x:Math.sin(camYaw),z:Math.cos(camYaw)};}
// 球的預測軌跡：沿著未來的飛行路線畫一串點，顏色依落在哪一邊
const TRJN=44,trjI=new TH.InstancedMesh(new TH.SphereGeometry(.035,8,6),new TH.MeshBasicMaterial({color:'#fff',transparent:true,opacity:.9,depthWrite:false}),TRJN);trjI.frustumCulled=false;trjI.renderOrder=9;scene.add(trjI);
{const c=new TH.Color('#fff');for(let i=0;i<TRJN;i++)trjI.setColorAt(i,c);}
const _tb={x:0,y:0,z:0,vx:0,vy:0,vz:0};
function updTraj(){let n=0;if(S.traj&&state==='play'&&ball){Object.assign(_tb,{x:ball.x,y:ball.y,z:ball.z,vx:ball.vx,vy:ball.vy,vz:ball.vz});
  const L=predict(0),mine=L&&Math.sign(L.x)===sd(ME);tmpC.set(mine?'#ffe14d':'#9fd8ff');
  for(let i=1;i<400&&n<TRJN;i++){stepB(_tb,1/60);if(_tb.y<=BR)break;if(i%3===0){dummy.position.set(_tb.x,_tb.y,_tb.z);dummy.rotation.set(0,0,0);dummy.scale.setScalar(1.25-n/TRJN*.6);dummy.updateMatrix();trjI.setMatrixAt(n,dummy.matrix);trjI.setColorAt(n,tmpC);n++;}}}
  trjI.count=n;trjI.instanceMatrix.needsUpdate=true;if(trjI.instanceColor)trjI.instanceColor.needsUpdate=true;}
ballMesh.scale.setScalar(1.55);
const showAim=()=>human&&((state==='serve'&&server===human)||(state==='play'&&human.y>0&&ball.lastTeam===human.team&&ball.touches>=1));

// ---------------- 繪製 ----------------
let RS=1;
function applyGfx(){if(!renderer)return;const sh=S.gfx>=1;renderer.shadowMap.enabled=sh;renderer.shadowMap.type=TH.PCFSoftShadowMap;sun.castShadow=sh;blobs.forEach(b=>b.visible=!sh);scene.traverse(o=>{if(o.material&&!Array.isArray(o.material))o.material.needsUpdate=true;});const dpr=devicePixelRatio||1;RS=S.gfx==2?Math.min(dpr,1.5):S.gfx==1?Math.min(dpr,1):.7;renderer.setPixelRatio(RS);renderer._w=0;}
function render(dt){
  if(!renderer)return;
  // 動態解析度：每格平均超過 19 毫秒（低於約 52 fps）就降低 3D 畫面解析度，順暢優先；夠快時再慢慢調回
  {const ft=window.__ftEMA,now=performance.now()/1000;if(ft!==undefined&&inMatch()){if(ft>19&&DRS.k>.6&&now-DRS.t>1){DRS.k=Math.max(.6,DRS.k-.12);DRS.t=now;}else if(ft<12.5&&DRS.k<1&&now-DRS.t>4){DRS.k=Math.min(1,DRS.k+.08);DRS.t=now;}}
    const pr=RS*DRS.k;if(Math.abs(renderer.getPixelRatio()-pr)>.01){renderer.setPixelRatio(pr);renderer._w=0;}}
  const w=innerWidth,h=innerHeight;if(renderer._w!==w||renderer._h!==h){renderer._w=w;renderer._h=h;renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();}
  updateCamera(dt);
  cursorG.ok=false;if(true){ray.setFromCamera({x:0,y:0},cam);const d=ray.ray.direction,o=ray.ray.origin;
    if(d.y<-.01){const k=-o.y/d.y;cursorG.x=o.x+d.x*k;cursorG.z=o.z+d.z*k;}else{cursorG.x=o.x+d.x*40;cursorG.z=o.z+d.z*40;}cursorG.ok=true;}
  players.forEach((p,i)=>rigs[i]&&poseRig(p,rigs[i],dt));
  // 擋在鏡頭前面的隊友變半透明，看得到自己和球
  players.forEach((p,i)=>{const Rg=rigs[i];if(!Rg)return;const cx=cam.position.x,cz=cam.position.z,dd=Math.hypot(cx-p.x,cz-p.z);let block=false;
    if(human&&!p.human){const hx=human.x-cx,hz=human.z-cz,L=Math.hypot(hx,hz)||1,t=((p.x-cx)*hx+(p.z-cz)*hz)/L;block=t>0&&t<L-.3&&Math.abs((p.x-cx)*hz-(p.z-cz)*hx)/L<.9;}
    const fade=!p.human&&(S.cam|0)!==2&&(dd<2.6||block),op=fade?(block?.3:clamp((dd-1.2)/1.4,.2,1)):1;
    if(Rg.op!==op){Rg.op=op;Rg.g.traverse(o=>{if(o.isMesh&&o!==Rg.aura){const m=o.material;if(m&&!Array.isArray(m)){m.transparent=op<1||!!m.userData.wasT;m.opacity=op*(m.userData.op0??1);m.depthWrite=!m.userData.wasT;}}});}});
  for(let i=0;i<blobs.length;i++){const p=players[i],b=blobs[i];if(!p)continue;b.position.set(lerp(p.ox,p.x,ALPHA),.018,lerp(p.oz,p.z,ALPHA));const k=clamp(1-p.y*.35,.45,1);b.scale.set(k,k,1);}
  const vis=!!ball&&state!=='menu'&&state!=='over';ballMesh.visible=blob.visible=vis;
  if(vis){if(ballPop>0)ballPop=Math.max(0,ballPop-dt*7);ballMesh.scale.setScalar(1.55*(1+.35*ballPop));ballMesh.position.set(lerp(ball.ox,ball.x,ALPHA),lerp(ball.oy,ball.y,ALPHA),lerp(ball.oz,ball.z,ALPHA));ballSpinFx(ballMesh,dt);
    const gc=null;glow.visible=!!gc;
    if(gc){glow.material.color.set(gc);glow.position.copy(ballMesh.position);glow.scale.setScalar((ball.meteor?1.5:1)*(1+.15*Math.sin(time*40)));}ballM.emissive.set(gc||'#222');
    blob.position.set(ballMesh.position.x,.02,ballMesh.position.z);const s=clamp(1.3-ball.y*.07,.45,1.3);blob.scale.setScalar(s);
    const fast=state==='play'&&(ball.atk||ball.serve&&ball.drive)&&Math.hypot(ball.vx,ball.vy,ball.vz)>8&&ball.trail.length>3;ribbon.visible=fast;if(fast){updRibbon('#ffffff');ribbon.material.opacity=ball.atk?.8:.0;}}
  else{glow.visible=false;ribbon.visible=false;}
  updTraj();
  // 預判提示：對方攻手在空中、已經決定落點時才出現；越接近擊球越清楚，但一直都很淡
  {let hh=null;if(S.tell!=0&&state==='play')hh=team(1-ME).find(q=>q.y>.15&&q.plan&&q.plan.aim);tellM.visible=tellD.visible=!!hh;
    if(hh){const tx=sd(ME)*hh.plan.aim.d,tz=hh.plan.aim.z,sx=lerp(hh.ox,hh.x,ALPHA),sz=lerp(hh.oz,hh.z,ALPHA),dx=tx-sx,dz=tz-sz,L=Math.hypot(dx,dz)||1,k=clamp((hh.airT||0)/.35,0,1);
      tellM.position.set((sx+tx)/2,.025,(sz+tz)/2);tellM.rotation.set(-Math.PI/2,0,0);tellM.rotation.y=Math.atan2(dx,dz)+Math.PI;tellM.scale.set(hh.plan.k==='tip'?.7:1.1,L,1);
      tellM.material.opacity=.1+.25*k;tellD.position.set(tx,.026,tz);tellD.scale.setScalar(hh.plan.k==='tip'?.9:1.3);tellD.material.opacity=.06+.14*k;}}
  let showL=false;
  const spH=human&&setPhase(human);   // 舉球時一定標出球到頭上的位置
  if(vis&&state==='play'&&(S.hint||spH)){const L=spH?predict(OVERY):predict(0);if(L){const mine=Math.sign(L.x)===sd(ME),out=!spH&&(Math.abs(L.x)>M.half+BR||Math.abs(L.z)>M.wid+BR),you=spH||ball.call[ME]===human&&mine;
    if(mine||S.hint==2){showL=true;const col=out?'#a6adc2':you?'#ffe14d':mine?'#ff6b7f':'#ffffff',r=.85+Math.min(L.t,1.5)*.6,pl=.7+.3*Math.sin(time*14),op=mine?1:.6;
      for(const m of [ring,disc,ring2])m.position.set(L.x,.03,L.z);ring.scale.setScalar(r);disc.scale.setScalar(r);ring2.scale.setScalar(r*1.08);ring.rotation.z=time*2.2;ring2.rotation.z=-time*1.4;
      ring.material.color.set(col);disc.material.color.set(col);ring2.material.color.set(col);ring.material.opacity=op*pl;ring2.material.opacity=.85*op;
      dropL.visible=ball.y>.5;dropL.position.set(ballMesh.position.x,0,ballMesh.position.z);dropL.scale.y=Math.max(.01,ballMesh.position.y);}}}
  ring.visible=disc.visible=ring2.visible=showL;if(!showL)dropL.visible=false;
  meRing.visible=false;if(human){meRing.position.set(lerp(human.ox,human.x,ALPHA),.03,lerp(human.oz,human.z,ALPHA));meRing.material.opacity=.55+.3*Math.sin(time*5);}
  const cue=null;cueM.visible=false;if(cue)cueM.position.set(cue.x,.035,cue.z);
  aimM.visible=state==='serve'&&server===human&&!!human;if(aimM.visible){const a=humanAim(human.team);aimM.position.set(sd(1-human.team)*a.d,.03,a.z);aimM.scale.setScalar(1+.06*Math.sin(time*10));aimM.rotation.z=time*1.8;}
  let n=0;for(const q of parts){if(n>=NP)break;dummy.position.set(q.x,q.y,q.z);dummy.rotation.set(q.t*9,q.t*7,0);dummy.scale.setScalar(q.big?(1.6+(.75-q.t)*7):Math.min(1,q.t*2)+.3);dummy.updateMatrix();ptsM.setMatrixAt(n,dummy.matrix);tmpC.set(q.c);ptsM.setColorAt(n,tmpC);n++;}
  ptsM.count=n;ptsM.instanceMatrix.needsUpdate=true;if(ptsM.instanceColor)ptsM.instanceColor.needsUpdate=true;
  fxRender(dt);}

// ---------------- 7 HUD ----------------
const _v=new TH.Vector3();
function proj(x,y,z,cw,ch){_v.set(x,y,z).project(cam);return{x:(_v.x+1)/2*cw,y:(1-_v.y)/2*ch,ok:_v.z<1&&_v.z>-1};}
const PIX='700 "Noto Sans TC","PingFang TC",sans-serif';
function T2(g,s,x,y,size,col,align='center'){g.font=`700 ${size}px "Noto Sans TC",sans-serif`;g.textAlign=align;g.textBaseline='middle';g.lineWidth=Math.max(2.5,size/6);g.strokeStyle='rgba(6,18,24,.85)';g.lineJoin='round';g.strokeText(s,x,y);g.fillStyle=col;g.fillText(s,x,y);}
function rr(g,x,y,w,h,r,c){g.fillStyle=c;g.beginPath();g.roundRect(x,y,w,h,r);g.fill();}
function drawHUD(){
  const dpr=Math.min(devicePixelRatio||1,1.5),cw=innerWidth,ch=innerHeight;
  if(hudC.width!==Math.round(cw*dpr)||hudC.height!==Math.round(ch*dpr)){hudC.width=Math.round(cw*dpr);hudC.height=Math.round(ch*dpr);}
  const g=hctx;g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,cw,ch);
  if(flash>0){g.fillStyle=`rgba(255,255,255,${flash*1.5})`;g.fillRect(0,0,cw,ch);}
  if(state==='menu'||state==='over'||!ball)return;
  const sc=clamp(cw/1280,.7,1.3);
  // ---- 以下全部比照 Free Ball 的畫面指標 ----
  // 1) 擊球圈：輪到你打的球（來球、托給你的球、發球拋起的球）外面套一圈發光的黃框；進到擊球範圍時框變粗、變亮
  const bs=ballScreen(cw,ch);
  if(bs&&mineToHit()){const hot=hitWindow(),pl=.75+.25*Math.sin(time*10),r=bs.r*1.45+3*sc;
    g.save();g.shadowColor='rgba(255,230,60,.95)';g.shadowBlur=(hot?18:10)*sc;g.strokeStyle=hot?'rgba(255,248,170,1)':`rgba(255,226,40,${.85*pl})`;g.lineWidth=Math.max(2.5,(hot?.38:.24)*bs.r);
    g.beginPath();g.arc(bs.x,bs.y,r,0,7);g.stroke();g.restore();}
  // 2) 準星：畫面中央一個細的白色大圓（只有發球、扣球、吊球這些能瞄準的時候出現）
  mouse.x=cw/2;mouse.y=ch/2;
  if(showAim()){g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=1.5;g.beginPath();g.arc(cw/2,ch/2,ch*.074,0,7);g.stroke();}
  // 3) 對方攻手頭上的標記：白色圓圈加向下箭頭（看得出球會給誰打，好準備攔網）
  if(state==='play'&&ball.lastTeam===1-ME&&ball.touches===2&&ball.setInfo&&ball.setInfo.hitter){const hh=ball.setInfo.hitter,q=proj(lerp(hh.ox,hh.x,ALPHA),hh.y+2.55,lerp(hh.oz,hh.z,ALPHA),cw,ch);
    if(q.ok)pinMark(g,q.x,q.y,13*sc);}
  // 3b) 你是舉球手、這一球該你舉：準星對準的攻手頭上黃色標記，下方提示
  if(human&&setPhase(human)){const h=setTarget(human);if(h){const q=proj(lerp(h.ox,h.x,ALPHA),h.y+2.55,lerp(h.oz,h.z,ALPHA),cw,ch);
      if(q.ok){pinMark(g,q.x,q.y,15*sc);
        g.save();g.strokeStyle='rgba(255,222,60,.95)';g.lineWidth=3*sc;g.beginPath();g.arc(q.x,q.y-15*sc*1.9,15*sc*1.35,0,7);g.stroke();g.restore();}
      const ty=setTypeFor(human,h),pick=human.setPick&&human.setPick.s===ball.passSer;
      if(q.ok)T2(g,SET_TN[ty],q.x,q.y-15*sc*3.6,13*sc,'#ffe46b');
      const tip=`托給：${h.ch.name}（${ROLE[h.role].name}）${pick?'':'・看準星'}　${k1('s1')}/${k1('s2')}/${k1('s3')} 選人　${k1('atk')} 舉球　${k1('tip')} 二次吊球`;
      g.font=`700 ${14*sc}px "Noto Sans TC",sans-serif`;const tw=g.measureText(tip).width+30;rr(g,cw/2-tw/2,ch*.78,tw,32*sc,16,'rgba(8,22,30,.78)');T2(g,tip,cw/2,ch*.78+16*sc,14*sc,'#ffe46b');
      // 攻擊方式：四格，目前選的亮起來；實際會打的方式（自動判斷或一傳太差改托）標在最後
      {const L=SET_TYPES,bw=64*sc,bh=26*sc,x0=cw/2-(L.length*bw)/2,y0=ch*.78+38*sc;rr(g,x0-8*sc,y0-4*sc,L.length*bw+16*sc,bh+8*sc,8,'rgba(8,22,30,.7)');
        L.forEach((t,i)=>{const on=(human.setType||'auto')===t,x=x0+i*bw;if(on)rr(g,x+2*sc,y0,bw-4*sc,bh,6,'rgba(255,214,90,.9)');T2(g,SET_TN[t],x+bw/2,y0+bh/2+1,13*sc,on?'#1a1206':'#e6eef2');});
        T2(g,`${k1('stype')}／滾輪 切換　→ 這球：${SET_TN[ty]}${human.setType==='quick'&&h.role!=='mb'&&ty==='fast'?'（左右攻打不到快攻）':''}`,cw/2,y0+bh+16*sc,12*sc,'#cfe2ea');}}}
  // 3c) 還沒輪到舉球時：顯示預先選好的下一球（可以在對方發球、進攻時就先決定）
  else if(human&&human.role==='set'&&(state==='play'||state==='serve')){const pk=human.setPick&&human.setPick.s===-1?{oh:'左攻',mb:'中間',op:'右攻'}[human.setPick.r]:'看準星';
    const tx=`下一球：${SET_TN[human.setType||'auto']}・${pk}　（${k1('stype')} 切換方式、${k1('s1')}/${k1('s2')}/${k1('s3')} 先選人）`;g.font=`700 ${12*sc}px "Noto Sans TC",sans-serif`;const tw=g.measureText(tx).width+24;rr(g,cw/2-tw/2,ch*.86,tw,24*sc,12,'rgba(8,22,30,.6)');T2(g,tx,cw/2,ch*.86+12*sc,12*sc,'#e6eef2');}
  // 4) 比分：上方中間兩塊斜切的隊伍色牌子，只有數字
  {const w=76*sc,h=28*sc,y=6,cx=cw/2,sl=9*sc,panel=(x0,dir,col,txt)=>{g.beginPath();if(dir<0){g.moveTo(x0-w,y);g.lineTo(x0,y);g.lineTo(x0,y+h);g.lineTo(x0-w+sl,y+h);}else{g.moveTo(x0,y);g.lineTo(x0+w,y);g.lineTo(x0+w-sl,y+h);g.lineTo(x0,y+h);}g.closePath();
      const gr=g.createLinearGradient(x0+dir*w,y,x0,y);gr.addColorStop(0,col+'55');gr.addColorStop(1,col+'ee');g.fillStyle=gr;g.fill();T2(g,txt,x0+dir*w*.5,y+h/2+1,18*sc,'#fff');};
    panel(cx-1,-1,COL[0].shirt,String(score[0]));panel(cx+1,1,COL[1].shirt,String(score[1]));g.fillStyle='rgba(255,255,255,.8)';g.fillRect(cx-1,y,2,h);}
  // 判定文字：一行小字
  {const m=msgs[msgs.length-1];if(m){g.globalAlpha=clamp(m.t*2,0,1);T2(g,m.text,cw/2,ch*.13,16*sc,'#ffffff');g.globalAlpha=1;}}
  // 5) 球不在畫面裡：邊緣出現白色水滴形的球圖示，尖端指向球
  if(state==='play'||state==='serve'){_v.set(ball.x,ball.y,ball.z).project(cam);const behind=_v.z>1;let nx=_v.x,ny=_v.y;if(behind){nx=-nx;ny=-ny;if(Math.abs(ny)<.5)ny=-1;}
    if(behind||Math.abs(nx)>1||Math.abs(ny)>1){const m=Math.max(Math.abs(nx)/.92,Math.abs(ny)/.86,1e-3),ex=(nx/m+1)/2*cw,ey=(1-ny/m)/2*ch,ang=Math.atan2(ey-ch/2,ex-cw/2);ballPin(g,ex,ey,ang,15*sc);}}
  // 6) 第一次進場的提示：鎖定滑鼠
  if(document.pointerLockElement!==g3&&state!=='point'){const hint='點一下畫面開始操作（滑鼠轉鏡頭）';g.font=`700 ${13*sc}px "Noto Sans TC",sans-serif`;const tw=g.measureText(hint).width+28;rr(g,cw/2-tw/2,ch-50*sc,tw,30*sc,15,'rgba(8,22,30,.75)');T2(g,hint,cw/2,ch-35*sc,13*sc,'#eef6f7');}
  // 7) 右下角動作圖示（白色剪影＋按鍵），右邊一個橘色 Q 方塊，最右側是技能量表
  {const srv=state==='serve'&&server===human,acts=srv?['serve','jserve']:['spike','tip','dig','block'],keyOf={spike:'atk',tip:'tip',dig:'rcv',block:'block',serve:'atk',jserve:'atk'},
      bw2=56*sc,bh2=70*sc,y0=ch-bh2-8*sc,x1=cw-30*sc,x0=x1-acts.length*bw2-24*sc;
    const nowA=srv?'serve':human.y>0?(ball.lastTeam!==ME&&Math.abs(human.x)<1.8?'block':'spike'):state==='play'&&ball.lastTeam!==ME?'dig':'';
    rr(g,x0-6*sc,y0-4*sc,x1-x0+8*sc,bh2+8*sc,4,'rgba(40,24,14,.45)');
    acts.forEach((a,i)=>{const x=x0+i*bw2,on=a===nowA;if(on)rr(g,x,y0,bw2-4*sc,bh2,4,'rgba(255,214,150,.28)');icon(g,a,x+bw2/2-2*sc,y0+26*sc,20*sc,on);keyGlyph(g,k1(keyOf[a]),x+bw2/2-2*sc,y0+57*sc,1.15*sc,a==='jserve');});
    rr(g,x1-19*sc,y0+18*sc,16*sc,16*sc,2,'#ff6a1a');keyGlyph(g,'Q',x1-11*sc,y0+57*sc,1.15*sc);
    const gx=cw-20*sc,gy=ch*.69,gh=ch*.27;rr(g,gx,gy,14*sc,gh,2,'rgba(255,255,255,.22)');rr(g,gx+3*sc,gy+gh*.62,8*sc,gh*.38-3*sc,2,'#ff7a1a');T2(g,'0',gx+7*sc,gy+12*sc,12*sc,'#eef6f7');}}
// 球在畫面上的位置和半徑
function ballScreen(cw,ch){if(!ball)return null;const bx=lerp(ball.ox,ball.x,ALPHA),by=lerp(ball.oy,ball.y,ALPHA),bz=lerp(ball.oz,ball.z,ALPHA);const q=proj(bx,by,bz,cw,ch);if(!q.ok)return null;
  const d=cam.position.distanceTo(_v.set(bx,by,bz)),r=(BR*1.15*1.55)/Math.max(.1,d)*(ch/2)/Math.tan(cam.fov*Math.PI/360);return{x:q.x,y:q.y,r:Math.max(4,r)};}
// 這顆球現在是不是輪到你打
function mineToHit(){if(!human)return false;
  if(state==='serve')return server===human;
  if(state!=='play')return false;
  if(ball.lastTeam!==ME&&ball.call[ME]===human){const L=predict(BUMPY);return !!L&&L.t<1.1;}
  if(ball.lastTeam===ME&&ball.touches===2&&ball.setInfo&&ball.setInfo.hitter===human)return true;
  if(setPhase(human))return true;
  return false;}
function hitWindow(){if(state==='serve')return ball.toss&&Math.abs(ball.y-(human.y+HANDUP+.15))<.6;
  if(setPhase(human)){const L=predict(OVERY);return !!L&&L.t<.4&&Math.hypot(L.x-human.x,L.z-human.z)<1.3;}
  if(human.y>.15){const d=Math.hypot(ball.x-human.x,ball.y-human.y-HANDUP,ball.z-human.z);return d<1.2;}
  const L=predict(BUMPY);return !!L&&L.t<.35&&Math.hypot(L.x-human.x,L.z-human.z)<1.4;}
function pinMark(g,x,y,r){g.save();g.shadowColor='rgba(255,255,255,.8)';g.shadowBlur=6;g.strokeStyle='rgba(255,255,255,.95)';g.lineWidth=r*.28;g.beginPath();g.arc(x,y-r*1.9,r,0,7);g.stroke();
  g.fillStyle='rgba(255,255,255,.95)';g.beginPath();g.moveTo(x-r*.55,y-r*.65);g.lineTo(x+r*.55,y-r*.65);g.lineTo(x,y+r*.15);g.closePath();g.fill();g.restore();}
function drawBallGlyph(g,x,y,r){g.fillStyle='#fff';g.beginPath();g.arc(x,y,r,0,7);g.fill();g.strokeStyle='rgba(70,80,96,.9)';g.lineWidth=Math.max(1,r*.12);g.beginPath();g.arc(x,y,r,0,7);g.stroke();
  g.beginPath();g.arc(x-r*.95,y+r*.1,r*1.05,-.95,.85);g.stroke();g.beginPath();g.arc(x+r*.35,y-r*1.15,r*1.05,1.15,2.55);g.stroke();g.beginPath();g.arc(x+r*.55,y+r*1.05,r*1.05,3.6,4.9);g.stroke();}
function ballPin(g,x,y,ang,r){g.save();g.translate(x,y);g.rotate(ang+Math.PI/2);g.fillStyle='rgba(255,255,255,.95)';g.beginPath();g.arc(0,0,r,Math.PI*.15,Math.PI*.85,true);g.lineTo(0,r*1.75);g.closePath();
  g.shadowColor='rgba(0,0,0,.35)';g.shadowBlur=4;g.fill();g.restore();g.save();drawBallGlyph(g,x,y,r*.72);g.restore();}
// 動作剪影（白色小人）
function icon(g,a,x,y,s,on){g.save();g.translate(x,y);g.scale(s/12,s/12);g.strokeStyle=g.fillStyle=on?'#fff':'rgba(255,255,255,.88)';g.lineWidth=2.4;g.lineCap=g.lineJoin='round';
  const L=(...p)=>{g.beginPath();g.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)g.lineTo(p[i],p[i+1]);g.stroke();},H=(cx,cy,r=2.2)=>{g.beginPath();g.arc(cx,cy,r,0,7);g.fill();},B=(cx,cy)=>{g.lineWidth=1.4;g.beginPath();g.arc(cx,cy,2.4,0,7);g.stroke();g.lineWidth=2.4;};
  if(a==='spike'||a==='jserve'){H(1,-7);L(0,-4,-2,4);L(-2,4,-6,8,-5,11);L(-2,4,2,8,4,11);L(0,-3,5,-8,7,-11);L(0,-3,-5,-1);B(-7,-10);}
  else if(a==='tip'){H(1,-7);L(0,-4,-1,4);L(-1,4,-4,8,-4,11);L(-1,4,3,8,4,11);L(0,-3,2,-9,3,-12);L(0,-3,-4,0);B(6,-11);}
  else if(a==='dig'){H(-3,-5);L(-2,-2,2,4);L(2,4,-2,8,-1,11);L(2,4,7,7,8,11);L(-1,-1,6,1);B(9,-2);}
  else if(a==='block'){H(0,-5);L(0,-2,0,5);L(0,5,-3,11);L(0,5,3,11);L(0,-1,-3,-8,-3,-11);L(0,-1,3,-8,3,-11);g.lineWidth=1;L(-10,-6,10,-6);L(-10,-2,10,-2);for(let i=-9;i<=9;i+=4.5)L(i,-6,i,-2);}
  else if(a==='serve'){H(0,-7);L(0,-4,0,4);L(0,4,-3,11);L(0,4,3,11);L(0,-3,-4,-9);L(0,-3,4,0);B(-5,-12);}
  g.restore();}
// 按鍵圖示：滑鼠鍵畫成滑鼠，其他是小方塊字
function keyGlyph(g,k,x,y,sc,shift){const mL=/滑鼠左鍵|左鍵/.test(k),mR=/滑鼠右鍵|右鍵/.test(k);g.save();
  if(mL||mR){const w=8*sc,h=11*sc;g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=1.2;rr(g,x-w/2,y-h/2,w,h,4*sc,'rgba(255,255,255,0)');g.beginPath();g.roundRect(x-w/2,y-h/2,w,h,4*sc);g.stroke();
    g.fillStyle='rgba(255,255,255,.95)';g.beginPath();g.roundRect(mL?x-w/2:x,y-h/2,w/2,h*.42,[mL?4*sc:0,mL?0:4*sc,0,0]);g.fill();
    if(shift){g.font=`700 ${8*sc}px "Noto Sans TC",sans-serif`;g.textAlign='right';g.textBaseline='middle';g.fillText('⇧',x-w/2-2*sc,y);}}
  else{const t=k.length>2?k.slice(0,2):k;rr(g,x-7*sc,y-7*sc,14*sc,14*sc,2,'rgba(255,255,255,.85)');g.fillStyle='#1a1a1a';g.font=`700 ${9*sc}px "Noto Sans TC",sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(t,x,y+.5);}
  g.restore();}

// ---------------- 選單 ----------------
const PAGES=['vMenu','vPrep','vHelp','vPause','vOver','vSet','vMocap','vSkin'];
function show(id){PAGES.filter(x=>x!=='vSet').forEach(x=>$(x).hidden=x!==id);if(id){const b=$(id).querySelector('button');if(b)b.focus();}else g3.focus();
  if(id==='vPrep')renderPrep();if(id==='vHelp')renderHelp();}
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{toMenu(b.dataset.go);});
function toMenu(v){if(v==='vMenu'){demo();}show(v);}
$('mStart').onclick=()=>show('vPrep');$('mHelp').onclick=()=>show('vHelp');$('mSettings').onclick=openSettings;$('mMocap').onclick=()=>openMocap();
function syncSeg(){document.querySelectorAll('.seg[data-k]').forEach(seg=>{const k=seg.dataset.k;seg.querySelectorAll('.opt').forEach(b=>b.setAttribute('aria-pressed',String(String(S[k])===b.dataset.v)));});}
document.querySelectorAll('.seg[data-k]').forEach(seg=>{const k=seg.dataset.k;seg.querySelectorAll('.opt').forEach(b=>b.addEventListener('click',()=>{S[k]=k==='diff'?b.dataset.v:+b.dataset.v;saveS();syncSeg();if(k==='gfx'){applyGfx();rebuildRigs();}if(k==='sound'&&AMB)AMB.gain.value=.028*(+S.sound||0);}));});syncSeg();
let setFromPause=false;
function openSettings(){setFromPause=inMatch();if(setFromPause){paused=true;$('vPause').hidden=true;}capture=null;renderKB();$('vSet').hidden=false;$('vSet').querySelector('.opt').focus();}
function closeSettings(){capture=null;$('vSet').hidden=true;if(setFromPause)show('vPause');}
$('bBack').onclick=closeSettings;$('bPSet').onclick=openSettings;
function togglePause(){if(!inMatch())return;paused=!paused;if(paused&&document.pointerLockElement)document.exitPointerLock();for(const k in held)held[k]=false;show(paused?'vPause':null);}
$('bResume').onclick=togglePause;
$('bRestart').onclick=()=>{paused=false;show(null);newGame();};
$('bTitle').onclick=()=>{paused=false;toMenu('vMenu');};
$('bAgain').onclick=()=>{show(null);newGame();};
$('bMenu').onclick=()=>toMenu('vMenu');
function statBars(base){return Object.keys(STAT).map(k=>{const b=base[k],x=0;
  return `<span>${STAT[k]}</span><i><em style="width:${Math.min(100,(b+x)*100/12)}%"></em><b style="width:${b*100/12}%"></b></i><span>${b+x}</span>`;}).join('');}
function press(box,v){box.querySelectorAll('[data-v]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===v)));}
function renderPrep(){
  const side=$('pSide');side.querySelectorAll('.pill').forEach(b=>b.onclick=()=>{prep.side=+b.dataset.v;savePrep();renderPrep();});press(side,String(prep.side));
  const rb=$('pRole');rb.innerHTML=PLAYABLE.map(r=>`<button class="pill" data-v="${r}">${ROLE[r].name}</button>`).join('');
  rb.querySelectorAll('.pill').forEach(b=>b.onclick=()=>{prep.role=b.dataset.v;savePrep();PV.role=null;renderPrep();});press(rb,prep.role);
  const box=$('pChars');box.innerHTML='';
  ROLES.forEach(r=>{const line=document.createElement('div');line.className='line';
    line.innerHTML=`<div class="lbl">${ROLE[r].name}${r===prep.role?'<small>你</small>':'<small style="color:var(--dim)">隊友</small>'}</div><div class="cards"></div>`;
    const cards=line.querySelector('.cards');
    CHARS[r].forEach(c=>{const b=document.createElement('button');b.className='cc';b.dataset.v=c.id;const th=PV.thumbs[c.id];
      b.innerHTML=`<div class="top"><img class="th" data-th="${c.id}" alt="" ${th?`src="${th}"`:'hidden'}><span class="sw" style="background:${c.hair}" ${th?'hidden':''}></span><div><div class="nm">${c.name}</div><div class="ty">${c.type}</div></div></div><div class="nt">${c.note}</div><div class="stats">${statBars(c.st)}</div>`;
      b.onclick=()=>{pickChar(r,c.id);press(cards,c.id);pvShow(r,c.id);};cards.appendChild(b);});
    press(cards,prep.chars[r]);box.appendChild(line);});
  if(!PV.role||!$('pChars').contains(document.activeElement))pvShow(prep.role,prep.chars[prep.role]);
}
$('pGo').onclick=()=>{show(null);newGame();g3.focus();try{const r=g3.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}};
function renderHelp(){
  const K=a=>`<kbd>${k1(a)}</kbd>`,air='<i>空中</i>',hold='<i>按住</i>';
  const G=[{t:'移動與鏡頭',rows:[['滑鼠','轉鏡頭（點一下畫面鎖定游標）'],[`${K('fwd')}${K('left')}${K('back')}${K('right')}`,'往鏡頭方向跑'],[K('jump'),'跳；往網前跑幾步再跳＝助跑，跳更高、打更重'],[K('cam'),'切換鏡頭：動作視角／固定視角／轉播']]},
   {t:'進攻',sub:'球托給你時',rows:[[`${K('jump')} → ${air}${K('atk')}`,'扣球：按下去就一定打得到，在跳躍最高點出手最強'],['準星','畫面中央的準星指到哪裡，球就往哪裡打'],[`${air}${K('tip')}`,'輕打：把球輕輕推到準星位置'],[K('call'),'叫球：要舉球手托給你']]},
   {t:'舉球',sub:'你選舉球手時，隊友一傳後輪到你',rows:[['黃圈','地上的黃圈是球落到頭上的位置，跑過去（一傳會傳高一點，球飛過來時畫面變慢，慢的程度在設定「舉球思考時間」調整）'],['準星','對準要托給的攻手（頭上出現黃色標記）'],[K('atk'),'舉球（差一點會自動跨一步）'],[`${K('s1')}${K('s2')}${K('s3')}`,'直接指定托給左攻／中間／右攻（不按就看準星）；對方發球或進攻時就能先選好下一球'],[`${K('stype')}／滾輪`,'切換攻擊方式：自動、高球（最穩）、平快（低平快，攔網來不及）、快攻（只有中間手，托在身邊、第一時間打；選左右攻會改成平快）；一傳太差時會改托修正高球'],[K('tip'),'二次吊球：直接把球推過網'],[`${hold}${K('rcv')}`,'墊球舉：比較保險，但沒那麼準']]},
   {t:'接球・防守',rows:[[`${hold}${K('rcv')}`,'接球姿勢：球掉進手臂就自動墊給舉球手'],[`<i>跑動中</i>${K('rcv')}`,'球太遠時飛撲'],[`<i>網前</i>${K('block')}`,'攔網：對方攻手起跳時按，原地起跳、手自動舉高、會往球的位置橫移']]},
   {t:'發球',sub:'輪到你發球時',rows:[[K('atk'),'拋球，球到手上方再按一次'],[`${hold}${K('mod')}＋${K('atk')}`,'跳發：快又重'],['準星','發球落點']]},
   {t:'其他',rows:[[K('pause'),'暫停（Esc 也會放開滑鼠）']]}];
  const notes=[['畫面提示',['球後面的白線是飛行軌跡，前面的點是接下來會飛的路線：黃色會落在我方，藍色落在對方','球跑出畫面時，畫面邊緣會有黃色箭頭指向球','地上的光圈是落點；黃色起跳圈出現時，跑過去在「跳！」時起跳']],
    ['規則',['4 對 4，先取設定分數且領先 2 分獲勝','得分的一方發球；換發時換下一位發球（舉球手不發球）','每隊最多碰三次，同一人不能連碰，攔網不算次數']]];
  $('helpList').innerHTML=G.map(g=>`<div class="cg"><h4>${g.t}${g.sub?`<small>${g.sub}</small>`:''}</h4>${g.rows.map(([k,t])=>`<div class="cr"><span class="ck">${k}</span><span>${t}</span></div>`).join('')}</div>`).join('')
    +notes.map(([t,l])=>`<div class="cg"><h4>${t}</h4><ul>${l.map(x=>`<li>${x}</li>`).join('')}</ul></div>`).join('');}
function demo(){players=[];PID=0;
  for(const t of [0,1])ROLES.forEach((r,i)=>{const p=mkP(t,r,CHARS[r][(i+t)%3],false);const s=spot(p,'r');p.x=p.ox=sd(t)*s.d;p.z=p.oz=s.z;players.push(p);});
  human=null;ball=null;state='menu';rebuildRigs();}

// ---------------- 迴圈（固定 60Hz 物理，畫面內插） ----------------
const STEP=1/60;let acc=0,last=0;
function snap(){players.forEach(p=>{p.ox=p.x;p.oy=p.y;p.oz=p.z;p.oyaw=p.yaw;});if(ball){ball.ox=ball.x;ball.oy=ball.y;ball.oz=ball.z;}}
// 空中慢動作：你是這一球的攻手、在空中、球離手不到 2.2 公尺時放慢（每次跳最多 0.6 秒）
function bulletScale(d){if(human&&+S.setSlow&&typeof setPhase==='function'&&setPhase(human)){const L=predict(OVERY);if(L&&L.t<.55)return +S.setSlow===2?.55:.75;} // 只在球快到手上的最後一小段放慢
  if(!S.slow||!human||state!=='play'||human.y<=.2){if(human&&human.y===0)bulletT=0;return 1;}
  if(!human.swingReq)return 1;const dd=Math.hypot(ball.x-human.x,ball.y-human.y-HANDUP,ball.z-human.z);if(dd<2.6&&bulletT<.4){bulletT+=d;return .6;}return 1;}
const PF={sim:0,ren:0,hud:0,n:0,worst:0};
const DRS={k:1,t:0};
function loop(ts){const now=ts/1000;if(!last)last=now;const d=Math.min(.1,now-last);last=now;if(d>0&&d<.1)window.__ftEMA=window.__ftEMA===undefined?d*1000:window.__ftEMA*.95+d*1000*.05;
  if(window.__manual){requestAnimationFrame(loop);return;}
  const t0=performance.now();
  if(!paused&&hitstop>0){hitstop-=d;ALPHA=1;}
  else if(!paused){let sim=d*bulletScale(d)*(inMatch()?(+S.pace||.85):1);if(slowT>0){slowT-=d;sim=d*.3;}acc+=sim;let n=0;while(acc>=STEP&&n<6){snap();update(STEP);acc-=STEP;n++;}if(n===6)acc=0;ALPHA=clamp(acc/STEP,0,1);}
  else{clearHits();ALPHA=1;}
  const t1=performance.now();render(paused?0:d);mcFrame(d);skFrame(d);pvFrame(d);const t2=performance.now();drawHUD();const t3=performance.now();
  PF.sim+=t1-t0;PF.ren+=t2-t1;PF.hud+=t3-t2;PF.n++;PF.worst=Math.max(PF.worst,t3-t0);requestAnimationFrame(loop);}
function b64buf(s){const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u.buffer;}
function loadModel(){if(!window.GLB_B64||!TH.GLTFLoader)return;try{new TH.GLTFLoader().parse(b64buf(window.GLB_B64),'',g=>{GLBSRC=g;rebuildRigs();},e=>console.warn('GLB 載入失敗',e));}catch(e){console.warn(e);}}
applyGfx();demo();show('vMenu');loadModel();
if(!renderer)$('vMenu').querySelector('.sub').textContent='這個瀏覽器無法啟用 WebGL，3D 畫面無法顯示。';
requestAnimationFrame(loop);
// 鎖定的滑鼠被 Esc 放開時，順便暫停
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&inMatch()&&!paused)togglePause();});
