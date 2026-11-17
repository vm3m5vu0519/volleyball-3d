
// ================= 攻防核心：攻擊手 vs 攔網（獨立系統） =================
// 1) 攻擊力 P：力量屬性、助跑、起跳高度、擊球品質（時機）
// 2) 攔網牆：每位起跳的攔網手在網面（x=0）上有一塊手臂矩形：指尖區／手掌區／手臂區
// 3) 球穿過網面的位置＋（攔網力量 B − 攻擊力 P）決定結果
// 4) 旋球：扣球前滑鼠甩動 → 側旋／上旋（簡化 Magnus：加速度跟速度方向垂直）
const BLK={handH:.42,tipH:.08,armK:.55,edge:.7};
function attackPower(p,q,SK){
  const jf=clamp(p.y/Math.max(.3,p.jumpH||.9),0,1);           // 起跳高度比：越接近最高點越大
  return p.st.pow*.5+(p.app||0)*2.5+jf*2+q*3+(SK==='power'?2+skRk(p,'power')*.6*skM(p,'power'):SK==='precise'?1+skM(p,'precise'):0)+pr(p,'a_pow')*.3;}
// 攔網牆：回傳每位攔網手的矩形（網面座標：z 橫向、y 高度）
function blockRects(defT){const R=[];
  for(const b of team(defT)){if(b.y<.12||Math.abs(b.x)>1.15||b.stun>0)continue;
    const wall=b.skOn==='wall',apex=1-Math.min(1,Math.abs(b.vy)/3);
    const hw=(.3+b.st.blk*.022)*(1+.04*pr(b,'b_reach'))+(wall?(.08+.03*skRk(b,'wall'))*skM(b,'wall'):0),top=b.y+HANDUP+.3+apex*.06+(wall?.05:0);
    R.push({b,cz:b.z,hw,top,hb:top-BLK.handH,aw:hw*BLK.armK,apex,wall,pen:clamp(1-Math.abs(b.x)/1.15,0,1)});}
  return R;}
// 判定球穿過網面的點落在哪一區
function blockZone(R,zc,yc){let best=null;
  for(const r of R){const reach=.04+r.b.st.blk*.015,cz=r.cz+clamp(zc-r.cz,-reach,reach),u=(zc-cz)/r.hw,au=Math.abs(u);let k=null; // 手會往球的方向伸一點（攔網能力越好伸越多）
    if(yc>r.top&&yc<=r.top+BLK.tipH&&au<=1)k='tip';
    else if(yc<=r.top&&yc>=r.hb&&au<=1)k=au>BLK.edge?'edge':'hand';
    else if(yc<r.hb&&yc>NETH-.12&&Math.abs(zc-cz)<=r.aw)k='arm';
    if(k&&(!best||au<best.au))best={r,k,u,au};}
  return best;}
function blockStrength(r,R,zc){let B=r.b.st.blk*.8+r.apex*3+r.pen*1.2+(r.wall?(2+skRk(r.b,'wall'))*skM(r.b,'wall'):0)+pr(r.b,'b_str')*.5+rnd()*2.5;
  for(const o of R)if(o!==r&&Math.abs(zc-o.cz)<o.hw+.25)B+=1.2;    // 雙人攔網：隔壁那位的手也在附近
  return B;}
