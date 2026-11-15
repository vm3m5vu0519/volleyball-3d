import asyncio,json,sys
from playwright.async_api import async_playwright
DIFFS=sys.argv[1].split(',');WIN=int(sys.argv[2]) if len(sys.argv)>2 else 25
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=swiftshader']);pg=await b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
    await pg.goto('http://localhost:8765/test.html');await pg.wait_for_timeout(2500)
    for df in DIFFS:
      await pg.evaluate(f"()=>{{S.diff='{df}';S.win={WIN};MATCH.mode='free';prep.role='oh';newGame();window.__manual=1;human.human=false;humanAir=()=>0;window.__K={{act:{{}},use:{{}},pts:0}};}}")
      await pg.evaluate("""()=>{if(window.__w)return;window.__w=1;const oa=skActivate;skActivate=function(p){const r=oa.apply(this,arguments);if(r){const k=(p.team===ME?'me_':'op_')+p.role;__K.act[k]=(__K.act[k]||0)+1;}return r;};
        const ot=skTake;skTake=function(p,k){const r=ot.apply(this,arguments);if(r){__K.use[r]=(__K.use[r]||0)+1;}return r;};}""")
      for i in range(400):
        st=await pg.evaluate("()=>{for(let f=0;f<600;f++){if(state==='over')return 1;if(hitstop>0){hitstop-=1/60;continue;}snap();update(1/60);}return 0}")
        if st:break
      r=await pg.evaluate("()=>({score:score.slice(),ME,K:__K,t:Math.round(time)})")
      print(df,json.dumps(r,ensure_ascii=False),flush=True)
    print('errs',errs[:3]);await b.close()
asyncio.run(main())
