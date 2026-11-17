import asyncio,json
from playwright.async_api import async_playwright
SP='/tmp/claude-0/-home-claude/2a2c0e0f-d504-5de7-9431-1b0e4f342f27/scratchpad/'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':1280,'height':900});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.add_init_script('window.__skinOnlyUsed=1')
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(3000)
    await pg.click('#mStart');await pg.wait_for_timeout(500)
    await pg.evaluate("stageProg=6;MATCH.mode='stage';MATCH.stage=0;renderMode()");await pg.wait_for_timeout(300)
    el=await pg.query_selector('#pStages');await el.screenshot(path=SP+'stages.png')
    out={}
    for st in range(6):
      r=await pg.evaluate(f"(()=>{{MATCH.mode='stage';MATCH.stage={st};newGame();window.__manual=1;const n=t=>players.filter(p=>p.team===t&&p.ace).length;return [n(ME),n(1-ME),players.filter(p=>p.team!==ME).map(p=>p.eq+':'+Object.values(p.tree).reduce((a,b)=>a+b,0)).join(' ')];}})()")
      out[st+1]=r
    print(json.dumps(out,ensure_ascii=False));print(errs);await b.close()
asyncio.run(main())
