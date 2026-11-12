
// ---------------- VRM 附加功能：搖擺骨（頭髮、尾巴）與節點約束（輔助骨、機械手臂） ----------------
// 沒有這些，VRM 角色的頭髮會僵住、有些配件會停在 T 字姿勢。演算法照 VRM 規格（VRMC_springBone、VRMC_node_constraint、VRM0 secondaryAnimation）。
function tagNodes(g){const as=g.parser&&g.parser.associations;if(!as)return;g.scene.traverse(o=>{const a=as.get(o);if(a&&a.type==='nodes'&&a.index!=null)o.userData.ni=a.index;});}
const VX={v1:new TH.Vector3(),v2:new TH.Vector3(),v3:new TH.Vector3(),q1:new TH.Quaternion(),q2:new TH.Quaternion(),q3:new TH.Quaternion(),I:new TH.Quaternion()};
const AXIS={PositiveX:[1,0,0],NegativeX:[-1,0,0],PositiveY:[0,1,0],NegativeY:[0,-1,0],PositiveZ:[0,0,1],NegativeZ:[0,0,-1],X:[1,0,0],Y:[0,1,0],Z:[0,0,1]};
function vrmSetup(R,m,src){
  const j=src&&src.parser&&src.parser.json;if(!j)return null;const N={};m.traverse(o=>{if(o.userData.ni!=null&&!N[o.userData.ni])N[o.userData.ni]=o;});
  const ex=j.extensions||{},out={springs:[],cons:[]};
  // 約束
  (j.nodes||[]).forEach((nd,i)=>{const c=nd.extensions&&nd.extensions.VRMC_node_constraint&&nd.extensions.VRMC_node_constraint.constraint;if(!c||!N[i])return;
    const k=c.rotation?'rotation':c.roll?'roll':c.aim?'aim':null;if(!k)return;const d=c[k],s=N[d.source];if(!s)return;
    out.cons.push({k,dst:N[i],src:s,w:d.weight??1,dr:N[i].quaternion.clone(),sr:s.quaternion.clone(),ax:new TH.Vector3(...(AXIS[d.rollAxis||d.aimAxis]||[1,0,0]))});});
  // 搖擺骨
  const addChain=(bones,p)=>{for(let i=0;i<bones.length;i++){const b=bones[i];if(!b)continue;let tail=bones[i+1]||b.children.find(c=>c.isBone)||null;
      if(!tail&&i<bones.length-1)continue;out.springs.push({b,tail,st:p.st,gp:p.gp,gd:new TH.Vector3(...p.gd),dr:p.dr,r0:b.quaternion.clone(),ax:null,len:0,cur:null,prev:null});}};
  const sb=ex.VRMC_springBone;
  if(sb&&sb.springs)sb.springs.forEach(s=>{const js=s.joints||[];const bones=js.map(x=>N[x.node]);
    for(let i=0;i<js.length-1;i++){const x=js[i],b=N[x.node],t=N[js[i+1].node];if(!b||!t)continue;
      out.springs.push({b,tail:t,st:x.stiffness??1,gp:x.gravityPower??0,gd:new TH.Vector3(...(x.gravityDir||[0,-1,0])),dr:x.dragForce??.5,r0:b.quaternion.clone(),ax:null,len:0,cur:null,prev:null});}});
  const sa=ex.VRM&&ex.VRM.secondaryAnimation;
  if(sa&&sa.boneGroups)sa.boneGroups.forEach(g=>{const gd=g.gravityDir||{x:0,y:-1,z:0},p={st:g.stiffiness??g.stiffness??1,gp:g.gravityPower??0,gd:[gd.x,gd.y,gd.z],dr:g.dragForce??.4};
    (g.bones||[]).forEach(ri=>{const root=N[ri];if(!root)return;root.traverse(b=>{if(!b.isBone)return;const t=b.children.find(c=>c.isBone)||null;
      out.springs.push({b,tail:t,virt:!t,st:p.st,gp:p.gp,gd:new TH.Vector3(...p.gd),dr:p.dr,r0:b.quaternion.clone(),ax:null,len:0,cur:null,prev:null});});});});
  return(out.springs.length||out.cons.length)?out:null;}
