
// ---------------- 技能系統 ----------------
// 每個球員一條技能量表（0–100）。碰球、得分、每一回合結束都會集氣；滿了按 Q（AI 自己挑時機）發動。
// 數值目標：25 分制一場比賽大約可以放 2–3 次（15 分制至少 1–2 次），所以集氣量會照勝利分數換算。
// 效果刻意做得「有感但不誇張」：只是讓這一球比較好，不會變成必殺技。
// 技能本身定義在技能樹（g17.js 的 TSK）：每個球員帶 1 個主動技能上場（p.eq），不再綁位置
const SK_DUR={};TSK.forEach(s=>{if(s.act)SK_DUR[s.id]=s.dur;});
const skRate=()=>25/clamp(winPts(),11,25);
function skOf(p){return p&&p.eq?TS[p.eq]:null;}
function skGain(p,n){if(!p||p.skOn||!skOf(p))return;const was=p.sk||0;p.sk=Math.min(100,was+n*skRate());
  if(was<100&&p.sk>=100&&p===human){say('技能量表滿了！按 '+k1('skill')+' 發動「'+skOf(p).name+'」','#ffd23f');if(SFX.call)SFX.call();}}
function skActivate(p){if(!p||(p.sk||0)<100||p.skOn||state==='over')return false;const S2=skOf(p);if(!S2)return false;
  p.sk=0;p.skOn=S2.id;p.skT=SK_DUR[S2.id]||0;pop(p,S2.name,S2.col);talk(p,'看我的！');
  burst(p.x,1.2+p.y,p.z,S2.col,12,2.2);if(SFX.call)SFX.call();if(p.human)say('技能發動：'+S2.name,S2.col);return true;}
// 拿出技能（用掉）：kinds 是這個動作可以用的技能
function skTake(p,kinds){if(!p||!p.skOn||!kinds.includes(p.skOn))return null;const k=p.skOn;p.skOn=null;p.skT=0;
  const S2=skOf(p);burst(p.x,1.6+p.y,p.z,S2?S2.col:'#fff',10,2.5);return k;}
function skTick(dt){if(state!=='play')return;for(const p of players){if(p.skOn&&SK_DUR[p.skOn]>0){p.skT-=dt;if(p.skT<=0){p.skOn=null;p.skT=0;}}}}
// AI 的發動時機（看帶的是哪種技能，不看位置）：扣球技能在球托給他時、攔網技能在對方要進攻時、防守技能在對方發球或要進攻時、舉球技能在要舉球時、發球技能在輪到他發球時
function skAI(){if(!ball||(state!=='play'&&state!=='serve'))return;for(const p of players){if(p.human||(p.sk||0)<100||p.skOn)continue;
  const k=p.eq,si=ball.setInfo,mine=ball.lastTeam===p.team,oppAtk=!mine&&ball.lastTeam!==null&&ball.touches===2&&si;
  if(state==='serve'){if(k==='ace'&&server===p)skActivate(p);else if((k==='eye'||k==='guard')&&server&&server.team!==p.team&&rnd()<.01)skActivate(p);continue;}
  if((k==='power'||k==='precise')&&mine&&si&&si.hitter===p&&ball.touches===2)skActivate(p);
  else if((k==='wall'||k==='kill')&&oppAtk)skActivate(p);
  else if((k==='eye'||k==='guard')&&oppAtk)skActivate(p);
  else if(k==='toss'&&mine&&ball.touches===1&&ball.setter===p)skActivate(p);}}
// 集氣：一回合結束大家 +2；得分那隊再 +3；最後一擊（扣球得分、攔網得分）的人再 +5
function skPoint(w){for(const p of players){skGain(p,2+(p.team===w?3:0));}
  const lp=ball&&ball.lastP;if(lp&&lp.team===w&&(ball.atk||ball.blockTouch||ball.tip))skGain(lp,5);}
// 每次碰球：好球 +4，完美 +6；扣球再 +2
function skTouch(p,act,q){skGain(p,(q>.82?6:q>.5?4:1.5)+(act==='spike'?2:0));}

// ---------------- 對手強度與關卡 ----------------
const DIFF_N={easy:'簡單',normal:'普通',hard:'困難',hell:'地獄'};
const STAGES=[
  {name:'社團練習賽',opp:'校內社團',diff:'easy',bonus:0,win:15,aces:1,note:'暖身。對手常失誤，熟悉操作和技能。'},
  {name:'地區預賽',opp:'鄰校聯隊',diff:'normal',bonus:0,win:15,aces:1,note:'一般強度，攔網和防守開始會到位。'},
  {name:'縣市賽',opp:'市立強校',diff:'normal',bonus:1,win:21,aces:2,note:'對手能力全部 +1，扣球更重。'},
  {name:'全國八強',opp:'傳統名校',diff:'hard',bonus:0,win:21,aces:2,note:'困難 AI：判斷快、失誤少。'},
  {name:'全國四強',opp:'體育班',diff:'hard',bonus:1,win:25,aces:3,note:'困難 AI＋能力 +1。'},
  {name:'全國決賽',opp:'衛冕冠軍',diff:'hell',bonus:2,win:25,aces:4,note:'地獄 AI＋能力 +2。打贏就破關！'}];
