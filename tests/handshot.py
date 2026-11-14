# 接球手型特寫：非發球球員按住接球，拍正面、側面、手部上方近拍
import asyncio,base64,sys
from playwright.async_api import async_playwright
OUT=sys.argv[1] if len(sys.argv)>1 else 'hs'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':360,'height':400});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1;Math.random=(()=>{let s=5;return()=>(s=(s*16807)%2147483647)/2147483647})()');await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    for k in range(60):
      if await pg.evaluate("Object.values(OPP_SKIN).concat(Object.values(prep.skins)).every(i=>SKINS[i]&&SKINS[i].gltf)"):break
      await pg.wait_for_timeout(1000)
    await pg.evaluate("S.gfx=1;applyGfx()");await pg.click('#mStart');await pg.click('#pGo');await pg.wait_for_timeout(300)
    shots=[('f',0,3.0,.95,.7,40),('s',1.57,3.0,.95,.7,40),('h',.5,1.1,1.25,.75,40),('hs',1.57,.9,.95,.72,40)]
    for nm,ang,dist,cy,ly,fov in shots:
      u=await pg.evaluate("""((A,DI,CY,LY,FOV)=>{window.__manual=1;const p=players.find(q=>q!==server&&q.team===0);for(let i=0;i<40;i++){p.ready=true;p.readyT=1;ALPHA=1;poseRig(p,rigs[players.indexOf(p)],1/60);}
        const a=p.yaw+A;render(0);const R=rigs[players.indexOf(p)],hp=new THREE.Vector3();(R.glb?R.glb.B.LeftHand:R.arms[0].hd).getWorldPosition(hp);
        const tx=DI<2?hp.x:p.x,tz=DI<2?hp.z:p.z,ty=DI<2?hp.y:LY;cam.position.set(tx+Math.sin(a)*DI,DI<2?ty+(CY-.95):CY,tz+Math.cos(a)*DI);cam.fov=FOV;cam.updateProjectionMatrix();cam.lookAt(tx,ty,tz);fxRender(0);return g3.toDataURL('image/jpeg',.88);})(%s,%s,%s,%s,%s)"""%(ang,dist,cy,ly,fov))
      open(f'cu/{OUT}_{nm}.jpg','wb').write(base64.b64decode(u.split(',')[1]))
    print(errs);await b.close()
asyncio.run(main())
