# 用遊戲本身的鏡頭截圖：AI 代打，每 STEP 格截一張
import asyncio,base64,sys
from playwright.async_api import async_playwright
OUT=sys.argv[1];N=int(sys.argv[2]);STEP=int(sys.argv[3]);SEED=int(sys.argv[4]) if len(sys.argv)>4 else 5
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':960,'height':540});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1;Math.random=(()=>{let s=%d;return()=>(s=(s*16807)%%2147483647)/2147483647})()'%SEED);await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    for k in range(60):
      if await pg.evaluate("Object.values(OPP_SKIN).concat(Object.values(prep.skins)).every(i=>SKINS[i]&&SKINS[i].gltf)"):break
      await pg.wait_for_timeout(1000)
    await pg.evaluate("S.gfx=1;applyGfx()");await pg.click('#mStart');await pg.click('#pGo');await pg.wait_for_timeout(300)
    await pg.evaluate("window.__manual=1;human.human=false;")
    for n in range(N):
      u=await pg.evaluate("""((K)=>{for(let i=0;i<K;i++){if(hitstop>0)hitstop-=1/60;else{snap();update(1/60);}ALPHA=1;players.forEach((p,j)=>{if(rigs[j])poseRig(p,rigs[j],1/60);});}ALPHA=1;
        human.human=true;render(1/60);drawHUD();human.human=false;const c=document.createElement('canvas');c.width=g3.width;c.height=g3.height;const cx=c.getContext('2d');cx.drawImage(g3,0,0);cx.drawImage(hudC,0,0,c.width,c.height);return [c.toDataURL('image/jpeg',.85),state];})(%d)"""%STEP)
      open(f'{OUT}_{n}.jpg','wb').write(base64.b64decode(u[0].split(',')[1]))
    print(errs[:3]);await b.close()
asyncio.run(main())
