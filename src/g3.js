
// ---------------- 4 AI ----------------
// 隊伍大腦：接發球誰接、舉球手跑位、攻手退到助跑點再衝、對方進攻時兩人攔網其他人分區防守
function brain(t){
  const mine=team(t),sdt=sd(t),ai=mine.filter(p=>!p.human);
  const go=(p,d,z)=>{p.tx=sdt*d;p.tz=z;};
  ai.forEach(p=>p.approach=false);
  if(state==='serve'){ai.forEach(p=>{if(p!==server){const s=spot(p,'r');go(p,s.d,s.z);}});return;}
  if(state!=='play')return;
  const ours=ball.lastTeam===t;ball.call[t]=null;
  if(!ours){
    const o=1-t,oT=ball.lastTeam===o?ball.touches:0,onTheirSide=Math.sign(ball.x)!==sdt;
    // 對方在組織進攻：兩個網前的人攔網，其他人照攻手的位置分區防守
    if(ball.lastTeam===o&&oT>=1&&oT<=2&&onTheirSide){
      const hh=ball.setInfo&&ball.setInfo.hitter,hz=hh?hh.z:(oT===1?0:ball.z);
      const front=mine.filter(p=>p.role!=='set'||Math.abs(p.x)<2).sort((a,b)=>Math.abs(a.z-hz)-Math.abs(b.z-hz)).slice(0,2);
      // 攔網站位：對準「球會過網的地方」，邊線攻手大多打斜線，所以往場中間收 25%；判斷誤差看攔網能力
      const cz=Math.abs(hz)>1.2?hz*.62:hz;if(b0read.s!==ball.serial){b0read.s=ball.serial;b0read.e={};}
      front.forEach((b,i)=>{if(b.human)return;const e=b0read.e[b.id]??(b0read.e[b.id]=(rnd()-.5)*(.9-b.st.blk*.05));
        go(b,.5,clamp(cz+e+(front.length>1?(i?.42:-.42)*(b.z<cz?1:-1):0),-M.wid+.4,M.wid-.4));
        // 起跳時機：讓攔網手的最高點對上攻手的最高點（攔網跳得比較低，要晚一點跳），誤差看攔網能力
        if(hh&&hh.y>.05&&hh.vy>0&&b.blockTried!==ball.serial&&b.y===0&&Math.abs(b.x)<1.4){b.blockTried=ball.serial;
          if(rnd()<D(b).blk*(.75+b.st.blk*.025)){const th=hh.vy/PG,tb=jumpProf(b,0,'blk').tApex;b.jumpAt=time+Math.max(.02,th-tb+.09+(rnd()-.5)*(.34-b.st.blk*.022)/D(b).read);}}});
      // 後排防守站深一點、靠邊線（扣球大多落在後場兩角）；先補滿兩個深區，人多才站短區
      const zones=[{d:7,z:clamp(-hz*.35-2.6,-3.8,-1.4)},{d:7,z:clamp(-hz*.35+2.6,1.4,3.8)},{d:3.6,z:clamp(-hz*.6,-3,3)}];
      ai.filter(p=>!front.includes(p)).forEach(p=>{let bi=0,bd=99;zones.forEach((zn,i)=>{if(zn.used||i===2&&!(zones[0].used&&zones[1].used))return;const dd=Math.hypot(p.x-sdt*zn.d,p.z-zn.z);if(dd<bd){bd=dd;bi=i;}});zones[bi].used=1;go(p,zones[bi].d,zones[bi].z);});}
    else ai.forEach(p=>{const s=spot(p,'r');go(p,s.d,s.z);});
    // 會出界的球：判斷要不要放掉（偶爾判斷錯）
    const L=predict(BUMPY),L0=predict(0);
    if(L0&&ball.lastTeam!==null&&(Math.abs(L0.x)>M.half+.12||Math.abs(L0.z)>M.wid+.12)){ball.letGo=ball.letGo||{};if(ball.letGo[t]===undefined)ball.letGo[t]=rnd()<clamp(.55+.25*D(mine[0]).read,.3,.95);}
    const letGo=ball.letGo&&ball.letGo[t];
    if(!letGo&&L&&Math.sign(L.x)===sdt&&ball.lastTeam!==null&&Math.abs(L.x)<M.half+3.5&&Math.abs(L.z)<M.wid+3){
      const cand=mine.filter(p=>p.stun<=0&&p.rec<=0&&p.y<.3);
      const cost=p=>Math.hypot(p.x-L.x,p.z-L.z)/spd(p)+(p.role==='set'?.9:0)-(p.human?.2:0);
      if(cand.length){let ch=cand.reduce((a,b)=>cost(a)<cost(b)?a:b);
        if(ch.human&&Math.hypot(ch.x-L.x,ch.z-L.z)/spd(ch)>L.t+.35){const o2=cand.filter(p=>!p.human);if(o2.length)ch=o2.reduce((a,b)=>cost(a)<cost(b)?a:b);}
        ball.call[t]=ch;
        if(!ch.human){go(ch,Math.abs(L.x)+.3,L.z);if(ball.callN!==ball.serial){talk(ch,LINES.call);ball.callN=ball.serial;}
          const dd=Math.hypot(L.x-ch.x,L.z-ch.z);
          if(dd/spd(ch)>L.t+.04&&L.t<.7&&ch.dive<=0&&ch.y===0&&ch.rec<=0&&dd<3.6+ch.st.rcv*.06&&dd>.7)startDive(ch,L,Math.min(6.5+ch.st.rcv*.15,(dd-.8)/Math.max(.15,L.t-.05)));}}}
  }else{
    const tc=ball.touches;
    if(tc===1){const st=chooseSetter(t);ball.setter=st;const Ls=predict(OVERY);
      // 跳舉：一傳夠好、球夠高、靠網時，舉球手有時會跳起來舉（節奏更快），也偶爾直接吊二次球
      if(st&&!st.human&&st.jsetS!==ball.serial){st.jsetS=ball.serial;st.jset=null;const hi=predict(OVERY+.55);
        if(hi&&Ls&&ball.passQ>.55&&Math.abs(Ls.x)<2.2&&hi.t>.45&&rnd()<.45){const near=team(1-t).filter(b=>Math.abs(b.x)<1.6&&Math.abs(b.z-Ls.z)<1.3).length;
          st.jset=(near===0&&rnd()<.4)||rnd()<.1?'dump':'set';}}
      if(st&&st.jset&&st.y===0&&!st.human){const hi=predict(OVERY+.55),J=jumpProf(st,0);if(hi&&hi.t<=J.tApex+.02&&Math.hypot(st.x-hi.x,st.z-hi.z)<.7){st.vx=st.vz=0;doJump(st,false,0);if(st.jset==='set')JSTAT.jset=(JSTAT.jset||0)+1;else JSTAT.dump=(JSTAT.dump||0)+1;}}
      ai.forEach(p=>{if(p===st){if(Ls)go(p,Math.max(.4,Math.abs(Ls.x)+.12),Ls.z);}
        else if(p===ball.quickMB){go(p,.8,.25);const J=jumpProf(p,.4);if(Ls&&p.y===0&&Ls.t<J.tApex-.04&&Math.hypot(p.x-sdt*.8,p.z-.25)<1){p.vx=p.vz=0;doJump(p,false,.4);planAtk(p);}}
        // 玩家舉球選了平快：左右攻提早往前站（平快飛行時間短，從後場助跑會來不及）
        else{const s=spot(p,'a'),fastW=st===human&&human.human&&(p.role==='oh'||p.role==='op')&&(human.setType==='fast'||human.setType==='quick');go(p,fastW?Math.min(s.d,2.5):s.d,s.z);}});}
    else if(tc===2){const h=ball.setInfo&&ball.setInfo.hitter;
      ai.forEach(p=>{if(p!==h){const s=spot(p,'c');go(p,s.d,s.z);}});
      // 攻手助跑：先退到起跳點後面，時間到了往網前衝、在對的時機起跳
      if(h&&!h.human&&h.stun<=0&&h.y===0){
        const J=jumpProf(h,.7),Lh=predict(HANDUP+J.hApex-.05);
        if(Lh&&Math.sign(Lh.x)===sdt){const sx=Math.abs(Lh.x)+.3,lead=Lh.t-J.tApex;
          if(lead>.55)go(h,sx+1.8,Lh.z);else{go(h,sx,Lh.z);h.approach=true;h.run=Math.max(h.run,.7);}
          const dist=Math.hypot(h.x-sdt*sx,h.z-Lh.z);
          if(dist<(ball.setInfo&&ball.setInfo.type==='fast'?1.1:.7)&&lead<=.04&&lead>-.2){doJump(h,true,.7);planAtk(h);}}}}
    else ai.forEach(p=>{const s=spot(p,'r');go(p,s.d,s.z);});
  }}
