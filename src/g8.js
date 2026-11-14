
// ---------------- 角色外觀（套皮）：上傳 VRM／GLB，把喜歡的角色換到球員身上 ----------------
// 模型存在瀏覽器的 IndexedDB（檔案太大放不進 localStorage），不會上傳到任何地方。
// 骨架對應：VRM 自帶的人形對照表 → Mixamo／Unreal／VRoid 常見命名 → 關鍵字猜測。
const SKINS={};let skinDB=null;
const SK_ROLES=['oh','mb','op','set'];
if(!prep.skins)prep.skins={};
function skinOf(p){if(!p||p.noSkin)return null;const id=p.skinId||(p.team===ME?prep.skins[p.role]:OPP_SKIN[p.role]);return id&&SKINS[id]&&SKINS[id].gltf?SKINS[id]:null;}
function idb(){return new Promise((ok,no)=>{if(skinDB)return ok(skinDB);try{const r=indexedDB.open('vb-skins',1);
  r.onupgradeneeded=()=>r.result.createObjectStore('skins',{keyPath:'id'});r.onsuccess=()=>{skinDB=r.result;ok(skinDB);};r.onerror=()=>no(r.error);}catch(e){no(e);}});}
function idbAll(){return idb().then(db=>new Promise((ok,no)=>{const q=db.transaction('skins').objectStore('skins').getAll();q.onsuccess=()=>ok(q.result||[]);q.onerror=()=>no(q.error);}));}
function idbPut(rec){return idb().then(db=>new Promise((ok,no)=>{const t=db.transaction('skins','readwrite');t.objectStore('skins').put(rec);t.oncomplete=()=>ok();t.onerror=()=>no(t.error);}));}
function idbDel(id){return idb().then(db=>new Promise((ok,no)=>{const t=db.transaction('skins','readwrite');t.objectStore('skins').delete(id);t.oncomplete=()=>ok();t.onerror=()=>no(t.error);}));}
// VRM 人形骨頭名稱 → 遊戲用的名稱
const VRMB={hips:'Hips',spine:'Spine',neck:'Neck',head:'Head',leftShoulder:'LeftShoulder',rightShoulder:'RightShoulder',leftUpperArm:'LeftArm',rightUpperArm:'RightArm',
  leftLowerArm:'LeftForeArm',rightLowerArm:'RightForeArm',leftHand:'LeftHand',rightHand:'RightHand',leftMiddleProximal:'LeftHandMiddle1',rightMiddleProximal:'RightHandMiddle1',
  leftUpperLeg:'LeftUpLeg',rightUpperLeg:'RightUpLeg',leftLowerLeg:'LeftLeg',rightLowerLeg:'RightLeg',leftFoot:'LeftFoot',rightFoot:'RightFoot',leftToes:'LeftToeBase',rightToes:'RightToeBase'};
const NEED=['Hips','Spine','LeftArm','LeftForeArm','LeftHand','RightArm','RightForeArm','RightHand','LeftUpLeg','LeftLeg','LeftFoot','RightUpLeg','RightLeg','RightFoot'];
const BONE_ZH={Hips:'骨盆',Spine:'脊椎',LeftArm:'左上臂',LeftForeArm:'左前臂',LeftHand:'左手',RightArm:'右上臂',RightForeArm:'右前臂',RightHand:'右手',LeftUpLeg:'左大腿',LeftLeg:'左小腿',LeftFoot:'左腳',RightUpLeg:'右大腿',RightLeg:'右小腿',RightFoot:'右腳'};
function vrmMap(g){const j=g.parser&&g.parser.json,ex=j&&j.extensions||{},hm={},nm=i=>{const n=j.nodes[i]&&j.nodes[i].name;return n?TH.PropertyBinding.sanitizeNodeName(n):null;};
  if(ex.VRM&&ex.VRM.humanoid&&Array.isArray(ex.VRM.humanoid.humanBones))ex.VRM.humanoid.humanBones.forEach(b=>{if(VRMB[b.bone]&&b.node!=null)hm[VRMB[b.bone]]=nm(b.node);});
  const h1=ex.VRMC_vrm&&ex.VRMC_vrm.humanoid&&ex.VRMC_vrm.humanoid.humanBones;if(h1)for(const k in h1)if(VRMB[k]&&h1[k]&&h1[k].node!=null)hm[VRMB[k]]=nm(h1[k].node);
  const meta=ex.VRM&&ex.VRM.meta||ex.VRMC_vrm&&ex.VRMC_vrm.meta||null;return{hm,title:meta&&(meta.title||meta.name)||''};}
// 舊版 VRoid（VRM0）把頭髮、衣服的顏色存在 MToon 參數 _Color，不在標準顏色裡；沒讀進來頭髮會變全白
function vrm0Colors(g){const j=g.parser&&g.parser.json,mp=j&&j.extensions&&j.extensions.VRM&&j.extensions.VRM.materialProperties;if(!mp)return;const M={};
  mp.forEach((m,i)=>{const c=m.vectorProperties&&m.vectorProperties._Color;if(c)M[m.name||((j.materials[i]||{}).name)]=c;});
  g.scene.traverse(o=>{if(!o.isMesh)return;(Array.isArray(o.material)?o.material:[o.material]).forEach(mt=>{const c=mt&&M[mt.name];if(c&&mt.color&&!mt.userData.v0c){mt.color.setRGB(c[0],c[1],c[2]);mt.userData.v0c=1;}});});}
function parseSkin(rec){return new Promise((ok,no)=>{try{new TH.GLTFLoader().parse(rec.data.slice(0),'',g=>{tagNodes(g);vrm0Colors(g);const v=vrmMap(g);g.scene.userData.hmap=v.hm;
    const miss=NEED.filter(n=>!findBone(g.scene,n));ok({id:rec.id,name:rec.name,gltf:miss.length?null:g,miss,size:rec.data.byteLength,vrm:Object.keys(v.hm).length>0});},e=>no(e));}catch(e){no(e);}});}
// 內建角色：授權允許在遊戲中使用和轉載的 VRM（隨遊戲一起發佈，不存進瀏覽器）
const BUILTIN=[{id:'b-girl',name:'三葉（pixiv 範例）',url:'skins/girl.vrm.wasm',credit:'three-vrm-girl © pixiv Inc.'},
  {id:'b-twist',name:'藍葉（pixiv 範例）',url:'skins/twist.vrm.wasm',credit:'VRM1_Constraint_Twist_Sample © pixiv Inc.'},
  {id:'b-seed',name:'Seed-san',url:'skins/seed.vrm.wasm',credit:'Seed-san model by VirtualCast, Inc.（VRM Public License 1.0）'},
  {id:'b-fumi',name:'櫻田文莉也',url:'skins/Sakurada_Fumiriya.vrm.wasm',credit:'Sakurada Fumiriya © pixiv（VRoid 範例，CC0）'},
  {id:'b-shino',name:'千駄谷篠',url:'skins/Sendagaya_Shino.vrm.wasm',credit:'Sendagaya Shino © pixiv（VRoid 範例，CC0）'},
  {id:'b-shibu',name:'千駄谷澀',url:'skins/Sendagaya_Shibu.vrm.wasm',credit:'Sendagaya Shibu © pixiv（VRoid 範例，CC0）'},
  {id:'b-vita',name:'Vita',url:'skins/Vita.vrm.wasm',credit:'Vita © pixiv（VRoid 範例，CC0）'},
  {id:'b-vivi',name:'Vivi',url:'skins/Vivi.vrm.wasm',credit:'Vivi © pixiv（VRoid 範例，CC0）'},
  {id:'b-vic',name:'Victoria',url:'skins/Victoria_Rubin.vrm.wasm',credit:'Victoria Rubin © pixiv（VRoid 範例，CC0）'},
  {id:'b-hair',name:'髮型範例',url:'skins/HairSample_Female.vrm.wasm',credit:'HairSample_Female © pixiv（VRoid 範例，CC0）'},
  {id:'b-dshibu',name:'暗黑澀',url:'skins/Darkness_Shibu.vrm.wasm',credit:'Darkness Shibu © pixiv（VRoid 範例，CC0）'}];
