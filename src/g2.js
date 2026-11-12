
// ---------------- 陣容存檔 ----------------
let prep=Object.assign({side:0,role:'oh',chars:{}},load('fb-prep',{}));
ROLES.forEach(r=>{if(!prep.chars[r]||!CHARS[r].some(c=>c.id===prep.chars[r]))prep.chars[r]=CHARS[r][0].id;});if(!PLAYABLE.includes(prep.role))prep.role='oh';
function savePrep(){store('fb-prep',prep);}
const charOf=(r,id)=>CHARS[r].find(c=>c.id===id)||CHARS[r][0];

// ---------------- 3 物理 ----------------
let players=[],human=null,ball=null,state='menu',paused=false,score=[0,0],serveTeam=0,serverIdx=[0,0],served=[false,false],server=null,ME=0;
let stT=0,time=0,slowT=0,hitstop=0,shake=0,msgs=[],flash=0,parts=[],bulletT=0,cutin=null,teamBuff=[0,0];
let PID=0,SERIAL=0;
const sd=t=>t?1:-1,tnet=t=>-sd(t),team=t=>players.filter(p=>p.team===t),roleOf=(t,r)=>players.find(p=>p.team===t&&p.role===r);
const has=()=>false;
function mkP(t,role,ch,isH){const st=ch.st;
  return{id:PID++,team:t,role,ch,st,name:ch.name,human:!!isH,x:0,z:0,y:0,vx:0,vz:0,vy:0,yaw:t?-Math.PI/2:Math.PI/2,
  jumpH:.62+st.jmp*.045,run:0,app:0,hangT:0,ox:0,oy:0,oz:0,arm:null,armT:0,swing:0,pose:'',dive:0,diveT:.5,rec:0,stun:0,pop:null,talk:'',talkT:0,jumpAt:0,tx:0,tz:0,
  blockTried:-1,rolls:{},num:0,touchFx:0,touchN:'',skill:.92+rnd()*.16,ready:false,readyT:0,charging:false,chargeT:0,power:0,loadT:0,landT:0,
  swingReq:null,hitDone:false,prevD:9,calledAt:-9,approach:false,act:null};}
const spd=p=>(5.2+p.st.spd*.34)*(p.human?1.05:D().spd*p.skill)*(p.approach?1.25:1);
// 攔網跳：低、快、幾乎不滯空（真實攔網起跳到落地約 0.6–0.7 秒）；扣球跳才有明顯滯空
const pGravK=(vy,hang,jk)=>jk==='blk'?(Math.abs(vy)<PHANGV?.8:1.05):hang>0?.1:Math.abs(vy)<PHANGV?PHANGK:1;
const _jp={};
function jumpProf(p,app=0,jk=''){const v=jk==='blk'?Math.sqrt(2*PG*p.jumpH*.78):Math.sqrt(2*PG*p.jumpH)*(1+.12*app),k=jk+v.toFixed(3);if(_jp[k])return _jp[k];let vy=v,y=0,t=0,top=0,tt=0;const dt=1/120;
  while(t<3){vy-=PG*pGravK(vy,0,jk)*dt;y+=vy*dt;t+=dt;if(y>top){top=y;tt=t;}if(y<=0)break;}return _jp[k]={v,tApex:tt,hApex:top,air:t};}
function timeToApex(p){let vy=p.vy,t=0;const dt=1/120;while(vy>0&&t<2){vy-=PG*pGravK(vy,0,p.jk)*dt;t+=dt;}return t;}
function heightAfter(p,tt){let vy=p.vy,y=p.y,t=0;const dt=1/120;while(t<tt){vy-=PG*pGravK(vy,0,p.jk)*dt;y+=vy*dt;t+=dt;}return Math.max(0,y);}
function newBall(){return{x:0,y:1,z:0,vx:0,vy:0,vz:0,ox:0,oy:1,oz:0,held:null,toss:false,lastTeam:null,lastP:null,touches:0,cool:0,atk:false,heavy:false,float:0,fseed:rnd()*9,
  call:[null,null],setInfo:null,setter:null,passQ:1,serve:false,power:0,tip:false,trail:[],serial:++SERIAL,blockTouch:false,drive:false,quickMB:null,letGo:null};}