// AI 攻手起跳時就決定要打哪裡（身體會轉向那邊，玩家可以預判）
function planAtk(p){if(p.human)return;const pl=aiPlan(p);if(pl.k!=='tip')pl.aim=planAim(p,pl.k,pl.B);else pl.aim={d:1.2+rnd()*2.4,z:(rnd()-.5)*2*(M.wid-.8)};p.plan=pl;p.airT=0;}
function startDive(p,L,sp){actKey(p,'dive',.25);if(p.human||Math.hypot(p.x-human.x,p.z-human.z)<6)SFX.squeak();const dx=L.x-p.x,dz=L.z-p.z,l=Math.hypot(dx,dz)||1;sp=sp||Math.min(8,l/.35);p.vx=dx/l*sp;p.vz=dz/l*sp;p.dive=.5;p.diveT=.5;p.yaw=Math.atan2(dx,dz);talk(p,LINES.dive);}
// 玩家飛撲：照球到達的時間算速度，身體滑到「手剛好在球下面」的位置；球還太遠時先記下來，時機到了自動撲出去
function diveCan(p){return state==='play'&&ball&&!(ball.lastTeam===p.team&&(ball.lastP===p||ball.touches>=3));}
function tryDive(p){if(!diveCan(p))return false;const L=predict(.45);if(!L||Math.sign(L.x)!==sd(p.team))return false;const dd=Math.hypot(L.x-p.x,L.z-p.z);
  if(dd<1.0||dd>4.2+p.st.rcv*.06)return false;if(L.t>.72){p.diveQ={s:ball.serial,until:time+1.6};return true;}humanDive(p,L);return true;}
