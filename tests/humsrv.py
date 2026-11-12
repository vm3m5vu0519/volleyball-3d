import asyncio,json
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':960,'height':540});errs=[];logs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)[:400]))
    pg.on('console',lambda m:m.type in('error','warning') and logs.append(m.text[:200]))
    await pg.add_init_script('window.__skinOnlyUsed=1');await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(3000)
    await pg.click('#mStart');await pg.click('#pGo');await pg.wait_for_timeout(1500)
    # 讓玩家這隊發球
    await pg.evaluate("setupServe(ME)")
    await pg.wait_for_timeout(800)
    s=lambda: pg.evaluate("JSON.stringify({bx:ball&&+ball.x.toFixed(2),state,server:server&&server.name,human:human.name,isH:server===human,toss:ball.toss,held:!!ball.held,by:+ball.y.toFixed(2),stT:+stT.toFixed(2)})")
    print('before',await s())
    await pg.mouse.click(480,270);await pg.wait_for_timeout(400)
    print('after click1',await s())
    await pg.mouse.click(480,270);await pg.wait_for_timeout(300)
    print('after click2',await s())
    for i in range(10):
      await pg.wait_for_timeout(120);print(await s())
    await pg.mouse.click(480,270);await pg.wait_for_timeout(500);print('after click3',await s())
    print('errs',errs);print('logs',logs[:8]);await b.close()
asyncio.run(main())