// 球：真實重力、沒有滯空，看起來跟真的排球一樣快
function stepB(b,dt){b.vy-=G*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;}
function flight(y0,vy,ty){const b={x:0,z:0,vx:0,vz:0,y:y0,vy};let t=0,top=y0;const dt=1/120;while(t<10){stepB(b,dt);t+=dt;if(b.y>top)top=b.y;if(b.vy<0&&b.y<=ty)break;}return{t,top};}
function lobTo(tx,ty,tz,apex){const y0=ball.y;apex=Math.max(apex,y0+.2,ty+.2);const vy=Math.sqrt(2*G*(apex-y0)),t=flight(y0,vy,ty).t;
  ball.vy=vy;ball.vx=(tx-ball.x)/t;ball.vz=(tz-ball.z)/t;ball.drive=false;PC={};}
function driveTo(tx,tz,speed){const dx=tx-ball.x,dz=tz-ball.z,dist=Math.hypot(dx,dz);let t=Math.max(.2,dist/speed);
  for(let i=0;i<30;i++){const vy=(-ball.y+.5*G*t*t)/t;ball.vx=dx/t;ball.vz=dz/t;ball.vy=vy;
    if(Math.sign(ball.x)!==Math.sign(tx)&&ball.x!==0){const tn=-ball.x/ball.vx,yn=ball.y+vy*tn-.5*G*tn*tn;if(yn<NETH+.15){t*=1.06;continue;}}break;}
  ball.drive=true;PC={};}
function sendTo(tx,ty,tz,t){ball.vx=(tx-ball.x)/t;ball.vz=(tz-ball.z)/t;ball.vy=(ty-ball.y+.5*G*t*t)/t;ball.drive=true;PC={};}
let PC={};
function predict(yT){if(!ball)return null;const k=yT.toFixed(2);if(k in PC)return PC[k];
  const b={x:ball.x,y:ball.y,z:ball.z,vx:ball.vx,vy:ball.vy,vz:ball.vz},dt=1/60;let t=0,r=null;
  for(let i=0;i<600;i++){const py=b.y;stepB(b,dt);t+=dt;if(b.vy<0&&b.y<=yT){const f=(py-yT)/((py-b.y)||1);r={x:b.x-b.vx*dt*(1-f),z:b.z-b.vz*dt*(1-f),t:t-dt*(1-f)};break;}}
  return PC[k]=r;}
function burst(x,y,z,c,n=10,s=3){for(let i=0;i<n;i++)parts.push({x,y,z,vx:(rnd()-.5)*s,vy:rnd()*s,vz:(rnd()-.5)*s,t:.5+rnd()*.4,c});}
// 接球的白色雲狀粒子（Free Ball 的接球回饋）
function cloud(x,y,z){for(let i=0;i<16;i++)parts.push({x,y,z,vx:(rnd()-.5)*2.4,vy:rnd()*1.6,vz:(rnd()-.5)*2.4,t:.45+rnd()*.3,c:'#ffffff',big:1});}
function say(text,col='#ffcf3a',big=false){msgs.push({text,col,t:1.6,big});if(msgs.length>3)msgs.shift();}
function pop(p,text,col){p.pop={text,col,t:1.1};}
function talk(p,arr){if(!p||p.talkT>.5)return;p.talk=Array.isArray(arr)?pick(arr):arr;p.talkT=1.1;}
function doShake(n){if(S.shake)shake=Math.max(shake,n);}
function slowmo(t){slowT=Math.max(slowT,t);}
function freeze(t){hitstop=Math.max(hitstop,t);}

