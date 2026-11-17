/* =====================================================================
   熱血排球 3D —— 4 對 4 第三人稱排球動作遊戲（玩法參考 Free Ball）
   1 資料   2 設定・聲音・按鍵・輸入   3 物理・規則・擊球（g2）   4 AI・更新（g3）   5 3D・鏡頭・HUD・選單（g4 g5）
   座標：公尺；網在 x=0，紅隊 x<0、藍隊 x>0；z 是球場寬度方向；y 向上
   位置：左攻、中間快攻、右攻由玩家選一個；舉球手固定是 AI
   ===================================================================== */
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=Math.random,pick=a=>a[rnd()*a.length|0],lerp=(a,b,t)=>a+(b-a)*t;
function angLerp(a,b,t){let d=((b-a)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI;return a+d*t;}
function angDiff(a,b){return((b-a)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI;}
function load(k,d){try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??d;}catch(e){return d;}}
function store(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}

// ---------------- 1 資料 ----------------
const M={half:9,wid:4.5,per:4};
// 球用真實重力、不滯空；人在最高點有一點滯空，扣球比較好抓
const NETH=2.43,G=9.8,PG=14,BR=.105,HANDUP=2.2,BUMPY=.82,OVERY=2.05,PHANGV=1.6,PHANGK=.35;
const COL=[{shirt:'#ff5a6a',dark:'#5a1020',band:'#fff6d6',ui:'#ff7a8a',name:'紅隊'},{shirt:'#4a8cff',dark:'#14306e',band:'#ffe066',ui:'#7ab0ff',name:'藍隊'}];
const ROLES=['oh','mb','op','set'],PLAYABLE=['oh','mb','op','set'];
const ROLE={oh:{name:'左攻',short:'左',desc:'左邊網前的主力攻手，舉球手最常托給你'},
  mb:{name:'中間快攻',short:'中',desc:'網中央的快攻和攔網。舉球前先起跳，舉球手就會托快攻給你'},
  op:{name:'右攻',short:'右',desc:'右邊網前的攻手，也負責攔對方的左攻'},
  set:{name:'舉球手',short:'舉',desc:'負責第二球：準星對準要托給的攻手，按擊球鍵舉球；吊球鍵二次吊球'}};
// 站位（d＝離網距離、z＝左右）：r 接發球、a 等托球（助跑起點）、c 掩護、g 防守
const SPOT={oh:{r:{d:5.2,z:-3},a:{d:3.8,z:-3.3},c:{d:4.8,z:-2.2},g:{d:6.6,z:-2.8}},
  mb:{r:{d:6.0,z:-.4},a:{d:3.2,z:.2},c:{d:3.2,z:0},g:{d:6.8,z:0}},
  op:{r:{d:5.2,z:3},a:{d:3.8,z:3.3},c:{d:4.8,z:2.2},g:{d:6.6,z:2.8}},
  set:{r:{d:1.0,z:2.4},a:{d:.9,z:.9},c:{d:2.4,z:1},g:{d:4.6,z:1.2}}};
const STAT={pow:'力量',jmp:'彈跳',spd:'速度',rcv:'接球',set:'舉球',blk:'攔網'};
const CHARS={
 oh:[{id:'go',name:'阿剛',hair:'#3a2418',style:'spiky',type:'重砲型',st:{pow:9,jmp:7,spd:6,rcv:4,set:3,blk:5},note:'扣球最重'},
     {id:'ryu',name:'龍二',hair:'#26324e',style:'spiky',type:'高點型',st:{pow:7,jmp:9,spd:6,rcv:4,set:3,blk:6},note:'跳得最高，能從攔網上面打'},
     {id:'kenta',name:'健太',hair:'#4a3214',style:'short',type:'全能型',st:{pow:7,jmp:7,spd:7,rcv:6,set:4,blk:5},note:'接球也穩'}],
 mb:[{id:'taiki',name:'大樹',hair:'#3a3a28',style:'short',type:'高牆型',st:{pow:6,jmp:7,spd:5,rcv:3,set:3,blk:9},note:'攔網最強'},
     {id:'sho',name:'小翔',hair:'#e8c040',style:'spiky',type:'速攻型',st:{pow:6,jmp:8,spd:9,rcv:3,set:2,blk:5},note:'起跳最快，快攻幾乎接不到'},
     {id:'ren',name:'蓮',hair:'#7a3a7a',style:'pony',type:'平衡型',st:{pow:6,jmp:7,spd:7,rcv:5,set:4,blk:7},note:'快攻和攔網都穩'}],
 op:[{id:'misaki',name:'美咲',hair:'#e09a3a',style:'pony',type:'速度型',st:{pow:6,jmp:6,spd:9,rcv:7,set:4,blk:4},note:'跑得最快，防守範圍大'},
     {id:'shan',name:'大山',hair:'#2a2a33',style:'short',type:'力量型',st:{pow:8,jmp:6,spd:5,rcv:6,set:3,blk:7},note:'右邊的重砲，也很會攔'},
     {id:'fu',name:'阿福',hair:'#7a4a22',style:'bowl',type:'防守型',st:{pow:5,jmp:5,spd:7,rcv:9,set:5,blk:4},note:'一傳最穩'}],
 set:[{id:'momo',name:'小桃',hair:'#f07aa0',style:'buns',type:'精準型',st:{pow:3,jmp:5,spd:7,rcv:5,set:9,blk:4},note:'托球最準'},
     {id:'yukina',name:'雪奈',hair:'#c9c2ff',style:'pony',type:'攻擊型',st:{pow:5,jmp:6,spd:6,rcv:5,set:7,blk:6},note:'偶爾自己二次吊球'},
     {id:'ming',name:'阿明',hair:'#5a3a20',style:'bowl',type:'快攻型',st:{pow:3,jmp:5,spd:8,rcv:5,set:8,blk:4},note:'節奏快，愛打快攻'}]};
const DIFF={easy:{miss:1.7,blk:.4,spd:.88,q:-.15,read:.5,err:1.6},normal:{miss:1,blk:.75,spd:1,q:0,read:1,err:1},hard:{miss:.55,blk:1,spd:1.08,q:.1,read:1.6,err:.6},hell:{miss:.3,blk:1.2,spd:1.15,q:.2,read:2.2,err:.35}};
const LINES={call:['我的！','我來！','交給我！'],spike:['喝！','看招！'],block:['擋下來！'],dive:['嘿呀！'],win:['好球！','讚！'],lose:['抱歉！','下一球！']};

// ---------------- 2 設定・聲音・按鍵 ----------------
let S=Object.assign({pace:.85,diff:'normal',win:25,sound:1,shake:1,hint:1,traj:1,cam:0,gfx:1,sens:1,slow:0,setSlow:1},load('fb-set',{}));
if(!S.fbUI){S.traj=0;S.hint=0;S.fbUI=1;}if(S.tell===undefined)S.tell=1;
// 難度只套在對手：MATCH.diff[隊伍]；自己隊友固定「普通」（關卡模式／對手強度設定會改 MATCH）
let MATCH={mode:'free',stage:0,diff:['normal','normal'],bonus:[0,0]};
// 隊友和對手用同一套底層邏輯（同一組 AI 參數）；強弱只看屬性（難度加成、王牌、成長）
const D=p=>DIFF.normal;
function saveS(){store('fb-set',S);}
// ---------------- 音效：全部用 WebAudio 即時合成（影片沒有聲音軌，依真實排球的聲音設計） ----------------
// 擊球＝短促的「啪」：一段濾波雜訊（皮革拍擊）＋一個快速下滑的低頻（球體的悶響）；扣球再加高頻的爆裂和一點破音
// 聲音會依球在畫面左右、離鏡頭遠近做立體聲和音量
let AC=null,MASTER=null,NOISE=null,AMB=null;
function ensureAudio(){if(AC){if(AC.state==='suspended')AC.resume();return;}try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return;}
  MASTER=AC.createDynamicsCompressor();MASTER.threshold.value=-14;MASTER.ratio.value=4;MASTER.connect(AC.destination);
  const n=AC.sampleRate*1.5,b=AC.createBuffer(1,n,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;NOISE=b;ambience();}
function spot3(){try{if(typeof cam==='undefined'||!ball)return{pan:0,vol:1};const v=new THREE.Vector3(ball.x,ball.y,ball.z),dist=cam.position.distanceTo(v);v.project(cam);
  return{pan:clamp(v.x*.8,-.9,.9),vol:clamp(1.25-dist/22,.35,1)};}catch(e){return{pan:0,vol:1};}}
function out(vol,pan){const g=AC.createGain();g.gain.value=vol*(+S.sound||0);let node=g;if(AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=pan;g.connect(p);p.connect(MASTER);}else g.connect(MASTER);return node;}
function nz(dst,t,dur,type,f,q,peak,att=.002){const s=AC.createBufferSource();s.buffer=NOISE;s.playbackRate.value=.9+Math.random()*.2;const fl=AC.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;
  const g=AC.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+att);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(fl);fl.connect(g);g.connect(dst);s.start(t,Math.random());s.stop(t+dur+.02);}
