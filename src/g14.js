
// ---------------- 多人連線 ----------------
// 架構：房主權威（host-authoritative）。房主的瀏覽器跑整場比賽（物理、AI、判定都在這裡），
// 其他玩家只把「按了哪些鍵、鏡頭朝哪、準星指哪」送給房主，房主每秒 30 次把比賽狀態廣播回去，
// 大家的畫面用收到的狀態內插顯示。這樣不會有兩邊判定不一致的問題，連線慢的人只是畫面晚一點。
// 傳輸：WebSocket（同一個 server.js 提供網頁和 /ws），可以直接透過 cloudflared（trycloudflare）分享。
const NET={on:false,host:false,client:false,ws:null,id:0,code:'',name:'',slots:[],peers:{},win:15,diff:'normal',
  q:[],acc:0,sendT:0,inT:0,trig:new Set(),ev:[],last:{},started:false,overShown:false,ping:0};
const NET_DT=1/30,NET_SKIP=new Set(['ch','st','ox','oy','oz','oyaw','holdP','hitS','rc','owner','pname','rolls','diveAim']);
const slotIdx=(t,r)=>t*4+ROLES.indexOf(r);
function netStatus(s,bad){const e=$('nStat');if(e){e.textContent=s;e.style.color=bad?'#ff8a7a':'var(--dim)';}}
function netDefaultURL(){if(location.protocol==='http:'||location.protocol==='https:'){if(!/claude\.ai|claudeusercontent|anthropic/.test(location.host))return(location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws';}return'';}
function netSend(o){if(NET.ws&&NET.ws.readyState===1)NET.ws.send(JSON.stringify(o));}
function netConnect(create){
  const url=($('nUrl').value||'').trim();if(!url){netStatus('請先填伺服器網址（用 server.js 開的網頁會自動填好）',true);return;}
  const name=($('nName').value||'').trim()||'玩家';NET.name=name;store('vb-netname',name);
  let ws;try{ws=new WebSocket(url.replace(/^http/,'ws').replace(/\/?$/,url.endsWith('/ws')?'':'/ws'));}catch(e){netStatus('網址格式不對：'+e.message,true);return;}
  netStatus('連線中…');NET.ws=ws;
  ws.onopen=()=>{netSend(create?{t:'create',name}:{t:'join',name,code:($('nCode').value||'').trim().toUpperCase()});};
  ws.onerror=()=>netStatus('連不上伺服器。確認 server.js 有在跑、網址正確（trycloudflare 網址要用 https 開頭）',true);
  ws.onclose=()=>{if(NET.on){const was=NET.started;netReset();netStatus('連線中斷',true);if(was){toMenu('vNet');say('連線中斷','#ff8a7a');}renderNet();}};
  ws.onmessage=e=>{let m;try{m=JSON.parse(e.data);}catch(x){return;}netMsg(m);};}
function netReset(){if(NET.ws){try{NET.ws.onclose=null;NET.ws.close();}catch(e){}}Object.assign(NET,{on:false,host:false,client:false,ws:null,id:0,code:'',slots:[],peers:{},q:[],started:false,trig:new Set(),ev:[],last:{}});
  MATCH.mode='free';}
function netLeave(){const wasMatch=inMatch();netReset();if(wasMatch){state='menu';human=null;}netStatus('已離開房間');renderNet();show('vNet');}
// 房主：座位表（8 格＝紅藍各 4 個位置），owner＝玩家 id，沒人坐就是 AI
function netInitSlots(){NET.slots=[];for(const t of [0,1])for(const r of ROLES){const c=CHARS[r][(t*2+ROLES.indexOf(r))%CHARS[r].length];NET.slots.push({owner:null,name:'',ch:c.id});}
  NET.slots[slotIdx(0,prep.role)]={owner:NET.id,name:NET.name,ch:prep.chars[prep.role]};}
function netSeat(id,name,i,ch){if(i<0||i>=8)return;const s=NET.slots[i];if(s.owner&&s.owner!==id)return;
  NET.slots.forEach(x=>{if(x.owner===id){x.owner=null;x.name='';}});s.owner=id;s.name=name;if(ch&&CHARS[ROLES[i%4]].some(c=>c.id===ch))s.ch=ch;netLobby();}
function netLobby(){if(!NET.host)return;netSend({t:'lobby',slots:NET.slots,win:NET.win,diff:NET.diff,peers:NET.peers});renderNet();}
function netMsg(m){
  if(m.t==='room'){NET.on=true;NET.id=m.id;NET.code=m.code;NET.host=m.host;NET.client=!m.host;
    if(NET.host){NET.peers={[m.id]:NET.name};netInitSlots();netLobby();netStatus('房間建立好了，把網址和代碼給朋友');}else netStatus('已加入房間，選一個位置');renderNet();return;}
  if(m.t==='err'){netStatus(m.msg,true);if(!NET.on)netReset();return;}
  if(m.t==='closed'){netReset();toMenu('vNet');netStatus('房主離開了，房間已關閉',true);renderNet();return;}
  if(NET.host){
    if(m.t==='peer+'){NET.peers[m.id]=m.name;netLobby();say&&0;return;}
    if(m.t==='peer-'){delete NET.peers[m.id];NET.slots.forEach(x=>{if(x.owner===m.id){x.owner=null;x.name='';}});
      for(const p of players)if(p.owner===m.id){p.owner=null;p.human=false;p.rc=null;p.pname='';if(state!=='menu')say(`${m.name||'有玩家'}離線，由 AI 接手`,'#a9b0cc');}
      netLobby();return;}
    if(m.t==='seat'){netSeat(m.from,NET.peers[m.from]||'玩家',m.i,m.ch);return;}
    if(m.t==='in'){const p=players.find(x=>x.owner===m.from&&x.rc);if(!p)return;const rc=p.rc;rc.held=new Set(m.h||[]);(m.tr||[]).forEach(a=>rc.trig.add(a));
      rc.cy=+m.cy||0;rc.cp=+m.cp||0;rc.cf=m.cf||[1,0];rc.cg=m.cg||[0,0,false];rc.sp=m.sp||[0,0];return;}
    if(m.t==='pong'){return;}
    return;}
  // 其他玩家
  if(m.t==='lobby'){NET.slots=m.slots;NET.win=m.win;NET.diff=m.diff;NET.peers=m.peers||{};renderNet();return;}
  if(m.t==='start'){NET.slots=m.slots;NET.win=m.win;NET.diff=m.diff;netStartLocal(m.serve);return;}
  if(m.t==='s'){NET.q.push(m);if(NET.q.length>8)NET.q.splice(0,NET.q.length-4);return;}
  if(m.t==='lobbyback'){if(inMatch()||state==='over'){state='menu';human=null;NET.started=false;toMenu('vNet');}renderNet();return;}}
// 開賽：房主和每個人都用同一張座位表建立球員（id 順序一致），之後只有房主在跑比賽
function netStart(){if(!NET.host)return;const empty=Object.keys(NET.peers).filter(id=>!NET.slots.some(s=>s.owner===+id));
  if(empty.length){netStatus('還有人沒選位置：'+empty.map(id=>NET.peers[id]).join('、'),true);return;}
  const serve=rnd()<.5?0:1;netSend({t:'lock',v:true});netSend({t:'start',slots:NET.slots,win:NET.win,diff:NET.diff,serve});netStartLocal(serve);}
function netStartLocal(serveT){
  NET.started=true;NET.overShown=false;NET.q=[];NET.acc=0;NET.last={};NET.ev=[];
  MATCH.mode='net';MATCH.win=NET.win;show(null);
  players=[];PID=0;human=null;const my=NET.slots.findIndex(s=>s.owner===NET.id);ME=my>=0?Math.floor(my/4):0;
  MATCH.diff=[NET.diff,NET.diff];MATCH.bonus=[0,0];
  for(const t of [0,1])for(const r of ROLES){const s=NET.slots[slotIdx(t,r)],p=mkP(t,r,charOf(r,s.ch),!!s.owner);p.owner=s.owner;p.pname=s.owner?s.name:'';
    if(s.owner===NET.id)human=p;else if(NET.host&&s.owner)p.rc={held:new Set(),trig:new Set(),cy:t?-Math.PI/2:Math.PI/2,cp:.3,cf:[sd(1-t)*1,0],cg:[sd(1-t)*5,0,false]};players.push(p);}
  players.forEach((p,i)=>p.num=[4,1,7,3][i%4]+(p.team?8:0));if(NET.host){pickAces();treeApply();}
  score=[0,0];served=[false,false];serverIdx=[0,0];msgs=[];parts=[];serveTeam=serveT;served[serveTeam]=true;rebuildRigs();
  camYaw=camYawT=ME?-Math.PI/2:Math.PI/2;camPitch=camPitchT=.3;setupServe(serveTeam);say(`${COL[serveTeam].name}先發球`,COL[serveTeam].ui,true);SFX.whistle();
  g3.focus();try{const r=g3.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
// ---------- 房主：遠端玩家的輸入 ----------
// 跑遊戲邏輯時，暫時把「玩家」「按鍵」「鏡頭」「準星」換成那位遠端玩家的，原本的單人程式碼就能直接用
function withCtx(p,fn){const rc=p.rc,sv=[human,A,T,camYaw,camPitch,camFwd,cursorG.x,cursorG.z,cursorG.ok,spinNow,spinBtn];
  spinNow=()=>rc.sp||[0,0];spinBtn=()=>rc.trig.has('rcv')&&!rc.trig.has('atk')?1:rc.trig.has('_sl')?-1:0;human=p;A=a=>rc.held.has(a);T=a=>rc.trig.has(a);camYaw=rc.cy;camPitch=rc.cp;camFwd={x:rc.cf[0],z:rc.cf[1]};cursorG.x=rc.cg[0];cursorG.z=rc.cg[1];cursorG.ok=!!rc.cg[2];
  try{return fn();}finally{human=sv[0];A=sv[1];T=sv[2];camYaw=sv[3];camPitch=sv[4];camFwd=sv[5];cursorG.x=sv[6];cursorG.z=sv[7];cursorG.ok=sv[8];spinNow=sv[9];spinBtn=sv[10];}}
function netEach(fn){if(!NET.host)return;for(const p of players)if(p.rc)withCtx(p,fn);}
function netClearTrig(){if(NET.host)for(const p of players)if(p.rc)p.rc.trig.clear();}
// ---------- 狀態序列化 ----------
function ser(v,d){if(v===null||v===undefined)return v===null?null:undefined;const ty=typeof v;
  if(ty==='number')return Number.isInteger(v)?v:Math.round(v*1000)/1000;if(ty==='string'||ty==='boolean')return v;if(ty!=='object')return undefined;
  if(v.id!==undefined&&v.role&&v.team!==undefined&&v.st)return{__p:v.id};
  if(d>4)return undefined;
  if(Array.isArray(v))return v.map(x=>{const s=ser(x,d+1);return s===undefined?null:s;});
  const pr=Object.getPrototypeOf(v);if(pr!==Object.prototype&&pr!==null)return undefined;
  const o={};for(const k in v){const s=ser(v[k],d+1);if(s!==undefined)o[k]=s;}return o;}
function deser(v){if(v===null||typeof v!=='object')return v;if(v.__p!==undefined)return players[v.__p]||null;
  if(Array.isArray(v))return v.map(deser);const o={};for(const k in v)o[k]=deser(v[k]);return o;}
const NET_G=['state','score','serveTeam','server','stT','time','slowT','hitstop','shake','flash','msgs','SERIAL','lastLand','ballPop'];
function netSnap(){const P=[];
  players.forEach((p,i)=>{const L=NET.last[i]||(NET.last[i]={}),d={};
    for(const k in p){if(NET_SKIP.has(k))continue;const s=ser(p[k],1);if(s===undefined)continue;const js=typeof s==='object'&&s!==null?JSON.stringify(s):s;if(L[k]!==js){L[k]=js;d[k]=s;}}
    P.push(d);});
  const B={};if(ball)for(const k in ball){if(k==='trail'||k==='ox'||k==='oy'||k==='oz')continue;const s=ser(ball[k],1);if(s!==undefined)B[k]=s;}
  const G={};for(const k of NET_G){let v;try{v=eval(k);}catch(e){continue;}G[k]=ser(v,1);}
  const ev=NET.ev;NET.ev=[];return{t:'s',P,B,G,ev};}
// 特效和音效是「事件」，房主發生時記下來，跟狀態一起送出，其他人收到再播一次
function netWrapFx(){
  const wrap=(name,get,set)=>{const f=get();if(typeof f!=='function'||f.__net)return;const w=function(...a){if(NET.host&&NET.started)NET.ev.push([name,a.map(x=>ser(x,1))]);return f.apply(this,a);};w.__net=1;w.__orig=f;set(w);};
  wrap('burst',()=>burst,v=>burst=v);
  if(typeof hitFx==='function')wrap('hitFx',()=>hitFx,v=>hitFx=v);
  if(typeof blockFx==='function')wrap('blockFx',()=>blockFx,v=>blockFx=v);
  if(typeof landFx==='function')wrap('landFx',()=>landFx,v=>landFx=v);
  for(const k of Object.keys(SFX))if(typeof SFX[k]==='function')wrap('SFX.'+k,()=>SFX[k],v=>SFX[k]=v);}
function netPlayEv(ev){for(const [name,args] of ev||[]){const a=args.map(deser);try{
  const f=name.startsWith('SFX.')?SFX[name.slice(4)]:({burst,hitFx:typeof hitFx==='function'?hitFx:null,blockFx:typeof blockFx==='function'?blockFx:null,landFx:typeof landFx==='function'?landFx:null})[name];
  if(f)(f.__orig||f).apply(null,a);}catch(e){}}}
function netApply(m){
  for(const p of players){p.ox=p.x;p.oy=p.y;p.oz=p.z;p.oyaw=p.yaw;}
  (m.P||[]).forEach((d,i)=>{const p=players[i];if(!p)return;for(const k in d)p[k]=deser(d[k]);});
  if(m.B){if(!ball)ball=newBall();ball.ox=ball.x;ball.oy=ball.y;ball.oz=ball.z;for(const k in ball)if(!(k in m.B)&&k!=='trail'&&k!=='ox'&&k!=='oy'&&k!=='oz')delete ball[k];
    for(const k in m.B)ball[k]=deser(m.B[k]);ball.trail=ball.trail||[];ball.trail.push({x:ball.x,y:ball.y,z:ball.z});if(ball.trail.length>30)ball.trail.shift();}
  const G=m.G||{};
  if('state' in G)state=G.state;if(G.score)score=G.score;if('serveTeam' in G)serveTeam=G.serveTeam;if('server' in G)server=deser(G.server);
  if('stT' in G)stT=G.stT;if('time' in G)time=G.time;if('slowT' in G)slowT=G.slowT;if('hitstop' in G)hitstop=G.hitstop;if('shake' in G)shake=G.shake;if('flash' in G)flash=G.flash;
  if(G.msgs)msgs=G.msgs;if('SERIAL' in G)SERIAL=G.SERIAL;if(G.lastLand)lastLand=G.lastLand;if('ballPop' in G)ballPop=G.ballPop;
  netPlayEv(m.ev);}
// ---------- 每一畫格 ----------
function netHostFrame(d){if(!NET.host||!NET.started)return;NET.sendT+=d;if(NET.sendT>=NET_DT){NET.sendT=Math.min(NET.sendT-NET_DT,NET_DT);netSend(netSnap());}}
function netClientFrame(d){
  // 把自己的按鍵整理好送給房主（按住的動作＋這段時間按下去的動作）
  const H=[],skip=new Set(['cam','pause']);for(const a of ACTS){if(skip.has(a))continue;if(A(a))H.push(a);if(T(a))NET.trig.add(a);}if(hitK['m:0'])NET.trig.add('_sl');
  if(T('cam')){S.cam=((S.cam|0)+1)%3;saveS();syncSeg();say('鏡頭：'+CAMN[S.cam],'#c9bde0');}
  clearHits();NET.inT+=d;
  if(NET.inT>=1/30||NET.trig.size){NET.inT=0;netSend({t:'in',h:H,tr:[...NET.trig],cy:+camYaw.toFixed(3),cp:+camPitch.toFixed(3),cf:[+camFwd.x.toFixed(3),+camFwd.z.toFixed(3)],cg:[+cursorG.x.toFixed(2),+cursorG.z.toFixed(2),cursorG.ok],sp:mouseRecent()});NET.trig.clear();}
  // 收到的狀態用固定節奏套用（保留一點緩衝，網路忽快忽慢時畫面比較穩）
  NET.acc+=d;const lag=NET.q.length>3;
  while(NET.q.length&&(NET.acc>=NET_DT||lag&&NET.q.length>2)){netApply(NET.q.shift());NET.acc=Math.max(0,NET.acc-NET_DT);}
  if(!NET.q.length)NET.acc=Math.min(NET.acc,NET_DT);
  ALPHA=clamp(NET.acc/NET_DT,0,1);
  for(const q of parts){q.x+=q.vx*d;q.y+=q.vy*d;q.z+=q.vz*d;q.vy-=9*d;q.t-=d;}parts=parts.filter(q=>q.t>0&&q.y>-.2);
  if(state==='over'&&!NET.overShown){NET.overShown=true;netOver();}}
function netOver(){$('resG').innerHTML='';if(document.pointerLockElement)document.exitPointerLock();const win=score[ME]>score[1-ME];
  $('resT').textContent=win?'勝利！':'落敗…';$('resS').textContent=`${score[0]} - ${score[1]}`;$('resN').textContent=NET.host?'可以再來一場，或回到房間換位置':'等房主決定再來一場或回房間';
  $('bAgain').hidden=!NET.host;$('bNext').hidden=true;$('bMenu').textContent='回到房間';show('vOver');}
// ---------- 房間畫面 ----------
function renderNet(){const conn=$('nConn'),room=$('nRoom');if(!conn)return;conn.hidden=NET.on;room.hidden=!NET.on;
  if(!$('nUrl').value)$('nUrl').value=netDefaultURL();if(!$('nName').value)$('nName').value=load('vb-netname','')||'';
  $('nWarn').hidden=!!netDefaultURL();
  if(!NET.on)return;
  $('nCodeShow').textContent=NET.code;$('nLink').textContent=location.protocol.startsWith('http')&&netDefaultURL()?location.origin+'/':'(伺服器網址)';
  const g=$('nSlots');g.innerHTML='';
  for(const t of [0,1]){const col=document.createElement('div');col.className='nTeam';col.innerHTML=`<h4 style="color:${COL[t].ui}">${COL[t].name}</h4>`;
    ROLES.forEach(r=>{const i=slotIdx(t,r),s=NET.slots[i]||{},me=s.owner===NET.id,b=document.createElement('button');b.className='nSlot'+(me?' me':s.owner?' taken':'');
      const ch=(CHARS[r].find(c=>c.id===s.ch)||CHARS[r][0]);
      b.innerHTML=`<span class="nr">${ROLE[r].name}</span><span class="nn">${s.owner?(me?'你・':'')+s.name:'AI'}</span><span class="nc">${ch.name}</span>`;
      b.disabled=!!s.owner&&!me;b.onclick=()=>{const chId=prep.chars[r];if(NET.host)netSeat(NET.id,NET.name,i,chId);else netSend({t:'seat',i,ch:chId});};col.appendChild(b);});
    g.appendChild(col);}
  const n=Object.keys(NET.peers).length;$('nPeers').textContent=`房間裡 ${n} 人：`+Object.values(NET.peers).join('、');
  $('nHostOpt').hidden=!NET.host;$('nWait').hidden=NET.host;$('nGo').hidden=!NET.host;
  if(NET.host){press($('nWin'),String(NET.win));press($('nDiff'),NET.diff);}}
(function netUI(){if(!$('vNet'))return;
  $('mNet').onclick=()=>{show('vNet');renderNet();};
  $('nCreate').onclick=()=>netConnect(true);$('nJoin').onclick=()=>netConnect(false);$('nLeave').onclick=netLeave;
  $('nGo').onclick=netStart;
  $('nWin').onclick=e=>{const b=e.target.closest('button');if(!b)return;NET.win=+b.dataset.v;netLobby();};
  $('nDiff').onclick=e=>{const b=e.target.closest('button');if(!b)return;NET.diff=b.dataset.v;netLobby();};
  $('nCopy').onclick=()=>{const t=`${$('nLink').textContent} 房間代碼 ${NET.code}`;try{navigator.clipboard.writeText(t).then(()=>netStatus('已複製'),()=>{});}catch(e){}};
  netWrapFx();})();
