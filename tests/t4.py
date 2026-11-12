import asyncio,json,sys
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':640,'height':360})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    await pg.evaluate("prep.role='oh';savePrep()");await pg.click('#mStart');await pg.click('#pGo');await pg.wait_for_timeout(300)
    r=await pg.evaluate(open(__import__('os').path.join(__import__('os').path.dirname(__file__),'scen4.js')).read())
    print('PROF',json.dumps(r['prof']));print('BLOCK',r['blockCycle'])
    d=r['dive'];print('DIVE ok',sum(1 for x in d if x[3]!='MISS'),'/',len(d))
    for x in d:print(' ',x)
    for x in r['serve']:print('SRV',x)
    print('ERR',errs[:5]);await b.close()
asyncio.run(main())