function tn(dst,t,f0,f1,dur,peak,type='sine'){const o=AC.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  const g=AC.createGain();g.gain.setValueAtTime(peak,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(dst);o.start(t);o.stop(t+dur+.02);}
function play(fn,vol=1,pos=true){if(!S.sound||!AC||!NOISE)return;const p=pos?spot3():{pan:0,vol:1},d=out(vol*p.vol,p.pan);fn(d,AC.currentTime+.005);}
function beep(f,d=.08,type='square',v=.07){play((o,t)=>tn(o,t,f,f,d,v,type),1,false);}
const SFX={
  // 接球（前臂墊球）：悶、厚
  hit:()=>play((o,t)=>{nz(o,t,.07,'lowpass',1100,.8,.9);tn(o,t,170,70,.12,.55);nz(o,t,.025,'bandpass',2400,1.2,.25);},1),
  // 舉球（手指）：輕、短、兩下
  set:()=>play((o,t)=>{nz(o,t,.035,'bandpass',1700,1.5,.5);nz(o,t+.012,.03,'bandpass',2200,2,.3);tn(o,t,260,140,.06,.15);},.85),
  // 扣球：爆裂＋低頻重擊
  spike:()=>play((o,t)=>{nz(o,t,.05,'highpass',1800,.7,1);nz(o,t,.13,'lowpass',700,.9,1);tn(o,t,140,45,.18,.9);},1.15),
  // 完美扣球：再多一層更重的低頻和尾音
  sup:()=>play((o,t)=>{nz(o,t,.06,'highpass',1500,.7,1.1);nz(o,t,.18,'lowpass',600,.8,1.1);tn(o,t,120,38,.26,1);nz(o,t+.03,.35,'bandpass',900,.6,.18);},1.3),
  // 攔網：手掌拍擊＋球彈開
  block:()=>play((o,t)=>{nz(o,t,.06,'bandpass',1300,1,.9);tn(o,t,200,90,.1,.5);},1),
  stuff:()=>play((o,t)=>{nz(o,t,.08,'bandpass',1100,.9,1.1);tn(o,t,160,50,.2,.9);nz(o,t+.05,.25,'lowpass',400,.7,.4);},1.2),
  // 球掛網：網子沙沙晃動
  net:()=>play((o,t)=>{for(let i=0;i<5;i++)nz(o,t+i*.035,.06,'bandpass',600+i*90,2,.35*(1-i*.15));},1),
  // 球落地：地板的悶響
  floor:()=>play((o,t)=>{tn(o,t,110,48,.16,.8);nz(o,t,.05,'lowpass',900,.8,.6);},1),
  // 球鞋摩擦地板（飛撲、落地）
  squeak:()=>play((o,t)=>tn(o,t,2600+Math.random()*700,1900,.07,.07,'triangle'),1),
  // 哨音：兩個接近的高頻加顫音
  whistle:()=>play((o,t)=>{[2850,3180].forEach(f=>{const os=AC.createOscillator(),lfo=AC.createOscillator(),lg=AC.createGain(),g=AC.createGain();os.frequency.value=f;lfo.frequency.value=28;lg.gain.value=90;lfo.connect(lg);lg.connect(os.frequency);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.11,t+.02);g.gain.setValueAtTime(.11,t+.42);g.gain.exponentialRampToValueAtTime(.001,t+.5);os.connect(g);g.connect(o);os.start(t);lfo.start(t);os.stop(t+.52);lfo.stop(t+.52);});},1,false),
  point:()=>{SFX.whistle();cheer();},
  call:()=>play((o,t)=>tn(o,t,880,880,.06,.08,'triangle'),1,false),
  talent:()=>{}};