// 回傳 true＝攔網有碰到球（已處理），false＝沒碰到，照常過網
function blockResolve(zc,yc,atkT,defT){
  const R=blockRects(defT);if(!R.length)return false;const Z=blockZone(R,zc,yc);if(!Z)return false;
  const {r,k,u}=Z,b=r.b,P=ball.tip?2:(ball.power||6);let B=blockStrength(r,R,zc);
  if(r.wall)skTake(b,['wall']);
  if(skTake(b,['kill'])){B+=3*skM(b,'kill');pop(b,'攔死！',TS.kill.col);}
  b.swing=.4;b.pose='block';b.touchFx=.8;b.touchN='攔';ball.cool=.12;ball.serial=++SERIAL;ball.letGo=null;ball.spS=0;ball.spT=0;ball.trail=[];PC={};
  const fxAt=(c,n)=>{burst(0,yc,zc,c,n,3);};
  const own=(vx,vy)=>{ball.drive=false;ball.vx=vx;ball.vy=vy;ball.lastTeam=defT;ball.lastP=b;ball.touches=0;ball.blockTouch=true;ball.atk=false;ball.heavy=false;};
  const res=k=>{BSTAT[k]=(BSTAT[k]||0)+1;if(k!=='stuff')trainEv('block',b,k);};
  // 指尖：擦到手，球變慢往上，落到防守方
  if(k==='tip'){ball.x=sd(defT)*.15;own(sd(defT)*Math.max(3,Math.abs(ball.vx)*.45),Math.max(2.5,ball.vy+3));ball.vz*=.6;
    say('擦到手！','#c9f0ff');fxAt('#c9f0ff',8);SFX.block();res('tip');return true;}
  // 手掌外緣：打手出界或亂彈
  if(k==='edge'){const pt=clamp(.22+(P-B)*.06+(ball.toolAim?.22:0)+(Math.abs(u)-BLK.edge)*1.1+(ball.skPower?.15:0)+.06*pr(ball.attacker,'a_tool')-.06*pr(b,'b_soft'),.05,.85);
    if(rnd()<pt){const outward=Math.sign(u)===Math.sign(r.cz||u)||Math.abs(r.cz)>M.wid-1.6;
      ball.x=sd(defT)*.15;
      if(outward){lobTo(sd(defT)*(M.half*.5+rnd()*M.half),0,Math.sign(u)*(M.wid+.8+rnd()*1.6),yc+.6+rnd()*.8);
        say('打手出界！','#ff8a2a',true);if(typeof blockFx==='function')blockFx(0,yc,zc,'tool');doShake(.3);res('toolOut');}
      else{lobTo(sd(defT)*(M.half-.5+rnd()*2.5),0,clamp(zc+Math.sign(u)*(2+rnd()*2),-M.wid-1,M.wid+1),yc+1.5+rnd()*1.5);
        say('碰手彈開！','#ffb347');res('toolIn');}
      ball.lastTeam=defT;ball.lastP=b;ball.touches=0;ball.atk=false;ball.blockTouch=true;fxAt('#ff8a2a',12);SFX.block();return true;}
    return contest(B-1);}
  if(k==='arm')return contest(B+1,true);
  return contest(B);
  function contest(Bv,arm){const d=Bv-P+(rnd()-.5)*3;
    if(d>2.6){ball.x=sd(atkT)*.15;own(sd(atkT)*3.5,-2.5);ball.drive=true;ball.vz*=.3;ball.atk=true;ball.power=6;freeze(b.human?.1:.06);
      perf(b,'block');trainEv('block',b,'stuff');say('攔網得分！','#7af0c0',true);if(typeof blockFx==='function')blockFx(0,yc,zc,'stuff');pop(b,'BLOCK!','#7af0c0');talk(b,LINES.block);fxAt('#7af0c0',22);doShake(.4);slowmo(.12);SFX.stuff();res('stuff');return true;}
    if(d>.8||arm&&d>-.5){ball.x=sd(atkT)*.15;own(sd(atkT)*1.7,3.2);ball.vz*=.3;say('攔回！','#7af0c0',true);if(typeof blockFx==='function')blockFx(0,yc,zc,'back');pop(b,'BLOCK','#7af0c0');fxAt('#7af0c0',14);doShake(.25);SFX.block();res('back');return true;}
    if(d>-1.2){ball.x=sd(defT)*.15;own(sd(defT)*1.2,3.8);ball.vz=(rnd()-.5)*2;say('撐起！','#c9f0ff');if(typeof blockFx==='function')blockFx(0,yc,zc,'soft');fxAt('#c9f0ff',12);SFX.block();res('soft');return true;}
    // 打穿：球擠過手，減速、方向亂掉，往下掉進防守方
    ball.x=sd(defT)*.15;ball.vx*=.7;ball.vy=Math.min(ball.vy*.6,-1)+(arm?-1.5:1.2);ball.vz=ball.vz*.6+(rnd()-.5)*4;ball.lastTeam=atkT;ball.blockTouch=true;ball.touches=0;ball.lastP=b;ball.lastTeam=defT;ball.atk=false;
    say('打穿攔網！','#ff8a2a');if(typeof blockFx==='function')blockFx(0,yc,zc,'tool');fxAt('#ff8a2a',10);SFX.block();res('through');return true;}}