// ---------------- 規則 ----------------
// Free Ball：接發球時玩家站後排中間；原本站中間的人換到玩家的位置
const spot=(p,k)=>{if(k==='r'&&human&&p.team===human.team&&human.role!=='mb'){if(p===human)return SPOT.mb.r;if(p.role==='mb')return SPOT[human.role].r;}return SPOT[p.role][k];};
function newGame(){
  players=[];PID=0;ME=prep.side;
  for(const t of [0,1])for(const r of ROLES){
    if(t===ME){const p=mkP(t,r,charOf(r,prep.chars[r]),r===prep.role);if(p.human)human=p;players.push(p);}
    else players.push(mkP(t,r,pick(CHARS[r].filter(c=>c.id!==prep.chars[r])),false));}
  players.forEach((p,i)=>p.num=[4,1,7,3][i%4]+(p.team?8:0));
  score=[0,0];served=[false,false];serverIdx=[0,0];msgs=[];parts=[];
  serveTeam=rnd()<.5?0:1;served[serveTeam]=true;rebuildRigs();
  camYaw=camYawT=ME?-Math.PI/2:Math.PI/2;camPitch=camPitchT=.3;setupServe(serveTeam);say(`${COL[serveTeam].name}先發球`,COL[serveTeam].ui,true);SFX.whistle();}
function setupServe(t){
  state='serve';stT=0;
  const first=!players.some(p=>p.placed);players.forEach(p=>{const s=spot(p,'r');if(first||p.human){p.x=sd(p.team)*s.d;p.z=s.z;}p.placed=1;p.y=p.vy=p.vx=p.vz=0;p.dive=p.rec=p.stun=p.swing=p.loadT=p.landT=0;p.diveQ=null;p.jk='';p.arm=null;p.jumpAt=0;p.pose='';p.run=0;p.app=0;
    p.yaw=p.team?-Math.PI/2:Math.PI/2;p.tx=sd(p.team)*s.d;p.tz=s.z;p.blockTried=-1;p.act=null;p.swingReq=null;p.charging=false;p.approach=false;});
  // 輪發：舉球手不發球
  const order=team(t).filter(p=>p.role!=='set');server=order[serverIdx[t]%order.length];
  server.x=sd(t)*(M.half+1.4);server.z=server.human?0:(rnd()-.5)*3;server.tx=server.x;server.tz=server.z;
  ball=newBall();ball.held=server;placeHeld();ball.ox=ball.x;ball.oy=ball.y;ball.oz=ball.z;
  players.forEach(p=>{p.ox=p.x;p.oy=p.y;p.oz=p.z;});PC={};}
// 發球前球拿在拋球手的掌心（位置從角色骨架讀，上一格算好的）
function placeHeld(){const s=ball.held,h=s.holdP;if(h&&Math.hypot(h.x-s.x,h.z-s.z)<1.2){ball.x=h.x;ball.y=h.y+BR*.85;ball.z=h.z;}else{ball.x=s.x+tnet(s.team)*.32;ball.y=1.05;ball.z=s.z+.22;}ball.vx=ball.vy=ball.vz=0;}
// 拋球：從手上拋起，算好水平速度，讓球落到擊球手的正上方（站發）或身體前方約 1.5 公尺（跳發，人會助跑跟上）
function srvContact(p,kind){const f=tnet(p.team),side=p.hitS&&Math.abs(p.hitS.z-p.z)>.03?Math.sign(p.hitS.z-p.z):-f;return{x:p.x+f*(kind==='jump'?1.75:.3),y:kind==='jump'?HANDUP+.15+p.jumpH*.85:HANDUP+.12,z:p.z+side*.3};}
function startToss(p,kind){ball.held=p;placeHeld();ball.held=null;ball.toss=true;ball.tossKind=kind;
  const vy=kind==='jump'?7.2:5.4,c=srvContact(p,kind),y0=ball.y,a=.5*G,b=-vy,cc=c.y-y0,disc=b*b-4*a*cc,t=disc>0?(-b+Math.sqrt(disc))/(2*a):.9;
  ball.vy=vy;ball.vx=(c.x-ball.x)/t;ball.vz=(c.z-ball.z)/t;ball.tossT=t;p.tossAt=time;}
function point(w,why){
  if(state!=='play')return;state='point';stT=0;score[w]++;
  say(why||`${COL[w].name}得分！`,COL[w].ui,true);SFX.point();flash=.12;
  if(w!==serveTeam){if(served[w])serverIdx[w]++;served[w]=true;}serveTeam=w;
  window.ptWin=w;
  talk(pick(team(w)),LINES.win);}
