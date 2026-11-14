# 站姿、滑步側面＋正面對照：每 K 格挑一個站地上的球員，拍正面和側面
import asyncio,base64,sys
from playwright.async_api import async_playwright
OUT=sys.argv[1];N=int(sys.argv[2]);K=int(sys.argv[3]);SEED=int(sys.argv[4]) if len(sys.argv)>4 else 5
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':360,'height':440});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1;Math.random=(()=>{let s=SEED;return()=>(s=(s*16807)%2147483647)/2147483647})()'.replace('SEED',str(SEED)));await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    for k in range(60):
      if await pg.evaluate("Object.values(OPP_SKIN).concat(Object.values(prep.skins)).every(i=>SKINS[i]&&SKINS[i].gltf)"):break
      await pg.wait_for_timeout(1000)
    await pg.evaluate("S.gfx=1;applyGfx()");await pg.click('#mStart');await pg.click('#pGo');await pg.wait_for_timeout(300)
    await pg.evaluate("window.__manual=1;human.human=false;window.__ci=0;")
    tags=[]
    for n in range(N):
      for v,ang in (('f',0),('s',1.57),('b',3.14)):
        u=await pg.evaluate("""((K,ANG)=>{if(K)for(let i=0;i<K;i++){if(hitstop>0)hitstop-=1/60;else{snap();update(1/60);}ALPHA=1;players.forEach((p,j)=>{if(rigs[j])poseRig(p,rigs[j],1/60);});}
          if(K)window.__cj=players.map((p,j)=>j).filter(j=>players[j].y<.05&&players[j].team===0)[(window.__ci++)%4];const j=window.__cj,p=players[j];
          const sp=Math.hypot(p.vx,p.vz),tag=(p.ready?'ready':p.swing>0?p.pose:sp>2?'run':sp>.12?'move':'idle')+' v'+sp.toFixed(1)+' '+state;
          const a=p.yaw+ANG;render(0);cam.position.set(p.x+Math.sin(a)*3.0,.95,p.z+Math.cos(a)*3.0);cam.fov=40;cam.updateProjectionMatrix();cam.lookAt(p.x,.75,p.z);fxRender(0);
          return [g3.toDataURL('image/jpeg',.85),tag];})(KK,AA)""".replace('KK',str(K if v=='f' else 0)).replace('AA',str(ang)))
        open(f'{OUT}_{n}{v}.jpg','wb').write(base64.b64decode(u[0].split(',')[1]))
      tags.append(u[1])
    print(tags);print(errs[:3]);await b.close()
asyncio.run(main())
