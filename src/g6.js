
// ======================= 真人動作（影片擷取） =======================
// 片段格式：{slot, name, fps, key（擊球／起跳那一幀）, f:[[x,y,z]*17 每幀, 公釐整數，以骨盆中心為原點、人物面向 +Z、左手在 +X]}
// 17 個點：0 鼻 1 左肩 2 右肩 3 左肘 4 右肘 5 左腕 6 右腕 7 左手指 8 右手指 9 左髖 10 右髖 11 左膝 12 右膝 13 左踝 14 右踝 15 左腳尖 16 右腳尖
const MP_IDX=[0,11,12,13,14,15,16,19,20,23,24,25,26,27,28,31,32];
const MSLOT={ready:{n:'接球姿勢',d:'按住右鍵時循環播放；標「關鍵」在最穩的那一幀',key:'最穩的一幀'},
  bump:{n:'墊球',d:'從擺好姿勢到球彈出去，「關鍵」標在球碰到手臂',key:'觸球'},
  set:{n:'舉球（托球）',d:'雙手頭上托球，「關鍵」標在球碰到手指',key:'觸球'},
  jump:{n:'助跑起跳',d:'最後兩步、下蹲、離地，「關鍵」標在腳離開地面',key:'離地'},
  spike:{n:'空中扣球',d:'空中拉弓到揮臂收手，「關鍵」標在手打到球',key:'擊球'},
  block:{n:'攔網',d:'網前起跳雙手上舉，「關鍵」標在手舉最高',key:'最高點'},
  dive:{n:'飛撲救球',d:'跨步、撲出、著地，「關鍵」標在手碰到球',key:'觸球'},
  serve:{n:'發球',d:'拋球到擊球，「關鍵」標在手打到球',key:'擊球'},
  land:{n:'落地',d:'腳著地後的緩衝，「關鍵」標在腳碰到地',key:'著地'}};
const DEFAULT_MOCAP={};
let MOCAP=Object.assign({},DEFAULT_MOCAP,load('v3d-mocap',{}));
function saveMocap(){const own={};for(const k in MOCAP)if(MOCAP[k]&&!MOCAP[k].builtin)own[k]=MOCAP[k];store('v3d-mocap',own);}
// MediaPipe 世界座標（x 右、y 下、z 遠離鏡頭）→ 人物座標，並以起點那一幀的身體方向當正面、腿長縮放成遊戲人物
function buildClip(world,a,k,b,fps,slot,mirror){
  const fr=[];for(let i=a;i<=b;i++)if(world[i])fr.push(world[i]);else if(fr.length)fr.push(fr[fr.length-1]);
  if(fr.length<2)return null;
  const V=p=>new TH.Vector3(p[0],-p[1],-p[2]);
  const ref=fr[0],lat=V(ref[23]).sub(V(ref[24]));lat.y=0;lat.normalize();const up=new TH.Vector3(0,1,0),fw=new TH.Vector3().crossVectors(lat,up).normalize();
  const m=new TH.Matrix4().makeBasis(lat,up,fw).invert();
  let leg=0,n=0;fr.forEach(f=>{const L=V(f[23]).distanceTo(V(f[25]))+V(f[25]).distanceTo(V(f[27])),R=V(f[24]).distanceTo(V(f[26]))+V(f[26]).distanceTo(V(f[28]));leg+=L+R;n+=2;});
  const sc=(L1+L2)/Math.max(.2,leg/n);
  const out=fr.map(f=>{const hm=V(f[23]).add(V(f[24])).multiplyScalar(.5);let pts=MP_IDX.map(i=>V(f[i]).sub(hm).applyMatrix4(m).multiplyScalar(sc));
    if(mirror){pts=pts.map(p=>new TH.Vector3(-p.x,p.y,p.z));const sw=[0,2,1,4,3,6,5,8,7,10,9,12,11,14,13,16,15];pts=sw.map(i=>pts[i]);}
    return pts;});
  // 輕微平滑（前後各一幀），去掉影片抖動
  const sm=out.map((pts,i)=>pts.map((p,j)=>{const A_=out[Math.max(0,i-1)][j],C_=out[Math.min(out.length-1,i+1)][j];return[(A_.x+2*p.x+C_.x)/4,(A_.y+2*p.y+C_.y)/4,(A_.z+2*p.z+C_.z)/4].map(v=>Math.round(v*1000));}));
  return{slot,name:MSLOT[slot].n,fps,key:clamp(k-a,0,sm.length-1),f:sm,created:Date.now()};}