function humanDive(p,L){const dx=L.x-p.x,dz=L.z-p.z,l=Math.hypot(dx,dz)||1,ux=dx/l,uz=dz/l,reach=.85,dist=Math.max(0,l-reach),t=Math.max(.16,L.t-.04),k=1.2;
  let v=dist*k/(1-Math.exp(-k*t));v=Math.min(6.5+p.st.rcv*.15,Math.max(3,v));p.diveQ=null;startDive(p,L,v);p.vx=ux*v;p.vz=uz*v;p.dive=p.diveT=clamp(L.t+.18,.45,.95);p.diveAim=L;p.arm='rcv';p.armT=p.dive+.05;}
function doJump(p,keepV,app){if(p.y>0||p.dive>0||p.rec>0||p.stun>0)return;p.jumpN=(p.jumpN||0)+1;
  const blkJ=state==='play'&&Math.abs(p.x)<1.6&&ball&&ball.lastTeam!==p.team&&Math.sign(ball.x)!==sd(p.team);p.jk=blkJ?'blk':'';
  if(blkJ&&MOCAP.block){const c=MOCAP.block;playAct(p,'block',Math.max(0,clipKey(c)-.3),{hold:clipKey(c),until:()=>p.y<=0&&p.vy<=0});}
  else if(!(p.act&&p.act.slot==='jump'))actKey(p,'jump',.02);
  p.app=blkJ?0:app??p.run;p.run=0;p.vy=jumpProf(p,p.app,p.jk).v;if(!keepV){p.vx=0;p.vz=0;}else{p.vx*=.5;p.vz*=.5;}p.hitDone=false;p.swingReq=null;p.prevD=9;p.hoverT=0;jumpAssist(p);}
// 起跳自動修正：攻手對準擊球點、攔網對準球過網的位置；起跳後玩家還能用方向鍵微調
function jumpAssist(p){const tA=timeToApex(p)||.3;
  if(state==='play'&&ball.lastTeam===p.team&&ball.touches>=1&&Math.sign(ball.x)===sd(p.team)){
    const Lh=predict(heightAfter(p,tA)+HANDUP-.05);if(!Lh)return;const fx=Math.sin(p.yaw),fz=Math.cos(p.yaw),tx=Lh.x-fx*.3,tz=Lh.z-fz*.3,tt=Math.max(.2,Math.min(tA+.08,Lh.t));
    let vx=(tx-p.x)/tt,vz=(tz-p.z)/tt;const l=Math.hypot(vx,vz),mx=p.human?5.5:5;if(l>mx){vx*=mx/l;vz*=mx/l;}p.vx=vx;p.vz=vz;p.assist=true;}
  else if(state==='play'&&ball.lastTeam!==p.team&&Math.abs(p.x)<1.6){const L=predict(NETH+.3),tz=L?L.z:ball.z;p.vz=clamp((tz-p.z)/tA,p.human?-1.3:-2.5,p.human?1.3:2.5);p.vx=0;p.assist=true;}}

