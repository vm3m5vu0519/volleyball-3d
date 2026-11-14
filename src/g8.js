
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
function openSkin(){show('vSkin');skInit3D();skRender();if(!SKX.sel){const k=Object.keys(SKINS).find(k=>SKINS[k].gltf);SKX.sel=k||null;}skRig();}
function skMsg(t,bad){const m=$('skMsg');m.textContent=t;m.style.color=bad?'#ff8a7a':'';}
function skRender(){
  const L=$('skList');L.innerHTML='';const ids=Object.keys(SKINS);
  if(!ids.length)L.innerHTML='<p class="sub">還沒有角色。先上傳一個 VRM 或 GLB 檔。</p>';
  ids.forEach(id=>{const s=SKINS[id],row=document.createElement('div');row.className='skRow'+(SKX.sel===id?' on':'');
    const ok=!!s.gltf,info=ok?(s.credit||`${(s.size/1048576).toFixed(1)} MB${s.vrm?'・VRM':''}`):`不能用：找不到 ${s.miss.map(n=>BONE_ZH[n]||n).slice(0,4).join('、')}${s.miss.length>4?'…':''}`;
    row.innerHTML=`<button class="skName" ${ok?'':'disabled'}><b></b><small></small></button>${s.builtin?'<span class="sub" style="align-self:center;font-size:12px">內建</span>':'<button class="tb skDel">刪除</button>'}`;
    row.querySelector('b').textContent=s.name;row.querySelector('small').textContent=info;if(!ok)row.querySelector('small').style.color='#ff8a7a';
    row.querySelector('.skName').onclick=()=>{SKX.sel=id;skRender();skRig();};
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
  p.oy=p.y;p.tread=1;const st=state;state='menu';try{poseRig(p,SKX.rig,dt);}catch(e){}state=st;p.vz=0;if(p.loadT>0)p.loadT=0;
  SKX.rend.render(SKX.sc,SKX.cam);}
$('mSkin').onclick=openSkin;
loadSkins();
