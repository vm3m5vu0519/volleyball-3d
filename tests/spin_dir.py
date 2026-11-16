import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader']);pg=await b.new_page()
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    # team0 attacks toward +x: attacker's right = +z ; team1 attacks toward -x: right = -z
    print(await pg.evaluate("""()=>{newGame();const o={};for(const t of [0,1]){const so=sd(1-t);ball.x=-so*1;ball.y=3.2;ball.z=0;ball.spS=0;ball.spT=0;driveTo(so*7,0,24);ball.spS=1;ball.spT=0;PC={};o['team'+t]=+predict(0).z.toFixed(2);}return JSON.stringify(o);}"""))
    await b.close()
asyncio.run(main())
