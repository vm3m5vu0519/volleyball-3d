# 跑步側面動畫（給比對頁）：找速度 > 3.5 的球員，攝影機在側面跟著，每 2 格拍一張
import asyncio,base64,sys,io
from playwright.async_api import async_playwright
from PIL import Image
OUT=sys.argv[1];SEED=int(sys.argv[2]) if len(sys.argv)>2 else 11;N=int(sys.argv[3]) if len(sys.argv)>3 else 80
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':560,'height':420});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1;Math.random=(()=>{let s=%d;return()=>(s=(s*16807)%%2147483647)/2147483647})()'%SEED);await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    for k in range(60):
      if await pg.evaluate("Object.values(OPP_SKIN).concat(Object.values(prep.skins)).every(i=>SKINS[i]&&SKINS[i].gltf)"):break
      await pg.wait_for_timeout(1000)
    await pg.evaluate("S.gfx=1;applyGfx()");await pg.click('#mStart');await pg.click('#pGo');await pg.wait_for_timeout(300)
    await pg.evaluate("window.__manual=1;human.human=false;")
    frames=[]
    for ch in range(2000):
      r=await pg.evaluate("""(()=>{for(let i=0;i<2;i++){snap();update(1/60);}human.human=true;ALPHA=1;render(2/60);human.human=false;
        if(!window.__tgt){const c=players.filter(p=>p.y===0&&Math.hypot(p.vx,p.vz)>3.5&&state==='play'&&Math.abs(p.x)>2)[0];if(!c)return null;window.__tgt=c;
          const d=Math.atan2(c.vx,c.vz);window.__cd={x:Math.cos(d),z:-Math.sin(d)};window.__ct={x:c.x,z:c.z};}
        const c=window.__tgt,ct=window.__ct,cd=window.__cd;ct.x+=(c.x-ct.x)*.25;ct.z+=(c.z-ct.z)*.25;
        cam.position.set(ct.x+cd.x*4.2,1.15,ct.z+cd.z*4.2);cam.fov=40;cam.updateProjectionMatrix();cam.lookAt(ct.x,.8,ct.z);fxRender(0);
        return g3.toDataURL('image/jpeg',.8);})()""")
      if r:
        frames.append(Image.open(io.BytesIO(base64.b64decode(r.split(',')[1]))).convert('RGB'))
        if len(frames)>=N:break
    frames=[f.resize((f.width*2//3,f.height*2//3)) for f in frames]
    frames[0].save(OUT,save_all=True,append_images=frames[1:],duration=33,loop=0,optimize=True)
    print(OUT,len(frames),errs[:2]);await b.close()
asyncio.run(main())
