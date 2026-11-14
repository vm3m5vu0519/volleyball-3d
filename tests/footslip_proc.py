# 腳滑量測：AI 對打中，腳掌貼地（離地<3cm）時每格水平位移，依移動速度分組
import asyncio,json,sys
from playwright.async_api import async_playwright
SECS=int(sys.argv[1]) if len(sys.argv)>1 else 40
JS=r"""(N)=>{const V=new THREE.Vector3();const st=window.__FS||(window.__FS={});if(window.__FT===undefined){const hs=[];players.forEach((p,i)=>{const R=rigs[i];if(R&&R.glb){const b=R.glb.B.LeftToeBase||R.glb.B.LeftFoot;b.getWorldPosition(V);hs.push(V.y);}});window.__FT=Math.max(...hs)+.03;st.FT={n:1,sum:window.__FT,big:0};}
 for(let f=0;f<N;f++){if(hitstop>0){hitstop-=1/60;}else{snap();update(1/60);}
  players.forEach((p,i)=>{const R=rigs[i];if(!R||!R.glb)return;poseRig(p,R,1/60);const B=R.glb.B;R.fp=R.fp||{};
   const sp=Math.hypot(p.vx,p.vz),cls=p.y>0?'air':p.dive>0||p.rec>0?'dive':sp<.12?'idle':sp<2?'slow':'run';
   const P=[];for(const s of ['Left','Right']){const b=R.legs[s==='Left'?0:1].ft;b.getWorldPosition(V);P.push({s,x:V.x,y:V.y,z:V.z});}
   const lo=P[0].y<P[1].y?P[0]:P[1],pr=R.fp.lo;
   if(pr&&pr.s===lo.s&&lo.y<FOOT+.012&&pr.y<FOOT+.012&&cls!=='air'&&cls!=='dive'){const d=Math.hypot(lo.x-pr.x,lo.z-pr.z);const o=st[cls]||(st[cls]={n:0,sum:0,big:0});o.n++;o.sum+=d;if(d>.01)o.big++;}
   R.fp.lo=lo;if(cls==='idle')window.__G=Math.min(window.__G??9,lo.y);});}
 return st;}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader'])
    pg=await b.new_page(viewport={'width':400,'height':300});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1;Math.random=(()=>{let s=7;return()=>(s=(s*16807)%2147483647)/2147483647})()');await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    for k in range(60):
      if await pg.evaluate("Object.values(OPP_SKIN).concat(Object.values(prep.skins)).every(i=>SKINS[i]&&SKINS[i].gltf)"):break
      await pg.wait_for_timeout(1000)
    await pg.click('#mStart');await pg.click('#pGo');await pg.wait_for_timeout(1500)
    await pg.evaluate("window.__manual=1;human.human=false;")
    for c in range(SECS*60//120): st=await pg.evaluate("(%s)(120)"%JS)
    for k,o in st.items(): print(k,'n',o['n'],'avg mm/frame %.2f'%(o['sum']/o['n']*1000),'>1cm %.1f%%'%(o['big']/o['n']*100))
    print('errs',errs);await b.close()
asyncio.run(main())