let BSTAT={};
// ---------- 旋球 ----------
// 本機：記錄最近 0.12 秒的滑鼠移動量；多人連線時房主用遠端玩家送來的值（withCtx 會換掉 spinNow）
const MOUSE_HIST=[];
addEventListener('mousemove',e=>{if(!document.pointerLockElement)return;MOUSE_HIST.push([performance.now(),e.movementX||0,e.movementY||0]);if(MOUSE_HIST.length>60)MOUSE_HIST.shift();});
function mouseRecent(ms=120){const t=performance.now()-ms;let dx=0,dy=0;for(const m of MOUSE_HIST)if(m[0]>=t){dx+=m[1];dy+=m[2];}return[dx,dy];}
let spinNow=()=>mouseRecent();
// 扣球用哪個鍵：左鍵 -1（左旋）、右鍵 +1（右旋）、其他 0；多人連線時房主用遠端送來的（withCtx 會換掉）
let spinBtn=()=>T('rcv')&&!T('atk')?1:hitK['m:0']?-1:0;
function spinFrom(p,t){
  if(p.human){const[dx,dy]=spinNow();const s=clamp((p.spinReq||0)*.85+dx/220,-1,1),tp=clamp(.35+dy/260,0,1);p.spinReq=0;
    // 側旋方向換算到世界座標：攻擊方向往 so，滑鼠往右甩＝球往攻擊者的右邊彎
    return{s,t:tp};} // applySpin 的方向本身就跟著球速轉：s>0 一律往攻擊者的右邊彎（兩隊都一樣）
  return{s:(rnd()-.5)*.5,t:.25+rnd()*.35};}
function applySpin(b,dt){if(!b.spS&&!b.spT)return;const vh=Math.hypot(b.vx,b.vz);if(vh<1)return;
  // 力跟速度成正比（Magnus：F ∝ ω×v），快的扣球彎得明顯但飛得短，慢的球彎得多
  const v=Math.hypot(vh,b.vy),a=b.spS*.35*v;b.vx+=-b.vz/vh*a*dt;b.vz+=b.vx/vh*a*dt;
  if(Math.sign(b.x)!==b.spX)b.vy-=b.spT*.18*v*dt;} // 上旋的下墜在過網後才算（瞄準和過網判定不受影響）
