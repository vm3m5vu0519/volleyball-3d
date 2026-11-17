import asyncio
from playwright.async_api import async_playwright
SP='/tmp/claude-0/-home-claude/2a2c0e0f-d504-5de7-9431-1b0e4f342f27/scratchpad/'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':800,'height':450});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(3000)
    await pg.click('#mStart');await pg.click('#pGo');await pg.wait_for_timeout(800)
    await pg.evaluate("human.human=false;humanAir=()=>0;")
    for i in range(110):
      st=await pg.evaluate("JSON.stringify({s:state,tch:ball&&ball.touches,lt:ball&&ball.lastTeam,atk:ball&&ball.atk,sv:ball&&ball.serve,rv:ribbon.visible,ro:+ribbon.material.opacity.toFixed(2),gh:FX2.ghosts.map(g=>g.visible?1:0).join(''),tl:ball&&ball.trail.length,v:ball&&+Math.hypot(ball.vx,ball.vy,ball.vz).toFixed(1)})")
      print(i,st,flush=True)
      if False: await pg.screenshot(path=SP+f'q{i:02d}.png')
      await pg.wait_for_timeout(100)
    print('errs',errs);await b.close()
asyncio.run(main())