let stageProg=+(load('vb-stage',0))||0;
const winPts=()=>MATCH.mode==='stage'?STAGES[MATCH.stage].win:MATCH.mode==='net'?MATCH.win:MATCH.mode==='train'?999:+S.win;
function matchSetup(){const opp=1-prep.side;MATCH.diff=['normal','normal'];
  const DB={easy:-1,normal:0,hard:1,hell:2};MATCH.bonus=[0,0];
  if(MATCH.mode==='stage'){const st=STAGES[MATCH.stage];MATCH.diff[opp]=st.diff;MATCH.bonus[opp]=DB[st.diff]+st.bonus;}
  else{MATCH.diff[opp]=S.diff in DIFF?S.diff:'normal';MATCH.bonus[opp]=DB[MATCH.diff[opp]];}}
// 每場每隊隨機一位王牌：屬性 +2（可以超過 10，最多 12）
// 王牌人數：我方 1 人；對手照關卡（後面的關卡 2～4 人），自由比賽照對手強度（困難 2、地獄 3）
function aceCount(t){if(t===ME&&MATCH.mode!=='net')return 1;if(MATCH.mode==='stage')return STAGES[MATCH.stage].aces||1;if(MATCH.mode==='free'){const d=MATCH.diff[t];return d==='hell'?3:d==='hard'?2:1;}return 1;}
function pickAces(){for(const t of [0,1]){const n=aceCount(t);let pool=team(t).slice();
  for(let i=0;i<n&&pool.length;i++){const c=pool.filter(p=>p.role!=='set'||rnd()<.25||pool.every(q=>q.role==='set')),a=(c.length?c:pool)[Math.floor(rnd()*(c.length||pool.length))];pool=pool.filter(p=>p!==a);a.ace=true;
    const st={};for(const k in a.st)st[k]=Math.min(12,a.st[k]+2);a.st=st;a.jumpH=.62+Math.min(10,st.jmp)*.045+Math.max(0,st.jmp-10)*.03;}}
}
function aceSay(){const A2=players.filter(p=>p.ace);if(A2.length)say('本場王牌：'+A2.map(p=>`${COL[p.team].name} ${p.ch.name}`).join('、'),'#ffd23f');}
// 對手能力加成（關卡）：每項 +n，最多 10
function applyBonus(){for(const p of players){const b=MATCH.bonus[p.team]||0;if(!b)continue;const st={};for(const k in p.st)st[k]=clamp(p.st[k]+b,1,10);p.st=st;p.jumpH=.62+st.jmp*.045;}}
function stageWin(){if(MATCH.mode!=='stage')return;if(MATCH.stage+1>stageProg){stageProg=Math.min(STAGES.length,MATCH.stage+1);store('vb-stage',stageProg);}}
// 賽前準備頁：模式、對手強度、關卡列表
function renderMode(){const box=$('pMode');if(!box)return;if(MATCH.mode!=='stage')MATCH.mode='free';
  box.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===MATCH.mode));
  $('pFree').hidden=MATCH.mode!=='free';$('pStage').hidden=MATCH.mode!=='stage';
  $('pDiff').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===S.diff));
  const L=$('pStages');L.innerHTML='';
  STAGES.forEach((st,i)=>{const lock=i>stageProg,b=document.createElement('button');b.className='stg'+(i===MATCH.stage?' on':'')+(lock?' lock':'')+(i<stageProg?' done':'');b.disabled=lock;
    b.innerHTML=`<b>第 ${i+1} 關</b><span class="sn">${st.name}</span><span class="so">${st.opp}・${DIFF_N[st.diff]}${st.bonus?'・能力 +'+st.bonus:''}・王牌 ${'★'.repeat(st.aces||1)}・對手技能 Lv ${[1,3,6,9,12,15][i]}・${st.win} 分</span><span class="sd">${lock?'🔒 先打贏上一關':i<stageProg?'✓ 已過關・':''}${lock?'':st.note}</span>`;
    b.onclick=()=>{MATCH.stage=i;renderMode();};L.appendChild(b);});
  $('pGo').textContent=MATCH.mode==='stage'?`挑戰第 ${MATCH.stage+1} 關 ▶`:'開始比賽 ▶';}
if($('pMode')){$('pMode').onclick=e=>{const b=e.target.closest('button');if(!b)return;MATCH.mode=b.dataset.v;if(MATCH.mode==='stage')MATCH.stage=Math.min(stageProg,STAGES.length-1);renderMode();};
  $('pDiff').onclick=e=>{const b=e.target.closest('button');if(!b)return;S.diff=b.dataset.v;saveS();if(typeof syncSeg==='function')syncSeg();renderMode();};}
