
// ---------------- 動作擷取頁 ----------------
const MCX={pose:null,loading:null,world:[],img:[],fps:30,a:0,k:0,b:0,slot:'spike',busy:false,stop:false,cx:1,clip:null,t:0,
  view:null,rend:null,sc:null,cam:null,rig:null,orbit:.6,url:null};
function mcLoadPose(){if(MCX.loading)return MCX.loading;
  MCX.loading=new Promise((res,rej)=>{if(window.Pose)return res();const s=document.createElement('script');s.src='pose/pose.js';s.onload=res;s.onerror=()=>rej(new Error('找不到人體偵測模型檔（pose/pose.js）'));document.head.appendChild(s);})
    .then(async()=>{const p=new Pose({locateFile:f=>'pose/'+f+(/\.(data|tflite|binarypb)$/.test(f)?'.wasm':'')});p.setOptions({modelComplexity:MCX.cx,smoothLandmarks:true,enableSegmentation:false,minDetectionConfidence:.5,minTrackingConfidence:.5});
      p.onResults(r=>{MCX.last=r;});await p.initialize();MCX.pose=p;});
  MCX.loading.catch(()=>{MCX.loading=null;});return MCX.loading;}
const mcV=$('mcVideo'),mcO=$('mcOver');
$('mcFile').onchange=e=>{const f=e.target.files[0];if(!f)return;if(MCX.url)URL.revokeObjectURL(MCX.url);MCX.url=URL.createObjectURL(f);
  mcV.src=MCX.url;$('mcFileName').textContent=f.name;MCX.world=[];MCX.img=[];MCX.clip=null;mcEnable(false);$('mcStat').textContent='載入影片中…';
  mcV.onloadeddata=()=>{$('mcRun').disabled=false;$('mcStat').textContent=`影片長 ${mcV.duration.toFixed(1)} 秒。按「分析這段影片」開始。`;mcV.currentTime=0;};
  mcV.onerror=()=>{$('mcStat').textContent='這個影片格式瀏覽器播不了，請轉成 MP4（H.264）再試。';};};
document.querySelectorAll('[data-mc="cx"] .opt').forEach(b=>b.onclick=()=>{MCX.cx=+b.dataset.v;document.querySelectorAll('[data-mc="cx"] .opt').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));if(MCX.pose)MCX.pose.setOptions({modelComplexity:MCX.cx});});
function mcEnable(on){['mcTime','mcA','mcK','mcB','mcSave'].forEach(id=>$(id).disabled=!on);}
const seekTo=t=>new Promise(r=>{if(Math.abs(mcV.currentTime-t)<1e-4){r();return;}mcV.onseeked=()=>{mcV.onseeked=null;r();};mcV.currentTime=t;});
$('mcRun').onclick=async()=>{if(MCX.busy)return;MCX.busy=true;MCX.stop=false;$('mcRun').disabled=true;$('mcStop').hidden=false;mcEnable(false);
  try{$('mcStat').textContent='載入人體偵測模型…（第一次約需幾秒）';await mcLoadPose();
    const N=Math.max(2,Math.floor(Math.min(mcV.duration,30)*MCX.fps));MCX.world=new Array(N).fill(null);MCX.img=new Array(N).fill(null);const t0=performance.now();let found=0;
    for(let i=0;i<N&&!MCX.stop;i++){await seekTo(i/MCX.fps);MCX.last=null;await MCX.pose.send({image:mcV});const r=MCX.last;
      if(r&&r.poseWorldLandmarks){MCX.world[i]=r.poseWorldLandmarks.map(p=>[p.x,p.y,p.z,p.visibility]);MCX.img[i]=r.poseLandmarks.map(p=>[p.x,p.y,p.visibility]);found++;}
      if(i%3===0){mcDraw(i);const el=(performance.now()-t0)/1000,eta=el/(i+1)*(N-i-1);$('mcStat').textContent=`分析中 ${i+1} / ${N} 格・找到人的格數 ${found}・剩約 ${Math.ceil(eta)} 秒`;}}
    const n=MCX.world.length;MCX.a=0;MCX.b=n-1;MCX.k=Math.round(n/2);$('mcTime').max=n-1;$('mcTime').value=MCX.k;
    $('mcStat').textContent=found?`完成：${n} 格裡有 ${found} 格找到人。拖時間軸找到動作，標出起點、關鍵、終點。`:'整段影片都沒找到人，換一段全身清楚入鏡的影片試試。';
    if(found){mcEnable(true);mcScrub(MCX.k);mcRebuild();}}
  catch(e){$('mcStat').textContent='分析失敗：'+(e&&e.message||e);}
  MCX.busy=false;$('mcRun').disabled=false;$('mcStop').hidden=true;};
