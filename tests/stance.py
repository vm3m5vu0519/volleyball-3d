import asyncio,base64
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':900,'height':500});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1');await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    for k in range(60):
      if await pg.evaluate("Object.values(OPP_SKIN).concat(Object.values(prep.skins)).every(i=>SKINS[i]&&SKINS[i].gltf)"):break
      await pg.wait_for_timeout(1000)
    await pg.evaluate("S.gfx=1;applyGfx()");await pg.click('#mStart');await pg.click('#pGo');await pg.wait_for_timeout(300)
    await pg.evaluate("window.__manual=1;human.human=false;")
    n=0
    for ch in range(80):
      r=await pg.evaluate("""(()=>{for(let i=0;i<10;i++){snap();update(1/60);}human.human=true;ALPHA=1;render(10/60);human.human=false;
        const c=players.filter(p=>p.y===0&&Math.hypot(p.vx,p.vz)<.3&&state==='play'&&!p.ready&&p.swing<=0)[0];if(!c)return null;
        for(let i=0;i<3;i++){human.human=true;render(1/60);human.human=false;}
        const s=Math.sign(c.x)||1;cam.position.set(c.x-s*.4,1.15,c.z+3.0);cam.fov=45;cam.updateProjectionMatrix();cam.lookAt(c.x,.8,c.z);fxRender(0);
        const cv=document.createElement('canvas');cv.width=g3.width;cv.height=g3.height;cv.getContext('2d').drawImage(g3,0,0);return cv.toDataURL('image/jpeg',.88);})()""")
      if r:
        open(f'st_{n}.jpg','wb').write(base64.b64decode(r.split(',')[1]));n+=1
        if n>=3:break
    print(n,errs[:2]);await b.close()
asyncio.run(main())
