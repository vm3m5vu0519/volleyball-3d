
// ---------------- 球和場景的互動：落地後繼續彈跳、滾動，會撞網子、網柱、廣告牆、看台階梯和球員 ----------------
// 數值：排球對木地板的恢復係數約 0.6–0.7（2 公尺落下約彈回 0.8 公尺）；廣告牆是軟墊、網子會吃掉大部分速度
const BRV=BR*1.55,BALL_E=.64,ROLLF=.55;
let bounceSnd=0;
function standH(x,z){const W=M.wid,HF=M.half;let h=0;
  const az=Math.abs(z)-(W+6.5);if(az>-.475&&Math.abs(x)<22)h=Math.max(h,.5+Math.min(12,Math.floor((az+.475)/.95))*.5);
  const ax=Math.abs(x)-(HF+8);if(ax>-.475&&Math.abs(z)<15)h=Math.max(h,.5+Math.min(10,Math.floor((ax+.475)/.95))*.5);return h;}
function ballSnd(v,kind){if(time-bounceSnd<.05||v<.5)return;bounceSnd=time;const k=clamp(v/9,.12,1);
  if(kind==='net')play((o,t)=>{for(let i=0;i<4;i++)nz(o,t+i*.03,.05,'bandpass',600+i*90,2,.3*k*(1-i*.15));},1);
  else if(kind==='wall')play((o,t)=>{tn(o,t,90,40,.14,.7*k);nz(o,t,.06,'lowpass',500,.8,.5*k);},1);
  else if(kind==='body')play((o,t)=>{tn(o,t,180,90,.07,.45*k);nz(o,t,.03,'lowpass',1400,.8,.4*k);},1);
  else play((o,t)=>{tn(o,t,120+40*k,50,.13,.75*k);nz(o,t,.04,'lowpass',1000,.8,.55*k);},1);}
// 球的旋轉（給畫面用）：落地時變成滾動，空中保留
function spinRoll(b){const r=BRV;b.wx=b.vz/r;b.wz=-b.vx/r;b.wy=(b.wy||0)*.8;}
// 共用的碰撞：回傳 'wall' 表示撞到場邊（比賽中算出界），'floor' 表示落地
function ballCollide(b,dt,dead){let ev=null;const W=M.wid,HF=M.half;
  // 網子（軟）：只在死球時處理；比賽中的掛網、攔網由 crossNet 判定
  if(dead&&b.px!==undefined&&b.px*b.x<=0&&b.px!==b.x&&b.y>NETH-1-BRV&&b.y<NETH+BRV&&Math.abs(b.z)<W+.8){const v=Math.abs(b.vx);if(typeof netHit==='function')netHit(b.z,b.y,clamp(b.vx,-12,12)*.8);b.x=Math.sign(b.px||1)*BRV;b.vx*=-.18;b.vy*=.6;b.vz*=.6;ballSnd(v*.6,'net');}
  // 網柱
  for(const s of[-1,1]){const dz=b.z-s*(W+.9),dx=b.x,d=Math.hypot(dx,dz),R=.06+BRV;if(d<R&&b.y<2.6){const nx=dx/(d||1),nz=dz/(d||1),vn=b.vx*nx+b.vz*nz;b.x=nx*R;b.z=s*(W+.9)+nz*R;if(vn<0){b.vx-=(1+.55)*vn*nx;b.vz-=(1+.55)*vn*nz;ballSnd(-vn,'wall');ev='wall';}}}
  // 廣告牆（高 0.9 公尺的軟墊）
  const wz=W+5.6-BRV,wx=HF+7.2-BRV;
  if(Math.abs(b.z)>wz&&Math.abs(b.pz??b.z)<=wz+.01&&b.y<.9+BRV){const v=Math.abs(b.vz);b.z=Math.sign(b.z)*wz;b.vz*=-.45;b.vx*=.8;ballSnd(v,'wall');ev='wall';}
  if(Math.abs(b.x)>wx&&Math.abs(b.px??b.x)<=wx+.01&&b.y<.9+BRV&&Math.abs(b.z)<W+5.6){const v=Math.abs(b.vx);b.x=Math.sign(b.x)*wx;b.vx*=-.45;b.vz*=.8;ballSnd(v,'wall');ev='wall';}
  if(!dead){const h=standH(b.x,b.z);if(h>0&&h>b.y-BRV)ev='wall';return ev;}
  // 看台：一階一階，撞到階梯側面就彈回，落到階面上就彈起
  const gh=standH(b.x,b.z);
  if(gh>0&&b.y-BRV<gh){const ph=standH(b.px??b.x,b.pz??b.z);
    if(ph<gh-.05&&(b.py??b.y)-BRV<gh-.02){// 撞到階梯側面
      if(standH(b.px??b.x,b.z)<gh-.05){b.z=b.pz;b.vz*=-.5;}else{b.x=b.px;b.vx*=-.5;}ballSnd(Math.hypot(b.vx,b.vz),'wall');}
    else if(b.vy<0){b.y=gh+BRV;const v=-b.vy;b.vy=v>.7?v*BALL_E*.9:0;b.vx*=.8;b.vz*=.8;ballSnd(v,'floor');}else b.y=gh+BRV;}
  // 地板
  if(b.y<BRV&&gh===0){const v=-b.vy;b.y=BRV;ev=ev||'floor';
    if(v>.6){b.vy=v*BALL_E;b.vx*=.88;b.vz*=.88;ballSnd(v,'floor');if(v>2.5){burst(b.x,0,b.z,'#e8f4f2',Math.round(4+v),Math.min(3,v*.3));if(typeof landMark==='function'&&v>3.5)landMark(b.x,b.z,v);}}
    else{b.vy=0;const sp=Math.hypot(b.vx,b.vz);if(sp>0){const k=Math.max(0,sp-ROLLF*dt)/sp;b.vx*=k;b.vz*=k;}}
    spinRoll(b);}
  return ev;}