// ---------------- 玩家扣球：保證打得到 ----------------
// 空中按攻擊＝出手。球已經在手邊就馬上打；還沒到就等球過來，在球最靠近手的那一刻自動打到（球會被吸到手上）。
const b0read={s:-1,e:{}},JSTAT={};
// 擊球品質看「時機」：在跳躍最高點、球剛好到手邊最好。
const MAGNET=2.4;
function humanAir(p){
  if(p.y<=.15||p.hitDone||!p.swingReq||state!=='play')return;
  if(ball.lastTeam===p.team&&ball.lastP===p)return;
  if(Math.sign(ball.x)!==sd(p.team)&&Math.abs(ball.x)>.3)return;
  if(ball.lastTeam===p.team&&ball.touches>=3)return;
  const fx=Math.sin(p.yaw),fz=Math.cos(p.yaw),hx=p.x+fx*.3,hy=p.y+HANDUP+.05,hz=p.z+fz*.3,d=Math.hypot(ball.x-hx,ball.y-hy,ball.z-hz);
  // 按晚了（球已經掉到手下面）也照樣打得到，只是比較弱
  const leaving=d>p.prevD+.002,landing=p.vy<0&&p.y<.35,late=p.pressLate&&ball.vy<0&&ball.y<hy-.15;p.prevD=d;
  // 出手後球還在飛過來：人在空中多停一下等球（最多約 0.5 秒）
  if(!leaving&&p.vy<.3&&d<4.5&&(p.hoverT||0)<.5){p.hangT=Math.max(p.hangT,.04);p.vy=Math.max(p.vy,-.6);p.hoverT=(p.hoverT||0)+1/60;}
  if(d<.5||(d<MAGNET&&(leaving||landing))||(late&&d<MAGNET+.8)){
    const apex=clamp(1-Math.abs(p.vy)/2.6,0,1),close=clamp(1-(d-.35)/(MAGNET-.35),0,1),q=clamp((apex*.55+close*.45)*(late?.6:1),0,1);
    ball.x=lerp(ball.x,hx,.9);ball.y=lerp(ball.y,hy,.9);ball.z=lerp(ball.z,hz,.9);PC={};
    p.hitDone=true;p.charging=false;const it=p.swingReq;p.swingReq=null;touch(p,{k:'air',q},it);}}

// ---------------- 更新 ----------------
function updatePlayer(p,dt){
  for(const k of ['swing','talkT','touchFx'])if(p[k]>0)p[k]-=dt;
  if(p.pop&&(p.pop.t-=dt)<=0)p.pop=null;
  if(p.armT>0&&(p.armT-=dt)<=0)p.arm=null;
  if(p.jumpAt&&time>=p.jumpAt){p.jumpAt=0;doJump(p,false,0);}
  if(p.loadT>0){p.loadT-=dt;if(p.loadT<=0&&p.y===0){p.run=p.loadApp||0;doJump(p,true);}}
  if(p.landT>0)p.landT-=dt;
  let dvx=0,dvz=0;
  if(p.stun>0)p.stun-=dt;
  else if(p.dive>0){p.dive-=dt;if(p.dive<=0){p.rec=.45;p.vx=p.vz=0;}}
  else if(p.rec>0){p.rec-=dt;p.vx*=.8;p.vz*=.8;}
  else if(p.lungeT>0){p.lungeT-=dt;dvx=p.vx;dvz=p.vz;}
  else if(p.human){if(state==='point')dvx=dvz=0;else{const iv=inputVec(),s=spd(p)*(p.ready?.62:1)*(p.loadT>0?.3:1)*(p.landT>0?.45:1);dvx=iv.x*s;dvz=iv.z*s;}}
  else{const dx=p.tx-p.x,dz=p.tz-p.z,l=Math.hypot(dx,dz),s=spd(p);if(l>.06){dvx=dx/l*Math.min(s,l*5);dvz=dz/l*Math.min(s,l*5);}}
  if(p.dive<=0&&p.stun<=0){
    if(p.y>0){if(p.human){const iv=inputVec();p.vx+=iv.x*3.2*dt;p.vz+=iv.z*3.2*dt;}}
    else{const k=Math.min(1,dt*(p.human?24:16));p.vx+=(dvx-p.vx)*k;p.vz+=(dvz-p.vz)*k;}}
  if(p.stun>0||p.dive>0){p.vx*=1-dt*1.2;p.vz*=1-dt*1.2;}
  p.x+=p.vx*dt;p.z+=p.vz*dt;
  if(p.hangT>0)p.hangT-=dt;
  if(p.y>0||p.vy>0){p.vy-=PG*pGravK(p.vy,p.hangT,p.jk)*dt;p.y+=p.vy*dt;
    if(p.y<=0){p.y=0;p.vy=0;p.app=0;p.plan=null;p.jset=null;p.assist=false;p.landT=p.jk==='blk'?.1:.2;p.jk='';p.charging=false;p.swingReq=null;if(!p.act||['jump','spike','block','serve'].includes(p.act.slot))actKey(p,'land',.02);}}
  else{const toward=p.vx*tnet(p.team);p.run=toward>1.6?Math.min(1,p.run+dt*2.2):Math.max(0,p.run-dt*3);}
  const lim=M.half+7,s=sd(p.team),zl=M.wid+6.5;p.x=s<0?clamp(p.x,-lim,-.3):clamp(p.x,.3,lim);p.z=clamp(p.z,-zl,zl);
  if(state==='serve'&&p===server&&!ball.toss)p.x=s<0?Math.min(p.x,-(M.half+.4)):Math.max(p.x,M.half+.4);
  const toNet=p.team?-Math.PI/2:Math.PI/2,sp=Math.hypot(p.vx,p.vz);let want=toNet;
  if(p.dive>0)want=Math.atan2(p.vx,p.vz);
  else if(state==='play'&&Math.sign(ball.x)===s&&Math.hypot(ball.x-p.x,ball.z-p.z)<3.5&&p.y===0)want=Math.atan2(ball.x-p.x,ball.z-p.z);
  else if(sp>2.5&&p.y===0&&(p.vx*tnet(p.team))>-sp*.3)want=Math.atan2(p.vx,p.vz);
  if(!p.human&&p.y>0&&p.plan&&p.plan.aim){p.airT=(p.airT||0)+dt;want=Math.atan2(sd(1-p.team)*p.plan.aim.d-p.x,p.plan.aim.z-p.z);}
  if(p.human&&p.dive<=0){if(p.y>0)want=camYaw;else if(p.ready&&state==='play')want=Math.atan2(ball.x-p.x,ball.z-p.z);else if(sp>.5)want=Math.atan2(p.vx,p.vz);else want=p.yaw;}
  else if(Math.abs(angDiff(toNet,want))>1.7)want=toNet+Math.sign(angDiff(toNet,want))*1.7;
  p.yaw=angLerp(p.yaw,want,Math.min(1,dt*(p.dive>0?20:p.human?16:12)));}