$('mcStop').onclick=()=>{MCX.stop=true;};
// 骨架疊圖
const BONES=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[27,31],[24,26],[26,28],[28,32],[15,19],[16,20]];
function mcDraw(i){const c=mcO,w=c.clientWidth,h=c.clientHeight;if(!w)return;if(c.width!==w||c.height!==h){c.width=w;c.height=h;}const g=c.getContext('2d');g.clearRect(0,0,w,h);
  const L=MCX.img[i];if(!L||!mcV.videoWidth)return;const s=Math.min(w/mcV.videoWidth,h/mcV.videoHeight),vw=mcV.videoWidth*s,vh=mcV.videoHeight*s,ox=(w-vw)/2,oy=(h-vh)/2,P=k=>[ox+L[k][0]*vw,oy+L[k][1]*vh];
  g.lineWidth=3;g.lineCap='round';BONES.forEach(([a,b])=>{g.strokeStyle=[a,b].some(k=>k%2===1&&k>10)?'#ffcf3a':'#4fd39a';const A_=P(a),B_=P(b);g.beginPath();g.moveTo(A_[0],A_[1]);g.lineTo(B_[0],B_[1]);g.stroke();});
  g.fillStyle='#fff';[0,11,12,13,14,15,16,23,24,25,26,27,28].forEach(k=>{const p=P(k);g.beginPath();g.arc(p[0],p[1],3.5,0,7);g.fill();});}
function mcScrub(i){i=clamp(i|0,0,Math.max(0,MCX.world.length-1));$('mcTime').value=i;seekTo(i/MCX.fps).then(()=>mcDraw(i));mcRangeText();}
$('mcTime').oninput=()=>mcScrub(+$('mcTime').value);
function mcRangeText(){const f=i=>(i/MCX.fps).toFixed(2)+' 秒';$('mcRange').textContent=MCX.world.length?`起點 ${f(MCX.a)}・關鍵 ${f(MCX.k)}・終點 ${f(MCX.b)}（長 ${((MCX.b-MCX.a)/MCX.fps).toFixed(2)} 秒）`:'';}
$('mcA').onclick=()=>{MCX.a=+$('mcTime').value;if(MCX.k<MCX.a)MCX.k=MCX.a;if(MCX.b<=MCX.a)MCX.b=Math.min(MCX.world.length-1,MCX.a+15);mcRebuild();};
$('mcK').onclick=()=>{MCX.k=+$('mcTime').value;if(MCX.k<MCX.a)MCX.a=MCX.k;if(MCX.k>MCX.b)MCX.b=MCX.k;mcRebuild();};
$('mcB').onclick=()=>{MCX.b=+$('mcTime').value;if(MCX.b<=MCX.a)MCX.a=Math.max(0,MCX.b-15);if(MCX.k>MCX.b)MCX.k=MCX.b;mcRebuild();};
$('mcMirror').onchange=mcRebuild;
function mcRebuild(){mcRangeText();if(!MCX.world.length)return;MCX.clip=buildClip(MCX.world,MCX.a,MCX.k,MCX.b,MCX.fps,MCX.slot,$('mcMirror').checked);MCX.t=0;
  $('mcSave').disabled=!MCX.clip;if(!MCX.clip)$('mcStat').textContent='這段範圍裡沒找到人，換一段範圍。';}
function mcSlots(){$('mcSlots').innerHTML=Object.keys(MSLOT).map(k=>`<button class="pill" data-v="${k}" aria-pressed="${k===MCX.slot}">${MSLOT[k].n}</button>`).join('');
  $('mcSlots').querySelectorAll('.pill').forEach(b=>b.onclick=()=>{MCX.slot=b.dataset.v;mcSlots();mcRebuild();});
  const S_=MSLOT[MCX.slot];$('mcSlotTip').textContent=`${S_.n}：${S_.d}。`;$('mcK').textContent='設為關鍵（'+S_.key+'）';}
