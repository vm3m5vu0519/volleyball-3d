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
    await pg.click('#mStart');await pg.click('#pGo');await pg.wait_for_timeout(500)
    r=await pg.evaluate("""(()=>{window.__manual=1;human.human=false;for(let i=0;i<60;i++){snap();update(1/60);players.forEach((p,j)=>rigs[j]&&poseRig(p,rigs[j],1/60));}
      const out=[];players.slice(0,8).forEach((p,j)=>{const R=rigs[j];if(!R.glb)return;const B=R.glb.B;R.g.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(R.g.matrixWorld).invert();
        const f=n=>{const v=new THREE.Vector3();B[n].getWorldPosition(v);v.applyMatrix4(inv);return [+v.x.toFixed(3),+v.y.toFixed(3),+v.z.toFixed(3)];};
        const q=n=>{const v=new THREE.Vector3();n.getWorldPosition(v);v.applyMatrix4(inv);return [+v.x.toFixed(3),+v.y.toFixed(3),+v.z.toFixed(3)];};
        out.push({skin:R.skin||j,state,LUp:f('LeftUpLeg'),LKnee:f('LeftLeg'),LFoot:f('LeftFoot'),RUp:f('RightUpLeg'),RKnee:f('RightLeg'),RFoot:f('RightFoot'),pL:[q(R.legs[0].th),q(R.legs[0].kn),q(R.legs[0].ft)]});});return out;})()""")
    for x in r: print(json.dumps(x))
    await b.close()
asyncio.run(main())