function humanInput(dt){
  const p=human;if(!p)return;
  if(T('call')&&state==='play'){p.calledAt=time;talk(p,'給我！');SFX.call();}
  if(T('skill')){if(!skActivate(p)&&!p.skOn)say('技能量表還沒滿（'+Math.floor(p.sk||0)+'%）','#a9b0cc');}
  if(state==='serve'&&server===p){
    if(!ball.toss&&T('atk')&&time-(p.tossAt||-9)>.35){startToss(p,A('mod')?'jump':'stand');if(ball.tossKind==='jump')say('跳發！','#fff');}
    else if(ball.toss&&T('atk')&&time-p.tossAt>.15){const kind=ball.tossKind==='jump'&&p.y>.2?'jump':'stand',c=srvContact(p,'stand'),f=tnet(p.team),hx=p.x+f*.3,hy=p.y+HANDUP+.12,d=Math.hypot(ball.y-hy,(ball.x-hx)*.7,(ball.z-c.z)*.5);
      // 發球判定：球在擊球手附近 1.4 公尺內都打得到，越接近手（球在最佳高度）越好
      if(d<1.4){ball.x=lerp(ball.x,hx,.6);ball.y=lerp(ball.y,hy,.7);doServe(p,kind,clamp(1-d/1.4,0,1));}}
    // 跳發：拋出後自動助跑兩步、起跳
    if(ball.toss&&ball.tossKind==='jump'&&p.y===0){const ta=time-p.tossAt;if(ta>.12&&ball.vy>2.4){p.vx=tnet(p.team)*2.6;p.vz=0;p.lungeT=.05;}if(ball.vy<2.6&&ball.vy>0&&p.loadT<=0){p.loadT=.1;p.loadApp=.6;}}
    return;}
  if(state!=='play')return;
  // 起跳：先在地上蹲一下（0.12 秒），再離地
  if(T('jump')&&p.y===0&&p.loadT<=0){const blk=Math.abs(p.x)<1.6&&ball.lastTeam!==p.team;if(blk&&p.landT<=.06){p.landT=0;p.vx=p.vz=0;doJump(p,false,0);}else if(!blk&&p.landT<=0){p.loadT=.12;p.loadApp=p.run;actKey(p,'jump',.14);}}
  // 攔網：原地立刻起跳，往球過網的位置橫移，手自動舉高
  if(T('block')&&p.y===0&&p.landT<=.06&&p.loadT<=0){p.landT=0;p.vx=p.vz=0;doJump(p,false,0);}
  if(p.diveQ){if(p.diveQ.s!==ball.serial||time>p.diveQ.until||!diveCan(p)||p.y>0)p.diveQ=null;else if(p.dive<=0&&p.rec<=0){const L=predict(.45);if(!L||Math.sign(L.x)!==sd(p.team))p.diveQ=null;else if(L.t<=.66)humanDive(p,L);}}
  // 撲出去的前 0.2 秒還能跟著球微調方向（球被碰到改變路線時不會撲空）
  if(p.dive>0&&p.diveT-p.dive<.22&&p.diveAim){const L=predict(.45);if(L&&Math.sign(L.x)===sd(p.team)){const fx=Math.sin(p.yaw)*.85,fz=Math.cos(p.yaw)*.85,ex=L.x-(p.x+fx),ez=L.z-(p.z+fz),tt=Math.max(.12,L.t);
    p.vx+=clamp(ex/tt,-4,4)*dt*3;p.vz+=clamp(ez/tt,-4,4)*dt*3;}}
  p.ready=A('rcv')&&p.y===0&&p.dive<=0;p.readyT=p.ready?p.readyT+dt:0;
  // 擺著接球姿勢時，球快到了但偏一點：自動跨一步過去
  if(p.ready&&!(p.lungeT>0)&&ball.lastTeam!==p.team&&p.lunged!==ball.serial){const Lb=predict(BUMPY);
    if(Lb&&Math.sign(Lb.x)===sd(p.team)&&Lb.t<.42&&Lb.t>.06){const ax=Lb.x-Math.sin(p.yaw)*.3,az=Lb.z-Math.cos(p.yaw)*.3,dd=Math.hypot(ax-p.x,az-p.z);
      if(dd>.45&&dd<2.6){const tt=Math.max(.1,Lb.t-.05);p.vx=(ax-p.x)/tt;p.vz=(az-p.z)/tt;const v=Math.hypot(p.vx,p.vz);if(v>9){p.vx*=9/v;p.vz*=9/v;}p.lungeT=tt;p.lunged=ball.serial;}}}
  if(p.y>0&&!p.hitDone&&(T('atk')||T('tip'))&&!p.swingReq){p.swingReq=T('tip')?'tip':'atk';p.pressLate=ball.vy<0&&ball.y<p.y+HANDUP-.1;p.charging=true;p.chargeT=0;p.prevD=9;
    const c=MOCAP.spike;if(c)playAct(p,'spike',Math.max(0,clipKey(c)-.4),{hold:clipKey(c)-.12});}
  if(p.charging){p.chargeT+=dt;p.power=Math.min(1,p.chargeT/.3);}
  // 舉球：1／2／3 直接指定托給誰（不按就看準星），R 或滾輪切換攻擊方式
  // 舉球員可以提早決定（對方發球／進攻時就先選好下一球給誰、打什麼）
  if(setPhase(p)||(p.role==='set'&&(state==='play'||state==='serve'))){const now=setPhase(p);if(T('stype'))setTypeStep(p,1);for(const [k,r] of [['s1','oh'],['s2','mb'],['s3','op']])if(T(k)){p.setPick={s:now?ball.passSer:-1,r};SFX.call&&SFX.call();}}
  if(p.y===0&&(T('atk')||T('tip'))){p.arm=T('tip')?'tip':'atk';p.armT=.3;
    if(setPhase(p)&&!(p.lungeT>0)){const L=predict(OVERY);if(L&&Math.sign(L.x)===sd(p.team)&&L.t<.55&&L.t>.05){const dd=Math.hypot(L.x-p.x,L.z-p.z);
      if(dd>.35&&dd<2.6){const tt=Math.max(.1,L.t-.04);p.vx=(L.x-p.x)/tt;p.vz=(L.z-p.z)/tt;const v=Math.hypot(p.vx,p.vz);if(v>9){p.vx*=9/v;p.vz*=9/v;}p.lungeT=tt;}}}}
  if(T('rcv')){
    const L=predict(.5),iv=inputVec();
    if(p.y===0&&iv.mag>.5&&p.dive<=0&&p.rec<=0&&tryDive(p))return;
    const Lb=predict(BUMPY);
    if(p.y===0&&Lb&&Math.sign(Lb.x)===sd(p.team)&&Lb.t<.55){const ax=Lb.x-Math.sin(p.yaw)*.3,az=Lb.z-Math.cos(p.yaw)*.3,dd=Math.hypot(ax-p.x,az-p.z);
      if(dd>.5&&dd<2.4){const tt=Math.max(.12,Math.min(.3,Lb.t-.04));p.vx=(ax-p.x)/tt;p.vz=(az-p.z)/tt;const v=Math.hypot(p.vx,p.vz);if(v>9){p.vx*=9/v;p.vz*=9/v;}p.lungeT=tt;}}
    p.arm='rcv';p.armT=.42;}}