// 場館環境音：很低的人聲底噪；得分時短暫歡呼
function ambience(){try{const s=AC.createBufferSource();s.buffer=NOISE;s.loop=true;const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=500;f.Q.value=.6;AMB=AC.createGain();AMB.gain.value=.028*(+S.sound||0);s.connect(f);f.connect(AMB);AMB.connect(MASTER);s.start();}catch(e){}}
function cheer(){if(!S.sound||!AC||!NOISE)return;const t=AC.currentTime,d=out(1,0),s=AC.createBufferSource();s.buffer=NOISE;s.loop=true;const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=900;f.Q.value=.4;
  const g=AC.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16,t+.25);g.gain.exponentialRampToValueAtTime(.001,t+1.8);s.connect(f);f.connect(g);g.connect(d);s.start(t);s.stop(t+1.9);}

const ACTS=['fwd','back','left','right','jump','atk','rcv','tip','block','mod','call','cam','pause','stype','s1','s2','s3','skill'];
const ACT_LABEL={skill:'技能（量表滿了可以用）',fwd:'往前（鏡頭方向）',back:'往後',left:'往左',right:'往右',jump:'跳躍',atk:'扣球・發球（空中＝左旋扣球；舉球員跳起來托第二球時＝直接扣過去）',rcv:'接球（按住＝接球姿勢；空中＝右旋扣球；舉球員跳起來托第二球時＝跳舉）',tip:'輕打・吊球',block:'攔網',mod:'技巧鍵（跳發）',call:'叫球（要舉球手托給你）',cam:'切換鏡頭',pause:'暫停',stype:'切換球種：舉球員＝攻擊方式、攻擊手＝要哪種球（滾輪也可以）',s1:'舉球：托給左攻',s2:'舉球：托給中間',s3:'舉球：托給右攻'};
const DEFAULT_KEYS={fwd:['k:KeyW','k:ArrowUp'],back:['k:KeyS','k:ArrowDown'],left:['k:KeyA','k:ArrowLeft'],right:['k:KeyD','k:ArrowRight'],jump:['k:Space',''],
  atk:['m:0','k:KeyJ'],rcv:['m:2','k:KeyK'],tip:['k:KeyF',''],block:['k:KeyE',''],mod:['k:ShiftLeft',''],call:['k:KeyV',''],cam:['k:KeyC',''],pause:['k:Escape','k:KeyP'],stype:['k:KeyR',''],s1:['k:Digit1',''],s2:['k:Digit2',''],s3:['k:Digit3',''],skill:['k:KeyQ','']};
