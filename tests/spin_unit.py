import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader']);pg=await b.new_page()
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    print(await pg.evaluate("""()=>{newGame();const res={};for(const [s,t] of [[0,0],[1,0],[-1,0],[0,.35],[0,1],[.5,.5]]){
      ball.x=-1;ball.y=3.2;ball.z=0;ball.spS=0;ball.spT=0;driveTo(7,0,24);ball.spS=s;ball.spT=t;PC={};const L=predict(0);
      res[s+'/'+t]=[+L.x.toFixed(2),+L.z.toFixed(2),+L.t.toFixed(2)];}return JSON.stringify(res);}"""))
    await b.close()
asyncio.run(main())