// 取片段在 t 秒的 17 個點（人物座標，骨盆中心為原點），寫進 out
const _mp=Array.from({length:17},()=>new TH.Vector3());
function sampleClip(c,t,out=_mp){const x=clamp(t*c.fps,0,c.f.length-1),i=Math.floor(x),j=Math.min(c.f.length-1,i+1),u=x-i,A_=c.f[i],B_=c.f[j];
  for(let k=0;k<17;k++)out[k].set((A_[k][0]+(B_[k][0]-A_[k][0])*u)/1000,(A_[k][1]+(B_[k][1]-A_[k][1])*u)/1000,(A_[k][2]+(B_[k][2]-A_[k][2])*u)/1000);return out;}
const clipDur=c=>(c.f.length-1)/c.fps,clipKey=c=>c.key/c.fps;
// 動作播放：每個球員同時只播一段；淡入 0.08 秒、結尾淡出 0.12 秒；hold＝停在某個時間點（拉弓、攔網）
function playAct(p,slot,from,opt={}){const c=MOCAP[slot];if(!c||!p)return;const t=clamp(from==null?0:from,0,clipDur(c));
  p.act={slot,t,rate:opt.rate||1,hold:opt.hold??null,loop:!!opt.loop,w:p.act&&p.act.slot!==slot?(p.act.w||0)*.5:(p.act?p.act.w:0),until:opt.until??null};}
const actKey=(p,slot,lead)=>{const c=MOCAP[slot];if(c)playAct(p,slot,clipKey(c)-lead);};
function stopAct(p){if(p.act)p.act.stop=true;}
function tickAct(p,dt){const a=p.act;if(!a)return 0;const c=MOCAP[a.slot];if(!c){p.act=null;return 0;}
  const D=clipDur(c);
  if(a.hold!=null)a.t+=(a.hold-a.t)*Math.min(1,dt*14);else{a.t+=dt*a.rate;if(a.loop&&a.t>D)a.t=a.t%D;}
  const ending=a.stop||(!a.loop&&a.hold==null&&a.t>D-.12)||(a.until!=null&&a.until());
  a.w=ending?a.w-dt/.12:Math.min(1,a.w+dt/.08);
  if(a.w<=0&&ending){p.act=null;return 0;}return clamp(a.w,0,1);}
// 把片段的點放到世界座標：腳在地上時骨盆高度用最低的腳決定，空中用遊戲的跳躍高度
const _mw=Array.from({length:17},()=>new TH.Vector3());
function clipWorld(R,p,pts){const air=p.y>0;let lo=0;if(!air){lo=Infinity;for(const k of [13,14,15,16])lo=Math.min(lo,pts[k].y);}
  const hy=air?HIPY:Math.max(.35,-lo+.06);for(let k=0;k<17;k++)_mw[k].set(pts[k].x,pts[k].y+hy,pts[k].z).applyMatrix4(R.g.matrixWorld);return _mw;}
// 在 retarget 之前用：把骨架算出的關節點往片段的點混過去
function blendMocap(R,P,p,w){const pts=sampleClip(MOCAP[p.act.slot],p.act.t),W=clipWorld(R,p,pts);
  const map={Ls:1,Rs:2,Le:3,Re:4,Lw:5,Rw:6,Lt:7,Rt:8,Lh:9,Rh:10,Lk:11,Rk:12,La:13,Ra:14,Lo:15,Ro:16};
  for(const k in map)P[k].lerp(W[map[k]],w);
  const hm=RT.mid.addVectors(W[9],W[10]).multiplyScalar(.5),sm=RT.w.addVectors(W[1],W[2]).multiplyScalar(.5);
  P.hips.lerp(hm,w);P.neck.lerp(RT.x.copy(sm).lerp(hm,-.08),w);P.spine.lerp(RT.y.copy(hm).lerp(sm,.08),w);
  P.hipX.lerp(RT.z.subVectors(W[9],W[10]).normalize(),w).normalize();P.chestX.subVectors(P.Ls,P.Rs);}
