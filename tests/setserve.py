import asyncio,json
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':640,'height':360});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1')
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(3000)
    await pg.click('#mStart');await pg.evaluate("prep.role='set';savePrep();setTimeout(()=>$('pGo').click())");await pg.wait_for_timeout(4000)
    r=await pg.evaluate("""(()=>{window.__manual=1;human.human=false;humanAir=()=>0;const log=[];let lastS=null,stuck=0;
      for(let i=0;i<60*240;i++){update(1/60);if(state==='serve'){if(server!==lastS){lastS=server;log.push(COL[server.team].name+':'+server.role+(server===human?'(你)':'')+' sc'+score.join(':'));}stuck++;}else stuck=0;if(stuck>60*12){log.push('卡住 '+server.role);break;}if(state==='over')break;}
      return log;})()""")
    print('\n'.join(r[:40]));print(errs);await b.close()
asyncio.run(main())