// 預設：雙方 8 個人都套角色。上衣會染成隊伍顏色，同一個模型也會換不同髮色，分得出誰是誰
const SKIN_DEFAULT={oh:'b-shino',mb:'b-girl',op:'b-hair',set:'b-vivi'},OPP_SKIN={oh:'b-shibu',mb:'b-twist',op:'b-fumi',set:'b-vic'};
if((prep.skinInit|0)<3){prep.skins=Object.assign({},SKIN_DEFAULT);prep.skinInit=3;savePrep();}
// 讀內建角色：用網址開時直接抓檔；直接雙擊 index.html（file://）時瀏覽器不准抓檔，改讀同名的 .vrm.js（模型存成 base64 的腳本）
function skinScript(b){return new Promise((ok,no)=>{window.__SKB=window.__SKB||{};if(window.__SKB[b.id])return ok();const s=document.createElement('script');s.src=b.url.replace(/\.vrm\.wasm$/,'.vrm.js');s.onload=()=>ok();s.onerror=()=>no(new Error('skin'));document.head.appendChild(s);});}
async function skinBuf(b){if(location.protocol!=='file:'){try{const r=await fetch(b.url);if(r.ok)return await r.arrayBuffer();}catch(e){}}
  await skinScript(b);const d=window.__SKB[b.id];if(!d)throw 0;delete window.__SKB[b.id];return b64buf(d);}
async function loadBuiltins(){const use=new Set([...Object.values(prep.skins||{}),...Object.values(OPP_SKIN)]),L=[...BUILTIN].sort((a,b)=>use.has(b.id)-use.has(a.id));for(const b of L){if(window.__skinOnlyUsed&&!use.has(b.id))continue;try{const data=await skinBuf(b);const s=await parseSkin({id:b.id,name:b.name,data});s.builtin=1;s.credit=b.credit;SKINS[b.id]=s;}catch(e){}
    // 場上用到的角色都載好就先換上，其他角色在背景慢慢載
    if(use.has(b.id)&&[...use].every(id=>SKINS[id])&&GLBSRC)rebuildRigs();}
  if(GLBSRC)rebuildRigs();if(!$('vSkin').hidden){skRender();skRig();}}
async function loadSkins(){loadBuiltins();try{const all=await idbAll();for(const r of all){try{SKINS[r.id]=await parseSkin(r);}catch(e){SKINS[r.id]={id:r.id,name:r.name,gltf:null,miss:['讀不到檔案'],size:r.data.byteLength};}}}catch(e){}
  let ch=false;for(const r of SK_ROLES)if(prep.skins[r]&&!/^b-/.test(prep.skins[r])&&!SKINS[prep.skins[r]]){delete prep.skins[r];ch=true;}if(ch)savePrep();
  if(Object.keys(SKINS).length&&GLBSRC)rebuildRigs();}
