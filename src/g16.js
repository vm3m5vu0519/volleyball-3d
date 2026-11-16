// ================= 角色成長 =================
// 每個角色（依角色 id）有自己的等級和經驗值，存在 localStorage 'vb-growth'
//   比賽：依表現給經驗值（得分、好的一傳、攔網、救球、勝利）
//   升級：每級 1 點能力點，自己分配；成長最多讓能力到 12
//   訓練：扣球／接發／攔網練習，直接加某一項能力的經驗值（滿 100 加 1 點）
const GROW_MAX_LV=20,GROW_CAP=12,STAT_KEYS=['pow','jmp','spd','rcv','blk','set'];
const STAT_N={pow:'力量',jmp:'跳躍',spd:'速度',rcv:'接球',blk:'攔網',set:'舉球'};
let GROW=load('vb-growth',{})||{};
function gOf(id){return GROW[id]||(GROW[id]={lv:1,xp:0,pts:0,add:{},sx:{}});}
const xpNeed=lv=>80+lv*40;
function gSave(){store('vb-growth',GROW);}
function applyGrowth(){if(MATCH.mode==='net')return;for(const p of players){if(p.team!==ME||!p.ch)continue;const g=GROW[p.ch.id];if(!g)continue;
  const st=Object.assign({},p.st);for(const k in g.add)if(k in st)st[k]=Math.min(GROW_CAP,st[k]+g.add[k]);p.st=st;p.jumpH=.62+Math.min(10,st.jmp)*.045+Math.max(0,st.jmp-10)*.03;}}
function gAddXp(id,n){const g=gOf(id);let up=0;g.xp+=n;while(g.lv<GROW_MAX_LV&&g.xp>=xpNeed(g.lv)){g.xp-=xpNeed(g.lv);g.lv++;g.pts++;up++;}if(g.lv>=GROW_MAX_LV)g.xp=0;return up;}
function gStatXp(id,k,n){const g=gOf(id);g.sx[k]=(g.sx[k]||0)+n;let up=0;while(g.sx[k]>=100){g.sx[k]-=100;if(gBase(id,k)+(g.add[k]||0)<GROW_CAP){g.add[k]=(g.add[k]||0)+1;up++;}}return up;}
function gBase(id,k){for(const r of ROLES){const c=CHARS[r].find(c=>c.id===id);if(c)return c.st[k]||0;}return 0;}
function gSpend(id,k){const g=gOf(id);if(g.pts<=0||gBase(id,k)+(g.add[k]||0)>=GROW_CAP)return false;g.pts--;g.add[k]=(g.add[k]||0)+1;gSave();return true;}
// 比賽中記錄表現（只記我方）
let PERF={};
function perf(p,k,n=1){if(!p||p.team!==ME||MATCH.mode==='net'||MATCH.mode==='train')return;const o=PERF[p.id]||(PERF[p.id]={});o[k]=(o[k]||0)+n;}
function perfReset(){PERF={};}
// 比賽結束：結算經驗值，回傳每個人的明細（顯示在結束畫面）
function settleGrowth(win){if(MATCH.mode==='net'||MATCH.mode==='train')return[];const out=[];
  for(const p of team(ME)){const o=PERF[p.id]||{},xp=Math.round(30+(win?40:15)+(o.kill||0)*8+(o.block||0)*10+(o.ace||0)*8+(o.goodPass||0)*3+(o.dig||0)*4+(o.set||0)*1.5+(MATCH.mode==='stage'?MATCH.stage*6:0));
    const up=gAddXp(p.ch.id,xp);out.push({p,xp,up,lv:gOf(p.ch.id).lv});}
  gSave();return out;}
// ---------- 賽前準備頁：成長面板（等級、經驗值、加點） ----------
function growthHTML(cid){const g=GROW[cid]||{lv:1,xp:0,pts:0,add:{},sx:{}},need=xpNeed(g.lv);
  return `<div class="gr"><div class="grH"><b>Lv ${g.lv}</b><i><em style="width:${g.lv>=GROW_MAX_LV?100:Math.round(g.xp*100/need)}%"></em></i><span>${g.lv>=GROW_MAX_LV?'MAX':g.xp+' / '+need}</span></div>`+
    (g.pts>0?`<div class="grP">可分配能力點：<b>${g.pts}</b>　點下面的 ＋ 加點</div><div class="grB">${STAT_KEYS.map(k=>`<button class="tb" data-gs="${k}" ${gBase(cid,k)+(g.add[k]||0)>=GROW_CAP?'disabled':''}>＋${STAT_N[k]}</button>`).join('')}</div>`:'')+
    `<div class="grS">訓練經驗：${STAT_KEYS.filter(k=>g.sx[k]).map(k=>`${STAT_N[k]} ${g.sx[k]}/100`).join('、')||'還沒有（主選單 → 訓練）'}</div></div>`;}
