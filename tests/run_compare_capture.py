import asyncio,base64,sys,json,os
from playwright.async_api import async_playwright
PORT,TAG,SKIN,ORB,N=sys.argv[1],sys.argv[2],sys.argv[3],float(sys.argv[4]),int(sys.argv[5])
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'fr',TAG);os.makedirs(OUT,exist_ok=True)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':1100,'height':800})
    await pg.add_init_script('window.__skinOnlyUsed=1');await pg.goto(f'http://localhost:{PORT}/test.html');await pg.wait_for_timeout(2500)
    for k in range(60):
      if await pg.evaluate("Object.values(OPP_SKIN).concat(Object.values(prep.skins)).every(i=>SKINS[i]&&SKINS[i].gltf)"):break
      await pg.wait_for_timeout(1000)
    await pg.wait_for_timeout(2500);await pg.click('#mSkin');await pg.wait_for_timeout(500)
    await pg.evaluate("window.SKF=skFrame;skFrame=function(){};");await pg.evaluate(f"SKX.sel='{SKIN}';skRig();SKX.mode='run';SKX.t=0;for(let i=0;i<90;i++){{SKX.orbit={ORB};SKF(1/60);}}")
    rec=[]
    for f in range(N):
      r=await pg.evaluate(f"""(()=>{{for(let i=0;i<2;i++){{SKX.orbit={ORB};SKF(1/60);}}const R=SKX.rig,C=R.c||{{}};const s=$('skView');const c=document.createElement('canvas');c.width=s.width;c.height=s.height;c.getContext('2d').drawImage(s,0,0);
        return [c.toDataURL('image/jpeg',.9),{{ph:R.ph,pt:C.pt,sx:C.sx,aLx:C.aLx,eL:C.eL,tL:C.tL,kL:C.kL,aRx:C.aRx,tR:C.tR,kR:C.kR}}];}})()""")
      open(f'{OUT}/{f:03d}.jpg','wb').write(base64.b64decode(r[0].split(',')[1]));rec.append(r[1])
    json.dump(rec,open(f'{OUT}/ch.json','w'));await b.close()
asyncio.run(main())