// ---------- 頁面 ----------
const SKX={rend:null,sc:null,cam:null,rig:null,p:null,sel:null,mode:'auto',t:0,orbit:0,drag:null};
function openSkin(){show('vSkin');skInit3D();skRender();if(!SKX.sel){const k=Object.keys(SKINS).find(k=>SKINS[k].gltf);SKX.sel=k||null;}skRig();accPanel();}
function skMsg(t,bad){const m=$('skMsg');m.textContent=t;m.style.color=bad?'#ff8a7a':'';}
function skRender(){
  const L=$('skList');L.innerHTML='';const ids=Object.keys(SKINS);
  if(!ids.length)L.innerHTML='<p class="sub">還沒有角色。先上傳一個 VRM 或 GLB 檔。</p>';
  ids.forEach(id=>{const s=SKINS[id],row=document.createElement('div');row.className='skRow'+(SKX.sel===id?' on':'');
    const ok=!!s.gltf,info=ok?(s.credit||`${(s.size/1048576).toFixed(1)} MB${s.vrm?'・VRM':''}`):`不能用：找不到 ${s.miss.map(n=>BONE_ZH[n]||n).slice(0,4).join('、')}${s.miss.length>4?'…':''}`;
    row.innerHTML=`<button class="skName" ${ok?'':'disabled'}><b></b><small></small></button>${s.builtin?'<span class="sub" style="align-self:center;font-size:12px">內建</span>':'<button class="tb skDel">刪除</button>'}`;
    row.querySelector('b').textContent=s.name;row.querySelector('small').textContent=info;if(!ok)row.querySelector('small').style.color='#ff8a7a';
    row.querySelector('.skName').onclick=()=>{SKX.sel=id;skRender();skRig();accPanel();};
    const del=row.querySelector('.skDel');if(del)del.onclick=async()=>{if(del.dataset.arm!=='1'){del.dataset.arm='1';del.textContent='再按一次確認';setTimeout(()=>{del.dataset.arm='';del.textContent='刪除';},3000);return;}await idbDel(id).catch(()=>{});delete SKINS[id];
      for(const r of SK_ROLES)if(prep.skins[r]===id)delete prep.skins[r];savePrep();if(SKX.sel===id)SKX.sel=null;skRender();skRig();rebuildRigs();};
    L.appendChild(row);});
  const A=$('skAssign');A.innerHTML='';
  SK_ROLES.forEach(r=>{const row=document.createElement('label');row.className='skAs';const nm=charOf(r,prep.chars[r]).name;
    row.innerHTML=`<span>${ROLE[r].name}<small>${nm}${r===prep.role?'・你':''}</small></span><select></select>`;const sel=row.querySelector('select');
    sel.innerHTML='<option value="">預設人偶</option>'+ids.filter(id=>SKINS[id].gltf).map(id=>`<option value="${id}"></option>`).join('');
    ids.filter(id=>SKINS[id].gltf).forEach((id,i)=>{sel.options[i+1].textContent=SKINS[id].name;});
    sel.value=prep.skins[r]||'';sel.onchange=()=>{if(sel.value)prep.skins[r]=sel.value;else delete prep.skins[r];savePrep();rebuildRigs();skMsg(`${ROLE[r].name}換成「${sel.value?SKINS[sel.value].name:'預設人偶'}」`);};
    A.appendChild(row);});
  document.querySelectorAll('#skPose [data-m]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.m===SKX.mode)));}
$('skFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  if(!/\.(vrm|glb)$/i.test(f.name)){skMsg(/\.(fbx|pmx|pmd|obj)$/i.test(f.name)?'這個格式不能直接用：請先用 Blender 或 VRoid Studio 轉成 VRM／GLB（說明在下面）':'只支援 .vrm 和 .glb 檔',true);return;}
  if(f.size>60*1048576){skMsg('檔案超過 60 MB，太大了。請先減面或縮小貼圖再上傳',true);return;}
  skMsg('讀取中…');const data=await f.arrayBuffer(),id='sk'+Date.now().toString(36),rec={id,name:f.name.replace(/\.(vrm|glb)$/i,'').slice(0,24),data,created:Date.now()};
  let s;try{s=await parseSkin(rec);}catch(err){skMsg('讀不了這個檔案：'+String(err&&err.message||err).slice(0,80),true);return;}
  try{const g=s.gltf;if(g){const v=vrmMap(g);if(v.title)rec.name=s.name=String(v.title).slice(0,24);}await idbPut(rec);}catch(err){skMsg('瀏覽器儲存空間不夠，存不下這個模型',true);return;}
  SKINS[id]=s;SKX.sel=s.gltf?id:SKX.sel;skRender();skRig();
  skMsg(s.gltf?`「${s.name}」可以用了。在右邊的「套用到球員」選它。`:`「${s.name}」找不到完整的人形骨架（缺 ${s.miss.map(n=>BONE_ZH[n]||n).join('、')}），沒辦法做動作`,!s.gltf);};
document.querySelectorAll('#skPose [data-m]').forEach(b=>b.onclick=()=>{SKX.mode=b.dataset.m;SKX.t=0;skRender();});
// 3D 預覽：滑鼠拖曳轉角度
function skInit3D(){if(SKX.rend||!renderer)return;const c=$('skView');try{SKX.rend=new TH.WebGLRenderer({canvas:c,antialias:true});}catch(e){return;}
  SKX.rend.setPixelRatio(Math.min(devicePixelRatio||1,1.5));SKX.sc=new TH.Scene();SKX.sc.background=new TH.Color('#12303a');
  SKX.sc.add(new TH.HemisphereLight('#f2f8ff','#3a5a5c',.8));const dl=new TH.DirectionalLight('#fff',.6);dl.position.set(2,5,3);SKX.sc.add(dl);
  const fl=new TH.Mesh(new TH.CircleGeometry(1.6,40),new TH.MeshLambertMaterial({color:'#bf5c2c'}));fl.rotation.x=-Math.PI/2;SKX.sc.add(fl);
  SKX.cam=new TH.PerspectiveCamera(40,1,.05,50);
  c.addEventListener('pointerdown',e=>{SKX.drag=e.clientX;c.setPointerCapture(e.pointerId);});c.addEventListener('pointermove',e=>{if(SKX.drag!==null){SKX.orbit-=(e.clientX-SKX.drag)*.01;SKX.drag=e.clientX;}});
  c.addEventListener('pointerup',()=>SKX.drag=null);}
function skRig(){if(!SKX.sc)return;if(SKX.rig)SKX.sc.remove(SKX.rig.g);SKX.rig=null;
  const p=mkP(ME||0,prep.role,charOf(prep.role,prep.chars[prep.role]),false);p.x=p.z=p.y=p.ox=p.oz=p.oy=0;p.yaw=p.oyaw=0;p.skinId=SKX.sel||'__none';
  SKX.p=p;SKX.rig=buildRig(p,SKX.sc);SKX.rig.aura.visible=false;}
function skFrame(dt){if(!SKX.rend||$('vSkin').hidden)return;const c=$('skView'),w=c.clientWidth,h=c.clientHeight;if(!w)return;
  if(SKX.rend._w!==w||SKX.rend._h!==h){SKX.rend._w=w;SKX.rend._h=h;SKX.rend.setSize(w,h,false);SKX.cam.aspect=w/h;SKX.cam.updateProjectionMatrix();}
  if(!SKX.rig||(GLBSRC&&!SKX.rig.glb))skRig();if(!SKX.rig)return;
  if(SKX.drag===null)SKX.orbit+=dt*.3;SKX.cam.position.set(Math.sin(SKX.orbit)*4.6,1.5,Math.cos(SKX.orbit)*4.6);SKX.cam.lookAt(0,1.15,0);
  const p=SKX.p;SKX.t+=dt;const m=SKX.mode==='auto'?['stand','run','ready','spike','bump'][Math.floor(SKX.t/2.4)%5]:SKX.mode,k=SKX.t%2.4;
  p.ready=m==='ready';p.charging=false;p.y=0;p.vy=0;p.swing=0;p.pose='';p.vx=0;p.vz=m==='run'?5.5:0;
  if(m==='spike'){const tt=k-.4;if(tt>0&&tt<1.1){p.y=Math.max(0,4.6*tt-7*tt*tt);p.vy=4.6-14*tt;if(tt<.5)p.charging=true,p.power=tt*2;else{p.pose='spike';p.swing=.3;}}else if(tt<=0&&tt>-.2)p.loadT=.1;}
  if(m==='bump'&&k>.8&&k<1.3){p.pose='bump';p.swing=.3;}
  p.oy=p.y;const st=state;state='menu';try{poseRig(p,SKX.rig,dt);}catch(e){}state=st;p.vz=0;if(p.loadT>0)p.loadT=0;
  SKX.rend.render(SKX.sc,SKX.cam);}
$('mSkin').onclick=openSkin;
loadSkins();
// ---------------- 服飾與配件 ----------------
// 內建配件全部用程式做（不需要外部檔案）：角色建立時量這個模型的四肢粗細、頭圍、背的位置，配件照尺寸做好掛在骨頭上，跟著動作動。
// 另外可以匯入自己的 GLB 配件，選要掛在哪根骨頭、調位置／角度／大小。設定依角色分開存。
const ACC_ITEMS={knee:{n:'護膝',c:'#f2f2f0'},calf:{n:'小腿袖套',c:'#20222b'},wrist:{n:'護腕',c:'#ffffff'},sleeve:{n:'前臂袖套',c:'#20222b'},
  band:{n:'頭帶',c:'#e8414b'},bow:{n:'蝴蝶結',c:'#ff7aa8'},cap:{n:'運動帽',c:'#27344d'},bib:{n:'背號布',c:'team'}};
const ACC_DEF={'b-shino':{knee:1,wrist:1,band:1,bib:1},'b-girl':{knee:1,bow:1,bib:1},'b-hair':{knee:1,calf:1,wrist:1,bib:1},'b-vivi':{knee:1,sleeve:1,bib:1},
  'b-shibu':{knee:1,band:1,bib:1},'b-twist':{knee:1,wrist:1,bib:1},'b-fumi':{knee:1,bow:1,bib:1},'b-vic':{knee:1,calf:1,bib:1}};
const ACC_BONES={Head:'頭',Neck:'脖子',Spine:'胸背',Hips:'腰',LeftHand:'左手',RightHand:'右手',LeftForeArm:'左前臂',RightForeArm:'右前臂',LeftLeg:'左小腿',RightLeg:'右小腿',LeftFoot:'左腳',RightFoot:'右腳'};
let ACC=load('v3d-acc',{});
function accOf(id){if(!ACC[id]){const d=ACC_DEF[id]||{knee:1,bib:1},it={};for(const k in ACC_ITEMS)it[k]={on:!!d[k],c:ACC_ITEMS[k].c};ACC[id]={items:it,glb:[]};}
  const a=ACC[id];for(const k in ACC_ITEMS)if(!a.items[k])a.items[k]={on:false,c:ACC_ITEMS[k].c};return a;}
function accSave(){store('v3d-acc',ACC);}
const ACCG={};   // 匯入的 GLB：id → 解析好的場景
function accIdb(){return new Promise((ok,no)=>{try{const r=indexedDB.open('vb-acc',1);r.onupgradeneeded=()=>r.result.createObjectStore('acc',{keyPath:'id'});r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);}catch(e){no(e);}});}
async function accLoadGlbs(){try{const db=await accIdb();const all=await new Promise((ok,no)=>{const q=db.transaction('acc').objectStore('acc').getAll();q.onsuccess=()=>ok(q.result||[]);q.onerror=()=>no(q.error);});
  for(const r of all)await new Promise(ok=>{try{new TH.GLTFLoader().parse(r.data.slice(0),'',g=>{ACCG[r.id]=g.scene;ok();},()=>ok());}catch(e){ok();}});}catch(e){}
  if(Object.keys(ACCG).length){if(GLBSRC)rebuildRigs();if(!$('vSkin').hidden)skRig();}}
// 量模型：每根骨頭（取權重最大的那根）收一份頂點樣本，存成模型座標，同一個角色共用
const GC=[TH.BufferAttribute.prototype.getX,TH.BufferAttribute.prototype.getY,TH.BufferAttribute.prototype.getZ,TH.BufferAttribute.prototype.getW];
function accMeasure(sk,m){if(sk._accPts)return sk._accPts;m.updateMatrixWorld(true);const inv=new TH.Matrix4().copy(m.matrixWorld).invert(),pts={},v=new TH.Vector3();
  m.traverse(o=>{if(!o.isSkinnedMesh||!o.visible)return;const g=o.geometry,P=g.attributes.position,SI=g.attributes.skinIndex,SW=g.attributes.skinWeight;if(!P||!SI)return;
    const bones=o.skeleton.bones,step=P.count>20000?3:2;
    for(let i=0;i<P.count;i+=step){let bi=0,bw=-1;for(let k=0;k<4;k++){const w=GC[k].call(SW,i);if(w>bw){bw=w;bi=GC[k].call(SI,i);}}const b=bones[bi];if(!b)continue;
      v.fromBufferAttribute(P,i);o.boneTransform(i,v);v.applyMatrix4(o.matrixWorld).applyMatrix4(inv);(pts[b.name]||(pts[b.name]=[])).push(v.x,v.y,v.z);}});
  return sk._accPts=pts;}
function accPct(a,q){if(!a.length)return 0;a.sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.floor(a.length*q))];}
const _aw=new TH.Vector3(),_ab=new TH.Vector3();
// 一段骨頭（a→b）上 t0～t1 範圍內的頂點到骨頭軸的距離（取第 q 百分位）＝這一段的粗細
function accRadius(pts,bones,a,b,t0,t1,q,mw){const ax=_ab.subVectors(b,a),L2=ax.lengthSq(),d=[];if(L2<1e-6)return .05;
  for(const bn of bones){const P=pts[bn.name];if(!P)continue;for(let i=0;i<P.length;i+=3){_aw.set(P[i],P[i+1],P[i+2]).applyMatrix4(mw);const t=_aw.clone().sub(a).dot(ax)/L2;if(t<t0||t>t1)continue;
    d.push(_aw.sub(a).addScaledVector(ax,-t).length());}}
  return clamp(accPct(d,q)||.05,.02,.3);}