const fault=(w,why)=>point(w,why);
const gameOver=()=>(score[0]>=S.win||score[1]>=S.win)&&Math.abs(score[0]-score[1])>=2;

// ---------------- 擊球判定 ----------------
function zoneOf(p){
  if(p.stun>0||p.rec>0)return null;
  const fx=Math.sin(p.yaw),fz=Math.cos(p.yaw),by=ball.y-p.y,hd=Math.hypot(ball.x-p.x,ball.z-p.z);
  if(p.dive>0){const r=p.human?1.9:1.6,d=Math.hypot(ball.x-(p.x+fx*.9),ball.z-(p.z+fz*.9));if(d<r&&ball.y<(p.human?1.15:1.0))return{k:'dig',q:clamp(1-d/r,0,1)*.7+.2};return null;}
  if(p.y>.2){const hx=p.x+fx*.3,hz=p.z+fz*.3,hy=p.y+HANDUP+.05,d=Math.hypot(ball.x-hx,ball.z-hz,(ball.y-hy)*.9),r=.65+p.st.jmp*.02;
    if(d<r){const apex=clamp(1-Math.abs(p.vy)/2.4,0,1);return{k:'air',q:clamp(1-d/r,0,1)*.55+apex*.45};}return null;}
  if(by>1.55&&by<2.7&&hd<.8){const d=Math.hypot(hd,(by-OVERY)*.8);return{k:'over',q:clamp(1-d/.85,0,1)};}
  const rr=.9+p.st.rcv*.035;
  // 快球一幀會飛 0.5 公尺以上：用這一幀球路上離手臂最近的點判定，球不會「穿過」人
  let bx=ball.x,byy=ball.y,bz=ball.z;
  if(ball.px!==undefined){const ax=p.x+fx*.35,ay=p.y+BUMPY,az=p.z+fz*.35,sx=ball.x-ball.px,sy=ball.y-ball.py,sz=ball.z-ball.pz,L2=sx*sx+sy*sy+sz*sz;
    if(L2>.04){const k=clamp(((ax-ball.px)*sx+(ay-ball.py)*sy+(az-ball.pz)*sz)/L2,0,1);bx=ball.px+sx*k;byy=ball.py+sy*k;bz=ball.pz+sz*k;}}
  const by2=byy-p.y,hd2=Math.hypot(bx-p.x,bz-p.z);
  if(by2>.2&&by2<1.35&&hd2<rr){const d=Math.hypot(bx-(p.x+fx*.35),bz-(p.z+fz*.35),(by2-BUMPY)*.8);return{k:'bump',q:clamp(1-d/(rr+.05),0,1)};}
  return null;}
function missChance(p){
  if(p.human||ball.lastTeam===p.team||ball.lastTeam===null)return 0;
  const v=Math.hypot(ball.vx,ball.vy,ball.vz);let s;
  if(ball.serve)s=ball.float>0?.05:ball.drive?.08:.03;
  else if(ball.atk)s=clamp((v-17)/26,0,.3)+(ball.heavy?.06:0);
  else if(ball.tip)s=.14;else s=.04;
  return clamp(s*D().miss*(1.3-p.st.rcv*.06),0,.9);}