// 死球（得分後）：繼續彈、滾，碰到人會被撞開
function deadBall(dt){const b=ball;if(!b||b.held||b.toss)return;b.px=b.x;b.py=b.y;b.pz=b.z;
  const sp=Math.hypot(b.vx,b.vy,b.vz),drag=1-.04*dt*sp*.1;b.vx*=drag;b.vy*=drag;b.vz*=drag;
  b.vy-=G*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;
  ballCollide(b,dt,true);
  // 球員身體（圓柱：半徑 0.24、高 1.6）——得分後滾過去會被腳踢開或撞開
  for(const p of players){const dx=b.x-p.x,dz=b.z-p.z,d=Math.hypot(dx,dz),R=.24+BRV;
    if(d<R&&b.y<p.y+1.6&&b.y>p.y-BRV){const nx=dx/(d||1),nz=dz/(d||1),rvx=b.vx-p.vx,rvz=b.vz-p.vz,vn=rvx*nx+rvz*nz;b.x=p.x+nx*R;b.z=p.z+nz*R;
      if(vn<0){b.vx-=(1+.4)*vn*nx;b.vz-=(1+.4)*vn*nz;if(b.y<.4&&Math.hypot(p.vx,p.vz)>1){b.vy=Math.max(b.vy,.8+Math.hypot(p.vx,p.vz)*.25);}ballSnd(-vn,'body');}}}
  if(Math.abs(b.x)>40||Math.abs(b.z)>40){b.vx=b.vz=0;}}
// 畫面用的球旋轉：被打到時依球路給旋轉（扣球強烈上旋、飄球幾乎不轉），落地後變成滾動
let _spinSer=-1;const _sq=new THREE.Quaternion(),_sa=new THREE.Vector3();
function ballSpinFx(mesh,dt){const b=ball;if(!b)return;
  if(b.serial!==_spinSer&&state==='play'){_spinSer=b.serial;const v=Math.hypot(b.vx,b.vz)||1,r=b.float>0?.6:b.atk?30:b.tip?3:9;b.wx=b.vz/v*r;b.wz=-b.vx/v*r;b.wy=(rnd()-.5)*2;}
  if(b.held)return;const w=Math.hypot(b.wx||0,b.wy||0,b.wz||0);if(w<1e-3)return;_sa.set(b.wx/w,b.wy/w,b.wz/w);_sq.setFromAxisAngle(_sa,w*dt);mesh.quaternion.premultiply(_sq);}