function accMat(c,o={}){return new TH.MeshToonMaterial(Object.assign({color:new TH.Color(c),gradientMap:gmS},o));}
function accBibTex(num,bg,fg){const cv=document.createElement('canvas');cv.width=128;cv.height=144;const g=cv.getContext('2d');
  g.fillStyle=bg;g.beginPath();const r=18;g.moveTo(r,0);g.arcTo(128,0,128,144,r);g.arcTo(128,144,0,144,r);g.arcTo(0,144,0,0,r);g.arcTo(0,0,128,0,r);g.fill();
  g.strokeStyle=fg;g.lineWidth=6;g.stroke();g.fillStyle=fg;g.font='900 92px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(String(num),64,80);
  const t=new TH.CanvasTexture(cv);t.anisotropy=4;return t;}
// 角色建立時呼叫（模型還在原始姿勢）：做配件、掛到骨頭上
function accAttach(R,p,sk,m,tc){if(!sk||!R.glb)return;const id=Object.keys(SKINS).find(k=>SKINS[k]===sk);if(!id)return;const A=accOf(id),B=R.glb.B;m.updateMatrixWorld(true);
  const key=JSON.stringify(A.items)+'|'+JSON.stringify(A.glb),tpl=(sk._accTpl||(sk._accTpl={}));
  if(!tpl[key]){tpl[key]=accBuild(sk,m,B,A);}
  const bname=new Map(Object.entries(B).map(([k,b])=>[b,k]));
  for(const e of tpl[key]){const bone=B[e.bone];if(!bone)continue;const o=e.bib?accBibMesh(e,p,tc):e.obj.clone(true);
    o.traverse(q=>{if(q.isMesh){q.castShadow=true;q.frustumCulled=false;}});m.add(o);o.updateMatrixWorld(true);bone.attach(o);(R.acc||(R.acc=[])).push(o);}}
function accBibMesh(e,p,tc){const c=e.c==='team'?tc:e.c,tex=accBibTex(p.num||1,'#ffffff',c);
  const g=new TH.Group();g.add(new TH.Mesh(new TH.PlaneGeometry(e.w,e.w*1.12),new TH.MeshToonMaterial({map:tex,gradientMap:gmS,transparent:true,alphaTest:.3})));
  g.position.copy(e.pos);g.quaternion.copy(e.q);return g;}