let KB=JSON.parse(JSON.stringify(DEFAULT_KEYS));
(()=>{const o=load('fb-keys2',null);if(o)ACTS.forEach(a=>{if(Array.isArray(o[a])&&o[a].length===2)KB[a]=o[a];});
  // 舊存檔：Q 原本是叫球，改成技能鍵，叫球移到 V
  if(o&&!o.skill&&Array.isArray(o.call)&&o.call.includes('k:KeyQ')){KB.call=KB.call.map(c=>c==='k:KeyQ'?'k:KeyV':c);if(ACTS.some(a=>a!=='call'&&KB[a].includes('k:KeyV')))KB.call=KB.call.map(c=>c==='k:KeyV'?'':c);}})();
function keyName(c){if(!c)return'—';const t=c[0],v=c.slice(2);
  if(t==='m')return({0:'滑鼠左鍵',1:'滑鼠中鍵',2:'滑鼠右鍵',3:'滑鼠側鍵 1',4:'滑鼠側鍵 2'})[v]||'滑鼠 '+v;
  const map={Space:'空白',ArrowLeft:'←',ArrowRight:'→',ArrowUp:'↑',ArrowDown:'↓',Escape:'Esc',Enter:'Enter',Tab:'Tab',ShiftLeft:'左 Shift',ShiftRight:'右 Shift',ControlLeft:'左 Ctrl',ControlRight:'右 Ctrl',AltLeft:'左 Alt',AltRight:'右 Alt'};
  if(map[v])return map[v];if(v.startsWith('Key'))return v.slice(3);if(v.startsWith('Digit'))return v.slice(5);return v;}
const k1=a=>keyName(KB[a].find(Boolean)||'');
let capture=null;
function renderKB(){const box=$('kbList');box.innerHTML='';
  ACTS.forEach(a=>{const l=document.createElement('span');l.textContent=ACT_LABEL[a];box.appendChild(l);
    [0,1].forEach(i=>{const b=document.createElement('button');const c=KB[a][i],w=capture&&capture.a===a&&capture.i===i;
      b.className='kbtn'+(w?' wait':c?'':' empty');b.textContent=w?'請按鍵…':keyName(c);b.onclick=e=>{e.stopPropagation();capture={a,i};renderKB();};box.appendChild(b);});});}
