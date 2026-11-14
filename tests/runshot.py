# 比賽中跑步側面連拍：找一個速度 > 3.5 的球員，每 3 格拍一張，共 8 張
import asyncio,base64,sys
from playwright.async_api import async_playwright
OUT=sys.argv[1] if len(sys.argv)>1 else 'rs'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':700,'height':520});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1;Math.random=(()=>{let s=11;return()=>(s=(s*16807)%2147483647)/2147483647})()');await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    for k in range(60):
      if await pg.evaluate("Object.values(OPP_SKIN).concat(Object.values(prep.skins)).every(i=>SKINS[i]&&SKINS[i].gltf)"):break
      await pg.wait_for_timeout(1000)
    await pg.evaluate("S.gfx=1;applyGfx()");await pg.click('#mStart');await pg.click('#pGo');await pg.wait_for_timeout(300)
    await pg.evaluate("window.__manual=1;human.human=false;")
    got=0;n=0
    for ch in range(400):
      r=await pg.evaluate("""(()=>{for(let i=0;i<2;i++){snap();update(1/60);}human.human=true;ALPHA=1;render(2/60);human.human=false;
        if(!window.__tgt){const c=players.filter(p=>p.y===0&&Math.hypot(p.vx,p.vz)>3.5&&state==='play')[0];if(!c)return null;window.__tgt=c;window.__ct={x:c.x,z:c.z};}
        const c=window.__tgt,d=Math.atan2(c.vx,c.vz),ct=window.__ct;ct.x=c.x;ct.z=c.z;
        cam.position.set(ct.x+Math.cos(d)*3.4,1.0,ct.z-Math.sin(d)*3.4);cam.fov=42;cam.updateProjectionMatrix();cam.lookAt(ct.x,.75,ct.z);fxRender(0);
        const cv=document.createElement('canvas');cv.width=g3.width;cv.height=g3.height;cv.getContext('2d').drawImage(g3,0,0);return [cv.toDataURL('image/jpeg',.85),Math.hypot(c.vx,c.vz).toFixed(1)];})()""")
      if r:
        open(f'{OUT}_{n}.jpg','wb').write(base64.b64decode(r[0].split(',')[1]));print(n,r[1]);n+=1
        if n>=10:break
    print(errs[:2]);await b.close()
asyncio.run(main())
