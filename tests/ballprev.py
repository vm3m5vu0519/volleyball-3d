import asyncio,base64
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':900,'height':300});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1');await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    u=await pg.evaluate("""(()=>{const c=document.createElement('canvas');c.width=900;c.height=300;const r=new THREE.WebGLRenderer({canvas:c,antialias:true});const sc=new THREE.Scene();sc.background=new THREE.Color('#d8c8b0');
      sc.add(new THREE.HemisphereLight('#fff','#887',.8));const d=new THREE.DirectionalLight('#fff',.7);d.position.set(2,3,4);sc.add(d);
      const cm=new THREE.PerspectiveCamera(30,3,.01,10);cm.position.set(0,0,1.6);
      [[0,0],[.7,.4],[1.6,1.1]].forEach(([a,b],i)=>{const m=ballMesh.clone();m.visible=true;m.scale.setScalar(1);m.position.set((i-1)*.42,0,0);m.rotation.set(a,b,0);sc.add(m);});
      r.render(sc,cm);return c.toDataURL('image/png');})()""")
    open('ballprev.png','wb').write(base64.b64decode(u.split(',')[1]));print(errs);await b.close()
asyncio.run(main())