function touch(p,z,intent){
  const t=p.team;let q=z.q;const fresh=ball.lastTeam!==t;
  if(!fresh&&ball.lastP===p&&!ball.blockTouch){fault(1-t,'連擊犯規');return;}
  const wasAtk=fresh&&(ball.atk||ball.serve),heavy=fresh&&ball.heavy,v=Math.hypot(ball.vx,ball.vy,ball.vz);
  if(fresh){ball.touches=0;ball.setInfo=null;ball.setter=null;ball.quickMB=null;}
  ball.touches++;if(ball.touches>3){fault(1-t,'四次擊球');return;}
  ball.serial=++SERIAL;ball.lastTeam=t;ball.lastP=p;ball.blockTouch=false;ball.cool=.2;ball.letGo=null;
  ball.serve=false;ball.atk=false;ball.heavy=false;ball.float=0;ball.tip=false;
  p.touchFx=.8;p.touchN=String(ball.touches);
  if(wasAtk)q*=clamp(1.15-(v-13)/26+p.st.rcv*.025,.3,1);
  if(!p.human)q=clamp(q*.45+(.35+(z.k==='air'?p.st.pow:z.k==='over'?p.st.set:p.st.rcv)*.05+rnd()*.22+D().q)*.55,0,1);
  p.swing=.35;
  if(heavy&&q<.55){p.stun=.8;p.vx=-tnet(t)*2.6;p.vz=0;p.vy=2.6;p.pose='stun';
    ball.vy=4.5+rnd()*1.5;ball.vx=-tnet(t)*(.8+rnd()*1.5);ball.vz=(rnd()-.5)*2.5;ball.drive=false;PC={};
    pop(p,'被打飛！','#ff8a2a');burst(ball.x,ball.y,ball.z,'#ff8a2a',16,4);doShake(.3);SFX.block();return;}
  let act;
  if(intent==='tip'&&(z.k==='air'||ball.touches===3||fresh===false&&ball.touches>=2))act='tip';
  else if(z.k==='air'&&(intent==='atk'||intent==='tip'||(!p.human&&ball.touches>=2&&p!==ball.setter)))act=intent==='tip'?'tip':'spike';
  else act=ball.touches===1?'pass':ball.touches===2?'set':'over';
  p.pose=act==='spike'||act==='tip'&&z.k==='air'?'spike':z.k==='over'||act==='set'&&z.k!=='bump'?'over':z.k==='dig'?'dig':'bump';
  if(p.pose==='bump')actKey(p,'bump',.06);else if(p.pose==='over')actKey(p,'set',.08);
  else if(p.pose==='spike'&&!(p.act&&p.act.slot==='spike'))actKey(p,'spike',.08);
  if(act==='pass')doPass(p,q,wasAtk);else if(act==='set')doSet(p,q);else if(act==='spike')doSpike(p,q);else if(act==='tip')doTip(p,q);else doOver(p,q);
  if(state==='play'&&(p.human||act==='spike')){const lab=q>.82?['PERFECT','#ffd23f']:q>.5?['GOOD','#3ee0a0']:['BAD','#a9b0cc'];pop(p,lab[0],lab[1]);}
  // 頓點：接到、扣到的瞬間整場停一下，你自己的動作停得比較明顯
  freeze(act==='spike'?(p.human?(q>.82?.13:.09):.05):p.human?.07:wasAtk?.035:0);if(p.human)doShake(act==='spike'?.25:.08);
  if(typeof hitFx==='function')hitFx(p,act,q,z.k,v,wasAtk);
  ballPop=act==='spike'?1:.6;if(p.human){if(act==='spike'||act==='tip')fovKick=act==='spike'?(q>.82?7:4.5):2;else camKick=z.k==='over'?.05:.11;}}
let ballPop=0,fovKick=0,camKick=0;
function doPass(p,q,wasAtk){
  const t=p.team,sdt=sd(t),err=(1-q)*2.6;
  // 一傳自動送向舉球手現在的位置
  const st=team(t).find(x=>x.role==='set'&&x!==p&&x.stun<=0),ss=st&&Math.abs(st.x)<3.2?{d:clamp(Math.abs(st.x),.6,2.4),z:clamp(st.z,-M.wid+.6,M.wid-.6)}:SPOT.set.a;
  let tx=sdt*Math.max(.5,ss.d+(rnd()-.3)*err*.85),tz=ss.z+(rnd()-.5)*err*1.6,apex=2.85+(1-q)*.5;
  if(q<.2&&rnd()<.35){tx=sd(1-t)*(1+rnd()*2);say('一傳直接過網！','#a9b0cc');}
  lobTo(tx,0,clamp(tz,-M.wid+.3,M.wid-.3),apex);ball.passQ=q;SFX.hit();cloud(ball.x,ball.y,ball.z);
  const mb=team(t).find(x=>x.role==='mb'&&!x.human&&x!==p&&x.stun<=0);if(mb&&q>.6&&rnd()<.35)ball.quickMB=mb;
  if(wasAtk&&q>.6)talk(p,'接到了！');}
