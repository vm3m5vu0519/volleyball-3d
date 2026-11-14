import asyncio,base64,sys
from playwright.async_api import async_playwright
OUT=sys.argv[1]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':480,'height':400});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1;Math.random=(()=>{let s=5;return()=>(s=(s*16807)%2147483647)/2147483647})()');await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    for k in range(60):
      if await pg.evaluate("Object.values(OPP_SKIN).concat(Object.values(prep.skins)).every(i=>SKINS[i]&&SKINS[i].gltf)"):break
      await pg.wait_for_timeout(1000)
    await pg.evaluate("S.gfx=1;applyGfx()");await pg.click('#mStart');await pg.click('#pGo');await pg.wait_for_timeout(300)
    for nm,off in (('top',[0,.55,.12]),('front',[.6,.05,0]),('side',[.05,.1,.55])):
      u=await pg.evaluate("""((O)=>{window.__manual=1;const p=players.find(q=>q!==server&&q.team===0);const R=rigs[players.indexOf(p)];for(let i=0;i<40;i++){p.ready=true;p.readyT=1;ALPHA=1;poseRig(p,R,1/60);}
        render(0);const a=new THREE.Vector3(),c=new THREE.Vector3();R.glb.B.LeftHand.getWorldPosition(a);R.glb.B.RightHand.getWorldPosition(c);a.add(c).multiplyScalar(.5);
        const fw=new THREE.Vector3(Math.sin(p.yaw),0,Math.cos(p.yaw)),rt=new THREE.Vector3(fw.z,0,-fw.x);
        cam.position.copy(a).addScaledVector(fw,O[0]).addScaledVector(rt,O[2]);cam.position.y+=O[1];cam.fov=30;cam.updateProjectionMatrix();cam.lookAt(a);fxRender(0);return g3.toDataURL('image/jpeg',.9);})(%s)"""%off)
      open(f'cu/{OUT}_{nm}.jpg','wb').write(base64.b64decode(u.split(',')[1]))
    print(errs);await b.close()
asyncio.run(main())
