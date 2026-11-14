import asyncio,base64
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':360,'height':440});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1;Math.random=(()=>{let s=5;return()=>(s=(s*16807)%2147483647)/2147483647})()');await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    for k in range(60):
      if await pg.evaluate("Object.values(OPP_SKIN).concat(Object.values(prep.skins)).every(i=>SKINS[i]&&SKINS[i].gltf)"):break
      await pg.wait_for_timeout(1000)
    await pg.evaluate("S.gfx=1;applyGfx()");await pg.click('#mStart');await pg.click('#pGo');await pg.wait_for_timeout(300)
    for ang,nm in ((0,'f'),(1.57,'s')):
      u=await pg.evaluate("""((ANG)=>{window.__manual=1;const p=players.find(q=>q!==server&&q.team===0);for(let i=0;i<40;i++){p.ready=true;p.readyT=1;ALPHA=1;const j=players.indexOf(p);poseRig(p,rigs[j],1/60);}
        const a=p.yaw+ANG;render(0);cam.position.set(p.x+Math.sin(a)*3.0,.95,p.z+Math.cos(a)*3.0);cam.fov=40;cam.updateProjectionMatrix();cam.lookAt(p.x,.7,p.z);fxRender(0);return g3.toDataURL('image/jpeg',.85);})(%s)"""%ang)
      open(f'cu/rdy_{nm}.jpg','wb').write(base64.b64decode(u.split(',')[1]))
    print(errs);await b.close()
asyncio.run(main())