// 在模型座標裡量、做配件（同一個角色只做一次）。回傳 [{ bone: 骨頭名稱, obj }]
function accBuild(sk,m,B,A){const pts=accMeasure(sk,m),out=[],mw=new TH.Matrix4(),Minv=new TH.Matrix4().copy(m.matrixWorld).invert(),
  W=b=>b.getWorldPosition(new TH.Vector3()).applyMatrix4(Minv),up=new TH.Vector3(0,1,0);
  const bname=new Map(Object.entries(B).map(([k,b])=>[b,k]));
  const fw=W(B.LeftToeBase||B.LeftFoot).sub(W(B.LeftFoot));fw.y=0;if(fw.lengthSq()<1e-6)fw.set(0,0,1);fw.normalize();const rt=new TH.Vector3().crossVectors(up,fw);
  const kids=b=>{const L=[];b.traverse(o=>{if(o.isBone&&o!==b&&!Object.values(B).includes(o))L.push(o);});return L;};
  const put=(obj,bone)=>{out.push({bone:bname.get(bone),obj});};
  // 讓物件的 +Y 對準 dir、+Z 盡量朝前
  const orient=(obj,dir)=>{const y=dir.clone().normalize(),z=fw.clone().addScaledVector(y,-fw.dot(y));if(z.lengthSq()<1e-4)z.copy(up).addScaledVector(y,-up.dot(y));z.normalize();
    obj.quaternion.setFromRotationMatrix(new TH.Matrix4().makeBasis(new TH.Vector3().crossVectors(y,z),y,z));};
  const col=k=>{const c=A.items[k].c;return c==='team'?'#3a6fd8':c;};
  const tube=(rT,rB,h,c,o)=>{const g=new TH.CylinderGeometry(rT,rB,h,24,1,true);return new TH.Mesh(g,accMat(c,Object.assign({side:TH.DoubleSide},o)));};
  for(const sd of ['Left','Right']){const U=B[sd+'UpLeg'],Lg=B[sd+'Leg'],F=B[sd+'Foot'],FA=B[sd+'ForeArm'],H=B[sd+'Hand'];
    if(A.items.knee.on&&U&&Lg&&F){const k=W(Lg),a=W(U),f=W(F),len=k.distanceTo(f),r=Math.max(accRadius(pts,[U,Lg],a,k,.88,1,.8,mw),accRadius(pts,[Lg],k,f,0,.12,.8,mw));
      const g=new TH.Group(),h=len*.24;g.add(tube(r*1.07,r*1.05,h,col('knee')));
      const pad=new TH.Mesh(new TH.CylinderGeometry(r*1.2,r*1.15,h*.92,20,1,true,-1.15,2.3),accMat(col('knee'),{side:TH.DoubleSide}));g.add(pad);
      const rim=new TH.Mesh(new TH.TorusGeometry(r*1.07,.006,6,28),accMat('#2a2a33'));rim.rotation.x=Math.PI/2;rim.position.y=h/2;g.add(rim);const rim2=rim.clone();rim2.position.y=-h/2;g.add(rim2);
      orient(g,k.clone().sub(f));g.position.copy(k).addScaledVector(k.clone().sub(f).normalize(),-h*.12);put(g,Lg);}
    if(A.items.calf.on&&Lg&&F){const k=W(Lg),f=W(F),d=f.clone().sub(k),rT=accRadius(pts,[Lg],k,f,.25,.35,.85,mw),rB=accRadius(pts,[Lg],k,f,.78,.88,.85,mw),h=d.length()*.55;
      const g=new TH.Group();g.add(tube(rT*1.05,rB*1.06,h,col('calf')));orient(g,d.clone().negate());g.position.copy(k).addScaledVector(d,.56);put(g,Lg);}
    if(A.items.sleeve.on&&FA&&H){const e=W(FA),w=W(H),d=w.clone().sub(e),rT=accRadius(pts,[FA],e,w,.15,.25,.85,mw),rB=accRadius(pts,[FA],e,w,.75,.85,.85,mw),h=d.length()*.62;
      const g=new TH.Group();g.add(tube(rT*1.06,rB*1.07,h,col('sleeve')));orient(g,d.clone().negate());g.position.copy(e).addScaledVector(d,.52);put(g,FA);}
    if(A.items.wrist.on&&FA&&H){const e=W(FA),w=W(H),d=w.clone().sub(e),r=accRadius(pts,[FA,H],e,w,.84,1,.85,mw);
      const g=new TH.Group(),hb_=Math.max(.035,r*1.1),t=new TH.Mesh(new TH.CylinderGeometry(r*1.16,r*1.16,hb_,24),accMat(col('wrist')));g.add(t);
      for(const sgn of [-1,1]){const st=new TH.Mesh(new TH.TorusGeometry(r*1.165,.0035,5,24),accMat('#2a2a33'));st.rotation.x=Math.PI/2;st.position.y=sgn*hb_*.32;g.add(st);}
      orient(g,d.clone().negate());g.position.copy(e).addScaledVector(d,.9);put(g,FA);}}
  // 頭：臉的中心與半徑（權重在頭骨上的頂點），頭髮外緣（頭底下的頭髮骨頭）
  const Hd=B.Head;if(Hd&&(A.items.band.on||A.items.bow.on||A.items.cap.on)){const P=pts[Hd.name]||[],hb=kids(Hd),c=new TH.Vector3();let n=0;
    for(let i=0;i<P.length;i+=3){c.x+=P[i];c.y+=P[i+1];c.z+=P[i+2];n++;}if(n){c.multiplyScalar(1/n).applyMatrix4(mw);
      const ys=[];for(let i=1;i<P.length;i+=3){_aw.set(P[i-1],P[i],P[i+1]).applyMatrix4(mw);ys.push(_aw.y);}const base=W(Hd).y,top=accPct(ys,.985);
      const hh=Math.max(.14,top-base),bandY=base+hh*.62;
      // 中心改用額頭高度那一圈臉的平均位置
      {let sx=0,sz=0,k=0;for(let i=0;i<P.length;i+=3){_aw.set(P[i],P[i+1],P[i+2]).applyMatrix4(mw);if(Math.abs(_aw.y-bandY)>hh*.08)continue;sx+=_aw.x;sz+=_aw.z;k++;}if(k){c.x=sx/k;c.z=sz/k;}c.y=base+hh*.5;}
      const ring=(y,bones,q)=>{const d=[];for(const bn of bones){const Q=pts[bn.name];if(!Q)continue;for(let i=0;i<Q.length;i+=3){_aw.set(Q[i],Q[i+1],Q[i+2]).applyMatrix4(mw);if(Math.abs(_aw.y-y)>hh*.08)continue;d.push(Math.hypot(_aw.x-c.x,_aw.z-c.z));}}return accPct(d,q);};
      const rFace=ring(bandY,[Hd],.9)||hh*.45,rHair=Math.max(rFace,ring(bandY,hb,.97)||0);
      // 往後最遠的頭髮（蝴蝶結貼在頭髮外面）
      const backAt=y=>{const d=[];for(const bn of [Hd,...hb]){const Q=pts[bn.name];if(!Q)continue;for(let i=0;i<Q.length;i+=3){_aw.set(Q[i],Q[i+1],Q[i+2]).applyMatrix4(mw);if(Math.abs(_aw.y-y)>hh*.08)continue;const lat=Math.abs(_aw.clone().sub(c).dot(rt));if(lat>hh*.2)continue;d.push(-_aw.clone().sub(c).dot(fw));}}return accPct(d,.98)||rHair;};
      // 頭圍：每 15° 量一次頭的表面（臉＋貼著頭的頭髮，離中心超過臉半徑 1.6 倍的頭髮不算），頭帶沿著量到的點；前面低、後面高
      let RR=null;const headRing=()=>{if(RR)return RR;
        // 每 15° 量一次頭的表面
        const N=24,rad=[],src=[Hd,...hb];const fr=rFace*1.6;
        for(let a=0;a<N;a++)rad.push([]);
        for(const bn of src){const Q=pts[bn.name];if(!Q)continue;for(let i=0;i<Q.length;i+=3){_aw.set(Q[i],Q[i+1],Q[i+2]).applyMatrix4(mw);const dx=_aw.x-c.x,dz=_aw.z-c.z,dd=Math.hypot(dx,dz);if(dd>fr)continue;
          const ff=dx*fw.x+dz*fw.z,rr=dx*rt.x+dz*rt.z,ang=Math.atan2(rr,ff),yy=bandY-.022*Math.cos(ang);if(Math.abs(_aw.y-yy)>hh*.06)continue;rad[((Math.round(ang/(2*Math.PI)*N)%N)+N)%N].push(dd);}}
        let R=rad.map(a=>accPct(a,.92)||0);const avg=R.filter(x=>x>0).reduce((a,b)=>a+b,0)/Math.max(1,R.filter(x=>x>0).length)||rFace;R=R.map(x=>x>0?x:avg);
        R=R.map((x,k)=>(R[(k+N-1)%N]+2*x+R[(k+1)%N])/4);   // 平滑
        return RR=R;};
      if(A.items.band.on){const R=headRing(),N=R.length;
        const cp=R.map((r0,k)=>{const ang=k/N*2*Math.PI,rr=r0+.007;return new TH.Vector3(c.x,bandY-.022*Math.cos(ang),c.z).addScaledVector(fw,Math.cos(ang)*rr).addScaledVector(rt,Math.sin(ang)*rr);});
        const curve=new TH.CatmullRomCurve3(cp,true),g=new TH.Group(),wd=Math.max(.012,hh*.07);
        const mk=dy=>new TH.Mesh(new TH.TubeGeometry(curve,96,wd*.32,6,true),accMat(col('band')));for(const dy of [-wd*.3,0,wd*.3]){const t=mk();t.position.y=dy;g.add(t);}
        const back=cp[N/2],bd=fw.clone().negate();
        for(const sg of [-1,1]){const tail=new TH.Mesh(new TH.BoxGeometry(wd*.9,hh*.5,.005),accMat(col('band')));tail.position.copy(back).addScaledVector(bd,.012).addScaledVector(rt,sg*wd*.6);tail.position.y-=hh*.24;
          tail.quaternion.setFromRotationMatrix(new TH.Matrix4().makeBasis(rt,up,fw));tail.rotateZ(sg*.16);tail.rotateX(.12);g.add(tail);}
        const knot=new TH.Mesh(new TH.SphereGeometry(wd*.9,10,8),accMat(col('band')));knot.position.copy(back).addScaledVector(bd,.01);g.add(knot);
        put(g,Hd);}
      if(A.items.bow.on){const g=new TH.Group(),s=hh*.2,m1=accMat(col('bow'));
        for(const k of [-1,1]){const l=new TH.Mesh(new TH.SphereGeometry(1,14,10),m1);l.scale.set(s*.95,s*.62,s*.32);l.position.x=k*s*.85;l.rotation.z=k*.35;g.add(l);
          const tl=new TH.Mesh(new TH.BoxGeometry(s*.42,s*1.3,s*.08),m1);tl.position.set(k*s*.35,-s*.95,0);tl.rotation.z=k*.4;g.add(tl);}
        const kn=new TH.Mesh(new TH.SphereGeometry(s*.34,12,8),accMat(new TH.Color(col('bow')).multiplyScalar(.82)));g.add(kn);
        g.quaternion.setFromRotationMatrix(new TH.Matrix4().makeBasis(rt,up,fw));const back=fw.clone().negate();
        const by=base+hh*.58,bk=backAt(by);g.position.copy(c).addScaledVector(back,bk+s*.2);g.position.y=by;if(window.__accDbg)console.log("BOW",JSON.stringify({fw:fw.toArray(),c:c.toArray(),bk,rHair,pos:g.position.toArray()}));g.rotateY(Math.PI);g.rotateX(.35);put(g,Hd);}
      if(A.items.cap.on){
        // 帽子：用頭圍量到的大小（前後、左右分開）蓋住頭頂、下緣到額頭，帽簷往前
        const R=headRing(),N=R.length,rf=R[0],rb=R[N/2],rs=(R[N/4]+R[3*N/4])/2,g=new TH.Group(),m1=accMat(col('cap')),y0=bandY+.012,ht=Math.max(.06,top+.02-y0);
        const dome=new TH.Mesh(new TH.SphereGeometry(1,28,14,0,Math.PI*2,0,Math.PI/2),m1);dome.scale.set(rs+.012,ht,(rf+rb)/2+.012);g.add(dome);
        dome.position.z=(rf-rb)/2;
        const brim=new TH.Mesh(new TH.CylinderGeometry(1,1,.016,28,1,false,-Math.PI/2.3,Math.PI/1.15),m1);brim.scale.set(rs*.92,1,rf*.95);brim.position.set(0,0,(rf-rb)/2+rf*.45);brim.rotation.x=.16;g.add(brim);
        const btn=new TH.Mesh(new TH.SphereGeometry(.012,8,6),m1);btn.position.set(0,ht,(rf-rb)/2);g.add(btn);
        const strip=new TH.Mesh(new TH.TorusGeometry(1,.004,5,40),accMat(new TH.Color(col('cap')).multiplyScalar(.7)));strip.rotation.x=Math.PI/2;strip.scale.set(rs+.013,(rf+rb)/2+.013,1);strip.position.set(0,.004,(rf-rb)/2);g.add(strip);
        g.quaternion.setFromRotationMatrix(new TH.Matrix4().makeBasis(rt,up,fw));g.position.set(c.x,y0,c.z);put(g,Hd);}}}
  // 背號：胸背高度、往後貼在衣服外面
  if(A.items.bib.on&&B.Spine&&B.Neck){const s0=W(B.Spine),n0=W(B.Neck),y=lerp(s0.y,n0.y,.45),bones=[B.Spine,...kids(B.Spine).filter(b=>!/hair|bust|breast|skirt|sode/i.test(b.name))],d=[];
    for(const bn of bones){const Q=pts[bn.name];if(!Q)continue;for(let i=0;i<Q.length;i+=3){_aw.set(Q[i],Q[i+1],Q[i+2]).applyMatrix4(mw);if(Math.abs(_aw.y-y)>.05)continue;
      const lat=Math.abs(_aw.clone().sub(s0).dot(rt));if(lat>.06)continue;d.push(-_aw.clone().sub(s0).dot(fw));}}
    const back=Math.max(.06,accPct(d,.97)||.1),w=Math.max(.14,Math.min(.24,s0.distanceTo(n0)*1.1));
    const q=new TH.Quaternion().setFromRotationMatrix(new TH.Matrix4().makeBasis(rt.clone().negate(),up,fw.clone().negate())),pos=s0.clone().addScaledVector(fw,-(back+.012));pos.y=y;
    out.push({bone:'Spine',bib:1,w,pos,q,c:A.items.bib.c});}
  // 匯入的 GLB 配件
  for(const it of A.glb||[]){const src=ACCG[it.id],bone=B[it.bone];if(!src||!bone)continue;const o=src.clone(true);const bx=new TH.Box3().setFromObject(o),sz=bx.getSize(new TH.Vector3()),ctr=bx.getCenter(new TH.Vector3());
    const k=(it.s||1)*.25/Math.max(.001,sz.x,sz.y,sz.z);o.position.sub(ctr);const g=new TH.Group(),inner=new TH.Group();inner.add(o);inner.scale.setScalar(k);inner.rotation.set((it.r||[0,0,0])[0],(it.r||[0,0,0])[1],(it.r||[0,0,0])[2]);g.add(inner);
    o.traverse(q=>{if(q.isMesh&&q.material){const ms=Array.isArray(q.material)?q.material:[q.material];q.material=ms.map(mt=>new TH.MeshToonMaterial({color:mt.color?mt.color.clone():new TH.Color('#fff'),map:mt.map||null,gradientMap:gmS,transparent:!!mt.transparent,opacity:mt.opacity??1,side:mt.side??TH.FrontSide}));if(q.material.length===1)q.material=q.material[0];}});
    const P0=W(bone),off=it.p||[0,0,0];g.quaternion.setFromRotationMatrix(new TH.Matrix4().makeBasis(rt,up,fw));g.position.copy(P0).addScaledVector(rt,off[0]).addScaledVector(up,off[1]).addScaledVector(fw,off[2]);put(g,bone);}
  return out;}