function setBind(a,i,c){if(c)ACTS.forEach(x=>[0,1].forEach(j=>{if(KB[x][j]===c&&!(x===a&&j===i))KB[x][j]='';}));KB[a][i]=c;capture=null;store('fb-keys2',KB);renderKB();}
$('kbReset').onclick=()=>{KB=JSON.parse(JSON.stringify(DEFAULT_KEYS));capture=null;store('fb-keys2',KB);renderKB();};

// ---------------- 輸入 ----------------
const held={},hitK={},g3=$('g3');
// A/T 用 let：多人連線時主機會暫時換成遠端玩家的輸入
let A=a=>KB[a].some(c=>c&&held[c]),T=a=>KB[a].some(c=>c&&hitK[c]);
const isBound=c=>ACTS.some(a=>KB[a].includes(c));
const inMatch=()=>['serve','play','point'].includes(state);
addEventListener('keydown',e=>{ensureAudio();
  if(capture){e.preventDefault();if(e.code==='Escape'){capture=null;renderKB();return;}setBind(capture.a,capture.i,e.code==='Backspace'?'':'k:'+e.code);return;}
  if(!$('vSet').hidden){if(e.code==='Escape')closeSettings();return;}
  if(!inMatch())return;const c='k:'+e.code;
  if(!e.repeat&&KB.pause.includes(c)){togglePause();e.preventDefault();return;}
  if(paused)return;if(!held[c])hitK[c]=true;held[c]=true;if(isBound(c))e.preventDefault();});
addEventListener('keyup',e=>{held['k:'+e.code]=false;});
addEventListener('mousedown',e=>{ensureAudio();
  if(capture&&!(e.target.closest&&e.target.closest('.kbtn'))){e.preventDefault();setBind(capture.a,capture.i,'m:'+e.button);return;}
  if(!inMatch()||paused||e.target!==g3)return;e.preventDefault();g3.focus();
  if(document.pointerLockElement!==g3){try{const r=g3.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(err){}}
  const c='m:'+e.button;if(!held[c])hitK[c]=true;held[c]=true;});
addEventListener('mouseup',e=>{held['m:'+e.button]=false;});
// 滾輪：舉球時切換攻擊方式
addEventListener('wheel',e=>{if(typeof NET!=='undefined'&&NET.client&&inMatch()){NET.trig.add('stype');e.preventDefault();return;}if(!inMatch()||paused||typeof human==='undefined'||!human)return;if(human.role!=='set'){e.preventDefault();reqStep(human,e.deltaY>0?1:-1);return;}if(!setPhase(human))return;e.preventDefault();setTypeStep(human,e.deltaY>0?1:-1);},{passive:false});
document.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('blur',()=>{for(const k in held)held[k]=false;});
const mouse={x:0,y:0,in:false},cursorG={x:0,z:0,ok:false};
let camYaw=Math.PI/2,camPitch=.3,camFwd={x:1,z:0};
// 開放世界式視角：滑鼠直接轉鏡頭（點一下畫面會鎖定游標）；畫面中央的準星就是扣球、發球的落點
// 只在滑鼠鎖定時轉鏡頭（沒鎖定時游標會停在畫面邊緣，轉起來很怪）；忽略鎖定瞬間偶發的大跳動；用很短的平滑讓轉動不會太猛
let camYawT=Math.PI/2,camPitchT=.3,lockT=0;
document.addEventListener('pointerlockchange',()=>{lockT=performance.now();camYawT=camYaw;camPitchT=camPitch;});
g3.addEventListener('mousemove',e=>{mouse.in=true;if(!inMatch()||paused||document.pointerLockElement!==g3)return;
  const mx=e.movementX||0,my=e.movementY||0;if(performance.now()-lockT<120||Math.abs(mx)>180||Math.abs(my)>180)return;
  camYawT-=mx*.0017*S.sens;camPitchT=clamp(camPitchT+my*.0013*S.sens,-.2,1.05);});
function camLook(dt){const k=1-Math.exp(-dt*18);camYaw+=angDiff(camYaw,camYawT)*k;camPitch+=(camPitchT-camPitch)*k;}
g3.addEventListener('mouseleave',()=>{mouse.in=false;});
function inputVec(){const f=(A('fwd')?1:0)-(A('back')?1:0),r=(A('right')?1:0)-(A('left')?1:0),bf=camFwd,rx=-bf.z,rz=bf.x;
  let x=bf.x*f+rx*r,z=bf.z*f+rz*r;const l=Math.hypot(x,z);if(l>1){x/=l;z/=l;}return{x,z,mag:Math.min(1,l)};}
