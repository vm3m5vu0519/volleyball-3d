import asyncio,json
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader']);pg=await b.new_page()
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    await pg.evaluate("""()=>{S.win=15;newGame();window.__manual=1;human.human=false;humanAir=()=>0;window.__L=[];
      const oc=crossNet;crossNet=function(px,py,pz){if(ball.atk){const f=(0-px)/(ball.x-px),yc=py+(ball.y-py)*f,zc=pz+(ball.z-pz)*f,atkT=px<0?0:1;
        const bl=team(1-atkT).filter(b=>Math.abs(b.x)<1.5).map(b=>({z:+b.z.toFixed(2),y:+b.y.toFixed(2),vy:+b.vy.toFixed(1),x:+b.x.toFixed(2),ja:b.jumpAt>0}));
        const R=blockRects(1-atkT).map(r=>({cz:+r.cz.toFixed(2),hw:+r.hw.toFixed(2),top:+r.top.toFixed(2)}));__L.push({yc:+yc.toFixed(2),zc:+zc.toFixed(2),bl,R});}return oc.apply(this,arguments);};}""")
    await pg.evaluate("()=>{for(let f=0;f<60*200;f++){if(state==='over')break;if(hitstop>0){hitstop-=1/60;continue;}snap();update(1/60);}}")
    L=await pg.evaluate("__L")
    for x in L[:25]:print(json.dumps(x))
    print(len(L))
    await b.close()
asyncio.run(main())