// ---------- 外觀頁的配件面板 ----------
let accT=0;function accChanged(){accSave();skRig();clearTimeout(accT);accT=setTimeout(()=>{if(GLBSRC)rebuildRigs();},350);}
function accPanel(){const box=$('skAcc');if(!box)return;const id=SKX.sel;if(!id||!SKINS[id]||!SKINS[id].gltf){box.innerHTML='<p class="sub">先在左邊選一個角色。</p>';return;}
  const A=accOf(id);box.innerHTML='';const name=document.createElement('p');name.className='sub';name.textContent=`正在設定「${SKINS[id].name}」（每個角色分開存）`;box.appendChild(name);
  const grid=document.createElement('div');grid.className='accGrid';box.appendChild(grid);
  for(const k in ACC_ITEMS){const it=A.items[k],row=document.createElement('label');row.className='accRow'+(it.on?' on':'');
    row.innerHTML=`<input type="checkbox" ${it.on?'checked':''}><span></span>${it.c==='team'?'<small class="sub">隊伍色</small>':'<input type="color">'}`;row.querySelector('span').textContent=ACC_ITEMS[k].n;
    row.querySelector('input[type=checkbox]').onchange=e=>{it.on=e.target.checked;row.classList.toggle('on',it.on);accChanged();};
    const ci=row.querySelector('input[type=color]');if(ci){ci.value=it.c;ci.oninput=()=>{it.c=ci.value;accChanged();};}grid.appendChild(row);}
  const imp=document.createElement('div');imp.className='big2';imp.innerHTML='<label class="pill" for="accFile" style="cursor:pointer">匯入配件 GLB…</label><button class="pill" id="accReset">恢復這個角色的預設</button>';box.appendChild(imp);
  imp.querySelector('#accReset').onclick=()=>{delete ACC[id];accOf(id);accChanged();accPanel();};
  for(const g of A.glb){const r=document.createElement('div');r.className='accImp';const ro=g.r||[0,0,0],po=g.p||[0,0,0];
    r.innerHTML=`<div class="accImpH"><b></b><select>${Object.keys(ACC_BONES).map(b=>`<option value="${b}">${ACC_BONES[b]}</option>`).join('')}</select><button class="tb">移除</button></div>`+
      [['左右',0,'p',-.4,.4],['上下',1,'p',-.4,.4],['前後',2,'p',-.4,.4],['轉向',1,'r',-3.14,3.14],['前傾',0,'r',-3.14,3.14],['大小','s','s',.2,4]].map(([n,i,f,a,b])=>`<label class="accSl"><span>${n}</span><input type="range" min="${a}" max="${b}" step="0.01" data-f="${f}" data-i="${i}"></label>`).join('');
    r.querySelector('b').textContent=g.name;const sel=r.querySelector('select');sel.value=g.bone;sel.onchange=()=>{g.bone=sel.value;accChanged();};
    r.querySelectorAll('input[type=range]').forEach(inp=>{const f=inp.dataset.f,i=+inp.dataset.i;inp.value=f==='s'?(g.s||1):f==='p'?po[i]:ro[i];
      inp.oninput=()=>{if(f==='s')g.s=+inp.value;else{(g[f]||(g[f]=[0,0,0]))[i]=+inp.value;}accChanged();};});
    r.querySelector('button').onclick=async()=>{A.glb=A.glb.filter(x=>x!==g);if(!Object.values(ACC).some(a=>(a.glb||[]).some(x=>x.id===g.id))){try{const db=await accIdb();db.transaction('acc','readwrite').objectStore('acc').delete(g.id);}catch(e){}delete ACCG[g.id];}accChanged();accPanel();};
    box.appendChild(r);}}