function update(dt){try{update0(dt);}finally{netClearTrig();}}
function update0(dt){
  time+=dt;PC={};
  if(flash>0)flash-=dt;if(shake>0)shake=Math.max(0,shake-dt*1.5);
  msgs.forEach(m=>m.t-=dt);msgs=msgs.filter(m=>m.t>0);
  parts.forEach(q=>{q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;if(q.big){q.vx*=.94;q.vz*=.94;q.vy=q.vy*.94-.6*dt;}else q.vy-=9*dt;q.t-=dt;});parts=parts.filter(q=>q.t>0&&q.y>-.2);
  if(state==='menu'||state==='over')return;
  if(T('cam')){S.cam=((S.cam|0)+1)%3;saveS();syncSeg();say('鏡頭：'+CAMN[S.cam],'#c9bde0');}
  humanInput(dt);netEach(()=>humanInput(dt));skTick(dt);skAI();netTouchCheck();trainTick(dt);brain(0);brain(1);
  players.forEach(p=>p.rc?withCtx(p,()=>updatePlayer(p,dt)):updatePlayer(p,dt));
  for(let i=0;i<players.length;i++)for(let j=i+1;j<players.length;j++){const a=players[i],b=players[j];if(a.team!==b.team)continue;
    const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);if(d>0&&d<.55){const k=(.55-d)/2/d;a.x-=dx*k;a.z-=dz*k;b.x+=dx*k;b.z+=dz*k;}}
  stT+=dt;
  if(state==='serve'){const s=server;
    if(!ball.toss)placeHeld();
    if(!s.human&&!ball.toss&&stT>2.6){s.tk=rnd()<.15+s.st.pow*.04?'jump':'stand';startToss(s,s.tk);}
    if(ball.toss){ball.vy-=G*dt;ball.y+=ball.vy*dt;ball.x+=ball.vx*dt;ball.z+=ball.vz*dt;
      if(!s.human){if(s.tk==='jump'&&s.y===0){if(time-s.tossAt>.12&&ball.vy>2.4){s.vx=tnet(s.team)*2.6;s.vz=0;s.lungeT=.05;}if(ball.vy<2.6&&ball.vy>0&&s.loadT<=0){s.loadT=.1;s.loadApp=.6;}}
        if(ball.vy<0&&ball.y<=s.y+HANDUP+.2&&(s.tk==='stand'||s.y>.3))doServe(s,s.tk,clamp(.5+rnd()*.45+D(s).q,0,1));}
      if(state==='serve'&&ball.y<.7){ball.toss=false;ball.held=s;placeHeld();say('重新拋球','#a9b0cc');}}
    clearHits();return;}
  if(state==='point'){deadBall(dt);if(stT>3.0){if(gameOver())endMatch();else setupServe(serveTeam);}clearHits();return;}
  if(ball.cool>0)ball.cool-=dt;
  const px=ball.x,py=ball.y,pz=ball.z;ball.px=px;ball.py=py;ball.pz=pz;
  if(ball.float>0&&ball.y>1){ball.vz+=Math.sin(time*7+ball.fseed)*ball.float*1.8*dt;ball.vy+=Math.cos(time*5+ball.fseed)*ball.float*.8*dt;}
  stepB(ball,dt);PC={};
  ball.trail.push({x:ball.x,y:ball.y,z:ball.z});if(ball.trail.length>30)ball.trail.shift();
  if(px*ball.x<=0&&px!==ball.x)crossNet(px,py,pz);
  if(state!=='play'){clearHits();return;}
  if(human)humanAir(human);netEach(()=>humanAir(human));
  if(state!=='play'){clearHits();return;}
  const order=players.slice().sort((a,b)=>(ball.call[b.team]===b)-(ball.call[a.team]===a));
  for(const p of order){
    if(Math.sign(ball.x)!==sd(p.team)&&Math.abs(ball.x)>.25)continue;
    if(ball.cool>0&&p.team===ball.lastTeam)continue;
    if(ball.lastTeam===p.team&&ball.lastP===p&&!ball.blockTouch)continue;
    if(p.human&&p.y>.15)continue;
    const z=zoneOf(p);if(!z)continue;
    if(p.human){
      if(p.arm&&!(p.arm==='rcv'&&z.k==='bump'&&p.ready)){const it=p.arm;p.arm=null;touch(p,z,it==='rcv'?'rcv':it);break;}
      // 擺好接球姿勢：球掉進手臂平台就自動墊起，擺得越早越準
      if(p.ready&&z.k!=='air'&&ball.vy<.5){p.arm=null;touch(p,{k:z.k,q:clamp(z.q*.65+.35*Math.min(1,p.readyT/.3),0,1)},'rcv');break;}
      // 舉球手把球托給你、你卻沒跳：球掉到身邊時自動接（只會變成過網球）
      continue;}
    if(ball.lastTeam!==p.team&&p.rolls[ball.serial]===undefined)p.rolls[ball.serial]=rnd()<missChance(p);
    if(p.rolls[ball.serial])continue;
    if(ball.lastTeam!==p.team&&ball.letGo&&ball.letGo[p.team])continue;
    if(ball.lastTeam!==p.team&&ball.call[p.team]&&ball.call[p.team]!==p&&ball.call[p.team].stun<=0&&ball.y>.6)continue;
    if(z.k==='air'&&ball.lastTeam===p.team&&ball.touches===1&&ball.setter===p&&!p.jset)continue;
    if(z.k==='air'&&!(ball.lastTeam===p.team&&ball.touches===2)&&!(p.jset&&ball.setter===p&&ball.touches===1))continue;
    if(z.k!=='air'&&z.q<.45&&ball.y>.6&&ball.vy<0&&z.k!=='dig')continue;
    if(ball.lastTeam===p.team&&ball.touches===2&&ball.setInfo&&ball.setInfo.hitter===human&&human.human&&p!==human&&human.stun<=0&&ball.y>.6)continue;
    if(ball.lastTeam===p.team&&ball.touches===1&&ball.setter&&ball.setter!==p&&ball.setter.stun<=0&&ball.y>.6)continue;
    touch(p,z,z.k==='air'?(p.jset&&ball.setter===p&&ball.touches===1?(p.jset==='dump'?'tip':'jset'):'atk'):'rcv');break;}
  // 比賽中撞到廣告牆、網柱：算出界
  if(state==='play'){const ev=ballCollide(ball,dt,false);if(ev==='wall'){lastLand={x:ball.x,z:ball.z};point(ball.lastTeam===null?1-serveTeam:1-ball.lastTeam,'出界！');clearHits();return;}}
  if(state==='play'&&ball.y<=BRV){
    const v=-ball.vy;ball.y=BRV;lastLand={x:ball.x,z:ball.z};SFX.floor();if(typeof landFx==='function')landFx(ball.x,ball.z,Math.hypot(ball.vx,ball.vy,ball.vz),!!(ball.atk||ball.heavy||ball.serve&&ball.drive));burst(ball.x,0,ball.z,'#e8f4f2',14,3);doShake(.12);
    // 落地後照真實反彈繼續動（得分鏡頭裡看得到球彈起、滾走）
    ball.vy=v*BALL_E;ball.vx*=.85;ball.vz*=.85;spinRoll(ball);bounceSnd=time;
    const inside=Math.abs(ball.x)<=M.half+BR&&Math.abs(ball.z)<=M.wid+BR;
    if(inside)point(ball.x<0?1:0);else point(ball.lastTeam===null?1-serveTeam:1-ball.lastTeam,'出界！');}
  clearHits();}