function chooseSetter(t){const tm=team(t).filter(p=>p!==ball.lastP&&p.stun<=0);const Ls=predict(OVERY)||{x:ball.x,z:ball.z,t:1},dist=p=>Math.hypot(p.x-Ls.x,p.z-Ls.z);
  const s=tm.find(p=>p.role==='set');if(s&&dist(s)/spd(s)<(Ls.t||1)+.6)return s;
  const ai=tm.filter(p=>!p.human);return ai.length?ai.reduce((a,b)=>dist(a)<dist(b)?a:b):tm[0];}
// 舉球手決定托給誰：玩家叫球或正在助跑就給玩家；不然看對方攔網站哪邊，往空的那邊托
const setMemo=[[],[]];
function doSet(p,q){
  const t=p.team,sdt=sd(t),cands=team(t).filter(x=>x!==p&&x.stun<=0&&x.role!=='set');
  if(!cands.length){doOver(p,q);return;}
  const air=cands.filter(x=>x.y>.25&&x.vy>-1&&Math.abs(x.x)<2.6);
  if(air.length){const h=air.find(x=>x.human)||air[0],tA=timeToApex(h),tt=clamp(tA+.12,.42,.75),hy=heightAfter(h,tt)+HANDUP,fx=Math.sin(h.yaw),fz=Math.cos(h.yaw);
    sendTo(h.x+h.vx*tt+fx*.3,hy,h.z+h.vz*tt+fz*.3,tt);finishSet(p,h,'quick');return;}
  let h=null,type='high';
  if(human&&cands.includes(human)&&!p.human){const called=time-human.calledAt<1.6,running=human.run>.35&&human.y===0;
    if(called||running||rnd()<.3)h=human;}
  if(!h){const opp=team(1-t),front=z=>opp.filter(o=>Math.abs(o.x)<2.2&&Math.abs(o.z-z)<1.6).length;
    const w=cands.map(c=>({c,w:(c.role==='oh'?1.5:c.role==='op'?1.1:ball.passQ>.6?1:.2)/(1+front(spot(c,'a').z)*.8)}));
    // 避免一直托給同一個人（v7：記住前兩次）
    w.forEach(x=>{if(setMemo[t].includes(x.c.id))x.w*=.35;});
    let r=rnd()*w.reduce((a,b)=>a+b.w,0);for(const x of w){r-=x.w;if(r<=0){h=x.c;break;}}h=h||cands[0];}
  setMemo[t].push(h.id);if(setMemo[t].length>2)setMemo[t].shift();
  if(h.role==='mb'&&ball.passQ>.55&&!h.human)type='quick';
  if(ball.passQ<.4)type='safe';
  if(p.role==='set'&&p.ch.id==='yukina'&&rnd()<.12&&ball.passQ>.6&&!h.human){doTip(p,.8);return;}
  const lane=type==='quick'?{d:.7,z:clamp(h.z,-1,1.2)}:type==='safe'?{d:1.6,z:clamp(h.z,-3,3)}:
    h.human?{d:1.05,z:clamp(h.z,-M.wid+.5,M.wid-.5)}:{d:1.05,z:h.role==='oh'?-3.4:h.role==='op'?3.4:clamp(h.z,-2,2)};
  const hitY=HANDUP+jumpProf(h,.6).hApex-.1;
  let err=(1-q)*1.3*(1.3-p.st.set*.05)+(1-ball.passQ)*.3;if(p.role!=='set')err=err*1.5+.25;
  lobTo(sdt*Math.max(.45,lane.d+(rnd()-.5)*err),hitY,lane.z+(rnd()-.5)*err*1.6,Math.max(hitY+.45,type==='quick'?3.25:type==='safe'?4.5:4.0));
  finishSet(p,h,type);}