$('accFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';const id=SKX.sel;if(!f||!id)return;if(!/\.glb$/i.test(f.name)){skMsg('配件只支援 .glb 檔',true);return;}
  if(f.size>8*1048576){skMsg('配件檔超過 8 MB，請先縮小',true);return;}const data=await f.arrayBuffer(),aid='ac'+Date.now().toString(36);
  try{await new Promise((ok,no)=>new TH.GLTFLoader().parse(data.slice(0),'',g=>{ACCG[aid]=g.scene;ok();},no));}catch(err){skMsg('讀不了這個配件檔',true);return;}
  try{const db=await accIdb();await new Promise((ok,no)=>{const t=db.transaction('acc','readwrite');t.objectStore('acc').put({id:aid,name:f.name,data});t.oncomplete=ok;t.onerror=()=>no(t.error);});}catch(err){skMsg('瀏覽器儲存空間不夠',true);return;}
  const A=accOf(id);A.glb.push({id:aid,name:f.name.replace(/\.glb$/i,'').slice(0,24),bone:'Head',p:[0,.26,0],r:[0,0,0],s:1});accChanged();accPanel();skMsg('配件加上去了，用下面的滑桿調位置與大小');};
accLoadGlbs();

// ---------------- 選角：每個球員綁一個外觀，賽前畫面看 3D 樣貌、頭像與能力值 ----------------
const CHAR_SKIN={go:'b-shino',ryu:'b-dshibu',kenta:'b-shibu',taiki:'b-girl',sho:'b-vita',ren:'b-twist',misaki:'b-hair',shan:'b-seed',fu:'b-fumi',momo:'b-vivi',yukina:'b-vic',ming:'b-girl'};
if((prep.skinInit|0)<4){ROLES.forEach(r=>{const s=CHAR_SKIN[prep.chars[r]];if(s)prep.skins[r]=s;});prep.skinInit=4;savePrep();}
// 選了某個球員：場上的外觀換成他的樣貌
function pickChar(r,cid){prep.chars[r]=cid;if(CHAR_SKIN[cid])prep.skins[r]=CHAR_SKIN[cid];savePrep();}
const PV={rend:null,sc:null,cam:null,rig:null,p:null,role:null,cid:null,orbit:0,drag:null,thumbs:{},tq:[],tT:0,rt:null};
function pvInit(){if(PV.rend||!renderer)return;const c=$('pView');try{PV.rend=new TH.WebGLRenderer({canvas:c,antialias:true});}catch(e){return;}
  PV.rend.setPixelRatio(Math.min(devicePixelRatio||1,1.5));PV.sc=new TH.Scene();PV.sc.background=new TH.Color('#12303a');
  PV.sc.add(new TH.HemisphereLight('#f2f8ff','#3a5a5c',.85));const dl=new TH.DirectionalLight('#fff',.6);dl.position.set(2,5,3);PV.sc.add(dl);
  const fl=new TH.Mesh(new TH.CircleGeometry(1.3,40),new TH.MeshLambertMaterial({color:'#bf5c2c'}));fl.rotation.x=-Math.PI/2;PV.sc.add(fl);PV.fl=fl;
  PV.cam=new TH.PerspectiveCamera(36,1,.05,50);PV.rt=new TH.WebGLRenderTarget(160,160);
  c.addEventListener('pointerdown',e=>{PV.drag=e.clientX;c.setPointerCapture(e.pointerId);});c.addEventListener('pointermove',e=>{if(PV.drag!==null){PV.orbit-=(e.clientX-PV.drag)*.01;PV.drag=e.clientX;}});
  c.addEventListener('pointerup',()=>PV.drag=null);}
