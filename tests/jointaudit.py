# 關節稽核：AI 對打中每一格量每個人的關節角度，找出超出人體範圍或突然跳動的情況
import asyncio,json,sys
from playwright.async_api import async_playwright
SECS=int(sys.argv[1]) if len(sys.argv)>1 else 60
JS=r"""(N)=>{const LIM={eL:[-2.5,.02],eR:[-2.5,.02],kL:[-.02,2.5],kR:[-.02,2.5],aLx:[-3.15,1.0],aRx:[-3.15,1.0],tL:[-2.2,.75],tR:[-2.2,.75],sx:[-.5,1.0],aLz:[-1.2,.7],aRz:[-.7,1.2]};
 const st=window.__JA||(window.__JA={n:0,over:{},maxV:{},ex:{},poseOver:{}});const V=new THREE.Vector3(),W=new THREE.Vector3(),X=new THREE.Vector3();
 for(let f=0;f<N;f++){if(hitstop>0){hitstop-=1/60;}else{snap();update(1/60);}
  players.forEach((p,i)=>{const R=rigs[i];if(!R)return;poseRig(p,R,1/60);const C=R.c;st.n++;
   const pose=(p.swing>0?p.pose:'')||(p.ready?'ready':'')||(p.y>0?'air':'')||(p.dive>0?'dive':'')||(Math.hypot(p.vx,p.vz)>2?'run':'idle');
   for(const k in LIM){const v=C[k];if(v===undefined)continue;const [a,b]=LIM[k];if(v<a||v>b){const key=k+(v<a?'<':'>');st.over[key]=(st.over[key]||0)+1;st.poseOver[pose+':'+key]=(st.poseOver[pose+':'+key]||0)+1;
     const ex=st.ex[key];const m=v<a?a-v:v-b;if(!ex||m>ex.m)st.ex[key]={m:+m.toFixed(2),v:+v.toFixed(2),pose,y:+p.y.toFixed(2)};}}
   const PV=R.pv||(R.pv={});for(const k in LIM){if(PV[k]!==undefined){const d=Math.abs(C[k]-PV[k]);if(d>.2){const key=(R.lastPose||'?')+'>'+pose+':'+k;st.pops=st.pops||{};st.pops[key]=(st.pops[key]||0)+1;}if(!st.maxV[k]||d>st.maxV[k].d)st.maxV[k]={d:+d.toFixed(2),pose,prev:R.lastPose};}PV[k]=C[k];}R.lastPose=pose;const Hh=R.hh||(R.hh=[]);Hh.push([+R.tp.aRx.toFixed(3),+C.aRx.toFixed(3),+(R.o.aRx||0).toFixed(3),+(R.ov.aRx||0).toFixed(2),pose,+Math.hypot(p.vx,p.vz).toFixed(2),p.dive>0?1:0,p.landT>0?1:0,p.loadT>0?1:0]);if(Hh.length>8)Hh.shift();if(!st.trace&&R.pv&&pose==='run'&&Hh.length>=8&&Math.abs(Hh[7][1]-Hh[6][1])>.25)st.trace=Hh.slice();
   // 模型實際的手肘：前臂往哪邊彎（跟手肘轉軸同向＝正常；反向＝反關節）
   if(R.glb){const B=R.glb.B;for(const s of ['Left','Right']){if(!B[s+'Arm']||!B[s+'Hand'])continue;B[s+'Arm'].getWorldPosition(V);B[s+'ForeArm'].getWorldPosition(W);B[s+'Hand'].getWorldPosition(X);
     const u=W.clone().sub(V).normalize(),fo=X.clone().sub(W).normalize(),ang=Math.acos(Math.max(-1,Math.min(1,u.dot(fo))));
     if(ang>2.5){st.over['glbElbowFold']=(st.over['glbElbowFold']||0)+1;}
     // 手臂穿進身體：手腕離脊椎軸太近
     const hips=B.Hips.getWorldPosition(new THREE.Vector3()),nk=(B.Neck||B.Head).getWorldPosition(new THREE.Vector3()),ax=nk.clone().sub(hips),t=Math.max(0,Math.min(1,X.clone().sub(hips).dot(ax)/ax.lengthSq())),cl=hips.clone().addScaledVector(ax,t),dist=X.distanceTo(cl);
     if(dist<.12&&t>.15&&t<.95){st.over['handInTorso']=(st.over['handInTorso']||0)+1;st.poseOver[pose+':handInTorso']=(st.poseOver[pose+':handInTorso']||0)+1;}}}
  });}
 return st;}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader'])
    pg=await b.new_page(viewport={'width':400,'height':300});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1');await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    for k in range(60):
      if await pg.evaluate("Object.values(OPP_SKIN).concat(Object.values(prep.skins)).every(i=>SKINS[i]&&SKINS[i].gltf)"):break
      await pg.wait_for_timeout(1000)
    await pg.click('#mStart');await pg.click('#pGo');await pg.wait_for_timeout(1500)
    await pg.evaluate("window.__manual=1;human.human=false;")
    st=None
    for c in range(SECS*60//120):
      st=await pg.evaluate("(%s)(120)"%JS)
    print('frames',st['n']);print('OVER',json.dumps(st['over'],ensure_ascii=False))
    print('EXTREME',json.dumps(st['ex'],ensure_ascii=False))
    print('BYPOSE',json.dumps(dict(sorted(st['poseOver'].items(),key=lambda x:-x[1])[:20]),ensure_ascii=False))
    print('TRACE',json.dumps(st.get('trace')));print('POPS',json.dumps(dict(sorted((st.get('pops') or {}).items(),key=lambda x:-x[1])[:15])));print('MAXSTEP',json.dumps(st['maxV'],ensure_ascii=False))
    print('errs',errs);await b.close()
asyncio.run(main())
