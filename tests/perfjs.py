import asyncio,json
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader'])
    pg=await b.new_page(viewport={'width':400,'height':300})
    await pg.add_init_script('window.__skinOnlyUsed=1');await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    for k in range(60):
      if await pg.evaluate("Object.values(OPP_SKIN).concat(Object.values(prep.skins)).every(i=>SKINS[i]&&SKINS[i].gltf)"):break
      await pg.wait_for_timeout(1000)
    await pg.click('#mStart');await pg.click('#pGo');await pg.wait_for_timeout(1500)
    r=await pg.evaluate("""(()=>{window.__manual=1;human.human=false;let tu=0,tp=0,tv=0,ts=0,tr=0,n=0;const _vp=vrmPost;vrmPost=(R,dt)=>{const a=performance.now();_vp(R,dt);tv+=performance.now()-a;};
      const _rt=retarget;retarget=R=>{const a=performance.now();_rt(R);tr+=performance.now()-a;};
      for(let f=0;f<600;f++){let a=performance.now();snap();update(1/60);tu+=performance.now()-a;a=performance.now();players.forEach((p,i)=>rigs[i]&&poseRig(p,rigs[i],1/60));tp+=performance.now()-a;n++;}
      return {update:(tu/n).toFixed(3),poseRigAll:(tp/n).toFixed(3),retarget:(tr/n).toFixed(3),vrmPost:(tv/n).toFixed(3),springs:rigs.map(R=>R&&R.glb&&R.glb.vx?R.glb.vx.springs.length:0)};})()""")
    print(json.dumps(r));await b.close()
asyncio.run(main())