function pvSkinOf(r,cid){return(cid===prep.chars[r]&&prep.skins[r])||CHAR_SKIN[cid]||'__none';}
function pvMakeP(r,cid){const p=mkP(ME||0,r,charOf(r,cid),false);p.x=p.z=p.y=p.ox=p.oz=p.oy=0;p.yaw=p.oyaw=0;p.skinId=pvSkinOf(r,cid);p.num=[4,1,7,3][ROLES.indexOf(r)]+(ME?8:0);return p;}
function pvShow(r,cid){pvInit();PV.role=r;PV.cid=cid;const c=charOf(r,cid);
  $('pvInfo').innerHTML=`<div class="pvN"><b></b><span></span></div><div class="pvR"></div><div class="pvT"></div><div class="stats">${statBars(c.st)}</div>`;
  $('pvInfo').querySelector('b').textContent=c.name;$('pvInfo').querySelector('.pvN span').textContent=c.type;
  $('pvInfo').querySelector('.pvR').textContent=`${ROLE[r].name}${r===prep.role?'・你操控':''}${PV.sc?'':'（這個瀏覽器無法顯示 3D）'}`;$('pvInfo').querySelector('.pvT').textContent=c.note;
  pvRig();}
function pvRig(){if(!PV.sc)return;if(PV.rig)PV.sc.remove(PV.rig.g);PV.rig=null;if(!PV.role)return;PV.p=pvMakeP(PV.role,PV.cid);PV.rig=buildRig(PV.p,PV.sc);PV.rig.aura.visible=false;}
function pvPose(p,R,dt){p.ready=false;p.charging=false;p.y=0;p.vy=0;p.swing=0;p.pose='';p.vx=0;p.vz=0;p.oy=0;const st=state;state='menu';try{poseRig(p,R,dt);}catch(e){}state=st;}
// 頭像：用同一個畫布在 160×160 的畫面外渲染、讀回像素
function pvThumb(r,cid){const sid=CHAR_SKIN[cid];if(!PV.sc||!sid||!SKINS[sid]||!SKINS[sid].gltf)return false;
  const p=pvMakeP(r,cid);p.skinId=sid;const R=buildRig(p,PV.sc);R.aura.visible=false;if(PV.rig)PV.rig.g.visible=false;PV.fl.visible=false;
  for(let i=0;i<20;i++)pvPose(p,R,1/30);R.g.updateMatrixWorld(true);const hp=new TH.Vector3();(R.glb&&R.glb.B.Head?R.glb.B.Head:R.g).getWorldPosition(hp);
  const cam=new TH.PerspectiveCamera(30,1,.05,20);cam.position.set(.18,hp.y+.12,1.05);cam.lookAt(0,hp.y+.06,0);
  PV.rend.setRenderTarget(PV.rt);PV.rend.render(PV.sc,cam);const px=new Uint8Array(160*160*4);PV.rend.readRenderTargetPixels(PV.rt,0,0,160,160,px);PV.rend.setRenderTarget(null);
  PV.sc.remove(R.g);if(PV.rig)PV.rig.g.visible=true;PV.fl.visible=true;
  const cv=document.createElement('canvas');cv.width=cv.height=160;const g=cv.getContext('2d'),im=g.createImageData(160,160);
  for(let y=0;y<160;y++)im.data.set(px.subarray((159-y)*640,(160-y)*640),y*640);g.putImageData(im,0,0);
  PV.thumbs[cid]=cv.toDataURL('image/jpeg',.88);document.querySelectorAll(`img[data-th="${cid}"]`).forEach(img=>{img.src=PV.thumbs[cid];img.hidden=false;const sw=img.nextElementSibling;if(sw&&sw.classList.contains('sw'))sw.hidden=true;});return true;}
function pvFrame(dt){if(!PV.rend||$('vPrep').hidden)return;const c=$('pView'),w=c.clientWidth,h=c.clientHeight;if(!w)return;
  if(PV.rend._w!==w||PV.rend._h!==h){PV.rend._w=w;PV.rend._h=h;PV.rend.setSize(w,h,false);PV.cam.aspect=w/h;PV.cam.updateProjectionMatrix();}
  // 頭像一次做一張（模型還沒載好的晚點再試）
  PV.tT-=dt;if(PV.tT<=0){PV.tT=.12;const need=ROLES.flatMap(r=>CHARS[r].map(c=>[r,c.id])).filter(([r,id])=>!PV.thumbs[id]);for(const [r,id] of need){if(pvThumb(r,id))break;}}
  if(PV.rig&&PV.p&&PV.p.skinId!=='__none'&&SKINS[PV.p.skinId]&&!PV.rig.glb)pvRig();   // 模型剛載好
  if(!PV.rig)return;if(PV.drag===null)PV.orbit+=dt*.35;
  const nar=w/h<.8,dd=nar?4.4:3.4;PV.cam.position.set(Math.sin(PV.orbit)*dd,1.3,Math.cos(PV.orbit)*dd);PV.cam.lookAt(0,.95,0);pvPose(PV.p,PV.rig,dt);PV.rend.render(PV.sc,PV.cam);}