function finishSet(p,h,type){ball.setInfo={hitter:h,type};const CALL={high:'高球',quick:'快攻',safe:'修正球'};talk(p,(h.human?'給你・':'')+CALL[type]+'！');SFX.set();}
// 落點：玩家用畫面中央的準星（鏡頭看哪裡就打哪裡），AI 找對方空檔
// 瞄準規則：準星指到哪就打哪，但一定限制在對方場內（離邊線 0.4 公尺）；會出界只會因為擊球時機差（落點散開）
function humanAim(t){const so=sd(1-t);let x=cursorG.ok?cursorG.x:so*5,z=cursorG.ok?cursorG.z:0;
  if(Math.sign(x)!==so||Math.abs(x)<1)x=so*Math.max(1.2,Math.abs(x));
  return{d:clamp(Math.abs(x),1.2,M.half-.4),z:clamp(z,-M.wid+.4,M.wid-.4)};}
function aiAim(t){const o=1-t,opp=team(o);let best=null,bs=-1;
  for(let i=0;i<3;i++){const d=2.2+rnd()*(M.half-3.2),z=(rnd()-.5)*2*(M.wid-.9),x=sd(o)*d;const s=Math.min(...opp.map(q=>Math.hypot(q.x-x,q.z-z)))+rnd()*.8;if(s>bs){bs=s;best={d,z};}}return best;}
function blockUp(t){return team(1-t).some(b=>b.y>.3&&Math.abs(b.x)<1.2&&Math.abs(b.z-ball.z)<1.2);}
// AI 扣球決策（v7）：先看攔網（沒人／慢了／到位），再依權重選路線
function blockRead(t){const bl=team(1-t).filter(b=>b.stun<=0&&Math.abs(b.x)<1.3&&Math.abs(b.z-ball.z)<1.4);
  if(!bl.length)return{up:false};const b=bl[0],air=b.y>.3||b.loadT>0||b.jumpAt>0;return{up:true,air,late:!air||b.vy<-.5,b};}
const PLAN_N={short:'斜線短球',power:'重扣',deep:'長球',tool:'打手',tip:'吊球'};
function aiPlan(p){const B=blockRead(p.team);
  const w=B.up&&B.air&&!B.late?{short:.12,power:.1,deep:.3,tool:.25+p.st.pow*.01,tip:.2}:B.up&&!B.late?{short:.2,power:.3,deep:.25,tool:.1,tip:.15}:{short:.3,power:.45,deep:.2,tool:0,tip:.05};
  let r=rnd()*Object.values(w).reduce((a,b)=>a+b,0);for(const k in w){r-=w[k];if(r<=0)return{k,B};}return{k:'power',B};}
function planAim(p,k,B){const t=p.team,cross=-Math.sign(p.z||1);
  if(k==='short')return{d:2+rnd()*1.6,z:cross*(1.5+rnd()*2.5)};
  if(k==='deep')return{d:6.6+rnd()*1.4,z:clamp(p.z+(rnd()-.5)*2,-M.wid+.6,M.wid-.6)};
  if(k==='tool'&&B.b)return{d:5+rnd()*2,z:clamp(B.b.z+(rnd()<.5?-1:1)*.45,-M.wid,M.wid)};
  return aiAim(t);}
function doSpike(p,q){
  const t=p.team,so=sd(1-t);let plan=null;
  if(!p.human){plan=p.plan||aiPlan(p);p.plan=null;if(plan.k==='tip'){p.tipAim=plan.aim;doTip(p,q);return;}}
  const a=p.human?humanAim(t):plan.aim||planAim(p,plan.k,plan.B);let d=a.d,zz=a.z;
  const err=(1-q)*(p.human?.5:1.6*D().err);d+=(rnd()-.5)*err;zz+=(rnd()-.5)*err*1.3;
  if(!p.human&&rnd()<.22*(1-q)*(1-q)*D().err)d+=2.4;
  const speed=(14+p.st.pow*1.1)*(.72+.42*q)*(.88+.22*(p.app||0))*(p.human?1:.9);
  driveTo(so*d,zz,speed);p.hangT=.18;
  ball.atk=true;ball.attacker=p;ball.toolAim=!!(plan&&plan.k==='tool');ball.power=p.st.pow*(.6+.6*q)*(.85+.25*(p.app||0));ball.heavy=q>.85&&p.st.pow>=8;
  if(q>.82){slowmo(.1);doShake(.35);SFX.sup();burst(ball.x,ball.y,ball.z,'#ffd23f',22,5);}else{doShake(.12);SFX.spike();burst(ball.x,ball.y,ball.z,'#ffffff',10,3);}
  talk(p,LINES.spike);}