let lastLand={x:0,z:0};
function clearHits(){for(const k in hitK)delete hitK[k];}
// 攔網對決：吞下、攔回、撐起、打手出界、打穿
function crossNet(px,py,pz){
  const f=(0-px)/(ball.x-px),yc=py+(ball.y-py)*f,zc=pz+(ball.z-pz)*f;
  if(Math.abs(zc)>M.wid+.1&&yc>NETH-.3){if(ball.lastTeam!==null)fault(1-ball.lastTeam,'從標竿外過網');return;}
  const atkT=px<0?0:1,defT=1-atkT;
  // 攔網判定交給攻防核心（g15.js）：攔網手的手臂矩形 × 球過網的位置 × 力量差
  if(ball.lastTeam===atkT&&yc>NETH-.15&&(ball.atk||ball.tip)&&blockResolve(zc,yc,atkT,defT))return;
  const nc=netCord(yc,zc);if(nc==='over')return;
  if(nc==='back'||yc<NETH+BR){if(typeof netHit==='function')netHit(zc,yc,clamp(ball.vx,-14,14)*.9);ball.x=px;ball.vx*=-.25;ball.vy=Math.min(ball.vy,0)*.4;ball.vz*=.5;ball.atk=false;ball.heavy=false;PC={};burst(0,Math.max(.3,yc),zc,'#ffffff',6,2);SFX.net();
    if(ball.lastTeam!==null&&ball.touches>=3&&Math.sign(px)===sd(ball.lastTeam))fault(1-ball.lastTeam,'掛網！');else say('掛網！','#a9b0cc');}}
function endMatch(){state='over';if(NET.on){netOver();return;}if(document.pointerLockElement)document.exitPointerLock();const win=score[ME]>score[1-ME];if(win)stageWin();
  if(MATCH.mode==='train'){trainEnd();return;}
  const GR=settleGrowth(win);$('resG').innerHTML=GR.map(o=>`<span>${o.p.ch.name} <b>+${o.xp} XP</b>${o.up?` <em>升級！Lv ${o.lv}</em>`:''}</span>`).join('');
  const nx=$('bNext');if(nx){nx.hidden=!(MATCH.mode==='stage'&&win&&MATCH.stage+1<STAGES.length);}
  $('resT').textContent=win?'勝利！':'落敗…';$('resS').textContent=`${score[0]} - ${score[1]}`;
  $('resN').textContent=MATCH.mode==='stage'?(win?(MATCH.stage+1>=STAGES.length?'全部關卡破關！你是冠軍！':`第 ${MATCH.stage+1} 關過關！下一關：${STAGES[MATCH.stage+1].name}`):`第 ${MATCH.stage+1} 關「${STAGES[MATCH.stage].name}」落敗，再挑戰一次！`):(win?'漂亮的比賽！':'再來一場！');show('vOver');}