// ---------- HUD：攔網牆（玩家起跳扣球時看得到） ----------
function drawBlockWall(g,cw,ch,sc){if(!human||state!=='play'||!ball)return;
  const atk=human.y>.2&&ball.lastTeam===human.team&&ball.touches>=1||ball.setInfo&&ball.setInfo.hitter===human&&ball.touches===2;
  if(!atk)return;const R=blockRects(1-human.team);
  for(const r of R){const pts=[[r.cz-r.hw,r.top],[r.cz+r.hw,r.top],[r.cz+r.hw,r.hb],[r.cz-r.hw,r.hb]].map(([z,y])=>proj(0,y,z,cw,ch));
    if(pts.some(q=>!q.ok))continue;
    g.save();g.globalAlpha=r.wall?.5+.2*Math.sin(time*10):.32;g.fillStyle=r.wall?'#7af0c0':'#ff5a4a';g.beginPath();pts.forEach((q,i)=>i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.closePath();g.fill();
    g.globalAlpha=.8;g.strokeStyle=r.wall?'#bfffe6':'#ffb3a8';g.lineWidth=1.5*sc;g.stroke();
    // 外緣 30%（打手出界區）用虛線標出
    g.setLineDash([4*sc,4*sc]);for(const s of [-1,1]){const z=r.cz+s*r.hw*BLK.edge,a=proj(0,r.top,z,cw,ch),bq=proj(0,r.hb,z,cw,ch);if(a.ok&&bq.ok){g.beginPath();g.moveTo(a.x,a.y);g.lineTo(bq.x,bq.y);g.stroke();}}
    g.setLineDash([]);
    const ar=[[r.cz-r.aw,r.hb],[r.cz+r.aw,r.hb],[r.cz+r.aw,NETH],[r.cz-r.aw,NETH]].map(([z,y])=>proj(0,y,z,cw,ch));
    if(!ar.some(q=>!q.ok)){g.globalAlpha=.18;g.fillStyle='#ff5a4a';g.beginPath();ar.forEach((q,i)=>i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.closePath();g.fill();}
    g.restore();}}
// ---------- 技能特效（看得出來有發動） ----------
function skillFx(p,SK){if(!SK)return;const S2=skOf(p);
  burst(ball.x,ball.y,ball.z,S2.col,30,6);doShake(.45);slowmo(.14);say(S2.name+'！',S2.col,true);
  if(SK==='precise'){PC={};const L=predict(0);if(L)ball.mark={x:L.x,z:L.z,c:S2.col};}}
function drawSkillMark(g,cw,ch,sc){if(!ball||!ball.mark||state!=='play')return;const m=ball.mark,q=proj(m.x,.03,m.z,cw,ch);if(!q.ok)return;
  const q2=proj(m.x+.5,.03,m.z,cw,ch),r=Math.max(10,Math.abs(q2.x-q.x));g.save();g.strokeStyle=m.c;g.lineWidth=3*sc;g.globalAlpha=.9;
  g.beginPath();g.ellipse(q.x,q.y,r,r*.35,0,0,Math.PI*2);g.stroke();g.beginPath();g.moveTo(q.x-r*.6,q.y);g.lineTo(q.x+r*.6,q.y);g.moveTo(q.x,q.y-r*.25);g.lineTo(q.x,q.y+r*.25);g.stroke();g.restore();}
// ---------- AI 讀攔網：扣下去的瞬間看攔網牆，找縫、打邊緣（打手出界）或硬碰 ----------
// 跟玩家一樣用同一套攔網牆資訊；讀得準不準看攻手能力（力量＋跳躍），所以王牌和成長過的球員更會找縫
// 讀「攔網陣型」：已經起跳或準備起跳、站在網前的攔網手，用他們跳到最高點時的手臂矩形來判斷
function readRects(defT){const R=[];for(const b of team(defT)){if(b.stun>0||Math.abs(b.x)>1.3||!(b.y>.05||b.jumpAt>0))continue;
  const top=b.jumpH*.78+HANDUP+.36+(b.skOn==='wall'?.05:0),hw=.3+b.st.blk*.022+(b.skOn==='wall'?.14:0);R.push({b,cz:b.z,hw,top,hb:top-BLK.handH,aw:hw*BLK.armK,apex:1,wall:b.skOn==='wall'});}return R;}
function aiReadBlock(p,d,z,t){const R=readRects(1-t);if(!R.length)return{d,z,k:'noblock'};
  const hx=Math.abs(p.x)||.5,cross=zz=>p.z+(zz-p.z)*hx/(hx+d),aimFor=zc=>p.z+(zc-p.z)*(hx+d)/hx;
  const zc=cross(z),yc=ball.y-ball.y*hx/(hx+d)*.85,Z=blockZone(R,zc,yc);if(!Z)return{d,z,k:'clear'}; // 過網高度：從擊球點往落點直線下降估計
  const iq=clamp((p.st.pow+p.st.jmp)/20,.3,1.1);if(rnd()>.35+iq*.45)return{d,z,k:'none'}; // 沒讀到就照原本的打
  const r=Z.r,roll=rnd();
  if(roll<.45){// 找縫：往攔網手外側（靠場中間或另一邊的空檔）
    const side=Math.abs(r.cz-r.hw-1)<Math.abs(r.cz+r.hw+1)?-1:1,tz=r.cz+side*(r.hw+.25+rnd()*.3);
    return{d,z:clamp(aimFor(tz),-M.wid+.5,M.wid-.5),k:'gap'};}
  if(roll<.8){// 打手出界：瞄外側手的外緣
    const out=Math.sign(r.cz)||1,tz=r.cz+out*r.hw*(.8+rnd()*.15);ball.toolAim=true;
    return{d:Math.min(d,6),z:clamp(aimFor(tz),-M.wid-1,M.wid+1),k:'tool'};}
  return{d,z,k:'hard'};}
// ---------- 擦網球、觸網 ----------
// 球貼著網頂（網帶）過去：減速、可能掉過去也可能彈回來
function netCord(yc,zc){if(yc<NETH+BR-.035||yc>NETH+BR+.015||rnd()<.4)return null;
  NSTAT.cord=(NSTAT.cord||0)+1;ball.atk=false;ball.heavy=false;ball.spS=ball.spT=0;PC={};burst(0,NETH,zc,'#ffffff',6,1.5);SFX.net();
  if(rnd()<.55){ball.vx*=.35;ball.vy=Math.abs(ball.vy)*.25+1.2;ball.vz*=.5;say('擦網！','#ffe08a',true);return 'over';}
  return 'back';}
let NSTAT={},RSTAT={};
// 攔網時橫移太快會碰到網（每次起跳只檢查一次）
function netTouchCheck(){if(state!=='play')return;for(const b of players){if(b.y<.2||b.jk!=='blk'||b.ntChk===b.jumpN)continue;
  if(Math.abs(b.x)<.32&&Math.abs(b.vz)>1.7){b.ntChk=b.jumpN;if(rnd()<.12){NSTAT.touch=(NSTAT.touch||0)+1;fault(1-b.team,'攔網觸網！');return;}}}}
function drawAces(g,cw,ch,sc){for(const p of players){if(!p.ace)continue;const q=proj(lerp(p.ox,p.x,ALPHA),lerp(p.oy,p.y,ALPHA)+(p.pname?2.4:2.1),lerp(p.oz,p.z,ALPHA),cw,ch);if(!q.ok)continue;
  T2(g,'★',q.x,q.y,15*sc,'#ffd23f');}}
// ---------- 攻擊手要球 ----------
const REQ_T=['auto','high','fast','quick'],REQ_N={auto:'自動',high:'高球',fast:'平快',quick:'快攻'};
function reqStep(p,dir){const i=REQ_T.indexOf(p.reqType||'auto');p.reqType=REQ_T[(i+dir+REQ_T.length)%REQ_T.length];
  if(p===human)say('要球：'+REQ_N[p.reqType]+(p.reqType==='quick'?'（快攻要先衝到網前、早一點起跳）':''),'#c9f0ff');SFX.call&&SFX.call();}
function drawReq(g,cw,ch,sc,x1,y0){if(!human||human.role==='set'||!(state==='play'||state==='serve'))return;
  const called=time-(human.calledAt||-9)<2,rt=human.reqType||'auto';
  const tx=called?`已叫球：${REQ_N[rt]}`:`要球：${REQ_N[rt]}　${k1('call')} 叫球・${k1('stype')}／滾輪 換球種`;
  g.font=`700 ${12*sc}px "Noto Sans TC",sans-serif`;const tw=g.measureText(tx).width+18*sc;rr(g,x1-tw+6*sc,y0-56*sc,tw,22*sc,11,called?'rgba(20,70,90,.85)':'rgba(8,22,30,.45)');
  T2(g,tx,x1-3*sc,y0-45*sc,12*sc,called?'#c9f0ff':'#cfe2ea','right');}
// ---------- 技能發動中：身上的特效（光點往上飄＋腳下光環＋身體周圍一圈光） ----------
const SKA={t:0};
function skillAura(dt){if(S.gfx<1||typeof fxSpawn!=='function')return;SKA.t-=dt;if(SKA.t>0)return;SKA.t=.05;
  for(const p of players){if(!p.skOn)continue;const S2=skOf(p);if(!S2)continue;const px=lerp(p.ox,p.x,ALPHA),pz=lerp(p.oz,p.z,ALPHA),py=lerp(p.oy,p.y,ALPHA);
    for(let i=0;i<3;i++){const a=rnd()*Math.PI*2,r=.28+rnd()*.18;fxSpawn({tex:'glow',col:S2.col,x:px+Math.cos(a)*r,y:py+.15+rnd()*1.5,z:pz+Math.sin(a)*r,vy:1+rnd()*.8,drag:1,s0:.26+rnd()*.1,s1:.03,life:.7+rnd()*.3,a:.95,depth:true});}
    if(rnd()<.5)fxSpawn({tex:'glow',col:'#ffffff',x:px,y:py+1,z:pz,s0:1.3,s1:1.1,life:.12,a:.18,depth:true}); // 身體周圍淡淡一層光
    p._skR=(p._skR||0)-1;if(p._skR<=0){p._skR=6;fxSpawn({tex:'ring',flat:true,col:S2.col,x:px,y:.03,z:pz,s0:.5,s1:1.3,life:.5,a:.7});}}}
{const _f=fx2Frame;fx2Frame=function(dt){_f.apply(this,arguments);try{skillAura(dt);}catch(e){}};}