function applyCons(V){for(const c of V.cons){const d=c.dst;
  if(c.k==='rotation'){VX.q1.copy(c.sr).invert().multiply(c.src.quaternion);VX.q2.copy(VX.I).slerp(VX.q1,c.w);d.quaternion.copy(c.dr).multiply(VX.q2);}
  else if(c.k==='roll'){VX.q1.copy(c.sr).invert().multiply(c.src.quaternion);VX.q1.premultiply(c.sr).multiply(VX.q3.copy(c.sr).invert());VX.q1.premultiply(VX.q3.copy(c.dr).invert()).multiply(c.dr);
    VX.v1.copy(c.ax).applyQuaternion(VX.q1);VX.q2.setFromUnitVectors(c.ax,VX.v1).invert().multiply(VX.q1);VX.q3.copy(VX.I).slerp(VX.q2,c.w);d.quaternion.copy(c.dr).multiply(VX.q3);}
  else{d.parent.updateMatrixWorld(true);d.parent.getWorldQuaternion(VX.q1);VX.q2.copy(VX.q1).multiply(c.dr);VX.v1.copy(c.ax).applyQuaternion(VX.q2);
    d.getWorldPosition(VX.v2);c.src.getWorldPosition(VX.v3);VX.v3.sub(VX.v2);if(VX.v3.lengthSq()<1e-8)continue;VX.v3.normalize();VX.q3.setFromUnitVectors(VX.v1,VX.v3).multiply(VX.q2);
    VX.q3.premultiply(VX.q1.invert());d.quaternion.copy(c.dr).slerp(VX.q3,c.w);}
  d.updateMatrixWorld(true);}}
function applySprings(V,dt){dt=Math.min(dt,1/30);if(dt<=0)return;
  for(const s of V.springs){const b=b0(s);b.parent.updateMatrixWorld(true);
    if(!s.ax){if(s.tail){s.ax=s.tail.position.clone();}else{s.ax=b.position.clone().normalize().multiplyScalar(.07);} s.lenL=s.ax.length()||.01;s.ax.normalize();}
    b.getWorldPosition(VX.v1);b.parent.getWorldQuaternion(VX.q1);VX.q2.copy(VX.q1).multiply(s.r0);
    const ws=b.parent.getWorldScale(VX.v3).x,len=s.lenL*ws;
    if(!s.cur||s.cur.distanceTo(VX.v1)>len*4+1){s.cur=VX.v2.copy(s.ax).applyQuaternion(VX.q2).multiplyScalar(len).add(VX.v1).clone();s.prev=s.cur.clone();}
    const inert=VX.v2.copy(s.cur).sub(s.prev).multiplyScalar(1-Math.max(.35,s.dr));if(inert.length()>len*.35)inert.setLength(len*.35);const _i=inert.clone();
    const stiff=VX.v3.copy(s.ax).applyQuaternion(VX.q2).multiplyScalar(Math.max(1.2,s.st)*1.6*dt);
    const next=s.cur.clone().add(_i).add(stiff).addScaledVector(s.gd,s.gp*dt);
    // 限制最多偏離原本方向 35 度，頭髮不會被甩成水平
    next.sub(VX.v1).normalize();const rd=VX.v3.copy(s.ax).applyQuaternion(VX.q2);const ang=next.angleTo(rd);if(ang>.6){const k=.6/ang;next.lerp(rd,1-k).normalize();}
    next.multiplyScalar(len).add(VX.v1);s.prev.copy(s.cur);s.cur.copy(next);
    const from=VX.v2.copy(s.ax).applyQuaternion(VX.q2),to=VX.v3.copy(next).sub(VX.v1).normalize();
    VX.q3.setFromUnitVectors(from,to).multiply(VX.q2);b.quaternion.copy(VX.q1.invert().multiply(VX.q3));b.updateMatrixWorld(true);}}
function b0(s){return s.b;}
function vrmPost(R,dt){const V=R.glb&&R.glb.vx;if(!V)return;if(V.cons.length)applyCons(V);if(V.springs.length)applySprings(V,dt);}