// 輕打：把球輕輕推過攔網，落在準星位置（AI：攔網後方的空檔）
function doTip(p,q=.6){
  const t=p.team,so=sd(1-t);let d,z;
  if(p.human){const a=humanAim(t);d=clamp(a.d,1,M.half-.6);z=clamp(a.z,-M.wid+.4,M.wid-.4);}else if(p.tipAim){d=p.tipAim.d;z=p.tipAim.z;p.tipAim=null;}else{d=1.2+rnd()*2.4;z=(rnd()-.5)*2*(M.wid-.8);}
  d+=(rnd()-.5)*(1-q)*.8;lobTo(so*d,0,z,Math.max(ball.y+.45,NETH+.8));ball.tip=true;pop(p,'輕打','#ffffff');SFX.hit();}
function doOver(p,q){const so=sd(1-p.team);lobTo(so*(4+rnd()*3.5),0,(rnd()-.5)*2*(M.wid-1),4.0);ball.free=true;talk(p,'過去！');SFX.hit();}
const SERVEN={stand:'飄球',jump:'跳發'};
function doServe(p,kind,q){
  const t=p.team,so=sd(1-t);ball.toss=false;ball.held=null;ball.serve=true;ball.serial=++SERIAL;
  let d=4.5+rnd()*3.8,z=(rnd()-.5)*2*(M.wid-.6);
  if(p.human){const a=humanAim(t);d=a.d;z=a.z;}
  // 時機越差，落點散得越開：PERFECT 幾乎打在準星上，BAD 可能偏 1.5 公尺以上
  const sc=Math.pow(1-q,1.5)*(kind==='jump'?3:2.4);d+=(rnd()-.5)*sc;z+=(rnd()-.5)*sc*.8;
  if(kind==='jump'){driveTo(so*d,z,(13+p.st.pow*.7)*(.85+.25*q));ball.power=p.st.pow*.5;burst(ball.x,ball.y,ball.z,'#ffd23f',12,3);doShake(.2);SFX.spike();if(typeof hitFx==='function')hitFx(p,'spike',q,'air',0,false);}
  else{if(typeof fxSpawn==='function'){fxSpawn({tex:'ring',col:'#ffffff',x:ball.x,y:ball.y,z:ball.z,s0:.15,s1:1.2,life:.28,a:.8});fxSpawn({tex:'glow',col:'#ffffff',x:ball.x,y:ball.y,z:ball.z,s0:.7,s1:.2,life:.12,depth:false});}
    d=Math.max(d,2.5);driveTo(so*d,z,12.5+p.st.pow*.3);ball.drive=false;
    // 弧度至少要高過網子 0.35 公尺：落點很近網時自動把弧線拉高
    let ap=Math.max(ball.y+.5,3.7);for(let i=0;i<12;i++){lobTo(so*d,0,z,ap);const tn=-ball.x/ball.vx,yn=ball.y+ball.vy*tn-.5*G*tn*tn;if(!(tn>0)||yn>NETH+.35)break;ap+=.3;}
    ball.float=1;SFX.hit();}
  ball.lastTeam=t;ball.lastP=p;ball.touches=0;ball.cool=.3;state='play';p.swing=kind==='jump'?.35:.5;p.pose=kind==='jump'?'spike':'serve';actKey(p,'serve',.1);
  const lab=q>.82?['PERFECT','#ffd23f']:q>.5?['GOOD','#3ee0a0']:['BAD','#a9b0cc'];pop(p,SERVEN[kind]+' '+lab[0],lab[1]);}