function growthAdd(cid){const g=GROW[cid];return g?g.add:{};}
document.addEventListener('click',e=>{const b=e.target.closest('[data-gs]');if(!b||!PV.cid)return;if(gSpend(PV.cid,b.dataset.gs)){SFX.call&&SFX.call();pvShow(PV.role,PV.cid);if(typeof renderPrep==='function')renderPrep();}});
// ---------- 訓練模式 ----------
// 扣球：對面送球過來 → 隊友一傳 → 舉球一定給你 → 扣進對方場內（對方有攔網）
// 接發：對方一直發球給你們 → 你接到好球（品質 0.6 以上）算成功
// 攔網：對方一直進攻 → 你碰到攔網算成功、攔網得分算兩次
const DRILLS={
  spike:{name:'扣球練習',stat:'pow',stat2:'jmp',role:r=>r==='set'?'oh':r,desc:'舉球一定托給你，扣進對方場內算成功。對面有攔網，練習看攔網牆找縫、打手出界和旋球。',unit:'扣球得分'},
  recv:{name:'接發練習',stat:'rcv',role:r=>r,desc:'對方一直發球，你接起漂亮的一傳（品質 0.6 以上）算成功。',unit:'好球'},
  block:{name:'攔網練習',stat:'blk',role:r=>r==='set'?'mb':r,desc:'對方一直進攻，你碰到攔網算成功，攔網得分算兩次。',unit:'攔網'}};
const TRAIN_T=60;
function trainStart(k){const D2=DRILLS[k];MATCH.mode='train';MATCH.drill=k;MATCH.trainT=TRAIN_T;MATCH.trainN=0;MATCH.trainTry=0;
  const keep=prep.role;prep.role=D2.role(prep.role);MATCH.trainRole=prep.role;show(null);newGame();prep.role=keep;
  g3.focus();try{const r=g3.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
// setupServe 會呼叫這個：訓練模式下每一球怎麼開始
function trainSetup(t){if(MATCH.drill==='recv'){serveTeam=1-ME;return false;}   // 接發：照正常流程，但一律對方發球
  const atk=MATCH.drill==='spike'?ME:1-ME,from=1-atk;   // 扣球：球送到我方；攔網：球送到對方
  ball=newBall();ball.x=sd(from)*5;ball.y=2.6;ball.z=(rnd()-.5)*4;ball.lastTeam=from;ball.touches=0;ball.free=true;ball.serial=++SERIAL;
  players.forEach(p=>{const s=spot(p,'r');p.x=p.ox=sd(p.team)*s.d;p.z=p.oz=s.z;p.y=p.vy=p.vx=p.vz=0;p.dive=p.rec=p.stun=0;p.jumpAt=0;});
  lobTo(sd(atk)*(4.5+rnd()*1.5),0,(rnd()-.5)*4,5);state='play';stT=0;server=null;PC={};MATCH.trainTry++;return true;}
function trainEv(k,p,v){if(MATCH.mode!=='train'||!human)return;const d=MATCH.drill;
  if(d==='spike'&&k==='kill'&&p===human)MATCH.trainN++;
  else if(d==='recv'&&k==='pass'&&p===human&&v>.6)MATCH.trainN++;
  else if(d==='block'&&k==='block'&&p===human)MATCH.trainN+=v==='stuff'?2:1;
  if(d==='recv'&&k==='serve')MATCH.trainTry++;}
function trainTick(dt){if(MATCH.mode!=='train'||state==='over'||state==='menu')return;MATCH.trainT-=dt;if(MATCH.trainT<=0){MATCH.trainT=0;state='over';endMatch();}}
function trainEnd(){const D2=DRILLS[MATCH.drill],cid=human.ch.id,xp=MATCH.trainN*14+5;let up=gStatXp(cid,D2.stat,xp);if(D2.stat2)up+=gStatXp(cid,D2.stat2,Math.round(xp*.4));gAddXp(cid,Math.round(xp*.5));gSave();
  $('resT').textContent=D2.name+' 結束';$('resS').textContent=`${MATCH.trainN} 次${D2.unit}`;
  $('resN').textContent=`${human.ch.name}：${STAT_N[D2.stat]}經驗 +${xp}${D2.stat2?`、${STAT_N[D2.stat2]} +${Math.round(xp*.4)}`:''}${up?`　能力提升 ${up} 點！`:''}`;
  $('resG').innerHTML=`<span>${STAT_N[D2.stat]}：${(gOf(cid).sx[D2.stat]||0)}/100</span>`;$('bNext').hidden=true;$('bAgain').textContent='再練一次';show('vOver');}
function drawTrain(g,cw,ch,sc){if(MATCH.mode!=='train')return;const D2=DRILLS[MATCH.drill],s=Math.ceil(MATCH.trainT),tx=`${D2.name}　剩 ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}　${D2.unit} ${MATCH.trainN}`;
  g.font=`800 ${15*sc}px "Noto Sans TC",sans-serif`;const tw=g.measureText(tx).width+28;rr(g,cw/2-tw/2,58*sc,tw,30*sc,15,'rgba(8,22,30,.75)');T2(g,tx,cw/2,73*sc,15*sc,'#ffd23f');}
function renderTrain(){const L=$('tList');if(!L)return;L.innerHTML='';
  for(const k in DRILLS){const D2=DRILLS[k],r=D2.role(prep.role),c=charOf(r,prep.chars[r]),g=GROW[c.id]||{sx:{}},b=document.createElement('button');b.className='stg';
    b.innerHTML=`<span class="sn">${D2.name}</span><span class="so">練 ${STAT_N[D2.stat]}${D2.stat2?'・'+STAT_N[D2.stat2]:''}・${ROLE[r].name} ${c.name}</span><span class="sd">${D2.desc}</span><span class="so">目前 ${STAT_N[D2.stat]} 經驗 ${(g.sx||{})[D2.stat]||0}/100・每次 60 秒</span>`;
    b.onclick=()=>trainStart(k);L.appendChild(b);}}
