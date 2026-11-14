import asyncio,base64,sys,json
from playwright.async_api import async_playwright
IDS=sys.argv[1].split(',');ITEMS=sys.argv[2] if len(sys.argv)>2 else 'all';OUT=sys.argv[3] if len(sys.argv)>3 else 'ap'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':1100,'height':800});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2000)
    for k in range(90):
      n=await pg.evaluate("%s.filter(i=>SKINS[i]&&SKINS[i].gltf).length"%json.dumps(IDS))
      if n==len(IDS):break
      await pg.wait_for_timeout(1000)
    await pg.click('#mSkin');await pg.wait_for_timeout(500)
    for sid in IDS:
      for ang,nm in ((0,'f'),(2.4,'q'),(3.14,'b')):
        u=await pg.evaluate("""((SID,ANG,IT)=>{SKX.sel=SID;const A=accOf(SID);if(IT!=='keep')for(const k in A.items)A.items[k].on=IT==='all'?true:IT.split('+').includes(k);
          skRig();SKX.mode='stand';SKX.t=0;skFrame=window.__skf||skFrame;for(let i=0;i<30;i++){SKX.orbit=ANG;skFrame(1/60);}
          SKX.cam.position.set(Math.sin(ANG)*1.6,1.45,Math.cos(ANG)*1.6);SKX.cam.lookAt(0,1.25,0);SKX.rend.render(SKX.sc,SKX.cam);
          const s=$('skView');const c=document.createElement('canvas');c.width=s.width;c.height=s.height;c.getContext('2d').drawImage(s,0,0);return c.toDataURL('image/jpeg',.85);})('%s',%s,'%s')"""%(sid,ang,ITEMS))
        open(f'cu/{OUT}_{sid}_{nm}.jpg','wb').write(base64.b64decode(u.split(',')[1]))
    print(errs);await b.close()
asyncio.run(main())