$('mcSave').onclick=()=>{if(!MCX.clip)return;MCX.clip.slot=MCX.slot;MCX.clip.name=MSLOT[MCX.slot].n;MOCAP[MCX.slot]=MCX.clip;saveMocap();mcList();$('mcStat').textContent=`已存成「${MSLOT[MCX.slot].n}」。比賽中的球員現在會用這個動作。`;SFX.talent();};
function mcList(){$('mcList').innerHTML=Object.keys(MSLOT).map(k=>{const c=MOCAP[k];
  return `<div class="mcItem ${c?'on':''}"><b>${MSLOT[k].n}</b><span class="sub">${c?`${c.builtin?'內建・':''}${clipDur(c).toFixed(2)} 秒・${c.f.length} 格`:'未擷取，使用內建姿勢'}</span>
    ${c?`<div class="big2"><button class="tb" data-play="${k}">試播</button>${c.builtin?'':`<button class="tb" data-del="${k}">刪除</button>`}</div>`:''}</div>`;}).join('');
  $('mcList').querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>{MCX.clip=MOCAP[b.dataset.play];MCX.t=0;});
  $('mcList').querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{delete MOCAP[b.dataset.del];if(DEFAULT_MOCAP[b.dataset.del])MOCAP[b.dataset.del]=DEFAULT_MOCAP[b.dataset.del];saveMocap();mcList();});
  const own={};for(const k in MOCAP)if(!MOCAP[k].builtin)own[k]=MOCAP[k];$('mcJson').value=Object.keys(own).length?JSON.stringify({v:1,mocap:own}):'';}
$('mcCopy').onclick=async()=>{const t=$('mcJson');if(!t.value){$('mcJsonMsg').textContent='還沒有自己擷取的動作';return;}
  try{await navigator.clipboard.writeText(t.value);$('mcJsonMsg').textContent='已複製';}catch(e){t.focus();t.select();$('mcJsonMsg').textContent='已選取文字，請按 Ctrl+C 複製';}};
$('mcPaste').onclick=()=>{try{const o=JSON.parse($('mcJson').value);const m=o.mocap||o;let n=0;for(const k in m)if(MSLOT[k]&&m[k]&&Array.isArray(m[k].f)){MOCAP[k]=m[k];n++;}
    saveMocap();mcList();$('mcJsonMsg').textContent=n?`匯入了 ${n} 個動作`:'裡面沒有可用的動作';}catch(e){$('mcJsonMsg').textContent='格式不對：請貼上「複製全部動作」得到的文字';}};
// 3D 預覽
function mcInit3D(){if(MCX.rend||!renderer)return;try{MCX.rend=new TH.WebGLRenderer({canvas:$('mcView'),antialias:true});}catch(e){return;}
  MCX.rend.setPixelRatio(Math.min(devicePixelRatio||1,1.5));MCX.sc=new TH.Scene();MCX.sc.background=new TH.Color('#1a1330');
  MCX.sc.add(new TH.HemisphereLight('#fbf6ee','#4a3a66',1));const dl=new TH.DirectionalLight('#fff',.5);dl.position.set(2,5,3);MCX.sc.add(dl);
  const gr=new TH.GridHelper(4,8,'#5a4a7a','#2c2147');MCX.sc.add(gr);MCX.cam=new TH.PerspectiveCamera(40,4/3,.05,50);}
function mcRig(){if(MCX.rig){MCX.sc.remove(MCX.rig.g);}const p=mkP(ME||0,'oh',charOf('oh',prep.chars.oh),false);p.x=p.z=p.y=0;p.ox=p.oz=p.oy=0;p.yaw=p.oyaw=0;MCX.dp=p;MCX.rig=buildRig(p,MCX.sc);MCX.rig.aura.visible=false;MCX.rig.g.rotation.y=0;}
function mcFrame(dt){if($('vMocap').hidden||!MCX.rend)return;const c=$('mcView'),w=c.clientWidth,h=c.clientHeight;if(!w)return;
  if(MCX.rend._w!==w||MCX.rend._h!==h){MCX.rend._w=w;MCX.rend._h=h;MCX.rend.setSize(w,h,false);MCX.cam.aspect=w/h;MCX.cam.updateProjectionMatrix();}
  if(!MCX.rig||(GLBSRC&&!MCX.rig.glb))mcRig();
  MCX.orbit+=dt*.25;MCX.cam.position.set(Math.sin(MCX.orbit)*3.4,1.5,Math.cos(MCX.orbit)*3.4);MCX.cam.lookAt(0,.95,0);
  const R=MCX.rig,p=MCX.dp;R.g.updateMatrixWorld(true);
  if(MCX.clip){const D=clipDur(MCX.clip);MCX.t=(MCX.t+dt)%(D+.4);p.act={slot:'__prev',t:Math.min(MCX.t,D),w:1};MOCAP.__prev=MCX.clip;R.mw=1;}else{p.act=null;R.mw=0;}
  if(R.glb)retarget(R);else if(MCX.clip){/* 沒有模型時不預覽 */}
  delete MOCAP.__prev;MCX.rend.render(MCX.sc,MCX.cam);}
function openMocap(){show('vMocap');mcInit3D();mcSlots();mcList();}
