import asyncio,base64,sys,json
from playwright.async_api import async_playwright
KINDS=sys.argv[1].split(',')
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':960,'height':540});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1');await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    for k in range(60):
      if await pg.evaluate("['b-shino','b-girl','b-hair','b-vivi','b-shibu','b-twist','b-fumi','b-vic'].every(i=>SKINS[i]&&SKINS[i].gltf)"):break
      await pg.wait_for_timeout(1000)
    await pg.evaluate("S.gfx=1;applyGfx();window.GAMECAM=%s"%("1" if "cam" in sys.argv else "0"));await pg.click('#mStart');await pg.click('#pGo');await pg.wait_for_timeout(300)
    await pg.evaluate("""window.__manual=1;human.human=false;window.EV=null;
      const _h=hitFx;hitFx=function(p,act,q,k,v,w){if(!EV&&WANT.includes(act==='pass'?'pass':act)&&(window.GAMECAM?p===human:true))EV={k:act==='pass'?'pass':act,x:ball.x,y:ball.y,z:ball.z};return _h.apply(this,arguments);};
      const _l=landFx;landFx=function(x,z,v,h){if(!EV&&h&&WANT.includes('land'))EV={k:'land',x,y:.3,z};return _l.apply(this,arguments);};
      const _b=blockFx;blockFx=function(x,y,z,k){if(!EV&&WANT.includes('block'))EV={k:'block',x,y,z};return _b.apply(this,arguments);};
      window.SHOT=(o)=>{human.human=true;ALPHA=1;render(1/60);const e=EV;const d=4.2;if(!window.GAMECAM){cam.position.set(e.x+d*.7,Math.max(1.2,e.y+.6),e.z+d*.7*(e.z>0?-1:1));cam.fov=55;cam.updateProjectionMatrix();cam.lookAt(e.x,e.y,e.z);fxRender(0);}human.human=false;
        const c=document.createElement('canvas');c.width=g3.width;c.height=g3.height;const g=c.getContext('2d');g.drawImage(g3,0,0);g.drawImage(hudC,0,0,c.width,c.height);return c.toDataURL("image/jpeg",.85);};0;""")
    for kind in KINDS:
      await pg.evaluate(f"window.WANT=['{kind}'];EV=null;")
      ok=False
      for ch in range(120):
        r=await pg.evaluate("(()=>{for(let i=0;i<20;i++){if(hitstop>0){hitstop-=1/60;continue;}snap();update(1/60);if(EV)return 1;}human.human=true;ALPHA=1;render(20/60);human.human=false;return 0;})()")
        if r:ok=True;break
      if not ok:print('no',kind);continue
      for n,adv in enumerate([1,2,4,8]):
        await pg.evaluate(f"(()=>{{for(let i=0;i<{adv if n==0 else (1 if n==1 else 2 if n==2 else 4)};i++){{if(hitstop>0){{hitstop-=1/60;}}else{{snap();update(1/60);}}human.human=true;ALPHA=1;render(1/60);human.human=false;}}}})()")
        u=await pg.evaluate("SHOT()");open(f'fh{"g" if "cam" in sys.argv else ""}_{kind}_{n}.jpg','wb').write(base64.b64decode(u.split(',')[1]))
      print('ok',kind)
    print('errs',errs[:3]);await b.close()
asyncio.run(main())
