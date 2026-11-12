(()=>{window.__manual=1;const R={};const DT=1/60;const TL=[];const _t=touch;touch=(p,z,it)=>{TL.push([p.name,z.k,+z.q.toFixed(2)]);_t(p,z,it);};
function step(n,cb){for(let i=0;i<n;i++){if(hitstop>0){hitstop-=DT;continue;}snap();update(DT);if(cb&&cb(i))return i;}return n;}
function reset(){for(const k in held)held[k]=false;for(const k in hitK)hitK[k]=false;clearHits();state='play';
  players.forEach(p=>{const s=spot(p,'r');p.x=p.ox=sd(p.team)*s.d;p.z=p.oz=s.z;p.y=p.vy=p.vx=p.vz=0;p.dive=p.rec=p.stun=p.swing=p.loadT=p.landT=0;p.diveQ=null;p.jk='';p.lungeT=0;p.arm=null;p.jumpAt=0;p.ready=false;p.swingReq=null;p.charging=false;p.tx=p.x;p.tz=p.z;p.yaw=p.team?-Math.PI/2:Math.PI/2;p.calledAt=-9;});
  ball=newBall();hitstop=0;TL.length=0;}
const me=human;
R.prof={norm:jumpProf(me,0),spk:jumpProf(me,.8),blk:jumpProf(me,0,'blk')};
// 連續攔網：對方在組攻，按 E、落地後馬上再按
reset();me.x=sd(ME)*.6;me.z=0;ball.x=sd(1-ME)*3;ball.y=2;ball.z=0;ball.lastTeam=1-ME;ball.touches=1;ball.vx=ball.vy=ball.vz=0;
const _sb=stepB;stepB=(b,dt)=>{};let jumps=[],t0=time;
step(200,()=>{if(me.y===0&&me.landT<=.06&&me.loadT<=0){hitK['k:KeyE']=true;}else hitK['k:KeyE']=false;if(me.y>0&&me.vy>0&&me._was!==1){jumps.push(+(time-t0).toFixed(2));me._was=1;}if(me.y===0)me._was=0;return jumps.length>=4;});
stepB=_sb;R.blockCycle=jumps;
// 飛撲
const _z=zoneOf;zoneOf=p=>(!p.human)?null:_z(p);
R.dive=[];
for(const dist of [2.2,3.2,4.2,5.2])for(const ang of [-1.2,-.5,.5,1.2])for(const delay of [0,.12,.25]){
  reset();me.x=sd(ME)*6;me.z=0;const tx=me.x+Math.cos(ang)*dist*tnet(ME),tz=me.z+Math.sin(ang)*dist;
  ball.x=sd(ME)*.3;ball.y=3.0;ball.z=0;ball.lastTeam=1-ME;ball.touches=1;driveTo(tx,tz,19);ball.atk=true;
  let st=time,pressed=false,got=null;
  step(150,()=>{const tt=time-st;camYaw=Math.atan2(tx-me.x,tz-me.z);held['k:KeyW']=tt>=delay*.5;if(!pressed&&tt>=delay){hitK['m:2']=true;held['m:2']=true;pressed=true;}else hitK['m:2']=false;
    if(ball.lastP===me){got=TL.find(t=>t[0]===me.name);return true;}return ball.y<=BRV+.01;});
  for(const k in held)held[k]=false;
  R.dive.push([dist,ang,delay,got?got[1]+':'+got[2]:'MISS',me.dive>0||me.rec>0?'dv':'']);}
zoneOf=_z;
// 發球：瞄準點（含界外）× 擊球時機
const _z2=zoneOf;zoneOf=p=>p.team!==ME?null:_z2(p);
R.serve=[];
for(const kind of ['stand','jump'])for(const aim of [[5,0],[8.5,4],[12,0],[6,7]])for(const off of [-.5,-.2,0,.25,.5]){
  reset();state='serve';server=me;stT=0;me.x=sd(ME)*(M.half+1.2);me.z=1;ball=newBall();ball.held=me;placeHeld();
  cursorG.ok=true;cursorG.x=sd(1-ME)*aim[0];cursorG.z=aim[1];
  if(kind==='jump')held['k:ShiftLeft']=true;hitK['m:0']=true;step(1);hitK['m:0']=false;held['k:ShiftLeft']=false;
  let hit=false;const hy=()=>me.y+HANDUP+.12;
  step(200,()=>{if(state==='serve'&&ball.toss&&ball.vy<0&&ball.y<=hy()+off&&(kind==='stand'||me.y>.2)&&!hit){hitK['m:0']=true;hit=true;}else hitK['m:0']=false;return state!=='serve';});
  const sv=state==='play';let L=null;if(sv)step(300,()=>{if(ball.y<=BRV+.02){L={x:ball.x,z:ball.z};return true;}return false;});
  const inC=L&&Math.sign(L.x)===sd(1-ME)&&Math.abs(L.x)<=M.half&&Math.abs(L.z)<=M.wid;
  R.serve.push([kind,aim.join(','),off,sv?'srv':'NOHIT',L?L.x.toFixed(1)+','+L.z.toFixed(1):'-',inC?'IN':'OUT',(me.pop&&me.pop.t?me.pop.text||'':'')]);}
zoneOf=_z2;
return R;})()
